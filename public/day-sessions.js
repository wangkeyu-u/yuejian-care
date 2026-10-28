(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./core.js'),require('./care-output.js'));else root.MoonDaySessions=factory(root.MoonCore,root.MoonCareOutput);})(typeof globalThis!=='undefined'?globalThis:this,function(Core,CareOutput){
  'use strict';const KEY='yuejian.days.v1',kinds=['culture','tcm','western','psychology'];
  function analysis(value){return CareOutput.analysis(value,{legacy:true});}
  function messages(values=[]){if(!Array.isArray(values)||values.length>100||values.some(m=>!m||!['user','assistant'].includes(m.role)||typeof m.content!=='string'))throw Error('对话格式无法读取');return values.map(m=>({role:m.role,content:m.content.slice(0,3000),articleIds:Array.isArray(m.articleIds)?m.articleIds.filter(x=>typeof x==='string').slice(0,24):[]}));}
  function record(value){if(!value||typeof value.signature!=='string'||value.signature.length>20000)throw Error('每日分析索引无法读取');return {signature:value.signature,analysis:analysis(value.analysis),messages:messages(value.messages),model:typeof value.model==='string'?value.model.slice(0,75):'unknown',generatedAt:typeof value.generatedAt==='string'?value.generatedAt:'',imported:value.imported===true,previous:value.previous?{analysis:analysis(value.previous.analysis),messages:messages(value.previous.messages),generatedAt:value.previous.generatedAt||''}:null};}
  function decode(data){if(!data||typeof data!=='object'||Array.isArray(data)||Object.keys(data).length>366)throw Error('每日分析文件格式无效');const output={};for(const [date,value]of Object.entries(data)){if(!Core.isISODate(date))throw Error('每日分析日期无效');output[date]=record(value);}return output;}
  function create(storage){
    function all(){const raw=storage.getItem(KEY);return raw?decode(JSON.parse(raw)):{};}
    function get(date){return all()[date]||null;}
    function put(date,value,expected){if(!Core.isISODate(date))throw Error('日期无效');const data=all();if(expected!==undefined&&JSON.stringify(data[date]||null)!==expected)throw Error('这一天的对话已在另一页更新，请重新打开后继续。');data[date]=record(value);if(Object.keys(data).length>366)throw Error('已保存超过366天的分析，请先导出并清理旧分析。');storage.setItem(KEY,JSON.stringify(data));return data[date];}
    return {all,get,token:date=>JSON.stringify(get(date)),put,remove:date=>{const data=all();delete data[date];storage.setItem(KEY,JSON.stringify(data));},clear:()=>storage.removeItem(KEY)};
  }
  return {KEY,create,decode,analysis};
});
