// ═══════════════════════════════════════════════════════════════
// 耗材月入料工具 — Google Apps Script Web App
// 部署方式：擴充功能 > Apps Script > 部署 > 新增部署
//   執行身份：我  /  存取：所有人
// ═══════════════════════════════════════════════════════════════

const SPREADSHEET_ID = "1ISnjfSxIW-PUBbxIRQpVd_ojDq0Dfy_U4ImqEXukhf8";
const SHEET_ITEMS    = "品項主檔";
const SHEET_COUNT    = "盤點總表";
const SHEET_LOG      = "入料紀錄";

function getSpreadsheet() {
  return SpreadsheetApp.openById(SPREADSHEET_ID);
}

// 依「存放區域1」前綴判斷訂單要分進哪一張單（胚胎室／精蟲室／其他）
function roomFromZone_(zone) {
  if (!zone) return "其他";
  if (zone.indexOf("胚胎-") === 0) return "胚胎室";
  if (zone.indexOf("精蟲-") === 0) return "精蟲室";
  return "其他";
}

// 「盤點總表」的日期表頭常被 Google Sheets 自動轉型成 Date 物件（儲存格看
// 起來還是像「9/6」，但底層值其實是日期，不是文字）。這支把不管是 Date
// 物件還是文字，統一轉成跟前端 toSD() 一致的 "M/D" 格式（不補零）再比對，
// 避免 String(dateObj) 產生一長串完全對不上的字串，導致誤判「這天還沒建過」
// 而重複新建日期欄。
function normalizeDateHeader_(val) {
  if (!val) return "";
  if (Object.prototype.toString.call(val) === "[object Date]") {
    return Utilities.formatDate(val, Session.getScriptTimeZone(), "M/d");
  }
  return String(val).trim();
}

// ── 路由 ────────────────────────────────────────────────────────

function doGet(e) {
  const action = (e.parameter && e.parameter.action) || "";
  let result;
  try {
    if      (action === "items")         result = getItems();
    else if (action === "latest-count")  result = getLatestCount(e.parameter.date || null);
    else if (action === "order")         result = getOrder();
    else if (action === "pending-order") result = getPendingOrder();
    else if (action === "get-2w-draft")  result = get2wDraft();
    else if (action === "receipt")       result = getReceipt();
    else result = { error: "unknown action: " + action };
  } catch (err) {
    result = { error: err.message };
  }
  return jsonResponse(result);
}

function doPost(e) {
  let data = {};
  try { data = JSON.parse(e.postData.contents); } catch (_) {}
  const action = data.action || "";
  let result;
  try {
    if      (action === "count")               result = saveCount(data);
    else if (action === "save-item-counts")    result = saveItemCounts(data);
    else if (action === "pending-order")       result = savePendingOrder(data);
    else if (action === "clear-pending-order") result = clearPendingOrder();
    else if (action === "save-2w-draft")       result = save2wDraft(data);
    else if (action === "log-order")           result = logOrder(data);
    else if (action === "save-receipt")        result = saveReceipt(data);
    else if (action === "update-receipt")      result = updateReceipt(data);
    else if (action === "archive-receipt")     result = archiveReceipt(data);
    else result = { error: "unknown action: " + action };
  } catch (err) {
    result = { error: err.message };
  }
  return jsonResponse(result);
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── buildBaseItems（內部用，不展開位置）────────────────────────
// getItems() 和 getOrder() 各自從這裡取原始品項，避免重複計算

function buildBaseItems() {
  const sheet = getSpreadsheet().getSheetByName(SHEET_ITEMS);
  const data = sheet.getDataRange().getValues();
  const hdr = data[0];
  const c = {}; hdr.forEach((h, i) => { c[h] = i; });
  const zoneKey = c["存放區域1"] !== undefined ? "存放區域1" : "存放區域";

  const items = [];
  for (let i = 1; i < data.length; i++) {
    const r = data[i];
    if (!r[c["品項ID"]]) continue;
    const status = r[c["狀態"]];
    if (status === "停用") continue;

    const zone1v      = r[c[zoneKey]] || "";
    const zone2v       = (c["存放區域2"] !== undefined ? r[c["存放區域2"]] : "") || "";
    const backupZoneV  = (c["備存位置"]  !== undefined ? r[c["備存位置"]]  : "") || "";
    // 備存型品項：訂購建議量是看「備存位置」的庫存算的，房間分類跟著備存位置走，
    // 才會跟真正的叫貨判斷一致（例如 Organ Dish 平常在胚胎室拿，但叫貨看的是儲藏室庫存）。
    // 其餘（含並存型 zone2）：以「存放區域1」（日常取用的主要位置）為準。
    const room             = backupZoneV ? roomFromZone_(backupZoneV) : roomFromZone_(zone1v);
    const zone2Room        = zone2v ? roomFromZone_(zone2v) : null;
    const crossRoomOther   = (zone2Room && zone2Room !== room) ? zone2Room : null;

    items.push({
      id:         r[c["品項ID"]],
      name:       r[c["品項名稱"]],
      order:      Number(r[c["點料順序"]]) || 0,
      unit:       r[c["採購單位"]],
      baseline:   Number(r[c["每四週基準量"]] ?? r[c["每兩週基準量"]]) || 0,
      safety:     Number(r[c["安全庫存量"]]) || 0,
      fixed:      Number(r[c["固定補貨量"]]) || 0,
      channel:    r[c["採購管道"]],
      igoName:    r[c["iGo品名"]],
      igoSubName: (c["iGo副品名"] !== undefined ? r[c["iGo副品名"]] : "") || "",
      lineTarget: r[c["LINE對象"]],
      isBulk:     r[c["分裝品項"]] === "是",
      bulkUnit:   r[c["分裝小單位名稱"]],
      ratio:      Number(r[c["換算比"]]) || 1,
      note:       r[c["備註"]],
      status:     status,
      zone:       zone1v,
      room:       room,
      crossRoomOther: crossRoomOther,
      zone2:      zone2v,
      backupZone: backupZoneV
    });
  }
  items.sort((a, b) => a.order - b.order);
  return items;
}

// ── GET items ───────────────────────────────────────────────────
// 前端用：依位置展開（_z1/_z2/_bk），讓磁磚正確分組顯示

function getItems() {
  const baseItems = buildBaseItems();
  const expanded = [];
  baseItems.forEach(item => {
    const { id, zone, zone2, backupZone } = item;
    const base = Object.assign({}, item);
    if (zone2) {
      expanded.push(Object.assign({}, base, { id: id + "_z1", zone: zone,  zone2: zone2 }));
      expanded.push(Object.assign({}, base, { id: id + "_z2", zone: zone2, zone2: zone  }));
    } else {
      expanded.push(Object.assign({}, base, { zone2: "" }));
    }
    if (backupZone) {
      expanded.push(Object.assign({}, base, { id: id + "_bk", zone: backupZone, zone2: "", isBackup: true }));
    }
  });
  return { ok: true, items: expanded };
}

// ── GET latest-count ────────────────────────────────────────────
// 回傳指定日期（或最新一欄）的盤點資料
// date 格式: "MM/DD"（與盤點總表欄首一致）

function getLatestCount(targetDate) {
  const sheet = getSpreadsheet().getSheetByName(SHEET_COUNT);
  const data  = sheet.getDataRange().getValues();
  if (data.length < 2) return { ok: true, date: targetDate || "", counts: {} };

  const headers = data[0]; // [品項ID, 品項名稱, 07/01, 07/15, ...]
  let colToUse = -1;

  if (targetDate) {
    // 有明確指定日期（count.html 開特定一天的頁面）：找不到這一欄就是「這天還沒開始盤點」，
    // 老實回傳空的，不能偷偷頂替成別天的資料給使用者看，會讓人誤以為今天已經填了一堆。
    for (let c = 2; c < headers.length; c++) {
      if (normalizeDateHeader_(headers[c]) === targetDate) { colToUse = c; break; }
    }
    if (colToUse === -1) return { ok: true, date: targetDate, counts: {} };
  } else {
    // 沒指定日期（order.html 算訂購量用）：就是要「最近一次盤點結果」，找最右邊非空欄
    for (let c = headers.length - 1; c >= 2; c--) {
      if (headers[c]) { colToUse = c; break; }
    }
  }
  if (colToUse === -1) return { ok: true, date: "", counts: {} };

  const counts = {};
  for (let r = 1; r < data.length; r++) {
    const id = data[r][0];
    if (id && data[r][colToUse] !== "") {
      counts[id] = Number(data[r][colToUse]);
    }
  }

  const dateStr = normalizeDateHeader_(headers[colToUse]);
  const ts = PropertiesService.getScriptProperties().getProperty("COUNT_TS_" + dateStr) || "";
  return { ok: true, date: dateStr, submittedAt: ts, counts };
}

// ── 共用：找或建立日期欄 ─────────────────────────────────────────

function getOrCreateDateColumn_(sheet, headers, date) {
  for (let c = 2; c < headers.length; c++) {
    if (normalizeDateHeader_(headers[c]) === date) return c;
  }
  let colIdx = headers.length;
  for (let c = 2; c < headers.length; c++) {
    if (!headers[c]) { colIdx = c; break; }
  }
  // 鎖定純文字格式再寫入，避免 Sheets 把「9/6」這種字串自動轉型成日期物件，
  // 之後又比對不到、重複新建欄位。
  const cell = sheet.getRange(1, colIdx + 1);
  cell.setNumberFormat("@");
  cell.setValue(date);
  return colIdx;
}

// ── 共用：把品項 ID 對照到盤點總表的列號，不存在的列自動補建 ──────
// （含品項主檔新品項、_z1/_z2/_bk 合成鍵）

function resolveCountRows_(ss, sheet, raw, ids) {
  const idRowMap = {};
  for (let r = 1; r < raw.length; r++) {
    if (raw[r][0]) idRowMap[raw[r][0]] = r + 1;
  }

  const itemSheet = ss.getSheetByName(SHEET_ITEMS);
  const itemData  = itemSheet.getDataRange().getValues();
  const iHdr      = itemData[0];
  const idCol     = iHdr.indexOf("品項ID");
  const nameCol   = iHdr.indexOf("品項名稱");
  const statusCol = iHdr.indexOf("狀態");

  for (let i = 1; i < itemData.length; i++) {
    const itemId = itemData[i][idCol];
    if (!itemId || itemData[i][statusCol] === "停用") continue;
    if (!idRowMap[itemId]) {
      const newRow = sheet.getLastRow() + 1;
      sheet.getRange(newRow, 1).setValue(itemId);
      sheet.getRange(newRow, 2).setValue(itemData[i][nameCol]);
      idRowMap[itemId] = newRow;
    }
  }

  const suffixRE = /_(z1|z2|bk)$/;
  (ids || []).filter(id => suffixRE.test(id)).forEach(id => {
    if (idRowMap[id]) return;
    const baseId = id.replace(suffixRE, "");
    const suffix = id.match(suffixRE)[0];
    const labelMap = { _z1: "（區1）", _z2: "（區2）", _bk: "（備存）" };
    let label = id;
    for (let i = 1; i < itemData.length; i++) {
      if (itemData[i][idCol] === baseId) {
        label = itemData[i][nameCol] + (labelMap[suffix] || "");
        break;
      }
    }
    const newRow = sheet.getLastRow() + 1;
    sheet.getRange(newRow, 1).setValue(id);
    sheet.getRange(newRow, 2).setValue(label);
    idRowMap[id] = newRow;
  });

  return idRowMap;
}

// ── POST count ──────────────────────────────────────────────────
// data: { action, date:"MM/DD", countBy:"ZY", counts:[{id,value}] }
// 找或建立日期欄，依品項ID寫入（不怕位移）；整批送出，當作最終保險 fallback

function saveCount(data) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return { error: "系統忙碌中，請稍後再試" };
  try {
    const ss    = getSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_COUNT);
    const raw   = sheet.getDataRange().getValues();
    const date  = data.date;

    const colIdx = getOrCreateDateColumn_(sheet, raw[0], date);

    const countsMap = {};
    (data.counts || []).forEach(c => { countsMap[c.id] = c.value; });

    const idRowMap = resolveCountRows_(ss, sheet, raw, Object.keys(countsMap));

    writeColumnBatch_(sheet, colIdx, idRowMap, countsMap, data.countBy || "");

    const ts = data.submittedAt || new Date().toISOString();
    PropertiesService.getScriptProperties().setProperty("COUNT_TS_" + date, ts);

    return { ok: true, date, written: Object.keys(countsMap).length };
  } finally {
    lock.releaseLock();
  }
}

// ── POST save-item-counts ─────────────────────────────────────────
// count.html 前端每 1.5–2 秒把收集到的變更打包送這支，即時回寫 Sheets
// data: { action, date:"MM/DD", countBy:"ZY", items:[{id,value}] }

function saveItemCounts(data) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return { error: "系統忙碌中，請稍後再試" };
  try {
    const ss    = getSpreadsheet();
    const sheet = ss.getSheetByName(SHEET_COUNT);
    const raw   = sheet.getDataRange().getValues();
    const date  = data.date;

    const colIdx = getOrCreateDateColumn_(sheet, raw[0], date);

    const countsMap = {};
    (data.items || []).forEach(it => { countsMap[it.id] = it.value; });

    const idRowMap = resolveCountRows_(ss, sheet, raw, Object.keys(countsMap));

    writeColumnBatch_(sheet, colIdx, idRowMap, countsMap, data.countBy || "");

    return { ok: true, date, written: Object.keys(countsMap).length };
  } finally {
    lock.releaseLock();
  }
}

// ── 共用：把一批 {id: value} 寫進某個日期欄 ─────────────────────────
// 整欄一次讀、一次寫（setValues），避免鎖範圍內跑迴圈逐格 setValue
// 拖長持鎖時間；cell note 記錄「誰、何時填的」供稽核，範圍小，另外處理。

function writeColumnBatch_(sheet, colIdx, idRowMap, countsMap, countBy) {
  const ids = Object.keys(countsMap).filter(id => idRowMap[id]);
  if (!ids.length) return;

  const rows     = ids.map(id => idRowMap[id]);
  const firstRow = Math.min.apply(null, rows);
  const lastRow  = Math.max.apply(null, rows);
  const range    = sheet.getRange(firstRow, colIdx + 1, lastRow - firstRow + 1, 1);
  const values   = range.getValues();

  ids.forEach(id => {
    values[idRowMap[id] - firstRow][0] = countsMap[id];
  });
  range.setValues(values);

  const ts = new Date().toISOString();
  ids.forEach(id => {
    sheet.getRange(idRowMap[id], colIdx + 1).setNote(countBy + " · " + ts);
  });
}

// ── GET order ───────────────────────────────────────────────────
// 根據最新盤點資料計算各品項訂購量

function getOrder() {
  const latestResult = getLatestCount(null);
  const counts       = latestResult.counts;
  const countDate    = latestResult.date;

  // 使用原始品項（不展開），避免重複計算
  const baseItems = buildBaseItems().filter(it => it.status === "啟用");
  const orderItems = [];

  baseItems.forEach(item => {
    const id = item.id;
    let suggested = 0;
    let warning   = false;
    let current   = null;
    let baselineDisp = 0;
    let safetyDisp   = 0;

    if (item.fixed > 0) {
      // 固定補貨量：count.html 送來的是哨兵數字（夠=safety+1, 不夠=0, 未填=null）
      // 低於安全量（raw <= safety）或未填（null 視為安全優先，叫貨）才叫固定數
      const raw = counts[id] !== undefined ? Number(counts[id]) : null;
      current = raw;
      if (raw === null || raw <= item.safety) { suggested = item.fixed; }
      if (item.safety > 0 && raw !== null && raw <= item.safety) warning = true;
      baselineDisp = item.fixed;
      safetyDisp   = item.safety;

    } else if (item.backupZone) {
      // 備存型：以備存位置（_bk）的盤點量為準計算訂購
      const bkRaw = counts[id + "_bk"] !== undefined ? Number(counts[id + "_bk"]) : null;
      if (bkRaw !== null) {
        current   = bkRaw; // 儲藏室備存點的是採購單位（大箱），不做分裝換算
        suggested = Math.max(0, item.baseline - current);
        if (item.safety > 0 && current <= item.safety) warning = true;
      } else {
        suggested = item.baseline;
      }
      baselineDisp = item.baseline;
      safetyDisp   = item.safety;

    } else if (item.zone2) {
      // 並存型：兩位置盤點量加總
      // 分裝品項：兩區都以小單位點料 → 加總後換算大單位
      const raw1 = counts[id + "_z1"] !== undefined ? Number(counts[id + "_z1"]) : null;
      const raw2 = counts[id + "_z2"] !== undefined ? Number(counts[id + "_z2"]) : null;
      const hasCount = raw1 !== null || raw2 !== null;
      const combined = (raw1 ?? 0) + (raw2 ?? 0);
      const baselineBig = item.isBulk ? Math.floor(item.baseline / item.ratio) : item.baseline;
      const safetyBig   = item.isBulk ? Math.floor(item.safety   / item.ratio) : item.safety;
      current   = item.isBulk ? Math.floor(combined / item.ratio) : combined;
      suggested = hasCount ? Math.max(0, baselineBig - current) : baselineBig;
      if (safetyBig > 0 && hasCount && current < safetyBig) warning = true;
      baselineDisp = baselineBig;
      safetyDisp   = safetyBig;

    } else {
      // 單一位置
      // 分裝品項：以小單位點料 → 換算大單位；baseline/safety 同樣在 Sheets 以小單位填入
      const rawCount = counts[id] !== undefined ? Number(counts[id]) : null;
      const baselineBig = item.isBulk ? Math.floor(item.baseline / item.ratio) : item.baseline;
      const safetyBig   = item.isBulk ? Math.floor(item.safety   / item.ratio) : item.safety;
      if (rawCount !== null) {
        current   = item.isBulk ? Math.floor(rawCount / item.ratio) : rawCount;
        suggested = Math.max(0, baselineBig - current);
        if (safetyBig > 0 && current < safetyBig) warning = true;
      } else {
        suggested = baselineBig;
      }
      baselineDisp = baselineBig;
      safetyDisp   = safetyBig;
    }

    if (suggested > 0 || warning) {
      orderItems.push({
        id, name: item.name, unit: item.unit, room: item.room, crossRoomOther: item.crossRoomOther,
        channel: item.channel, igoName: item.igoName, igoSubName: item.igoSubName,
        lineTarget: item.lineTarget, suggested, current, warning, note: item.note,
        isBulk: item.isBulk, bulkUnit: item.bulkUnit, ratio: item.ratio,
        rawCurrent: item.isBulk && !item.backupZone && counts[id] !== undefined ? Number(counts[id]) : null,
        baseline: baselineDisp, safety: safetyDisp
      });
    }
  });

  return { ok: true, date: countDate, submittedAt: latestResult.submittedAt || "", items: orderItems };
}

// ── POST pending-order ──────────────────────────────────────────
// 暫存待送 iGo 訂單到 Script Properties（Tampermonkey 來取用）

function savePendingOrder(data) {
  const sessionId = data.sessionId || ("igo_" + Date.now());
  const payload = JSON.stringify({
    sessionId,
    items:   data.items || [],
    date:    data.date  || "",
    room:    data.room  || "",
    savedAt: new Date().toISOString()
  });
  warnIfNearPropertySizeLimit_("PENDING_ORDER", payload);
  PropertiesService.getScriptProperties().setProperty("PENDING_ORDER", payload);
  return { ok: true, sessionId };
}

// PropertiesService 單一 key 上限 9kB，接近上限先記警告，方便日後回頭查
function warnIfNearPropertySizeLimit_(key, payloadStr) {
  const bytes = Utilities.newBlob(payloadStr).getBytes().length;
  if (bytes > 7000) {
    Logger.log("⚠️ " + key + " 大小接近 PropertiesService 9kB 上限：" + bytes + " bytes");
  }
}

function getPendingOrder() {
  const raw = PropertiesService.getScriptProperties().getProperty("PENDING_ORDER");
  if (!raw) return { ok: true, items: [], date: "" };
  try {
    return { ok: true, ...JSON.parse(raw) };
  } catch (_) {
    return { ok: true, items: [], date: "" };
  }
}

function clearPendingOrder() {
  PropertiesService.getScriptProperties().deleteProperty("PENDING_ORDER");
  return { ok: true };
}

// ── 兩週盤點缺貨草稿 ─────────────────────────────────────────────
// 跟 PENDING_ORDER 分開存放：PENDING_ORDER 是「目前正在跑 Tampermonkey」
// 的那一份待送清單（單一份），TWOWEEK_DRAFT 只是暫存兩週盤點算出來的
// 全量缺貨清單，讓 order.html 依 room 分三組後，各自送去 PENDING_ORDER。

function save2wDraft(data) {
  const payload = JSON.stringify({
    items:   data.items || [],
    date:    data.date  || "",
    savedAt: new Date().toISOString()
  });
  warnIfNearPropertySizeLimit_("TWOWEEK_DRAFT", payload);
  PropertiesService.getScriptProperties().setProperty("TWOWEEK_DRAFT", payload);
  return { ok: true };
}

function get2wDraft() {
  const raw = PropertiesService.getScriptProperties().getProperty("TWOWEEK_DRAFT");
  if (!raw) return { ok: true, items: [], date: "" };
  try { return { ok: true, ...JSON.parse(raw) }; }
  catch (_) { return { ok: true, items: [], date: "" }; }
}

// ── POST log-order ──────────────────────────────────────────────
// 記錄已送出的訂單到「入料紀錄」分頁

function logOrder(data) {
  const sheet = getSpreadsheet().getSheetByName(SHEET_LOG);
  const date  = data.date || "";
  (data.items || []).forEach(item => {
    sheet.appendRow([date, item.id, item.name, item.qty, item.unit, item.channel]);
  });
  return { ok: true };
}

// ── Receipt：到貨核點清單 ────────────────────────────────────────

function saveReceipt(data) {
  // 從品項主檔查 zone
  const sheet   = getSpreadsheet().getSheetByName(SHEET_ITEMS);
  const raw     = sheet.getDataRange().getValues();
  const hdr     = raw[0];
  const c       = {}; hdr.forEach((h, i) => { c[h] = i; });
  const zoneMap = {};
  for (let i = 1; i < raw.length; i++) {
    const id = raw[i][c["品項ID"]];
    if (id) zoneMap[id] = raw[i][c["存放區域1"] !== undefined ? c["存放區域1"] : c["存放區域"]] || "";
  }

  const newItems = (data.items || []).map(it => ({
    id:       it.id,
    name:     it.name,
    ordered:  it.qty,
    unit:     it.unit || "",
    zone:     zoneMap[it.id] || "",
    received: null,
    done:     false
  }));

  // 同一批盤點（同一個 date）分房間分次送單時，要把每次送單的品項合併進同一份
  // 收貨清單，不能整包覆蓋——否則後送的房間會把先送的房間的收貨清單洗掉。
  // 只有 date 不同（代表是全新一輪盤點）才視為新的一批，直接覆蓋掉舊的。
  let items = newItems;
  const existingRaw = PropertiesService.getScriptProperties().getProperty("PENDING_RECEIPT");
  if (existingRaw) {
    try {
      const existing = JSON.parse(existingRaw);
      if (existing.date === (data.date || "") && Array.isArray(existing.items)) {
        items = existing.items.concat(newItems);
      }
    } catch (e) { /* 舊資料解析失敗，當作沒有舊資料，直接用新的一批 */ }
  }

  PropertiesService.getScriptProperties().setProperty(
    "PENDING_RECEIPT",
    JSON.stringify({ date: data.date || "", savedAt: new Date().toISOString(), items })
  );
  return { ok: true };
}

function getReceipt() {
  const raw = PropertiesService.getScriptProperties().getProperty("PENDING_RECEIPT");
  if (!raw) return { ok: true, items: [], date: "" };
  try {
    const receipt = JSON.parse(raw);
    receipt.items = (receipt.items || []).filter(it => !it.archived);
    return { ok: true, ...receipt };
  }
  catch (_) { return { ok: true, items: [], date: "" }; }
}

// ── POST archive-receipt ─────────────────────────────────────────
// 把已全數到齊（done===true）的品項從 PENDING_RECEIPT 直接刪除（不是標記留著）。
// 「誰、何時到貨」這個稽核紀錄，在標記「全到」的當下（updateReceipt）就已經
// 寫進「入料紀錄」Sheet 一列了；封存只是清掉已經完成使命的暫存資料，避免
// PENDING_RECEIPT 這包 JSON 隨著每次進貨一直長大、最後撞上 PropertiesService
// 的 9kB 容量上限。

function archiveReceipt(data) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return { error: "系統忙碌中，請稍後再試" };
  try {
    const raw = PropertiesService.getScriptProperties().getProperty("PENDING_RECEIPT");
    if (!raw) return { error: "no receipt" };
    const receipt = JSON.parse(raw);
    const ids = new Set(data.itemIds || []);
    const before = (receipt.items || []).length;
    receipt.items = (receipt.items || []).filter(it => !(ids.has(it.id) && it.done));
    const archivedCount = before - receipt.items.length;
    PropertiesService.getScriptProperties().setProperty("PENDING_RECEIPT", JSON.stringify(receipt));
    return { ok: true, archivedCount };
  } finally {
    lock.releaseLock();
  }
}

function updateReceipt(data) {
  const raw = PropertiesService.getScriptProperties().getProperty("PENDING_RECEIPT");
  if (!raw) return { error: "no receipt" };
  const receipt = JSON.parse(raw);
  const item = receipt.items.find(it => it.id === data.itemId);
  if (!item) return { ok: true };

  const wasLogged = item.received !== null;  // 之前有寫入 Sheets
  item.received = data.received;
  item.done     = data.done;
  PropertiesService.getScriptProperties().setProperty("PENDING_RECEIPT", JSON.stringify(receipt));

  // 即時寫入 / 更新 / 刪除 入料紀錄
  // 邏輯：received 有值 → 寫入（先刪再寫）；received=null（復原）→ 刪除
  const logSheet = getSpreadsheet().getSheetByName(SHEET_LOG);
  if (wasLogged) {
    // 有舊紀錄：先找到並刪除（復原 or 改數量都需要）
    const values = logSheet.getDataRange().getValues();
    for (let i = values.length - 1; i >= 1; i--) {
      if (values[i][2] === item.name) {
        logSheet.deleteRow(i + 1);
        break;
      }
    }
  }
  if (data.received !== null) {
    // 全到 or 部分到：寫入一列 [請購日期, 入料日期, 品項名稱, 請購量, 實收量]
    logSheet.appendRow([receipt.date, new Date(), item.name, item.ordered, data.received]);
  }

  return { ok: true };
}

// ── 一次性工具：設定「存放區域」下拉選單 ─────────────────────────
// 在 Apps Script 編輯器手動點選執行，執行一次即可。
// 執行後品項主檔的 P 欄（P2 以下）會出現 18 個區域可選。

function setupZoneDropdown() {
  const ZONES = [
    "胚胎-鐵1", "胚胎-鐵2", "胚胎-鐵3", "胚胎-鐵4", "胚胎-鐵5", "胚胎-鐵6",
    "胚胎-架1", "胚胎-架2", "胚胎-架3", "胚胎-架4",
    "胚胎-回收區",
    "文書桌",
    "精蟲-精A", "精蟲-精B", "精蟲-精C", "精蟲-精D", "精蟲-精E",
    "供應-洗手檯", "供應-供A", "供應-供B",
    "儲藏室",
    "3F-鐵1",
    "PGS-冰箱", "PGS-2", "PGS-3"
  ];

  const sheet   = getSpreadsheet().getSheetByName(SHEET_ITEMS);
  const lastRow = sheet.getLastRow();
  const rows    = lastRow - 1;

  // 設定欄位標題
  sheet.getRange(1, 16).setValue("存放區域1");
  sheet.getRange(1, 17).setValue("存放區域2");
  sheet.getRange(1, 18).setValue("備存位置");

  const rule = SpreadsheetApp.newDataValidation()
    .requireValueInList(ZONES, true)
    .setAllowInvalid(false)
    .build();

  // P欄（存放區域1）、Q欄（存放區域2）、R欄（備存位置）同樣的選單
  sheet.getRange(2, 16, rows, 1).setDataValidation(rule);
  sheet.getRange(2, 17, rows, 1).setDataValidation(rule);
  sheet.getRange(2, 18, rows, 1).setDataValidation(rule);

  Logger.log("完成！P/Q/R 欄已設好下拉選單，共 " + ZONES.length + " 個選項。");
}

// ── 一次性工具：拆分跨房間並存品項 ─────────────────────────────────
// 在 Apps Script 編輯器手動執行一次即可（或透過暫時的 doPost 路由跑一次）。
// PVC手套S / 多倍PROTOS手套M / 石蠟紙 這 3 個品項原本存放區域1+2 分屬
// 胚胎室／精蟲室，訂購量是合併計算成一個數字，沒辦法直接對應到「送去哪一間」。
// 拆成兩筆各自單一位置的獨立品項後，兩邊各自盤點、各自算訂購量，
// 天生就會分別出現在正確的那張單上。原本合併的那一列改標記「停用」保留歷史。

function splitCrossRoomItems() {
  const sheet = getSpreadsheet().getSheetByName(SHEET_ITEMS);
  const data  = sheet.getDataRange().getValues();
  const hdr   = data[0];
  const c = {}; hdr.forEach((h, i) => { c[h] = i; });
  const idCol = c["品項ID"];
  const baselineCol = c["每四週基準量"] !== undefined ? "每四週基準量" : "每兩週基準量";

  const SPLITS = [
    { id: "pvc_s",    baseline: 2, safety: 2 },
    { id: "protos_m", baseline: 1, safety: 1 },
    { id: "paraffin", baseline: 1, safety: 1 }
  ];

  const log = [];
  SPLITS.forEach(cfg => {
    let rowIdx = -1;
    for (let i = 1; i < data.length; i++) {
      if (data[i][idCol] === cfg.id) { rowIdx = i; break; }
    }
    if (rowIdx === -1) { log.push("找不到品項：" + cfg.id); return; }

    const row   = data[rowIdx];
    const zone1 = row[c["存放區域1"]];
    const zone2 = row[c["存放區域2"]];
    if (!zone2) { log.push(cfg.id + " 沒有存放區域2，略過"); return; }

    const isFixed = Number(row[c["固定補貨量"]]) > 0;

    [{ zone: zone1, suffix: "_embryo", label: "(胚胎室)" },
     { zone: zone2, suffix: "_sperm",  label: "(精蟲室)" }].forEach(part => {
      const newRow = row.slice(); // 先複製整列其餘欄位（iGo品名／管道／備註等都沿用）
      newRow[idCol]              = cfg.id + part.suffix;
      newRow[c["品項名稱"]]       = row[c["品項名稱"]] + part.label;
      if (isFixed) newRow[c["固定補貨量"]] = cfg.baseline;
      else          newRow[c[baselineCol]]  = cfg.baseline;
      newRow[c["安全庫存量"]]     = cfg.safety;
      newRow[c["存放區域1"]]      = part.zone;
      newRow[c["存放區域2"]]      = "";
      newRow[c["狀態"]]           = "啟用";
      sheet.appendRow(newRow);
    });

    sheet.getRange(rowIdx + 1, c["狀態"] + 1).setValue("停用");
    log.push("已拆分：" + cfg.id);
  });

  Logger.log(log.join("\n"));
  return { ok: true, log };
}

// ── 一次性工具：修正重複 ID ───────────────────────────────────────
// 在 Apps Script 編輯器手動執行一次即可。
// 把 postit × 2、pen_color × 3 改成不重複的 ID。

function fixDuplicateIds() {
  const sheet = getSpreadsheet().getSheetByName(SHEET_ITEMS);
  const data  = sheet.getDataRange().getValues();
  const hdr   = data[0];
  const idCol = hdr.indexOf("品項ID");
  const nmCol = hdr.indexOf("品項名稱");

  // 對照表：依品項名稱關鍵字 → 新 ID
  const REMAP = [
    { match: "便條紙_綠橘黃", newId: "postit_gy"  },
    { match: "便條紙_黃藍紅", newId: "postit_ybr" },
    { match: "無毒筆_黑",     newId: "pen_blk"    },
    { match: "無毒筆_藍",     newId: "pen_blu"    },
    { match: "無毒筆_紅",     newId: "pen_red"    },
  ];

  let fixed = 0;
  for (let i = 1; i < data.length; i++) {
    const name = String(data[i][nmCol] || "");
    for (const r of REMAP) {
      if (name.includes(r.match)) {
        sheet.getRange(i + 1, idCol + 1).setValue(r.newId);
        Logger.log("第 " + (i + 1) + " 列：" + name + " → " + r.newId);
        fixed++;
        break;
      }
    }
  }
  Logger.log("完成！共修正 " + fixed + " 筆 ID。");
}
