---
name: reflect
description: "每日反思日誌 — 引導 ZY 回答 4 個問題，自動排版存入 300_Journal/YYYY-MM/YYYY-MM-DD.md。輸入 /reflect 啟動。"
---

# 每日反思 Skill（/reflect）

引導 ZY 完成每日反思，並自動存入日誌資料夾。整個流程不超過 5 分鐘。

---

## 執行流程（按順序，不可跳步）

### Step 0：確認日期與檔案狀態

執行 `date` 取得台北時間，計算出：
- `YYYY-MM-DD`（今日日期）
- `YYYY-MM`（月份，用於資料夾）
- 日誌路徑：`e:/ZYoooClaude/300_Journal/YYYY-MM/YYYY-MM-DD.md`

用 Bash 檢查檔案是否已存在：
```bash
test -f "e:/ZYoooClaude/300_Journal/YYYY-MM/YYYY-MM-DD.md" && echo "EXISTS" || echo "NEW"
```

- 若 **NEW**：直接進入 Step 1
- 若 **EXISTS**：用 AskUserQuestion 問：「今天的日誌已經有了，要**補充**到結尾，還是**重新寫**一篇？」
  - 補充 → 在現有檔案結尾加上分隔線後追加新內容
  - 重新寫 → 覆蓋原檔

---

### Step 1：問 4 個問題（用 AskUserQuestion，一次問一題）

問題順序與措辭如下，語氣輕鬆自然，不要官方：

**Q1：** 今天主要做了什麼？（工作、課程、生活都算，簡短描述就好）

**Q2：** 今天最大的收穫或心得是什麼？可以是觀念、技術、感受，或「還在消化中」也沒關係。

**Q3：** 有沒有卡住、還沒解決的事？或是讓你困惑、想繼續追的東西？（沒有的話直接說「沒有」）

**Q4：** 明天最想先做的一件事是什麼？

把四個回答分別存為 `A1` `A2` `A3` `A4`。

---

### Step 2：排版成日誌

依照以下格式組裝，語氣保留 ZY 原本的說話方式，不要過度潤飾：

```markdown
# YYYY-MM-DD 反思日誌

## 今天做了什麼

{A1}

---

## 最大收穫

{A2}

---

## 卡住或還沒解決的事

{A3}

---

## 明天先做這件事

{A4}
```

若 A3 是「沒有」，這段改為：

```markdown
## 卡住或還沒解決的事

今天沒有卡住的事。
```

---

### Step 3：存檔

1. 用 Bash 確認月份資料夾存在，不存在就建立：
   ```bash
   mkdir -p "e:/ZYoooClaude/300_Journal/YYYY-MM"
   ```

2. 用 Write 工具存入 `e:/ZYoooClaude/300_Journal/YYYY-MM/YYYY-MM-DD.md`

3. 存完後回報：
   > ✅ 日誌已存到 `300_Journal/YYYY-MM/YYYY-MM-DD.md`
   >
   > 今天也寫完了，明天繼續。

---

## 注意事項

- 永遠用 `date` 取得真實時間，不要假設日期
- 問題措辭可依 ZY 當下心情微調，但 4 題都要問完
- 不要在對話裡貼出整篇日誌內容，直接存檔就好
- 若 ZY 中途說「不想寫了」或「跳過」，尊重並結束，不存檔