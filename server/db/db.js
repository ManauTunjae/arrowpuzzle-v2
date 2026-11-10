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

// Older database files do not have donation_intents.player_id yet. Add it and fill it from the game session.
// (A gift can now be given without playing, so the gift needs its own link to the player.)
const donationColumns = db.prepare('PRAGMA table_info(donation_intents)').all();
if (!donationColumns.some((column) => column.name === 'player_id')) {
  db.exec('ALTER TABLE donation_intents ADD COLUMN player_id INTEGER REFERENCES players(id)');
  db.exec(`UPDATE donation_intents
           SET player_id = (SELECT player_id FROM game_sessions WHERE id = donation_intents.session_id)`);
}

export { db, dbPath, rootDir };
