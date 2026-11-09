// Play page: connects the game to the HTML.
import { loadCampaign } from '../theme.js';
import { createGame } from '../game/game.js';
import { LEVEL_COUNT } from '../game/levels.js';

const svg = document.querySelector('#board');
const scoreEl = document.querySelector('#score');
const heartsEl = document.querySelector('#hearts');
const timeEl = document.querySelector('#time');
const levelEl = document.querySelector('#level');
const messageEl = document.querySelector('#message');
const wrapEl = document.querySelector('#board-wrap');
const startBtn = document.querySelector('#start');
const overlay = document.querySelector('#overlay');
const endText = document.querySelector('#end-text');

const END_TEXT = {
  time: 'Tiden är slut!',
  hearts: 'Slut på hjärtan.',
  won: 'Alla nivåer klara!',
};

// Floating "+1" in the middle of the board. It lives outside the SVG,
// so it is not removed when the board is drawn again.
function showPoints(points) {
  if (points <= 0) return;
  const popup = document.createElement('div');
  popup.className = 'points-popup';
  popup.textContent = `+${points}`;
  wrapEl.append(popup);
  const animation = popup.animate(
    [
      { opacity: 0, transform: 'translate(-50%, -30%) scale(0.8)' },
      { opacity: 1, transform: 'translate(-50%, -60%) scale(1.15)', offset: 0.25 },
      { opacity: 0, transform: 'translate(-50%, -140%) scale(1)' },
    ],
    { duration: 900, easing: 'ease-out' },
  );
  animation.onfinish = () => popup.remove();
}

const game = createGame({
  svg,
  onState(state, levelNumber) {
    scoreEl.textContent = state.score;
    heartsEl.textContent = '♥'.repeat(state.hearts) || '0';
    levelEl.textContent = `${levelNumber}/${LEVEL_COUNT}`;
  },
  onTime(ms) {
    timeEl.textContent = Math.ceil(ms / 1000);
  },
  onMessage(text) {
    messageEl.textContent = text;
  },
  onPoints: showPoints,
  onEnd({ reason, state }) {
    messageEl.textContent = '';
    endText.textContent = `${END_TEXT[reason]} Du fick ${state.score} poäng.`;
    startBtn.textContent = 'Spela igen';
    overlay.hidden = false;
    startBtn.focus();
  },
});

startBtn.addEventListener('click', () => {
  overlay.hidden = true;
  game.start();
});

try {
  await loadCampaign(); // sets the theme colors
} catch {
  // Game still works with default colors.
}
