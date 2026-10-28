const fs=require('node:fs'),path=require('node:path'),{JSDOM}=require('jsdom');
const KEY='yuejian.personal.v1',today='2026-10-28',root=path.resolve(__dirname,'../public');
const fixture=()=>({version:2,periods:[{id:'p',start:'2026-10-20',end:'2026-10-24',status:'ended'}],cycleLength:28,periodLength:5,culture:true,entries:{'2026-10-25':{pain:2,note:'fixed-date-note'}}});
function app({data=fixture(),fetchImpl=async()=>{throw Error('network disabled in test')},extra={},session={},hash='calendar'}={}){
 const dom=new JSDOM(fs.readFileSync(path.join(root,'index.html'),'utf8'),{url:'https://yuejian.test/#'+hash,runScripts:'outside-only'}),w=dom.window;
 const RealDate=Date;w.Date=class extends RealDate{constructor(...args){super(...(args.length?args:[today+'T04:00:00Z']));}static now(){return new RealDate(today+'T04:00:00Z').getTime();}};
 w.structuredClone=structuredClone;w.scrollTo=()=>{};w.HTMLElement.prototype.scrollIntoView=()=>{};w.AbortController=AbortController;w.fetch=fetchImpl;w.crypto.randomUUID=()=> 'synthetic-'+Math.random().toString(36).slice(2);
 w.HTMLDialogElement.prototype.showModal=function(){this.open=true;};w.HTMLDialogElement.prototype.close=function(){this.open=false;this.dispatchEvent(new w.Event('close'));};
 if(data!==null)w.localStorage.setItem(KEY,typeof data==='string'?data:JSON.stringify(data));for(const [k,v]of Object.entries(extra))w.localStorage.setItem(k,typeof v==='string'?v:JSON.stringify(v));for(const [k,v]of Object.entries(session))w.sessionStorage.setItem(k,v);
 for(const script of w.document.querySelectorAll('script[src]'))w.eval(fs.readFileSync(path.join(root,script.getAttribute('src').split('?')[0]),'utf8'));
 return {dom,w,$:s=>w.document.querySelector(s),raw:()=>w.localStorage.getItem(KEY),close:()=>w.close()};
}
const change=(a,s,v)=>{a.$(s).value=v;a.$(s).dispatchEvent(new a.w.Event('input',{bubbles:true}));a.$(s).dispatchEvent(new a.w.Event('change',{bubbles:true}));};
const submit=(a,s)=>a.$(s).dispatchEvent(new a.w.Event('submit',{bubbles:true,cancelable:true}));
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const analysis=()=>({summary:'仅用于测试的合成分析',uncertainty:'这是测试响应。',sections:[['culture','culture-stem-branch'],['tcm','tcm-pain-language'],['western','health-cycle-day-one'],['psychology','health-sleep']].map(([kind,id])=>({kind,title:kind+' 测试分析',body:'根据当天已存资料整理。',actions:['一个可选安排'],articleIds:[id]}))});
function mockAI(log=[]){return async(url,options)=>{const p=JSON.parse(options.body);log.push({url,p,options});return {ok:true,json:async()=>({...p.mode==='analysis'?{analysis:analysis()}:{reply:'针对这一天的回答',articleIds:['health-sleep'],uncertainty:'资料有限。'},signature:p.signature,model:p.model,generatedAt:today+'T04:00:00Z'})};};}
module.exports={KEY,today,fixture,app,change,submit,tick,analysis,mockAI};
