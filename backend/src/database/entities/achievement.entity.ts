import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { CharacterAchievement } from './character-achievement.entity';

@Entity('achievements')
@Unique(['externalId'])
export class Achievement {
  @PrimaryGeneratedColumn()
  id: number;

  /** ID from FFXIV Collect API */
  @Column({ default: 0 })
  externalId: number;

  @Column()
  name: string;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  type_name: string;

  @Column({ default: 0 })
  points: number;

  @Column({ nullable: true })
  icon: string;

  @Column({ nullable: true })
  patch: string;

  @Column({ nullable: true })
  owned: string;

  @Column({ default: 0 })
  order: number;

  @OneToMany(() => CharacterAchievement, (ca) => ca.achievement)
  characterAchievements: CharacterAchievement[];
}
