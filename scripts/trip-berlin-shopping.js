// 베를린 10/2(금) 패션 쇼핑 블록
//   ⚠️ 독일은 10/3(토) 통일기념일 + 10/4(일) 이틀 연속 가게가 닫는다.
//      토요일에 걸린 공휴일을 대체휴일로 넘기지 않아서 "일요일 규칙"이 이틀 이어진다.
//      → 독일에서 쇼핑할 수 있는 날은 10/1 오후와 10/2 뿐. 라이프치히는 아예 불가능.
//
//   동선은 지그재그를 없애려고 서 → 남서 → 동 → 남동 순으로 짰다.
//     포츠다머(서) → 베르크만(남서) → 오라니엔(동) → 노이쾰른(남동)
//   좌표는 전부 실제 주소를 지오코딩해서 넣었다 (지도 핀이 엉뚱한 데 안 찍히게).
//
// 사용: Travel 페이지에서
//   import('./scripts/trip-berlin-shopping.js?x='+Date.now())
//   atelierShop.preview()      ← 10/2 전체 타임라인을 기존 일정과 합쳐서 보여준다
//   atelierShop.apply()        ← 실제 추가
//   atelierShop.undo()         ← 되돌리기
window.atelierShop = (function () {
  const TRIP = 'I5T6Gu4qU1BtbHg2slYE';
  const DATE = '2026-10-02';
  const CITY = 'Berlin, 독일';
  const db = window.db;
  const BK = 'atelier_shop_backup';

  const ADD = [
    { time: '11:35', end_time: '11:55', title: '🚇 박물관섬 → 포츠다머 슈트라세',
      lat: 52.5022, lng: 13.3652,
      route_note: '박물관섬 → Potsdamer Str. 약 3.2km · U-Bahn 20분',
      description: '쇼핑 블록 시작. 오늘이 독일에서 가게 문 여는 마지막 날이야 — 10/3(통일기념일)·10/4(일) 이틀 다 닫아.' },

    { time: '12:00', end_time: '13:00', title: '🍽️ 점심 (포츠다머 슈트라세)',
      lat: 52.5022, lng: 13.3652,
      description: '무르쿠디스 주변에 카페·비스트로 많아. 여기서 든든히 먹고 오후를 쇼핑에 통째로 써.' },

    { time: '13:00', end_time: '14:15', title: '🛍️ Andreas Murkudis (편집숍)',
      lat: 52.5022, lng: 13.3652,
      description: 'Potsdamer Str. 81 · 77 · 98 세 곳. 옛 타게스슈피겔 신문사 인쇄소 자리, 약 930㎡.\n' +
        '패션·디자인·아트·가구를 같은 기준으로 큐레이션해. 주 고객이 아티스트·뮤지션·DJ·그래픽디자이너·건축가라는 게 성격을 말해줘.\n' +
        '★ 독일 라벨을 한자리에서 보기 제일 좋은 곳. 소재·봉제 디테일 보기에도 좋아.' },

    { time: '14:15', end_time: '14:35', title: '🚇 포츠다머 → 베르크만슈트라세',
      lat: 52.4902, lng: 13.3895,
      route_note: 'Potsdamer Str. → Bergmannstr. 약 2.3km · U2→U7 15분',
      description: '크로이츠베르크 남서쪽. 여기부터는 빈티지 구간이야.' },

    { time: '14:40', end_time: '15:40', title: '👗 베르크만슈트라세 빈티지 (킬로숍)',
      lat: 52.4902, lng: 13.3895,
      description: '3층짜리 빈티지 창고 — 종류별로 정리돼 있고 **무게(kg)로 값을 매긴다.**\n' +
        '거리 자체가 빈티지·레코드·카페 라인이라 걸으면서 보면 돼.\n' +
        '⏱️ 시간 빠듯하면 여기를 빼. 아래 두 곳이 더 중요해.' },

    { time: '15:40', end_time: '16:00', title: '🚇 베르크만 → 오라니엔슈트라세',
      lat: 52.5012, lng: 13.4211,
      route_note: 'Bergmannstr. → Oranienstr. 약 2.5km · 15분',
      description: '크로이츠베르크 동쪽으로 이동.' },

    { time: '16:00', end_time: '17:15', title: '🛍️ Voo Store (편집숍)',
      lat: 52.5012, lng: 13.4211,
      description: 'Oranienstraße 24 — **안뜰로 들어가야 나온다.** 옛 열쇠공방 자리.\n' +
        'Stüssy·Carhartt WIP 같은 스트리트웨어부터 Prada·Dries Van Noten까지 한 매장에.\n' +
        '★ 베를린 편집숍의 기준점. 스포츠웨어↔하이패션 사이를 어떻게 섞어 놓는지 보기 좋아.\n' +
        '같은 안뜰의 Companion Coffee 에서 한숨 돌리기 좋음.' },

    { time: '17:15', end_time: '17:35', title: '🚇 오라니엔 → 노이쾰른 베저슈트라세',
      lat: 52.4833, lng: 13.4413,
      route_note: 'Oranienstr. → Weserstr. 약 2.5km · U8 15분',
      description: '마지막 구간. 노이쾰른은 러프하고 값도 제일 착해.' },

    { time: '17:40', end_time: '19:00', title: '👗 노이쾰른 빈티지 (베저·잔더슈트라세)',
      lat: 52.4833, lng: 13.4413,
      description: '베를린 빈티지가 제일 빽빽하게 모인 구역. 한 블록 안에서 여러 집을 볼 수 있어.\n' +
        '· Juno Juno (Weserstr. 165) — 이탈리아 럭셔리 빈티지\n' +
        '· Wsiura Designer Vintage Archive (Sanderstr. 22)\n' +
        '· Sing Blackbird — 90s·00s 디자이너 위주\n' +
        '★ 아카이브 성격이라 소재·패턴 뜯어보기엔 여기가 제일 나아.' },

    { time: '19:15', end_time: '20:45', title: '🍽️ 저녁 (노이쾰른)',
      lat: 52.4833, lng: 13.4413,
      description: '쇼핑 끝내고 그 동네에서 바로. 베저슈트라세 일대가 저녁에 살아나.\n숙소(미테)까지 U8로 20분.' }
  ];

  const fmt = s => (s || '').slice(0, 44);

  async function dayItems() {
    const s = await db.collection('journey').where('trip_id', '==', TRIP).get();
    const out = [];
    s.forEach(d => { const o = d.data(); if (o.date === DATE) out.push({ id: d.id, o }); });
    out.sort((x, y) => (x.o.time || '').localeCompare(y.o.time || ''));
    return out;
  }

  async function preview() {
    console.log('%c[베를린 10/2 쇼핑 블록] 미리보기', 'font-weight:bold;font-size:14px;color:#6b38d4');
    const cur = await dayItems();
    const merged = cur.map(x => ({ 시각: x.o.time || '—', 항목: fmt(x.o.title), 구분: '기존' }))
      .concat(ADD.map(a => ({ 시각: a.time, 항목: fmt(a.title), 구분: '➕ 추가' })))
      .sort((a, b) => a.시각.localeCompare(b.시각));
    console.table(merged);

    // 같은 시각에 기존 일정이 있으면 눈에 띄게
    const clash = ADD.filter(a => cur.some(c => (c.o.time || '') === a.time));
    if (clash.length) {
      console.warn('⚠️ 같은 시각에 기존 일정이 있어:', clash.map(c => c.time + ' ' + fmt(c.title)));
    } else {
      console.log('%c시각 겹침 없음', 'color:#0a7');
    }
    console.log('%c괜찮으면 atelierShop.apply() — 되돌리려면 atelierShop.undo()', 'color:#c60;font-weight:bold');
    return merged.length;
  }

  async function apply() {
    const ids = [];
    for (const a of ADD) {
      const ref = db.collection('journey').doc();
      await ref.set(Object.assign({ trip_id: TRIP, type: '일정', date: DATE, city: CITY }, a));
      ids.push(ref.id);
      console.log('✅ ' + a.time + '  ' + fmt(a.title));
    }
    localStorage.setItem(BK, JSON.stringify(ids));
    console.log('%c완료 — ' + ids.length + '건 추가. 새로고침하면 보여.', 'font-weight:bold;color:#6b38d4');
    console.log('%c되돌리려면 atelierShop.undo()', 'color:#888');
  }

  async function undo() {
    const ids = JSON.parse(localStorage.getItem(BK) || '[]');
    if (!ids.length) { console.warn('되돌릴 기록이 없어.'); return; }
    for (const id of ids) { await db.collection('journey').doc(id).delete(); }
    localStorage.removeItem(BK);
    console.log('%c되돌림 — ' + ids.length + '건 삭제', 'font-weight:bold;color:#6b38d4');
  }

  console.log('%c준비됨 — atelierShop.preview() 부터', 'font-weight:bold;color:#6b38d4');
  return { preview, apply, undo, ADD };
})();
