CREATE TABLE `installment_groups` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`description` text NOT NULL,
	`total_installments` integer NOT NULL,
	`total_amount` real NOT NULL,
	`created_at` integer DEFAULT (strftime('%s', 'now')) NOT NULL
);
--> statement-breakpoint
ALTER TABLE transactions ADD `installment_group_id` integer REFERENCES installment_groups(id) ON DELETE CASCADE;
--> statement-breakpoint
ALTER TABLE transactions ADD `installment_number` integer;
--> statement-breakpoint
CREATE INDEX idx_transactions_installment_group ON transactions(installment_group_id);