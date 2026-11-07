#!/bin/bash
# Postype Market 갱신 한 번 (월·목 05:00). launchd com.nuri.atelier-postype-market 가 부른다.
# 손으로: launchctl kickstart gui/$(id -u)/com.nuri.atelier-postype-market · 로그 ~/Library/Logs/atelier-postype-market.log
cd "$(dirname "$0")"
git -C ../.. pull -q --ff-only 2>/dev/null || true
/opt/homebrew/bin/node weekly.mjs "$@"
