#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════
//  Atelier AI 워커 — 사이트의 「구독으로 만들기」 대기열을 아이맥이 처리
//
//  사이트가 Firestore `aiJobs` 에 { kind:'study'|'annie', status:'queued', ... } 를 쓰면
//  여기서 집어 와서 Claude 구독(`claude -p`)으로 만들고 결과를 저장한다.
//    study → englishStudy/<docId>  (mode: deep=깊게 공부 · quick=보기 전 5분 → .quick · translate=전체 해석 → .translation · explain=하이라이트 풀이 → .marks.<key> · check=직접 해석 검수 → .practice.paras.<pi>)
//    annie → englishSessions/<date>  (수업 트래커 'N회차' 는 사이트가 완료를 보고 만든다)
//  API 요금 없음. 프롬프트는 사이트 원본(js/*.js)에서 매번 그대로 꺼낸다 — 사본 없음.
//
//  인증: 아이맥 gcloud 애플리케이션 기본 인증(ADC). 새 키 파일 없음.
//  실행: launchd com.nuri.atelier-ai-worker (KeepAlive) — install.sh 참고
//  한 번만 처리하고 끝내기: node worker.js --once
// ═══════════════════════════════════════════════════════════

const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const { spawn } = require('child_process');
const admin = require('firebase-admin');

const PROJECT = 'the-atelier-99b8c';
const REPO = path.resolve(__dirname, '..', '..');
const POLL_MS = 10 * 1000;
const CLAUDE_TIMEOUT_MS = 15 * 60 * 1000;   // 긴 인터뷰 Opus 정리 대비
const STALE_RUNNING_MS = 30 * 60 * 1000;    // 이보다 오래 running 이면 죽은 걸로 본다
const DEFAULT_MODEL = process.env.ATELIER_AI_MODEL || 'opus';
const ONCE = process.argv.includes('--once');
const crypto = require('crypto');
function selfHash() { try { return crypto.createHash('md5').update(fs.readFileSync(__filename)).digest('hex'); } catch (e) { return ''; } }
const BOOT_HASH = selfHash();   // pull 로 worker.js 가 바뀌면 작업을 대기열로 돌려놓고 재시작(KeepAlive)

admin.initializeApp({ credential: admin.credential.applicationDefault(), projectId: PROJECT });
const db = admin.firestore();

function log(...a) { console.log(new Date().toISOString(), ...a); }

// Firestore 연결이 조용히 죽으면 await 가 영영 안 끝난다 → 시간 제한
function withTimeout(p, ms, what) {
  return Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(what + ' 시간 초과(' + ms / 1000 + '초)')), ms))]);
}

// 사이트 원본 파일에서 `var NAME = \`...\`;` 템플릿을 그대로 꺼낸다
function readTemplate(file, name) {
  const src = fs.readFileSync(path.join(REPO, file), 'utf8');
  const head = 'var ' + name + ' = `';
  const i = src.indexOf(head);
  if (i < 0) throw new Error(name + ' 를 ' + file + ' 에서 못 찾음');
  let k = i + head.length;
  const start = k;
  while (k < src.length) {
    if (src[k] === '\\') { k += 2; continue; }
    if (src[k] === '`') break;
    k++;
  }
  return vm.runInNewContext('`' + src.slice(start, k) + '`');
}

function buildPrompt(job) {
  if (job.kind === 'study') {
    return readTemplate('js/english-study.js', job.mode === 'quick' ? 'QUICK_PROMPT_TEMPLATE' : 'STUDY_PROMPT_TEMPLATE')
      .replaceAll('{{ID}}', job.docId)
      .replaceAll('{{TITLE}}', job.title || '(제목 미입력)')
      .replaceAll('{{SOURCE}}', job.source || '(출처 미입력)')
      .replaceAll('{{DATE}}', job.date)
      .replaceAll('{{TRANSCRIPT}}', job.transcript);
  }
  if (job.kind === 'annie') {
    return readTemplate('js/app-1-pages.js', 'REVIEW_PROMPT_TEMPLATE')
      .replaceAll('{{DATE}}', job.date)
      .replaceAll('{{TRANSCRIPT}}', job.transcript);
  }
  throw new Error('모르는 kind: ' + job.kind);
}

// 아이맥 자동 pull 목록에 아뜰리에가 없어서, 작업 직전에 최신 프롬프트를 받아 둔다 (실패해도 진행)
function pullRepo() {
  return new Promise(resolve => {
    const child = spawn('git', ['-C', REPO, 'pull', '-q', '--ff-only'], { stdio: 'ignore' });
    const timer = setTimeout(() => { child.kill('SIGKILL'); resolve(); }, 60000);
    child.on('close', () => { clearTimeout(timer); resolve(); });
    child.on('error', () => { clearTimeout(timer); resolve(); });
  });
}

function runClaude(prompt, model) {
  return new Promise((resolve, reject) => {
    const child = spawn('claude', ['-p', '--output-format', 'text', '--model', model], {
      cwd: os.tmpdir(),
      env: process.env,                      // 개인 계정(~/.claude) 구독
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    let out = '', err = '';
    child.stdout.on('data', d => { out += d; });
    child.stderr.on('data', d => { err += d; });
    const timer = setTimeout(() => { child.kill('SIGKILL'); reject(new Error('Claude 시간 초과(' + CLAUDE_TIMEOUT_MS / 60000 + '분)')); }, CLAUDE_TIMEOUT_MS);
    child.on('error', e => { clearTimeout(timer); reject(e); });
    child.on('close', code => {
      clearTimeout(timer);
      if (code !== 0) return reject(new Error('claude 종료 코드 ' + code + ': ' + (err || out).trim().slice(0, 400)));
      resolve(out);
    });
    child.stdin.end(prompt);
  });
}

// 사이트와 같은 해석: 코드 블록 → `xxxData["..."] = {...}` 실행 → 첫 값
function parseResult(text) {
  let cleaned = String(text).trim();
  const cb = cleaned.match(/```(?:js|javascript|json)?\s*\n([\s\S]*?)```/);
  if (cb) cleaned = cb[1].trim();
  else cleaned = cleaned.replace(/^```(?:js|json|javascript)?\s*\n?/gm, '').replace(/\n?```\s*$/gm, '').trim();
  const ctx = { studyData: {}, sessionsData: {} };
  try {
    vm.runInNewContext(cleaned, ctx, { timeout: 2000 });
  } catch (e) {
    // JSON 꼴로 왔을 때 대비
    const json = cleaned.replace(/^(?:const|let|var)?\s*(?:studyData|sessionsData)\s*\[\s*["'][^"']*["']\s*\]\s*=\s*/m, '').replace(/;\s*$/, '');
    try { return JSON.parse(json); } catch (e2) { return null; }
  }
  for (const bag of [ctx.studyData, ctx.sessionsData]) {
    const k = Object.keys(bag)[0];
    if (k) return JSON.parse(JSON.stringify(bag[k]));   // vm 바깥 평범한 객체로
  }
  return null;
}

// 전체 해석: 문장 단위로 ~110단어 문단을 만들고, 25문단씩 나눠 동시에 번역
function splitParas(text) {
  const sents = String(text).replace(/\s+/g, ' ').trim().split(/(?<=[.!?…])\s+(?=["“'A-Z0-9(])/);
  const paras = []; let cur = [];
  let n = 0;
  for (const st of sents) {
    cur.push(st); n += st.split(' ').length;
    if (n >= 110) { paras.push(cur.join(' ')); cur = []; n = 0; }
  }
  if (cur.length) paras.push(cur.join(' '));
  return paras;
}
async function translateJob(job) {
  const paras = splitParas(job.transcript);
  const tpl = readTemplate('js/english-study.js', 'TRANSLATE_PROMPT_TEMPLATE');
  const groups = [];
  for (let i = 0; i < paras.length; i += 25) groups.push(paras.slice(i, i + 25));
  const out = new Array(groups.length);
  let next = 0;
  async function lane() {
    while (next < groups.length) {
      const gi = next++; const g = groups[gi];
      const prompt = tpl.replaceAll('{{COUNT}}', String(g.length)).replaceAll('{{PARAS}}', g.map((p, i) => '[' + (i + 1) + '] ' + p).join('\n\n'));
      const raw = await runClaude(prompt, job.model || DEFAULT_MODEL);
      const m = String(raw).match(/\[\s*"[\s\S]*\]/);   // 앞에 붙는 안내 줄(예: [F&F Policy Active])은 건너뜀
      let arr = [];
      try { arr = JSON.parse(m ? m[0] : '[]'); } catch (e) { throw new Error('해석 ' + (gi + 1) + '번째 묶음 형식 오류'); }
      out[gi] = g.map((en, i) => ({ en, ko: String(arr[i] || '') }));
      log('[translate]', job.id, (gi + 1) + '/' + groups.length);
    }
  }
  await Promise.all([lane(), lane(), lane()]);
  return { paras: [].concat(...out), madeAt: new Date().toISOString() };
}

async function saveResult(job, parsed) {
  if (job.kind === 'study' && job.mode === 'check') {
    const say = (parsed.say || []).map(x => ({ en: String(x.en || ''), ko: String(x.ko || '') })).filter(x => x.en);
    await db.collection('englishStudy').doc(job.docId).set({ practice: { paras: { [job.pi]: { check: parsed, says: say, st: 'checked', checkedAt: new Date().toISOString() } } } }, { merge: true });
    return job.docId;
  }
  if (job.kind === 'study' && job.mode === 'explain') {
    await db.collection('englishStudy').doc(job.docId).set({ marks: { [job.markKey]: Object.assign(parsed, { status: 'done', doneAt: new Date().toISOString() }) } }, { merge: true });
    return job.docId;
  }
  if (job.kind === 'study' && (job.mode === 'quick' || job.mode === 'translate')) {
    const ref = db.collection('englishStudy').doc(job.docId);
    const upd = { updatedAt: new Date().toISOString() };
    if (job.mode === 'quick') {
      upd.quick = parsed;
      const cur = await ref.get();
      if (!(cur.exists && cur.get('title')) && parsed.title) upd.title = parsed.title;
      if (!(cur.exists && cur.get('subtitle')) && parsed.subtitle) upd.subtitle = parsed.subtitle;
    } else upd.translation = parsed;
    if (job.date) upd.date = job.date;
    await ref.set(upd, { merge: true });
    return job.docId;
  }
  parsed.updatedAt = new Date().toISOString();
  parsed.madeBy = 'subscription';
  if (job.kind === 'study') {
    if (job.title && !parsed.title) parsed.title = job.title;
    if (job.source && !parsed.source) parsed.source = job.source;
    if (!parsed.date) parsed.date = job.date;
    await db.collection('englishStudy').doc(job.docId).set(parsed, { merge: true });
    return job.docId;
  }
  if (job.title && !parsed.title) parsed.title = job.title;
  await db.collection('englishSessions').doc(job.date).set(parsed, { merge: true });
  return job.date;
}

function validJob(job) {
  if (!job.transcript || !String(job.transcript).trim()) return '스크립트가 비어 있어요';
  if (!/^\d{4}-\d{2}-\d{2}$/.test(job.date || '')) return '날짜 형식이 이상해요: ' + job.date;
  if (job.kind === 'study' && !/^[\w-]+$/.test(job.docId || '')) return 'docId 가 없어요';
  if (job.mode === 'explain' && !/^\w+$/.test(job.markKey || '')) return 'markKey 가 없어요';
  if (job.mode === 'check' && !(Number.isInteger(job.pi) && job.pi >= 0)) return '문단 번호가 없어요';
  if (job.kind !== 'study' && job.kind !== 'annie') return '모르는 종류: ' + job.kind;
  return '';
}

// 대기 중 하나를 '내가 맡음'으로 바꿔서 가져온다 (트랜잭션 — 두 워커가 같은 걸 잡지 않게)
async function claimNext() {
  const snap = await db.collection('aiJobs').where('status', '==', 'queued').get();
  if (snap.empty) return null;
  // 하이라이트 풀이(explain)는 짧고 누리가 화면 앞에서 기다리는 중 → 먼저
  const pri = d => (d.get('mode') === 'explain' || d.get('mode') === 'check' ? 0 : 1);
  const docs = snap.docs.sort((a, b) => pri(a) - pri(b) || String(a.get('createdAt')).localeCompare(String(b.get('createdAt'))));
  for (const d of docs) {
    const ok = await db.runTransaction(async t => {
      const cur = await t.get(d.ref);
      if (cur.get('status') !== 'queued') return false;
      t.update(d.ref, { status: 'running', startedAt: new Date().toISOString(), worker: os.hostname() });
      return true;
    });
    if (ok) return { ...d.data(), ref: d.ref, id: d.id };
  }
  return null;
}

async function failStale() {
  const snap = await db.collection('aiJobs').where('status', '==', 'running').get();
  const now = Date.now();
  for (const d of snap.docs) {
    const t = Date.parse(d.get('startedAt') || 0);
    if (t && now - t > STALE_RUNNING_MS) {
      await d.ref.update({ status: 'error', error: '처리 중 멈춤(30분 넘김) — 다시 시도해주세요', finishedAt: new Date().toISOString() });
      log('[stale]', d.id);
    }
  }
}

async function processJob(job) {
  const t0 = Date.now();
  const bad = validJob(job);
  if (bad) { await job.ref.update({ status: 'error', error: bad, finishedAt: new Date().toISOString() }); return; }
  log('[start]', job.id, job.kind, job.date, (job.transcript || '').length + '자');
  let raw = '';
  try {
    const quick = job.mode === 'check' || job.mode === 'explain';   // 누리가 화면 앞에서 기다리는 짧은 작업
    if (!quick) await pullRepo();                                  // 짧은 작업은 끝난 뒤에 받아 둔다(아래 finally)
    if (selfHash() !== BOOT_HASH) {           // 새 워커 코드가 내려옴 → 이 작업은 새 코드가 하게
      await job.ref.update({ status: 'queued', startedAt: admin.firestore.FieldValue.delete() });
      log('[worker] 코드가 바뀜 — 재시작'); process.exit(0);
    }
    let parsed;
    if (job.mode === 'translate') parsed = await translateJob(job);
    else if (job.mode === 'explain') {
      const prompt = readTemplate('js/english-study.js', 'EXPLAIN_PROMPT_TEMPLATE').replaceAll('{{PHRASE}}', String(job.phrase || '')).replaceAll('{{CONTEXT}}', String(job.transcript));
      raw = await runClaude(prompt, job.model || 'sonnet');
      const m = String(raw).match(/\{[\s\S]*\}/);
      try { parsed = JSON.parse(m ? m[0] : ''); } catch (e) { parsed = null; }
    }
    else if (job.mode === 'check') {
      const unk = (job.unk || []).map(u => u.w + ' | ' + (u.guess || '(추측 없음)')).join('\n') || '(none)';
      const prompt = readTemplate('js/english-study.js', 'CHECK_PROMPT_TEMPLATE').replaceAll('{{EN}}', String(job.transcript)).replaceAll('{{KO}}', String(job.refKo || '')).replaceAll('{{MINE}}', String(job.mine || '')).replaceAll('{{UNK}}', unk);
      raw = await runClaude(prompt, job.model || 'sonnet');
      const m = String(raw).match(/\{[\s\S]*\}/);
      try { parsed = JSON.parse(m ? m[0] : ''); } catch (e) { parsed = null; }
    }
    else { raw = await runClaude(buildPrompt(job), job.model || DEFAULT_MODEL); parsed = parseResult(raw); }
    if (!parsed) throw new Error('Claude 응답 형식이 예상과 달라요');
    const resultId = await withTimeout(saveResult(job, parsed), 60000, '결과 저장');
    await withTimeout(job.ref.update({
      status: 'done', resultId, finishedAt: new Date().toISOString(), ms: Date.now() - t0,
      transcript: admin.firestore.FieldValue.delete(),   // 원문은 결과에 반영됐으니 대기열엔 안 남김
    }), 60000, '완료 표시');
    log('[done]', job.id, '→', resultId, Math.round((Date.now() - t0) / 1000) + 's');
  } catch (e) {
    log('[error]', job.id, e.message);
    await job.ref.update({ status: 'error', error: e.message.slice(0, 500), raw: raw.slice(0, 20000), finishedAt: new Date().toISOString() }).catch(() => {});
  }
  if (job.mode === 'check' || job.mode === 'explain') pullRepo();   // 다음 작업용 최신 프롬프트 (기다리지 않음)
}

async function tick() {
  await withTimeout(failStale(), 60000, '멈춘 작업 확인');
  for (;;) {
    const job = await withTimeout(claimNext(), 60000, '대기열 확인');
    if (!job) return;
    await processJob(job);
  }
}

// 새 요청이 대기열에 들어오는 순간 바로 깨운다 (10초 확인은 연결이 끊겼을 때를 위한 안전망)
let wake = null;
function sleep(ms) { return new Promise(r => { const t = setTimeout(r, ms); wake = () => { clearTimeout(t); r(); }; }); }
function watchQueue() {
  db.collection('aiJobs').where('status', '==', 'queued').onSnapshot(
    snap => { if (!snap.empty && wake) { const w = wake; wake = null; w(); } },
    e => { log('[watch 끊김]', e.message); setTimeout(watchQueue, 30000); });
}

(async function main() {
  log('[worker] 시작', os.hostname(), 'repo=' + REPO, 'model=' + DEFAULT_MODEL);
  if (!ONCE) watchQueue();
  let failStreak = 0;
  for (;;) {
    try {
      await tick();
      failStreak = 0;
    } catch (e) {
      log('[tick 실패]', e.message);
      if (++failStreak >= 3) { log('[worker] 연속 실패 — 새 연결로 다시 시작'); process.exit(1); }  // KeepAlive 가 다시 띄움
    }
    if (ONCE) process.exit(0);
    await sleep(POLL_MS);
  }
})();
