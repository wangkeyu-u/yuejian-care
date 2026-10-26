const test=require('node:test');const assert=require('node:assert/strict');const F=require('../public/forecast.js');
const today='2026-10-26';const period=(id,start,end=null,status='unknown')=>({id,start,end,status});
test('manual fallback and personal historical median with explicit engineering range',()=>{
 const p={periods:[period('a','2026-08-01'),period('b','2026-08-29'),period('c','2026-09-28')],cycleLength:28};
 const f=F.estimate(p,today);assert.equal(f.method,'history');assert.equal(f.cycleLength,29);assert.equal(f.nextStart,'2026-10-27');assert.equal(f.rangeStart,'2026-10-24');assert.equal(f.rangeEnd,'2026-10-30');assert.equal(f.sampleCount,2);assert.equal(p.cycleLength,28);
 assert.equal(F.estimate({periods:p.periods.slice(-2),cycleLength:27},today).method,'manual');
});
test('start editing realigns prediction, end only changes signature and actual information',()=>{
 const p={periods:[period('p','2026-10-20')],cycleLength:28};const old=F.estimate(p,today);
 const start=F.estimate({...p,periods:[period('p','2026-10-18')]},today);assert.equal(start.nextStart,'2026-11-15');assert.notEqual(old.nextStart,start.nextStart);
 const end=F.estimate({...p,periods:[period('p','2026-10-20','2026-10-24','ended')]},today);assert.equal(end.nextStart,old.nextStart);assert.notEqual(end.signature,old.signature);
});
test('canonical empty is authoritative, legacy is compatible and dates are validated',()=>{
 assert.equal(F.estimate({periods:[],starts:['2026-10-01']},today).nextStart,null);assert.equal(F.estimate({starts:['2026-10-01']},today).nextStart,'2026-10-29');assert.throws(()=>F.estimate({periods:[period('f','2026-10-27')]},today));
});
test('late reference never rolls and ongoing reaching due date blocks fabricated new cycle',()=>{
 const p={periods:[period('p','2026-09-01')],cycleLength:28};const f=F.estimate(p,today);assert.equal(f.nextStart,'2026-09-29');assert.equal(f.overdue,true);
 const blocked=F.estimate({...p,periods:[period('p','2026-09-01',null,'ongoing')]},today);assert.equal(blocked.forecastBlocked,true);assert.equal(blocked.nextStart,null);
});
test('abnormal intervals remain visible, no silent deletion, leap dates and boundaries are safe',()=>{
 const p={periods:[period('a','2026-01-01'),period('b','2026-01-10'),period('c','2026-10-01')],cycleLength:31};const f=F.estimate(p,today);assert.equal(f.method,'manual');assert.deepEqual(f.intervals,[9,264]);assert.match(f.notes.join(''),/不自动拟合/);
 assert.equal(F.estimate({starts:['2024-02-01'],cycleLength:28},'2024-02-20').nextStart,'2024-02-29');assert.equal(F.estimate({starts:['2100-12-20']},'2100-12-31').nextStart,null);
});
