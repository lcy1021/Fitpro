// Local synthetic data only. Never contact the production backend.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const origin=process.env.DUOFIT_PREVIEW_URL||'http://127.0.0.1:8765';
const output=path.join(__dirname,'../docs/qa/checkin-design');
(async()=>{
  const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_BROWSER||'chromium'});
  try{
    const checks=[];
    for(const person of ['hus','wife'])for(const theme of ['light','dark']){
      const context=await browser.newContext({viewport:{width:390,height:844},colorScheme:theme});
      await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
      const page=await context.newPage(),errors=[],posts=[];
      page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.method()==='POST')posts.push(r.url())});
      await page.goto(origin+`/tests/theme-preview.html?view=diet&person=${person}&theme=${theme}&journal=1`);
      await page.waitForSelector('body[data-preview-ready="true"]');
      assert.equal(await page.locator('.diary-date').count(),7);
      const future=await page.locator('.diary-date[disabled]').count();
      const yesterday=await page.evaluate(()=>{const d=new Date();d.setDate(d.getDate()-1);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')});
      const today=await page.evaluate(()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')});
      // Use a date in the visible week; on Mondays first browse to the previous week.
      const monday=await page.evaluate(()=>new Date().getDay()===1);
      if(monday)await page.locator('[data-diet-week="-1"]').click();
      await page.locator(`[data-diet-date="${yesterday}"]`).click();
      assert.equal(await page.locator('.diary-actions').count(),0,'past records cannot modify today');
      assert.equal(await page.locator('.diary-meal').count(),4);
      assert((await page.locator('.diary-day-title').innerText()).includes('昨天'));
      if(!monday)await page.locator('[data-diet-week="-1"]').click();
      await page.locator('[data-diet-today]').click();
      assert.equal(await page.locator('.diary-date[aria-pressed="true"]').getAttribute('data-diet-date'),today);
      await page.locator('[data-meal="snack"][data-v="skip"]').click();
      assert.equal(await page.locator('[data-meal="snack"][data-v="skip"]').getAttribute('aria-pressed'),'true');
      await page.locator('[data-food="snack"]').click();assert(await page.locator('#foodDlg').isVisible());
      await page.locator('[data-food-close]').click();
      await page.getByRole('button',{name:'记录',exact:true}).click();
      const numbers=await page.locator('.habit-number b').allTextContents();assert.deepEqual(numbers,person==='hus'?['5','3']:['3','5']);
      assert.equal(await page.locator('.habit-day').count(),28);
      await page.locator('#mForm input[name="weight"]').fill('77.2');
      await page.locator(`[data-history-date="${yesterday}"]`).click();
      assert.equal(await page.locator('#mForm input[name="weight"]').inputValue(),'77.2','history navigation keeps unsaved health input');
      assert((await page.locator('.history-day .diary-day-title').innerText()).includes('昨天'));
      await page.locator('[data-history-window="-1"]').click();
      assert.equal(await page.locator('#mForm input[name="weight"]').inputValue(),'77.2');
      await page.locator('[data-history-window="1"]').click();
      for(const view of ['record','diet'])for(const width of [320,390]){
        await page.setViewportSize({width,height:844});
        await page.getByRole('button',{name:view==='diet'?'饮食':'记录',exact:true}).click();
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'no horizontal page overflow');
        const section=page.locator(view==='diet'?'.diet-week':'.checkin-history');await section.scrollIntoViewIfNeeded();
        await page.screenshot({path:path.join(output,`${view}-${person}-${theme}-${width}.png`)});
      }
      assert.deepEqual(errors,[]);assert.deepEqual(posts,[]);
      checks.push({person,theme,futureDaysDisabled:future,pastReadOnly:true,todayMealWorks:true,historyInputPreserved:true,smallScreenFits:true,errors});
      await context.close();
    }
    fs.writeFileSync(path.join(output,'browser-results.json'),JSON.stringify(checks,null,2)+'\n');
    console.log('PASS daily/week history, meal actions, couple streaks, health input preservation, light/dark themes and 320/390px layouts');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
