// Always On Quote Builder — service worker
// Version + release notes shown to the user in the update banner.
const SW_VERSION = '2.0.0';
const SW_NOTES = 'Installable app with offline mode, mobile action bar, swipe-to-delete with confirmation, safer shared-catalog deletes, logo and proposal upgrades.';
const CACHE = 'aog-shell-v' + SW_VERSION;

self.addEventListener('install', e => {
  // NOTE: no skipWaiting here — the new version waits until the user taps Install.
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['./'])));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', e => {
  const d = e.data || {};
  if (d.type === 'SKIP_WAITING') self.skipWaiting();
  if (d.type === 'GET_VERSION' && e.ports && e.ports[0]) {
    e.ports[0].postMessage({ version: SW_VERSION, notes: SW_NOTES });
  }
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then(r => {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put('./', copy));
        return r;
      }).catch(() => caches.match('./'))
    );
    return;
  }
  if (url.origin === location.origin && /\.(png|webmanifest)$/.test(url.pathname)) {
    e.respondWith(
      caches.match(e.request).then(m => m || fetch(e.request).then(r => {
        const copy = r.clone();
        caches.open(CACHE).then(c => c.put(e.request, copy));
        return r;
      }))
    );
  }
});
