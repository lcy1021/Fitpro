const {chromium} = require('/tmp/duofit-browser-qa/node_modules/playwright');
const assert = require('node:assert/strict');

const base='http://127.0.0.1:8765/tests/theme-preview.html?state=daily-rest&reference=1';

async function pixels(page,clip,points){
  const png=await page.screenshot({type:'png',clip});
  return page.evaluate(async ({source,points})=>{
    const img=new Image();img.src='data:image/png;base64,'+source;await img.decode();
    const canvas=document.createElement('canvas');canvas.width=img.width;canvas.height=img.height;
    const context=canvas.getContext('2d');context.drawImage(img,0,0);
    return points.map(([x,y])=>[...context.getImageData(x,y,1,1).data].slice(0,3));
  },{source:png.toString('base64'),points});
}

(async()=>{
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  const seamChecks=[];
  for(const width of [320,390])for(const person of ['hus','wife'])for(const theme of ['light','dark']){
    const context=await browser.newContext({viewport:{width,height:844},deviceScaleFactor:1,serviceWorkers:'block'});
    const page=await context.newPage();
    for(const view of ['today','diet','train','record']){
      await page.goto(`${base}&view=${view}&person=${person}&theme=${theme}`);
      await page.waitForSelector('body[data-preview-ready="true"]');
      const height=await page.locator('#pageHero').evaluate(el=>el.getBoundingClientRect().height);
      const clip={x:0,y:Math.floor(height)-2,width,height:4};
      const samples=await pixels(page,clip,[[0,0],[0,3],[width-1,0],[width-1,3]]);
      const bg=theme==='dark'?[16,19,24]:[253,250,246];
      for(const sample of samples)assert.deepEqual(sample,bg,`${view}/${person}/${theme}/${width} has a visible page edge`);
      seamChecks.push({view,person,theme,width,edge:samples[0]});
    }
    await context.close();
  }

  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'allow'});
  const page=await context.newPage();
  await page.goto(`${base}&view=today&person=hus&theme=dark`);
  await page.waitForSelector('body[data-preview-ready="true"]');
  await page.evaluate(async()=>{await navigator.serviceWorker.register('/sw.js');await navigator.serviceWorker.ready});
  await page.reload();
  await page.waitForSelector('body[data-preview-ready="true"]');
  await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
  const cached=await page.evaluate(async()=>{
    const cache=await caches.open('duofit-images-v1');
    return (await cache.keys()).map(request=>new URL(request.url).pathname).filter(name=>name.includes('/page-hero/'));
  });
  assert.equal(cached.length,7,'all seven scenes should be warmed independently of the app shell');
  await context.setOffline(true);
  const offline=[];
  for(const view of ['today','diet','train','record']){
    const result=await page.evaluate(async view=>{
      window.themePreviewApp.setMe('wife');window.themePreviewApp.setTab(view);window.themePreviewApp.render();
      const scene=getComputedStyle(document.querySelector('#pageHero')).backgroundImage.match(/url\("?([^"\)]+)"?\)/)?.[1];
      const image=new Image();image.src=scene;await image.decode();
      return {view,scene,width:image.naturalWidth};
    },view);
    assert.equal(result.width,1086,`${view} wife scene should decode offline`);
    offline.push(result);
  }
  await browser.close();
  console.log(`PASS ${seamChecks.length} exact-color scene seams and ${offline.length} wife scenes offline`);
})().catch(error=>{console.error(error);process.exit(1)});
