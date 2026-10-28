const test=require('node:test');
const assert=require('node:assert/strict');
const Privacy=require('../public/memory-privacy.js');
const Memory=require('../public/memory.js');

const dates={source:'2026-10-20',derived:'2026-10-21',unrelated:'2026-10-22'};

function storage(initial={}){
  const values=new Map(Object.entries(initial).map(([key,value])=>[key,value===null?null:typeof value==='string'?value:JSON.stringify(value)]));
  return {
    values,
    getItem:key=>values.has(key)?values.get(key):null,
    setItem:(key,value)=>values.set(key,String(value)),
    removeItem:key=>values.delete(key)
  };
}

function profile(overrides={}){
  const value={
    version:2,
    revision:3,
    entries:{
      [dates.source]:{note:'她平时喜欢安静陪伴'},
      [dates.derived]:{note:'这一天与来源日期无关'},
      [dates.unrelated]:{note:'完全无关的记录'}
    },
    memory:{version:2,revision:4,items:[
      memoryItem('m-old','root-1','旧版本'),
      memoryItem('m-new','root-1','另一版本'),
      memoryItem('m-safe','root-safe','保留',dates.unrelated)
    ],blocks:[]}
  };
  return {...value,...overrides};
}

function memoryItem(id,rootId,content,date=dates.source,status='confirmed'){
  return {id,rootId,scope:'long_term',category:'support',content,status,since:date,until:null,reviewAt:null,reviewedAt:null,reporter:'unknown',topics:[],archiveReason:'',supersedes:'',evidence:{date,kind:'note',sourceId:'seed',quote:content},createdAt:date,updatedAt:date};
}

function session(signature,extra={}){return {signature,messages:[],analysis:{},...extra};}

function target(overrides={}){return {id:'m-old',rootId:'root-1',content:'旧版本',evidence:{date:dates.source,kind:'note',sourceId:'note-1',quote:'她平时喜欢安静陪伴'},...overrides};}

function seeded(extra={}){
  const p=profile();
  return storage({
    [Privacy.PROFILE_KEY]:p,
    [Privacy.DAYS_KEY]:{
      [dates.source]:session('source',{memoryIds:['m-old'],sourceDates:[dates.source]}),
      [dates.derived]:session('derived',{sourceDates:[dates.source]}),
      [dates.unrelated]:session('unrelated',{memoryIds:['m-safe'],sourceDates:[dates.unrelated]})
    },
    [Privacy.PERIOD_BACKUP_KEY]:'period-backup',
    [Privacy.IMPORT_BACKUP_KEY]:'import-backup',
    [Privacy.MEMORY_BACKUP_KEY]:'memory-backup',
    [Privacy.BUNDLE_BACKUP_KEY]:'bundle-backup',
    ...extra
  });
}

test('delete removes all target root versions, source entries, dependent sessions, and private backups',()=>{
  const store=seeded();
  const result=Privacy.apply(store,{afterMemory:profile().memory,targets:[target()],action:'delete',expectedToken:store.getItem(Privacy.PROFILE_KEY)});
  assert.deepEqual(result.removedEntryDates,[dates.source]);
  assert.deepEqual(result.affectedDates,[dates.source,dates.derived]);
  const saved=JSON.parse(store.getItem(Privacy.PROFILE_KEY));
  assert.deepEqual(saved.memory.items.map(item=>item.id),['m-safe']);
  assert.equal(saved.entries[dates.source],undefined);
  assert.ok(saved.entries[dates.unrelated]);
  assert.equal(store.getItem(Privacy.DAYS_KEY),JSON.stringify({[dates.unrelated]:session('unrelated',{memoryIds:['m-safe'],sourceDates:[dates.unrelated]})}));
  for(const key of Privacy.BACKUP_KEYS)assert.equal(store.getItem(key),null);
  assert.equal(JSON.stringify(saved.memory.blocks).includes('她平时喜欢安静陪伴'),false);
});

test('stop invalidates source and sourceDates-derived sessions but retains history and unrelated dates',()=>{
  const store=seeded();
  const result=Privacy.apply(store,{afterMemory:profile().memory,targets:[target()],action:'stop'});
  const days=JSON.parse(store.getItem(Privacy.DAYS_KEY));
  assert.equal(result.removedEntryDates.length,0);
  assert.ok(days[dates.source].blockedForExtraction);
  assert.ok(days[dates.derived].blockedForExtraction);
  assert.match(days[dates.source].signature,/^invalidated:/);
  assert.match(days[dates.derived].signature,/^invalidated:/);
  assert.equal(days[dates.unrelated].signature,'unrelated');
  assert.equal(JSON.parse(store.getItem(Privacy.PROFILE_KEY)).entries[dates.source].note,'她平时喜欢安静陪伴');
  assert.equal(days[dates.source].messages.length,0);
});

test('manual evidence does not become an automatic date deletion, while matching note is still removed',()=>{
  const store=seeded();
  const manualTarget=target({evidence:{date:dates.source,kind:'manual',sourceId:'manual',quote:'手动修改'}});
  const result=Privacy.plan(store,{afterMemory:profile().memory,targets:[manualTarget],action:'delete'});
  assert.deepEqual(result.removedEntryDates,[]);
  assert.ok(result.profile.entries[dates.source]);
  const textTarget=target({evidence:{date:dates.unrelated,kind:'manual',sourceId:'manual',quote:'完全无关的记录'}});
  const textPlan=Privacy.plan(store,{afterMemory:profile().memory,targets:[textTarget],action:'delete'});
  assert.deepEqual(textPlan.removedEntryDates,[dates.unrelated]);
});

test('corrupt days are removed only for delete; other actions fail without overwriting the raw record',()=>{
  const malformed=seeded({[Privacy.DAYS_KEY]:'{broken'});
  const deletion=Privacy.plan(malformed,{afterMemory:profile().memory,targets:[target()],action:'delete'});
  assert.equal(deletion.corruptDays,1);
  Privacy.commit(malformed,deletion);
  assert.equal(malformed.getItem(Privacy.DAYS_KEY),null);

  const stopped=seeded({[Privacy.DAYS_KEY]:'{broken'});
  assert.throws(()=>Privacy.plan(stopped,{afterMemory:profile().memory,targets:[target()],action:'stop'}),/每日会话无法读取/);
  assert.equal(stopped.getItem(Privacy.DAYS_KEY),'{broken');
});

test('corrupt primary data is never replaced by a privacy operation',()=>{
  const store=seeded({[Privacy.PROFILE_KEY]:'{"junk":true}'});
  assert.throws(()=>Privacy.plan(store,{afterMemory:{version:2,items:[],blocks:[]},targets:[target()],action:'delete'}),/主资料无法读取/);
  assert.equal(store.getItem(Privacy.PROFILE_KEY),'{"junk":true}');
});

test('commit detects every-key races and rolls back partial writes after a storage failure',()=>{
  const store=seeded();
  const plan=Privacy.plan(store,{afterMemory:profile().memory,targets:[target()],action:'delete'});
  store.setItem(Privacy.MEMORY_BACKUP_KEY,'changed-after-plan');
  assert.throws(()=>Privacy.commit(store,plan),/另一处更新/);
  assert.equal(store.getItem(Privacy.PROFILE_KEY),JSON.stringify(profile()));

  const failing=seeded();
  const before=new Map(failing.values);
  const originalSet=failing.setItem;
  let writes=0;
  failing.setItem=(key,value)=>{writes+=1;if(writes===2)throw Error('synthetic failure');return originalSet(key,value);};
  const second=Privacy.plan(failing,{afterMemory:profile().memory,targets:[target()],action:'delete'});
  assert.throws(()=>Privacy.commit(failing,second),/隐私操作未完成/);
  assert.deepEqual([...failing.values.entries()],[...before.entries()]);
});

test('import keeps current delete/correct barriers and sanitizes both profile and sessions',()=>{
  const current=profile();
  current.memory.blocks=[
    {rootId:'root-delete',ids:['old-delete'],sources:[{date:dates.source,kind:'note',sourceId:'n'}],mode:'delete',at:'now',keys:['id:deadbeef']},
    {rootId:'root-stop',ids:['old-stop'],sources:[{date:dates.derived,kind:'chat',sourceId:'c'}],mode:'correct',at:'now',keys:['id:deadbeef']}
  ];
  const incoming={
    ...profile(),
    entries:{[dates.source]:{note:'导入后仍不应恢复'},[dates.derived]:{note:'保留但历史受阻'},[dates.unrelated]:{note:'保留'}},
    memory:{version:2,revision:9,items:[memoryItem('old-delete','root-delete','待删',dates.source),memoryItem('old-stop','root-stop','待停',dates.derived)],blocks:[]},
    days:{
      [dates.source]:session('import-source',{memoryIds:['old-delete'],sourceDates:[dates.source]}),
      [dates.derived]:session('import-derived',{memoryIds:['old-stop'],sourceDates:[dates.source]}),
      [dates.unrelated]:session('import-safe',{sourceDates:[dates.unrelated]})
    }
  };
  const result=Privacy.importBundle(incoming,current);
  assert.equal(result.profile.days,undefined);
  assert.equal(result.profile.entries[dates.source],undefined);
  assert.ok(result.profile.entries[dates.derived]);
  assert.equal(result.days[dates.source],undefined);
  assert.equal(result.days[dates.derived],undefined);
  assert.equal(result.days[dates.unrelated].signature,'import-safe');
  assert.ok(result.memory.blocks.some(block=>block.rootId==='root-delete'));
  assert.ok(result.memory.blocks.some(block=>block.rootId==='root-stop'));
  assert.equal(result.memory.items.some(item=>item.id==='old-delete'),false);
  const stopped=result.memory.items.find(item=>item.id==='old-stop');
  assert.ok(!stopped||stopped.status==='archived');
});

test('sanitize helpers never mutate caller objects and preserve unrelated days',()=>{
  const memory={blocks:[{rootId:'r',ids:['m'],sources:[{date:dates.source,kind:'note',sourceId:'n'}],mode:'delete',at:'x',keys:[]}]};
  const originalProfile={entries:{[dates.source]:{note:'a'},[dates.unrelated]:{note:'b'}},memory:{items:[]}};
  const originalDays={[dates.source]:session('a'),[dates.unrelated]:session('b')};
  const cleanProfile=Privacy.sanitizeProfile(originalProfile,memory);
  const cleanDays=Privacy.sanitizeDays(originalDays,memory);
  assert.equal(cleanProfile.entries[dates.source],undefined);
  assert.equal(cleanProfile.entries[dates.unrelated].note,'b');
  assert.equal(cleanDays[dates.source],undefined);
  assert.equal(cleanDays[dates.unrelated].signature,'b');
  assert.ok(originalProfile.entries[dates.source]);
  assert.ok(originalDays[dates.source]);
});

test('repeated sanitization keeps invalidated signatures stable for CAS tokens',()=>{
  const memory={blocks:[{rootId:'r',ids:['m'],sources:[{date:dates.source,kind:'note',sourceId:'n'}],mode:'stop',at:'x',keys:[]}]};
  const days={[dates.source]:session('old',{memoryIds:['m'],sourceDates:[dates.source]})};
  assert.deepEqual(Privacy.sanitizeDays(days,memory),Privacy.sanitizeDays(days,memory));
});

test('correct barrier archives only old ids and keeps a newer version in the same root active',()=>{
  const p=profile();
  p.memory.blocks=[{rootId:'root-1',ids:['m-old'],sources:[{date:dates.source,kind:'note',sourceId:'n'}],mode:'correct',at:'x',keys:[]}];
  const clean=Privacy.sanitizeProfile(p,p.memory);
  assert.equal(clean.memory.items.find(item=>item.id==='m-new').status,'confirmed');
});

test('correct barriers do not match a newer session by root alone',()=>{
  const memory={version:2,revision:1,items:[],blocks:[{rootId:'root-1',ids:['old-id'],sources:[],mode:'correct',at:'x',keys:[]}]};
  const days={[dates.unrelated]:session('new',{memoryRoots:['root-1'],sourceDates:[dates.unrelated]})};
  const clean=Privacy.sanitizeDays(days,memory);
  assert.equal(clean[dates.unrelated].signature,'new');
});

test('privacy block acknowledgement prevents repeated entry/session invalidation',()=>{
  const previous=Memory.acknowledges;
  Memory.acknowledges=(value)=>Array.isArray(value?.privacyBlocks)&&value.privacyBlocks.includes('ack');
  try{
    const memory={version:2,revision:1,items:[],blocks:[{rootId:'r',ids:['m'],sources:[{date:dates.source,kind:'note',sourceId:'n'}],mode:'delete',at:'x',keys:[]}]};
    const profileValue={entries:{[dates.source]:{note:'keep',privacyBlocks:['ack']}},memory};
    const days={[dates.source]:session('fresh',{privacyBlocks:['ack'],sourceDates:[dates.source]})};
    assert.ok(Privacy.sanitizeProfile(profileValue,memory).entries[dates.source]);
    assert.equal(Privacy.sanitizeDays(days,memory)[dates.source].signature,'fresh');
  }finally{
    if(previous)Memory.acknowledges=previous;else delete Memory.acknowledges;
  }
});

test('acknowledging one source never exempts a different deletion source',()=>{
  const first={rootId:'first',ids:[],sources:[{date:'2026-10-20',kind:'note',sourceId:'n1'}],mode:'stop',at:'',keys:[]},second={rootId:'second',ids:[],sources:[{date:'2026-10-21',kind:'note',sourceId:'n2'}],mode:'delete',at:'',keys:[]};
  const memory={...Memory.empty(),blocks:[first,second]};
  const days={'2026-10-22':session('mixed',{sourceDates:['2026-10-20','2026-10-21'],privacyBlocks:[Memory.barrierToken(first)]})};
  assert.equal(Privacy.sanitizeDays(days,memory)['2026-10-22'],undefined);
});

test('delete propagation upgrades an already invalidated dependency and old derivatives remain blocked after a fresh source',()=>{
  const stopped={rootId:'stop',ids:['stopped'],sources:[],mode:'stop',at:'',keys:[]},deleted={rootId:'delete',ids:[],sources:[{date:'2026-10-20',kind:'note',sourceId:'n'}],mode:'delete',at:'',keys:[]},memory={...Memory.empty(),blocks:[stopped,deleted]};
  const days={'2026-10-20':session('fresh',{privacyBlocks:Memory.barrierTokens(memory)}),'2026-10-21':session('a',{memoryIds:['stopped'],sourceDates:['2026-10-20']}),'2026-10-22':session('b',{sourceDates:['2026-10-21']})};
  const clean=Privacy.sanitizeDays(days,memory);assert.equal(clean['2026-10-20'].signature,'fresh');assert.equal(clean['2026-10-21'],undefined);assert.equal(clean['2026-10-22'],undefined);
});
