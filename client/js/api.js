// All fetch calls live here.
import { getToken } from './player.js';

async function request(path, options = {}) {
  const headers = { ...options.headers };
  if (options.body) headers['Content-Type'] = 'application/json';

  const token = getToken();
  if (token) headers['X-Player-Token'] = token;

  const response = await fetch(path, {
    ...options,
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  // The server always answers with JSON, also for errors.
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.error || `Request failed (${response.status})`);
    error.status = response.status; // pages can react to 401 etc.
    throw error;
  }
  return data;
}

export const getCampaign = (slug) =>
  request(`/api/campaigns/${encodeURIComponent(slug)}`);

export const createPlayer = (campaignSlug, nickname, inviteCode) =>
  request('/api/players', { method: 'POST', body: { campaignSlug, nickname, inviteCode } });

export const createInvite = () => request('/api/invites', { method: 'POST' });

export const getMe = () => request('/api/players/me');

export const startSession = () => request('/api/sessions', { method: 'POST' });

export const finishSession = (id, result) =>
  request(`/api/sessions/${id}`, { method: 'PATCH', body: result });

export const getLeaderboard = (slug) =>
  request(`/api/campaigns/${encodeURIComponent(slug)}/leaderboard`);

export const createDonation = (sessionId, amount, method) =>
  request('/api/donations', { method: 'POST', body: { sessionId, amount, method } });

export const updateDonation = (id, status) =>
  request(`/api/donations/${id}`, { method: 'PATCH', body: { status } });

// The QR code is an image, but <img src> cannot send the token header.
// So we fetch it ourselves and make a temporary URL for the image.
export async function getDonationQr(id) {
  const response = await fetch(`/api/donations/${id}/qr`, {
    headers: { 'X-Player-Token': getToken() || '' },
  });
  if (!response.ok) throw new Error('Kunde inte hämta QR-koden');
  return URL.createObjectURL(await response.blob());
}
