import { action, redirect } from '@solidjs/router';
import { eq } from 'drizzle-orm';
import { generateId } from 'lucia';
import { Argon2id } from 'oslo/password';
import { db } from '~/lib/db';
import { userTable } from '~/lib/db/schema';
import { signupSchema } from '../schemas';
import { createUserSession } from '../sessions';

export const signupAction = action(async (formData: FormData) => {
  'use server';
  const username = formData.get('username') as string;
  const password = formData.get('password') as string;
  const result = signupSchema.safeParse({ username, password });
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
      fieldErrors: {
        form: [],
        username: ['Username already exists'],
        password: [],
      },
    };
  }
  await db.insert(userTable).values({
    id: userId,
    username: username,
    name: username,
    password: hashedPassword,
  });

  await createUserSession(userId);
  throw redirect('/');
});
