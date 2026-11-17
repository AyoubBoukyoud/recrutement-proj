/** Date and layout invariants for the connected academic timetable. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const file = path.join(__dirname, '../src/lib/amud/timetable/calendar.ts');
const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
const moduleExports = {};
vm.runInNewContext(code, { exports: moduleExports, Date, Intl, Map, Number, String, Math });
const { academicToday, addDays, mondayOf, minutes, clockTime, layoutSessions } = moduleExports;

assert.equal(academicToday(new Date('2026-01-01T23:30:00Z')), '2026-01-02');
assert.equal(mondayOf('2026-11-15'), '2026-11-09');
assert.equal(mondayOf('2026-11-16'), '2026-11-16');
assert.equal(mondayOf('2027-01-03'), '2026-12-28');
assert.equal(addDays('2026-12-28', 7), '2027-01-04');
assert.equal(addDays('2028-02-28', 1), '2028-02-29');
for (const zone of ['UTC', 'Africa/Casablanca', 'Pacific/Auckland', 'America/Los_Angeles']) {
  process.env.TZ = zone;
  assert.equal(addDays('2026-03-21', 1), '2026-03-22');
  assert.equal(mondayOf('2026-03-22'), '2026-03-16');
}
assert.equal(minutes('08:30'), 510);
assert.equal(clockTime(1439), '23:59');
function session(id, start_time, end_time) { return { id, start_time, end_time }; }
const events = [session(1, '08:00', '10:00'), session(2, '09:00', '11:00'), session(3, '10:00', '12:00'), session(4, '12:00', '13:00')];
const layout = layoutSessions(events);
assert.equal(layout.length, 4);
assert.equal(layout.find((entry) => entry.session.id === 4).columns, 1);
assert.equal(layout.find((entry) => entry.session.id === 1).columns, 2);
assert.equal(layout.find((entry) => entry.session.id === 3).column, 0);
assert.equal(events[0].id, 1, 'Layout must not mutate input');
for (let seed = 1; seed <= 50; seed++) {
  let random = seed;
  const rng = () => { random = (random * 1664525 + 1013904223) >>> 0; return random; };
  const generated = Array.from({ length: 80 }, (_, id) => { const start = 480 + rng() % 500; return session(id, clockTime(start), clockTime(start + 15 + rng() % 180)); });
  const entries = layoutSessions(generated);
  for (const a of entries) {
    assert.ok(a.column >= 0 && a.column < a.columns);
    for (const b of entries) {
      if (a.session.id !== b.session.id && a.column === b.column) {
        assert.ok(a.session.end_time <= b.session.start_time || b.session.end_time <= a.session.start_time, 'Overlapping sessions must occupy distinct columns');
      }
    }
  }
}
console.log('PASS academic dates across time zones, weekly/year boundaries, time conversion, and 4,000 event layout cases.');
