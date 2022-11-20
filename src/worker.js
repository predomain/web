const cacheVersion = "v1.4";

const addResourcesToCache = async (resources) => {
  const cache = await caches.open(cacheVersion);
  await cache.addAll(resources);
};

const putInCache = async (request, response) => {
  const cache = await caches.open(cacheVersion);
  await cache.put(request, response);
};

const cacheFirst = async ({ request, preloadResponsePromise, fallbackUrl }) => {
  const responseFromCache = await caches.match(request);
  if (responseFromCache) {
    return responseFromCache;
  }
  const preloadResponse = await preloadResponsePromise;
  if (preloadResponse) {
    putInCache(request, preloadResponse.clone());
    return preloadResponse;
  }
  try {
    const responseFromNetwork = await fetch(request);
    return responseFromNetwork;
  } catch (error) {
    const fallbackResponse = await caches.match(fallbackUrl);
    if (fallbackResponse) {
      return fallbackResponse;
    }
    return new Response("Network error happened", {
      status: 408,
      headers: { "Content-Type": "text/plain" },
    });
  }
};

const enableNavigationPreload = async () => {
  if (self.registration.navigationPreload) {
    await self.registration.navigationPreload.enable();
  }
};

self.addEventListener("activate", (event) => {
  event.waitUntil(enableNavigationPreload());
});

self.addEventListener("install", (event) => {
  event.waitUntil(
    addResourcesToCache([
      /* ADD ADDITIONAL COMPLILED SCRIPTS HERE ON BUILD */

      /* JS */
      "assets/js/apng-canvas.min.js",
      "assets/js/trezor-connect.js",
      "assets/js/libarchive/worker-bundle.js",
      "assets/js/libarchive/wasm-gen/libarchive.js",
      "assets/js/libarchive/wasm-gen/libarchive.wasm",
      "assets/categories/categories.7z",
    ])
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    cacheFirst({
      request: event.request,
      preloadResponsePromise: event.preloadResponse,
      fallbackUrl: "Not found",
    })
  );
});
