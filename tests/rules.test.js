import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  cellsOf, canExit, createState, clickMatch, nextLevelState, isLevelCleared, isGameOver,
} from '../client/js/game/rules.js';

const SIZE = 5;

test('cellsOf: body goes backwards from the head', () => {
  const m = { id: 1, x: 2, y: 1, length: 3, dir: 'up' };
  assert.deepEqual(cellsOf(m), [{ x: 2, y: 1 }, { x: 2, y: 2 }, { x: 2, y: 3 }]);
});

test('canExit: free path to the edge', () => {
  const m = { id: 1, x: 2, y: 2, length: 2, dir: 'right' };
  assert.equal(canExit(m, [m], SIZE), true);
});

test('canExit: head already at the edge', () => {
  const m = { id: 1, x: 4, y: 2, length: 2, dir: 'right' };
  assert.equal(canExit(m, [m], SIZE), true);
});

test('canExit: another match in the way', () => {
  const a = { id: 1, x: 1, y: 2, length: 2, dir: 'right' };
  const blocker = { id: 2, x: 3, y: 3, length: 2, dir: 'down' }; // covers (3,3) and (3,2)
  assert.equal(canExit(a, [a, blocker], SIZE), false);
});

test('canExit: a match behind the head does not block', () => {
  const a = { id: 1, x: 2, y: 2, length: 2, dir: 'right' }; // body at (1,2)
  const behind = { id: 2, x: 0, y: 2, length: 1, dir: 'left' };
  assert.equal(canExit(a, [a, behind], SIZE), true);
});

test('canExit: its own body never blocks', () => {
  const a = { id: 1, x: 2, y: 2, length: 3, dir: 'left' }; // body covers (3,2) and (4,2)
  assert.equal(canExit(a, [a], SIZE), true);
});

test('clickMatch: collision costs a heart, no minus points', () => {
  const a = { id: 1, x: 1, y: 2, length: 2, dir: 'right' };
  const blocker = { id: 2, x: 3, y: 2, length: 1, dir: 'up' };
  const state = createState([a, blocker], SIZE);
  const { state: next, result } = clickMatch(state, 1);
  assert.equal(result, 'collision');
  assert.equal(next.hearts, 2);
  assert.equal(next.score, 0);
  assert.equal(next.matches.length, 2);
});

test('clickMatch: exit gives +1 and removes the match', () => {
  const a = { id: 1, x: 1, y: 2, length: 2, dir: 'right' };
  const b = { id: 2, x: 0, y: 4, length: 1, dir: 'left' };
  const { state, result } = clickMatch(createState([a, b], SIZE), 1);
  assert.equal(result, 'exit');
  assert.equal(state.score, 1);
  assert.equal(state.candlesLit, 1);
  assert.deepEqual(state.litCandles, [1]);
  assert.equal(state.matches.length, 1);
});

test('clickMatch: +5 once when all 4 candles have burned, +3 for cleared level', () => {
  const matches = [
    { id: 1, x: 0, y: 0, length: 1, dir: 'up' },
    { id: 2, x: 4, y: 1, length: 1, dir: 'right' },
    { id: 3, x: 2, y: 4, length: 1, dir: 'down' },
    { id: 4, x: 0, y: 3, length: 1, dir: 'left' },
  ];
  let state = createState(matches, SIZE);
  for (const id of [1, 2, 3]) state = clickMatch(state, id).state;
  assert.equal(state.score, 3);
  state = clickMatch(state, 4).state;
  // 4 candles (+4) + all-candles bonus (+5) + level cleared (+3)
  assert.equal(state.score, 12);
  assert.equal(isLevelCleared(state), true);
  assert.equal(state.levelsCleared, 1);
});

test('clickMatch: all-candles bonus is only given once', () => {
  const matches = [
    { id: 1, x: 0, y: 0, length: 1, dir: 'up' },
    { id: 2, x: 4, y: 1, length: 1, dir: 'right' },
    { id: 3, x: 2, y: 4, length: 1, dir: 'down' },
    { id: 4, x: 0, y: 3, length: 1, dir: 'left' },
    { id: 5, x: 3, y: 0, length: 1, dir: 'up' },
  ];
  let state = createState(matches, SIZE);
  for (const id of [1, 2, 3, 4]) state = clickMatch(state, id).state;
  const before = state.score; // 4 + 5 = 9
  state = clickMatch(state, 5).state;
  assert.equal(state.score, before + 1 + 3); // +1 candle, +3 level, no second bonus
});

test('clickMatch: candles are lit in order, no matter which way the match points', () => {
  const matches = [
    { id: 1, x: 0, y: 0, length: 1, dir: 'left' },
    { id: 2, x: 4, y: 4, length: 1, dir: 'down' },
    { id: 3, x: 2, y: 0, length: 1, dir: 'up' },
  ];
  let state = createState(matches, SIZE);
  state = clickMatch(state, 1).state;
  assert.deepEqual(state.litCandles, [1]);
  state = clickMatch(state, 2).state;
  assert.deepEqual(state.litCandles, [1, 2]);
  state = clickMatch(state, 3).state;
  assert.deepEqual(state.litCandles, [1, 2, 3]);
});

test('clickMatch: a collision does not light a candle', () => {
  const a = { id: 1, x: 1, y: 2, length: 2, dir: 'right' };
  const blocker = { id: 2, x: 3, y: 2, length: 1, dir: 'up' };
  const { state } = clickMatch(createState([a, blocker], SIZE), 1);
  assert.deepEqual(state.litCandles, []);
});

test('clickMatch: after 4 candles there is no 5th, only +1 point', () => {
  const matches = [1, 2, 3, 4, 5].map((id) => ({ id, x: 0, y: id - 1, length: 1, dir: 'left' }));
  let state = createState(matches, SIZE);
  for (const id of [1, 2, 3, 4, 5]) state = clickMatch(state, id).state;
  assert.deepEqual(state.litCandles, [1, 2, 3, 4]);
  assert.equal(state.candlesLit, 5);
});

test('clickMatch: unknown id or no hearts is ignored', () => {
  const a = { id: 1, x: 1, y: 2, length: 1, dir: 'right' };
  const state = createState([a], SIZE);
  assert.equal(clickMatch(state, 99).result, 'ignored');
  assert.equal(clickMatch({ ...state, hearts: 0 }, 1).result, 'ignored');
});

test('isGameOver: timer 0 or hearts 0', () => {
  const state = createState([], SIZE);
  assert.equal(isGameOver(state, 5000), false);
  assert.equal(isGameOver(state, 0), true);
  assert.equal(isGameOver({ ...state, hearts: 0 }, 5000), true);
});

test('nextLevelState: new board, but score, hearts and candles are kept', () => {
  const a = { id: 1, x: 0, y: 0, length: 1, dir: 'up' };
  let state = createState([a], SIZE);
  state = clickMatch(state, 1).state;
  state = { ...state, hearts: 2 };
  const level = { size: 6, matches: [{ id: 1, x: 5, y: 5, length: 1, dir: 'down' }] };
  const next = nextLevelState(state, level);
  assert.equal(next.size, 6);
  assert.equal(next.matches.length, 1);
  assert.equal(next.score, state.score);
  assert.equal(next.hearts, 2);
  assert.deepEqual(next.litCandles, [1]);
  assert.equal(next.levelsCleared, state.levelsCleared);
});
