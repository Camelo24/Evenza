import { config } from 'dotenv';
import { defineConfig, env } from 'prisma/config';

config({ path: './backend/.env' });

export default defineConfig({
  schema: 'backend/prisma/schema.prisma',
  migrations: {
    path: 'backend/prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
