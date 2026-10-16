// ===== DAILY LEDGER: 월별 전략 보드 =====
// 위에서 고른 달(_ldgYear/_ldgMonth)에 맞춰 다시 그린다. 기존 KPI·도넛·TOP·카테고리 집계·일별 추이를 대신한다.
// 큰 그림(집 마감 · 그달 판정 · 나의 규칙) → 연간 목표 → 이 달 플레이북(작년 같은 달) → 세부(봉투 5개 · 큰 결제 · 어디에 썼나) → 나라는 사람(지난 달들로 본 성향).

// 글자색은 진하게만 (연회색 금지 — 누리)
var BK = { ink: '#0f172a', sub: '#334155', mute: '#475569', red: '#d9695e', green: '#3fa37f', amber: '#334155', indigo: '#1d5fd1', data: '#2f7ff0', soft: '#9cc4fb', track: '#e5effe', dataText: '#1d5fd1' };
// 막대 밑 라벨을 '막대 끝 자리'에 단다 (왼쪽 정렬 줄글 금지 — 누리). tags: [{p: 0~100, h: html}]
function _bTags(tags) {
  var html = tags.filter(function(t) { return t && t.h; }).map(function(t) {
    var p = Math.max(0, Math.min(100, t.p)), tx = p < 5 ? '0' : p > 95 ? '-100%' : '-50%';
    return '<span style="position:absolute;top:0;left:' + p + '%;transform:translateX(' + tx + ');white-space:nowrap">' + t.h + '</span>';
  }).join('');
  return '<div class="lb-tags" style="position:relative;height:16px;font-size:11px;color:' + BK.sub + '">' + html + '</div>';
}
// 막대 한 줄 + 막대 끝 바로 오른쪽 라벨 (누리: 밑에 쌓지 말고 오른쪽에)
var B_SCALE = 0.78;
function _bLine(pct, h, col, label, extra, scale, labelAt) {
  var sc = scale || B_SCALE, w = Math.max(0, Math.min(100, pct)) * sc, H = Math.max(h, 15);
  var lx = labelAt != null ? Math.max(w, Math.min(100, labelAt) * sc) : w;
  return '<div style="position:relative;height:' + H + 'px">' + (extra || '') +
    '<div style="position:absolute;left:0;top:' + ((H - h) / 2) + 'px;height:' + h + 'px;width:' + w + '%;min-width:2px;background:' + col + '"></div>' +
    (label ? '<span style="position:absolute;left:calc(' + lx + '% + 7px);top:50%;transform:translateY(-50%);font-size:11px;line-height:1;white-space:nowrap;color:' + BK.sub + '">' + label + '</span>' : '') + '</div>';
}

// ── 한 막대(불릿): 채운 만큼 · 끝에 금액 · 옆에 남음/넘음(모자람/달성) · 한도선과 숫자(누르면 바꾸기) · 밑에 ▲평소 ▲작년
// o: { v, cap, scale, mode:'limit'|'goal', segs:[[이름,값,색]], color, unit, edit, marks:[{v,label,color}], fmt }
function _bBullet(o) {
  var fmt = o.fmt || function(x) { return _bMan(x); }, unit = o.unit == null ? '' : o.unit;
  // 막대 오른쪽 끝 = 한도·목표 (넘었으면 쓴 돈까지) — 빈 칸이 곧 남은 돈 (누리: 목표 뒤로 빈 막대 금지)
  o.scale = Math.max(o.cap, o.v, o.scaleMin || 0, Math.max.apply(null, (o.marks || []).map(function(mk) { return mk.v || 0; }).concat([0])), 1);
  var P = function(a) { return Math.max(0, Math.min(100, a / o.scale * 100)); };
  if (o.noCap) o.cap = 0;
  var pv = P(Math.max(0, o.v)), pc = P(o.cap), over = !o.noCap && o.v > o.cap, good = o.mode === 'goal' ? o.v >= o.cap : !over;
  var fillCol = o.color || (o.mode === 'goal' ? BK.green : over ? BK.red : BK.data);
  var fill = '';
  if (o.segs) {
    var x = 0; o.segs.forEach(function(sg) { if (sg[1] <= 0) return; var w = P(sg[1]); fill += '<div title="' + sg[0] + ' ' + fmt(sg[1]) + '" style="position:absolute;left:' + x + '%;top:0;bottom:0;width:' + w + '%;background:' + sg[2] + ';border-right:2px solid #fff' + (sg[3] ? ';background-image:repeating-linear-gradient(135deg,transparent 0 4px,rgba(255,255,255,.6) 4px 6px)' : '') + '">' + (w >= 4 && o.v > 0 && !o.noPct ? '<span style="position:absolute;left:' + (pc > x - 0.5 && pc < x + 5 ? 'calc(' + ((pc - x) / w * 100) + '% + 6px)' : '6px') + ';top:0;line-height:22px;font-size:11.5px;font-weight:700;color:' + _bPctInk(sg[2]) + '">' + Math.round(sg[1] / o.v * 100) + '%</span>' : '') + '</div>'; x += w; });
  } else fill = '<div style="position:absolute;left:0;top:0;bottom:0;width:' + pv + '%;min-width:2px;background:' + fillCol + '"></div>';
  var inside = pv >= 13 && !o.segs && !o.noVal;
  var valTxt = '<b class="lb-n" style="color:inherit">' + fmt(o.v) + unit + '</b>';
  var diff = Math.abs(o.v - o.cap);
  var rest = o.mode === 'goal' ? (good ? '<span style="color:' + BK.green + '">+' + fmt(diff) + ' 달성</span>' : '<span style="color:' + BK.red + '">' + fmt(diff) + ' 모자람</span>')
                               : o.noCap ? '<span class="lb-ed" data-k="' + (o.edit || '') + '" onclick="_bEdit(this)" style="cursor:text;color:' + BK.sub + ';border-bottom:1px dashed ' + BK.sub + '">예산 정하기</span>'
                               : (over ? '<span style="color:' + BK.red + '">' + fmt(diff) + ' 넘음</span>' : '<span style="color:#23855f;font-weight:700">' + fmt(diff) + ' 남음</span>');
  var h = '<div style="padding-right:86px"><div style="position:relative;height:22px;margin-top:' + (o.capTop ? 14 : 0) + 'px;box-shadow:inset 0 -1px 0 #dbe4ef"><div style="position:absolute;left:0;top:0;bottom:0;width:' + pc + '%;background:#e8f1fd"></div>' + fill +
    (inside ? '<span class="lb-in" data-pc="' + pc + '" style="position:absolute;z-index:2;right:' + (100 - pv) + '%;top:0;line-height:22px;padding-right:6px;color:#fff;font-size:12px;white-space:nowrap">' + valTxt + '</span>' : '') +
    '<span class="lb-rest" data-pc="' + pc + '"' + (over ? ' data-over="1"' : '') + ' style="position:absolute;left:calc(' + pv + '% + 6px);top:0;line-height:22px;font-size:11.5px;font-weight:600;white-space:nowrap">' + (inside || o.noVal ? '' : '<span style="color:' + BK.ink + '">' + valTxt + '</span> · ') + rest + '</span>' +
    (o.noCap ? '' : '<div class="lb-capl" style="position:absolute;left:calc(' + pc + '% - 1px);top:-4px;bottom:-4px;width:2px;background:' + BK.ink + '"></div>');
  // 한도 숫자는 늘 선 위 — 막대 안 글자와 안 부딪힌다 (남음 글자가 선을 가로지르면 _bFixBullets 가 선 오른쪽으로 옮김)
  var upper = true;
  var capLbl = (o.capLabel ? o.capLabel + ' ' : '') + '<span class="lb-ed" data-k="' + (o.edit || '') + '" onclick="_bEdit(this)" title="눌러서 바꾸기" style="cursor:text;border-bottom:1px dashed ' + BK.ink + '">' + fmt(o.cap) + '</span>' + unit;
  if (!o.noCap) h += upper ? '<span style="position:absolute;left:calc(' + pc + '% + 3px);top:-17px;font-size:11.5px;font-weight:700;color:' + BK.ink + ';white-space:nowrap;' + (pc > 80 ? 'transform:translateX(-100%);margin-left:-8px' : '') + '">' + capLbl + '</span>'
             : '<span style="position:absolute;left:calc(' + pc + '% + 6px);top:0;line-height:22px;font-size:12px;font-weight:700;color:' + BK.ink + ';white-space:nowrap">' + capLbl + '</span>';
  (o.marks || []).forEach(function(mk) { if (mk.v > 0 && mk.v <= o.scale) h += '<div title="' + mk.label + ' ' + fmt(mk.v) + '" style="position:absolute;z-index:1;left:calc(' + P(mk.v) + '% - 1px);top:-4px;bottom:-4px;border-left:3px ' + (mk.dash || 'dashed') + ' ' + mk.color + '"></div>'; });
  h += '</div>';
  if (upper) h = h.replace('margin-top:0px', 'margin-top:16px');
  // 막대보다 큰 평소·작년은 끝에 붙이고 › 로 '더 있음'
  if (o.marks && o.marks.length) h += _bTags(o.marks.filter(function(mk) { return mk.v > 0; }).map(function(mk) { return { p: P(mk.v), h: '<span style="color:' + mk.color + ';font-weight:600">' + mk.label + ' <b class="lb-n" style="color:inherit">' + fmt(mk.v) + '</b>' + (mk.v > o.scale ? ' ›' : '') + '</span>' }; }));
  return h + '</div>';
}
// 칸 색 위 % 글자색 — 진한 칸은 흰색, 옅은 칸은 같은 계열 진한 색
function _bPctInk(bg) { return { '#7fb2f7': '#1d4ed8', '#bcd5fb': '#1d4ed8', '#e9a39b': '#8f2f27', '#f3cdc8': '#8f2f27' }[bg] || '#fff'; }
// 숫자 눌러서 바꾸기 (엑셀처럼) — 한도는 그 달 것만, 목표는 그 해 것. 아뜰리에 데이터에 저장
var _BOARD_CAPS_KEY = 'atelier_board_caps';
function _bCapsOv() { if (_boardExtra.caps) return _boardExtra.caps; try { _boardExtra.caps = JSON.parse(localStorage.getItem(_BOARD_CAPS_KEY)) || {}; } catch (e) { _boardExtra.caps = {}; } return _boardExtra.caps; }
function _bEdit(el) {
  if (el.querySelector('input')) return;
  var k = el.getAttribute('data-k') || '', parts = k.split('|'), old = el.textContent.replace(/[^\d.-]/g, '');
  el.innerHTML = '<input type="number" value="' + old + '" style="width:64px;font:inherit;font-weight:700;padding:0 2px;border:1px solid ' + BK.data + ';background:#fff">';
  var inp = el.querySelector('input'); inp.focus(); inp.select();
  var done = false, save = function() {
    if (done) return; done = true;
    var n = Number(inp.value); if (!isFinite(n) || inp.value === '') { ldgRenderBoard(); return; }
    if (parts[0] === 'cap') {
      // 카테고리별 집계의 예산과 같은 곳 — 그 달만 바꾸고, 처음 정하는 칸이면 기본값도 같이 (집계 연필과 같은 규칙)
      var B = _ledgerData.budgets = _ledgerData.budgets || {}, won = Math.round(n * 10000);
      if (!B[parts[2]]) B[parts[2]] = { default: 0, overrides: {} };
      if (!B[parts[2]].overrides) B[parts[2]].overrides = {};
      B[parts[2]].overrides[parts[1]] = won; if (!B[parts[2]].default) B[parts[2]].default = won;
      try { ldgSaveBudgets(); } catch (e) { console.error('[Board budget save]', e); }
      try { if (typeof ldgRenderCatGrid === 'function') ldgRenderCatGrid(); } catch (e) {}
    } else if (parts[0] === 'goal') {
      var g = (typeof ldgLoadGoals === 'function' ? ldgLoadGoals() : {}) || {}; g[parts[1]] = g[parts[1]] || {}; g[parts[1]][parts[2]] = Math.round(n); g[parts[1]].updatedAt = new Date().toISOString();
      try { localStorage.setItem('atelier_ledger_goals', JSON.stringify(g)); } catch (e) {}
      try { db.collection('appSettings').doc('ledgerData').update({ goals: g }); } catch (e) { console.error('[Board goal save]', e); }
    }
    ldgRenderBoard();
  };
  inp.addEventListener('keydown', function(e) { if (e.key === 'Enter') save(); if (e.key === 'Escape') { done = true; ldgRenderBoard(); } });
  inp.addEventListener('blur', save);
}
window._bEdit = _bEdit;

// 남음·넘음 글자가 한도선을 가로지르면 선 오른쪽으로 (실제 폭을 재서)
function _bFixBullets(root) {
  (root || document).querySelectorAll('.lb-rest').forEach(function(sp) {
    var line = sp.parentNode.querySelector('.lb-capl'); if (!line || sp.getAttribute('data-over')) return;
    var a = sp.getBoundingClientRect(), b = line.getBoundingClientRect();
    var tr = sp.parentNode.getBoundingClientRect();
    if ((a.left < b.right + 2 && a.right > b.left - 4) || a.right > tr.right - 2) sp.style.left = 'calc(' + Math.min(100, +sp.getAttribute('data-pc')) + '% + 7px)';
  });
  (root || document).querySelectorAll('.lb-in').forEach(function(sp) {
    var line = sp.parentNode.querySelector('.lb-capl'); if (!line) return;
    var a = sp.getBoundingClientRect(), b = line.getBoundingClientRect();
    if (a.left < b.right + 2 && a.right > b.left - 2) sp.style.right = 'calc(' + (100 - Number(sp.getAttribute('data-pc'))) + '% + 3px)';
  });
}
// 그린 뒤 실제 글자 폭을 재서, 진짜 겹치는 라벨만 다음 줄로
function _bFixTags(root) {
  try { _bFixBullets(root); } catch (e) {}
  (root || document).querySelectorAll('.lb-tags').forEach(function(box) {
    var base = box.getBoundingClientRect().left;
    var items = Array.prototype.slice.call(box.children).map(function(sp) { var r = sp.getBoundingClientRect(); return { sp: sp, l: r.left - base, r: r.right - base }; }).sort(function(a, b) { return a.l - b.l; });
    var ends = [];
    items.forEach(function(it) {
      var row = 0;
      while (ends[row] != null && it.l < ends[row] + 8) row++;
      ends[row] = it.r; it.sp.style.top = (row * 15) + 'px';
    });
    box.style.height = (Math.max(1, ends.length) * 15 + 1) + 'px';
  });
}
// 기준 대비 막대: 채운 만큼 / 넘으면 빨강. save=true면 많이 채울수록 좋은 막대. 숫자는 채운 끝 · 한도는 오른쪽 끝
function _bBar(val, cap, save, h, noTags, short) {
  var pct = cap > 0 ? Math.max(0, Math.min(100, val / cap * 100)) : 0, over = cap > 0 && val > cap;
  var col = save ? (val >= cap ? BK.green : BK.data) : (over ? BK.red : BK.data);
  var track = over && !save ? '#fbe7e4' : BK.track;
  var bar = '<div style="height:' + (h || 8) + 'px;background:' + track + ';overflow:hidden;margin:5px 0 2px"><div style="width:' + pct + '%;height:100%;background:' + col + ';"></div></div>';
  if (noTags || !cap) return bar;
  var endTxt = save ? (val >= cap ? '<b style="color:' + BK.green + '">목표 ' + _bMan(cap) + ' ✓</b>' : '목표 ' + _bMan(cap) + ' · ' + _bMan(cap - val) + ' 더')
                    : (over ? '<b style="color:' + BK.red + '">' + _bMan(val - cap) + '만 넘음</b> · 한도 ' + _bMan(cap) : _bMan(cap - val) + '만 남음 · 한도 ' + _bMan(cap));
  if (short) endTxt = over && !save ? '<b style="color:' + BK.red + '">+' + _bMan(val - cap) + '</b> / ' + _bMan(cap) : '/ ' + _bMan(cap);
  return bar + _bTags([{ p: pct, h: '<b style="color:' + (over && !save ? BK.red : BK.ink) + '">' + _bMan(val) + '만</b>' }, { p: 100, h: endTxt }]);
}
// 남음/넘음 한 줄
function _bLeftTxt(val, cap, save) {
  if (save) return val >= cap ? '<b style="color:' + BK.green + '">' + _bMan(val) + '만 모음 ✓</b> <span style="color:' + BK.mute + '">목표보다 +' + _bMan(val - cap) + '</span>' : '<b style="color:' + BK.indigo + '">' + _bMan(val) + '만 모음</b> <span style="color:' + BK.mute + '">· ' + _bMan(cap - val) + '만 더</span>';
  return val > cap ? '<b style="color:' + BK.red + '">' + _bMan(val) + '만 씀 · ' + _bMan(val - cap) + '만 넘음</b>' : '<b style="color:' + BK.ink + '">' + _bMan(val) + '만 씀</b> <span style="color:' + BK.sub + '">· ' + _bMan(cap - val) + '만 남음</span>';
}
// 평소 월급(상여 뺀) — 아직 안 들어온 이번 달 월급 자리에 쓴다
function _bRegularSalary() {
  // 최근 3번 월급의 중간값 (연봉 인상 전 월급이 섞이지 않게 — 2026-10 급여명세서로 확인: 인상 뒤 세후 ≈353만)
  var s = (_ledgerData.transactions || []).filter(function(t) { return t['대분류'] === '수입' && t['소분류'] === '월급' && t['금액'] >= 2500000 && t['금액'] <= 4500000; })
    .sort(function(a, b) { return a.date < b.date ? 1 : -1; }).slice(0, 3).map(function(t) { return t['금액']; }).sort(function(a, b) { return a - b; });
  return s.length ? s[Math.floor(s.length / 2)] : 3530000;
}
var MIRROR_PAYDAY = 28;
var _bIsReturn = function(t) { return (t['대분류'] === '품위유지비' || t['대분류'] === '생필품비') && t['금액'] < 0 && !/^29CM 반품비/.test(t['세부사항'] || ''); };

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
  2:  { caps: { '사람': 700000 }, todo: ['설 봉투 65만 (경조사비)', '조용한 달 · 남는 돈 그대로 집 통장'] },
  3:  { caps: { '사람': 1000000 }, todo: ['봄 옷은 한도 안에서 한 번에'] },
  4:  { caps: { '사람': 500000 }, todo: ['상여 받는 날 바로 옮기기', '슬예 생일 ≈200 · 숙소·식사·선물 먼저 정하기'] },
  5:  { caps: {}, todo: ['종합소득세 · 모아 둔 세금 통장으로'] },
  6:  { caps: { '물건': 500000 }, todo: ['집 프로젝트는 하나만 · 예산 먼저'] },
  7:  { caps: {}, todo: [] },
  8:  { caps: {}, todo: ['가을 여행 예약은 일정 확정 뒤 한 번에'] },
  9:  { caps: {}, todo: [] },
  10: { caps: {}, todo: ['상여 받는 날 바로 옮기기'] },
  11: { caps: { '물건': 300000 }, todo: ['새 여행 예약 0 · 블프는 위시리스트만'] },
  12: { caps: { '사람': 300000 }, todo: ['연말 모임·선물은 관계비 한도 안에서'] },
  // 2026-11·12 조이기 (2026-10-15 누리와 정함) — living = 그 달 생활비 전체 한도
  '2026-10': { todo: ['10/28 인센(≈510만)은 받는 날 그대로 OK파킹 · 월급은 11/10 카드값용'] },
  '2026-11': { living: 1600000, caps: { '외식': 250000, '배달': 100000, '카페·간식': 100000, '장보기': 160000, '편의점': 30000, '옷·뷰티': 0, '물건': 100000, '병원·약': 50000, '주유·교통': 220000, '취미·여가': 100000, '책·공부': 100000, '사람': 200000 },
               todo: ['블프·11월 행사는 장바구니만 · 결제 0', '물건은 소모품만 10만', '11/10 카드값 내고 남은 돈 120만↑ → OK파킹'] },
  '2026-12': { living: 2000000, caps: { '외식': 300000, '배달': 100000, '카페·간식': 100000, '장보기': 200000, '편의점': 30000, '옷·뷰티': 0, '물건': 100000, '병원·약': 50000, '주유·교통': 220000, '취미·여가': 150000, '책·공부': 100000, '사람': 400000 },
               todo: ['선물 줄 사람·금액 먼저 적기 → 관계비 한도 안에서', '송년회는 1차만 · 외식 28만', '12/10 카드값 뒤 120만↑ → OK · 12/28 월급날 80만 → OK', '12/12 새 연재 시작 🎉'] },
  '2027-01': { todo: ['2027 목표 · 수입 9,150만 · 지출 4,420만 · 저축 4,730만'] },
  '2027-02': { todo: ['연말정산 환급 ≈100만 → 들어오는 날 OK파킹'] },
  '2027-03': { todo: ['집 상환 자금 2,500만 완성'] },
  '2027-04': { todo: ['집 마지막 상환 🎉'] }
};
var MIRROR_EVERY_MONTH = ['월급날 80만 · 부업 입금일 전액 → 집 통장', '종합소득세 통장에 10만'];

function _bYm(ym, d) { var p = ym.split('-').map(Number), k = p[0] * 12 + (p[1] - 1) + d; return Math.floor(k / 12) + '-' + String(k % 12 + 1).padStart(2, '0'); }
// 옷은 여행 가기 직전에 산다 (누리) — 여행 시작 달의 전달 + (10일 이후 출발이면) 시작 달이 옷 쇼핑 달
var MIRROR_TRIP_CLOTHES = 900000;
var MIRROR_TRAVEL_ACCOUNT = '미래에셋';
// 여행 돈 모으는 통장 = 자산 탭 이름 일부. 반품비는 추정 안 함 — 29CM 실제 반품비가 '반품 배송비' 행으로 들어온다(~/money/labels.py)
function _bClothesMonth(ym) {
  return (_boardExtra.trips || []).filter(function(t) {
    var sm = t.start.slice(0, 7);
    return _bYm(sm, -1) === ym || (sm === ym && +t.start.slice(8, 10) >= 10);
  })[0] || null;
}
// 아뜰리에 예산(카테고리별 집계) → 보드 옛 칸 이름으로. 그 달 예산이 들어 있으면 보드 계획·할 일·예상이 전부 이걸 따른다 (누리 2026-10-16)
function _bSubBudget(cat, sub, ym) {
  var b = (_ledgerData.budgets || {})[cat + '.' + sub];
  return b ? (b.overrides && b.overrides[ym] !== undefined ? b.overrides[ym] : (b.default || 0)) : 0;
}
function _bBudgetPlan(ym) {
  var B = _ledgerData.budgets || {};
  if (!Object.keys(B).some(function(k) { return B[k] && B[k].overrides && B[k].overrides[ym] !== undefined && k.indexOf('수입') !== 0 && k.indexOf('여행') !== 0; })) return null;
  var C = function(c) { return _bCatBudget(c, ym).v; }, S = function(c, sb) { return _bSubBudget(c, sb, ym); };
  var park = S('교통비', '주차비'), eng = S('자기계발비', '영어 강의'), itax = S('세금/보험', '종합소득세');
  var caps = { '외식': S('식비', '외식비'), '배달': S('식비', '배달'), '카페·간식': S('식비', '간식/카페'), '장보기': S('식비', '식재료비') + S('식비', '구내식당'), '편의점': S('식비', '편의점'),
    '옷·뷰티': C('품위유지비'), '물건': C('생필품비'), '병원·약': C('건강/의료비'), '주유·교통': C('교통비') - park, '취미·여가': C('여가비'), '책·공부': C('자기계발비') - eng, '사람': C('관계비') + C('경조사비') };
  var living = Object.keys(caps).reduce(function(a, k) { return a + caps[k]; }, 0) + Math.max(0, C('식비') - caps['외식'] - caps['배달'] - caps['카페·간식'] - caps['장보기'] - caps['편의점']);
  return { caps: caps, living: living, fixedCap: C('주거비') + C('고정비') + park + C('세금/보험') - itax, annualCap: eng + itax };
}
function _bPlan(ym) {
  var a = MIRROR_MONTH_PLAN[+ym.slice(5)] || {}, b = MIRROR_MONTH_PLAN[ym] || {}, caps = {};
  [a.caps || {}, b.caps || {}].forEach(function(c) { Object.keys(c).forEach(function(k) { caps[k] = c[k]; }); });
  var todo = (a.todo || []).concat(b.todo || []);
  var bp = _bBudgetPlan(ym);
  if (bp) {
    var cl = bp.caps['옷·뷰티'];
    todo.push(cl >= 400000 ? '👗 옷 쇼핑 달 · 한도 ' + _bMan(cl) + '만' : cl ? '👗 옷은 ' + _bMan(cl) + '만 안에서' : '👗 옷 0 · 다음 옷 달까지');
    return { caps: bp.caps, todo: todo, living: bp.living, fixedCap: bp.fixedCap, annualCap: bp.annualCap, fromBudget: true };
  }
  var ct = _bClothesMonth(ym);
  if (ct) { caps['옷·뷰티'] = MIRROR_TRIP_CLOTHES; todo.push('👗 ' + ct.title + ' 가기 전 옷 쇼핑 달 · 한도 ' + _bMan(MIRROR_TRIP_CLOTHES) + '만'); }
  else {
    var cc = caps['옷·뷰티'] != null ? caps['옷·뷰티'] : _bLivingCap(ym, '옷·뷰티');
    todo.push(cc ? '👗 옷은 여행 직전 달에만 · 이 달은 ' + _bMan(cc) + '만' : '👗 옷 0 · 다음 여행 직전 달까지');
  }
  var ov = (_bCapsOv() || {})[ym] || {}, living = b.living || a.living || (ym >= '2027-01' ? 1850000 : 1830000);
  Object.keys(ov).forEach(function(k) { caps[k] = ov[k]; });
  if (MIRROR_LIVING.some(function(x) { return ov[x[0]] != null; })) living = MIRROR_LIVING.reduce(function(acc, x) { return acc + (caps[x[0]] != null ? caps[x[0]] : _bLivingCap(ym, x[0])); }, 0);
  return { caps: caps, todo: todo, living: living, fixedCap: ov['고정'], annualCap: ov['연간 적립'] };
}
function _bRows(ym) { return (_ledgerData.transactions || []).filter(function(t) { return t.date && t.date.slice(0, 7) === ym; }); }
// 작년 그 달에 있었던 '매년 돌아오는 돈' — 데이터에서 찾는다
function _bRecurring(ym) {
  var L = _bRows(ym), out = [];
  var add = function(name, f, min) { var v = _bSum(L, f); if (v >= (min || 1)) out.push([name, v, false, (L.filter(f)[0] || {}).date, f]); };
  add('영어 수업료', function(t) { return t['소분류'] === '영어 강의'; }, 100000);
  add('세금', function(t) { return /국세|지방세|종합소득|재산세|자동차세/.test(t['세부사항'] || '') || ['종합소득세', '재산세', '자동차세'].indexOf(t['소분류']) >= 0; }, 100000);
  add('명절', function(t) { return t['소분류'] === '명절' || /세뱃돈/.test(t['세부사항'] || ''); }, 50000);
  add('선물·가족', function(t) { return t['대분류'] === '관계비' && ['선물', '가족'].indexOf(t['소분류']) >= 0 && t['금액'] > 0; }, 300000);
  add('보험', function(t) { return ['자동차보험', '운전자보험'].indexOf(t['소분류']) >= 0 && t['금액'] >= 100000; }, 100000);
  var sal = L.filter(function(t) { return t['대분류'] === '수입' && t['소분류'] === '월급'; });
  var big = sal.filter(function(t) { return t['금액'] >= 4500000; });
  if (big.length) out.push(['상여', big.reduce(function(a, t) { return a + t['금액']; }, 0), true, big[0].date]);
  return out;
}
function _boardPlaybook(ym, m, todoOnly) {
  var ly = _bYm(ym, -12), lm = ldgBoardMonth(ly, true), mk = (+ym.slice(5)) + '월', plan = _bPlan(ym);
  var rec = _bRecurring(ly), next = _bRecurring(_bYm(ym, -11));
  var now = new Date(), curYm = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0'), live = m && m.L.length;
  var C_LY = BK.soft, C_TY = BK.data, left = '';
  if (lm.L.length) {
    // 이번 달이 진행 중이면 작년도 같은 날짜까지만 비교. 여행은 여행 통장 돈이라 따로
    var cut = ym === curYm ? now.getDate() : 31;
    var lyRows = lm.L.filter(function(t) { return +t.date.slice(8, 10) <= cut && _bS(t); });
    var lyB = MIRROR_BUCKETS.map(function() { return 0; });
    lyRows.forEach(function(t) { lyB[_bBucket(t)] += t['금액'] || 0; });
    var ti = 0, tyAll = m.spend - m.buckets[ti], lyAll = lyB.reduce(function(x, y) { return x + y; }, 0) - lyB[ti];
    var rowsCmp = MIRROR_BUCKETS.map(function(bk, i) { return [bk[0], m.buckets[i], lyB[i]]; }).filter(function(x, i) { return i !== ti && (x[1] > 0 || x[2] > 0); });
    var mx = Math.max.apply(null, rowsCmp.map(function(x) { return Math.max(x[1], x[2]); }).concat([1]));
    var d = tyAll - lyAll;
    left = '<div style="display:flex;align-items:baseline;gap:10px;margin-bottom:6px;flex-wrap:wrap"><span style="font-size:12px;color:' + BK.ink + '">여행 빼고</span><span class="lb-n" style="font-size:20px;color:' + BK.dataText + '">올해 ' + _bMan(tyAll) + '만</span>' +
      '<span class="lb-n" style="font-size:15px;color:' + BK.sub + '">작년 ' + _bMan(lyAll) + '만</span>' +
      '<span class="lb-n" style="font-size:13px;color:' + (d <= 0 ? BK.green : BK.red) + '">' + (d <= 0 ? '▼ ' + _bMan(-d) + '만 덜 씀' : '▲ ' + _bMan(d) + '만 더 씀') + '</span></div>' +
      '<div style="display:flex;gap:12px;font-size:11px;color:' + BK.ink + ';margin-bottom:4px"><span><i style="display:inline-block;width:12px;height:8px;background:' + C_TY + ';margin-right:4px"></i>올해</span><span><i style="display:inline-block;width:12px;height:5px;background:' + C_LY + ';margin-right:4px"></i>작년' + (cut < 31 ? ' (같은 1~' + cut + '일)' : '') + '</span></div>' +
      rowsCmp.map(function(x) {
        var dd = x[1] - x[2];
        return '<div style="display:grid;grid-template-columns:62px minmax(0,1fr);gap:8px;align-items:center;font-size:12px;margin:5px 0"><span style="color:' + BK.ink + ';font-weight:600">' + x[0] + '</span>' +
          '<div>' + _bLine(x[1] / mx * 100, 9, C_TY, '<b class="lb-n" style="color:' + BK.dataText + '">' + _bMan(x[1]) + '</b>' + (dd ? ' <b style="color:' + (dd < 0 ? BK.green : BK.red) + '">' + (dd < 0 ? '▼' : '▲') + _bMan(Math.abs(dd)) + '</b>' : '')) +
          _bLine(x[2] / mx * 100, 5, C_LY, '작년 ' + _bMan(x[2])) + '</div></div>';
      }).join('') +
      '<div style="font-size:11.5px;color:' + BK.sub + ';margin-top:6px;padding-top:6px;border-top:1px solid #eef1f5"><span class="material-symbols-outlined" style="font-size:14px;vertical-align:-3px;color:#1d5fd1">flight</span> 여행은 따로 · 올해 ' + _bMan(m.buckets[ti]) + '만 / 작년 ' + _bMan(lyB[ti]) + '만 (여행 통장)</div>';
  } else {
    left = '<div style="font-size:12px;color:' + BK.sub + '">작년 ' + mk + ' 기록이 없어요</div>';
  }

  // ── 할 일 체크리스트: [상태, 할 일, 왜(작년 근거), 막대]
  var items = [], L = live ? m.L : [];
  var it = function(st, title, why, bar) { items.push([st, title, why, bar || '']); };
  var d2 = function(dt) { return dt ? (+dt.slice(5, 7)) + '/' + (+dt.slice(8, 10)) : ''; };
  var netSave = live ? m.saveIn + m.saveOut : 0;
  rec.forEach(function(r) {
    if (r[2]) {  // 상여
      var big = L.filter(function(t) { return t['대분류'] === '수입' && t['소분류'] === '월급' && t['금액'] >= 4500000; });
      var bonusNow = big.reduce(function(a, t) { return a + t['금액'] - _bRegularSalary(); }, 0);
      if (big.length) it(netSave >= bonusNow ? 'ok' : 'bad', '상여 ' + _bMan(bonusNow) + '만 → 그날 집 통장', '이 달 상여 들어옴 · 집 통장 순적립 ' + _bMan(netSave) + '만', _bBar(netSave, bonusNow, true, 6));
      else it('wait', '상여 들어오는 날 → 상여분 그대로 집 통장', '작년엔 ' + d2(r[3]) + ' 월급+상여 ' + _bMan(r[1]) + '만이 들어왔어요');
      return;
    }
    if (r[0] === '선물·가족') {
      var cap = plan.caps['사람'] || 100000, v = _bSum(L, function(t) { return _bS(t) && (t['대분류'] === '관계비' || t['대분류'] === '경조사비') && t['소분류'] !== '할머니용돈'; });
      it(v > cap ? 'bad' : 'ok', '선물·가족은 ' + _bMan(cap) + '만 안에서', '작년 ' + mk + '엔 ' + _bMan(r[1]) + '만 썼어요', live ? _bBar(v, cap, false, 6) : '');
      return;
    }
    var paid = r[4] ? _bSum(L, r[4]) : 0;
    it(paid ? 'ok' : 'wait', r[0] + ' 나갈 달 — 연간 적립에서', '작년 ' + d2(r[3]) + '에 ' + _bMan(r[1]) + '만 나갔어요' + (paid ? ' · 올해 ' + _bMan(paid) + '만 나감' : ''));
  });
  _boardSerial(ym).forEach(function(t) { it('wait', t.replace(/^✍️ /, ''), '캘린더 연재 일정'); });
  var tf = _boardTripFor(ym);
  if (tf) {
    var t = tf.trip;
    if (t.start <= ym + '-31') {
      var tv = live ? m.envs[0].val : 0;
      it(tv > t.budget ? 'bad' : 'ok', _bEsc(t.title) + ' ' + d2(t.start) + '~' + d2(t.end) + ' · 예산 안에서', '여행 통장에서 · 예산 ' + _bMan(t.budget) + '만', live ? _bBar(tv, t.budget, false, 6) : '');
    } else {
      var fund = 0;
      ((_ledgerData.assets || {})['현금자산'] || []).forEach(function(a) { if ((a['소분류'] || '').indexOf(MIRROR_TRAVEL_ACCOUNT) >= 0) (a['월별'] || []).forEach(function(v) { if (v != null) fund = v; }); });
      var need = Math.max(0, t.own - fund);
      it(need ? 'wait' : 'ok', '다음 여행 ' + _bEsc(t.title) + ' (' + t.start.slice(2, 7).replace('-', '.') + ') 돈 모으기', '내 돈 ' + _bMan(t.own) + '만' + (t.support ? ' (회사 지원 ' + _bMan(t.support) + '만 뺌)' : '') + ' · 여행 통장 ' + _bMan(fund) + '만 → ' + (need ? '200~300씩 ' + Math.ceil(need / 2500000) + '번 더' : '다 모임'), _bBar(fund, t.own, true, 6));
    }
  }
  plan.todo.forEach(function(t) {
    if (/^👗/.test(t)) return;
    if (/상여 받는 날/.test(t) && rec.some(function(r) { return r[2]; })) return;  // 위 상여 줄과 같음
    it('wait', _bEsc(t), '달마다 정해 둔 것');
  });
  var ct = _bClothesMonth(ym), ccap = plan.caps['옷·뷰티'] || 250000, cv = _bSum(L, function(t) { return _bS(t) && t['대분류'] === '품위유지비'; });
  it(cv > ccap ? 'bad' : 'ok', '옷·뷰티 ' + _bMan(ccap) + '만 안에서', (ct ? _bEsc(ct.title) + ' 가기 전 옷 사는 달' : '여행 직전 달이 아니라 평소 한도') + '', live ? _bBar(cv, ccap, false, 6) : '');
  var salIn = live && m.salary >= 2500000;
  it(salIn ? (netSave >= 800000 ? 'ok' : 'bad') : 'wait', '월급날 80만 → 집 통장', salIn ? '집 통장 순적립 ' + _bMan(netSave) + '만' : '월급 ' + MIRROR_PAYDAY + '일 · 그날 바로', salIn ? _bBar(netSave, 800000, true, 6) : '');
  it('wait', '종합소득세 통장에 10만', '매달 · 5월 종소세 미리');

  var ic = { ok: ['check_circle', BK.green], bad: ['cancel', BK.red], wait: ['radio_button_unchecked', BK.indigo] };
  var doneN = items.filter(function(x) { return x[0] === 'ok'; }).length;
  var todo = items.map(function(x) {
    return '<div style="display:grid;grid-template-columns:18px minmax(0,1fr);gap:7px;padding:6px 0;border-top:1px solid #eef1f5"><span class="material-symbols-outlined" style="font-size:17px;color:' + ic[x[0]][1] + '">' + ic[x[0]][0] + '</span>' +
      '<div style="min-width:0"><div style="font-size:12px;font-weight:600;color:' + BK.ink + '">' + x[1] + '</div>' + x[3] + '<div style="font-size:11px;color:' + BK.sub + '">' + x[2] + '</div></div></div>';
  }).join('');
  var nextHint = next.filter(function(r) { return !r[2]; }).map(function(r) { return r[0] + ' ' + _bMan(r[1]) + '만'; });
  if (todoOnly) return '<p class="lb-t"><span>' + mk + ' 할 일</span><span>' + (live ? doneN + ' / ' + items.length + ' 됨' : '미리 보기') + '</span></p>' + todo +
    (nextHint.length ? '<div style="font-size:11.5px;color:#0f172a;background:#eef5fb;padding:6px 9px;margin-top:10px">다음 달 · 작년엔 ' + nextHint.join(' · ') + '</div>' : '');
  return '<div class="lb-grid">' +
    '<div class="lb-c lb-6"><p class="lb-t"><span>' + mk + ' · 작년 같은 달과 비교</span><span>단위 만 원</span></p>' + left + '</div>' +
    '<div class="lb-c lb-6"><p class="lb-t"><span>올해 ' + mk + ' 할 일 · 작년 이 달을 보고 정함</span><span>' + (live ? doneN + ' / ' + items.length + ' 됨' : '미리 보기') + '</span></p>' + todo +
      (nextHint.length ? '<div style="font-size:11.5px;color:#0f172a;background:#eef5fb;padding:6px 9px;margin-top:10px">다음 달 미리 · 작년 이맘때 ' + nextHint.join(' · ') + ' 나갔어요</div>' : '') +
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
  if (typeof db !== 'undefined') db.collection('appSettings').doc('ledgerData').get().then(function(d) {
    var bc = (d.data() || {}).boardCaps; if (bc) { _boardExtra.caps = bc; try { localStorage.setItem(_BOARD_CAPS_KEY, JSON.stringify(bc)); } catch (e) {} try { ldgRenderBoard(); } catch (e) {} }
  }).catch(function() {});
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
  ['여행', function(t) { return t['대분류'] === '여행'; }, BK.data],
  ['옷·뷰티', function(t) { return t['대분류'] === '품위유지비'; }, BK.data],
  ['고정', function(t) { return ['고정비', '주거비', '세금/보험'].indexOf(t['대분류']) >= 0; }, BK.data],
  ['식비', function(t) { return t['대분류'] === '식비'; }, BK.data],
  ['차·교통', function(t) { return t['대분류'] === '교통비'; }, BK.data],
  ['물건', function(t) { return t['대분류'] === '생필품비'; }, BK.data],
  ['가족·선물', function(t) { return t['대분류'] === '관계비' || t['대분류'] === '경조사비'; }, BK.data],
  ['취미·여가', function(t) { return t['대분류'] === '여가비'; }, BK.data],
  ['기타', function() { return true; }, BK.data]
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
      var trows = (_ledgerData.transactions || []).filter(function(t) { return t['대분류'] === '여행' && !/^국내/.test(t['소분류'] || '') && t.date > tf.from && t.date <= tf.upto; });
      var known = (MIRROR_TRIP_ACTUAL[tf.trip.start.slice(0, 4)] || []).filter(function(a) { return a[0] === tf.trip.title.replace(/&/g, '·'); })[0];
      return { name: '여행', icon: e[1], val: known ? known[1] : _bSum(trows, function() { return true; }), cap: tf.trip.budget, unit: '원', money: 0,
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
  // 여행은 여행 통장에서 → 생활 판정에서 뺀다. 이번 달 월급이 아직이면 평소 월급을 '예정'으로
  var travel = _bSum(sp, function(t) { return t['대분류'] === '여행'; }), life = spend - travel;
  var salaryDue = (ym === todayStr.slice(0, 7) && salary < 2500000) ? _bRegularSalary() : 0;
  return { L: L, spend: spend, inc: inc, salary: salary, side: side, left: inc - spend, travel: travel, life: life, salaryDue: salaryDue, leftLife: inc + salaryDue - life, saveIn: saveIn, saveOut: saveOut, points: points, buckets: buckets, envs: envs, bigs: bigs,
           bigShare: spend ? _bSum(bigs, function() { return true; }) / spend : 0, binge: perDay };
}

function _boardCss() {
  if (document.getElementById('ldg-board-css')) return;
  var s = document.createElement('style');
  s.id = 'ldg-board-css';
  s.textContent = [
    '#ldg-board{margin:0 0 24px}',
    '.lb-grid{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:10px;margin-bottom:10px}',
    '.lb-c{background:#fff;border:1px solid #cbd5e1;padding:14px 16px;min-width:0}',
    '.lb-t{font-size:11.5px;font-weight:600;color:#334155;margin:0 0 8px;display:flex;justify-content:space-between;gap:8px;align-items:baseline}',
    '.lb-n{font-variant-numeric:tabular-nums;font-weight:700;color:#0f172a;font-family:Manrope,Pretendard,sans-serif}',
    '.lb-bar{height:6px;background:#e5effe;overflow:hidden;margin:6px 0 4px}',
    '.lb-row{display:grid;grid-template-columns:58px 8px minmax(0,1fr) 54px;gap:8px;align-items:center;font-size:12px;padding:5px 0;border-top:1px solid #eef1f5}',
    '.lb-sq{width:8px;height:8px}',
    '.lb-env{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:14px}',
    '.lb-goal{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}',
    '.lb-ms{font-size:11px;color:#334155;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
    '.lb-3{grid-column:span 4}.lb-6{grid-column:span 6}',
    '.lb-more{font-size:11px;color:#1d5fd1;background:none;border:0;padding:4px 0 0;cursor:pointer}',
    '@media (max-width:1100px){.lb-3{grid-column:span 6}.lb-env{grid-template-columns:repeat(3,minmax(0,1fr))}}',
    '@media (max-width:720px){.lb-goal{grid-template-columns:repeat(2,minmax(0,1fr))}.lb-3,.lb-6{grid-column:span 12}.lb-env{grid-template-columns:repeat(2,minmax(0,1fr))}}'
  ].join('\n');
  document.head.appendChild(s);
}


// ── 연간 목표 (설정 → 연간 목표 값, 기존 '연간 목표 진행도'와 같은 계산)
function _boardGoals() {
  var year = _ldgYear, goals = (typeof ldgLoadGoals === 'function' ? ldgLoadGoals() : {})[year] || {};
  var keys = [['수입', true, '#2f7ff0'], ['지출', false, '#d9695e'], ['저축', true, '#2f7ff0'], ['부업', true, '#3fa37f']];
  if (!keys.some(function(k) { return goals[k[0]]; })) {
    return '<div class="lb-c" style="margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;font-size:12px;color:#334155">' + year + '년 목표가 아직 없어요' +
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
    if (!goal) return '<div style="font-size:11px;color:#334155">' + k[0] + ' · 목표 없음</div>';
    var diff = act - goal * prog, good = k[1] ? diff >= 0 : diff <= 0;
    var col = good ? '#3fa37f' : '#d9695e';
    return '<div><div style="font-size:12px;color:#0f172a;font-weight:600">' + k[0] + '</div>' +
      '<div style="position:relative;height:15px;margin:4px 0 2px"><div style="position:absolute;left:0;top:4px;height:7px;width:62%;background:' + BK.track + '"></div>' +
        '<div style="position:absolute;left:0;top:4px;height:7px;width:' + (Math.min(100, act / goal * 100) * 0.62) + '%;background:' + col + '"></div>' +
        '<div title="오늘까지 목표 페이스" style="position:absolute;left:' + (prog * 62) + '%;top:0;bottom:0;width:2px;background:#475569"></div>' +
        '<span style="position:absolute;left:calc(62% + 6px);top:50%;transform:translateY(-50%);font-size:11px;line-height:1;white-space:nowrap;color:' + BK.sub + '"><b class="lb-n" style="color:' + BK.ink + '">' + act.toLocaleString() + '</b> / ' + goal.toLocaleString() + '</span></div>' +
      '<div style="font-size:11px;color:' + BK.sub + '">오늘 목표 ' + Math.round(goal * prog).toLocaleString() + ' · <b style="color:' + col + '">' + (diff >= 0 ? '+' : '') + Math.round(diff).toLocaleString() + '만</b></div></div>';
  }).join('');
  return '<div class="lb-c" style="margin-bottom:10px"><p class="lb-t"><span>' + year + '년 목표 · 올해 ' + Math.round(prog * 100) + '% 지남</span><span>검정 선 = 오늘까지 목표 페이스 · <a href="javascript:void(0)" style="color:#1d5fd1" onclick="switchLedgerTab(\'settings\');setTimeout(function(){ldgSetSubTab(\'goals\');},50)">목표 고치기</a></span></p>' +
    '<div class="lb-goal">' + cells + '</div></div>';
}


// ── 어디서 새나: 지난 달들(뱅샐)을 필수·가치·일회성·습관성으로 나누고, 습관성에서 줄일 곳
var MIRROR_LEAK_FIX = {
  // [아이콘, 색, 이렇게 줄이기, 줄이는 비율]
  '옷':       ['checkroom', '#334155', '여행 직전 달에만 · 장바구니 7일 뒤 결제', 0.6],
  '외식':     ['restaurant', '#334155', '평일 점심은 구내식당 · 외식은 주 2번', 0.33],
  '배달':     ['delivery_dining', '#334155', '평일 낮 0 · 주말 하루만', 0.5],
  '생활 잡화': ['inventory_2', '#334155', '온라인은 금요일 한 번에 모아서', 0.4],
  '구독':     ['autorenew', '#334155', 'AI는 Pro 하나 · 나머지는 회사 돈', 0.7],
  '카페·간식': ['local_cafe', '#334155', '출근길 한 잔만 · 오후 카페는 금요일', 0.4],
  '취미·여가': ['palette', '#334155', '한 달 10만 안에서', 0.35],
  '편의점':   ['storefront', '#334155', '퇴근길 편의점 주 2번', 0.4]
};
// 지출 한 줄 → 네 무리 중 어디 + (습관성이면) 어떤 습관
function _bLeakKind(t) {
  var M = t['대분류'], S = t['소분류'], a = t['금액'] || 0;
  if (M === '여행' || M === '관계비' || M === '경조사비' || S === '할머니용돈' || S === '영어 강의' || S === '도서') return ['가치', null];
  if ((['고정비', '주거비', '세금/보험'].indexOf(M) >= 0 && S !== '정기구독') || M === '교통비' || M === '건강/의료비' || S === '식재료비' || S === '구내식당') return ['필수·고정', null];
  if (a >= 300000 || M === '미분류') return ['일회성', null];
  return ['습관성', M === '품위유지비' ? '옷' : S === '외식비' ? '외식' : S === '배달' ? '배달' : M === '생필품비' ? '생활 잡화' : S === '정기구독' ? '구독' : S === '간식/카페' ? '카페·간식' : M === '여가비' ? '취미·여가' : S === '편의점' ? '편의점' : null];
}
var MIRROR_LEAK_GROUPS = [
  ['필수·고정', '#0f172a', '안 쓰면 안 되는 돈', '관리비·통신·주유·장보기·병원'],
  ['가치', '#0f172a', '내가 원해서 지키는 돈', '여행·가족·선물·영어·책'],
  ['일회성', '#0f172a', '가끔 크게 한 번', '30만↑ 물건·정체 모를 결제'],
  ['습관성', '#d9695e', '자주·조금씩 새는 돈', '옷·외식·배달·카페… 줄일 곳']
];
function _boardLeaks(ym) {
  var txs = (_ledgerData.transactions || []).filter(function(t) { return t['출처'] === '뱅샐' && t.date && _bS(t); });
  var all = Array.from(new Set(txs.map(function(t) { return t.date.slice(0, 7); }))).sort(), months = all.slice(1, -1), N = months.length || 1;
  var win = txs.filter(function(t) { return months.indexOf(t.date.slice(0, 7)) >= 0; });
  var cur = (_ledgerData.transactions || []).filter(function(t) { return t.date && t.date.slice(0, 7) === ym && _bS(t); });
  var grp = {}, hab = {}, cnt = {}, now = {};
  win.forEach(function(t) {
    var k = _bLeakKind(t), a = t['금액'] || 0;
    grp[k[0]] = (grp[k[0]] || 0) + a;
    if (k[1]) { hab[k[1]] = (hab[k[1]] || 0) + a; if (a > 0) cnt[k[1]] = (cnt[k[1]] || 0) + 1; }
  });
  cur.forEach(function(t) { var k = _bLeakKind(t); if (k[1]) now[k[1]] = (now[k[1]] || 0) + (t['금액'] || 0); });
  var total = Object.keys(grp).reduce(function(x, y) { return x + grp[y]; }, 0) || 1, mk = (+ym.slice(5)) + '월';
  window._bLeakStat = { N: N, habit: (grp['습관성'] || 0) / N };
  var boxes = MIRROR_LEAK_GROUPS.map(function(g) {
    var v = (grp[g[0]] || 0) / N;
    return '<div style="border-left:4px solid ' + g[1] + ';padding:2px 0 2px 10px;min-width:0"><div style="font-size:12px;color:' + BK.ink + '"><b>' + g[0] + '</b> · ' + g[2] + '</div>' +
      '<div><span class="lb-n" style="font-size:17px;color:' + g[1] + '">월 ' + _bMan(v) + '만</span><span style="font-size:11px;color:' + BK.sub + '"> · ' + Math.round((grp[g[0]] || 0) / total * 100) + '%</span></div>' +
      '<div style="font-size:11px;color:' + BK.sub + '">' + g[3] + '</div></div>';
  }).join('');
  var keys = Object.keys(hab).sort(function(a, b) { return hab[b] - hab[a]; });
  var cutSum = 0, mx = Math.max.apply(null, keys.map(function(k) { return Math.max(hab[k] / N, now[k] || 0); }).concat([1]));
  var head = '<div style="display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1.4fr) minmax(0,1.5fr) 74px;gap:10px;font-size:11px;color:' + BK.sub + ';font-weight:600;padding:6px 0 4px">' +
    '<span>습관</span><span>평소 한 달 → 줄인 목표 · ' + mk + ' 지금</span><span>이렇게 줄이기</span><span style="text-align:right">아끼는 돈/달</span></div>';
  var rows = keys.map(function(k) {
    var f = MIRROR_LEAK_FIX[k], mon = hab[k] / N, goal = mon * (1 - f[3]), cut = mon - goal, nv = now[k] || 0; cutSum += cut;
    return '<div style="display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1.4fr) minmax(0,1.5fr) 74px;gap:10px;align-items:center;font-size:12px;padding:7px 0;border-top:1px solid #eef1f5">' +
      '<span style="color:' + BK.ink + '"><span class="material-symbols-outlined" style="font-size:16px;vertical-align:-4px;color:' + f[1] + '">' + f[0] + '</span> <b style="font-weight:600">' + k + '</b><br><span style="font-size:11px;color:' + BK.sub + '">평소 한 달 ' + ((cnt[k] || 0) / N).toFixed(0) + '번</span></span>' +
      '<div>' + _bLine(mon / mx * 100, 10, BK.track, '평소 <b class="lb-n" style="color:' + BK.ink + '">' + _bMan(mon) + '</b> → 목표 <b class="lb-n" style="color:' + BK.green + '">' + _bMan(goal) + '</b>',
          '<div style="position:absolute;left:0;top:2.5px;height:10px;width:' + (goal / mx * 100 * 0.55) + '%;background:' + BK.soft + ';z-index:1"></div>', 0.55) +
        _bLine(nv / mx * 100, 5, nv > goal ? BK.red : BK.data, '지금 <b class="lb-n" style="color:' + (nv > goal ? BK.red : BK.ink) + '">' + _bMan(nv) + '</b>', '', 0.55) + '</div>' +
      '<span style="font-size:11.5px;color:' + BK.ink + '">' + f[2] + '</span>' +
      '<b class="lb-n" style="text-align:right;color:' + BK.green + '">−' + _bMan(cut) + '만</b></div>';
  }).join('');
  // 반품: 실제 반품비(29CM 환불에서 뗀 것 + 우체국 택배)
  var retN = win.filter(_bIsReturn).length, retShip = _bSum(win, function(t) { return t['소분류'] === '반품 배송비'; });
  rows += '<div style="display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1.4fr) minmax(0,1.5fr) 74px;gap:10px;align-items:center;font-size:12px;padding:7px 0;border-top:1px solid #eef1f5">' +
    '<span style="color:' + BK.ink + '"><span class="material-symbols-outlined" style="font-size:16px;vertical-align:-4px;color:#334155">undo</span> <b style="font-weight:600">반품</b><br><span style="font-size:11px;color:' + BK.sub + '">' + N + '달 ' + retN + '번</span></span>' +
    '<span style="font-size:11px;color:' + BK.sub + '">반품비로 날린 돈 <b class="lb-n" style="color:' + BK.red + '">' + retShip.toLocaleString() + '원</b> (' + N + '달)</span>' +
    '<span style="font-size:11.5px;color:' + BK.ink + '">사기 전에 사이즈표·후기 · 대부분 사이즈 반품</span><b class="lb-n" style="text-align:right;color:' + BK.green + '">−' + (retShip / N / 10000).toFixed(1) + '만</b></div>';
  return '<div class="lb-c" style="margin-top:10px"><p class="lb-t"><span>어디서 새나 · 지난 ' + N + '달을 평균 낸 한 달</span><span>네 무리로 나눔</span></p>' +
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:12px;margin-bottom:10px">' + boxes + '</div>' +
    '<div style="font-size:12px;color:' + BK.ink + ';font-weight:600;margin-top:4px">습관성(빨강)만 줄이면 돼요 · 가치(여행·사람)는 지켜요</div>' +
    '<div style="font-size:11px;color:' + BK.sub + '">두꺼운 막대 = 평소 한 달, 그중 진한 칸 = 줄인 목표 · 얇은 막대 = ' + mk + ' 지금까지 (목표 넘으면 빨강)</div>' + head + rows +
    (window._bLeakStat.cut = cutSum, '') + '<div style="display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap;padding-top:8px;border-top:1px solid #eef1f5"><span style="font-size:12px;color:' + BK.ink + '">위 방법대로 다 하면 한 달에 아끼는 돈</span><span><b class="lb-n" style="font-size:18px;color:' + BK.green + '">월 ' + _bMan(cutSum) + '만</b><span style="font-size:12px;color:' + BK.sub + '"> = 1년 ' + _bMan(cutSum * 12) + '만</span></span></div></div>';
}


// ── 통장 나누기 (상여 없는 평달 기준, 원) — 2026-10-15 누리와 정함
var MIRROR_SPLIT = [
  // [이름, 계획, 색, 설명]
  ['고정', 950000, '#2f7ff0', '할머니·관리비·월주차·통신·구독'],
  ['연간 적립', 230000, '#334155', '영어 수업료·종소세 미리'],
  ['생활비', 1830000, '#2f7ff0', '카드 한 장 · 아래 칸별 한도'],
  ['여행', 0, '#2f7ff0', '매달 X · 200~300씩 한 번에'],
  ['집 자금', 1690000, '#3fa37f', '2027-04부터 이주 자금']
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
  ['병원·약', 'medical_services', function(t) { return t['대분류'] === '건강/의료비'; }, 50000],
  ['주유·교통', 'local_gas_station', function(t) { return t['대분류'] === '교통비' && t['소분류'] !== '주차비'; }, 220000],
  ['취미·여가', 'palette', function(t) { return t['대분류'] === '여가비'; }, 100000],
  ['책·공부', 'menu_book', function(t) { return t['대분류'] === '자기계발비' && t['소분류'] !== '영어 강의'; }, 100000],
  ['사람', 'groups', function(t) { return (t['대분류'] === '관계비' || t['대분류'] === '경조사비') && t['소분류'] !== '할머니용돈'; }, 100000]
];
// 2027 생활비 칸별 기본 한도 (총 207만) — 도전안: 지출 4,600만 · 저축 4,550만
var MIRROR_LIVING_2027 = { '외식': 160000, '배달': 60000, '카페·간식': 70000, '장보기': 130000, '편의점': 20000, '옷·뷰티': 300000, '물건': 250000, '병원·약': 100000, '주유·교통': 220000, '취미·여가': 70000, '책·공부': 60000, '사람': 410000 };
function _bLivingCap(ym, name) {
  if (ym >= '2027-01' && MIRROR_LIVING_2027[name] != null) return MIRROR_LIVING_2027[name];
  for (var i = 0; i < MIRROR_LIVING.length; i++) if (MIRROR_LIVING[i][0] === name) return MIRROR_LIVING[i][3];
  return 0;
}
var MIRROR_SPLIT_2027 = [
  ['고정', 700000, '', '할머니·월주차·통신·구독 (관리비 15만은 소리가 → 저축으로 · 집 이자 4월에 끝)'],
  ['연간 적립', 250000, '', '영어 수업료·종소세 미리'],
  ['생활비', 1850000, '', '카드 한 장 · 아래 칸별 한도'],
  ['여행', 0, '', '덴마크 6월 · 프랑스 12월 · 인센·적립으로 한 번에'],
  ['집 자금', 3850000, '', '평달 저축 · 4월부터 이주 자금 (관리비 몫 +15만)']
];
function _bSplitPlan(ym) { return ym >= '2027-01' ? MIRROR_SPLIT_2027 : MIRROR_SPLIT; }
var _bFixed = function(t) { return ['고정비', '주거비', '세금/보험'].indexOf(t['대분류']) >= 0 || t['소분류'] === '주차비' || t['소분류'] === '할머니용돈'; };
var _bAnnual = function(t) { return t['소분류'] === '영어 강의' || /종합소득|국세/.test(t['세부사항'] || ''); };
function _bLivingRow(t) { for (var i = 0; i < MIRROR_LIVING.length; i++) if (MIRROR_LIVING[i][2](t)) return i; return -1; }

// ── 앞으로의 계획 (2026-10-15 누리와 정함 · 2027 도전안). 단위 원, 세후 통장 기준 예상
var MIRROR_PROJ = {
  salary: function(ym) { return ym >= '2027-04' ? 3850000 : 3533000; },      // 10% 인상은 4월부터(3월분 소급은 4월 기타에)
  bonus: { '2026-10': 5100000, '2027-04': 3260000, '2027-10': 5570000 },       // 인센 세후 (A 168% · B 100.8% 가정)
  extra: { '2027-02': [1000000, '연말정산'], '2027-04': [2250000, '근속·소급'] },
  pota: function(ym) { return ym < '2026-12' ? 1400000 : ym === '2026-12' ? 1300000 : 2500000; },
  side: function(ym) { return ym >= '2027-01' ? 330000 : 0; },                 // 새 부수입 연 400
  events: { '2026-10': '인센 → OK', '2026-11': '블프 0 · 옷 0', '2026-12': '송년 사람 40 · 새 연재', '2027-01': '목표 시작', '2027-02': '환급 → OK · 설',
            '2027-03': '집 2,500 완성', '2027-04': '인센B · 근속 → 덴마크 · 집 상환', '2027-05': '종소세', '2027-10': '인센A → 프랑스' }
};
// 여행별 실제 비용(결제↔취소 짝 지우고 보증금 뺀 값, 2026-10-16 누리 확인)
// 체코: 2025-11-01~2026-05-09 해외 여행 줄 순합(환불 포함) − 4/11 독일용 예약(5/10 환불분) · 국내(전주)·롯데호텔 뷔페 제외 (2026-10-16 재계산)
var MIRROR_TRIP_ACTUAL = { '2026': [['체코·크로아티아', 6090000], ['독일·이탈리아', 6670000]], '2026note': '체코 368만은 2025년 결제' };
var MIRROR_INC_COLORS = { '월급': '#2f7ff0', '인센': '#1d4ed8', '부업': '#7fb2f7', '기타': '#bcd5fb' };
function _bProj(ym) {
  var now = new Date(), nowYm = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
  var inc = { '월급': MIRROR_PROJ.salary(ym), '인센': MIRROR_PROJ.bonus[ym] || 0, '부업': MIRROR_PROJ.pota(ym), '기타': MIRROR_PROJ.side(ym) + ((MIRROR_PROJ.extra[ym] || [0])[0]) };
  if (ym <= nowYm) {  // 이미 들어온 건 실제로
    var today = now.toISOString().slice(0, 10);
    var L = _bRows(ym).filter(function(t) { return t['출처'] === '뱅샐' && t.date <= today; }), sal = L.filter(function(t) { return t['대분류'] === '수입' && t['소분류'] === '월급' && t['금액'] >= 2500000; });
    var pota = _bSum(L, function(t) { return t['대분류'] === '수입' && t['소분류'] === '부업'; });
    if (pota) inc['부업'] = pota;
    if (sal.length) { var tot = sal.reduce(function(a, t) { return a + t['금액']; }, 0), reg = MIRROR_PROJ.salary(ym); inc['월급'] = Math.min(tot, reg); inc['인센'] = Math.max(0, tot - reg); }
  }
  var plan = _bPlan(ym), y27 = ym >= '2027-01';
  var spend = (plan.fixedCap != null ? plan.fixedCap : (y27 ? 700000 : 950000)) + (plan.annualCap != null ? plan.annualCap : (y27 ? 250000 : 230000)) + plan.living;
  var trip = (_boardExtra.trips || []).filter(function(t) { return t.start.slice(0, 7) === ym; })[0];
  var ev = MIRROR_PROJ.events[ym] || '';
  if (_bClothesMonth(ym)) ev += (ev ? ' · ' : '') + '옷 달';
  if (trip) ev += (ev ? ' · ' : '') + trip.title.replace(/&/g, '·') + ' ✈';
  var total = 0; Object.keys(inc).forEach(function(k) { total += inc[k]; });
  return { inc: inc, total: total, spend: spend, save: total - spend, ev: ev };
}
// 색 나눈 막대 + 막대 밑에 '이름 금액' (칸 가운데)
function _bStack(parts, scale, h) {
  var tot = parts.reduce(function(a, p) { return a + Math.max(0, p[1]); }, 0), x = 0, segs = '', tags = [];
  parts.forEach(function(p) {
    if (p[1] <= 0) return;
    var w = p[1] / scale * 100;
    segs += '<div title="' + p[0] + ' ' + _bMan(p[1]) + '만" style="width:' + w + '%;background:' + p[2] + ';border-right:2px solid #fff"></div>';
    tags.push({ p: x + w / 2, h: '<span style="color:' + BK.sub + '">' + p[0] + '</span> <b class="lb-n" style="color:' + BK.ink + '">' + _bMan(p[1]) + '</b>' });
    x += w;
  });
  return '<div style="display:flex;height:' + (h || 12) + 'px">' + segs + '</div>' + _bTags(tags);
}
// 보고 있는 해 한 장: 지난 달은 실제(뱅샐), 이번 달부터는 계획. 2027은 도전안
function _bActual(ym) {
  var today = new Date().toISOString().slice(0, 10);
  var L = _bRows(ym).filter(function(t) { return t['출처'] === '뱅샐' && t.date <= today; });
  var sal = _bSum(L, function(t) { return t['대분류'] === '수입' && t['소분류'] === '월급' && t['금액'] >= 2500000; }), reg = MIRROR_PROJ.salary(ym);
  var over = Math.max(0, sal - reg), bonusMonth = /-(04|10)$/.test(ym);  // 인센은 4·10월, 그 밖에 더 들어온 건 연말정산 등 기타
  var inc = { '월급': Math.min(sal, reg), '인센': bonusMonth ? over : 0, '부업': _bSum(L, function(t) { return t['대분류'] === '수입' && t['소분류'] === '부업'; }),
              '기타': (bonusMonth ? 0 : over) + _bSum(L, function(t) { return t['대분류'] === '수입' && !(t['소분류'] === '월급' && t['금액'] >= 2500000) && t['소분류'] !== '부업'; }) };
  var total = 0; Object.keys(inc).forEach(function(k) { total += inc[k]; });
  var spend = _bSum(L, _bS), travel = _bSum(L, function(t) { return t['대분류'] === '여행'; });
  return { inc: inc, total: total, spend: spend, travel: travel, save: total - spend, ev: '', actual: true };
}
function _bYearActual(Y) {
  var T = (_ledgerData.transactions || []).filter(function(t) { return t.date && t.date.slice(0, 4) === Y; });
  var inc = { '월급': 0, '인센': 0, '부업': 0, '기타': 0 }, sp = { '고정·세금': 0, '생활': 0, '여행': 0 }, prevSal = 0, months = 0;
  for (var i = 1; i <= 12; i++) {
    var ym = Y + '-' + String(i).padStart(2, '0'), M = T.filter(function(t) { return t.date.slice(0, 7) === ym; });
    var hasB = M.some(function(t) { return t['출처'] === '뱅샐'; }), L = M.filter(function(t) { return (t['출처'] === '뱅샐') === hasB; });
    if (!L.length) continue; months++;
    var isSal = function(t) { return t['대분류'] === '수입' && t['소분류'] === '월급' && t['금액'] >= 2500000; };
    var sal = _bSum(L, isSal), bonus = /-(04|10)$/.test(ym), base = bonus && prevSal ? Math.min(sal, prevSal) : sal;
    inc['월급'] += base; inc['인센'] += sal - base; if (!bonus && sal) prevSal = sal;
    inc['부업'] += _bSum(L, function(t) { return t['대분류'] === '수입' && t['소분류'] === '부업'; });
    inc['기타'] += _bSum(L, function(t) { return t['대분류'] === '수입' && !isSal(t) && t['소분류'] !== '부업' && t['소분류'] !== '계'; });
    L.filter(function(t) { return _bS(t) && !(t['금액'] >= 5000000 && /집 대출/.test((t['메모'] || '') + (t['세부사항'] || '')) && !/이자/.test((t['메모'] || '') + (t['세부사항'] || ''))); }).forEach(function(t) {
      sp[t['대분류'] === '여행' ? '여행' : (_bFixed(t) || _bAnnual(t)) ? '고정·세금' : '생활'] += t['금액'];
    });
  }
  var it = inc['월급'] + inc['인센'] + inc['부업'] + inc['기타'], st = sp['고정·세금'] + sp['생활'] + sp['여행'];
  return { inc: inc, sp: sp, income: it, spend: st, save: it - st, months: months };
}
// 작년 비교 한 줄: 얇은 막대(같은 자) + 위에 '작년 N → 올해 ±M (±%)'
function _bPrevRow(label, cur, prev, segs, scale, upGood, man) {
  var d = cur - prev, pct = prev ? Math.round(d / Math.abs(prev) * 100) : 0, good = upGood ? d >= 0 : d <= 0;
  var x = 0, bars = (segs || [[label, prev, '#94a3b8']]).filter(function(sg) { return sg[1] > 0; }).map(function(sg) { var w = Math.max(0, sg[1] / scale * 100); var h = '<div title="' + sg[0] + ' ' + man(sg[1]) + '" style="position:absolute;left:' + x + '%;width:' + w + '%;top:0;bottom:0;background:' + sg[2] + ';opacity:.75;border-right:2px solid #fff"></div>'; x += w; return h; }).join('');
  return '<div style="padding-right:86px;margin-top:8px"><div style="font-size:11.5px;color:' + BK.sub + ';margin-bottom:3px">작년 <b class="lb-n" style="color:' + BK.ink + '">' + man(prev) + '</b> → 올해 <b class="lb-n" style="color:' + (good ? BK.green : BK.red) + '">' + (d >= 0 ? '+' : '−') + man(Math.abs(d)) + (prev ? ' (' + (pct >= 0 ? '+' : '') + pct + '%)' : '') + '</b></div>' +
    '<div style="position:relative;height:10px;background:#f1f5f9">' + bars + '</div></div>';
}
// 집 마지막 상환: 이미 냈으면 데이터(저축/집 상환), 아직이면 계획 (2027-04 2,500 · 누리)
var BOARD_HOUSE_PLAN = { '2027': ['2027-04', 25000000] };
function _bHousePay(Y) {
  var L = (_ledgerData.transactions || []).filter(function(t) { return t.date && t.date.slice(0, 4) === Y && t['대분류'] === '저축' && t['소분류'] === '집 상환' && Math.abs(t['금액']) >= 5000000; });
  if (L.length) return { ym: L[0].date.slice(0, 7), amt: L.reduce(function(a, t) { return a + Math.abs(t['금액']); }, 0), done: true };
  var pl = BOARD_HOUSE_PLAN[Y]; return pl ? { ym: pl[0], amt: pl[1], done: false } : null;
}
function _boardPlanCard(year) {
  var now = new Date(), cur = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0'), Y = String(year);
  var months = []; for (var i = 1; i <= 12; i++) months.push(Y + '-' + String(i).padStart(2, '0'));
  var P = months.map(function(ym) { return [ym, ym < cur ? _bActual(ym) : _bProj(ym)]; }).filter(function(x) { return x[1].total > 0 || x[0] >= cur; });
  if (!P.length) return '';
  var mx = Math.max.apply(null, P.map(function(x) { return x[1].total; }).concat([1]));
  var keys = ['월급', '인센', '부업', '기타'];
  var y = { '월급': 0, '인센': 0, '부업': 0, '기타': 0 }, ysLife = 0, ysTrip = 0;
  P.forEach(function(x) { keys.forEach(function(k) { y[k] += x[1].inc[k]; }); if (x[1].actual) { ysLife += x[1].spend - x[1].travel; ysTrip += x[1].travel; } else ysLife += x[1].spend; });
  if (cur.slice(0, 4) === Y) ysTrip += _bActual(cur).travel;  // 이번 달 이미 쓴 여행비
  (_boardExtra.trips || []).forEach(function(t) { if (t.start.slice(0, 4) === Y && t.start.slice(0, 7) >= cur) ysTrip += t.own; });
  var ys = ysLife + ysTrip, yt = keys.reduce(function(a, k) { return a + y[k]; }, 0), ysave = yt - ys;
  var g = (typeof ldgLoadGoals === 'function' ? ldgLoadGoals() : {})[Y] || {};
  var tgt = function(v) { return v ? '<span style="font-weight:400;color:' + BK.sub + '"> / ' + Number(v).toLocaleString() + '</span>' : ''; };
  var gI = (g['수입'] || 0) * 1e4, gS = (g['지출'] || 0) * 1e4, gV = (g['저축'] || 0) * 1e4;
  var ymx = Math.max(yt, ys, gI, gS, gV, 1) * 1.22, man = function(x) { return Math.round(x / 1e4).toLocaleString(); };
  // 집 상환: 지출 아님(통장 → 집 지분). 막대엔 '그해 상환 달 전까지 모은 몫'만 칠하고, 나머지는 작년까지 모은 돈이라고 적는다 (누리 2026-10-16)
  var hp = _bHousePay(Y), houseThis = 0, houseNote = '';
  if (hp) {
    var before = P.filter(function(x) { return x[0] < hp.ym; }).reduce(function(a, x) { return a + x[1].save; }, 0);
    houseThis = Math.max(0, Math.min(hp.amt, before, ysave));
    houseNote = '<div style="font-size:11.5px;color:' + BK.sub + ';margin-top:4px">' + (+hp.ym.slice(5)) + '월 집 상환 <b class="lb-n" style="color:' + BK.ink + '">' + man(hp.amt) + '</b>' + (hp.done ? '' : ' 예정') + ' = ' +
      (houseThis > 0 ? '올해 ' + (+hp.ym.slice(5) - 1) + '월까지 모은 <b class="lb-n" style="color:' + BK.ink + '">' + man(houseThis) + '</b> + ' : '') + '작년까지 모은 <b class="lb-n" style="color:' + BK.ink + '">' + man(hp.amt - houseThis) + '</b> · 지출 아님(집 지분)' + '</div>';
  }
  // 줄 이름 밑에 그 줄 합계 (막대 끝 바깥은 남음·넘음만 — 카드 밖으로 안 넘치게)
  var yrow = function(lbl, bul, v) { return '<div style="display:grid;grid-template-columns:58px minmax(0,1fr);gap:12px;align-items:start;padding:6px 0"><div style="padding-top:16px;line-height:1.25"><b style="font-size:12.5px">' + lbl + '</b>' + (v != null ? '<div class="lb-n" style="font-size:14px;font-weight:700;color:' + BK.ink + '">' + man(v) + '</div>' : '') + '</div><div>' + bul + '</div></div>'; };
  var tripLine = MIRROR_TRIP_ACTUAL[Y] ? '<div style="font-size:11px;color:' + BK.sub + ';margin-top:3px">여행 ' + MIRROR_TRIP_ACTUAL[Y].map(function(t) { return t[0] + ' <b class="lb-n" style="color:' + BK.ink + '">' + _bMan(t[1]) + '</b>'; }).join(' · ') + (MIRROR_TRIP_ACTUAL[Y + 'note'] ? ' · ' + MIRROR_TRIP_ACTUAL[Y + 'note'] : '') + '</div>' : '';
  var segTags = function(segs, cap) { var sc = Math.max(cap || 0, segs.reduce(function(a, x) { return a + Math.max(0, x[1]); }, 0), 1); return '<div style="padding-right:86px">' + _bTags(segs.filter(function(x) { return x[1] > 0; }).reduce(function(acc, x) { var st = acc.x; acc.x += x[1] / sc * 100; acc.t.push({ p: st + x[1] / sc * 50, h: '<span style="color:' + BK.sub + '">' + x[0] + ' <b class="lb-n" style="color:' + BK.ink + '">' + man(x[1]) + '</b></span>' }); return acc; }, { x: 0, t: [] }).t) + '</div>'; };
  var incSegs = keys.map(function(k) { return [k, y[k], MIRROR_INC_COLORS[k]]; });
  // 쓰기 = 고정·세금 / 생활(지난 달 실제) / 남은 달 계획(빗금) / 여행 — 생활은 아래 얇은 막대로 펼침 (누리 B안 2026-10-16)
  var SPC = { k: '#b8433a', m: '#d9695e', l: '#e9a39b', p: '#f3cdc8' }, today = now.toISOString().slice(0, 10);
  var grp = { '고정·세금': 0, '사람': 0, '물건': 0, '옷·뷰티': 0, '먹는 것': 0, '그 밖': 0 }, lastAct = 0, firstProj = 0, ysProj = 0;
  P.forEach(function(x) {
    var mo = +x[0].slice(5);
    if (!x[1].actual) { ysProj += x[1].spend; if (!firstProj) firstProj = mo; return; }
    lastAct = mo;
    _bRows(x[0]).filter(function(t) { return t['출처'] === '뱅샐' && t.date <= today && _bS(t) && t['대분류'] !== '여행'; }).forEach(function(t) {
      var r = _bLivingRow(t), nm = r >= 0 && MIRROR_LIVING[r] ? MIRROR_LIVING[r][0] : '';
      var k = (_bFixed(t) || _bAnnual(t)) ? '고정·세금' : grp[nm] != null ? nm : (/^(외식|배달|카페·간식|장보기|편의점)$/.test(nm) || t['대분류'] === '식비') ? '먹는 것' : '그 밖';
      grp[k] += t['금액'];
    });
  });
  var lifeV = grp['사람'] + grp['물건'] + grp['옷·뷰티'] + grp['먹는 것'] + grp['그 밖'];
  var spSegs = [['고정·세금', grp['고정·세금'], SPC.l], ['생활' + (lastAct ? ' 1~' + lastAct + '월' : ''), lifeV, SPC.k], [firstProj + '~12월 계획', ysProj, SPC.p, 1], ['여행', ysTrip, SPC.m]].filter(function(x) { return x[1] > 0; });
  var yoy = false; try { yoy = localStorage.getItem('atelier_board_yoy') === '1'; } catch (e) {}
  var PV = yoy ? _bYearActual(String(year - 1)) : null, hasPV = PV && PV.months > 0;
  var scI = Math.max(gI || yt, yt, hasPV ? PV.income : 0, 1), scS = Math.max(gS || ys, ys, hasPV ? PV.spend : 0, 1), scV = Math.max(gV || ysave, ysave, hasPV ? PV.save : 0, 1);
  var spSc = scS, lifeL = grp['고정·세금'] / spSc * 100, lifeW = lifeV / spSc * 100;
  var lifeSegs = [['사람', grp['사람'], SPC.k], ['물건', grp['물건'], SPC.k], ['옷·뷰티', grp['옷·뷰티'], SPC.k], ['먹는 것', grp['먹는 것'], SPC.m], ['그 밖', grp['그 밖'], SPC.l]].filter(function(x) { return x[1] > 0; });
  var lifeBar = lifeV > 0 ? '<div style="padding-right:86px"><div style="position:relative;margin-left:' + lifeL + '%;width:' + lifeW + '%">' +
    '<div style="height:8px;border:1px solid ' + SPC.k + ';border-top:0;margin-bottom:3px"></div>' +
    '<div style="position:relative;height:17px">' + lifeSegs.reduce(function(acc, x) { var w = x[1] / lifeV * 100; acc.h += '<div title="' + x[0] + ' ' + man(x[1]) + '" style="position:absolute;left:' + acc.x + '%;width:' + w + '%;top:0;bottom:0;background:' + x[2] + ';border-right:2px solid #fff">' + (w >= 6 ? '<span style="position:absolute;left:5px;top:0;line-height:17px;font-size:11px;font-weight:700;color:' + _bPctInk(x[2]) + '">' + Math.round(w) + '%</span>' : '') + '</div>'; acc.x += w; return acc; }, { x: 0, h: '' }).h + '</div>' +
    _bTags(lifeSegs.reduce(function(acc, x) { var w = x[1] / lifeV * 100; acc.t.push({ p: acc.x + w / 2, h: '<span style="color:' + BK.sub + '">' + x[0] + ' <b class="lb-n" style="color:' + BK.ink + '">' + man(x[1]) + '</b></span>' }); acc.x += w; return acc; }, { x: 0, t: [] }).t) +
    '</div></div>' : '';
  var pvI = hasPV ? _bPrevRow('수입', yt, PV.income, keys.map(function(k) { return [k, PV.inc[k], MIRROR_INC_COLORS[k]]; }), scI, true, man) : '';
  var pvS = hasPV ? _bPrevRow('쓰기', ys, PV.spend, [['고정·세금', PV.sp['고정·세금'], SPC.l], ['생활', PV.sp['생활'], SPC.k], ['여행', PV.sp['여행'], SPC.m]], scS, false, man) : '';
  var pvV = hasPV ? _bPrevRow('모으기', ysave, PV.save, [['모으기', PV.save, BK.green]], scV, true, man) : '';
  var head = yrow('수입', _bBullet({ v: yt, cap: gI || yt, scaleMin: scI, mode: 'goal', segs: incSegs, noVal: 1, fmt: man, edit: 'goal|' + Y + '|수입', capLabel: '목표' }) + segTags(incSegs, scI) + pvI, yt) +
    yrow('쓰기', _bBullet({ v: ys, cap: gS || ys, scaleMin: scS, mode: 'limit', segs: spSegs, noVal: 1, fmt: man, edit: 'goal|' + Y + '|지출', capLabel: '한도' }) + segTags(spSegs, scS) + lifeBar + pvS + tripLine, ys) +
    yrow('모으기', _bBullet({ v: ysave, cap: gV || ysave, scaleMin: scV, mode: 'goal', color: BK.green, noVal: 1, fmt: man, edit: 'goal|' + Y + '|저축', capLabel: '목표',
      segs: houseThis > 0 ? [['집 상환', houseThis, '#23855f', 1], ['현금으로 남기', ysave - houseThis, BK.green]] : null }) +
      (houseThis > 0 ? segTags([['집 상환', houseThis], ['현금으로 남기', ysave - houseThis]], scV) : '') + houseNote + pvV, ysave) +
    '<div style="text-align:right;margin-top:2px"><button class="lb-more" onclick="try{localStorage.setItem(\'atelier_board_yoy\',\'' + (yoy ? '0' : '1') + '\')}catch(e){};ldgRenderBoard()">' + (yoy ? '전년 비교 접기 ▴' : '+ 전년 비교') + '</button>' +
    (yoy ? '<div style="font-size:11px;color:' + BK.sub + ';margin-top:2px">작년 = ' + (year - 1) + '년 실제' + (year - 1 === 2025 ? ' · 1~9월은 아뜰리에 수기 기록(계·집 원금 뺌), 10월부터 은행 연동' : '') + ' · 올해는 계획 포함</div>' : '') + '</div>';
  var view = Y + '-' + String(_ldgMonth).padStart(2, '0'), open = false;
  try { open = localStorage.getItem('atelier_board_plan_open') === '1'; } catch (e) {}
  // 접었을 때: 12칸 띠 — 칸마다 남은 돈(초록 모음 · 빨강 적자), 보고 있는 달은 테두리, 누르면 그 달로
  var smx = Math.max.apply(null, P.map(function(x) { return Math.abs(x[1].save); }).concat([1]));
  var strip = '<div style="display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:4px;margin-top:16px">' + months.map(function(ym) {
    var x = P.filter(function(q) { return q[0] === ym; })[0], sv = x ? x[1].save : null, on = ym === view;
    var hgt = sv == null ? 0 : Math.max(3, Math.abs(sv) / smx * 34);
    return '<div onclick="_ldgYear=' + (+ym.slice(0, 4)) + ';_ldgMonth=' + (+ym.slice(5)) + ';ldgRenderMonthly()" style="cursor:pointer;position:relative;padding:4px 2px 3px;text-align:center;border:' + (on ? '2px solid ' + BK.data : '1px solid #e2e8f0') + ';background:' + (on ? '#dbeafe' : x && !x[1].actual ? '#f5f9ff' : '#fff') + (on ? ';box-shadow:0 2px 0 ' + BK.data : '') + '">' +
      (on ? '<div style="position:absolute;top:-9px;left:50%;transform:translateX(-50%);font-size:10px;font-weight:700;color:#fff;background:' + BK.data + ';padding:0 5px;white-space:nowrap">보는 달</div>' : '') +
      '<div style="height:36px;display:flex;align-items:flex-end;justify-content:center"><div style="width:60%;height:' + hgt + 'px;background:' + (sv == null ? 'transparent' : sv >= 0 ? BK.green : BK.red) + '"></div></div>' +
      '<div class="lb-n" style="font-size:11px;color:' + (sv == null ? BK.mute : sv >= 0 ? BK.green : BK.red) + '">' + (sv == null ? '·' : _bMan(sv)) + '</div>' +
      '<div style="font-size:' + (on ? 12 : 11) + 'px;color:' + (on ? BK.dataText : BK.ink) + ';font-weight:' + (on ? 800 : 400) + '">' + (+ym.slice(5)) + '월</div></div>';
  }).join('') + '</div>' +
    '<div style="display:flex;justify-content:space-between;font-size:11px;color:' + BK.sub + ';margin-top:4px"><span>막대 = 그 달 남은 돈 · 흰 칸 실제 · 파란 칸 계획</span>' +
    '<button class="lb-more" onclick="try{localStorage.setItem(\'atelier_board_plan_open\',\'1\')}catch(e){};ldgRenderBoard()">달별로 펼치기 ▾</button></div>';
  var cols = 'grid-template-columns:46px minmax(0,1fr) 52px 52px minmax(0,0.9fr)';
  var rows = P.map(function(x) {
    var ym = x[0], p = x[1];
    return '<div style="display:grid;' + cols + ';gap:8px;align-items:start;font-size:12px;padding:6px 0;border-top:1px solid #eef1f5' + (ym === view ? ';background:#dbeafe;box-shadow:inset 4px 0 0 ' + BK.data + ';padding-left:8px' : '') + '">' +
      '<b style="padding-top:1px;color:' + (ym === view ? BK.dataText : p.actual ? BK.sub : BK.ink) + (ym === view ? ';font-weight:800' : '') + '">' + ym.slice(2).replace('-', '.') + '</b>' +
      '<div>' + _bStack(keys.map(function(k) { return [k, p.inc[k], MIRROR_INC_COLORS[k]]; }), mx * 1.02, 10) + '</div>' +
      '<b class="lb-n" style="text-align:right;padding-top:1px">' + _bMan(p.total) + '</b>' +
      '<b class="lb-n" style="text-align:right;padding-top:1px;color:' + (p.save >= 0 ? BK.green : BK.red) + '">' + _bMan(p.save) + '</b>' +
      '<span style="font-size:11px;color:' + BK.ink + ';padding-top:1px">' + (p.actual ? '<span style="color:' + BK.sub + '">실제 · 쓴 돈 ' + _bMan(p.spend) + '</span>' : _bEsc(p.ev)) + '</span></div>';
  }).join('');
  var title = Y === '2027' ? '2027 계획 · 도전안' : Y + ' 한 해 · 지난 달은 실제, ' + (+cur.slice(5)) + '월부터 계획';
  var table = '<div style="display:grid;' + cols + ';gap:8px;font-size:11px;color:' + BK.sub + ';font-weight:600;margin-top:12px;padding-bottom:2px"><span>달</span><span>들어온 · 들어올 돈</span><span style="text-align:right">합계</span><span style="text-align:right">남은 돈</span><span>이 달</span></div>' + rows +
    '<div style="text-align:right"><button class="lb-more" onclick="try{localStorage.setItem(\'atelier_board_plan_open\',\'0\')}catch(e){};ldgRenderBoard()">접기 ▴</button></div>';
  return '<div class="lb-c" style="margin-bottom:10px"><p class="lb-t"><span>' + title + '</span><span>만 원 · 세후 통장 기준</span></p>' + head + (open ? table : strip) + '</div>';
}

// 카테고리별 집계와 같은 칸·같은 예산 (누리: 두 곳이 다르면 헷갈림, 2026-10-16)
var BOARD_CATS = [['주거비', 'home'], ['고정비', 'receipt_long'], ['교통비', 'directions_car'], ['식비', 'restaurant'], ['건강/의료비', 'medical_services'], ['생필품비', 'inventory_2'],
  ['자기계발비', 'menu_book'], ['여가비', 'palette'], ['품위유지비', 'checkroom'], ['관계비', 'groups'], ['경조사비', 'celebration'], ['세금/보험', 'shield']];
// 집계 화면과 똑같은 규칙: 카테고리 예산 → 없으면 소분류 예산 합
function _bCatBudget(cat, ym) {
  var B = _ledgerData.budgets || {}, cb = B[cat], has = false, v = 0;
  if (cb && (cb.default !== undefined || (cb.overrides && Object.keys(cb.overrides).length))) { has = true; v = cb.overrides && cb.overrides[ym] !== undefined ? cb.overrides[ym] : (cb.default || 0); }
  else Object.keys(B).forEach(function(k) { if (k.indexOf(cat + '.') === 0) { has = true; v += B[k].overrides && B[k].overrides[ym] !== undefined ? B[k].overrides[ym] : (B[k].default || 0); } });
  return { v: v, has: has };
}
// 평소 한 달: 생활 칸은 달 합의 가운데값. 고정 성격 칸(주거·고정·세금/보험)은 6달 중 4달 이상 낸 소분류만(정기 결제),
// 1년 한두 번 몰아 내는 것(재산세·자동차세·자동차보험·종소세)과 끊은 것(미래에셋 6월까지)은 빼고, 집 이자는 달 8만으로 (2,500만×4%÷12 · 누리 2026-10-16)
var BOARD_FIXEDLIKE = ['주거비', '고정비', '세금/보험'], BOARD_HOUSE_INTEREST = 80000;
// 남이 내 주기로 한 것: 그 달부터 평소에서 뺌 (관리비 = 동생 소리가 2026-10부터 · 누리 2026-10-16)
var BOARD_PAID_BY_OTHERS = { '관리비': '2026-10' };
function _bTypical(cat, f, all, ms, median, ym) {
  var monthly = function(g) { return ms.map(function(ym2) { return _bSum(all, function(t) { return f(t) && g(t) && t.date.slice(0, 7) === ym2; }); }); };
  if (BOARD_FIXEDLIKE.indexOf(cat) < 0) return median(monthly(function() { return true; }));
  var subs = {}; all.filter(function(t) { return f(t) && ms.indexOf(t.date.slice(0, 7)) >= 0; }).forEach(function(t) { subs[t['소분류'] || '기타'] = 1; });
  var v = 0;
  Object.keys(subs).forEach(function(sb) {
    if (sb === '대출이자' || (BOARD_PAID_BY_OTHERS[sb] && ym >= BOARD_PAID_BY_OTHERS[sb])) return;
    var arr = monthly(function(t) { return (t['소분류'] || '기타') === sb; });
    if (arr.filter(function(x) { return x > 0; }).length >= 4) v += median(arr);
  });
  return v + (cat === '주거비' ? BOARD_HOUSE_INTEREST : 0);
}
function _boardCats(ym, m, preview) {
  var mk = (+ym.slice(5)) + '월';
  var now = new Date(), curYm = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0'), cut = ym === curYm ? now.getDate() : 31;
  var L = (m && !preview) ? m.L.filter(_bS) : [];
  // 예정: 집계 화면처럼 아직 안 빠져나간 정기 결제(주차·기부·정수기 등 손으로 넣어 둔 줄)도 이 달 몫으로 — 빗금
  var todayS = now.toISOString().slice(0, 10);
  var paidSubs = {}; _bRows(ym).forEach(function(t) { if (t['출처'] === '뱅샐' && _bS(t)) paidSubs[t['대분류'] + '|' + t['소분류']] = 1; });
  // 이미 은행에서 빠져나간 같은 소분류(정수기 등)는 예정에서 뺀다 — 자동(고정) 줄과 실제 결제 이중 집계 방지
  var due = preview ? [] : _bRows(ym).filter(function(t) { return t['출처'] !== '뱅샐' && t.date > todayS && _bS(t) && t['금액'] > 0 && !paidSubs[t['대분류'] + '|' + t['소분류']]; });
  var ly = (function() { try { return ldgBoardMonth(_bYm(ym, -12), true).L.filter(function(t) { return _bS(t) && +t.date.slice(8, 10) <= cut; }); } catch (e) { return []; } })();
  var all = (_ledgerData.transactions || []).filter(function(t) { return t['출처'] === '뱅샐' && t.date && _bS(t); });
  var ms = Array.from(new Set(all.map(function(t) { return t.date.slice(0, 7); }))).filter(function(x) { return x < curYm; }).sort().slice(-6);  // 최근 6달 — 끊은 보험(미래에셋 4월~) 같은 옛 지출이 안 섞이게
  // 평소 = 달마다 합의 가운데값 — 몇 달치 이자·1년 한 번 보험처럼 한꺼번에 낸 달은 평소를 끌어올리지 않게 (평균 아님)
  var median = function(arr) { if (!arr.length) return 0; var a = arr.slice().sort(function(x, y) { return x - y; }), h = a.length >> 1; return a.length % 2 ? a[h] : (a[h - 1] + a[h]) / 2; };
  var data = BOARD_CATS.map(function(c) {
    var f = function(t) { return t['대분류'] === c[0]; }, bud = _bCatBudget(c[0], ym), subs = {};
    L.filter(f).forEach(function(t) { var k = t['소분류'] || '기타'; subs[k] = (subs[k] || 0) + t['금액']; });
    var dueL = due.filter(f);
    return { name: c[0], icon: c[1], cap: bud.v, has: bud.has, v: _bSum(L, f), dv: _bSum(dueL, f), dueL: dueL, lv: _bSum(ly, f), av: _bTypical(c[0], f, all, ms, median, ym), subs: subs };
  });
  var totV = 0, totCap = 0;
  var row = function(d) {
    var tv = d.v + d.dv, ov = d.has && tv > d.cap;
    totV += tv; if (d.has) totCap += d.cap;
    var bul = _bBullet({ v: preview ? 0 : tv, cap: d.cap, noCap: !d.has, mode: 'limit', unit: '만', edit: 'cap|' + ym + '|' + d.name,
      segs: d.dv > 0 ? [['쓴 돈', d.v, ov ? BK.red : BK.data], ['예정', d.dv, ov ? '#f0b3ac' : '#9cc4fb', 1]] : null, noPct: 1,
      marks: [{ v: d.av, label: '평소', color: '#23855f', dash: 'dashed' }, { v: d.lv, label: '작년', color: '#b8433a', dash: 'dotted' }] });
    var chips = Object.keys(d.subs).filter(function(k) { return d.subs[k] > 0; }).sort(function(x, y) { return d.subs[y] - d.subs[x]; }).map(function(k) { return '<span style="white-space:nowrap">' + _bEsc(k) + ' <b class="lb-n" style="color:' + BK.ink + '">' + _bMan(d.subs[k]) + '</b></span>'; }).join(' · ');
    if (d.dv > 0) chips += (chips ? ' · ' : '') + '<span style="white-space:nowrap;color:' + BK.dataText + '">예정 ' + d.dueL.map(function(t) { return _bEsc(t['소분류']) + ' <b class="lb-n">' + _bMan(t['금액']) + '</b> (' + (+t.date.slice(5, 7)) + '/' + (+t.date.slice(8, 10)) + ')'; }).join(' · ') + '</span>';
    return '<div style="display:grid;grid-template-columns:96px minmax(0,1fr);gap:12px;align-items:start;padding:8px 0 4px;border-top:1px solid #f1f5f9">' +
      '<span style="font-size:12.5px;color:' + BK.ink + ';white-space:nowrap;font-weight:600;padding-top:3px"><span class="material-symbols-outlined" style="font-size:16px;vertical-align:-4px;color:' + BK.sub + '">' + d.icon + '</span> ' + _bEsc(d.name) + '</span>' +
      '<div>' + bul + (chips && !preview ? '<div style="font-size:11px;color:' + BK.sub + ';margin-top:2px">' + chips + '</div>' : '') + '</div></div>';
  };
  var html = data.map(row).join('');
  var tf = _boardTripFor(ym), trip = '';
  if (tf) {
    var tv = m && !preview ? m.envs[0].val : 0, P2 = function(a) { return Math.max(0, Math.min(100, a / Math.max(tf.trip.budget, tv, 1) * 82)); };
    trip = '<div style="display:grid;grid-template-columns:96px minmax(0,1fr);gap:12px;align-items:start;margin-top:6px;padding-top:10px;border-top:1px solid #e2e8f0">' +
      '<span style="font-size:12.5px;font-weight:600;white-space:nowrap;padding-top:3px"><span class="material-symbols-outlined" style="font-size:16px;vertical-align:-4px;color:' + BK.data + '">flight</span> 여행</span>' +
      '<div>' + _bBullet({ v: tv, cap: tf.trip.budget, scale: Math.max(tf.trip.budget, tv) * 1.3, mode: 'limit', unit: '만', capLabel: _bEsc(tf.trip.title) + ' 예산' }) + '</div></div>';
  }
  var sw = function(st, txt) { return '<span style="display:inline-flex;align-items:center;gap:4px;white-space:nowrap">' + st + txt + '</span>'; };
  var legend = '<div style="display:flex;gap:14px;flex-wrap:wrap;font-size:11px;color:' + BK.sub + ';margin:2px 0 4px">' +
    (preview ? '' : sw('<i style="display:inline-block;width:14px;height:10px;background:' + BK.data + '"></i>', '쓴 돈') + sw('<i style="display:inline-block;width:14px;height:10px;background:#9cc4fb;background-image:repeating-linear-gradient(135deg,transparent 0 3px,rgba(255,255,255,.7) 3px 5px)"></i>', '나갈 예정')) +
    sw('<i style="display:inline-block;width:16px;height:10px;background:#e8f1fd;border-right:2px solid ' + BK.ink + '"></i>', '한도 · 숫자 누르면 바꾸기') +
    sw('<i style="display:inline-block;height:12px;border-left:2px dashed #23855f"></i>', '<b style="color:#23855f">평소</b> 한 달') + sw('<i style="display:inline-block;height:12px;border-left:2px dotted #b8433a"></i>', '<b style="color:#b8433a">작년</b> 같은 달') + '</div>';
  var head = preview ? '한도 <b class="lb-n" style="font-size:15px">' + _bMan(totCap) + '</b>만' :
    '<b class="lb-n" style="font-size:16px;color:' + (totV > totCap ? BK.red : BK.ink) + '">' + _bMan(totV) + '</b> 썼어요 / 한도 ' + _bMan(totCap) + '만 · <b style="color:' + (totV > totCap ? BK.red : BK.green) + '">' + (totV > totCap ? _bMan(totV - totCap) + ' 넘음' : _bMan(totCap - totV) + ' 남음') + '</b>';
  return '<div class="lb-c" style="margin-bottom:10px"><p class="lb-t"><span>' + mk + ' 나간 돈 · 이체(할머니·기부 등)까지 전부 · 여행은 따로</span><span>' + head + '</span></p>' + legend + html + trip + '</div>';
}

function _boardSplit(ym, m) {
  var L = m ? m.L : [], RED = '#d9695e', GREEN = '#3fa37f';
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
  var live = m && m.L.length;
  var lv = _bPlan(ym).living;
  if (!live) {
    var pj = _bProj(ym), sp = _bSplitPlan(ym), fx = sp[0][1], an = sp[1][1];
    return '<div class="lb-c" style="margin-bottom:10px"><p class="lb-t"><span>' + (+ym.slice(5)) + '월 돈 나누기 · 계획</span><span>들어올 돈 ' + _bMan(pj.total) + '만</span></p>' +
      _bStack([['고정', fx, '#94b8e8'], ['연간 적립', an, '#b9cdf0'], ['생활비', lv, BK.data], ['모을 돈', Math.max(0, pj.save), BK.green]], pj.total * 1.02, 16) + '</div>';
  }
  var cells = _bSplitPlan(ym).map(function(x) {
    if (x[0] === '생활비') x = [x[0], lv, x[2], x[3]];
    var name = x[0], plan = x[1], a = act[name], label = name === '집 자금' && ym >= '2027-04' ? '이주 자금' : name;
    var isSave = name === '집 자금', isTravel = name === '여행', body;
    if (!live) body = '<div style="font-size:11px;color:' + BK.sub + ';margin-top:4px">' + x[3] + '</div>';
    else if (isTravel) {
      var tv = m.envs[0].val, tc = tf ? tf.trip.budget : 0;
      body = tc ? _bBar(tv, tc, false, 8, false, true) + '<div style="font-size:11px;color:' + BK.sub + '">' + _bEsc(tf.trip.title) + ' · 여행 통장에서</div>'
                : '<div style="font-size:11px;color:' + BK.sub + ';margin-top:4px">이 달 여행비 ' + _bMan(a) + '만 · 여행 통장에서</div>';
    } else body = _bBar(a, plan, isSave, 8, false, true) + '<div style="font-size:11px;color:' + BK.sub + '">' + (isSave ? (a >= plan ? '<b style="color:' + BK.green + '">목표보다 +' + _bMan(a - plan) + '</b>' : _bMan(plan - a) + '만 더') : (a > plan ? '<b style="color:' + BK.red + '">' + _bMan(a - plan) + '만 넘음</b>' : _bMan(plan - a) + '만 남음')) + '</div>';
    return '<div style="min-width:0"><div style="display:flex;justify-content:space-between;font-size:12px;color:' + BK.ink + '"><b style="font-weight:600">' + label + '</b><span class="lb-n">' + (isTravel ? '200~300 한 번에' : (live ? '' : (isSave ? '목표 ' : '한도 ') + _bMan(plan) + '만')) + '</span></div>' + body + '</div>';
  }).join('');
  var bonusLine = bonus > 0 ? '<div style="font-size:11px;color:#1d5fd1;background:#eef5fb;padding:6px 10px;margin-top:8px">💰 이 달 상여 ≈ ' + _bMan(bonus) + '만 → 받는 날 바로 <b>' + _bEsc(bonusTo) + '</b></div>' :
    ((+ym.slice(5) === 4 || +ym.slice(5) === 10) ? '<div style="font-size:11px;color:#1d5fd1;background:#eef5fb;padding:6px 10px;margin-top:8px">💰 상여 달 · 받는 날 바로 <b>' + _bEsc(bonusTo) + '</b>으로</div>' : '');
  return '<div class="lb-c" style="margin-bottom:10px"><p class="lb-t"><span>' + (+ym.slice(5)) + '월 돈 나누기 · 칸마다 한도 대비 얼마나 찼나</span><span>' + (m && m.L.length ? '들어온 돈 ' + _bMan(inc) + '만' + (m.salaryDue ? ' + 월급 ' + MIRROR_PAYDAY + '일 예정 ' + _bMan(m.salaryDue) + '만' : '') : '계획') + '</span></p>' +
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px 16px">' + cells + '</div>' + bonusLine + '</div>';
}

function _boardLiving(ym, m, preview) {
  var caps = _bPlan(ym).caps, RED = '#d9695e', GREEN = '#3fa37f';
  var sp = m ? m.L.filter(_bS) : [];
  var ly = (function() { try { return ldgBoardMonth(_bYm(ym, -12), true).L.filter(_bS); } catch (e) { return []; } })();
  var tot = 0, totCap = 0;
  var cells = MIRROR_LIVING.map(function(x, i) {
    var cap = caps[x[0]] != null ? caps[x[0]] : _bLivingCap(ym, x[0]); totCap += cap;
    var rows = sp.filter(function(t) { return _bLivingRow(t) === i; }), v = _bSum(rows, function() { return true; }); tot += v;
    var lv = _bSum(ly.filter(function(t) { return _bLivingRow(t) === i; }), function() { return true; });
    var pct = cap ? Math.min(100, v / cap * 100) : 0, over = v > cap, col = over ? RED : BK.data;
    return '<div><div style="font-size:12px;display:flex;justify-content:space-between;gap:4px"><span style="white-space:nowrap"><span class="material-symbols-outlined" style="font-size:14px;vertical-align:-3px;color:#334155">' + x[1] + '</span> ' + x[0] + '</span>' +
      '</div>' +
      (preview ? _bLine(cap / 450000 * 100, 7, BK.data, '<b class="lb-n" style="color:' + BK.ink + '">' + _bMan(cap) + '</b>', '', 0.7) + _bLine(lv / 450000 * 100, 4, BK.soft, '작년 ' + _bMan(lv), '', 0.7) : _bBar(v, cap, false, 6, false, true)) +
      (preview ? '' : '<div class="lb-ms">작년 ' + _bMan(lv) + '만' + (lv > cap ? ' → <b>' + _bMan(lv - cap) + ' 덜</b>' : '') + '</div>') + '</div>';
  }).join('');
  var tf = _boardTripFor(ym), trip = '';
  if (tf) {
    var tv = m && !preview ? m.envs[0].val : 0;
    trip = '<div style="display:flex;justify-content:space-between;align-items:center;font-size:12px;margin-top:10px;padding-top:8px;border-top:1px solid #f1f5f9"><span><span class="material-symbols-outlined" style="font-size:14px;vertical-align:-3px;color:#1d5fd1">flight</span> 여행은 따로 · ' + _bEsc(tf.trip.title) + ' (' + tf.trip.start.slice(2, 7).replace('-', '.') + ')' + (tf.trip.support ? ' · 회사 지원 ' + _bMan(tf.trip.support) + '만 포함' : '') + '</span><b class="lb-n" style="color:' + (tv > tf.trip.budget ? RED : '#0f172a') + '">' + (preview ? '' : _bMan(tv) + ' / ') + _bMan(tf.trip.budget) + '만</b></div>';
  }
  // 반품: 옷·물건에서 돌려받은 돈(음수 행), 반품 배송비 = 29CM가 환불에서 뗀 돈 + 우체국 택배 (둘 다 실제)
  var ret = '';
  if (!preview) {
    var back = sp.filter(_bIsReturn);
    var ship = _bSum(sp, function(t) { return t['소분류'] === '반품 배송비'; });
    if (back.length || ship) {
      ret = '<div style="font-size:12px;margin-top:10px;padding-top:8px;border-top:1px solid #eef1f5;display:flex;justify-content:space-between;gap:8px;flex-wrap:wrap;color:' + BK.ink + '"><span><span class="material-symbols-outlined" style="font-size:14px;vertical-align:-3px;color:#334155">undo</span> 반품 <b class="lb-n">' + back.length + '번</b> · 돌려받은 돈 ' + _bMan(-_bSum(back, function() { return true; })) + '만</span>' +
        '<span>반품비로 날린 돈 <b class="lb-n" style="color:' + BK.red + '">' + ship.toLocaleString() + '원</b> <span style="font-size:11px;color:' + BK.sub + '">(29CM 환불에서 뗀 것 + 우체국 택배)</span></span></div>';
    }
  }
  return '<div class="lb-c" style="margin-bottom:10px"><p class="lb-t"><span>' + (+ym.slice(5)) + '월 생활비 · 칸별 한도</span><span>' + (preview ? '한도 ' + _bMan(totCap) + '만' : '<b class="lb-n" style="color:' + (tot > totCap ? RED : GREEN) + '">' + _bMan(tot) + '</b> / ' + _bMan(totCap) + '만') + '</span></p>' +
    '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px 16px">' + cells + '</div>' + ret + trip + '</div>';
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
    el.innerHTML = '<div style="font-size:11px;color:#1d5fd1;background:#eef5fb;padding:6px 10px;margin-bottom:8px">' + mk + '은 아직 오지 않았어요 · 작년 같은 달을 보고 미리 짠 계획이에요</div>' +
      _boardSplit(ym, null) + (function() { try { return _boardPlanCard(_ldgYear); } catch (e) { console.error('[Board plan]', e); return ''; } })() + _boardCats(ym, null, true) +
      '<div class="lb-c">' + _boardPlaybook(ym, m, true) + '</div>';
    try { _bFixTags(el); } catch (e) {}
    return;
  }
  var T = MIRROR_GOAL.amount, RED = '#d9695e', GREEN = '#3fa37f', h = '';
  if (!m.L.some(function(t) { return t['출처'] === '뱅샐'; })) {
    h += '<div style="font-size:11px;color:#334155;background:#eef5fb;padding:6px 10px;margin-bottom:8px">' + mk + '은 손으로 적은 기록이에요 — 저축·여행 준비금 같은 이체가 섞여 있어 판정이 정확하지 않을 수 있어요</div>';
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
  var gap = m.leftLife - need;
  var ok = gap >= 0, eq = function(lbl, v, col, sign) { return '<div style="text-align:center;min-width:0"><div class="lb-n" style="font-size:14px;color:' + col + '">' + (sign || '') + _bMan(v) + '</div><div style="font-size:10.5px;color:' + BK.mute + ';white-space:nowrap">' + lbl + '</div></div>'; };
  var op = function(c) { return '<div style="font-size:14px;color:' + BK.sub + ';font-weight:700">' + c + '</div>'; };
  var incAll = m.inc + m.salaryDue, lifePct = incAll ? Math.min(100, m.life / incAll * 100) : 100;
  // 나의 규칙 4개 — 이번 달 지키는 중인지 막대로
  var shopBig = m.L.filter(function(t) { return _bS(t) && (t['대분류'] === '품위유지비' || t['대분류'] === '생필품비') && t['금액'] >= 100000; });
  var netSave = m.saveIn + m.saveOut, salBase = m.salary >= 2500000 ? m.salary : (m.salaryDue || _bRegularSalary());
  var livCap = _bPlan(ym).living;
  var fixNow = _bSum(m.L, function(t) { return _bS(t) && _bFixed(t) && !_bAnnual(t); }), annNow = _bSum(m.L, function(t) { return _bS(t) && _bAnnual(t); });
  var livingNow = _bSum(m.L, function(t) { return _bS(t) && !_bFixed(t) && !_bAnnual(t) && t['대분류'] !== '여행' && t['대분류'] !== '미분류'; });
  var rule = function(st, title, sub, bar) {
    var ic = { ok: ['check_circle', BK.green], bad: ['cancel', BK.red], warn: ['error', BK.red], wait: ['schedule', BK.indigo] }[st];
    return '<div style="display:grid;grid-template-columns:18px minmax(0,1fr);gap:7px;padding:6px 0;border-top:1px solid #eef1f5"><span class="material-symbols-outlined" style="font-size:17px;color:' + ic[1] + '">' + ic[0] + '</span>' +
      '<div style="min-width:0"><div style="font-size:12px;font-weight:600;color:' + BK.ink + '">' + title + '</div>' + (bar || '') + '<div style="font-size:11px;color:' + BK.sub + '">' + sub + '</div></div></div>';
  };
  var rules = [
    m.side > 0 ? rule(netSave >= m.side ? 'ok' : 'bad', '부업 들어오면 그대로 집 통장', '부업 ' + _bMan(m.side) + '만 들어옴 → 집 통장 순적립 ' + _bMan(netSave) + '만' + (netSave >= m.side ? ' ✓' : ' · ' + _bMan(m.side - netSave) + '만 덜 옮김'), _bBar(netSave, m.side, true, 6))
               : rule('wait', '부업 들어오면 그대로 집 통장', '이 달 부업 입금 아직 (보통 10일)', ''),
    rule(livingNow > livCap ? 'bad' : livingNow > livCap * 0.8 ? 'warn' : 'ok', '생활비 ' + _bMan(livCap) + '만 안에서', '여행·고정·연간 적립 뺀 생활비', _bBar(livingNow, livCap, false, 6)),
    rule(m.life > salBase ? 'bad' : 'ok', '월급 ' + _bMan(salBase) + '만 안에서 살기 (여행 빼고)', '여행 빼고 쓴 돈' + (m.salaryDue ? ' <span style="color:' + BK.mute + '">· 월급 ' + MIRROR_PAYDAY + '일 예정</span>' : ''), _bBar(m.life, salBase, false, 6)),
    rule(shopBig.length >= 3 ? 'bad' : shopBig.length === 2 ? 'warn' : 'ok', '옷·물건 10만↑은 7일 기다렸다 사기', '이 달 10만↑ ' + shopBig.length + '건' + (shopBig.length ? ' · ' + shopBig.slice(0, 2).map(function(t) { return _bEsc((t['세부사항'] || '').split(' · ').pop().replace(/\(주\)|㈜|주식회사|\(.*?\)/g, '').trim().slice(0, 10)) + ' ' + _bMan(t['금액']); }).join(', ') : ' ✓'), '')
  ].join('');
  h += '<div class="lb-grid">' +
    '<div class="lb-c lb-3"><p class="lb-t"><span>' + MIRROR_GOAL.label + ' · ' + MIRROR_GOAL.due.replace('-', '.') + '까지</span><span>' + monthsLeft + '달 남음</span></p>' +
      '<div><span class="lb-n" style="font-size:22px">' + _bMan(pot) + '</span><span style="font-size:12px;color:' + BK.sub + '"> / ' + _bMan(T) + '만</span></div>' +
      _bBar(pot, T, true, 10) +
      '<div style="font-size:12px;color:' + BK.sub + '">남은 ' + _bMan(T - pot) + '만 ÷ ' + monthsLeft + '달 = 매달 <b class="lb-n">' + _bMan(need) + '만</b>씩</div>' +
      '<div style="font-size:12px;color:' + BK.sub + ';margin-top:4px">' + mk + ' 넣은 돈 <b class="lb-n" style="color:' + BK.green + '">+' + _bMan(m.saveIn) + '</b>' + (m.saveOut ? ' · 꺼낸 돈 <b class="lb-n" style="color:' + BK.red + '">' + _bMan(m.saveOut) + '</b>' : '') + ' → ' + (netSave >= need ? '<b style="color:' + BK.green + '">이 달 몫 채움 ✓</b>' : '<b style="color:' + BK.red + '">' + _bMan(need - netSave) + '만 더</b>') + '</div></div>' +
    '<div class="lb-c lb-3"><p class="lb-t"><span>' + mk + ' 판정 · 여행 빼고</span><span style="color:' + (ok ? BK.green : BK.red) + ';font-weight:700">' + (ok ? '목표보다 +' : '목표까지 ') + _bMan(Math.abs(gap)) + '만' + (ok ? '' : ' 부족') + '</span></p>' +
      '<div><span class="lb-n" style="font-size:22px;color:' + (m.leftLife >= 0 ? BK.green : BK.red) + '">' + (m.leftLife >= 0 ? '+' : '') + _bMan(m.leftLife) + '만</span><span style="font-size:12px;color:' + BK.sub + '"> ' + (m.salaryDue ? '남을 예정' : '남은 돈') + '</span></div>' +
      '<div style="display:grid;grid-template-columns:1fr auto 1fr auto 1fr auto 1fr;gap:4px;align-items:center;margin:8px 0 4px">' +
        eq('들어온 돈', m.inc, BK.ink) + op('+') + eq(m.salaryDue ? '월급 ' + MIRROR_PAYDAY + '일 예정' : '월급 들어옴', m.salaryDue, BK.ink) + op('−') + eq('여행 빼고 쓴 돈', m.life, BK.ink) + op('=') + eq('남음', m.leftLife, m.leftLife >= 0 ? BK.green : BK.red, m.leftLife >= 0 ? '+' : '') + '</div>' +
      '<div style="margin-top:6px">' + _bStack([['고정', fixNow, '#94b8e8'], ['연간', annNow, '#b9cdf0'], ['생활', livingNow, BK.data], ['남음', Math.max(0, m.leftLife), BK.green]], Math.max(incAll, m.life) * 1.02, 12) + '</div>' +
      (m.travel ? '<div style="font-size:11.5px;color:' + BK.sub + ';margin-top:6px"><span class="material-symbols-outlined" style="font-size:14px;vertical-align:-3px;color:#1d5fd1">flight</span> 여행 ' + _bMan(m.travel) + '만은 여행 통장(' + MIRROR_TRAVEL_ACCOUNT + ')에서 → 여기 안 셈</div>' : '') + '</div>' +
    '<div class="lb-c lb-3"><p class="lb-t"><span>나의 규칙 4개 · 이 달 지키는 중?</span><span>' + [m.side > 0 && netSave >= m.side, livingNow <= livCap, m.life <= salBase, shopBig.length < 2].filter(Boolean).length + ' / 4 지킴</span></p>' + rules + '</div></div>';

  // ── 한 해 (연간 목표 겸) → 생활비 칸 표 하나
  try { h += _boardPlanCard(_ldgYear); } catch (e) { console.error('[Board plan]', e); }
  try { h += _boardCats(ym, m, false); } catch (e) { console.error('[Board cats]', e); }

  // ── 큰 결제 · 어디에 썼나
  // 큰 결제마다: 무슨 칸인지 + 그래서 어떤 돈인지(괜찮은 돈 / 확인할 돈)
  var bigNote = function(t) {
    var M = t['대분류'], S = t['소분류'], tfx = _boardTripFor(ym);
    if (M === '여행') {
      if (/^국내/.test(S || '')) return ['ok', '국내 여행' + (/ · /.test(t['세부사항'] || '') ? ' · ' + _bEsc(t['세부사항'].split(' · ').slice(1).join(' · ')) : '')];
      var inTrip = tfx && t.date > tfx.from && t.date <= tfx.trip.end;
      return ['ok', '여행 통장에서 · ' + (inTrip ? _bEsc(tfx.trip.title) + ' 예산 안' : '해외 여행 예산')];
    }
    if (_bFixed(t)) return ['ok', '매달 나가는 고정비'];
    if (_bAnnual(t)) return ['ok', '연간 적립에서'];
    if (M === '품위유지비') return ['warn', '10만↑ 옷 · 7일 기다렸나? 옷 한도 ' + _bMan(_bPlan(ym).caps['옷·뷰티'] || 250000) + '만'];
    if (M === '생필품비') return ['warn', '계획한 물건? 물건 한도 ' + _bMan(_bPlan(ym).caps['물건'] || 200000) + '만'];
    if (M === '관계비' || M === '경조사비') return ['ok', '사람에 쓴 돈 · 사람 한도 ' + _bMan(_bPlan(ym).caps['사람'] || 100000) + '만'];
    if (M === '여가비') return ['warn', '취미 한도 10만 넘는 한 번'];
    if (M === '미분류') return ['bad', '정체 확인 필요'];
    return ['ok', ''];
  };
  var catName = function(t) { return MIRROR_BUCKETS[_bBucket(t)][0] + (t['소분류'] && !/^기타/.test(t['소분류']) ? '·' + t['소분류'] : ''); };
  var list = _boardShowAllBig ? m.bigs : m.bigs.slice(0, 6);
  var bigRows = list.map(function(t) {
    var col = MIRROR_BUCKETS[_bBucket(t)][2], n = bigNote(t), zap = (m.binge[t.date] || 0) >= 3;
    var nc = n[0] === 'ok' ? BK.sub : BK.red;
    return '<div style="display:grid;grid-template-columns:40px minmax(0,1fr) 48px;gap:8px;align-items:center;font-size:12px;padding:7px 0;border-top:1px solid #eef1f5">' +
      '<span style="color:' + BK.sub + '">' + t.date.slice(5).replace('-', '/') + (zap ? '⚡' : '') + '</span>' +
      '<div style="min-width:0"><div style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:' + BK.ink + '"><span style="font-size:10.5px;font-weight:600;color:' + BK.dataText + ';background:' + BK.track + ';padding:1px 6px;margin-right:6px">' + _bEsc(catName(t)) + '</span>' + _bEsc((t['세부사항'] || '').replace(/\(주\)|㈜|주식회사/g, '').trim()) + '</div>' +
      (n[1] ? '<div style="font-size:11px;color:' + nc + ';margin-top:1px">' + (n[0] === 'ok' ? '✓ ' : '→ ') + n[1] + '</div>' : '') + '</div>' +
      '<b class="lb-n" style="text-align:right">' + _bMan(t['금액']) + '만</b></div>';
  }).join('');
  var bySum = {};
  m.bigs.forEach(function(t) { var k = MIRROR_BUCKETS[_bBucket(t)][0]; bySum[k] = (bySum[k] || 0) + t['금액']; });
  var bigChips = Object.keys(bySum).sort(function(x, y) { return bySum[y] - bySum[x]; }).map(function(k) {
    var bk = MIRROR_BUCKETS.filter(function(x) { return x[0] === k; })[0];
    return '<span style="font-size:11px;color:' + BK.ink + ';white-space:nowrap">' + k + ' <b class="lb-n">' + _bMan(bySum[k]) + '</b></span>';
  }).join('');
  var maxB = Math.max.apply(null, m.buckets.concat(b ? b.bucketAvg : []).concat([1]));
  var cats = MIRROR_BUCKETS.map(function(bk, i) {
    var v = m.buckets[i], a = b ? b.bucketAvg[i] : 0, d = v - a;
    return '<div style="display:grid;grid-template-columns:62px minmax(0,1fr);gap:8px;align-items:center;font-size:12px;margin:7px 0"><span style="color:' + BK.ink + ';font-weight:600">' + bk[0] + '</span>' +
      '<div>' + _bLine(v / maxB * 100, 10, bk[2], '<b class="lb-n" style="color:' + BK.ink + '">' + _bMan(v) + '만</b>' + (a ? ' <b style="color:' + (d > a * 0.15 ? BK.red : BK.green) + '">' + (d > 0 ? '+' : '−') + _bMan(Math.abs(d)) + '</b> <span>· 평소 ' + _bMan(a) + '</span>' : ''),
        a ? '<div title="평소 ' + _bMan(a) + '만" style="position:absolute;top:0;bottom:0;left:' + (a / maxB * 100 * B_SCALE) + '%;width:2px;background:' + BK.ink + ';z-index:1"></div>' : '', null, a ? a / maxB * 100 + 0.6 : null) + '</div></div>';
  }).join('');
  var todoHtml = ''; try { todoHtml = _boardPlaybook(ym, m, true); } catch (e) { console.error('[Board todo]', e); }
  h += '<div class="lb-grid">' + '<div class="lb-c lb-6">' + todoHtml + '</div>' +
    '<div class="lb-c lb-6"><p class="lb-t"><span>' + mk + ' 10만 원 넘게 쓴 것 · ' + m.bigs.length + '건 = 지출의 ' + Math.round(m.bigShare * 100) + '%</span><span>⚡ 하루 3건↑ 몰아친 날</span></p>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:4px">' + bigChips + '</div>' +
      (bigRows || '<div style="font-size:12px;color:' + BK.sub + '">없음</div>') +
      (m.bigs.length > 6 ? '<button class="lb-more" onclick="_boardShowAllBig=!_boardShowAllBig;ldgRenderBoard()">' + (_boardShowAllBig ? '접기' : '+ ' + (m.bigs.length - 6) + '건 더보기') + '</button>' : '') + '</div>' +
    '</div>';

  // ── 내 습관 (나라는 사람 + 어디서 새나) — 매달 바뀌지 않아서 접어 둠
  var habitOpen = false;
  try { habitOpen = localStorage.getItem('atelier_board_habit_open') === '1'; } catch (e) {}
  var leakHtml = ''; try { leakHtml = _boardLeaks(ym); } catch (e) { console.error('[Board leaks]', e); }
  if (b && !habitOpen) {
    var ls = window._bLeakStat || {}, chip = function(big, small, red) { return '<div style="min-width:0"><div class="lb-n" style="font-size:18px;color:' + (red ? BK.red : BK.ink) + '">' + big + '</div><div style="font-size:11px;color:' + BK.sub + '">' + small + '</div></div>'; };
    h += '<div class="lb-c" style="margin-top:10px"><p class="lb-t"><span>내 습관 · 지난 ' + b.N + '달</span><button class="lb-more" onclick="try{localStorage.setItem(\'atelier_board_habit_open\',\'1\')}catch(e){};ldgRenderBoard()">펼치기 ▾</button></p>' +
      '<div style="display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px">' +
      chip(b.reds + '/' + b.N, '적자 달', b.reds > b.N / 2) + chip(Math.round(b.bigShare * 100) + '%', '옷·물건 중 10만↑') +
      chip('월 ' + _bMan(ls.habit || 0), '자주 새는 돈', true) + '<div><div class="lb-n" style="font-size:18px;color:' + BK.green + '">월 −' + _bMan(ls.cut || 0) + '</div><div style="font-size:11px;color:' + BK.sub + '">줄일 수 있는 돈</div></div>' +
      '</div></div>';
  }
  if (b && habitOpen) {
    var dn = ['월', '화', '수', '목', '금', '토', '일'];
    var trait = function(icon, title, val, red, rx) {
      return '<div><div style="font-size:12px;color:#334155"><span class="material-symbols-outlined" style="font-size:15px;vertical-align:-3px">' + icon + '</span> ' + title + '</div>' +
        '<div class="lb-n" style="font-size:17px;margin-top:4px;color:' + (red ? RED : '#0f172a') + '">' + val + '</div><div style="font-size:11px;color:#334155">→ ' + rx + '</div></div>';
    };
    h += '<div class="lb-c"><p class="lb-t"><span>나라는 사람 · 지난 ' + b.N + '달로 본 성향</span><span>뱅샐 가져올 때마다 다시 계산</span></p>' +
      '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:14px">' +
      trait('account_balance_wallet', '쓰고 남으면 모으는 형', b.reds + ' / ' + b.N + '달 적자', b.reds > b.N / 2, '먼저 떼고 쓰기') +
      trait('bolt', '몰아치기형', '옷·물건 10만↑ ' + b.bigN + '건 = ' + Math.round(b.bigShare * 100) + '%', false, '10만↑은 7일 대기') +
      trait('flight', '경험·사람에 쓰는 형', '여행 ' + _bMan(b.travel) + ' + 사람 ' + _bMan(b.people) + ' / 달', false, '여행은 1년 2번 · 미리 모은 여행 통장으로') +
      trait('schedule', dn[b.peak[0]] + '요일 ' + b.peak[1] * 3 + '–' + (b.peak[1] * 3 + 3) + '시형', _bMan(b.peakAmt) + '만 (' + b.N + '달)', false, '그 시간엔 장바구니만') +
      '</div></div>';
  }
  if (habitOpen) h += leakHtml + '<div style="text-align:right"><button class="lb-more" onclick="try{localStorage.setItem(\'atelier_board_habit_open\',\'0\')}catch(e){};ldgRenderBoard()">습관 접기 ▴</button></div>';
  var open = false;
  try { open = localStorage.getItem('atelier_ledger_detail_open') === '1'; } catch (e) {}
  h += '<button onclick="ldgToggleDetail()" style="width:100%;margin-top:10px;font-size:12px;color:#1d5fd1;background:#eef5fb;border:0;padding:9px;cursor:pointer">' +
    (open ? '▴ 차트 접기' : '▾ 차트 더 보기 · KPI · 수입/지출 구성 · TOP 카테고리 · 일별 추이') + '</button>';
  el.innerHTML = h;
  try { _bFixTags(el); } catch (e) {}
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
