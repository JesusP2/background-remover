import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const userTable = sqliteTable('user', {
  id: text('id').notNull().primaryKey(),
  email: text('email').unique(),
  name: text('name'),
  username: text('username').unique(),
  password: text('password'),
  createdAt: integer('created_at').$defaultFn(() => new Date().getTime()),
  updatedAt: integer('updated_at').$defaultFn(() => new Date().getTime()),
});

export const sessionTable = sqliteTable('session', {
  id: text('id').notNull().primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => userTable.id),
  expiresAt: integer('expires_at').notNull(),
});

export const oauthAccountTable = sqliteTable('oauth_account', {
  id: text('id').notNull().primaryKey(),
  userId: text('user_id').notNull(),
  providerId: text('provider_id').notNull(),
  providerUserId: text('provider_user_id').notNull(),
  createdAt: integer('created_at').$defaultFn(() => new Date().getTime()),
  updatedAt: integer('updated_at').$defaultFn(() => new Date().getTime()),
});
