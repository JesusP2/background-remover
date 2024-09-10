import { action, redirect } from "@solidjs/router";
import { eq } from "drizzle-orm";
import { Argon2id } from "oslo/password";
import { appendResponseHeader } from "vinxi/http";
import { lucia } from "../auth";
import { db } from "../db";
import { userTable } from "../db/schema";
import { rateLimit } from "../rate-limiter";
import { signinSchema } from "../schemas";

export const signinAction = action(async (formData: FormData) => {
  "use server";
  const error = await rateLimit();
  if (error) {
    return {
      fieldErrors: {
        form: ["Too many requests"],
        username: [],
        password: [],
      },
    };
  }
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
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

  const existingUser = await db
    .select()
    .from(userTable)
    .where(eq(userTable.username, username.toLowerCase()));
  if (!existingUser) {
    return {
      fieldErrors: {
        form: [],
        username: ["Incorrect username or password"],
        password: ["Incorrect username or password"],
      },
    };
  }

  const validPassword = await new Argon2id().verify(
    existingUser[0].password,
    password,
  );
  if (!validPassword) {
    return {
      fieldErrors: {
        form: [],
        username: [],
        password: ["Invalid password"],
      },
    };
  }

  const session = await lucia.createSession(existingUser[0].id, {});
  appendResponseHeader(
    "Set-Cookie",
    lucia.createSessionCookie(session.id).serialize(),
  );

  throw redirect("/");
}, "signin-action");
