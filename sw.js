const CACHE_NAME = 'temperature-converter-v1';

// Open IndexedDB to store form data
const DB_NAME = 'converter-db';
const DB_VERSION = 1;
const DB_STORE_NAME = 'form-data';

// Use the install event to pre-cache all initial resources.
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      cache.addAll([
        './',
        './converter.js',
        './converter.css',
      ]);

      // Open IndexedDB and create an object store if it doesn't exist
      const db = await openDatabase();
      const tx = db.transaction(DB_STORE_NAME, 'readwrite');
      const store = tx.objectStore(DB_STORE_NAME);

      // Pre-populate with default values if needed
      const defaultData = { temperature: 20, fromUnit: 'c', toUnit: 'f' };
      store.put(defaultData, 'formData');
      await new Promise((resolve, reject) => {
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
    })()
  );
});

// Open IndexedDB
async function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(DB_STORE_NAME)) {
        db.createObjectStore(DB_STORE_NAME);
      }
    };

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

// Handle fetch events and return the cached response or network response.
self.addEventListener('fetch', (event) => {
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cachedResponse = await cache.match(event.request);
      if (cachedResponse) {
        return cachedResponse;
      } else {
        try {
          const fetchResponse = await fetch(event.request);
          cache.put(event.request, fetchResponse.clone());
          return fetchResponse;
        } catch (e) {
          // Network failed, handle error
        }
      }
    })()
  );
});

// Listen for messages from the main thread
self.addEventListener('message', async (event) => {

  console.log("Message received from Service Worker:", event.data);

  if (event.data && event.data.action === 'save-form-data') {
    const { temperature, fromUnit, toUnit } = event.data;

    // Store the form data in IndexedDB
    const db = await openDatabase();
    const tx = db.transaction(DB_STORE_NAME, 'readwrite');
    const store = tx.objectStore(DB_STORE_NAME);
    store.put({ temperature, fromUnit, toUnit }, 'formData');
    await tx.complete;
  }

  else if (event.data && event.data.action === 'get-form-data') {
    // Retrieve form data from IndexedDB
    const db = await openDatabase();
    const tx = db.transaction(DB_STORE_NAME, 'readonly');
    const store = tx.objectStore(DB_STORE_NAME);

    const savedData = await new Promise((resolve, reject) => {
      const request = store.get('formData');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    // Send saved data back to the client
    event.source.postMessage({
      action: 'set-form-data',
      temperature: savedData?.temperature || '20',
      fromUnit: savedData?.fromUnit || 'c',
      toUnit: savedData?.toUnit || 'f',
    });
  }
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
