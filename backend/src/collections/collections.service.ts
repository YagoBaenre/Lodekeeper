import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Collectible,
  CollectibleType,
  CharacterCollectible,
  Achievement,
  CharacterAchievement,
} from '../database/entities';

@Injectable()
export class CollectionsService {
  constructor(
    @InjectRepository(Collectible)
    private readonly collectibleRepo: Repository<Collectible>,
    @InjectRepository(CharacterCollectible)
    private readonly charCollectibleRepo: Repository<CharacterCollectible>,
    @InjectRepository(Achievement)
    private readonly achievementRepo: Repository<Achievement>,
    @InjectRepository(CharacterAchievement)
    private readonly charAchievementRepo: Repository<CharacterAchievement>,
  ) {}

  async findAllCollectibles(type?: CollectibleType): Promise<Collectible[]> {
    const where = type ? { type } : {};
    return this.collectibleRepo.find({ where, order: { name: 'ASC' } });
  }

  async findCollectibleById(id: number): Promise<Collectible> {
    const collectible = await this.collectibleRepo.findOne({ where: { id } });
    if (!collectible) throw new NotFoundException('Collectible not found');
    return collectible;
  }

  async getCharacterCollection(characterId: number, type?: CollectibleType) {
    const allCollectibles = await this.findAllCollectibles(type);
    const owned = await this.charCollectibleRepo.find({
      where: { characterId },
      relations: ['collectible'],
    });

    const ownedIds = new Set(owned.map((o) => o.collectibleId));
    const missing = allCollectibles.filter((c) => !ownedIds.has(c.id));

    return {
      total: allCollectibles.length,
      owned: owned.length,
      percentage: allCollectibles.length > 0
        ? Math.round((owned.length / allCollectibles.length) * 100)
        : 0,
      missing,
      ownedItems: owned,
    };
  }

  async getCharacterAchievements(characterId: number) {
    const allAchievements = await this.achievementRepo.find({ order: { name: 'ASC' } });
    const obtained = await this.charAchievementRepo.find({
      where: { characterId },
      relations: ['achievement'],
    });

    const obtainedIds = new Set(obtained.map((o) => o.achievementId));
    const missing = allAchievements.filter((a) => !obtainedIds.has(a.id));

    return {
      total: allAchievements.length,
      obtained: obtained.length,
      percentage: allAchievements.length > 0
        ? Math.round((obtained.length / allAchievements.length) * 100)
        : 0,
      missing,
      obtainedItems: obtained,
    };
  }

  async syncCharacterCollectibles(
    characterId: number,
    collectibleIds: number[],
  ): Promise<void> {
    const existing = await this.charCollectibleRepo.find({ where: { characterId } });
    const existingIds = new Set(existing.map((e) => e.collectibleId));

    const newEntries = collectibleIds
      .filter((id) => !existingIds.has(id))
      .map((collectibleId) =>
        this.charCollectibleRepo.create({ characterId, collectibleId, obtainedAt: new Date() }),
      );

    if (newEntries.length > 0) {
      await this.charCollectibleRepo.save(newEntries);
    }
  }

  async syncCharacterAchievements(
    characterId: number,
    achievementIds: number[],
  ): Promise<void> {
    const existing = await this.charAchievementRepo.find({ where: { characterId } });
    const existingIds = new Set(existing.map((e) => e.achievementId));

    const newEntries = achievementIds
      .filter((id) => !existingIds.has(id))
      .map((achievementId) =>
        this.charAchievementRepo.create({ characterId, achievementId, obtainedAt: new Date() }),
      );

    if (newEntries.length > 0) {
      await this.charAchievementRepo.save(newEntries);
    }
  }

  async upsertCollectible(data: Partial<Collectible>): Promise<Collectible> {
    const existing = await this.collectibleRepo.findOne({
      where: { xivapiId: data.xivapiId, type: data.type },
    });
    if (existing) {
      Object.assign(existing, data);
      return this.collectibleRepo.save(existing);
    }
    return this.collectibleRepo.save(this.collectibleRepo.create(data));
  }

  async upsertAchievement(data: Partial<Achievement>): Promise<Achievement> {
    const existing = await this.achievementRepo.findOne({
      where: { xivapiId: data.xivapiId },
    });
    if (existing) {
      Object.assign(existing, data);
      return this.achievementRepo.save(existing);
    }
    return this.achievementRepo.save(this.achievementRepo.create(data));
  }
}
