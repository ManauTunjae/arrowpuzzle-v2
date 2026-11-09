import { Router } from 'express';
import { db } from '../db/db.js';
import { requirePlayer } from '../auth.js';
import { generateInviteCode, normalizeInviteCode } from '../services/inviteCode.js';

// --- POST /api/invites -> your invite code (one code per player) ---
export const invitesApi = Router();
invitesApi.use(requirePlayer);

invitesApi.post('/', (req, res) => {
  const existing = db
    .prepare('SELECT * FROM invites WHERE inviter_player_id = ? ORDER BY id LIMIT 1')
    .get(req.player.id);
  if (existing) {
    return res.json({ code: existing.code, path: `/i/${existing.code}`, clicks: existing.clicks });
  }

  // The code column is UNIQUE. If a code already exists, try a new one.
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateInviteCode();
    try {
      db.prepare('INSERT INTO invites (campaign_id, inviter_player_id, code) VALUES (?, ?, ?)')
        .run(req.player.campaign_id, req.player.id, code);
      return res.status(201).json({ code, path: `/i/${code}`, clicks: 0 });
    } catch (error) {
      if (error.code !== 'SQLITE_CONSTRAINT_UNIQUE') throw error;
    }
  }
  res.status(500).json({ error: 'Could not create an invite code' });
});

// --- GET /i/:code -> count the click, go to the campaign ---
// This is a normal link in the browser, so it redirects. It does not answer with JSON.
export const inviteLink = Router();

inviteLink.get('/:code', (req, res) => {
  const code = normalizeInviteCode(req.params.code);
  const invite = code
    ? db
        .prepare(
          `SELECT i.id, c.slug FROM invites i
           JOIN campaigns c ON c.id = i.campaign_id
           WHERE i.code = ? AND c.is_active = 1`,
        )
        .get(code)
    : null;

  if (!invite) {
    return res.redirect('/'); // unknown code: just go to the start page
  }

  db.prepare('UPDATE invites SET clicks = clicks + 1 WHERE id = ?').run(invite.id);
  res.redirect(`/?c=${encodeURIComponent(invite.slug)}&ref=${code}`);
});
