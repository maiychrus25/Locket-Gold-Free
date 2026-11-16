import test from 'node:test';
import assert from 'node:assert/strict';
const memory = await import('../src/lib/memories.js').catch(() => ({}));
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
