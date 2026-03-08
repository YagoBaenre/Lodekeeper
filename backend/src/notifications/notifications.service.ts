import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

export interface DiscordEmbed {
  title: string;
  description?: string;
  color?: number;
  thumbnail?: { url: string };
  fields?: { name: string; value: string; inline?: boolean }[];
  footer?: { text: string };
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(private readonly httpService: HttpService) {}

  async sendDiscordWebhook(
    webhookUrl: string,
    content: string,
    embeds?: DiscordEmbed[],
  ): Promise<void> {
    try {
      await firstValueFrom(
        this.httpService.post(webhookUrl, {
          content,
          embeds,
        }),
      );
      this.logger.log('Discord webhook sent successfully');
    } catch (error) {
      this.logger.error('Failed to send Discord webhook', (error as Error).message);
    }
  }

  async sendCollectionMilestone(
    webhookUrl: string,
    characterName: string,
    collectibleName: string,
    totalOwned: number,
    totalAvailable: number,
  ): Promise<void> {
    const percentage = Math.round((totalOwned / totalAvailable) * 100);
    const embed: DiscordEmbed = {
      title: 'Collection Milestone!',
      description: `**${characterName}** just obtained **${collectibleName}**!`,
      color: 0xd4af37,
      fields: [
        { name: 'Progress', value: `${totalOwned}/${totalAvailable} (${percentage}%)`, inline: true },
      ],
      footer: { text: 'Lodekeeper' },
    };

    await this.sendDiscordWebhook(webhookUrl, '', [embed]);
  }

  async sendFCAlmostThere(
    webhookUrl: string,
    fcName: string,
    collectibleName: string,
    percentage: number,
  ): Promise<void> {
    const embed: DiscordEmbed = {
      title: 'Almost There!',
      description: `**${percentage}%** of **${fcName}** now owns **${collectibleName}**!`,
      color: 0x5b9bd5,
      footer: { text: 'Lodekeeper' },
    };

    await this.sendDiscordWebhook(webhookUrl, '', [embed]);
  }
}
