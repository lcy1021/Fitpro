const {chromium}=require('/tmp/duofit-browser-qa/node_modules/playwright');
const {execFileSync}=require('node:child_process');const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true}),out=__dirname,results=[];try{
for(const width of [320,390,430])for(const role of ['hus','wife'])for(const theme of ['light','dark']){
 const p=await b.newPage({viewport:{width,height:width===430?932:844},serviceWorkers:'block'});
 for(const view of ['today','diet','train','record']){
 await p.goto(`http://127.0.0.1:8765/tests/theme-preview.html?journal=1&meal-design=1&reference=1&state=selected&person=${role}&theme=${theme}&view=${view}&header-spec=1`);
 await p.waitForSelector('body[data-preview-ready="true"]');await p.evaluate(()=>document.fonts.ready);
 await p.screenshot({path:`${out}/${view}-${role}-${theme}-${width}.png`});
 const base=await p.evaluate(()=>({hero:document.querySelector('#pageHero').getBoundingClientRect().height,first:document.querySelector('#view>*').getBoundingClientRect().top}));
 for(const status of ['ok','offline','syncing']){
 await p.evaluate(s=>themePreviewApp.setSync(s,s==='ok'?null:new Date()),status);
 const v=await p.evaluate(()=>{const sync=document.querySelector('#sync'),date=document.querySelector('#dateLabel');return{first:document.querySelector('#view>*').getBoundingClientRect().top,sync:sync.getBoundingClientRect().toJSON(),date:date.getBoundingClientRect().toJSON(),overflow:document.documentElement.scrollWidth>innerWidth};});
 assert.equal(v.first,base.first);assert(v.date.bottom<=v.sync.top);assert(!v.overflow);
 }
 // Long date is a layout probe, not production data; keep it away from the title.
 const long=await p.evaluate(()=>{document.querySelector('#dateLabel').textContent='2026年10月13日 周二';return{title:document.querySelector('#pageTitle').getBoundingClientRect().right,date:document.querySelector('#dateLabel').getBoundingClientRect().left,overflow:document.documentElement.scrollWidth>innerWidth};});
 assert(long.title+8<long.date);assert(!long.overflow);
 results.push({width,role,theme,view,...base,statesStable:true,longDateFits:true});
 }
 await p.close();
}
const p=await b.newPage({viewport:{width:430,height:932},serviceWorkers:'block'});
await p.route('**/design-system/components.css?*',r=>r.fulfill({contentType:'text/css',body:execFileSync('git',['show','a556e31:design-system/components.css'],{encoding:'utf8'})}));
await p.goto('http://127.0.0.1:8765/tests/theme-preview.html?journal=1&meal-design=1&reference=1&state=selected&person=hus&theme=light&view=today&header-spec=1');await p.waitForSelector('body[data-preview-ready="true"]');await p.evaluate(()=>document.fonts.ready);await p.screenshot({path:`${out}/before-430-matched.png`});
fs.writeFileSync(`${out}/layout-results.json`,JSON.stringify(results,null,2)+'\n');console.log('PASS 48 final captures, sync states and long-date layout checks');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)});
