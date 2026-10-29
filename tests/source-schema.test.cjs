const test=require('node:test'),assert=require('node:assert/strict'),S=require('../public/state.js'),D=require('../public/day-context.js'),K=require('../public/catalog.js'),Care=require('../public/care-output.js');
const {analysis,today}=require('./helpers.cjs');
test('knowledge classifications agree across encyclopedia and model context, including shared medical and psychology sources',()=>{
  for(const a of K.articles)assert.deepEqual(D.articleSubjects(a.id),a.subjects,a.id);
  assert.deepEqual(D.articleSubjects('health-sleep'),['western','psychology']);
  assert.deepEqual(D.articleSubjects('phase-care-luteal'),['western']);
});
test('model schema restricts sources separately for each named section and nutrition',()=>{
  const input=D.makeInput(S.defaults(),today),ctx=D.build(input,K.articles,today),ids=ctx.articles.map(a=>a.id),groups=Object.fromEntries(Care.kinds.map(kind=>[kind,ctx.articles.filter(a=>a.subjects.includes(kind)).map(a=>a.id)]));
  const schema=Care.schema(ids,groups);assert.equal(schema.properties.sections.type,'object');
  assert.deepEqual(schema.properties.sections.required,Care.kinds);
  for(const kind of Care.kinds){const block=schema.properties.sections.properties[kind];assert.deepEqual(block.properties.kind.enum,[kind]);assert.deepEqual(block.properties.articleIds.items.enum,groups[kind]);}
  assert(schema.properties.sections.properties.western.properties.articleIds.items.enum.includes('health-sleep'));
  assert(!schema.properties.sections.properties.psychology.properties.articleIds.items.enum.some(id=>id.startsWith('phase-care-')));
  assert(schema.properties.food.properties.articleIds.items.enum.every(id=>id.startsWith('nutrition-')));
  const disabled=Care.schema(ids,{...groups,culture:[]});assert.equal(disabled.properties.sections.properties.culture.properties.articleIds.maxItems,0);
});
test('named model output becomes the stable four-section client format while source boundaries remain enforced',async()=>{
  const {createDayAnalyzer}=await import('../worker/day-ai.mjs'),input={...D.makeInput(S.defaults(),today),mode:'analysis',question:'',consent:true,history:[]};input.signature=D.signature(input,today);const context=D.build(input,K.articles,today),service=createDayAnalyzer({DayContext:D,catalog:K.articles});
  const raw=analysis();raw.sections=Object.fromEntries(raw.sections.map(s=>[s.kind,s]));
  const clean=service.validateAnalysis(raw,context);assert(Array.isArray(clean.sections));assert.equal(clean.sections.length,4);
  raw.sections.western.articleIds=['health-sleep'];assert.doesNotThrow(()=>service.validateAnalysis(raw,context));
  raw.sections.psychology.articleIds=['health-cycle-day-one'];assert.throws(()=>service.validateAnalysis(raw,context));
  delete raw.sections.psychology;assert.throws(()=>service.validateAnalysis(raw,context));
});

test('new actions reject silence-as-permission while allowing an explicit statement of its boundary',()=>{
 const base={when:'今晚准备晚饭前',task:'提供一次可拒绝的帮助',how:'说一句：要不要我帮你准备晚饭？',adjust:'她不回复也视为可以。'};
 assert.throws(()=>Care.action(base),/同意/);assert.doesNotThrow(()=>Care.action({...base,adjust:'不要把不回复当作同意；没有明确答复就不追加安排。'}));assert.doesNotThrow(()=>Care.action(base,{legacy:true}));
});
test('an analysis cannot deny an explicitly recorded current pain report',async()=>{
 const {createDayAnalyzer}=await import('../worker/day-ai.mjs'),p=S.defaults();p.entries[today]={pain:2};const context=D.build(D.makeInput(p,today),K.articles,today),service=createDayAnalyzer({DayContext:D,catalog:K.articles}),raw=analysis();
 raw.sections.find(s=>s.kind==='tcm').body='今天没有她报告的具体不适，不推断体质。';assert.throws(()=>service.validateAnalysis(raw,context),/denial/);
});
