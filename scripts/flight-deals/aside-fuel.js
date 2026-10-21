// 이번 달 유류할증료 — 대한항공 '한국 출발 국제선 유류할증료' 공지 (Aside, 읽기만). 주소가 YYMM-infuel 패턴.
// 쓰는 법: aside repl "const YM='2026-11'; $(cat scripts/flight-deals/aside-fuel.js)"  → "FLIGHT_FUEL " + JSON {month, bands:[{max, krw}]}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const url = 'https://www.koreanair.com/contents/footer/customer-support/notice/' + YM.slice(0, 4) + '/' + YM.slice(2, 4) + YM.slice(5, 7) + '-infuel';
let res = { month: YM, url, ok: false, bands: [] };
try {
  const page = await openTab(url); await sleep(8000);
  res = await page.evaluate((res) => {
    const rows = document.body.innerText.split('\n').filter((l) => /^\s*~?\s*[\d,]+\s*~?\s*[\d,]*\t/.test(l) || /원\s*$/.test(l));
    const t = document.body.innerText.replace(/\n(?=[^~\d])/g, ' ');
    const bands = [...t.matchAll(/(?:^|\n)\s*(?:~\s*([\d,]+)|([\d,]+)\s*~\s*([\d,]+))\t[^\n]*?([\d,]+)원\s+([\d,]+)원/g)]
      .map((m) => ({ max: Number((m[1] || m[3]).replace(/,/g, '')), krw: Number(m[5].replace(/,/g, '')) }));
    return Object.assign(res, { ok: bands.length >= 8, bands });
  }, res);
  await page.close();
} catch (e) { res.error = String(e).slice(0, 200); }
console.log('FLIGHT_FUEL ' + JSON.stringify(res));
