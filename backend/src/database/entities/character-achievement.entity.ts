import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Character } from './character.entity';
import { Achievement } from './achievement.entity';

@Entity('character_achievements')
@Unique(['characterId', 'achievementId'])
export class CharacterAchievement {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Character, (character) => character.achievements, { onDelete: 'CASCADE' })
  character: Character;

  @Column()
  characterId: number;

  @ManyToOne(() => Achievement, (achievement) => achievement.characterAchievements, { onDelete: 'CASCADE' })
  achievement: Achievement;

  @Column()
  achievementId: number;

  @Column({ type: 'timestamp', nullable: true })
  obtainedAt: Date;
}
