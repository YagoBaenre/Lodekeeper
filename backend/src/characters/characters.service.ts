import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomBytes } from 'crypto';
import { Character, Collectible, CollectibleType } from '../database/entities';
import { LodestoneService } from '../lodestone/lodestone.service';
import { FreeCompanyService } from '../free-company/free-company.service';
import { CollectionsService } from '../collections/collections.service';
import { LinkCharacterDto } from './dto/link-character.dto';

@Injectable()
export class CharactersService {
  private readonly logger = new Logger(CharactersService.name);

  constructor(
    @InjectRepository(Character)
    private readonly characterRepository: Repository<Character>,
    private readonly lodestoneService: LodestoneService,
    private readonly freeCompanyService: FreeCompanyService,
    private readonly collectionsService: CollectionsService,
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
    await this.characterRepository.save(character);

    // Sync collections after verification
    await this.syncCharacterCollections(character.id, character.lodestoneId);

    return this.findById(character.id);
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

    await this.characterRepository.save(character);

    // Sync collections from Lodestone
    await this.syncCharacterCollections(character.id, character.lodestoneId);

    return this.findById(character.id);
  }

  /**
   * Scrape the character's Lodestone mount/minion pages and sync with our DB.
   * Matches by name (case-insensitive) against known collectibles.
   */
  async syncCharacterCollections(characterId: number, lodestoneId: string): Promise<void> {
    this.logger.log(`Syncing collections for character ${characterId} (Lodestone: ${lodestoneId})`);

    try {
      // Fetch mounts and minions from Lodestone in parallel
      const [mountNames, minionNames] = await Promise.all([
        this.lodestoneService.fetchCharacterMounts(lodestoneId),
        this.lodestoneService.fetchCharacterMinions(lodestoneId),
      ]);

      // Match names against our DB collectibles
      const mountIds = await this.matchCollectibleNames(mountNames, CollectibleType.MOUNT);
      const minionIds = await this.matchCollectibleNames(minionNames, CollectibleType.MINION);

      const allIds = [...mountIds, ...minionIds];

      if (allIds.length > 0) {
        await this.collectionsService.syncCharacterCollectibles(characterId, allIds);
        this.logger.log(
          `Synced ${mountIds.length} mounts and ${minionIds.length} minions for character ${characterId}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to sync collections for character ${characterId}`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  /**
   * Match an array of collectible names against the DB.
   * Returns the internal IDs of matching collectibles.
   */
  private async matchCollectibleNames(names: string[], type: CollectibleType): Promise<number[]> {
    if (names.length === 0) return [];

    const allCollectibles = await this.collectionsService.findAllCollectibles(type);

    // Build a case-insensitive name map
    const nameMap = new Map<string, Collectible>();
    for (const c of allCollectibles) {
      nameMap.set(c.name.toLowerCase(), c);
    }

    const matchedIds: number[] = [];
    for (const name of names) {
      const match = nameMap.get(name.toLowerCase());
      if (match) {
        matchedIds.push(match.id);
      } else {
        this.logger.warn(`No match found for ${type}: "${name}"`);
      }
    }

    return matchedIds;
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
