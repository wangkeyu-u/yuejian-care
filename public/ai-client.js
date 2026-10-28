(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.MoonAI=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';const KEY='yuejian.ai.session.v1';
  function vault(storage){let current='';try{current=storage.getItem(KEY)||'';}catch{}return {get:()=>current,set:(key,remember)=>{if(key&&!/^[A-Za-z0-9_-]{20,512}$/.test(key))throw Error('API Key 格式不正确');if(remember)storage.setItem(KEY,key);else storage.removeItem(KEY);current=key;},clear:()=>{storage.removeItem(KEY);current='';}};}
  async function request(payload,key,signal,fetchImpl=fetch){const response=await fetchImpl('/api/day',{method:'POST',headers:{'Content-Type':'application/json',Authorization:'Bearer '+key},body:JSON.stringify(payload),credentials:'same-origin',cache:'no-store',signal});let data;try{data=await response.json();}catch{throw Error('服务暂时未返回可读结果，请重试。');}if(!response.ok)throw Error(data.error||'分析未完成，请检查设置后重试。');return data;}
  return {KEY,vault,request};
});
