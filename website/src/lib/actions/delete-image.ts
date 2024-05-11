import { action, json } from "@solidjs/router";
import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { imageTable } from "../db/schema";
import { getRequestEvent } from "solid-js/web";

export const deleteImageAction = action(async (formData: FormData) => {
  "use server";
  try {
    const id = formData.get("id") as string | undefined;
    const userId = getRequestEvent()?.locals.userId;
    if (!id || !userId) return new Error("Inlivad request");
    await db
      .update(imageTable)
      .set({
        deleted: 1,
      })
      .where(and(eq(imageTable.id, id), eq(imageTable.userId, userId)));
    return json({ message: 'completed' })
  } catch (err) {
    return new Error("Could not delete image");
  }
});
