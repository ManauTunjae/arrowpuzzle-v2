// Play page: connects the game to the HTML and to the server.
import { loadCampaign, withCampaign } from '../theme.js';
import { getToken } from '../player.js';
import { startSession, finishSession } from '../api.js';
import { createGame } from '../game/game.js';
import { LEVEL_COUNT } from '../game/levels.js';

// No player yet? Go to the start page first.
if (!getToken()) location.replace(withCampaign('index.html'));

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

const RESULT_KEY = 'arrowpuzzle.lastResult';
let sessionId = null;

const RESULT_DELAY_MS = 1800;
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// The result page reads this. sessionStorage can throw, so try/catch.
function rememberResult(result) {
  try {
    sessionStorage.setItem(RESULT_KEY, JSON.stringify(result));
  } catch {
    // The result page will then just send the player back to the game.
  }
}

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

// Sends the result. The server checks it before it is saved.
async function saveResult(reason, state) {
  const result = {
    score: state.score,
    candlesLit: state.candlesLit,
    levelsCleared: state.levelsCleared,
    heartsLeft: state.hearts,
  };
  const saved = { ...result, reason, sessionId, saved: false, best: null, error: null };
  try {
    if (!sessionId) throw new Error('No session');
    const response = await finishSession(sessionId, result);
    saved.saved = true;
    saved.best = response.best;
  } catch (error) {
    saved.error = error.message;
  }
  rememberResult(saved);
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
  async onEnd({ reason, state }) {
    messageEl.textContent = '';
    endText.textContent = `${END_TEXT[reason]} Du fick ${state.score} poäng.`;
    startBtn.hidden = true;
    overlay.hidden = false;

    // Save the result, but also wait a moment, so the player can read why the game ended.
    await Promise.all([saveResult(reason, state), sleep(RESULT_DELAY_MS)]);
    location.href = withCampaign('result.html');
  },
});

// Asks the server for a session (the server saves started_at), then starts the game.
async function startGame() {
  startBtn.disabled = true; // avoid double click
  messageEl.textContent = '';
  try {
    const session = await startSession();
    sessionId = session.id;
  } catch (error) {
    startBtn.disabled = false;
    if (error.status === 401) {
      location.replace(withCampaign('index.html')); // token is not valid any more
      return;
    }
    // Could not start: show the error and a retry button.
    endText.textContent = error.message;
    startBtn.hidden = false;
    overlay.hidden = false;
    return;
  }
  startBtn.disabled = false;
  startBtn.hidden = true;
  endText.textContent = '';
  overlay.hidden = true;
  game.start();
}

startBtn.addEventListener('click', startGame);

try {
  await loadCampaign(); // sets the theme colors
} catch {
  // Game still works with default colors.
}

// The player pressed "Spela" on the start page, so the game starts right away.
startGame();

// Back button can show this page again from memory, with the old end screen. Start fresh.
window.addEventListener('pageshow', (event) => {
  if (event.persisted) location.reload();
});
