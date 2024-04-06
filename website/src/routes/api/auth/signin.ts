import { APIEvent } from '@solidjs/start/server';
import { eq } from 'drizzle-orm';
import { Argon2id } from 'oslo/password';
import { appendResponseHeader, createError } from 'vinxi/http';
import { lucia } from '~/lib/auth';
import { db } from '~/lib/db';
import { userTable } from '~/lib/db/schema';

export async function POST(event: APIEvent) {
  const formData = await event.request.formData();
  const username = formData.get('username');
  if (
    typeof username !== 'string' ||
    username.length < 3 ||
    username.length > 31 ||
    !/^[a-z0-9_-]+$/.test(username)
  ) {
    throw createError({
      message: 'Invalid username',
      statusCode: 400,
    });
  }
  const password = formData.get('password');
  if (
    typeof password !== 'string' ||
    password.length < 6 ||
    password.length > 255
  ) {
    throw createError({
      message: 'Invalid password',
      statusCode: 400,
    });
  }

  const existingUser = await db
    .select()
    .from(userTable)
    .where(eq(userTable.username, username.toLowerCase()));
  if (!existingUser) {
    throw createError({
      message: 'Incorrect username or password',
      statusCode: 400,
    });
  }

  const validPassword = await new Argon2id().verify(
    existingUser[0].password,
    password,
  );
  if (!validPassword) {
    throw createError({
      message: 'Incorrect username or password',
      statusCode: 400,
    });
  }

  const session = await lucia.createSession(existingUser[0].id, {});
  appendResponseHeader(
    'Set-Cookie',
    lucia.createSessionCookie(session.id).serialize(),
  );

  return new Response(null, {
    status: 302,
    headers: {
      Location: '/',
    },
  });
}
