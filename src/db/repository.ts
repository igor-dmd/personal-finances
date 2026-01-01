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



    async getTransactions() {
        return await db.select({
            id: transactions.id,
            date: transactions.date,
            amount: transactions.amount,
            description: transactions.description,
            originalDescription: transactions.originalDescription,
            accountName: accounts.name,
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

    async saveTransactions(drafts: TransactionDraft[], accountId: number, importJobId: number) {
        const txs = drafts.map(draft => ({
            accountId,
            importJobId,
            date: draft.date,
            amount: draft.amount,
            description: draft.description,
            originalDescription: draft.originalDescription,
        }));

        // Batch insert could be better, but sqlite limits vars per statement. 
        // For small batches, simple insert is fine.
        // We will insert one by one or in small batches.
        if (txs.length === 0) return;

        await db.insert(transactions).values(txs).run();
    }
}
