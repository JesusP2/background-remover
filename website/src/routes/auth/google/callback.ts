import type { APIHandler } from '@solidjs/start/server';
import { and, eq } from 'drizzle-orm';
import { ulid } from 'ulidx';
import { getCookie } from 'vinxi/http';
import { google } from '~/lib/auth';
import { db } from '~/lib/db';
import { oauthAccountTable, userTable } from '~/lib/db/schema';
import { createUserSession } from '../../../lib/sessions';

export const GET: APIHandler = async ({ request }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get('code')?.toString() ?? null;
  const state = url.searchParams.get('state')?.toString() ?? null;
  const storedState = getCookie('google_oauth_state') ?? null;
  if (!code || !state || !storedState || state !== storedState) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/auth/signin',
      },
    });
  }

  try {
    const tokens = await google.validateAuthorizationCode(code, state);
    const googleUserResponse = await fetch(
      'https://openidconnect.googleapis.com/v1/userinfo',
      {
        headers: {
          Authorization: `Bearer ${tokens.accessToken}`,
        },
      },
    );
    const googleUser: GoogleUser = await googleUserResponse.json();
    const [existingUser] = await db
      .select()
      .from(oauthAccountTable)
      .where(
        and(
          eq(oauthAccountTable.providerId, 'google'),
          eq(oauthAccountTable.providerUserId, googleUser.sub),
        ),
      );
    if (existingUser) {
      await createUserSession(existingUser.userId);
      return new Response(null, {
        status: 302,
        headers: {
          Location: '/',
        },
      });
    }
    const userId = ulid();
    await db.transaction(async (tx) => {
      const oauthId = ulid();
      await tx.insert(oauthAccountTable).values({
        id: oauthId,
        userId: userId,
        providerId: 'google',
        providerUserId: googleUser.sub,
      });
      await tx.insert(userTable).values({
        id: userId,
        username: null,
        name: googleUser.name,
        email: null,
        password: null,
      });
    });
    await createUserSession(userId);
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/',
      },
    });
  } catch (err) {
    console.error(err);
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/auth/signin',
      },
    });
  }
};

interface GoogleUser {
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  email: string;
  email_verified: boolean;
}
