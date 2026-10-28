(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./core.js'),require('./forecast.js'),require('./memory.js'));else root.MoonPhases=factory(root.MoonCore,root.MoonForecast,root.MoonMemory);})(typeof globalThis!=='undefined'?globalThis:this,function(C,F,M){
 'use strict';
 const labels={menstrual:'月经期',follicular:'经后卵泡期',ovulation:'排卵参考日',luteal:'黄体期',unknown:'阶段待确认'};
 const kinds={bleeding_start:'月经开始报告',bleeding_end:'月经结束报告',lh_positive:'LH 试纸阳性报告',temperature:'基础体温记录',mucus:'分泌物观察',symptom:'本人症状报告',behavior:'行为 / 支持需求记录'};
 const safe=(d,n)=>{try{return C.addDays(d,n);}catch{return null;}};
 const cleanText=(v,n)=>typeof v==='string'?v.trim().slice(0,n):'';
 const secret=v=>/(sk-(?:proj-)?[A-Za-z0-9_-]{16,}|Bearer\s+[A-Za-z0-9_-]{16,}|(?:密钥|密码|api[_ -]?key)\s*[:：=]\s*\S{8,})/i.test(v);
 function signals(raw=[]){if(!Array.isArray(raw)||raw.length>10)throw Error('每天最多保存10条阶段线索');return raw.map(x=>{if(!x||!Object.hasOwn(kinds,x.kind)||typeof x.id!=='string'||!x.id||!cleanText(x.quote,500)||secret(x.quote)||secret(x.value))throw Error('阶段线索格式无效');return {id:x.id.slice(0,100),kind:x.kind,value:cleanText(x.value,120),quote:cleanText(x.quote,500),source:x.source==='chat'?'chat':'manual',sourceDate:C.isISODate(x.sourceDate)?x.sourceDate:null};});}
 function hint(raw,date){if(!raw)return null;if(!['follicular','ovulation','luteal','unknown'].includes(raw.phase)||!C.isISODate(raw.until)||raw.until<date||C.diffDays(raw.until,date)>31||!cleanText(raw.reason,240)||secret(raw.reason))throw Error('阶段标注需填写原因，范围最多32个公历日');return {phase:raw.phase,until:raw.until,reason:cleanText(raw.reason,240)};}
 function unknown(reason){return {key:'unknown',label:labels.unknown,status:'unknown',start:null,end:null,day:null,remaining:null,windows:[],basis:reason,uncertainty:'聊天、情绪和一般行为不能确认排卵或黄体期。',ovulationWindow:null,sourceDates:[]};}
 function assess(profile,date,today=C.todayISO()){
  if(!C.isISODate(date)||!C.isISODate(today))throw Error('阶段日期无效');const f=F.estimate(profile,today),info=C.getCycle({...profile,cycleLength:f.cycleLength},date,today),periods=profile.periods||[],anchor=periods.find(p=>p.id===info.periodId);
  const entries=Object.fromEntries(Object.entries(profile.entries||{}).filter(([d,e])=>!M.blockedSource(profile.memory,d,'note',e)));
  const actual=['confirmed','ongoing'].includes(info.bleedingState)&&date<=today;
  const actualState=actual?{...unknown('依据已保存的实际出血起止记录。'),key:'menstrual',label:labels.menstrual,status:'recorded',start:anchor.start,end:anchor.end,day:C.diffDays(date,anchor.start)+1,remaining:anchor.end?C.diffDays(anchor.end,date)+1:null,sourceDates:[anchor.start]}:null;
  const actualAnchor=periods.filter(p=>p.start<=date).at(-1)?.start;
  const annotation=Object.entries(entries).filter(([d,e])=>d<=date&&d<=today&&e.phaseHint&&e.phaseHint.until>=date&&(!actualAnchor||d>=actualAnchor)).sort(([a],[b])=>b.localeCompare(a))[0];
  if(annotation&&!actual){const [d,e]=annotation,h=hint(e.phaseHint,d);return {...unknown('用户标注：'+h.reason),key:h.phase,label:labels[h.phase],status:'annotated',start:d,end:h.until,day:C.diffDays(date,d)+1,remaining:C.diffDays(h.until,date)+1,sourceDates:[d],uncertainty:'这是用户核对后的阶段标注，不是医学确认；实际出血记录优先。'};}
  if(profile.phaseTracking==='paused')return actualState||unknown('四阶段估算已暂停，仍可记录实际月经和当天情况。');
  if(!info.cycleStart)return actualState||unknown('先记录最近一次实际月经开始日，才有估算起点。');
  if(f.forecastBlocked||f.overdue&&date>=f.nextStart)return actualState||unknown('下次参考日已到或已过，尚无新开始记录；不自动滚动出新的阶段。');
  if(periods.at(-1)?.status==='ongoing'&&date>today)return actualState||unknown('本次出血尚未结束，后续阶段待确认。');
  const nextActual=periods.find(p=>p.start>info.cycleStart),next=nextActual?.start||info.nextStart;
  if(!next)return actualState||unknown('缺少下一次参考日期，无法分段。');const length=C.diffDays(next,info.cycleStart);
  if(length<21||length>35)return actualState||unknown('本轮参考间隔不适合使用本应用的简化分期，请保留实际记录或手动标注。');
  let ovulation=safe(next,-14);const windowStart=safe(next,-16),windowEnd=safe(next,-10);if(!ovulation||!windowStart||!windowEnd)return actualState||unknown('日期超出可计算范围。');
  const lh=Object.entries(entries).filter(([d,e])=>d>=info.cycleStart&&d<next&&d<=today&&e.signals?.some(x=>x.kind==='lh_positive')).sort(([a],[b])=>b.localeCompare(a))[0];
  if(lh){const point=safe(lh[0],1);if(!point||point<windowStart||point>windowEnd)return actualState||unknown('LH 线索与本轮日历估算不一致；暂不强行分期，请核对日期或标注判断。');ovulation=point;}
  const menstrualEnd=anchor?.end||safe(info.cycleStart,(profile.periodLength||5)-1);
  if(!menstrualEnd||menstrualEnd>=ovulation)return actualState||unknown('实际出血范围与简化分期边界重叠，先核对出血记录。');
  const windows=[{key:'menstrual',start:info.cycleStart,end:menstrualEnd},{key:'follicular',start:safe(menstrualEnd,1),end:safe(ovulation,-1)},{key:'ovulation',start:ovulation,end:ovulation},{key:'luteal',start:safe(ovulation,1),end:safe(next,-1)}].filter(x=>x.start&&x.end&&x.start<=x.end);
  const current=windows.find(x=>date>=x.start&&date<=x.end);if(!current)return actualState||unknown('所选日期没有足够记录可分期。');
  const result={...unknown(''),...current,label:labels[current.key],status:'estimated',day:C.diffDays(date,current.start)+1,remaining:C.diffDays(current.end,date)+1,windows,ovulationWindow:{start:windowStart,end:windowEnd},sourceDates:[info.cycleStart,...(lh?[lh[0]]:[])],basis:(lh?'将已核对的 LH 报告次日暂作展示锚点（工程规则），并与周期参考核对；LH 不能确认已经排卵。':'依据实际月经起点与'+(nextActual?'下一次实际开始日回看':'参考周期')+'，以距下次月经14天作为展示用排卵锚点。'),uncertainty:'展示锚点均不是个人实测；14天仅为日历默认中间参考。排卵通常距下次月经约10—16天；参考日不是排卵持续时间，也不是安全期。'};return actualState?{...result,...actualState,windows:result.windows,ovulationWindow:result.ovulationWindow}:result;
 }
 function project(profile,date,today=C.todayISO()){
  const info=C.getCycle({...profile,cycleLength:F.estimate(profile,today).cycleLength},date,today),actualAnchor=(profile.periods||[]).filter(p=>p.start<=date).at(-1)?.start,entries=Object.entries(profile.entries||{}).filter(([d,e])=>d<=date&&d<=today&&!M.blockedSource(profile.memory,d,'note',e));
  return {tracking:profile.phaseTracking==='paused'?'paused':'calendar',lhDates:entries.filter(([d,e])=>(!info.cycleStart||d>=info.cycleStart)&&e.signals?.some(x=>x.kind==='lh_positive')).map(([d])=>d).slice(-20),annotations:entries.filter(([d,e])=>(!actualAnchor||d>=actualAnchor)&&e.phaseHint&&e.phaseHint.until>=date).sort(([a],[b])=>a.localeCompare(b)).slice(-1).map(([d,e])=>({date:d,...e.phaseHint}))};
 }
 function normalizeInput(raw={},date,today){if(!Array.isArray(raw.lhDates||[])||(raw.lhDates||[]).length>20||!Array.isArray(raw.annotations||[])||(raw.annotations||[]).length>1)throw Error('阶段输入数量无效');const lhDates=[...new Set(raw.lhDates||[])];if(lhDates.some(d=>!C.isISODate(d)||d>date||d>today))throw Error('LH日期无效');const annotations=(raw.annotations||[]).map(x=>{if(!C.isISODate(x.date)||x.date>date||x.date>today)throw Error('标注日期无效');return {date:x.date,...hint(x,x.date)};});return {tracking:raw.tracking==='paused'?'paused':'calendar',lhDates,annotations};}
 function fromInput(profile,data){const entries={};for(const d of data.lhDates)entries[d]={signals:[{kind:'lh_positive'}]};for(const x of data.annotations)entries[x.date]={...(entries[x.date]||{}),phaseHint:{phase:x.phase,until:x.until,reason:x.reason}};return {...profile,entries,phaseTracking:data.tracking};}
 function evidence(raw,today=C.todayISO()){if(!Array.isArray(raw)||raw.length>20)throw Error('最多20段聊天原句');const list=raw.map(x=>{if(!x||!C.isISODate(x.date)||x.date>today||typeof x.id!=='string'||!/^[-a-zA-Z0-9:_]{1,100}$/.test(x.id)||!cleanText(x.text,1000)||x.text.length>1000||secret(x.text))throw Error('聊天来源格式无效或包含秘密，请先去除');return {id:x.id,date:x.date,text:cleanText(x.text,1000)};});if(new Set(list.map(x=>x.id)).size!==list.length)throw Error('来源ID重复');return list;}
 function supports(kind,quote){
  if(kind==='bleeding_start')return /月经|姨妈|例假|生理期/.test(quote)&&/来[了啦]|开始|第一天|第1天/.test(quote)&&!/(没来|还没|未开始|没开始|预计|可能|快来|要来|如果|是不是|吗|？|\?)/.test(quote);
  if(kind==='bleeding_end')return /结束|干净|不再出血/.test(quote)&&!/(没结束|未结束|还在|还没|预计|应该|可能|如果|是不是|吗|？|\?)/.test(quote);
  if(kind==='lh_positive')return /LH|排卵试纸|排卵测试/i.test(quote)&&/阳性|强阳|两条一样深/.test(quote)&&!/(阴性|不是阳性|未阳性|还没|可能|如果|是不是|吗|？|\?)/.test(quote);
  if(kind==='temperature')return /3[0-9](\.\d{1,2})?/.test(quote);return true;
 }
 function candidates(raw,sources,today=C.todayISO()){const byId=new Map(sources.map(x=>[x.id,x]));return (Array.isArray(raw)?raw:[]).slice(0,12).filter(x=>x&&Object.hasOwn(kinds,x.kind)&&C.isISODate(x.date)&&x.date<=today&&cleanText(x.quote,500).length>=4&&byId.get(x.sourceId)?.text.includes(x.quote)&&!secret(x.quote)&&!secret(x.value)&&supports(x.kind,x.quote)).map(x=>({date:x.date,kind:x.kind,value:cleanText(x.value,120),quote:cleanText(x.quote,500),sourceId:x.sourceId}));}

 return {labels,kinds,signals,hint,assess,project,normalizeInput,fromInput,evidence,candidates};
});
