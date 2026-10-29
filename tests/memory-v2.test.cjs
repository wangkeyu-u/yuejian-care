const test=require('node:test'),assert=require('node:assert/strict');
const M=require('../public/memory.js'),D=require('../public/day-context.js'),S=require('../public/state.js'),Sessions=require('../public/day-sessions.js');
const {app,fixture,change,submit,tick,mockAI,analysis,KEY,today}=require('./helpers.cjs');
const item=(patch={})=>({id:'m1',category:'support',content:'她通常喜欢提前商量陪伴',status:'confirmed',since:'2026-10-20',until:null,evidence:{date:'2026-10-20',kind:'note',sourceId:'note:2026-10-20',quote:'她通常喜欢提前商量陪伴'},createdAt:today,updatedAt:today,...patch});
const memory=(items=[])=>({...M.empty(),items});
const key=a=>{change(a,'#api-key','synthetic_only_key_1234567890');submit(a,'#api-form');};
const manual=(a,text)=>{a.$('#memory-add').click();change(a,'#memory-content',text);a.$('#memory-confirm').checked=true;submit(a,'#memory-form');};
test('v1 review deadlines migrate to reviewAt without silently ending medication; migration backup survives normal edits',()=>{
 const old={version:1,enabled:true,items:[item({category:'medication_report',until:'2026-10-27',content:'她正在服用医生开的药'})],ignored:[]},s={...fixture(),memory:old};
 const migrated=M.normalize(old);assert.equal(migrated.version,2);assert.equal(migrated.items[0].reviewAt,'2026-10-27');assert.equal(migrated.items[0].until,null);assert.equal(M.projected(migrated,today,today).items[0].reviewDue,true);
 const a=app({data:s});try{change(a,'#setting-cycle','29');submit(a,'#cycle-form');assert.equal(JSON.parse(a.w.localStorage.getItem(S.MEMORY_BACKUP)).memory.version,1);assert.match(a.$('#memory-count').textContent,/待复核 1/);}finally{a.close();}
});
test('short state ends by calendar date, remains usable for its actual historical dates and is never promoted automatically',()=>{
 const evidence=[{id:'q',kind:'chat',date:'2026-10-27',text:'她今天想自己安静休息'}],raw={scope:'short_term',sourceId:'q',category:'support',content:'10月27日她想独处',quote:evidence[0].text},c=M.validateCandidates([raw],evidence);
 assert.equal(c.length,1);assert.equal(M.validateCandidates([{...raw,scope:'long_term'}],evidence).length,0);
 let m=M.mergeCandidates(M.empty(),c,today).memory;assert.equal(m.items[0].until,today);assert.equal(M.active(m,today,today).length,0);m=M.approve(m,m.items[0],today);
 assert.equal(M.active(m,today,today).length,1);assert.equal(M.active(m,'2026-10-29','2026-10-29').length,0);assert.equal(M.active(m,'2026-10-27','2026-10-30').length,1);
});
test('question selection omits unrelated facts before the relay, preserves relevant risk reports and keeps a stable base signature',()=>{
 const s=S.decode(fixture());s.memory=memory([item(),item({id:'meal',category:'routine',content:'她通常吃燕麦早餐'}),item({id:'sleep',category:'routine',content:'她平时睡觉前不想聊天'}),item({id:'risk',category:'allergy_report',content:'她报告鸡蛋过敏'}),item({id:'culture',category:'comfort',content:'她平时喜欢读五行传统文化'})]);
 const food=D.makeInput(s,today,s.model,'早餐吃什么','chat'),culture=D.makeInput(s,today,s.model,'解释今天的五行','chat');
 assert(food.memory.items.some(x=>x.id==='risk'));assert(!food.memory.items.some(x=>x.id==='sleep'));assert(!JSON.stringify(food).includes('睡觉前不想聊天'));
 assert.deepEqual(culture.memory.items.map(x=>x.id),['culture']);assert.equal(D.signature(food,today),D.signature(culture,today));assert(!D.signature(food,today).includes('鸡蛋'));
 const forced=D.makeInput(s,today,s.model,'那个事情怎么办','chat','food');assert(forced.memory.items.some(x=>x.id==='meal'));
});
test('recent context carries only relevant records from the previous two dates and changes invalidate the base signature',()=>{
 const s=S.decode(fixture());s.entries['2026-10-26']=S.entry({pain:5,note:'她昨天腹痛，今天是否持续未知'});s.entries['2026-10-27']=S.entry({sleep:'poor',note:'她昨晚睡不好'});
 const pain=D.makeInput(s,today,s.model,'腹痛怎么办','chat'),culture=D.makeInput(s,today,s.model,'今天五行','chat');assert.deepEqual(pain.recent.map(x=>x.date),['2026-10-27','2026-10-26']);assert.equal(culture.recent.length,0);assert.equal(D.signature(pain,today),D.signature(culture,today));assert(!JSON.stringify(pain).includes('fixed-date-note'));
 const before=D.signature(pain,today);s.entries['2026-10-27'].sleep='okay';assert.notEqual(D.signature(D.makeInput(s,today),today),before);
 const invalid={...pain,recent:[{date:today,observation:{pain:10}}]};assert.throws(()=>D.normalize(invalid,today),/近期记录日期/);
});
test('correction preserves lineage, removes old versions from every date, while an actual change retains earlier validity',()=>{
 const old=item();let m=M.correct(memory([old]),old.id,item({id:'m2',content:'她通常希望提前一天约好陪伴'}),today,'correct');
 assert.equal(m.items.find(x=>x.id==='m2').rootId,'m1');assert.deepEqual(M.active(m,today,today).map(x=>x.id),['m2']);assert(!M.active(m,'2026-10-21',today).some(x=>x.id==='m1'));assert(M.blockedSource(m,'2026-10-20','note'));
 m=M.correct(memory([old]),old.id,item({id:'m3',since:'2026-10-26',content:'她现在偏好安静独处'}),today,'changed');
 assert.deepEqual(M.active(m,'2026-10-25',today).map(x=>x.id),['m1']);assert.deepEqual(M.active(m,today,today).map(x=>x.id),['m3']);assert.equal(m.blocks.length,0);
});
test('correcting in the UI invalidates old analysis and a newly regenerated result stays usable',async()=>{
 const log=[],data={...fixture(),memory:memory([item()])},a=app({data,fetchImpl:mockAI(log),hash:'settings'});try{
  key(a);a.$('#open-today').click();a.$('#day-analysis-consent').checked=true;a.$('#day-generate').click();await tick();a.$('#day-dialog').close();a.$('[data-memory-edit="m1"]').click();change(a,'#memory-content','她通常希望提前一天约好陪伴');a.$('#memory-confirm').checked=true;submit(a,'#memory-form');
  assert.match(a.$('#memory-system-preview').textContent,/提前一天/);a.$('#open-today').click();assert.equal(a.$('#day-send').disabled,false);a.$('#day-analysis-consent').checked=true;a.$('#day-generate').click();await tick();assert.equal(a.$('#day-send').disabled,false);assert(log[1].p.memory.items.every(x=>x.content!=='她通常喜欢提前商量陪伴'));
  change(a,'#day-question','现在怎么陪伴？');assert.equal(a.$('#day-ai-consent').checked,false);a.$('#day-ai-consent').checked=true;submit(a,'#day-chat-form');await tick();assert.equal(log.length,3);assert.equal(log[2].p.history.length,0);
 }finally{a.close();}
});
test('stopping retains visible originals, blocks source re-extraction and late requests cannot recreate a session',async()=>{
 let resolve;const data={...fixture(),entries:{'2026-10-20':{note:item().content}},memory:memory([item()])},a=app({data,hash:'settings',fetchImpl:async(url,opt)=>new Promise(r=>resolve=()=>r({ok:true,json:async()=>({analysis:analysis(),signature:JSON.parse(opt.body).signature,model:'gpt-4.1-mini',generatedAt:today})}))});try{
  key(a);a.$('#open-today').click();a.$('#day-analysis-consent').checked=true;a.$('#day-generate').click();a.$('#day-dialog').close();a.$('[data-memory-stop="m1"]').click();resolve();await tick();assert.equal(a.w.localStorage.getItem(Sessions.KEY),null);assert.equal(JSON.parse(a.raw()).entries['2026-10-20'].note,item().content);assert(!a.w.MoonMemoryUI.evidence().some(x=>x.date==='2026-10-20'));assert(!a.$('#memory-system-preview').textContent.includes(item().content));
 }finally{a.close();}
});
test('delete preview is explicit, confirmed delete clears sources and backups, importing the old file cannot resurrect them',async()=>{
 const data={...fixture(),memory:memory([item()]),entries:{'2026-10-20':{note:item().content}}},a=app({data,hash:'settings',extra:{[S.BACKUP]:data,[S.IMPORT]:{raw:JSON.stringify(data)}}});try{
  const before=a.raw();a.$('[data-memory-delete="m1"]').click();assert.equal(a.raw(),before);assert.equal(a.$('#memory-delete-dialog').open,true);assert.match(a.$('#memory-delete-preview').textContent,/2026-10-20/);a.$('#memory-delete-confirm').click();assert.equal(a.$('#memory-delete-dialog').open,false);assert.equal(JSON.parse(a.raw()).entries['2026-10-20'],undefined);assert.equal(a.w.localStorage.getItem(S.BACKUP),null);assert.equal(a.w.localStorage.getItem(S.IMPORT),null);
  Object.defineProperty(a.$('#import-file'),'files',{configurable:true,value:[{size:1000,text:async()=>JSON.stringify(data)}]});a.$('#import-file').dispatchEvent(new a.w.Event('change'));await tick();a.$('#import-confirm').click();assert.equal(JSON.parse(a.raw()).memory.items.length,0);assert.equal(JSON.parse(a.raw()).entries['2026-10-20'],undefined);a.$('#import-restore').click();assert.equal(JSON.parse(a.raw()).memory.items.length,0);
 }finally{a.close();}
});
test('changing memory selection starts a fresh model context so excluded facts cannot leak through old analysis or chat',async()=>{
 const log=[],a=app({data:{...fixture(),memory:memory([item(),item({id:'food',category:'allergy_report',content:'她报告鸡蛋过敏'})])},fetchImpl:mockAI(log)});try{
  key(a);a.$('#open-today').click();a.$('#day-analysis-consent').checked=true;a.$('#day-generate').click();await tick();
  change(a,'#day-question','晚餐吃什么？');a.$('#day-ai-consent').checked=true;submit(a,'#day-chat-form');await tick();assert.equal(log[1].p.analysis,undefined);assert.deepEqual(log[1].p.history,[]);assert(log[1].p.memory.items.some(x=>x.id==='food'));assert(!JSON.stringify(log[1].p).includes(item().content));
  change(a,'#day-question','改成面食可以吗？');change(a,'#day-memory-focus','food');a.$('#day-ai-consent').checked=true;submit(a,'#day-chat-form');await tick();assert.equal(log[2].p.history.length,2);
  change(a,'#day-question','今天五行的意思？');change(a,'#day-memory-focus','culture');a.$('#day-ai-consent').checked=true;submit(a,'#day-chat-form');await tick();assert.deepEqual(log[3].p.history,[]);assert.equal(log[3].p.analysis,undefined);assert(!JSON.stringify(log[3].p).includes('鸡蛋过敏'));
 }finally{a.close();}
});
test('importing a pre-change backup preserves the current lineage and its historical cutoff',()=>{
 const old=memory([item()]),current=M.correct(old,'m1',item({id:'new',since:'2026-10-26',content:'她现在偏好安静独处'}),today,'changed'),merged=M.reconcileImport(old,current);
 assert.deepEqual(M.active(merged,today,today).map(x=>x.id),['new']);assert.deepEqual(M.active(merged,'2026-10-25',today).map(x=>x.id),['m1']);
});
test('a new deliberate daily edit after deletion is usable without restoring a forgotten fact',()=>{
 const Privacy=require('../public/memory-privacy.js'),old=item(),m=M.forget(memory([old]),old.id),profile=S.decode(fixture());profile.memory=m;
 profile.entries['2026-10-20']=S.entry({note:'测试：今天希望安排面食',privacyBlocks:M.barrierTokens(m)});
 const clean=Privacy.sanitizeProfile(profile,m);assert(clean.entries['2026-10-20']);assert.equal(M.blockedSource(m,'2026-10-20','note',clean.entries['2026-10-20']),false);assert.equal(D.makeInput(clean,'2026-10-20').observation.note,'测试：今天希望安排面食');
 const source={id:'new-note',date:'2026-10-20',kind:'note',text:'她通常喜欢燕麦早餐',privacyBlocks:M.barrierTokens(m)},c=M.validateCandidates([{scope:'long_term',sourceId:source.id,category:'routine',content:source.text,quote:source.text}],[source]);assert.equal(M.mergeCandidates(m,c,today).added,1);
});
test('delete confirmation cannot silently expand after its preview when a session or backup changed',()=>{
 const data={...fixture(),memory:memory([item()])},a=app({data,hash:'settings'});try{
  const before=a.raw();a.$('[data-memory-delete="m1"]').click();assert.match(a.$('#memory-delete-preview').textContent,/相关分析\/对话 1 天|相关分析\/对话 0 天/);
  const fresh=JSON.stringify({[today]:{signature:'a',analysis:analysis(),messages:[],model:'gpt-4.1-mini',generatedAt:today,memoryIds:['m1']}});a.w.localStorage.setItem(Sessions.KEY,fresh);a.$('#memory-delete-confirm').click();assert.equal(a.raw(),before);assert.equal(a.w.localStorage.getItem(Sessions.KEY),fresh);assert.match(a.$('#memory-delete-error').textContent,/另一处更新/);
 }finally{a.close();}
});
