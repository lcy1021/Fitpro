// Actual SW lifecycle: cached slow/offline launches and complete/failed shell updates.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const root=path.join(__dirname,'..'),output=path.join(root,'docs/qa/startup-resilience-v60');
(async()=>{
 let revision=60,slow=false,failCore=false;const requests=[];
 const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost'),name=url.pathname==='/'?'index.html':url.pathname.slice(1);
  requests.push(name);
  if(slow&&/^(?:index.html|config.js|sw.js|private-coach.js)$/.test(name))await new Promise(resolve=>setTimeout(resolve,2500));
  if(failCore&&name==='config.js'){res.writeHead(503);res.end('synthetic failed update');return;}
  const file=path.resolve(root,name);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
  const extension=path.extname(file),types={'.html':'text/html','.js':'application/javascript','.css':'text/css','.webp':'image/webp','.jpg':'image/jpeg','.svg':'image/svg+xml','.ttf':'font/ttf','.webmanifest':'application/manifest+json'};
  let body=name==='config.js'?Buffer.from('window.FATLOSS_CONFIG={};'):fs.readFileSync(file);
  if(['.html','.js'].includes(extension))body=Buffer.from(body.toString().replaceAll('v=60',`v=${revision}`).replaceAll('version:60',`version:${revision}`).replaceAll('duofit-v60',`duofit-v${revision}`));
  res.writeHead(200,{'Content-Type':types[extension]||'application/octet-stream','Cache-Control':'no-store'});res.end(body);
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const origin=`http://127.0.0.1:${server.address().port}`,browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_BROWSER||'chromium'});
 const result={syntheticUpdates:true};
 try{
  const context=await browser.newContext({viewport:{width:390,height:844}});
  await context.addInitScript(()=>{localStorage.setItem('fatloss.me','hus');localStorage.setItem('startup-preserved-fixture','unchanged');});
  const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto(origin+'/index.html');
  await page.evaluate(async()=>{await navigator.serviceWorker.register('sw.js',{updateViaCache:'none'});await navigator.serviceWorker.ready;});
  await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  slow=true;requests.length=0;
  await page.goto(origin+'/?source=homescreen',{waitUntil:'commit'});
  await page.locator('#pick').waitFor({state:'visible'});
  await page.waitForFunction(()=>performance.getEntriesByName('first-contentful-paint').length>0);
  result.slow=await page.evaluate(()=>({paint:performance.getEntriesByName('first-contentful-paint')[0].startTime,versionedStyles:document.querySelector('[data-shell-source]').dataset.shellSource,identity:localStorage.getItem('startup-preserved-fixture')}));
  assert(result.slow.paint<1000,JSON.stringify(result.slow));
  assert.deepEqual(requests.filter(name=>['index.html','config.js','private-coach.js'].includes(name)),[],'cached HTML/config/scripts do not make foreground network requests');
  await page.screenshot({path:path.join(output,'cache-slow-first-paint.png')});
  await page.waitForFunction(()=>!!document.querySelector('#lm').onclick);await page.locator('[data-lm-skip]').click();await page.locator('#pick').waitFor({state:'hidden'});
  await context.setOffline(true);
  await page.goto(origin+'/index.html',{waitUntil:'commit'});
  await page.locator('#pick').waitFor({state:'visible'});await page.waitForFunction(()=>performance.getEntriesByName('first-contentful-paint').length>0);
  result.offline=await page.evaluate(()=>({paint:performance.getEntriesByName('first-contentful-paint')[0].startTime,identity:localStorage.getItem('startup-preserved-fixture')}));
  assert(result.offline.paint<1000);assert.equal(result.offline.identity,'unchanged');
  await page.waitForFunction(()=>!!document.querySelector('#lm').onclick);await page.locator('[data-lm-skip]').click();await page.locator('#pick').waitFor({state:'hidden'});
  await context.setOffline(false);slow=false;failCore=true;revision=61;
  const update=()=>page.evaluate(async()=>{
   const registration=await navigator.serviceWorker.getRegistration();
   return new Promise(async(resolve,reject)=>{
    const timer=setTimeout(()=>reject(Error('update lifecycle timed out')),15000);
    registration.addEventListener('updatefound',()=>{
     const worker=registration.installing;
     worker.addEventListener('statechange',()=>{if(['redundant','activated'].includes(worker.state)){clearTimeout(timer);resolve(worker.state);}});
    },{once:true});
    try{await registration.update();}catch(error){clearTimeout(timer);reject(error);}
   });
  });
  assert.equal(await update(),'redundant','failed CORE install cannot replace the active shell');
  result.failedUpdate=await page.evaluate(async()=>({caches:await caches.keys(),preserved:localStorage.getItem('startup-preserved-fixture')}));
  assert(result.failedUpdate.caches.includes('duofit-v60'));assert.equal(result.failedUpdate.preserved,'unchanged');
  failCore=false;revision=62;assert.equal(await update(),'activated');
  await page.waitForFunction(async()=>!(await caches.keys()).includes('duofit-v60'));
  await page.reload();
  result.successfulUpdate=await page.evaluate(async()=>({caches:await caches.keys(),source:document.querySelector('[data-shell-source]').dataset.shellSource,preserved:localStorage.getItem('startup-preserved-fixture'),entryImage:!!await (await caches.open('duofit-images-v1')).match('assets/login/hus-running.webp')}));
  assert(result.successfulUpdate.caches.includes('duofit-v62'));assert(result.successfulUpdate.entryImage);assert(result.successfulUpdate.source.endsWith('v=62'));assert.equal(result.successfulUpdate.preserved,'unchanged');
  assert.deepEqual(errors,[]);result.errors=errors;
  fs.writeFileSync(path.join(output,'cache-browser-results.json'),JSON.stringify(result,null,2)+'\n');
  console.log('PASS actual SW slow/offline startup, failed install retains current shell, complete update, retained identity/images');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
