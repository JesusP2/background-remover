import { action, redirect } from "@solidjs/router";
import { eq } from "drizzle-orm";
import { generateId } from "lucia";
import { Argon2id } from "oslo/password";
import { setCookie } from "vinxi/http";
import { lucia } from "~/lib/auth";
import { db } from "~/lib/db";
import { userTable } from "~/lib/db/schema";
import { rateLimit } from "../rate-limiter";
import { signupSchema } from "../schemas";

export const signupAction = action(async (formData: FormData) => {
  "use server";
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
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
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
        username: ["Username already exists"],
        password: [],
      },
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

  throw redirect("/");
});
