import { action } from "@solidjs/router";
import { authRateLimiter, rateLimit } from "../rate-limiter";
import { getRequestEvent } from "solid-js/web";
import { profileSchema } from "../schemas";
import { z } from "zod";
import { db } from "../db";
import { alphabet, generateRandomString } from "oslo/crypto";
import { ulid } from "ulidx";
import { createDate, TimeSpan } from "oslo";
import { envs } from "../db/env-vars";
import { sendEmail } from "../email";
import { VerifyEmailEmail } from "../emails/verify-email";
import { emailVerificationTable, userTable } from "../db/schema";
import { eq } from "drizzle-orm";

export const updateProfileAction = action(async (formData: FormData) => {
  "use server";
  try {
    const error = await rateLimit({
      rateLimiter: authRateLimiter
    });
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
      email: formData.get("email") || null,
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
    const isUpdatingName = submission.data.name !== user.name;
    const isUpdatingEmail =
      typeof submission.data.email === "string" &&
      submission.data.email !== user.email;
    if (isUpdatingEmail) {
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
    const code = generateRandomString(6, alphabet("0-9"));
    await db.transaction(async (tx) => {
      if (isUpdatingName) {
        await tx
          .update(userTable)
          .set({
            name: submission.data.name,
          })
          .where(eq(userTable.id, user.id));
      }
      if (isUpdatingEmail) {
        await tx
          .delete(emailVerificationTable)
          .where(eq(emailVerificationTable.userId, user.id));
        await tx.insert(emailVerificationTable).values({
          id: ulid(),
          code: code,
          userId: user.id,
          email: submission.data.email as string,
          expiresAt: createDate(new TimeSpan(15, "m")).toISOString(),
        });
      }
    });
    if (isUpdatingEmail) {
      await sendEmail(
        submission.data.email as string,
        "Verify email",
        VerifyEmailEmail({
          code: code,
        }),
        envs.RESEND_API_KEY,
        envs.EMAIL_FROM,
      );
      const fields = ['email']
      if (isUpdatingName) fields.push('name')
      return {
        fields,
      }
    }
    return {
      fields: ['name']
    };
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
