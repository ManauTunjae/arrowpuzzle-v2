import { test } from 'node:test';
import assert from 'node:assert/strict';
import { timeLeftMs, createCountdown, GAME_DURATION_MS } from '../client/js/game/countdown.js';

test('GAME_DURATION_MS is 30 seconds', () => {
  assert.equal(GAME_DURATION_MS, 30000);
});

test('timeLeftMs: start minus now, never below 0', () => {
  assert.equal(timeLeftMs(1000, 1000), 30000);
  assert.equal(timeLeftMs(1000, 11000), 20000);
  assert.equal(timeLeftMs(1000, 31000), 0);
  assert.equal(timeLeftMs(1000, 99000), 0);
});

// Fake clock and fake timer: we move time by hand.
function setup() {
  const clock = { t: 5000 };
  const timer = { fn: null, cleared: false };
  const ticks = [];
  let ended = 0;
  const countdown = createCountdown({
    onTick: (left) => ticks.push(left),
    onEnd: () => { ended += 1; },
    now: () => clock.t,
    setTimer: (fn) => { timer.fn = fn; return 1; },
    clearTimer: () => { timer.cleared = true; },
  });
  return { clock, timer, ticks, countdown, getEnded: () => ended };
}

test('countdown: timeLeft before start is the full time', () => {
  const { countdown } = setup();
  assert.equal(countdown.timeLeft(), 30000);
  assert.equal(countdown.isRunning(), false);
});

test('countdown: start sends 30000 and runs', () => {
  const { countdown, ticks } = setup();
  countdown.start();
  assert.deepEqual(ticks, [30000]);
  assert.equal(countdown.isRunning(), true);
});

test('countdown: a late timer still shows the right time', () => {
  const { countdown, clock, ticks } = setup();
  countdown.start();
  clock.t += 12345; // the timer was "late" and skipped many ticks
  countdown.tick();
  assert.equal(ticks.at(-1), 30000 - 12345);
});

test('countdown: ends once at 0 and stops the timer', () => {
  const { countdown, clock, timer, getEnded } = setup();
  countdown.start();
  clock.t += 30000;
  countdown.tick();
  countdown.tick(); // a second tick must not call onEnd again
  assert.equal(getEnded(), 1);
  assert.equal(timer.cleared, true);
  assert.equal(countdown.isRunning(), false);
});

test('countdown: start twice does not restart the clock', () => {
  const { countdown, clock } = setup();
  countdown.start();
  clock.t += 10000;
  countdown.start();
  assert.equal(countdown.timeLeft(), 20000);
});

test('countdown: stop clears the timer without calling onEnd', () => {
  const { countdown, timer, getEnded } = setup();
  countdown.start();
  countdown.stop();
  assert.equal(timer.cleared, true);
  assert.equal(getEnded(), 0);
});
