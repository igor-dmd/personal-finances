import { db } from './index';
import { accounts, importJobs, transactions, categories, installmentGroups, investments, investmentMovements, ignoredDescriptions, recurringTransactions } from './schema';
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
            isInvestment: transactions.isInvestment,
            isIgnored: transactions.isIgnored,
            isRecurring: transactions.isRecurring,
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

        // Fetch ignored descriptions for auto-ignore
        const ignoredList = await this.getIgnoredDescriptions();
        const ignoredSet = new Set(ignoredList.map(d => d.description));

        // Fetch recurring descriptions for auto-mark recurring
        const recurringList = await this.getRecurringDescriptions();
        const recurringSet = new Set(recurringList.map(d => d.description));

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
                    const isInvestment = draft.description.toUpperCase().includes('RDB');
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
                        isInvestment,
                        isIgnored: ignoredSet.has(draft.description),
                        isRecurring: recurringSet.has(draft.description),
                    }).run();
                }
            }
        }

        // Process regular transactions
        if (regularDrafts.length > 0) {
            const txs = regularDrafts.map(draft => {
                const isInvestment = draft.description.toUpperCase().includes('RDB');
                return {
                    accountId,
                    importJobId,
                    date: draft.date,
                    amount: draft.amount,
                    description: draft.description,
                    originalDescription: draft.originalDescription,
                    type: transactionType,
                    installmentGroupId: null,
                    installmentNumber: null,
                    isInvestment,
                    isIgnored: ignoredSet.has(draft.description),
                    isRecurring: recurringSet.has(draft.description),
                };
            });

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
        isInvestment?: boolean;
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
            isInvestment: data.isInvestment ?? false,
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

    // ==================== Investment Methods ====================

    async createInvestment(data: {
        accountId: number;
        type: string;
        name: string;
        currentValue?: number;
    }) {
        const result = await db
            .insert(investments)
            .values({
                accountId: data.accountId,
                type: data.type,
                name: data.name,
                currentValue: data.currentValue ?? 0,
            })
            .returning()
            .get();
        return result;
    }

    async getInvestments() {
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

        // Enrich with movement summaries
        const enriched = await Promise.all(
            allInvestments.map(async (inv) => {
                const result = await db
                    .select({
                        totalDeposited: sql<number>`COALESCE(SUM(CASE WHEN type = 'deposit' THEN amount ELSE 0 END), 0)`,
                        totalWithdrawn: sql<number>`COALESCE(SUM(CASE WHEN type = 'withdrawal' THEN amount ELSE 0 END), 0)`,
                    })
                    .from(investmentMovements)
                    .where(eq(investmentMovements.investmentId, inv.id))
                    .get();

                const totalDeposited = result?.totalDeposited || 0;
                const totalWithdrawn = result?.totalWithdrawn || 0;
                const netInvested = totalDeposited - totalWithdrawn;
                const gain = inv.currentValue - netInvested;

                return {
                    ...inv,
                    totalDeposited,
                    totalWithdrawn,
                    netInvested,
                    gain,
                };
            })
        );

        return enriched;
    }

    async getInvestment(id: number) {
        const inv = await db
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

        if (!inv) return null;

        const movements = await db
            .select()
            .from(investmentMovements)
            .where(eq(investmentMovements.investmentId, id))
            .orderBy(sql`date DESC`)
            .all();

        // Calculate summaries
        let totalDeposited = 0;
        let totalWithdrawn = 0;
        for (const m of movements) {
            if (m.type === 'deposit') {
                totalDeposited += m.amount;
            } else {
                totalWithdrawn += m.amount;
            }
        }
        const netInvested = totalDeposited - totalWithdrawn;
        const gain = inv.currentValue - netInvested;

        return {
            ...inv,
            totalDeposited,
            totalWithdrawn,
            netInvested,
            gain,
            movements,
        };
    }

    async updateInvestment(
        id: number,
        data: { name?: string; type?: string; currentValue?: number }
    ) {
        const updateData: any = { ...data };
        if (Object.keys(updateData).length > 0) {
            updateData.updatedAt = new Date();
        }
        return await db
            .update(investments)
            .set(updateData)
            .where(eq(investments.id, id))
            .run();
    }

    async deleteInvestment(id: number) {
        // Cascade delete will handle movements automatically
        await db.delete(investments).where(eq(investments.id, id)).run();
    }

    // ==================== Investment Movement Methods ====================

    async createInvestmentMovement(data: {
        investmentId: number;
        type: 'deposit' | 'withdrawal';
        date: Date;
        amount: number;
        description?: string;
    }) {
        const result = await db
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
        return result;
    }

    async updateInvestmentMovement(
        id: number,
        data: { type?: 'deposit' | 'withdrawal'; date?: Date; amount?: number; description?: string | null }
    ) {
        return await db
            .update(investmentMovements)
            .set(data)
            .where(eq(investmentMovements.id, id))
            .run();
    }

    async deleteInvestmentMovement(id: number) {
        await db.delete(investmentMovements).where(eq(investmentMovements.id, id)).run();
    }

    async getInvestmentMovements(investmentId: number) {
        return await db
            .select()
            .from(investmentMovements)
            .where(eq(investmentMovements.investmentId, investmentId))
            .orderBy(sql`date DESC`)
            .all();
    }

    // ==================== Ignored Transactions Methods ====================

    async getIgnoredDescriptions() {
        return await db.select().from(ignoredDescriptions).orderBy(ignoredDescriptions.description).all();
    }

    async addIgnoredDescription(description: string): Promise<{ id: number; ignoredCount: number }> {
        const [inserted] = await db.insert(ignoredDescriptions)
            .values({ description })
            .returning({ id: ignoredDescriptions.id });

        const result = await db.update(transactions)
            .set({ isIgnored: true })
            .where(eq(transactions.description, description))
            .run();

        return { id: inserted.id, ignoredCount: result.changes };
    }

    async removeIgnoredDescription(id: number): Promise<{ unignoredCount: number }> {
        const record = await db.select()
            .from(ignoredDescriptions)
            .where(eq(ignoredDescriptions.id, id))
            .get();

        if (!record) throw new Error('Ignored description not found');

        await db.delete(ignoredDescriptions)
            .where(eq(ignoredDescriptions.id, id))
            .run();

        const result = await db.update(transactions)
            .set({ isIgnored: false })
            .where(eq(transactions.description, record.description))
            .run();

        return { unignoredCount: result.changes };
    }

    async getIgnorePreview(description: string): Promise<{ count: number; isIgnored: boolean }> {
        const countResult = await db.select({ count: sql<number>`count(*)` })
            .from(transactions)
            .where(eq(transactions.description, description))
            .get();

        const isIgnored = await db.select()
            .from(ignoredDescriptions)
            .where(eq(ignoredDescriptions.description, description))
            .get();

        return { count: countResult?.count || 0, isIgnored: !!isIgnored };
    }

    // ==================== Recurring Transactions Methods ====================

    async getRecurringDescriptions() {
        return await db.select().from(recurringTransactions).orderBy(recurringTransactions.description).all();
    }

    async getRecurringTransactions() {
        const recurring = await db.select({
            id: recurringTransactions.id,
            description: recurringTransactions.description,
            categoryId: recurringTransactions.categoryId,
            categoryName: categories.name,
            averageAmount: recurringTransactions.averageAmount,
            occurrenceCount: recurringTransactions.occurrenceCount,
            firstSeenDate: recurringTransactions.firstSeenDate,
            lastSeenDate: recurringTransactions.lastSeenDate,
            createdAt: recurringTransactions.createdAt,
        })
            .from(recurringTransactions)
            .leftJoin(categories, eq(recurringTransactions.categoryId, categories.id))
            .orderBy(recurringTransactions.description)
            .all();
        return recurring;
    }

    async addRecurringTransaction(description: string, categoryId?: number | null): Promise<{
        id: number;
        markedCount: number;
        averageAmount: number;
        occurrenceCount: number;
        firstSeenDate: Date | null;
        lastSeenDate: Date | null;
    }> {
        // Calculate statistics from matching transactions
        const matchingTxs = await db.select({
            amount: transactions.amount,
            date: transactions.date,
            categoryId: transactions.categoryId,
        })
            .from(transactions)
            .where(eq(transactions.description, description))
            .orderBy(transactions.date)
            .all();

        const occurrenceCount = matchingTxs.length;
        const averageAmount = occurrenceCount > 0
            ? Math.abs(matchingTxs.reduce((sum, t) => sum + t.amount, 0) / occurrenceCount)
            : 0;
        const firstSeenDate = matchingTxs[0]?.date || null;
        const lastSeenDate = matchingTxs[matchingTxs.length - 1]?.date || null;

        // Use suggested category if not provided
        const finalCategoryId = categoryId ?? matchingTxs[0]?.categoryId ?? null;

        // Insert the recurring transaction
        const [inserted] = await db.insert(recurringTransactions)
            .values({
                description,
                categoryId: finalCategoryId,
                averageAmount,
                occurrenceCount,
                firstSeenDate,
                lastSeenDate,
            })
            .returning({ id: recurringTransactions.id });

        // Mark existing transactions as recurring
        const result = await db.update(transactions)
            .set({ isRecurring: true })
            .where(eq(transactions.description, description))
            .run();

        return {
            id: inserted.id,
            markedCount: result.changes,
            averageAmount,
            occurrenceCount,
            firstSeenDate,
            lastSeenDate,
        };
    }

    async removeRecurringTransaction(id: number): Promise<{ unmarkedCount: number; description: string }> {
        const record = await db.select()
            .from(recurringTransactions)
            .where(eq(recurringTransactions.id, id))
            .get();

        if (!record) throw new Error('Recurring transaction not found');

        await db.delete(recurringTransactions)
            .where(eq(recurringTransactions.id, id))
            .run();

        const result = await db.update(transactions)
            .set({ isRecurring: false })
            .where(eq(transactions.description, record.description))
            .run();

        return { unmarkedCount: result.changes, description: record.description };
    }

    async updateRecurringTransactionCategory(id: number, categoryId: number | null): Promise<void> {
        await db.update(recurringTransactions)
            .set({ categoryId })
            .where(eq(recurringTransactions.id, id))
            .run();
    }

    async getRecurringPreview(description: string): Promise<{
        count: number;
        averageAmount: number;
        isRecurring: boolean;
        suggestedCategoryId: number | null;
    }> {
        const matchingTxs = await db.select({
            amount: transactions.amount,
            categoryId: transactions.categoryId,
        })
            .from(transactions)
            .where(eq(transactions.description, description))
            .all();

        const count = matchingTxs.length;
        const averageAmount = count > 0
            ? Math.abs(matchingTxs.reduce((sum, t) => sum + t.amount, 0) / count)
            : 0;

        const existing = await db.select()
            .from(recurringTransactions)
            .where(eq(recurringTransactions.description, description))
            .get();

        // Suggest the most common category
        const categoryCounts = new Map<number | null, number>();
        for (const tx of matchingTxs) {
            const catId = tx.categoryId;
            categoryCounts.set(catId, (categoryCounts.get(catId) || 0) + 1);
        }
        let suggestedCategoryId: number | null = null;
        let maxCount = 0;
        for (const [catId, cnt] of categoryCounts) {
            if (cnt > maxCount) {
                maxCount = cnt;
                suggestedCategoryId = catId;
            }
        }

        return {
            count,
            averageAmount,
            isRecurring: !!existing,
            suggestedCategoryId,
        };
    }

    async getFuturePlanningData(months: number = 6): Promise<{
        futureInstallments: Array<{
            groupId: number;
            description: string;
            installmentNumber: number;
            dueDate: Date | null;
            amount: number;
            remainingInstallments: number;
        }>;
        recurringExpenses: Array<{
            id: number;
            description: string;
            categoryName: string | null;
            averageAmount: number;
        }>;
        monthlyTotals: Array<{
            year: number;
            month: number;
            recurringTotal: number;
            installmentTotal: number;
        }>;
    }> {
        const today = new Date();
        const currentYear = today.getFullYear();
        const currentMonth = today.getMonth();

        // Get all installment groups with their future installments
        const groups = await this.getInstallmentGroups();
        const futureInstallments: Array<{
            groupId: number;
            description: string;
            installmentNumber: number;
            dueDate: Date | null;
            amount: number;
            remainingInstallments: number;
        }> = [];

        for (const group of groups) {
            if (group.paidInstallments < group.totalInstallments) {
                const remaining = group.totalInstallments - group.paidInstallments;
                const installmentAmount = group.totalAmount / group.totalInstallments;

                for (let i = group.paidInstallments + 1; i <= group.totalInstallments; i++) {
                    // Estimate due date based on remaining installments
                    const monthsAhead = i - group.paidInstallments - 1;
                    const estimatedDate = new Date(today);
                    estimatedDate.setMonth(estimatedDate.getMonth() + monthsAhead);

                    futureInstallments.push({
                        groupId: group.id,
                        description: group.description,
                        installmentNumber: i,
                        dueDate: estimatedDate,
                        amount: installmentAmount,
                        remainingInstallments: remaining,
                    });
                }
            }
        }

        // Get all recurring transactions
        const recurring = await this.getRecurringTransactions();
        const recurringExpenses = recurring.map(r => ({
            id: r.id,
            description: r.description,
            categoryName: r.categoryName,
            averageAmount: r.averageAmount,
        }));

        // Calculate monthly totals
        const monthlyTotals: Array<{
            year: number;
            month: number;
            recurringTotal: number;
            installmentTotal: number;
        }> = [];

        for (let m = 0; m < months; m++) {
            const targetYear = currentYear + Math.floor((currentMonth + m) / 12);
            const targetMonth = (currentMonth + m) % 12;

            // Sum recurring expenses (all recur monthly)
            const recurringTotal = recurringExpenses.reduce((sum, r) => sum + r.averageAmount, 0);

            // Sum installments due in this month
            let installmentTotal = 0;
            for (const inst of futureInstallments) {
                if (inst.dueDate) {
                    const instDate = new Date(inst.dueDate);
                    if (instDate.getFullYear() === targetYear && instDate.getMonth() === targetMonth) {
                        installmentTotal += inst.amount;
                    }
                }
            }

            monthlyTotals.push({
                year: targetYear,
                month: targetMonth,
                recurringTotal,
                installmentTotal,
            });
        }

        return {
            futureInstallments,
            recurringExpenses,
            monthlyTotals,
        };
    }
}
