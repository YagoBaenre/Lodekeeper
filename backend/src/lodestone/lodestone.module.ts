import { Module } from '@nestjs/common';
import { LodestoneService } from './lodestone.service';

@Module({
  providers: [LodestoneService],
  exports: [LodestoneService],
})
export class LodestoneModule {}
