import {
  A,
  cache,
  createAsync,
  useAction,
  useSubmission,
  useSubmissions,
} from '@solidjs/router';
import { and, eq, isNull } from 'drizzle-orm';
import { createEffect } from 'solid-js';
import { For, getRequestEvent } from 'solid-js/web';
import { Navbar } from '~/components/nav';
import { showToast } from '~/components/ui/toast';
import { deleteImageAction } from '~/lib/actions/delete-image';
import { db } from '~/lib/db';
import { updateUrlsOfRecordIfExpired } from '~/lib/db/queries';
import { imageTable } from '~/lib/db/schema';

const getGallery = cache(async () => {
  'use server';
  const event = getRequestEvent();
  const session = event?.locals.session;
  const userId = session?.userId;
  if (!userId) return [];
  const userImages = await db
    .select()
    .from(imageTable)
    .where(and(eq(imageTable.userId, userId), isNull(imageTable.deleted)));

  await db.transaction(async (tx) => {
    for (let i = 0; i < userImages.length; i++) {
      const userImage = userImages[i];
      // @ts-ignore shut up
      const updatedImages = await updateUrlsOfRecordIfExpired(userImage, tx);
      userImages.splice(i, 1, {
        ...userImage,
        ...updatedImages,
      });
    }
  });
  return userImages;
}, 'my-gallery');

export const route = {
  load: () => getGallery(),
};

export default function MyGallery() {
  const deleteImageState = useSubmission(deleteImageAction);
  const gallery = createAsync(() => getGallery());

  createEffect(() => {
    if (deleteImageState.result instanceof Error) {
      showToast({
        variant: 'destructive',
        title: 'Unexpected error',
        description: deleteImageState.result.message,
        duration: 10_000,
      });
    }
  });
  return (
    <>
      <Navbar />
      <main class="mt-10">
        <h1 class="font-geist text-4xl font-semibold mb-10 max-w-7xl mx-auto">
          My Gallery
        </h1>
        <div class="grid md:grid-cols-[repeat(auto-fill,_minmax(16rem,_1fr))] max-w-7xl mx-auto gap-8">
          <For each={gallery()}>
            {(image) => (
              <div class="w-full md:w-64 mx-auto">
                <div class="group relative w-full h-[30rem] md:h-44 grid place-items-center border-[1px] rounded-sm shadow-sm">
                  <img
                    src={image.source}
                    alt={image.name}
                    class="max-w-[100%] max-h-[100%]"
                  />
                  <A
                    href={`/canvas/${image.id}`}
                    class="group-hover:visible invisible absolute w-full h-[30rem] md:h-44 bg-white bg-opacity-90 grid place-items-center"
                  >
                    <span class="font-gabarito text-blue-500 font-semibold">
                      Go to editor
                    </span>
                  </A>
                </div>
                <div class="flex justify-between pl-2 mt-1">
                  <div
                    class="text-xs max-w-[150px] truncate text-zinc-600 font-geist mt-[8px]"
                    title={image.name}
                  >
                    {image.name}
                  </div>
                  <div class="flex gap-x-2">
                    <a
                      href={image.result}
                      download={image.name}
                      class="hover:bg-blue-500 rounded-sm p-2 h-[30px] w-[30px] download-icon"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="15"
                        height="15"
                        fill="#000000"
                        viewBox="0 0 256 256"
                      >
                        <title>download {image.name}</title>
                        <path d="M224,144v64a8,8,0,0,1-8,8H40a8,8,0,0,1-8-8V144a8,8,0,0,1,16,0v56H208V144a8,8,0,0,1,16,0Zm-101.66,5.66a8,8,0,0,0,11.32,0l40-40a8,8,0,0,0-11.32-11.32L136,124.69V32a8,8,0,0,0-16,0v92.69L93.66,98.34a8,8,0,0,0-11.32,11.32Z" />
                      </svg>
                    </a>
                    <form action={deleteImageAction} method="post">
                      <input name="id" value={image.id} hidden />
                      <button
                        disabled={deleteImageState.pending}
                        type="submit"
                        class="hover:bg-red-500 rounded-sm p-2 h-[30px] w-[30px] delete-icon disabled:hover:bg-zinc-100"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="15"
                          height="15"
                          fill="#000000"
                          viewBox="0 0 256 256"
                        >
                          <title>delete {image.name}</title>
                          <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z" />
                        </svg>
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}
          </For>
        </div>
      </main>
    </>
  );
}
