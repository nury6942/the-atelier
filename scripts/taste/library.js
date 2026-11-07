#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════
//  Taste 수집기 (책 · 여행 도시) → Firestore tasteItems (아이맥 월·목, run.sh 가 마지막에 부름)
//
//  인스타 큐레이터(책 추천 · 여행지 추천) 최신 글 → `claude -p` 가 프로필 「2. 독서」「3. 여행」으로 거름
//  → 책 ~4 · 도시 ~3. 책은 저자·제목이 글에 적힌 것만, 일본 작품 제외, 이미 읽은 책·읽을 예정 제외.
//  도시는 가 본 곳·확정 여행·제외 지역(일본·동남아·중동·그리스) 빼고.
//  사진 필수: 책은 표지(예스24·네이버), 도시는 대표 풍경(원글·위키백과·인스타). 못 찾으면 안 씀.
//  수동: node scripts/taste/library.js [--dry]
// ═══════════════════════════════════════════════════════════
const fs = require('fs');
const os = require('os');
const path = require('path');
const L = require('./lib');
const { log, norm, docId } = L;

const DRY = process.argv.includes('--dry');
const CAP = { book: 4, city: 3 };
const WORK = fs.mkdtempSync(path.join(os.tmpdir(), 'atelier-library-'));
const T0 = Date.now();
const DEADLINE = T0 + 10 * 60e3;
const left = () => DEADLINE - Date.now();

// 인스타 큐레이터 — Aside 로 프로필을 직접 열어 확인한 계정만 (팔로워 2026-11-07, 5만 이상)
const BOOK_CURATORS = [
  // BOOK_CURATORS_START
  'library_yeorumi',       // 103K 여르미 도서관
  'ilg.mag',               // 55K  읽? 매거진
  // BOOK_CURATORS_END
];
const TRAVEL_CURATORS = [
  // TRAVEL_CURATORS_START
  '_tripgoing',            // 963K 트립고잉
  'foto_ycy',              // 483K 여행 포토 크리에이터 윤찬영
  'lulu__mignon',          // 405K 룰루미뇽 — 여행·숙소
  'travel_behappyhere',    // 332K 여행 여기서 행복할 것
  'gamsung__stay',         // 121K 감성스테이 — 국내외 여행지
  'monster_travel__',      // 106K 여행몬스터
  // TRAVEL_CURATORS_END
];

async function main() {
  log('[library] 시작', DRY ? '(dry)' : '');
  const db = L.initDb();
  const existing = [];
  (await db.collection('tasteItems').get()).forEach((d) => existing.push(Object.assign({ id: d.id }, d.data())));
  const seenTitle = new Set(existing.map((e) => norm(e.title)));
  const igSeen = L.loadSeen();
  const seed = Math.floor(Date.now() / 864e5);

  const cands = [];
  const sources = {};
  for (const [tag, list] of [['book', BOOK_CURATORS], ['city', TRAVEL_CURATORS]]) {
    const now = L.pick(list, 5, seed * 5);
    for (let i = 0; i < now.length && left() > 6 * 60e3; i += 5) {
      let got = await L.aside({ mode: 'ig-profile', handles: now.slice(i, i + 5), n: 10, skip: Object.keys(igSeen) });
      log('  큐레이터', tag, now.slice(i, i + 5).join(','), got.length + '개');
      for (const c of got) { igSeen[c.url] = new Date().toISOString(); if ((c.text || '').length > 30) cands.push(Object.assign({ tag }, c)); }
      sources[tag] = (sources[tag] || 0) + got.length;
    }
  }
  if (!cands.length) { log('[library] 후보 없음'); return; }
  await Promise.all(cands.map(async (c, i) => {
    c.id = 'b' + i; c.files = [];
    for (const [j, u] of (c.images || []).slice(0, 1).entries()) { const f = await L.fetchImage(u, path.join(WORK, c.id + '_' + j + '.jpg')); if (f) c.files.push(path.basename(f)); }
  }));

  const ex = (kind, st) => existing.filter((e) => e.kind === kind && st.includes(e.status)).slice(-20).map((e) => '- ' + e.title + ' (' + (e.subtitle || '') + ')').join('\n') || '(없음)';
  const prompt = `너는 누리의 책·여행 큐레이터다. 아래 인스타 큐레이터 게시물에서 누리 취향에 맞는 **책**(최대 ${CAP.book + 2})과 **여행 도시**(최대 ${CAP.city + 2})를 골라 JSON 으로만 답해라.

## 누리 독서 취향
${L.profileSection(2)}

## 누리 여행 취향 (가 본 곳·확정 여행·제외 지역 포함)
${L.profileSection(3)}

## 누리가 저장/읽음·다녀옴 한 것
책:\n${ex('book', ['saved', 'done'])}\n도시:\n${ex('city', ['saved', 'done'])}
## 누리가 '별로'라고 한 것
책:\n${ex('book', ['nope'])}\n도시:\n${ex('city', ['nope'])}

## 이미 카드가 있는 제목 (다시 고르지 말 것)
${existing.filter((e) => e.kind === 'book' || e.kind === 'city').map((e) => e.title).join(', ')}

## 규칙
- 책 제목·저자, 도시 이름은 게시물 글에 **적힌 것만**. 지어내기 금지.
- 책: 일본 작품 제외, 위로·자기계발형 제외, 프로필의 '읽은 책·읽을 예정' 제외. subtitle "저자 · 장르". detail 1~2줄.
- 도시: 가 본 곳·확정/검토 중인 여행지·제외 지역(일본·동남아·중동·그리스) 빼기, 혼자 여행하는 아시아 여성에게 안전한 곳. subtitle 나라 이름. months(가기 좋은 달), temp(그때 낮 기온) 은 네가 아는 일반 기후로.
- why: 누리에게 맞는 이유 한 줄 40자 이내.
- 애매하면 빼라.

## 출력 (코드 블록 하나, JSON 배열만)
[{"cand":"b3","kind":"book","title":"…","subtitle":"저자 · 소설","why":"…","detail":"…","tags":["소설"]},
 {"cand":"b9","kind":"city","title":"…","subtitle":"나라","why":"…","detail":"…","tags":["…"],"months":"5~6월","temp":"20~24℃"}]

## 후보
${cands.map((c) => `### ${c.id} [${c.tag}] ${c.author} ${c.url}\n${c.text.slice(0, 1200)}`).join('\n\n')}`;
  let picks = [];
  try { picks = L.parseJson(await L.runClaude(prompt, 'opus', Math.max(150e3, left() - 4 * 60e3), WORK)); }
  catch (e) { log('[library] claude 실패', e.message); return; }
  log('[library] claude 고른 것', picks.length);

  const byId = Object.fromEntries(cands.map((c) => [c.id, c]));
  const docs = [];
  for (const p of picks) {
    const c = byId[p.cand];
    if (!c || !p.title || !CAP[p.kind] || seenTitle.has(norm(p.title))) continue;
    if (docs.filter((d) => d.doc.kind === p.kind).length >= CAP[p.kind]) continue;
    seenTitle.add(norm(p.title));
    const doc = {
      kind: p.kind, title: String(p.title).trim(), subtitle: String(p.subtitle || '').trim(),
      why: String(p.why || '').trim().slice(0, 40), detail: String(p.detail || '').trim(),
      tags: Array.isArray(p.tags) ? p.tags.map(String).slice(0, 6) : [],
      src: { type: 'instagram', url: c.url, author: c.author, likes: 0 },
      batch: L.kstDate(), addedAt: new Date().toISOString(),
    };
    if (p.kind === 'city') { doc.meta = { months: p.months || '', temp: p.temp || '' }; doc.mapUrl = L.mapUrl(doc.title + ' ' + doc.subtitle, false); }
    docs.push({ id: docId(p.kind, doc.title), doc, c });
  }

  // 사진: 책 표지(예스24 → 네이버), 도시(원글 사진 · 위키백과 · 인스타)
  const extra = {};
  const books = docs.filter((d) => d.doc.kind === 'book');
  if (books.length) for (const r of await L.aside({ mode: 'yes24', items: books.map((d) => ({ key: d.id, q: d.doc.title + ' ' + d.doc.subtitle.split('·')[0].trim() })) })) {
    const d = books.find((x) => x.id === r.key);
    extra[r.key] = (r.results || []).filter((z) => z.img && norm(z.title).includes(norm(d.doc.title))).map((z) => z.img.replace(/\/(S|M|L)$/, '/XL')).slice(0, 2);
  }
  for (const d of docs.filter((x) => x.doc.kind === 'city')) {
    const w = await L.wikiLead(d.doc.title.split('·')[0].trim(), 'ko');
    extra[d.id] = [...(d.c.images || []).slice(0, 1), w].filter(Boolean);
  }
  const got = await L.photoFill(docs.map((d) => ({
    key: d.id, name: d.doc.title + ' (' + d.doc.subtitle + ')', kind: d.doc.kind, ig: d.doc.kind === 'city',
    q: d.doc.kind === 'book' ? d.doc.title + ' ' + d.doc.subtitle.split('·')[0].trim() + ' 책' : d.doc.title.split('·')[0].trim() + ' 여행',
    extra: extra[d.id] || [], posts: d.doc.kind === 'city' ? [d.c.url] : [],
  })), WORK, DEADLINE + 4 * 60e3);

  let written = 0;
  for (const d of docs) {
    if (!got[d.id]) { log('  - 사진 없어 뺌:', d.doc.title); continue; }
    if ((await db.collection('tasteItems').doc(d.id).get()).exists) continue;
    d.doc.image = L.dataUrl(got[d.id]);
    if (!DRY) await db.collection('tasteItems').doc(d.id).set(d.doc, { merge: true });
    written++;
    log('  +', d.doc.kind, d.doc.title, '|', d.doc.subtitle, '|', d.doc.why, '|', d.doc.src.author, Math.round(d.doc.image.length * 0.75 / 1024) + 'KB');
  }
  if (!DRY) L.saveSeen(igSeen);
  const run = { at: new Date().toISOString(), written, sources, candidates: cands.length, minutes: +((Date.now() - T0) / 60000).toFixed(1) };
  if (!DRY) await db.collection('tasteRuns').doc(L.kstDate()).set({ library: run }, { merge: true });
  log('[library] 끝', JSON.stringify(run));
}

main()
  .catch((e) => { log('[library] 실패', (e && e.message) || e); process.exitCode = 1; })
  .finally(() => { try { fs.rmSync(WORK, { recursive: true, force: true }); } catch (e) {} setTimeout(() => process.exit(), 500); });
