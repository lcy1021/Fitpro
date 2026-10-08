const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');assert(fs.readFileSync(path.join(root,'sw.js'),'utf8').includes('notificationclick'),'push click handler');
assert(html.indexOf('<script src="config.js"></script>') < html.indexOf('<script src="private-coach.js"></script>'), 'config loads before coaching');
const inline = html.slice(html.lastIndexOf('<script>') + 8, html.lastIndexOf('</script>'));
const memory = new Map();
const elements = new Map();
const element = key => {
  if (!elements.has(key)) {const classes=new Set();elements.set(key, {innerHTML: '', textContent: '', value: '', hidden: false, dataset:{}, classList: {add(...xs){xs.forEach(x=>classes.add(x))}, remove(...xs){xs.forEach(x=>classes.delete(x))}, contains(x){return classes.has(x)}}, addEventListener(){}, setAttribute(){}, querySelector(){return null}});}
  return elements.get(key);
};
const sandbox = {
  window: {FATLOSS_CONFIG: {}}, localStorage: {getItem:k=>memory.get(k) ?? null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)},
  document: {querySelector:element,querySelectorAll:()=>[],getElementById:element,body:{style:{}},addEventListener(){},activeElement:{blur(){}}},
  location: {hash:'',pathname:'/',search:'',protocol:'file:'}, history:{replaceState(){}}, navigator:{},
  setTimeout, clearTimeout, setInterval, clearInterval, requestAnimationFrame:f=>f(), matchMedia:()=>({matches:true}), console, Date, AbortController, URL,
};
const exported = ['calcPlan','menuFor','dayRange','scheduleFor','dayDone','viewToday','viewDiet','viewTrain','viewRecord','renderRecordData','goalCard','roundsFor','ymd','MEALS','goalOf','getCheckin','planFor','buildSteps','feedRows','openPicker','showRoleChoice'];
const code = inline.replace('/* ---------- boot ---------- */', `globalThis.__app = {${exported.join(',')}, setStore:v=>{store=v},setMe:v=>{me=v;viewP=v},setViewP:v=>{viewP=v},setCoach:v=>{privateCoach=v},setTab:v=>{tab=v}};return;`);
vm.runInNewContext(code, sandbox, {filename:'index-inline.js'});
const app = sandbox.__app;
app.openPicker(false);assert(element('#pick').classList.contains('open'),'original animation picker opens');assert.equal(element('#lm').dataset.phase,'choose','reduced motion lands on role choice');
const date = app.ymd(new Date());
const goal = (start,target) => ({height:170,age:32,start,target,pace:'gentle',adj:0,level:0,cardio:false,at:date});
const meals = Object.fromEntries([...app.MEALS].map(m=>[m,'plan']));
app.setMe('hus');
app.setStore({checkins:{['hus_'+date]:{person:'hus',date,meals,workout:'done'},['wife_'+date]:{person:'wife',date,meals,workout:'done'}},measures:{['hus_'+date]:{person:'hus',date,weight:78,goal:goal(78,72)},['wife_'+date]:{person:'wife',date,weight:47.3,goal:goal(47.3,46),waist:63}}});
assert(app.planFor('hus').kcal >= 1500, 'historical kcal floor');
assert(app.dayRange('hus')[0] > 0, 'historical menu calculates');
assert(app.menuFor('hus').breakfast.items.length > 0, 'historical menu preserved');assert(app.dayDone('hus',new Date()),'historical full day checkin');assert.equal(app.buildSteps('A').at(-1).type,'end','historical workout flow');
app.viewToday(); assert(element('#view').innerHTML.includes('今天两个人的进度'), 'historical partner progress');
app.viewTrain(); assert(element('#view').innerHTML.includes('这周两个人的安排'), 'historical weekly view');
app.viewDiet(); assert(element('#view').innerHTML.includes('看谁的计划'), 'historical diet switch');
app.viewRecord();app.renderRecordData();assert(element('#recPair').innerHTML.includes('47.3'), 'historical record view');
const coach = {active:true,person:'hus',profile:{goals:['减脂'],focus:['腰腹']},goalTitle(){return '减脂'},partnerChecked(){return true},partnerCard(){return '<div>relative only</div>'},dailyCard(){return '<div>daily coach</div>'},weeklyCard(){return '<div>weekly coach</div>'},pushCard(){return '<div>push coach</div>'},mealSwap(){return '鸡蛋和蔬菜'},schedule(_,base){return base}};
app.setCoach(coach);
app.viewToday();assert(element('#view').innerHTML.includes('伴侣今天已打卡'));assert(!element('#view').innerHTML.includes('今天两个人的进度'));assert(!element('#view').innerHTML.includes('47.3'));
coach.profile.diet='不吃奶制品';app.viewToday();assert(!element('#view').innerHTML.includes('脱脂牛奶'),'restricted diet hides default foods');app.setViewP('wife');app.viewDiet();assert(!element('#view').innerHTML.includes('看谁的计划'));assert(!element('#view').innerHTML.includes('47.3'));assert(element('#view').innerHTML.includes('鸡蛋和蔬菜'));assert(!element('#view').innerHTML.includes('晚餐轮换'),'restricted diet hides generic dinner rotation');
app.setViewP('wife');app.viewTrain();assert(!element('#view').innerHTML.includes('这周两个人的安排'));assert(!element('#view').innerHTML.includes('老婆 · 居家臀腿'));
app.viewRecord();app.renderRecordData();assert(!element('#recPair').innerHTML.includes('47.3'));assert(element('#recPair').innerHTML.includes('relative only'));assert(!element('#recData').innerHTML.includes('47.3'));
coach.schedule=()=>({kind:'rest'});assert.equal(app.scheduleFor('hus',new Date()).kind,'rest','daily rest override');
console.log('PASS historical plan, menu, partner views; PASS private today, diet, train, record, schedule');

// Run the actual coaching class with mocked IO for the new state transitions.
const classSandbox = {window:{FATLOSS_CONFIG:{}},navigator:{clipboard:{writeText:async()=>{}}},localStorage:sandbox.localStorage,document:{},console:{warn(){}},Date,setTimeout,clearTimeout,crypto:require('node:crypto').webcrypto,TextEncoder};
vm.runInNewContext(fs.readFileSync(path.join(root,'private-coach.js'),'utf8'),classSandbox,{filename:'private-coach.js'});
const DuoCoach = classSandbox.window.DuoCoach;
let latest = {person:'hus',date};
const c = new DuoCoach({getCheckin:()=>latest,putCheckin:v=>{latest=v},render(){},saveLegacyGoal(){},setIdentity(){},setStore(){},family:()=>''});
c.member={person:'hus',family:'abcdefgh'};c.root={hidden:false,innerHTML:'',dataset:{}};c.draft={...c.blank(),age:'32',height:'170',weight:'78',goals:['减脂'],focus:['腰腹'],health:['身体疼痛'],frequency:'每周 3 次',duration:'20 分钟',diet:'不吃奶制品'};
assert(Object.values(c.proposedPlan().days).every(x=>x==='REST'),'painful week rests');assert.equal(new Date(Object.keys(c.proposedPlan().days)[0]+'T12:00:00Z').getUTCDay(),1,'week starts Monday');assert.equal(c.legacyDraft({['hus_'+date]:{person:'hus',date,weight:77}}).weight,77,'existing weight prefilled');c.draft.health=['暂时没有'];assert(Object.values(c.proposedPlan().days).includes('N'),'no dumbbells selects bodyweight workout');c.draft.notes[1]='最近膝盖疼';assert(Object.values(c.proposedPlan().days).every(x=>x==='REST'),'free text pain blocks exercise');c.draft.notes[1]='';c.draft.health=['身体疼痛'];
c.profile={...c.draft,confirmedAt:new Date().toISOString()};c.dailyState='身体疼痛';c.dailyTime='按原计划';c.coachAI=async()=>({choice:'original'});
(async()=>{
  await c.saveDaily();assert.equal(latest.dailyChoice,'rest','AI cannot override pain');assert.equal(c.schedule(date,{kind:'train',w:'A'}).kind,'rest');
  c.dailyState='状态不错';c.dailyTime='只有 10 分钟';c.coachAI=async()=>null;await c.saveDaily();assert.equal(latest.dailyChoice,'short');
  c.draft.health=['暂时没有'];c.step=2;c.draft.frequency='每周 3 次';c.draft.duration='20 分钟';
  const basePlan=c.proposedPlan();const dates=Object.keys(basePlan.days);let aiCalls=0;
  c.coachAI=async mode=>{aiCalls++;return mode==='plan'?{summary:'建议',plan:{days:Object.fromEntries(dates.map((d,i)=>[d,i===0?'A':'REST'])),mealSwaps:{breakfast:'鸡蛋和水果'}}}:{plan:{days:Object.fromEntries(dates.map(d=>[d,'A']))}}};
  const calls=[];c.rpc=async(name,args)=>{calls.push({name,args})};
  await c.confirmStep();assert.equal(c.step,3);assert(!Object.values(c.previewPlan.days).includes('A'),'incompatible AI equipment is rejected');assert(c.root.innerHTML.includes('鸡蛋和水果'),'fourth card previews AI diet');assert.equal(calls.length,0,'no save before confirmation');
  await c.confirmStep();assert(calls.some(x=>x.name==='fl_private_put_profile'));assert(calls.some(x=>x.name==='fl_private_put_week'&&x.args.p_body.plan.mealSwaps.breakfast==='鸡蛋和水果'));
  c.weekHealth=['身体疼痛'];c.weekNote='膝盖疼';c.weekProposed=null;const count=calls.length;
  await c.weeklyDecision(true);assert.equal(calls.length,count,'weekly proposal requires second confirmation');assert(Object.values(c.weekProposed.days).every(v=>v==='REST'),'weekly pain guard');
  const afterPreview=aiCalls;await c.weeklyDecision(true);assert.equal(aiCalls,afterPreview,'confirmed weekly preview reused');assert(calls.some(x=>x.name==='fl_private_put_week'&&x.args.p_body.bodyStatus.includes('身体疼痛')));
  const pulled = {member:{family:'abcdefgh',person:'hus'},profile:{...c.profile,confirmedAt:new Date().toISOString()},weeks:[{weekStart:Object.keys(c.weeks)[0],body:Object.values(c.weeks)[0]}],checkins:[{date,body:{person:'hus',date,meals:{}}}],measures:[{date,body:{person:'hus',date,weight:78}}],partnerActivity:[{date,checked:true}],partnerTrend:[{date,changeKg:-1.2}]};
  let received=null, pushed=[];const peerSafe = new DuoCoach({setIdentity(){},setStore:v=>{received=v},render(){},clearDirty(){},setSync(){},getCheckin:()=>({}),family:()=>''});
  peerSafe.root={hidden:false,innerHTML:'',dataset:{}};peerSafe.session={user:{id:'u1'}};peerSafe.rpc=async name=>{pushed.push(name);return pulled};
  await peerSafe.load(pulled);assert(received.measures['hus_'+date]);assert(!received.measures['wife_'+date]);assert.equal(peerSafe.partnerTrend[0].changeKg,-1.2);
  await peerSafe.sync({checkins:{['hus_'+date]:{person:'hus',date}},measures:{['wife_'+date]:{person:'wife',date,weight:47.3}}},['c:hus_'+date,'m:wife_'+date]);
  assert(pushed.includes('fl_private_put_checkin'));assert(!pushed.includes('fl_private_put_measure'),'partner dirty data never uploads');
  assert(html.includes('data-lm-role="hus"')&&html.includes('data-lm-role="wife"'),'original role picker retained');assert(html.includes('id="entryFamily"')&&html.includes('data-coach="recover-open"'),'pairing and recovery stay secondary on role picker');
  memory.delete('duofit.auth.v1');let needsRole=0,returnedToRoles=0;const guest=new DuoCoach({family:()=>'',needsRole:()=>{needsRole++},showRoleChoice:()=>{returnedToRoles++},setIdentity(){},setStore(){},render(){},getCheckin:()=>({}),saveLegacyGoal(){}});guest.mount=()=>{guest.root={hidden:true,innerHTML:'',dataset:{}}};guest.authRequest=async path=>{assert.equal(path,'/auth/v1/signup');return {access_token:'anon',refresh_token:'refresh',user:{id:'anon-1',is_anonymous:true}}};
  await guest.start();assert.equal(needsRole,1,'first entry opens original role picker');assert(guest.root.hidden,'no login method overlay on first entry');
  const newPull={member:{person:'wife',family:'abcdefgh'},profile:null,weeks:[],checkins:[],measures:[],partnerActivity:[],partnerTrend:[]},entryCalls=[];
  guest.rpc=async(name,args)=>{entryCalls.push({name,args});if(name==='fl_claim_role')return newPull.member;if(name==='fl_private_pull')return newPull;return null};
  guest.beginRole('wife','abcdefgh');assert.equal(entryCalls.length,0,'role selection does not wait for backend');assert.equal(guest.current,'onboard');assert.equal(guest.step,0);assert(guest.root.innerHTML.includes('第 1 / 4 步'),'role selection goes directly to four-step profile');assert(!guest.recoveryCode,'recovery prompt waits until after plan');assert(!guest.root.innerHTML.includes('邮箱'));
  assert.equal(guest.root.dataset.person,'wife','wife onboarding uses wife theme');assert(guest.root.innerHTML.includes('coach-composer')&&guest.root.innerHTML.includes('title="发送">↑</button>'),'reference bottom composer and arrow send');assert(!guest.root.innerHTML.includes('>发送给健康伙伴</button>'),'no second full-width send button');
  guest.chatInput='最近膝盖疼';let finishAnalysis;guest.coachAI=()=>new Promise(resolve=>{finishAnalysis=()=>{guest.aiError='AI 聊天服务尚未部署';resolve(null)}});
  const sending=guest.click({target:{closest:()=>({dataset:{coach:'interpret'},disabled:false})}});
  assert(guest.root.innerHTML.includes('正在分析中')&&guest.root.innerHTML.includes('coach-spinner'),'AI send shows analysis state');
  assert(guest.root.innerHTML.includes('data-coach="interpret" aria-label="正在分析中" title="正在分析中" disabled'),'AI send disabled while pending');
  finishAnalysis();await sending;assert.equal(guest.chatInput,'最近膝盖疼','failed AI send keeps draft text');assert(guest.root.innerHTML.includes('AI 聊天服务尚未部署'),'specific AI error shown');assert(!guest.root.innerHTML.includes('coach-spinner'),'analysis state clears after failure');guest.chatInput='';
  await guest.click({target:{closest:()=>({dataset:{coach:'back'}})}});assert.equal(returnedToRoles,1,'first card back returns to role choice');guest.beginRole('wife','abcdefgh');
  Object.assign(guest.draft,{goals:['减脂'],focus:['腰腹'],age:'32',height:'170',weight:'70',health:['暂时没有'],frequency:'每周 2 次',duration:'20 分钟'});guest.coachAI=async()=>null;
  await guest.confirmStep();await guest.confirmStep();await guest.confirmStep();assert.equal(guest.step,3);assert.equal(entryCalls.length,0,'four profile cards stay available before pairing');
  await guest.confirmStep();assert(entryCalls.some(x=>x.name==='fl_claim_role'&&x.args.p_person==='wife'));assert(entryCalls.some(x=>x.name==='fl_private_put_profile'));assert.equal(guest.current,'recovery','personal recovery follows confirmed plan');
  let returningNeedsRole=0;const returning=new DuoCoach({family:()=>'',needsRole:()=>{returningNeedsRole++},setIdentity(){},setStore(){},render(){},getCheckin:()=>({})});returning.mount=()=>{returning.root={hidden:true,innerHTML:'',dataset:{}}};returning.refresh=async()=>true;returning.rpc=async()=>pulled;returning.checkWeekly=()=>{};
  await returning.start();assert(returning.active,'saved account returns to private app');assert.equal(returningNeedsRole,0,'returning account skips role selection');
  await peerSafe.issueRecoveryCode();assert(/^[A-F0-9]{4}(-[A-F0-9]{4}){7}$/.test(peerSafe.recoveryCode),'recovery code shown in groups');assert(pushed.includes('fl_recovery_set'));
  let cleared=false;peerSafe.h.clearIdentity=()=>{cleared=true};peerSafe.request=async()=>({});peerSafe.session={access_token:'token',user:{id:'u1'}};
  await peerSafe.click({target:{closest:()=>({dataset:{coach:'signout'}})}});assert(peerSafe.member,'signout asks before clearing');
  await peerSafe.click({target:{closest:()=>({dataset:{coach:'signout-confirm'}})}});assert(cleared&&peerSafe.member===null,'signout hides private account');
  let recoverHash='';const recovering=new DuoCoach({setIdentity(){},setStore(){},render(){},getCheckin:()=>({}),family:()=>''});recovering.root={hidden:false,innerHTML:'',dataset:{}};recovering.authRequest=async()=>({access_token:'new-anon',refresh_token:'refresh',user:{id:'anon-2'}});recovering.rpc=async(name,args)=>{if(name==='fl_recover_role'){recoverHash=args.p_hash;return pulled.member}if(name==='fl_private_pull')return pulled;return null};
  await recovering.recover(peerSafe.recoveryCode);assert.equal(recoverHash.length,64);assert.equal(recovering.member.person,'hus');assert(recovering.recoveryCode,'new code issued after recovery');
  c.step=0;c.renderOnboard();assert.equal(c.root.dataset.person,'hus','husband onboarding selects blue theme');
  const aiBeforePair=new DuoCoach({family:()=>''});aiBeforePair.member={person:'hus',family:'abcdefgh'};aiBeforePair.provisional=true;aiBeforePair.session={access_token:'anon'};let sent=null;aiBeforePair.request=async(_,body)=>{sent=body;return {summary:'已理解'}};await aiBeforePair.coachAI('interpret','想减脂');assert.equal(sent.person,'hus','AI can receive role before pairing');aiBeforePair.request=async()=>{const e=new Error('Function not found');e.status=404;throw e};await aiBeforePair.coachAI('interpret','想减脂');assert(aiBeforePair.aiError.includes('尚未部署'),'missing AI function has actionable message');
  classSandbox.fetch=async()=>({ok:false,status:400,json:async()=>({msg:'Anonymous sign-ins are disabled'})});await assert.rejects(new DuoCoach({}).authRequest('/auth/v1/signup',{}),/尚未开启免邮箱进入/,'disabled anonymous auth is translated');
  console.log('PASS coach health guard, daily alternatives, AI preview, weekly confirmation, private sync, anonymous entry, recovery, signout');
})().catch(e=>{console.error(e);process.exitCode=1});
