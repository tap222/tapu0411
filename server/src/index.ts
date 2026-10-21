import 'reflect-metadata';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { createSchema, createYoga } from 'graphql-yoga';
import { AppDataSource } from './data-source';
import { seedDatabase } from './seed/initial-seed';
import { typeDefs } from './schema/type-defs';
import { authResolvers } from './resolvers/auth.resolver';
import { teamResolvers } from './resolvers/team.resolver';
import { extractAuthUser } from './middleware/auth.middleware';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const PORT = Number(process.env.BACKEND_PORT) || 4000;

async function bootstrap() {
  try {
    console.log('🔄 Initializing SQLite database connection...');
    await AppDataSource.initialize();
    console.log('✓ SQLite database connected successfully.');

    await seedDatabase(AppDataSource);

    const app = express();
    app.use(cors());
    app.use(express.json());

    const schema = createSchema({
      typeDefs,
      resolvers: {
        Query: {
          ...authResolvers.Query,
          ...teamResolvers.Query,
        },
        Mutation: {
          ...authResolvers.Mutation,
          ...teamResolvers.Mutation,
        },
      },
    });

    const yoga = createYoga({
      schema,
      graphqlEndpoint: '/graphql',
      context: ({ request }) => {
        const headers: Record<string, string | undefined> = {};
        request.headers.forEach((val, key) => {
          headers[key.toLowerCase()] = val;
        });
        const user = extractAuthUser({ headers });
        return { user, request };
      },
    });

    // Mount Yoga on /graphql
    app.use('/graphql', yoga);

    // Health check endpoint
    app.get('/health', (_req, res) => {
      res.json({ status: 'ok', microservice: 'pokedex-sqlite-graphql', port: PORT });
    });

    app.listen(PORT, () => {
      console.log(`🚀 Mini Pokédex Backend microservice running at http://localhost:${PORT}/graphql`);
    });
  } catch (error) {
    console.error('❌ Failed to bootstrap backend server:', error);
    process.exit(1);
  }
}

bootstrap();
