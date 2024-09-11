import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const rateLimitTable = sqliteTable(
  'rate_limit',
  {
    id: text('id').notNull().primaryKey(),
    key: text('key').notNull(),
    createdAt: integer('created_at').notNull(),
  },
  (table) => ({
    KeyCreatedAtIdx: index('rate_limit__key__created_at__idx').on(
      table.key,
      table.createdAt,
    ),
  }),
);
