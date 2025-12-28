
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
        const job = await repo.createImportJob('test.csv', 'pending', 'nubank-cc-bill-csv');
        expect(job).toBeDefined();
        expect(job.type).toBe('nubank-cc-bill-csv');
    });


});
