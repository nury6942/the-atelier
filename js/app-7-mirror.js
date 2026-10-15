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

function ldgRenderBoard() {
  var el = document.getElementById('ldg-board');
  if (!el) return;
  var d = ldgBoardCompute();
  if (!d) { el.innerHTML = ''; return; }
  var C = _brd, T = MIRROR_GOAL.amount;
  var card = 'background:' + C.card + ';border-radius:16px;padding:20px;';
  var cap = 'font-size:12px;color:' + C.mute + ';margin:0 0 12px;';
  var num = 'font-variant-numeric:tabular-nums;font-weight:600;';
  var chip = function(icon, text) { return '<div style="display:inline-flex;align-items:center;gap:6px;font-size:12px;background:#fff;border:1px solid ' + C.line + ';border-radius:999px;padding:5px 12px;margin-top:12px;color:' + C.ink + '"><span class="material-symbols-outlined" style="font-size:16px;color:' + C.green + '">' + icon + '</span>' + text + '</div>'; };
  var trioSum = d.trio.travel + d.trio.clothes + d.trio.goods;

  // 1. 셋 = 집
  var tile = function(flex, bg, icon, val, sub2) {
    return '<div style="flex:' + flex + ';background:' + bg + ';border-radius:12px;padding:12px;color:#fff;display:flex;flex-direction:column;justify-content:space-between;min-width:0">' +
      '<span class="material-symbols-outlined" style="font-size:22px">' + icon + '</span><div><span style="' + num + 'font-size:' + (sub2 ? 28 : 19) + 'px;display:block">' + val + '</span>' + (sub2 ? '<span style="font-size:12px;opacity:.9">' + sub2 + '</span>' : '') + '</div></div>';
  };
  var op = function(s) { return '<div style="display:flex;align-items:center;color:' + C.mute + '">' + s + '</div>'; };
  var h = '<div style="' + card + 'margin-bottom:12px"><p style="' + cap + '">지난 ' + d.N + '달 · 이 셋에 쓴 돈 (정산 받은 돈은 뺌)</p><div style="display:flex;gap:8px;height:140px">' +
    tile(d.trio.travel, C.blue, 'flight', _brdMan(d.trio.travel) + '만') + op('+') +
    tile(d.trio.clothes, C.pink, 'checkroom', _brdMan(d.trio.clothes) + '만') + op('+') +
    tile(d.trio.goods, C.amber, 'devices', _brdMan(d.trio.goods) + '만') + op('=') +
    tile(trioSum * 0.48, C.red, 'home', _brdMan(trioSum) + '만', MIRROR_GOAL.label + ' ' + _brdMan(T) + '만의 ' + (trioSum / T).toFixed(2) + '배') +
    '</div></div>';

  // 2. 들어온 돈 vs 나간 돈
  var seg = function(v, bg, label) { return '<div style="flex:' + Math.max(v, 0) + ';background:' + bg + ';height:100%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;overflow:hidden;white-space:nowrap">' + (v > 40000 * 10 ? label : '') + '</div>'; };
  var incW = Math.min(100, d.inc.total / Math.max(d.spTotal, d.inc.total) * 100);
  h += '<div style="' + card + 'margin-bottom:12px"><p style="' + cap + '">한 달 · 들어온 돈 vs 나간 돈 (만)</p>' +
    '<div style="display:grid;grid-template-columns:40px 1fr;gap:8px 10px;align-items:center;font-size:12px;color:' + C.sub + '">' +
    '<span>수입</span><div style="height:34px;display:flex;border-radius:6px;overflow:hidden;width:' + incW + '%">' +
      seg(d.inc.salary, C.blue, '월급 ' + _brdMan(d.inc.salary)) + seg(d.inc.side, C.green, '부업 ' + _brdMan(d.inc.side)) + seg(d.inc.etc, '#7f77dd', _brdMan(d.inc.etc)) + '</div>' +
    '<span>지출</span><div style="height:34px;display:flex;border-radius:6px;overflow:hidden;width:' + Math.min(100, d.spTotal / Math.max(d.spTotal, d.inc.total) * 100) + '%">' +
      d.spend.map(function(s) { return seg(s[1], s[2], s[0] + ' ' + _brdMan(s[1])); }).join('') + '</div></div>' +
    (d.avgLeft < 0 ? '<div style="position:relative;height:18px;margin-left:50px"><div style="position:absolute;left:' + incW + '%;right:0;top:5px;height:8px;background:repeating-linear-gradient(135deg,' + C.red + ' 0 4px,transparent 4px 8px);border-radius:2px"></div><span style="position:absolute;right:0;top:-1px;font-size:12px;color:' + C.red + ';background:' + C.card + ';padding-left:4px;' + num + '">' + _brdMan(d.avgLeft) + '</span></div>' : '') +
    '</div>';

  // 3. 요일 × 시간
  var mx = 1, pk = [0, 0];
  d.heat.forEach(function(r, i) { r.forEach(function(v, j) { if (v > mx) { mx = v; pk = [i, j]; } }); });
  var dn = ['월', '화', '수', '목', '금', '토', '일'];
  var hm = '<div style="display:grid;grid-template-columns:24px repeat(8,1fr);gap:3px;font-size:11px;color:' + C.mute + '"><span></span>' +
    [0, 3, 6, 9, 12, 15, 18, 21].map(function(t) { return '<span style="text-align:center">' + t + '시</span>'; }).join('');
  d.heat.forEach(function(r, i) {
    hm += '<span style="align-self:center;' + (i === pk[0] ? 'color:' + C.red + ';font-weight:600' : '') + '">' + dn[i] + '</span>' + r.map(function(v, j) {
      var a = Math.min(1, v / mx), man = Math.round(v / 10000);
      return '<div title="' + dn[i] + ' ' + j * 3 + '시 ' + man + '만" style="height:30px;border-radius:5px;background:' + (man < 5 ? '#f1efe8' : 'rgba(42,120,214,' + (0.1 + a * 0.9) + ')') + ';' + (i === pk[0] && j === pk[1] ? 'outline:2px solid ' + C.red + ';outline-offset:-1px;' : '') + 'display:flex;align-items:center;justify-content:center;color:' + (a > 0.5 ? '#fff' : C.mute) + ';font-size:10px">' + (a > 0.3 ? man : '') + '</div>';
    }).join('');
  });
  hm += '</div>';
  h += '<div style="' + card + 'margin-bottom:12px"><p style="' + cap + '">언제 쓰나 · 요일 × 시간 (여행 포함, 만)</p>' + hm +
    chip('lock', dn[pk[0]] + '요일 ' + pk[1] * 3 + '–' + (pk[1] * 3 + 3) + '시가 제일 위험 · 그 시간 결제는 하룻밤 재우기') + '</div>';

  // 4. 큰 결제 점 + 추세
  var top = d.shop[0] || 1;
  var dots = d.shop.map(function(v) { var s = Math.max(4, Math.sqrt(v / top) * 32); return '<span title="' + _brdMan(v) + '만" style="width:' + s + 'px;height:' + s + 'px;border-radius:50%;background:' + (v >= 100000 ? C.red : C.gray) + ';display:inline-block"></span>'; }).join('');
  var bar = function(label, a, b, colB) {
    var M = Math.max(d.first.inc, d.first.sp, d.last.inc, d.last.sp) || 1;
    return '<div style="display:grid;grid-template-columns:34px 1fr 44px;gap:6px;align-items:center;font-size:12px;color:' + C.sub + ';margin:4px 0"><span>' + label + '</span><div><div style="height:10px;width:' + (a / M * 100) + '%;background:' + C.gray + ';border-radius:0 3px 3px 0;margin-bottom:3px"></div><div style="height:10px;width:' + (b / M * 100) + '%;background:' + colB + ';border-radius:0 3px 3px 0"></div></div><span style="' + num + 'text-align:right">' + _brdMan(b) + '</span></div>';
  };
  var dSp = d.last.sp - d.first.sp;
  h += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:12px;margin-bottom:12px">' +
    '<div style="' + card + '"><p style="' + cap + '">옷·물건 ' + d.shop.length + '건 · 점 크기 = 금액</p><div style="display:flex;flex-wrap:wrap;gap:3px;align-items:center">' + dots + '</div>' +
      '<div style="display:flex;gap:14px;margin-top:12px;align-items:baseline"><span style="' + num + 'font-size:28px;color:' + C.red + '">' + d.bigN + '건</span><span style="font-size:12px;color:' + C.mute + '">10만↑</span><span style="' + num + 'font-size:28px;margin-left:auto;color:' + C.red + '">' + Math.round(d.bigShare * 100) + '%</span><span style="font-size:12px;color:' + C.mute + '">금액</span></div>' +
      chip('hourglass_top', '10만 원↑은 7일 뒤 결제') + '</div>' +
    '<div style="' + card + '"><p style="' + cap + '">첫 3달 (회색) → 최근 3달 · 월평균 (만)</p>' + bar('수입', d.first.inc, d.last.inc, C.blue) + bar('지출', d.first.sp, d.last.sp, dSp <= 0 ? C.green : C.red) +
      '<div style="display:flex;align-items:baseline;gap:8px;margin-top:12px"><span style="' + num + 'font-size:28px;color:' + (dSp <= 0 ? C.green : C.red) + '">' + (dSp <= 0 ? '' : '+') + _brdMan(dSp) + '</span><span style="font-size:12px;color:' + C.mute + '">지출 변화 · 지금 남는 돈 ' + _brdMan(d.last.inc - d.last.sp) + '</span></div></div>' +
    '</div>';

  // 5. 4월까지 선 (SVG)
  var W = 600, H = 180, P = 34, maxY = Math.max(T, d.plan, d.pot) * 1.1;
  var x = function(i) { return P + i * (W - P - 10) / d.left; }, y = function(v) { return H - 20 - Math.max(0, v) / maxY * (H - 40); };
  var path = function(a, b) { var s = ''; for (var i = 0; i <= d.left; i++) s += (i ? 'L' : 'M') + x(i).toFixed(1) + ',' + y(a + (b - a) * i / d.left).toFixed(1); return s; };
  var mLabel = function(i) { var p = d.cur.split('-').map(Number), k = p[1] - 1 + i; return ((k % 12) + 1) + '월'; };
  var svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;height:auto" role="img" aria-label="집 상환 통장 전망">' +
    '<line x1="' + P + '" x2="' + (W - 10) + '" y1="' + y(T) + '" y2="' + y(T) + '" stroke="' + C.mute + '" stroke-dasharray="2 3"/>' +
    '<text x="' + (W - 12) + '" y="' + (y(T) - 6) + '" text-anchor="end" font-size="11" fill="' + C.mute + '">' + _brdMan(T) + '만</text>' +
    '<path d="' + path(d.pot, d.pace) + '" fill="none" stroke="' + C.red + '" stroke-width="2" stroke-dasharray="6 4"/>' +
    '<path d="' + path(d.pot, d.plan) + '" fill="none" stroke="' + C.green + '" stroke-width="2.5"/>' +
    '<circle cx="' + x(d.left) + '" cy="' + y(d.plan) + '" r="5" fill="' + C.green + '"/>' +
    '<text x="' + (x(d.left) - 8) + '" y="' + (y(d.plan) - 10) + '" text-anchor="end" font-size="12" font-weight="600" fill="' + C.green + '">' + _brdMan(d.plan) + '만</text>' +
    '<text x="' + (x(d.left) - 8) + '" y="' + (y(d.pace) + 16) + '" text-anchor="end" font-size="12" font-weight="600" fill="' + C.red + '">' + _brdMan(d.pace) + '만</text>';
  for (var i = 0; i <= d.left; i++) svg += '<text x="' + x(i) + '" y="' + (H - 4) + '" text-anchor="middle" font-size="11" fill="' + C.mute + '">' + mLabel(i) + '</text>';
  svg += '</svg>';
  h += '<div style="' + card + 'margin-bottom:12px"><p style="' + cap + '">' + MIRROR_GOAL.label + ' 통장 · ' + MIRROR_GOAL.due.replace('-', '년 ') + '월까지 <span style="color:' + C.red + '">— 지금처럼</span> <span style="color:' + C.green + '">— 아래 5개 하면</span></p>' + svg + '</div>';

  // 6. 할 일 5개
  h += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(112px,1fr));gap:10px;margin-bottom:28px">' + d.levers.map(function(l) {
    var icon = { 'ti-plane-off': 'flight_takeoff', 'ti-package-off': 'inventory_2', 'ti-shirt': 'checkroom', 'ti-moped': 'delivery_dining', 'ti-gift': 'redeem' }[l[0]];
    return '<div style="' + card + 'padding:14px;text-align:center"><span class="material-symbols-outlined" style="font-size:24px;color:' + l[4] + '">' + icon + '</span>' +
      '<p style="' + num + 'font-size:20px;margin:6px 0 2px;color:' + C.ink + '">' + l[1] + '</p><p style="font-size:11px;color:' + C.mute + ';margin:0">' + l[2] + '</p>' +
      '<p style="' + num + 'font-size:13px;color:' + C.green + ';margin:6px 0 0">+' + _brdMan(l[3]) + '</p></div>';
  }).join('') + '</div>';

  el.innerHTML = h;
}
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
