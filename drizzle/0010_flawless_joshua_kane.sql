CREATE TABLE `ignored_descriptions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`description` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
ALTER TABLE transactions ADD `is_ignored` integer DEFAULT false NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `ignored_descriptions_description_unique` ON `ignored_descriptions` (`description`);