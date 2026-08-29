const DB_NAME = 'CarWashLoyaltyDB';
const STORE_NAME = 'session';
const KEY_PHONE = 'carwash_phone';

function openDB() {
  if (typeof window === 'undefined' || !window.indexedDB) return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      request.onsuccess = (e) => resolve(e.target.result);
      request.onerror = () => resolve(null);
    } catch (e) {
      resolve(null);
    }
  });
}

export async function setIndexedDBPhone(phone) {
  try {
    const db = await openDB();
    if (!db) return;
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(phone, KEY_PHONE);
  } catch (e) {}
}

export async function getIndexedDBPhone() {
  try {
    const db = await openDB();
    if (!db) return '';
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(KEY_PHONE);
      req.onsuccess = () => {
        const val = req.result;
        if (val && String(val).replace(/\D/g, '').length >= 10) {
          resolve(String(val).replace(/\D/g, ''));
        } else {
          resolve('');
        }
      };
      req.onerror = () => resolve('');
    });
  } catch (e) {
    return '';
  }
}

export async function removeIndexedDBPhone() {
  try {
    const db = await openDB();
    if (!db) return;
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(KEY_PHONE);
  } catch (e) {}
}

export function getStoredPhoneSync() {
  if (typeof window === 'undefined') return '';
  try {
    // 1. LocalStorage
    const local = localStorage.getItem(KEY_PHONE);
    if (local && local.replace(/\D/g, '').length >= 10) {
      return local.replace(/\D/g, '');
    }
    // 2. SessionStorage
    const session = sessionStorage.getItem(KEY_PHONE);
    if (session && session.replace(/\D/g, '').length >= 10) {
      return session.replace(/\D/g, '');
    }
    // 3. Document Cookie
    const match = document.cookie.match(/(?:^|;\s*)carwash_phone=([^;]+)/);
    if (match && match[1] && match[1].replace(/\D/g, '').length >= 10) {
      return match[1].replace(/\D/g, '');
    }
  } catch (err) {}
  return '';
}

export function persistPhone(num) {
  if (typeof window === 'undefined' || !num) return;
  const digits = String(num).replace(/\D/g, '');
  if (digits.length < 10) return;

  // 1. LocalStorage
  try { localStorage.setItem(KEY_PHONE, digits); } catch (e) {}
  // 2. SessionStorage
  try { sessionStorage.setItem(KEY_PHONE, digits); } catch (e) {}
  // 3. Cookie con formato estricto para Safari iOS (expires + max-age + path + SameSite=Lax + Secure)
  try {
    const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
    const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = `carwash_phone=${digits}; expires=${expires}; max-age=31536000; path=/; SameSite=Lax${isHttps}`;
  } catch (e) {}
  // 4. IndexedDB
  setIndexedDBPhone(digits);
}

export function clearPersistedPhone() {
  if (typeof window === 'undefined') return;
  try { localStorage.removeItem(KEY_PHONE); } catch (e) {}
  try { sessionStorage.removeItem(KEY_PHONE); } catch (e) {}
  try {
    document.cookie = `carwash_phone=; expires=Thu, 01 Jan 1970 00:00:00 UTC; max-age=0; path=/; SameSite=Lax`;
  } catch (e) {}
  removeIndexedDBPhone();
}