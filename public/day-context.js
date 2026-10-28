(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./core.js'),require('./periods.js'),require('./forecast.js'),require('./advice.js'),require('./vendor/lunar.js'),require('./memory.js'));else root.MoonDayContext=factory(root.MoonCore,root.MoonPeriods,root.MoonForecast,root.MoonAdvice,{Solar:root.Solar},root.MoonMemory);})(typeof globalThis!=='undefined'?globalThis:this,function(Core,Periods,Forecast,Advice,Lunar,Memory){
  'use strict';
  const VERSION='day-context-4.1.0-memory-sources-20261026';
  const PSYCH=['health-sleep','health-pms','health-pmdd','health-anxiety-cycle'];
  const text=(v,n)=>typeof v==='string'?v.trim().slice(0,n):'';
  const one=(v,a,d='')=>a.includes(v)?v:d;
  const topics=['tcm','herbal','acupuncture','moxibustion','movement','products'];
  function makeInput(profile,date,model=profile.model){const e=profile.entries?.[date]||{},p=profile.partner?.consent?profile.partner:{};return {date,model:model||'gpt-4.1-mini',memory:Memory.projected(profile.memory,date,Core.todayISO()),profile:{periods:profile.periods.slice(-24),cycleLength:profile.cycleLength,periodLength:profile.periodLength},observation:{...e,topics:[...new Set([...(profile.focus||[]),...(e.topics||[])])],support:e.support||p.support||'ask'},preferences:{likes:p.likes||'',avoid:p.avoid||'',tone:profile.tone||'gentle'},culture:{enabled:profile.culture===true,birthday:profile.birthConfirmed?profile.birthday:'',birthTime:profile.birthTime||''}};}
  function normalize(input,today=Core.todayISO()){
    if(!input||!Core.isISODate(input.date))throw Error('请选择有效日期');
    const p=input.profile;if(!p||!Array.isArray(p.periods)||p.periods.length>24)throw Error('经期格式或数量无效');
    const periods=Periods.validatePeriods(p.periods,today),cycleLength=Number(p.cycleLength),periodLength=Number(p.periodLength);
    if(!Number.isInteger(cycleLength)||cycleLength<15||cycleLength>90||!Number.isInteger(periodLength)||periodLength<1||periodLength>14)throw Error('参考周期无效');
    if(!/^gpt-[a-zA-Z0-9._-]{1,70}$/.test(input.model))throw Error('模型 ID 无效');
    const o=input.observation||{},future=input.date>today,c=input.culture||{},preferences=input.preferences||{};
    return {version:VERSION,date:input.date,today,model:input.model,memory:Memory.normalizeInput(input.memory,input.date,today),profile:{periods,cycleLength,periodLength},observation:{mood:future?'':one(o.mood,['平静','紧绷','很难受']),pain:!future&&[0,2,5,8,10].includes(o.pain)?o.pain:null,energy:future?'':one(o.energy,['low','medium','high']),sleep:future?'':one(o.sleep,['poor','okay']),flow:future?'':one(o.flow,['usual','heavy','unexpected']),note:future?'':text(o.note,500),support:one(o.support,['ask','alone','quiet','help','独处','安静陪伴','具体帮助'],'ask'),topics:Array.isArray(o.topics)?[...new Set(o.topics.filter(x=>topics.includes(x)))]:[]},preferences:{likes:text(preferences.likes,240),avoid:text(preferences.avoid,240),tone:one(preferences.tone,['brief','gentle','detailed'],'gentle')},culture:{enabled:c.enabled===true,birthday:c.enabled&&Core.isISODate(c.birthday)&&c.birthday<=today?c.birthday:'',birthTime:c.enabled&&/^([01]\d|2[0-3]):[0-5]\d$/.test(c.birthTime)?c.birthTime:''}};
  }
  function signature(input,today){return JSON.stringify(normalize(input,today));}
  function cultureOf(input){
    if(!input.culture.enabled)return {enabled:false,note:'用户关闭了个性化文化分析；保留此分区并说明未开启。'};
    const elements={甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水'},g={木:'火',火:'土',土:'金',金:'水',水:'木'},r={木:'土',土:'水',水:'火',火:'金',金:'木'};
    const day=Lunar.Solar.fromYmd(...input.date.split('-').map(Number)).getLunar(),d=elements[day.getDayGan()];
    const result={enabled:true,dayPillar:day.getDayInGanZhi(),dayElement:d,lunar:day.getMonthInChinese()+'月'+day.getDayInChinese(),boundary:'出生年按立春年界；只解释传统符号，不据此推断健康、情绪或活动禁忌。',birthTimeKnown:!!input.culture.birthTime};
    if(input.culture.birthday){const birth=Lunar.Solar.fromYmd(...input.culture.birthday.split('-').map(Number)).getLunar(),pillar=birth.getYearInGanZhiByLiChun(),b=elements[pillar[0]];Object.assign(result,{birthYearPillar:pillar,zodiac:birth.getYearShengXiaoByLiChun(),yearElement:b,symbolRelation:b===d?'同属'+b:g[b]===d?b+'生'+d:g[d]===b?d+'生'+b:r[b]===d?b+'克'+d:d+'克'+b});}
    result.chartLimit='本应用不排完整八字，不判断体质、喜用神或吉凶；出生时间未知时也不补猜。';return result;
  }
  function build(input,catalog,today=Core.todayISO(),question='',focusArticleId=''){
    const clean=normalize(input,today),forecast=Forecast.estimate({...clean.profile,periods:clean.profile.periods.filter(p=>p.start<=clean.date)},today),info=Core.getCycle({...clean.profile,cycleLength:forecast.cycleLength},clean.date,today);
    const plan=Advice.buildPlan({date:clean.date,today,info,...clean.observation,partner:{...clean.preferences,support:clean.observation.support,consent:true},culture:false});
    const ids=new Set([...plan.selectedArticleIds,'health-cycle-day-one','health-help-now','health-urgent-pain',...PSYCH,'tcm-pain-language','tcm-visit-preparation']);
    if(clean.culture.enabled)for(const id of ['culture-stem-branch','culture-ten-stems-elements','culture-day-stem-not-bazi','culture-unknown-birth-hour','culture-generating-overcoming-cycles','culture-zodiac-no-taboo'])ids.add(id);
    const queries=[['针灸',['tcm-acupuncture-evidence','tcm-acupuncture-safety']],['艾灸',['tcm-moxibustion-risk']],['中药|药膳|调经茶',['tcm-herbal-safety','tcm-food-herb-interactions','health-medication']],['用品|棉条|月经杯|清洗',['health-products','health-tampon-cup','health-vulva-cleaning']],['运动|游泳',['health-movement-swim']]];
    for(const [pattern,list]of queries)if(new RegExp(pattern).test(question))for(const id of list)ids.add(id);
    if(catalog.some(a=>a.id===focusArticleId))ids.add(focusArticleId);
    const articles=catalog.filter(a=>ids.has(a.id)&&(clean.culture.enabled||!a.id.startsWith('culture-'))).map(a=>({id:a.id,subject:a.id.startsWith('tcm-')?'tcm':a.id.startsWith('culture-')?'culture':PSYCH.includes(a.id)?'psychology':'western',title:a.title,body:a.body,sources:a.sources,verification:a.verification}));
    return {signature:JSON.stringify(clean),longTermMemory:clean.memory,date:clean.date,today,model:clean.model,future:clean.date>today,forecast,info,observation:clean.observation,preferences:clean.preferences,culture:cultureOf(clean),medicalPriority:plan.priorities.filter(a=>a.urgency==='medical'),phaseLabel:plan.phaseLabel,articles};
  }
  return {VERSION,PSYCH,Memory,makeInput,normalize,signature,build};
});
