// yannsi工作室 — 作品集ページだけをオフラインで開けるようにする
// 同じドメインの各作品（/tile-cipher/ など）には手を出さない
const CACHE = "kousakushitsu-v1";
const FILES = ["/", "/index.html", "/manifest.webmanifest",
  "/icons/icon-192.png", "/icons/icon-512.png", "/icons/maskable-512.png",
  "/icons/apple-touch-icon.png", "/icons/favicon-32.png"];
const FONT_HOSTS = ["fonts.googleapis.com", "fonts.gstatic.com"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(
    ks.filter(k => k.startsWith("kousakushitsu-") && k !== CACHE).map(k => caches.delete(k))
  )).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  const mine = url.origin === location.origin && FILES.includes(url.pathname);
  const font = FONT_HOSTS.includes(url.hostname);
  if (!mine && !font) return; // 作品のページはふつうに通す
  if (mine) {
    // ネット優先、つながらなければ保存しておいたもの
    e.respondWith(fetch(e.request).then(r => {
      const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r;
    }).catch(() => caches.match(e.request).then(r => r || caches.match("/index.html"))));
  } else {
    // フォントは一度取ったら保存したものを使う
    e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
      const copy = r.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); return r;
    })));
  }
});
