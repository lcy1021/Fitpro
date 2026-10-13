const {chromium}=require('/tmp/duofit-browser-qa/node_modules/playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{const b=await chromium.launch({channel:'chrome',headless:true});const results=[];try{
for(const width of (process.env.WIDTH?[Number(process.env.WIDTH)]:process.env.BEFORE?[430]:[320,390]))for(const theme of (process.env.BEFORE?['light']:['light','dark']))for(const role of (process.env.BEFORE?['hus']:['hus','wife'])){
const ctx=await b.newContext({viewport:{width,height:932},colorScheme:theme,serviceWorkers:'block'});
await ctx.addInitScript(role=>localStorage.setItem('fatloss.me',role),role);
await ctx.route('**/config.js',()=>{});const p=await ctx.newPage();await p.goto('http://127.0.0.1:8765/index.html',{waitUntil:'commit'});await p.waitForSelector('#pick');
await p.addStyleTag({content:'.lm *{animation:none!important;transition:none!important}'});await p.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.querySelectorAll('.lm-runner img')].map(i=>i.decode()));document.querySelector('#lm').dataset.phase='run'});
await p.screenshot({path:__dirname+`/${process.env.BEFORE?'before':role+'-'+theme}-${width}.png`});
if(!process.env.BEFORE){
for(const phase of ['start','run','meet','choose']){
await p.evaluate(phase=>document.querySelector('#lm').dataset.phase=phase,phase);
const original=await p.locator('#pick').screenshot();
await p.evaluate(()=>document.documentElement.style.backgroundImage='linear-gradient(magenta,magenta)');
const changed=await p.locator('#pick').screenshot();
assert(original.equals(changed),'underlying home must not show through '+[role,theme,width,phase]);
await p.evaluate(()=>document.documentElement.style.removeProperty('background-image'));
}
results.push({role,theme,width,phases:['start','run','meet','choose'],underlayCannotLeak:true});
}await ctx.close();
}
if(!process.env.BEFORE)fs.writeFileSync(__dirname+'/isolation-'+(process.env.WIDTH||'narrow')+'-results.json',JSON.stringify(results,null,2));
console.log(process.env.BEFORE?'Captured before':'PASS '+results.length+' variants / '+results.length*4+' phases: replacing underlying home produces identical intro pixels');
}finally{await b.close()}})().catch(e=>{console.error(e);process.exit(1)});
