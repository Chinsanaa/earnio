import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  isValidEmail,
  isValidUsername,
  isValidUuid,
  normalizeDeliverableUrl,
  parsePositiveInt,
  trimString,
} from '../utils/validate';

describe('isValidEmail', () => {
  it('accepts a well-formed address', () => {
    assert.equal(isValidEmail('user@example.com'), true);
    assert.equal(isValidEmail('a.b+tag@sub.domain.co'), true);
  });

  it('rejects addresses without an @ or domain', () => {
    assert.equal(isValidEmail('userexample.com'), false);
    assert.equal(isValidEmail('user@'), false);
    assert.equal(isValidEmail('user@domain'), false);
    assert.equal(isValidEmail('user @example.com'), false);
  });

  it('rejects addresses longer than 254 characters', () => {
    const long = `${'a'.repeat(250)}@b.com`;
    assert.equal(isValidEmail(long), false);
  });
});

describe('isValidUsername', () => {
  it('accepts alphanumerics and underscores within 3-30 chars', () => {
    assert.equal(isValidUsername('abc'), true);
    assert.equal(isValidUsername('user_name_123'), true);
    assert.equal(isValidUsername('a'.repeat(30)), true);
  });

  it('rejects names that are too short or too long', () => {
    assert.equal(isValidUsername('ab'), false);
    assert.equal(isValidUsername('a'.repeat(31)), false);
  });

  it('rejects disallowed characters and whitespace', () => {
    assert.equal(isValidUsername('has space'), false);
    assert.equal(isValidUsername('has-dash'), false);
    assert.equal(isValidUsername('has.dot'), false);
    assert.equal(isValidUsername('emoji😀'), false);
  });
});

describe('isValidUuid', () => {
  it('accepts canonical v1-v5 UUIDs', () => {
    assert.equal(isValidUuid('00000000-0000-4000-8000-000000000000'), true);
    assert.equal(isValidUuid('9b2e4c7a-1d3f-11ee-be56-0242ac120002'), true);
    assert.equal(isValidUuid('A987FBC9-4BED-5078-AF07-9141BA07C9F3'), true);
  });

  it('rejects malformed values', () => {
    assert.equal(isValidUuid('not-a-uuid'), false);
    assert.equal(isValidUuid('00000000000040008000000000000000'), false);
    assert.equal(isValidUuid('00000000-0000-0000-0000-000000000000'), false); // version 0
    assert.equal(isValidUuid(''), false);
  });
});

describe('parsePositiveInt', () => {
  it('parses a valid integer within the default bounds', () => {
    assert.equal(parsePositiveInt('5'), 5);
    assert.equal(parsePositiveInt(42), 42);
  });

  it('returns null for non-numeric, NaN, or non-integer values', () => {
    assert.equal(parsePositiveInt('abc'), null);
    assert.equal(parsePositiveInt(Number.NaN), null);
    assert.equal(parsePositiveInt(1.5), null);
    assert.equal(parsePositiveInt('3.14'), null);
    assert.equal(parsePositiveInt(undefined), null);
  });

  it('enforces the default minimum of 1', () => {
    assert.equal(parsePositiveInt(0), null);
    assert.equal(parsePositiveInt(-3), null);
  });

  it('honors explicit min and max bounds', () => {
    assert.equal(parsePositiveInt(5, { min: 10 }), null);
    assert.equal(parsePositiveInt(50, { max: 20 }), null);
    assert.equal(parsePositiveInt(15, { min: 10, max: 20 }), 15);
    assert.equal(parsePositiveInt(0, { min: 0 }), 0);
  });
});

describe('trimString', () => {
  it('trims surrounding whitespace', () => {
    assert.equal(trimString('  hello  ', 50), 'hello');
  });

  it('returns null for non-strings', () => {
    assert.equal(trimString(123, 50), null);
    assert.equal(trimString(null, 50), null);
    assert.equal(trimString(undefined, 50), null);
  });

  it('returns null for empty or whitespace-only input', () => {
    assert.equal(trimString('', 50), null);
    assert.equal(trimString('   ', 50), null);
  });

  it('returns null when the trimmed value exceeds maxLength', () => {
    assert.equal(trimString('abcdef', 5), null);
    assert.equal(trimString('abcde', 5), 'abcde');
  });
});

describe('normalizeDeliverableUrl', () => {
  it('accepts https links on supported platforms and subdomains', () => {
    assert.equal(
      normalizeDeliverableUrl('https://www.tiktok.com/@demo/video/123'),
      'https://www.tiktok.com/@demo/video/123'
    );
    assert.ok(normalizeDeliverableUrl('  https://youtu.be/abc  '));
    assert.ok(normalizeDeliverableUrl('https://www.instagram.com/reel/xyz/'));
    assert.ok(normalizeDeliverableUrl('https://m.youtube.com/watch?v=abc'));
  });

  it('rejects other schemes', () => {
    assert.equal(normalizeDeliverableUrl('javascript:alert(1)'), null);
    assert.equal(normalizeDeliverableUrl('http://www.tiktok.com/@demo/video/1'), null);
    assert.equal(normalizeDeliverableUrl('data:text/html,hi'), null);
  });

  it('rejects lookalike hosts and embedded credentials', () => {
    assert.equal(normalizeDeliverableUrl('https://tiktok.com.evil.example/x'), null);
    assert.equal(normalizeDeliverableUrl('https://eviltiktok.com/x'), null);
    assert.equal(normalizeDeliverableUrl('https://user:pw@www.tiktok.com/x'), null);
  });

  it('rejects empty and non-string input', () => {
    assert.equal(normalizeDeliverableUrl(''), null);
    assert.equal(normalizeDeliverableUrl(42), null);
    assert.equal(normalizeDeliverableUrl('not a url'), null);
  });
});
