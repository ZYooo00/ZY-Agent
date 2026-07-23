// tailwind-config.js — 培養液管理系統共用 Tailwind 設定
// 載入順序：此檔必須在 cdn.tailwindcss.com script「之後」載入
// Tailwind CDN Play CDN 的正確用法：CDN 先跑建立 tailwind 物件，再用 tailwind.config = {...} 觸發 setter 重新產生 CSS
// 顏色用 hex 而非 var()：Tailwind v3 CDN 產生 rgb(var()/opacity) 語法，var() 傳入 hex 字串會失效
tailwind.config = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#9590D0',
          light:   '#BDB8E8',
          dark:    '#7A75BB',
          xlight:  '#EDE9FF',
        },
        secondary: '#E2E4F4',
      },
      fontFamily: {
        sans:    ['Noto Sans TC', 'sans-serif'],
        heading: ['Figtree', 'Noto Sans TC', 'sans-serif'],
      },
    }
  }
};
