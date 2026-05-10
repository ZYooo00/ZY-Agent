// shared.js — 品項主檔、共用函數
// v2.1.0 — 新增 brand 欄位（Vitrolife/LifeGlobal/null）；101 needQC 改為 false
// 所有 HTML 頁面引用此檔，禁止在各頁面重複定義

const PRODUCTS = [
  // ── 培養液（8 項）──
  { id:'givf',     name:'G-IVF',               vendor:'亞樸', unit:'瓶', group:'培養液', gtin:'07350025910550', brand:'Vitrolife',  gupanId:'m-givf',   target:2, reorderQty:12,  bottleVol:60,   openExpiryDays:null, needQC:false, location:'培養箱', orderNote:null },
  { id:'gxtl',     name:'GxTL',                vendor:'亞樸', unit:'瓶', group:'培養液', gtin:'07350025910611', brand:'Vitrolife',  gupanId:'m-gxtl',   target:2, reorderQty:8,   bottleVol:30,   openExpiryDays:null, needQC:false, location:'培養箱', orderNote:null },
  { id:'glue',     name:'EmbryoGlue',           vendor:'亞樸', unit:'瓶', group:'培養液', gtin:'07350025910048', brand:'Vitrolife',  gupanId:'m-glue',   target:2, reorderQty:8,   bottleVol:10,   openExpiryDays:null, needQC:false, location:'培養箱', orderNote:null },
  { id:'h5gt',     name:'H5GT',                vendor:'弘優', unit:'瓶', group:'培養液', gtin:'00815965020426', brand:'LifeGlobal', gupanId:'m-h5gt',   target:2, reorderQty:8,   bottleVol:30,   openExpiryDays:null, needQC:false, location:'培養箱', orderNote:null },
  { id:'aoa-ci',   name:'AOA 弘優 CI',         vendor:'弘優', unit:'瓶', group:'培養液', gtin:'04582231465118', brand:null,         gupanId:'m-aoa-ci', target:1, reorderQty:2,   bottleVol:10,   openExpiryDays:null, needQC:false, location:'培養箱', orderNote:null },
  { id:'aoa-508',  name:'AOA 明美 GM508',      vendor:'明美', unit:'罐', group:'培養液', gtin:'04260173194943', brand:null,         gupanId:'f-508',    target:2, reorderQty:4,   bottleVol:null, openExpiryDays:null, needQC:false, location:'冰箱',   orderNote:null },
  { id:'hepes',    name:'HEPES',               vendor:'億宸', unit:'瓶', group:'培養液', gtin:'00888937818314', brand:null,         gupanId:'f-hepes',  target:4, reorderQty:30,  bottleVol:null, openExpiryDays:null, needQC:false, location:'冰箱',   orderNote:null },
  { id:'oil',      name:'Heavy Oil',            vendor:'億宸', unit:'瓶', group:'培養液', gtin:'05411967001224', brand:null,         gupanId:'f-oil',    target:3, reorderQty:30,  bottleVol:null, openExpiryDays:null, needQC:false, location:'冰箱',   orderNote:null },

  // ── 試劑（16 項，含 102-mm）──
  { id:'pvp',      name:'PVP',                vendor:'億宸', unit:'管', group:'試劑',   gtin:'20888937818813', brand:null, gupanId:'f-pvp',    target:1, reorderQty:6,   bottleVol:null, openExpiryDays:null, needQC:false, location:'冰箱',   orderNote:'1 盒 = 6 管' },
  { id:'cumulase', name:'Cumulase',            vendor:'億宸', unit:'管', group:'試劑',   gtin:'20888937817977', brand:null, gupanId:'f-cum',    target:1, reorderQty:10,  bottleVol:null, openExpiryDays:null, needQC:false, location:'冰箱',   orderNote:'1 盒 = 5 管' },
  { id:'fertipro', name:'Fertipro',            vendor:'億宸', unit:'瓶', group:'試劑',   gtin:'05411987000722', brand:null, gupanId:'s-fert',   target:1, reorderQty:7,   bottleVol:null, openExpiryDays:null, needQC:false, location:'精蟲室', orderNote:null },
  { id:'spermfr',  name:'Sperm Freeze (Origio)',vendor:'億宸',unit:'瓶', group:'試劑',   gtin:'00888937800661', brand:null, gupanId:'s-sf',     target:1, reorderQty:2,   bottleVol:null, openExpiryDays:null, needQC:false, location:'精蟲室', orderNote:null },
  { id:'601',      name:'601',                vendor:'弘優', unit:'套', group:'試劑',   gtin:null,             brand:null, gupanId:null,       target:null, reorderQty:null, bottleVol:null, openExpiryDays:null, needQC:false, location:null,   orderNote:null },
  { id:'602',      name:'602',                vendor:'弘優', unit:'套', group:'試劑',   gtin:'14582231460691', brand:null, gupanId:'f-602',    target:2, reorderQty:2,   bottleVol:null, openExpiryDays:null, needQC:false, location:'冰箱',   orderNote:null },
  { id:'spas',     name:'S-PAS',              vendor:'弘優', unit:'盒', group:'試劑',   gtin:'14582231468048', brand:null, gupanId:'s-spas',   target:1, reorderQty:2,   bottleVol:null, openExpiryDays:null, needQC:false, location:'精蟲室', orderNote:null },
  { id:'101',      name:'101（磊柏）',          vendor:'磊柏', unit:'套', group:'試劑',   gtin:'04589700012170', brand:null, gupanId:'f-101',    target:2, reorderQty:40,  bottleVol:null, openExpiryDays:null, needQC:false, location:'冰箱',   orderNote:'亦可向明美訂購' },
  { id:'102',      name:'102（磊柏）',          vendor:'磊柏', unit:'盒', group:'試劑',   gtin:'04589700012200', brand:null, gupanId:'f-102',    target:2, reorderQty:60,  bottleVol:null, openExpiryDays:null, needQC:true,  location:'冰箱',   orderNote:'月點料 · 亦可向明美訂購' },
  { id:'102-mm',   name:'102（明美）',          vendor:'明美', unit:'盒', group:'試劑',   gtin:null,             brand:null, gupanId:'f-102-mm', target:2, reorderQty:20,  bottleVol:null, openExpiryDays:null, needQC:true,  location:'冰箱',   orderNote:'月點料 · 亦可向磊柏訂購' },
  { id:'tyb',      name:'TYB',               vendor:'磊柏', unit:'盒', group:'試劑',   gtin:'00893727002217', brand:null, gupanId:'s-tyb',    target:2, reorderQty:1,   bottleVol:null, openExpiryDays:null, needQC:false, location:'精蟲室', orderNote:'1 盒 = 20 小瓶' },
  { id:'brightv',  name:'BrightVit',           vendor:'磊柏', unit:'個', group:'試劑',   gtin:null,             brand:null, gupanId:null,       target:null, reorderQty:null, bottleVol:null, openExpiryDays:null, needQC:false, location:null,   orderNote:null },
  { id:'mountgl',  name:'Mounting Glue',       vendor:'磊柏', unit:'瓶', group:'試劑',   gtin:null,             brand:null, gupanId:'s-mg',     target:1, reorderQty:1,   bottleVol:null, openExpiryDays:null, needQC:false, location:'精蟲室', orderNote:'至少 1/2 瓶' },
  { id:'gm501',    name:'GM501 (SpermMobil)',  vendor:'明美', unit:'瓶', group:'試劑',   gtin:'04260173193978', brand:null, gupanId:'f-gm501',  target:1, reorderQty:2,   bottleVol:null, openExpiryDays:null, needQC:false, location:'冰箱',   orderNote:null },
  { id:'pure100',  name:'Pure 100',            vendor:'明美', unit:'個', group:'試劑',   gtin:'07350025610030', brand:null, gupanId:'s-pure',   target:2, reorderQty:7,   bottleVol:null, openExpiryDays:null, needQC:false, location:'精蟲室', orderNote:null },
  { id:'110',      name:'110',               vendor:'明美', unit:'套', group:'試劑',   gtin:'04589700012217', brand:null, gupanId:'f-110',    target:2, reorderQty:10,  bottleVol:null, openExpiryDays:null, needQC:false, location:'冰箱',   orderNote:null },

  // ── 耗材（23 項）──
  { id:'toptip-y', name:'Top tips（黃）',      vendor:'弘優', unit:'盒', group:'耗材',   gtin:'14582231460929', brand:null, gupanId:'c1-ty',    target:2, reorderQty:30,  bottleVol:null, openExpiryDays:null, needQC:false, location:'櫃1',    orderNote:'10 支/盒' },
  { id:'toptip-g', name:'Top tips（綠）',      vendor:'弘優', unit:'盒', group:'耗材',   gtin:'14582231460882', brand:null, gupanId:'c1-tg',    target:2, reorderQty:30,  bottleVol:null, openExpiryDays:null, needQC:false, location:'櫃1',    orderNote:'10 支/盒' },
  { id:'toptip-r', name:'Top tips（紅）',      vendor:'弘優', unit:'盒', group:'耗材',   gtin:'14582231460899', brand:null, gupanId:'c1-tr',    target:2, reorderQty:30,  bottleVol:null, openExpiryDays:null, needQC:false, location:'櫃1',    orderNote:'10 支/盒' },
  { id:'toptip-b', name:'Top tips（藍）',      vendor:'弘優', unit:'盒', group:'耗材',   gtin:'14582231460912', brand:null, gupanId:'c1-tb',    target:2, reorderQty:30,  bottleVol:null, openExpiryDays:null, needQC:false, location:'櫃1',    orderNote:'10 支/盒' },
  { id:'toptip-w', name:'Top tips（白）',      vendor:'弘優', unit:'盒', group:'耗材',   gtin:'14582231460905', brand:null, gupanId:'c1-tw',    target:2, reorderQty:30,  bottleVol:null, openExpiryDays:null, needQC:false, location:'櫃1',    orderNote:'10 支/盒' },
  { id:'riez135',  name:'RI-EZ tip 135',      vendor:'弘優', unit:'盒', group:'耗材',   gtin:'05060488047060', brand:null, gupanId:'c2-135',   target:2, reorderQty:2,   bottleVol:null, openExpiryDays:null, needQC:false, location:'櫃2',    orderNote:null },
  { id:'riez145',  name:'RI-EZ tip 145',      vendor:'弘優', unit:'盒', group:'耗材',   gtin:'05060170181478', brand:null, gupanId:'c2-145',   target:2, reorderQty:2,   bottleVol:null, openExpiryDays:null, needQC:false, location:'櫃2',    orderNote:null },
  { id:'riez200',  name:'RI-EZ tip 200',      vendor:'弘優', unit:'盒', group:'耗材',   gtin:null,             brand:null, gupanId:'c2-200',   target:2, reorderQty:1,   bottleVol:null, openExpiryDays:null, needQC:false, location:'櫃2',    orderNote:null },
  { id:'6well',    name:'6 Well dish',         vendor:'弘優', unit:'包', group:'耗材',   gtin:'04582231462414', brand:null, gupanId:'c1-6w',    target:4, reorderQty:24,  bottleVol:null, openExpiryDays:null, needQC:false, location:'櫃1',    orderNote:null },
  { id:'mouth',    name:'Mouth piece',         vendor:'弘優', unit:'包', group:'耗材',   gtin:'04582231461103', brand:null, gupanId:'b-mp',     target:1, reorderQty:null, bottleVol:null, openExpiryDays:null, needQC:false, location:'半年一次', orderNote:'依人數，半年一次' },
  { id:'oosafe-c', name:'Oosafe（培養箱用）',  vendor:'弘優', unit:'罐', group:'耗材',   gtin:null,             brand:null, gupanId:'r-os1',    target:1, reorderQty:null, bottleVol:null, openExpiryDays:null, needQC:false, location:'需要再叫', orderNote:null },
  { id:'oosafe-f', name:'Oosafe（地板用）',    vendor:'弘優', unit:'罐', group:'耗材',   gtin:null,             brand:null, gupanId:'r-os2',    target:1, reorderQty:null, bottleVol:null, openExpiryDays:null, needQC:false, location:'需要再叫', orderNote:null },
  { id:'3well',    name:'3 well dish',         vendor:'磊柏', unit:'包', group:'耗材',   gtin:'04589700012125', brand:null, gupanId:'c1-3w',    target:3, reorderQty:24,  bottleVol:null, openExpiryDays:null, needQC:false, location:'櫃1',    orderNote:null },
  { id:'phsensor', name:'pH sensor dish',      vendor:'磊柏', unit:'包', group:'耗材',   gtin:null,             brand:null, gupanId:null,       target:null, reorderQty:null, bottleVol:null, openExpiryDays:null, needQC:false, location:null,   orderNote:null },
  { id:'geridish', name:'Geri dish',           vendor:'磊柏', unit:'盒', group:'耗材',   gtin:null,             brand:null, gupanId:'c3-gd',    target:2, reorderQty:20,  bottleVol:null, openExpiryDays:null, needQC:false, location:'櫃3',    orderNote:'20 個/盒' },
  { id:'geriwat',  name:'Geri water bottle',   vendor:'磊柏', unit:'盒', group:'耗材',   gtin:'19348265003045', brand:null, gupanId:'c3-gw',    target:2, reorderQty:6,   bottleVol:null, openExpiryDays:null, needQC:false, location:'櫃3',    orderNote:'12 個/盒' },
  { id:'gerifl',   name:'Geri filter',         vendor:'磊柏', unit:'盒', group:'耗材',   gtin:null,             brand:null, gupanId:'c3-gf',    target:2, reorderQty:1,   bottleVol:null, openExpiryDays:null, needQC:false, location:'櫃3',    orderNote:'50 個/盒' },
  { id:'coda',     name:'Coda Filter K-730',   vendor:'磊柏', unit:'個', group:'耗材',   gtin:null,             brand:null, gupanId:'b-cf',     target:2, reorderQty:3,   bottleVol:null, openExpiryDays:null, needQC:false, location:'半年一次', orderNote:'半年一次' },
  { id:'oritip135',name:'Origio tip 135',     vendor:'億宸', unit:'管', group:'耗材',   gtin:null,             brand:null, gupanId:null,       target:null, reorderQty:null, bottleVol:null, openExpiryDays:null, needQC:false, location:null,   orderNote:null },
  { id:'oritip150',name:'Origio tip 150',     vendor:'億宸', unit:'管', group:'耗材',   gtin:null,             brand:null, gupanId:null,       target:null, reorderQty:null, bottleVol:null, openExpiryDays:null, needQC:false, location:null,   orderNote:null },
  { id:'orifl',    name:'Origio Filter',       vendor:'億宸', unit:'個', group:'耗材',   gtin:'0888937014693',  brand:null, gupanId:'b-of',     target:2, reorderQty:10,  bottleVol:null, openExpiryDays:null, needQC:false, location:'半年一次', orderNote:'半年一次' },
  { id:'glasspip', name:'玻璃 pipette',        vendor:'億宸', unit:'箱', group:'耗材',   gtin:null,             brand:null, gupanId:null,       target:null, reorderQty:null, bottleVol:null, openExpiryDays:null, needQC:false, location:null,   orderNote:null },
  { id:'cellvis',  name:'Cellvis spindle dish',vendor:'岑祥', unit:'箱', group:'耗材',   gtin:null,             brand:null, gupanId:null,       target:null, reorderQty:null, bottleVol:null, openExpiryDays:null, needQC:false, location:null,   orderNote:null },
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
