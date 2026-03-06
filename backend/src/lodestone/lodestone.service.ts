import { Injectable, Logger, NotFoundException } from '@nestjs/common';
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
  private readonly characterParser = new CharacterParser();
  private readonly fcParser = new FCParser();
  private readonly fcMembersParser = new FCMembersParser();

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
