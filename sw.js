/* Bond Lab's service worker: makes the lab installable and usable with no
   network, without ever showing somebody yesterday's version.

   That second half matters more than it sounds. The usual way to write one of
   these is cache-first, which is fast and means a classroom that loaded the
   page last week keeps seeing last week's page forever, with no obvious way
   to tell. So this one is network-first for everything the lab is made of: if
   there is a network, you get what is on the server; if there is not, you get
   the last copy that worked. The only exception is the fonts, which are large
   and have never changed.

   Bump CACHE whenever you want every old copy thrown away. */
const CACHE = 'bond-lab-v1';

/* Enough to open the lab from a cold start with no network. Everything else —
   the instruments, the fonts — is cached the first time it is fetched, which
   has always happened by the time anyone installs the app. */
const CORE = [
  './',
  './index.html',
  './css/style.css',
  './manifest.webmanifest',
  './assets/icon.svg',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      // best effort: one missing file must not stop the worker installing
      .then((c) => Promise.allSettled(CORE.map((u) => c.add(u))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const isFont = (url) => /\.woff2?$/i.test(url.pathname);

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;     // nothing here is third-party

  // Fonts never change and are the biggest thing we ship: serve them from the
  // cache and only go to the network the first time.
  if (isFont(url)) {
    e.respondWith(
      caches.match(req).then((hit) => hit || fetch(req).then((res) => {
        if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      })),
    );
    return;
  }

  /* The page itself is fetched with the browser's own HTTP cache switched off.
     It is three kilobytes, and it is the one file that decides which version
     of everything else you are looking at — so it is worth guaranteeing it is
     the server's current copy rather than something a proxy or a heuristic
     decided to hang on to. Without this the worker inherits whatever the HTTP
     cache believes, which is how installed web apps end up quietly a week
     behind. */
  const fromNetwork = req.mode === 'navigate'
    ? fetch(new Request(req.url, { cache: 'no-store', credentials: 'same-origin', redirect: 'follow' }))
    : fetch(req);

  // Everything else: the server's answer wins whenever there is one.
  e.respondWith(
    fromNetwork
      .then((res) => {
        if (res && res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((hit) => {
        if (hit) return hit;
        // a deep link opened offline still gets the shell; the hash router
        // takes it from there
        if (req.mode === 'navigate') return caches.match('./index.html');
        return Response.error();
      })),
  );
});
