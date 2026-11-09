// Levels are made by hand. Do not randomize.
// Match: { id, x, y, length, dir }. x, y = the red head. The body goes backwards.
// y grows downwards. Comments show which match blocks which.

const LEVELS = [
  {
    level: 1,
    size: 5,
    matches: [
      { id: 1, x: 2, y: 0, length: 2, dir: 'up' },     // free
      { id: 2, x: 4, y: 1, length: 2, dir: 'right' },  // free
      { id: 3, x: 2, y: 4, length: 2, dir: 'down' },   // free
      { id: 4, x: 0, y: 3, length: 2, dir: 'left' },   // free
      { id: 5, x: 1, y: 1, length: 2, dir: 'right' },  // blocked by 1
      { id: 6, x: 3, y: 3, length: 2, dir: 'up' },     // blocked by 2
      { id: 7, x: 0, y: 2, length: 1, dir: 'down' },   // blocked by 4
      { id: 8, x: 4, y: 3, length: 2, dir: 'up' },     // blocked by 2
    ],
  },
  {
    level: 2,
    size: 6,
    matches: [
      { id: 1, x: 0, y: 0, length: 1, dir: 'up' },     // free
      { id: 2, x: 5, y: 0, length: 3, dir: 'right' },  // free
      { id: 3, x: 1, y: 2, length: 2, dir: 'left' },   // blocked by 4
      { id: 4, x: 0, y: 2, length: 2, dir: 'down' },   // free
      { id: 5, x: 3, y: 2, length: 2, dir: 'up' },     // blocked by 2
      { id: 6, x: 5, y: 2, length: 2, dir: 'up' },     // blocked by 2
      { id: 7, x: 4, y: 4, length: 2, dir: 'right' },  // blocked by 9
      { id: 8, x: 5, y: 4, length: 1, dir: 'up' },     // blocked by 6 (its body)
      { id: 9, x: 2, y: 4, length: 2, dir: 'down' },   // free
      { id: 10, x: 1, y: 3, length: 1, dir: 'right' }, // blocked by 9
      { id: 11, x: 4, y: 5, length: 2, dir: 'left' },  // free
    ],
  },
  {
    level: 3,
    size: 7,
    matches: [
      { id: 1, x: 3, y: 0, length: 2, dir: 'up' },     // free
      { id: 2, x: 6, y: 1, length: 3, dir: 'right' },  // free
      { id: 3, x: 0, y: 5, length: 2, dir: 'left' },   // free
      { id: 4, x: 4, y: 6, length: 2, dir: 'down' },   // free
      { id: 5, x: 2, y: 2, length: 2, dir: 'up' },     // blocked by 6
      { id: 6, x: 2, y: 0, length: 1, dir: 'right' },  // blocked by 1
      { id: 7, x: 5, y: 3, length: 2, dir: 'up' },     // blocked by 2
      { id: 8, x: 1, y: 3, length: 2, dir: 'right' },  // blocked by 5
      { id: 9, x: 3, y: 4, length: 3, dir: 'down' },   // free
      { id: 10, x: 1, y: 6, length: 1, dir: 'left' },  // free
      { id: 11, x: 6, y: 3, length: 1, dir: 'down' },  // blocked by 13
      { id: 12, x: 1, y: 1, length: 2, dir: 'down' },  // blocked by 8
      { id: 13, x: 6, y: 5, length: 1, dir: 'down' },  // free
      { id: 14, x: 0, y: 2, length: 1, dir: 'down' },  // blocked by 8
    ],
  },
];

export const LEVEL_COUNT = LEVELS.length;

// Returns a copy, so the game can never change the original level.
export function getLevel(number) {
  const level = LEVELS.find((l) => l.level === number);
  if (!level) return null;
  return {
    level: level.level,
    size: level.size,
    matches: level.matches.map((m) => ({ ...m })),
  };
}
