# 培養液管理系統 — Phase 2 交班文件

**日期**：2026-05-06  
**完成 Phase**：Phase 1（kucun.html v1.1.0 全面重建）  
**下次要做**：Phase 2（其他頁面寫入 kucun-changelog + 補版本號）

---

## 已完成（Phase 1）

- [x] `kucun.html` v1.1.0 全面重建
  - **Sticky 表格**：品項 / 庫存 / 狀態 左側固定，右側橫向捲動（批號效期等）
  - **排序**：種類 / 廠商 / 狀態 三個 tab 切換
  - **批號顯示**：效期精確到日，全域切換「最近 3 批 / 顯示全部」
  - **更新紀錄區**：讀取 `kucun-changelog` localStorage，含來源篩選（進貨/備盤/盤點/手動）
  - **手動登記使用**：Modal 表單，可記錄使用/報廢/庫存調整/備註，寫入 `kucun-changelog`
  - **無資料空白頁**：友善提示

---

## Phase 2 任務清單

### 目標
讓 beipan / jinhuo / gupan / order 四頁在關鍵操作時，自動寫一筆紀錄到 `kucun-changelog`。

### kucun-changelog 資料格式（已在 kucun.html 定義）
```json
{
  "id": "uid",
  "ts": "2026-05-06T10:30:00.000Z",
  "source": "jinhuo | beipan | pandian | order | manual",
  "action": "receive | void | edit | beipan | pandian | use | discard | adjust | order | note",
  "productId": "givf",
  "productName": "G-IVF",
  "lotNumber": "53651",
  "qty": 12,
  "note": "說明文字"
}
```

### 修改清單

#### 1. `jinhuo.html`（進貨記錄）
觸發時機：
- **收貨新增**（batchSaveAll / 單筆確認存檔）→ source:`jinhuo`, action:`receive`, qty:+receivedQty
- **作廢**（void 操作完成後）→ source:`jinhuo`, action:`void`, qty:-receivedQty（負數）
- **修改**（edit 操作完成後）→ source:`jinhuo`, action:`edit`, note 記錄修改項目
版本號：目前 v0.5.9，不需變動（已有）

#### 2. `beipan.html`（備盤）
觸發時機：
- **備盤完成儲存**（最後 confirm 按鈕）→ 針對每個 batch 各寫一筆：source:`beipan`, action:`beipan`, qty:remaining（開封剩餘），note:批號+usedQty
版本號：讀取目前頁面標題確認後補上

#### 3. `gupan.html`（盤點）
觸發時機：
- **盤點完成確認**（pandian confirm）→ 針對每個 allValues 各寫一筆：source:`pandian`, action:`pandian`, qty:actual, note:"盤點實際值"
- 同時追加到 `pandian-history`（新 key，陣列）以支援未來使用量推算
版本號：讀取目前頁面標題確認後補上

#### 4. `order.html`（訂貨管理）
觸發時機：
- **訂單送出**（confirm 按鈕）→ 針對每個 order 各寫一筆：source:`order`, action:`order`, qty:orderQty
版本號：讀取目前頁面標題確認後補上

### 共用的 helper function（可貼到各頁面）
```javascript
function appendKucunLog(entries) {
  const cl = JSON.parse(localStorage.getItem('kucun-changelog') || '[]');
  const now = new Date().toISOString();
  entries.forEach(e => {
    cl.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2,6),
      ts: now,
      ...e
    });
  });
  localStorage.setItem('kucun-changelog', JSON.stringify(cl));
}
```

---

## Phase 3 任務清單（下下次）

### 目標
使用量推算 + 批號啟用時間追蹤

- [ ] kucun.html 讀取 `pandian-history`，計算每段期間使用量
  - 公式：前次盤點 actual + 期間進貨 - 本次盤點 actual = 使用量
- [ ] 在庫存表格右側捲動區補上「本月估計用量」欄位
- [ ] 在批號列補上「開始使用日期」（= 該批號最早的 jinhuo receivedAt）
- [ ] 在 changelog 補上「距上次訂購使用量」計算（上次 order 日至今的 changelog 負值總和）

---

## 測試資料（DevTools Console 貼入）

```javascript
// 快速注入測試資料
localStorage.setItem('beipan-result', JSON.stringify({
  date: '2026-05-01',
  batches: [
    { reagentId:'givf', reagentName:'G-IVF', selectedLot:'53651', remaining:47, unopened:1, usedQty:5 },
    { reagentId:'h5gt', reagentName:'H5GT',  selectedLot:'A2041', remaining:12, unopened:0, usedQty:3 }
  ],
  threshold: { orange_days:3, red_days:1 }
}));
localStorage.setItem('pandian-result', JSON.stringify({
  date: '2026-04-28',
  allValues: [
    { id:'m-givf', name:'G-IVF', unit:'瓶', actual:3, target:5 },
    { id:'m-h5gt', name:'H5GT',  unit:'瓶', actual:2, target:4 },
    { id:'m-oil',  name:'Heavy Oil', unit:'瓶', actual:8, target:3 }
  ]
}));
localStorage.setItem('jinhuo-records', JSON.stringify([
  { id:'r1', productId:'givf', productName:'G-IVF', receivedQty:12, receivedAt:'2026-05-03', lotNumber:'53651', expiryDate:'2026-06-30', isVoided:false },
  { id:'r2', productId:'givf', productName:'G-IVF', receivedQty:12, receivedAt:'2026-05-03', lotNumber:'54001', expiryDate:'2026-08-15', isVoided:false },
  { id:'r3', productId:'h5gt', productName:'H5GT',  receivedQty:6,  receivedAt:'2026-05-04', lotNumber:'A2041', expiryDate:'2026-05-07', isVoided:false },
  { id:'r4', productId:'oil',  productName:'Heavy Oil', receivedQty:3, receivedAt:'2026-05-05', lotNumber:'OIL99', expiryDate:'2027-01-01', isVoided:false }
]));
localStorage.setItem('order-result', JSON.stringify({
  date: '2026-05-01',
  orders: [
    { orderId:'ord1', itemId:'m-givf', name:'G-IVF', orderQty:24, receivedQty:12 },
    { orderId:'ord2', itemId:'m-h5gt', name:'H5GT',  orderQty:6,  receivedQty:6 }
  ]
}));
location.reload();
```

---

## 下次 session 開頭語

「繼續培養液管理系統 Phase 2。請閱讀 `000_Agent/claude-history/培養液系統_Phase2_交班.md` 了解進度。任務：修改 beipan.html、jinhuo.html、gupan.html、order.html，讓它們在關鍵操作時寫入 kucun-changelog，並補上版本號。`kucun-changelog` 格式與 helper function 都在交班文件裡。」
