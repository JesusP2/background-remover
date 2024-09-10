import { createId } from "@paralleldrive/cuid2";
import { action, redirect } from "@solidjs/router";
import { getRequestEvent } from "solid-js/web";
import { db } from "../db";
import { imageTable } from "../db/schema";
import { uploadFile } from "../r2";
import { rateLimit } from "../rate-limiter";

export const uploadImageAction = action(async (file: File) => {
  "use server";
  try {
    console.log('trying to do anything')
    const error = await rateLimit();
    if (error) {
      return error;
    }
    const userId = getRequestEvent()?.locals.userId;
    if (!userId) return new Error("Unauthorized");
    const sourceBuffer = Buffer.from(await file.arrayBuffer());
    const id = createId();
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
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return redirect(`/canvas/grabcut/${id}`);
  } catch (error) {
    console.error(error);
  }
}, "upload-image-action");
