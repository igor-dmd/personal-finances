import Database from 'better-sqlite3';
const db = new Database('sqlite.db');
const rows = db.prepare('SELECT id, filename FROM import_jobs').all();
console.log(JSON.stringify(rows, null, 2));
db.close();
