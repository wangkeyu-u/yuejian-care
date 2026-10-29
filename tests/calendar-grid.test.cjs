const test=require('node:test'),assert=require('node:assert/strict');
const {app}=require('./helpers.cjs');
test('month navigation includes every actual month date and omits unused whole weeks',()=>{
 const a=app();try{
  const check=(month,count,first,last,monthDays)=>{const cells=[...a.w.document.querySelectorAll('#calendar-grid [data-date]')],dates=cells.map(x=>x.dataset.date);assert.equal(cells.length,count);assert.equal(dates[0],first);assert.equal(dates.at(-1),last);assert.equal(dates.filter(d=>d.slice(0,7)===month).length,monthDays);assert.equal(new Set(dates).size,count);};
  check('2026-10',35,'2026-09-28','2026-11-01',31);a.$('#month-next').click();check('2026-11',42,'2026-10-26','2026-12-06',30);
  for(let i=0;i<3;i++)a.$('#month-next').click();check('2027-02',28,'2027-02-01','2027-02-28',28);
  a.$('#month-today').click();assert.equal(a.w.document.querySelectorAll('#calendar-grid [data-date]').length,35);assert(a.$('[data-date="2026-10-28"]'));
 }finally{a.close();}
});
