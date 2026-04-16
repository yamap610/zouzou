// 走走 PWA Service Worker
// 版本號：更新時改這裡，瀏覽器會自動更新快取
const CACHE_NAME = 'zouzou-v1';

// 要預先快取的檔案（App Shell）
const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;600;700&display=swap',
];

// ── Install：預先快取 App Shell ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRECACHE).catch(() => {
        // 字型 CDN 可能受 CORS 限制，忽略失敗
      });
    }).then(() => self.skipWaiting())
  );
});

// ── Activate：清除舊快取 ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── Fetch：Network First，離線才用快取 ──
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Google Sheets CSV：不快取，總是 Network（保持資料最新）
  if (url.hostname === 'docs.google.com') {
    return; // 讓瀏覽器直接處理
  }

  // Google Fonts：Cache First（字型不常變）
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.match(event.request).then(cached => {
        return cached || fetch(event.request).then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
          return response;
        });
      })
    );
    return;
  }

  // App 本身：Network First，失敗 fallback 快取
  event.respondWith(
    fetch(event.request).then(response => {
      // 成功就更新快取
      if (response.ok && event.request.method === 'GET') {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
      }
      return response;
    }).catch(() => {
      // 離線時從快取讀取
      return caches.match(event.request).then(cached => {
        if (cached) return cached;
        // 連快取都沒有：回傳 index.html（讓 App 自己顯示）
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
