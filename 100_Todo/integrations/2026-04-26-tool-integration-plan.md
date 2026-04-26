---
created: 2026-04-26
status: in-progress
source: pro-kit 03「外部工具整合包 by 雷小蒙」
---

# 外部工具整合計畫（2026-04-26）

> 這份計畫是「外部工具整合包」訪談後產出的，列出所有打算接到 Claude Code 的工具。
> **執行方式**：有空的時候打開這份文件跟 AI 說：「幫我挑一個來裝」，AI 會用網路搜尋查當下最新的整合方式，一步一步帶你裝，完成後把對應的 checklist 打勾。

## 決策原則速查

在選每個工具的路線前，優先順序是：

1. 🥇 **CLI**（`gh`、`gws-cli`、官方 CLI）— 不吃 context、最穩定
2. 🥈 **REST API + `.env`**（curl / Python requests）— 彈性最高、可精準控制
3. 🥉 **MCP**（`~/.claude.json` 的 `mcpServers`）— 只有 CLI + API 都不行時才用
4. 🔒 **瀏覽器控制**（Playwright）— 真的沒 API 才走這條

每個工具的「建議路線」欄位是初步判斷，實際執行時再用網路搜尋確認最新最佳做法。

---

## 工具清單

### 🟢 Gmail — 已整合

- **用途**：讀信、建草稿、搜尋信件
- **路線**：CLI（gws-cli）
- **已驗證**：`gws gmail list` 可用
- **備註**：gws-cli 已全域安裝，憑證存在本機

### 🟢 Google Calendar — 已整合

- **用途**：查行程、建活動、找空檔
- **路線**：CLI（gws-cli）
- **已驗證**：`gws calendar list` 可用
- **備註**：同 Gmail，共用 gws-cli

### 🟢 GitHub — 已整合

- **用途**：管理 repo、看 issues、建 PR、抓課程內容
- **路線**：CLI（gh）
- **已驗證**：`gh api repos/...` 可用
- **備註**：Git Bash 需用完整路徑 `/c/Program Files/GitHub CLI/gh.exe`

### 🟢 Firecrawl — 已整合

- **用途**：抓網頁內容、非 GitHub 的公開網頁（最後手段）
- **路線**：MCP（`mcp__firecrawl__firecrawl_scrape`）
- **已驗證**：MCP 已安裝可用
- **備註**：GitHub 內容優先用 gh api，Firecrawl 是備用

### 🟡 Notion — 尚未整合

- **用途**：知識管理、建頁面、查資料庫（ZY 正在評估是否採用）
- **建議路線**：REST API（`curl api.notion.com`）
- **執行時要查的事情**：
  - [ ] Notion Integration 現在建議的認證方式（Internal Integration Token vs OAuth）
  - [ ] 哪些 endpoint 最常用（搜尋、建頁面、更新 block）
  - [ ] 有沒有比 curl 更好用的 CLI 工具（如 notion-cli）
- **安裝 checklist**：
  - [ ] 到 notion.so/my-integrations 建立一個 Integration，取得 token
  - [ ] token 存到 `.env`（命名 `NOTION_TOKEN`）
  - [ ] 建立 `000_Agent/skills/notion-api/SKILL.md`，寫常用 endpoint 範例
  - [ ] 跑一個驗證指令（搜尋 Notion 裡任意一個頁面）
  - [ ] 回來打勾 + 備註欄記錄踩坑
- **備註**：（執行後填）

### 🟡 Slack — 尚未整合（低優先）

- **用途**：團隊通訊（ZY 有在用）
- **建議路線**：REST API（Slack Webhook 或 Bot Token）
- **執行時要查的事情**：
  - [ ] Slack Incoming Webhook vs Bot API 哪個適合 AI 分身場景
  - [ ] 是否有官方 CLI 工具（slack-cli）
  - [ ] 需要哪些 scope 的權限
- **安裝 checklist**：
  - [ ] 建立 Slack App，取得 Bot Token 或 Webhook URL
  - [ ] token 存到 `.env`（命名 `SLACK_BOT_TOKEN`）
  - [ ] 跑驗證指令（傳一則測試訊息到指定頻道）
  - [ ] 回來打勾 + 備註
- **備註**：（執行後填）

### 🟡 Trello — 尚未整合（低優先）

- **用途**：專案管理看板（ZY 有在用）
- **建議路線**：REST API（Trello API + API key）
- **執行時要查的事情**：
  - [ ] Trello API 認證方式（API key + token）
  - [ ] 是否有官方 CLI 工具
  - [ ] 常用 endpoint（列出卡片、建立卡片、移動卡片）
- **安裝 checklist**：
  - [ ] 到 trello.com/power-ups/admin 取得 API key
  - [ ] key 存到 `.env`（命名 `TRELLO_API_KEY`、`TRELLO_TOKEN`）
  - [ ] 跑驗證指令（列出一個看板的卡片）
  - [ ] 回來打勾 + 備註
- **備註**：（執行後填）

### 🟡 n8n — 尚未整合（中優先）

- **用途**：自動化工作流串接，讓 Claude Code 觸發或查詢 n8n 的 Workflow
- **建議路線**：REST API（n8n API key）
- **執行時要查的事情**：
  - [ ] ZY 用的是 n8n cloud 還是自架版？（影響 API endpoint 的位置）
  - [ ] n8n API key 在哪裡取得（Settings → API）
  - [ ] 常用 endpoint（觸發 Workflow、查執行紀錄、列出 Workflow）
- **安裝 checklist**：
  - [ ] 確認 n8n 版本（cloud / self-hosted）與 API endpoint URL
  - [ ] 到 n8n 設定頁取得 API key
  - [ ] key 存到 `.env`（命名 `N8N_API_KEY`，endpoint 存 `N8N_BASE_URL`）
  - [ ] 建立 `000_Agent/skills/n8n-api/SKILL.md`，寫常用 endpoint 範例
  - [ ] 跑驗證指令（列出所有 Workflow）
  - [ ] 回來打勾 + 備註
- **備註**：（執行後填）

### 🟡 Discord — 尚未整合（低優先）

- **用途**：社群通訊（ZY 有在用）
- **建議路線**：REST API（Discord Bot Token）
- **執行時要查的事情**：
  - [ ] Discord Bot 建立流程與所需 scope
  - [ ] 是否有官方 CLI 工具
  - [ ] 常用操作（傳訊息、讀頻道）
- **安裝 checklist**：
  - [ ] 到 discord.com/developers 建立 Bot，取得 Bot Token
  - [ ] token 存到 `.env`（命名 `DISCORD_BOT_TOKEN`）
  - [ ] 跑驗證指令（傳一則測試訊息）
  - [ ] 回來打勾 + 備註
- **備註**：（執行後填）

---

## 進度總覽

- 🟢 已整合：4 個（Gmail、Google Calendar、GitHub、Firecrawl）
- 🟡 尚未整合：5 個（Notion、Slack、Trello、Discord、n8n）
- 🔴 放棄：0 個

**下次執行建議**：從 Notion 開始，因為 ZY 正在評估採用，整合後 AI 可以直接幫他建知識頁面。

---

## 給未來 AI 執行時的指引（不要刪這段）

當 ZY 打開這份文件跟你說「幫我挑 [某個工具] 來裝」時，請按以下步驟：

### 1. 確認範圍

用 `AskUserQuestion` 確認：
- 你要整合 [工具名]，對嗎？
- 整合的主要用途是什麼？（從計畫文件的「用途」欄讀出來讓他確認）

### 2. 用網路搜尋查最新整合方式

**這一步絕對不要跳過，也不要用訓練資料裡的舊資訊。** 執行：

1. 用 WebSearch / WebFetch 查：`"[工具名]" Claude Code integration 2026`、`"[工具名]" official CLI tool`、`"[工具名]" REST API authentication`
2. 優先看官方文件、GitHub README、官方 blog
3. 對照計畫文件的「建議路線」，看有沒有更好的方案
4. 把查到的結果整理後告訴 ZY，用 `AskUserQuestion` 讓他拍板

### 3. 執行安裝（照 CLI → API → MCP 優先順序）

- **CLI 路線**：安裝 CLI 工具，完成 auth，跑驗證指令
- **API 路線**：引導取得 API key → 存到 `e:/ZYoooClaude/.env`（UPPER_SNAKE_CASE 命名）→ 建 `000_Agent/skills/[工具名]-api/SKILL.md` → 跑驗證
- **MCP 路線**：編輯 `~/.claude.json` 的 `mcpServers` → 完成 auth → 重新載入

### 4. 驗證

用一個實際指令測試整合是否能用：
- Notion → 搜尋 Notion 裡任意一個頁面
- Slack → 傳一則測試訊息到指定頻道
- Trello → 列出某個看板的卡片
- Discord → 傳一則測試訊息

### 5. 更新計畫文件

- 工具區塊標題從 🟡 改成 🟢
- 安裝 checklist 全部打勾
- 備註欄寫：實際用了哪個路線、版本、踩坑、驗證指令
- 進度總覽數字調整

### 6. 告訴 ZY 下一步

「[工具名] 整合完成！剩下 [N] 個工具。建議一週後再挑下一個來裝，讓這個先用熟。」
