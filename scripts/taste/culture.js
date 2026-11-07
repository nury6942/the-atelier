#!/usr/bin/env node
// ═══════════════════════════════════════════════════════════
//  Taste 수집기 (문화생활: 전시 · 공연 · 영화) → Firestore tasteItems (아이맥 월·목, run.sh 가 collect.js 다음에 부름)
//
//  국내: NOL(인터파크) 랭킹 · 네이버 검색 목록(전시중·내한공연·JX/김재중/김준수·현재상영·개봉예정)
//        · 미술관 '현재 전시' 페이지 · X/Threads 추천 글 · 인스타 전시/공연 큐레이터
//        → claude 가 프로필 「4. 문화생활 취향」으로 고름 → 상세 페이지를 다시 읽어 기간·가격·장소를 확인(없으면 뺌)
//        공연은 서울만. JX·김재중·김준수 관련 공연은 기간이 맞으면 늘 넣음.
//  해외: 아뜰리에 trips·trip_cities 에서 다가오는 여행 도시와 날짜 → 도시마다 유명 미술관(그 기간 전시, 아직
//        발표 전이면 미술관 자체 permanent) + 유명 공연장(그 기간 공연). 미술관·공연장 공식 페이지를 Aside 로 읽어 확인.
//        해외는 카드가 아직 없는 여행 도시가 있거나 매달 첫 월요일에만, 한 번에 5도시씩(카드 적은 도시부터). --abroad 로 강제.
//  영화: 현재 상영·개봉 예정·최근 OTT, 일본 작품 제외. 네이버 영화 칸에서 감독·국가·러닝타임 확인.
//  사진(포스터·전시장/공연장 사진)은 진짜만, 못 찾으면 그 카드는 뺀다.
//
//  수동: node scripts/taste/culture.js [--dry] [--abroad] [--cities=5] [--no-korea] [--backfill]
// ═══════════════════════════════════════════════════════════

const fs = require('fs');
const os = require('os');
const path = require('path');
const L = require('./lib');
const { log, norm, docId } = L;

const ARGS = process.argv.slice(2);
const DRY = ARGS.includes('--dry');
const BACKFILL = ARGS.includes('--backfill');
const FORCE_ABROAD = ARGS.includes('--abroad');
const ABROAD_CITIES = Number((ARGS.find((a) => /^--cities=\d+$/.test(a)) || '=5').split('=')[1]);
const NO_KOREA = ARGS.includes('--no-korea');
const CAP = { exhibition: 5, performance: 4, film: 4 };
const ABROAD_CAP = { exhibition: 3, performance: 2 };          // 도시마다
const KINDS = Object.keys(CAP);
const WORK = fs.mkdtempSync(path.join(os.tmpdir(), 'atelier-culture-'));
const T0 = Date.now();
const left = (dl) => dl - Date.now();
const JX_RX = /JX|김재중|김준수|KIM\s*JAE\s*JOONG|JAEJOONG|XIA|준수|JUNSU|JYJ|동방신기/i;
const SEOUL_REGIONS = ['종로·서촌·북촌', '용산·한남·이태원', '강남·청담·서초', '성수·성동', '마포·홍대·연남', '송파·잠실', '여의도·영등포', '서울 그 외'];

// 미술관 '현재 전시' 페이지 (Aside 로 열어 확인한 주소)
const MUSEUM_PAGES = [
  'https://www.mmca.go.kr/exhibitions/progressList.do',          // 국립현대미술관
  'https://apma.amorepacific.com/contents/exhibition/index.do',   // 아모레퍼시픽미술관
  'https://www.songeun.or.kr/',                                   // 송은
  'https://piknic.kr/home/',                                      // 피크닉
  'https://www.daelimmuseum.org/',                                // 대림미술관·디뮤지엄
  'https://www.leeumhoam.org/leeum/exhibition',                   // 리움
];
// 인스타 전시·공연 큐레이터 — 프로필을 직접 열어 확인한 계정만 (팔로워 2026-11-07, 5만 이상). 공연 전문은 5만 넘는 곳을 못 찾음
const CULTURE_CURATORS = [
  // CULTURE_CURATORS_START
  'artart.today',          // 915K 아트아트
  'place_archive',         // 322K 플레이스 아카이브 — 전시·팝업·공간·디자인
  'halmi.art',             // 173K 할미아트
  'dayoff_mag',            // 72K  데이오프 — 전시·팝업·디자인·공간
  'artlamp_org',           // 53K  아트램프
  // CULTURE_CURATORS_END
];

function ymd(s) {
  const m = String(s || '').match(/(\d{2,4})[.\-/]\s*(\d{1,2})[.\-/]\s*(\d{1,2})/);
  if (!m) return '';
  const y = m[1].length === 2 ? '20' + m[1] : m[1];
  return y + '-' + m[2].padStart(2, '0') + '-' + m[3].padStart(2, '0');
}

async function downloadAll(list, prefix, nFor) {
  await Promise.all(list.map(async (c, i) => {
    c.id = prefix + i;
    c.files = [];
    for (const [j, u] of (c.images || []).slice(0, nFor(c)).entries()) {
      const f = await L.fetchImage(u, path.join(WORK, c.id + '_' + j + '.jpg'));
      if (f) c.files.push(path.basename(f));
    }
  }));
}

async function claudeJson(prompt, dl, model = 'opus') {
  let raw;
  try { raw = await L.runClaude(prompt, model, Math.max(150e3, left(dl) - 60e3), WORK); }
  catch (e) { log('  claude ' + model + ' 실패, sonnet:', e.message); raw = await L.runClaude(prompt, 'sonnet', Math.max(120e3, left(dl) - 20e3), WORK); }
  try { return L.parseJson(raw); } catch (e) { throw new Error('claude 결과 해석 실패: ' + raw.slice(0, 200)); }
}

// 고른 항목의 상세 페이지를 다시 읽어 기간·가격·장소(영화는 감독·국가 등)를 확인한다
async function verify(picks, byId, dl, today) {
  const urlOf = (p) => {
    const c = byId[p.cand] || {};
    if (p.kind === 'film') return 'https://search.naver.com/search.naver?query=' + encodeURIComponent('영화 ' + p.title);
    if (/nol\.yanolja\.com\/ticket\/products/.test(c.url || '')) return c.url;
    if (p.detailUrl && /^https?:/.test(p.detailUrl)) return p.detailUrl;
    return 'https://search.naver.com/search.naver?query=' + encodeURIComponent(p.title + ' ' + (p.venue || ''));
  };
  const urls = [...new Set(picks.map(urlOf))];
  const pages = {};
  const focus = {};
  for (const p of picks) { const u = urlOf(p); if (/search\.naver/.test(u)) focus[u] = p.title.replace(/[［\[].*?[］\]]\s*/g, '').slice(0, 12); }
  for (let i = 0; i < urls.length && left(dl) > 120e3; i += 12) {
    for (const r of await L.aside({ mode: 'pages', urls: urls.slice(i, i + 12), chars: 4500, scroll: true, focus, wait: 4000 })) pages[r.url] = r;
  }
  log('[culture] 상세 페이지', Object.keys(pages).length, '/', urls.length);
  const rows = picks.map((p, i) => {
    const pg = pages[urlOf(p)];
    return `### v${i} [${p.kind}] ${p.title}\n고른 값: ${JSON.stringify(p)}\n상세 페이지(${urlOf(p)}):\n${pg ? pg.text : '(못 읽음)'}`;
  }).join('\n\n');
  const prompt = `오늘은 ${today}. 각 항목의 '상세 페이지' 글을 근거로 값을 확인·보정해라. 상세 페이지(또는 고른 값의 원래 후보 글)에 **적힌 것만** 쓴다. 지어내기 금지.
- 전시·공연: start, end (YYYY-MM-DD), venue, price(예 "무료", "15,000원", "R 99,000 / S 77,000원", "€18") 가 모두 확인돼야 한다. 하나라도 확인 안 되면 drop:true.
  city(서울·부산… / 해외는 도시 한국어 이름), country("한국" 또는 나라 한국어 이름).
  region: 서울이면 장소 위치로 다음 중 하나 — ${SEOUL_REGIONS.join(' / ')}. 서울 밖 국내는 "경기·인천" 또는 시/도 이름.
- 영화: director, year, runtime("107분"), release(YYYY-MM-DD, 모르면 ""), country(제작 국가). 일본 작품이면 drop:true. where 는 고른 값 유지(극장/OTT 이름).
출력은 코드 블록 하나, JSON 배열: [{"v":"v0","drop":false,"start":"","end":"","venue":"","price":"","city":"","country":"","region":"","director":"","year":"","runtime":"","release":""}]

${rows}`;
  const res = await claudeJson(prompt, dl, 'sonnet');
  const out = {};
  for (const r of res) { const i = Number(String(r.v || '').slice(1)); if (picks[i]) out[i] = Object.assign(r, { pageImages: (pages[urlOf(picks[i])] || {}).images || [] }); }
  return out;
}

async function korea(db, existing, ctx) {
  const dl = Date.now() + 17 * 60e3;
  const { today, profile, seenTitle, igSeen, ex } = ctx;
  const horizon = L.kstDate(new Date(Date.now() + 42 * 864e5));
  const sources = {};
  const cands = [];
  const add = (list, tag) => { for (const c of list) if (c && (c.text || '').length > 8) cands.push(Object.assign({ tag }, c)); sources[tag] = (sources[tag] || 0) + list.length; };
  add(await L.aside({ mode: 'nol', genres: ['exhibition', 'concert', 'classic', 'play'], max: 15 }), 'nol');
  add(await L.aside({ mode: 'naver-list', queries: [{ q: '서울 전시회', pages: 4 }, { q: '내한공연', pages: 2 }, { q: '김재중 콘서트' }, { q: '김준수 콘서트' }, { q: 'JX 콘서트' }] }), 'naver');
  add(await L.aside({ mode: 'naver-list', queries: [{ q: '현재상영영화', pages: 3 }, { q: '개봉예정영화', pages: 2 }] }), 'naver');
  log('[culture] NOL', sources.nol || 0, '· 네이버', sources.naver || 0);
  if (left(dl) > 9 * 60e3) add(await L.aside({ mode: 'pages', urls: MUSEUM_PAGES, links: true }), 'museum');
  if (left(dl) > 8.5 * 60e3) add(await L.aside({ mode: 'x-search', q: '넷플릭스 영화 추천', since: new Date(Date.now() - 14 * 864e5).toISOString().slice(0, 10), scrolls: 2 }), 'x');
  if (left(dl) > 8 * 60e3) add(await L.aside({ mode: 'threads-search', q: '영화 추천 왓챠 넷플릭스', scrolls: 2 }), 'threads');
  if (CULTURE_CURATORS.length && left(dl) > 7.5 * 60e3) {
    const got = await L.aside({ mode: 'ig-profile', handles: CULTURE_CURATORS, n: 10, skip: Object.keys(igSeen) });
    for (const c of got) igSeen[c.url] = new Date().toISOString();
    add(got, 'curator');
  }
  log('[culture] 미술관', sources.museum || 0, '· X', sources.x || 0, '· Threads', sources.threads || 0, '· 큐레이터', sources.curator || 0);

  const social = cands.filter((c) => ['x', 'threads'].includes(c.tag)).sort((a, b) => (b.likes || 0) - (a.likes || 0)).slice(0, 14);
  const list = [...cands.filter((c) => !['x', 'threads'].includes(c.tag)), ...social];
  await downloadAll(list, 'k', (c) => (c.tag === 'museum' ? 6 : 2));
  log('[culture] 거르기 대상', list.length);

  const candText = list.map((c) => [
    '### ' + c.id + ' [' + c.tag + (c.genre ? '/' + c.genre : '') + (c.list ? '/' + c.list : '') + '] ' + (c.title || c.pageTitle || '') + ' ' + (c.url || ''),
    (c.text || '').slice(0, c.tag === 'museum' ? 2200 : 600),
    c.imageAlts ? '사진 설명: ' + c.imageAlts.map((a, j) => j + ':' + a).join(' / ') : '',
    c.links && c.links.length ? '링크: ' + c.links.join(' / ') : '',
    c.files.length ? '사진 파일: ' + c.files.join(', ') : '사진 없음',
  ].filter(Boolean).join('\n')).join('\n\n');

  const prompt = `너는 누리의 문화생활 큐레이터다. 오늘은 ${today}. 아래 후보(티켓 랭킹·네이버 목록·미술관 현재 전시·추천 글)에서 누리 취향에 맞는 것을 골라 JSON 으로만 답해라.
전시(exhibition) 최대 ${CAP.exhibition + 3}개, 공연(performance) 최대 ${CAP.performance + 3}개, 영화(film) 최대 ${CAP.film + 3}개.

## 누리 취향
${profile}

## 누리가 저장/다녀온 것
${ex(['saved', 'done'])}

## 누리가 '별로'라고 한 것
${ex(['nope'])}

## 이미 카드가 있는 제목 (다시 고르지 말 것)
${existing.filter((e) => KINDS.includes(e.kind)).map((e) => e.title).slice(-250).join(', ') || '(없음)'}

## 규칙
- 제목·장소·기간은 후보 글에 **적힌 그대로만**. 지어내기 금지.
- 전시·공연: ${today} 에 진행 중이거나 ${horizon} 전에 시작하고, 끝나는 날이 ${today} 이후인 것만.
- 공연: **서울에서 하는 것만**(인천·경기·지방 X). 내한 공연·인디 위주, 재즈·클래식 소규모·연극·무용도 섞기. 아이돌·팬미팅은 기본 제외하되 **JX·김재중·김준수 관련 공연은 날짜가 맞으면 반드시 포함**. 아동·가족 공연 제외.
- 전시: 현대미술·건축·디자인·사진·공예 기획전. 캐릭터·체험형·몰입형 미디어아트·엑스포류 제외. 서울 위주.
- 영화: 현재 상영작/개봉 예정작 또는 최근 OTT 작품. **일본 작품(애니 포함) 제외**. 「콜 미 바이 유어 네임」 같은 결을 특히 좋아하고, 장르 안 가리고 잘 만든 작품이면 OK. where 는 "극장" 또는 OTT 이름.
- photo: 그 후보의 사진 파일 중 **공식 포스터나 전시장·작품·공연 사진**(필요하면 Read 로 확인). 로고·배너 광고·다른 작품 사진이면 "". 미술관 페이지는 사진 설명(alt)을 참고.
- why: 누리에게 맞는 이유 한 줄, 40자 이내. detail: 1~2줄 짧게.
- detailUrl: 미술관 후보는 '링크' 목록에서 그 전시의 상세 페이지 주소를 골라 넣는다(관람료 확인용). 모르면 "".
- 잘 맞는 순서로. 애매하면 빼라.

## 출력 (코드 블록 하나, JSON 배열만)
[{"cand":"k3","kind":"exhibition","title":"…","venue":"…","start":"2026-10-01","end":"2026-12-27","price":"","detailUrl":"","why":"…","detail":"…","tags":["현대미술"],"photo":"k3_0.jpg"},
 {"cand":"k9","kind":"film","title":"…","where":"극장","why":"…","detail":"…","tags":["드라마"],"photo":"k9_0.jpg"}]

## 후보
${candText}`;
  const picks = (await claudeJson(prompt, dl)).filter((p) => p && p.title && CAP[p.kind] && !seenTitle.has(norm(p.title)));
  log('[culture] claude 고른 것', picks.length);
  const byId = Object.fromEntries(list.map((c) => [c.id, c]));
  const ver = picks.length ? await verify(picks, byId, dl, today) : {};

  const docs = [];
  picks.forEach((p, i) => {
    const c = byId[p.cand] || {};
    const v = ver[i];
    if (!v || v.drop) { log('  - 확인 안 돼 뺌:', p.title); return; }
    const isJx = JX_RX.test(p.title);
    if (docs.filter((d) => d.doc.kind === p.kind).length >= CAP[p.kind] + (isJx ? 1 : 0)) return;
    let meta;
    if (p.kind === 'film') {
      if (/일본/.test(v.country || '')) { log('  - 일본 작품이라 뺌:', p.title); return; }
      meta = { where: p.where || '극장', director: v.director || '', year: String(v.year || ''), runtime: v.runtime || '', release: ymd(v.release) || '', country: v.country || '' };
    } else {
      const start = ymd(v.start), end = ymd(v.end);
      if (!start || !end || !v.price || !v.venue || end < today || start > horizon) { log('  - 기간·가격 안 맞아 뺌:', p.title, start, end, v.price); return; }
      if (p.kind === 'performance' && v.city !== '서울') { log('  - 서울 밖 공연이라 뺌:', p.title, v.city); return; }
      meta = { venue: v.venue, start, end, price: v.price, country: v.country || '한국', city: v.city || '서울', region: v.region || '서울 그 외',
        ticketUrl: /nol\.yanolja|ticket|museum|\.kr|\.org/.test(c.url || '') && c.tag !== 'naver' ? c.url : (p.detailUrl || '') };
    }
    const doc = {
      kind: p.kind, title: String(p.title).trim(),
      subtitle: p.kind === 'film' ? [meta.where, meta.director].filter(Boolean).join(' · ') : [meta.region, meta.venue].filter(Boolean).join(' · '),
      why: String(p.why || '').trim().slice(0, 40), detail: String(p.detail || '').trim(),
      tags: Array.isArray(p.tags) ? p.tags.map(String).slice(0, 6) : [],
      src: { type: ['x', 'threads', 'instagram'].includes(c.src) ? c.src : 'web', url: c.url || '', author: c.author || '', likes: c.likes || 0 },
      meta, batch: today, addedAt: new Date().toISOString(),
    };
    if (p.kind !== 'film') doc.mapUrl = L.mapUrl(meta.venue, true);
    const photo = p.photo && (c.files || []).includes(path.basename(p.photo)) ? path.join(WORK, path.basename(p.photo)) : null;
    seenTitle.add(norm(p.title));
    docs.push({ id: docId(p.kind, p.title), doc, photo, c, extra: (v.pageImages || []).slice(0, 3) });   // 상세 페이지 포스터(og:image 등)
  });
  return { docs, sources, candidates: list.length, dl };
}

async function abroad(db, existing, ctx) {
  const dl = Date.now() + 13 * 60e3;
  const { today, profile, seenTitle } = ctx;
  const until = L.kstDate(new Date(Date.now() + 365 * 864e5));
  const trips = [];
  (await db.collection('trips').get()).forEach((d) => { const t = d.data(); if (t.start_date > today && t.start_date <= until) trips.push(Object.assign({ id: d.id }, t)); });
  if (!trips.length) { log('[abroad] 1년 안 여행 없음'); return { docs: [] }; }
  const cities = [];
  (await db.collection('trip_cities').get()).forEach((d) => { const c = d.data(); const t = trips.find((x) => x.id === c.trip_id); if (t && c.name && c.start_date) cities.push(Object.assign({ trip: t }, c)); });
  cities.sort((a, b) => a.start_date.localeCompare(b.start_date));
  // 한 번에 다 돌면 길어서, 아직 카드가 적은 도시부터 5곳씩 (다음 실행이 나머지)
  const covered = (c) => existing.filter((e) => e.meta && e.meta.trip && e.meta.city === c.name).length;
  const chosen = new Set([...cities].sort((a, b) => covered(a) - covered(b) || a.start_date.localeCompare(b.start_date)).slice(0, ctx.abroadCities || 5).map((c) => c.name));
  cities.splice(0, cities.length, ...cities.filter((c) => chosen.has(c.name)));
  const tripMeta = (t) => ({ id: t.id, name: t.start_date.slice(0, 7).replace('-', '.') + ' ' + String(t.name || '').replace(/^\d{4}\s*/, '').replace(/\s*여행$/, ''), start: t.start_date, end: t.end_date });
  log('[abroad] 여행', trips.map((t) => tripMeta(t).name).join(' / '), '· 도시', cities.length);

  // 1) 도시마다 유명 미술관·공연장과 공식 페이지 주소 (claude 지식) → 2) Aside 로 실제로 열어 확인
  const cityText = cities.map((c) => `- ${c.name} (${c.start_date} ~ ${c.end_date || c.start_date}, ${c.nights || 0}박) · 여행 ${tripMeta(c.trip).name}`).join('\n');
  const plan = await claudeJson(`누리의 해외 여행 도시별로 꼭 가 볼 만한 **미술관·갤러리**(현대미술 우선, 도시당 최대 ${ABROAD_CAP.exhibition}곳)와 **유명 공연장**(오케스트라·오페라·콘서트홀, 도시당 최대 ${ABROAD_CAP.performance}곳)을 골라라. 작은 마을이라 마땅한 곳이 없으면 비워라.
각 곳마다 공식 사이트의 '전시 목록' 또는 '공연 일정' 페이지 주소(listUrl)와 '관람 안내/입장료' 페이지 주소(visitUrl, 공연장은 "")를 네가 아는 대로 적어라(틀려도 됨 — 다음 단계에서 실제로 열어 확인한다).
누리 취향:\n${profile}\n
도시:\n${cityText}\n
출력은 코드 블록 하나, JSON 배열: [{"city":"암스테르담","country":"네덜란드","kind":"exhibition","name":"Stedelijk Museum Amsterdam","listUrl":"https://…","visitUrl":"https://…"}]`, dl);
  const places = plan.filter((p) => p && p.name && p.listUrl && cities.some((c) => c.name === p.city));
  const urls = [...new Set(places.flatMap((p) => [p.listUrl, p.visitUrl].filter((u) => /^https?:/.test(u || ''))))].slice(0, 40);
  log('[abroad] 미술관·공연장', places.length, '· 열 페이지', urls.length);
  const pages = {};
  for (let i = 0; i < urls.length && left(dl) > 5 * 60e3; i += 10) {
    for (const r of await L.aside({ mode: 'pages', urls: urls.slice(i, i + 10), chars: 4000, scroll: true })) pages[r.url] = r;
  }
  const opened = places.filter((p) => pages[p.listUrl] && pages[p.listUrl].text.length > 200);
  log('[abroad] 실제로 열린 곳', opened.length);
  const list = opened.map((p) => ({ place: p, images: (pages[p.listUrl].images || []).slice(0, 4), imageAlts: (pages[p.listUrl].imageAlts || []).slice(0, 4) }));
  await downloadAll(list, 'a', () => 4);
  const rows = list.map((x) => {
    const p = x.place, c = cities.find((cc) => cc.name === p.city);
    const v = p.visitUrl && pages[p.visitUrl] ? pages[p.visitUrl].text.slice(0, 2000) : '';
    return `### ${x.id} [${p.kind}] ${p.name} · ${p.city}(${p.country}) · 누리 머무는 날 ${c.start_date} ~ ${c.end_date || c.start_date}
목록 페이지 ${pages[p.listUrl].finalUrl}:\n${pages[p.listUrl].text}\n${v ? '관람 안내 페이지:\n' + v : ''}
사진 설명: ${x.imageAlts.map((a, j) => j + ':' + a).join(' / ')}
사진 파일: ${x.files.join(', ') || '없음'}`;
  }).join('\n\n');
  const items = await claudeJson(`누리의 해외 여행 도시에서 갈 만한 전시·공연을 미술관·공연장 공식 페이지 글을 근거로 골라라. 페이지에 **적힌 것만** 쓴다(제목·기간·가격). 지어내기 금지.
- 전시: 누리가 그 도시에 머무는 날과 기간이 겹치는 전시(start/end 가 페이지에 있어야 함). 그 기간 전시가 아직 발표 안 됐으면 미술관 자체를 permanent:true 로 하나(title=미술관 이름, start/end 는 누리 머무는 날로).
- 공연: 누리 머무는 날에 그 공연장에서 하는 오케스트라·클래식·피아노 리사이틀·오페라·뮤지컬(날짜가 페이지에 있어야 함). 없으면 넣지 않는다.
- price: 페이지의 입장료/티켓 가격(예 "€22.50", "DKK 145", "€15–€95"). 페이지에 없으면 "".
- 도시당 전시 ${ABROAD_CAP.exhibition}개·공연 ${ABROAD_CAP.performance}개 이내. 현대미술·건축·디자인 우선.
- photo: 그 곳의 사진 파일 중 건물·전시장·작품·공연장 진짜 사진(Read 로 확인), 로고·글자 배너면 "".
- why: 누리에게 맞는 이유 한 줄 40자 이내. detail: 1~2줄.
누리 취향:\n${profile}
출력은 코드 블록 하나, JSON 배열: [{"src":"a0","kind":"exhibition","title":"…","venue":"…","city":"암스테르담","country":"네덜란드","start":"2027-05-05","end":"2027-05-07","permanent":false,"price":"€22.50","ticketUrl":"https://…","why":"…","detail":"…","tags":["현대미술"],"photo":"a0_1.jpg"}]

${rows}`, dl);
  const byId = Object.fromEntries(list.map((x) => [x.id, x]));
  const docs = [];
  for (const it of items) {
    const x = byId[it.src];
    if (!x || !it.title || !['exhibition', 'performance'].includes(it.kind)) continue;
    const c = cities.find((cc) => cc.name === (it.city || x.place.city));
    if (!c) continue;
    const start = ymd(it.start), end = ymd(it.end), cEnd = c.end_date || c.start_date;
    if (!start || !end || end < c.start_date || start > cEnd) { log('  - 여행 날짜와 안 겹쳐 뺌:', it.title, start, end); continue; }
    const title = String(it.title).trim();
    if (seenTitle.has(norm(title))) continue;
    seenTitle.add(norm(title));
    const meta = { venue: it.venue || x.place.name, start, end, price: it.price || '', country: it.country || x.place.country, city: c.name, region: c.name,
      ticketUrl: it.ticketUrl || pages[x.place.listUrl].finalUrl, trip: tripMeta(c.trip) };
    if (it.permanent) meta.permanent = true;
    const doc = {
      kind: it.kind, title, subtitle: [c.name, meta.venue !== title ? meta.venue : ''].filter(Boolean).join(' · '),
      why: String(it.why || '').trim().slice(0, 40), detail: String(it.detail || '').trim(),
      tags: Array.isArray(it.tags) ? it.tags.map(String).slice(0, 6) : [],
      src: { type: 'web', url: pages[x.place.listUrl].finalUrl, author: x.place.name, likes: 0 },
      mapUrl: L.mapUrl(meta.venue + ' ' + c.name, false),
      meta, batch: today, addedAt: new Date().toISOString(),
    };
    const photo = it.photo && x.files.includes(path.basename(it.photo)) ? path.join(WORK, path.basename(it.photo)) : null;
    const wl = await L.wikiLead(x.place.name, 'en');
    docs.push({ id: docId(it.kind, title), doc, photo, c: { src: 'web' }, q: meta.venue + ' ' + c.name, extra: [...(x.images || []).slice(0, 2), wl].filter(Boolean) });
  }
  return { docs, dl };
}

async function main() {
  log('[culture] 시작', DRY ? '(dry)' : '', BACKFILL ? '(backfill)' : '');
  const db = L.initDb();
  const existing = [];
  (await db.collection('tasteItems').get()).forEach((d) => existing.push(Object.assign({ id: d.id }, d.data())));
  if (BACKFILL) return backfill(db, existing);

  const today = L.kstDate();
  const ctx = {
    today, profile: L.profileSection(4), igSeen: L.loadSeen(), abroadCities: ABROAD_CITIES,
    seenTitle: new Set(existing.map((e) => norm(e.title))),
    ex: (st) => existing.filter((e) => KINDS.includes(e.kind) && st.includes(e.status)).slice(-25)
      .map((e) => '- [' + e.kind + '] ' + e.title + (e.subtitle ? ' (' + e.subtitle + ')' : '')).join('\n') || '(아직 없음)',
  };
  const all = [];
  const run = { at: new Date().toISOString() };
  if (!NO_KOREA) {
    try { const k = await korea(db, existing, ctx); all.push(...k.docs); run.sources = k.sources; run.candidates = k.candidates; }
    catch (e) { log('[culture] 국내 실패', e.message); run.koreaError = e.message; }
  }
  // 해외: 매달 첫 월요일, 아직 해외 카드가 없을 때, 또는 --abroad
  const d = new Date(Date.now() + 9 * 3600e3);
  const abroadCities = new Set(existing.filter((e) => e.meta && e.meta.trip).map((e) => e.meta.city));
  const tripCities = [];
  (await db.collection('trip_cities').get()).forEach((x) => { const c = x.data(); if ((c.start_date || '') > today && (c.start_date || '') <= L.kstDate(new Date(Date.now() + 365 * 864e5))) tripCities.push(c.name); });
  const uncovered = tripCities.filter((n) => !abroadCities.has(n)).length;
  if (FORCE_ABROAD || uncovered || (d.getUTCDay() === 1 && d.getUTCDate() <= 7)) {
    try { const a = await abroad(db, existing, ctx); all.push(...a.docs); run.abroad = a.docs.length; }
    catch (e) { log('[abroad] 실패', e.message); run.abroadError = e.message; }
  }

  // 사진 없는 카드 → 이름으로 찾기 (공연장·미술관·포스터)
  const need = all.filter((x) => !x.photo);
  if (need.length) {
    const got = await L.photoFill(need.map((x) => ({
      key: x.id, name: x.doc.title + (x.doc.meta.venue && x.doc.meta.venue !== x.doc.title ? ' (' + x.doc.meta.venue + ')' : ''), kind: x.doc.kind,
      ig: x.doc.kind !== 'film', q: x.q || (x.doc.kind === 'film' ? '영화 ' + x.doc.title : x.doc.title + ' ' + (x.doc.meta.venue || '')),
      posts: ['x', 'threads', 'instagram'].includes(x.c.src) ? [x.c.url] : [], extra: x.extra || [],
    })), WORK, Date.now() + 8 * 60e3);
    for (const x of need) if (got[x.id]) x.photo = got[x.id];
    log('[culture] 사진 채움', Object.keys(got).length, '/', need.length);
  }

  const written = [];
  let noPhoto = 0;
  for (const x of all) {
    if (!x.photo) { noPhoto++; log('  - 사진 없어 뺌:', x.doc.title); continue; }
    if ((await db.collection('tasteItems').doc(x.id).get()).exists) continue;
    x.doc.image = L.dataUrl(x.photo);
    written.push(x.doc);
    if (!DRY) await db.collection('tasteItems').doc(x.id).set(x.doc, { merge: true });
    const m = x.doc.meta;
    log('  +', x.doc.kind, x.doc.title, '|', x.doc.subtitle, '|', x.doc.why, '|', m.start ? m.start + '~' + m.end + ' ' + m.price + (m.permanent ? ' (상설)' : '') : m.where + ' ' + (m.release || ''), '|', m.trip ? m.trip.name : (m.region || ''), '|', Math.round(x.doc.image.length * 0.75 / 1024) + 'KB');
  }
  if (!DRY) L.saveSeen(ctx.igSeen);
  Object.assign(run, { written: written.length, dry: DRY, droppedNoPhoto: noPhoto, minutes: +((Date.now() - T0) / 60000).toFixed(1) });
  if (!DRY) await db.collection('tasteRuns').doc(today).set({ culture: run }, { merge: true });
  log('[culture] 끝', JSON.stringify(run));
}

async function backfill(db, existing) {
  const todo = existing.filter((e) => KINDS.includes(e.kind) && !e.image);
  log('[culture] 사진 없는 카드', todo.length);
  const got = await L.photoFill(todo.map((e) => ({ key: e.id, name: e.title, kind: e.kind, ig: e.kind !== 'film',
    q: e.kind === 'film' ? '영화 ' + e.title : e.title + ' ' + ((e.meta && e.meta.venue) || '') })), WORK, Date.now() + 10 * 60e3);
  for (const e of todo) {
    if (!got[e.id]) continue;
    if (!DRY) await db.collection('tasteItems').doc(e.id).set({ image: L.dataUrl(got[e.id]) }, { merge: true });
    log('  + 사진', e.title);
  }
}

main()
  .catch((e) => { log('[culture] 실패', (e && e.message) || e); process.exitCode = 1; })
  .finally(() => { try { fs.rmSync(WORK, { recursive: true, force: true }); } catch (e) {} setTimeout(() => process.exit(), 500); });
