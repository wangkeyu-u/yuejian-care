const test=require('node:test');
const assert=require('node:assert/strict');
const Allergies=require('../public/allergies.js');

test('normalize accepts supported separators, trims, and deduplicates',()=>{
  assert.deepEqual(Allergies.normalize(' 花生，鸡蛋、花生\n牛奶;鸡蛋； '),['花生','鸡蛋','牛奶']);
  assert.deepEqual(Allergies.normalize([' peanut ','egg, fish']),['peanut','egg','fish']);
  assert.deepEqual(Allergies.normalize(''),[]);
});

test('normalize rejects malformed, oversized, and credential-like input',()=>{
  assert.throws(()=>Allergies.normalize({value:'egg'}),/字符串或字符串数组/);
  assert.throws(()=>Allergies.normalize(['egg',3]),/只能包含字符串/);
  assert.throws(()=>Allergies.normalize('x'.repeat(41)),/40/);
  assert.throws(()=>Allergies.normalize(Array.from({length:21},(_,i)=>'x'+i)),/20/);
  assert.throws(()=>Allergies.normalize('sk-test123456789'),/密钥|凭据/);
  assert.throws(()=>Allergies.normalize('API_KEY=not-a-food-value'),/密钥|凭据/);
  assert.throws(()=>Allergies.normalize('Bearer abcdefghijklmnop'),/密钥|凭据/);
});

test('aliases expose stable canonical IDs and the Chinese/English synonyms',()=>{
  const egg=Allergies.aliases('鸡蛋');
  assert.equal(egg.canonical,'egg');
  assert(egg.synonyms.includes('蛋'));
  assert(egg.synonyms.includes('eggs'));
  assert.deepEqual(Allergies.aliases('小麦').canonical,'wheat');
  assert.deepEqual(Allergies.aliases('麸质').canonical,'gluten');
  assert.notEqual(Allergies.aliases('小麦').canonical,Allergies.aliases('麸质').canonical);
  assert.deepEqual(Allergies.aliases('芒果'),{canonical:'芒果',synonyms:[],terms:['芒果'],label:'芒果',known:false});
});

test('findRisk uses aliases and English word boundaries',()=>{
  assert.deepEqual(Allergies.findRisk('花生酱和 peanut butter',['花生']),['花生']);
  assert.deepEqual(Allergies.findRisk('eggplant with rice',['egg']),[]);
  assert.deepEqual(Allergies.findRisk('egg salad',['鸡蛋']),['鸡蛋']);
  assert.deepEqual(Allergies.findRisk('大米、纯大豆和豆腐',['小麦','花生']),[]);
  assert.deepEqual(Allergies.findRisk('大豆豆腐和花生油',['大豆','花生']),['大豆','花生']);
  assert.deepEqual(Allergies.findRisk('芒果汁',['芒果']),['芒果']);
});

test('safeMeal checks every meal foods and swap, including derived ingredients',()=>{
  const safe={meals:[
    {slot:'早餐',foods:'米饭、青菜',swap:'豆腐和水果',prepare:'如果不吃蛋，准备独立的豆腐和米饭。',caution:'先核对过敏报告。'},
    {slot:'午餐',foods:'鱼汤和蔬菜',swap:'米饭和豆腐'},
    {slot:'晚餐',foods:'大米、纯大豆',swap:'青菜'}
  ]};
  assert.equal(Allergies.safeMeal(safe,['花生']),true);
  assert.equal(Allergies.safeMeal({...safe,meals:[...safe.meals.slice(0,2),{slot:'晚餐',foods:'米饭',swap:'花生酱'}]},['花生']),false);
  assert.equal(Allergies.safeMeal({meals:[{foods:'无蛋面',swap:'米饭'}]},['鸡蛋']),false);
  assert.equal(Allergies.safeMeal({meals:[{foods:'大米、蔬菜',swap:'豆腐'}]},['小麦']),true);
  assert.equal(Allergies.safeMeal({meals:[{foods:'pasta',swap:'米饭'}]},['小麦']),false);
  assert.equal(Allergies.safeMeal({meals:[{foods:'米饭',swap:'花生油'}]},['花生']),false);
  assert.equal(Allergies.safeMeal({meals:[{foods:'米饭',swap:'青菜',prepare:'另备鸡蛋供他人食用',caution:'避免鸡蛋'}]},['鸡蛋']),true);
});

const extraTest = require('node:test');
extraTest('explicit legacy allergy reports remain exclusions, unknowns do not become diagnoses',()=>{assert.deepEqual(Allergies.reported('已确认花生和鸡蛋过敏；其他过敏未知'),['花生','鸡蛋']);assert.deepEqual(Allergies.reported('不知道是否花生过敏；没有食物过敏；其他过敏和膳食医嘱未提供。'),[]);assert(Allergies.findRisk('花生酱',['对花生过敏']).length);});
