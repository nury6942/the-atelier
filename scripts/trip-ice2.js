// ICE 카드 재설계용 데이터 + 총액 정정 + 도착시각(end_time) 오류 수정
window.atelierICE2 = (function () {
  const db = window.db;
  const BK = 'atelier_ice2_backup';

  // ── 총 카드 지출 (환율 1,619.41 · ECB 2026-08-21)
  //   4/11  1차 예매 €74.99 + 좌석 €6.90
  //   5/10  취소(수수료 €10) → 재예매 카드 €18.90
  //   8/24  취소(수수료 €10) → 재예매 카드 €2.50
  //   ─────────────────────────────────────────
  //   합계 €103.29 = ₩167,269   (표 가치 €69.49 / 날린 돈 €33.80)
  const KRW = 167269;

  const PAY =
    '€103.29 총 카드 지출 (₩167,269) — 세 번 예매·두 번 취소 합산\n' +
    '  4/11 1차 €74.99 + 좌석 €6.90 · 5/10 재예매 €18.90 · 8/24 재예매 €2.50\n' +
    '  표 가치 €69.49 / 취소수수료·환불불가 좌석 €33.80 손실';

  const NOTE =
    '🎫 주문 884161517877 · 티켓코드 EQLMC5MU (2026-08-24 예매)\n' +
    '💺 2호차 68번 · 창가 · Ruhebereich(조용한 칸 — 통화는 객실 밖에서)\n' +
    '   예약번호 805300004400\n' +
    '📍 도착역 정식명 Frankfurt(M) Flughafen Fernbf — 터미널 1 옆, 실내 통로 5~10분\n' +
    '   → SkyLine 무료 모노레일 10분 → 터미널 3 (티웨이). 총 25~30분.\n' +
    '📅 유효 10/4 00:00 ~ 10/5 10:00 · 10/3까지 €10 내고 취소 가능(잔액 바우처)\n' +
    '⚠️ 기명 승차권 — 여권 필수. 20분 이상 지연 예상 시 열차 지정이 자동 해제돼 다른 편도 탈 수 있어.\n' +
    '💳 결제 이력: 4/11 €74.99+€6.90 → 5/10 취소·재예매 €18.90 → 8/24 취소·재예매 €2.50\n' +
    '   마지막 바우처 KXHDGCW €66.99 전액 사용';

  const J = {
    // ① 이동수단 카드 — 티켓 스트립용 필드
    '3UJ9oefcwtAAoFrCFHum': {
      arrive: '16:19',
      dep_platform: 'Gl. 11',
      arr_platform: 'Fern 7',
      seat: '2호차 68번 · 창가 · 조용한 칸',
      transfer: '프랑크푸르트 중앙역 · 같은 플랫폼(Gl.7)에서 24분 대기 → 16:08 ICE 626',
      city: 'Leipzig Hbf',
      drop_city: '프랑크푸르트 공항',
      description: '라이프치히에서 프랑크푸르트 공항까지 한 표로 가. 중앙역 환승은 같은 플랫폼이라 짐 들고 옮겨 다닐 일이 없어.',
      notes: NOTE,
      amount: String(KRW),
      payment_method: PAY
    },
    // ② 일정 카드 — 도착시각이 옛 08:30 일정 때의 11:30으로 남아 있었음
    '9qw5ffRa5Q5nhFHlgolz': { end_time: '16:19' }
  };

  const FIN_ID = 'M3Er5SwyhN5ohbj9u7xJ';
  const FIN = {
    amount: String(KRW),
    description: '기차 ICE 599 · 라이프치히 → 프랑크푸르트 공항 10/4 · 3회 예매·2회 취소 합산',
    fx_amount: '', fx_currency: ''
  };

  async function preview() {
    console.log('%c[ICE 카드 정리] 미리보기', 'font-weight:bold;font-size:14px');
    for (const id of Object.keys(J)) {
      const d = await db.collection('journey').doc(id).get();
      if (!d.exists) { console.error('❌ 없음:', id); return; }
    }
    const f = await db.collection('finance').doc(FIN_ID).get();
    if (!f.exists) { console.error('❌ 장부 없음'); return; }

    const o = (await db.collection('journey').doc('3UJ9oefcwtAAoFrCFHum').get()).data();
    console.table([
      { 항목: '도착시각', 지금: o.arrive || '(없음)', 바꿀값: '16:19' },
      { 항목: '출발 플랫폼', 지금: o.dep_platform || '(없음)', 바꿀값: 'Gl. 11' },
      { 항목: '도착 플랫폼', 지금: o.arr_platform || '(없음)', 바꿀값: 'Fern 7' },
      { 항목: '좌석', 지금: o.seat || '(없음)', 바꿀값: '2호차 68번 · 창가 · 조용한 칸' },
      { 항목: '금액', 지금: '₩' + Number(o.amount || 0).toLocaleString(), 바꿀값: '₩' + KRW.toLocaleString() }
    ]);
    const e = (await db.collection('journey').doc('9qw5ffRa5Q5nhFHlgolz').get()).data();
    console.log('일정 도착시각: ' + (e.end_time || '(없음)') + ' → 16:19');
    console.log('장부: ₩' + Number(f.data().amount || 0).toLocaleString() + ' → ₩' + KRW.toLocaleString());
    console.log('%c\n진행하려면 → atelierICE2.apply()', 'color:#2563eb;font-weight:bold');
  }

  async function apply() {
    const bk = { j: {}, fin: null };
    for (const id of Object.keys(J)) {
      const d = await db.collection('journey').doc(id).get();
      if (!d.exists) { console.error('❌ 없음, 중단:', id); return; }
      const o = d.data(), s = {}; Object.keys(J[id]).forEach(k => { s[k] = (o[k] === undefined ? null : o[k]); }); bk.j[id] = s;
    }
    const fd = await db.collection('finance').doc(FIN_ID).get();
    if (!fd.exists) { console.error('❌ 장부 없음, 중단'); return; }
    const fo = fd.data(); bk.fin = {}; Object.keys(FIN).forEach(k => { bk.fin[k] = (fo[k] === undefined ? null : fo[k]); });
    try { localStorage.setItem(BK, JSON.stringify(bk)); } catch (e) { console.warn('백업 실패:', e.message); }

    const b = db.batch();
    Object.keys(J).forEach(id => b.update(db.collection('journey').doc(id), J[id]));
    b.update(db.collection('finance').doc(FIN_ID), FIN);
    await b.commit();

    console.log('%c✅ 완료 — 강력 새로고침(⌘⇧R) 해줘. 앱 v335 이상이어야 티켓 모양이 나와', 'color:#16a34a;font-weight:bold;font-size:14px');
    console.log('   12:49 Gl.11 → 16:19 Fern 7 · 2호차 68번 · 환승 표시');
    console.log('   금액 ₩' + KRW.toLocaleString() + ' (세 번 예매 합산) · 일정 도착시각 11:30 → 16:19');
  }

  async function undo() {
    const bk = JSON.parse(localStorage.getItem(BK) || 'null');
    if (!bk) return console.error('백업이 없어.');
    const b = db.batch();
    Object.keys(bk.j).forEach(id => { const p = {}; Object.keys(bk.j[id]).forEach(k => { if (bk.j[id][k] !== null) p[k] = bk.j[id][k]; }); b.update(db.collection('journey').doc(id), p); });
    if (bk.fin) { const p = {}; Object.keys(bk.fin).forEach(k => { if (bk.fin[k] !== null) p[k] = bk.fin[k]; }); b.update(db.collection('finance').doc(FIN_ID), p); }
    await b.commit();
    console.log('%c↩️ 되돌림 완료', 'color:#f59e0b;font-weight:bold');
  }

  console.log('%c준비됨 → atelierICE2.preview()', 'color:#2563eb;font-weight:bold;font-size:14px');
  return { preview, apply, undo };
})();
