/*
 * Date-only menstrual-cycle calculations.
 *
 * The module deliberately works with ISO calendar dates instead of Date
 * instances.  Date instances carry a timezone and can therefore shift a
 * calendar day around DST boundaries; all arithmetic here is performed at
 * UTC midnight after the input has been validated.
 */
(function attachMoonCore(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.MoonCore = factory();
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function createMoonCore() {
  'use strict';

  var MIN_YEAR = 1900;
  var MAX_YEAR = 2100;
  var DAY_MS = 24 * 60 * 60 * 1000;
  var ISO_RE = /^(\d{4})-(\d{2})-(\d{2})$/;

  function parseISO(iso) {
    if (typeof iso !== 'string') return null;
    var match = ISO_RE.exec(iso);
    if (!match) return null;

    var year = Number(match[1]);
    var month = Number(match[2]);
    var day = Number(match[3]);
    if (year < MIN_YEAR || year > MAX_YEAR || month < 1 || month > 12 || day < 1) {
      return null;
    }

    var time = Date.UTC(year, month - 1, day);
    var date = new Date(time);
    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      return null;
    }
    return { year: year, month: month, day: day, time: time };
  }

  function requireISO(iso, label) {
    var parsed = parseISO(iso);
    if (!parsed) {
      throw new RangeError((label || 'date') + ' must be a valid ISO date from 1900-01-01 through 2100-12-31');
    }
    return parsed;
  }

  function isISODate(iso) {
    return parseISO(iso) !== null;
  }

  function formatUTC(time) {
    var date = new Date(time);
    var year = String(date.getUTCFullYear()).padStart(4, '0');
    var month = String(date.getUTCMonth() + 1).padStart(2, '0');
    var day = String(date.getUTCDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
  }

  function addDays(iso, amount) {
    var parsed = requireISO(iso, 'iso');
    if (!Number.isInteger(amount)) {
      throw new TypeError('amount must be an integer number of days');
    }
    var result = parsed.time + amount * DAY_MS;
    var resultISO = formatUTC(result);
    requireISO(resultISO, 'result');
    return resultISO;
  }

  // The result is a-b in calendar days.  For example, diffDays('2024-01-02',
  // '2024-01-01') is 1 and diffDays('2024-01-01', '2024-01-02') is -1.
  function diffDays(a, b) {
    var aDate = requireISO(a, 'a');
    var bDate = requireISO(b, 'b');
    return Math.trunc((aDate.time - bDate.time) / DAY_MS);
  }

  function todayISO() {
    var parts = new Intl.DateTimeFormat('en', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).formatToParts(new Date());
    var values = {};
    for (var i = 0; i < parts.length; i += 1) {
      if (parts[i].type !== 'literal') values[parts[i].type] = parts[i].value;
    }
    return values.year + '-' + values.month + '-' + values.day;
  }

  function emptyResult(phase) {
    return {
      day: null,
      phase: phase,
      predicted: false,
      cycleStart: null,
      nextStart: null,
      daysUntilNext: null,
      daysLate: 0
    };
  }

  function emptyCanonicalResult(phase) {
    var result = emptyResult(phase);
    result.periodId = null;
    result.bleedingState = 'none';
    result.actualEnd = null;
    result.overdue = false;
    result.forecastBlocked = false;
    return result;
  }

  function hasOwn(object, key) {
    return Object.prototype.hasOwnProperty.call(object, key);
  }

  function normalizeCanonicalPeriods(rawPeriods, today) {
    if (!Array.isArray(rawPeriods)) throw new TypeError('profile.periods must be an array');

    var ids = Object.create(null);
    var periods = rawPeriods.map(function (entry, index) {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
        throw new TypeError('profile.periods entry must be an object');
      }
      if (typeof entry.id !== 'string' || entry.id.trim() === '') {
        throw new TypeError('profile.periods entry id must be a non-empty string');
      }
      if (hasOwn(ids, entry.id)) {
        throw new RangeError('profile.periods ids must be unique');
      }
      ids[entry.id] = true;

      if (!hasOwn(entry, 'start')) {
        throw new RangeError('profile.periods[' + index + '].start must be a valid ISO date');
      }
      requireISO(entry.start, 'profile.periods[' + index + '].start');
      if (entry.start > today) {
        throw new RangeError('profile.periods[' + index + '].start must not be after today');
      }
      var status = entry.status;
      if (!hasOwn(entry, 'status') || typeof status !== 'string' ||
        (status !== 'unknown' && status !== 'ongoing' && status !== 'ended')) {
        throw new RangeError('profile.periods[' + index + '].status must be unknown, ongoing, or ended');
      }

      if (!hasOwn(entry, 'end')) {
        throw new RangeError('profile.periods[' + index + '].end must be a valid ISO date or null');
      }
      var end = entry.end;
      if (end !== null) requireISO(end, 'profile.periods[' + index + '].end');
      if (end !== null && end > today) {
        throw new RangeError('profile.periods[' + index + '].end must not be after today');
      }
      if (status === 'ended' && end === null) {
        throw new RangeError('ended profile.periods entries require an end date');
      }
      if (status !== 'ended' && end !== null) {
        throw new RangeError('unknown and ongoing profile.periods entries cannot have an end date');
      }
      if (end !== null && diffDays(end, entry.start) < 0) {
        throw new RangeError('profile.periods end must not precede start');
      }

      return { id: entry.id, start: entry.start, end: end, status: status };
    });

    periods.sort(function (a, b) {
      return a.start < b.start ? -1 : a.start > b.start ? 1 : 0;
    });

    var ongoingCount = 0;
    for (var index = 0; index < periods.length; index += 1) {
      var current = periods[index];
      if (current.status === 'ongoing') ongoingCount += 1;
      if (index > 0) {
        var previous = periods[index - 1];
        if (current.start === previous.start) {
          throw new RangeError('profile.periods start dates must be unique');
        }
        if (previous.end !== null && diffDays(current.start, previous.end) <= 0) {
          throw new RangeError('profile.periods entries must not overlap');
        }
      }
    }
    if (ongoingCount > 1) throw new RangeError('profile.periods may contain only one ongoing entry');
    if (ongoingCount === 1 && periods[periods.length - 1].status !== 'ongoing') {
      throw new RangeError('ongoing profile.periods entry must be the latest entry');
    }

    return periods;
  }

  function normalizeProfile(profile, today) {
    var source = profile || {};
    if (typeof source !== 'object' || Array.isArray(source)) {
      throw new TypeError('profile must be an object');
    }

    var cycleLength = source.cycleLength === undefined ? 28 : source.cycleLength;
    var periodLength = source.periodLength === undefined ? 5 : source.periodLength;
    if (!Number.isInteger(cycleLength) || cycleLength < 1 || cycleLength > 366) {
      throw new RangeError('cycleLength must be an integer from 1 through 366');
    }
    if (!Number.isInteger(periodLength) || periodLength < 1 || periodLength > cycleLength) {
      throw new RangeError('periodLength must be an integer from 1 through cycleLength');
    }

    // `periods` is a versioned, canonical source. Its mere presence is
    // authoritative, including an empty array; never merge it with starts.
    if (hasOwn(source, 'periods')) {
      return {
        periods: normalizeCanonicalPeriods(source.periods, today),
        cycleLength: cycleLength,
        periodLength: periodLength,
        canonical: true
      };
    }

    var starts = source.starts === undefined ? [] : source.starts;
    if (!Array.isArray(starts)) throw new TypeError('profile.starts must be an array');
    var normalized = starts.map(function (start) {
      requireISO(start, 'profile.starts entry');
      return start;
    });
    normalized.sort();
    normalized = normalized.filter(function (start, index) {
      return index === 0 || start !== normalized[index - 1];
    });
    return { starts: normalized, cycleLength: cycleLength, periodLength: periodLength, canonical: false };
  }

  function safeAddDays(iso, amount) {
    var candidate;
    try {
      candidate = addDays(iso, amount);
    } catch (error) {
      if (error instanceof RangeError) return null;
      throw error;
    }
    return candidate;
  }

  function withCycleState(cycleStart, target, predicted, cycleLength, periodLength) {
    var day = diffDays(target, cycleStart) + 1;
    var nextStart = safeAddDays(cycleStart, cycleLength);
    if (day > cycleLength) {
      return {
        day: day,
        phase: 'late',
        predicted: predicted,
        cycleStart: cycleStart,
        nextStart: nextStart,
        daysUntilNext: null,
        daysLate: day - cycleLength - 1
      };
    }

    return {
      day: day,
      phase: day <= periodLength ? 'period' : 'between',
      predicted: predicted,
      cycleStart: cycleStart,
      nextStart: nextStart,
      daysUntilNext: nextStart === null ? null : diffDays(nextStart, target),
      daysLate: 0
    };
  }

  function withCanonicalCycleState(cycleStart, target, predicted, cycleLength, periodLength, metadata) {
    var day = diffDays(target, cycleStart) + 1;
    var forecastBlocked = metadata && metadata.forecastBlocked === true;
    var nextStart = forecastBlocked ? null : safeAddDays(cycleStart, cycleLength);
    var isLate = day > cycleLength;
    var result = {
      day: day,
      phase: isLate ? 'late' : day <= periodLength ? 'period' : 'between',
      predicted: predicted,
      cycleStart: cycleStart,
      nextStart: nextStart,
      daysUntilNext: isLate || nextStart === null ? null : diffDays(nextStart, target),
      daysLate: isLate ? day - cycleLength - 1 : 0,
      periodId: metadata && metadata.periodId !== undefined ? metadata.periodId : null,
      bleedingState: metadata && metadata.bleedingState ? metadata.bleedingState : 'none',
      actualEnd: metadata && metadata.actualEnd !== undefined ? metadata.actualEnd : null,
      // `overdue` refers to the expected next cycle, not bleeding duration.
      overdue: day > cycleLength,
      forecastBlocked: forecastBlocked
    };
    if (metadata && metadata.phase) result.phase = metadata.phase;
    return result;
  }

  function latestPeriodAtOrBefore(periods, limit) {
    var anchor = null;
    for (var index = 0; index < periods.length; index += 1) {
      if (diffDays(periods[index].start, limit) <= 0) anchor = periods[index];
      else break;
    }
    return anchor;
  }

  function canonicalActualState(period, target, today, cycleLength, periodLength) {
    var day = diffDays(target, period.start) + 1;
    var metadata = {
      periodId: period.id,
      actualEnd: period.end,
      bleedingState: 'none',
      overdue: false
    };

    if (period.status === 'ended' && diffDays(target, period.end) <= 0) {
      metadata.bleedingState = 'confirmed';
      metadata.phase = 'period';
      return withCanonicalCycleState(period.start, target, false, cycleLength, periodLength, metadata);
    }

    if (period.status === 'ongoing' && diffDays(target, today) <= 0) {
      metadata.actualEnd = null;
      metadata.bleedingState = 'ongoing';
      metadata.phase = 'period';
      return withCanonicalCycleState(period.start, target, false, cycleLength, periodLength, metadata);
    }

    if (period.status === 'unknown' && target === period.start) {
      metadata.actualEnd = null;
      metadata.bleedingState = 'confirmed';
      metadata.phase = 'period';
      return withCanonicalCycleState(period.start, target, false, cycleLength, periodLength, metadata);
    }

    // A known end takes precedence over the reference duration: once it has
    // ended, even day 2 of a long reference window is between periods.
    if (period.status === 'ended') {
      metadata.actualEnd = period.end;
      metadata.phase = day > cycleLength ? 'late' : 'between';
      return withCanonicalCycleState(period.start, target, false, cycleLength, periodLength, metadata);
    }

    if (period.status === 'unknown' && day > 1 && day <= periodLength) {
      metadata.actualEnd = null;
      metadata.bleedingState = 'reference';
      metadata.phase = 'period';
      return withCanonicalCycleState(period.start, target, false, cycleLength, periodLength, metadata);
    }

    metadata.phase = day > cycleLength ? 'late' : 'between';
    return withCanonicalCycleState(period.start, target, false, cycleLength, periodLength, metadata);
  }

  function canonicalFutureState(period, target, today, cycleLength, periodLength) {
    var anchorIsOverlongOngoing = period.status === 'ongoing' &&
      diffDays(today, period.start) >= cycleLength;
    if (anchorIsOverlongOngoing) {
      return withCanonicalCycleState(period.start, target, true, cycleLength, periodLength, {
        periodId: period.id,
        actualEnd: null,
        bleedingState: 'none',
        overdue: true,
        phase: 'between',
        forecastBlocked: true
      });
    }

    var cycleStart = period.start;
    var periodId = period.id;
    var actualEnd = period.end;
    var candidate = safeAddDays(cycleStart, cycleLength);
    while (candidate !== null && diffDays(target, candidate) >= 0) {
      cycleStart = candidate;
      periodId = null;
      actualEnd = null;
      candidate = safeAddDays(cycleStart, cycleLength);
    }

    var day = diffDays(target, cycleStart) + 1;
    var bleedingState = day <= periodLength ? 'reference' : 'none';
    var phase = null;
    // A recorded end is authoritative even when the target itself is a
    // future date in the same real cycle. The reference window may not
    // re-open an ended period; a later virtual cycle can use the reference.
    if (periodId !== null && period.status === 'ended' && diffDays(target, period.end) > 0) {
      bleedingState = 'none';
      phase = day > cycleLength ? 'late' : 'between';
    }
    return withCanonicalCycleState(cycleStart, target, true, cycleLength, periodLength, {
      periodId: periodId,
      actualEnd: actualEnd,
      bleedingState: bleedingState,
      overdue: false,
      forecastBlocked: false,
      phase: phase
    });
  }

  function getCanonicalCycle(normalized, target, today, isFutureTarget) {
    var periods = normalized.periods;
    var cycleLength = normalized.cycleLength;
    var periodLength = normalized.periodLength;
    if (periods.length === 0) return emptyCanonicalResult('unknown');

    var first = periods[0];
    if (diffDays(target, first.start) < 0) {
      var beforeResult = emptyCanonicalResult('before');
      beforeResult.nextStart = first.start;
      beforeResult.daysUntilNext = diffDays(first.start, target);
      return beforeResult;
    }

    var anchor = latestPeriodAtOrBefore(periods, isFutureTarget ? today : target);
    if (anchor === null) return emptyCanonicalResult('before');

    if (isFutureTarget) {
      return canonicalFutureState(anchor, target, today, cycleLength, periodLength);
    }
    return canonicalActualState(anchor, target, today, cycleLength, periodLength);
  }

  function getCycle(profile, targetISO, todayISOValue) {
    requireISO(targetISO, 'targetISO');
    var target = targetISO;
    var today = todayISOValue === undefined ? todayISO() : todayISOValue;
    requireISO(today, 'todayISO');

    var normalized = normalizeProfile(profile, today);
    var isFutureTarget = diffDays(target, today) > 0;
    if (normalized.canonical) {
      return getCanonicalCycle(normalized, target, today, isFutureTarget);
    }

    var starts = normalized.starts;
    var cycleLength = normalized.cycleLength;
    var periodLength = normalized.periodLength;
    if (starts.length === 0) return emptyResult('unknown');

    var first = starts[0];
    if (diffDays(target, first) < 0) {
      var beforeResult = emptyResult('before');
      beforeResult.nextStart = first;
      beforeResult.daysUntilNext = diffDays(first, target);
      return beforeResult;
    }

    var anchorLimit = isFutureTarget ? today : target;
    var anchor = null;
    for (var index = 0; index < starts.length; index += 1) {
      if (diffDays(starts[index], anchorLimit) <= 0) anchor = starts[index];
      else break;
    }
    if (anchor === null) return emptyResult('before');

    // For a future target, only forecast from the latest real record.  This is
    // intentionally separate from historical/today views, which never invent
    // an unrecorded start and instead expose a late cycle.
    if (isFutureTarget) {
      // Every future day is a forecast, even before the next expected start.
      var predicted = true;
      var candidate = safeAddDays(anchor, cycleLength);
      while (candidate !== null && diffDays(target, candidate) >= 0) {
        anchor = candidate;
        predicted = true;
        candidate = safeAddDays(anchor, cycleLength);
      }
      return withCycleState(anchor, target, predicted, cycleLength, periodLength);
    }

    return withCycleState(anchor, target, false, cycleLength, periodLength);
  }

  return {
    todayISO: todayISO,
    isISODate: isISODate,
    addDays: addDays,
    diffDays: diffDays,
    getCycle: getCycle
  };
});
