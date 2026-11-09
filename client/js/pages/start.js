import { loadCampaign, withCampaign } from '../theme.js';

const title = document.querySelector('#title');
const org = document.querySelector('#org');
const intro = document.querySelector('#intro');
const start = document.querySelector('#start');

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
