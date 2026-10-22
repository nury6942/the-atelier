#!/bin/bash
# 항공권 특가 — 아이맥 launchd com.nuri.flight-deals (매일 07:30 · 19:30)
#  구글 노선 페이지 → judge.js(1차) → 스카이스캐너 같은 날짜 → judge.js(2차) → 공홈 프로모션 → data/flight-deals 커밋·푸시 (아이폰 알림 없음 — 사이트 TRAVEL › Flight Deals 에서 확인)
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
# 새 프로모션 상세(구매·탑승 기간, 지역별 할인율, 조건) → claude -p 로 구조화 (한 번 읽은 건 다시 안 읽음)
DTODO=$(node scripts/flight-deals/promo-detail.js todo | sed 's/^PROMO_TODO //')
if [ -n "$DTODO" ] && [ "$DTODO" != "[]" ]; then
  DTMP=$(mktemp -t flightpd)
  aside repl "const TODO=$DTODO; $(cat scripts/flight-deals/aside-promo-detail.js)" 2>&1 | grep '^FLIGHT_PROMO_DETAIL' > "$DTMP"
  LOG "$(node scripts/flight-deals/promo-detail.js extract "$DTMP" 2>&1 | tail -1)"; rm -f "$DTMP"
fi
# 유류할증료: 달이 바뀌었으면 대한항공 공지를 다시 읽는다
YM=$(date +%Y-%m); FTMP=$(mktemp -t flightfuel)
if ! grep -q "\"month\": \"$YM\"" data/flight-deals/fuel.json 2>/dev/null; then
  aside repl "const YM='$YM'; $(cat scripts/flight-deals/aside-fuel.js)" 2>&1 | grep '^FLIGHT_FUEL' > "$FTMP"
fi
# 프로모션 쓰면 얼마: 대표 도시·날짜를 스카이스캐너에서 → 운임에만 할인 적용
ETODO=$(node scripts/flight-deals/promo-price.js todo | sed 's/^SKY_TODO //')
ESKY=$(mktemp -t flightesky)
node -e 'const t=JSON.parse(process.argv[1]||"[]");for(let i=0;i<t.length;i+=4)console.log(JSON.stringify(t.slice(i,i+4)))' "$ETODO" | while read -r B; do
  aside repl "const TODO=$B; $(cat scripts/flight-deals/aside-sky.js)" 2>&1 | grep '^FLIGHT_SKY' >> "$ESKY"
done
LOG "$(node scripts/flight-deals/promo-price.js apply "$ESKY" "$FTMP" 2>&1 | tail -1)"; rm -f "$ESKY" "$FTMP"
# 아이폰 미리알림은 끔(2026-10-22 누리: 사이트에서 직접 볼게) — judge·promo 의 ALERT 줄은 무시한다
git add data/flight-deals && git commit -qm "flights: $(date +%F) 특가 점검" && git push -q && LOG "푸시"
