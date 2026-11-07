// Date helpers that work on "YYYY-MM-DD" strings (UTC math, no timezone drift).
const STEP_MONTHS = { monthly: 1, 'every-3-months': 3, 'every-6-months': 6, yearly: 12 };

function isRealDate(str) {
  if (typeof str !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(str)) return false;
  const d = new Date(`${str}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === str;
}

function addMonths(str, months) {
  const [y, m, d] = str.split('-').map(Number);
  const target = new Date(Date.UTC(y, m - 1 + months, 1));
  const lastDay = new Date(Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0)).getUTCDate();
  target.setUTCDate(Math.min(d, lastDay));
  return target.toISOString().slice(0, 10);
}

function nextOccurrence(str, repeat) {
  const step = STEP_MONTHS[repeat];
  return step ? addMonths(str, step) : null;
}

module.exports = { isRealDate, addMonths, nextOccurrence };
