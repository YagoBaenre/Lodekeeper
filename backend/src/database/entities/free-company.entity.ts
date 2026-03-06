import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Character } from './character.entity';

@Entity('free_companies')
export class FreeCompany {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  lodestoneId: string;

  @Column()
  name: string;

  @Column()
  server: string;

  @Column()
  tag: string;

  @Column({ default: 0 })
  memberCount: number;

  @Column({ nullable: true })
  slogan: string;

  @Column({ nullable: true })
  crest: string;

  @OneToMany(() => Character, (character) => character.freeCompany)
  members: Character[];

  @Column({ type: 'timestamp', nullable: true })
  lastScrapedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
