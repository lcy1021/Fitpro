const { chromium } = require('/tmp/duofit-browser-qa/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');

const out = path.join(__dirname, 'spec');
fs.mkdirSync(out, { recursive: true });
const base = 'http://127.0.0.1:8765/tests/theme-preview.html?journal=1&meal-design=1&reference=1&state=daily-rest&person=hus&theme=light';

(async () => {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const measures = {};
  for (const view of ['today', 'diet', 'train', 'record']) {
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, colorScheme: 'light' });
    const page = await context.newPage();
    await page.goto(`${base}&view=${view}`);
    await page.waitForSelector('body[data-preview-ready="true"]');
    await page.addStyleTag({ content: ':root{padding-top:59px!important}' });
    await page.evaluate(() => { const e = document.querySelector('#sync'); e.textContent = '已同步 · 9:41'; e.classList.remove('warn'); });
    await page.screenshot({ path: path.join(out, `current-${view}-390@3x.png`) });
    measures[view] = await page.evaluate(() => {
      const keys = ['.wrap', '.head', '#pageTitle', '#dateLabel', '#sync', '#view', '#view>*', '.tabs'];
      const result = {};
      for (const key of keys) {
        const e = document.querySelector(key); if (!e) continue;
        const r = e.getBoundingClientRect(); const s = getComputedStyle(e);
        result[key] = { x:r.x, y:r.y, width:r.width, height:r.height, marginTop:s.marginTop, marginBottom:s.marginBottom, padding:s.padding, text:e.textContent.trim().replace(/\s+/g,' ').slice(0,120) };
      }
      result.firstChildren = [...document.querySelector('#view').children].slice(0,5).map(e=>{const r=e.getBoundingClientRect();return { tag:e.tagName, class:e.className, id:e.id, y:r.y, height:r.height, text:e.textContent.trim().replace(/\s+/g,' ').slice(0,70) }});
      return result;
    });
    await context.close();
  }
  fs.writeFileSync(path.join(out, 'current-measures.json'), JSON.stringify(measures, null, 2) + '\n');
  await browser.close();
  console.log(path.join(out, 'current-measures.json'));
})().catch(e => { console.error(e); process.exit(1); });
