import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { LodestoneScrapingProcessor } from './lodestone-scraping.processor';
import { XivapiSyncProcessor } from './xivapi-sync.processor';
import { LodestoneModule } from '../lodestone/lodestone.module';
import { CharactersModule } from '../characters/characters.module';
import { CollectionsModule } from '../collections/collections.module';
import { XivapiModule } from '../xivapi/xivapi.module';

export const LODESTONE_QUEUE = 'lodestone-scraping';
export const XIVAPI_SYNC_QUEUE = 'xivapi-sync';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          url: config.get<string>('REDIS_URL'),
        },
      }),
    }),
    BullModule.registerQueue(
      {
        name: LODESTONE_QUEUE,
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 5000 },
          removeOnComplete: 100,
          removeOnFail: 50,
        },
      },
      {
        name: XIVAPI_SYNC_QUEUE,
        defaultJobOptions: {
          attempts: 3,
          backoff: { type: 'exponential', delay: 10000 },
          removeOnComplete: 50,
        },
      },
    ),
    LodestoneModule,
    CharactersModule,
    CollectionsModule,
    XivapiModule,
  ],
  providers: [LodestoneScrapingProcessor, XivapiSyncProcessor],
  exports: [BullModule],
})
export class QueueModule {}
