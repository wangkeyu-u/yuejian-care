(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.MoonAI=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';const KEY='yuejian.ai.session.v1';
  function vault(storage,{provider=()=> 'openai'}={}){
    const current=new Map(),valid=p=>{if(!['openai','deepseek'].includes(p))throw Error('请选择有效的AI服务');return p;},storageKey=p=>p==='openai'?KEY:KEY+'.'+p;
    function get(p=provider()){valid(p);if(!current.has(p)){let value='';try{value=storage.getItem(storageKey(p))||'';}catch{}current.set(p,value);}return current.get(p);}
    function clear(p=provider()){valid(p);storage.removeItem(storageKey(p));current.set(p,'');}
    return {get,remembered:(p=provider())=>{valid(p);try{return !!storage.getItem(storageKey(p));}catch{return false;}},set:(key,remember,p=provider())=>{valid(p);if(key&&!/^[A-Za-z0-9_-]{20,512}$/.test(key))throw Error('API Key 格式不正确');if(remember)storage.setItem(storageKey(p),key);else storage.removeItem(storageKey(p));current.set(p,key);},clear,clearAll:()=>{clear('openai');clear('deepseek');}};
  }
  function preparePayload(payload){const result={...payload,history:Array.isArray(payload.history)?payload.history.slice(-12):[]};while(new Blob([JSON.stringify(result)]).size>90*1024&&result.history.length)result.history.splice(0,2);if(new Blob([JSON.stringify(result)]).size>90*1024)throw Error('本次资料超过请求范围，请减少过长的记忆或问题后重试。');return result;}
  async function request(payload,key,signal,fetchImpl=fetch){const response=await fetchImpl('/api/day',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+key},body:JSON.stringify(preparePayload(payload)),credentials:'same-origin',cache:'no-store',signal});let data;try{data=await response.json();}catch{throw Error('服务暂时未返回可读结果，请重试。');}if(!response.ok)throw Error(data.error||'分析未完成，请检查设置后重试。');return data;}
  return {KEY,vault,request,preparePayload};
});
