// DuoFit 离线缓存：页面和脚本优先取新版，断网时才使用本机缓存；图片可先读缓存。
// 只缓存本站的文件；Supabase 数据同步和 AI 请求（其他域名）一律不经过缓存。
const CACHE = "duofit-v18";
const CORE = [
  "./", "index.html", "config.js", "private-coach.js", "private-coach.css", "manifest.webmanifest",
  "assets/icons/favicon-32.png?v=logo3", "assets/icons/favicon-64.png?v=logo3",
  "assets/icons/app-icon-180.png?v=logo3", "assets/icons/app-icon-192.png?v=logo3", "assets/icons/app-icon-512.png?v=logo3",
  "apple-touch-icon.png", "apple-touch-icon.png?v=logo3",
  "assets/login/hus-running.webp", "assets/login/wife-running.webp",
  "assets/brand/duofit-wordmark.svg",
  "assets/avatar-hus.png", "assets/avatar-wife.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE.map(path => new Request(path, {cache: "no-store"})))).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // Supabase、AI 等其他域名不管
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
