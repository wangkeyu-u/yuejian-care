// Synthetic data only. This measures deterministic consistency, not clinical
// prediction accuracy or the usefulness of responses from a live model.
import {createRequire} from 'node:module';
import {performance} from 'node:perf_hooks';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),C=require('../public/core.js'),S=require('../public/state.js'),P=require('../public/phases.js'),D=require('../public/day-context.js'),K=require('../public/catalog.js'),M=require('../public/memory.js');
const today='2026-10-28';
let start='2018-01-01';const periods=Array.from({length:90},(_,i)=>{const row={id:'synthetic-'+i,start,end:C.addDays(start,4),status:'ended'};start=C.addDays(start,[26,28,30][i%3]);return row;});
const profile=S.decode({periods,cycleLength:28,periodLength:5,culture:true},today);let comparisons=0,paragraphs=0,referenceLinks=0;
for(const period of periods)for(const offset of [0,4,6,14,21]){
  const date=C.addDays(period.start,offset),input=D.makeInput(profile,date),context=D.build(input,K.articles,today);
  assert(input.profile.periods.length<=15);assert.deepEqual(context.phaseAssessment,P.assess(profile,date,today));assert.equal(context.info.cycleStart,period.start);comparisons++;
}
for(const article of K.articles){assert.equal(article.paragraphSources.length,article.body.length);paragraphs+=article.body.length;for(const refs of article.paragraphSources)for(const index of refs){assert(article.sources[index]?.url);referenceLinks++;}for(const source of article.sources)assert(article.verification.sourceNotes.some(n=>n.url===source.url&&n.supports));}
const performanceSamples=[];
for(const years of [5,10]){
  const count=years*365,first=C.addDays(today,1-count),memory=M.empty();memory.blocks=Array.from({length:100},(_,i)=>({rootId:'synthetic-block-'+i,ids:[],sources:[{date:C.addDays(first,i),kind:'note',sourceId:'note:'+i}],mode:'delete',at:today,keys:[]}));
  const entries=Object.fromEntries(Array.from({length:count},(_,i)=>[C.addDays(first,i),{note:'synthetic daily record',signals:[]}])) ,data={...profile,entries,memory};
  const timings=[];for(let round=0;round<3;round++){const begin=performance.now();for(let i=0;i<42;i++)P.assess(data,C.addDays(today,i-41),today);timings.push(performance.now()-begin);}
  performanceSamples.push({years,entries:count,privacyBlocks:100,datesPerMonth:42,medianMs:Number(timings.sort((a,b)=>a-b)[1].toFixed(2))});
}
console.log(JSON.stringify({kind:'synthetic deterministic audit',clinicalValidation:false,liveModelEvaluation:false,calendarAIComparisons:comparisons,knowledgeArticles:K.articles.length,books:K.books.length,paragraphs,referenceLinks,performanceSamples},null,2));
