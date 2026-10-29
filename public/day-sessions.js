(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./core.js'),require('./care-output.js'),require('./grounding.js'));else root.MoonDaySessions=factory(root.MoonCore,root.MoonCareOutput,root.MoonGrounding);})(typeof globalThis!=='undefined'?globalThis:this,function(Core,CareOutput,Grounding){
  'use strict';const KEY='yuejian.days.v1',MAX_DAYS=36525,kinds=['culture','tcm','western','psychology'];
  const quotaMessage=operation=>`每日分析${operation}失败：浏览器存储空间可能不足；当前最多保存 ${MAX_DAYS} 天。请先导出并清理旧分析后重试。`;
  function write(storage,raw,previous,operation){
    try{if(raw===null)storage.removeItem(KEY);else storage.setItem(KEY,raw);}
    catch(error){
      try{if(previous===null)storage.removeItem(KEY);else storage.setItem(KEY,previous);}catch{}
      throw Error(quotaMessage(operation));
    }
  }
  function analysis(value){return CareOutput.analysis(value,{legacy:true});}
  function messages(values=[],required=false){if(!Array.isArray(values)||values.length>100||(required&&!values.length)||values.some(m=>!m||!['user','assistant'].includes(m.role)||typeof m.content!=='string'||required&&!m.content.trim()))throw Error('对话格式无法读取');return values.map(m=>({...m.grounding?{grounding:Grounding.snapshot(m.grounding)}:{},role:m.role,content:m.content.slice(0,3000),articleIds:Array.isArray(m.articleIds)?m.articleIds.filter(x=>typeof x==='string').slice(0,24):[]}));}
  function provider(value){if(value===undefined||value===null||value==='')return 'openai';if(!['openai','deepseek'].includes(value))throw Error('服务商格式无法读取');return value;}
  function dependencies(value){return {contextKey:typeof value.contextKey==='string'?value.contextKey.slice(0,16):'',analysisContextKey:typeof value.analysisContextKey==='string'?value.analysisContextKey.slice(0,16):'',contextHistoryStart:Number.isInteger(value.contextHistoryStart)&&value.contextHistoryStart>=0&&value.contextHistoryStart<=100?value.contextHistoryStart:0,privacyBlocks:Array.isArray(value.privacyBlocks)?value.privacyBlocks.filter(x=>typeof x==='string'&&/^[a-f0-9]{1,8}$/.test(x)).slice(-2000):[],memoryRoots:Array.isArray(value.memoryRoots)?value.memoryRoots.filter(x=>typeof x==='string').slice(0,100):[],memoryIds:Array.isArray(value.memoryIds)?[...new Set(value.memoryIds.filter(x=>typeof x==='string').map(x=>x.slice(0,100)))].slice(0,100):[],sourceDates:Array.isArray(value.sourceDates)?[...new Set(value.sourceDates.filter(Core.isISODate))].slice(0,MAX_DAYS):[],blockedForExtraction:value.blockedForExtraction===true};}
  function analysisMetadata(value,hasAnalysis,model,service,generatedAt){if(!hasAnalysis)return {analysisSignature:'',analysisModel:'',analysisProvider:'',analysisGeneratedAt:''};return {analysisSignature:typeof value.analysisSignature==='string'?value.analysisSignature.slice(0,20000):typeof value.signature==='string'?value.signature:'',analysisModel:typeof value.analysisModel==='string'?value.analysisModel.slice(0,75):model,analysisProvider:provider(value.analysisProvider===undefined?service:value.analysisProvider),analysisGeneratedAt:typeof value.analysisGeneratedAt==='string'?value.analysisGeneratedAt:generatedAt};}
  function normalized(value,{previous=false}={}){
    if(!value||typeof value!=='object'||Array.isArray(value))throw Error('每日分析索引无法读取');
    if(!previous&&(typeof value.signature!=='string'||value.signature.length>20000))throw Error('每日分析索引无法读取');
    const kind=value.kind===undefined?'analysis':value.kind;
    if(!['analysis','chat'].includes(kind))throw Error('每日分析类型无法读取');
    const cleanAnalysis=kind==='chat'?(value.analysis===null?null:(()=>{throw Error('聊天记录分析格式无法读取');})()):analysis(value.analysis);
    const model=typeof value.model==='string'?value.model.slice(0,75):'unknown',service=provider(value.provider),generatedAt=typeof value.generatedAt==='string'?value.generatedAt:'';
    return {...dependencies(value),...(previous?{}:{signature:value.signature}),kind,analysis:cleanAnalysis,messages:messages(value.messages,kind==='chat'),model,provider:service,generatedAt,...analysisMetadata(value,cleanAnalysis!==null,model,service,generatedAt),...(previous?{}:{imported:value.imported===true})};
  }
  function record(value){const clean=normalized(value),previous=value.previous===undefined||value.previous===null?null:normalized(value.previous,{previous:true});return {...clean,previous};}
  function decode(data){if(!data||typeof data!=='object'||Array.isArray(data))throw Error('每日分析文件格式无效');const dates=Object.keys(data);if(dates.length>MAX_DAYS)throw Error(`每日分析文件超过 ${MAX_DAYS} 天容量上限，请先导出并清理旧分析。`);const output={};for(const [date,value]of Object.entries(data)){if(!Core.isISODate(date))throw Error('每日分析日期无效');output[date]=record(value);}return output;}
  function create(storage,{filter=x=>x}={}){
    function all(){const raw=storage.getItem(KEY);return filter(raw?decode(JSON.parse(raw)):{});}
    function get(date){return all()[date]||null;}
    function put(date,value,expected){if(!Core.isISODate(date))throw Error('日期无效');const previous=storage.getItem(KEY),data=all();if(expected!==undefined&&JSON.stringify(data[date]||null)!==expected)throw Error('这一天的对话已在另一页更新，请重新打开后继续。');data[date]=record(value);if(Object.keys(data).length>MAX_DAYS)throw Error(`已保存超过 ${MAX_DAYS} 天的分析，请先导出并清理旧分析。`);write(storage,JSON.stringify(data),previous,'保存');return data[date];}
    function remove(date,expected){if(!Core.isISODate(date))throw Error('日期无效');const previous=storage.getItem(KEY),data=all();if(expected!==undefined&&JSON.stringify(data[date]||null)!==expected)throw Error('这一天的对话已在另一页更新，请重新打开后继续。');delete data[date];write(storage,JSON.stringify(data),previous,'移除');}
    return {all,get,token:date=>JSON.stringify(get(date)),put,remove,clear:()=>storage.removeItem(KEY)};
  }
  return {KEY,MAX_DAYS,create,decode,analysis};
});
