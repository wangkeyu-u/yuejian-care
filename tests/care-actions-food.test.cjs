const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path'),{pathToFileURL}=require('node:url');
const Care=require('../public/care-output.js'),Catalog=require('../public/catalog.js'),D=require('../public/day-context.js'),S=require('../public/state.js'),Sessions=require('../public/day-sessions.js');
const {app,change,submit,tick,analysis,action,food,mockAI,today}=require('./helpers.cjs');
const setKey=a=>{change(a,'#api-key','synthetic_only_key_1234567890');submit(a,'#api-form');};
const make=()=>{const p={...D.makeInput(S.defaults(),today),mode:'analysis',question:'',history:[],consent:true};p.signature=D.signature(p,today);return p;};
const request=p=>new Request('https://care.test/api/day',{method:'POST',headers:{Origin:'https://care.test','Content-Type':'application/json',Authorization:'Bearer synthetic_only_key_1234567890'},body:JSON.stringify(p)});
const wrap=v=>new Response(JSON.stringify({status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(v)}]}]}));
const api=async fetchImpl=>(await import(pathToFileURL(path.resolve(__dirname,'../worker/day-ai.mjs')))).createDayAnalyzer({DayContext:D,catalog:Catalog.articles,fetchImpl,now:()=>today});
test('new analysis requires real action fields and all three meals; legacy stored analysis stays readable',()=>{
 const current=analysis();assert.equal(Care.analysis(current).food.meals.length,3);
 for(const change of [v=>{v.sections[0].actions=[];},v=>{v.sections[0].actions=['注意休息'];},v=>{delete v.sections[0].actions[0].when;},v=>{v.sections[0].actions[0].how='保持好心情';},v=>{delete v.food;},v=>{v.food.meals[2].slot='早餐';},v=>{delete v.food.meals[0].swap;}]){const v=analysis();change(v);assert.throws(()=>Care.analysis(v));}
 const old=analysis();delete old.food;old.sections.forEach(s=>{s.actions=['历史字符串行动'];});assert.equal(Sessions.analysis(old).sections[0].actions[0],'历史字符串行动');assert.throws(()=>Care.analysis(old));
});
test('server rejects an incomplete meal plan, empty actions and invalid nutrition sources without saving',async()=>{
 for(const mutate of [v=>{v.sections[1].actions=[];},v=>{v.food.meals.pop();},v=>{v.food.articleIds=['culture-stem-branch'];},v=>{v.food.articleIds=[];}]){
  const v=analysis();mutate(v);const service=await api(async()=>wrap(v));assert.equal((await service.analyze(request(make()))).status,502);
 }
});
test('analysis and follow-up carry nutrition sources, restrictions, actionable schema and prior meal plan',async()=>{
 const p=make();p.preferences.dietary='已确认花生过敏；素食';p.signature=D.signature(p,today);let sent;const service=await api(async(url,options)=>{sent=JSON.parse(options.body);return wrap({...analysis(),memoryCandidates:[]});});
 const response=await service.analyze(request(p));assert.equal(response.status,200);assert.equal((await response.json()).analysis.food.meals[0].slot,'早餐');
 const context=JSON.parse(sent.input[0].content).day;assert.equal(context.preferences.dietary,p.preferences.dietary);assert.equal(context.articles.filter(a=>a.id.startsWith('nutrition-')).length,3);
 assert(sent.text.format.schema.properties.sections.properties.western.properties.actions.items.required.includes('adjust'));assert(sent.text.format.schema.required.includes('food'));assert.match(sent.instructions,/先确认/);assert.match(sent.instructions,/medicalPriority非空/);assert(!JSON.stringify(sent.input).includes('book-gynecology'));
 const chat={...p,mode:'chat',question:'这顿不想吃怎么办？',analysis:analysis()};const follow=await api(async(url,options)=>{sent=JSON.parse(options.body);return wrap({reply:'先让她选一个接受的替换。',actions:[action()],articleIds:['nutrition-meal-pattern'],uncertainty:'需要本人确认。'});});
 assert.equal((await follow.analyze(request(chat))).status,200);assert.equal(JSON.parse(sent.input[0].content).previousAnalysis.food.meals.length,3);
});
test('each verified book has version, official sources, scope limits and a route into relevant guides',()=>{
 assert.equal(Catalog.books.length,6);for(const b of Catalog.books){assert(b.isbn&&b.edition&&b.author&&b.publisher);assert(b.sources.every(s=>/^https:\/\//.test(s.url)));assert(b.scope&&b.read&&b.action&&b.limit);assert(b.related.length&&b.related.every(id=>Catalog.articles.some(a=>a.id===id)));assert(Catalog.filterBooks({subject:b.subjects[0]}).some(x=>x.id===b.id));}
 assert(Catalog.filterBooks({query:'9787117314046'}).some(x=>x.id==='book-dietary-guidelines'));assert(Catalog.filterBooks({scene:'疼痛与不适'}).some(x=>x.id==='book-gynecology'));assert(Catalog.relatedBooks('nutrition-meal-pattern').some(x=>x.id==='book-dietary-guidelines'));
});
test('books open first, retain bookmarks, link to a guide and then to a date without an API call',()=>{
 const a=app({hash:'knowledge'});try{assert.equal(a.$('[data-resource="books"]').getAttribute('aria-pressed'),'true');a.$('[data-read-article="book-dietary-guidelines"]').click();assert.match(a.$('#article-body').textContent,/9787117314046/);assert.match(a.$('#article-body').textContent,/未取得全书/);a.$('#article-body [data-bookmark]').click();assert.match(a.w.localStorage.getItem('yuejian.library.v1'),/book-dietary-guidelines/);a.$('#article-body [data-read-article="nutrition-meal-pattern"]').click();assert.match(a.$('#article-body').textContent,/NHS/);a.$('#article-ask-day').click();assert.equal(a.$('#day-dialog').open,true);assert.match(a.$('#day-question').value,/今天吃什么/);assert.match(a.$('#day-food').textContent,/早餐、午餐、晚餐/);}finally{a.close();}
});
test('new day output renders actions and meals, carries them to chat, and dietary changes invalidate both',async()=>{
 const log=[],a=app({fetchImpl:mockAI(log)});try{setKey(a);a.$('#open-today').click();a.$('#day-analysis-consent').checked=true;a.$('#day-generate').click();await tick();assert.equal(a.w.document.querySelectorAll('#day-analysis .care-actions li').length,4);assert.equal(a.w.document.querySelectorAll('#day-food .meal').length,3);assert.match(a.$('#day-food').textContent,/燕麦/);change(a,'#day-question','可以换成别的吗？');a.$('#day-ai-consent').checked=true;submit(a,'#day-chat-form');await tick();assert.equal(log[1].p.analysis.food.meals.length,3);assert.match(a.$('#day-messages').textContent,/具体行动/);
  a.$('#day-dialog').close();change(a,'#partner-dietary','已确认鸡蛋过敏');a.$('#partner-consent').checked=true;submit(a,'#partner-form');a.$('#open-today').click();assert.match(a.$('#day-food').textContent,/已确认鸡蛋过敏/);assert(a.$('#day-food').classList.contains('stale'));assert.equal(a.$('#day-send').disabled,false);
 }finally{a.close();}
});
test('incomplete new AI results never replace existing answers or write partial dietary data',async()=>{
 const v=analysis();delete v.food;const a=app({fetchImpl:async(url,opt)=>({ok:true,json:async()=>({analysis:v,signature:JSON.parse(opt.body).signature})})});try{setKey(a);a.$('#open-today').click();a.$('#day-analysis-consent').checked=true;a.$('#day-generate').click();await tick();assert.equal(a.w.localStorage.getItem('yuejian.days.v1'),null);assert.match(a.$('#day-request-status').textContent,/缺少今天吃什么/);}finally{a.close();}
});
test('old backups lacking food remain readable and display regeneration guidance',()=>{
 const old=analysis();delete old.food;old.sections.forEach(x=>{x.actions=['旧的行动'];});const a=app({extra:{'yuejian.days.v1':{[today]:{signature:'old-version',analysis:old,messages:[],model:'gpt-4.1-mini',generatedAt:''}}}});try{a.$('#open-today').click();assert.match(a.$('#day-food').textContent,/历史分析还没有饮食方案/);assert.match(a.$('#day-analysis').textContent,/旧的行动/);assert.equal(a.$('#day-send').disabled,false);}finally{a.close();}
});
