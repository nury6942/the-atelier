// ═══════════════════════════════════════════════════════════════
// ATELIER: 2026 독일&이탈리아 — 토스카나 숙소 변경 패치 (4차)
// ───────────────────────────────────────────────────────────────
// 변경: Agriturismo Bagnaia (산 퀴리코) → GARAGE47 (피엔차)
//
// 왜 바꿨나:
//   1) ★기존 일정의 오류 정정★ — 바냐이아는 60㎡ 자취형 아파트로
//      조식·레스토랑·호스트 저녁이 전부 없음. 그런데 일정에는
//      "호스트 가정식 저녁"이 3일치 들어가 있었음 (구 일정에서 승계된 오류)
//   2) GARAGE47 = 옛 자동차 정비공장을 개조한 로프트 B&B.
//      인더스트리얼 건축의 주거 전환 — 건축·인테리어·가구 관심사에 직결
//   3) 피엔차 성벽 바로 밖 → ZTL 무관 + 무료주차 + ★시내 도보 진입★
//      → 저녁을 걸어가서 먹고 걸어서 돌아옴. 밤 운전이 사라짐
//      (이탈리아 음주운전 기준 0.05% + 가로등 없는 시골길 리스크 제거)
//   4) 1층이라 계단 없음 / 포장도로 접근 → 자갈길·렌터카 보험 문제 무관
//
// 거점 이동에 따른 주행거리 변화 (OSRM 실측):
//   · FCO → 거점        227.5km → 224.4km  (거의 동일)
//   · 피엔차 시내 관광   차량 10.5km → ★도보 0km★
//   · 몬테풀차노 왕복    46.2km → 28.7km   (17.5km 단축)
//   · 시에나 편도        47.6km → 73.1km   (25.5km 증가) ← 유일한 손해
//   · 바뇨비뇨니 → 거점  5.7km → 15.3km    (9.6km 증가)
//   · 거점 → 오르비에토  84.1km → 79.5km   (4.6km 단축)
//   총합 약 +27km. 대부분 시에나 당일치기에서 발생.
//   대신 피엔차 관광이 도보가 되고 매일 밤 운전이 사라짐 → 순이득
//
// 사용: Travel 페이지 → F12 → Console → 붙여넣기 → Enter
// ═══════════════════════════════════════════════════════════════

(async function patchTuscanyGarage47() {
  if (typeof fbRead !== 'function' || typeof fbUpdate !== 'function') {
    alert('❌ Travel 페이지에서 실행해주세요'); return;
  }

  let tripId = (typeof currentTripId !== 'undefined' && currentTripId) ? currentTripId : null;
  if (!tripId) {
    try {
      const all = await fbRead('trips');
      const t = all.find(x => (x.name||'').includes('독일') && (x.name||'').includes('이탈리아'));
      if (t) tripId = t._id;
    } catch(e) {}
  }
  if (!tripId) { alert('❌ 트립을 찾을 수 없습니다'); return; }

  const all = await fbRead('journey');
  const mine = all.filter(j => j.trip_id === tripId);
  const sched = mine.filter(j => j.type === '일정');

  if (!confirm(
    '토스카나 숙소 변경: 바냐이아 → GARAGE47 (피엔차)\n\n' +
    '· 숙소 레코드 교체\n' +
    '· ★"호스트 가정식 저녁" 3건 → 피엔차 시내 도보 저녁★\n' +
    '  (바냐이아는 저녁을 제공하지 않음 — 기존 일정의 오류)\n' +
    '· 거점 이동에 따른 주행거리·소요시간 전면 갱신\n' +
    '· 피엔차 시내 관광을 도보로 변경\n\n' +
    '계속할까요?'
  )) { console.log('취소됨'); return; }

  let n = 0;
  async function patch(rec, obj, label) {
    if (!rec) { console.warn('⚠️ 대상 없음 —', label); return; }
    try {
      await fbUpdate('journey', rec._id, obj);
      Object.assign(rec, obj);
      if (typeof journeyData !== 'undefined') {
        const t = journeyData.find(x => x._id === rec._id);
        if (t) Object.assign(t, obj);
      }
      console.log('✅', label); n++;
    } catch(e) { console.error('❌', label, e); }
  }
  const find = (date, re) => sched.find(j => j.date === date && re.test(j.title || ''));

  const PZ = 'Pienza, 시에나 이탈리아';

  // ═══ 10/9 (금) 도착일 ═══
  await patch(find('2026-10-09', /드라이브.*발도르차|FCO.*발도르차/), {
    title: '🛣️ 드라이브: FCO → 피엔차 (A1, 약 2H 30M / 224km)',
    description:
      'A1 Autostrada del Sole 북상 → ★Chiusi-Chianciano 나들목★ → SP146.\n' +
      '중간 Autogrill 휴게소 한 번. 통행료 편도 €15~20 별도.\n\n' +
      '⚠️ 내비: 구글맵은 "비포장도로 회피" 설정이 없음. Waze엔 있음 (설정 → 비포장도로 → 허용 안 함).\n' +
      '이 지역은 구글맵이 관광객을 좁은 시골길로 몰아넣는 사례가 이탈리아 언론에 보도될 정도라, ' +
      '숙소가 보내준 문자 길안내를 미리 받아둘 것.\n\n' +
      '💡 GARAGE47은 포장도로 접근 + 피엔차 성벽 바로 밖이라 ZTL 진입 불필요.'
  }, '10/9 FCO → 피엔차 드라이브');

  await patch(find('2026-10-09', /Cypress|사이프러스/), {
    title: '🌅 사이프러스 길 + 비탈레타 일몰 드라이브 — 일몰 18:40',
    description:
      '★토스카나 엽서의 그 사이프러스 길★ SP146, 산 퀴리코 북쪽. 피엔차에서 서쪽으로 약 10km.\n' +
      '황금빛 지그재그. 차 세우고 사진. 도착 첫날의 하이라이트라 시간 꼭 확보.\n\n' +
      '⚠️ 일몰 18:40, 완전히 어두워지는 건 19:10. 그 전에 숙소 복귀할 것.'
  }, '10/9 사이프러스 길 일몰');

  await patch(find('2026-10-09', /체크인|Bagnaia|아그리투리스모/), {
    title: '🏛️ GARAGE47 체크인 (피엔차, 3박)',
    city: PZ,
    description:
      '📍 Via Mario Mencatelli 14, Pienza · 부킹닷컴 평점 ★9.8 (481후기), 위치 9.9★\n\n' +
      '🎯 ★옛 자동차 정비공장(Storica Officina Meccanica)을 로프트 B&B로 개조★\n' +
      '이번 여행에서 어댑티브 리유즈(적응적 재사용)가 가장 노골적인 물건. 산업 건축 → 주거 전환.\n\n' +
      '· 피엔차 성벽 바로 밖 → ★ZTL 진입 불필요 + 무료 주차★\n' +
      '· 시내는 걸어서 진입 → 저녁을 도보로 해결, 밤 운전 없음\n' +
      '· 1층, 계단 없음 (캐리어 편함) · 방음 처리 · 17㎡\n' +
      '· ★조식 포함★\n\n' +
      '⚠️ 재예약 필요 (구 예약: 바냐이아 10/1~10/4). 3박 €440.\n' +
      '⚠️ 예약 시 확인: 10월 난방 가동 여부 (일부 농가는 11/1부터 가동, 10월 밤 최저 11°C).'
  }, '10/9 GARAGE47 체크인');

  await patch(find('2026-10-09', /호스트.*저녁|가정식/), {
    title: '🍝 피엔차 시내 첫 저녁 (도보)',
    city: PZ,
    description:
      '⚠️ 기존 일정의 "호스트 가정식 저녁"은 성립하지 않는 항목이었음 — ' +
      '바냐이아는 조식·레스토랑·저녁이 모두 없는 자취형 아파트였음.\n\n' +
      '★GARAGE47은 성벽 바로 밖이라 시내까지 도보★ — 차 두고 걸어가서 와인 곁들여도 됨.\n' +
      '(이탈리아 음주운전 기준 0.05%, 시골길은 가로등 없음 → 도보 접근의 가치가 큼)\n\n' +
      '이동일이라 가볍게. Corso Rossellino 일대 트라토리아.'
  }, '10/9 저녁 → 피엔차 도보');

  // ═══ 10/10 (토) 피엔차 + 몬테풀차노 ═══
  await patch(find('2026-10-10', /조식|농가 조식/), {
    title: '☕ GARAGE47 조식',
    city: PZ,
    description: '숙박비에 포함. 오늘은 피엔차가 도보권이라 오전이 여유로움.'
  }, '10/10 조식');

  await patch(find('2026-10-10', /Vitaleta|비탈레타/), {
    title: '⛪ Cappella di Vitaleta (차량 9.4km / 18분)',
    description:
      '★토스카나 엽서 명소★ 피엔차에서 서쪽 9.4km. 비포장길 입구에 주차 후 도보 15분.\n' +
      '아침 빛이 최고. 사이프러스에 둘러싸인 예배당.\n\n' +
      '⚠️ 진입로가 흙길 — 비 온 다음날이면 점토질이라 24~48시간 미끄러움. 무리하지 말 것.'
  }, '10/10 비탈레타 (거리 갱신)');

  await patch(find('2026-10-10', /Pienza 골목|Piazza Pio/), {
    title: '🏛️ 피엔차 골목 + Piazza Pio II (★숙소에서 도보★)',
    description:
      '★건축 관심사 직결★ 교황 비오 2세가 1459년 로셀리노에게 시켜 만든 "완벽한 도시"(유네스코).\n' +
      '르네상스 이상도시 이론을 실제 축척으로 지은 유일한 사례 — 광장 비례·시선축을 직접 걸으며 체감.\n' +
      'Via dell\'Amore.\n\n' +
      '💡 숙소가 성벽 바로 밖이라 ★차 없이 걸어서★ — ZTL 걱정도, 주차 걱정도 없음.'
  }, '10/10 피엔차 시내 → 도보');

  await patch(find('2026-10-10', /Montepulciano 드라이브|몬테풀차노 드라이브/), {
    title: '🚗 몬테풀차노 드라이브 (14.3km / 19분)',
    description:
      '피엔차 거점이라 기존 대비 편도 8km 단축됨.\n\n' +
      '⚠️⚠️ ZTL — 10월은 ★08:00~20:00★ 작동 (5~9월만 24시간). 지금 시간대는 정통으로 걸림.\n' +
      '★P1 포르타 알 프라토 주차장★에 대고 걸어 올라갈 것. Corso 거리는 Piazza Grande까지 계속 오르막.\n\n' +
      '벌금 €83~332 + ★렌터카사가 운전자 정보 넘기는 값으로만 €30~50 별도 청구★. ' +
      '벌금은 몇 달 뒤 우편으로 도착.\n' +
      '(참고: 2025년 말 법 개정으로 카메라 적발은 하루 1건으로 합산 — 예전의 "게이트마다 1건" 아님)'
  }, '10/10 몬테풀차노 이동 (거리·ZTL)');

  await patch(find('2026-10-10', /Bagnaia 복귀|복귀/), {
    title: '🚗 피엔차 복귀 (14.4km / 19분)',
    description: '몬테풀차노 → 피엔차. 일몰 후 어두운 구간이 있으니 서두르지 말 것.'
  }, '10/10 복귀 (거리 갱신)');

  await patch(find('2026-10-10', /농가 저녁|저녁$/), {
    title: '🍽️ 피엔차 시내 저녁 (도보)',
    city: PZ,
    description:
      'Trattoria Latte di Luna 등 Corso Rossellino 일대. Pici al Ragù, 양고기. 예약 권장.\n' +
      '★차 두고 걸어감★ — 비노 노빌레 곁들여도 문제없음.'
  }, '10/10 저녁 → 피엔차 도보');

  // ═══ 10/11 (일) 시에나 + 바뇨 비뇨니 ═══
  await patch(find('2026-10-11', /Siena 드라이브|시에나 드라이브/), {
    title: '🚗 시에나 드라이브 (73.1km / 약 1H 15M)',
    description:
      '⚠️ 거점이 피엔차로 옮겨져 기존(47.6km)보다 25km 늘어남. 오늘이 이번 여행 최장 당일치기.\n' +
      '일찍 출발할 것.\n\n' +
      '⚠️ ★Santa Caterina 주차장에 주차★ — 시내 ZTL 절대 진입 금지. 에스컬레이터로 구시가 진입.'
  }, '10/11 시에나 드라이브 (거리 갱신)');

  await patch(find('2026-10-11', /Bagno Vignoni 이동|바뇨/), {
    title: '🚗 바뇨 비뇨니 이동 (51.4km / 약 1H 10M)',
    description: '시에나에서 남하. 도착 후 온천 광장까지 도보.'
  }, '10/11 바뇨 비뇨니 이동');

  await patch(find('2026-10-11', /Bagnaia 복귀|복귀/), {
    title: '🚗 피엔차 복귀 (15.3km / 20분)',
    description: '바뇨 비뇨니 → 피엔차. 일몰 18:37 직후라 어두움. 천천히.'
  }, '10/11 복귀 (거리 갱신)');

  await patch(find('2026-10-11', /마지막 농가 저녁|호스트 작별|마지막.*저녁/), {
    title: '🍷 피엔차 마지막 저녁 (도보) + 짐 정리',
    city: PZ,
    description:
      '토스카나 마지막 밤. 걸어서 시내로.\n\n' +
      '내일 출국 — 짐 정리. 페코리노 진공포장·와인 뽁뽁이 포장 확인.\n' +
      '⚠️ 액체·와인은 반드시 위탁수하물.'
  }, '10/11 마지막 저녁 → 피엔차 도보');

  // ═══ 10/12 (월) 출국일 ═══
  await patch(find('2026-10-12', /조식/), {
    title: '🥐 GARAGE47 마지막 조식',
    city: PZ
  }, '10/12 조식');

  await patch(find('2026-10-12', /체크아웃/), {
    title: '🏛️ GARAGE47 체크아웃',
    city: PZ,
    description: '체크아웃 후 차에 짐 싣기. 무료 주차장에서 바로 출발.'
  }, '10/12 체크아웃');

  await patch(find('2026-10-12', /Orvieto 드라이브|오르비에토 드라이브/), {
    title: '🚗 피엔차 → 오르비에토 (79.5km / 약 1H 20M)',
    description:
      '응회암 절벽 위에 얹힌 도시. Campo della Fiera 주차장 → 푸니쿨라로 올라감.\n' +
      'A1 방향이라 어차피 가는 길목 — 직행 대비 13km만 늘어남.'
  }, '10/12 오르비에토 드라이브 (거리 갱신)');

  // ═══ 숙소 레코드 ═══
  const lodge = mine.find(j => j.type === '숙소' &&
    /bagnaia|바냐이아|바그나이아|아그리투리스모|pienza|피엔차|quirico/i.test(
      [j.title, j.city, j.address].filter(Boolean).join(' ')));
  await patch(lodge, {
    title: 'GARAGE47 Storica Officina Meccanica LOFT B&B',
    address: 'Via Mario Mencatelli 14, 53026 Pienza SI, Italia',
    city: PZ,
    date: '2026-10-09', checkout_date: '2026-10-12',
    payment_status: '결제 예정',
    notes:
      '⚠️ 재예약 필요 — 구 예약은 Agriturismo Bagnaia (산 퀴리코) 10/1~10/4.\n' +
      '부킹닷컴 3박 €440, 평점 9.8 (481후기), 위치 9.9, 조식 포함, 무료 주차. 남은 방 1개.\n\n' +
      '옛 자동차 정비공장 개조 로프트. 피엔차 성벽 밖 → ZTL 무관, 시내 도보 진입.\n' +
      '1층(계단 없음), 방음, 17㎡, 포장도로 접근.\n\n' +
      '❗바냐이아를 뺀 이유: 조식·레스토랑·호스트 저녁이 전부 없는 자취형 아파트였는데 ' +
      '기존 일정엔 "호스트 가정식 저녁"이 3일치 들어가 있었음(구 일정 승계 오류). ' +
      '또한 매일 밤 식사하러 차로 나갔다 와야 하는 구조였음.\n\n' +
      '⚠️ 예약 시 확인: 10월 난방 가동 여부.'
  }, '숙소 레코드 → GARAGE47');

  ['renderDayView','renderWeekView','renderCityCards','renderJourneyLodging']
    .forEach(fn => { if (typeof window[fn] === 'function') { try { window[fn](); } catch(e) {} } });

  console.log(`\n✅ 패치 완료: ${n}건\n`);
  console.log('📋 남은 예약: ① GARAGE47 (부킹닷컴) ② 이지젯 BER→FCO 10/9 12:25 + 위탁수하물 ③ 렌트카 FCO');
  alert(
    `✅ 토스카나 숙소 변경 완료 — ${n}건\n\n` +
    `· 거점: 산 퀴리코 → 피엔차 (GARAGE47)\n` +
    `· 저녁 3건: 호스트 가정식 → 시내 도보\n` +
    `· 주행거리 전면 갱신 (총 +27km, 피엔차 관광은 도보화)\n\n` +
    `새로고침해서 확인하세요.`
  );
})();
