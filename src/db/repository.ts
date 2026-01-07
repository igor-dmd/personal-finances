import { db } from './index';
import { accounts, importJobs, transactions, categories } from './schema';
import { eq, and, sql } from 'drizzle-orm';
import { TransactionDraft } from '../extraction/types';

export class FinanceRepository {
    async getOrCreateAccount(name: string, type: string) {
        const existing = await db.select().from(accounts).where(eq(accounts.name, name)).get();
        if (existing) {
            return existing;
        }
        const result = await db.insert(accounts).values({ name, type }).returning().get();
        return result;
    }

    async createImportJob(filename: string, status: string, type: string) {
        const result = await db.insert(importJobs).values({ filename, status, type }).returning().get();
        return result;
    }

    async getImportJobs() {
        return await db.select().from(importJobs).orderBy(sql`id DESC`).all();
    }

    async deleteImportJob(id: number) {
        // Manually delete transactions first as a fallback for SQLite cascade issues
        await db.delete(transactions).where(eq(transactions.importJobId, id)).run();
        await db.delete(importJobs).where(eq(importJobs.id, id)).run();
    }



    async getCategories() {
        return await db.select().from(categories).all();
    }

    async createCategory(name: string) {
        const result = await db.insert(categories).values({ name }).returning().get();
        return result;
    }

    async updateCategory(id: number, name: string) {
        return await db.update(categories).set({ name }).where(eq(categories.id, id)).run();
    }

    async deleteCategory(id: number) {
        // Set categoryId to null on transactions first
        await db.update(transactions).set({ categoryId: null }).where(eq(transactions.categoryId, id)).run();
        // Then delete the category
        await db.delete(categories).where(eq(categories.id, id)).run();
    }

    async updateTransaction(id: number, data: Partial<typeof transactions.$inferInsert>) {
        return await db.update(transactions).set(data).where(eq(transactions.id, id)).run();
    }

    async getTransactions() {
        return await db.select({
            id: transactions.id,
            date: transactions.date,
            amount: transactions.amount,
            description: transactions.description,
            originalDescription: transactions.originalDescription,
            type: transactions.type,
            accountName: accounts.name,
            categoryId: transactions.categoryId,
            categoryName: categories.name,
        })
            .from(transactions)
            .leftJoin(accounts, eq(transactions.accountId, accounts.id))
            .leftJoin(categories, eq(transactions.categoryId, categories.id))
            .all();
    }

    async updateImportJobStatus(id: number, status: string) {
        await db.update(importJobs).set({ status }).where(eq(importJobs.id, id)).run();
    }

    async saveTransactions(drafts: TransactionDraft[], accountId: number, importJobId: number, transactionType: string) {
        const txs = drafts.map(draft => ({
            accountId,
            importJobId,
            date: draft.date,
            amount: draft.amount,
            description: draft.description,
            originalDescription: draft.originalDescription,
            type: transactionType,
        }));

        // Batch insert could be better, but sqlite limits vars per statement.
        // For small batches, simple insert is fine.
        // We will insert one by one or in small batches.
        if (txs.length === 0) return;

        await db.insert(transactions).values(txs).run();
    }

    async countTransactionsByDescription(description: string): Promise<number> {
        const result = await db
            .select({ count: sql<number>`count(*)` })
            .from(transactions)
            .where(eq(transactions.description, description))
            .get();

        return result?.count || 0;
    }

    async updateTransactionsByDescription(
        description: string,
        categoryId: number | null
    ): Promise<{ count: number }> {
        const result = await db
            .update(transactions)
            .set({ categoryId })
            .where(eq(transactions.description, description))
            .run();

        return { count: result.changes };
    }
}
