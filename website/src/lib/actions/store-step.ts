import { and, eq, isNull } from "drizzle-orm";
import { getRequestEvent } from "solid-js/web";
import { db } from "../db";
import { imageTable } from "../db/schema";
import { uploadFile } from "../r2";
import { action, json } from "@solidjs/router";

export const createStepAction = action(
  async (image: File, mask: File, baseMaskImg: File, id: string) => {
    "use server";
    const userId = getRequestEvent()?.locals.userId;
    if (!userId) return new Error("Unauthorized");
    try {
      const imageRecord = await db
        .select({
          userId: imageTable.userId,
        })
        .from(imageTable)
        .where(and(eq(imageTable.id, id), isNull(imageTable.deleted)));
      if (!imageRecord.length || imageRecord[0].userId !== userId) {
        return new Error("Unauthorized");
      }

      const formData = new FormData();
      formData.append("image_file", image);
      formData.append("mask_file", mask);
      formData.append("base_mask_file", baseMaskImg);
      const res = await fetch("http://localhost:8000/mask", {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
        },
      });
      if (!res.ok) {
        throw new Error("Failed to upload image");
      }
      const payload = await res.json();
      const resultBuffer = Buffer.from(payload.result.slice(22), "base64");
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
      return json(payload);
    } catch (err) {
      console.error(err);
      return new Error("Unexpected Error");
    }
  },
);
