import { APIEvent } from '@solidjs/start/server';
import { lucia } from '~/lib/auth';
import { generateId } from 'lucia';
import { Argon2id } from 'oslo/password';
import { db } from '~/lib/db';
import { userTable } from '~/lib/db/schema';
import { setCookie } from 'vinxi/http';

export async function POST(event: APIEvent) {
  const formData = await event.request.formData();
  const username = formData.get('username');
  if (
    typeof username !== 'string' ||
    username.length < 3 ||
    username.length > 31 ||
    !/^[a-z0-9_-]+$/.test(username)
  ) {
    return new Response('Invalid username', {
      status: 400,
    });
  }
  const password = formData.get('password');
  if (
    typeof password !== 'string' ||
    password.length < 6 ||
    password.length > 255
  ) {
    return new Response('Invalid password', {
      status: 400,
    });
  }

  const userId = generateId(15);
  const hashedPassword = await new Argon2id().hash(password);

  // TODO: check if username is already used
  await db.insert(userTable).values({
    id: userId,
    username: username,
    password: hashedPassword,
  });

  const session = await lucia.createSession(userId, {});
  const sessionCookie = lucia.createSessionCookie(session.id);
  setCookie(
    event.nativeEvent,
    sessionCookie.name,
    sessionCookie.value,
    sessionCookie.attributes,
  );

  return new Response(null, {
    status: 302,
    headers: {
      Location: '/',
    },
  });
}
