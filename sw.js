/* LV LONG Product Guide — Service Worker
   Offline-first PWA. Bump CACHE version on each content release. */
var CACHE = 'lvlong-v6';

/* App shell — relative paths so it works under the GitHub Pages subpath
   (https://stanleywoosweeleong.github.io/LVlongproductcataloguev2/) */
var SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable.png'
];

/* Install: pre-cache the app shell, then activate immediately */
self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      return c.addAll(SHELL.map(function (u) {
        return new Request(u, { cache: 'reload' });
      }));
    }).then(function () {
      return self.skipWaiting();
    }).catch(function () {
      return self.skipWaiting();
    })
  );
});

/* Activate: delete old caches, take control of open pages */
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(
        keys.filter(function (k) { return k !== CACHE; })
            .map(function (k) { return caches.delete(k); })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

/* Fetch strategy:
   - Navigation (loading the page): cache-first so the app opens fully offline,
     with a background network refresh when online.
   - Other GET requests: cache-first, fall back to network, then store the result. */
self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;

  if (e.request.mode === 'navigate') {
    e.respondWith(
      caches.match('./index.html').then(function (cached) {
        var net = fetch(e.request).then(function (res) {
          if (res && res.status === 200) {
            var rc = res.clone();
            caches.open(CACHE).then(function (c) { c.put('./index.html', rc); });
          }
          return res;
        }).catch(function () {
          return cached || caches.match('./index.html');
        });
        return cached || net;
      })
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then(function (r) {
      if (r) return r;
      return fetch(e.request).then(function (res) {
        if (res && res.status === 200 && res.type === 'basic') {
          var rc = res.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, rc); });
        }
        return res;
      }).catch(function () {
        return caches.match('./index.html');
      });
    })
  );
});
