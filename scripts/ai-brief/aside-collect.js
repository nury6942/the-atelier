// AI Brief 소셜 수집 — Aside 브라우저(아이맥, X·Threads 로그인 돼 있음)로 글 후보를 모은다.
// 쓰는 법 (아이맥):  aside repl "const SRC='x-list'; $(cat scripts/ai-brief/aside-collect.js)"
//   SRC: x-list | x-search:<검색어> | threads-home | threads-following | threads-search:<검색어>
// 결과: 마지막 줄에 "AIBRIEF_JSON " + JSON 배열 — {src,url,author,at,likes,replies,media,text}
// aside repl 한 번은 120초 제한이라 화면 하나씩 따로 부른다. 읽기만 한다(누르기·좋아요 없음).
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SOURCES = {
  'x-list': { url: 'https://x.com/i/lists/2110638450106061286', scrolls: 8 },
  'threads-home': { url: 'https://www.threads.com/', scrolls: 14 },
  'threads-following': { url: 'https://www.threads.com/following', scrolls: 8 },
};
let src = SOURCES[SRC];
if (!src && SRC.startsWith('x-search:')) {
  const since = new Date(Date.now() - 3 * 864e5).toISOString().slice(0, 10);
  src = { url: 'https://x.com/search?f=top&q=' + encodeURIComponent(SRC.slice(9) + ' since:' + since), scrolls: 4 };
}
if (!src && SRC.startsWith('threads-search:')) {
  src = { url: 'https://www.threads.com/search?serp_type=default&q=' + encodeURIComponent(SRC.slice(15)), scrolls: 4 };
}
if (!src) throw new Error('모르는 SRC: ' + SRC);

const page = await openTab(src.url);
await sleep(6000);
const acc = {};
const grab = async () => {
  const got = await page.evaluate(() => {
    function num(t) {
      const m = String(t).trim().match(/^([\d.,]+)\s*(천|만|K|M)?$/i);
      if (!m) return null;
      const n = parseFloat(m[1].replace(/,/g, '')), u = (m[2] || '').toLowerCase();
      return Math.round(n * (u === '천' || u === 'k' ? 1e3 : u === '만' ? 1e4 : u === 'm' ? 1e6 : 1));
    }
    const out = [];
    if (/threads\./.test(location.hostname)) {
      document.querySelectorAll('a[href*="/post/"] time').forEach((t) => {
        const a = t.closest('a'), href = a.getAttribute('href').split('?')[0];
        let box = a;
        for (let i = 0; i < 14 && box; i++) { if (box.getAttribute && box.getAttribute('data-pressable-container')) break; box = box.parentElement; }
        box = box || a.parentElement;
        const lines = box.innerText.split('\n').map((s) => s.trim()).filter(Boolean).filter((s) => s !== 'AI 콘텐츠' && s !== '번역하기');
        const tail = [];
        for (let j = lines.length - 1; j >= 0 && tail.length < 4; j--) { const v = num(lines[j]); if (v === null) break; tail.unshift(v); }
        const media = [...box.querySelectorAll('img,video')].some((x) => (x.naturalWidth || x.videoWidth || 0) > 200);
        out.push({ src: 'threads', url: 'https://www.threads.com' + href, author: '@' + (href.split('/')[1] || '').replace('@', ''),
          at: t.getAttribute('datetime'), likes: tail[0] || 0, replies: tail[1] || 0, media,
          text: lines.slice(2, lines.length - tail.length).join(' ').slice(0, 500) });
      });
    } else {
      document.querySelectorAll('article[data-testid="tweet"]').forEach((art) => {
        const t = art.querySelector('time'); if (!t) return;
        const a = t.closest('a'), href = a ? a.getAttribute('href') : null; if (!href) return;
        const te = art.querySelector('[data-testid="tweetText"]');
        const metric = (id) => { const el = art.querySelector('[data-testid="' + id + '"]'); return el ? (num(el.innerText) || 0) : 0; };
        out.push({ src: 'x', url: 'https://x.com' + href, author: '@' + href.split('/')[1], at: t.getAttribute('datetime'),
          likes: metric('like'), replies: metric('reply'), media: !!art.querySelector('[data-testid="tweetPhoto"], video'),
          text: (te ? te.innerText : '').replace(/\s+/g, ' ').slice(0, 500) });
      });
    }
    return out;
  });
  for (const p of got) if (!acc[p.url]) acc[p.url] = p;
};
for (let i = 0; i < src.scrolls; i++) {
  await grab();
  await page.evaluate(() => window.scrollBy(0, 2600));
  await sleep(2200);
}
await grab();
await page.close();
console.log('AIBRIEF_JSON ' + JSON.stringify(Object.values(acc)));
