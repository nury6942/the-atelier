#!/bin/zsh
# Atelier AI 워커 설치 (아이맥). 다시 돌려도 안전.
#   ./install.sh        설치·재시작
#   ./install.sh off    끄기 (plist 는 지움)
set -e
LABEL=com.nuri.atelier-ai-worker
DIR="$(cd "$(dirname "$0")" && pwd)"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"
LOG="$HOME/Library/Logs/atelier-ai-worker.log"
NODE="$(command -v node || echo /opt/homebrew/bin/node)"

if [ "$1" = "off" ]; then
  launchctl bootout gui/$(id -u)/$LABEL 2>/dev/null || true
  rm -f "$PLIST"
  echo "꺼짐"
  exit 0
fi

cd "$DIR" && PATH="$(dirname "$NODE"):$PATH" npm install --silent --no-audit --no-fund

cat > "$PLIST" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>$LABEL</string>
  <key>ProgramArguments</key>
  <array><string>$NODE</string><string>$DIR/worker.js</string></array>
  <key>WorkingDirectory</key><string>$DIR</string>
  <key>EnvironmentVariables</key>
  <dict>
    <key>HOME</key><string>$HOME</string>
    <key>PATH</key><string>$HOME/.local/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin</string>
  </dict>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>ThrottleInterval</key><integer>30</integer>
  <key>StandardOutPath</key><string>$LOG</string>
  <key>StandardErrorPath</key><string>$LOG</string>
</dict>
</plist>
EOF

launchctl bootout gui/$(id -u)/$LABEL 2>/dev/null || true
launchctl bootstrap gui/$(id -u) "$PLIST"
echo "설치됨 · 로그: $LOG"
