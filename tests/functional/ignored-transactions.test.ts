import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import * as fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { FinanceRepository } from '../../src/db/repository';
import { db } from '../../src/db';
import { transactions, importJobs, accounts, categories, ignoredDescriptions } from '../../src/db/schema';
import { eq } from 'drizzle-orm';

const execAsync = promisify(exec);
const TEST_DB = 'test-ignored-transactions.db';

describe('Ignored Transactions API', () => {
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
        // Clear tables in correct order (respecting foreign keys)
        await db.delete(ignoredDescriptions).run();
        await db.delete(transactions).run();
        await db.delete(importJobs).run();
        await db.delete(accounts).run();
        await db.delete(categories).run();
    });

    describe('GET /ignored-transactions', () => {
        it('should return empty list initially', async () => {
            const res = await app.request('/ignored-transactions');
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data).toEqual([]);
        });

        it('should return list of ignored descriptions when populated', async () => {
            // Add some ignored descriptions directly
            await db.insert(ignoredDescriptions).values({ description: 'Test Transaction 1' }).run();
            await db.insert(ignoredDescriptions).values({ description: 'Test Transaction 2' }).run();

            const res = await app.request('/ignored-transactions');
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data).toHaveLength(2);
            expect(data[0].description).toBe('Test Transaction 1');
            expect(data[1].description).toBe('Test Transaction 2');
        });
    });

    describe('POST /ignored-transactions', () => {
        it('should add description to ignored list', async () => {
            const res = await app.request('/ignored-transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description: 'Ignore Me' }),
            });
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.success).toBe(true);
            expect(data.description).toBe('Ignore Me');
            expect(data.id).toBeDefined();
        });

        it('should mark all matching transactions as ignored', async () => {
            // Create test transactions
            const account = await repo.getOrCreateAccount('Test Bank', 'bank');
            const job = await repo.createImportJob('test', 'completed', 'test');

            const drafts = [
                { date: new Date('2023-12-10'), amount: 100, description: 'Recurring Bill', originalDescription: 'Recurring Bill' },
                { date: new Date('2023-12-11'), amount: 100, description: 'Recurring Bill', originalDescription: 'Recurring Bill' },
                { date: new Date('2023-12-12'), amount: 50, description: 'Other Transaction', originalDescription: 'Other Transaction' },
            ];
            await repo.saveTransactions(drafts, account.id, job.id, 'credit_card');

            // Add to ignored list
            const res = await app.request('/ignored-transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description: 'Recurring Bill' }),
            });
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.ignoredCount).toBe(2);

            // Verify transactions are marked as ignored
            const allTransactions = await repo.getTransactions();
            const recurringBills = allTransactions.filter(t => t.description === 'Recurring Bill');
            expect(recurringBills).toHaveLength(2);
            expect(recurringBills.every(t => t.isIgnored === true)).toBe(true);

            const otherTx = allTransactions.find(t => t.description === 'Other Transaction');
            expect(otherTx?.isIgnored).toBe(false);
        });

        it('should return 400 for empty description', async () => {
            const res = await app.request('/ignored-transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description: '' }),
            });
            expect(res.status).toBe(400);
        });

        it('should return 400 for missing description', async () => {
            const res = await app.request('/ignored-transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });
            expect(res.status).toBe(400);
        });
    });

    describe('DELETE /ignored-transactions/:id', () => {
        it('should remove description from ignored list', async () => {
            // Add an ignored description
            const inserted = await db.insert(ignoredDescriptions)
                .values({ description: 'Test' })
                .returning()
                .get();

            const res = await app.request(`/ignored-transactions/${inserted.id}`, {
                method: 'DELETE',
            });
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.success).toBe(true);

            // Verify it's removed
            const remaining = await db.select().from(ignoredDescriptions).all();
            expect(remaining).toHaveLength(0);
        });

        it('should unmark all matching transactions', async () => {
            // Create test transactions
            const account = await repo.getOrCreateAccount('Test Bank', 'bank');
            const job = await repo.createImportJob('test', 'completed', 'test');

            const drafts = [
                { date: new Date('2023-12-10'), amount: 100, description: 'To Unignore', originalDescription: 'To Unignore' },
                { date: new Date('2023-12-11'), amount: 100, description: 'To Unignore', originalDescription: 'To Unignore' },
            ];
            await repo.saveTransactions(drafts, account.id, job.id, 'credit_card');

            // Add to ignored list
            const inserted = await db.insert(ignoredDescriptions)
                .values({ description: 'To Unignore' })
                .returning()
                .get();

            // Manually mark transactions as ignored
            await db.update(transactions)
                .set({ isIgnored: true })
                .where(eq(transactions.description, 'To Unignore'))
                .run();

            // Remove from ignored list
            await app.request(`/ignored-transactions/${inserted.id}`, { method: 'DELETE' });

            // Verify transactions are unmarked
            const allTransactions = await repo.getTransactions();
            const unignored = allTransactions.filter(t => t.description === 'To Unignore');
            expect(unignored).toHaveLength(2);
            expect(unignored.every(t => t.isIgnored === false)).toBe(true);
        });

        it('should return 404 for non-existent ID', async () => {
            const res = await app.request('/ignored-transactions/99999', {
                method: 'DELETE',
            });
            expect(res.status).toBe(404);
        });
    });

    describe('GET /ignored-transactions/preview', () => {
        it('should return count of transactions that would be ignored', async () => {
            // Create test transactions
            const account = await repo.getOrCreateAccount('Test Bank', 'bank');
            const job = await repo.createImportJob('test', 'completed', 'test');

            const drafts = [
                { date: new Date('2023-12-10'), amount: 100, description: 'Test Description', originalDescription: 'Test Description' },
                { date: new Date('2023-12-11'), amount: 100, description: 'Test Description', originalDescription: 'Test Description' },
                { date: new Date('2023-12-12'), amount: 50, description: 'Other', originalDescription: 'Other' },
            ];
            await repo.saveTransactions(drafts, account.id, job.id, 'credit_card');

            const res = await app.request('/ignored-transactions/preview?description=Test%20Description');
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.description).toBe('Test Description');
            expect(data.count).toBe(2);
            expect(data.isIgnored).toBe(false);
        });

        it('should indicate if description is already ignored', async () => {
            // Add to ignored list
            await db.insert(ignoredDescriptions).values({ description: 'Already Ignored' }).run();

            const res = await app.request('/ignored-transactions/preview?description=Already%20Ignored');
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.isIgnored).toBe(true);
        });

        it('should return 400 for missing description parameter', async () => {
            const res = await app.request('/ignored-transactions/preview');
            expect(res.status).toBe(400);
        });
    });

    describe('Auto-ignore during import', () => {
        it('should mark new transactions as ignored if description is in ignored list', async () => {
            // Add to ignored list
            await db.insert(ignoredDescriptions).values({ description: 'Auto Ignore Test' }).run();

            // Create new transactions via import
            const account = await repo.getOrCreateAccount('Test Bank', 'bank');
            const job = await repo.createImportJob('test', 'completed', 'test');

            const drafts = [
                { date: new Date('2023-12-10'), amount: 100, description: 'Auto Ignore Test', originalDescription: 'Auto Ignore Test' },
                { date: new Date('2023-12-11'), amount: 50, description: 'Not Ignored', originalDescription: 'Not Ignored' },
            ];
            await repo.saveTransactions(drafts, account.id, job.id, 'credit_card');

            // Verify auto-ignore
            const allTransactions = await repo.getTransactions();
            const ignoredTx = allTransactions.find(t => t.description === 'Auto Ignore Test');
            expect(ignoredTx?.isIgnored).toBe(true);

            const notIgnoredTx = allTransactions.find(t => t.description === 'Not Ignored');
            expect(notIgnoredTx?.isIgnored).toBe(false);
        });
    });

    describe('GET /transactions', () => {
        it('should include isIgnored field in response', async () => {
            const account = await repo.getOrCreateAccount('Test Bank', 'bank');
            const job = await repo.createImportJob('test', 'completed', 'test');

            const drafts = [
                { date: new Date('2023-12-10'), amount: 100, description: 'Test', originalDescription: 'Test' },
            ];
            await repo.saveTransactions(drafts, account.id, job.id, 'credit_card');

            const res = await app.request('/transactions');
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data).toHaveLength(1);
            expect(data[0]).toHaveProperty('isIgnored');
            expect(data[0].isIgnored).toBe(false);
        });
    });
});
