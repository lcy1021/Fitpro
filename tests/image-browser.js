// Local synthetic fixtures only. Run with a local HTTP server and Playwright installed.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const origin=process.env.DUOFIT_PREVIEW_URL||'http://127.0.0.1:8765';
const output=path.join(__dirname,'../docs/qa/image-loading');
(async()=>{
  const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_BROWSER||'chromium'});
  try{
    const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2});
    await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
    const page=await context.newPage(), requests=[],errors=[];
    page.on('request',r=>requests.push(new URL(r.url()).pathname));page.on('pageerror',e=>errors.push(e.message));
    const checks=[];
    for(const view of ['today','today-short','train','workout']){
      await page.goto(origin+'/tests/theme-preview.html?view='+(view==='today-short'?'today&state=short':view)+'&person=hus&theme=light');
      await page.waitForSelector('body[data-preview-ready="true"]');
      const first=page.locator(view==='workout'?'.rlist .move-art img':'.today-move-preview .move-art img,.obs .move-art img').first();
      if(await first.count())await first.scrollIntoViewIfNeeded();
      const selected=await page.locator('.move-art img').evaluateAll(imgs=>imgs.map(i=>i.currentSrc));
      if(view.startsWith('today')){
        const sizes=await page.locator('.today-move-preview img').evaluateAll(imgs=>imgs.map(i=>({width:i.getBoundingClientRect().width,height:i.getBoundingClientRect().height})));
        assert(sizes.length&&sizes.every(s=>Math.abs(s.height-s.width*.75)<1),'Today previews keep 4:3 ratio on mobile');
      }
      assert(selected.length,view+' contains movement images');assert(selected.every(url=>url.includes('-small.webp?v=media1')),view+' uses small animated WebP');
      await page.screenshot({path:path.join(output,view+'-mobile.png')});checks.push({view,smallImages:selected.length});
      if(view==='workout'){
        await page.locator('[data-run="next"]').click();
        const current=page.locator('.media.exercise-media img');await current.waitFor();await current.evaluate(img=>img.decode());
        assert((await current.getAttribute('fetchpriority'))==='high');
        assert((await current.evaluate(img=>img.currentSrc)).includes('/a-goblet-squat.webp?v=media1'));
        await page.waitForFunction(()=>performance.getEntriesByType('resource').some(r=>r.name.includes('/a-db-row.webp?v=media1')));
        const warmed=requests.filter(p=>p.endsWith('/a-db-row.webp'));assert.equal(warmed.length,1,'only the next movement is warmed once');
        await page.screenshot({path:path.join(output,'follow-mobile.png')});
        await page.setViewportSize({width:320,height:740});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'runner fits small phones');
      }
    }
    assert(!requests.some(p=>p.endsWith('.gif')),'modern browser downloads no GIF fallbacks');assert.deepEqual(errors,[]);
    await page.evaluate(async()=>{await navigator.serviceWorker.register('/sw.js');await navigator.serviceWorker.ready;if(!navigator.serviceWorker.controller)await new Promise(r=>navigator.serviceWorker.addEventListener('controllerchange',r,{once:true}));});
    const url=origin+'/assets/moves/b-floor-press-small.webp?v=media1';
    const first=await page.evaluate(async url=>{const r=await fetch(url);return {ok:r.ok,bytes:(await r.arrayBuffer()).byteLength}},url);assert(first.ok);
    await context.setOffline(true);
    const offline=await page.evaluate(async url=>{const r=await fetch(url);return {ok:r.ok,bytes:(await r.arrayBuffer()).byteLength}},url);assert.deepEqual(offline,first,'downloaded movement is readable offline');
    await context.setOffline(false);
    const stable=await page.evaluate(async()=>({cache:await caches.has('duofit-images-v1'),images:(await (await caches.open('duofit-images-v1')).keys()).length}));assert(stable.cache&&stable.images);
    const result={checks,noGifDownloads:true,nextMovementWarmedOnce:true,smallPhoneFits:true,offlineImageBytes:offline.bytes,stableImageCache:true,pageErrors:errors};
    fs.writeFileSync(path.join(output,'browser-results.json'),JSON.stringify(result,null,2)+'\n');console.log('PASS real browser WebP selection, small/full images, next movement warming, small phone layout and offline cache');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
