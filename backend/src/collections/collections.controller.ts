import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CollectionsService } from './collections.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CollectibleType } from '../database/entities';

@Controller()
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}

  @Get('collectibles')
  findAllCollectibles(@Query('type') type?: CollectibleType, @Query('search') search?: string) {
    return this.collectionsService.findAllCollectibles(type, search);
  }

  @Get('collectibles/:id')
  findCollectible(@Param('id', ParseIntPipe) id: number) {
    return this.collectionsService.findCollectibleById(id);
  }

  @Get('characters/:id/collections')
  @UseGuards(JwtAuthGuard)
  getCharacterCollection(
    @Param('id', ParseIntPipe) id: number,
    @Query('type') type?: CollectibleType,
    @Query('search') search?: string,
  ) {
    return this.collectionsService.getCharacterCollection(id, type, search);
  }

  @Post('characters/:id/collections/toggle')
  @UseGuards(JwtAuthGuard)
  toggleCollectible(
    @Param('id', ParseIntPipe) id: number,
    @Body('collectibleId', ParseIntPipe) collectibleId: number,
  ) {
    return this.collectionsService.toggleCharacterCollectible(id, collectibleId);
  }

  @Get('characters/:id/achievements')
  @UseGuards(JwtAuthGuard)
  getCharacterAchievements(@Param('id', ParseIntPipe) id: number) {
    return this.collectionsService.getCharacterAchievements(id);
  }
}
