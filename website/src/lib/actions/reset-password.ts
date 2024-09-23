import { action, redirect } from "@solidjs/router";
import { rateLimit } from "../rate-limiter";
import { resetTokenSchema, validateResetTokenSchema } from "../schemas";
import { db } from "../db";
import { resetTokenTable, userTable } from "../db/schema";
import { eq } from "drizzle-orm";
import { sendEmail } from "../email";
import { ResetPasswordEmail } from "../emails/reset-password";
import { envs } from "../db/env-vars";
import { generateIdFromEntropySize } from "lucia";
import { encodeHex } from "oslo/encoding";
import { sha256 } from "oslo/crypto";
import { ulid } from "ulidx";
import { createDate, isWithinExpirationDate, TimeSpan } from "oslo";
import { getRequestEvent } from "solid-js/web";
import { createUserSession, deleteAllUserSessions } from "../sessions";
import { Argon2id } from "oslo/password";

export const resetPasswordConfirmationAction = action(
  async (formData: FormData) => {
    "use server";
    const error = await rateLimit();
    if (error) {
      return {
        fieldErrors: {
          form: ["Too many requests"],
          password: [],
          token: [],
        },
      };
    }

    const event = getRequestEvent();
    if (event?.locals.user) {
      throw redirect("/");
    }
    const submission = validateResetTokenSchema.safeParse({
      password: formData.get("password"),
      token: formData.get("token"),
    });
    if (!submission.success) {
      return {
        fieldErrors: {
          form: [],
          password: ["Invalid type"],
          token: ["Invalid type"],
        },
      };
    }
    const hashedToken = encodeHex(
      await sha256(new TextEncoder().encode(submission.data.token)),
    );
    const [record] = await db
      .select()
      .from(resetTokenTable)
      .where(eq(resetTokenTable.token, hashedToken));
    if (!record || !isWithinExpirationDate(new Date(record.expiresAt))) {
      return {
        fieldErrors: {
          form: [],
          password: [],
          token: ["Token expired"],
        },
      };
    }
    await deleteAllUserSessions(record.userId);
    const hashedPassword = await new Argon2id().hash(submission.data.password);
    db.update(userTable).set({
      password: hashedPassword,
    });
    await createUserSession(record.userId);
    throw redirect("/");
  },
);

export const resetPasswordEmailAction = action(async (formData: FormData) => {
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

  const submission = resetTokenSchema.safeParse({
    email: formData.get("email"),
  });
  if (!submission.success) {
    return {
      fieldErrors: {
        form: [],
        email: ["Invalid email"],
      },
    };
  }
  try {
    const [user] = await db
      .select()
      .from(userTable)
      .where(eq(userTable.email, submission.data.email))
      .limit(1);
    if (!user) {
      return {
        email: submission.data.email,
      };
    }
    await db.delete(resetTokenTable).where(eq(resetTokenTable.userId, user.id));
    const tokenId = generateIdFromEntropySize(25); // 40 character
    const tokenHash = encodeHex(
      await sha256(new TextEncoder().encode(tokenId)),
    );
    await db.insert(resetTokenTable).values({
      id: ulid(),
      token: tokenHash,
      userId: user.id,
      expiresAt: createDate(new TimeSpan(2, "h")).toISOString(),
    });
    const event = getRequestEvent();
    if (!event) {
      return {
        form: [],
        fieldErrors: {
          email: ["Something went wrong, please try again"],
        },
      };
    }
    const url = new URL(event?.request.url);
    await sendEmail(
      submission.data.email,
      "Reset password",
      ResetPasswordEmail({
        origin: url.origin,
        tokenId,
      }),
      envs.RESEND_API_KEY,
      envs.EMAIL_FROM,
    );
    return {
      email: submission.data.email,
    };
  } catch (err) {
    console.error(err);
    return {
      form: [],
      fieldErrors: {
        email: ["Something went wrong, please try again"],
      },
    };
  }
}, "reset-password");
