// ===== DAILY LEDGER: 월별 전략 보드 =====
// 위에서 고른 달(_ldgYear/_ldgMonth)에 맞춰 다시 그린다. 기존 KPI·도넛·TOP·카테고리 집계·일별 추이를 대신한다.
// 큰 그림(집 마감 · 그달 판정 · 나의 규칙) → 연간 목표 → 이 달 플레이북(작년 같은 달) → 세부(봉투 5개 · 큰 결제 · 어디에 썼나) → 나라는 사람(지난 달들로 본 성향).

var MIRROR_GOAL = { label: '집 상환 자금', amount: 25000000, due: '2027-03', potName: 'OK파킹' };  // 2027-03까지 2,500만, 4월 상환
var MIRROR_ENVELOPES = [
  // [이름, 아이콘, 고르는 법, 한도(원) 또는 횟수, 단위]
  ['여행', 'flight', function(t) { return t['대분류'] === '여행'; }, 0, '원'],
  ['옷·뷰티', 'checkroom', function(t) { return t['대분류'] === '품위유지비'; }, 100000, '원'],  // 시즌 달은 아래 표에서 90만
  ['물건', 'inventory_2', function(t) { return t['대분류'] === '생필품비'; }, 200000, '원'],
  ['배달', 'delivery_dining', function(t) { return t['소분류'] === '배달'; }, 8, '회'],
  ['가족·선물', 'redeem', function(t) { return t['대분류'] === '관계비' || t['대분류'] === '경조사비'; }, 350000, '원']
];

// ── 달별 플레이북: 작년 같은 달 데이터로 올해 그 달을 미리 막는다 (2027년엔 2026년 데이터로 저절로)
// 달(1~12)마다 한도·할 일. 'YYYY-MM' 키는 그 해에만. 한도는 원.
var MIRROR_MONTH_PLAN = {
  1:  { caps: { '물건': 300000 }, todo: ['새해 결심 쇼핑 주의 · 큰 물건 프로젝트 없음', '여행 항공은 마일리지 먼저'] },
  2:  { caps: { '사람': 700000 }, todo: ['설 봉투 70만만', '조용한 달 · 남는 돈 그대로 집 통장'] },
  3:  { caps: { '사람': 1000000 }, todo: ['가족 선물 봉투 100만'] },
  4:  { caps: { '사람': 500000 }, todo: ['상여 받는 날 바로 옮기기', '생일 선물 봉투 50만'] },
  5:  { caps: {}, todo: ['종합소득세 · 모아 둔 세금 통장으로'] },
  6:  { caps: { '물건': 500000 }, todo: ['집 프로젝트는 하나만 · 예산 먼저'] },
  7:  { caps: {}, todo: [] },
  8:  { caps: {}, todo: ['가을 여행 예약은 일정 확정 뒤 한 번에'] },
  9:  { caps: {}, todo: [] },
  10: { caps: {}, todo: ['상여 받는 날 바로 옮기기'] },
  11: { caps: { '물건': 300000 }, todo: ['새 여행 예약 0 · 블프는 위시리스트만'] },
  12: { caps: { '사람': 300000 }, todo: ['연말 모임·선물 봉투 30만'] },
  '2027-03': { todo: ['집 상환 자금 2,500만 완성'] },
  '2027-04': { todo: ['집 마지막 상환 🎉'] }
};
var MIRROR_EVERY_MONTH = ['월급날 80만 · 부업 입금일 전액 → 집 통장', '종합소득세 통장에 10만'];

function _bYm(ym, d) { var p = ym.split('-').map(Number), k = p[0] * 12 + (p[1] - 1) + d; return Math.floor(k / 12) + '-' + String(k % 12 + 1).padStart(2, '0'); }
// 옷은 여행 가기 직전에 산다 (누리) — 여행 시작 달의 전달 + (10일 이후 출발이면) 시작 달이 옷 쇼핑 달
var MIRROR_TRIP_CLOTHES = 900000;
function _bClothesMonth(ym) {
  return (_boardExtra.trips || []).filter(function(t) {
    var sm = t.start.slice(0, 7);
    return _bYm(sm, -1) === ym || (sm === ym && +t.start.slice(8, 10) >= 10);
  })[0] || null;
}
function _bPlan(ym) {
  var a = MIRROR_MONTH_PLAN[+ym.slice(5)] || {}, b = MIRROR_MONTH_PLAN[ym] || {}, caps = {};
  [a.caps || {}, b.caps || {}].forEach(function(c) { Object.keys(c).forEach(function(k) { caps[k] = c[k]; }); });
  var todo = (a.todo || []).concat(b.todo || []);
  var ct = _bClothesMonth(ym);
  if (ct) { caps['옷·뷰티'] = MIRROR_TRIP_CLOTHES; todo.push('👗 ' + ct.title + ' 가기 전 옷 쇼핑 달 · 한도 ' + _bMan(MIRROR_TRIP_CLOTHES) + '만'); }
  else todo.push('👗 옷은 여행 직전 달에만 · 이 달은 25만');
  return { caps: caps, todo: todo };
}
function _bRows(ym) { return (_ledgerData.transactions || []).filter(function(t) { return t.date && t.date.slice(0, 7) === ym; }); }
// 작년 그 달에 있었던 '매년 돌아오는 돈' — 데이터에서 찾는다
function _bRecurring(ym) {
  var L = _bRows(ym), out = [];
  var add = function(name, f, min) { var v = _bSum(L, f); if (v >= (min || 1)) out.push([name, v]); };
  add('영어 수업료', function(t) { return t['소분류'] === '영어 강의'; }, 100000);
  add('세금', function(t) { return /국세|지방세|종합소득|재산세|자동차세/.test(t['세부사항'] || '') || ['종합소득세', '재산세', '자동차세'].indexOf(t['소분류']) >= 0; }, 100000);
  add('명절', function(t) { return t['소분류'] === '명절' || /세뱃돈/.test(t['세부사항'] || ''); }, 50000);
  add('선물·가족', function(t) { return t['대분류'] === '관계비' && ['선물', '가족'].indexOf(t['소분류']) >= 0 && t['금액'] > 0; }, 300000);
  add('보험', function(t) { return ['자동차보험', '운전자보험'].indexOf(t['소분류']) >= 0 && t['금액'] >= 100000; }, 100000);
  var sal = L.filter(function(t) { return t['대분류'] === '수입' && t['소분류'] === '월급'; });
  var big = sal.filter(function(t) { return t['금액'] >= 4500000; });
  if (big.length) out.push(['상여 (월급 포함)', big.reduce(function(a, t) { return a + t['금액']; }, 0), true]);
  return out;
}
function _boardPlaybook(ym, m) {
  var ly = _bYm(ym, -12), lm = ldgBoardMonth(ly), mk = (+ym.slice(5)) + '월', plan = _bPlan(ym);
  var rec = _bRecurring(ly), next = _bRecurring(_bYm(ym, -11));
  var left = '';
  if (lm.L.length) {
    // 이번 달이 진행 중이면 작년도 같은 날짜까지만 비교
    var now = new Date(), curYm = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    var cut = ym === curYm ? now.getDate() : 31;
    var lyRows = lm.L.filter(function(t) { return +t.date.slice(8, 10) <= cut && _bS(t); });
    var lyB = MIRROR_BUCKETS.map(function() { return 0; });
    lyRows.forEach(function(t) { lyB[_bBucket(t)] += t['금액'] || 0; });
    var lySpend = lyB.reduce(function(x, y) { return x + y; }, 0);
    var rowsCmp = MIRROR_BUCKETS.map(function(bk, i) { return [bk[0], m.buckets[i], lyB[i], bk[2]]; }).filter(function(x) { return x[1] > 0 || x[2] > 0; });
    var mx = Math.max.apply(null, rowsCmp.map(function(x) { return Math.max(x[1], x[2]); }).concat([1]));
    var d = m.spend - lySpend;
    left = '<div style="display:flex;align-items:baseline;gap:10px;margin-bottom:8px;flex-wrap:wrap"><span class="lb-n" style="font-size:20px">' + _bMan(m.spend) + '만</span>' +
      '<span style="font-size:11px;color:#94a3b8">올해 vs 작년 ' + _bMan(lySpend) + '만' + (cut < 31 ? ' (1~' + cut + '일)' : '') + '</span>' +
      '<span class="lb-n" style="font-size:13px;color:' + (d <= 0 ? '#1baf7a' : '#e34948') + '">' + (d <= 0 ? '▼ ' : '▲ ') + _bMan(Math.abs(d)) + '만</span></div>' +
      '<div style="display:flex;gap:10px;font-size:10px;color:#94a3b8;margin-bottom:4px"><span><i style="display:inline-block;width:8px;height:5px;background:#cbd5e1;border-radius:1px;margin-right:3px"></i>작년</span><span><i style="display:inline-block;width:8px;height:5px;background:#6366f1;border-radius:1px;margin-right:3px"></i>올해</span></div>' +
      rowsCmp.map(function(x) {
        var dd = x[1] - x[2];
        return '<div style="display:grid;grid-template-columns:52px minmax(0,1fr) 92px;gap:6px;align-items:center;font-size:11px;margin:4px 0"><span style="color:#64748b">' + x[0] + '</span>' +
          '<div><div style="height:5px;width:' + (x[2] / mx * 100) + '%;background:#cbd5e1;border-radius:0 2px 2px 0;margin-bottom:2px"></div><div style="height:7px;width:' + Math.max(0, x[1] / mx * 100) + '%;background:' + x[3] + ';border-radius:0 3px 3px 0"></div></div>' +
          '<span style="text-align:right"><b class="lb-n">' + _bMan(x[1]) + '</b><span style="color:#94a3b8"> / ' + _bMan(x[2]) + '</span> <span class="lb-n" style="font-size:10px;color:' + (dd <= 0 ? '#1baf7a' : '#e34948') + '">' + (dd === 0 ? '' : (dd < 0 ? '▼' : '▲') + _bMan(Math.abs(dd))) + '</span></span></div>';
      }).join('') +
      '<div style="font-size:11px;color:#94a3b8;margin-top:6px">작년 ' + mk + ' 전체 ' + _bMan(lm.spend) + '만 · 제일 컸던 것 ' + lm.bigs.slice(0, 2).map(function(t) { return _bEsc((t['세부사항'] || '').split(' · ').pop().replace(/\(주\)|㈜|주식회사|\(.*?\)/g, '').trim().slice(0, 12)) + ' ' + _bMan(t['금액']); }).join(' · ') + '</div>';
  } else {
    left = '<div style="font-size:12px;color:#94a3b8">작년 ' + mk + ' 기록이 없어요</div>';
  }
  var todo = rec.map(function(r) { return (r[2] ? '💰 ' : '📌 ') + r[0] + ' <span style="color:#94a3b8">· 작년 ' + _bMan(r[1]) + '만</span>'; })
    .concat(_boardSerial(ym))
    .concat((function() {
      var tf = _boardTripFor(ym); if (!tf) return [];
      var t = tf.trip, now = new Date(), nowYm = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
      if (t.start <= ym + '-31') return ['✈️ ' + _bEsc(t.title) + ' ' + t.start.slice(5).replace('-', '/') + '~' + t.end.slice(5).replace('-', '/') + ' · 예산 ' + _bMan(t.budget) + '만 (여행 봉투에서 정산)'];
      var left = Math.max(1, _bMonths(nowYm, t.start.slice(0, 7)));  // 지금부터 출발 달까지 나눠서
      return ['🧳 다음 여행 ' + _bEsc(t.title) + ' (' + t.start.slice(2, 7).replace('-', '.') + ') 예산 ' + _bMan(t.budget) + '만' + (t.support ? ' − 회사 지원 ' + _bMan(t.support) + '만 = 내 돈 ' + _bMan(t.own) + '만' : '') + ' · 여행 통장에 월 ' + _bMan(t.own / left) + '만'];
    })())
    .concat(plan.todo.map(function(t) { return (/^👗/.test(t) ? '' : '🎯 ') + _bEsc(t); }))
    .concat(MIRROR_EVERY_MONTH.map(function(t) { return '<span style="color:#64748b">🔁 ' + _bEsc(t) + '</span>'; }));
  var nextHint = next.filter(function(r) { return !r[2]; }).map(function(r) { return r[0] + ' ' + _bMan(r[1]) + '만'; });
  return '<div class="lb-grid">' +
    '<div class="lb-c lb-6"><p class="lb-t"><span>' + mk + ' · 작년 같은 달과 비교</span><span>단위 만 · 올해 / 작년</span></p>' + left + '</div>' +
    '<div class="lb-c lb-6"><p class="lb-t"><span>올해 ' + mk + ' 할 일</span><span>작년 데이터로 자동</span></p>' +
      '<div style="display:flex;flex-direction:column;gap:6px;font-size:12px;color:#0f172a">' + todo.map(function(t) { return '<div>' + t + '</div>'; }).join('') + '</div>' +
      (nextHint.length ? '<div style="font-size:11px;color:#b45309;background:#fffbeb;border-radius:8px;padding:6px 9px;margin-top:10px">다음 달 예고 · 작년엔 ' + nextHint.join(' · ') + '</div>' : '') +
    '</div></div>';
}


// ── 아뜰리에 다른 곳에서 가져오는 계획: Travel(여행 일정·예산) · 캘린더(연재 일정)
var _boardExtra = { trips: null, planner: null, loading: false };
// 여행 회사 지원금 (Travel에 없는 정보라 여기서) — 제목 일부 + 시작 달로 찾음
var MIRROR_TRIP_SUPPORT = [{ match: '프랑스', start: '2027-12', amount: 2500000, note: '회사 지원금' }];
function _boardLoadExtra() {
  if (_boardExtra.loading || (_boardExtra.trips && _boardExtra.planner)) return;
  _boardExtra.loading = true;
  var getTrips = (typeof fbRead === 'function' ? fbRead('trips') : Promise.resolve([])).catch(function() { return []; });
  var getPlanner = (typeof db !== 'undefined' ? db.collection('planner').get().then(function(s) { var a = []; s.forEach(function(d) { a.push(d.data()); }); return a; }) : Promise.resolve([])).catch(function() { return []; });
  Promise.all([getTrips, getPlanner]).then(function(r) {
    var trips = (Array.isArray(r[0]) ? r[0] : Object.values(r[0] || {})).map(function(x) {
      var b = x.budget || {}, sum = ['flight', 'accom', 'transport', 'living', 'tour'].reduce(function(a, k) { return a + (typeof b[k] === 'number' ? b[k] : 0); }, 0);
      var t = { title: String(x.title || x.name || '여행').replace(/^\d{4}\s*/, ''), start: String(x.start_date || x.startDate || x.start || '').slice(0, 10), end: String(x.end_date || x.endDate || x.end || '').slice(0, 10), budget: sum, support: 0 };
      MIRROR_TRIP_SUPPORT.forEach(function(sp) { if (t.title.indexOf(sp.match) >= 0 && t.start.slice(0, 7) === sp.start) t.support += sp.amount; });
      t.own = Math.max(0, t.budget - t.support);
      return t;
    }).filter(function(t) { return t.start; }).sort(function(a, b) { return a.start < b.start ? -1 : 1; });
    _boardExtra.trips = trips;
    _boardExtra.planner = r[1] || [];
    _boardExtra.loading = false;
    try { ldgRenderBoard(); } catch (e) {}
  });
}
// 고른 달에 해당하는 여행: 진행 중이거나 다음에 올 여행. 지난 여행이 끝난 다음 날부터 쓴 여행비를 이 여행 예산에 센다
function _boardTripFor(ym) {
  var trips = _boardExtra.trips || [], monthEnd = ym + '-31', monthStart = ym + '-01';
  for (var i = 0; i < trips.length; i++) {
    if (trips[i].end >= monthStart) return { trip: trips[i], from: i ? trips[i - 1].end : _bYm(trips[i].start.slice(0, 7), -12) + '-01', upto: monthEnd < trips[i].end ? monthEnd : trips[i].end };
  }
  return null;
}
function _boardSerial(ym) {
  var rows = (_boardExtra.planner || []).filter(function(r) { return (r.date || '').slice(0, 7) === ym; });
  var pub = rows.filter(function(r) { return /phase:publishing/.test(r.notes || ''); }).sort(function(a, b) { return a.date < b.date ? -1 : 1; });
  var rev = rows.filter(function(r) { return /phase:revision/.test(r.notes || ''); });
  var draft = rows.filter(function(r) { return /phase:draft/.test(r.notes || ''); });
  var out = [];
  if (pub.length) out.push('✍️ 새 연재 ' + pub.length + '편 올리기 · 첫 편 ' + pub[0].date.slice(5).replace('-', '/') + ' (편당 ≈ 9만 → 다음 달 입금)');
  if (rev.length) out.push('✍️ 퇴고 ' + rev.length + '화 · 이 달엔 새 연재 수입 없음');
  if (draft.length) out.push('✍️ 초고 ' + draft.length + '화');
  return out;
}

var MIRROR_BUCKETS = [
  ['여행', function(t) { return t['대분류'] === '여행'; }, '#2a78d6'],
  ['옷·뷰티', function(t) { return t['대분류'] === '품위유지비'; }, '#e87ba4'],
  ['고정', function(t) { return ['고정비', '주거비', '세금/보험'].indexOf(t['대분류']) >= 0; }, '#888780'],
  ['식비', function(t) { return t['대분류'] === '식비'; }, '#5f5e5a'],
  ['차·교통', function(t) { return t['대분류'] === '교통비'; }, '#a8a69e'],
  ['물건', function(t) { return t['대분류'] === '생필품비'; }, '#eda100'],
  ['가족·선물', function(t) { return t['대분류'] === '관계비' || t['대분류'] === '경조사비'; }, '#1baf7a'],
  ['기타', function() { return true; }, '#c9c7c0']
];

var _bS = function(t) { return t['대분류'] !== '수입' && t['대분류'] !== '저축' && t['대분류'] !== '포인트'; };
var _bI = function(t) { return t['대분류'] === '수입'; };
function _bMan(v) { return (v < 0 ? '−' : '') + Math.round(Math.abs(v) / 10000).toLocaleString(); }
function _bMonths(a, b) { var x = a.split('-').map(Number), y = b.split('-').map(Number); return (y[0] * 12 + y[1]) - (x[0] * 12 + x[1]); }
function _bSum(list, f) { return list.reduce(function(s, t) { return s + (f(t) ? (t['금액'] || 0) : 0); }, 0); }
function _bBucket(t) { for (var i = 0; i < MIRROR_BUCKETS.length; i++) if (MIRROR_BUCKETS[i][1](t)) return i; return MIRROR_BUCKETS.length - 1; }
function _bEsc(s) { return String(s || '').replace(/[&<>"]/g, function(c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

// 지난 달들(뱅샐) — 성향·평소 한 달
function ldgBoardBaseline() {
  var txs = (_ledgerData.transactions || []).filter(function(t) { return t['출처'] === '뱅샐' && t.date; });
  if (!txs.length) return null;
  var all = Array.from(new Set(txs.map(function(t) { return t.date.slice(0, 7); }))).sort();
  var months = all.slice(1, -1); // 처음 달과 이번 달은 반쪽
  var N = months.length || 1;
  var win = txs.filter(function(t) { return months.indexOf(t.date.slice(0, 7)) >= 0; });
  var bucketAvg = MIRROR_BUCKETS.map(function() { return 0; });
  win.forEach(function(t) { if (_bS(t)) bucketAvg[_bBucket(t)] += t['금액'] / N; });
  var byM = months.map(function(m) { var L = win.filter(function(t) { return t.date.slice(0, 7) === m; }); return _bSum(L, _bI) - _bSum(L, _bS); });
  var spendRows = win.filter(function(t) { return t['금액'] > 0 && _bS(t); });
  var shop = spendRows.filter(function(t) { return t['대분류'] === '품위유지비' || t['대분류'] === '생필품비'; });  // 몰아치기는 옷·물건만
  var shopSum = shop.reduce(function(s, t) { return s + t['금액']; }, 0);
  var big = shop.filter(function(t) { return t['금액'] >= 100000; });
  var heat = [0, 1, 2, 3, 4, 5, 6].map(function() { return [0, 0, 0, 0, 0, 0, 0, 0]; });
  spendRows.forEach(function(t) {
    if (!t['시간'] || t['시간'] === '00:00:00' || ['고정비', '주거비', '세금/보험'].indexOf(t['대분류']) >= 0) return;
    heat[(new Date(t.date + 'T12:00:00').getDay() + 6) % 7][Math.floor(parseInt(t['시간'], 10) / 3)] += t['금액'];
  });
  var pk = [0, 0], mx = 0;
  heat.forEach(function(r, i) { r.forEach(function(v, j) { if (v > mx) { mx = v; pk = [i, j]; } }); });
  return {
    N: N, bucketAvg: bucketAvg,
    reds: byM.filter(function(v) { return v < 0; }).length,
    bigN: big.length, bigShare: shopSum ? big.reduce(function(s, t) { return s + t['금액']; }, 0) / shopSum : 0,
    travel: _bSum(win, function(t) { return t['대분류'] === '여행'; }) / N,
    people: _bSum(win, function(t) { return t['대분류'] === '관계비' || t['대분류'] === '경조사비'; }) / N,
    peak: pk, peakAmt: mx
  };
}

function ldgBoardMonth(ym, plain) {
  // 오늘 이후 날짜(고정 거래 자동 예정 행 등)는 아직 일어난 돈이 아니라 뺀다
  var today = new Date(), todayStr = today.getFullYear() + '-' + String(today.getMonth() + 1).padStart(2, '0') + '-' + String(today.getDate()).padStart(2, '0');
  var L = (_ledgerData.transactions || []).filter(function(t) { return t.date && t.date.slice(0, 7) === ym && t.date <= todayStr; });
  var sp = L.filter(_bS);
  var spend = _bSum(sp, function() { return true; });
  var inc = _bSum(L, _bI);
  var salary = _bSum(L, function(t) { return _bI(t) && t['소분류'] === '월급'; });
  var side = _bSum(L, function(t) { return _bI(t) && t['소분류'] === '부업'; });
  var buckets = MIRROR_BUCKETS.map(function() { return 0; });
  sp.forEach(function(t) { buckets[_bBucket(t)] += t['금액'] || 0; });
  var caps = _bPlan(ym).caps;
  var tf = plain ? null : _boardTripFor(ym);
  var envs = MIRROR_ENVELOPES.map(function(e) {
    var rows = sp.filter(e[2]);
    if (e[0] === '여행' && tf) {
      // 지난 여행이 끝난 뒤부터 이 달까지 쓴 여행비 = 이 여행 예산에서 쓴 돈
      var trows = (_ledgerData.transactions || []).filter(function(t) { return t['대분류'] === '여행' && t.date > tf.from && t.date <= tf.upto; });
      return { name: '여행', icon: e[1], val: _bSum(trows, function() { return true; }), cap: tf.trip.budget, unit: '원', money: 0,
               top: [tf.trip.title + ' 예산 ' + _bMan(tf.trip.budget) + '만 · ' + tf.trip.start.slice(2, 7).replace('-', '.')], trip: true };
    }
    var val = e[4] === '회' ? rows.filter(function(t) { return t['금액'] > 0; }).length : _bSum(rows, function() { return true; });
    var tops = {};
    rows.forEach(function(t) { var k = (t['세부사항'] || '').split(' · ').pop().replace(/\(주\)|㈜|주식회사|\(.*?\)/g, '').trim().slice(0, 12); tops[k] = (tops[k] || 0) + t['금액']; });
    var top = Object.keys(tops).sort(function(a, b) { return tops[b] - tops[a]; }).slice(0, 2).map(function(k) { return k + ' ' + _bMan(tops[k]); });
    return { name: e[0], icon: e[1], val: val, cap: caps[e[0]] != null ? caps[e[0]] : e[3], unit: e[4], money: _bSum(rows, function() { return true; }), top: top };
  });
  var bigs = sp.filter(function(t) { return t['금액'] >= 100000; }).sort(function(a, b) { return b['금액'] - a['금액']; });
  var perDay = {};
  sp.forEach(function(t) { if (t['금액'] > 0 && ['품위유지비', '생필품비', '여가비'].indexOf(t['대분류']) >= 0) perDay[t.date] = (perDay[t.date] || 0) + 1; });
  var points = _bSum(L, function(t) { return t['대분류'] === '포인트'; });
  var saveIn = _bSum(L, function(t) { return t['소분류'] === 'OK 적립'; }), saveOut = _bSum(L, function(t) { return t['소분류'] === 'OK 인출'; });
  return { L: L, spend: spend, inc: inc, salary: salary, side: side, left: inc - spend, saveIn: saveIn, saveOut: saveOut, points: points, buckets: buckets, envs: envs, bigs: bigs,
           bigShare: spend ? _bSum(bigs, function() { return true; }) / spend : 0, binge: perDay };
}

function _boardCss() {
  if (document.getElementById('ldg-board-css')) return;
  var s = document.createElement('style');
  s.id = 'ldg-board-css';
  s.textContent = [
    '#ldg-board{margin:0 0 24px}',
    '.lb-grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:10px;margin-bottom:10px}',
    '.lb-c{background:#fff;border:1px solid #eef1f5;border-radius:14px;padding:14px 16px;min-width:0}',
    '.lb-t{font-size:11px;color:#94a3b8;margin:0 0 8px;display:flex;justify-content:space-between;gap:8px;align-items:baseline}',
    '.lb-n{font-variant-numeric:tabular-nums;font-weight:700;color:#0f172a;font-family:Manrope,Pretendard,sans-serif}',
    '.lb-bar{height:6px;border-radius:3px;background:#eef1f5;overflow:hidden;margin:6px 0 4px}',
    '.lb-row{display:grid;grid-template-columns:58px 8px minmax(0,1fr) 54px;gap:8px;align-items:center;font-size:12px;padding:5px 0;border-top:1px solid #f1f5f9}',
    '.lb-sq{width:8px;height:8px;border-radius:2px}',
    '.lb-env{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:14px}',
    '.lb-goal{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}',
    '.lb-ms{font-size:11px;color:#94a3b8;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.lb-3{grid-column:span 4}.lb-6{grid-column:span 6}',
    '.lb-more{font-size:11px;color:#6366f1;background:none;border:0;padding:4px 0 0;cursor:pointer}',
    '@media (max-width:1100px){.lb-3{grid-column:span 6}.lb-env{grid-template-columns:repeat(3,minmax(0,1fr))}}',
    '@media (max-width:720px){.lb-goal{grid-template-columns:repeat(2,minmax(0,1fr))}.lb-3,.lb-6{grid-column:span 12}.lb-env{grid-template-columns:repeat(2,minmax(0,1fr))}}'
  ].join('\n');
  document.head.appendChild(s);
}


// ── 연간 목표 (설정 → 연간 목표 값, 기존 '연간 목표 진행도'와 같은 계산)
function _boardGoals() {
  var year = _ldgYear, goals = (typeof ldgLoadGoals === 'function' ? ldgLoadGoals() : {})[year] || {};
  var keys = [['수입', true, '#2a78d6'], ['지출', false, '#e34948'], ['저축', true, '#6366f1'], ['부업', true, '#1baf7a']];
  if (!keys.some(function(k) { return goals[k[0]]; })) {
    return '<div class="lb-c" style="margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#64748b">' + year + '년 목표가 아직 없어요' +
      '<button class="lb-more" onclick="switchLedgerTab(\'settings\');setTimeout(function(){ldgSetSubTab(\'goals\');},50)">목표 설정 →</button></div>';
  }
  var tot = { '수입': 0, '지출': 0, '저축': 0, '부업': 0 };
  (_ledgerData.transactions || []).forEach(function(t) {
    if (!t.date || t.date.slice(0, 4) !== String(year) || t.excludeFromGoal === true) return;
    var a = t['금액'] || 0;
    if (t['대분류'] === '수입') { tot['수입'] += a; if (t['소분류'] === '부업') tot['부업'] += a; }
    else if (t['대분류'] === '저축') tot['저축'] += a;
    else if (t['대분류'] === '포인트') return;
    else tot['지출'] += a;
  });
  var now = new Date(), isCur = year === now.getFullYear();
  var prog = isCur ? Math.min(1, (Math.floor((now - new Date(year, 0, 1)) / 86400000) + 1) / 365) : 1;
  var cells = keys.map(function(k) {
    var goal = goals[k[0]] || 0, act = Math.round(tot[k[0]] / 10000);
    if (!goal) return '<div style="font-size:11px;color:#94a3b8">' + k[0] + ' · 목표 없음</div>';
    var diff = act - goal * prog, good = k[1] ? diff >= 0 : diff <= 0;
    var col = good ? '#1baf7a' : '#e34948';
    return '<div><div style="display:flex;justify-content:space-between;font-size:12px"><span style="color:#64748b">' + k[0] + '</span>' +
      '<span><b class="lb-n">' + act.toLocaleString() + '</b><span style="color:#94a3b8;font-size:11px"> / ' + goal.toLocaleString() + '만</span></span></div>' +
      '<div class="lb-bar" style="position:relative;overflow:visible"><div style="width:' + Math.min(100, act / goal * 100) + '%;height:100%;background:' + col + ';border-radius:3px"></div>' +
      '<div title="오늘까지 목표 페이스" style="position:absolute;left:' + Math.round(prog * 100) + '%;top:-3px;bottom:-3px;width:2px;background:#475569"></div></div>' +
      '<div style="font-size:11px;color:' + col + '">페이스 대비 ' + (diff >= 0 ? '+' : '') + Math.round(diff).toLocaleString() + '만</div></div>';
  }).join('');
  return '<div class="lb-c" style="margin-bottom:10px"><p class="lb-t"><span>' + year + '년 목표 · 올해 ' + Math.round(prog * 100) + '% 지남</span><span>검정 선 = 오늘까지 목표 페이스 · <a href="javascript:void(0)" style="color:#6366f1" onclick="switchLedgerTab(\'settings\');setTimeout(function(){ldgSetSubTab(\'goals\');},50)">목표 고치기</a></span></p>' +
    '<div class="lb-goal">' + cells + '</div></div>';
}


// ── 어디서 새나: 지난 달들(뱅샐)을 필수·가치·일회성·습관성으로 나누고, 습관성에서 줄일 곳
var MIRROR_LEAK_FIX = {
  '옷':       ['checkroom', '#e87ba4', '시즌 달(3·9월)에만 · 장바구니 7일', 0.6],
  '외식':     ['restaurant', '#5f5e5a', '평일 점심은 구내식당 · 외식은 주 2번', 0.33],
  '배달':     ['delivery_dining', '#6250d6', '평일 낮 0 · 주말 하루만', 0.5],
  '생활 잡화': ['inventory_2', '#eda100', '온라인은 금요일 한 번에 모아서', 0.4],
  '구독':     ['autorenew', '#888780', 'AI는 Pro 하나 · 나머지 회사 정산', 0.7],
  '카페·간식': ['local_cafe', '#a16207', '출근길 한 잔만 · 오후 카페는 금요일', 0.4],
  '취미·여가': ['palette', '#7f77dd', '한 달 10만 봉투', 0.35],
  '편의점':   ['storefront', '#94a3b8', '퇴근길 편의점 주 2번', 0.4]
};
function _boardLeaks() {
  var txs = (_ledgerData.transactions || []).filter(function(t) { return t['출처'] === '뱅샐' && t.date && _bS(t); });
  var all = Array.from(new Set(txs.map(function(t) { return t.date.slice(0, 7); }))).sort(), months = all.slice(1, -1), N = months.length || 1;
  var win = txs.filter(function(t) { return months.indexOf(t.date.slice(0, 7)) >= 0; });
  var grp = { '필수·고정': 0, '가치': 0, '일회성': 0, '습관성': 0 }, hab = {}, cnt = {};
  win.forEach(function(t) {
    var M = t['대분류'], S = t['소분류'], a = t['금액'] || 0, g, k = null;
    if (M === '여행' || M === '관계비' || M === '경조사비' || S === '할머니용돈' || S === '영어 강의' || S === '도서') g = '가치';
    else if ((['고정비', '주거비', '세금/보험'].indexOf(M) >= 0 && S !== '정기구독') || M === '교통비' || M === '건강/의료비' || S === '식재료비' || S === '구내식당') g = '필수·고정';
    else if (a >= 300000 || M === '미분류') g = '일회성';
    else {
      g = '습관성';
      k = M === '품위유지비' ? '옷' : S === '외식비' ? '외식' : S === '배달' ? '배달' : M === '생필품비' ? '생활 잡화' : S === '정기구독' ? '구독' : S === '간식/카페' ? '카페·간식' : M === '여가비' ? '취미·여가' : S === '편의점' ? '편의점' : null;
    }
    grp[g] += a;
    if (k) { hab[k] = (hab[k] || 0) + a; if (a > 0) cnt[k] = (cnt[k] || 0) + 1; }
  });
  var total = Object.keys(grp).reduce(function(x, y) { return x + grp[y]; }, 0) || 1;
  var cols = { '필수·고정': '#888780', '가치': '#2a78d6', '일회성': '#b4b2a9', '습관성': '#e34948' };
  var bar = Object.keys(grp).map(function(g) { return '<div title="' + g + ' ' + _bMan(grp[g]) + '만" style="flex:' + Math.max(grp[g], 0) + ';background:' + cols[g] + ';color:#fff;font-size:11px;display:flex;align-items:center;justify-content:center;white-space:nowrap;overflow:hidden">' + g + ' ' + _bMan(grp[g]) + '</div>'; }).join('');
  var keys = Object.keys(hab).sort(function(a, b) { return hab[b] - hab[a]; });
  var cutSum = 0;
  var rows = keys.map(function(k) {
    var f = MIRROR_LEAK_FIX[k], mon = hab[k] / N, cut = mon * f[3]; cutSum += cut;
    return '<div style="display:grid;grid-template-columns:20px minmax(0,1.2fr) 48px minmax(0,1.3fr) 40px;gap:8px;align-items:center;font-size:12px;padding:6px 0;border-top:1px solid #f1f5f9">' +
      '<span class="material-symbols-outlined" style="font-size:16px;color:' + f[1] + '">' + f[0] + '</span>' +
      '<span><b style="font-weight:600">' + k + '</b> <span style="font-size:11px;color:#94a3b8">· 월 ' + ((cnt[k] || 0) / N).toFixed(1) + '번</span></span>' +
      '<b class="lb-n" style="text-align:right">' + _bMan(mon) + '만</b>' +
      '<span style="font-size:11px;color:#64748b">' + f[2] + '</span>' +
      '<b class="lb-n" style="text-align:right;color:#1baf7a">−' + _bMan(cut) + '</b></div>';
  }).join('');
  return '<div class="lb-c" style="margin-top:10px"><p class="lb-t"><span>어디서 새나 · 지난 ' + N + '달 ' + _bMan(total) + '만</span><span>습관성 안에서 줄일 곳 · 지금 월 / 줄일 월</span></p>' +
    '<div style="display:flex;height:26px;border-radius:7px;overflow:hidden;gap:2px;margin-bottom:8px">' + bar + '</div>' + rows +
    '<div style="display:flex;justify-content:space-between;align-items:baseline;padding-top:8px;border-top:1px solid #f1f5f9"><span style="font-size:11px;color:#94a3b8">여행·사람·영어는 가치라 지켜요 · 여행은 1년 2번</span><span><b class="lb-n" style="font-size:18px;color:#1baf7a">월 ' + _bMan(cutSum) + '만</b><span style="font-size:11px;color:#94a3b8"> · 연 ' + _bMan(cutSum * 12) + '만</span></span></div></div>';
}


// ── 통장 나누기 (상여 없는 평달 기준, 원) — 2026-10-15 누리와 정함
var MIRROR_SPLIT = [
  // [이름, 계획, 색, 설명]
  ['고정', 950000, '#888780', '할머니·관리비·월주차·통신·구독'],
  ['연간 적립', 230000, '#b4b2a9', '영어 수업료·종소세 미리'],
  ['생활비', 1830000, '#e87ba4', '카드 한 장 · 아래 칸별 한도'],
  ['여행', 300000, '#2a78d6', '+ 상여 = 1년 2번'],
  ['집 자금', 1390000, '#1baf7a', '2027-04부터 이주 자금']
];
// 생활비 칸별 한도 (원). 달별 예외는 MIRROR_MONTH_PLAN caps
var MIRROR_LIVING = [
  ['외식', 'restaurant', function(t) { return t['소분류'] === '외식비'; }, 250000],
  ['배달', 'delivery_dining', function(t) { return t['소분류'] === '배달'; }, 120000],
  ['카페·간식', 'local_cafe', function(t) { return t['소분류'] === '간식/카페'; }, 100000],
  ['장보기', 'shopping_basket', function(t) { return t['소분류'] === '식재료비' || t['소분류'] === '구내식당'; }, 160000],
  ['편의점', 'storefront', function(t) { return t['소분류'] === '편의점'; }, 30000],
  ['옷·뷰티', 'checkroom', function(t) { return t['대분류'] === '품위유지비'; }, 250000],
  ['물건', 'inventory_2', function(t) { return t['대분류'] === '생필품비'; }, 200000],
  ['병원·약', 'medical_services', function(t) { return t['대분류'] === '건강/의료비'; }, 200000],
  ['주유·교통', 'local_gas_station', function(t) { return t['대분류'] === '교통비' && t['소분류'] !== '주차비'; }, 220000],
  ['취미·여가', 'palette', function(t) { return t['대분류'] === '여가비'; }, 100000],
  ['책·공부', 'menu_book', function(t) { return t['대분류'] === '자기계발비' && t['소분류'] !== '영어 강의'; }, 100000],
  ['사람', 'groups', function(t) { return (t['대분류'] === '관계비' || t['대분류'] === '경조사비') && t['소분류'] !== '할머니용돈'; }, 100000]
];
var _bFixed = function(t) { return ['고정비', '주거비', '세금/보험'].indexOf(t['대분류']) >= 0 || t['소분류'] === '주차비' || t['소분류'] === '할머니용돈'; };
var _bAnnual = function(t) { return t['소분류'] === '영어 강의' || /종합소득|국세/.test(t['세부사항'] || ''); };
function _bLivingRow(t) { for (var i = 0; i < MIRROR_LIVING.length; i++) if (MIRROR_LIVING[i][2](t)) return i; return -1; }

function _boardSplit(ym, m) {
  var L = m ? m.L : [], RED = '#e34948', GREEN = '#1baf7a';
  var inc = _bSum(L, function(t) { return t['대분류'] === '수입'; });
  var sal = L.filter(function(t) { return t['대분류'] === '수입' && t['소분류'] === '월급'; });
  var bonus = sal.reduce(function(a, t) { return a + (t['금액'] > 4000000 ? t['금액'] - 3550000 : 0); }, 0);  // 평소 월급(≈355만) 넘는 몫 ≈ 상여
  var act = {
    '고정': _bSum(L, function(t) { return _bS(t) && _bFixed(t) && !_bAnnual(t); }),
    '연간 적립': _bSum(L, function(t) { return _bS(t) && _bAnnual(t); }),
    '생활비': _bSum(L, function(t) { return _bS(t) && !_bFixed(t) && !_bAnnual(t) && t['대분류'] !== '여행' && t['대분류'] !== '미분류'; }),
    '여행': _bSum(L, function(t) { return t['대분류'] === '여행'; }),
    '집 자금': _bSum(L, function(t) { return t['소분류'] === 'OK 적립' || t['소분류'] === 'OK 인출'; })
  };
  var tf = _boardTripFor(ym), bonusTo = ym <= MIRROR_GOAL.due ? '집 자금' : (tf ? tf.trip.title + ' 여행' : '여행');
  var cells = MIRROR_SPLIT.map(function(x) {
    var name = x[0], plan = x[1], a = act[name], label = name === '집 자금' && ym >= '2027-04' ? '이주 자금' : name;
    var isSave = name === '집 자금', isTravel = name === '여행';
    var good = isSave ? a >= plan : a <= plan;
    var sub = isTravel ? '이 달 쓴 여행비 ' + _bMan(a) + '만 (여행 통장에서)' : (isSave ? '이 달 OK 순적립 ' + _bMan(a) + '만' : '쓴 돈 ' + _bMan(a) + '만');
    return '<div style="border-top:3px solid ' + x[2] + ';padding-top:6px"><div style="display:flex;justify-content:space-between;font-size:12px"><span>' + label + '</span><b class="lb-n">' + _bMan(plan) + '만</b></div>' +
      '<div style="font-size:11px;color:' + (m && m.L.length && !isTravel ? (good ? GREEN : RED) : '#94a3b8') + ';margin-top:2px">' + (m && m.L.length ? sub : x[3]) + '</div></div>';
  }).join('');
  var bonusLine = bonus > 0 ? '<div style="font-size:11px;color:#6366f1;background:#eef2ff;border-radius:8px;padding:6px 10px;margin-top:8px">💰 이 달 상여 ≈ ' + _bMan(bonus) + '만 → 받는 날 바로 <b>' + _bEsc(bonusTo) + '</b></div>' :
    ((+ym.slice(5) === 4 || +ym.slice(5) === 10) ? '<div style="font-size:11px;color:#6366f1;background:#eef2ff;border-radius:8px;padding:6px 10px;margin-top:8px">💰 상여 달 · 받는 날 바로 <b>' + _bEsc(bonusTo) + '</b>으로</div>' : '');
  return '<div class="lb-c" style="margin-bottom:10px"><p class="lb-t"><span>' + (+ym.slice(5)) + '월 돈 나누기 · 평달 수입 470만 기준</span><span>' + (m && m.L.length ? '이 달 들어온 돈 ' + _bMan(inc) + '만' : '계획') + '</span></p>' +
    '<div style="display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px">' + cells + '</div>' + bonusLine + '</div>';
}

function _boardLiving(ym, m, preview) {
  var caps = _bPlan(ym).caps, RED = '#e34948', GREEN = '#1baf7a';
  var sp = m ? m.L.filter(_bS) : [];
  var ly = (function() { try { return ldgBoardMonth(_bYm(ym, -12), true).L.filter(_bS); } catch (e) { return []; } })();
  var tot = 0, totCap = 0;
  var cells = MIRROR_LIVING.map(function(x, i) {
    var cap = caps[x[0]] != null ? caps[x[0]] : x[3]; totCap += cap;
    var rows = sp.filter(function(t) { return _bLivingRow(t) === i; }), v = _bSum(rows, function() { return true; }); tot += v;
    var lv = _bSum(ly.filter(function(t) { return _bLivingRow(t) === i; }), function() { return true; });
    var pct = cap ? Math.min(100, v / cap * 100) : 0, over = v > cap, col = over ? RED : (pct >= 80 ? '#eda100' : GREEN);
    return '<div><div style="font-size:12px;display:flex;justify-content:space-between;gap:4px"><span style="white-space:nowrap"><span class="material-symbols-outlined" style="font-size:14px;vertical-align:-3px;color:#64748b">' + x[1] + '</span> ' + x[0] + '</span>' +
      '<b class="lb-n" style="white-space:nowrap;color:' + (over ? RED : '#0f172a') + '">' + (preview ? '' : _bMan(v) + ' / ') + _bMan(cap) + '만</b></div>' +
      (preview ? '' : '<div class="lb-bar"><div style="width:' + pct + '%;height:100%;background:' + col + '"></div></div>') +
      '<div class="lb-ms"><span style="color:#b45309">작년 ' + _bMan(lv) + '만</span>' + (lv > cap ? ' → <b style="color:' + GREEN + '">' + _bMan(lv - cap) + ' 덜</b>' : '') + '</div></div>';
  }).join('');
  var tf = _boardTripFor(ym), trip = '';
  if (tf) {
    var tv = m && !preview ? m.envs[0].val : 0;
    trip = '<div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;margin-top:10px;padding-top:8px;border-top:1px solid #f1f5f9"><span><span class="material-symbols-outlined" style="font-size:14px;vertical-align:-3px;color:#2a78d6">flight</span> 여행은 따로 · ' + _bEsc(tf.trip.title) + ' (' + tf.trip.start.slice(2, 7).replace('-', '.') + ')' + (tf.trip.support ? ' · 회사 지원 ' + _bMan(tf.trip.support) + '만 포함' : '') + '</span><b class="lb-n" style="color:' + (tv > tf.trip.budget ? RED : '#0f172a') + '">' + (preview ? '' : _bMan(tv) + ' / ') + _bMan(tf.trip.budget) + '만</b></div>';
  }
  return '<div class="lb-c" style="margin-bottom:10px"><p class="lb-t"><span>' + (+ym.slice(5)) + '월 생활비 · 칸별 한도</span><span>' + (preview ? '한도 ' + _bMan(totCap) + '만' : '<b class="lb-n" style="color:' + (tot > totCap ? RED : GREEN) + '">' + _bMan(tot) + '</b> / ' + _bMan(totCap) + '만') + '</span></p>' +
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px 16px">' + cells + '</div>' + trip + '</div>';
}

var _boardShowAllBig = false;

function ldgRenderBoard() {
  var el = document.getElementById('ldg-board');
  if (!el || typeof _ldgYear === 'undefined') return;
  _boardCss();
  _boardLoadExtra();
  var ym = _ldgYear + '-' + String(_ldgMonth).padStart(2, '0');
  var mk = _ldgMonth + '월';
  var m = ldgBoardMonth(ym), b = ldgBoardBaseline();
  if (!m.L.length) {
    // 아직 오지 않은 달: 작년 같은 달과 올해 할 일·예산을 미리 보여 준다
    el.innerHTML = '<div style="font-size:11px;color:#6366f1;background:#eef2ff;border-radius:8px;padding:6px 10px;margin-bottom:8px">' + mk + '은 아직 오지 않았어요 · 작년 같은 달을 보고 미리 짠 계획이에요</div>' +
      _boardPlaybook(ym, m) + _boardSplit(ym, null) + _boardLiving(ym, null, true);
    return;
  }
  var T = MIRROR_GOAL.amount, RED = '#e34948', GREEN = '#1baf7a', h = '';
  if (!m.L.some(function(t) { return t['출처'] === '뱅샐'; })) {
    h += '<div style="font-size:11px;color:#b45309;background:#fffbeb;border-radius:8px;padding:6px 10px;margin-bottom:8px">' + mk + '은 손으로 적은 기록이에요 — 저축·여행 준비금 같은 이체가 섞여 있어 판정이 정확하지 않을 수 있어요</div>';
  }

  // ── 큰 그림
  var pot = 0;
  ((_ledgerData.assets || {})['현금자산'] || []).forEach(function(it) {
    if ((it['소분류'] || '').indexOf(MIRROR_GOAL.potName) < 0) return;
    (it['월별'] || []).forEach(function(v) { if (v != null) pot = v; });
  });
  var now = new Date(), nowYm = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  var monthsLeft = Math.max(1, _bMonths(nowYm, MIRROR_GOAL.due));
  var need = Math.max(0, (T - pot) / monthsLeft);
  var gap = m.left - need;
  var causes = MIRROR_BUCKETS.map(function(bk, i) { return [bk[0], m.buckets[i] - (b ? b.bucketAvg[i] : 0), m.buckets[i]]; })
    .filter(function(c) { return c[1] > 0 && c[0] !== '기타'; }).sort(function(x, y) { return y[1] - x[1]; }).slice(0, 2);
  var ok = gap >= 0;
  h += '<div class="lb-grid">' +
    '<div class="lb-c lb-3"><p class="lb-t"><span>' + MIRROR_GOAL.label + ' · ' + MIRROR_GOAL.due.replace('-', '.') + '</span><span>' + monthsLeft + '달 남음</span></p>' +
      '<div><span class="lb-n" style="font-size:22px">' + _bMan(pot) + '</span><span style="font-size:12px;color:#94a3b8"> / ' + _bMan(T) + '만</span></div>' +
      '<div class="lb-bar" style="height:8px"><div style="width:' + Math.min(100, pot / T * 100) + '%;height:100%;background:#2a78d6"></div></div>' +
      '<div style="font-size:11px;color:#64748b">매달 <b class="lb-n">+' + _bMan(need) + '만</b>씩 모여야 해요</div>' +
      '<div style="font-size:11px;color:#64748b;margin-top:4px">' + mk + ' 저금 <b class="lb-n" style="color:' + GREEN + '">+' + _bMan(m.saveIn) + '</b> · 꺼냄 <b class="lb-n" style="color:' + (m.saveOut < 0 ? RED : '#64748b') + '">' + _bMan(m.saveOut) + '</b> · 순 <b class="lb-n">' + (m.saveIn + m.saveOut >= 0 ? '+' : '') + _bMan(m.saveIn + m.saveOut) + '만</b></div></div>' +
    '<div class="lb-c lb-3" style="border:1.5px solid ' + (ok ? '#bbf7d0' : '#fecaca') + '"><p class="lb-t"><span>' + mk + ' 판정</span><span style="color:' + (ok ? GREEN : RED) + '">목표 ' + (ok ? '+' : '') + _bMan(gap) + '만</span></p>' +
      '<div><span class="lb-n" style="font-size:22px;color:' + (m.left >= 0 ? GREEN : RED) + '">' + (m.left >= 0 ? '+' : '') + _bMan(m.left) + '만</span><span style="font-size:12px;color:#94a3b8"> 남은 돈</span></div>' +
      '<div style="font-size:11px;color:#64748b;margin-top:8px">' + (causes.length ? causes.map(function(c, i) { return '원인 ' + (i + 1) + '위 <b class="lb-n">' + c[0] + ' ' + _bMan(c[2]) + '만</b>'; }).join(' · ') : '평소보다 넘친 항목 없음') + '</div></div>' +
    '<div class="lb-c lb-3"><p class="lb-t"><span>나의 규칙 2개</span><span>성향 맞춤</span></p>' +
      '<div style="font-size:12px;display:flex;flex-direction:column;gap:7px;color:#0f172a">' +
      '<div><span class="material-symbols-outlined" style="font-size:15px;vertical-align:-3px;color:#6366f1">east</span> 10일 부업 <b class="lb-n">' + _bMan(m.side) + '만</b> → 바로 집 통장</div>' +
      '<div><span class="material-symbols-outlined" style="font-size:15px;vertical-align:-3px;color:' + (m.spend <= m.salary ? GREEN : RED) + '">' + (m.spend <= m.salary ? 'check_circle' : 'cancel') + '</span> 월급 <b class="lb-n">' + _bMan(m.salary) + '만</b> 안에서 살기 <span style="color:' + (m.spend <= m.salary ? GREEN : RED) + '">· ' + _bMan(m.spend) + '만 씀</span></div>' +
      '</div></div></div>';

  // ── 연간 목표
  try { h += _boardGoals(); } catch (e) { console.error('[Board goals]', e); }

  // ── 이 달 플레이북 (작년 같은 달 → 올해 할 일)
  try { h += _boardPlaybook(ym, m); } catch (e) { console.error('[Board playbook]', e); }

  // ── 돈 나누기 + 생활비 칸별 한도 (여행은 따로)
  try { h += _boardSplit(ym, m) + _boardLiving(ym, m, false); } catch (e) { console.error('[Board split]', e); }

  // ── 큰 결제 · 어디에 썼나
  var list = _boardShowAllBig ? m.bigs : m.bigs.slice(0, 6);
  var bigRows = list.map(function(t) {
    var zap = (m.binge[t.date] || 0) >= 3;
    return '<div class="lb-row"><span style="color:#94a3b8">' + t.date.slice(5).replace('-', '/') + (zap ? ' ⚡' : '') + '</span><span class="lb-sq" style="background:' + MIRROR_BUCKETS[_bBucket(t)][2] + '"></span>' +
      '<span style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="' + _bEsc(t['세부사항']) + '">' + _bEsc((t['세부사항'] || '').replace(/\(주\)|㈜|주식회사/g, '').trim()) + '</span><b class="lb-n" style="text-align:right">' + _bMan(t['금액']) + '만</b></div>';
  }).join('');
  var maxB = Math.max.apply(null, m.buckets.concat(b ? b.bucketAvg : []).concat([1]));
  var cats = MIRROR_BUCKETS.map(function(bk, i) {
    var v = m.buckets[i], a = b ? b.bucketAvg[i] : 0;
    return '<div style="display:grid;grid-template-columns:60px minmax(0,1fr) 36px 58px;gap:8px;align-items:center;font-size:12px;margin:5px 0"><span style="color:#64748b">' + bk[0] + '</span>' +
      '<div style="position:relative;height:12px"><div style="height:100%;width:' + Math.max(0, v / maxB * 100) + '%;background:' + bk[2] + ';border-radius:0 3px 3px 0"></div>' +
      (a ? '<div title="평소 ' + _bMan(a) + '만" style="position:absolute;top:-2px;bottom:-2px;left:' + (a / maxB * 100) + '%;width:2px;background:#0f172a;opacity:.5"></div>' : '') + '</div>' +
      '<b class="lb-n" style="text-align:right;color:' + (a && v > a * 1.15 ? RED : '#0f172a') + '">' + _bMan(v) + '</b>' +
      '<span style="font-size:10px;color:#94a3b8;text-align:right">' + (a ? '평소 ' + _bMan(a) : '') + '</span></div>';
  }).join('');
  h += '<div class="lb-grid">' +
    '<div class="lb-c lb-6"><p class="lb-t"><span>' + mk + ' 큰 결제 (10만↑) · ' + m.bigs.length + '건 = 지출의 ' + Math.round(m.bigShare * 100) + '%</span><span>⚡ 하루 3건↑ 몰아친 날</span></p>' +
      (bigRows || '<div style="font-size:12px;color:#94a3b8">없음</div>') +
      (m.bigs.length > 6 ? '<button class="lb-more" onclick="_boardShowAllBig=!_boardShowAllBig;ldgRenderBoard()">' + (_boardShowAllBig ? '접기' : '+ ' + (m.bigs.length - 6) + '건 더보기') + '</button>' : '') + '</div>' +
    '<div class="lb-c lb-6"><p class="lb-t"><span>' + mk + ' 어디에 · ' + _bMan(m.spend) + '만</span><span>세로선 = 평소 한 달</span></p>' + cats +
      (m.points ? '<div style="font-size:11px;color:#b45309;margin-top:6px">+ 포인트로 낸 돈 ' + (m.points / 10000).toFixed(1) + '만 (지출에 안 넣음)</div>' : '') + '</div></div>';

  // ── 나라는 사람
  if (b) {
    var dn = ['월', '화', '수', '목', '금', '토', '일'];
    var trait = function(icon, title, val, red, rx) {
      return '<div><div style="font-size:12px;color:#64748b"><span class="material-symbols-outlined" style="font-size:15px;vertical-align:-3px">' + icon + '</span> ' + title + '</div>' +
        '<div class="lb-n" style="font-size:17px;margin-top:4px;color:' + (red ? RED : '#0f172a') + '">' + val + '</div><div style="font-size:11px;color:#94a3b8">→ ' + rx + '</div></div>';
    };
    h += '<div class="lb-c"><p class="lb-t"><span>나라는 사람 · 지난 ' + b.N + '달로 본 성향</span><span>뱅샐 가져올 때마다 다시 계산</span></p>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:14px">' +
      trait('account_balance_wallet', '쓰고 남으면 모으는 형', b.reds + ' / ' + b.N + '달 적자', b.reds > b.N / 2, '먼저 떼고 쓰기') +
      trait('bolt', '몰아치기형', '옷·물건 10만↑ ' + b.bigN + '건 = ' + Math.round(b.bigShare * 100) + '%', false, '10만↑은 7일 대기') +
      trait('flight', '경험·사람에 쓰는 형', '여행 ' + _bMan(b.travel) + ' + 사람 ' + _bMan(b.people) + ' / 달', false, '여행은 1년 2번 · 미리 모은 여행 통장으로') +
      trait('schedule', dn[b.peak[0]] + '요일 ' + b.peak[1] * 3 + '–' + (b.peak[1] * 3 + 3) + '시형', _bMan(b.peakAmt) + '만 (' + b.N + '달)', false, '그 시간엔 장바구니만') +
      '</div></div>';
  }
  try { h += _boardLeaks(); } catch (e) { console.error('[Board leaks]', e); }
  var open = false;
  try { open = localStorage.getItem('atelier_ledger_detail_open') === '1'; } catch (e) {}
  h += '<button onclick="ldgToggleDetail()" style="width:100%;margin-top:10px;font-size:12px;color:#6366f1;background:#eef2ff;border:0;border-radius:10px;padding:9px;cursor:pointer">' +
    (open ? '▴ 차트 접기' : '▾ 차트 더 보기 · KPI · 수입/지출 구성 · TOP 카테고리 · 일별 추이') + '</button>';
  el.innerHTML = h;
  _applyDetailVisibility();
}
window.ldgRenderBoard = ldgRenderBoard;

// 기존 가계부 자세히(KPI·도넛·TOP·일별 추이·카테고리 집계) 보이기/숨기기 — 차트가 0 크기로 그려지지 않게 그리기 전에 적용
function _applyDetailVisibility() {
  var open = false;
  try { open = localStorage.getItem('atelier_ledger_detail_open') === '1'; } catch (e) {}
  ['ldg-kpi-strip', 'ldg-detail-charts'].forEach(function(id) { var x = document.getElementById(id); if (x) x.style.display = open ? '' : 'none'; });
}

function ldgToggleDetail() {
  var open = false;
  try { open = localStorage.getItem('atelier_ledger_detail_open') === '1'; localStorage.setItem('atelier_ledger_detail_open', open ? '0' : '1'); } catch (e) {}
  ldgRenderMonthly();  // 보이게 된 차트를 제 크기로 다시 그림
  if (!open) setTimeout(function() { var x = document.getElementById('ldg-kpi-strip'); if (x) x.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 80);
}
window.ldgToggleDetail = ldgToggleDetail;

// 월별 뷰가 그려질 때마다(달 이동 포함) 보드도 같이
(function() {
  var orig = window.ldgRenderMonthly;
  if (typeof orig !== 'function' || orig._withBoard) return;
  var wrapped = function() { try { _applyDetailVisibility(); } catch (e) {} var r = orig.apply(this, arguments); try { ldgRenderBoard(); } catch (e) { console.error('[Board]', e); } return r; };
  wrapped._withBoard = true;
  window.ldgRenderMonthly = wrapped;
})();
