import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import { envs } from './env-vars';
import * as schema from './schema';

export const client = createClient({
  url: envs.DATABASE_URL,
  authToken: envs.DATABASE_TOKEN,
});

export const db = drizzle(client, { schema });
