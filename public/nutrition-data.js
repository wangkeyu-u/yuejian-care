(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.MoonNutritionArticles=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const date='2026-10-28',eat={title:'NHS · The Eatwell Guide',url:'https://www.nhs.uk/live-well/eat-well/food-guidelines-and-food-labels/the-eatwell-guide/'},iron={title:'NIH ODS · Iron: Fact Sheet for Consumers',url:'https://ods.od.nih.gov/factsheets/Iron-Consumer/'},pms={title:'NHS · PMS (premenstrual syndrome)',url:'https://www.nhs.uk/conditions/pre-menstrual-syndrome/'};
  const create=(id,title,summary,body,sources,paragraphSources,sourceNotes,note)=>({id,kind:'health',category:'饮食活动',title,summary,body,tags:['饮食','三餐','营养','经期'],sources,paragraphSources,verification:{checkedAt:date,basis:'mixed',note,sourceNotes:sources.map((s,i)=>({url:s.url,supports:sourceNotes[i]}))}});
  return [
    create('nutrition-meal-pattern','今天吃什么：把三餐搭配落到餐桌上','用主食、蛋白质食物和蔬果组成可替换的一餐，不按周期日号规定菜单。',[
      'NHS 均衡饮食指南建议从不同食物组选择食物，包括淀粉类主食、豆类/鱼/蛋/肉等蛋白质食物、蔬果、奶类或替代品；平衡可放在一天甚至一周内实现，不要求每顿精确配比。',
      '一个可操作的搭配示例是：早餐选燕麦、原味酸奶和水果；午餐选米饭、豆类或瘦肉及蔬菜；晚餐选面食、鸡蛋或豆类及蔬菜。菜式由本站按食物组整理，是普通餐食选项，不是原文处方、专门止痛餐或必须照吃的任务。',
      '做饭或下单前先问她想吃什么、有哪些过敏食材/饮食限制/医嘱，再决定菜式与份量。若这些信息未知，先确认再准备；特殊膳食需要由营养师或医生帮助调整。'
    ],[eat],[[0],[],[0]],['支持食物组、多样化、整体平衡以及特殊饮食需求咨询专业人员；不支持这些具体菜式能治疗痛经。'],'第一段与第三段的特殊膳食部分来自指南；菜式、提问和安排为本站编辑示例，不是治疗或对个人需要量的判断。'),
    create('nutrition-iron-foods','想补充含铁食物，具体怎么选？','选可接受的食物组合；经量多值得评估，不靠一顿饭判断或纠正贫血。',[
      'NIH ODS 列出的铁食物来源包括瘦肉、禽肉、海鲜、强化谷物、豆类和部分绿叶菜；含维生素 C 的蔬果有助于植物性铁吸收。经量多的人属于更可能摄入不足或缺铁的人群之一，但不能据此判断她已贫血。',
      '准备午餐时，可与她商量瘦肉配蔬菜，或豆类配番茄/甜椒等组合，再搭配主食；这是将食物来源转成一餐的编辑示例。按本人过敏、素食习惯、医嘱和食量替换，不强迫她吃某种“补血”食物。',
      '铁补充剂可能有副作用和药物相互作用，不因月经来潮自行推荐补铁剂或剂量。食物建议不替代对经量多、持续乏力等情况的医疗评估。'
    ],[iron],[[0],[],[0]],['支持含铁食物、维生素C与植物铁吸收、经量多的风险提示、补充剂风险；不支持单餐治疗贫血。'],'食物组合与沟通步骤为本站编辑；其余概述对应 NIH 公开资料，未提供个人补充剂方案。'),
    create('nutrition-pms-appetite','经前食欲变化时，怎样安排下一餐？','保留均衡饮食；若大餐不舒服，可以尝试少量分餐。',[
      'NHS 的 PMS 资料建议均衡饮食，并指出一些人可能觉得较少量、较频繁的进餐更合适；个人症状会变化，不代表每个人必须分餐。',
      '如果她明确说大份吃不下，可先商量把下一餐分成两次，保留主食、蛋白质和蔬果的选择，把剩余部分妥善保存。她没有食欲问题时继续平时合适的餐食，不因日期强制改餐。',
      '膳食补充剂用于 PMS 的证据有限，正在用药时应先问医生或药师。经前症状影响日常生活，应咨询专业人员，不能仅用饮食安排代替评估。'
    ],[pms],[[0],[],[0]],['支持少量分餐作为可尝试选项、症状影响生活时就诊、补充剂证据有限及用药咨询；不支持保证有效。'],'分餐的沟通、保存和安排为编辑建议；是否适合取决于本人实际感受。')
  ];
});
