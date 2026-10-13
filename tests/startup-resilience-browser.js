// Cold process-like contexts, slow streamed HTML, and stalled script/image dependencies.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),http=require('node:http'),cp=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/tmp/duofit-browser-qa/node_modules/playwright');
const root=path.join(__dirname,'..'),out=path.join(root,'docs/qa/startup-resilience-v60'),before=process.argv.includes('--before');
const baseline=before?cp.execFileSync('git',['show','3bf2013:index.html'],{cwd:root}):null;
(async()=>{
 fs.mkdirSync(out,{recursive:true});let mode='scripts';
 const server=http.createServer(async(req,res)=>{
  const url=new URL(req.url,'http://localhost'),name=url.pathname==='/'?'index.html':url.pathname.slice(1);
  const file=path.resolve(root,name);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}
  const type={'.html':'text/html','.js':'application/javascript','.css':'text/css','.webp':'image/webp','.jpg':'image/jpeg','.svg':'image/svg+xml'}[path.extname(file)]||'application/octet-stream';
  let body=name==='config.js'?Buffer.from('window.FATLOSS_CONFIG={};'):name==='index.html'&&before?baseline:fs.readFileSync(file);
  if(mode==='stream'&&name==='index.html'){res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store'});res.write(body.subarray(0,65536));await new Promise(resolve=>setTimeout(resolve,4500));res.end(body.subarray(65536));return;}
  if(mode==='scripts'&&['config.js','private-coach.js','design-system/mascots.js','app.js'].includes(name))await new Promise(resolve=>setTimeout(resolve,4500));
  if(mode==='images'&&name.includes('/login/'))await new Promise(resolve=>setTimeout(resolve,4500));
  if(mode==='styles'&&name.endsWith('.css'))await new Promise(resolve=>setTimeout(resolve,4500));
  if(mode==='long-wait'&&name==='config.js')await new Promise(resolve=>setTimeout(resolve,9500));
  if(mode==='failed-config'&&name==='config.js'){res.writeHead(503);res.end('synthetic failed config');return;}
  if(mode==='failed-style'&&name==='app.css'){res.writeHead(503);res.end('synthetic failed style');return;}
  if(mode==='failed-script'&&name==='private-coach.js'){res.writeHead(503);res.end('synthetic failed script');return;}
  res.writeHead(200,{'Content-Type':type,'Cache-Control':'no-store'});res.end(body);
 });
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));const origin=`http://127.0.0.1:${server.address().port}`;
 const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_BROWSER||'chrome'}),results=[];
 try{
  for(mode of before?['stream','scripts']:['stream','scripts','images','styles','long-wait','failed-script','failed-config','failed-style']){
   const scenario=mode;
   const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
   await context.addInitScript(()=>{localStorage.setItem('fatloss.me','hus');Object.defineProperty(navigator,'standalone',{get:()=>true});Object.defineProperty(navigator,'userAgent',{get:()=> 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_2 like Mac OS X) AppleWebKit/605.1.15'});Object.defineProperty(screen,'height',{get:()=>903});});
   const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(origin+'/index.html',{waitUntil:'commit'});await page.waitForTimeout(900);
   const early=await page.evaluate(()=>({paint:performance.getEntriesByName('first-contentful-paint')[0]?.startTime||null,phase:document.querySelector('#lm')?.dataset.phase||null,scrollY,appHidden:!document.querySelector('#appShell')||getComputedStyle(document.querySelector('#appShell')).visibility==='hidden',appLoaded:!!window.duoAppStarted,status:document.querySelector('#launchStatus')?.textContent||''}));
   if(!before){assert(early.paint&&early.paint<900,mode+' paints entry before stalled dependencies: '+JSON.stringify(early));assert(['run','meet'].includes(early.phase),mode+' animation starts independently');assert(early.appHidden,mode+' home stays hidden');assert.equal(early.scrollY,60);}
   if(mode==='scripts')await page.screenshot({path:path.join(out,`${before?'before':'after'}-scripts-390.png`)});
   let diagnostic=null,recovered=false;
   if(!before&&(mode.startsWith('failed-')||mode==='long-wait')){
    await page.locator('#launchRetry').waitFor({state:'visible'});assert(await page.locator('#launchRetry').isEnabled());assert(await page.locator('#launchStatus').innerText());assert.equal(await page.evaluate(()=>window.duoAppStarted||false),false,'failed/slow config must never enter legacy local mode');
    await page.evaluate(()=>{localStorage.setItem('diagnostic-private-fixture','secret-fixture');Object.defineProperty(navigator,'clipboard',{value:{writeText:async text=>window.copiedStartup=text},configurable:true});});
    await page.locator('#launchDiagnostics').click();await page.waitForFunction(()=>!!window.copiedStartup);diagnostic=await page.evaluate(()=>window.copiedStartup);
    assert(diagnostic.startsWith('DuoFit 启动诊断 v60\n'));assert(!/secret-fixture|access_token|refresh_token|user_id|family|目标|体重/.test(diagnostic));
    await page.screenshot({path:path.join(out,`${mode}-390.png`)});
    if(mode==='failed-config'){await page.setViewportSize({width:320,height:480});await page.locator('#launchDiagnostics').scrollIntoViewIfNeeded();assert(await page.locator('#pick').evaluate(el=>el.scrollTop>0));assert.equal(await page.locator('#pick').evaluate(el=>el.getBoundingClientRect().top),0);await page.screenshot({path:path.join(out,'failed-config-short-320.png')});}
    if(mode==='failed-script'){mode='recovered';await Promise.all([page.waitForEvent('framenavigated'),page.locator('#launchRetry').click()]);await page.locator('#pick').waitFor({state:'visible'});await page.locator('#pick').waitFor({state:'hidden'});recovered=true;assert.equal(await page.evaluate(()=>localStorage.getItem('diagnostic-private-fixture')),'secret-fixture');}
   }
   if(!before&&mode==='scripts'){await page.locator('[data-lm-skip]').click();assert.equal(await page.evaluate(()=>window.duoEntry.skipped),true,'skip is remembered before app scripts arrive');}
   if(!scenario.startsWith('failed-')){if(before&&scenario==='stream')await page.locator('#pick').waitFor({state:'visible',timeout:20000});await page.locator('#pick').waitFor({state:'hidden',timeout:20000});await page.waitForTimeout(50);}
   assert.deepEqual(errors,[]);
   results.push({mode:scenario,early,errors,diagnosticCopied:!!diagnostic,privateDataExcluded:diagnostic?!diagnostic.includes('secret-fixture'):null,recovered,final:await page.evaluate(()=>({paint:performance.getEntriesByName('first-contentful-paint')[0]?.startTime||null,version:window.duoBootTrace?.version||null,trace:window.duoBootTrace||null}))});
   await context.close();
  }
  fs.writeFileSync(path.join(out,`${before?'before':'after'}-results.json`),JSON.stringify(results,null,2)+'\n');console.log(before?'BASELINE streamed HTML white gap and script-blocked static entry':'PASS streamed HTML, stalled scripts/images, early animation/skip, retry and native start');
 }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1});
