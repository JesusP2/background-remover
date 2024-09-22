import { action, redirect } from '@solidjs/router';
import { eq } from 'drizzle-orm';
import { Argon2id } from 'oslo/password';
import { db } from '../db';
import { userTable } from '../db/schema';
import { rateLimit } from '../rate-limiter';
import { signinSchema } from '../schemas';
import { createUserSession } from '../sessions';

export const signinAction = action(async (formData: FormData) => {
  'use server';
  const error = await rateLimit();
  if (error) {
    return {
      fieldErrors: {
        form: ['Too many requests'],
        username: [],
        password: [],
      },
    };
  }
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  const result = signinSchema.safeParse({ username, password });
  if (!result.success) {
    const errors = result.error.flatten().fieldErrors;
    return {
      fieldErrors: {
        form: [],
        username: errors.username,
        password: errors.password,
      },
    };
  }

  const [existingUser] = await db
    .select()
    .from(userTable)
    .where(eq(userTable.username, username.toLowerCase()));
  if (!existingUser || !existingUser.password) {
    return {
      fieldErrors: {
        form: [],
        username: ['Incorrect username or password'],
        password: ['Incorrect username or password'],
      },
    };
  }

  const validPassword = await new Argon2id().verify(
    existingUser.password,
    password,
  );
  if (!validPassword) {
    return {
      fieldErrors: {
        form: [],
        username: [],
        password: ['Invalid password'],
      },
    };
  }

  await createUserSession(existingUser.id)
  throw redirect('/');
}, 'signin-action');
