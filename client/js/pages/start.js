import { loadCampaign, withCampaign } from '../theme.js';
import { createPlayer, getMe, updateNickname } from '../api.js';
import { getToken, getNickname, savePlayer, saveInviteRef, getInviteRef, clearInviteRef } from '../player.js';

const title = document.querySelector('#title');
const org = document.querySelector('#org');
const logo = document.querySelector('#logo');
const intro = document.querySelector('#intro');
const form = document.querySelector('#start-form');
const input = document.querySelector('#nickname');
const errorEl = document.querySelector('#error');
const playBtn = document.querySelector('#play');
const giftBtn = document.querySelector('#gift');
const giftTopBtn = document.querySelector('#gift-top');
const goal = document.querySelector('#goal');

// Came from a friend's link? Remember the invite code (the server checks it later).
const ref = new URLSearchParams(location.search).get('ref');
if (ref && /^[A-Za-z0-9]{4,12}$/.test(ref)) saveInviteRef(ref);

// The leaderboard link keeps the campaign.
document.querySelector('#leaderboard-link').href = withCampaign('result.html');

// Show "Insamlat X kr", "Mål Y kr" and move the bar and the small candle.
function showGoal(raised, goalAmount) {
  if (!goalAmount) return;
  const percent = Math.max(0, Math.min(100, Math.round((raised / goalAmount) * 100)));
  const format = (number) => number.toLocaleString('sv-SE');
  document.querySelector('#raised').textContent = format(raised);
  document.querySelector('#goal-amount').textContent = format(goalAmount);
  document.querySelector('#goal-percent').textContent = `${percent} % av målet`;
  document.querySelector('#goal-bar').setAttribute('aria-valuenow', String(percent));
  goal.hidden = false;
  // Wait one frame so the bar slides from 0 to the value.
  requestAnimationFrame(() => {
    document.querySelector('#goal-fill').style.width = `${percent}%`;
    document.querySelector('#goal-marker').style.left = `${percent}%`;
  });
}

let campaign = null;
try {
  campaign = await loadCampaign();
  // textContent, never innerHTML.
  title.textContent = campaign.content.title;
  org.textContent = campaign.orgName;
  logo.textContent = campaign.orgName.trim().charAt(0).toUpperCase();
  intro.textContent = campaign.content.intro;
  document.title = `${campaign.content.title} – ${campaign.orgName}`;
  showGoal(campaign.raisedAmount, campaign.goalAmount);
} catch (error) {
  intro.textContent = error.message;
  playBtn.disabled = true;
  giftBtn.disabled = true;
  giftTopBtn.disabled = true;
}

// Remember the name from last time (only if there is a player).
if (getToken()) input.value = getNickname() || '';

// Makes sure there is a player for THIS campaign. Returns false if the name is not valid.
async function ensurePlayer() {
  errorEl.textContent = '';
  const typed = input.value.trim();
  if (typed && (typed.length < 2 || typed.length > 20)) {
    errorEl.textContent = 'Namnet måste vara 2–20 tecken. Eller lämna det tomt.';
    input.focus();
    return false;
  }

  let me = null;
  if (getToken()) {
    try {
      me = await getMe();
    } catch (error) {
      if (error.status !== 401) throw error; // 401 = old token (e.g. database was reset), make a new player
    }
  }

  if (me && me.campaignId === campaign.id) {
    if (typed && typed !== me.nickname) {
      const updated = await updateNickname(typed);
      savePlayer(getToken(), updated.nickname);
    }
  } else {
    const { token, player } = await createPlayer(campaign.slug, typed || undefined, getInviteRef());
    savePlayer(token, player.nickname);
    clearInviteRef();
  }
  return true;
}

// Runs ensurePlayer, then goes to a page. Buttons are locked meanwhile, so a double click does nothing.
async function goTo(page) {
  const buttons = [playBtn, giftBtn, giftTopBtn];
  buttons.forEach((button) => { button.disabled = true; });
  try {
    if (await ensurePlayer()) {
      location.href = withCampaign(page);
      return;
    }
  } catch (error) {
    errorEl.textContent = error.message;
  }
  buttons.forEach((button) => { button.disabled = false; });
}

form.addEventListener('submit', (event) => {
  event.preventDefault();
  if (campaign) goTo('play.html');
});
giftBtn.addEventListener('click', () => campaign && goTo('donate.html'));
giftTopBtn.addEventListener('click', () => campaign && goTo('donate.html'));
