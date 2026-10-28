'use strict';
(() => {
  const $=selector=>document.querySelector(selector),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const C=window.MoonCatalog,KEY='yuejian.library.v1',byId=new Map(C.articles.map(a=>[a.id,a]));
  let api,subject='all',scene='全部问题',query='',visible=8,articleId=null;
  function memory(){const raw=localStorage.getItem(KEY);if(!raw)return {bookmarks:[]};const value=JSON.parse(raw);if(!value||typeof value!=='object'||Array.isArray(value))throw Error('百科收藏无法读取，请先导出备份。');return value;}
  function marks(){try{return (memory().bookmarks||[]).filter(id=>byId.has(id));}catch{return [];}}
  function toggle(id){try{const data=memory(),list=marks();data.bookmarks=list.includes(id)?list.filter(x=>x!==id):[...list,id];localStorage.setItem(KEY,JSON.stringify(data));render();if(articleId)renderArticle();}catch(error){api.notify(error.message);}}
  const basis=a=>({clinical:'医学资料',traditional:'传统理论',editorial:'编辑建议',mixed:'资料与编辑整理'}[a.verification?.basis]||'待核对');
  function render(){
    if(!api)return;const bookmarks=marks();$('#library-count').textContent=C.articles.length+' 篇有出处的资料';
    $('#library-subjects').innerHTML=Object.entries(C.subjects).map(([id,name])=>`<button data-subject="${id}" aria-pressed="${id===subject}">${name}</button>`).join('');
    $('#library-scenes').innerHTML=C.scenes.map(name=>`<button data-scene="${esc(name)}" aria-pressed="${name===scene}">${name}</button>`).join('');
    const found=C.filter({subject,scene,query,saved:$('#library-saved').checked,bookmarks});
    $('#library-result-count').textContent=`${found.length} 篇${subject==='psychology'?' · 心理与睡眠资料也可在西医领域找到':''}`;
    $('#library-results').innerHTML=found.length?found.slice(0,visible).map(a=>`<article class="knowledge-row"><div><span class="section-label">${esc(a.scene)} · ${esc(basis(a))}</span><button class="article-read" data-read-article="${esc(a.id)}"><h2>${esc(a.title)}</h2><p>${esc(a.summary)}</p><span class="fine muted">核对 ${esc(a.verification?.checkedAt||'待核对')} · 阅读原文与引用范围 ↗</span></button></div><button class="bookmark-button" data-bookmark="${esc(a.id)}" aria-pressed="${bookmarks.includes(a.id)}" aria-label="${bookmarks.includes(a.id)?'取消收藏':'收藏'}：${esc(a.title)}">${bookmarks.includes(a.id)?'已收藏':'收藏 ＋'}</button></article>`).join(''):'<div class="empty-state"><h2>没有找到这类资料</h2><p>试试较短的词，或切回全部领域与全部问题。</p></div>';
    $('#library-more').hidden=visible>=found.length;
  }
  function renderArticle(){
    const a=byId.get(articleId);if(!a)return;const verification=a.verification||{};const supports=new Map((verification.sourceNotes||[]).map(x=>[x.url,x.supports]));
    $('#article-body').innerHTML=`<span class="section-label">${esc(a.scene)} · ${esc(basis(a))}</span><h2 id="article-title">${esc(a.title)}</h2><p class="article-deck">${esc(a.summary)}</p><aside class="notice"><strong>资料核对 ${esc(verification.checkedAt||'未完成')}</strong><p>${esc(verification.note||'请核对原始资料。')}</p></aside><div class="article-paragraphs">${a.body.map((p,i)=>`<p>${esc(p)}${(a.paragraphSources?.[i]||[]).filter(n=>a.sources[n]).map(n=>`<a href="${esc(a.sources[n].url)}" target="_blank" rel="noopener noreferrer" aria-label="本段来源 ${n+1}">[${n+1}]</a>`).join('')}</p>`).join('')}</div><h3>原文与支持范围</h3>${a.sources.filter(s=>/^https:\/\//.test(s.url)).map(s=>`<div class="article-source"><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)} ↗</a><p>${esc(supports.get(s.url)||'支持范围以原文为准。')}</p></div>`).join('')}<div class="button-row"><button class="button outline" data-bookmark="${esc(a.id)}">${marks().includes(a.id)?'取消收藏':'收藏这篇'}</button><button class="button primary" id="article-ask-day">带着这条问今天的 AI →</button></div><p class="fine muted">打开当天对话后仍需确认发送；引用资料不会自动替你记录症状。</p>`;
    $('#article-ask-day').addEventListener('click',()=>{const focus=articleId;$('#article-dialog').close();api.openDay(window.MoonCore.todayISO(),focus);});
  }
  function open(id){if(!byId.has(id))return;articleId=id;renderArticle();if(!$('#article-dialog').open)$('#article-dialog').showModal();$('#article-dialog').scrollTop=0;}
  function init(options){api=options;$('#library-search').addEventListener('input',e=>{query=e.target.value;visible=8;render();});$('#library-saved').addEventListener('change',()=>{visible=8;render();});$('#library-more').addEventListener('click',()=>{visible+=8;render();});document.addEventListener('click',event=>{const s=event.target.closest('[data-subject]');if(s){subject=s.dataset.subject;scene='全部问题';visible=8;render();}const f=event.target.closest('[data-scene]');if(f){scene=f.dataset.scene;visible=8;render();}const b=event.target.closest('[data-bookmark]');if(b)toggle(b.dataset.bookmark);const read=event.target.closest('[data-read-article]');if(read)open(read.dataset.readArticle);});$('#article-dialog').addEventListener('close',()=>{articleId=null;});render();}
  window.MoonLibrary={init,refresh:render,open,exportState:()=>memory(),clear:()=>{localStorage.removeItem(KEY);render();}};
})();
