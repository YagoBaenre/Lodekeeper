import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { CollectionsService } from '../collections/collections.service';
import { CollectibleType } from '../database/entities';
import type { CollectibleSourceEntry } from '../database/entities';

/**
 * Response shape from FFXIV Collect API (e.g. /api/mounts, /api/minions, etc.)
 */
interface FFXIVCollectResponse<T> {
  query: Record<string, unknown>;
  count: number;
  results: T[];
}

interface FFXIVCollectMount {
  id: number;
  name: string;
  description: string;
  enhanced_description: string;
  tooltip: string;
  movement: string;
  seats: number;
  order: number;
  patch: string;
  item_id: number;
  tradeable: boolean;
  owned: string;
  image: string;
  icon: string;
  sources: CollectibleSourceEntry[];
}

interface FFXIVCollectMinion {
  id: number;
  name: string;
  description: string;
  enhanced_description: string;
  tooltip: string;
  patch: string;
  item_id: number;
  tradeable: boolean;
  owned: string;
  image: string;
  icon: string;
  behavior: { id: number; name: string };
  race: { id: number; name: string };
  sources: CollectibleSourceEntry[];
}

interface FFXIVCollectEmote {
  id: number;
  name: string;
  command: string;
  order: number;
  patch: string;
  item_id: number;
  tradeable: boolean;
  owned: string;
  icon: string;
  category: { id: number; name: string };
  sources: CollectibleSourceEntry[];
}

interface FFXIVCollectTitle {
  id: number;
  name: string;
  female_name: string;
  order: number;
  patch: string;
  owned: string;
  icon: string;
  achievement?: {
    id: number;
    name: string;
    description: string;
    points: number;
  };
}

interface FFXIVCollectHairstyle {
  id: number;
  name: string;
  description: string;
  patch: string;
  item_id: number;
  tradeable: boolean;
  owned: string;
  icon: string;
  sources: CollectibleSourceEntry[];
}

interface FFXIVCollectOrchestrion {
  id: number;
  name: string;
  description: string;
  patch: string;
  item_id: number;
  tradeable: boolean;
  owned: string;
  number: string;
  icon: string;
  category: { id: number; name: string };
  sources: CollectibleSourceEntry[];
}

interface FFXIVCollectAchievement {
  id: number;
  name: string;
  description: string;
  points: number;
  order: number;
  patch: string;
  owned: string;
  icon: string;
  category: { id: number; name: string };
  type: { id: number; name: string };
}

@Injectable()
export class XivapiService implements OnApplicationBootstrap {
  private readonly logger = new Logger(XivapiService.name);
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly collectionsService: CollectionsService,
  ) {
    this.baseUrl =
      this.configService.get<string>('FFXIV_COLLECT_BASE_URL') ??
      'https://ffxivcollect.com';
  }

  async onApplicationBootstrap() {
    try {
      const emotes = await this.collectionsService.findAllCollectibles(CollectibleType.EMOTE);
      if (emotes.length === 0) {
        this.logger.log('No emotes found in DB — auto-syncing all data from FFXIV Collect...');
        await this.syncAll();
      }
    } catch (error) {
      this.logger.error('Auto-sync on startup failed', (error as Error).message);
    }
  }

  /**
   * Fetch all results from an FFXIV Collect API endpoint in a single request.
   * No pagination needed — the API returns everything at once.
   */
  private async fetchAll<T>(endpoint: string): Promise<T[]> {
    const url = `${this.baseUrl}/api/${endpoint}`;
    this.logger.log(`Fetching from FFXIV Collect: ${url}`);

    const { data } = await firstValueFrom(
      this.httpService.get<FFXIVCollectResponse<T>>(url),
    );

    this.logger.log(`Received ${data.count} results from ${endpoint}`);
    return data.results;
  }

  async syncMounts(): Promise<number> {
    this.logger.log('Syncing mounts from FFXIV Collect...');
    const results = await this.fetchAll<FFXIVCollectMount>('mounts');
    let count = 0;

    const batch = results
      .filter((m) => m.name)
      .map((m) => ({
        externalId: m.id,
        type: CollectibleType.MOUNT,
        name: m.name,
        icon: m.icon ?? undefined,
        image: m.image ?? undefined,
        description: m.description ?? undefined,
        enhanced_description: m.enhanced_description ?? undefined,
        tooltip: m.tooltip ?? undefined,
        patch: m.patch ?? undefined,
        owned: m.owned ?? undefined,
        tradeable: m.tradeable ?? false,
        movement: m.movement ?? undefined,
        seats: m.seats ?? undefined,
        item_id: m.item_id ?? undefined,
        order: m.order ?? 0,
        sources: m.sources ?? [],
      }));

    await this.collectionsService.bulkUpsertCollectibles(batch);
    count = batch.length;

    this.logger.log(`Synced ${count} mounts`);
    return count;
  }

  async syncMinions(): Promise<number> {
    this.logger.log('Syncing minions from FFXIV Collect...');
    const results = await this.fetchAll<FFXIVCollectMinion>('minions');

    const batch = results
      .filter((m) => m.name)
      .map((m) => ({
        externalId: m.id,
        type: CollectibleType.MINION,
        name: m.name,
        icon: m.icon ?? undefined,
        image: m.image ?? undefined,
        description: m.description ?? undefined,
        enhanced_description: m.enhanced_description ?? undefined,
        tooltip: m.tooltip ?? undefined,
        patch: m.patch ?? undefined,
        owned: m.owned ?? undefined,
        tradeable: m.tradeable ?? false,
        item_id: m.item_id ?? undefined,
        sources: m.sources ?? [],
      }));

    await this.collectionsService.bulkUpsertCollectibles(batch);
    this.logger.log(`Synced ${batch.length} minions`);
    return batch.length;
  }

  async syncEmotes(): Promise<number> {
    this.logger.log('Syncing emotes from FFXIV Collect...');
    const results = await this.fetchAll<FFXIVCollectEmote>('emotes');

    const batch = results
      .filter((e) => e.name)
      .map((e) => ({
        externalId: e.id,
        type: CollectibleType.EMOTE,
        name: e.name,
        icon: e.icon ?? undefined,
        command: e.command ?? undefined,
        patch: e.patch ?? undefined,
        owned: e.owned ?? undefined,
        tradeable: e.tradeable ?? false,
        item_id: e.item_id ?? undefined,
        order: e.order ?? 0,
        category: e.category?.name ?? undefined,
        sources: e.sources ?? [],
      }));

    await this.collectionsService.bulkUpsertCollectibles(batch);
    this.logger.log(`Synced ${batch.length} emotes`);
    return batch.length;
  }

  async syncTitles(): Promise<number> {
    this.logger.log('Syncing titles from FFXIV Collect...');
    const results = await this.fetchAll<FFXIVCollectTitle>('titles');

    const batch = results
      .filter((t) => t.name)
      .map((t) => ({
        externalId: t.id,
        type: CollectibleType.TITLE,
        name: t.name,
        female_name: t.female_name ?? undefined,
        icon: t.icon ?? undefined,
        patch: t.patch ?? undefined,
        owned: t.owned ?? undefined,
        order: t.order ?? 0,
      }));

    await this.collectionsService.bulkUpsertCollectibles(batch);
    this.logger.log(`Synced ${batch.length} titles`);
    return batch.length;
  }

  async syncHairstyles(): Promise<number> {
    this.logger.log('Syncing hairstyles from FFXIV Collect...');
    const results = await this.fetchAll<FFXIVCollectHairstyle>('hairstyles');

    const batch = results
      .filter((h) => h.name)
      .map((h) => ({
        externalId: h.id,
        type: CollectibleType.HAIRSTYLE,
        name: h.name,
        icon: h.icon ?? undefined,
        description: h.description ?? undefined,
        patch: h.patch ?? undefined,
        owned: h.owned ?? undefined,
        tradeable: h.tradeable ?? false,
        item_id: h.item_id ?? undefined,
        sources: h.sources ?? [],
      }));

    await this.collectionsService.bulkUpsertCollectibles(batch);
    this.logger.log(`Synced ${batch.length} hairstyles`);
    return batch.length;
  }

  async syncOrchestrions(): Promise<number> {
    this.logger.log('Syncing orchestrion rolls from FFXIV Collect...');
    const results = await this.fetchAll<FFXIVCollectOrchestrion>('orchestrions');

    const batch = results
      .filter((o) => o.name)
      .map((o) => ({
        externalId: o.id,
        type: CollectibleType.ORCHESTRION,
        name: o.name,
        icon: o.icon ?? undefined,
        description: o.description ?? undefined,
        patch: o.patch ?? undefined,
        owned: o.owned ?? undefined,
        tradeable: o.tradeable ?? false,
        item_id: o.item_id ?? undefined,
        category: o.category?.name ?? undefined,
        sources: o.sources ?? [],
      }));

    await this.collectionsService.bulkUpsertCollectibles(batch);
    this.logger.log(`Synced ${batch.length} orchestrion rolls`);
    return batch.length;
  }

  async syncAchievements(): Promise<number> {
    this.logger.log('Syncing achievements from FFXIV Collect...');
    const results = await this.fetchAll<FFXIVCollectAchievement>('achievements');

    const batch = results
      .filter((a) => a.name)
      .map((a) => ({
        externalId: a.id,
        name: a.name,
        description: a.description ?? undefined,
        points: a.points ?? 0,
        icon: a.icon ?? undefined,
        patch: a.patch ?? undefined,
        owned: a.owned ?? undefined,
        order: a.order ?? 0,
        category: a.category?.name ?? undefined,
        type_name: a.type?.name ?? undefined,
      }));

    await this.collectionsService.bulkUpsertAchievements(batch);
    this.logger.log(`Synced ${batch.length} achievements`);
    return batch.length;
  }

  async syncAll(): Promise<{
    mounts: number;
    minions: number;
    emotes: number;
    titles: number;
    hairstyles: number;
    orchestrions: number;
    achievements: number;
  }> {
    const mounts = await this.syncMounts();
    const minions = await this.syncMinions();
    const emotes = await this.syncEmotes();
    const titles = await this.syncTitles();
    const hairstyles = await this.syncHairstyles();
    const orchestrions = await this.syncOrchestrions();
    const achievements = await this.syncAchievements();
    return { mounts, minions, emotes, titles, hairstyles, orchestrions, achievements };
  }
}
