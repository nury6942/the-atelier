// 중간 기착지 볼로냐 → 베로나 교체 (9/26~9/27)
// Dimora Giardino di Giulietta 예약 반영 + 9/27 오전 일정 베로나로 재구성
window.atelierVr = (function () {
  const TRIP = 'I5T6Gu4qU1BtbHg2slYE';
  const db = window.db;
  const BK = 'atelier_vr_backup';

  const PATCH = {
    // ── 숙소 카드
    adA1z7lSlKF2qFfkreZs: {
      date: '2026-09-26', checkout_date: '2026-09-27',
      title: 'Dimora Giardino di Giulietta', city: 'Verona, 베네토 이탈리아',
      address: 'Via G. Grioli 2, 37122 Verona (VR)',
      phone: '+39-339-392-2653', lat: 45.4317, lng: 10.9960,
      booking_ref: '1400828107029591 (PIN 5945)',
      room_type: '수페리어 가든 뷰 스위트(파티오) · 킹침대 1개 + 소파침대 2개 · 50m² · 정원 뷰 · 금연',
      checkin: '15:00', checkout: '10:30', breakfast: '불포함', guests: '성인 1명',
      cancel: '가능', cancel_date: '2026-09-22',
      cancel_policy_detail: '2026-09-22 18:00 (호텔 현지시간) 전 무료취소',
      amount: '193952', onsite_amount: '5775', onsite_fee: '€3.50 · 도시세 현장 결제',
      payment_status: '결제 완료', payment_date: '2026-08-06',
      payment_method: '₩193,952 카드 결제 — 객실 187,046 + 세금·부대비 17,580 − 다이아몬드 등급 10,674',
      checkin_note: '⚠️ 체크인 15:00~20:00 (20시 마감) · 체크아웃 07:00~10:30',
      notes: '✅ ZTL 밖이야 — Via Grioli는 치타델라·포르타 누오바 구역이라 차로 문 앞까지 갈 수 있어.\n📅 베로나 ZTL: 월~금 10:00–18:00 + 20:00–23:00 / 토·일·공휴일 10:00–13:30\n   → 토요일 오후 도착·일요일 오전 출발이라 제한 시간에 안 걸려.\n🅿️ 자체 주차장은 없음. 파르케조 치타델라(APCOA, 지하 755면, 24시간) 이용 — 1시간 €2~3, 6~24시간 €20. Tel +39 045 596500\n   숙소에 제휴 주차 있는지 미리 물어보면 더 싸게 될 수도 있어.\n🍽️ 식사 불포함\n📝 요청사항 제출됨: 조용한 객실 · 담배 냄새 제거'
    },

    // ── 9/26 토스카나 → 베로나 (390km, 4시간)
    f8a0Kv1oBPeoqsV4jMFV: { time: '12:30', end_time: '13:30',
      description: '🌿 사이프러스 도로와 성벽 마을. 여기서 점심까지 해결해. 베로나까지 390km·4시간이라 13:30에는 출발해야 해.' },
    w0qnVyYljPcPVjSXNQB9: { time: '17:45', end_time: '18:15',
      title: '🏨 Dimora Giardino di Giulietta 체크인', city: 'Verona, 베네토 이탈리아',
      lat: 45.4317, lng: 10.9960,
      route_note: '몬티키엘로 → 베로나 약 390km · A1 → A22 브레너 · 4H (휴게소 1회 포함)',
      description: '⚠️ 체크인 마감 20:00. 늦어지면 +39 339 392 2653으로 연락.\n차는 파르케조 치타델라에 두고 걸어서 구시가로 들어가면 돼. ZTL은 토요일 13:30에 이미 끝나 있어.' },
    eAPZOLEx76HSesVWFRhW: { time: '19:00', end_time: '21:30',
      title: '🍽️ 베로나 저녁 + 피아차 브라·아레나 야경',
      city: 'Verona, 베네토 이탈리아', lat: 45.4390, lng: 10.9944,
      route_note: '숙소 → 피아차 브라 도보 약 12분',
      description: '조명 들어온 아레나를 끼고 피아차 브라를 한 바퀴. 광장 둘레 리스톤(Liston) 회랑에 식당이 늘어서 있어.\n토요일 밤이라 Via Mazzini 상점들도 늦게까지 열어 — 저녁 먹고 걸어 올라가면 딱이야.' },

    // ── 9/27 오전: 볼로냐 → 베로나 재구성
    T74r1RIkvR1hOkWpnRdg: { time: '08:30', end_time: '09:20',
      title: '🏛️ 아레나 디 베로나 + 피아차 브라',
      city: 'Verona, 베네토 이탈리아', lat: 45.4390, lng: 10.9944,
      route_note: '숙소에서 도보 12분',
      description: '서기 30년경 로마 원형극장. 콜로세움보다 오래됐고 지금도 오페라를 올려. 일요일 아침엔 사람이 적어서 외관 돌기 좋아.\n(내부 관람은 09:00 개장 — 시간 되면 들어가도 좋고 밖에서 봐도 충분해)' },
    DYg9Wha9HTx5oKK0g5RJ: { time: '09:30', end_time: '10:10',
      title: '🛍️ Via Mazzini → 피아차 델레 에르베',
      city: 'Verona, 베네토 이탈리아', lat: 45.4430, lng: 10.9977,
      description: '이탈리아에서 손꼽히는 보행 쇼핑 거리. 대리석 포장에 브랜드·편집숍이 이어져.\n끝나면 피아차 델레 에르베 — 로마 시대 포룸 자리에 프레스코 벽화 건물들이 둘러선 광장이야. 카사 디 줄리에타도 여기서 골목 하나.\n⚠️ 일요일이라 상점은 10시쯤 열어. 문 닫혀 있어도 거리 자체가 볼거리야.' },
    UBeS2A4MfW7tmCJf5eIh: { time: '10:20', end_time: '11:45',
      title: '🏛️ 카스텔베키오 미술관 (카를로 스카르파)',
      city: 'Verona, 베네토 이탈리아', lat: 45.4399, lng: 10.9887,
      route_note: '피아차 에르베 → 카스텔베키오 도보 12분',
      description: '⭐ 오늘의 핵심. 14세기 성채를 카를로 스카르파가 1958~64년에 리노베이션한 건물이야. 전시 디자인의 교과서로 통해 — 옛 구조를 지우지 않고 콘크리트·철·나무를 겹쳐 넣은 방식이 그대로 남아 있어.\n특히 칸그란데 기마상을 공중에 걸어둔 그 배치는 사진으로 많이 봤을 거야. 소장품보다 건물 자체를 보러 가는 곳이야.\n화~일 10:00~18:00 (월요일 휴관) · 마지막 입장 17:15' },
    Jl6Jq3Et769uNVniD9aL: { time: '15:15', end_time: '15:45',
      route_note: '베로나 → 몬구엘포 약 200km · A22 브레너 2H20 (12:45 출발)' }
  };

  // 신규 2건
  const NEW = [
    { date: '2026-09-27', time: '08:00', end_time: '08:20', title: '🏨 체크아웃 (Dimora)',
      city: 'Verona, 베네토 이탈리아', lat: 45.4317, lng: 10.9960,
      description: '체크아웃 07:00~10:30. 식사 불포함이라 아침은 구시가에서. 짐은 차에 싣고 파르케조 치타델라에 세워두면 돼.' },
    { date: '2026-09-27', time: '11:55', end_time: '12:45', title: '🍽️ 베로나 점심',
      city: 'Verona, 베네토 이탈리아', lat: 45.4390, lng: 10.9944,
      description: '카스텔베키오에서 나와 피아차 브라 쪽으로. 먹고 바로 출발해야 몬구엘포에 15시대 도착이야.' }
  ];

  const CITY = { VbjHRKc6jDkuftV6VAOt: { name: 'Verona, 베네토 이탈리아', start_date: '2026-09-26', end_date: '2026-09-27', nights: 1 } };

  async function preview() {
    console.log('%c[볼로냐 → 베로나 교체] 미리보기', 'font-weight:bold;font-size:14px');
    const rows = [];
    for (const id of Object.keys(PATCH)) {
      const d = await db.collection('journey').doc(id).get();
      if (!d.exists) { console.error('❌ 문서 없음:', id); return; }
      const o = d.data(), p = PATCH[id];
      rows.push({ 날짜: p.date || o.date,
        기존: `${o.time || '—'} ${String(o.title || '').slice(0, 24)}`,
        변경: `${p.time || o.time || '—'} ${String(p.title || o.title || '').slice(0, 24)}` });
    }
    console.table(rows);
    console.log('신규 ' + NEW.length + '건: ' + NEW.map(n => n.time + ' ' + n.title).join(' / '));
    console.log('%c진행하려면 → atelierVr.apply()', 'color:#2563eb;font-weight:bold');
  }

  async function apply() {
    const bk = { j: {}, c: {}, added: [] };
    for (const id of Object.keys(PATCH)) {
      const d = await db.collection('journey').doc(id).get();
      if (!d.exists) { console.error('❌ 문서 없음, 중단:', id); return; }
      const o = d.data(), s = {};
      Object.keys(PATCH[id]).forEach(k => { s[k] = (o[k] === undefined ? null : o[k]); });
      bk.j[id] = s;
    }
    const cd = await db.collection('trip_cities').doc('VbjHRKc6jDkuftV6VAOt').get();
    if (cd.exists) bk.c['VbjHRKc6jDkuftV6VAOt'] = { name: cd.data().name, start_date: cd.data().start_date, end_date: cd.data().end_date, nights: cd.data().nights };

    const b = db.batch();
    Object.keys(PATCH).forEach(id => b.update(db.collection('journey').doc(id), PATCH[id]));
    Object.keys(CITY).forEach(id => b.update(db.collection('trip_cities').doc(id), CITY[id]));
    await b.commit();

    const nb = db.batch();
    NEW.forEach(n => { const r = db.collection('journey').doc(); bk.added.push(r.id); nb.set(r, Object.assign({ type: '일정', trip_id: TRIP }, n)); });
    await nb.commit();

    try { localStorage.setItem(BK, JSON.stringify(bk)); } catch (e) { console.warn('백업 저장 실패:', e.message); }

    console.log('%c✅ 완료 — 새로고침해줘', 'color:#16a34a;font-weight:bold;font-size:14px');
    console.log('   9/26  13:30 몬티키엘로 출발 → 17:45 베로나 체크인 → 19:00 아레나 야경');
    console.log('   9/27  08:30 아레나 → 09:30 Via Mazzini → 10:20 카스텔베키오 → 12:45 출발 → 15:15 몬구엘포');
    console.log('%c   ⚠️ Hotel Astoria 볼로냐 예약 취소 (무료취소 9/29)', 'color:#f59e0b;font-weight:bold');
  }

  async function undo() {
    const bk = JSON.parse(localStorage.getItem(BK) || 'null');
    if (!bk) return console.error('백업이 없어.');
    const b = db.batch();
    Object.keys(bk.j).forEach(id => {
      const p = {}; Object.keys(bk.j[id]).forEach(k => { if (bk.j[id][k] !== null) p[k] = bk.j[id][k]; });
      b.update(db.collection('journey').doc(id), p);
    });
    (bk.added || []).forEach(id => b.delete(db.collection('journey').doc(id)));
    Object.keys(bk.c).forEach(id => b.update(db.collection('trip_cities').doc(id), bk.c[id]));
    await b.commit();
    console.log('%c↩️ 되돌림 완료', 'color:#f59e0b;font-weight:bold');
  }

  console.log('%c준비됨 → atelierVr.preview()', 'color:#2563eb;font-weight:bold;font-size:14px');
  return { preview, apply, undo };
})();
