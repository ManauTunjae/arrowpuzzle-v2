// The game loop: connects rules, levels, countdown and the board.
// It does not touch the page (HUD, buttons). The page gives it callbacks.
import { getLevel, LEVEL_COUNT } from './levels.js';
import { createState, clickMatch, nextLevelState, isLevelCleared } from './rules.js';
import { createCountdown } from './countdown.js';
import { renderBoard, animateExit, animateShake } from './board.js';

const LEVEL_PAUSE_MS = 900;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// callbacks: onState(state, levelNumber), onTime(ms), onMessage(text),
//            onPoints(points), onEnd({ reason, state })
//   reason: 'time' | 'hearts' | 'won'
export function createGame({ svg, onState, onTime, onMessage, onPoints, onEnd }) {
  let levelNumber = 1;
  let state = null;
  let running = false;
  let busy = false; // true while an animation runs, so clicks are ignored
  let countdown = null;

  function draw() {
    renderBoard(svg, state, handleClick);
    onState(state, levelNumber);
  }

  function finish(reason) {
    if (!running) return;
    running = false;
    busy = false;
    countdown.stop();
    onEnd({ reason, state });
  }

  async function handleClick(id) {
    if (!running || busy) return;
    const match = state.matches.find((m) => m.id === id);
    const { state: next, result } = clickMatch(state, id);
    if (!match || result === 'ignored') return;

    busy = true;

    if (result === 'collision') {
      // Hearts update at once, but the board is not redrawn (that would stop the shake).
      state = next;
      onState(state, levelNumber);
      onMessage('Aj! Något står i vägen.');
      await animateShake(svg, match);
      if (!running) return;
      busy = false;
      if (state.hearts <= 0) finish('hearts');
      return;
    }

    onMessage('');
    await animateExit(svg, match, state.size);
    if (!running) return; // the time ran out during the animation

    const gained = next.score - state.score;
    state = next;
    draw();
    onPoints(gained);

    if (isLevelCleared(state)) {
      if (levelNumber >= LEVEL_COUNT) {
        await sleep(LEVEL_PAUSE_MS);
        finish('won');
        return;
      }
      onMessage('Nivå klar!');
      await sleep(LEVEL_PAUSE_MS);
      if (!running) return;
      levelNumber += 1;
      state = nextLevelState(state, getLevel(levelNumber));
      onMessage('');
      draw();
    }
    busy = false;
  }

  function start() {
    if (countdown) countdown.stop();
    levelNumber = 1;
    const level = getLevel(1);
    state = createState(level.matches, level.size);
    running = true;
    busy = false;
    onMessage('');
    draw();
    countdown = createCountdown({
      onTick: onTime,
      onEnd: () => finish('time'),
    });
    countdown.start();
  }

  return { start };
}
