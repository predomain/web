const registerServiceWorker = async () => {
  if ("serviceWorker" in navigator) {
    try {
      const registration = navigator.serviceWorker
        .register("/worker.js", {
          scope: "/",
        })
        .then((reg) => {
          if (!navigator.serviceWorker.controller) {
            return;
          }
          if (reg.waiting || reg.installing) {
            return;
          }
          reg.addEventListener("updatefound", () => {
            const worker = reg.installing;
            worker.addEventListener("statechange", () => {
              if (worker.state == "installed") {
                worker.postMessage({ action: "skipWaiting" });
              }
            });
          });
        });
    } catch (e) {
      console.error("Registration failed with " + e);
    }
  }
};

registerServiceWorker();
