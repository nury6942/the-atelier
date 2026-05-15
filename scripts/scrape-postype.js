#!/usr/bin/env node
/**
 * postype.com 나페스 트렌드 스크래퍼
 *
 * 동작:
 *   1. postype.com/search/post?keyword=나페스 (인기순) 페이지 방문
 *   2. 사이드바 (연관 검색어 + 추천 태그) 추출
 *   3. TOP N 작품 카드 추출 → 각 작품 페이지 방문 → 메타데이터 + 시놉시스 수집
 *   4. JSON으로 stdout 출력
 *
 * 실행:
 *   node scripts/scrape-postype.js > data/trends/postype/latest.json
 *
 * 환경 변수 (옵션):
 *   POSTYPE_KEYWORD   기본 "나페스"
 *   POSTYPE_TOP_N     기본 20
 *   POSTYPE_HEADLESS  기본 "true" ("false"면 브라우저 창 보임 - 로컬 디버그용)
 */

const puppeteer = require('puppeteer');

const KEYWORD = process.env.POSTYPE_KEYWORD || '나페스';
const TOP_N = parseInt(process.env.POSTYPE_TOP_N || '20', 10);
const HEADLESS = (process.env.POSTYPE_HEADLESS || 'true') !== 'false';
const NAV_TIMEOUT = 45000;
const RENDER_WAIT = 4000;       // SPA 렌더 대기
const POST_DELAY = 2500;        // 작품 간 딜레이 (예의)
const USER_AGENT = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36';

function log(...args) { console.error('[scrape]', ...args); }
function todayStr() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}
function yearStart() {
  return `${new Date().getFullYear()}-01-01`;
}

async function autoScroll(page, steps = 6) {
  for (let i = 0; i < steps; i++) {
    await page.evaluate(() => window.scrollBy(0, window.innerHeight * 0.9));
    await new Promise(r => setTimeout(r, 700));
  }
}

async function main() {
  const today = todayStr();
  const searchUrl = `https://www.postype.com/search/post?keyword=${encodeURIComponent(KEYWORD)}&start_date=${yearStart()}&end_date=${today}&adult=all`;
  log('search URL:', searchUrl);

  const browser = await puppeteer.launch({
    headless: HEADLESS ? 'new' : false,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'],
  });

  try {
    const page = await browser.newPage();
    await page.setUserAgent(USER_AGENT);
    await page.setViewport({ width: 1366, height: 900 });
    page.setDefaultNavigationTimeout(NAV_TIMEOUT);

    // ── 1. 검색 페이지 ──
    log('navigating to search…');
    await page.goto(searchUrl, { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, RENDER_WAIT));

    // 인기순 정렬 시도 (UI에 "인기순" 버튼 있으면 클릭)
    try {
      const clicked = await page.evaluate(() => {
        const candidates = Array.from(document.querySelectorAll('button, a, span, div'));
        const t = candidates.find(el => (el.textContent || '').trim() === '인기순');
        if (t) { t.click(); return true; }
        return false;
      });
      if (clicked) {
        log('clicked 인기순 sort');
        await new Promise(r => setTimeout(r, RENDER_WAIT));
      } else {
        log('인기순 button not found, keeping default order');
      }
    } catch (e) {
      log('sort click failed:', e.message);
    }

    // 스크롤로 추가 결과 로드
    await autoScroll(page, 5);

    // ── 2. 사이드바 추출 (연관 검색어 + 추천 태그) — 다중 전략 ──
    const sidebar = await page.evaluate(() => {
      const out = { relatedKeywords: [], recommendedTags: [] };

      // Strategy 1: 헤더 텍스트로 정확히 매칭 (관대한 버전 — 직접 자식 텍스트 노드만 확인)
      function getDirectText(el) {
        return Array.from(el.childNodes)
          .filter(n => n.nodeType === 3)
          .map(n => n.textContent.trim())
          .join('');
      }
      function findChipsAfterHeader(headerText) {
        const all = Array.from(document.querySelectorAll('*'));
        const candidates = all.filter(e => {
          const t = getDirectText(e);
          return t === headerText;
        });
        for (const h of candidates) {
          let scope = h.parentElement;
          while (scope && scope !== document.body) {
            // chip-like: a/button with short text content
            const chips = Array.from(scope.querySelectorAll('a, button'))
              .map(e => (e.textContent || '').trim())
              .filter(t => t && t.length > 0 && t.length < 40 && t !== headerText);
            const unique = [...new Set(chips)];
            if (unique.length >= 3 && unique.length <= 40) return unique;
            scope = scope.parentElement;
          }
        }
        return [];
      }
      out.relatedKeywords = findChipsAfterHeader('연관 검색어').slice(0, 20);
      out.recommendedTags = findChipsAfterHeader('추천 태그').slice(0, 20);

      // Strategy 2: 어떤 헤더도 못 찾았으면 — 모든 a 태그 중 #으로 시작하는 짧은 것들 모음 (fallback)
      if (out.recommendedTags.length === 0) {
        const hashTags = Array.from(document.querySelectorAll('a, span'))
          .map(e => (e.textContent || '').trim())
          .filter(t => t.startsWith('#') && t.length < 30);
        out.recommendedTags = [...new Set(hashTags)].slice(0, 20);
      }
      return out;
    });
    log('sidebar:', sidebar.relatedKeywords.length, 'kw,', sidebar.recommendedTags.length, 'tags');

    // ── 3. 검색 결과 작품 카드 → URL 추출 ──
    const postLinks = await page.evaluate((maxN) => {
      // postype 작품 페이지 URL 패턴: https://{username}.postype.com/post/{id} 또는 /@{user}/post/...
      // a 태그 중 /post/ 포함하고 .postype.com 도메인인 것 찾기
      const links = Array.from(document.querySelectorAll('a[href*="/post/"]'));
      const urls = [];
      const seen = new Set();
      for (const a of links) {
        const href = a.href;
        if (!href || !href.includes('.postype.com/') || !href.includes('/post/')) continue;
        if (seen.has(href)) continue;
        seen.add(href);
        urls.push(href);
        if (urls.length >= maxN) break;
      }
      return urls;
    }, TOP_N);
    log('post links found:', postLinks.length);

    if (postLinks.length === 0) {
      log('WARN: no post links found. Page structure may have changed.');
      // 디버깅용: 페이지 HTML 일부 출력
      const html = await page.content();
      log('first 2000 chars of HTML:', html.substring(0, 2000));
    }

    // ── 4. 각 작품 페이지 방문해서 메타데이터 추출 ──
    const posts = [];
    for (let i = 0; i < postLinks.length; i++) {
      const url = postLinks[i];
      log(`(${i + 1}/${postLinks.length}) ${url}`);
      try {
        await page.goto(url, { waitUntil: 'networkidle2', timeout: NAV_TIMEOUT });
        await new Promise(r => setTimeout(r, RENDER_WAIT));

        const meta = await page.evaluate(() => {
          function txt(sel) {
            const e = document.querySelector(sel);
            return e ? (e.textContent || '').trim() : '';
          }
          function meta(name) {
            const e = document.querySelector(`meta[property="${name}"], meta[name="${name}"]`);
            return e ? e.getAttribute('content') || '' : '';
          }
          const tags = Array.from(document.querySelectorAll('a[href*="/tag"], a[href*="tags="], [class*="tag"], [class*="Tag"]'))
            .map(e => (e.textContent || '').trim())
            .filter(t => t.startsWith('#') || (t.length > 0 && t.length < 30))
            .filter((t, i, arr) => arr.indexOf(t) === i)
            .slice(0, 20);
          // 19+ 여부 (메타+클래스+텍스트)
          const isAdult = /19\+|성인 인증|성인콘텐츠|adult/i.test(document.body.innerText) ||
                          !!document.querySelector('[class*="adult"], [class*="Adult"]');
          // 유료/무료: "유료", "구매" 등 단어
          const bodyText = document.body.innerText;
          const isPaid = /유료|구매|판매|결제|₩|원\s*\/\s*화/.test(bodyText) && !/무료/.test(bodyText.split('\n')[0] || '');
          // 페이지 본문 일부 — Claude가 후속 분석에 사용 (조회수/좋아요 등 추출용)
          const bodyTextSample = (bodyText || '').substring(0, 1500);
          return {
            title: meta('og:title') || txt('h1') || document.title,
            url: location.href,
            description: meta('og:description') || meta('description') || '',
            tags: tags,
            isAdult: isAdult,
            isPaid: isPaid,
            bodyTextSample: bodyTextSample,
            scrapedAt: new Date().toISOString(),
          };
        });
        // 작가명은 URL에서 추출 (가장 신뢰할 만함): /@username/post/...
        const authorMatch = url.match(/\/@([^\/]+)\/post\//);
        meta.author = authorMatch ? authorMatch[1] : '';
        posts.push(meta);
      } catch (e) {
        log('  ERROR on post:', e.message);
        posts.push({ url, error: e.message });
      }
      // 예의 차원 딜레이
      if (i < postLinks.length - 1) {
        await new Promise(r => setTimeout(r, POST_DELAY));
      }
    }

    const result = {
      date: today,
      platform: 'postype',
      query: KEYWORD,
      searchUrl: searchUrl,
      sidebar: sidebar,
      posts: posts,
      stats: {
        totalScraped: posts.length,
        successful: posts.filter(p => !p.error).length,
        failed: posts.filter(p => p.error).length,
        adultCount: posts.filter(p => p.isAdult).length,
        paidCount: posts.filter(p => p.isPaid).length,
      },
    };

    // stdout으로 JSON 출력 (로그는 stderr)
    process.stdout.write(JSON.stringify(result, null, 2));
    log('done. successful:', result.stats.successful, '/', result.stats.totalScraped);
  } finally {
    await browser.close();
  }
}

main().catch(err => {
  console.error('[scrape] fatal:', err);
  process.exit(1);
});
