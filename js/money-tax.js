// Money › Tax — 2026년 소득분 세금 세 번(연말정산·5월 종소세·퇴직)
// 숫자는 공개 저장소에 두지 않는다 → Firestore appSettings/taxPlan 에만 있다(로그인해야 읽힘).
// 계산은 korean-tax-calc MCP 로 하고 결과를 그 문서에 넣는다. 여기선 그리기 + 연금저축 슬라이더만.

(function () {
  var _tax = null;

  function man(x) { return Math.round(x / 1e4).toLocaleString('ko-KR'); }
  function signed(x) { return (x >= 0 ? '+' : '−') + man(Math.abs(x)) + '만'; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function injectStyle() {
    if (document.getElementById('tax-style')) return;
    var css = [
      '#page-tax{--tx-up:#15803D;--tx-down:#E11D48;--tx-ink:#16161A;--tx-sub:#475569;--tx-line:#ECECF0}',
      '#page-tax *{border-radius:0!important}',
      '#page-tax .tx-head{display:flex;align-items:baseline;gap:14px;flex-wrap:wrap;margin:8px 0 28px}',
      '#page-tax .tx-head p{font-size:14px;color:var(--tx-sub)}',
      // 타임라인
      '#page-tax .tx-line{display:grid;grid-template-columns:repeat(3,1fr);border-top:2px solid var(--atl-accent,#1F4BD8);position:relative;margin-bottom:12px}',
      '#page-tax .tx-stop{position:relative;padding:22px 24px 22px 0}',
      '#page-tax .tx-stop+.tx-stop{padding-left:24px;border-left:1px solid var(--tx-line)}',
      '#page-tax .tx-stop:before{content:"";position:absolute;top:-7px;left:0;width:12px;height:12px;background:#fff;border:2px solid var(--atl-accent,#1F4BD8)}',
      '#page-tax .tx-stop+.tx-stop:before{left:24px}',
      '#page-tax .tx-stop.is-next:before{background:var(--atl-accent,#1F4BD8)}',
      '#page-tax .tx-when{font-size:12px;font-weight:700;color:var(--atl-accent,#1F4BD8);letter-spacing:.02em}',
      '#page-tax .tx-what{font-size:15px;font-weight:700;color:var(--tx-ink);margin-top:4px}',
      '#page-tax .tx-big{font-size:44px;font-weight:800;letter-spacing:-.02em;line-height:1.1;margin-top:10px;font-variant-numeric:tabular-nums}',
      '#page-tax .tx-tri{font-style:normal;font-size:22px;vertical-align:10px;margin-right:8px;font-family:Pretendard,sans-serif}',
      '#page-tax .tx-big small{font-size:18px;font-weight:700;margin-left:2px}',
      '#page-tax .tx-note{font-size:13px;color:var(--tx-sub);margin-top:6px}',
      '#page-tax .up{color:var(--tx-up)} #page-tax .down{color:var(--tx-down)}',
      // 순 결과 줄
      '#page-tax .tx-net{display:block;line-height:1.7;background:var(--atl-accent-soft,#EEF2FD);padding:12px 16px;font-size:14px;color:var(--tx-ink);margin-bottom:40px}',
      '#page-tax .tx-net b{font-variant-numeric:tabular-nums}',
      // 카드
      '#page-tax .tx-grid{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-bottom:24px}',
      '@media (max-width:900px){#page-tax .tx-grid,#page-tax .tx-line{grid-template-columns:1fr!important}#page-tax .tx-stop+.tx-stop{border-left:0;border-top:1px solid var(--tx-line);padding-left:0}#page-tax .tx-stop+.tx-stop:before{left:0}}',
      '#page-tax .tx-card{border:1px solid var(--tx-line);padding:24px;background:#fff}',
      '#page-tax .tx-card h3{font-size:16px;font-weight:700;color:var(--tx-ink)}',
      '#page-tax .tx-card .tx-k{font-size:12px;color:var(--tx-sub);margin-top:2px}',
      // 막대
      '#page-tax .tx-bars{margin-top:20px;display:grid;gap:12px}',
      '#page-tax .tx-bar{display:grid;grid-template-columns:96px 1fr 72px;align-items:center;gap:10px;font-size:13px;color:var(--tx-ink)}',
      '#page-tax .tx-bar .lbl{color:var(--tx-sub)}',
      '#page-tax .tx-bar .num{text-align:right;font-weight:700;font-variant-numeric:tabular-nums}',
      '#page-tax .tx-track{height:22px;background:#F8F8FA;position:relative}',
      '#page-tax .tx-fill{position:absolute;top:0;bottom:0;left:0;background:var(--atl-accent,#1F4BD8)}',
      '#page-tax .tx-fill.soft{background:#BFCDF5}',
      '#page-tax .tx-fill.gap{background:#15803D}',
      '#page-tax .tx-fill.cut{background:#E11D48}',
      // 소득 구성 (쌓인 막대)
      '#page-tax .tx-stack{display:flex;height:34px;margin-top:20px}',
      '#page-tax .tx-stack>div{display:flex;align-items:center;padding:0 10px;font-size:12px;font-weight:700;color:#fff;white-space:nowrap;overflow:hidden}',
      '#page-tax .tx-stack .a{background:var(--atl-accent,#1F4BD8)} #page-tax .tx-stack .b{background:#16161A}',
      // 세율 자
      '#page-tax .tx-ruler{position:relative;margin-top:30px;height:44px}',
      '#page-tax .tx-band{position:absolute;top:14px;height:12px;border-right:2px solid #fff}',
      '#page-tax .tx-band span{position:absolute;top:16px;left:0;font-size:11.5px;font-weight:700;color:var(--tx-sub)}',
      '#page-tax .tx-pin{position:absolute;top:0;width:2px;height:30px;background:var(--tx-ink)}',
      '#page-tax .tx-pin b{position:absolute;top:-20px;left:-4px;font-size:12px;white-space:nowrap;color:var(--tx-ink)}',
      // 계산 식
      '#page-tax .tx-eq{display:flex;align-items:center;flex-wrap:wrap;gap:6px;margin-top:22px;font-size:13px;color:var(--tx-ink)}',
      '#page-tax .tx-eq span{border:1px solid var(--tx-line);padding:6px 10px;font-variant-numeric:tabular-nums}',
      '#page-tax .tx-eq span.end{border-color:var(--tx-down);color:var(--tx-down);font-weight:700}',
      '#page-tax .tx-eq i{font-style:normal;color:var(--tx-sub)}',
      // 슬라이더
      '#page-tax .tx-what-if{display:grid;grid-template-columns:1fr auto;gap:24px;align-items:center}',
      '#page-tax input[type=range]{width:100%;accent-color:#1F4BD8;margin-top:18px}',
      '#page-tax .tx-ticks{display:flex;justify-content:space-between;font-size:11.5px;color:var(--tx-sub);margin-top:4px}',
      '#page-tax .tx-save{text-align:right}',
      '#page-tax .tx-save .tx-big{margin-top:0}',
      // 다음 해
      '#page-tax .tx-flags{display:grid;gap:10px;margin-top:16px}',
      '#page-tax .tx-flag{display:grid;grid-template-columns:20px 1fr;gap:10px;font-size:14px;color:var(--tx-ink);line-height:1.5}',
      '#page-tax .tx-flag .material-symbols-outlined{font-size:20px}',
      '#page-tax .tx-foot{display:flex;flex-wrap:wrap;gap:8px;margin-top:28px}',
      '#page-tax .tx-foot .atl-chip{color:var(--tx-sub)}',
      '#page-tax .tx-dl{margin-top:16px;border-top:1px solid var(--tx-line)}',
      '#page-tax .tx-dl-row{display:grid;grid-template-columns:72px 1fr 64px;gap:16px;align-items:center;padding:12px 0;border-bottom:1px solid var(--tx-line)}',
      '#page-tax .tx-dl-date{font-size:11.5px;color:var(--tx-sub);line-height:1.2}',
      '#page-tax .tx-dl-date b{display:block;font-size:20px;color:var(--tx-ink);font-variant-numeric:tabular-nums}',
      '#page-tax .tx-dl-title{font-size:14px;font-weight:700;color:var(--tx-ink)}',
      '#page-tax .tx-dl-left{text-align:right;font-size:13px;font-weight:700;color:var(--tx-sub);font-variant-numeric:tabular-nums}',
      '#page-tax .tx-dl-row.is-soon .tx-dl-left{color:#fff;background:#1F4BD8;padding:4px 8px;justify-self:end}',
      '#page-tax .tx-dl-row.is-soon .tx-dl-date b{color:#1F4BD8}',
      '#page-tax .tx-dl-row.is-past{opacity:.55}',
      '#page-tax .tx-empty{border:1px dashed var(--atl-line-strong,#DCDCE3);padding:40px;text-align:center;color:var(--tx-sub);font-size:14px}'
    ].join('\n');
    var st = document.createElement('style'); st.id = 'tax-style'; st.textContent = css;
    document.head.appendChild(st);
  }

  function bar(label, value, max, cls, numText) {
    var w = Math.max(0, Math.min(100, value / max * 100));
    return '<div class="tx-bar"><div class="lbl">' + label + '</div><div class="tx-track"><div class="tx-fill ' + (cls || '') + '" style="width:' + w + '%"></div></div><div class="num">' + (numText || man(value) + '만') + '</div></div>';
  }

  function render() {
    var root = document.getElementById('tax-root');
    if (!root) return;
    var t = _tax;
    if (!t || !t.y2026) {
      root.innerHTML = '<div class="tx-empty">세금 자료가 아직 없어요. 로그인한 상태에서 열면 보여요.</div>';
      return;
    }
    var y = t.y2026, r = t.retirement || {}, ye = y.yearEnd, co = y.comprehensive;
    var refund = ye.refund + ye.localRefund;
    var interim = co.interim || 0;          // 11월 중간예납(소득세분) — 5월에 그만큼 덜 냄
    var may = co.extra + co.local - interim;
    var net = refund - may - interim;

    var h = '';
    // ── 정산 타임라인 ──
    var stops = [];
    if (interim) stops.push('<div class="tx-stop is-next"><div class="tx-when">2026. 11. 30</div><div class="tx-what">중간예납</div>' +
         '<div class="tx-big down"><i class="tx-tri">▼</i>' + man(interim) + '<small>만</small></div>' +
         '<div class="tx-note">5월 세금의 절반을 미리 내는 것</div></div>');
    stops.push('<div class="tx-stop' + (interim ? '' : ' is-next') + '"><div class="tx-when">2027. 02</div><div class="tx-what">연말정산</div>' +
         '<div class="tx-big up"><i class="tx-tri">▲</i>' + man(refund) + '<small>만</small></div>' +
         '<div class="tx-note">회사가 미리 뗀 세금 중 돌려받는 돈</div></div>');
    stops.push('<div class="tx-stop"><div class="tx-when">2027. 05. 31</div><div class="tx-what">종합소득세</div>' +
         '<div class="tx-big down"><i class="tx-tri">▼</i>' + man(may) + '<small>만</small></div>' +
         '<div class="tx-note">' + (interim ? '중간예납 빼고 남은 몫 (지방세 포함)' : '포타 수입 때문에 더 내는 돈 (지방세 포함)') + '</div></div>');
    stops.push('<div class="tx-stop"><div class="tx-when">' + esc(r.whenLabel || '2028. 02') + '</div><div class="tx-what">퇴직금</div>' +
         '<div class="tx-big">' + man(r.net) + '<small>만</small></div>' +
         '<div class="tx-note">세금 ' + man(r.tax + r.local) + '만 빼고 손에 쥐는 돈</div></div>');
    h += '<div class="tx-line" style="grid-template-columns:repeat(' + stops.length + ',1fr)">' + stops.join('') + '</div>';
    h += '<div class="tx-net"><span class="material-symbols-outlined" style="font-size:18px;color:#1F4BD8;vertical-align:-4px;margin-right:8px">savings</span>' +
         '2월 환급 <b class="up">' + signed(refund) + '</b>에서 ' + (interim ? '11월·5월 세금 <b class="down">' + signed(-(may + interim)) + '</b>' : '5월 세금 <b class="down">' + signed(-may) + '</b>') + '을 빼면 ' +
         '<b>' + signed(net) + '</b> · 환급은 5월까지 묶어 두기</div>';

    // ── 신고 달력 ──
    if (t.deadlines && t.deadlines.length) {
      var today = new Date(); today.setHours(0, 0, 0, 0);
      h += '<div class="tx-card" style="margin-bottom:24px"><h3>Deadlines</h3><div class="tx-k">사업자(저술가·면세)로 해야 하는 신고 · 아이폰 미리알림 \'세금\' 목록에 알림 있음</div><div class="tx-dl">';
      t.deadlines.forEach(function (d) {
        var dt = new Date(d.date + 'T00:00:00'), left = Math.round((dt - today) / 864e5);
        var past = left < 0;
        h += '<div class="tx-dl-row' + (past ? ' is-past' : '') + (left >= 0 && left <= 30 ? ' is-soon' : '') + '">' +
             '<div class="tx-dl-date">' + d.date.slice(0, 4) + '<b>' + d.date.slice(5).replace('-', '.') + '</b></div>' +
             '<div class="tx-dl-body"><div class="tx-dl-title">' + esc(d.title) + '</div><div class="tx-k">' + esc(d.note || '') + '</div></div>' +
             '<div class="tx-dl-left">' + (past ? '지남' : left === 0 ? '오늘' : 'D-' + left) + '</div></div>';
      });
      h += '</div></div>';
    }

    // ── 연말정산 / 종소세 ──
    var maxW = Math.max(ye.withheld, ye.decided);
    h += '<div class="tx-grid">';
    h += '<div class="tx-card"><h3>Year-End Settlement</h3><div class="tx-k">2026년 월급에서 뗀 세금 vs 실제 세금</div><div class="tx-bars">' +
         bar('미리 뗀 세금', ye.withheld, maxW, 'soft') +
         bar('실제 세금', ye.decided, maxW, '') +
         bar('돌려받음', ye.refund, maxW, 'gap', '+' + man(ye.refund) + '만') +
         '</div><div class="tx-eq"><span>총급여 ' + man(y.wage.gross) + '만</span><i>→ 과세표준</i><span>' + man(ye.base) + '만</span><i>→ 15% 구간</i></div>' +
         (y.card ? '<div class="tx-k" style="margin-top:18px;color:#16161A;font-weight:700">카드 공제 ' + man(y.card.deduction) + '만' + (y.card.deduction >= y.card.cap ? ' · 한도 꽉 참' : '') + '</div>' +
           '<div class="tx-stack" style="height:14px;margin-top:6px"><div style="width:' + (y.card.threshold / y.card.used * 100) + '%;background:#DCDCE3"></div><div style="width:' + (100 - y.card.threshold / y.card.used * 100) + '%;background:#1F4BD8"></div></div>' +
           '<div class="tx-k" style="margin-top:4px">카드 ' + man(y.card.used) + '만 중 문턱 ' + man(y.card.threshold) + '만(총급여 25%)을 넘은 몫만 공제. ' + esc(y.card.note || '') + '</div>' : '') +
         '<div class="tx-k" style="margin-top:10px">상여 달(4·10월)에 간이세액표로 많이 떼여서 돌려받는 구조. 지방세 ' + man(ye.localRefund) + '만 더.</div></div>';

    var inc = y.wage.earnedIncome + y.biz.income;
    var pa = y.wage.earnedIncome / inc * 100;
    var cap = 8800e4, pos = Math.min(co.base / cap * 100, 100);
    h += '<div class="tx-card"><h3>May Income Tax</h3><div class="tx-k">회사 + 포타를 합쳐서 다시 계산</div>' +
         '<div class="tx-stack"><div class="a" style="width:' + pa + '%">회사 ' + man(y.wage.earnedIncome) + '만</div><div class="b" style="width:' + (100 - pa) + '%">포타 ' + man(y.biz.income) + '만</div></div>' +
         '<div class="tx-k" style="margin-top:6px">포타 수입 ' + man(y.biz.revenue) + '만 × 경비 빼고 ' + Math.round((1 - y.biz.simpleRate) * 1000) / 10 + '% (단순경비율)</div>' +
         '<div class="tx-ruler">' +
           '<div class="tx-band" style="left:0;width:' + (1400 / 8800 * 100) + '%;background:#DCDCE3"><span>6%</span></div>' +
           '<div class="tx-band" style="left:' + (1400 / 8800 * 100) + '%;width:' + (3600 / 8800 * 100) + '%;background:#BFCDF5"><span>15%</span></div>' +
           '<div class="tx-band" style="left:' + (5000 / 8800 * 100) + '%;width:' + (3800 / 8800 * 100) + '%;background:#FECDD3"><span>24% · 5,000만~</span></div>' +
           '<div class="tx-pin" style="left:' + pos + '%"><b>과표 ' + man(co.base) + '만</b></div>' +
         '</div>' +
         '<div class="tx-eq"><span>세금 ' + man(co.computed) + '</span><i>− 공제 ' + man(co.computed - co.decided) + '</i><i>=</i><span>' + man(co.decided) + '</span><i>− 연말정산 ' + man(ye.decided) + '</i><i>+ 지방세</i><span class="end">' + man(co.extra + co.local) + '만</span>' + (interim ? '<i>= 11월 ' + man(interim) + ' + 5월 ' + man(may) + '</i>' : '') + '</div>' +
         '<div class="tx-k" style="margin-top:10px">24% 구간까지 ' + man(5000e4 - co.base) + '만 남음. 포타가 더 크면 넘어가요.</div></div>';
    h += '</div>';

    // ── 연금저축 슬라이더 / 퇴직금 ──
    h += '<div class="tx-grid">';
    h += '<div class="tx-card"><h3>What If · Pension Savings</h3><div class="tx-k">12월 31일까지 연금저축·IRP에 넣으면 세금이 줄어요 (13.2% + 지방세)</div>' +
         '<div class="tx-what-if"><div><input id="tx-pension" type="range" min="0" max="900" step="50" value="0" oninput="taxPensionChange(this.value)">' +
         '<div class="tx-ticks"><span>0</span><span>300</span><span>600 (연금저축 한도)</span><span>900만</span></div></div>' +
         '<div class="tx-save"><div class="tx-k" id="tx-pension-in">0만 넣으면</div><div class="tx-big up" id="tx-pension-out">0<small>만</small></div><div class="tx-k">세금이 줄어요</div></div></div>' +
         '<div class="tx-k" id="tx-pension-may" style="margin-top:12px"></div></div>';

    var rmax = r.pay;
    h += '<div class="tx-card"><h3>Severance</h3><div class="tx-k">' + esc(r.periodLabel || '') + ' · 근속 ' + r.years + '년으로 계산</div><div class="tx-bars">' +
         bar('퇴직금', r.pay, rmax, '') +
         bar('퇴직소득세', r.tax + r.local, rmax, 'cut', '−' + man(r.tax + r.local) + '만') +
         bar('손에 쥐는 돈', r.net, rmax, 'soft') +
         '</div><div class="tx-k" style="margin-top:14px">근속연수공제 ' + man(r.deduction) + '만 덕에 실효세율 ' + (Math.round((r.tax + r.local) / r.pay * 1000) / 10) + '%. 퇴직 해 세율표가 나오면 다시 계산.</div></div>';
    h += '</div>';

    // ── 다음 해 ──
    h += '<div class="tx-card"><h3>Ahead</h3><div class="tx-flags">';
    (t.ahead || []).forEach(function (a) {
      var icon = a.kind === 'ok' ? 'check_circle' : a.kind === 'warn' ? 'warning' : 'flag';
      var col = a.kind === 'ok' ? '#15803D' : a.kind === 'warn' ? '#B45309' : '#1F4BD8';
      h += '<div class="tx-flag"><span class="material-symbols-outlined" style="color:' + col + '">' + icon + '</span><div><b>' + esc(a.title) + '</b> ' + esc(a.text) + '</div></div>';
    });
    h += '</div></div>';

    h += '<div class="tx-foot">';
    (t.assumptions || []).forEach(function (a) { h += '<span class="atl-chip">' + esc(a) + '</span>'; });
    h += '<span class="atl-chip">' + esc(t.source || '') + ' · 갱신 ' + esc((t.updatedAt || '').slice(0, 10)) + '</span>';
    h += '</div>';

    root.innerHTML = h;
    taxPensionChange(0);
  }

  // 연금저축·IRP 세액공제: 종합소득금액 4,500만 초과 → 12%(+지방 10%) = 13.2% (소득세법 제59조의3)
  function taxPensionChange(v) {
    if (!_tax || !_tax.y2026) return;
    var co = _tax.y2026.comprehensive;
    var amt = Number(v) * 1e4;
    var credit = Math.min(Math.min(amt, 900e4) * 0.12, co.decided);
    var save = credit * 1.1;
    var base = co.extra + co.local - (co.interim || 0);
    var may = base - save;
    var a = document.getElementById('tx-pension-in'), b = document.getElementById('tx-pension-out'), c = document.getElementById('tx-pension-may');
    if (a) a.textContent = man(amt) + '만 넣으면';
    if (b) b.innerHTML = man(save) + '<small>만</small>';
    if (c) c.innerHTML = amt ? '5월 종소세 <b class="down">' + man(base) + '만</b> → <b>' + (may >= 0 ? man(may) + '만' : '환급 ' + man(-may) + '만') + '</b>' : '연금저축은 55세 전에 꺼내면 공제받은 세금을 도로 내요. 독일 가서도 계좌는 유지 가능.';
  }

  function loadTax() {
    injectStyle();
    render();
    if (typeof db === 'undefined') return;
    db.collection('appSettings').doc('taxPlan').get().then(function (d) {
      _tax = d.exists ? d.data() : null;
      render();
    }).catch(function (e) { console.error('[Tax load]', e); render(); });
  }

  window.loadTax = loadTax;
  window.taxPensionChange = taxPensionChange;
  window._taxPreview = function (data) { injectStyle(); _tax = data; render(); };
})();
