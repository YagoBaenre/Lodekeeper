import {
  Column,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CharacterAchievement } from './character-achievement.entity';

@Entity('achievements')
export class Achievement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  xivapiId: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true })
  category: string;

  @Column({ default: 0 })
  points: number;

  @Column({ nullable: true })
  icon: string;

  @Column({ nullable: true })
  patch: string;

  @OneToMany(() => CharacterAchievement, (ca) => ca.achievement)
  characterAchievements: CharacterAchievement[];
}
