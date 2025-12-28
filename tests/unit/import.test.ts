
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FinanceRepository } from '../../src/db/repository';
import { db } from '../../src/db';
import { importJobs } from '../../src/db/schema';
import { sql } from 'drizzle-orm';

describe('Import Feature', () => {
    const repo = new FinanceRepository();

    beforeAll(async () => {
        // Clean up import jobs
        await db.run(sql`DELETE FROM ${importJobs}`);
    });

    it('should create an import job with type', async () => {
        const job = await repo.createImportJob('test.csv', 'pending', 'nubank-cc-bill-csv', '2023-12');
        expect(job).toBeDefined();
        expect(job.type).toBe('nubank-cc-bill-csv');
        expect(job.referenceDate).toBe('2023-12');
    });

    it('should detect duplicate completed jobs', async () => {
        // Create a completed job first
        const job = await repo.createImportJob('first.csv', 'pending', 'nubank-bill-csv', '2024-01');
        await repo.updateImportJobStatus(job.id, 'completed');

        // Check for duplicate
        const duplicate = await repo.getCompletedImportJob('nubank-bill-csv', '2024-01');
        expect(duplicate).toBeDefined();
        expect(duplicate?.id).toBe(job.id);
    });

    it('should NOT detect pending jobs as duplicates', async () => {
        const job = await repo.createImportJob('pending.csv', 'pending', 'nubank-bill-csv', '2024-02');
        const duplicate = await repo.getCompletedImportJob('nubank-bill-csv', '2024-02');
        expect(duplicate).toBeUndefined();
    });
});
