(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.MoonProviders=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const definitions=Object.freeze({
    openai:Object.freeze({id:'openai',label:'OpenAI',defaultModel:'gpt-4.1-mini',endpoint:'https://api.openai.com/v1/responses'}),
    deepseek:Object.freeze({id:'deepseek',label:'DeepSeek',defaultModel:'deepseek-flash',endpoint:'https://api.deepseek.com/responses'})
  });
  const deepseekModels=new Set(['deepseek-flash','deepseek-v4-pro']);
  const limits={analysis:3200,chat:1200,memory:1000,signals:1600};
  function normalize(provider){if(provider===undefined||provider===null||provider==='')return 'openai';if(typeof provider!=='string'||!Object.hasOwn(definitions,provider))throw Error('服务商无效');return provider;}
  function validModel(provider,model){let id;try{id=normalize(provider);}catch{return false;}if(typeof model!=='string'||!model.trim())return false;return id==='deepseek'?deepseekModels.has(model):/^gpt-[a-zA-Z0-9._-]{1,70}$/.test(model);}
  function defaultModel(provider){return definitions[normalize(provider)].defaultModel;}
  function definition(provider){const id=normalize(provider);return {...definitions[id]};}
  function modeOf(body){if(typeof body?.mode==='string'&&Object.hasOwn(limits,body.mode))return body.mode;const name=body?.text?.format?.name;if(typeof name==='string')for(const mode of Object.keys(limits))if(name===mode||name===`daily_${mode}`||name.endsWith(`_${mode}`))return mode;return '';}
  function upstreamBody(provider,body){const id=normalize(provider),out={...(body||{})};if(id!=='deepseek')return out;out.reasoning={...(body?.reasoning&&typeof body.reasoning==='object'?body.reasoning:{}),effort:'none'};const limit=limits[modeOf(body)];if(limit){const requested=Number.isInteger(body?.max_output_tokens)&&body.max_output_tokens>0?body.max_output_tokens:limit;out.max_output_tokens=Math.min(requested,limit);}return out;}
  return {definitions,limits,normalize,validModel,defaultModel,definition,upstreamBody};
});
