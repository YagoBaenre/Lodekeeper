import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { LodestoneService } from './lodestone.service';

@Module({
  imports: [HttpModule],
  providers: [LodestoneService],
  exports: [LodestoneService],
})
export class LodestoneModule {}
