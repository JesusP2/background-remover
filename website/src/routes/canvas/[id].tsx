import { useCanvas } from '~/lib/canvas';
import { ActionsMenu } from '~/components/actions-menu';
import {
  A,
  Navigate,
  cache,
  createAsync,
  redirect,
  useParams,
} from '@solidjs/router';
import { getRequestEvent } from 'solid-js/web';
import { db } from '~/lib/db';
import { imageTable } from '~/lib/db/schema';
import { eq } from 'drizzle-orm';

const getImages = async () => {
  'use server';
  const event = getRequestEvent();
  const id = event?.request.url.split('/').pop();
  if (!id) return null;
  const session = event?.locals.session;
  const images = await db
    .select()
    .from(imageTable)
    .where(eq(imageTable.id, id));
  if (!images.length || session?.userId !== images[0].userId) return null;
  return images[0];
};

export const route = {
  load: () => getImages(),
};
export default function Home() {
  const image = createAsync(() => getImages());
  const img = image();
  if (img === null) return <Navigate href="/" />;
  if (!img) return <div>Loading...</div>;
  const { source, mask, result } = img;
  const {
    setCurrentMode,
    applyMaskToImage,
    undo,
    redo,
    actions,
    redoActions,
  } = useCanvas({
    sourceUrl: source,
    maskUrl: mask,
    resultUrl: result,
  });
  return (
    <>
      <main class="flex">
        <ActionsMenu
          applyMaskToImage={applyMaskToImage}
          setCurrentMode={setCurrentMode}
          undo={undo}
          redo={redo}
          actions={actions}
          redoActions={redoActions}
        />
        <canvas class="w-[49.95%] h-screen svg-bg" id="source" />
        <div class="h-screen w-[0.1%] bg-zinc-400" />
        <canvas class="w-[49.95%] h-screen svg-bg" id="destination" />
      </main>
    </>
  );
}
