import { IsUrl } from 'class-validator';

export class TestWebhookDto {
  @IsUrl()
  webhookUrl: string;
}
