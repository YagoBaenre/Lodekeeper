import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { LODESTONE_QUEUE } from './queue.module';
import { CharactersService } from '../characters/characters.service';
import { CollectionsService } from '../collections/collections.service';
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
    private readonly collectionsService: CollectionsService,
    private readonly lodestoneService: LodestoneService,
  ) {
    super();
  }

  async process(job: Job<LodestoneJobData>): Promise<void> {
    const { characterId, lodestoneId } = job.data;
    this.logger.log(`Processing Lodestone scrape for character ${lodestoneId}`);

    try {
      await this.charactersService.refreshFromLodestone(characterId);

      const lodestoneData = await this.lodestoneService.fetchCharacter(lodestoneId);

      // TODO: Map lodestone mount/minion names to collectible IDs and sync
      this.logger.log(
        `Scraped ${lodestoneData.mounts?.length ?? 0} mounts, ${lodestoneData.minions?.length ?? 0} minions`,
      );
    } catch (error) {
      this.logger.error(`Failed to scrape character ${lodestoneId}`, error.message);
      throw error;
    }
  }
}
