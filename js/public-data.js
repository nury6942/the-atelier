// ═══════════════════════════════════════════════════════════
//  공공데이터 (2026-11-06) — 아이맥이 매일 08:10 쓰는 Firestore appSettings/publicData 를 **읽기만** 한다
//  (한국은행 ECOS 환율·기준금리·정기예금 금리·물가 · DART F&F · 국토부 우리 집 실거래)
//  사이트는 공공 API 를 직접 부르지 않는다 — 키는 아이맥 ~/.config/korea-apis/keys.env 에만.
//
//  1) 환율: window.atelierEcosFx(cur) → 1단위당 원화 (JPY 는 1엔). app-1-pages 의 환율 함수들이 무료 API 보다 먼저 씀
//  2) Assets: 페이지 머리 아래 한 줄 띠(우리 집 · 기준금리 · 물가) + 「금리 추이 ▾」 접는 그래프
//  캐시: localStorage atelier_public_data {at, data}
// ═══════════════════════════════════════════════════════════
(function () {
  var LS = 'atelier_public_data';
  var OPEN_LS = 'atelier_pd_rate_open';
  var REFRESH_MS = 3 * 3600 * 1000;
  var PD = null;

  function load() {
    try { var c = JSON.parse(localStorage.getItem(LS)); if (c && c.data) { PD = c.data; return c; } } catch (e) {}
    return null;
  }
  var cached = load();

  // ── 환율 ─────────────────────────────────────────
  function fxFresh() {
    if (!PD || !PD.fx || !PD.fx.date) return false;
    // 주말·연휴 포함 6일 안의 고시만 쓴다 (아이맥이 멈추면 무료 API 로 자연스럽게 넘어감)
    return (Date.now() - Date.parse(PD.fx.date + 'T00:00:00+09:00')) < 6 * 86400000;
  }
  window.atelierEcosFx = function (cur) {
    if (!fxFresh()) return null;
    cur = String(cur || '').toUpperCase();
    if (cur === 'JPY') return PD.fx.JPY100 ? PD.fx.JPY100 / 100 : null;
    var v = PD.fx[cur];
    return (typeof v === 'number' && v > 0) ? v : null;
  };
  window.atelierEcosFxLabel = function () {
    if (!fxFresh()) return '';
    var d = PD.fx.date;
    return '한국은행 매매기준율 · ' + d.slice(5, 7) + '/' + d.slice(8, 10);
  };
  function seedFxCache() {
    // 옛 코드가 캐시를 먼저 보는 곳을 위해 같은 자리에 ECOS 값을 넣어둔다
    if (!fxFresh()) return;
    var at = Date.parse(PD.updatedAt || '') || Date.now();
    try {
      if (PD.fx.EUR) localStorage.setItem('atelier_fx_eur_krw', JSON.stringify({ rate: PD.fx.EUR, at: at, src: 'ecos' }));
      ['USD', 'GBP', 'CAD', 'AUD', 'CHF', 'DKK', 'JPY'].forEach(function (c) {
        var v = window.atelierEcosFx(c); if (!v) return;
        localStorage.setItem('atelier_fx_' + c.toLowerCase() + '_krw', JSON.stringify({ rate: v, at: at, src: 'ecos' }));
        localStorage.setItem('atelier_fx_' + c + '_krw', JSON.stringify({ rate: v, fetchedAt: at, src: 'ecos' }));
      });
    } catch (e) {}
  }
  seedFxCache();

  // ── 숫자 모양 ─────────────────────────────────────
  var UP = '#15803D', DOWN = '#DC2626';
  function eok(man) { return (man / 10000).toFixed(2) + '억'; }
  function md(d) { return d ? (+d.slice(5, 7)) + '/' + (+d.slice(8, 10)) : ''; }
  function arrow(delta, txt) {
    if (delta > 0) return '<b style="color:' + UP + ';font-weight:700">▲' + txt + '</b>';
    if (delta < 0) return '<b style="color:' + DOWN + ';font-weight:700">▼' + txt + '</b>';
    return '<span>―' + (txt ? ' ' + txt : '') + '</span>';
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  // ── 내 파킹통장 실효 금리 (Assets 「이자 자동 계산」과 같은 규칙: 500만까지 3.01%, 초과분 2.40%) ──
  function myParkingRate() {
    try {
      var snap = JSON.parse(localStorage.getItem('atelier_snapshot_finance_hub') || 'null');
      var rows = snap && snap.data;
      if (!rows || !rows.length) return null;
      var now = new Date();
      var monthKey = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
      var bal = parseInt(localStorage.getItem('cashflow_base_cash') || '0', 10) || 0;
      rows.forEach(function (r) {
        var d = String(r.date || '');
        if (!d || d >= monthKey + '-01') return;
        if (String(r.category || '').indexOf('auto_interest:') === 0) return;
        var a = parseFloat(r.amount) || 0, t = r.type || '';
        if (t === '수입' || t === '이자') bal += a; else if (t === '지출') bal -= a;
      });
      if (bal <= 0) return null;
      var annual = Math.min(bal, 500) * 0.0301 + Math.max(bal - 500, 0) * 0.024;
      return { rate: Math.round(annual / bal * 10000) / 100, balance: bal };
    } catch (e) { return null; }
  }

  // ── 금리 그래프 (SVG, 그라데이션 없음) ─────────────
  function rateChart(rh) {
    var base = (rh && rh.base) || [], dep = (rh && rh.deposit) || [];
    if (!base.length) return '';
    var months = base.map(function (x) { return x.m; });
    dep.forEach(function (x) { if (months.indexOf(x.m) < 0) months.push(x.m); });
    months.sort();
    var vals = base.concat(dep).map(function (x) { return x.v; });
    var lo = Math.floor((Math.min.apply(null, vals) - 0.2) * 4) / 4, hi = Math.ceil((Math.max.apply(null, vals) + 0.2) * 4) / 4;
    var W = 720, H = 150, L = 36, R = 12, T = 10, B = 24;
    var X = function (m) { return L + (months.indexOf(m) / Math.max(months.length - 1, 1)) * (W - L - R); };
    var Y = function (v) { return T + (hi - v) / (hi - lo) * (H - T - B); };
    var step = '';
    base.forEach(function (p, i) { step += (i ? ' H' + X(p.m).toFixed(1) + ' V' : 'M' + X(p.m).toFixed(1) + ' ') + Y(p.v).toFixed(1); });
    var line = dep.map(function (p, i) { return (i ? 'L' : 'M') + X(p.m).toFixed(1) + ' ' + Y(p.v).toFixed(1); }).join(' ');
    var grid = '', y;
    for (y = lo; y <= hi + 1e-9; y += 0.5) {
      grid += '<line x1="' + L + '" x2="' + (W - R) + '" y1="' + Y(y).toFixed(1) + '" y2="' + Y(y).toFixed(1) + '" stroke="#ECECF0"/>' +
        '<text x="' + (L - 6) + '" y="' + (Y(y) + 4).toFixed(1) + '" text-anchor="end" font-size="11" fill="#5B5B66">' + y.toFixed(1) + '</text>';
    }
    var ticks = '';
    months.forEach(function (m, i) {
      if (i % 6 && i !== months.length - 1) return;
      ticks += '<text x="' + X(m).toFixed(1) + '" y="' + (H - 6) + '" text-anchor="middle" font-size="11" fill="#5B5B66">' + m.slice(2, 4) + '.' + m.slice(5, 7) + '</text>';
    });
    var lb = base[base.length - 1], ld = dep[dep.length - 1];
    var dots = '<circle cx="' + X(lb.m).toFixed(1) + '" cy="' + Y(lb.v).toFixed(1) + '" r="3" fill="#1F4BD8"/>' +
      (ld ? '<circle cx="' + X(ld.m).toFixed(1) + '" cy="' + Y(ld.v).toFixed(1) + '" r="3" fill="#1A1A1F"/>' : '');
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="display:block;max-width:760px;height:auto" role="img" aria-label="기준금리와 정기예금 평균 금리 24개월">' +
      grid + ticks +
      '<path d="' + step + '" fill="none" stroke="#1F4BD8" stroke-width="2"/>' +
      (line ? '<path d="' + line + '" fill="none" stroke="#1A1A1F" stroke-width="1.5"/>' : '') + dots + '</svg>';
  }

  // ── Assets 띠 ───────────────────────────────────
  function stripHtml() {
    var parts = [];
    var h = PD.home;
    if (h && h.trades && h.trades.length) {
      var t0 = h.trades[0], ya = h.yearAvg || {}, yrs = Object.keys(ya).sort();
      var s = '<span class="pd-seg">우리 집 · ' + esc(h.name) + ' ' + h.area + '㎡ — 최근 매매 <b>' + eok(t0.price) + '</b>(' + md(t0.date) + (t0.floor ? '·' + t0.floor + '층' : '') + ')';
      if (yrs.length) {
        var y1 = yrs[yrs.length - 1], y0 = yrs[yrs.length - 2];
        s += ' · ' + y1 + ' 평균 ' + eok(ya[y1]);
        if (y0) { var dp = (ya[y1] / ya[y0] - 1) * 100; s += ' ' + arrow(dp, Math.abs(dp).toFixed(1) + '%') + ' vs ' + y0; }
      }
      var ja = h.jeonse && h.jeonse.yearAvg, jy = ja ? Object.keys(ja).sort() : [];
      if (jy.length) s += ' · 전세 평균 ' + eok(ja[jy[jy.length - 1]]);
      parts.push(s + '</span>');
    }
    if (PD.rate && PD.rate.base != null) {
      var d = PD.rate.prev != null ? PD.rate.base - PD.rate.prev : 0;
      parts.push('<span class="pd-seg">기준금리 <b>' + PD.rate.base.toFixed(2) + '%</b> ' +
        (d ? arrow(d, Math.abs(d).toFixed(2) + '%p') + ' vs 전달' : '<span>전달과 같음</span>') + '</span>');
    }
    if (PD.cpi && PD.cpi.yoy != null) {
      parts.push('<span class="pd-seg">물가 <b>' + (PD.cpi.yoy > 0 ? '+' : '') + PD.cpi.yoy.toFixed(1) + '%</b> (' + (+PD.cpi.month.slice(5, 7)) + '월)</span>');
    }
    var open = false; try { open = localStorage.getItem(OPEN_LS) === '1'; } catch (e) {}
    if (PD.rateHistory && PD.rateHistory.base && PD.rateHistory.base.length) {
      parts.push('<button type="button" class="pd-tg" aria-expanded="' + open + '">금리 추이 ' + (open ? '▴' : '▾') + '</button>');
    }
    return { line: parts.join('<i class="pd-sep"></i>'), open: open };
  }
  function detailHtml() {
    var rh = PD.rateHistory || {}, b = rh.base || [], dp = rh.deposit || [];
    var lb = b[b.length - 1], ld = dp[dp.length - 1], me = myParkingRate();
    var cmp = (me ? '내 파킹통장 약 <b>' + me.rate.toFixed(2) + '%</b> vs ' : '') +
      (ld ? '정기예금 평균 <b>' + ld.v.toFixed(2) + '%</b> (' + (+ld.m.slice(5, 7)) + '월 신규)' : '') +
      (lb ? ' · 기준금리 <b>' + lb.v.toFixed(2) + '%</b>' : '');
    return '<div class="pd-cmp">' + cmp + '</div>' + rateChart(rh) +
      '<div class="pd-lg"><span><i style="background:#1F4BD8"></i>한국은행 기준금리</span><span><i style="background:#1A1A1F;height:1.5px"></i>' + esc(rh.depositLabel || '정기예금 평균') + '</span>' +
      (me ? '<span>내 금리 = 「이자 자동 계산」 규칙(500만까지 3.01%·초과 2.40%) × 이번 달 초 유동자산 ' + Math.round(me.balance).toLocaleString('ko-KR') + '만</span>' : '') + '</div>';
  }

  function ensureCss() {
    if (document.getElementById('pd-css')) return;
    var st = document.createElement('style'); st.id = 'pd-css';
    st.textContent =
      '#pd-strip{background:#fff;border:1px solid #ECECF0;border-radius:0;font-family:Pretendard,-apple-system,system-ui,sans-serif;color:#5B5B66;font-size:12px;line-height:1.5;margin:0 0 4px}' +
      '#pd-strip .pd-row{display:flex;align-items:center;flex-wrap:wrap;gap:4px 0;padding:7px 12px}' +
      '#pd-strip .pd-seg{white-space:nowrap}#pd-strip b{color:#1A1A1F;font-weight:700}' +
      '#pd-strip .pd-sep{display:inline-block;width:1px;height:12px;background:#ECECF0;margin:0 12px}' +
      '#pd-strip .pd-tg{margin-left:auto;padding:0 0 0 12px;background:none;border:0;border-radius:0;font:inherit;font-size:12px;font-weight:700;color:#1F4BD8;cursor:pointer;white-space:nowrap}' +
      '#pd-strip .pd-det{border-top:1px solid #ECECF0;padding:10px 12px 12px}' +
      '#pd-strip .pd-cmp{font-size:13px;margin-bottom:6px}' +
      '#pd-strip .pd-lg{display:flex;flex-wrap:wrap;gap:4px 16px;margin-top:4px;font-size:12px}' +
      '#pd-strip .pd-lg i{display:inline-block;width:14px;height:2px;vertical-align:middle;margin-right:6px}' +
      '@media (max-width:768px){#pd-strip .pd-seg{white-space:normal}#pd-strip .pd-sep{display:none}#pd-strip .pd-row{flex-direction:column;align-items:flex-start;gap:2px}#pd-strip .pd-tg{margin-left:0;padding:2px 0 0}}';
    document.head.appendChild(st);
  }

  function renderStrip() {
    if (!PD) return;
    var page = document.getElementById('page-finance-hub');
    var anchor = document.getElementById('hub-base-info');
    if (!page || !anchor) return;
    ensureCss();
    var el = document.getElementById('pd-strip');
    if (!el) {
      el = document.createElement('div'); el.id = 'pd-strip';
      anchor.parentNode.insertBefore(el, anchor);
      el.addEventListener('click', function (e) {
        if (!e.target.closest('.pd-tg')) return;
        var o = false; try { o = localStorage.getItem(OPEN_LS) !== '1'; localStorage.setItem(OPEN_LS, o ? '1' : '0'); } catch (x) {}
        renderStrip();
      });
    }
    var s = stripHtml();
    el.innerHTML = '<div class="pd-row">' + s.line + '</div>' + (s.open ? '<div class="pd-det">' + detailHtml() + '</div>' : '');
  }
  window.renderPublicDataStrip = renderStrip;

  function apply() {
    seedFxCache();
    renderStrip();
    try { window.dispatchEvent(new CustomEvent('atelier-public-data', { detail: PD })); } catch (e) {}
  }

  // ── Firestore 읽기 (로그인 뒤 한 번, 3시간 캐시) ────
  function fetchDoc() {
    try {
      firebase.firestore().collection('appSettings').doc('publicData').get().then(function (d) {
        if (!d.exists) return;
        var data = d.data();
        var changed = !PD || PD.updatedAt !== data.updatedAt;
        PD = data;
        try { localStorage.setItem(LS, JSON.stringify({ at: Date.now(), data: data })); } catch (e) {}
        if (changed) apply();
      }).catch(function (e) { console.warn('[publicData]', e && e.message); });
    } catch (e) {}
  }
  function start() {
    if (PD) renderStrip();
    if (typeof firebase === 'undefined' || !firebase.auth) return;
    var done = false;
    firebase.auth().onAuthStateChanged(function (u) {
      if (!u || done) return;
      done = true;
      if (!cached || Date.now() - cached.at > REFRESH_MS) fetchDoc();
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  // Assets 를 열 때마다 내 금리를 새 잔액으로 다시 계산
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('#nav-finance-hub,[onclick*="finance-hub"],[onclick*="switchMoneyTab(\'asset\')"]');
    if (a) setTimeout(renderStrip, 300);
  }, true);
})();
