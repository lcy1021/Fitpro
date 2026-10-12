const {chromium} = require('/tmp/duofit-browser-qa/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const out = __dirname;
const base = 'http://127.0.0.1:8765/tests/theme-preview.html?journal=1&meal-design=1&reference=1&state=daily-rest';

(async () => {
  const browser = await chromium.launch({headless:true,channel:'chrome'});
  const checks = [];
  for(const person of ['hus','wife'])for(const theme of ['light','dark'])for(const width of [390,320]){
    const context = await browser.newContext({viewport:{width,height:844},deviceScaleFactor:3,colorScheme:theme,serviceWorkers:'block'});
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror',error=>errors.push(error.message));
    for(const view of ['today','diet','train','record']){
      await page.goto(`${base}&person=${person}&theme=${theme}&view=${view}`);
      await page.waitForSelector('body[data-preview-ready="true"]');
      await page.evaluate(() => {
        document.querySelector('#syncText').textContent='已同步 · 9:41';
        document.querySelector('#syncIcon').hidden=false;
        document.querySelector('#sync').classList.remove('warn');
      });
      const result = await page.evaluate(async () => {
        await document.fonts.ready;
        const hero=document.querySelector('#pageHero');
        const image=getComputedStyle(hero).backgroundImage.match(/url\("?([^"\)]+)"?\)/)?.[1];
        const probe=new Image();probe.src=image;
        let imageLoaded=true;
        try{await probe.decode()}catch{imageLoaded=false}
        const rect=hero.getBoundingClientRect();
        return {scene:image,heroHeight:rect.height,firstCardY:document.querySelector('#view>*').getBoundingClientRect().y,
          imageLoaded,imageBytes:performance.getEntriesByName(image)?.[0]?.encodedBodySize??null,
          fontLoaded:document.fonts.check('24px "DuoFit Long Cang"'),overflow:document.documentElement.scrollWidth>innerWidth,
          background:getComputedStyle(document.documentElement).getPropertyValue('--bg').trim(),
          handColor:getComputedStyle(document.querySelector('.ds-page-hero-hand')).color,
          fade:getComputedStyle(hero,'::after').backgroundImage};
      });
      const name=`${view}-${person}-${theme}-${width}@3x.jpg`;
      await page.screenshot({path:path.join(out,name),type:'jpeg',quality:90});
      checks.push({view,person,theme,width,...result,errors:[...errors]});
      assert(result.imageLoaded,`${name}: scene failed to decode`);
      assert(result.fontLoaded,`${name}: handwriting font missing`);
      assert(!result.overflow,`${name}: horizontal overflow`);
      assert.equal(result.firstCardY,result.heroHeight,`${name}: first card must meet the scene`);
      assert.equal(errors.length,0,`${name}: page error`);
    }
    await context.close();
  }
  fs.writeFileSync(path.join(out,'checks.json'),JSON.stringify(checks,null,2)+'\n');
  await browser.close();
  console.log(`PASS ${checks.length} scene renders, image decodes, font, geometry and script checks`);
})().catch(error=>{console.error(error);process.exit(1)});
