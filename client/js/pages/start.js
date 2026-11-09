import { loadCampaign, withCampaign } from '../theme.js';
import { saveInviteRef } from '../player.js';

const title = document.querySelector('#title');
const org = document.querySelector('#org');
const intro = document.querySelector('#intro');
const start = document.querySelector('#start');

// Came from a friend's link? Remember the invite code (the server checks it later).
const ref = new URLSearchParams(location.search).get('ref');
if (ref && /^[A-Za-z0-9]{4,12}$/.test(ref)) saveInviteRef(ref);

// Keep the campaign in the link to the next page.
start.href = withCampaign('name.html');

try {
  const campaign = await loadCampaign();
  // textContent, never innerHTML.
  title.textContent = campaign.content.title;
  org.textContent = campaign.orgName;
  intro.textContent = campaign.content.intro;
  document.title = `${campaign.content.title} – ${campaign.orgName}`;
} catch (error) {
  intro.textContent = error.message;
  start.hidden = true;
}
