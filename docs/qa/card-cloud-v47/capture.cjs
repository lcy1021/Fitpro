const {chromium}=require('/tmp/duofit-browser-qa/node_modules/playwright');
const path=require('node:path');

const phase=process.argv[2]||'after';
const base='http://127.0.0.1:8765/tests/theme-preview.html?journal=1&meal-design=1&reference=1&state=daily-rest';

(async()=>{
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  try{
    for(const [person,theme,view,selector,name] of [
      ['hus','light','today','#standModule','stand'],
      ['hus','dark','today','#standModule','stand'],
      ['wife','light','today','#standModule','stand'],
      ['wife','dark','today','#standModule','stand'],
      ['hus','light','today','.ds-meal-scene','today-meals'],
      ['hus','dark','today','.ds-meal-scene','today-meals'],
      ['wife','light','today','.ds-meal-scene','today-meals'],
      ['wife','dark','today','.ds-meal-scene','today-meals'],
      ['hus','light','diet','#nutritionModule','diet-log'],
      ['wife','dark','diet','#nutritionModule','diet-log'],
    ]){
      const context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,serviceWorkers:'block'});
      const page=await context.newPage();
      await page.goto(`${base}&person=${person}&theme=${theme}&view=${view}`);
      await page.waitForSelector('body[data-preview-ready="true"]');
      await page.evaluate(()=>document.fonts.ready);
      await page.locator(selector).first().screenshot({path:path.join(__dirname,`${phase}-${name}-${person}-${theme}-390.png`)});
      await context.close();
    }
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exit(1)});
