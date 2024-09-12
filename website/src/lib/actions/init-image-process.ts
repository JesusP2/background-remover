import { ulid } from 'ulidx';
import { action, redirect } from '@solidjs/router';
import { getRequestEvent } from 'solid-js/web';
import { db } from '../db';
import { imageTable } from '../db/schema';
import { uploadFile } from '../r2';
import { rateLimit } from '../rate-limiter';

export const uploadImageAction = action(async (file: File) => {
  'use server';
  try {
    const error = await rateLimit();
    if (error) {
      return error;
    }
    const userId = getRequestEvent()?.locals.userId;
    if (!userId) return new Error('Unauthorized');
    const sourceBuffer = Buffer.from(await file.arrayBuffer());
    const id = ulid();
    await Promise.all([
      uploadFile(sourceBuffer, `${id}-${file.name}`),
      uploadFile(sourceBuffer, `${id}-result.png`),
    ]);
    await db.insert(imageTable).values({
      id,
      userId: userId,
      name: file.name,
      source: `${id}-${file.name}`,
      result: `${id}-result.png`,
      mask: `${id}-mask.png`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return redirect(`/canvas/grabcut/${id}`);
  } catch (error) {
    console.error(error);
  }
}, 'upload-image-action');
