import type { Config } from 'drizzle-kit';
import { envs } from './src/lib/db/env-vars';

export default {
  schema: './src/lib/db/schema',
  out: './drizzle',
  driver: 'turso',
  dbCredentials: {
    url: envs.DATABASE_URL,
    authToken: envs.DATABASE_TOKEN,
  },
} satisfies Config;
