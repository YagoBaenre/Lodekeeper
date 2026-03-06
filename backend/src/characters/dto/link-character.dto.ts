import { IsString } from 'class-validator';

export class LinkCharacterDto {
  @IsString()
  lodestoneId: string;
}
