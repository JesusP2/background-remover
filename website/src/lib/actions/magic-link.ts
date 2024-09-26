import { action } from "@solidjs/router";
import { rateLimit } from "../rate-limiter";
import { resetTokenSchema } from "../schemas";
import { db } from "../db";
import { magicLinkTable, userTable } from "../db/schema";
import { eq } from "drizzle-orm";
import { generateIdFromEntropySize } from "lucia";
import { encodeHex } from "oslo/encoding";
import { sha256 } from "oslo/crypto";
import { ulid } from "ulidx";
import { createDate, TimeSpan } from "oslo";
import { getRequestEvent } from "solid-js/web";
import { sendEmail } from "../email";
import { MagicLinkEmail } from "../emails/magic-link";
import { envs } from "../db/env-vars";

export const createMagicLinkAction = action(async (formData: FormData) => {
  "use server";
  try {
    const error = await rateLimit();
    if (error) {
      return {
        fieldErrors: {
          form: ["Too many requests"],
          email: [],
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
    await db.delete(magicLinkTable).where(eq(magicLinkTable.userId, user.id));
    const tokenId = generateIdFromEntropySize(25); // 40 character
    const tokenHash = encodeHex(
      await sha256(new TextEncoder().encode(tokenId)),
    );
    await db.insert(magicLinkTable).values({
      id: ulid(),
      token: tokenHash,
      userId: user.id,
      expiresAt: createDate(new TimeSpan(2, "h")).toISOString(),
    });
    const event = getRequestEvent();
    if (!event) {
      return {
        fieldErrors: {
          form: ["Something went wrong, please try again"],
          email: [],
        },
      };
    }
    const url = new URL(event?.request.url);
    await sendEmail(
      submission.data.email,
      "Magic Link",
      MagicLinkEmail({
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
      fieldErrors: {
        form: ["Something went wrong, please try again"],
        email: [],
      },
    };
  }
});
