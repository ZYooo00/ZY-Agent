#!/usr/bin/env python3
"""
提取 Claude Code 對話紀錄（2026-04-28T15:41:00Z 之後的所有對話視窗）
輸出為可讀的 Markdown 格式，按對話視窗分檔
"""

import json
import os
import re
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

sys.stdout.reconfigure(encoding="utf-8")

# ── 設定路徑 ──
PROJECTS_DIR = Path(r"C:\Users\User\.claude\projects\e--ZYoooClaude")
OUTPUT_DIR = Path(r"e:\ZYoooClaude\000_Agent\claude-history\beipan-dev-journey")
CUTOFF_TIME = datetime(2026, 4, 28, 15, 41, 0, tzinfo=timezone.utc)
TAIPEI_TZ = timezone(timedelta(hours=8))


def parse_timestamp(ts_str):
    try:
        return datetime.fromisoformat(ts_str.replace("Z", "+00:00"))
    except Exception:
        return None


def to_taipei(dt):
    return dt.astimezone(TAIPEI_TZ)


def fmt_taipei(dt):
    return to_taipei(dt).strftime("%Y-%m-%d %H:%M") if dt else ""


def extract_text(content):
    """從 message.content 提取純文字，跳過 tool_use / tool_result block"""
    if isinstance(content, str):
        return content.strip()
    if isinstance(content, list):
        parts = []
        for block in content:
            if isinstance(block, dict) and block.get("type") == "text":
                t = block.get("text", "").strip()
                if t:
                    parts.append(t)
        return "\n".join(parts)
    return ""


IDE_FILE_RE = re.compile(
    r"<ide_opened_file>The user opened the file (.*?) in the IDE\..*?</ide_opened_file>",
    re.DOTALL,
)


def clean_user_text(text):
    """把 ide_opened_file 標籤轉成可讀提示，保留 ZY 的實際輸入"""
    def replace_ide(m):
        filepath = m.group(1).strip()
        # 只取最後的檔名
        filename = filepath.replace("\\", "/").split("/")[-1]
        return f"[📄 ZY 在 IDE 開啟了 {filename}]\n"
    return IDE_FILE_RE.sub(replace_ide, text).strip()


def process_jsonl(jsonl_path):
    """解析單一 JSONL，回傳 session 元資料 + 對話清單"""
    messages = []
    first_ts = None
    slug = None
    session_id = jsonl_path.stem

    try:
        with open(jsonl_path, "r", encoding="utf-8", errors="replace") as f:
            for raw_line in f:
                line = raw_line.strip()
                if not line:
                    continue
                try:
                    obj = json.loads(line)
                except json.JSONDecodeError:
                    continue

                ts = parse_timestamp(obj.get("timestamp", ""))
                obj_type = obj.get("type", "")

                # 取 slug（對話視窗標題，有些視窗有，有些沒有）
                if slug is None and obj.get("slug"):
                    slug = obj["slug"]

                if obj_type == "user":
                    if first_ts is None and ts:
                        first_ts = ts
                    raw_text = extract_text(obj.get("message", {}).get("content", ""))
                    clean = clean_user_text(raw_text)
                    if clean:
                        messages.append({"role": "ZY", "ts": ts, "text": clean})

                elif obj_type == "assistant":
                    if first_ts is None and ts:
                        first_ts = ts
                    raw_text = extract_text(obj.get("message", {}).get("content", ""))
                    if raw_text:
                        messages.append({"role": "YOHOHO", "ts": ts, "text": raw_text})

                elif obj_type == "summary":
                    # Compacted 摘要：保留並標記
                    summary = obj.get("summary", "") or obj.get("content", "")
                    if isinstance(summary, list):
                        summary = "\n".join(
                            b.get("text", "") for b in summary
                            if isinstance(b, dict) and b.get("type") == "text"
                        )
                    if summary:
                        messages.append({
                            "role": "SYSTEM",
                            "ts": ts,
                            "text": f"[⚠️ 此段對話已被系統壓縮，以下為摘要]\n\n{summary.strip()}",
                        })

    except Exception as e:
        print(f"  ❌ 讀取失敗：{jsonl_path.name} — {e}")
        return None

    return {
        "session_id": session_id,
        "slug": slug,
        "first_ts": first_ts,
        "messages": messages,
    }


def write_session_md(session, output_dir):
    """把一個對話視窗寫成 Markdown 檔案"""
    ts = session["first_ts"]
    taipei_ts = to_taipei(ts)
    slug = session["slug"] or session["session_id"][:8]
    filename = f"{taipei_ts.strftime('%Y-%m-%d_%H-%M')}_{slug}.md"
    filepath = output_dir / filename

    msgs = session["messages"]
    title = slug.replace("-", " ").title()

    # 取第一則 ZY 訊息作為摘要
    first_zy = next((m for m in msgs if m["role"] == "ZY"), None)
    preview = (first_zy["text"][:80].replace("\n", " ") + "…") if first_zy else "(無內容)"

    lines = [
        f"# {title}",
        f"",
        f"**台北時間**：{taipei_ts.strftime('%Y-%m-%d %H:%M')}  ",
        f"**Session ID**：{session['session_id']}  ",
        f"**訊息總數**：{len(msgs)}  ",
        f"**開頭摘要**：{preview}  ",
        "",
        "---",
        "",
    ]

    for msg in msgs:
        ts_label = fmt_taipei(msg["ts"])
        role = msg["role"]
        text = msg["text"]

        if role == "SYSTEM":
            # 壓縮摘要用引用區塊
            for sub_line in text.split("\n"):
                lines.append(f"> {sub_line}")
        else:
            lines.append(f"**{role}**（{ts_label}）：")
            lines.append("")
            lines.append(text)

        lines.append("")
        lines.append("---")
        lines.append("")

    filepath.write_text("\n".join(lines), encoding="utf-8")
    return filename, preview


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # 找所有主要 JSONL（只在根目錄，排除 subagents/ 子資料夾）
    all_jsonl = sorted(PROJECTS_DIR.glob("*.jsonl"))
    print(f"掃描到 {len(all_jsonl)} 個主要 JSONL 檔案\n")

    sessions = []
    for jsonl_path in all_jsonl:
        data = process_jsonl(jsonl_path)
        if data is None:
            continue
        if data["first_ts"] is None:
            continue
        if data["first_ts"] >= CUTOFF_TIME:
            sessions.append(data)
            print(f"  ✅ {data['session_id'][:8]}  |  {fmt_taipei(data['first_ts'])}  |  {len(data['messages'])} 則  |  slug={data['slug'] or '(無)'}")

    print(f"\n符合條件的對話視窗：{len(sessions)} 個\n")

    # 按時間由舊到新排序
    sessions.sort(key=lambda s: s["first_ts"])

    # 逐一輸出 Markdown
    index_rows = []
    for session in sessions:
        filename, preview = write_session_md(session, OUTPUT_DIR)
        ts_str = fmt_taipei(session["first_ts"])
        msg_count = len(session["messages"])
        index_rows.append(f"| {ts_str} | [{filename}]({filename}) | {msg_count} | {preview} |")
        print(f"  📄 {filename}")

    # 輸出索引
    now_str = datetime.now(TAIPEI_TZ).strftime("%Y-%m-%d %H:%M")
    index_lines = [
        "# beipan 開發歷程 — 對話視窗索引",
        "",
        f"**產生時間**：{now_str}（台北時間）  ",
        f"**對話視窗總數**：{len(sessions)}  ",
        "",
        "| 台北時間 | 檔案 | 訊息數 | 開頭摘要 |",
        "|---|---|---|---|",
    ] + index_rows

    index_path = OUTPUT_DIR / "000_INDEX.md"
    index_path.write_text("\n".join(index_lines), encoding="utf-8")

    print(f"\n✅ 全部完成！")
    print(f"   輸出資料夾：{OUTPUT_DIR}")
    print(f"   共 {len(sessions)} 個對話視窗，索引：000_INDEX.md")


if __name__ == "__main__":
    main()
