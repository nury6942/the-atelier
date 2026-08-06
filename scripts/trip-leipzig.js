// 라이프치히 숙소 확정 — Stay KooooK Leipzig City (10/3~10/4)
window.atelierLpz = (function () {
  const db = window.db;
  const BK = 'atelier_lpz_backup';

  const PATCH = {
    // 숙소 카드
    K77sjwwBaP6YuNCF9DdA: {
      date: '2026-10-03', checkout_date: '2026-10-04',
      title: 'Stay KooooK Leipzig City', city: 'Leipzig, 독일',
      address: 'Gottschedstraße 10, 04109 라이프치히, 독일',
      phone: '+49-800-0566665', lat: 51.3406, lng: 12.3676,
      booking_ref: '1400828106899630 (PIN 6706)',
      room_type: '싱글룸 · 더블침대 1개 · 16m² · 에어컨 · 전용 욕실 · 금연',
      checkin: '15:00', checkout: '11:00', breakfast: '불포함', guests: '성인 1명',
      cancel: '가능', cancel_date: '2026-10-02',
      cancel_policy_detail: '2026-10-02 18:00 (호텔 현지시간) 전 무료취소',
      amount: '154737', onsite_amount: '7640', onsite_fee: '€4.63 · 도시세 현장 결제',
      payment_status: '결제 완료', payment_date: '2026-08-06',
      payment_method: '₩154,737 카드 결제 — 객실 160,569 + 세금·부대비 11,521 − 회원 특가 17,353',
      checkin_note: '⚠️ 온라인 체크인 방식 · 체크인 15:00~24:00 / 체크아웃 01:00~11:00',
      notes: '📍 Gottschedstraße — 19:30 저녁 잡아둔 바로 그 거리야. 숙소 앞이 식당가.\n⛪ 성 토마스 교회(바흐) 도보 5분 · 마르크트 광장 500m · 중앙역 도보 14분\n🔑 온라인 체크인이라 프런트 상주 안 할 수 있어. 도착 전에 체크인 링크·도어코드 메일 확인해둘 것.\n🍽️ 식사 불포함'
    },

    // 15:00 짐 드롭 → 체크인 (체크인 시작이 15:00이라 바로 입실 가능)
    eN8kY4LpjcBx4Pvn2VVo: {
      time: '15:00', end_time: '15:25',
      title: '🏨 Stay KooooK 체크인', city: 'Leipzig, 독일',
      description: '체크인 시작이 15:00이라 짐만 맡기지 말고 바로 들어가면 돼. 온라인 체크인이니 도어코드로 입실. 짐 풀고 GRASSI로.'
    },

    // 10/4 체크아웃
    SCBhSabQvXIfr7svcDwP: {
      time: '07:30', end_time: '08:00',
      title: '🏨 체크아웃 (Stay KooooK)', city: 'Leipzig, 독일',
      description: '체크아웃 11:00까지지만 08:30 ICE라 일찍 나서. 도어코드 반납 없이 키만 두고 나오면 되는 방식이야. 중앙역까지 도보 14분.'
    }
  };

  async function preview() {
    console.log('%c[라이프치히 숙소 확정] 미리보기', 'font-weight:bold;font-size:14px');
    const rows = [];
    for (const id of Object.keys(PATCH)) {
      const d = await db.collection('journey').doc(id).get();
      if (!d.exists) { console.error('❌ 문서 없음:', id); return; }
      const o = d.data(), p = PATCH[id];
      rows.push({
        기존: `${o.date || ''} ${o.time || ''} ${String(o.title || '').slice(0, 26)} ${o.amount || ''}`,
        변경: `${p.date || o.date} ${p.time || o.time || ''} ${String(p.title || o.title || '').slice(0, 26)} ${p.amount || ''}`
      });
    }
    console.table(rows);
    console.log('%c진행하려면 → atelierLpz.apply()', 'color:#2563eb;font-weight:bold');
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
    console.log('   Stay KooooK Leipzig City · 10/3(토)~10/4(일) · ₩154,737 + 도시세 €4.63');
    console.log('%c   ⚠️ HYPERION 기존 예약 취소 잊지 마 (무료취소 9/26 18:00)', 'color:#f59e0b;font-weight:bold');
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

  console.log('%c준비됨 → atelierLpz.preview()', 'color:#2563eb;font-weight:bold;font-size:14px');
  return { preview, apply, undo };
})();
