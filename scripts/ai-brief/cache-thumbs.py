#!/usr/bin/env python3
"""AI Brief 미리보기 사진 보관 — 카드마다 작은 사진(가로 640, JPEG)을 data/ai-brief/thumbs/ 에 만들어 둔다.

왜 (누리 2026-11-05 "사진 안 뜨는 오류 제대로"):
  ① 깃허브 카드 사진(opengraph.githubassets.com)은 한 사람이 짧은 시간에 100장까지만 열려서 여러 날 넘겨 보면 막힌다.
  ② 대표 사진이 없는 사이트·글만 있는 X 글은 아예 빈칸이었다.
  → 원본 주소로 띄우던 걸 그만두고, 올라올 때 한 번 받아(없으면 페이지를 찍어) 사이트에 같이 둔다. 누리가 사이트 저장소에 두기로 정함.

쓰는 법:  python3 scripts/ai-brief/cache-thumbs.py 2026-11-05 [2026-11-04 …]   ·  all = 모든 날짜
필요한 것: Pillow, playwright(+chromium)  — GitHub Actions 에서 깔고 돈다.
"""
import hashlib, io, json, os, re, sys
from urllib.request import Request, urlopen
from PIL import Image

ROOT = os.path.join(os.path.dirname(__file__), '..', '..')
DATA = os.path.join(ROOT, 'data', 'ai-brief')
OUT = os.path.join(DATA, 'thumbs')
REL = 'data/ai-brief/thumbs/'
UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128 Safari/537.36'
W = 640
_browser = None


def key(url):
    return hashlib.sha1(url.encode()).hexdigest()[:16]


def save(img, path):
    img = img.convert('RGB')
    if img.width > W:
        img = img.resize((W, round(img.height * W / img.width)), Image.LANCZOS)
    if img.height > W:                         # 세로로 아주 긴 건 위쪽만
        img = img.crop((0, 0, img.width, W))
    img.save(path, 'JPEG', quality=78, optimize=True, progressive=True)


def download(src):
    req = Request(src, headers={'User-Agent': UA, 'Accept': 'image/*,*/*'})
    with urlopen(req, timeout=15) as r:
        if r.status != 200 or not r.headers.get('Content-Type', '').startswith('image/'):
            return None
        return Image.open(io.BytesIO(r.read(8_000_000)))


def browser():
    global _browser
    if _browser is None:
        from playwright.sync_api import sync_playwright
        pw = sync_playwright().start()
        _browser = pw.chromium.launch()
    return _browser


def shoot(url):
    """사진이 없으면 페이지를 찍는다. X 글은 공개 임베드(로그인 없이 보이는 글 카드)를 찍는다."""
    m = re.search(r'(?:x|twitter)\.com/[^/]+/status/(\d+)', url)
    page = browser().new_page(viewport={'width': 1280, 'height': 800}, device_scale_factor=1, user_agent=UA, locale='ko-KR')
    try:
        if m:
            page.set_viewport_size({'width': 560, 'height': 900})
            page.goto(f'https://platform.twitter.com/embed/Tweet.html?id={m.group(1)}&theme=light&lang=ko', wait_until='networkidle', timeout=30000)
            page.wait_for_timeout(2500)
            el = page.query_selector('article') or page.query_selector('#app')
            png = (el or page).screenshot()
        else:
            page.goto(url, wait_until='domcontentloaded', timeout=30000)
            page.wait_for_timeout(4500)
            png = page.screenshot()
        return Image.open(io.BytesIO(png))
    finally:
        page.close()


def thumb(item, stats):
    url = item.get('url') or ''
    if not url or 'threads.' in url:           # Threads 는 화면이 원문 미리보기 창으로 대신
        return
    name = key(url) + '.jpg'
    path = os.path.join(OUT, name)
    if item.get('thumb') == REL + name and os.path.exists(path):
        return
    img = None
    if item.get('image'):
        try:
            img = download(item['image'])
        except Exception as e:
            print('  받기 실패', item['image'][:80], e)
    how = '사진'
    if img is None:
        try:
            img, how = shoot(url), '캡처'
        except Exception as e:
            print('  캡처 실패', url[:80], e)
    if img is None:
        stats['fail'] += 1
        return
    save(img, path)
    item['thumb'] = REL + name
    stats[how] += 1


def threads_pic(post, stats):
    """Threads 는 사진 주소에 서명이 붙어 금방 만료 → 원문 미리보기(/embed/)를 열어 가장 큰 사진·영상 칸을 찍어 둔다."""
    url = (post.get('url') or '').rstrip('/')
    name = key(url) + '.jpg'
    path = os.path.join(OUT, name)
    if post.get('thumb') == REL + name and os.path.exists(path):
        return
    page = browser().new_page(viewport={'width': 560, 'height': 1400}, user_agent=UA, locale='ko-KR')
    try:
        page.goto(url + '/embed/', wait_until='networkidle', timeout=30000)
        page.wait_for_timeout(2500)
        best, area = None, 0
        for el in page.query_selector_all('img, video'):
            b = el.bounding_box()
            if not b or b['width'] < 160 or b['height'] < 120:      # 프로필 사진·아이콘 제외
                continue
            if b['width'] * b['height'] > area:
                best, area = el, b['width'] * b['height']
        if best is None:
            post['thumb'] = None                 # 글만 있는 글 — 화면은 사진 칸 없이
            stats['글만'] = stats.get('글만', 0) + 1
            return
        img = Image.open(io.BytesIO(best.screenshot()))
    except Exception as e:
        print('  Threads 실패', url[-40:], e)
        stats['fail'] += 1
        return
    finally:
        page.close()
    save(img, path)
    post['thumb'] = REL + name
    stats['캡처'] += 1


def run(day, stats):
    p = os.path.join(DATA, f'{day}.json')
    run_social(day, stats)
    if not os.path.exists(p):
        return
    B = json.load(open(p))
    for c in B.get('cards', []):
        thumb(c, stats)
        for e in c.get('examples', []):
            thumb(e, stats)
    for x in B.get('pickup', []):
        thumb(x, stats)
    json.dump(B, open(p, 'w'), ensure_ascii=False, indent=1)


def run_social(day, stats):
    p = os.path.join(DATA, 'social', f'{day}.json')
    if not os.path.exists(p):
        return
    S = json.load(open(p))
    for x in S.get('posts', []):
        if x.get('src') == 'threads' and x.get('media') and 'thumb' not in x:
            threads_pic(x, stats)
    json.dump(S, open(p, 'w'), ensure_ascii=False, indent=1)


def main():
    os.makedirs(OUT, exist_ok=True)
    days = sys.argv[1:] or json.load(open(os.path.join(DATA, 'index.json')))['dates'][:1]
    if days == ['all']:
        days = sorted(set(f[:10] for d in (DATA, os.path.join(DATA, 'social')) for f in os.listdir(d) if re.match(r'\d{4}-\d{2}-\d{2}\.json$', f)))
    stats = {'사진': 0, '캡처': 0, 'fail': 0}
    for d in days:
        run(d, stats)
        print(d, dict(stats))
    if _browser:
        _browser.close()
    print(f'끝: 사진 {stats["사진"]} · 캡처 {stats["캡처"]} · 실패 {stats["fail"]}')


if __name__ == '__main__':
    main()
