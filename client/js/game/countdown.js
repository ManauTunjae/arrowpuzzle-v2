// Countdown based on performance.now(): start time minus now.
// setInterval only wakes us up. It can be late, so we never count ticks.

export const GAME_DURATION_MS = 30000;

// Pure function: how many ms are left. Never below 0.
export function timeLeftMs(startedAt, nowMs, durationMs = GAME_DURATION_MS) {
  return Math.max(0, durationMs - (nowMs - startedAt));
}

// now / setTimer / clearTimer can be replaced in tests (no real waiting).
export function createCountdown({
  durationMs = GAME_DURATION_MS,
  onTick = () => {},
  onEnd = () => {},
  intervalMs = 100,
  now = () => performance.now(),
  setTimer = (fn, ms) => setInterval(fn, ms),
  clearTimer = (id) => clearInterval(id),
} = {}) {
  let startedAt = null;
  let timerId = null;
  let ended = false;

  function getTimeLeft() {
    if (startedAt === null) return durationMs;
    return timeLeftMs(startedAt, now(), durationMs);
  }

  function stop() {
    if (timerId !== null) clearTimer(timerId);
    timerId = null;
  }

  function tick() {
    const left = getTimeLeft();
    onTick(left);
    if (left <= 0 && !ended) {
      ended = true;
      stop();
      onEnd();
    }
  }

  function start() {
    if (timerId !== null) return; // already running
    startedAt = now();
    ended = false;
    onTick(durationMs);
    timerId = setTimer(tick, intervalMs);
  }

  return { start, stop, tick, timeLeft: getTimeLeft, isRunning: () => timerId !== null };
}
