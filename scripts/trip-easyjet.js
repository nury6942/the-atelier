// 이지젯 예약 확정 반영 (KD7JB6V) + 장부 링크 오류 수정
window.atelierEJ = (function () {
  const db = window.db;
  const BK = 'atelier_ej_backup';
  const TRIP = 'I5T6Gu4qU1BtbHg2slYE';

  // €103.48 × 1,619.41 (ECB 2026-08-21) = ₩167,577
  const KRW = 167577;

  const NOTE =
    '🎫 예약번호 KD7JB6V · EJU5086 (2026-08-24 결제)\n' +
    '💳 €103.48 = 운임 45.49 + 23kg 위탁 57.99 · VISA 4913 (₩167,577)\n' +
    '🧳 위탁 23kg 1개 + 기내 좌석 밑 소형가방 1개(45×36×20) — Light 운임이라 기내 캐리어 불가\n' +
    '💺 좌석 미지정 — 체크인 때 자동 배정\n' +
    '⏰ 온라인 체크인 오픈 9/1(화) 18:45 (30일 전) · 수하물 위탁 09:45~11:05 · 체크인 마감 출발 40분 전\n' +
    '📍 도착 BER 터미널 1\n' +
    '⚠️ 환불 불가 · 변경은 수수료. 예약 후 24시간 내에만 취소 가능(수수료 차감)';

  const J = {
    // ① 항공편 카드
    dZhJpR9YhFFANEOu70kF: {
      title: '이지젯', city: 'EJU5086', route: 'VCE → BER (T1)',
      time: '11:45', arrive: '13:25', duration: '1H 40M',
      description: 'Light 운임 + 위탁 23kg · 1H40 직항 · BER 터미널 1 도착',
      fare_type: 'Light + 23kg 위탁',
      baggage: '위탁 23kg 1개 + 기내 소형가방 1개 (45×36×20)',
      seat_number: '체크인 시 자동 배정',
      pnr: 'KD7JB6V',
      amount: String(KRW),
      status: '확정',
      payment_status: '결제 완료', payment_date: '2026-08-24',
      payment_method: '€103.48 (운임 45.49 + 위탁 57.99) · VISA 4913',
      notes: NOTE,
      // ★ 링크 오류: 이 카드가 '라이언에어 미사용 손실' 행을 가리키고 있었어.
      //   그대로 두면 카드를 저장할 때마다 그 손실 행이 이지젯 금액으로 덮어써져.
      finance_id: 'MUArhHa6D0o027eS8dyP'
    },
    // ② 일정 카드
    W0ttn9Uy7LRWMCNPxqaH: {
      title: '✈️ EJU5086 · VCE → 베를린 BER (T1)',
      time: '11:45', end_time: '13:25',
      reservation: false,
      description:
        '✅ 예약 완료 KD7JB6V · Light + 위탁 23kg\n' +
        '수하물 위탁 09:45 오픈 ~ 11:05 마감 (출발 40분 전) · 좌석은 체크인 때 자동 배정\n' +
        '⚠️ 렌트 반납 10:00 → 위탁 마감 11:05, 여유 65분. 주유는 공항 진입 전에 미리.'
    }
  };

  // ③ 10/1 아침에 수하물 항목 추가
  const ADD = [
    { trip_id: TRIP, type: '일정', date: '2026-10-01', time: '10:40',
      city: 'Venezia, 이탈리아', title: '🧳 수하물 위탁 (마감 11:05)',
      description: 'easyJet Bag Drop 09:45 오픈 ~ 11:05 마감. 23kg 1개 이미 결제됨(KD7JB6V).\n렌트 반납 10:00 → 터미널까지 셔틀 몇 분. 늦으면 위탁 못 부치고 비행기 놓쳐.' }
  ];

  const F = {
    // 이지젯 장부
    MUArhHa6D0o027eS8dyP: {
      date: '2026-08-24', paid_date: '2026-08-24',
      description: '이지젯 EJU5086 · VCE→BER 10/1 · Light + 위탁 23kg (KD7JB6V)',
      amount: String(KRW), currency: 'KRW', unpaid: false,
      fx_amount: '', fx_currency: ''
    },
    // 라이언에어 미사용 손실 — 이지젯 카드와 잘못 묶여 있던 링크 해제 + 환율 재환산 정지
    RlKSIeLZ1NRKxyThp7TY: {
      journey_id: '', fx_amount: '', fx_currency: ''
    }
  };

  async function preview() {
    console.log('%c[이지젯 확정] 미리보기', 'font-weight:bold;font-size:14px');
    const miss = [];
    for (const id of Object.keys(J)) { const d = await db.collection('journey').doc(id).get(); if (!d.exists) miss.push('journey/' + id); }
    for (const id of Object.keys(F)) { const d = await db.collection('finance').doc(id).get(); if (!d.exists) miss.push('finance/' + id); }
    if (miss.length) { console.error('❌ 없는 문서:', miss); return; }

    const o = (await db.collection('journey').doc('dZhJpR9YhFFANEOu70kF').get()).data();
    console.table([
      { 항목: '예약번호', 지금: o.pnr || '(없음)', 바꿀값: 'KD7JB6V' },
      { 항목: '운임', 지금: o.fare_type || '', 바꿀값: 'Light + 23kg 위탁' },
      { 항목: '금액', 지금: '₩' + Number(o.amount || 0).toLocaleString(), 바꿀값: '₩' + KRW.toLocaleString() },
      { 항목: '결제', 지금: o.payment_status || '', 바꿀값: '결제 완료 (8/24)' },
      { 항목: '장부 링크', 지금: o.finance_id || '', 바꿀값: 'MUArhHa6D0o027eS8dyP' }
    ]);
    console.log('\n⚠️ 링크 오류 발견 — 이지젯 카드가 「라이언에어 미사용 손실」 행(' + o.finance_id + ')을 가리키고 있었어.');
    console.log('   그대로 두면 카드 저장할 때마다 그 손실 행이 이지젯 금액으로 덮어써져. 이번에 바로잡아.');
    console.log('\n■ 추가'); ADD.forEach(a => console.log('   ' + a.date + ' ' + a.time + ' ' + a.title));
    console.log('%c\n진행하려면 → atelierEJ.apply()', 'color:#2563eb;font-weight:bold');
  }

  async function apply() {
    const bk = { j: {}, f: {}, added: [] };
    for (const id of Object.keys(J)) {
      const d = await db.collection('journey').doc(id).get();
      if (!d.exists) { console.error('❌ 없음, 중단:', id); return; }
      const o = d.data(), s = {}; Object.keys(J[id]).forEach(k => { s[k] = (o[k] === undefined ? null : o[k]); }); bk.j[id] = s;
    }
    for (const id of Object.keys(F)) {
      const d = await db.collection('finance').doc(id).get();
      if (!d.exists) { console.error('❌ 없음, 중단:', id); return; }
      const o = d.data(), s = {}; Object.keys(F[id]).forEach(k => { s[k] = (o[k] === undefined ? null : o[k]); }); bk.f[id] = s;
    }
    const b = db.batch();
    Object.keys(J).forEach(id => b.update(db.collection('journey').doc(id), J[id]));
    Object.keys(F).forEach(id => b.update(db.collection('finance').doc(id), F[id]));
    ADD.forEach(a => { const ref = db.collection('journey').doc(); bk.added.push(ref.id); b.set(ref, a); });
    try { localStorage.setItem(BK, JSON.stringify(bk)); } catch (e) { console.warn('백업 실패:', e.message); }
    await b.commit();

    console.log('%c✅ 완료 — 새로고침해줘', 'color:#16a34a;font-weight:bold;font-size:14px');
    console.log('   이지젯 KD7JB6V · Light+23kg · ₩' + KRW.toLocaleString() + ' 결제 완료 · 예약 필요 표시 해제');
    console.log('   수하물 위탁 09:45~11:05 일정 추가 · 라이언에어 손실 행 링크 분리');
  }

  async function undo() {
    const bk = JSON.parse(localStorage.getItem(BK) || 'null');
    if (!bk) return console.error('백업이 없어.');
    const b = db.batch();
    Object.keys(bk.j).forEach(id => { const p = {}; Object.keys(bk.j[id]).forEach(k => { if (bk.j[id][k] !== null) p[k] = bk.j[id][k]; }); b.update(db.collection('journey').doc(id), p); });
    Object.keys(bk.f).forEach(id => { const p = {}; Object.keys(bk.f[id]).forEach(k => { if (bk.f[id][k] !== null) p[k] = bk.f[id][k]; }); b.update(db.collection('finance').doc(id), p); });
    (bk.added || []).forEach(id => b.delete(db.collection('journey').doc(id)));
    await b.commit();
    console.log('%c↩️ 되돌림 완료', 'color:#f59e0b;font-weight:bold');
  }

  console.log('%c준비됨 → atelierEJ.preview()', 'color:#2563eb;font-weight:bold;font-size:14px');
  return { preview, apply, undo };
})();
