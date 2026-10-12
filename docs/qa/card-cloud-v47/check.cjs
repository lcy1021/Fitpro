const {chromium}=require('/tmp/duofit-browser-qa/node_modules/playwright');
const assert=require('node:assert/strict');

const base='http://127.0.0.1:8765/tests/theme-preview.html?journal=1&meal-design=1&reference=1&state=daily-rest';

(async()=>{
  const browser=await chromium.launch({headless:true,channel:'chrome'});
  let checked=0;
  try{
    for(const width of [320,390])for(const person of ['hus','wife'])for(const theme of ['light','dark']){
      const context=await browser.newContext({viewport:{width,height:844},serviceWorkers:'block'});
      const page=await context.newPage();
      const errors=[];page.on('pageerror',e=>errors.push(e.message));
      for(const view of ['today','diet','train','record']){
        await page.goto(`${base}&person=${person}&theme=${theme}&view=${view}`);
        await page.waitForSelector('body[data-preview-ready="true"]');
        const result=await page.evaluate(()=>{
          const scene=document.querySelector('.ds-scene');
          const heading=document.querySelector('.meal>.meal-heading');
          const cs=e=>getComputedStyle(e);
          const firstCard=document.querySelector('#view>*');
          return {
            scene:scene?cs(scene).backgroundImage:'',
            cloud:scene?getComputedStyle(scene,'::before').backgroundImage:'none',
            heading:heading?cs(heading).backgroundImage:'',
            headingCloud:heading?getComputedStyle(heading,'::before').backgroundImage:'none',
            firstCardHeight:firstCard?.getBoundingClientRect().height,
            overflow:document.documentElement.scrollWidth>innerWidth,
          };
        });
        assert(result.scene.includes('linear-gradient'),`${view}/${person}/${theme}/${width}: outer scene gradient`);
        assert.equal(result.cloud,'none',`${view}/${person}/${theme}/${width}: no cloud image on scene`);
        assert.equal(result.headingCloud,'none',`${view}/${person}/${theme}/${width}: no cloud image on meal heading`);
        if(result.heading)assert(result.heading.includes('linear-gradient'),`${view}/${person}/${theme}/${width}: meal heading gradient`);
        assert(!result.overflow&&result.firstCardHeight>0&&errors.length===0,`${view}/${person}/${theme}/${width}: layout and script`);
        if(view==='today'&&width===320){
          await page.evaluate(()=>{
            document.querySelector('#standModule .ds-module-heading p').textContent='给久坐的身体一个小休息，站起来活动一下肩背和双腿，再按自己的节奏继续今天的工作。'.repeat(2);
          });
          const longText=await page.evaluate(()=>{
            const card=document.querySelector('#standModule');
            const heading=card.querySelector('.ds-module-heading');
            const body=card.querySelector('.ds-module-body');
            return {overflow:card.scrollWidth>card.clientWidth,overlap:heading.getBoundingClientRect().bottom>body.getBoundingClientRect().top};
          });
          assert(!longText.overflow&&!longText.overlap,`today/${person}/${theme}/${width}: long heading text`);
        }
        if(view==='today'&&width===390&&person==='hus'&&theme==='light'){
          const counter=page.locator('#standModule .ctl b');
          assert.match(await counter.textContent(),/^4/);
          await page.locator('#standModule [data-stand="1"]').click();
          assert.match(await counter.textContent(),/^5/,'stand control still responds');
          const meal=page.locator('.meal').first();
          await meal.getByRole('button',{name:'吃多了'}).click();
          assert.equal(await meal.getByRole('button',{name:'吃多了'}).getAttribute('aria-pressed'),'true','meal status still responds');
        }
        checked++;
      }
      await context.close();
    }
  }finally{await browser.close();}
  console.log(`PASS ${checked} role/theme/width/page gradients, no cloud layers, long text, layout and controls`);
})().catch(e=>{console.error(e);process.exit(1)});
