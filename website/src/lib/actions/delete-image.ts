import { action, json } from "@solidjs/router";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { imageTable } from "../db/schema";

export const deleteImageAction = action(async (formData: FormData) => {
  "use server";
  try {
    const id = formData.get("id") as string | undefined;
    if (!id) return new Error("Inlivad id");
    await db
      .update(imageTable)
      .set({
        deleted: 1,
      })
      .where(eq(imageTable.id, id));
    return json({ message: 'completed' })
  } catch (err) {
    return new Error("Could not delete image");
  }
});
