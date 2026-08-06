// 항공편 확정 (티웨이 실제 시각 + 이지젯) & finance 전면 정리
//  · 대한항공 환불 완료 → 예산에서 삭제
//  · 취소한 옛 숙소 9건 삭제 → 새 숙소 6곳 + 도시세로 교체
//  · 라이언에어 → 이지젯 (VCE→BER 11:45), 10/1 아침 시각 재배치
window.atelierFin = (function () {
  const TRIP = 'I5T6Gu4qU1BtbHg2slYE';
  const TRIPNAME = '2026 독일&이탈리아';
  const db = window.db;
  const BK = 'atelier_fin_backup';

  // ═══════════ journey ═══════════
  const J = {
    // ── 티웨이 출국편 (금액 확정)
    dc0ENJhfEXHHdB0qUck3: {
      title: '티웨이항공', city: 'TW405', time: '12:35', arrive: '19:15', duration: '13H 40M',
      amount: '1616000', payment_status: '예약 필요', status: '예약 필요',
      description: 'ICN (T1) → FCO (T3)',
      notes: '⚠️ 아직 미예매 — 숙소 6곳(₩1,894,655)이 전부 이 날짜에 묶여 있어. 1순위야.\n· 9/24(목) ICN 12:35 → FCO 19:15 · 13H40 직항\n· 왕복 ₩1,616,000 (마이리얼트립 기준)\n· ✅ 10/4 TW404 일요일 운항 확인됨'
    },
    // ── 티웨이 귀국편 (시각 정정: 19:40→18:50, 도착 14:50→14:00)
    rD7RUnsx2puTttiz04dT: {
      title: '티웨이항공', city: 'TW404', time: '18:50', arrive: '14:00', duration: '12H 10M',
      payment_status: '예약 필요', status: '예약 필요',
      description: 'FRA → ICN (T1)',
      notes: '✅ 10/4(일) 운항 확인됨 (내가 앞서 요일을 확신 못 했던 부분 해결)\n· 10/4(일) FRA 18:50 → 10/5(월) 14:00 ICN · 12H10 직항\n· 도착일이 대체공휴일이라 그날은 쉬어'
    },
    qDjvQR1tcf1sslqbWoxR: {
      time: '18:50', title: '✈️ TW404 프랑크푸르트 → 인천',
      route_note: '시내 → FRA 공항 S8/S9 약 15분 (15:30 출발, 16:00 도착)',
      description: '티웨이 직항 12H10 · 10/5(월) 14:00 인천 도착 · 그날은 대체공휴일이라 쉬어. 품평(10/8)까지 3일 여유.\n⚠️ 18:50 출발이라 늦어도 16:00에는 공항에 있어야 해.'
    },

    // ── 라이언에어 → 이지젯 교체
    dZhJpR9YhFFANEOu70kF: {
      title: '🎫 [예약필요] 이지젯 VCE → BER', city: 'easyJet',
      time: '11:45', arrive: '13:25', duration: '1H 40M', route: 'VCE → BER',
      amount: '134827', payment_status: '예약 필요', status: '예약 필요',
      notes: '· 10/1(목) 베네치아 VCE 11:45 → 베를린 BER 13:25 · 직항 1H40\n· ₩134,827 (직항 최저가)\n· 라이언에어는 이 구간을 안 뛰어서 이지젯으로 감\n⚠️ 위탁 수하물 별도 — 예매 시 꼭 추가할 것\n⚠️ 11:45 출발이라 Europcar를 10:40에는 반납해야 해. 그날 아침이 빡세'
    },
    W0ttn9Uy7LRWMCNPxqaH: {
      time: '11:45', end_time: '13:25',
      title: '✈️ 이지젯 VCE → 베를린 BER', city: 'Berlin, 독일',
      description: '직항 1H40. 라이언에어가 이 구간을 안 뛰어서 이지젯으로 바꿨어.\n⚠️ 체크인 마감 11:05 — 렌트 반납하고 바로 들어가야 해.'
    },

    // ── 10/1 아침 재배치 (이지젯 11:45 기준 역산)
    QOCXtqpoUV3eZ7Q6RIkp: {
      time: '06:30', end_time: '07:45',
      description: '9월 말 일출은 07:20쯤. 어두울 때 도착해서 호수 정면 산벽에 빛 들어오는 걸 보고 07:45에는 출발해야 해.\n⚠️ 오늘은 이지젯 11:45라 아침이 빡빡해. 늦잠 자면 이 일정부터 포기하는 게 안전해.\n차량통제는 7/1~9/15만이라 10월엔 자유롭게 들어가.'
    },
    DUBvxzlPkiaPzQQn7owQ: {
      time: '08:05', end_time: '08:30',
      description: '브라이에스 → 몬구엘포 15km·20분. 체크아웃 08:00~10:00이라 시간 맞아.\n결제는 여기서 — 선결제가 없어서 €420 전액을 현장 카드로 내. Visa·Mastercard.\n08:30에는 반드시 출발.'
    },
    OrIe4MzkFy7An72jDEih: {
      time: '10:40', end_time: '11:00',
      title: '🚗 Europcar 반납 (VCE)',
      route_note: '몬구엘포 → VCE 약 170km · A27 2시간 (08:30 출발)',
      description: '⚠️ 이지젯 11:45 체크인 마감이 11:05이라 여유가 25분뿐이야.\n· 주유는 VCE 공항 진입 전 마지막 주유소에서 미리 (반납지 주유소 줄 서면 끝)\n· 반납 검사에 시간 걸리면 바로 위험해지니 08:30 출발을 지킬 것'
    },
    rT39YdhmaoXfBR9FrRf0: {
      time: '13:45', end_time: '14:30',
      description: 'BER 도착 13:25. FEX 공항특급 또는 S9로 시내까지 약 30~40분.'
    },
    iNJSyXPGvyaNhjpyINfn: { time: '15:00', end_time: '15:30',
      title: '🏨 Casa Camper Berlin 체크인',
      description: '체크인 15:00부터. 미테 한복판이라 짐 풀고 바로 걸어 나가면 돼.' },
    XtYDwnjSfJrEGjUOoh5X: { time: '15:45', end_time: '18:00' },
    YgbvtWHsVcpePH1LS0fY: { time: '19:00', end_time: '19:45' },
    '3rwCsxbTohQmnspez83l': { time: '20:00', end_time: '21:30' }
  };

  // ═══════════ finance ═══════════
  const DEL = {
    TLTf1xCNwZlLhz5YtqhH: '대한항공 KE945/KE932 ₩2,204,318 — 환불 완료',
    '1suuCRsuh7kBbOZPNP7u': '프랑크푸르트 Bliss ₩59,500 — 예약 취소',
    rdpCVJsgYRcKI9nemcFw: '프랑크푸르트 Bliss 도시세 ₩3,316 — 예약 취소',
    wV9YjgvHgBCqO6oHPsp3: '라이프치히 HYPERION ₩165,797 — 예약 취소',
    Od7JsN5br3SDGHZerEE8: '라이프치히 HYPERION 도시세 ₩8,356 — 예약 취소',
    n0IatCNhx8KREcCn28ob: "베를린 harry's home ₩542,130 — 예약 취소",
    g4Bt936wrrOpSOuCiA1b: '돌로미티 MARER ₩692,955 — 예약 취소',
    oSN4WaS758JgN8pwBmgI: '볼로냐 Astoria ₩176,464 — 예약 취소',
    LcNOLLcvTYFH4ZFdTnEU: '볼로냐 Astoria 도시세 ₩10,777 — 예약 취소',
    oA1thnKhj8z18NR92Quc: '토스카나 Casa Mac & Rose ₩369,576 — 예약 취소'
  };

  const FUPD = {
    RlKSIeLZ1NRKxyThp7TY: { description: '라이언에어 FR401 · 미사용 손실 (VCE→BER는 이지젯으로 대체)' },
    ZHk3JeNehxiGAAm5CkKs: { description: 'Europcar · FCO→VCE 6일 (재견적 필요 — 방향·기간 변경)' },
    M3Er5SwyhN5ohbj9u7xJ: { description: '기차 ICE · Leipzig Hbf → Frankfurt Hbf (재구매 필요 — 방향 역전)' }
  };

  const base = { trip: TRIPNAME, currency: 'KRW', krw_amount: '' };
  const FNEW = [
    { category: '항공', date: '2026-09-24', amount: '1616000', paid_date: '',
      description: '티웨이 TW405/TW404 · ICN→FCO / FRA→ICN 왕복', journey_id: 'dc0ENJhfEXHHdB0qUck3' },
    { category: '항공', date: '2026-10-01', amount: '134827', paid_date: '',
      description: '이지젯 VCE→BER · 직항 1H40', journey_id: 'dZhJpR9YhFFANEOu70kF' },
    { category: '숙소', date: '2026-09-24', amount: '212791', paid_date: '2026-08-06',
      description: '피우미치노 · B&B Hotel Roma FCO (9/24~9/25)', journey_id: 'qSHNf2ATo9U0er1TRN5v' },
    { category: '숙소', date: '2026-09-24', amount: '8085', paid_date: '',
      description: '피우미치노 · B&B Hotel 도시세 €4.90 (현장)', journey_id: 'qSHNf2ATo9U0er1TRN5v' },
    { category: '숙소', date: '2026-09-25', amount: '222069', paid_date: '',
      description: '카스틸리오네 도르차 · Ermione (9/25~9/26) · 청소비·장작·도시세 포함', journey_id: '2wTJjghF1IZCXt25bzUE' },
    { category: '숙소', date: '2026-09-26', amount: '193952', paid_date: '2026-08-06',
      description: '베로나 · Dimora Giardino di Giulietta (9/26~9/27)', journey_id: 'adA1z7lSlKF2qFfkreZs' },
    { category: '숙소', date: '2026-09-26', amount: '5775', paid_date: '',
      description: '베로나 · Dimora 도시세 €3.50 (현장)', journey_id: 'adA1z7lSlKF2qFfkreZs' },
    { category: '숙소', date: '2026-09-27', amount: '691085', paid_date: '',
      description: '몬구엘포 · Lienharterhof (9/27~10/1, 4박) · 조식·도시세 포함 · 현장 결제', journey_id: '0OcjJRe9KcVJQxuatje4' },
    { category: '숙소', date: '2026-10-01', amount: '420021', paid_date: '2026-08-06',
      description: '베를린 · Casa Camper (10/1~10/3, 2박)', journey_id: '2Ryw28Fa8LvdpnyfopuE' },
    { category: '숙소', date: '2026-10-01', amount: '34452', paid_date: '',
      description: '베를린 · Casa Camper 도시세 €20.88 (현장)', journey_id: '2Ryw28Fa8LvdpnyfopuE' },
    { category: '숙소', date: '2026-10-03', amount: '154737', paid_date: '2026-08-06',
      description: '라이프치히 · Stay KooooK (10/3~10/4)', journey_id: 'K77sjwwBaP6YuNCF9DdA' },
    { category: '숙소', date: '2026-10-03', amount: '7640', paid_date: '',
      description: '라이프치히 · Stay KooooK 도시세 €4.63 (현장)', journey_id: 'K77sjwwBaP6YuNCF9DdA' }
  ];

  async function preview() {
    console.log('%c[항공편 확정 + finance 정리]', 'font-weight:bold;font-size:14px');
    const miss = [];
    for (const id of Object.keys(J)) { const d = await db.collection('journey').doc(id).get(); if (!d.exists) miss.push('journey/' + id); }
    for (const id of Object.keys(DEL).concat(Object.keys(FUPD))) { const d = await db.collection('finance').doc(id).get(); if (!d.exists) miss.push('finance/' + id); }
    if (miss.length) { console.error('❌ 없는 문서:', miss); return; }
    console.log('\n■ journey ' + Object.keys(J).length + '건 수정');
    console.log('   TW404  19:40 → 18:50 / 도착 14:50 → 14:00');
    console.log('   라이언에어 → 이지젯 VCE→BER 11:45~13:25 ₩134,827');
    console.log('   10/1 아침: 브라이에스 07:45 출발 · 체크아웃 08:30 · 반납 10:40');
    console.log('\n■ finance 삭제 ' + Object.keys(DEL).length + '건');
    let d0 = 0;
    for (const id of Object.keys(DEL)) { const s = await db.collection('finance').doc(id).get(); d0 += Number(s.data().amount || 0); console.log('   − ' + DEL[id]); }
    console.log('   삭제 합계 ₩' + d0.toLocaleString());
    const n0 = FNEW.reduce((a, x) => a + Number(x.amount), 0);
    console.log('\n■ finance 신규 ' + FNEW.length + '건 · 합계 ₩' + n0.toLocaleString());
    FNEW.forEach(x => console.log(`   + ${x.category}  ${String(Number(x.amount).toLocaleString()).padStart(9)}  ${x.description.slice(0, 44)}`));
    console.log('%c\n진행하려면 → atelierFin.apply()', 'color:#2563eb;font-weight:bold');
  }

  async function apply() {
    const bk = { j: {}, fdel: {}, fupd: {}, added: [] };
    for (const id of Object.keys(J)) {
      const d = await db.collection('journey').doc(id).get();
      if (!d.exists) { console.error('❌ journey 없음, 중단:', id); return; }
      const o = d.data(), s = {}; Object.keys(J[id]).forEach(k => { s[k] = (o[k] === undefined ? null : o[k]); }); bk.j[id] = s;
    }
    for (const id of Object.keys(DEL)) {
      const d = await db.collection('finance').doc(id).get();
      if (!d.exists) { console.error('❌ finance 없음, 중단:', id); return; }
      bk.fdel[id] = d.data();
    }
    for (const id of Object.keys(FUPD)) {
      const d = await db.collection('finance').doc(id).get();
      if (!d.exists) { console.error('❌ finance 없음, 중단:', id); return; }
      const o = d.data(), s = {}; Object.keys(FUPD[id]).forEach(k => { s[k] = (o[k] === undefined ? null : o[k]); }); bk.fupd[id] = s;
    }

    const b = db.batch();
    Object.keys(J).forEach(id => b.update(db.collection('journey').doc(id), J[id]));
    Object.keys(FUPD).forEach(id => b.update(db.collection('finance').doc(id), FUPD[id]));
    Object.keys(DEL).forEach(id => b.delete(db.collection('finance').doc(id)));
    await b.commit();

    const nb = db.batch();
    FNEW.forEach(x => { const r = db.collection('finance').doc(); bk.added.push(r.id); nb.set(r, Object.assign({}, base, x)); });
    await nb.commit();

    try { localStorage.setItem(BK, JSON.stringify(bk)); } catch (e) { console.warn('백업 저장 실패:', e.message); }

    console.log('%c✅ 완료 — 새로고침해줘', 'color:#16a34a;font-weight:bold;font-size:14px');
    console.log('   대한항공 ₩2,204,318 삭제 · 옛 숙소 9건 ₩2,028,871 삭제');
    console.log('   티웨이 ₩1,616,000 · 이지젯 ₩134,827 · 새 숙소 6곳 + 도시세 4건 추가');
    console.log('%c   ⚠️ 렌트카·ICE는 금액 그대로야 (재견적·재구매 후 직접 수정)', 'color:#f59e0b');
  }

  async function undo() {
    const bk = JSON.parse(localStorage.getItem(BK) || 'null');
    if (!bk) return console.error('백업이 없어.');
    const b = db.batch();
    Object.keys(bk.j).forEach(id => { const p = {}; Object.keys(bk.j[id]).forEach(k => { if (bk.j[id][k] !== null) p[k] = bk.j[id][k]; }); b.update(db.collection('journey').doc(id), p); });
    Object.keys(bk.fupd).forEach(id => { const p = {}; Object.keys(bk.fupd[id]).forEach(k => { if (bk.fupd[id][k] !== null) p[k] = bk.fupd[id][k]; }); b.update(db.collection('finance').doc(id), p); });
    Object.keys(bk.fdel).forEach(id => b.set(db.collection('finance').doc(id), bk.fdel[id]));
    (bk.added || []).forEach(id => b.delete(db.collection('finance').doc(id)));
    await b.commit();
    console.log('%c↩️ 되돌림 완료 (삭제한 finance 10건도 복원됨)', 'color:#f59e0b;font-weight:bold');
  }

  console.log('%c준비됨 → atelierFin.preview()', 'color:#2563eb;font-weight:bold;font-size:14px');
  return { preview, apply, undo };
})();
