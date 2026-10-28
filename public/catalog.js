(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory([...require('./health-data.js'),...require('./tcm-data.js'),...require('./culture-data.js')]);else root.MoonCatalog=factory([...root.MoonHealthArticles,...root.MoonTCMArticles,...root.MoonCultureArticles]);})(typeof globalThis!=='undefined'?globalThis:this,function(articles){
'use strict';
const psychological=['health-sleep','health-pms','health-pmdd','health-anxiety-cycle'];
const subjects={all:'全部领域',western:'西医与身体',tcm:'中医与疗法',psychology:'心理与睡眠',culture:'玄学与历法'};
const normalize=v=>String(v||'').normalize('NFKC').toLocaleLowerCase('zh-CN').replace(/\s+/g,'');
function scene(a){if(a.id.startsWith('culture-'))return '历法与文化';if(a.id==='tcm-diet-conditions'||a.category==='饮食活动')return '饮食与活动';if(psychological.includes(a.id))return '睡眠与情绪';if(a.category==='周期常识')return '周期与日期';if(a.category==='用品卫生')return '用品与清洁';if(a.id==='tcm-pain-language'||a.category==='身体照护')return '疼痛与不适';return '用药与就诊';}
const rows=articles.map(a=>({...a,subjects:a.id.startsWith('culture-')?['culture']:a.id.startsWith('tcm-')?['tcm']:psychological.includes(a.id)?['western','psychology']:['western'],scene:scene(a)}));
function filter({subject='all',scene='全部问题',query='',saved=false,bookmarks=[]}={}){const words=query.trim().split(/\s+/).filter(Boolean).map(normalize);return rows.filter(a=>(subject==='all'||a.subjects.includes(subject))&&(scene==='全部问题'||scene===a.scene)&&(!saved||bookmarks.includes(a.id))&&words.every(word=>normalize([a.title,a.summary,...a.body,...a.tags].join(' ')).includes(word)));}
return {articles:rows,subjects,filter,scenes:['全部问题','周期与日期','疼痛与不适','饮食与活动','睡眠与情绪','用品与清洁','用药与就诊','历法与文化']};
});
