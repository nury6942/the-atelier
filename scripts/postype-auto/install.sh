#!/bin/bash
# 포스타입 자동 동기화 설치 (맥북 한 번만). 매일 09:30 실행, 맥이 자고 있었으면 깨어날 때 실행.
# 끄기: launchctl bootout gui/$(id -u)/com.nuri.atelier-postype
set -e
LABEL=com.nuri.atelier-postype
DIR="$HOME/Library/Application Support/atelier-postype"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
mkdir -p "$DIR" "$HOME/Library/LaunchAgents"
# 저장소 위치가 바뀌어도 돌도록 실행 파일은 복사해 둔다
cp "$(dirname "$0")/run.sh" "$DIR/run.sh"; chmod +x "$DIR/run.sh"
cat > "$PLIST" <<PL
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key><array><string>/bin/bash</string><string>$DIR/run.sh</string></array>
  <key>StartCalendarInterval</key><dict><key>Hour</key><integer>9</integer><key>Minute</key><integer>30</integer></dict>
  <key>StandardErrorPath</key><string>$HOME/Library/Logs/atelier-postype.log</string>
</dict></plist>
PL
launchctl bootout "gui/$(id -u)/$LABEL" 2>/dev/null || true
launchctl bootstrap "gui/$(id -u)" "$PLIST"
echo "설치 완료: $PLIST"
