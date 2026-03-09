import { eq } from 'drizzle-orm';
import { db } from '../../../db';
import { categories, transactions } from '../../../db/schema';

export class CategoriesRepository {
    async list() {
        return db.select().from(categories).all();
    }

    async create(name: string) {
        return db.insert(categories).values({ name }).returning().get();
    }

    async update(id: number, name: string) {
        return db.update(categories).set({ name }).where(eq(categories.id, id)).run();
    }

    async delete(id: number): Promise<void> {
        await db.update(transactions).set({ categoryId: null }).where(eq(transactions.categoryId, id)).run();
        await db.delete(categories).where(eq(categories.id, id)).run();
    }
}
