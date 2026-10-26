(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./core.js'),require('./periods.js'));else root.MoonForecast=factory(root.MoonCore,root.MoonPeriods);})(typeof globalThis!=='undefined'?globalThis:this,function(Core,Periods){
  'use strict';
  const median=values=>{const sorted=values.slice().sort((a,b)=>a-b);return sorted.length%2?sorted[(sorted.length-1)/2]:(sorted[sorted.length/2-1]+sorted[sorted.length/2])/2;};
  function safeDate(start,days){try{return Core.addDays(start,days);}catch{return null;}}
  function estimate(profile={},today=Core.todayISO()){
    if(!Core.isISODate(today))throw new RangeError('Invalid today');
    const periods=Periods.migratePeriods(profile,today);
    const manual=Number.isInteger(profile.cycleLength)&&profile.cycleLength>=15&&profile.cycleLength<=90?profile.cycleLength:28;
    const signature=JSON.stringify({today,manual,periodLength:profile.periodLength||5,periods});
    const intervals=periods.slice(-7).slice(1).map((p,i)=>Core.diffDays(p.start,periods.slice(-7)[i].start));
    const result={nextStart:null,rangeStart:null,rangeEnd:null,cycleLength:manual,method:'none',sampleCount:intervals.length,intervals,lastStart:periods.at(-1)?.start||null,overdue:false,forecastBlocked:false,notes:[],signature};
    if(!periods.length){result.notes.push('尚无实际开始日，不能计算下次日期。');return result;}
    const valid=intervals.every(n=>n>=15&&n<=90);
    const history=intervals.length>=2&&valid;
    result.method=history?'history':'manual';result.cycleLength=history?Math.round(median(intervals)):manual;
    if(history){result.notes.push(`使用最近 ${intervals.length} 个完整开始日间隔的中位数，四舍五入为 ${result.cycleLength} 天。`);if(Math.max(...intervals)-Math.min(...intervals)>10)result.notes.push('已记录间隔波动较大，可能与实际变化或漏记有关，参考范围较宽。');}
    else result.notes.push(valid?'少于3次实际开始记录，先按手动参考周期估算。':'存在少于15天或超过90天的相邻间隔，可能有录入、漏记或实际变化；本次不自动拟合，保留全部记录并使用手动参考周期。');
    const last=periods.at(-1);
    if(last.status==='ongoing'&&Core.diffDays(today,last.start)>=result.cycleLength){result.forecastBlocked=true;result.notes.push('最近一次仍标记为尚未结束，且已到参考下次开始日；请先确认实际出血状态，暂不推算新一轮。');return result;}
    result.nextStart=safeDate(last.start,result.cycleLength);
    const low=history?Math.max(1,Math.min(...intervals)-2):Math.max(1,manual-3),high=history?Math.max(...intervals)+2:manual+3;
    result.rangeStart=safeDate(last.start,low);result.rangeEnd=safeDate(last.start,high);
    result.overdue=!!result.nextStart&&today>=result.nextStart;
    result.notes.push(history?'参考窗口采用已观察间隔的最小值减2天至最大值加2天；这是工程余量，不是置信区间。':'参考窗口采用手动周期加减3天；这是工程提示，不是医学概率或保证。');
    if(result.overdue)result.notes.push('参考日期已到或已过，尚未记录下一次实际开始；不会自动滚动成一条新经期。');
    if(!result.nextStart||!result.rangeStart||!result.rangeEnd)result.notes.push('部分计算超出1900—2100年的支持范围，未显示越界日期。');
    result.notes.push('预测不判断排卵、怀孕或安全期，也不能诊断周期变化原因。');
    return result;
  }
  function alignedProfile(profile,today){const forecast=estimate(profile,today);return {...profile,cycleLength:forecast.cycleLength};}
  return {estimate,alignedProfile};
});
