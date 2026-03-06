import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { CollectionsService } from '../collections/collections.service';
import { CollectibleType } from '../database/entities';

interface XivApiRow {
  row_id: number;
  fields: Record<string, unknown>;
}

interface XivApiResponse {
  rows: XivApiRow[];
}

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

  async fetchSheet(sheetName: string, fields: string, limit = 500, after?: number): Promise<XivApiResponse> {
    let url = `${this.baseUrl}/api/sheet/${sheetName}?fields=${fields}&limit=${limit}&language=en`;
    if (after !== undefined) url += `&after=${after}`;
    this.logger.log(`Fetching sheet: ${sheetName} (after=${after ?? 'start'})`);

    const { data } = await firstValueFrom(this.httpService.get<XivApiResponse>(url));
    return data;
  }

  async fetchAllRows(sheetName: string, fields: string): Promise<XivApiRow[]> {
    const allRows: XivApiRow[] = [];
    let after: number | undefined;

    while (true) {
      const data = await this.fetchSheet(sheetName, fields, 500, after);
      if (!data.rows || data.rows.length === 0) break;

      allRows.push(...data.rows);

      if (data.rows.length < 500) break;
      after = data.rows[data.rows.length - 1].row_id;
    }

    return allRows;
  }

  async syncMounts(): Promise<number> {
    this.logger.log('Syncing mounts from XIVAPI v2...');
    const rows = await this.fetchAllRows('Mount', 'Singular,Icon');
    let count = 0;

    for (const row of rows) {
      const name = row.fields.Singular as string;
      if (!name) continue;

      const icon = row.fields.Icon as { path?: string } | undefined;
      await this.collectionsService.upsertCollectible({
        xivapiId: row.row_id,
        type: CollectibleType.MOUNT,
        name: name.charAt(0).toUpperCase() + name.slice(1),
        icon: icon?.path ?? undefined,
      });
      count++;
    }

    this.logger.log(`Synced ${count} mounts`);
    return count;
  }

  async syncMinions(): Promise<number> {
    this.logger.log('Syncing minions from XIVAPI v2...');
    const rows = await this.fetchAllRows('Companion', 'Singular,Icon');
    let count = 0;

    for (const row of rows) {
      const name = row.fields.Singular as string;
      if (!name) continue;

      const icon = row.fields.Icon as { path?: string } | undefined;
      await this.collectionsService.upsertCollectible({
        xivapiId: row.row_id,
        type: CollectibleType.MINION,
        name: name.charAt(0).toUpperCase() + name.slice(1),
        icon: icon?.path ?? undefined,
      });
      count++;
    }

    this.logger.log(`Synced ${count} minions`);
    return count;
  }

  async syncAchievements(): Promise<number> {
    this.logger.log('Syncing achievements from XIVAPI v2...');
    const rows = await this.fetchAllRows('Achievement', 'Name,Description,Icon,AchievementCategory.Name');
    let count = 0;

    for (const row of rows) {
      const name = row.fields.Name as string;
      if (!name) continue;

      const icon = row.fields.Icon as { path?: string } | undefined;
      const category = row.fields.AchievementCategory as { fields?: { Name?: string } } | undefined;

      await this.collectionsService.upsertAchievement({
        xivapiId: row.row_id,
        name,
        description: (row.fields.Description as string) ?? undefined,
        icon: icon?.path ?? undefined,
        category: category?.fields?.Name ?? undefined,
      });
      count++;
    }

    this.logger.log(`Synced ${count} achievements`);
    return count;
  }

  async syncAll(): Promise<{ mounts: number; minions: number; achievements: number }> {
    const mounts = await this.syncMounts();
    const minions = await this.syncMinions();
    const achievements = await this.syncAchievements();
    return { mounts, minions, achievements };
  }
}
