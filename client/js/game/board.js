// Draws the board as SVG. No game rules here, only drawing + click events.
import { cellsOf, DIRECTIONS } from './rules.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const CELL = 60;     // size of one cell in SVG units
const MARGIN = 70;   // space around the board for the candles
const END_PAD = 8;    // space at the ends of a match (along its length)
const SIDE_PAD = 24; // space at the sides (makes the match thin)
const HEAD_R = 9;     // red head is a bit wider than the stick, like a real match

const DIR_TEXT = { up: 'uppåt', down: 'nedåt', left: 'vänster', right: 'höger' };

function el(name, attrs = {}, parent) {
  const node = document.createElementNS(SVG_NS, name);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  if (parent) parent.append(node);
  return node;
}

// One candle, drawn "pointing up". The group is rotated to its side.
function drawCandle(parent, number, x, y, angle, lit) {
  const g = el('g', {
    class: lit ? 'candle candle--lit' : 'candle',
    transform: `translate(${x} ${y}) rotate(${angle})`,
    'data-candle': number,
  }, parent);
  el('rect', { class: 'candle__body', x: -9, y: -14, width: 18, height: 34, rx: 3 }, g);
  el('line', { class: 'candle__wick', x1: 0, y1: -14, x2: 0, y2: -20 }, g);
  el('ellipse', { class: 'candle__flame', cx: 0, cy: -29, rx: 7, ry: 11 }, g);
  el('ellipse', { class: 'candle__glow', cx: 0, cy: -29, rx: 18, ry: 22 }, g);
}

function drawMatch(parent, match, onClick) {
  const cells = cellsOf(match);
  const xs = cells.map((c) => c.x);
  const ys = cells.map((c) => c.y);
  const left = MARGIN + Math.min(...xs) * CELL;
  const top = MARGIN + Math.min(...ys) * CELL;
  const width = (Math.max(...xs) - Math.min(...xs) + 1) * CELL;
  const height = (Math.max(...ys) - Math.min(...ys) + 1) * CELL;

  const g = el('g', {
    class: 'match',
    'data-id': match.id,
    role: 'button',
    tabindex: 0,
    'aria-label': `Tändsticka, pekar ${DIR_TEXT[match.dir]}`,
  }, parent);

  // Thin stick: small padding at the sides, small padding at the ends.
  const horizontal = match.dir === 'left' || match.dir === 'right';
  const padX = horizontal ? END_PAD : SIDE_PAD;
  const padY = horizontal ? SIDE_PAD : END_PAD;
  el('rect', {
    class: 'match__body',
    x: left + padX, y: top + padY, width: width - 2 * padX, height: height - 2 * padY, rx: 6,
  }, g);

  // Red head at the end where dir points (flush with the end of the stick).
  const { dx, dy } = DIRECTIONS[match.dir];
  const headX = MARGIN + match.x * CELL + CELL / 2;
  const headY = MARGIN + match.y * CELL + CELL / 2;
  const offset = CELL / 2 - END_PAD - HEAD_R;
  el('circle', {
    class: 'match__head',
    cx: headX + dx * offset,
    cy: headY + dy * offset,
    r: HEAD_R,
  }, g);

  // Bigger invisible area that is easy to tap.
  el('rect', { class: 'match__hit', x: left, y: top, width, height }, g);

  g.addEventListener('click', () => onClick(match.id));
  g.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick(match.id);
    }
  });
}

// Draws everything from scratch. state comes from rules.js.
export function renderBoard(svg, state, onMatchClick) {
  const boardSize = state.size * CELL;
  const total = boardSize + 2 * MARGIN;
  svg.setAttribute('viewBox', `0 0 ${total} ${total}`);
  svg.replaceChildren();

  // Board background and grid dots.
  el('rect', { class: 'board', x: MARGIN, y: MARGIN, width: boardSize, height: boardSize, rx: 16 }, svg);
  for (let x = 0; x < state.size; x++) {
    for (let y = 0; y < state.size; y++) {
      el('circle', {
        class: 'board__dot',
        cx: MARGIN + x * CELL + CELL / 2,
        cy: MARGIN + y * CELL + CELL / 2,
        r: 2.5,
      }, svg);
    }
  }

  // 4 candles: up, right, down, left.
  const mid = total / 2;
  const edge = MARGIN / 2 + 6;
  const lit = (n) => state.litCandles.includes(n);
  drawCandle(svg, 1, mid, edge, 0, lit(1));
  drawCandle(svg, 2, total - edge, mid, 90, lit(2));
  drawCandle(svg, 3, mid, total - edge, 180, lit(3));
  drawCandle(svg, 4, edge, mid, 270, lit(4));

  for (const match of state.matches) drawMatch(svg, match, onMatchClick);
}

// --- Animations (Web Animations API). Each returns a Promise that is done when it ends. ---

const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function matchElement(svg, id) {
  return svg.querySelector(`.match[data-id="${id}"]`);
}

// The match slides out over the edge of the board, in the direction of its head.
export function animateExit(svg, match, size) {
  const node = matchElement(svg, match.id);
  if (!node) return Promise.resolve();

  const { dx, dy } = DIRECTIONS[match.dir];
  const stepsToEdge = { up: match.y, down: size - 1 - match.y, left: match.x, right: size - 1 - match.x }[match.dir];
  // Head to the edge + the whole length of the match + 1 cell, so it is fully gone.
  const distance = (stepsToEdge + match.length + 1) * CELL;
  const duration = reduceMotion() ? 1 : 300 + stepsToEdge * 50;

  node.style.pointerEvents = 'none';
  const animation = node.animate(
    [
      { transform: 'translate(0px, 0px)', opacity: 1 },
      { transform: `translate(${dx * distance * 0.85}px, ${dy * distance * 0.85}px)`, opacity: 1, offset: 0.85 },
      { transform: `translate(${dx * distance}px, ${dy * distance}px)`, opacity: 0 },
    ],
    { duration, easing: 'ease-in', fill: 'forwards' },
  );
  return animation.finished.catch(() => {});
}

// Collision: the match shakes back and forth along its direction.
export function animateShake(svg, match) {
  const node = matchElement(svg, match.id);
  if (!node) return Promise.resolve();

  const { dx, dy } = DIRECTIONS[match.dir];
  const at = (px) => ({ transform: `translate(${dx * px}px, ${dy * px}px)` });
  const animation = node.animate(
    [at(0), at(8), at(-8), at(6), at(-6), at(3), at(0)],
    { duration: reduceMotion() ? 1 : 350, easing: 'ease-in-out' },
  );
  return animation.finished.catch(() => {});
}
