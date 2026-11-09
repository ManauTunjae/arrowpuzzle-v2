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

export const createPlayer = (campaignSlug, nickname) =>
  request('/api/players', { method: 'POST', body: { campaignSlug, nickname } });

export const getMe = () => request('/api/players/me');

export const startSession = () => request('/api/sessions', { method: 'POST' });

export const finishSession = (id, result) =>
  request(`/api/sessions/${id}`, { method: 'PATCH', body: result });

export const getLeaderboard = (slug) =>
  request(`/api/campaigns/${encodeURIComponent(slug)}/leaderboard`);
