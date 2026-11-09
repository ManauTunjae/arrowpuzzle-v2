import { loadCampaign, withCampaign, getCampaignSlug } from '../theme.js';
import { getLeaderboard } from '../api.js';
import { getNickname, getToken } from '../player.js';

const RESULT_KEY = 'arrowpuzzle.lastResult';

// No player or no result? Go to the game.
function readResult() {
  try {
    return JSON.parse(sessionStorage.getItem(RESULT_KEY));
  } catch {
    return null;
  }
}

const result = readResult();
if (!getToken() || !result) {
  location.replace(withCampaign('play.html'));
}

const scoreEl = document.querySelector('#score');
const noteEl = document.querySelector('#note');
const statusEl = document.querySelector('#leaderboard-status');
const table = document.querySelector('#leaderboard');
const tbody = table.querySelector('tbody');
document.querySelector('#again').href = withCampaign('play.html');

scoreEl.textContent = result?.score ?? 0;
if (result && !result.saved) {
  noteEl.textContent = 'Resultatet kunde inte sparas på topplistan.';
}

function addRow(entry, myName) {
  const row = document.createElement('tr');
  const rank = document.createElement('td');
  const name = document.createElement('td');
  const score = document.createElement('td');
  rank.textContent = entry.rank;
  // textContent, never innerHTML. "(du)" so color is not the only sign.
  name.textContent = entry.nickname === myName ? `${entry.nickname} (du)` : entry.nickname;
  score.textContent = entry.score;
  if (entry.nickname === myName) row.className = 'leaderboard__me';
  row.append(rank, name, score);
  tbody.append(row);
}

try {
  await loadCampaign(); // sets the theme colors
  const { leaderboard } = await getLeaderboard(getCampaignSlug());
  if (leaderboard.length === 0) {
    statusEl.textContent = 'Ingen har kommit med på listan än. Bli först!';
  } else {
    const myName = getNickname();
    for (const entry of leaderboard) addRow(entry, myName);
    statusEl.hidden = true;
    table.hidden = false;
  }
} catch (error) {
  statusEl.textContent = error.message;
}
