const { chromium } = require('/tmp/duofit-browser-qa/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');
const out = path.join(__dirname, 'implementation');
fs.mkdirSync(out, { recursive:true });
const base = 'http://127.0.0.1:8765/tests/theme-preview.html?journal=1&meal-design=1&reference=1&state=daily-rest';

(async () => {
  const browser = await chromium.launch({ headless:true, channel:'chrome' });
  const checks = [];
  for (const person of ['hus','wife']) for (const theme of ['light','dark']) for (const width of [390,320]) {
    const context = await browser.newContext({ viewport:{width,height:844},deviceScaleFactor:3,colorScheme:theme });
    const page = await context.newPage();
    const errors=[];page.on('pageerror',e=>errors.push(e.message));
    for (const view of ['today','diet','train','record']) {
      await page.goto(`${base}&person=${person}&theme=${theme}&view=${view}`);
      await page.waitForSelector('body[data-preview-ready="true"]');
      await page.evaluate(() => {document.querySelector('#syncText').textContent='已同步 · 9:41';document.querySelector('#syncIcon').hidden=false;document.querySelector('#sync').classList.remove('warn');});
      await page.evaluate(()=>document.fonts.ready);
      const measurement=await page.evaluate(()=>{
        const rect=s=>{const e=document.querySelector(s);if(!e)return null;const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height}};
        const style=getComputedStyle(document.querySelector('#pageHero'));
        return {hero:rect('#pageHero'),title:rect('#pageTitle'),date:rect('#dateLabel'),sync:rect('#sync'),firstCard:rect('#view>*'),nav:rect('.tabs'),scene:style.backgroundImage,overflow:document.documentElement.scrollWidth>innerWidth,font:document.fonts.check('24px "DuoFit Long Cang"'),recordDup:!!document.querySelector('#recTitle .ds-mascot-group'),nutritionDup:!!document.querySelector('#nutritionModule .nutrition-value img')};
      });
      checks.push({view,person,theme,width,...measurement,errors:[...errors]});
      const exact=person==='hus'&&theme==='light'&&width===390;
      await page.screenshot({path:path.join(out,`${view}-${person}-${theme}-${width}@3x.${exact?'png':'jpg'}`),...(exact?{}:{type:'jpeg',quality:90})});
    }
    await context.close();
  }
  fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify(checks,null,2)+'\n');
  await browser.close();
  console.log({screens:checks.length,failed:checks.filter(x=>x.overflow||x.errors.length||!x.font)});
})().catch(e=>{console.error(e);process.exit(1)});
