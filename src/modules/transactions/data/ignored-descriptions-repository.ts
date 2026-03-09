import { eq, sql } from 'drizzle-orm';
import { db } from '../../../db';
import { ignoredDescriptions, transactions } from '../../../db/schema';

export class IgnoredDescriptionsRepository {
    async list() {
        return db.select().from(ignoredDescriptions).orderBy(ignoredDescriptions.description).all();
    }

    async preview(description: string): Promise<{ count: number; isIgnored: boolean }> {
        const countResult = await db
            .select({ count: sql<number>`count(*)` })
            .from(transactions)
            .where(eq(transactions.description, description))
            .get();

        const ignored = await db
            .select()
            .from(ignoredDescriptions)
            .where(eq(ignoredDescriptions.description, description))
            .get();

        return {
            count: countResult?.count || 0,
            isIgnored: !!ignored,
        };
    }

    async add(description: string): Promise<{ id: number; ignoredCount: number }> {
        const [inserted] = await db
            .insert(ignoredDescriptions)
            .values({ description })
            .returning({ id: ignoredDescriptions.id });

        const result = await db
            .update(transactions)
            .set({ isIgnored: true })
            .where(eq(transactions.description, description))
            .run();

        return { id: inserted.id, ignoredCount: result.changes };
    }

    async remove(id: number): Promise<{ unignoredCount: number }> {
        const existing = await db
            .select()
            .from(ignoredDescriptions)
            .where(eq(ignoredDescriptions.id, id))
            .get();

        if (!existing) {
            throw new Error('Ignored description not found');
        }

        await db.delete(ignoredDescriptions).where(eq(ignoredDescriptions.id, id)).run();

        const result = await db
            .update(transactions)
            .set({ isIgnored: false })
            .where(eq(transactions.description, existing.description))
            .run();

        return { unignoredCount: result.changes };
    }
}
