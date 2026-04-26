# AI 大腦遷移手冊

> 由 pro-kit 07 生成 · 2026-04-26
> 換新電腦或換 AI 時，照這份走就能一鍵接管。

## 當前架構

| 項目 | 路徑 |
|---|---|
| 主要工作目錄 | `E:\ZYoooClaude` |
| Google Drive 母體 | `G:\我的雲端硬碟\ZY-Agent\` |
| GitHub repo | https://github.com/ZYooo00/ZY-Agent |
| 體檢腳本 | `000_Agent/scripts/sync-health.sh` |
| 體檢頻率 | AI 行為異常時手動跑 |

## 連結對照表

| `~/.claude/` 項目 | 指向 | 類型 |
|---|---|---|
| `skills/` | `E:\ZYoooClaude\000_Agent\skills\` | Junction |
| `commands/` | `G:\我的雲端硬碟\ZY-Agent\.claude\commands\` | Junction |
| `settings.json` | 本機獨立（含 API 金鑰，不同步）| 實體檔案 |

## 情境 1：換一台新 Windows 電腦

1. 安裝 Claude Code、Git、gh CLI、Google Drive for Desktop
2. 登入 Google Drive（同一個 Google 帳號）
3. 從 GitHub clone 專案：
   ```bash
   git clone https://github.com/ZYooo00/ZY-Agent.git E:\ZYoooClaude
   ```
4. 用 PowerShell 重建連結：
   ```powershell
   # skills Junction
   New-Item -ItemType Junction -Path "$env:USERPROFILE\.claude\skills" `
     -Target "E:\ZYoooClaude\000_Agent\skills"

   # commands Junction（等 Google Drive 同步完成後執行）
   New-Item -ItemType Junction -Path "$env:USERPROFILE\.claude\commands" `
     -Target "G:\我的雲端硬碟\ZY-Agent\.claude\commands"
   ```
5. 複製 `settings.json`（從舊電腦備份，或重新設定 API 金鑰）
6. 跑 `000_Agent/scripts/sync-health.sh` 驗證

## 情境 2：換新 AI（Codex / Gemini / 未來新產品）

1. 確認新 AI 讀的規則檔名稱（例如 Codex 讀 `AGENTS.md`）
2. 在專案根目錄建 symlink：
   ```bash
   # 例如 Codex
   ln -s CLAUDE.md AGENTS.md
   # 例如 Cursor
   ln -s CLAUDE.md .cursorrules
   ```
3. Skills / Memory 的複用需要新 AI 支援同等機制

## 情境 3：備份還原（出事時）

```bash
rm -rf ~/.claude
mv ~/claude-backup-YYYYMMDD-HHMMSS ~/.claude
```

備份位置：`C:\Users\User\claude-backup-20260426-110949\`（本次備份）

## 情境 4：Android 手機查看檔案

1. 手機安裝 Google Drive app
2. 登入 gordon08250209@gmail.com
3. 在「我的電腦」→「ZYoooClaude」資料夾找到 `000_Agent/memory/MEMORY.md` 等檔案
