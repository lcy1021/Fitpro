const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const inline=html.slice(html.lastIndexOf('<script>')+8,html.lastIndexOf('</script>'));
const elements=new Map(),memory=new Map();
function element(key){if(!elements.has(key)){const classes=new Set();elements.set(key,{value:'',hidden:false,innerHTML:'',textContent:'',dataset:{},disabled:false,classList:{add(...xs){xs.forEach(x=>classes.add(x))},remove(...xs){xs.forEach(x=>classes.delete(x))},contains:x=>classes.has(x),toggle(x,on){on?classes.add(x):classes.delete(x)}},addEventListener(){},setAttribute(){},focus(){}});}return elements.get(key);}
const sandbox={window:{FATLOSS_CONFIG:{}},document:{querySelector:element,querySelectorAll:()=>[],body:{style:{}},addEventListener(){},activeElement:{blur(){}}},localStorage:{getItem:k=>memory.get(k)||null,setItem:(k,v)=>memory.set(k,v),removeItem:k=>memory.delete(k)},location:{hash:'',pathname:'/',search:'',protocol:'file:'},history:{replaceState(){}},navigator:{},setTimeout:(fn,ms)=>{const t=setTimeout(fn,ms);t.unref();return t;},clearTimeout,setInterval,clearInterval,requestAnimationFrame:f=>f(),matchMedia:()=>({matches:true}),Date,console,URL,AbortController};
vm.runInNewContext(inline.replace('/* ---------- boot ---------- */','globalThis.app={parseMeal,openFood,onFoodText,aiFood,showAi,drawFoodTotal,saveFood,validMealResult,closeFood,rows:()=>foodRows,init:c=>{me="hus";viewP=me;family="testfamily";privateCoach=c;store={checkins:{},measures:{}};dirty=["pending"];}};return;'),sandbox);
const app=sandbox.app,text='一个豆皮包\n一个200ml脱脂牛奶';
const parsed=app.parseMeal(text);assert.equal(parsed.length,2);assert.equal(parsed[0].k,null);assert.equal(parsed[1].k,70);
const valid={items:[{name:'豆皮包',amount:'1个',kcal:null},{name:'脱脂牛奶',amount:'200ml',kcal:70}],note:'请补充包子的做法'};
assert(app.validMealResult(valid));assert(!app.validMealResult({items:[{name:'食物',amount:'1个',kcal:'70'}]}));assert(!app.validMealResult({items:[{name:'食物',amount:'1个'}]}));
let resolve,calls=0;
const coach={active:true,userId:()=> 'test-user',estimateMeal:()=>{calls++;return new Promise(r=>resolve=r)}};
(async()=>{
  app.init(coach);app.openFood('breakfast');element('#foodText').value=text;app.showAi(valid);
  assert(element('#foodTotal').innerHTML.includes('已估算部分约'));assert(!element('#foodTotal').innerHTML.includes('在计划范围内'));assert(element('[data-food-save]').disabled);
  const before=JSON.stringify(app.rows());app.saveFood();assert.equal(JSON.stringify(app.rows()),before);assert(element('#foodDlg').classList.contains('open'),'incomplete meal cannot be saved');
  let pending=app.aiFood();await app.aiFood();assert.equal(calls,1,'duplicate tap does not start another charged request');
  element('#foodText').value='新的一顿';app.onFoodText();resolve({items:[{name:'旧食物',amount:'1个',kcal:200}],note:''});await pending;assert(!app.rows().some(r=>r.n==='旧食物'),'late reply cannot replace edited text');
  app.openFood('lunch');element('#foodText').value='另一顿';pending=app.aiFood();app.closeFood();app.openFood('dinner');resolve({items:[{name:'午餐',amount:'1份',kcal:500}],note:''});await pending;assert(!app.rows().some(r=>r.n==='午餐'),'late reply cannot replace another meal');
  app.openFood('breakfast');element('#foodText').value='当前这一顿';pending=app.aiFood();resolve(valid);await pending;assert.equal(app.rows()[1].k,70,'private AI is available even with unsynced edits and no local checkins');
  assert(element('[data-food-save]').disabled,'AI may retain an unresolved item');
  coach.estimateMeal=async()=>{throw Object.assign(new Error('no_output'),{code:'no_output'})};element('#foodText').value='失败的这一顿';await app.aiFood();assert(element('#toast').textContent.includes('回复格式异常'));assert(!element('#toast').textContent.includes('换种说法'));assert.equal(element('#foodText').value,'失败的这一顿');assert(!element('[data-food-ai]').disabled);
  app.closeFood();console.log('PASS meal partial totals, validation, pending edits, duplicates and late replies');
})().catch(e=>{console.error(e);process.exitCode=1});
