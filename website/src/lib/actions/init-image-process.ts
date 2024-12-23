import { action } from '@solidjs/router';
import { getRequestEvent } from 'solid-js/web';
import { db } from '../db';
import { imageTable } from '../db/schema';

export const uploadImageAction = action(async (id: string, name: string) => {
  'use server';
  try {
    const userId = getRequestEvent()?.locals.userId;
    if (!userId) return new Error('Unauthorized');
    await db.insert(imageTable).values({
      id,
      userId: userId,
      name: name,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return;
  } catch (error) {
    console.error(error);
  }
}, 'upload-image-action');
