import { cache, createAsync } from '@solidjs/router';
import { eq } from 'drizzle-orm';
import { For, getRequestEvent } from 'solid-js/web';
import { db } from '~/lib/db';
import { imageTable } from '~/lib/db/schema';
import { updateUrlsOfRecordIfExpired } from '~/lib/db/queries';

const getGallery = cache(async () => {
  'use server';
  const event = getRequestEvent();
  const session = event?.locals.session;
  const userId = session?.userId;
  if (!userId) return [];
  const userImages = await db
    .select()
    .from(imageTable)
    .where(eq(imageTable.userId, userId));

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
  const gallery = createAsync(() => getGallery());
  return (
    <div class="px-10">
      <h1>My Gallery</h1>
      <div class="grid md:grid-cols-[repeat(auto-fill,_minmax(16rem,_1fr))] max-w-7xl mx-auto gap-4">
        <For each={gallery()}>
          {(image) => (
            <div class="w-full md:w-64 mx-auto">
              <div class="w-full h-[30rem] md:h-44 grid place-items-center border-[1px] rounded-sm shadow-sm">
                <img
                  src={image.source}
                  alt={image.name}
                  class="max-w-[100%] max-h-[100%]"
                />
              </div>
              <div class="flex justify-between px-2 mt-3">
                <div
                  class="text-xs max-w-[150px] truncate text-zinc-600 font-geist"
                  title={image.name}
                >
                  {image.name}
                </div>
                <div class="flex gap-x-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="15"
                    height="15"
                    fill="#000000"
                    viewBox="0 0 256 256"
                  >
                    <path d="M224,144v64a8,8,0,0,1-8,8H40a8,8,0,0,1-8-8V144a8,8,0,0,1,16,0v56H208V144a8,8,0,0,1,16,0Zm-101.66,5.66a8,8,0,0,0,11.32,0l40-40a8,8,0,0,0-11.32-11.32L136,124.69V32a8,8,0,0,0-16,0v92.69L93.66,98.34a8,8,0,0,0-11.32,11.32Z"></path>
                  </svg>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="15"
                    height="15"
                    fill="#000000"
                    viewBox="0 0 256 256"
                  >
                    <path d="M205.66,194.34a8,8,0,0,1-11.32,11.32L128,139.31,61.66,205.66a8,8,0,0,1-11.32-11.32L116.69,128,50.34,61.66A8,8,0,0,1,61.66,50.34L128,116.69l66.34-66.35a8,8,0,0,1,11.32,11.32L139.31,128Z"></path>
                  </svg>
                </div>
              </div>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}
