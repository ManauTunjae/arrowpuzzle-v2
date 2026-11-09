import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  levelMaxScore, maxScore, maxCandles, minDurationMs, checkResult, TOLERANCE_MS,
} from '../server/services/scoreCheck.js';
import { getLevel } from '../client/js/game/levels.js';
import { createState, clickMatch, canExit } from '../client/js/game/rules.js';

// Plays a level perfectly (always a free match) and returns the final state.
function playPerfectly(number) {
  const { matches, size } = getLevel(number);
  let state = createState(matches, size);
  while (state.matches.length > 0) {
    const free = state.matches.find((m) => canExit(m, state.matches, state.size));
    state = clickMatch(state, free.id).state;
  }
  return state;
}

test('levelMaxScore equals a perfect play of each level', () => {
  for (const n of [1, 2, 3]) {
    assert.equal(playPerfectly(n).score, levelMaxScore(n), `level ${n}`);
  }
});

test('maxScore: cleared levels + the level being played', () => {
  assert.equal(maxScore(0), levelMaxScore(1));
  assert.equal(maxScore(1), levelMaxScore(1) + levelMaxScore(2));
  assert.equal(maxScore(3), levelMaxScore(1) + levelMaxScore(2) + levelMaxScore(3));
});

test('maxCandles: 4 per level reached', () => {
  assert.equal(maxCandles(0), 4);
  assert.equal(maxCandles(2), 12);
  assert.equal(maxCandles(3), 12);
});

test('minDurationMs: 300 ms for each match in the cleared levels', () => {
  assert.equal(minDurationMs(0), 0);
  assert.equal(minDurationMs(1), 8 * 300);
  assert.equal(minDurationMs(2), (8 + 11) * 300);
});

const good = { score: 10, candlesLit: 2, levelsCleared: 0, heartsLeft: 3 };

test('checkResult: a normal result is ok', () => {
  assert.deepEqual(checkResult(good, 1000, 31000), { ok: true });
});

test('checkResult: score above the maximum is rejected', () => {
  const result = checkResult({ ...good, score: maxScore(0) + 1 }, 1000, 31000);
  assert.equal(result.ok, false);
  assert.match(result.reason, /too high/);
});

test('checkResult: levelsCleared raises the allowed maximum', () => {
  const score = levelMaxScore(1) + 5;
  assert.equal(checkResult({ ...good, score, levelsCleared: 0 }, 0, 30000).ok, false);
  assert.equal(checkResult({ ...good, score, candlesLit: 5, levelsCleared: 1 }, 0, 30000).ok, true);
});

test('checkResult: too long game is rejected, tolerance is allowed', () => {
  assert.equal(checkResult(good, 0, 30000 + TOLERANCE_MS).ok, true);
  const late = checkResult(good, 0, 30000 + TOLERANCE_MS + 1);
  assert.equal(late.ok, false);
  assert.match(late.reason, /too long/);
});

test('checkResult: clearing a level too fast is rejected', () => {
  const fast = checkResult({ ...good, score: 19, candlesLit: 4, levelsCleared: 1 }, 0, 1000);
  assert.equal(fast.ok, false);
  assert.match(fast.reason, /too fast/);
});

test('checkResult: strange values are rejected', () => {
  for (const bad of [
    { score: -1 }, { score: 1.5 }, { score: '10' }, { score: null },
    { heartsLeft: 4 }, { heartsLeft: -1 }, { levelsCleared: 4 }, { candlesLit: 99 },
  ]) {
    assert.equal(checkResult({ ...good, ...bad }, 0, 30000).ok, false, JSON.stringify(bad));
  }
});
