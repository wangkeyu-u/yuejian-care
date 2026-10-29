const {withGrounds}=require('./helpers.cjs');
const test=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const Providers=require('../public/providers.js');
const DayContext=require('../public/day-context.js');
const State=require('../public/state.js');
const Catalog=require('../public/catalog.js').articles;
const {action,food}=require('./helpers.cjs');

const today='2026-10-28';
const key='synthetic_only_key_1234567890';
const wrap=value=>new Response(JSON.stringify({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(withGrounds(value))}]}]}),{headers:{'Content-Type':'application/json'}});

test('provider definitions and model validation have one fixed endpoint per provider',()=>{
  assert.deepEqual(Providers.definition(),Providers.definitions.openai);
  assert.deepEqual(Providers.definition('deepseek'),Providers.definitions.deepseek);
  assert.equal(Providers.normalize(), 'openai');
  assert.equal(Providers.normalize(null), 'openai');
  assert.equal(Providers.normalize(''), 'openai');
  assert.throws(()=>Providers.normalize('https://attacker.example/responses'),/服务商/);
  assert.equal(Providers.defaultModel('deepseek'),'deepseek-flash');
  assert(Providers.validModel('openai','gpt-4.1-mini'));
  assert(!Providers.validModel('openai','deepseek-flash'));
  assert(Providers.validModel('deepseek','deepseek-flash'));
  assert(Providers.validModel('deepseek','deepseek-v4-pro'));
  assert(!Providers.validModel('deepseek','deepseek-chat'));
  assert(!Providers.validModel('bad','gpt-4.1-mini'));
});

test('upstream request policy keeps OpenAI unchanged and constrains DeepSeek',()=>{
  const openai={model:'gpt-4.1-mini',store:false,max_output_tokens:6000,reasoning:{effort:'high'},text:{format:{name:'daily_analysis',strict:true}}};
  const openaiCopy=JSON.parse(JSON.stringify(openai));
  assert.deepEqual(Providers.upstreamBody('openai',openai),openaiCopy);
  assert.notStrictEqual(Providers.upstreamBody('openai',openai),openai);
  for(const [mode,limit] of Object.entries({analysis:3200,chat:1200,memory:1000,signals:1600})){
    const body={model:'deepseek-flash',max_output_tokens:6000,text:{format:{name:'daily_'+mode}}};
    const result=Providers.upstreamBody('deepseek',body);
    assert.equal(result.reasoning.effort,'none');
    assert.equal(result.max_output_tokens,limit);
    assert.equal(body.reasoning,undefined);
  }
  const explicit=Providers.upstreamBody('deepseek',{mode:'chat',max_output_tokens:9999,text:{format:{name:'daily_analysis'}}});
  assert.equal(explicit.max_output_tokens,1200);
});

function payload(provider='openai',model=provider==='deepseek'?'deepseek-flash':'gpt-4.1-mini',includeProvider=true){
  const state=State.defaults();state.periods=[{id:'p',start:'2026-10-20',end:'2026-10-24',status:'ended'}];
  const input={...DayContext.makeInput(state,today),mode:'analysis',question:'',history:[],consent:true};
  if(includeProvider)input.provider=provider;
  input.model=model;input.signature=DayContext.signature(input,today);
  return input;
}

const TestDayContext=DayContext;

function valid(context){return {summary:'测试分析',uncertainty:'资料有限。',food:food(),sections:['culture','tcm','western','psychology'].map(kind=>({kind,title:kind,body:'仅用于服务端接入测试。',actions:[action()],articleIds:context.articles.filter(a=>(a.subjects||[a.subject]).includes(kind)).slice(0,1).map(a=>a.id)}))};}
async function service(fetchImpl){return (await import(pathToFileURL(path.resolve(__dirname,'../worker/day-ai.mjs')))).createDayAnalyzer({DayContext:TestDayContext,catalog:Catalog,fetchImpl,now:()=>today,Providers});}
function req(value,authorization=`Bearer ${key}`){return new Request('https://day.test/api/day',{method:'POST',headers:{Origin:'https://day.test','Content-Type':'application/json',Authorization:authorization},body:JSON.stringify(value)});}

test('server selects DeepSeek only from validated context and returns provider/model without exposing the key',async()=>{
  const p=payload('deepseek'),context=TestDayContext.build(p,Catalog,today);let outgoing;
  const api=await service(async(url,options)=>{outgoing={url,options};return wrap({...valid(context),model:'deepseek-flash'});});
  const response=await api.analyze(req(p));
  assert.equal(response.status,200);
  const data=await response.json(),body=JSON.parse(outgoing.options.body);
  assert.equal(outgoing.url,'https://api.deepseek.com/responses');
  assert.equal(body.model,'deepseek-flash');
  assert.equal(body.reasoning.effort,'none');
  assert.equal(body.max_output_tokens,3200);
  assert(!outgoing.options.body.includes(key));
  assert.equal(data.provider,'deepseek');
  assert.equal(data.model,'deepseek-flash');
});

test('server preserves OpenAI request behavior and accepts old input without provider',async()=>{
  for(const p of [payload('openai'),payload('openai','gpt-4.1-mini',false)]){
    const context=TestDayContext.build(p,Catalog,today);let outgoing;
    const api=await service(async(url,options)=>{outgoing={url,options};return wrap(valid(context));});
    const response=await api.analyze(req(p));
    assert.equal(response.status,200);
    const body=JSON.parse(outgoing.options.body);
    assert.equal(outgoing.url,'https://api.openai.com/v1/responses');
    assert.equal(body.max_output_tokens,6000);
    assert.equal(body.reasoning,undefined);
    assert.equal((await response.json()).provider,'openai');
  }
});

test('invalid provider or model is rejected before fetch',async()=>{
  let calls=0;const api=await service(async()=>{calls++;throw Error('must not call upstream');});
  const invalidProvider=payload('openai');invalidProvider.provider='https://attacker.example/responses';
  const providerResponse=await api.analyze(req(invalidProvider));
  assert.equal(providerResponse.status,400);
  const invalidModel=payload('deepseek','deepseek-flash');
  invalidModel.model='deepseek-chat';
  const modelResponse=await api.analyze(req(invalidModel));
  assert.equal(modelResponse.status,400);
  assert.equal(calls,0);
});
