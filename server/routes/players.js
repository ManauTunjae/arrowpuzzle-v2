import { Router } from 'express';
import crypto from 'node:crypto';
import { db } from '../db/db.js';
import { cleanNickname } from '../validators.js';
import { requirePlayer } from '../auth.js';
import { normalizeInviteCode } from '../services/inviteCode.js';

const router = Router();

function toPlayerJson(row) {
  return {
    id: row.id,
    nickname: row.nickname,
    unlockedLevel: row.unlocked_level,
    campaignId: row.campaign_id,
  };
}

// No name given? Give "Givare1", "Givare2" ... Skip names that are already taken in this campaign.
function nextGuestName(campaignId) {
  const count = db.prepare('SELECT COUNT(*) AS n FROM players WHERE campaign_id = ?').get(campaignId).n;
  const taken = db.prepare('SELECT 1 FROM players WHERE campaign_id = ? AND nickname = ?');
  let number = count + 1;
  while (taken.get(campaignId, `Givare${number}`)) number += 1;
  return `Givare${number}`;
}

// POST /api/players  body: { campaignSlug, nickname (optional), inviteCode (optional) } -> { token, player }
router.post('/', (req, res) => {
  const { campaignSlug, nickname, inviteCode } = req.body || {};

  // Empty nickname is fine (we make one). A nickname that is filled in must be valid.
  const hasNickname = typeof nickname === 'string' && nickname.trim() !== '';
  const clean = hasNickname ? cleanNickname(nickname) : null;
  if (hasNickname && !clean) {
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

  // Invited by a friend? Only save the code if it exists in THIS campaign. Otherwise ignore it.
  const code = normalizeInviteCode(inviteCode);
  const invite = code
    ? db.prepare('SELECT code FROM invites WHERE code = ? AND campaign_id = ?').get(code, campaign.id)
    : null;

  const token = crypto.randomUUID();
  const result = db
    .prepare('INSERT INTO players (campaign_id, token, nickname, invited_by_code) VALUES (?, ?, ?, ?)')
    .run(campaign.id, token, clean || nextGuestName(campaign.id), invite ? invite.code : null);

  const player = db.prepare('SELECT * FROM players WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ token, player: toPlayerJson(player) });
});

// GET /api/players/me  header: X-Player-Token -> player
router.get('/me', requirePlayer, (req, res) => {
  res.json(toPlayerJson(req.player));
});

// PATCH /api/players/me  body: { nickname } -> player
router.patch('/me', requirePlayer, (req, res) => {
  const clean = cleanNickname(req.body?.nickname);
  if (!clean) {
    return res.status(400).json({ error: 'Nickname must be 2-20 characters' });
  }
  db.prepare('UPDATE players SET nickname = ? WHERE id = ?').run(clean, req.player.id);
  res.json(toPlayerJson({ ...req.player, nickname: clean }));
});

export default router;
