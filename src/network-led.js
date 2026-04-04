export function createNetworkLed(setState) {
  let pendingRequests = 0;
  let offlineReady = false;

  const originalFetch = window.fetch.bind(window);

  const refresh = () => {
    if (pendingRequests > 0) {
      setState('loading', 'Network: fetching');
      return;
    }

    if (offlineReady) {
      setState('offline-ready', 'Network: offline-ready');
      return;
    }

    if (navigator.onLine) {
      setState('online', 'Network: online');
      return;
    }

    setState('offline', 'Network: offline');
  };

  window.fetch = async (...args) => {
    pendingRequests += 1;
    refresh();

    try {
      return await originalFetch(...args);
    } finally {
      pendingRequests = Math.max(0, pendingRequests - 1);
      refresh();
    }
  };

  const onOnline = () => refresh();
  const onOffline = () => refresh();
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);
  refresh();

  return {
    markOfflineReady() {
      setState('offline-ready', 'Network: offline-ready');
    },
    dispose() {
      window.fetch = originalFetch;
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    },
  };
}
