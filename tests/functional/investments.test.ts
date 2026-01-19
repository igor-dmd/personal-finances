import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import * as fs from 'fs';
import { exec } from 'child_process';
import { promisify } from 'util';
import { FinanceRepository } from '../../src/db/repository';
import { db } from '../../src/db';
import { investments, investmentMovements, accounts, transactions, importJobs, installmentGroups } from '../../src/db/schema';

const execAsync = promisify(exec);
const TEST_DB = 'test-investments.db';

describe('Investments API Tests', () => {
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
        await db.delete(investmentMovements).run();
        await db.delete(investments).run();
        await db.delete(transactions).run();
        await db.delete(installmentGroups).run();
        await db.delete(importJobs).run();
        await db.delete(accounts).run();
    });

    describe('GET /investments', () => {
        it('should return empty list initially', async () => {
            const res = await app.request('/investments');
            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data).toEqual([]);
        });

        it('should return investments with calculated summaries', async () => {
            // Create account and investment
            const account = await repo.getOrCreateAccount('Nubank Investimento', 'investment');
            const investment = await repo.createInvestment({
                accountId: account.id,
                type: 'CDB',
                name: 'CDB Nubank 110%',
                currentValue: 1100
            });

            // Add movements
            await repo.createInvestmentMovement({
                investmentId: investment.id,
                type: 'deposit',
                date: new Date('2024-01-01'),
                amount: 1000,
                description: 'Aporte inicial'
            });

            const res = await app.request('/investments');
            expect(res.status).toBe(200);
            const data = await res.json();

            expect(data).toHaveLength(1);
            expect(data[0].name).toBe('CDB Nubank 110%');
            expect(data[0].type).toBe('CDB');
            expect(data[0].currentValue).toBe(1100);
            expect(data[0].totalDeposited).toBe(1000);
            expect(data[0].totalWithdrawn).toBe(0);
            expect(data[0].netInvested).toBe(1000);
            expect(data[0].gain).toBe(100); // 1100 - 1000
        });
    });

    describe('GET /investments/types', () => {
        it('should return list of valid investment types', async () => {
            const res = await app.request('/investments/types');
            expect(res.status).toBe(200);
            const data = await res.json();

            expect(data).toContain('RDB');
            expect(data).toContain('CDB');
            expect(data).toContain('LCI');
            expect(data).toContain('LCA');
            expect(data).toContain('Tesouro Direto');
            expect(data).toContain('Outros');
        });
    });

    describe('POST /investments', () => {
        it('should create investment successfully', async () => {
            const res = await app.request('/investments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    institutionId: 'nubank',
                    type: 'RDB',
                    name: 'RDB Nubank',
                    currentValue: 500
                })
            });

            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.success).toBe(true);
            expect(data.investment).toBeDefined();
            expect(data.investment.name).toBe('RDB Nubank');
            expect(data.investment.type).toBe('RDB');
            expect(data.investment.currentValue).toBe(500);
        });

        it('should return 400 for invalid institution', async () => {
            const res = await app.request('/investments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    institutionId: 'invalid-institution',
                    type: 'CDB',
                    name: 'Test'
                })
            });

            expect(res.status).toBe(400);
        });

        it('should return 400 for missing required fields', async () => {
            const res = await app.request('/investments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    institutionId: 'nubank'
                    // Missing type and name
                })
            });

            expect(res.status).toBe(400);
        });
    });

    describe('GET /investments/:id', () => {
        it('should return investment with movements', async () => {
            const account = await repo.getOrCreateAccount('Nubank Investimento', 'investment');
            const investment = await repo.createInvestment({
                accountId: account.id,
                type: 'LCI',
                name: 'LCI Nubank',
                currentValue: 2000
            });

            await repo.createInvestmentMovement({
                investmentId: investment.id,
                type: 'deposit',
                date: new Date('2024-01-15'),
                amount: 1500
            });

            await repo.createInvestmentMovement({
                investmentId: investment.id,
                type: 'deposit',
                date: new Date('2024-02-15'),
                amount: 500
            });

            const res = await app.request(`/investments/${investment.id}`);
            expect(res.status).toBe(200);
            const data = await res.json();

            expect(data.name).toBe('LCI Nubank');
            expect(data.movements).toHaveLength(2);
            expect(data.totalDeposited).toBe(2000);
        });

        it('should return 404 for non-existent investment', async () => {
            const res = await app.request('/investments/99999');
            expect(res.status).toBe(404);
        });
    });

    describe('PATCH /investments/:id', () => {
        it('should update investment name', async () => {
            const account = await repo.getOrCreateAccount('Test Investment', 'investment');
            const investment = await repo.createInvestment({
                accountId: account.id,
                type: 'CDB',
                name: 'Original Name'
            });

            const res = await app.request(`/investments/${investment.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'Updated Name' })
            });

            expect(res.status).toBe(200);

            // Verify update
            const getRes = await app.request(`/investments/${investment.id}`);
            const data = await getRes.json();
            expect(data.name).toBe('Updated Name');
        });

        it('should update currentValue', async () => {
            const account = await repo.getOrCreateAccount('Test Investment', 'investment');
            const investment = await repo.createInvestment({
                accountId: account.id,
                type: 'CDB',
                name: 'Test',
                currentValue: 1000
            });

            const res = await app.request(`/investments/${investment.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentValue: 1150 })
            });

            expect(res.status).toBe(200);

            // Verify update
            const getRes = await app.request(`/investments/${investment.id}`);
            const data = await getRes.json();
            expect(data.currentValue).toBe(1150);
        });
    });

    describe('DELETE /investments/:id', () => {
        it('should delete investment and all movements', async () => {
            const account = await repo.getOrCreateAccount('Test Investment', 'investment');
            const investment = await repo.createInvestment({
                accountId: account.id,
                type: 'RDB',
                name: 'To Delete'
            });

            await repo.createInvestmentMovement({
                investmentId: investment.id,
                type: 'deposit',
                date: new Date(),
                amount: 100
            });

            const res = await app.request(`/investments/${investment.id}`, {
                method: 'DELETE'
            });

            expect(res.status).toBe(200);

            // Verify deletion
            const getRes = await app.request(`/investments/${investment.id}`);
            expect(getRes.status).toBe(404);
        });
    });

    describe('Investment Movements', () => {
        it('should create deposit movement', async () => {
            const account = await repo.getOrCreateAccount('Test Investment', 'investment');
            const investment = await repo.createInvestment({
                accountId: account.id,
                type: 'CDB',
                name: 'Test'
            });

            const res = await app.request(`/investments/${investment.id}/movements`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'deposit',
                    date: '2024-01-15',
                    amount: 500,
                    description: 'Aporte mensal'
                })
            });

            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.success).toBe(true);
            expect(data.movement.type).toBe('deposit');
            expect(data.movement.amount).toBe(500);
        });

        it('should create withdrawal movement', async () => {
            const account = await repo.getOrCreateAccount('Test Investment', 'investment');
            const investment = await repo.createInvestment({
                accountId: account.id,
                type: 'CDB',
                name: 'Test',
                currentValue: 1000
            });

            const res = await app.request(`/investments/${investment.id}/movements`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'withdrawal',
                    date: '2024-03-01',
                    amount: 200
                })
            });

            expect(res.status).toBe(200);
            const data = await res.json();
            expect(data.movement.type).toBe('withdrawal');
        });

        it('should delete movement', async () => {
            const account = await repo.getOrCreateAccount('Test Investment', 'investment');
            const investment = await repo.createInvestment({
                accountId: account.id,
                type: 'CDB',
                name: 'Test'
            });

            const movement = await repo.createInvestmentMovement({
                investmentId: investment.id,
                type: 'deposit',
                date: new Date(),
                amount: 100
            });

            const res = await app.request(`/investments/${investment.id}/movements/${movement.id}`, {
                method: 'DELETE'
            });

            expect(res.status).toBe(200);

            // Verify movement was deleted
            const getRes = await app.request(`/investments/${investment.id}`);
            const data = await getRes.json();
            expect(data.movements).toHaveLength(0);
        });

        it('should recalculate totals after movement changes', async () => {
            const account = await repo.getOrCreateAccount('Test Investment', 'investment');
            const investment = await repo.createInvestment({
                accountId: account.id,
                type: 'CDB',
                name: 'Test',
                currentValue: 1000
            });

            // Add deposit
            await app.request(`/investments/${investment.id}/movements`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'deposit',
                    date: '2024-01-01',
                    amount: 800
                })
            });

            // Add withdrawal
            await app.request(`/investments/${investment.id}/movements`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'withdrawal',
                    date: '2024-02-01',
                    amount: 200
                })
            });

            // Check totals
            const res = await app.request(`/investments/${investment.id}`);
            const data = await res.json();

            expect(data.totalDeposited).toBe(800);
            expect(data.totalWithdrawn).toBe(200);
            expect(data.netInvested).toBe(600);
            expect(data.gain).toBe(400); // currentValue (1000) - netInvested (600)
        });

        it('should return 404 when adding movement to non-existent investment', async () => {
            const res = await app.request('/investments/99999/movements', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    type: 'deposit',
                    date: '2024-01-01',
                    amount: 100
                })
            });

            expect(res.status).toBe(404);
        });
    });
});
