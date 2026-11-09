// Game rules. Pure functions, no DOM, so node --test can test them.
//
// A match: { id, x, y, length, dir }  (dir: 'up' | 'down' | 'left' | 'right')
// x, y is the cell of the red head. The body goes BACKWARDS from the head
// (opposite to dir). y grows downwards, like on the screen.

export const DIRECTIONS = {
  up: { dx: 0, dy: -1 },
  down: { dx: 0, dy: 1 },
  left: { dx: -1, dy: 0 },
  right: { dx: 1, dy: 0 },
};

// The side the match leaves on = the candle that is lit.
export const CANDLE_BY_DIR = { up: 1, right: 2, down: 3, left: 4 };

export const POINTS = {
  perCandle: 1,
  allCandlesBonus: 5,
  perLevelCleared: 3,
};

export const MAX_HEARTS = 3;

// All cells a match covers, head first.
export function cellsOf(match) {
  const { dx, dy } = DIRECTIONS[match.dir];
  const cells = [];
  for (let i = 0; i < match.length; i++) {
    cells.push({ x: match.x - dx * i, y: match.y - dy * i });
  }
  return cells;
}

// Walk from the head, cell by cell, to the edge. Another match in the way = false.
export function canExit(match, matches, size) {
  const { dx, dy } = DIRECTIONS[match.dir];

  const taken = new Set();
  for (const other of matches) {
    if (other.id === match.id) continue;
    for (const cell of cellsOf(other)) taken.add(`${cell.x},${cell.y}`);
  }

  let x = match.x + dx;
  let y = match.y + dy;
  while (x >= 0 && x < size && y >= 0 && y < size) {
    if (taken.has(`${x},${y}`)) return false;
    x += dx;
    y += dy;
  }
  return true;
}

export function candleFor(match) {
  return CANDLE_BY_DIR[match.dir];
}

// --- Game state (never changed in place, we return a new object) ---

export function createState(matches, size) {
  return {
    size,
    matches,            // matches still on the board
    litCandles: [],     // which of the 4 candles have burned (no duplicates)
    candlesLit: 0,      // +1 every time a match leaves
    score: 0,
    hearts: MAX_HEARTS,
    allCandlesBonusGiven: false,
    levelsCleared: 0,
  };
}

// Player clicks a match. Returns { state, result }.
// result: 'exit' | 'collision' | 'ignored'
export function clickMatch(state, matchId) {
  const match = state.matches.find((m) => m.id === matchId);
  if (!match || state.hearts <= 0) return { state, result: 'ignored' };

  // Collision: -1 heart, no minus points.
  if (!canExit(match, state.matches, state.size)) {
    return { state: { ...state, hearts: state.hearts - 1 }, result: 'collision' };
  }

  const candle = candleFor(match);
  const litCandles = state.litCandles.includes(candle)
    ? state.litCandles
    : [...state.litCandles, candle];

  let score = state.score + POINTS.perCandle;

  let allCandlesBonusGiven = state.allCandlesBonusGiven;
  if (!allCandlesBonusGiven && litCandles.length === 4) {
    score += POINTS.allCandlesBonus;
    allCandlesBonusGiven = true;
  }

  const matches = state.matches.filter((m) => m.id !== matchId);

  let levelsCleared = state.levelsCleared;
  if (matches.length === 0) {
    score += POINTS.perLevelCleared;
    levelsCleared += 1;
  }

  return {
    state: {
      ...state,
      matches,
      litCandles,
      candlesLit: state.candlesLit + 1,
      score,
      allCandlesBonusGiven,
      levelsCleared,
    },
    result: 'exit',
  };
}

export function isLevelCleared(state) {
  return state.matches.length === 0;
}

// Game ends when the timer reaches 0 or hearts are 0.
export function isGameOver(state, timeLeftMs) {
  return timeLeftMs <= 0 || state.hearts <= 0;
}

// --- Level checks (used by tests, and later by the server for max score) ---

// Returns a list of problems. Empty list = valid level.
export function validateLevel(matches, size) {
  const problems = [];
  const taken = new Map();
  for (const match of matches) {
    if (!DIRECTIONS[match.dir]) problems.push(`match ${match.id}: bad dir`);
    if (!Number.isInteger(match.length) || match.length < 1) {
      problems.push(`match ${match.id}: bad length`);
      continue;
    }
    for (const cell of DIRECTIONS[match.dir] ? cellsOf(match) : []) {
      if (cell.x < 0 || cell.x >= size || cell.y < 0 || cell.y >= size) {
        problems.push(`match ${match.id}: outside board at ${cell.x},${cell.y}`);
      }
      const key = `${cell.x},${cell.y}`;
      if (taken.has(key)) {
        problems.push(`match ${match.id} overlaps match ${taken.get(key)} at ${key}`);
      }
      taken.set(key, match.id);
    }
  }
  const ids = new Set(matches.map((m) => m.id));
  if (ids.size !== matches.length) problems.push('duplicate ids');
  return problems;
}

// Removing a match only frees space, so greedy is enough:
// keep removing any match that can exit. If the board gets empty, it is solvable.
export function isSolvable(matches, size) {
  let left = [...matches];
  let progress = true;
  while (left.length > 0 && progress) {
    progress = false;
    const free = left.find((m) => canExit(m, left, size));
    if (free) {
      left = left.filter((m) => m.id !== free.id);
      progress = true;
    }
  }
  return left.length === 0;
}
