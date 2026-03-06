import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Character } from '../database/entities';
import { CharactersService } from './characters.service';
import { CharactersController } from './characters.controller';
import { LodestoneModule } from '../lodestone/lodestone.module';

@Module({
  imports: [TypeOrmModule.forFeature([Character]), LodestoneModule],
  controllers: [CharactersController],
  providers: [CharactersService],
  exports: [CharactersService],
})
export class CharactersModule {}
