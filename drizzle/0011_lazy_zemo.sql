CREATE TABLE `recurring_transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`description` text NOT NULL,
	`category_id` integer,
	`average_amount` real DEFAULT 0 NOT NULL,
	`occurrence_count` integer DEFAULT 0 NOT NULL,
	`first_seen_date` integer,
	`last_seen_date` integer,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE transactions ADD `is_recurring` integer DEFAULT false NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `recurring_transactions_description_unique` ON `recurring_transactions` (`description`);