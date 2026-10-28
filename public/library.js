'use strict';
(() => {
  const $ = selector => document.querySelector(selector);
  const $$ = selector => [...document.querySelectorAll(selector)];
  const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const model = window.MoonLibraryModel;
  const articles = [...(window.MoonHealthArticles || []).map(a => ({ ...a, kind: 'health' })), ...(window.MoonTCMArticles || []).map(a => ({ ...a, kind: 'tcm' })), ...(window.MoonCultureArticles || []).map(a => ({ ...a, kind: 'culture' }))];
  const articleById = new Map(articles.map(a => [a.id, a]));
  const STORAGE_KEY = 'yuejian.library.v1';
  const elements = ['木', '火', '土', '金', '水'];
  const symbols = { 木: '生长', 火: '微光', 土: '安定', 金: '留白', 水: '流动' };
  const elementMap = { 甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水' };
  const rituals = {
    木: { color: '苔绿', hex: '#879776', title: '给自己一点慢慢生长的余地', options: ['看看窗外的一株植物', '写下一句想对自己说的话'], release: '可以放下一次完成所有事的要求。' },
    火: { color: '陶红', hex: '#b67b66', title: '留一盏让自己舒服的微光', options: ['打开一盏柔和的灯', '听一首自己熟悉的歌'], release: '可以放下必须立刻回应所有人的压力。' },
    土: { color: '燕麦', hex: '#baaa85', title: '让身边的一个小角落安定下来', options: ['整理一个手掌大的桌面', '为自己留一段不赶时间的休息'], release: '可以放下把所有空白都填满的安排。' },
    金: { color: '月白', hex: '#b3b4a6', title: '从一件小事里，留一点白', options: ['暂时收起一件不急的待办', '读几页熟悉的书'], release: '可以放下今天必须很高效的标准。' },
    水: { color: '灰蓝', hex: '#869fa1', title: '让念头慢慢经过，不必抓住每一个', options: ['听一点舒缓的声音', '把当下的感受写成一句话'], release: '可以放下马上解释清楚每种感受的要求。' }
  };
  let api = null, kind = 'health', category = '全部', query = '', openArticleId = null;
  let visibleCount = 8;
  let articleReturnFocus = null;
  let memory = { bookmarks: [], elementsByDate: {}, plans: {} };
  let storageWarning = false;
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    if (data && typeof data === 'object') {
      memory.bookmarks = [...new Set((Array.isArray(data.bookmarks) ? data.bookmarks : []).filter(id => articleById.has(id)))];
      if (data.elementsByDate && typeof data.elementsByDate === 'object') Object.entries(data.elementsByDate).forEach(([date, value]) => { if (window.MoonCore.isISODate(date) && elements.includes(value)) memory.elementsByDate[date] = value; });
      if (data.plans && typeof data.plans === 'object') Object.entries(data.plans).forEach(([date, plan]) => { if (window.MoonCore.isISODate(date) && plan && elements.includes(plan.element) && [0, 1].includes(plan.option)) memory.plans[date] = { element: plan.element, option: plan.option }; });
    }
  } catch (_) { storageWarning = true; }
  function save(message) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(memory)); storageWarning = false; if (message) api?.notify(message); }
    catch (_) { storageWarning = true; api?.notify('本机未能保存收藏或仪式选择，请导出数据。'); }
  }
  function context() { return api.getContext(); }
  function cultureVisible() { const c = context(); return c.culture && !c.quiet; }
  function setKind(next) { kind = next; category = '全部'; query = ''; visibleCount = 8; $('#library-search').value = ''; render(); }
  function readArticle(id) {
    const article = articleById.get(id);
    if (!article || (article.kind === 'culture' && !cultureVisible())) return;
    if (!$('#article-dialog').open) articleReturnFocus = { element: document.activeElement, articleId: document.activeElement?.dataset?.readArticle || id };
    openArticleId = id;
    renderArticle();
    if (!$('#article-dialog').open) $('#article-dialog').showModal();
    $('#article-dialog').scrollTop = 0;
  }
  const kindNames = { health: '经期知识', tcm: '中医常识', culture: '传统文化' };
  const basisNames = { clinical: '医学资料', traditional: '传统理论', editorial: '编辑建议', mixed: '资料与编辑整理' };
  function evidenceLabel(article) { return basisNames[article.verification?.basis] || '来源待核对'; }
  function renderApplication(article) {
    const daily = context().adviceDaily;
    const used = daily?.actions.filter(item => item.articleIds.includes(article.id)) || [];
    if (daily?.culture?.articleIds.includes(article.id)) used.push({title:'休息空档的一点仪式感'});
    return `<aside class="article-application"><strong>这条知识怎样用到这一天</strong><p>${used.length ? '已用于：' + used.map(item=>esc(item.title)).join('；') + '。' : '当前记录没有触发这条知识的具体安排，先保留为需要时查阅的资料，不把每一条知识强套到每一天。'}</p><button class="small-link" data-show-advice>查看合成后的照护方案 →</button></aside>`;
  }
  function renderPlanBridge() {
    const daily = context().adviceDaily;
    if (!daily) { $('#knowledge-plan-bridge').hidden=true; return; }
    $('#knowledge-plan-bridge').hidden=false;
    const items = [daily.actions[0], daily.actions.find(item=>item.id==='day-meal')].filter(Boolean);
    $('#knowledge-plan-bridge').innerHTML=`<div class="section-heading"><div><h2 id="knowledge-plan-title">知识已经用在这一天的安排里</h2><p>${esc(context().date)} · 根据日期与已填写的感受整理</p></div><button class="button outline" data-show-advice>看完整照护方案 →</button></div><p class="bridge-summary">${esc(daily.summary)}</p><div class="bridge-actions">${items.map(item=>`<div><strong>${esc(item.timing)} · ${esc(item.title)}</strong><p>${esc(item.steps[0])}</p></div>`).join('')}</div><p class="fine muted">下方是原文资料。打开文章，可以看到它具体用在了哪一项安排里。</p>`;
  }
  function renderArticle() {
    const a = articleById.get(openArticleId); if (!a) return;
    const saved = memory.bookmarks.includes(a.id);
    const verification = a.verification;
    const supports = new Map((verification?.sourceNotes || []).map(note => [note.url, note.supports]));
    const relatedIds = a.kind === 'tcm' ? ['health-urgent-pain', 'health-medication'] : a.kind === 'culture' ? ['health-first-day'] : ['health-cycle-day-one', 'health-urgent-pain'];
    const related = relatedIds.filter(id => id !== a.id).map(id => articleById.get(id)).filter(Boolean);
    $('#article-body').innerHTML = `<div class="article-topline"><span class="article-kind ${a.kind}">${esc(kindNames[a.kind])} · ${esc(a.category)}</span><button class="article-save" data-bookmark="${a.id}" aria-pressed="${saved}">${saved ? '已收藏 ✓' : '收藏这条 ＋'}</button></div><h2 id="article-title">${esc(a.title)}</h2><p class="article-deck">${esc(a.summary)}</p><aside class="article-evidence" aria-label="资料性质与核对信息"><div><strong>${esc(evidenceLabel(a))}</strong><span>${verification ? '来源核对：' + esc(verification.checkedAt) : '尚未完成来源核对'}</span></div><p>${esc(verification?.note || '暂不将本条作为已核实的知识。')}</p></aside><div class="article-paragraphs">${a.body.map((p, paragraphIndex) => `<p>${esc(p)}${(a.paragraphSources?.[paragraphIndex] || []).filter(index => a.sources[index]).map(index => `<a class="paragraph-source" href="${esc(a.sources[index].url)}" target="_blank" rel="noopener noreferrer" aria-label="本段来源 ${index + 1}：${esc(a.sources[index].title)}">[${index + 1}]</a>`).join('')}</p>`).join('')}</div><div class="article-tags">${a.tags.map(tag => `<span>${esc(tag)}</span>`).join('')}</div><div class="article-sources"><h3>原文与引用范围</h3>${a.sources.filter(source => /^https:\/\//.test(source.url)).map((source, i) => `<div class="article-source"><a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer"><span>[${i + 1}]</span> ${esc(source.title)} ↗</a><p>${esc(supports.get(source.url) || '本来源尚未注明支持范围。')}</p></div>`).join('')}${a.kind === 'culture' ? '<p>生活仪式和颜色配搭属于编辑设计。引用历法资料不表示来源机构认可命理对健康或吉凶的解释。</p>' : a.kind === 'tcm' ? '<p>中医科普用于了解理论和就医沟通。疗法是否适合个人，需要由合资格专业人员结合具体情况判断。</p>' : ''}</div><div class="article-related"><h3>继续了解身体照护</h3>${related.map(row => `<button data-read-article="${row.id}">${esc(row.title)} <span>→</span></button>`).join('')}</div>`;
    $('#article-body .article-evidence').insertAdjacentHTML('afterend',renderApplication(a));
    $('#article-dialog').setAttribute('aria-labelledby', 'article-title');
  }
  function card(article) {
    const saved = memory.bookmarks.includes(article.id);
    return `<article class="knowledge-card ${article.kind}"><div class="knowledge-card-top"><span>${esc(article.category)}</span></div><button class="knowledge-card-read" data-read-article="${article.id}"><h2>${esc(article.title)}</h2><p>${esc(article.summary)}</p><span class="knowledge-card-foot"><span>${esc(evidenceLabel(article))} · 查看原文</span><i>阅读全文 →</i></span></button><button class="bookmark-control" data-bookmark="${article.id}" aria-label="${saved ? '取消收藏' : '收藏'}：${esc(article.title)}" aria-pressed="${saved}" title="${saved ? '取消收藏' : '收藏这条'}"><svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 4h12v17l-6-4-6 4V4Z"/></svg></button></article>`;
  }
  function render() {
    if (!api) return;
    const enabled = cultureVisible();
    const visible = articles.filter(a => (kind === 'saved' ? memory.bookmarks.includes(a.id) : a.kind === kind) && (a.kind !== 'culture' || enabled));
    const categories = ['全部', ...new Set(visible.map(a => a.category))];
    if (!categories.includes(category)) category = '全部';
    $$('[data-library-kind]').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.libraryKind === kind)));
    $('#library-stat-tcm').textContent = articles.filter(a => a.kind === 'tcm').length;
    $('#library-stat-health').textContent = articles.filter(a => a.kind === 'health').length;
    $('#library-stat-culture').textContent = articles.filter(a => a.kind === 'culture').length;
    $('#bookmark-count').textContent = memory.bookmarks.length;
    $('#library-guidance').className = 'library-guidance ' + kind;
    $('#library-guidance').innerHTML = kind === 'culture' ? enabled ? '<span>✧</span><p>这里解释传统历法与五行符号，再给日常一点自选的仪式感。出生时刻未知，未排完整八字。</p><button class="small-link" data-library-disable>关闭文化栏目</button>' : '<span>✧</span><div><strong>东方趣味由你选择开启</strong><p>看干支、生肖与五行常识，不用它判断身体状况或吉凶。</p></div><button class="button outline" data-library-enable>开启并浏览 →</button>' : kind === 'tcm' ? '<span>◎</span><p>了解传统中医的解释，也看疗法的证据与风险。每篇标明资料性质和原文支持范围，不按症状、生日或五行自动开方。</p>' : kind === 'saved' ? `<span>❧</span><p>${storageWarning ? '本机保存可能不可用，请导出数据。' : '把想再读的内容放在这里。关闭文化栏目时，文化收藏会保留并暂时隐藏。'}</p>` : '<span>❧</span><p>每条都可查看来源核对日期、资料性质和原文支持范围。</p>';
    $('#library-categories').innerHTML = categories.map(name => `<button data-library-category="${esc(name)}" aria-pressed="${name === category}">${esc(name)}</button>`).join('');
    $('#library-categories').hidden = kind === 'culture' && !enabled;
    const result = model.filterArticles(articles, { kind, query, category, bookmarks: memory.bookmarks, cultureEnabled: enabled });
    const shown = result.slice(0, visibleCount);
    $('#library-result-count').textContent = `${result.length} 条${query ? '匹配的' : ''}${kind === 'culture' ? '文化问答' : kind === 'tcm' ? '中医知识' : kind === 'saved' ? '收藏内容' : '照护知识'}${result.length > shown.length ? ` · 已显示 ${shown.length} 条` : ''}`;
    $('#library-reset').hidden = !query && category === '全部';
    $('#library-results').innerHTML = kind === 'culture' && !enabled ? '' : result.length ? shown.map(card).join('') : `<div class="library-empty"><span>◌</span><h2>${kind === 'saved' && !query ? '喜欢的内容，随时可以收好。' : '暂时没有找到这类内容。'}</h2><p>${kind === 'saved' && !query ? '点击文章旁的收藏按钮，就能在这里再读一次。' : '试试“痛经”“洗澡”“月相”这样的短词，或清除筛选。'}</p></div>`;
    $('#library-load-more').hidden = shown.length >= result.length;
    $('#library-more-button').textContent = `再看 ${Math.min(8, result.length - shown.length)} 条 →`;
    $('#ritual-workbench').hidden = kind !== 'culture' || !enabled;
    if (kind === 'culture' && enabled) renderRitual();
    if ($('#article-dialog').open && articleById.get(openArticleId)?.kind === 'culture' && !enabled) $('#article-dialog').close();
    renderDaily();
    renderPlanBridge();
  }
  function renderDaily() {
    const c = context();
    const linked = Array.isArray(c.adviceArticleIds) ? c.adviceArticleIds.map(id => articleById.get(id)).filter(Boolean) : [];
    const healthRows = linked.filter(row => row.kind === 'health').slice(0, 2);
    const tcmRow = linked.find(row => row.kind === 'tcm');
    const rows = linked.length ? [...healthRows, ...(tcmRow ? [tcmRow] : [])] : model.recommendedIds(c).map(id => articleById.get(id)).filter(Boolean);
    $('#daily-reading-context').textContent = linked.length ? '这些原文对应上方综合建议，想多了解时再展开阅读。' : '先按实际感受填写，再查看对应的照护依据。';
    $('#daily-reading-list').innerHTML = rows.map(a => `<button class="daily-reading-card" data-read-article="${a.id}"><span>${a.kind === 'tcm' ? '中医常识' : '身体照护'} · ${esc(a.category)}</span><strong>${esc(a.title)}</strong><p>${esc(a.summary)}</p><i>打开读一读 ↗</i></button>`).join('');
  }
  function renderRitual() {
    const c = context(); const date = c.date;
    const [year, month, day] = date.split('-').map(Number);
    let stem = '', ganzhi = '', automatic = '木';
    try { const lunar = window.Solar.fromYmd(year, month, day).getLunar(); stem = lunar.getDayGan(); ganzhi = lunar.getDayInGanZhi(); automatic = elementMap[stem]; } catch (_) {}
    let personalSymbols = '';
    try {
      if (c.birthConfirmed && window.MoonCore.isISODate(c.birthday)) {
        const birth = window.Solar.fromYmd(...c.birthday.split('-').map(Number)).getLunar();
        const yearPillar = birth.getYearInGanZhiByLiChun();
        const birthElement = elementMap[yearPillar[0]];
        const generates = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
        const restricts = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };
        const relation = birthElement === automatic ? `同属${automatic}` : generates[birthElement] === automatic ? `${birthElement}生${automatic}` : generates[automatic] === birthElement ? `${automatic}生${birthElement}` : restricts[birthElement] === automatic ? `${birthElement}克${automatic}` : `${automatic}克${birthElement}`;
        personalSymbols = `<div class="ritual-comparison"><div><small>你的出生年符号</small><strong>${esc(yearPillar)} · ${esc(birth.getYearShengXiaoByLiChun())}</strong><span>年干${esc(yearPillar[0])}属${birthElement}</span></div><div><small>这一日的符号</small><strong>${esc(ganzhi)} · ${automatic}</strong><span>日干${esc(stem)}属${automatic}</span></div><p>年干与当日日干的传统对应：${relation}。只比较两枚符号，不是完整八字，也不表示吉凶或健康变化。生肖年界按立春。</p></div>`;
      }
    } catch (_) {}
    const selectedElement = memory.elementsByDate[date] || automatic;
    const idea = rituals[selectedElement];
    const plan = memory.plans[date];
    $('#ritual-date').textContent = `${month} 月 ${day} 日`;
    $('#ritual-prev').disabled = date <= '1900-01-01'; $('#ritual-next').disabled = date >= '2100-12-31';
    $('#ritual-elements').innerHTML = `<button data-ritual-element="auto" aria-pressed="${!memory.elementsByDate[date]}">跟随当日 · ${automatic}</button>` + elements.map(element => `<button data-ritual-element="${element}" aria-pressed="${memory.elementsByDate[date] === element}"><span>${element}</span>${symbols[element]}</button>`).join('');
    const bodyNote = c.info?.phase === 'period' ? `${c.info.predicted ? '预计经期' : '按记录的经期参考'}第 ${c.info.day} 天：先看当天疼痛、精力和意愿；不舒服的活动可减量或暂停。` : c.info?.phase === 'late' ? '还没有记录新的经期开始日。日期只作参考，先观察和记录身体的实际变化。' : '身体的安排仍由当天感受与个人偏好决定，日干不会改变照护建议。';
    $('#ritual-content').innerHTML = `<div class="ritual-composition" style="--ritual-color:${idea.hex}"><div class="ritual-symbol"><strong>${selectedElement}</strong><span>${symbols[selectedElement]}</span><i style="background:${idea.hex}"></i><small>${idea.color} · 自选配色</small></div><div class="ritual-copy"><div class="ritual-calendar-label">${esc(ganzhi)}日 · 日干${esc(stem)}属${automatic}${memory.elementsByDate[date] ? ' / 当前为自选元素' : ' / 当前跟随日历'}</div><h3>${idea.title}</h3><p>给这一天留一个小小的“宜”，不需要完成，也可以随时取消。</p><div class="ritual-options">${idea.options.map((option, i) => `<button data-ritual-option="${i}" data-element="${selectedElement}" aria-pressed="${plan?.element === selectedElement && plan?.option === i}">${plan?.element === selectedElement && plan?.option === i ? '✓ ' : '＋ '}${option}</button>`).join('')}</div><p class="ritual-release">${idea.release}</p></div></div>${personalSymbols}<div class="ritual-health-note"><span>身体照护依据</span><p>${esc(bodyNote)}</p><button class="small-link" data-read-article="health-first-day">看看经期安排的知识 →</button></div><div class="ritual-save-line"><p>${plan ? '已为这一天选择：' + esc(rituals[plan.element].options[plan.option]) : '还没有安排。留白也很好。'}${storageWarning ? ' · 本机保存不可用' : ''}</p><button class="small-link" data-ritual-clear>这天不安排仪式</button></div><p class="ritual-boundary">五行属性是传统符号；上面的颜色、文案与活动为编辑配搭，不是八字推断、古籍宜忌或治疗方法。这里不生成凶日、冲煞警报或必做任务。</p>`;
  }
  function showCulture() { setKind('culture'); if (location.hash === '#knowledge') { $('#ritual-workbench').scrollIntoView({ behavior: 'smooth', block: 'start' }); } else location.hash = 'knowledge'; }
  function init(options) {
    api = options;
    $('#library-search').addEventListener('input', e => { query = e.target.value; visibleCount = 8; render(); });
    $('#library-reset').addEventListener('click', () => { query = ''; category = '全部'; visibleCount = 8; $('#library-search').value = ''; render(); });
    $('#library-more-button').addEventListener('click', () => { visibleCount += 8; render(); });
    $('#ritual-prev').addEventListener('click', () => api.changeDay(window.MoonCore.addDays(context().date, -1)));
    $('#ritual-next').addEventListener('click', () => api.changeDay(window.MoonCore.addDays(context().date, 1)));
    document.addEventListener('click', e => {
      const tab = e.target.closest('[data-library-kind]'); if (tab) setKind(tab.dataset.libraryKind);
      const filter = e.target.closest('[data-library-category]'); if (filter) { category = filter.dataset.libraryCategory; visibleCount = 8; render(); }
      const read = e.target.closest('[data-read-article]'); if (read) readArticle(read.dataset.readArticle);
      if (e.target.closest('[data-show-advice]')) { if ($('#article-dialog').open) $('#article-dialog').close(); api.openAdvice(); }
      const bookmark = e.target.closest('[data-bookmark]'); if (bookmark && articleById.has(bookmark.dataset.bookmark)) { const id = bookmark.dataset.bookmark; memory.bookmarks = memory.bookmarks.includes(id) ? memory.bookmarks.filter(key => key !== id) : [...memory.bookmarks, id]; save(); render(); if ($('#article-dialog').open) renderArticle(); }
      if (e.target.closest('[data-library-enable]')) api.setCulture(true);
      if (e.target.closest('[data-library-disable]')) api.setCulture(false);
      if (e.target.closest('[data-open-culture-library]')) showCulture();
      const choice = e.target.closest('[data-ritual-element]'); if (choice) { const value = choice.dataset.ritualElement; if (value === 'auto') delete memory.elementsByDate[context().date]; else if (elements.includes(value)) memory.elementsByDate[context().date] = value; save(); renderRitual(); api.refreshAdvice(); }
      const option = e.target.closest('[data-ritual-option]'); if (option && elements.includes(option.dataset.element)) { memory.plans[context().date] = { element: option.dataset.element, option: Number(option.dataset.ritualOption) }; save('已放进这一天的照护方案，可随时取消。'); renderRitual(); api.refreshAdvice(); }
      if (e.target.closest('[data-ritual-clear]')) { delete memory.plans[context().date]; save('这一天的仪式安排已留白。'); renderRitual(); api.refreshAdvice(); }
    });
    $('#article-dialog').addEventListener('close', () => {
      openArticleId = null;
      const original = articleReturnFocus?.element;
      const replacement = $$('[data-read-article]').find(el => el.dataset.readArticle === articleReturnFocus?.articleId && el.getClientRects().length);
      const fallback = $('#library-search').getClientRects().length ? $('#library-search') : null;
      const target = original?.isConnected && original.getClientRects().length ? original : replacement || fallback;
      target?.focus({ preventScroll: true });
      articleReturnFocus = null;
    });
    render();
  }
  function clear() { localStorage.removeItem(STORAGE_KEY); memory = { bookmarks: [], elementsByDate: {}, plans: {} }; render(); }
  function getRitualSelection(date) { const plan=memory.plans[date]; return {element:plan?.element || memory.elementsByDate[date] || null,option:plan ? rituals[plan.element].options[plan.option] : null}; }
  window.MoonLibrary = { init, refresh: render, exportState: () => structuredClone(memory), clear, showCulture, getRitualSelection };
})();
