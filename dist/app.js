'use strict';
(() => {
  const $ = (s, root = document) => root.querySelector(s);
  const $$ = (s, root = document) => [...root.querySelectorAll(s)];
  const C = window.MoonCore;
  const P = window.MoonPeriods;
  const BACKUP_KEY = 'yuejian.personal.pre-periods-v2';
  const STORAGE_KEY = 'yuejian.personal.v1';
  const ACTIVITY = { read: ['book', '读几页熟悉的书', '只读想读的部分，不需要读完。'], walk: ['leaf', '散一小会儿步', '如果身体舒服，可以慢慢走；不舒服就停下。'], music: ['music', '听一首喜欢的歌', '音量小一点，选择让自己舒服的声音。'], warm: ['cup', '留一点舒服的温度', '按喜好喝点水，或隔布温热敷，注意避免烫伤。'], rest: ['moon', '给休息留一点位置', '找一个舒服的位置，暂时放下要赶上的事情。'], shower: ['drop', '洗个舒服的温水澡', '按自己的习惯与感觉来，不用赶时间。'] };
  const iconPaths = { sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>', moon: '<path d="M20.7 14.5A9 9 0 0 1 9.5 3.3 9 9 0 1 0 20.7 14.5Z"/>', calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18m-14 4h2m4 0h2m-8 3h2"/>', book: '<path d="M12 5c-3-2-6-2-10-1v15c4-1 7-1 10 1 3-2 6-2 10-1V4c-4-1-7-1-10 1Zm0 0v15M5 8h3m-3 4h3m8-4h3m-3 4h3"/>', flower: '<path d="M12 12c-8 1-9-5-5-6 3-1 5 3 5 6Zm0 0c-5-6-1-10 2-7 2 2 0 6-2 7Zm0 0c1-8 7-9 8-5 1 3-3 5-8 5Zm0 0c7-1 9 5 5 6-3 1-5-2-5-6Zm0 0c5 6 0 10-3 7-2-2 1-6 3-7Zm0 0c-1 8-7 7-8 4-1-3 4-4 8-4Z"/>', leaf: '<path d="M19 3C7 2 2 8 5 15c3 6 13 3 14-12ZM5 20c1-6 4-9 9-12"/>', lock: '<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2"/>', drop: '<path d="M12 3C9 8 5 11 5 15a7 7 0 0 0 14 0c0-4-4-7-7-12Z"/>', cycle: '<path d="M20 10a8 8 0 0 0-14-4L3 9m0-6v6h6m-5 5a8 8 0 0 0 14 4l3-3m0 6v-6h-6"/>', plus: '<path d="M12 5v14M5 12h14"/>', cup: '<path d="M4 9h12v7a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4V9Zm12 1h2a3 3 0 0 1 0 6h-2M7 3v3m4-3v3"/>', music: '<path d="M10 17V5l10-2v12M10 9l10-2"/><ellipse cx="7" cy="18" rx="3" ry="2"/><ellipse cx="17" cy="16" rx="3" ry="2"/>', download: '<path d="M12 3v12m-4-4 4 4 4-4M4 16v5h16v-5"/>' };
  const icon = name => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${iconPaths[name] || iconPaths.leaf}</svg>`;
  $$('[data-icon]').forEach(el => { el.outerHTML = icon(el.dataset.icon); });
  const escape = x => String(x ?? '').replace(/[&<>"']/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
  const DEFAULT = { version: 2, periods: [], starts: [], periodRevision: 0, cycleLength: 28, periodLength: 5, periodConfirmed: false, birthday: '', birthConfirmed: false, city: '', partner: { nickname: '', support: 'ask', likes: '', avoid: '', consent: false }, activities: [], culture: false, quiet: false, entries: {}, tasks: {} };
  let storageWarning = false, dataReadError = false, protectedRaw = null;
  function decodeState(raw) {
    if (!raw) return structuredClone(DEFAULT);
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new TypeError('记录格式无法读取');
    const result = structuredClone(DEFAULT);
    result.periods = P.migratePeriods(data, C.todayISO());
    result.starts = result.periods.map(record => record.start);
    result.periodRevision = Number.isSafeInteger(data.periodRevision) && data.periodRevision >= 0 ? data.periodRevision : 0;
    result.cycleLength = Number.isInteger(data.cycleLength) && data.cycleLength >= 15 && data.cycleLength <= 90 ? data.cycleLength : 28;
    result.periodLength = Number.isInteger(data.periodLength) && data.periodLength >= 1 && data.periodLength <= 14 ? data.periodLength : 5;
    result.periodConfirmed = data.periodConfirmed === true;
    result.birthday = C.isISODate(data.birthday) ? data.birthday : '';
    result.birthConfirmed = data.birthConfirmed === true && !!result.birthday;
    result.city = typeof data.city === 'string' ? data.city.slice(0, 40) : '';
    if (data.partner && typeof data.partner === 'object') {
      result.partner = {
        nickname: typeof data.partner.nickname === 'string' ? data.partner.nickname.trim().slice(0, 40) : '',
        support: ['ask', 'alone', 'quiet', 'help'].includes(data.partner.support) ? data.partner.support : 'ask',
        likes: typeof data.partner.likes === 'string' ? data.partner.likes.trim().slice(0, 240) : '',
        avoid: typeof data.partner.avoid === 'string' ? data.partner.avoid.trim().slice(0, 240) : '',
        consent: data.partner.consent === true
      };
    }
    result.activities = Array.isArray(data.activities) ? data.activities.filter(k => Object.hasOwn(ACTIVITY, k)) : [];
    result.culture = data.culture === true; result.quiet = data.quiet === true;
    if (data.entries && typeof data.entries === 'object' && !Array.isArray(data.entries)) Object.entries(data.entries).forEach(([date, e]) => {
      if (!C.isISODate(date) || date > C.todayISO() || !e || typeof e !== 'object') return;
      result.entries[date] = { mood: ['平静', '紧绷', '很难受'].includes(e.mood) ? e.mood : '', pain: [0, 2, 5, 8, 10].includes(e.pain) ? e.pain : null, energy: ['low', 'medium', 'high'].includes(e.energy) ? e.energy : '', support: ['独处', '安静陪伴', '具体帮助'].includes(e.support) ? e.support : '', note: typeof e.note === 'string' ? e.note.slice(0, 500) : '' };
    });
    if (data.tasks && typeof data.tasks === 'object' && !Array.isArray(data.tasks)) Object.entries(data.tasks).forEach(([d, tasks]) => { if (C.isISODate(d) && Array.isArray(tasks)) result.tasks[d] = tasks.filter(k => Object.hasOwn(ACTIVITY, k)); });
    return result;
  }
  function loadState() {
    let raw = null;
    try { raw = localStorage.getItem(STORAGE_KEY); const result = decodeState(raw); storageWarning = false; dataReadError = false; protectedRaw = null; return result; }
    catch (_) { storageWarning = true; dataReadError = true; protectedRaw = raw; return structuredClone(DEFAULT); }
  }
  let state = loadState();
  let today = C.todayISO(), selected = today, displayedMonth = today.slice(0, 7);
  let mood = '', support = '', groundStep = 0, toastTimer, periodUndo = null;
  let periodEditor = { id: null, token: '' };
  const energyLabels = { low: '想慢一点', medium: '还可以', high: '精力充足' };
  const supportLabels = { ask: '每次先问她', alone: '独处，不打扰', quiet: '安静陪伴', help: '具体帮助' };
  function toast(message) { const el = $('#toast'); el.textContent = message; el.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), 4200); }
  function periodToken(profile) { return `${profile.periodRevision}:${JSON.stringify(profile.periods)}`; }
  function readLatest() {
    if (dataReadError) throw new Error('现有记录未能读取。请先导出原始数据，或到数据设置清空后重新开始。');
    const raw = localStorage.getItem(STORAGE_KEY);
    try { return { raw, profile: decodeState(raw) }; }
    catch (_) { dataReadError = true; protectedRaw = raw; storageWarning = true; renderDataNotice(); throw new Error('现有记录未能读取，原始数据已保留。请先导出数据。'); }
  }
  function writePersonal(next, previousRaw) {
    // Preserve the original version before the first canonical write. A guessed
    // end is never written during migration; old notes keep their date keys.
    if (previousRaw) {
      const previous = JSON.parse(previousRaw);
      if (!Object.hasOwn(previous, 'periods') && localStorage.getItem(BACKUP_KEY) === null) localStorage.setItem(BACKUP_KEY, previousRaw);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  }
  function saveChange(change, message) {
    try {
      const latest = readLatest(); const next = structuredClone(latest.profile);
      change(next);
      next.periods = P.validatePeriods(next.periods, today); next.starts = next.periods.map(record => record.start);
      writePersonal(next, latest.raw); state = next; storageWarning = false;
      if (message) toast(message); return true;
    } catch (error) { storageWarning = true; toast(dataReadError ? error.message : '未能保存，记录保持原样。请导出数据并检查浏览器存储。'); return false; }
  }
  function periodError(error) {
    const text = String(error?.message || error);
    if (/不能早于/.test(text)) return '结束日期不能早于开始日期。';
    if (/晚于/.test(text)) return '请填写已经发生的实际日期，不能晚于今天。';
    if (/start.*重复/.test(text)) return '这一天已经有一条开始记录，请编辑原记录。';
    if (/重叠/.test(text)) return '这段经期与另一条记录重叠，请核对实际起止日期。';
    if (/ongoing.*最后一条/.test(text)) return '较早的经期不能标记为“尚未结束”，请补记结束日或选择结束日不确定。';
    if (/ongoing.*一条/.test(text)) return '已有一条“尚未结束”的记录。请先更新它的结束状态。';
    if (/end|日期/.test(text)) return '请填写有效的实际开始日与结束日。';
    return text;
  }
  function commitPeriods(records, expectedToken, message, keepUndo = true) {
    try {
      const latest = readLatest();
      if (periodToken(latest.profile) !== expectedToken) { $('#period-error').textContent = '经期记录已在另一处更新。请关闭此窗口后重新打开，再核对日期。'; toast('有更新的经期记录，未覆盖。请重新打开后再修改。'); return false; }
      const before = structuredClone(latest.profile.periods);
      const next = structuredClone(latest.profile);
      next.periods = P.validatePeriods(records, today); next.starts = next.periods.map(record => record.start); next.periodRevision += 1;
      writePersonal(next, latest.raw); state = next; storageWarning = false;
      periodUndo = keepUndo ? { periods: before, token: periodToken(next) } : null;
      if (message) toast(message); return true;
    } catch (error) { $('#period-error').textContent = dataReadError ? error.message : periodError(error); toast('未能保存，经期记录保持原样。'); return false; }
  }
  function dateLabel(iso, year = false) { const [y, m, d] = iso.split('-').map(Number); return `${year ? y + ' 年 ' : ''}${m} 月 ${d} 日`; }
  function weekday(iso) { return new Intl.DateTimeFormat('zh-CN', { weekday: 'long', timeZone: 'UTC' }).format(new Date(iso + 'T12:00:00Z')); }
  function lunarOf(iso) { const [y, m, d] = iso.split('-').map(Number); return window.Solar?.fromYmd(y, m, d).getLunar(); }
  function getInfo(date = selected) { return C.getCycle(state, date, today); }
  function changeDay(iso) {
    if (!C.isISODate(iso)) return;
    selected = iso;
    renderToday(); renderCalendar(); renderCulture();
  }
  function navigate(view) {
    if (!['today', 'calendar', 'journal', 'knowledge', 'about'].includes(view)) view = 'today';
    $$('.view').forEach(el => { el.hidden = el.id !== 'view-' + view; });
    $$('.nav-item').forEach(el => { const active = el.dataset.view === view; el.classList.toggle('active', active); if (active) el.setAttribute('aria-current', 'page'); else el.removeAttribute('aria-current'); });
    $('#page-label').textContent = { today: '今日照护', calendar: '经期月历', journal: '感受记录', knowledge: '照护百科', about: '伴侣设置' }[view];
    if (view === 'journal') renderJournal();
    if (view === 'calendar') renderCalendar();
    if (view === 'knowledge') window.MoonLibrary?.refresh();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function phaseCopy(info) {
    if (info.phase === 'unknown') return '尚未填写实际开始日期';
    if (info.phase === 'before') return '早于第一条经期记录';
    if (info.forecastBlocked) return '上次仍标记为尚未结束，请先确认实际记录';
    const day = `${info.predicted ? '预计' : '按实际开始日计'}周期第 ${info.day} 天`;
    if (info.bleedingState === 'ongoing') return day + ' · 仍在经期';
    if (info.bleedingState === 'confirmed') return day + ' · 已记录出血';
    if (info.phase === 'late') return info.daysLate === 0 ? '预计今天开始，尚未记录新开始日' : `已过预计开始日 ${info.daysLate} 天，尚未记录新开始日`;
    if (info.bleedingState === 'reference') return day + (info.predicted ? ' · 经期预测' : ' · 结束日未确认，仅供参考');
    return day + (info.actualEnd ? ' · 本次已结束' : '');
  }
  function renderToday() {
    const info = getInfo();
    const current = getInfo(today);
    $('#today-label').textContent = dateLabel(today) + ' · ' + weekday(today);
    $('#selected-day-label').textContent = selected === today ? '今天 · ' + dateLabel(selected) : dateLabel(selected, true);
    $('#selected-day-note').textContent = selected > today ? '未来的参考安排' : selected < today ? '回看这一天' : weekday(selected);
    $('#back-today').hidden = selected === today;
    $('#day-prev').disabled = selected <= '1900-01-01';
    $('#day-next').disabled = selected >= '2100-12-31';
    $('#cycle-length-display').textContent = `约 ${state.cycleLength} 天`;
    const latestRecord = state.periods.at(-1);
    $('#period-fact-label').textContent = latestRecord ? '最近一次经期' : '经期参考天数';
    $('#period-length-display').textContent = latestRecord ? latestRecord.status === 'ended' ? `实际 ${P.actualDuration(latestRecord, today)} 天` : latestRecord.status === 'ongoing' ? `进行第 ${P.actualDuration(latestRecord, today)} 天` : '结束日待确认' : `约 ${state.periodLength} 天`;
    $('#edit-current-period').hidden = !latestRecord;
    $('#finish-current-period').hidden = !latestRecord || latestRecord.status === 'ended';
    $('#period-record-help').textContent = latestRecord ? latestRecord.status === 'ended' ? `${dateLabel(latestRecord.start)}至${dateLabel(latestRecord.end)}，可随时修正。` : '还不知道结束日也可以记录，确认后再补填。' : '实际日期可以提前、推迟，也可以补记与修改。';
    $('#prediction-badge').hidden = !current.nextStart;
    $('#next-period').textContent = current.nextStart ? dateLabel(current.nextStart) + (current.overdue ? '（尚未记录）' : '') : '等你填写日期';
    $('#cycle-status').innerHTML = '<span></span>' + escape(phaseCopy(info));
    let title = '从了解她开始，<br>把关心落到小事里。';
    let desc = '记录她愿意分享的实际日期，<br>准备经前、经期与经后的照护。';
    if (info.phase === 'period') { title = info.day === 1 ? '从第一天起，<br>留一点舒服的余地。' : '今天的陪伴，<br>从她的感觉开始。'; desc = '先问她需要怎样的支持，<br>再把用品、休息和事务安排好。'; }
    else if (info.phase === 'between') { title = '平常的一天，<br>也值得认真相待。'; desc = '日期不能决定她的精力和心情。<br>把分担和沟通放进日常。'; }
    else if (info.phase === 'late') { title = '允许身体，<br>有一点自己的变化。'; desc = '还没有记录新的开始日。<br>先问实际情况，预计日期可以变化。'; }
    else if (info.phase === 'before') { title = '把那一天的感受，<br>轻轻收好。'; desc = '这一天早于首条经期记录。<br>依然可以留下一份感受小记。'; }
    $('#hero-title').innerHTML = title;
    $('#hero-description').innerHTML = desc;
    $('#hero-action').innerHTML = state.starts.length ? '记录新的一次 <span>↗</span>' : '添加实际经期 <span>↗</span>';
    const hasDay = info.day !== null;
    $('#ring-kicker').textContent = hasDay ? (info.predicted ? '预计周期第' : '按记录，周期第') : '她的参考周期';
    $('#ring-value').textContent = hasDay ? info.day : state.cycleLength;
    $('#ring-unit').textContent = hasDay ? (info.phase === 'late' ? '天 · 等待新的记录' : '天 · 今天的感觉最重要') : '天 · 从容一点';
    $('#cycle-ring').setAttribute('aria-label', hasDay ? phaseCopy(info) : `参考周期${state.cycleLength}天，尚未设置开始日期`);
    $('#ring-progress').style.strokeDashoffset = hasDay && !['late', 'before', 'unknown'].includes(info.phase) ? 603 * (1 - Math.min(info.day, state.cycleLength) / state.cycleLength) : 603;
    $('#ring-ticks').innerHTML = Array.from({ length: 28 }, (_, i) => `<line class="ring-tick ${i < Math.min(state.periodLength, 28) && state.periodConfirmed ? 'period-tick' : ''}" x1="140" y1="12" x2="140" y2="18" transform="rotate(${i * 360 / 28} 140 140)"/>`).join('');
    const entry = state.entries[selected] || {};
    mood = entry.mood || ''; support = entry.support || '';
    $('#pain').value = entry.pain === null || entry.pain === undefined ? '' : entry.pain;
    $('#energy').value = entry.energy || '';
    $('#note').value = entry.note || '';
    updateChoices();
    const future = selected > today;
    $$('#checkin-form button, #checkin-form select, #checkin-form textarea').forEach(el => { el.disabled = future; });
    $('#checkin-form button[type=submit]').textContent = future ? '感受留待当天再记录' : entry.mood !== undefined ? '更新这份感受 ↗' : '收好这份感受 ↗';
    $('#save-note').textContent = future ? '可以查看未来安排，不能提前记录真实感受。' : storageWarning ? '本机保存不可用，请导出数据。' : entry.mood !== undefined ? '这一天已有记录，可修改或到小记中删除。' : '只保存在当前浏览器，可随时删除。';
    renderCare(); renderHealth(); renderCompanion();
  }
  function updateChoices() {
    $$('[data-mood]').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.mood === mood)));
    $$('[data-support]').forEach(el => el.setAttribute('aria-pressed', String(el.dataset.support === support)));
  }
  function renderCare() {
    const info = getInfo();
    const pain = $('#pain').value === '' ? null : Number($('#pain').value);
    const energy = $('#energy').value;
    let keys = info.phase === 'period' ? ['warm', 'rest', 'walk'] : ['rest', 'walk', 'read'];
    if (energy === 'low' || (pain !== null && pain >= 5)) keys = ['rest', 'warm', 'music'];
    const preferred = state.activities.filter(k => keys.includes(k)).concat(state.activities.filter(k => !keys.includes(k)));
    keys = [...new Set([...preferred.slice(0, 1), ...keys])].slice(0, 3);
    $('#care-context').textContent = pain !== null && pain >= 5 ? '按当前不适调整' : energy === 'low' ? '给低精力一点余地' : info.phase === 'period' ? `${info.predicted ? '预计' : ''}经期 · 可选照护` : '按感受选择';
    $('#care-description').textContent = selected > today ? '这是可修改的参考安排，真正的感觉留待当天再看。' : '选一件想做的小事就好，也可以什么都不选。';
    $('#let-go-copy').textContent = pain !== null && pain >= 5 ? '让疼痛更明显的活动，以及必须忍着完成一切的要求。' : '让你不舒服的安排，以及“今天必须做得很好”的要求。';
    $('#care-list').innerHTML = keys.map(key => {
      const [glyph, title, desc] = ACTIVITY[key];
      const checked = (state.tasks[selected] || []).includes(key);
      return `<button class="care-item" data-care="${key}" aria-pressed="${checked}"><span class="care-icon">${icon(glyph)}</span><span><strong>${escape(title)}</strong><p>${escape(desc)}</p></span><span class="care-checkbox" aria-hidden="true">✓</span></button>`;
    }).join('');
    window.MoonLibrary?.refresh();
  }
  function renderHealth() {
    const pain = $('#pain').value === '' ? null : Number($('#pain').value);
    const messages = [];
    if (pain !== null && pain >= 8) messages.push('疼痛已明显影响活动，建议联系妇科或医疗机构。若疼痛严重、比平时明显加重，尤其止痛处理无效时，应及时就医。');
    if (mood === '很难受') messages.push('如果焦虑或情绪不适已经影响睡眠、学习、工作或生活，可以联系心理健康专业人员。不需要先证明它与经期有关。');
    $('#health-hint').hidden = !messages.length;
    $('#health-hint').textContent = messages.join(' ');
    window.MoonLibrary?.refresh();
  }
  function renderCalendar() {
    const [year, month] = displayedMonth.split('-').map(Number);
    $('#month-label').textContent = `${year} 年 ${month} 月`;
    const first = `${displayedMonth}-01`;
    const offset = (new Date(first + 'T12:00:00Z').getUTCDay() + 6) % 7;
    const gridStartTime = Date.parse(first + 'T00:00:00Z') - offset * 86400000;
    $('#month-prev').disabled = displayedMonth === '1900-01'; $('#month-next').disabled = displayedMonth === '2100-12';
    $('#calendar-grid').innerHTML = Array.from({ length: 42 }, (_, i) => {
      const day = new Date(gridStartTime + i * 86400000).toISOString().slice(0, 10);
      if (!C.isISODate(day)) return '<span></span>';
      const info = getInfo(day);
      const start = state.periods.find(record => record.start === day);
      const end = state.periods.find(record => record.end === day);
      const marker = start ? 'actual' : info.bleedingState === 'ongoing' ? 'ongoing' : info.bleedingState === 'confirmed' ? 'confirmed' : info.bleedingState === 'reference' ? day > today ? 'predicted' : 'reference' : '';
      const classes = ['calendar-day', day.slice(0, 7) !== displayedMonth ? 'outside' : '', marker, day === today ? 'today' : '', day === selected ? 'selected' : ''].join(' ');
      let label = '';
      try { const lunar = lunarOf(day); label = lunar ? (lunar.getDay() === 1 ? lunar.getMonthInChinese() + '月' : lunar.getDayInChinese()) : ''; } catch (_) {}
      if (start && end) label = '始/止'; else if (start) label = '开始'; else if (end) label = '结束'; else if (day > today && info.phase === 'period' && info.day === 1) label = '预计';
      return `<button class="${classes}" data-date="${day}" aria-label="${dateLabel(day, true)}，${escape(phaseCopy(info))}${end ? '，实际结束日' : ''}" aria-pressed="${day === selected}"><span>${Number(day.slice(8))}</span><small>${escape(label)}</small></button>`;
    }).join('');
    $('#calendar-detail-title').textContent = dateLabel(selected);
    const info = getInfo();
    $('#calendar-detail-copy').textContent = phaseCopy(info) + '。' + (info.phase === 'unknown' ? '填写实际日期后，日历与周期位置会一起更新。' : '开始日决定周期位置，实际结束日决定出血区间。');
    const record = state.periods.find(item => item.id === info.periodId);
    $('#calendar-edit-period').hidden = !record;
    if (record) $('#calendar-edit-period').dataset.editPeriod = record.id; else delete $('#calendar-edit-period').dataset.editPeriod;
    $('#period-history').innerHTML = state.periods.length ? state.periods.slice().reverse().map(record => {
      const range = record.status === 'ended' ? `${record.start} → ${record.end}` : `${record.start} 开始`;
      const status = record.status === 'ended' ? `实际 ${P.actualDuration(record, today)} 天` : record.status === 'ongoing' ? `尚未结束 · 第 ${P.actualDuration(record, today)} 天` : '结束日不确定';
      return `<div class="period-history-row"><div><time>${escape(range)}</time><p class="muted fine">${escape(status)}</p></div><div class="history-actions"><button class="small-link" data-edit-period="${escape(record.id)}">编辑</button><button class="delete-period" data-remove-period="${escape(record.id)}" aria-label="移除${escape(record.start)}的经期记录">移除</button></div></div>`;
    }).join('') : '<p class="muted fine">还没有实际经期记录，可以先填写最近一次。</p>';
    $('#period-undo').hidden = !periodUndo;
  }
  function renderJournal() {
    const entries = Object.entries(state.entries).sort(([a], [b]) => b.localeCompare(a));
    $('#entry-count').textContent = entries.length;
    $('#journal-list').innerHTML = entries.length ? entries.map(([date, e]) => {
      const cycle = getInfo(date);
      const tags = [cycle.day !== null ? `周期第 ${cycle.day} 天` : '', e.mood, e.pain !== null ? `疼痛 ${e.pain}/10` : '', energyLabels[e.energy], e.support].filter(Boolean);
      return `<article class="journal-entry"><time datetime="${date}">${dateLabel(date)}<small class="muted fine"> · ${date.slice(0, 4)}</small></time><div><div class="entry-tags">${tags.map(t => `<span>${escape(t)}</span>`).join('')}</div><p class="entry-note">${e.note ? escape(e.note) : '这一天，留了一点空间给自己。'}</p></div><div class="entry-actions"><button class="small-link" data-edit-entry="${date}">编辑</button><button class="delete-entry" data-delete-entry="${date}" aria-label="删除${date}小记">删除</button></div></article>`;
    }).join('') : '<div class="empty-state"><span>❧</span><h3>空白，也是舒服的开始。</h3><p>想留下什么的时候，再写第一篇。</p><a class="button outline" href="#today">回到今天，记一下 →</a></div>';
  }
  function renderPreferences() {
    $('#activity-prefs').innerHTML = Object.entries(ACTIVITY).map(([key, [, title]]) => `<button data-preference="${key}" aria-pressed="${state.activities.includes(key)}">${escape(title)}</button>`).join('');
    $('#culture-toggle').checked = state.culture;
    $('#birthday-summary').textContent = state.birthday ? `${state.birthday} · ${state.birthConfirmed ? '公历已确认' : '公历待确认'} · 出生时刻未知` : '未填写生日，仍可查看当日日干符号。';
    $('#culture-entry').textContent = state.culture ? '已开启 · 查看这一日 →' : '由我选择开启 →';
  }
  const elementOf = value => ({ 甲: '木', 乙: '木', 丙: '火', 丁: '火', 戊: '土', 己: '土', 庚: '金', 辛: '金', 壬: '水', 癸: '水' })[value];
  function relation(a, b) {
    if (a === b) return `同属${a}`;
    const generates = { 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' };
    const restricts = { 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' };
    if (generates[a] === b) return `${a}生${b}`;
    if (generates[b] === a) return `${b}生${a}`;
    if (restricts[a] === b) return `${a}克${b}`;
    return `${b}克${a}`;
  }
  function renderCulture() {
    ['#home-culture', '#about-culture'].forEach(selector => {
      const target = $(selector); target.hidden = !state.culture;
      if (!state.culture) return;
      try {
        const l = lunarOf(selected);
        if (!l) { target.textContent = '历法组件暂不可用，请稍后重试。'; return; }
        const dayStem = l.getDayGan(); const dayElement = elementOf(dayStem);
        const birth = state.birthConfirmed && C.isISODate(state.birthday) ? lunarOf(state.birthday) : null;
        const year = birth?.getYearInGanZhiByLiChun();
        const yearElement = year ? elementOf(year[0]) : null;
        const cultureRelation = birth ? `年干 ${year[0]}（${yearElement}）与当日日干 ${dayStem}（${dayElement}）：传统符号关系称“${relation(yearElement, dayElement)}”。` : '确认公历生日后，可查看年干与当日日干的传统对应。';
        const inspirations = { 木: '木 · 生长：如果喜欢，可以看看窗外的树，给自己一点慢慢生长的余地。', 火: '火 · 微光：如果喜欢，可以为房间留一盏柔和的灯。', 土: '土 · 安定：如果喜欢，可以整理一个小角落，只整理到舒服为止。', 金: '金 · 留白：如果喜欢，可以暂时放下一件不紧急的小事。', 水: '水 · 流动：如果喜欢，可以听一点舒缓的声音，让念头自然经过。' };
        target.innerHTML = `<div class="culture-top"><div><p class="eyebrow">A LITTLE CULTURAL RITUAL</p><h2>今天的一点灵感</h2><p class="culture-date">${dateLabel(selected)} · 农历${escape(l.getMonthInChinese())}月${escape(l.getDayInChinese())}</p></div><button class="small-link" data-disable-culture>关闭栏目</button></div><div class="culture-cells"><div class="culture-cell"><small>这一天的干支</small><strong>${escape(l.getDayInGanZhi())}</strong><p>日干 ${dayStem} · 属${dayElement}</p></div><div class="culture-cell"><small>出生年生肖</small><strong>${birth ? escape(birth.getYearShengXiaoByLiChun()) : '待确认'}</strong><p>${birth ? '年柱 ' + escape(year) + ' · 按立春年界' : '请确认公历生日'}</p></div><div class="culture-cell"><small>本日象征元素</small><strong>${dayElement}</strong><p>取自日干，不是你的五行</p></div></div><p class="culture-footnote">${escape(cultureRelation)}“生、克”仅是传统术语，不表示今天吉凶、身体好坏或活动禁忌。</p><p class="culture-inspiration">自选生活灵感 · ${inspirations[dayElement]}</p><p class="culture-footnote">出生时刻未知，未排完整八字，不判断喜用神或五行缺失。本栏不参与经期照护建议；这里的灵感是编辑选配，不是古籍宜忌。</p><div class="companion-links"><button class="small-link" data-read-article="culture-ten-stems-elements">五行对应的出处 ↗</button><button class="small-link" data-read-article="culture-generating-overcoming-cycles">相生相克的出处 ↗</button></div>`;
      } catch (_) { target.textContent = '这一天的历法信息暂不可用。经期记录仍可正常使用。'; }
    });
  }
  function applyQuiet() { document.body.classList.toggle('quiet-mode', state.quiet); $('#quiet-toggle').setAttribute('aria-pressed', String(state.quiet)); }
  function renderPartnerForm() {
    const profile = state.partner;
    $('#partner-name').value = profile.nickname; $('#partner-support').value = profile.support;
    $('#partner-likes').value = profile.likes; $('#partner-avoid').value = profile.avoid; $('#partner-consent').checked = profile.consent;
    $('#companion-profile-note').textContent = profile.consent && profile.nickname ? `给${profile.nickname}的照护，从她愿意分享的信息开始。` : '填写她愿意分享的信息，照护建议会随实际经期更新。';
  }
  function renderCompanion() {
    if (!window.MoonCompanion) return;
    const entrySupport = support;
    const partner = state.partner.consent ? { ...state.partner, support: supportLabels[state.partner.support] } : {};
    if (entrySupport) partner.support = entrySupport;
    const guide = window.MoonCompanion.buildGuide({ date: selected, today, info: getInfo(), partner, mood, pain: $('#pain').value === '' ? null : Number($('#pain').value), energy: $('#energy').value });
    const articles = [...(window.MoonHealthArticles || []), ...(window.MoonCultureArticles || [])];
    $('#companion-guide').innerHTML = `<div class="companion-heading"><div><p class="eyebrow">CARE, WITH HER</p><span class="pill">${escape(guide.phaseLabel)}</span><h2>${escape(guide.headline)}</h2></div><a class="small-link" href="#about">调整她的偏好 →</a></div><div class="companion-actions">${guide.actions.map((action, i) => `<article class="companion-action"><span class="companion-number">0${i + 1}</span><div><h3>${escape(action.title)}</h3><p>${escape(action.body)}</p></div></article>`).join('')}</div><div class="companion-ask"><strong>可以这样问她</strong><p>“${escape(guide.ask)}”</p></div><p class="companion-avoid"><strong>先避开</strong> ${escape(guide.avoid)}</p><div class="companion-links">${guide.articleIds.map(id => `<button class="small-link" data-read-article="${escape(id)}">${escape(articles.find(article => article.id === id)?.title || '查看相关照护知识')} ↗</button>`).join('')}</div>`;
  }
  function renderDataNotice() {
    $('#data-notice').hidden = !dataReadError;
    if (dataReadError) $('#data-notice').innerHTML = '现有记录暂时无法读取，已保留原始数据并暂停保存。<button class="small-link" data-open="data-dialog">导出或管理数据 →</button>';
  }
  function renderAll() { applyQuiet(); renderToday(); renderCalendar(); renderJournal(); renderPreferences(); renderCulture(); renderPartnerForm(); renderDataNotice(); window.MoonLibrary?.refresh(); }
  function updatePeriodPreview() {
    const status = $('#period-status').value, start = $('#period-date').value, end = $('#period-end').value;
    $('#period-end-field').hidden = status !== 'ended'; $('#period-end').required = status === 'ended';
    $('#period-end').min = C.isISODate(start) ? start : '1900-01-01';
    const parts = [];
    if (C.isISODate(start)) { try { parts.push(`以开始日重算，下次预计 ${dateLabel(C.addDays(start, state.cycleLength))}`); } catch (_) { parts.push('下次预计日期超出日历范围'); } }
    if (status === 'ended' && C.isISODate(start) && C.isISODate(end) && end >= start) parts.push(`实际出血 ${C.diffDays(end, start) + 1} 天`);
    if (status === 'ongoing' && C.isISODate(start) && start <= today) parts.push(`截至今天第 ${C.diffDays(today, start) + 1} 天，结束日确认后再补记`);
    if (status === 'unknown') parts.push('只保存真实开始日，不推定结束日');
    $('#period-preview').textContent = parts.join('。') + (parts.length ? '。感受记录仍保留在原来的日期。' : '感受记录仍保留在原来的日期。');
  }
  function openPeriodEditor(id = null, finish = false) {
    if (!dataReadError) { try { state = readLatest().profile; renderAll(); } catch (_) { toast('未能读取最新记录，请先导出数据。'); return; } }
    const record = id ? state.periods.find(item => item.id === id) : null;
    if (id && !record) { toast('这条经期记录已被移除，请查看最新记录。'); return; }
    periodEditor = { id: record?.id || null, token: periodToken(state) };
    $('#period-title').textContent = record ? finish ? '补记实际结束日' : '修改这次经期' : '记录实际经期';
    $('#period-date').value = record?.start || (selected <= today ? selected : today); $('#period-date').min = '1900-01-01'; $('#period-date').max = today;
    $('#period-status').value = finish ? 'ended' : record?.status || 'unknown';
    $('#period-end').value = record?.end || (finish ? today : ''); $('#period-end').max = today;
    $('#period-error').textContent = dataReadError ? '请先导出原始数据，或到数据设置清空后重新开始。' : '';
    $('#period-delete').hidden = !record; updatePeriodPreview(); $('#period-dialog').showModal();
  }
  function openDialog(id) {
    if (id === 'period-dialog') { openPeriodEditor(); return; }
    if (id === 'settings-dialog') { $('#setting-cycle').value = state.cycleLength; $('#setting-duration').value = state.periodLength; }
    if (id === 'birthday-dialog') { $('#birth-date').value = state.birthday; $('#birth-confirm').checked = state.birthConfirmed; }
    if (id === 'ground-dialog') { groundStep = 0; renderGround(); }
    if (id === 'data-dialog') { $('#delete-confirm').checked = false; $('#delete-data').disabled = true; }
    $('#' + id)?.showModal();
  }
  function renderGround() {
    const steps = [['先找到一个舒服的位置', '可以坐着，也可以站着。\n如果愿意，感受脚底与地面的接触。'], ['看一眼身边的小东西', '选择眼前一样东西，\n慢慢看看它的颜色、形状和边缘。'], ['只选接下来的一小步', '喝一点水、休息一下，或联系信任的人。\n如果愿意，选一件现在需要的小事。']];
    $('#ground-title').textContent = steps[groundStep][0]; $('#ground-copy').innerText = steps[groundStep][1];
    $('#ground-next').textContent = groundStep === 2 ? '就到这里，已经很好' : '再给自己一点空间 →';
  }
  function downloadData() {
    let legacyBackup = null;
    try { legacyBackup = localStorage.getItem(BACKUP_KEY); } catch (_) {}
    const payload = JSON.stringify({ app: '月间', exportedAt: new Date().toISOString(), ...state, library: window.MoonLibrary?.exportState(), legacyBackup, ...(dataReadError ? { unreadableOriginal: protectedRaw, readError: true } : {}) }, null, 2);
    const blob = new Blob([payload], { type: 'application/json;charset=utf-8' }); const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `月间-私人记录-${today}.json`; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    toast('已生成导出文件，请妥善保管。');
  }
  function removePeriod(id, expectedToken = periodToken(state)) {
    try {
      const records = P.removePeriod(state.periods, id);
      if (commitPeriods(records, expectedToken, '已移除这次经期，感受记录仍在原日期。可撤销。')) { $('#period-dialog').close(); renderAll(); }
    } catch (error) { toast(periodError(error)); }
  }
  document.addEventListener('click', e => {
    const open = e.target.closest('[data-open]'); if (open) openDialog(open.dataset.open);
    const close = e.target.closest('[data-close]'); if (close) close.closest('dialog').close();
    const moodButton = e.target.closest('[data-mood]'); if (moodButton) { mood = mood === moodButton.dataset.mood ? '' : moodButton.dataset.mood; updateChoices(); renderHealth(); renderCompanion(); }
    const supportButton = e.target.closest('[data-support]'); if (supportButton) { support = support === supportButton.dataset.support ? '' : supportButton.dataset.support; updateChoices(); renderCompanion(); }
    const care = e.target.closest('[data-care]'); if (care) { if (selected > today) { toast('可以先想一想，到了当天再记录实际安排。'); return; } const key = care.dataset.care; saveChange(next => { const chosen = next.tasks[selected] || []; next.tasks[selected] = chosen.includes(key) ? chosen.filter(k => k !== key) : [...chosen, key]; }); renderCare(); }
    const pref = e.target.closest('[data-preference]'); if (pref) { const key = pref.dataset.preference; saveChange(next => { next.activities = next.activities.includes(key) ? next.activities.filter(k => k !== key) : [...next.activities, key]; }); renderPreferences(); renderCare(); }
    const date = e.target.closest('[data-date]'); if (date) changeDay(date.dataset.date);
    const editPeriod = e.target.closest('[data-edit-period]'); if (editPeriod) openPeriodEditor(editPeriod.dataset.editPeriod);
    const delPeriod = e.target.closest('[data-remove-period]'); if (delPeriod) removePeriod(delPeriod.dataset.removePeriod);
    const edit = e.target.closest('[data-edit-entry]'); if (edit) { changeDay(edit.dataset.editEntry); location.hash = 'today'; setTimeout(() => $('#checkin-form').scrollIntoView({ behavior: state.quiet ? 'instant' : 'smooth', block: 'center' }), 50); }
    const delEntry = e.target.closest('[data-delete-entry]'); if (delEntry) { saveChange(next => { delete next.entries[delEntry.dataset.deleteEntry]; }, '已删除这份感受记录。'); renderAll(); }
    if (e.target.closest('[data-disable-culture]')) { saveChange(next => { next.culture = false; }, '文化栏目已关闭。'); renderPreferences(); renderCulture(); window.MoonLibrary?.refresh(); }
  });
  $$('dialog').forEach(el => el.addEventListener('click', e => { if (e.target === el) { const r = el.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) el.close(); } }));
  $('#day-prev').addEventListener('click', () => changeDay(C.addDays(selected, -1)));
  $('#day-next').addEventListener('click', () => changeDay(C.addDays(selected, 1)));
  $('#back-today').addEventListener('click', () => changeDay(today));
  $('#pain').addEventListener('change', () => { renderCare(); renderHealth(); renderCompanion(); }); $('#energy').addEventListener('change', () => { renderCare(); renderCompanion(); });
  $('#checkin-form').addEventListener('submit', e => {
    e.preventDefault(); if (selected > today) return;
    const entry = { mood, pain: $('#pain').value === '' ? null : Number($('#pain').value), energy: $('#energy').value, support, note: $('#note').value.trim().slice(0, 500) };
    if (!entry.mood && entry.pain === null && !entry.energy && !entry.support && !entry.note) { toast('可以留下一项感受，也可以晚一点再来。'); return; }
    const saved = saveChange(next => { next.entries[selected] = entry; }, '这份感受已保存。'); renderJournal(); $('#save-note').textContent = saved ? '已保存在当前浏览器，可以随时修改。' : '保存未成功，请导出数据。';
  });
  $('#period-form').addEventListener('submit', e => {
    e.preventDefault(); const start = $('#period-date').value, status = $('#period-status').value, end = status === 'ended' ? $('#period-end').value : null;
    $('#period-error').textContent = '';
    if (!C.isISODate(start) || start > today) { $('#period-error').textContent = '请选择实际开始日，不能晚于今天。'; return; }
    if (status === 'ended' && (!C.isISODate(end) || end > today || end < start)) { $('#period-error').textContent = '请填写实际最后出血日，不能早于开始日或晚于今天。'; return; }
    try {
      const candidate = { id: periodEditor.id || (window.crypto?.randomUUID?.() || `period-${Date.now()}-${Math.random().toString(36).slice(2)}`), start, end, status };
      const records = P.upsertPeriod(state.periods, candidate, today);
      if (!commitPeriods(records, periodEditor.token, '经期已更新，月历与周期位置已对齐。')) return;
      selected = start; displayedMonth = start.slice(0, 7); $('#period-dialog').close(); renderAll();
    } catch (error) { $('#period-error').textContent = periodError(error); }
  });
  ['#period-date', '#period-status', '#period-end'].forEach(selector => $(selector).addEventListener('change', updatePeriodPreview));
  $('#edit-current-period').addEventListener('click', () => { const record = state.periods.at(-1); if (record) openPeriodEditor(record.id); });
  $('#finish-current-period').addEventListener('click', () => { const record = state.periods.at(-1); if (record) openPeriodEditor(record.id, true); });
  $('#period-delete').addEventListener('click', () => { if (periodEditor.id) removePeriod(periodEditor.id, periodEditor.token); });
  $('#period-undo').addEventListener('click', () => { if (periodUndo && commitPeriods(periodUndo.periods, periodUndo.token, '已撤销上次经期修改，感受记录保持原日期。', false)) renderAll(); });
  $('#partner-form').addEventListener('submit', e => {
    e.preventDefault(); const partner = { nickname: $('#partner-name').value.trim().slice(0, 40), support: ['ask', 'alone', 'quiet', 'help'].includes($('#partner-support').value) ? $('#partner-support').value : 'ask', likes: $('#partner-likes').value.trim().slice(0, 240), avoid: $('#partner-avoid').value.trim().slice(0, 240), consent: $('#partner-consent').checked };
    if (saveChange(next => { next.partner = partner; }, '伴侣偏好已保存，可随时修改。')) { renderPartnerForm(); renderCompanion(); }
  });
  $('#settings-form').addEventListener('submit', e => { e.preventDefault(); const cycle = Number($('#setting-cycle').value), duration = Number($('#setting-duration').value); if (!Number.isInteger(cycle) || cycle < 15 || cycle > 90 || !Number.isInteger(duration) || duration < 1 || duration > 14) return; if (saveChange(next => { next.cycleLength = cycle; next.periodLength = duration; next.periodConfirmed = true; }, '已更新周期参考，实际经期起止日保持不变。')) { $('#settings-dialog').close(); renderAll(); } });
  $('#birthday-form').addEventListener('submit', e => { e.preventDefault(); const date = $('#birth-date').value; if (date && !C.isISODate(date)) return; if (saveChange(next => { next.birthday = date; next.birthConfirmed = $('#birth-confirm').checked && !!date; }, '生日设置已保存。')) { $('#birthday-dialog').close(); renderPreferences(); renderCulture(); window.MoonLibrary?.refresh(); } });
  function shiftMonth(n) { const [y, m] = displayedMonth.split('-').map(Number); const d = new Date(Date.UTC(y, m - 1 + n, 1)); displayedMonth = d.toISOString().slice(0, 7); renderCalendar(); }
  $('#month-prev').addEventListener('click', () => shiftMonth(-1)); $('#month-next').addEventListener('click', () => shiftMonth(1));
  $('#month-today').addEventListener('click', () => { displayedMonth = today.slice(0, 7); changeDay(today); });
  $('#calendar-see-day').addEventListener('click', () => { location.hash = 'today'; });
  $('#culture-toggle').addEventListener('change', e => { const enabled = e.target.checked; saveChange(next => { next.culture = enabled; if (enabled) next.quiet = false; }); applyQuiet(); renderPreferences(); renderCulture(); window.MoonLibrary?.refresh(); });
  $('#culture-entry').addEventListener('click', () => { saveChange(next => { next.culture = true; next.quiet = false; }); applyQuiet(); renderPreferences(); renderCulture(); window.MoonLibrary?.refresh(); $('#home-culture').scrollIntoView({ behavior: 'smooth', block: 'center' }); });
  $('#quiet-toggle').addEventListener('click', () => { const enabled = !state.quiet; saveChange(next => { next.quiet = enabled; }, enabled ? '安静模式已开启，文化栏目和装饰已收起。' : '已回到日常模式。'); applyQuiet(); window.MoonLibrary?.refresh(); });
  $('#ground-next').addEventListener('click', () => { if (groundStep === 2) $('#ground-dialog').close(); else { groundStep++; renderGround(); } });
  $('#export-data').addEventListener('click', downloadData); $('#export-journal').addEventListener('click', downloadData);
  $('#delete-confirm').addEventListener('change', e => { $('#delete-data').disabled = !e.target.checked; });
  $('#delete-data').addEventListener('click', () => {
    if (!$('#delete-confirm').checked) return;
    try { localStorage.removeItem(STORAGE_KEY); localStorage.removeItem(BACKUP_KEY); window.MoonLibrary?.clear(); } catch (_) { toast('未能清空浏览器存储，请检查浏览器设置。'); return; }
    state = structuredClone(DEFAULT); storageWarning = false; dataReadError = false; protectedRaw = null; periodUndo = null; selected = today; displayedMonth = today.slice(0, 7);
    $('#data-dialog').close(); renderAll(); toast('全部记录、生日、偏好和迁移备份已清空。');
  });
  window.addEventListener('storage', e => {
    if (e.key !== STORAGE_KEY && e.key !== null) return;
    const editing = $('#period-dialog').open;
    state = loadState(); periodUndo = null; renderAll();
    if (editing) $('#period-error').textContent = '记录已在另一个页面更新。请关闭此窗口后重新打开，再核对日期。';
    toast(dataReadError ? '另一页面的记录未能读取，原始数据已保留。' : '已同步此浏览器另一页面的最新记录。');
  });
  window.addEventListener('hashchange', () => navigate(location.hash.slice(1)));
  // Refresh the visible date when a tab resumes on a new Shanghai calendar day.
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { const now = C.todayISO(); if (now !== today) { const wasToday = selected === today; today = now; if (wasToday) selected = now; renderAll(); } } });
  window.MoonLibrary?.init({
    getContext: () => ({ date: selected, info: getInfo(), mood, pain: $('#pain').value === '' ? null : Number($('#pain').value), energy: $('#energy').value, culture: state.culture, quiet: state.quiet, birthday: state.birthday, birthConfirmed: state.birthConfirmed }),
    setCulture: enabled => { saveChange(next => { next.culture = enabled; if (enabled) next.quiet = false; }); renderAll(); },
    changeDay,
    notify: toast
  });
  renderAll(); navigate(location.hash.slice(1));
  if (storageWarning) setTimeout(() => toast('未能读取本机记录。当前内容可能未保存，请检查浏览器或导出数据。'), 500);
})();
