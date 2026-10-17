#!/bin/bash
# 포스타입 자동 동기화 설치 (아이맥 한 번만). 매일 09:30 실행, 맥이 자고 있었으면 깨어날 때 실행.
# 전용 크롬 프로필로 헤드리스 실행(run.js) — 누리가 쓰는 크롬과 분리. 처음엔 로그인 한 번:
#   /usr/local/bin/node "$HOME/Library/Application Support/atelier-postype/run.js" --login
# 끄기: launchctl bootout gui/$(id -u)/com.nuri.atelier-postype
set -e
LABEL=com.nuri.atelier-postype
DIR="$HOME/Library/Application Support/atelier-postype"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
NODE=/usr/local/bin/node
mkdir -p "$DIR" "$HOME/Library/LaunchAgents"
# 저장소 위치가 바뀌어도 돌도록 실행 파일은 복사해 둔다
SRC="$(dirname "$0")"
cp "$SRC/run.js" "$SRC/package.json" "$DIR/"
cp "$SRC/run-chrome.sh" "$DIR/run-chrome.sh"; chmod +x "$DIR/run-chrome.sh"   # 예전 방식 보관용
(cd "$DIR" && npm install --omit=dev --no-audit --no-fund)
cat > "$PLIST" <<PL
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key><array><string>$NODE</string><string>$DIR/run.js</string></array>
  <key>WorkingDirectory</key><string>$DIR</string>
  <key>EnvironmentVariables</key><dict><key>PATH</key><string>/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string></dict>
  <key>StartCalendarInterval</key><dict><key>Hour</key><integer>9</integer><key>Minute</key><integer>30</integer></dict>
  <key>StandardOutPath</key><string>$HOME/Library/Logs/atelier-postype.log</string>
  <key>StandardErrorPath</key><string>$HOME/Library/Logs/atelier-postype.log</string>
</dict></plist>
PL
launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"
echo "설치 완료: $PLIST"
[ -d "$DIR/profile" ] || echo "처음 한 번 로그인: $NODE \"$DIR/run.js\" --login"
