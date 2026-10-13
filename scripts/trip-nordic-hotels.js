// 북유럽 2027 예상 숙소 — 누리가 고른 '가운데 조합' (도시 1순위 + 코펜하겐 Savoy + 플롬은 옆 마을 아울란)
//
//   가격은 트립닷컴 한국 사이트 · 비회원가 · 세금 포함 · 2027년 해당 날짜 (10/8 조회).
//   ★ 전부 '예상'으로만 들어간다 — payment_status 비움, 예약번호 없음 → 지출이 아니라 예상 금액으로 잡힘.
//     예약하고 나면 카드에서 결제 상태·예약번호를 채우면 그때 진짜 지출이 된다.
//   booking_url = 트립닷컴에서 호텔 이름 + 날짜로 검색한 결과 (맨 위 줄이 그 호텔)
//
// 사용: Travel 페이지에서
//   import('./scripts/trip-nordic-hotels.js?x='+Date.now())
//   atelierNordicHotels.preview()   ← 어느 여행에 뭐가 들어가는지 + 이미 있는 숙소
//   atelierNordicHotels.apply()     ← 넣기 (같은 이름이 이미 있으면 건너뜀)
//   atelierNordicHotels.undo()      ← 이번에 넣은 것만 지우기
window.atelierNordicHotels = (function () {
  const db = window.db;
  const BK = 'atelier_nordic_hotels_added';
  const TAG = 'nordic-hotels-2027-mid';

  const url = (name, ci, co) => 'https://kr.trip.com/hotels/list?keyword=' + encodeURIComponent(name) +
    '&checkin=' + ci + '&checkout=' + co + '&adult=1&children=0&crn=1&curr=KRW';

  const H = [
    { city: '코펜하겐', title: 'Savoy Hotel', date: '2027-06-26', checkout_date: '2027-06-27', perNight: 286276,
      room_type: '싱글룸 (1인실)', cancel: '가능',
      notes: '평점 8.8 (55) · 무료취소 · 시내 1인실은 28만 아래가 거의 없음\n대안: Wakeup Carsten Niebuhrs Gade ₩198,907 (퀸, 작음)' },
    { city: '스톡홀름', title: 'Downtown Camper by Scandic', date: '2027-06-27', checkout_date: '2027-06-29', perNight: 218008,
      room_type: '컴포트 싱글 (1인실)',
      notes: '평점 8.9 (232) · 시내 한복판, 감라스탄 도보 · 옥상 사우나·수영장\n⚠️ 스톡홀름은 창문 없는 싱글을 싸게 많이 팔아 — 방 사진 확인' },
    { city: '오슬로', title: 'Scandic Vulkan', date: '2027-06-29', checkout_date: '2027-06-30', perNight: 233311,
      room_type: '스탠다드 싱글 (1인실)',
      notes: '평점 8.9 (132) · 그뤼네르로카, 마트할렌 푸드홀 바로 앞 · 안전하고 분위기 좋음\n대안: Home Hotel Folketeateret ₩226,264 (저녁 무료 포함)' },
    { city: '베르겐', title: 'Comfort Hotel Bergen', date: '2027-06-30', checkout_date: '2027-07-01', perNight: 196454,
      room_type: '컴팩트 싱글 (1인실)',
      notes: '평점 8.5 (48) · 베르겐은 전체가 안전' },
    { city: '울빅', title: 'Brakanes Hotel', date: '2027-07-01', checkout_date: '2027-07-02', perNight: 310131,
      room_type: '',
      notes: '평점 8.4 (47) · 울빅 안 유일한 큰 호텔 · 7월 피오르 마을은 방이 적어 일찍 잡을수록 좋음' },
    { city: '플롬', title: 'Hotel Aurlandsfjord (아울란)', search: 'Hotel Aurlandsfjord', date: '2027-07-02', checkout_date: '2027-07-03', perNight: 405492,
      room_type: '',
      notes: '평점 9.2 (126) · 플롬에서 차로 10분 옆 마을 아울란 · 플롬 Fretheim(₩593,902)보다 19만 원 쌈' },
    { city: '베르겐', title: 'Comfort Hotel Bergen', date: '2027-07-03', checkout_date: '2027-07-04', perNight: 196454,
      room_type: '컴팩트 싱글 (1인실)',
      notes: '평점 8.5 (48) · 이날은 렌터카가 있어서 주차 확인 필요\n대안: Citybox Danmarksplass ₩220,084 (통행료 구역 밖, 주차 편함)' }
  ];

  const nights = h => Math.round((new Date(h.checkout_date) - new Date(h.date)) / 864e5);

  async function findTrip() {
    const snap = await db.collection('trips').get();
    const list = snap.docs.map(d => Object.assign({ _id: d.id }, d.data()))
      .filter(t => /덴마크|스웨덴|북유럽/.test(t.name || '') && String(t.start_date || '').slice(0, 4) === '2027');
    if (list.length !== 1) { console.error('❌ 북유럽 2027 여행을 하나로 못 찾음:', list.map(t => t.name)); return null; }
    return list[0];
  }

  async function existing(tripId) {
    const snap = await db.collection('journey').where('trip_id', '==', tripId).get();
    return snap.docs.map(d => Object.assign({ _id: d.id }, d.data())).filter(d => d.type === '숙소');
  }

  const same = (a, h) => (a.title || '').trim() === h.title && a.date === h.date;

  async function preview() {
    const t = await findTrip(); if (!t) return;
    const ex = await existing(t._id);
    console.log('%c[' + t.name + '] 예상 숙소 미리보기', 'font-weight:bold;font-size:14px');
    console.table(H.map(h => ({ 체크인: h.date, 박: nights(h), 도시: h.city, 호텔: h.title, '1박': h.perNight.toLocaleString(), 합계: (h.perNight * nights(h)).toLocaleString(), 상태: ex.some(a => same(a, h)) ? '이미 있음 → 건너뜀' : '추가' })));
    const total = H.reduce((s, h) => s + h.perNight * nights(h), 0);
    console.log('8박 합계 ₩' + total.toLocaleString() + ' · 1박 평균 ₩' + Math.round(total / 8).toLocaleString());
    if (ex.length) {
      console.log('%c지금 이 여행에 있는 숙소 ' + ex.length + '개 (건드리지 않음):', 'color:#f59e0b;font-weight:bold');
      console.table(ex.map(a => ({ 체크인: a.date, 체크아웃: a.checkout_date, 도시: a.city, 이름: a.title, 금액: a.amount, 결제: a.payment_status || '' })));
    }
    console.log('%c진행하려면 → atelierNordicHotels.apply()', 'color:#2563eb;font-weight:bold');
  }

  async function apply() {
    const t = await findTrip(); if (!t) return;
    const ex = await existing(t._id);
    const added = [];
    for (const h of H) {
      if (ex.some(a => same(a, h))) { console.log('건너뜀(이미 있음):', h.date, h.title); continue; }
      const n = nights(h);
      const ref = db.collection('journey').doc();
      await ref.set({
        trip_id: t._id, type: '숙소', city: h.city, title: h.title,
        date: h.date, checkout_date: h.checkout_date,
        amount: String(h.perNight * n),
        room_type: h.room_type, guests: '성인 1명', cancel: h.cancel || '',
        payment_status: '', booking_url: url(h.search || h.title, h.date, h.checkout_date),
        notes: '💡 예상 숙소 (예약 전) · 트립닷컴 1박 ₩' + h.perNight.toLocaleString() + ' × ' + n + '박 · 2026-10-08 조회가\n' + h.notes,
        plan: TAG, createdAt: Date.now()
      });
      added.push(ref.id);
    }
    try { localStorage.setItem(BK, JSON.stringify(added)); } catch (e) {}
    try { localStorage.removeItem('atelier_snapshot_journey'); } catch (e) {}
    console.log('%c✅ ' + added.length + '개 추가 — 새로고침해줘', 'color:#16a34a;font-weight:bold;font-size:14px');
  }

  async function undo() {
    const t = await findTrip(); if (!t) return;
    const snap = await db.collection('journey').where('trip_id', '==', t._id).get();
    const mine = snap.docs.filter(d => d.data().plan === TAG);
    for (const d of mine) await d.ref.delete();
    try { localStorage.removeItem('atelier_snapshot_journey'); } catch (e) {}
    console.log('%c↩️ ' + mine.length + '개 지움', 'color:#f59e0b;font-weight:bold');
  }

  console.log('%c준비됨 → atelierNordicHotels.preview()', 'color:#2563eb;font-weight:bold;font-size:14px');
  return { preview, apply, undo };
})();
