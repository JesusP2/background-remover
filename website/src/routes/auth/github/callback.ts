import type { APIHandler } from '@solidjs/start/server';
import { and, eq } from 'drizzle-orm';
import { ulid } from 'ulidx';
import { getCookie } from 'vinxi/http';
import { github } from '~/lib/auth';
import { db } from '~/lib/db';
import { oauthAccountTable, userTable } from '~/lib/db/schema';
import { createUserSession } from '../../../lib/sessions';

export const GET: APIHandler = async ({ request }) => {
  const url = new URL(request.url);
  const code = url.searchParams.get('code')?.toString() ?? null;
  const state = url.searchParams.get('state')?.toString() ?? null;
  const storedState = getCookie('github_oauth_state') ?? null;
  if (!code || !state || !storedState || state !== storedState) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: '/auth/signin',
      },
    });
  }

  try {
    const tokens = await github.validateAuthorizationCode(code);
    const githubUserResponse = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${tokens.accessToken}`,
      },
    });
    const githubUser: GitHubUser = await githubUserResponse.json();
    const [existingUser] = await db
      .select()
      .from(oauthAccountTable)
      .where(
        and(
          eq(oauthAccountTable.providerId, 'github'),
          eq(oauthAccountTable.providerUserId, githubUser.id),
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
        providerId: 'github',
        providerUserId: githubUser.id,
      });
      await tx.insert(userTable).values({
        id: userId,
        username: null,
        name: githubUser.login,
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

interface GitHubUser {
  id: string;
  login: string;
  avatar_url: string;
  email: string | null;
}
