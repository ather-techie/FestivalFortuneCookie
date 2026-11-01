// Simulation harness for festival window logic (run: node tests/simulate-windows.js)
// Mirrors app.js logic; used to verify early-access behaviour without a browser.
function todayAt(y, m, d) { const x = new Date(y, m - 1, d); x.setHours(0, 0, 0, 0); return x; }
function festivalDate(now, f, month, day) { return new Date(now.getFullYear(), month - 1, day); }
function nextOccurrence(now, f) {
  const start = festivalDate(now, f, f.startMonth, f.startDay);
  const end = festivalDate(now, f, f.endMonth, f.endDay);
  if (end < start) end.setFullYear(end.getFullYear() + 1);
  if (end < now) start.setFullYear(start.getFullYear() + 1);
  return start;
}
function isFestivalActive(now, f) {
  const start = nextOccurrence(now, f);
  const end = festivalDate(now, f, f.endMonth, f.endDay);
  if (end < start) end.setFullYear(end.getFullYear() + 1);
  const openDate = new Date(start);
  openDate.setDate(openDate.getDate() - (f.earlyDays || 0));
  return now >= openDate && now <= end;
}
function daysUntil(now, f) { return Math.max(0, Math.ceil((nextOccurrence(now, f) - now) / 864e5)); }

const F = [
  { key: 'halloween', startMonth: 10, startDay: 25, endMonth: 10, endDay: 31, earlyDays: 7 },
  { key: 'christmas', startMonth: 12, startDay: 20, endMonth: 12, endDay: 25, earlyDays: 14 },
  { key: 'diwali', startMonth: 10, startDay: 20, endMonth: 11, endDay: 5, earlyDays: 7 },
  { key: 'eid', startMonth: 4, startDay: 1, endMonth: 5, endDay: 5, earlyDays: 7 },
  { key: 'lny', startMonth: 1, startDay: 20, endMonth: 2, endDay: 10, earlyDays: 14 },
  { key: 'valentine', startMonth: 2, startDay: 10, endMonth: 2, endDay: 15, earlyDays: 7 },
];

const cases = [
  [[2026, 11, 1], 'today — past festivals must roll to next year'],
  [[2026, 10, 18], 'Halloween grace opens exactly today'],
  [[2026, 10, 17], 'day before Halloween grace — must be closed'],
  [[2026, 11, 2], 'Diwali official window active'],
  [[2026, 11, 6], 'day after Diwali end — closed, next year countdown'],
  [[2026, 12, 10], 'Christmas grace period active'],
  [[2026, 12, 26], 'day after Christmas — closed'],
  [[2026, 1, 25], 'Lunar New Year official window'],
];

let failures = 0;
for (const [[y, m, d], label] of cases) {
  const now = todayAt(y, m, d);
  console.log(`\n--- ${now.toDateString()}  (${label})`);
  for (const f of F) {
    const active = isFestivalActive(now, f);
    const days = daysUntil(now, f);
    console.log(`  ${f.key.padEnd(10)} ${active ? 'ACTIVE' : 'closed'} | opens in ${days} days`);
    if (!active && days === 0) { console.log(`    ^ BUG: closed but countdown says 0 days`); failures++; }
  }
}
console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} BUG(S) FOUND`);
process.exit(failures === 0 ? 0 : 1);
