import { eq } from 'drizzle-orm';
import { db } from '../../../db';
import { accounts } from '../../../db/schema';
import type { AccountType } from '../../../shared/config/institutions';

export type AccountEntity = typeof accounts.$inferSelect;

export class AccountsRepository {
    async getOrCreate(name: string, type: AccountType | 'bank'): Promise<AccountEntity> {
        const existing = await db.select().from(accounts).where(eq(accounts.name, name)).get();
        if (existing) {
            return existing;
        }

        const created = await db.insert(accounts).values({ name, type }).returning().get();
        return created;
    }

    async list(): Promise<AccountEntity[]> {
        return db.select().from(accounts).all();
    }
}
