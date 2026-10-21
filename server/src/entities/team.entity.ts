import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { TrainerEntity } from './trainer.entity';

@Entity('teams')
export class TeamEntity {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int' })
  trainer_id!: number;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'simple-json' })
  pokemon_ids!: number[];

  @CreateDateColumn()
  created_at!: Date;

  @ManyToOne(() => TrainerEntity, (trainer) => trainer.teams, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'trainer_id' })
  trainer!: TrainerEntity;
}
