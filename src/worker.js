const cacheVersion = "v1";

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

      /* CORE SCRIPTS */
      "main.js",
      "runtime.js",
      "polyfills.js",
      "styles.js",
      "styles.css",

      /* JS */
      "assets/js/apng-canvas.min.js",
      "assets/js/trezor-connect.js",
      "assets/js/libarchive/worker-bundle.js",
      "assets/js/libarchive/wasm-gen/libarchive.js",
      "assets/js/libarchive/wasm-gen/libarchive.wasm",

      /* CATEGORIES */
      "assets/categories/0x10k-meta.json",
      "assets/categories/0x99-meta.json",
      "assets/categories/0x999-meta.json",
      "assets/categories/0xemoji-meta.json",
      "assets/categories/100k-meta.json",
      "assets/categories/10k-meta.json",
      "assets/categories/3l-meta.json",
      "assets/categories/999-meta.json",
      "assets/categories/a100k-meta.json",
      "assets/categories/a10k-meta.json",
      "assets/categories/a999-meta.json",
      "assets/categories/apos10k-meta.json",
      "assets/categories/apos99-meta.json",
      "assets/categories/apos999-meta.json",
      "assets/categories/b100k-meta.json",
      "assets/categories/b10k-meta.json",
      "assets/categories/b99-meta.json",
      "assets/categories/b999-meta.json",
      "assets/categories/categories.7z",
      "assets/categories/cst-meta.json",
      "assets/categories/ct-meta.json",
      "assets/categories/d100k-meta.json",
      "assets/categories/d10k-meta.json",
      "assets/categories/d99-meta.json",
      "assets/categories/d999-meta.json",
      "assets/categories/doubleemojis-meta.json",
      "assets/categories/emojis-meta.json",
      "assets/categories/firstnames-meta.json",
      "assets/categories/hemoji99-meta.json",
      "assets/categories/hemoji999-meta.json",
      "assets/categories/kemoji100k-meta.json",
      "assets/categories/kemoji10k-meta.json",
      "assets/categories/kemoji999-meta.json",
      "assets/categories/lastnames-meta.json",
      "assets/categories/n100k-meta.json",
      "assets/categories/n10k-meta.json",
      "assets/categories/n99-meta.json",
      "assets/categories/n999-meta.json",
      "assets/categories/na100k-meta.json",
      "assets/categories/na10k-meta.json",
      "assets/categories/na99-meta.json",
      "assets/categories/na999-meta.json",
      "assets/categories/nemoji99-meta.json",
      "assets/categories/nemoji999-meta.json",
      "assets/categories/p100-meta.json",
      "assets/categories/p1k-meta.json",
      "assets/categories/quademojis-meta.json",
      "assets/categories/root.json",
      "assets/categories/st-meta.json",
      "assets/categories/tripleemojis-meta.json",
      "assets/categories/u100k-meta.json",
      "assets/categories/u10k-meta.json",
      "assets/categories/u99-meta.json",
      "assets/categories/u999-meta.json",
      "assets/categories/w99-meta.json",
      "assets/categories/w999-meta.json",
      "assets/categories/di99-meta.json",
      "assets/categories/di999-meta.json",
      "assets/categories/di10k-meta.json",
      "assets/categories/i99-meta.json",
      "assets/categories/i999-meta.json",
      "assets/categories/i10k-meta.json",
      "assets/categories/0xemoji99-meta.json",
      "assets/categories/0xemoji999-meta.json",
      "assets/categories/0xemoji10k-meta.json",
      "assets/categories/aposemojis-meta.json",

      /* FONTS */
      "assets/fonts/os.woff2",
      "assets/fonts/osbold.woff2",
      "assets/icons/cart_empty.apng",
      "assets/icons/check.apng",
      "assets/icons/confetti.apng",
      "assets/icons/llayers.apng",
      "assets/icons/spin.apng",
      "assets/icons/twemoji.svg",
      "assets/icons/marketplaces/domainplug.png",
      "assets/icons/marketplaces/ensvision.png",
      "assets/icons/marketplaces/kodex.png",
      "assets/icons/marketplaces/looksrare.png",
      "assets/icons/marketplaces/opensea.png",
      "assets/icons/marketplaces/x2y2.png",

      /* ICONS */
      "assets/category-profile-blank.svg",
      "assets/ens.svg",
      "assets/etherscan-logo-light-circle.png",
      "assets/icn-coinbase-wallet.svg",
      "assets/icn-ledger.svg",
      "assets/icn-metamask.svg",
      "assets/icn-wallet-connect.svg",
      "assets/img-blank.png",
      "assets/ledger-connect-in-progress.png",
      "assets/ledger-logo.png",
      "assets/ledger-sign-in-progress.png",
      "assets/logo.png",
      "assets/menu-arrow-icon.svg",
      "assets/metamask-connect-in-progress.png",
      "assets/metamask-sign-in-progress.png",
      "assets/profile-blank.svg",
      "assets/trezor-connect-in-progress.png",
      "assets/trezor-logo.png",
      "assets/trezor-sign-in-progress.png",
      "assets/wallet-connect-logo.png",
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
