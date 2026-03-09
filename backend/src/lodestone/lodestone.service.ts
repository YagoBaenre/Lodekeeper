import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import * as cheerio from 'cheerio';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Character: CharacterParser, FreeCompany: FCParser, FCMembers: FCMembersParser } = require('@xivapi/nodestone');

export interface LodestoneCharacterData {
  name: string;
  server: string;
  dataCenter: string;
  portrait: string;
  avatar: string;
  title?: string;
  bio?: string;
  freeCompany?: {
    lodestoneId: string;
    name: string;
  };
}

export interface LodestoneFCData {
  lodestoneId: string;
  name: string;
  server: string;
  tag: string;
  memberCount: number;
  slogan?: string;
  crest?: string;
}

export interface LodestoneFCMember {
  lodestoneId: string;
  name: string;
  server: string;
  avatar: string;
  rank: string;
}

@Injectable()
export class LodestoneService {
  private readonly logger = new Logger(LodestoneService.name);
  private readonly characterParser;
  private readonly fcParser;
  private readonly fcMembersParser;
  private readonly region: string;

  /**
   * In-memory cache: icon URL hash → collectible name.
   * Built once per server lifetime by fetching tooltips.
   * Keyed by type (mount/minion).
   */
  private readonly iconHashCache = new Map<string, Map<string, string>>();

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.region = this.configService.get<string>('LODESTONE_REGION', 'na');

    this.characterParser = new (class extends CharacterParser {
      getURL(req: { params: { characterId: string } }) {
        return `https://${configService.get<string>('LODESTONE_REGION', 'na')}.finalfantasyxiv.com/lodestone/character/${req.params.characterId}`;
      }
    })();

    this.fcParser = new (class extends FCParser {
      getURL(req: { params: { fcId: string } }) {
        return `https://${configService.get<string>('LODESTONE_REGION', 'na')}.finalfantasyxiv.com/lodestone/freecompany/${req.params.fcId}`;
      }
    })();

    this.fcMembersParser = new (class extends FCMembersParser {
      getBaseURL(req: { params: { fcId: string } }) {
        return `https://${configService.get<string>('LODESTONE_REGION', 'na')}.finalfantasyxiv.com/lodestone/freecompany/${req.params.fcId}/member`;
      }
    })();
  }

  private get baseUrl(): string {
    return `https://${this.region}.finalfantasyxiv.com`;
  }

  /**
   * Fetch raw HTML from a Lodestone URL using HttpService (axios).
   */
  private async fetchHtml(url: string): Promise<string> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get<string>(url, { responseType: 'text' as never }),
      );
      return data;
    } catch (error: unknown) {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 404) {
        throw new NotFoundException(`Lodestone page not found: ${url}`);
      }
      throw error;
    }
  }

  async fetchCharacter(lodestoneId: string): Promise<LodestoneCharacterData> {
    this.logger.log(`Fetching character ${lodestoneId} from Lodestone`);

    const mockReq = { params: { characterId: lodestoneId } } as never;

    try {
      const raw = await this.characterParser.parse(mockReq) as Record<string, unknown>;

      const fcRaw = raw.FreeCompany as Record<string, unknown> | undefined;

      return {
        name: (raw.Name as string) ?? '',
        server: (raw.World as string) ?? '',
        dataCenter: (raw.DC as string) ?? '',
        portrait: (raw.Portrait as string) ?? '',
        avatar: (raw.Avatar as string) ?? '',
        title: raw.Title as string | undefined,
        bio: raw.Bio as string | undefined,
        freeCompany: fcRaw
          ? {
              lodestoneId: fcRaw.ID as string,
              name: (fcRaw.Name as string)?.replace(/&amp;/g, '&'),
            }
          : undefined,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      if (message === '404') {
        throw new NotFoundException(`Character ${lodestoneId} not found on Lodestone`);
      }
      throw error;
    }
  }

  /**
   * Fetch the names of mounts owned by a character from their Lodestone profile.
   */
  async fetchCharacterMounts(lodestoneId: string): Promise<string[]> {
    this.logger.log(`Fetching mounts for character ${lodestoneId}`);
    return this.fetchCollectibleNamesFromPage(lodestoneId, 'mount');
  }

  /**
   * Fetch the names of minions owned by a character from their Lodestone profile.
   */
  async fetchCharacterMinions(lodestoneId: string): Promise<string[]> {
    this.logger.log(`Fetching minions for character ${lodestoneId}`);
    return this.fetchCollectibleNamesFromPage(lodestoneId, 'minion');
  }

  /**
   * Scrapes a character's Lodestone collectible page and resolves names.
   *
   * Strategy:
   * 1. Fetch list page → extract icon URL hashes and tooltip HREFs
   * 2. For each icon hash, check in-memory cache
   * 3. For uncached icons, fetch tooltip pages in parallel to resolve names
   * 4. Cache new icon hash → name mappings for future use
   */
  private async fetchCollectibleNamesFromPage(
    lodestoneId: string,
    type: 'mount' | 'minion',
  ): Promise<string[]> {
    const listUrl = `${this.baseUrl}/lodestone/character/${lodestoneId}/${type}/`;
    this.logger.log(`Fetching ${type} list page: ${listUrl}`);

    const html = await this.fetchHtml(listUrl);
    const $ = cheerio.load(html);

    // Extract icon hashes and tooltip HREFs
    const items: { iconHash: string; tooltipHref: string }[] = [];
    $(`li.${type}__list_icon`).each((_, el) => {
      const tooltipHref = $(el).attr('data-tooltip_href') ?? '';
      const iconSrc = $(el).find('img.character__item_icon__img').attr('src') ?? '';
      // Extract hash from: https://lds-img.finalfantasyxiv.com/itemicon/e6/e6cd1b44...png?n7.45
      const hashMatch = iconSrc.match(/itemicon\/[a-f0-9]+\/([a-f0-9]+)\.png/);
      const iconHash = hashMatch?.[1] ?? '';
      if (iconHash && tooltipHref) {
        items.push({ iconHash, tooltipHref });
      }
    });

    this.logger.log(`Found ${items.length} ${type}(s) on Lodestone for character ${lodestoneId}`);
    if (items.length === 0) return [];

    // Get or create type cache
    if (!this.iconHashCache.has(type)) {
      this.iconHashCache.set(type, new Map());
    }
    const cache = this.iconHashCache.get(type)!;

    // Separate cached and uncached items
    const names: string[] = [];
    const uncached: { iconHash: string; tooltipHref: string }[] = [];

    for (const item of items) {
      const cached = cache.get(item.iconHash);
      if (cached) {
        names.push(cached);
      } else {
        uncached.push(item);
      }
    }

    this.logger.log(
      `${type}s: ${names.length} cached, ${uncached.length} need tooltip fetch`,
    );

    // Fetch uncached tooltips in parallel batches
    if (uncached.length > 0) {
      const batchSize = 10;
      const delayMs = 300;

      for (let i = 0; i < uncached.length; i += batchSize) {
        const batch = uncached.slice(i, i + batchSize);
        const results = await Promise.allSettled(
          batch.map(async (item) => {
            const tooltipUrl = `${this.baseUrl}${item.tooltipHref}`;
            const tooltipHtml = await this.fetchHtml(tooltipUrl);
            const $tt = cheerio.load(tooltipHtml);
            const name = $tt(`h4.${type}__header__label`).text().trim();
            return { iconHash: item.iconHash, name };
          }),
        );

        for (const result of results) {
          if (result.status === 'fulfilled' && result.value.name) {
            cache.set(result.value.iconHash, result.value.name);
            names.push(result.value.name);
          }
        }

        // Small delay between batches to be polite to Lodestone
        if (i + batchSize < uncached.length) {
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    this.logger.log(`Resolved ${names.length} ${type} names for character ${lodestoneId}`);
    return names;
  }

  async fetchFreeCompany(lodestoneId: string): Promise<LodestoneFCData> {
    this.logger.log(`Fetching FC ${lodestoneId} from Lodestone`);

    const mockReq = { params: { fcId: lodestoneId } } as never;

    try {
      const raw = await this.fcParser.parse(mockReq) as Record<string, unknown>;

      const crestLayers = raw.CrestLayers as Record<string, string> | undefined;
      const crest = crestLayers?.Top ?? crestLayers?.Bottom;

      return {
        lodestoneId,
        name: ((raw.Name as string) ?? '').replace(/&amp;/g, '&'),
        server: (raw.World as string) ?? '',
        tag: ((raw.Tag as string) ?? '').replace(/[«»]/g, ''),
        memberCount: (raw.ActiveMemberCount as number) ?? 0,
        slogan: (raw.Estate as Record<string, string>)?.Greeting,
        crest,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      if (message === '404') {
        throw new NotFoundException(`Free Company ${lodestoneId} not found on Lodestone`);
      }
      throw error;
    }
  }

  async fetchFCMembers(lodestoneId: string): Promise<LodestoneFCMember[]> {
    this.logger.log(`Fetching FC members for ${lodestoneId} from Lodestone`);

    const allMembers: LodestoneFCMember[] = [];
    let page = 1;
    let totalPages = 1;

    while (page <= totalPages) {
      const mockReq = {
        params: { fcId: lodestoneId },
        query: { page: String(page) },
      } as never;

      const raw = await this.fcMembersParser.parse(mockReq) as Record<string, unknown>;
      const list = (raw.List as Record<string, unknown>[]) ?? [];
      const pagination = raw.Pagination as Record<string, number>;

      for (const member of list) {
        allMembers.push({
          lodestoneId: String(member.ID),
          name: member.Name as string,
          server: (member.World as string) ?? '',
          avatar: (member.Avatar as string) ?? '',
          rank: (member.FcRank as string) ?? '',
        });
      }

      totalPages = pagination?.PageTotal ?? 1;
      page++;
    }

    this.logger.log(`Fetched ${allMembers.length} FC members`);
    return allMembers;
  }
}
