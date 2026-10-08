import assert from 'node:assert/strict';

const calls=[];
globalThis.Deno={
  env:{get:name=>({SUPABASE_URL:'https://project.supabase.co',SUPABASE_SECRET_KEYS:JSON.stringify({default:'sb_secret_test'}),ANTHROPIC_API_KEY:'ai-test'})[name]},
  serve:handler=>{globalThis.coachHandler=handler}
};
globalThis.fetch=async(url,options={})=>{
  calls.push({url:String(url),options});
  if(String(url).endsWith('/auth/v1/user'))return Response.json({id:'user-1'});
  if(String(url).includes('/rest/v1/fl_members'))return Response.json([]);
  if(String(url).endsWith('/rest/v1/rpc/fl_coach_quota'))return Response.json(true);
  if(String(url).endsWith('/v1/messages'))return Response.json({content:[{type:'text',text:JSON.stringify({summary:'已理解你的目标',suggestions:{goals:['减脂']}})}]});
  throw new Error('unexpected fetch: '+url);
};
await import('../supabase/functions/coach/index.ts');
const request=(method,body={},authorized=true)=>new Request('https://project.supabase.co/functions/v1/coach',{method,headers:{origin:'https://lcy1021.github.io',...(authorized?{authorization:'Bearer user-token'}:{})},...(method==='POST'?{body:JSON.stringify(body)}:{})});
const options=await globalThis.coachHandler(request('OPTIONS'));
assert.equal(options.status,200);
assert.equal(options.headers.get('x-coach-version'),'2026-10-08-speed');
assert.equal(calls.length,0,'preflight must respond before any network call');
assert.equal((await globalThis.coachHandler(request('POST',{},false))).status,401,'missing user token is rejected');
const response=await globalThis.coachHandler(request('POST',{mode:'interpret',text:'希望减脂',person:'hus',profile:{goals:['减脂']}}));
assert.equal(response.status,200);
assert.equal((await response.json()).summary,'已理解你的目标');
assert.equal(calls.find(c=>c.url.endsWith('/auth/v1/user')).options.headers.authorization,'Bearer user-token');
const privateRead=calls.find(c=>c.url.includes('/rest/v1/fl_members')).options.headers;
assert.equal(privateRead.apikey,'sb_secret_test');
assert.equal(privateRead.authorization,undefined,'new secret key stays out of bearer header');
assert.equal(JSON.parse(calls.find(c=>c.url.endsWith('/rest/v1/rpc/fl_coach_quota')).options.body).p_user,'user-1');
console.log('PASS coach preflight, authentication, quota and AI response');
