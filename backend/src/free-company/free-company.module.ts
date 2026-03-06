import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  FreeCompany,
  Character,
  CharacterCollectible,
  Collectible,
} from '../database/entities';
import { FreeCompanyService } from './free-company.service';
import { FreeCompanyController } from './free-company.controller';
import { LodestoneModule } from '../lodestone/lodestone.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([FreeCompany, Character, CharacterCollectible, Collectible]),
    LodestoneModule,
  ],
  controllers: [FreeCompanyController],
  providers: [FreeCompanyService],
  exports: [FreeCompanyService],
})
export class FreeCompanyModule {}
