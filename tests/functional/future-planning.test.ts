import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import * as fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { FinanceRepository } from '../../src/db/repository';
import { db } from '../../src/db';
import { transactions, importJobs, accounts, installmentGroups, recurringTransactions } from '../../src/db/schema';

const execAsync = promisify(exec);
const TEST_DB = 'test-future-planning.db';

describe('Future Planning API', () => {
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
        await db.delete(installmentGroups).run();
        await db.delete(importJobs).run();
        await db.delete(accounts).run();
    });

    describe('GET /future-planning', () => {
        it('should return empty data initially', async () => {
            const res = await app.request('/future-planning');
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data).toHaveProperty('futureInstallments');
            expect(data).toHaveProperty('recurringExpenses');
            expect(data).toHaveProperty('monthlyTotals');
            expect(data.futureInstallments).toEqual([]);
            expect(data.recurringExpenses).toEqual([]);
            expect(data.monthlyTotals).toHaveLength(6); // Default 6 months
        });

        it('should include future installments', async () => {
            // Create installment group with some paid installments
            const account = await repo.getOrCreateAccount('Test Bank', 'bank');
            const job = await repo.createImportJob('test', 'completed', 'test');

            const groupId = await repo.createInstallmentGroup('Laptop', 12, 12000);

            // Create 3 paid installments
            for (let i = 1; i <= 3; i++) {
                await db.insert(transactions).values({
                    accountId: account.id,
                    importJobId: job.id,
                    date: new Date(2023, 11 - i, 10),
                    amount: -1000,
                    description: 'Laptop',
                    originalDescription: 'Laptop',
                    type: 'credit_card',
                    installmentGroupId: groupId,
                    installmentNumber: i,
                    isInvestment: false,
                    isIgnored: false,
                    isRecurring: false,
                }).run();
            }

            const res = await app.request('/future-planning');
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.futureInstallments.length).toBeGreaterThan(0);
            expect(data.futureInstallments[0]).toMatchObject({
                groupId,
                description: 'Laptop',
                amount: 1000,
            });
        });

        it('should include recurring expenses', async () => {
            // Create recurring transaction
            await db.insert(recurringTransactions).values({
                description: 'Rent',
                categoryId: null,
                averageAmount: 1500,
                occurrenceCount: 6,
            }).run();

            const res = await app.request('/future-planning');
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.recurringExpenses).toHaveLength(1);
            expect(data.recurringExpenses[0]).toMatchObject({
                description: 'Rent',
                averageAmount: 1500,
            });
        });

        it('should calculate monthly totals', async () => {
            // Create recurring expense
            await db.insert(recurringTransactions).values({
                description: 'Rent',
                categoryId: null,
                averageAmount: 1500,
                occurrenceCount: 6,
            }).run();

            // Create installment
            const account = await repo.getOrCreateAccount('Test Bank', 'bank');
            const job = await repo.createImportJob('test', 'completed', 'test');
            const groupId = await repo.createInstallmentGroup('Furniture', 3, 3000);

            await db.insert(transactions).values({
                accountId: account.id,
                importJobId: job.id,
                date: new Date(),
                amount: -1000,
                description: 'Furniture',
                originalDescription: 'Furniture',
                type: 'credit_card',
                installmentGroupId: groupId,
                installmentNumber: 1,
                isInvestment: false,
                isIgnored: false,
                isRecurring: false,
            }).run();

            const res = await app.request('/future-planning');
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.monthlyTotals).toHaveLength(6);

            // First month should have both recurring and installment
            const firstMonth = data.monthlyTotals[0];
            expect(firstMonth.recurringTotal).toBe(1500);
            expect(firstMonth.installmentTotal).toBeGreaterThan(0);
        });

        it('should respect months parameter', async () => {
            const res = await app.request('/future-planning?months=3');
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.monthlyTotals).toHaveLength(3);
        });

        it('should default to 6 months', async () => {
            const res = await app.request('/future-planning');
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.monthlyTotals).toHaveLength(6);
        });
    });
});
