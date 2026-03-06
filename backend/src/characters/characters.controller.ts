import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CharactersService } from './characters.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { LinkCharacterDto } from './dto/link-character.dto';

@Controller('characters')
@UseGuards(JwtAuthGuard)
export class CharactersController {
  constructor(private readonly charactersService: CharactersService) {}

  @Post('link')
  link(
    @CurrentUser('id') userId: number,
    @Body() dto: LinkCharacterDto,
  ) {
    return this.charactersService.link(userId, dto);
  }

  @Post(':id/verify')
  verify(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser('id') userId: number,
  ) {
    return this.charactersService.verify(id, userId);
  }

  @Get()
  findMyCharacters(@CurrentUser('id') userId: number) {
    return this.charactersService.findByUser(userId);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.charactersService.findById(id);
  }

  @Post(':id/refresh')
  refresh(@Param('id', ParseIntPipe) id: number) {
    return this.charactersService.refreshFromLodestone(id);
  }
}
