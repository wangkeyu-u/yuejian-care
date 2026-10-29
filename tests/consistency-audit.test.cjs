const {withGrounds}=require('./helpers.cjs');
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../public/core.js'),S=require('../public/state.js'),D=require('../public/day-context.js'),P=require('../public/phases.js'),F=require('../public/forecast.js'),M=require('../public/memory.js'),K=require('../public/catalog.js');
const {app,fixture,change,submit,tick,mockAI,analysis,action,KEY,today}=require('./helpers.cjs');
const broadcast=(a,b)=>{a.w.localStorage.setItem(KEY,b.raw());a.w.dispatchEvent(new a.w.StorageEvent('storage',{key:KEY,newValue:b.raw()}));};
const setKey=a=>{change(a,'#api-key','synthetic_only_key_1234567890');submit(a,'#api-form');};

test('long histories keep the same dated cycle and phase in calendar and AI, with a bounded request',()=>{
  let start='2018-01-01';const periods=Array.from({length:90},(_,i)=>{const p={id:'history-'+i,start,end:C.addDays(start,4),status:'ended'};start=C.addDays(start,[26,28,30][i%3]);return p;});
  const profile=S.decode({...fixture(),periods},today);
  for(const p of periods)for(const offset of [0,4,6,14,21]){
    const date=C.addDays(p.start,offset),input=D.makeInput(profile,date),ctx=D.build(input,K.articles,today);
    assert(input.profile.periods.length<=15);
    assert.equal(ctx.info.cycleStart,p.start,date);
    assert.deepEqual(ctx.phaseAssessment,P.assess(profile,date,today),date);
    assert.equal(ctx.forecast.lastStart,p.start,date);
  }
});

test('LH observations align between calendar and day context without using reports after the selected day',()=>{
  const signal={id:'lh',kind:'lh_positive',value:'LH阳性',quote:'今天LH试纸阳性',source:'manual',sourceDate:'2026-10-17'};
  const profile=S.decode({...fixture(),periods:[{id:'p',start:'2026-10-01',end:'2026-10-05',status:'ended'}],entries:{'2026-10-17':{signals:[signal]}}},today);
  for(const date of ['2026-10-15','2026-10-17','2026-10-18']){
    const local=P.assess(profile,date,today),ctx=D.build(D.makeInput(profile,date),K.articles,today);
    assert.deepEqual(ctx.phaseAssessment,local);
    assert(local.sourceDates.every(d=>d<=date));
  }
  assert.equal(P.assess(profile,'2026-10-15',today).key,'ovulation');
  assert.equal(P.assess(profile,'2026-10-18',today).key,'ovulation');
});

test('unsaved setting drafts survive unrelated updates and merge only their own setting group',()=>{
  const a=app(),b=app();try{
    change(a,'#partner-likes','合成测试：喜欢面条');change(b,'#setting-cycle','30');submit(b,'#cycle-form');broadcast(a,b);
    assert.equal(a.$('#partner-likes').value,'合成测试：喜欢面条');assert.equal(a.$('#setting-cycle').value,'30');
    submit(a,'#partner-form');assert.equal(JSON.parse(a.raw()).partner.likes,'合成测试：喜欢面条');assert.equal(JSON.parse(a.raw()).cycleLength,30);
    assert.match(a.$('#next-period').textContent,/11 月 19/);
  }finally{a.close();b.close();}
});

test('same-group concurrent edits cannot silently replace the newer values and can be reloaded',()=>{
  const a=app(),b=app();try{
    change(a,'#partner-likes','合成草稿A');change(b,'#partner-likes','合成已保存B');submit(b,'#partner-form');broadcast(a,b);
    assert.equal(a.$('#partner-likes').value,'合成草稿A');submit(a,'#partner-form');assert.equal(a.raw(),b.raw());assert.match(a.$('#toast').textContent,/草稿已保留/);
    a.$('[data-reset-settings="partner-form"]').click();assert.equal(a.$('#partner-likes').value,'合成已保存B');assert(!a.$('#settings-save-status').textContent.includes('未保存'));
  }finally{a.close();b.close();}
});

test('phase drafts survive a record refresh, conflict safely, and do not leak into a different date',()=>{
  const a=app(),b=app();try{
    a.$('#open-today').click();change(a,'#phase-hint-kind','luteal');change(a,'#phase-hint-reason','合成待核对标注');change(a,'#phase-signal-value','合成今日情况');
    change(b,'#setting-cycle','30');submit(b,'#cycle-form');broadcast(a,b);
    assert.equal(a.$('#phase-hint-reason').value,'合成待核对标注');assert.equal(a.$('#phase-signal-value').value,'合成今日情况');
    submit(a,'#phase-hint-form');assert.match(a.$('#phase-day-error').textContent,/另一处更新/);assert.equal(a.raw(),b.raw());
    a.$('#day-next').click();assert.equal(a.$('#phase-hint-reason').value,'');assert.equal(a.$('#phase-signal-value').value,'');
  }finally{a.close();b.close();}
});

test('Shanghai midnight refreshes an open page and discards a request made under yesterday context',async()=>{
  let resolve,checkClock;const a=app({at:'2026-10-28T15:59:30Z',onInterval:(callback,ms)=>{assert.equal(ms,60000);checkClock=callback;},fetchImpl:async()=>new Promise(r=>{resolve=r;})});try{
    setKey(a);a.$('#open-today').click();a.$('#day-analysis-consent').checked=true;a.$('#day-generate').click();
    a.advance('2026-10-28T16:00:30Z');checkClock();assert.equal(a.$('#today-label').textContent,'2026 / 10 / 29');
    resolve({ok:true,json:async()=>({analysis:analysis(),signature:'yesterday',model:'gpt-4.1-mini',generatedAt:''})});await tick();
    assert.equal(a.w.localStorage.getItem('yuejian.days.v1'),null);assert.equal(a.$('#day-ai-consent').checked,false);assert.equal(a.$('#day-analysis-consent').checked,false);
    a.$('#open-today').click();assert.equal(a.$('#day-title').textContent,'2026 / 10 / 29');assert.equal(a.$('#day-note').disabled,false);
  }finally{a.close();}
});

test('a valid self-export sized above the former 2MiB limit can be imported and restored',async()=>{
  const data=fixture();data.days={};for(let i=0;i<7;i++)data.days[C.addDays(today,-i)]={signature:'synthetic',analysis:analysis(),messages:Array.from({length:100},(_,j)=>({role:j%2?'assistant':'user',content:'x'.repeat(3000)})),model:'gpt-4.1-mini',generatedAt:''};
  const exported=JSON.stringify(data),a=app();try{
    assert(Buffer.byteLength(exported)>2*1024*1024);const before=a.raw();
    Object.defineProperty(a.$('#import-file'),'files',{configurable:true,value:[{size:Buffer.byteLength(exported),text:async()=>exported}]});
    a.$('#import-file').dispatchEvent(new a.w.Event('change'));await tick();assert.equal(a.$('#import-confirm').hidden,false);
    a.$('#import-confirm').click();assert.equal(Object.keys(JSON.parse(a.w.localStorage.getItem('yuejian.days.v1'))).length,7);
    a.$('#import-restore').click();assert.deepEqual(JSON.parse(a.raw()).periods,JSON.parse(before).periods);assert.equal(a.w.localStorage.getItem('yuejian.days.v1'),null);
  }finally{a.close();}
});

test('old AI conversations can be cleared and undone while dated notes and actual periods stay intact',()=>{
  const a=app({extra:{'yuejian.days.v1':{[today]:{signature:'synthetic',analysis:analysis(),messages:[],model:'gpt-4.1-mini',generatedAt:''}}}});try{
    const before=a.raw();a.$('[data-remove-day-ai]').click();assert.deepEqual(JSON.parse(a.w.localStorage.getItem('yuejian.days.v1')),{});assert.equal(a.raw(),before);assert.equal(a.$('#day-ai-undo').hidden,false);
    a.$('#day-ai-undo').click();assert(JSON.parse(a.w.localStorage.getItem('yuejian.days.v1'))[today]);assert.equal(a.raw(),before);
    assert.match(a.$('#local-storage-usage').textContent,/MiB/);
  }finally{a.close();}
});

test('an explicit backup replacement resets drafts so old values cannot be written back accidentally',async()=>{
  const a=app();try{
    change(a,'#partner-likes','合成旧草稿');const incoming={...fixture(),partner:{likes:'合成导入值'}};
    Object.defineProperty(a.$('#import-file'),'files',{configurable:true,value:[{size:1000,text:async()=>JSON.stringify(incoming)}]});a.$('#import-file').dispatchEvent(new a.w.Event('change'));await tick();a.$('#import-confirm').click();
    assert.equal(a.$('#partner-likes').value,'合成导入值');assert.equal(a.$('[data-reset-settings="partner-form"]').hidden,true);
  }finally{a.close();}
});

test('the saved-date list is paged even when 400 analysis dates are present',()=>{
  const days={};for(let i=0;i<400;i++)days[C.addDays(today,-i)]={signature:'synthetic',analysis:analysis(),messages:[],model:'gpt-4.1-mini',generatedAt:''};
  const a=app({extra:{'yuejian.days.v1':days}});try{
    assert.equal(a.w.document.querySelectorAll('#saved-days [data-open-day]').length,30);assert.equal(a.$('#saved-days-more').hidden,false);
    a.$('#saved-days-more').click();assert.equal(a.w.document.querySelectorAll('#saved-days [data-open-day]').length,60);
  }finally{a.close();}
});

test('all knowledge paragraphs, support scopes, categories and related books retain valid references',()=>{
  const ids=new Set(K.articles.map(a=>a.id));assert.equal(ids.size,K.articles.length);
  for(const a of K.articles){assert.equal(a.paragraphSources.length,a.body.length,a.id);assert(a.subjects.length&&a.subjects.every(x=>x in K.subjects));
    for(const refs of a.paragraphSources)for(const n of refs)assert(Number.isInteger(n)&&a.sources[n]?.url,a.id);
    for(const source of a.sources){assert(/^https:\/\//.test(source.url),a.id);assert(a.verification.sourceNotes.some(n=>n.url===source.url&&n.supports),a.id);}
    for(const id of a.relatedArticleIds||[])assert(ids.has(id),a.id);
    assert(D.build(D.makeInput(S.decode(fixture(),today),today),K.articles,today,'',a.id).articles.some(x=>x.id===a.id),a.id);
  }
  for(const b of K.books)for(const id of b.related)assert(ids.has(id),b.id);
});

test('source guards preserve dated deletion and explicit re-recording acknowledgements',()=>{
  const m=M.empty();m.blocks=[{rootId:'deleted',ids:[],sources:[{date:'2026-10-20',kind:'note',sourceId:'note:2026-10-20'}],mode:'delete',at:today,keys:[]}];
  const blocked=M.sourceGuard(m);assert(blocked('2026-10-20','note',{}));assert(!blocked('2026-10-20','chat',{}));assert(!blocked('2026-10-21','note',{}));assert(!blocked('2026-10-20','note',{privacyBlocks:M.barrierTokens(m)}));
  assert(blocked('2026-10-20','note',{privacyBlocks:M.barrierTokens(m).join('')}));
});

test('analysis, follow-up, memory and signal prompts each request only their intended output contract',async()=>{
  const {createDayAnalyzer}=await import('../worker/day-ai.mjs');
  for(const mode of ['analysis','chat','memory','signals']){
    let sent;const profile=S.decode(fixture(),today),input={...D.makeInput(profile,today),mode,question:mode==='chat'?'晚餐可以换成什么？':'',history:[],consent:true,memoryEvidence:[],phaseEvidence:[]};input.signature=D.signature(input,today);
    const answer=mode==='analysis'?{...analysis(),memoryCandidates:[]}:mode==='chat'?{reply:'先确认她想替换哪一种食材。',actions:[action()],articleIds:['nutrition-meal-pattern'],uncertainty:'需核对已知忌口。',memoryCandidates:[]}:mode==='memory'?{memoryCandidates:[]}:{phaseCandidates:[]};
    const service=createDayAnalyzer({DayContext:D,catalog:K.articles,now:()=>today,fetchImpl:async(url,options)=>{sent=JSON.parse(options.body);return new Response(JSON.stringify({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(withGrounds(answer))}]}]}));}});
    const response=await service.analyze(new Request('https://care.test/api/day',{method:'POST',headers:{Origin:'https://care.test','Content-Type':'application/json',Authorization:'Bearer synthetic_only_key_1234567890'},body:JSON.stringify(input)}));assert.equal(response.status,200,mode);
    assert.equal(sent.store,false);assert.equal(sent.text.format.strict,true);
    if(mode==='analysis'){assert(sent.text.format.schema.required.includes('food'));assert.match(sent.instructions,/一件最值得现在做的事/);}
    else {assert(!sent.text.format.schema.required.includes('food'));assert(!sent.instructions.includes('另输出food（今天吃什么）'));}
    if(mode==='chat')assert.match(sent.instructions,/只回答当前问题/);
    if(mode==='memory'){assert.deepEqual(sent.text.format.schema.required,['memoryCandidates']);assert(!sent.instructions.includes('每个领域必须'));}
    if(mode==='signals'){assert.deepEqual(sent.text.format.schema.required,['phaseCandidates']);assert(!sent.instructions.includes('每个领域必须'));}
  }
});
