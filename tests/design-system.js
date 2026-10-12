// Contract checks for CSS extraction: unresolved tokens and missing offline styles
// can break every screen even when the meal rendering tests still pass.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const tokens=read('design-system/tokens.css'),components=read('design-system/components.css');
const definitions=new Set([...`${tokens}\n${components}`.matchAll(/(--[\w-]+)\s*:/g)].map(m=>m[1]));
const references=[...`${tokens}\n${components}`.matchAll(/var\((--[\w-]+)/g)].map(m=>m[1]);
assert.deepEqual([...new Set(references.filter(t=>!definitions.has(t)))],[],'shared CSS must resolve every token');
const html=read('index.html'),preview=read('tests/theme-preview.html'),sw=read('sw.js');
assert(html.includes('name="apple-mobile-web-app-capable" content="yes"')&&html.includes('name="apple-mobile-web-app-status-bar-style" content="black-translucent"'),'installed iOS app can paint beneath the status bar');
assert(html.includes('html{height:100%;background-color:var(--app-top-color);background-image:var(--app-background)')&&html.includes('document.documentElement.classList.toggle("me-wife",me==="wife")'),'root safe-area background follows the active identity');
assert(tokens.includes('--app-background:')&&tokens.includes('--app-top-dark:#172B36')&&html.includes('topColors.getPropertyValue(\'--app-top-dark\')'),'top canvas and browser chrome share role-aware colors');
for(const file of ['tokens.css','components.css','mascots.js']){
 const url=`design-system/${file}?v=47`;
 assert(html.includes(url)&&preview.includes(url)&&sw.includes(url),`${file} must load in the app, preview and offline core`);
}
assert(html.indexOf('tokens.css')<html.indexOf('<style>'),'tokens load before app layouts');
assert(html.indexOf('<link rel="stylesheet" href="design-system/components.css')>html.indexOf('</style>'),'shared components have a documented cascade');
assert(!html.includes('--hus:#')&&!html.includes('--wife:#'),'app must not define a second role palette');
assert(!html.includes('.history-partner-status{'),'role tabs have one owning style');
assert(/\.(?:ds-role-tabs|ds-checkin|ds-section-heading)/.test(components));
assert(sw.includes('duofit-images-v1'),'app releases preserve independently versioned images');
assert(html.indexOf('id="recInsight"')<html.indexOf('id="recHistory"'),'couple check-ins precede individual details');
const gallery=read('design-system/index.html').replace(/<pre>[\s\S]*?<\/pre>/g,'');
for(const file of ['tokens.css','components.css','mascots.js'])assert(gallery.includes(`${file}?v=47`),`${file} uses the current version in the component gallery`);
for(const m of gallery.matchAll(/(?:href|src)="([^"#]+)"/g)){
 const url=m[1].split('?')[0];if(!/^(?:https?:|\/)/.test(url))assert(fs.existsSync(path.resolve(root,'design-system',url)),`gallery resource exists: ${url}`);
}
const checkins=read('tests/scenarios.js');assert(checkins.includes('past')||checkins.includes('historical'),'retain business semantics regression');
console.log('PASS design system token resolution, shared cascade, offline CSS, resource links and reference content order');
