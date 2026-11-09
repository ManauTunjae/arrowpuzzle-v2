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

export default router;
