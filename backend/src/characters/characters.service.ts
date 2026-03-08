import {
  ConflictException,
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { Character } from '../database/entities';
import { LodestoneService } from '../lodestone/lodestone.service';
import { FreeCompanyService } from '../free-company/free-company.service';
import { LinkCharacterDto } from './dto/link-character.dto';

@Injectable()
export class CharactersService {
  constructor(
    @InjectRepository(Character)
    private readonly characterRepository: Repository<Character>,
    private readonly lodestoneService: LodestoneService,
    private readonly freeCompanyService: FreeCompanyService,
  ) {}

  async link(userId: number, dto: LinkCharacterDto): Promise<Character> {
    const existing = await this.characterRepository.findOne({
      where: { lodestoneId: dto.lodestoneId },
    });
    if (existing) {
      throw new ConflictException('Character already linked');
    }

    const lodestoneData = await this.lodestoneService.fetchCharacter(dto.lodestoneId);
    const verificationCode = `LK-${randomBytes(4).toString('hex')}`;

    let freeCompanyId: number | undefined;
    if (lodestoneData.freeCompany) {
      const fc = await this.linkFreeCompany(lodestoneData.freeCompany.lodestoneId);
      freeCompanyId = fc.id;
    }

    const character = this.characterRepository.create({
      lodestoneId: dto.lodestoneId,
      name: lodestoneData.name,
      server: lodestoneData.server,
      dataCenter: lodestoneData.dataCenter,
      portrait: lodestoneData.portrait,
      title: lodestoneData.title,
      verificationCode,
      userId,
      freeCompanyId,
    });

    const saved = await this.characterRepository.save(character);
    return this.findById(saved.id);
  }

  async verify(characterId: number, userId: number): Promise<Character> {
    const character = await this.characterRepository.findOne({
      where: { id: characterId, userId },
    });
    if (!character) {
      throw new NotFoundException('Character not found');
    }

    const lodestoneData = await this.lodestoneService.fetchCharacter(character.lodestoneId);
    const bioContainsCode = lodestoneData.bio?.includes(character.verificationCode!);

    if (!bioContainsCode) {
      throw new BadRequestException(
        `Verification code "${character.verificationCode}" not found in Lodestone bio`,
      );
    }

    character.verified = true;
    character.verificationCode = null;
    return this.characterRepository.save(character);
  }

  async findByUser(userId: number): Promise<Character[]> {
    return this.characterRepository.find({
      where: { userId },
      relations: ['freeCompany'],
    });
  }

  async findById(id: number): Promise<Character> {
    const character = await this.characterRepository.findOne({
      where: { id },
      relations: ['freeCompany'],
    });
    if (!character) {
      throw new NotFoundException('Character not found');
    }
    return character;
  }

  async findByFreeCompany(freeCompanyId: number): Promise<Character[]> {
    return this.characterRepository.find({ where: { freeCompanyId } });
  }

  async refreshFromLodestone(characterId: number): Promise<Character> {
    const character = await this.findById(characterId);
    const lodestoneData = await this.lodestoneService.fetchCharacter(character.lodestoneId);

    character.name = lodestoneData.name;
    character.server = lodestoneData.server;
    character.dataCenter = lodestoneData.dataCenter;
    character.portrait = lodestoneData.portrait;
    character.title = lodestoneData.title ?? character.title;
    character.lastScrapedAt = new Date();

    if (lodestoneData.freeCompany && !character.freeCompanyId) {
      const fc = await this.linkFreeCompany(lodestoneData.freeCompany.lodestoneId);
      character.freeCompanyId = fc.id;
    }

    return this.characterRepository.save(character);
  }

  private async linkFreeCompany(lodestoneFcId: string) {
    const fcData = await this.lodestoneService.fetchFreeCompany(lodestoneFcId);
    return this.freeCompanyService.upsertFromLodestone({
      lodestoneId: fcData.lodestoneId,
      name: fcData.name,
      server: fcData.server,
      tag: fcData.tag,
      memberCount: fcData.memberCount,
      slogan: fcData.slogan,
      crest: fcData.crest,
      lastScrapedAt: new Date(),
    });
  }
}
