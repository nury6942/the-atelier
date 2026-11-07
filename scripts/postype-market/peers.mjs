#!/usr/bin/env node
// '누리 방식'으로 성공한 채널(Peers) 깊게 보기 → <dir>/peers.json + market.json 의 peers 칸
//   node scripts/postype-market/peers.mjs ~/postype-market-data/current
// 고르는 기준: 2024년 이후 개설 · 글 간격 가운데 4일 이상 · 유료 가격 400~1,500P · 1년 추정 300만 원 이상 (상위 15곳)
// 받는 것: 채널 소개·외부 링크·전체 글 수, 채널 전체 글(나페스 태그 없는 글까지), 글자 수(유료 글 위주 표본)
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { execFileSync } from 'node:child_process';
import { buildMatcher } from './idols.mjs';

const DIR = process.argv[2].replace(/^~/, os.homedir());
const MAX = Number(process.argv[3] || 15);
const log = (...a) => console.error('[peers]', ...a);
const D = JSON.parse(fs.readFileSync(path.join(DIR, 'market.json'), 'utf8'));
const posts = JSON.parse(fs.readFileSync(path.join(DIR, 'search-posts.json'), 'utf8'));
const chId = {}; for (const p of posts) if (p.channelName && p.channelId) chId[p.channelName] = p.channelId;

const picked = D.authors.filter(a => !a.mine && a.createdAt && a.createdAt >= '2024-01-01' && (a.medGapDays ?? 0) >= 4 && a.medPrice >= 400 && a.medPrice <= 1500 && a.estRev >= 3e6 && chId[a.channelName])
  .sort((a, b) => b.estRev - a.estRev).slice(0, MAX);
log('고른 채널', picked.map(a => a.title).join(', '));

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'peers-'));
function repl(code) {
  const f = path.join(tmp, `r${Date.now()}.js`);
  fs.writeFileSync(f, `const pgP = await openTab('https://www.postype.com/search/post?keyword=%EB%82%98%ED%8E%98%EC%8A%A4');\ntry {\n${code}\n} finally { await closeTab(pgP); }`);
  const out = execFileSync('aside', ['repl', '--file', f], { encoding: 'utf8', maxBuffer: 128 * 1024 * 1024 });
  const m = out.match(/@@JSON@@([\s\S]*)@@END@@/); if (!m) throw new Error(out.slice(-800));
  return JSON.parse(m[1]);
}

const out = [];
for (const a of picked) {
  const id = chId[a.channelName];
  // 1) 채널 정보 + 전체 글 목록
  const r = repl(`
    const J = (u) => pgP.evaluate(async (u) => { const x = await fetch(u, {credentials:'include'}); if (!x.ok) return {err:x.status}; const k = await x.json(); return k.data ?? k; }, u);
    const ch = await J('https://api.postype.com/api/v1/channel/${id}');
    const items = []; let total = null;
    for (let p = 0; p < 10; p++) {
      const d = await J('https://api.postype.com/api/v1/channel/${id}/activity/posts?page=' + p + '&size=100&sortType=RECENT');
      if (d.err) break; total = d.totalElements;
      for (const it of d.content || []) { const f = it.feedItem || it; if (!f.postId) continue;
        items.push({ postId: f.postId, title: f.title, subTitle: f.subTitle, summary: (f.summary || '').slice(0, 160), seriesId: f.series?.seriesId ?? null, seriesTitle: f.series?.title ?? null,
          views: f.viewCount, likes: f.likeCount, comments: f.commentCount, price: f.price, adult: f.forAdult, membership: f.membership, tags: f.tags || [], publishedAt: f.publishedAt }); }
      if (d.last || p + 1 >= d.totalPages) break;
      await sleep(900);
    }
    console.log('@@JSON@@' + JSON.stringify({ ch, items, total }) + '@@END@@');`);
  const ch = r.ch || {}, dt = ch.details || {};
  // 2) 글자 수 표본: 유료 글 최근 12편 + 첫 글 3편
  const sorted = [...r.items].sort((x, y) => x.publishedAt - y.publishedAt);
  const paidRecent = sorted.filter(p => p.price > 0 && p.price <= 5000).slice(-12);
  const sample = [...new Map([...sorted.slice(0, 3), ...paidRecent].map(p => [p.postId, p])).values()];
  const chars = repl(`
    const ids = ${JSON.stringify(sample.map(p => p.postId))}; const o = {};
    for (const id of ids) {
      const r1 = await pgP.evaluate(async (u) => { const x = await fetch(u, {credentials:'include'}); if (!x.ok) return null;
        const h = await x.text(); const t = h.match(/텍스트\\s*<b>([\\d,]+)<\\/b>\\s*자/); const im = h.match(/이미지\\s*<b>([\\d,]+)<\\/b>\\s*장/);
        return { chars: t ? Number(t[1].replace(/,/g, '')) : null, images: im ? Number(im[1].replace(/,/g, '')) : 0 }; }, 'https://www.postype.com/@${a.channelName}/post/' + id);
      if (r1) o[id] = r1; await sleep(1000);
    }
    console.log('@@JSON@@' + JSON.stringify(o) + '@@END@@');`);
  out.push({ channelName: a.channelName, title: a.title, author: a.author, estRev: a.estRev, subscribers: ch.subscriberCount ?? a.subscribers, createdAt: dt.createdAt, bio: ch.bio || '', subTitle: dt.subTitle || '',
    links: (dt.link || []).map(l => (typeof l === 'string' ? l : l.url || l.link || JSON.stringify(l))).slice(0, 5), totalPosts: dt.postCount ?? r.total, likeCount: dt.likeCount, viewCount: dt.viewCount, membership: dt.activeMembership,
    items: r.items, chars });
  log(`${a.title}: 글 ${r.items.length} · 글자 표본 ${Object.keys(chars).length}`);
}

// ── 요약
const match = buildMatcher();
const KST = 9 * 3600; const day = t => new Date((t + KST) * 1000).toISOString().slice(0, 10);
const med = a => { const s = a.filter(x => x != null).sort((x, y) => x - y); return s.length ? (s.length % 2 ? s[s.length >> 1] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : null; };
const rate = p => p.price > 0 && p.price <= 5000 ? p.views * p.price * (p.price < 900 ? D.meta.buyRate.single : D.meta.buyRate.bundle) : 0;
const peers = out.map(c => {
  const L = [...c.items].sort((x, y) => x.publishedAt - y.publishedAt);
  const paid = L.filter(p => p.price > 0 && p.price <= 5000);
  const firstPaidIdx = L.findIndex(p => p.price > 0 && p.price <= 5000);
  const gaps = L.slice(1).map((p, i) => (p.publishedAt - L[i].publishedAt) / 86400);
  const cv = Object.entries(c.chars).filter(([, v]) => v.chars);
  const paidChars = cv.filter(([id]) => paid.some(p => String(p.postId) === id)).map(([, v]) => v.chars);
  const ppl = {}; for (const p of L) for (const x of match(p).people) ppl[x] = (ppl[x] || 0) + 1;
  const ser = {}; for (const p of L) { const k = p.seriesTitle || '(시리즈 없음)'; (ser[k] ||= []).push(p); }
  const months = new Set(L.map(p => day(p.publishedAt).slice(0, 7))).size;
  return {
    channelName: c.channelName, title: c.title, author: c.author, subscribers: c.subscribers, createdAt: c.createdAt ? day(c.createdAt) : null, bio: c.bio, subTitle: c.subTitle, links: c.links,
    totalPosts: c.totalPosts, fetched: L.length, firstPost: L[0] ? day(L[0].publishedAt) : null, lastPost: L.length ? day(L[L.length - 1].publishedAt) : null, activeMonths: months,
    freeBeforeFirstPaid: firstPaidIdx < 0 ? L.length : firstPaidIdx, daysToFirstPaid: firstPaidIdx > 0 ? Math.round((L[firstPaidIdx].publishedAt - L[0].publishedAt) / 86400) : 0,
    paidPosts: paid.length, freePosts: L.length - paid.length, adultPaidRatio: paid.length ? Math.round(100 * paid.filter(p => p.adult).length / paid.length) : null,
    medPrice: med(paid.map(p => p.price)), medGapDays: gaps.length ? Math.round(med(gaps) * 10) / 10 : null, postsPerMonth: months ? Math.round(10 * L.length / months) / 10 : null,
    medChars: med(cv.map(([, v]) => v.chars)), medPaidChars: med(paidChars), pricePer10k: med(paidChars) && med(paid.map(p => p.price)) ? Math.round(med(paid.map(p => p.price)) / med(paidChars) * 10000) : null,
    medImages: med(cv.map(([, v]) => v.images || 0)), estRevAll: Math.round(L.reduce((s, p) => s + rate(p), 0)), estRev: c.estRev, medViews: med(L.map(p => p.views)), medLikes: med(L.map(p => p.likes)),
    people: Object.entries(ppl).sort((a, b) => b[1] - a[1]).slice(0, 5).map(x => x[0]),
    series: Object.entries(ser).map(([t, v]) => { const pv = v.filter(p => p.price > 0 && p.price <= 5000); return { title: t, id: v.find(p => p.seriesId)?.seriesId ?? null, eps: v.length, paid: pv.length, price: med(pv.map(p => p.price)), adult: v.some(p => p.adult), start: day(v[0].publishedAt), last: day(v[v.length - 1].publishedAt), estRev: Math.round(v.reduce((s, p) => s + rate(p), 0)), medViews: med(v.map(p => p.views)), tags: [...new Set(v.flatMap(p => p.tags))].slice(0, 10), summary: v.find(p => p.summary)?.summary || '' }; })
      .sort((a, b) => b.estRev - a.estRev).slice(0, 8),
    timeline: L.map(p => [day(p.publishedAt), p.price, p.adult ? 1 : 0, p.views, (c.chars[String(p.postId)] || {}).chars || null]),
  };
});
fs.writeFileSync(path.join(DIR, 'peers.json'), JSON.stringify(peers, null, 1));
D.peers = peers; fs.writeFileSync(path.join(DIR, 'market.json'), JSON.stringify(D));
log('저장', path.join(DIR, 'peers.json'), peers.length, '곳');
