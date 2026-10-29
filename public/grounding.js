(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.MoonGrounding=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const labels={pain:'疼痛',mood:'心情',energy:'精力',sleep:'睡眠',flow:'出血',support:'支持方式',note:'当天小记',likes:'喜欢',avoid:'不喜欢',dietary:'饮食限制',allergies:'过敏排除项'};
 const words={poor:'睡不好',okay:'没有明显困扰',low:'想慢一点',medium:'还可以',high:'比较充足',usual:'和平时差不多',heavy:'明显比平时多',unexpected:'经期以外出血',alone:'独处',quiet:'安静陪伴',help:'具体帮助'};
 function records(c,question=''){
  const out=[],add=(id,label,text,kind)=>out.push({id,label,text:String(text),kind});
  for(const [k,v]of Object.entries(c.observation||{}))if(labels[k]&&v!==''&&v!=null&&v!=='ask')add('day:'+k,c.date+' · '+labels[k],words[v]||v,'input');
  for(const r of c.recent||[])for(const [k,v]of Object.entries(r.observation))if(labels[k]&&v!==''&&v!=null&&v!=='ask')add('recent:'+r.date+':'+k,r.date+' · '+labels[k]+'（历史报告）',words[v]||v,'history');
  for(const m of c.longTermMemory?.items||[])add('memory:'+m.id,(m.scope==='short_term'?'短期状态':'长期背景')+' · '+m.sourceDate+' · '+({self:'本人表达',partner:'伴侣转述',unknown:'表达者未注明'}[m.reporter])+(m.reviewDue?' · 待复核':''),m.content+'；适用 '+m.since+' 至 '+(m.until||'未设截止')+(m.reviewAt?'；复核日 '+m.reviewAt:''),'memory');
  for(const [k,v]of Object.entries(c.preferences||{}))if(labels[k]&&v?.length)add('preference:'+k,'已填写偏好 · '+labels[k],Array.isArray(v)?v.join('、'):v,'preference');
  add('phase','分期参考 · '+c.phaseAssessment.status,c.phaseAssessment.label+'；'+c.phaseAssessment.basis+'；参考范围 '+(c.phaseAssessment.start||'未知')+' 至 '+(c.phaseAssessment.end||'未知')+'；来源日期 '+(c.phaseAssessment.sourceDates||[]).join('、')+'；'+c.phaseAssessment.uncertainty,'estimate');
  if(question.trim())add('question','本次问题（不等于事实已确认）',question.trim(),'question');
  return out;
 }
 function targets(v,mode='analysis'){
  if(mode==='chat')return ['reply',...(v.actions||[]).map((_,i)=>'action.'+(i+1))];
  const ss=Array.isArray(v.sections)?v.sections:Object.values(v.sections||{});
  return ['summary',...ss.flatMap(s=>[s.kind,...(s.actions||[]).map((_,i)=>s.kind+'.action.'+(i+1))]),'food',...(v.food?.meals||[]).map(m=>'food.'+m.slot),...(v.food?.actions||[]).map((_,i)=>'food.action.'+(i+1))];
 }
 function schema(recordIds,articleIds,mode='analysis'){const string={type:'string'};return {type:'array',items:{type:'object',additionalProperties:false,properties:{targets:{type:'array',items:{type:'string',enum:mode==='chat'?['reply','action.1','action.2','action.3']:['summary',...['culture','tcm','western','psychology'].flatMap(k=>[k,k+'.action.1',k+'.action.2',k+'.action.3']),'food','food.早餐','food.午餐','food.晚餐','food.action.1','food.action.2','food.action.3']}},recordIds:recordIds.length?{type:'array',items:{type:'string',enum:recordIds}}:{type:'array',items:string,maxItems:0},citations:{type:'array',items:{type:'object',additionalProperties:false,properties:{articleId:{type:'string',enum:articleIds},quote:string},required:['articleId','quote']}},reason:string,limit:string},required:['targets','recordIds','citations','reason','limit']}};}
 const bounded=(v,n)=>typeof v==='string'&&v.trim()&&v.length<=n;
 function verify(v,c,mode='analysis',question=''){
  const all=targets(v,mode).filter(t=>c.culture.enabled||!/^culture(?:\.|$)/.test(t)),needed=new Set(all),seen=new Set(),pool=new Map(records(c,question).map(r=>[r.id,r]));
  if(!Array.isArray(v.grounds)||!v.grounds.length||v.grounds.length>24)throw Error('缺少逐项依据，结果未保存。');
  const sections=Array.isArray(v.sections)?v.sections:Object.values(v.sections||{}),items=[];
  for(const g of v.grounds){
   if(!g||!Array.isArray(g.targets)||!g.targets.length||g.targets.length>24||!bounded(g.reason,260)||!bounded(g.limit,220)||!Array.isArray(g.recordIds)||g.recordIds.length>6||!Array.isArray(g.citations)||g.citations.length>3)throw Error('逐项依据结构不完整，结果未保存。');
   const ts=g.targets.filter(t=>c.culture.enabled||!/^culture(?:\.|$)/.test(t));if(!ts.length)continue;
   for(const t of ts){if(!needed.has(t)||seen.has(t))throw Error('依据与结果对应不完整，结果未保存。');seen.add(t);}
   const facts=g.recordIds.map(id=>{if(!pool.has(id))throw Error('引用了本次未提供的记录，结果未保存。');return pool.get(id);});
   const citations=g.citations.map(ref=>{
    const a=c.articles.find(x=>x.id===ref.articleId),paragraph=a?.body?.findIndex(p=>bounded(ref.quote,240)&&ref.quote.trim().length>=8&&p.includes(ref.quote.trim()));
    if(!a||paragraph==null||paragraph<0)throw Error('引用段落无法对照，结果未保存。');
    for(const t of ts){const kind=t.split('.')[0],ids=kind==='food'?v.food?.articleIds:sections.find(s=>s.kind===kind)?.articleIds;
     if(ids&&!ids.includes(a.id)||kind==='food'&&!a.id.startsWith('nutrition-')||['western','psychology','tcm','culture'].includes(kind)&&!(a.subjects||[a.subject]).includes(kind)||mode==='chat'&&!v.articleIds.includes(a.id))throw Error('依据放错领域，结果未保存。');}
    const indexes=a.paragraphSources?.[paragraph]||[];
    return {articleId:a.id,title:a.title,quote:ref.quote.trim(),paragraph:paragraph+1,sources:indexes.map(i=>a.sources?.[i]).filter(Boolean),note:a.verification?.note||''};
   });
   // Personal choices may use reported preferences alone; domain and food claims
   // must also name an actual paragraph, never merely a bibliography entry.
   if(!facts.length&&!citations.length||ts.some(t=>/^(western|psychology|tcm|culture|food)(\.|$)/.test(t))&&!citations.length)throw Error('结论缺少可对照的依据，结果未保存。');
   items.push({targets:ts,records:facts,citations,reason:g.reason.trim(),limit:g.limit.trim(),origin:'model'});
  }
  if(all.some(t=>!seen.has(t)))throw Error('部分结论或行动没有依据，结果未保存。');
  return {version:1,items};
 }
 function values(v,mode){const out={};if(mode==='chat'){out.reply=v.reply;(v.actions||[]).forEach((a,i)=>out['action.'+(i+1)]=JSON.stringify(a));return out;}out.summary=v.summary;for(const s of v.sections||[]){out[s.kind]=s.body;s.actions.forEach((a,i)=>out[s.kind+'.action.'+(i+1)]=JSON.stringify(a));}out.food=v.food.basis;v.food.meals.forEach(m=>out['food.'+m.slot]=JSON.stringify(m));v.food.actions.forEach((a,i)=>out['food.action.'+(i+1)]=JSON.stringify(a));return out;}
 function reconcile(grounding,before,after,c,mode='analysis'){
  const a=values(before,mode),b=values(after,mode),changed=Object.keys(b).filter(k=>a[k]!==b[k]&&!/^culture(?:\.|$)/.test(k)),keep=new Set(Object.keys(b));
  const items=grounding.items.map(g=>({...g,targets:g.targets.filter(t=>keep.has(t)&&!changed.includes(t))})).filter(g=>g.targets.length);
  if(changed.length)items.push({targets:changed,records:records(c).filter(r=>['day:support','day:note'].includes(r.id)),citations:[],reason:'本站规则调整：关系态度不能据独处需求判定；未记录明确委托时，不安排登门或送达。',limit:'这是站内沟通边界规则，不是医学结论；具体意愿以本人当前表达为准。',origin:'rule'});
  return {version:1,items};
 }
 function snapshot(raw){if(!raw)return undefined;if(raw.version!==1||!Array.isArray(raw.items)||raw.items.length>24)throw Error('依据存储格式无效');const short=(s,n)=>typeof s==='string'?s.slice(0,n):'';return {version:1,items:raw.items.map(g=>({targets:(g.targets||[]).filter(x=>typeof x==='string').slice(0,24),reason:short(g.reason,260),limit:short(g.limit,220),origin:g.origin==='rule'?'rule':'model',records:(g.records||[]).slice(0,6).map(r=>({id:short(r.id,160),label:short(r.label,200),text:short(r.text,3000),kind:short(r.kind,20)})),citations:(g.citations||[]).slice(0,3).map(c=>({articleId:short(c.articleId,100),title:short(c.title,160),quote:short(c.quote,240),paragraph:Number.isInteger(c.paragraph)?c.paragraph:0,note:short(c.note,600),sources:(c.sources||[]).slice(0,8).filter(s=>/^https:\/\//.test(s.url)).map(s=>({title:short(s.title,200),url:short(s.url,1200)}))}))}))};}
 const instructions='只返回一个符合所给schema的JSON对象；不加Markdown围栏、开场白或JSON之外的文本。所有字符串中的引号必须正确转义。逐项依据：输出grounds数组。每项targets对应结果位置：summary、culture/tcm/western/psychology及其.action.1起的行动、food、food.早餐/food.午餐/food.晚餐、food.action.1；聊天为reply和action.1起。所有实际输出位置恰好覆盖一次；相同依据可将多个同领域targets合并一组。关闭的culture无需依据。recordIds选1至3项真正相关记录，不为凑数重复字段和小记；只能选recordEvidence中实际支持这项内容的记录；citations每组1至2条，仅从对应articleIds文章body逐字摘取8至80字quote，不改写或拼接原句。reason用一句话解释这些输入和资料如何支持建议，不展示内部思考过程；limit指出仍未知什么或何时不适用。资料只支持一般原则时，明确这是可拒绝的安排/普通配餐示例，不是个人诊断或分期必需。问题中的假设不是已发生事实。不可用过去记录证明今天仍有，不可用待复核记忆证明当前已确认；无个人依据则明确尚未提供，只能给条件性建议。reason分别说明：资料支持的一般原则、个人记录支持的偏好、由此提出的可调整安排。不能把睡眠资料说成某种陪伴方式的科学证明。当天记录由用户填写，未标明本人原话时称为“已填记录”，不自行改成“本人报告”。依据只支持一部分时缩小结论，不用泛泛文献给新推断背书。';
 return {records,targets,schema,verify,reconcile,snapshot,instructions};
});
