(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./core.js'),require('./periods.js'),require('./forecast.js'),require('./advice.js'),require('./vendor/lunar.js'),require('./memory.js'),require('./care-output.js'),require('./phases.js'),require('./phase-knowledge.js'),require('./providers.js'),require('./allergies.js'),require('./care-rules.js'),require('./grounding.js'),require('./poetry-core.js'));else root.MoonDayContext=factory(root.MoonCore,root.MoonPeriods,root.MoonForecast,root.MoonAdvice,{Solar:root.Solar},root.MoonMemory,root.MoonCareOutput,root.MoonPhases,root.MoonPhaseKnowledge,root.MoonProviders,root.MoonAllergies,root.MoonCareRules,root.MoonGrounding,root.MoonPoetry);})(typeof globalThis!=='undefined'?globalThis:this,function(Core,Periods,Forecast,Advice,Lunar,Memory,CareOutput,Phases,PhaseKnowledge,Providers,Allergies,CareRules,Grounding,Poetry){
  'use strict';
  const VERSION='day-context-4.10.0-grounding-20261029';
  const PSYCH=['health-sleep','health-pms','health-pmdd','health-anxiety-cycle'];
  const articleSubjects=id=>id.startsWith('tcm-')?['tcm']:id.startsWith('culture-')?['culture']:PSYCH.includes(id)?['western','psychology']:['western'];
  const text=(v,n)=>typeof v==='string'?v.trim().slice(0,n):'';
  const one=(v,a,d='')=>a.includes(v)?v:d;
  const topics=['tcm','herbal','acupuncture','moxibustion','movement','products'];
  function periodWindow(periods,date){
    const sorted=periods.slice().sort((a,b)=>a.start.localeCompare(b.start));
    const before=sorted.filter(p=>p.start<=date).slice(-7),after=sorted.find(p=>p.start>date);
    const ids=new Set([...before,...(after?[after]:[]),...sorted.slice(-7)].map(x=>x.id));return sorted.filter(p=>ids.has(p.id));
  }
  function recentInput(profile,date,question,mode,focus){
    const today=Core.todayISO(),end=date<today?date:today,query=mode==='analysis'?['general']:Memory.queryTopics(question,focus),all=[];
    for(let delta=1;delta<=2;delta++){let d;try{d=Core.addDays(date,-delta);}catch{continue;}const e=profile.entries?.[d];if(!e||d>today)continue;const observation={...e};if(Memory.blockedSource(profile.memory,d,'note',e)){observation.note='';observation.signals=[];}all.push({date:d,observation});}
    const selected=all.map(x=>{const e=x.observation,broad=query.includes('general'),o={};for(const key of broad?['mood','pain','energy','sleep','flow','support']:query.includes('health')?['pain','flow','energy','sleep']:query.includes('support')?['mood','energy','support','sleep']:query.includes('sleep')?['sleep','energy','mood']:query.includes('food')?['energy']:[])if(e[key]!==''&&e[key]!=null)o[key]=e[key];
      const allowed=Phases.signals(e.signals||[]).filter(s=>broad||s.kind==='behavior'&&query.some(t=>['support','sleep'].includes(t))||s.kind==='symptom'&&query.some(t=>['health','food','sleep'].includes(t))||query.includes('health'));if(allowed.length)o.signals=allowed;
      if(e.note&&(broad||Memory.queryTopics(e.note).some(t=>query.includes(t)&&t!=='general')))o.note=e.note;
      return {date:x.date,observation:o};}).filter(x=>Object.keys(x.observation).length);
    return {recent:selected,revision:Memory.fingerprint(JSON.stringify(all))};
  }
  function makeInput(profile,date,model=profile.model,question='',mode='analysis',focus='auto'){
    const e={...(profile.entries?.[date]||{})},p=profile.partner?.consent?profile.partner:{},recent=recentInput(profile,date,question,mode,focus);
    if(Memory.blockedSource(profile.memory,date,'note',e)){e.note='';e.signals=[];e.phaseHint=null;}
    return {phaseData:Phases.project(profile,date),date,provider:Providers.normalize(profile.provider),model:model||Providers.defaultModel(profile.provider),memory:Memory.projected(profile.memory,date,Core.todayISO(),question,mode,focus),recent:recent.recent,recentRevision:recent.revision,profile:{periods:periodWindow(profile.periods,date),cycleLength:profile.cycleLength,periodLength:profile.periodLength},observation:{...e,topics:[...new Set([...(profile.focus||[]),...(e.topics||[])])],support:e.support||p.support||'ask'},preferences:{likes:p.likes||'',avoid:p.avoid||'',dietary:p.dietary||'',allergies:Allergies.normalize(p.allergies||[]),tone:profile.tone||'gentle'},culture:{enabled:profile.culture===true,birthday:profile.culture&&profile.birthConfirmed?profile.birthday:'',birthTime:profile.culture&&profile.birthConfirmed?profile.birthTime||'':''}};
  }
  function normalize(input,today=Core.todayISO()){
    if(!input||!Core.isISODate(input.date))throw Error('请选择有效日期');
    const p=input.profile;if(!p||!Array.isArray(p.periods)||p.periods.length>24)throw Error('经期格式或数量无效');
    const periods=Periods.validatePeriods(p.periods,today),cycleLength=Number(p.cycleLength),periodLength=Number(p.periodLength);
    if(!Number.isInteger(cycleLength)||cycleLength<15||cycleLength>90||!Number.isInteger(periodLength)||periodLength<1||periodLength>14)throw Error('参考周期无效');
    const provider=Providers.normalize(input.provider);if(!Providers.validModel(provider,input.model))throw Error('模型与所选AI服务不匹配');
    const o=input.observation||{},future=input.date>today,c=input.culture||{},preferences=input.preferences||{};
    const recent=(Array.isArray(input.recent)?input.recent:[]);if(recent.length>2)throw Error('近期记录超出范围');const cleanRecent=recent.map(x=>{if(!x||!Core.isISODate(x.date)||x.date>=input.date||x.date>today||Core.diffDays(input.date,x.date)>2)throw Error('近期记录日期无效');const e=x.observation||{};return {date:x.date,observation:{signals:Phases.signals(e.signals||[]),mood:one(e.mood,['平静','紧绷','很难受']),pain:[0,2,5,8,10].includes(e.pain)?e.pain:null,energy:one(e.energy,['low','medium','high']),sleep:one(e.sleep,['poor','okay']),flow:one(e.flow,['usual','heavy','unexpected']),support:one(e.support,['独处','安静陪伴','具体帮助']),note:text(e.note,500)}};});if(new Set(cleanRecent.map(x=>x.date)).size!==cleanRecent.length)throw Error('近期记录日期重复');
    return {phaseData:Phases.normalizeInput(input.phaseData,input.date,today),version:VERSION,date:input.date,today,provider,model:input.model,recent:cleanRecent,recentRevision:/^[a-f0-9]{1,8}$/.test(input.recentRevision)?input.recentRevision:'',memory:Memory.normalizeInput(input.memory,input.date,today),profile:{periods,cycleLength,periodLength},observation:{signals:future?[]:Phases.signals(o.signals||[]),mood:future?'':one(o.mood,['平静','紧绷','很难受']),pain:!future&&[0,2,5,8,10].includes(o.pain)?o.pain:null,energy:future?'':one(o.energy,['low','medium','high']),sleep:future?'':one(o.sleep,['poor','okay']),flow:future?'':one(o.flow,['usual','heavy','unexpected']),note:future?'':text(o.note,500),support:one(o.support,['ask','alone','quiet','help','独处','安静陪伴','具体帮助'],'ask'),topics:Array.isArray(o.topics)?[...new Set(o.topics.filter(x=>topics.includes(x)))]:[]},preferences:{likes:text(preferences.likes,240),avoid:text(preferences.avoid,240),dietary:text(preferences.dietary,300),allergies:Allergies.normalize(preferences.allergies||[]),tone:one(preferences.tone,['brief','gentle','detailed'],'gentle')},culture:{enabled:c.enabled===true,birthday:c.enabled&&Core.isISODate(c.birthday)&&c.birthday<=today?c.birthday:'',birthTime:c.enabled&&/^([01]\d|2[0-3]):[0-5]\d$/.test(c.birthTime)?c.birthTime:''}};
  }
  function signature(input,today){const clean=normalize(input,today),{recent,memory,...base}=clean;return 'ctx-v2:'+Memory.fingerprint(JSON.stringify({...base,memory:{enabled:memory.enabled,autoExtract:memory.autoExtract,revisionToken:memory.revisionToken||Memory.fingerprint(JSON.stringify(memory.items))}}));}
  function retrievalKey(input,today){const c=normalize(input,today);return Memory.fingerprint(JSON.stringify({items:c.memory.items,recent:c.recent}));}
  function cultureOf(input){
    if(!input.culture.enabled)return {enabled:false,note:'文化分析已关闭；保持关闭，不提出开启、询问或仪式任务。'};
    const elements={甲:'木',乙:'木',丙:'火',丁:'火',戊:'土',己:'土',庚:'金',辛:'金',壬:'水',癸:'水'},g={木:'火',火:'土',土:'金',金:'水',水:'木'},r={木:'土',土:'水',水:'火',火:'金',金:'木'};
    const day=Lunar.Solar.fromYmd(...input.date.split('-').map(Number)).getLunar(),d=elements[day.getDayGan()];
    const result={enabled:true,dayPillar:day.getDayInGanZhi(),dayElement:d,lunar:day.getMonthInChinese()+'月'+day.getDayInChinese(),boundary:'出生年按立春年界；只解释传统符号，不据此推断健康、情绪或活动禁忌。',birthTimeKnown:!!input.culture.birthTime};
    if(input.culture.birthday){const birth=Lunar.Solar.fromYmd(...input.culture.birthday.split('-').map(Number)).getLunar(),pillar=birth.getYearInGanZhiByLiChun(),b=elements[pillar[0]];Object.assign(result,{birthYearPillar:pillar,zodiac:birth.getYearShengXiaoByLiChun(),yearElement:b,symbolRelation:b===d?'同属'+b:g[b]===d?b+'生'+d:g[d]===b?d+'生'+b:r[b]===d?b+'克'+d:d+'克'+b});}
    result.chartLimit='本应用不排完整八字，不判断体质、喜用神或吉凶；出生时间未知时也不补猜。';return result;
  }
  function build(input,catalog,today=Core.todayISO(),question='',focusArticleId=''){
    const clean=normalize(input,today),forecast=Forecast.estimate({...clean.profile,periods:clean.profile.periods.filter(p=>p.start<=clean.date)},today),info=Core.getCycle({...clean.profile,cycleLength:forecast.cycleLength},clean.date,today);
    const phaseAssessment=Phases.assess(Phases.fromInput(clean.profile,clean.phaseData),clean.date,today);
    const plan=Advice.buildPlan({date:clean.date,today,info,...clean.observation,partner:{...clean.preferences,support:clean.observation.support,consent:true},culture:false});
    const ids=new Set([...plan.selectedArticleIds,'health-cycle-day-one','health-cycle-four-phases','health-phase-signals','health-help-now','health-urgent-pain',...PSYCH,'tcm-pain-language','tcm-visit-preparation','nutrition-meal-pattern','nutrition-iron-foods','nutrition-pms-appetite','nutrition-food-allergy']);
    const phaseGuide=PhaseKnowledge.get(phaseAssessment.key);if(phaseGuide)ids.add(phaseGuide.id);
    for(const [phase,pattern]of Object.entries({menstrual:'月经期|姨妈期|经期第',follicular:'卵泡|经后',ovulation:'排卵',luteal:'黄体|经前|PMS|PMDD'}))if(new RegExp(pattern,'i').test(question))ids.add('phase-care-'+phase);
    if(clean.culture.enabled)for(const id of ['culture-stem-branch','culture-ten-stems-elements','culture-day-stem-not-bazi','culture-unknown-birth-hour','culture-generating-overcoming-cycles','culture-zodiac-no-taboo'])ids.add(id);
    const queries=[['针灸',['tcm-acupuncture-evidence','tcm-acupuncture-safety']],['艾灸',['tcm-moxibustion-risk']],['中药|药膳|调经茶',['tcm-herbal-safety','tcm-food-herb-interactions','health-medication']],['用品|棉条|月经杯|清洗',['health-products','health-tampon-cup','health-vulva-cleaning']],['运动|游泳',['health-movement-swim']]];
    for(const [pattern,list]of queries)if(new RegExp(pattern).test(question))for(const id of list)ids.add(id);
    if(catalog.some(a=>a.id===focusArticleId))ids.add(focusArticleId);
    const articles=catalog.filter(a=>ids.has(a.id)&&(clean.culture.enabled||!a.id.startsWith('culture-'))).map(a=>({id:a.id,subjects:articleSubjects(a.id),subject:a.id.startsWith('tcm-')?'tcm':a.id.startsWith('culture-')?'culture':PSYCH.includes(a.id)?'psychology':'western',title:a.title,body:a.body,paragraphSources:a.paragraphSources,sources:a.sources,verification:a.verification,...(a.guideType==='phase'?{guideType:a.guideType,phase:a.phase}:{} )}));
    return {foodExclusions:{items:CareRules.exclusions({preferences:clean.preferences,longTermMemory:clean.memory}),rule:'用户填写的过敏项及可识别的过敏报告作为排除项；报告不等于医学核实，配料仍须核对。'},carePriorities:{order:['medical','allergies_and_explicit_boundaries','reported_needs','phase_reference','optional_culture'],rule:'医疗优先；过敏与明确拒绝为硬约束；当天报告高于通常偏好；可能阶段仅作讨论线索。只突出一项行动，其余按需。'},phaseKnowledge:{version:PhaseKnowledge.VERSION,selectedPhase:phaseGuide?.phase||null,guideId:phaseGuide?.id||null,sectionOrder:PhaseKnowledge.sectionOrder,readingGuideIds:articles.filter(a=>a.guideType==='phase').map(a=>a.id),rule:'按分期查资料不等于确认本人阶段；可能变化不是已报告症状。行动示例需本人愿意，饮食活动的各期通用原则不伪装成专属方案。'},phaseAssessment,signature:signature(input,today),longTermMemory:clean.memory,recent:clean.recent,recentRule:'近期记录仅是前两个公历日的历史报告。今天是否延续未知；先核对，不据此诊断或形成长期特征。',date:clean.date,today,provider:clean.provider,model:clean.model,future:clean.date>today,forecast,info,observation:clean.observation,preferences:clean.preferences,culture:cultureOf(clean),medicalPriority:plan.priorities.filter(a=>a.urgency==='medical'),phaseLabel:plan.phaseLabel,articles};
  }
  return {VERSION,Poetry,Grounding,Providers,Allergies,CareRules,PSYCH,articleSubjects,Memory,CareOutput,Phases,makeInput,normalize,signature,retrievalKey,build};
});
