import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { FreeCompanyService } from './free-company.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('fc')
@UseGuards(JwtAuthGuard)
export class FreeCompanyController {
  constructor(private readonly fcService: FreeCompanyService) {}

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.fcService.findById(id);
  }

  @Get(':id/members')
  getMembers(@Param('id', ParseIntPipe) id: number) {
    return this.fcService.getMembers(id);
  }

  @Get(':id/leaderboard')
  getLeaderboard(@Param('id', ParseIntPipe) id: number) {
    return this.fcService.getLeaderboard(id);
  }

  @Get(':id/almost-there')
  getAlmostThere(@Param('id', ParseIntPipe) id: number) {
    return this.fcService.getAlmostThere(id);
  }
}
