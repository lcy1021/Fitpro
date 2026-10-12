const { chromium } = require('/tmp/duofit-browser-qa/node_modules/playwright');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({headless:true,channel:'chrome'});
  const results=[];
  for(const width of [320,390]){
    const page=await browser.newPage({viewport:{width,height:844}});
    await page.goto('http://127.0.0.1:8765/tests/theme-preview.html?view=today&state=daily-rest&person=hus&theme=light');
    await page.waitForSelector('body[data-preview-ready="true"]');
    const result=await page.evaluate(()=>{
      const app=window.themePreviewApp;
      const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}};
      const initial={title:rect(document.querySelector('#pageTitle')),date:rect(document.querySelector('#dateLabel')),sync:rect(document.querySelector('#sync')),first:rect(document.querySelector('#view>*'))};
      app.setSync('ok',null);
      const noTime={text:document.querySelector('#syncText').textContent,icon:document.querySelector('#syncIcon').hidden,first:rect(document.querySelector('#view>*'))};
      app.setSync('ok',new Date(2026,9,12,9,41));
      const ok={text:document.querySelector('#syncText').textContent,icon:document.querySelector('#syncIcon').hidden,color:getComputedStyle(document.querySelector('#sync')).color};
      app.setSync('offline');
      const offline={text:document.querySelector('#syncText').textContent,icon:document.querySelector('#syncIcon').hidden,color:getComputedStyle(document.querySelector('#sync')).color,first:rect(document.querySelector('#view>*'))};
      document.querySelector('.tabs button[data-tab="diet"]').click();
      const diet={title:document.querySelector('#pageTitle').textContent,page:document.querySelector('#pageHero').dataset.page,hand:document.querySelector('#heroHandA').textContent};
      app.setMe('wife');app.render();
      const wife={scene:getComputedStyle(document.querySelector('#pageHero')).backgroundImage,role:document.body.className,hand:document.querySelector('#heroHandA').textContent};
      document.querySelector('.tabs button[data-tab="train"]').click();
      const handText=document.querySelector('#heroHandB');
      const longest={text:handText.textContent,viewport:document.documentElement.scrollWidth>innerWidth,right:handText.getBoundingClientRect().right};
      return {initial,noTime,ok,offline,diet,wife,longest};
    });
    assert.equal(result.noTime.text,'');assert.equal(result.noTime.icon,true);
    assert.equal(result.ok.text,'已同步 · 9:41');assert.equal(result.ok.icon,false);
    assert.equal(result.offline.text,'离线 · 稍后重试');assert.equal(result.offline.icon,true);
    assert.equal(result.initial.first.y,result.noTime.first.y);assert.equal(result.initial.first.y,result.offline.first.y);
    assert.deepEqual(result.diet,{title:'饮食',page:'diet',hand:'好好吃饭'});
    assert.match(result.wife.scene,/diet-wife-v1\.png/);assert.equal(result.wife.role,'me-wife');
    assert.equal(result.longest.viewport,false);assert.ok(result.longest.right<=width);
    results.push({width,...result});await page.close();
  }
  await browser.close();
  console.log(JSON.stringify(results,null,2));
})().catch(error=>{console.error(error);process.exit(1)});
