
import { db } from '../db';
import { accounts, categories, transactions } from '../db/schema';

async function seed() {
    console.log('Seeding database...');

    try {
        // Create a default account
        const [account] = await db.insert(accounts).values({
            name: 'Main Checking',
            type: 'bank',
            currency: 'USD'
        }).returning();

        console.log('Created account:', account.id);

        // Create some categories
        const categoryData = [
            { name: 'Coffee' },
            { name: 'Groceries' },
            { name: 'Transport' },
            { name: 'Shopping' },
            { name: 'Entertainment' },
            { name: 'Gas' },
            { name: 'Subscriptions' },
            { name: 'Income' },
            { name: 'Health' }
        ];

        const insertedCategories = await db.insert(categories).values(categoryData).returning();
        const categoryMap = new Map<string, number>(insertedCategories.map((c: { name: string; id: number }) => [c.name, c.id]));

        console.log('Created categories:', insertedCategories.length);

        // Create transactions
        const transactionData = [
            { date: new Date('2025-05-24'), description: 'Starbucks', category: 'Coffee', amount: -6.50 },
            { date: new Date('2025-05-24'), description: 'Whole Foods Market', category: 'Groceries', amount: -142.30 },
            { date: new Date('2025-05-23'), description: 'Uber Trip', category: 'Transport', amount: -24.90 },
            { date: new Date('2025-05-23'), description: 'Refund - Target', category: 'Shopping', amount: 89.99 },
            { date: new Date('2025-05-22'), description: 'Netflix Subscription', category: 'Entertainment', amount: -15.99 },
            { date: new Date('2025-05-21'), description: 'Shell Station', category: 'Gas', amount: -45.00 },
            { date: new Date('2025-05-20'), description: 'Spotify', category: 'Subscriptions', amount: -9.99 },
            { date: new Date('2025-05-19'), description: 'Amazon', category: 'Shopping', amount: -34.50 },
            { date: new Date('2025-05-18'), description: 'Salary', category: 'Income', amount: 3100.00 },
            { date: new Date('2025-05-17'), description: 'Gym Membership', category: 'Health', amount: -29.99 },
        ];

        await db.insert(transactions).values(transactionData.map(t => ({
            accountId: account.id,
            categoryId: categoryMap.get(t.category) ?? null,
            date: t.date,
            amount: t.amount,
            description: t.description,
            originalDescription: t.description
        })));

        console.log('Created transactions:', transactionData.length);
        console.log('Seeding completed successfully.');

    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
}

seed();
