(function (root, factory) {
  "use strict";
  const api = factory();
  if (typeof module === "object" && module.exports) { module.exports = api; }
  if (root) { root.MinimalNotesCache = api; }
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const META_STORE = "shard-cache-metadata";

  function metadata(storeName, key, entry) {
    return {
      key: storeName + "\n" + key, bodyKey: key, storeName: storeName,
      repo: entry.repo, branch: entry.branch, path: entry.path,
      bytes: Number(entry.bytes) || 0, accessedAt: Number(entry.accessedAt) || 0
    };
  }

  function upgrade(db, transaction, stores) {
    if (db.objectStoreNames.contains(META_STORE)) { return; }
    const meta = db.createObjectStore(META_STORE);
    meta.createIndex("storeName", "storeName");
    // Migrate cache metadata once; existing offline bodies remain available.
    stores.forEach(function (name) {
      const request = transaction.objectStore(name).openCursor();
      request.onsuccess = function () {
        const cursor = request.result;
        if (!cursor) { return; }
        const entry = metadata(name, cursor.key, cursor.value);
        meta.put(entry, entry.key);
        cursor.continue();
      };
    });
  }

  async function run(options, mode, action) {
    let db;
    let untrack = function () {};
    try {
      db = await options.openDb();
      if (!options.isCurrent()) { return null; }
      return await new Promise(function (resolve) {
        const transaction = db.transaction([options.storeName, META_STORE], mode);
        untrack = options.track(transaction);
        let value = null;
        transaction.oncomplete = function () { resolve(options.isCurrent() ? value : null); };
        transaction.onabort = transaction.onerror = function () { resolve(null); };
        action(transaction.objectStore(options.storeName), transaction.objectStore(META_STORE),
          function (result) { value = result; });
      });
    } catch (error) {
      // The cache is optional; a blocked database must not prevent a network read.
      return null;
    } finally {
      untrack();
      if (db) { db.close(); }
    }
  }

  function read(options) {
    return run(options, "readwrite", function (store, meta, done) {
      const request = store.get(options.key);
      request.onsuccess = function () {
        const entry = request.result;
        if (!entry) { return; }
        const value = metadata(options.storeName, options.key, entry);
        value.accessedAt = Date.now();
        meta.put(value, value.key);
        done(entry);
      };
    });
  }

  function write(options, entry) {
    return run(options, "readwrite", function (store, meta) {
      const request = meta.index("storeName").getAll(options.storeName);
      request.onsuccess = function () {
        const current = metadata(options.storeName, options.key, entry);
        const retained = [];
        function remove(cached) {
          store.delete(cached.bodyKey);
          meta.delete(cached.key);
        }
        (request.result || []).forEach(function (cached) {
          if (cached.key === current.key) { return; }
          if (cached.repo === current.repo && cached.branch === current.branch
            && cached.path === current.path) {
            remove(cached);
          } else {
            retained.push(cached);
          }
        });
        store.put(entry, options.key);
        meta.put(current, current.key);
        retained.push(current);
        retained.sort(function (left, right) { return right.accessedAt - left.accessedAt; });
        let bytes = 0;
        retained.forEach(function (cached) {
          bytes += cached.bytes;
          if (bytes > options.maxBytes) { remove(cached); }
        });
      };
    });
  }

  return { upgrade: upgrade, read: read, write: write };
}));
