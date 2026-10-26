const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const MoonCompanion = require('../dist/companion.js');

const context = (overrides = {}) => ({
  date: '2024-01-15',
  today: '2024-01-15',
  info: { phase: 'between', predicted: false, nextStart: '2024-01-29' },
  partner: { nickname: '小月', support: '先发一条消息', likes: '热水袋', avoid: '临时见面', consent: true },
  mood: '',
  pain: 0,
  energy: 3,
  ...overrides,
});

test('exports buildGuide in Node and as a browser UMD global', () => {
  assert.equal(typeof MoonCompanion.buildGuide, 'function');
  const source = require('node:fs').readFileSync(require.resolve('../dist/companion.js'), 'utf8');
  const browserContext = {};
  vm.runInNewContext(source, browserContext);
  assert.equal(typeof browserContext.MoonCompanion.buildGuide, 'function');
});

test('uses confirmed or ongoing bleeding for the during stage, not reference bleeding', () => {
  const during = MoonCompanion.buildGuide(context({
    info: { phase: 'period', predicted: false, bleedingState: 'ongoing' },
  }));
  assert.match(during.phaseLabel, /经期/);
  assert.equal(during.certainty, 'actual');
  assert.match(during.actions.map((item) => item.body).join(' '), /热敷|分担/);

  const reference = MoonCompanion.buildGuide(context({
    info: { phase: 'period', predicted: true, bleedingState: 'reference', nextStart: '2024-01-15' },
  }));
  assert.match(reference.phaseLabel, /预计经期|参考/);
  assert.equal(reference.certainty, 'predicted');
});

test('marks a forecasted next start only in the seven days before it', () => {
  const guide = MoonCompanion.buildGuide(context({
    date: '2024-01-22',
    today: '2024-01-15',
    info: { phase: 'between', predicted: true, nextStart: '2024-01-29' },
  }));
  assert.match(guide.phaseLabel, /经前/);
  assert.equal(guide.certainty, 'predicted');
  assert.ok(guide.articleIds.includes('health-pms'));
});

test('uses the estimated next start for an actual cycle within seven days', () => {
  const guide = MoonCompanion.buildGuide(context({
    date: '2024-01-22',
    today: '2024-01-22',
    info: { phase: 'between', predicted: false, nextStart: '2024-01-29', bleedingState: 'none' },
  }));
  assert.match(guide.phaseLabel, /经前/);
  assert.equal(guide.certainty, 'predicted');
  assert.match(guide.headline, /可能接近/);
});

test('keeps a reference bleeding window visibly estimated and does not treat it as confirmed', () => {
  const guide = MoonCompanion.buildGuide(context({
    info: { phase: 'period', predicted: false, nextStart: '2024-01-29', bleedingState: 'reference' },
  }));
  assert.match(guide.phaseLabel, /预计经期|参考/);
  assert.equal(guide.certainty, 'predicted');
  assert.match(guide.headline, /参考/);
});

test('handles legacy future period results without throwing', () => {
  const guide = MoonCompanion.buildGuide(context({
    date: '2024-02-02',
    today: '2024-01-15',
    info: { phase: 'period', predicted: true, nextStart: '2024-03-01' },
  }));
  assert.match(guide.phaseLabel, /预计经期|参考/);
  assert.equal(guide.certainty, 'predicted');
});

test('does not call an already-passed estimate pre-period care', () => {
  const guide = MoonCompanion.buildGuide(context({
    date: '2024-01-30',
    today: '2024-01-30',
    info: { phase: 'late', predicted: false, nextStart: '2024-01-29', daysLate: 1, bleedingState: 'none' },
  }));
  assert.match(guide.phaseLabel, /预计日已过/);
  assert.equal(guide.certainty, 'unknown');
  assert.doesNotMatch(guide.phaseLabel, /经前/);
});

test('uses an actual end date for the seven-day after stage and does not shift text', () => {
  const info = {
    phase: 'between', predicted: false, nextStart: '2024-01-29', actualEnd: '2024-01-10', bleedingState: 'none',
  };
  const guide = MoonCompanion.buildGuide(context({ date: '2024-01-14', info }));
  assert.match(guide.phaseLabel, /经期后/);
  assert.equal(guide.certainty, 'actual');
  assert.match(guide.actions[0].body, /最后一天有经血/);
  assert.match(guide.actions[0].body, /不确定.*之后再补/);
  assert.equal(info.nextStart, '2024-01-29');

  const later = MoonCompanion.buildGuide(context({
    date: '2024-01-18',
    info: { ...info, actualEnd: '2024-01-12' },
  }));
  assert.match(later.phaseLabel, /经期后/);
  assert.equal(later.headline, guide.headline);
});

test('unknown and delayed records keep advice general instead of inventing a phase', () => {
  const unknown = MoonCompanion.buildGuide(context({ info: {} }));
  assert.match(unknown.phaseLabel, /未知/);
  assert.equal(unknown.certainty, 'unknown');
  assert.match(unknown.headline, /沟通/);

  const delayed = MoonCompanion.buildGuide(context({
    info: { phase: 'late', predicted: false, nextStart: '2024-01-14', daysLate: 1 },
  }));
  assert.match(delayed.phaseLabel, /预计日已过/);
  assert.equal(delayed.certainty, 'unknown');
  assert.match(delayed.actions.map((item) => item.body).join(' '), /尚未确认|真实开始日/);
});

test('keeps partner preferences as data and respects a refusal to engage', () => {
  const guide = MoonCompanion.buildGuide(context({
    info: { phase: 'period', predicted: false, bleedingState: 'confirmed' },
    partner: {
      nickname: '她',
      support: '只想一个人待着',
      likes: '温水',
      avoid: '电话轰炸',
      consent: false,
      mbti: 'ISTJ',
      zodiac: '马',
    },
  }));
  const rendered = JSON.stringify(guide);
  assert.match(rendered, /温水/);
  assert.match(rendered, /电话轰炸/);
  assert.match(rendered, /只想一个人待着/);
  assert.match(rendered, /不要求回复/);
  assert.doesNotMatch(rendered, /ISTJ|属马|八字|生肖/);
});

test('maps compact support preferences without treating record consent as interaction consent', () => {
  const guide = MoonCompanion.buildGuide(context({
    info: { phase: 'between', predicted: false, bleedingState: 'none' },
    partner: { nickname: '她', support: 'ask', likes: '', avoid: '', consent: false },
  }));
  assert.match(JSON.stringify(guide), /先问她再行动/);
  assert.doesNotMatch(JSON.stringify(guide), /已经选择先独处/);

  const alone = MoonCompanion.buildGuide(context({
    info: { phase: 'period', predicted: false, bleedingState: 'confirmed' },
    partner: { nickname: '她', support: 'alone', likes: '', avoid: '', consent: false },
  }));
  assert.match(JSON.stringify(alone), /不要求回复|独处/);
});

test('adds urgent pain guidance without prescribing a dose', () => {
  const guide = MoonCompanion.buildGuide(context({ pain: '8' }));
  assert.ok(guide.articleIds.includes('health-urgent-pain'));
  assert.match(guide.actions.at(-1).body, /联系医生|急诊/);
  assert.match(guide.actions.at(-1).body, /不提供药物剂量/);
  assert.doesNotMatch(guide.actions.at(-1).body, /mg|毫克|每小时|每次服/);
});

test('does not turn mood, personality, or metaphysical labels into a diagnosis', () => {
  const guide = MoonCompanion.buildGuide(context({
    mood: '焦虑',
    energy: 1,
    partner: { nickname: '她', mbti: 'ISTJ', bazi: '某八字', zodiac: '蛇' },
  }));
  const rendered = JSON.stringify(guide);
  assert.doesNotMatch(rendered, /焦虑|ISTJ|某八字|属蛇|生肖/);
  assert.match(guide.avoid, /当下的回答/);
});
