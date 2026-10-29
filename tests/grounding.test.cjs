const test=require('node:test'),assert=require('node:assert/strict');
const G=require('../public/grounding.js'),D=require('../public/day-context.js'),S=require('../public/state.js'),M=require('../public/memory.js'),K=require('../public/catalog.js').articles,Sessions=require('../public/day-sessions.js');
const {analysis,withGrounds,app,fixture,change,submit,tick,today}=require('./helpers.cjs');
const profile=()=>S.decode(fixture(),today),context=()=>D.build(D.makeInput(profile(),today),K,today);
const req=p=>new Request('https://care.test/api/day',{method:'POST',headers:{Origin:'https://care.test','Content-Type':'application/json',Authorization:'Bearer synthetic_only_key_1234567890'},body:JSON.stringify(p)});
const wrap=value=>new Response(JSON.stringify({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(value)}]}]}));
const memoryItem=(patch={})=>({id:'m',scope:'long_term',category:'support',content:'她通常希望提前一天商量陪伴',status:'confirmed',since:'2026-10-20',until:null,reviewAt:'2026-10-29',reporter:'self',evidence:{date:'2026-10-20',kind:'note',sourceId:'note:2026-10-20',quote:'她通常希望提前一天商量陪伴'},...patch});
test('every summary, domain, individual action and meal has a bounded paragraph reference',()=>{
 const raw=withGrounds(analysis()),ctx=context(),g=G.verify(raw,ctx);assert.deepEqual(new Set(g.items.flatMap(x=>x.targets)),new Set(G.targets(raw)));const citation=g.items.find(x=>x.targets.includes('psychology')).citations[0];assert.equal(citation.paragraph,1);assert(citation.sources.some(s=>s.url.includes('nhs.uk')));assert.match(citation.note,/NHS/);assert.deepEqual(G.snapshot(g),g);
});
test('missing targets, duplicate targets, invented records, fabricated quotes and wrong domains fail closed',()=>{
 for(const change of [v=>delete v.grounds,v=>v.grounds[0].targets=[],v=>v.grounds[0].targets=['summary','summary'],v=>v.grounds[0].recordIds=['memory:deleted'],v=>v.grounds[0].citations[0].quote='不存在的医学结论引用',v=>{v.grounds.find(g=>g.targets.includes('tcm')).citations=[{articleId:'health-sleep',quote:K.find(a=>a.id==='health-sleep').body[0].slice(0,40)}];},v=>v.grounds.find(g=>g.targets.includes('food')).targets.pop()]){const raw=withGrounds(analysis());change(raw);assert.throws(()=>G.verify(raw,context()));}
});
test('record evidence preserves dates, uncertainty, reporting source and independent review deadlines',()=>{
 const p=profile();p.memory={...M.empty(),items:[memoryItem()]};p.entries[today]={sleep:'poor'};const c=D.build(D.makeInput(p,today),K,'2026-10-29'),rows=G.records(c,'如果她很难受怎么办？');assert.equal(rows.find(r=>r.id==='day:sleep').text,'睡不好');const m=rows.find(r=>r.id==='memory:m');assert.match(m.label,/本人表达.*待复核/);assert.match(m.text,/复核日 2026-10-29/);assert.match(rows.find(r=>r.id==='question').label,/不等于事实/);assert.match(rows.find(r=>r.id==='phase').text,/参考范围/);
});
test('unrelated short-term memories do not leak into culture or food questions through priority boosts',()=>{
 const m={...M.empty(),items:[memoryItem({scope:'short_term',until:'2026-10-30',reviewAt:null})]};assert.equal(M.select(m,today,today,'今天五行如何','chat').length,0);assert.equal(M.select(m,today,today,'午餐吃什么','chat').length,0);assert.equal(M.select(m,today,today,'怎么陪伴','chat').length,1);
});
test('policy-adjusted actions cite the local boundary rule rather than retaining the model rationale',()=>{
 const ctx=context();ctx.observation.support='独处';const v=withGrounds(analysis());v.summary='主动送饭到门口';for(const s of v.sections){s.actions[0].task='整理自己的安排';s.actions[0].how='先整理自己的安排，暂不新增邀约。';}v.food.actions[0].task='核对备选清单';v.food.actions[0].how='先核对备选食材的标签，暂不下单。';const g=G.verify(v,ctx),result=D.CareRules.analysis(v,ctx),adjusted=G.reconcile(g,v,result,ctx);assert.equal(adjusted.items.find(x=>x.targets.includes('summary')).origin,'rule');assert.match(adjusted.items.find(x=>x.targets.includes('summary')).reason,/未记录明确委托/);
});
test('relay rejects an ungrounded fresh answer, accepts grounded output and keeps errors away from personal storage',async()=>{
 const {createDayAnalyzer}=await import('../worker/day-ai.mjs'),p={...D.makeInput(profile(),today),mode:'analysis',question:'',history:[],consent:true};p.signature=D.signature(p,today);let calls=0;
 const run=raw=>createDayAnalyzer({DayContext:D,catalog:K,now:()=>today,fetchImpl:async()=>{calls++;return wrap(raw);}}).analyze(req(p));
 const bad=await run(analysis());assert.equal(bad.status,502);assert.match((await bad.json()).error,/依据/);const good=await run(withGrounds(analysis()));assert.equal(good.status,200);const data=await good.json();assert(data.analysis.grounding.items.length);assert.equal(calls,2);
});
test('grounding survives save, reload and rendering while legacy outputs are not silently given new evidence',()=>{
 const value=analysis();value.grounding=G.verify(withGrounds(value),context());const record={kind:'analysis',signature:D.signature(D.makeInput(profile(),today),today),analysis:value,messages:[{role:'assistant',content:'测试',grounding:value.grounding}],model:'gpt-4.1-mini',generatedAt:today};const decoded=Sessions.decode({[today]:record});assert(decoded[today].analysis.grounding);assert(decoded[today].messages[0].grounding);const a=app({extra:{[Sessions.KEY]:decoded}});try{a.$('#open-today').click();assert.match(a.$('#day-analysis').textContent,/第 1 段/);assert.match(a.$('#day-food').textContent,/适用边界/);assert.equal(a.$('.evidence-detail').open,false);}finally{a.close();}assert.equal(Sessions.analysis(analysis()).grounding,undefined);
});
test('full local chain: extraction → confirmation → next-day recall → correction → deletion → old backup cannot revive memory',async()=>{
 const {createDayAnalyzer}=await import('../worker/day-ai.mjs');let clock=today,clockTick,upstream=[],first=true;
 const note='她通常希望提前一天商量陪伴',data={...fixture(),entries:{[today]:{note}}};
 const service=createDayAnalyzer({DayContext:D,catalog:K,now:()=>clock,fetchImpl:async(url,opt)=>{const body=JSON.parse(opt.body);upstream.push(body);const c=JSON.parse(body.input[0].content).day;const raw=withGrounds(analysis());raw.grounds[0].recordIds=c.recordEvidence.some(x=>x.id==='day:note')?['day:note']:c.recordEvidence.filter(x=>x.id.startsWith('memory:')).map(x=>x.id).slice(0,1);raw.memoryCandidates=first?[{category:'support',content:note,scope:'long_term',sourceId:'day-note',quote:note}]:[];first=false;return wrap(raw);}});
 const a=app({data,onInterval:(fn,ms)=>{if(ms===60000)clockTick=fn;},fetchImpl:async(url,opt)=>{const r=await service.analyze(req(JSON.parse(opt.body)));return {ok:r.ok,json:()=>r.json()};}});
 const wait=async()=>{for(let i=0;i<8;i++)await tick();};const generate=async()=>{a.$('#open-today').click();a.$('#day-analysis-consent').checked=true;a.$('#day-generate').click();await wait();assert.match(a.$('#day-analysis-status').textContent,/已由 AI/);};
 try{
  change(a,'#api-key','synthetic_only_key_1234567890');submit(a,'#api-form');await generate();const pending=JSON.parse(a.raw()).memory.items[0];assert.equal(pending.status,'pending');assert(!upstream[0].instructions.includes(note));a.$('#day-dialog').close();
  a.$(`[data-memory-edit="${pending.id}"]`).click();change(a,'#memory-reporter','self');a.$('#memory-confirm').checked=true;submit(a,'#memory-form');assert.equal(JSON.parse(a.raw()).memory.items[0].status,'confirmed');
  clock='2026-10-29';a.advance(clock+'T04:00:00Z');clockTick();await generate();assert(upstream.at(-1).instructions.includes(note));assert.match(a.$('#day-analysis').textContent,/为什么这样建议/);a.$('#day-dialog').close();
  a.$(`[data-memory-edit="${pending.id}"]`).click();change(a,'#memory-content','她通常希望提前两天商量陪伴');a.$('#memory-confirm').checked=true;submit(a,'#memory-form');await generate();assert(!upstream.at(-1).instructions.includes(note));assert(upstream.at(-1).instructions.includes('提前两天'));const backup=JSON.parse(a.raw()),current=backup.memory.items.find(x=>x.status==='confirmed');a.$('#day-dialog').close();
  a.$(`[data-memory-delete="${current.id}"]`).click();a.$('#memory-delete-confirm').click();assert.equal(JSON.parse(a.raw()).memory.items.length,0);assert.equal(a.w.localStorage.getItem(Sessions.KEY),null);
  const restored=M.reconcileImport(backup.memory,JSON.parse(a.raw()).memory);assert.equal(M.active(restored,clock,clock).length,0);await generate();assert(!upstream.at(-1).instructions.includes('提前两天'));assert(!JSON.stringify(JSON.parse(upstream.at(-1).input[0].content).day).includes(note));
 }finally{a.close();}
});
test('short states expire across midnight; review due retains a reported allergy; unrelated and future records stay out for years',()=>{
 const p=profile();p.memory={...M.empty(),items:[memoryItem({id:'short',scope:'short_term',until:today,reviewAt:null}),memoryItem({id:'allergy',category:'allergy_report',content:'她报告花生过敏'})]};
 for(const day of ['2026-10-29','2028-02-29','2036-10-29']){const projection=M.projected(p.memory,day,day,'吃什么','chat'),rows=projection.items;assert(!rows.some(x=>x.id==='short'));assert(rows.some(x=>x.id==='allergy'&&x.reviewDue));assert.match(M.promptBlock(projection),/不表示已停药、痊愈或过敏消失/);}
 assert.equal(M.active(p.memory,today,today).filter(x=>x.id==='short').length,1);
});

test('label checking is accepted while eating an excluded ingredient remains rejected',()=>{
 assert.doesNotThrow(()=>D.CareRules.assertText('逐项看包装标签有无花生或含花生配料',['花生']));
 assert.throws(()=>D.CareRules.assertText('看包装标签后可以吃花生',['花生']));
});
test('memory extraction cannot add a pain score absent from its cited quote',()=>{
 const evidence=[{id:'note',date:today,kind:'note',text:'她今天睡不好，想安静陪伴'}],candidate={category:'health_report',content:today+'她今天睡不好，疼痛2分',scope:'short_term',sourceId:'note',quote:evidence[0].text};
 assert.equal(M.validateCandidates([candidate],evidence).length,0);
 assert.equal(M.validateCandidates([{...candidate,content:today+'她今天睡不好，想安静陪伴'}],evidence).length,1);
});
