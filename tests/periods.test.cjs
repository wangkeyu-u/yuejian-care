const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const MoonCore = require('../dist/core.js');
const MoonPeriods = require('../dist/periods.js');

const TODAY = '2024-03-31';

function period(id, start, end = null, status = 'unknown') {
  return { id, start, end, status };
}

test('exports the period API in Node and as the browser MoonPeriods global', () => {
  for (const name of [
    'migratePeriods',
    'validatePeriods',
    'upsertPeriod',
    'removePeriod',
    'actualDuration',
  ]) {
    assert.equal(typeof MoonPeriods[name], 'function');
  }

  const source = fs.readFileSync(require.resolve('../dist/periods.js'), 'utf8');
  const context = { MoonCore };
  vm.runInNewContext(source, context);
  assert.equal(typeof context.MoonPeriods.validatePeriods, 'function');
  assert.equal(
    JSON.stringify(context.MoonPeriods.validatePeriods([period('p', '2024-01-01')], TODAY)),
    JSON.stringify([period('p', '2024-01-01')]),
  );
});

test('legacy starts migrate to stable unknown records without guessing an end', () => {
  const migrated = MoonPeriods.migratePeriods(
    { starts: ['2024-02-29', '2024-03-20', '2024-02-29'], periodLength: 5 },
    TODAY,
  );
  assert.deepEqual(migrated, [
    period('legacy-2024-02-29', '2024-02-29'),
    period('legacy-2024-03-20', '2024-03-20'),
  ]);
});

test('an explicit empty new periods array is authoritative over stale starts', () => {
  assert.deepEqual(
    MoonPeriods.migratePeriods(
      { periods: [], starts: ['2024-03-01'], periodLength: 5 },
      TODAY,
    ),
    [],
  );
  assert.throws(
    () => MoonPeriods.migratePeriods({ periods: null, starts: ['2024-03-01'] }, TODAY),
    /profile\.periods.*数组/,
  );
});

test('duplicate records in the new periods schema remain strict errors', () => {
  assert.throws(
    () => MoonPeriods.migratePeriods(
      { periods: [period('same-id', '2024-03-01'), period('same-id', '2024-03-02')] },
      TODAY,
    ),
    /id.*重复/,
  );
  assert.throws(
    () => MoonPeriods.migratePeriods(
      { periods: [period('p1', '2024-03-01'), period('p2', '2024-03-01')] },
      TODAY,
    ),
    /start.*重复/,
  );
});

test('editing a record supports earlier or later starts, early endings, and extensions', () => {
  const initial = [period('p1', '2024-01-31', '2024-02-05', 'ended')];
  const earlier = MoonPeriods.upsertPeriod(
    initial,
    period('p1', '2024-01-30', '2024-02-05', 'ended'),
    TODAY,
  );
  assert.deepEqual(earlier, [period('p1', '2024-01-30', '2024-02-05', 'ended')]);

  const later = MoonPeriods.upsertPeriod(
    earlier,
    period('p1', '2024-02-01', '2024-02-05', 'ended'),
    TODAY,
  );
  assert.deepEqual(later, [period('p1', '2024-02-01', '2024-02-05', 'ended')]);

  const endedEarly = MoonPeriods.upsertPeriod(
    later,
    period('p1', '2024-02-01', '2024-02-03', 'ended'),
    TODAY,
  );
  assert.equal(MoonPeriods.actualDuration(endedEarly[0], TODAY), 3);

  const extended = MoonPeriods.upsertPeriod(
    endedEarly,
    period('p1', '2024-02-01', '2024-02-20', 'ended'),
    TODAY,
  );
  assert.equal(MoonPeriods.actualDuration(extended[0], TODAY), 20);
});

test('duration arithmetic crosses month boundaries and leap day without a 14-day cap', () => {
  assert.equal(
    MoonPeriods.actualDuration(period('leap', '2024-02-28', '2024-03-02', 'ended'), TODAY),
    4,
  );
  assert.equal(
    MoonPeriods.actualDuration(period('ongoing', '2024-02-28', null, 'ongoing'), '2024-03-02'),
    4,
  );
  assert.equal(MoonPeriods.actualDuration(period('unknown', '2024-02-28'), TODAY), null);
});

test('invalid schema, future dates, and reversed ranges are rejected', () => {
  assert.throws(() => MoonPeriods.validatePeriods('not-an-array', TODAY), /必须是数组/);
  assert.throws(() => MoonPeriods.validatePeriods([period('p', '2024-04-01')], TODAY), /不能晚于 today/);
  assert.throws(
    () => MoonPeriods.validatePeriods([period('p', '2024-03-20', '2024-04-01', 'ended')], TODAY),
    /不能晚于 today/,
  );
  assert.throws(
    () => MoonPeriods.validatePeriods([period('p', '2024-03-20', '2024-03-19', 'ended')], TODAY),
    /不能早于 start/,
  );
  assert.throws(() => MoonPeriods.validatePeriods([{ id: 'p', start: '2024-03-20', status: 'unknown' }], TODAY), /end/);
  assert.throws(() => MoonPeriods.validatePeriods([period('p', '2024-03-20', null, 'ended')], TODAY), /ended/);
  assert.throws(() => MoonPeriods.validatePeriods([period('p', '2024-03-20', '2024-03-21', 'ongoing')], TODAY), /end/);
  assert.throws(() => MoonPeriods.validatePeriods([period('p', '2024-03-20', null, 'mystery')], TODAY), /status/);
  assert.throws(() => MoonPeriods.validatePeriods([period('p', '2024-03-20', null, 'toString')], TODAY), /status/);
});

test('confirmed intervals cannot overlap the next start', () => {
  assert.throws(
    () => MoonPeriods.validatePeriods([
      period('p1', '2024-01-01', '2024-01-05', 'ended'),
      period('p2', '2024-01-05'),
    ], TODAY),
    /重叠/,
  );
  assert.deepEqual(
    MoonPeriods.validatePeriods([
      period('p2', '2024-01-06'),
      period('p1', '2024-01-01', '2024-01-05', 'ended'),
    ], TODAY),
    [
      period('p1', '2024-01-01', '2024-01-05', 'ended'),
      period('p2', '2024-01-06'),
    ],
  );
});

test('ongoing is unique and must be the last record by start date', () => {
  assert.deepEqual(
    MoonPeriods.validatePeriods([
      period('p1', '2024-01-01', '2024-01-03', 'ended'),
      period('p2', '2024-01-04', null, 'ongoing'),
    ], TODAY),
    [
      period('p1', '2024-01-01', '2024-01-03', 'ended'),
      period('p2', '2024-01-04', null, 'ongoing'),
    ],
  );
  assert.throws(
    () => MoonPeriods.validatePeriods([
      period('p1', '2024-01-01', null, 'ongoing'),
      period('p2', '2024-01-02'),
    ], TODAY),
    /ongoing/,
  );
  assert.throws(
    () => MoonPeriods.validatePeriods([
      period('p1', '2024-01-01', null, 'ongoing'),
      period('p2', '2024-01-02', null, 'ongoing'),
    ], TODAY),
    /ongoing/,
  );
});

test('upsert is pure, keeps IDs stable, sorts the result, and does not silently accept collisions', () => {
  const initial = [period('stable-id', '2024-02-01')];
  const snapshot = JSON.stringify(initial);
  const updated = MoonPeriods.upsertPeriod(
    initial,
    period('stable-id', '2024-02-03'),
    TODAY,
  );
  assert.equal(updated[0].id, 'stable-id');
  assert.equal(updated[0].start, '2024-02-03');
  assert.equal(JSON.stringify(initial), snapshot);

  assert.throws(
    () => MoonPeriods.upsertPeriod(
      updated,
      period('another-id', '2024-02-03'),
      TODAY,
    ),
    /start.*重复/,
  );
});

test('remove returns a clone, leaves the input untouched, and reports missing IDs', () => {
  const initial = [
    period('p1', '2024-01-01'),
    period('p2', '2024-02-01'),
  ];
  const snapshot = JSON.stringify(initial);
  const remaining = MoonPeriods.removePeriod(initial, 'p1');
  assert.deepEqual(remaining, [period('p2', '2024-02-01')]);
  assert.equal(JSON.stringify(initial), snapshot);
  assert.notEqual(remaining, initial);
  assert.notEqual(remaining[0], initial[1]);
  assert.throws(() => MoonPeriods.removePeriod(initial, 'missing'), /未找到/);
});

