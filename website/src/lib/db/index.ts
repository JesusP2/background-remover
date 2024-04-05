import { drizzle } from 'drizzle-orm/better-sqlite3';
import { createClient } from '@libsql/client';
import { envs } from './env-vars';

const client = createClient({
  url: envs.DATABASE_URL,
  authToken: envs.DATABASE_TOKEN,
});

export const db = drizzle(client);
