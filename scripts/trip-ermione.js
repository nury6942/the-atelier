// 토스카나 숙소 확정 — Ermione (카스틸리오네 도르차) 9/25~9/26
// + 체크아웃 08:00 규정에 맞춰 9/26 아침 동선 재배치
window.atelierErm = (function () {
  const db = window.db;
  const BK = 'atelier_erm_backup';

  const PATCH = {
    // ── 숙소 카드
    '2wTJjghF1IZCXt25bzUE': {
      date: '2026-09-25', checkout_date: '2026-09-26',
      title: 'Ermione', city: "Castiglione d'Orcia, 시에나 이탈리아",
      address: "Via della Costa 36, 53023 Castiglione d'Orcia (SI)",
      phone: '+39 328 223 4821', lat: 43.0048, lng: 11.6157,
      booking_ref: '5559.650.964 (PIN 0478)',
      room_type: '1베드룸 아파트 50m² · 발코니 · 테라스 · 파티오 · 벽난로 · 주방 · 세탁기 · 식기세척기',
      checkin: '16:00', checkout: '10:00', breakfast: '불포함', guests: '성인 1명',
      cancel: '가능', cancel_date: '2026-09-25',
      cancel_policy_detail: '2026-09-25 14:00 (현지시간)까지 무료취소 · 이후 €102.96 위약금 · 숙박 일정 변경 불가',
      amount: '222069', onsite_amount: '', onsite_fee: '도시세 €2 결제액에 포함 — 현장 추가 없음',
      payment_status: '예약 완료 (결제 예정)', payment_date: '',
      payment_method: '₩222,069 (€134.96) — 아파트 131,575 + VAT 10% 13,158 + 청소비 €30 49,363 + 장작 €15 24,682 + 도시세 3,291 / 9/23부터 카드 청구',
      checkin_note: '⚠️ 체크인 16:00~19:00 (19시 마감 엄수) · 체크아웃 08:00~10:00',
      notes: '⚠️ 도착 예정 시간을 숙소에 미리 연락할 것 (+39 328 223 4821)\n🪪 체크인 시 사진 부착 신분증 + 신용카드 제시 필요 · 파손 시 체크아웃 후 €150까지 청구 가능\n🅿️ 숙소 인근 공영주차장 무료 (사전예약 불필요) — 언덕 구시가라 숙소 앞 주차는 아님\n🔥 벽난로 있음 — 장작 요금 €15가 이미 요금에 포함돼 있어\n🍽️ 식사 불포함 · 주방·오븐·인덕션·식기세척기 완비\n📍 피아차 델 베키에타 도보권 · Osteria Il Tinaio, La Locanda del Loggiato\n허가번호 052007LTN0007'
    },

    // ── 9/25 체크인
    Cl846LEzMnXclVriubWy: {
      time: '16:00', end_time: '16:40',
      title: '🏨 Ermione 체크인', city: "Castiglione d'Orcia, 시에나 이탈리아",
      lat: 43.0048, lng: 11.6157,
      route_note: '오르비에토 → 카스틸리오네 도르차 약 85km · 1H20 (14:30 출발)',
      description: '⚠️ 체크인 마감이 19:00이야. 오르비에토에서 늦어지면 반드시 미리 전화(+39 328 223 4821).\n짐 풀고 테라스에서 계곡 한 번 보고 나가. 발 도르차 지는 해가 이 집의 값어치야.'
    },

    // ── 9/25 저녁 (산 퀴리코 → 카스틸리오네)
    lFzFOEwyffDFXEEtrmpe: {
      time: '19:00', end_time: '20:45',
      title: '🍷 카스틸리오네 도르차 마을 저녁',
      city: "Castiglione d'Orcia, 시에나 이탈리아", lat: 43.0048, lng: 11.6157,
      description: '숙소에서 도보. 피아차 델 베키에타(삼각형 광장, 17세기 우물)를 중심으로 식당이 모여 있어.\n· Osteria Il Tinaio — 구시가 안, 수제 파스타·그릴\n· La Locanda del Loggiato — 광장 정면, 현대적 토스카나\n⚠️ 9월 말 비수기라 휴무일 수 있어. 안 열면 바뇨 비뇨니(5.2km)나 산 퀴리코(6.4km)로.'
    },

    // ── 9/26 체크아웃 (08:00부터 가능)
    VHM8xSltvpajHU4cLzFT: {
      time: '08:00', end_time: '08:20',
      title: '☕ 아침 + 체크아웃',
      description: '⚠️ 체크아웃이 08:00~10:00이라 07:30엔 못 나가. 조식 불포함이니 커피머신으로 간단히 하고 출발.'
    },

    // ── 9/26 아침 동선 재배치 (숙소가 바뇨 비뇨니 쪽으로 내려와서 순서 뒤집음)
    pMpMAKzafEQM7ckjHY9P: {
      time: '08:30', end_time: '09:15',
      route_note: '카스틸리오네 도르차 → 바뇨 비뇨니 5.2km · 10분',
      description: '♨️ 숙소에서 제일 가까워서 아침 첫 코스로 올렸어. 마을 한복판이 통째로 르네상스 온천탕인데, 아침에 수면에서 김이 피어오르는 게 이 마을의 그림이야. 발은 담글 수 있어.'
    },
    m0txEi5tS4xwix7SvfOx: { time: '09:35', end_time: '10:10',
      route_note: '바뇨 비뇨니 → 산 퀴리코 북쪽 약 10km · 15분' },
    vjY8ofTd6vYsm3mkofD3: { time: '10:20', end_time: '10:55' },
    '5NHmspbdo1b0AMnSg2Q9': { time: '11:10', end_time: '12:15' },
    f8a0Kv1oBPeoqsV4jMFV: { time: '12:30', end_time: '13:50',
      description: '🌿 사이프러스 도로와 성벽 마을. 여기서 점심까지 해결하고 볼로냐로 출발해. 마을 오스테리아에서 피치(pici) 파스타가 유명해.' },
    w0qnVyYljPcPVjSXNQB9: { time: '17:00', end_time: '17:30',
      route_note: '몬티키엘로 → 볼로냐 약 250km · A1 2H45 (14:00 출발)' },
    eAPZOLEx76HSesVWFRhW: { time: '19:00', end_time: '21:00' }
  };

  async function preview() {
    console.log('%c[Ermione 확정 + 9/26 동선 재배치] 미리보기', 'font-weight:bold;font-size:14px');
    const rows = [];
    for (const id of Object.keys(PATCH)) {
      const d = await db.collection('journey').doc(id).get();
      if (!d.exists) { console.error('❌ 문서 없음:', id); return; }
      const o = d.data(), p = PATCH[id];
      rows.push({
        날짜: p.date || o.date,
        기존: `${o.time || '—'} ${String(o.title || '').slice(0, 24)}`,
        변경: `${p.time || o.time || '—'} ${String(p.title || o.title || '').slice(0, 24)}`
      });
    }
    console.table(rows);
    console.log('%c진행하려면 → atelierErm.apply()', 'color:#2563eb;font-weight:bold');
  }

  async function apply() {
    const bk = {};
    for (const id of Object.keys(PATCH)) {
      const d = await db.collection('journey').doc(id).get();
      if (!d.exists) { console.error('❌ 문서 없음, 중단:', id); return; }
      const o = d.data(), s = {};
      Object.keys(PATCH[id]).forEach(k => { s[k] = (o[k] === undefined ? null : o[k]); });
      bk[id] = s;
    }
    try { localStorage.setItem(BK, JSON.stringify(bk)); console.log('백업 저장 완료'); }
    catch (e) { console.warn('백업 저장 실패(용량):', e.message, '— 그래도 진행'); }

    const b = db.batch();
    Object.keys(PATCH).forEach(id => b.update(db.collection('journey').doc(id), PATCH[id]));
    await b.commit();

    console.log('%c✅ 완료 — 새로고침해줘', 'color:#16a34a;font-weight:bold;font-size:14px');
    console.log('   9/25  16:00 Ermione 체크인 (마감 19:00) · 19:00 카스틸리오네 마을 저녁');
    console.log('   9/26  08:00 체크아웃 → 08:30 바뇨 비뇨니 → 치프레시니 → 비탈레타 → 피엔차 → 몬티키엘로 → 볼로냐');
    console.log('%c   ⚠️ Casa Mac & Rose 옛 예약 취소 확인 (무료취소 9/29)', 'color:#f59e0b');
  }

  async function undo() {
    const bk = JSON.parse(localStorage.getItem(BK) || 'null');
    if (!bk) return console.error('백업이 없어.');
    const b = db.batch();
    Object.keys(bk).forEach(id => {
      const p = {}; Object.keys(bk[id]).forEach(k => { if (bk[id][k] !== null) p[k] = bk[id][k]; });
      b.update(db.collection('journey').doc(id), p);
    });
    await b.commit();
    console.log('%c↩️ 되돌림 완료', 'color:#f59e0b;font-weight:bold');
  }

  console.log('%c준비됨 → atelierErm.preview()', 'color:#2563eb;font-weight:bold;font-size:14px');
  return { preview, apply, undo };
})();
