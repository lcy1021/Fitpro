const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const handlers = {};
const stale = {body:'old page',ok:true,clone(){return this}};
const fresh = {body:'new page',ok:true,clone(){return this}};
let online = true;
const cache = {put:async()=>{}};
const images=new Map();let downloads=0,failStorage=false;
const imageCache={match:async req=>images.get(req.url),put:async(req,response)=>{if(failStorage)throw Error('full');images.set(req.url,response)}};
const sandbox = {
  self:{location:{origin:'https://example.com'},clients:{claim:async()=>{}},addEventListener:(name,fn)=>{handlers[name]=fn}},
  caches:{open:async key=>key==='duofit-images-v1'?imageCache:cache,match:async()=>stale,keys:async()=>[]},
  fetch:async()=>{downloads++;if(!online)throw Error('offline');return fresh},
  URL,Request,Promise,
};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','sw.js'),'utf8'),sandbox);
const request={method:'GET',url:'https://example.com/index.html',mode:'navigate'};
const respond=()=>new Promise((resolve,reject)=>handlers.fetch({request,respondWith:p=>Promise.resolve(p).then(resolve,reject),waitUntil(){}}));
const respondImage=(url,method='GET')=>new Promise((resolve,reject)=>{let intercepted=false;handlers.fetch({request:{url,method,mode:'no-cors'},respondWith:p=>{intercepted=true;Promise.resolve(p).then(resolve,reject)},waitUntil(){}});if(!intercepted)resolve('bypassed');});
(async()=>{
  assert.equal((await respond()).body,'new page','online navigation must bypass stale app cache');
  online=false;
  assert.equal((await respond()).body,'old page','offline navigation can use saved page');
  online=true;downloads=0;
  const url='https://example.com/Fitpro/assets/moves/a-plank.webp?v=media1';
  await Promise.all([respondImage(url),respondImage(url)]);assert.equal(downloads,1,'concurrent requests for the same uncached image share a download');
  online=false;assert.equal((await respondImage(url)).body,'new page');assert.equal(downloads,1,'cached image is returned offline without a background fetch');
  online=true;await respondImage(url.replace('media1','media2'));assert.equal(downloads,2,'changed media revision gets a fresh image');
  failStorage=true;assert.equal((await respondImage('https://example.com/assets/uncached.webp')).body,'new page','full image cache does not hide a successfully downloaded image');failStorage=false;
  assert.equal(await respondImage('https://project.supabase.co/rest/v1/fl_members'),'bypassed');assert.equal(await respondImage(url,'POST'),'bypassed');
  const oldRequest={url:'https://example.com/Fitpro/assets/moves/old.gif'},apiRequest={url:'https://example.com/private-data.json'},already={url};
  const deleted=[];sandbox.caches.keys=async()=>['duofit-v29','duofit-v31','duofit-images-v1','another-app'];
  const oldCache={keys:async()=>[oldRequest,apiRequest,already],match:async()=>stale};
  sandbox.caches.open=async key=>key==='duofit-images-v1'?imageCache:key==='duofit-v29'?oldCache:cache;sandbox.caches.delete=async key=>{deleted.push(key)};
  await new Promise((resolve,reject)=>handlers.activate({waitUntil:p=>p.then(resolve,reject)}));
  assert(images.has(oldRequest.url),'existing image survives shell upgrade');assert(!images.has(apiRequest.url),'migration does not preserve unrelated data');assert.equal(images.get(url).body,'new page','older shell does not replace a current image');assert.deepEqual(deleted,['duofit-v29'],'only old DuoFit shell caches are deleted');
  console.log('PASS fresh app shell, offline fallback, image cache hits, request coalescing, media revisions, cache migration and external data bypass');
})().catch(error=>{console.error(error);process.exitCode=1});
