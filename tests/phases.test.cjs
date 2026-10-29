const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
const P=require('../public/phases'),S=require('../public/state'),D=require('../public/day-context'),catalog=require('../public/catalog').articles;
const {app,change,submit,tick,mockAI,analysis,today}=require('./helpers.cjs');
const profile=()=>S.decode({periods:[{id:'p',start:'2026-10-01',end:'2026-10-05',status:'ended'}],cycleLength:28,periodLength:5});
const signal=(kind='lh_positive')=>({id:'s',kind,value:'本人报告',quote:'LH试纸阳性',source:'manual',sourceDate:'2026-10-14'});
const key=a=>{change(a,'#api-key','synthetic_only_key_1234567890');submit(a,'#api-form');};
test('four display segments are grounded in a real start; menstrual overlaps biological follicular phase without changing bleeding truth',()=>{
 const s=profile();for(const [date,kind]of [['2026-10-02','menstrual'],['2026-10-10','follicular'],['2026-10-15','ovulation'],['2026-10-20','luteal']])assert.equal(P.assess(s,date,today).key,kind);
 const p=P.assess(s,'2026-10-20',today);assert.equal(p.status,'estimated');assert.equal(p.start,'2026-10-16');assert.equal(p.end,'2026-10-28');assert.equal(p.remaining,9);assert.equal(p.windows.length,4);assert.deepEqual(p.ovulationWindow,{start:'2026-10-13',end:'2026-10-19'});assert.equal(P.assess(s,'2026-10-02',today).status,'recorded');
});
test('unknown, paused, late, abnormal intervals and ongoing bleeding cannot be quietly rolled into a fresh phase',()=>{
 assert.equal(P.assess(S.defaults(),today,today).key,'unknown');const s=profile();s.phaseTracking='paused';assert.equal(P.assess(s,today,today).key,'unknown');assert.equal(P.assess(s,'2026-10-02',today).key,'menstrual');s.phaseTracking='calendar';assert.equal(P.assess(s,'2026-10-30','2026-10-30').key,'unknown');assert.equal(P.assess(s,'2026-11-03','2026-10-30').key,'unknown');s.cycleLength=40;assert.equal(P.assess(s,today,today).key,'unknown');
 s.cycleLength=28;s.periods[0]={id:'p',start:'2026-10-01',end:null,status:'ongoing'};assert.equal(P.assess(s,today,today).key,'menstrual');assert.equal(P.assess(s,'2026-10-29',today).key,'unknown');
});
test('behavior and one temperature cannot move phases; compatible LH can refine a reference but conflicting LH suspends it',()=>{
 const s=profile(),baseline=P.assess(s,today,today);s.entries['2026-10-12']=S.entry({signals:[signal('behavior')]},'2026-10-12');s.entries['2026-10-13']=S.entry({signals:[signal('temperature')]},'2026-10-13');assert.equal(P.assess(s,today,today).start,baseline.start);
 s.entries['2026-10-13']=S.entry({signals:[signal()]},'2026-10-13');assert.equal(P.assess(s,today,today).start,'2026-10-15');s.entries['2026-10-25']=S.entry({signals:[signal()]},'2026-10-25');assert.equal(P.assess(s,today,today).key,'unknown');
});
test('annotations have bounded scope, real bleeding wins and a new actual cycle ends an old annotation',()=>{
 const s=profile();s.entries['2026-10-20']=S.entry({phaseHint:{phase:'luteal',until:'2026-10-25',reason:'用户根据记录标注'}},'2026-10-20');assert.equal(P.assess(s,'2026-10-22',today).status,'annotated');assert.equal(P.assess(s,today,today).status,'estimated');assert.throws(()=>P.hint({phase:'luteal',until:'2026-12-01',reason:'test'},'2026-10-20'));
 s.periods.push({id:'new',start:'2026-10-23',end:'2026-10-25',status:'ended'});assert.equal(P.assess(s,'2026-10-24',today).status,'recorded');assert.notEqual(P.assess(s,today,today).status,'annotated');
});
test('stage context is recomputed by the server, contains dated relevant signals and changes when records change',()=>{
 const s=profile();s.entries['2026-10-14']=S.entry({signals:[signal()]},'2026-10-14');const input=D.makeInput(s,today),c=D.build(input,catalog,today);assert.equal(c.phaseAssessment.key,'luteal');assert(c.articles.some(x=>x.id==='health-cycle-four-phases'));assert(input.phaseData.lhDates.includes('2026-10-14'));
 const before=D.signature(input,today);s.entries['2026-10-14'].signals=[];assert.notEqual(D.signature(D.makeInput(s,today),today),before);assert.throws(()=>P.normalizeInput({lhDates:['2026-10-29']},today,today));assert.doesNotThrow(()=>D.makeInput(S.defaults(),'1900-01-01'));
});
test('candidate quotes, event type, explicit negatives, dates and secrets are checked before human review',()=>{
 const source={id:'c',date:today,text:'她说今天月经开始了。她昨晚想独处，LH试纸阴性，还没结束。'},sources=P.evidence([source],today),base={date:today,kind:'bleeding_start',value:'月经开始',quote:'今天月经开始了',sourceId:'c'};
 assert.equal(P.candidates([base],sources,today).length,1);for(const patch of [{kind:'bleeding_start',quote:'昨晚想独处'},{kind:'lh_positive',quote:'LH试纸阴性'},{kind:'bleeding_end',quote:'还没结束'},{quote:'不存在的原句'},{date:'2026-10-29'}])assert.equal(P.candidates([{...base,...patch}],sources,today).length,0);
 assert.throws(()=>P.evidence([{...source,text:'api_key: sk-test_synthetic_secret_123456789'}],today));
});
const wrap=v=>new Response(JSON.stringify({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(v)}]}]}));
test('signals API sends only the consented snippets to the model and returns validated candidates without writing phases',async()=>{
 const p={...D.makeInput(profile(),today),mode:'signals',history:[],question:'',consent:true,phaseEvidence:[{id:'c',date:today,text:'她说今天月经开始了'}]};p.signature=D.signature(p,today);let body;const create=(await import(pathToFileURL(path.resolve(__dirname,'../worker/day-ai.mjs')))).createDayAnalyzer;
 const api=create({DayContext:D,catalog,now:()=>today,fetchImpl:async(url,o)=>{body=JSON.parse(o.body);return wrap({phaseCandidates:[{date:today,kind:'bleeding_start',value:'月经开始',quote:'今天月经开始了',sourceId:'c'}]});}});
 const r=await api.analyze(new Request('https://phase.test/api/day',{method:'POST',headers:{Origin:'https://phase.test','Content-Type':'application/json',Authorization:'Bearer synthetic_only_key_1234567890'},body:JSON.stringify(p)}));assert.equal(r.status,200);const data=await r.json();assert.equal(data.phaseCandidates.length,1);assert.equal(data.analysis,undefined);assert.equal(body.store,false);assert.deepEqual(JSON.parse(body.input[0].content),{phaseEvidence:p.phaseEvidence});assert(!body.instructions.includes('clinical-confirmed'));assert(!JSON.stringify(body).includes('synthetic_only_key'));
});
test('calendar phase labels open the existing day context, annotation refreshes immediately and ordinary note saves preserve signals',()=>{
 const s=profile(),a=app({data:s});try{assert.match(a.$('#phase-today-status').textContent,/黄体期/);assert.match(a.$('[data-date="2026-10-20"]').textContent,/黄体/);a.$('[data-date="2026-10-20"]').click();assert.match(a.$('#day-phase-panel').textContent,/黄体期/);change(a,'#phase-hint-kind','unknown');change(a,'#phase-hint-until','2026-10-28');change(a,'#phase-hint-reason','尚不确定，先记录');submit(a,'#phase-hint-form');assert.match(a.$('#phase-today-status').textContent,/人工标注/);
  change(a,'#phase-signal-kind','behavior');change(a,'#phase-signal-value','她说想安静陪伴');submit(a,'#phase-signal-form');change(a,'#day-note','测试小记');submit(a,'#day-record-form');assert.equal(JSON.parse(a.raw()).entries['2026-10-20'].signals.length,1);assert(JSON.parse(a.raw()).entries['2026-10-20'].phaseHint);
 }finally{a.close();}
});
test('chat candidates remain unselected and require confirmation before actual periods and stage views realign',async()=>{
 const a=app({data:S.defaults(),fetchImpl:async(url,o)=>{const p=JSON.parse(o.body);return {ok:true,json:async()=>({signature:p.signature,phaseCandidates:[{date:'2026-10-01',kind:'bleeding_start',value:'实际开始',quote:'她说10月1日月经开始了',sourceId:'import-0'},{date:'2026-10-05',kind:'bleeding_end',value:'实际结束',quote:'她说10月5日月经已经结束',sourceId:'import-1'}]})};}});try{
  key(a);a.$('#phase-import-open').click();change(a,'#phase-import-text','她说10月1日月经开始了\n她说10月5日月经已经结束');a.$('#phase-import-analyze').click();await tick();assert.equal(a.$('[data-phase-pick]'),null);a.$('#phase-import-consent').checked=true;a.$('#phase-import-analyze').click();await tick();assert.equal(JSON.parse(a.raw()).periods.length,0);assert.equal(a.$('[data-phase-pick]').checked,false);a.$('#phase-import-apply').click();assert.equal(JSON.parse(a.raw()).periods.length,0);
  for(const el of a.w.document.querySelectorAll('[data-phase-pick]'))el.checked=true;a.$('#phase-import-apply').click();assert.equal(JSON.parse(a.raw()).periods[0].start,'2026-10-01');assert.equal(JSON.parse(a.raw()).periods[0].end,'2026-10-05');assert.match(a.$('#phase-today-status').textContent,/黄体期/);const b=app({data:a.raw()});try{assert.match(b.$('#phase-today-status').textContent,/黄体期/);}finally{b.close();}
 }finally{a.close();}
});
test('deleting or stopping a linked source removes its phase influence, while recent behavior stays dated',()=>{
 const M=require('../public/memory');const s=profile();s.entries['2026-10-26']=S.entry({signals:[signal('behavior')]},'2026-10-26');assert(D.makeInput(s,today).recent.some(x=>x.observation.signals?.length));
 s.entries['2026-10-14']=S.entry({signals:[signal()]},'2026-10-14');const item={id:'m',category:'health_report',content:'测试长期报告',status:'confirmed',since:'2026-10-14',until:null,evidence:{date:'2026-10-14',kind:'note',sourceId:'n',quote:'测试长期报告'}};s.memory={...M.empty(),items:[item]};s.memory=M.stop(s.memory,'m',today);assert.deepEqual(D.makeInput(s,today).phaseData.lhDates,[]);
});
test('old chat extraction is discarded when profile changes before a delayed response',async()=>{
 let resolve;const a=app({data:profile(),fetchImpl:async(url,o)=>new Promise(r=>resolve=()=>r({ok:true,json:async()=>({signature:JSON.parse(o.body).signature,phaseCandidates:[]})}))});try{
  key(a);a.$('#phase-import-open').click();change(a,'#phase-import-text','她今天想独处');a.$('#phase-import-consent').checked=true;a.$('#phase-import-analyze').click();change(a,'#setting-cycle','29');submit(a,'#cycle-form');resolve();await tick();assert.match(a.$('#phase-import-status').textContent,/记录已变化/);assert.equal(a.$('#phase-import-apply').hidden,true);
 }finally{a.close();}
});
test('an annotation may span a forecast boundary; only a real new cycle cuts it off',()=>{
 const s=profile();s.entries['2026-10-25']=S.entry({phaseHint:{phase:'unknown',until:'2026-11-03',reason:'先待确认，不随预计日滚动'}},'2026-10-25');assert.equal(P.assess(s,'2026-11-01',today).status,'annotated');assert.equal(D.build(D.makeInput(s,'2026-11-01'),catalog,today).phaseAssessment.status,'annotated');
});
test('editing a stage immediately invalidates an open AI analysis without changing calendar dates',async()=>{
 const a=app({data:profile(),fetchImpl:mockAI()});try{key(a);a.$('#open-today').click();a.$('#day-analysis-consent').checked=true;a.$('#day-generate').click();await tick();assert.equal(a.$('#day-send').disabled,false);change(a,'#phase-hint-kind','unknown');change(a,'#phase-hint-until','2026-10-30');change(a,'#phase-hint-reason','正在核对阶段');submit(a,'#phase-hint-form');assert.equal(a.$('#day-send').disabled,false);assert.match(a.$('#day-analysis-status').textContent,/过期/);assert(JSON.parse(a.raw()).entries[today]);}finally{a.close();}
});
test('deleting a phase clue previews and cleans its dated original, derived memories, sessions and old backup import paths',()=>{
 const M=require('../public/memory'),s=profile(),quote='她说平时希望安静陪伴';s.entries[today]=S.entry({signals:[{...signal('behavior'),id:'clue',quote,value:quote}]},today);s.memory={...M.empty(),items:[{id:'derived',category:'support',content:'她平时希望安静陪伴',status:'confirmed',since:today,until:null,evidence:{date:today,kind:'chat',sourceId:'chat:'+today+':0',quote}}]};const a=app({data:s});try{a.$('#open-today').click();a.$('[data-remove-signal="clue"]').click();assert.equal(a.$('#memory-delete-dialog').open,true);assert(JSON.parse(a.raw()).entries[today]);a.$('#memory-delete-confirm').click();const after=JSON.parse(a.raw());assert.equal(after.entries[today],undefined);assert.equal(after.memory.items.length,0);assert.equal(after.periods.length,1);const Privacy=require('../public/memory-privacy');assert.equal(Privacy.importBundle(s,after).profile.entries[today],undefined);}finally{a.close();}
});
