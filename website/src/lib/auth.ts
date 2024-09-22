import { DrizzleSQLiteAdapter } from '@lucia-auth/adapter-drizzle';
import { GitHub, Google } from 'arctic';
import { Lucia } from 'lucia';
import { db } from './db';
import { envs } from './db/env-vars';
import { sessionTable, userTable } from './db/schema/user';

export const adapter = new DrizzleSQLiteAdapter(db, sessionTable, userTable);
export const lucia = new Lucia(adapter, {
  sessionCookie: {
    attributes: {
      secure: import.meta.env.PROD,
      sameSite: 'lax',
    },
  },
});

declare module 'lucia' {
  interface Register {
    Lucia: typeof lucia;
  }
}
export const google = new Google(
  envs.GOOGLE_CLIENT_ID,
  envs.GOOGLE_CLIENT_SECRET,
  envs.GOOGLE_REDIRECT_URI,
);

export const github = new GitHub(
  envs.GITHUB_CLIENT_ID,
  envs.GITHUB_CLIENT_SECRET,
);

export async function hashPassword(password: string) {
  const textEncoder = new TextEncoder();
  const digest = await crypto.subtle.digest(
    {
      name: 'SHA-256',
    },
    textEncoder.encode(password),
  );
  return btoa(String.fromCharCode(...new Uint8Array(digest)));
}

export async function comparePasswords(password1: string, password2: string) {
  const passworddHash = await hashPassword(password2);
  return passworddHash === password1;
}
