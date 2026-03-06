import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Collectible,
  CharacterCollectible,
  Achievement,
  CharacterAchievement,
} from '../database/entities';
import { CollectionsService } from './collections.service';
import { CollectionsController } from './collections.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Collectible,
      CharacterCollectible,
      Achievement,
      CharacterAchievement,
    ]),
  ],
  controllers: [CollectionsController],
  providers: [CollectionsService],
  exports: [CollectionsService],
})
export class CollectionsModule {}
