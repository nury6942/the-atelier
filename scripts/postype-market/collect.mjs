#!/usr/bin/env node
// 포스타입 나페스 마켓 수집기 (Aside 브라우저, 누리 로그인 세션으로 읽기만)
//
//   node scripts/postype-market/collect.mjs --from 2026-10-07 --to 2026-11-07 \
//        --kw "리쿠 나페스" --kw "센티넬 나페스" --out ~/postype-market-data/pilot
//
// 단계: 1) 키워드 검색 → 글  2) 시리즈 회차 전체  3) 채널 구독자
// 요청 하나하나를 "작업"으로 줄 세워 두고, Aside REPL 한 번(120초 제한)에 약 95초어치씩 처리한다.
// 브라우저 쪽 호출은 한 건씩(30초 제한 회피). 요청 사이 1.2초 쉼. 중간에 끊겨도 state.json 에서 이어감.

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const args = process.argv.slice(2);
const opt = { kw: [] };
for (let i = 0; i < args.length; i += 2) {
  const k = args[i].replace(/^--/, '');
  if (k === 'kw') opt.kw.push(args[i + 1]); else opt[k] = args[i + 1];
}
const OUT = (opt.out || '~/postype-market-data/run').replace(/^~/, os.homedir());
const DELAY = Number(opt.delay || 1200);
const MAX_SEARCH_PAGES = Number(opt.maxPages || 1000);
const SIZE = Number(opt.size || 100);
const TOP_SERIES = Number(opt.topSeries || 800);
const TOP_CHANNELS = Number(opt.topChannels || 800);
const MY = ['bichu-attic', 'hotnncold'];
// 검색 기간을 반달 단위로 쪼갬 (검색이 1만 건 넘으면 뒤쪽이 안 나올 수 있어서)
function windows(from, to) {
  const out = []; let d = new Date(from + 'T00:00:00Z'); const end = new Date(to + 'T00:00:00Z');
  while (d <= end) { const day = d.getUTCDate(); const e = day < 16 ? new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 15)) : new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)); const ee = e > end ? end : e; out.push([d.toISOString().slice(0, 10), ee.toISOString().slice(0, 10)]); d = new Date(ee.getTime() + 86400000); }
  return out;
}
fs.mkdirSync(OUT, { recursive: true });
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pmkt-'));
const log = (...a) => console.error('[collect]', ...a);
const statePath = path.join(OUT, 'state.json');

// ── 상태 (이어하기용)
let S = fs.existsSync(statePath) ? JSON.parse(fs.readFileSync(statePath, 'utf8')) : null;
if (!S) {
  S = { opt, phase: 'search', queue: [], done: 0, posts: {}, series: {}, channels: {}, seenSeries: {}, seenChannels: {} };
  for (const kw of opt.kw) for (const [f, t] of windows(opt.from, opt.to)) S.queue.push({ kind: 'search', kw, page: 0, from: f, to: t });
}
const saveState = () => fs.writeFileSync(statePath, JSON.stringify(S));

// ── 페이지 안에서 한 작업 처리
const PAGE_FN = `async (job) => {
  const slim = (f) => ({
    postId: f.postId, title: f.title, subTitle: f.subTitle, summary: (f.summary||'').slice(0,200),
    channelId: f.channel?.channelId, channelName: f.channel?.channelName, channelTitle: f.channel?.title, channelType: f.channel?.channelType,
    author: f.author?.profile?.nickname ?? f.profile?.nickname,
    seriesId: f.series?.seriesId ?? null, seriesTitle: f.series?.title ?? null,
    views: f.viewCount, likes: f.likeCount, comments: f.commentCount,
    price: f.price, adult: f.forAdult, membership: f.membership, tags: f.tags || [],
    publishedAt: f.publishedAt,
  });
  const call = async (url, body) => {
    const r = await fetch(url, body ? {method:'POST', credentials:'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body)} : {credentials:'include'});
    if (r.status === 429 || r.status === 403 || r.status === 401) return { blocked: r.status };
    if (!r.ok) return { err: r.status };
    const j = await r.json(); return { d: j.data ?? j };
  };
  if (job.kind === 'search') {
    const x = await call('https://api.postype.com/api/v3/post:search', {keyword: job.kw, size: job.size, page: job.page, sort: 'RECENT', range: {from: job.from, to: job.to}, adult: 'ALL', fields: ['title','sub_title','tags','user_profile_nickname']});
    if (!x.d) return x;
    return { total: x.d.totalElements, pages: x.d.totalPages, items: (x.d.content||[]).filter(it => it?.type==='POST' && it.feedItem?.postId).map(it => slim(it.feedItem)) };
  }
  if (job.kind === 'series') {
    const x = await call('https://api.postype.com/api/v1/series/'+job.id+'/posts?sort=publishedAt,asc&page='+job.page+'&size=100');
    if (!x.d) return x;
    return { total: x.d.totalElements, pages: x.d.totalPages, items: (x.d.content||[]).filter(it => it?.feedItem?.postId).map(it => slim(it.feedItem)) };
  }
  if (job.kind === 'channel' && job.id) {
    const x = await call('https://api.postype.com/api/v1/channel/' + job.id);
    if (!x.d) return x;
    const c = x.d, dt = c.details || {};
    return { ch: { title: c.title, subscribers: c.subscriberCount, tags: c.tags, type: c.type, nickname: c.profile?.nickname, profileId: c.profile?.id,
      createdAt: dt.createdAt, postCount: dt.postCount, likeCount: dt.likeCount, viewCount: dt.viewCount, activeMembership: dt.activeMembership } };
  }
  if (job.kind === 'channel') {
    const x = await call('https://api.postype.com/api/v2/channel:search', {keyword: job.title, page: 0, size: 10});
    if (!x.d) return x;
    const hit = (x.d.content||[]).find(c => c.name === job.name);
    return { ch: hit ? {title: hit.title, subscribers: hit.subscriberCount, tags: hit.tags, type: hit.type, nickname: hit.profile?.nickname} : null };
  }
  if (job.kind === 'chars') {
    const r = await fetch('https://www.postype.com/@' + job.ch + '/post/' + job.postId, {credentials:'include'});
    if (r.status === 429 || r.status === 403) return { blocked: r.status };
    if (!r.ok) return { err: r.status };
    const h = await r.text();
    const t = h.match(/텍스트\\s*<b>([\\d,]+)<\\/b>\\s*자/), im = h.match(/이미지\\s*<b>([\\d,]+)<\\/b>\\s*장/);
    return { chars: t ? Number(t[1].replace(/,/g, '')) : null, images: im ? Number(im[1].replace(/,/g, '')) : 0 };
  }
  return { err: 'unknown job' };
}`;

function runBatch(jobs) {
  const file = path.join(tmpDir, `b${Date.now()}.js`);
  fs.writeFileSync(file, `
const jobsB = ${JSON.stringify(jobs)};
const resB = [];
const pgB = await openTab('https://www.postype.com/search/post?keyword=%EB%82%98%ED%8E%98%EC%8A%A4');
try {
  const t0 = Date.now();
  for (const job of jobsB) {
    if (Date.now() - t0 > 90000) break;
    const r = await pgB.evaluate(${PAGE_FN}, job);
    resB.push(r);
    if (r.blocked) break;
    await sleep(${DELAY});
  }
} finally { await closeTab(pgB); }
console.log('@@JSON@@' + JSON.stringify(resB) + '@@END@@');
`);
  const out = execFileSync('aside', ['repl', '--file', file], { encoding: 'utf8', maxBuffer: 256 * 1024 * 1024 });
  const m = out.match(/@@JSON@@([\s\S]*)@@END@@/);
  if (!m) throw new Error('no result:\n' + out.slice(-2000));
  return JSON.parse(m[1]);
}

function enqueueFollowups(post) {
  if (post.seriesId && !S.seenSeries[post.seriesId]) { S.seenSeries[post.seriesId] = 1; S.queue.push({ kind: 'series', id: post.seriesId, page: 0 }); }
  if (post.channelName && !S.seenChannels[post.channelName]) { S.seenChannels[post.channelName] = 1; S.queue.push({ kind: 'channel', name: post.channelName, title: post.channelTitle }); }
}

// 검색 작업을 먼저, 그다음 시리즈, 채널 순서
const order = { search: 0, series: 1, channel: 2, chars: 3 };
let errors = 0;
for (;;) {
while (S.queue.length) {
  S.queue.sort((a, b) => order[a.kind] - order[b.kind]);
  const jobs = S.queue.slice(0, 80).map(j => ({ ...j, size: SIZE }));
  let res;
  try { res = runBatch(jobs); }
  catch (e) { errors++; log('배치 실패', String(e).slice(0, 300)); if (errors > 3) break; continue; }
  for (let i = 0; i < res.length; i++) {
    const job = S.queue.shift(); const r = res[i];
    if (r.blocked) { log('막힘', r.blocked, '— 멈춥니다. 나중에 같은 명령으로 이어가기'); saveState(); process.exit(3); }
    if (r.err) { log('오류', job.kind, r.err); continue; }
    if (job.kind === 'search') {
      for (const p of r.items) { const prev = S.posts[p.postId]; S.posts[p.postId] = { ...p, keywords: [...new Set([...(prev?.keywords || []), job.kw])] }; }
      if (job.page === 0) for (let pg = 1; pg < Math.min(r.pages, MAX_SEARCH_PAGES); pg++) S.queue.push({ kind: 'search', kw: job.kw, page: pg, from: job.from, to: job.to });
      if (job.page === 0) log(`검색 "${job.kw}" ${job.from}~${job.to} ${r.total}건 / ${r.pages}쪽`);
    } else if (job.kind === 'series') {
      const s = S.series[job.id] || (S.series[job.id] = { total: r.total, eps: [] });
      s.total = r.total; s.eps.push(...r.items);
      if (job.page === 0) for (let pg = 1; pg < r.pages; pg++) S.queue.push({ kind: 'series', id: job.id, page: pg });
    } else if (job.kind === 'channel') {
      S.channels[job.name] = r.ch || { title: job.title, subscribers: null };
    } else if (job.kind === 'chars') {
      (S.chars ||= {})[job.postId] = { chars: r.chars, images: r.images, seriesId: job.seriesId };
    }
    S.done++;
  }
  saveState();
  const left = S.queue.reduce((a, j) => (a[j.kind] = (a[j.kind] || 0) + 1, a), {});
  log(`완료 ${S.done}건 · 글 ${Object.keys(S.posts).length} · 시리즈 ${Object.keys(S.series).length} · 채널 ${Object.keys(S.channels).length} · 남은 작업 ${JSON.stringify(left)}`);
}
if (errors > 3) break;
if (S.phase === 'search') {
  // 좋아요 합 기준 상위 시리즈·채널만 자세히 (+ 내 채널은 전부)
  const sLikes = {}, cLikes = {}, cTitle = {};
  for (const p of Object.values(S.posts)) {
    if (p.seriesId) sLikes[p.seriesId] = (sLikes[p.seriesId] || 0) + p.likes + (MY.includes(p.channelName) ? 1e9 : 0);
    if (p.channelName) { cLikes[p.channelName] = (cLikes[p.channelName] || 0) + p.likes + (MY.includes(p.channelName) ? 1e9 : 0); cTitle[p.channelName] = p.channelTitle; }
  }
  for (const id of Object.keys(sLikes).sort((a, b) => sLikes[b] - sLikes[a]).slice(0, TOP_SERIES)) S.queue.push({ kind: 'series', id: Number(id), page: 0 });
  for (const n of Object.keys(cLikes).sort((a, b) => cLikes[b] - cLikes[a]).slice(0, TOP_CHANNELS)) S.queue.push({ kind: 'channel', name: n, title: cTitle[n] });
  S.phase = 'detail'; saveState(); log(`검색 끝 → 상위 시리즈 ${Math.min(TOP_SERIES, Object.keys(sLikes).length)}개 · 채널 ${Math.min(TOP_CHANNELS, Object.keys(cLikes).length)}개 자세히`);
  continue;
}
if (S.phase === 'detail' && !opt.noChars) {
  // 글자 수 샘플: 추정 매출 상위 시리즈 TOP_CHARS 개 × (1화 · 첫 유료 화 · 가운데 · 마지막) + 내 시리즈
  const TOP_CHARS = Number(opt.topChars || 200);
  const val = (s) => s.eps.reduce((a, e) => a + (e.price > 0 && e.price <= 5000 ? e.views * e.price : 0), 0);
  const list = Object.entries(S.series).filter(([, s]) => s.eps?.length).map(([id, s]) => ({ id, s, v: val(s) + (MY.includes(s.eps[0].channelName) ? 1e15 : 0) }));
  list.sort((a, b) => b.v - a.v);
  for (const { id, s } of list.slice(0, TOP_CHARS)) {
    const eps = [...s.eps].sort((a, b) => a.publishedAt - b.publishedAt);
    const fp = eps.findIndex(e => e.price > 0 && e.price <= 5000);
    const idx = [...new Set([0, fp, Math.floor(eps.length / 2), eps.length - 1].filter(i => i >= 0))];
    for (const i of idx) S.queue.push({ kind: 'chars', postId: eps[i].postId, ch: eps[i].channelName, seriesId: Number(id) });
  }
  S.phase = 'chars'; saveState(); log(`글자 수 샘플 ${S.queue.length}편`);
  continue;
}
break;
}

if (!S.queue.length) {
  const w = (n, o) => fs.writeFileSync(path.join(OUT, n), JSON.stringify(o, null, 1));
  w('search-posts.json', Object.values(S.posts));
  w('series.json', S.series);
  w('channels.json', S.channels);
  w('chars.json', S.chars || {});
  w('meta.json', { collectedAt: new Date().toISOString(), ...S.opt, posts: Object.keys(S.posts).length, series: Object.keys(S.series).length, channels: Object.keys(S.channels).length });
  log('끝', OUT);
}
