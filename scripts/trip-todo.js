// 예약 미완 항목에 [예약필요] 표시 + 마감일 명시
// 숙소 6곳은 전부 완료. 남은 건 항공·렌트·기차·현지 예약 6건.
window.atelierTodo = (function () {
  const TRIP = 'I5T6Gu4qU1BtbHg2slYE';
  const db = window.db;
  const BK = 'atelier_todo_backup';

  const PATCH = {
    // ── ① 티웨이 출국편 (최우선 — 숙소 6곳이 이 날짜에 묶여 있음)
    dc0ENJhfEXHHdB0qUck3: {
      title: '🎫 [예약필요] 티웨이항공 TW405',
      status: '예약 필요',
      notes: '⚠️ 1순위 — 아직 미예매. 숙소 6곳(₩1,894,655)이 전부 이 날짜에 묶여 있어.\n· 9/24(목) ICN 12:35 → FCO 19:15 · 왕복 ₩1,600,000\n· TW405는 매일 운항이라 9/24 목요일은 문제없어\n· 돌아오는 TW404가 10/4(일)에 뜨는지 반드시 확인 (운항 요일 정보가 엇갈려)'
    },
    rD7RUnsx2puTttiz04dT: {
      title: '🎫 [예약필요] 티웨이항공 TW404',
      status: '예약 필요',
      notes: '⚠️ 출국편과 같은 왕복 건이야.\n· 10/4(일) FRA 19:40 → 10/5(월) 14:50 ICN\n· ⚠️ 10/4는 일요일 — TW404 운항 요일이 화·목·토라는 자료와 일·화·목·토라는 자료가 엇갈려. 예매 화면에서 직접 확인할 것'
    },

    // ── ② Europcar (방향 역전 + 기간 5일→6일)
    dU0qdEpLIZbCgbQfVhjR: {
      title: '🎫 [재예약필요] Europcar — FCO 픽업 → VCE 반납',
      status: '예약 필요', payment_status: '재견적 필요',
      notes: '⚠️ 방향이 완전히 뒤집혔어. 기존 VCE→FCO 예약은 못 써.\n· 픽업  9/25(금) 08:30 로마 FCO 렌터카 센터\n· 반납 10/1(목) 11:45 베네치아 VCE 공항\n· 6일 (기존 5일 계약보다 하루 늘어남)\n· 편도 반납료(로마→베네치아) 재확인 필요\n· 기존 견적 ₩880,000 — 방향·기간 바뀌었으니 새로 받아야 해'
    },

    // ── ③ 라이언에어 (방향 역전)
    dZhJpR9YhFFANEOu70kF: {
      title: '🎫 [재구매필요] 라이언에어 VCE → BER',
      status: '예약 필요',
      notes: '⚠️ 방향 역전 — 기존 BER→VCE 표(€93.51)는 사용 불가.\n· 10/1(목) 베네치아 VCE → 베를린 BER\n· 렌트카 반납 11:45 이후 출발편으로 잡을 것 (현재 14:00 가정)\n· 위탁 수하물 포함 요금인지 확인'
    },

    // ── ④ ICE (방향 역전)
    '3UJ9oefcwtAAoFrCFHum': {
      title: '🎫 [재구매필요] ICE: Leipzig Hbf → Frankfurt Hbf',
      status: '예약 필요',
      notes: '⚠️ 방향 역전 — 기존 프랑크푸르트→라이프치히 표(₩180,000)는 사용 불가.\n· 10/4(일) 08:30 전후 출발 · 약 3시간 · 11:30 도착\n· 지금 D-59면 Super Sparpreis €20~40 가능 — 기존보다 쌀 확률 높아\n· 기존 표 환불 확인: Flexpreis=전액 / Sparpreis=€10 수수료 / Super Sparpreis=환불불가\n· 출국편이 19:40이라 오후 프랑크푸르트 시내 시간은 충분해'
    },

    // ── ⑤ 세체다 케이블카 (2026년 신규 예약제)
    BXG58jsikQ6IHlTtsmci: {
      title: '🎫 [예약필요] 세체다 (2,500m) — 시간대 사전예약',
      description: '⚠️ 2026년부터 오르티세이-푸르네스-세체다 케이블카는 온라인 시간대 사전예약이 필수야. 당일 현장 구매 안 돼.\n· seceda.it 에서 9/30(수) 10:00 슬롯 예약\n· 몬구엘포에서 75km·1H20이라 08:15 출발 기준\n· 해발 2,500m. 케이블카에서 내리면 그 톱니 능선이 정면으로 열려. 오늘은 하루를 통째로 썼으니 능선 따라 Pieralongia 방향으로 더 걸어들어가도 돼.'
    },

    // ── ⑥ 트레치메 유료도로
    '2yc3a7IpsnEUvLzAWNXh': {
      title: '🎫 [마감] 트레치메 유료도로 예약 — 오늘 밤 23:59',
      description: '⚠️ 내일(9/28) 트레치메 유료도로 €40. **전날 23:59가 마감**이라 오늘 밤 안에 반드시 예약해야 해.\n· 차량번호가 필요할 수 있어 — 렌트카 등록증 확인\n· 미예약 시 진입 자체가 안 돼서 다음날 일정이 통째로 날아가\n· 예약 완료하면 확인 메일/QR을 오프라인 저장해둘 것 (산간 통신 불안정)'
    },

    // ── 알페 디 시우시 (예약 불필요 — 혼동 방지용 메모)
    '1vxI5rU9PYBAZ72DzuAb': {
      description: '✅ 사전예약 불필요 — 현장에서 왕복권 사면 돼.\n운행 5/22~11/2, 08:00~18:00. SP24 진입도로는 09:00~17:00 일반차량 통제라 곤돌라가 유일한 길이야.'
    }
  };

  // 출발 전 체크리스트 (첫날 상단에 고정)
  const NEW = [{
    date: '2026-09-24', time: '00:01', end_time: '00:02',
    title: '🎫 출발 전 예약 체크리스트',
    city: 'Seoul, 대한민국',
    description:
      '숙소 6곳(10박 ₩1,894,655)은 전부 예약 완료 ✅\n\n' +
      '남은 예약 —\n' +
      '① 티웨이 왕복 ₩1,600,000  ← 최우선, 숙소가 다 이 날짜에 묶여 있음\n' +
      '   9/24 ICN→FCO / 10/4 FRA→ICN · 10/4(일) TW404 운항 여부 확인\n' +
      '② Europcar  FCO 픽업 9/25 08:30 → VCE 반납 10/1 11:45 (6일, 방향 역전)\n' +
      '③ 라이언에어 VCE→BER  10/1 (방향 역전, 기존 표 무효)\n' +
      '④ ICE 라이프치히→프랑크푸르트  10/4 08:30 (방향 역전, Sparpreis 노려볼 것)\n' +
      '⑤ 세체다 케이블카 시간대 예약 — 9/30 10:00 슬롯 (seceda.it)\n' +
      '⑥ 트레치메 유료도로 €40 — 9/27 밤 23:59 마감 (현지에서)\n\n' +
      '취소 확인 —\n' +
      'MARER · Bliss · harry\'s home · HYPERION · Astoria · Casa Mac & Rose (전부 취소 완료)\n\n' +
      '숙소 무료취소 마감 —\n' +
      '8/27 23:59  Lienharterhof (€408 위약금)  ← 제일 빠름\n' +
      '9/22 18:00  Dimora Giardino di Giulietta\n' +
      '9/24 18:00  B&B Hotel Roma FCO\n' +
      '9/25 14:00  Ermione\n' +
      '9/30 23:59  Casa Camper Berlin\n' +
      '10/2 18:00  Stay KooooK Leipzig'
  }];

  async function preview() {
    console.log('%c[예약 필요 항목 표시]', 'font-weight:bold;font-size:14px');
    const rows = [];
    for (const id of Object.keys(PATCH)) {
      const d = await db.collection('journey').doc(id).get();
      if (!d.exists) { console.error('❌ 문서 없음:', id); return; }
      const o = d.data(), p = PATCH[id];
      rows.push({ 날짜: o.date, 기존: String(o.title || '').slice(0, 30),
                  변경: String(p.title || o.title || '').slice(0, 34) });
    }
    console.table(rows);
    console.log('신규 1건: 9/24 00:01 🎫 출발 전 예약 체크리스트');
    console.log('%c진행하려면 → atelierTodo.apply()', 'color:#2563eb;font-weight:bold');
  }

  async function apply() {
    const bk = { j: {}, added: [] };
    for (const id of Object.keys(PATCH)) {
      const d = await db.collection('journey').doc(id).get();
      if (!d.exists) { console.error('❌ 문서 없음, 중단:', id); return; }
      const o = d.data(), s = {};
      Object.keys(PATCH[id]).forEach(k => { s[k] = (o[k] === undefined ? null : o[k]); });
      bk.j[id] = s;
    }
    const b = db.batch();
    Object.keys(PATCH).forEach(id => b.update(db.collection('journey').doc(id), PATCH[id]));
    await b.commit();

    const nb = db.batch();
    NEW.forEach(n => { const r = db.collection('journey').doc(); bk.added.push(r.id); nb.set(r, Object.assign({ type: '일정', trip_id: TRIP }, n)); });
    await nb.commit();

    try { localStorage.setItem(BK, JSON.stringify(bk)); } catch (e) { console.warn('백업 저장 실패:', e.message); }

    console.log('%c✅ 완료 — 새로고침해줘', 'color:#16a34a;font-weight:bold;font-size:14px');
    console.log('   🎫 [예약필요] 표시 6건 + 9/24 체크리스트 1건');
    console.log('%c   ⚠️ Lienharterhof 무료취소 8/27 23:59 — 제일 빠른 마감이야', 'color:#f59e0b;font-weight:bold');
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
    await b.commit();
    console.log('%c↩️ 되돌림 완료', 'color:#f59e0b;font-weight:bold');
  }

  console.log('%c준비됨 → atelierTodo.preview()', 'color:#2563eb;font-weight:bold;font-size:14px');
  return { preview, apply, undo };
})();
