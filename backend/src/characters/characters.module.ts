import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Character } from '../database/entities';
import { CharactersService } from './characters.service';
import { CharactersController } from './characters.controller';
import { LodestoneModule } from '../lodestone/lodestone.module';
import { FreeCompanyModule } from '../free-company/free-company.module';

@Module({
  imports: [TypeOrmModule.forFeature([Character]), LodestoneModule, FreeCompanyModule],
  controllers: [CharactersController],
  providers: [CharactersService],
  exports: [CharactersService],
})
export class CharactersModule {}
