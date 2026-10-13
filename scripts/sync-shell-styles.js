// Static HTML stays directly deployable. CSS files remain the only editable source.
// Run after changing shared CSS; --check verifies the generated snapshots in tests.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.join(__dirname,'..'),htmlPath=path.join(root,'index.html');
let html=fs.readFileSync(htmlPath,'utf8');
for(const source of ['design-system/tokens.css','entry.css']){
 const css=fs.readFileSync(path.join(root,source),'utf8').replace(/url\((['"]?)([^)'"\s]+)\1\)/g,(match,quote,url)=>{
  if(/^(?:[a-z]+:|\/|#)/i.test(url))return match;
  return `url(${quote}${path.posix.normalize(path.posix.join(path.posix.dirname(source),url))}${quote})`;
 });
 const snapshot=new RegExp(`<style data-shell-source="${source.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\?v=\\d+">\\n([\\s\\S]*?)</style>`);
 const current=html.match(snapshot);
 if(process.argv.includes('--check')){
  assert(current,`missing inline shell stylesheet: ${source}`);
  assert.equal(current[1],css,`run node scripts/sync-shell-styles.js after editing ${source}`);
 }else{
  const version=fs.readFileSync(path.join(root,'app.js'),'utf8').match(/return \{version:(\d+),userAgent/)[1];
  const block=`<style data-shell-source="${source}?v=${version}">\n${css}</style>`;
  if(current)html=html.replace(snapshot,()=>block);
  else html=html.replace(new RegExp(`<link rel="stylesheet" href="${source.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}\\?v=\\d+">`),()=>block);
 }
}
const entrySource=fs.readFileSync(path.join(root,'entry.js'),'utf8');
const script=/<script id="entryBoot" data-shell-script="entry\.js\?v=\d+">\n([\s\S]*?)<\/script>/;
if(process.argv.includes('--check'))assert.equal(html.match(script)?.[1],entrySource,'run node scripts/sync-shell-styles.js after editing entry.js');
else html=html.replace(script,()=>`<script id="entryBoot" data-shell-script="entry.js?v=${entrySource.match(/version:(\d+)/)[1]}">\n${entrySource}</script>`);
if(!process.argv.includes('--check'))fs.writeFileSync(htmlPath,html);
console.log('PASS inline shell styles match canonical CSS (document-relative asset URLs)');
