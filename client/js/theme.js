// Fetches the campaign and sets the theme colors as CSS variables on :root.
import { getCampaign } from './api.js';

const DEFAULT_SLUG = 'granbacken';

// theme key in database -> CSS variable
const VARIABLES = {
  bg: '--color-bg',
  card: '--color-card',
  line: '--color-line',
  primary: '--color-primary',
  gameBg: '--color-game-bg',
  accent: '--color-accent',
  glow: '--color-glow',
  text: '--color-text',
};

// Campaign slug comes from the URL: /?c=norrskenet
export function getCampaignSlug() {
  return new URLSearchParams(location.search).get('c') || DEFAULT_SLUG;
}

export function applyTheme(theme) {
  const root = document.documentElement;
  for (const [key, cssVar] of Object.entries(VARIABLES)) {
    if (theme[key]) root.style.setProperty(cssVar, theme[key]);
  }
}

export async function loadCampaign() {
  const campaign = await getCampaign(getCampaignSlug());
  applyTheme(campaign.theme);
  return campaign;
}

// Keeps the campaign in links between pages: withCampaign('play.html') -> 'play.html?c=norrskenet'
export function withCampaign(path) {
  return `${path}?c=${encodeURIComponent(getCampaignSlug())}`;
}
