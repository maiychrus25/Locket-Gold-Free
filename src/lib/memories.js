export function parseTimestamp(value) {
  if (value && typeof value === 'object') {
    value = value.timestampValue ?? value.seconds ?? value._seconds;
  }
  if (typeof value !== 'number' && typeof value !== 'string') return null;
  if (typeof value === 'string' && !value.trim()) return null;
  const numeric = typeof value === 'number' || /^-?\d+(\.\d+)?$/.test(value);
  const date = new Date(numeric ? Number(value) * (Math.abs(Number(value)) < 1e12 ? 1000 : 1) : value);
  return Number.isFinite(date.getTime()) ? date : null;
}

export function localDate(date = new Date()) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

export function isoWeek(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) return null;
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
  const year = date.getUTCFullYear();
  return { year, weekOfYear: Math.ceil(((date - new Date(Date.UTC(year, 0, 1))) / 86400000 + 1) / 7) };
}

export function momentDate(item) {
  return parseTimestamp(item.date ?? item.created_at ?? item.createdAt ?? item.timestamp);
}
