
import { db } from '..';
import {
    accounts,
    categories,
    ignoredDescriptions,
    importJobs,
    installmentGroups,
    investmentMovements,
    investments,
    recurringTransactions,
    transactions,
} from '../schema';

async function reset() {
    console.log('Resetting database...');

    try {
        // Delete in reverse order of dependencies to avoid foreign key constraint violations

        console.log('Deleting investment movements...');
        await db.delete(investmentMovements).run();

        console.log('Deleting investments...');
        await db.delete(investments).run();

        console.log('Deleting recurring transactions...');
        await db.delete(recurringTransactions).run();

        console.log('Deleting ignored descriptions...');
        await db.delete(ignoredDescriptions).run();

        console.log('Deleting transactions...');
        await db.delete(transactions).run();

        console.log('Deleting installment groups...');
        await db.delete(installmentGroups).run();

        console.log('Deleting import jobs...');
        await db.delete(importJobs).run();

        console.log('Deleting categories...');
        await db.delete(categories).run();

        console.log('Deleting accounts...');
        await db.delete(accounts).run();

        // Optionally reset auto-increment counters if sqlite
        // await db.run(sql`DELETE FROM sqlite_sequence WHERE name IN ('transactions', 'import_jobs', 'categories', 'accounts')`);

        console.log('Database reset successfully.');

    } catch (error) {
        console.error('Error resetting database:', error);
        process.exit(1);
    }
}

reset();
