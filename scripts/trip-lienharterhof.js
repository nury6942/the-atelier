// 돌로미티 숙소 확정 — Lienharterhof (몬구엘포) 9/27~10/1, 4박
// + 실제 GPS 좌표(46.77728, 12.10770)로 몬구엘포 항목 일괄 보정
window.atelierLh = (function () {
  const db = window.db;
  const BK = 'atelier_lh_backup';
  const LAT = 46.77728, LNG = 12.10770;

  const PATCH = {
    // ── 숙소 카드
    '0OcjJRe9KcVJQxuatje4': {
      date: '2026-09-27', checkout_date: '2026-10-01',
      title: 'Lienharterhof', city: 'Monguelfo, 이탈리아',
      address: 'Mitterberg 38, 39035 Monguelfo (BZ)',
      phone: '+39 0474 950258', lat: LAT, lng: LNG,
      booking_ref: '5612.002.651 (PIN 1402)',
      room_type: '더블룸 20m² · 발코니 · 산 전망 · 욕조 · 파티오 · 전용 욕실 · 금연',
      checkin: '14:00', checkout: '10:00', breakfast: '포함', guests: '성인 1명',
      cancel: '가능', cancel_date: '2026-08-27',
      cancel_policy_detail: '2026-08-27 23:59 (현지시간)까지 무료취소 · 8/28 00:00부터 €408 위약금 · 일정 변경 불가',
      amount: '691085', onsite_amount: '', onsite_fee: '도시세 €12(₩19,745) 최종금액에 포함 — 현장 추가 없음',
      payment_status: '예약 완료 · 현장 결제', payment_date: '',
      payment_method: '₩691,085 (€420.00) 숙소 현장 결제 — 숙박 610,309 + VAT 10% 61,031 + 도시세 19,745 / Visa·Mastercard 가능 · 선결제 없음',
      checkin_note: '⚠️ 체크인 14:00~20:00 (20시 마감) · 체크아웃 08:00~10:00',
      notes: '🅿️ 호텔 내 전용 무료 주차 (사전예약 불필요)\n☕ 조식 포함 — 조식 평가 "완벽함"\n🛁 욕조 + 발코니 + 파티오 · 산 전망 · 4박 내내 쓰는 방이라 여기 값어치가 나와\n⚠️ 계단으로만 위층 이동 (엘리베이터 없음) — 짐 들고 올라가야 해\n🍽️ 부설 레스토랑·바 있음 · Wi-Fi 전 구역 무료\n📍 브라이에스 진입로 분기점 · 트레치메(동)와 발 가르데나(서) 중간\n허가번호 IT021052A134IFBGZ6'
    },

    // ── 9/27 체크인
    Jl6Jq3Et769uNVniD9aL: {
      time: '15:15', end_time: '15:50', lat: LAT, lng: LNG,
      title: '🏨 Lienharterhof 체크인', city: 'Monguelfo, 이탈리아',
      route_note: '베로나 → 몬구엘포 약 200km · A22 브레너 2H20 (12:45 출발)',
      description: '⚠️ 체크인 마감 20:00. 늦어지면 +39 0474 950258.\n호텔 내 전용 무료 주차라 차는 그냥 대면 돼. 다만 엘리베이터가 없어서 짐은 계단으로 올려야 해.\n여기가 4박 베이스야 — 짐 다 풀어놓고 사흘 동안 트레치메·알페 디 시우시·세체다를 돌아.'
    },

    // ── 10/1 체크아웃
    DUBvxzlPkiaPzQQn7owQ: {
      time: '08:30', end_time: '09:15',
      title: '🧳 숙소 복귀 + 체크아웃 (Lienharterhof)',
      lat: LAT, lng: LNG,
      description: '브라이에스 일출 보고 돌아와서 체크아웃. 체크아웃 08:00~10:00이라 시간 맞아.\n결제는 여기서 해 — 선결제가 없어서 €420 전액을 현장에서 카드로 내. Visa·Mastercard 가능.\n09:20에는 출발해야 VCE 반납(11:45) 맞아.'
    },

    // ── 좌표 보정 (9/30 몬구엘포 항목들)
    '5Uqb6pGPCf7572E5VwHD': { lat: LAT, lng: LNG },
    jRfLPrf9ry4bP5W9wKjp: { lat: LAT, lng: LNG },
    '0vRdTtOgc6IPhAC8XVUW': { lat: LAT, lng: LNG },
    '1A4I7f9GKGImjfozeyNs': { lat: LAT, lng: LNG },
    QiH6NkGhYexykW5QPDLK: { lat: LAT, lng: LNG },
    BoqZX4qTshe5zcHgA3KT: { lat: LAT, lng: LNG },
    zMfRJO0fag8j1vQkB3Dy: { lat: LAT, lng: LNG },
    hm0dWWJtuBcAGH9362Yb: { lat: LAT, lng: LNG }
  };

  async function preview() {
    console.log('%c[Lienharterhof 확정 + 좌표 보정] 미리보기', 'font-weight:bold;font-size:14px');
    const rows = [];
    for (const id of Object.keys(PATCH)) {
      const d = await db.collection('journey').doc(id).get();
      if (!d.exists) { console.error('❌ 문서 없음:', id); return; }
      const o = d.data(), p = PATCH[id];
      const only = Object.keys(p).length === 2 && p.lat !== undefined;
      rows.push({
        날짜: o.date, 항목: String(p.title || o.title || o.city || '').slice(0, 28),
        변경: only ? `좌표만 ${o.lat} → ${LAT}` : `${p.time || o.time || ''} ${p.amount ? '₩' + Number(p.amount).toLocaleString() : '내용 갱신'}`
      });
    }
    console.table(rows);
    console.log('%c진행하려면 → atelierLh.apply()', 'color:#2563eb;font-weight:bold');
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
    catch (e) { console.warn('백업 저장 실패:', e.message, '— 그래도 진행'); }

    const b = db.batch();
    Object.keys(PATCH).forEach(id => b.update(db.collection('journey').doc(id), PATCH[id]));
    await b.commit();

    console.log('%c✅ 완료 — 새로고침해줘', 'color:#16a34a;font-weight:bold;font-size:14px');
    console.log('   Lienharterhof · 9/27(일)~10/1(목) 4박 · ₩691,085 (€420) 현장 결제 · 조식 포함');
    console.log('   몬구엘포 좌표 8건 보정 (46.7519 → 46.77728)');
    console.log('%c   ⚠️ 무료취소 8/27 23:59까지 — 8/28부터는 €408 전액 위약금', 'color:#f59e0b;font-weight:bold');
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

  console.log('%c준비됨 → atelierLh.preview()', 'color:#2563eb;font-weight:bold;font-size:14px');
  return { preview, apply, undo };
})();
