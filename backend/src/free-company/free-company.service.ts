import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  FreeCompany,
  Character,
  CharacterCollectible,
  Collectible,
} from '../database/entities';

@Injectable()
export class FreeCompanyService {
  constructor(
    @InjectRepository(FreeCompany)
    private readonly fcRepo: Repository<FreeCompany>,
    @InjectRepository(Character)
    private readonly characterRepo: Repository<Character>,
    @InjectRepository(CharacterCollectible)
    private readonly charCollectibleRepo: Repository<CharacterCollectible>,
    @InjectRepository(Collectible)
    private readonly collectibleRepo: Repository<Collectible>,
  ) {}

  async findById(id: number): Promise<FreeCompany> {
    const fc = await this.fcRepo.findOne({ where: { id } });
    if (!fc) throw new NotFoundException('Free Company not found');
    return fc;
  }

  async getMembers(fcId: number): Promise<Character[]> {
    return this.characterRepo.find({
      where: { freeCompanyId: fcId },
      order: { name: 'ASC' },
    });
  }

  async getLeaderboard(fcId: number) {
    const members = await this.characterRepo.find({
      where: { freeCompanyId: fcId },
    });

    const leaderboard = await Promise.all(
      members.map(async (member) => {
        const collectibleCount = await this.charCollectibleRepo.count({
          where: { characterId: member.id },
        });
        return {
          characterId: member.id,
          characterName: member.name,
          portrait: member.portrait,
          totalCollectibles: collectibleCount,
        };
      }),
    );

    return leaderboard
      .sort((a, b) => b.totalCollectibles - a.totalCollectibles)
      .map((entry, index) => ({ ...entry, rank: index + 1 }));
  }

  async getAlmostThere(fcId: number) {
    const members = await this.characterRepo.find({
      where: { freeCompanyId: fcId },
    });
    const totalMembers = members.length;
    if (totalMembers === 0) return [];

    const memberIds = members.map((m) => m.id);

    const collectibles = await this.collectibleRepo.find();
    const results = await Promise.all(
      collectibles.map(async (collectible) => {
        const ownedByCount = await this.charCollectibleRepo
          .createQueryBuilder('cc')
          .where('cc.collectibleId = :collectibleId', { collectibleId: collectible.id })
          .andWhere('cc.characterId IN (:...memberIds)', { memberIds })
          .getCount();

        const percentage = Math.round((ownedByCount / totalMembers) * 100);

        return {
          collectible: {
            id: collectible.id,
            name: collectible.name,
            icon: collectible.icon,
            type: collectible.type,
          },
          ownedByCount,
          totalMembers,
          percentage,
        };
      }),
    );

    return results
      .filter((r) => r.percentage >= 50 && r.percentage < 100)
      .sort((a, b) => b.percentage - a.percentage);
  }

  async upsertFromLodestone(data: Partial<FreeCompany>): Promise<FreeCompany> {
    const existing = await this.fcRepo.findOne({
      where: { lodestoneId: data.lodestoneId },
    });
    if (existing) {
      Object.assign(existing, data);
      return this.fcRepo.save(existing);
    }
    return this.fcRepo.save(this.fcRepo.create(data));
  }
}
