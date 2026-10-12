const { chromium } = require('/tmp/duofit-browser-qa/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');
const out = path.join(__dirname, 'spec');
fs.mkdirSync(out, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless:true, channel:'chrome' });
  const checks = [];
  for (const width of [390,320]) {
    const context = await browser.newContext({ viewport:{width:width===390?850:320,height:1000}, deviceScaleFactor:3, colorScheme:'light' });
    const page = await context.newPage();
    await page.goto('http://127.0.0.1:8765/docs/qa/page-header-proposal/spec.html');
    await page.waitForSelector('body[data-spec-ready="true"]');
    for (const [n,view] of ['today','diet','train','record'].entries()) {
      const frame = page.locator('iframe').nth(n);
      if (width===320) await frame.evaluate(el=>{el.style.width='320px';el.style.height='844px'});
      const handle=await frame.elementHandle();
      const appFrame=await handle.contentFrame();
      const result=await appFrame.evaluate(()=>{
        const rect=selector=>{const e=document.querySelector(selector);if(!e)return null;const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}};
        return {width:innerWidth,hero:rect('.spec-hero'),title:rect('.spec-copy h1'),date:rect('.spec-date'),sync:rect('.spec-sync'),firstCard:rect('#view>*'),tab:rect('.tabs'),overflow:document.documentElement.scrollWidth>innerWidth,font:document.fonts.check('24px LongCangSpec')};
      });
      checks.push({view,width,...result});
      await frame.screenshot({path:path.join(out,`proposed-${view}-${width}@3x.png`)});
    }
    await context.close();
  }
  const context = await browser.newContext({ viewport:{width:850,height:1000},deviceScaleFactor:3,colorScheme:'light' });
  const page = await context.newPage();
  await page.goto('http://127.0.0.1:8765/docs/qa/page-header-proposal/spec.html?sync=none');
  await page.waitForSelector('body[data-spec-ready="true"]');
  const noSync=page.locator('iframe').first();
  await noSync.screenshot({path:path.join(out,'proposed-today-no-sync-390@3x.png')});
  const frame=await (await noSync.elementHandle()).contentFrame();
  const noSyncCheck=await frame.evaluate(()=>{
    const rect=s=>{const r=document.querySelector(s).getBoundingClientRect();return {y:r.y,height:r.height}};
    return {title:rect('.spec-copy h1'),date:rect('.spec-date'),sync:rect('.spec-sync'),firstCard:rect('#view>*'),syncText:document.querySelector('.spec-sync').textContent.trim()};
  });
  checks.push({view:'today-no-sync',width:390,...noSyncCheck});
  await context.close();
  fs.writeFileSync(path.join(out,'spec-checks.json'),JSON.stringify(checks,null,2)+'\n');
  console.log(checks);
  await browser.close();
})().catch(e=>{console.error(e);process.exit(1)});
