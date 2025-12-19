import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

// In a real app, the DB path would be from env vars
const dbPath = process.env.DATABASE_URL || 'sqlite.db';
const sqlite = new Database(dbPath);
export const db = drizzle(sqlite, { schema });
