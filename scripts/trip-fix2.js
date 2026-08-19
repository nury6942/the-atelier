// ① 렌트카 카드 옛 값 정리 (방향·반납일시·차종·취소기한·금액)
// ② 일출/일몰 중복 삭제 — 하루 하나씩만 남김
window.atelierFix2 = (function () {
  const db = window.db;
  const BK = 'atelier_fix2_backup';

  // ── ① 렌트카: dU0qdEpLIZbCgbQfVhjR
  const RENT_ID = 'dU0qdEpLIZbCgbQfVhjR';
  const RENT = {
    city: 'Roma Fiumicino (FCO)',            // 픽업 (기존: VCE — 방향 뒤집혀 있었음)
    drop_city: 'Venezia Marco Polo (VCE)',   // 반납 (기존: FCO)
    date: '2026-09-25', time: '10:00',
    checkout_date: '2026-10-01',             // 기존 10/04
    checkout: '10:00',                       // 기존 19:00
    cancel_date: '2026-09-23',               // 기존 9/27
    amount: '562264',                        // 카드 매출전표 실금액 (장부와 일치)
    description: 'VW T-Cross (컴팩트 SUV, 오토) · 6일 · $387.61 · 면책 €0 Super Cover · 5인승 · A/C',
    payment_method: '$387.61 카드 결제 (Auto Europe) ≈ ₩562,264 · 현장 편도 반납료 €67.10 별도',
    pickup_location: "Europcar FCOT01 · Rome Fiumicino Airport · Via dell'Aeroporto di Fiumicino, 00054 Roma",
    drop_location: 'Europcar VCET01 · Venice Marco Polo Airport · Via Luigi Broglio SNC, 30173 Venezia'
  };

  // ── ② 일출/일몰 중복 — 지울 문서들
  const SUN_DEL = [
    // 9/24 일출 07:00 ×7 → 1개만 남김 (mEzGqlew9ahQeNMdS3v5 유지)
    '00mqEUWOf9uKIEOM8e3e','6sjYmHAKQrcTu6AIkQUa','Gx2aqaMlCkf9uDKTxcDc',
    'VtLJEaWleswPoo6KX9fY','gv6iSgAirElAwVexzJhR','pZcvMuz7l5sQQgy3WgZe',
    // 9/24 일몰 19:05 ×7 → 1개만 남김 (rfiQENXa43m5hSF2qDkA 유지)
    'JbixRmdBy6vA6kWdykyJ','MQEPE2zhkgrGPvYvVFFc','OtwhkbLrio0ZAyIpbEV0',
    'RqP55PCNVDiQuWviM3qi','UXm0xzPJswIQrFtU7Knu','kIG96SA4efWluLQkvpQE',
    // 9/25 ×2씩 → 1개만 남김
    'u0HKYXfaeieLQhqK21Sd','S44Cj9cPsXqemwmOuhHN',
    // 10/4 일몰 2개(라이프치히 18:41 / 프랑크푸르트 18:57) → 프랑크푸르트만
    'b5B6MLDUSB89Yg8MCiQC'
  ];

  // 9/25은 살아남는 것도 도시가 틀림 (옛 독일-먼저 일정 잔재) → 토스카나 값으로
  const SUN_FIX = {
    mZZWYpkkuhIxXoVuDajV: { city: "Castiglione d'Orcia, 시에나 이탈리아", time: '07:04' },
    DoWhDHsmzKQKM7voTcFs: { city: "Castiglione d'Orcia, 시에나 이탈리아", time: '19:05' }
  };

  async function preview() {
    console.log('%c[정리] 미리보기', 'font-weight:bold;font-size:14px');
    const d = await db.collection('journey').doc(RENT_ID).get();
    if (!d.exists) return console.error('❌ 렌트카 문서 없음');
    const o = d.data();
    console.log('\n■ 렌트카 카드');
    console.table(Object.keys(RENT).map(k => ({ 항목: k, 지금: String(o[k] ?? '(없음)').slice(0, 46), 바꿀값: String(RENT[k]).slice(0, 46) })));

    console.log('\n■ 일출/일몰 중복 삭제');
    const rows = [];
    for (const id of SUN_DEL) {
      const s = await db.collection('journey').doc(id).get();
      rows.push({ id, 상태: s.exists ? '삭제 예정' : '(이미 없음)', 내용: s.exists ? s.data().date + ' ' + s.data().time + ' ' + s.data().title : '' });
    }
    console.table(rows);
    for (const id of Object.keys(SUN_FIX)) {
      const s = await db.collection('journey').doc(id).get();
      if (!s.exists) { console.error('❌ 없음:', id); return; }
      console.log('   고침 ' + s.data().date + ' ' + s.data().title + ' : ' + s.data().city + ' ' + s.data().time + ' → ' + SUN_FIX[id].city + ' ' + SUN_FIX[id].time);
    }
    console.log('%c\n진행하려면 → atelierFix2.apply()', 'color:#2563eb;font-weight:bold');
  }

  async function apply() {
    const bk = { rent: {}, del: {}, fix: {} };
    const d = await db.collection('journey').doc(RENT_ID).get();
    if (!d.exists) return console.error('❌ 렌트카 문서 없음, 중단');
    const o = d.data();
    Object.keys(RENT).forEach(k => { bk.rent[k] = (o[k] === undefined ? null : o[k]); });
    for (const id of SUN_DEL) { const s = await db.collection('journey').doc(id).get(); if (s.exists) bk.del[id] = s.data(); }
    for (const id of Object.keys(SUN_FIX)) {
      const s = await db.collection('journey').doc(id).get();
      if (!s.exists) { console.error('❌ 없음, 중단:', id); return; }
      const p = {}; Object.keys(SUN_FIX[id]).forEach(k => { p[k] = (s.data()[k] === undefined ? null : s.data()[k]); }); bk.fix[id] = p;
    }
    try { localStorage.setItem(BK, JSON.stringify(bk)); } catch (e) { console.warn('백업 저장 실패:', e.message, '— 그래도 진행'); }

    const b = db.batch();
    b.update(db.collection('journey').doc(RENT_ID), RENT);
    SUN_DEL.forEach(id => b.delete(db.collection('journey').doc(id)));
    Object.keys(SUN_FIX).forEach(id => b.update(db.collection('journey').doc(id), SUN_FIX[id]));
    await b.commit();

    console.log('%c✅ 완료 — 새로고침해줘', 'color:#16a34a;font-weight:bold;font-size:14px');
    console.log('   렌트카 FCO→VCE · 10/1 10:00 반납 · VW T-Cross 6일 · ₩562,264 (장부와 일치)');
    console.log('   일출/일몰 ' + SUN_DEL.length + '건 삭제 · 9/25 도시 토스카나로 정정');
  }

  async function undo() {
    const bk = JSON.parse(localStorage.getItem(BK) || 'null');
    if (!bk) return console.error('백업이 없어.');
    const b = db.batch();
    const rp = {}; Object.keys(bk.rent).forEach(k => { if (bk.rent[k] !== null) rp[k] = bk.rent[k]; });
    b.update(db.collection('journey').doc(RENT_ID), rp);
    Object.keys(bk.del).forEach(id => b.set(db.collection('journey').doc(id), bk.del[id]));
    Object.keys(bk.fix).forEach(id => { const p = {}; Object.keys(bk.fix[id]).forEach(k => { if (bk.fix[id][k] !== null) p[k] = bk.fix[id][k]; }); b.update(db.collection('journey').doc(id), p); });
    await b.commit();
    console.log('%c↩️ 되돌림 완료', 'color:#f59e0b;font-weight:bold');
  }

  console.log('%c준비됨 → atelierFix2.preview()', 'color:#2563eb;font-weight:bold;font-size:14px');
  return { preview, apply, undo };
})();
