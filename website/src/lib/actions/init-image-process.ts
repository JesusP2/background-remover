import { createId } from '@paralleldrive/cuid2';
import { getRequestEvent } from 'solid-js/web';
import { uploadFile } from '../r2';
import { db } from '../db';
import { imageTable } from '../db/schema';
import { redirect } from '@solidjs/router';

export async function uploadImage(file: File) {
  'use server';
  try {
    const session = getRequestEvent()?.locals.session;
    if (!session) return new Error('Unauthorized');
    const formData = new FormData();
    formData.append('image_file', file);
    const res = await fetch(`http://localhost:8000/start`, {
      method: 'POST',
      body: formData,
      headers: {
        Accept: 'application/json',
      },
    });

    if (!res.ok) {
      throw new Error('Failed to upload image');
    }
    const { result, base_mask } = await res.json();
    const resultBuffer = Buffer.from(
      result.replace(/^data:image\/\w+;base64,/, ''),
      'base64',
    );
    const baseMaskBuffer = Buffer.from(
      base_mask.replace(/^data:image\/\w+;base64,/, ''),
      'base64',
    );
    const sourceBuffer = Buffer.from(await file.arrayBuffer());

    const id = createId();
    const [resultUrl, maskUrl, sourceUrl] = await Promise.all([
      uploadFile(resultBuffer, `${id}-result.png`),
      uploadFile(baseMaskBuffer, `${id}-basemask.png`),
      uploadFile(sourceBuffer, `${id}-${file.name}`),
    ]);
    await db.insert(imageTable).values({
      id,
      userId: session.userId,
      name: file.name,
      source: sourceUrl,
      base_mask: maskUrl,
      result: resultUrl,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    await new Promise((resolve) => setTimeout(resolve, 1000));
    return redirect(`/canvas/${id}`);
  } catch (error) {
    console.error(error);
  }
}
