// design.js — 培養液管理系統共用 JavaScript 工具
// v1.0.0
// 載入方式：<script src="design.js" defer></script>

/* ════════════════════════════════════════
   showToast — 堆疊式全域提示 Toast（Tailwind inline，自包含）
   多個 toast 可同時存在、由下往上堆疊
   ════════════════════════════════════════
   用法：
     showToast('訊息')               → 深色底（預設）
     showToast('警告', 'warn')       → 紅色底
     showToast('成功', 'ok')         → 綠色底
     showToast('訊息', 'default', 3000) → 自訂顯示時長（ms）
*/
function showToast(msg, type = 'default', duration = 2500) {
  // 確保堆疊容器存在（找不到就建立，樣式 inline 不依賴外部 CSS）
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    Object.assign(container.style, {
      position: 'fixed', bottom: '80px', left: '50%',
      transform: 'translateX(-50%)',
      display: 'flex', flexDirection: 'column-reverse',
      alignItems: 'center', gap: '8px',
      zIndex: '9999', pointerEvents: 'none',
    });
    document.body.appendChild(container);
  }

  // 底色
  const bg = type === 'warn' || type === 'error' ? '#DC2626'
           : type === 'ok'                        ? '#16A34A'
           : '#1E293B';

  const el = document.createElement('div');
  Object.assign(el.style, {
    background: bg, color: '#fff',
    padding: '10px 20px', borderRadius: '12px',
    fontSize: '14px', fontWeight: '500',
    fontFamily: "'Noto Sans TC', sans-serif",
    boxShadow: '0 4px 16px rgba(0,0,0,.25)',
    maxWidth: '320px', textAlign: 'center',
    whiteSpace: 'pre-line', pointerEvents: 'auto',
    opacity: '0', transform: 'translateY(8px)',
    transition: 'opacity .2s ease, transform .2s ease',
  });
  el.textContent = msg;
  container.appendChild(el);

  // 雙 rAF 確保初始 style 被瀏覽器掛上後才觸發進場
  requestAnimationFrame(() => requestAnimationFrame(() => {
    el.style.opacity = '1';
    el.style.transform = 'translateY(0)';
  }));

  setTimeout(() => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(8px)';
    setTimeout(() => el.remove(), 250);
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
