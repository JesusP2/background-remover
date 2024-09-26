import { action } from "@solidjs/router";
import { rateLimit } from "../rate-limiter";
import { getRequestEvent } from "solid-js/web";
import { changePasswordSchema, codeSchema, profileSchema } from "../schemas";
import { z } from "zod";
import { db } from "../db";
import { alphabet, generateRandomString } from "oslo/crypto";
import { ulid } from "ulidx";
import { createDate, isWithinExpirationDate, TimeSpan } from "oslo";
import { envs } from "../db/env-vars";
import { sendEmail } from "../email";
import { VerifyEmailEmail } from "../emails/verify-email";
import { emailVerificationTable, userTable } from "../db/schema";
import { and, eq } from "drizzle-orm";
import { Argon2id } from "oslo/password";
import { deleteUserSessions } from "../sessions";

export const changePasswordAction = action(async (formData: FormData) => {
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

export const verifyEmailAction = action(async (formData: FormData) => {
  const error = await rateLimit();
  if (error) {
    return {
      fieldErrors: {
        form: ["Too many requests"],
        code: [],
      },
    };
  }
  const event = getRequestEvent();
  const user = event?.locals.user;
  if (!user) {
    return null;
  }
  const submission = codeSchema.safeParse({
    code: formData.get("code"),
  });
  if (!submission.success) {
    const codeError = submission.error.flatten().fieldErrors.code?.at(0)
    return {
      fieldErrors: {
        form: [],
        code: [codeError || 'Invalid code'],
      },
    };
  }

  const [emailVerification] = await db
    .select()
    .from(emailVerificationTable)
    .where(
      and(
        eq(emailVerificationTable.code, submission.data.code),
        eq(emailVerificationTable.userId, user.id),
      ),
    );
  if (
    !emailVerification ||
    !isWithinExpirationDate(new Date(emailVerification.expiresAt))
  ) {
    return {
      fieldErrors: {
        form: [],
        code: ["Invalid code"],
      },
    };
  }

  try {
    await db.transaction(async (tx) => {
      await tx
        .delete(emailVerificationTable)
        .where(eq(emailVerificationTable.userId, user.id));
      await tx
        .update(userTable)
        .set({
          email: emailVerification.email,
        })
        .where(eq(userTable.id, user.id));
    });
    return null;
  } catch (err) {
    return {
      fieldErrors: {
        form: ["Something went wrong, please try again"],
        code: [],
      },
    };
  }
});

export const updateProfileAction = action(async (formData: FormData) => {
  "use server";
  try {
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
    const schema = profileSchema.superRefine((data, ctx) => {
      if (user.email && !data.email) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["email"],
          message: "Required field",
        });
      }
    });
    const submission = schema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
    });
    if (!submission.success) {
      return {
        fieldErrors: {
          form: [],
          ...submission.error.flatten().fieldErrors,
        },
      };
    }
    submission.data.email = submission.data.email
      ? submission.data.email
      : null;
    if (user.isOauth) {
      submission.data.email = null;
    }
    const isNameBeingUpdated = submission.data.name !== user.name;
    const isEmailBeingUpdated =
      typeof submission.data.email === "string" &&
      submission.data.email !== user.email;
    if (isEmailBeingUpdated) {
      const [user] = await db
        .select()
        .from(userTable)
        .where(eq(userTable.email, submission.data.email as string))
        .limit(1);
      if (user) {
        return {
          fieldErrors: {
            form: [],
            name: [],
            email: ["Email is already being used"],
          },
        };
      }
    }
    await db.transaction(async (tx) => {
      if (isNameBeingUpdated) {
        await tx
          .update(userTable)
          .set({
            name: submission.data.name,
          })
          .where(eq(userTable.id, user.id));
      }
      if (isEmailBeingUpdated) {
        const code = generateRandomString(6, alphabet("0-9"));
        await db
          .delete(emailVerificationTable)
          .where(eq(emailVerificationTable.userId, user.id));
        await tx.insert(emailVerificationTable).values({
          id: ulid(),
          code: code,
          userId: user.id,
          email: submission.data.email as string,
          expiresAt: createDate(new TimeSpan(15, "m")).toISOString(),
        });
        await sendEmail(
          submission.data.email as string,
          "Verify email",
          VerifyEmailEmail({
            code: code,
          }),
          envs.RESEND_API_KEY,
          envs.EMAIL_FROM,
        );
      }
    });
    if (isEmailBeingUpdated) {
      return {
        message: "email verification sent",
      };
    }
    return null;
  } catch (err) {
    console.error(err);
    return {
      fieldErrors: {
        form: ["Something went wrong, please try again"],
        username: [],
        email: [],
      },
    };
  }
});
