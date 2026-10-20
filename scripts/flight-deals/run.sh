#!/bin/bash
# 항공권 특가 — 아이맥 launchd com.nuri.flight-deals (매일 07:30 · 19:30)
#  구글 항공편 노선 페이지를 Aside 로 읽고 → judge.js → data/flight-deals 커밋·푸시 → 초특가는 아이폰 미리알림
export PATH=/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$HOME/.local/bin
cd "$(dirname "$0")/../.." || exit 1
LOG() { echo "$(date '+%F %T') $*"; }
git pull -q --rebase 2>&1 | tail -2
TMP=$(mktemp -t flightdeals); trap 'rm -f "$TMP"' EXIT
ALL=$(/usr/bin/python3 -c "import json;print(' '.join(s for v in json.load(open('scripts/flight-deals/cities.json')).values() for s in v))")
set -- $ALL
while [ $# -gt 0 ]; do
  B=(); for i in 1 2 3 4 5 6 7; do [ $# -gt 0 ] && B+=("'$1'") && shift; done
  LIST=$(IFS=,; echo "${B[*]}")
  aside repl "const CITIES=[$LIST]; $(cat scripts/flight-deals/aside-route.js)" 2>&1 | grep '^FLIGHT_ROUTE' >> "$TMP"
done
LOG "수집 $(grep -c '"ok":true' "$TMP")줄"
OUT=$(node scripts/flight-deals/judge.js "$TMP") || { LOG "판정 실패"; exit 1; }
LOG "$(echo "$OUT" | grep -v '^ALERT')"
echo "$OUT" | grep '^ALERT ' | sed 's/^ALERT //' | while IFS=$'\t' read -r TITLE URL; do
  LOG "알림 $TITLE"
  # 미리알림 권한 창이 안 눌려 있으면 영원히 기다리므로 40초 뒤 포기 (다음 회차에 다시)
  perl -e 'alarm 40; exec @ARGV' osascript - "$TITLE" "$URL" <<'OSA' >/dev/null 2>&1 || LOG "알림 실패 — 아이맥에서 미리알림 권한 확인"
on run argv
  tell application "Reminders" to make new reminder with properties {name:(item 1 of argv), body:(item 2 of argv), due date:(current date)}
end run
OSA
done
git add data/flight-deals && git commit -qm "flights: $(date +%F) 특가 점검" && git push -q && LOG "푸시"
