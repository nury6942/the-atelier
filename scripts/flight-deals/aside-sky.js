// 항공권 특가 — 스카이스캐너에서 '같은 날짜' 왕복을 찾아 여행사 포함 최저가·항공사별 최저가를 읽는다 (Aside, 읽기만)
// 쓰는 법: aside repl "const TODO=[{slug:'vancouver',sky:'yvr',out:'2026-11-05',back:'2026-11-18'}]; $(cat scripts/flight-deals/aside-sky.js)"
// 결과: 도시마다 한 줄 "FLIGHT_SKY " + JSON
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ymd = (iso) => iso.slice(2, 4) + iso.slice(5, 7) + iso.slice(8, 10);
for (const t of TODO) {
  const url = 'https://www.skyscanner.co.kr/transport/flights/sela/' + t.sky + '/' + ymd(t.out) + '/' + ymd(t.back) + '/?adultsv2=1&cabinclass=economy&rtn=1';
  let res = { slug: t.slug, url, ok: false };
  try {
    const page = await openTab(url);
    // 판매사 가격을 다 받아올 때까지 (최대 30초)
    for (let i = 0; i < 10; i++) {
      await sleep(3000);
      const done = await page.evaluate(() => { const m = document.body.innerText.match(/\((\d+) 판매사 (\d+) 확인 완료\)/); return m ? +m[1] - +m[2] : (/최저가\n₩/.test(document.body.innerText) ? 0 : 99); });
      if (i >= 3 && done <= 0) break;
    }
    res = await page.evaluate((r) => {
      const t = document.body.innerText.replace(/[ \t\u200b]+\n/g, '\n').replace(/\n[ \t]+/g, '\n').replace(/\n{2,}/g, '\n');
      const won = (s) => Number(String(s).replace(/[^\d]/g, '')) || null;
      const blocked = /사람인지|로봇|captcha|확인해 주세요/i.test(t) && !/최저가/.test(t);
      const cheapest = (t.match(/최저가\n₩([\d,]+)/) || [])[1];
      const direct = (t.match(/\n직항\n₩([\d,]+)부터/) || [])[1];
      const sec = (t.split(/\n항공사\n모두 선택\n모두 지우기\n/)[1] || '').split(/\n공항\n/)[0];
      const airlines = [...sec.matchAll(/([^\n₩]+)\n₩([\d,]+)부터\n이 항목만/g)].map((m) => ({ name: m[1].trim(), price: won(m[2]) }))
        .filter((a) => !/원월드|스타 얼라이언스|스카이팀|항공사 조합/.test(a.name));
      return Object.assign(r, { ok: !!cheapest, blocked, price: won(cheapest), direct: won(direct), airlines });
    }, res);
    await page.close();
  } catch (e) { res.error = String(e).slice(0, 200); }
  console.log('FLIGHT_SKY ' + JSON.stringify(res));
}
