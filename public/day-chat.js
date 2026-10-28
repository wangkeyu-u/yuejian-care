'use strict';
(() => {
  const I=window.MoonIcons.icon;
  const $=selector=>document.querySelector(selector),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const names={culture:'玄学与历法',tcm:'中医',western:'西医',psychology:'心理学'},order=['culture','tcm','western','psychology'];
  let api,date=null,activeSignature='',dirty=false,entryToken='',focusArticleId='',controller=null,run=0,busy=false,lastError='';
  function input(question='',mode='analysis'){return window.MoonDayContext.makeInput(api.store.get(),date,api.store.get().model,question,mode,$('#day-memory-focus').value);}
  function signature(){return window.MoonDayContext.signature(input());}
  function session(){try{return api.sessions.get(date);}catch(error){$('#day-request-status').textContent=error.message;return null;}}
  function references(ids){return (ids||[]).filter(id=>api.catalog.some(a=>a.id===id)).map(id=>`<button class="small-link" data-read-article="${esc(id)}">${esc(api.catalog.find(a=>a.id===id).title)} ${I('arrowRight')}</button>`).join('');}
  function actionsHTML(actions=[]){return '<ol class="care-actions">'+actions.map(a=>typeof a==='string'?`<li class="legacy-action">${esc(a)}</li>`:`<li><span class="action-when">${esc(a.when)}</span><strong>${esc(a.task)}</strong><p><span>怎么做</span>${esc(a.how)}</p><p class="action-adjust"><span>不合适时</span>${esc(a.adjust)}</p></li>`).join('')+'</ol>';}
  function renderFood(current,ctx,stale){const f=current?.analysis?.food,restrictions=[ctx.preferences.dietary,...ctx.longTermMemory.items.filter(x=>x.category==='allergy_report').map(x=>x.content)].filter(Boolean);$('#day-food').classList.toggle('stale',stale);$('#day-food').innerHTML=`<div class="section-heading"><div><span class="section-label">${f?stale?'历史饮食方案 · 需重新生成':'AI 饮食搭配 · 非治疗食谱':'饮食与准备'}</span><h4 id="day-food-title">${ctx.date===window.MoonCore.todayISO()?'今天吃什么':'这一天吃什么'}</h4></div></div><p class="fine muted">${restrictions.length?'已记录限制/过敏报告：'+esc(restrictions.join('；')):'尚未确认饮食限制或过敏；先向她核对，再做饭或下单。'}</p>${f?`<h5>${esc(f.title)}</h5><p class="food-basis">${esc(f.basis)}</p><div class="meal-grid">${f.meals.map(m=>`<article class="meal"><span class="section-label">${esc(m.slot)}</span><h5>${esc(m.foods)}</h5><p><strong>准备</strong>${esc(m.prepare)}</p><p><strong>替换</strong>${esc(m.swap)}</p></article>`).join('')}</div><h5>把这一餐落实</h5>${actionsHTML(f.actions)}<p class="food-caution">${esc(f.caution)}</p><details><summary>饮食依据与来源</summary><div class="reference-links">${references(f.articleIds)}</div></details>`:`<p class="food-empty">${current?.analysis?'这份历史分析还没有饮食方案，请重新生成。':'生成分析后，这里会列出早餐、午餐、晚餐的组合、替换和准备步骤。'}</p><button class="small-link" data-read-article="nutrition-meal-pattern">先看有出处的配餐方法 ${I('arrowRight')}</button>`}`;}
  function context(){return window.MoonDayContext.build(input(),api.catalog);}
  function requestContext(current,mode,question){const data=input(question,mode),key=window.MoonDayContext.retrievalKey(data),same=current?.contextKey===key,start=same?current.contextHistoryStart||0:(current?.messages||[]).length;return {data,key,start,history:mode==='chat'&&same?(current.messages||[]).slice(start).slice(-12).map(m=>({role:m.role,content:m.content})):[],analysis:mode==='chat'&&current?.analysisContextKey===key?current.analysis:undefined};}
  function preview(){if(!date)return;const current=session(),valid=current?.signature===signature(),question=$('#day-question').value,mode=valid?'chat':'analysis',ctx=requestContext(current,mode,valid?question:'');try{const prepared=window.MoonAI.preparePayload({...ctx.data,mode,consent:true,signature:signature(),history:ctx.history,analysis:ctx.analysis,question:valid?question:'',focusArticleId});$('#day-data-preview').textContent=JSON.stringify({preparedRequest:prepared,systemMemory:window.MoonMemory.promptBlock(ctx.data.memory),sendingRule:'按问题选择记忆和前两个公历日的相关情况；只有背景选择一致时才沿用本日分析与当前话题段，最多6轮。其他本日历史仅保留查看。Key 不在此内容中。'},null,2);$('#day-memory-selection').textContent='本次选择：'+ctx.data.memory.selection.map(x=>window.MoonMemory.topics[x]).join('、')+' · '+ctx.data.memory.items.length+' 条记忆'+(ctx.data.recent.length?' · 近期来源 '+ctx.data.recent.map(x=>x.date).join('、'):' · 无相关近期记录')+(valid&&!ctx.analysis?'。背景选择已变化，将根据当前资料重新回答。':'。可在上方数据范围查看内容。');}catch(error){$('#day-data-preview').textContent=error.message;}}


  function status(message){lastError=message;$('#day-request-status').textContent=message;$('#day-analysis-status').textContent=message;}
  function abort(message=''){lastError='';run++;controller?.abort();controller=null;busy=false;$('#day-cancel').hidden=true;$('#day-request-status').textContent=message;}
  function setFields(){const e=api.store.get().entries[date]||{};for(const key of ['pain','energy','mood','sleep','flow','support','note'])$('#day-'+key).value=e[key]??'';entryToken=api.store.token();dirty=false;}
  function render({fields=false}={}){
    if(!date)return;const currentContext=context(),current=session(),stale=!!current&&current.signature!==activeSignature,future=date>window.MoonCore.todayISO();
    $('#day-title').textContent=date.replaceAll('-',' / ');$('#day-phase').textContent=currentContext.phaseLabel;
    $('#day-reference').textContent=currentContext.info.day?`${currentContext.info.predicted?'预计':'按记录'}周期第 ${currentContext.info.day} 天`:'尚无实际开始日';
    $('#day-prev').disabled=date<='1900-01-01';$('#day-next').disabled=date>='2100-12-31';
    if(fields)setFields();$('#day-record-status').textContent=future?'未来感受留待当天':dirty?'有未保存修改':api.store.get().entries[date]?'已保存，可修改':'未填写';
    for(const el of $('#day-record-form').elements)el.disabled=future||!!api.store.error();
    $('#day-medical').hidden=!currentContext.medicalPriority.length;$('#day-medical').textContent=currentContext.medicalPriority.map(a=>a.body).join(' ');
    $('#day-analysis-status').textContent=lastError?lastError:busy?'AI 正在整理当天资料…':stale?'已过期：记录或相关设置已变，请重新生成。':current?.analysis?`${current.imported?'导入的历史分析':'已由 AI 生成'} · ${current.model} · ${new Date(current.generatedAt).toLocaleString('zh-CN')} `:'尚未生成 AI 分析。先保存实际情况，再确认数据范围。';
    const pending=api.store.get().memory.items.filter(x=>x.status==='pending').length;$('#day-memory-status').innerHTML=`本次使用 ${currentContext.longTermMemory.items.length} 条已确认记忆${pending?' · '+pending+' 条候选待核对':''} <button class="small-link" data-go-settings>管理记忆 ${I('arrowRight')}</button>`;
    $('#day-key-link').hidden=!!api.vault.get();
    $('#day-generate').textContent=current?.analysis?'重新生成分析与饮食':'生成分析与饮食建议';$('#day-generate').disabled=busy;
    $('#day-analysis').classList.toggle('stale',stale);
    $('#day-analysis').innerHTML=order.map(kind=>{const s=current?.analysis?.sections?.find(x=>x.kind===kind);return `<article class="analysis-block" data-analysis-kind="${kind}"><div class="section-heading"><h4>${names[kind]}</h4><span class="fine muted">${s?stale?'旧版 AI 分析':'AI 分析':'等待 AI'}</span></div><p class="analysis-basis fine muted">${{culture:'传统文化解释与自选灵感',tcm:'传统理论与疗法证据分别说明',western:'根据医学资料与实际身体记录',psychology:'根据心理、睡眠资料与本人表达'}[kind]}</p>${s?`<h5>${esc(s.title)}</h5><p>${esc(s.body)}</p>${actionsHTML(s.actions)}<details><summary>查看依据与来源</summary><div class="reference-links">${references(s.articleIds)}</div></details>`:`<p class="muted">${kind==='culture'&&!currentContext.culture.enabled?'你已关闭文化分析，生成时会注明未开启。':'连接 API 后，AI 会结合这一天的记录与相关资料整理这一部分。'}</p>`}</article>`;}).join('');
    renderFood(current,currentContext,stale);
    if(current?.analysis?.summary)$('#day-analysis').insertAdjacentHTML('afterbegin',`<p class="analysis-overview">${esc(current.analysis.summary)}</p>`);
    if(current?.analysis?.uncertainty)$('#day-analysis').insertAdjacentHTML('beforeend',`<p class="analysis-uncertainty">${esc(current.analysis.uncertainty)}</p>`);
    $('#day-chat-context').textContent=stale?'旧上下文已暂停':current?.analysis?'仅此日期 · '+Math.floor((current.messages||[]).length/2)+' 轮历史（发送范围见预览）':'先生成四块分析';
    $('#day-messages').innerHTML=(current?.messages||[]).map(m=>`<article class="message ${m.role}"><strong>${m.role==='user'?'你的问题':'AI 的回答'}</strong><p>${esc(m.content)}</p>${m.articleIds?.length?`<div class="reference-links">${references(m.articleIds)}</div>`:''}</article>`).join('');
    $('#day-send').disabled=busy||stale||!current?.analysis;$('#day-cancel').hidden=!busy;preview();
  }
  function refresh(){if(!date||!$('#day-dialog').open)return;let next;try{next=signature();}catch(error){abort(error.message);return;}if(next!==activeSignature){abort('当天记录或设置已更新，旧分析不再用于新对话。');activeSignature=next;$('#day-ai-consent').checked=false;}render({fields:!dirty});}
  function open(next,article=''){
    abort();date=next;focusArticleId=article;dirty=false;activeSignature=signature();$('#day-ai-consent').checked=false;$('#day-memory-focus').value='auto';$('#day-question').value=article?`结合《${api.catalog.find(a=>a.id===article)?.title||'这条资料'}》，她今天应该注意什么？`:'';api.selectDate(next);
    render({fields:true});$('#day-observation-details').open=false;if(!$('#day-dialog').open)$('#day-dialog').showModal();$('#day-dialog').scrollTop=0;
  }
  async function send(mode){
    if(busy)return;if(dirty){status('有未保存的当天情况，请先保存再分析。');return;}
    const key=api.vault.get();if(!key){status('请先到设置填写 API Key，再生成分析。');return;}
    if(!$('#day-ai-consent').checked){status('请先核对上下文并确认发送。');return;}
    const s=session(),question=$('#day-question').value.trim();if(mode==='chat'&&(!question||!s?.analysis||s.signature!==activeSignature)){ status('请先生成最新分析，再输入问题。');return; }
    if(mode==='chat'&&(s.messages||[]).length>=100){status('这一天已保存50轮对话，请先导出备份，再重新生成分析开启新一段对话。');return;}
    lastError='';
    const snapshot=activeSignature,requestDate=date,id=++run,expected=(()=>{try{return api.sessions.token(date);}catch{return undefined;}})();
    if(expected===undefined){$('#day-request-status').textContent='每日对话存储无法读取，请先导出原始备份。';return;}
    let payload,requestCtx;try{requestCtx=requestContext(s,mode,mode==='chat'?question:'');payload=window.MoonAI.preparePayload({...requestCtx.data,mode,consent:true,signature:snapshot,question:mode==='chat'?question:'',focusArticleId,history:requestCtx.history,analysis:requestCtx.analysis});}catch(error){status(error.message);return;}
    controller=new AbortController();busy=true;$('#day-request-status').textContent=mode==='analysis'?'正在生成具体行动与三餐方案…':'正在结合本日分析回答…';render();
    try{
      const data=await window.MoonAI.request(payload,key,controller.signal);
      if(id!==run||date!==requestDate||snapshot!==signature()||data.signature!==snapshot)return;
      const dependency={privacyBlocks:window.MoonMemory.barrierTokens(api.store.get().memory),memoryRoots:[...new Set(payload.memory.items.map(x=>x.rootId))],memoryIds:payload.memory.items.map(x=>x.id),sourceDates:[...new Set([...(payload.recent||[]).map(x=>x.date),...(payload.observation.note?[requestDate]:[])])]};
      let next;
      if(mode==='analysis'){const clean=window.MoonCareOutput.analysis(data.analysis);next={...dependency,contextKey:requestCtx.key,analysisContextKey:requestCtx.key,contextHistoryStart:0,signature:snapshot,analysis:clean,messages:[],model:data.model,generatedAt:data.generatedAt,previous:s?.analysis?{privacyBlocks:s.privacyBlocks,memoryRoots:s.memoryRoots,memoryIds:s.memoryIds,sourceDates:s.sourceDates,blockedForExtraction:s.blockedForExtraction,analysis:s.analysis,messages:s.messages||[],generatedAt:s.generatedAt}:s?.previous||null};}
      else {if(typeof data.reply!=='string')throw Error('回答格式无效，未保存。');data.actions=window.MoonCareOutput.actions(data.actions);next={...s,contextKey:requestCtx.key,contextHistoryStart:requestCtx.start,privacyBlocks:dependency.privacyBlocks,memoryRoots:[...new Set([...(s.memoryRoots||[]),...dependency.memoryRoots])],memoryIds:[...new Set([...(s.memoryIds||[]),...dependency.memoryIds])],sourceDates:[...new Set([...(s.sourceDates||[]),...dependency.sourceDates])],messages:[...(s.messages||[]),{role:'user',content:question},{role:'assistant',content:data.reply+(data.actions?.length?'\n\n具体行动\n'+data.actions.map(window.MoonCareOutput.formatAction).join('\n\n'):'')+(data.uncertainty?'\n\n'+data.uncertainty:''),articleIds:data.articleIds||[]}]};}
      api.sessions.put(date,next,expected);if(mode==='chat')$('#day-question').value='';$('#day-request-status').textContent='已保存在这一天。';api.onSaved();
      if(data.memoryCandidates?.length){try{const rawEvidence=window.MoonMemory.dayEvidence(context(),payload.history,payload.question),offset=Math.max(0,(s?.messages||[]).length-payload.history.length),idMap=id=>id==='day-note'?'note:'+requestDate:id==='question'?'chat:'+requestDate+':'+(next.messages.length-2):'chat:'+requestDate+':'+(offset+Number(id.slice(5))),evidence=rawEvidence.map(e=>({...e,id:idMap(e.id),privacyBlocks:e.kind==='note'?api.store.get().entries[requestDate]?.privacyBlocks||[]:next.privacyBlocks||[]})),candidates=data.memoryCandidates.map(c=>({...c,sourceId:idMap(c.sourceId)}));const added=api.onMemoryCandidates(candidates,evidence);if(added)api.notify(`已提取 ${added} 条记忆候选，确认后才会跨日使用。`);}catch(error){status('回答已保存，但候选记忆未保存：'+error.message);}}
    }catch(error){if(id===run)status(error.name==='AbortError'?'请求已取消。':error.message);}
    finally{if(id===run){busy=false;controller=null;render();}}
  }
  function init(options){
    api=options;$('#day-food-jump').addEventListener('click',()=>$('#day-food').scrollIntoView({behavior:'instant',block:'start'}));$('#day-dialog').addEventListener('close',()=>abort());$('#day-prev').addEventListener('click',()=>open(window.MoonCore.addDays(date,-1)));$('#day-next').addEventListener('click',()=>open(window.MoonCore.addDays(date,1)));
    $('#day-record-form').addEventListener('input',()=>{dirty=true;$('#day-ai-consent').checked=false;$('#day-record-status').textContent='有未保存修改，AI 暂用已存资料';});
    $('#day-record-form').addEventListener('submit',event=>{event.preventDefault();const e={};for(const key of['mood','energy','sleep','flow','support','note'])e[key]=$('#day-'+key).value;e.pain=$('#day-pain').value===''?null:Number($('#day-pain').value);e.privacyBlocks=window.MoonMemory.barrierTokens(api.store.get().memory);e.topics=api.store.get().entries[date]?.topics||[];try{dirty=false;api.store.update(s=>{s.entries[date]=window.MoonState.entry(e);},entryToken);api.notify('当天情况已保存，相关上下文已更新。');}catch(error){dirty=true;$('#day-request-status').textContent=error.message;}});
    $('#day-generate').addEventListener('click',()=>send('analysis'));$('#day-chat-form').addEventListener('submit',event=>{event.preventDefault();send('chat');});$('#day-cancel').addEventListener('click',()=>{abort('请求已取消，本机记录不变。');render();});$('#day-question').addEventListener('input',()=>{$('#day-ai-consent').checked=false;preview();});$('#day-memory-focus').addEventListener('change',()=>{$('#day-ai-consent').checked=false;preview();});
  }
  window.MoonDayChat={init,open,refresh,cancel:abort};
})();
