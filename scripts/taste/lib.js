// Taste 수집기 공통 — Aside 부르기, claude -p, 사진 줄이기, Firestore, 사진 채우기
// collect.js(공간·숙소)와 culture.js(전시·공연·영화)가 같이 쓴다.
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawn, execFileSync } = require('child_process');

const HOME = os.homedir();
const PROJECT = 'the-atelier-99b8c';
const PROFILE = path.join(HOME, '.config/atelier-taste/profile.md');
const ASIDE = path.join(HOME, '.local/bin/aside');
const ASIDE_JS = fs.readFileSync(path.join(__dirname, 'aside-taste.js'), 'utf8');
const SEEN_FILE = path.join(HOME, '.cache/atelier-taste/seen.json');

function log(...a) { console.log(new Date().toISOString(), ...a); }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
function kstDate(d = new Date()) { return new Date(d.getTime() + 9 * 3600e3).toISOString().slice(0, 10); }
function norm(s) { return String(s || '').toLowerCase().normalize('NFC').replace(/[\s\p{P}\p{S}]/gu, ''); }
function docId(kind, title) { return crypto.createHash('sha1').update(kind + norm(title)).digest('hex').slice(0, 20); }
function pick(arr, n, seed) { const s = seed % arr.length; return [...arr.slice(s), ...arr.slice(0, s)].slice(0, n); }
function mapUrl(name, korea) {
  return korea ? 'https://map.naver.com/p/search/' + encodeURIComponent(name)
    : 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(name);
}

// 프로필의 한 섹션만 (## 1. / ## 4. …) — 파일 내용은 claude 입력에만 쓰고 로그엔 안 찍는다
function profileSection(n) {
  const txt = fs.readFileSync(PROFILE, 'utf8');
  const m = txt.match(new RegExp('##\\s*' + n + '\\.[\\s\\S]*?(?=\\n##\\s*\\d+\\.|$)'));
  return m ? m[0] : '';
}

// 큐레이터 게시물 중 이미 본 것 (아이맥 로컬)
function loadSeen() { try { return JSON.parse(fs.readFileSync(SEEN_FILE, 'utf8')); } catch (e) { return {}; } }
function saveSeen(seen) {
  const cut = Date.now() - 120 * 864e5;                       // 넉 달 지난 건 잊는다
  for (const [k, v] of Object.entries(seen)) if (Date.parse(v) < cut) delete seen[k];
  fs.mkdirSync(path.dirname(SEEN_FILE), { recursive: true });
  fs.writeFileSync(SEEN_FILE, JSON.stringify(seen));
}

// Aside 한 번 (셸을 거치지 않아 따옴표 걱정 없음, 120초 제한)
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
      try {
        const arr = JSON.parse(line.slice(11));
        for (const d of arr.filter((x) => x && x.debug)) log('  aside 진단:', JSON.stringify(d));
        resolve(arr.filter((x) => !(x && x.debug)));
      } catch (e) { log('  aside 결과 해석 실패:', job.mode, line.length + '자', e.message.slice(0, 80)); resolve([]); }
    });
    child.on('error', () => { clearTimeout(timer); resolve([]); });
  });
}

// claude -p (ai-worker 와 같은 방식, 개인 구독). 사진 확인용으로 Read 만 허용, 작업 폴더 안에서.
function runClaude(prompt, model, timeoutMs, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn('claude', ['-p', '--output-format', 'text', '--model', model, '--allowedTools', 'Read'], {
      cwd, env: process.env, stdio: ['pipe', 'pipe', 'pipe'],
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
function parseJson(raw) {
  const m = raw.match(/```(?:json)?\s*\n([\s\S]*?)```/);
  let s = m ? m[1] : raw;
  const a = Math.min(...['[', '{'].map((c) => (s.indexOf(c) < 0 ? 1e9 : s.indexOf(c))));
  const b = Math.max(s.lastIndexOf(']'), s.lastIndexOf('}'));
  return JSON.parse(s.slice(a, b + 1).trim());
}

// 사진: 받아서 가로 480px JPEG (macOS sips), 80KB 넘으면 화질을 낮춰 다시. 너무 작으면 버림
async function fetchImage(url, file) {
  try {
    if (!/^https?:/.test(url)) return null;
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), 20000);
    const r = await fetch(url, { signal: ctl.signal, headers: { 'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36', Referer: new URL(url).origin + '/' } });
    clearTimeout(timer);
    if (!r.ok) return null;
    const raw = file + '.raw';
    fs.writeFileSync(raw, Buffer.from(await r.arrayBuffer()));
    const w0 = Number((execFileSync('sips', ['-g', 'pixelWidth', raw]).toString().match(/pixelWidth:\s*(\d+)/) || [])[1] || 0);
    if (w0 < 200) { fs.unlinkSync(raw); return null; }
    for (const q of [70, 55, 40]) {
      const args = ['-s', 'format', 'jpeg', '-s', 'formatOptions', String(q)];
      if (w0 > 480) args.push('--resampleWidth', '480');
      execFileSync('sips', [...args, raw, '--out', file], { stdio: 'ignore' });
      if (fs.statSync(file).size < 80 * 1024) break;
    }
    fs.unlinkSync(raw);
    return file;
  } catch (e) { return null; }
}
// 위키백과 대표 사진 (REST 요약 API, 브라우저 아님)
async function wikiLead(title, lang = 'en') {
  try {
    const r = await fetch('https://' + lang + '.wikipedia.org/api/rest_v1/page/summary/' + encodeURIComponent(title.replace(/ /g, '_')), { headers: { 'User-Agent': 'atelier-taste/1.0 (personal)' } });
    if (!r.ok) return '';
    const j = await r.json();
    const u = (j.originalimage && j.originalimage.source) || (j.thumbnail && j.thumbnail.source) || '';
    if (!u || /\.svg/i.test(u)) return '';
    if (/\/thumb\//.test(u)) return u.replace(/\/\d+px-/, '/1280px-').split('?')[0];
    // 너무 큰 원본은 1000px 썸네일로
    return u.replace(/\/commons\/(?!thumb\/)([0-9a-f])\/([0-9a-f]{2})\/([^/]+)$/, (m, a, b, f) => '/commons/thumb/' + a + '/' + b + '/' + f + '/1000px-' + f);
  } catch (e) { return ''; }
}
function dataUrl(file) { return 'data:image/jpeg;base64,' + fs.readFileSync(file).toString('base64'); }

function initDb() {
  const admin = require(path.join(__dirname, '..', 'ai-worker', 'node_modules', 'firebase-admin'));
  if (!admin.apps.length) admin.initializeApp({ credential: admin.credential.applicationDefault(), projectId: PROJECT });
  return admin.firestore();
}

// ── 사진 채우기: 카드에 쓸 진짜 사진이 없을 때
//   items: [{key, name, kind, q, ig, files:[이미 받은 파일명…], posts:[원글 주소…]}]
//   (a) 원글(캐러셀·타래)의 다른 사진  (b) 이름으로 인스타 검색 첫 게시물 사진  (c) 네이버 검색의 플레이스/포스터 사진
//   → claude 가 Read 로 보고 '그 장소를 찍은 진짜 사진/공식 포스터'만 고른다. 없으면 "".
async function photoFill(items, work, deadline) {
  if (!items.length) return {};
  const left = () => deadline - Date.now();
  // (a) 원글 다시 읽기 — 인스타 격자는 첫 장만 있어서 캐러셀을 연다
  const posts = [...new Set(items.flatMap((it) => it.posts || []))];
  const postImgs = {};
  for (let i = 0; i < posts.length && left() > 150e3; i += 6) {
    for (const r of await aside({ mode: 'read', urls: posts.slice(i, i + 6) })) postImgs[r.url] = r.images || [];
  }
  // (b)(c) 이름으로 찾기 — 한 번에 4곳씩
  const found = {};
  const searchable = items.filter((it) => it.search !== false);
  for (let i = 0; i < searchable.length && left() > 100e3; i += 4) {
    const batch = searchable.slice(i, i + 4).map((it) => ({ key: it.key, q: it.q || it.name, ig: it.ig !== false }));
    for (const r of await aside({ mode: 'photo-search', items: batch })) found[r.key] = r.images || [];
  }
  await Promise.all(items.map(async (it) => {
    it.files = it.files || [];
    const urls = [...new Set([...(it.extra || []), ...(it.posts || []).flatMap((u) => postImgs[u] || []), ...(found[it.key] || [])])].slice(0, 8);
    for (const [j, u] of urls.entries()) {
      const f = await fetchImage(u, path.join(work, it.key + '_f' + j + '.jpg'));
      if (f) it.files.push(path.basename(f));
    }
  }));
  const withFiles = items.filter((it) => it.files.length);
  const out = {};
  // 10개씩 나눠 확인 (한 번에 사진 수십 장을 Read 하면 오래 걸린다)
  for (let i = 0; i < withFiles.length && left() > 60e3; i += 10) {
    const chunk = withFiles.slice(i, i + 10);
    const prompt = `아래 항목마다 사진 파일 후보가 있다. 파일을 **하나씩 Read 로 열어 보고**, 각 항목에 쓸 사진 한 장을 골라라.
- 공간·숙소(place/stay): 그 장소를 찍은 진짜 사진(건물·실내·풍경). 글자 위주 카드·캡처·지도·로고·사람 얼굴 위주·다른 장소 사진은 안 됨.
- 전시·공연(exhibition/performance): 공식 포스터나 전시장·공연 사진. 미술관·공연장 자체(상설)면 건물·내부 대표 사진. 영화(film): 공식 포스터나 스틸컷.
- 책(book): 그 책의 표지. 도시(city): 그 도시를 대표하는 풍경·거리 사진(지도·국기·문장 X).
- 확실히 그 항목이라고 볼 수 있는 게 없으면 "".
출력은 코드 블록 하나, JSON 객체만: {"키":"파일명 또는 빈 문자열", …}

${chunk.map((it) => `- 키 ${it.key} · ${it.kind} · ${it.name}: ${it.files.slice(0, 6).join(', ')}`).join('\n')}`;
    try {
      const raw = await runClaude(prompt, 'sonnet', Math.max(60e3, Math.min(left() - 20e3, 5 * 60e3)), work);
      const res = parseJson(raw);
      for (const it of chunk) {
        const f = res[it.key];
        if (f && it.files.includes(path.basename(f))) out[it.key] = path.join(work, path.basename(f));
      }
    } catch (e) { log('  사진 고르기 실패:', e.message); }
  }
  return out;
}

module.exports = { HOME, PROFILE, log, sleep, kstDate, norm, docId, pick, mapUrl, profileSection, loadSeen, saveSeen,
  aside, runClaude, parseJson, fetchImage, dataUrl, initDb, photoFill, wikiLead };
