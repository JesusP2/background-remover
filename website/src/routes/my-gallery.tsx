import { BsArchive } from 'solid-icons/bs';
import { A, cache, createAsync, useSubmission } from '@solidjs/router';
import { and, eq, isNull } from 'drizzle-orm';
import { Show, createEffect } from 'solid-js';
import { For, getRequestEvent } from 'solid-js/web';
import { Navbar } from '~/components/nav';
import { toaster } from '@kobalte/core';
import {
  Toast,
  ToastContent,
  ToastDescription,
  ToastProgress,
  ToastTitle,
} from '~/components/ui/toast';
import { deleteImageAction } from '~/lib/actions/delete-image';
import { db } from '~/lib/db';
import { imageTable } from '~/lib/db/schema';
import { rateLimit } from '~/lib/rate-limiter';
import { createPresignedUrl } from '~/lib/r2';

const getGallery = cache(async () => {
  'use server';
  const error = await rateLimit();
  if (error) {
    return [];
  }
  const event = getRequestEvent();
  const userId = event?.locals.userId;
  if (!userId) return [];
  const userImages = await db
    .select()
    .from(imageTable)
    .where(and(eq(imageTable.userId, userId), isNull(imageTable.deleted)));

  const userImagesPromises = userImages.map(async (image) => {
    const imagesResults = await Promise.allSettled([
      createPresignedUrl(image.result),
      createPresignedUrl(image.source),
      image.mask && createPresignedUrl(image.mask),
    ]);
    image.result =
      imagesResults[0].status === 'fulfilled' ? imagesResults[0].value : '';
    image.source =
      imagesResults[1].status === 'fulfilled' ? imagesResults[1].value : '';
    image.mask =
      imagesResults[2].status === 'fulfilled' ? imagesResults[2].value : null;
    return image;
  });
  const userImagesResults = await Promise.allSettled(userImagesPromises);
  return userImagesResults
    .filter((result) => result.status === 'fulfilled')
    .map((result) => result.value);
}, 'my-gallery');

export const route = {
  load: () => getGallery(),
};

export default function MyGallery() {
  const deleteImageState = useSubmission(deleteImageAction);
  const gallery = createAsync(() => getGallery());

  createEffect(() => {
    if (deleteImageState.result instanceof Error) {
      toaster.show((props) => (
        <Toast toastId={props.toastId}>
          <ToastContent>
            <ToastTitle>Unexpected error</ToastTitle>
            <ToastDescription>
              {deleteImageState.result?.message}
            </ToastDescription>
          </ToastContent>
          <ToastProgress />
        </Toast>
      ));
    }
  });
  return (
    <>
      <Navbar route="/my-gallery" />
      <main class="mt-10">
        <h1 class="font-geist text-4xl font-semibold mb-10 max-w-7xl mx-10 xl:mx-auto">
          My Gallery
        </h1>
        <Show when={!gallery()?.length}>
          <div class="flex justify-center rounded-xs py-4 max-w-7xl mx-10 xl:mx-auto">
            <div class="items-center flex flex-col text-zinc-400">
              <BsArchive size={30} />
              <p>Empty</p>
            </div>
          </div>
        </Show>
        <div class="grid md:grid-cols-[repeat(auto-fill,_minmax(16rem,_1fr))] max-w-7xl mx-4 md:mx-10 xl:mx-auto gap-8">
          <For each={gallery()}>
            {(image) => (
              <div class="md:w-64 max-md:w-full mx-auto mb-4 md:mb-0">
                <div class="group relative h-full w-full border-[1px] rounded-sm shadow-sm grid place-items-center">
                  <img
                    src={image.source}
                    alt={image.name}
                    class="max-w-[100%]  max-h-[100%] h-96 md:h-44 object-contain"
                  />
                  <A
                    href={`/canvas/grabcut/${image.id}`}
                    class="group-hover:visible invisible top-0 absolute w-full h-full bg-white bg-opacity-90 grid place-items-center"
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
