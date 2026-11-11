/* Service worker — owner: Agent C. Hand-written (no PWA library).
 *
 * - Precaches the phrasebook (/phrases/ in all 3 languages) and /eat/ plus the CSS/JS/images they
 *   need, so 指さし会話帳 and 食べる・買う work offline from the first visit.
 * - Pages: network-first, falling back to the cached copy (every page you view is cached).
 * - Hashed build assets (/_astro/), icons, OG/poster images: cache-first.
 * - VIDEO IS NEVER CACHED: video files and Range requests go straight to the network.
 *
 * Bump VERSION whenever this file's caching rules change.
 */
const VERSION = 'v2';
const PAGE_CACHE = `pages-${VERSION}`;
const ASSET_CACHE = `assets-${VERSION}`;
const MAX_PAGES = 80;

// /eat/ (ja) is precached with its photos (~2.7 MB): "show the address to the driver" and the order
// phrases must work with no signal.
const PHRASE_PAGES = ['/phrases/', '/vi/phrases/', '/en/phrases/', '/eat/'];
const PRECACHE_ASSETS = [
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/favicon.svg',
  '/media/hero-saigon-bg.webp',
];

const isVideo = (req, url) =>
  req.destination === 'video' ||
  req.headers.has('range') ||
  /\.(mp4|webm|mov|m4v|m3u8|ts)$/i.test(url.pathname);

const isStaticAsset = (url) =>
  url.pathname.startsWith('/_astro/') ||
  url.pathname.startsWith('/icons/') ||
  url.pathname.startsWith('/og/') ||
  /\.(css|js|woff2?|webp|avif|png|jpe?g|svg|ico)$/i.test(url.pathname);

/** Redirected responses can't be replayed for navigations (Safari) → store a clean copy. */
async function clean(res) {
  if (!res.redirected) return res;
  const body = await res.blob();
  return new Response(body, { status: res.status, statusText: res.statusText, headers: res.headers });
}

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  for (const key of keys.slice(0, Math.max(0, keys.length - max))) await cache.delete(key);
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const pages = await caches.open(PAGE_CACHE);
      const assets = await caches.open(ASSET_CACHE);
      const found = new Set(PRECACHE_ASSETS);
      for (const path of PHRASE_PAGES) {
        try {
          const res = await fetch(path, { cache: 'reload' });
          if (!res.ok) continue;
          const html = await res.clone().text();
          await pages.put(path, await clean(res));
          // every /_astro/ URL in the page: href, src and srcset (responsive images)
          for (const m of html.matchAll(/\/_astro\/[^"\s,)]+/g)) found.add(m[0]);
        } catch {
          /* offline during install: runtime caching still applies */
        }
      }
      // Page scripts import sibling chunks ("./client.abc.js"): follow them so the JS works offline.
      const queue = [...found].filter((u) => u.endsWith('.js'));
      while (queue.length) {
        try {
          const code = await (await fetch(queue.pop())).text();
          for (const m of code.matchAll(/["'`]\.\/([\w.-]+\.js)["'`]/g)) {
            const dep = `/_astro/${m[1]}`;
            if (!found.has(dep)) {
              found.add(dep);
              queue.push(dep);
            }
          }
        } catch {
          /* optional */
        }
      }
      await Promise.all(
        [...found].map((u) =>
          assets.add(u).catch(() => {
            /* missing optional asset */
          }),
        ),
      );
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keep = new Set([PAGE_CACHE, ASSET_CACHE]);
      for (const key of await caches.keys()) if (!keep.has(key)) await caches.delete(key);
      await self.clients.claim();
    })(),
  );
});

const OFFLINE_HTML = `<!doctype html><html lang="ja"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>オフラインです｜サイゴン・トラベル</title>
<style>body{margin:0;min-height:100dvh;display:grid;place-items:center;background:#0b1b2b;color:#f5f7fa;
font:16px/1.8 system-ui,sans-serif;text-align:center;padding:24px}a{display:inline-block;margin-top:16px;
padding:12px 24px;border-radius:999px;background:#f2a541;color:#0b1b2b;font-weight:700;text-decoration:none}</style>
</head><body><main><h1>オフラインです</h1><p>保存済みの指さし会話帳は電波がなくても使えます。</p>
<a href="/phrases/">指さし会話帳を開く</a></main></body></html>`;

async function handleNavigate(request) {
  const cache = await caches.open(PAGE_CACHE);
  try {
    const res = await fetch(request);
    if (res.ok) {
      await cache.put(request.url.split('#')[0], await clean(res.clone()));
      trim(PAGE_CACHE, MAX_PAGES);
    }
    return res;
  } catch {
    const url = new URL(request.url);
    const slash = url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`;
    return (
      (await cache.match(request, { ignoreSearch: true })) ||
      (await cache.match(slash)) ||
      new Response(OFFLINE_HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8' } })
    );
  }
}

async function handleAsset(request) {
  const cache = await caches.open(ASSET_CACHE);
  // ignoreVary: module scripts send different request headers (Origin…) than the precache fetch
  const hit = await cache.match(request, { ignoreVary: true });
  if (hit) return hit;
  const res = await fetch(request);
  if (res.ok && res.type === 'basic') await cache.put(request, res.clone());
  return res;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // Formspree, Google Maps, LINE…
  if (isVideo(request, url)) return; // never cache video — network only
  if (url.pathname === '/sw.js') return;

  if (request.mode === 'navigate') event.respondWith(handleNavigate(request));
  else if (isStaticAsset(url)) event.respondWith(handleAsset(request));
});
