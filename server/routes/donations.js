import { Router } from 'express';
import { db } from '../db/db.js';
import { requirePlayer } from '../auth.js';
import { cleanAmount, DONATION_METHODS, DONATION_STATUSES } from '../validators.js';
import { swishMessage, swishLink, swishQrSvg } from '../services/swishQr.js';

const router = Router();
router.use(requirePlayer);

// A donation can only be reached by the player who gave it.
function findDonation(id, playerId) {
  return db
    .prepare(
      `SELECT d.*, c.swish_number AS swish_number, c.org_name AS org_name
       FROM donation_intents d
       JOIN campaigns c ON c.id = d.campaign_id
       WHERE d.id = ? AND d.player_id = ?`,
    )
    .get(id, playerId);
}

function paymentOf(donation) {
  return {
    number: donation.swish_number,
    amount: donation.amount,
    message: swishMessage(donation.org_name),
  };
}

function toJson(donation) {
  const payment = paymentOf(donation);
  return {
    id: donation.id,
    amount: donation.amount,
    method: donation.method,
    status: donation.status,
    swishNumber: payment.number,
    message: payment.message,
    // The link is only needed for the mobile button.
    swishLink: donation.method === 'swish_link' ? swishLink(payment) : null,
  };
}

// POST /api/donations  body: { sessionId (optional), amount, method }
// No sessionId = a gift without playing.
router.post('/', (req, res) => {
  const { sessionId, amount, method } = req.body || {};

  const cleanedAmount = cleanAmount(amount);
  if (cleanedAmount === null) {
    return res.status(400).json({ error: 'Amount must be a whole number from 1 to 10000' });
  }
  if (!DONATION_METHODS.includes(method)) {
    return res.status(400).json({ error: 'Method must be qr or swish_link' });
  }

  // With a sessionId, the session must be yours and finished. Without one, the gift is linked only to you.
  let session = null;
  if (sessionId !== undefined && sessionId !== null) {
    session = Number.isInteger(sessionId)
      ? db
          .prepare('SELECT * FROM game_sessions WHERE id = ? AND player_id = ? AND finished_at IS NOT NULL')
          .get(sessionId, req.player.id)
      : null;
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
  }

  const result = db
    .prepare(
      'INSERT INTO donation_intents (campaign_id, session_id, player_id, amount, method) VALUES (?, ?, ?, ?, ?)',
    )
    .run(req.player.campaign_id, session ? session.id : null, req.player.id, cleanedAmount, method);

  res.status(201).json(toJson(findDonation(result.lastInsertRowid, req.player.id)));
});

// PATCH /api/donations/:id  body: { status: 'clicked' | 'simulated_paid' }
router.patch('/:id', (req, res) => {
  const donation = findDonation(Number(req.params.id), req.player.id);
  if (!donation) {
    return res.status(404).json({ error: 'Donation not found' });
  }

  const { status } = req.body || {};
  if (!DONATION_STATUSES.includes(status)) {
    return res.status(400).json({ error: 'Status must be clicked or simulated_paid' });
  }
  // Only forward: shown -> clicked -> simulated_paid. A paid donation never changes.
  if (donation.status === 'simulated_paid' || (donation.status === 'clicked' && status === 'clicked')) {
    return res.status(409).json({ error: `Donation is already ${donation.status}` });
  }

  db.prepare('UPDATE donation_intents SET status = ? WHERE id = ?').run(status, donation.id);
  res.json(toJson({ ...donation, status }));
});

// GET /api/donations/:id/qr -> SVG image (simulated Swish QR)
router.get('/:id/qr', async (req, res, next) => {
  try {
    const donation = findDonation(Number(req.params.id), req.player.id);
    if (!donation) {
      return res.status(404).json({ error: 'Donation not found' });
    }
    const svg = await swishQrSvg(paymentOf(donation));
    res.type('image/svg+xml').send(svg);
  } catch (error) {
    next(error);
  }
});

export default router;
