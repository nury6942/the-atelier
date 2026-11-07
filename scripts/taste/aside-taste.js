// Taste 수집 — Aside 브라우저(아이맥, X·Threads·Instagram 로그인 돼 있음)에서 장소·숙소 글 후보를 모은다.
// collect.js 가 앞에 `const JOB = {...};` 를 붙여서 `aside repl` 한 번(120초 제한)으로 부른다. 읽기만 한다(누르기·좋아요 없음).
//   JOB.mode: 'x-search' | 'threads-search' | 'ig-search' | 'ig-profile' | 'read' | 'stayfolio' | 'photo-search'
//             | 'nol' | 'naver-list' | 'naver-film' | 'pages' (문화)
//   JOB.q (검색어) · JOB.urls (read) · JOB.since (YYYY-MM-DD, x) · JOB.max (ig 게시물 수)
// 결과: 마지막 줄 "TASTE_JSON " + JSON 배열 — {src,url,author,at,likes,text,images:[url…]}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const out = [];

// 화면 안에서 글 카드 긁기 (X·Threads 공통)
const grabFeed = (page) => page.evaluate(() => {
  function num(t) {
    const m = String(t).trim().match(/^([\d.,]+)\s*(천|만|K|M)?$/i);
    if (!m) return null;
    const n = parseFloat(m[1].replace(/,/g, '')), u = (m[2] || '').toLowerCase();
    return Math.round(n * (u === '천' || u === 'k' ? 1e3 : u === '만' ? 1e4 : u === 'm' ? 1e6 : 1));
  }
  const res = [];
  if (/threads\./.test(location.hostname)) {
    document.querySelectorAll('a[href*="/post/"] time').forEach((t) => {
      const a = t.closest('a'), href = a.getAttribute('href').split('?')[0];
      if (href.split('/').length > 4) return;                        // /@id/post/xxx/media 같은 곁가지 제외
      let box = a;
      for (let i = 0; i < 14 && box; i++) { if (box.getAttribute && box.getAttribute('data-pressable-container')) break; box = box.parentElement; }
      box = box || a.parentElement;
      const lines = box.innerText.split('\n').map((s) => s.trim()).filter(Boolean).filter((s) => s !== 'AI 콘텐츠' && s !== '번역하기');
      const tail = [];
      for (let j = lines.length - 1; j >= 0 && tail.length < 4; j--) { const v = num(lines[j]); if (v === null) break; tail.unshift(v); }
      const images = [...box.querySelectorAll('img')].filter((x) => (x.naturalWidth || 0) > 250).map((x) => x.currentSrc || x.src).slice(0, 4);
      res.push({ src: 'threads', url: 'https://www.threads.com' + href, author: '@' + (href.split('/')[1] || '').replace('@', ''),
        at: t.getAttribute('datetime'), likes: tail[0] || 0, text: lines.slice(2, lines.length - tail.length).join(' ').slice(0, 900), images });
    });
  } else {
    document.querySelectorAll('article[data-testid="tweet"]').forEach((art) => {
      const t = art.querySelector('time'); if (!t) return;
      const a = t.closest('a'), href = a ? a.getAttribute('href') : null; if (!href) return;
      const te = art.querySelector('[data-testid="tweetText"]');
      const metric = (id) => { const el = art.querySelector('[data-testid="' + id + '"]'); return el ? (num(el.innerText) || 0) : 0; };
      const images = [...art.querySelectorAll('[data-testid="tweetPhoto"] img')].map((x) => x.src.replace(/name=\w+/, 'name=small')).slice(0, 4);
      res.push({ src: 'x', url: 'https://x.com' + href.replace(/\/(photo|analytics).*$/, ''), author: '@' + href.split('/')[1], at: t.getAttribute('datetime'),
        likes: metric('like'), text: (te ? te.innerText : '').replace(/\s+/g, ' ').slice(0, 900), images });
    });
  }
  return res;
});

// 인스타 게시물 한 장: 캡션·좋아요는 og:description, 사진은 큰 img
const readIg = async (url) => {
  const p = await openTab(url);
  await sleep(5500);
  const r = await p.evaluate(() => {
    const meta = (k) => (document.querySelector('meta[property="' + k + '"]') || {}).content || '';
    const desc = meta('og:description');
    const m = desc.match(/^([\d,.]+[KkMm만천]?)\s*(likes|좋아요)/);
    let likes = 0;
    if (m) { const s = m[1].replace(/,/g, ''); likes = Math.round(parseFloat(s) * (/k|천/i.test(s) ? 1e3 : /m/i.test(s) ? 1e6 : /만/.test(s) ? 1e4 : 1)); }
    const author = (desc.match(/-\s*([\w.]+)\s*-/) || [])[1] || '';
    const cap = (desc.match(/:\s*"([\s\S]*)"\s*\.?\s*$/) || [])[1] || desc;
    const art = document.querySelector('article') || document.querySelector('main');
    const imgs = art ? [...art.querySelectorAll('img')].filter((i) => (i.naturalWidth || 0) >= 600 && !i.closest('a[href*="/p/"]')) : [];
    const images = [...new Set(imgs.map((i) => i.currentSrc || i.src))].slice(0, 4);
    if (!images.length && meta('og:image')) images.push(meta('og:image'));
    const t = document.querySelector('time[datetime]');
    return { likes, author: author ? '@' + author : '', text: cap.replace(/\s+/g, ' ').slice(0, 1500), images, at: t ? t.getAttribute('datetime') : '' };
  });
  await p.close();
  return Object.assign({ src: 'instagram', url }, r);
};

if (JOB.mode === 'x-search' || JOB.mode === 'threads-search') {
  const url = JOB.mode === 'x-search'
    ? 'https://x.com/search?f=top&q=' + encodeURIComponent(JOB.q + ' since:' + JOB.since)
    : 'https://www.threads.com/search?serp_type=default&q=' + encodeURIComponent(JOB.q);
  const page = await openTab(url);
  await sleep(6000);
  const acc = {};
  for (let i = 0; i < (JOB.scrolls || 3); i++) {
    for (const p of await grabFeed(page)) if (!acc[p.url]) acc[p.url] = p;
    await page.evaluate(() => window.scrollBy(0, 2600));
    await sleep(2200);
  }
  for (const p of await grabFeed(page)) if (!acc[p.url]) acc[p.url] = p;
  await page.close();
  out.push(...Object.values(acc));
}

if (JOB.mode === 'ig-search') {
  const page = await openTab('https://www.instagram.com/explore/search/keyword/?q=' + encodeURIComponent(JOB.q));
  await sleep(6500);
  await page.evaluate(() => window.scrollBy(0, 1500));
  await sleep(2000);
  const links = await page.evaluate(() => [...new Set([...document.querySelectorAll('a[href*="/p/"], a[href*="/reel/"]')].map((a) => a.href.split('?')[0]))]);
  await page.close();
  const t0 = Date.now();
  for (const u of links.filter((u) => !(JOB.skip || []).includes(u)).slice(0, JOB.max || 6)) {
    if (Date.now() - t0 > 80000) break;                                  // repl 120초 안에 끝내기
    try { out.push(await readIg(u)); } catch (e) { /* 한 장 실패는 넘김 */ }
    await sleep(1200);
  }
}

if (JOB.mode === 'read') {
  // 원문 + 작성자 본인의 이어지는 답글(타래). 장소 이름은 첫 글보다 타래 답글에 있는 경우가 많다.
  // 화면을 내릴수록 위쪽 글이 지워지므로(가상 스크롤) 내릴 때마다 긁어서 합친다.
  const snap = () => {
    if (/threads\./.test(location.hostname)) {
      const author = (location.pathname.split('/')[1] || '').replace('@', '');
      const parts = [];
      for (const b of [...document.querySelectorAll('[data-pressable-container]')].slice(0, 20)) {
        const t = b.innerText.trim();
        const mine = t.startsWith(author);
        const images = [...b.querySelectorAll('img')].filter((x) => (x.naturalWidth || 0) > 250).map((x) => x.currentSrc || x.src);
        parts.push({ key: t.slice(0, 80), mine, text: t.replace(/\n+/g, ' / ').slice(0, 1200), images });
      }
      return parts;
    }
    const author = (location.pathname.split('/')[1] || '').toLowerCase();
    const parts = [];
    for (const a of [...document.querySelectorAll('article[data-testid="tweet"]')]) {
      const name = ((a.querySelector('[data-testid="User-Name"]') || {}).innerText || '').toLowerCase();
      const te = a.querySelector('[data-testid="tweetText"]');
      let txt = te ? te.innerText.replace(/\s+/g, ' ') : '';
      const q = [...a.querySelectorAll('[data-testid="tweetText"]')].find((x) => x !== te);   // 인용한 글
      if (q) txt += ' (인용) ' + q.innerText.replace(/\s+/g, ' ').slice(0, 600);
      const images = [...a.querySelectorAll('[data-testid="tweetPhoto"] img')].map((x) => x.src.replace(/name=\w+/, 'name=small'));
      const t = a.querySelector('time');
      parts.push({ key: (t ? t.getAttribute('datetime') : '') + txt.slice(0, 60), mine: name.includes('@' + author), text: txt.slice(0, 2000), images });
    }
    return parts;
  };
  const t0 = Date.now();
  for (const u of JOB.urls) {
    if (Date.now() - t0 > 95000) break;
    try {
      if (/instagram\.com/.test(u)) { out.push(await readIg(u)); continue; }
      const page = await openTab(u);
      await sleep(5500);
      const seen = new Map();
      for (let i = 0; i < 3; i++) {
        for (const p of await page.evaluate(snap)) if (!seen.has(p.key)) seen.set(p.key, p);
        await page.evaluate(() => window.scrollBy(0, 1100));
        await sleep(1400);
      }
      for (const p of await page.evaluate(snap)) if (!seen.has(p.key)) seen.set(p.key, p);
      await page.close();
      const all = [...seen.values()];
      const mine = [], others = [];
      // Threads: 작성자 칸이 끊기고 남의 댓글이 나오면 그 뒤 작성자 칸은 댓글에 단 답이라 덜 중요 — 그래도 이름이 거기 있을 수 있어 같이 넣는다
      for (const p of all) (p.mine ? mine : others).push(p);
      const images = [...new Set(mine.flatMap((p) => p.images))].slice(0, 6);
      const text = mine.map((p) => p.text).join(' // ').slice(0, 3000)
        + (others.length ? ' || 다른 사람 답글: ' + others.slice(0, 4).map((p) => p.text.slice(0, 160)).join(' | ') : '');
      out.push({ url: u, text, images });
    } catch (e) { /* 한 장 실패는 넘김 */ }
    await sleep(2000);                                                   // Threads 속도 제한
  }
}

// 큐레이터 계정 최신 게시물: 프로필 격자의 사진 설명(alt)에 캡션이 들어 있어 게시물을 하나씩 안 열어도 된다
if (JOB.mode === 'ig-profile') {
  for (const h of JOB.handles) {
    try {
      const page = await openTab('https://www.instagram.com/' + h + '/');
      await sleep(6000);
      await page.evaluate(() => window.scrollBy(0, 1600));
      await sleep(2000);
      const posts = await page.evaluate(() => [...document.querySelectorAll('a[href*="/p/"], a[href*="/reel/"]')].map((a) => {
        const img = a.querySelector('img');
        return { url: 'https://www.instagram.com' + a.getAttribute('href').replace(/^\/[\w.]+(?=\/(p|reel)\/)/, '').split('?')[0], alt: img ? img.alt : '', img: img ? (img.currentSrc || img.src) : '' };
      }));
      await page.close();
      const seenU = new Set();
      for (const p of posts) {
        if (seenU.has(p.url) || (JOB.skip || []).includes(p.url)) continue;
        seenU.add(p.url);
        if (seenU.size > (JOB.n || 12)) break;
        out.push({ src: 'instagram', url: p.url, author: '@' + h, likes: 0, text: p.alt.replace(/\s+/g, ' ').slice(0, 1500), images: p.img ? [p.img] : [] });
      }
    } catch (e) { /* 계정 하나 실패는 넘김 */ }
  }
}

// 사진 찾기: 장소 이름으로 인스타 검색 상위 게시물 사진 + 네이버 검색의 플레이스 사진
if (JOB.mode === 'photo-search') {
  const t0 = Date.now();
  for (const it of JOB.items) {
    if (Date.now() - t0 > 90000) break;
    const r = { key: it.key, images: [] };
    try {
      const n = await openTab('https://search.naver.com/search.naver?query=' + encodeURIComponent(it.q));
      await sleep(3500);
      r.images.push(...await n.evaluate(() => [...document.querySelectorAll('img')].map((i) => i.currentSrc || i.src)
        .map((s) => { const m = s.match(/[?&]src=([^&]+)/); return m ? decodeURIComponent(m[1]) : s; })
        .filter((s) => /ldb-phinf|myplace-phinf|naverbooking-phinf|movie-phinf|s\.pstatic\.net\/movie|culture-phinf|kopis/.test(s)).slice(0, 3)));
      await n.close();
    } catch (e) {}
    if (it.ig) {
      try {
        const p = await openTab('https://www.instagram.com/explore/search/keyword/?q=' + encodeURIComponent(it.q));
        await sleep(5500);
        const links = await p.evaluate(() => [...new Set([...document.querySelectorAll('a[href*="/p/"]')].map((a) => a.href.split('?')[0]))].slice(0, 1));
        await p.close();
        for (const u of links) { const g = await readIg(u); r.images.push(...g.images.slice(0, 3)); r.igUrl = u; }
      } catch (e) {}
    }
    out.push(r);
  }
}

// 영화 한 편 자세히 (네이버 검색 영화 칸): 감독·국가·개봉·러닝타임·포스터
if (JOB.mode === 'naver-film') {
  for (const t of JOB.titles) {
    try {
      const n = await openTab('https://search.naver.com/search.naver?query=' + encodeURIComponent('영화 ' + t));
      await sleep(3500);
      const r = await n.evaluate(() => {
        const txt = document.body.innerText.replace(/\n+/g, ' | ');
        const i = Math.max(0, txt.search(/개요|감독/));
        const poster = [...document.querySelectorAll('img')].map((x) => x.currentSrc || x.src)
          .map((s) => { const m = s.match(/[?&]src=([^&]+)/); return m ? decodeURIComponent(m[1]) : s; })
          .find((s) => /movie-phinf|s\.pstatic\.net\/movie/.test(s));
        return { text: txt.slice(Math.max(0, i - 200), i + 900), poster: poster || '' };
      });
      await n.close();
      out.push(Object.assign({ title: t }, r));
    } catch (e) {}
  }
}

// 예스24 책 표지: 검색 첫 결과들의 제목·표지
if (JOB.mode === 'yes24') {
  for (const it of JOB.items) {
    try {
      const page = await openTab('https://www.yes24.com/Product/Search?domain=BOOK&query=' + encodeURIComponent(it.q));
      await sleep(4500);
      const r = await page.evaluate(() => [...document.querySelectorAll('#yesSchList > li, .itemUnit')].slice(0, 4).map((li) => {
        const img = li.querySelector('img');
        const t = li.querySelector('.gd_name, .info_name a');
        return { title: t ? t.innerText.trim() : '', img: img ? (img.getAttribute('data-original') || img.src) : '' };
      }));
      await page.close();
      out.push({ key: it.key, results: r });
    } catch (e) {}
  }
}

// NOL(인터파크) 장르별 랭킹: 제목·장소·기간·포스터
if (JOB.mode === 'nol') {
  for (const g of JOB.genres) {
    try {
      const page = await openTab('https://nol.yanolja.com/ticket/display/ranking/' + g);
      await sleep(5500);
      await page.evaluate(() => window.scrollBy(0, 3000));
      await sleep(1500);
      const items = await page.evaluate((g) => {
        const res = [], seen = {};
        document.querySelectorAll('a[href*="/ticket/products/"]').forEach((a) => {
          const url = a.href.split('?')[0];
          if (seen[url]) return;
          const t = a.innerText.replace(/\n+/g, ' | ');
          if (!/공연기간|기간/.test(t)) return;
          seen[url] = 1;
          const img = [...a.querySelectorAll('img')].map((x) => x.currentSrc || x.src).find((s) => /ticketimage|yanolja/.test(s) && !/logo/i.test(s));
          res.push({ src: 'nol', genre: g, url, text: t.slice(0, 400), images: img ? [img] : [] });
        });
        return res;
      }, g);
      await page.close();
      out.push(...items.slice(0, JOB.max || 20));
    } catch (e) {}
  }
}

// 네이버 검색 목록 칸(전시중·현재상영·개봉예정): 사진 alt=제목, 같은 칸 글=기간·장소·개요. '다음'을 눌러 몇 쪽 더
if (JOB.mode === 'naver-list') {
  for (const q of JOB.queries) {
    try {
      const page = await openTab('https://search.naver.com/search.naver?query=' + encodeURIComponent(q.q));
      await sleep(4000);
      const acc = {};
      for (let i = 0; i <= (q.pages || 0); i++) {
        const got = await page.evaluate(() => [...document.querySelectorAll('img[alt]')].filter((x) => /search\.pstatic\.net\/common/.test(x.currentSrc || x.src))
          .map((x) => {
            // 사진이 하나만 든 가장 큰 상위 칸 = 그 항목 한 칸
            let box = x;
            for (let k = 0; k < 8 && box.parentElement; k++) {
              const up = box.parentElement;
              if (up.querySelectorAll('img[alt]').length > 1) break;
              box = up;
            }
            const m = (x.currentSrc || x.src).match(/[?&]src=([^&]+)/);
            return { title: x.alt.replace(/\s*이미지$/, '').trim(), text: box.innerText.replace(/\s*\n+\s*/g, ' | ').trim().slice(0, 300), img: m ? decodeURIComponent(m[1]) : '' };
          }).filter((r) => r.title && r.text.length > 10));
        for (const r of got) acc[r.title] = r;
        const moved = await page.evaluate(() => { const b = [...document.querySelectorAll('a,button')].find((x) => /^다음$/.test((x.innerText || '').trim()) && x.offsetParent); if (b) { b.click(); return true; } return false; });
        if (!moved) break;
        await sleep(1800);
      }
      await page.close();
      for (const r of Object.values(acc)) out.push({ src: 'naver', list: q.q, url: 'https://search.naver.com/search.naver?query=' + encodeURIComponent(r.title), title: r.title, text: r.text, images: r.img ? [r.img] : [] });
    } catch (e) {}
  }
}

// 미술관 '현재 전시' 페이지: 글 + 사진(alt) 그대로 — claude 가 제목·기간을 뽑는다(기간이 없으면 버림)
if (JOB.mode === 'pages') {
  const t0 = Date.now();
  for (const u of JOB.urls) {
    if (Date.now() - t0 > 100000) break;
    try {
      const page = await openTab(u);
      await sleep(6000);
      if (JOB.scroll) { await page.evaluate(() => window.scrollBy(0, 2500)); await sleep(1500); }
      const r = await page.evaluate(([chars, focus, wantLinks]) => {
        const og = (document.querySelector('meta[property="og:image"]') || {}).content || '';
        const imgs = [...document.querySelectorAll('img')].filter((i) => (i.naturalWidth || 0) >= 300).slice(0, 8).map((i) => ({ alt: (i.alt || '').slice(0, 80), src: i.currentSrc || i.src }));
        if (og) imgs.unshift({ alt: 'og:image', src: og });
        let text = document.body.innerText.replace(/\s*\n+\s*/g, ' | ');
        if (focus) { const i = text.indexOf(focus); if (i > 0) text = text.slice(Math.max(0, i - 150)); }   // 검색 페이지 메뉴 글자 건너뛰기
        const links = wantLinks ? [...new Set([...document.querySelectorAll('a[href]')].map((a) => (a.innerText || '').trim().replace(/\s+/g, ' ').slice(0, 60) + ' → ' + a.href)
          .filter((t) => t.length > 12 && !/javascript:|#$/.test(t)))].slice(0, 40) : [];
        return { url: location.href, title: document.title, text: text.slice(0, chars), imgs, links };
      }, [JOB.chars || 2200, (JOB.focus || {})[u] || '', !!JOB.links]);
      await page.close();
      out.push({ src: 'web', url: u, finalUrl: r.url, pageTitle: r.title, text: r.text, links: r.links, images: r.imgs.map((i) => i.src), imageAlts: r.imgs.map((i) => i.alt) });
    } catch (e) {}
  }
}

if (JOB.mode === 'stayfolio') {
  const page = await openTab('https://www.stayfolio.com/findstay');
  await sleep(7000);
  for (let i = 0; i < 3; i++) { await page.evaluate(() => window.scrollBy(0, 2400)); await sleep(1800); }
  const cards = await page.evaluate(() => {
    const seen = {}, res = [];
    document.querySelectorAll('a[href^="/findstay/"]').forEach((a) => {
      const slug = a.getAttribute('href').split('?')[0];
      if (seen[slug] || slug.split('/').length !== 3) return;
      const lines = a.innerText.split('\n').map((s) => s.trim()).filter(Boolean);
      const i = lines.findIndex((s) => /·\s*\d/.test(s));                 // "제주동쪽, 조천읍·2~4명"
      if (i < 1) return;
      seen[slug] = 1;
      const price = (lines.slice(i).filter((s) => /^₩[\d,]+~?$/.test(s)).pop() || '');
      const img = [...a.querySelectorAll('img')].map((x) => x.currentSrc || x.src).find((s) => /^https/.test(s));
      res.push({ src: 'stayfolio', url: 'https://www.stayfolio.com' + slug, author: 'stayfolio', likes: 0,
        text: lines[i - 1] + ' — ' + lines[i] + (price ? ' · ' + price : '') + ' · 태그: ' + lines.filter((s) => /단독소개|신규|건축|한옥|정원/.test(s)).join(','),
        title: lines[i - 1], region: lines[i].split('·')[0], price, images: img ? [img] : [] });
    });
    return res;
  });
  await page.close();
  out.push(...cards.slice(0, JOB.max || 40));
}

console.log('TASTE_JSON ' + JSON.stringify(out));
