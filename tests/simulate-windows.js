// Simulation harness for festival window logic (run: node tests/simulate-windows.js)
// Mirrors app.js logic; used to verify early-access behaviour without a browser.
function todayAt(y, m, d) { const x = new Date(y, m - 1, d); x.setHours(0, 0, 0, 0); return x; }
function festivalDate(now, f, month, day) { return new Date(now.getFullYear(), month - 1, day); }
function nextOccurrence(now, f) {
  const start = festivalDate(now, f, f.startMonth, f.startDay);
  const end = festivalDate(now, f, f.endMonth, f.endDay);
  if (end < start) end.setFullYear(end.getFullYear() + 1);
  const closeDate = new Date(end);
  closeDate.setDate(closeDate.getDate() + (f.lateDays || 0));
  if (closeDate < now) start.setFullYear(start.getFullYear() + 1);
  return start;
}
function isFestivalActive(now, f) {
  const start = nextOccurrence(now, f);
  const end = festivalDate(now, f, f.endMonth, f.endDay);
  if (end < start) end.setFullYear(end.getFullYear() + 1);
  const openDate = new Date(start);
  openDate.setDate(openDate.getDate() - (f.earlyDays || 0));
  const closeDate = new Date(end);
  closeDate.setDate(closeDate.getDate() + (f.lateDays || 0));
  return now >= openDate && now <= closeDate;
}
function daysUntil(now, f) { return Math.max(0, Math.ceil((nextOccurrence(now, f) - now) / 864e5)); }

const F = [
  { key: 'halloween', startMonth: 10, startDay: 25, endMonth: 10, endDay: 31, earlyDays: 7, lateDays: 7 },
  { key: 'christmas', startMonth: 12, startDay: 20, endMonth: 12, endDay: 25, earlyDays: 14, lateDays: 14 },
  { key: 'diwali', startMonth: 10, startDay: 20, endMonth: 11, endDay: 5, earlyDays: 7, lateDays: 7 },
  { key: 'eid', startMonth: 4, startDay: 1, endMonth: 5, endDay: 5, earlyDays: 7, lateDays: 7 },
  { key: 'lny', startMonth: 1, startDay: 20, endMonth: 2, endDay: 10, earlyDays: 14, lateDays: 14 },
  { key: 'valentine', startMonth: 2, startDay: 10, endMonth: 2, endDay: 15, earlyDays: 7, lateDays: 7 },
];

const cases = [
  [[2026, 11, 1], 'today — past festivals must roll to next year'],
  [[2026, 10, 18], 'Halloween grace opens exactly today'],
  [[2026, 10, 17], 'day before Halloween grace — must be closed'],
  [[2026, 11, 2], 'Diwali official window active'],
  [[2026, 11, 6], 'day after Diwali end — still active due to lateDays'],
  [[2026, 11, 13], 'lateDays over after Diwali — closed'],
  [[2026, 12, 10], 'Christmas grace period active'],
  [[2026, 12, 26], 'day after Christmas — still active due to lateDays'],
  [[2026, 1, 3], 'lateDays over after Christmas — closed'],
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

// Boundary assertions: after-window must stay open through end+lateDays, close the day after.
function endPlusDays(now, f, n) {
  const end = festivalDate(now, f.endMonth, f.endDay);
  end.setDate(end.getDate() + n);
  return end;
}
for (const f of F.filter(x => x.lateDays > 0)) {
  const probe = todayAt(2026, 11, 2); // Diwali ends Nov 5; use Halloween-style generic probe below
}
{
  const now = todayAt(2026, 11, 2);
  const h = F.find(f => f.key === 'halloween');
  const diw = F.find(f => f.key === 'diwali');
  // Halloween official end: Oct 31. lateDays 7 -> closes Nov 7.
  if (!isFestivalActive(todayAt(2026, 11, 1), h)) { console.log('BUG: Halloween should stay ACTIVE on Nov 1 (late window)'); failures++; }
  if (isFestivalActive(todayAt(2026, 11, 8), h)) { console.log('BUG: Halloween should be CLOSED on Nov 8 (end+7+1)'); failures++; }
  if (!isFestivalActive(todayAt(2026, 11, 7), h)) { console.log('BUG: Halloween should stay ACTIVE through Nov 7 (end+lateDays)'); failures++; }
  // Diwali official end: Nov 5. lateDays 7 -> closes Nov 12.
  if (!isFestivalActive(todayAt(2026, 11, 12), diw)) { console.log('BUG: Diwali should stay ACTIVE through Nov 12 (end+lateDays)'); failures++; }
  if (isFestivalActive(todayAt(2026, 11, 13), diw)) { console.log('BUG: Diwali should be CLOSED on Nov 13 (end+7+1)'); failures++; }
}
console.log(failures === 0 ? '\nAll checks passed.' : `\n${failures} BUG(S) FOUND`);
process.exit(failures === 0 ? 0 : 1);
