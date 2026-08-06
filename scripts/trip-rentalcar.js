// 렌트카 확정 — Auto Europe / Europcar VW T-Cross (9/25 10:00 FCO → 10/1 10:00 VCE, 6일)
//  · 이미 결제: $387.61 (Auto Europe, 카드)
//  · 현장 결제: €67.10 편도료 (Europcar, 유로)
//  · 보증금 €500 pre-authorization (청구 아님)
// + 픽업 10:00 / 반납 10:00에 맞춰 9/25 · 10/1 일정 재배치
window.atelierCar = (function () {
  const TRIP = 'I5T6Gu4qU1BtbHg2slYE';
  const db = window.db;
  const BK = 'atelier_car_backup';

  const J = {
    // ── 렌트카 카드
    dU0qdEpLIZbCgbQfVhjR: {
      date: '2026-09-25', time: '10:00',
      title: 'Europcar — VW T-Cross (컴팩트 SUV, 오토)',
      status: '확정', payment_status: '결제 완료',
      pickup_location: 'Europcar FCOT01 · Rome Fiumicino Airport · Via dell\'Aeroporto di Fiumicino, 00054 Roma',
      drop_location: 'Europcar VCET01 · Venice Marco Polo Airport · Via Luigi Broglio SNC, 30173 Venezia',
      amount: '551848', payment_date: '2026-08-06',
      payment_method: '$387.61 카드 결제 (Auto Europe) ≈ ₩551,848 · 현장 편도료 €67.10 별도',
      notes:
        '🎫 Auto Europe 바우처 718357750 · Europcar 예약번호 1205688924\n' +
        '📅 9/25(금) 10:00 FCO 픽업 → 10/1(목) 10:00 VCE 반납 · 6일\n' +
        '☎️ 픽업 +39 06 6576 1211 (07:00~23:59) · 반납 +39 041 541 5654 (08:00~23:30)\n' +
        '\n💳 이미 결제 $387.61 / 현장 €67.10 (편도료, 유로 청구)\n' +
        '🔒 보증금 €500 카드 pre-authorization — 청구 아니고 홀드. 한도 여유 비워둘 것\n' +
        '\n✅ 요금 포함: 무제한 주행 · Full-to-Full · 면책 €0 (CDW+도난)\n' +
        '   Super Cover — 휠/타이어 · 유리 · 앞유리 · 미러 · 외부등 · 지붕 · 하부\n' +
        '   고장·견인 · 미사용일 환불 · 부속품(GPS/카시트) · 대인배상 · 화재\n' +
        '\n🪪 반드시 지참 (없으면 대여 거부 + 환불 불가)\n' +
        '   · 국제운전면허증 원본 (한국 면허는 비라틴 문자라 필수)\n' +
        '   · 한국 운전면허증 원본 (사본·디지털 불가)\n' +
        '   · 여권\n' +
        '   · 본인 명의 실물 신용카드 (Visa·MC·Amex·JCB)\n' +
        '   · 바우처 인쇄본\n' +
        '\n⚠️ 무료취소 9/23 10:00까지. 이후 취소·미수령·서류 미비는 전액 환불 불가.'
    },

    // ── 9/25 픽업 (08:30 → 10:00)
    '5VOawBW5q0mSSOjtY247': {
      time: '10:00', end_time: '10:45',
      title: '🚗 Europcar 픽업 (FCO)',
      route_note: 'Parco Leonardo → Fiumicino Aeroporto FL1 1정거장 · 5분 (09:20 출발)',
      description: '터미널 렌터카 센터. 바우처·국제면허증·한국면허증·여권·신용카드 다섯 개 다 꺼내둘 것.\n카운터에서 추가 보험을 권할 텐데 이미 Super Cover(면책 €0)라 필요 없어. 바우처에 포함 항목이 적혀 있으니 보여주면 돼.\n인수 전 차 외관·휠·유리를 사진으로 한 바퀴 찍어둬.'
    },
    // 9/25 이후 일정 (픽업이 1시간 30분 밀려서 뒤로)
    zGryCEYNMRutkM8w2WV3: { time: '12:15', end_time: '14:15',
      route_note: 'FCO → 오르비에토 약 130km · A1 1H30' },
    gl02VMPbxfcYvKMtBWqD: { time: '14:15', end_time: '15:20' },
    Cl846LEzMnXclVriubWy: { time: '17:00', end_time: '17:40',
      route_note: '오르비에토 → 카스틸리오네 도르차 약 85km · 1H30 (15:30 출발)',
      description: '⚠️ 체크인 마감 19:00. 늦어지면 +39 328 223 4821로 연락.\n짐 풀고 테라스에서 계곡 한 번 보고 나가.' },

    // ── 10/1 반납 (11:45 → 10:00) · 아침 역산
    QOCXtqpoUV3eZ7Q6RIkp: { time: '06:30', end_time: '07:15',
      description: '9월 말 일출 07:20 전후. 어두울 때 도착해 호수 정면 산벽에 빛 드는 걸 보고 07:15에는 나서야 해.\n⚠️ 오늘 반납이 10:00이라 아침이 빡빡해. 늦잠 자면 여기부터 포기하는 게 안전해.\n차량통제는 7/1~9/15만이라 10월엔 자유 진입.' },
    DUBvxzlPkiaPzQQn7owQ: { time: '07:40', end_time: '08:20',
      title: '🧳 체크아웃 + 결제 (Lienharterhof)',
      description: '체크아웃 08:00~10:00. 짐은 전날 밤 미리 싸두고 08:00에 결제만 하고 바로 출발.\n여기서 €420 전액 현장 카드 결제 (Visa·MasterCard).\n08:20에는 반드시 출발해야 VCE 10:20 도착이야.' },
    OrIe4MzkFy7An72jDEih: { time: '10:00', end_time: '10:30',
      title: '🚗 Europcar 반납 (VCE)',
      route_note: '몬구엘포 → VCE 약 170km · A27 2시간 (08:20 출발)',
      description: '⚠️ 예약 반납 10:00. 조금 늦어도 유예가 있지만 이지젯 체크인 마감이 11:05이라 서둘러야 해.\n· 주유는 VCE 진입 전 마지막 주유소에서 미리 (Full-to-Full)\n· 반납 전 차 상태를 사진으로 남겨둘 것\n· 편도료 €67.10을 여기서 카드 결제\n· 보증금 €500 홀드는 반납 후 해제 (은행에 따라 며칠 걸림)' }
  };

  // ── finance
  const F = {
    ZHk3JeNehxiGAAm5CkKs: {
      date: '2026-09-25', paid_date: '2026-08-06', amount: '551848',
      description: '렌트 · Europcar VW T-Cross · FCO→VCE 6일 · 면책€0 Super Cover (Auto Europe $387.61)',
      fx_amount: '', fx_currency: ''
    }
  };
  const FNEW = [{
    trip: '2026 독일&이탈리아', currency: 'KRW', krw_amount: '',
    category: '렌트', date: '2026-10-01', amount: '110377', paid_date: '2026-10-01',
    description: '렌트 · 편도 반납료 €67.10 (VCE 현장 결제)', journey_id: 'dU0qdEpLIZbCgbQfVhjR'
  }];

  async function preview() {
    console.log('%c[렌트카 확정] 미리보기', 'font-weight:bold;font-size:14px');
    const rows = [];
    for (const id of Object.keys(J)) {
      const d = await db.collection('journey').doc(id).get();
      if (!d.exists) { console.error('❌ journey 없음:', id); return; }
      const o = d.data(), p = J[id];
      rows.push({ 날짜: p.date || o.date,
        기존: `${o.time || ''} ${String(o.title || '').slice(0, 26)}`,
        변경: `${p.time || o.time || ''} ${String(p.title || o.title || '').slice(0, 26)}` });
    }
    console.table(rows);
    for (const id of Object.keys(F)) {
      const d = await db.collection('finance').doc(id).get();
      if (!d.exists) { console.error('❌ finance 없음:', id); return; }
      console.log(`finance 수정: ${Number(d.data().amount).toLocaleString()} → ${Number(F[id].amount).toLocaleString()}`);
    }
    console.log(`finance 신규: 편도료 ₩${Number(FNEW[0].amount).toLocaleString()} (10/1 현장)`);
    console.log('%c진행하려면 → atelierCar.apply()', 'color:#2563eb;font-weight:bold');
  }

  async function apply() {
    const bk = { j: {}, f: {}, added: [] };
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
    const b = db.batch();
    Object.keys(J).forEach(id => b.update(db.collection('journey').doc(id), J[id]));
    Object.keys(F).forEach(id => b.update(db.collection('finance').doc(id), F[id]));
    await b.commit();

    const nb = db.batch();
    FNEW.forEach(x => { const r = db.collection('finance').doc(); bk.added.push(r.id); nb.set(r, x); });
    await nb.commit();

    try { localStorage.setItem(BK, JSON.stringify(bk)); } catch (e) { console.warn('백업 저장 실패:', e.message); }
    console.log('%c✅ 완료 — 새로고침해줘', 'color:#16a34a;font-weight:bold;font-size:14px');
    console.log('   렌트 ₩551,848 (결제완료) + 편도료 ₩110,377 (10/1 현장)');
    console.log('   9/25  10:00 픽업 → 12:15 오르비에토 → 17:00 카스틸리오네');
    console.log('   10/1  06:30 브라이에스 → 08:20 출발 → 10:00 VCE 반납');
  }

  async function undo() {
    const bk = JSON.parse(localStorage.getItem(BK) || 'null');
    if (!bk) return console.error('백업이 없어.');
    const b = db.batch();
    Object.keys(bk.j).forEach(id => { const p = {}; Object.keys(bk.j[id]).forEach(k => { if (bk.j[id][k] !== null) p[k] = bk.j[id][k]; }); b.update(db.collection('journey').doc(id), p); });
    Object.keys(bk.f).forEach(id => { const p = {}; Object.keys(bk.f[id]).forEach(k => { if (bk.f[id][k] !== null) p[k] = bk.f[id][k]; }); b.update(db.collection('finance').doc(id), p); });
    (bk.added || []).forEach(id => b.delete(db.collection('finance').doc(id)));
    await b.commit();
    console.log('%c↩️ 되돌림 완료', 'color:#f59e0b;font-weight:bold');
  }

  console.log('%c준비됨 → atelierCar.preview()', 'color:#2563eb;font-weight:bold;font-size:14px');
  return { preview, apply, undo };
})();
