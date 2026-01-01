PRAGMA foreign_keys=OFF;
--> statement-breakpoint
CREATE TABLE `new_transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`account_id` integer NOT NULL,
	`category_id` integer,
	`import_job_id` integer,
	`date` integer NOT NULL,
	`amount` real NOT NULL,
	`description` text NOT NULL,
	`original_description` text,
	FOREIGN KEY (`account_id`) REFERENCES `accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`import_job_id`) REFERENCES `import_jobs`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `new_transactions` (`id`, `account_id`, `category_id`, `import_job_id`, `date`, `amount`, `description`, `original_description`)
SELECT `id`, `account_id`, `category_id`, `import_job_id`, `date`, `amount`, `description`, `original_description` FROM `transactions`;
--> statement-breakpoint
DROP TABLE `transactions`;
--> statement-breakpoint
ALTER TABLE `new_transactions` RENAME TO `transactions`;
--> statement-breakpoint
PRAGMA foreign_keys=ON;