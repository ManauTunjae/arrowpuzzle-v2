// Play page. Step 1: static board you can click. Animations and timer come later.
import { loadCampaign } from '../theme.js';
import { getLevel } from '../game/levels.js';
import { createState, clickMatch, isLevelCleared } from '../game/rules.js';
import { renderBoard } from '../game/board.js';

const svg = document.querySelector('#board');
const scoreEl = document.querySelector('#score');
const heartsEl = document.querySelector('#hearts');
const messageEl = document.querySelector('#message');

const level = getLevel(1);
let state = createState(level.matches, level.size);

function update() {
  renderBoard(svg, state, onMatchClick);
  scoreEl.textContent = state.score;
  heartsEl.textContent = '♥'.repeat(state.hearts) || '0';
  if (isLevelCleared(state)) messageEl.textContent = 'Nivå klar!';
  else if (state.hearts <= 0) messageEl.textContent = 'Slut på hjärtan.';
}

function onMatchClick(id) {
  const { state: next, result } = clickMatch(state, id);
  state = next;
  if (result === 'collision') messageEl.textContent = 'Aj! Något står i vägen.';
  else if (result === 'exit') messageEl.textContent = '';
  update();
}

try {
  await loadCampaign(); // sets the theme colors
} catch {
  // Game still works with default colors.
}
update();
