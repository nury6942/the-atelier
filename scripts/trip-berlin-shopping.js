// 베를린 로컬·빈티지 걷기 — 10/1 저녁 + 10/2 오후 (v2)
//
//   v1 반성: 10/2 12:15~15:40 에 이미 있던 '유대인박물관(리베스킨트)' 위에 쇼핑을 얹어 겹쳤다.
//   v2 는 ① 그 시간을 절대 건드리지 않고 ② 끝나는 15:40 뒤로 붙이며
//      ③ 명품·대형 편집숍을 뺐다 (누리: "명품거리는 노잼, 사지도 못해").
//      남긴 건 '그 동네에만 있는 것' — 거리 자체, 로컬 가게, 빈티지.
//
//   ⚠️ 10/3(토) 통일기념일 + 10/4(일) 이틀 연속 가게가 닫는다.
//      토요일에 걸린 공휴일을 대체휴일로 안 넘겨서 "일요일 규칙"이 이틀 이어진다.
//      → 독일에서 가게 문 여는 날은 10/1 과 10/2 뿐. 라이프치히 쇼핑은 불가능.
//
// 사용: Travel 페이지에서
//   import('./scripts/trip-berlin-shopping.js?x='+Date.now())
//   atelierShop.preview()      ← v1 잔재 정리 후의 타임라인 + 겹침 검사
//   atelierShop.apply()        ← v1 을 먼저 지우고 v2 를 넣는다 (undo 를 따로 안 해도 됨)
//   atelierShop.undo()         ← v1·v2 전부 되돌리기
//   atelierShop.day()          ← 지금 일정 그대로 보기
window.atelierShop = (function () {
  const TRIP = 'I5T6Gu4qU1BtbHg2slYE';
  const CITY = 'Berlin, 독일';
  const db = window.db;
  const BK = 'atelier_shop_backup_v2';
  const BK_OLD = 'atelier_shop_backup';     // v1 이 남긴 것도 같이 치운다

  const ADD = [
    // ── 10/1 (목) 저녁 · 도착일. 숙소(미테)에서 도보 15분 / U8 한 정거장
    { date: '2026-10-01', time: '17:00', end_time: '18:30',
      title: '🚶 카스타니엔알레 걷기 (프렌츠라워베르크)',
      lat: 52.5382, lng: 13.4089,
      route_note: '숙소(Weinmeisterstr.) → Kastanienallee 도보 15분 · U8 한 정거장',
      description: '별명이 "Casting Alley" — 독립 브랜드·빈티지·작은 가게가 늘어선 길.\n' +
        '명품 거리가 아니라 동네 상점가에 가까워. 사러 가는 게 아니라 걷다가 마음에 들면 들어가는 식.\n' +
        '10/2 아침 미테 구간과 안 겹치게 일부러 다른 동네로 잡았어.' },

    { date: '2026-10-01', time: '18:45', end_time: '20:15',
      title: '🍽️ 저녁 (프렌츠라워베르크 / 미테)',
      lat: 52.5382, lng: 13.4089,
      description: '걷다가 눈에 띄는 데로. 숙소까지 도보 15분이라 부담 없어.' },

    // ── 10/2 (금) 오후 · 유대인박물관 15:40 종료 뒤부터
    { date: '2026-10-02', time: '15:45', end_time: '16:10',
      title: '🚶 유대인박물관 → 오라니엔슈트라세',
      lat: 52.5021, lng: 13.4169,
      route_note: 'Lindenstr. → Oranienstr. 약 1.3km · 도보 22분',
      description: '리베스킨트 건물에서 나와 크로이츠베르크 안쪽으로. 걸어가는 길 자체가 동네 구경이야.' },

    { date: '2026-10-02', time: '16:10', end_time: '17:30',
      title: '🚶 오라니엔슈트라세 + Voo Store (안뜰)',
      lat: 52.5012, lng: 13.4211,
      description: '크로이츠베르크 중심 거리. 터키계 상점·레코드숍·작은 브랜드가 섞여 있어.\n' +
        '· Voo Store — Oranienstraße 24, **안뜰로 들어가야 나온다.** 옛 열쇠공방 자리.\n' +
        '  살 거 없어도 공간이 볼 만해. 같은 안뜰 Companion Coffee 에서 쉬어가도 되고.\n' +
        '⏱️ 피곤하면 여기 건너뛰고 바로 노이쾰른으로 가도 돼.' },

    { date: '2026-10-02', time: '17:30', end_time: '17:50',
      title: '🚇 오라니엔 → 노이쾰른 베저슈트라세',
      lat: 52.4833, lng: 13.4413,
      route_note: 'U8 · 약 2.5km · 15분',
      description: '오늘의 마지막 구간.' },

    { date: '2026-10-02', time: '17:50', end_time: '19:00',
      title: '👗 노이쾰른 빈티지 (베저·잔더슈트라세)',
      lat: 52.4833, lng: 13.4413,
      description: '베를린 빈티지가 제일 빽빽한 구역. 한 블록 안에서 여러 집을 볼 수 있어.\n' +
        '· Juno Juno (Weserstr. 165) — 이탈리아 빈티지\n' +
        '· Wsiura Designer Vintage Archive (Sanderstr. 22)\n' +
        '· Sing Blackbird — 90s·00s 위주\n' +
        '★ 오늘 일정 중 제일 "여기서만" 인 곳. 아카이브 성격이라 소재·패턴 보기에도 좋아.' },

    { date: '2026-10-02', time: '19:15', end_time: '20:45',
      title: '🍽️ 저녁 (노이쾰른)',
      lat: 52.4833, lng: 13.4413,
      description: '베저슈트라세 일대가 저녁에 살아나. 숙소(미테)까지 U8 20분.' }
  ];

  const DATES = ['2026-10-01', '2026-10-02'];
  const fmt = s => (s || '').slice(0, 40);
  const mins = t => { const [h, m] = String(t || '0:0').split(':').map(Number); return h * 60 + m; };

  function oldIds() { try { return JSON.parse(localStorage.getItem(BK_OLD) || '[]'); } catch (e) { return []; } }

  // v1 이 넣어둔 항목은 '이미 없는 셈' 치고 본다 — apply() 가 먼저 지우기 때문
  async function load() {
    const s = await db.collection('journey').where('trip_id', '==', TRIP).get();
    const drop = oldIds();
    const by = {}, stale = [];
    DATES.forEach(d => by[d] = []);
    s.forEach(d => {
      const o = d.data();
      if (drop.indexOf(d.id) >= 0) { stale.push({ id: d.id, o }); return; }
      if (by[o.date]) by[o.date].push({ id: d.id, o });
    });
    DATES.forEach(d => by[d].sort((x, y) => (x.o.time || '').localeCompare(y.o.time || '')));
    by._stale = stale;
    return by;
  }

  async function day() {
    const by = await load();
    for (const d of DATES) {
      console.log('%c■ ' + d + '  현재 ' + by[d].length + '건', 'font-weight:bold;color:#6b38d4');
      console.table(by[d].map(x => ({ 시각: x.o.time || '—', 끝: x.o.end_time || '—', 항목: fmt(x.o.title) })));
    }
    return by;
  }

  async function preview() {
    console.log('%c[베를린 로컬·빈티지 걷기 v2] 미리보기', 'font-weight:bold;font-size:14px;color:#6b38d4');
    const by = await load();
    if (by._stale.length) {
      console.log('%c🧹 v1 로 넣었던 ' + by._stale.length + '건은 apply() 때 자동으로 지워져 — 아래 표엔 이미 빠져 있어',
        'color:#e11d48;font-weight:bold');
      console.table(by._stale.map(x => ({ 날짜: x.o.date, 시각: x.o.time || '—', 지울항목: fmt(x.o.title) })));
    }
    let clash = 0;
    for (const d of DATES) {
      const cur = by[d], mine = ADD.filter(a => a.date === d);
      const rows = cur.map(x => ({ 시각: x.o.time || '—', 끝: x.o.end_time || '—', 항목: fmt(x.o.title), 구분: '기존' }))
        .concat(mine.map(a => ({ 시각: a.time, 끝: a.end_time, 항목: fmt(a.title), 구분: '➕ 추가' })))
        .sort((p, q) => p.시각.localeCompare(q.시각));
      console.log('%c■ ' + d, 'font-weight:bold;color:#6b38d4');
      console.table(rows);
      // 시간대가 실제로 겹치는지 (시작만 같은지가 아니라 구간으로)
      mine.forEach(a => {
        cur.forEach(c => {
          const cs = mins(c.o.time), ce = mins(c.o.end_time || c.o.time);
          if (mins(a.time) < ce && cs < mins(a.end_time)) {
            console.warn('⚠️ 겹침: ' + a.time + '–' + a.end_time + ' ' + fmt(a.title) +
              '  ↔  ' + (c.o.time || '?') + '–' + (c.o.end_time || '?') + ' ' + fmt(c.o.title));
            clash++;
          }
        });
      });
    }
    if (!clash) console.log('%c✅ 겹치는 시간 없음', 'font-weight:bold;color:#0a7');
    else console.log('%c위 ' + clash + '건을 먼저 보고 결정해줘', 'color:#e11d48;font-weight:bold');
    console.log('%c괜찮으면 atelierShop.apply()', 'color:#c60;font-weight:bold');
    return clash;
  }

  async function apply() {
    // ★ v1 잔재를 먼저 치운다 — undo() 를 따로 돌릴 필요 없게
    const drop = oldIds();
    if (drop.length) {
      let n = 0;
      for (const id of drop) { try { await db.collection('journey').doc(id).delete(); n++; } catch (e) {} }
      localStorage.removeItem(BK_OLD);
      console.log('%c🧹 v1 ' + n + '건 삭제', 'color:#e11d48;font-weight:bold');
    }
    const ids = [];
    for (const a of ADD) {
      const ref = db.collection('journey').doc();
      const o = Object.assign({ trip_id: TRIP, type: '일정', city: CITY }, a);
      await ref.set(o);
      ids.push(ref.id);
      console.log('✅ ' + a.date.slice(5) + ' ' + a.time + '  ' + fmt(a.title));
    }
    localStorage.setItem(BK, JSON.stringify(ids));
    console.log('%c완료 — ' + ids.length + '건. 새로고침하면 보여.', 'font-weight:bold;color:#6b38d4');
  }

  async function undo() {
    let n = 0;
    for (const key of [BK, BK_OLD]) {
      const ids = JSON.parse(localStorage.getItem(key) || '[]');
      for (const id of ids) { try { await db.collection('journey').doc(id).delete(); n++; } catch (e) {} }
      localStorage.removeItem(key);
    }
    console.log(n ? '%c되돌림 — ' + n + '건 삭제 (v1 잔재 포함). 새로고침해줘.' : '%c되돌릴 게 없어.',
      'font-weight:bold;color:#6b38d4');
  }

  // ═══ 진단 — 지금 그 날짜에 뭐가 있고 뭐가 깨졌는지 전부 ═══
  //   겹침이 계속 남는 이유를 추측으로 찾다 계속 틀려서, 실제 데이터를 보고 고치기로 함.
  let _last = [];
  const GERMANY = ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04'];
  async function audit(dates) {
    // 인자 없으면 독일 구간 전체(10/1~10/4)를 한 번에 본다
    const want = dates ? [].concat(dates) : GERMANY;
    const s = await db.collection('journey').where('trip_id', '==', TRIP).get();
    _last = [];
    for (const d of want) {
      const rows = [];
      s.forEach(doc => { const o = doc.data(); if (o.date === d) rows.push({ id: doc.id, o }); });
      rows.sort((x, y) => (x.o.time || '').localeCompare(y.o.time || ''));

      const table = rows.map(r => {
        const st = r.o.time || '', en = r.o.end_time || '';
        const rev = st && en && mins(en) < mins(st);
        const n = _last.push(r);                       // 1부터
        return { '#': n, 시각: st || '—', 끝: en || '—',
                 문제: rev ? '⛔ 끝이 시작보다 빠름' : '',
                 항목: fmt(r.o.title) };
      });

      // 구간 겹침
      for (let i = 0; i < rows.length; i++) {
        for (let j = i + 1; j < rows.length; j++) {
          const a = rows[i].o, b = rows[j].o;
          const ae = mins(a.end_time || a.time), bs = mins(b.time);
          if (!a.time || !b.time) continue;
          if (bs < ae && mins(a.time) < mins(b.end_time || b.time)) {
            const ri = table.find(t => t.항목 === fmt(a.title));
            const rj = table.find(t => t.항목 === fmt(b.title));
            if (ri) ri.문제 = (ri.문제 ? ri.문제 + ' · ' : '') + '⚠️ 겹침';
            if (rj) rj.문제 = (rj.문제 ? rj.문제 + ' · ' : '') + '⚠️ 겹침';
          }
        }
      }
      // 제목 중복
      const seen = {};
      rows.forEach(r => {
        const k = String(r.o.title || '').replace(/[^\wㄱ-ㅎ가-힣A-Za-z]/g, '').toLowerCase().slice(0, 10);
        if (!k) return;
        if (seen[k]) {
          const t = table.find(t => t.항목 === fmt(r.o.title));
          if (t) t.문제 = (t.문제 ? t.문제 + ' · ' : '') + '🔁 제목 중복';
        }
        seen[k] = true;
      });

      console.log('%c■ ' + d + '  ' + rows.length + '건', 'font-weight:bold;font-size:13px;color:#6b38d4');
      console.table(table);
    }
    console.log('%c지울 게 있으면 atelierShop.rm(번호) 또는 atelierShop.rm(3,7,9)', 'color:#c60;font-weight:bold');
    console.log('%c시각을 고치려면 atelierShop.setTime(번호, "13:00", "14:15")', 'color:#c60');
    return _last.length;
  }

  // 5/14 시드에 있던 베를린 원안 항목들이 아직 어딘가 살아있는지 — 여행 전체에서 찾는다
  const SEED_KEYS = ['Reichstag', '리히스탁', 'Tiergarten', '티어가르텐', '전승기념탑',
                     'Voo', '빅토리아', 'Viktoria', 'Burgermeister', '유대인', 'Jüdisches'];
  async function seed() {
    const s = await db.collection('journey').where('trip_id', '==', TRIP).get();
    const hit = [];
    s.forEach(d => {
      const o = d.data(), t = String(o.title || '');
      if (SEED_KEYS.some(k => t.indexOf(k) >= 0)) hit.push({ 날짜: o.date || '—', 시각: (o.time || '—') + '–' + (o.end_time || '—'), 항목: fmt(t) });
    });
    hit.sort((a, b) => (a.날짜 + a.시각).localeCompare(b.날짜 + b.시각));
    console.log('%c[5/14 원안 항목이 지금 남아있는 것] ' + hit.length + '건', 'font-weight:bold;color:#6b38d4');
    console.table(hit);
    const missing = ['Reichstag 돔', '티어가르텐', 'Voo Store', '빅토리아 공원', 'Burgermeister']
      .filter(n => !hit.some(h => h.항목.indexOf(n.split(' ')[0]) >= 0));
    if (missing.length) console.warn('사라진 것: ' + missing.join(' · '));
    return hit.length;
  }

  async function rm() {
    const ns = [].slice.call(arguments);
    if (!ns.length) { console.warn('번호를 줘. 예: atelierShop.rm(3,7)'); return; }
    for (const n of ns) {
      const r = _last[n - 1];
      if (!r) { console.warn('#' + n + ' 없음'); continue; }
      await db.collection('journey').doc(r.id).delete();
      console.log('🗑️ #' + n + '  ' + (r.o.time || '') + ' ' + fmt(r.o.title));
    }
    console.log('%c삭제 완료 — atelierShop.audit() 로 다시 확인', 'font-weight:bold;color:#6b38d4');
  }

  async function setTime(n, start, end) {
    const r = _last[n - 1];
    if (!r) { console.warn('#' + n + ' 없음'); return; }
    await db.collection('journey').doc(r.id).update({ time: start, end_time: end || '' });
    console.log('🕘 #' + n + '  ' + fmt(r.o.title) + '  →  ' + start + (end ? '–' + end : ''));
  }

  // ═══ 10/1·10/2 한 번에 정리 ═══
  //   audit() 로 드러난 것: ① 유대인박물관 끝이 15:40 으로 잘못 박혀 오후 전체가 밀렸고
  //   ② 그 바람에 세 항목의 end_time 이 start 보다 앞서 있으며 ③ 내가 넣은 v2 가 겹쳤다.
  //   제목 일부로 찾아 지우고/시각 고치고/새로 넣는다.
  const PLAN_DEL = [                         // 제목에 이 문자열이 있으면 삭제
    ['2026-10-01', '카스타니엔알레'],           // 내가 넣은 것 — 기존 하케셔마르크트와 겹침
    ['2026-10-01', '저녁 (프렌츠라워베르크'],    // 내가 넣은 것 — 기존 저녁 2건과 겹침
    ['2026-10-02', '노이에스 박물관'],           // 유물 전시 — 취향 아님 (합의됨)
    ['2026-10-02', '하케셔마르크트 샵'],         // 10/1 저녁 하케셔마르크트와 중복
    ['2026-10-02', '안드레아스 무르쿠디스'],     // 명품 편집숍 — 취향 아님
    ['2026-10-02', '파노라마풍크트'],            // 유료 전망대 → 템펠호퍼 펠트로 대체
    ['2026-10-02', '유대인박물관 → 오라니엔'],   // 내가 넣은 도보 — 앞 일정이 바뀌어 불필요
    ['2026-10-02', '미테 저녁']                  // 노이쾰른에서 끝나므로 저녁도 거기서
  ];
  const PLAN_TIME = [                         // [날짜, 제목조각, 시작, 끝]
    ['2026-10-02', 'Father Carpenter', '09:15', '10:15'],       // 끝=시작(0분) 이던 것
    ['2026-10-02', '유대인박물관 (리베스킨트', '12:45', '13:30'],  // ★ 45분 — 상설전 스킵, 건물만
    ['2026-10-02', '점심 대충', '13:40', '14:20'],
    ['2026-10-02', '노이에 나치오날갈레리', '14:35', '15:35'],     // 14:30–13:15 뒤집힘 복구
    ['2026-10-02', '오라니엔슈트라세 + Voo', '15:55', '17:05'],
    ['2026-10-02', '오라니엔 → 노이쾰른', '17:05', '17:15'],
    ['2026-10-02', '노이쾰른 빈티지', '17:15', '18:15'],
    ['2026-10-02', '저녁 (노이쾰른', '19:30', '21:00'],
    ['2026-10-04', '체크아웃 + 캐리어 맡기기', '08:00', '11:00']   // 11:00–08:00 뒤집힘 복구
  ];
  const PLAN_ADD = [
    { date: '2026-10-02', time: '10:30', end_time: '12:00',
      title: '🌳 티어가르텐 + 전승기념탑', lat: 52.5145, lng: 13.3501,
      route_note: '미테 → Tiergarten · U-Bahn 15분',
      description: '★ 5/14 원안에 있던 항목을 되살린 것 (베를린이 3박→2박 되며 사라졌었어).\n' +
        '도심 한복판 210만㎡ 숲 공원. 10월 초면 단풍이 들기 시작해.\n' +
        '가운데 전승기념탑(Siegessäule) 285계단을 오르면 공원 전체와 시내가 내려다보여.' },
    { date: '2026-10-02', time: '18:25', end_time: '19:15',
      title: '🛬 템펠호퍼 펠트 — 활주로에서 일몰', lat: 52.4773, lng: 13.4246,
      route_note: '베저슈트라세 → Herrfurthstr. 입구 약 1.3km · 도보 22분',
      description: '옛 공항 300만㎡가 통째로 공원. 활주로 두 개가 그대로 남아 있어 —\n' +
        '그 위에서 자전거 타고 연 날리고 텃밭 가꿔. 폐허가 아니라 동네 공원이야.\n' +
        '★ 도심에서 지평선이 보이는 건 여기뿐. 무료.\n' +
        '⏰ 오늘 일몰 18:41 · 10월엔 19:00 에 닫아. 닫혀도 회전문으로 나올 수 있어.' },
    { date: '2026-10-03', time: '17:50', end_time: '18:30',
      title: '⚠️ 파사주 루프 — 오늘 상점 휴무 (통일기념일)', lat: 51.3397, lng: 12.3731,
      description: '10/3 은 통일기념일이라 **가게가 다 닫혀.** 메들러 파사주 같은 건물 안은\n' +
        '지나다닐 수 있지만 쇼핑은 안 돼. 건물·유리지붕 구경만 하고 저녁으로 넘어가.\n' +
        '(10/4 일요일도 마찬가지 — 독일은 토요일에 걸린 공휴일을 대체휴일로 안 넘긴다)' }
  ];

  async function _find(date, frag) {
    const s = await db.collection('journey').where('trip_id', '==', TRIP).get();
    const hit = [];
    s.forEach(d => {
      const o = d.data();
      if (o.date === date && String(o.title || '').indexOf(frag) >= 0) hit.push({ id: d.id, o });
    });
    return hit;
  }

  async function plan() {
    console.log('%c[10/1·10/2 정리안] 미리보기', 'font-weight:bold;font-size:14px;color:#6b38d4');
    const del = [];
    for (const [d, f] of PLAN_DEL) (await _find(d, f)).forEach(h => del.push({ 날짜: d, 시각: h.o.time || '—', 지울항목: fmt(h.o.title) }));
    console.log('%c🗑️ 삭제 ' + del.length + '건', 'color:#e11d48;font-weight:bold'); console.table(del);

    const tm = [];
    for (const [d, f, a, b] of PLAN_TIME) (await _find(d, f)).forEach(h => tm.push({ 날짜: d, 항목: fmt(h.o.title), 지금: (h.o.time || '—') + '–' + (h.o.end_time || '—'), 바꿀값: a + '–' + b }));
    console.log('%c🕘 시각 보정 ' + tm.length + '건', 'color:#c60;font-weight:bold'); console.table(tm);

    console.log('%c➕ 신규 ' + PLAN_ADD.length + '건', 'color:#0a7;font-weight:bold');
    console.table(PLAN_ADD.map(a => ({ 날짜: a.date, 시각: a.time + '–' + a.end_time, 항목: fmt(a.title) })));
    console.log('%c괜찮으면 atelierShop.applyPlan()', 'color:#c60;font-weight:bold');
  }

  async function applyPlan() {
    let dn = 0, tn = 0, an = 0;
    for (const [d, f] of PLAN_DEL) for (const h of await _find(d, f)) { await db.collection('journey').doc(h.id).delete(); dn++; console.log('🗑️ ' + fmt(h.o.title)); }
    for (const [d, f, a, b] of PLAN_TIME) for (const h of await _find(d, f)) { await db.collection('journey').doc(h.id).update({ time: a, end_time: b }); tn++; console.log('🕘 ' + fmt(h.o.title) + ' → ' + a + '–' + b); }
    for (const a of PLAN_ADD) { const ref = db.collection('journey').doc(); await ref.set(Object.assign({ trip_id: TRIP, type: '일정', city: CITY }, a)); an++; console.log('➕ ' + fmt(a.title)); }
    localStorage.removeItem(BK); localStorage.removeItem(BK_OLD);
    console.log('%c완료 — 삭제 ' + dn + ' · 보정 ' + tn + ' · 추가 ' + an + '. 새로고침하면 보여.', 'font-weight:bold;color:#6b38d4');
    console.log('%c확인은 atelierShop.audit()', 'color:#888');
  }

  console.log('%c준비됨 — atelierShop.audit() (10/1~10/4 전체) · atelierShop.seed() (5/14 원안 생존 확인)',
    'font-weight:bold;color:#6b38d4');
  return { audit, seed, plan, applyPlan, rm, setTime, day, preview, apply, undo, ADD };
})();
