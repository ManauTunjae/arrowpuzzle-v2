// Anti-cheat: the server never trusts the score from the browser.
// It uses the SAME levels and rules as the client (one source of truth).
import { getLevel, LEVEL_COUNT } from '../../client/js/game/levels.js';
import { countByDir, POINTS, CANDLE_COUNT, MAX_HEARTS } from '../../client/js/game/rules.js';
import { GAME_DURATION_MS } from '../../client/js/game/countdown.js';

// A little extra time for slow networks and animations.
export const TOLERANCE_MS = 5000;
// One match needs at least this long (the slide animation is 300 ms or more).
export const MIN_MS_PER_MATCH = 300;

function levelInfo(number) {
  const { matches } = getLevel(number);
  const dirs = countByDir(matches);
  return {
    matchCount: matches.length,
    candleCount: Object.values(dirs).filter((n) => n > 0).length,
  };
}

// Highest possible score on one level: all matches, all candles, level cleared.
export function levelMaxScore(number) {
  const { matchCount, candleCount } = levelInfo(number);
  return matchCount * POINTS.perMatch + candleCount * POINTS.perCandleLit + POINTS.perLevelCleared;
}

// Levels a player can have touched: the cleared ones + the one being played.
function levelsReached(levelsCleared) {
  return Math.min(levelsCleared + 1, LEVEL_COUNT);
}

export function maxScore(levelsCleared) {
  let total = 0;
  for (let n = 1; n <= levelsReached(levelsCleared); n++) total += levelMaxScore(n);
  return total;
}

export function maxCandles(levelsCleared) {
  return levelsReached(levelsCleared) * CANDLE_COUNT;
}

// The fastest possible time to clear the first `levelsCleared` levels.
export function minDurationMs(levelsCleared) {
  let matches = 0;
  for (let n = 1; n <= Math.min(levelsCleared, LEVEL_COUNT); n++) matches += levelInfo(n).matchCount;
  return matches * MIN_MS_PER_MATCH;
}

const isCount = (value, max) => Number.isInteger(value) && value >= 0 && value <= max;

// result: { score, candlesLit, levelsCleared, heartsLeft }
// startedAt / finishedAt: milliseconds (Date.parse(...) of the ISO dates, made by the SERVER)
// Returns { ok: true } or { ok: false, reason }.
export function checkResult(result, startedAt, finishedAt) {
  const { score, candlesLit, levelsCleared, heartsLeft } = result;

  if (!isCount(levelsCleared, LEVEL_COUNT)) return { ok: false, reason: 'Invalid levelsCleared' };
  if (!isCount(heartsLeft, MAX_HEARTS)) return { ok: false, reason: 'Invalid heartsLeft' };
  if (!isCount(candlesLit, maxCandles(levelsCleared))) return { ok: false, reason: 'Invalid candlesLit' };
  if (!isCount(score, maxScore(levelsCleared))) return { ok: false, reason: 'Score is too high' };

  const elapsed = finishedAt - startedAt;
  if (elapsed > GAME_DURATION_MS + TOLERANCE_MS) return { ok: false, reason: 'Game took too long' };
  if (elapsed < minDurationMs(levelsCleared)) return { ok: false, reason: 'Game was too fast' };

  return { ok: true };
}
