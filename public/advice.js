/*
 * A deterministic synthesis of the audited knowledge library.
 * The module returns plain data. The renderer must escape user-provided text.
 * It does not diagnose, infer personality, prescribe, or modify cycle records.
 */
(function attachMoonAdvice(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./core.js'), require('./companion.js'), [
      ...require('./health-data.js'), ...require('./tcm-data.js'), ...require('./culture-data.js')
    ]);
  } else {
    root.MoonAdvice = factory(root.MoonCore, root.MoonCompanion, [
      ...(root.MoonHealthArticles || []), ...(root.MoonTCMArticles || []), ...(root.MoonCultureArticles || [])
    ]);
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function makeMoonAdvice(Core, Companion, articles) {
  'use strict';

  const unique = values => [...new Set(values)];
  const knownIds = new Set(articles.map(article => article.id));
  const SUPPORTED_TOPICS = ['tcm', 'herbal', 'acupuncture', 'moxibustion', 'movement', 'products'];
  const RULES = [
    { id: 'phase-unknown', when: '没有实际周期记录；先记录本人确认的日期，不猜月经或症状', articleIds: ['health-cycle-day-one', 'health-bleeding-days', 'health-cycle-four-phases', 'health-phase-signals'] },
    { id: 'phase-before', when: '日期距预计下次开始日0–7天；只安排有弹性的准备', articleIds: ['health-pms', 'health-first-day', 'health-products'] },
    { id: 'phase-during', when: '实际出血或尚未结束；以当前疼痛和精力调整安排', articleIds: ['health-first-day', 'health-cramps', 'health-heat-bath', 'health-bleeding-days'] },
    { id: 'phase-reference', when: '仅有参考出血窗口或结束日未知；不把窗口当实际出血', articleIds: ['health-cycle-day-one', 'health-first-day', 'health-products'] },
    { id: 'phase-after', when: '实际结束日后的7天；回看有帮助的安排，不自动补药', articleIds: ['health-cycle-day-one', 'health-bleeding-days'] },
    { id: 'phase-delayed', when: '预计日期已过、尚未确认新开始日；记录真实变化并保留不确定', articleIds: ['health-irregular', 'health-contraception'] },
    { id: 'phase-between', when: '其他普通日期；分担日常事务，不由阶段猜精力', articleIds: ['health-cycle-day-one', 'health-first-day'] },
    { id: 'medical-pain', when: '非未来日期且实际疼痛评分至少8/10；医疗求助优先', articleIds: ['health-urgent-pain', 'health-cramps', 'health-help-now'] },
    { id: 'medical-heavy-flow', when: '非未来日期且本人勾选出血明显偏多；记录用品更换与生活影响并评估', articleIds: ['health-heavy-flow', 'health-help-now'] },
    { id: 'medical-unexpected-flow', when: '非未来日期且本人勾选经期外或异常出血；记录并与医生讨论', articleIds: ['health-abnormal-bleeding', 'health-irregular', 'health-help-now'] },
    { id: 'medical-prolonged-bleeding', when: '非未来日期且明确标记尚未结束并持续到第8天或以后；不从未知结束或已结束记录推断持续出血', articleIds: ['health-bleeding-days', 'health-heavy-flow'] },
    { id: 'adjust-low-energy', when: '非未来日期且精力低或疼痛至少5/10；缩短安排与分担事务', articleIds: ['health-first-day', 'health-movement-swim'] },
    { id: 'adjust-poor-sleep', when: '非未来日期且睡眠差；减轻当日安排并简化睡前流程', articleIds: ['health-sleep', 'health-caffeine'] },
    { id: 'adjust-tension', when: '非未来日期且紧绷或很难受；减少沟通负担并记录影响，必要时专业支持', articleIds: ['health-anxiety-cycle', 'health-pms', 'health-pmdd'] },
    { id: 'support-choice', when: '始终以明确支持选项决定沟通方式；自由文本不作为偏好推断', basis: 'editorial', articleIds: [] },
    { id: 'topic-movement', when: '选择了解活动；舒适时轻活动，不舒服则缩短或休息', articleIds: ['health-movement-swim', 'health-first-day'] },
    { id: 'topic-products', when: '选择了解用品；按熟悉与舒适程度选择，遵守清洁与包装说明', articleIds: ['health-products', 'health-tampon-cup', 'health-vulva-cleaning'] },
    { id: 'avoid-calendar-assumptions', when: '始终说明日期不能替代意愿或避孕保护', articleIds: ['health-contraception', 'health-cycle-day-one'] },
    { id: 'avoid-unsupervised-medication', when: '实际疼痛或选择了解草药；不自行加量、混用或套用他人药方', articleIds: ['health-medication', 'tcm-herbal-safety', 'tcm-food-herb-interactions'] },
    { id: 'tcm-default-meal', when: '默认中医调护综合；普通进食按实际耐受，服药忌口先问，不自动药膳', articleIds: ['health-cold-drinks', 'tcm-diet-conditions', 'tcm-food-herb-interactions'] },
    { id: 'topic-tcm', when: '选择了解中医；整理真实经过并询问辨证依据、风险及替代方案', articleIds: ['tcm-pain-language', 'tcm-visit-preparation'] },
    { id: 'topic-herbal', when: '选择了解中药或药膳；核对成分、现用药清单与相互作用，不视为已在治疗', articleIds: ['tcm-herbal-safety', 'tcm-food-herb-interactions', 'health-medication'] },
    { id: 'topic-acupuncture', when: '选择了解针灸；说明历史综述范围及安全、资质和复评问题', articleIds: ['tcm-acupuncture-evidence', 'tcm-acupuncture-safety'] },
    { id: 'topic-moxibustion', when: '选择了解艾灸；先了解烫伤风险与专业评估，不给自行操作参数', articleIds: ['tcm-moxibustion-risk'] },
    { id: 'culture-calendar-year', when: '开启文化、非安静模式、无优先医疗信号；每日文化主题0', articleIds: ['culture-birth-snake', 'culture-spring-festival-lichun', 'culture-branches-zodiac'] },
    { id: 'culture-day-symbol', when: '开启文化、非安静模式、无优先医疗信号；每日文化主题1', articleIds: ['culture-stem-branch', 'culture-ten-stems-elements', 'culture-day-stem-not-bazi'] },
    { id: 'culture-chart-boundary', when: '开启文化、非安静模式、无优先医疗信号；每日文化主题2', articleIds: ['culture-unknown-birth-hour', 'culture-day-pillar-boundary', 'culture-why-sixty-cycle'] },
    { id: 'culture-aesthetic', when: '开启文化、非安静模式、无优先医疗信号；每日文化主题3', articleIds: ['culture-colors-accessories', 'culture-yi-ji-as-ritual', 'culture-generating-overcoming-cycles'] },
    { id: 'culture-record-first', when: '开启文化、非安静模式、无优先医疗信号；每日文化主题4', articleIds: ['culture-calendar-systems', 'culture-cycle-is-personal', 'culture-record-before-interpret'] },
    { id: 'culture-no-taboo', when: '开启文化、非安静模式、无优先医疗信号；每日文化主题5', articleIds: ['culture-sheng-ke-terms', 'culture-zodiac-no-taboo', 'culture-emotion-not-deficiency'] }
  ];
  const ruleById = new Map(RULES.map(rule => [rule.id, rule]));

  function text(value, limit = 240) { return typeof value === 'string' ? value.trim().slice(0, limit) : ''; }
  function isDate(value) { return !!Core && Core.isISODate(value); }
  function score(value) {
    if (value === '' || value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 && parsed <= 10 ? parsed : null;
  }
  function card(id, title, body, reason, ruleIds, kind = 'health', urgency) {
    const articleIds = unique(ruleIds.flatMap(ruleId => ruleById.get(ruleId)?.articleIds || []));
    // Fail explicitly if a deployment forgot a knowledge script, rather than
    // return convincing-looking references to absent or invented articles.
    if (articleIds.some(articleId => !knownIds.has(articleId))) throw new Error('MoonAdvice 需要先加载完整的已核对知识库');
    const result = { id, title, body, reason, articleIds, kind };
    if (urgency) result.urgency = urgency;
    return result;
  }
  function normalizedSupport(value) {
    const label = text(value, 60);
    if (['alone', '独处', '先独处', '给她独处的空间', '独处，不打扰', '先给她独处空间', '不要打扰', '不需要陪伴'].includes(label)) return 'alone';
    if (['quiet', '安静陪伴'].includes(label)) return 'quiet';
    if (['help', '具体帮助', '提供具体帮助'].includes(label)) return 'help';
    return 'ask';
  }
  function normalize(context) {
    const raw = context && typeof context === 'object' ? context : {};
    const date = isDate(raw.date) ? raw.date : isDate(raw.today) ? raw.today : null;
    const today = isDate(raw.today) ? raw.today : date;
    const future = !!date && !!today && date > today;
    const info = raw.info && typeof raw.info === 'object' ? { ...raw.info } : {};
    if (future) {
      info.predicted = true;
      if (info.bleedingState === 'confirmed' || info.bleedingState === 'ongoing') info.bleedingState = 'reference';
    }
    const partner = raw.partner && typeof raw.partner === 'object' ? raw.partner : {};
    return {
      date, today, info, future,
      partner: {
        nickname: partner.consent === true ? text(partner.nickname, 40) : '',
        support: normalizedSupport(partner.support),
        likes: partner.consent === true ? text(partner.likes) : '',
        avoid: partner.consent === true ? text(partner.avoid) : ''
      },
      pain: future ? null : score(raw.pain),
      mood: !future && ['平静', '紧绷', '很难受'].includes(raw.mood) ? raw.mood : '',
      energy: !future && ['low', 'medium', 'high'].includes(raw.energy) ? raw.energy : '',
      sleep: !future && ['poor', 'okay'].includes(raw.sleep) ? raw.sleep : '',
      flow: !future && ['usual', 'heavy', 'unexpected'].includes(raw.flow) ? raw.flow : '',
      topics: unique((Array.isArray(raw.topics) ? raw.topics : []).filter(topic => SUPPORTED_TOPICS.includes(topic))),
      activities: Array.isArray(raw.activities) ? raw.activities.slice() : [],
      culture: raw.culture === true, quiet: raw.quiet === true,
      cultureInfo: raw.cultureInfo && typeof raw.cultureInfo === 'object' ? { ...raw.cultureInfo } : {}
    };
  }
  function stageOf(context) {
    if (!Companion || typeof Companion.determineStage !== 'function') throw new Error('MoonAdvice 需要 MoonCompanion.determineStage');
    return Companion.determineStage({ date: context.date, today: context.today, info: context.info });
  }
  function medicalSignals(context) {
    const signals = [];
    if (context.pain !== null && context.pain >= 8) signals.push({ rule: 'medical-pain', note: `记录疼痛 ${context.pain}/10`, body: '先协助联系医生或当地医疗服务；严重、加重或影响日常活动的疼痛，不只靠忍耐或自我照护。' });
    if (context.flow === 'heavy') signals.push({ rule: 'medical-heavy-flow', note: '记录出血量明显偏多', body: '安排医生评估，并带上出血日期、用品更换频率、漏出情况及对生活的影响。' });
    if (context.flow === 'unexpected') signals.push({ rule: 'medical-unexpected-flow', note: '记录经期外或异常出血', body: '把出血日期、流量和伴随不适记下来，联系医生讨论；不要仅凭经色或预测日期判断原因。' });
    if (!context.future && context.info.bleedingState === 'ongoing' && Number.isFinite(context.info.day) && context.info.day > 7) {
      signals.push({ rule: 'medical-prolonged-bleeding', note: `实际出血记录到周期第 ${context.info.day} 天`, body: '这次实际出血已经超过7天，保留真实起止日期并咨询医生，不把参考持续天数当作实际结束。' });
    }
    return signals;
  }
  function phaseCard(context, stage) {
    const futurePrefix = context.future ? '为这一天提前准备：' : '';
    let title, body;
    const reason = context.future ? '未来日期只有参考安排，没有提前确认出血、疼痛或心情。' : stage.certainty === 'predicted' ? '这里使用的是预计日期或参考出血窗口。' : stage.certainty === 'actual' ? '按已记录的实际起止日期安排；当天感受仍需她表达。' : '周期位置不能代替她的实际体验。';
    const rules = ['phase-' + stage.key];
    if (stage.key === 'before') {
      title = '把用品和行程留出弹性';
      body = '日历只提示可能接近月经。预留她常用的用品，让约会、出行和家务可以缩短或改期；不预设她一定有经前症状。';
    } else if (stage.key === 'during') {
      title = context.info.day === 1 ? '第一天先减掉一件负担' : '把今天的安排交给实际感受';
      body = '接手一件她愿意交给你的具体事务，把必须完成的事与可取消的安排分开。她想活动就留轻松选项，想休息也可以直接调整。';
    } else if (stage.key === 'reference') {
      title = '先确认记录，再按需要准备';
      body = context.info.predicted ? '这只是预计经期窗口，还没有确认新的真实开始日。用品和安排可以先准备，等她愿意分享实际情况再更新，不要求按预测开始。' : '现在只知道开始日，结束日尚未确认。可以在她愿意时补记最后出血日，不用参考天数自动结束，也不默认今天仍在出血。';
    } else if (stage.key === 'after') {
      title = '结束后也按精力恢复日常';
      body = '保留她确认的最后出血日，接下来逐步恢复原有安排。不要因为出血结束就默认不适全部消失；方便时记下一件这次有帮助、下次想保留的小事。';
    } else if (stage.key === 'delayed') {
      title = '先核对真实日期，保留不确定';
      body = '如果已经开始，就在她确认后补记实际第一天；如果还没开始，保留尚未确认，不为对齐日历虚构日期。周期反复变化或突然停止时，把记录带给医生讨论。';
    } else if (stage.key === 'between') {
      title = '把分担放进普通的一天';
      body = '选一件日常事务主动分担，把她常用的用品和需要保留的空间记清楚。没有不适就按自己的节奏生活，不因为周期标签强制休息或安排见面。';
    } else {
      title = '先从一条真实记录和一件小事开始';
      body = '她愿意分享时，再填写最近一次月经的实际开始日和结束状态；不知道结束日可以留待补记。日期不够时，先商量一件有用的小事，不靠28天推定今天的身体情况。';
      rules[0] = 'phase-unknown';
    }
    if (!context.future && context.pain !== null && context.pain > 0 && context.pain < 8 && ['during', 'reference'].includes(stage.key)) {
      body += ' 若她想试，可准备隔布温热敷或温水淋浴；让她更不舒服就停下。';
      rules.push('phase-during');
    }
    return card('phase-' + stage.key, title, futurePrefix + body, reason, rules, 'editorial');
  }
  function adaptationCard(context) {
    const rules = [], actions = [], reasons = [];
    const low = context.energy === 'low' || (context.pain !== null && context.pain >= 5);
    if (low) { rules.push('adjust-low-energy'); reasons.push(context.energy === 'low' ? '她记录精力偏低' : '她记录疼痛至少5/10'); actions.push('把非必要外出或长时间安排缩短，接手一件家务，让她有一段不需要回应的休息时间。'); }
    if (context.sleep === 'poor') { rules.push('adjust-poor-sleep'); reasons.push('她记录睡眠不好'); actions.push('今晚把睡前安排提前收尾，减少晚间咖啡因与屏幕刺激，尽量保留稳定的起床时间；持续影响白天生活时记录并求助。'); }
    if (context.mood === '紧绷' || context.mood === '很难受') {
      rules.push('adjust-tension'); reasons.push('她记录' + context.mood);
      actions.push('沟通一次只说一件事，减少解释和立即回应的压力。若情绪已影响睡眠、学习、工作或关系，协助联系心理健康专业人员，不先归因于经期。若类似不适在经前反复，可连续记录至少两个周期再讨论，不据此自诊PMS或PMDD。');
    }
    if (!rules.length) return null;
    const title = context.sleep === 'poor' && low ? '今天减负，今晚早点收尾' : context.sleep === 'poor' ? '把今晚留给更简单的睡前安排' : low ? '把今天改成低负担版本' : '减少追问，给情绪一点余地';
    return card('adjust-today', title, actions.join(' '), reasons.join('；') + '。这是据实际记录调整安排，不是诊断。', rules);
  }
  function supportCard(context, medical) {
    let title, body, ask;
    const chosen = context.partner.support;
    if (chosen === 'alone') {
      title = '按她的选择，先留出独处空间';
      body = '停止连续追问，不要求回复，也不安排必须见面的陪伴。把可联系你的方式留好；用品放在什么位置、要不要帮忙，都按已经确认的约定来。';
      if (medical) body += ' 如她需要就医，提供代为联系或交通的选项，先确认她希望你怎样协助。';
      ask = '我先不打扰，你需要时再联系我。';
    } else if (chosen === 'quiet') {
      title = '安静陪伴，不让她负责主持气氛';
      body = '按她愿意的方式安静待着，不连续问是否好点了，也不要求聊天或回应；她想休息或结束陪伴时就调整。可以先把一件已约定的事务做好。';
      ask = '我可以安静陪着；你想休息或想自己待着时，直接告诉我就好。';
    } else if (chosen === 'help') {
      title = '把帮助变成一件具体的事';
      body = '提供买常用用品、准备她愿意吃的一餐、分担家务或安排交通中的一个选项。确认后完成这一件，不把全部统筹再交回给她。';
      ask = '我可以先帮你买用品或分担一件事，你想选哪一件？不需要也可以。';
    } else {
      title = '先问一次，再按她的回答行动';
      body = '一次给一个具体选项，允许她说不需要、改主意或晚点回答。没有回应时先留空间，不把沉默解释成经期情绪或关系态度。';
      ask = '今天更希望我帮一件事、安静陪着，还是先不打扰？';
    }
    if (context.partner.likes) body += ' 她填写的喜欢事项：“' + context.partner.likes + '”。今天是否想要，仍由她决定。';
    if (context.partner.avoid) body += ' 她填写的避开事项：“' + context.partner.avoid + '”。按原话保留，不从文字猜另一种偏好。';
    return {
      support: card('support-' + chosen, title, body, '沟通与分担建议为编辑整理；只使用明确支持选项，偏好不等于每次行动的同意。', ['support-choice'], 'editorial'), ask
    };
  }
  function topicCard(context, medical) {
    const products = context.topics.includes('products'), movement = context.topics.includes('movement');
    if (!products && !movement) return null;
    const rules = [], body = [];
    if (movement) {
      rules.push('topic-movement');
      body.push(medical ? '先把需要处理的疼痛或出血放在前面，暂缓增加运动强度；不为了完成活动计划而硬撑。' : '她想活动时，可选散步或轻柔活动，并留出随时缩短或停止的空间；精力低、疼痛或活动后更不舒服就休息。');
    }
    if (products) {
      rules.push('topic-products');
      body.push('准备她熟悉、接受的用品，不替她强换棉条或月经杯。按包装要求更换和清洁，不超过产品建议时间；外阴用温水，不把洗液冲入阴道。');
    }
    return card('optional-planning', movement && products ? '活动与用品都按舒适程度选择' : products ? '用品先选她熟悉的方式' : '活动保留随时停下的余地', body.join(' '), '你选择了想了解' + [movement ? '活动' : '', products ? '用品' : ''].filter(Boolean).join('与') + '；这不表示她今天必须尝试。', rules);
  }
  function tcmCards(context, medical) {
    const general = context.topics.includes('tcm');
    let body = '先准备她按实际耐受愿意吃的普通一餐，规律进食并留足饮水。若已有服药相关忌口，向开方医师问清适用条件和持续时间；不要因为经期或某个五行，自动加入调经茶、补药或药膳。';
    const rules = ['tcm-default-meal'];
    if (general) { rules.push('topic-tcm'); body += ' 如果她想看中医，可先整理实际起止日、疼痛与现用药，再问辨证依据、风险和替代选择，不凭经色或单项症状给体质下结论。'; }
    if (medical) body += ' 这些饮食与沟通安排不能替代前面的医疗求助。';
    const result = [card('tcm-daily-care', general ? '先整理就诊记录，再讨论日常调护' : '中医调护先落在普通的一餐', body, general ? '你选择了解中医；这里整理就诊与饮食问题，不输出诊断。' : '默认综合中医饮食及用药知识，不代表已经选择中医治疗。', rules, 'tcm')];
    if (context.topics.includes('herbal')) result.push(card('tcm-herbal-review', '考虑草药前，先核对成分和现用药', '你选择的是了解中药，不表示已经在服用。若以后想用，把中药、调经茶、补充剂及处方和非处方药的完整清单带给医师或药师，核对适用性与相互作用；不照搬别人的方子，不自行加量或混用。', '综合中药不良反应、药食差异与现用药核对三方面的安全信息。', ['topic-herbal'], 'tcm'));
    if (context.topics.includes('acupuncture')) result.push(card('tcm-acupuncture-review', '了解针灸时，把证据与安全一起问清', (medical ? '先处理已经记录的疼痛或出血求助，针灸知识不能代替评估。' : '') + '已收录的Cochrane综述发表于2016年、检索截至2015年9月，证据质量低或很低，不能代表当前全部研究或保证个人效果。若以后考虑接受，先问适用性、当地执业资质、一次性无菌针具与复评安排，不自行下针。', '你选择了解针灸；不是确认已经接受治疗，也不生成疗程。', ['topic-acupuncture'], 'tcm'));
    if (context.topics.includes('moxibustion')) result.push(card('tcm-moxa-review', '艾灸先了解烫伤风险，不自行安排', (medical ? '先完成前面的医疗求助。' : '') + '艾灸有皮肤不适与烫伤风险，不是越热越好，也不能由怕冷、生日或五行判断是否适合。若以后考虑尝试，先由合资格专业人员评估并说明不适处理；网站不提供穴位、点燃或时长参数。', '你选择了解艾灸；医院风险科普不等于治疗经痛的高质量疗效证明。', ['topic-moxibustion'], 'tcm'));
    return result;
  }
  const CULTURE_RULES = ['culture-calendar-year', 'culture-day-symbol', 'culture-chart-boundary', 'culture-aesthetic', 'culture-record-first', 'culture-no-taboo'];
  const CULTURE_CONTEXTS = [
    '生肖是十二年循环的纪年符号，公历年初要核对日期及春节或立春年界，不能只看年份。',
    '天干地支按序配成日期符号，日干的五行标签不等于完整八字或个人体质。',
    '六十干支是循环的时间序列，不能填补缺失的出生时刻；临近午夜也要保留实际日期与时区。',
    '颜色是可选审美，相生相克描述传统符号关系，不是补身体元素的方法。',
    '农历、月相与节气只是日期背景，经期仍以她确认的真实记录为准。',
    '生肖与生克关系不产生运动、饮食或见人的禁令，情绪仍按实际体验理解。'
  ];
  function cultureCard(context, medical) {
    if (!context.culture || context.quiet || medical || context.mood === '很难受') return null;
    const ordinal = context.date ? Math.trunc(Date.parse(context.date + 'T00:00:00Z') / 86400000) : 0;
    const theme = ((ordinal % 6) + 6) % 6;
    const element = ['木', '火', '土', '金', '水'].includes(context.cultureInfo.element) ? context.cultureInfo.element : '';
    const label = text(context.cultureInfo.label, 160);
    const birthSymbols = text(context.cultureInfo.birthSymbols, 180);
    const inspiration = (text(context.cultureInfo.inspiration, 140) || '听一首她喜欢的歌，或留一小段空白').replace(/[。！？]+$/, '');
    const symbol = [label, element ? '元素标签：' + element : ''].filter(Boolean).join(' · ');
    let body = (symbol ? symbol + '。' : '') + (birthSymbols ? birthSymbols + '。' : '') + '可选生活灵感：“' + inspiration + '”。她愿意才做，也可以什么都不选。' + CULTURE_CONTEXTS[theme];
    if (theme === 2) body += context.cultureInfo.birthKnown === true ? '生日已确认也不等于出生时刻齐全。' : '未确认生日也不影响普通照护。';
    return card('culture-' + theme, '把自选仪式放进今天的休息空档', body, '你开启了文化栏目；文字和活动配搭是编辑选择，不改变上面的照护与求助安排。', unique([CULTURE_RULES[theme], 'culture-day-symbol', ...(birthSymbols ? ['culture-calendar-year', 'culture-aesthetic'] : [])]), 'culture');
  }
  function integrateDay(context, stage, plan, medical) {
    const byId = new Map([...plan.priorities, ...plan.tcm, ...plan.avoid, plan.support].map(item => [item.id, item]));
    const mergeIds = items => unique(items.filter(Boolean).flatMap(item => item.articleIds));
    const low = context.energy === 'low' || (context.pain !== null && context.pain >= 5);
    const painful = context.pain !== null && context.pain > 0;
    const poorSleep = context.sleep === 'poor';
    const tense = ['紧绷', '很难受'].includes(context.mood);
    const alone = context.partner.support === 'alone';
    const phase = byId.get('phase-' + stage.key) || plan.priorities.find(item => item.id.startsWith('phase-'));
    const adjustment = byId.get('adjust-today');
    const meal = byId.get('tcm-daily-care');
    const herbal = byId.get('tcm-herbal-review');
    const topics = byId.get('optional-planning');
    const actions = [];
    if (medical) actions.push({...byId.get('medical-first'), timing:'现在优先', steps:[byId.get('medical-first').body], sources:['身体照护']});
    let immediate = phase.body;
    if (low && !medical) immediate = '先把非必要的外出或长时间安排缩短，接手一件她愿意交给你的事务，让她能休息。' + (stage.key === 'reference' ? '结束或开始状态尚未确认，先核对真实记录。' : stage.key === 'delayed' ? '实际开始日仍待确认，不为对齐日历补造日期。' : '');
    const steps = [immediate];
    if (painful && !medical && ['during','reference'].includes(stage.key) && !/温热敷/.test(immediate)) steps.push('她想试时，可准备隔布温热敷或温水淋浴，温度以舒服为准；更不舒服就停下。');
    if (context.topics.includes('movement') && !medical) steps.push('活动只保留散步等轻柔选项，舒服才做，可以随时缩短或停止。');
    if (context.topics.includes('products')) steps.push('把她熟悉的用品准备好，按包装要求更换和清洁；是否换用其他用品由她决定。');
    actions.push({id:phase.id,timing:medical?'求助安排之后':'先减轻负担',title:medical?'其他安排先保持简单':low?'把今天改成低负担版本':phase.title,steps,reason:phase.reason + (low ? ' 已填写低精力或疼痛至少5/10，因此缩短安排。' : ''),articleIds:mergeIds([phase,adjustment,topics]),sources:['周期记录','身体照护','照护安排'],kind:'editorial'});
    const mealSteps = [low ? '把她愿意吃、实际能接受的普通一餐准备好，留足饮水，减少她为吃饭操心的事。' : '照常准备她能接受的均衡一餐和饮水，温度、份量按她的实际感受选择。'];
    mealSteps.push('若已有中药相关忌口，问清开方医师针对什么情况、持续多久；今天不自动加调经茶、补药或药膳。');
    if (herbal) mealSteps.push('你想了解中药或药膳：先把完整成分和现用中西药、补充剂列在一起，请医师或药师核对，不自行加量或混用。');
    actions.push({id:'day-meal',timing:'吃饭与饮水',title:low?'把一餐准备好，少让她费心':'吃她能接受的普通一餐',steps:mealSteps,reason:'把经期均衡饮食的资料、中医服药忌口的适用条件和药食相互作用知识合在同一次安排里；分担做饭是编辑建议。' + (herbal ? ' 你还选择了中药或药膳主题。' : ''),articleIds:mergeIds([meal,herbal]),sources:['身体照护','中医用药常识','照护安排'],kind:'tcm'});
    const restSteps = [];
    if (poorSleep) restSteps.push('今晚提前收尾，减少晚间咖啡因和屏幕刺激，尽量保持稳定起床时间；睡眠持续影响白天生活时记录并求助。');
    if (tense) restSteps.push('一次只说一件事，减少解释和马上回复的压力；情绪持续影响日常生活时协助寻求专业支持，不先归因于经期。');
    restSteps.push(alone ? '按她已表达的选择留出独处，不连续追问、不要求回复或见面；用品和帮忙方式按已经确认的约定来。' : context.partner.support === 'quiet' ? '她愿意时安静陪着，不让她负责聊天或主持气氛，想结束陪伴就调整。' : context.partner.support === 'help' ? '给出买用品、准备一餐或分担家务中的一个选项，确认后完成这一件。' : '先问一次她想要哪种支持，没有回应时留出空间，不替她决定。');
    actions.push({id:'day-rest',timing:'休息与相处',title:poorSleep?'今晚早点收尾，按她的方式休息':alone?'把不被打扰的时间留给她':'按她的回答安排陪伴',steps:restSteps,reason:adjustment ? adjustment.reason + ' 陪伴方式来自她明确选择的支持选项。' : plan.support.reason,articleIds:mergeIds([adjustment,plan.support]),sources:[...(poorSleep||tense?['睡眠与情绪资料']:[]),'本人偏好','照护安排'],kind:'editorial'});
    const facts = [plan.phaseLabel];
    if (Number.isFinite(context.info.day) && ['during','reference'].includes(stage.key)) facts.push((stage.key==='during'?'经期第 ':'参考周期第 ')+context.info.day+' 天');
    if (context.pain !== null) facts.push('疼痛 '+context.pain+'/10');
    if (context.energy) facts.push({low:'精力偏低',medium:'精力还可以',high:'精力充足'}[context.energy]);
    if (poorSleep) facts.push('睡眠不好');
    if (context.flow === 'heavy') facts.push('出血明显偏多');
    if (context.flow === 'unexpected') facts.push('经期外出血');
    if (context.mood) facts.push(context.mood);
    facts.push({alone:'希望独处',quiet:'希望安静陪伴',help:'希望具体帮助',ask:'支持方式先询问'}[context.partner.support]);
    const hasObservation = context.pain !== null || context.energy || context.sleep || context.flow || context.mood;
    const summary = (medical ? '先落实疼痛或出血的医疗求助，其他安排保持简单。' : low ? '今天先缩短安排、接手一件事务，留出休息。' : stage.key === 'before' ? '先备好熟悉的用品，给行程留出调整余地。' : stage.key === 'after' ? '按实际精力恢复日常，记下这次有帮助的小事。' : stage.key === 'during' ? '把今天要做的事减到她能接受的程度。' : '先确认愿意分享的记录，再商量一件具体帮助。') + (poorSleep?'一餐照常准备，今晚提前收尾。':'饮食按实际耐受，先准备普通一餐。') + (alone?'她想独处，支持就以不打扰为主。':'陪伴按她今天的选择来。');
    const culture = plan.culture ? {...plan.culture,arrangement:(alone?'把下面的灵感留给她自己选择，不另安排必须见面或回应的仪式。':low?'如果她愿意，把灵感放在休息空档，用坐着或躺着也能完成的版本。':'如果她愿意，把灵感放进今天已经留出的空闲时间。') + '选过的仪式会显示在这里，也可以留白。'} : null;
    return {summary,facts,hasObservation:!!hasObservation,actions,message:medical&&!alone?'我可以帮你联系医生或安排交通，你希望我怎样协助？':plan.ask,preferences:{likes:context.partner.likes,avoid:context.partner.avoid},followUp:plan.tcm.filter(item=>item.id!=='tcm-daily-care'&&item.id!=='tcm-herbal-review').concat(context.topics.includes('tcm')?[meal]:[]),avoid:plan.avoid,culture};
  }
  function buildPlan(rawContext = {}) {
    const context = normalize(rawContext), stage = stageOf(context), signals = medicalSignals(context);
    const medical = signals.length > 0, priorities = [], avoid = [];
    if (medical) priorities.push(card('medical-first', '先处理疼痛或出血，再安排其他事', signals.map(signal => signal.body).join(' ') + ' 若同时出现明显头晕或晕厥、突然剧烈腹痛，或可能怀孕时疼痛出血，按所在地急诊或医疗咨询流程获取帮助；这些是条件提示，不表示她已经出现。', signals.map(signal => signal.note).join('；') + '。', signals.map(signal => signal.rule), 'health', 'medical'));
    priorities.push(phaseCard(context, stage));
    const adaptation = adaptationCard(context); if (adaptation) priorities.push(adaptation);
    const topic = topicCard(context, medical); if (topic) priorities.push(topic);
    const { support, ask } = supportCard(context, medical);
    avoid.push(card('avoid-calendar', '不拿预计日期替她决定', '日历预测不能作为避孕保护，也不能说明她今天一定想见面、运动或需要某种陪伴。日期与安排不一致时，更新真实记录，以她当下的回答为准。', '周期计算只使用日期；这里的意愿与沟通部分是编辑建议。', ['avoid-calendar-assumptions'], 'editorial'));
    if ((context.pain !== null && context.pain > 0) || context.topics.includes('herbal')) avoid.push(card('avoid-medication', '不自行加量、混用或照搬药方', '需要止痛药或含草药的产品时，先核对包装和医生、药师的建议；已有用药、过敏或慢性病时说明清楚。不要因为经期就自动加量、混用，或按别人的调经方配药。', context.topics.includes('herbal') ? '你选择了解草药，需要连同现用药一起核对。' : '存在实际疼痛，提供用药安全边界，不开处方或剂量。', ['avoid-unsupervised-medication'], 'health'));
    if (medical) avoid.push(card('avoid-delayed-help', '先落实求助，再安排其他照护', '先落实上面的联系医疗服务与记录安排；日常饮食、温热或日历估算都不能替代对当前严重或异常情况的评估。', signals.map(signal => signal.note).join('；') + '，求助卡片保持最高优先级。', signals.map(signal => signal.rule), 'health', 'medical'));
    const tcm = tcmCards(context, medical), culture = cultureCard(context, medical);
    const phaseLabel = context.future ? '未来参考安排 · ' + stage.label.split(' · ')[0] : stage.key === 'reference' && context.info.predicted !== true ? '经期参考 · 结束日待确认' : stage.label;
    const contextNotes = [context.future ? '未来日期仅供参考，真实感受到当天再确认。' : stage.certainty === 'actual' ? '按实际经期记录定位' : '预计周期位置 · 待实际确认'];
    if (medical) contextNotes.push(...signals.map(signal => signal.note + ' · 先处理'));
    if (!context.future && context.energy === 'low') contextNotes.push('精力偏低');
    if (!context.future && context.sleep === 'poor') contextNotes.push('睡眠困扰');
    if (!context.future && ['紧绷', '很难受'].includes(context.mood)) contextNotes.push('情绪不适 · 不据此诊断PMS或PMDD');
    const name = context.partner.nickname || '她';
    const headline = medical ? '先把' + name + '的实际不适放在前面。' : context.future ? '为这一天留好选择，真正的感觉到时再确认。' : stage.key === 'during' ? '把关心落到今天能减轻负担的小事里。' : '结合实际记录，安排今天能做的一点照护。';
    const allCards = [...priorities.slice(0, 4), support, ...tcm, ...avoid, ...(culture ? [culture] : [])];
    const plan = { phaseLabel, certainty: context.future ? 'predicted' : stage.certainty, headline, contextNotes, priorities: priorities.slice(0, 4), support, tcm, avoid, culture, ask, selectedArticleIds: unique(allCards.flatMap(item => item.articleIds)), consideredCount: knownIds.size };
    plan.daily = integrateDay(context, stage, plan, medical);
    return plan;
  }
  function getRuleCoverage() { return RULES.map(rule => ({ ...rule, articleIds: rule.articleIds.slice() })); }
  return { buildPlan, getRuleCoverage };
});
