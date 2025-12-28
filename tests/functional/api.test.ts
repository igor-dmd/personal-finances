import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import * as fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { FinanceRepository } from '../../src/db/repository';
import { db } from '../../src/db';
import { transactions, importJobs, accounts } from '../../src/db/schema';

const execAsync = promisify(exec);
const TEST_DB = 'test-api.db';

describe('API Functional Tests', () => {
    let app: any;
    let repo: FinanceRepository;

    beforeAll(async () => {
        process.env.DATABASE_URL = TEST_DB;

        // Clean up any existing test db
        if (fs.existsSync(TEST_DB)) {
            fs.unlinkSync(TEST_DB);
        }

        // Run migrations
        await execAsync(`DATABASE_URL=${TEST_DB} npm run db:migrate`);

        // Dynamic import to ensure env var is picked up by db configuration
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
        // Clear tables to ensure test isolation
        await db.delete(transactions).run();
        await db.delete(importJobs).run();
        await db.delete(accounts).run();
    });

    it('GET /transactions should return empty list initially', async () => {
        const res = await app.request('/transactions');
        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data).toEqual([]);
    });

    it('GET /transactions should return a list of transactions when populated', async () => {
        // Seed data manually
        const account = await repo.getOrCreateAccount('Test Bank', 'bank');
        const job = await repo.createImportJob('manual_seed', 'completed', '2023-12');

        const drafts = [
            {
                date: new Date('2023-12-10'),
                amount: 150.00,
                description: 'Grocery Store',
                originalDescription: 'Grocery Store'
            },
            {
                date: new Date('2023-12-11'),
                amount: -25.50,
                description: 'Coffee Shop',
                originalDescription: 'Coffee Shop'
            }
        ];

        await repo.saveTransactions(drafts, account.id, job.id);

        const res = await app.request('/transactions');
        expect(res.status).toBe(200);
        const data = await res.json();

        expect(data).toHaveLength(2);

        const grocery = data.find((t: any) => t.description === 'Grocery Store');
        expect(grocery).toBeDefined();
        expect(grocery.amount).toBe(150.00);

        const coffee = data.find((t: any) => t.description === 'Coffee Shop');
        expect(coffee).toBeDefined();
        expect(coffee.amount).toBe(-25.50);
    });

    it('POST /transactions/upload should process a valid CSV file', async () => {
        // Create a dummy CSV file
        const csvContent = `date,title,amount
2023-12-01,Test Transaction,100.00
2023-12-02,Another One,-50.00`;
        const dummyFile = 'dummy-upload.csv';
        fs.writeFileSync(dummyFile, csvContent);

        // Create FormData
        const formData = new FormData();
        // Read file as Blob (Node 18+ supports this)
        const fileContent = fs.readFileSync(dummyFile);
        const blob = new Blob([fileContent], { type: 'text/csv' });

        formData.append('file', blob, 'statement.csv');
        formData.append('type', 'nubank-cc-bill-csv');
        formData.append('referenceDate', '2023-12');

        const res = await app.request('/transactions/upload', {
            method: 'POST',
            body: formData,
        });

        // Cleanup dummy file
        fs.unlinkSync(dummyFile);

        expect(res.status).toBe(200);
        const body = await res.json();
        expect(body.message).toBe('File processed successfully');
        expect(body.count).toBe(2);

        // Verify transaction was added via GET
        const getRes = await app.request('/transactions');
        const transactions = await getRes.json();
        expect(transactions).toHaveLength(2);
        expect(transactions[0].description).toBe('Test Transaction');
        expect(transactions[0].amount).toBe(100.00);
    });

    it('POST /transactions/upload should return 400 for invalid file', async () => {
        const formData = new FormData();
        formData.append('type', 'nubank-cc-bill-csv');
        formData.append('referenceDate', '2023-12');
        // No file appended

        const res = await app.request('/transactions/upload', {
            method: 'POST',
            body: formData,
        });

        expect(res.status).toBe(400);
    });
});
