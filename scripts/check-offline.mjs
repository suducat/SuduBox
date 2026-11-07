// Validate the actual generated worker without requiring a browser or network.
import { readFile, access } from "node:fs/promises";
import vm from "node:vm";
import assert from "node:assert/strict";
const source = await readFile(
  new URL("../dist/sw.js", import.meta.url),
  "utf8",
);
const entries = JSON.parse(source.match(/const ASSETS = (.*);/)[1]);
await Promise.all(
  entries.map((path) => access(new URL("../dist/" + path, import.meta.url))),
);
assert(entries.includes("index.html"));
console.log(`PASS: ${entries.length} 个预缓存资源全部存在`);
const handlers = {};
const scope = "https://example.test/study/";
const prefix = "sudubox-" + encodeURIComponent(scope) + "-";
const stores = new Map([
  ["unrelated", new Map()],
  [prefix + "old", new Map()],
  ["sudubox-other-project", new Map()],
]);
const caches = {
  open: async (name) => {
    if (!stores.has(name)) stores.set(name, new Map());
    const map = stores.get(name);
    return {
      addAll: async (urls) => {
        for (const url of urls) map.set(url, { url });
      },
      match: async (request) =>
        map.get(typeof request === "string" ? request : request.url),
    };
  },
  keys: async () => [...stores.keys()],
  delete: async (key) => stores.delete(key),
};
vm.runInNewContext(source, {
  URL,
  caches,
  fetch: async () => {
    throw new Error("模拟断网");
  },
  self: {
    registration: { scope },
    location: { origin: "https://example.test" },
    clients: { claim: async () => {} },
    skipWaiting: async () => {},
    addEventListener: (name, handler) => {
      handlers[name] = handler;
    },
  },
});
let pending;
handlers.install({
  waitUntil: (p) => {
    pending = p;
  },
});
await pending;
const request = async (req) => {
  let response;
  handlers.fetch({
    request: req,
    respondWith: (p) => {
      response = p;
    },
  });
  return response;
};
const html = await request({ method: "GET", url: scope, mode: "navigate" });
assert.equal(html.url, scope + "index.html");
console.log("PASS: 子目录导航在网络不可用时返回缓存应用壳");
const asset = entries.find((x) => x.endsWith(".js"));
assert.equal(
  (await request({ method: "GET", url: scope + asset, mode: "cors" })).url,
  scope + asset,
);
assert.equal(
  await request({
    method: "GET",
    url: "https://external.test/a",
    mode: "cors",
  }),
  undefined,
);
console.log("PASS: 本地静态资源离线命中，不拦截外部来源");
handlers.activate({
  waitUntil: (p) => {
    pending = p;
  },
});
await pending;
assert(!stores.has(prefix + "old"));
assert(stores.has("sudubox-other-project"));
assert(stores.has("unrelated"));
console.log("PASS: 更新只清理本应用旧缓存");

assert.equal(
  await request({
    method: "GET",
    url: "https://example.test/other/",
    mode: "navigate",
  }),
  undefined,
);
const manifest = JSON.parse(
  await readFile(
    new URL("../dist/manifest.webmanifest", import.meta.url),
    "utf8",
  ),
);
assert.equal(manifest.name, "速度工具箱");
assert.equal(new URL(manifest.start_url, scope).href, scope);
assert.equal(new URL(manifest.scope, scope).href, scope);
assert.equal(manifest.display, "standalone");
assert(manifest.icons.some((i) => i.sizes === "192x192"));
assert(
  manifest.icons.some((i) => i.sizes === "512x512" && i.purpose === "maskable"),
);
for (const icon of manifest.icons)
  await access(new URL("../dist/" + icon.src, import.meta.url));
console.log("PASS: Manifest 安装地址、图标、独立窗口与子路径隔离");
