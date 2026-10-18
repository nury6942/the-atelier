# IELTS 링크 목록(무료 모의고사·유튜브) → js/ielts-links.js
# 사용: python3 scripts/ielts/build-links.py tests.json videos.json
import json, sys, os
tests = json.load(open(sys.argv[1])) if len(sys.argv) > 1 and os.path.exists(sys.argv[1]) else {'tests': []}
vids = json.load(open(sys.argv[2])) if len(sys.argv) > 2 and os.path.exists(sys.argv[2]) else {'videos': [], 'channels': []}
out = {'checked': vids.get('checked') or tests.get('checked'), 'tests': tests.get('tests', []), 'videos': vids.get('videos', []), 'channels': vids.get('channels', [])}
root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
with open(os.path.join(root, 'js', 'ielts-links.js'), 'w') as f:
    f.write('// IELTS 무료 모의고사 링크 + 유튜브 영상 목록 — scripts/ielts/build-links.py 가 만든 파일 (손으로 고치지 말 것)\n')
    f.write('window.IELTS_LINKS = ' + json.dumps(out, ensure_ascii=False, indent=1) + ';\n')
print('tests', len(out['tests']), 'videos', len(out['videos']), 'channels', len(out['channels']))
