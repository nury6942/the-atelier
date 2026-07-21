// ═══════════════════════════════════════════════════════════════
// ATELIER: 2026 독일&이탈리아 — 예약 레코드 리베이스 (2차)
// ───────────────────────────────────────────────────────────────
// 1차 스크립트(rebase_2026_journey_oct.js)가 일정·도시·트립 날짜를
// 10/4~10/12 로 옮겼지만, 숙소/렌트카/이동수단/항공편 레코드는
// 구 날짜(9월) 그대로 남아 있어 화면이 어긋남.
//
// 전제: 호텔 4곳 = 무료취소 / 렌트카 = 미결제 / ICE = 재구매 예정
//       → 실제로 잃을 게 없으므로 새 계획으로 갱신하고
//         전부 '결제 예정' 상태로 표시한다.
//
// 이 스크립트가 하는 일:
//   0) DRY RUN — 현재 비(非)일정 레코드를 전부 출력하고 확인받음
//   1) 숙소 3곳 날짜 갱신 + payment_status='결제 예정'
//   2) 드레스덴 숙소는 ❌삭제하지 않고 '취소 대상' 표시만
//      (예약번호·연락처가 있어야 실제 취소를 할 수 있으므로)
//   3) 렌트카 → FCO 픽업 10/9 / FCO 반납 10/12 (편도 수수료 소멸)
//   4) ICE 이동수단 → Frankfurt→Berlin 10/5
//   5) EasyJet BER→PSA 가안 → BER→FCO 10/9 로 교체
//
// 안전장치:
//   - 매칭 안 된 레코드는 콘솔에 ⚠️ 로 크게 출력 (조용히 넘어가지 않음)
//   - 각 단계마다 무엇을 어떻게 바꿨는지 before/after 로그
//   - 파괴적 삭제 없음
//
// 사용:
//   1. Travel 페이지 "2026 독일&이탈리아" 활성화
//   2. F12 → Console → 붙여넣기 → Enter
//   3. DRY RUN 결과 확인 후 confirm
// ═══════════════════════════════════════════════════════════════

(async function rebase2026BookingsOct() {
  if (typeof fbRead !== 'function' || typeof fbUpdate !== 'function') {
    alert('❌ Travel 페이지에서 실행해주세요'); return;
  }

  // ── 트립 찾기 ──
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
  const recs = all.filter(j => j.trip_id === tripId && j.type !== '일정');

  // ═══ 0) DRY RUN ═══
  console.log('\n' + '═'.repeat(70));
  console.log('🔍 DRY RUN — 현재 예약 레코드 ' + recs.length + '건');
  console.log('═'.repeat(70));
  recs.forEach((r, i) => {
    console.log(
      `[${i}] ${r.type} | ${r.date || '-'}${r.checkout_date ? ' ~ ' + r.checkout_date : ''} | ` +
      `${r.title || '(제목없음)'} | ${r.city || '-'} | ${r.payment_status || r.status || '-'}`
    );
  });
  console.log('═'.repeat(70) + '\n');

  if (!confirm(
    `위 ${recs.length}건을 새 일정(10/4~10/12) 기준으로 갱신합니다.\n\n` +
    `· 숙소 3곳 → 새 날짜 + '결제 예정'\n` +
    `· 드레스덴 숙소 → 삭제하지 않고 '취소 대상' 표시만\n` +
    `· 렌트카 → FCO 픽업 10/9 · FCO 반납 10/12\n` +
    `· ICE → Frankfurt→Berlin 10/5\n` +
    `· EasyJet BER→PSA → BER→FCO 10/9\n\n` +
    `콘솔의 DRY RUN 목록을 먼저 확인하세요. 계속할까요?`
  )) { console.log('취소됨'); return; }

  const touched = new Set();
  let n = 0;
  const hay = r => [r.title, r.city, r.description, r.notes, r.address, r.drop_city, r.pickup_location]
    .filter(Boolean).join(' ');

  async function apply(rec, patch, label) {
    const before = `${rec.date || '-'}${rec.checkout_date ? '~' + rec.checkout_date : ''}`;
    try {
      await fbUpdate('journey', rec._id, patch);
      Object.assign(rec, patch);
      if (typeof journeyData !== 'undefined') {
        const t = journeyData.find(x => x._id === rec._id);
        if (t) Object.assign(t, patch);
      }
      const after = `${patch.date || rec.date || '-'}${(patch.checkout_date || rec.checkout_date) ? '~' + (patch.checkout_date || rec.checkout_date) : ''}`;
      console.log(`✅ ${label}\n     ${before}  →  ${after}`);
      touched.add(rec._id); n++;
    } catch(e) { console.error(`❌ ${label} 실패:`, e); }
  }

  // ═══ 1) 숙소 ═══
  const lodging = recs.filter(r => r.type === '숙소');

  const LODGE_PLAN = [
    { re: /프랑크푸르트|frankfurt|시타딘|citadines/i, label: '숙소 · 프랑크푸르트',
      patch: { date:'2026-10-04', checkout_date:'2026-10-05', payment_status:'결제 예정',
               notes:'⚠️ 재예약 필요 (구 예약 9/25). 1박 유지.' } },
    { re: /베를린|berlin|캠퍼|camper/i, label: '숙소 · 베를린 (2박→4박)',
      patch: { date:'2026-10-05', checkout_date:'2026-10-09', payment_status:'결제 예정',
               notes:'⚠️ 재예약 필요. 구 예약 9/28~10/1 2박 → 10/5~10/9 ★4박★.\n' +
                     '구 일정은 InnoTrans(17만명)+베를린마라톤과 겹쳐 요금이 평시 2배였음. 새 창은 대형 이벤트 없음.\n' +
                     '⚠️ Stadtbahn 폐쇄(6/14~12/12)로 ICE 도착역이 바뀔 수 있으니 도착역 확정 후 위치 결정.' } },
    { re: /bagnaia|바냐이아|아그리투리스모|agriturismo|quirico|pienza|피엔차/i, label: '숙소 · 토스카나 (Bagnaia)',
      patch: { date:'2026-10-09', checkout_date:'2026-10-12', payment_status:'결제 예정',
               notes:'⚠️ 재예약 필요 (구 예약 10/1~10/4 → 10/9~10/12). 3박 동일.\n☎️ 0577-898272. 호스트에게 도착시간 미리 통보.' } },
  ];

  for (const plan of LODGE_PLAN) {
    const hit = lodging.find(r => plan.re.test(hay(r)) && !/dresden|드레스덴|moxy/i.test(hay(r)));
    if (hit) await apply(hit, plan.patch, plan.label);
    else console.warn(`⚠️ 매칭 실패 — ${plan.label} : 해당 숙소 레코드를 못 찾음. 수동 확인 필요`);
  }

  // 드레스덴 — 삭제하지 않고 취소 대상 표시만
  const dd = lodging.find(r => /dresden|드레스덴|moxy/i.test(hay(r)));
  if (dd) {
    const t = dd.title || '드레스덴 숙소';
    await apply(dd, {
      title: /^❌/.test(t) ? t : ('❌ [취소 대상] ' + t),
      payment_status: '결제 예정',
      notes: '❌ 드레스덴 일정이 삭제되어 이 예약은 취소 대상입니다.\n' +
             '무료취소라도 직접 취소 절차를 밟아야 하므로, 예약번호·연락처 보존을 위해 레코드를 남겨둡니다.\n' +
             '★실제 취소 완료 후 이 항목을 직접 삭제하세요.★\n\n' +
             '사유: 드레스덴을 늘렸던 이유가 베를린 숙박비였는데, 날짜 이동으로 그 이유가 사라짐. ' +
             '건축·인테리어·가구 관심사 기준으로 베를린 4박(+데사우 당일치기)이 우선.'
    }, '숙소 · 드레스덴 → 취소 대상 표시');
  } else {
    console.warn('⚠️ 드레스덴 숙소 레코드를 못 찾음 (이미 삭제됐거나 명칭이 다름)');
  }

  // ═══ 2) 렌트카 ═══
  const rental = recs.find(r => r.type === '렌트카');
  if (rental) {
    await apply(rental, {
      date: '2026-10-09', time: '14:45',
      city: 'Roma Fiumicino (FCO)', drop_city: 'Roma Fiumicino (FCO)',
      pickup_location: 'Roma Fiumicino Airport (FCO) — 렌터카 센터',
      drop_location:   'Roma Fiumicino Airport (FCO) — 렌터카 센터',
      checkout_date: '2026-10-12', checkout: '17:10',
      payment_status: '결제 예정',
      notes: '⚠️ 재예약 필요 (구 예약: PSA 픽업 10/1 → FCO 반납 10/4).\n\n' +
             '★변경 핵심: 픽업지가 피사(PSA)→로마(FCO)로 바뀌어 픽업·반납이 같은 곳이 됨 → 편도 수수료 소멸 (통상 €40~60, 최대 €250).★\n\n' +
             '· 주행거리 차이는 전체 34km 수준 — 숙소가 어차피 허브라 왕복 구조\n' +
             '· BER-FCO 하루 2편 vs BER-PSA 하루 1편\n' +
             '· 오르비에토가 A1 로마~발도르차 사이에 있어 어느 방향이든 경유 가능\n\n' +
             '픽업 시: 360도 영상 + 연료게이지 사진. "Full to Full." 국제운전면허증+여권+본인명의 신용카드.\n' +
             '반납 시: 직원 동행 인스펙션 + "Damage-free receipt" 수령.'
    }, '렌트카 · PSA→FCO 왕복으로 변경');
  } else {
    console.warn('⚠️ 렌트카 레코드를 못 찾음');
  }

  // ═══ 3) 이동수단 (ICE) ═══
  const transit = recs.filter(r => r.type === '이동수단');
  const ice = transit.find(r => /ice|기차|train|dresden|드레스덴|dd/i.test(hay(r))) || transit[0];
  if (ice) {
    await apply(ice, {
      date: '2026-10-05', time: '13:30',
      title: 'ICE: Frankfurt Hbf → Berlin Hbf (약 4H)',
      status: '대기 중',
      description: '⚠️ 재예약 필요 (구 예약은 Frankfurt→Dresden 구간). 드레스덴이 일정에서 빠져 베를린 직행으로 변경.\n\n' +
                   '좌석 예약 €4.50 강추. 1등석이면 DB Lounge 무료.\n\n' +
                   '⚠️⚠️ 베를린 Stadtbahn 폐쇄 2026-06-14~12-12 — 지역/장거리 열차가 Charlottenburg~Ostbahnhof 구간 통과 불가. ' +
                   '도착 홈이 Berlin Hbf 지하(tief)로 바뀌거나 Spandau·Gesundbrunnen 종착일 수 있음. ' +
                   '★예매 시 최종 도착역 확인 후 숙소 위치 결정.★ bahn.de 재확인 필수.'
    }, '이동수단 · ICE Frankfurt→Berlin');
  } else {
    console.warn('⚠️ ICE 이동수단 레코드를 못 찾음');
  }

  // ═══ 4) 항공편 ═══
  const flights = recs.filter(r => r.type === '항공편');
  const ezy = flights.find(r => /ezy|easyjet|이지젯|psa|피사/i.test(hay(r)));
  if (ezy) {
    await apply(ezy, {
      date: '2026-10-09', time: '12:00',
      title: 'BER → 로마 FCO (약 2H) — 미예약',
      city: 'Roma Fiumicino (FCO)',
      description: '❗이 여정에서 유일하게 아직 예약이 없는 항공편 (기존 EasyJet BER→PSA는 실제 예약이 아니라 가안이었음).\n\n' +
                   '라이언에어/이지젯 하루 약 2편, 06:00~22:20 분포. ★정오 전후 편을 잡으면 베를린 마지막 날 오전이 살아남.★\n\n' +
                   '※ 왜 피사(PSA)가 아니라 로마(FCO)인가:\n' +
                   '  · 렌트카 픽업·반납이 같은 곳이 되어 편도 수수료 소멸\n' +
                   '  · 하루 2편이라 출발시간 선택 가능 (PSA는 하루 1편)\n' +
                   '  · 주행거리 차이 34km 수준\n\n' +
                   '※ 피렌체(FLR) 직항은 2026-09-23 볼로테아 신규 취항이지만 수·일요일만 운항 → 금요일인 10/9엔 불가. ' +
                   '활주로 1,560m라 A319급만 취항 가능(라이언에어 737 진입 불가).\n\n' +
                   '⚠️ IATA 하계 시즌이 2026-10-24 종료 — 그 전후로 편수가 바뀔 수 있으니 예매 시 재확인.'
    }, '항공편 · EasyJet BER→PSA 가안 → BER→FCO');
  } else {
    console.warn('⚠️ EasyJet(BER→PSA) 가안 레코드를 못 찾음 — 이미 지웠거나 명칭이 다름');
  }

  // TW 장거리 2편 — 1차 스크립트에서 이미 갱신됐지만 방어적으로 재확인
  for (const f of flights) {
    const t = hay(f);
    if (/ICN|인천/.test(t) && /FRA|프랑크푸르트/.test(t) && f.date !== '2026-10-04') {
      await apply(f, { date:'2026-10-04', time:'09:50' }, '항공편 · TW403 ICN→FRA (재확인)');
    } else if (/FCO|로마/.test(t) && /ICN|인천/.test(t) && !/BER/.test(t) && f.date !== '2026-10-12') {
      await apply(f, { date:'2026-10-12', time:'21:15' }, '항공편 · TW403 FCO→ICN (재확인)');
    }
  }

  // ═══ 5) 손대지 않은 레코드 보고 ═══
  const untouched = recs.filter(r => !touched.has(r._id));
  if (untouched.length) {
    console.log('\n' + '─'.repeat(70));
    console.log('ℹ️ 변경하지 않은 레코드 ' + untouched.length + '건 — 확인해보세요:');
    untouched.forEach(r => console.log(`   · ${r.type} | ${r.date || '-'} | ${r.title || '(제목없음)'}`));
    console.log('─'.repeat(70));
  }

  // ═══ 6) UI 갱신 ═══
  ['renderDayView','renderWeekView','renderCityCards','renderJourneyLodging',
   'renderJourneyRental','renderJourneyFlights','renderJourneyTransit']
    .forEach(fn => { if (typeof window[fn] === 'function') { try { window[fn](); } catch(e) {} } });

  console.log(`\n✅ 예약 레코드 갱신 완료: ${n}건 변경\n`);
  alert(
    `✅ 2차 리베이스 완료!\n\n` +
    `· 변경: ${n}건\n` +
    `· 미변경: ${untouched.length}건 (콘솔 확인)\n\n` +
    `⚠️ 드레스덴 숙소는 삭제하지 않고 '❌ [취소 대상]' 표시만 했습니다.\n` +
    `   실제 취소를 끝낸 뒤 직접 삭제하세요.\n\n` +
    `⚠️ 모든 숙소·렌트카가 '결제 예정' 상태입니다.\n` +
    `   재예약 완료 후 금액과 결제상태를 직접 갱신하세요.\n\n` +
    `새로고침해서 확인하세요.`
  );
})();
