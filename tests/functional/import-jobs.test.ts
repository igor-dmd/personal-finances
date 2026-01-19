import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import * as fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { FinanceRepository } from '../../src/db/repository';
import { db } from '../../src/db';
import { transactions, importJobs, accounts, investments, investmentMovements, installmentGroups } from '../../src/db/schema';

const execAsync = promisify(exec);
const TEST_DB = 'test-import-jobs.db';

describe('Import Jobs API Functional Tests', () => {
    let app: any;
    let repo: FinanceRepository;

    beforeAll(async () => {
        process.env.DATABASE_URL = TEST_DB;

        if (fs.existsSync(TEST_DB)) {
            fs.unlinkSync(TEST_DB);
        }

        await execAsync(`DATABASE_URL=${TEST_DB} npm run db:migrate`);

        const mod = await import('../../src/api/app');
        app = mod.default;
        repo = new FinanceRepository();
    });

    afterAll(() => {
        if (fs.existsSync(TEST_DB)) {
            fs.unlinkSync(TEST_DB);
        }
    });

    beforeEach(async () => {
        // Clear tables in correct order (respecting foreign keys)
        await db.delete(investmentMovements).run();
        await db.delete(investments).run();
        await db.delete(transactions).run();
        await db.delete(installmentGroups).run();
        await db.delete(importJobs).run();
        await db.delete(accounts).run();
    });

    it('GET /import-jobs should return list of jobs', async () => {
        await repo.createImportJob('file1.csv', 'completed', 'nubank');
        await repo.createImportJob('file2.csv', 'pending', 'nubank');

        const res = await app.request('/import-jobs');
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data).toHaveLength(2);
        expect(data[0].filename).toBe('file2.csv'); // Ordered by DESC
        expect(data[1].filename).toBe('file1.csv');
    });

    it('DELETE /import-jobs/:id should delete job and transactions', async () => {
        const account = await repo.getOrCreateAccount('Test Account', 'bank');
        const job = await repo.createImportJob('to_delete.csv', 'completed', 'nubank');

        await repo.saveTransactions([
            { date: new Date(), amount: 10, description: 'T1', originalDescription: 'T1' },
            { date: new Date(), amount: 20, description: 'T2', originalDescription: 'T2' }
        ], account.id, job.id);

        // Verify they exist
        const initialJobs = await repo.getImportJobs();
        expect(initialJobs).toHaveLength(1);
        const initialTxs = await repo.getTransactions();
        expect(initialTxs).toHaveLength(2);

        // Delete
        const res = await app.request(`/import-jobs/${job.id}`, { method: 'DELETE' });
        expect(res.status).toBe(200);

        // Verify deletion
        const finalJobs = await repo.getImportJobs();
        expect(finalJobs).toHaveLength(0);
        const finalTxs = await repo.getTransactions();
        expect(finalTxs).toHaveLength(0);
    });
});
