// firebase-service.js  v2 — Phase 9a 雙軌服務
//
// ⚠️  已知限制（Phase 9a 接受，Phase 9b 解決）：
//   1. 斷線時資料存 localStorage，連線恢復後「不會」自動補推回 Firestore。
//      → Phase 9b 改用 enableIndexedDbPersistence，讓 Firebase 引擎處理離線同步。
//   2. 快照類資料（gupan/beipan/pandian）以日期為 Document ID，同日多人修改
//      會發生 Last-Write-Wins 靜默覆蓋。
//      → Phase 9b 引入 Firestore Transaction 解決。
//   3. Security Rules 目前全開，上線前必須收緊（App Check 或 Auth）。

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getFirestore, collection, doc,
  setDoc, getDoc, getDocs, updateDoc, deleteDoc,
  query, orderBy, limit, where,
  serverTimestamp, Timestamp, arrayUnion, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";
import {
  getAuth, signInAnonymously
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// ─── Firebase Config（從 Console 複製貼上）─────────────────────
// 步驟：https://console.firebase.google.com → 專案設定 → Your apps → Web App → firebaseConfig
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyC3FHchC_pHZHz2ZghxSS0mrDGBWhB_M1o",
  authDomain: "stork11-embryo-lab.firebaseapp.com",
  projectId: "stork11-embryo-lab",
  storageBucket: "stork11-embryo-lab.firebasestorage.app",
  messagingSenderId: "565116361227",
  appId: "1:565116361227:web:6788ae3503bf431cf3050e"
};

// ─── 環境偵測：正式站 vs 測試站 ────────────────────────────────
const IS_PROD = location.hostname === 'stork11-embryo-lab.web.app'
             || location.hostname === 'stork11-embryo-lab.firebaseapp.com';
const DB_PREFIX = IS_PROD ? '' : 'test_';
const COLLECTIONS = {
  changelog:       DB_PREFIX + 'kucun_changelog',
  jinhuo:          DB_PREFIX + 'jinhuo_records',
  orders:          DB_PREFIX + 'orders',
  pandian:         DB_PREFIX + 'pandian_snapshots',
  beipan:          DB_PREFIX + 'beipan_snapshots',
  gupan_snapshots: DB_PREFIX + 'gupan_snapshots',
  gupan_drafts:    DB_PREFIX + 'gupan_drafts',
  beipan_lock:     DB_PREFIX + 'beipan_lock',
};
window._isTestEnv = !IS_PROD;

// ─── 初始化 ────────────────────────────────────────────────────
let _db = null;
let _fsReady = false;

export async function initFirebaseApp() {
  try {
    const app = initializeApp(FIREBASE_CONFIG);
    _db = getFirestore(app);
    const auth = getAuth(app);
    await signInAnonymously(auth);  // 確保 auth token 就位後才開放 Firestore 讀寫
    _fsReady = true;
    console.log("[Firebase] Firestore + 匿名登入 成功");
  } catch (err) {
    _fsReady = false;
    console.warn("[Firebase] 初始化失敗，降級至 localStorage", err);
  }
}

export function isFirestoreAvailable() {
  return _fsReady && _db !== null;
}

// ─── 雙軌寫入核心 ──────────────────────────────────────────────
// ⚠️ 斷線時 Firestore 失敗，localStorage 有資料但不自動補推
async function dualWrite(localKey, localData, firestoreFn) {
  try {
    const raw = localStorage.getItem(localKey);
    const existing = JSON.parse(raw || "[]");
    if (Array.isArray(existing)) {
      const idx = existing.findIndex(x => x.id === localData.id);
      if (idx >= 0) existing[idx] = localData;
      else existing.push(localData);
      localStorage.setItem(localKey, JSON.stringify(existing));
    } else {
      localStorage.setItem(localKey, JSON.stringify(localData));
    }
  } catch (e) {
    console.warn("[dualWrite] localStorage 寫入失敗", e);
  }

  if (isFirestoreAvailable()) {
    try {
      await firestoreFn(_db);
    } catch (e) {
      console.warn("[dualWrite] Firestore 寫入失敗，⚠️ 資料僅存 localStorage，不會自動補推", e);
    }
  }
}

// ─── 通用讀取：優先 Firestore，降級 localStorage ───────────────
async function fsGetOrFallback(localKey, firestoreFn, fallbackDefault = []) {
  if (isFirestoreAvailable()) {
    try {
      const result = await firestoreFn(_db);
      // Firestore 讀取成功後同步回 localStorage，確保快取不陳舊
      try { localStorage.setItem(localKey, JSON.stringify(result)); } catch(e) {}
      return result;
    } catch (e) {
      console.warn("[fsGetOrFallback] Firestore 讀取失敗，使用 localStorage", e);
    }
  }
  return JSON.parse(localStorage.getItem(localKey) || JSON.stringify(fallbackDefault));
}

// ─── 工具：安全寫入 createdAt（只在第一次建立時設定）──────────
async function buildPayloadWithTimestamps(db, collectionName, docId, data) {
  const ref = doc(db, collectionName, docId);
  const snap = await getDoc(ref);
  const payload = { ...data, updatedAt: serverTimestamp() };
  if (!snap.exists()) payload.createdAt = serverTimestamp();
  return { ref, payload };
}

// ─── orders ───────────────────────────────────────────────────
export async function saveOrder(orderObj) {
  await dualWrite("order-history", orderObj, async (db) => {
    const { ref, payload } = await buildPayloadWithTimestamps(db, COLLECTIONS.orders, orderObj.id, orderObj);
    await setDoc(ref, payload, { merge: true });
  });
}

export async function getOrders() {
  return fsGetOrFallback("order-history", async (db) => {
    const snap = await getDocs(query(collection(db, COLLECTIONS.orders), orderBy("date", "desc")));
    return snap.docs.map(d => d.data());
  });
}

export async function updateOrderStatus(orderId, status) {
  try {
    if (isFirestoreAvailable()) {
      await updateDoc(doc(_db, COLLECTIONS.orders, orderId), { status, updatedAt: serverTimestamp() });
    }
    const orders = JSON.parse(localStorage.getItem("order-history") || "[]");
    const idx = orders.findIndex(o => o.id === orderId);
    if (idx >= 0) { orders[idx].status = status; localStorage.setItem("order-history", JSON.stringify(orders)); }
  } catch (e) { console.warn("[updateOrderStatus]", e); }
}

// ─── jinhuo_records ───────────────────────────────────────────
export async function saveJinhuoRecord(recordObj) {
  await dualWrite("jinhuo-records", recordObj, async (db) => {
    const { ref, payload } = await buildPayloadWithTimestamps(db, COLLECTIONS.jinhuo, recordObj.id, recordObj);
    await setDoc(ref, payload, { merge: true });
  });
}

export async function getJinhuoRecords() {
  return fsGetOrFallback("jinhuo-records", async (db) => {
    const snap = await getDocs(query(collection(db, COLLECTIONS.jinhuo), orderBy("receivedAt", "desc")));
    return snap.docs.map(d => d.data());
  });
}

// logObj 為必填：{ productId, productName, lotNumber, qty, unit, vendor }
// 強綁定設計：作廢 + 稽核日誌封裝在同一個函數，UI 層不需另外呼叫 appendKucunLog
export async function voidJinhuoRecord(recordId, voidedBy, voidReason, logObj) {
  const historyEntry = {
    changedAt: new Date().toISOString(),
    changedBy: voidedBy,
    changes: [{ field: "status", from: "正常", to: "作廢" }],
    reason: voidReason
  };
  try {
    if (isFirestoreAvailable()) {
      await updateDoc(doc(_db, COLLECTIONS.jinhuo, recordId), {
        isVoided: true, voidedBy, voidReason,
        updatedAt: serverTimestamp(),
        history: arrayUnion(historyEntry)
      });
    }
    const records = JSON.parse(localStorage.getItem("jinhuo-records") || "[]");
    const idx = records.findIndex(r => r.id === recordId);
    if (idx >= 0) {
      Object.assign(records[idx], { isVoided: true, voidedBy, voidReason });
      records[idx].history = [...(records[idx].history || []), historyEntry];
      localStorage.setItem("jinhuo-records", JSON.stringify(records));
    }
  } catch (e) { console.warn("[voidJinhuoRecord]", e); }

  await appendKucunLog({
    id: `${Date.now()}-void`,
    ts: new Date().toISOString(),
    source: "void",
    action: "void",
    ...logObj,
    note: `作廢進貨紀錄 ${recordId}：${voidReason}`
  });
}

// ─── kucun_changelog（append-only，稽核軌跡，不能修改）─────────
export async function appendKucunLog(logObj) {
  try {
    const existing = JSON.parse(localStorage.getItem("kucun-changelog") || "[]");
    existing.push(logObj);
    localStorage.setItem("kucun-changelog", JSON.stringify(existing));
  } catch (e) { console.warn("[appendKucunLog] localStorage 失敗", e); }

  if (isFirestoreAvailable()) {
    try {
      const ref = doc(_db, COLLECTIONS.changelog, logObj.id);
      await setDoc(ref, {
        ...logObj,
        ts: Timestamp.fromDate(new Date(logObj.ts)),
        tsRaw: logObj.ts
      });
    } catch (e) { console.warn("[appendKucunLog] Firestore 失敗", e); }
  }
}

export async function deleteKucunLogEntries(ids = []) {
  if (!ids.length) return;
  // localStorage 同步刪除
  try {
    const existing = JSON.parse(localStorage.getItem("kucun-changelog") || "[]");
    const filtered = existing.filter(e => !ids.includes(e.id));
    localStorage.setItem("kucun-changelog", JSON.stringify(filtered));
  } catch (e) { console.warn("[deleteKucunLogEntries] localStorage 失敗", e); }
  // Firestore 刪除
  if (isFirestoreAvailable()) {
    await Promise.all(ids.map(id => deleteDoc(doc(_db, COLLECTIONS.changelog, id)).catch(e => console.warn("[deleteKucunLogEntries] 刪除失敗", id, e))));
  }
}

export async function getKucunChangelog(productId = null, limitCount = 200) {
  return fsGetOrFallback("kucun-changelog", async (db) => {
    let q = query(collection(db, COLLECTIONS.changelog), orderBy("ts", "desc"), limit(limitCount));
    if (productId) q = query(collection(db, COLLECTIONS.changelog),
      where("productId", "==", productId), orderBy("ts", "desc"), limit(limitCount));
    const snap = await getDocs(q);
    return snap.docs.map(d => {
      const data = d.data();
      // ts 存成 Firestore Timestamp，讀回時轉成 ISO string
      if (data.ts && typeof data.ts !== 'string') {
        data.ts = data.tsRaw || data.ts.toDate().toISOString();
      }
      return data;
    });
  });
}

export async function getManualKucunLogsAfter(afterIso) {
  if (!afterIso) return [];
  try {
    const db = _db || (isFirestoreAvailable() ? _db : null);
    if (!db) return [];
    const q = query(collection(db, COLLECTIONS.changelog), where('source', '==', 'manual'));
    const snap = await getDocs(q);
    return snap.docs
      .map(d => d.data())
      .filter(e => {
        const logTime = e.tsRaw ||
                        (typeof e.ts === 'string' ? e.ts : e.ts?.toDate?.().toISOString()) ||
                        '';
        return (
          logTime > afterIso &&
          ['use', 'discard', 'adjust'].includes(e.action) &&
          e.productId && e.lotNumber
        );
      });
  } catch (e) {
    console.warn('[getManualKucunLogsAfter]', e);
    return [];
  }
}

// ─── pandian_snapshots ────────────────────────────────────────
export async function savePandianSnapshot(snapshotObj) {
  const docId = snapshotObj.date.replace(/\//g, "-");
  await dualWrite("pandian-history", { ...snapshotObj, _docId: docId }, async (db) => {
    const { ref, payload } = await buildPayloadWithTimestamps(db, COLLECTIONS.pandian, docId, snapshotObj);
    await setDoc(ref, payload, { merge: true });
  });
  localStorage.setItem("pandian-result", JSON.stringify(snapshotObj));
}

export async function getLatestPandian() {
  if (isFirestoreAvailable()) {
    try {
      const snap = await getDocs(query(collection(_db, COLLECTIONS.pandian), orderBy("date", "desc"), limit(1)));
      if (!snap.empty) return snap.docs[0].data();
    } catch (e) { console.warn("[getLatestPandian]", e); }
  }
  return JSON.parse(localStorage.getItem("pandian-result") || "null");
}

export async function getPandianHistory() {
  return fsGetOrFallback("pandian-history", async (db) => {
    const snap = await getDocs(query(collection(db, COLLECTIONS.pandian), orderBy("date", "desc")));
    return snap.docs.map(d => d.data());
  });
}

// ─── beipan_snapshots ─────────────────────────────────────────
export async function saveBeipanSnapshot(snapshotObj) {
  const docId = snapshotObj.date.replace(/\//g, "-");
  await dualWrite("beipan-result", snapshotObj, async (db) => {
    const { ref, payload } = await buildPayloadWithTimestamps(db, COLLECTIONS.beipan, docId, snapshotObj);
    await setDoc(ref, payload, { merge: true });
  });
}

export async function getLatestBeipan() {
  if (isFirestoreAvailable()) {
    try {
      const snap = await getDocs(query(collection(_db, COLLECTIONS.beipan), orderBy("date", "desc"), limit(1)));
      if (!snap.empty) return snap.docs[0].data();
    } catch (e) { console.warn("[getLatestBeipan]", e); }
  }
  const stored = JSON.parse(localStorage.getItem("beipan-result") || "null");
  if (Array.isArray(stored)) {
    return stored.sort((a, b) => (b.date || '').localeCompare(a.date || ''))[0] || null;
  }
  return stored;
}

export async function getBeipanHistory(limitCount = 5) {
  return fsGetOrFallback("beipan-result", async (db) => {
    const snap = await getDocs(query(
      collection(db, COLLECTIONS.beipan), orderBy("date", "desc"), limit(limitCount)
    ));
    return snap.docs.map(d => d.data());
  }, []);
}

// ─── gupan_snapshots ──────────────────────────────────────────
export async function saveGupanSnapshot(snapshotObj) {
  const docId = snapshotObj.date.replace(/\//g, "-");
  await dualWrite("gupan-confirmed", snapshotObj, async (db) => {
    const { ref, payload } = await buildPayloadWithTimestamps(db, COLLECTIONS.gupan_snapshots, docId, snapshotObj);
    await setDoc(ref, payload, { merge: true });
  });
}

export async function getLatestGupan() {
  if (isFirestoreAvailable()) {
    try {
      const snap = await getDocs(query(collection(_db, COLLECTIONS.gupan_snapshots), orderBy("date", "desc"), limit(1)));
      if (!snap.empty) return snap.docs[0].data();
    } catch (e) { console.warn("[getLatestGupan]", e); }
  }
  return JSON.parse(localStorage.getItem("gupan-confirmed") || "null");
}

export async function getGupanHistory(limitCount = 30) {
  return fsGetOrFallback("gupan-confirmed", async (db) => {
    const snap = await getDocs(query(collection(db, COLLECTIONS.gupan_snapshots), orderBy("date", "desc"), limit(limitCount)));
    return snap.docs.map(d => d.data());
  }, []);
}

// ─── gupan_drafts（跨裝置草稿同步）───────────────────────────
export async function saveGupanDraft(dateStr, payload) {
  try {
    localStorage.setItem("gupan-draft", JSON.stringify(payload));
  } catch(e) {}
  if (isFirestoreAvailable()) {
    // 不 catch：讓 Firestore 錯誤傳回給呼叫方，才能顯示正確的 UI 反饋
    await setDoc(doc(_db, COLLECTIONS.gupan_drafts, dateStr), {
      ...payload,
      savedAt: new Date().toISOString(),
    });
  }
}

export async function getGupanDraft(dateStr) {
  if (isFirestoreAvailable()) {
    try {
      const snap = await getDoc(doc(_db, COLLECTIONS.gupan_drafts, dateStr));
      if (snap.exists()) return snap.data();
    } catch(e) { console.warn("[getGupanDraft] Firestore 失敗", e); }
  }
  const local = JSON.parse(localStorage.getItem("gupan-draft") || "null");
  if (local?.date === dateStr) return local;
  return null;
}

export function subscribeGupanDraft(dateStr, callback) {
  if (!isFirestoreAvailable()) return null;
  return onSnapshot(
    doc(_db, COLLECTIONS.gupan_drafts, dateStr),
    (snap) => callback(snap.exists() ? snap.data() : null),
    (err) => console.warn("[subscribeGupanDraft] 訂閱失敗", err)
  );
}

// ── 備盤編輯互斥鎖 ────────────────────────────────────────────
// beipan_lock/{dateStr} = { date, lockedBy, lockedAt }
// acquireBeipanLock: 搶佔鎖定；若已被他人鎖定且未逾期則返回失敗
// force=true 時直接覆蓋（強制接手）
export async function acquireBeipanLock(dateStr, staffName, force = false) {
  if (!isFirestoreAvailable()) return { success: true }; // 離線時放行
  const lockRef = doc(_db, COLLECTIONS.beipan_lock, dateStr);
  const snap = await getDoc(lockRef);
  if (snap.exists() && !force) {
    const data = snap.data();
    const lockedAt = data.lockedAt?.toMillis?.() ?? 0;
    const ageMin = (Date.now() - lockedAt) / 60000;
    if (data.lockedBy !== staffName && ageMin < 20) {
      return { success: false, lockedBy: data.lockedBy, lockedAt, minutesAgo: Math.floor(ageMin) };
    }
  }
  await setDoc(lockRef, { date: dateStr, lockedBy: staffName, lockedAt: serverTimestamp() });
  return { success: true };
}

// 更新心跳（每 5 分鐘呼叫一次，讓鎖定不逾時）
export async function heartbeatBeipanLock(dateStr, staffName) {
  if (!isFirestoreAvailable()) return;
  const lockRef = doc(_db, COLLECTIONS.beipan_lock, dateStr);
  const snap = await getDoc(lockRef);
  if (snap.exists() && snap.data().lockedBy === staffName) {
    await updateDoc(lockRef, { lockedAt: serverTimestamp() });
  }
}

// 釋放鎖定（關閉頁面或送出完成時呼叫）
export async function releaseBeipanLock(dateStr, staffName) {
  if (!isFirestoreAvailable()) return;
  const lockRef = doc(_db, COLLECTIONS.beipan_lock, dateStr);
  const snap = await getDoc(lockRef);
  if (snap.exists() && snap.data().lockedBy === staffName) {
    await deleteDoc(lockRef);
  }
}

// 訂閱鎖定狀態變化（即時回呼）
export function subscribeBeipanLock(dateStr, callback) {
  if (!isFirestoreAvailable()) return null;
  return onSnapshot(
    doc(_db, COLLECTIONS.beipan_lock, dateStr),
    (snap) => callback(snap.exists() ? snap.data() : null),
    (err) => console.warn("[subscribeBeipanLock] 訂閱失敗", err)
  );
}
