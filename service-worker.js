const cacheName = "mafCache"
const precachedResources = ["/", "/index.html", "/perlin.js", "/maf.js", "https://cdn.jsdelivr.net/npm/purecss@3.0.0/build/pure-min.css", "/maf.css"];

async function precache() {
    const cache = await caches.open(cacheName);
    return cache.addAll(precachedResources);
}

self.addEventListener("install", (event) => {
    event.waitUntil(precache());
});

function isCacheable(request) {
    const url = new URL(request.url);
    return !url.pathname.endsWith(".json");
  }
  
  async function cacheFirstWithRefresh(request) {
    const fetchResponsePromise = fetch(request).then(async (networkResponse) => {
      if (networkResponse.ok) {
        const cache = await caches.open(cacheName);
        cache.put(request, networkResponse.clone());
      }
      return networkResponse;
    });
  
    return (await caches.match(request)) || (await fetchResponsePromise);
  }
  
  self.addEventListener("fetch", (event) => {
    if (isCacheable(event.request)) {
      event.respondWith(cacheFirstWithRefresh(event.request));
    }
  });