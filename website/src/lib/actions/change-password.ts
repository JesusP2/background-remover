import { action } from "@solidjs/router";
import { rateLimit } from "../rate-limiter";
import { getRequestEvent } from "solid-js/web";
import { changePasswordSchema } from "../schemas";
import { db } from "../db";
import { userTable } from "../db/schema";
import { eq } from "drizzle-orm";
import { Argon2id } from "oslo/password";
import { deleteUserSessions } from "../sessions";

export const changePasswordAction = action(async (formData: FormData) => {
  'use server';
  const error = await rateLimit();
  if (error) {
    return {
      fieldErrors: {
        form: ["Too many requests"],
        name: [],
        email: [],
      },
    };
  }
  const event = getRequestEvent();
  const user = event?.locals.user;
  if (!user) {
    return null;
  }
  const submission = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
  });
  if (!submission.success) {
    return {
      fieldErrors: {
        form: [],
        ...submission.error?.flatten().fieldErrors,
      },
    };
  }
  try {
    const [userRecord] = await db
      .select()
      .from(userTable)
      .where(eq(userTable.id, user.id));
    const hashedPassword = await new Argon2id().hash(
      submission.data.currentPassword,
    );
    if (!user || userRecord.password !== hashedPassword) {
      return {
        fieldErrors: {
          form: [],
          newPassword: [],
          currentPassword: ["Invalid password"],
        },
      };
    }
    await db
      .update(userTable)
      .set({
        password: await new Argon2id().hash(submission.data.newPassword),
      })
      .where(eq(userTable.id, user.id));
    await deleteUserSessions(user.id);
    return null;
  } catch (err) {
    console.error(err);
    return {
      fieldErrors: {
        form: ["Unexpected error"],
        currentPassword: [],
        newPassword: [],
      },
    };
  }
});
