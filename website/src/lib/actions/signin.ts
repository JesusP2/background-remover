import { redirect } from '@solidjs/router';
import { eq } from 'drizzle-orm';
import { Argon2id } from 'oslo/password';
import { appendResponseHeader } from 'vinxi/http';
import { lucia } from '../auth';
import { db } from '../db';
import { userTable } from '../db/schema';

export async function SigninAction(formData: FormData) {
  'use server';
  const username = formData.get('username');
  if (
    typeof username !== 'string' ||
    username.length < 3 ||
    username.length > 31 ||
    !/^[a-z0-9_-]+$/.test(username)
  ) {
    return {
      username: 'Invalid username',
    };
  }
  const password = formData.get('password');
  if (
    typeof password !== 'string' ||
    password.length < 6 ||
    password.length > 255
  ) {
    return {
      password: 'Invalid password',
    };
  }

  const existingUser = await db
    .select()
    .from(userTable)
    .where(eq(userTable.username, username.toLowerCase()));
  if (!existingUser) {
    return {
      username: 'Incorrect username or password',
      password: 'Incorrect username or password',
    };
  }

  const validPassword = await new Argon2id().verify(
    existingUser[0].password,
    password,
  );
  if (!validPassword) {
    return {
      password: 'Incorrect password',
    };
  }

  const session = await lucia.createSession(existingUser[0].id, {});
  appendResponseHeader(
    'Set-Cookie',
    lucia.createSessionCookie(session.id).serialize(),
  );

  throw redirect('/');
}
