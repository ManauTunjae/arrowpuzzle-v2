import { loadCampaign, withCampaign } from '../theme.js';
import { createInvite } from '../api.js';
import { getToken } from '../player.js';

const RESULT_KEY = 'arrowpuzzle.lastResult';

// No player yet? Go to the start page first.
if (!getToken()) location.replace(withCampaign('index.html'));

const messageEl = document.querySelector('#message');
const statusEl = document.querySelector('#status');
const shareBtn = document.querySelector('#share');
const smsLink = document.querySelector('#sms');
const copyBtn = document.querySelector('#copy');
document.querySelector('#next').href = withCampaign('sms.html');

function readScore() {
  try {
    return JSON.parse(sessionStorage.getItem(RESULT_KEY))?.score ?? null;
  } catch {
    return null;
  }
}

const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
  || window.matchMedia('(pointer: coarse)').matches;

let campaign = null;
let text = '';
let url = '';

try {
  campaign = await loadCampaign();
  const invite = await createInvite();
  url = `${location.origin}${invite.path}`;

  const score = readScore();
  const scoreText = score === null ? 'Jag spelade' : `Jag fick ${score} poäng i`;
  text = `${scoreText} Tänd ett ljus för ${campaign.orgName}. Kan du slå mig?`;
  messageEl.value = `${text} ${url}`;
} catch (error) {
  if (error.status === 401) {
    location.replace(withCampaign('index.html')); // token is not valid any more
  } else {
    statusEl.textContent = error.message;
    copyBtn.disabled = true;
  }
}

if (url) {
  // 1. Web Share API (phones and some computers). It must start from a click.
  if (navigator.share) {
    shareBtn.hidden = false;
  } else if (isMobile) {
    // 2. Fallback: an sms: link. It opens the SMS app with the text. No phone number is read or saved.
    smsLink.href = `sms:?&body=${encodeURIComponent(`${text} ${url}`)}`;
    smsLink.hidden = false;
  }
}

shareBtn.addEventListener('click', async () => {
  statusEl.textContent = '';
  try {
    await navigator.share({ title: 'Tänd ett ljus', text, url });
  } catch (error) {
    // AbortError = the person closed the share window. That is not an error.
    if (error.name !== 'AbortError') statusEl.textContent = 'Det gick inte att dela. Prova att kopiera i stället.';
  }
});

copyBtn.addEventListener('click', async () => {
  statusEl.textContent = '';
  try {
    await navigator.clipboard.writeText(messageEl.value);
    statusEl.textContent = 'Kopierat!';
  } catch {
    // No clipboard access: select the text so the person can copy it by hand.
    messageEl.select();
    statusEl.textContent = 'Markerat. Tryck Ctrl+C (Cmd+C på Mac) för att kopiera.';
  }
});
