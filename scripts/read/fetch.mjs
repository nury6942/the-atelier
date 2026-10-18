#!/usr/bin/env node
// Read 탭 콘텐츠 파이프라인.
//  - The Conversation: 본문 전체(CC BY-ND 4.0, 수정 없이 + 출처 + 링크) + 학습팩(claude -p)
//  - BBC Future · Guardian Long Read · BoF: 제목·주소·날짜만 (본문/요약 저장 금지)
// 쓰는 법:  node scripts/read/fetch.mjs [--date YYYY-MM-DD] [--count N] [--no-pack] [--ielts-only]
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const DATA = path.join(ROOT, 'data/read');
const INDEX = path.join(DATA, 'index.json');
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130 Safari/537.36';
const ATTRIBUTION = 'This article is republished from The Conversation under a Creative Commons license. Read the original article.';

// ---------- args ----------
const argv = process.argv.slice(2);
const arg = (k, d) => { const i = argv.indexOf(k); return i >= 0 ? argv[i + 1] : d; };
const today = new Date(Date.now() + 9 * 3600e3).toISOString().slice(0, 10); // KST
const DATE = arg('--date', today);
const COUNT = Number(arg('--count', 2));
const NO_PACK = argv.includes('--no-pack');       // 학습팩·IELTS 둘 다 건너뜀
const IELTS_ONLY = argv.includes('--ielts-only'); // 기존 글에 IELTS 세트만 채움
const WINDOW_DAYS = 30;
if (!/^\d{4}-\d{2}-\d{2}$/.test(DATE)) throw new Error('--date YYYY-MM-DD');

const t0 = Date.now();
const log = (...a) => console.log(`[read ${((Date.now() - t0) / 1000).toFixed(1)}s]`, ...a);

// ---------- feeds ----------
// 우선순위(w)가 높을수록 먼저 고른다. topic = UI 표시용 한국어 분류.
const CONV_FEEDS = [
  { slug: 'fashion-1850', topic: '패션', w: 10 },
  { slug: 'fast-fashion-106968', topic: '패션', w: 10 },
  { slug: 'textiles-7253', topic: '패션', w: 9 },
  { slug: 'design-871', topic: '디자인', w: 8 },
  { slug: 'consumers-632', topic: '경제', w: 7 },
  { slug: 'business-34339', topic: '경제', w: 6 },
  { slug: 'sustainability-300', topic: '환경', w: 7 },
  { slug: 'environment-3387', topic: '환경', w: 6 },
  { slug: 'work-401', topic: '일', w: 7 },
  { slug: 'careers-7088', topic: '일', w: 7 },
  { slug: 'culture-1909', topic: '문화', w: 6 },
  { slug: 'science-1256', topic: '과학', w: 6 },
].map((f) => ({ ...f, url: `https://theconversation.com/topics/${f.slug}/articles.atom` }));
CONV_FEEDS.push(
  { url: 'https://theconversation.com/global/articles.atom', topic: null, w: 2 },
  { url: 'https://theconversation.com/uk/articles.atom', topic: null, w: 2 },
);

async function get(url) {
  const r = await fetch(url, { headers: { 'user-agent': UA, accept: '*/*' }, redirect: 'follow' });
  if (!r.ok) throw new Error(`${r.status} ${url}`);
  return r.text();
}

// ---------- html helpers ----------
const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', hellip: '…', mdash: '—', ndash: '–', rsquo: '’', lsquo: '‘', rdquo: '”', ldquo: '“', eacute: 'é', egrave: 'è', aacute: 'á', oacute: 'ó', uuml: 'ü', ouml: 'ö', auml: 'ä', ccedil: 'ç', ntilde: 'ñ', iacute: 'í', uacute: 'ú', pound: '£', euro: '€', deg: '°', times: '×', shy: '' };
const decode = (s) => s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
  if (e[0] === '#') return String.fromCodePoint(e[1].toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
  return ENT[e.toLowerCase()] ?? m;
});
const stripTags = (s) => decode(s.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim();
const tag = (xml, name) => { const m = xml.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`)); return m ? m[1] : ''; };

// Conversation 피드 content(HTML) → 본문 문단 배열. 문장은 그대로, 군더더기만 뺀다.
function contentToParas(html) {
  let h = html
    .replace(/<figure[\s\S]*?<\/figure>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<img[^>]*>/gi, '')
    .replace(/<p class="fine-print"[\s\S]*?<\/p>/gi, '')
    .replace(/<blockquote class="(twitter|instagram|tiktok)[\s\S]*?<\/blockquote>/gi, '');
  const blocks = [];
  const re = /<(p|h2|h3|li)\b[^>]*>([\s\S]*?)<\/\1>|<hr\b[^>]*>/gi;
  let m;
  while ((m = re.exec(h))) blocks.push({ t: (m[1] || 'hr').toLowerCase(), raw: m[2] || '' });
  const out = [];
  let skipList = false, afterHr = false;
  for (const b of blocks) {
    if (b.t === 'hr') { afterHr = true; continue; }
    const text = stripTags(b.raw);
    if (!text) continue;
    if (/^read more\b/i.test(text)) { skipList = /:\s*$/.test(text); continue; }   // "Read more:" 박스
    if (b.t === 'li' && skipList) continue;
    skipList = false;
    if (afterHr && /^\s*<(em|i)>[\s\S]*<\/\1>\s*$/i.test(b.raw.trim())) continue;     // 끝의 기울임 안내문
    if (/^(this article is republished|the conversation (uk|us|australia)? ?receives funding)/i.test(text)) continue;
    out.push(text);
  }
  return out;
}

const wordCount = (paras) => paras.join(' ').split(/\s+/).filter((w) => /[A-Za-z0-9]/.test(w)).length;
const isEnglish = (paras) => {
  const w = paras.join(' ').toLowerCase().split(/\s+/);
  const hits = w.filter((x) => ['the', 'and', 'of', 'to', 'is', 'that'].includes(x)).length;
  return w.length > 0 && hits / w.length > 0.06;
};
const slugOf = (url) => {
  let s = url.split('/').pop().replace(/-\d+$/, '').toLowerCase().replace(/[^a-z0-9-]/g, '');
  if (s.length > 40) s = s.slice(0, 40).replace(/-[^-]*$/, '');
  return s.replace(/-+$/, '');
};

async function convCandidates() {
  const all = new Map();
  await Promise.all(CONV_FEEDS.map(async (f) => {
    let xml;
    try { xml = await get(f.url); } catch (e) { log('feed fail', f.url, e.message); return; }
    for (const ent of xml.split('<entry>').slice(1)) {
      const url = (ent.match(/<link rel="alternate"[^>]*href="([^"]+)"/) || [])[1];
      if (!url) continue;
      const published = tag(ent, 'published').slice(0, 10);
      const authors = [...ent.matchAll(/<author>\s*<name>([\s\S]*?)<\/name>/g)].map((a) => decode(a[1]).split(',')[0].trim());
      const prev = all.get(url);
      if (prev) { prev.w = Math.max(prev.w, f.w); prev.topic ||= f.topic; continue; }
      all.set(url, {
        url, published, w: f.w, topic: f.topic,
        title: stripTags(decode(tag(ent, 'title'))),
        author: authors.join(', '),
        html: decode(tag(ent, 'content')),
      });
    }
  }));
  return [...all.values()];
}

// ---------- index ----------
function loadIndex() {
  try { return JSON.parse(fs.readFileSync(INDEX, 'utf8')); } catch { return { updated: '', items: [], links: [] }; }
}
function writeJSON(file, obj) {
  const tmp = file + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 1) + '\n');
  fs.renameSync(tmp, file);
}

// ---------- links (본문 없이 제목·주소·날짜만) ----------
const isoDay = (s) => { const d = new Date(s); return isNaN(d) ? DATE : d.toISOString().slice(0, 10); };
async function rssLinks(url, source, keep = () => true) {
  const xml = await get(url);
  return xml.split('<item>').slice(1).map((it) => ({
    source,
    title: stripTags(decode(tag(it, 'title').replace(/<!\[CDATA\[|\]\]>/g, ''))),
    url: stripTags(tag(it, 'link')).split('?')[0],
    date: isoDay(stripTags(tag(it, 'pubDate'))),
  })).filter((l) => l.title && l.url && keep(l));
}
function asideRepl(code, timeoutMs = 90000) {
  return new Promise((resolve, reject) => {
    const p = spawn('aside', ['repl', code], { stdio: ['ignore', 'pipe', 'pipe'] });
    let out = '';
    p.stdout.on('data', (d) => (out += d));
    p.stderr.on('data', (d) => (out += d));
    const timer = setTimeout(() => { p.kill(); reject(new Error('aside timeout')); }, timeoutMs);
    p.on('error', (e) => { clearTimeout(timer); reject(e); });
    p.on('close', () => { clearTimeout(timer); resolve(out); });
  });
}
async function bofLinks() {
  // 직접 요청은 Cloudflare 403 → Aside 브라우저로 첫 화면 링크 제목만 읽는다(읽기 전용).
  const code = `const page = await openTab('https://www.businessoffashion.com/'); await new Promise(r=>setTimeout(r,7000));
const r = await page.evaluate(()=>[...document.querySelectorAll('a[href*="/articles/"]')].map(a=>({t:(a.querySelector('h1,h2,h3,h4')||a).innerText.trim().replace(/\\s+/g,' '),h:a.href.split('?')[0]})).filter(x=>x.t.length>20));
await page.close(); console.log('BOFLINKS ' + JSON.stringify(r));`;
  const out = await asideRepl(code);
  const line = out.split('\n').find((l) => l.startsWith('BOFLINKS '));
  if (!line) throw new Error('aside: no output');
  const best = new Map();
  for (const { t, h } of JSON.parse(line.slice(9))) {
    if (!/\/articles\/[^/]+\/[^/]+\/?$/.test(h)) continue;
    if (t.length > 110 || /\.$/.test(t)) continue;                     // 제목이 아닌 설명문은 버린다
    if (!best.has(h) || t.length < best.get(h).length) best.set(h, t); // 가장 짧은 글자 = 순수 제목
  }
  return [...best].slice(0, 12).map(([url, title]) => ({ source: 'BoF', title, url, date: DATE }));
}
async function collectLinks(old) {
  const jobs = [
    ['BBC Future', () => rssLinks('https://www.bbc.com/future/feed.rss', 'BBC Future', (l) => /\/future\/article\//.test(l.url))],
    ['Guardian Long Read', () => rssLinks('https://www.theguardian.com/news/series/the-long-read/rss', 'Guardian Long Read', (l) => !/\/audio\/|podcast/i.test(l.url + l.title))],
    ['BoF', bofLinks],
  ];
  const got = [];
  await Promise.all(jobs.map(async ([name, fn]) => {
    try { const l = await fn(); log(`links ${name}: ${l.length}`); got.push(...l); } catch (e) { log(`links ${name} 실패:`, e.message); }
  }));
  const map = new Map();
  for (const l of [...old, ...got]) if (!map.has(l.url)) map.set(l.url, l); // 기존 날짜 유지
  return [...map.values()]
    .sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30);
}

// ---------- study pack (claude -p) ----------
function runClaude(prompt, env) {
  return new Promise((resolve) => {
    const p = spawn('claude', ['-p', '--output-format', 'text'], { env: { ...process.env, ...env }, stdio: ['pipe', 'pipe', 'pipe'] });
    let out = '', err = '';
    p.stdout.on('data', (d) => (out += d));
    p.stderr.on('data', (d) => (err += d));
    const timer = setTimeout(() => p.kill(), 8 * 60e3);
    p.on('error', (e) => { clearTimeout(timer); resolve({ code: -1, out, err: String(e) }); });
    p.on('close', (code) => { clearTimeout(timer); resolve({ code, out, err }); });
    p.stdin.end(prompt);
  });
}
async function claude(prompt) {
  let r = await runClaude(prompt, {});
  if (r.code !== 0) {
    log('claude -p exit', r.code, '→ ~/.claude-work 로 재시도', r.err.slice(0, 200));
    r = await runClaude(prompt, { CLAUDE_CONFIG_DIR: path.join(process.env.HOME, '.claude-work') });
  }
  if (r.code !== 0) throw new Error(`claude -p 실패 (${r.code}): ${r.err.slice(0, 300)}`);
  return r.out;
}
function parseJSON(text) {
  const s = text.replace(/```(?:json)?/g, '');
  const a = s.indexOf('{'), b = s.lastIndexOf('}');
  if (a < 0 || b < a) throw new Error('JSON 없음');
  return JSON.parse(s.slice(a, b + 1));
}

const POS = ['동사', '명사', '형용사', '부사', '구'];
function normalizePack(p) {
  const gloss = {};
  for (const [k, v] of Object.entries(p.gloss || {})) {
    if (v && typeof v === 'object') gloss[k.toLowerCase().trim()] = { w: v.w, pos: v.pos, ko: v.ko, en: v.en, ex: v.ex, ipa: v.ipa };
  }
  return {
    level: ['B2', 'B2+', 'C1'].includes(p.level) ? p.level : 'B2+',
    gloss,
    vocab: (p.vocab || []).map((v) => String(v).toLowerCase().trim()),
    quiz: (p.quiz || []).map((q) => ({ q: q.q, a: String(q.a || '').toUpperCase(), why: q.why })),
    para: (p.para || []).map((x) => ({ simple: x.simple, article: x.article })),
    summary: p.summary || '',
    gist: p.gist || '',
  };
}
function validatePack(p, paras) {
  const errs = [];
  const body = paras.join('\n');
  const n = Object.keys(p.gloss).length;
  if (n < 40 || n > 80) errs.push(`gloss 항목 ${n}개 (40–70 필요)`);
  for (const [k, v] of Object.entries(p.gloss)) {
    for (const f of ['w', 'pos', 'ko', 'en', 'ex', 'ipa']) if (!v[f] || typeof v[f] !== 'string') errs.push(`gloss["${k}"].${f} 없음`);
    if (v.pos && !POS.includes(v.pos)) errs.push(`gloss["${k}"].pos="${v.pos}" (동사|명사|형용사|부사|구 중 하나)`);
    if (v.ex && v.ex.length > 25 && body.includes(v.ex)) errs.push(`gloss["${k}"].ex 가 본문 문장 그대로임`);
  }
  if (p.vocab.length < 10 || p.vocab.length > 14) errs.push(`vocab ${p.vocab.length}개 (10–14 필요)`);
  for (const v of p.vocab) if (!p.gloss[v]) errs.push(`vocab "${v}" 가 gloss 키에 없음`);
  if (p.quiz.length !== 4) errs.push(`quiz ${p.quiz.length}개 (정확히 4)`);
  for (const a of ['TRUE', 'FALSE', 'NOT GIVEN']) if (!p.quiz.some((q) => q.a === a)) errs.push(`quiz 에 ${a} 없음`);
  for (const q of p.quiz) if (!['TRUE', 'FALSE', 'NOT GIVEN'].includes(q.a) || !q.q || !q.why) errs.push(`quiz 항목 형식 오류: ${JSON.stringify(q).slice(0, 80)}`);
  if (p.para.length < 4 || p.para.length > 5) errs.push(`para ${p.para.length}개 (4–5)`);
  for (const x of p.para) if (!x.article || !paras.some((pp) => pp.includes(x.article))) errs.push(`para.article 이 본문에 글자 그대로 없음: "${String(x.article).slice(0, 80)}"`);
  if (!p.summary) errs.push('summary 없음');
  if (!p.gist) errs.push('gist 없음');
  return errs;
}
function packPrompt(art) {
  return `You are building an English reading study pack for a Korean fashion designer preparing for IELTS General Training (target band 7).
Read the article below and reply with ONLY one JSON object (no prose, no markdown fences) with exactly these keys:

{"level":"B2|B2+|C1",
 "gloss":{"<lowercase key>":{"w":"surface or lemma","pos":"동사|명사|형용사|부사|구","ko":"짧은 한국어 뜻","en":"short English definition","ex":"one natural example sentence you write yourself","ipa":"/.../"}},
 "vocab":["key", ...],
 "quiz":[{"q":"statement about the article","a":"TRUE|FALSE|NOT GIVEN","why":"한국어 한 줄 근거"}],
 "para":[{"simple":"plain wording","article":"exact phrase from the article"}],
 "summary":"one-sentence model summary in your own English words",
 "gist":"한국어 두 줄 이내 — 무슨 글인지"}

Rules:
- gloss: 45–65 entries covering every B2+/C1 word, useful phrase or collocation in the article. Keys are lowercase. Include BOTH the form as it appears in the article AND its lemma as separate keys when they differ (e.g. "exacerbates" and "exacerbate", same data). Multi-word phrases allowed ("grapple with"). pos must be exactly one of 동사, 명사, 형용사, 부사, 구. "ex" must NOT be copied from the article. ipa in slashes (for phrases, IPA of the whole phrase).
- vocab: 10–14 keys taken from gloss (exact same key strings), the ones most worth studying for IELTS.
- quiz: exactly 4 IELTS-style statements; use each of TRUE, FALSE and NOT GIVEN at least once.
- para: 4–5 pairs. "article" must be copied CHARACTER-FOR-CHARACTER from the article text (same curly quotes/apostrophes, same punctuation), 4–15 words, from a single paragraph. "simple" is a plainer paraphrase.
- Output valid JSON only (double quotes, no trailing commas).

TITLE: ${art.title}

ARTICLE:
${art.paras.join('\n\n')}`;
}
async function makePack(art) {
  let prompt = packPrompt(art);
  for (let attempt = 1; attempt <= 2; attempt++) {
    const t = Date.now();
    let pack, errs;
    try {
      pack = normalizePack(parseJSON(await claude(prompt)));
      errs = validatePack(pack, art.paras);
    } catch (e) { errs = [`JSON 파싱 실패: ${e.message}`]; }
    log(`pack ${art.id} 시도${attempt} ${((Date.now() - t) / 1000).toFixed(0)}s, 오류 ${errs.length}`);
    if (!errs.length) return pack;
    if (attempt === 2) {
      // 마지막 수단: 고칠 수 있는 것만 정리(본문에 없는 para, gloss에 없는 vocab 제거)하고 다시 검사
      if (pack) {
        pack.para = pack.para.filter((x) => x.article && art.paras.some((pp) => pp.includes(x.article)));
        pack.vocab = pack.vocab.filter((v) => pack.gloss[v]);
        const left = validatePack(pack, art.paras);
        if (left.every((e) => /^(para|vocab|gloss 항목) \d+개/.test(e) || /\.ex 가 본문/.test(e))) {
          log(`pack ${art.id} 부분 통과(남은 경고): ${left.join(' | ')}`);
          return pack;
        }
        throw new Error(`pack 검증 실패: ${left.slice(0, 6).join(' | ')}`);
      }
      throw new Error(`pack 실패: ${errs.join(' | ')}`);
    }
    prompt = packPrompt(art) + `\n\nYour previous answer had these problems — fix ALL of them and output the full corrected JSON only:\n- ${errs.slice(0, 25).join('\n- ')}`;
  }
}

// ---------- IELTS 문제 세트 (claude -p) ----------
// 유형별 연습용. ielts = { questions:[{n,type,q,options?,answer,why,limit?}], headings:{paras:[문단 인덱스…]} }
const IELTS_TYPES = ['r-tfng', 'r-ynng', 'r-heading', 'r-match', 'r-mcq', 'r-gap', 'r-short'];
const IELTS_COUNT = { 'r-tfng': [3, 4], 'r-ynng': [0, 2], 'r-heading': [3, 5], 'r-match': [2, 2], 'r-mcq': [2, 2], 'r-gap': [2, 3], 'r-short': [1, 1] };
const IELTS_TOTAL = [12, 15]; // 유형별 최소치 합이 13, YES/NO 2문제가 붙으면 15
const TFNG = ['TRUE', 'FALSE', 'NOT GIVEN'], YNNG = ['YES', 'NO', 'NOT GIVEN'];
const LIMITS = { 'r-gap': ['NO MORE THAN TWO WORDS', 2], 'r-short': ['NO MORE THAN THREE WORDS', 3] };
const ROMAN = ['i', 'ii', 'iii', 'iv', 'v', 'vi', 'vii', 'viii', 'ix', 'x', 'xi', 'xii'];
const lead = (o) => String(o).trim().split(/\s+/)[0];
const normTxt = (s) => String(s).toLowerCase().replace(/[’‘]/g, "'").replace(/[“”]/g, '"').replace(/\s+/g, ' ').trim();
const wc = (s) => String(s).trim().split(/\s+/).filter(Boolean).length;

function normalizeIelts(raw, paras) {
  const qs = (raw.questions || []).map((q) => {
    const type = String(q.type || '').trim();
    const o = { n: 0, type, q: String(q.q || '').trim() };
    if (['r-gap', 'r-short'].includes(type)) {
      o.limit = LIMITS[type][0];
      o.answer = (Array.isArray(q.answer) ? q.answer : [q.answer]).map((x) => String(x || '').trim()).filter(Boolean);
    } else {
      o.options = (q.options || []).map((x) => String(x).trim());
      if (type === 'r-tfng') o.options = TFNG.slice();
      if (type === 'r-ynng') o.options = YNNG.slice();
      o.answer = String(q.answer || '').trim();
      if (['r-tfng', 'r-ynng'].includes(type)) o.answer = o.answer.toUpperCase();
      if (type === 'r-mcq') o.answer = o.answer.toUpperCase().replace(/[^A-D]/g, '').slice(0, 1);
      if (type === 'r-heading') o.answer = o.answer.toLowerCase().replace(/[^ivx]/g, '');
      if (type === 'r-match') o.answer = o.answer.replace(/\D/g, '');
    }
    o.why = String(q.why || '').trim();
    return o;
  });
  // IELTS 순서대로 유형별로 묶고 번호를 다시 매긴다(같은 유형 안의 순서는 그대로)
  qs.sort((a, b) => IELTS_TYPES.indexOf(a.type) - IELTS_TYPES.indexOf(b.type));
  qs.forEach((q, i) => (q.n = i + 1));
  const hp = (raw.headings?.paras || []).map(Number);
  return { questions: qs, headings: { paras: hp } };
}

function validateIelts(x, paras) {
  const errs = [];
  const body = normTxt(paras.join('\n'));
  const qs = x.questions;
  if (qs.length < IELTS_TOTAL[0] || qs.length > IELTS_TOTAL[1]) errs.push(`questions ${qs.length}개 (${IELTS_TOTAL.join('–')})`);
  const cnt = {};
  for (const q of qs) {
    if (!IELTS_TYPES.includes(q.type)) { errs.push(`알 수 없는 type "${q.type}"`); continue; }
    cnt[q.type] = (cnt[q.type] || 0) + 1;
    if (!q.q) errs.push(`Q${q.n} q 없음`);
    if (!q.why) errs.push(`Q${q.n} why 없음`);
  }
  for (const [t, [lo, hi]] of Object.entries(IELTS_COUNT)) {
    const c = cnt[t] || 0;
    if (t === 'r-ynng' ? (c !== 0 && c !== 2) : (c < lo || c > hi)) errs.push(`${t} ${c}개 (${t === 'r-ynng' ? '0 또는 2' : lo === hi ? lo : `${lo}–${hi}`})`);
  }
  for (const q of qs) {
    const tag = `Q${q.n}(${q.type})`;
    if (q.type === 'r-tfng' || q.type === 'r-ynng') {
      if (!q.options.includes(q.answer)) errs.push(`${tag} answer "${q.answer}" 가 ${q.options.join('/')} 중 하나가 아님`);
    } else if (q.type === 'r-mcq') {
      if (q.options.length !== 4 || q.options.some((o, i) => lead(o) !== 'ABCD'[i] || wc(o) < 2)) errs.push(`${tag} options 는 "A …"–"D …" 4개`);
      if (!'ABCD'.includes(q.answer) || !q.answer) errs.push(`${tag} answer 는 A–D 글자 하나`);
    } else if (q.type === 'r-match') {
      if (q.options.length < 4 || q.options.some((o) => !/^\d+$/.test(o) || +o < 1 || +o > paras.length)) errs.push(`${tag} options 는 문단 번호 문자열(1–${paras.length}) 4개 이상`);
      if (!q.options.includes(q.answer)) errs.push(`${tag} answer "${q.answer}" 가 options 에 없음`);
    } else if (q.type === 'r-heading') {
      if (!q.options.length) errs.push(`${tag} options 없음`);
      const leads = q.options.map(lead);
      if (q.options.some((o, i) => leads[i] !== ROMAN[i] || wc(o) < 3)) errs.push(`${tag} options 는 "i  …", "ii  …" 순서의 제목 목록`);
      if (!leads.includes(q.answer)) errs.push(`${tag} answer "${q.answer}" 가 options 의 로마 숫자가 아님`);
    } else if (q.type === 'r-gap' || q.type === 'r-short') {
      const max = LIMITS[q.type][1];
      if (!q.answer.length) errs.push(`${tag} answer 없음`);
      if (q.type === 'r-gap' && !/_{3,}/.test(q.q)) errs.push(`${tag} q 에 빈칸(____) 없음`);
      for (const a of q.answer) {
        if (wc(a) > max) errs.push(`${tag} answer "${a}" 가 ${max}단어 초과`);
        if (!body.includes(normTxt(a))) errs.push(`${tag} answer "${a}" 가 본문에 글자 그대로 없음`);
      }
    }
  }
  // 문단 제목: 제목 목록은 모든 문제가 같고, 개수 = 문제 수 + 2, 답은 서로 다름, headings.paras 와 'Paragraph X' 일치
  const hq = qs.filter((q) => q.type === 'r-heading');
  const hp = x.headings.paras;
  if (hq.length) {
    const list = JSON.stringify(hq[0].options);
    if (hq.some((q) => JSON.stringify(q.options) !== list)) errs.push('r-heading 문제끼리 제목 목록(options)이 다름');
    if (hq[0].options.length !== hq.length + 2) errs.push(`r-heading options ${hq[0].options.length}개 (문제 수 ${hq.length} + 오답 2 = ${hq.length + 2})`);
    if (new Set(hq.map((q) => q.answer)).size !== hq.length) errs.push('r-heading 답이 겹침');
    if (hp.length !== hq.length) errs.push(`headings.paras ${hp.length}개 ≠ r-heading ${hq.length}문제`);
    hq.forEach((q, i) => {
      const p = hp[i];
      if (!Number.isInteger(p) || p < 0 || p >= paras.length) { errs.push(`headings.paras[${i}]=${p} 범위 밖 (0–${paras.length - 1})`); return; }
      if (wc(paras[p]) < 15) errs.push(`headings.paras[${i}]=${p} 는 소제목/짧은 줄이라 문단 제목 문제로 부적합`);
      if (q.q !== `Paragraph ${p + 1}`) errs.push(`${'Q' + q.n} q 는 "Paragraph ${p + 1}" 여야 함 (headings.paras[${i}]=${p})`);
    });
    if (new Set(hp).size !== hp.length) errs.push('headings.paras 중복');
  } else if (hp.length) errs.push('r-heading 문제가 없는데 headings.paras 가 있음');
  return errs;
}

function ieltsPrompt(art) {
  const numbered = art.paras.map((p, i) => `[${i + 1}] ${p}`).join('\n\n');
  return `You are an IELTS examiner writing a General Training Reading Section 3 question set for the article below. A Korean learner (target band 7) will drill each question type separately.
Reply with ONLY one JSON object (no prose, no markdown fences):

{"questions":[
 {"type":"r-tfng","q":"statement","options":["TRUE","FALSE","NOT GIVEN"],"answer":"FALSE","why":"한국어 한 줄 — 근거 구절"},
 {"type":"r-ynng","q":"statement about the WRITER's views/claims","options":["YES","NO","NOT GIVEN"],"answer":"YES","why":"..."},
 {"type":"r-heading","q":"Paragraph 6","options":["i  Heading one","ii  Heading two", ...],"answer":"iii","why":"..."},
 {"type":"r-match","q":"Which paragraph mentions a/an ...?","options":["2","5","9","14"],"answer":"9","why":"..."},
 {"type":"r-mcq","q":"question","options":["A ...","B ...","C ...","D ..."],"answer":"C","why":"..."},
 {"type":"r-gap","q":"Sentence or summary with ____ for the missing words.","answer":["exact words","accepted variant"],"why":"..."},
 {"type":"r-short","q":"Wh- question","answer":["exact words"],"why":"..."}
],
 "headings":{"paras":[5, ...]}}

Rules (all are checked by code — follow exactly):
- Paragraphs are numbered [1]..[${art.paras.length}] below. Use those numbers in questions.
- Counts: r-tfng 3–4; r-ynng exactly 2 ONLY if the writer expresses opinions/claims, otherwise 0; r-heading 3–5; r-match exactly 2; r-mcq exactly 2; r-gap 2–3; r-short exactly 1. Total 13–15.
- r-tfng / r-ynng: options exactly as shown; answer is one of them. Use a mix of answers (including at least one NOT GIVEN across these).
- r-heading: pick 3–5 substantial body paragraphs (not one-line subheadings, at least 15 words). Each heading question has q = "Paragraph N" (N = the bracket number) and the SAME options list for every heading question: headings numbered with lower-case roman numerals in order "i  …", "ii  …", "iii  …" (numeral, two spaces, heading), exactly (number of heading questions + 2) headings, i.e. 2 distractors. Answers are distinct numerals. "headings.paras" lists the chosen paragraphs as 0-based indices (N − 1), in the same order as the heading questions.
- r-match: options are 4 paragraph numbers as strings; answer is one of them. Only one option may be correct.
- r-mcq: exactly 4 options starting "A ", "B ", "C ", "D "; answer is the letter. Only one defensible answer.
- r-gap: sentence/summary completion, NO MORE THAN TWO WORDS. q contains "____" for the gap. Every answer string must appear CHARACTER-FOR-CHARACTER in the article (same spelling); list accepted variants (e.g. with/without article) only if each variant also appears verbatim.
- r-short: short-answer question, NO MORE THAN THREE WORDS, answer copied verbatim from the article.
- Answers must be unambiguous and derivable from the article text alone. Paraphrase in questions (as real IELTS does); do not copy whole sentences.
- "why": one Korean line explaining the answer, quoting the key English phrase from the article.
- Output valid JSON only (double quotes, no trailing commas).

TITLE: ${art.title}

ARTICLE:
${numbered}`;
}
async function makeIelts(art) {
  let prompt = ieltsPrompt(art);
  for (let attempt = 1; attempt <= 2; attempt++) {
    const t = Date.now();
    let x, errs;
    try {
      x = normalizeIelts(parseJSON(await claude(prompt)), art.paras);
      errs = validateIelts(x, art.paras);
    } catch (e) { errs = [`JSON 파싱 실패: ${e.message}`]; }
    log(`ielts ${art.id} 시도${attempt} ${((Date.now() - t) / 1000).toFixed(0)}s, 오류 ${errs.length}${errs.length ? ': ' + errs.slice(0, 4).join(' | ') : ''}`);
    if (!errs.length) return x;
    prompt = ieltsPrompt(art) + `\n\nYour previous answer had these problems — fix ALL of them and output the full corrected JSON only:\n- ${errs.slice(0, 25).join('\n- ')}`;
  }
  return null; // 두 번 다 실패 → 조용히 건너뜀(다음 실행 때 다시 시도)
}

// --ielts-only: 새 글 없이 기존 글에 IELTS 세트만 채운다
async function ieltsOnly() {
  const index = loadIndex();
  const arts = [];
  for (const it of index.items || []) {
    const f = path.join(ROOT, it.file);
    try { const a = JSON.parse(fs.readFileSync(f, 'utf8')); if (!a.ielts && a.paras?.length) arts.push({ a, f }); } catch {}
  }
  log(`ielts-only: 채울 글 ${arts.length}개`);
  let ok = 0;
  await Promise.all(arts.map(async ({ a, f }) => {
    const x = await makeIelts(a);
    if (!x) { log('ielts 건너뜀', a.id); return; }
    const cur = JSON.parse(fs.readFileSync(f, 'utf8'));   // 그사이 바뀌었을 수 있으니 다시 읽어 ielts 만 얹는다
    cur.ielts = x; writeJSON(f, cur); ok++;
  }));
  log(`완료: IELTS ${ok}/${arts.length}`);
}

// ---------- main ----------
async function main() {
  fs.mkdirSync(DATA, { recursive: true });
  const index = loadIndex();
  index.items ||= []; index.links ||= [];
  log(`date=${DATE} count=${COUNT} pack=${!NO_PACK}`);

  const linksP = collectLinks(index.links);

  // 1) 이미 있는데 학습팩이 빠진 글(--no-pack 으로 만든 것)은 이번에 채운다
  const todo = [];
  if (!NO_PACK) {
    for (const it of index.items) {
      const f = path.join(ROOT, it.file);
      try { const a = JSON.parse(fs.readFileSync(f, 'utf8')); if (!a.vocab?.length || !a.ielts) todo.push({ ...a, _file: f, _item: it }); } catch {}
    }
  }

  // 2) 오늘 몫 고르기
  const have = index.items.filter((i) => i.date === DATE).length;
  const need = Math.max(0, COUNT - have);
  const picked = [];
  if (need) {
    const seen = new Set(index.items.map((i) => i.url));
    const ids = new Set(index.items.map((i) => i.id));
    const lo = new Date(Date.parse(DATE) - WINDOW_DAYS * 864e5).toISOString().slice(0, 10);
    const cands = (await convCandidates())
      .filter((c) => !seen.has(c.url) && c.published <= DATE && c.published >= lo)
      .map((c) => {
        const paras = contentToParas(c.html);
        const words = wordCount(paras);
        const age = (Date.parse(DATE) - Date.parse(c.published)) / 864e5;
        const fit = words >= 700 && words <= 1600;
        return { ...c, paras, words, score: c.w * 10 - age * 1.5 + (Math.abs(words - 1100) < 300 ? 5 : 0), fit };
      })
      .filter((c) => c.fit && c.paras.length >= 6 && isEnglish(c.paras))
      .sort((a, b) => b.score - a.score);
    log(`후보 ${cands.length}개`);
    const usedTopics = new Set(index.items.filter((i) => i.date === DATE).map((i) => i.topic));
    for (const pass of [0, 1]) {               // 1차: 분야 겹치지 않게, 2차: 남은 자리 채우기
      for (const c of cands) {
        if (picked.length >= need) break;
        if (picked.includes(c)) continue;
        const topic = c.topic || '문화';
        if (pass === 0 && usedTopics.has(topic)) continue;
        const id = `${DATE}-conv-${slugOf(c.url)}`;
        if (ids.has(id)) continue;
        ids.add(id); usedTopics.add(topic);
        picked.push({ ...c, id, topic });
      }
    }
  } else log(`${DATE} 몫 ${have}개 이미 있음 — 새 글 없음`);

  const newArts = picked.map((c) => ({
    id: c.id, title: c.title, url: c.url, source: 'The Conversation', author: c.author,
    published: c.published, license: 'CC BY-ND 4.0', attribution: ATTRIBUTION,
    paras: c.paras, level: 'B2+', minutes: Math.max(1, Math.round(c.words / 170)), words: c.words,
    gloss: {}, vocab: [], quiz: [], para: [], summary: '', gist: '',
    _topic: c.topic, _file: path.join(DATA, `${c.id}.json`),
  }));
  for (const a of newArts) log(`선택: [${a._topic}] ${a.title} (${a.words}w, ${a.published})`);

  // 3) 학습팩 (병렬)
  const strip = (a) => Object.fromEntries(Object.entries(a).filter(([k]) => !k.startsWith('_')));
  const failures = [];
  let ieltsMade = 0;
  await Promise.all([...todo, ...newArts].map(async (a) => {
    let changed = false;
    if (!NO_PACK) {
      const needPack = !a.vocab?.length;
      // 학습팩과 IELTS 세트는 서로 독립이라 같이 돌린다
      await Promise.all([
        needPack && makePack(a).then((p) => { Object.assign(a, p); changed = true; },
          (e) => { failures.push(`${a.id}: ${e.message}`); log('pack 실패', a.id, e.message); }),
        !a.ielts && makeIelts(a).then((x) => { if (x) { a.ielts = x; changed = true; ieltsMade++; } else log('ielts 건너뜀', a.id); },
          (e) => log('ielts 실패', a.id, e.message)),
      ]);
    }
    if (a._item) { if (changed) { writeJSON(a._file, strip(a)); a._item.level = a.level; a._item.gist = a.gist; } return; }
    writeJSON(a._file, strip(a));
  }));

  for (const a of newArts) {
    index.items.push({
      id: a.id, date: DATE, source: a.source, title: a.title, url: a.url, author: a.author,
      minutes: a.minutes, level: a.level, words: a.words, topic: a._topic, gist: a.gist || '',
      file: `data/read/${a.id}.json`,
    });
  }
  index.items.sort((x, y) => y.date.localeCompare(x.date) || x.id.localeCompare(y.id));
  index.links = await linksP;
  index.updated = new Date().toISOString();
  writeJSON(INDEX, { updated: index.updated, items: index.items, links: index.links });
  log(`완료: 새 글 ${newArts.length}, 보충 대상 ${todo.length}, IELTS ${ieltsMade}, 링크 ${index.links.length}, 실패 ${failures.length}`);
  if (failures.length) { failures.forEach((f) => log('  ✗', f)); process.exitCode = 2; }
}

(IELTS_ONLY ? ieltsOnly() : main()).catch((e) => { console.error(e); process.exit(1); });
