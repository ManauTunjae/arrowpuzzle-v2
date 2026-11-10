import { loadCampaign, withCampaign, getCampaignSlug } from '../theme.js';
import { getLeaderboard } from '../api.js';
import { getNickname, getToken } from '../player.js';

const RESULT_KEY = 'arrowpuzzle.lastResult';

// The page also works without a result (link "Topplista" on the start page).
function readResult() {
  try {
    return JSON.parse(sessionStorage.getItem(RESULT_KEY));
  } catch {
    return null;
  }
}

const result = getToken() ? readResult() : null;

const scoreEl = document.querySelector('#score');
const bestLine = document.querySelector('#best-line');
const bestEl = document.querySelector('#best');
const noteEl = document.querySelector('#note');
const statusEl = document.querySelector('#leaderboard-status');
const table = document.querySelector('#leaderboard');
const tbody = table.querySelector('tbody');
const headingEl = document.querySelector('#heading');
const orgEl = document.querySelector('#org');
const againLink = document.querySelector('#again');

// No result: show no name and no score, only the leaderboard.
document.querySelector('#score-line').hidden = !result;
// Not a player yet? The start page makes one.
againLink.href = withCampaign(getToken() ? 'play.html' : 'index.html');
againLink.textContent = result ? 'Spela igen' : 'Spela';

// The gift page needs a saved game, because the gift is linked to it.
const donateLink = document.querySelector('#donate');
if (result?.saved) {
  donateLink.href = withCampaign('donate.html');
  donateLink.hidden = false;
}

scoreEl.textContent = result?.score ?? 0;
if (result && Number.isInteger(result.best)) {
  bestEl.textContent = result.best;
  bestLine.hidden = false;
}
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
  const campaign = await loadCampaign(); // sets the theme colors
  if (!result) {
    // textContent, never innerHTML.
    headingEl.textContent = campaign.content.title;
    orgEl.textContent = campaign.orgName;
    orgEl.hidden = false;
    document.title = `Topplista – ${campaign.orgName}`;
  }
  const { leaderboard } = await getLeaderboard(getCampaignSlug());
  if (leaderboard.length === 0) {
    statusEl.textContent = 'Ingen har kommit med på listan än. Bli först!';
  } else {
    const myName = getToken() ? getNickname() : null;
    for (const entry of leaderboard) addRow(entry, myName);
    statusEl.hidden = true;
    table.hidden = false;
  }
} catch (error) {
  statusEl.textContent = error.message;
}
