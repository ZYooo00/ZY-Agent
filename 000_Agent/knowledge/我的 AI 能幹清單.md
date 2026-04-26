---
updated: 2026-04-26
---
# 我的 AI 能幹清單

> 這份清單會跟著「外部工具整合計畫」長大。每次整合完一個工具，都回來這裡加上它能做什麼。
> 目的：讓 ZY 和未來的 AI session 一眼看到「我的 AI 現在到底會哪些具體動作」。

## 🟢 已整合的工具

### 📧 Gmail（CLI 路線 via gws-cli｜整合日期：2026-04-26 前已完成）

- 列出收件匣最近的信件（`gws gmail list`）
- 搜尋特定關鍵字的信件
- 讀取信件內容
- 建立草稿（需 ZY 自行確認後發送）
- ⚠️ 不會自動發信，草稿需要 ZY 確認後才送出

**試試看的指令**：
- 「幫我看今天有什麼重要的信」
- 「搜尋有『胚胎』關鍵字的最近 5 封信」

### 📅 Google Calendar（CLI 路線 via gws-cli｜整合日期：2026-04-26 前已完成）

- 查詢今天或指定日期的行程
- 建立新活動（指定時間、標題、地點）
- 搜尋特定行程
- 查找空檔時段
- ⚠️ 建立行程前會先確認，不會自動建

**試試看的指令**：
- 「今天有什麼行程？」
- 「幫我在明天下午 3 點建一個『胚胎培養紀錄』的提醒」

### 🐙 GitHub（CLI 路線 via gh）

- 查看 repo 內容與結構
- 抓取課程 Markdown 文件（gh api）
- 列出 issues、PR
- 查看 commit 紀錄
- ⚠️ Git Bash 需用完整路徑 `/c/Program Files/GitHub CLI/gh.exe`

**試試看的指令**：
- 「幫我看 ZY-Agent repo 最近的 commit」
- 「抓取課程 pro-kit 04 的內容」

### 🕷️ Firecrawl（MCP 路線｜整合日期：2026-04-26 前已完成）

- 抓取任何公開網頁的內容，轉為乾淨文字
- 適合非 GitHub 的網站（新聞、部落格、產品頁面）
- ⚠️ GitHub 內容優先用 gh api，Firecrawl 是備用工具

**試試看的指令**：
- 「幫我整理這個網頁的重點：[URL]」

---

## 📋 待整合清單

參考 `100_Todo/integrations/2026-04-26-tool-integration-plan.md`

- 🟡 Notion（REST API）— 建議優先整合
- 🟡 Slack（REST API）
- 🟡 Trello（REST API）
- 🟡 Discord（REST API）

---

## 維護說明

整合完一個工具後，告訴 AI：「幫我把 [工具名] 加到能幹清單」，它會自己寫進來。
