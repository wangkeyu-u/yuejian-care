const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const MoonCore = require('../public/core.js');

const profile = (starts = ['2024-01-01'], cycleLength = 28, periodLength = 5) => ({
  starts,
  cycleLength,
  periodLength,
});

test('exports the required date API and validates strict Gregorian ISO dates', () => {
  assert.equal(typeof MoonCore.todayISO, 'function');
  assert.equal(typeof MoonCore.isISODate, 'function');
  assert.equal(typeof MoonCore.addDays, 'function');
  assert.equal(typeof MoonCore.diffDays, 'function');
  assert.equal(typeof MoonCore.getCycle, 'function');
  assert.equal(MoonCore.isISODate('2024-02-29'), true);
  assert.equal(MoonCore.isISODate('2100-02-29'), false);
  assert.equal(MoonCore.isISODate('2023-02-29'), false);
  assert.equal(MoonCore.isISODate('2024-2-01'), false);
  assert.equal(MoonCore.isISODate(' 2024-02-01'), false);
  assert.equal(MoonCore.isISODate('1899-12-31'), false);
  assert.equal(MoonCore.isISODate('2101-01-01'), false);
  assert.match(MoonCore.todayISO(), /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(MoonCore.isISODate(MoonCore.todayISO()), true);
});

test('date arithmetic is date-only across leap days and year boundaries', () => {
  assert.equal(MoonCore.addDays('2024-02-28', 1), '2024-02-29');
  assert.equal(MoonCore.addDays('2024-02-29', 1), '2024-03-01');
  assert.equal(MoonCore.addDays('2023-12-31', 1), '2024-01-01');
  assert.equal(MoonCore.addDays('2024-01-01', -1), '2023-12-31');
  assert.equal(MoonCore.diffDays('2024-03-01', '2024-02-28'), 2);
  assert.equal(MoonCore.diffDays('2024-02-28', '2024-03-01'), -2);
  assert.throws(() => MoonCore.addDays('2100-12-31', 1), RangeError);
  assert.throws(() => MoonCore.diffDays('2024-02-30', '2024-03-01'), RangeError);
});

test('browser UMD build exposes MoonCore global', () => {
  const source = require('node:fs').readFileSync(require.resolve('../public/core.js'), 'utf8');
  const context = {};
  vm.runInNewContext(source, context);
  assert.equal(typeof context.MoonCore.getCycle, 'function');
  assert.equal(context.MoonCore.addDays('2024-01-01', 1), '2024-01-02');
});

test('no recorded starts is unknown and a target before the first start is before', () => {
  assert.deepEqual(MoonCore.getCycle(profile([]), '2024-01-10', '2024-01-10'), {
    day: null,
    phase: 'unknown',
    predicted: false,
    cycleStart: null,
    nextStart: null,
    daysUntilNext: null,
    daysLate: 0,
  });
  const before = MoonCore.getCycle(profile(['2024-01-10']), '2024-01-09', '2024-01-10');
  assert.equal(before.phase, 'before');
  assert.equal(before.day, null);
  assert.equal(before.nextStart, '2024-01-10');
  assert.equal(before.daysUntilNext, 1);
});

test('period length is independent from a 28-day cycle length', () => {
  const day1 = MoonCore.getCycle(profile(), '2024-01-01', '2024-01-15');
  const day5 = MoonCore.getCycle(profile(), '2024-01-05', '2024-01-15');
  const day6 = MoonCore.getCycle(profile(), '2024-01-06', '2024-01-15');
  const day28 = MoonCore.getCycle(profile(), '2024-01-28', '2024-01-28');
  assert.deepEqual(day1, {
    day: 1, phase: 'period', predicted: false, cycleStart: '2024-01-01',
    nextStart: '2024-01-29', daysUntilNext: 28, daysLate: 0,
  });
  assert.equal(day5.phase, 'period');
  assert.equal(day6.phase, 'between');
  assert.equal(day28.day, 28);
  assert.equal(day28.phase, 'between');
  assert.equal(day28.nextStart, '2024-01-29');
});

test('today at the due date is late without rolling to a fake cycle', () => {
  const due = MoonCore.getCycle(profile(), '2024-01-29', '2024-01-29');
  const overdue = MoonCore.getCycle(profile(), '2024-01-30', '2024-01-30');
  assert.equal(due.phase, 'late');
  assert.equal(due.day, 29);
  assert.equal(due.daysLate, 0);
  assert.equal(due.cycleStart, '2024-01-01');
  assert.equal(due.nextStart, '2024-01-29');
  assert.equal(overdue.phase, 'late');
  assert.equal(overdue.day, 30);
  assert.equal(overdue.daysLate, 1);
  assert.equal(overdue.cycleStart, '2024-01-01');
});

test('a clearly overdue historical target does not use modulo arithmetic', () => {
  const result = MoonCore.getCycle(profile(), '2024-03-01', '2024-03-01');
  assert.equal(result.phase, 'late');
  assert.equal(result.day, 61);
  assert.equal(result.daysLate, 32);
  assert.equal(result.cycleStart, '2024-01-01');
  assert.equal(result.predicted, false);
});

test('multiple actual starts use the latest actual start on or before the target', () => {
  const result = MoonCore.getCycle(profile(['2024-01-01', '2024-01-30']), '2024-02-01', '2024-02-01');
  assert.equal(result.cycleStart, '2024-01-30');
  assert.equal(result.day, 3);
  assert.equal(result.phase, 'period');
  assert.equal(result.predicted, false);
  assert.equal(result.nextStart, '2024-02-27');
});

test('future targets may roll forward from the latest real start and mark predicted cycles', () => {
  const withinCurrent = MoonCore.getCycle(profile(), '2024-01-20', '2024-01-15');
  assert.equal(withinCurrent.day, 20);
  assert.equal(withinCurrent.predicted, true);

  const predictedStart = MoonCore.getCycle(profile(), '2024-01-29', '2024-01-15');
  assert.equal(predictedStart.day, 1);
  assert.equal(predictedStart.phase, 'period');
  assert.equal(predictedStart.predicted, true);
  assert.equal(predictedStart.cycleStart, '2024-01-29');
  assert.equal(predictedStart.nextStart, '2024-02-26');

  const secondPredictedCycle = MoonCore.getCycle(profile(), '2024-03-01', '2024-01-15');
  assert.equal(secondPredictedCycle.predicted, true);
  assert.equal(secondPredictedCycle.cycleStart, '2024-02-26');
  assert.equal(secondPredictedCycle.day, 5);
  assert.equal(secondPredictedCycle.phase, 'period');
});

test('future forecast can recover after an overdue today without mutating historical status', () => {
  const overdueToday = MoonCore.getCycle(profile(), '2024-02-01', '2024-02-01');
  const future = MoonCore.getCycle(profile(), '2024-02-02', '2024-02-01');
  assert.equal(overdueToday.phase, 'late');
  assert.equal(overdueToday.predicted, false);
  assert.equal(future.cycleStart, '2024-01-29');
  assert.equal(future.predicted, true);
  assert.equal(future.day, 5);
});

test('invalid dates and malformed profiles are rejected instead of silently normalized', () => {
  assert.throws(() => MoonCore.getCycle(profile(['2024-02-30']), '2024-03-01', '2024-03-01'), RangeError);
  assert.throws(() => MoonCore.getCycle(profile(), '2024-02-30', '2024-03-01'), RangeError);
  assert.throws(() => MoonCore.getCycle(profile(), '2024-03-01', '2024-02-30'), RangeError);
  assert.throws(() => MoonCore.getCycle(profile(['2024-01-01'], 28, 29), '2024-01-01', '2024-01-01'), RangeError);
});

const canonicalProfile = (periods, cycleLength = 28, periodLength = 5) => ({
  periods,
  cycleLength,
  periodLength,
});

test('canonical periods are authoritative, including an explicit empty array', () => {
  const result = MoonCore.getCycle({
    starts: ['2024-01-01'],
    periods: [],
  }, '2024-01-10', '2024-01-10');
  assert.deepEqual(result, {
    day: null,
    phase: 'unknown',
    predicted: false,
    cycleStart: null,
    nextStart: null,
    daysUntilNext: null,
    daysLate: 0,
    periodId: null,
    bleedingState: 'none',
    actualEnd: null,
    overdue: false,
    forecastBlocked: false,
  });
});

test('editing a canonical start re-anchors day and nextStart while editing end only changes bleeding range', () => {
  const original = canonicalProfile([{ id: 'p1', start: '2024-01-01', end: '2024-01-05', status: 'ended' }]);
  const moved = canonicalProfile([{ id: 'p1', start: '2024-01-03', end: '2024-01-07', status: 'ended' }]);
  const first = MoonCore.getCycle(original, '2024-01-10', '2024-01-10');
  const movedResult = MoonCore.getCycle(moved, '2024-01-10', '2024-01-10');
  assert.equal(first.day, 10);
  assert.equal(first.nextStart, '2024-01-29');
  assert.equal(movedResult.day, 8);
  assert.equal(movedResult.nextStart, '2024-01-31');

  const short = MoonCore.getCycle(canonicalProfile([{ id: 'p1', start: '2024-01-01', end: '2024-01-03', status: 'ended' }]), '2024-01-04', '2024-01-10');
  const extended = MoonCore.getCycle(canonicalProfile([{ id: 'p1', start: '2024-01-01', end: '2024-01-07', status: 'ended' }]), '2024-01-06', '2024-01-10');
  assert.equal(short.phase, 'between');
  assert.equal(short.bleedingState, 'none');
  assert.equal(short.actualEnd, '2024-01-03');
  assert.equal(short.nextStart, '2024-01-29');
  assert.equal(extended.phase, 'period');
  assert.equal(extended.bleedingState, 'confirmed');
  assert.equal(extended.overdue, false);
  assert.equal(extended.nextStart, '2024-01-29');
  assert.equal(MoonCore.getCycle(canonicalProfile([{ id: 'p1', start: '2024-01-01', end: '2024-01-07', status: 'ended' }]), '2024-01-08', '2024-01-10').phase, 'between');
  const endedLate = MoonCore.getCycle(canonicalProfile([{ id: 'p1', start: '2024-01-01', end: '2024-01-07', status: 'ended' }]), '2024-01-30', '2024-01-30');
  assert.equal(endedLate.phase, 'late');
  assert.equal(endedLate.overdue, true);
});

test('unknown records distinguish a confirmed start from reference bleeding and cap at the next real start', () => {
  const periods = [
    { id: 'u1', start: '2024-01-01', end: null, status: 'unknown' },
    { id: 'p2', start: '2024-01-04', end: '2024-01-06', status: 'ended' },
  ];
  const day1 = MoonCore.getCycle(canonicalProfile(periods), '2024-01-01', '2024-01-10');
  const reference = MoonCore.getCycle(canonicalProfile(periods), '2024-01-02', '2024-01-10');
  const nextStart = MoonCore.getCycle(canonicalProfile(periods), '2024-01-04', '2024-01-10');
  assert.equal(day1.bleedingState, 'confirmed');
  assert.equal(day1.periodId, 'u1');
  assert.equal(reference.phase, 'period');
  assert.equal(reference.bleedingState, 'reference');
  assert.equal(reference.periodId, 'u1');
  assert.equal(nextStart.periodId, 'p2');
  assert.equal(nextStart.bleedingState, 'confirmed');
});

test('canonical periods are sorted by start and choose the latest real record', () => {
  const result = MoonCore.getCycle(canonicalProfile([
    { id: 'later', start: '2024-01-30', end: '2024-02-01', status: 'ended' },
    { id: 'earlier', start: '2024-01-01', end: '2024-01-05', status: 'ended' },
  ]), '2024-02-01', '2024-02-01');
  assert.equal(result.periodId, 'later');
  assert.equal(result.cycleStart, '2024-01-30');
  assert.equal(result.day, 3);
  assert.equal(result.nextStart, '2024-02-27');
});

test('ongoing records are actual only through today, and block future cycles only once the cycle is due', () => {
  const ongoing = canonicalProfile([{ id: 'o1', start: '2024-01-01', end: null, status: 'ongoing' }]);
  const current = MoonCore.getCycle(ongoing, '2024-01-05', '2024-01-05');
  const futureReference = MoonCore.getCycle(ongoing, '2024-01-04', '2024-01-03');
  const notBlocked = MoonCore.getCycle(ongoing, '2024-01-07', '2024-01-06');
  assert.equal(current.bleedingState, 'ongoing');
  assert.equal(current.predicted, false);
  const ongoingAtDueDate = MoonCore.getCycle(ongoing, '2024-01-29', '2024-01-29');
  assert.equal(ongoingAtDueDate.phase, 'period');
  assert.equal(ongoingAtDueDate.overdue, true);
  assert.equal(futureReference.predicted, true);
  assert.equal(futureReference.bleedingState, 'reference');
  assert.equal(futureReference.periodId, 'o1');
  assert.equal(futureReference.forecastBlocked, false);
  assert.equal(notBlocked.forecastBlocked, false);

  const blocked = MoonCore.getCycle(ongoing, '2024-01-30', '2024-01-29');
  assert.equal(blocked.day, 30);
  assert.equal(blocked.phase, 'between');
  assert.equal(blocked.predicted, true);
  assert.equal(blocked.nextStart, null);
  assert.equal(blocked.daysUntilNext, null);
  assert.equal(blocked.daysLate, 1);
  assert.equal(blocked.bleedingState, 'none');
  assert.equal(blocked.forecastBlocked, true);
});

test('future virtual cycles never claim a real period id, and a known end stays closed', () => {
  const ended = canonicalProfile([{ id: 'p1', start: '2024-01-01', end: '2024-01-03', status: 'ended' }]);
  const afterEnd = MoonCore.getCycle(ended, '2024-01-06', '2024-01-05');
  const virtual = MoonCore.getCycle(ended, '2024-01-29', '2024-01-05');
  assert.equal(afterEnd.predicted, true);
  assert.equal(afterEnd.phase, 'between');
  assert.equal(afterEnd.bleedingState, 'none');
  assert.equal(afterEnd.periodId, 'p1');
  assert.equal(afterEnd.actualEnd, '2024-01-03');
  assert.equal(virtual.predicted, true);
  assert.equal(virtual.periodId, null);
  assert.equal(virtual.actualEnd, null);
  assert.equal(virtual.bleedingState, 'reference');
  assert.equal(virtual.forecastBlocked, false);
});

test('canonical records reject obvious shape and interval errors', () => {
  assert.throws(() => MoonCore.getCycle({ periods: 'not-an-array' }, '2024-01-01', '2024-01-01'), TypeError);
  assert.throws(() => MoonCore.getCycle(canonicalProfile([{ id: 'p1', start: '2024-02-30', end: null, status: 'unknown' }]), '2024-01-01', '2024-01-01'), RangeError);
  assert.throws(() => MoonCore.getCycle(canonicalProfile([{ id: 'p1', start: '2024-01-02', end: '2024-01-01', status: 'ended' }]), '2024-01-01', '2024-01-01'), RangeError);
  assert.throws(() => MoonCore.getCycle(canonicalProfile([
    { id: 'p1', start: '2024-01-01', end: null, status: 'ongoing' },
    { id: 'p2', start: '2024-01-10', end: '2024-01-12', status: 'ended' },
  ]), '2024-01-01', '2024-01-01'), RangeError);
});
