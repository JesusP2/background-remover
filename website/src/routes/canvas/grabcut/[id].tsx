import {
  A,
  createAsync,
  useParams,
} from '@solidjs/router';
import { and, eq, isNull } from 'drizzle-orm';
import { AiOutlineLoading } from 'solid-icons/ai';
import { VsClose } from 'solid-icons/vs';
import { createSignal } from 'solid-js';
import { Match, Switch, getRequestEvent } from 'solid-js/web';
import { Canvases } from '~/components/canvases';
import { buttonVariants } from '~/components/ui/button';
import { db } from '~/lib/db';
import { type SelectImage, imageTable } from '~/lib/db/schema';
import { createReadPresignedUrl } from '~/lib/r2';
import { rateLimit } from '~/lib/rate-limiter';
import { cn } from '~/lib/utils';
import initialFileSignal from '~/lib/stores/initial-file';
import { imageNames } from '~/lib/constants';

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
    .where(and(eq(imageTable.id, id), isNull(imageTable.deleted))) as [SelectImage];
  if (userId !== image?.userId) return null;
  const imagesResults = await Promise.allSettled([
    createReadPresignedUrl(`${id}-${imageNames.result}`),
    createReadPresignedUrl(`${id}-${image.name}`),
    createReadPresignedUrl(`${id}-${imageNames.mask}`),
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
  const [initialFileState, setInitialFileState] =
    createSignal<null | SelectImage>(null);
  const [initialFile, setInitialFile] = initialFileSignal;
  const file = initialFile();
  if (file !== null) {
    const url = URL.createObjectURL(file);
    setInitialFileState({
      source: url,
      result: url,
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      mask: null as any,
      name: file.name,
    } as SelectImage);
    setInitialFile(null)
  }

  return (
    <main class="flex">
      <Switch>
        <Match when={initialFileState() || image()}>
          <div class="rounded-sm px-2 py-1 bg-white absolute top-0 right-0 flex gap-x-4 items-center">
            <A
              href="/my-gallery"
              class={cn(buttonVariants({ variant: 'outline' }))}
            >
              <VsClose size={20} />
            </A>
          </div>
          <Canvases img={(initialFileState() || image()) as SelectImage} />
        </Match>
        <Match when={!image()}>
          <AiOutlineLoading class="animate-spin" />
        </Match>
      </Switch>
    </main>
  );
}
