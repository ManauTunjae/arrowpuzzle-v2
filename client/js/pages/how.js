import { loadCampaign, withCampaign } from '../theme.js';
import { getToken, getNickname } from '../player.js';

// No player yet? Go to the nickname page first.
if (!getToken()) {
  location.replace(withCampaign('name.html'));
}

const greeting = document.querySelector('#greeting');
const playLink = document.querySelector('#play');

// Keep the campaign in the link to the game.
playLink.href = withCampaign('play.html');

const nickname = getNickname();
if (nickname) {
  // textContent, never innerHTML.
  greeting.textContent = `Hej ${nickname}! Så här fungerar spelet:`;
}

try {
  await loadCampaign(); // sets the theme colors
} catch (error) {
  greeting.textContent = error.message;
}
