const test=require('node:test');
const assert=require('node:assert/strict');
const Care=require('../public/care-output.js');
const Sessions=require('../public/day-sessions.js');

const concreteAction={
  when:'晚饭前',
  task:'把两种她熟悉的主食摆在桌上',
  how:'把米饭和面条分别装好，问她现在想选哪一份',
  adjust:'她不想做决定时就先撤掉选择，不继续追问'
};

function plan({swap='对花生过敏时，改成香蕉和酸奶',prepare='提前把香蕉切好，把酸奶放入冷藏区，拿取即可'}={}){
  return {
    title:'可执行的三餐示例',
    basis:'仅用于结构校验。',
    caution:'先核对过敏、忌口和已有医嘱。',
    meals:['早餐','午餐','晚餐'].map(slot=>({slot,foods:'燕麦、酸奶和香蕉',swap,prepare})),
    actions:[concreteAction],
    articleIds:['nutrition-meal-pattern']
  };
}

function oldAnalysis(){
  const legacyFood=plan({
    swap:'按过敏、忌口和她愿意吃的食物替换。',
    prepare:'确认食材后，按平时食量准备。'
  });
  return {
    summary:'旧版本的本地分析。',
    uncertainty:'旧版本没有新的具体性字段。',
    food:legacyFood,
    sections:['culture','tcm','western','psychology'].map(kind=>({
      kind,
      title:kind+' 旧版',
      body:'旧版本内容。',
      actions:['旧版行动字符串'],
      articleIds:[]
    }))
  };
}

test('strict actions reject generic phrase variants without requiring a fixed vocabulary',()=>{
  for(const [field,value] of [
    ['how','今天注意休息，按感觉调整'],
    ['how','今天注意休息，适时调整'],
    ['adjust','如不适则调整'],
    ['adjust','如果不舒服就根据情况调整'],
    ['adjust','必要时调整']
  ]){
    assert.throws(()=>Care.action({...concreteAction,[field]:value}),/行动缺少具体做法或调整条件/);
  }
  assert.doesNotThrow(()=>Care.action(concreteAction));
});

test('strict actions reject four-field repetition but accept different natural wording',()=>{
  assert.throws(()=>Care.action({when:'同一段话',task:'同一段话',how:'同一段话',adjust:'同一段话'}),/行动缺少具体做法或调整条件/);
  assert.doesNotThrow(()=>Care.action({
    when:'午后她想安静时',
    task:'把一项不急的安排移到明天',
    how:'告诉她我可以代为取消，并把取消结果发给她看',
    adjust:'她不想处理这件事时就先放下，不要求解释'
  }));
});

test('strict meals reject empty-template swaps and preparation text',()=>{
  assert.throws(()=>Care.food(plan({swap:'按过敏、忌口和她愿意吃的食物替换。'})),/餐食替换或准备缺少具体信息/);
  assert.throws(()=>Care.food(plan({prepare:'确认食材后，按平时食量准备。'})),/餐食替换或准备缺少具体信息/);
  assert.throws(()=>Care.food(plan({swap:'如果不合适就换成别的'})),/餐食替换或准备缺少具体信息/);
  assert.doesNotThrow(()=>Care.food(plan()));
});

test('legacy stored analysis remains readable while structural checks remain active',()=>{
  assert.doesNotThrow(()=>Sessions.analysis(oldAnalysis()));
  const broken=oldAnalysis();
  broken.food.meals[0].prepare='';
  assert.throws(()=>Sessions.analysis(broken),/行动或饮食内容不完整/);
});
