import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  generateInviteCode, normalizeInviteCode, CODE_ALPHABET, CODE_LENGTH,
} from '../server/services/inviteCode.js';

test('generateInviteCode: right length, only allowed characters', () => {
  for (let i = 0; i < 200; i++) {
    const code = generateInviteCode();
    assert.equal(code.length, CODE_LENGTH);
    for (const char of code) assert.ok(CODE_ALPHABET.includes(char), char);
  }
});

test('generateInviteCode: no easily mixed up characters', () => {
  for (const bad of ['0', 'O', '1', 'I', 'L']) assert.ok(!CODE_ALPHABET.includes(bad), bad);
});

test('generateInviteCode: codes are different', () => {
  const codes = new Set(Array.from({ length: 100 }, () => generateInviteCode()));
  assert.ok(codes.size > 95);
});

test('normalizeInviteCode: capitals and spaces are fixed, bad codes give null', () => {
  assert.equal(normalizeInviteCode(' abc234 '), 'ABC234');
  for (const bad of ['', 'ABC', 'ABCDEFG', 'ABC0O1', 'ab-234', null, undefined, 123, {}]) {
    assert.equal(normalizeInviteCode(bad), null, String(bad));
  }
});
