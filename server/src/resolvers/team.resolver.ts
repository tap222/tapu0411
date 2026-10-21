import { AppDataSource } from '../data-source';
import { TeamEntity } from '../entities/team.entity';
import { TrainerEntity } from '../entities/trainer.entity';

export const teamResolvers = {
  Query: {
    teams: async () => {
      const teamRepo = AppDataSource.getRepository(TeamEntity);
      const teams = await teamRepo.find({
        order: { created_at: 'DESC' },
        relations: ['trainer'],
      });
      return teams.map((team) => ({
        ...team,
        id: String(team.id),
        created_at: team.created_at ? new Date(team.created_at).toISOString() : new Date().toISOString(),
      }));
    },
    team: async (_parent: unknown, { id }: { id: string | number }) => {
      const teamRepo = AppDataSource.getRepository(TeamEntity);
      const team = await teamRepo.findOne({
        where: { id: Number(id) },
        relations: ['trainer'],
      });
      if (!team) return null;
      return {
        ...team,
        id: String(team.id),
        created_at: team.created_at ? new Date(team.created_at).toISOString() : new Date().toISOString(),
      };
    },
  },
  Mutation: {
    createTeam: async (
      _parent: unknown,
      { name, pokemon_ids, trainer_id }: { name: string; pokemon_ids: number[]; trainer_id?: number },
      context: { user: { userId: number } | null },
    ) => {
      const trimmedName = (name || '').trim();
      if (trimmedName.length < 3 || trimmedName.length > 30) {
        throw new Error('Team name must be between 3 and 30 characters.');
      }
      if (!Array.isArray(pokemon_ids) || pokemon_ids.length < 1 || pokemon_ids.length > 6) {
        throw new Error('A team must contain between 1 and 6 Pokémon.');
      }

      const teamRepo = AppDataSource.getRepository(TeamEntity);
      const existing = await teamRepo
        .createQueryBuilder('team')
        .where('LOWER(team.name) = LOWER(:name)', { name: trimmedName })
        .getOne();

      if (existing) {
        throw new Error(`Team name "${trimmedName}" is already taken.`);
      }

      const assignedTrainerId = trainer_id || context.user?.userId || 1;

      const newTeam = teamRepo.create({
        name: trimmedName,
        pokemon_ids,
        trainer_id: assignedTrainerId,
        created_at: new Date(),
      });

      const saved = await teamRepo.save(newTeam);
      const trainerRepo = AppDataSource.getRepository(TrainerEntity);
      const trainer = await trainerRepo.findOneBy({ id: assignedTrainerId });

      return {
        ...saved,
        id: String(saved.id),
        created_at: saved.created_at.toISOString(),
        trainer: trainer || undefined,
      };
    },
    deleteTeam: async (_parent: unknown, { id }: { id: string | number }) => {
      const teamRepo = AppDataSource.getRepository(TeamEntity);
      const result = await teamRepo.delete({ id: Number(id) });
      return (result.affected ?? 0) > 0;
    },
  },
};
