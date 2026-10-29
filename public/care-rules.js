(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./allergies.js'),require('./care-output.js'));else root.MoonCareRules=factory(root.MoonAllergies,root.MoonCareOutput);})(typeof globalThis!=='undefined'?globalThis:this,function(A,Care){
 'use strict';
 function exclusions(context){return A.normalize([...new Set([...(context.preferences?.allergies||[]),...A.reported(context.preferences?.dietary||''),...(context.longTermMemory?.items||[]).filter(x=>x.category==='allergy_report').flatMap(x=>A.reported(x.content))])]);}
 // Explanations may name an exclusion, but an actual menu or replacement may
 // not. The text check is deliberately conservative; it is not label checking.
 function assertText(text,list){for(const clause of String(text||'').split(/[，。！？；,;!?\n]/)){if(!A.findRisk(clause,list).length)continue;const clean=clause.replace(/不推荐|不建议|不可以/g,'禁止');if(/但.{0,10}(可以|能|吃|喝|用)|推荐|建议吃|可以吃|可以喝|可以用|也能吃|少量吃|试吃|尝试吃|过敏.*(?:所以|因此).*(?:煮|吃|喝)/.test(clean)||!/(不吃|不能吃|不要吃|不推荐|不使用|不用|不放|不含|避免|避开|排除|禁用|过敏|忌口|核对|检查|确认配料|确认无|看包装标签|查看配料表|查看标签|无蛋|无奶)/.test(clause))throw Error('建议含已排除的过敏食材，结果未保存。');}}
 function alone(context){return ['alone','独处'].includes(context.observation?.support)||/不需要回复|不想被打扰|不要打扰/.test(context.observation?.note||'');}
 function contacts(actions){return actions.filter(a=>a&&typeof a==='object'&&!/医生|药师|医师|营养师|店员|商家|只在她说起时|她主动/.test(a.how)&&/问她|询问她|问一句|可问今天|发一句|发一条|发消息|发送消息|给她发|联系她|询问是否|发[“「"]/.test(a.how+' '+a.task));}
 const delivery=/放(?:在)?门口|送饭|送餐|登门|上门/;
 const deliveryRisk=text=>delivery.test(String(text||'').replace(/(?:不|别|不要)(?:再|主动|安排|擅自|先行)?(?:放(?:在)?门口|送饭|送餐|登门|上门)|避免(?:送饭|送餐|登门|上门)/g,''));
 const relationship=/这(?:并)?不是拒绝你|不是不爱你|说明她仍然爱你|肯定还爱你/;
 function respectBoundaries(result,context){const notes=[];
  for(const section of result.sections)if(relationship.test(section.body)){section.body=section.body.split(/[。！？]/).map(x=>relationship.test(x)?'独处需求本身不能用来判断她对关系的态度':x).filter(Boolean).join('。')+'。';notes.push('关系态度未知，已移除未经证实的解释。');}
  const delegated=/她(?:明确)?(?:让我|请我|希望我|说请).{0,16}(送饭|送餐|放门口|做饭)/.test(context.observation?.note||'');
  if(alone(context)&&!delegated){let changed=false;const replacement=()=>({when:'准备饮食帮助前',task:'先列一餐备选，不擅自送达',how:'核对食材和调料标签，排除已记录的过敏项，把可核对的一餐记在自己的清单里，先不下单或送达。',adjust:'等她主动提出需要，再按明确委托准备；没有委托就不执行。'});
   for(const block of [...result.sections,result.food].filter(Boolean)){let blockChanged=false;block.actions=block.actions.map(a=>{if(deliveryRisk(a.task+' '+a.how)){changed=true;blockChanged=true;return block.kind==='psychology'?{when:'她已表达想独处时',task:'暂停新增邀约和连续追问',how:'有邀约就先暂缓，不催回复、不安排登门；把需要你自己处理的事留在自己的待办里。',adjust:'她主动提出具体需要时，再按她说的方式回应。'}:replacement();}return a;});if(block===result.food&&blockChanged&&context.preferences?.tone==='brief')block.actions=[replacement()];}
   if(deliveryRisk(result.summary)){changed=true;result.summary='今天先按她表达的需要留出独处时间，不连续发问。饮食方案留作备选，等她明确提出需要后再准备或送达。';}
   if(changed)notes.push('未记录送达委托，相关行动已改为先核对和列备选。');
  }return notes;
 }
 function analysis(value,context){let v=structuredClone(value);if(!context.culture.enabled){if(Array.isArray(v.sections))v.sections=v.sections.map(s=>s.kind==='culture'?Care.disabledCulture():s);else if(v.sections)v.sections.culture=Care.disabledCulture();}const result=Care.analysis(v),list=exclusions(context);
  const policyNotes=respectBoundaries(result,context);
  if(list.length&&!A.safeMeal(result.food,list))throw Error('菜单或替换含已排除的过敏食材，结果未保存。');
  const all=[result.summary,...result.sections.flatMap(s=>[s.body,...s.actions.flatMap(a=>[a.task,a.how])]),...result.food.meals.map(m=>m.prepare),...result.food.actions.flatMap(a=>[a.task,a.how])];for(const text of all)assertText(text,list);
  if(alone(context)&&contacts([...result.sections.flatMap(s=>s.actions),...result.food.actions]).length>1)throw Error('建议重复要求联系或回应，结果未保存。');if(policyNotes.length)result.policyNotes=[...new Set([...(result.policyNotes||[]),...policyNotes])];return result;
 }
 function chat(value,context){const holder={summary:value.reply,sections:[],food:{actions:value.actions||[]}},notes=respectBoundaries(holder,context);value={...value,reply:holder.summary,actions:holder.food.actions,...(notes.length?{policyNotes:notes}:{})};const list=exclusions(context);assertText(value.reply,list);for(const a of value.actions||[])for(const text of [a.task,a.how])assertText(text,list);if(alone(context)&&contacts(value.actions||[]).length>1)throw Error('建议重复要求联系或回应，结果未保存。');return value;}
 return {analysis,chat,assertText,exclusions,alone};
});
