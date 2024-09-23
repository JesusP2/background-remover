import { action } from "@solidjs/router";
import { rateLimit } from "../rate-limiter";
import { resetTokenSchema } from "../schemas";
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
import { createDate, TimeSpan } from "oslo";
import { getRequestEvent } from "solid-js/web";

export const resetPasswordAction = action(async (formData: FormData) => {
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
  console.log("hit x1");

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
  console.log("hit x2");
  try {
    const [user] = await db
      .select()
      .from(userTable)
      .where(eq(userTable.email, submission.data.email))
      .limit(1);
    console.log("hit x3", user);
    if (!user) {
      return {
        email: submission.data.email,
      };
    }
    await db.delete(resetTokenTable).where(eq(resetTokenTable.userId, user.id));
    console.log("hit x4", user);
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
    console.log("hit x5", user);
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
