import { action } from "@solidjs/router";
import { createWritePresignedUrl } from "../r2";

export const createPresignedUrlAction = action(
  async (key: string, type: string, size: number) => {
    "use server";
    try {
      const url = await createWritePresignedUrl(key, type, size);
      return url;
    } catch (err) {
      console.error(err);
    }
  },
);
