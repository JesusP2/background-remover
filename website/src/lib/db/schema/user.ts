import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const userTable = sqliteTable('user', {
  id: text('id').notNull().primaryKey(),
  email: text('email'),
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

export const emailVerificationTable = sqliteTable('email_verification', {
  id: text('id').notNull().primaryKey(),
  code: text('code').notNull(),
  userId: text('user_id').notNull().unique(),
  email: text('email').notNull(),
  expiresAt: text('expires_at').notNull(),
});

export const resetTokenTable = sqliteTable('reset_token', {
  id: text('id').notNull().primaryKey(),
  token: text('token').notNull(),
  userId: text('user_id').notNull().unique(),
  expiresAt: text('expires_at').notNull(),
});

export const magicLinkTable = sqliteTable('magic_link', {
  id: text('id').notNull().primaryKey(),
  token: text('token').notNull(),
  userId: text('user_id').notNull().unique(),
  expiresAt: text('expires_at').notNull(),
});
