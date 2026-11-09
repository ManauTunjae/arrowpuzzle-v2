import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  cellsOf, canExit, createState, clickMatch, nextLevelState, candleProgress, isLevelCleared, isGameOver,
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
  const b = { id: 2, x: 4, y: 4, length: 1, dir: 'right' };
  const { state, result } = clickMatch(createState([a, b], SIZE), 1);
  assert.equal(result, 'exit');
  assert.equal(state.score, 1); // another match still points right: no candle yet
  assert.equal(state.matches.length, 1);
  assert.deepEqual(state.litCandles, []);
  assert.equal(state.candlesLit, 0);
});

test('clickMatch: the last match of a direction lights its candle (+1 and +2)', () => {
  const a = { id: 1, x: 1, y: 2, length: 2, dir: 'right' };
  const b = { id: 2, x: 4, y: 4, length: 1, dir: 'right' };
  const c = { id: 3, x: 0, y: 0, length: 1, dir: 'up' };
  let state = createState([a, b, c], SIZE);
  state = clickMatch(state, 1).state;
  state = clickMatch(state, 2).state; // last one pointing right -> candle 2
  assert.deepEqual(state.litCandles, [2]);
  assert.equal(state.candlesLit, 1);
  assert.equal(state.score, 1 + 1 + 2);
});

test('clickMatch: candle numbers are 1 up, 2 right, 3 down, 4 left', () => {
  const heads = { up: [2, 0], right: [4, 2], down: [2, 4], left: [0, 2] };
  ['up', 'right', 'down', 'left'].forEach((dir, index) => {
    const [x, y] = heads[dir];
    const match = { id: 1, x, y, length: 1, dir };
    const { state } = clickMatch(createState([match], SIZE), 1);
    assert.deepEqual(state.litCandles, [index + 1]);
  });
});

test('clickMatch: all 4 candles and a cleared level', () => {
  const matches = [
    { id: 1, x: 0, y: 0, length: 1, dir: 'up' },
    { id: 2, x: 4, y: 1, length: 1, dir: 'right' },
    { id: 3, x: 2, y: 4, length: 1, dir: 'down' },
    { id: 4, x: 0, y: 3, length: 1, dir: 'left' },
  ];
  let state = createState(matches, SIZE);
  for (const id of [1, 2, 3, 4]) state = clickMatch(state, id).state;
  // 4 x (1 match + 2 candle) + 3 level cleared
  assert.equal(state.score, 15);
  assert.deepEqual(state.litCandles, [1, 2, 3, 4]);
  assert.equal(state.candlesLit, 4);
  assert.equal(state.levelsCleared, 1);
  assert.equal(isLevelCleared(state), true);
});

test('clickMatch: a collision lights nothing and gives no points', () => {
  const a = { id: 1, x: 1, y: 2, length: 2, dir: 'right' };
  const blocker = { id: 2, x: 3, y: 2, length: 1, dir: 'up' };
  const { state } = clickMatch(createState([a, blocker], SIZE), 1);
  assert.deepEqual(state.litCandles, []);
  assert.equal(state.score, 0);
});

test('candleProgress: done / total per candle', () => {
  const matches = [
    { id: 1, x: 0, y: 0, length: 1, dir: 'up' },
    { id: 2, x: 4, y: 0, length: 1, dir: 'up' },
    { id: 3, x: 4, y: 1, length: 1, dir: 'right' },
  ];
  let state = createState(matches, SIZE);
  state = clickMatch(state, 1).state;
  const progress = candleProgress(state);
  assert.deepEqual(progress[1], { done: 1, total: 2, lit: false });
  assert.deepEqual(progress[2], { done: 0, total: 1, lit: false });
  assert.deepEqual(progress[3], { done: 0, total: 0, lit: false }); // no match points down
  state = clickMatch(state, 2).state;
  assert.deepEqual(candleProgress(state)[1], { done: 2, total: 2, lit: true });
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

test('nextLevelState: new board and candles from zero, score and hearts are kept', () => {
  const a = { id: 1, x: 0, y: 0, length: 1, dir: 'up' };
  let state = createState([a], SIZE);
  state = clickMatch(state, 1).state;
  state = { ...state, hearts: 2 };
  const level = {
    size: 6,
    matches: [
      { id: 1, x: 5, y: 5, length: 1, dir: 'down' },
      { id: 2, x: 0, y: 0, length: 1, dir: 'down' },
    ],
  };
  const next = nextLevelState(state, level);
  assert.equal(next.size, 6);
  assert.equal(next.matches.length, 2);
  assert.equal(next.score, state.score);
  assert.equal(next.hearts, 2);
  assert.deepEqual(next.litCandles, []);
  assert.deepEqual(next.dirTotals, { up: 0, right: 0, down: 2, left: 0 });
  assert.equal(next.candlesLit, state.candlesLit);
  assert.equal(next.levelsCleared, state.levelsCleared);
});
