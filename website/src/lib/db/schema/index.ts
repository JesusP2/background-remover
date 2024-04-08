export * from './user';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
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
});

// export const
//
// img, mask, result
//
//
// load img, send to the server, create mask and result, store all 3
// send mask and img to server, create result and store it
// exit
// re enter
// get img, mask and result from db
// combine img and mask to create source
// combine mask and actions to create updated_mask
// send source and updated_mask to server, create result and store it
