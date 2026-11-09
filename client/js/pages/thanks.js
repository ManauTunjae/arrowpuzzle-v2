import { loadCampaign, withCampaign } from '../theme.js';
import { getNickname } from '../player.js';

document.querySelector('#again').href = withCampaign('play.html');
document.querySelector('#board').href = withCampaign('result.html');

const org = document.querySelector('#org');
const text = document.querySelector('#thanks-text');

try {
  const campaign = await loadCampaign();
  const nickname = getNickname();
  // textContent, never innerHTML.
  org.textContent = campaign.orgName;
  text.textContent = nickname
    ? `Tack ${nickname}! Du har hjälpt ${campaign.orgName} att tända ett ljus.`
    : `Tack! Du har hjälpt ${campaign.orgName} att tända ett ljus.`;
} catch (error) {
  text.textContent = error.message;
}
