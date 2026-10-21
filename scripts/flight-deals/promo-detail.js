// 공홈 프로모션 상세 → 구조화 (claude -p, 구독이라 0원). 한 번 읽은 프로모션은 다시 안 읽는다.
//   node promo-detail.js todo                 → 상세를 아직 못 읽은 프로모션을 PROMO_TODO 줄로 (aside-promo-detail.js 입력)
//   node promo-detail.js extract <상세 결과>   → promos.json 각 항목에 detail 을 채운다
const fs = require('fs'), path = require('path'), { spawnSync } = require('child_process');
const OUT = path.resolve(__dirname, '../../data/flight-deals'), F = path.join(OUT, 'promos.json');
const P = JSON.parse(fs.readFileSync(F, 'utf8'));
const want = (x) => (x.regions && x.regions.length) || x.pct;   // 지역 프로모션 + 할인율 있는 전 노선
if (process.argv[2] === 'todo') {
  console.log('PROMO_TODO ' + JSON.stringify(P.items.filter((x) => want(x) && !x.detail).slice(0, 8).map((x) => ({ key: x.key, code: x.code, title: x.title, link: x.link }))));
  process.exit(0);
}
const CLAUDE = [path.join(process.env.HOME, '.local/bin/claude'), '/opt/homebrew/bin/claude'].find((p) => fs.existsSync(p)) || 'claude';
const rows = fs.readFileSync(process.argv[3], 'utf8').split('\n').filter((l) => l.startsWith('FLIGHT_PROMO_DETAIL ')).map((l) => { try { return JSON.parse(l.slice(20)); } catch (e) { return null; } }).filter((x) => x && x.ok && x.text);
const SHAPE = `{
 "buy": {"from":"YYYY-MM-DD","to":"YYYY-MM-DD"} 또는 null,
 "travel": [{"from":"YYYY-MM-DD","to":"YYYY-MM-DD"}],
 "exclude": [{"from":"YYYY-MM-DD","to":"YYYY-MM-DD"}],
 "discounts": [{"region":"유럽|호주|뉴질랜드|캐나다|미국|전 노선","cities":["도시 한글 이름"],"pct":숫자 또는 null,"amount":원 단위 숫자 또는 null,"cabin":"일반석 등 짧게"}],
 "on": "운임" 또는 "총액",
 "how": "받는 방법 한 줄 (예: 결제 화면에서 쿠폰 발급, 코드 입력)",
 "code": "프로모션 코드" 또는 null,
 "conditions": ["짧은 조건 최대 4개 (예: 카카오페이 결제, 홈페이지 로그인, 세이버·스탠다드만)"],
 "fares": [{"city":"도시 한글","iata":"공항 코드","price":원 단위 왕복 총액}]
}`;
let changed = 0;
for (const r of rows) {
  const it = P.items.find((x) => x.key === r.key); if (!it || it.detail) continue;
  const prompt = `아래는 항공사 공식 홈페이지의 이벤트 상세 글이다 (${it.airline} · ${it.title}).\n` +
    `한국 출발 유럽·호주·뉴질랜드·캐나다·미국 항공권에 관련된 내용만 골라, 아래 모양의 JSON 하나로만 답하라 (설명·마크다운 금지).\n` +
    `- 연도가 두 자리(26.)면 20xx 로. 모르는 칸은 null 이나 빈 배열.\n- travel 은 '탑승/출발 기간'. buy 는 '구매/판매/발권/진행 기간'.\n` +
    `- discounts 에는 위 다섯 지역 것만 (아시아·동남아는 넣지 말 것). 지역 구분 없이 전체 적용이면 region "전 노선".\n` +
    `- fares 는 글에 왕복 가격이 적혀 있을 때만 (이코노미만).\n- on: 세금·유류할증료는 할인 안 된다고 적혀 있으면 "운임".\n\n모양:\n${SHAPE}\n\n글:\n<<<\n${r.text.slice(0, 7000)}\n>>>`;
  const out = spawnSync(CLAUDE, ['-p', '--output-format', 'text', '--tools', '', '--strict-mcp-config'], { input: prompt, encoding: 'utf8', timeout: 240000, env: Object.assign({}, process.env, { PATH: path.dirname(CLAUDE) + ':/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:' + (process.env.PATH || '') }) });
  const m = (out.stdout || '').match(/\{[\s\S]*\}/);
  if (!m) { console.error('읽기 실패 ' + it.key + ' ' + (out.stderr || '').slice(0, 200)); continue; }
  try { it.detail = JSON.parse(m[0]); it.detail.url = r.url; it.link = /\/(list|being|promotionList)\/?(\?|#|$)/.test(it.link) && r.url ? r.url : it.link; changed++; console.log('읽음 ' + it.airline + ' · ' + it.title); }
  catch (e) { console.error('JSON 오류 ' + it.key); }
}
fs.writeFileSync(F, JSON.stringify(P, null, 1));
console.log('상세 ' + changed + '개 새로 읽음');
