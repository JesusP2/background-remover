import { action, json } from '@solidjs/router';
import { getRequestEvent } from 'solid-js/web';
import { uploadFile } from '../r2';
import { rateLimit } from '../rate-limiter';

export const createStepAction = action(
  async (result: File, mask: File, id: string) => {
    'use server';
    const error = await rateLimit();
    if (error) {
      return error;
    }
    const userId = getRequestEvent()?.locals.userId;
    if (!userId) return new Error('Unauthorized');
    try {
      const resultBuffer = Buffer.from(await result.arrayBuffer())
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
