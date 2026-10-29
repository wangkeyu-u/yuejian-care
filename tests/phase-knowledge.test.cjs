const {withGrounds}=require('./helpers.cjs');
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
const K=require('../public/phase-knowledge'),C=require('../public/catalog'),D=require('../public/day-context'),S=require('../public/state');
const {app,fixture,change,tick,today,action,food}=require('./helpers.cjs');
const profile=()=>S.decode({...fixture(),periods:[{id:'p',start:'2026-10-10',end:'2026-10-14',status:'ended'}]});
test('four phase guides share ordered sections and have complete item-level source provenance',()=>{
 assert.equal(K.articles.length,4);assert.equal(Object.keys(K.sources).length,12);const used=new Set();
 for(const a of K.articles){assert.deepEqual(a.sections.map(s=>s.id),K.sectionOrder.map(([id])=>id));assert.equal(a.paragraphSources.length,a.body.length);const itemIds=new Set();for(const section of a.sections){assert(section.items.length>=2);for(const p of section.items){assert(!itemIds.has(p.id));itemIds.add(p.id);assert(K.typeLabels[p.type]);assert(p.text);if(['fact','care'].includes(p.type))assert(p.refs.length,p.id);if(p.type==='editorial')assert.equal(p.refs.length,0);for(const id of p.refs){used.add(id);assert(K.sources[id]);assert(a.sources.some(x=>x.id===id));}}}
  for(const source of a.sources){assert(source.checkedAt);assert(source.supports.length>5);assert(/^https:\/\//.test(source.url));assert(a.verification.sourceNotes.some(x=>x.url===source.url));}assert(a.relatedArticleIds.every(id=>C.articles.some(x=>x.id===id)));
 }
 assert.deepEqual([...used].sort(),Object.keys(K.sources).sort());const g=K.get('luteal');g.sections[0].items[0].text='changed';assert(!K.get('luteal').body.includes('changed'));
});
test('phase reading and topic reading have distinct filters while sharing one article identity',()=>{
 assert.equal(C.filter({type:'phase'}).length,4);assert.equal(C.filter({type:'topic'}).length,54);assert.equal(C.filter({type:'phase',phase:'luteal'}).length,1);assert.equal(C.filter({type:'phase',phase:'menstrual',query:'经后卵泡'}).length,0);assert(C.relatedBooks('phase-care-luteal').length);assert(C.filter({type:'phase',saved:true,bookmarks:['phase-care-ovulation']}).every(a=>a.id==='phase-care-ovulation'));
});
test('day context selects only the matching phase by default and never treats reading another phase as a phase correction',()=>{
 const s=profile(),input=D.makeInput(s,today),before=JSON.stringify(s),ctx=D.build(input,C.articles,today);assert.equal(ctx.phaseAssessment.key,'luteal');assert.equal(ctx.phaseKnowledge.guideId,'phase-care-luteal');assert.deepEqual(ctx.phaseKnowledge.readingGuideIds,['phase-care-luteal']);const guide=ctx.articles.find(x=>x.id==='phase-care-luteal');assert.deepEqual(guide.body,K.get('luteal').body);assert.deepEqual(guide.paragraphSources,K.get('luteal').paragraphSources);
 const other=D.build(input,C.articles,today,'想了解卵泡期的安排','phase-care-follicular');assert.equal(other.phaseAssessment.key,'luteal');assert(other.phaseKnowledge.readingGuideIds.includes('phase-care-follicular'));assert.equal(JSON.stringify(s),before);
 const unknown=D.build(D.makeInput(S.defaults(),today),C.articles,today);assert.equal(unknown.phaseKnowledge.guideId,null);assert.deepEqual(unknown.phaseKnowledge.readingGuideIds,[]);
});
test('library exposes six ordered sections, inline citations, bookmarks and focused questions without a paid request',()=>{
 let calls=0;const a=app({data:profile(),hash:'knowledge',fetchImpl:async()=>{calls++;throw Error('should not call');}});try{
  a.$('[data-resource="phases"]').click();assert.equal(a.$('#library-subjects').hidden,true);assert.equal(a.$('#library-phases').hidden,false);assert.equal(a.w.document.querySelectorAll('#library-results [data-read-article]').length,4);a.$('[data-library-phase="luteal"]').click();assert.equal(a.w.document.querySelectorAll('#library-results [data-read-article]').length,1);a.$('[data-read-article="phase-care-luteal"]').click();
  assert.deepEqual([...a.w.document.querySelectorAll('[data-guide-section]')].map(x=>x.dataset.guideSection),K.sectionOrder.map(([id])=>id));assert(a.w.document.querySelectorAll('#article-body [data-evidence-type="care"] .point-source').length);assert.match(a.$('#article-body').textContent,/至少连续两个周期/);assert.match(a.$('#article-body').textContent,/各期通用/);assert(a.$('[data-evidence-type="editorial"]'));
  a.$('#article-body [data-bookmark]').click();assert.match(a.w.localStorage.getItem('yuejian.library.v1'),/phase-care-luteal/);a.$('#article-ask-day').click();assert.equal(a.$('#day-dialog').open,true);assert.match(a.$('#day-question').value,/黄体期/);assert.equal(calls,0);
 }finally{a.close();}
});
test('matching day action links to the exact same guide and unknown stage offers neutral reading choices',()=>{
 const a=app({data:profile()}),b=app({data:S.defaults()});try{a.$('#open-today').click();assert(a.$('#day-phase-panel [data-read-article="phase-care-luteal"]'));assert.match(a.$('#day-phase-panel .day-phase-care').textContent,/本站行动示例/);a.$('#day-phase-panel [data-read-article="phase-care-luteal"]').click();assert.match(a.$('#article-title').textContent,/黄体期/);b.$('#open-today').click();assert.equal(b.w.document.querySelectorAll('#day-phase-panel [data-read-article^="phase-care-"]').length,4);assert.match(b.$('#day-phase-panel').textContent,/阶段尚未确定/);}finally{a.close();b.close();}
});
test('relay sends the selected sourced phase guide to AI while preserving evidence-domain boundaries',async()=>{
 const p={...D.makeInput(profile(),today),mode:'analysis',consent:true,question:'',history:[]};p.signature=D.signature(p,today);const ctx=D.build(p,C.articles,today);let body;const create=(await import(pathToFileURL(path.resolve(__dirname,'../worker/day-ai.mjs')))).createDayAnalyzer;
 const result={summary:'测试建议',uncertainty:'阶段仅供参考',food:food(),sections:['culture','tcm','western','psychology'].map(kind=>({kind,title:kind,body:'依据资料与实际情况',actions:[action()],articleIds:[kind==='western'?'phase-care-luteal':kind==='psychology'?'health-pms':kind==='tcm'?'tcm-pain-language':'culture-stem-branch']})),memoryCandidates:[]};
 const api=create({DayContext:D,catalog:C.articles,now:()=>today,fetchImpl:async(url,o)=>{body=JSON.parse(o.body);return new Response(JSON.stringify({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(withGrounds(result))}]}]}));}});
 const r=await api.analyze(new Request('https://phaseguide.test/api/day',{method:'POST',headers:{Origin:'https://phaseguide.test','Content-Type':'application/json',Authorization:'Bearer synthetic_only_key_1234567890'},body:JSON.stringify(p)}));assert.equal(r.status,200);const sent=JSON.parse(body.input[0].content).day;assert.equal(sent.phaseKnowledge.guideId,'phase-care-luteal');assert(sent.articles.some(a=>a.id==='phase-care-luteal'&&a.paragraphSources.length===a.body.length));assert(!sent.articles.some(a=>a.id==='phase-care-follicular'));assert.match(body.instructions,/各期通用/);assert.equal(body.store,false);
 const bad=structuredClone(result);bad.sections.find(s=>s.kind==='psychology').articleIds=['phase-care-luteal'];assert.throws(()=>api.validateAnalysis(bad,ctx),/Invalid section sources/);
});
