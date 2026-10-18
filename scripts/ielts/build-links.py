# IELTS 링크 목록(무료 모의고사·유튜브) → js/ielts-links.js
# 사용: python3 scripts/ielts/build-links.py tests.json videos.json
import json, sys, os
tests = json.load(open(sys.argv[1])) if len(sys.argv) > 1 and os.path.exists(sys.argv[1]) else {'tests': []}
vids = json.load(open(sys.argv[2])) if len(sys.argv) > 2 and os.path.exists(sys.argv[2]) else {'videos': [], 'channels': []}
# 후기 점수(scripts/ielts/reviews.json) 가 있으면 시험 카드에 붙이고, 추가 추천 사이트는 비공식 카드로 넣는다
rev_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'reviews.json')
if os.path.exists(rev_path):
    rv = json.load(open(rev_path))
    by = {r['id']: r for r in rv.get('reviews', [])}
    for t in tests.get('tests', []):
        if t['id'] in by:
            t['review'] = by[t['id']]
    for i, x in enumerate(rv.get('extra', [])):
        tests.setdefault('tests', []).append({'id': 'extra-%d' % i, 'name': x['name'], 'provider': x['name'], 'official': False, 'area': x.get('area', 'full'), 'module': x.get('module', 'GT'), 'format': x.get('format', 'web'), 'count': None, 'login': None, 'url': x['url'], 'note': x.get('verdict', ''), 'review': x})
    if 'cambridge-books' in by:
        tests['books'] = by['cambridge-books']
out = {'checked': vids.get('checked') or tests.get('checked'), 'tests': tests.get('tests', []), 'videos': vids.get('videos', []), 'channels': vids.get('channels', []), 'books': tests.get('books')}
root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
with open(os.path.join(root, 'js', 'ielts-links.js'), 'w') as f:
    f.write('// IELTS 무료 모의고사 링크 + 유튜브 영상 목록 — scripts/ielts/build-links.py 가 만든 파일 (손으로 고치지 말 것)\n')
    f.write('window.IELTS_LINKS = ' + json.dumps(out, ensure_ascii=False, indent=1) + ';\n')
print('tests', len(out['tests']), 'videos', len(out['videos']), 'channels', len(out['channels']))
