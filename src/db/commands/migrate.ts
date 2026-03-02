import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db } from '../index';

// Verify that the migrations folder exists or handle it
console.log('Running migrations...');
try {
    migrate(db, { migrationsFolder: 'drizzle' });
    console.log('Migrations completed successfully.');
} catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
}
