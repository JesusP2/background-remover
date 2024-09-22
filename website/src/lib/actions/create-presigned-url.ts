import { action } from '@solidjs/router';
import { createDeletePresignedUrl, createWritePresignedUrl } from '../r2';

export const createWritePresignedUrlAction = action(
  async (key: string, type: string, size: number) => {
    'use server';
    try {
      const url = await createWritePresignedUrl(key, type, size);
      return url;
    } catch (err) {
      console.error(err);
    }
  },
);

export const createDeletePresignedUrlAction = action(async (key: string) => {
  'use server';
  try {
    const url = await createDeletePresignedUrl(key);
    return url;
  } catch (err) {
    console.error(err);
  }
});
