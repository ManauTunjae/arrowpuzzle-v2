import { db } from './db/db.js';

// Finds the player from the X-Player-Token header and puts it on req.player.
export function requirePlayer(req, res, next) {
  const token = req.get('X-Player-Token');
  if (!token) {
    return res.status(401).json({ error: 'Missing X-Player-Token header' });
  }

  const player = db.prepare('SELECT * FROM players WHERE token = ?').get(token);
  if (!player) {
    return res.status(401).json({ error: 'Invalid token' });
  }

  req.player = player;
  next();
}
