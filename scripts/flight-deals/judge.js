// 항공권 특가 판정 — aside-route.js 결과(FLIGHT_ROUTE 줄들)를 읽어 data/flight-deals/ 에 쓴다
//   node judge.js <수집 결과 파일>   → latest.json · history.json 갱신, 아이폰에 보낼 새 '초특가'는 ALERT 줄로 출력
// 기준 (국산 항공사 먼저):
//   · 구글이 알려주는 '보통 가격대'(가장 싼 달의 범위 lo~hi)와 비교
//   · 초특가: 국산 항공사 최저가 ≤ lo, 또는 지난 30일 중간값보다 25% 이상 쌈
//   · 특가:   국산 항공사 최저가 ≤ lo + (hi−lo)×25%, 또는 지난 30일 중간값보다 15% 이상 쌈
//   · 외항사 포함 최저가가 lo 의 90% 아래면 '참고'로만 (아이폰 알림 없음)
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '../..'), OUT = path.join(ROOT, 'data/flight-deals');
const KR = /대한항공|아시아나|Trinity|트리니티|에어프레미아|Air Premia|티웨이|제주항공|진에어|에어부산|이스타|에어서울/;
const CITIES = JSON.parse(fs.readFileSync(path.join(__dirname, 'cities.json'), 'utf8'));
const region = {}; Object.keys(CITIES).forEach((r) => CITIES[r].forEach((s) => (region[s] = r)));
const read = (f, d) => { try { return JSON.parse(fs.readFileSync(path.join(OUT, f), 'utf8')); } catch (e) { return d; } };
const kstDate = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
const median = (a) => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };

const rows = fs.readFileSync(process.argv[2], 'utf8').split('\n').filter((l) => l.startsWith('FLIGHT_ROUTE '))
  .map((l) => { try { return JSON.parse(l.slice(13)); } catch (e) { return null; } }).filter((x) => x && x.ok);
if (!rows.length) { console.error('수집 0건 — 그대로 둠'); process.exit(2); }

fs.mkdirSync(OUT, { recursive: true });
const today = kstDate(), hist = read('history.json', {}), notified = read('notified.json', {});
const cities = [], alerts = [];
for (const r of rows) {
  const kr = (r.airlines || []).filter((a) => KR.test(a.name)).sort((a, b) => a.price - b.price);
  const best = kr[0] || null;
  const low = (r.typical || []).find((t) => t.kind === 'low') || null;
  const h = (hist[r.slug] = hist[r.slug] || {});
  const past = Object.keys(h).filter((d) => d < today && (Date.parse(today) - Date.parse(d)) / 864e5 <= 30).map((d) => h[d].kr).filter(Boolean);
  const med = past.length >= 7 ? median(past) : null;
  let deal = null, why = '';
  if (best && low) {
    const cut = low.lo + (low.hi - low.lo) * 0.25;
    if (best.price <= low.lo) { deal = 'super'; why = '보통 가격대 맨 아래보다 쌈'; }
    else if (best.price <= cut) { deal = 'deal'; why = '보통 가격대 아래쪽'; }
  }
  if (best && med) {
    const drop = 1 - best.price / med;
    if (drop >= 0.25) { deal = 'super'; why = '지난 30일보다 ' + Math.round(drop * 100) + '% 쌈'; }
    else if (drop >= 0.15 && deal !== 'super') { deal = 'deal'; why = '지난 30일보다 ' + Math.round(drop * 100) + '% 쌈'; }
  }
  const other = !deal && r.rt && low && r.rt.price <= low.lo * 0.9 ? 'other' : null;
  h[today] = { kr: best ? best.price : null, krName: best ? best.name : null, all: r.rt ? r.rt.price : null };
  const c = { slug: r.slug, city: r.city, region: region[r.slug] || '', kr: best, krAll: kr, rt: r.rt, direct: r.direct, typical: low,
    median30: med, deal: deal || other, why: deal ? why : other ? '외항사 경유 최저가가 보통보다 쌈' : '',
    vsLow: best && low ? Math.round((best.price / low.lo - 1) * 100) : null, link: r.link };
  cities.push(c);
  if (deal === 'super') {
    const key = r.slug + '|' + best.name, prev = notified[key];
    if (!prev || best.price <= prev.price * 0.97 || (Date.parse(today) - Date.parse(prev.date)) / 864e5 > 14) {
      notified[key] = { price: best.price, date: today };
      alerts.push('✈︎ ' + r.city + ' ' + best.name.replace('Trinity Airways', '트리니티') + (best.direct ? ' 직항' : '') + ' 왕복 ' + Math.round(best.price / 1e4) + '만원' +
        (low ? ' (보통 ' + Math.round(low.lo / 1e4) + '~' + Math.round(low.hi / 1e4) + '만)' : '') + '\t' + r.link);
    }
  }
}
// 30일 넘은 기록은 버린다
for (const s in hist) for (const d in hist[s]) if ((Date.parse(today) - Date.parse(d)) / 864e5 > 45) delete hist[s][d];
const rank = { super: 0, deal: 1, other: 2 };
cities.sort((a, b) => (rank[a.deal] ?? 3) - (rank[b.deal] ?? 3) || (a.vsLow ?? 999) - (b.vsLow ?? 999));
fs.writeFileSync(path.join(OUT, 'latest.json'), JSON.stringify({ generatedAt: new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 16), date: today, count: cities.length, cities }, null, 1));
fs.writeFileSync(path.join(OUT, 'history.json'), JSON.stringify(hist));
fs.writeFileSync(path.join(OUT, 'notified.json'), JSON.stringify(notified, null, 1));
console.log('도시 ' + cities.length + ' · 초특가 ' + cities.filter((c) => c.deal === 'super').length + ' · 특가 ' + cities.filter((c) => c.deal === 'deal').length);
alerts.forEach((a) => console.log('ALERT ' + a));
