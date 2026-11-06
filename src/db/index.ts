import { emptyData, type Data } from "../types";
let connection: Promise<IDBDatabase> | undefined;
function open() {
  return (connection ??= new Promise((resolve, reject) => {
    const request = indexedDB.open("sudubox", 1);
    request.onupgradeneeded = () => {
      request.result.createObjectStore("state");
    };
    request.onsuccess = () => {
      request.result.onversionchange = () => {
        request.result.close();
        connection = undefined;
      };
      resolve(request.result);
    };
    request.onerror = () => {
      connection = undefined;
      reject(request.error);
    };
    request.onblocked = () =>
      reject(new Error("请关闭其他速度工具箱标签页后重试"));
  }));
}
export async function load(): Promise<Data> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const request = db.transaction("state").objectStore("state").get("data");
    request.onsuccess = () => resolve({ ...emptyData(), ...request.result });
    request.onerror = () => reject(request.error);
  });
}
// Read and modify inside the SAME readwrite transaction: different tabs cannot
// overwrite unrelated changes with an old page snapshot.
export async function mutate(fn: (data: Data) => Data): Promise<Data> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("state", "readwrite");
    const store = tx.objectStore("state");
    let next: Data;
    const request = store.get("data");
    request.onsuccess = () => {
      try {
        next = fn({ ...emptyData(), ...request.result });
        for (const key of [
          "courses",
          "lessons",
          "notes",
          "exams",
          "words",
          "focus",
        ] as const) {
          const seen = new Set<string>();
          const rows = next[key];
          for (let i = rows.length - 1; i >= 0; i--) {
            if (seen.has(rows[i].id)) rows.splice(i, 1);
            else seen.add(rows[i].id);
          }
        }
        store.put(next, "data");
      } catch (error) {
        tx.abort();
        reject(error);
      }
    };
    tx.oncomplete = () => resolve(next);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error("保存已取消"));
  });
}
