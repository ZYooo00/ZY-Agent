// shared.js — 品項主檔、共用函數
// 所有 HTML 頁面引用此檔，禁止在各頁面重複定義

const APP_VERSION = '26.06.17'; // 格式：YY.MM.DD

const CHANGELOG = [
  {
    version: '26.06.17',
    date: '2026-06-17',
    changes: [
      '【修正】庫存：602、110 等試劑類品項，庫存數量現在會正確顯示（進貨後不再停留在上次盤點數值）',
      '【修正】庫存：AOA GM508 等同時有多個批號在使用的品項，庫存瓶數現在能正確加總全部批次',
      '【修正】備盤：批號瓶數現在會反映庫存手動調整後的正確數量',
      '【修正】備盤：開封逾期批號按鈕修正，有備用瓶時顯示「開新品」，最後一瓶時顯示「丟棄殘液」',
      '【新功能】估盤：若 102 有新批號待 QC，頁面頂端會出現提醒橫幅，並標明是磊柏還是明美',
    ],
  },
  {
    version: '26.06.11',
    date: '2026-06-11',
    changes: [
      '【修正】估盤：未填入數值的欄位確認送出時改為傳 0，不再自動帶入建議數值，避免估盤值誤流入備盤頁面',
      '【修正】估盤：多配欄位建議數值還原為 2 mL（H5GT、GxTL、GIVF 三欄皆適用）',
      '【修正】歷史備盤：批號快照只顯示使用者選取或實際用到的批號，不再列出所有庫存批號',
    ],
  },
  {
    version: '26.06.07',
    date: '2026-06-07',
    changes: [
      '【調整】估盤：欄位名稱更新（Bx → Bx Keep、右側 Bx → Biopsy 操作盤），新增長按說明提示（Geri-受精、D0、Bx Keep）',
      '【新功能】備盤：今日備盤鎖定後可追加 Glue 盤數（支援帳面校正與開封備用批號，全程不需離開備盤頁面）',
      '【調整】備盤：多配欄位預設值改為 0，不再自動帶入 2mL，避免估盤時誤帶多餘用量',
      '【修正】備盤：數量扣除正確性全面修正——過期瓶殘液自動作廢後不再重複累加、混批取用量加入上限驗證、跨批號自動扣除邏輯調整',
      '【修正】備盤：批號顯示與操作機制優化——開封逾期批號固定排列於頂部、取消登記開瓶後開封日與剩餘量精準還原、效期到期當天仍可正常備盤（翌日起停用）、空瓶批號改為灰色不可選',
      '【修正】備盤：送出失敗時資料自動回復，可重新送出；送出中途防止誤觸操作；開瓶效期天數計算修正（今日開封算第 1 天）',
    ]
  },
  {
    version: '26.06.06',
    date: '2026-06-05',
    changes: [
      '【修正】備盤：批號圓圈選取後再點一次可取消，誤觸時不再卡住',
    ]
  },
  {
    version: '26.06.05',
    date: '2026-06-05',
    changes: [
      '【新增】進貨：待收清單新增「🚫 取消待收」，可指定品項、填寫人員與原因，不影響同張訂單其他品項',
      '【新增】進貨：歷史紀錄新增取消紀錄，依日期混入時間軸，一鍵撤銷可復原',
      '【修正】進貨：多品項同批入庫時，訂單核銷只有部分成功的問題',
      '【修正】訂單核銷計算：正確納入已取消數量，不再等待永遠不會來的品項',
      '【修正】備盤：選人員時互斥鎖 Banner 閃現後消失的問題',
      '【調整】備盤：未開封批號送出前系統自動擋下，提示先登記新開瓶',
      '【調整】備盤：帳面量不足確認視窗，改為只檢查你選的那瓶',
    ]
  },
  {
    version: '26.06.04',
    date: '2026-06-05',
    changes: [
      '備盤：批號選取警告拆成兩個獨立框框，「體積不足」與「上方有更早到期批號」分別彈出，不再擠在同一行',
      '備盤：登記新開瓶、殘液校正等操作後自動儲存草稿，重整頁面不會遺失剛才的動作',
      '備盤：Oil / HEPES 輸入的批號現在會正確寫進系統日誌',
    ]
  },
  {
    version: '26.06.01',
    date: '2026-06-01',
    changes: [
      'AOA 明美 GM508 批號抓取修正（ID 對應錯誤）',
      '備盤批號新增「帳面用盡」狀態：灰底可選，區分真實過期',
      '備盤頁新增多人編輯互斥鎖（防覆蓋保護）',
      '歷史備盤按鈕移至 header，編輯中也可查詢',
      '盤點 productId 映射修正（歷史資料補修）',
      '測試站新增開發者面板：重置今日備盤、終極清理、時間旅行（日期模擬）',
    ]
  }
  // 未來新版本往上加
];

const STAFF_LIST = [
  'Ally','Sunny','Linkin','Alvin','Rina','Cara','Lauren',
  'Harvey','Linda','Windy','Irene','Tini','Gordon',
  'Wilson','Corrine','Xuan','Yvette',
];

const PRODUCTS = [
  // ── 培養液（8 項）──
  { id:'givf',     name:'G-IVF',               vendor:'亞樸', unit:'瓶', group:'培養液', gtin:'07350025910550', brand:'Vitrolife',  gupanId:'m-givf',   target:2, reorderQty:10,  bottleVol:60,   openExpiryDays:7,    needQC:false, location:'培養箱', orderNote:null },
  { id:'gxtl',     name:'GxTL',                vendor:'亞樸', unit:'瓶', group:'培養液', gtin:'07350025910611', brand:'Vitrolife',  gupanId:'m-gxtl',   target:2, reorderQty:8,   bottleVol:30,   openExpiryDays:7,    needQC:false, location:'培養箱', orderNote:null },
  { id:'glue',     name:'EmbryoGlue',           vendor:'亞樸', unit:'瓶', group:'培養液', gtin:'07350025910048', brand:'Vitrolife',  gupanId:'m-glue',   target:2, reorderQty:10,   bottleVol:10,   openExpiryDays:14,   needQC:false, location:'培養箱', orderNote:null },
  { id:'h5gt',     name:'H5GT',                vendor:'弘優', unit:'瓶', group:'培養液', gtin:'00888937029147', brand:'LifeGlobal',    gupanId:'m-h5gt',   target:2, reorderQty:8,   bottleVol:30,   openExpiryDays:7,    needQC:false, location:'培養箱', orderNote:null },
  { id:'aoa-ci',   name:'AOA 弘優 CI',         vendor:'弘優', unit:'瓶', group:'培養液', gtin:'04582231465118', brand:null,         gupanId:'m-aoa-ci', target:1, reorderQty:3,   bottleVol:10,   openExpiryDays:14,   needQC:false, location:'培養箱', orderNote:null },
  { id:'aoa-508',  name:'AOA 明美 GM508',      vendor:'明美', unit:'罐', group:'培養液', gtin:'04260173184043', brand:null,         gupanId:'f-508',    target:2, reorderQty:4,   bottleVol:null, openExpiryDays:7,    needQC:false, location:'冰箱',   orderNote:null, expiryWarnDays:30 },
  { id:'hepes',    name:'HEPES',               vendor:'億宸', unit:'瓶', group:'培養液', gtin:'00888937818314', brand:null,         gupanId:'f-hepes',  target:4, reorderQty:30,  bottleVol:null, openExpiryDays:null, needQC:false, location:'冰箱',   orderNote:null },
  { id:'oil',      name:'Heavy Oil',            vendor:'億宸', unit:'瓶', group:'培養液', gtin:'05411967001224', brand:null,         gupanId:'f-oil',    target:3, reorderQty:30,  bottleVol:null, openExpiryDays:null, needQC:false, location:'冰箱',   orderNote:null },

  // ── 試劑（16 項，含 102-mm）──
  { id:'pvp',      name:'PVP',                vendor:'億宸', unit:'組', group:'試劑',   gtin:'20888937818813', brand:null, gupanId:'f-pvp',    target:1, reorderQty:8,   bottleVol:null, openExpiryDays:null, needQC:false, location:'冰箱',   orderNote:'1 盒 = 6 管' },
  { id:'cumulase', name:'Cumulase',            vendor:'億宸', unit:'組', group:'試劑',   gtin:'20888937817977', brand:null, gupanId:'f-cum',    target:1, reorderQty:10,  bottleVol:null, openExpiryDays:null, needQC:false, location:'冰箱',   orderNote:'1 盒 = 5 管' },
  { id:'fertipro', name:'Fertipro',            vendor:'億宸', unit:'瓶', group:'試劑',   gtin:'05411987000722', brand:null, gupanId:'s-fert',   target:1, reorderQty:7,   bottleVol:null, openExpiryDays:null, needQC:false, location:'精蟲室', orderNote:null },
  { id:'spermfr',  name:'Sperm Freeze (Origio)',vendor:'億宸',unit:'瓶', group:'試劑',   gtin:'00888937800661', brand:null, gupanId:'s-sf',     target:1, reorderQty:2,   bottleVol:null, openExpiryDays:null, needQC:false, location:'精蟲室', orderNote:null },
  { id:'601',      name:'601',                vendor:'弘優', unit:'套', group:'試劑',   gtin:null,             brand:null, gupanId:null,       target:null, reorderQty:null, bottleVol:null, openExpiryDays:null, needQC:false, location:null,   orderNote:null, hidden:true },
  { id:'602',      name:'602',                vendor:'弘優', unit:'套', group:'試劑',   gtin:'14582231460691', brand:null, gupanId:'f-602',    target:2, reorderQty:3,   bottleVol:null, openExpiryDays:null, needQC:false, location:'冰箱',   orderNote:null, expiryWarnDays:30 },
  { id:'spas',     name:'S-PAS',              vendor:'弘優', unit:'盒', group:'試劑',   gtin:'14582231468048', brand:null, gupanId:'s-spas',   target:1, reorderQty:3,   bottleVol:null, openExpiryDays:null, needQC:false, location:'精蟲室', orderNote:null },
  { id:'101',      name:'101（磊柏）',          vendor:'磊柏', unit:'套', group:'試劑',   gtin:'04589700012163', brand:null, gupanId:'f-101',    target:2, reorderQty:120,  bottleVol:null, openExpiryDays:null, needQC:false, location:'冰箱',   orderNote:'亦可向明美訂購' },
  { id:'102',      name:'102（磊柏）',          vendor:'磊柏', unit:'盒', group:'試劑',   gtin:'04589700012200', brand:null, gupanId:'f-102',    target:2, reorderQty:100,  bottleVol:null, openExpiryDays:null, needQC:true,  location:'冰箱',   orderNote:'月點料 · 亦可向明美訂購' },
  { id:'102-mm',   name:'102（明美）',          vendor:'明美', unit:'盒', group:'試劑',   gtin:'04589700012200', brand:null, gupanId:'f-102-mm', target:2, reorderQty:null,  bottleVol:null, openExpiryDays:null, needQC:true,  location:'冰箱',   orderNote:'月點料 · 亦可向磊柏訂購' },
  { id:'tyb',      name:'TYB',               vendor:'磊柏', unit:'盒', group:'試劑',   gtin:'00893727002217', brand:null, gupanId:'s-tyb',    target:1, reorderQty:1,   bottleVol:null, openExpiryDays:null, needQC:false, location:'精蟲室', orderNote:'1 盒 = 20 小瓶' },
  { id:'brightv',  name:'BrightVit',           vendor:'磊柏', unit:'個', group:'試劑',   gtin:null,             brand:null, gupanId:null,       target:null, reorderQty:null, bottleVol:null, openExpiryDays:null, needQC:false, location:null,   orderNote:null, hidden:true },
  { id:'mountgl',  name:'Mounting Glue',       vendor:'磊柏', unit:'瓶', group:'試劑',   gtin:null,             brand:null, gupanId:'s-mg',     target:1, reorderQty:1,   bottleVol:null, openExpiryDays:null, needQC:false, location:'精蟲室', orderNote:'至少 1/2 瓶' },
  { id:'gm501',    name:'GM501 (SpermMobil)',  vendor:'明美', unit:'瓶', group:'試劑',   gtin:'04260173193978', brand:null, gupanId:'f-gm501',  target:1, reorderQty:2,   bottleVol:null, openExpiryDays:null, needQC:false, location:'冰箱',   orderNote:null, expiryWarnDays:30 },
  { id:'pure100',  name:'Pure 100',            vendor:'明美', unit:'個', group:'試劑',   gtin:'07350025610030', brand:null, gupanId:'s-pure',   target:2, reorderQty:8,   bottleVol:null, openExpiryDays:null, needQC:false, location:'精蟲室', orderNote:null },
  { id:'110',      name:'110',               vendor:'明美', unit:'套', group:'試劑',   gtin:'04589700012217', brand:null, gupanId:'f-110',    target:2, reorderQty:5,  bottleVol:null, openExpiryDays:null, needQC:false, location:'冰箱',   orderNote:null },

  // ── 耗材（23 項）──
  { id:'toptip-y', name:'Top tips（黃）',      vendor:'弘優', unit:'盒', group:'耗材',   gtin:'14582231460929', brand:null, gupanId:'c1-ty',    target:2, reorderQty:30,  bottleVol:null, openExpiryDays:null, needQC:false, location:'櫃1',    orderNote:'10 支/盒' },
  { id:'toptip-g', name:'Top tips（綠）',      vendor:'弘優', unit:'盒', group:'耗材',   gtin:'14582231460882', brand:null, gupanId:'c1-tg',    target:2, reorderQty:30,  bottleVol:null, openExpiryDays:null, needQC:false, location:'櫃1',    orderNote:'10 支/盒' },
  { id:'toptip-r', name:'Top tips（紅）',      vendor:'弘優', unit:'盒', group:'耗材',   gtin:'14582231460899', brand:null, gupanId:'c1-tr',    target:2, reorderQty:30,  bottleVol:null, openExpiryDays:null, needQC:false, location:'櫃1',    orderNote:'10 支/盒' },
  { id:'toptip-b', name:'Top tips（藍）',      vendor:'弘優', unit:'盒', group:'耗材',   gtin:'14582231460912', brand:null, gupanId:'c1-tb',    target:2, reorderQty:30,  bottleVol:null, openExpiryDays:null, needQC:false, location:'櫃1',    orderNote:'10 支/盒' },
  { id:'toptip-w', name:'Top tips（白）',      vendor:'弘優', unit:'盒', group:'耗材',   gtin:'14582231460905', brand:null, gupanId:'c1-tw',    target:2, reorderQty:30,  bottleVol:null, openExpiryDays:null, needQC:false, location:'櫃1',    orderNote:'10 支/盒' },
  { id:'riez135',  name:'RI-EZ tip 135',      vendor:'弘優', unit:'盒', group:'耗材',   gtin:'05060488047060', brand:null, gupanId:'c2-135',   target:2, reorderQty:2,   bottleVol:null, openExpiryDays:null, needQC:false, location:'櫃2',    orderNote:null, paused:true },
  { id:'riez145',  name:'RI-EZ tip 145',      vendor:'弘優', unit:'盒', group:'耗材',   gtin:'05060170181478', brand:null, gupanId:'c2-145',   target:2, reorderQty:2,   bottleVol:null, openExpiryDays:null, needQC:false, location:'櫃2',    orderNote:null, paused:true },
  { id:'riez200',  name:'RI-EZ tip 200',      vendor:'弘優', unit:'盒', group:'耗材',   gtin:null,             brand:null, gupanId:'c2-200',   target:2, reorderQty:1,   bottleVol:null, openExpiryDays:null, needQC:false, location:'櫃2',    orderNote:null, paused:true },
  { id:'vltip135', name:'VL-tip 135',           vendor:'亞樸', unit:'盒', group:'耗材',   gtin:null,             brand:null, gupanId:'c2-vl135', target:2, reorderQty:3,   bottleVol:null, openExpiryDays:null, needQC:false, location:'櫃2',    orderNote:null },
  { id:'vltip145', name:'VL-tip 145',           vendor:'亞樸', unit:'盒', group:'耗材',   gtin:null,             brand:null, gupanId:'c2-vl145', target:2, reorderQty:3,   bottleVol:null, openExpiryDays:null, needQC:false, location:'櫃2',    orderNote:null },
  { id:'vltip200', name:'VL-tip 200',           vendor:'亞樸', unit:'盒', group:'耗材',   gtin:null,             brand:null, gupanId:'c2-vl200', target:2, reorderQty:3,   bottleVol:null, openExpiryDays:null, needQC:false, location:'櫃2',    orderNote:null },
  { id:'6well',    name:'6 Well dish',         vendor:'弘優', unit:'包', group:'耗材',   gtin:'04582231462414', brand:null, gupanId:'c1-6w',    target:4, reorderQty:24,  bottleVol:null, openExpiryDays:null, needQC:false, location:'櫃1',    orderNote:null },
  { id:'mouth',    name:'Mouth piece',         vendor:'弘優', unit:'包', group:'耗材',   gtin:'04582231461103', brand:null, gupanId:'b-mp',     target:1, reorderQty:null, bottleVol:null, openExpiryDays:null, needQC:false, location:'半年一次', orderNote:'依人數，半年一次' },
  { id:'oosafe-c', name:'Oosafe（培養箱用）',  vendor:'弘優', unit:'罐', group:'耗材',   gtin:null,             brand:null, gupanId:'r-os1',    target:1, reorderQty:null, bottleVol:null, openExpiryDays:null, needQC:false, location:'需要再叫', orderNote:null },
  { id:'oosafe-f', name:'Oosafe（地板用）',    vendor:'弘優', unit:'罐', group:'耗材',   gtin:null,             brand:null, gupanId:'r-os2',    target:1, reorderQty:null, bottleVol:null, openExpiryDays:null, needQC:false, location:'需要再叫', orderNote:null },
  { id:'3well',    name:'3 well dish',         vendor:'磊柏', unit:'包', group:'耗材',   gtin:'04589700012125', brand:null, gupanId:'c1-3w',    target:3, reorderQty:24,  bottleVol:null, openExpiryDays:null, needQC:false, location:'櫃1',    orderNote:null },
  { id:'phsensor', name:'pH sensor dish',      vendor:'磊柏', unit:'包', group:'耗材',   gtin:null,             brand:null, gupanId:null,       target:null, reorderQty:null, bottleVol:null, openExpiryDays:null, needQC:false, location:null,   orderNote:null, hidden:true },
  { id:'geridish', name:'Geri dish',           vendor:'磊柏', unit:'盒', group:'耗材',   gtin:'19348265003014', brand:null, gupanId:'c3-gd',    target:2, reorderQty:20,  bottleVol:null, openExpiryDays:null, needQC:false, location:'櫃3',    orderNote:'20 個/盒' },
  { id:'geriwat',  name:'Geri water bottle',   vendor:'磊柏', unit:'盒', group:'耗材',   gtin:'19348265003045', brand:null, gupanId:'c3-gw',    target:2, reorderQty:12,   bottleVol:null, openExpiryDays:null, needQC:false, location:'櫃3',    orderNote:'12 個/盒' },
  { id:'gerifl',   name:'Geri filter',         vendor:'磊柏', unit:'盒', group:'耗材',   gtin:null,             brand:null, gupanId:'c3-gf',    target:1, reorderQty:1,   bottleVol:null, openExpiryDays:null, needQC:false, location:'櫃3',    orderNote:'50 個/盒' },
  { id:'coda',     name:'Coda Filter K-730',   vendor:'磊柏', unit:'個', group:'耗材',   gtin:null,             brand:null, gupanId:'b-cf',     target:2, reorderQty:3,   bottleVol:null, openExpiryDays:null, needQC:false, location:'半年一次', orderNote:'半年一次' },
  { id:'oritip135',name:'Origio tip 135',     vendor:'億宸', unit:'管', group:'耗材',   gtin:null,             brand:null, gupanId:null,       target:null, reorderQty:null, bottleVol:null, openExpiryDays:null, needQC:false, location:null,   orderNote:null, hidden:true },
  { id:'oritip150',name:'Origio tip 150',     vendor:'億宸', unit:'管', group:'耗材',   gtin:null,             brand:null, gupanId:null,       target:null, reorderQty:null, bottleVol:null, openExpiryDays:null, needQC:false, location:null,   orderNote:null, hidden:true },
  { id:'orifl',    name:'Origio Filter',       vendor:'億宸', unit:'個', group:'耗材',   gtin:'0888937014693',  brand:null, gupanId:'b-of',     target:2, reorderQty:10,  bottleVol:null, openExpiryDays:null, needQC:false, location:'半年一次', orderNote:'半年一次' },
  { id:'glasspip', name:'玻璃 pipette',        vendor:'億宸', unit:'箱', group:'耗材',   gtin:null,             brand:null, gupanId:null,       target:null, reorderQty:null, bottleVol:null, openExpiryDays:null, needQC:false, location:null,   orderNote:null, hidden:true },
  { id:'cellvis',  name:'Cellvis spindle dish',vendor:'岑祥', unit:'箱', group:'耗材',   gtin:null,             brand:null, gupanId:null,       target:null, reorderQty:null, bottleVol:null, openExpiryDays:null, needQC:false, location:null,   orderNote:null, hidden:true },
];

const VENDORS = ['亞樸','弘優','億宸','磊柏','明美','岑祥'];

// Phase 4D QC 追蹤：由 needQC 欄位自動產生，取代硬寫清單
const REQUIRE_QC_ITEMS = PRODUCTS.filter(p => p.needQC).map(p => p.id);
// 結果：['102', '102-mm']

const PRODUCT_MAP = Object.fromEntries(PRODUCTS.map(p => [p.id, p]));

// gupanId 快查 Map（kucun.html pandian/order 查找用）
const GUPAN_MAP = Object.fromEntries(
  PRODUCTS.filter(p => p.gupanId).map(p => [p.gupanId, p])
);

// 共用的寫入異動日誌函數
function appendKucunLog(entries) {
  try {
    const cl = JSON.parse(localStorage.getItem('kucun-changelog') || '[]');
    const now = new Date().toISOString();
    entries.forEach(e => {
      cl.push({ id: Date.now().toString(36) + Math.random().toString(36).slice(2,6), ts: now, ...e });
    });
    localStorage.setItem('kucun-changelog', JSON.stringify(cl));
  } catch(err) { console.warn('kucun-changelog write failed', err); }
}

window.openChangelogModal = function() {
  let modal = document.getElementById('changelog-modal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'changelog-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:99998;display:flex;align-items:center;justify-content:center;padding:16px;backdrop-filter:blur(2px)';
    modal.onclick = function(e) { if (e.target === modal) modal.style.display = 'none'; };

    const card = document.createElement('div');
    card.style.cssText = 'background:white;border-radius:16px;width:100%;max-width:480px;max-height:80vh;overflow-y:auto;padding:24px;box-shadow:0 20px 60px rgba(0,0,0,.2)';

    const rows = CHANGELOG.map(v => `
      <div style="margin-bottom:20px">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
          <span style="font-size:15px;font-weight:700;color:#1e293b">Version ${v.version}</span>
          <span style="font-size:12px;color:#94a3b8">${v.date}</span>
        </div>
        <ul style="margin:0;padding-left:18px;color:#475569;font-size:13px;line-height:1.8">
          ${v.changes.map(c => `<li style="margin-bottom:4px">${c}</li>`).join('')}
        </ul>
      </div>`).join('');

    card.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">
        <h2 style="margin:0;font-size:17px;font-weight:700;color:#0f172a">📋 更新紀錄</h2>
        <button onclick="document.getElementById('changelog-modal').style.display='none'"
          style="background:none;border:none;cursor:pointer;font-size:20px;color:#94a3b8;line-height:1">✕</button>
      </div>
      ${rows}
      <button onclick="document.getElementById('changelog-modal').style.display='none'"
        style="width:100%;padding:10px;background:#f1f5f9;border:none;border-radius:10px;cursor:pointer;font-size:14px;font-weight:600;color:#475569;margin-top:10px">
        了解
      </button>`;
    modal.appendChild(card);
    document.body.appendChild(modal);
  } else {
    modal.style.display = 'flex';
  }
};

(function checkVersion() {
  window.addEventListener('DOMContentLoaded', function() {
    // 1. 版本更新 Banner
    const stored = localStorage.getItem('app-version');
    if (stored !== APP_VERSION) {
      const bar = document.createElement('div');
      bar.id = 'version-update-bar';
      bar.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:99999;background:#FEF08A;color:#713F12;padding:10px 16px;font-size:13px;font-weight:600;display:flex;align-items:center;justify-content:space-between;gap:8px;box-shadow:0 2px 8px rgba(0,0,0,.15)';
      bar.innerHTML = `<span>✨ 系統已更新至 Version ${APP_VERSION}，建議重新載入以確保資料正確</span>
        <div style="display:flex;align-items:center;gap:8px;">
          <button onclick="localStorage.setItem('app-version','${APP_VERSION}');localStorage.setItem('show-changelog','1');location.reload(true)" style="background:#92400E;color:white;border:none;border-radius:6px;padding:4px 12px;font-size:12px;cursor:pointer;white-space:nowrap">立即更新</button>
          <button onclick="localStorage.setItem('app-version','${APP_VERSION}');this.parentElement.parentElement.remove()" style="background:none;border:none;cursor:pointer;font-size:16px;padding:0 4px;color:#713F12" title="暫時忽略">✕</button>
        </div>`;
      document.body.prepend(bar);
    }

    // 2. 重整後自動開 Changelog Modal
    if (localStorage.getItem('show-changelog') === '1') {
      localStorage.removeItem('show-changelog');
      window.openChangelogModal();
    }

    // 3. 側邊欄注入版本號按鈕
    document.querySelectorAll('.mt-auto').forEach(block => {
      if (block.querySelector('#sidebar-version-btn')) return;
      const btn = document.createElement('button');
      btn.id = 'sidebar-version-btn';
      btn.onclick = window.openChangelogModal;
      btn.style.cssText = 'width:100%;text-align:left;background:none;border:none;cursor:pointer;padding:6px 12px;font-size:11px;color:#94a3b8;font-family:monospace;letter-spacing:.05em;border-radius:8px;transition:color .15s;margin-bottom:6px';
      btn.onmouseover = () => btn.style.color = '#64748b';
      btn.onmouseout  = () => btn.style.color = '#94a3b8';
      btn.textContent = `Version ${APP_VERSION}`;
      block.insertBefore(btn, block.firstChild);
    });
  });
})();
