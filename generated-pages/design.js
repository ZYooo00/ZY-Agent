// design.js — 培養液管理系統共用 JavaScript 工具
// v1.0.0
// 載入方式：<script src="design.js" defer></script>

/* ════════════════════════════════════════
   showToast — 全域提示 Toast
   防連點（clearTimeout）+ 動態建立 DOM
   ════════════════════════════════════════
   用法：
     showToast('訊息')               → 深色底（預設）
     showToast('警告', 'warn')       → 紅色底
     showToast('成功', 'ok')         → 綠色底
     showToast('訊息', 'default', 3000) → 自訂顯示時長（ms）
*/
let _toastTimer;
function showToast(msg, type = 'default', duration = 2500) {
  let el = document.getElementById('global-toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'global-toast';
    document.body.appendChild(el);
  }

  // 清除原本的 type class，重新套用
  el.className = '';
  if (type === 'warn') el.classList.add('toast-warn');
  if (type === 'ok')   el.classList.add('toast-ok');
  el.classList.add('show');
  el.textContent = msg;

  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => {
    el.classList.remove('show');
  }, duration);
}


/* ════════════════════════════════════════
   Sidebar Active 自動偵測
   根據當前頁面 URL，自動為對應的 .sidebar-link 加上 active class
   支援 href 屬性與 onclick="location.href=..." 兩種寫法
   ════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function () {
  const current = window.location.pathname.split('/').pop() || 'index.html';

  document.querySelectorAll('.sidebar-link').forEach(function (link) {
    const href    = link.getAttribute('href') || '';
    const onclick = link.getAttribute('onclick') || '';
    const isActive = href === current || onclick.includes(current);
    link.classList.toggle('active', isActive);
  });
});
