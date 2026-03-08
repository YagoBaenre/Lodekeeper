import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { FreeCompany } from './free-company.entity';
import { CharacterCollectible } from './character-collectible.entity';
import { CharacterAchievement } from './character-achievement.entity';

@Entity('characters')
export class Character {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  lodestoneId: string;

  @Column()
  name: string;

  @Column()
  server: string;

  @Column()
  dataCenter: string;

  @Column({ nullable: true })
  portrait: string;

  @Column({ nullable: true })
  title: string;

  @Column({ default: false })
  verified: boolean;

  @Column({ type: 'varchar', nullable: true })
  verificationCode: string | null;

  @ManyToOne(() => User, (user) => user.characters, { onDelete: 'CASCADE' })
  user: User;

  @Column()
  userId: number;

  @ManyToOne(() => FreeCompany, (fc) => fc.members, { nullable: true })
  freeCompany: FreeCompany;

  @Column({ nullable: true })
  freeCompanyId: number;

  @OneToMany(() => CharacterCollectible, (cc) => cc.character)
  collectibles: CharacterCollectible[];

  @OneToMany(() => CharacterAchievement, (ca) => ca.character)
  achievements: CharacterAchievement[];

  @Column({ type: 'timestamp', nullable: true })
  lastScrapedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
