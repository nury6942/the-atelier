#!/bin/bash
# Taste 수집 한 번: 공간·숙소(collect.js) → 문화생활(culture.js). launchd com.nuri.atelier-taste 가 부른다.
cd "$(dirname "$0")"
git -C ../.. pull -q --ff-only 2>/dev/null || true
/opt/homebrew/bin/node collect.js "$@"
/opt/homebrew/bin/node culture.js
