#!/usr/bin/env node
// collect.mjs 결과(raw) → 페이지용 요약(market.json). 질문: "누구로 써야 돈이 되나"
//   node scripts/postype-market/analyze.mjs ~/postype-market-data/2026-11-07
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { buildMatcher, PEOPLE, GROUP_TAGS, NOT_PEOPLE } from './idols.mjs';

const DIR = process.argv[2].replace(/^~/, os.homedir());
const rd = (n, d) => { const f = path.join(DIR, n); return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')) : d; };
const posts = rd('search-posts.json', []);
const series = rd('series.json', {});
const channels = rd('channels.json', {});
const meta = rd('meta.json', {});
const chars = rd('chars.json', {});
const MY = ['bichu-attic', 'hotnncold'];

const KST = 9 * 3600;
const ym = (t) => new Date((t + KST) * 1000).toISOString().slice(0, 7);
const day = (t) => new Date((t + KST) * 1000).toISOString().slice(0, 10);
const median = (a) => { if (!a.length) return null; const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const r1 = (x) => x == null ? null : Math.round(x * 10) / 10;
const sum = (a, f) => a.reduce((s, x) => s + f(x), 0);
const modeOf = (a) => { const c = {}; let b = null; for (const x of a) { c[x] = (c[x] || 0) + 1; if (b == null || c[x] > c[b]) b = x; } return b == null ? null : Number(b); };

// ── 매출 추정: 유료 글 조회 × 가격 × 구매율. 구매율은 누리 채널 실측(lifetime)으로 맞춤
//    가격대별로 다름(누리 실측: 500~800P 약 30%, 1,000P 이상 묶음 약 10%). 5,000P 넘는 글은 '잠금용'으로 보고 매출에서 뺌
const LOCK_PRICE = 5000;
const calib = (() => {
  const f = path.join(os.homedir(), 'postype-market-data', 'my-calibration.json');
  const base = { single: 0.28, bundle: 0.10, low: 0.19, high: 0.37, source: '기본값' };
  if (!fs.existsSync(f)) return base;
  const d = JSON.parse(fs.readFileSync(f, 'utf8')); const single = [], bundle = [], hot = [], recent = [];
  for (const ch of MY) {
    const v = new Map((d[ch + '|VIEW'] || []).map(r => [r.id, r.value]));
    for (const r of d[ch + '|PROFIT'] || []) {
      if (!(r.price > 0 && v.get(r.id) > 0)) continue;
      const x = r.value / r.price / v.get(r.id);
      (r.price < 900 ? single : bundle).push(x);
      if (ch === 'hotnncold') hot.push(x);
      else if (r.price < 900 && r.publishedAt > Date.now() / 1000 - 400 * 86400) recent.push(x);
    }
  }
  const rd2 = (x, dflt) => x == null ? dflt : Math.round(x * 100) / 100;
  return { single: rd2(median(single), 0.28), bundle: rd2(median(bundle), 0.10), low: rd2(median(hot), 0.19), high: rd2(median(recent), 0.37),
    source: '누리 채널 lifetime 구매/조회 — 단건(900P 미만)·묶음(900P 이상) 따로, 범위는 옥탑방~다락방 최근 13개월' };
})();
calib.mid = calib.single;
const rateOf = (price) => price < 900 ? calib.single : calib.bundle;
const estRev = (p) => p.price > 0 && p.price <= LOCK_PRICE ? p.views * p.price * rateOf(p.price) : 0;

// ── 결(테마)
const THEMES = {
  '센티넬': /센티넬|가이드버스|가이딩|센가물/, '후회': /후회/, '집착': /집착|광공|얀데레|멘헤라/, '피폐·광기': /피폐|광기/,
  '오메가버스': /오메가버스|오메가|알파|알오/, '빙의·회귀': /빙의|회귀|환생/, '연프·리얼리티': /연프|연애 ?프로|리얼리티|환승/,
  '조직·느와르': /조직|마피아|조폭|느와르/, '학원·캠퍼스': /학원|고등학|대학|캠퍼스/, '연예계': /연예계|데뷔|매니저|리얼물/,
  '역하렘·홍일점': /역하렘|홍일점|다인/, '수인': /수인/, '계약·정략': /계약|정략/, '짝사랑': /짝사랑/, '혐관': /혐관/,
  '판타지': /판타지|황제|공작|마법|던전|헌터|기사/, '톡·채팅': /톡|카톡|페이스타임|talk/i, '유사연애': /유사|사연애$/, '사주·궁합': /사주|궁합/, '육아': /육아/, '뱀파이어': /뱀파이어/, '네임버스': /네임버스/, '좀비·아포칼립스': /좀비|아포칼립스|좀아포/, '오피스': /오피스|회사원|직장/, '아저씨': /아저씨|오지콤/,
};
const textOf = (p) => [p.title, p.subTitle, p.summary, p.seriesTitle, ...(p.tags || [])].join(' ');
const themesOf = (p) => Object.entries(THEMES).filter(([, re]) => re.test(textOf(p))).map(([k]) => k);

// ── 1) 글 단위
const match = buildMatcher();
// 키워드 = 사람·그룹·흔한 표시 말고 남는 태그 (장르·소재·형식)
const GENERIC = new Set(['나페스', '팬창작', '노딱', '드림', '단편', 'talk', 'TALK', 'Talk', '19금', '19', '수위', '고수위', '중수위', '약수위', '꾸금', '성인', '추천', '무료', '소설', '웹소설', '엔시티나페스', '엔시티나페스추천', '나페스추천', '수위주의', '19+', 'hl', 'hot', '팬픽', '글', '드림주', '여주', '꾸금주의', '연재', '완결', '유료', '공지', '이벤트', '리퀘스트', '포타', '포스타입', 'bl', 'BL', 'gl', 'nps']);
const groupTagSet = new Set(Object.values(GROUP_TAGS).flat().map(t => t.toLowerCase()));
const personAlias = new Set(Object.entries(PEOPLE).flatMap(([n, [, ...a]]) => [n.replace(/\s/g, ''), ...a.map(x => x.replace(/\s/g, ''))]));
const isKeyword = (t) => t.length >= 2 && t.length <= 12 && !GENERIC.has(t) && !groupTagSet.has(t.toLowerCase()) && !personAlias.has(t)
  && !personAlias.has(t.replace(/(나페스|유사|빙의글|드림|사연애|수위|드림주|빙의|썰)$/, '')) && !/사연애$|나페스$|유사$|드림$|빙의글$/.test(t) && !/^\d+$/.test(t);
const UNITS = { 'NCT 127': ['정재현', '김도영', '이태용', '나카모토 유타', '이마크', '이동혁', '김정우', '서영호', '문태일'], 'NCT DREAM': ['이마크', '이동혁', '나재민', '이제노', '황인준', '종천러', '박지성'], 'WayV': ['쿤', '텐', '양양', '샤오쥔', '헨드리'], 'NCT WISH': ['리쿠', '유우시', '사쿠야', '오시온', '김재희', '히로세 료', '김대영'] };
const unknown = {};
const P = posts.map(p => {
  const m = match(p);
  for (const u of m.unknown) (unknown[u] ||= { posts: 0, likes: 0 }), unknown[u].posts++, unknown[u].likes += p.likes;
  const kw = [...new Set((p.tags || []).map(t => t.replace(/\s/g, '')).filter(t => isKeyword(t)))];
  const units = Object.entries(UNITS).filter(([, ns]) => m.people.some(x => ns.includes(x))).map(([u]) => u);
  return { ...p, kw, units, month: ym(p.publishedAt), paid: p.price > 0 && p.price <= LOCK_PRICE, locked: p.price > LOCK_PRICE, rev: estRev(p), themes: themesOf(p), people: m.people, groups: m.groups };
});
const MONTHS = [...new Set(P.map(p => p.month))].sort();
const last3 = MONTHS.slice(-4, -1).length === 3 ? MONTHS.slice(-4, -1) : MONTHS.slice(-3); // 이번 달(진행 중)은 빼고 직전 3달
const prev3 = MONTHS.slice(MONTHS.indexOf(last3[0]) - 3, MONTHS.indexOf(last3[0]));
const totalLikesIn = (ms) => sum(P.filter(p => ms.includes(p.month)), p => p.likes) || 1;
const totalRevIn = (ms) => sum(P.filter(p => ms.includes(p.month)), p => p.rev) || 1;

// ── 2) 묶음 통계 (사람·그룹·테마 공통)
function rollup(keyFn, minPosts) {
  const acc = {};
  for (const p of P) for (const k of keyFn(p)) {
    const a = acc[k] || (acc[k] = { key: k, list: [] }); a.list.push(p);
  }
  return Object.values(acc).filter(a => a.list.length >= minPosts).map(a => {
    const L = a.list, paid = L.filter(p => p.paid);
    const byAuthor = {}; for (const p of L) byAuthor[p.channelName] = (byAuthor[p.channelName] || 0) + p.rev;
    const authorsSorted = Object.entries(byAuthor).sort((x, y) => y[1] - x[1]);
    const totalA = sum(authorsSorted, x => x[1]) || 1;
    const monthly = {}; for (const m of MONTHS) monthly[m] = [0, 0, 0]; // 글, 좋아요, 추정매출
    for (const p of L) { const r = monthly[p.month]; r[0]++; r[1] += p.likes; r[2] += Math.round(p.rev); }
    const solo = L.filter(p => p.people.length === 1);
    const shareL3 = sum(L.filter(p => last3.includes(p.month)), p => p.likes) / totalLikesIn(last3);
    const shareP3 = prev3.length ? sum(L.filter(p => prev3.includes(p.month)), p => p.likes) / totalLikesIn(prev3) : null;
    const revL3 = sum(L.filter(p => last3.includes(p.month)), p => p.rev) / totalRevIn(last3);
    const revP3 = prev3.length ? sum(L.filter(p => prev3.includes(p.month)), p => p.rev) / totalRevIn(prev3) : null;
    const seriesIds = {}; for (const p of L) if (p.seriesId) seriesIds[p.seriesId] = (seriesIds[p.seriesId] || 0) + p.likes + p.rev;
    return {
      key: a.key, posts: L.length, channels: authorsSorted.length,
      likes: sum(L, p => p.likes), views: sum(L, p => p.views), comments: sum(L, p => p.comments), medLikes: median(L.map(p => p.likes)),
      paidPosts: paid.length, paidRatio: r1(100 * paid.length / L.length), medPrice: median(paid.map(p => p.price)),
      estRev: Math.round(sum(L, p => p.rev)), revPerPaidPost: paid.length ? Math.round(median(paid.map(p => p.rev))) : null,
      revPerChannel: Math.round(sum(L, p => p.rev) / authorsSorted.length),
      soloPosts: solo.length, soloMedLikes: median(solo.map(p => p.likes)), soloRev: Math.round(sum(solo, p => p.rev)),
      top3Share: r1(100 * sum(authorsSorted.slice(0, 3), x => x[1]) / totalA),
      likeShare3m: r1(100 * shareL3), likeShareGrowth: shareP3 ? r1(100 * (shareL3 - shareP3) / shareP3) : null,
      revShare3m: r1(100 * revL3), revShareGrowth: revP3 ? r1(100 * (revL3 - revP3) / revP3) : null,
      monthly, topAuthors: authorsSorted.slice(0, 5).map(x => x[0]),
      topAuthorsDetail: authorsSorted.slice(0, 5).map(([ch, rv]) => {
        const mine = L.filter(p => p.channelName === ch), paidM = mine.filter(p => p.paid);
        const sc = {}; for (const p of mine) if (p.seriesTitle) sc[p.seriesTitle] = (sc[p.seriesTitle] || 0) + p.rev + 1;
        const tc = {}; for (const p of mine) for (const t of p.themes) tc[t] = (tc[t] || 0) + 1;
        const kc = {}; for (const p of mine) for (const t of p.kw) kc[t] = (kc[t] || 0) + 1;
        const ds = mine.map(p => p.publishedAt).sort((a, b) => a - b); const gaps = ds.slice(1).map((d, i) => (d - ds[i]) / 86400);
        const chInfo = channels[ch] || {};
        return { channelName: ch, title: mine[0].channelTitle, author: mine[0].author, share: r1(100 * rv / totalA), estRev: Math.round(rv), posts: mine.length,
          paidPosts: paidM.length, medPrice: median(paidM.map(p => p.price)), medGapDays: r1(median(gaps)), firstPost: day(ds[0]), lastPost: day(ds[ds.length - 1]),
          weekday: modeOf(mine.map(p => new Date((p.publishedAt + KST) * 1000).getUTCDay())), medLikes: median(mine.map(p => p.likes)),
          series: Object.entries(sc).sort((a, b) => b[1] - a[1]).slice(0, 4).map(x => x[0]),
          themes: Object.entries(tc).sort((a, b) => b[1] - a[1]).slice(0, 4).map(x => x[0]), keywords: Object.entries(kc).sort((a, b) => b[1] - a[1]).slice(0, 6).map(x => x[0]),
          subscribers: chInfo.subscribers ?? null, createdAt: chInfo.createdAt ? day(chInfo.createdAt) : null, membership: chInfo.activeMembership ?? null, mine: MY.includes(ch) };
      }),
      keywords: (() => { const c = {}; for (const p of L) for (const t of p.kw) (c[t] ||= [0, 0]), c[t][0]++, c[t][1] += p.rev; return Object.entries(c).filter(([, v]) => v[0] >= 3).sort((a, b) => b[1][1] - a[1][1]).slice(0, 10).map(([k, v]) => [k, v[0], Math.round(v[1])]); })(),
      topSeries: Object.entries(seriesIds).sort((x, y) => y[1] - x[1]).slice(0, 8).map(x => Number(x[0])),
      themes: (() => { const c = {}; for (const p of L) for (const t of p.themes) c[t] = (c[t] || 0) + 1; return Object.entries(c).sort((x, y) => y[1] - x[1]).slice(0, 5).map(([k, n]) => [k, n]); })(),
    };
  }).sort((x, y) => y.estRev - x.estRev);
}
const people = rollup(p => p.people, 15).map(x => ({ ...x, group: PEOPLE[x.key]?.[0] || '기타' }));
const groups = rollup(p => p.groups, 15);
const themes = rollup(p => p.themes, 15);
const keywords = rollup(p => p.kw, 40);
const units = rollup(p => p.units, 15);

// ── 3) 월별 시장
const months = MONTHS.map(m => {
  const L = P.filter(p => p.month === m);
  return { month: m, posts: L.length, channels: new Set(L.map(p => p.channelName)).size, paidRatio: r1(100 * L.filter(p => p.paid).length / L.length),
    adultRatio: r1(100 * L.filter(p => p.adult).length / L.length), likes: sum(L, p => p.likes), estRev: Math.round(sum(L, p => p.rev)), medLikes: median(L.map(p => p.likes)) };
});

// ── 4) 시리즈 (회차 전체를 받은 것)
const seriesList = [];
for (const [id, s] of Object.entries(series)) {
  if (!s.eps?.length) continue;
  const eps = [...s.eps].sort((a, b) => a.publishedAt - b.publishedAt);
  const f = eps[0], l = eps[eps.length - 1];
  const gaps = eps.slice(1).map((e, i) => (e.publishedAt - eps[i].publishedAt) / 86400);
  const paidEps = eps.filter(e => e.price > 0 && e.price <= LOCK_PRICE);
  const firstPaid = eps.findIndex(e => e.price > 0 && e.price <= LOCK_PRICE);
  const pm = new Set(); const gm = new Set(); for (const e of eps) { const m = match(e); m.people.forEach(x => pm.add(x)); m.groups.forEach(x => gm.add(x)); }
  const tc = {}; for (const e of eps) for (const t of themesOf(e)) tc[t] = (tc[t] || 0) + 1;
  seriesList.push({
    id: Number(id), title: f.seriesTitle, channelName: f.channelName, channelTitle: f.channelTitle, author: f.author,
    eps: eps.length, start: day(f.publishedAt), last: day(l.publishedAt), daysSinceLast: Math.round((Date.now() / 1000 - l.publishedAt) / 86400),
    medGapDays: r1(median(gaps)), weekday: modeOf(eps.map(e => new Date((e.publishedAt + KST) * 1000).getUTCDay())), hour: modeOf(eps.map(e => new Date((e.publishedAt + KST) * 1000).getUTCHours())),
    freeEps: eps.length - paidEps.length, firstPaidEp: firstPaid >= 0 ? firstPaid + 1 : null, medPrice: median(paidEps.map(e => e.price)), adult: eps.some(e => e.adult), adultEpRatio: Math.round(100 * eps.filter(e => e.adult).length / eps.length), adultPattern: eps.slice(0, 30).map(e => e.adult ? 1 : 0).join(''),
    views: sum(eps, e => e.views), likes: sum(eps, e => e.likes), comments: sum(eps, e => e.comments),
    estRev: Math.round(sum(eps, estRev)), retention: eps[0].views ? r1(100 * l.views / eps[0].views) : null,
    curve: eps.map(e => [e.views, e.likes, e.comments, e.price]),
    people: [...pm].slice(0, 6), groups: [...gm], themes: Object.keys(tc).sort((a, b) => tc[b] - tc[a]).slice(0, 4), mine: MY.includes(f.channelName),
    ...(() => {
      const sampled = eps.filter(e => chars[e.postId]?.chars), paidS = sampled.filter(e => e.price > 0 && e.price <= LOCK_PRICE);
      const cm = median(sampled.map(e => chars[e.postId].chars)), pcm = median(paidS.map(e => chars[e.postId].chars));
      const pr = median(paidS.map(e => e.price));
      return { charsMed: cm, paidCharsMed: pcm, totalCharsEst: cm ? Math.round(cm * eps.length) : null,
        pricePer10k: pcm && pr ? Math.round(pr / pcm * 10000) : null, imagesMed: sampled.length ? median(sampled.map(e => chars[e.postId].images || 0)) : null };
    })(),
  });
}
seriesList.sort((a, b) => b.estRev - a.estRev || b.likes - a.likes);

// ── 5) 작가(채널)
const authorsAcc = {};
for (const p of P) (authorsAcc[p.channelName] ||= []).push(p);
const authors = Object.entries(authorsAcc).map(([name, L]) => {
  const ch = channels[name] || {}; const ds = L.map(p => p.publishedAt).sort((a, b) => a - b);
  const gaps = ds.slice(1).map((d, i) => (d - ds[i]) / 86400); const paid = L.filter(p => p.paid);
  const pc = {}; for (const p of L) for (const x of p.people) pc[x] = (pc[x] || 0) + 1;
  const tc = {}; for (const p of L) for (const x of p.themes) tc[x] = (tc[x] || 0) + 1;
  return {
    channelName: name, title: L[0].channelTitle, author: L[0].author, subscribers: ch.subscribers ?? null,
    posts: L.length, paidPosts: paid.length, medPrice: median(paid.map(p => p.price)), likes: sum(L, p => p.likes), views: sum(L, p => p.views),
    estRev: Math.round(sum(L, p => p.rev)), activeMonths: new Set(L.map(p => p.month)).size, medGapDays: r1(median(gaps)), maxGapDays: gaps.length ? r1(Math.max(...gaps)) : null,
    lastPost: day(ds[ds.length - 1]), people: Object.entries(pc).sort((a, b) => b[1] - a[1]).slice(0, 4).map(x => x[0]),
    themes: Object.entries(tc).sort((a, b) => b[1] - a[1]).slice(0, 3).map(x => x[0]),
    monthlyRev: MONTHS.map(m => Math.round(sum(L.filter(p => p.month === m), p => p.rev))), mine: MY.includes(name),
    ...(() => {
      const gc = {}; for (const p of L) for (const g of new Set(p.groups)) gc[g] = (gc[g] || 0) + 1;
      const gs = Object.entries(gc).sort((a, b) => b[1] - a[1]);
      return { topGroup: gs[0]?.[0] || null, focus: gs.length ? r1(100 * gs[0][1] / L.length) : null, groupCount: gs.filter(([, n]) => n >= Math.max(2, L.length * 0.1)).length,
        profileId: ch.profileId ?? null, createdAt: ch.createdAt ? day(ch.createdAt) : null, totalPosts: ch.postCount ?? null, membership: ch.activeMembership ?? null,
        revPerPost: Math.round(sum(L, p => p.rev) / L.length) };
    })(),
  };
}).sort((a, b) => b.estRev - a.estRev || b.likes - a.likes);

// ── 6) 내 채널 실측 vs 추정 (추정이 맞는지 확인용)
const check = (() => {
  const f = path.join(os.homedir(), 'postype-market-data', 'my-calibration.json');
  if (!fs.existsSync(f)) return [];
  const d = JSON.parse(fs.readFileSync(f, 'utf8')); const actual = {};
  for (const ch of MY) for (const r of d[ch + '|PROFIT'] || []) if (r.series) actual[ch + '|' + r.series] = (actual[ch + '|' + r.series] || 0) + r.value;
  const est = {};
  for (const p of P) if (MY.includes(p.channelName) && p.seriesTitle) est[p.channelName + '|' + p.seriesTitle] = (est[p.channelName + '|' + p.seriesTitle] || 0) + p.rev;
  return Object.entries(est).map(([k, v]) => ({ channelName: k.split('|')[0], series: k.split('|')[1], est: Math.round(v), actual: actual[k] ?? null })).filter(x => x.est > 0);
})();

// ── 7) 전략: 잘 버는 작가들은 어떻게 하나
const strategy = (() => {
  const top = authors.filter(a => !a.mine).slice(0, 100);
  const topSet = new Set(top.map(a => a.channelName));
  const ts = seriesList.filter(s => topSet.has(s.channelName) && s.eps >= 5);
  const paidTs = ts.filter(s => s.medPrice);
  const wd = Array(7).fill(0); for (const s of paidTs) if (s.weekday != null) wd[s.weekday]++;
  const hr = Array(24).fill(0); for (const s of paidTs) if (s.hour != null) hr[s.hour]++;
  const q = (arr, p) => { const a = arr.filter(x => x != null).sort((x, y) => x - y); return a.length ? a[Math.min(a.length - 1, Math.floor(p * a.length))] : null; };
  const dist = (arr) => ({ p25: q(arr, 0.25), med: q(arr, 0.5), p75: q(arr, 0.75), n: arr.filter(x => x != null).length });
  // 집중 vs 섞기 (유료 글 10편 이상 채널)
  const solid = authors.filter(a => a.paidPosts >= 10 && a.focus != null);
  const fb = (lo, hi) => { const L = solid.filter(a => a.focus >= lo && a.focus < hi); return { n: L.length, revPerPost: median(L.map(a => a.revPerPost)), revPerChannel: median(L.map(a => a.estRev)), subs: median(L.map(a => a.subscribers).filter(x => x != null)) }; };
  // 한 사람 여러 채널
  const byProfile = {}; for (const a of authors) if (a.profileId) (byProfile[a.profileId] ||= []).push(a);
  const multi = Object.values(byProfile).filter(L => L.length >= 2).map(L => ({ author: L[0].author, channels: L.map(a => ({ title: a.title, channelName: a.channelName, topGroup: a.topGroup, estRev: a.estRev, subscribers: a.subscribers, createdAt: a.createdAt })), estRev: sum(L, a => a.estRev), sameGroup: new Set(L.map(a => a.topGroup)).size === 1 }))
    .sort((a, b) => b.estRev - a.estRev);
  // 새 채널 (만든 지 18달 안)
  const cutoff = new Date(Date.now() - 548 * 86400000).toISOString().slice(0, 10);
  const withDate = authors.filter(a => a.createdAt);
  const fresh = withDate.filter(a => a.createdAt >= cutoff);
  const yr = {}; for (const a of top) if (a.createdAt) yr[a.createdAt.slice(0, 4)] = (yr[a.createdAt.slice(0, 4)] || 0) + 1;
  return {
    topN: top.length, seriesN: ts.length, paidSeriesN: paidTs.length,
    adultMix: (() => { const L = seriesList.filter(x => !x.mine && x.eps >= 8 && x.medPrice); const tot = L.reduce((q, x) => q + x.estRev, 0) || 1;
      const g = (f) => { const v = L.filter(f); return { n: v.length, seriesShare: Math.round(100 * v.length / L.length), revShare: Math.round(100 * v.reduce((q, x) => q + x.estRev, 0) / tot), revMed: median(v.map(x => x.estRev)),
        examples: [...v].sort((a, b) => b.estRev - a.estRev).slice(0, 4).map(x => ({ title: x.title, channel: x.channelTitle, channelName: x.channelName, id: x.id, eps: x.eps, adultEpRatio: x.adultEpRatio, price: x.medPrice, estRev: x.estRev, pattern: x.adultPattern, themes: x.themes.slice(0, 2) })) }; };
      return { all: g(x => x.adultEpRatio >= 95), part: g(x => x.adultEpRatio > 0 && x.adultEpRatio < 95), none: g(x => x.adultEpRatio === 0) }; })(),
    freeEps: dist(paidTs.map(s => s.firstPaidEp ? s.firstPaidEp - 1 : null)),
    price: dist(paidTs.map(s => s.medPrice)),
    eps: dist(ts.map(s => s.eps)),
    gapDays: dist(ts.map(s => s.medGapDays)),
    charsPerEp: dist(ts.map(s => s.charsMed)), paidCharsPerEp: dist(paidTs.map(s => s.paidCharsMed)),
    totalChars: dist(ts.map(s => s.totalCharsEst)), pricePer10k: dist(paidTs.map(s => s.pricePer10k)),
    paidRatio: dist(top.map(a => 100 * a.paidPosts / a.posts)),
    membership: { yes: top.filter(a => a.membership === true).length, known: top.filter(a => a.membership != null).length },
    weekday: wd, hour: hr,
    focus: dist(top.map(a => a.focus)), focusBuckets: [['한 그룹 90%+', fb(90, 101)], ['70~90%', fb(70, 90)], ['50~70%', fb(50, 70)], ['섞어 씀 50% 미만', fb(0, 50)]],
    multi: multi.slice(0, 30), multiCount: multi.length, profilesKnown: Object.keys(byProfile).length,
    created: yr, freshInTop: top.filter(a => a.createdAt && a.createdAt >= cutoff).map(a => ({ title: a.title, channelName: a.channelName, createdAt: a.createdAt, estRev: a.estRev, subscribers: a.subscribers, topGroup: a.topGroup })),
    fresh: { n: fresh.length, cutoff, revMed: median(fresh.map(a => a.estRev)), revP90: q(fresh.map(a => a.estRev), 0.9), subsMed: median(fresh.map(a => a.subscribers).filter(x => x != null)), subsP90: q(fresh.map(a => a.subscribers), 0.9) },
  };
})();

const out = {
  meta: { ...meta, channelsTotal: Object.keys(authorsAcc).length, analyzedAt: new Date().toISOString(), months: MONTHS, last3, prev3, buyRate: calib,
    note: '조회·좋아요는 수집 시점 누적값. 월은 발행월. 추정 매출 = 유료 글 조회 × 가격 × 구매율(누리 채널 실측: 단건 ' + Math.round(calib.single * 100) + '%, 1,000P대 묶음 ' + Math.round(calib.bundle * 100) + '%). 5,000P 넘는 잠금용 글은 뺌. 실제 정산액이 아님.' },
  months, people, groups, themes, keywords: keywords.slice(0, 300), units, strategy,
  authors: authors.slice(0, 400), series: seriesList.slice(0, 600), check,
  unknownTags: Object.entries(unknown).filter(([, v]) => v.posts >= 10).sort((a, b) => b[1].likes - a[1].likes).slice(0, 80).map(([k, v]) => ({ tag: k, ...v })),
  topPosts: [...P].sort((a, b) => b.rev - a.rev || b.likes - a.likes).slice(0, 100).map(({ summary, rev, themes, ...p }) => ({ ...p, rev: Math.round(rev), themes })),
};
fs.writeFileSync(path.join(DIR, 'market.json'), JSON.stringify(out));
console.log(`posts ${P.length} · people ${people.length} · groups ${groups.length} · series ${seriesList.length} · authors ${authors.length} → market.json ${(fs.statSync(path.join(DIR, 'market.json')).size / 1024).toFixed(0)}KB · 구매율 ${JSON.stringify(calib)}`);
