import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema';

//TODO: use env var for DB path
const dbPath = process.env.DATABASE_URL || 'sqlite.db';
const sqlite = new Database(dbPath);
sqlite.pragma('foreign_keys = ON'); // Enable foreign key constraints
export const db = drizzle(sqlite, { schema });
