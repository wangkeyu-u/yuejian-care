const test = require('node:test');
const assert = require('node:assert/strict');
const { filterArticles, recommendedIds } = require('../public/library-model.js');
const health = require('../public/health-data.js').map(a => ({ ...a, kind: 'health' }));
const tcm = require('../public/tcm-data.js').map(a => ({ ...a, kind: 'tcm' }));
const culture = require('../public/culture-data.js').map(a => ({ ...a, kind: 'culture' }));
const all = [...health, ...tcm, ...culture];

test('culture stays hidden from search and saved items until explicitly enabled', () => {
  const bookmarks = [culture[0].id, health[0].id];
  assert.deepEqual(filterArticles(all, { kind: 'culture' }), []);
  assert.deepEqual(filterArticles(all, { kind: 'saved', bookmarks }).map(a => a.id), [health[0].id]);
  assert.equal(filterArticles(all, { kind: 'saved', bookmarks, cultureEnabled: true }).length, 2);
});

test('search handles Chinese spacing and case while combining category and bookmark filters', () => {
  const rows = filterArticles(all, { query: 'pMdD', category: '情绪睡眠' });
  assert(rows.some(a => a.id === 'health-pmdd'));
  assert(rows.every(a => a.kind === 'health' && a.category === '情绪睡眠'));
  assert(filterArticles(all, { query: '第 1 天' }).some(a => a.id === 'health-cycle-day-one'));
  assert.equal(filterArticles(all, { kind: 'saved', query: '五行', bookmarks: ['culture-day-stem-not-bazi'] }).length, 0);
  assert.equal(filterArticles(all, { query: '不存在的检索词xyz' }).length, 0);
});

test('daily knowledge recommendations respond to symptoms without using cultural attributes', () => {
  assert.equal(recommendedIds({ pain: 8 })[0], 'health-urgent-pain');
  assert.equal(recommendedIds({ mood: '紧绷' })[0], 'health-anxiety-cycle');
  assert(!recommendedIds({ mood: '很难受' }).includes('health-pmdd'));
  assert.equal(recommendedIds({ info: { phase: 'period', day: 1 } })[0], 'health-first-day');
  assert.deepEqual(recommendedIds({ zodiac: '蛇', element: '火' }), recommendedIds({ zodiac: '马', element: '水' }));
  for (const context of [{}, { pain: 10 }, { mood: '很难受' }, { info: { phase: 'late' } }]) {
    assert(recommendedIds(context).every(id => health.some(a => a.id === id)));
  }
});

test('published knowledge has distinct IDs, directly inspectable HTTPS sources, and readable content', () => {
  assert.equal(new Set(all.map(a => a.id)).size, all.length);
  for (const article of all) {
    assert(article.title && article.summary && article.body.length >= 2, article.id);
    assert(article.sources.length, article.id);
    assert(article.sources.every(s => s.title && /^https:\/\//.test(s.url)), article.id);
    assert(!article.body.some(p => /<script|javascript:/i.test(p)), article.id);
  }
});


test('TCM is independently filterable without enabling culture and bookmarks keep source categories', () => {
  const result = filterArticles(all, { kind: 'tcm' });
  assert(result.length >= 1);
  assert(result.every(a => a.kind === 'tcm'));
  const bookmarks = [tcm[0].id, culture[0].id];
  assert.deepEqual(filterArticles(all, { kind: 'saved', bookmarks }).map(a => a.id), [tcm[0].id]);
});

test('every published paragraph has a traceable source mapping or a declared editorial context', () => {
  for (const article of all) {
    const verification = article.verification;
    assert(verification, article.id + ' missing verification');
    assert(/^\d{4}-\d{2}-\d{2}$/.test(verification.checkedAt), article.id);
    assert(['clinical', 'traditional', 'editorial', 'mixed'].includes(verification.basis), article.id);
    assert(verification.note.trim().length >= 8, article.id);
    assert.equal(article.paragraphSources.length, article.body.length, article.id);
    assert(verification.sourceNotes.every(note => article.sources.some(source => source.url === note.url) && note.supports.trim().length >= 5), article.id);
    assert(article.sources.every(source => verification.sourceNotes.some(note => note.url === source.url)), article.id);
    for (const indices of article.paragraphSources) {
      assert(Array.isArray(indices), article.id);
      assert(indices.every(index => Number.isInteger(index) && index >= 0 && index < article.sources.length), article.id);
      if (!indices.length) assert(/编辑|产品|本工具|本站|自选|界面|设计|安排|记录/.test(verification.note), article.id + ' unmapped paragraph');
    }
  }
});
