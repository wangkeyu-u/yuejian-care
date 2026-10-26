const test = require('node:test');
const assert = require('node:assert/strict');
const { filterArticles, recommendedIds } = require('../dist/library-model.js');
const health = require('../dist/health-data.js').map(a => ({ ...a, kind: 'health' }));
const culture = require('../dist/culture-data.js').map(a => ({ ...a, kind: 'culture' }));
const all = [...health, ...culture];

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
