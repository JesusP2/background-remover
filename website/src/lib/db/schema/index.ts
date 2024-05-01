export * from './user';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { createSelectSchema } from 'drizzle-valibot';
import type { Output } from 'valibot';
import { userTable } from './user';

export const imageTable = sqliteTable('image', {
  id: text('id').notNull().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => userTable.id),
  name: text('name').notNull(),
  source: text('source').notNull(),
  base_mask: text('base_mask').notNull(),
  mask: text('mask'),
  result: text('result').notNull(),
  createdAt: integer('created_at')
    .notNull()
    .$defaultFn(() => Date.now()),
  updatedAt: integer('updated_at')
    .notNull()
    .$defaultFn(() => Date.now()),
  deleted: integer('deleted')
});

export const selectImageSchema = createSelectSchema(imageTable);
export type SelectImage = Output<typeof selectImageSchema>;
