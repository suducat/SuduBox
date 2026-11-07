import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

// Small static-only service worker: no backend, runtime CDN, or remote caching.
function offlineShell(): Plugin {
  return {
    name: "sudubox-offline-shell",
    apply: "build",
    generateBundle(_options, bundle) {
      const assets = [
        ...Object.keys(bundle),
        "index.html",
        "favicon.png",
        "icon-192.png",
        "icon-512.png",
        "manifest.webmanifest",
        "author-suducat.png",
        "apple-touch-icon.png",
        "icon-maskable.png",
      ];
      const version = `sudubox-${Date.now()}`;
      const source = `
const PREFIX = "sudubox-" + encodeURIComponent(self.registration.scope) + "-";
const CACHE = PREFIX + ${JSON.stringify(version)};
const ASSETS = ${JSON.stringify(assets)};
const url = path => new URL(path, self.registration.scope).href;
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS.map(url))));
});
self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || !event.request.url.startsWith(self.registration.scope)) return;
  if (event.request.mode === 'navigate') {
    event.respondWith(caches.open(CACHE).then(cache => cache.match(url('index.html'))).then(cached => cached || fetch(event.request)));
    return;
  }
  event.respondWith(caches.open(CACHE).then(cache => cache.match(event.request, {ignoreVary: true})).then(cached => cached || fetch(event.request)));
});`;
      this.emitFile({ type: "asset", fileName: "sw.js", source });
    },
  };
}
export default defineConfig({
  base: "./",
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          aipS1: ["./src/data/aip-s1.json"],
          aipS2: ["./src/data/aip-s2.json"],
          aipS3: ["./src/data/aip-s3.json"],
          math: ["katex"],
          react: ["react", "react-dom"],
        },
      },
    },
  },
  plugins: [react(), offlineShell()],
});
