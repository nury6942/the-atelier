#!/bin/bash
# 항공권 특가 — 아이맥 launchd com.nuri.flight-deals (매일 07:30 · 19:30)
#  구글 노선 페이지 → judge.js(1차) → 스카이스캐너 같은 날짜 → judge.js(2차) → 공홈 프로모션 → data/flight-deals 커밋·푸시 → 초특가·새 장거리 프로모션은 아이폰 미리알림
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
# 1차 판정(구글) → 특가 근처 도시만 스카이스캐너에서 같은 날짜로 다시 → 2차 판정
J1=$(node scripts/flight-deals/judge.js "$TMP" --first) || { LOG "판정 실패"; exit 1; }
TODO=$(echo "$J1" | grep '^SKY_TODO ' | sed 's/^SKY_TODO //')
SKYTMP=$(mktemp -t flightsky); trap 'rm -f "$TMP" "$SKYTMP"' EXIT
if [ -n "$TODO" ] && [ "$TODO" != "[]" ]; then
  aside repl "const TODO=$TODO; $(cat scripts/flight-deals/aside-sky.js)" 2>&1 | grep '^FLIGHT_SKY' > "$SKYTMP"
  LOG "스카이스캐너 $(grep -c '"ok":true' "$SKYTMP")/$(echo "$TODO" | grep -o '"slug"' | wc -l | tr -d ' ')곳"
fi
OUT=$(node scripts/flight-deals/judge.js "$TMP" "$SKYTMP") || { LOG "판정 실패"; exit 1; }
LOG "$(echo "$OUT" | grep -v '^ALERT')"
# 공홈 프로모션 (대한항공·아시아나·트리니티·에어프레미아 이벤트 목록)
PTMP=$(mktemp -t flightpromo); trap 'rm -f "$TMP" "$SKYTMP" "$PTMP"' EXIT
aside repl "$(cat scripts/flight-deals/aside-promo.js)" 2>&1 | grep '^FLIGHT_PROMO' > "$PTMP"
POUT=$(node scripts/flight-deals/promo.js "$PTMP") && LOG "$(echo "$POUT" | grep -v '^ALERT')" || LOG "프로모션 정리 실패"
printf '%s\n%s\n' "$OUT" "$POUT" | grep '^ALERT ' | sed 's/^ALERT //' | while IFS=$'\t' read -r KEY PRICE TITLE URL; do
  # 미리알림 권한 창이 안 눌려 있으면 영원히 기다리므로 40초 뒤 포기 → 알림 기록을 안 남겨서 다음 회차에 다시
  if perl -e 'alarm 40; exec @ARGV' osascript - "$TITLE" "$URL" <<'OSA' >/dev/null 2>&1
on run argv
  tell application "Reminders" to make new reminder with properties {name:(item 1 of argv), body:(item 2 of argv), due date:(current date)}
end run
OSA
  then node scripts/flight-deals/judge.js --mark "$KEY" "$PRICE"; LOG "알림 $TITLE"
  else LOG "알림 실패(다음 회차에 다시) — 아이맥 미리알림 권한 확인: $TITLE"; fi
done
git add data/flight-deals && git commit -qm "flights: $(date +%F) 특가 점검" && git push -q && LOG "푸시"
