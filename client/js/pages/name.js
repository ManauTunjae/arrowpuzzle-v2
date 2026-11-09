import { loadCampaign, withCampaign } from '../theme.js';
import { createPlayer, getMe } from '../api.js';
import { getToken, getNickname, savePlayer, getInviteRef, clearInviteRef } from '../player.js';

const form = document.querySelector('#name-form');
const input = document.querySelector('#nickname');
const errorEl = document.querySelector('#error');
const submit = document.querySelector('#submit');

const NEXT_PAGE = 'how.html';

let campaign;
try {
  campaign = await loadCampaign();
} catch (error) {
  errorEl.textContent = error.message;
  submit.disabled = true;
}

// Already have a player for THIS campaign? Skip this page.
if (campaign && getToken()) {
  try {
    const me = await getMe();
    if (me.campaignId === campaign.id) location.replace(withCampaign(NEXT_PAGE));
  } catch {
    // Token is not valid (e.g. the database was reset). Show the form.
  }
}

input.value = getNickname() || '';

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  errorEl.textContent = '';

  const nickname = input.value.trim();
  if (nickname.length < 2 || nickname.length > 20) {
    errorEl.textContent = 'Smeknamnet måste vara 2–20 tecken.';
    input.focus();
    return;
  }

  submit.disabled = true; // avoid double submit
  try {
    const { token, player } = await createPlayer(campaign.slug, nickname, getInviteRef());
    savePlayer(token, player.nickname);
    clearInviteRef();
    location.href = withCampaign(NEXT_PAGE);
  } catch (error) {
    errorEl.textContent = error.message;
    submit.disabled = false;
  }
});
