import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { XivapiService } from './xivapi.service';
import { CollectionsModule } from '../collections/collections.module';

@Module({
  imports: [HttpModule, CollectionsModule],
  providers: [XivapiService],
  exports: [XivapiService],
})
export class XivapiModule {}
