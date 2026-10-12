const {chromium}=require('/tmp/duofit-browser-qa/node_modules/playwright');
const path=require('node:path');
const root=__dirname;
const base='http://127.0.0.1:8765/tests/theme-preview.html?journal=1&meal-design=1&reference=1&state=daily-rest';
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'});
 const checks=[];
 for(const c of [
  {view:'today',person:'hus',theme:'light',width:390},
  {view:'today',person:'hus',theme:'light',width:320},
  {view:'today',person:'wife',theme:'light',width:390},
  {view:'today',person:'hus',theme:'dark',width:390},
  {view:'today',person:'wife',theme:'dark',width:390},
  {view:'diet',person:'hus',theme:'light',width:390},
  {view:'train',person:'wife',theme:'dark',width:390},
  {view:'record',person:'hus',theme:'light',width:390}
 ]){
  const context=await browser.newContext({viewport:{width:c.width,height:844},deviceScaleFactor:2,colorScheme:c.theme});
  await context.route('**/*',route=>new URL(route.request().url()).origin==='http://127.0.0.1:8765'?route.continue():route.abort());
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${base}&view=${c.view}&person=${c.person}&theme=${c.theme}`);
  await page.waitForSelector('body[data-preview-ready="true"]');
  await page.evaluate(()=>{const sync=document.querySelector('#sync');sync.textContent='已同步 · 刚刚';sync.classList.remove('warn')});
  await page.evaluate(async()=>{document.querySelectorAll('img[loading="lazy"]').forEach(i=>i.loading='eager');await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})))});
  const data=await page.evaluate(()=>{
   const $=s=>document.querySelector(s),style=s=>{const e=$(s);return e?{shadow:getComputedStyle(e).boxShadow,border:getComputedStyle(e).borderTopWidth,bg:getComputedStyle(e).backgroundColor}:null};
   const nodes=[...document.querySelectorAll('#view > *')];
   return {overflow:document.documentElement.scrollWidth>innerWidth,order:nodes.map(n=>n.id||n.className),partnerText:$('#view').textContent.includes('伴侣今天'),summary:style('.today-summary-pair'),stand:style('#standModule'),standBody:style('#standModule .ds-module-body'),food:style('.ds-meal-scene'),meal:style('.meal'),scene:style('#view .ds-scene')};
  });
  await page.screenshot({path:path.join(root,`after-${c.view}-${c.person}-${c.theme}-${c.width}.png`),fullPage:true});
  if(c.view==='today'){
   if(c.width===390)await page.screenshot({path:path.join(root,`after-${c.view}-${c.person}-${c.theme}-${c.width}-viewport.png`)});
   data.longTextFits=await page.evaluate(()=>{const e=document.querySelector('.today-summary-pair strong'),old=e.textContent;e.textContent='腰腹、背肩、体态和耐力';const good=document.documentElement.scrollWidth<=innerWidth;e.textContent=old;return good});
   data.status=await page.locator('.today-summary-pair strong').allTextContents();
   await page.locator('.today-summary-pair [data-coach="weekly"]').click();data.weeklyOpens=await page.locator('#duoCoach .coach-top b').innerText()==='新的一周';await page.locator('#duoCoach [data-coach="close"]').click();
   await page.locator('.today-summary-pair [data-coach="daily"]').click();data.dailyOpens=await page.locator('#duoCoach .coach-top b').innerText()==='调整今天';await page.locator('#duoCoach [data-coach="close"]').click();
   const before=await page.locator('#standModule .ctl b').innerText();await page.locator('#standModule [data-stand="1"]').click();const after=await page.locator('#standModule .ctl b').innerText();data.standWorks=before!==after;
  }
  checks.push({...c,...data,errors});await context.close();
 }
 const gallery=await browser.newPage({viewport:{width:390,height:844}});await gallery.goto('http://127.0.0.1:8765/design-system/');const galleryCheck={galleryTodaySample:await gallery.locator('#todayPattern .today-summary-pair').count(),galleryMealSample:await gallery.locator('#todayPattern .ds-meal-scene .meal').count()};await gallery.locator('#roleControl [data-role="wife"]').click();await gallery.locator('#themeControl').selectOption('dark');galleryCheck.gallerySwitches=await gallery.locator('#todayPattern .ds-meal-scene.wife').count()===1&&await gallery.evaluate(()=>document.documentElement.dataset.theme==='dark');await gallery.screenshot({path:path.join(root,'after-gallery-wife-dark-390.png')});checks.push(galleryCheck);await gallery.close();await browser.close();
 require('node:fs').writeFileSync(path.join(root,'checks.json'),JSON.stringify(checks,null,2));
 console.log(JSON.stringify(checks.map(x=>({view:x.view,person:x.person,theme:x.theme,width:x.width,overflow:x.overflow,partnerText:x.partnerText,longTextFits:x.longTextFits,weeklyOpens:x.weeklyOpens,dailyOpens:x.dailyOpens,standWorks:x.standWorks,errors:x.errors,galleryTodaySample:x.galleryTodaySample})),null,2));
})().catch(e=>{console.error(e);process.exit(1)});
