import { eq, sql } from 'drizzle-orm';
import { db } from '../../../db';
import {
    accounts,
    categories,
    ignoredDescriptions,
    installmentGroups,
    recurringTransactions,
    transactions,
} from '../../../db/schema';
import type { TransactionDraft } from '../../../extraction/types';

export interface CreateManualTransactionInput {
    accountId: number;
    categoryId: number | null;
    date: Date;
    amount: number;
    description: string;
    type: string;
    isInvestment?: boolean;
}

export class TransactionsRepository {
    async listTransactions() {
        return db
            .select({
                id: transactions.id,
                date: transactions.date,
                amount: transactions.amount,
                description: transactions.description,
                originalDescription: transactions.originalDescription,
                type: transactions.type,
                accountName: accounts.name,
                categoryId: transactions.categoryId,
                categoryName: categories.name,
                installmentGroupId: transactions.installmentGroupId,
                installmentNumber: transactions.installmentNumber,
                isInvestment: transactions.isInvestment,
                isIgnored: transactions.isIgnored,
                isRecurring: transactions.isRecurring,
            })
            .from(transactions)
            .leftJoin(accounts, eq(transactions.accountId, accounts.id))
            .leftJoin(categories, eq(transactions.categoryId, categories.id))
            .all();
    }

    async updateTransaction(id: number, data: Partial<typeof transactions.$inferInsert>) {
        return db.update(transactions).set(data).where(eq(transactions.id, id)).run();
    }

    async deleteManualTransaction(id: number): Promise<void> {
        const existing = await db
            .select({ importJobId: transactions.importJobId })
            .from(transactions)
            .where(eq(transactions.id, id))
            .get();

        if (!existing) {
            throw new Error('Transaction not found');
        }

        if (existing.importJobId !== null) {
            throw new Error('Cannot delete imported transactions. Delete the import job instead.');
        }

        await db.delete(transactions).where(eq(transactions.id, id)).run();
    }

    async countByDescription(description: string): Promise<number> {
        const result = await db
            .select({ count: sql<number>`count(*)` })
            .from(transactions)
            .where(eq(transactions.description, description))
            .get();

        return result?.count || 0;
    }

    async bulkUpdateCategoryByDescription(
        description: string,
        categoryId: number | null
    ): Promise<{ count: number }> {
        const result = await db
            .update(transactions)
            .set({ categoryId })
            .where(eq(transactions.description, description))
            .run();

        return { count: result.changes };
    }

    async createManualTransaction(data: CreateManualTransactionInput) {
        return db
            .insert(transactions)
            .values({
                accountId: data.accountId,
                categoryId: data.categoryId,
                date: data.date,
                amount: data.amount,
                description: data.description,
                originalDescription: data.description,
                type: data.type,
                importJobId: null,
                isInvestment: data.isInvestment ?? false,
            })
            .returning()
            .get();
    }

    async saveImportedTransactions(
        drafts: TransactionDraft[],
        accountId: number,
        importJobId: number,
        transactionType: string
    ): Promise<void> {
        if (drafts.length === 0) {
            return;
        }

        const [ignoredSet, recurringSet] = await Promise.all([
            this.getIgnoredDescriptionSet(),
            this.getRecurringDescriptionSet(),
        ]);

        const installmentDrafts: TransactionDraft[] = [];
        const regularDrafts: TransactionDraft[] = [];

        for (const draft of drafts) {
            if (draft.installmentInfo?.hasInstallmentInfo) {
                installmentDrafts.push(draft);
            } else {
                regularDrafts.push(draft);
            }
        }

        if (installmentDrafts.length > 0) {
            const groupedDrafts = new Map<string, TransactionDraft[]>();

            for (const draft of installmentDrafts) {
                const info = draft.installmentInfo!;
                const key = `${info.merchantName}|${info.totalInstallments}`;
                const existing = groupedDrafts.get(key);
                if (existing) {
                    existing.push(draft);
                } else {
                    groupedDrafts.set(key, [draft]);
                }
            }

            for (const [groupKey, groupTransactions] of groupedDrafts) {
                const [merchantName, installments] = groupKey.split('|');
                const totalInstallments = Number.parseInt(installments, 10);
                const totalAmount = Math.abs(groupTransactions.reduce((sum, item) => sum + item.amount, 0));

                const group = await db
                    .insert(installmentGroups)
                    .values({
                        description: merchantName,
                        totalInstallments,
                        totalAmount,
                    })
                    .returning()
                    .get();

                for (const draft of groupTransactions) {
                    await db
                        .insert(transactions)
                        .values({
                            accountId,
                            importJobId,
                            date: draft.date,
                            amount: draft.amount,
                            description: draft.description,
                            originalDescription: draft.originalDescription,
                            type: transactionType,
                            installmentGroupId: group.id,
                            installmentNumber: draft.installmentInfo!.currentInstallment,
                            isInvestment: isInvestmentDescription(draft.description),
                            isIgnored: ignoredSet.has(draft.description),
                            isRecurring: recurringSet.has(draft.description),
                        })
                        .run();
                }
            }
        }

        if (regularDrafts.length > 0) {
            await db
                .insert(transactions)
                .values(
                    regularDrafts.map((draft) => ({
                        accountId,
                        importJobId,
                        date: draft.date,
                        amount: draft.amount,
                        description: draft.description,
                        originalDescription: draft.originalDescription,
                        type: transactionType,
                        installmentGroupId: null,
                        installmentNumber: null,
                        isInvestment: isInvestmentDescription(draft.description),
                        isIgnored: ignoredSet.has(draft.description),
                        isRecurring: recurringSet.has(draft.description),
                    }))
                )
                .run();
        }
    }

    private async getIgnoredDescriptionSet(): Promise<Set<string>> {
        const ignored = await db.select({ description: ignoredDescriptions.description }).from(ignoredDescriptions).all();
        return new Set(ignored.map((item) => item.description));
    }

    private async getRecurringDescriptionSet(): Promise<Set<string>> {
        const recurring = await db
            .select({ description: recurringTransactions.description })
            .from(recurringTransactions)
            .all();
        return new Set(recurring.map((item) => item.description));
    }
}

function isInvestmentDescription(description: string): boolean {
    return description.toUpperCase().includes('RDB');
}
