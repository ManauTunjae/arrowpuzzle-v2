import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const dbPath = path.resolve(rootDir, process.env.DB_PATH || 'server/data/arrowpuzzle.db');

// Remove the DB file (and WAL files) first.
for (const suffix of ['', '-wal', '-shm']) {
  fs.rmSync(dbPath + suffix, { force: true });
}

// Import db.js AFTER the delete. It creates a fresh DB and runs schema.sql.
const { db } = await import('./db.js');
db.exec(fs.readFileSync(path.join(rootDir, 'server/db/seed.sql'), 'utf8'));

const count = db.prepare('SELECT COUNT(*) AS n FROM campaigns').get().n;
console.log(`Database reset. ${count} campaigns seeded at ${dbPath}`);
