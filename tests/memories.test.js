import test from 'node:test';
import assert from 'node:assert/strict';
const memory = await import('../src/lib/memories.js').catch(() => ({}));
test('feed continuation appends distinct moments and stops empty or repeated cursors', () => {
  assert.equal(typeof memory.feedPage, 'function');
  const first = {canonical_uid:'first'}, second = {moment_uid:'second'};
  assert.deepEqual(memory.feedPage([], [first]), {moments:[first], cursor:'first'});
  assert.deepEqual(memory.feedPage([first], [first, second], 'first'), {moments:[first, second], cursor:'second'});
  assert.deepEqual(memory.feedPage([first, second], [second], 'second'), {moments:[first, second], cursor:''});
  assert.deepEqual(memory.feedPage([first], [], 'first'), {moments:[first], cursor:''});
  assert.deepEqual(memory.feedPage([], [null, 'invalid', first]), {moments:[first], cursor:'first'});
});
test('feed author resolution never trusts an inferred history owner', () => {
  assert.equal(typeof memory.momentAuthor, 'function');
  assert.equal(memory.momentAuthor({user_uid:'self'}, true), null);
  assert.deepEqual(memory.momentAuthor({user_uid:'self',authorVerified:true}, true), {uid:'self'});
  assert.equal(memory.momentAuthor({user:'friend'}, true), 'friend');
  assert.deepEqual(memory.momentAuthor({user_uid:'friend'}), {uid:'friend'});
});
test('SDK timestamp shapes resolve the same instant and invalid values stay unknown', () => {
  assert.equal(typeof memory.parseTimestamp, 'function');
  for (const value of [1704067200, '1704067200', 1704067200000, {seconds: 1704067200}, {_seconds: 1704067200}, {timestampValue: '2024-01-01T00:00:00Z'}]) {
    assert.equal(memory.parseTimestamp(value)?.toISOString(), '2024-01-01T00:00:00.000Z');
  }
  for (const value of [null, '', {}, true, 'bad', Infinity]) assert.equal(memory.parseTimestamp(value), null);
});
test('ISO week-year handles December and January boundaries without accepting impossible dates', () => {
  assert.equal(typeof memory.isoWeek, 'function');
  assert.deepEqual(memory.isoWeek('2021-01-01'), {year: 2020, weekOfYear: 53});
  assert.deepEqual(memory.isoWeek('2024-12-30'), {year: 2025, weekOfYear: 1});
  assert.deepEqual(memory.isoWeek('2026-11-16'), {year: 2026, weekOfYear: 47});
  assert.equal(memory.isoWeek('2025-02-29'), null);
  assert.equal(memory.isoWeek(''), null);
});
