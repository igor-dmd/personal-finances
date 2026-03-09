import { eq, sql } from 'drizzle-orm';
import { db } from '../../../db';
import { accounts, investmentMovements, investments } from '../../../db/schema';

interface CreateInvestmentInput {
    accountId: number;
    type: string;
    name: string;
    currentValue?: number;
}

interface CreateMovementInput {
    investmentId: number;
    type: 'deposit' | 'withdrawal';
    date: Date;
    amount: number;
    description?: string;
}

interface UpdateMovementInput {
    type?: 'deposit' | 'withdrawal';
    date?: Date;
    amount?: number;
    description?: string | null;
}

export class InvestmentsRepository {
    async list() {
        const allInvestments = await db
            .select({
                id: investments.id,
                accountId: investments.accountId,
                accountName: accounts.name,
                type: investments.type,
                name: investments.name,
                currentValue: investments.currentValue,
                createdAt: investments.createdAt,
                updatedAt: investments.updatedAt,
            })
            .from(investments)
            .leftJoin(accounts, eq(investments.accountId, accounts.id))
            .all();

        const enriched = await Promise.all(
            allInvestments.map(async (investment) => {
                const summary = await db
                    .select({
                        totalDeposited: sql<number>`COALESCE(SUM(CASE WHEN type = 'deposit' THEN amount ELSE 0 END), 0)`,
                        totalWithdrawn: sql<number>`COALESCE(SUM(CASE WHEN type = 'withdrawal' THEN amount ELSE 0 END), 0)`,
                    })
                    .from(investmentMovements)
                    .where(eq(investmentMovements.investmentId, investment.id))
                    .get();

                const totalDeposited = summary?.totalDeposited || 0;
                const totalWithdrawn = summary?.totalWithdrawn || 0;
                const netInvested = totalDeposited - totalWithdrawn;

                return {
                    ...investment,
                    totalDeposited,
                    totalWithdrawn,
                    netInvested,
                    gain: investment.currentValue - netInvested,
                };
            })
        );

        return enriched;
    }

    async getById(id: number) {
        const investment = await db
            .select({
                id: investments.id,
                accountId: investments.accountId,
                accountName: accounts.name,
                type: investments.type,
                name: investments.name,
                currentValue: investments.currentValue,
                createdAt: investments.createdAt,
                updatedAt: investments.updatedAt,
            })
            .from(investments)
            .leftJoin(accounts, eq(investments.accountId, accounts.id))
            .where(eq(investments.id, id))
            .get();

        if (!investment) {
            return null;
        }

        const movements = await db
            .select()
            .from(investmentMovements)
            .where(eq(investmentMovements.investmentId, id))
            .orderBy(sql`date DESC`)
            .all();

        let totalDeposited = 0;
        let totalWithdrawn = 0;

        for (const movement of movements) {
            if (movement.type === 'deposit') {
                totalDeposited += movement.amount;
            } else {
                totalWithdrawn += movement.amount;
            }
        }

        const netInvested = totalDeposited - totalWithdrawn;

        return {
            ...investment,
            totalDeposited,
            totalWithdrawn,
            netInvested,
            gain: investment.currentValue - netInvested,
            movements,
        };
    }

    async create(data: CreateInvestmentInput) {
        return db
            .insert(investments)
            .values({
                accountId: data.accountId,
                type: data.type,
                name: data.name,
                currentValue: data.currentValue ?? 0,
            })
            .returning()
            .get();
    }

    async update(id: number, data: { name?: string; type?: string; currentValue?: number }) {
        const updateData: { name?: string; type?: string; currentValue?: number; updatedAt?: Date } = {
            ...data,
        };

        if (Object.keys(data).length > 0) {
            updateData.updatedAt = new Date();
        }

        return db.update(investments).set(updateData).where(eq(investments.id, id)).run();
    }

    async delete(id: number): Promise<void> {
        await db.delete(investments).where(eq(investments.id, id)).run();
    }

    async createMovement(data: CreateMovementInput) {
        return db
            .insert(investmentMovements)
            .values({
                investmentId: data.investmentId,
                type: data.type,
                date: data.date,
                amount: data.amount,
                description: data.description || null,
            })
            .returning()
            .get();
    }

    async updateMovement(id: number, data: UpdateMovementInput) {
        return db.update(investmentMovements).set(data).where(eq(investmentMovements.id, id)).run();
    }

    async deleteMovement(id: number): Promise<void> {
        await db.delete(investmentMovements).where(eq(investmentMovements.id, id)).run();
    }
}
