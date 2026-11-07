#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════
//  Taste 수집기 → Firestore tasteItems (아이맥 월·목 07:30)
//
//  X · Threads · Instagram 에서 공간(카페·복합문화공간·도서관·책방)과 숙소(북스테이·독채) 글을 모으고,
//  스테이폴리오 목록도 훑은 뒤, 누리 취향 프로필로 `claude -p`(구독) 에게 걸러 달라고 해서
//  한 번에 10개쯤 새 카드를 쓴다. 사진은 원글 사진만(480px, 80KB 아래).
//
//  취향 프로필: ~/.config/atelier-taste/profile.md (chmod 600) — 저장소·로그에 절대 안 남김
//  브라우저: Aside (`aside repl`, 한 번 120초) · 인증: gcloud ADC, firebase-admin 은 ai-worker 것을 빌림
//  실행: launchd com.nuri.atelier-taste · 수동: node scripts/taste/collect.js [--dry] [--limit N]
// ═══════════════════════════════════════════════════════════

const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawn, execFileSync } = require('child_process');

const ARGS = process.argv.slice(2);
const DRY = ARGS.includes('--dry');
const LIMIT = Number((ARGS[ARGS.indexOf('--limit') + 1] || '').match(/^\d+$/) ? ARGS[ARGS.indexOf('--limit') + 1] : 10);
const HOME = os.homedir();
const PROFILE = path.join(HOME, '.config/atelier-taste/profile.md');
const PROJECT = 'the-atelier-99b8c';
const ASIDE = path.join(HOME, '.local/bin/aside');
const ASIDE_JS = fs.readFileSync(path.join(__dirname, 'aside-taste.js'), 'utf8');
const WORK = fs.mkdtempSync(path.join(os.tmpdir(), 'atelier-taste-'));
const T0 = Date.now();
const BUDGET_MS = 13 * 60 * 1000;                       // 전체 15분 안쪽

// 검색어 — 결이 맞는 글이 잘 걸리는 것 위주. 매번 전부 돌면 길어져서 회차마다 돌려 쓴다.
const X_QUERIES = ['복합문화공간', '북카페', '도서관 카페', '사색 공간', '혼자 가기 좋은 카페', '북스테이', '독채 스테이', '리추얼 공간', '책방 추천', '문구 카페', '서촌 공간', '성수 공간'];
const TH_QUERIES = ['서울 복합문화공간', '북카페 추천', '북스테이', '스테이폴리오', '혼자 기록하기 좋은 카페', '책방 추천', '연남 카페 공간'];
const IG_QUERIES = ['#북스테이', '#복합문화공간', '#독립서점', '#서울공간', '#북카페', '#스테이폴리오'];

function log(...a) { console.log(new Date().toISOString(), ...a); }
function left() { return BUDGET_MS - (Date.now() - T0); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function kstDate(d = new Date()) { return new Date(d.getTime() + 9 * 3600e3).toISOString().slice(0, 10); }
function norm(s) { return String(s || '').toLowerCase().normalize('NFC').replace(/[\s\p{P}\p{S}]/gu, ''); }
function docId(kind, title) { return crypto.createHash('sha1').update(kind + norm(title)).digest('hex').slice(0, 20); }
function pick(arr, n, seed) { const s = seed % arr.length; return [...arr.slice(s), ...arr.slice(0, s)].slice(0, n); }

// ── Aside 한 번 부르기 (셸을 거치지 않아 따옴표 걱정 없음)
function aside(job, timeoutMs = 125000) {
  return new Promise((resolve) => {
    const code = 'const JOB = ' + JSON.stringify(job) + ';\n' + ASIDE_JS;
    const child = spawn(ASIDE, ['repl', code], { cwd: HOME, env: process.env, stdio: ['ignore', 'pipe', 'pipe'] });
    let buf = '';
    child.stdout.on('data', (d) => { buf += d; });
    child.stderr.on('data', (d) => { buf += d; });
    const timer = setTimeout(() => child.kill('SIGKILL'), timeoutMs);
    child.on('close', () => {
      clearTimeout(timer);
      const line = buf.split('\n').reverse().find((l) => l.startsWith('TASTE_JSON '));
      if (!line) { log('  aside 결과 없음:', job.mode, job.q || '', buf.replace(/\s+/g, ' ').slice(-200)); return resolve([]); }
      try { resolve(JSON.parse(line.slice(11))); } catch (e) { resolve([]); }
    });
    child.on('error', () => { clearTimeout(timer); resolve([]); });
  });
}

// ── claude -p (ai-worker 와 같은 방식, 개인 구독). 사진 확인용으로 Read 만 허용, 작업 폴더 안에서만.
function runClaude(prompt, model, timeoutMs) {
  return new Promise((resolve, reject) => {
    const child = spawn('claude', ['-p', '--output-format', 'text', '--model', model, '--allowedTools', 'Read'], {
      cwd: WORK, env: process.env, stdio: ['pipe', 'pipe', 'pipe'],
    });
    let out = '', err = '';
    child.stdout.on('data', (d) => { out += d; });
    child.stderr.on('data', (d) => { err += d; });
    const timer = setTimeout(() => { child.kill('SIGKILL'); reject(new Error('claude 시간 초과')); }, timeoutMs);
    child.on('error', (e) => { clearTimeout(timer); reject(e); });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) return reject(new Error('claude 종료 코드 ' + code + ': ' + (err || out).trim().slice(0, 300)));
      resolve(out);
    });
    child.stdin.end(prompt);
  });
}

// ── 사진: 받아서 가로 480px JPEG 로 (macOS sips), 80KB 넘으면 화질을 낮춰 다시
async function fetchImage(url, file) {
  try {
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 20000);
    const r = await fetch(url, { signal: ctl.signal, headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36' } });
    clearTimeout(timer);
    if (!r.ok) return null;
    const raw = file + '.raw';
    fs.writeFileSync(raw, Buffer.from(await r.arrayBuffer()));
    for (const q of [70, 55, 40]) {
      execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', String(q), '--resampleWidth', '480', raw, '--out', file], { stdio: 'ignore' });
      if (fs.statSync(file).size < 80 * 1024) break;
    }
    fs.unlinkSync(raw);
    const w = Number((execFileSync('sips', ['-g', 'pixelWidth', file]).toString().match(/pixelWidth:\s*(\d+)/) || [])[1] || 0);
    if (w < 200) return null;
    return file;
  } catch (e) { return null; }
}

function mapUrl(title, korea) {
  return korea ? 'https://map.naver.com/p/search/' + encodeURIComponent(title)
    : 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(title);
}

// 프로필에서 공간·숙소 부분만 (책·여행 부분은 이 수집기와 무관)
function placeProfile() {
  const txt = fs.readFileSync(PROFILE, 'utf8');
  const m = txt.match(/##\s*1\.[\s\S]*?(?=\n##\s*2\.|$)/);
  return (m ? m[0] : txt.slice(0, 3000)) + '\n- 해외는 일본·동남아·중동 제외.\n';
}

async function main() {
  log('[taste] 시작', DRY ? '(dry)' : '', 'limit=' + LIMIT);
  if (!fs.existsSync(PROFILE)) throw new Error('취향 프로필 없음: ' + PROFILE);
  const profile = placeProfile();

  // 1) 이미 있는 카드 — 중복 거르기 + 좋아요/싫어요 예시
  let db = null, admin = null;
  const existing = [];
  admin = require(path.join(__dirname, '..', 'ai-worker', 'node_modules', 'firebase-admin'));
  admin.initializeApp({ credential: admin.credential.applicationDefault(), projectId: PROJECT });
  db = admin.firestore();
  const snap = await db.collection('tasteItems').get();
  snap.forEach((d) => existing.push(Object.assign({ id: d.id }, d.data())));
  const seenUrl = new Set(existing.map((e) => e.src && e.src.url).filter(Boolean));
  const seenTitle = new Set(existing.map((e) => norm(e.title)));
  const ex = (st) => existing.filter((e) => (e.kind === 'place' || e.kind === 'stay') && st.includes(e.status)).slice(-25)
    .map((e) => '- ' + e.title + (e.subtitle ? ' (' + e.subtitle + ')' : '') + (e.detail ? ': ' + e.detail : '')).join('\n') || '(아직 없음)';
  log('[taste] 기존 카드', existing.length, '개');

  // 2) 모으기
  const seed = Math.floor(Date.now() / 864e5);
  const since = new Date(Date.now() - 7 * 864e5).toISOString().slice(0, 10);
  const sources = {};
  const cands = {};
  const add = (list, tag) => {
    let n = 0;
    for (const c of list) {
      if (!c || !c.url || seenUrl.has(c.url) || cands[c.url]) continue;
      if (c.src !== 'stayfolio' && (c.text || '').length < 25) continue;
      cands[c.url] = c; n++;
    }
    sources[tag] = (sources[tag] || 0) + n;
  };

  for (const q of pick(X_QUERIES, 6, seed)) {
    if (left() < 9 * 60e3) break;
    add(await aside({ mode: 'x-search', q, since, scrolls: 3 }), 'x');
  }
  log('[taste] X 후보', sources.x || 0);

  for (const q of pick(TH_QUERIES, 4, seed)) {
    if (left() < 8 * 60e3) break;
    add(await aside({ mode: 'threads-search', q, scrolls: 3 }), 'threads');
    await sleep(2000);
  }
  log('[taste] Threads 후보', sources.threads || 0);

  let igSkipped = null;
  for (const q of pick(IG_QUERIES, 3, seed)) {
    if (left() < 7 * 60e3) break;
    const got = await aside({ mode: 'ig-search', q, max: 7, skip: [...seenUrl].filter((u) => /instagram/.test(u)) });
    if (!got.length && !sources.instagram) { igSkipped = 'instagram 결과 없음(로그인 확인 필요할 수 있음)'; }
    add(got, 'instagram');
  }
  if (sources.instagram) igSkipped = null;
  log('[taste] Instagram 후보', sources.instagram || 0, igSkipped || '');

  if (left() > 6 * 60e3) add(await aside({ mode: 'stayfolio', max: 40 }), 'stayfolio');
  log('[taste] Stayfolio 후보', sources.stayfolio || 0);

  // 3) 추리기: 장소 낌새가 있는 글만, 좋아요 순
  const PLACE_RX = /카페|공간|도서관|책방|서점|북스테이|스테이|숙소|독채|한옥|문구|갤러리|라운지|리추얼|사색|기록|층|cafe|library|book|stay|hotel/i;
  let pool = Object.values(cands).filter((c) => c.src === 'stayfolio' || PLACE_RX.test(c.text));
  // 소스마다 몫을 따로 — 인스타 좋아요 수가 커서 한 줄로 세우면 X·Threads 가 다 밀린다
  const top = (src, n) => pool.filter((c) => c.src === src).sort((a, b) => (b.likes || 0) - (a.likes || 0)).slice(0, n);
  const social = [...top('x', 12), ...top('threads', 12), ...top('instagram', 12)];
  const stays = pool.filter((c) => c.src === 'stayfolio').slice(0, 16);

  // 4) 상위 X·Threads 글은 원문(이어지는 칸·인용·답글)까지 읽기 — 이름이 본문 뒤쪽에 있는 경우가 많다
  const toRead = [...top('x', 7), ...top('threads', 7)];
  for (let i = 0; i < toRead.length && left() > 4.5 * 60e3; i += 7) {
    const got = await aside({ mode: 'read', urls: toRead.slice(i, i + 7).map((c) => c.url) });
    for (const r of got) {
      const c = cands[r.url]; if (!c) continue;
      if (r.text && r.text.length > (c.text || '').length) c.text = r.text;
      if (r.images && r.images.length) c.images = [...new Set([...(r.images || []), ...(c.images || [])])].slice(0, 4);
    }
  }
  const list = [...social, ...stays];
  log('[taste] 거르기 대상', list.length, '개 (소셜', social.length, '· 스테이', stays.length + ')');
  if (!list.length) { log('[taste] 후보 없음 — 끝'); return; }

  // 5) 사진 미리 받기 (후보마다 최대 2장) — claude 가 '진짜 사진'인지 보고 고른다
  await Promise.all(list.map(async (c, i) => {
    c.id = 'c' + i;
    c.files = [];
    for (const [j, u] of (c.images || []).slice(0, 3).entries()) {
      const f = await fetchImage(u, path.join(WORK, c.id + '_' + j + '.jpg'));
      if (f) c.files.push(path.basename(f));
    }
  }));

  // 6) claude -p 로 거르기
  const candText = list.map((c) => [
    '### ' + c.id + ' [' + c.src + '] ' + (c.author || '') + ' · 좋아요 ' + (c.likes || 0) + (c.at ? ' · ' + c.at.slice(0, 10) : ''),
    (c.text || '').slice(0, 1600),
    c.files.length ? '사진 파일: ' + c.files.join(', ') : '사진 없음',
  ].join('\n')).join('\n\n');

  const prompt = `너는 누리의 공간·숙소 큐레이터다. 아래 후보 글(X·Threads·Instagram 게시물, 스테이폴리오 목록)에서 누리 취향에 맞는 **실제 장소/숙소**를 최대 ${LIMIT + 6}개 골라 (공간 place 를 6~7할, 숙소 stay 는 3~4할) JSON 으로만 답해라.

## 누리 취향
${profile}

## 누리가 저장/다녀온 것 (이런 결을 더)
${ex(['saved', 'done', 'like'])}

## 누리가 '별로'라고 한 것 (이런 결은 빼기)
${ex(['nope'])}

## 이미 카드가 있는 이름 (다시 고르지 말 것)
${existing.filter((e) => e.kind === 'place' || e.kind === 'stay').map((e) => e.title).slice(-150).join(', ') || '(없음)'}

## 규칙
- 이름은 글(본문·인용·답글) 또는 사진 속 글자에 **분명히 적힌 것만**. 추측·지어내기 절대 금지. 이름이 없으면 그 글은 버린다.
- 본문에 이름이 없고 사진이 있으면 Read 로 사진 파일을 열어 간판·캡션 글자를 확인해도 된다(작업 폴더 안 파일만).
- 여러 곳을 묶은 리스트 글이면 그중 취향에 가장 맞는 한두 곳만, 각각 따로 항목으로.
- kind: 공간(카페·복합문화공간·도서관·책방·문구점 등)은 "place", 묵는 곳은 "stay".
- 디저트 위주 인스타 카페·웨이팅 맛집·쇼핑몰·종교 공간·일본/동남아/중동 숙소는 뺀다. 스테이폴리오는 한옥·북스테이·자연 속 독채·건축이 좋은 곳만, 3~4개 이내.
- photo: 고른 항목마다 그 후보의 사진 파일을 **반드시 Read 로 열어 보고**, 그 장소를 찍은 진짜 사진(공간·건물·실내) 파일명을 넣는다. 리스트 글이면 그 장소가 찍힌 장을 고른다. 글자 위주 표지 카드·캡처·사람 얼굴 위주·다른 장소 사진뿐이면 "".
- why: 누리에게 맞는 이유 한 줄, 40자 이내, 군더더기 없이 (예: "숲 보며 혼자 회고하는 3층 좌식 공간").
- detail: 무엇이 있는지 1~2줄 짧게 (예: "1층 문구 · 2층 카페 · 3층 좌식 리추얼").
- subtitle: "구 · 동네" 꼴 (예: "성동 · 서울숲", "강릉 · 독채", "코펜하겐 · 책방").
- 누리 취향에 잘 맞는 순서로 정렬. 애매하면 빼라 — 개수보다 결.

## 출력 (코드 블록 하나, JSON 배열만)
[{"cand":"c3","kind":"place","title":"정확한 이름","subtitle":"성동 · 서울숲","why":"…","detail":"…","tags":["복합문화공간","사색"],"korea":true,"region":"서울","price":"","photo":"c3_0.jpg"}]

## 후보
${candText}`;

  let raw = '';
  const tLeft = Math.max(3 * 60e3, left() - 60e3);
  try { raw = await runClaude(prompt, 'opus', tLeft); }
  catch (e) { log('[taste] opus 실패, sonnet 으로 다시:', e.message); raw = await runClaude(prompt, 'sonnet', Math.max(2.5 * 60e3, left() - 30e3)); }
  const m = raw.match(/```(?:json)?\s*\n([\s\S]*?)```/);
  let picks = [];
  try { picks = JSON.parse((m ? m[1] : raw.slice(raw.indexOf('['), raw.lastIndexOf(']') + 1)).trim()); }
  catch (e) { throw new Error('claude 결과 해석 실패: ' + raw.slice(0, 200)); }
  log('[taste] claude 고른 것', picks.length, '개');

  // 7) 카드 만들기 + 쓰기 (새 문서만, status/statusAt 은 절대 안 씀)
  const byId = Object.fromEntries(list.map((c) => [c.id, c]));
  const batchDate = kstDate();
  const written = [];
  // 장소 7할·숙소 4할까지 먼저 채우고, 모자라면 남은 것으로 메운다 (한쪽 쏠림 막기)
  const cap = { place: Math.ceil(LIMIT * 0.7), stay: Math.ceil(LIMIT * 0.4) };
  const ordered = [...picks.map((p) => [p, true]), ...picks.map((p) => [p, false])];
  for (const [p, capped] of ordered) {
    if (written.length >= LIMIT) break;
    if (capped && written.filter((d) => d.kind === p.kind).length >= (cap[p.kind] || 0)) continue;
    const c = byId[p.cand];
    if (!c || !p.title || !['place', 'stay'].includes(p.kind)) continue;
    if (seenTitle.has(norm(p.title))) continue;
    const id = docId(p.kind, p.title);
    const ref = db.collection('tasteItems').doc(id);
    if (!DRY && (await ref.get()).exists) { seenTitle.add(norm(p.title)); continue; }
    const doc = {
      kind: p.kind,
      title: String(p.title).trim(),
      subtitle: String(p.subtitle || '').trim(),
      why: String(p.why || '').trim().slice(0, 40),
      detail: String(p.detail || '').trim(),
      tags: Array.isArray(p.tags) ? p.tags.map(String).slice(0, 6) : [],
      src: { type: c.src, url: c.url, author: c.author || '', likes: c.likes || 0 },
      mapUrl: mapUrl(p.title, p.korea !== false),
      meta: { region: p.region || c.region || '', price: p.price || c.price || '' },
      batch: batchDate,
      addedAt: new Date().toISOString(),
    };
    const photo = p.photo && c.files.includes(path.basename(p.photo)) ? path.join(WORK, path.basename(p.photo)) : null;
    if (photo) doc.image = 'data:image/jpeg;base64,' + fs.readFileSync(photo).toString('base64');
    seenTitle.add(norm(p.title));
    written.push(doc);
    if (!DRY) await ref.set(doc, { merge: true });
    log('  +', doc.kind, doc.title, '|', doc.subtitle, '|', doc.why, '|', doc.src.type, doc.image ? Math.round(doc.image.length * 0.75 / 1024) + 'KB' : '사진 없음');
  }

  // 8) 실행 기록 (페이지·점검용, 한 장)
  const run = { at: new Date().toISOString(), batch: batchDate, written: written.length, dry: DRY,
    sources, candidates: list.length, minutes: +((Date.now() - T0) / 60000).toFixed(1) };
  if (igSkipped) run.skipped = igSkipped;
  if (!DRY) await db.collection('tasteRuns').doc(batchDate).set(run, { merge: true });
  log('[taste] 끝', JSON.stringify(run));
}

main()
  .catch((e) => { log('[taste] 실패', (e && e.message) || e); process.exitCode = 1; })
  .finally(() => { try { fs.rmSync(WORK, { recursive: true, force: true }); } catch (e) {} setTimeout(() => process.exit(), 500); });
