import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../database/entities';
import { TestWebhookDto } from './dto/test-webhook.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('discord/test')
  @UseGuards(RolesGuard)
  @Roles(UserRole.FC_LEADER, UserRole.ADMIN)
  async testDiscordWebhook(@Body() dto: TestWebhookDto) {
    await this.notificationsService.sendDiscordWebhook(
      dto.webhookUrl,
      'Lodekeeper is connected! Webhook test successful.',
    );
    return { success: true };
  }
}
