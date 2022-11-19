const cacheVersion = "v1.5";

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
      "376.630e9c312533da08.js",
      "376.630e9c312533da08.js.map",
      "394.7ad1cb521449aaef.js",
      "394.7ad1cb521449aaef.js.map",
      "3rdpartylicenses.txt",
      "439.cc328c25e8c6dcfb.js",
      "439.cc328c25e8c6dcfb.js.map",
      "592.aa7fce8c7d63727d.js",
      "592.aa7fce8c7d63727d.js.map",
      "650.875c5af0d2b3883e.js",
      "650.875c5af0d2b3883e.js.map",
      "834.139c4b5f1a511c55.js",
      "834.139c4b5f1a511c55.js.map",
      "9.74ee000b1b183932.js",
      "9.74ee000b1b183932.js.map",
      "main.ebab8273bde66df7.js",
      "main.ebab8273bde66df7.js.map",
      "os.7777133e901cd5ed.woff2",
      "osbold.916d3686010a8de2.woff2",
      "polyfills.b99237f0facb2d76.js",
      "polyfills.b99237f0facb2d76.js.map",
      "runtime.0481070b66957142.js",
      "runtime.0481070b66957142.js.map",
      "styles.b2cc34656e534133.css",
      "styles.b2cc34656e534133.css.map",
      "vendor.89e138274ba0e9c9.js",
      "vendor.89e138274ba0e9c9.js.map",

      /* JS */
      "assets/js/apng-canvas.min.js",
      "assets/js/trezor-connect.js",
      "assets/js/libarchive/worker-bundle.js",
      "assets/js/libarchive/wasm-gen/libarchive.js",
      "assets/js/libarchive/wasm-gen/libarchive.wasm",

      /* CATEGORIES */
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
