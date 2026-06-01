---
name: cultivate-deploy
description: "培養液管理系統 — 開發與部署 SOP。輸入 /cultivate-deploy 啟動，引導完整的 commit → staging → QA → production 流程。"
---

# 培養液管理系統 — 開發部署助手（/cultivate-deploy）

啟動後，依照以下流程引導 ZY 完成一次完整的功能開發與部署。

---

## 啟動時的第一步

讀取目前的 git 狀態，了解工作進度：

```bash
git status
git log --oneline -5
```

然後問 ZY：

> 這次 `/cultivate-deploy` 要處理哪種情境？
> 1. 🆕 **開發新功能** — 從需求確認開始走完整流程
> 2. 🐛 **修正正式站 Bug** — 直接進修正流程
> 3. 🚑 **緊急 Rollback** — 正式站崩潰，要立刻還原
> 4. 🚀 **只做部署** — 程式碼已改好，直接 commit → staging → production

---

## 情境 1：開發新功能（完整流程）

### Step 1 — 需求確認
- Claude 提出規劃與 Phase 清單，等 ZY 確認後才開始動手。

### Step 2 — 修改程式碼
- 改完後說明「改了什麼、為什麼」，不在對話貼整份原始碼。
- 若修改了 `firebase-service.js`、`design.js` 或 `shared.js`，**提醒需要更新版本號**。

### Step 3 — Git Commit【不可跳過】
```bash
git add [修改的檔案]
git commit -m "feat: 描述改動內容"
```
> 先 Commit 才 Deploy，確保有乾淨還原點。

### Step 4 — 部署到測試站
```bash
firebase hosting:channel:deploy staging --expires 30d
```
告知 ZY 測試站網址：`https://stork11-embryo-lab--staging-cm9accey.web.app`

### Step 5 — 引導 ZY 執行 QA Check

提示 ZY 逐一確認以下五項：

```
① 環境確認：頁面頂端有橙色「⚠️ 測試模式」橫幅？
② 新功能確認：新功能操作正常？
③ 回歸測試：點 1-2 個舊功能，確認沒有崩潰？
④ 跨裝置測試：若改了 UI，用手機確認版面正常？
⑤ 邊界值測試：故意輸入 0、空白、極端值，系統有跳警告而非崩潰？
```

> ⚠️ 提醒：本機 `file:///` 開啟時 Firebase 無法連線，資料功能測試必須在測試站進行。

等 ZY 回覆「確認沒問題」才繼續。

### Step 6 — 部署到正式站

ZY 說「測試站確認沒問題，請部署到正式站」後執行：

```bash
firebase deploy --only hosting
```

部署完成後確認：
- 正式站 `https://stork11-embryo-lab.web.app` 開啟正常
- **沒有**橙色測試模式橫幅
- 版號顯示正確

---

## 情境 2：修正正式站 Bug

### 判斷是否有半成品在本機

先執行 `git status` 和 `git diff`，確認本機是否有尚未 commit 的開發中功能。

- **若有半成品**：提醒 ZY「本機有開發中的功能，Hotfix 將基於目前正式站的 Commit 進行，不會混入半成品。」然後：
  ```bash
  # 暫存半成品
  git stash
  # 查看正式站對應的 commit
  git log --oneline -5
  ```

- **若無半成品**：直接進行修正。

### 修正 → Commit → 部署

```bash
git add [修改的檔案]
git commit -m "fix: 描述修正內容"
firebase deploy --only hosting
```

若之前有 stash，修正完成後：
```bash
git stash pop  # 還原半成品繼續開發
```

---

## 情境 3：緊急 Rollback

```bash
# Step 1：找到穩定版本的 commit hash
git log --oneline -10

# Step 2：只還原 generated-pages（不切換 branch）
git checkout [Commit-Hash] -- generated-pages/

# Step 3：立刻 deploy
firebase deploy --only hosting

# Step 4：建立 revert commit
git commit -m "revert: rollback to [Commit-Hash]，原因：[問題描述]"
```

正式站恢復後告知 ZY，再慢慢 debug，debug 完走情境 1 或 2 重新上線。

---

## 情境 4：只做部署

```bash
# 確認有沒有未 commit 的改動
git status

# Commit（若有未存的改動）
git add [檔案]
git commit -m "feat/fix: 描述"

# 部署到測試站
firebase hosting:channel:deploy staging --expires 30d
```

引導 ZY 完成 QA Check（同 Step 5），確認後：

```bash
firebase deploy --only hosting
```

---

## 常駐提醒規則

在這個 skill 執行過程中，以下規則永遠生效：

- **先 Commit 才 Deploy**：若 ZY 要求直接 deploy 而沒有 commit，主動提醒並先 commit。
- **版本號同步**：每次改 `firebase-service.js`、`design.js`、`shared.js` 後，自動提醒更新所有 HTML 的 `?v=N`；ZY 說「請更新版本號」時統一升級。
- **資料相容性**：新增欄位時主動提醒 ZY「舊資料讀取需要向下相容（用 `?? 預設值` 處理 undefined）」。
- **測試站要有橙色 Banner**：部署到測試站後，提醒 ZY「請確認頁面頂端有橙色測試模式橫幅」。
- **正式站不能有 Banner**：部署到正式站後，確認正式站**沒有**橙色橫幅。

---

## 快速參考

| ZY 說的話 | Claude 做的事 |
|---|---|
| 「測試站確認沒問題，請部署到正式站」 | `firebase deploy --only hosting` |
| 「請更新版本號」 | 所有 HTML 的 `?v=N` 統一 +1 |
| 「請更新測試站」 | `firebase hosting:channel:deploy staging --expires 30d` |
| 「請立即 Rollback」 | 執行情境 3 的還原流程 |
| 「這次有加新欄位，請確保向下相容」 | 用 `?? 預設值` 處理所有新欄位的讀取 |
| 「請幫我清除這台裝置的快取」 | 引導 ZY 開啟 `clear-cache.html` |

---

## 環境資訊

| 項目 | 內容 |
|---|---|
| 正式站 | `https://stork11-embryo-lab.web.app` |
| 測試站 | `https://stork11-embryo-lab--staging-cm9accey.web.app` |
| 專案目錄 | `e:\ZYoooClaude\generated-pages\` |
| firebase-service.js 目前版本 | v7（2026-05-26）|
| SOP 完整版 | `100_Todo/projects/培養液管理系統/2026-04-29_系統需求規格_PRD.md` 第十六節 |
