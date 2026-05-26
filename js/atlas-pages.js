// ════════════════════════════════════════════════════════════════════
// Atlas 페이지 — Travel 안 4번째 탭. stitch Travel Atlas 디자인 적용.
// 메인 dashboard: hero + 타임라인 + trip 카드 4개 + Ledger + PTO + Wishlist
// ════════════════════════════════════════════════════════════════════
(function() {
  'use strict';

  // helper: 날카로운 영어 라벨 + 보라톤 통일
  // stitch 색: primary #630ed4, accent-vivid #7C3AED, accent-deep #6B38D4

  function _esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c) {
      return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]);
    });
  }

  function renderAtlas() {
    var DATA = window.ATLAS_DATA || { TRIPS: [], WISHLIST: [], totals: function(){ return { trips:0,days:0,pto:0,gross:0,own:0,countries:0 }; } };
    var trips = DATA.TRIPS || [];
    var wish = DATA.WISHLIST || [];
    var t = DATA.totals();

    var html = '';

    // ──────── ATLAS 자체 탭바 (외부 탭바와 동일 디자인, atlas active) ────────
    html += '<div class="mb-6 flex items-center justify-between flex-wrap gap-3">';
    html += '<div class="inline-flex gap-1 p-1 bg-slate-100 rounded-xl">';
    html += '<button onclick="switchTravelTab(\'schedule\')" class="travel-tab-btn px-4 py-2 rounded-lg text-sm font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition-all" data-tab="schedule">📅 일정</button>';
    html += '<button onclick="switchTravelTab(\'budget\')" class="travel-tab-btn px-4 py-2 rounded-lg text-sm font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition-all" data-tab="budget">💰 예산</button>';
    html += '<button onclick="switchTravelTab(\'checklist\')" class="travel-tab-btn px-4 py-2 rounded-lg text-sm font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1.5 transition-all" data-tab="checklist">✅ 체크리스트</button>';
    html += '<button onclick="switchTravelTab(\'atlas\')" class="travel-tab-btn travel-tab-active px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-1.5 transition-all" data-tab="atlas">🗺️ Atlas</button>';
    html += '</div>';
    html += '</div>';

    // ──────── HERO ────────
    html += '<section class="atlas-hero">';
    html += '<div class="atlas-hero-grid">';
    html += '<div class="atlas-hero-left">';
    html += '<p class="atlas-eyebrow">Issue No. 04 — 2027 / 2028 itinerary</p>';
    html += '<h1 class="atlas-hero-h1">The Atlas <span class="atlas-hero-amp">&amp;</span><br>Almanac</h1>';
    html += '<p class="atlas-hero-tagline">먼 미래의 여행을 미리 그려보는 페이지. 일정·예산·PTO는 러프하게, 그래도 다 적혀있게.</p>';
    html += '</div>';
    html += '<div class="atlas-hero-right">';
    html += _heroStat('Year Range', '2027—2028');
    html += _heroStat('Total Volume', t.trips + ' Major Trips');
    html += _heroStat('Duration', t.days + ' Global Days');
    html += _heroStat('Countries', String(t.countries));
    html += _heroStat('PTO Days', String(t.pto));
    html += '</div>';
    html += '</div>';
    html += '</section>';

    // ──────── HORIZONTAL TIMELINE ────────
    html += '<section class="atlas-section atlas-timeline-section">';
    html += '<div class="atlas-timeline-grid">';
    html += '<div class="atlas-timeline-meta">';
    html += '<h2 class="atlas-h2">The Sequence</h2>';
    html += '<p class="atlas-meta-sub">Chronological progression of expeditions.</p>';
    html += '</div>';
    html += '<div class="atlas-timeline-line">';
    trips.forEach(function(tr, i) {
      html += '<div class="atlas-tl-node' + (tr.isCurrent ? ' is-current' : '') + '">';
      html += '<span class="atlas-tl-dot"></span>';
      html += '<div>';
      html += '<p class="atlas-tl-when">' + _esc(tr.monthShort || tr.month) + '</p>';
      html += '<p class="atlas-tl-title">' + _esc(tr.title.replace(/^The\s+/, '')) + '</p>';
      html += '</div>';
      html += '</div>';
      if (i < trips.length - 1) html += '<span class="atlas-tl-arrow">→</span>';
    });
    html += '</div>';
    html += '</div>';
    html += '</section>';

    // ──────── TRIP GALLERY (4 cards) ────────
    html += '<section class="atlas-section atlas-gallery-section">';
    html += '<div class="atlas-gallery">';
    trips.forEach(function(tr) {
      html += '<div class="atlas-trip-card" onclick="window.atlasOpenTrip && atlasOpenTrip(\'' + tr.id + '\')">';
      html += '<div class="atlas-trip-img" style="background:' + tr.gradient + '">';
      html += '<div class="atlas-trip-flags">' + tr.flags + '</div>';
      html += '<div class="atlas-trip-code">' + _esc(tr.countryCodes) + '</div>';
      html += '</div>';
      html += '<div class="atlas-trip-body">';
      html += '<h3 class="atlas-trip-title">' + _esc(tr.cities) + '</h3>';
      html += '<div class="atlas-trip-row"><span class="atlas-trip-k">DATES</span><span class="atlas-trip-v">' + _esc(tr.dates) + '</span></div>';
      html += '<div class="atlas-trip-row"><span class="atlas-trip-k">STAY</span><span class="atlas-trip-v">' + tr.days + ' Days · ' + tr.nights + ' Nights</span></div>';
      html += '<p class="atlas-trip-route">' + _esc((tr.route || []).slice(0, 3).join(' → ')) + '</p>';
      html += '</div>';
      html += '</div>';
    });
    html += '</div>';
    html += '</section>';

    // ──────── LEDGER + PTO TRACKER (2-col) ────────
    html += '<section class="atlas-section atlas-ledger-section">';
    html += '<div class="atlas-ledger-grid">';
    // Ledger
    html += '<div class="atlas-ledger">';
    html += '<h4 class="atlas-h4">Travel Investment Ledger</h4>';
    html += '<div class="atlas-ledger-rows">';
    trips.forEach(function(tr) {
      html += '<div class="atlas-ledger-row">';
      html += '<span class="atlas-ledger-name">' + _esc(tr.title) + '</span>';
      html += '<span class="atlas-ledger-amt">₩' + tr.gross + ' 만</span>';
      html += '</div>';
    });
    html += '<div class="atlas-ledger-total">';
    html += '<span class="atlas-ledger-total-l">Gross Total</span>';
    html += '<span class="atlas-ledger-total-v">₩' + t.gross + ' 만</span>';
    html += '</div>';
    html += '<div class="atlas-ledger-net">';
    html += '<span class="atlas-ledger-net-l">Own Funds</span>';
    html += '<span class="atlas-ledger-net-v">₩' + t.own + ' 만</span>';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    // PTO Tracker
    html += '<div class="atlas-pto">';
    html += '<h4 class="atlas-h4 atlas-h4-light">PTO Efficiency Tracker</h4>';
    html += '<div class="atlas-pto-big">' + t.pto + '<span class="atlas-pto-big-l">Days Total Used</span></div>';
    html += '<p class="atlas-pto-desc">전략적 공휴일 정렬로 ' + t.pto + ' PTO만으로 ' + t.days + '일 여행 확보.</p>';
    html += '<div class="atlas-pto-list">';
    trips.forEach(function(tr) {
      var pct = Math.round((tr.ptoDays / Math.max(t.pto, 1)) * 100);
      html += '<div class="atlas-pto-row">';
      html += '<span class="atlas-pto-row-l">' + _esc(tr.title.replace(/^The\s+/, '')) + ': ' + tr.ptoDays + 'd</span>';
      html += '<span class="atlas-pto-row-bar"><span style="width:' + pct + '%"></span></span>';
      html += '</div>';
    });
    html += '</div>';
    html += '</div>';
    html += '</div>';
    html += '</section>';

    // ──────── WISHLIST ────────
    html += '<section class="atlas-section atlas-wishlist-section">';
    html += '<h2 class="atlas-h2 atlas-h2-border">Future Iterations — The Wishlist</h2>';
    html += '<div class="atlas-wish-grid">';
    wish.forEach(function(w) {
      html += '<div class="atlas-wish-cell">';
      html += '<span class="atlas-wish-no">' + _esc(w.no) + '</span>';
      html += '<div class="atlas-wish-flag">' + w.flag + '</div>';
      html += '<span class="atlas-wish-name">' + _esc(w.name) + '</span>';
      html += '<p class="atlas-wish-note">' + _esc(w.note) + '</p>';
      html += '</div>';
    });
    html += '</div>';
    html += '</section>';

    return html;
  }

  function _heroStat(label, value) {
    return '<div class="atlas-hero-stat">' +
      '<span class="atlas-hero-stat-l">' + _esc(label) + '</span>' +
      '<span class="atlas-hero-stat-v">' + _esc(value) + '</span>' +
    '</div>';
  }

  // trip 클릭 → 디테일 페이지 (Phase 2에서 구현)
  function atlasOpenTrip(tripId) {
    if (typeof showSyncToast === 'function') showSyncToast('🔜 Trip 디테일 페이지는 다음 단계에서 구현됩니다 (' + tripId + ')');
  }
  window.atlasOpenTrip = atlasOpenTrip;

  // Atlas 탭 표시 (journey 페이지 안에서 호출)
  function showAtlasView() {
    var atlasSection = document.getElementById('travel-atlas-section');
    if (!atlasSection) return;
    atlasSection.innerHTML = renderAtlas();
    atlasSection.style.display = 'block';
    // 페이지 헤더 타이틀
    var titleEl = document.getElementById('page-title');
    if (titleEl) titleEl.textContent = 'Travel · Atlas';
  }
  function hideAtlasView() {
    var atlasSection = document.getElementById('travel-atlas-section');
    if (atlasSection) atlasSection.style.display = 'none';
    // page-content-wrap 복구 (journey 페이지)
    var page = document.getElementById('page-journey');
    if (page) {
      var contentWrap = page.querySelector('.page-content-wrap');
      if (contentWrap) contentWrap.style.display = '';
    }
  }
  window.showAtlasView = showAtlasView;
  window.hideAtlasView = hideAtlasView;
})();
