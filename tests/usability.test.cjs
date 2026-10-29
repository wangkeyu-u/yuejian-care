const test=require('node:test'),assert=require('node:assert/strict');
const {app,change,submit,tick,mockAI,analysis,today}=require('./helpers.cjs');
const key=(a,provider='openai',value='synthetic_openai_key_1234567890')=>{change(a,'#api-provider',provider);change(a,'#api-key',value);submit(a,'#api-form');};
const ask=async(a,question='现在先帮她做哪一件事？')=>{change(a,'#day-question',question);a.$('#day-ai-consent').checked=true;submit(a,'#day-chat-form');await tick();};
const generate=async a=>{a.$('#day-analysis-consent').checked=true;a.$('#day-generate').click();await tick();};

test('first use records an actual period directly on calendar without configuring AI',()=>{
 let calls=0;const a=app({data:null,fetchImpl:async()=>{calls++;}});try{
  assert.equal(a.$('#first-use').hidden,false);a.$('#first-period').click();assert.equal(a.$('#period-dialog').open,true);
  change(a,'#period-date','2026-10-20');change(a,'#period-status','ended');change(a,'#period-end','2026-10-24');submit(a,'#period-form');
  assert.equal(a.$('#first-use').hidden,true);assert.match(a.$('[data-date="2026-10-20"]').textContent,/开始/);assert.match(a.$('#next-period').textContent,/11 月 17/);assert.equal(calls,0);assert.equal(a.$('#calendar-period-undo').hidden,false);
  a.$('#calendar-period-undo').click();assert.equal(JSON.parse(a.raw()).periods.length,0);assert.equal(a.$('#first-use').hidden,false);
 }finally{a.close();}
});
test('a selected ongoing period can record its end directly while keeping the cycle start',()=>{
 const a=app({data:{periods:[{id:'p',start:'2026-10-20',end:null,status:'ongoing'}]}});try{
  a.$('#open-today').click();assert.equal(a.$('#day-period-end').hidden,false);a.$('#day-period-end').click();assert.equal(a.$('#period-status').value,'ended');assert.equal(a.$('#period-end').value,today);submit(a,'#period-form');
  const p=JSON.parse(a.raw()).periods[0];assert.equal(p.start,'2026-10-20');assert.equal(p.end,today);assert.equal(a.$('#day-period-end').hidden,true);assert.match(a.$('#next-period').textContent,/11 月 17/);
 }finally{a.close();}
});
test('a direct question creates a reloadable chat-only record with no full analysis call',async()=>{
 const log=[],a=app({fetchImpl:mockAI(log)});try{
  key(a);a.$('#open-today').click();assert.equal(a.$('#day-full-analysis').open,false);await ask(a);assert.equal(log.length,1);assert.equal(log[0].p.mode,'chat');assert.equal(log[0].p.analysis,undefined);
  const days=JSON.parse(a.w.localStorage.getItem('yuejian.days.v1'));assert.equal(days[today].kind,'chat');assert.equal(days[today].analysis,null);assert.equal(days[today].messages.length,2);
  const b=app({data:a.raw(),extra:{'yuejian.days.v1':days}});try{b.$('#open-today').click();assert.match(b.$('#day-messages').textContent,/针对这一天/);assert.equal(b.$('#day-full-analysis').open,false);}finally{b.close();}
 }finally{a.close();}
});
test('saving AI settings and changing suppliers never consumes tokens and keys stay isolated',async()=>{
 const log=[],a=app({fetchImpl:mockAI(log)});try{
  key(a);assert.equal(log.length,0);change(a,'#api-provider','deepseek');assert.equal(a.$('#api-model').value,'deepseek-flash');submit(a,'#api-form');assert.match(a.$('#api-status').textContent,/填写/);
  key(a,'deepseek','synthetic_deepseek_key_1234567890');assert.equal(log.length,0);assert.equal(JSON.parse(a.raw()).provider,'deepseek');a.$('#open-today').click();await ask(a);
  assert.equal(log[0].p.provider,'deepseek');assert.match(log[0].options.headers.Authorization,/synthetic_deepseek/);assert(!JSON.stringify(log[0].p).includes('synthetic_'));
  a.$('#day-dialog').close();change(a,'#api-provider','openai');submit(a,'#api-form');a.$('#open-today').click();await ask(a,'重新回答这个问题');assert.equal(log[1].p.provider,'openai');assert.match(log[1].options.headers.Authorization,/synthetic_openai/);assert.deepEqual(log[1].p.history,[]);assert(!a.raw().includes('synthetic_openai'));
 }finally{a.close();}
});
test('daily drafts survive changing dates and closing the dialog without entering persistent records',()=>{
 const a=app();try{
  a.$('#open-today').click();change(a,'#day-note','合成未保存草稿');a.$('#day-next').click();assert.equal(a.$('#day-note').value,'');a.$('#day-prev').click();assert.equal(a.$('#day-note').value,'合成未保存草稿');assert(!a.raw().includes('合成未保存草稿'));
  a.$('#day-dialog').close();a.$('#open-today').click();assert.equal(a.$('#day-note').value,'合成未保存草稿');a.$('#day-discard-draft').click();assert.equal(a.$('#day-note').value,'');
 }finally{a.close();}
});
test('one action saves approved draft observations and asks using exactly the previewed data',async()=>{
 const log=[],a=app({fetchImpl:mockAI(log)});try{
  key(a);a.$('#open-today').click();change(a,'#day-note','合成实际情况：今晚愿意自己休息。');change(a,'#day-pain','2');change(a,'#day-question','下一步怎么帮忙？');const preview=JSON.parse(a.$('#day-data-preview').textContent);assert.equal(preview.saveFirst,true);assert.match(preview.preparedRequest.observation.note,/合成实际/);
  a.$('#day-ai-consent').checked=true;submit(a,'#day-chat-form');await tick();assert.equal(log.length,1);assert.equal(JSON.parse(a.raw()).entries[today].pain,2);assert.equal(log[0].p.observation.note,preview.preparedRequest.observation.note);assert.equal(a.$('#day-discard-draft').hidden,true);assert.equal(a.$('#day-ai-consent').checked,false);
 }finally{a.close();}
});
test('a new question after settings changes does not validate or send the old full analysis',async()=>{
 const log=[],a=app({fetchImpl:mockAI(log)});try{
  key(a);a.$('#open-today').click();await generate(a);await ask(a,'旧背景的问题');change(a,'#setting-cycle','30');submit(a,'#cycle-form');assert.match(a.$('#day-analysis-status').textContent,/过期/);await ask(a,'新背景应该怎么做？');
  assert.equal(log[2].p.analysis,undefined);assert.deepEqual(log[2].p.history,[]);assert.match(a.$('#day-analysis-status').textContent,/过期/);assert(a.$('#day-food').classList.contains('stale'));await ask(a,'继续当前问题');assert.equal(log[3].p.history.length,2);assert(!JSON.stringify(log[3].p.history).includes('旧背景'));
 }finally{a.close();}
});
test('question presets fill the question without issuing a request, and background scopes have separate approval',async()=>{
 const log=[],a=app({fetchImpl:mockAI(log)});try{
  key(a);a.$('#open-today').click();a.$('[data-question-preset="food"]').click();assert.match(a.$('#day-question').value,/下一餐/);assert.equal(log.length,0);a.$('#day-ai-consent').checked=true;a.$('#day-generate').click();await tick();assert.equal(log.length,0);assert.match(a.$('#day-request-status').textContent,/勾选同意/);await generate(a);assert.equal(log.length,1);
 }finally{a.close();}
});

test('unfinished period end input shows guidance instead of internal field names',()=>{
 const a=app({data:null});try{a.$('#first-period').click();change(a,'#period-status','ended');assert.match(a.$('#period-preview').textContent,/再选实际结束日/);assert(!a.$('#period-preview').textContent.includes('period 为'));}finally{a.close();}
});
test('failed AI calls retain the question and the observations already approved for saving',async()=>{
 const a=app({fetchImpl:async()=>({ok:false,json:async()=>({error:'合成网络错误'})})});try{
  key(a);a.$('#open-today').click();change(a,'#day-note','合成记录不会随请求失败丢失');await ask(a,'合成问题保留吗？');assert.match(a.$('#day-request-status').textContent,/合成网络错误/);assert.equal(a.$('#day-question').value,'合成问题保留吗？');assert.equal(JSON.parse(a.raw()).entries[today].note,'合成记录不会随请求失败丢失');assert.equal(a.w.localStorage.getItem('yuejian.days.v1'),null);assert.equal(a.$('#day-send').disabled,false);
 }finally{a.close();}
});
test('same-day changes from another tab never overwrite the current observation draft',()=>{
 const a=app();try{
  a.$('#open-today').click();change(a,'#day-note','本页合成草稿');const remote=JSON.parse(a.raw());remote.entries[today]={note:'另一页已存的合成记录'};remote.revision++;a.w.localStorage.setItem('yuejian.personal.v1',JSON.stringify(remote));a.w.dispatchEvent(new a.w.StorageEvent('storage',{key:'yuejian.personal.v1'}));submit(a,'#day-record-form');assert.equal(JSON.parse(a.raw()).entries[today].note,'另一页已存的合成记录');assert.equal(a.$('#day-note').value,'本页合成草稿');assert.match(a.$('#day-request-status').textContent,/另一处修改/);
 }finally{a.close();}
});
test('provider changes reset extraction approval and page-only keys stay out of both storages',()=>{
 const log=[],a=app({fetchImpl:mockAI(log)});try{
  a.$('#api-remember').checked=false;key(a);assert.equal(a.w.sessionStorage.getItem('yuejian.ai.session.v1'),null);a.$('#memory-extract-consent').checked=true;a.$('#phase-import-consent').checked=true;key(a,'deepseek','synthetic_deepseek_key_1234567890');assert.equal(a.$('#memory-ai-service').textContent,'DeepSeek');assert.equal(a.$('#memory-extract-consent').checked,false);assert.equal(a.$('#phase-import-consent').checked,false);assert.equal(a.w.sessionStorage.length,0);assert(!a.raw().includes('synthetic_'));assert.equal(log.length,0);
 }finally{a.close();}
});
