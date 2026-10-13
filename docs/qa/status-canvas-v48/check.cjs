const {chromium}=require('/tmp/duofit-browser-qa/node_modules/playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const phase=process.argv[2]||'after';
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'}),rows=[];
 try{for(const width of [320,390])for(const person of ['hus','wife'])for(const theme of ['light','dark']){
  const context=await browser.newContext({viewport:{width,height:844},serviceWorkers:'block'});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  for(const view of ['today','diet','train','record']){
   await page.goto(`http://127.0.0.1:8765/tests/theme-preview.html?journal=1&meal-design=1&reference=1&state=daily-rest&person=${person}&theme=${theme}&view=${view}`);
   await page.waitForSelector('body[data-preview-ready="true"]');await page.evaluate(()=>document.fonts.ready);
   await page.evaluate(()=>themePreviewApp.setSync('ok',new Date(2026,9,13,8,36)));
   const row=await page.evaluate(async()=>{
    const root=document.documentElement,hero=document.querySelector('#pageHero'),cs=getComputedStyle(hero),im=new Image();
    im.src=cs.backgroundImage.match(/url\("?([^"\)]+)"?\)/)[1];await im.decode();
    return {heroTop:hero.getBoundingClientRect().top,heroHeight:hero.offsetHeight,cardTop:document.querySelector('#view>*').getBoundingClientRect().top,titleTop:document.querySelector('#pageTitle').getBoundingClientRect().top,
     bodyColor:getComputedStyle(document.body).backgroundColor,rootColor:getComputedStyle(root).backgroundColor,rootImage:getComputedStyle(root).backgroundImage,image:im.src,imageWidth:im.naturalWidth,scrollY,overflow:root.scrollWidth>innerWidth};
   });
   assert(!row.overflow&&row.imageWidth&&row.scrollY===0&&errors.length===0);
   if(phase==='after'){
    assert.equal(row.bodyColor,'rgba(0, 0, 0, 0)');assert.equal(row.rootColor,'rgba(0, 0, 0, 0)');assert(row.rootImage.includes(row.image));assert.equal(row.heroTop,0);
    const before=JSON.parse(fs.readFileSync(path.join(__dirname,'before.json'))).find(x=>x.width===width&&x.person===person&&x.theme===theme&&x.view===view);
    for(const key of ['heroTop','heroHeight','cardTop','titleTop','image'])assert.equal(row[key],before[key],key);
   }
   if(width===390&&view==='today')await page.screenshot({path:path.join(__dirname,`${phase}-${person}-${theme}.png`)});
   await page.evaluate(()=>{window.scrollTo(0,180)});assert.equal(await page.evaluate(()=>scrollY),180);
   await page.evaluate(()=>{window.scrollTo(0,0);themePreviewApp.setSync('offline');document.querySelector('#heroHandB').textContent='今天慢慢来也是很棒的一次进步'});
   assert(await page.locator('#sync').innerText().then(t=>t.includes('离线')));
   rows.push({width,person,theme,view,...row});
  }await context.close();
 }}finally{await browser.close()}
 fs.writeFileSync(path.join(__dirname,`${phase}.json`),JSON.stringify(rows,null,2));console.log(`PASS ${phase}: ${rows.length} layout/image/theme/scroll/sync checks (no native status-bar emulation)`);
})().catch(e=>{console.error(e);process.exit(1)});
