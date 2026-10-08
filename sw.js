// DuoFit 离线缓存：打开时先用手机里存的页面和图片（秒开），同时在后台拿最新版，下次打开生效。
// 只缓存本站的文件；Supabase 数据同步和 AI 请求（其他域名）一律不经过缓存。
const CACHE = "duofit-v13";
const CORE = [
  "./", "index.html", "config.js", "private-coach.js", "private-coach.css", "manifest.webmanifest",
  "assets/icons/favicon-64.png", "apple-touch-icon.png",
  "assets/login/hus-running.webp", "assets/login/wife-running.webp",
  "assets/brand/duofit-wordmark.svg",
  "assets/avatar-hus.png", "assets/avatar-wife.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(CORE)).then(() => self.skipWaiting()));
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
  const fresh = caches.open(CACHE).then((cache) =>
    fetch(req).then((res) => { if (res.ok) cache.put(key, res.clone()); return res; })
  );
  e.waitUntil(fresh.catch(() => {})); // 后台更新跑完再结束
  e.respondWith(
    caches.match(key, { ignoreSearch: isPage }).then((cached) =>
      cached || fresh.catch(() => caches.match("./")) // 有缓存就秒开；没有就走网络，断网时退回首页缓存
    )
  );
});

self.addEventListener("push", e => {
  let data = {}; try { data = e.data?.json() || {}; } catch (_) {}
  e.waitUntil(self.registration.showNotification(data.title || "DuoFit 周计划提醒", {
    body: data.body || "打开 App 确认本周计划。",
    icon: "assets/icons/app-icon-192.png", badge: "assets/icons/favicon-64.png",
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
