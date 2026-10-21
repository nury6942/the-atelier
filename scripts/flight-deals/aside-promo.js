// 항공권 특가 — 국산 항공사 공홈 '진행 중 이벤트' 목록을 읽는다 (Aside, 읽기만)
// 쓰는 법: aside repl "$(cat scripts/flight-deals/aside-promo.js)"
// 결과: 항공사마다 한 줄 "FLIGHT_PROMO " + JSON {code, url, items:[{title, sub, start, end, link}]}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SITES = [
  { code: 'KE', name: '대한항공', url: 'https://www.koreanair.com/contents/promotion/list' },
  { code: 'OZ', name: '아시아나항공', url: 'https://flyasiana.com/C/KR/KO/event/index' },
  { code: 'TW', name: '트리니티', url: 'https://www.trinityairways.com/app/promotion/event/being' },
  { code: 'YP', name: '에어프레미아', url: 'https://www.airpremia.com/event/promotionList' },
];
for (const s of SITES) {
  let res = { code: s.code, name: s.name, url: s.url, ok: false, items: [] };
  try {
    const page = await openTab(s.url);
    await sleep(8000);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await sleep(2000);
    res = await page.evaluate((res) => {
      const lines = document.body.innerText.split('\n').map((x) => x.replace(/\s+/g, ' ').trim()).filter(Boolean);
      const D = /(20\d\d)\s*[.\-년]\s*(\d{1,2})\s*[.\-월]\s*(\d{1,2})\s*일?/g;
      const META = /^(이벤트 기간|진행중인 이벤트|이전 슬라이드|다음 슬라이드|진행중|진행 중|D-\d+|D-DAY|NEW|종료|당첨자 발표|전체|고객참여|항공권구매|마일리지혜택|기타)$/i;
      const iso = (m) => m[1] + '-' + String(+m[2]).padStart(2, '0') + '-' + String(+m[3]).padStart(2, '0');
      const anchors = [...document.querySelectorAll('a')].map((a) => [a.innerText.replace(/\s+/g, ' ').trim(), a.href]).filter((x) => x[0] && /^https?:/.test(x[1]));
      const items = [];
      lines.forEach((l, i) => {
        if (!/~/.test(l)) return;
        const ds = [...l.matchAll(D)]; if (!ds.length || l.length > 60) return;
        const prev = [];
        for (let j = i - 1; j >= 0 && prev.length < 2; j--) {
          const p = lines[j];
          if ([...p.matchAll(D)].length) break;
          if (META.test(p)) continue;
          prev.unshift(p);
        }
        if (!prev.length) return;
        const title = prev.length === 2 ? prev[0] : prev[0], sub = prev.length === 2 ? prev[1] : '';
        const hit = anchors.find((a) => a[0].includes(title.slice(0, 12)));
        items.push({ title, sub, start: iso(ds[0]), end: ds[1] ? iso(ds[1]) : null, link: hit ? hit[1] : null });
      });
      return Object.assign(res, { ok: items.length > 0, items: items.slice(0, 30) });
    }, res);
    await page.close();
  } catch (e) { res.error = String(e).slice(0, 200); }
  console.log('FLIGHT_PROMO ' + JSON.stringify(res));
}
