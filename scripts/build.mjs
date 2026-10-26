import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.txt':'text/plain; charset=utf-8'};
const assets={};
async function visit(dir){for(const item of await readdir(dir,{withFileTypes:true})){if(item.name.startsWith('.'))continue;const file=path.join(dir,item.name);if(item.isDirectory())await visit(file);else if(item.isFile())assets['/'+path.relative(path.join(root,'public'),file).split(path.sep).join('/')]= {content:await readFile(file,'utf8'),type:types[path.extname(file)]||'text/plain; charset=utf-8'};else throw new Error('Non-regular asset');}}
await visit(path.join(root,'public'));
const libs=['core','periods','forecast','companion','health-data','tcm-data','culture-data','advice'];
let code='// Generated single-file Worker. Sources remain in public/ and worker/.\n';
for(const lib of libs)code+=`\n${await readFile(path.join(root,'public',lib+'.js'),'utf8')}\n`;
code+=(await readFile(path.join(root,'worker/ai.mjs'),'utf8')).replace('export function createAnalyzer','function createAnalyzer');
code+=(await readFile(path.join(root,'worker/index.mjs'),'utf8')).replace(/^import .*;\n/,'').replace('export function createSite','function createSite');
code+=`\nconst assets=${JSON.stringify(assets)};\nexport default createSite({assets,Core:globalThis.MoonCore,Periods:globalThis.MoonPeriods,Forecast:globalThis.MoonForecast,Advice:globalThis.MoonAdvice,catalog:[...globalThis.MoonHealthArticles,...globalThis.MoonTCMArticles,...globalThis.MoonCultureArticles]});\n`;
let manifest;
try { manifest = await readFile(path.join(root,'.openai/hosting.json'),'utf8'); }
catch (error) { if (error.code !== 'ENOENT') throw error; manifest = JSON.stringify({d1:null,r2:null}); }
JSON.parse(manifest);
await mkdir(path.join(root,'dist/server'),{recursive:true});await mkdir(path.join(root,'dist/.openai'),{recursive:true});await writeFile(path.join(root,'dist/server/index.js'),code);await writeFile(path.join(root,'dist/.openai/hosting.json'),manifest);
console.log(`Built single-file worker with ${Object.keys(assets).length} assets.`);
