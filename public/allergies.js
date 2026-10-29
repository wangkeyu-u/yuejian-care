(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.MoonAllergies=factory();})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';

  const MAX_ITEMS=20,MAX_ITEM_LENGTH=40,MAX_RAW_LENGTH=1024;
  const splitPattern=/[,，、\n\r;；]+/;

  // Canonicals are stable English IDs; labels and synonyms keep the user-facing
  // Chinese terms available without treating wheat and gluten as one category.
  const groups={
    peanut:{label:'花生',synonyms:['花生','peanuts','groundnut','groundnuts']},
    egg:{label:'蛋',synonyms:['蛋','鸡蛋','雞蛋','eggs']},
    milk:{label:'奶',synonyms:['奶','牛奶','乳','乳制品','乳製品','dairy','milk']},
    fish:{label:'鱼',synonyms:['鱼','魚','鱼类','魚類','fishes']},
    crustacean:{label:'甲壳类',synonyms:['甲壳类','甲殼類','虾','蝦','虾类','蝦類','蟹','蟹类','蟹類','shrimp','prawn','crab','lobster','crayfish','crustaceans']},
    mollusk:{label:'贝类',synonyms:['贝类','貝類','贝','貝','贝壳类','貝殼類','shellfish','mollusk','mollusks','mollusc','molluscs','clam','oyster','scallop','mussel','abalone']},
    sesame:{label:'芝麻',synonyms:['芝麻','sesame']},
    soy:{label:'大豆',synonyms:['大豆','黄豆','黃豆','soy','soya','soybean','soybeans']},
    tree_nut:{label:'坚果',synonyms:['坚果','堅果','坚果类','堅果類','tree nut','tree nuts','nuts','almond','walnut','cashew','pistachio','pecan','hazelnut','macadamia','chestnut','pine nut']},
    wheat:{label:'小麦',synonyms:['小麦','小麥','小麦类','小麥類','wheat']},
    gluten:{label:'麸质',synonyms:['麸质','麩質','gluten']}
  };
  const canonicalByAlias=new Map();
  for(const [canonical,group] of Object.entries(groups)){
    for(const term of [canonical,group.label,...group.synonyms])canonicalByAlias.set(fold(term),canonical);
  }

  // Chinese terms are intentionally explicit. In particular, "豆" is not an
  // alias for soy and "麦" is not an alias for wheat.
  const riskPatterns={
    peanut:{zh:['花生'],en:['peanuts?','groundnuts?']},
    egg:{zh:['蛋','鸡蛋','雞蛋'],en:['eggs?','albumen','ovalbumin']},
    milk:{zh:['奶','乳','乳清','奶酪','奶油','黄油','酸奶','乳糖','酪蛋白'],en:['milk','dairy','whey','casein','lactose','cheese','butter','cream','yogurt','yoghurt','ghee','(?:ice|whipped)\\s+cream']},
    fish:{zh:['鱼','魚'],en:['fish','anchov(?:y|ies)','tuna','salmon','cod','haddock','sardine(?:s)?','mackerel']},
    crustacean:{zh:['甲壳','甲殼','虾','蝦','蟹'],en:['shrimp','prawn','crab','lobster','crayfish','crustacean']},
    mollusk:{zh:['贝','貝','贝壳','貝殼','海螺','鱿鱼','魷魚'],en:['shellfish','mollus[ck]','clam','oyster','scallop','mussel','abalone','snail','squid','cuttlefish','octopus']},
    sesame:{zh:['芝麻'],en:['sesame','tahini']},
    soy:{zh:['大豆','黄豆','黃豆','豆腐','豆浆','豆漿','酱油','醬油','味噌','毛豆'],en:['soy(?:bean)?s?','soya','tofu','bean\\s+curd','miso','tempeh','edamame','soy\\s+sauce']},
    tree_nut:{zh:['坚果','堅果','杏仁','核桃','腰果','开心果','開心果','榛子','碧根果','夏威夷果','巴旦木','松子','栗子'],en:['(?:tree\\s+)?nuts?','almond(?:s)?','walnut(?:s)?','cashew(?:s)?','pistachio(?:s)?','pecan(?:s)?','hazelnut(?:s)?','macadamia(?:s)?','chestnut(?:s)?','pine\\s+nuts?']},
    wheat:{zh:['小麦','小麥','面粉','麵粉','面包','麵包','面条','麵條','面食','麵食','面制品','麵製品','面点','麵點','意面','意大利面','意大利麵','通心粉','饺子','餃子','馒头','饅頭','包子'],en:['wheat','semolina','durum','(?:all[-\\s])purpose\\s+flour','bread','pasta','couscous','crackers?','pretzels?','pastr(?:y|ies)']},
    gluten:{zh:['麸质','麩質','小麦','小麥','大麦','大麥','黑麦','黑麥','麦芽','麥芽','面粉','麵粉','面包','麵包','面条','麵條','面食','麵食','面制品','麵製品','面点','麵點','意面','意大利面','意大利麵','通心粉','饺子','餃子','馒头','饅頭','包子'],en:['gluten','wheat','barley','rye','malt','seitan','semolina','durum','bread','pasta','couscous','crackers?','pretzels?','pastr(?:y|ies)']}
  };

  function fold(value){return String(value).normalize('NFKC').trim().toLocaleLowerCase('en-US');}
  function charLength(value){return Array.from(value).length;}
  function secretLike(value){
    return /(?:^|[^a-z0-9])(sk-[a-z0-9_-]{4,}|sk_[a-z0-9_-]{4,}|AIza[0-9a-z_-]{20,}|gh[pousr]_[0-9a-z]{20,})(?:$|[^a-z0-9])/i.test(value)
      || /(?:api[\s_-]*key|access[\s_-]*token|auth(?:entication)?[\s_-]*token|password|secret)\s*[:=]/i.test(value)
      || /\bbearer\s+[a-z0-9._~+/=-]{12,}\b/i.test(value)
      || /-----BEGIN [A-Z ]+ PRIVATE KEY-----/i.test(value);
  }
  function normalize(raw){
    if(typeof raw!=='string'&&!Array.isArray(raw))throw new TypeError('过敏原必须是字符串或字符串数组。');
    const source=Array.isArray(raw)?raw:raw.split(splitPattern);
    if(typeof raw==='string'&&raw.length>MAX_RAW_LENGTH)throw new RangeError('过敏原输入过长。');
    const values=[];
    for(const item of source){
      if(typeof item!=='string')throw new TypeError('过敏原数组只能包含字符串。');
      // An array item may still contain separators; accepting this keeps import
      // and form data consistent with the string form.
      const pieces=item.split(splitPattern);
      for(const piece of pieces){
        const value=piece.normalize('NFKC').trim();
        if(!value)continue;
        if(charLength(value)>MAX_ITEM_LENGTH)throw new RangeError('单项过敏原不能超过40个字符。');
        if(secretLike(value))throw new TypeError('过敏原字段不能包含密钥或凭据。');
        values.push(value);
      }
    }
    if(values.length>MAX_ITEMS)throw new RangeError('过敏原最多记录20项。');
    const seen=new Set(),out=[];
    for(const value of values){const key=fold(value);if(seen.has(key))continue;seen.add(key);out.push(value);}
    return out;
  }

  function canonicalOf(term){return canonicalByAlias.get(fold(term).replace(/^对/,'').replace(/过敏$/,''))||null;}
  function reported(value){
    const out=[];for(const clause of String(value||'').split(/[，,；;。\n]/)){
      if(/未知|未提供|未确认|其他过敏|尚不清楚|不知道|不确定|是否|没有.{0,8}过敏|不过敏|无过敏|假如|如果|[?？]/.test(clause))continue;
      const m=clause.match(/(?:对)?([^：:，,；;。]{1,60}?)过敏/);if(!m)continue;
      const items=m[1].replace(/.*(?:确认|报告|说|：|:)/,'').replace(/^(?:她|本人|已知|已|对|有|是)+/,'').split(/[和与及、\/]/).map(x=>x.trim()).filter(Boolean);
      for(const item of items)if(item.length<=40)out.push(item);
    }return normalize([...new Set(out)]);
  }
  function aliases(term){
    if(typeof term!=='string')throw new TypeError('过敏原必须是字符串。');
    const values=normalize(term);
    if(values.length>1)throw new TypeError('aliases 一次只能查询一项过敏原。');
    const value=values[0]||'';
    const canonical=canonicalOf(value);
    if(!canonical)return {canonical:value,synonyms:[],terms:value?[value]:[],label:value,known:false};
    const group=groups[canonical],synonyms=[...new Set(group.synonyms.filter(x=>fold(x)!==canonical))];
    return {canonical,synonyms,terms:[canonical,...synonyms],label:group.label,known:true};
  }

  function englishMatch(text,source){
    const pattern=typeof source==='string'?source:source.source;
    return new RegExp('(?:^|[^a-z0-9])(?:'+pattern+')(?=$|[^a-z0-9])','i').test(text);
  }
  function containsLiteral(text,term){
    const folded=fold(term);
    if(!folded)return false;
    if(/^[a-z0-9][a-z0-9 ._-]*$/i.test(folded))return englishMatch(text,folded.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').replace(/\s+/g,'\\s+'));
    return text.includes(folded);
  }
  function hasKnownRisk(text,canonical){
    const patterns=riskPatterns[canonical];if(!patterns)return false;
    const folded=fold(text);
    if(patterns.zh.some(term=>folded.includes(fold(term))))return true;
    return patterns.en.some(pattern=>englishMatch(folded,pattern));
  }
  function findRisk(text,exclusions){
    if(typeof text!=='string'||!text)return [];
    const list=normalize(exclusions===undefined||exclusions===null?[]:exclusions),matched=[];
    for(const term of list){
      const canonical=canonicalOf(term);
      if((canonical?hasKnownRisk(text,canonical):containsLiteral(text,term))&&!matched.includes(term))matched.push(term);
    }
    return matched;
  }

  function mealTexts(food){
    if(typeof food==='string')return [food];
    if(Array.isArray(food))return food.flatMap(mealTexts);
    if(!food||typeof food!=='object')return [];
    if(Array.isArray(food.meals))return food.meals.flatMap(mealTexts);
    // Only foods and swap are checked. prepare/caution may explain how a
    // listed allergen is avoided and therefore must not make a safe plan fail.
    return ['foods','swap'].flatMap(key=>typeof food[key]==='string'?[food[key]]:[]);
  }
  function safeMeal(food,exclusions){
    const texts=mealTexts(food);
    if(!texts.length)return false;
    const list=normalize(exclusions===undefined||exclusions===null?[]:exclusions);
    return texts.every(text=>findRisk(text,list).length===0);
  }

  return {normalize,aliases,findRisk,safeMeal,reported,MAX_ITEMS,MAX_ITEM_LENGTH};
});
