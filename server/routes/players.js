import { Router } from 'express';
import crypto from 'node:crypto';
import { db } from '../db/db.js';
import { cleanNickname } from '../validators.js';
import { requirePlayer } from '../auth.js';

const router = Router();

function toPlayerJson(row) {
  return {
    id: row.id,
    nickname: row.nickname,
    unlockedLevel: row.unlocked_level,
    campaignId: row.campaign_id,
  };
}

// POST /api/players  body: { campaignSlug, nickname } -> { token, player }
router.post('/', (req, res) => {
  const { campaignSlug, nickname } = req.body || {};

  const clean = cleanNickname(nickname);
  if (!clean) {
    return res.status(400).json({ error: 'Nickname must be 2-20 characters' });
  }
  if (typeof campaignSlug !== 'string') {
    return res.status(400).json({ error: 'campaignSlug is required' });
  }

  const campaign = db
    .prepare('SELECT id FROM campaigns WHERE slug = ? AND is_active = 1')
    .get(campaignSlug);
  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  const token = crypto.randomUUID();
  const result = db
    .prepare('INSERT INTO players (campaign_id, token, nickname) VALUES (?, ?, ?)')
    .run(campaign.id, token, clean);

  const player = db.prepare('SELECT * FROM players WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ token, player: toPlayerJson(player) });
});

// GET /api/players/me  header: X-Player-Token -> player
router.get('/me', requirePlayer, (req, res) => {
  res.json(toPlayerJson(req.player));
});

export default router;
