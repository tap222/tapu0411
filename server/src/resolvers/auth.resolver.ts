import bcrypt from 'bcryptjs';
import { AppDataSource } from '../data-source';
import { TrainerEntity } from '../entities/trainer.entity';
import { signToken } from '../middleware/auth.middleware';

export const authResolvers = {
  Query: {
    me: async (_parent: unknown, _args: unknown, context: { user: { userId: number } | null }) => {
      if (!context.user) {
        return null;
      }
      const trainerRepo = AppDataSource.getRepository(TrainerEntity);
      return trainerRepo.findOneBy({ id: context.user.userId });
    },
    trainers: async () => {
      const trainerRepo = AppDataSource.getRepository(TrainerEntity);
      return trainerRepo.find();
    },
  },
  Mutation: {
    login: async (_parent: unknown, { email, password }: { email: string; password: string }) => {
      const trainerRepo = AppDataSource.getRepository(TrainerEntity);
      const user = await trainerRepo.findOneBy({ email: email.toLowerCase().trim() });

      if (!user) {
        throw new Error('Invalid email or password.');
      }

      const isValid = await bcrypt.compare(password, user.password_hash);
      if (!isValid) {
        throw new Error('Invalid email or password.');
      }

      const token = signToken({
        userId: user.id,
        email: user.email,
        name: user.name,
        region: user.region,
      });

      return {
        token,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          region: user.region,
          avatar_url: user.avatar_url,
          created_at: user.created_at.toISOString(),
        },
      };
    },
  },
};
