const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/tmp/duofit-browser-qa/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  await context.addInitScript(()=>{
   Object.defineProperty(navigator,'userAgent',{get:()=> 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_2 like Mac OS X) AppleWebKit/605.1.15'});
   Object.defineProperty(navigator,'standalone',{get:()=>true});Object.defineProperty(screen,'height',{get:()=>903});
   Object.defineProperty(navigator,'clipboard',{value:{writeText:async value=>{window.copiedDiagnostic=value}}});
  });
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:8765/tests/theme-preview.html?journal=1&meal-design=1&reference=1&state=daily-rest&person=hus&theme=light&view=today');
  await page.waitForFunction(()=>window.themePreviewApp?.pageViewportDiagnostics().trace.firstApplied);
  const first=await page.evaluate(()=>themePreviewApp.pageViewportDiagnostics());
  assert.equal(first.trace.firstApplied.scrollY,60);assert.equal(first.trace.firstApplied.page,'today');assert.equal(first.trace.firstApplied.heroTop,-60);
  await page.evaluate(()=>{scrollTo(0,90);window.dispatchEvent(new Event('touchend'));});
  await page.locator('#appTabs [data-tab="record"]').click();
  await page.locator('.private-settings summary').click();
  await page.locator('[data-coach="connection-copy"]').click();
  const text=await page.evaluate(()=>window.copiedDiagnostic),report=JSON.parse(text.slice(text.indexOf('\n')+1));
  assert(text.startsWith('DuoFit 连接诊断 v60\n'));
  assert.equal(report.page.version,60);assert.equal(report.page.trace.firstApplied.page,'today');assert.equal(report.page.trace.firstUserScroll.scrollY,90);
  assert.equal(report.page.current.page,'record');assert(Array.isArray(report.connection));
  assert(!/fixture-family|local-theme-fixture|恢复码|access_token|refresh_token|腰腹|76/.test(JSON.stringify(report.page)));
  assert.deepEqual(errors,[]);
  fs.writeFileSync(process.env.DUOFIT_DIAGNOSTICS_QA_FILE||'docs/qa/startup-resilience-v60/diagnostics.json',JSON.stringify({passed:true,nativeStatusBarVerified:false,first,report},null,2)+'\n');
  console.log('PASS first-open evidence, first user scroll, cross-tab retention, actual copy button and private-data exclusion');
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
