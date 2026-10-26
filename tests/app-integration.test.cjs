const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const {JSDOM}=require('jsdom');
const KEY='yuejian.personal.v1',root=path.resolve(__dirname,'../public');
const period=(id,start,end)=>({id,start,end:end||null,status:end?'ended':'unknown'});
const fixture=()=>({version:2,periods:[period('p','2026-10-20','2026-10-24')],cycleLength:28,periodLength:5,entries:{'2026-10-25':{mood:'平静',pain:2,energy:'medium',support:'',note:'fixed-date-note'}}});
function app(data=fixture(),fetchImpl=async()=>{throw Error('network disabled in test')}){
 const dom=new JSDOM(fs.readFileSync(path.join(root,'index.html'),'utf8'),{url:'https://yuejian.test/#today',runScripts:'outside-only'}),w=dom.window;
 const RealDate=Date;w.Date=class extends RealDate{constructor(...args){super(...(args.length?args:['2026-10-26T04:00:00Z']));}static now(){return new RealDate('2026-10-26T04:00:00Z').getTime();}};
 w.structuredClone=structuredClone;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.AbortController=AbortController;w.fetch=fetchImpl;
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
 if(data!==null)w.localStorage.setItem(KEY,typeof data==='string'?data:JSON.stringify(data));
 for(const script of [...w.document.querySelectorAll('script[src]')])w.eval(fs.readFileSync(path.join(root,script.getAttribute('src').split('?')[0]),'utf8'));
 return {dom,w,$:s=>w.document.querySelector(s),raw:()=>w.localStorage.getItem(KEY),close:()=>w.close()};
}
function change(a,selector,value){a.$(selector).value=value;a.$(selector).dispatchEvent(new a.w.Event('change',{bubbles:true}));}
function submit(a,selector){a.$(selector).dispatchEvent(new a.w.Event('submit',{bubbles:true,cancelable:true}));}
function edit(a,start,end){a.$('#edit-current-period').click();change(a,'#period-date',start);change(a,'#period-status','ended');change(a,'#period-end',end);submit(a,'#period-form');}
test('real app edits start/end, realigns calendar and forecast, preserves journal dates and reloads',()=>{
 const a=app();try{
  assert.match(a.$('#next-period').textContent,/11 月 17/);edit(a,'2026-10-18','2026-10-22');
  assert.equal(a.$('#period-dialog').open,false);assert.match(a.$('#next-period').textContent,/11 月 15/);assert.match(a.$('#selected-day-label').textContent,/今天.*26/);
  assert.match(a.$('[data-date="2026-10-18"]').textContent,/开始/);assert.match(a.$('[data-date="2026-10-22"]').textContent,/结束/);assert.match(a.$('#period-length-display').textContent,/5/);
  assert.match(a.$('#journal-list').textContent,/10 月 25.*周期第 8 天/s);assert.match(a.$('#journal-list').textContent,/fixed-date-note/);
  edit(a,'2026-10-18','2026-10-24');assert.match(a.$('#next-period').textContent,/11 月 15/);assert.match(a.$('#period-length-display').textContent,/7/);
  const reloaded=app(a.raw());try{assert.equal(reloaded.$('#next-period').textContent,a.$('#next-period').textContent);assert.match(reloaded.$('#journal-list').textContent,/fixed-date-note/);}finally{reloaded.close();}
 }finally{a.close();}
});
test('history-based next date, calendar first predicted day and editor preview use the same calculation',()=>{
 const data=fixture();data.periods=[period('a','2026-08-01','2026-08-05'),period('b','2026-08-29','2026-09-02'),period('c','2026-09-28','2026-10-02')];const a=app(data);try{
  assert.match(a.$('#next-period').textContent,/10 月 27/);assert.match(a.$('[data-date="2026-10-27"]').textContent,/预计/);
  a.$('#edit-current-period').click();change(a,'#period-date','2026-09-29');assert.match(a.$('#period-preview').textContent,/10 月 29/);submit(a,'#period-form');
  assert.match(a.$('#next-period').textContent,/10 月 29/);assert.match(a.$('#forecast-date').textContent,/10 月 29/);assert.match(a.$('[data-date="2026-10-29"]').textContent,/预计/);
 }finally{a.close();}
});
test('a second page update refreshes the view and a stale editor cannot overwrite it',()=>{
 const a=app(),b=app();try{
  a.$('#edit-current-period').click();edit(b,'2026-10-19','2026-10-24');const latest=b.raw();a.w.localStorage.setItem(KEY,latest);a.w.dispatchEvent(new a.w.StorageEvent('storage',{key:KEY,newValue:latest}));
  assert.match(a.$('#next-period').textContent,/11 月 16/);change(a,'#period-date','2026-10-17');submit(a,'#period-form');assert.match(a.$('#period-error').textContent,/另一处更新/);assert.equal(a.raw(),latest);
 }finally{a.close();b.close();}
});
test('failed writes and invalid ranges keep the saved records and prediction unchanged',()=>{
 const a=app();try{
  const before=a.raw();a.$('#edit-current-period').click();change(a,'#period-end','2026-10-19');submit(a,'#period-form');assert.equal(a.raw(),before);assert.match(a.$('#period-error').textContent,/不能早于/);
  change(a,'#period-date','2026-10-18');change(a,'#period-end','2026-10-24');const original=a.w.Storage.prototype.setItem;a.w.Storage.prototype.setItem=function(key,value){if(key===KEY)throw new Error('quota');return original.call(this,key,value);};submit(a,'#period-form');assert.equal(a.raw(),before);assert.match(a.$('#next-period').textContent,/11 月 17/);
 }finally{a.close();}
});
test('AI key is not persisted or sent before confirmation, and changing a date rejects stale analysis',async()=>{
 let calls=0,resolveRequest;const a=app(fixture(),async()=>{calls++;return new Promise(resolve=>{resolveRequest=resolve;});});try{
  a.$('#ai-open').click();change(a,'#ai-key','synthetic_only_secret_123456789');submit(a,'#ai-form');assert.equal(calls,0);assert.match(a.$('#ai-status').textContent,/确认发送/);a.$('#ai-consent').checked=true;submit(a,'#ai-form');assert.equal(calls,1);assert.equal(a.$('#ai-key').value,'');assert(!a.raw().includes('synthetic_only_secret'));
  a.$('#ai-dialog').close();edit(a,'2026-10-18','2026-10-24');resolveRequest({ok:true,json:async()=>({model:'gpt-4.1-mini',analysis:{summary:'stale result',cycleExplanation:'stale',actions:[],uncertainty:'stale'}})});await new Promise(resolve=>setImmediate(resolve));assert.equal(a.$('#ai-result').hidden,true);assert(!a.$('#ai-result').textContent.includes('stale result'));
 }finally{a.close();}
});
test('old starts migrate without guessed end and extra observations survive save and reload',()=>{
 const a=app({starts:['2026-10-20'],cycleLength:28,entries:fixture().entries});try{
  assert.match(a.$('#period-length-display').textContent,/待确认/);change(a,'#sleep','poor');change(a,'#flow','heavy');a.$('[data-care-topic="herbal"]').checked=true;submit(a,'#checkin-form');assert(a.w.localStorage.getItem('yuejian.personal.pre-periods-v2'));
  const state=JSON.parse(a.raw());assert.equal(state.periods[0].end,null);const b=app(a.raw());try{assert.equal(b.$('#sleep').value,'poor');assert.equal(b.$('#flow').value,'heavy');assert.equal(b.$('[data-care-topic="herbal"]').checked,true);assert.equal(b.$('.advice-priorities article').dataset.adviceId,'medical-first');}finally{b.close();}
 }finally{a.close();}
});
test('backup import previews before replacement, realigns dates and can restore original data',async()=>{
 const a=app();try{
  const original=a.raw(),data=fixture();data.periods=[period('imported','2026-10-10','2026-10-14')];
  Object.defineProperty(a.$('#import-file'),'files',{configurable:true,value:[{size:500,text:async()=>JSON.stringify(data)}]});a.$('#import-file').dispatchEvent(new a.w.Event('change'));await new Promise(resolve=>setImmediate(resolve));
  assert.equal(a.raw(),original);assert.equal(a.$('#import-confirm').hidden,false);assert.match(a.$('#import-preview').textContent,/1 次经期/);
  a.$('#import-confirm').click();assert.equal(JSON.parse(a.raw()).periods[0].start,'2026-10-10');assert.match(a.$('#next-period').textContent,/11 月 7/);assert.match(a.$('#journal-list').textContent,/fixed-date-note/);
  assert.equal(JSON.parse(a.w.localStorage.getItem('yuejian.pre-import.v1')).raw,original);a.$('#import-restore').click();assert.equal(a.raw(),original);assert.match(a.$('#next-period').textContent,/11 月 17/);
 }finally{a.close();}
});
test('invalid or oversized backup cannot replace current records',async()=>{
 const a=app();try{
  const original=a.raw();for(const file of [{size:1,text:async()=>'{broken'},{size:3*1024*1024,text:async()=>JSON.stringify(fixture())},{size:20,text:async()=>JSON.stringify({periods:[period('bad','2026-10-24','2026-10-20')]})}]){
   Object.defineProperty(a.$('#import-file'),'files',{configurable:true,value:[file]});a.$('#import-file').dispatchEvent(new a.w.Event('change'));await new Promise(resolve=>setImmediate(resolve));assert.equal(a.$('#import-confirm').hidden,true);a.$('#import-confirm').click();assert.equal(a.raw(),original);
  }
 }finally{a.close();}
});
