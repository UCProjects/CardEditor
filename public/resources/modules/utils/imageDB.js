const DB_NAME = 'undercards';
const DB_VERSION = 1;
const STORE = 'images';

// Cache the connection promise so we only open once
const db = new Promise((resolve, reject) => {
  const request = indexedDB.open(DB_NAME, DB_VERSION);
  request.onupgradeneeded = (e) => {
    e.target.result.createObjectStore(STORE, { keyPath: 'id' });
  };
  request.onsuccess = (e) => resolve(e.target.result);
  request.onerror = (e) => reject(e.target.error);
});

/** @typedef {import('../imageBank.js').ImageStore} ImageStore */

/** @returns {Promise<ImageStore | undefined>} */
export async function get(id) {
  const store = await transaction('readonly');
  return new Promise((resolve, reject) => {
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/** @returns {Promise<void>} */
export async function set(id, data) {
  const store = await transaction('readwrite');
  return new Promise((resolve, reject) => {
    const request = store.put({ ...data, id });
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/** @returns {Promise<void>} */
export async function remove(id) {
  const store = await transaction('readwrite');
  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

/** @returns {Promise<ImageStore[]>} */
export async function getAll() {
  const store = await transaction('readonly');
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function transaction(mode) {
  const conn = await db;
  return conn.transaction(STORE, mode).objectStore(STORE);
}