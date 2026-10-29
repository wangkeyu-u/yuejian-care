const fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
const KEY='yuejian.personal.v1',today='2026-10-28',root=path.resolve(__dirname,'../public');
const fixture=()=>({version:2,periods:[{id:'p',start:'2026-10-20',end:'2026-10-24',status:'ended'}],cycleLength:28,periodLength:5,culture:true,entries:{'2026-10-25':{pain:2,note:'fixed-date-note'}}});
function app({data=fixture(),fetchImpl=async()=>{throw Error('network disabled in test')},extra={},session={},hash='calendar',at=today+'T04:00:00Z',onInterval=null}={}){
 const dom=new JSDOM(fs.readFileSync(path.join(root,'index.html'),'utf8'),{url:'https://yuejian.test/#'+hash,runScripts:'outside-only'}),w=dom.window;
 let instant=at;const RealDate=Date;w.Date=class extends RealDate{constructor(...args){super(...(args.length?args:[instant]));}static now(){return new RealDate(instant).getTime();}};
 if(onInterval)w.setInterval=(callback,ms)=>{onInterval(callback,ms);return 0;};
 w.structuredClone=structuredClone;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.AbortController=AbortController;w.fetch=fetchImpl;w.crypto.randomUUID=()=> 'synthetic-'+Math.random().toString(36).slice(2);
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
 if(data!==null)w.localStorage.setItem(KEY,typeof data==='string'?data:JSON.stringify(data));for(const [k,v]of Object.entries(extra))w.localStorage.setItem(k,typeof v==='string'?v:JSON.stringify(v));for(const [k,v]of Object.entries(session))w.sessionStorage.setItem(k,v);
 for(const script of w.document.querySelectorAll('script[src]'))w.eval(fs.readFileSync(path.join(root,script.getAttribute('src').split('?')[0]),'utf8'));
 return {dom,w,$:s=>w.document.querySelector(s),raw:()=>w.localStorage.getItem(KEY),advance:value=>{instant=value;},close:()=>w.close()};
}
const change=(a,s,v)=>{a.$(s).value=v;a.$(s).dispatchEvent(new a.w.Event('input',{bubbles:true}));a.$(s).dispatchEvent(new a.w.Event('change',{bubbles:true}));};
const submit=(a,s)=>a.$(s).dispatchEvent(new a.w.Event('submit',{bubbles:true,cancelable:true}));
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const action=()=>({when:'今天准备晚饭前',task:'先问她想吃什么',how:'问一句：今天想吃米饭还是面？再确认忌口。',adjust:'她不想决定时，先提供两个可拒绝的选项。'});
const food=()=>({title:'合成三餐示例',basis:'仅用于界面测试，不是真实模型输出。',caution:'先确认过敏、忌口和医嘱，再决定是否采用。',meals:['早餐','午餐','晚餐'].map(slot=>({slot,foods:slot==='早餐'?'燕麦、酸奶和水果':slot==='午餐'?'米饭、豆类和蔬菜':'面食、鸡蛋和蔬菜',swap:'不吃鸡蛋时，可在确认豆类不过敏后换成豆腐，搭配米饭和青菜。',prepare:'先确认这些食材她愿意吃，再购买米饭、鸡蛋和青菜；按平时做法煮熟后分装。'})),actions:[action()],articleIds:['nutrition-meal-pattern']});
const analysis=()=>({summary:'仅用于测试的合成分析',uncertainty:'这是测试响应。',food:food(),sections:[['culture','culture-stem-branch'],['tcm','tcm-pain-language'],['western','health-cycle-day-one'],['psychology','health-sleep']].map(([kind,id])=>({kind,title:kind+' 测试分析',body:'根据当天已存资料整理。',actions:[action()],articleIds:[id]}))});
// Synthetic provenance for existing relay fixtures: validates structure, not medical quality.
function withGrounds(value){
 if(!value?.sections&&!value?.reply||value.grounds)return value;
 const catalog=require('../public/catalog.js').articles,grounds=[];
 const add=(targets,ids=[])=>{const a=catalog.find(x=>ids.includes(x.id));grounds.push({targets,recordIds:[],citations:a?[{articleId:a.id,quote:a.body[0].slice(0,70)}]:[],reason:'合成测试：验证引用可对照，不代表真实医学判断。',limit:'这只是测试样本，不能作为个人照护结论。'});};
 if(value.reply){add(['reply',...value.actions.map((_,i)=>'action.'+(i+1))],value.articleIds);}else{
 const sections=Array.isArray(value.sections)?value.sections:Object.values(value.sections);
 add(['summary'],sections.find(s=>s.kind==='western')?.articleIds);
 for(const s of sections)add([s.kind,...s.actions.map((_,i)=>s.kind+'.action.'+(i+1))],s.articleIds);
 if(value.food)add(['food',...value.food.meals.map(m=>'food.'+m.slot),...value.food.actions.map((_,i)=>'food.action.'+(i+1))],value.food.articleIds);
 }
 return {...value,grounds};
}
function mockAI(log=[]){return async(url,options)=>{const p=JSON.parse(options.body);log.push({url,p,options});return {ok:true,json:async()=>({...p.mode==='analysis'?{analysis:analysis()}:{reply:'针对这一天的回答',actions:[action()],articleIds:['health-sleep'],uncertainty:'资料有限。'},signature:p.signature,model:p.model,generatedAt:today+'T04:00:00Z'})};};}
module.exports={withGrounds,KEY,today,fixture,app,change,submit,tick,analysis,action,food,mockAI};
