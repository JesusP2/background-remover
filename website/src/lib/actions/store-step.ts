import { eq } from 'drizzle-orm';
import { getRequestEvent } from 'solid-js/web';
import { db } from '../db';
import { imageTable } from '../db/schema';
import { uploadFile } from '../r2';

export async function storeStep(result: File, mask: File, id: string) {
  'use server';
  try {
    const session = getRequestEvent()?.locals.session;
    if (!session) return new Error('Unauthorized');
    const imageRecord = await db
      .select({
        userId: imageTable.userId,
      })
      .from(imageTable)
      .where(eq(imageTable.id, id));
    if (!imageRecord.length || imageRecord[0].userId !== session.userId)
      return new Error('Unauthorized');

    const resultBuffer = Buffer.from(await result.arrayBuffer());
    const maskBuffer = Buffer.from(await mask.arrayBuffer());
    const [resultUrl, maskUrl] = await Promise.all([
      uploadFile(resultBuffer, `${id}-result.png`),
      uploadFile(maskBuffer, `${id}-mask.png`),
    ]);
    await db
      .update(imageTable)
      .set({
        mask: maskUrl,
        result: resultUrl,
      })
      .where(eq(imageTable.id, id));
  } catch (err) {
    console.error(err);
  }
}
