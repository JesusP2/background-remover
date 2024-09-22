CREATE TABLE `oauth_account` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`provider_id` text NOT NULL,
	`provider_user_id` text NOT NULL,
	`created_at` integer,
	`updated_at` integer
);
--> statement-breakpoint
ALTER TABLE `image` DROP COLUMN `source`;--> statement-breakpoint
ALTER TABLE `image` DROP COLUMN `mask`;--> statement-breakpoint
ALTER TABLE `image` DROP COLUMN `result`;