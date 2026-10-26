(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MoonLibraryModel = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const text = value => String(value || '').normalize('NFKC').toLocaleLowerCase('zh-CN').replace(/\s+/g, '');
  function filterArticles(articles, options = {}) {
    const { kind = 'health', query = '', category = '全部', bookmarks = [], cultureEnabled = false } = options;
    const words = String(query).trim().split(/\s+/).map(text).filter(Boolean);
    return articles.filter(article => {
      if (article.kind === 'culture' && !cultureEnabled) return false;
      if (kind === 'saved' ? !bookmarks.includes(article.id) : article.kind !== kind) return false;
      if (category !== '全部' && article.category !== category) return false;
      const content = text([article.title, article.summary, ...(article.body || []), ...(article.tags || [])].join(' '));
      return words.every(word => content.includes(word));
    });
  }
  function recommendedIds(context = {}) {
    if (Number(context.pain) >= 8) return ['health-urgent-pain', 'health-heat-bath'];
    if (context.mood === '很难受' || context.mood === '紧绷') return ['health-anxiety-cycle', 'health-sleep'];
    if (context.info?.phase === 'period' && context.info?.day === 1) return ['health-first-day', 'health-heat-bath'];
    if (context.info?.phase === 'period') return ['health-cramps', 'health-movement-swim'];
    if (context.info?.phase === 'late') return ['health-irregular', 'health-contraception'];
    return ['health-cycle-day-one', 'health-first-day'];
  }
  return { filterArticles, recommendedIds };
});
