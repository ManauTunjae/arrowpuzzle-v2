import { test } from 'node:test';
import assert from 'node:assert/strict';
import { swishMessage, swishQrText, swishLink, swishQrSvg } from '../server/services/swishQr.js';
import { cleanAmount } from '../server/validators.js';

const payment = { number: '1230000001', amount: 50, message: 'Tänd ett ljus' };

test('swishMessage: includes the organisation and is at most 50 characters', () => {
  assert.equal(swishMessage('Granbacken'), 'Tänd ett ljus – Granbacken');
  assert.equal(swishMessage('x'.repeat(200)).length, 50);
});

test('swishQrText: C<number>;<amount>;<message>;0', () => {
  assert.equal(swishQrText(payment), 'C1230000001;50;Tänd ett ljus;0');
});

test('swishLink: swish:// link with the payment as JSON', () => {
  const link = swishLink(payment);
  assert.ok(link.startsWith('swish://payment?data='));
  const data = JSON.parse(decodeURIComponent(link.split('data=')[1]));
  assert.equal(data.payee.value, '1230000001');
  assert.equal(data.amount.value, 50);
});

test('swishQrSvg: gives an SVG image', async () => {
  const svg = await swishQrSvg(payment);
  assert.match(svg, /^<svg/);
});

test('cleanAmount: whole kronor from 1 to 10000', () => {
  assert.equal(cleanAmount(50), 50);
  assert.equal(cleanAmount(1), 1);
  assert.equal(cleanAmount(10000), 10000);
  for (const bad of [0, -5, 10001, 1.5, '50', null, undefined, NaN]) {
    assert.equal(cleanAmount(bad), null, String(bad));
  }
});
