import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import * as fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { FinanceRepository } from '../../src/db/repository';
import { db } from '../../src/db';
import { transactions, importJobs, accounts, categories, recurringTransactions } from '../../src/db/schema';
import { eq } from 'drizzle-orm';

const execAsync = promisify(exec);
const TEST_DB = 'test-recurring-transactions.db';

describe('Recurring Transactions API', () => {
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
        await db.delete(recurringTransactions).run();
        await db.delete(transactions).run();
        await db.delete(importJobs).run();
        await db.delete(accounts).run();
        await db.delete(categories).run();
    });

    describe('GET /recurring-transactions', () => {
        it('should return empty list initially', async () => {
            const res = await app.request('/recurring-transactions');
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data).toEqual([]);
        });

        it('should return list of recurring transactions when populated', async () => {
            // Add a recurring transaction directly
            await db.insert(recurringTransactions).values({
                description: 'Netflix',
                categoryId: null,
                averageAmount: 49.90,
                occurrenceCount: 6,
            }).run();

            const res = await app.request('/recurring-transactions');
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data).toHaveLength(1);
            expect(data[0].description).toBe('Netflix');
            expect(data[0].averageAmount).toBe(49.90);
        });
    });

    describe('POST /recurring-transactions', () => {
        it('should add description as recurring', async () => {
            const res = await app.request('/recurring-transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description: 'Netflix' }),
            });
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.success).toBe(true);
            expect(data.description).toBe('Netflix');
            expect(data.id).toBeDefined();
        });

        it('should calculate average amount from historical transactions', async () => {
            // Create test transactions with varying amounts
            const account = await repo.getOrCreateAccount('Test Bank', 'bank');
            const job = await repo.createImportJob('test', 'completed', 'test');

            const drafts = [
                { date: new Date('2023-08-10'), amount: -50, description: 'Spotify', originalDescription: 'Spotify' },
                { date: new Date('2023-09-10'), amount: -50, description: 'Spotify', originalDescription: 'Spotify' },
                { date: new Date('2023-10-10'), amount: -55, description: 'Spotify', originalDescription: 'Spotify' },
            ];
            await repo.saveTransactions(drafts, account.id, job.id, 'credit_card');

            // Add as recurring
            const res = await app.request('/recurring-transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description: 'Spotify' }),
            });
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.averageAmount).toBeCloseTo(51.67, 1);
            expect(data.occurrenceCount).toBe(3);
        });

        it('should mark all matching transactions as recurring', async () => {
            // Create test transactions
            const account = await repo.getOrCreateAccount('Test Bank', 'bank');
            const job = await repo.createImportJob('test', 'completed', 'test');

            const drafts = [
                { date: new Date('2023-12-10'), amount: -100, description: 'Rent', originalDescription: 'Rent' },
                { date: new Date('2023-11-10'), amount: -100, description: 'Rent', originalDescription: 'Rent' },
                { date: new Date('2023-12-12'), amount: -50, description: 'Groceries', originalDescription: 'Groceries' },
            ];
            await repo.saveTransactions(drafts, account.id, job.id, 'credit_card');

            // Add as recurring
            const res = await app.request('/recurring-transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description: 'Rent' }),
            });
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.markedCount).toBe(2);

            // Verify transactions are marked as recurring
            const allTransactions = await repo.getTransactions();
            const rentTxs = allTransactions.filter(t => t.description === 'Rent');
            expect(rentTxs).toHaveLength(2);
            expect(rentTxs.every(t => t.isRecurring === true)).toBe(true);

            const groceryTx = allTransactions.find(t => t.description === 'Groceries');
            expect(groceryTx?.isRecurring).toBe(false);
        });

        it('should accept categoryId in request', async () => {
            const category = await db.insert(categories).values({ name: 'Entertainment' }).returning().get();

            const res = await app.request('/recurring-transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description: 'Netflix', categoryId: category.id }),
            });
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.success).toBe(true);
        });

        it('should return 400 for empty description', async () => {
            const res = await app.request('/recurring-transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ description: '' }),
            });
            expect(res.status).toBe(400);
        });

        it('should return 400 for missing description', async () => {
            const res = await app.request('/recurring-transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({}),
            });
            expect(res.status).toBe(400);
        });
    });

    describe('PATCH /recurring-transactions/:id', () => {
        it('should update category of recurring transaction', async () => {
            const category = await db.insert(categories).values({ name: 'Bills' }).returning().get();
            const inserted = await db.insert(recurringTransactions)
                .values({ description: 'Rent', categoryId: null, averageAmount: 1000, occurrenceCount: 1 })
                .returning()
                .get();

            const res = await app.request(`/recurring-transactions/${inserted.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ categoryId: category.id }),
            });
            expect(res.status).toBe(200);

            // Verify update
            const updated = await db.select().from(recurringTransactions).where(eq(recurringTransactions.id, inserted.id)).get();
            expect(updated?.categoryId).toBe(category.id);
        });

        it('should allow setting category to null', async () => {
            const category = await db.insert(categories).values({ name: 'Bills' }).returning().get();
            const inserted = await db.insert(recurringTransactions)
                .values({ description: 'Rent', categoryId: category.id, averageAmount: 1000, occurrenceCount: 1 })
                .returning()
                .get();

            const res = await app.request(`/recurring-transactions/${inserted.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ categoryId: null }),
            });
            expect(res.status).toBe(200);
        });

        it('should return 400 for invalid ID', async () => {
            const res = await app.request('/recurring-transactions/invalid', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ categoryId: null }),
            });
            expect(res.status).toBe(400);
        });
    });

    describe('DELETE /recurring-transactions/:id', () => {
        it('should remove from recurring list', async () => {
            const inserted = await db.insert(recurringTransactions)
                .values({ description: 'Test', categoryId: null, averageAmount: 50, occurrenceCount: 1 })
                .returning()
                .get();

            const res = await app.request(`/recurring-transactions/${inserted.id}`, {
                method: 'DELETE',
            });
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.success).toBe(true);

            // Verify it's removed
            const remaining = await db.select().from(recurringTransactions).all();
            expect(remaining).toHaveLength(0);
        });

        it('should unmark all matching transactions', async () => {
            // Create test transactions
            const account = await repo.getOrCreateAccount('Test Bank', 'bank');
            const job = await repo.createImportJob('test', 'completed', 'test');

            const drafts = [
                { date: new Date('2023-12-10'), amount: -100, description: 'To Unmark', originalDescription: 'To Unmark' },
                { date: new Date('2023-11-10'), amount: -100, description: 'To Unmark', originalDescription: 'To Unmark' },
            ];
            await repo.saveTransactions(drafts, account.id, job.id, 'credit_card');

            // Add as recurring
            const inserted = await db.insert(recurringTransactions)
                .values({ description: 'To Unmark', categoryId: null, averageAmount: 100, occurrenceCount: 2 })
                .returning()
                .get();

            // Manually mark transactions as recurring
            await db.update(transactions)
                .set({ isRecurring: true })
                .where(eq(transactions.description, 'To Unmark'))
                .run();

            // Remove from recurring list
            await app.request(`/recurring-transactions/${inserted.id}`, { method: 'DELETE' });

            // Verify transactions are unmarked
            const allTransactions = await repo.getTransactions();
            const unmarked = allTransactions.filter(t => t.description === 'To Unmark');
            expect(unmarked).toHaveLength(2);
            expect(unmarked.every(t => t.isRecurring === false)).toBe(true);
        });

        it('should return 404 for non-existent ID', async () => {
            const res = await app.request('/recurring-transactions/99999', {
                method: 'DELETE',
            });
            expect(res.status).toBe(404);
        });
    });

    describe('GET /recurring-transactions/preview', () => {
        it('should return count and average of transactions', async () => {
            // Create test transactions
            const account = await repo.getOrCreateAccount('Test Bank', 'bank');
            const job = await repo.createImportJob('test', 'completed', 'test');

            const drafts = [
                { date: new Date('2023-10-10'), amount: -50, description: 'Spotify', originalDescription: 'Spotify' },
                { date: new Date('2023-11-10'), amount: -50, description: 'Spotify', originalDescription: 'Spotify' },
                { date: new Date('2023-12-10'), amount: -55, description: 'Spotify', originalDescription: 'Spotify' },
            ];
            await repo.saveTransactions(drafts, account.id, job.id, 'credit_card');

            const res = await app.request('/recurring-transactions/preview?description=Spotify');
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.description).toBe('Spotify');
            expect(data.count).toBe(3);
            expect(data.averageAmount).toBeCloseTo(51.67, 1);
            expect(data.isRecurring).toBe(false);
        });

        it('should suggest most common category', async () => {
            // Create a category
            const category = await db.insert(categories).values({ name: 'Entertainment' }).returning().get();

            // Create test transactions
            const account = await repo.getOrCreateAccount('Test Bank', 'bank');
            const job = await repo.createImportJob('test', 'completed', 'test');

            const drafts = [
                { date: new Date('2023-10-10'), amount: -50, description: 'Netflix', originalDescription: 'Netflix' },
                { date: new Date('2023-11-10'), amount: -50, description: 'Netflix', originalDescription: 'Netflix' },
                { date: new Date('2023-12-10'), amount: -55, description: 'Netflix', originalDescription: 'Netflix' },
            ];
            await repo.saveTransactions(drafts, account.id, job.id, 'credit_card');

            // Update category for first 2 transactions by id
            const allTxs = await db.select().from(transactions).where(eq(transactions.description, 'Netflix')).all();
            await db.update(transactions)
                .set({ categoryId: category.id })
                .where(eq(transactions.id, allTxs[0].id))
                .run();
            await db.update(transactions)
                .set({ categoryId: category.id })
                .where(eq(transactions.id, allTxs[1].id))
                .run();

            const res = await app.request('/recurring-transactions/preview?description=Netflix');
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.suggestedCategoryId).toBe(category.id);
        });

        it('should indicate if description is already recurring', async () => {
            await db.insert(recurringTransactions).values({
                description: 'Already Recurring',
                categoryId: null,
                averageAmount: 100,
                occurrenceCount: 1,
            }).run();

            const res = await app.request('/recurring-transactions/preview?description=Already%20Recurring');
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.isRecurring).toBe(true);
        });

        it('should return 400 for missing description parameter', async () => {
            const res = await app.request('/recurring-transactions/preview');
            expect(res.status).toBe(400);
        });
    });

    describe('Auto-mark during import', () => {
        it('should mark new transactions as recurring if description is in recurring list', async () => {
            // Add to recurring list
            await db.insert(recurringTransactions).values({
                description: 'Auto Recurring Test',
                categoryId: null,
                averageAmount: 100,
                occurrenceCount: 1,
            }).run();

            // Create new transactions via import
            const account = await repo.getOrCreateAccount('Test Bank', 'bank');
            const job = await repo.createImportJob('test', 'completed', 'test');

            const drafts = [
                { date: new Date('2023-12-10'), amount: -100, description: 'Auto Recurring Test', originalDescription: 'Auto Recurring Test' },
                { date: new Date('2023-12-11'), amount: -50, description: 'Not Recurring', originalDescription: 'Not Recurring' },
            ];
            await repo.saveTransactions(drafts, account.id, job.id, 'credit_card');

            // Verify auto-mark
            const allTransactions = await repo.getTransactions();
            const recurringTx = allTransactions.find(t => t.description === 'Auto Recurring Test');
            expect(recurringTx?.isRecurring).toBe(true);

            const notRecurringTx = allTransactions.find(t => t.description === 'Not Recurring');
            expect(notRecurringTx?.isRecurring).toBe(false);
        });
    });

    describe('GET /transactions', () => {
        it('should include isRecurring field in response', async () => {
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
            expect(data[0]).toHaveProperty('isRecurring');
            expect(data[0].isRecurring).toBe(false);
        });
    });
});
