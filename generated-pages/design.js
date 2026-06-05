// design.js — 培養液管理系統共用 JavaScript 工具
// v1.0.0
// 載入方式：<script src="design.js" defer></script>

/* ════════════════════════════════════════
   showToast — 堆疊式全域提示 Toast
   多個 toast 可同時存在、由下往上堆疊
   ════════════════════════════════════════
   用法：
     showToast('訊息')               → 深色底（預設）
     showToast('警告', 'warn')       → 紅色底
     showToast('成功', 'ok')         → 綠色底
     showToast('訊息', 'default', 3000) → 自訂顯示時長（ms）
*/
function showToast(msg, type = 'default', duration = 2500) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const el = document.createElement('div');
  el.className = 'toast-item';
  if (type === 'warn') el.classList.add('toast-warn');
  if (type === 'ok')   el.classList.add('toast-ok');
  el.textContent = msg;
  container.appendChild(el);

  // 雙 rAF 確保瀏覽器套用初始 opacity:0 後才觸發進場動畫
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('show')));

  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 250); // 等淡出動畫完成後移除
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
