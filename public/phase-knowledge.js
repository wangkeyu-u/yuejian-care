(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.MoonPhaseKnowledge=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const VERSION='phase-knowledge-1.0-20261028',checkedAt='2026-10-28';
 const sectionOrder=[['overview','认识这个阶段'],['changes','可能的变化'],['actions','今天怎么照护'],['food_movement','饮食与活动'],['seek_help','何时寻求帮助'],['limits','不能据此判断什么']];
 const typeLabels={fact:'资料事实',care:'照护原则',editorial:'行动示例',limit:'边界说明'};
 const sources={
  cycle:{title:'NHS · Periods and fertility in the menstrual cycle',url:'https://www.nhs.uk/conditions/periods/fertility-in-the-menstrual-cycle/',supports:'周期起点、排卵事件、与下次月经的间隔及其不确定性。'},
  menstruation:{title:'NICHD · About Menstruation',url:'https://www.nichd.nih.gov/health/topics/menstruation/conditioninfo',supports:'月经的定义、周期起点、出血后卵泡及内膜变化。'},
  follicular:{title:'NLM MeSH · Follicular Phase',url:'https://www.ncbi.nlm.nih.gov/mesh?Cmd=DetailsSearch&Db=mesh&Term=%22Follicular+Phase%22%5BMeSH+Terms%5D',supports:'卵泡期从月经开始至排卵，卵泡发育、雌激素与内膜增生。'},
  luteal:{title:'NLM MeSH · Luteal Phase',url:'https://www.ncbi.nlm.nih.gov/mesh?Cmd=DetailsSearch&Db=mesh&Term=%22Luteal+Phase%22%5BMeSH+Terms%5D',supports:'排卵后黄体发育及孕酮增加，至下一次月经开始的分期定义。'},
  pain:{title:'NHS · Period pain',url:'https://www.nhs.uk/symptoms/period-pain/',supports:'痛经可能表现、包裹热源及轻柔活动、严重或异常疼痛的求助条件。'},
  ovulationPain:{title:'NHS · Ovulation pain',url:'https://www.nhs.uk/symptoms/ovulation-pain/',supports:'部分人的单侧疼痛、相似病因、反复或严重疼痛及可能怀孕时的求助。'},
  pms:{title:'NHS · PMS (premenstrual syndrome)',url:'https://www.nhs.uk/conditions/pre-menstrual-syndrome/',supports:'可能的经前症状、生活照护、至少两个周期日记及影响生活时的就医建议。'},
  meals:{title:'NHS · The Eatwell Guide',url:'https://www.nhs.uk/live-well/eat-well/food-guidelines-and-food-labels/the-eatwell-guide/',supports:'食物组及一天或一周的整体饮食平衡，不是分期专属食谱。'},
  iron:{title:'NIH ODS · Iron: Fact Sheet for Consumers',url:'https://ods.od.nih.gov/factsheets/Iron-Consumer/',supports:'含铁食物、经量多的缺铁风险及补充剂风险，不是贫血诊断。'},
  activity:{title:'Office on Women’s Health · Physical activity and your menstrual cycle',url:'https://womenshealth.gov/getting-active/physical-activity-menstrual-cycle',supports:'个人精力可不同、观察运动时感受；不支持为每个阶段强制统一运动强度。'},
  signals:{title:'Office on Women’s Health · Trying to conceive',url:'https://womenshealth.gov/pregnancy/you-get-pregnant/trying-conceive',supports:'体温、分泌物及LH观察的用途和局限，不是聊天或日历确认排卵的方法。'},
  bleeding:{title:'NHS · Vaginal bleeding between periods or after sex',url:'https://www.nhs.uk/symptoms/vaginal-bleeding-between-periods-or-after-sex/',supports:'经间或性交后出血应检查；月经推迟、异常出血伴腹痛需尽快评估。'}
 };
 for(const [id,value]of Object.entries(sources))Object.assign(value,{id,checkedAt});
 const point=(id,type,text,refs=[],extra={})=>({id,type,text,refs,...extra});
 const meal=()=>point('balanced-meals','care','均衡饮食看一天或一周的整体搭配，不要求每餐精确比例。',['meals'],{shared:true});
 const movement=()=>point('self-paced-activity','editorial','按她今天的感受和意愿选择熟悉的活动；本站不按阶段强制提高运动强度。',[],{shared:true});
 const guides=[
  {phase:'menstrual',title:'月经期：先看实际出血与不适',summary:'核对起止、疼痛与需求，再安排用品、饭菜和可拒绝的帮助。',related:['health-first-day','health-heat-bath','health-heavy-flow','nutrition-iron-foods'],sections:{
   overview:[point('definition','fact','月经是子宫内膜的血液和组织排出；实际开始出血的第一天是周期第1天。',['menstruation']),point('overlap','fact','按卵巢分期，月经期处于卵泡期早段；两者有重叠。',['follicular'])],
   changes:[point('cramps','fact','部分人会有下腹痉挛，可能延至腰背或大腿；不能把这当作她已经出现的症状。',['pain']),point('energy','fact','经期精力可能降低，也有人没有降低，甚至感觉更有精神。',['activity'])],
   actions:[point('ask-one-need','editorial','准备陪伴前问一句：“需要用品、帮做一件事，还是先不打扰？”只落实她选的一项。'),point('heat-if-wanted','care','她已报告痛经且愿意时，可尝试用毛巾包裹热水袋或热敷垫；也可选择轻柔活动。',['pain'],{when:'已报告痛经且愿意尝试时'})],
   food_movement:[meal(),point('iron-food','care','含铁食物可从瘦肉、豆类、强化谷物等选择；经量多不能仅靠餐食判断贫血，也不自行加铁剂。',['iron']),movement()],
   seek_help:[point('severe-pain','care','疼痛严重或比平时更重，且已有止痛处理无效时，尽快联系医疗机构；影响日常活动也应评估。',['pain'],{when:'出现这些情况时'}),point('changed-bleeding','care','经量变多、周期变得不规律或出现经间出血，应带记录咨询医生。',['pain','bleeding'],{when:'与本人平时相比出现变化时'})],
   limits:[point('actual-not-guessed','limit','平均天数、预计结束日和阶段标签都不能替代实际起止记录；没填写的感受保持未知。'),point('no-fixed-menu','limit','本站不因来月经规定必须吃热食、补品或限制所有运动；先核对她的实际情况与既有医嘱。')]
  }},
  {phase:'follicular',title:'经后卵泡期：核对恢复情况，保留弹性',summary:'经后是阅读区间；不要据日期保证她精力充足或必须增加活动。',related:['health-cycle-four-phases','health-movement-swim','health-abnormal-bleeding','nutrition-meal-pattern'],sections:{
   overview:[point('follicle-growth','fact','卵泡期从月经开始到排卵，涉及卵泡发育、雌激素增加和子宫内膜增生。',['follicular']),point('display-split','limit','界面把出血结束至排卵参考前单列为“经后卵泡期”，只是方便查看，不是卵泡期真正起点。')],
   changes:[point('energy-varies','care','个人精力会变化；可连续记录活动时的感受，而不只看日历。',['activity']),point('not-automatic-recovery','limit','出血结束不表示疼痛、疲劳或焦虑已经消失；今天有没有这些情况需要本人表达。')],
   actions:[point('confirm-ended','editorial','先核对这次是否真的结束；知道实际结束日后，在设置修改，不把参考天数当作结束证明。'),point('offer-flexible-plan','editorial','安排活动前问：“今天按原计划、减一点，还是换一天？”把一项可调整的事务留给她选择。')],
   food_movement:[meal(),movement(),point('choose-meal','editorial','下单前确认过敏与喜恶，让她从熟悉的两种搭配中选；没有本站规定的“卵泡期必吃食物”。')],
   seek_help:[point('between-bleeding','care','经间或性交后出血应让医生检查原因，不自动归为正常周期变化。',['bleeding'],{when:'发现非预期出血时'}),point('pain-affects-life','care','经后仍有明显疼痛，尤其已影响日常活动时，应咨询医生。',['pain'],{when:'疼痛持续或影响生活时'})],
   limits:[point('ovulation-not-date','limit','经后日期不能确认排卵，也不能提供避孕保护；应用分期仍是参考。',['signals']),point('not-personality','limit','不能据“经后”认定她一定开朗、愿意见面、能承受更多任务；继续先问本人。')]
  }},
  {phase:'ovulation',title:'排卵阶段：记录线索，不把疼痛当证明',summary:'区分参考日期、本人观察与检测报告；严重不适先求助。',related:['health-phase-signals','health-urgent-pain','health-abnormal-bleeding','nutrition-meal-pattern'],sections:{
   overview:[point('egg-release','fact','排卵是卵巢释放卵子的事件；很难靠日历精确定位，通常距下一次月经约10—16天。',['cycle']),point('reference-anchor','limit','日历中的排卵参考日是显示锚点，不是检测结果，也不是排卵持续时间。')],
   changes:[point('possible-signals','fact','临近排卵时分泌物可能更清亮、湿滑、可拉伸；这些观察并非人人一致。',['signals']),point('one-sided-pain','fact','部分人会有短暂单侧下腹痛；其他疾病也可能造成相似疼痛，不能单靠疼痛确认排卵。',['ovulationPain'])],
   actions:[point('record-consented-signal','editorial','她愿意分享时，记录发生日期和原话；有检测结果就记录结果，日期不清楚先问，不代她安排私密检查。'),point('ask-pain-details','editorial','她说疼痛时，先问何时开始、是否反复、影响了哪些活动，再按求助条件处理，不先贴“正常排卵痛”标签。')],
   food_movement:[meal(),movement(),point('normal-options','editorial','按平常的饮食限制和口味准备一餐；本站不设置“排卵期专属食谱”或必做活动。')],
   seek_help:[point('recurring-or-severe','care','腹痛反复或止痛处理后仍不缓解，应就医；疼痛严重、反复或可能怀孕时，尽快寻求医疗帮助。',['ovulationPain'],{when:'出现这些情况时'}),point('missed-period-pain','care','月经推迟后出现异常出血并伴腹痛，需要尽快评估，不等待日历自行恢复。',['bleeding'],{when:'推迟、异常出血和腹痛同时出现时'})],
   limits:[point('lh-not-confirmation','limit','LH试纸、单次体温、分泌物和聊天都不能在本应用中变成“已排卵”的确认；检测与观察各有局限。',['signals']),point('no-safe-days','limit','本站不提供安全期判断，也不根据分期安排或要求性生活。')]
  }},
  {phase:'luteal',title:'黄体期：观察规律，不替她解释情绪',summary:'黄体期不是PMS诊断；有实际不适时，再落实支持、饮食与就医安排。',related:['health-pms','health-pmdd','health-anxiety-cycle','health-sleep','nutrition-pms-appetite'],sections:{
   overview:[point('after-ovulation','fact','黄体期位于排卵后至下一次月经开始，涉及黄体发育与孕酮增加。',['luteal']),point('pms-is-not-phase','limit','黄体期是分期，PMS是可能出现的经前症状模式；本站不会把整段黄体期自动标成PMS。')],
   changes:[point('possible-pms','fact','一些人经前会有腹胀、乳房胀痛、头痛、疲劳、睡眠、食欲或情绪变化；症状因人、因月份而异。',['pms']),point('no-emotion-inference','limit','阶段标签不能说明某次焦虑、生气或回复慢的原因，也不能说明她现在想独处。')],
   actions:[point('track-two-cycles','care','怀疑经前症状时，记录症状、日期及对生活的影响，至少连续两个周期，带给医生讨论。',['pms'],{when:'本人报告反复经前不适时'}),point('offer-one-task','editorial','今晚先问“我可以准备晚饭，还是帮你取消一项不想做的安排？”接受拒绝，不要求解释或及时回复。')],
   food_movement:[meal(),point('small-meals-if-useful','care','均衡饮食、规律活动和睡眠可作为PMS生活照护；若本人觉得大餐不舒服，可尝试少量分餐，不强制改变。',['pms'],{when:'本人有相应不适且愿意尝试时'}),point('confirm-menu','editorial','她没报告食欲问题时，继续平时合适的餐食；分餐、菜式和活动安排都由她决定。')],
   seek_help:[point('life-impact','care','症状影响工作、学习或日常生活，或生活调整没有帮助时，应咨询医生。',['pms'],{when:'实际影响生活时'}),point('urgent-safety','care','若出现自杀念头或不能保证自身安全，应立即寻求当地急救或急诊帮助，不等下一次月经。',['pms'],{when:'出现紧急安全风险时'})],
   limits:[point('diary-not-diagnosis','limit','记录两个周期是帮助观察，不自动确诊PMS或PMDD；也不能替代已有焦虑等问题的专业评估。'),point('supplement-limits','care','补充剂及补充疗法用于PMS的证据有限；正在用药时，开始定期补充前应问医生或药师。',['pms'])]
  }}
 ];
 function makeArticle(g){
  const sections=sectionOrder.map(([id,title])=>({id,title,items:g.sections[id]}));
  const refs=[...new Set(sections.flatMap(s=>s.items.flatMap(p=>p.refs)))],articleSources=refs.map(id=>({...sources[id]}));
  const points=sections.flatMap(s=>s.items.map(p=>({...p,sectionId:s.id,sectionTitle:s.title})));
  return {id:'phase-care-'+g.phase,phase:g.phase,phaseKeys:[g.phase],guideType:'phase',category:'周期常识',title:g.title,summary:g.summary,sections,relatedArticleIds:g.related,body:points.map(p=>p.sectionTitle+' · '+typeLabels[p.type]+(p.shared?'（各期通用）':'')+(p.when?' · '+p.when:'')+'：'+p.text),paragraphSources:points.map(p=>p.refs.map(id=>refs.indexOf(id))),tags:['分期照护',g.phase,{menstrual:'月经期',follicular:'卵泡期 经后',ovulation:'排卵期',luteal:'黄体期 PMS'}[g.phase]],sources:articleSources,verification:{checkedAt,basis:'mixed',note:'按统一六栏整理。资料事实与照护原则逐项列出来源；行动示例、界面分段及边界为本站编辑，不是个体诊断或固定方案。常见变化不等于本人症状。',sourceNotes:articleSources.map(s=>({url:s.url,supports:s.supports}))}};
 }
 const articles=guides.map(makeArticle);
 const copy=x=>JSON.parse(JSON.stringify(x));
 return {VERSION,checkedAt,sectionOrder:copy(sectionOrder),typeLabels:copy(typeLabels),sources:copy(sources),articles:copy(articles),get:phase=>copy(articles.find(a=>a.phase===phase)||null)};
});
