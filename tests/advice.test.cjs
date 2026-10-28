'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const Advice = require('../public/advice.js');
const Core = require('../public/core.js');
const Companion = require('../public/companion.js');
const health = require('../public/health-data.js');
const tcm = require('../public/tcm-data.js');
const culture = require('../public/culture-data.js');
const catalog = [...health, ...tcm, ...culture];
const knownIds = new Set(catalog.map(article => article.id));
const today = '2026-10-26';
const base = () => ({ date: today, today, info: Core.getCycle({ periods: [] }, today, today), partner: { consent: false, support: 'ask' }, pain: null, mood: '', energy: '', sleep: '', flow: '', topics: [], activities: [], culture: false, quiet: false });
const actualPeriod = (date = today) => Core.getCycle({ periods: [{ id: 'actual', start: '2026-10-23', end: null, status: 'ongoing' }], cycleLength: 28, periodLength: 5 }, date, today);
const cards = plan => [...plan.priorities, plan.support, ...plan.tcm, ...plan.avoid, ...(plan.culture ? [plan.culture] : [])];
const nonCulture = plan => ({ phaseLabel: plan.phaseLabel, certainty: plan.certainty, headline: plan.headline, contextNotes: plan.contextNotes, priorities: plan.priorities, support: plan.support, tcm: plan.tcm, avoid: plan.avoid, ask: plan.ask });

test('exports a deterministic Node API and browser UMD API without mutating context', () => {
  const sandbox = { MoonCore: Core, MoonCompanion: Companion, MoonHealthArticles: health, MoonTCMArticles: tcm, MoonCultureArticles: culture };
  vm.runInNewContext(fs.readFileSync(require.resolve('../public/advice.js'), 'utf8'), sandbox);
  assert.equal(typeof sandbox.MoonAdvice.buildPlan, 'function');
  const input = { ...base(), info: actualPeriod(), partner: { consent: true, nickname: '<她>', support: 'quiet', likes: '<任意原文>', avoid: '不要独处' }, topics: ['tcm', 'products'], culture: true, cultureInfo: { element: '水', label: '日历标签', inspiration: '听歌' } };
  const snapshot = structuredClone(input);
  assert.deepEqual(Advice.buildPlan(input), Advice.buildPlan(input));
  assert.deepEqual(input, snapshot);
  assert.equal(sandbox.MoonAdvice.buildPlan(input).consideredCount, 50);
});

test('changes concrete arrangements across unknown, pre-period, actual period, reference, after and delayed stages', () => {
  const profiles = {
    before: { periods: [{ id: 'p', start: '2026-10-01', end: '2026-10-05', status: 'ended' }] },
    during: { periods: [{ id: 'p', start: '2026-10-23', end: null, status: 'ongoing' }] },
    reference: { periods: [{ id: 'p', start: '2026-10-23', end: null, status: 'unknown' }] },
    after: { periods: [{ id: 'p', start: '2026-10-20', end: '2026-10-24', status: 'ended' }] },
    delayed: { periods: [{ id: 'p', start: '2026-09-20', end: '2026-09-24', status: 'ended' }] }
  };
  const unknown = Advice.buildPlan(base());
  assert.match(unknown.priorities[0].body, /真实|实际/);
  for (const [name, profile] of Object.entries(profiles)) {
    const plan = Advice.buildPlan({ ...base(), info: Core.getCycle(profile, today, today) });
    assert.equal(plan.priorities[0].id, 'phase-' + name);
    assert.ok(plan.priorities[0].body.length > 40);
    assert.ok(plan.tcm.length >= 1);
  }
  const during = Advice.buildPlan({ ...base(), info: actualPeriod(), pain: 3 });
  assert.match(during.priorities[0].body, /隔布温热敷/);
  assert.equal(during.certainty, 'actual');
  const reference = Advice.buildPlan({ ...base(), info: Core.getCycle(profiles.reference, today, today) });
  assert.match(reference.phaseLabel, /结束日待确认/);
  assert.match(reference.priorities[0].body, /不默认今天仍在出血/);
});

test('high pain raises medical help above routine care and suppresses cultural decoration', () => {
  const plan = Advice.buildPlan({ ...base(), info: actualPeriod(), pain: 8, culture: true });
  assert.equal(plan.priorities[0].id, 'medical-first');
  assert.equal(plan.priorities[0].urgency, 'medical');
  assert.match(plan.priorities[0].body, /联系医生|医疗服务/);
  assert.ok(plan.priorities[0].articleIds.includes('health-urgent-pain'));
  assert.equal(plan.culture, null);
  assert.ok(plan.priorities.length <= 4);
  assert.match(plan.tcm[0].body, /不能替代/);
});

test('heavy and unexpected bleeding produce distinct medical reasons without inventing symptoms', () => {
  const heavy = Advice.buildPlan({ ...base(), flow: 'heavy' });
  assert.equal(heavy.priorities[0].urgency, 'medical');
  assert.match(heavy.priorities[0].reason, /偏多/);
  assert.ok(heavy.priorities[0].articleIds.includes('health-heavy-flow'));
  const unexpected = Advice.buildPlan({ ...base(), flow: 'unexpected' });
  assert.match(unexpected.priorities[0].reason, /异常出血/);
  assert.ok(unexpected.priorities[0].articleIds.includes('health-abnormal-bleeding'));
  assert.doesNotMatch(unexpected.priorities[0].reason, /已经晕厥|已经怀孕|贫血/);
});

test('only explicitly ongoing bleeding past seven days triggers the duration priority', () => {
  const info = { day: 8, phase: 'period', predicted: false, bleedingState: 'ongoing', actualEnd: null, nextStart: '2026-11-16' };
  const ongoing = Advice.buildPlan({ ...base(), info });
  assert.equal(ongoing.priorities[0].urgency, 'medical');
  assert.match(ongoing.priorities[0].body, /超过7天/);
  const ended = Advice.buildPlan({ ...base(), info: { ...info, bleedingState: 'confirmed', actualEnd: today } });
  assert.equal(ended.priorities.some(card => card.urgency === 'medical'), false);
  const unknown = Advice.buildPlan({ ...base(), info: { ...info, phase: 'between', bleedingState: 'none' } });
  assert.equal(unknown.priorities.some(card => card.urgency === 'medical'), false);
});

test('selecting acupuncture or moxibustion during discomfort never replaces medical help', () => {
  const plan = Advice.buildPlan({ ...base(), info: actualPeriod(), pain: 9, topics: ['acupuncture', 'moxibustion'] });
  assert.equal(plan.priorities[0].id, 'medical-first');
  const acupuncture = plan.tcm.find(card => card.id === 'tcm-acupuncture-review');
  const moxa = plan.tcm.find(card => card.id === 'tcm-moxa-review');
  assert.match(acupuncture.body, /2016年.*2015年9月/);
  assert.match(acupuncture.body, /先处理|不能代替/);
  assert.match(acupuncture.reason, /不是确认已经接受/);
  assert.match(moxa.body, /烫伤/);
  assert.match(moxa.body, /先完成/);
  assert.ok(acupuncture.articleIds.includes('tcm-acupuncture-safety'));
});

test('an explicit solitude preference changes support and the suggested message without keyword guessing', () => {
  const alone = Advice.buildPlan({ ...base(), info: actualPeriod(), partner: { consent: true, support: 'alone', likes: '安静休息' } });
  assert.equal(alone.support.id, 'support-alone');
  assert.match(alone.support.body, /不要求回复/);
  assert.match(alone.ask, /我先不打扰/);
  assert.doesNotMatch(alone.ask, /买用品.*安静陪着.*哪|现在.*希望/);
  const notAlone = Advice.buildPlan({ ...base(), partner: { consent: true, support: 'ask', avoid: '不要独处，也不要热敷' } });
  assert.equal(notAlone.support.id, 'support-ask');
  assert.ok(notAlone.support.body.includes('不要独处，也不要热敷'));
  assert.ok(!notAlone.tcm.some(card => /艾灸/.test(card.title)));
  const noRecordConsent = Advice.buildPlan({ ...base(), partner: { consent: false, nickname: '不该展示', likes: '不该展示', avoid: '不该展示', support: 'ask' } });
  assert.ok(!JSON.stringify(noRecordConsent).includes('不该展示'));
});

test('poor sleep, low energy and tension materially change the action plan without diagnosis', () => {
  const plain = Advice.buildPlan(base());
  assert.equal(plain.priorities.some(card => card.id === 'adjust-today'), false);
  const changed = Advice.buildPlan({ ...base(), energy: 'low', sleep: 'poor', mood: '紧绷' });
  const adjustment = changed.priorities.find(card => card.id === 'adjust-today');
  assert.match(adjustment.body, /缩短|休息/);
  assert.match(adjustment.body, /咖啡因/);
  assert.match(adjustment.body, /一次只说一件事/);
  assert.ok(adjustment.articleIds.includes('health-sleep'));
  assert.ok(adjustment.articleIds.includes('health-caffeine'));
  assert.ok(adjustment.articleIds.includes('health-pmdd'));
  assert.match(changed.contextNotes.join(''), /不据此诊断/);
});

test('herbal interest combines product, interaction and existing-medication safety without prescribing', () => {
  const plan = Advice.buildPlan({ ...base(), topics: ['herbal'] });
  const herbal = plan.tcm.find(card => card.id === 'tcm-herbal-review');
  assert.ok(herbal);
  for (const id of ['tcm-herbal-safety', 'tcm-food-herb-interactions', 'health-medication']) assert.ok(herbal.articleIds.includes(id));
  assert.match(herbal.body, /不表示已经在服用/);
  assert.match(herbal.body, /完整清单.*医师或药师/);
  assert.match(herbal.body, /不自行加量或混用/);
  assert.doesNotMatch(herbal.body, /\d+\s*(克|毫克|粒|分钟)/);
});

test('culture on, off and quiet never change the non-cultural care plan', () => {
  const context = { ...base(), info: actualPeriod(), pain: 3, energy: 'low', topics: ['tcm', 'movement'] };
  const off = Advice.buildPlan(context);
  const on = Advice.buildPlan({ ...context, culture: true, cultureInfo: { element: '火', label: '日历符号', inspiration: '为房间留一盏柔和的灯', birthKnown: true } });
  const quiet = Advice.buildPlan({ ...context, culture: true, quiet: true });
  assert.equal(off.culture, null); assert.ok(on.culture); assert.equal(quiet.culture, null);
  assert.deepEqual(nonCulture(off), nonCulture(on));
  assert.deepEqual(nonCulture(off), nonCulture(quiet));
  assert.equal(on.culture.kind, 'culture');
  assert.match(on.culture.body, /愿意才做|什么都不选/);
  assert.ok(cards(off).every(card => card.articleIds.every(id => !id.startsWith('culture-'))));
});

test('future dates ignore all unoccurred symptoms while keeping an explicitly predicted plan', () => {
  const context = { ...base(), date: '2026-11-23', info: Core.getCycle({ periods: [{ id: 'p', start: '2026-10-23', end: null, status: 'ongoing' }] }, '2026-11-23', today), culture: true };
  const blank = Advice.buildPlan(context);
  const injected = Advice.buildPlan({ ...context, pain: 10, mood: '很难受', energy: 'low', sleep: 'poor', flow: 'unexpected' });
  assert.deepEqual(injected, blank);
  assert.equal(injected.certainty, 'predicted');
  assert.match(injected.phaseLabel, /未来参考安排/);
  assert.match(injected.contextNotes[0], /参考/);
  assert.ok(!injected.priorities.some(card => card.urgency === 'medical'));
});

test('all 50 articles are traceable, every output reference exists, and coverage is immutable to callers', () => {
  assert.equal(health.length, 24); assert.equal(tcm.length, 8); assert.equal(culture.length, 18);
  const coverage = Advice.getRuleCoverage();
  assert.equal(new Set(coverage.map(rule => rule.id)).size, coverage.length);
  assert.ok(coverage.every(rule => rule.when && (rule.articleIds.length || rule.basis === 'editorial')));
  assert.deepEqual(Advice.buildPlan(base()).support.articleIds, [], 'generic support comes from expressed preference and editorial planning, not an anxiety diagnosis');
  const covered = new Set(coverage.flatMap(rule => rule.articleIds));
  assert.deepEqual([...covered].sort(), [...knownIds].sort());
  const observed = new Set();
  const contexts = [base(), { ...base(), info: actualPeriod(), pain: 8, flow: 'heavy', energy: 'low', sleep: 'poor', mood: '很难受', topics: ['tcm', 'herbal', 'acupuncture', 'moxibustion', 'movement', 'products'] }, { ...base(), flow: 'unexpected' }];
  for (let day = 20; day <= 25; day++) contexts.push({ ...base(), date: '2026-10-' + day, culture: true, cultureInfo: { element: '木', label: '历法标签' }, topics: ['tcm', 'herbal', 'acupuncture', 'moxibustion', 'movement', 'products'] });
  for (const context of contexts) {
    const plan = Advice.buildPlan(context);
    assert.equal(plan.consideredCount, 50);
    assert.ok(plan.priorities.length <= 4);
    for (const item of cards(plan)) {
      for (const field of ['id', 'title', 'body', 'reason', 'kind']) assert.ok(item[field]);
      assert.ok(['health', 'tcm', 'editorial', 'culture'].includes(item.kind));
      for (const id of item.articleIds) { assert.ok(knownIds.has(id), id); observed.add(id); }
    }
    assert.deepEqual(new Set(plan.selectedArticleIds), new Set(cards(plan).flatMap(card => card.articleIds)));
  }
  assert.deepEqual([...observed].sort(), [...knownIds].sort());
  coverage[0].articleIds.push('invented'); coverage[0].when = 'changed';
  assert.ok(!JSON.stringify(Advice.getRuleCoverage()).includes('invented'));
});

test('daily plan combines symptoms, food knowledge and expressed support into one ordered arrangement', () => {
  const plan=Advice.buildPlan({...base(),info:actualPeriod(),pain:5,energy:'low',sleep:'poor',partner:{support:'alone'},topics:['herbal']});
  const daily=plan.daily;
  assert.equal(daily.actions.length,3);
  assert.match(daily.summary,/缩短安排.*今晚提前收尾.*独处/);
  assert.match(daily.actions[0].steps.join(''),/隔布温热敷/);
  assert(daily.actions[0].articleIds.includes('health-heat-bath'));
  const meal=daily.actions.find(item=>item.id==='day-meal');
  assert(meal.articleIds.includes('health-cold-drinks'));
  assert(meal.articleIds.includes('tcm-diet-conditions'));
  assert(meal.articleIds.includes('tcm-herbal-safety'));
  assert.match(meal.steps.join(''),/普通一餐.*开方医师.*完整成分/);
  const rest=daily.actions.find(item=>item.id==='day-rest');
  assert.match(rest.steps.join(''),/晚间咖啡因.*不要求回复或见面/);
  assert(rest.articleIds.includes('health-sleep'));
  assert.match(daily.message,/先不打扰/);
  for(const item of daily.actions)assert(item.articleIds.every(id=>plan.selectedArticleIds.includes(id)));
});

test('daily arrangements respect missing symptoms, medical priority and future uncertainty', () => {
  const plain=Advice.buildPlan(base()).daily;
  assert.equal(plain.hasObservation,false);
  assert.doesNotMatch(plain.actions.map(item=>item.steps.join('')).join(''),/隔布温热敷|今晚提前收尾/);
  const medical=Advice.buildPlan({...base(),info:actualPeriod(),pain:8,culture:true});
  assert.equal(medical.daily.actions[0].id,'medical-first');
  assert.equal(medical.daily.culture,null);
  assert.equal(medical.daily.actions.length,4);
  const future={...base(),date:'2026-11-23',info:actualPeriod('2026-11-23')};
  assert.deepEqual(Advice.buildPlan({...future,pain:10,sleep:'poor',flow:'heavy'}).daily,Advice.buildPlan(future).daily);
});

test('culture adds an optional moment without changing any health arrangements', () => {
  const context={...base(),info:actualPeriod(),energy:'low',partner:{support:'alone'}};
  const off=Advice.buildPlan(context).daily;
  const on=Advice.buildPlan({...context,culture:true,cultureInfo:{element:'金',label:'自选元素',inspiration:'读几页熟悉的书',birthSymbols:'只比较两枚传统符号'}}).daily;
  assert.deepEqual({...on,culture:null},off);
  assert.match(on.culture.body,/读几页熟悉的书/);
  assert.match(on.culture.arrangement,/不另安排必须见面/);
});
