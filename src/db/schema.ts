import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';
import { sql } from 'drizzle-orm';

export const accounts = sqliteTable('accounts', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    type: text('type').notNull(), // 'bank' | 'credit_card'
    currency: text('currency').default('USD').notNull(),
});

export const categories: any = sqliteTable('categories', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    parentId: integer('parent_id').references((): any => categories.id),
});

export const importJobs = sqliteTable('import_jobs', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    filename: text('filename').notNull(),
    type: text('type').notNull(), // 'nubank-bill-csv', etc
    status: text('status').notNull(), // 'pending', 'completed', 'failed'
    // referenceDate field removed
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export const installmentGroups = sqliteTable('installment_groups', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    description: text('description').notNull(),
    totalInstallments: integer('total_installments').notNull(),
    totalAmount: real('total_amount').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export const transactions = sqliteTable('transactions', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    accountId: integer('account_id').references(() => accounts.id).notNull(),
    categoryId: integer('category_id').references(() => categories.id),
    importJobId: integer('import_job_id').references(() => importJobs.id, { onDelete: 'cascade' }),
    date: integer('date', { mode: 'timestamp' }).notNull(),
    amount: real('amount').notNull(),
    description: text('description').notNull(),
    originalDescription: text('original_description'),
    type: text('type').notNull().default('credit_card'),
    installmentGroupId: integer('installment_group_id').references(() => installmentGroups.id, { onDelete: 'cascade' }),
    installmentNumber: integer('installment_number'),
    isInvestment: integer('is_investment', { mode: 'boolean' }).default(false).notNull(),
});
