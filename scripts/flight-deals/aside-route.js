// 항공권 특가 — 구글 항공편 '노선 페이지'(서울 출발 ○○ 도착)에서 지금 최저가와 '보통 가격대'를 읽는다 (Aside, 읽기만)
// 쓰는 법: aside repl "const CITIES=['london','paris']; $(cat scripts/flight-deals/aside-route.js)"
// 결과: 도시마다 한 줄 "FLIGHT_ROUTE " + JSON
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
for (const slug of CITIES) {
  let res = { slug, ok: false };
  try {
    const page = await openTab('https://www.google.com/travel/flights/flights-from-seoul-to-' + slug + '.html?hl=ko&curr=KRW&gl=KR');
    await sleep(5000);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await sleep(2000);
    res = await page.evaluate((slug) => {
      const t = document.body.innerText;
      const won = (s) => Number(String(s).replace(/[^\d]/g, '')) || null;
      const block = (title) => {
        const m = t.match(new RegExp(title + '\\n₩([\\d,]+)\\n([^\\n]+)\\n([^\\n]+)\\n([^\\n]+)\\n([^\\n]+)'));
        return m ? { price: won(m[1]), airline: m[2], stops: m[3], dur: m[4], dates: m[5] } : null;
      };
      const typ = [...t.matchAll(/(\d+)월\s*(최저가|가장 비쌈)\s*\n\s*일반적인 가격대:?\s*₩([\d,]+)\s*[–~\-]\s*₩?([\d,]+)/g)].map((m) => ({ month: +m[1], kind: m[2] === '최저가' ? 'low' : 'high', lo: won(m[3]), hi: won(m[4]) }));
      // '인기 항공사' 칸: 항공사마다 최저가 (국산 항공사를 먼저 보려고)
      const sec = (t.split(/인기 항공사\n/)[1] || '').split(/주변의 인기 공항/)[0];
      const airlines = [...sec.matchAll(/([^\n₩]+)\n(?:(직항)\n)?₩([\d,]+)부터/g)].map((m) => ({ name: m[1].trim(), direct: !!m[2], price: won(m[3]) }));
      const links = [...document.querySelectorAll('a')].filter((a) => /항공편 보기/.test(a.innerText)).map((a) => a.href);
      const title = (t.match(/서울특별시발 (.+?)행 저가 항공편/) || [])[1] || slug;
      return { slug, ok: !!block('최저가 왕복 항공편'), city: title, rt: block('최저가 왕복 항공편'), direct: block('최저가 직항 항공편'),
        typical: typ, airlines, link: links[0] || location.href, directLink: links[2] || null };
    }, slug);
    await page.close();
  } catch (e) { res.error = String(e).slice(0, 200); }
  console.log('FLIGHT_ROUTE ' + JSON.stringify(res));
}
