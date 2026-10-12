// Synthetic visual comparison of a selected past day. Never loads production config.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const origin=process.env.DUOFIT_PREVIEW_URL||'http://127.0.0.1:8765';
const output=process.env.DUOFIT_QA_OUTPUT||path.join(__dirname,'../docs/qa/meal-backfill');
const label=process.env.DUOFIT_QA_LABEL||'after';
const scene=process.env.DUOFIT_QA_SCENE||'recorded';
fs.mkdirSync(output,{recursive:true});
(async()=>{
  const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_BROWSER||'chromium'}),results=[];
  try{
    for(const person of ['hus','wife'])for(const theme of ['light','dark'])for(const width of [320,390]){
      const context=await browser.newContext({viewport:{width,height:844},colorScheme:theme});
      await context.route('**/*',route=>new URL(route.request().url()).origin===origin?route.continue():route.abort());
      const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
      await page.goto(`${origin}/tests/theme-preview.html?view=diet&person=${person}&theme=${theme}&journal=1`);
      await page.waitForSelector('body[data-preview-ready="true"]');
      const day=await page.evaluate(({person,scene})=>{
        const date=themePreviewApp.ymd(new Date(Date.now()-(scene==='blank'?5:1)*864e5));
        if(scene!=='blank'){
          const row=themePreviewApp.getCheckin(person,date);
          row.food={...row.food,breakfast:{text:'全麦三明治、鸡蛋和一大杯无糖豆浆，另加水果',items:[{n:'全麦三明治夹鸡蛋、番茄、生菜和芝士',q:'一大份，配无糖豆浆和一份水果',k:450}],kcal:450}};
        }
        themePreviewApp.viewDiet();return date;
      },{person,scene});
      if(!(await page.locator(`[data-diet-date="${day}"]`).count()))await page.locator('[data-diet-week="-1"]').click();
      await page.locator(`[data-diet-date="${day}"]`).click();
      const area=page.locator('.diet-week');await area.scrollIntoViewIfNeeded();
      const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
      assert(!overflow,`${person} ${theme} ${width}px overflows`);assert.deepEqual(errors,[]);
      const edits=await area.locator('[data-food-date]').count();
      await page.addStyleTag({content:'.tabs{visibility:hidden !important}'});
      await area.screenshot({path:path.join(output,`${label}-${person}-${theme}-${width}.png`)});
      results.push({person,theme,width,date:day,editButtons:edits,overflow,errors});
      await context.close();
    }
    fs.writeFileSync(path.join(output,`${label}-matrix.json`),JSON.stringify(results,null,2)+'\n');
    console.log(`PASS ${label} selected past day: 8 screenshots, no overflow or browser errors`);
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
