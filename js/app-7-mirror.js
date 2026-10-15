// ===== DAILY LEDGER: 월별 뷰 맨 위 보드 =====
// 뱅샐로 가져온 거래(출처:'뱅샐')만으로 계산한다. 매달 가져오면 숫자가 저절로 바뀐다.
// 글은 줄이고 그림으로: 3가지 = 집, 들어온 돈 vs 나간 돈, 요일×시간, 큰 결제 점, 추세, 4월까지 선, 할 일 5개.

var MIRROR_GOAL = { label: '집 마지막 상환', amount: 25000000, due: '2027-04', potName: 'OK파킹' };
var MIRROR_PLAN = { goodsCap: 200000, clothesCap: 300000, deliveryCut: 0.5 };

var _brd = {
  red: '#e34948', blue: '#2a78d6', green: '#1baf7a', pink: '#e87ba4', amber: '#eda100', violet: '#6250d6',
  gray: '#b4b2a9', dark: '#888780', ink: '#0f172a', sub: '#64748b', mute: '#94a3b8', line: '#e2e8f0', card: '#f8fafc'
};

function _brdMan(v) { return (v < 0 ? '−' : '') + Math.round(Math.abs(v) / 10000).toLocaleString(); }
function _brdMonths(a, b) { var x = a.split('-').map(Number), y = b.split('-').map(Number); return (y[0] * 12 + y[1]) - (x[0] * 12 + x[1]); }

function ldgBoardCompute() {
  var txs = (_ledgerData.transactions || []).filter(function(t) { return t['출처'] === '뱅샐' && t.date; });
  if (!txs.length) return null;
  var all = Array.from(new Set(txs.map(function(t) { return t.date.slice(0, 7); }))).sort();
  var months = all.slice(1, -1); // 처음 달과 이번 달은 반쪽
  var cur = all[all.length - 1];
  var N = months.length || 1;
  var win = txs.filter(function(t) { return months.indexOf(t.date.slice(0, 7)) >= 0; });
  var isInc = function(t) { return t['대분류'] === '수입'; };
  var isSp = function(t) { return t['대분류'] !== '수입' && t['대분류'] !== '저축'; };
  var sum = function(list, f) { return list.reduce(function(s, t) { return s + (f(t) ? (t['금액'] || 0) : 0); }, 0); };

  var trio = {
    travel: sum(win, function(t) { return t['대분류'] === '여행'; }),
    clothes: sum(win, function(t) { return t['대분류'] === '품위유지비'; }),
    goods: sum(win, function(t) { return t['대분류'] === '생필품비'; })
  };

  var inc = { salary: sum(win, function(t) { return isInc(t) && t['소분류'] === '월급'; }) / N,
              side: sum(win, function(t) { return isInc(t) && t['소분류'] === '부업'; }) / N };
  inc.total = sum(win, isInc) / N; inc.etc = inc.total - inc.salary - inc.side;
  var buckets = [
    ['고정', function(t) { return ['고정비', '주거비', '세금/보험'].indexOf(t['대분류']) >= 0; }, _brd.dark],
    ['여행', function(t) { return t['대분류'] === '여행'; }, _brd.blue],
    ['식비', function(t) { return t['대분류'] === '식비'; }, '#5f5e5a'],
    ['옷', function(t) { return t['대분류'] === '품위유지비'; }, _brd.pink],
    ['물건', function(t) { return t['대분류'] === '생필품비'; }, _brd.amber],
    ['차', function(t) { return t['대분류'] === '교통비'; }, _brd.dark]
  ];
  var spTotal = sum(win, isSp) / N, used = 0;
  var spend = buckets.map(function(b) { var v = sum(win, function(t) { return isSp(t) && b[1](t); }) / N; used += v; return [b[0], v, b[2]]; });
  spend.push(['기타', spTotal - used, _brd.gray]);

  // 요일 × 3시간
  var heat = [0, 1, 2, 3, 4, 5, 6].map(function() { return [0, 0, 0, 0, 0, 0, 0, 0]; });
  var disc = function(t) { return ['품위유지비', '생필품비', '여가비', '여행'].indexOf(t['대분류']) >= 0 || ['외식비', '간식/카페', '배달'].indexOf(t['소분류']) >= 0; };
  win.forEach(function(t) {
    if (!(t['금액'] > 0) || !disc(t) || !t['시간'] || t['시간'] === '00:00:00') return;
    var wd = (new Date(t.date + 'T12:00:00').getDay() + 6) % 7;
    heat[wd][Math.floor(parseInt(t['시간'], 10) / 3)] += t['금액'];
  });

  var shop = win.filter(function(t) { return t['금액'] > 0 && (t['대분류'] === '품위유지비' || t['대분류'] === '생필품비'); })
    .map(function(t) { return t['금액']; }).sort(function(a, b) { return b - a; });
  var shopSum = shop.reduce(function(s, v) { return s + v; }, 0);
  var big = shop.filter(function(v) { return v >= 100000; });

  var byM = months.map(function(m) {
    var L = win.filter(function(t) { return t.date.slice(0, 7) === m; });
    return { m: m, inc: sum(L, isInc), sp: sum(L, isSp), salary: sum(L, function(t) { return isInc(t) && t['소분류'] === '월급'; }) };
  });
  var avgOf = function(L, k) { return L.reduce(function(s, x) { return s + x[k]; }, 0) / (L.length || 1); };
  var first = byM.slice(0, 3), last = byM.slice(-3);
  var avgLeft = inc.total - spTotal;

  // 집 상환 통장
  var pot = 0;
  ((_ledgerData.assets || {})['현금자산'] || []).forEach(function(it) {
    if ((it['소분류'] || '').indexOf(MIRROR_GOAL.potName) < 0) return;
    (it['월별'] || []).forEach(function(v) { if (v != null) pot = v; });
  });
  var left = Math.max(1, _brdMonths(cur, MIRROR_GOAL.due));
  var sal = byM.map(function(x) { return x.salary; }).sort(function(a, b) { return a - b; });
  var bonus = Math.max(0, sal[sal.length - 1] - sal[Math.floor(sal.length / 2)]);
  var delivery = sum(win, function(t) { return t['소분류'] === '배달'; }) / N;
  var levers = [
    ['ti-plane-off', '0원', '새 여행', trio.travel / N * left, _brd.blue],
    ['ti-package-off', _brdMan(MIRROR_PLAN.goodsCap) + '만', '물건 / 달', Math.max(0, trio.goods / N - MIRROR_PLAN.goodsCap) * left, _brd.amber],
    ['ti-shirt', _brdMan(MIRROR_PLAN.clothesCap) + '만', '옷 / 달', Math.max(0, trio.clothes / N - MIRROR_PLAN.clothesCap) * left, _brd.pink],
    ['ti-moped', '주 2번', '배달', delivery * MIRROR_PLAN.deliveryCut * left, _brd.violet],
    ['ti-gift', '통째로', '상여 → 집', bonus, _brd.green]
  ];
  var gain = levers.reduce(function(s, l) { return s + l[3]; }, 0);

  return { N: N, cur: cur, trio: trio, inc: inc, spend: spend, spTotal: spTotal, avgLeft: avgLeft, heat: heat,
           shop: shop, bigN: big.length, bigShare: shopSum ? big.reduce(function(s, v) { return s + v; }, 0) / shopSum : 0,
           first: { inc: avgOf(first, 'inc'), sp: avgOf(first, 'sp') }, last: { inc: avgOf(last, 'inc'), sp: avgOf(last, 'sp') },
           pot: pot, left: left, pace: pot + avgLeft * left, plan: pot + avgLeft * left + gain, levers: levers };
}

function _brdCss() {
  if (document.getElementById('ldg-board-css')) return;
  var s = document.createElement('style');
  s.id = 'ldg-board-css';
  s.textContent = [
    '#ldg-board{margin:0 0 28px}',
    '.lb-head{display:flex;align-items:center;justify-content:space-between;margin:0 0 10px}',
    '.lb-head h4{font-size:13px;font-weight:700;color:#0f172a;margin:0;display:flex;align-items:center;gap:6px}',
    '.lb-head span{font-size:11px;color:#94a3b8;font-weight:500}',
    '.lb-toggle{font-size:11px;color:#64748b;background:#f1f5f9;border:0;border-radius:999px;padding:4px 10px;cursor:pointer}',
    '.lb-grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:10px}',
    '.lb-c{background:#fff;border:1px solid #eef1f5;border-radius:14px;padding:14px 16px;min-width:0}',
    '.lb-t{font-size:11px;color:#94a3b8;margin:0 0 8px;display:flex;justify-content:space-between;gap:8px}',
    '.lb-n{font-variant-numeric:tabular-nums;font-weight:700;color:#0f172a;font-family:Manrope,Pretendard,sans-serif}',
    '.lb-bar{display:flex;height:10px;border-radius:5px;overflow:hidden;gap:2px}',
    '.lb-lg{display:flex;flex-wrap:wrap;gap:4px 12px;font-size:11px;color:#64748b;margin-top:8px}',
    '.lb-lg i{display:inline-block;width:8px;height:8px;border-radius:2px;margin-right:4px;vertical-align:0}',
    '.lb-tip{display:inline-flex;align-items:center;gap:4px;font-size:11px;color:#0f172a;background:#f0fdf4;border-radius:999px;padding:3px 9px;margin-top:8px}',
    '.lb-tip .material-symbols-outlined{font-size:14px;color:#1baf7a}',
    '.lb-act{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px;margin-top:10px}',
    '.lb-act div{background:#f8fafc;border-radius:10px;padding:8px 6px;text-align:center}',
    '.lb-act .material-symbols-outlined{font-size:18px}',
    '.lb-a{grid-column:span 5}.lb-b{grid-column:span 7}.lb-h{grid-column:span 5}.lb-d{grid-column:span 4}.lb-e{grid-column:span 3}.lb-f{grid-column:span 12}',
    '@media (max-width:1100px){.lb-a,.lb-b,.lb-h,.lb-d,.lb-e{grid-column:span 6}}',
    '@media (max-width:720px){.lb-a,.lb-b,.lb-h,.lb-d,.lb-e,.lb-f{grid-column:span 12}.lb-act{grid-template-columns:repeat(3,minmax(0,1fr))}}'
  ].join('\n');
  document.head.appendChild(s);
}

function ldgRenderBoard() {
  var el = document.getElementById('ldg-board');
  if (!el) return;
  var d = ldgBoardCompute();
  if (!d) { el.innerHTML = ''; return; }
  _brdCss();
  var C = _brd, T = MIRROR_GOAL.amount, M = _brdMan;
  var closed = false;
  try { closed = localStorage.getItem('atelier_ledger_board_closed') === '1'; } catch (e) {}
  var head = '<div class="lb-head"><h4><span class="material-symbols-outlined" style="font-size:18px;color:#6366f1">insights</span>돈 보드 <span>지난 ' + d.N + '달 · 뱅샐 기준, 매달 자동</span></h4>' +
    '<button class="lb-toggle" onclick="ldgToggleBoard()">' + (closed ? '펼치기' : '접기') + '</button></div>';
  if (closed) { el.innerHTML = head; return; }

  var trioSum = d.trio.travel + d.trio.clothes + d.trio.goods;
  var segs = function(list) { return list.map(function(s) { return '<div title="' + s[0] + ' ' + M(s[1]) + '만" style="flex:' + Math.max(s[1], 0) + ';background:' + s[2] + '"></div>'; }).join(''); };
  var legend = function(list) { return list.map(function(s) { return '<span><i style="background:' + s[2] + '"></i>' + s[0] + ' <b class="lb-n" style="font-weight:600">' + M(s[1]) + '</b></span>'; }).join(''); };

  // A. 셋 = 집
  var trio = [['여행', d.trio.travel, C.blue], ['옷', d.trio.clothes, C.pink], ['물건', d.trio.goods, C.amber]];
  var A = '<div class="lb-c lb-a"><p class="lb-t"><span>여행 + 옷 + 물건</span><span>정산 받은 돈 뺌</span></p>' +
    '<div style="display:flex;align-items:baseline;gap:8px;margin-bottom:8px"><span class="lb-n" style="font-size:24px;color:' + C.red + '">' + M(trioSum) + '만</span>' +
    '<span style="font-size:12px;color:#64748b">= 집 마지막 상환 <b class="lb-n">' + (trioSum / T).toFixed(2) + '배</b></span></div>' +
    '<div class="lb-bar">' + segs(trio) + '</div><div class="lb-lg">' + legend(trio) + '</div></div>';

  // B. 수입 vs 지출
  var Mx = Math.max(d.spTotal, d.inc.total);
  var incL = [['월급', d.inc.salary, C.blue], ['부업', d.inc.side, C.green], ['기타', d.inc.etc, '#7f77dd']];
  var B = '<div class="lb-c lb-b"><p class="lb-t"><span>한 달 · 들어온 돈 vs 나간 돈 (만)</span><span class="lb-n" style="color:' + (d.avgLeft < 0 ? C.red : C.green) + ';font-size:13px">' + (d.avgLeft < 0 ? '' : '+') + M(d.avgLeft) + ' / 달</span></p>' +
    '<div style="display:grid;grid-template-columns:28px 1fr 34px;gap:6px 8px;align-items:center;font-size:11px;color:#64748b">' +
    '<span>수입</span><div class="lb-bar" style="height:14px;width:' + (d.inc.total / Mx * 100) + '%">' + segs(incL) + '</div><span class="lb-n" style="text-align:right">' + M(d.inc.total) + '</span>' +
    '<span>지출</span><div class="lb-bar" style="height:14px;width:' + (d.spTotal / Mx * 100) + '%">' + segs(d.spend) + '</div><span class="lb-n" style="text-align:right">' + M(d.spTotal) + '</span></div>' +
    '<div class="lb-lg">' + legend(incL.concat(d.spend)) + '</div></div>';

  // C. 요일 × 시간
  var mx = 1, pk = [0, 0], dn = ['월', '화', '수', '목', '금', '토', '일'];
  d.heat.forEach(function(r, i) { r.forEach(function(v, j) { if (v > mx) { mx = v; pk = [i, j]; } }); });
  var hm = '<div style="display:grid;grid-template-columns:16px repeat(8,minmax(0,1fr));gap:2px;font-size:10px;color:#94a3b8"><span></span>' +
    [0, 3, 6, 9, 12, 15, 18, 21].map(function(t) { return '<span style="text-align:center">' + t + '</span>'; }).join('');
  d.heat.forEach(function(r, i) {
    hm += '<span style="' + (i === pk[0] ? 'color:' + C.red + ';font-weight:700' : '') + '">' + dn[i] + '</span>' + r.map(function(v, j) {
      var a = Math.min(1, v / mx);
      return '<div title="' + dn[i] + ' ' + j * 3 + '시 ' + M(v) + '만" style="height:14px;border-radius:3px;background:' + (v < 50000 ? '#f4f4f1' : 'rgba(42,120,214,' + (0.12 + a * 0.88).toFixed(2) + ')') + (i === pk[0] && j === pk[1] ? ';box-shadow:0 0 0 2px ' + C.red : '') + '"></div>';
    }).join('');
  });
  var H = '<div class="lb-c lb-h"><p class="lb-t"><span>언제 쓰나 · 요일 × 시간</span><span>여행 포함</span></p>' + hm + '</div>' +
    '<span class="lb-tip"><span class="material-symbols-outlined">bedtime</span>' + dn[pk[0]] + ' ' + pk[1] * 3 + '–' + (pk[1] * 3 + 3) + '시 결제는 하룻밤 재우기</span></div>';

  // D. 큰 결제 점
  var top = d.shop[0] || 1;
  var dots = d.shop.map(function(v) { var s = Math.max(3, Math.sqrt(v / top) * 18); return '<span title="' + M(v) + '만" style="width:' + s + 'px;height:' + s + 'px;border-radius:50%;background:' + (v >= 100000 ? C.red : '#d6d3cb') + '"></span>'; }).join('');
  var D = '<div class="lb-c lb-d"><p class="lb-t"><span>옷·물건 ' + d.shop.length + '건 · 크기 = 금액</span></p>' +
    '<div style="display:flex;flex-wrap:wrap;gap:2px;align-items:center;max-height:92px;overflow:hidden">' + dots + '</div>' +
    '<div style="display:flex;align-items:baseline;gap:6px;margin-top:8px;font-size:11px;color:#64748b"><span class="lb-n" style="font-size:18px;color:' + C.red + '">' + d.bigN + '건</span>10만↑이<span class="lb-n" style="font-size:18px;color:' + C.red + '">' + Math.round(d.bigShare * 100) + '%</span>금액</div>' +
    '<span class="lb-tip"><span class="material-symbols-outlined">hourglass_top</span>10만↑ 7일 뒤 결제</span></div>';

  // E. 추세
  var dSp = d.last.sp - d.first.sp, MM = Math.max(d.first.inc, d.first.sp, d.last.inc, d.last.sp) || 1;
  var tr = function(label, a, b, col) {
    return '<div style="display:grid;grid-template-columns:26px 1fr;gap:6px;align-items:center;font-size:11px;color:#64748b;margin:3px 0"><span>' + label + '</span><div>' +
      '<div style="height:6px;width:' + (a / MM * 100) + '%;background:#e2e8f0;border-radius:3px;margin-bottom:2px"></div><div style="height:6px;width:' + (b / MM * 100) + '%;background:' + col + ';border-radius:3px"></div></div></div>';
  };
  var E = '<div class="lb-c lb-e"><p class="lb-t"><span>첫 3달 → 최근 3달</span></p>' + tr('수입', d.first.inc, d.last.inc, C.blue) + tr('지출', d.first.sp, d.last.sp, dSp <= 0 ? C.green : C.red) +
    '<div style="margin-top:8px"><span class="lb-n" style="font-size:20px;color:' + (dSp <= 0 ? C.green : C.red) + '">' + (dSp <= 0 ? '' : '+') + M(dSp) + '만</span><div style="font-size:11px;color:#94a3b8">지출 변화 · 남는 돈 ' + M(d.last.inc - d.last.sp) + '</div></div></div>';

  // F. 4월까지 + 할 일
  var W = 640, Hh = 120, P = 28, maxY = Math.max(T, d.plan, d.pot) * 1.12;
  var x = function(i) { return P + i * (W - P - 40) / d.left; }, y = function(v) { return Hh - 16 - Math.max(0, v) / maxY * (Hh - 26); };
  var path = function(a, b) { var s = ''; for (var i = 0; i <= d.left; i++) s += (i ? 'L' : 'M') + x(i).toFixed(1) + ',' + y(a + (b - a) * i / d.left).toFixed(1); return s; };
  var mLabel = function(i) { var p = d.cur.split('-').map(Number); return (((p[1] - 1 + i) % 12) + 1) + '월'; };
  var svg = '<svg viewBox="0 0 ' + W + ' ' + Hh + '" style="width:100%;height:auto;display:block" role="img" aria-label="집 상환 통장 전망">' +
    '<line x1="' + P + '" x2="' + x(d.left) + '" y1="' + y(T) + '" y2="' + y(T) + '" stroke="#cbd5e1" stroke-dasharray="2 3"/>' +
    '<text x="' + P + '" y="' + (y(T) - 4) + '" font-size="10" fill="#94a3b8">목표 ' + M(T) + '만</text>' +
    '<path d="' + path(d.pot, d.pace) + '" fill="none" stroke="' + C.red + '" stroke-width="1.8" stroke-dasharray="5 4"/>' +
    '<path d="' + path(d.pot, d.plan) + '" fill="none" stroke="' + C.green + '" stroke-width="2.2"/>' +
    '<circle cx="' + x(d.left) + '" cy="' + y(d.plan) + '" r="4" fill="' + C.green + '"/><circle cx="' + x(d.left) + '" cy="' + y(d.pace) + '" r="3" fill="' + C.red + '"/>' +
    '<text x="' + (x(d.left) + 6) + '" y="' + (y(d.plan) + 4) + '" font-size="11" font-weight="700" fill="' + C.green + '">' + M(d.plan) + '</text>' +
    '<text x="' + (x(d.left) + 6) + '" y="' + (y(d.pace) + 4) + '" font-size="11" font-weight="700" fill="' + C.red + '">' + M(d.pace) + '</text>';
  for (var i = 0; i <= d.left; i++) svg += '<text x="' + x(i) + '" y="' + (Hh - 2) + '" text-anchor="middle" font-size="10" fill="#94a3b8">' + mLabel(i) + '</text>';
  svg += '</svg>';
  var icons = { 'ti-plane-off': 'flight_takeoff', 'ti-package-off': 'inventory_2', 'ti-shirt': 'checkroom', 'ti-moped': 'delivery_dining', 'ti-gift': 'redeem' };
  var acts = '<div class="lb-act">' + d.levers.map(function(l) {
    return '<div><span class="material-symbols-outlined" style="color:' + l[4] + '">' + icons[l[0]] + '</span>' +
      '<div class="lb-n" style="font-size:14px;margin-top:2px">' + l[1] + '</div><div style="font-size:10px;color:#94a3b8">' + l[2] + '</div>' +
      '<div class="lb-n" style="font-size:12px;color:' + C.green + ';margin-top:2px">+' + M(l[3]) + '</div></div>';
  }).join('') + '</div>';
  var F = '<div class="lb-c lb-f"><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:16px;align-items:center">' +
    '<div><p class="lb-t"><span>' + MIRROR_GOAL.label + ' 통장 · ' + MIRROR_GOAL.due.replace('-', '.') + '까지</span><span><b style="color:' + C.red + '">- -</b> 지금처럼 <b style="color:' + C.green + '">—</b> 5개 하면</span></p>' + svg + '</div>' +
    '<div><p class="lb-t" style="margin:0"><span>내일부터 5개</span><span>' + d.left + '달 효과 (만)</span></p>' + acts + '</div></div></div>';

  el.innerHTML = head + '<div class="lb-grid">' + A + B + H + D + E + F + '</div>';
}

function ldgToggleBoard() {
  try {
    var c = localStorage.getItem('atelier_ledger_board_closed') === '1';
    localStorage.setItem('atelier_ledger_board_closed', c ? '0' : '1');
  } catch (e) {}
  ldgRenderBoard();
}
window.ldgToggleBoard = ldgToggleBoard;

window.ldgRenderBoard = ldgRenderBoard;
window.ldgBoardCompute = ldgBoardCompute;

// 월별 뷰가 그려질 때마다 보드도 같이
(function() {
  var orig = window.ldgRenderMonthly;
  if (typeof orig !== 'function' || orig._withBoard) return;
  var wrapped = function() { var r = orig.apply(this, arguments); try { ldgRenderBoard(); } catch (e) { console.error('[Board]', e); } return r; };
  wrapped._withBoard = true;
  window.ldgRenderMonthly = wrapped;
})();
