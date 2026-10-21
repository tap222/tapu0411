import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { TeamEntity } from './team.entity';

@Entity('trainers')
export class TrainerEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'varchar', length: 150, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 255 })
  password_hash!: string;

  @Column({ type: 'varchar', length: 50, default: 'Kanto' })
  region!: string;

  @Column({ type: 'varchar', length: 255, default: '' })
  avatar_url!: string;

  @CreateDateColumn()
  created_at!: Date;

  @OneToMany(() => TeamEntity, (team) => team.trainer)
  teams!: TeamEntity[];
}
