import { Router } from 'express';
import { db } from '../db/db.js';
import { requirePlayer } from '../auth.js';
import { checkResult } from '../services/scoreCheck.js';
import { LEVEL_COUNT } from '../../client/js/game/levels.js';

const router = Router();
router.use(requirePlayer);

// POST /api/sessions -> start a game. The SERVER saves started_at.
router.post('/', (req, res) => {
  const startedAt = new Date().toISOString();
  const result = db
    .prepare('INSERT INTO game_sessions (campaign_id, player_id, started_at) VALUES (?, ?, ?)')
    .run(req.player.campaign_id, req.player.id, startedAt);

  res.status(201).json({ id: result.lastInsertRowid, startedAt });
});

// PATCH /api/sessions/:id  body: { score, candlesLit, levelsCleared, heartsLeft }
// The server checks the result before it is saved.
router.patch('/:id', (req, res) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid session id' });
  }

  // Only your own sessions. Same answer if it does not exist, so ids cannot be guessed.
  const session = db
    .prepare('SELECT * FROM game_sessions WHERE id = ? AND player_id = ?')
    .get(id, req.player.id);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  if (session.finished_at) {
    return res.status(409).json({ error: 'Session is already finished' });
  }

  const { score, candlesLit, levelsCleared, heartsLeft } = req.body || {};

  // The time is made by the server, never by the browser.
  const finishedAt = new Date();
  const check = checkResult(
    { score, candlesLit, levelsCleared, heartsLeft },
    Date.parse(session.started_at),
    finishedAt.getTime(),
  );
  if (!check.ok) {
    return res.status(400).json({ error: check.reason });
  }

  const level = Math.min(levelsCleared + 1, LEVEL_COUNT);
  db.prepare(
    `UPDATE game_sessions
     SET score = ?, candles_lit = ?, levels_cleared = ?, hearts_left = ?, level = ?, finished_at = ?
     WHERE id = ?`,
  ).run(score, candlesLit, levelsCleared, heartsLeft, level, finishedAt.toISOString(), id);

  res.json({ id, score, candlesLit, levelsCleared, heartsLeft, level });
});

export default router;
