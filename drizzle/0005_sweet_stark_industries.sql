PRAGMA foreign_keys=OFF;
--> statement-breakpoint
CREATE TABLE `new_import_jobs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`filename` text NOT NULL,
	`type` text NOT NULL,
	`status` text NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
INSERT INTO `new_import_jobs` (`id`, `filename`, `type`, `status`, `created_at`)
SELECT `id`, `filename`, `type`, `status`, `created_at` FROM `import_jobs`;
--> statement-breakpoint
DROP TABLE `import_jobs`;
--> statement-breakpoint
ALTER TABLE `new_import_jobs` RENAME TO `import_jobs`;
--> statement-breakpoint
PRAGMA foreign_keys=ON;