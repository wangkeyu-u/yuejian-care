'use strict';
(() => {
  const $=selector=>document.querySelector(selector),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const M=window.MoonMemory,C=window.MoonCore;let api,editing=null,editorToken='',busy=false,controller=null,requestId=0,requestSnapshot='';
  function evidence(){const sources=[],today=C.todayISO();for(const [date,e]of Object.entries(api.store.get().entries))if(date<=today&&e.note?.trim())sources.push({id:'note:'+date,date,kind:'note',text:e.note.trim().slice(0,500),order:10000});
    for(const [date,day]of Object.entries(api.sessions.all()))if(date<=today)(day.messages||[]).forEach((m,index)=>{if(m.role==='user'&&m.content.trim())sources.push({id:'chat:'+date+':'+index,date,kind:'chat',text:m.content.trim().slice(0,500),order:index});});
    const seen=new Set();return sources.sort((a,b)=>b.date.localeCompare(a.date)||b.order-a.order).filter(x=>{const key=x.date+'|'+x.text;if(seen.has(key))return false;seen.add(key);return true;}).slice(0,20).map(({order,...x})=>x);
  }
  function snapshot(){return JSON.stringify({day:window.MoonDayContext.makeInput(api.store.get(),C.todayISO()),evidence:evidence()});}
  function sourceLabel(item){return `${item.evidence.date} · ${{chat:'用户发言',note:'当天小记',manual:'手动填写/修改'}[item.evidence.kind]}`;}
  function stop(message=''){requestId++;controller?.abort();controller=null;busy=false;$('#memory-extract-status').textContent=message;$('#memory-extract').disabled=false;$('#memory-extract-cancel').hidden=true;}
  function render(){
    if(!api)return;const m=M.normalize(api.store.get().memory),today=C.todayISO(),pending=m.items.filter(x=>x.status==='pending'),others=m.items.filter(x=>x.status!=='pending');
    if(busy)try{if(snapshot()!==requestSnapshot)stop('来源或设置已经改变，已取消旧提取，请重新核对。');}catch{stop('来源无法读取，已取消提取，请先导出原始备份。');}
    $('#memory-enabled').checked=m.enabled;$('#memory-auto').checked=m.autoExtract;
    const active=M.active(m,today,today);$('#memory-count').textContent=`今天可使用 ${active.length} 条 · 待确认 ${pending.length} 条${m.enabled?'':' · 长期记忆使用已关闭'}`;
    const row=item=>{const isPending=item.status==='pending',expired=!!item.until&&item.until<today;return `<article class="memory-row" data-memory-id="${esc(item.id)}"><div class="memory-row-top"><strong>${esc(M.categories[item.category])}</strong><span>${isPending?'候选 · 未使用':item.status==='archived'?'已停用':expired?'已过期':m.enabled?'已确认':'已确认 · 使用关闭'}</span></div><p>${esc(item.content)}</p><details><summary>来源与适用范围</summary><p class="fine muted">${esc(sourceLabel(item))} · 自 ${esc(item.since)} 起${item.until?'，复核截止 '+esc(item.until):'，未设截止日'}</p><blockquote>${esc(item.evidence.quote)}</blockquote></details><div class="button-row"><button class="small-link" data-memory-edit="${esc(item.id)}">${isPending?'核对并确认 →':'修改/重新采用'}</button><button class="small-link" data-memory-delete="${esc(item.id)}">${isPending?'不采用':'删除记忆'}</button></div></article>`;};
    $('#memory-pending-list').innerHTML=pending.length?pending.map(row).join(''):'<p class="fine muted">暂无候选。可从已有记录提取，或在后续 AI 对话中生成。</p>';
    $('#memory-confirmed-list').innerHTML=others.length?others.map(row).join(''):'<p class="fine muted">还没有已确认的长期记忆。</p>';
    $('#memory-system-preview').textContent=M.promptBlock(M.projected(m,today,today));
    try{$('#memory-evidence-preview').textContent=JSON.stringify(evidence(),null,2);}catch(error){$('#memory-evidence-preview').textContent=error.message;}
  }
  function editor(id=null){
    const m=M.normalize(api.store.get().memory);editing=id?m.items.find(x=>x.id===id):null;editorToken=api.store.token();$('#memory-form').hidden=false;$('#memory-editor-title').textContent=editing?'核对并采用长期记忆':'手动添加长期记忆';$('#memory-category').innerHTML=Object.entries(M.categories).map(([key,label])=>`<option value="${key}">${label}</option>`).join('');$('#memory-category').value=editing?.category||'support';
    $('#memory-content').value=editing?.content||'';$('#memory-since').value=editing?.since||C.todayISO();$('#memory-since').max=C.todayISO();$('#memory-until').value=editing?.until||'';
    $('#memory-replace').innerHTML='<option value="">不替换其他条目</option>'+m.items.filter(x=>x.status==='confirmed'&&x.id!==editing?.id).map(x=>`<option value="${esc(x.id)}">${esc(x.content.slice(0,60))}</option>`).join('');
    $('#memory-confirm').checked=false;$('#memory-editor-status').textContent='';$('#memory-editor-source').textContent=editing?sourceLabel(editing)+' · 原句：'+editing.evidence.quote:'手动填写后会记为用户报告，不由 AI 证明其真实性。';showCategoryNote();$('#memory-form').scrollIntoView({behavior:'smooth',block:'start'});$('#memory-content').focus({preventScroll:true});
  }
  function showCategoryNote(){$('#memory-health-note').hidden=!['health_report','medication_report','allergy_report'].includes($('#memory-category').value);}
  function offer(candidates,sources){const valid=M.validateCandidates(candidates,sources);if(!valid.length)return 0;const result=M.mergeCandidates(api.store.get().memory,valid,C.todayISO());if(result.added)api.store.update(s=>{s.memory=result.memory;});return result.added;}
  async function extract(){
    if(busy)return;const key=api.vault.get();if(!key){$('#memory-extract-status').textContent='请先在设置上方填写 API Key。';return;}
    if(!$('#memory-extract-consent').checked){$('#memory-extract-status').textContent='请展开发送范围，核对原句并确认发送。';return;}
    let sources;try{sources=evidence();}catch(error){$('#memory-extract-status').textContent=error.message;return;}if(!sources.length){$('#memory-extract-status').textContent='还没有可提取的文字记录或用户发言，可先手动添加。';return;}
    const input=window.MoonDayContext.makeInput(api.store.get(),C.todayISO()),signature=window.MoonDayContext.signature(input),id=++requestId;requestSnapshot=snapshot();busy=true;controller=new AbortController();$('#memory-extract').disabled=true;$('#memory-extract-cancel').hidden=false;$('#memory-extract-status').textContent='正在从原句中提取候选，不会自动采用…';
    try{const data=await window.MoonAI.request({...input,mode:'memory',question:'',history:[],memoryEvidence:sources,signature,consent:true},key,controller.signal);if(id!==requestId||requestSnapshot!==snapshot()||signature!==data.signature)return;const count=offer(data.memoryCandidates||[],sources);$('#memory-extract-status').textContent=count?`已保存 ${count} 条新候选，核对后才会进入长期记忆。`:'没有新增可核对的长期候选；重复、临时或缺少原句依据的内容不会保存。';api.notify(count?'已提取候选，请核对后采用。':'提取完成，没有新增候选。');}
    catch(error){if(id===requestId)$('#memory-extract-status').textContent=error.name==='AbortError'?'提取已取消。':error.message;}
    finally{if(id===requestId){busy=false;controller=null;$('#memory-extract').disabled=false;$('#memory-extract-cancel').hidden=true;render();}}
  }
  function init(options){
    api=options;$('#memory-add').addEventListener('click',()=>editor());$('#memory-edit-cancel').addEventListener('click',()=>{$('#memory-form').hidden=true;editing=null;});$('#memory-category').addEventListener('change',showCategoryNote);
    $('#memory-enabled').addEventListener('change',()=>{try{const value=$('#memory-enabled').checked;api.store.update(s=>{s.memory.enabled=value;});api.notify('长期记忆设置已更新，相关 AI 上下文已刷新。');}catch(error){api.notify(error.message);render();}});
    $('#memory-auto').addEventListener('change',()=>{try{const value=$('#memory-auto').checked;api.store.update(s=>{s.memory.autoExtract=value;});}catch(error){api.notify(error.message);render();}});
    document.addEventListener('click',event=>{const edit=event.target.closest('[data-memory-edit]');if(edit)editor(edit.dataset.memoryEdit);const remove=event.target.closest('[data-memory-delete]');if(remove){try{api.store.update(s=>{s.memory=M.forget(s.memory,remove.dataset.memoryDelete);});if(editing?.id===remove.dataset.memoryDelete)$('#memory-form').hidden=true;api.notify('条目已移除，后续上下文已更新。');}catch(error){api.notify(error.message);}}});
    $('#memory-form').addEventListener('submit',event=>{event.preventDefault();if(!$('#memory-confirm').checked){$('#memory-editor-status').textContent='请先核对内容并确认可用于后续分析。';return;}try{const today=C.todayISO(),content=$('#memory-content').value.trim(),changed=editing&&editing.content!==content,item={id:editing?.id||'memory-'+crypto.randomUUID(),category:$('#memory-category').value,content,status:'confirmed',since:$('#memory-since').value,until:$('#memory-until').value||null,evidence:editing&&!changed?editing.evidence:{date:today,kind:'manual',sourceId:'manual',quote:content},createdAt:editing?.createdAt||today,updatedAt:today},replace=$('#memory-replace').value;api.store.update(s=>{s.memory=M.approve(s.memory,item,today,replace);},editorToken);$('#memory-form').hidden=true;editing=null;api.notify('长期记忆已采用，后续请求会附加这条背景。');}catch(error){$('#memory-editor-status').textContent=error.message;}});
    $('#memory-extract').addEventListener('click',extract);$('#memory-extract-cancel').addEventListener('click',()=>{stop('提取已取消，已有记忆不变。');});render();
  }
  window.MoonMemoryUI={init,refresh:render,offer,evidence};
})();
