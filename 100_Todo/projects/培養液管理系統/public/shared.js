// shared.js — 品項主檔、共用函數
// 所有 HTML 頁面引用此檔，禁止在各頁面重複定義

const APP_VERSION = '26.09.20e'; // 格式：YY.MM.DD

const CHANGELOG = [
  {
    version: '26.09.20e',
    date: '2026-09-20',
    changes: [
      '【新功能】備盤草稿改成雲端同步，換一台電腦操作也看得到前一位已經填好的內容，不用重填（畫面右上角會顯示「自動儲存 HH:MM」）',
    ],
  },
  {
    version: '26.09.20d',
    date: '2026-09-20',
    changes: [
      '【新功能】後台新增「彈性供應商」設定，同品項有第二家廠商彈性供貨、不需要預估庫存時可以勾選，訂貨管理頁會改顯示「彈性進貨」，不再被誤判成缺貨（首先套用在 102 解凍液的明美這邊）',
      '【修正】101 冷凍試劑條碼更新為廠商新包裝的條碼，重新可以正常掃碼辨識',
    ],
  },
  {
    version: '26.09.20c',
    date: '2026-09-20',
    changes: [
      '【修正】Gx-IVF 改名後，補上系統中殘留的「G-IVF」舊名稱顯示文字（後台盤子清單、估盤/備盤盤子名稱等）',
    ],
  },
  {
    version: '26.09.20b',
    date: '2026-09-20',
    changes: [
      '【新功能】G-IVF 更名為 Gx-IVF（廠商已停產舊品，全面改用新款培養液）',
    ],
  },
  {
    version: '26.09.20',
    date: '2026-09-20',
    changes: [
      '【修正】後台修改品項「品牌」欄位時，若清空存檔會正確存回未設定狀態，避免品項在訂貨管理頁面消失不見',
      '【修正】備盤頁計算未開封瓶數時，若剛好遇到「作廢重複入庫」且該批已經開封過，不會再誤將已開封的瓶數還原回庫存',
    ],
  },
  {
    version: '26.08.31b',
    date: '2026-08-31',
    changes: [
      '【新功能】訂貨管理的月使用量，非備盤品項（101、102、Top tips、Geri dish 等）現在也能看到近三次盤點的用量趨勢，不再只有單一數字',
    ],
  },
  {
    version: '26.08.31',
    date: '2026-08-31',
    changes: [
      '【修正】Oil／HEPES 的庫存數字，確實反映每天備盤扣除量',
    ],
  },
  {
    version: '26.08.24',
    date: '2026-08-24',
    changes: [
      '【修正】備盤頁面切換分頁再切回來時，Oil / HEPES 今日開封數量不會再被清空',
    ],
  },
  {
    version: '26.08.23',
    date: '2026-08-23',
    changes: [
      '【修正】備盤送出時，若系統偵測到批號資料讀取異常（筆數明顯偏少），會跳出警告視窗，避免誤送出不完整的資料',
    ],
  },
  {
    version: '26.07.27',
    date: '2026-07-27',
    changes: [
      '【優化】訂貨管理「月使用量」拿掉三時段趨勢細節，改回單一數字，畫面更清爽',
      '【新功能】PVP、Cumulase、Top tips 等不走備盤流程的試劑耗材，現在也能看到「月使用量」（改用近期多次盤點的平均值推算），庫存總覽跟訂貨管理都補齊',
      '【調整】人員名單新增 Tiffany',
    ],
  },
  {
    version: '26.07.26',
    date: '2026-07-26',
    changes: [
      '【修正】盤點完成後，庫存總覽的批號明細不會再短暫顯示錯誤（已過期或已用完的舊批號金額卡住不動），已知曉此問題並修正',
      '【優化】「期間估計用量」與「預計可撐天數」改用近 30 天實際消耗紀錄計算，不再受盤點頻率影響，數字更穩定',
      '【新功能】訂貨管理新增「月使用量」「應有效期與瓶數」欄位，不用再切換到庫存總覽查詢',
      '【新功能】每月 1 號自動寄送「近三個月用量報表」信件',
    ],
  },
  {
    version: '26.07.23',
    date: '2026-07-23',
    changes: [
      '【修正】進貨掃碼後，對應的訂單「待收任務」現在會正確顯示已收到，不再卡在待收清單',
      '【修正】庫存總覽的「缺貨警示」數量，不再把已標記「暫停進貨」的品項算進去',
      '【修正】進貨送出過程中若遇到斷網或中途重新整理頁面，暫存匣會安全還原並提示重新確認，不會造成重複的進貨紀錄',
    ],
  },
  {
    version: '26.07.15',
    date: '2026-07-15',
    changes: [
      '【優化】測試站「⚠️ 測試模式」提示改放到側邊欄版本號上方，不再擋住頁面頂端排版',
      '【優化】明日備盤頁的測試工具（模擬日期、重置今日備盤、終極清理）一併收進側邊欄測試提示框',
      '【新功能】明日估盤、庫存總覽頁也支援「模擬日期」，跟備盤頁共用同一組模擬時間，測試站演示可依同一虛擬日期串起估盤 → 備盤 → 庫存流程',
    ],
  },
  {
    version: '26.06.26f',
    date: '2026-06-26',
    changes: [
      '【優化】更新紀錄：預設顯示近 30 天，可自由調整時間範圍；查詢 90 天以內為瞬間切換，超過 90 天才重新向資料庫抓取',
    ],
  },
  {
    version: '26.06.26',
    date: '2026-06-26',
    changes: [
      '【新功能】過期批號新增「🗑️ 報廢」快捷按鈕，搭配新的「🗑️ 待報廢」KPI 卡片，可一鍵完成報廢登記',
      '【新功能】每日警示 Email 新增「待報廢」通報，帳面未歸零就每天提醒，完成報廢後自動停止',
      '【修正】借出與還入現在正確計入庫存總計，備盤頁面批號數量同步反映',
      '【修正】完成操作後 KPI 數字即時更新、抽屜即時同步，不再需要重整頁面',
      '【修正】備盤草稿修正：外部異動後重整頁面，批號數量正確反映最新狀態',
      '【優化】手動登記日期固定為今天，防止回填日期導致庫存計算錯誤',
    ],
  },
  {
    version: '26.06.25b',
    date: '2026-06-25',
    changes: [
      '【修正】庫存：修正庫存總覽待收貨數字未扣除已取消訂單（cancelledQty）的問題，取消待收後 KPI 現在會正確下降',
      '【優化】進貨：收貨與作廢時改為優先從 Firebase 抓取最新訂單狀態，避免多裝置操作時本地快取不同步導致已收數量卡在 0 的問題',
      '【新功能】庫存：手動紀錄新增「借出（−）」與「還入（+）」動作類型，可記錄借用給其他診間或歸還的庫存異動',
    ],
  },
  {
    version: '26.06.22',
    date: '2026-06-22',
    changes: [
      '【修正】庫存：培養液瓶數計算邏輯修正，現在只計算全新未開封的瓶數，不再把正在使用中的殘液瓶算入庫存',
      '【修正】庫存：批號明細、估計用量、Days of Inventory 一併修正，三者數字現在保持一致',
      '【資料校正】G-IVF：06-13 空白備盤導致 06-14 系統多算 7 瓶，已透過 kucun_changelog 手動校正 -7 瓶',
      '【資料校正】EmbryoGlue：06-10、06-13 空白備盤導致系統多算 1 瓶，已透過 kucun_changelog 手動校正 -1 瓶',
    ],
  },
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
  'Ally','Sunny','Linkin','Alvin','Rina','Cara','Tiffany','Lauren',
  'Harvey','Linda','Windy','Irene','Tini','Gordon',
  'Wilson','Corrine','Xuan','Yvette',
];

const PRODUCTS = [
  // ── 培養液（8 項）──
  { id:'givf',     name:'Gx-IVF',               vendor:'亞樸', unit:'瓶', group:'培養液', gtin:'07350025910604', brand:'Vitrolife',  gupanId:'m-givf',   target:2, reorderQty:10,  bottleVol:60,   openExpiryDays:7,    needQC:false, location:'培養箱', orderNote:null, sortOrder:1 },
  { id:'gxtl',     name:'GxTL',                vendor:'亞樸', unit:'瓶', group:'培養液', gtin:'07350025910611', brand:'Vitrolife',  gupanId:'m-gxtl',   target:2, reorderQty:8,   bottleVol:30,   openExpiryDays:7,    needQC:false, location:'培養箱', orderNote:null, sortOrder:2 },
  { id:'glue',     name:'EmbryoGlue',           vendor:'亞樸', unit:'瓶', group:'培養液', gtin:'07350025910048', brand:'Vitrolife',  gupanId:'m-glue',   target:2, reorderQty:10,   bottleVol:10,   openExpiryDays:14,   needQC:false, location:'培養箱', orderNote:null, sortOrder:3 },
  { id:'h5gt',     name:'H5GT',                vendor:'弘優', unit:'瓶', group:'培養液', gtin:'00888937029147', brand:'LifeGlobal',    gupanId:'m-h5gt',   target:2, reorderQty:8,   bottleVol:30,   openExpiryDays:7,    needQC:false, location:'培養箱', orderNote:null, sortOrder:1 },
  { id:'aoa-ci',   name:'AOA 弘優 CI',         vendor:'弘優', unit:'瓶', group:'培養液', gtin:'04582231465118', brand:null,         gupanId:'m-aoa-ci', target:1, reorderQty:3,   bottleVol:10,   openExpiryDays:14,   needQC:false, location:'培養箱', orderNote:null, sortOrder:9 },
  { id:'aoa-508',  name:'AOA 明美 GM508',      vendor:'明美', unit:'罐', group:'培養液', gtin:'04260173184043', brand:null,         gupanId:'f-508',    target:2, reorderQty:4,   bottleVol:1, openExpiryDays:7,    needQC:false, location:'冰箱',   orderNote:null, expiryWarnDays:30, sortOrder:10 },
  { id:'hepes',    name:'HEPES',               vendor:'億宸', unit:'瓶', group:'培養液', gtin:'00888937818314', brand:null,         gupanId:'f-hepes',  target:4, reorderQty:30,  bottleVol:null, openExpiryDays:null, needQC:false, location:'冰箱',   orderNote:null, sortOrder:5 },
  { id:'oil',      name:'Heavy Oil',            vendor:'億宸', unit:'瓶', group:'培養液', gtin:'05411967001224', brand:null,         gupanId:'f-oil',    target:3, reorderQty:30,  bottleVol:null, openExpiryDays:null, needQC:false, location:'冰箱',   orderNote:null, sortOrder:6 },

  // ── 試劑（16 項，含 102-mm）──
  { id:'pvp',      name:'PVP',                vendor:'億宸', unit:'組', group:'試劑',   gtin:'20888937818813', brand:null, gupanId:'f-pvp',    target:1, reorderQty:8,   bottleVol:null, openExpiryDays:null, needQC:false, location:'冰箱',   orderNote:'1 盒 = 6 管', sortOrder:7 },
  { id:'cumulase', name:'Cumulase',            vendor:'億宸', unit:'組', group:'試劑',   gtin:'20888937817977', brand:null, gupanId:'f-cum',    target:1, reorderQty:10,  bottleVol:null, openExpiryDays:null, needQC:false, location:'冰箱',   orderNote:'1 盒 = 5 管', sortOrder:8 },
  { id:'fertipro', name:'Fertipro',            vendor:'億宸', unit:'瓶', group:'試劑',   gtin:'05411987000722', brand:null, gupanId:'s-fert',   target:1, reorderQty:7,   bottleVol:null, openExpiryDays:null, needQC:false, location:'精蟲室', orderNote:null, sortOrder:1 },
  { id:'spermfr',  name:'Sperm Freeze (Origio)',vendor:'億宸',unit:'瓶', group:'試劑',   gtin:'00888937800661', brand:null, gupanId:'s-sf',     target:1, reorderQty:2,   bottleVol:null, openExpiryDays:null, needQC:false, location:'精蟲室', orderNote:null, sortOrder:2 },
  { id:'601',      name:'601',                vendor:'弘優', unit:'套', group:'試劑',   gtin:null,             brand:null, gupanId:null,       target:null, reorderQty:null, bottleVol:null, openExpiryDays:null, needQC:false, location:null,   orderNote:null, hidden:true },
  { id:'602',      name:'602',                vendor:'弘優', unit:'套', group:'試劑',   gtin:'14582231460691', brand:null, gupanId:'f-602',    target:2, reorderQty:3,   bottleVol:null, openExpiryDays:null, needQC:false, location:'冰箱',   orderNote:null, expiryWarnDays:30, sortOrder:12 },
  { id:'spas',     name:'S-PAS',              vendor:'弘優', unit:'盒', group:'試劑',   gtin:'14582231468048', brand:null, gupanId:'s-spas',   target:1, reorderQty:3,   bottleVol:null, openExpiryDays:null, needQC:false, location:'精蟲室', orderNote:null, sortOrder:3 },
  { id:'101',      name:'101（磊柏）',          vendor:'磊柏', unit:'套', group:'試劑',   gtin:'04589700012194', brand:null, gupanId:'f-101',    target:2, reorderQty:120,  bottleVol:null, openExpiryDays:null, needQC:false, location:'冰箱',   orderNote:'亦可向明美訂購', sortOrder:3 },
  { id:'102',      name:'102（磊柏）',          vendor:'磊柏', unit:'盒', group:'試劑',   gtin:'04589700012200', brand:null, gupanId:'f-102',    target:2, reorderQty:100,  bottleVol:null, openExpiryDays:null, needQC:true,  location:'冰箱',   orderNote:'月點料 · 亦可向明美訂購', sortOrder:2 },
  { id:'102-mm',   name:'102（明美）',          vendor:'明美', unit:'盒', group:'試劑',   gtin:'04589700012200', brand:null, gupanId:'f-102-mm', target:null, reorderQty:null,  bottleVol:null, openExpiryDays:null, needQC:true,  location:'冰箱',   orderNote:'月點料 · 亦可向磊柏訂購', sortOrder:1, noForecast:true },
  { id:'tyb',      name:'TYB',               vendor:'磊柏', unit:'盒', group:'試劑',   gtin:'00893727002217', brand:null, gupanId:'s-tyb',    target:1, reorderQty:1,   bottleVol:null, openExpiryDays:null, needQC:false, location:'精蟲室', orderNote:'1 盒 = 20 小瓶', sortOrder:4 },
  { id:'brightv',  name:'BrightVit',           vendor:'磊柏', unit:'個', group:'試劑',   gtin:null,             brand:null, gupanId:null,       target:null, reorderQty:null, bottleVol:null, openExpiryDays:null, needQC:false, location:null,   orderNote:null, hidden:true },
  { id:'mountgl',  name:'Mounting Glue',       vendor:'磊柏', unit:'瓶', group:'試劑',   gtin:null,             brand:null, gupanId:'s-mg',     target:1, reorderQty:1,   bottleVol:null, openExpiryDays:null, needQC:false, location:'精蟲室', orderNote:'至少 1/2 瓶', sortOrder:5 },
  { id:'gm501',    name:'GM501 (SpermMobil)',  vendor:'明美', unit:'瓶', group:'試劑',   gtin:'04260173193978', brand:null, gupanId:'f-gm501',  target:1, reorderQty:2,   bottleVol:null, openExpiryDays:null, needQC:false, location:'冰箱',   orderNote:null, expiryWarnDays:30, sortOrder:11 },
  { id:'pure100',  name:'Pure 100',            vendor:'明美', unit:'個', group:'試劑',   gtin:'07350025610030', brand:null, gupanId:'s-pure',   target:2, reorderQty:8,   bottleVol:null, openExpiryDays:null, needQC:false, location:'精蟲室', orderNote:null, sortOrder:6 },
  { id:'110',      name:'110',               vendor:'明美', unit:'套', group:'試劑',   gtin:'04589700012217', brand:null, gupanId:'f-110',    target:2, reorderQty:5,  bottleVol:null, openExpiryDays:null, needQC:false, location:'冰箱',   orderNote:null, sortOrder:4 },

  // ── 耗材（23 項）──
  { id:'toptip-y', name:'Top tips（黃）',      vendor:'弘優', unit:'盒', group:'耗材',   gtin:'14582231460929', brand:null, gupanId:'c1-ty',    target:2, reorderQty:30,  bottleVol:null, openExpiryDays:null, needQC:false, location:'櫃1',    orderNote:'10 支/盒', sortOrder:1 },
  { id:'toptip-g', name:'Top tips（綠）',      vendor:'弘優', unit:'盒', group:'耗材',   gtin:'14582231460882', brand:null, gupanId:'c1-tg',    target:2, reorderQty:30,  bottleVol:null, openExpiryDays:null, needQC:false, location:'櫃1',    orderNote:'10 支/盒', sortOrder:2 },
  { id:'toptip-r', name:'Top tips（紅）',      vendor:'弘優', unit:'盒', group:'耗材',   gtin:'14582231460899', brand:null, gupanId:'c1-tr',    target:2, reorderQty:30,  bottleVol:null, openExpiryDays:null, needQC:false, location:'櫃1',    orderNote:'10 支/盒', sortOrder:3 },
  { id:'toptip-b', name:'Top tips（藍）',      vendor:'弘優', unit:'盒', group:'耗材',   gtin:'14582231460912', brand:null, gupanId:'c1-tb',    target:2, reorderQty:30,  bottleVol:null, openExpiryDays:null, needQC:false, location:'櫃1',    orderNote:'10 支/盒', sortOrder:4 },
  { id:'toptip-w', name:'Top tips（白）',      vendor:'弘優', unit:'盒', group:'耗材',   gtin:'14582231460905', brand:null, gupanId:'c1-tw',    target:2, reorderQty:30,  bottleVol:null, openExpiryDays:null, needQC:false, location:'櫃1',    orderNote:'10 支/盒', sortOrder:5 },
  { id:'riez135',  name:'RI-EZ tip 135',      vendor:'弘優', unit:'盒', group:'耗材',   gtin:'05060488047060', brand:null, gupanId:'c2-135',   target:2, reorderQty:2,   bottleVol:null, openExpiryDays:null, needQC:false, location:'櫃2',    orderNote:null, paused:true, sortOrder:1 },
  { id:'riez145',  name:'RI-EZ tip 145',      vendor:'弘優', unit:'盒', group:'耗材',   gtin:'05060170181478', brand:null, gupanId:'c2-145',   target:2, reorderQty:2,   bottleVol:null, openExpiryDays:null, needQC:false, location:'櫃2',    orderNote:null, paused:true, sortOrder:2 },
  { id:'riez200',  name:'RI-EZ tip 200',      vendor:'弘優', unit:'盒', group:'耗材',   gtin:null,             brand:null, gupanId:'c2-200',   target:2, reorderQty:1,   bottleVol:null, openExpiryDays:null, needQC:false, location:'櫃2',    orderNote:null, paused:true, sortOrder:3 },
  { id:'vltip135', name:'VL-tip 135',           vendor:'亞樸', unit:'盒', group:'耗材',   gtin:null,             brand:null, gupanId:'c2-vl135', target:2, reorderQty:3,   bottleVol:null, openExpiryDays:null, needQC:false, location:'櫃2',    orderNote:null, sortOrder:4 },
  { id:'vltip145', name:'VL-tip 145',           vendor:'亞樸', unit:'盒', group:'耗材',   gtin:null,             brand:null, gupanId:'c2-vl145', target:2, reorderQty:3,   bottleVol:null, openExpiryDays:null, needQC:false, location:'櫃2',    orderNote:null, sortOrder:5 },
  { id:'vltip200', name:'VL-tip 200',           vendor:'亞樸', unit:'盒', group:'耗材',   gtin:null,             brand:null, gupanId:'c2-vl200', target:0, reorderQty:3,   bottleVol:null, openExpiryDays:null, needQC:false, location:'櫃2',    orderNote:null, sortOrder:6 },
  { id:'6well',    name:'6 Well dish',         vendor:'弘優', unit:'包', group:'耗材',   gtin:'04582231462414', brand:null, gupanId:'c1-6w',    target:4, reorderQty:24,  bottleVol:null, openExpiryDays:null, needQC:false, location:'櫃1',    orderNote:null, sortOrder:6 },
  { id:'mouth',    name:'Mouth piece',         vendor:'弘優', unit:'包', group:'耗材',   gtin:'04582231461103', brand:null, gupanId:'b-mp',     target:1, reorderQty:null, bottleVol:null, openExpiryDays:null, needQC:false, location:'半年一次', orderNote:'依人數，半年一次', sortOrder:1 },
  { id:'oosafe-c', name:'Oosafe（培養箱用）',  vendor:'弘優', unit:'罐', group:'耗材',   gtin:null,             brand:null, gupanId:'r-os1',    target:1, reorderQty:null, bottleVol:null, openExpiryDays:null, needQC:false, location:'需要再叫', orderNote:null, sortOrder:1 },
  { id:'oosafe-f', name:'Oosafe（地板用）',    vendor:'弘優', unit:'罐', group:'耗材',   gtin:null,             brand:null, gupanId:'r-os2',    target:1, reorderQty:null, bottleVol:null, openExpiryDays:null, needQC:false, location:'需要再叫', orderNote:null, sortOrder:2 },
  { id:'3well',    name:'3 well dish',         vendor:'磊柏', unit:'包', group:'耗材',   gtin:'04589700012125', brand:null, gupanId:'c1-3w',    target:3, reorderQty:24,  bottleVol:null, openExpiryDays:null, needQC:false, location:'櫃1',    orderNote:null, sortOrder:7 },
  { id:'phsensor', name:'pH sensor dish',      vendor:'磊柏', unit:'包', group:'耗材',   gtin:null,             brand:null, gupanId:null,       target:null, reorderQty:null, bottleVol:null, openExpiryDays:null, needQC:false, location:null,   orderNote:null, hidden:true },
  { id:'geridish', name:'Geri dish',           vendor:'磊柏', unit:'盒', group:'耗材',   gtin:'19348265003014', brand:null, gupanId:'c3-gd',    target:2, reorderQty:20,  bottleVol:null, openExpiryDays:null, needQC:false, location:'櫃3',    orderNote:'20 個/盒', sortOrder:1 },
  { id:'geriwat',  name:'Geri water bottle',   vendor:'磊柏', unit:'盒', group:'耗材',   gtin:'19348265003045', brand:null, gupanId:'c3-gw',    target:2, reorderQty:12,   bottleVol:null, openExpiryDays:null, needQC:false, location:'櫃3',    orderNote:'12 個/盒', sortOrder:2 },
  { id:'gerifl',   name:'Geri filter',         vendor:'磊柏', unit:'盒', group:'耗材',   gtin:null,             brand:null, gupanId:'c3-gf',    target:1, reorderQty:1,   bottleVol:null, openExpiryDays:null, needQC:false, location:'櫃3',    orderNote:'50 個/盒', sortOrder:3 },
  { id:'coda',     name:'Coda Filter K-730',   vendor:'磊柏', unit:'個', group:'耗材',   gtin:null,             brand:null, gupanId:'b-cf',     target:3, reorderQty:3,   bottleVol:null, openExpiryDays:null, needQC:false, location:'半年一次', orderNote:'半年一次', sortOrder:2 },
  { id:'oritip135',name:'Origio tip 135',     vendor:'億宸', unit:'管', group:'耗材',   gtin:null,             brand:null, gupanId:null,       target:null, reorderQty:null, bottleVol:null, openExpiryDays:null, needQC:false, location:null,   orderNote:null, hidden:true },
  { id:'oritip150',name:'Origio tip 150',     vendor:'億宸', unit:'管', group:'耗材',   gtin:null,             brand:null, gupanId:null,       target:null, reorderQty:null, bottleVol:null, openExpiryDays:null, needQC:false, location:null,   orderNote:null, hidden:true },
  { id:'orifl',    name:'Origio Filter',       vendor:'億宸', unit:'個', group:'耗材',   gtin:'0888937014693',  brand:null, gupanId:'b-of',     target:2, reorderQty:10,  bottleVol:null, openExpiryDays:null, needQC:false, location:'半年一次', orderNote:'半年一次', sortOrder:3 },
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

// ── 品項主檔改用 Firestore products_config（Phase 3b）──
// 讀不到／空集合就完全不動，維持上面這份程式內建的 PRODUCTS 陣列與其衍生索引（現行正式站行為）。
// 讀到資料時「原地」改寫 PRODUCTS/PRODUCT_MAP/GUPAN_MAP/REQUIRE_QC_ITEMS 的內容（不是重新賦值整個變數），
// 這樣所有頁面裡任何時間點取得的 PRODUCTS/PRODUCT_MAP/GUPAN_MAP 參照都會自動看到最新內容。
function resolveProductsFromConfig(rows) {
  if (!rows || !rows.length) return false;
  const mapped = rows
    .filter(r => r.hidden !== true) // hidden 品項不進入前臺（比照原本 hidden:true 的用途）
    .map(r => ({
      id: r.id, name: r.name, vendor: r.vendor, unit: r.unit, group: r.group,
      gtin: r.gtin ?? null, brand: r.brand ?? null, gupanId: r.gupanId ?? null,
      target: r.target ?? null, reorderQty: r.reorderQty ?? null, bottleVol: r.bottleVol ?? null,
      openExpiryDays: r.expiry ?? null, needQC: !!r.needQC,
      location: r.location ?? null, orderNote: r.orderNote ?? null,
      paused: !!r.paused, expiryWarnDays: r.expiryWarnDays ?? undefined,
      pandianGroup: r.pandianGroup ?? null, sortOrder: r.sortOrder ?? null,
      noForecast: !!r.noForecast,
    }));

  PRODUCTS.length = 0;
  PRODUCTS.push(...mapped);

  Object.keys(PRODUCT_MAP).forEach(k => delete PRODUCT_MAP[k]);
  PRODUCTS.forEach(p => { PRODUCT_MAP[p.id] = p; });

  Object.keys(GUPAN_MAP).forEach(k => delete GUPAN_MAP[k]);
  PRODUCTS.filter(p => p.gupanId).forEach(p => { GUPAN_MAP[p.gupanId] = p; });

  REQUIRE_QC_ITEMS.length = 0;
  REQUIRE_QC_ITEMS.push(...PRODUCTS.filter(p => p.needQC).map(p => p.id));

  return true;
}

// vendors_config 文件 id 即廠商名稱，直接拿來取代 VENDORS 這份廠商名稱清單（原本只有 contact/leadtime 被搬過去，名稱清單本身沒有）
function resolveVendorsFromConfig(rows) {
  if (!rows || !rows.length) return false;
  VENDORS.length = 0;
  VENDORS.push(...rows.map(r => r.id));
  return true;
}

// ── 估盤建議公式求值（Phase 3：後臺可視化係數）──
// formula 形狀：{ fixed: number, coefs: { opu, te, szu, fbt, bt, tbx } }（欄位皆可省略，預設 0）
// 回傳：fixed + Σ(coefs[欄位] × taiVals[欄位])
function evalFormula(formula, taiVals) {
  if (!formula) return 0;
  let sum = formula.fixed || 0;
  Object.entries(formula.coefs || {}).forEach(([field, coef]) => {
    sum += (taiVals[field] || 0) * (coef || 0);
  });
  return sum;
}

// changelog 單筆時間戳記統一取值（ts 可能是 ISO 字串或 Firestore Timestamp）
function getLogTime(log) {
  return log.tsRaw || (typeof log.ts === 'string' ? log.ts : log.ts?.toDate?.().toISOString()) || '';
}

// ── 近 30 天滾動用量（用異動日誌加總，取代「兩次盤點/備盤差值 ÷ 間隔天數」的舊算法）──
// 舊算法（kucun.html 原 calcEstUsage）用兩個快照做差值，間隔天數不固定（1 天到 3 週都有可能），
// 單一離群值就會讓推算出的用量大幅波動；beipan.html 每次送出備盤時其實已經把每個批號的真實
// 消耗量寫進 changelog，改用這份逐日流水帳加總更精準、不受盤點頻率干擾。
// 注意單位：changelog 的 qtyDelta 對培養液是「mL」，但庫存數／DoI 都是「瓶」——
// 真正該加總的是 bottlesOpened（開封瓶數，培養液與散裝品項都一致用這個單位），
// 不能直接加總 qtyDelta，否則跟庫存單位對不起來。
// 回傳：
//   usage        近 effectiveDays 天內的實際消耗總量（正值，單位＝product.unit）
//   loss         同期間的異常損耗（報廢/作廢，單位＝changelog 記錄的原始單位，如 mL），與 usage 分開，不計入日均消耗
//   days         實際採計的天數（新品項會小於 30；查無資料時可能是 90）
//   dailyUsage   usage / days，供「預計可撐天數」使用；查無可用資料時為 0
//   monthlyUsage dailyUsage 換算成 30 天的等效月用量，供「月使用量」欄位顯示
function calcRolling30dUsage(productId, changelog, jinhuo) {
  const CONSUME_ACTIONS = ['beipan', 'beipan_addon'];
  const LOSS_ACTIONS = ['discard', 'void'];
  const now = Date.now();

  // 品項「年紀」一律用 jinhuo 最早一筆進貨日判斷，不能用 changelog 最早一筆——
  // changelog 逐日消耗紀錄是後來才開始寫的功能，用它會把「早就存在、只是近期用量稀疏」
  // 的舊品項誤判成新品項，反而把日均用量算得過高。
  const firstReceived = (jinhuo || [])
    .filter(r => r.productId === productId && !r.isVoided && r.receivedAt)
    .reduce((min, r) => (!min || r.receivedAt < min) ? r.receivedAt : min, null);
  const ageDays = firstReceived
    ? Math.floor((now - new Date(firstReceived).getTime()) / 86400000)
    : 30;
  const effectiveDays = Math.max(1, Math.min(30, ageDays));

  function sumWithinDays(days) {
    const cutoff = now - days * 86400000;
    let usage = 0, loss = 0;
    (changelog || []).forEach(log => {
      if (log.productId !== productId || log.source !== 'beipan') return;
      const t = getLogTime(log);
      if (!t) return;
      const ts = new Date(t).getTime();
      if (Number.isNaN(ts) || ts < cutoff) return;
      if (CONSUME_ACTIONS.includes(log.action)) {
        usage += Math.abs(log.bottlesOpened ?? log.qtyDelta ?? 0);
      } else if (LOSS_ACTIONS.includes(log.action)) {
        loss += Math.abs(log.qtyDelta ?? 0);
      }
    });
    // 加總有浮點數誤差（如 0.1+0.2 不等於 0.3），回傳前修剪到小數 1 位
    return { usage: parseFloat(usage.toFixed(1)), loss: parseFloat(loss.toFixed(1)) };
  }

  let { usage, loss } = sumWithinDays(effectiveDays);
  let days = effectiveDays;
  let label = ageDays < 30 ? `近 ${effectiveDays} 天（新品項）` : '近 30 天';

  // 零用量防呆：主要區間用量為 0（例如低用量品項剛好整月沒用），往回撈 90 天取平均
  if (usage === 0) {
    const r90 = sumWithinDays(90);
    if (r90.usage > 0) {
      usage = r90.usage;
      loss = r90.loss;
      days = 90;
      label = '近 90 天（低用量，取平均）';
    } else {
      label = '— 極低用量';
    }
  }

  const dailyUsage = (usage > 0 && days > 0) ? usage / days : 0;
  const monthlyUsage = dailyUsage > 0 ? parseFloat((dailyUsage * 30).toFixed(1)) : 0;

  return { usage, loss, days, dailyUsage, monthlyUsage, label };
}

// ── 非備盤試劑/耗材：把盤點快照拆成一段段相鄰區間，各自算出消耗量與天數 ──
// 供 calcPandianDeltaUsage（多期平均）與 calcPandianDeltaBuckets（近幾次盤點趨勢）共用，
// 避免兩處各自維護一份「比對 gupanId、扣掉進貨、鉗制負值」的邏輯。回傳由近到遠排列。
function calcPandianIntervals(product, pandianHistory, jinhuo) {
  const normDate = d => (d || '').replace(/\//g, '-');
  const sorted = [...(pandianHistory || [])]
    .sort((a, b) => normDate(a.date).localeCompare(normDate(b.date)));
  // 比對盤點快照要用 product.gupanId，不能用 productId 或寫死 m- 前綴——
  // pandian.allValues[].id 存的是 gupanId，培養液是 m- 開頭，試劑/耗材是 f-/s-/c1-/c2-/c3-/r-/b- 等，
  // 這正是本函數主要要覆蓋的族群，寫死 m- 前綴會讓非培養液品項永遠比對不到。
  if (sorted.length < 2 || !product.gupanId) return [];

  const intervals = [];
  for (let i = sorted.length - 1; i >= 1; i--) {
    const curr = sorted[i];
    const prev = sorted[i - 1];
    const currItem = (curr.allValues || []).find(v => v.id === product.gupanId);
    const prevItem = (prev.allValues || []).find(v => v.id === product.gupanId);
    if (!currItem || !prevItem) continue;

    const currDate = normDate(curr.date);
    const prevDate = normDate(prev.date);
    const days = Math.round((new Date(currDate) - new Date(prevDate)) / 86400000);
    if (days <= 0) continue;

    const purchases = (jinhuo || [])
      .filter(r => r.productId === product.id && !r.isVoided
                && (r.receivedAt || '') > prevDate && (r.receivedAt || '') <= currDate)
      .reduce((s, r) => s + (r.receivedQty || 0), 0);

    // 鉗制單一區間用量，避免補登進貨或前次盤點誤差算出負消耗，污染加總
    const delta = Math.max(0, prevItem.actual + purchases - currItem.actual);
    intervals.push({ delta, days, prevDate, currDate });
  }
  return intervals;
}

// ── 非備盤試劑/耗材的月用量：多期盤點平均（上限 90 天）──
// 這些品項（PVP、Cumulase、Top tips、Geri dish……）不走 beipan.html 的每日備盤流程，
// changelog 完全沒有它們的消耗紀錄，只能靠盤點快照（pandian_snapshots）的差值推算。
// 只看最近兩次盤點差值會被單次盤點的間隔長短、或當次進退貨誤差放大波動；
// 改成把近 90 天內的多次盤點區間都加總（用量加總 ÷ 天數加總），再換算回 30 天等效用量，更穩定。
// ZY 確認盤點頻率約 30–45 天一次，90 天上限通常涵蓋 2–3 次盤點，不會被更久遠的資料干擾。
function calcPandianDeltaUsage(product, pandianHistory, jinhuo) {
  const intervals = calcPandianIntervals(product, pandianHistory, jinhuo);
  if (intervals.length === 0) return { usage: null, label: '—' };

  let totalUsage = 0;
  let totalDays = 0;
  for (const it of intervals) {
    totalUsage += it.delta;
    totalDays += it.days;
    if (totalDays >= 90) break;
  }

  if (totalDays === 0) return { usage: null, label: '—' };

  const monthlyUsage = parseFloat((totalUsage / totalDays * 30).toFixed(1));
  return { usage: monthlyUsage, monthlyUsage, dailyUsage: totalUsage / totalDays, label: '盤點推算（多期平均）' };
}

// ── 非備盤試劑/耗材的「近幾次盤點」用量趨勢 ──
// 沒有逐日消耗紀錄的品項，沒辦法像備盤品項那樣拆出「近 30/31-60/61-90 天」三個固定天數區間；
// 改成直接把最近幾次（預設 3 次）相鄰盤點區間，各自換算成「等效月用量」列出來，
// 由近到遠排列，讓 ZY 能看出「最近是不是用得比較兇/比較少」的趨勢，區間長短不固定（取決於實際盤點間隔），
// 不是精確的 30 天一段，只是聊勝於無的近似值。供 order.html 顯示用。
function calcPandianDeltaBuckets(product, pandianHistory, jinhuo, maxBuckets = 3) {
  const intervals = calcPandianIntervals(product, pandianHistory, jinhuo).slice(0, maxBuckets);
  return intervals.map(it => ({
    monthlyUsage: parseFloat((it.delta / it.days * 30).toFixed(1)),
    days: it.days,
    from: it.prevDate,
    to: it.currDate,
  }));
}

// ── 月用量組合函數：優先用 changelog 逐日消耗（精確），沒有才退到盤點快照多期平均（估）──
// data = { changelog, jinhuo, pandianHistory }
function calcMonthlyUsage(product, data) {
  // noForecast（彈性供應商，例如同品項掛第二廠商、盤點恆填 0）不計算用量，避免把「進多少」誤算成「用多少」
  if (product.noForecast) return { usage: null, monthlyUsage: 0, dailyUsage: 0, label: '—' };
  const rolling = calcRolling30dUsage(product.id, data.changelog, data.jinhuo);
  if (rolling.monthlyUsage > 0) return rolling;
  const pandianAvg = calcPandianDeltaUsage(product, data.pandianHistory, data.jinhuo);
  if (pandianAvg.usage !== null) return pandianAvg;
  return { usage: null, monthlyUsage: 0, dailyUsage: 0, label: '—' };
}

function daysBetween(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr + 'T00:00:00');
  const now = new Date(); now.setHours(0,0,0,0);
  return Math.round((d - now) / 86400000);
}

function fmtNum(n) {
  if (n === null || n === undefined) return '--';
  return Number.isInteger(n) ? String(n) : parseFloat(n.toFixed(2)).toString();
}

// ════════════════════════════════
// PRODUCT INFO CALCULATION（純函數：庫存數／批號明細／效期狀態）
// 原本只存在於 kucun.html，現搬來共用檔讓 order.html 也能算出一致的庫存與批號資料，
// 不用在 order.html 重新刻一份。介面固定吃 (product, { jinhuo, pandian, beipan, order, orderHistory, changelog })，
// 只依賴傳入參數與 shared.js 的 PRODUCTS，不讀寫任何頁面全域狀態。
// ════════════════════════════════
// 效期與庫存警示門檻的全域預設值。頁面若讀到 Firestore global_settings，
// 呼叫 applyGlobalSettings() 覆寫，讀不到就維持這組程式內建預設（跟原本寫死的行為一致）
let GLOBAL_SETTINGS = { orangeDays: 3, redDays: 1, stockWarnRatio: 1.0, stockCritRatio: 0.5 };
function applyGlobalSettings(overrides) {
  if (overrides) Object.assign(GLOBAL_SETTINGS, overrides);
}

// 院所名稱：LINE 訊息、CSV 檔名等會用到，新竹院所部署時只要改這一行（或未來搬進 global_settings）
let CLINIC_NAME = '台北胚胎室';

// Oil／HEPES 公式的預設係數：gupan.html（估盤計算）與 admin.html（後臺設定畫面的保底值）共用同一份，避免各自維護
const DEFAULT_OIL_FORMULA   = { szuDenom:3, szuCoef:7, spCoef:5, bxCoef:5, stdCoef:10, baseAddCans:1, perCanDivisor:50 };
const DEFAULT_HEPES_FORMULA = { lt5Coef:0.5, s69Coef:1, ge10Coef:2, ljkCoef:1, baseAdd:1, minCans:8 };

function calcProductInfo(product, data) {
  const { jinhuo, pandian, beipan, order, changelog } = data;
  const th = beipan?.threshold || {};
  const orangeDays = product.expiryWarnDays ?? GLOBAL_SETTINGS.orangeDays ?? (th.orange_days ?? 3);
  const redDays    = GLOBAL_SETTINGS.redDays ?? (th.red_days ?? 1);
  const stockWarnRatio = GLOBAL_SETTINGS.stockWarnRatio ?? 1.0;
  const stockCritRatio = GLOBAL_SETTINGS.stockCritRatio ?? 0.5;

  // ── Stock ──
  let stockDisplay = null;
  let stockNum     = null;
  let stockSource  = null;
  const beipanBatches = (beipan?.batches || []).filter(b => b.reagentId === product.id);
  const beipanBatch   = beipanBatches[0] || null; // for the if (beipanBatch) check
  const pandianItem  = product.gupanId
    ? pandian?.allValues?.find(v => v.id === product.gupanId)
    : null;

  // 統一日期格式為 YYYY-MM-DD（gupan.html 存 YYYY/MM/DD，beipan/jinhuo 存 YYYY-MM-DD）
  const beipanDate   = (beipan?.date  || '').replace(/\//g, '-');
  const pandianDate  = (pandian?.date || '').replace(/\//g, '-');

  // 盤點精確截止時間（防止盤點當天早上的手動異動被重複扣除）
  // pandian.completedAt = "HH:MM" 台灣時間，需轉為 UTC ISOString 才能和 log.tsRaw 公平字串比較
  let pandianCutoff = pandianDate;
  if (pandianDate && pandian?.completedAt) {
    try {
      pandianCutoff = new Date(`${pandianDate}T${pandian.completedAt}:00+08:00`).toISOString();
    } catch(e) {
      pandianCutoff = pandianDate;
    }
  }

  // 計算指定時間點後的手動異動合計（qtyDelta 通常為負數）
  const calcManualDelta = (isoCutoff) => (changelog || [])
    .filter(log => {
      const logTime = log.tsRaw || (typeof log.ts === 'string' ? log.ts : log.ts?.toDate?.().toISOString()) || '';
      return log.productId === product.id
          && log.source === 'manual'
          && ['use','discard','adjust','lend','return'].includes(log.action)
          && logTime > isoCutoff;
    })
    .reduce((s, log) => s + (log.qtyDelta ?? log.qty ?? 0), 0);

  // HEPES／Oil 這類 Bulk 分裝試劑不在 reagentConfig 裡，永遠不會有 beipanBatch，只能走 pandianItem／
  // 從未盤點分支算庫存；但備盤頁「今日開封」扣除寫入 changelog 時 source 是 'beipan' 不是 'manual'，
  // 不會被 calcManualDelta 篩到，導致庫存卡在盤點當下不動（月使用量看得到消耗，庫存卻扣不動）。
  // 這裡另外加總這類扣除，篩選條件比照 calcRolling30dUsage 的 CONSUME_ACTIONS，用 bottlesOpened
  // （開封瓶數，跟庫存單位「瓶」對得起來）而非 qtyDelta。
  const calcBeipanBulkDelta = (isoCutoff) => (changelog || [])
    .filter(log => {
      const logTime = log.tsRaw || (typeof log.ts === 'string' ? log.ts : log.ts?.toDate?.().toISOString()) || '';
      return log.productId === product.id
          && log.source === 'beipan'
          && ['beipan', 'beipan_addon'].includes(log.action)
          && logTime > isoCutoff;
    })
    .reduce((s, log) => s - Math.abs(log.bottlesOpened ?? log.qtyDelta ?? 0), 0);

  if (beipanBatch) {
    // 跨批次加總：只計算全新未開封瓶數（正在使用中的殘液不佔庫存名額）
    const unopened    = beipanBatches.reduce((s, b) => s + (b.unopened ?? 0), 0);
    if (pandianItem && pandianDate > beipanDate) {
      // 有更新的盤點覆蓋備盤：以盤點為基準，加上盤點後進貨與手動異動
      const newIncoming = jinhuo
        .filter(r => r.productId === product.id && !r.isVoided && (r.receivedAt||'') > pandianDate)
        .reduce((s, r) => s + (r.receivedQty||0), 0);
      const manualDelta = calcManualDelta(pandianCutoff);
      stockNum     = Math.max(0, pandianItem.actual + newIncoming + manualDelta);
      stockDisplay = `${fmtNum(stockNum)} ${pandianItem.unit || product.unit}`;
      stockSource  = 'pandian';
    } else {
      // 正常備盤路線：備盤快照 + 備盤後進貨 + 備盤後手動異動
      // 用 >= beipanDate 且排除已在備盤內的批號，避免備盤同日手動還入的新批號被漏算
      const beipanLotSet = new Set(beipanBatches.map(bb => bb.selectedLot).filter(Boolean));
      const newIncoming = jinhuo
        .filter(r => r.productId === product.id && !r.isVoided
                  && !beipanLotSet.has(r.lotNumber)
                  && (r.receivedAt||'') >= beipanDate)
        .reduce((s, r) => s + (r.receivedQty||0), 0);
      const beipanCutoff = beipan?.submittedAt || beipanDate;
      const manualDelta  = calcManualDelta(beipanCutoff);
      const baseBottles  = unopened; // 只計算全新未開封瓶
      stockNum    = Math.max(0, baseBottles + newIncoming + manualDelta);
      stockDisplay = `${fmtNum(stockNum)} ${product.unit}`;
      stockSource  = 'beipan';
    }
  } else if (pandianItem) {
    // 非備盤品項（602、110 等試劑類，以及 HEPES／Oil 這類 Bulk 分裝試劑）：
    // 盤點基準 + 盤點後進貨 + 手動異動 + 備盤 Bulk 分裝扣除
    const newIncoming = jinhuo
      .filter(r => r.productId === product.id && !r.isVoided && (r.receivedAt||'') > pandianDate)
      .reduce((s, r) => s + (r.receivedQty||0), 0);
    const manualDelta = calcManualDelta(pandianCutoff);
    const beipanBulkDelta = calcBeipanBulkDelta(pandianCutoff);
    stockNum     = Math.max(0, pandianItem.actual + newIncoming + manualDelta + beipanBulkDelta);
    stockDisplay = `${fmtNum(stockNum)} ${pandianItem.unit || product.unit}`;
    stockSource  = 'pandian';
  } else {
    // 從未盤點的品項：以全部進貨紀錄為基準
    const totalJinhuo = jinhuo
      .filter(r => r.productId === product.id && !r.isVoided)
      .reduce((s, r) => s + (r.receivedQty||0), 0);
    if (totalJinhuo > 0) {
      const manualDelta = calcManualDelta(''); // 無快照基準，計算全部歷史
      const beipanBulkDelta = calcBeipanBulkDelta('');
      stockNum     = Math.max(0, totalJinhuo + manualDelta + beipanBulkDelta);
      stockDisplay = `${fmtNum(stockNum)} ${product.unit}`;
      stockSource  = 'jinhuo';
    }
    // 若連進貨紀錄都沒有，stockNum 維持 null（顯示 —）
  }

  // ── Target（優先用 PRODUCTS 的最新設定，fallback 到盤點快照的舊值）──
  let target = PRODUCTS.find(p => p.id === product.id)?.target ?? pandianItem?.target ?? null;
  // noForecast（彈性供應商）品項強制忽略 target，避免撈到舊盤點快照裡殘留的非 null 舊值
  if (product.noForecast) target = null;

  // ── Pending delivery ──
  let pending = 0;
  if (product.gupanId) {
    const orderHistory = data.orderHistory || [];
    orderHistory.forEach(ord => {
      if (!['pending', 'partial'].includes(ord.status)) return;
      (ord.orders || []).forEach(oi => {
        if (oi.orderId === product.gupanId) {
          pending += Math.max(0, (oi.orderQty || 0) - (oi.receivedQty || 0) - (oi.cancelledQty || 0));
        }
      });
    });
    // fallback：若 orderHistory 為空但舊 order-result 存在
    if (pending === 0 && data.order?.orders) {
      const oi = data.order.orders.find(o => o.itemId === product.gupanId);
      if (oi) pending = Math.max(0, (oi.orderQty || 0) - (oi.receivedQty || 0) - (oi.cancelledQty || 0));
    }
  }

  // ── Active lots (from jinhuo, group by lot#) ──
  const lotMap = {};
  jinhuo
    .filter(r => r.productId === product.id && !r.isVoided && r.lotNumber)
    .sort((a,b) => (a.receivedAt||'').localeCompare(b.receivedAt||''))
    .forEach(r => {
      const k = r.lotNumber;
      if (!lotMap[k]) lotMap[k] = { lot:k, expiry:r.expiryDate||'', qty:0 };
      lotMap[k].qty += r.receivedQty||0;
    });
  const lots = Object.values(lotMap).sort((a,b) => a.expiry.localeCompare(b.expiry));

  // ── A1：對非備盤批號逐批套用 manual changelog 扣減 ──
  const beipanSelectedLots = new Set(
    beipanBatches.map(bb => bb.selectedLot).filter(Boolean)
  );
  lots.forEach(lot => {
    if (beipanSelectedLots.has(lot.lot)) return; // 備盤批號由下方 beipan block 處理
    const netDelta = (changelog || [])
      .filter(log => {
        return log.productId === product.id
            && log.lotNumber === lot.lot
            && log.source === 'manual'
            && ['use','discard','lend','return','adjust'].includes(log.action);
      })
      .reduce((s, log) => s + (log.qtyDelta ?? log.qty ?? 0), 0);
    lot.qty = Math.max(0, lot.qty + netDelta);
  });

  // ── 修正備盤批號的庫存數（永遠依最新一筆備盤快照校正，跟「總數用哪個來源計算」脫鉤）──
  // 原本只在 stockSource === 'beipan' 時執行，導致盤點成為最新來源時這段整段跳過，
  // 已經在正常備盤流程中用掉/過期的批號金額會卡住不動，直到下次備盤才被重新校正。
  if (beipanBatches.length > 0) {
    const bpCutoff = beipan?.submittedAt || beipanDate;
    beipanBatches.forEach(bb => {
      if (!bb.selectedLot) return;
      const currLot = lots.find(l => l.lot === bb.selectedLot);
      if (!currLot) return;
      const snapQty     = bb.unopened ?? 0;
      const lotIncoming = jinhuo
        .filter(r => r.productId === product.id && r.lotNumber === bb.selectedLot
                  && !r.isVoided && (r.receivedAt||'') > beipanDate)
        .reduce((s, r) => s + (r.receivedQty||0), 0);
      const lotDelta = (changelog || [])
        .filter(log => {
          const t = log.tsRaw || (typeof log.ts === 'string' ? log.ts : log.ts?.toDate?.().toISOString()) || '';
          return log.productId === product.id && log.lotNumber === bb.selectedLot
              && log.source === 'manual' && ['use','discard','adjust','lend','return'].includes(log.action)
              && t > bpCutoff;
        })
        .reduce((s, log) => s + (log.qtyDelta ?? log.qty ?? 0), 0);
      currLot.qty = Math.max(0, snapQty + lotIncoming + lotDelta);
    });
  }

  // ── Status（維持原邏輯，供舊呼叫端相容，混合了庫存量與批號效期兩件事）──
  let status = (stockSource || lots.length>0) ? 'ok' : 'none';
  if (status !== 'none') {
    lots.forEach(lot => {
      if (lot.qty <= 0) return; // A2：耗盡批號不觸發效期警告
      const d = daysBetween(lot.expiry);
      if (d !== null) {
        if (d <= redDays) {
          // 今明到期：不論備貨量，需今日用完或丟棄 → 危急
          status = 'crit';
        } else if (d <= orangeDays && status !== 'crit') {
          // 效期預警：只有在該批號到期後剩餘庫存低於安全量時才標注意
          // 若有足夠備用批號撐到下次補貨，不需打擾管理者
          if (target !== null) {
            const remainAfterExpiry = (stockNum ?? 0) - lot.qty;
            if (remainAfterExpiry < target) status = 'warn';
          }
        }
      }
    });
    if (target !== null && stockNum !== null) {
      if (stockNum < target * stockCritRatio && status !== 'crit') status = 'crit';
      else if (stockNum < target * stockWarnRatio && status === 'ok') status = 'warn';
    }
  }

  // ── stockStatus：純粹「庫存量 vs 安全庫存」，供訂貨／庫存頁叫貨判斷，跟批號效期完全脫鉤 ──
  let stockStatus = stockNum !== null ? 'ok' : 'none';
  if (stockStatus === 'ok' && target !== null) {
    if (stockNum < target * stockCritRatio) stockStatus = 'crit';
    else if (stockNum < target * stockWarnRatio) stockStatus = 'warn';
  }

  // ── expiryStatus：純粹「單一批號到期倒數」，供備盤頁鎖定／報廢判斷，不受庫存量影響 ──
  let expiryStatus = lots.length > 0 ? 'ok' : 'none';
  lots.forEach(lot => {
    if (lot.qty <= 0) return;
    const d = daysBetween(lot.expiry);
    if (d === null) return;
    if (d <= redDays) expiryStatus = 'crit';
    else if (d <= orangeDays && expiryStatus !== 'crit') expiryStatus = 'warn';
  });

  return { stockDisplay, stockSource, stockNum, pending, lots, status, stockStatus, expiryStatus, target, orangeDays, redDays };
}

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

    // 3. 側邊欄注入測試模式提示 + 版本號按鈕
    const isTestHost = location.hostname !== 'stork11-embryo-lab.web.app'
                     && location.hostname !== 'stork11-embryo-lab.firebaseapp.com';

    document.querySelectorAll('.mt-auto').forEach(block => {
      if (block.querySelector('#sidebar-version-btn')) return;
      const originalFirst = block.firstChild;
      const frag = document.createDocumentFragment();

      if (isTestHost) {
        const simDate = localStorage.getItem('test-simulated-date') || '';
        const badge = document.createElement('div');
        badge.className = 'sidebar-test-badge';
        badge.style.cssText = 'background:#F59E0B;color:#fff;border-radius:10px;padding:10px;margin-bottom:8px;font-size:11px;line-height:1.6';
        badge.innerHTML = `
          <div style="font-weight:700;font-size:12px;margin-bottom:2px">⚠️ 測試模式</div>
          <div style="opacity:.9">所有動作只影響測試資料，不影響正式庫存</div>
          <div style="opacity:.9;margin-top:4px">🕒 模擬日期：${simDate || '（真實時間）'}</div>`;
        frag.appendChild(badge);
      }

      const btn = document.createElement('button');
      btn.id = 'sidebar-version-btn';
      btn.onclick = window.openChangelogModal;
      btn.style.cssText = 'width:100%;text-align:left;background:none;border:none;cursor:pointer;padding:6px 12px;font-size:11px;color:#94a3b8;font-family:monospace;letter-spacing:.05em;border-radius:8px;transition:color .15s;margin-bottom:6px';
      btn.onmouseover = () => btn.style.color = '#64748b';
      btn.onmouseout  = () => btn.style.color = '#94a3b8';
      btn.textContent = `Version ${APP_VERSION}`;
      frag.appendChild(btn);

      block.insertBefore(frag, originalFirst);
    });

    // 3b. beipan.html 專屬開發面板（模擬日期 / 重置 / 終極清理）
    // window.runDevReset 定義在 beipan.html 內等待 Firebase 連線的 await 之後，
    // 時機不保證早於 DOMContentLoaded，所以用「立即嘗試 + devpanel-ready 事件」雙重觸發，不管先後都能補上。
    function tryInjectDevPanel() {
      if (!isTestHost || typeof window.runDevReset !== 'function') return;
      const simDate = localStorage.getItem('test-simulated-date') || '';
      document.querySelectorAll('.sidebar-test-badge').forEach(badge => {
        if (badge.querySelector('.sidebar-devpanel')) return;
        const extra = document.createElement('div');
        extra.className = 'sidebar-devpanel';
        extra.style.cssText = 'margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,.3)';
        extra.innerHTML = `
          <input type="date" class="dp-time-travel" value="${simDate}" style="width:100%;padding:3px 6px;border-radius:5px;border:none;font-size:11px;color:#334155;margin-bottom:6px;cursor:pointer" title="選日期後頁面重整，系統視為該日" />
          <button onclick="window.runDevReset()" style="width:100%;background:rgba(255,255,255,.2);border:1px solid rgba(255,255,255,.5);color:#fff;padding:4px 8px;border-radius:5px;font-size:11px;font-weight:700;cursor:pointer;margin-bottom:4px">🔄 重置今日備盤</button>
          <button onclick="window.runNuclearWipe()" style="width:100%;background:rgba(220,38,38,.35);border:1px solid rgba(220,38,38,.5);color:#fff;padding:4px 8px;border-radius:5px;font-size:11px;font-weight:700;cursor:pointer">🗑️ 終極清理</button>`;
        badge.appendChild(extra);
        extra.querySelector('.dp-time-travel').addEventListener('change', function() {
          if (this.value) localStorage.setItem('test-simulated-date', this.value);
          else localStorage.removeItem('test-simulated-date');
          location.reload();
        });
      });
    }
    tryInjectDevPanel();
    window.addEventListener('devpanel-ready', tryInjectDevPanel);
  });
})();
