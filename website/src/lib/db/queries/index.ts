import { type SelectImage, imageTable } from "../schema";
import { type ExtractTablesWithRelations, eq } from "drizzle-orm";
import type { SQLiteTransaction } from "drizzle-orm/sqlite-core";
import type * as schema from "~/lib/db";
import { createPresignedUrl, didUrlExpire } from "~/lib/r2";
import { db } from "~/lib/db";

const imagesFields = ["source", "base_mask", "mask", "result"];
export async function updateUrlsOfRecordIfExpired<
  DB extends
    | SQLiteTransaction<
        "async",
        unknown,
        typeof schema,
        ExtractTablesWithRelations<typeof schema>
      >
    | typeof db,
>(record: SelectImage, db: DB) {
  const entries = Object.entries(record) as [
    keyof SelectImage,
    SelectImage[keyof SelectImage],
  ][];
  const id = record.id;
  const reqs = entries
    .filter(
      ([k, v]) =>
        imagesFields.includes(k) && typeof v === "string" && didUrlExpire(v),
    )
    .map(async (entry) => {
      const [columnName] = entry;
      let key: string;
      switch (columnName) {
        case "source":
          key = `${id}-${record.name}`;
          break;
        case "mask":
          key = `${id}-mask.png`;
          break;
        case "result":
          key = `${id}-result.png`;
          break;
        case "base_mask":
          key = `${id}-basemask.png`;
          break;
        default:
          throw new Error("should never happen");
      }
      return {
        column: columnName,
        value: await createPresignedUrl(key),
      };
    });
  const newUrlStatuses = await Promise.allSettled(reqs);
  const newUrls = {} as {
    [K in keyof SelectImage]: SelectImage[K];
  };
  for (const newUrl of newUrlStatuses) {
    if (newUrl.status === "rejected") {
      return null;
    }
    newUrls[newUrl.value.column] = newUrl.value.value;
  }
  newUrls.updatedAt = Date.now();
  await db.update(imageTable).set(newUrls).where(eq(imageTable.id, record.id));
  return newUrls;
}
