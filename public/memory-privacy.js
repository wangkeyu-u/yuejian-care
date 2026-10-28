(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('./state.js'),require('./memory.js'),require('./day-sessions.js'));
  else root.MoonMemoryPrivacy=factory(root.MoonState,root.MoonMemory,root.MoonDaySessions);
})(typeof globalThis!=='undefined'?globalThis:this,function(State,Memory,DaySessions){
  'use strict';

  /*
   * This module deliberately owns no UI state.  It prepares a new profile and
   * day-session map, then commits both together with the four private backup
   * keys.  The browser localStorage API has no transaction primitive, so the
   * small snapshot/rollback layer below is the transaction boundary used by
   * the UI and by imports.
   */
  const PROFILE_KEY='yuejian.personal.v1';
  const DAYS_KEY='yuejian.days.v1';
  const PERIOD_BACKUP_KEY='yuejian.personal.pre-periods-v2';
  const IMPORT_BACKUP_KEY='yuejian.pre-import.v1';
  const MEMORY_BACKUP_KEY='yuejian.memory.pre-v2';
  const BUNDLE_BACKUP_KEY='yuejian.bundle.preimport.v1';
  const BACKUP_KEYS=[PERIOD_BACKUP_KEY,IMPORT_BACKUP_KEY,MEMORY_BACKUP_KEY,BUNDLE_BACKUP_KEY];
  const ALL_KEYS=[PROFILE_KEY,DAYS_KEY,...BACKUP_KEYS];
  const VALID_ACTIONS=new Set(['delete','stop','correct','changed']);
  const ISO=/^\d{4}-\d{2}-\d{2}$/;

  const isObject=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
  const own=(value,key)=>isObject(value)&&Object.prototype.hasOwnProperty.call(value,key);
  const string=value=>typeof value==='string'?value:'';
  const trim=value=>string(value).trim();
  const iso=value=>ISO.test(string(value))&&(()=>{const d=new Date(value+'T00:00:00Z');return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===value;})();

  function clone(value){
    if(value===undefined)return undefined;
    if(typeof structuredClone==='function'){
      try{return structuredClone(value);}catch{}
    }
    try{return JSON.parse(JSON.stringify(value));}catch{return value;}
  }

  function plain(value){return isObject(value);}

  function cleanText(value,max=240){return trim(value).slice(0,max);}

  function canonical(value){
    return string(value).normalize?string(value).normalize('NFKC').toLocaleLowerCase().replace(/\s+/g,''):string(value).toLowerCase().replace(/\s+/g,'');
  }

  // FNV-1a is enough here: these are local de-duplication keys, not secrets.
  function hash(value){
    let result=2166136261;
    for(const ch of canonical(value)){result^=ch.charCodeAt(0);result=Math.imul(result,16777619);}
    return (result>>>0).toString(16);
  }

  function now(){
    const date=new Date();
    return Number.isNaN(date.getTime())?'unknown':date.toISOString();
  }

  function invalidatedSignature(value,date,memory){
    if(plain(value)&&typeof value.signature==='string'&&value.signature.startsWith('invalidated:'))return value.signature;
    let token='';
    try{
      if(Memory&&typeof Memory.contextToken==='function')token=Memory.contextToken(cleanMemory(memory));
    }catch{}
    if(!token)try{token=hash(JSON.stringify({date,signature:plain(value)?value.signature:'',blocks:cleanMemory(memory).blocks}));}catch{token=hash(date);}
    return 'invalidated:'+cleanText(token,80);
  }

  function safeError(message){return Error(message);}

  function read(storage,key){
    try{
      if(!storage||typeof storage.getItem!=='function')throw Error('missing storage');
      const value=storage.getItem(key);
      return value===undefined?null:value;
    }catch{throw safeError('无法读取本机隐私数据。');}
  }

  function write(storage,key,value){
    try{
      if(value===null){
        if(typeof storage.removeItem==='function')storage.removeItem(key);
        else storage.setItem(key,null);
      }else storage.setItem(key,value);
    }catch{throw safeError('本机隐私操作未完成。');}
  }

  function rawJson(value){
    if(value===null||value===undefined)return null;
    if(typeof value==='string'){
      try{return JSON.parse(value);}catch{throw safeError('本机数据格式无法读取。');}
    }
    if(isObject(value))return clone(value);
    throw safeError('本机数据格式无法读取。');
  }

  function defaultProfile(){
    try{
      if(State&&typeof State.defaults==='function')return clone(State.defaults());
    }catch{}
    return {version:2,revision:0,entries:{},memory:{version:2,revision:0,items:[],blocks:[]}};
  }

  function defaultMemory(){
    try{if(Memory&&typeof Memory.empty==='function')return clone(Memory.empty());}catch{}
    return {version:2,revision:0,items:[],blocks:[]};
  }

  function parseProfile(raw){
    if(raw===null||raw===undefined)return defaultProfile();
    const value=rawJson(raw);
    if(!plain(value))throw safeError('本机主资料无法读取。');
    if(!['version','periods','starts','entries','memory','revision'].some(key=>own(value,key)))throw safeError('本机主资料无法读取。');
    if(own(value,'entries')&&(value.entries===null||!plain(value.entries)))throw safeError('本机主资料无法读取。');
    if(own(value,'periods')&&!Array.isArray(value.periods))throw safeError('本机主资料无法读取。');
    if(own(value,'memory')&&!plain(value.memory))throw safeError('本机主资料无法读取。');
    if(own(value,'revision')&&(!Number.isSafeInteger(value.revision)||value.revision<0))throw safeError('本机主资料无法读取。');
    if(own(value,'memory')&&Memory&&typeof Memory.normalize==='function'){
      try{Memory.normalize(value.memory);}catch{throw safeError('本机主资料无法读取。');}
    }
    if(State&&typeof State.decode==='function'){
      try{State.decode(value);}catch{throw safeError('本机主资料无法读取。');}
    }
    return value;
  }

  function likelySession(value){
    if(!plain(value))return false;
    // A v2 session still has a signature.  Keep accepting a minimal imported
    // session with metadata only, which lets this module run before the parent
    // day-session decoder is upgraded.
    if(own(value,'signature')&&typeof value.signature!=='string')return false;
    if(own(value,'messages')&&(!Array.isArray(value.messages)||value.messages.some(message=>!plain(message)||!['user','assistant'].includes(message.role)||typeof message.content!=='string')))return false;
    if(own(value,'analysis')&&value.analysis!==null&&!plain(value.analysis))return false;
    if(own(value,'previous')&&value.previous!==null&&!plain(value.previous))return false;
    if(own(value,'sourceDates')&&!Array.isArray(value.sourceDates))return false;
    if(own(value,'memoryIds')&&!Array.isArray(value.memoryIds)&&typeof value.memoryIds!=='string'&&!plain(value.memoryIds))return false;
    if(own(value,'memoryRoots')&&!Array.isArray(value.memoryRoots)&&typeof value.memoryRoots!=='string')return false;
    if(own(value,'privacyBlocks')&&!Array.isArray(value.privacyBlocks))return false;
    return true;
  }

  function parseDays(raw){
    if(raw===null||raw===undefined)return {days:{},corrupt:false,corruptCount:0,corruptDates:[]};
    let value;
    try{value=rawJson(raw);}catch{return {days:{},corrupt:true,corruptCount:1,corruptDates:[]};}
    if(!plain(value))return {days:{},corrupt:true,corruptCount:1,corruptDates:[]};
    const bad=[];
    for(const [date,session] of Object.entries(value)){
      if(!iso(date)||!likelySession(session))bad.push(date);
    }
    if(bad.length)return {days:value,corrupt:true,corruptCount:bad.length,corruptDates:bad};
    return {days:value,corrupt:false,corruptCount:0,corruptDates:[]};
  }

  function readSnapshot(storage){
    const snapshot={};
    for(const key of ALL_KEYS)snapshot[key]=read(storage,key);
    return snapshot;
  }

  function same(a,b){return a===b;}

  function checkToken(expected,raw){
    if(expected===undefined)return;
    if(typeof expected==='string'&&expected===raw)return;
    if(expected===null&&raw===null)return;
    // A few callers pass a parsed token.  Supporting it does not weaken the
    // normal raw-token check and keeps the function usable with small mocks.
    if(isObject(expected)){
      try{if(JSON.stringify(expected)===raw)return;}catch{}
    }
    throw safeError('本机记录已在另一处更新，请重新读取后再试。');
  }

  function normalizeTarget(target){
    if(!plain(target))return {id:'',rootId:'',content:'',evidence:null};
    const evidence=plain(target.evidence)?{
      date:iso(target.evidence.date)?target.evidence.date:'',
      kind:['note','chat','manual'].includes(target.evidence.kind)?target.evidence.kind:'',
      sourceId:cleanText(target.evidence.sourceId,100),
      quote:cleanText(target.evidence.quote,1000)
    }:null;
    return {
      id:cleanText(target.id,120),
      rootId:cleanText(target.rootId,120),
      category:cleanText(target.category,80),
      content:cleanText(target.content,1000),
      evidence
    };
  }

  function normalizedTargets(raw){
    return Array.isArray(raw)?raw.map(normalizeTarget):[];
  }

  function blockSources(targets){
    const values=[];
    for(const target of targets){
      const e=target.evidence;
      if(!e||!e.date||!e.kind||e.kind==='manual')continue;
      const item={date:e.date,kind:e.kind,sourceId:e.sourceId};
      if(!values.some(x=>x.date===item.date&&x.kind===item.kind&&x.sourceId===item.sourceId))values.push(item);
    }
    return values;
  }

  function safeId(value){return cleanText(value,120).replace(/[\u0000-\u001f\u007f]/g,'');}

  function blockFor(targets,action){
    const values=targets.length?targets:[{}];
    const root=values.map(x=>safeId(x.rootId||x.id)).find(Boolean)||`root:${hash(values.map(x=>x.content+'|'+(x.evidence?.quote||'')).join('|'))}`;
    const ids=[...new Set(values.map(x=>safeId(x.id)).filter(Boolean))];
    const sources=blockSources(values);
    const keys=[];
    for(const target of values){
      const id=safeId(target.id),content=target.content,quote=target.evidence?.quote||'';
      if(id)keys.push('id:'+hash(id));
      if(content){
        keys.push('content:'+hash(content));
        try{if(Memory&&typeof Memory.contentKey==='function')keys.push(Memory.contentKey({category:target.category||'',content,evidence:{quote}}));}catch{}
        try{if(Memory&&typeof Memory.fingerprint==='function')keys.push('fact:'+Memory.fingerprint(content));}catch{}
      }
      if(quote){
        keys.push('evidence:'+hash(quote));
        try{if(Memory&&typeof Memory.evidenceKey==='function')keys.push(Memory.evidenceKey({category:target.category||'',content,evidence:{quote}}));}catch{}
      }
    }
    return {
      rootId:root,
      ids,
      sources,
      mode:action,
      at:now(),
      keys:[...new Set(keys)]
    };
  }

  function blocksFor(targets,action){
    const groups=new Map();
    for(const target of targets){
      const key=safeId(target.rootId||target.id)||`anonymous:${hash(target.content+'|'+(target.evidence?.quote||''))}`;
      if(!groups.has(key))groups.set(key,[]);
      groups.get(key).push(target);
    }
    return [...groups.values()].map(group=>blockFor(group,action));
  }

  function cleanBlock(raw){
    if(!plain(raw))return null;
    const ids=[...new Set((Array.isArray(raw.ids)?raw.ids:[raw.id]).map(safeId).filter(Boolean))].slice(0,100);
    const sources=[];
    for(const source of Array.isArray(raw.sources)?raw.sources:[]){
      if(!plain(source)||!iso(source.date)||!['note','chat','manual'].includes(source.kind))continue;
      const item={date:source.date,kind:source.kind,sourceId:cleanText(source.sourceId,100)};
      if(!sources.some(x=>x.date===item.date&&x.kind===item.kind&&x.sourceId===item.sourceId))sources.push(item);
    }
    const mode=['delete','stop','correct'].includes(raw.mode)?raw.mode:'';
    if(!mode)return null;
    const keys=[...new Set((Array.isArray(raw.keys)?raw.keys:[]).map(x=>cleanText(x,180)).filter(x=>/^(id|content|evidence|fact):[a-f0-9]{1,16}$/.test(x)))].slice(0,200);
    const rootId=safeId(raw.rootId||ids[0]);
    if(!rootId&&!ids.length&&!sources.length)return null;
    return {rootId,ids,sources,mode,at:cleanText(raw.at,80),keys};
  }

  function cleanMemory(raw){
    const value=plain(raw)?clone(raw):{version:2,revision:0,items:[]};
    if(!Array.isArray(value.items))value.items=[];
    if(!Array.isArray(value.blocks))value.blocks=[];
    value.blocks=value.blocks.map(cleanBlock).filter(Boolean);
    return value;
  }

  function blockIdentity(block){
    return JSON.stringify({rootId:block.rootId,ids:[...block.ids].sort(),sources:block.sources.map(x=>[x.date,x.kind,x.sourceId]).sort(),mode:block.mode});
  }

  function blockCovers(existing,addition){
    if(!existing||!addition||existing.rootId!==addition.rootId||existing.mode!==addition.mode)return false;
    const ids=new Set(existing.ids||[]),sources=new Set((existing.sources||[]).map(x=>JSON.stringify([x.date,x.kind,x.sourceId])));
    return (addition.ids||[]).every(id=>ids.has(id))&&(addition.sources||[]).every(source=>sources.has(JSON.stringify([source.date,source.kind,source.sourceId])));
  }

  function mergeBlocks(existing,addition){
    const list=[];const seen=new Set();
    const additions=Array.isArray(addition)?addition:(addition?[addition]:[]);
    for(const block of [...(Array.isArray(existing)?existing:[]),...additions]){
      const clean=cleanBlock(block);if(!clean)continue;
      const covered=list.findIndex(item=>blockCovers(item,clean)||blockCovers(clean,item));
      if(covered>=0){if(blockCovers(clean,list[covered]))list[covered]=clean;continue;}
      const key=blockIdentity(clean);if(seen.has(key))continue;seen.add(key);list.push(clean);
    }
    return list;
  }

  function bumpedMemory(afterMemory,currentMemory,targets,action){
    let memory=cleanMemory(afterMemory||currentMemory||{});
    // Preserve barriers already stored locally if the parent calculation did
    // not copy them.  A barrier is intentionally metadata-only.
    const current=cleanMemory(currentMemory||{});
    memory.blocks=mergeBlocks(current.blocks,memory.blocks);
    if(action==='delete'&&targets.length){
      const ids=new Set(targets.flatMap(target=>[target.id,target.rootId]).map(safeId).filter(Boolean));
      memory.items=memory.items.filter(item=>{
        if(!plain(item))return true;
        const itemId=safeId(item.id),itemRoot=safeId(item.rootId);
        return !ids.has(itemId)&&!ids.has(itemRoot);
      });
    }
    if(action!=='changed'&&targets.length){
      let added=false;
      for(const candidate of blocksFor(targets,action)){
        const addition=cleanBlock(candidate);
        const already=addition&&memory.blocks.some(block=>blockCovers(block,addition)||blockIdentity(block)===blockIdentity(addition));
        if(already)continue;
        memory.blocks=mergeBlocks(memory.blocks,addition);added=true;
      }
      if(added){
        const revision=Number.isSafeInteger(memory.revision)&&memory.revision>=0?memory.revision:0;
        memory.revision=revision+1;
      }
    }
    return enforceMemoryBarriers(memory);
  }

  function deleteDatesFromProfile(profile,memory){
    const dates=new Set();
    const entries=plain(profile.entries)?profile.entries:{};
    for(const block of cleanMemory(memory).blocks){
      if(block.mode!=='delete')continue;
      for(const source of block.sources||[]){
        if(source.kind==='manual'||!iso(source.date))continue;
        const entry=entries[source.date];
        if(entry&&!barrierAcknowledged(entry,block,memory))dates.add(source.date);
      }
    }
    for(const [date,entry] of Object.entries(entries)){
      if(!plain(entry))continue;
      const note=string(entry.note);
      if(!note)continue;
      for(const block of cleanMemory(memory).blocks){
        if(block.mode!=='delete')continue;
        if(barrierAcknowledged(entry,block,memory))continue;
        // Blocks intentionally contain hashes only.  Source dates are the
        // reliable import barrier; text matching is done by plan() while the
        // original target text is still available.
        if((block.sources||[]).some(x=>x.kind!=='manual'&&x.date===date)){dates.add(date);break;}
      }
    }
    return dates;
  }

  function sanitizeProfile(profile,memory){
    if(!plain(profile))throw safeError('导入主资料格式无效。');
    if(own(profile,'entries')&&(profile.entries===null||!plain(profile.entries)))throw safeError('导入主资料格式无效。');
    const output=clone(profile),clean=enforceMemoryBarriers(memory||profile.memory||{});
    const dates=deleteDatesFromProfile(output,clean);
    if(plain(output.entries))for(const date of dates)delete output.entries[date];
    output.memory=clean;
    return output;
  }

  function walkMetadata(value,found){
    if(value===null||value===undefined)return;
    if(Array.isArray(value)){for(const item of value)walkMetadata(item,found);return;}
    if(typeof value!=='object')return;
    for(const [key,item] of Object.entries(value)){
      if(key==='sourceDates'){
        if(Array.isArray(item)){for(const date of item)if(iso(date))found.sourceDates.add(date);}
        else if(iso(item))found.sourceDates.add(item);
      }else if(key==='memoryIds'||key==='memoryId'){
        const collect=entry=>{
          if(Array.isArray(entry)){for(const child of entry)collect(child);return;}
          if(typeof entry==='string'){found.memoryIds.add(entry);return;}
          if(plain(entry)){if(typeof entry.id==='string')found.memoryIds.add(entry.id);for(const [key,child] of Object.entries(entry))if(key!=='rootId')collect(child);}
        };
        collect(item);
      }else if(key==='memoryRoots'){
        if(Array.isArray(item)){for(const root of item)if(typeof root==='string')found.rootIds.add(root);}
        else if(typeof item==='string')found.rootIds.add(item);
      }else if(key==='rootId'&&typeof item==='string')found.rootIds.add(item);
      walkMetadata(item,found);
    }
  }

  function metadata(value){
    const found={sourceDates:new Set(),memoryIds:new Set(),rootIds:new Set()};
    walkMetadata(value,found);
    return found;
  }

  function barrierAcknowledged(value,block,memory){
    try{
      const subject=plain(value)&&own(value,'previous')?{...value,previous:null}:value;
      if(Memory&&typeof Memory.acknowledges==='function'&&Memory.acknowledges(subject,block))return true;
    }catch{}
    const direct=plain(value)&&Array.isArray(value.privacyBlocks)?value.privacyBlocks.filter(x=>typeof x==='string'):[];
    if(!direct.length)return false;
    let token='';
    try{
      if(Memory&&typeof Memory.barrierTokens==='function'){
        const blocks=cleanMemory(memory).blocks,index=blocks.findIndex(item=>blockIdentity(item)===blockIdentity(block));
        const tokens=Memory.barrierTokens(memory);
        if(Array.isArray(tokens)&&index>=0)token=tokens[index];
        else if(isObject(tokens)&&block.rootId)token=tokens[block.rootId];
      }
    }catch{}
    if(!token)try{token=Memory&&typeof Memory.fingerprint==='function'?Memory.fingerprint(blockIdentity(block)):hash(blockIdentity(block));}catch{token=hash(blockIdentity(block));}
    return direct.includes(token);
  }

  function stringContains(value,needles){
    if(typeof value!=='string')return false;
    return needles.some(needle=>needle&&value.includes(needle));
  }

  function blockMatch(value,date,block,needles,memory=null){
    const meta=metadata(value),json=(()=>{try{return JSON.stringify(value)||'';}catch{return '';}})();
    const acknowledged=barrierAcknowledged(value,block,memory);
    if(acknowledged)return {matched:false,idMatch:false,rootMatch:false,dateMatch:false,textMatch:false,acknowledged:true};
    const ids=new Set((block.ids||[]).filter(Boolean));
    const idMatch=[...ids].some(id=>meta.memoryIds.has(id)||!meta.memoryIds.size&&!meta.rootIds.size&&json.includes(JSON.stringify(id)));
    const rootMatch=block.mode!=='correct'&&!!block.rootId&&(meta.rootIds.has(block.rootId)||json.includes(JSON.stringify(block.rootId)));
    // A session's own sourceDates describe what it was derived from; they do
    // not make the session a direct match merely because one equals its own
    // calendar date.  Propagation below handles references to an affected day.
    const dateMatch=(block.sources||[]).some(source=>source.kind!=='manual'&&source.date===date);
    const textMatch=stringContains(json,needles);
    return {matched:idMatch||rootMatch||dateMatch||textMatch,idMatch,rootMatch,dateMatch,textMatch,acknowledged:false};
  }

  function sanitizeDays(days,memory){
    if(!plain(days))throw safeError('导入每日会话格式无效。');
    const output=clone(days),clean=cleanMemory(memory||{}),blocks=clean.blocks;
    for(const [date,value] of Object.entries(output))if(!iso(date)||!likelySession(value))throw safeError('导入每日会话格式无效。');
    if(!blocks.length)return output;
    // Carry the exact originating barriers through the graph. Acknowledging
    // one old barrier must never suppress a different, newer deletion.
    const causes=new Map();
    function add(date,block){if(!causes.has(date))causes.set(date,new Map());const map=causes.get(date),key=blockIdentity(block);if(map.has(key))return false;map.set(key,block);return true;}
    for(const block of blocks){
      for(const source of block.sources||[])if(source.kind!=='manual'&&iso(source.date))add(source.date,block);
      for(const [date,value]of Object.entries(output))if(blockMatch(value,date,block,[],clean).matched)add(date,block);
    }
    let changed=true;
    while(changed){changed=false;for(const [date,value]of Object.entries(output))for(const sourceDate of metadata(value).sourceDates)for(const block of causes.get(sourceDate)?.values()||[])if(!barrierAcknowledged(value,block,clean)&&add(date,block))changed=true;}
    for(const [date,value]of Object.entries(output)){
      const relevant=[...(causes.get(date)?.values()||[])].filter(block=>!barrierAcknowledged(value,block,clean));
      if(!relevant.length)continue;
      if(relevant.some(block=>block.mode==='delete')){delete output[date];continue;}
      value.signature=invalidatedSignature(value,date,clean);value.invalidated=true;value.blockedForExtraction=true;
    }
    return output;
  }

  function deleteAcknowledged(profile,date,memory){
    const entry=plain(profile.entries)?profile.entries[date]:null;
    if(!entry)return false;
    const blocks=cleanMemory(memory).blocks.filter(block=>block.mode==='delete');
    return blocks.length>0&&blocks.every(block=>barrierAcknowledged(entry,block,memory));
  }

  function sourceDateAcknowledged(profile,date,memory){
    const entry=plain(profile.entries)?profile.entries[date]:null;
    if(!entry)return false;
    const blocks=cleanMemory(memory).blocks.filter(block=>block.mode!=='changed'&&(block.sources||[]).some(source=>source.date===date&&source.kind!=='manual'));
    return blocks.length>0&&blocks.every(block=>barrierAcknowledged(entry,block,memory));
  }

  function textAffectedDates(profile,targets,memory){
    const dates=new Set();
    const entries=plain(profile.entries)?profile.entries:{};
    for(const target of targets){
      const needles=[target.content,target.evidence?.quote].filter(x=>x&&x.length>=2);
      if(!needles.length)continue;
      for(const [date,entry] of Object.entries(entries))if(plain(entry)&&stringContains(entry.note,needles)&&!deleteAcknowledged(profile,date,memory||{}))dates.add(date);
    }
    return dates;
  }

  function targetDates(targets){
    const dates=new Set();
    for(const target of targets){
      const e=target.evidence;
      if(e&&e.kind!=='manual'&&iso(e.date))dates.add(e.date);
    }
    return dates;
  }

  function enforceMemoryBarriers(memory){
    const output=cleanMemory(memory),blocks=output.blocks;
    output.items=output.items.filter(item=>{
      if(!plain(item))return true;
      const ids=new Set([safeId(item.id),safeId(item.rootId)].filter(Boolean));
      let deleted=false,archived=false,archiveReason='';
      for(const block of blocks){
        const blockIds=new Set([safeId(block.rootId),...(block.ids||[]).map(safeId)].filter(Boolean));
        const matches=block.mode==='correct'
          ?(block.ids||[]).some(id=>safeId(id)===safeId(item.id))
          :[...ids].some(id=>blockIds.has(id));
        if(!matches)continue;
        if(block.mode==='delete')deleted=true;
        else if(block.mode==='stop'||block.mode==='correct'){archived=true;archiveReason=block.mode==='stop'?'stopped':'corrected';}
      }
      if(deleted)return false;
      if(archived){item.status='archived';if(!item.archiveReason)item.archiveReason=archiveReason;}
      return true;
    });
    return output;
  }

  function persistDeleteSources(memory,dates){
    if(!dates||!dates.size)return memory;
    const output=cleanMemory(memory);
    const blocks=[];
    for(const date of dates){
      if(!iso(date))continue;
      const already=output.blocks.some(block=>block.mode==='delete'&&(block.sources||[]).some(source=>source.date===date&&source.kind!=='manual'));
      if(already)continue;
      blocks.push({rootId:'entry-date:'+hash(date),ids:[],sources:[{date,kind:'note',sourceId:'entry:'+date}],mode:'delete',at:'',keys:[]});
    }
    output.blocks=mergeBlocks(output.blocks,blocks);
    return output;
  }

  function addEphemeralDateBlocks(memory,dates,action){
    if(!dates.size||!['delete','stop','correct','changed'].includes(action))return memory;
    const output=cleanMemory(memory),mode=action==='changed'?'correct':action;
    for(const date of dates){
      const block={rootId:'entry-date:'+hash(date),ids:[],sources:[{date,kind:'note',sourceId:'entry:'+date}],mode,at:'',keys:[]};
      output.blocks=mergeBlocks(output.blocks,block);
    }
    return output;
  }

  function dayNeedsTextMatch(days,targets,action,memory){
    const needles=[];for(const target of targets){if(target.content)needles.push(target.content);if(target.evidence?.quote)needles.push(target.evidence.quote);}
    if(!needles.length)return {days,dates:new Set()};
    const output=clone(days),dates=new Set();
    for(const [date,value] of Object.entries(output)){
      const blocks=cleanMemory(memory||{}).blocks;
      if(blocks.length&&blocks.every(block=>barrierAcknowledged(value,block,memory)))continue;
      let matched=false;try{matched=stringContains(JSON.stringify(value),needles);}catch{}
      if(!matched)continue;
      dates.add(date);
      if(action==='delete')delete output[date];
      else if(['stop','correct','changed'].includes(action)&&plain(value)){
        value.signature=invalidatedSignature(value,date,memory);value.invalidated=true;value.blockedForExtraction=true;
      }
    }
    return {days:output,dates};
  }

  function plan(storage,options={}){
    const action=options.action;
    if(!VALID_ACTIONS.has(action))throw safeError('隐私操作类型无效。');
    const snapshot=readSnapshot(storage);
    checkToken(options.expectedToken,snapshot[PROFILE_KEY]);
    let profile=parseProfile(snapshot[PROFILE_KEY]);
    const parsedDays=parseDays(snapshot[DAYS_KEY]);
    let targets=normalizedTargets(options.targets);
    const currentMemory=plain(profile.memory)?profile.memory:{};
    const afterMemory=options.afterMemory===undefined?currentMemory:options.afterMemory;
    const knownItems=[...(Array.isArray(currentMemory.items)?currentMemory.items:[]),...(Array.isArray(afterMemory?.items)?afterMemory.items:[])];
    targets=targets.map(target=>{
      if(target.rootId)return target;
      const item=knownItems.find(candidate=>plain(candidate)&&candidate.id===target.id&&candidate.rootId);
      return item?{...target,rootId:safeId(item.rootId)}:target;
    });
    let memory=bumpedMemory(afterMemory,currentMemory,targets,action);
    const textDates=textAffectedDates(profile,targets,memory);
    if(action==='delete')memory=persistDeleteSources(memory,textDates);
    const directDates=new Set([...targetDates(targets),...textDates].filter(date=>!sourceDateAcknowledged(profile,date,memory)));
    const removedEntryDates=action==='delete'?new Set([...directDates].filter(date=>!deleteAcknowledged(profile,date,memory))):new Set();
    const profileInput=clone(profile);
    if(plain(profileInput.entries))for(const date of removedEntryDates)delete profileInput.entries[date];
    // The source-date barrier is represented in memory; the targets are still
    // available here for legacy sessions that only retained raw text.
    let dayMemory=memory;
    if(action==='changed'){
      dayMemory=cleanMemory(memory);for(const temporary of blocksFor(targets,'correct'))dayMemory.blocks=mergeBlocks(dayMemory.blocks,temporary);
    }
    // An entry-note match is also an association for the corresponding day,
    // including when the original memory evidence was marked manual.  These
    // date blocks are ephemeral and are never persisted as source barriers.
    dayMemory=addEphemeralDateBlocks(dayMemory,textDates,action);
    let newDays;
    if(parsedDays.corrupt){
      if(action==='delete')newDays={};
      else throw safeError('本机每日会话无法读取，已停止写入。');
    }else{
      newDays=sanitizeDays(parsedDays.days,dayMemory);
      const legacy=dayNeedsTextMatch(newDays,targets,action,dayMemory);
      newDays=legacy.days;
      if(legacy.dates.size){
        if(action==='delete'){
          for(const date of legacy.dates)removedEntryDates.add(date);
          memory=persistDeleteSources(memory,legacy.dates);
        }
        dayMemory=addEphemeralDateBlocks(dayMemory,legacy.dates,action);
        newDays=sanitizeDays(newDays,dayMemory);
      }
    }
    // Profile text matching must happen before sanitizeProfile so a manual
    // source cannot accidentally become a date-wide deletion on import.
    if(action==='delete'&&plain(profileInput.entries))for(const date of removedEntryDates)delete profileInput.entries[date];
    const newProfile=sanitizeProfile(profileInput,memory);
    newProfile.revision=(Number.isSafeInteger(profile.revision)&&profile.revision>=0?profile.revision:0)+1;
    if(State&&typeof State.decode==='function'){
      try{State.decode(newProfile);}catch{throw safeError('本机主资料无法读取，已停止写入。');}
    }
    const affectedDates=new Set([...directDates]);
    for(const date of Object.keys(parsedDays.days||{}))if(!Object.hasOwn(newDays,date))affectedDates.add(date);
    for(const [date,value] of Object.entries(newDays||{}))if(value&&value.blockedForExtraction)affectedDates.add(date);
    const backupCount=BACKUP_KEYS.reduce((count,key)=>count+(snapshot[key]!==null?1:0),0);
    const writes={
      [PROFILE_KEY]:JSON.stringify(newProfile),
      [DAYS_KEY]:Object.keys(newDays||{}).length?JSON.stringify(newDays):null
    };
    for(const key of BACKUP_KEYS)writes[key]=null;
    const result={
      profile:newProfile,
      days:newDays,
      affectedDates:[...affectedDates].filter(iso).sort(),
      removedEntryDates:[...removedEntryDates].filter(iso).sort(),
      backupCount,
      corruptDays:parsedDays.corruptCount,
      corruptDayDates:parsedDays.corruptDates.slice(),
      changes:{
        action,
        profileChanged:JSON.stringify(profile)!==JSON.stringify(newProfile),
        daysChanged:JSON.stringify(parsedDays.days)!==JSON.stringify(newDays),
        removedEntries:[...removedEntryDates].filter(iso).sort(),
        removedDays:Object.keys(parsedDays.days||{}).filter(date=>!Object.hasOwn(newDays,date)).sort(),
        invalidatedDays:Object.entries(newDays||{}).filter(([,value])=>value&&value.blockedForExtraction).map(([date])=>date).sort(),
        clearedBackups:BACKUP_KEYS.filter(key=>snapshot[key]!==null)
      }
    };
    Object.defineProperty(result,'_snapshot',{value:snapshot,enumerable:false});
    Object.defineProperty(result,'_writes',{value:writes,enumerable:false});
    Object.defineProperty(result,'_expectedToken',{value:options.expectedToken,enumerable:false});
    Object.defineProperty(result,'_keys',{value:ALL_KEYS.slice(),enumerable:false});
    return result;
  }

  function commit(storage,prepared){
    if(!prepared||!isObject(prepared)||!prepared._snapshot||!prepared._writes)throw safeError('隐私操作方案无效。');
    const snapshot=prepared._snapshot,writes=prepared._writes;
    let current;
    try{current=readSnapshot(storage);}catch{throw safeError('本机隐私操作未完成。');}
    for(const key of ALL_KEYS)if(!same(current[key],snapshot[key]))throw safeError('本机记录已在另一处更新，请重新读取后再试。');
    checkToken(prepared._expectedToken,current[PROFILE_KEY]);
    const touched=[];
    try{
      for(const key of ALL_KEYS){
        const wanted=Object.hasOwn(writes,key)?writes[key]:snapshot[key];
        if(same(wanted,snapshot[key]))continue;
        touched.push(key);write(storage,key,wanted);
      }
      for(const key of touched){
        const wanted=Object.hasOwn(writes,key)?writes[key]:snapshot[key];
        if(read(storage,key)!==wanted)throw safeError('本机隐私操作未完成。');
      }
    }catch{
      for(const key of touched.reverse()){
        try{write(storage,key,snapshot[key]);}catch{}
      }
      throw safeError('本机隐私操作未完成，已尽量恢复原记录。');
    }
    prepared.committed=true;
    return prepared;
  }

  function apply(storage,options={}){return commit(storage,plan(storage,options));}

  function reconcile(incoming,current){
    const old=cleanMemory(current||{});
    let resultMemory;
    if(Memory&&typeof Memory.reconcileImport==='function'){
      try{
        const result=Memory.reconcileImport(clone(incoming),clone(current));
        if(result&&isObject(result.memory))resultMemory=cleanMemory(result.memory);
        else if(result&&isObject(result))resultMemory=cleanMemory(result);
      }catch{throw safeError('导入记忆格式无法读取。');}
    }
    const merged=resultMemory||cleanMemory(incoming||{});
    merged.blocks=mergeBlocks(old.blocks,merged.blocks);
    return enforceMemoryBarriers(merged);
  }

  function importBundle(data,currentProfile){
    if(!plain(data))throw safeError('导入文件格式无效。');
    const incomingProfile=plain(data.profile)?data.profile:data;
    if(!plain(incomingProfile))throw safeError('导入主资料格式无效。');
    const current=plain(currentProfile)?currentProfile:{};
    const incomingMemory=plain(incomingProfile.memory)?incomingProfile.memory:defaultMemory();
    const currentMemory=plain(current.memory)?current.memory:defaultMemory();
    const mergedMemory=reconcile(incomingMemory,currentMemory);
    const profileInput=clone(incomingProfile);
    delete profileInput.app;
    delete profileInput.exportedAt;
    delete profileInput.days;
    delete profileInput.library;
    delete profileInput.bundleBackup;
    delete profileInput.legacyBackup;
    delete profileInput.preImportBackup;
    delete profileInput.memoryMigrationBackup;
    delete profileInput.unreadableOriginal;
    const profile=sanitizeProfile({...profileInput,memory:mergedMemory},mergedMemory);
    const suppliedDays=own(data,'days')?data.days:(own(incomingProfile,'days')?incomingProfile.days:{});
    const rawDays=typeof suppliedDays==='string'?rawJson(suppliedDays):suppliedDays;
    if(!plain(rawDays))throw safeError('导入每日会话格式无效。');
    const days=sanitizeDays(rawDays,mergedMemory);
    return {
      ...clone(data),
      ...profile,
      profile,
      memory:mergedMemory,
      days
    };
  }

  return {
    PROFILE_KEY,DAYS_KEY,PERIOD_BACKUP_KEY,IMPORT_BACKUP_KEY,MEMORY_BACKUP_KEY,BUNDLE_BACKUP_KEY,
    KEY:PROFILE_KEY,BACKUP_KEY:PERIOD_BACKUP_KEY,IMPORT_KEY:IMPORT_BACKUP_KEY,MEMORY_KEY:MEMORY_BACKUP_KEY,BUNDLE_KEY:BUNDLE_BACKUP_KEY,
    BACKUP_KEYS,ALL_KEYS,
    plan,commit,apply,sanitizeProfile,sanitizeDays,importBundle,
    // Exposing no source text is part of the contract, but these helpers make
    // integration tests able to use the same safe copy rules.
    _cleanMemory:cleanMemory,
    _hash:hash
  };
});
