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
  // sort=POPULAR — 인기순 정렬 (URL 파라미터로 강제, UI 클릭보다 안정적)
  const searchUrl = `https://www.postype.com/search/post?keyword=${encodeURIComponent(KEYWORD)}&start_date=${yearStart()}&end_date=${today}&adult=all&sort=POPULAR`;
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

    // 인기순 정렬은 URL 파라미터로 처리 (sort=POPULAR) — 클릭 불필요

    // 정렬 상태 검증 — "인기순" 표시가 활성화돼 있어야 함
    const sortVerified = await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button, div, span'));
      return btns.some(el => {
        const t = (el.textContent || '').trim();
        return t === '전체 인기순' || t === '인기순';
      });
    });
    log('sort verified (인기순 visible):', sortVerified);

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

    // ── 3. 검색 결과 작품 카드 → URL + 조회수/좋아요/댓글 미리 추출 ──
    // 작품 URL 패턴: /@{username}/post/{id}  (search/post 같은 검색 URL은 제외)
    const postCards = await page.evaluate((maxN) => {
      const links = Array.from(document.querySelectorAll('a')).filter(a => {
        return /^\/@[^\/]+\/post\/\d+/.test(a.pathname || '');
      });
      const seen = new Set();
      const cards = [];
      for (const a of links) {
        const href = a.href;
        if (seen.has(a.pathname)) continue;
        seen.add(a.pathname);

        // 카드 컨테이너 찾기 (조회수 표기가 있는 가장 작은 조상)
        let card = a;
        for (let d = 0; d < 8; d++) {
          if (!card.parentElement) break;
          card = card.parentElement;
          const txt = card.textContent || '';
          if (/조회\s*[\d,.\s천만]+/.test(txt) && txt.length > 80) break;
        }
        const fullText = (card.textContent || '').replace(/\s+/g, ' ').trim();
        const viewMatch = fullText.match(/조회\s*([\d,.]+\s*[천만]?)/);
        const likeMatch = fullText.match(/좋아요\s*([\d,.]+\s*[천만]?)/);
        const commentMatch = fullText.match(/댓글\s*([\d,.]+\s*[천만]?)/);

        cards.push({
          url: href,
          searchRank: cards.length + 1,
          viewCountRaw: viewMatch ? viewMatch[1].trim() : null,
          likeCountRaw: likeMatch ? likeMatch[1].trim() : null,
          commentCountRaw: commentMatch ? commentMatch[1].trim() : null,
        });
        if (cards.length >= maxN) break;
      }
      return cards;
    }, TOP_N);
    log('post cards found:', postCards.length);

    if (postCards.length === 0) {
      log('WARN: no post cards found. Page structure may have changed.');
      const html = await page.content();
      log('first 2000 chars of HTML:', html.substring(0, 2000));
    }

    // "1.9만" → 19000 같은 변환 헬퍼
    function parseKrCount(raw) {
      if (!raw) return null;
      const s = String(raw).replace(/,/g, '').trim();
      const m = s.match(/^([\d.]+)\s*([천만]?)$/);
      if (!m) return null;
      const n = parseFloat(m[1]);
      if (isNaN(n)) return null;
      if (m[2] === '만') return Math.round(n * 10000);
      if (m[2] === '천') return Math.round(n * 1000);
      return Math.round(n);
    }

    // ── 4. 각 작품 페이지 방문해서 메타데이터 보강 (시놉시스, 태그 등) ──
    // 조회수/좋아요는 이미 검색 페이지 카드에서 추출했으므로 여기선 보강용
    const posts = [];
    for (let i = 0; i < postCards.length; i++) {
      const card = postCards[i];
      const url = card.url;
      log(`(${i + 1}/${postCards.length}) [rank ${card.searchRank}, view ${card.viewCountRaw}] ${url}`);
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
          // 페이지 본문 일부 — Claude가 후속 분석에 사용
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
        // 검색 페이지에서 뽑은 조회수/순위 병합
        meta.searchRank = card.searchRank;
        meta.viewCountRaw = card.viewCountRaw;
        meta.viewCount = parseKrCount(card.viewCountRaw);
        meta.likeCountRaw = card.likeCountRaw;
        meta.likeCount = parseKrCount(card.likeCountRaw);
        meta.commentCountRaw = card.commentCountRaw;
        meta.commentCount = parseKrCount(card.commentCountRaw);
        posts.push(meta);
      } catch (e) {
        log('  ERROR on post:', e.message);
        posts.push({
          url,
          searchRank: card.searchRank,
          viewCountRaw: card.viewCountRaw,
          viewCount: parseKrCount(card.viewCountRaw),
          error: e.message,
        });
      }
      // 예의 차원 딜레이
      if (i < postCards.length - 1) {
        await new Promise(r => setTimeout(r, POST_DELAY));
      }
    }

    // ── 5. Sanity check — 상위 5개 평균 조회수가 너무 낮으면 인기순 정렬 실패 의심 ──
    const SANITY_MIN_AVG_VIEW = parseInt(process.env.POSTYPE_MIN_AVG_VIEW || '2000', 10);
    const top5Views = posts
      .slice(0, 5)
      .map(p => p.viewCount)
      .filter(v => typeof v === 'number');
    const top5Avg = top5Views.length > 0
      ? Math.round(top5Views.reduce((a, b) => a + b, 0) / top5Views.length)
      : 0;
    log('top5 avg view:', top5Avg, '(threshold:', SANITY_MIN_AVG_VIEW + ')');

    const sanityPassed = sortVerified && top5Avg >= SANITY_MIN_AVG_VIEW;
    if (!sanityPassed) {
      log('SANITY FAIL — sortVerified=' + sortVerified + ', top5Avg=' + top5Avg);
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
        sortVerified: sortVerified,
        top5AvgView: top5Avg,
        sanityPassed: sanityPassed,
      },
    };

    // Sanity 실패 시 stderr만 출력하고 exit 1 — latest.json에 잘못된 데이터 안 박히게
    if (!sanityPassed) {
      log('ABORT — refusing to write bad data. Use POSTYPE_FORCE=1 to override.');
      if (process.env.POSTYPE_FORCE !== '1') {
        process.exit(2);
      }
      log('POSTYPE_FORCE=1 detected — writing data anyway.');
    }

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
