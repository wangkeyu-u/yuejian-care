(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./core.js'),require('./periods.js'),require('./memory.js'),require('./phases.js'));else root.MoonState=factory(root.MoonCore,root.MoonPeriods,root.MoonMemory,root.MoonPhases);})(typeof globalThis!=='undefined'?globalThis:this,function(Core,Periods,Memory,Phases){
  'use strict';
  const KEY='yuejian.personal.v1',BACKUP='yuejian.personal.pre-periods-v2',IMPORT='yuejian.pre-import.v1',MEMORY_BACKUP='yuejian.memory.pre-v2';
  const topics=['tcm','herbal','acupuncture','moxibustion','movement','products'];
  const text=(value,size)=>typeof value==='string'?value.trim().slice(0,size):'';
  const one=(value,values,fallback='')=>values.includes(value)?value:fallback;
  const defaults=()=>({version:3,revision:0,periodRevision:0,periods:[],starts:[],cycleLength:28,periodLength:5,partner:{nickname:'',support:'ask',likes:'',avoid:'',dietary:'',consent:false},birthday:'',birthConfirmed:false,birthTime:'',city:'',culture:true,quiet:false,model:'gpt-4.1-mini',tone:'gentle',focus:[],memory:Memory.empty(),phaseTracking:'calendar',entries:{},activities:[],tasks:{}});
  function entry(raw={},date=Core.todayISO()){return {signals:Phases.signals(raw.signals||[]),phaseHint:Phases.hint(raw.phaseHint,date),privacyBlocks:Array.isArray(raw.privacyBlocks)?raw.privacyBlocks.filter(x=>typeof x==='string'&&/^[a-f0-9]{1,8}$/.test(x)).slice(-2000):[],mood:one(raw.mood,['平静','紧绷','很难受']),pain:[0,2,5,8,10].includes(raw.pain)?raw.pain:null,energy:one(raw.energy,['low','medium','high']),sleep:one(raw.sleep,['poor','okay']),flow:one(raw.flow,['usual','heavy','unexpected']),support:one(raw.support,['独处','安静陪伴','具体帮助']),note:text(raw.note,500),topics:Array.isArray(raw.topics)?[...new Set(raw.topics.filter(x=>topics.includes(x)))]:[]};}
  function decode(raw,today=Core.todayISO()){
    if(!raw)return defaults();const input=typeof raw==='string'?JSON.parse(raw):raw;
    if(!input||typeof input!=='object'||Array.isArray(input))throw Error('记录格式无法读取');
    const s=defaults();s.periods=Periods.migratePeriods(input,today);s.starts=s.periods.map(p=>p.start);
    s.revision=Number.isSafeInteger(input.revision)&&input.revision>=0?input.revision:0;s.periodRevision=Number.isSafeInteger(input.periodRevision)&&input.periodRevision>=0?input.periodRevision:0;
    s.cycleLength=Number.isInteger(input.cycleLength)&&input.cycleLength>=15&&input.cycleLength<=90?input.cycleLength:28;s.periodLength=Number.isInteger(input.periodLength)&&input.periodLength>=1&&input.periodLength<=14?input.periodLength:5;
    const p=input.partner||{};s.partner={nickname:text(p.nickname,40),support:one(p.support,['ask','alone','quiet','help'],'ask'),likes:text(p.likes,240),avoid:text(p.avoid,240),dietary:text(p.dietary,300),consent:p.consent===true};
    s.birthday=Core.isISODate(input.birthday)?input.birthday:'';s.birthConfirmed=input.birthConfirmed===true&&!!s.birthday;s.birthTime=/^([01]\d|2[0-3]):[0-5]\d$/.test(input.birthTime)?input.birthTime:'';s.city=text(input.city,40);
    s.culture=typeof input.culture==='boolean'?input.culture:true;s.quiet=input.quiet===true;s.model=/^gpt-[a-zA-Z0-9._-]{1,70}$/.test(input.model)?input.model:s.model;s.tone=one(input.tone,['brief','gentle','detailed'],'gentle');s.focus=Array.isArray(input.focus)?[...new Set(input.focus.filter(x=>topics.includes(x)))]:[];
    if(input.entries&&typeof input.entries==='object')for(const [date,value]of Object.entries(input.entries))if(Core.isISODate(date)&&date<=today&&value&&typeof value==='object')s.entries[date]=entry(value,date);
    s.phaseTracking=input.phaseTracking==='paused'?'paused':'calendar';s.memory=Memory.normalize(input.memory);Memory.active(s.memory,today,today);s.activities=Array.isArray(input.activities)?input.activities.filter(x=>typeof x==='string').slice(0,20):[];s.tasks=input.tasks&&typeof input.tasks==='object'?input.tasks:{};return s;
  }
  function create(storage,{today=()=>Core.todayISO()}={}){
    let value,error=null,original=null;const listeners=new Set();
    function reload(){try{original=storage.getItem(KEY);value=decode(original,today());error=null;}catch(e){value=defaults();error=e;}}
    reload();
    function notify(){for(const listener of listeners)listener(value,error);}
    function update(mutator,expected){
      if(error)throw Error('现有数据无法读取，已暂停写入；请先导出原始备份。');
      const raw=storage.getItem(KEY);if(expected!==undefined&&raw!==expected)throw Error('记录已在另一处更新，请重新打开表单后再保存。');
      const next=decode(raw,today());mutator(next);next.periods=Periods.validatePeriods(next.periods,today());next.starts=next.periods.map(p=>p.start);next.memory=Memory.normalize(next.memory);Memory.active(next.memory,today(),today());next.revision+=1;next.version=3;
      if(raw&&!Object.hasOwn(JSON.parse(raw),'periods')&&!storage.getItem(BACKUP))storage.setItem(BACKUP,raw);
      if(raw&&JSON.parse(raw).memory?.version===1&&!storage.getItem(MEMORY_BACKUP))storage.setItem(MEMORY_BACKUP,raw);
      storage.setItem(KEY,JSON.stringify(next));value=next;original=JSON.stringify(next);notify();return next;
    }
    function replace(data){const next=decode(data,today());next.memory=Memory.reconcileImport(next.memory,value.memory);const raw=storage.getItem(KEY);storage.setItem(IMPORT,JSON.stringify({raw}));next.revision=Math.max(next.revision,value.revision)+1;storage.setItem(KEY,JSON.stringify(next));reload();notify();}
    function restore(){const backup=JSON.parse(storage.getItem(IMPORT));if(!backup||!(backup.raw===null||typeof backup.raw==='string'))throw Error('没有可恢复的备份');const restored=decode(backup.raw,today());restored.memory=Memory.reconcileImport(restored.memory,value.memory);storage.setItem(KEY,JSON.stringify(restored));reload();notify();}
    return {get:()=>value,error:()=>error,token:()=>storage.getItem(KEY),original:()=>original,update,replace,restore,reload:()=>{reload();notify();},subscribe:fn=>{listeners.add(fn);return()=>listeners.delete(fn);},clear:()=>{for(const k of[KEY,BACKUP,IMPORT,MEMORY_BACKUP])storage.removeItem(k);reload();notify();},backups:()=>({legacyBackup:storage.getItem(BACKUP),preImportBackup:storage.getItem(IMPORT),memoryMigrationBackup:storage.getItem(MEMORY_BACKUP)})};
  }
  return {KEY,BACKUP,IMPORT,MEMORY_BACKUP,defaults,entry,decode,create};
});
