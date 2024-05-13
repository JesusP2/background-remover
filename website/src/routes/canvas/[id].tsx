import { A, Navigate, createAsync, useParams } from '@solidjs/router';
import { and, eq, isNull } from 'drizzle-orm';
import { AiOutlineLoading } from 'solid-icons/ai';
import { Match, Switch, getRequestEvent } from 'solid-js/web';
import { Canvases } from '~/components/canvases';
import { db } from '~/lib/db';
import { updateUrlsOfRecordIfExpired } from '~/lib/db/queries';
import { type SelectImage, imageTable } from '~/lib/db/schema';
import { AiOutlineClose } from 'solid-icons/ai';
import { rateLimit } from '~/lib/rate-limiter';

const getImages = async (id: string) => {
  'use server';
  const error = await rateLimit();
  if (error) {
    return error;
  }
  const event = getRequestEvent();
  const userId = event?.locals.userId;
  const images = await db
    .select()
    .from(imageTable)
    .where(and(eq(imageTable.id, id), isNull(imageTable.deleted)));
  if (!images.length || userId !== images[0].userId) return null;
  const updatedRecord = await updateUrlsOfRecordIfExpired(images[0], db);
  return {
    ...images[0],
    ...updatedRecord,
  };
};

export const route = {
  load: (event: { params: { id: string } }) => getImages(event.params.id),
};

export default function Home() {
  const { id } = useParams();
  const image = createAsync(() => getImages(id));
  return (
    <main class="flex">
      <Switch>
        <Match when={image()}>
          <div class="rounded-sm px-2 py-1 bg-white absolute top-0 right-0 flex gap-x-4 items-center">
            <A href="/my-gallery">
              <AiOutlineClose size={20} />
            </A>
          </div>
          <Canvases img={image() as SelectImage} />
        </Match>
        <Match when={image() === null}>
          <Navigate href="/" />
        </Match>
        <Match when={!image()}>
          <AiOutlineLoading class="animate-spin" />
        </Match>
      </Switch>
    </main>
  );
}
