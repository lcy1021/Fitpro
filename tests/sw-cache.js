const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const handlers = {};
const stale = {body:'old page',ok:true,clone(){return this}};
const fresh = {body:'new page',ok:true,clone(){return this}};
let online = true;
const cache = {put:async()=>{}};
const sandbox = {
  self:{location:{origin:'https://example.com'},addEventListener:(name,fn)=>{handlers[name]=fn}},
  caches:{open:async()=>cache,match:async()=>stale,keys:async()=>[]},
  fetch:async()=>{if(!online)throw Error('offline');return fresh},
  URL,Request,Promise,
};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','sw.js'),'utf8'),sandbox);
const request={method:'GET',url:'https://example.com/index.html',mode:'navigate'};
const respond=()=>new Promise((resolve,reject)=>handlers.fetch({request,respondWith:p=>Promise.resolve(p).then(resolve,reject),waitUntil(){}}));
(async()=>{
  assert.equal((await respond()).body,'new page','online navigation must bypass stale app cache');
  online=false;
  assert.equal((await respond()).body,'old page','offline navigation can use saved page');
  console.log('PASS app shell prefers new page and keeps offline fallback');
})().catch(error=>{console.error(error);process.exitCode=1});
