#!/usr/bin/env node
// market.json → 분석 글(카드) → market.json 의 insights 칸에 넣음
//   node scripts/postype-market/insights.mjs ~/postype-market-data/2026-11-07
// claude -p (구독, opus → 안 되면 sonnet). 숫자는 아래 요약에서만 쓰게 하고, 지어내기 금지.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';

const DIR = process.argv[2].replace(/^~/, os.homedir());
const file = path.join(DIR, 'market.json');
const D = JSON.parse(fs.readFileSync(file, 'utf8'));
const log = (...a) => console.error('[insights]', ...a);

// ── 요약 (claude 에 넘길 숫자)
const months = D.meta.months;
const lastFull = D.meta.last3[D.meta.last3.length - 1];
const full = months.filter(m => m <= lastFull);
const tot = (ms, k) => ms.reduce((s, m) => { const r = D.months.find(x => x.month === m); return s + (r ? [r.posts, r.likes, r.estRev][k] : 0); }, 0) || 1;
const win = (x, ms, k = 2) => ms.reduce((s, m) => s + ((x.monthly || {})[m]?.[k] || 0), 0);
function view(list, n, top = 15, minCh = 1) {
  const cur = full.slice(-n), prev = full.length >= 2 * n ? full.slice(-2 * n, -n) : null;
  return list.filter(x => x.channels >= minCh).map(x => {
    const v = win(x, cur), sh = v / tot(cur, 2);
    const g = prev ? (() => { const ps = win(x, prev) / tot(prev, 2); return ps > 0 ? Math.round(100 * (sh - ps) / ps) : null; })() : null;
    return { name: x.key, group: x.group, rev: Math.round(v / 1e4) + '만', share: Math.round(1000 * sh) / 10 + '%', growth: g == null ? null : g + '%', authors: x.channels, revPerPaidPost: x.revPerPaidPost, top3Share: x.top3Share + '%', soloPosts: x.soloPosts, _v: v };
  }).sort((a, b) => b._v - a._v).slice(0, top).map(({ _v, ...r }) => r);
}
const authorBrief = (p) => (p?.topAuthorsDetail || []).slice(0, 3).map(a => ({ channel: a.title, share: a.share + '%', created: a.createdAt, subs: a.subscribers, posts: a.posts, paid: a.paidPosts, price: a.medPrice, gapDays: a.medGapDays, firstLast: a.firstPost + '~' + a.lastPost, series: a.series, themes: a.themes, keywords: a.keywords, mine: a.mine }));
const P = Object.fromEntries(D.people.map(p => [p.key, p]));
const st = D.strategy || {};
const summary = {
  range: D.meta.from + '~' + D.meta.to, posts: D.meta.posts, channels: D.meta.channelsTotal, windowsNote: '3m/6m/12m = 최근 다 찬 달 기준, growth = 바로 앞 같은 길이 기간 대비 매출 점유 변화',
  buyRate: D.meta.buyRate, estimateCheck: D.check,
  people3m: view(D.people, 3, 20), people6m: view(D.people, 6, 12), people12m: view(D.people, 12, 12),
  units3m: view(D.units || [], 3, 4), units6m: view(D.units || [], 6, 4),
  groups3m: view(D.groups, 3, 10),
  keywords3m: view(D.keywords || [], 3, 25, 10), keywordsRising3m: view(D.keywords || [], 3, 200, 10).filter(k => k.growth != null).sort((a, b) => parseFloat(b.growth) - parseFloat(a.growth)).slice(0, 10),
  keywordsFalling3m: view(D.keywords || [], 3, 200, 10).filter(k => k.growth != null && parseFloat(k.growth) < 0).sort((a, b) => parseFloat(a.growth) - parseFloat(b.growth)).slice(0, 10),
  themes3m: view(D.themes, 3, 12),
  topAuthors: { 리쿠: authorBrief(P['리쿠']), 변백현: authorBrief(P['변백현']), 사쿠야: authorBrief(P['사쿠야']), 유우시: authorBrief(P['유우시']), 오시온: authorBrief(P['오시온']) },
  sceneMix: st.adultMix ? Object.fromEntries(Object.entries(st.adultMix).map(([k, g]) => [k, { series: g.n, seriesShare: g.seriesShare + '%', revShare: g.revShare + '%', revMed: Math.round(g.revMed / 1e4) + '만', examples: g.examples.map(x => x.title + '(19금 ' + x.adultEpRatio + '%)') }])) : null,
  playbook: { freeEps: st.freeEps, price: st.price, eps: st.eps, gapDays: st.gapDays, charsPerEp: st.charsPerEp, paidCharsPerEp: st.paidCharsPerEp, pricePer10k: st.pricePer10k, paidRatio: st.paidRatio, membership: st.membership, weekday_일월화수목금토: st.weekday, focusBuckets: st.focusBuckets, created: st.created, fresh: st.fresh, freshInTop: (st.freshInTop || []).slice(0, 8) },
  peers_누리방식성공채널: (D.peers || []).map(p => ({ title: p.title, created: p.createdAt, firstPost: p.firstPost, subs: p.subscribers, estRev1y: Math.round(p.estRev / 1e4) + '만', totalPosts: p.totalPosts, postsPerMonth: p.postsPerMonth, freeBeforeFirstPaid: p.freeBeforeFirstPaid, paid: p.paidPosts, free: p.freePosts, adultPaidRatio: p.adultPaidRatio + '%', price: p.medPrice, gapDays: p.medGapDays, paidChars: p.medPaidChars, pricePer10k: p.pricePer10k, hasExternalLinks: (p.links || []).length > 0, people: p.people, series: (p.series || []).slice(0, 3).map(s => s.title + ' ' + s.eps + '편 ' + (s.adult ? '19' : '전연령')) })),
  mine: D.authors.filter(a => a.mine).map(a => ({ title: a.title, subs: a.subscribers, estRev: a.estRev, posts: a.posts, people: a.people, focus: a.focus, rank: D.authors.indexOf(a) + 1 })),
};
const prevInsights = D.prevInsights ? JSON.stringify(D.prevInsights.cards?.map(c => c.title + ': ' + c.summary)) : '(없음)';

const prompt = `너는 포스타입 '나페스'(아이돌 RPF 드림) 시장 분석가다. 아래 요약 숫자만 근거로, 작가 누리(필명 비츄사랑햇)가 "누구·무엇으로 써야 돈이 되나" 판단할 수 있게 분석 카드를 써라. JSON 으로만 답한다.

## 누리
- 채널 2개: 고요한 다락방(@bichu-attic, 백현/EXO, 구독 1.2만), 요란한 옥탑방(@hotnncold, 리쿠/NCT WISH, 구독 300여)
- 목표: 포스타입 월 400만 원 안정 → 2028년 말 퇴사
- 계획: 리쿠 장편 「미친개 길들이기」(센티넬 AU, 22화) 12월 말 옥탑방 연재 · 다락방 백현 신작은 2027년
- 지금 방식: 주 1회 금 21시, 1~3화 무료, 약 1만 자 500P. 다 써 놓고 주 1회 장편 연재가 본인 방식이고 바꿀 생각 없음(매일 썰·톡글은 못 함/싫어함). 조언은 이 틀 안에서, Peers(누리 방식 성공 채널)를 기준으로. 수위 위주 글도 안 씀 — 씬은 이야기에 꼭 필요한 회차에만(필요한 회차만 19금). Peers 중 19금 비율이 높은 곳은 그 점을 밝히고, 누리에게 맞는 사례(19금 비율 낮은 곳)를 우선.

## 규칙
- 숫자는 요약에 있는 것만. 없는 숫자·작가·작품을 지어내지 않는다. 추정 매출은 '추정'이라고 쓴다(실제보다 낮게 나오는 편, estimateCheck 참고).
- 짧게. 한 문장은 60자 안쪽. 줄글 금지. 결론 먼저.
- 판단(verdict)은 분명하게: up(뜸) / down(짐) / flat(유지) / watch(지켜볼 것) / do(누리가 할 일).
- 지난번 분석과 달라진 점이 있으면 짚는다. 지난번: ${prevInsights}

## 출력 (코드 블록 하나, JSON 객체만)
{
  "headline": "이번 분석 한 줄 (40자 안쪽)",
  "cards": [
    {"section": "peers|market|idols|keywords|authors|playbook|me", "title": "카드 제목 (20자 안쪽)", "verdict": "up|down|flat|watch|do",
     "stat": {"value": "1.6억", "label": "리쿠 3달 추정 매출"}, "summary": "한 문장 결론",
     "points": ["근거 한 줄", "근거 한 줄", "최대 4개"], "refs": ["리쿠", "센티넬"]}
  ],
  "actions": [{"text": "누리가 이번에 할 일 (40자 안쪽)", "why": "근거 한 줄"}]
}
카드는 10~14장: Peers(누리 방식으로 성공한 채널 패턴) 1~2, 시장 흐름 1~2, 인물(뜨는·지는·누리 관련 리쿠·백현) 3~4, 키워드·결 2~3, 상위 작가 패턴 1~2, Playbook(가격·주기·무료·길이) 1~2, 누리 위치·채널 전략 1~2. actions 는 3~5개.

## 요약
${JSON.stringify(summary)}`;

function runClaude(model, timeoutMs) {
  return new Promise((resolve, reject) => {
    const child = spawn('claude', ['-p', '--output-format', 'text', '--model', model], { env: process.env, stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '', err = '';
    child.stdout.on('data', d => { out += d; }); child.stderr.on('data', d => { err += d; });
    const t = setTimeout(() => { child.kill('SIGKILL'); reject(new Error('claude 시간 초과')); }, timeoutMs);
    child.on('error', e => { clearTimeout(t); reject(e); });
    child.on('close', code => { clearTimeout(t); code === 0 ? resolve(out) : reject(new Error('claude 종료 ' + code + ': ' + (err || out).slice(0, 300))); });
    child.stdin.end(prompt);
  });
}
const parseJson = (raw) => { const m = raw.match(/```(?:json)?\s*\n([\s\S]*?)```/); let s = m ? m[1] : raw; return JSON.parse(s.slice(s.indexOf('{'), s.lastIndexOf('}') + 1)); };

let res;
for (const model of ['opus', 'sonnet']) {
  try { res = parseJson(await runClaude(model, 8 * 60e3)); log('모델', model, '카드', res.cards?.length); break; }
  catch (e) { log(model, '실패:', e.message); }
}
if (!res) { log('분석 글 없이 넘어감'); process.exit(0); }
D.insights = { ...res, generatedAt: new Date().toISOString(), range: summary.range, basis: D.meta.last3 };
fs.writeFileSync(file, JSON.stringify(D));
fs.writeFileSync(path.join(DIR, 'insights.json'), JSON.stringify(D.insights, null, 1));
log('저장', path.join(DIR, 'insights.json'));
