import { db } from './index';
import { accounts, importJobs, transactions, categories, installmentGroups } from './schema';
import { eq, and, sql, isNull } from 'drizzle-orm';
import { TransactionDraft } from '../extraction/types';

export class FinanceRepository {
    async getOrCreateAccount(name: string, type: string) {
        const existing = await db.select().from(accounts).where(eq(accounts.name, name)).get();
        if (existing) {
            return existing;
        }
        const result = await db.insert(accounts).values({ name, type }).returning().get();
        return result;
    }

    async createImportJob(filename: string, status: string, type: string) {
        const result = await db.insert(importJobs).values({ filename, status, type }).returning().get();
        return result;
    }

    async getImportJobs() {
        return await db.select().from(importJobs).orderBy(sql`id DESC`).all();
    }

    async deleteImportJob(id: number) {
        // Manually delete transactions first as a fallback for SQLite cascade issues
        await db.delete(transactions).where(eq(transactions.importJobId, id)).run();
        await db.delete(importJobs).where(eq(importJobs.id, id)).run();
    }



    async getCategories() {
        return await db.select().from(categories).all();
    }

    async createCategory(name: string) {
        const result = await db.insert(categories).values({ name }).returning().get();
        return result;
    }

    async updateCategory(id: number, name: string) {
        return await db.update(categories).set({ name }).where(eq(categories.id, id)).run();
    }

    async deleteCategory(id: number) {
        // Set categoryId to null on transactions first
        await db.update(transactions).set({ categoryId: null }).where(eq(transactions.categoryId, id)).run();
        // Then delete the category
        await db.delete(categories).where(eq(categories.id, id)).run();
    }

    async updateTransaction(id: number, data: Partial<typeof transactions.$inferInsert>) {
        return await db.update(transactions).set(data).where(eq(transactions.id, id)).run();
    }

    async getTransactions() {
        return await db.select({
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
        })
            .from(transactions)
            .leftJoin(accounts, eq(transactions.accountId, accounts.id))
            .leftJoin(categories, eq(transactions.categoryId, categories.id))
            .all();
    }

    async updateImportJobStatus(id: number, status: string) {
        await db.update(importJobs).set({ status }).where(eq(importJobs.id, id)).run();
    }

    async saveTransactions(drafts: TransactionDraft[], accountId: number, importJobId: number, transactionType: string) {
        if (drafts.length === 0) return;

        // Separate transactions with installment info from regular ones
        const installmentDrafts: TransactionDraft[] = [];
        const regularDrafts: TransactionDraft[] = [];

        for (const draft of drafts) {
            if (draft.installmentInfo?.hasInstallmentInfo) {
                installmentDrafts.push(draft);
            } else {
                regularDrafts.push(draft);
            }
        }

        // Process installment transactions: group by merchant + total installments
        if (installmentDrafts.length > 0) {
            const groupMap = new Map<string, TransactionDraft[]>();

            for (const draft of installmentDrafts) {
                const info = draft.installmentInfo!;
                const key = `${info.merchantName}|${info.totalInstallments}`;

                if (!groupMap.has(key)) {
                    groupMap.set(key, []);
                }
                groupMap.get(key)!.push(draft);
            }

            // Create installment groups and transactions
            for (const [key, groupDrafts] of groupMap) {
                const [merchantName, totalInstallmentsStr] = key.split('|');
                const totalInstallments = parseInt(totalInstallmentsStr, 10);
                const totalAmount = Math.abs(groupDrafts.reduce((sum, d) => sum + d.amount, 0));

                // Create installment group
                const group = await db
                    .insert(installmentGroups)
                    .values({
                        description: merchantName,
                        totalInstallments,
                        totalAmount,
                    })
                    .returning()
                    .get();

                // Create transactions with group link
                for (const draft of groupDrafts) {
                    await db.insert(transactions).values({
                        accountId,
                        importJobId,
                        date: draft.date,
                        amount: draft.amount,
                        description: draft.description,
                        originalDescription: draft.originalDescription,
                        type: transactionType,
                        installmentGroupId: group.id,
                        installmentNumber: draft.installmentInfo!.currentInstallment,
                    }).run();
                }
            }
        }

        // Process regular transactions
        if (regularDrafts.length > 0) {
            const txs = regularDrafts.map(draft => ({
                accountId,
                importJobId,
                date: draft.date,
                amount: draft.amount,
                description: draft.description,
                originalDescription: draft.originalDescription,
                type: transactionType,
                installmentGroupId: null,
                installmentNumber: null,
            }));

            await db.insert(transactions).values(txs).run();
        }
    }

    async countTransactionsByDescription(description: string): Promise<number> {
        const result = await db
            .select({ count: sql<number>`count(*)` })
            .from(transactions)
            .where(eq(transactions.description, description))
            .get();

        return result?.count || 0;
    }

    async createTransaction(data: {
        accountId: number;
        categoryId: number | null;
        date: Date;
        amount: number;
        description: string;
        type: string;
    }) {
        const result = await db.insert(transactions).values({
            accountId: data.accountId,
            categoryId: data.categoryId,
            date: data.date,
            amount: data.amount,
            description: data.description,
            originalDescription: data.description,
            type: data.type,
            importJobId: null,
        }).returning().get();
        return result;
    }

    async deleteTransaction(id: number) {
        const transaction = await db
            .select({ importJobId: transactions.importJobId })
            .from(transactions)
            .where(eq(transactions.id, id))
            .get();

        if (!transaction) {
            throw new Error('Transaction not found');
        }

        if (transaction.importJobId !== null) {
            throw new Error('Cannot delete imported transactions. Delete the import job instead.');
        }

        await db.delete(transactions).where(eq(transactions.id, id)).run();
    }

    async getAccounts() {
        return await db.select().from(accounts).all();
    }

    async updateTransactionsByDescription(
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

    // ==================== Installment Methods ====================

    async createInstallmentGroup(
        description: string,
        totalInstallments: number,
        totalAmount: number
    ): Promise<number> {
        const result = await db
            .insert(installmentGroups)
            .values({ description, totalInstallments, totalAmount })
            .returning()
            .get();
        return result.id;
    }

    async getInstallmentGroup(groupId: number) {
        const group = await db
            .select()
            .from(installmentGroups)
            .where(eq(installmentGroups.id, groupId))
            .get();

        if (!group) return null;

        const txs = await db
            .select()
            .from(transactions)
            .where(eq(transactions.installmentGroupId, groupId))
            .orderBy(transactions.installmentNumber)
            .all();

        return { ...group, transactions: txs };
    }

    async getInstallmentGroups() {
        const groups = await db.select().from(installmentGroups).all();

        // For each group, calculate paid installments and amounts
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
                const remainingAmount = group.totalAmount - paidAmount;

                return {
                    ...group,
                    paidInstallments,
                    paidAmount,
                    remainingAmount,
                };
            })
        );

        return enriched;
    }

    async updateInstallmentGroup(
        groupId: number,
        data: { description?: string; totalInstallments?: number; totalAmount?: number }
    ) {
        return await db
            .update(installmentGroups)
            .set(data)
            .where(eq(installmentGroups.id, groupId))
            .run();
    }

    async deleteInstallmentGroup(groupId: number) {
        // Cascade delete will handle transactions automatically
        await db.delete(installmentGroups).where(eq(installmentGroups.id, groupId)).run();
    }

    async getFutureInstallments(groupId: number) {
        const group = await this.getInstallmentGroup(groupId);
        if (!group) return [];

        const existingTxs = group.transactions;
        const installmentAmount = group.totalAmount / group.totalInstallments;

        // Find which installments haven't been paid yet
        const futureInstallments = [];
        for (let i = 1; i <= group.totalInstallments; i++) {
            const existing = existingTxs.find((tx: any) => tx.installmentNumber === i);
            if (!existing) {
                // Estimate due date based on previous installments
                let estimatedDate = null;
                if (existingTxs.length > 0) {
                    const lastTx = existingTxs[existingTxs.length - 1] as any;
                    const monthsAhead = i - (lastTx.installmentNumber || 1);
                    estimatedDate = new Date(lastTx.date);
                    estimatedDate.setMonth(estimatedDate.getMonth() + monthsAhead);
                }

                futureInstallments.push({
                    installmentNumber: i,
                    dueDate: estimatedDate,
                    amount: installmentAmount,
                });
            }
        }

        return futureInstallments;
    }
}
