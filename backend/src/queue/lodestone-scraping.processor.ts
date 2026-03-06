import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { LODESTONE_QUEUE } from './queue.constants';
import { CharactersService } from '../characters/characters.service';
import { LodestoneService } from '../lodestone/lodestone.service';

export interface LodestoneJobData {
  characterId: number;
  lodestoneId: string;
}

@Processor(LODESTONE_QUEUE, {
  limiter: { max: 1, duration: 1500 },
  concurrency: 1,
})
export class LodestoneScrapingProcessor extends WorkerHost {
  private readonly logger = new Logger(LodestoneScrapingProcessor.name);

  constructor(
    private readonly charactersService: CharactersService,
    private readonly lodestoneService: LodestoneService,
  ) {
    super();
  }

  async process(job: Job<LodestoneJobData>): Promise<void> {
    const { characterId, lodestoneId } = job.data;
    this.logger.log(`Processing Lodestone scrape for character ${lodestoneId}`);

    try {
      const lodestoneData = await this.lodestoneService.fetchCharacter(lodestoneId);
      await this.charactersService.refreshFromLodestone(characterId);
      this.logger.log(`Scraped character: ${lodestoneData.name} (${lodestoneData.server})`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error(`Failed to scrape character ${lodestoneId}`, message);
      throw error;
    }
  }
}
