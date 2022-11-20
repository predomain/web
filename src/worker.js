const cacheVersion = "v1.6";
const cachableItems = [
  ".js",
  ".js.map",
  ".png",
  ".7z",
  ".jpg",
  ".json",
  ".css",
  ".woff2",
  ".scss",
  ".svg",
];

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
    console.log("Found cache... ", request.url);
    return responseFromCache;
  }
  const preloadResponse = await preloadResponsePromise;
  if (preloadResponse) {
    console.log("No cache found... ", request.url);
    putInCache(request, preloadResponse.clone());
    return preloadResponse;
  }
  try {
    console.log("No preload, fetch raw data... ", request.url);
    const regex = new RegExp(cachableItems.join("|"));
    const responseFromNetwork = await fetch(request);
    if (request.url.match(regex) !== null) {
      putInCache(request, responseFromNetwork.clone());
    }
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

self.addEventListener("fetch", (event) => {
  event.respondWith(
    cacheFirst({
      request: event.request,
      preloadResponsePromise: event.preloadResponse,
      fallbackUrl: "Not found",
    })
  );
});
