// Real browser proof: entry paints before delayed styles/config, without a layout change.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const origin=process.env.DUOFIT_PREVIEW_URL||'http://127.0.0.1:8765';
const output=path.join(__dirname,'../docs/qa/startup-speed-v59');
const before=process.argv.includes('--before');
const baseline=before?require('node:child_process').execFileSync('git',['show','da32eb4:index.html'],{cwd:path.join(__dirname,'..'),encoding:'utf8'}):null;
(async()=>{
 fs.mkdirSync(output,{recursive:true});
 const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_BROWSER||'chromium'});
 const results=[];
 try{
  for(const width of [320,390])for(const theme of ['light','dark'])for(const person of ['hus','wife']){
   const context=await browser.newContext({viewport:{width,height:932},colorScheme:theme,serviceWorkers:'block'});
   await context.addInitScript(person=>localStorage.setItem('fatloss.me',person),person);
   let releaseConfig;const configReady=new Promise(resolve=>releaseConfig=resolve);
   await context.route('**/*',async route=>{
    const url=new URL(route.request().url());
    if(url.origin!==origin)return route.abort();
    if(url.pathname==='/index.html'&&before)return route.fulfill({contentType:'text/html',body:baseline});
    if(url.pathname.endsWith('.css'))await new Promise(resolve=>setTimeout(resolve,2500));
    if(url.pathname==='/config.js'){await configReady;return route.fulfill({contentType:'application/javascript',body:'window.FATLOSS_CONFIG={};'});}
    await route.continue();
   });
   const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
   await page.goto(origin+'/index.html',{waitUntil:'commit'});
   await page.waitForTimeout(600);
   const early=await page.evaluate(()=>({paint:performance.getEntriesByName('first-contentful-paint')[0]?.startTime||null,entry:!!document.querySelector('#pick')&&getComputedStyle(document.querySelector('#pick')).display!=='none',configLoaded:!!window.FATLOSS_CONFIG,rootImage:getComputedStyle(document.documentElement).backgroundImage}));
   // Chromium screenshots may wait for pending CSS; timing comes from Paint Timing.
   if(!before&&person==='hus'&&theme==='light'&&width===390)await page.screenshot({path:path.join(output,'after-slow-hus-light-390.png')});
   await page.locator('#pick').waitFor({state:'visible'});
   await page.addStyleTag({content:'.lm *,.lm *::before,.lm *::after{animation:none!important;transition:none!important}'});
   await page.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.querySelectorAll('.lm-runner img')].map(img=>img.decode()));document.querySelector('#lm').dataset.phase='run';await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));});
   const name=`${person}-${theme}-${width}`;
   const stable=await page.screenshot({path:path.join(output,`${before?'before':'after'}-run-${name}.png`)});
   let visual=null;
   if(!before){
    assert(early.paint!==null&&early.paint<600,'entry must paint while all external CSS/config are delayed: '+JSON.stringify(early));
    assert(early.entry&&!early.configLoaded,'entry is available before application scripts');
    assert(!early.rootImage.includes('url('),'entry root must not reveal home artwork');
    visual=await page.evaluate(async images=>{
     const pixels=await Promise.all(images.map(async src=>{const image=new Image();image.src=src;await image.decode();const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const ctx=canvas.getContext('2d');ctx.drawImage(image,0,0);return ctx.getImageData(0,0,canvas.width,canvas.height).data;}));
     const runners=[...document.querySelectorAll('.lm-runner img')].map(el=>el.getBoundingClientRect());
     let max=0,total=0,outsideRunnerPixels=0;for(let i=0;i<pixels[0].length;i++){const delta=Math.abs(pixels[0][i]-pixels[1][i]);max=Math.max(max,delta);total+=delta;if(delta){const x=Math.floor(i/4)%innerWidth,y=Math.floor(Math.floor(i/4)/innerWidth);if(!runners.some(r=>x>=r.left-18&&x<=r.right+18&&y>=r.top-18&&y<=r.bottom+18))outsideRunnerPixels++;}}
     return {maxChannelDelta:max,meanChannelDelta:total/pixels[0].length,outsideRunnerPixels};
    },[fs.readFileSync(path.join(output,`before-run-${name}.png`)),stable].map(buffer=>'data:image/png;base64,'+buffer.toString('base64')));
    // Separate stylesheet and inline delivery can rasterize rotated/filter layers slightly
    // differently. A missing/shifted element or palette change exceeds this small bound.
    assert(visual.maxChannelDelta<=40&&visual.meanChannelDelta<0.2&&visual.outsideRunnerPixels===0,'approved entry has no material pixel change: '+name+' '+JSON.stringify(visual));
    assert.equal(await page.locator('#appShell').isVisible(),false);
   }
   releaseConfig();await page.waitForFunction(()=>!!document.querySelector('#lm').onclick);
   await page.locator('[data-lm-skip]').click();await page.locator('#pick').waitFor({state:'hidden'});
   assert.deepEqual(errors,[]);
   results.push({width,theme,person,early,paint:await page.evaluate(()=>performance.getEntriesByName('first-contentful-paint')[0].startTime),visual,skipWorks:true,errors});
   await context.close();
  }
  fs.writeFileSync(path.join(output,`${before?'before':'after'}-paint-results.json`),JSON.stringify(results,null,2)+'\n');
  console.log(`${before?'BASELINE':'PASS'} delayed CSS/config, first contentful paint, 8 unchanged entry variants and skip`);
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
