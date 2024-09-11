import { action, json } from '@solidjs/router';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { getRequestEvent } from 'solid-js/web';
import { db } from '../db';
import { envs } from '../db/env-vars';
import { imageTable } from '../db/schema';
import { uploadFile } from '../r2';
import { rateLimit } from '../rate-limiter';

export const createStepAction = action(
  async (image: File, mask: File /*baseMaskImg: File */, id: string) => {
    'use server';
    const error = await rateLimit();
    if (error) {
      return error;
    }
    const userId = getRequestEvent()?.locals.userId;
    if (!userId) return new Error('Unauthorized');
    try {
      const imageRecord = await db
        .select({
          userId: imageTable.userId,
        })
        .from(imageTable)
        .where(and(eq(imageTable.id, id), isNull(imageTable.deleted)));
      if (!imageRecord.length || imageRecord[0].userId !== userId) {
        return new Error('Unauthorized');
      }

      const formData = new FormData();
      formData.append('image_file', image);
      formData.append('mask_file', mask);
      // formData.append("base_mask_file", baseMaskImg);
      const res = await fetch(`${envs.PYTHON_BACKEND}/mask`, {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json',
        },
      });
      if (!res.ok) {
        throw new Error('Failed to upload image');
      }
      const payload = await res.json();
      const resultBuffer = Buffer.from(payload.result.slice(22), 'base64');
      const maskBuffer = Buffer.from(await mask.arrayBuffer());

      await Promise.all([
        uploadFile(resultBuffer, `${id}-result.png`),
        uploadFile(maskBuffer, `${id}-mask.png`),
      ]);
      await db
        .update(imageTable)
        .set({
          mask: `${id}-mask.png`,
        })
        .where(eq(imageTable.id, id));
      return json(payload);
    } catch (err) {
      console.error(err);
      return new Error('Unexpected Error');
    }
  },
);
