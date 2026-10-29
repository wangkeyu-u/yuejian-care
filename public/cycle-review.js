(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./core.js'),require('./periods.js'),require('./forecast.js'));else root.MoonCycleReview=factory(root.MoonCore,root.MoonPeriods,root.MoonForecast);})(typeof globalThis!=='undefined'?globalThis:this,function(C,P,F){
 'use strict';
 const median=values=>{if(!values.length)return null;const a=values.slice().sort((x,y)=>x-y),mid=Math.floor(a.length/2);return a.length%2?a[mid]:(a[mid-1]+a[mid])/2;};
 const extent=values=>values.length?{min:Math.min(...values),max:Math.max(...values)}:null;
 function summarize(profile,today=C.todayISO()){
  const periods=P.migratePeriods(profile,today),recent=periods.slice(-7),forecast=F.estimate({...profile,periods},today);
  const rows=recent.map((p,i)=>({id:p.id,start:p.start,end:p.end,status:p.status,bleedingDays:p.status==='ended'?P.actualDuration(p,today):null,ongoingDays:p.status==='ongoing'?P.actualDuration(p,today):null,interval:recent[i+1]?C.diffDays(recent[i+1].start,p.start):null}));
  const intervals=rows.map(x=>x.interval).filter(x=>x!==null),durations=rows.map(x=>x.bleedingDays).filter(x=>x!==null);
  let countdown='';if(forecast.forecastBlocked)countdown='先核对上次出血状态';else if(forecast.nextStart){const days=C.diffDays(forecast.nextStart,today);countdown=days>0?'还有 '+days+' 天 · 参考':days===0?'参考日已到 · 实际待记录':'距参考日已过 '+(-days)+' 天 · 实际待记录';}
  return {total:periods.length,rows,intervals,intervalRange:extent(intervals),medianInterval:median(intervals),durationRange:extent(durations),confirmedDurations:durations.length,countdown,usesPersonalHistory:forecast.method==='history',historyUsable:intervals.every(n=>n>=15&&n<=90)};
 }
 return {summarize};
});
