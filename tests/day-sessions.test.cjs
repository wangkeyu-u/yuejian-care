const test=require('node:test'),assert=require('node:assert/strict'),Sessions=require('../public/day-sessions.js'),Core=require('../public/core.js');const {analysis}=require('./helpers.cjs');
function memory(){const m=new Map();return {getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v),removeItem:k=>m.delete(k)};}
const value=()=>({signature:'fingerprint',analysis:analysis(),messages:[],model:'gpt-4.1-mini',generatedAt:'2026-10-28T00:00:00Z'});
test('date sessions retain more than six rounds locally while protecting against stale writes',()=>{const storage=memory(),s=Sessions.create(storage),v=value();v.messages=Array.from({length:20},(_,i)=>({role:i%2?'assistant':'user',content:'message '+i}));s.put('2026-10-28',v,'null');assert.equal(s.get('2026-10-28').messages.length,20);const old=s.token('2026-10-28');s.put('2026-10-28',{...v,model:'gpt-other'},old);assert.throws(()=>s.put('2026-10-28',v,old),/另一页更新/);assert.equal(s.get('2026-10-29'),null);});
test('invalid imported analysis is rejected and unrecognized secret fields are never retained',()=>{const v=value();v.apiKey='synthetic_secret';const clean=Sessions.decode({'2026-10-28':v});assert(!JSON.stringify(clean).includes('synthetic_secret'));const bad=value();bad.analysis.sections[0]=null;assert.throws(()=>Sessions.decode({'2026-10-28':bad}));assert.throws(()=>Sessions.decode({'invalid-date':value()}));});

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
