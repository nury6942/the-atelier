// 항공권 특가 판정 — aside-route.js 결과(FLIGHT_ROUTE 줄들)를 읽어 data/flight-deals/ 에 쓴다
//   1차: node judge.js <구글 결과> --first        → latest.json + 스카이스캐너로 다시 볼 도시를 SKY_TODO 줄로
//   2차: node judge.js <구글 결과> <스카이 결과>   → 스카이스캐너 가격(같은 날짜, 여행사 포함)을 합쳐 다시 판정, 새 '초특가'는 ALERT 줄로
// 기준 (국산 항공사 먼저):
//   · 구글이 알려주는 '보통 가격대'(가장 싼 달의 범위 lo~hi)와 비교
//   · 초특가: 국산 항공사 최저가 ≤ lo, 또는 지난 30일 중간값보다 25% 이상 쌈
//   · 특가:   국산 항공사 최저가 ≤ lo + (hi−lo)×25%, 또는 지난 30일 중간값보다 15% 이상 쌈
//   · 외항사 포함 최저가가 lo 의 90% 아래면 '참고'로만 (아이폰 알림 없음)
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '../..'), OUT = path.join(ROOT, 'data/flight-deals');
const KR = /대한항공|아시아나|Trinity|트리니티|에어프레미아|Air Premia|티웨이|제주항공|진에어|에어부산|이스타|에어서울/;
const FIRST = process.argv.includes('--first');
const SKY_FILE = process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : null;
// 화면용: 도시 → 나라(국기)·공항 코드, 항공사 → 로고 코드 (gstatic.com/flights/airline_logos/70px/<코드>.png)
const PLACE = { london:['gb','LON'], paris:['fr','PAR'], rome:['it','ROM'], milan:['it','MIL'], barcelona:['es','BCN'], madrid:['es','MAD'], lisbon:['pt','LIS'],
  amsterdam:['nl','AMS'], frankfurt:['de','FRA'], munich:['de','MUC'], berlin:['de','BER'], prague:['cz','PRG'], vienna:['at','VIE'], zurich:['ch','ZRH'],
  istanbul:['tr','IST'], athens:['gr','ATH'], helsinki:['fi','HEL'], copenhagen:['dk','CPH'], stockholm:['se','STO'], oslo:['no','OSL'],
  sydney:['au','SYD'], melbourne:['au','MEL'], brisbane:['au','BNE'], perth:['au','PER'], auckland:['nz','AKL'], christchurch:['nz','CHC'],
  vancouver:['ca','YVR'], toronto:['ca','YTO'], calgary:['ca','YYC'], montreal:['ca','YMQ'],
  'los-angeles':['us','LAX'], 'san-francisco':['us','SFO'], 'new-york':['us','NYC'], seattle:['us','SEA'], 'las-vegas':['us','LAS'], chicago:['us','CHI'], boston:['us','BOS'], honolulu:['us','HNL'] };
const AIR = { '대한항공':'KE', '아시아나항공':'OZ', 'Trinity Airways':'TW', '트리니티':'TW', '트리니티 항공':'TW', '에어프레미아':'YP', '티웨이항공':'TW', '제주항공':'7C', '진에어':'LJ', '에어부산':'BX', '이스타항공':'ZE', '에어서울':'RS',
  'KLM':'KL', 'LOT 폴란드항공':'LO', 'SAS항공':'SK', 'THAI':'TG', '델타항공':'DL', '루프트한자':'LH', '버진 애틀랜틱항공':'VS', '비엣젯항공':'VJ', '심천항공':'ZH', '아메리칸항공':'AA',
  '알래스카항공':'AS', '에미레이트항공':'EK', '에어 돌로미티':'EN', '에어아시아':'D7', '에어캐나다':'AC', '에어프랑스':'AF', '에티하드항공':'EY', '웨스트젯':'WS', '유나이티드항공':'UA',
  '일본항공':'JL', '전일본공수':'NH', '젯스타':'JQ', '중국남방항공':'CZ', '카타르항공':'QR', '캐세이패시픽항공':'CX', '터키항공':'TK', '핀란드항공':'AY', '필리핀항공':'PR', '에어차이나':'CA', '중국동방항공':'MU' };
const airCode = (name) => { const first = String(name || '').split(',')[0].trim(); return AIR[first] || null; };
// "11월 5일 (목)~11월 18일 (수)" → ['2026-11-05','2026-11-18'] (지난 달이면 내년)
function tripDates(txt){
  const m = [...String(txt || '').matchAll(/(\d+)월 (\d+)일/g)]; if (!m.length) return null;
  const now = new Date(Date.now() + 9 * 3600e3), y0 = now.getUTCFullYear(), m0 = now.getUTCMonth() + 1;
  let y = y0, prev = 0;
  const out = m.slice(0, 2).map((x, i) => { const mo = +x[1]; if (i === 0 && mo < m0) y = y0 + 1; if (i === 1 && mo < prev) y++; prev = mo; return y + '-' + String(mo).padStart(2, '0') + '-' + String(+x[2]).padStart(2, '0'); });
  return { out: out[0], back: out[1] || null };
}
const CITIES = JSON.parse(fs.readFileSync(path.join(__dirname, 'cities.json'), 'utf8'));
const region = {}; Object.keys(CITIES).forEach((r) => CITIES[r].forEach((s) => (region[s] = r)));
// 알림이 실제로 아이폰(미리알림)에 들어간 뒤에만 run.sh 가 부른다:  node judge.js --mark <키> <가격>
if (process.argv[2] === '--mark') {
  const f = path.join(OUT, 'notified.json'); let n = {}; try { n = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) {}
  n[process.argv[3]] = { price: +process.argv[4], date: new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10) };
  fs.writeFileSync(f, JSON.stringify(n, null, 1)); process.exit(0);
}
const read = (f, d) => { try { return JSON.parse(fs.readFileSync(path.join(OUT, f), 'utf8')); } catch (e) { return d; } };
const kstDate = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
const median = (a) => { if (!a.length) return null; const s = a.slice().sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };

const rows = fs.readFileSync(process.argv[2], 'utf8').split('\n').filter((l) => l.startsWith('FLIGHT_ROUTE '))
  .map((l) => { try { return JSON.parse(l.slice(13)); } catch (e) { return null; } }).filter((x) => x && x.ok);
if (!rows.length) { console.error('수집 0건 — 그대로 둠'); process.exit(2); }
// 스카이스캐너 도시 코드 (여러 공항 도시는 4글자)
const SKY = { LON:'lond', PAR:'pari', ROM:'rome', MIL:'mila', STO:'stoc', YTO:'ytoa', YMQ:'ymqa', NYC:'nyca', CHI:'chia', BER:'ber' };
const skyRows = {};
if (SKY_FILE) { try { fs.readFileSync(SKY_FILE, 'utf8').split('\n').filter((l) => l.startsWith('FLIGHT_SKY ')).forEach((l) => { try { const x = JSON.parse(l.slice(11)); if (x.ok) skyRows[x.slug] = x; } catch (e) {} }); } catch (e) {} }
const skyTodo = [];

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
  // 날짜는 판정 전에 알아야 스카이스캐너와 합칠 수 있다
  let trip = null;
  if (best) {
    const same = (b) => b && b.airline && b.airline.split(',')[0].trim() === best.name && Math.abs(b.price - best.price) / best.price < 0.03;
    if (same(r.direct)) trip = tripDates(r.direct.dates); else if (same(r.rt)) trip = tripDates(r.rt.dates);
  }
  // 스카이스캐너(같은 날짜·여행사 포함)의 국산 항공사 최저가
  const sr = skyRows[r.slug];
  let sky = null;
  if (sr) {
    const skr = (sr.airlines || []).filter((a) => KR.test(a.name)).sort((a, b) => a.price - b.price)[0] || null;
    sky = { price: sr.price, direct: sr.direct, url: sr.url, kr: skr ? { name: skr.name.replace('트리니티 항공', 'Trinity Airways'), price: skr.price, code: airCode(skr.name), direct: !!(best && best.direct && airCode(best.name) === airCode(skr.name)) } : null };
  }
  const p = Math.min(best ? best.price : Infinity, sky && sky.kr ? sky.kr.price : Infinity);
  const pBest = isFinite(p) ? p : null, pSrc = sky && sky.kr && best && sky.kr.price < best.price ? 'sky' : 'google';
  let deal = null, why = '';
  if (pBest && low) {
    const cut = low.lo + (low.hi - low.lo) * 0.25;
    if (pBest <= low.lo) { deal = 'super'; why = '보통 가격대 맨 아래보다 쌈'; }
    else if (pBest <= cut) { deal = 'deal'; why = '보통 가격대 아래쪽'; }
    // 스카이스캐너로 다시 볼 후보: 특가이거나 특가선에서 15% 안
    const sl = (PLACE[r.slug] || [])[1];
    if (FIRST && trip && trip.back && sl && best && best.price <= cut * 1.15) skyTodo.push({ slug: r.slug, sky: SKY[sl] || sl.toLowerCase(), out: trip.out, back: trip.back, gap: best.price / cut });
  }
  if (best && med) {
    const drop = 1 - best.price / med;
    if (drop >= 0.25) { deal = 'super'; why = '지난 30일보다 ' + Math.round(drop * 100) + '% 쌈'; }
    else if (drop >= 0.15 && deal !== 'super') { deal = 'deal'; why = '지난 30일보다 ' + Math.round(drop * 100) + '% 쌈'; }
  }
  const other = !deal && r.rt && low && r.rt.price <= low.lo * 0.9 ? 'other' : null;
  h[today] = { kr: best ? best.price : null, krName: best ? best.name : null, all: r.rt ? r.rt.price : null };
  if (best) best.code = airCode(best.name);
  kr.forEach((a) => (a.code = airCode(a.name)));
  if (r.rt) r.rt.code = airCode(r.rt.airline);
  const pl = PLACE[r.slug] || [];
  const c = { slug: r.slug, city: r.city, region: region[r.slug] || '', cc: pl[0] || null, iata: pl[1] || null, trip, kr: best, krAll: kr, sky, best: pBest, bestSrc: pSrc, rt: r.rt, direct: r.direct, typical: low,
    median30: med, deal: deal || other, why: deal ? why : other ? '외항사 경유 최저가가 보통보다 쌈' : '',
    vsLow: pBest && low ? Math.round((pBest / low.lo - 1) * 100) : null, link: r.link };
  cities.push(c);
  if (deal === 'super' && !FIRST) {
    const key = r.slug + '|' + best.name, prev = notified[key];
    if (!prev || pBest <= prev.price * 0.97 || (Date.parse(today) - Date.parse(prev.date)) / 864e5 > 14) {
      alerts.push(key + '\t' + pBest + '\t✈︎ ' + r.city + ' ' + best.name.replace('Trinity Airways', '트리니티') + (best.direct ? ' 직항' : '') + ' 왕복 ' + Math.round(pBest / 1e4) + '만원' + (trip ? ' ' + trip.out.slice(5).replace('-', '/') + (trip.back ? '~' + trip.back.slice(5).replace('-', '/') : '') : '') +
        (low ? ' (보통 ' + Math.round(low.lo / 1e4) + '~' + Math.round(low.hi / 1e4) + '만)' : '') + '\t' + (pSrc === 'sky' && sky ? sky.url : r.link));
    }
  }
}
// 30일 넘은 기록은 버린다
for (const s in hist) for (const d in hist[s]) if ((Date.parse(today) - Date.parse(d)) / 864e5 > 45) delete hist[s][d];
const rank = { super: 0, deal: 1, other: 2 };
cities.sort((a, b) => (rank[a.deal] ?? 3) - (rank[b.deal] ?? 3) || (a.vsLow ?? 999) - (b.vsLow ?? 999));
fs.writeFileSync(path.join(OUT, 'latest.json'), JSON.stringify({ generatedAt: new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 16), date: today, count: cities.length, cities }, null, 1));
fs.writeFileSync(path.join(OUT, 'history.json'), JSON.stringify(hist));
console.log('도시 ' + cities.length + ' · 초특가 ' + cities.filter((c) => c.deal === 'super').length + ' · 특가 ' + cities.filter((c) => c.deal === 'deal').length);
alerts.forEach((a) => console.log('ALERT ' + a));
if (FIRST) { skyTodo.sort((a, b) => a.gap - b.gap); console.log('SKY_TODO ' + JSON.stringify(skyTodo.slice(0, 8).map(({ gap, ...x }) => x))); }
if (SKY_FILE) console.log('스카이스캐너 ' + Object.keys(skyRows).length + '곳 합침');
