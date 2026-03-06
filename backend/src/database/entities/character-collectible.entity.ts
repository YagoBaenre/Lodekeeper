import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Character } from './character.entity';
import { Collectible } from './collectible.entity';

@Entity('character_collectibles')
@Unique(['characterId', 'collectibleId'])
export class CharacterCollectible {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Character, (character) => character.collectibles, { onDelete: 'CASCADE' })
  character: Character;

  @Column()
  characterId: number;

  @ManyToOne(() => Collectible, (collectible) => collectible.characterCollectibles, { onDelete: 'CASCADE' })
  collectible: Collectible;

  @Column()
  collectibleId: number;

  @Column({ type: 'timestamp', nullable: true })
  obtainedAt: Date;
}
