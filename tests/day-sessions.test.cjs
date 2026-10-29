const test=require('node:test'),assert=require('node:assert/strict'),Sessions=require('../public/day-sessions.js'),Core=require('../public/core.js'),Privacy=require('../public/memory-privacy.js'),State=require('../public/state.js'),Memory=require('../public/memory.js');const {analysis}=require('./helpers.cjs');
function memory(){const m=new Map();return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)};}
const value=()=>({signature:'fingerprint',analysis:analysis(),messages:[],model:'gpt-4.1-mini',generatedAt:'2026-10-28T00:00:00Z'});
const chatValue=(overrides={})=>({signature:'chat-fingerprint',kind:'chat',analysis:null,messages:[{role:'user',content:'她今天想先安静休息。'},{role:'assistant',content:'先确认她是否需要具体帮助，再把安排放轻。'}],model:'gpt-4.1-mini',generatedAt:'2026-10-28T00:00:00Z',...overrides});
test('date sessions retain more than six rounds locally while protecting against stale writes',()=>{const storage=memory(),s=Sessions.create(storage),v=value();v.messages=Array.from({length:20},(_,i)=>({role:i%2?'assistant':'user',content:'message '+i}));s.put('2026-10-28',v,'null');assert.equal(s.get('2026-10-28').messages.length,20);const old=s.token('2026-10-28');s.put('2026-10-28',{...v,model:'gpt-other'},old);assert.throws(()=>s.put('2026-10-28',v,old),/另一页更新/);assert.equal(s.get('2026-10-29'),null);});
test('invalid imported analysis is rejected and unrecognized secret fields are never retained',()=>{const v=value();v.apiKey='synthetic_secret';const clean=Sessions.decode({'2026-10-28':v});assert(!JSON.stringify(clean).includes('synthetic_secret'));const bad=value();bad.analysis.sections[0]=null;assert.throws(()=>Sessions.decode({'2026-10-28':bad}));assert.throws(()=>Sessions.decode({'invalid-date':value()}));});

test('explicit chat sessions retain non-empty messages, provider, and long source dependencies',()=>{
  const sourceDates=Array.from({length:400},(_,index)=>Core.addDays('2024-01-01',index));
  const clean=Sessions.decode({'2026-10-28':chatValue({provider:'deepseek',sourceDates,privacyBlocks:['deadbeef'],memoryRoots:['root-chat'],memoryIds:['memory-chat']})})['2026-10-28'];
  assert.equal(clean.kind,'chat');assert.equal(clean.analysis,null);assert.equal(clean.provider,'deepseek');assert.equal(clean.messages.length,2);assert.deepEqual({analysisSignature:clean.analysisSignature,analysisModel:clean.analysisModel,analysisProvider:clean.analysisProvider,analysisGeneratedAt:clean.analysisGeneratedAt},{analysisSignature:'',analysisModel:'',analysisProvider:'',analysisGeneratedAt:''});
  assert.equal(clean.sourceDates.length,400);assert.deepEqual(clean.privacyBlocks,['deadbeef']);assert.deepEqual(clean.memoryRoots,['root-chat']);assert.deepEqual(clean.memoryIds,['memory-chat']);
  const legacy=value();const old=Sessions.decode({'2026-10-28':legacy})['2026-10-28'];assert.equal(old.kind,'analysis');assert.equal(old.provider,'openai');assert.deepEqual({analysisSignature:old.analysisSignature,analysisModel:old.analysisModel,analysisProvider:old.analysisProvider,analysisGeneratedAt:old.analysisGeneratedAt},{analysisSignature:'fingerprint',analysisModel:'gpt-4.1-mini',analysisProvider:'openai',analysisGeneratedAt:'2026-10-28T00:00:00Z'});
  const explicit={...legacy,analysisSignature:'analysis-sig',analysisModel:'deepseek-chat',analysisProvider:'deepseek',analysisGeneratedAt:'2026-10-27T00:00:00Z'};const explicitClean=Sessions.decode({'2026-10-28':explicit})['2026-10-28'];assert.deepEqual({analysisSignature:explicitClean.analysisSignature,analysisModel:explicitClean.analysisModel,analysisProvider:explicitClean.analysisProvider,analysisGeneratedAt:explicitClean.analysisGeneratedAt},{analysisSignature:'analysis-sig',analysisModel:'deepseek-chat',analysisProvider:'deepseek',analysisGeneratedAt:'2026-10-27T00:00:00Z'});
  const withPrevious=value();withPrevious.previous={analysis:analysis(),messages:[{role:'user',content:'旧问题'},{role:'assistant',content:'旧回答'}],generatedAt:'2026-10-27T00:00:00Z',privacyBlocks:['deadbeef'],memoryRoots:['root-chat'],memoryIds:['memory-chat'],sourceDates};
  const previous=Sessions.decode({'2026-10-28':withPrevious})['2026-10-28'].previous;assert.equal(previous.kind,'analysis');assert.equal(previous.provider,'openai');assert.equal(previous.messages.length,2);assert.equal(previous.sourceDates.length,400);assert.deepEqual(previous.privacyBlocks,['deadbeef']);assert.deepEqual(previous.memoryRoots,['root-chat']);assert.deepEqual(previous.memoryIds,['memory-chat']);assert.deepEqual({analysisSignature:previous.analysisSignature,analysisModel:previous.analysisModel,analysisProvider:previous.analysisProvider,analysisGeneratedAt:previous.analysisGeneratedAt},{analysisSignature:'',analysisModel:'unknown',analysisProvider:'openai',analysisGeneratedAt:'2026-10-27T00:00:00Z'});
});

test('chat sessions save, reload, append on the same day, and reject stale CAS writes',()=>{
  const storage=memory(),s=Sessions.create(storage),first=chatValue();
  s.put('2026-10-28',first,'null');const token=s.token('2026-10-28');
  const current=s.get('2026-10-28'),appended={...current,messages:[...current.messages,{role:'user',content:'她想知道晚餐怎么安排。'},{role:'assistant',content:'准备一份清淡、熟悉且方便替换的晚餐。'}]};
  s.put('2026-10-28',appended,token);const reloaded=Sessions.create(storage).get('2026-10-28');
  assert.equal(reloaded.kind,'chat');assert.equal(reloaded.analysis,null);assert.equal(reloaded.messages.length,4);assert.equal(reloaded.provider,'openai');
  assert.throws(()=>s.put('2026-10-28',appended,token),/另一页更新/);assert.equal(s.get('2026-10-28').messages.length,4);
});

test('same-day chat updates change the current signature without replacing complete-analysis metadata',()=>{
  const storage=memory(),s=Sessions.create(storage),analyzed={...value(),analysisSignature:'analysis-sig',analysisModel:'gpt-analysis',analysisProvider:'openai',analysisGeneratedAt:'2026-10-27T10:00:00Z'};
  s.put('2026-10-28',analyzed,'null');const token=s.token('2026-10-28'),current=s.get('2026-10-28');
  s.put('2026-10-28',{...current,signature:'chat-sig',messages:[{role:'user',content:'她现在想问一个具体问题。'},{role:'assistant',content:'先依据当前记录回答，并保留原分析的过期标记。'}]},token);
  const saved=s.get('2026-10-28');assert.equal(saved.signature,'chat-sig');assert.equal(saved.analysisSignature,'analysis-sig');assert.equal(saved.analysisModel,'gpt-analysis');assert.equal(saved.analysisProvider,'openai');assert.equal(saved.analysisGeneratedAt,'2026-10-27T10:00:00Z');assert.equal(saved.kind,'analysis');
});

test('chat records require an explicit kind and non-empty legal messages',()=>{
  const missingKind=chatValue();delete missingKind.kind;assert.throws(()=>Sessions.decode({'2026-10-28':missingKind}),/每日分析结构|聊天记录分析/);
  const empty=chatValue({messages:[]});assert.throws(()=>Sessions.decode({'2026-10-28':empty}),/对话格式/);
  const invalid=chatValue({messages:[{role:'system',content:'不能保存'}]});assert.throws(()=>Sessions.decode({'2026-10-28':invalid}),/对话格式/);
  const missingAnalysis=chatValue();delete missingAnalysis.analysis;assert.throws(()=>Sessions.decode({'2026-10-28':missingAnalysis}),/聊天记录分析/);
  const oldCorrupt=value();delete oldCorrupt.analysis;assert.throws(()=>Sessions.decode({'2026-10-28':oldCorrupt}),/每日分析结构/);
  assert.throws(()=>Sessions.decode({'2026-10-28':chatValue({provider:'anthropic'})}),/服务商格式/);
});

test('chat records survive privacy import with source dependencies and acknowledged barriers',()=>{
  const date='2026-10-28',profile=State.defaults(),memoryData=Memory.empty();memoryData.blocks=[{rootId:'root-chat',ids:['memory-chat'],sources:[{date,kind:'chat',sourceId:'chat:'+date+':0'}],mode:'delete',at:date,keys:[]}];
  const privacyBlocks=Memory.barrierTokens(memoryData),chat=chatValue({privacyBlocks,memoryRoots:['root-chat'],memoryIds:['memory-chat'],sourceDates:[date]});
  const imported=Privacy.importBundle({...profile,memory:memoryData,days:{[date]:chat}},profile),round=Sessions.decode(imported.days)[date];
  assert.equal(round.kind,'chat');assert.equal(round.analysis,null);assert.deepEqual(round.privacyBlocks,privacyBlocks);assert.deepEqual(round.memoryRoots,['root-chat']);assert.deepEqual(round.memoryIds,['memory-chat']);
});

test('daily analyses retain more than 366 days through decode, append and reload within the long-range quota',()=>{
  assert.equal(Sessions.MAX_DAYS,36525);
  const data={};
  for(let index=0;index<400;index+=1)data[Core.addDays('2024-01-01',index)]=value();
  assert.equal(Object.keys(Sessions.decode(data)).length,400);
  const storage=memory();storage.setItem(Sessions.KEY,JSON.stringify(data));
  const first=Sessions.create(storage);first.put('2025-02-04',value());
  assert.equal(Object.keys(first.all()).length,401);
  const reloaded=Sessions.create(storage);assert.equal(Object.keys(reloaded.all()).length,401);
});

test('corrupt daily data is never replaced by put or remove',()=>{
  const storage=memory();storage.setItem(Sessions.KEY,'{broken');const s=Sessions.create(storage);
  assert.throws(()=>s.put('2026-10-28',value()),/Expected property|格式/);assert.equal(storage.getItem(Sessions.KEY),'{broken');
  assert.throws(()=>s.remove('2026-10-28'),/Expected property|格式/);assert.equal(storage.getItem(Sessions.KEY),'{broken');
});

test('storage quota failures restore the exact raw record for both put and remove',()=>{
  const storage=memory(),s=Sessions.create(storage);s.put('2026-10-28',value());const before=storage.getItem(Sessions.KEY),realSet=storage.setItem.bind(storage);
  let fail=true;storage.setItem=(key,next)=>{realSet(key,next);if(fail){fail=false;throw Error('synthetic quota');}};
  assert.throws(()=>s.put('2026-10-29',value()),/每日分析保存失败.*36525/);assert.equal(storage.getItem(Sessions.KEY),before);
  fail=true;assert.throws(()=>s.remove('2026-10-28'),/每日分析移除失败.*36525/);assert.equal(storage.getItem(Sessions.KEY),before);
});
