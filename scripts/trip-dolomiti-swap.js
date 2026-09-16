// 돌로미티 9/28 ↔ 9/30 맞바꾸기
//   트레치메 유료도로(iPASS)가 9/28은 10:30까지 매진, 9/30만 오전 슬롯이 남아서 하루를 통째로 교환.
//   · 9/28 트레치메·란드로·코르티나  →  9/30
//   · 9/30 세체다·오르티세이·파소 가르데나  →  9/28
//   · 트레치메 입장 시각을 실제 예약한 슬롯에 맞춰 보정
//   · 9/27 밤 "유료도로 예약해라" 알림 → "번호판 등록 확인"으로 교체
//   · 9/25 저녁에 "iPASS 번호판 등록" 항목 신규 (안 하면 게이트에서 막힘)
//
// 숙소는 4박 내내 몬구엘포 하나라 동선·거리는 그대로. 날짜만 바뀐다.
//
// 사용: Travel 페이지 "2026 독일&이탈리아" 활성 → F12 → Console → 통째로 붙여넣기 → Enter
//       크롬이 막으면 콘솔에 allow pasting 을 타이핑하고 Enter (처음 한 번만)
//       붙여넣고 Enter 치기 전에 마지막 줄이 })(); 인지 확인 — 두 번 겹치면 SyntaxError
window.atelierSwap = (function () {
  const TRIP = 'I5T6Gu4qU1BtbHg2slYE';
  const db = window.db;
  const BK = 'atelier_swap_backup';

  const A = '2026-09-28';          // 지금 트레치메 날
  const B = '2026-09-30';          // 지금 세체다 날
  const SLOT = '10:00';            // ★ iPASS에서 실제로 예약한 입장 시각으로 바꿔줘 (09:30 / 10:00 / 10:30)

  const MOVE_ID = 'GQd2VZc9hOxhhIFDWy2M';   // 몬구엘포 → 미주리나 이동
  const TRE_ID  = 'FDVbBatkkISYFZf270Gu';   // 트레치메
  const WARN_ID = '2yc3a7IpsnEUvLzAWNXh';   // 9/27 밤 알림

  // 숙소·렌트카 같은 예약 레코드는 건드리지 않는다
  const KEEP = ['숙소', '렌트카', '항공', '이동수단'];

  // "10:00"에서 분 단위로 빼기/더하기
  function shift(t, m) {
    const [h, i] = t.split(':').map(Number);
    const v = ((h * 60 + i + m) + 1440) % 1440;
    return String(Math.floor(v / 60)).padStart(2, '0') + ':' + String(v % 60).padStart(2, '0');
  }

  // 트레치메 날 시각 — 몬구엘포에서 45km·55분이라 슬롯 1시간 전 출발
  const TIME = {
    [MOVE_ID]: { time: shift(SLOT, -60), end_time: shift(SLOT, -5) },
    [TRE_ID]:  { time: SLOT,             end_time: '14:30' }
  };

  const WARN = {
    time: '21:30', end_time: '21:45',
    title: '✅ 트레치메 예약 확인 — 번호판 등록됐나?',
    description:
      '트레치메는 9/30으로 옮겼고 유료도로(€40)는 이미 결제 완료야.\n' +
      '· 확인할 것 하나 — iPASS에 렌트카 번호판이 들어가 있는지\n' +
      '· 게이트가 번호판을 자동으로 읽어서 열려. 비어 있으면 예약이 있어도 못 들어가\n' +
      '· 아직이면 지금 등록해. pass.auronzo.info 로그인 → 예약 → 차량 추가'
  };

  const NEW = [{
    date: '2026-09-25', time: '21:00', end_time: '21:15',
    title: '🚗 iPASS에 렌트카 번호판 등록 (트레치메)',
    city: "Castiglione d'Orcia, 시에나 이탈리아",
    description:
      '오늘 로마에서 받은 차 번호판을 iPASS 예약에 넣어둘 것. 5분이면 돼.\n' +
      '· pass.auronzo.info 로그인 → 예약 → 차량 추가 → 번호판 입력\n' +
      '· 9/30 트레치메 주차장 게이트가 번호판을 읽어서 열려. 비어 있으면 €40 내고도 못 들어가\n' +
      '· 확인 메일·QR은 캡처해서 저장 (산간은 데이터가 불안정해)'
  }];

  async function load() {
    const s = await db.collection('journey').where('trip_id', '==', TRIP).get();
    const a = [], b = [];
    s.forEach(d => {
      const o = d.data();
      if (o.type && KEEP.includes(o.type)) return;
      if (o.date === A) a.push({ id: d.id, o });
      if (o.date === B) b.push({ id: d.id, o });
    });
    a.sort((x, y) => (x.o.time || '').localeCompare(y.o.time || ''));
    b.sort((x, y) => (x.o.time || '').localeCompare(y.o.time || ''));
    return { a, b };
  }

  async function preview() {
    console.log('%c[돌로미티 9/28 ↔ 9/30 맞바꾸기] 미리보기', 'font-weight:bold;font-size:14px');
    const { a, b } = await load();
    if (!a.length || !b.length) return console.error('❌ 두 날짜 중 한쪽이 비어 있어. 날짜를 확인해줘.');

    console.log('\n■ ' + A + ' → ' + B + '  (' + a.length + '건)');
    console.table(a.map(x => ({ 시각: x.o.time || '—', 항목: String(x.o.title || x.o.city || '').slice(0, 34) })));
    console.log('\n■ ' + B + ' → ' + A + '  (' + b.length + '건)');
    console.table(b.map(x => ({ 시각: x.o.time || '—', 항목: String(x.o.title || x.o.city || '').slice(0, 34) })));

    console.log('\n■ 트레치메 시각 보정 (예약 슬롯 ' + SLOT + ' 기준)');
    for (const id of Object.keys(TIME)) {
      const d = await db.collection('journey').doc(id).get();
      if (!d.exists) { console.warn('   ⚠️ 문서 없음, 이 건은 건너뜀:', id); continue; }
      const o = d.data();
      console.log('   ' + String(o.title || '').slice(0, 30) + ' : ' +
        (o.time || '—') + '~' + (o.end_time || '—') + ' → ' + TIME[id].time + '~' + TIME[id].end_time);
    }

    const w = await db.collection('journey').doc(WARN_ID).get();
    console.log('\n■ 9/27 밤 알림 : ' + (w.exists ? '"' + String(w.data().title || '').slice(0, 30) + '" → "번호판 등록됐나?"' : '⚠️ 문서 없음, 건너뜀'));
    console.log('■ 9/25 신규 1건 : ' + NEW[0].title);

    console.log('%c\n진행하려면 → atelierSwap.apply()', 'color:#2563eb;font-weight:bold');
  }

  async function apply() {
    const { a, b } = await load();
    if (!a.length || !b.length) return console.error('❌ 두 날짜 중 한쪽이 비어 있어. 중단.');

    const bk = { date: {}, time: {}, warn: null, added: [] };
    a.forEach(x => { bk.date[x.id] = A; });
    b.forEach(x => { bk.date[x.id] = B; });

    for (const id of Object.keys(TIME)) {
      const d = await db.collection('journey').doc(id).get();
      if (!d.exists) continue;
      const o = d.data();
      bk.time[id] = { time: o.time ?? null, end_time: o.end_time ?? null };
    }
    const w = await db.collection('journey').doc(WARN_ID).get();
    if (w.exists) {
      const o = w.data(), s = {};
      Object.keys(WARN).forEach(k => { s[k] = (o[k] === undefined ? null : o[k]); });
      bk.warn = s;
    }

    const batch = db.batch();
    a.forEach(x => batch.update(db.collection('journey').doc(x.id), { date: B }));
    b.forEach(x => batch.update(db.collection('journey').doc(x.id), { date: A }));
    Object.keys(bk.time).forEach(id => batch.update(db.collection('journey').doc(id), TIME[id]));
    if (bk.warn) batch.update(db.collection('journey').doc(WARN_ID), WARN);
    await batch.commit();

    const nb = db.batch();
    NEW.forEach(n => { const r = db.collection('journey').doc(); bk.added.push(r.id); nb.set(r, Object.assign({ type: '일정', trip_id: TRIP }, n)); });
    await nb.commit();

    try { localStorage.setItem(BK, JSON.stringify(bk)); console.log('백업 저장 완료'); }
    catch (e) { console.warn('백업 저장 실패:', e.message, '— 되돌리기는 못 써'); }

    console.log('%c✅ 완료 — 새로고침해줘', 'color:#16a34a;font-weight:bold;font-size:14px');
    console.log('   9/28  세체다 · 오르티세이 · 파소 가르데나');
    console.log('   9/29  알페 디 시우시 (그대로)');
    console.log('   9/30  트레치메 ' + SLOT + ' 입장 · 란드로 · 코르티나');
    console.log('%c   ⚠️ 9/25 차 받으면 iPASS에 번호판 등록 — 안 하면 게이트에서 막혀', 'color:#f59e0b;font-weight:bold');
    console.log('   ※ 세체다 케이블카는 아직 미구매 — 날씨 보고 9/28·9/29 중에 정하면 돼');
  }

  async function undo() {
    const bk = JSON.parse(localStorage.getItem(BK) || 'null');
    if (!bk) return console.error('백업이 없어.');
    const b = db.batch();
    Object.keys(bk.date).forEach(id => b.update(db.collection('journey').doc(id), { date: bk.date[id] }));
    Object.keys(bk.time).forEach(id => {
      const p = {}; Object.keys(bk.time[id]).forEach(k => { if (bk.time[id][k] !== null) p[k] = bk.time[id][k]; });
      b.update(db.collection('journey').doc(id), p);
    });
    if (bk.warn) {
      const p = {}; Object.keys(bk.warn).forEach(k => { if (bk.warn[k] !== null) p[k] = bk.warn[k]; });
      b.update(db.collection('journey').doc(WARN_ID), p);
    }
    (bk.added || []).forEach(id => b.delete(db.collection('journey').doc(id)));
    await b.commit();
    console.log('%c↩️ 되돌림 완료 — 새로고침해줘', 'color:#f59e0b;font-weight:bold');
  }

  console.log('%c준비됨 → atelierSwap.preview()', 'color:#2563eb;font-weight:bold;font-size:14px');
  return { preview, apply, undo };
})();
