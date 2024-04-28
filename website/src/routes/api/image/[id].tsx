import type { APIHandler } from '@solidjs/start/server';
import { eq } from 'drizzle-orm';
import { getCookie } from 'vinxi/http';
import { lucia } from '~/lib/auth';
import { db } from '~/lib/db';
import { imageTable } from '~/lib/db/schema';

export const GET: APIHandler = async (event) => {
  console.log('--------------------get image by id---------------------');
  const { id } = event.params;
  const sessionId = getCookie(lucia.sessionCookieName) ?? null;
  console.log('get sessionId:', sessionId);
  if (!sessionId) {
    return new Response(null, { status: 401 });
  }

  const { session } = await lucia.validateSession(sessionId);
  console.log('ksadksa:', session);
  const images = await db
    .select()
    .from(imageTable)
    .where(eq(imageTable.id, id));
  console.log('id:', id, images.length, event.locals);
  if (!session?.userId || session?.userId !== images[0].userId)
    return new Response(null, { status: 401 });
  if (!images.length) return new Response(null, { status: 404 });
  return new Response(JSON.stringify(images[0]), {
    status: 200,
  });
};
