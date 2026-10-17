#!/bin/bash
# [보관] 포스타입 매출 → atelier 매일 자동 동기화 — 누리 크롬 AppleScript 버전
# 2026-10-18 부터 run.js(전용 프로필 헤드리스 크롬)로 교체. 누리 크롬이 꼬이면(-1712) 멈춰서.
#
#  1. 누리 크롬에 포스타입 수익 페이지 탭을 연다 (누리 로그인 그대로 사용, 비밀번호 저장 없음)
#  2. GitHub 의 scripts/postype-bookmarklet.js 를 자동 모드로 실행
#     → 마지막 동기화 날 -1일 00:00 부터 지금까지 수집 → atelier 탭으로 넘겨 Firestore 저장
#  3. <html data-atelier-sync> 상태를 읽어 끝나면 탭을 닫고 로그를 남김
#     로그인 풀림·실패면 맥 알림 (누리는 크롬에서 포스타입 로그인만 다시 하면 됨)
#
# 설치: scripts/postype-auto/install.sh   로그: ~/Library/Logs/atelier-postype.log
# 지금 한 번 돌리기: launchctl kickstart gui/$(id -u)/com.nuri.atelier-postype

LOG="$HOME/Library/Logs/atelier-postype.log"
URL="https://www.postype.com/point/earnings/list"
SRC="https://raw.githubusercontent.com/nury6942/the-atelier/main/scripts/postype-bookmarklet.js"
log() { echo "$(date '+%Y-%m-%d %H:%M:%S') $*" >> "$LOG"; }
notify() { osascript -e "display notification \"$1\" with title \"atelier 포스타입 동기화\"" >/dev/null 2>&1; }

# 같은 날 이미 성공했으면 건너뜀 (잠자다 깨서 두 번 불려도 한 번만)
STAMP="$HOME/Library/Application Support/atelier-postype/last-success"
mkdir -p "$(dirname "$STAMP")"
if [ "$1" != "--force" ] && [ "$(cat "$STAMP" 2>/dev/null)" = "$(date +%F)" ]; then exit 0; fi

if ! pgrep -xq "Google Chrome"; then
  open -g -a "Google Chrome"; sleep 8
fi

# 탭 열기 → 로드 대기 → 자동 모드 실행. 탭 id 를 돌려받는다
TAB_ID=$(osascript <<OSA 2>>"$LOG"
tell application "Google Chrome"
  if (count of windows) = 0 then make new window
  set w to front window
  set t to make new tab at end of tabs of w with properties {URL:"$URL"}
  set tid to id of t
  repeat 60 times
    delay 1
    if not (loading of t) then exit repeat
  end repeat
  delay 2
  execute t javascript "document.documentElement.dataset.atelierSync=''; fetch('$SRC?t='+Date.now()).then(r=>r.text()).then(s=>{ window.__ATELIER_POSTYPE_AUTO = {}; eval(s); }).catch(e=>{ document.documentElement.dataset.atelierSync = JSON.stringify({state:'error',reason:'load',message:e.message}); }); 'ok'"
  return tid
end tell
OSA
)
log "tab=$TAB_ID"
if [ -z "$TAB_ID" ]; then log "ERROR 크롬 탭을 열지 못함"; notify "크롬 탭을 열지 못했어요"; exit 1; fi

# 상태 읽기 (최대 8분)
STATE=""
for i in $(seq 1 96); do
  sleep 5
  STATE=$(osascript -e "tell application \"Google Chrome\"
    repeat with w in windows
      repeat with t in tabs of w
        if (id of t as string) is \"$TAB_ID\" then return execute t javascript \"document.documentElement.dataset.atelierSync || ''\"
      end repeat
    end repeat
    return \"tab-gone\"
  end tell" 2>>"$LOG")
  case "$STATE" in *'"state":"done"'*|*'"state":"error"'*|tab-gone) break;; esac
done

osascript -e "tell application \"Google Chrome\"
  repeat with w in windows
    repeat with t in tabs of w
      if (id of t as string) is \"$TAB_ID\" then
        close t
        return
      end if
    end repeat
  end repeat
end tell" >/dev/null 2>&1

case "$STATE" in
  *'"state":"done"'*)
    log "OK $STATE"; date +%F > "$STAMP" ;;
  *'"reason":"login"'*)
    log "LOGIN $STATE"; notify "포스타입 로그인이 풀렸어요. 크롬에서 다시 로그인해 주세요" ;;
  *)
    log "FAIL ${STATE:-timeout}"; notify "동기화 실패 — 내일 다시 시도해요 (로그: ~/Library/Logs/atelier-postype.log)" ;;
esac
