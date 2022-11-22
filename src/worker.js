const cacheVersion = "v3";
const timeUntilVersionCheckExpiresMs = 60000;
const versionCheckControlKey = "marketplace";
const versionCheckControlSourceKey = "version.predomain.eth.limo";
const versionCheckControlSource = "https://version.predomain.eth.limo";
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
const cachedItemsFromSources = ["https://metadata.ens.domains"];

const putInCache = async (request, response) => {
  const cache = await caches.open(cacheVersion);
  await cache.put(request, response);
};

const cacheFirst = async ({ request, preloadResponsePromise }) => {
  try {
    if (request.url.indexOf("/worker.js") > -1) {
      const timeNow = new Date().getTime();
      const currentVersionRaw = await caches.match(
        new URL(versionCheckControlSource)
      );
      const currentVersionDate = await caches.match(
        new URL(versionCheckControlSource + "_last_check")
      );
      if (currentVersionDate !== undefined) {
        const versionDate = await currentVersionDate.text();
        if (parseInt(versionDate) + timeUntilVersionCheckExpiresMs < timeNow) {
          console.log(
            "Version check has expired. Last check was:",
            versionDate,
            " - now checking for the latest version..."
          );
          const versionCheckRaw = await fetch(versionCheckControlSource);
          const currentVersion = await currentVersionRaw.json();
          const versionCheck = await versionCheckRaw.json();
          if (
            versionCheck[versionCheckControlKey] !==
            currentVersion[versionCheckControlKey]
          ) {
            console.log("New version detected. Flushing cache now.");
            const lcaches = await caches.keys();
            for await (const c of lcaches) {
              caches.delete(c);
            }
            return;
          } else {
            console.log("No changes to the version detected.");
            putInCache(
              new Request(versionCheckControlSource + "_last_check"),
              new Response(new Date().getTime(), {
                status: 200,
                headers: { "Content-Type": "text/plain" },
              })
            );
          }
        }
      } else {
        const versionCheckRaw = await fetch(versionCheckControlSource);
        putInCache(new Request(versionCheckControlSource), versionCheckRaw);
        putInCache(
          new Request(versionCheckControlSource + "_last_check"),
          new Response(new Date().getTime(), {
            status: 200,
            headers: { "Content-Type": "text/plain" },
          })
        );
      }
    }
    const responseFromCache = await caches.match(request);
    if (responseFromCache) {
      return responseFromCache;
    }
    const preloadResponse = await preloadResponsePromise;
    if (preloadResponse) {
      putInCache(request, preloadResponse.clone());
      return preloadResponse;
    }
    const regex = new RegExp(cachableItems.join("|"));
    const responseFromNetwork = await fetch(request);
    const toIncludeForCaching = cachedItemsFromSources.filter(
      (ci) => request.url.indexOf(ci) > -1
    );
    if (request.url.match(regex) !== null || toIncludeForCaching.length > 0) {
      putInCache(request, responseFromNetwork.clone());
    }
    return responseFromNetwork;
  } catch (e) {
    console.log("Error:", e);
    return new Response(
      "An error has occured while processing your requst for: " + request.url,
      {
        status: 503,
        headers: { "Content-Type": "text/plain" },
      }
    );
  }
};

const enableNavigationPreload = async () => {
  if (self.registration.navigationPreload) {
    await self.registration.navigationPreload.enable();
  }
};

self.addEventListener("message", function (event) {
  if (event.data.action === "skipWaiting") {
    self.skipWaiting();
  }
});

self.addEventListener("activate", (event) => {
  event.waitUntil(enableNavigationPreload());
});

self.addEventListener("fetch", (event) => {
  if (event.request.url.indexOf(versionCheckControlSourceKey) > -1) {
    return;
  }
  event.respondWith(
    cacheFirst({
      request: event.request,
      preloadResponsePromise: event.preloadResponse,
    })
  );
});
