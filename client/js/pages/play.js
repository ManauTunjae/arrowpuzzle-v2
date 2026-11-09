// Play page. Step 1: static board you can click. Animations and timer come later.
import { loadCampaign } from '../theme.js';
import { getLevel } from '../game/levels.js';
import { createState, clickMatch, isLevelCleared } from '../game/rules.js';
import { renderBoard } from '../game/board.js';

const svg = document.querySelector('#board');
const scoreEl = document.querySelector('#score');
const heartsEl = document.querySelector('#hearts');
const messageEl = document.querySelector('#message');
const wrapEl = document.querySelector('#board-wrap');

const level = getLevel(1);
let state = createState(level.matches, level.size);

function update() {
  renderBoard(svg, state, onMatchClick);
  scoreEl.textContent = state.score;
  heartsEl.textContent = '♥'.repeat(state.hearts) || '0';
  if (isLevelCleared(state)) messageEl.textContent = 'Nivå klar!';
  else if (state.hearts <= 0) messageEl.textContent = 'Slut på hjärtan.';
}

// Floating "+1" in the middle of the board. It lives outside the SVG,
// so it is not removed when the board is drawn again.
function showPoints(points) {
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

function onMatchClick(id) {
  const { state: next, result } = clickMatch(state, id);
  const gained = next.score - state.score;
  state = next;
  if (result === 'collision') messageEl.textContent = 'Aj! Något står i vägen.';
  else if (result === 'exit') messageEl.textContent = '';
  update();
  if (gained > 0) showPoints(gained);
}

try {
  await loadCampaign(); // sets the theme colors
} catch {
  // Game still works with default colors.
}
update();
