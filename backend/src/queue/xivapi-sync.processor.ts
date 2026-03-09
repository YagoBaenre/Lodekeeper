import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { XIVAPI_SYNC_QUEUE } from './queue.constants';
import { XivapiService } from '../xivapi/xivapi.service';

@Processor(XIVAPI_SYNC_QUEUE, { concurrency: 1 })
export class XivapiSyncProcessor extends WorkerHost {
  private readonly logger = new Logger(XivapiSyncProcessor.name);

  constructor(private readonly xivapiService: XivapiService) {
    super();
  }

  async process(job: Job): Promise<void> {
    this.logger.log(`Processing XIVAPI sync job: ${job.name}`);

    try {
      const result = await this.xivapiService.syncAll();
      this.logger.log(
        `FFXIV Collect sync complete: ${result.mounts} mounts, ${result.minions} minions, ` +
        `${result.emotes} emotes, ${result.titles} titles, ${result.hairstyles} hairstyles, ` +
        `${result.orchestrions} orchestrions, ${result.achievements} achievements`,
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to sync XIVAPI data', message);
      throw error;
    }
  }
}
