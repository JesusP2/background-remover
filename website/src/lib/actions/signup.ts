import { redirect } from '@solidjs/router';
import { eq } from 'drizzle-orm';
import { generateId } from 'lucia';
import { Argon2id } from 'oslo/password';
import { setCookie } from 'vinxi/http';
import { lucia } from '~/lib/auth';
import { db } from '~/lib/db';
import { userTable } from '~/lib/db/schema';

export async function signupAction(formData: FormData) {
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

  const userId = generateId(15);
  const hashedPassword = await new Argon2id().hash(password);

  const user = await db
    .select({
      id: userTable.id,
    })
    .from(userTable)
    .where(eq(userTable.username, username))
    .limit(1);
  if (user.length > 0) {
    return {
      username: 'Username already taken',
    };
  }
  await db.insert(userTable).values({
    id: userId,
    username: username,
    password: hashedPassword,
  });

  const session = await lucia.createSession(userId, {});
  const sessionCookie = lucia.createSessionCookie(session.id);
  setCookie(sessionCookie.name, sessionCookie.value, sessionCookie.attributes);

  throw redirect('/');
}
