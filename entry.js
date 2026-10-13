// Independent entry lifecycle. No authentication, records, or health data are read here.
(()=>{
 if(document.documentElement.classList.contains('me-wife'))document.body.classList.replace('me-hus','me-wife');
 const lm=document.querySelector('#lm'),status=document.querySelector('#launchStatus'),retry=document.querySelector('#launchRetry'),diagnostics=document.querySelector('#launchDiagnostics');
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const trace=window.duoBootTrace={version:60,workerVersion:null,reducedMotion:reduced,events:window.duoEarlyEvents||[],mark(stage){this.events.push({stage,ms:Math.round(performance.now())});}};
 trace.mark('entry-parsed');
 let timers=[],finish=null,finished=false,failed=false,complete=false;
 let registerWorker=()=>{};
 const phase=name=>{lm.dataset.phase=name;trace.mark('entry-'+name);};
 const clear=()=>{timers.forEach(clearTimeout);timers=[];};
 const later=(fn,ms)=>timers.push(setTimeout(fn,ms));
 const message=text=>{status.textContent=text;status.hidden=false;};
 const waiting=()=>{finished=true;phase(reduced?'meet':'waiting');message('正在打开…');if(finish)finish();};
 const warm=()=>{if(complete)navigator.serviceWorker?.controller?.postMessage({type:'warm-media'});};
 const entry=window.duoEntry={claimed:false,skipped:false,
  take(fn){if(this.claimed)return false;this.claimed=true;finish=fn;lm.onclick=()=>{this.skipped=true;trace.mark('entry-skip');fn();};if(finished||this.skipped)setTimeout(fn,0);return true;},
  stop(){clear();finish=null;},
  complete(){complete=true;clear();clearTimeout(watchdog);status.hidden=true;retry.hidden=true;diagnostics.hidden=true;lm.classList.remove('lm-needs-retry');trace.mark('entry-complete');setTimeout(registerWorker,800);warm();},
  waiting(text){message(text||'正在打开…');if(!reduced)phase('waiting');},
  fail(stage){if(complete)return;failed=true;window.duoBootFailure=stage;trace.mark('resource-error-'+stage);message('启动资源未能加载，请重试');actions();},
 };
 lm.onclick=()=>{entry.skipped=true;trace.mark('entry-skip');clear();waiting();};
 retry.addEventListener('click',event=>{event.stopPropagation();location.reload();});
 const actions=()=>{retry.hidden=false;diagnostics.hidden=false;lm.classList.add('lm-needs-retry');};
 diagnostics.addEventListener('click',async event=>{
  event.stopPropagation();
  const navigation=performance.getEntriesByType('navigation')[0];
  const report='DuoFit 启动诊断 v60\n'+JSON.stringify({version:trace.version,workerVersion:trace.workerVersion,standalone:navigator.standalone===true,reducedMotion:reduced,phase:lm.dataset.phase,workerControlled:!!navigator.serviceWorker?.controller,paint:performance.getEntriesByName('first-contentful-paint')[0]?.startTime||null,navigation:navigation?{responseStart:navigation.responseStart,responseEnd:navigation.responseEnd,encodedBodySize:navigation.encodedBodySize}:null,events:trace.events},null,2);
  try{await navigator.clipboard.writeText(report);message('启动诊断已复制');}catch{message('未能复制，请重试');}
 });
 const watchdog=setTimeout(()=>{if(!complete&&!failed){message('加载时间较长，可以重试');actions();}},8000);
 window.addEventListener('error',event=>{if(event.error&&!complete)entry.fail('app');});
 window.addEventListener('pageshow',()=>trace.mark('pageshow'));
 const runners=[...document.querySelectorAll('.lm-runner img')];
 const decoded=Promise.all(runners.map(img=>img.decode?img.decode().catch(()=>{}):Promise.resolve()));
 Promise.race([decoded,new Promise(resolve=>setTimeout(resolve,250))]).then(()=>{
  if(entry.skipped||complete)return;
  if(reduced){phase('meet');later(waiting,600);return;}
  requestAnimationFrame(()=>{if(entry.skipped||complete)return;phase('run');later(()=>phase('meet'),1780);later(waiting,2340);});
 });
 // Home artwork has lower priority than entry mascots and begins after entry paints.
 let sceneStarted=false,sceneResolve;
 window.duoLaunchSceneReady=new Promise(resolve=>sceneResolve=resolve);
 window.duoPrepareLaunchScene=()=>{
  if(sceneStarted)return window.duoLaunchSceneReady;sceneStarted=true;
  const image=new Image();image.fetchPriority='low';image.src='assets/page-hero/today-'+(document.documentElement.classList.contains('me-wife')?'wife':'hus')+'-v2.jpg';
  (image.decode?image.decode():new Promise(resolve=>{image.onload=image.onerror=resolve;})).catch(()=>{}).then(()=>{trace.mark('home-image-ready');sceneResolve();});
  return window.duoLaunchSceneReady;
 };
 setTimeout(()=>window.duoPrepareLaunchScene(),400);
 // Registration remains possible even if a business script stalls or fails.
 // Secure loopback is allowed for real local SW lifecycle QA; other hosts use HTTPS.
 if('serviceWorker' in navigator&&(location.protocol==='https:'||['localhost','127.0.0.1'].includes(location.hostname))){
  let workerStarted=false;
  const ping=()=>navigator.serviceWorker.controller?.postMessage({type:'startup-status'});
  navigator.serviceWorker.addEventListener('message',event=>{if(event.data?.type==='startup-status'&&Number.isInteger(event.data.version)){trace.workerVersion=event.data.version;trace.mark('worker-version');}});
  ping();
  navigator.serviceWorker.addEventListener('controllerchange',()=>{trace.mark('worker-controller');ping();warm();});
  registerWorker=()=>{if(workerStarted)return;workerStarted=true;navigator.serviceWorker.register('sw.js',{updateViaCache:'none'}).then(()=>{trace.mark('worker-registered');return navigator.serviceWorker.ready;}).then(warm).catch(()=>trace.mark('worker-register-error'));};
  setTimeout(()=>registerWorker(),2600);
 }
 if(window.duoBootFailure)entry.fail(window.duoBootFailure);
})();
