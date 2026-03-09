import { eq, sql } from 'drizzle-orm';
import { db } from '../../../db';
import { installmentGroups, transactions } from '../../../db/schema';

interface CreateInstallmentTransactionInput {
    accountId: number;
    categoryId: number | null;
    date: Date;
    amount: number;
    description: string;
    type: string;
    installmentGroupId: number;
    installmentNumber: number;
}

export class InstallmentsRepository {
    async listGroups() {
        const groups = await db.select().from(installmentGroups).all();

        const enriched = await Promise.all(
            groups.map(async (group) => {
                const result = await db
                    .select({
                        count: sql<number>`count(*)`,
                        paidAmount: sql<number>`COALESCE(SUM(ABS(amount)), 0)`,
                    })
                    .from(transactions)
                    .where(eq(transactions.installmentGroupId, group.id))
                    .get();

                const paidInstallments = result?.count || 0;
                const paidAmount = result?.paidAmount || 0;

                return {
                    ...group,
                    paidInstallments,
                    paidAmount,
                    remainingAmount: group.totalAmount - paidAmount,
                };
            })
        );

        return enriched;
    }

    async getGroup(id: number) {
        const group = await db
            .select()
            .from(installmentGroups)
            .where(eq(installmentGroups.id, id))
            .get();

        if (!group) {
            return null;
        }

        const groupTransactions = await db
            .select()
            .from(transactions)
            .where(eq(transactions.installmentGroupId, id))
            .orderBy(transactions.installmentNumber)
            .all();

        return {
            ...group,
            transactions: groupTransactions,
        };
    }

    async createGroup(description: string, totalInstallments: number, totalAmount: number): Promise<number> {
        const created = await db
            .insert(installmentGroups)
            .values({
                description,
                totalInstallments,
                totalAmount,
            })
            .returning()
            .get();

        return created.id;
    }

    async createInstallmentTransaction(input: CreateInstallmentTransactionInput) {
        return db
            .insert(transactions)
            .values({
                accountId: input.accountId,
                categoryId: input.categoryId,
                date: input.date,
                amount: input.amount,
                description: input.description,
                originalDescription: input.description,
                type: input.type,
                importJobId: null,
                installmentGroupId: input.installmentGroupId,
                installmentNumber: input.installmentNumber,
                isInvestment: false,
            })
            .returning()
            .get();
    }

    async updateGroup(id: number, data: { description?: string; totalInstallments?: number; totalAmount?: number }) {
        return db
            .update(installmentGroups)
            .set(data)
            .where(eq(installmentGroups.id, id))
            .run();
    }

    async deleteGroup(id: number): Promise<void> {
        await db.delete(installmentGroups).where(eq(installmentGroups.id, id)).run();
    }

    async getFutureInstallments(groupId: number) {
        const group = await this.getGroup(groupId);
        if (!group) {
            return [];
        }

        const installmentAmount = group.totalAmount / group.totalInstallments;
        const existingTransactions = group.transactions;

        const futureInstallments: Array<{
            installmentNumber: number;
            dueDate: Date | null;
            amount: number;
        }> = [];

        for (let installmentNumber = 1; installmentNumber <= group.totalInstallments; installmentNumber += 1) {
            const exists = existingTransactions.find((item) => item.installmentNumber === installmentNumber);
            if (exists) {
                continue;
            }

            let estimatedDate: Date | null = null;
            if (existingTransactions.length > 0) {
                const latest = existingTransactions[existingTransactions.length - 1];
                const monthsAhead = installmentNumber - (latest.installmentNumber || 1);
                estimatedDate = new Date(latest.date);
                estimatedDate.setMonth(estimatedDate.getMonth() + monthsAhead);
            }

            futureInstallments.push({
                installmentNumber,
                dueDate: estimatedDate,
                amount: installmentAmount,
            });
        }

        return futureInstallments;
    }
}
