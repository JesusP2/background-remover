import { Navigate, createAsync, useParams } from '@solidjs/router';
import { and, eq, isNotNull } from 'drizzle-orm';
import { AiOutlineLoading } from 'solid-icons/ai';
import { Match, Switch, getRequestEvent } from 'solid-js/web';
import { Canvases } from '~/components/canvases';
import { db } from '~/lib/db';
import { type SelectImage, imageTable } from '~/lib/db/schema';
import { updateUrlsOfRecordIfExpired } from '~/lib/db/queries';

const getImages = async (id: string) => {
  'use server';
  const event = getRequestEvent();
  const session = event?.locals.session;
  const images = await db
    .select()
    .from(imageTable)
    .where(and(eq(imageTable.id, id), isNotNull(imageTable.deleted)));
  if (!images.length || session?.userId !== images[0].userId) return null;
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
