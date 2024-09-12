import { action, json } from '@solidjs/router';
import { getRequestEvent } from 'solid-js/web';
import { envs } from '../db/env-vars';
import { uploadFile } from '../r2';
import { rateLimit } from '../rate-limiter';

export const createStepAction = action(
  async (image: File, mask: File, id: string) => {
    'use server';
    const error = await rateLimit();
    if (error) {
      return error;
    }
    const userId = getRequestEvent()?.locals.userId;
    if (!userId) return new Error('Unauthorized');
    try {
      const formData = new FormData();
      formData.append('image_file', image);
      formData.append('mask_file', mask);
      const res = await fetch(`${envs.PYTHON_BACKEND}/mask`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        throw new Error('Failed to upload image');
      }
      const resultBuffer = Buffer.from(await res.arrayBuffer())
      const maskBuffer = Buffer.from(await mask.arrayBuffer());
      await Promise.all([
        uploadFile(resultBuffer, `${id}-result.png`),
        uploadFile(maskBuffer, `${id}-mask.png`),
      ]);
      return;
    } catch (err) {
      console.error(err);
      return new Error('Unexpected Error');
    }
  },
);
