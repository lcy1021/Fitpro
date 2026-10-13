const {chromium}=require('/tmp/duofit-browser-qa/node_modules/playwright');
const {execFileSync}=require('node:child_process');
(async()=>{const b=await chromium.launch({channel:'chrome'});try{
for(const phase of ['before','after'])for(const theme of ['light','dark']){
 const p=await b.newPage({viewport:{width:430,height:873},serviceWorkers:'block'});
 await p.addInitScript(()=>{Object.defineProperty(navigator,'userAgent',{get:()=> 'iPhone'});Object.defineProperty(navigator,'standalone',{get:()=>true});Object.defineProperty(screen,'height',{get:()=>932});});
 if(phase==='before')await p.route('**/index.html',r=>r.fulfill({contentType:'text/html',body:execFileSync('git',['show','78522a9:index.html'],{encoding:'utf8'})}));
 await p.goto(`http://127.0.0.1:8765/tests/theme-preview.html?journal=1&meal-design=1&reference=1&state=daily-rest&person=hus&theme=${theme}&view=today`);
 await p.waitForSelector('body[data-preview-ready="true"]');await p.evaluate(()=>document.fonts.ready);await p.waitForFunction(n=>scrollY===n,phase==='before'?1:60);
 await p.evaluate(()=>themePreviewApp.setSync('ok',new Date(2026,9,13,9,21)));
 await p.screenshot({path:`docs/qa/status-inset-v51/${phase}-430-${theme}.png`});await p.close();
}}finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)});
