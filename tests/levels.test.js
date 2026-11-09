import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getLevel, LEVEL_COUNT } from '../client/js/game/levels.js';
import { validateLevel, isSolvable, canExit } from '../client/js/game/rules.js';

const SIZES = { 1: 5, 2: 6, 3: 7 };

test('there are 3 levels', () => {
  assert.equal(LEVEL_COUNT, 3);
  assert.equal(getLevel(4), null);
});

for (const number of [1, 2, 3]) {
  test(`level ${number}: size ${SIZES[number]}, valid, solvable`, () => {
    const { size, matches } = getLevel(number);
    assert.equal(size, SIZES[number]);
    assert.deepEqual(validateLevel(matches, size), []);
    assert.equal(isSolvable(matches, size), true);
  });

  test(`level ${number}: uses all 4 directions and has blocked matches`, () => {
    const { size, matches } = getLevel(number);
    const dirs = new Set(matches.map((m) => m.dir));
    assert.equal(dirs.size, 4);
    const blocked = matches.filter((m) => !canExit(m, matches, size));
    assert.ok(blocked.length >= 3, 'needs some blocked matches so a click can collide');
    assert.ok(blocked.length < matches.length, 'needs at least one free match');
  });
}

test('getLevel returns a copy', () => {
  const a = getLevel(1);
  a.matches[0].x = 99;
  assert.notEqual(getLevel(1).matches[0].x, 99);
});

test('validateLevel finds overlap and outside-board problems', () => {
  const bad = [
    { id: 1, x: 1, y: 1, length: 2, dir: 'right' },
    { id: 2, x: 0, y: 1, length: 1, dir: 'up' },
    { id: 3, x: 0, y: 0, length: 3, dir: 'down' },
  ];
  const problems = validateLevel(bad, 5);
  assert.ok(problems.some((p) => p.includes('overlaps')));
  assert.ok(problems.some((p) => p.includes('outside')));
});

test('isSolvable: two matches blocking each other is not solvable', () => {
  const stuck = [
    { id: 1, x: 0, y: 0, length: 1, dir: 'right' },
    { id: 2, x: 2, y: 0, length: 1, dir: 'left' },
  ];
  assert.equal(isSolvable(stuck, 5), false);
});
