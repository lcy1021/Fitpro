const {chromium} = require('/tmp/duofit-browser-qa/node_modules/playwright');
const assert = require('node:assert/strict');

const base='http://127.0.0.1:8765/tests/theme-preview.html?journal=1&meal-design=1&reference=1&state=daily-rest';

(async()=>{
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  const checks=[];
  for(const width of [320,390])for(const person of ['hus','wife'])for(const theme of ['light','dark']){
    const context=await browser.newContext({viewport:{width,height:844},serviceWorkers:'block'});
    const page=await context.newPage();
    const errors=[];page.on('pageerror',error=>errors.push(error.message));
    for(const view of ['today','diet','train','record']){
      await page.goto(`${base}&person=${person}&theme=${theme}&view=${view}`);
      await page.waitForSelector('body[data-preview-ready="true"]');
      const result=await page.evaluate(async()=>{
        const root=document.documentElement,hero=document.querySelector('#pageHero');
        const original=hero.getBoundingClientRect();
        const originalCard=document.querySelector('#view>*').getBoundingClientRect().top;
        const scene=getComputedStyle(hero).backgroundImage;
        const image=new Image();image.src=scene.match(/url\("?([^"\)]+)"?\)/)?.[1];await image.decode();
        root.style.paddingTop='62px';
        root.classList.add('app-hero-under-status');
        root.style.setProperty('--ds-pwa-top-gap','62px');
        const shifted=hero.getBoundingClientRect();
        return {originalHeight:original.height,originalCard,top:shifted.top,height:shifted.height,
          card:document.querySelector('#view>*').getBoundingClientRect().top,
          scene,rootImage:getComputedStyle(root).backgroundImage,
          shade:getComputedStyle(root).getPropertyValue('--ds-hero-top-shade').trim(),
          overflow:root.scrollWidth>innerWidth,imageWidth:image.naturalWidth};
      });
      assert(Math.abs(result.originalCard-result.originalHeight)<.6,`${view}/${person}/${theme}/${width}: original first card`);
      assert(Math.abs(result.top)<.6,`${view}/${person}/${theme}/${width}: scene starts behind the simulated status area`);
      assert(Math.abs(result.height-result.originalHeight-62)<.6,`${view}/${person}/${theme}/${width}: scene extends without moving the first card`);
      assert(Math.abs(result.card-result.originalCard-62)<.6,`${view}/${person}/${theme}/${width}: first card keeps its original screen position`);
      assert(result.rootImage.includes(result.scene.match(/url\("?([^"\)]+)"?\)/)?.[1]),`${view}/${person}/${theme}/${width}: root reuses the same scene`);
      assert(result.imageWidth>0&&!result.overflow&&errors.length===0,`${view}/${person}/${theme}/${width}: image/layout/script`);
      checks.push({view,person,theme,width,...result});
    }
    await context.close();
  }
  await browser.close();
  console.log(`PASS ${checks.length} scene, identity, theme, width and simulated status inset checks`);
})().catch(error=>{console.error(error);process.exit(1)});
