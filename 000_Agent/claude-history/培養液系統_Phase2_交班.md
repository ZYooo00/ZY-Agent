# 培養液管理系統 — Phase 3.5 交班文件

**日期**：2026-05-06  
**完成 Phase**：Phase 1 + Phase 2 + Phase 3 全部完成  
**下次要做**：Phase 3.5（kucun.html UI 大改版）

---

## 已完成（Phase 1 + 2）

- [x] `kucun.html` v1.1.0 全面重建（Sticky 表格、排序、批號、更新紀錄、手動登記）
- [x] `jinhuo.html` 進貨/作廢/修改 → 自動寫入 `kucun-changelog`
- [x] `gupan.html` 盤點確認 → 自動寫入 `kucun-changelog` + `pandian-history`
- [x] `order.html` 訂貨送出 → 自動寫入 `kucun-changelog`
- [x] `beipan.html` 預留 `appendKucunLog()`（v1.1）

---

## 已完成（Phase 3）

- [x] `beipan.html` v1.2：「確認無誤，送出備盤」按鈕接線
  - 新增 `submitBeipan()`：儲存 `beipan-result` + 寫入 `kucun-changelog`
  - 新增 `showToast()`：成功提示
- [x] `kucun.html` v1.2.0：
  - 讀取 `pandian-history`，新增 `calcEstUsage()` 推算期間用量
  - 新增「期間估計用量」欄
  - 批號行加「進貨：YYYY-MM-DD」小字（**注意：Phase 3.5 會移除這個**）
  - 底部提示更新

---

## Phase 3.5 任務清單（下次 session 執行）

### 背景

ZY 確認後要求對 kucun.html 做完整 UI 重構。

---

### 欄位結構（最終版）

**固定欄（左，sticky）**

| 順序 | 欄位 | 說明 |
|------|------|------|
| 1 | 品項 | 只顯示品名，不顯示廠商小字（廠商排序按鈕仍保留） |
| 2 | 庫存/安全量 | 庫存大字 + 安全量目標小字（如：`3 瓶` 大 + `目標 5` 小） |
| 3 | 狀態 | 徽章不變 |
| 4 | 批號/效期 | 三子欄對齊：數量 ｜ 效期 ｜ 批號（切換按鈕放欄頭） |
| 5 | 待收貨 | 在途數量不變 |

**移除**：本月進貨欄

**可滾動（中）**

- 每欄 = 一個操作事件（同日多筆 = 拆多欄）
- 欄頭：`M/D` 格式，換年時插入 `YYYY年` 分隔行
- 欄內：操作類型標籤（備盤/進貨/盤點/手動）+ 數量（瓶，僅顯示非零）
- 資料來源：`kucun-changelog`，依 ts 排序
- 備盤條目：只顯示「備盤」標籤，不顯示數量（mL 無法直接換算瓶）

**固定欄（右，sticky）**

| 欄位 | 說明 |
|------|------|
| 期間估計用量 | 數字 + 來源標籤，見下方邏輯 |
| Export CSV 按鈕 | 頁面右上角，下載 kucun-changelog |

---

### 批號/效期欄設計

三子欄對齊（`display:grid` 或 `<table>` 內嵌）：

```
×1    2026-05-09（3天後）  5555
×1    2026-06-30           53651
```

- 切換按鈕「最近 3 批 ／ 全部」放在 `<th>` 欄頭
- **移除**：批號進貨日期灰字（Phase 3 剛加的，Phase 3.5 撤掉）

---

### 期間估計用量邏輯（已確認）

**公式**：`前一快照存量 + 期間進貨 − 最新快照存量 = 期間用量`

**快照優先鏈**：

| 條件 | 標示 |
|------|------|
| pandian-history 最新紀錄 ≥ 最新備盤 | `盤點推算`（精確，瓶） |
| 最新備盤 > 最新盤點 | `備盤推算（估）`（近似：`(remaining > 0 ? 1 : 0) + unopened`） |
| 資料不足 | `—` |

- **備盤快照重建**：從 kucun-changelog `source:'beipan'` 按 ts 分組，不需額外 key
- **無自訂日期選擇器**（已確認捨去）

---

### Export CSV 規格

- 按鈕位置：頁面右上角
- 檔名：`kucun-changelog-YYYYMMDD.csv`
- 欄位：`日期,時間,來源,操作,品項,批號,數量,備註`
- 編碼：**UTF-8 with BOM**（Excel 中文不亂碼）

---

### 關鍵檔案

| 檔案 | 目前版本 | 改版後 |
|------|---------|-------|
| `generated-pages/kucun.html` | v1.2.0 | v1.3.0 |
| 其餘頁面 | 不動 | — |

---

### 驗證方式

1. PowerShell 開啟 kucun.html
2. DevTools 注入測試資料（含 jinhuo/beipan/pandian/manual 各類型）
3. 確認：欄位順序、固定滾動分區、批號三子欄對齊、使用紀錄按日期各欄、換年分隔、期間估計用量標示、Export CSV 中文正常
4. 版本顯示 v1.3.0

---

## kucun-changelog 資料格式（參考）

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

---

## localStorage 各 key 說明

| Key | 格式 | 說明 |
|-----|------|------|
| `jinhuo-records` | `[]` | 進貨紀錄，含 receivedQty / receivedAt / isVoided |
| `pandian-result` | `{}` | 最新盤點（只存一筆） |
| `pandian-history` | `[]` | 歷次盤點快照（由 gupan.html append） |
| `beipan-result` | `{}` | 最新備盤（只存一筆，Phase 3 起由 beipan.html 存） |
| `order-result` | `{}` | 最新訂貨 |
| `kucun-changelog` | `[]` | 所有出入庫事件（所有頁面共寫） |

---

## 測試資料（DevTools Console 貼入）

```javascript
// 注入完整測試資料
localStorage.setItem('jinhuo-records', JSON.stringify([
  { id:'r1', productId:'givf', productName:'G-IVF', receivedQty:12, receivedAt:'2026-05-03', lotNumber:'53651', expiryDate:'2026-06-30', isVoided:false },
  { id:'r2', productId:'givf', productName:'G-IVF', receivedQty:12, receivedAt:'2026-05-03', lotNumber:'54001', expiryDate:'2026-08-15', isVoided:false },
  { id:'r3', productId:'h5gt', productName:'H5GT',  receivedQty:6,  receivedAt:'2026-05-04', lotNumber:'A2041', expiryDate:'2026-05-07', isVoided:false },
]));
localStorage.setItem('pandian-history', JSON.stringify([
  { date:'2026-04-01', allValues:[{id:'m-givf',name:'G-IVF',unit:'瓶',actual:5,target:5},{id:'m-h5gt',name:'H5GT',unit:'瓶',actual:4,target:4}] },
  { date:'2026-05-01', allValues:[{id:'m-givf',name:'G-IVF',unit:'瓶',actual:3,target:5},{id:'m-h5gt',name:'H5GT',unit:'瓶',actual:2,target:4}] },
]));
localStorage.setItem('pandian-result', JSON.stringify({
  date:'2026-05-01',
  allValues:[{id:'m-givf',name:'G-IVF',unit:'瓶',actual:3,target:5},{id:'m-h5gt',name:'H5GT',unit:'瓶',actual:2,target:4}]
}));
localStorage.setItem('beipan-result', JSON.stringify({
  date:'2026-05-06',
  batches:[
    {reagentId:'givf',reagentName:'G-IVF',selectedLot:'53651',remaining:47,unopened:1,usedQty:0,bottleVol:60},
    {reagentId:'h5gt',reagentName:'H5GT', selectedLot:'A2041',remaining:6, unopened:1,usedQty:0,bottleVol:30},
  ],
  threshold:{orange_days:3,red_days:1}
}));
localStorage.setItem('kucun-changelog', JSON.stringify([
  {id:'a1',ts:'2026-05-01T08:00:00Z',source:'pandian',action:'pandian',productId:'givf',productName:'G-IVF',lotNumber:null,qty:3,note:'盤點'},
  {id:'a2',ts:'2026-05-03T09:00:00Z',source:'jinhuo', action:'receive',productId:'givf',productName:'G-IVF',lotNumber:'53651',qty:12,note:'進貨'},
  {id:'a3',ts:'2026-05-06T07:30:00Z',source:'beipan', action:'beipan', productId:'givf',productName:'G-IVF',lotNumber:'53651',qty:107,note:'備盤剩餘 47 mL，未開封 1 瓶'},
  {id:'a4',ts:'2026-05-08T10:00:00Z',source:'manual', action:'use',    productId:'givf',productName:'G-IVF',lotNumber:'53651',qty:-1,note:'手動記錄使用 1 瓶'},
]));
location.reload();
```

---

## 下一個 session 開頭語

「繼續培養液管理系統 Phase 3.5。請閱讀 `000_Agent/claude-history/培養液系統_Phase2_交班.md` 了解進度。任務：執行 kucun.html v1.3.0 大改版，完整規格在計畫檔 `.claude/plans/prd-beipan-html-gupan-html-order-html-j-vectorized-pancake.md` 的 Phase 3.5 節。記得先看截圖（使用者已確認概念）。」
