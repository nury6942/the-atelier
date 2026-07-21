// ═══════════════════════════════════════════════════════════════
// ATELIER: 2026 독일&이탈리아 — 베를린 숙소 확정 반영 패치 (3차)
// ───────────────────────────────────────────────────────────────
// 베를린 숙소가 Casa Camper Berlin (Weinmeisterstraße 1, 10178 Mitte)로 확정.
// U8 Weinmeisterstraße 역 바로 위.
//
// 이 패치가 반영하는 것:
//   1) 10/5 ICE 도착 후 이동 — Stadtbahn 폐쇄로 도착역이 3가지 가능
//      · 중앙역 지하(tief) / 샤를로텐부르크 / 게준트브루넨
//      → 각 경우별 카사 캠퍼까지의 경로를 미리 적어둠 (최악 30분)
//   2) 10/5 체크인 — 카사 캠퍼 주소·전화 명시
//   3) 10/8 데사우 출발 — 게준트브루넨 승차 가능성 체크 안내
//      (U8 직통 4정거장이라 중앙역보다 유리할 수 있음)
//
// 공식 근거 (Stadtbahn 폐쇄 2026-06-14 ~ 12-12):
//   · 대부분 장거리 열차는 베를린 중앙역 '지하층' 정차
//   · 프랑크푸르트/NRW 방면 ICE는 일부가 샤를로텐부르크 시종착
//   · 동역·초역 대체정차: 쥐트크로이츠·게준트브루넨·오스트크로이츠·
//     샤를로텐부르크·리히텐베르크
//   출처: vbb.de/stadtbahnsperrung-2026, deutschebahn.com 보도자료
//
// 사용: Travel 페이지 → F12 → Console → 붙여넣기 → Enter
// ═══════════════════════════════════════════════════════════════

(async function patchBerlinCasaCamper() {
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

  if (!confirm(
    '베를린 숙소 = Casa Camper Berlin 확정 반영\n\n' +
    '· 10/5 ICE 도착 후 이동 경로 (도착역 3가지 경우별)\n' +
    '· 10/5 체크인 항목에 주소·전화 추가\n' +
    '· 10/8 데사우 출발 — 게준트브루넨 승차 안내\n' +
    '· 숙소 레코드 주소/전화 갱신\n\n' +
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

  const sched = mine.filter(j => j.type === '일정');
  const find = (date, re) => sched.find(j => j.date === date && re.test(j.title || ''));

  // ── 1) 10/5 도착 후 숙소 이동 ──
  await patch(find('2026-10-05', /Berlin Hbf.*숙소|숙소 이동/), {
    title: '🚆 도착역 → 카사 캠퍼 (도착역에 따라 8~30분)',
    description:
      '⚠️ Stadtbahn 폐쇄(2026-06-14~12-12)로 ICE 도착역이 확정되지 않음. 예매 시 확인하고 아래 중 해당 경로 사용.\n\n' +
      '★카사 캠퍼는 U8 Weinmeisterstraße 역 바로 위★ — 어느 경우든 최악 30분.\n\n' +
      '① 게준트브루넨 도착 → ★U8 직통 4정거장★ (Voltastr → Bernauer Str → Rosenthaler Pl → Weinmeisterstr). 약 8분. 최상.\n' +
      '② 베를린 중앙역 지하(tief) 도착 → S반(S5/S7/S9)으로 Alexanderplatz → U8 한 정거장 되돌아옴. 약 15분.\n' +
      '③ 샤를로텐부르크 시종착 → S반(S5/S7)으로 Alexanderplatz → U8 한 정거장. 약 30분.\n\n' +
      '※ 공식 안내상 대부분의 장거리 열차는 중앙역 지하층 정차이나, ' +
      '★프랑크푸르트/NRW 방면 ICE는 일부가 샤를로텐부르크에서 시종착★이라 ②③ 둘 다 가능.'
  }, '10/5 도착역 → 카사 캠퍼 이동 경로 (3가지 경우)');

  // ── 2) 10/5 체크인 ──
  await patch(find('2026-10-05', /베를린 호텔 체크인|호텔 체크인/), {
    title: '🏨 카사 캠퍼 베를린 체크인 (4박)',
    description:
      '📍 Weinmeisterstraße 1, 10178 Berlin (미테) · ☎️ 030-20003410\n' +
      'U8 Weinmeisterstraße 역 바로 위. 하케셔 마르크트·로젠탈러 플라츠 도보권.\n\n' +
      '⚠️ 재예약 필요 — 구 예약 9/28~10/1 2박 → ★10/5~10/9 4박★.\n\n' +
      '💡 참고: 구 일정(9월 말)은 InnoTrans(방문객 약 17만명) + 베를린 마라톤이 겹친 구간이라 ' +
      '숙박비가 평시 대비 +63~111%까지 올라가고 최대 64%가 매진되던 시기. ' +
      '10/4~10/9는 대형 수요 이벤트가 없어 조건이 훨씬 나음.\n\n' +
      '🎯 위치 이점: U8은 게준트브루넨까지 직통이라, Stadtbahn 폐쇄로 열차가 어느 역에 서든 접근성이 확보됨.'
  }, '10/5 카사 캠퍼 체크인 (주소·전화)');

  // ── 3) 10/8 데사우 출발 ──
  const dessauGo = find('2026-10-08', /데사우/) || sched.find(j => j.date==='2026-10-08' && /🚂/.test(j.title||''));
  if (dessauGo) {
    await patch(dessauGo, {
      description: (dessauGo.description || '') +
        '\n\n💡 카사 캠퍼 기준 승차역 팁: 비텐베르크행은 남북터널 노선이라 ' +
        '★게준트브루넨에서도 탈 수 있는 편이 있을 수 있음★. ' +
        '호텔에서 U8 직통 4정거장이라 중앙역까지 돌아가는 것보다 유리. ' +
        '⚠️ 모든 편이 게준트브루넨에 서는 건 아니므로 DB Navigator에서 ' +
        '출발역을 "Berlin Gesundbrunnen"으로도 한 번 검색해 비교할 것.'
    }, '10/8 데사우 출발 — 게준트브루넨 승차 안내 추가');
  } else {
    console.warn('⚠️ 10/8 데사우 출발 항목을 못 찾음');
  }

  // ── 4) 숙소 레코드 ──
  const lodge = mine.find(j => j.type === '숙소' &&
    /베를린|berlin|캠퍼|camper/i.test([j.title, j.city, j.address].filter(Boolean).join(' ')) &&
    !/dresden|드레스덴|moxy/i.test([j.title, j.city].filter(Boolean).join(' ')));
  await patch(lodge, {
    title: 'Casa Camper Berlin',
    address: 'Weinmeisterstraße 1, 10178 Berlin',
    phone: '030-20003410',
    city: 'Berlin, 독일',
    date: '2026-10-05', checkout_date: '2026-10-09',
    payment_status: '결제 예정',
    notes: '⚠️ 재예약 필요 — 구 예약 9/28~10/1 2박 → 10/5~10/9 ★4박★ (박수 증가).\n' +
           'U8 Weinmeisterstraße 역 바로 위. Stadtbahn 폐쇄 상황에서도 접근성 양호 (최악 30분).'
  }, '숙소 레코드 · Casa Camper 정보 갱신');

  ['renderDayView','renderWeekView','renderCityCards','renderJourneyLodging']
    .forEach(fn => { if (typeof window[fn] === 'function') { try { window[fn](); } catch(e) {} } });

  console.log(`\n✅ 패치 완료: ${n}건\n`);
  alert(`✅ 카사 캠퍼 반영 완료 — ${n}건 변경\n\n새로고침해서 확인하세요.`);
})();
