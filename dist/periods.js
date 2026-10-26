/*
 * Actual menstrual-period records.
 *
 * This module deliberately keeps date-only records separate from the
 * prediction model in core.js.  A record can be an unconfirmed start, an
 * ongoing period, or a period with an explicitly confirmed end.  It never
 * infers an end date from the user's usual period length.
 */
(function attachMoonPeriods(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./core.js'));
  } else {
    root.MoonPeriods = factory(root.MoonCore);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function createMoonPeriods(Core) {
  'use strict';

  if (!Core || typeof Core.isISODate !== 'function' || typeof Core.diffDays !== 'function') {
    throw new Error('MoonPeriods 需要先加载 MoonCore');
  }

  var hasOwn = Object.prototype.hasOwnProperty;
  var STATUSES = { unknown: true, ongoing: true, ended: true };

  function throwType(message) {
    throw new TypeError(message);
  }

  function throwRange(message) {
    throw new RangeError(message);
  }

  function resolveToday(today) {
    var value = today;
    if (value === undefined) {
      if (typeof Core.todayISO !== 'function') throwType('today 必须是有效的 ISO 日期');
      value = Core.todayISO();
    }
    if (!Core.isISODate(value)) throwRange('today 必须是有效的 ISO 日期');
    return value;
  }

  function assertArray(periods, label) {
    if (!Array.isArray(periods)) throwType((label || 'periods') + ' 必须是数组');
  }

  function assertRequiredPeriodFields(period, index) {
    var prefix = index === undefined ? 'period' : 'periods[' + index + ']';
    if (!period || typeof period !== 'object' || Array.isArray(period)) {
      throwType(prefix + ' 必须是对象');
    }
    if (!hasOwn.call(period, 'id') || typeof period.id !== 'string' || period.id.trim() === '') {
      throwType(prefix + '.id 必须是非空字符串');
    }
    if (!hasOwn.call(period, 'start') || !Core.isISODate(period.start)) {
      throwRange(prefix + '.start 必须是有效的 ISO 日期');
    }
    if (!hasOwn.call(period, 'end') || (period.end !== null && !Core.isISODate(period.end))) {
      throwRange(prefix + '.end 必须是有效的 ISO 日期或 null');
    }
    if (
      !hasOwn.call(period, 'status') ||
      typeof period.status !== 'string' ||
      !hasOwn.call(STATUSES, period.status)
    ) {
      throwType(prefix + '.status 必须是 unknown、ongoing 或 ended');
    }
    return prefix;
  }

  function assertPeriod(period, today, index) {
    var prefix = assertRequiredPeriodFields(period, index);

    if (today !== null && period.start > today) {
      throwRange(prefix + '.start 不能晚于 today');
    }
    if (period.end !== null) {
      if (today !== null && period.end > today) {
        throwRange(prefix + '.end 不能晚于 today');
      }
      if (Core.diffDays(period.end, period.start) < 0) {
        throwRange(prefix + '.end 不能早于 start');
      }
    }

    if (period.status === 'ended' && period.end === null) {
      throwType(prefix + ' 为 ended 时必须有 end');
    }
    if (period.status !== 'ended' && period.end !== null) {
      throwType(prefix + ' 为 unknown 或 ongoing 时 end 必须为 null');
    }
  }

  function clonePeriod(period) {
    return {
      id: period.id,
      start: period.start,
      end: period.end,
      status: period.status
    };
  }

  // A null today means that the caller asked for structural validation only.
  // removePeriod uses this mode because its public API intentionally has no
  // today argument; all date-shape and ordering invariants still apply.
  function canonicalize(periods, today) {
    assertArray(periods, 'periods');

    var seenIds = Object.create(null);
    var seenStarts = Object.create(null);
    var records = periods.map(function (period, index) {
      assertPeriod(period, today, index);
      if (hasOwn.call(seenIds, period.id)) throwType('period.id 不能重复: ' + period.id);
      if (hasOwn.call(seenStarts, period.start)) {
        throwType('period.start 不能重复: ' + period.start);
      }
      seenIds[period.id] = true;
      seenStarts[period.start] = true;
      return clonePeriod(period);
    });

    records.sort(function (left, right) {
      return left.start < right.start ? -1 : left.start > right.start ? 1 : 0;
    });

    var ongoingIndex = -1;
    for (var index = 0; index < records.length; index += 1) {
      if (records[index].status === 'ongoing') {
        if (ongoingIndex !== -1) throwType('ongoing 只能有一条');
        ongoingIndex = index;
      }

      if (
        index > 0 &&
        records[index - 1].status === 'ended' &&
        records[index].start <= records[index - 1].end
      ) {
        throwRange('已确认的经期区间与下一条开始日期重叠');
      }
    }

    if (ongoingIndex !== -1 && ongoingIndex !== records.length - 1) {
      throwType('ongoing 必须是按开始日期排序后的最后一条');
    }

    return records;
  }

  function validatePeriods(periods, today) {
    return canonicalize(periods, resolveToday(today));
  }

  function migratePeriods(profile, today) {
    if (!profile || typeof profile !== 'object' || Array.isArray(profile)) {
      throwType('profile 必须是对象');
    }
    var resolvedToday = resolveToday(today);

    // The presence of periods is authoritative, including an explicitly
    // empty array.  This prevents a user-cleared new field from being
    // repopulated by stale starts data.
    if (hasOwn.call(profile, 'periods')) {
      if (!Array.isArray(profile.periods)) throwType('profile.periods 必须是数组');
      return canonicalize(profile.periods, resolvedToday);
    }

    var starts = profile.starts === undefined ? [] : profile.starts;
    if (!Array.isArray(starts)) throwType('profile.starts 必须是数组');
    var seenLegacyStarts = Object.create(null);
    var migrated = [];
    starts.forEach(function (start, index) {
      if (!Core.isISODate(start)) {
        throwRange('profile.starts[' + index + '] 必须是有效的 ISO 日期');
      }
      // The old loader de-duplicated starts before using them.  Preserve that
      // compatibility while keeping the new periods[] schema strict.
      if (seenLegacyStarts[start]) return;
      seenLegacyStarts[start] = true;
      migrated.push({
        id: 'legacy-' + start,
        start: start,
        end: null,
        status: 'unknown'
      });
    });
    return canonicalize(migrated, resolvedToday);
  }

  function upsertPeriod(periods, candidate, today) {
    var resolvedToday = resolveToday(today);
    var current = canonicalize(periods, resolvedToday);
    // Validate the candidate before looking up its id so malformed new data
    // can never be silently discarded by an update.
    assertPeriod(candidate, resolvedToday);

    var next = current.map(function (period) {
      return clonePeriod(period);
    });
    var found = false;
    for (var index = 0; index < next.length; index += 1) {
      if (next[index].id === candidate.id) {
        next[index] = clonePeriod(candidate);
        found = true;
        break;
      }
    }
    if (!found) next.push(clonePeriod(candidate));
    return canonicalize(next, resolvedToday);
  }

  function removePeriod(periods, id) {
    if (typeof id !== 'string' || id.trim() === '') throwType('id 必须是非空字符串');
    var current = canonicalize(periods, null);
    var found = false;
    var next = current.filter(function (period) {
      if (period.id === id) {
        found = true;
        return false;
      }
      return true;
    });
    if (!found) throwRange('未找到经期记录: ' + id);
    return next.map(clonePeriod);
  }

  function actualDuration(period, today) {
    var resolvedToday = resolveToday(today);
    assertPeriod(period, resolvedToday);
    if (period.status === 'unknown') return null;
    if (period.status === 'ongoing') return Core.diffDays(resolvedToday, period.start) + 1;
    return Core.diffDays(period.end, period.start) + 1;
  }

  return {
    migratePeriods: migratePeriods,
    validatePeriods: validatePeriods,
    upsertPeriod: upsertPeriod,
    removePeriod: removePeriod,
    actualDuration: actualDuration
  };
});
