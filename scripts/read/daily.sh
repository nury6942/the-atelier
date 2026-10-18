#!/bin/bash
# Read 탭 매일 글 — launchd(com.nuri.atelier-read, 맥북 매일 07:10)가 부름
# 오늘 글 2편 + 학습팩 + 링크 → data/read 만 커밋·푸시. 로그: ~/Library/Logs/atelier-read.log
export PATH="$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"
cd "$HOME/the-atelier" || exit 1
echo "=== $(date '+%F %T') ==="
git pull -q --rebase --autostash || { echo "pull 실패"; exit 1; }
node scripts/read/fetch.mjs
code=$?
if [ -n "$(git status --porcelain data/read)" ]; then
  git add data/read
  git commit -q -m "read: $(date +%F) 오늘의 글

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -- data/read
  for i in 1 2 3; do git pull -q --rebase --autostash && git push -q && { echo "푸시 완료"; break; }; sleep 20; done
else
  echo "바뀐 것 없음"
fi
exit $code
