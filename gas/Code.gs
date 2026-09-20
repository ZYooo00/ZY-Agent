// ════════════════════════════════════════════════════════════════════
// Stork11 培養液系統 — 每日庫存通報（Google Apps Script）
// 每天 08:00 Asia/Taipei 自動執行 sendDailyAlert()
// 版本：2026-06-26b
// ════════════════════════════════════════════════════════════════════

// ── 設定 ────────────────────────────────────────────────────────────
var CONFIG = {
  project:          'stork11-embryo-lab',
  recipients:       ['gordon.kao@stork11.com', 'tini.lee@stork11.com'],
  kucunUrl:         'https://stork11-embryo-lab.web.app/kucun.html',
  pendingMilestones: [15, 30],  // 提醒里程碑（天）
  pendingGraceDays:  4,          // 每個里程碑的緩衝視窗（天）
  qcOverdueDays:    3,
  defaultExpiryWarnDays: 7,
};

var FIRESTORE_BASE = 'https://firestore.googleapis.com/v1/projects/' + CONFIG.project + '/databases/(default)/documents';

// ── 品項主檔（跳過 hidden / paused，只保留需要監控的品項）───────────
var PRODUCTS = [
  // 培養液（8 項）
  { id:'givf',     name:'Gx-IVF',             vendor:'亞樸', unit:'瓶', gupanId:'m-givf',   target:2, reorderQty:10,  expiryWarnDays:null, needQC:false },
  { id:'gxtl',     name:'GxTL',               vendor:'亞樸', unit:'瓶', gupanId:'m-gxtl',   target:2, reorderQty:8,   expiryWarnDays:null, needQC:false },
  { id:'glue',     name:'EmbryoGlue',          vendor:'亞樸', unit:'瓶', gupanId:'m-glue',   target:2, reorderQty:10,  expiryWarnDays:null, needQC:false },
  { id:'h5gt',     name:'H5GT',               vendor:'弘優', unit:'瓶', gupanId:'m-h5gt',   target:2, reorderQty:8,   expiryWarnDays:null, needQC:false },
  { id:'aoa-ci',   name:'AOA 弘優 CI',        vendor:'弘優', unit:'瓶', gupanId:'m-aoa-ci', target:1, reorderQty:3,   expiryWarnDays:null, needQC:false },
  { id:'aoa-508',  name:'AOA 明美 GM508',     vendor:'明美', unit:'罐', gupanId:'f-508',    target:2, reorderQty:4,   expiryWarnDays:30,   needQC:false },
  { id:'hepes',    name:'HEPES',              vendor:'億宸', unit:'瓶', gupanId:'f-hepes',  target:4, reorderQty:30,  expiryWarnDays:null, needQC:false },
  { id:'oil',      name:'Heavy Oil',           vendor:'億宸', unit:'瓶', gupanId:'f-oil',    target:3, reorderQty:30,  expiryWarnDays:null, needQC:false },
  // 試劑（14 項）
  { id:'pvp',      name:'PVP',               vendor:'億宸', unit:'組', gupanId:'f-pvp',    target:1, reorderQty:8,   expiryWarnDays:null, needQC:false },
  { id:'cumulase', name:'Cumulase',           vendor:'億宸', unit:'組', gupanId:'f-cum',    target:1, reorderQty:10,  expiryWarnDays:null, needQC:false },
  { id:'fertipro', name:'Fertipro',           vendor:'億宸', unit:'瓶', gupanId:'s-fert',   target:1, reorderQty:7,   expiryWarnDays:null, needQC:false },
  { id:'spermfr',  name:'Sperm Freeze',       vendor:'億宸', unit:'瓶', gupanId:'s-sf',     target:1, reorderQty:2,   expiryWarnDays:null, needQC:false },
  { id:'602',      name:'602',               vendor:'弘優', unit:'套', gupanId:'f-602',    target:2, reorderQty:3,   expiryWarnDays:30,   needQC:false },
  { id:'spas',     name:'S-PAS',             vendor:'弘優', unit:'盒', gupanId:'s-spas',   target:1, reorderQty:3,   expiryWarnDays:null, needQC:false },
  { id:'101',      name:'101（磊柏）',         vendor:'磊柏', unit:'套', gupanId:'f-101',    target:2, reorderQty:120, expiryWarnDays:null, needQC:false },
  { id:'102',      name:'102（磊柏）',         vendor:'磊柏', unit:'盒', gupanId:'f-102',    target:2, reorderQty:100, expiryWarnDays:null, needQC:true  },
  { id:'102-mm',   name:'102（明美）',         vendor:'明美', unit:'盒', gupanId:'f-102-mm', target:2, reorderQty:null, expiryWarnDays:null, needQC:true  },
  { id:'tyb',      name:'TYB',              vendor:'磊柏', unit:'盒', gupanId:'s-tyb',    target:1, reorderQty:1,   expiryWarnDays:null, needQC:false },
  { id:'mountgl',  name:'Mounting Glue',    vendor:'磊柏', unit:'瓶', gupanId:'s-mg',     target:1, reorderQty:1,   expiryWarnDays:null, needQC:false },
  { id:'gm501',    name:'GM501 (SpermMobil)',vendor:'明美', unit:'瓶', gupanId:'f-gm501',  target:1, reorderQty:2,   expiryWarnDays:30,   needQC:false },
  { id:'pure100',  name:'Pure 100',          vendor:'明美', unit:'個', gupanId:'s-pure',   target:2, reorderQty:8,   expiryWarnDays:null, needQC:false },
  { id:'110',      name:'110',              vendor:'明美', unit:'套', gupanId:'f-110',    target:2, reorderQty:5,   expiryWarnDays:null, needQC:false },
  // 耗材（18 項）
  { id:'toptip-y', name:'Top tips（黃）',   vendor:'弘優', unit:'盒', gupanId:'c1-ty',    target:2, reorderQty:30,  expiryWarnDays:null, needQC:false },
  { id:'toptip-g', name:'Top tips（綠）',   vendor:'弘優', unit:'盒', gupanId:'c1-tg',    target:2, reorderQty:30,  expiryWarnDays:null, needQC:false },
  { id:'toptip-r', name:'Top tips（紅）',   vendor:'弘優', unit:'盒', gupanId:'c1-tr',    target:2, reorderQty:30,  expiryWarnDays:null, needQC:false },
  { id:'toptip-b', name:'Top tips（藍）',   vendor:'弘優', unit:'盒', gupanId:'c1-tb',    target:2, reorderQty:30,  expiryWarnDays:null, needQC:false },
  { id:'toptip-w', name:'Top tips（白）',   vendor:'弘優', unit:'盒', gupanId:'c1-tw',    target:2, reorderQty:30,  expiryWarnDays:null, needQC:false },
  { id:'vltip135', name:'VL-tip 135',        vendor:'亞樸', unit:'盒', gupanId:'c2-vl135', target:2, reorderQty:3,   expiryWarnDays:null, needQC:false },
  { id:'vltip145', name:'VL-tip 145',        vendor:'亞樸', unit:'盒', gupanId:'c2-vl145', target:2, reorderQty:3,   expiryWarnDays:null, needQC:false },
  { id:'vltip200', name:'VL-tip 200',        vendor:'亞樸', unit:'盒', gupanId:'c2-vl200', target:0, reorderQty:3,   expiryWarnDays:null, needQC:false },
  { id:'6well',    name:'6 Well dish',       vendor:'弘優', unit:'包', gupanId:'c1-6w',    target:4, reorderQty:24,  expiryWarnDays:null, needQC:false },
  { id:'mouth',    name:'Mouth piece',       vendor:'弘優', unit:'包', gupanId:'b-mp',     target:1, reorderQty:null, expiryWarnDays:null, needQC:false },
  { id:'oosafe-c', name:'Oosafe（培養箱用）',vendor:'弘優', unit:'罐', gupanId:'r-os1',    target:1, reorderQty:null, expiryWarnDays:null, needQC:false },
  { id:'oosafe-f', name:'Oosafe（地板用）',  vendor:'弘優', unit:'罐', gupanId:'r-os2',    target:1, reorderQty:null, expiryWarnDays:null, needQC:false },
  { id:'3well',    name:'3 well dish',       vendor:'磊柏', unit:'包', gupanId:'c1-3w',    target:3, reorderQty:24,  expiryWarnDays:null, needQC:false },
  { id:'geridish', name:'Geri dish',         vendor:'磊柏', unit:'盒', gupanId:'c3-gd',    target:2, reorderQty:20,  expiryWarnDays:null, needQC:false },
  { id:'geriwat',  name:'Geri water bottle', vendor:'磊柏', unit:'盒', gupanId:'c3-gw',    target:2, reorderQty:12,  expiryWarnDays:null, needQC:false },
  { id:'gerifl',   name:'Geri filter',       vendor:'磊柏', unit:'盒', gupanId:'c3-gf',    target:1, reorderQty:1,   expiryWarnDays:null, needQC:false },
  { id:'coda',     name:'Coda Filter K-730', vendor:'磊柏', unit:'個', gupanId:'b-cf',     target:3, reorderQty:3,   expiryWarnDays:null, needQC:false },
  { id:'orifl',    name:'Origio Filter',     vendor:'億宸', unit:'個', gupanId:'b-of',     target:2, reorderQty:10,  expiryWarnDays:null, needQC:false },
];

// ════════════════════════════════════════════════════════════════════
// Firestore REST API 工具函數
// ════════════════════════════════════════════════════════════════════

// 把 Firestore 的型別包裝值轉成 JS 原生值
function fsVal(v) {
  if (!v) return null;
  if (v.stringValue  !== undefined) return v.stringValue;
  if (v.integerValue !== undefined) return parseInt(v.integerValue, 10);
  if (v.doubleValue  !== undefined) return parseFloat(v.doubleValue);
  if (v.booleanValue !== undefined) return v.booleanValue;
  if (v.nullValue    !== undefined) return null;
  if (v.timestampValue !== undefined) return v.timestampValue;
  if (v.arrayValue) return (v.arrayValue.values || []).map(fsVal);
  if (v.mapValue)   return fsFields(v.mapValue.fields || {});
  return null;
}

function fsFields(fields) {
  var obj = {};
  Object.keys(fields).forEach(function(k) { obj[k] = fsVal(fields[k]); });
  return obj;
}

function fsDocToObj(doc) {
  var obj = fsFields(doc.fields || {});
  obj._id = doc.name.split('/').pop();
  return obj;
}

// runQuery：不限制個別 collection 的查詢
// whereFilter（可選）：Firestore structuredQuery.where 格式的物件，例如 buildTsRangeFilter() 產生的 compositeFilter
function firestoreQuery(collectionId, orderBy, limitCount, whereFilter) {
  var token = ScriptApp.getOAuthToken();
  var query = {
    structuredQuery: {
      from: [{ collectionId: collectionId }]
    }
  };
  if (orderBy) query.structuredQuery.orderBy = orderBy;
  if (limitCount) query.structuredQuery.limit = limitCount;
  if (whereFilter) query.structuredQuery.where = whereFilter;

  var res = UrlFetchApp.fetch(FIRESTORE_BASE + ':runQuery', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type': 'application/json'
    },
    payload: JSON.stringify(query),
    muteHttpExceptions: true
  });

  if (res.getResponseCode() !== 200) {
    Logger.log('Firestore 查詢失敗 [' + collectionId + ']: ' + res.getContentText());
    return [];
  }
  var rows = JSON.parse(res.getContentText());
  return rows.filter(function(r) { return r.document; }).map(function(r) { return fsDocToObj(r.document); });
}

// 組出「tsRaw 介於 fromIso ～ toIso」的 compositeFilter（AND）。
// 用 tsRaw（寫入時存的原始 ISO 字串）而非 ts（Firestore Timestamp 型別），
// 避免要在 GAS 端組 timestampValue 的麻煩，字串型 ISO 8601 本身可直接用字典序比較。
function buildTsRangeFilter(fromIso, toIso) {
  return {
    compositeFilter: {
      op: 'AND',
      filters: [
        { fieldFilter: { field: { fieldPath: 'tsRaw' }, op: 'GREATER_THAN_OR_EQUAL', value: { stringValue: fromIso } } },
        { fieldFilter: { field: { fieldPath: 'tsRaw' }, op: 'LESS_THAN_OR_EQUAL',    value: { stringValue: toIso } } }
      ]
    }
  };
}

// ════════════════════════════════════════════════════════════════════
// 資料讀取函數
// ════════════════════════════════════════════════════════════════════

// Fix A：抓「最新一筆有效快照」而非單純「最新一筆」，避免某天寫進空 batches
// 的異常快照時，calcAllStock() 直接把異常內容當基準用（8/22 事故的根本原因）。
// 往前抓 5 筆，挑第一筆 batches 非空的；5 筆內都異常時 fallback 回最新一筆（不拋錯）。
function getLatestBeipan() {
  var rows = firestoreQuery('beipan_snapshots',
    [{ field: { fieldPath: 'date' }, direction: 'DESCENDING' }], 5);
  if (rows.length === 0) return null;
  for (var i = 0; i < rows.length; i++) {
    if (rows[i].batches && rows[i].batches.length > 0) return rows[i];
  }
  Logger.log('[getLatestBeipan] 近 5 筆快照都沒有有效 batches，fallback 用最新一筆（可能是空的）：' + rows[0].date);
  return rows[0];
}

// Fix C：checkBeipanSubmitted() 專用的精確查詢，不套用 getLatestBeipan() 的「跳過空快照」
// 邏輯，才能分辨「今天完全沒有文件」跟「今天有文件但內容異常空白」這兩種不同情況。
function getBeipanByDate(dateStr) {
  var rows = firestoreQuery('beipan_snapshots', null, 1, {
    fieldFilter: { field: { fieldPath: 'date' }, op: 'EQUAL', value: { stringValue: dateStr } }
  });
  return rows[0] || null;
}

function getLatestPandian() {
  var rows = firestoreQuery('pandian_snapshots',
    [{ field: { fieldPath: 'date' }, direction: 'DESCENDING' }], 1);
  return rows[0] || null;
}

function getJinhuoRecords() {
  // 最多抓 800 筆，按進貨日期降冪排列
  return firestoreQuery('jinhuo_records',
    [{ field: { fieldPath: 'receivedAt' }, direction: 'DESCENDING' }], 800);
}

function getKucunChangelog() {
  // 最多抓 1000 筆手動異動
  return firestoreQuery('kucun_changelog', null, 1000);
}

// 依時間區間查詢 changelog（伺服器端過濾，不整包撈回再用 JS 篩選）
function getKucunChangelogByRange(fromIso, toIso) {
  return firestoreQuery('kucun_changelog',
    [{ field: { fieldPath: 'tsRaw' }, direction: 'ASCENDING' }],
    2000,
    buildTsRangeFilter(fromIso, toIso));
}

function getOrders() {
  return firestoreQuery('orders',
    [{ field: { fieldPath: 'date' }, direction: 'DESCENDING' }], 200);
}

// ════════════════════════════════════════════════════════════════════
// 庫存計算（複製 kucun.html calcProductInfo 邏輯）
// ════════════════════════════════════════════════════════════════════

function calcAllStock(beipan, pandian, jinhuo, changelog) {
  var stockMap = {};
  var beipanDate  = beipan  ? (beipan.date  || '').replace(/\//g, '-') : '';
  var pandianDate = pandian ? (pandian.date || '').replace(/\//g, '-') : '';

  // 手動異動加總（action 需在允許清單內，logTime > cutoff）
  function manualDelta(productId, cutoff) {
    var MANUAL_ACTIONS = ['use', 'discard', 'adjust', 'lend', 'return'];
    return (changelog || []).reduce(function(sum, log) {
      if (log.productId !== productId) return sum;
      if (log.source !== 'manual') return sum;
      if (MANUAL_ACTIONS.indexOf(log.action) === -1) return sum;
      var logTime = log.tsRaw || (typeof log.ts === 'string' ? log.ts : '') || '';
      if (logTime <= cutoff) return sum;
      return sum + (log.qtyDelta !== undefined ? log.qtyDelta : (log.qty || 0));
    }, 0);
  }

  PRODUCTS.forEach(function(p) {
    var beipanBatches = (beipan && beipan.batches ? beipan.batches : [])
      .filter(function(b) { return b.reagentId === p.id; });
    var hasBeiPan = beipanBatches.length > 0;

    var pandianItem = null;
    if (pandian && pandian.allValues && p.gupanId) {
      pandianItem = (pandian.allValues || []).find(function(v) { return v.id === p.gupanId; }) || null;
    }

    var stockNum = null;

    if (hasBeiPan) {
      var unopened = beipanBatches.reduce(function(s, b) { return s + (b.unopened || 0); }, 0);

      if (pandianItem && pandianDate > beipanDate) {
        // 盤點日期比備盤新：以盤點為基準
        var newIn1 = (jinhuo || []).reduce(function(s, r) {
          if (r.productId !== p.id || r.isVoided || (r.receivedAt || '') <= pandianDate) return s;
          return s + (r.receivedQty || 0);
        }, 0);
        stockNum = Math.max(0, (pandianItem.actual || 0) + newIn1 + manualDelta(p.id, pandianDate));
      } else {
        // 正常備盤路線：備盤基準 + 備盤後進貨 + 手動異動
        var beipanCutoff = beipan.submittedAt || beipanDate;
        var newIn2 = (jinhuo || []).reduce(function(s, r) {
          if (r.productId !== p.id || r.isVoided || (r.receivedAt || '') <= beipanDate) return s;
          return s + (r.receivedQty || 0);
        }, 0);
        stockNum = Math.max(0, unopened + newIn2 + manualDelta(p.id, beipanCutoff));
      }
    } else if (pandianItem) {
      // 非備盤品項（試劑類）：盤點基準 + 盤點後進貨 + 手動異動
      var newIn3 = (jinhuo || []).reduce(function(s, r) {
        if (r.productId !== p.id || r.isVoided || (r.receivedAt || '') <= pandianDate) return s;
        return s + (r.receivedQty || 0);
      }, 0);
      stockNum = Math.max(0, (pandianItem.actual || 0) + newIn3 + manualDelta(p.id, pandianDate));
    } else {
      // 從未盤點：以全部進貨記錄為基準
      var totalJinhuo = (jinhuo || []).reduce(function(s, r) {
        if (r.productId !== p.id || r.isVoided) return s;
        return s + (r.receivedQty || 0);
      }, 0);
      if (totalJinhuo > 0) {
        stockNum = Math.max(0, totalJinhuo + manualDelta(p.id, ''));
      }
    }

    stockMap[p.id] = stockNum;
  });

  return stockMap;
}

// ════════════════════════════════════════════════════════════════════
// 警示判斷函數
// ════════════════════════════════════════════════════════════════════

function checkLowStock(stockMap) {
  var critical = [];
  PRODUCTS.forEach(function(p) {
    if (!p.target) return; // target 為 null / undefined / 0 → 不監控
    var stock = stockMap[p.id];
    if (stock === null || stock === undefined) return; // 無資料，跳過
    if (stock < p.target) {
      critical.push({ name: p.name, vendor: p.vendor, unit: p.unit, stock: stock, target: p.target, reorderQty: p.reorderQty });
    }
  });
  return { critical: critical };
}

function checkExpiry(jinhuo, todayStr) {
  var alerts = [];
  var todayMs = new Date(todayStr).getTime();
  var PRODUCT_MAP = {};
  PRODUCTS.forEach(function(p) { PRODUCT_MAP[p.id] = p; });
  var seen = {};

  (jinhuo || []).forEach(function(r) {
    if (r.isVoided || !r.expiryDate || !r.receivedQty) return;
    var p = PRODUCT_MAP[r.productId];
    if (!p) return;
    var key = r.productId + '|' + (r.lotNumber || '');
    if (seen[key]) return;

    var warnDays = p.expiryWarnDays || CONFIG.defaultExpiryWarnDays;
    var expStr   = (r.expiryDate || '').replace(/\//g, '-');
    var expMs    = new Date(expStr).getTime();
    var daysLeft = Math.round((expMs - todayMs) / 86400000);
    if (daysLeft > warnDays || daysLeft < 0) return;

    // 若同一品項已有效期更新的備用批次（已到貨、未作廢），跳過舊批次警告
    var hasNewerBatch = (jinhuo || []).some(function(r2) {
      if (r2.productId !== r.productId || r2.isVoided || !r2.receivedQty || !r2.expiryDate) return false;
      if ((r2.lotNumber || '') === (r.lotNumber || '')) return false;
      return (r2.expiryDate || '').replace(/\//g, '-') > expStr;
    });
    if (hasNewerBatch) return;

    seen[key] = true;
    alerts.push({
      name:       p.name,
      lotNumber:  r.lotNumber || '—',
      expiryDate: expStr,
      daysLeft:   daysLeft,
      qty:        r.receivedQty,
      unit:       p.unit,
    });
  });

  return alerts.sort(function(a, b) { return a.daysLeft - b.daysLeft; });
}

function checkPendingDelay(orders, todayStr) {
  var alerts = [];
  var todayMs = new Date(todayStr).getTime();

  (orders || []).forEach(function(ord) {
    if (!['pending', 'partial'].includes(ord.status)) return;
    var ordDateStr = (ord.date || '').replace(/\//g, '-');
    if (!ordDateStr) return;
    var daysElapsed = Math.round((todayMs - new Date(ordDateStr).getTime()) / 86400000);

    // 只在里程碑視窗內觸發（15 天、30 天），避免每天重複發信
    var milestone = null;
    for (var i = 0; i < CONFIG.pendingMilestones.length; i++) {
      var m = CONFIG.pendingMilestones[i];
      if (daysElapsed >= m && daysElapsed < m + CONFIG.pendingGraceDays) {
        milestone = m;
        break;
      }
    }
    if (milestone === null) return;

    var pendingItems = (ord.orders || []).filter(function(i) {
      return ((i.orderQty || 0) - (i.receivedQty || 0) - (i.cancelledQty || 0)) > 0;
    });
    if (pendingItems.length === 0) return;

    // 建立 gupanId → vendor 查表（用於補廠商資訊）
    var GUPAN_MAP = {};
    PRODUCTS.forEach(function(p) { if (p.gupanId) GUPAN_MAP[p.gupanId] = p; });

    alerts.push({
      date:        ordDateStr,
      orderedBy:   ord.orderedBy || '（未記錄）',
      daysElapsed: daysElapsed,
      milestone:   milestone,
      items: pendingItems.map(function(i) {
        var prod = GUPAN_MAP[i.orderId] || GUPAN_MAP[i.itemId] || null;
        return {
          name:    i.name || i.itemId || '?',
          pending: (i.orderQty || 0) - (i.receivedQty || 0) - (i.cancelledQty || 0),
          unit:    i.unit || '—',
          vendor:  (i.vendor) || (prod ? prod.vendor : null) || '其他',
        };
      }),
    });
  });

  return alerts.sort(function(a, b) { return b.daysElapsed - a.daysElapsed; });
}

// 掃過整個備盤快照歷史（不是只看最新一天），對每個「品項|批號」記錄它最後一次
// 出現在備盤時的 unopened 數量與時間點。
// 原本 checkDisposal 只吃「最新一筆」備盤快照：一個批號一旦用罄、不再被選為使用中批號，
// 就會從最新快照消失，於是 Route B（見下方）完全看不到這個批號在備盤流程裡的任何扣減紀錄
// （備盤寫入 changelog 用 source:'beipan'，Route B 只認 source:'manual'），
// 導致系統誤判「這批還有一堆沒報廢」而持續發信催促——這正是報廢提醒信誤報的根因。
function getBeipanLotHistory() {
  var rows = firestoreQuery('beipan_snapshots',
    [{ field: { fieldPath: 'date' }, direction: 'ASCENDING' }], 300);
  var history = {};
  rows.forEach(function(snap) {
    var cutoff = snap.submittedAt || (snap.date || '').replace(/\//g, '-');
    (snap.batches || []).forEach(function(bb) {
      if (!bb.selectedLot || !bb.reagentId) return;
      var k = bb.reagentId + '|' + bb.selectedLot;
      history[k] = { unopened: Number(bb.unopened || 0), cutoff: cutoff };
    });
  });
  return history;
}

function checkDisposal(jinhuo, changelog, todayStr, beipanLotHistory, stockMap) {
  var todayMs = new Date(todayStr).getTime();
  var PRODUCT_MAP = {};
  PRODUCTS.forEach(function(p) { PRODUCT_MAP[p.id] = p; });

  // 備盤批號 Map（key = productId|lotNumber）：改用整個備盤歷史裡「該批號最後一次」的紀錄，
  // 而不是只看最新一天的快照，這樣批號用罄後也還查得到它最後的正確狀態。
  var beipanLotMap = beipanLotHistory || {};

  // 從進貨紀錄建立每個批號的基礎數量（路線 B 基準）
  var lotMap = {};
  (jinhuo || []).forEach(function(r) {
    if (r.isVoided || !r.expiryDate || !r.receivedQty) return;
    var key = (r.productId || '') + '|' + (r.lotNumber || '');
    if (!lotMap[key]) {
      lotMap[key] = {
        productId:  r.productId,
        lotNumber:  r.lotNumber || '—',
        expiryDate: (r.expiryDate || '').replace(/\//g, '-'),
        qty:        0,
      };
    }
    lotMap[key].qty += Number(r.receivedQty || 0);
  });

  // 路線 B：套用全部歷史 manual 異動（不設 cutoff）
  var MANUAL_ACTIONS = ['use', 'discard', 'adjust', 'lend', 'return'];
  (changelog || []).forEach(function(log) {
    if (log.source !== 'manual' || MANUAL_ACTIONS.indexOf(log.action) === -1) return;
    var key = (log.productId || '') + '|' + (log.lotNumber || '');
    if (!lotMap[key]) return;
    lotMap[key].qty += Number(log.qtyDelta !== undefined ? log.qtyDelta : 0);
  });

  // 路線 A：備盤 selectedLot → 覆蓋為 unopened + 備盤後進貨 + 備盤後 manual 異動
  Object.keys(beipanLotMap).forEach(function(k) {
    if (!lotMap[k]) return;
    var bpEntry = beipanLotMap[k];
    var parts = k.split('|');
    var pid = parts[0], lot = parts[1];
    var lotIncoming = (jinhuo || []).reduce(function(s, r) {
      if (r.productId !== pid || r.lotNumber !== lot || r.isVoided) return s;
      if ((r.receivedAt || '') <= bpEntry.cutoff) return s;
      return s + Number(r.receivedQty || 0);
    }, 0);
    var lotDelta = (changelog || []).reduce(function(s, log) {
      if (log.productId !== pid || log.lotNumber !== lot) return s;
      if (log.source !== 'manual' || MANUAL_ACTIONS.indexOf(log.action) === -1) return s;
      var t = log.tsRaw || '';
      if (t <= bpEntry.cutoff) return s;
      return s + Number(log.qtyDelta !== undefined ? log.qtyDelta : 0);
    }, 0);
    lotMap[k].qty = Math.max(0, bpEntry.unopened + lotIncoming + lotDelta);
  });

  // 篩選：已過期且應丟棄數量 > 0
  var alerts = [];
  Object.keys(lotMap).forEach(function(key) {
    var lot = lotMap[key];
    var expMs = new Date(lot.expiryDate).getTime();
    var daysOverdue = Math.round((todayMs - expMs) / 86400000);
    if (daysOverdue <= 0) return;
    var qty = Math.max(0, lot.qty);
    if (qty <= 0) return;
    var p = PRODUCT_MAP[lot.productId];
    alerts.push({
      name:        p ? p.name : (lot.productId || '?'),
      unit:        p ? p.unit : '—',
      lotNumber:   lot.lotNumber,
      expiryDate:  lot.expiryDate,
      daysOverdue: daysOverdue,
      qty:         qty,
      totalStock:  Number((stockMap && stockMap[lot.productId]) || 0),
    });
  });

  return alerts.sort(function(a, b) { return b.daysOverdue - a.daysOverdue; });
}

function checkQcOverdue(jinhuo, todayStr) {
  var alerts = [];
  var todayMs = new Date(todayStr).getTime();
  var PRODUCT_MAP = {};
  PRODUCTS.forEach(function(p) { PRODUCT_MAP[p.id] = p; });

  (jinhuo || []).forEach(function(r) {
    if (r.qcStatus !== 'pending' || r.isVoided) return;
    var ra = (r.receivedAt || '').replace(/\//g, '-');
    if (!ra) return;
    var daysElapsed = Math.round((todayMs - new Date(ra).getTime()) / 86400000);
    var p = PRODUCT_MAP[r.productId];
    alerts.push({
      name:        p ? p.name : (r.productName || r.productId || '?'),
      lotNumber:   r.lotNumber || '—',
      receivedAt:  ra,
      daysElapsed: daysElapsed,
      propKey:     'qc_' + (r.productId || '') + '_' + (r.lotNumber || ''),
    });
  });

  return alerts.sort(function(a, b) { return b.daysElapsed - a.daysElapsed; });
}

// ════════════════════════════════════════════════════════════════════
// Email 組裝（HTML 格式）
// ════════════════════════════════════════════════════════════════════

function buildEmail(critical, expiry, pendingDelay, qcOverdue, disposal, todayStr) {
  var dateLabel  = todayStr.replace(/-/g, '/');
  var totalCount = critical.length + expiry.length + pendingDelay.length + qcOverdue.length + (disposal || []).length;
  var subject    = '【培養液系統】庫存警示通報 (' + dateLabel + '）';

  // 彩色標籤（不用 emoji，確保 Android Gmail 顯示正常）
  function badge(text, bg, fg) {
    return '<span style="background:' + bg + ';color:' + fg + ';font-weight:700;padding:2px 8px;border-radius:3px;font-size:13px;">' + text + '</span>';
  }

  // 區塊標題列
  function sectionHeader(label, labelBg, count, countUnit) {
    return '<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:8px;">'
      + '<tr><td>'
      + '<span style="font-size:16px;font-weight:700;">'
      + badge(label, labelBg, '#fff')
      + '&nbsp;&nbsp;' + count + ' ' + countUnit
      + '</span>'
      + '</td></tr></table>'
      + '<hr style="border:none;border-top:1px solid #ddd;margin:0 0 10px;">';
  }

  // 品項資料表（庫存不足）
  function stockTable(items) {
    var headerBg = '#f5f5f5';
    var html = '<table width="100%" cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-size:14px;margin-bottom:4px;">'
      + '<tr style="background:' + headerBg + ';color:#555;">'
      + '<th style="text-align:left;font-weight:600;border-bottom:1px solid #ddd;">品項</th>'
      + '<th style="text-align:center;font-weight:600;border-bottom:1px solid #ddd;">現有</th>'
      + '<th style="text-align:center;font-weight:600;border-bottom:1px solid #ddd;">安全線</th>'
      + '<th style="text-align:left;font-weight:600;border-bottom:1px solid #ddd;">建議補貨</th>'
      + '</tr>';
    items.forEach(function(a, i) {
      var rowBg = i % 2 === 0 ? '#fff' : '#fafafa';
      var stockColor = '#c0392b';
      var stockVal   = a.stock + ' ' + a.unit;
      var orderText  = a.reorderQty
        ? a.reorderQty + ' ' + a.unit + '<br><span style="color:#777;font-size:13px;">（' + a.vendor + '）</span>'
        : '<span style="color:#777;font-size:13px;">' + a.vendor + ' 聯絡訂購</span>';
      html += '<tr style="background:' + rowBg + ';">'
        + '<td style="border-bottom:1px solid #eee;font-weight:600;">' + a.name + '</td>'
        + '<td style="text-align:center;border-bottom:1px solid #eee;color:' + stockColor + ';font-weight:700;">' + stockVal + '</td>'
        + '<td style="text-align:center;border-bottom:1px solid #eee;color:#555;">' + a.target + ' ' + a.unit + '</td>'
        + '<td style="border-bottom:1px solid #eee;">' + orderText + '</td>'
        + '</tr>';
    });
    html += '</table>';
    return html;
  }

  // 效期預警表
  function expiryTable(items) {
    var html = '<table width="100%" cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-size:14px;margin-bottom:4px;">'
      + '<tr style="background:#f5f5f5;color:#555;">'
      + '<th style="text-align:left;font-weight:600;border-bottom:1px solid #ddd;">品項</th>'
      + '<th style="text-align:center;font-weight:600;border-bottom:1px solid #ddd;">批號</th>'
      + '<th style="text-align:center;font-weight:600;border-bottom:1px solid #ddd;">到期日</th>'
      + '<th style="text-align:center;font-weight:600;border-bottom:1px solid #ddd;">剩餘</th>'
      + '</tr>';
    items.forEach(function(a, i) {
      var rowBg = i % 2 === 0 ? '#fff' : '#fafafa';
      var daysColor = a.daysLeft <= 3 ? '#c0392b' : '#d35400';
      html += '<tr style="background:' + rowBg + ';">'
        + '<td style="border-bottom:1px solid #eee;font-weight:600;">' + a.name + '</td>'
        + '<td style="text-align:center;border-bottom:1px solid #eee;color:#555;">' + a.lotNumber + '</td>'
        + '<td style="text-align:center;border-bottom:1px solid #eee;color:#555;">' + a.expiryDate + '</td>'
        + '<td style="text-align:center;border-bottom:1px solid #eee;color:' + daysColor + ';font-weight:700;">' + a.daysLeft + ' 天</td>'
        + '</tr>';
    });
    html += '</table>';
    return html;
  }

  // 待 QC 表
  function qcTable(items) {
    var html = '<table width="100%" cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-size:14px;margin-bottom:4px;">'
      + '<tr style="background:#f5f5f5;color:#555;">'
      + '<th style="text-align:left;font-weight:600;border-bottom:1px solid #ddd;">品項</th>'
      + '<th style="text-align:center;font-weight:600;border-bottom:1px solid #ddd;">批號</th>'
      + '<th style="text-align:center;font-weight:600;border-bottom:1px solid #ddd;">進貨日</th>'
      + '<th style="text-align:center;font-weight:600;border-bottom:1px solid #ddd;">待 QC</th>'
      + '</tr>';
    items.forEach(function(a, i) {
      var rowBg = i % 2 === 0 ? '#fff' : '#fafafa';
      html += '<tr style="background:' + rowBg + ';">'
        + '<td style="border-bottom:1px solid #eee;font-weight:600;">' + a.name + '</td>'
        + '<td style="text-align:center;border-bottom:1px solid #eee;color:#555;">' + a.lotNumber + '</td>'
        + '<td style="text-align:center;border-bottom:1px solid #eee;color:#555;">' + a.receivedAt + '</td>'
        + '<td style="text-align:center;border-bottom:1px solid #eee;color:#d35400;font-weight:700;">' + a.daysElapsed + ' 天</td>'
        + '</tr>';
    });
    html += '</table>';
    return html;
  }

  // 待報廢表（過期且有庫存）
  function disposalTable(items) {
    var html = '<table width="100%" cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-size:14px;margin-bottom:4px;">'
      + '<tr style="background:#f5f5f5;color:#555;">'
      + '<th style="text-align:left;font-weight:600;border-bottom:1px solid #ddd;">品項</th>'
      + '<th style="text-align:center;font-weight:600;border-bottom:1px solid #ddd;">批號</th>'
      + '<th style="text-align:center;font-weight:600;border-bottom:1px solid #ddd;">到期日</th>'
      + '<th style="text-align:center;font-weight:600;border-bottom:1px solid #ddd;">已逾期</th>'
      + '<th style="text-align:center;font-weight:600;border-bottom:1px solid #ddd;">應丟棄瓶數</th>'
      + '<th style="text-align:center;font-weight:600;border-bottom:1px solid #ddd;">應剩餘瓶數</th>'
      + '</tr>';
    items.forEach(function(a, i) {
      var rowBg = i % 2 === 0 ? '#fff' : '#fafafa';
      html += '<tr style="background:' + rowBg + ';">'
        + '<td style="border-bottom:1px solid #eee;font-weight:600;">' + a.name + '</td>'
        + '<td style="text-align:center;border-bottom:1px solid #eee;color:#555;">' + a.lotNumber + '</td>'
        + '<td style="text-align:center;border-bottom:1px solid #eee;color:#555;">' + a.expiryDate + '</td>'
        + '<td style="text-align:center;border-bottom:1px solid #eee;color:#7f1d1d;font-weight:700;">已過期 ' + a.daysOverdue + ' 天</td>'
        + '<td style="text-align:center;border-bottom:1px solid #eee;color:#7f1d1d;font-weight:700;">' + a.qty + ' ' + a.unit + '</td>'
        + '<td style="text-align:center;border-bottom:1px solid #eee;color:#555;">' + a.totalStock + ' ' + a.unit + '</td>'
        + '</tr>';
    });
    html += '</table>';
    return html;
  }

  // 待收貨（訂單有多項品項，用卡片形式，按廠商分組）
  function delayCards(orders) {
    return orders.map(function(a) {
      // 按廠商分組，保留出現順序
      var vendorMap = {}, vendorOrder = [];
      a.items.forEach(function(i) {
        var v = i.vendor || '其他';
        if (!vendorMap[v]) { vendorMap[v] = []; vendorOrder.push(v); }
        vendorMap[v].push(i);
      });

      var itemRows = '';
      vendorOrder.forEach(function(v, vi) {
        var borderTop = vi > 0 ? 'border-top:1px solid #dce8f5;' : '';
        itemRows += '<tr><td colspan="2" style="padding:' + (vi > 0 ? '10px' : '4px') + ' 0 3px;font-size:13px;color:#1a6496;font-weight:700;' + borderTop + '">' + v + '</td></tr>';
        vendorMap[v].forEach(function(i) {
          itemRows += '<tr><td style="padding:2px 0;color:#333;">· ' + i.name + '</td>'
                   + '<td style="padding:2px 0;text-align:right;font-weight:600;white-space:nowrap;">待收 ' + i.pending + ' ' + i.unit + '</td></tr>';
        });
      });
      var milestoneBadge = '<span style="background:#c0392b;color:#fff;font-size:12px;font-weight:700;padding:2px 8px;border-radius:3px;">'
        + '已 ' + a.daysElapsed + ' 天未到貨</span>';
      return '<div style="background:#f8fafd;border:1px solid #d0e4f7;border-radius:6px;padding:10px 12px;margin-bottom:8px;">'
        + '<p style="margin:0 0 6px;font-size:14px;font-weight:700;">' + a.date + ' 訂購</p>'
        + '<p style="margin:0 0 10px;">' + milestoneBadge + '</p>'
        + '<table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">' + itemRows + '</table>'
        + '</div>';
    }).join('');
  }

  var sections = [];

  if (critical.length > 0) {
    sections.push('<div style="margin-bottom:24px;">'
      + sectionHeader('缺貨危急', '#c0392b', critical.length, '項')
      + stockTable(critical)
      + '</div>');
  }


  if (expiry.length > 0) {
    sections.push('<div style="margin-bottom:24px;">'
      + sectionHeader('效期預警', '#7b5ea7', expiry.length, '個批號')
      + expiryTable(expiry)
      + '</div>');
  }

  if ((disposal || []).length > 0) {
    sections.push('<div style="margin-bottom:24px;">'
      + sectionHeader('待報廢', '#7f1d1d', disposal.length, '個批號')
      + '<p style="font-size:13px;color:#7f1d1d;margin:0 0 8px;">⚠️ 以下批號已過期且帳面庫存大於 0，請立即完成實體報廢並在系統登記，否則每日均會收到此通報。</p>'
      + disposalTable(disposal)
      + '</div>');
  }

  if (pendingDelay.length > 0) {
    sections.push('<div style="margin-bottom:24px;">'
      + sectionHeader('待收貨', '#1a6496', pendingDelay.length, pendingDelay.length > 1 ? '筆訂單需跟催' : '筆訂單需跟催')
      + delayCards(pendingDelay)
      + '</div>');
  }

  if (qcOverdue.length > 0) {
    sections.push('<div style="margin-bottom:24px;">'
      + sectionHeader('待 QC 逾時', '#1a7a4a', qcOverdue.length, '個批號')
      + qcTable(qcOverdue)
      + '</div>');
  }

  var footer = '<div style="margin-top:24px;padding-top:12px;border-top:1px solid #e0e0e0;font-size:13px;color:#777;">'
    + '<p style="margin:0 0 4px;">&#8594; <a href="' + CONFIG.kucunUrl + '" style="color:#1a6496;">前往庫存總覽</a></p>'
    + '<p style="margin:0;">此信件由系統自動發送，請勿直接回覆</p>'
    + '</div>';

  var htmlBody = '<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;padding:20px 16px;color:#1a1a1a;font-size:15px;line-height:1.6;">'
    + sections.join('')
    + footer
    + '</div>';

  return { subject: subject, htmlBody: htmlBody };
}

// ════════════════════════════════════════════════════════════════════
// 主函數（時間觸發器呼叫這個）
// ════════════════════════════════════════════════════════════════════

function sendDailyAlert() {
  var tz       = 'Asia/Taipei';
  var todayStr = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');

  try {
    // 1. 讀取資料（並行其實不能在 GAS 做，依序讀取即可）
    var beipan    = getLatestBeipan();
    var pandian   = getLatestPandian();
    var jinhuo    = getJinhuoRecords();
    var changelog = getKucunChangelog();
    var orders    = getOrders();

    if (!beipan && !pandian) {
      Logger.log('[' + todayStr + '] 找不到備盤或盤點快照，跳過');
      return;
    }

    // 2. 計算庫存
    var stockMap = calcAllStock(beipan, pandian, jinhuo, changelog);

    // 3. 各項警示
    var stockAlerts    = checkLowStock(stockMap);
    var expiryAlerts   = checkExpiry(jinhuo, todayStr);
    var disposalAlerts = checkDisposal(jinhuo, changelog, todayStr, getBeipanLotHistory(), stockMap);
    var delayAlerts    = checkPendingDelay(orders, todayStr);
    var qcAlerts       = checkQcOverdue(jinhuo, todayStr);

    var critical     = stockAlerts.critical;

    // 4a. 缺貨危急發信邏輯：
    //   - 新品項（第一次缺貨）→ 當天立刻發
    //   - 持續缺貨的品項    → 只在每週一統一重發（且距上次至少 6 天，避免週日首發、週一又重發）
    var props = PropertiesService.getScriptProperties();
    var isMonday = (new Date(todayStr).getDay() === 1);

    var criticalToSend = critical.filter(function(a) {
      var key = 'crit_' + a.name;
      var lastAlert = props.getProperty(key);
      if (!lastAlert) return true; // 第一次出現 → 立刻發
      if (!isMonday) return false; // 非週一 → 已知問題，靜默
      var daysSince = Math.round((new Date(todayStr).getTime() - new Date(lastAlert).getTime()) / 86400000);
      return daysSince >= 6;       // 週一且距上次 6 天以上 → 重發
    });

    // 更新發信紀錄
    criticalToSend.forEach(function(a) {
      props.setProperty('crit_' + a.name, todayStr);
    });
    // 已補貨的品項清除紀錄（下次缺貨時才能立刻觸發）
    props.getKeys().forEach(function(k) {
      if (k.indexOf('crit_') !== 0) return;
      var name = k.slice(5);
      var stillCritical = critical.some(function(a) { return a.name === name; });
      if (!stillCritical) props.deleteProperty(k);
    });

    // 4b. 待 QC：第一次來貨立刻發，之後週一統一重發（按批號各自追蹤）
    var qcToSend = qcAlerts.filter(function(a) {
      var lastAlert = props.getProperty(a.propKey);
      if (!lastAlert) return true; // 新批號 → 立刻發
      if (!isMonday) return false;
      var daysSince = Math.round((new Date(todayStr).getTime() - new Date(lastAlert).getTime()) / 86400000);
      return daysSince >= 6;
    });
    qcToSend.forEach(function(a) {
      props.setProperty(a.propKey, todayStr);
    });
    // QC 完成的批號清除紀錄
    props.getKeys().forEach(function(k) {
      if (k.indexOf('qc_') !== 0) return;
      var stillPending = qcAlerts.some(function(a) { return a.propKey === k; });
      if (!stillPending) props.deleteProperty(k);
    });

    var total = criticalToSend.length + expiryAlerts.length + disposalAlerts.length + delayAlerts.length + qcToSend.length;

    // 4b. 零打擾：全部正常就不發信
    if (total === 0) {
      Logger.log('[' + todayStr + '] 全部正常，不發信');
      return;
    }

    // 5. 組裝並發送
    var email = buildEmail(criticalToSend, expiryAlerts, delayAlerts, qcToSend, disposalAlerts, todayStr);
    GmailApp.sendEmail(CONFIG.recipients.join(','), email.subject, '', { htmlBody: email.htmlBody, name: 'Stork11 培養液系統' });
    Logger.log('[' + todayStr + '] 發信完成：' + total + ' 項警示（缺貨:' + criticalToSend.length + ' 效期:' + expiryAlerts.length + ' 待報廢:' + disposalAlerts.length + ' 待收:' + delayAlerts.length + ' QC:' + qcToSend.length + '），收件人：' + CONFIG.recipients.join(', '));

  } catch (e) {
    Logger.log('[' + todayStr + '] sendDailyAlert 錯誤：' + e.message + '\n' + e.stack);
    // 不拋出，避免 GAS 觸發重試垃圾信
  }
}

// 手動測試（受頻率控制，非週一缺貨/QC 警示可能不出現）
function testAlert() {
  sendDailyAlert();
}

// 強制發送：跳過所有頻率控制，用於手動記錄當下完整狀態
function forceAlert() {
  var tz       = 'Asia/Taipei';
  var todayStr = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
  try {
    var beipan    = getLatestBeipan();
    var pandian   = getLatestPandian();
    var jinhuo    = getJinhuoRecords();
    var changelog = getKucunChangelog();
    var orders    = getOrders();
    if (!beipan && !pandian) { Logger.log('找不到快照'); return; }
    var stockMap      = calcAllStock(beipan, pandian, jinhuo, changelog);
    var critical      = checkLowStock(stockMap).critical;
    var expiryAlerts  = checkExpiry(jinhuo, todayStr);
    var disposalAlerts = checkDisposal(jinhuo, changelog, todayStr, getBeipanLotHistory(), stockMap);
    var delayAlerts   = checkPendingDelay(orders, todayStr);
    var qcAlerts      = checkQcOverdue(jinhuo, todayStr);
    var total = critical.length + expiryAlerts.length + disposalAlerts.length + delayAlerts.length + qcAlerts.length;
    if (total === 0) { Logger.log('目前無任何警示'); return; }
    var email = buildEmail(critical, expiryAlerts, delayAlerts, qcAlerts, disposalAlerts, todayStr);
    GmailApp.sendEmail(CONFIG.recipients.join(','), email.subject, '', { htmlBody: email.htmlBody, name: 'Stork11 培養液系統' });
    Logger.log('forceAlert 發送完成：' + total + ' 項');
  } catch (e) {
    Logger.log('forceAlert 錯誤：' + e.message);
  }
}

// ════════════════════════════════════════════════════════════════════
// 備盤未送出提醒（每天 21:00 Asia/Taipei 檢查，收件人動態讀取後臺人員名單的 gmail 欄位）
// ════════════════════════════════════════════════════════════════════

// 讀 staff_config，篩選 active 且已在後臺（人員名單管理）填寫 gmail 的人員
function getStaffEmails() {
  var rows = firestoreQuery('staff_config', null, 100);
  return rows
    .filter(function(s) { return s.active !== false && s.gmail; })
    .map(function(s) { return s.gmail; });
}

function checkBeipanSubmitted() {
  var tz       = 'Asia/Taipei';
  var todayStr = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');

  try {
    // Fix C：用精確查詢（不透過 getLatestBeipan() 的跳過空快照邏輯），才能分辨
    // 「今天完全沒送」跟「今天有送、但內容異常空白」這兩種不同情況，各自發不同措辭的信
    var todayBeipan = getBeipanByDate(todayStr);
    var hasEmptyBatches = !!(todayBeipan && (!todayBeipan.batches || todayBeipan.batches.length === 0));
    var submittedToday = !!(todayBeipan && !hasEmptyBatches);

    if (submittedToday) {
      Logger.log('[' + todayStr + '] 今日備盤已送出（' + (todayBeipan.operator || '未記錄操作者') + '），不發提醒信');
      return;
    }

    var recipients = getStaffEmails();
    if (recipients.length === 0) {
      Logger.log('[' + todayStr + '] 今日備盤尚未有效送出，但後臺人員名單目前沒有任何已填 gmail 的人員，無法發信。請到 admin.html 人員名單管理分頁補上 email。');
      return;
    }

    var subject, warningLine;
    if (hasEmptyBatches) {
      subject = '【培養液系統】今日（' + todayStr.replace(/-/g, '/') + '）備盤紀錄異常空白提醒';
      warningLine = '⚠️ 偵測到今日有一筆備盤紀錄，但內容異常空白，系統已判定為尚未有效送出，請盡速前往系統重新確認並送出正確的備盤資料。';
    } else {
      subject = '【培養液系統】今日（' + todayStr.replace(/-/g, '/') + '）備盤尚未送出提醒';
      warningLine = '⚠️ 晚上 9 點檢查：今日備盤尚未送出';
    }
    var htmlBody = '<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;padding:20px 16px;color:#1a1a1a;font-size:15px;line-height:1.6;">'
      + '<p style="margin:0 0 12px;font-size:16px;font-weight:700;color:#c0392b;">' + warningLine + '</p>'
      + '<p style="margin:0 0 16px;">因為備盤送出與庫存扣除連動，若確實已經備盤完成，請盡快到系統送出，避免影響明日庫存判斷。</p>'
      + '<p style="margin:0;"><a href="https://stork11-embryo-lab.web.app/beipan.html" style="color:#1a6496;">前往備盤頁面 →</a></p>'
      + '<div style="margin-top:24px;padding-top:12px;border-top:1px solid #e0e0e0;font-size:13px;color:#777;">此信件由系統自動發送，請勿直接回覆</div>'
      + '</div>';

    GmailApp.sendEmail(recipients.join(','), subject, '', { htmlBody: htmlBody, name: 'Stork11 培養液系統' });
    Logger.log('[' + todayStr + '] 今日備盤未有效送出（' + (hasEmptyBatches ? '內容異常空白' : '完全沒有紀錄') + '），已發提醒信給：' + recipients.join(', '));

  } catch (e) {
    Logger.log('[' + todayStr + '] checkBeipanSubmitted 錯誤：' + e.message + '\n' + e.stack);
  }
}

// 測試用：不管今天備盤送出與否，一律把提醒信範本寄給 gordon08250209@gmail.com，方便 ZY 確認信件外觀
function testSendToGordon() {
  var tz       = 'Asia/Taipei';
  var todayStr = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
  var subject  = '【培養液系統】今日（' + todayStr.replace(/-/g, '/') + '）備盤尚未送出提醒';
  var htmlBody = '<div style="font-family:Arial,Helvetica,sans-serif;max-width:600px;margin:0 auto;padding:20px 16px;color:#1a1a1a;font-size:15px;line-height:1.6;">'
    + '<p style="margin:0 0 12px;font-size:16px;font-weight:700;color:#c0392b;">⚠️ 晚上 9 點檢查：今日備盤尚未送出</p>'
    + '<p style="margin:0 0 16px;">因為備盤送出與庫存扣除連動，若確實已經備盤完成，請盡快到系統送出，避免影響明日庫存判斷。</p>'
    + '<p style="margin:0;"><a href="https://stork11-embryo-lab.web.app/beipan.html" style="color:#1a6496;">前往備盤頁面 →</a></p>'
    + '<div style="margin-top:24px;padding-top:12px;border-top:1px solid #e0e0e0;font-size:13px;color:#777;">此信件由系統自動發送，請勿直接回覆（測試信，實際觸發條件為每日 21:00 檢查備盤是否送出）</div>'
    + '</div>';
  GmailApp.sendEmail('gordon08250209@gmail.com', subject, '', { htmlBody: htmlBody, name: 'Stork11 培養液系統' });
  Logger.log('測試信已寄給 gordon08250209@gmail.com');
}

// 一次性設定：建立每天 21:00 Asia/Taipei 執行 checkBeipanSubmitted 的時間觸發器
// 在 Apps Script 編輯器裡手動執行這個函式一次即可（重複執行會先清掉舊的同名觸發器，不會建立重複）
function createBeipanCheckTrigger() {
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'checkBeipanSubmitted') ScriptApp.deleteTrigger(t);
  });
  ScriptApp.newTrigger('checkBeipanSubmitted')
    .timeBased()
    .everyDays(1)
    .atHour(21)
    .create();
  Logger.log('已建立每日 21:00 (Asia/Taipei) 觸發器，執行 checkBeipanSubmitted');
}

// 手動測試（忽略時間，立即檢查一次今天的狀態並視情況發信）
function testCheckBeipanSubmitted() {
  checkBeipanSubmitted();
}

// 測試待報廢通報邏輯（不發信，只印 Log）
function testDisposalAlerts() {
  var tz       = 'Asia/Taipei';
  var todayStr = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
  var beipan    = getLatestBeipan();
  var pandian   = getLatestPandian();
  var jinhuo    = getJinhuoRecords();
  var changelog = getKucunChangelog();
  var stockMap  = calcAllStock(beipan, pandian, jinhuo, changelog);
  var disposal  = checkDisposal(jinhuo, changelog, todayStr, getBeipanLotHistory(), stockMap);
  Logger.log('[testDisposalAlerts] 待報廢批號：' + disposal.length + ' 個');
  disposal.forEach(function(d) {
    Logger.log('  ' + d.name + ' | 批號：' + d.lotNumber + ' | 應丟棄：' + d.qty + ' ' + d.unit + ' | 品項庫存：' + d.totalStock + ' ' + d.unit);
  });
}

// ════════════════════════════════════════════════════════════════════
// 每月近三個月用量報表（每月 1 號 08:00 Asia/Taipei 自動執行 sendMonthlyUsageReport()）
// 嚴格依日曆月份加總（不是往回減 90 天平均切三份），並用 tsRaw 做伺服器端範圍查詢
// ════════════════════════════════════════════════════════════════════

var MONTHLY_CONSUME_ACTIONS = ['beipan', 'beipan_addon'];
var MONTHLY_LOSS_ACTIONS    = ['discard', 'void'];

// 取得「距今 monthsAgo 個月前」那個完整日曆月的邊界（Asia/Taipei）
// monthsAgo=1 → 上個月 1 號 00:00 ～ 上個月最後一天 23:59:59
function getCalendarMonthBoundary(monthsAgo) {
  var tz  = 'Asia/Taipei';
  var now = new Date();
  var y   = now.getFullYear();
  var m   = now.getMonth(); // 0-based，本月
  var from = new Date(y, m - monthsAgo, 1, 0, 0, 0);
  var to   = new Date(y, m - monthsAgo + 1, 0, 23, 59, 59); // 該月最後一天
  return {
    fromIso: Utilities.formatDate(from, tz, "yyyy-MM-dd'T'HH:mm:ss"),
    toIso:   Utilities.formatDate(to,   tz, "yyyy-MM-dd'T'HH:mm:ss"),
    label:   Utilities.formatDate(from, tz, 'yyyy/MM')
  };
}

// 加總單一日曆月區間內、指定 productId 的正常消耗與異常損耗
function aggregateMonthlyUsageForProduct(changelog, productId) {
  var usage = 0, loss = 0;
  (changelog || []).forEach(function(log) {
    if (log.productId !== productId || log.source !== 'beipan') return;
    if (MONTHLY_CONSUME_ACTIONS.indexOf(log.action) !== -1) {
      usage += Math.abs(log.bottlesOpened !== undefined ? log.bottlesOpened : (log.qtyDelta || 0));
    } else if (MONTHLY_LOSS_ACTIONS.indexOf(log.action) !== -1) {
      loss += Math.abs(log.qtyDelta || 0);
    }
  });
  return { usage: Math.round(usage * 10) / 10, loss: Math.round(loss * 10) / 10 };
}

function buildMonthlyReportEmail(monthBoundaries, monthChangelogs, todayStr) {
  var dateLabel = todayStr.replace(/-/g, '/');
  var subject = '【培養液系統】近三個月用量報表 (' + dateLabel + '）';
  var mediaProducts = PRODUCTS.filter(function(p) { return p.gupanId; });

  function badge(text, bg, fg) {
    return '<span style="background:' + bg + ';color:' + fg + ';font-weight:700;padding:2px 8px;border-radius:3px;font-size:13px;">' + text + '</span>';
  }

  var monthLabels = monthBoundaries.map(function(b) { return b.label; }); // 舊 → 新

  var usageTable = '<table width="100%" cellpadding="6" cellspacing="0" style="border-collapse:collapse;font-size:14px;margin-bottom:4px;">'
    + '<tr style="background:#f5f5f5;color:#555;">'
    + '<th style="text-align:left;font-weight:600;border-bottom:1px solid #ddd;">品項</th>'
    + monthLabels.map(function(l) { return '<th style="text-align:center;font-weight:600;border-bottom:1px solid #ddd;">' + l + ' 消耗</th>'; }).join('')
    + '<th style="text-align:center;font-weight:600;border-bottom:1px solid #ddd;">異常損耗（近三月合計）</th>'
    + '</tr>';

  var rowIdx = 0;
  mediaProducts.forEach(function(p) {
    var monthResults = monthChangelogs.map(function(cl) { return aggregateMonthlyUsageForProduct(cl, p.id); });
    var totalUsage = monthResults.reduce(function(s, r) { return s + r.usage; }, 0);
    var totalLoss  = monthResults.reduce(function(s, r) { return s + r.loss;  }, 0);
    if (totalUsage === 0 && totalLoss === 0) return; // 三個月都沒資料的品項不列出，避免報表過長
    var rowBg = rowIdx % 2 === 0 ? '#fff' : '#fafafa';
    rowIdx++;
    usageTable += '<tr style="background:' + rowBg + ';">'
      + '<td style="border-bottom:1px solid #eee;font-weight:600;">' + p.name + '</td>'
      + monthResults.map(function(r) {
          return '<td style="text-align:center;border-bottom:1px solid #eee;color:#555;">' + r.usage + ' ' + p.unit + '</td>';
        }).join('')
      + '<td style="text-align:center;border-bottom:1px solid #eee;color:' + (totalLoss > 0 ? '#c0392b' : '#999') + ';font-weight:' + (totalLoss > 0 ? '700' : '400') + ';">'
      + (totalLoss > 0 ? totalLoss + ' mL' : '—') + '</td>'
      + '</tr>';
  });
  usageTable += '</table>';

  var htmlBody = '<div style="font-family:Arial,\'Noto Sans TC\',sans-serif;color:#333;max-width:640px;">'
    + '<div style="font-size:18px;font-weight:700;margin-bottom:4px;">' + badge('月報表', '#6b5ce6', '#fff') + '&nbsp;&nbsp;近三個月用量統計</div>'
    + '<div style="color:#777;font-size:13px;margin-bottom:16px;">統計區間：' + monthLabels[0] + ' ～ ' + monthLabels[monthLabels.length - 1] + '（依日曆月加總，非往回推算天數）</div>'
    + usageTable
    + '<div style="color:#999;font-size:12px;margin-top:16px;">「消耗」= 正常備盤使用量（單位：品項庫存單位）；「異常損耗」= 報廢/作廢的殘液量（單位：mL），兩者分開列出，不互相抵銷。</div>'
    + '<div style="color:#999;font-size:12px;margin-top:8px;">報表產生時間：' + dateLabel + '　查看即時庫存：<a href="' + CONFIG.kucunUrl + '">' + CONFIG.kucunUrl + '</a></div>'
    + '</div>';

  return { subject: subject, htmlBody: htmlBody };
}

function sendMonthlyUsageReport() {
  var tz       = 'Asia/Taipei';
  var todayStr = Utilities.formatDate(new Date(), tz, 'yyyy-MM-dd');
  try {
    // 近三個完整日曆月：上個月、上上個月、上上上個月（monthsAgo = 1, 2, 3），排序為舊 → 新
    var boundaries = [3, 2, 1].map(getCalendarMonthBoundary);
    var overallFrom = boundaries[0].fromIso;
    var overallTo   = boundaries[boundaries.length - 1].toIso;
    var allChangelog = getKucunChangelogByRange(overallFrom, overallTo);

    // 依月份區間切分（單次查詢後在 JS 端分桶，避免對同一 collection 查 3 次）
    var monthChangelogs = boundaries.map(function(b) {
      return allChangelog.filter(function(log) {
        var t = log.tsRaw || '';
        return t >= b.fromIso && t <= b.toIso;
      });
    });

    var email = buildMonthlyReportEmail(boundaries, monthChangelogs, todayStr);
    GmailApp.sendEmail(CONFIG.recipients.join(','), email.subject, '', { htmlBody: email.htmlBody, name: 'Stork11 培養液系統' });
    Logger.log('[' + todayStr + '] 月報表發送完成，統計區間：' + boundaries[0].label + ' ～ ' + boundaries[2].label + '，收件人：' + CONFIG.recipients.join(', '));
  } catch (e) {
    Logger.log('[' + todayStr + '] sendMonthlyUsageReport 錯誤：' + e.message + '\n' + e.stack);
  }
}

// 手動測試（立即發送，不用等每月 1 號）
function testMonthlyUsageReport() {
  sendMonthlyUsageReport();
}

// 設定每日 + 每月觸發器（只需執行一次）
function setupTrigger() {
  // 先刪除已存在的同名觸發器，防止重複
  ScriptApp.getProjectTriggers().forEach(function(t) {
    var fn = t.getHandlerFunction();
    if (fn === 'sendDailyAlert' || fn === 'sendMonthlyUsageReport') {
      ScriptApp.deleteTrigger(t);
    }
  });
  // 建立每天 07:00 Asia/Taipei 觸發器
  ScriptApp.newTrigger('sendDailyAlert')
    .timeBased()
    .atHour(7)
    .everyDays(1)
    .inTimezone('Asia/Taipei')
    .create();
  // 建立每月 1 號 08:00 Asia/Taipei 觸發器
  ScriptApp.newTrigger('sendMonthlyUsageReport')
    .timeBased()
    .onMonthDay(1)
    .atHour(8)
    .inTimezone('Asia/Taipei')
    .create();
  Logger.log('觸發器已設定：每天 07:00 執行 sendDailyAlert，每月 1 號 08:00 執行 sendMonthlyUsageReport（Asia/Taipei）');
}
