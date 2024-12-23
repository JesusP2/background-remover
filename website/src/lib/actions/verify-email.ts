import { action } from "@solidjs/router";
import { getRequestEvent } from "solid-js/web";
import { codeSchema } from "../schemas";
import { db } from "../db";
import { emailVerificationTable, userTable } from "../db/schema";
import { and, eq } from "drizzle-orm";
import { isWithinExpirationDate } from "oslo";

export const verifyEmailAction = action(async (formData: FormData) => {
  "use server";
  const event = getRequestEvent();
  const user = event?.locals.user;
  if (!user) {
    return {
      message: null,
    };
  }
  const submission = codeSchema.safeParse({
    code: formData.get("code"),
  });
  if (!submission.success) {
    const codeError = submission.error.flatten().fieldErrors.code?.at(0);
    return {
      fieldErrors: {
        form: [],
        code: [codeError || "Invalid code"],
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
    return {
      message: null,
    };
  } catch (err) {
    console.error(err);
    return {
      fieldErrors: {
        form: ["Something went wrong, please try again"],
        code: [],
      },
    };
  }
}, "verify-email");
