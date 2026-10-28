const test=require('node:test'),assert=require('node:assert/strict');
const Catalog=require('../public/catalog.js'),all=Catalog.articles;
test('all 57 articles can be found through a subject and a question scene',()=>{assert.equal(all.length,57);assert.equal(new Set(all.map(a=>a.id)).size,57);for(const a of all){assert(a.subjects.length);assert(Catalog.scenes.includes(a.scene));assert(Catalog.filter({subject:a.subjects[0],scene:a.scene}).some(row=>row.id===a.id));}});
test('psychological sleep content is available through both psychology and physical medicine',()=>{const psych=Catalog.filter({subject:'psychology'});assert.equal(psych.length,4);assert(psych.every(a=>a.subjects.includes('western')));assert(Catalog.filter({subject:'tcm'}).every(a=>a.id.startsWith('tcm-')));assert.equal(Catalog.filter({subject:'culture'}).length,18);});
test('search, scene and saved filters combine without mixing evidence labels',()=>{assert(Catalog.filter({query:'pMdD',subject:'psychology'}).some(a=>a.id==='health-pmdd'));assert(Catalog.filter({query:'第 1 天'}).some(a=>a.id==='health-cycle-day-one'));assert.equal(Catalog.filter({saved:true,bookmarks:['tcm-pain-language'],subject:'tcm'}).length,1);assert.equal(Catalog.filter({query:'not-found-xyz'}).length,0);});
test('all knowledge keeps inspectable HTTPS sources and its own evidence basis',()=>{for(const a of all){assert(a.body.length>=2);assert(a.sources.length);assert(a.sources.every(s=>s.title&&/^https:\/\//.test(s.url)));assert(['clinical','traditional','editorial','mixed'].includes(a.verification.basis));}});
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
