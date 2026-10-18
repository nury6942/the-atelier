#!/bin/bash
# IELTS Writing/Speaking 자동 채점 — launchd com.nuri.ielts-grade 가 5분마다 부른다.
# 지금 한 번: launchctl kickstart gui/$(id -u)/com.nuri.ielts-grade   로그: ~/Library/Logs/ielts-grade.log
DIR="$(cd "$(dirname "$0")" && pwd)"
LOCK="${TMPDIR:-/tmp}/ielts-grade.lock"
# 이전 실행이 아직 채점 중이면 겹치지 않게 건너뜀 (30분 넘은 잠금은 낡은 것으로 보고 치움)
if ! mkdir "$LOCK" 2>/dev/null; then
  if [ -n "$(find "$LOCK" -maxdepth 0 -mmin +30 2>/dev/null)" ]; then rm -rf "$LOCK"; mkdir "$LOCK" || exit 0; else exit 0; fi
fi
trap 'rm -rf "$LOCK"' EXIT
export PATH="$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
/usr/bin/python3 "$DIR/grade.py"
