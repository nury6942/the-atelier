// ===== DAILY LEDGER: 거울 탭 =====
// 뱅샐로 가져온 거래(출처:'뱅샐')만으로 계산한다. 숫자는 매달 가져올 때마다 저절로 바뀐다.
// 목표·초과 경고 대신, 쓴 돈을 '내 시간'과 '집 마감'으로 바꿔서 보여 준다.

var MIRROR_GOAL = { label: '집 마지막 상환', amount: 25000000, due: '2027-04', potName: 'OK파킹' };
var MIRROR_MISSION = { label: '쇼핑 15건 이하', limit: 15 };

var _mirShopRe = function(t) {
  return (t['대분류'] === '품위유지비') || (t['대분류'] === '생필품비' && t['소분류'] === '기타');
};

function _mirMonthsBetween(a, b) {
  var pa = a.split('-').map(Number), pb = b.split('-').map(Number);
  return (pb[0] * 12 + pb[1]) - (pa[0] * 12 + pa[1]);
}

function _mirWon(v) {
  var man = Math.round(Math.abs(v) / 10000);
  return (v < 0 ? '−' : '') + man.toLocaleString() + '만';
}

function ldgMirrorCompute() {
  var txs = (_ledgerData.transactions || []).filter(function(t) { return t['출처'] === '뱅샐' && t.date; });
  if (!txs.length) return null;
  var allMonths = Array.from(new Set(txs.map(function(t) { return t.date.slice(0, 7); }))).sort();
  // 처음 달과 이번 달은 반쪽이라 뺀다
  var months = allMonths.slice(1, -1);
  var cur = allMonths[allMonths.length - 1];
  var N = months.length || 1;
  var inWin = function(t) { return months.indexOf(t.date.slice(0, 7)) >= 0; };
  var win = txs.filter(inWin);
  var isSpend = function(t) { return t['대분류'] !== '수입' && t['대분류'] !== '저축'; };

  var byM = {};
  months.forEach(function(m) { byM[m] = { inc: 0, spend: 0, travel: 0, side: 0, salary: 0 }; });
  win.forEach(function(t) {
    var b = byM[t.date.slice(0, 7)], a = t['금액'] || 0;
    if (t['대분류'] === '수입') { b.inc += a; if (t['소분류'] === '부업') b.side += a; if (t['소분류'] === '월급') b.salary += a; }
    else if (isSpend(t)) { b.spend += a; if (t['대분류'] === '여행') b.travel += a; }
  });
  var series = months.map(function(m) { var b = byM[m]; return { m: m, left: b.inc - b.spend, side: b.side, salary: b.salary, travel: b.travel }; });
  var sum = function(f) { return series.reduce(function(s, x) { return s + f(x); }, 0); };
  var avgLeft = sum(function(x) { return x.left; }) / N;
  var salaries = series.map(function(x) { return x.salary; }).sort(function(a, b) { return a - b; });
  var medSalary = salaries[Math.floor(N / 2)] || 0;

  // 집 마감
  var pot = 0;
  var ad = _ledgerData.assets || {};
  (ad['현금자산'] || []).forEach(function(it) {
    if ((it['소분류'] || '').indexOf(MIRROR_GOAL.potName) < 0) return;
    (it['월별'] || []).forEach(function(v) { if (v != null) pot = v; });
  });
  var left = Math.max(1, _mirMonthsBetween(cur, MIRROR_GOAL.due));
  var projected = pot + avgLeft * left;
  var housePaid = win.filter(function(t) { return t['소분류'] === '집 상환'; }).reduce(function(s, t) { return s + t['금액']; }, 0);

  // 습관
  var count = function(re) { var r = win.filter(function(t) { return isSpend(t) && t['금액'] > 0 && re.test(t['세부사항'] || ''); }); return { n: r.length, sum: r.reduce(function(s, t) { return s + t['금액']; }, 0) }; };
  var musinsa = count(/무신사|29cm|이십구/i);
  var baemin = count(/우아한형제들|배달의민족|배민/);
  var webnovel = count(/리디|소풍|시리즈|봄툰|레진/);
  var cancels = win.filter(function(t) { return isSpend(t) && t['금액'] < 0; }).length;
  var small = win.filter(function(t) { return isSpend(t) && t['금액'] > 0 && t['금액'] <= 20000; });
  var shop = win.filter(function(t) { return isSpend(t) && t['금액'] > 0 && _mirShopRe(t); });
  var shopDays = {};
  shop.forEach(function(t) { shopDays[t.date] = (shopDays[t.date] || 0) + 1; });
  var binge = Object.keys(shopDays).filter(function(d) { return shopDays[d] >= 3; }).length;
  var shopMonthly = shop.reduce(function(s, t) { return s + t['금액']; }, 0) / N;
  var subs = win.filter(function(t) { return t['대분류'] === '고정비' && t['소분류'] === '정기구독'; });
  var claudeNames = Array.from(new Set(subs.filter(function(t) { return /anthropic|claude/i.test(t['세부사항'] || ''); }).map(function(t) { return (t['세부사항'] || '').trim(); })));

  // 이번 달 미션
  var curShop = txs.filter(function(t) { return t.date.slice(0, 7) === cur && t['금액'] > 0 && _mirShopRe(t); }).length;
  var today = new Date();
  var curDay = Math.min(today.getDate(), new Date(+cur.slice(0, 4), +cur.slice(5, 7), 0).getDate());

  // 메우는 방법 (마감까지 남은 달 기준)
  var sideFirst = series.slice(0, 3).reduce(function(s, x) { return s + x.side; }, 0) / 3;
  var sideLast = series.slice(-3).reduce(function(s, x) { return s + x.side; }, 0) / 3;
  var sideSlope = Math.max(0, (sideLast - sideFirst) / Math.max(1, N - 3));
  var levers = [
    ['여행 ' + left + '달 쉬기', sum(function(x) { return x.travel; }) / N * left, '#2a78d6'],
    ['상여 (작년 최고 달 기준)', Math.max(0, salaries[N - 1] - medSalary), '#2a78d6'],
    ['포스타입 지금 추세 유지', sideSlope * left * (left + 1) / 2, '#1baf7a'],
    ['무신사·29CM 반으로', musinsa.sum / N / 2 * left, '#eda100'],
    ['배민 반으로', baemin.sum / N / 2 * left, '#eda100']
  ];

  return {
    months: series, N: N, cur: cur, avgLeft: avgLeft,
    reds: series.filter(function(x) { return x.left < 0; }).length,
    goal: { pot: pot, left: left, projected: projected, gap: MIRROR_GOAL.amount - projected,
            need: (MIRROR_GOAL.amount - pot) / left, housePaid: housePaid },
    netSaved: sum(function(x) { return x.left; }),
    sideLast: series.length ? series[series.length - 1].side : 0,
    sideAvg: sum(function(x) { return x.side; }) / N,
    shopMonthly: shopMonthly, workDays: medSalary ? shopMonthly / (medSalary / 22) : 0,
    musinsa: musinsa, baemin: baemin, webnovel: webnovel, cancels: cancels,
    small: { n: small.length / N, sum: small.reduce(function(s, t) { return s + t['금액']; }, 0) / N },
    binge: binge, subsMonthly: subs.reduce(function(s, t) { return s + t['금액']; }, 0) / N, claudeNames: claudeNames,
    mission: { done: curShop, limit: MIRROR_MISSION.limit, day: curDay },
    levers: levers
  };
}

function ldgRenderMirror() {
  var el = document.getElementById('ldg-mirror');
  if (!el) return;
  var d = ldgMirrorCompute();
  if (!d) { el.innerHTML = '<p style="color:#94a3b8;font-size:14px">뱅샐에서 가져온 거래가 아직 없어요.</p>'; return; }
  var RED = '#e34948', BLUE = '#2a78d6', INK = '#0f172a', SUB = '#64748b', MUTE = '#94a3b8', LINE = '#e2e8f0';
  var card = 'background:#f8fafc;border-radius:16px;padding:20px 22px;';
  var lb = 'font-size:13px;color:' + SUB + ';margin:0 0 10px;';
  var big = 'font-size:30px;font-weight:700;margin:0;color:' + INK + ';font-variant-numeric:tabular-nums;font-family:Manrope,Pretendard,sans-serif;';
  var one = 'font-size:13px;color:' + SUB + ';margin:6px 0 0;';
  var g = d.goal, T = MIRROR_GOAL.amount;
  var pct = function(v) { return Math.max(0, Math.min(100, v / T * 100)).toFixed(1) + '%'; };

  var dots = d.months.map(function(x) {
    var s = 10 + Math.min(Math.abs(x.left), 4600000) / 4600000 * 16;
    return '<span title="' + x.m + ' ' + _mirWon(x.left) + '" style="display:inline-block;width:' + s + 'px;height:' + s + 'px;border-radius:50%;background:' + (x.left < 0 ? RED : BLUE) + '"></span>';
  }).join('');

  var habit = function(label, value, line, color) {
    return '<div style="' + card + '"><p style="' + lb + '">' + label + '</p><p style="' + big + (color ? 'color:' + color + ';' : '') + '">' + value + '</p><p style="' + one + '">' + line + '</p></div>';
  };

  var acc = 0, need = Math.max(g.gap, 1);
  var leverRows = d.levers.map(function(l) {
    var s = acc; acc += l[1];
    return '<div style="display:flex;align-items:center;gap:10px;font-size:13px;color:' + SUB + ';margin:7px 0">' +
      '<span style="width:170px;flex-shrink:0">' + l[0] + '</span>' +
      '<div style="flex:1;position:relative;height:14px"><div style="position:absolute;left:' + Math.min(100, s / need * 100) + '%;width:' + Math.min(100 - Math.min(100, s / need * 100), l[1] / need * 100) + '%;height:14px;background:' + l[2] + ';border-radius:3px"></div></div>' +
      '<span style="width:64px;text-align:right">+' + _mirWon(l[1]) + '</span></div>';
  }).join('');

  var mission = '';
  for (var i = 0; i < d.mission.limit; i++) mission += '<div style="flex:1;height:18px;border-radius:3px;background:' + (i < d.mission.done ? RED : LINE) + '"></div>';
  var over = d.mission.done - d.mission.limit;
  var missionLine = over > 0 ? d.mission.day + '일 만에 ' + d.mission.done + '건. 이미 ' + over + '건 넘었어요.'
    : d.mission.day + '일 만에 ' + d.mission.done + '건. 남은 기간 ' + (d.mission.limit - d.mission.done) + '건.';

  var days = '';
  for (var k = 0; k < 22; k++) days += '<div style="aspect-ratio:1;border-radius:3px;background:' + (k < Math.round(d.workDays) ? RED : LINE) + '"></div>';

  el.innerHTML =
    '<div style="' + card + 'padding:28px 24px;margin-bottom:14px">' +
      '<p style="' + lb + '">🏠 ' + MIRROR_GOAL.due.replace('-', '년 ') + '월, ' + MIRROR_GOAL.label + ' ' + _mirWon(T) + '</p>' +
      '<div style="position:relative;height:28px;background:' + LINE + ';border-radius:8px;overflow:hidden">' +
        '<div style="position:absolute;left:0;top:0;bottom:0;width:' + pct(g.pot) + ';background:' + BLUE + '"></div>' +
        (g.projected < g.pot ? '<div style="position:absolute;left:' + pct(g.projected) + ';top:0;bottom:0;width:' + pct(g.pot - g.projected) + ';background:repeating-linear-gradient(135deg,' + RED + ' 0 4px,transparent 4px 8px)"></div>' : '') +
      '</div>' +
      '<div style="display:flex;justify-content:space-between;font-size:12px;color:' + MUTE + ';margin-top:6px"><span>지금 통장 ' + _mirWon(g.pot) + '</span><span>' + g.left + '달 뒤 예상 ' + _mirWon(g.projected) + '</span><span>' + _mirWon(T) + '</span></div>' +
      '<p style="font-family:Georgia,\'Noto Serif KR\',serif;font-size:56px;line-height:1.1;margin:18px 0 0;color:' + (g.gap > 0 ? RED : BLUE) + ';font-variant-numeric:tabular-nums">' + (g.gap > 0 ? '−' + _mirWon(g.gap).replace('−', '') : '+' + _mirWon(-g.gap)) + '</p>' +
      '<p style="' + one + 'font-size:14px">' + (g.gap > 0 ? '지금처럼 쓰면 마감 날 이만큼 모자라요. 매달 ' + _mirWon(d.avgLeft) + ' → <b style="color:' + INK + '">+' + _mirWon(g.need) + '</b>이 돼야 해요.' : '지금 페이스면 마감 전에 다 모여요.') + '</p>' +
    '</div>' +

    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px;margin-bottom:14px">' +
      '<div style="' + card + '"><p style="' + lb + '">지난 ' + d.N + '달, 매달 남은 돈</p><div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">' + dots + '</div><p style="' + one + '">' + d.N + '달 중 ' + d.reds + '달이 빨간 달 · 평균 ' + _mirWon(d.avgLeft) + '</p></div>' +
      '<div style="' + card + '"><p style="' + lb + '">집에 넣은 돈 vs 새로 모은 돈</p>' +
        '<div style="display:flex;align-items:center;gap:8px;font-size:13px;color:' + SUB + ';margin:6px 0"><span style="width:72px">집 상환</span><div style="height:12px;width:55%;background:' + BLUE + ';border-radius:0 4px 4px 0"></div><span>+' + _mirWon(g.housePaid) + '</span></div>' +
        '<div style="display:flex;align-items:center;gap:8px;font-size:13px;color:' + SUB + ';margin:6px 0"><span style="width:72px">새로 모은 돈</span><div style="height:12px;width:' + Math.max(4, Math.min(55, Math.abs(d.netSaved) / Math.max(g.housePaid, 1) * 55)) + '%;background:' + (d.netSaved < 0 ? RED : BLUE) + ';border-radius:0 4px 4px 0"></div><span>' + (d.netSaved < 0 ? '' : '+') + _mirWon(d.netSaved) + '</span></div>' +
        '<p style="' + one + '">' + (d.netSaved < 0 ? '모아 둔 돈을 집으로 옮긴 것, 새로 불어난 돈은 없음' : '집도 갚고 돈도 모았어요') + '</p></div>' +
    '</div>' +

    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px;margin-bottom:14px">' +
      '<div style="' + card + '"><p style="' + lb + '">⏱ 쇼핑 월 ' + _mirWon(d.shopMonthly) + '은</p><div style="display:grid;grid-template-columns:repeat(11,1fr);gap:4px">' + days + '</div><p style="font-size:15px;margin:10px 0 0;color:' + INK + '">회사에서 <b>' + Math.round(d.workDays) + '일</b> 일한 돈</p></div>' +
      '<div style="' + card + '"><p style="' + lb + '">✍️ 포스타입으로 번 돈 vs 쇼핑</p>' +
        '<div style="display:flex;align-items:center;gap:8px;font-size:13px;color:' + SUB + ';margin:6px 0"><span style="width:56px">포스타입</span><div style="height:14px;width:' + Math.min(80, d.sideAvg / Math.max(d.sideAvg, d.shopMonthly) * 80) + '%;background:#1baf7a;border-radius:0 4px 4px 0"></div><span style="white-space:nowrap">' + _mirWon(d.sideAvg) + '</span></div>' +
        '<div style="display:flex;align-items:center;gap:8px;font-size:13px;color:' + SUB + ';margin:6px 0"><span style="width:56px">쇼핑</span><div style="height:14px;width:' + Math.min(80, d.shopMonthly / Math.max(d.sideAvg, d.shopMonthly) * 80) + '%;background:' + RED + ';border-radius:0 4px 4px 0"></div><span style="white-space:nowrap">' + _mirWon(d.shopMonthly) + '</span></div>' +
        '<p style="font-size:15px;margin:10px 0 0;color:' + INK + '">' + (d.shopMonthly > d.sideAvg ? '밤에 쓴 글값이 전부 택배로' : '글값이 쇼핑보다 커요') + '</p></div>' +
    '</div>' +

    '<p style="font-size:13px;color:' + SUB + ';margin:22px 0 10px">쓸데없는 소비는 없다고 했죠. ' + d.N + '달 동안 이랬어요.</p>' +
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px;margin-bottom:14px">' +
      habit('무신사 · 29CM', d.musinsa.n + '번', _mirWon(d.musinsa.sum) + ' · 한 달에 ' + _mirWon(d.musinsa.sum / d.N)) +
      habit('배민', d.baemin.n + '번', (d.baemin.n ? (d.N * 30 / d.baemin.n).toFixed(1) + '일에 한 번 · ' : '') + _mirWon(d.baemin.sum)) +
      habit('결제하고 취소·반품', d.cancels + '번', '일주일에 ' + (d.cancels / (d.N * 4.3)).toFixed(1) + '번 마음이 바뀜', RED) +
      habit('하루에 쇼핑 3건 이상', d.binge + '일', '한 달에 ' + (d.binge / d.N).toFixed(1) + '번은 폭주한 날') +
      habit('2만 원 이하 결제', Math.round(d.small.n) + '번', '한 달에 · 모으면 ' + _mirWon(d.small.sum)) +
      habit('리디 · 소풍', d.webnovel.n + '번', '한 편씩 · 합치면 ' + _mirWon(d.webnovel.sum)) +
      habit('구독', _mirWon(d.subsMonthly), (d.claudeNames.length > 1 ? 'Claude 이름이 ' + d.claudeNames.length + '개' : '한 달에')) +
    '</div>' +

    '<div style="' + card + 'margin-bottom:14px"><p style="' + lb + '">🪜 ' + _mirWon(Math.max(g.gap, 0)).replace('−', '') + '을 ' + g.left + '달 동안 메우려면</p>' + leverRows +
      '<div style="display:flex;justify-content:space-between;font-size:12px;color:' + MUTE + ';border-top:1px solid ' + LINE + ';padding-top:8px;margin-top:10px"><span>합계 ' + _mirWon(acc) + '</span><span>' + (acc >= g.gap ? '다 메워져요' : '남는 차이 ' + _mirWon(g.gap - acc)) + '</span></div></div>' +

    '<div style="background:#fff;border:2px solid #c7d2fe;border-radius:16px;padding:20px 22px">' +
      '<p style="' + lb + 'color:#4f46e5">🎯 ' + (+d.cur.slice(5)) + '월 미션 하나</p>' +
      '<p style="font-size:18px;font-weight:700;margin:0 0 12px;color:' + INK + '">' + MIRROR_MISSION.label + '</p>' +
      '<div style="display:flex;gap:4px">' + mission + '</div>' +
      '<p style="font-size:14px;margin:10px 0 0;color:' + (d.mission.done >= d.mission.limit ? RED : SUB) + '">' + missionLine + '</p>' +
    '</div>';
}
window.ldgRenderMirror = ldgRenderMirror;
window.ldgMirrorCompute = ldgMirrorCompute;
