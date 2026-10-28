import http from 'node:http';
import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {createRequire} from 'node:module';
import {createSite} from '../worker/index.mjs';
const root=path.resolve(import.meta.dirname,'..'),require=createRequire(import.meta.url);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.txt':'text/plain; charset=utf-8'};
const assets={};async function visit(dir){for(const item of await readdir(dir,{withFileTypes:true})){if(item.name.startsWith('.'))continue;const file=path.join(dir,item.name);if(item.isDirectory())await visit(file);else assets['/'+path.relative(path.join(root,'public'),file).split(path.sep).join('/')]= {content:await readFile(file,'utf8'),type:types[path.extname(file)]||'text/plain'};}}
await visit(path.join(root,'public'));
const site=createSite({assets,Core:require('../public/core.js'),Periods:require('../public/periods.js'),Forecast:require('../public/forecast.js'),Advice:require('../public/advice.js'),DayContext:require('../public/day-context.js'),catalog:[...require('../public/health-data.js'),...require('../public/tcm-data.js'),...require('../public/culture-data.js'),...require('../public/nutrition-data.js'),...require('../public/phase-knowledge.js').articles]});
const server=http.createServer(async(req,res)=>{try{const chunks=[];let size=0;for await(const part of req){size+=part.length;if(size>100*1024){res.writeHead(413);res.end();return;}chunks.push(part);}const request=new Request('http://'+req.headers.host+req.url,{method:req.method,headers:req.headers,...(['GET','HEAD'].includes(req.method)?{}:{body:Buffer.concat(chunks)})});const response=await site.fetch(request);res.writeHead(response.status,Object.fromEntries(response.headers));res.end(Buffer.from(await response.arrayBuffer()));}catch{res.writeHead(500);res.end('Request failed');}});
const port=Number(process.env.PORT||4174);if(!Number.isInteger(port)||port<1024||port>65535)throw Error('Invalid PORT');
server.listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}`));
