import { loadCampaign } from '../theme.js';

const title = document.querySelector('#title');
const intro = document.querySelector('#intro');

try {
  const campaign = await loadCampaign();
  // textContent, never innerHTML.
  title.textContent = campaign.content.title;
  intro.textContent = campaign.content.intro;
  document.title = `${campaign.content.title} – ${campaign.orgName}`;
} catch (error) {
  intro.textContent = error.message;
}
