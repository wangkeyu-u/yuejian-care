(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.MoonAI=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  function createPayload(context,model='gpt-4.1-mini') {
    const profile=context.profile||{};
    return {consent:true,model,date:context.date,profile:{periods:(profile.periods||[]).slice(-24).map(p=>({id:p.id,start:p.start,end:p.end,status:p.status})),cycleLength:profile.cycleLength,periodLength:profile.periodLength},observation:{mood:context.mood||'',pain:context.pain??null,energy:context.energy||'',sleep:context.sleep||'',flow:context.flow||'',support:context.support||'ask',topics:Array.isArray(context.topics)?context.topics.slice():[]}};
  }
  const signature=context=>JSON.stringify(createPayload(context,''));
  let api=null,request=null,renderedSignature=null,result=null,runId=0;
  const $=s=>document.querySelector(s);
  const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function refresh(){
    if(!api)return;
    const current=signature(api.getContext());
    if(current!==renderedSignature){
      const had=result||request;runId++;request?.abort();request=null;result=null;renderedSignature=current;
      $('#ai-result').hidden=true;$('#ai-result').textContent='';
      $('#ai-panel-status').textContent=had?'记录已改变，上一次 AI 分析已失效。可重新分析。':'当前显示本地综合建议；AI 分析由你选择发起。';
      $('#ai-status').textContent=had?'记录已更新，请重新核对发送预览后再分析。':'';
      $('#ai-submit').disabled=false;
      if($('#ai-dialog').open){$('#ai-consent').checked=false;updatePreview();}
    }
  }
  function updatePreview(){if(api)$('#ai-preview').textContent=JSON.stringify(createPayload(api.getContext(),$('#ai-model').value.trim()),null,2);}
  function renderResult(data){
    const articles=api.getArticles();const byId=new Map(articles.map(a=>[a.id,a]));
    $('#ai-result').innerHTML=`<div class="section-heading"><h3>AI 整理的分析</h3><span class="fine">${escape(data.model)}</span></div><p>${escape(data.analysis.summary)}</p><h4>下次经期参考的解释</h4><p>${escape(data.analysis.cycleExplanation)}</p><p class="fine muted">日期与参考范围仍使用上方可复算的本地结果。AI 文字不改写日期或记录。</p><div class="advice-secondary">${data.analysis.actions.map(a=>`<article class="advice-card"><h4>${escape(a.title)}</h4><p>${escape(a.body)}</p><div class="companion-links">${a.articleIds.filter(id=>byId.has(id)).map(id=>`<button class="small-link" data-read-article="${escape(id)}">${escape(byId.get(id).title)} ↗</button>`).join('')}</div></article>`).join('')}</div><p class="soft-callout">${escape(data.analysis.uncertainty)}</p><p class="fine muted">AI 输出可能有误，引用文章可逐条核对；医疗优先提示以本地综合建议为准。本结果只在本页暂存。</p>`;
    $('#ai-result').hidden=false;
  }
  function init(options){
    api=options;renderedSignature=signature(api.getContext());
    $('#ai-open').addEventListener('click',()=>{$('#ai-consent').checked=false;$('#ai-key').value='';$('#ai-status').textContent='';updatePreview();$('#ai-dialog').showModal();});
    $('#ai-model').addEventListener('input',()=>{$('#ai-consent').checked=false;updatePreview();});
    $('#ai-dialog').addEventListener('close',()=>{$('#ai-key').value='';});
    $('#ai-cancel').addEventListener('click',()=>{runId++;request?.abort();request=null;$('#ai-key').value='';$('#ai-submit').disabled=false;$('#ai-status').textContent='已取消请求，本地记录保持不变。';});
    $('#ai-form').addEventListener('submit',async event=>{
      event.preventDefault();if(request)return;
      if(!$('#ai-consent').checked){$('#ai-status').textContent='请先核对数据并确认发送。';return;}
      const key=$('#ai-key').value.trim();if(!/^[A-Za-z0-9_-]{20,512}$/.test(key)){$('#ai-status').textContent='请填写有效的 OpenAI API Key。';return;}
      const model=$('#ai-model').value.trim();if(!/^gpt-[a-zA-Z0-9._-]{1,70}$/.test(model)){$('#ai-status').textContent='请填写正确的 OpenAI 模型 ID。';return;}
      const context=api.getContext(),snapshot=signature(context),payload=createPayload(context,model),id=++runId;
      request=new AbortController();$('#ai-key').value='';$('#ai-submit').disabled=true;$('#ai-status').textContent='正在分析，请保持页面打开。';
      try{
        const response=await fetch('/api/analyze',{method:'POST',headers:{'Content-Type':'application/json','Authorization':'Bearer '+key},body:JSON.stringify(payload),signal:request.signal,credentials:'same-origin',cache:'no-store'});
        const data=await response.json();if(id!==runId||snapshot!==signature(api.getContext()))return;
        if(!response.ok||!data.analysis)throw new Error(data.error||'分析暂未完成，请检查服务设置。');
        result=data;renderedSignature=snapshot;renderResult(data);$('#ai-status').textContent='分析已完成。';$('#ai-panel-status').textContent='已按当前记录完成 AI 分析；编辑日期或感受后需要重新分析。';$('#ai-dialog').close();$('#ai-result').scrollIntoView({behavior:'smooth',block:'start'});
      }catch(error){if(id===runId)$('#ai-status').textContent=error.name==='AbortError'?'请求已取消。':error.message||'网络异常，仍可使用本地建议。';}
      finally{if(id===runId){request=null;$('#ai-submit').disabled=false;}}
    });
    refresh();
  }
  return {createPayload,signature,init,refresh};
});
