const {chromium} = require('/tmp/duofit-browser-qa/node_modules/playwright');
const path = require('node:path');

const base = 'http://127.0.0.1:8765/tests/theme-preview.html?journal=1&meal-design=1&reference=1&state=daily-rest';
const phase = process.argv[2] || 'after';

(async () => {
  const browser = await chromium.launch({headless:true,channel:'chrome'});
  for (const [person,theme,view] of [['hus','dark','today'],['wife','light','today']]) {
    const context = await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,serviceWorkers:'block'});
    const page = await context.newPage();
    await page.goto(`${base}&person=${person}&theme=${theme}&view=${view}`);
    await page.waitForSelector('body[data-preview-ready="true"]');
    await page.evaluate(async person => {
      await document.fonts.ready;
      document.querySelector('#syncText').textContent='已同步 · 9:41';
      document.querySelector('#syncIcon').hidden=false;
      // A synthetic 62px system inset exposes the root canvas for visual comparison.
      // This is not a native iOS screenshot or proof of installed-app behavior.
      document.documentElement.style.paddingTop='62px';
      const status=document.createElement('div');
      status.className='qa-status';
      status.textContent='9:41                                      ▮▮▮  ◕  ▰';
      Object.assign(status.style,{position:'fixed',top:'0',left:'0',right:'0',height:'62px',zIndex:'9999',padding:'14px 24px',color:person==='wife'?'#102536':'white',font:'700 16px -apple-system, sans-serif',whiteSpace:'pre',pointerEvents:'none'});
      document.body.appendChild(status);
    },person);
    if (phase==='after') await page.evaluate(() => {
      document.documentElement.classList.add('app-hero-under-status');
      document.documentElement.style.setProperty('--ds-pwa-top-gap','62px');
    });
    await page.screenshot({path:path.join(__dirname,`${phase}-${view}-${person}-${theme}-390.png`)});
    await context.close();
  }
  await browser.close();
})().catch(error=>{console.error(error);process.exit(1)});
