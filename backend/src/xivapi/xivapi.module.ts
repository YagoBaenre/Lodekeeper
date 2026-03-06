import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { XivapiService } from './xivapi.service';
import { XivapiController } from './xivapi.controller';
import { CollectionsModule } from '../collections/collections.module';

@Module({
  imports: [HttpModule, CollectionsModule],
  controllers: [XivapiController],
  providers: [XivapiService],
  exports: [XivapiService],
})
export class XivapiModule {}
