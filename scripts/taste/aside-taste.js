// Taste 수집 — Aside 브라우저(아이맥, X·Threads·Instagram 로그인 돼 있음)에서 장소·숙소 글 후보를 모은다.
// collect.js 가 앞에 `const JOB = {...};` 를 붙여서 `aside repl` 한 번(120초 제한)으로 부른다. 읽기만 한다(누르기·좋아요 없음).
//   JOB.mode: 'x-search' | 'threads-search' | 'ig-search' | 'read' | 'stayfolio'
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
  const t0 = Date.now();
  for (const u of JOB.urls) {
    if (Date.now() - t0 > 95000) break;
    try {
      if (/instagram\.com/.test(u)) { out.push(await readIg(u)); continue; }
      const page = await openTab(u);
      await sleep(5500);
      await page.evaluate(() => window.scrollBy(0, 1400));
      await sleep(1500);
      const r = await page.evaluate(() => {
        if (/threads\./.test(location.hostname)) {
          const author = (location.pathname.split('/')[1] || '').replace('@', '');
          const parts = [], images = [];
          for (const b of [...document.querySelectorAll('[data-pressable-container]')].slice(0, 14)) {
            const t = b.innerText.trim();
            if (!t.startsWith(author)) { if (parts.length) break; else continue; }   // 다른 사람 댓글이면 끝
            parts.push(t.replace(/\n+/g, ' / ').slice(0, 1200));
            b.querySelectorAll('img').forEach((x) => { if ((x.naturalWidth || 0) > 250) images.push(x.currentSrc || x.src); });
          }
          return { text: parts.join(' // ').slice(0, 2500), images: images.slice(0, 4) };
        }
        const author = (location.pathname.split('/')[1] || '');
        const parts = [], images = [], replies = [];
        for (const a of [...document.querySelectorAll('article[data-testid="tweet"]')].slice(0, 12)) {
          const name = (a.querySelector('[data-testid="User-Name"]') || {}).innerText || '';
          const te = a.querySelector('[data-testid="tweetText"]');
          const txt = te ? te.innerText.replace(/\s+/g, ' ') : '';
          if (name.includes('@' + author)) {
            parts.push(txt.slice(0, 2000));
            a.querySelectorAll('[data-testid="tweetPhoto"] img').forEach((x) => images.push(x.src.replace(/name=\w+/, 'name=small')));
            const q = a.querySelector('[role="link"] [data-testid="tweetText"]');   // 인용한 글
            if (q && q !== te) parts.push('(인용) ' + q.innerText.replace(/\s+/g, ' ').slice(0, 600));
          } else if (txt && replies.length < 4) replies.push(txt.slice(0, 200));
        }
        return { text: parts.join(' // ').slice(0, 2500) + (replies.length ? ' || 답글: ' + replies.join(' | ') : ''), images: [...new Set(images)].slice(0, 4) };
      });
      await page.close();
      out.push(Object.assign({ url: u }, r));
    } catch (e) { /* 한 장 실패는 넘김 */ }
    await sleep(2000);                                                   // Threads 속도 제한
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
