// 숙소 예산 동기화 — 두 카드가 어긋나던 원인 3개를 한 번에 정리
//  ① 숙소 카드의 finance_id / finance_onsite_id 가 삭제된 옛 행을 가리킴 → 새 행으로 재연결
//  ② 현장 결제(도시세·Lienharterhof)가 오늘 날짜로 잡힘 → 실제 결제일(체크인/체크아웃)로
//  ③ 미예약 항목의 payment_date 잔재 정리 (이지젯·렌트카·ICE)
window.atelierSync = (function () {
  const db = window.db;
  const BK = 'atelier_sync_backup';

  // ── ① 숙소 ↔ finance 재연결 + 현장 결제 상태 정정
  const J = {
    qSHNf2ATo9U0er1TRN5v: {   // 로마 B&B
      finance_id: 'iUvIYV5uKs6dXaolOTlf', finance_onsite_id: 'Z6plIJtpttcwmx3dzIAC' },
    '2wTJjghF1IZCXt25bzUE': { // Ermione — 도시세가 요금에 포함이라 onsite 없음
      finance_id: 'DYxen0ojIZPT1l2skl2F', finance_onsite_id: '' },
    adA1z7lSlKF2qFfkreZs: {   // 베로나 Dimora
      finance_id: 'HDTb6IWhnUoEGwdD3J7H', finance_onsite_id: 'wbSRJMi5aZpRbUzNRqvN' },
    '0OcjJRe9KcVJQxuatje4': { // Lienharterhof — 전액 현장 결제
      finance_id: 'zevD27aRoTpfVgVER6Ps', finance_onsite_id: '',
      payment_status: '현장 결제 예정', payment_date: '2026-10-01',
      payment_method: '₩691,085 (€420.00) 10/1 체크아웃 시 현장 카드 결제 — 숙박 610,309 + VAT 10% 61,031 + 도시세 19,745 / Visa·Mastercard · 선결제 없음' },
    '2Ryw28Fa8LvdpnyfopuE': { // Casa Camper
      finance_id: 'LGE7ImvkSlpNnjTVkdjT', finance_onsite_id: 'w3NKH5LQQ09y69dxNiPQ' },
    K77sjwwBaP6YuNCF9DdA: {   // Stay KooooK
      finance_id: 'qUxzfksaiztUDgfTQWKS', finance_onsite_id: 'viPJrmfpzrO5Ue8pPNaQ' },

    // ── ③ 미예약 항목의 옛 결제일 제거 (안 지우면 캐시플로우가 과거 날짜로 잡음)
    dZhJpR9YhFFANEOu70kF: { payment_date: '' },                       // 이지젯 (라이언에어 8/3 잔재)
    dU0qdEpLIZbCgbQfVhjR: { payment_date: '' },                       // Europcar (9/29 잔재)
    '3UJ9oefcwtAAoFrCFHum': { payment_date: '' }                      // ICE (5/10 잔재)
  };

  // ── ② 현장 결제 = 미래에 나갈 돈. paid_date 를 실제 결제 시점으로.
  const F = {
    Z6plIJtpttcwmx3dzIAC: { paid_date: '2026-09-24', date: '2026-09-24' },  // 로마 도시세 — 체크인
    wbSRJMi5aZpRbUzNRqvN: { paid_date: '2026-09-26', date: '2026-09-26' },  // 베로나 도시세
    w3NKH5LQQ09y69dxNiPQ: { paid_date: '2026-10-01', date: '2026-10-01' },  // 베를린 도시세
    viPJrmfpzrO5Ue8pPNaQ: { paid_date: '2026-10-03', date: '2026-10-03' },  // 라이프치히 도시세
    zevD27aRoTpfVgVER6Ps: { paid_date: '2026-10-01', date: '2026-10-01',    // Lienharterhof 전액
      description: '몬구엘포 · Lienharterhof (9/27~10/1, 4박) · 조식·도시세 포함 · 10/1 체크아웃 시 현장 결제' },
    // 날짜가 옛 일정에 머물러 있던 것들
    ZHk3JeNehxiGAAm5CkKs: { date: '2026-09-25', paid_date: '' },            // Europcar 픽업일
    M3Er5SwyhN5ohbj9u7xJ: { date: '2026-10-04', paid_date: '' }             // ICE 탑승일
  };

  async function preview() {
    console.log('%c[숙소 예산 동기화] 미리보기', 'font-weight:bold;font-size:14px');
    const miss = [];
    for (const id of Object.keys(J)) { const d = await db.collection('journey').doc(id).get(); if (!d.exists) miss.push('journey/' + id); }
    for (const id of Object.keys(F)) { const d = await db.collection('finance').doc(id).get(); if (!d.exists) miss.push('finance/' + id); }
    if (miss.length) { console.error('❌ 없는 문서:', miss); return; }

    console.log('\n■ 숙소 ↔ finance 재연결 (6곳)');
    let sum = 0;
    for (const id of Object.keys(J)) {
      const p = J[id]; if (!p.finance_id) continue;
      const jd = await db.collection('journey').doc(id).get();
      const f1 = await db.collection('finance').doc(p.finance_id).get();
      const f2 = p.finance_onsite_id ? await db.collection('finance').doc(p.finance_onsite_id).get() : null;
      const a = Number(f1.data().amount || 0), b = f2 && f2.exists ? Number(f2.data().amount || 0) : 0;
      sum += a + b;
      console.log(`   ${String(jd.data().title || '').slice(0, 26).padEnd(28)}₩${(a + b).toLocaleString()}${b ? '  (숙박 ' + a.toLocaleString() + ' + 도시세 ' + b.toLocaleString() + ')' : ''}`);
    }
    console.log(`   ────────────────────────────`);
    console.log(`   합계 ₩${sum.toLocaleString()}  ← 두 카드가 이 값으로 일치해야 정상`);

    console.log('\n■ 현장 결제 날짜 이동');
    for (const id of Object.keys(F)) {
      const d = await db.collection('finance').doc(id).get(), o = d.data(), p = F[id];
      console.log(`   ${String(o.description || '').slice(0, 40).padEnd(42)}${o.paid_date || o.date} → ${p.paid_date || p.date}`);
    }
    console.log('%c\n진행하려면 → atelierSync.apply()', 'color:#2563eb;font-weight:bold');
  }

  async function apply() {
    const bk = { j: {}, f: {} };
    for (const id of Object.keys(J)) {
      const d = await db.collection('journey').doc(id).get();
      if (!d.exists) { console.error('❌ journey 없음, 중단:', id); return; }
      const o = d.data(), s = {}; Object.keys(J[id]).forEach(k => { s[k] = (o[k] === undefined ? null : o[k]); }); bk.j[id] = s;
    }
    for (const id of Object.keys(F)) {
      const d = await db.collection('finance').doc(id).get();
      if (!d.exists) { console.error('❌ finance 없음, 중단:', id); return; }
      const o = d.data(), s = {}; Object.keys(F[id]).forEach(k => { s[k] = (o[k] === undefined ? null : o[k]); }); bk.f[id] = s;
    }
    try { localStorage.setItem(BK, JSON.stringify(bk)); console.log('백업 저장 완료'); }
    catch (e) { console.warn('백업 저장 실패:', e.message, '— 그래도 진행'); }

    const b = db.batch();
    Object.keys(J).forEach(id => b.update(db.collection('journey').doc(id), J[id]));
    Object.keys(F).forEach(id => b.update(db.collection('finance').doc(id), F[id]));
    await b.commit();

    console.log('%c✅ 완료 — 새로고침해줘 (앱 v332 이상이어야 반영돼)', 'color:#16a34a;font-weight:bold;font-size:14px');
    console.log('   숙소 6곳 finance 재연결 · 도시세 4건 + Lienharterhof를 실제 결제일로 이동');
    console.log('   이지젯·렌트카·ICE의 옛 결제일 제거 → 미예약 상태로 표시');
  }

  async function undo() {
    const bk = JSON.parse(localStorage.getItem(BK) || 'null');
    if (!bk) return console.error('백업이 없어.');
    const b = db.batch();
    Object.keys(bk.j).forEach(id => { const p = {}; Object.keys(bk.j[id]).forEach(k => { if (bk.j[id][k] !== null) p[k] = bk.j[id][k]; }); b.update(db.collection('journey').doc(id), p); });
    Object.keys(bk.f).forEach(id => { const p = {}; Object.keys(bk.f[id]).forEach(k => { if (bk.f[id][k] !== null) p[k] = bk.f[id][k]; }); b.update(db.collection('finance').doc(id), p); });
    await b.commit();
    console.log('%c↩️ 되돌림 완료', 'color:#f59e0b;font-weight:bold');
  }

  console.log('%c준비됨 → atelierSync.preview()', 'color:#2563eb;font-weight:bold;font-size:14px');
  return { preview, apply, undo };
})();
