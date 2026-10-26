/*
 * Moon & Me companion guide.
 *
 * This is deliberately a small, data-in/data-out layer. It describes ways a
 * partner can ask, offer, and share practical work; it does not diagnose,
 * infer mood from a label, or turn a forecast into a fact.
 */
(function attachMoonCompanion(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(typeof require === 'function' ? require('./core.js') : null);
  } else {
    root.MoonCompanion = factory(root.MoonCore || null);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function makeMoonCompanion(MoonCore) {
  'use strict';

  var DAY_MS = 24 * 60 * 60 * 1000;

  function isISODate(value) {
    if (MoonCore && typeof MoonCore.isISODate === 'function') {
      try {
        return MoonCore.isISODate(value) === true;
      } catch (error) {
        return false;
      }
    }
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    var parts = value.split('-').map(Number);
    var date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    return date.getUTCFullYear() === parts[0] &&
      date.getUTCMonth() === parts[1] - 1 &&
      date.getUTCDate() === parts[2];
  }

  function dateDiff(later, earlier) {
    if (!isISODate(later) || !isISODate(earlier)) return null;
    if (MoonCore && typeof MoonCore.diffDays === 'function') {
      try {
        return MoonCore.diffDays(later, earlier);
      } catch (error) {
        return null;
      }
    }
    var laterParts = later.split('-').map(Number);
    var earlierParts = earlier.split('-').map(Number);
    var laterUTC = Date.UTC(laterParts[0], laterParts[1] - 1, laterParts[2]);
    var earlierUTC = Date.UTC(earlierParts[0], earlierParts[1] - 1, earlierParts[2]);
    return Math.round((laterUTC - earlierUTC) / DAY_MS);
  }

  function text(value, fallback) {
    if (typeof value !== 'string') return fallback || '';
    var normalized = value.trim();
    return normalized || (fallback || '');
  }

  // Preferences are user-provided data. Keep them bounded for a guide card;
  // the caller remains responsible for HTML escaping when rendering.
  function preference(value) {
    return text(value).slice(0, 240);
  }

  function numberValue(value) {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() !== '') {
      var parsed = Number(value);
      if (Number.isFinite(parsed)) return parsed;
    }
    return null;
  }

  function consentRefused(value) {
    // `consent` is the partner's permission to keep a record, not permission
    // for every future interaction.  Only an explicit refusal value belongs
    // in this branch; an unchecked record-consent box must not become an
    // invented request for solitude.
    return value === 0 || value === 'no' || value === 'declined' ||
      value === '拒绝' || value === '不需要' || value === '不要打扰';
  }

  function supportLabel(value) {
    var labels = {
      ask: '先问她再行动',
      alone: '先给她独处空间',
      quiet: '安静陪伴',
      help: '具体帮助'
    };
    var normalized = text(value);
    return labels[normalized] || normalized;
  }

  function prefersSolitude(partner) {
    var support = preference(partner.support);
    var avoid = preference(partner.avoid);
    return /独处|一个人|不打扰|不想说话|不要联系|暂时安静/.test(support + avoid) ||
      support === 'alone';
  }

  function unique(ids) {
    return ids.filter(function (id, index) {
      return id && ids.indexOf(id) === index;
    });
  }

  function determineStage(context) {
    var info = context.info && typeof context.info === 'object' ? context.info : {};
    var date = isISODate(context.date) ? context.date : null;
    var nextStart = isISODate(info.nextStart) ? info.nextStart : null;
    var actualEnd = isISODate(info.actualEnd) ? info.actualEnd : null;
    var state = info.bleedingState;
    var actualDuring = state === 'confirmed' || state === 'ongoing';

    // Legacy cycle results did not have bleedingState. Only use that fallback
    // when the result explicitly describes an actual (not predicted) period.
    if (state === undefined && info.phase === 'period' && info.predicted !== true) {
      actualDuring = true;
    }
    if (actualDuring) {
      return { key: 'during', label: '经期 · 以实际记录为准', certainty: 'actual' };
    }

    // A reference window is a forecast or a fallback duration after an
    // unknown start. It should remain visibly estimated rather than being
    // presented as confirmed bleeding.
    if (state === 'reference' || (info.phase === 'period' && info.predicted === true)) {
      return { key: 'reference', label: '预计经期 · 参考窗口', certainty: 'predicted' };
    }

    if (date && actualEnd) {
      var afterDays = dateDiff(date, actualEnd);
      if (afterDays !== null && afterDays > 0 && afterDays <= 7) {
        return { key: 'after', label: '经期后 · 已记录结束日', certainty: 'actual' };
      }
    }

    // The core marks today's/historical cycle as actual because it must not
    // fabricate a start date. `nextStart` is still an estimate, though, so a
    // target date in the seven days before it can use the pre-period guide.
    if (date && nextStart) {
      var beforeDays = dateDiff(nextStart, date);
      if (beforeDays !== null && beforeDays >= 0 && beforeDays <= 7) {
        return { key: 'before', label: '经前 · 预计 0–7 天', certainty: 'predicted' };
      }
    }

    if (info.phase === 'late' || info.overdue === true || info.forecastBlocked === true) {
      return { key: 'delayed', label: '预计日已过 · 尚未确认', certainty: 'unknown' };
    }
    if (info.phase === 'between' || info.phase === 'period' || info.phase === 'before') {
      return { key: 'between', label: '周期中段 · 一般建议', certainty: 'general' };
    }
    return { key: 'unknown', label: '周期未知 · 先沟通', certainty: 'unknown' };
  }

  function preferenceNote(partner) {
    var support = preference(partner.support);
    var likes = preference(partner.likes);
    var avoid = preference(partner.avoid);
    var parts = [];
    if (support) parts.push('她记录的支持方式：' + supportLabel(support) + '。');
    if (likes) parts.push('她记录的可选支持：' + likes + '。');
    if (avoid) parts.push('她记录的先避开事项：' + avoid + '。');
    return parts.join('');
  }

  function consentNote(partner) {
    if (consentRefused(partner.consent) || prefersSolitude(partner)) {
      return '她已经选择先独处时，尊重这个边界：不要求回复、不连续追问；等她主动提出需要，再提供帮助。';
    }
    return '先问她现在想要什么，再决定是否行动；一次只提供一个具体选项，也允许她说“不需要”。';
  }

  function commonAvoid(partner) {
    var avoid = preference(partner.avoid);
    var detail = avoid ? '先避开她标记的“' + avoid + '”。' : '';
    return detail + '不要把沉默、拒绝或情绪直接解释成激素或性格标签，以她当下的回答为准。';
  }

  function action(title, body) {
    return { title: title, body: body };
  }

  function buildGuide(context) {
    context = context && typeof context === 'object' ? context : {};
    var partner = context.partner && typeof context.partner === 'object' ? context.partner : {};
    var nickname = preference(partner.nickname) || '对方';
    var stage = determineStage(context);
    var prefs = preferenceNote(partner);
    var consent = consentNote(partner);
    var avoid = commonAvoid(partner);
    var actions = [];
    var ask = '';
    var headline = '';
    var articleIds = [];

    if (stage.key === 'before') {
      headline = nickname + '可能接近月经，先把安排留出弹性。';
      actions.push(action('轻轻确认需要', consent + '可以问：“今天更希望我买用品、分担事情、安静陪伴，还是先不打扰？”'));
      actions.push(action('准备但不替她决定', '把她常用的用品、饮水和舒服的休息位置准备好；不默认她一定有 PMS，也不强迫她使用某种方式。' + prefs));
      actions.push(action('让计划可以调整', '把约会、家务和出行留出取消或缩短的余地；提前说清楚“临时改变也没关系”，不把变更当成失约。'));
      ask = '你想让我做哪一种：买用品、分担家务、安静陪伴，还是先不打扰？';
      articleIds = ['health-pms', 'health-first-day', 'health-sleep'];
    } else if (stage.key === 'reference') {
      headline = nickname + '可能进入预计经期，先把日历当作参考。';
      actions.push(action('先确认真实感受', consent + '“参考窗口”不等于已经确认开始；可以问她现在是否需要用品、休息或调整安排，不要求她按预测行动。'));
      actions.push(action('提供低负担选项', '把她常用的用品、饮水和舒服的休息位置准备好；她想用才提供，任何让她不舒服的方式都立即停止。' + prefs));
      actions.push(action('让计划可以调整', '把约会、家务和出行留出取消或缩短的余地；提前说清楚临时改变也没关系。')); 
      ask = '日历只是参考，你现在更希望我准备用品、分担事情、安静陪伴，还是先不打扰？';
      articleIds = ['health-pms', 'health-first-day', 'health-sleep'];
    } else if (stage.key === 'during') {
      headline = nickname + '正在经期，今天以她当下的感受为准。';
      actions.push(action('把决定权还给她', consent + '不要用“应该”替她安排休息、运动、见面或亲密接触。'));
      actions.push(action('提供低负担照护', '如果她想试，可以提供隔着衣物或毛巾的温热敷、温水淋浴、散步或轻柔活动；任何让她更不舒服的方式都立即停止。' + prefs));
      actions.push(action('主动分担一件具体的事', '直接接手买用品、准备食物、收拾或交通等一件小事，完成后告诉她，不要求她负责统筹。'));
      ask = '现在更需要用品、热敷、分担事情、安静陪伴，还是暂时不打扰？';
      articleIds = ['health-first-day', 'health-heat-bath', 'health-movement-swim'];
    } else if (stage.key === 'after') {
      headline = nickname + '刚结束经期，给身体和安排留一点恢复空间。';
      actions.push(action('把真实结束日记下来', '在她确认的前提下，按最后一天有经血的日期记录；不确定可以之后再补。'));
      actions.push(action('复盘而不是追问', consent + '可以问：“这次什么有帮助？下次有什么想改？”' + prefs));
      actions.push(action('恢复日常也留弹性', '不要因为出血结束就默认所有不适马上消失；如果疼痛、头晕或异常出血仍影响生活，陪她记录并考虑咨询专业人员。'));
      ask = '这次有什么照护让你感觉好一点？下次希望我保留、调整或取消什么？';
      articleIds = ['health-cycle-day-one', 'health-first-day', 'health-urgent-pain'];
    } else if (stage.key === 'delayed') {
      headline = '预计日期已过，先确认实际情况，不把预测当成事实。';
      actions.push(action('先问事实和需要', consent + '可以问她是否已经开始、是否只是日期推迟，以及现在希望得到哪一种支持；不逼她解释原因。'));
      actions.push(action('只在她确认后更新记录', '如果她已经开始，按真实开始日补记；如果还没有开始，保留“尚未确认”，不要为了对齐日历而虚构日期。'));
      actions.push(action('把安排留出余地', '计划可以延后或改成低负担版本；不把推迟、沉默或情绪当作态度，也不替她做健康判断。' + prefs));
      ask = '日期和预测可能不一致，你现在更希望我确认记录、帮你调整安排，还是先不打扰？';
      articleIds = ['health-cycle-day-one', 'health-irregular', 'health-anxiety-cycle'];
    } else if (stage.key === 'between') {
      headline = '平常日也可以先学会她的偏好，别等不舒服时才猜。';
      actions.push(action('现在就问一次偏好', consent + '把“需要什么”和“不要什么”记成可随时修改的约定。' + prefs));
      actions.push(action('准备可选方案', '知道她常用的用品、舒服的活动和能分担的家务即可；不把 28 天当成必须准时的承诺。'));
      actions.push(action('把照护变成日常分担', '平时就分担具体事务，到了经期不需要她在不舒服时再提出全部需求。'));
      ask = '平时你希望我记住哪些支持方式？哪些做法请我先不要做？';
      articleIds = ['health-cycle-day-one', 'health-sleep'];
    } else {
      headline = '日期不确定时，沟通比预测更重要。';
      actions.push(action('先问她现在需要什么', consent + '如果她不想回答，就给出退出空间，不追问、不要求报备。'));
      actions.push(action('提供不带假设的帮助', '可以提出买用品、分担事务、安静陪伴等具体选项；不把任何症状、情绪或周期阶段当成已经确认的事实。' + prefs));
      actions.push(action('等真实记录再调整', '她愿意记录时再补记实际开始日和结束日；预测只能辅助安排，不能替代她的记录或医疗建议。'));
      ask = '今天你希望我做一件什么小事？如果什么都不需要，也可以直接告诉我。';
      articleIds = ['health-cycle-day-one', 'health-first-day', 'health-anxiety-cycle'];
    }

    var pain = numberValue(context.pain);
    if (pain !== null && pain >= 8) {
      actions.push(action('疼痛已明显影响生活', '如果疼痛严重、比平时明显加重，或已经影响走路、工作、学习、睡眠和日常生活，不要只靠忍，陪她联系医生或当地急诊服务；本指南不提供药物剂量。'));
      articleIds.push('health-urgent-pain');
    }

    return {
      phaseLabel: stage.label,
      certainty: stage.certainty,
      headline: headline,
      actions: actions,
      ask: ask,
      avoid: avoid,
      articleIds: unique(articleIds)
    };
  }

  return { buildGuide: buildGuide };
});
