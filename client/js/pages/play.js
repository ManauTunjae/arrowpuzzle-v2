// Play page: one level for now. The timer and more levels come later.
import { loadCampaign } from '../theme.js';
import { getLevel } from '../game/levels.js';
import { createState, clickMatch, isLevelCleared } from '../game/rules.js';
import { renderBoard, animateExit, animateShake } from '../game/board.js';

const svg = document.querySelector('#board');
const scoreEl = document.querySelector('#score');
const heartsEl = document.querySelector('#hearts');
const messageEl = document.querySelector('#message');
const wrapEl = document.querySelector('#board-wrap');

const level = getLevel(1);
let state = createState(level.matches, level.size);

let busy = false; // true while an animation runs, so clicks are ignored

function renderHud() {
  scoreEl.textContent = state.score;
  heartsEl.textContent = '♥'.repeat(state.hearts) || '0';
}

function update() {
  renderBoard(svg, state, onMatchClick);
  renderHud();
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

async function onMatchClick(id) {
  if (busy) return;
  const match = state.matches.find((m) => m.id === id);
  const { state: next, result } = clickMatch(state, id);
  if (!match || result === 'ignored') return;

  busy = true;
  const gained = next.score - state.score;

  if (result === 'collision') {
    // Update hearts at once, but do not redraw the board (that would stop the shake).
    state = next;
    renderHud();
    messageEl.textContent = 'Aj! Något står i vägen.';
    await animateShake(svg, match);
    if (state.hearts <= 0) messageEl.textContent = 'Slut på hjärtan.';
  } else {
    messageEl.textContent = '';
    await animateExit(svg, match, state.size);
    state = next;
    update();
    if (gained > 0) showPoints(gained);
  }

  busy = false;
}

try {
  await loadCampaign(); // sets the theme colors
} catch {
  // Game still works with default colors.
}
update();
