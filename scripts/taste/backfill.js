#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════
//  사진 없는 tasteItems 카드에 사진만 채우기 (모든 종류) — image 칸만 merge, status·statusAt 은 안 건드림
//   책: 예스24 검색 표지 · 도시: 위키백과 대표 사진 + 인스타 검색 · 공간/숙소/전시/공연/영화: 원글 · 이름 검색 · 위키백과
//   후보 사진은 claude 가 Read 로 보고 '그 항목의 진짜 사진/표지/포스터'만 고른다.
//  수동(아이맥 launchd 환경): node scripts/taste/backfill.js [--dry]
// ═══════════════════════════════════════════════════════════
const fs = require('fs');
const os = require('os');
const path = require('path');
const L = require('./lib');
const { log, norm } = L;

const DRY = process.argv.includes('--dry');
const WORK = fs.mkdtempSync(path.join(os.tmpdir(), 'atelier-backfill-'));
const DEADLINE = Date.now() + 25 * 60e3;

async function main() {
  const db = L.initDb();
  const todo = [];
  (await db.collection('tasteItems').get()).forEach((d) => { const x = d.data(); if (!x.image) todo.push(Object.assign({ id: d.id }, x)); });
  log('[backfill] 사진 없는 카드', todo.length, JSON.stringify(todo.reduce((a, x) => (a[x.kind] = (a[x.kind] || 0) + 1, a), {})));
  if (!todo.length) return;

  // 영어 위키 제목 (도시·해외 미술관·공연장) — claude 지식, 실제 사진이 오는지는 API 가 확인
  const wikiNeed = todo.filter((x) => x.kind === 'city' || (x.meta && x.meta.trip) || ['place', 'stay'].includes(x.kind));
  let wiki = {};
  if (wikiNeed.length) {
    try {
      wiki = L.parseJson(await L.runClaude(`각 항목에 맞는 영어 위키백과 문서 제목을 적어라. 여러 곳을 묶은 이름(예 "브라쇼브 · 시비우")은 첫 곳. 국립공원 묶음은 대표 공원 하나(예 "유타 국립공원" → "Zion National Park"). 작은 가게·카페처럼 위키 문서가 없을 것 같으면 "".
출력은 코드 블록 하나, JSON 객체: {"id":"Wiki title"}
${wikiNeed.map((x) => `- ${x.id}: [${x.kind}] ${x.title} (${x.subtitle || ''})`).join('\n')}`, 'sonnet', 3 * 60e3, WORK));
    } catch (e) { log('  위키 제목 실패', e.message); }
  }
  const extra = {};
  await Promise.all(todo.map(async (x) => {
    const t = wiki[x.id];
    const u = t ? await L.wikiLead(t, 'en') : '';
    const k = x.kind === 'city' ? await L.wikiLead(String(x.title).split('·')[0].trim(), 'ko') : '';
    extra[x.id] = [u, k].filter(Boolean);
  }));

  // 책 표지: 예스24
  const books = todo.filter((x) => x.kind === 'book');
  for (let i = 0; i < books.length; i += 6) {
    const got = await L.aside({ mode: 'yes24', items: books.slice(i, i + 6).map((b) => ({ key: b.id, q: b.title + ' ' + String(b.subtitle || '').split('·')[0].trim() })) });
    for (const r of got) {
      const b = books.find((x) => x.id === r.key);
      const hit = (r.results || []).filter((z) => z.img && norm(z.title).includes(norm(b.title))).map((z) => z.img.replace(/\/(S|M|L)$/, '/XL'));
      extra[r.key] = [...(extra[r.key] || []), ...hit.slice(0, 2)];
    }
  }

  const got = await L.photoFill(todo.map((x) => ({
    key: x.id, name: x.title + (x.subtitle ? ' (' + x.subtitle + ')' : ''), kind: x.kind,
    search: x.kind !== 'book',
    ig: x.kind !== 'film',
    q: x.kind === 'film' ? '영화 ' + x.title : x.kind === 'city' ? String(x.title).split('·')[0].trim() + ' 여행'
      : x.title + (x.meta && x.meta.venue && x.meta.venue !== x.title ? ' ' + x.meta.venue : ''),
    extra: extra[x.id] || [],
    posts: x.src && ['x', 'threads', 'instagram'].includes(x.src.type) ? [x.src.url] : [],
  })), WORK, DEADLINE);

  let n = 0;
  for (const x of todo) {
    if (!got[x.id]) { log('  - 못 찾음:', x.kind, x.title); continue; }
    const image = L.dataUrl(got[x.id]);
    if (!DRY) await db.collection('tasteItems').doc(x.id).set({ image }, { merge: true });
    n++;
    log('  + 사진', x.kind, x.title, Math.round(image.length * 0.75 / 1024) + 'KB');
  }
  log('[backfill] 끝', n, '/', todo.length);
}

main()
  .catch((e) => { log('[backfill] 실패', (e && e.message) || e); process.exitCode = 1; })
  .finally(() => { try { fs.rmSync(WORK, { recursive: true, force: true }); } catch (e) {} setTimeout(() => process.exit(), 500); });
