import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';

export interface LodestoneCharacterData {
  name: string;
  server: string;
  dataCenter: string;
  portrait: string;
  title?: string;
  bio?: string;
  mounts?: string[];
  minions?: string[];
  freeCompany?: {
    lodestoneId: string;
    name: string;
  };
}

@Injectable()
export class LodestoneService {
  private readonly logger = new Logger(LodestoneService.name);

  constructor(private readonly httpService: HttpService) {}

  /**
   * Fetch character data from the Lodestone.
   *
   * TODO: Integrate @xivapi/nodestone for HTML parsing.
   * Currently returns a placeholder structure. Once nodestone is wired up,
   * this method will scrape the actual Lodestone profile page.
   */
  async fetchCharacter(lodestoneId: string): Promise<LodestoneCharacterData> {
    this.logger.log(`Fetching character ${lodestoneId} from Lodestone`);

    // TODO: Replace with actual Nodestone integration
    // const parser = new CharacterParser();
    // const result = await parser.parse({ params: { characterId: lodestoneId } });

    return {
      name: '',
      server: '',
      dataCenter: '',
      portrait: '',
      title: undefined,
      bio: undefined,
      mounts: [],
      minions: [],
    };
  }

  /**
   * Fetch Free Company data from the Lodestone.
   *
   * TODO: Integrate @xivapi/nodestone for FC parsing.
   */
  async fetchFreeCompany(lodestoneId: string) {
    this.logger.log(`Fetching FC ${lodestoneId} from Lodestone`);

    return {
      lodestoneId,
      name: '',
      server: '',
      tag: '',
      memberCount: 0,
      slogan: '',
      crest: '',
      members: [] as { lodestoneId: string; name: string }[],
    };
  }
}
