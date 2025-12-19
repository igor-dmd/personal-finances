import { db } from './index';
import { accounts, importJobs, transactions } from './schema';
import { eq } from 'drizzle-orm';
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

    async createImportJob(filename: string, status: string) {
        const result = await db.insert(importJobs).values({ filename, status }).returning().get();
        return result;
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
