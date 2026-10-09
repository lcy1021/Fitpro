// Synthetic records in an isolated browser; production network is blocked.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const origin='http://127.0.0.1:8765',output=path.join(__dirname,'../docs/qa/partner-records');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_BROWSER||'chromium'});
 try{
  for(const person of ['hus','wife'])for(const theme of ['light','dark'])for(const sharing of ['off','on']){
   const context=await browser.newContext({viewport:{width:390,height:844},colorScheme:theme});
   await context.route('**/*',r=>new URL(r.request().url()).origin===origin?r.continue():r.abort());
   const page=await context.newPage(),errors=[],posts=[];page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(r.method()==='POST')posts.push(r.url())});
   await page.goto(origin+`/tests/theme-preview.html?view=record&person=${person}&theme=${theme}&journal=1&sharing=${sharing}`);await page.waitForSelector('body[data-preview-ready="true"]');
   await page.locator('#mForm input[name="weight"]').fill('77.2');
   const peer=person==='hus'?'wife':'hus';await page.locator(`[data-history-person="${peer}"]`).click();
   assert.equal(await page.locator(`[data-history-person="${peer}"]`).getAttribute('aria-pressed'),'true');
   assert.equal(await page.locator('#mForm input[name="weight"]').inputValue(),'77.2');
   await page.locator('.history-day [data-coach="sharing-refresh"]').click();assert.equal(await page.locator('#mForm input[name="weight"]').inputValue(),'77.2','manual shared refresh preserves draft');
   const detail=page.locator('.history-day');assert.equal(await detail.locator('[data-meal],[data-food]').count(),0,'peer records have no editing actions');
   if(sharing==='on'){
    await detail.getByText('原味酸奶 1 杯、全麦面包 2 片',{exact:true}).waitFor();
    assert((await detail.innerText()).includes('原味酸奶'));assert((await detail.innerText()).includes('280'));assert((await detail.innerText()).includes('已完成'));assert((await detail.innerText()).includes('4 次'));
    const today=await page.evaluate(()=>{const d=new Date();return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')});
    const yesterday=await page.evaluate(()=>{const d=new Date();d.setDate(d.getDate()-1);return [d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-')});
    await page.locator(`[data-history-date="${yesterday}"]`).click();assert((await detail.innerText()).includes('原味酸奶'));assert.equal(await page.locator(`[data-history-person="${peer}"]`).getAttribute('aria-pressed'),'true');
    await page.locator(`[data-history-date="${today}"]`).click();
   }else{assert((await detail.innerText()).includes('已关闭'));assert(!(await detail.innerText()).includes('原味酸奶'));}
   for(const width of [320,390]){
    await page.setViewportSize({width,height:844});await detail.scrollIntoViewIfNeeded();assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));await page.screenshot({path:path.join(output,`${person}-${theme}-${sharing}-${width}.png`)});
   }
   await page.locator(`[data-history-person="${person}"]`).click();assert((await detail.innerText()).includes('鸡蛋'));assert(!(await detail.innerText()).includes('原味酸奶'),'switch back restores own records');
   await page.locator('.private-settings summary').click();await page.locator('[data-coach="sharing-open"]').click();
   assert(await page.locator('#duoCoach').isVisible());assert((await page.locator('#duoCoach').innerText()).includes('体重、围度、目标、健康状态和聊天内容仍仅你可见'));
   assert((await page.locator('#duoCoach').innerText()).includes('当前：已开启'),'default sharing is visible');
   await page.locator('[data-coach="sharing-disable"]').click();assert((await page.locator('#duoCoach').innerText()).includes('当前：未开启'));
   await page.locator('[data-coach="sharing-enable"]').click();assert((await page.locator('#duoCoach').innerText()).includes('当前：已开启'));
   await page.screenshot({path:path.join(output,`${person}-${theme}-settings.png`)});
   await page.locator('[data-coach="sharing-disable"]').click();assert((await page.locator('#duoCoach').innerText()).includes('当前：未开启'));
   assert.deepEqual(errors,[]);assert.deepEqual(posts,[]);await context.close();
  }
  console.log('PASS partner tabs, shared details, unshared explanation, past dates, read-only peer records, unsaved input, default sharing and manual opt-out and 320/390px light/dark layouts');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
