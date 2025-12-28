
import { db } from '../db';
import { accounts, categories, transactions, importJobs } from '../db/schema';
import { sql } from 'drizzle-orm';

async function reset() {
    console.log('Resetting database...');

    try {
        // Delete in reverse order of dependencies to avoid foreign key constraint violations
        // transactions -> importJobs -> categories -> accounts

        console.log('Deleting transactions...');
        await db.delete(transactions).run();

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
