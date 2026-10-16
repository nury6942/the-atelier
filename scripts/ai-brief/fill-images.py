#!/usr/bin/env python3
"""AI Brief 빈 사진 채우기 — 그날 JSON 에서 image 가 비었거나 깨진 칸을 원문에서 찾아 채운다.

쓰는 법:  python3 scripts/ai-brief/fill-images.py 2026-10-16
  (날짜를 빼면 index.json 의 가장 최근 날짜)

찾는 순서
  x.com/…/status/ID  → X 공개 임베드(syndication)의 첫 사진·영상 썸네일·링크 카드 이미지
  github.com/주인/리포 → opengraph.githubassets.com 카드
  그 밖               → 페이지의 og:image / twitter:image (상대 주소는 절대 주소로)
  threads.com        → 건너뜀(사진 주소에 서명 토큰이 붙고 금방 만료됨, 화면이 원문 미리보기로 대신)
찾은 주소는 실제로 이미지가 오는지(HTTP 200 + image/*) 확인한 것만 쓴다. 표준 라이브러리만 쓴다(클라우드 루틴에서도 돌게).
"""
import json, re, sys, os, html
from urllib.request import Request, urlopen
from urllib.parse import urljoin, urlparse

UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128 Safari/537.36'
ROOT = os.path.join(os.path.dirname(__file__), '..', '..', 'data', 'ai-brief')
_cache = {}


def fetch(url, limit=600_000, head=False):
    req = Request(url, headers={'User-Agent': UA, 'Accept': '*/*'}, method='HEAD' if head else 'GET')
    with urlopen(req, timeout=12) as r:
        return r.status, r.headers.get('Content-Type', ''), (b'' if head else r.read(limit))


def is_image(url):
    if not url:
        return False
    if url in _cache:
        return _cache[url]
    ok = False
    try:
        st, ct, _ = fetch(url, head=True)
        ok = st == 200 and ct.startswith('image/')
        if not ok and st in (403, 405):          # HEAD 를 막는 곳은 조금만 받아서 확인
            st, ct, _ = fetch(url, limit=2048)
            ok = st == 200 and ct.startswith('image/')
    except Exception:
        ok = False
    _cache[url] = ok
    return ok


def from_x(url):
    m = re.search(r'/status/(\d+)', url)
    if not m:
        return None, []
    try:
        _, _, body = fetch(f'https://cdn.syndication.twimg.com/tweet-result?id={m.group(1)}&token=a')
        j = json.loads(body)
    except Exception:
        return None, []
    md = j.get('mediaDetails') or (j.get('quoted_tweet') or {}).get('mediaDetails') or []
    items = []
    for x in md[:4]:
        it = {'type': x.get('type'), 'img': x.get('media_url_https')}
        if it['type'] in ('animated_gif', 'video'):
            vs = sorted([v for v in (x.get('video_info') or {}).get('variants', []) if v.get('content_type') == 'video/mp4'],
                        key=lambda v: v.get('bitrate', 0))
            if vs:
                it['mp4'] = (vs[1] if len(vs) > 1 else vs[0])['url']
        items.append(it)
    card = (j.get('card') or {}).get('binding_values') or {}
    cimg = None
    for k in ('photo_image_full_size_large', 'thumbnail_image_large', 'summary_photo_image_large', 'player_image_large'):
        if k in card:
            cimg = (card[k].get('image_value') or {}).get('url')
            break
    first = items[0]['img'] if items else cimg
    if not items and cimg:
        items = [{'type': 'card', 'img': cimg}]
    return first, items


def from_page(url):
    try:
        st, ct, body = fetch(url)
    except Exception:
        return None
    if st != 200 or 'html' not in ct:
        return None
    text = body.decode('utf-8', 'ignore')
    for pat in (r'<meta[^>]+property=["\']og:image(?::secure_url)?["\'][^>]+content=["\']([^"\']+)',
                r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+property=["\']og:image["\']',
                r'<meta[^>]+name=["\']twitter:image(?::src)?["\'][^>]+content=["\']([^"\']+)',
                r'<meta[^>]+content=["\']([^"\']+)["\'][^>]+name=["\']twitter:image["\']'):
        m = re.search(pat, text, re.I)
        if m:
            return urljoin(url, html.unescape(m.group(1).strip()))
    return None


def find_image(url):
    if not url:
        return None, []
    host = urlparse(url).netloc.lower()
    if 'threads.' in host:
        return None, []
    if host.endswith('x.com') or host.endswith('twitter.com'):
        img, items = from_x(url)
        return (img if is_image(img) else None), items
    m = re.match(r'https?://github\.com/([^/]+)/([^/#?]+)', url)
    if m:
        g = f'https://opengraph.githubassets.com/1/{m.group(1)}/{m.group(2)}'
        if is_image(g):
            return g, []
    img = from_page(url)
    return (img if is_image(img) else None), []


def fill(obj, key='image', url_key='url', stats=None):
    cur = obj.get(key)
    if cur and is_image(cur):
        return
    img, _ = find_image(obj.get(url_key))
    obj[key] = img
    stats['filled' if img else 'empty'] += 1


def main():
    day = sys.argv[1] if len(sys.argv) > 1 else json.load(open(os.path.join(ROOT, 'index.json')))['dates'][0]
    stats = {'filled': 0, 'empty': 0}
    p = os.path.join(ROOT, f'{day}.json')
    if os.path.exists(p):                      # 06:20 맥 수집기 때는 아직 브리핑 파일이 없다
        B = json.load(open(p))
        for c in B.get('cards', []):
            fill(c, stats=stats)
            for e in c.get('examples', []):
                fill(e, stats=stats)
        for x in B.get('pickup', []):
            fill(x, stats=stats)
        json.dump(B, open(p, 'w'), ensure_ascii=False, indent=1)

    sp = os.path.join(ROOT, 'social', f'{day}.json')
    if os.path.exists(sp):
        S = json.load(open(sp))
        for x in S.get('posts', []):
            if x.get('src') == 'x' and not x.get('media_items'):
                _, items = find_image(x['url'])
                x['media_items'] = [i for i in items if is_image(i.get('img'))]
                stats['filled' if x['media_items'] else 'empty'] += 1
        json.dump(S, open(sp, 'w'), ensure_ascii=False, indent=1)
    print(f'{day}: 채움 {stats["filled"]} · 못 찾음 {stats["empty"]}')


if __name__ == '__main__':
    main()
