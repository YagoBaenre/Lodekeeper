import { Controller, Post, UseGuards } from '@nestjs/common';
import { XivapiService } from './xivapi.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../database/entities';

@Controller('xivapi')
@UseGuards(JwtAuthGuard)
export class XivapiController {
  constructor(private readonly xivapiService: XivapiService) {}

  @Post('sync')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async syncAll() {
    return this.xivapiService.syncAll();
  }
}
