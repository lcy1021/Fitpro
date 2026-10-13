// Contract checks for CSS extraction: unresolved tokens and missing offline styles
// can break every screen even when the meal rendering tests still pass.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const tokens=read('design-system/tokens.css'),components=read('design-system/components.css');
const definitions=new Set([...`${tokens}\n${components}`.matchAll(/(--[\w-]+)\s*:/g)].map(m=>m[1]));
const references=[...`${tokens}\n${components}`.matchAll(/var\((--[\w-]+)/g)].map(m=>m[1]);
assert.deepEqual([...new Set(references.filter(t=>!definitions.has(t)))],[],'shared CSS must resolve every token');
const html=read('index.html'),app=read('app.js'),entry=read('entry.css'),preview=read('tests/theme-preview.html'),sw=read('sw.js');
assert(html.includes('name="apple-mobile-web-app-capable" content="yes"')&&html.includes('name="apple-mobile-web-app-status-bar-style" content="black-translucent"'),'installed iOS app can paint beneath the status bar');
assert(entry.includes('html{height:100%;background-color:transparent;')&&entry.includes('html.me-wife{--ds-root-hero-image:')&&app.includes('document.documentElement.classList.toggle("me-wife",me==="wife")'),'root safe-area background follows the active identity');
assert(html.includes('class="me-hus app-entry-active"')&&html.includes('html.app-entry-active{background-color:transparent;background-image:var(--ds-entry-background)'),'entry owns the initial whole-page canvas');
assert(tokens.includes('--app-background:')&&tokens.includes('--app-top-dark:#172B36')&&app.includes('topColors.getPropertyValue(\'--app-top-dark\')'),'top canvas and browser chrome share role-aware colors');
for(const file of ['tokens.css','components.css','mascots.js']){
 const url=`design-system/${file}?v=60`;
 assert(html.includes(url)&&preview.includes(url)&&sw.includes(url),`${file} must load in the app, preview and offline core`);
}
assert(html.indexOf('tokens.css')<html.indexOf('<style data-shell-source="entry.css'),'tokens load before entry layouts');
assert(html.indexOf('app.css?v=60')<html.indexOf('design-system/components.css?v=60'),'shared components keep the documented cascade');
assert(html.indexOf('id="pick"')<html.indexOf('class="icon-sprite"'),'entry precedes app markup and SVG sprite');
assert(html.indexOf('id="entryBoot"')<html.indexOf('id="appShell"'),'animation starts before app DOM and deferred script execution');
require('node:child_process').execFileSync(process.execPath,[path.join(root,'scripts/sync-shell-styles.js'),'--check']);
const appCSS=html.replace(/<style data-shell-source="[^"]+">[\s\S]*?<\/style>/g,'');
assert(!appCSS.includes('--hus:#')&&!appCSS.includes('--wife:#'),'app must not define a second role palette');
assert(!html.includes('.history-partner-status{'),'role tabs have one owning style');
assert(/\.(?:ds-role-tabs|ds-checkin|ds-section-heading)/.test(components));
assert(sw.includes('duofit-images-v1'),'app releases preserve independently versioned images');
assert(app.indexOf('id="recInsight"')<app.indexOf('id="recHistory"'),'couple check-ins precede individual details');
const gallery=read('design-system/index.html').replace(/<pre>[\s\S]*?<\/pre>/g,'');
for(const file of ['tokens.css','components.css','mascots.js'])assert(gallery.includes(`${file}?v=60`),`${file} uses the current version in the component gallery`);
for(const m of gallery.matchAll(/(?:href|src)="([^"#]+)"/g)){
 const url=m[1].split('?')[0];if(!/^(?:https?:|\/)/.test(url))assert(fs.existsSync(path.resolve(root,'design-system',url)),`gallery resource exists: ${url}`);
}
const checkins=read('tests/scenarios.js');assert(checkins.includes('past')||checkins.includes('historical'),'retain business semantics regression');
const font=JSON.parse(read('docs/qa/startup-resilience-v60/font-subset.json'));
const headerCopy=app.slice(app.indexOf('const hand={'),app.indexOf('$("#heroHandA")'));
for(const pair of headerCopy.matchAll(/\["([^"]*)","([^"]*)"\]/g))for(const char of pair[1]+pair[2])assert(font.characters.includes(char),'header subset covers '+char);
assert(font.outlineAndMetricsMatch&&font.outputBytes<32768&&components.includes('DuoFit-Header-v1.woff2'),'small header font preserves original glyphs and metrics');
console.log('PASS design system token resolution, shared cascade, offline CSS, resource links and reference content order');
