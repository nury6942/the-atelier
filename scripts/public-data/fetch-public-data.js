#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════
//  공공데이터 → Firestore appSettings/publicData (아이맥 매일 08:10)
//
//  한국은행 ECOS(환율·기준금리·물가) · OPEN DART(F&F 분기 실적·공시) · 국토부 오피스텔 실거래(우리 집)
//  를 받아서 문서 한 장에 쓴다. 사이트는 이 문서를 **읽기만** 한다(API 직접 호출 없음).
//  Job Hunt 생성기(gen.py)용으로 ~/Documents/job-hunt-src/rates.json 도 같이 쓴다.
//
//  키: ~/.config/korea-apis/keys.env (chmod 600, 저장소·로그에 절대 안 남김 — 요청 주소도 로그에 안 찍음)
//  인증: 아이맥 gcloud 애플리케이션 기본 인증(ADC) — ai-worker 와 같은 방식, firebase-admin 도 ai-worker 것을 빌려 씀
//  실행: launchd com.nuri.atelier-public-data (매일 08:10) · 수동: node fetch-public-data.js [--dry]
// ═══════════════════════════════════════════════════════════

const fs = require('fs');
const os = require('os');
const path = require('path');

const DRY = process.argv.includes('--dry');
const HOME = os.homedir();
const KEYS_FILE = path.join(HOME, '.config/korea-apis/keys.env');
const CACHE_DIR = path.join(HOME, '.cache/atelier-public-data');
const RATES_JSON = path.join(HOME, 'Documents/job-hunt-src/rates.json');
const PROJECT = 'the-atelier-99b8c';

const FNF_CORP = '01568413';
const LAWD_CD = '11500';                       // 강서구
const HOME_NAME = '염창역한강투웨니퍼스트';     // 정확히 이 이름 포함 ('염창투웨니퍼스트'는 다른 건물)
const HOME_AREA = 29.98;
const FX_ITEMS = { USD: '0000001', JPY100: '0000002', EUR: '0000003', GBP: '0000012', CAD: '0000013', CHF: '0000014', AUD: '0000017', DKK: '0000018' };

function log(...a) { console.log(new Date().toISOString(), ...a); }

function readKeys() {
  const out = {};
  for (const line of fs.readFileSync(KEYS_FILE, 'utf8').split('\n')) {
    const s = line.trim();
    if (!s || s.startsWith('#') || s.indexOf('=') < 0) continue;
    const i = s.indexOf('=');
    out[s.slice(0, i).trim()] = s.slice(i + 1).trim();
  }
  return out;
}
const K = readKeys();
function key(n) { if (!K[n]) throw new Error(n + ' 가 keys.env 에 없음'); return K[n]; }

// 키가 들어간 주소는 에러 메시지에도 안 남긴다
async function getText(url, what) {
  for (let t = 0; t < 3; t++) {
    try {
      const ctl = new AbortController();
      const timer = setTimeout(() => ctl.abort(), 30000);
      const r = await fetch(url, { signal: ctl.signal });
      clearTimeout(timer);
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return await r.text();
    } catch (e) {
      if (t === 2) throw new Error(what + ' 실패: ' + (e.message || e).toString().replace(/https?:\/\/\S+/g, '[url]'));
      await new Promise(res => setTimeout(res, 2000 * (t + 1)));
    }
  }
}
async function getJson(url, what) { return JSON.parse(await getText(url, what)); }

function ymd(d) { return d.toISOString().slice(0, 10).replace(/-/g, ''); }
function kstNow() { return new Date(Date.now() + 9 * 3600 * 1000); }
function ymAdd(ym, n) { let y = +ym.slice(0, 4), m = +ym.slice(4, 6) - 1 + n; y += Math.floor(m / 12); m = ((m % 12) + 12) % 12; return y + String(m + 1).padStart(2, '0'); }
const r2 = x => Math.round(x * 100) / 100;
const r1 = x => Math.round(x * 10) / 10;

// ── ECOS ─────────────────────────────────────────────
async function ecos(stat, cycle, start, end, item) {
  const url = `https://ecos.bok.or.kr/api/StatisticSearch/${encodeURIComponent(key('ECOS_KEY'))}/json/kr/1/3000/${stat}/${cycle}/${start}/${end}` + (item ? '/' + item : '');
  const d = await getJson(url, 'ECOS ' + stat);
  if (!d.StatisticSearch) throw new Error('ECOS ' + stat + ': ' + JSON.stringify(d.RESULT || d).slice(0, 200));
  return d.StatisticSearch.row;
}

async function getFx() {
  const now = kstNow();
  const rows = await ecos('731Y001', 'D', ymd(new Date(now - 20 * 86400000)), ymd(now));
  const byDate = {};
  for (const r of rows) {
    const k = Object.keys(FX_ITEMS).find(c => FX_ITEMS[c] === r.ITEM_CODE1);
    if (!k) continue;
    (byDate[r.TIME] = byDate[r.TIME] || {})[k] = +r.DATA_VALUE;
  }
  const dates = Object.keys(byDate).filter(d => byDate[d].EUR).sort();
  if (!dates.length) throw new Error('ECOS 환율 없음');
  const last = dates[dates.length - 1], prev = dates[dates.length - 2];
  const iso = d => d.slice(0, 4) + '-' + d.slice(4, 6) + '-' + d.slice(6, 8);
  const fx = Object.assign({ date: iso(last), source: '한국은행 매매기준율' }, byDate[last]);
  if (prev) fx.prev = Object.assign({ date: iso(prev) }, byDate[prev]);
  return fx;
}

async function getRate() {
  const end = ymd(kstNow()).slice(0, 6);
  const rows = await ecos('722Y001', 'M', ymAdd(end, -13), end, '0101000');
  const last = rows[rows.length - 1], prev = rows[rows.length - 2];
  const m = t => t.slice(0, 4) + '-' + t.slice(4, 6);
  return { base: +last.DATA_VALUE, month: m(last.TIME), prev: prev ? +prev.DATA_VALUE : null, prevMonth: prev ? m(prev.TIME) : null };
}

// 금리 추이 24달 — 기준금리 · 예금은행 정기예금 신규취급액 가중평균(121Y002 BEABAA211, 만기 전체)
async function getRateHistory() {
  const end = ymd(kstNow()).slice(0, 6), start = ymAdd(end, -24);
  const conv = rows => rows.map(r => ({ m: r.TIME.slice(0, 4) + '-' + r.TIME.slice(4, 6), v: +r.DATA_VALUE })).slice(-24);
  return {
    base: conv(await ecos('722Y001', 'M', start, end, '0101000')),
    deposit: conv(await ecos('121Y002', 'M', start, end, 'BEABAA211')),
    depositLabel: '예금은행 정기예금 신규취급액 가중평균',
  };
}

async function getCpi() {
  const end = ymd(kstNow()).slice(0, 6);
  const rows = await ecos('901Y009', 'M', ymAdd(end, -26), end, '0');
  const v = {}; rows.forEach(r => { v[r.TIME] = +r.DATA_VALUE; });
  const months = Object.keys(v).sort();
  const yoy = t => (v[t] && v[ymAdd(t, -12)]) ? r1((v[t] / v[ymAdd(t, -12)] - 1) * 100) : null;
  const last = months[months.length - 1];
  return { yoy: yoy(last), month: last.slice(0, 4) + '-' + last.slice(4, 6), prevYoy: yoy(ymAdd(last, -1)), index: v[last], series: '901Y009 총지수(2020=100) 전년동월비' };
}

// ── DART ─────────────────────────────────────────────
async function getFnf() {
  const y = +ymd(kstNow()).slice(0, 4);
  const tries = [[y, '11014', '3Q'], [y, '11012', '2Q'], [y, '11013', '1Q'], [y - 1, '11011', '연간'], [y - 1, '11014', '3Q']];
  const num = s => +(String(s || '').replace(/,/g, '')) || 0;
  let fin = null;
  for (const [yr, code, q] of tries) {
    const d = await getJson(`https://opendart.fss.or.kr/api/fnlttSinglAcnt.json?crtfc_key=${encodeURIComponent(key('DART_KEY'))}&corp_code=${FNF_CORP}&bsns_year=${yr}&reprt_code=${code}`, 'DART 재무');
    if (d.status !== '000' || !d.list) continue;
    const pick = nm => d.list.find(x => x.fs_div === 'CFS' && x.account_nm === nm) || d.list.find(x => x.account_nm === nm);
    const rv = pick('매출액'), op = pick('영업이익');
    if (!rv || !op) continue;
    const eok = s => r1(num(s) / 1e8);
    const yoy = (a, b) => num(b) ? r1((num(a) / num(b) - 1) * 100) : null;
    fin = {
      quarterLabel: q === '연간' ? `${yr} 연간` : `${String(yr).slice(2)}년 ${q}`,
      year: yr, reportCode: code, fs: rv.fs_div === 'CFS' ? '연결' : '별도', unit: '억원',
      revenue: eok(rv.thstrm_amount), opIncome: eok(op.thstrm_amount),
      revenuePrev: eok(rv.frmtrm_amount), opIncomePrev: eok(op.frmtrm_amount),
      revenueYoY: yoy(rv.thstrm_amount, rv.frmtrm_amount), opIncomeYoY: yoy(op.thstrm_amount, op.frmtrm_amount),
    };
    break;
  }
  const now = kstNow();
  const dl = await getJson(`https://opendart.fss.or.kr/api/list.json?crtfc_key=${encodeURIComponent(key('DART_KEY'))}&corp_code=${FNF_CORP}&bgn_de=${ymd(new Date(now - 180 * 86400000))}&end_de=${ymd(now)}&page_count=20`, 'DART 공시');
  const seen = new Set(), disclosures = [];
  for (const x of dl.list || []) {
    const title = String(x.report_nm || '').replace(/\s+/g, ' ').trim();
    const k = x.rcept_dt + title;
    if (seen.has(k)) continue; seen.add(k);
    disclosures.push({ date: x.rcept_dt.slice(0, 4) + '-' + x.rcept_dt.slice(4, 6) + '-' + x.rcept_dt.slice(6, 8), title, url: 'https://dart.fss.or.kr/dsaf001/main.do?rcpNo=' + x.rcept_no });
    if (disclosures.length >= 3) break;
  }
  return Object.assign({ corp: 'F&F' }, fin || {}, { disclosures });
}

// ── 국토부 오피스텔 실거래 ─────────────────────────────
function xmlItems(xml) {
  const out = [];
  const re = /<item>([\s\S]*?)<\/item>/g; let m;
  while ((m = re.exec(xml))) {
    const o = {}; const f = /<(\w+)>([\s\S]*?)<\/\1>/g; let g;
    while ((g = f.exec(m[1]))) o[g[1]] = g[2].trim();
    out.push(o);
  }
  return out;
}
async function offiMonth(kind, ym) {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const cf = path.join(CACHE_DIR, `offi-${kind}-${ym}.json`);
  const cur = ymd(kstNow()).slice(0, 6);
  // 3달 넘은 달은 신고가 끝났다고 보고 캐시 사용(매일 34달치 다시 부르지 않게)
  if (ym < ymAdd(cur, -3) && fs.existsSync(cf)) return JSON.parse(fs.readFileSync(cf, 'utf8'));
  const svc = kind === 'trade' ? 'RTMSDataSvcOffiTrade/getRTMSDataSvcOffiTrade' : 'RTMSDataSvcOffiRent/getRTMSDataSvcOffiRent';
  const xml = await getText(`https://apis.data.go.kr/1613000/${svc}?serviceKey=${encodeURIComponent(key('DATA_GO_KR_KEY'))}&LAWD_CD=${LAWD_CD}&DEAL_YMD=${ym}&numOfRows=3000&pageNo=1`, '국토부 ' + kind + ' ' + ym);
  const code = (xml.match(/<resultCode>([^<]*)</) || [])[1];
  if (code && code !== '00' && code !== '000') throw new Error('국토부 ' + kind + ' ' + ym + ' resultCode ' + code);
  const items = xmlItems(xml).filter(i => (i.offiNm || '').replace(/\s/g, '').includes(HOME_NAME) && Math.abs(+i.excluUseAr - HOME_AREA) <= 0.5);
  fs.writeFileSync(cf, JSON.stringify(items));
  return items;
}
async function getHome() {
  const cur = ymd(kstNow()).slice(0, 6);
  const months = []; for (let ym = '202401'; ym <= cur; ym = ymAdd(ym, 1)) months.push(ym);
  const dt = i => `${i.dealYear}-${String(i.dealMonth).padStart(2, '0')}-${String(i.dealDay).padStart(2, '0')}`;
  const man = s => +(String(s || '').replace(/,/g, '')) || 0;
  const trades = [], rents = [];
  for (const ym of months) {
    for (const i of await offiMonth('trade', ym)) {
      if ((i.cdealType || '').trim()) continue;          // 해제된 거래 제외
      trades.push({ date: dt(i), floor: +i.floor || null, price: man(i.dealAmount) });
    }
    for (const i of await offiMonth('rent', ym)) {
      rents.push({ date: dt(i), floor: +i.floor || null, deposit: man(i.deposit), monthly: man(i.monthlyRent), type: i.contractType || '' });
    }
  }
  trades.sort((a, b) => b.date.localeCompare(a.date));
  rents.sort((a, b) => b.date.localeCompare(a.date));
  const avgBy = (arr, val) => {
    const g = {}; arr.forEach(x => { const y = x.date.slice(0, 4); (g[y] = g[y] || []).push(val(x)); });
    const out = {}, cnt = {}; Object.keys(g).sort().forEach(y => { out[y] = Math.round(g[y].reduce((s, v) => s + v, 0) / g[y].length); cnt[y] = g[y].length; });
    return { avg: out, count: cnt };
  };
  const jeonse = rents.filter(r => r.monthly === 0);
  const yearAgo = new Date(kstNow() - 365 * 86400000).toISOString().slice(0, 10);
  const ta = avgBy(trades, x => x.price), ja = avgBy(jeonse, x => x.deposit);
  return {
    name: HOME_NAME, area: HOME_AREA, unit: '만원', lawdCd: LAWD_CD,
    trades: trades.slice(0, 8), yearAvg: ta.avg, yearCount: ta.count,
    jeonse: { yearAvg: ja.avg, yearCount: ja.count, recent: jeonse.slice(0, 5).map(r => ({ date: r.date, floor: r.floor, deposit: r.deposit, type: r.type })) },
    monthlyRentCount: rents.filter(r => r.monthly > 0 && r.date >= yearAgo).length,
  };
}

// ── 실행 ────────────────────────────────────────────
async function part(name, fn, out, errs) {
  try { out[name] = await fn(); log('ok', name); }
  catch (e) { errs.push(name + ': ' + e.message); log('ERR', name, e.message); }
}

(async () => {
  const doc = {}, errs = [];
  await part('fx', getFx, doc, errs);
  await part('rate', getRate, doc, errs);
  await part('cpi', getCpi, doc, errs);
  await part('rateHistory', getRateHistory, doc, errs);
  await part('fnf', getFnf, doc, errs);
  await part('home', getHome, doc, errs);
  doc.updatedAt = new Date().toISOString();
  if (errs.length) doc.errors = errs;

  // gen.py(Job Hunt)용 로컬 사본 — 환율 + F&F
  try {
    if (doc.fx) {
      const r = { date: doc.fx.date, source: doc.fx.source, updatedAt: doc.updatedAt };
      ['EUR', 'USD', 'GBP', 'CAD', 'AUD', 'CHF', 'DKK', 'JPY100'].forEach(k => { if (doc.fx[k]) r[k] = doc.fx[k]; });
      if (doc.fnf) r.fnf = doc.fnf;
      if (!DRY) { fs.mkdirSync(path.dirname(RATES_JSON), { recursive: true }); fs.writeFileSync(RATES_JSON, JSON.stringify(r, null, 1)); }
      log('rates.json', DRY ? '(dry)' : 'written');
    }
  } catch (e) { log('ERR rates.json', e.message); }

  if (DRY) { console.log(JSON.stringify(doc, null, 1)); return; }
  if (!doc.fx && !doc.rate && !doc.home) { log('모두 실패 — Firestore 안 씀'); process.exit(1); }

  const admin = require(path.join(__dirname, '..', 'ai-worker', 'node_modules', 'firebase-admin'));
  admin.initializeApp({ credential: admin.credential.applicationDefault(), projectId: PROJECT });
  // 실패한 부분은 merge 로 옛 값을 그대로 둔다
  await admin.firestore().collection('appSettings').doc('publicData').set(doc, { merge: true });
  if (!errs.length) await admin.firestore().collection('appSettings').doc('publicData').update({ errors: admin.firestore.FieldValue.delete() });
  log('done · fx', doc.fx && doc.fx.date, '· EUR', doc.fx && doc.fx.EUR, '· 매매', doc.home && doc.home.trades.length, '· errors', errs.length);
  process.exit(0);
})().catch(e => { log('FATAL', e.message); process.exit(1); });
