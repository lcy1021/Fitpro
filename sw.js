// DuoFit 离线缓存：页面和脚本优先取新版，断网时才使用本机缓存；图片可先读缓存。
// 只缓存本站的文件；Supabase 数据同步和 AI 请求（其他域名）一律不经过缓存。
const CACHE = "duofit-v56";
// Media URLs carry their own revision. Keep downloaded images through app-only releases.
const IMAGE_CACHE = "duofit-images-v1";
const imageRequests = new Map();
const HERO_SCENES = [
  "today-hus", "today-wife", "diet-hus", "diet-wife", "train-hus", "train-wife", "record-couple",
].map(name => `assets/page-hero/${name}-v2.jpg`).concat("assets/page-hero/meadow-glass-v1.jpg");
const CORE = [
  "./", "index.html", "config.js", "design-system/tokens.css?v=56", "design-system/components.css?v=56", "design-system/mascots.js?v=56", "private-coach.js?v=56", "private-coach.css?v=56", "assets/fonts/LongCang-Regular.ttf", "manifest.webmanifest",
];
const isImage = url => /\.(?:avif|webp|png|gif|jpe?g|svg)$/i.test(url.pathname);

async function retainImages(){
  const images = await caches.open(IMAGE_CACHE);
  for(const key of await caches.keys()){
    if(!/^duofit-v\d+$/.test(key) || key===CACHE)continue;
    const old = await caches.open(key);
    for(const request of await old.keys()){
      const url = new URL(request.url);
      if(url.origin!==self.location.origin || !isImage(url) || await images.match(request))continue;
      const response = await old.match(request);
      if(response?.ok){try{await images.put(request,response);}catch{/* A full image cache must not block an app update. */}}
    }
    await caches.delete(key);
  }
}
async function imageResponse(request){
  let cache;
  try{cache = await caches.open(IMAGE_CACHE);}catch{return fetch(request);}
  let hit;
  try{hit = await cache.match(request);}catch{/* A damaged image cache should not hide a network image. */}
  if(hit)return hit; // No background re-download for an unchanged media revision.
  if(!imageRequests.has(request.url)){
    const pending = (async()=>{
      let response;
      try{response = await fetch(request);}catch(error){
        if(!new URL(request.url).pathname.includes("/assets/page-hero/"))throw error;
        response = await fetch(request,{cache:"reload"});
      }
      if(response.ok){try{await cache.put(request,response.clone());}catch{/* Still display the network image if storage is full. */}}
      return response;
    })().finally(()=>imageRequests.delete(request.url));
    imageRequests.set(request.url,pending);
  }
  return (await imageRequests.get(request.url)).clone();
}
async function warmHeroScenes(){
  const images = await caches.open(IMAGE_CACHE);
  await Promise.allSettled(HERO_SCENES.map(async path => {
    const request = new Request(path, {cache: "no-store"});
    if(await images.match(request))return;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    try{
      const response = await fetch(request,{signal:controller.signal});
      if(response.ok)await images.put(request,response);
    }finally{clearTimeout(timer);}
  }));
}

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE.map(path => new Request(path, {cache: "no-store"})))).then(() => warmHeroScenes().catch(() => {})).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    retainImages().then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Supabase、AI 等其他域名不管
  if(isImage(url)){e.respondWith(imageResponse(req));return;}
  const isPage = req.mode === "navigate";
  const key = isPage ? "./" : req;
  const critical = isPage || /\.(?:html|js|css|webmanifest)$/.test(url.pathname);
  const fresh = fetch(req, critical ? {cache: "no-store"} : undefined).then(async res => {
    if (res.ok) await (await caches.open(CACHE)).put(key, res.clone());
    return res;
  });
  const fallback = () => caches.match(key, {ignoreSearch: isPage}).then(hit => hit || (isPage ? caches.match("./") : undefined));
  if (critical) {
    e.respondWith(fresh.catch(fallback));
  } else {
    e.waitUntil(fresh.catch(() => {}));
    e.respondWith(fallback().then(hit => hit || fresh));
  }
});

self.addEventListener("push", e => {
  let data = {}; try { data = e.data?.json() || {}; } catch (_) {}
  e.waitUntil(self.registration.showNotification(data.title || "DuoFit 周计划提醒", {
    body: data.body || "打开 App 确认本周计划。",
    icon: "assets/icons/app-icon-192.png?v=logo3", badge: "assets/icons/favicon-64.png?v=logo3",
    tag: "duofit-weekly-plan", data: {url: "./"}
  }));
});
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({type: "window", includeUncontrolled: true}).then(clients => {
    const existing = clients.find(c => new URL(c.url).origin === self.location.origin);
    return existing ? existing.focus() : self.clients.openWindow(e.notification.data?.url || "./");
  }));
});
