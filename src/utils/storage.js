// IndexedDB storage with idb wrapper
import { openDB } from 'idb';

const DB_NAME = 'gym-buddy-db';
const DB_VERSION = 2;

let dbPromise = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        // 重建 store，确保 schema 干净
        ['plans', 'history', 'settings'].forEach(n => {
          if (db.objectStoreNames.contains(n)) db.deleteObjectStore(n);
        });

        const ps = db.createObjectStore('plans', { keyPath: 'id', autoIncrement: true });
        ps.createIndex('createdAt', 'createdAt');

        const hs = db.createObjectStore('history', { keyPath: 'id', autoIncrement: true });
        hs.createIndex('date', 'date');
        hs.createIndex('planId', 'planId');

        db.createObjectStore('settings', { keyPath: 'key' });
      },
    });
  }
  return dbPromise;
}

// ==================== Plans ====================
export async function getAllPlans() {
  try {
    const db = await getDB();
    return (await db.getAll('plans')) || [];
  } catch (e) {
    console.error('getAllPlans failed:', e);
    return [];
  }
}

export async function getPlan(id) {
  try {
    const db = await getDB();
    return await db.get('plans', id);
  } catch (e) { console.error(e); return null; }
}

export async function savePlan(plan) {
  try {
    const db = await getDB();
    const p = { ...plan, updatedAt: Date.now() };
    if (p.id) {
      await db.put('plans', p);
      return p;
    }
    // 新计划 — 删除 id 字段让 autoIncrement 自动生成
    delete p.id;
    p.createdAt = Date.now();
    const newId = await db.add('plans', p);
    return { ...p, id: newId };
  } catch (e) {
    console.error('savePlan failed:', e);
    throw e;
  }
}

export async function deletePlan(id) {
  try {
    const db = await getDB();
    await db.delete('plans', id);
  } catch (e) { console.error(e); }
}

// ==================== History ====================
export async function addHistoryEntry(entry) {
  try {
    const db = await getDB();
    const e = { ...entry, date: getDateKey(new Date()), timestamp: Date.now() };
    e.id = await db.add('history', e);
    return e;
  } catch (e) { console.error(e); return null; }
}

export async function getHistoryByDate(dateKey) {
  try {
    const db = await getDB();
    return (await db.getAllFromIndex('history', 'date', dateKey)) || [];
  } catch (e) { console.error(e); return []; }
}

export async function getAllHistoryDates() {
  try {
    const db = await getDB();
    const all = await db.getAll('history');
    const dates = [...new Set((all || []).map(e => e.date))].sort().reverse();
    return dates;
  } catch (e) { console.error(e); return []; }
}

export async function getAllHistory() {
  try {
    const db = await getDB();
    return (await db.getAll('history')) || [];
  } catch (e) { console.error(e); return []; }
}

// ==================== Settings ====================
export async function getSetting(key) {
  try {
    const db = await getDB();
    const entry = await db.get('settings', key);
    return entry ? entry.value : null;
  } catch (e) { console.error(e); return null; }
}

export async function setSetting(key, value) {
  try {
    const db = await getDB();
    await db.put('settings', { key, value });
  } catch (e) { console.error(e); }
}

export async function getAllSettings() {
  try {
    const db = await getDB();
    const all = (await db.getAll('settings')) || [];
    const obj = {};
    for (const s of all) obj[s.key] = s.value;
    return obj;
  } catch (e) { console.error(e); return {}; }
}

// ==================== Export / Import ====================
export async function exportData() {
  const plans = await getAllPlans();
  const history = await getAllHistory();
  const settings = await getAllSettings();
  return { plans, history, settings, exportedAt: new Date().toISOString() };
}

export async function importData(data) {
  try {
    const db = await getDB();
    if (data.plans && data.plans.length) {
      const tx = db.transaction('plans', 'readwrite');
      for (const p of data.plans) await tx.store.put(p);
      await tx.done;
    }
    if (data.history && data.history.length) {
      const tx = db.transaction('history', 'readwrite');
      for (const h of data.history) await tx.store.put(h);
      await tx.done;
    }
    if (data.settings) {
      const tx = db.transaction('settings', 'readwrite');
      for (const [k, v] of Object.entries(data.settings)) await tx.store.put({ key: k, value: v });
      await tx.done;
    }
  } catch (e) { console.error(e); throw e; }
}

// ==================== Helpers ====================
export function getDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}