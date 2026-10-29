const test=require('node:test'),assert=require('node:assert/strict');
const {app,fixture,change,submit,tick,mockAI,analysis,KEY,today}=require('./helpers.cjs');
const D=require('../public/day-context.js'),P=require('../public/phases.js'),K=require('../public/catalog.js'),C=require('../public/core.js');
const preview=a=>JSON.parse(a.$('#day-data-preview').textContent).preparedRequest;
const key=(a,provider='openai')=>{change(a,'#api-provider',provider);change(a,'#api-key','synthetic_'+provider+'_key_1234567890');submit(a,'#api-form');};
const receive=(a,b)=>{for(const name of [KEY,'yuejian.days.v1']){const raw=b.w.localStorage.getItem(name);if(raw===null)a.w.localStorage.removeItem(name);else a.w.localStorage.setItem(name,raw);a.w.dispatchEvent(new a.w.StorageEvent('storage',{key:name}));}};
const newAnalysis=async a=>{key(a);a.$('#open-today').click();a.$('#day-analysis-consent').checked=true;a.$('#day-generate').click();await tick();};

test('disabled cultural analysis removes birth details from the actual outbound request preview',()=>{
 const a=app({data:{...fixture(),birthday:'1995-06-15',birthConfirmed:true,birthTime:'09:30'}});try{
  a.$('#open-today').click();assert.equal(preview(a).culture.birthday,'1995-06-15');change(a,'#culture-toggle',false);a.$('#culture-toggle').checked=false;submit(a,'#personal-form');
  assert.equal(preview(a).culture.enabled,false);assert.equal(preview(a).culture.birthday,'');assert.equal(preview(a).culture.birthTime,'');assert.equal(JSON.parse(a.raw()).birthday,'1995-06-15');
 }finally{a.close();}
});
test('an import cannot relabel an unsaved provider key as the imported provider',async()=>{
 const a=app();try{
  change(a,'#api-key','synthetic_openai_unsaved_key_1234567890');const incoming={...fixture(),provider:'deepseek',model:'deepseek-flash'};
  Object.defineProperty(a.$('#import-file'),'files',{value:[{size:1000,text:async()=>JSON.stringify(incoming)}]});a.$('#import-file').dispatchEvent(new a.w.Event('change'));await tick();a.$('#import-confirm').click();
  assert.equal(a.$('#api-provider').value,'deepseek');assert.equal(a.$('#api-key').value,'');submit(a,'#api-form');assert.match(a.$('#api-status').textContent,/填写/);
 }finally{a.close();}
});
test('clearing one AI date retains the unsaved observations on another date',()=>{
 const a=app({extra:{'yuejian.days.v1':{'2026-10-26':{signature:'test',analysis:analysis(),messages:[],model:'gpt-4.1-mini',generatedAt:''}}}});try{
  a.$('#open-today').click();change(a,'#day-note','合成草稿：今天想早点休息');a.$('#day-dialog').close();a.$('[data-remove-day-ai="2026-10-26"]').click();a.$('#open-today').click();assert.equal(a.$('#day-note').value,'合成草稿：今天想早点休息');assert(!a.raw().includes('合成草稿'));
 }finally{a.close();}
});
test('failed API key persistence does not save a different provider or invalidate existing analyses',async()=>{
 const log=[],a=app({fetchImpl:mockAI(log)});try{
  await newAnalysis(a);const before=a.raw();change(a,'#api-provider','deepseek');change(a,'#api-key','synthetic_deepseek_new_key_1234567890');const proto=a.w.Storage.prototype,original=proto.setItem;proto.setItem=function(k,v){if(this===a.w.sessionStorage)throw Error('合成会话存储失败');return original.call(this,k,v);};
  submit(a,'#api-form');assert.equal(a.raw(),before);assert.match(a.$('#api-status').textContent,/存储失败/);assert(!a.$('#day-analysis-status').textContent.includes('过期'));proto.setItem=original;
 }finally{a.close();}
});
test('clear local data removes unsaved key input as well as records and previews',()=>{
 const a=app();try{
  change(a,'#api-key','synthetic_unsaved_key_1234567890');a.$('#delete-confirm').checked=true;a.$('#delete-confirm').dispatchEvent(new a.w.Event('change'));a.$('#delete-data').click();assert.equal(a.$('#api-key').value,'');assert.equal(a.w.localStorage.getItem(KEY),null);assert.match(a.$('#local-data-overview').textContent,/0 次经期/);a.$('#open-today').click();assert.equal(preview(a).profile.periods.length,0);
 }finally{a.close();}
});

for(const field of ['cycleLength','periodLength'])test(`${field} changes update forecast, open day and outgoing data without moving dated notes`,()=>{
 const a=app();try{
  a.$('#open-today').click();const before=preview(a),dates=Object.keys(JSON.parse(a.raw()).entries);change(a,field==='cycleLength'?'#setting-cycle':'#setting-duration',field==='cycleLength'?'31':'7');submit(a,'#cycle-form');const next=preview(a),profile=JSON.parse(a.raw()),ctx=D.build(next,K.articles,today);assert.equal(next.profile[field],field==='cycleLength'?31:7);assert.notEqual(next.signature,before.signature);assert.deepEqual(ctx.phaseAssessment,P.assess(profile,today,today));assert.deepEqual(Object.keys(profile.entries),dates);assert.equal(profile.periods[0].end,'2026-10-24');if(field==='cycleLength')assert.match(a.$('#next-period').textContent,/11 月 20/);
 }finally{a.close();}
});
test('correcting a start, undoing, and deleting keeps each visible and AI date aligned',async()=>{
 const a=app({fetchImpl:mockAI()});try{
  await newAnalysis(a);a.$('[data-edit-period="p"]').click();change(a,'#period-date','2026-10-18');change(a,'#period-end','2026-10-22');submit(a,'#period-form');
  assert.match(a.$('#day-analysis-status').textContent,/过期/);const ctx=D.build(preview(a),K.articles,today);assert.equal(ctx.info.cycleStart,'2026-10-18');assert.match(a.$('#next-period').textContent,/11 月 15/);assert.equal(JSON.parse(a.raw()).entries['2026-10-25'].note,'fixed-date-note');
  a.$('#calendar-period-undo').click();assert.equal(D.build(preview(a),K.articles,today).info.cycleStart,'2026-10-20');assert(!a.$('#day-analysis-status').textContent.includes('过期'));
  a.$('[data-edit-period="p"]').click();a.$('#period-delete').click();assert.equal(preview(a).profile.periods.length,0);assert.match(a.$('#next-period').textContent,/等待实际记录/);assert.match(a.$('#day-analysis-status').textContent,/过期/);
 }finally{a.close();}
});
test('pausing and resuming phase estimates changes calendar, phase panel and request together',()=>{
 const a=app();try{
  a.$('#open-today').click();change(a,'#phase-tracking','paused');submit(a,'#phase-tracking-form');const paused=D.build(preview(a),K.articles,today);assert.equal(paused.phaseAssessment.key,'unknown');assert.match(a.$('#day-phase').textContent,/阶段待确认/);assert(!a.$('[data-date="'+today+'"]').classList.contains('phase-follicular'));
  change(a,'#phase-tracking','calendar');submit(a,'#phase-tracking-form');assert.equal(D.build(preview(a),K.articles,today).phaseAssessment.key,'follicular');assert.match(a.$('#day-phase').textContent,/经后卵泡/);
 }finally{a.close();}
});
test('personal support/diet updates invalidate old advice and revoking use excludes preferences immediately',async()=>{
 const a=app({fetchImpl:mockAI()});try{
  await newAnalysis(a);change(a,'#partner-dietary','合成限制：不吃花生');change(a,'#partner-support','alone');a.$('#partner-consent').checked=true;submit(a,'#partner-form');assert.equal(preview(a).preferences.dietary,'合成限制：不吃花生');assert.equal(preview(a).observation.support,'alone');assert.match(a.$('#day-analysis-status').textContent,/过期/);assert.match(a.$('#day-food').textContent,/不吃花生/);
  a.$('#partner-consent').checked=false;submit(a,'#partner-form');assert.equal(preview(a).preferences.dietary,'');assert.equal(preview(a).observation.support,'ask');assert(!a.$('#day-food').textContent.includes('已记录限制/过敏报告：合成限制'));
 }finally{a.close();}
});
test('a second tab refreshes the open day and keeps any same-day draft while using new settings',()=>{
 const a=app(),b=app();try{
  a.$('#open-today').click();change(a,'#day-note','合成当前草稿');change(b,'#setting-cycle','32');submit(b,'#cycle-form');receive(a,b);assert.equal(preview(a).profile.cycleLength,32);assert.equal(a.$('#setting-cycle').value,'32');assert.equal(a.$('#day-note').value,'合成当前草稿');assert.match(a.$('#next-period').textContent,/11 月 21/);
 }finally{a.close();b.close();}
});

test('API setting write failure restores the previous key and its retention choice',()=>{
 const a=app();try{
  key(a);const before=a.raw(),stored=a.w.sessionStorage.getItem('yuejian.ai.session.v1');change(a,'#api-key','synthetic_replacement_key_1234567890');const proto=a.w.Storage.prototype,original=proto.setItem;proto.setItem=function(k,v){if(this===a.w.localStorage&&k===KEY)throw Error('合成档案写入失败');return original.call(this,k,v);};submit(a,'#api-form');proto.setItem=original;
  assert.equal(a.raw(),before);assert.equal(a.w.sessionStorage.getItem('yuejian.ai.session.v1'),stored);assert.match(a.$('#api-status').textContent,/档案写入失败/);
 }finally{a.close();}
});
test('failed import retains unrelated page drafts and rolls persisted data back',async()=>{
 const a=app();try{
  a.$('#open-today').click();change(a,'#day-note','合成导入失败前的草稿');a.$('#day-dialog').close();change(a,'#api-key','synthetic_original_unsaved_key_1234567890');const before=a.raw();
  Object.defineProperty(a.$('#import-file'),'files',{value:[{size:1000,text:async()=>JSON.stringify({...fixture(),cycleLength:35})}]});a.$('#import-file').dispatchEvent(new a.w.Event('change'));await tick();
  const proto=a.w.Storage.prototype,original=proto.setItem;let failed=false;proto.setItem=function(k,v){if(this===a.w.localStorage&&k===KEY&&!failed){failed=true;throw Error('合成导入写入失败');}return original.call(this,k,v);};a.$('#import-confirm').click();proto.setItem=original;
  assert.equal(a.raw(),before);assert.equal(a.$('#api-key').value,'synthetic_original_unsaved_key_1234567890');a.$('#open-today').click();assert.equal(a.$('#day-note').value,'合成导入失败前的草稿');
 }finally{a.close();}
});
