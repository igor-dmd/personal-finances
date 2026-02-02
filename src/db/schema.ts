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
    isIgnored: integer('is_ignored', { mode: 'boolean' }).default(false).notNull(),
    isRecurring: integer('is_recurring', { mode: 'boolean' }).default(false).notNull(),
});

export const investments = sqliteTable('investments', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    accountId: integer('account_id').references(() => accounts.id).notNull(),
    type: text('type').notNull(), // 'RDB', 'CDB', 'LCI', 'LCA', 'Tesouro Direto', etc.
    name: text('name').notNull(),
    currentValue: real('current_value').default(0).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export const investmentMovements = sqliteTable('investment_movements', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    investmentId: integer('investment_id').references(() => investments.id, { onDelete: 'cascade' }).notNull(),
    type: text('type').notNull(), // 'deposit' | 'withdrawal'
    date: integer('date', { mode: 'timestamp' }).notNull(),
    amount: real('amount').notNull(), // Always positive
    description: text('description'),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export const ignoredDescriptions = sqliteTable('ignored_descriptions', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    description: text('description').notNull().unique(),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});

export const recurringTransactions = sqliteTable('recurring_transactions', {
    id: integer('id').primaryKey({ autoIncrement: true }),
    description: text('description').notNull().unique(),
    categoryId: integer('category_id').references(() => categories.id),
    averageAmount: real('average_amount').notNull().default(0),
    occurrenceCount: integer('occurrence_count').notNull().default(0),
    firstSeenDate: integer('first_seen_date', { mode: 'timestamp' }),
    lastSeenDate: integer('last_seen_date', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`(strftime('%s', 'now'))`).notNull(),
});
