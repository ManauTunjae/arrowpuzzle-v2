import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cleanPhone, cleanNickname } from '../server/validators.js';

test('cleanPhone: different ways to write a Swedish mobile number', () => {
  for (const input of ['070-123 45 67', '0701234567', '+46701234567', '0046701234567', ' 070 123 45 67 ', '(070) 123-4567']) {
    assert.equal(cleanPhone(input), '+46701234567', input);
  }
});

test('cleanPhone: bad numbers give null', () => {
  for (const bad of ['', '123', '08-123 456 78', '0601234567', '07012345', '070123456789', '+4670123456a', '+447911123456', null, undefined, 701234567, {}]) {
    assert.equal(cleanPhone(bad), null, String(bad));
  }
});

test('cleanNickname: 2-20 characters, trimmed', () => {
  assert.equal(cleanNickname('  Anna '), 'Anna');
  for (const bad of ['', 'a', 'x'.repeat(21), '   ', null, 5]) assert.equal(cleanNickname(bad), null, String(bad));
});
