import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const dbPath = path.resolve(rootDir, process.env.DB_PATH || 'server/data/arrowpuzzle.db');

// Make sure the folder exists (server/data/ is not on GitHub).
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const db = new Database(dbPath);
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

// Create tables if they do not exist yet (safe to run every start).
const schema = fs.readFileSync(path.join(rootDir, 'server/db/schema.sql'), 'utf8');
db.exec(schema);

export { db, dbPath, rootDir };
