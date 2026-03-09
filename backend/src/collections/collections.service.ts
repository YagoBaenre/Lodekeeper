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

  async findAllCollectibles(type?: CollectibleType, search?: string): Promise<Collectible[]> {
    const qb = this.collectibleRepo.createQueryBuilder('c').orderBy('c.name', 'ASC');
    if (type) qb.andWhere('c.type = :type', { type });
    if (search) qb.andWhere('LOWER(c.name) LIKE LOWER(:search)', { search: `%${search}%` });
    return qb.getMany();
  }

  async findCollectibleById(id: number): Promise<Collectible> {
    const collectible = await this.collectibleRepo.findOne({ where: { id } });
    if (!collectible) throw new NotFoundException('Collectible not found');
    return collectible;
  }

  async toggleCharacterCollectible(characterId: number, collectibleId: number): Promise<{ owned: boolean }> {
    const existing = await this.charCollectibleRepo.findOne({
      where: { characterId, collectibleId },
    });
    if (existing) {
      await this.charCollectibleRepo.remove(existing);
      return { owned: false };
    }
    await this.charCollectibleRepo.save(
      this.charCollectibleRepo.create({ characterId, collectibleId, obtainedAt: new Date() }),
    );
    return { owned: true };
  }

  async getCharacterCollection(characterId: number, type?: CollectibleType, search?: string) {
    const allCollectibles = await this.findAllCollectibles(type, search);
    const ownedQuery = this.charCollectibleRepo
      .createQueryBuilder('cc')
      .innerJoinAndSelect('cc.collectible', 'c')
      .where('cc.characterId = :characterId', { characterId });
    if (type) ownedQuery.andWhere('c.type = :type', { type });
    const owned = await ownedQuery.getMany();

    const ownedIds = new Set(owned.map((o) => o.collectibleId));
    const missing = allCollectibles.filter((c) => !ownedIds.has(c.id));

    const total = type
      ? (await this.collectibleRepo.count({ where: { type } }))
      : allCollectibles.length;

    return {
      total,
      owned: owned.length,
      percentage: total > 0 ? Math.round((owned.length / total) * 100) : 0,
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

  /**
   * Bulk upsert collectibles — much faster than one-by-one.
   * Uses externalId + type as the unique key for upsert.
   */
  async bulkUpsertCollectibles(items: Partial<Collectible>[]): Promise<void> {
    if (items.length === 0) return;

    // Process in chunks to avoid overwhelming the DB
    const chunkSize = 200;
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      await this.collectibleRepo
        .createQueryBuilder()
        .insert()
        .into(Collectible)
        .values(chunk)
        .orUpdate(
          [
            'name', 'icon', 'image', 'description', 'enhanced_description',
            'tooltip', 'patch', 'owned', 'tradeable', 'sources', 'movement',
            'seats', 'command', 'female_name', 'category', 'item_id', 'order',
          ],
          ['externalId', 'type'],
        )
        .execute();
    }
  }

  /**
   * Bulk upsert achievements — much faster than one-by-one.
   * Uses externalId as the unique key for upsert.
   */
  async bulkUpsertAchievements(items: Partial<Achievement>[]): Promise<void> {
    if (items.length === 0) return;

    const chunkSize = 200;
    for (let i = 0; i < items.length; i += chunkSize) {
      const chunk = items.slice(i, i + chunkSize);
      await this.achievementRepo
        .createQueryBuilder()
        .insert()
        .into(Achievement)
        .values(chunk)
        .orUpdate(
          ['name', 'description', 'points', 'icon', 'patch', 'owned', 'order', 'category', 'type_name'],
          ['externalId'],
        )
        .execute();
    }
  }

  /** @deprecated Use bulkUpsertCollectibles instead */
  async upsertCollectible(data: Partial<Collectible>): Promise<Collectible> {
    const existing = await this.collectibleRepo.findOne({
      where: { externalId: data.externalId, type: data.type },
    });
    if (existing) {
      Object.assign(existing, data);
      return this.collectibleRepo.save(existing);
    }
    return this.collectibleRepo.save(this.collectibleRepo.create(data));
  }

  /** @deprecated Use bulkUpsertAchievements instead */
  async upsertAchievement(data: Partial<Achievement>): Promise<Achievement> {
    const existing = await this.achievementRepo.findOne({
      where: { externalId: data.externalId },
    });
    if (existing) {
      Object.assign(existing, data);
      return this.achievementRepo.save(existing);
    }
    return this.achievementRepo.save(this.achievementRepo.create(data));
  }
}
