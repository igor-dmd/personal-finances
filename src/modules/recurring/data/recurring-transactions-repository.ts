import { eq } from 'drizzle-orm';
import { db } from '../../../db';
import { categories, recurringTransactions, transactions } from '../../../db/schema';

export class RecurringTransactionsRepository {
    async list() {
        return db
            .select({
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
    }

    async preview(description: string): Promise<{
        count: number;
        averageAmount: number;
        isRecurring: boolean;
        suggestedCategoryId: number | null;
    }> {
        const matches = await db
            .select({ amount: transactions.amount, categoryId: transactions.categoryId })
            .from(transactions)
            .where(eq(transactions.description, description))
            .all();

        const count = matches.length;
        const averageAmount =
            count > 0 ? Math.abs(matches.reduce((sum, item) => sum + item.amount, 0) / count) : 0;

        const existing = await db
            .select()
            .from(recurringTransactions)
            .where(eq(recurringTransactions.description, description))
            .get();

        const categoryCounts = new Map<number | null, number>();
        for (const item of matches) {
            const current = categoryCounts.get(item.categoryId) || 0;
            categoryCounts.set(item.categoryId, current + 1);
        }

        let suggestedCategoryId: number | null = null;
        let maxCount = 0;
        for (const [categoryId, seenCount] of categoryCounts) {
            if (seenCount > maxCount) {
                maxCount = seenCount;
                suggestedCategoryId = categoryId;
            }
        }

        return {
            count,
            averageAmount,
            isRecurring: !!existing,
            suggestedCategoryId,
        };
    }

    async listDescriptions() {
        return db.select().from(recurringTransactions).orderBy(recurringTransactions.description).all();
    }

    async add(description: string, categoryId?: number | null): Promise<{
        id: number;
        markedCount: number;
        averageAmount: number;
        occurrenceCount: number;
        firstSeenDate: Date | null;
        lastSeenDate: Date | null;
    }> {
        const matchingTransactions = await db
            .select({ amount: transactions.amount, date: transactions.date, categoryId: transactions.categoryId })
            .from(transactions)
            .where(eq(transactions.description, description))
            .orderBy(transactions.date)
            .all();

        const occurrenceCount = matchingTransactions.length;
        const averageAmount =
            occurrenceCount > 0
                ? Math.abs(
                      matchingTransactions.reduce((sum, item) => sum + item.amount, 0) / occurrenceCount
                  )
                : 0;

        const firstSeenDate = matchingTransactions[0]?.date || null;
        const lastSeenDate = matchingTransactions[matchingTransactions.length - 1]?.date || null;
        const finalCategoryId = categoryId ?? matchingTransactions[0]?.categoryId ?? null;

        const [inserted] = await db
            .insert(recurringTransactions)
            .values({
                description,
                categoryId: finalCategoryId,
                averageAmount,
                occurrenceCount,
                firstSeenDate,
                lastSeenDate,
            })
            .returning({ id: recurringTransactions.id });

        const result = await db
            .update(transactions)
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

    async updateCategory(id: number, categoryId: number | null): Promise<void> {
        await db
            .update(recurringTransactions)
            .set({ categoryId })
            .where(eq(recurringTransactions.id, id))
            .run();
    }

    async remove(id: number): Promise<{ unmarkedCount: number; description: string }> {
        const existing = await db
            .select()
            .from(recurringTransactions)
            .where(eq(recurringTransactions.id, id))
            .get();

        if (!existing) {
            throw new Error('Recurring transaction not found');
        }

        await db.delete(recurringTransactions).where(eq(recurringTransactions.id, id)).run();

        const result = await db
            .update(transactions)
            .set({ isRecurring: false })
            .where(eq(transactions.description, existing.description))
            .run();

        return {
            unmarkedCount: result.changes,
            description: existing.description,
        };
    }
}
