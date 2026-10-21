// 공홈 프로모션 → '이걸 쓰면 얼마' 추정
//   node promo-price.js todo                    → 프로모션마다 대표 도시·날짜(탑승 기간 안, 2주 뒤 화요일 출발 9박)를 SKY_TODO 줄로
//   node promo-price.js apply <스카이 결과> <유류할증료 결과>
//      할인 = 할인율 × 운임, 운임 = 총액 − 유류할증료(왕복) − 세금(추정)   ('운임에만 할인' 프로모션)
//      유류할증료 = 대한항공 이번 달 공지 대권거리 구간표 (다른 항공사도 비슷해서 같은 표로 추정)
const fs = require('fs'), path = require('path');
const OUT = path.resolve(__dirname, '../../data/flight-deals'), F = path.join(OUT, 'promos.json');
const P = JSON.parse(fs.readFileSync(F, 'utf8')), L = JSON.parse(fs.readFileSync(path.join(OUT, 'latest.json'), 'utf8'));
const SKY = { LON:'lond', PAR:'pari', ROM:'rome', MIL:'mila', STO:'stoc', YTO:'ytoa', YMQ:'ymqa', NYC:'nyca', CHI:'chia', BER:'ber' };
// 대권거리(마일) 구간: 6 = 4,000~4,999 · 7 = 5,000~6,499 · 8 = 6,500~9,999 (나머지 장거리 도시는 7)
const BAND = { istanbul:6, brisbane:6, honolulu:6, perth:6, helsinki:6, stockholm:6, oslo:6, 'new-york':8, boston:8, chicago:8, toronto:8, montreal:8 };
// 왕복 세금·공항 요금 추정(원): 인천 출발 2.8만 + 도착 나라 (영국은 출국세가 커서 따로)
const TAX = { gb:200000, de:90000, fr:75000, it:65000, es:60000, pt:60000, nl:85000, at:70000, ch:70000, cz:60000, gr:60000, tr:35000, fi:65000, dk:70000, se:65000, no:65000, us:65000, ca:70000, au:90000, nz:65000 };
const AIRNAME = { KE:/대한항공/, OZ:/아시아나/, TW:/트리니티|Trinity/, YP:/에어 ?프레미아/ };
const iso = (d) => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
const pd = (s) => { const p = s.split('-'); return new Date(+p[0], +p[1] - 1, +p[2]); };
function pickDates(d){
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const ranges = (d.travel && d.travel.length ? d.travel : [{ from: iso(today), to: iso(new Date(today.getTime() + 300 * 864e5)) }]);
  const bad = (x) => (d.exclude || []).some((e) => e.from && e.to && x >= e.from && x <= e.to);
  for (const r of ranges) {
    let o = new Date(Math.max(pd(r.from), today.getTime() + 14 * 864e5));
    while (o.getDay() !== 2) o.setDate(o.getDate() + 1);           // 화요일 출발
    for (let k = 0; k < 12; k++, o.setDate(o.getDate() + 7)) {
      const b = new Date(o); b.setDate(b.getDate() + 9);
      if (iso(b) > r.to) { b.setTime(pd(r.to)); if ((b - o) / 864e5 < 5) break; }
      if (!bad(iso(o)) && !bad(iso(b))) return { out: iso(o), back: iso(b) };
    }
  }
  return null;
}
// 프로모션 → 대표 도시들 (지정 도시가 있으면 그중, 없으면 그 지역에서 이 항공사가 가는 도시) — 구글 기준 그 항공사 최저가 싼 순 3곳
function plan(x){
  const d = x.detail; if (!d) return [];
  const disc = (d.discounts || []).filter((v) => v.pct && !/비즈니스|프레스티지/.test(v.cabin || ''));
  const out = [];
  for (const v of disc) {
    const cand = L.cities.filter((c) => (v.region === '전 노선' || c.region === v.region) && (!v.cities || !v.cities.length || v.cities.some((n) => c.city.includes(n) || n.includes(c.city))))
      .map((c) => ({ c, a: (c.krAll || []).find((a) => AIRNAME[x.code].test(a.name)) })).filter((z) => z.a).sort((p, q) => p.a.price - q.a.price);
    cand.slice(0, v.region === '전 노선' ? 2 : (new Set(disc.map((q) => q.region)).size > 1 ? 2 : 3)).forEach((z) => { if (!out.some((o) => o.slug === z.c.slug)) out.push({ slug: z.c.slug, pct: v.pct, region: v.region, google: z.a.price }); });
  }
  const dt = pickDates(d); if (!dt) return [];
  return out.slice(0, 6).map((o) => Object.assign(o, dt));
}
if (process.argv[2] === 'todo') {
  const todo = [];
  P.items.forEach((x) => { const pl = plan(x); x.plan = pl; pl.forEach((o) => { const c = L.cities.find((c) => c.slug === o.slug); if (c && !todo.some((t) => t.slug === o.slug && t.out === o.out)) todo.push({ slug: o.slug, sky: SKY[c.iata] || String(c.iata).toLowerCase(), out: o.out, back: o.back }); }); });
  fs.writeFileSync(F, JSON.stringify(P, null, 1));
  console.log('SKY_TODO ' + JSON.stringify(todo.slice(0, 14)));
  process.exit(0);
}
// apply
const read = (f, tag) => { try { return fs.readFileSync(f, 'utf8').split('\n').filter((l) => l.startsWith(tag + ' ')).map((l) => JSON.parse(l.slice(tag.length + 1))); } catch (e) { return []; } };
const sky = read(process.argv[3], 'FLIGHT_SKY');
let fuel = read(process.argv[4], 'FLIGHT_FUEL').find((f) => f.ok);
const FF = path.join(OUT, 'fuel.json');
if (fuel) fs.writeFileSync(FF, JSON.stringify(fuel, null, 1)); else { try { fuel = JSON.parse(fs.readFileSync(FF, 'utf8')); } catch (e) {} }
const band = (slug) => { const b = fuel && fuel.bands; if (!b) return null; return b[BAND[slug] || 7] ? b[BAND[slug] || 7].krw : null; };
let n = 0;
P.items.forEach((x) => {
  if (!x.plan || !x.plan.length) { delete x.est; return; }
  x.est = x.plan.map((o) => {
    const c = L.cities.find((c) => c.slug === o.slug) || {};
    const s = sky.find((s) => s.slug === o.slug && s.url && s.url.includes(o.out.slice(2).replace(/-/g, '')));
    const sa = s && (s.airlines || []).find((a) => AIRNAME[x.code].test(a.name));
    const price = sa ? sa.price : o.google, src = sa ? 'sky' : 'google';
    const f1 = band(o.slug), fuelRt = f1 ? f1 * 2 : null, tax = 28000 + (TAX[c.cc] || 65000);
    const onFare = !x.detail || x.detail.on !== '총액';
    const fare = onFare && fuelRt ? Math.max(0, price - fuelRt - tax) : price;
    const discount = Math.round(fare * o.pct / 100 / 100) * 100;
    n++;
    return { slug: o.slug, city: c.city, cc: c.cc, region: o.region, out: src === 'sky' ? o.out : null, back: src === 'sky' ? o.back : null, price, src, url: s ? s.url : c.link,
      pct: o.pct, onFare, fuel: fuelRt, tax, fare, discount, final: price - discount };
  });
});
P.fuelMonth = fuel ? fuel.month : null;
fs.writeFileSync(F, JSON.stringify(P, null, 1));
console.log('할인 적용가 추정 ' + n + '건 (유류할증료 ' + (fuel ? fuel.month : '없음') + ')');
