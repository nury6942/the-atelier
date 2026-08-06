// 최종 정리 — 항공권·렌트카 확정 + 예산 마감
//  A) 렌트카 (Auto Europe/Europcar) 확정 + 9/25·10/1 일정 재배치
//  B) 티웨이 항공권 확정 (TW405/TW404, PNR A36BLM)
//  C) 프랑크푸르트 T3 반영 (기차는 T1 도착 → SkyLine 환승)
//  D) finance: 렌트 갱신 + 편도료 추가, 안 가는 티켓 정리
window.atelierFinal = (function () {
  const TRIP = 'I5T6Gu4qU1BtbHg2slYE';
  const db = window.db;
  const BK = 'atelier_final_backup';

  const J = {
    // ═══ A. 렌트카 ═══
    dU0qdEpLIZbCgbQfVhjR: {
      date: '2026-09-25', time: '10:00',
      title: 'Europcar — VW T-Cross (컴팩트 SUV, 오토)',
      status: '확정', payment_status: '결제 완료',
      pickup_location: "Europcar FCOT01 · Rome Fiumicino Airport · Via dell'Aeroporto di Fiumicino, 00054 Roma",
      drop_location: 'Europcar VCET01 · Venice Marco Polo Airport · Via Luigi Broglio SNC, 30173 Venezia',
      amount: '551848', payment_date: '2026-08-06',
      payment_method: '$387.61 카드 결제 (Auto Europe) ≈ ₩551,848 · 현장 편도료 €67.10 별도',
      notes:
        '🎫 Auto Europe 바우처 718357750 · Europcar 예약번호 1205688924\n' +
        '📅 9/25(금) 10:00 FCO 픽업 → 10/1(목) 10:00 VCE 반납 · 6일\n' +
        '☎️ 픽업 +39 06 6576 1211 (07:00~23:59) · 반납 +39 041 541 5654 (08:00~23:30)\n\n' +
        '💳 결제 완료 $387.61 / 현장 €67.10 (편도료, 유로)\n' +
        '🔒 보증금 €500 카드 홀드 — 청구 아님. 한도 여유 비워둘 것\n\n' +
        '✅ 포함: 무제한 주행 · Full-to-Full · 면책 €0 (CDW+도난)\n' +
        '   Super Cover — 휠/타이어 · 유리 · 앞유리 · 미러 · 외부등 · 지붕 · 하부\n' +
        '   고장·견인 · 미사용일 환불 · 부속품 · 대인배상 · 화재\n\n' +
        '🪪 필수 지참 (없으면 대여 거부 + 환불 불가)\n' +
        '   국제운전면허증 원본 · 한국 면허증 원본 · 여권 · 본인 명의 실물 신용카드 · 바우처 인쇄본\n\n' +
        '⚠️ 무료취소 9/23 10:00까지. 이후 취소·미수령·서류 미비는 전액 환불 불가.'
    },
    '5VOawBW5q0mSSOjtY247': {
      time: '10:00', end_time: '10:45', title: '🚗 Europcar 픽업 (FCO)',
      route_note: 'Parco Leonardo → Fiumicino Aeroporto FL1 1정거장 · 5분 (09:20 출발)',
      description: '터미널 렌터카 센터. 바우처·국제면허증·한국면허증·여권·신용카드 다섯 개 꺼내둘 것.\n카운터에서 추가 보험을 권해도 이미 Super Cover(면책 €0)라 필요 없어. 바우처에 포함 항목이 적혀 있어.\n인수 전 외관·휠·유리를 사진으로 한 바퀴 찍어둬.'
    },
    zGryCEYNMRutkM8w2WV3: { time: '12:15', end_time: '14:15', route_note: 'FCO → 오르비에토 약 130km · A1 1H30' },
    gl02VMPbxfcYvKMtBWqD: { time: '14:15', end_time: '15:20' },
    Cl846LEzMnXclVriubWy: { time: '17:00', end_time: '17:40',
      route_note: '오르비에토 → 카스틸리오네 도르차 약 85km · 1H30 (15:30 출발)',
      description: '⚠️ 체크인 마감 19:00. 늦어지면 +39 328 223 4821.\n짐 풀고 테라스에서 계곡 한 번 보고 나가.' },

    QOCXtqpoUV3eZ7Q6RIkp: { time: '06:30', end_time: '07:15',
      description: '9월 말 일출 07:20 전후. 어두울 때 도착해 호수 정면 산벽에 빛 드는 걸 보고 07:15에는 나서야 해.\n⚠️ 오늘 반납이 10:00이라 아침이 빡빡해. 늦잠 자면 여기부터 포기하는 게 안전해.\n차량통제는 7/1~9/15만이라 10월엔 자유 진입.' },
    DUBvxzlPkiaPzQQn7owQ: { time: '07:40', end_time: '08:20',
      title: '🧳 체크아웃 + 결제 (Lienharterhof)',
      description: '체크아웃 08:00~10:00. 짐은 전날 밤 싸두고 08:00에 결제만 하고 출발.\n여기서 €420 전액 현장 카드 결제 (Visa·MasterCard).\n08:20에는 반드시 출발해야 VCE 10:20 도착.' },
    OrIe4MzkFy7An72jDEih: { time: '10:00', end_time: '10:30', title: '🚗 Europcar 반납 (VCE)',
      route_note: '몬구엘포 → VCE 약 170km · A27 2시간 (08:20 출발)',
      description: '⚠️ 예약 반납 10:00. 이지젯 체크인 마감 11:05이라 서둘러야 해.\n· 주유는 VCE 진입 전 마지막 주유소에서 미리 (Full-to-Full)\n· 반납 전 차 상태 사진 남길 것\n· 편도료 €67.10 여기서 결제\n· 보증금 €500 홀드는 반납 후 해제 (은행에 따라 며칠)' },

    // ═══ B. 항공권 확정 ═══
    dc0ENJhfEXHHdB0qUck3: {
      title: '티웨이항공', city: 'TW405', time: '12:35', arrive: '19:15', duration: '13H 40M',
      amount: '1616000', payment_status: '결제 완료', status: '확정', payment_date: '2026-08-06',
      pnr: 'A36BLM', description: 'ICN (T1) → FCO (T3)',
      payment_method: '₩1,616,000 카드 결제 (마이리얼트립) · 왕복',
      baggage: '위탁 23kg 1개 포함',
      notes: '🎫 마이리얼트립 EA5VXE · 항공사 PNR A36BLM\n' +
        '📅 9/24(목) 12:35 인천 T1 → 19:15 로마 FCO T3 · 13H40 직항\n' +
        '🧳 무료 위탁 23kg 포함\n\n' +
        '⚠️ 결제한 실물 카드를 공항에 반드시 지참 — 본인 카드 확인 못 하면 탑승 거부될 수 있어\n' +
        '⚠️ 첫 구간 미탑승 시 귀국편도 자동 무효\n' +
        '💸 환불 시 (D-49 기준) 구간당 12만 × 2 + 여행사 3만 = 27만원 손실'
    },
    Da3lttIrUjSDuZFxOGHF: { title: '✈️ TW405 인천 → 로마 (13H40)',
      description: '티웨이 직항. FCO 제3터미널 도착 19:15.\n결제 카드 지참 확인 · 위탁 23kg 포함.' },
    rD7RUnsx2puTttiz04dT: {
      title: '티웨이항공', city: 'TW404', time: '18:50', arrive: '14:00', duration: '12H 10M',
      payment_status: '결제 완료', status: '확정', payment_date: '2026-08-06',
      pnr: 'A36BLM', description: 'FRA (T3) → ICN (T1)',
      baggage: '위탁 23kg 1개 포함',
      notes: '🎫 마이리얼트립 EA5VXE · 항공사 PNR A36BLM\n' +
        '📅 10/4(일) 18:50 프랑크푸르트 T3 → 10/5(월) 14:00 인천 T1 · 12H10 직항\n' +
        '🧳 무료 위탁 23kg 포함\n\n' +
        '⚠️ 프랑크푸르트 T3는 활주로 반대편이야. 기차는 T1에 서니까 SkyLine으로 갈아타야 해 (2분 간격, 10분)\n' +
        '   시내 → S8/S9 → FRA T1 → SkyLine → T3, 총 40~45분 잡을 것'
    },
    // ═══ C. 10/4 프랑크푸르트 T3 반영 ═══
    qDjvQR1tcf1sslqbWoxR: { time: '18:50', title: '✈️ TW404 프랑크푸르트 → 인천',
      route_note: '시내 → S8/S9 → FRA T1 → SkyLine → T3 · 총 40~45분 (15:00 출발, 15:45 도착)',
      description: '티웨이 직항 12H10 · 10/5(월) 14:00 인천 도착 · 그날은 대체공휴일이라 쉬어.\n⚠️ T3는 활주로 반대편이라 T1에서 SkyLine을 한 번 더 타야 해. 15:00에는 시내에서 출발할 것.' },
    emSoJ8LLwVzqFPWwgjNk: { time: '14:00', end_time: '14:50',
      description: '야경 대신 낮 산책. 강 건너 작센하우젠 뮤지엄 강변이 일요일에도 걷기 좋아.\n15:00에는 공항으로 출발해야 T3까지 여유 있어.' }
  };

  // ═══ D. finance ═══
  const F = {
    ZHk3JeNehxiGAAm5CkKs: { date: '2026-09-25', paid_date: '2026-08-06', amount: '551848',
      description: '렌트 · Europcar VW T-Cross · FCO→VCE 6일 · 면책€0 Super Cover (Auto Europe $387.61)',
      fx_amount: '', fx_currency: '' },
    HWqfAfEDxqLUtmElP3O9: { paid_date: '2026-08-06',
      description: '티웨이 TW405/TW404 · ICN→FCO / FRA→ICN 왕복 (마이리얼트립 EA5VXE · PNR A36BLM)' },
    M3Er5SwyhN5ohbj9u7xJ: { date: '2026-10-04', amount: '65000', paid_date: '',
      description: '기차 ICE · Leipzig Hbf → Frankfurt Hbf 10/4 08:30 (Sparpreis 예상 · 미구매)' }
  };
  // 안 가는 티켓 2건(시에나 대성당·보로스 컬렉션)은 이미 삭제되어 있어 여기서 다루지 않음
  const FDEL = {};
  const FNEW = [{
    trip: '2026 독일&이탈리아', currency: 'KRW', krw_amount: '',
    category: '렌트', date: '2026-10-01', amount: '110377', paid_date: '2026-10-01',
    description: '렌트 · 편도 반납료 €67.10 (VCE 현장 결제)', journey_id: 'dU0qdEpLIZbCgbQfVhjR'
  }];

  async function preview() {
    console.log('%c[최종 정리] 미리보기', 'font-weight:bold;font-size:14px');
    const miss = [];
    for (const id of Object.keys(J)) { const d = await db.collection('journey').doc(id).get(); if (!d.exists) miss.push('journey/' + id); }
    for (const id of Object.keys(F).concat(Object.keys(FDEL))) { const d = await db.collection('finance').doc(id).get(); if (!d.exists) miss.push('finance/' + id); }
    if (miss.length) { console.error('❌ 없는 문서:', miss); return; }
    console.log('\n■ journey ' + Object.keys(J).length + '건');
    console.log('   렌트카 확정 · 9/25 픽업 10:00 · 10/1 반납 10:00');
    console.log('   티웨이 확정 (PNR A36BLM · 위탁 23kg)');
    console.log('   10/4 프랑크푸르트 T3 → SkyLine 환승 반영 (15:00 시내 출발)');
    console.log('\n■ finance');
    for (const id of Object.keys(F)) {
      const d = await db.collection('finance').doc(id).get();
      console.log(`   수정  ${Number(d.data().amount).toLocaleString()} → ${Number(F[id].amount || d.data().amount).toLocaleString()}  ${String(F[id].description || d.data().description).slice(0,42)}`);
    }
    for (const id of Object.keys(FDEL)) console.log('   삭제  ' + FDEL[id]);
    console.log(`   신규  편도료 ₩${Number(FNEW[0].amount).toLocaleString()} (10/1 현장)`);
    console.log('%c\n진행하려면 → atelierFinal.apply()', 'color:#2563eb;font-weight:bold');
  }

  async function apply() {
    const bk = { j: {}, f: {}, fdel: {}, added: [] };
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
    for (const id of Object.keys(FDEL)) {
      const d = await db.collection('finance').doc(id).get();
      if (!d.exists) { console.error('❌ finance 없음, 중단:', id); return; }
      bk.fdel[id] = d.data();
    }

    const b = db.batch();
    Object.keys(J).forEach(id => b.update(db.collection('journey').doc(id), J[id]));
    Object.keys(F).forEach(id => b.update(db.collection('finance').doc(id), F[id]));
    Object.keys(FDEL).forEach(id => b.delete(db.collection('finance').doc(id)));
    await b.commit();

    const nb = db.batch();
    FNEW.forEach(x => { const r = db.collection('finance').doc(); bk.added.push(r.id); nb.set(r, x); });
    await nb.commit();

    try { localStorage.setItem(BK, JSON.stringify(bk)); } catch (e) { console.warn('백업 저장 실패:', e.message); }
    console.log('%c✅ 완료 — 새로고침해줘', 'color:#16a34a;font-weight:bold;font-size:14px');
    console.log('   렌트 ₩551,848(결제완료) + 편도료 ₩110,377(10/1 현장)');
    console.log('   티웨이 ₩1,616,000 결제 완료 · ICE ₩180,000 → ₩65,000');
    console.log('   안 가는 티켓 2건 ₩73,000 삭제');
  }

  async function undo() {
    const bk = JSON.parse(localStorage.getItem(BK) || 'null');
    if (!bk) return console.error('백업이 없어.');
    const b = db.batch();
    Object.keys(bk.j).forEach(id => { const p = {}; Object.keys(bk.j[id]).forEach(k => { if (bk.j[id][k] !== null) p[k] = bk.j[id][k]; }); b.update(db.collection('journey').doc(id), p); });
    Object.keys(bk.f).forEach(id => { const p = {}; Object.keys(bk.f[id]).forEach(k => { if (bk.f[id][k] !== null) p[k] = bk.f[id][k]; }); b.update(db.collection('finance').doc(id), p); });
    Object.keys(bk.fdel).forEach(id => b.set(db.collection('finance').doc(id), bk.fdel[id]));
    (bk.added || []).forEach(id => b.delete(db.collection('finance').doc(id)));
    await b.commit();
    console.log('%c↩️ 되돌림 완료', 'color:#f59e0b;font-weight:bold');
  }

  console.log('%c준비됨 → atelierFinal.preview()', 'color:#2563eb;font-weight:bold;font-size:14px');
  return { preview, apply, undo };
})();
