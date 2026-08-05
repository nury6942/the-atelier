// 9/24 로마 IN → 10/4 프랑크푸르트 OUT · 10박
// 앞 5일 −1일 시프트 + 돌로미티 3박→4박 (알페 디 시우시 / 세체다 분리)
// 로마 B&B Hotel 예약 반영
window.atelier10 = (function () {
  const TRIP = 'I5T6Gu4qU1BtbHg2slYE';
  const db = window.db;
  const BK = 'atelier_10n_backup';

  // ── 앞 5일 −1일
  const SHIFT = {
    '2026-09-25': '2026-09-24',  // 인천 → 로마
    '2026-09-26': '2026-09-25',  // 렌트 → 오르비에토 → 산 퀴리코
    '2026-09-27': '2026-09-26',  // 발 도르차 → 볼로냐
    '2026-09-28': '2026-09-27',  // 볼로냐 → 돌로미티
    '2026-09-29': '2026-09-28'   // 트레치메 · 코르티나
  };
  // 9/30 알페 항목들은 9/29로, 세체다만 9/30에 남김
  const ALPE = ['zMfRJO0fag8j1vQkB3Dy','bwid3ky8PJUB4whAOn6R','1vxI5rU9PYBAZ72DzuAb',
                '92uWjzqHBuxMeoAK5KUM','mF9b9tJIwzLHED346FGE','t9zXwDC5vh9o3jvGKfRu',
                'hm0dWWJtuBcAGH9362Yb','NJjkMZoUKr1559u30g1K'];

  // ── 9/29 알페 디 시우시 (세체다 빠져서 여유)
  const D29 = {
    zMfRJO0fag8j1vQkB3Dy: { date: '2026-09-29', time: '07:00', end_time: '07:40' },
    bwid3ky8PJUB4whAOn6R: { date: '2026-09-29', time: '07:45', end_time: '09:15' },
    '1vxI5rU9PYBAZ72DzuAb': { date: '2026-09-29', time: '09:30', end_time: '10:00' },
    '92uWjzqHBuxMeoAK5KUM': { date: '2026-09-29', time: '10:00', end_time: '13:00',
      description: '⭐ 유럽 최대 고산 초원(56km²). 사소룽고+실라르를 배경에 두고 완만한 초지가 끝없이 이어져. 세체다를 다음날로 뺐으니 오늘은 Compatsch → Saltria 평지 트레일을 여유롭게 걸어. 시간 남으면 Bullaccia 루프까지.' },
    mF9b9tJIwzLHED346FGE: { date: '2026-09-29', time: '13:00', end_time: '14:10' },
    t9zXwDC5vh9o3jvGKfRu: { date: '2026-09-29', time: '14:30', end_time: '15:00' },
    hm0dWWJtuBcAGH9362Yb: { date: '2026-09-29', time: '15:15', end_time: '16:55',
      description: '오늘은 일찍 복귀. 숙소 정원·테라스에서 쉬거나, 여력 있으면 브루니코(Brunico) 구시가를 한 바퀴 돌아도 좋아 — 몬구엘포에서 20분이야.' },
    NJjkMZoUKr1559u30g1K: { date: '2026-09-29', time: '19:00', end_time: '20:30' }
  };

  // ── 9/30 세체다 · 발 가르데나 (신설)
  const D30 = {
    BXG58jsikQ6IHlTtsmci: { date: '2026-09-30', time: '10:00', end_time: '13:00',
      route_note: '오르티세이 → 푸르네스 → 세체다 케이블카 2단',
      description: '⚠️ 2026년부터 온라인 시간대 사전예약 필수야. 10:00 슬롯을 미리 잡아둬.\n해발 2,500m. 케이블카에서 내리면 그 톱니 능선이 정면으로 열려. 오늘은 하루를 통째로 썼으니 능선 따라 Pieralongia 방향으로 더 걸어들어가도 돼.' }
  };
  // 보류함에서 복귀
  const UNSHELVE = {
    gUeqAkdwvE6nOpByMeSK: { date: '2026-09-30', time: '14:30', end_time: '15:30',
      title: '🏘️ 오르티세이 (Ortisei) 산책',
      description: '발 가르데나 중심 마을. 목공예 공방 거리와 보행자 구역. 세체다 내려와서 바로 이어서 걸으면 딱이야.' },
    mRv98M7ZTehhJF65xchO: { date: '2026-09-30', time: '15:45', end_time: '16:45',
      route_note: '오르티세이 → 셀바 → Passo Gardena 약 25km · 40분',
      description: '2,121m 고갯길. 셀라 그룹 암벽이 바로 위로 솟아. 여기서 코르바라 → 발 바디아 → 브루니코로 내려가면 몬구엘포까지 순환 루프가 완성돼.' }
  };

  // ── 신규 항목 (9/30)
  const NEW30 = [
    { time: '07:30', end_time: '08:10', title: '☕ 조식 (숙소)',
      city: 'Monguelfo, 이탈리아', lat: 46.7519, lng: 12.1050,
      description: 'Lienharterhof 조식. 조식 평가 "완벽함"이야.' },
    { time: '08:15', end_time: '09:35', title: '🚗 몬구엘포 → 오르티세이',
      city: 'Ortisei, 이탈리아', lat: 46.5761, lng: 11.6717,
      route_note: 'SS49 → Bressanone → Val Gardena · 약 75km · 1H20',
      description: '세체다 예약 시각보다 30분 일찍 도착하게 잡았어. 케이블카 하부역 유료주차장에 대.' },
    { time: '13:15', end_time: '14:20', title: '🍽️ 오르티세이 점심',
      city: 'Ortisei, 이탈리아', lat: 46.5761, lng: 11.6717,
      description: '남티롤 요리. 카네데를리, 슈페츨레, 사과 슈트루델.' },
    { time: '17:00', end_time: '18:40', title: '🚗 몬구엘포 복귀',
      city: 'Monguelfo, 이탈리아', lat: 46.7519, lng: 12.1050,
      route_note: 'Passo Gardena → 코르바라 → 발 바디아 → 브루니코 · 약 90km · 1H40',
      description: '올라온 길로 되돌아가지 않고 반대편으로 내려오는 루프야. 저녁 빛 받는 발 바디아 구간이 좋아.' },
    { time: '19:00', end_time: '20:30', title: '🍽️ 몬구엘포 저녁',
      city: 'Monguelfo, 이탈리아', lat: 46.7519, lng: 12.1050,
      description: '숙소 부설 레스토랑 또는 마을. 돌로미티 마지막 밤이야.' }
  ];

  // ── 로마 숙소 확정
  const ROMA = {
    qSHNf2ATo9U0er1TRN5v: {
      date: '2026-09-24', checkout_date: '2026-09-25',
      title: 'B&B Hotel Roma Fiumicino Fiera Aeroporto 2', city: 'Fiumicino, 이탈리아',
      address: 'Parcheggio Stazione Parco Leonardo, Via Domenico Fontana 4, 00054 Fiumicino (RM)',
      phone: '+39-06-87165545', lat: 41.7938, lng: 12.2565,
      booking_ref: '1400828106730435 (PIN 5068)',
      room_type: '수페리어 트윈룸 · 싱글침대 2개 · 14m² · 금연 · 창문 있음',
      checkin: '14:00', checkout: '12:00', breakfast: '불포함', guests: '성인 1명',
      cancel: '가능', cancel_date: '2026-09-24',
      cancel_policy_detail: '2026-09-24 18:00 (호텔 현지시간) 전 무료취소',
      amount: '212791', onsite_amount: '8085', onsite_fee: '€4.90 · 도시세 현장 결제',
      payment_status: '결제 완료', payment_date: '2026-08-06',
      payment_method: '₩212,791 카드 결제 — 객실 271,640 + 부가세 19,345 − 특별할인 49,095 − 다이아몬드 등급 29,099',
      checkin_note: '체크인 14:00~24:00 · 체크아웃 01:00~12:00 (늦은 도착 OK)',
      notes: '🚆 FL1 기차: Fiumicino Aeroporto → Parco Leonardo 1정거장 · 약 5분\n🚗 다음날 아침 FCO로 돌아가 08:30 Europcar 픽업\n🍽️ 식사 불포함 — 파르코 레오나르도 쇼핑몰에 식당 많음'
    },
    kViPGJTGtJQhWv6Dh6s1: { time: '20:15', end_time: '20:45',
      title: '🚆 FL1 기차 → Parco Leonardo', city: 'Fiumicino, 이탈리아',
      route_note: 'Fiumicino Aeroporto → Parco Leonardo 1정거장 · 약 5분 · €1.50',
      description: '오늘은 렌트 안 해. 밤 운전 피하고 내일 아침 공항에서 픽업하는 게 안전해. 역에서 호텔까지 도보 5분.' },
    AcfQluAlmZgIcODmvSEb: { time: '20:45', end_time: '21:15',
      title: '🏨 B&B Hotel Roma Fiumicino 체크인', city: 'Fiumicino, 이탈리아',
      description: '체크인 마감 24:00이라 여유 있어. 13시간 비행 직후니 로마 시내 진입은 접고 여기서 자.' },
    '5VOawBW5q0mSSOjtY247': {
      route_note: 'Parco Leonardo → Fiumicino Aeroporto FL1 1정거장 · 약 5분 (07:50 출발)' },
    dU0qdEpLIZbCgbQfVhjR: {
      notes: '⚠️ 방향 역전: 로마 픽업 → 베네치아 반납. 9/25 08:30 ~ 10/1 11:45 (6일). 기존 VCE→FCO 예약은 변경 또는 재예약 필요.' }
  };

  // ── 숙소 카드 날짜
  const STAY = {
    '2wTJjghF1IZCXt25bzUE': { date: '2026-09-25', checkout_date: '2026-09-26' },
    adA1z7lSlKF2qFfkreZs:   { date: '2026-09-26', checkout_date: '2026-09-27' },
    '0OcjJRe9KcVJQxuatje4': { date: '2026-09-27', checkout_date: '2026-10-01' }
  };

  const CITIES = {
    '7kiyoYtNVrQxk7yBcttT': { start_date: '2026-09-24', end_date: '2026-09-25', nights: 1 },
    fz2LPA58Kq5n5nFgIrvB:   { start_date: '2026-09-25', end_date: '2026-09-26', nights: 1 },
    VbjHRKc6jDkuftV6VAOt:   { start_date: '2026-09-26', end_date: '2026-09-27', nights: 1 },
    eCETG42R7d4jtfz4AnDE:   { start_date: '2026-09-27', end_date: '2026-10-01', nights: 4 },
    RO0Cnjvn9FTILg1Dsk4I:   { start_date: '2026-10-01', end_date: '2026-10-03', nights: 2 },
    zK338Kyy8Xlpq92EQnfg:   { start_date: '2026-10-03', end_date: '2026-10-04', nights: 1 }
  };

  async function all() {
    const s = await db.collection('journey').where('trip_id', '==', TRIP).get();
    const m = {}; s.forEach(d => m[d.id] = d.data()); return m;
  }
  function explicit() {
    return Object.assign({}, D29, D30, UNSHELVE, ROMA, STAY);
  }

  async function preview() {
    const cur = await all(), EX = explicit();
    const miss = Object.keys(EX).filter(id => !cur[id]);
    if (miss.length) { console.error('❌ 없는 문서:', miss); return; }
    const by = {};
    Object.keys(cur).forEach(id => {
      const o = cur[id];
      if (o.auto_sun) return;
      let d = EX[id] && EX[id].date ? EX[id].date : (SHIFT[o.date] || (ALPE.indexOf(id) >= 0 ? '2026-09-29' : o.date));
      if (!d) return;
      const t = (EX[id] && EX[id].time) || o.time || '';
      (by[d] = by[d] || []).push({ t, ti: (EX[id] && EX[id].title) || o.title || o.city || '' });
    });
    NEW30.forEach(n => (by['2026-09-30'] = by['2026-09-30'] || []).push({ t: n.time, ti: n.title + '  (신규)' }));
    console.log('%c[10박 재구성] 9/24 로마 IN → 10/4 프랑크푸르트 OUT', 'font-weight:bold;font-size:14px');
    Object.keys(by).sort().forEach(k => {
      const w = '일월화수목금토'[new Date(k).getDay()];
      console.log(`\n── ${k}(${w})  ${by[k].length}건`);
      by[k].sort((a, b) => String(a.t).localeCompare(String(b.t)))
        .forEach(x => console.log(`   ${String(x.t).padEnd(6)}${String(x.ti).slice(0, 54)}`));
    });
    console.log('\n신규 ' + NEW30.length + '건 · 보류 해제 ' + Object.keys(UNSHELVE).length + '건 (오르티세이·Passo Gardena)');
    console.log('일출·일몰 ' + Object.keys(cur).filter(id => cur[id].auto_sun).length + '건 삭제 → 재생성');
    console.log('%c\n진행하려면 → atelier10.apply()', 'color:#2563eb;font-weight:bold');
  }

  async function apply() {
    const cur = await all(), EX = explicit();
    const miss = Object.keys(EX).filter(id => !cur[id]);
    if (miss.length) { console.error('❌ 없는 문서, 중단:', miss); return; }

    const bk = { j: {}, c: {}, t: null, added: [] };
    Object.keys(cur).forEach(id => {
      const o = cur[id], s = {};
      ['date','time','end_time','title','city','description','route_note','notes','lat','lng',
       'checkout_date','address','amount','onsite_amount','onsite_fee','booking_ref','room_type',
       'checkin','checkout','breakfast','guests','cancel','cancel_date','cancel_policy_detail',
       'checkin_note','payment_status','payment_method','payment_date','phone']
        .forEach(k => { if (o[k] !== undefined) s[k] = o[k]; });
      bk.j[id] = s;
    });
    const cs = await db.collection('trip_cities').where('trip_id', '==', TRIP).get();
    cs.forEach(d => bk.c[d.id] = { start_date: d.data().start_date, end_date: d.data().end_date, nights: d.data().nights });
    const tr = await db.collection('trips').doc(TRIP).get();
    bk.t = { start_date: tr.data().start_date, end_date: tr.data().end_date };

    const ops = [];
    Object.keys(cur).forEach(id => {
      const o = cur[id];
      if (o.auto_sun) { ops.push(['del', 'journey', id]); return; }
      const p = Object.assign({}, EX[id] || {});
      if (!p.date) {
        if (SHIFT[o.date]) p.date = SHIFT[o.date];
        else if (ALPE.indexOf(id) >= 0) p.date = '2026-09-29';
      }
      if (Object.keys(p).length) ops.push(['upd', 'journey', id, p]);
    });
    Object.keys(CITIES).forEach(id => ops.push(['upd', 'trip_cities', id, CITIES[id]]));
    ops.push(['upd', 'trips', TRIP, { start_date: '2026-09-24', end_date: '2026-10-04' }]);

    for (let i = 0; i < ops.length; i += 400) {
      const b = db.batch();
      ops.slice(i, i + 400).forEach(o => {
        const r = db.collection(o[1]).doc(o[2]);
        if (o[0] === 'del') b.delete(r); else b.update(r, o[3]);
      });
      await b.commit();
      console.log(`  커밋 ${Math.min(i + 400, ops.length)}/${ops.length}`);
    }
    const nb = db.batch();
    NEW30.forEach(n => {
      const ref = db.collection('journey').doc();
      bk.added.push(ref.id);
      nb.set(ref, Object.assign({ type: '일정', date: '2026-09-30', trip_id: TRIP }, n));
    });
    await nb.commit();
    console.log(`  신규 ${NEW30.length}건 추가`);

    try { localStorage.setItem(BK, JSON.stringify(bk)); }
    catch (e) { console.warn('백업 저장 실패(용량):', e.message); }

    console.log('%c✅ 완료 — 새로고침해줘 (9/24~10/4 · 10박)', 'color:#16a34a;font-weight:bold;font-size:14px');
    console.log('   돌로미티 4박: 9/28 트레치메 · 9/29 알페 디 시우시 · 9/30 세체다+발 가르데나');
  }

  async function undo() {
    const bk = JSON.parse(localStorage.getItem(BK) || 'null');
    if (!bk) return console.error('백업이 없어.');
    const ops = [];
    Object.keys(bk.j).forEach(id => ops.push(['upd', 'journey', id, bk.j[id]]));
    (bk.added || []).forEach(id => ops.push(['del', 'journey', id]));
    Object.keys(bk.c).forEach(id => ops.push(['upd', 'trip_cities', id, bk.c[id]]));
    ops.push(['upd', 'trips', TRIP, bk.t]);
    for (let i = 0; i < ops.length; i += 400) {
      const b = db.batch();
      ops.slice(i, i + 400).forEach(o => {
        const r = db.collection(o[1]).doc(o[2]);
        if (o[0] === 'del') b.delete(r); else b.update(r, o[3]);
      });
      await b.commit();
    }
    console.log('%c↩️ 되돌림 완료', 'color:#f59e0b;font-weight:bold');
  }

  console.log('%c준비됨 → atelier10.preview()', 'color:#2563eb;font-weight:bold;font-size:14px');
  return { preview, apply, undo };
})();
