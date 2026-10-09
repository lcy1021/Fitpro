const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const source = fs.readFileSync(path.join(__dirname, '../private-coach.js'), 'utf8');
const authKey = 'duofit.auth.v1';
const session = (token = 'old', expired = false) => ({access_token: token + '-access', refresh_token: token + '-refresh', user: {id: 'account-a'}, expires_at: Math.floor(Date.now() / 1000) + (expired ? -60 : 3600)});
const reply = (status, data, headers = {}) => ({ok: status >= 200 && status < 300, status, text: async () => JSON.stringify(data), headers: {get: key => headers[key] || null}});
const deferred = () => {let resolve, reject;const promise = new Promise((yes, no) => {resolve = yes;reject = no});return {promise, resolve, reject};};
const pull = {member: {person: 'hus', family: 'family-secret'}, profile: {confirmedAt: '2026-10-08', goals: ['减脂'], health: [], focus: []}, weeks: [], checkins: [], measures: [], partnerActivity: [], partnerTrend: []};
function environment(extra = {}) {
  const memory = new Map();
  const context = {window: {FATLOSS_CONFIG: {SUPABASE_URL: 'https://example.supabase.co', SUPABASE_KEY: 'public-key'}}, navigator: {}, document: {visibilityState: 'visible'}, localStorage: {getItem: k => memory.get(k) || null, setItem: (k, v) => memory.set(k, v), removeItem: k => memory.delete(k)}, console: {warn() {}}, Date, setTimeout, clearTimeout, AbortController, ...extra};
  vm.runInNewContext(source, context);
  const create = hooks => {
    const coach = new context.window.DuoCoach({setIdentity() {}, setStore() {}, render() {}, setSync() {}, ...hooks});
    coach.root = {hidden: true, dataset: {}, innerHTML: ''};coach.mount = () => {};coach.checkWeekly = () => {};
    coach.waitForRetry = async () => {};
    return coach;
  };
  return {context, memory, create};
}

(async () => {
  {
    const {create, memory} = environment();const c = create();c.saveSession(session('old', true));
    const pending = deferred();let refreshes = 0;
    c.authRequest = async () => {refreshes++;return pending.promise};
    const requests = Array.from({length: 12}, () => c.refresh());
    assert.equal(refreshes, 1, 'simultaneous AI, sync and startup share a token refresh');
    pending.resolve(session('new'));assert((await Promise.all(requests)).every(Boolean));
    assert.equal(JSON.parse(memory.get(authKey)).refresh_token, 'new-refresh');
  }
  {
    let queue = Promise.resolve();const locks = {request: (name, options, run) => {const work = queue.then(run);queue = work.catch(() => {});return work}};
    const {create} = environment({navigator: {locks}});const a = create(), b = create();a.saveSession(session('old', true));b.session = session('old', true);
    let refreshes = 0;const renew = async () => {refreshes++;return session('shared-new')};a.authRequest = renew;b.authRequest = renew;
    await Promise.all([a.refresh(true, 'old-access'), b.refresh(true, 'old-access')]);
    assert.equal(refreshes, 1, 'tabs sharing storage serialize refreshes and adopt the new token');
    assert.equal(b.session.access_token, 'shared-new-access');
  }
  {
    const {create, memory} = environment();const c = create();c.saveSession(session('old', true));
    c.authRequest = async () => {throw Object.assign(new Error('Auth configuration error'), {status: 403, code: 'feature_disabled'})};
    await assert.rejects(c.refresh(), /configuration/);assert(memory.has(authKey), 'a general 403 does not erase a saved identity');
    c.authRequest = async () => {throw Object.assign(new Error('gone'), {status: 400, code: 'refresh_token_not_found'})};
    assert.equal(await c.refresh(), false);assert(!memory.has(authKey), 'only an explicit invalid session ends the login');
  }
  {
    const {context, create} = environment();const c = create();c.saveSession(session('old', true));let calls = 0;const waits = [];
    c.waitForRetry = async ms => waits.push(ms);
    context.fetch = async () => ++calls === 1 ? reply(409, {code: 'conflict', msg: 'conflict'}) : reply(200, session('renewed'));
    assert.equal(await c.refresh(), true);assert.equal(calls, 2);assert.equal(waits.length, 1, 'Auth refresh conflicts back off rather than lose the login');
  }
  {
    const {create} = environment();const c = create();c.saveSession({...session(), expires_at: Math.floor(Date.now()/1000)+60});
    c.authRequest = async () => {throw Object.assign(new Error('Auth temporarily unavailable'), {status: 503})};
    assert.equal(await c.refresh(), true, 'a still-valid access token can read the database during a temporary Auth failure');
    await assert.rejects(c.refresh(true, 'old-access'), e => e.status === 503, 'an explicitly rejected access token is not reused');
  }
  {
    const {context, create, memory} = environment();const c = create();c.saveSession(session());let calls = 0;const waits = [];
    c.waitForRetry = async ms => waits.push(ms);
    context.fetch = async () => {calls++;if(calls === 1)throw new TypeError('network');return calls === 2 ? reply(503, {error: 'busy'}) : reply(200, pull)};
    const data = await c.rpc('fl_private_pull');assert.equal(data.member.person, 'hus');assert.equal(calls, 3);assert.equal(waits.length, 2);
    context.fetch = async () => reply(429, {error: 'busy'}, {'Retry-After': '2'});calls = 0;
    await assert.rejects(c.rpc('fl_private_pull'), e => e.status === 429);assert(waits.slice(-2).every(ms => ms >= 2000), 'rate limit retry delay is respected');
    assert(memory.has(authKey), 'transient errors preserve the login');
  }
  {
    const {context, create} = environment();const c = create();c.saveSession(session());let calls = 0;
    context.fetch = async () => {calls++;return reply(403, {message: 'permission denied'})};
    await assert.rejects(c.rpc('fl_private_pull'), e => e.status === 403);assert.equal(calls, 1, 'permission errors are not retried');
    calls = 0;context.fetch = async () => {calls++;throw new TypeError('network')};
    await assert.rejects(c.rpc('fl_recover_role', {p_hash: 'one-time-secret'}));assert.equal(calls, 1, 'one-time recovery is never blindly replayed');
    calls = 0;await assert.rejects(c.authRequest('/auth/v1/signup', {data: {}}));assert.equal(calls, 1, 'anonymous account creation is not automatically replayed');
  }
  {
    const {context, create} = environment();const c = create();c.saveSession(session());const pending = deferred();let reads = 0;
    context.fetch = async () => {reads++;return pending.promise};
    const a = c.rpc('fl_private_pull'), b = c.rpc('fl_private_pull');await Promise.resolve();await Promise.resolve();
    pending.resolve(reply(200, pull));await Promise.all([a, b]);assert.equal(reads, 1, 'overlapping pulls share one cloud request');
  }
  {
    const {context, create} = environment();const c = create();c.saveSession(session());const response = deferred(), requested = deferred();let refreshes = 0, reads = 0;
    context.fetch = async () => {if(++reads === 1){requested.resolve();return response.promise}return reply(200, pull)};
    c.authRequest = async () => {refreshes++;return session('unexpected')};
    const reading = c.rpc('fl_private_pull');await requested.promise;
    c.saveSession(session('already-renewed'));response.resolve(reply(401, {message: 'expired'}));
    await reading;assert.equal(refreshes, 0, 'a delayed 401 uses a token already renewed by another operation');
  }
  {
    const {create, memory} = environment();const c = create();c.saveSession(session('old', true));const response = deferred();
    c.authRequest = async () => response.promise;const refreshing = c.refresh();
    c.session = null;c.persistedSession = false;memory.delete(authKey);response.resolve(session('late'));
    await assert.rejects(refreshing, e => e.code === 'session_changed');assert(!memory.has(authKey), 'a delayed refresh cannot undo signout');
  }
  {
    const {context, create} = environment();const c = create();c.saveSession(session());let writes = 0;const payload = {p_body: {person: 'hus', value: 'first'}};const sent = [];
    context.fetch = async (url, options) => {writes++;sent.push(options.body);if(writes === 1)throw new TypeError('network');return reply(200, null)};
    c.waitForRetry = async () => {payload.p_body.value = 'new edit'};
    await c.rpc('fl_private_put_checkin', payload);assert.equal(sent[0], sent[1], 'retries send the same saved version, even if the object was later edited');
    writes = 0;c.waitForRetry = async () => c.saveSession({...session('other'), user: {id: 'account-b'}});
    await assert.rejects(c.rpc('fl_private_put_checkin', payload), e => e.code === 'session_changed');assert.equal(writes, 1, 'old private writes cannot be retried under a different account');
  }
  {
    const {context, create} = environment();const c = create();
    context.fetch = (url, options) => new Promise((resolve, reject) => options.signal.addEventListener('abort', () => reject(new Error('aborted'))));
    await assert.rejects(c.request('/rest/v1/rpc/fl_private_put_checkin', {}, true, 5), e => e.kind === 'timeout');
    context.fetch = async () => reply(200, null);assert.equal(await c.request('/rest/v1/rpc/fl_private_put_checkin', {}), null, 'a stalled write has a deadline and subsequent requests can run');
  }
  {
    const {context, create} = environment({setTimeout: (fn, ms) => setTimeout(fn, ms >= 10000 ? 5 : ms)});const c = create();c.saveSession(session());c.member = pull.member;let state = '';
    c.h.setSync = value => {state = value};
    context.fetch = (url, options) => new Promise((resolve, reject) => options.signal.addEventListener('abort', () => reject(new Error('aborted'))));
    const record = {person: 'hus', date: '2026-10-09', meals: {breakfast: 'plan'}};
    await c.sync({checkins: {'hus_2026-10-09': record}, measures: {}}, ['c:hus_2026-10-09']);
    assert.equal(c.busy, false, 'timeouts release the sync queue');assert.equal(state, 'offline');
  }
  {
    const {create} = environment();const record = {person: 'hus', date: '2026-10-09', meals: {breakfast: 'plan'}};let store = {checkins: {'hus_2026-10-09': record}, measures: {}}, dirty = ['c:hus_2026-10-09'];
    const queued = [], uploaded = [], pending = deferred();let writes = 0;
    const c = create({getSyncData: () => ({store, dirty}), clearDirty: (key, sent) => {const now = JSON.stringify(store.checkins[key.slice(2)]);if(now !== sent)return false;dirty = dirty.filter(k => k !== key);return true}, setStore: incoming => {for(const key of dirty)incoming.checkins[key.slice(2)] = store.checkins[key.slice(2)];store = incoming}, requestSync: reason => queued.push(reason)});
    c.saveSession(session());c.member = pull.member;
    c.rpc = async (name, args) => {if(name === 'fl_private_pull')return {...pull, checkins: uploaded.map(body => ({date: body.date, body}))};writes++;uploaded[0] = args.p_body;if(writes === 1)await pending.promise};
    const syncing = c.sync(store, dirty);record.meals.lunch = 'over';c.sync(store, dirty);pending.resolve();await syncing;
    assert.equal(dirty.length, 1, 'a new checkin made during upload remains pending');assert.equal(uploaded[0].meals.lunch, undefined, 'in-flight payload is a snapshot');
    assert.deepEqual(queued, ['change'], 'new edits queue one more sync');
    await c.sync(store, dirty);assert.equal(uploaded[0].meals.lunch, 'over');assert.equal(dirty.length, 0, 'the second upload acknowledges the new edit');
    let reads = 0;c.rpc = async () => {reads++;return pull};await c.sync(store, dirty, 'poll');assert.equal(reads, 0, 'idle polling avoids an immediate full reload');
    c.lastCloudPullAt = Date.now() - 91000;await c.sync(store, dirty, 'poll');assert.equal(reads, 1, 'idle polling still refreshes partner data after 90 seconds');
  }
  {
    const timers = [];let now = Date.now();const Clock = class extends Date {static now() {return now}};
    const {create} = environment({Date: Clock, setTimeout: (fn, ms) => {const timer = {fn, ms};timers.push(timer);return timer}, clearTimeout: timer => {if(timer)timer.cancelled = true}});
    let retryWork, reads = 0;const c = create({requestSync: reason => {retryWork = c.sync({checkins: {}, measures: {}}, [], reason)}});c.saveSession(session());
    c.rpc = async () => {reads++;if(reads === 1)throw Object.assign(new Error('network'), {kind: 'network'});return pull};
    assert.equal(await c.start(), 'error');const retry = timers.find(timer => !timer.cancelled);assert(retry, 'an unpaired startup error schedules a reconnect without requiring a role selection');
    now += retry.ms;retry.fn();await retryWork;assert(c.active && c.root.hidden, 'automatic reconnect exits the error page after the network returns');assert.equal(reads, 2);
  }
  {
    const {context, create} = environment();const c = create();c.saveSession(session());
    context.fetch = async () => reply(503, {message: 'secret-access-token private-health-text', code: 'busy'});
    await assert.rejects(c.rpc('fl_private_put_profile', {p_body: {notes: ['private-health-text'], family: 'family-secret'}}));
    const diagnostic = c.connectionDiagnostics();assert(diagnostic.includes('fl_private_put_profile') && diagnostic.includes('503'));
    for(const secret of ['old-access', 'old-refresh', 'account-a', 'family-secret', 'private-health-text', 'secret-access-token'])assert(!diagnostic.includes(secret), 'diagnostic omits ' + secret);
  }
  {
    const {create} = environment();const c = create();c.saveSession(session());c.member=pull.member;c.current='onboard';c.draft={...c.blank(),diet:'unsaved edit'};
    c.rpc=async()=>pull;await c.sync({checkins:{},measures:{}},[]);assert.equal(c.draft.diet,'unsaved edit','background pulls preserve an onboarding draft');
    const pending=deferred();c.rpc=async()=>pending.promise;c.current=null;
    const syncing=c.sync({checkins:{},measures:{}},[]);c.profile={...pull.profile,diet:'newly confirmed'};c.weeks={'2026-10-05':{plan:{reason:'new plan'}}};c.planRevision=1;
    pending.resolve(pull);await syncing;assert.equal(c.profile.diet,'newly confirmed');assert(c.weeks['2026-10-05'],'a stale cloud pull cannot overwrite a just-confirmed plan');
  }
  {
    let replacements=0;const {create} = environment();const c=create({setStore:()=>{replacements++}});c.saveSession(session());
    await assert.rejects(c.load({member:pull.member,checkins:'broken'}), e=>e.code==='invalid_private_pull');assert.equal(replacements,0,'malformed cloud data cannot replace local records');
    c.rpc=async()=>pull;c.h.render=()=>{throw new TypeError('private text must not be logged')};
    assert.equal(await c.start(),'error');assert(c.connectionDiagnostics().includes('"kind": "client"'),'client rendering failures are distinguished from cloud failures');
    assert(!c.connectionDiagnostics().includes('private text'));
  }
  {
    const requests=[];let state='',weekChecks=0;const {create,memory}=environment();const c=create({requestSync:reason=>requests.push(reason),setSync:value=>{state=value}});c.saveSession(session());
    memory.set('duofit.profile.v1.account-a',JSON.stringify({member:pull.member,profile:pull.profile,weeks:{}}));
    c.rpc=()=>{throw new Error('warm startup must not wait for the cloud')};
    assert.equal(await c.start(),'home');assert(c.active&&c.root.hidden);assert.deepEqual(requests,['online']);assert.equal(state,'syncing','warm startup opens its own cached profile and connects in the background');
    c.rpc=async()=>pull;c.checkWeekly=()=>{weekChecks++};await c.sync({checkins:{},measures:{}},[],'online');assert.equal(state,'ok');assert.equal(weekChecks,1,'weekly review follows successful background connection');
  }
  console.log('PASS shared refresh, browser locks, Auth conflicts, transient retries, safe recovery, shared pulls, 401 races, signout, write deadlines, versioned acknowledgements, polling, automatic reconnect and private diagnostics');
})().catch(error => {console.error(error);process.exitCode = 1});
