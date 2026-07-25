// ═══════════════════════════════════════════════════════════════
// ATELIER: 2027 ICN ↔ DUB (터키항공) 가격 기록 추가
// ───────────────────────────────────────────────────────────────
// 터키항공 공식 사이트에서 조회한 2027-04-30 출발 / 05-08 귀국 왕복.
// 총액 KRW 1,939,100 (성인 1명). 구간별 편명·기종·터미널·경유시간 전부 보관.
//
//   가는 편  ICN → DUB  (IST 경유 · 총 18시간 15분)
//     TK91    ICN T1 04-30 23:20 → IST 05-01 05:00   11h 40m  B777-300ER
//     [경유 2h]
//     TK1975  IST 05-01 07:00 → DUB T1 05-01 09:35    4h 35m  A321-200neo
//
//   오는 편  DUB → ICN  (IST 경유 · 총 16시간 30분)
//     TK1978  DUB T1 05-08 17:10 → IST 05-08 23:35    4h 25m  A330-203
//     [경유 2h 15m]
//     TK90    IST 05-09 01:50 → ICN T1 05-09 17:40    9h 50m  B777-300ER
//
// 하는 일:
//   1) ICN→DUB 관심 노선이 없으면 새로 만든다 (있으면 재사용)
//   2) 위 왕복 항공권을 가격 기록 1건으로 추가 (segments 포함)
//
// 사용: Travel → Flight 페이지 → F12 → Console → 붙여넣기 → Enter
// ═══════════════════════════════════════════════════════════════

(async function add2027IcnDubTurkish() {
  if (typeof fbRead !== 'function' || typeof fbAdd !== 'function') {
    alert('❌ Travel 페이지에서 실행해주세요'); return;
  }

  const PRICE = 1939100;
  const DEP = '2027-04-30';
  const RET = '2027-05-08';

  // ── 1) 관심 노선 확보 (ICN → DUB) ──
  const all = await fbRead('flight_watch');
  let watch = all.find(d => d && d.type === 'watch' && d.route_from === 'ICN' && d.route_to === 'DUB');

  if (!watch) {
    if (!confirm('ICN → DUB 관심 노선이 없어요.\n새로 만들고 기록을 추가할까요?')) {
      console.log('취소됨'); return;
    }
    const wDoc = {
      type: 'watch', route_from: 'ICN', route_to: 'DUB',
      depart_date: DEP, return_date: RET,
      target_months: ['2027-04'],          // 자동 수집 대상 달
      memo: '2027 아일랜드 — 터키항공 IST 경유',
      created_at: new Date().toISOString()
    };
    const nw = await fbAdd('flight_watch', wDoc);
    watch = Object.assign({ _id: (nw && nw.id) ? nw.id : nw }, wDoc);
    console.log('✅ 관심 노선 생성:', watch._id);
  } else {
    console.log('ℹ️ 기존 관심 노선 사용:', watch._id);
  }

  // ── 2) 중복 확인 ──
  const dup = all.find(d => d && d.type === 'flight_price' && d.watch_id === watch._id &&
    d.price_krw === PRICE && d.depart_on === DEP);
  if (dup) {
    alert('이미 같은 기록이 있어요 (₩' + PRICE.toLocaleString('ko-KR') + ' · ' + DEP + ')');
    console.log('중복 —', dup); return;
  }

  // ── 3) 가격 기록 추가 ──
  const doc = {
    type: 'flight_price',
    watch_id: watch._id,
    price_krw: PRICE,
    source: '항공사 직접',           // 터키항공 공식 사이트 화면
    airline: 'TK',
    airline_name: '터키항공',
    flight_no: 'TK91',
    transfers: 1,                    // IST 1회 경유
    depart_on: DEP,
    return_on: RET,
    query_month: '2027-04',
    cabin: 'ECONOMY',
    fare_brand: 'ECONOMY EcoFly (가는편 O-O / 오는편 P-P)',
    pax: 1,
    duration_out: '18시간 15분',
    duration_ret: '16시간 30분',
    note: '성인 1명 총액 · 터키항공 공식 사이트 조회',
    segments: [
      { dir: 'out', flight: 'TK91', airline: '터키항공',
        from: 'ICN', from_name: '인천 국제공항', from_term: 'T1', dep: '04-30 23:20',
        to: 'IST', to_name: '이스탄불 공항', to_term: '', arr: '05-01 05:00',
        aircraft: 'Boeing 777-300ER · 광동체', duration: '11h 40m' },
      { dir: 'out', flight: 'TK1975', airline: '터키항공', layover_before: '2h 00m',
        from: 'IST', from_name: '이스탄불 공항', from_term: '', dep: '05-01 07:00',
        to: 'DUB', to_name: '더블린 공항', to_term: 'T1', arr: '05-01 09:35',
        aircraft: 'Airbus A321-200neo · 협동체', duration: '4h 35m' },
      { dir: 'ret', flight: 'TK1978', airline: '터키항공',
        from: 'DUB', from_name: '더블린 공항', from_term: 'T1', dep: '05-08 17:10',
        to: 'IST', to_name: '이스탄불 공항', to_term: '', arr: '05-08 23:35',
        aircraft: 'Airbus A330-203 · 광동체', duration: '4h 25m' },
      { dir: 'ret', flight: 'TK90', airline: '터키항공', layover_before: '2h 15m',
        from: 'IST', from_name: '이스탄불 공항', from_term: '', dep: '05-09 01:50',
        to: 'ICN', to_name: '인천 국제공항', to_term: 'T1', arr: '05-09 17:40',
        aircraft: 'Boeing 777-300ER · 광동체', duration: '9h 50m' }
    ],
    ts: new Date().toISOString()
  };

  // 유류할증료(앱 기준표)가 있으면 왕복분 합산 — '실제 낼 돈' 계산에 쓰인다
  try {
    if (typeof _fuelForRoute === 'function') {
      const f = _fuelForRoute('ICN', 'DUB');
      if (f) doc.fuel_krw = f.krw * 2;
    }
  } catch (e) {}

  const saved = await fbAdd('flight_watch', doc);
  doc._id = (saved && saved.id) ? saved.id : saved;
  if (typeof _fltWatch !== 'undefined' && Array.isArray(_fltWatch)) _fltWatch.push(doc);

  try { if (typeof _fltRenderWatch === 'function') _fltRenderWatch(); } catch (e) {}
  try { if (typeof pwRenderQuick === 'function') pwRenderQuick(); } catch (e) {}

  console.log('✅ 기록 추가 완료 —', doc._id);
  console.log('   ₩' + PRICE.toLocaleString('ko-KR') + ' · ' + DEP + ' ~ ' + RET + ' · 구간 ' + doc.segments.length + '개');
  alert('✅ ICN ↔ DUB 터키항공 ₩' + PRICE.toLocaleString('ko-KR') + ' 기록 완료!\n\n기록 표에서 ⌄ 버튼을 누르면 구간 상세가 보여요.');
})();
