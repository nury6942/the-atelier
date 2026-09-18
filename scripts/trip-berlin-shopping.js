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

  console.log('%c준비됨 — atelierShop.preview() → atelierShop.apply()  (v1 은 apply 가 알아서 치움)',
    'font-weight:bold;color:#6b38d4');
  return { day, preview, apply, undo, ADD };
})();
