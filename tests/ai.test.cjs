const test=require('node:test');const assert=require('node:assert/strict');const {pathToFileURL}=require('node:url');
const Core=require('../public/core.js'),Periods=require('../public/periods.js'),Forecast=require('../public/forecast.js'),Advice=require('../public/advice.js'),Client=require('../public/ai-client.js');
const catalog=[...require('../public/health-data.js'),...require('../public/tcm-data.js'),...require('../public/culture-data.js')];
const base=()=>({consent:true,model:'gpt-4.1-mini',date:'2026-10-26',profile:{periods:[{id:'p',start:'2026-10-20',end:null,status:'ongoing'}],cycleLength:28,periodLength:5},observation:{pain:8,sleep:'poor',topics:['herbal']}});
const make=async fetchImpl=>(await import(pathToFileURL(require('node:path').resolve(__dirname,'../worker/ai.mjs')))).createAnalyzer({Core,Periods,Forecast,Advice,catalog,fetchImpl,now:()=> '2026-10-26'});
const req=(body=base(),options={})=>new Request('https://example.test/api/analyze',{method:'POST',headers:{Origin:'https://example.test','Content-Type':'application/json',Authorization:'Bearer synthetic_key_for_unit_test_123456',...options.headers},body:JSON.stringify(body)});
test('client payload excludes identity, notes, keys and sends only whitelisted observations',()=>{
 const payload=Client.createPayload({...base(),mood:'紧绷',pain:2,nickname:'private person',note:'private note',apiKey:'SECRET',profile:{...base().profile,birthday:'1990-01-01',partner:{nickname:'private person'},entries:{private:'private note'}}});
 const text=JSON.stringify(payload);assert(!/private|SECRET|birthday|apiKey/.test(text));assert.equal(payload.observation.pain,2);assert.equal(payload.profile.periods.length,1);
});
test('relay enforces origin, key, consent and future record validation before making requests',async()=>{
 let calls=0;const api=await make(async()=>{calls++;throw new Error('no network');});
 assert.equal((await api.analyze(req(base(),{headers:{Origin:'https://evil.test'}}))).status,403);
 assert.equal((await api.analyze(req(base(),{headers:{Authorization:''}}))).status,401);
 assert.equal((await api.analyze(req({...base(),consent:false}))).status,400);
 const bad=base();bad.profile.periods[0].start='2026-10-27';assert.equal((await api.analyze(req(bad))).status,400);assert.equal(calls,0);
});
test('request uses a fixed OpenAI endpoint, no persistence, verified sources and recomputed forecast',async()=>{
 let outgoing;const api=await make(async(url,options)=>{outgoing={url,options};return new Response(JSON.stringify({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify({summary:'测试分析',cycleExplanation:'手动参考',actions:[{title:'联系医生',body:'按实际不适处理',articleIds:['health-urgent-pain']}],uncertainty:'参考不能保证。'})}]}]}),{headers:{'Content-Type':'application/json'}});});
 const response=await api.analyze(req());const data=await response.json();assert.equal(response.status,200);assert.equal(outgoing.url,'https://api.openai.com/v1/responses');const body=JSON.parse(outgoing.options.body);assert.equal(body.store,false);assert.equal(body.tools,undefined);assert(!outgoing.options.body.includes('synthetic_key'));assert.equal(data.forecast.nextStart,'2026-11-17');assert.equal(data.medicalPriority[0].urgency,'medical');assert.equal(response.headers.get('Cache-Control'),'no-store');
});
test('model refusal, invented source, stale partial output and upstream errors never become analysis',async()=>{
 for(const response of [new Response(JSON.stringify({status:'incomplete',output:[]}),{status:200}),new Response(JSON.stringify({output:[{content:[{type:'refusal'}]}]})),new Response('sensitive body',{status:401})]){
  const api=await make(async()=>response);const result=await api.analyze(req());const text=await result.text();assert(result.status>=400);assert(!text.includes('sensitive body'));assert(!text.includes('synthetic_key'));
 }
 const api=await make(async()=>new Response(JSON.stringify({output:[{content:[{type:'output_text',text:JSON.stringify({summary:'x',cycleExplanation:'x',uncertainty:'x',actions:[{title:'x',body:'x',articleIds:['invented']} ]})}]}]})));assert.equal((await api.analyze(req())).status,502);
});
test('server recomputes date facts, strips extra fields and ignores future symptoms',async()=>{
 const api=await make(async()=>{throw Error('unused')});const input=base();input.date='2026-11-01';input.forecast={nextStart:'fake'};input.profile.apiKey='not allowed';input.observation.note='private';const clean=api.sanitize(input);assert.equal(clean.observation.pain,null);assert.equal(clean.observation.sleep,'');assert(!JSON.stringify(clean).includes('private'));assert(!JSON.stringify(clean).includes('not allowed'));assert.notEqual(clean.forecast.nextStart,'fake');
});
