import type { APIHandler } from "@solidjs/start/server";
import { eq } from "drizzle-orm";
import { isWithinExpirationDate } from "oslo";
import { sha256 } from "oslo/crypto";
import { encodeHex } from "oslo/encoding";
import { db } from "~/lib/db";
import { magicLinkTable } from "~/lib/db/schema";
import { validateResetTokenSchema } from "~/lib/schemas";
import { createUserSession, deleteAllUserSessions } from "~/lib/sessions";

export const GET: APIHandler = async ({ locals, params }) => {
  try {
    if (locals.user) {
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/",
        },
      });
    }
    const submission = validateResetTokenSchema
      .omit({
        password: true,
      })
      .safeParse({
        token: params.token,
      });
    if (!submission.success) {
      return new Response("Invalid token", {
        status: 400,
      });
    }
    const hashedToken = encodeHex(
      await sha256(new TextEncoder().encode(submission.data.token)),
    );
    const [record] = await db
      .select()
      .from(magicLinkTable)
      .where(eq(magicLinkTable.token, hashedToken));
    if (!record || !isWithinExpirationDate(new Date(record.expiresAt))) {
      return new Response("Token expired", {
        status: 400,
      })
    }
    await deleteAllUserSessions(record.userId);
    await createUserSession(record.userId);
    return new Response(null, {
      status: 302,
      headers: {
        Location: "/",
      },
    });
  } catch (err) {
    console.error(err);
    return new Response("Something went wrong, please try again", {
      status: 400,
    });
  }
};
