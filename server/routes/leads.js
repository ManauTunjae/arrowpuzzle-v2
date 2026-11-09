import { Router } from 'express';
import { db } from '../db/db.js';
import { requirePlayer } from '../auth.js';
import { cleanPhone } from '../validators.js';

const router = Router();
router.use(requirePlayer);

// POST /api/leads  body: { phone, consent }
// This is the player's OWN number, and only with consent. Never a friend's number.
router.post('/', (req, res) => {
  const { phone, consent } = req.body || {};

  // GDPR: the box must be ticked by the person. "true" only, not "yes" or 1.
  if (consent !== true) {
    return res.status(400).json({ error: 'Consent is required' });
  }
  const cleanedPhone = cleanPhone(phone);
  if (!cleanedPhone) {
    return res.status(400).json({ error: 'Phone must be a Swedish mobile number, for example 070 123 45 67' });
  }

  // The same player and number only once.
  const existing = db
    .prepare('SELECT id FROM sms_leads WHERE player_id = ? AND phone = ?')
    .get(req.player.id, cleanedPhone);
  if (existing) {
    return res.json({ ok: true });
  }

  db.prepare('INSERT INTO sms_leads (campaign_id, player_id, phone, consent) VALUES (?, ?, ?, 1)')
    .run(req.player.campaign_id, req.player.id, cleanedPhone);

  // Do not send the number back.
  res.status(201).json({ ok: true });
});

export default router;
