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
                  <img src="/public/download-icon.svg" alt={`download-${image.name}`} />
                  <img src="/public/x-icon.svg" alt={`delete-${image.name}`} />
                </div>
              </div>
            </div>
          )}
        </For>
      </div>
    </div>
  );
}
