#!/usr/bin/env bash
# sync-health.sh — 驗證 Claude Code 跨裝置同步架構是否健康
# 由 pro-kit 07 生成 · ZY-Agent

set -e
echo "🩺 sync-health.sh 開始體檢..."
echo ""
FAIL=0

# 檢查 1：~/.claude/ 底下的 Junction / symlink 是否正常
echo "[1/3] 檢查 ~/.claude/ 連結..."
CLAUDE="$HOME/.claude"

for item in skills commands; do
  link="$CLAUDE/$item"
  if [ -L "$link" ] || [ -d "$link" ]; then
    # 嘗試讀取
    if ls "$link" > /dev/null 2>&1; then
      target=$(readlink "$link" 2>/dev/null || echo "(Junction)")
      echo "  ✅ $item → $target"
    else
      echo "  ❌ $item 連結存在但無法讀取"
      FAIL=$((FAIL+1))
    fi
  else
    echo "  ❌ $item 連結不存在"
    FAIL=$((FAIL+1))
  fi
done

# settings.json 單獨確認（本機檔案，非同步）
if [ -f "$CLAUDE/settings.json" ]; then
  echo "  ✅ settings.json 存在（本機）"
else
  echo "  ⚠️  settings.json 不存在，請從備份還原"
  FAIL=$((FAIL+1))
fi

# 檢查 2：Google Drive 母體資料夾可存取
echo ""
echo "[2/3] 檢查 Google Drive 母體..."
MOTHER="/g/我的雲端硬碟/ZY-Agent"
if [ -d "$MOTHER/.claude/commands" ]; then
  echo "  ✅ Google Drive 母體可存取：$MOTHER"
else
  echo "  ❌ Google Drive 母體無法存取（G 槽是否掛載？）"
  FAIL=$((FAIL+1))
fi

# 檢查 3：MEMORY.md 可讀取
echo ""
echo "[3/3] 檢查記憶系統..."
MEMORY="$(dirname "$0")/../memory/MEMORY.md"
if [ -f "$MEMORY" ]; then
  echo "  ✅ MEMORY.md 可讀取（$(wc -l < "$MEMORY") 行）"
else
  echo "  ❌ MEMORY.md 讀不到：$MEMORY"
  FAIL=$((FAIL+1))
fi

echo ""
if [ "$FAIL" = "0" ]; then
  echo "🎉 全部正常！ZY 的 AI 分身活著。"
else
  echo "⚠️  發現 $FAIL 個問題，建議從 ~/claude-backup-* 檢查或重跑 pro-kit 07。"
  exit 1
fi
