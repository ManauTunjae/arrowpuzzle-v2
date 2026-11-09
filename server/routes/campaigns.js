import { Router } from 'express';
import { db } from '../db/db.js';

const router = Router();

// GET /api/campaigns/:slug -> campaign + theme + content
router.get('/:slug', (req, res) => {
  const row = db
    .prepare('SELECT * FROM campaigns WHERE slug = ? AND is_active = 1')
    .get(req.params.slug);

  if (!row) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  // theme and content are stored as JSON text in SQLite.
  res.json({
    id: row.id,
    slug: row.slug,
    orgName: row.org_name,
    swishNumber: row.swish_number,
    goalAmount: row.goal_amount,
    theme: JSON.parse(row.theme),
    content: JSON.parse(row.content),
  });
});

// GET /api/campaigns/:slug/leaderboard -> top 10, best score per player
router.get('/:slug/leaderboard', (req, res) => {
  const campaign = db
    .prepare('SELECT id FROM campaigns WHERE slug = ? AND is_active = 1')
    .get(req.params.slug);
  if (!campaign) {
    return res.status(404).json({ error: 'Campaign not found' });
  }

  // MAX(score) makes SQLite take finished_at from the same (best) row.
  // Same score: the one who finished first is higher.
  const rows = db
    .prepare(
      `SELECT p.nickname AS nickname, MAX(gs.score) AS score
       FROM game_sessions gs
       JOIN players p ON p.id = gs.player_id
       WHERE gs.campaign_id = ? AND gs.finished_at IS NOT NULL AND gs.score > 0
       GROUP BY gs.player_id
       ORDER BY score DESC, gs.finished_at ASC
       LIMIT 10`,
    )
    .all(campaign.id);

  // Only nickname and score are public. No ids, no tokens.
  res.json({
    leaderboard: rows.map((row, index) => ({ rank: index + 1, nickname: row.nickname, score: row.score })),
  });
});

export default router;
