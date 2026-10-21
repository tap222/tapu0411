import bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';
import { TrainerEntity } from '../entities/trainer.entity';
import { TeamEntity } from '../entities/team.entity';

export async function seedDatabase(dataSource: DataSource): Promise<void> {
  const trainerRepo = dataSource.getRepository(TrainerEntity);
  const teamRepo = dataSource.getRepository(TeamEntity);

  const trainerCount = await trainerRepo.count();
  if (trainerCount > 0) {
    return;
  }

  console.log('⚡ Seeding initial SQLite data for Mini Pokédex...');

  const passwordHash = await bcrypt.hash('pikachu123', 10);

  const trainer1 = trainerRepo.create({
    id: 1,
    name: 'Ash Ketchum',
    email: 'ash@pokemon.com',
    password_hash: passwordHash,
    region: 'Kanto',
    avatar_url: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/trainers/1.png',
  });

  const trainer2 = trainerRepo.create({
    id: 2,
    name: 'Misty Waterflower',
    email: 'misty@pokemon.com',
    password_hash: passwordHash,
    region: 'Kanto',
    avatar_url: '',
  });

  await trainerRepo.save([trainer1, trainer2]);

  const team1 = teamRepo.create({
    id: 1,
    trainer_id: 1,
    name: 'Kanto Starters',
    pokemon_ids: [25, 6, 9, 3, 131, 143],
    created_at: new Date('2024-01-15T10:00:00Z'),
  });

  const team2 = teamRepo.create({
    id: 2,
    trainer_id: 1,
    name: 'Johto Squad',
    pokemon_ids: [157, 181, 214, 248, 197, 169],
    created_at: new Date('2024-03-20T14:30:00Z'),
  });

  const team3 = teamRepo.create({
    id: 3,
    trainer_id: 2,
    name: 'Water Specialists',
    pokemon_ids: [121, 130, 134, 73, 91, 99],
    created_at: new Date('2024-02-10T09:00:00Z'),
  });

  await teamRepo.save([team1, team2, team3]);
  console.log('✓ SQLite Database seeded with trainers and teams!');
}
