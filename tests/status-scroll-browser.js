// Browser contract only: native iOS status-bar compositing still requires a phone.
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'/tmp/duofit-browser-qa/node_modules/playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const out=path.join(__dirname,'../docs/qa/entry-canvas-v58');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'}),results=[];
 try{for(const standalone of [false,true])for(const width of [320,390,430])for(const person of ['hus','wife'])for(const theme of ['light','dark']){
  const ctx=await browser.newContext({viewport:{width,height:844},serviceWorkers:'block'});
  await ctx.addInitScript(standalone=>{Object.defineProperty(navigator,'userAgent',{get:()=> 'Mozilla/5.0 (iPhone; CPU iPhone OS 26_2 like Mac OS X) AppleWebKit/605.1.15'});Object.defineProperty(navigator,'standalone',{get:()=>standalone});Object.defineProperty(screen,'height',{get:()=>903});},standalone);
  const page=await ctx.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const view of ['today','diet','train','record']){
   await page.goto(`http://127.0.0.1:8765/tests/theme-preview.html?journal=1&meal-design=1&reference=1&state=selected&header-spec=1&person=${person}&theme=${theme}&view=${view}`);
   await page.waitForSelector('body[data-preview-ready="true"]');await page.evaluate(()=>document.fonts.ready);
   await page.waitForFunction(v=>scrollY===(v?60:0),standalone);
   const result=await page.evaluate(async()=>{const hero=document.querySelector('#pageHero'),im=new Image();im.src=getComputedStyle(hero).backgroundImage.match(/url\("?([^"\)]+)"?\)/)[1];await im.decode();return{scroll:scrollY,top:hero.getBoundingClientRect().top,height:hero.offsetHeight,card:document.querySelector('#view>*').getBoundingClientRect().top,overflow:document.documentElement.scrollWidth>innerWidth,image:im.src,title:document.querySelector('#pageTitle').getBoundingClientRect().toJSON(),date:document.querySelector('#dateLabel').getBoundingClientRect().toJSON(),sync:document.querySelector('#sync').getBoundingClientRect().toJSON(),titleSize:getComputedStyle(document.querySelector('#pageTitle')).fontSize,glass:getComputedStyle(document.querySelector('.ds-page-hero-info'),'::before').backdropFilter};});
   assert(result.image.endsWith((view==='record'?'record-couple':view+'-'+person)+'-v2.jpg'),'scene identity matches current owner');
   assert.equal(result.top,standalone?-60:0);assert(Math.abs(result.card-(width*1.12-(standalone?60:0)))<.1);assert(!result.overflow);assert.equal(errors.length,0);
   assert.equal(result.titleSize,width===320?'32px':'36px');assert(result.title.right+10<result.date.left);assert(result.date.bottom<=result.sync.top);assert(result.sync.bottom<result.card);
   if(!standalone)await page.screenshot({path:path.join(out,`${view}-${person}-${theme}-${width}.png`)});
   if(standalone&&width===430&&person==='hus'&&view==='today'){
    await page.evaluate(()=>themePreviewApp.setSync('ok',new Date(2026,9,13,8,36)));
    await page.screenshot({path:path.join(out,`after-hus-${theme}.png`)});
   }
   // Reading position survives rerender, foreground, and scroll settlement.
   await page.evaluate(()=>{scrollTo(0,170);themePreviewApp.render();window.dispatchEvent(new Event('pageshow'));});
   await page.waitForTimeout(210);assert.equal(await page.evaluate(()=>scrollY),170);
   // An active touch is not pulled back from the native top.
   await page.evaluate(()=>{window.dispatchEvent(new Event('touchstart'));scrollTo(0,0);});
   await page.waitForTimeout(210);assert.equal(await page.evaluate(()=>scrollY),0);
   await page.evaluate(()=>window.dispatchEvent(new Event('touchend')));
   await page.waitForFunction(v=>scrollY===(v?60:0),standalone);
   // Do not nudge underneath a modal.
   await page.evaluate(()=>{document.querySelector('#foodDlg').classList.add('open');scrollTo(0,0);});
   await page.waitForTimeout(210);assert.equal(await page.evaluate(()=>scrollY),0);
   await page.evaluate(()=>{document.querySelector('#foodDlg').classList.remove('open');window.dispatchEvent(new Event('pageshow'));});
   await page.waitForFunction(v=>scrollY===(v?60:0),standalone);
   results.push({standalone,width,person,theme,view,...result});
  }
  // Actual tab button path also uses the compensated start.
  await page.locator('#appTabs [data-tab="today"]').click();await page.waitForFunction(v=>scrollY===(v?60:0),standalone);
  await ctx.close();
 }}finally{await browser.close()}
 fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(results,null,2));console.log(`PASS ${results.length} standalone/browser, width, role, theme, page and scroll lifecycle checks`);
})().catch(e=>{console.error(e);process.exit(1)});
