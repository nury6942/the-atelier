#!/usr/bin/env python3
"""AI Brief 미리보기 사진 보관 — 카드마다 작은 사진(가로 640, JPEG)을 data/ai-brief/thumbs/ 에 만들어 둔다.

왜 (누리 2026-11-05 "사진 안 뜨는 오류 제대로"):
  ① 깃허브 카드 사진(opengraph.githubassets.com)은 한 사람이 짧은 시간에 100장까지만 열려서 여러 날 넘겨 보면 막힌다.
  ② 대표 사진이 없는 사이트·글만 있는 X 글은 아예 빈칸이었다.
  → 원본 주소로 띄우던 걸 그만두고, 올라올 때 한 번 받아(없으면 페이지를 찍어) 사이트에 같이 둔다. 누리가 사이트 저장소에 두기로 정함.

쓰는 법:  python3 scripts/ai-brief/cache-thumbs.py 2026-11-05 [2026-11-04 …]   ·  all = 모든 날짜
필요한 것: Pillow, playwright(+chromium)  — GitHub Actions 에서 깔고 돈다.
"""
import hashlib, io, json, os, re, sys, time
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


def readme_pic(owner, repo):
    """깃허브 README 의 첫 실물 사진·GIF (배지·아이콘·SVG 제외). 저장소 공유 그림은 글자뿐이라 이게 먼저 (누리 11/05)"""
    hdr = {'User-Agent': UA, 'Accept': 'application/vnd.github.raw'}
    if os.environ.get('GITHUB_TOKEN'):
        hdr['Authorization'] = 'Bearer ' + os.environ['GITHUB_TOKEN']
    try:
        with urlopen(Request(f'https://api.github.com/repos/{owner}/{repo}/readme', headers=hdr), timeout=15) as r:
            md = r.read(400_000).decode('utf-8', 'ignore')
    except Exception as e:
        print('  README 못 읽음', owner, repo, e)
        return None
    srcs = re.findall(r'!\[[^\]]*\]\(\s*<?([^)\s>]+)', md) + re.findall(r'<img[^>]+src=["\']([^"\']+)', md, re.I)
    # 문서 순서대로
    srcs.sort(key=lambda u: md.find(u))
    for u in srcs:
        low = u.lower()
        if any(b in low for b in ('shields.io', 'badge', 'badgen', '.svg', 'star-history', 'contrib.rocks', 'logo', 'icon', 'avatar', 'favicon')):
            continue
        if not u.startswith('http'):
            u = f'https://raw.githubusercontent.com/{owner}/{repo}/HEAD/' + u.lstrip('./')
        elif 'github.com/' in u and '/blob/' in u:
            u = u.replace('github.com/', 'raw.githubusercontent.com/').replace('/blob/', '/')
        try:
            img = download(u)
        except Exception:
            continue
        if img is not None and img.width >= 360 and img.height >= 180:
            return img
    return None


def browser():
    global _browser
    if _browser is None:
        from playwright.sync_api import sync_playwright
        pw = sync_playwright().start()
        _browser = pw.chromium.launch()
    return _browser


def thumb(item, stats):
    """원문에 실물 사진이 있을 때만 보관한다 (누리 11/05: "원문에 이미지가 없으면 넣을 필요 없어").
    깃허브 = README 첫 사진·GIF, 그 밖 = 원문 대표 사진(og:image). 페이지 캡처·깃허브 글자 카드는 안 씀 → 없으면 사진 칸 없이."""
    url = item.get('url') or ''
    if not url or 'threads.' in url:           # Threads 는 화면이 원문 미리보기 창으로 대신
        return
    name = key(url) + '.jpg'
    path = os.path.join(OUT, name)
    if item.get('thumb') == REL + name and os.path.exists(path):
        return
    img, how = None, '사진'
    m = re.match(r'https?://github\.com/([^/]+)/([^/#?]+)', url)
    if m:
        if m.group(2) not in ('issues', 'pulls'):
            img, how = readme_pic(m.group(1), m.group(2)), 'README'
    elif item.get('image') and 'opengraph.githubassets.com' not in item['image']:
        try:
            img = download(item['image'])
        except Exception as e:
            print('  받기 실패', item['image'][:80], e)
    if img is None:
        item.pop('thumb', None)
        stats['없음'] = stats.get('없음', 0) + 1
        return
    save(img, path)
    item['thumb'] = REL + name
    item['thumb_src'] = 'readme' if how == 'README' else 'site'
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
        # 첫 장(캐러셀이면 맨 왼쪽)을 원본 주소로 받는다 — 지금은 서명이 살아 있어서 받아진다.
        # 화면 찍기로 하면 옆으로 밀린 캐러셀 사진 대신 글 카드 전체가 찍히는 사고(withbeno, 11/05)
        img = None
        for el in page.query_selector_all('img, video'):
            b = el.bounding_box()
            if not b or b['width'] < 160 or b['height'] < 120:      # 프로필 사진·아이콘 제외
                continue
            src = el.evaluate("e => e.poster || e.currentSrc || e.src || ''")
            try:
                r = page.request.get(src, timeout=20000) if src else None
                if r and r.ok and r.headers.get('content-type', '').startswith('image/'):
                    img = Image.open(io.BytesIO(r.body()))
            except Exception as e:
                print('  받기 실패', src[:60], e)
            if img is None and b['x'] >= 0 and b['x'] + b['width'] <= 562:
                img = Image.open(io.BytesIO(el.screenshot()))
            if img is not None:
                break
        if img is None:
            post['thumb'] = None                 # 글만 있는 글 — 화면은 사진 칸 없이
            stats['글만'] = stats.get('글만', 0) + 1
            return
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
            time.sleep(2)                    # 몰아서 열면 Threads 가 잠깐 막는다(11/05 141건 실패)
    json.dump(S, open(p, 'w'), ensure_ascii=False, indent=1)


def main():
    os.makedirs(OUT, exist_ok=True)
    days = sys.argv[1:] or json.load(open(os.path.join(DATA, 'index.json')))['dates'][:1]
    if days == ['all']:
        days = sorted(set(f[:10] for d in (DATA, os.path.join(DATA, 'social')) for f in os.listdir(d) if re.match(r'\d{4}-\d{2}-\d{2}\.json$', f)))
    stats = {'사진': 0, 'README': 0, '캡처': 0, 'fail': 0, '없음': 0}
    for d in days:
        run(d, stats)
        print(d, dict(stats))
    if _browser:
        _browser.close()
    print('끝:', stats)


if __name__ == '__main__':
    main()
