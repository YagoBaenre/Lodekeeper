import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
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

export enum CollectibleSource {
  RAID = 'raid',
  TRIAL = 'trial',
  DUNGEON = 'dungeon',
  CRAFTING = 'crafting',
  TREASURE_MAP = 'treasure_map',
  PVP = 'pvp',
  MOGSTATION = 'mogstation',
  ACHIEVEMENT = 'achievement',
  EVENT = 'event',
  OTHER = 'other',
}

@Entity('collectibles')
export class Collectible {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  xivapiId: number;

  @Column({ type: 'enum', enum: CollectibleType })
  type: CollectibleType;

  @Column()
  name: string;

  @Column({ nullable: true })
  icon: string;

  @Column({ type: 'enum', enum: CollectibleSource, default: CollectibleSource.OTHER })
  source: CollectibleSource;

  @Column({ nullable: true })
  patch: string;

  @Column({ nullable: true })
  description: string;

  @OneToMany(() => CharacterCollectible, (cc) => cc.collectible)
  characterCollectibles: CharacterCollectible[];
}
