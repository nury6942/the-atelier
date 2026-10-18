#!/usr/bin/env node
// Read 탭 콘텐츠 파이프라인.
//  - The Conversation: 본문 전체(CC BY-ND 4.0, 수정 없이 + 출처 + 링크) + 학습팩(claude -p)
//  - BBC Future · Guardian Long Read · BoF: 제목·주소·날짜만 (본문/요약 저장 금지)
// 쓰는 법:  node scripts/read/fetch.mjs [--date YYYY-MM-DD] [--count N] [--no-pack]
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
const NO_PACK = argv.includes('--no-pack');
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
      try { const a = JSON.parse(fs.readFileSync(f, 'utf8')); if (!a.vocab?.length) todo.push({ ...a, _file: f, _item: it }); } catch {}
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
  await Promise.all([...todo, ...newArts].map(async (a) => {
    if (!NO_PACK) {
      try { Object.assign(a, await makePack(a)); } catch (e) { failures.push(`${a.id}: ${e.message}`); log('pack 실패', a.id, e.message); }
    }
    if (a._item) { if (a.vocab.length) { writeJSON(a._file, strip(a)); a._item.level = a.level; a._item.gist = a.gist; } return; }
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
  log(`완료: 새 글 ${newArts.length}, 팩 보충 ${todo.length}, 링크 ${index.links.length}, 실패 ${failures.length}`);
  if (failures.length) { failures.forEach((f) => log('  ✗', f)); process.exitCode = 2; }
}

main().catch((e) => { console.error(e); process.exit(1); });
