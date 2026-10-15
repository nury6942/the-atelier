// ===== DAILY LEDGER: 월별 전략 보드 =====
// 위에서 고른 달(_ldgYear/_ldgMonth)에 맞춰 다시 그린다. 기존 KPI·도넛·TOP·카테고리 집계·일별 추이를 대신한다.
// 큰 그림(집 마감 · 그달 판정 · 나의 규칙) → 세부(봉투 5개 · 큰 결제 · 어디에 썼나) → 나라는 사람(지난 달들로 본 성향).

var MIRROR_GOAL = { label: '집 마지막 상환', amount: 25000000, due: '2027-04', potName: 'OK파킹' };
var MIRROR_ENVELOPES = [
  // [이름, 아이콘, 고르는 법, 한도(원) 또는 횟수, 단위]
  ['여행', 'flight', function(t) { return t['대분류'] === '여행'; }, 0, '원'],
  ['옷·뷰티', 'checkroom', function(t) { return t['대분류'] === '품위유지비'; }, 300000, '원'],
  ['물건', 'inventory_2', function(t) { return t['대분류'] === '생필품비'; }, 200000, '원'],
  ['배달', 'delivery_dining', function(t) { return t['소분류'] === '배달'; }, 8, '회'],
  ['가족·선물', 'redeem', function(t) { return t['대분류'] === '관계비' || t['대분류'] === '경조사비'; }, 350000, '원']
];
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

var _bS = function(t) { return t['대분류'] !== '수입' && t['대분류'] !== '저축'; };
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

function ldgBoardMonth(ym) {
  var L = (_ledgerData.transactions || []).filter(function(t) { return t.date && t.date.slice(0, 7) === ym; });
  var sp = L.filter(_bS);
  var spend = _bSum(sp, function() { return true; });
  var inc = _bSum(L, _bI);
  var salary = _bSum(L, function(t) { return _bI(t) && t['소분류'] === '월급'; });
  var side = _bSum(L, function(t) { return _bI(t) && t['소분류'] === '부업'; });
  var buckets = MIRROR_BUCKETS.map(function() { return 0; });
  sp.forEach(function(t) { buckets[_bBucket(t)] += t['금액'] || 0; });
  var envs = MIRROR_ENVELOPES.map(function(e) {
    var rows = sp.filter(e[2]);
    var val = e[4] === '회' ? rows.filter(function(t) { return t['금액'] > 0; }).length : _bSum(rows, function() { return true; });
    var tops = {};
    rows.forEach(function(t) { var k = (t['세부사항'] || '').split(' · ').pop().replace(/\(주\)|㈜|주식회사|\(.*?\)/g, '').trim().slice(0, 12); tops[k] = (tops[k] || 0) + t['금액']; });
    var top = Object.keys(tops).sort(function(a, b) { return tops[b] - tops[a]; }).slice(0, 2).map(function(k) { return k + ' ' + _bMan(tops[k]); });
    return { name: e[0], icon: e[1], val: val, cap: e[3], unit: e[4], money: _bSum(rows, function() { return true; }), top: top };
  });
  var bigs = sp.filter(function(t) { return t['금액'] >= 100000; }).sort(function(a, b) { return b['금액'] - a['금액']; });
  var perDay = {};
  sp.forEach(function(t) { if (t['금액'] > 0 && ['품위유지비', '생필품비', '여가비'].indexOf(t['대분류']) >= 0) perDay[t.date] = (perDay[t.date] || 0) + 1; });
  return { L: L, spend: spend, inc: inc, salary: salary, side: side, left: inc - spend, buckets: buckets, envs: envs, bigs: bigs,
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

var _boardShowAllBig = false;

function ldgRenderBoard() {
  var el = document.getElementById('ldg-board');
  if (!el || typeof _ldgYear === 'undefined') return;
  _boardCss();
  var ym = _ldgYear + '-' + String(_ldgMonth).padStart(2, '0');
  var mk = _ldgMonth + '월';
  var m = ldgBoardMonth(ym), b = ldgBoardBaseline();
  if (!m.L.length) { el.innerHTML = '<div class="lb-c" style="color:#94a3b8;font-size:13px">' + mk + '에는 거래가 아직 없어요.</div>'; return; }
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
      '<div style="font-size:11px;color:#64748b">매달 <b class="lb-n">+' + _bMan(need) + '만</b>씩 모여야 해요</div></div>' +
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

  // ── 봉투 5개
  h += '<div class="lb-c" style="margin-bottom:10px"><p class="lb-t"><span>' + mk + ' 봉투 · 쓴 돈 / 한도</span><span>빨강 = 넘침</span></p><div class="lb-env">' +
    m.envs.map(function(e) {
      var over = e.cap === 0 ? e.val > 0 : e.val > e.cap, pct = e.cap ? Math.min(100, e.val / e.cap * 100) : (e.val > 0 ? 100 : 0);
      var col = over ? RED : (pct >= 80 ? '#eda100' : GREEN);
      var fmt = e.unit === '회' ? e.val + ' / ' + e.cap + '회' : _bMan(e.val) + ' / ' + _bMan(e.cap) + '만';
      return '<div><div style="font-size:12px;display:flex;justify-content:space-between;gap:6px"><span><span class="material-symbols-outlined" style="font-size:15px;vertical-align:-3px;color:#64748b">' + e.icon + '</span> ' + e.name + '</span><b class="lb-n" style="color:' + (over ? RED : '#0f172a') + '">' + fmt + '</b></div>' +
        '<div class="lb-bar"><div style="width:' + pct + '%;height:100%;background:' + col + '"></div></div>' +
        '<div class="lb-ms" title="' + _bEsc(e.top.join(' · ')) + '">' + (e.unit === '회' ? _bMan(e.money) + '만' : (_bEsc(e.top.join(' · ')) || '없음')) + '</div></div>';
    }).join('') + '</div></div>';

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
    return '<div style="display:grid;grid-template-columns:60px minmax(0,1fr) 40px;gap:8px;align-items:center;font-size:12px;margin:5px 0"><span style="color:#64748b">' + bk[0] + '</span>' +
      '<div style="position:relative;height:12px"><div style="height:100%;width:' + Math.max(0, v / maxB * 100) + '%;background:' + bk[2] + ';border-radius:0 3px 3px 0"></div>' +
      (a ? '<div title="평소 ' + _bMan(a) + '만" style="position:absolute;top:-2px;bottom:-2px;left:' + (a / maxB * 100) + '%;width:2px;background:#0f172a;opacity:.5"></div>' : '') + '</div>' +
      '<b class="lb-n" style="text-align:right;color:' + (a && v > a * 1.15 ? RED : '#0f172a') + '">' + _bMan(v) + '</b></div>';
  }).join('');
  h += '<div class="lb-grid">' +
    '<div class="lb-c lb-6"><p class="lb-t"><span>' + mk + ' 큰 결제 (10만↑) · ' + m.bigs.length + '건 = 지출의 ' + Math.round(m.bigShare * 100) + '%</span><span>⚡ 하루 3건↑ 몰아친 날</span></p>' +
      (bigRows || '<div style="font-size:12px;color:#94a3b8">없음</div>') +
      (m.bigs.length > 6 ? '<button class="lb-more" onclick="_boardShowAllBig=!_boardShowAllBig;ldgRenderBoard()">' + (_boardShowAllBig ? '접기' : '+ ' + (m.bigs.length - 6) + '건 더보기') + '</button>' : '') + '</div>' +
    '<div class="lb-c lb-6"><p class="lb-t"><span>' + mk + ' 어디에 · ' + _bMan(m.spend) + '만</span><span>세로선 = 평소 한 달</span></p>' + cats + '</div></div>';

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
      trait('flight', '경험·사람에 쓰는 형', '여행 ' + _bMan(b.travel) + ' + 사람 ' + _bMan(b.people) + ' / 달', false, '큰 여행은 1년 1번') +
      trait('schedule', dn[b.peak[0]] + '요일 ' + b.peak[1] * 3 + '–' + (b.peak[1] * 3 + 3) + '시형', _bMan(b.peakAmt) + '만 (' + b.N + '달)', false, '그 시간엔 장바구니만') +
      '</div></div>';
  }
  el.innerHTML = h;
}
window.ldgRenderBoard = ldgRenderBoard;

// 월별 뷰가 그려질 때마다(달 이동 포함) 보드도 같이
(function() {
  var orig = window.ldgRenderMonthly;
  if (typeof orig !== 'function' || orig._withBoard) return;
  var wrapped = function() { var r = orig.apply(this, arguments); try { ldgRenderBoard(); } catch (e) { console.error('[Board]', e); } return r; };
  wrapped._withBoard = true;
  window.ldgRenderMonthly = wrapped;
})();
