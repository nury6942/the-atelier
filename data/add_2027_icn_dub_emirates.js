// ═══════════════════════════════════════════════════════════════
// ATELIER: 2027 ICN ↔ DUB (에미레이트) 가격 기록 추가
// ───────────────────────────────────────────────────────────────
// 총액 KRW 1,775,200 (성인 1명) · DXB 경유 왕복.
//
//   가는 편  2027-04-30(금) → 05-01(토) 도착 · 총 20시간 25분
//     EK323  ICN 23:55 → DXB 04:25(+1)   9h 30m
//     [DXB 경유 3h 00m — 긴 대기시간]
//     EK161  DXB 07:25 → DUB 12:20       7h 55m
//
//   오는 편  2027-05-08(토) → 05-09(일) 도착 · 총 18시간 40분
//     EK162  DUB 14:20 → DXB 00:50(+1)   7h 30m
//     [DXB 경유 2h 50m]
//     EK322  DXB 03:40 → ICN 17:00       8h 20m
//
// 검증: 4개 구간 모두 출발시각+소요시간이 시차 계산과 일치 (현지시간 표기)
//
// 사용: Travel → Flight 페이지 → F12 → Console → 붙여넣기 → Enter
// ═══════════════════════════════════════════════════════════════

(async function add2027IcnDubEmirates() {
  if (typeof fbRead !== 'function' || typeof fbAdd !== 'function') {
    alert('❌ Travel 페이지에서 실행해주세요'); return;
  }

  const PRICE = 1775200;
  const DEP = '2027-04-30';
  const RET = '2027-05-08';

  const all = await fbRead('flight_watch');
  let watch = all.find(d => d && d.type === 'watch' && d.route_from === 'ICN' && d.route_to === 'DUB');

  if (!watch) {
    if (!confirm('ICN → DUB 관심 노선이 없어요.\n새로 만들고 기록을 추가할까요?')) {
      console.log('취소됨'); return;
    }
    const wDoc = {
      type: 'watch', route_from: 'ICN', route_to: 'DUB',
      depart_date: DEP, return_date: RET,
      target_months: ['2027-04'],
      memo: '2027 아일랜드',
      created_at: new Date().toISOString()
    };
    const nw = await fbAdd('flight_watch', wDoc);
    watch = Object.assign({ _id: (nw && nw.id) ? nw.id : nw }, wDoc);
    console.log('✅ 관심 노선 생성:', watch._id);
  } else {
    console.log('ℹ️ 기존 관심 노선 사용:', watch._id);
  }

  const dup = all.find(d => d && d.type === 'flight_price' && d.watch_id === watch._id &&
    d.price_krw === PRICE && d.depart_on === DEP);
  if (dup) { alert('이미 같은 기록이 있어요 (₩' + PRICE.toLocaleString('ko-KR') + ')'); return; }

  const doc = {
    type: 'flight_price',
    watch_id: watch._id,
    price_krw: PRICE,
    source: '스카이스캐너',
    airline: 'EK',
    airline_name: '에미레이트 항공',
    flight_no: 'EK323',
    transfers: 1,
    depart_on: DEP,
    return_on: RET,
    query_month: '2027-04',
    cabin: 'ECONOMY',
    pax: 1,
    duration_out: '20시간 25분',
    duration_ret: '18시간 40분',
    note: '성인 1명 총액 · 항공사 직접 판매가 · 평점 4.9/5 (103)',
    segments: [
      { dir: 'out', flight: 'EK323', airline: '에미레이트 항공',
        from: 'ICN', from_name: '인천 국제공항', dep: '04-30 23:55',
        to: 'DXB', to_name: '두바이', arr: '05-01 04:25',
        duration: '9h 30m' },
      { dir: 'out', flight: 'EK161', airline: '에미레이트 항공', layover_before: '3h 00m (긴 대기)',
        from: 'DXB', from_name: '두바이', dep: '05-01 07:25',
        to: 'DUB', to_name: '더블린', arr: '05-01 12:20',
        duration: '7h 55m' },
      { dir: 'ret', flight: 'EK162', airline: '에미레이트 항공',
        from: 'DUB', from_name: '더블린', dep: '05-08 14:20',
        to: 'DXB', to_name: '두바이', arr: '05-09 00:50',
        duration: '7h 30m' },
      { dir: 'ret', flight: 'EK322', airline: '에미레이트 항공', layover_before: '2h 50m',
        from: 'DXB', from_name: '두바이', dep: '05-09 03:40',
        to: 'ICN', to_name: '인천 국제공항', arr: '05-09 17:00',
        duration: '8h 20m' }
    ],
    ts: new Date().toISOString()
  };

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
  alert('✅ 에미레이트 ₩' + PRICE.toLocaleString('ko-KR') + ' 기록 완료!\n\n터키항공(₩1,939,100)과 비교돼요.');
})();
