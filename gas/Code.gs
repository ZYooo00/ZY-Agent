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
  { id:'givf',     name:'G-IVF',              vendor:'亞樸', unit:'瓶', gupanId:'m-givf',   target:2, reorderQty:10,  expiryWarnDays:null, needQC:false },
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
function firestoreQuery(collectionId, orderBy, limitCount) {
  var token = ScriptApp.getOAuthToken();
  var query = {
    structuredQuery: {
      from: [{ collectionId: collectionId }]
    }
  };
  if (orderBy) query.structuredQuery.orderBy = orderBy;
  if (limitCount) query.structuredQuery.limit = limitCount;

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

// ════════════════════════════════════════════════════════════════════
// 資料讀取函數
// ════════════════════════════════════════════════════════════════════

function getLatestBeipan() {
  var rows = firestoreQuery('beipan_snapshots',
    [{ field: { fieldPath: 'date' }, direction: 'DESCENDING' }], 1);
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

function checkDisposal(jinhuo, changelog, todayStr) {
  var todayMs = new Date(todayStr).getTime();
  var PRODUCT_MAP = {};
  PRODUCTS.forEach(function(p) { PRODUCT_MAP[p.id] = p; });

  // 從進貨紀錄建立每個批號的基礎數量
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
    lotMap[key].qty += r.receivedQty;
  });

  // 套用手動異動（use / discard / adjust / lend / return）
  var MANUAL_ACTIONS = ['use', 'discard', 'adjust', 'lend', 'return'];
  (changelog || []).forEach(function(log) {
    if (log.source !== 'manual' || MANUAL_ACTIONS.indexOf(log.action) === -1) return;
    var key = (log.productId || '') + '|' + (log.lotNumber || '');
    if (!lotMap[key]) return;
    lotMap[key].qty += (log.qtyDelta !== undefined ? log.qtyDelta : 0);
  });

  // 篩選：已過期（daysOverdue > 0）且現有庫存 > 0
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
    });
  });

  // 逾期最久的排最前面
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
      + '<th style="text-align:center;font-weight:600;border-bottom:1px solid #ddd;">現有庫存</th>'
      + '</tr>';
    items.forEach(function(a, i) {
      var rowBg = i % 2 === 0 ? '#fff' : '#fafafa';
      html += '<tr style="background:' + rowBg + ';">'
        + '<td style="border-bottom:1px solid #eee;font-weight:600;">' + a.name + '</td>'
        + '<td style="text-align:center;border-bottom:1px solid #eee;color:#555;">' + a.lotNumber + '</td>'
        + '<td style="text-align:center;border-bottom:1px solid #eee;color:#555;">' + a.expiryDate + '</td>'
        + '<td style="text-align:center;border-bottom:1px solid #eee;color:#7f1d1d;font-weight:700;">已過期 ' + a.daysOverdue + ' 天</td>'
        + '<td style="text-align:center;border-bottom:1px solid #eee;color:#7f1d1d;font-weight:700;">' + a.qty + ' ' + a.unit + '</td>'
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
    var disposalAlerts = checkDisposal(jinhuo, changelog, todayStr);
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
    var disposalAlerts = checkDisposal(jinhuo, changelog, todayStr);
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

// 設定每日觸發器（只需執行一次）
function setupTrigger() {
  // 先刪除已存在的同名觸發器，防止重複
  ScriptApp.getProjectTriggers().forEach(function(t) {
    if (t.getHandlerFunction() === 'sendDailyAlert') {
      ScriptApp.deleteTrigger(t);
    }
  });
  // 建立每天 08:00–09:00 Asia/Taipei 觸發器
  ScriptApp.newTrigger('sendDailyAlert')
    .timeBased()
    .atHour(8)
    .everyDays(1)
    .inTimezone('Asia/Taipei')
    .create();
  Logger.log('觸發器已設定：每天 08:00 Asia/Taipei 執行 sendDailyAlert');
}
