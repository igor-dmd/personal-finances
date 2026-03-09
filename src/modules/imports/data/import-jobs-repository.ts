import { eq, sql } from 'drizzle-orm';
import { db } from '../../../db';
import { importJobs, transactions } from '../../../db/schema';

export type ImportJobEntity = typeof importJobs.$inferSelect;

export class ImportJobsRepository {
    async create(filename: string, status: string, type: string): Promise<ImportJobEntity> {
        return db.insert(importJobs).values({ filename, status, type }).returning().get();
    }

    async list(): Promise<ImportJobEntity[]> {
        return db.select().from(importJobs).orderBy(sql`id DESC`).all();
    }

    async updateStatus(id: number, status: string): Promise<void> {
        await db.update(importJobs).set({ status }).where(eq(importJobs.id, id)).run();
    }

    async deleteWithTransactions(id: number): Promise<void> {
        await db.delete(transactions).where(eq(transactions.importJobId, id)).run();
        await db.delete(importJobs).where(eq(importJobs.id, id)).run();
    }
}
