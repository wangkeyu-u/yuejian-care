import { createAnalyzer } from './ai.mjs';
import { createDayAnalyzer } from './day-ai.mjs';
export function createSite({assets, Core, Periods, Forecast, Advice, catalog, DayContext, fetchImpl}) {
  const analyzer=createAnalyzer({Core,Periods,Forecast,Advice,catalog,fetchImpl});
  const daily=DayContext?createDayAnalyzer({DayContext,catalog,fetchImpl}):null;
  return {async fetch(request) {
    const url=new URL(request.url);
    if(url.pathname==='/api/day') return daily?daily.analyze(request):new Response('Not configured',{status:503});
    if(url.pathname==='/api/analyze') return analyzer.analyze(request);
    if(!['GET','HEAD'].includes(request.method)) return new Response('Method not allowed',{status:405});
    const file=assets[url.pathname==='/'?'/index.html':url.pathname];
    if(!file)return new Response('Not found',{status:404,headers:{'Cache-Control':'no-store'}});
    return new Response(request.method==='HEAD'?null:file.content,{headers:{'Content-Type':file.type,'Cache-Control':'public, max-age=0, must-revalidate','X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'"}});
  }};
}
