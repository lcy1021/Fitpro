// Exercise the actual entry flow with synthetic local data and a mocked cloud.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
const origin=process.env.DUOFIT_PREVIEW_URL||'http://127.0.0.1:8765';
const output=path.join(__dirname,'../docs/qa/startup');
const coachSource=fs.readFileSync(path.join(__dirname,'../private-coach.js'),'utf8');
(async()=>{
  fs.mkdirSync(output,{recursive:true});
  const browser=await chromium.launch({headless:true,channel:process.env.PLAYWRIGHT_BROWSER||'chromium'});
  const checks=[];
  try{
    for(const mode of ['cached','skip','reduced','guest','guest-skip','cold','missing-session','local']){
      const context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:mode==='reduced'?'reduce':'no-preference'});
      await context.addInitScript(mode=>{
        localStorage.clear();window.startupEvents=[];
        const date=new Date(),day=[date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');
        const monday=new Date(date);monday.setDate(date.getDate()-((date.getDay()+6)%7));
        const week=[monday.getFullYear(),String(monday.getMonth()+1).padStart(2,'0'),String(monday.getDate()).padStart(2,'0')].join('-');
        const profile={version:1,goals:['建立运动习惯'],focus:['全身'],age:32,height:172,weight:76,target:'',health:['暂时没有'],frequency:'每周 3 次',duration:'10 分钟',equipment:[],diet:'',notes:['','',''],confirmedAt:new Date().toISOString(),planStartDate:day};
        window.fixturePull={member:{person:'hus',family:'fixture-family'},profile,checkins:[],measures:[],weeks:[{weekStart:week,body:{reviewedAt:new Date().toISOString()}}],partnerActivity:[],partnerTrend:[]};
        if(!['guest','guest-skip','local','missing-session'].includes(mode)){
          localStorage.setItem('duofit.auth.v1',JSON.stringify({access_token:'fixture',refresh_token:'fixture',expires_at:Date.now()/1000+3600,user:{id:'fixture-user'}}));
          localStorage.setItem('duofit.paired.v1','1');
          if(mode!=='cold')localStorage.setItem('duofit.profile.v1.fixture-user',JSON.stringify({member:window.fixturePull.member,profile,weeks:{[week]:{reviewedAt:new Date().toISOString()}}}));
        }
        if(mode==='missing-session')localStorage.setItem('duofit.paired.v1','1');
        if(mode==='local')localStorage.setItem('fatloss.me','hus');
        document.addEventListener('DOMContentLoaded',()=>{
          const view=document.querySelector('#view');
          new MutationObserver(()=>window.startupEvents.push({type:'render',phase:document.querySelector('#lm').dataset.phase,booting:document.body.classList.contains('booting')})).observe(view,{childList:true});
        });
      },mode);
      let releaseConfig;const configReady=new Promise(resolve=>releaseConfig=resolve);
      let releaseCloud;const cloudReady=new Promise(resolve=>releaseCloud=resolve);
      const requests=[],errors=[];
      await context.route('**/*',async route=>{
        const url=new URL(route.request().url());
        if(url.origin!==origin){route.abort();return;}
        if(url.pathname==='/config.js'){
          await configReady;
          await route.fulfill({contentType:'application/javascript',body:mode==='local'?'window.FATLOSS_CONFIG={};':'window.FATLOSS_CONFIG={SUPABASE_URL:location.origin,SUPABASE_KEY:"sb_fixture"};'});return;
        }
        if(url.pathname==='/private-coach.js'){
          await route.fulfill({contentType:'application/javascript',body:coachSource+`\nDuoCoach.prototype.signInAnonymous=async function(){this.session={access_token:'fixture',user:{id:'guest-fixture'}};};\nDuoCoach.prototype.rpc=async function(){window.startupEvents.push({type:'cloud',booting:document.body.classList.contains('booting')});return await (await fetch('/fixture-pull')).json();};`});return;
        }
        if(url.pathname==='/fixture-pull'){
          requests.push('cloud');await cloudReady;
          await route.fulfill({contentType:'application/json',body:JSON.stringify(await page.evaluate(()=>window.fixturePull))});return;
        }
        await route.continue();
      });
      const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
      page.on('request',r=>requests.push(new URL(r.url()).pathname));
      await page.goto(origin+'/index.html',{waitUntil:'commit'});
      await page.locator('#pick').waitFor({state:'visible'});
      assert.equal(await page.locator('#appShell').isVisible(),false,'no Today flash while scripts are still loading');
      assert.equal(await page.locator('#appTabs').isVisible(),false);
      assert.equal(await page.locator('#view').innerHTML(),'');
      assert.equal(await page.locator('#lm').getAttribute('data-phase'),'start');
      if(mode==='cached')await page.screenshot({path:path.join(output,'first-paint-mobile.png')});
      releaseConfig();
      if(mode!=='local')await page.waitForSelector('#duoCoach',{state:'attached'});
      if(['skip','guest-skip'].includes(mode))await page.locator('[data-lm-skip]').click();
      if(mode==='cold'){
        await page.waitForFunction(()=>window.startupEvents.some(e=>e.type==='cloud'));
        assert.equal(await page.locator('#view').innerHTML(),'','cold load does not render behind animation');
        releaseCloud();
      }
      if(mode.startsWith('guest')){
        await page.waitForFunction(()=>document.querySelector('#lm').dataset.phase==='choose');
        await page.locator('#lmChoice').waitFor({state:'visible'});assert.equal(await page.locator('#view').innerHTML(),'');
        assert.equal(await page.evaluate(()=>document.body.classList.contains('booting')),false);
      }else{
        await page.locator('#pick').waitFor({state:'hidden'});
        if(mode==='missing-session'){
          assert(await page.locator('[data-coach="startup-retry"]').isVisible());
          assert.equal(await page.locator('#view').innerHTML(),'');
        }else{
          assert(await page.locator('#view').innerHTML());
          const events=await page.evaluate(()=>window.startupEvents);
          assert(!events.some(e=>e.type==='render'&&e.phase==='run'),'no home construction during running animation');
          if(['cached','skip','reduced'].includes(mode)){
            assert.equal(events.filter(e=>e.type==='render').length,1,'cached home is constructed once before background sync');
            assert(!events.some(e=>e.type==='cloud'&&e.booting),'cached cloud sync waits until entry completes');
          }
          if(mode==='cached')await page.screenshot({path:path.join(output,'home-mobile.png')});
        }
      }
      releaseCloud();
      assert.deepEqual(errors,[],mode+' has no browser exceptions');
      checks.push({mode,initialHomeHidden:true,entryFinished:true,errors});await context.close();
    }
    fs.writeFileSync(path.join(output,'browser-results.json'),JSON.stringify(checks,null,2)+'\n');
    console.log('PASS first paint, cached/cold/local startup, guest selection, skip, reduced motion and recovery error');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
