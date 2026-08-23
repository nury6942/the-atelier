// ICE 재예매 반영 (주문 884161517877) + 10/4 일정 재구성 + 10/3 체크아웃 오류 수정
window.atelierICE = (function () {
  const db = window.db;
  const BK = 'atelier_ice_backup';
  const TRIP = 'I5T6Gu4qU1BtbHg2slYE';

  // ── 환율 EUR→KRW 1,619.41 (ECB 2026-08-21)
  // 표 €69.49 = 바우처 KXHDGCW €66.99 + VISA €2.50
  // ★ 장부 금액 기준: 바우처도 결국 4월에 카드로 낸 기차값이 굴러온 것이고
  //   그 원 결제가 장부에 없어서, 표 액면가 전액(₩112,533)으로 잡는다.
  //   카드에서 오늘 빠진 €2.50만 잡고 싶으면 아래 KRW를 4049로 바꿔.
  const KRW = 112533;

  const NOTE =
    '🎫 주문 884161517877 · 티켓코드 EQLMC5MU (2026-08-24 예매)\n' +
    '💺 2호차 68번 · 창가 · Ruhebereich(조용한 칸) · 예약번호 805300004400\n' +
    '💳 €69.49 = 표 63.99 + 좌석 5.50 — 바우처 KXHDGCW €66.99 + VISA €2.50\n' +
    '📅 유효 10/4 00:00 ~ 10/5 10:00 · 10/3까지 €10 내고 취소 가능(잔액은 바우처)\n' +
    '⚠️ 기명 승차권 — 여권 반드시 지참. 20분 이상 지연 예상 시 열차 지정이 자동 해제돼 다른 편 탈 수 있어.\n' +
    '🔇 Ruhebereich라 통화는 객실 밖에서.';

  const DESC =
    '12:49 라이프치히 Gl.11 → 15:44 프랑크푸르트 중앙역 Gl.7 · 같은 플랫폼 24분 대기 → ' +
    '16:08 ICE 626 Gl.7 → 16:19 공항역 Fern 7';

  // ── 수정
  const J = {
    // ① ICE 이동수단 카드
    '3UJ9oefcwtAAoFrCFHum': {
      date: '2026-10-04', time: '12:49',
      title: 'ICE 599 · Leipzig Hbf → 프랑크푸르트 공항',
      city: 'Leipzig Hbf', drop_city: 'Frankfurt(M) Flughafen Fernbf',
      description: DESC, notes: NOTE,
      amount: String(KRW),
      status: '확정', payment_status: '결제 완료', payment_date: '2026-08-24',
      payment_method: '€69.49 — 바우처 KXHDGCW €66.99 + VISA 4913 €2.50 (₩4,049)',
      reservation: false
    },
    // ② ICE 일정 카드
    '9qw5ffRa5Q5nhFHlgolz': {
      time: '12:49',
      title: '🚂 ICE 599 · 라이프치히 → 프랑크푸르트 공항',
      city: 'Frankfurt am Main, 독일',
      description: DESC + '\n환승은 같은 플랫폼이라 짐 들고 이동할 일 없어. 24분 여유라 조금 늦어도 잡혀.',
      reservation: false
    },
    // ③ 체크아웃 — 07:30 → 11:00, 짐 맡기고 나가기
    SCBhSabQvXIfr7svcDwP: {
      time: '11:00',
      title: '🧳 체크아웃 + 캐리어 맡기기 (Stay KooooK)',
      description: '체크아웃 11:00. 캐리어는 프런트에 맡기고 빈 손으로 나가. 호텔이 중앙역 직결이라 기차 타기 직전에 5분이면 회수돼.'
    },
    // ④ 일출 — 프랑크푸르트가 아니라 라이프치히에서 맞는 아침
    LGKuky5U0Xxg2Mxm81Dw: { time: '07:16', city: 'Leipzig, 독일' },
    // ⑤ 10/3 조식·체크아웃 — 라이프치히/하이페리온이 아니라 베를린/Casa Camper
    J0Unj3luB23aBtdJKGlF: {
      city: 'Berlin, 독일',
      title: '☕ 조식 + 체크아웃 (Casa Camper)',
      description: '체크아웃 12:00 이전. 08:45 데사우행이라 일찍 나서. 미테라 역까지 U-Bahn 금방이야.'
    }
  };

  // ── 삭제: 프랑크푸르트 시내 일정 (일요일이라 상점 다 닫고, 이제 공항 직행)
  const DEL = ['RCHy2WOwTJ1PE4daeAsE', 'emSoJ8LLwVzqFPWwgjNk'];

  // ── 추가
  const ADD = [
    { trip_id: TRIP, type: '일정', date: '2026-10-04', time: '11:15',
      city: 'Leipzig, 독일', title: '🚶 라이프치히 마지막 오전',
      description: '일요일이라 샵은 닫아. 아우구스투스 광장 → 게반트하우스 → 오페라하우스 외관, 니콜라이 교회(1989년 월요시위 발원지), 강변 산책. 짐 없이 가볍게 도는 코스야.' },
    { trip_id: TRIP, type: '일정', date: '2026-10-04', time: '12:35',
      city: 'Leipzig, 독일', title: '🧳 캐리어 회수 → 11번 승강장',
      description: '호텔 프런트에서 캐리어 찾고 바로 역으로. Gleis 11에서 ICE 599 탑승. 2호차 68번.' },
    { trip_id: TRIP, type: '일정', date: '2026-10-04', time: '16:19',
      city: 'Frankfurt am Main, 독일', title: '🚝 공항역 도착 → SkyLine → T3',
      description: '공항역(Fern 7)에서 터미널 1까지 실내 통로 5~10분 → SkyLine 무료 모노레일(2분 간격)로 터미널 3까지 약 10분. T3는 활주로 반대편이라 걸어서는 못 가.\n체크인·수하물 마감 17:50 — 도착 16:50 기준 60분 여유.' }
  ];

  // ── 장부
  const FIN_ID = 'M3Er5SwyhN5ohbj9u7xJ';
  const FIN = {
    date: '2026-08-24', paid_date: '2026-08-24',
    description: '기차 ICE 599 · 라이프치히 → 프랑크푸르트 공항 10/4 12:49 · 2호차 68번',
    category: '교통', amount: String(KRW), currency: 'KRW',
    unpaid: false, fx_amount: '', fx_currency: ''
  };

  async function preview() {
    console.log('%c[ICE 재예매 반영] 미리보기', 'font-weight:bold;font-size:14px');
    const miss = [];
    for (const id of Object.keys(J)) { const d = await db.collection('journey').doc(id).get(); if (!d.exists) miss.push('journey/' + id); }
    const f = await db.collection('finance').doc(FIN_ID).get(); if (!f.exists) miss.push('finance/' + FIN_ID);
    if (miss.length) { console.error('❌ 없는 문서:', miss); return; }

    console.log('\n■ 수정');
    const rows = [];
    for (const id of Object.keys(J)) {
      const o = (await db.collection('journey').doc(id).get()).data();
      rows.push({ 날짜: o.date, 지금: String(o.title || '').slice(0, 30) + ' ' + (o.time || ''),
        바꿀값: String(J[id].title || o.title || '').slice(0, 30) + ' ' + (J[id].time || o.time || '') });
    }
    console.table(rows);

    console.log('\n■ 삭제');
    for (const id of DEL) { const d = await db.collection('journey').doc(id).get(); console.log('   ' + (d.exists ? d.data().time + ' ' + d.data().title : '(이미 없음)')); }

    console.log('\n■ 추가');
    ADD.forEach(a => console.log('   ' + a.time + ' ' + a.title));

    console.log('\n■ 장부');
    const fo = f.data();
    console.log('   ₩' + Number(fo.amount || 0).toLocaleString() + ' → ₩' + KRW.toLocaleString() + '  (' + (fo.paid_date || fo.date) + ' → 2026-08-24)');
    console.log('%c\n진행하려면 → atelierICE.apply()', 'color:#2563eb;font-weight:bold');
  }

  async function apply() {
    const bk = { j: {}, del: {}, fin: null, added: [] };
    for (const id of Object.keys(J)) {
      const d = await db.collection('journey').doc(id).get();
      if (!d.exists) { console.error('❌ 없음, 중단:', id); return; }
      const o = d.data(), s = {}; Object.keys(J[id]).forEach(k => { s[k] = (o[k] === undefined ? null : o[k]); }); bk.j[id] = s;
    }
    for (const id of DEL) { const d = await db.collection('journey').doc(id).get(); if (d.exists) bk.del[id] = d.data(); }
    const fd = await db.collection('finance').doc(FIN_ID).get();
    if (!fd.exists) { console.error('❌ 장부 없음, 중단'); return; }
    const fo = fd.data(); bk.fin = {}; Object.keys(FIN).forEach(k => { bk.fin[k] = (fo[k] === undefined ? null : fo[k]); });

    const b = db.batch();
    Object.keys(J).forEach(id => b.update(db.collection('journey').doc(id), J[id]));
    DEL.forEach(id => b.delete(db.collection('journey').doc(id)));
    ADD.forEach(a => { const ref = db.collection('journey').doc(); bk.added.push(ref.id); b.set(ref, a); });
    b.update(db.collection('finance').doc(FIN_ID), FIN);
    try { localStorage.setItem(BK, JSON.stringify(bk)); } catch (e) { console.warn('백업 저장 실패:', e.message, '— 그래도 진행'); }
    await b.commit();

    console.log('%c✅ 완료 — 새로고침해줘', 'color:#16a34a;font-weight:bold;font-size:14px');
    console.log('   ICE 12:49 출발 · 2호차 68번 · 주문 884161517877 · 예약 필요 표시 해제');
    console.log('   프랑크푸르트 시내 2건 삭제 → 라이프치히 오전 + 짐회수 + 공항이동 3건 추가');
    console.log('   장부 ₩' + KRW.toLocaleString() + ' (8/24 결제 완료) · 10/3 체크아웃 베를린으로 정정');
  }

  async function undo() {
    const bk = JSON.parse(localStorage.getItem(BK) || 'null');
    if (!bk) return console.error('백업이 없어.');
    const b = db.batch();
    Object.keys(bk.j).forEach(id => { const p = {}; Object.keys(bk.j[id]).forEach(k => { if (bk.j[id][k] !== null) p[k] = bk.j[id][k]; }); b.update(db.collection('journey').doc(id), p); });
    Object.keys(bk.del).forEach(id => b.set(db.collection('journey').doc(id), bk.del[id]));
    (bk.added || []).forEach(id => b.delete(db.collection('journey').doc(id)));
    if (bk.fin) { const p = {}; Object.keys(bk.fin).forEach(k => { if (bk.fin[k] !== null) p[k] = bk.fin[k]; }); b.update(db.collection('finance').doc(FIN_ID), p); }
    await b.commit();
    console.log('%c↩️ 되돌림 완료', 'color:#f59e0b;font-weight:bold');
  }

  console.log('%c준비됨 → atelierICE.preview()', 'color:#2563eb;font-weight:bold;font-size:14px');
  return { preview, apply, undo };
})();
