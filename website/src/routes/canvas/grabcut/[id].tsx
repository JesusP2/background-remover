import {
  A,
  Navigate,
  createAsync,
  useAction,
  useParams,
} from '@solidjs/router';
import { and, eq, isNull } from 'drizzle-orm';
import { AiOutlineLoading } from 'solid-icons/ai';
import { VsClose } from 'solid-icons/vs';
import { createSignal, onMount } from 'solid-js';
import { Match, Switch, getRequestEvent } from 'solid-js/web';
import { Canvases } from '~/components/canvases';
import { buttonVariants } from '~/components/ui/button';
import { db } from '~/lib/db';
import { type SelectImage, imageTable } from '~/lib/db/schema';
import { createPresignedUrl } from '~/lib/r2';
import { rateLimit } from '~/lib/rate-limiter';
import { cn } from '~/lib/utils';
import initialFileSignal from '~/lib/stores/initial-file';
import { createPresignedUrlAction } from '~/lib/actions/create-presigned-url';
import { uploadImageAction } from '~/lib/actions/init-image-process';

const getImages = async (id: string) => {
  'use server';
  const error = await rateLimit();
  if (error) {
    return error;
  }
  const event = getRequestEvent();
  const userId = event?.locals.userId;
  const [image] = await db
    .select()
    .from(imageTable)
    .where(and(eq(imageTable.id, id), isNull(imageTable.deleted)));
  if (userId !== image?.userId) return null;
  const imagesResults = await Promise.allSettled([
    createPresignedUrl(image.result),
    createPresignedUrl(image.source),
    createPresignedUrl(image.mask),
  ]);
  image.result =
    imagesResults[0].status === 'fulfilled' ? imagesResults[0].value : '';
  image.source =
    imagesResults[1].status === 'fulfilled' ? imagesResults[1].value : '';
  image.mask =
    imagesResults[2]?.status === 'fulfilled' ? imagesResults[2].value : '';
  return image;
};

export const route = {
  load: (event: { params: { id: string } }) => getImages(event.params.id),
};

export default function Page() {
  const { id } = useParams();
  const image = createAsync(() => getImages(id));
  const createPresignedUrl = useAction(createPresignedUrlAction);
  const uploadImage = useAction(uploadImageAction);
  const [savedFile, setSavedFile] = createSignal<null | SelectImage>(null);
  const [initialFile] = initialFileSignal;
  const file = initialFile();
  if (file !== null) {
    const url = URL.createObjectURL(file);
    setSavedFile({
      source: url,
      result: url,
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      mask: null as any,
      name: file.name,
    } as SelectImage);

    Promise.all([
      createPresignedUrl(`${id}-${file.name}`, file.type, file.size),
      createPresignedUrl(`${id}-result.png`, file.type, file.size),
    ]).then(([fileUrl, resultUrl]) => {
      if (!fileUrl || !resultUrl) return;
      Promise.all([
        fetch(fileUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        }),
        fetch(resultUrl, {
          method: 'PUT',
          body: file,
          headers: {
            'Content-Type': file.type,
          },
        }),
        uploadImage(id, file.name),
      ]);
    });
  }
  return (
    <main class="flex">
      <Switch>
        <Match when={savedFile() || image()}>
          <div class="rounded-sm px-2 py-1 bg-white absolute top-0 right-0 flex gap-x-4 items-center">
            <A
              href="/my-gallery"
              class={cn(buttonVariants({ variant: 'outline' }))}
            >
              <VsClose size={20} />
            </A>
          </div>
          <Canvases img={(savedFile() || image()) as SelectImage} />
        </Match>
        <Match when={!image()}>
          <AiOutlineLoading class="animate-spin" />
        </Match>
      </Switch>
    </main>
  );
}
