import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { CollectionsService } from '../collections/collections.service';
import { CollectibleType } from '../database/entities';

@Injectable()
export class XivapiService {
  private readonly logger = new Logger(XivapiService.name);
  private readonly baseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly collectionsService: CollectionsService,
  ) {
    this.baseUrl = this.configService.get<string>('XIVAPI_BASE_URL')!;
  }

  /**
   * Fetch a sheet from XIVAPI v2.
   * Example: fetchSheet('Mount', 'Name,Icon')
   */
  async fetchSheet(sheetName: string, fields: string, limit = 500) {
    const url = `${this.baseUrl}/api/sheet/${sheetName}?fields=${fields}&limit=${limit}`;
    this.logger.log(`Fetching sheet: ${sheetName}`);

    const { data } = await firstValueFrom(this.httpService.get(url));
    return data;
  }

  /**
   * Fetch a single row from a sheet.
   * Example: fetchSheetRow('Mount', 1, 'Name,Icon')
   */
  async fetchSheetRow(sheetName: string, rowId: number, fields: string) {
    const url = `${this.baseUrl}/api/sheet/${sheetName}/${rowId}?fields=${fields}`;
    const { data } = await firstValueFrom(this.httpService.get(url));
    return data;
  }

  /**
   * Sync all mounts from XIVAPI v2 into the local database.
   */
  async syncMounts(): Promise<number> {
    this.logger.log('Syncing mounts from XIVAPI v2...');
    const data = await this.fetchSheet('Mount', 'Name,Icon,Order');
    let count = 0;

    for (const row of data.rows ?? []) {
      if (!row.fields?.Name) continue;
      await this.collectionsService.upsertCollectible({
        xivapiId: row.row_id,
        type: CollectibleType.MOUNT,
        name: row.fields.Name,
        icon: row.fields.Icon?.path ?? null,
      });
      count++;
    }

    this.logger.log(`Synced ${count} mounts`);
    return count;
  }

  /**
   * Sync all minions (Companion sheet) from XIVAPI v2 into the local database.
   */
  async syncMinions(): Promise<number> {
    this.logger.log('Syncing minions from XIVAPI v2...');
    const data = await this.fetchSheet('Companion', 'Name,Icon');
    let count = 0;

    for (const row of data.rows ?? []) {
      if (!row.fields?.Name) continue;
      await this.collectionsService.upsertCollectible({
        xivapiId: row.row_id,
        type: CollectibleType.MINION,
        name: row.fields.Name,
        icon: row.fields.Icon?.path ?? null,
      });
      count++;
    }

    this.logger.log(`Synced ${count} minions`);
    return count;
  }

  /**
   * Sync all achievements from XIVAPI v2 into the local database.
   */
  async syncAchievements(): Promise<number> {
    this.logger.log('Syncing achievements from XIVAPI v2...');
    const data = await this.fetchSheet('Achievement', 'Name,Description,Icon,Points');
    let count = 0;

    for (const row of data.rows ?? []) {
      if (!row.fields?.Name) continue;
      await this.collectionsService.upsertAchievement({
        xivapiId: row.row_id,
        name: row.fields.Name,
        description: row.fields.Description ?? null,
        icon: row.fields.Icon?.path ?? null,
        points: row.fields.Points ?? 0,
      });
      count++;
    }

    this.logger.log(`Synced ${count} achievements`);
    return count;
  }

  /**
   * Sync all game data catalogs.
   */
  async syncAll(): Promise<{ mounts: number; minions: number; achievements: number }> {
    const mounts = await this.syncMounts();
    const minions = await this.syncMinions();
    const achievements = await this.syncAchievements();
    return { mounts, minions, achievements };
  }
}
