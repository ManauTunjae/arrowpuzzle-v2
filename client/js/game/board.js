// Draws the board as SVG. No game rules here, only drawing + click events.
import { cellsOf, DIRECTIONS, CANDLE_BY_DIR } from './rules.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const CELL = 60;     // size of one cell in SVG units
const MARGIN = 70;   // space around the board for the candles
const PAD = 9;       // space between a match and its cell edge

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

  // Body (rounded rectangle) + a bigger invisible area that is easy to tap.
  el('rect', {
    class: 'match__body',
    x: left + PAD, y: top + PAD, width: width - 2 * PAD, height: height - 2 * PAD, rx: 10,
  }, g);

  // Red head at the end where dir points.
  const { dx, dy } = DIRECTIONS[match.dir];
  const headX = MARGIN + match.x * CELL + CELL / 2;
  const headY = MARGIN + match.y * CELL + CELL / 2;
  el('circle', {
    class: 'match__head',
    cx: headX + dx * (CELL / 2 - PAD - 14),
    cy: headY + dy * (CELL / 2 - PAD - 14),
    r: 14,
  }, g);

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
  drawCandle(svg, CANDLE_BY_DIR.up, mid, edge, 0, lit(1));
  drawCandle(svg, CANDLE_BY_DIR.right, total - edge, mid, 90, lit(2));
  drawCandle(svg, CANDLE_BY_DIR.down, mid, total - edge, 180, lit(3));
  drawCandle(svg, CANDLE_BY_DIR.left, edge, mid, 270, lit(4));

  for (const match of state.matches) drawMatch(svg, match, onMatchClick);
}
