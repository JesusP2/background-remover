export * from "./user";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { createSelectSchema } from "drizzle-valibot";
import type { Output } from "valibot";

export const imageTable = sqliteTable("image", {
  id: text("id").notNull().primaryKey(),
  userId: text("user_id").notNull(),
  name: text("name").notNull(),
  createdAt: integer("created_at")
    .notNull()
    .$defaultFn(() => Date.now()),
  updatedAt: integer("updated_at")
    .notNull()
    .$defaultFn(() => Date.now()),
  deleted: integer("deleted"),
});

export const selectImageSchema = createSelectSchema(imageTable);
export type SelectImage = Output<typeof selectImageSchema> & {
  result: string;
  source: string;
  mask: string | null;
  samMask: string | null;
};
