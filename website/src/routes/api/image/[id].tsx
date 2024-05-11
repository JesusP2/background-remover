import type { APIHandler } from '@solidjs/start/server';
import { eq } from 'drizzle-orm';
import { getRequestEvent } from 'solid-js/web';
import { db } from '~/lib/db';
import { imageTable } from '~/lib/db/schema';

export const GET: APIHandler = async (event) => {
  const { id } = event.params;
  const req = getRequestEvent()
  const userId = req?.locals.userId
  if (!userId) {
    return new Response(null, { status: 401 });
  }

  const images = await db
    .select()
    .from(imageTable)
    .where(eq(imageTable.id, id));
  if (userId !== images[0].userId)
    return new Response(null, { status: 401 });
  if (!images.length) return new Response(null, { status: 404 });
  return new Response(JSON.stringify(images[0]), {
    status: 200,
  });
};
