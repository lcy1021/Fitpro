const {chromium}=require('/tmp/duofit-browser-qa/node_modules/playwright');
const fs=require('node:fs');
const path=require('node:path');
const root=__dirname;
const base='http://127.0.0.1:8765/tests/theme-preview.html?journal=1&meal-design=1&reference=1&state=daily-rest';
(async()=>{
 const browser=await chromium.launch({headless:true,channel:'chrome'}),checks=[];
 for(const person of ['hus','wife'])for(const theme of ['light','dark'])for(const width of [320,390]){
  const context=await browser.newContext({viewport:{width,height:844},deviceScaleFactor:2,colorScheme:theme});
  await context.route('**/*',route=>new URL(route.request().url()).origin==='http://127.0.0.1:8765'?route.continue():route.abort());
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(`${base}&view=diet&person=${person}&theme=${theme}`);
  await page.waitForSelector('body[data-preview-ready="true"]');
  await page.addStyleTag({content:':root{padding-top:59px!important}'});
  await page.evaluate(()=>{const e=document.querySelector('#sync');e.textContent='已同步 · 刚刚';e.classList.remove('warn')});
  const data=await page.evaluate(()=>{
   const html=document.documentElement,body=document.body,a=getComputedStyle(html),b=getComputedStyle(body);
   return {htmlClass:html.className,bodyClass:body.className,rootBackground:a.backgroundImage,bodyBackground:b.backgroundImage,rootMesh:a.getPropertyValue('--mesh').trim(),bodyMesh:b.getPropertyValue('--mesh').trim(),safeAreaPad:a.paddingTop,overflow:html.scrollWidth>innerWidth,firstCardVisible:!!document.querySelector('#view .ds-scene')};
  });
  if(width===390)await page.screenshot({path:path.join(root,`after-${person}-${theme}-390.png`)});
  checks.push({person,theme,width,...data,errors});await context.close();
 }
 const context=await browser.newContext({viewport:{width:390,height:844},colorScheme:'dark'}),page=await context.newPage();
 await page.goto(`${base}&view=today&person=hus&theme=dark`);await page.waitForSelector('body[data-preview-ready="true"]');
 await page.evaluate(()=>{window.themePreviewApp.setMe('wife');window.themePreviewApp.render()});
 checks.push({identitySwitch:await page.evaluate(()=>document.documentElement.classList.contains('me-wife')&&!document.documentElement.classList.contains('me-hus'))});
 await context.close();await browser.close();
 fs.writeFileSync(path.join(root,'checks.json'),JSON.stringify(checks,null,2)+'\n');
 console.log(checks.map(({person,theme,width,htmlClass,bodyClass,safeAreaPad,overflow,firstCardVisible,errors,identitySwitch})=>({person,theme,width,htmlClass,bodyClass,safeAreaPad,overflow,firstCardVisible,errors,identitySwitch})));
 if(checks.some(c=>c.errors?.length||c.overflow||c.rootMesh!==c.bodyMesh||c.firstCardVisible===false||c.identitySwitch===false))process.exit(1);
})().catch(e=>{console.error(e);process.exit(1)});
