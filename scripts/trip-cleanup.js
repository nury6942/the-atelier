// ① 체크리스트 항목 삭제  ② 🎫 제목·장문 메모 되돌리기
// ③ 앱 기본 표시(reservation:true / payment_status:'결제 예정')로 예약 필요 표시
// ④ 도시명 San Quirico → Castiglione d'Orcia
window.atelierClean = (function () {
  const db = window.db;
  const BK = 'atelier_clean_backup';

  const DELETE = ['jvOdZxui7iufn9YeWozU'];   // 출발 전 예약 체크리스트

  // 제목 원복 + reservation 표시
  const J = {
    // ── 일정: reservation:true → 분홍 테두리 + 사전예약 카운트
    Da3lttIrUjSDuZFxOGHF: { reservation: true },                       // 티웨이 출국
    '5VOawBW5q0mSSOjtY247': { reservation: true },                     // Europcar 픽업
    '2yc3a7IpsnEUvLzAWNXh': { reservation: true,
      title: '🎫 트레치메 유료도로 예약 (전날 23:59 마감)',
      description: '내일 트레치메 유료도로 €40. 전날 23:59가 마감이라 오늘 밤 안에 예약해야 해. 차량번호 필요할 수 있어.' },
    FDVbBatkkISYFZf270Gu: { reservation: true },                       // 트레치메 트레킹
    BXG58jsikQ6IHlTtsmci: { reservation: true,
      title: '🗻 Seceda (2,500m)',
      description: '⚠️ 2026년부터 케이블카 온라인 시간대 사전예약 필수. seceda.it에서 10:00 슬롯 잡을 것.\n해발 2,500m. 케이블카에서 내리면 톱니 능선이 정면으로 열려. 능선 따라 Pieralongia 방향으로 더 걸어도 좋아.' },
    W0ttn9Uy7LRWMCNPxqaH: { reservation: true },                       // 이지젯
    '9qw5ffRa5Q5nhFHlgolz': { reservation: true },                     // ICE
    qDjvQR1tcf1sslqbWoxR: { reservation: true },                       // 티웨이 귀국
    '1vxI5rU9PYBAZ72DzuAb': { reservation: false },                    // 알페 곤돌라는 예약 불필요

    // ── 카드: 제목 원복 + payment_status '결제 예정' → 앱이 결제예정으로 집계
    dc0ENJhfEXHHdB0qUck3: { title: '티웨이항공', payment_status: '결제 예정', status: '',
      notes: '9/24(목) ICN 12:35 → FCO 19:15 · 13H40 직항 · 왕복 ₩1,616,000' },
    rD7RUnsx2puTttiz04dT: { title: '티웨이항공', payment_status: '결제 예정', status: '',
      notes: '10/4(일) FRA 18:50 → 10/5(월) 14:00 ICN · 12H10 직항 · 일요일 운항 확인됨' },
    dZhJpR9YhFFANEOu70kF: { title: '이지젯', payment_status: '결제 예정', status: '',
      notes: '10/1(목) VCE 11:45 → BER 13:25 · 직항 1H40 · ₩134,827\n위탁 수하물 별도 — 예매 시 추가할 것' },
    dU0qdEpLIZbCgbQfVhjR: { title: 'Europcar — FIAT Grande Panda Hybrid (오토)',
      payment_status: '결제 예정', status: '확정',
      notes: 'FCO 픽업 9/25 08:30 → VCE 반납 10/1 10:40 · 6일\n방향이 뒤집혀서(기존 VCE→FCO) 재견적 필요. 편도 반납료 확인할 것.' },
    '3UJ9oefcwtAAoFrCFHum': { title: 'ICE: Leipzig Hbf → Frankfurt Hbf (약 3H)',
      payment_status: '결제 예정', status: '확정',
      notes: '10/4(일) 08:30 전후 출발 · 방향 역전이라 기존 표 사용 불가\nSuper Sparpreis €20~40 가능. 기존 표 환불 조건 확인할 것.' }
  };

  const CITY = { fz2LPA58Kq5n5nFgIrvB: { name: "Castiglione d'Orcia, 시에나 이탈리아" } };

  async function preview() {
    console.log('%c[정리] 미리보기', 'font-weight:bold;font-size:14px');
    for (const id of DELETE) {
      const d = await db.collection('journey').doc(id).get();
      console.log('삭제: ' + (d.exists ? d.data().title : '(이미 없음)'));
    }
    const rows = [];
    for (const id of Object.keys(J)) {
      const d = await db.collection('journey').doc(id).get();
      if (!d.exists) { console.error('❌ 없음:', id); return; }
      const o = d.data(), p = J[id];
      rows.push({ 날짜: o.date, 항목: String(p.title || o.title || '').slice(0, 30),
        표시: p.reservation === true ? '🎀 예약 필요' : p.reservation === false ? '(해제)' : (p.payment_status || '') });
    }
    console.table(rows);
    const c = await db.collection('trip_cities').doc('fz2LPA58Kq5n5nFgIrvB').get();
    console.log('도시명: ' + c.data().name + " → Castiglione d'Orcia, 시에나 이탈리아");
    console.log('%c진행하려면 → atelierClean.apply()', 'color:#2563eb;font-weight:bold');
  }

  async function apply() {
    const bk = { j: {}, del: {}, city: null };
    for (const id of DELETE) { const d = await db.collection('journey').doc(id).get(); if (d.exists) bk.del[id] = d.data(); }
    for (const id of Object.keys(J)) {
      const d = await db.collection('journey').doc(id).get();
      if (!d.exists) { console.error('❌ 없음, 중단:', id); return; }
      const o = d.data(), s = {}; Object.keys(J[id]).forEach(k => { s[k] = (o[k] === undefined ? null : o[k]); }); bk.j[id] = s;
    }
    const cd = await db.collection('trip_cities').doc('fz2LPA58Kq5n5nFgIrvB').get();
    bk.city = { name: cd.data().name };
    try { localStorage.setItem(BK, JSON.stringify(bk)); } catch (e) { console.warn('백업 실패:', e.message); }

    const b = db.batch();
    DELETE.forEach(id => b.delete(db.collection('journey').doc(id)));
    Object.keys(J).forEach(id => b.update(db.collection('journey').doc(id), J[id]));
    Object.keys(CITY).forEach(id => b.update(db.collection('trip_cities').doc(id), CITY[id]));
    await b.commit();

    console.log('%c✅ 완료 — 새로고침해줘', 'color:#16a34a;font-weight:bold;font-size:14px');
    console.log('   체크리스트 삭제 · 제목·메모 원복');
    console.log('   예약 필요 8건 → 일정 칸에 분홍 표시 + 사전예약 카운트');
    console.log('   결제 예정 5건 → 항공·렌트·기차 카드');
    console.log("   도시명 → Castiglione d'Orcia (일정 외 경고 해소)");
  }

  async function undo() {
    const bk = JSON.parse(localStorage.getItem(BK) || 'null');
    if (!bk) return console.error('백업이 없어.');
    const b = db.batch();
    Object.keys(bk.del).forEach(id => b.set(db.collection('journey').doc(id), bk.del[id]));
    Object.keys(bk.j).forEach(id => { const p = {}; Object.keys(bk.j[id]).forEach(k => { if (bk.j[id][k] !== null) p[k] = bk.j[id][k]; }); b.update(db.collection('journey').doc(id), p); });
    b.update(db.collection('trip_cities').doc('fz2LPA58Kq5n5nFgIrvB'), bk.city);
    await b.commit();
    console.log('%c↩️ 되돌림 완료', 'color:#f59e0b;font-weight:bold');
  }

  console.log('%c준비됨 → atelierClean.preview()', 'color:#2563eb;font-weight:bold;font-size:14px');
  return { preview, apply, undo };
})();
