// 공홈 프로모션 정리 — aside-promo.js 결과(FLIGHT_PROMO 줄)를 읽어 data/flight-deals/promos.json 을 쓴다
//   node promo.js <결과 파일>   → 새로 뜬 '장거리 항공권' 프로모션은 ALERT 줄(키\t0\t제목\t주소)로 — 알림은 run.sh 가 보내고 --mark 로 기록
// 남기는 것: 항공권 할인·특가 중 유럽·호주·뉴질랜드·캐나다·미국 또는 '전 노선·국제선 전체'. 아시아만·면세·eSIM·제휴 구독은 뺀다.
const fs = require('fs'), path = require('path');
const OUT = path.resolve(__dirname, '../../data/flight-deals');
const REG = {
  유럽: /유럽|파리|런던|로마|바르셀로나|프라하|체코|프랑크푸르트|뮌헨|이스탄불|튀르키예|마드리드|리스본|밀라노|비엔나|취리히|암스테르담|헬싱키|코펜하겐|스톡홀름|오슬로|아테네|부다페스트|자그레브|베니스|스페인|이탈리아|독일|프랑스|영국|포르투갈|스위스|북유럽/,
  호주: /호주|시드니|멜버른|브리즈번|퍼스|대양주/,
  뉴질랜드: /뉴질랜드|오클랜드|크라이스트처치|대양주/,
  캐나다: /캐나다|밴쿠버|토론토|캘거리|몬트리올|미주/,
  미국: /미국|미주|뉴욕|로스앤젤레스|\bLA\b|샌프란시스코|시애틀|라스베이거스|시카고|보스턴|호놀룰루|하와이|워싱턴|애틀랜타|괌 제외/,
};
const ALL = /전 노선|전노선|국제선 (최대|전|특가|할인)|국제선 할인쿠폰|항공권 특가 이벤트|첫구매|웰컴쿠폰|카카오페이로 결제/;
const FARE = /할인|특가|%|운임|항공권|세일|얼리버드|쿠폰|캐시백/;
const NOT = /면세|eSIM|웨이브|Wavve|밀리의서재|Wi-?Fi|기차|당첨|보험|스케줄 안내|홈페이지를 이용|피덴자|아웃리거|마일리지 특별기/i;
const ASIA = /중화권|중국|일본|동남아|동·서남아|서남아|괌|사이판|대만|홍콩|마카오|베트남|태국|필리핀|싱가포르|삿포로|호치민|다낭|오사카|도쿄|후쿠오카|오키나와|발리|세부/;
const HEAD = /^(진행중인 이벤트|이전 슬라이드|다음 슬라이드|이벤트)$/;
const SITE = { KE: 'https://www.koreanair.com/contents/promotion/list', OZ: 'https://flyasiana.com/C/KR/KO/event/index', TW: 'https://www.trinityairways.com/app/promotion/event/being', YP: 'https://www.airpremia.com/event/promotionList' };
const kst = () => new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10);
const today = kst();
let prev = {}, hadPrev = fs.existsSync(path.join(OUT, 'promos.json')); try { (JSON.parse(fs.readFileSync(path.join(OUT, 'promos.json'), 'utf8')).items || []).forEach((x) => (prev[x.key] = x)); } catch (e) {}
let notified = {}; try { notified = JSON.parse(fs.readFileSync(path.join(OUT, 'notified.json'), 'utf8')); } catch (e) {}
const got = fs.readFileSync(process.argv[2], 'utf8').split('\n').filter((l) => l.startsWith('FLIGHT_PROMO ')).map((l) => { try { return JSON.parse(l.slice(13)); } catch (e) { return null; } }).filter(Boolean);
const okSites = new Set(got.filter((g) => g.ok).map((g) => g.code));
const items = [], alerts = [];
for (const g of got) for (const it0 of g.items || []) {
  const it = HEAD.test(it0.title) && it0.sub ? Object.assign({}, it0, { title: it0.sub, sub: '' }) : it0;
  const text = it.title + ' ' + (it.sub || '');
  if (it.end && it.end < today) continue;
  if (NOT.test(text)) continue;
  const regions = Object.keys(REG).filter((r) => REG[r].test(text));
  const all = ALL.test(text) && !ASIA.test(text) && FARE.test(text);
  if (!regions.length && !all) continue;          // 아시아만 (중화권·괌·동남아·삿포로…) · 항공권과 무관
  const key = 'promo|' + g.code + '|' + it.title.slice(0, 40);
  const p = prev[key];
  const x = { key, code: g.code, airline: g.name, title: it.title, sub: it.sub || '', start: it.start, end: it.end, regions, all: all && !regions.length,
    pct: Math.max(0, ...[...text.matchAll(/(\d{1,2})\s*%/g)].map((m) => +m[1])) || null, link: it.link || SITE[g.code], firstSeen: p ? p.firstSeen : today };
  items.push(x);
  // 지역이 콕 집힌 새 프로모션만 아이폰으로 (전 노선 쿠폰류는 화면에만)
  if (hadPrev && regions.length && !notified[key] && (!p || p.firstSeen === today)) alerts.push(key + '\t0\t✈︎ ' + g.name + ' ' + it.title + (it.sub ? ' · ' + it.sub : '') + (it.end ? ' (~' + it.end.slice(5).replace('-', '/') + ')' : '') + '\t' + x.link);
}
// 이번에 못 읽은 항공사는 지난번 것을 그대로 둔다 (사이트가 잠깐 막혀도 화면이 비지 않게)
Object.values(prev).forEach((p) => { if (!okSites.has(p.code) && (!p.end || p.end >= today)) items.push(p); });
items.sort((a, b) => (b.regions.length > 0) - (a.regions.length > 0) || String(b.firstSeen).localeCompare(String(a.firstSeen)) || String(a.end).localeCompare(String(b.end)));
fs.writeFileSync(path.join(OUT, 'promos.json'), JSON.stringify({ generatedAt: new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 16), sites: [...okSites], items }, null, 1));
console.log('공홈 프로모션 ' + items.length + '개 (읽은 항공사 ' + okSites.size + '/4)');
alerts.forEach((a) => console.log('ALERT ' + a));
