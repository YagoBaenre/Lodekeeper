import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { CharacterCollectible } from './character-collectible.entity';

export enum CollectibleType {
  MOUNT = 'mount',
  MINION = 'minion',
  TITLE = 'title',
  EMOTE = 'emote',
  HAIRSTYLE = 'hairstyle',
  ORCHESTRION = 'orchestrion',
}

export interface CollectibleSourceEntry {
  type: string;
  text: string;
  related_type?: string | null;
  related_id?: number | null;
}

@Entity('collectibles')
@Unique(['externalId', 'type'])
export class Collectible {
  @PrimaryGeneratedColumn()
  id: number;

  /** ID from FFXIV Collect API */
  @Column({ default: 0 })
  externalId: number;

  @Column({ type: 'enum', enum: CollectibleType })
  type: CollectibleType;

  @Column()
  name: string;

  @Column({ nullable: true })
  icon: string;

  @Column({ nullable: true })
  image: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ nullable: true, type: 'text' })
  enhanced_description: string;

  @Column({ nullable: true })
  tooltip: string;

  @Column({ nullable: true })
  patch: string;

  @Column({ nullable: true })
  owned: string;

  @Column({ default: false })
  tradeable: boolean;

  @Column({ type: 'jsonb', nullable: true })
  sources: CollectibleSourceEntry[];

  /** Mount-specific: movement type (Airborne, Terrestrial, etc.) */
  @Column({ nullable: true })
  movement: string;

  /** Mount-specific: number of seats */
  @Column({ nullable: true })
  seats: number;

  /** Emote-specific: slash command */
  @Column({ nullable: true })
  command: string;

  /** Title-specific: female variant */
  @Column({ nullable: true })
  female_name: string;

  /** Orchestrion-specific: category name */
  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  item_id: number;

  @Column({ default: 0 })
  order: number;

  @OneToMany(() => CharacterCollectible, (cc) => cc.collectible)
  characterCollectibles: CharacterCollectible[];
}
