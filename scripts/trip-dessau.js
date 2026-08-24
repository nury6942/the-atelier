// 베를린→데사우 ICE 597 예매 반영 (780046699433) + 데사우→라이프치히 + 10/3 일정 재배치
window.atelierDessau = (function () {
  const db = window.db;
  const BK = 'atelier_dessau_backup';
  const TRIP = 'I5T6Gu4qU1BtbHg2slYE';

  // 환율 1,619.41 (ECB 2026-08-21)
  const KRW_ICE = 42088;   // €25.99  결제 완료
  const KRW_MDV = 23967;   // €14.80  당일 현장 (미리 못 삼 — MDV 규정)

  const LEGS_ICE = JSON.stringify([
    { train: 'ICE 597', dur: '42m',
      from: { t: '09:27', stn: 'Berlin Hbf', pl: 'Gl. 4' },
      to:   { t: '10:09', stn: 'Lutherstadt Wittenberg Hbf', pl: 'Gl. 2' } },
    { wait: '7분', note: '플랫폼 2 → 6, 지하도 이동. 도착 5분 전 미리 문 앞으로' },
    { train: 'RB51 (16168)', dur: '33m',
      from: { t: '10:16', stn: 'Lutherstadt Wittenberg Hbf', pl: 'Gl. 6' },
      to:   { t: '10:49', stn: 'Dessau Hbf', pl: 'Gl. 5' } }
  ]);

  const LEGS_MDV = JSON.stringify([
    { train: 'RE13', dur: '38m',
      from: { t: '14:01', stn: 'Dessau Hbf' },
      to:   { t: '14:39', stn: 'Leipzig Hbf' } }
  ]);

  // ── 새 이동수단 카드 2장
  const ADD_TRANSIT = [
    { trip_id: TRIP, type: '이동수단', date: '2026-10-03', time: '09:27', arrive: '10:49',
      city: 'Berlin Hbf', drop_city: 'Dessau Hbf',
      title: 'ICE 597 · Berlin Hbf → Dessau Hbf',
      description: '베를린에서 데사우까지 1시간 22분. 비텐베르크에서 RB51로 갈아타. 환승 7분이라 미리 준비하고 있어야 해.',
      legs: LEGS_ICE, amount: String(KRW_ICE),
      status: '확정', payment_status: '결제 완료', payment_date: '2026-08-24',
      payment_method: '€25.99 Super Sparpreis · VISA 4913 (₩42,088)',
      reservation: false,
      notes:
        '🎫 주문 780046699433 · 티켓코드 PWGRKXK0 (2026-08-24 예매)\n' +
        '💺 좌석 미지정 — 42분 구간이라 예약 안 함. 베를린이 노선 앞쪽이라 자리 넉넉해\n' +
        '📅 유효 10/3 00:00 ~ 10/4 10:00\n' +
        '⚠️ Super Sparpreis — 취소 불가. ICE 597(09:27) 지정편\n' +
        '   단, 20분 이상 지연 예상 시 열차 지정이 자동 해제돼 다른 편도 탈 수 있어\n' +
        '⚠️ 환승 7분 · 비텐베르크 Gl.2 → Gl.6 (지하도). 놓쳐도 표는 유효, 다음 RB51은 1시간 뒤\n' +
        '🪪 기명 승차권 — 여권 지참' },

    { trip_id: TRIP, type: '이동수단', date: '2026-10-03', time: '14:01', arrive: '14:39',
      city: 'Dessau Hbf', drop_city: 'Leipzig Hbf',
      title: 'RE13 · Dessau Hbf → Leipzig Hbf',
      description: '직통 38분. MDV 조합 운임이라 열차 지정이 없어서 데사우가 더 좋으면 15:01 편을 타도 표는 그대로 유효해.',
      legs: LEGS_MDV, amount: String(KRW_MDV),
      status: '', payment_status: '현장 결제 예정', payment_date: '',
      payment_method: '€14.80 MDV Einzelfahrkarte — 당일 현장 (₩23,967)',
      reservation: false,
      notes:
        '💳 미리 못 사는 표야. MDV 규정상 출발 직전에만 발권돼 (유효시간 구매 후 4시간)\n' +
        '   → 데사우역 발매기 또는 DB Navigator 앱에서 당일 구매. 1분이면 끝나\n' +
        '   가격 고정제라 지금 사나 당일 사나 €14.80로 같아. 품절도 없어\n' +
        '🚆 RE13 직통 38분 (14:01 / 15:01 매시 운행)\n' +
        '   ⚠️ S2(14:06)는 1시간 1분 걸리고 Leipzig Hbf 지하 승강장 도착 — 캐리어면 RE13이 나아\n' +
        '   ⚠️ RB50+IC 환승편(€22.99)은 더 비싸고 느려' }
  ];

  // ── 10/3 일정 시각 재배치 (09:27 출발 · 10:49 도착 기준)
  const J = {
    J0Unj3luB23aBtdJKGlF: { time: '08:15',
      description: '체크아웃 12:00까지지만 09:27 ICE라 일찍 나서. 미테에서 베를린 중앙역까지 U-Bahn 15분.' },
    '7iNHTqkVsvGtA5Qkancv': { time: '09:27',
      title: '🚆 ICE 597 · 베를린 → 데사우',
      description: '09:27 베를린 Gl.4 → 10:09 비텐베르크 Gl.2 · 7분 환승(Gl.6) → 10:16 RB51 → 10:49 데사우 Gl.5\n주문 780046699433 · 예매 완료',
      reservation: false },
    eK4MWNFczlvB9QP59q3F: { time: '11:05',
      description: '역에서 도보 12분. 10:00~17:00 개관이라 토요일도 열려.\n건물 자체가 목적 — 유리 커튼월 원조. 공방동·계단실·아틀리에동(Prellerhaus) 한 바퀴면 1시간.\n★ 매표소에서 마이스터하우스 통합권 달라고 할 것 (따로 사는 것보다 싸)' },
    hrutQO812leC9QQGYahf: { time: '13:15',
      title: '🥨 점심 — 대충, 15분',
      description: '바우하우스 카페나 역 근처 그랩. 14:01 기차라 오래 안 끌어.' },
    majBnmpENLQtaP5wQ0vJ: { time: '14:01',
      title: '🚆 RE13 · 데사우 → 라이프치히',
      description: '직통 38분 → 14:39 도착. 13:45까지 역 복귀.\n표는 당일 발매기/앱에서 €14.80. 더 있고 싶으면 15:01 편도 같은 표로 탈 수 있어.',
      reservation: false }
  };

  // ── 마이스터하우스 추가
  const ADD_PLAN = [
    { trip_id: TRIP, type: '일정', date: '2026-10-03', time: '12:20',
      city: 'Dessau, 독일', title: '🏠 마이스터하우스 (그로피우스·칸딘스키·클레)',
      description: '바우하우스 건물에서 도보 12분. 바우하우스 선생들이 실제로 살던 사택 4채.\n★ 칸딘스키·클레 집 내부 색채 복원이 하이라이트 — 벽마다 다른 색 실험을 그대로 되살렸어.\n본관이 "공적인 바우하우스"라면 여기는 "사적인 바우하우스"야. 50분이면 충분.' },

    // 현장 발권 — 앱 기본 '예약 필요' 표시로 눈에 띄게
    { trip_id: TRIP, type: '일정', date: '2026-10-03', time: '13:45',
      city: 'Dessau, 독일', title: '🎫 RE13 표 사기 (데사우역)',
      reservation: true,
      description:
        '⚠️ 미리 못 사는 표야. MDV 규정상 출발 직전에만 발권돼 — 여기서 사야 해.\n' +
        '어디서: 데사우역 발매기(DB Automat) 또는 DB Navigator 앱 · 카드 결제 · 1분\n' +
        '뭘: Dessau Hbf → Leipzig Hbf, MDV Einzelfahrkarte €14.80\n' +
        '14:01 출발 → 14:39 도착 (RE13 직통 38분)\n' +
        '가격 고정제라 품절 없어. 표에 열차 지정도 없어서 15:01 편을 타도 그대로 유효해.\n' +
        '⚠️ S2(14:06)는 1시간 1분 + 지하 승강장이라 캐리어면 RE13으로.' }
  ];

  // ── 장부 2줄
  const ADD_FIN = [
    { date: '2026-08-24', paid_date: '2026-08-24', trip: '2026 독일&이탈리아', category: '교통',
      description: '기차 ICE 597 · 베를린 → 데사우 10/3 (780046699433)',
      amount: String(KRW_ICE), currency: 'KRW', krw_amount: '', unpaid: false },
    { date: '2026-10-03', paid_date: '2026-10-03', trip: '2026 독일&이탈리아', category: '교통',
      description: '기차 RE13 · 데사우 → 라이프치히 10/3 · 현장 발권 (MDV €14.80)',
      amount: String(KRW_MDV), currency: 'KRW', krw_amount: '', unpaid: true }
  ];

  async function preview() {
    console.log('%c[데사우 구간] 미리보기', 'font-weight:bold;font-size:14px');
    for (const id of Object.keys(J)) {
      const d = await db.collection('journey').doc(id).get();
      if (!d.exists) { console.error('❌ 없음:', id); return; }
    }
    console.log('\n■ 10/3 재배치');
    const rows = [];
    for (const id of Object.keys(J)) {
      const o = (await db.collection('journey').doc(id).get()).data();
      rows.push({ 지금: (o.time || '') + '  ' + String(o.title || '').slice(0, 26),
        바뀜: (J[id].time || o.time) + '  ' + String(J[id].title || o.title || '').slice(0, 26) });
    }
    console.table(rows);
    console.log('\n■ 추가 — 이동수단 2 · 일정 1');
    ADD_TRANSIT.forEach(a => console.log('   ' + a.time + ' ' + a.title));
    ADD_PLAN.forEach(a => console.log('   ' + a.time + ' ' + a.title));
    console.log('\n■ 장부 추가');
    ADD_FIN.forEach(f => console.log('   ₩' + Number(f.amount).toLocaleString() + '  ' + f.description + (f.unpaid ? '  [현장]' : '')));
    console.log('%c\n진행하려면 → atelierDessau.apply()', 'color:#2563eb;font-weight:bold');
  }

  async function apply() {
    const bk = { j: {}, addedJ: [], addedF: [] };
    for (const id of Object.keys(J)) {
      const d = await db.collection('journey').doc(id).get();
      if (!d.exists) { console.error('❌ 없음, 중단:', id); return; }
      const o = d.data(), s = {}; Object.keys(J[id]).forEach(k => { s[k] = (o[k] === undefined ? null : o[k]); }); bk.j[id] = s;
    }
    const b = db.batch();
    Object.keys(J).forEach(id => b.update(db.collection('journey').doc(id), J[id]));
    ADD_TRANSIT.concat(ADD_PLAN).forEach(a => { const r = db.collection('journey').doc(); bk.addedJ.push(r.id); b.set(r, a); });
    ADD_FIN.forEach(f => { const r = db.collection('finance').doc(); bk.addedF.push(r.id); b.set(r, f); });
    try { localStorage.setItem(BK, JSON.stringify(bk)); } catch (e) { console.warn('백업 실패:', e.message); }
    await b.commit();

    console.log('%c✅ 완료 — 새로고침해줘', 'color:#16a34a;font-weight:bold;font-size:14px');
    console.log('   ICE 597 카드 (플랫폼·7분 환승 타임라인) · RE13 카드 (현장 결제)');
    console.log('   10/3 일정 09:27 기준 재배치 · 마이스터하우스 추가');
    console.log('   장부 +₩' + (KRW_ICE + KRW_MDV).toLocaleString() + ' (결제완료 42,088 / 현장 23,967)');
  }

  async function undo() {
    const bk = JSON.parse(localStorage.getItem(BK) || 'null');
    if (!bk) return console.error('백업이 없어.');
    const b = db.batch();
    Object.keys(bk.j).forEach(id => { const p = {}; Object.keys(bk.j[id]).forEach(k => { if (bk.j[id][k] !== null) p[k] = bk.j[id][k]; }); b.update(db.collection('journey').doc(id), p); });
    (bk.addedJ || []).forEach(id => b.delete(db.collection('journey').doc(id)));
    (bk.addedF || []).forEach(id => b.delete(db.collection('finance').doc(id)));
    await b.commit();
    console.log('%c↩️ 되돌림 완료', 'color:#f59e0b;font-weight:bold');
  }

  console.log('%c준비됨 → atelierDessau.preview()', 'color:#2563eb;font-weight:bold;font-size:14px');
  return { preview, apply, undo };
})();
