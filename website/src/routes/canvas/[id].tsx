import {
  useParams,
  createAsync,
  Navigate,
} from '@solidjs/router';
import { AiOutlineLoading } from 'solid-icons/ai'
import { Match, Switch, getRequestEvent } from 'solid-js/web';
import { Canvases } from '~/components/canvases';
import { imageTable } from '~/lib/db/schema';
import { eq } from 'drizzle-orm';
import { db } from '~/lib/db';

const getImages = async (id: string) => {
  'use server';
  const event = getRequestEvent();
  const session = event?.locals.session;
  const images = await db
    .select()
    .from(imageTable)
    .where(eq(imageTable.id, id));
  if (!images.length || session?.userId !== images[0].userId) return null;
  return images[0];
};

export default function Home() {
  const { id } = useParams();
  const image = createAsync(() => getImages(id))
  return (
    <main class="flex">
      <Switch>
        <Match when={image()}>
          <Canvases img={image()} />
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
