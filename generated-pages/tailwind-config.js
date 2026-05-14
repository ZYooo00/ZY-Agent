// tailwind-config.js — 培養液管理系統共用 Tailwind 設定
// 載入順序：此檔必須在 cdn.tailwindcss.com script 之前載入
tailwind.config = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'var(--color-primary)',
          light:   'var(--color-primary-light)',
          dark:    'var(--color-primary-dark)',
          xlight:  'var(--color-primary-xlight)',
        },
        secondary: 'var(--color-secondary)',
      },
      fontFamily: {
        sans:    ['Noto Sans TC', 'sans-serif'],
        heading: ['Figtree', 'Noto Sans TC', 'sans-serif'],
      },
    }
  }
}
