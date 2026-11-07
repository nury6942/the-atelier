#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════
//  Taste 수집기 (공간·숙소) → Firestore tasteItems (아이맥 월·목 07:30, run.sh 가 부름)
//
//  X · Threads · Instagram(키워드 + 큐레이터 계정 최신 글) · 스테이폴리오 → `claude -p`(구독)가 취향 프로필로 거름
//  → 한 번에 공간 ~10 · 숙소 ~5 새 카드. X·Threads 는 작성자 타래(본인 답글)까지 읽어 장소 이름을 찾는다.
//  사진은 진짜 사진만(480px, 80KB 아래): 원글 → 같은 글의 다른 사진 → 이름으로 인스타·네이버 검색 사진.
//
//  취향 프로필: ~/.config/atelier-taste/profile.md (chmod 600) — 저장소·로그에 절대 안 남김
//  수동: node scripts/taste/collect.js [--dry] [--limit N] [--stays N] [--url <글 주소>]… [--backfill]
//    --url      이 글을 후보에 꼭 넣는다 (예: 누리가 보낸 글)
//    --backfill 사진 없는 공간·숙소 카드에 사진만 채운다 (image 칸만 merge)
// ═══════════════════════════════════════════════════════════

const fs = require('fs');
const os = require('os');
const path = require('path');
const L = require('./lib');
const { log, norm, docId } = L;

const ARGS = process.argv.slice(2);
const arg = (k, d) => { const i = ARGS.indexOf(k); return i >= 0 && ARGS[i + 1] ? ARGS[i + 1] : d; };
const DRY = ARGS.includes('--dry');
const BACKFILL = ARGS.includes('--backfill');
const LIMIT = Number(arg('--limit', 10));                 // 공간
const STAYS = Number(arg('--stays', 5));                  // 숙소
const FORCE_URLS = ARGS.map((a, i) => (a === '--url' ? ARGS[i + 1] : null)).filter(Boolean);
const WORK = fs.mkdtempSync(path.join(os.tmpdir(), 'atelier-taste-'));
const T0 = Date.now();
const DEADLINE = T0 + 14 * 60e3;
const left = () => DEADLINE - Date.now();

// 검색어 — 회차마다 몇 개씩 돌려 쓴다
const X_QUERIES = ['복합문화공간', '북카페', '도서관 카페', '사색 공간', '혼자 가기 좋은 카페', '북스테이', '독채 스테이', '리추얼 공간', '책방 추천', '문구 카페', '서촌 공간', '성수 공간'];
const TH_QUERIES = ['서울 복합문화공간', '북카페 추천', '북스테이', '스테이폴리오', '혼자 기록하기 좋은 카페', '책방 추천', '연남 카페 공간'];
const IG_QUERIES = ['#북스테이', '#복합문화공간', '#독립서점', '#서울공간', '#북카페', '#스테이폴리오'];

// 인스타 큐레이터 — Aside 로 프로필을 직접 열어 확인한 계정만 (팔로워는 2026-11-07 확인 값, 5만 이상)
// 한 번에 8개씩 돌아가며 읽는다 (계정마다 최신 12개, 이미 본 글은 건너뜀)
const CURATORS = [
  // CURATORS_START
  '_tripgoing',            // 963K 트립고잉 — 누리 예시
  'space_tamnik',          // 3M   공간 탐닉 (포토그래퍼)
  'knewnew.official',      // 515K 뉴뉴매거진
  'daytripkorea',          // 536K 데이트립
  'blimp.official',        // 406K 블림프 — 공간·팝업·라이프스타일
  'travel_behappyhere',    // 332K 여행 여기서 행복할 것
  'dott_magazine',         // 209K 디오티티
  'diggingdot.mag',        // 198K 디깅닷 — 공간·축제·팝업
  'editor_dongwon',        // 193K 공간 편집장
  'b_taeng',               // 186K 방탱이 — 카페·숙소·전시·여행
  'cafe.ing',              // 153K 카페갈래 — 카페·여행·숙소
  'selectionist.official', // 152K 셀렉셔니스트
  'hyoshinkwak',           // 128K 곽효신 — 카페·여행·전시·숙소
  'space.textbook',        // 107K 공간교과서
  '_roundmag',             // 101K 라운드매거진
  'koh_min_',              // 75K  고민 — 카페·전시
  'samdori_archive',       // 72K  삼도리 아카이브 — 공간기록장
  'yeodam_official',       // 65K  여담 (여행)
  'd_careeer',             // 59K  디커 — 감도 높은 공간 큐레이션
  '4nyang_',               // 54K  사냥 — 카페·공간
  // CURATORS_END
];

async function main() {
  log('[taste] 시작', DRY ? '(dry)' : '', BACKFILL ? '(backfill)' : '', 'limit=' + LIMIT, 'stays=' + STAYS);
  const db = L.initDb();
  const existing = [];
  (await db.collection('tasteItems').get()).forEach((d) => existing.push(Object.assign({ id: d.id }, d.data())));
  log('[taste] 기존 카드', existing.length, '개');

  if (BACKFILL) return backfill(db, existing);

  const profile = L.profileSection(1) + '\n- 해외는 일본·동남아·중동 제외.\n';
  const seenUrl = new Set(existing.map((e) => e.src && e.src.url).filter(Boolean));
  const seenTitle = new Set(existing.map((e) => norm(e.title)));
  const igSeen = L.loadSeen();
  const ex = (st) => existing.filter((e) => (e.kind === 'place' || e.kind === 'stay') && st.includes(e.status)).slice(-25)
    .map((e) => '- ' + e.title + (e.subtitle ? ' (' + e.subtitle + ')' : '') + (e.detail ? ': ' + e.detail : '')).join('\n') || '(아직 없음)';

  // 1) 모으기
  const seed = Math.floor(Date.now() / 864e5);
  const since = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
  const sources = {};
  const cands = {};
  const add = (list, tag, force) => {
    let n = 0;
    for (const c of list) {
      if (!c || !c.url || cands[c.url]) continue;
      if (!force && seenUrl.has(c.url)) continue;
      if (!force && c.src !== 'stayfolio' && (c.text || '').length < 25) continue;
      c.force = !!force;
      cands[c.url] = c; n++;
    }
    sources[tag] = (sources[tag] || 0) + n;
  };

  if (FORCE_URLS.length) {
    const got = await L.aside({ mode: 'read', urls: FORCE_URLS });
    add(got.map((r) => Object.assign({ src: /instagram/.test(r.url) ? 'instagram' : /threads/.test(r.url) ? 'threads' : 'x',
      author: '@' + (new URL(r.url).pathname.split('/')[1] || '').replace('@', ''), likes: 0 }, r)), 'url', true);
    log('[taste] 지정 글', sources.url || 0);
  }
  for (const q of L.pick(X_QUERIES, 4, seed)) {
    if (left() < 11 * 60e3) break;
    add(await L.aside({ mode: 'x-search', q, since, scrolls: 3 }), 'x');
  }
  for (const q of L.pick(TH_QUERIES, 3, seed)) {
    if (left() < 10.5 * 60e3) break;
    add(await L.aside({ mode: 'threads-search', q, scrolls: 3 }), 'threads');
    await L.sleep(2000);
  }
  log('[taste] X 후보', sources.x || 0, '· Threads 후보', sources.threads || 0);

  let igSkipped = null;
  const curNow = L.pick(CURATORS, 8, seed * 8);
  for (let i = 0; i < curNow.length && left() > 9.5 * 60e3; i += 4) {
    const got = await L.aside({ mode: 'ig-profile', handles: curNow.slice(i, i + 4), n: 12, skip: Object.keys(igSeen) });
    for (const c of got) igSeen[c.url] = new Date().toISOString();
    add(got, 'curator');
  }
  for (const q of L.pick(IG_QUERIES, 2, seed)) {
    if (left() < 8.5 * 60e3) break;
    add(await L.aside({ mode: 'ig-search', q, max: 6, skip: [...seenUrl, ...Object.keys(igSeen)].filter((u) => /instagram/.test(u)) }), 'instagram');
  }
  if (!sources.curator && !sources.instagram) igSkipped = 'instagram 결과 없음(로그인 확인 필요할 수 있음)';
  log('[taste] 큐레이터 후보', sources.curator || 0, '· Instagram 검색 후보', sources.instagram || 0, igSkipped || '');

  if (left() > 8 * 60e3) add(await L.aside({ mode: 'stayfolio', max: 40 }), 'stayfolio');
  log('[taste] Stayfolio 후보', sources.stayfolio || 0);

  // 2) 추리기 — 소스마다 몫을 따로 (인스타 좋아요 수가 커서 한 줄로 세우면 X·Threads 가 밀린다)
  const PLACE_RX = /카페|공간|도서관|책방|서점|북스테이|스테이|숙소|독채|한옥|문구|갤러리|라운지|리추얼|사색|기록|층|cafe|library|book|stay|hotel/i;
  const pool = Object.values(cands).filter((c) => c.force || c.src === 'stayfolio' || PLACE_RX.test(c.text));
  const top = (src, n) => pool.filter((c) => c.src === src && !c.force).sort((a, b) => (b.likes || 0) - (a.likes || 0)).slice(0, n);
  const curated = pool.filter((c) => c.src === 'instagram' && /^@/.test(c.author) && CURATORS.includes(c.author.slice(1)) && !c.force).slice(0, 24);
  const social = [...pool.filter((c) => c.force), ...top('x', 10), ...top('threads', 10), ...curated,
    ...top('instagram', 8).filter((c) => !curated.includes(c))];
  const stays = pool.filter((c) => c.src === 'stayfolio').slice(0, 16);

  // 3) 상위 X·Threads 글은 원문 + 작성자 타래(본인 답글)까지 — 이름은 대개 타래 답글에 있다
  const toRead = [...top('x', 7), ...top('threads', 6)];
  for (let i = 0; i < toRead.length && left() > 6.5 * 60e3; i += 7) {
    for (const r of await L.aside({ mode: 'read', urls: toRead.slice(i, i + 7).map((c) => c.url) })) {
      const c = cands[r.url]; if (!c) continue;
      if (r.text && r.text.length > (c.text || '').length) c.text = r.text;
      if (r.images && r.images.length) c.images = [...new Set([...(c.images || []), ...r.images])].slice(0, 6);
    }
  }
  const list = [...social, ...stays];
  log('[taste] 거르기 대상', list.length, '개 (소셜', social.length, '· 스테이', stays.length + ')');
  if (!list.length) { log('[taste] 후보 없음 — 끝'); return; }

  // 4) 사진 미리 받기 (후보마다 최대 3장) — claude 가 '진짜 사진'인지 보고 고른다
  await Promise.all(list.map(async (c, i) => {
    c.id = 'c' + i;
    c.files = [];
    for (const [j, u] of (c.images || []).slice(0, 3).entries()) {
      const f = await L.fetchImage(u, path.join(WORK, c.id + '_' + j + '.jpg'));
      if (f) c.files.push(path.basename(f));
    }
  }));

  // 5) claude -p 로 거르기
  const candText = list.map((c) => [
    '### ' + c.id + ' [' + c.src + '] ' + (c.author || '') + ' · 좋아요 ' + (c.likes || 0) + (c.at ? ' · ' + c.at.slice(0, 10) : '') + (c.force ? ' · ★누리가 직접 보낸 글' : ''),
    (c.text || '').slice(0, 1800),
    c.files.length ? '사진 파일: ' + c.files.join(', ') : '사진 없음',
  ].join('\n')).join('\n\n');

  const prompt = `너는 누리의 공간·숙소 큐레이터다. 아래 후보 글(X·Threads·Instagram 게시물, 스테이폴리오 목록)에서 누리 취향에 맞는 **실제 장소/숙소**를 공간(place) 최대 ${LIMIT + 4}개, 숙소(stay) 최대 ${STAYS + 3}개 골라 JSON 으로만 답해라.

## 누리 취향
${profile}

## 누리가 저장/다녀온 것 (이런 결을 더)
${ex(['saved', 'done', 'like'])}

## 누리가 '별로'라고 한 것 (이런 결은 빼기)
${ex(['nope'])}

## 이미 카드가 있는 이름 (다시 고르지 말 것)
${existing.filter((e) => e.kind === 'place' || e.kind === 'stay').map((e) => e.title).slice(-200).join(', ') || '(없음)'}

## 규칙
- 이름은 글(본문·작성자 타래 답글·인용·다른 사람 답글) 또는 사진 속 글자에 **분명히 적힌 것만**. 📍 뒤 이름, 주소 앞 이름이 흔하다. 추측·지어내기 절대 금지. 이름이 없으면 그 글은 버린다.
- 본문에 이름이 없고 사진이 있으면 Read 로 사진 파일을 열어 간판·캡션 글자를 확인해도 된다(작업 폴더 안 파일만).
- 여러 곳을 묶은 리스트 글이면 그중 취향에 가장 맞는 한두 곳만, 각각 따로 항목으로.
- ★누리가 직접 보낸 글은 이름이 확인되면 반드시 넣는다.
- kind: 공간(카페·복합문화공간·도서관·책방·문구점 등)은 "place", 묵는 곳은 "stay".
- 디저트 위주 인스타 카페·웨이팅 맛집·쇼핑몰·종교 공간·일본/동남아/중동 숙소는 뺀다. 스테이폴리오는 한옥·북스테이·자연 속 독채·건축이 좋은 곳만.
- photo: 고른 항목마다 그 후보의 사진 파일을 **Read 로 열어 보고**, 그 장소를 찍은 진짜 사진(공간·건물·실내) 파일명. 리스트 글이면 그 장소가 찍힌 장. 글자 위주 카드·캡처·사람 얼굴 위주·다른 장소 사진뿐이면 "" (나중에 따로 찾는다).
- why: 누리에게 맞는 이유 한 줄, 40자 이내, 군더더기 없이 (예: "숲 보며 혼자 회고하는 3층 좌식 공간").
- detail: 무엇이 있는지 1~2줄 짧게 (예: "1층 문구 · 2층 카페 · 3층 좌식 리추얼").
- subtitle: "구 · 동네" 꼴 (예: "성동 · 서울숲", "강릉 · 독채", "코펜하겐 · 책방").
- 누리 취향에 잘 맞는 순서로 정렬. 애매하면 빼라 — 개수보다 결.

## 출력 (코드 블록 하나, JSON 배열만)
[{"cand":"c3","kind":"place","title":"정확한 이름","subtitle":"성동 · 서울숲","why":"…","detail":"…","tags":["복합문화공간","사색"],"korea":true,"region":"서울","price":"","photo":"c3_0.jpg"}]

## 후보
${candText}`;

  let raw = '';
  try { raw = await L.runClaude(prompt, 'opus', Math.max(3 * 60e3, left() - 3.5 * 60e3), WORK); }
  catch (e) { log('[taste] opus 실패, sonnet 으로 다시:', e.message); raw = await L.runClaude(prompt, 'sonnet', Math.max(2.5 * 60e3, left() - 2 * 60e3), WORK); }
  let picks = [];
  try { picks = L.parseJson(raw); } catch (e) { throw new Error('claude 결과 해석 실패: ' + raw.slice(0, 200)); }
  log('[taste] claude 고른 것', picks.length, '개');

  // 6) 카드 만들기 — 새 문서만, 공간 LIMIT · 숙소 STAYS 까지
  const byId = Object.fromEntries(list.map((c) => [c.id, c]));
  const batchDate = L.kstDate();
  const cap = { place: LIMIT, stay: STAYS };
  const docs = [];
  for (const p of picks) {
    const c = byId[p.cand];
    if (!c || !p.title || !cap[p.kind]) continue;
    if (docs.filter((d) => d.doc.kind === p.kind).length >= cap[p.kind]) continue;
    if (seenTitle.has(norm(p.title))) continue;
    const id = docId(p.kind, p.title);
    if ((await db.collection('tasteItems').doc(id).get()).exists) { seenTitle.add(norm(p.title)); continue; }
    seenTitle.add(norm(p.title));
    const doc = {
      kind: p.kind,
      title: String(p.title).trim(),
      subtitle: String(p.subtitle || '').trim(),
      why: String(p.why || '').trim().slice(0, 40),
      detail: String(p.detail || '').trim(),
      tags: Array.isArray(p.tags) ? p.tags.map(String).slice(0, 6) : [],
      src: { type: c.src, url: c.url, author: c.author || '', likes: c.likes || 0 },
      mapUrl: L.mapUrl(p.title, p.korea !== false),
      meta: { region: p.region || c.region || '', price: p.price || c.price || '' },
      batch: batchDate,
      addedAt: new Date().toISOString(),
    };
    const photo = p.photo && c.files.includes(path.basename(p.photo)) ? path.join(WORK, path.basename(p.photo)) : null;
    docs.push({ id, doc, photo, c, korea: p.korea !== false });
  }

  // 7) 사진 없는 카드 → 같은 글의 다른 사진 · 이름으로 인스타/네이버 검색
  const need = docs.filter((d) => !d.photo);
  if (need.length) {
    const got = await L.photoFill(need.map((d) => ({
      key: d.id, name: d.doc.title, kind: d.doc.kind,
      q: d.doc.title + (d.korea && d.doc.meta.region ? ' ' + d.doc.meta.region : ''),
      posts: ['x', 'threads', 'instagram'].includes(d.c.src) ? [d.c.url] : [],
    })), WORK, DEADLINE + 60e3);
    for (const d of need) if (got[d.id]) d.photo = got[d.id];
    log('[taste] 사진 채움', Object.keys(got).length, '/', need.length);
  }

  // 8) 쓰기 (status/statusAt 은 절대 안 씀) — 진짜 사진을 끝내 못 찾은 카드는 뺀다(지정 글은 사진 없어도 넣음)
  const written = [];
  let noPhoto = 0;
  for (const d of docs) {
    if (!d.photo && !d.c.force) { noPhoto++; log('  - 사진 없어 뺌:', d.doc.title); continue; }
    if (d.photo) d.doc.image = L.dataUrl(d.photo);
    written.push(d.doc);
    if (!DRY) await db.collection('tasteItems').doc(d.id).set(d.doc, { merge: true });
    log('  +', d.doc.kind, d.doc.title, '|', d.doc.subtitle, '|', d.doc.why, '|', d.doc.src.type, d.doc.image ? Math.round(d.doc.image.length * 0.75 / 1024) + 'KB' : '사진 없음');
  }
  if (!DRY) L.saveSeen(igSeen);

  const run = { at: new Date().toISOString(), batch: batchDate, written: written.length, dry: DRY, sources,
    candidates: list.length, droppedNoPhoto: noPhoto, minutes: +((Date.now() - T0) / 60000).toFixed(1) };
  if (igSkipped) run.skipped = igSkipped;
  if (!DRY) await db.collection('tasteRuns').doc(batchDate).set({ places: run }, { merge: true });
  log('[taste] 끝', JSON.stringify(run));
}

// 사진 없는 공간·숙소 카드에 사진만 채우기 (image 칸만 merge, status 는 안 건드림)
async function backfill(db, existing) {
  const todo = existing.filter((e) => (e.kind === 'place' || e.kind === 'stay') && !e.image);
  log('[taste] 사진 없는 카드', todo.length, '개');
  const got = await L.photoFill(todo.map((e) => ({
    key: e.id, name: e.title, kind: e.kind,
    q: e.title + (e.meta && e.meta.region && !String(e.title).includes(e.meta.region) ? ' ' + e.meta.region : ''),
    posts: e.src && ['x', 'threads', 'instagram'].includes(e.src.type) ? [e.src.url] : [],
  })), WORK, DEADLINE);
  for (const e of todo) {
    if (!got[e.id]) { log('  - 못 찾음:', e.title); continue; }
    const image = L.dataUrl(got[e.id]);
    if (!DRY) await db.collection('tasteItems').doc(e.id).set({ image }, { merge: true });
    log('  + 사진', e.title, Math.round(image.length * 0.75 / 1024) + 'KB');
  }
  log('[taste] backfill 끝', Object.keys(got).length, '/', todo.length);
}

main()
  .catch((e) => { log('[taste] 실패', (e && e.message) || e); process.exitCode = 1; })
  .finally(() => { try { fs.rmSync(WORK, { recursive: true, force: true }); } catch (e) {} setTimeout(() => process.exit(), 500); });
