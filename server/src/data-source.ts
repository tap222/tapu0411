import 'reflect-metadata';
import { DataSource } from 'typeorm';
import path from 'path';
import { TrainerEntity } from './entities/trainer.entity';
import { TeamEntity } from './entities/team.entity';

const dbPath = path.resolve(__dirname, '../database/pokedex.sqlite');

export const AppDataSource = new DataSource({
  type: 'better-sqlite3',
  database: dbPath,
  synchronize: true,
  logging: false,
  entities: [TrainerEntity, TeamEntity],
});
