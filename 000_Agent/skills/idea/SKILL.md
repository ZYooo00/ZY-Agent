---
name: idea
description: ZY 的每日想法整理 Skill。當 ZY 說「/idea」、「回顧今天」、「整理今天的想法」、「整理 Idea」、「看一下想法」、「有什麼新紀錄」、「想法收件匣」時，立即啟動此 Skill。這個 Skill 會讀取 ZY 在手機 Google Tasks 記下的新想法，協助分類、去重、決定每筆想法的處理方式，並推薦本週優先執行項目。只要 ZY 提到想回顧手機筆記、整理靈感、或不知道接下來要做什麼，都應該主動觸發此 Skill。
---

# Idea 每日想法整理

ZY 會在外出時用手機 Google Tasks 的「隨手記」清單記下各種靈感，晚上回到電腦前用這個 Skill 一次整理。你的工作是：讀取新想法 → 找出重複 → 協助分類 → 推薦優先順序。

## Google Tasks 清單 ID

| 清單 | 用途 | ID |
|------|------|----|
| 隨手記 | 手機隨手記下、尚未整理的想法 | Z19najk4LTZCUWJaV0poYg |
| 已排定 | 已確認要執行、列入計畫的項目 | cXhnMHY2OG53M2tLRXRHYQ |
| 靈感庫 | 好想法但暫不執行，保留觀察 | ZHh5S0RVUzIxZWpxRDR3Mw |

上次讀取時間點存在：`e:/ZYoooClaude/000_Agent/tasks_last_checked.txt`

## 執行步驟

### 第一步：讀取新想法

1. 讀取 `e:/ZYoooClaude/000_Agent/tasks_last_checked.txt` 取得上次讀取時間（UTC ISO 格式）
2. 只讀取「隨手記」清單的未完成項目（這是 ZY 在手機上記東西的地方）：
   ```
   gws tasks tasks list --params '{"tasklist":"Z19najk4LTZCUWJaV0poYg","showCompleted":false}'
   ```
3. 篩選 `updated` 時間**晚於**上次讀取時間點的項目，這些就是「新想法」

如果沒有新想法，告訴 ZY「這次沒有新的紀錄」，並詢問是否想回顧靈感庫的舊想法。

### 第二步：偵測重複

讀取「靈感庫」現有項目做比對：
```
gws tasks tasks list --params '{"tasklist":"ZHh5S0RVUzIxZWpxRDR3Mw","showCompleted":false}'
```
把新想法和靈感庫的既有項目一起比對，找出語義相近的組合，例如「記錄學習」和「建立學習筆記系統」屬於同一件事。

列出重複候選，格式：
> ⚠️ 這兩筆可能是同一件事，要合併嗎？
> - A：「XXX」（隨手記，10:30）
> - B：「YYY」（靈感庫，3 天前）

### 第三步：逐筆分類

每筆新想法請 ZY 確認屬於哪一類：

- **[人格]** 適合加進 CLAUDE.md 的行為規則或偏好
  → 直接幫 ZY 加進 `CLAUDE.md` 的 NEVER/ALWAYS 清單，再確認
- **[專案]** 需要規劃和執行的事（可能要花超過 30 分鐘）
  → 移至「已排定」清單，詢問是否現在就建立 `100_Todo/projects/` 草稿
- **[靈感]** 暫時保留、不確定要不要做
  → 移至「靈感庫」清單，不急著處理

分類時不要一次丟所有項目給 ZY，**一筆一筆來**，等他確認後再繼續下一筆。

### 第四步：推薦優先順序

全部分類完後，從「已排定」清單裡挑出 1-2 個本週建議優先執行的項目，推薦依據：
1. 這件事 ZY **每週遇到幾次**？頻率越高越優先
2. **我（AI）能幫多少**？我能完全自動化的比需要 ZY 大量手動操作的優先

推薦格式：
> 🎯 本週建議先做：**XXX**
> 原因：你每天都會遇到，而且我可以直接幫你建好整套流程。

### 第五步：收尾

1. 已確認分類完成的「隨手記」項目，標記為完成（注意：要用 `patch`，且 body 要帶 `id` 欄位）：
   ```
   gws tasks tasks patch --params '{"tasklist":"Z19najk4LTZCUWJaV0poYg","task":"<task_id>"}' --json '{"id":"<task_id>","status":"completed"}'
   ```
2. 把這次處理的所有想法追加寫入 `e:/ZYoooClaude/000_Agent/idea_log.md`，格式：
   ```
   ## YYYY-MM-DD
   - [人格] 想法內容 → 已加進 CLAUDE.md
   - [專案] 想法內容 → 已移至「已排定」，建立草稿 / 待建立草稿
   - [靈感] 想法內容 → 已移至「靈感庫」
   - [略過] 想法內容 → ZY 決定不處理
   ```
3. 把當下時間（UTC）寫入 `e:/ZYoooClaude/000_Agent/tasks_last_checked.txt`
4. 問 ZY：「要繼續深聊哪個想法，還是今天先到這裡？」

## 注意事項

- 語氣輕鬆，像朋友在聊天，不要太正式
- 一次只問一件事，不要把多個問題堆在同一則訊息
- ZY 是非工程師背景，技術細節用比喻說明
- 如果某筆想法很模糊，主動問一個問題幫他釐清，而不是直接猜分類