// ════════════════════════════════════════════════════════════════════
// Nomad Master 페이지 렌더링 모듈
// 28개 sub-page를 페이지 내부 sub-sidebar로 라우팅
// Phase 2 이후 각 페이지 실제 구현
// ════════════════════════════════════════════════════════════════════

window.NOMAD_PAGES = (function(){
  var DATA = window.NOMAD_DATA;
  if (!DATA) {
    console.error('[NOMAD_PAGES] NOMAD_DATA가 로드 안 됨');
    return {};
  }

  // 현재 활성화된 sub-page
  var currentSubPage = null;

  // ──────── 공통 헬퍼 ────────
  function pageHeader(eyebrow, title, sub) {
    return '<div class="nm-page-header">' +
      (eyebrow ? '<div class="nm-page-eyebrow">' + eyebrow + '</div>' : '') +
      '<div class="nm-page-title">' + title + '</div>' +
      (sub ? '<div class="nm-page-sub">' + sub + '</div>' : '') +
    '</div>';
  }

  function placeholderPage(id, title) {
    return pageHeader('Nomad Master', title, '곧 구현 예정 · Phase 진행 중') +
      '<div class="nm-card"><p style="color:var(--nm-text-3); text-align:center; padding:60px 0;">' +
        '🚧 <strong>' + title + '</strong> 페이지는 다음 단계에서 구현됩니다.<br>' +
        '<span style="font-size:12px">Page ID: ' + id + '</span>' +
      '</p></div>';
  }

  // ──────── 페이지 렌더 디스패처 ────────
  var renderers = {};

  // 기본값: placeholder (모든 페이지)
  (DATA.NAV || []).forEach(function(group) {
    (group.items || []).forEach(function(item) {
      renderers[item.id] = function() {
        return placeholderPage(item.id, item.label);
      };
    });
  });

  function renderPage(subPageId) {
    var renderer = renderers[subPageId];
    if (!renderer) {
      return pageHeader('Error', 'Page Not Found', 'subPageId: ' + subPageId) +
        '<div class="nm-card">알 수 없는 페이지입니다.</div>';
    }
    return renderer();
  }

  function registerPage(subPageId, renderFn) {
    renderers[subPageId] = renderFn;
  }

  // ──────── 공통 계산 헬퍼 ────────
  var DEPARTURE_DATE = '2028-06-09'; // 인천 → 리스본
  var RETURN_DATE = '2029-06-30';    // 핼리팩스 → 인천
  var PHASE_BOUNDARIES = [
    { id: 'A', name: 'Foundation', start: '2026-05-01', end: '2026-12-31', icon: 'foundation' },
    { id: 'B', name: 'Build & Gate', start: '2027-01-01', end: '2027-12-31', icon: 'sync' },
    { id: 'C', name: 'Exit',         start: '2028-01-01', end: '2028-05-31', icon: 'logout' },
    { id: 'D', name: 'Departure',    start: '2028-06-01', end: '2028-06-09', icon: 'flight_takeoff' },
  ];

  function daysBetween(fromYMD, toYMD) {
    var f = new Date(fromYMD + 'T00:00:00');
    var t = new Date(toYMD + 'T00:00:00');
    return Math.round((t - f) / (1000 * 60 * 60 * 24));
  }
  function todayYMD() {
    var d = new Date();
    return d.getFullYear() + '-' +
      String(d.getMonth()+1).padStart(2,'0') + '-' +
      String(d.getDate()).padStart(2,'0');
  }
  function currentPhase() {
    var today = todayYMD();
    for (var i = 0; i < PHASE_BOUNDARIES.length; i++) {
      var p = PHASE_BOUNDARIES[i];
      if (today >= p.start && today <= p.end) {
        return Object.assign({}, p, { idx: i, status: 'current' });
      }
    }
    // 출국 이후
    if (today > DEPARTURE_DATE) return { id: '*', name: 'On Voyage', idx: 4, status: 'voyaging' };
    // 출국 전이지만 phase 외 (출국 직전 등)
    return Object.assign({}, PHASE_BOUNDARIES[0], { idx: 0, status: 'before' });
  }
  function fmtMan(n) { // 만 원 단위 한국식 포맷
    return '₩' + Number(n).toLocaleString('ko-KR') + '만';
  }
  function getNextCity() {
    // 출국 후엔 VOYAGE 중 미래 도시, 출국 전엔 VOYAGE[0]
    var today = todayYMD();
    if (today < DEPARTURE_DATE) return DATA.VOYAGE[0];
    // 단순화: 첫 voyage 반환 (실제 도시 진행 로직은 future enhancement)
    return DATA.VOYAGE[0];
  }

  // ──────── Overview 페이지 (Stitch Magazine 디자인) ────────
  function renderOverview() {
    var oneoff = DATA.BUDGET_ONEOFF;
    var monthlyTotal = DATA.BUDGET.reduce(function(a,b){ return a + b.total; }, 0);
    var grandTotal = monthlyTotal + oneoff.flights + oneoff.visa + oneoff.insurance + oneoff.misc;
    var consumableTotal = grandTotal - oneoff.misc; // 예비비 제외

    var dDay = daysBetween(todayYMD(), DEPARTURE_DATE);
    var phase = currentPhase();
    var nextCity = getNextCity();

    // 진행률 (Phase A 시작일 ~ 출국일 사이에서 오늘 위치)
    var totalDays = daysBetween('2026-05-01', DEPARTURE_DATE);
    var doneDays = daysBetween('2026-05-01', todayYMD());
    var progressPct = Math.max(0, Math.min(100, Math.round((doneDays / totalDays) * 100)));

    // Secondary bento용 데이터
    var packing = DATA.PACKING || {};
    var packingCategoryCount = Object.keys(packing).length;
    var packingItemCount = Object.keys(packing).reduce(function(sum, k) {
      return sum + (packing[k] || []).length;
    }, 0);
    var visaList = DATA.VISA_LIST || [];
    var actions = DATA.ACTIONS_BY_PERIOD || [];
    var thisWeekActions = (actions[0] && actions[0].items) ? actions[0].items.length : 0;

    var html = '';

    // Page Header
    html += pageHeader('Voyage Snapshot', '1년 노마드 한눈에',
      '2028.6.9 인천 출국 · 17개 도시 · 6개 대륙');

    // ════════ SECTION 1 · Voyage Snapshot (border-l-4 액센트 + Live Updates) ════════
    html += '<section class="nm-section">';
    html += '<div class="nm-section-head">' +
      '<h3 class="nm-headline-md">Voyage Snapshot</h3>' +
      '<span class="nm-label-sm" style="color:var(--nm-primary);text-transform:uppercase;letter-spacing:0.1em;font-weight:700">Live Updates</span>' +
    '</div>';
    html += '<div class="nm-grid nm-grid-4">';

    // 출국까지 — border-l accent-accent (soft-accent 인디고 블루)
    html += '<div class="nm-bento" style="border-left:4px solid var(--nm-soft-accent)">' +
      '<p class="nm-label-sm" style="margin-bottom:8px">출국까지</p>' +
      '<h4 class="nm-headline-lg">' + (dDay > 0 ? 'D-' + dDay : '🎉') + '</h4>' +
      '<div style="margin-top:16px;height:4px;background:var(--nm-surface-container);border-radius:99px;overflow:hidden">' +
        '<div style="height:100%;width:' + progressPct + '%;background:var(--nm-soft-accent)"></div>' +
      '</div>' +
      '<p class="nm-label-sm" style="margin-top:8px;text-transform:none;letter-spacing:0;color:var(--nm-text-3)">진행률 ' + progressPct + '% · 2028.6.9 리스본</p>' +
    '</div>';

    // 노마드 게이트 — border-l secondary
    html += '<div class="nm-bento" style="border-left:4px solid var(--nm-secondary)">' +
      '<p class="nm-label-sm" style="margin-bottom:8px">노마드 게이트</p>' +
      '<h4 class="nm-headline-lg">₩450만</h4>' +
      '<div style="margin-top:16px;display:flex;align-items:center;gap:6px;color:var(--nm-text-2);font-size:12px">' +
        '<span class="material-symbols-outlined" style="font-size:14px;color:#15803d">trending_up</span>' +
        '월 본업 외 수익 · 욕심 ₩800만' +
      '</div>' +
    '</div>';

    // 1년 총 예산 — border-l tertiary
    html += '<div class="nm-bento" style="border-left:4px solid #ffb784">' +
      '<p class="nm-label-sm" style="margin-bottom:8px">1년 총 예산</p>' +
      '<h4 class="nm-headline-lg">' + fmtMan(grandTotal) + '</h4>' +
      '<p class="nm-label-sm" style="margin-top:16px;text-transform:none;letter-spacing:0;color:var(--nm-text-3)">소비성 ' + fmtMan(consumableTotal) + '</p>' +
    '</div>';

    // 총 도시 — border-l primary
    html += '<div class="nm-bento" style="border-left:4px solid var(--nm-primary)">' +
      '<p class="nm-label-sm" style="margin-bottom:8px">총 도시</p>' +
      '<h4 class="nm-headline-lg">17 cities</h4>' +
      '<p class="nm-label-sm" style="margin-top:16px;text-transform:none;letter-spacing:0;color:var(--nm-text-3)">유럽 10 · 오세아니아 4 · 미주 3</p>' +
    '</div>';

    html += '</div></section>';

    // ════════ SECTION 2 · Phase Progress ════════
    html += '<section class="nm-section">';
    html += '<div class="nm-card nm-card-lg">';
    html += '<div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:32px">';
    html += '<div>' +
      '<h3 class="nm-headline-md">Phase Progress</h3>' +
      '<p class="nm-label-sm" style="margin-top:4px;text-transform:none;letter-spacing:0;color:var(--nm-text-3)">' +
        '현재: <strong style="color:var(--nm-primary)">Phase ' + phase.id + ' · ' + phase.name + '</strong>' +
      '</p>' +
    '</div>';
    html += '<p class="nm-label-md" style="color:var(--nm-primary);font-weight:700">' + progressPct + '% Complete</p>';
    html += '</div>';

    // 4 step indicator (Stitch icon 매핑: done=check / current=sync / upcoming=lock / final=flight_takeoff)
    html += '<div style="position:relative;padding-top:16px">';
    html += '<div style="display:flex;justify-content:space-between;position:relative;z-index:1">';
    PHASE_BOUNDARIES.forEach(function(p, i) {
      var state = i < phase.idx ? 'done' : (i === phase.idx ? 'current' : 'upcoming');
      var isFinal = (i === PHASE_BOUNDARIES.length - 1);
      var iconName;
      if (state === 'done') iconName = 'check';
      else if (state === 'current') iconName = 'sync';
      else if (isFinal) iconName = 'flight_takeoff';
      else iconName = 'lock';
      var bg = state === 'upcoming' ? 'var(--nm-surface-container)' : 'var(--nm-primary)';
      var color = state === 'upcoming' ? 'var(--nm-on-surface-variant)' : '#fff';
      var ring = state === 'current' ? 'box-shadow:0 0 0 6px var(--nm-primary-fixed);' : '';
      var opacity = state === 'upcoming' ? 'opacity:0.4;' : '';
      html += '<div style="display:flex;flex-direction:column;align-items:center;flex:1;' + opacity + '">' +
        '<div style="width:36px;height:36px;border-radius:50%;background:' + bg + ';color:' + color + ';display:flex;align-items:center;justify-content:center;margin-bottom:10px;' + ring + '">' +
          '<span class="material-symbols-outlined" style="font-size:18px">' + iconName + '</span>' +
        '</div>' +
        '<span class="nm-label-sm" style="text-transform:none;letter-spacing:0;font-weight:' + (state === 'current' ? '700' : '500') + ';color:' + (state === 'current' ? 'var(--nm-primary)' : 'var(--nm-text-2)') + '">' + p.name + '</span>' +
        '<span class="nm-label-sm" style="margin-top:2px;color:var(--nm-text-3);font-size:10px;letter-spacing:0;text-transform:none">' + p.start.substring(0,7) + ' ~ ' + p.end.substring(0,7) + '</span>' +
      '</div>';
    });
    html += '</div>';
    // 진행 라인 (배경)
    html += '<div style="position:absolute;top:34px;left:48px;right:48px;height:3px;background:var(--nm-surface-container);border-radius:99px;z-index:0">' +
      '<div style="height:100%;background:var(--nm-primary);width:' + progressPct + '%;border-radius:99px"></div>' +
    '</div>';
    html += '</div>';

    html += '<div class="nm-quote" style="margin-top:24px">' +
      '<strong>현재 위치:</strong> Phase ' + phase.id + ' (' + phase.name + ') 진입. 이번 주 = 필명 + 도메인 + 메일리.' +
    '</div>';
    html += '</div>';
    html += '</section>';

    // ════════ SECTION 3 · 8/4 Split — Performance Tracks + Next Destination ════════
    html += '<div class="nm-grid nm-grid-2-1" style="margin-bottom:32px">';

    // ───── 왼쪽 (8): Performance Tracks ─────
    html += '<div class="nm-card nm-card-lg">';
    html += '<h3 class="nm-headline-md" style="margin-bottom:24px">Performance Tracks</h3>';

    // Main Track — primary 액센트
    html += '<div style="background:rgba(245,243,255,0.5);border:1px solid rgba(204,195,216,0.2);border-radius:12px;padding:20px;margin-bottom:16px">';
    html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px">';
    html += '<div>' +
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">' +
        '<span style="width:8px;height:8px;border-radius:50%;background:var(--nm-primary)"></span>' +
        '<h4 style="font-family:Manrope;font-size:18px;font-weight:600;color:var(--nm-deep-indigo)">Main Track · 포스타입 웹소</h4>' +
      '</div>' +
      '<p style="font-size:12px;color:var(--nm-text-3)">B시리즈 · 게이트 평가 핵심 트랙</p>' +
    '</div>';
    html += '<span class="nm-pill" style="background:var(--nm-primary-fixed);color:#5a00c6">High Priority</span>';
    html += '</div>';
    html += '<div class="nm-grid nm-grid-2" style="gap:12px">';
    html += '<div style="background:#fff;border-radius:8px;padding:14px"><p style="font-size:11px;color:var(--nm-text-3);font-weight:600">현재 월 수익</p><p style="font-family:Manrope;font-size:18px;font-weight:600;color:var(--nm-on-surface);margin-top:4px">₩200-250만</p></div>';
    html += '<div style="background:#fff;border-radius:8px;padding:14px"><p style="font-size:11px;color:var(--nm-text-3);font-weight:600">2027.12 목표</p><p style="font-family:Manrope;font-size:18px;font-weight:600;color:var(--nm-on-surface);margin-top:4px">월 ₩450만</p></div>';
    html += '</div>';
    html += '<p style="font-size:11px;color:var(--nm-text-3);margin-top:10px">욕심 라인 = 월 ₩700-800만 도달 시 노마드 + 저축</p>';
    html += '</div>';

    // Sub Track — secondary 액센트
    html += '<div style="background:rgba(230,238,255,0.3);border:1px solid rgba(204,195,216,0.1);border-radius:12px;padding:20px">';
    html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px">';
    html += '<div>' +
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">' +
        '<span style="width:8px;height:8px;border-radius:50%;background:var(--nm-secondary)"></span>' +
        '<h4 style="font-family:Manrope;font-size:18px;font-weight:600;color:var(--nm-deep-indigo)">Sub Track · 분석가 N IP</h4>' +
      '</div>' +
      '<p style="font-size:12px;color:var(--nm-text-3)">2026.5 Phase 1 진입 → 2027.12 Phase 7 도달</p>' +
    '</div>';
    html += '<span class="nm-pill" style="background:#e2dfff;color:#393689">Stable</span>';
    html += '</div>';
    html += '<div class="nm-grid nm-grid-2" style="gap:12px">';
    html += '<div style="background:#fff;border-radius:8px;padding:14px"><p style="font-size:11px;color:var(--nm-text-3);font-weight:600">예상 월 수익</p><p style="font-family:Manrope;font-size:18px;font-weight:600;color:var(--nm-on-surface);margin-top:4px">₩100-300만</p></div>';
    html += '<div style="background:#fff;border-radius:8px;padding:14px"><p style="font-size:11px;color:var(--nm-text-3);font-weight:600">포지션</p><p style="font-family:Manrope;font-size:18px;font-weight:600;color:var(--nm-on-surface);margin-top:4px">장기 자산</p></div>';
    html += '</div>';
    html += '<p style="font-size:11px;color:var(--nm-text-3);margin-top:10px">게이트 외 · 장기 자산 트랙 (글 + 도메인 + 컨설팅)</p>';
    html += '</div>';

    html += '</div>'; // /Performance Tracks card

    // ───── 오른쪽 (4): Next Destination 매거진 카드 ─────
    html += '<div class="nm-card" style="padding:0;overflow:hidden;display:flex;flex-direction:column">';
    // 그라데이션 hero 헤더 (이미지 fallback)
    html += '<div style="height:160px;position:relative;background:linear-gradient(135deg,#7C3AED 0%,#a78bfa 50%,#fbbf24 100%)">' +
      '<div style="position:absolute;top:14px;left:14px;display:flex;gap:8px">' +
        '<span style="background:rgba(255,255,255,0.95);backdrop-filter:blur(8px);color:var(--nm-primary);padding:5px 12px;border-radius:99px;font-size:11px;font-weight:700;box-shadow:0 1px 3px rgba(0,0,0,0.1)">Next Stop</span>' +
        '<span style="background:var(--nm-deep-indigo);color:#fff;padding:5px 12px;border-radius:99px;font-size:11px;font-weight:600;display:flex;align-items:center;gap:4px;box-shadow:0 1px 3px rgba(0,0,0,0.15)">' +
          '<span class="material-symbols-outlined" style="font-size:13px">edit</span>' +
          (nextCity.mode || '글 풀가동') +
        '</span>' +
      '</div>' +
      '<div style="position:absolute;bottom:14px;left:18px;color:#fff">' +
        '<div style="font-size:32px;line-height:1">🇵🇹</div>' +
      '</div>' +
    '</div>';
    // 카드 본문
    html += '<div style="padding:20px;flex:1;display:flex;flex-direction:column">';
    html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:8px">' +
      '<h4 style="font-family:Manrope;font-size:20px;font-weight:700;color:var(--nm-on-surface)">' + nextCity.city + '</h4>' +
      '<span class="material-symbols-outlined" style="color:var(--nm-text-3);font-size:18px">location_on</span>' +
    '</div>';
    html += '<p style="font-size:13px;color:var(--nm-text-2);line-height:1.6;margin-bottom:20px;flex:1">' + nextCity.detail + '</p>';
    // 정보 행
    html += '<div style="display:flex;flex-direction:column;gap:0;border-top:1px solid #f1f5f9">';
    html += '<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f1f5f9">' +
      '<span style="font-size:12px;color:var(--nm-text-3)">도착 예정</span>' +
      '<span style="font-size:12px;font-weight:700;color:var(--nm-on-surface);font-family:Manrope">2028.6.9</span>' +
    '</div>';
    html += '<div style="display:flex;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f1f5f9">' +
      '<span style="font-size:12px;color:var(--nm-text-3)">체류 기간</span>' +
      '<span style="font-size:12px;font-weight:700;color:var(--nm-on-surface);font-family:Manrope">30 Days</span>' +
    '</div>';
    html += '<div style="display:flex;justify-content:space-between;padding:10px 0">' +
      '<span style="font-size:12px;color:var(--nm-text-3)">예산</span>' +
      '<span style="font-size:12px;font-weight:700;color:var(--nm-primary);font-family:Manrope">₩' + nextCity.cost + '만</span>' +
    '</div>';
    html += '</div>';
    // 버튼
    html += '<button onclick="NOMAD_PAGES.go(\'nomad-city-porto\')" style="margin-top:14px;padding:11px;border:1px solid var(--nm-primary);color:var(--nm-primary);background:#fff;border-radius:10px;font-size:13px;font-weight:600;cursor:pointer;transition:background 0.15s;font-family:Manrope" onmouseover="this.style.background=\'var(--nm-primary-soft)\'" onmouseout="this.style.background=\'#fff\'">' +
      'View City Guide' +
    '</button>';
    html += '</div>';
    html += '</div>'; // /Next Destination card

    html += '</div>'; // /2-col grid

    // ════════ SECTION 4 · Secondary Bento Grid (4 카드 · 다른 페이지 cross-link) ════════
    html += '<section class="nm-section">';
    html += '<div class="nm-section-head">' +
      '<h3 class="nm-headline-md">Operational Status</h3>' +
      '<span class="nm-label-sm" style="color:var(--nm-text-3);text-transform:uppercase;letter-spacing:0.1em">Cross-Page Links</span>' +
    '</div>';
    html += '<div class="nm-grid nm-grid-4">';

    // Logistics Hub → Packing
    html += '<div class="nm-bento" style="cursor:pointer" onclick="NOMAD_PAGES.go(\'nomad-packing\')" onmouseover="this.style.transform=\'translateY(-2px)\'" onmouseout="this.style.transform=\'none\'">' +
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">' +
        '<span class="material-symbols-outlined" style="font-size:18px;color:#7d3d00">inventory_2</span>' +
        '<h5 style="font-family:Manrope;font-size:14px;font-weight:600;color:var(--nm-on-surface)">Logistics Hub</h5>' +
      '</div>' +
      '<p style="font-size:13px;color:var(--nm-text-2);line-height:1.5">' +
        '<strong style="color:var(--nm-deep-indigo)">' + packingCategoryCount + ' 카테고리</strong> · ' + packingItemCount + ' 항목' +
      '</p>' +
      '<p style="font-size:11px;color:var(--nm-text-3);margin-top:6px">캐리어 · 백팩 · 휴대 짐 계획</p>' +
    '</div>';

    // Visa Status → Visa
    html += '<div class="nm-bento" style="cursor:pointer" onclick="NOMAD_PAGES.go(\'nomad-visa\')" onmouseover="this.style.transform=\'translateY(-2px)\'" onmouseout="this.style.transform=\'none\'">' +
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">' +
        '<span class="material-symbols-outlined" style="font-size:18px;color:var(--nm-soft-accent)">verified_user</span>' +
        '<h5 style="font-family:Manrope;font-size:14px;font-weight:600;color:var(--nm-on-surface)">Visa Status</h5>' +
      '</div>' +
      '<p style="font-size:13px;color:var(--nm-text-2);line-height:1.5">' +
        '<strong style="color:var(--nm-deep-indigo)">' + visaList.length + '개 비자</strong> · 셰겐 84/90' +
      '</p>' +
      '<p style="font-size:11px;color:var(--nm-text-3);margin-top:6px">워홀 + ETA·ESTA·eTA·NZeTA</p>' +
    '</div>';

    // Next Actions → Actions
    html += '<div class="nm-bento" style="cursor:pointer" onclick="NOMAD_PAGES.go(\'nomad-actions\')" onmouseover="this.style.transform=\'translateY(-2px)\'" onmouseout="this.style.transform=\'none\'">' +
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">' +
        '<span class="material-symbols-outlined" style="font-size:18px;color:#ba1a1a">fact_check</span>' +
        '<h5 style="font-family:Manrope;font-size:14px;font-weight:600;color:var(--nm-on-surface)">Next Actions</h5>' +
      '</div>' +
      '<p style="font-size:13px;color:var(--nm-text-2);line-height:1.5">' +
        '<strong style="color:var(--nm-deep-indigo)">이번 주 ' + thisWeekActions + '개</strong>' +
      '</p>' +
      '<p style="font-size:11px;color:var(--nm-text-3);margin-top:6px">필명 · 도메인 · 메일리 · 계좌 분리</p>' +
    '</div>';

    // Webnovel Queue → IPTrack
    html += '<div class="nm-bento" style="cursor:pointer" onclick="NOMAD_PAGES.go(\'nomad-ip\')" onmouseover="this.style.transform=\'translateY(-2px)\'" onmouseout="this.style.transform=\'none\'">' +
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px">' +
        '<span class="material-symbols-outlined" style="font-size:18px;color:var(--nm-primary)">menu_book</span>' +
        '<h5 style="font-family:Manrope;font-size:14px;font-weight:600;color:var(--nm-on-surface)">Webnovel Queue</h5>' +
      '</div>' +
      '<p style="font-size:13px;color:var(--nm-text-2);line-height:1.5">' +
        '<strong style="color:var(--nm-deep-indigo)">월 ₩450만</strong> · 게이트 목표' +
      '</p>' +
      '<p style="font-size:11px;color:var(--nm-text-3);margin-top:6px">B시리즈 · 메인 트랙</p>' +
    '</div>';

    html += '</div></section>';

    return html;
  }
  registerPage('nomad-overview', renderOverview);

  // ──────── 12-Month Voyage 페이지 ────────
  function visaPillClass(visa) {
    // 비자 종류에 따라 pill 색 결정
    if (visa.indexOf('워홀') >= 0) return 'background:#ffe0cd;color:#713700'; // tertiary
    if (visa.indexOf('셰겐') >= 0) return 'background:#eaddff;color:#5a00c6'; // primary-fixed
    if (visa === 'ETA' || visa === 'ESTA' || visa === 'eTA' || visa === 'NZeTA') return 'background:#dee9fc;color:#27313f'; // surface-container-high
    return 'background:#f1f5f9;color:#475569';
  }

  // 모드별 아이콘 매핑 (Voyage 테이블 모드 셀)
  function voyageModeIcon(mode) {
    if (mode.indexOf('풀가동') >= 0) return 'edit_square';
    if (mode.indexOf('해변') >= 0) return 'beach_access';
    if (mode.indexOf('자연') >= 0) return 'forest';
    if (mode.indexOf('예술') >= 0) return 'palette';
    if (mode.indexOf('휴가') >= 0) return 'spa';
    if (mode.indexOf('이동') >= 0) return 'sync_alt';
    if (mode.indexOf('위성') >= 0) return 'orbit';
    if (mode.indexOf('미국') >= 0) return 'public';
    if (mode.indexOf('마무리') >= 0) return 'flag';
    return 'edit';
  }

  // 도시별 서브 라벨 (국가 · 역할)
  function voyageCityNode(city) {
    var map = {
      '포르투': { country: 'Portugal', node: '워홀 베이스 A' },
      '더블린 + 골웨이': { country: 'Ireland', node: '아란·모헤어 위성' },
      '코펜하겐 + 베르겐': { country: 'Denmark · Norway', node: '디자인 + 피요르드' },
      '스톡홀름 + 헬싱키': { country: 'Sweden · Finland', node: '북유럽 풀가동' },
      '레이캬비크 + 포르투갈 복귀': { country: 'Iceland · Portugal', node: '오로라 + 워홀 B' },
      '포르투갈 + 발레타': { country: 'Portugal · Malta', node: '워홀 B + 지중해' },
      '호바트': { country: 'Australia · Tasmania', node: '남반구 첫 거점' },
      '애들레이드': { country: 'Australia · SA', node: '바로사 와인' },
      '멜버른': { country: 'Australia · VIC', node: '살아보기' },
      '뉴질랜드': { country: 'New Zealand', node: '자연 모드' },
      '샌디에이고 + 뉴욕(3박)': { country: 'USA · West + East', node: '미국 경험' },
      '핼리팩스': { country: 'Canada · NS', node: '니트·공예 마무리' },
    };
    return map[city] || { country: '', node: '' };
  }

  // 도시 → city guide ID 매핑 (행 클릭 시 이동)
  function voyageCityToPageId(city) {
    if (city.indexOf('포르투') >= 0 && city.indexOf('갈') < 0) return 'nomad-city-porto';
    if (city.indexOf('포르투갈') >= 0) return 'nomad-city-portugal2';
    if (city.indexOf('더블린') >= 0) return 'nomad-city-dublin';
    if (city.indexOf('코펜하겐') >= 0) return 'nomad-city-copenhagen';
    if (city.indexOf('스톡홀름') >= 0) return 'nomad-city-stockholm';
    if (city.indexOf('레이캬비크') >= 0) return 'nomad-city-reykjavik';
    if (city.indexOf('발레타') >= 0) return 'nomad-city-valletta';
    if (city.indexOf('호바트') >= 0) return 'nomad-city-hobart';
    if (city.indexOf('애들레이드') >= 0) return 'nomad-city-adelaide';
    if (city.indexOf('멜버른') >= 0) return 'nomad-city-melbourne';
    if (city.indexOf('뉴질랜드') >= 0) return 'nomad-city-nz';
    if (city.indexOf('샌디에이고') >= 0) return 'nomad-city-sandiego';
    if (city.indexOf('핼리팩스') >= 0) return 'nomad-city-halifax';
    return null;
  }

  function renderVoyage() {
    var voyage = DATA.VOYAGE;
    var totalBudget = voyage.reduce(function(a,b){ return a + b.cost; }, 0);
    var oneoff = DATA.BUDGET_ONEOFF;
    var grandTotal = totalBudget + oneoff.flights + oneoff.visa + oneoff.insurance + oneoff.misc;
    // 셰겐 일수 합산 (숫자만)
    var schengenDays = voyage.reduce(function(a, v) {
      var m = (v.schengen||'').match(/(\d+)/);
      return a + (m ? parseInt(m[1]) : 0);
    }, 0);
    var schengenPct = Math.min(100, (schengenDays/90)*100);
    var schengenColor = schengenDays > 90 ? '#b91c1c' : (schengenDays > 75 ? '#c2410c' : 'var(--nm-tertiary)');

    var html = '';

    // ════════ SECTION 1 · Header (좌측 타이틀 + 우측 2 metric 인라인) ════════
    html += '<div class="nm-page-header" style="display:flex;justify-content:space-between;align-items:flex-end;gap:24px;flex-wrap:wrap;padding-bottom:32px;border-bottom:1px solid var(--nm-surface-container);margin-bottom:32px">';
    html += '<div>' +
      '<div class="nm-page-eyebrow">Global Expedition Plan</div>' +
      '<div style="font-family:Manrope;font-size:36px;font-weight:800;color:var(--nm-deep-indigo);line-height:1.1;margin:8px 0 6px">June 2028 — May 2029</div>' +
      '<div class="nm-page-sub" style="margin:0">6개 대륙 · 17개 도시 · 1년 마스터 동선</div>' +
    '</div>';
    html += '<div style="display:flex;gap:12px;flex-shrink:0">';
    html += '<div style="background:var(--nm-primary-soft);padding:18px 22px;border-radius:12px;min-width:170px">' +
      '<p class="nm-label-sm" style="margin-bottom:6px;color:var(--nm-text-2)">Total Budget (Est.)</p>' +
      '<p style="font-family:Manrope;font-size:22px;font-weight:700;color:var(--nm-deep-indigo)">' + fmtMan(grandTotal) + '</p>' +
    '</div>';
    html += '<div style="background:var(--nm-surface-container-high);padding:18px 22px;border-radius:12px;min-width:170px">' +
      '<p class="nm-label-sm" style="margin-bottom:6px;color:var(--nm-text-2)">Schengen Days Used</p>' +
      '<p style="font-family:Manrope;font-size:22px;font-weight:700;color:' + schengenColor + '">' + schengenDays + ' / 90</p>' +
      '<div style="margin-top:6px;height:3px;background:rgba(255,255,255,0.5);border-radius:99px;overflow:hidden">' +
        '<div style="height:100%;width:' + schengenPct + '%;background:' + schengenColor + '"></div>' +
      '</div>' +
    '</div>';
    html += '</div>';
    html += '</div>';

    // ════════ SECTION 2 · 3-col 레이아웃 (flex-grow 테이블 + w-80 사이드 레일) ════════
    html += '<div class="nm-voyage-main-grid">';

    // ───── LEFT: Itinerary Table ─────
    html += '<div class="nm-card" style="padding:0;overflow:hidden">';
    html += '<table class="nm-table" style="width:100%;border-collapse:collapse">';
    html += '<thead>' +
      '<tr style="background:#F5F3FF">' +
        '<th style="padding:14px 20px;text-align:left;font-family:Manrope;font-size:10px;font-weight:700;color:var(--nm-text-3);letter-spacing:0.1em;text-transform:uppercase;width:90px">Month</th>' +
        '<th style="padding:14px 20px;text-align:left;font-family:Manrope;font-size:10px;font-weight:700;color:var(--nm-text-3);letter-spacing:0.1em;text-transform:uppercase">City & Node</th>' +
        '<th style="padding:14px 20px;text-align:left;font-family:Manrope;font-size:10px;font-weight:700;color:var(--nm-text-3);letter-spacing:0.1em;text-transform:uppercase">Detail</th>' +
        '<th style="padding:14px 20px;text-align:left;font-family:Manrope;font-size:10px;font-weight:700;color:var(--nm-text-3);letter-spacing:0.1em;text-transform:uppercase">Visa / Schengen</th>' +
        '<th style="padding:14px 20px;text-align:right;font-family:Manrope;font-size:10px;font-weight:700;color:var(--nm-text-3);letter-spacing:0.1em;text-transform:uppercase">Budget</th>' +
        '<th style="padding:14px 20px;text-align:left;font-family:Manrope;font-size:10px;font-weight:700;color:var(--nm-text-3);letter-spacing:0.1em;text-transform:uppercase">Work Mode</th>' +
      '</tr>' +
    '</thead>';
    html += '<tbody>';

    // 분기 분리선 헬퍼
    function quarterRow(label) {
      return '<tr><td colspan="6" style="padding:10px 20px;background:var(--nm-surface-container-low);font-family:Manrope;font-size:10px;font-weight:700;color:var(--nm-text-3);letter-spacing:0.12em;text-transform:uppercase;border-top:1px solid #f1f5f9;border-bottom:1px solid #f1f5f9">' + label + '</td></tr>';
    }

    // EUROPE LOOP 분기 라벨 시작
    html += quarterRow('Europe Loop · June — November 2028');

    voyage.forEach(function(v, i) {
      // 분기 전환 (12월 = DOWN UNDER 시작, 4월 = AMERICAS & RETURN 시작)
      if (v.month === '12월') html += quarterRow('Down Under · December 2028 — March 2029');
      if (v.month === '4월' && v.year === 2029) html += quarterRow('Americas & Return · April — May 2029');

      var node = voyageCityNode(v.city);
      var modeIcon = voyageModeIcon(v.mode);
      var pageId = voyageCityToPageId(v.city);
      var yearLabel = v.year === 2028 ? '\'28' : '\'29';
      var clickAttrs = pageId
        ? ' style="cursor:pointer;transition:background 0.15s" onmouseover="this.style.background=\'#fafafa\'" onmouseout="this.style.background=\'#fff\'" onclick="NOMAD_PAGES.go(\'' + pageId + '\')"'
        : '';

      // visa pill
      var visaPill = '<span style="display:inline-block;padding:4px 10px;border-radius:99px;font-size:11px;font-weight:600;' + visaPillClass(v.visa) + '">' + v.visa + '</span>';
      // schengen pill (있을 때만)
      var schengenPill = '';
      if (v.schengen !== 'X' && v.schengen !== '외' && v.schengen !== '셰겐 외') {
        schengenPill = ' <span style="display:inline-block;padding:4px 10px;border-radius:99px;font-size:11px;font-weight:600;background:#fff7ed;color:#c2410c;margin-left:4px">' + v.schengen + '</span>';
      } else if (v.schengen === '외' || v.schengen === '셰겐 외') {
        schengenPill = ' <span style="display:inline-block;padding:4px 10px;border-radius:99px;font-size:11px;font-weight:500;background:#f1f5f9;color:#475569;margin-left:4px">Non-Sch</span>';
      }

      html += '<tr' + clickAttrs + '>';
      // Month
      html += '<td style="padding:18px 20px;border-bottom:1px solid #f1f5f9;font-family:Manrope;font-weight:700;color:var(--nm-primary);font-size:13px">' + yearLabel + ' ' + v.month + '</td>';
      // City & Node
      html += '<td style="padding:18px 20px;border-bottom:1px solid #f1f5f9">' +
        '<div style="display:flex;align-items:center;gap:10px">' +
          '<span style="width:8px;height:8px;border-radius:50%;background:var(--nm-soft-accent);flex-shrink:0"></span>' +
          '<div>' +
            '<div style="font-family:Manrope;font-size:14px;font-weight:700;color:var(--nm-on-surface);line-height:1.3">' + v.city + '</div>' +
            (node.country ? '<div style="font-size:11px;color:var(--nm-text-3);margin-top:2px">' + node.country + (node.node ? ' · ' + node.node : '') + '</div>' : '') +
          '</div>' +
        '</div>' +
      '</td>';
      // Detail
      html += '<td style="padding:18px 20px;border-bottom:1px solid #f1f5f9;font-size:12px;color:var(--nm-text-2);max-width:240px;line-height:1.5">' + v.detail + '</td>';
      // Visa
      html += '<td style="padding:18px 20px;border-bottom:1px solid #f1f5f9;white-space:nowrap">' + visaPill + schengenPill + '</td>';
      // Budget
      html += '<td style="padding:18px 20px;border-bottom:1px solid #f1f5f9;text-align:right;font-family:Manrope;font-weight:700;color:var(--nm-on-surface);font-size:13px">₩' + v.cost + '만</td>';
      // Mode
      html += '<td style="padding:18px 20px;border-bottom:1px solid #f1f5f9">' +
        '<div style="display:flex;align-items:center;gap:6px">' +
          '<span class="material-symbols-outlined" style="font-size:16px;color:var(--nm-text-3)">' + modeIcon + '</span>' +
          '<span style="font-size:12px;color:var(--nm-text-2);font-weight:500">' + v.mode + '</span>' +
        '</div>' +
      '</td>';
      html += '</tr>';
    });

    html += '</tbody></table>';
    html += '</div>';

    // ───── RIGHT: 사이드 레일 (3 카드) ─────
    html += '<aside style="display:flex;flex-direction:column;gap:20px">';

    // ① 마일리지 활용 (lavender + border-l-4)
    html += '<div class="nm-card" style="padding:22px">';
    html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">' +
      '<h4 style="font-family:Manrope;font-size:16px;font-weight:700;color:var(--nm-deep-indigo)">Mileage Strategy</h4>' +
      '<span class="material-symbols-outlined" style="color:var(--nm-primary)">air</span>' +
    '</div>';
    html += '<div style="padding:14px 16px;background:#F5F3FF;border-radius:10px;border-left:4px solid var(--nm-primary);margin-bottom:16px">' +
      '<p class="nm-label-sm" style="margin-bottom:4px;color:var(--nm-text-3)">대한항공 마일리지</p>' +
      '<p style="font-family:Manrope;font-size:15px;font-weight:700;color:var(--nm-deep-indigo)">출국·귀국 보너스 좌석 활용</p>' +
    '</div>';
    html += '<ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:12px">';
    var mileageItems = [
      { icon:'flight_takeoff', text:'인천 → 리스본 (출국, 대한항공 마일리지)' },
      { icon:'flight_land',    text:'핼리팩스 → 인천 (귀국, 마일리지)' },
      { icon:'connecting_airports', text:'유럽 안 = 라이언에어 · 이지젯 €30-80' },
      { icon:'public',         text:'대륙 간 = 두바이 경유 (말타 → 호바트)' },
    ];
    mileageItems.forEach(function(m) {
      html += '<li style="display:flex;gap:10px;align-items:flex-start">' +
        '<div style="width:24px;height:24px;border-radius:6px;background:rgba(124,58,237,0.08);display:flex;align-items:center;justify-content:center;flex-shrink:0">' +
          '<span class="material-symbols-outlined" style="font-size:14px;color:var(--nm-primary)">' + m.icon + '</span>' +
        '</div>' +
        '<p style="font-size:12px;color:var(--nm-text-2);line-height:1.5;margin:0">' + m.text + '</p>' +
      '</li>';
    });
    html += '</ul>';
    html += '</div>';

    // ② 엄마 합류 후보 (deco circle + checklist)
    html += '<div class="nm-card" style="padding:22px;position:relative;overflow:hidden">';
    // deco circle
    html += '<div style="position:absolute;top:-40px;right:-40px;width:96px;height:96px;background:#ffe0cd;opacity:0.4;border-radius:50%"></div>';
    html += '<div style="position:relative;z-index:1">';
    html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">' +
      '<h4 style="font-family:Manrope;font-size:16px;font-weight:700;color:var(--nm-deep-indigo)">Family Integration</h4>' +
      '<span class="material-symbols-outlined" style="color:#7d3d00">family_restroom</span>' +
    '</div>';
    // 아바타 + 이름
    html += '<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">' +
      '<div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#ffdcc6,#ffb784);display:flex;align-items:center;justify-content:center;font-size:22px;box-shadow:0 0 0 2px rgba(125,61,0,0.15)">👩</div>' +
      '<div>' +
        '<p style="font-family:Manrope;font-size:14px;font-weight:700;color:var(--nm-on-surface);margin:0">엄마 합류 후보</p>' +
        '<p style="font-size:11px;color:var(--nm-text-3);margin:2px 0 0">1969년생 · 정년 2029(현행) / 2033(65세)</p>' +
      '</div>' +
    '</div>';
    // 체크박스 후보 시기 (localStorage 저장 X · UI만 — 추후 확장 가능)
    html += '<div style="padding:14px;background:var(--nm-surface-container-low);border-radius:10px">' +
      '<p style="font-size:11px;font-weight:700;color:var(--nm-text-2);margin-bottom:10px;text-transform:uppercase;letter-spacing:0.05em">합류 후보 시기</p>' +
      '<div style="display:flex;flex-direction:column;gap:10px">';
    var familyCandidates = [
      { when:'2028.9', label:'스칸디나비아', note:'북유럽 · 안전 · 깨끗' },
      { when:'2028.12', label:'호바트',     note:'호주 · 여름' },
      { when:'2029.3',  label:'뉴질랜드',    note:'자연' },
    ];
    familyCandidates.forEach(function(c) {
      html += '<label style="display:flex;align-items:flex-start;gap:10px;cursor:pointer">' +
        '<input type="checkbox" style="margin-top:3px;width:14px;height:14px;accent-color:var(--nm-primary);flex-shrink:0">' +
        '<div>' +
          '<span style="font-family:Manrope;font-size:12px;font-weight:700;color:var(--nm-deep-indigo)">' + c.when + ' · ' + c.label + '</span>' +
          '<p style="font-size:11px;color:var(--nm-text-3);margin:2px 0 0">' + c.note + '</p>' +
        '</div>' +
      '</label>';
    });
    html += '</div></div>';
    html += '</div>';
    html += '</div>';

    // ③ Voyage Trajectory View (그라데이션 + 캡션)
    html += '<div class="nm-card" style="padding:0;overflow:hidden">';
    html += '<div style="height:170px;position:relative;background:linear-gradient(135deg,#312E81 0%,#7C3AED 45%,#a78bfa 80%,#fbbf24 100%)">' +
      // 가짜 trajectory lines (정적 점들로 표현)
      '<svg viewBox="0 0 320 170" preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%;opacity:0.5">' +
        '<path d="M 40 130 Q 80 60 130 80 T 220 70 T 290 100" stroke="rgba(255,255,255,0.4)" stroke-width="1.5" fill="none" stroke-dasharray="3,3"/>' +
        '<circle cx="40" cy="130" r="4" fill="rgba(255,255,255,0.85)"/>' +
        '<circle cx="130" cy="80" r="4" fill="rgba(255,255,255,0.85)"/>' +
        '<circle cx="220" cy="70" r="4" fill="rgba(255,255,255,0.85)"/>' +
        '<circle cx="290" cy="100" r="4" fill="rgba(255,255,255,0.85)"/>' +
      '</svg>' +
      '<div style="position:absolute;bottom:14px;left:18px">' +
        '<span style="background:rgba(255,255,255,0.95);backdrop-filter:blur(8px);color:var(--nm-deep-indigo);padding:6px 14px;border-radius:99px;font-size:11px;font-weight:700;box-shadow:0 1px 3px rgba(0,0,0,0.15)">Voyage Trajectory View</span>' +
      '</div>' +
    '</div>';
    html += '<div style="padding:18px 20px">' +
      '<div style="display:flex;justify-content:space-between;gap:12px">' +
        '<div><p style="font-family:Manrope;font-size:18px;font-weight:700;color:var(--nm-deep-indigo)">17</p><p style="font-size:10px;color:var(--nm-text-3);text-transform:uppercase;letter-spacing:0.06em">cities</p></div>' +
        '<div><p style="font-family:Manrope;font-size:18px;font-weight:700;color:var(--nm-deep-indigo)">6</p><p style="font-size:10px;color:var(--nm-text-3);text-transform:uppercase;letter-spacing:0.06em">continents</p></div>' +
        '<div><p style="font-family:Manrope;font-size:18px;font-weight:700;color:var(--nm-deep-indigo)">365</p><p style="font-size:10px;color:var(--nm-text-3);text-transform:uppercase;letter-spacing:0.06em">days</p></div>' +
      '</div>' +
    '</div>';
    html += '</div>';

    html += '</aside>';
    html += '</div>'; // /3-col grid

    return html;
  }
  registerPage('nomad-voyage', renderVoyage);

  // ──────── Budget 페이지 (Stitch Magazine 디자인) ────────
  // 도시별 이모지/서브라벨 매핑
  function budgetCityMeta(city) {
    if (city.indexOf('포르투') === 0) return { flag:'🇵🇹', sub:'Workation Hub A' };
    if (city.indexOf('더블린') >= 0) return { flag:'🇮🇪', sub:'Ireland · Atlantic Loop' };
    if (city.indexOf('코펜하겐') >= 0) return { flag:'🇩🇰', sub:'Scandi Design Line' };
    if (city.indexOf('스톡홀름') >= 0) return { flag:'🇸🇪', sub:'Scandi Design Line' };
    if (city.indexOf('헬싱키') >= 0 && city.indexOf('레이캬비크') >= 0) return { flag:'🇮🇸', sub:'Aurora + 워홀 B' };
    if (city.indexOf('발레타') >= 0) return { flag:'🇲🇹', sub:'Mediterranean · 워홀 B' };
    if (city.indexOf('호바트') >= 0) return { flag:'🇦🇺', sub:'Australia · Tasmania' };
    if (city.indexOf('애들레이드') >= 0) return { flag:'🇦🇺', sub:'Australia · SA' };
    if (city.indexOf('멜버른') >= 0) return { flag:'🇦🇺', sub:'Australia · VIC' };
    if (city.indexOf('뉴질랜드') >= 0) return { flag:'🇳🇿', sub:'Nature Capital' };
    if (city.indexOf('샌디에이고') >= 0) return { flag:'🇺🇸', sub:'USA · West + NYC' };
    if (city.indexOf('핼리팩스') >= 0) return { flag:'🇨🇦', sub:'Canada · 마무리' };
    return { flag:'🌍', sub:'' };
  }

  function renderBudget() {
    var budget = DATA.BUDGET;
    var oneoff = DATA.BUDGET_ONEOFF;
    var stayTotal = budget.reduce(function(a,b){ return a + b.stay; }, 0);
    var lifeTotal = budget.reduce(function(a,b){ return a + b.life; }, 0);
    var monthlyTotal = budget.reduce(function(a,b){ return a + b.total; }, 0);
    var oneoffTotal = oneoff.flights + oneoff.visa + oneoff.insurance + oneoff.misc;
    var grandTotal = monthlyTotal + oneoffTotal;
    var consumable = grandTotal - oneoff.misc;
    var avgMonth = Math.round(monthlyTotal / 12);
    var avgStay = Math.round(stayTotal / 12);
    var avgLife = Math.round(lifeTotal / 12);

    // 최고/최저 월 (Cash Flow 메모용)
    var maxMonth = budget.reduce(function(a,b){ return b.total > a.total ? b : a; }, budget[0]);
    var minMonth = budget.reduce(function(a,b){ return b.total < a.total ? b : a; }, budget[0]);
    var maxTotal = maxMonth.total;

    var html = '';

    // Page Header
    html += pageHeader('Budget', '1년 예산 · 월별 상세',
      '단위 만 원 · 1만 원 단위 반올림 · 총 ' + fmtMan(grandTotal));

    // ════════ SECTION 1 · Summary 8/4 split ════════
    html += '<div class="nm-grid nm-grid-2-1" style="margin-bottom:32px">';

    // ───── LEFT (8): Total Budget Summary ─────
    html += '<div class="nm-card nm-card-lg" style="display:flex;flex-direction:column;justify-content:space-between">';
    // 헤더
    html += '<div>';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">' +
      '<h2 style="font-family:Manrope;font-size:18px;font-weight:700;color:var(--nm-deep-indigo);display:flex;align-items:center;gap:8px">' +
        '<span class="material-symbols-outlined" style="color:var(--nm-primary)">account_balance_wallet</span>' +
        'Total Budget Summary' +
      '</h2>' +
      '<span style="background:#F5F3FF;color:var(--nm-primary);padding:5px 12px;border-radius:99px;font-size:11px;font-weight:700">2028 — 2029</span>' +
    '</div>';
    // 4 metric inline grid
    html += '<div class="nm-grid nm-grid-4" style="gap:20px">';
    var summaryItems = [
      { label:'12개월 살림',    value:monthlyTotal,    note:'숙소 + 생활비' },
      { label:'항공·비자·보험', value:oneoff.flights + oneoff.visa + oneoff.insurance, note:'비행 ' + oneoff.flights + ' + 비자 ' + oneoff.visa + ' + 보험 ' + oneoff.insurance },
      { label:'짐 준비',        value:0,               note:'출국 전 · 짐·기기 (예비비 포함)', placeholder:true },
      { label:'비상금 (회수성)', value:oneoff.misc,     note:'쓰면 회수, 안 쓰면 저축' },
    ];
    // 짐 준비는 misc 안에 통합되어 있어서 별도 항목 없음 → 그냥 비상금만 표시. 항목 4개로 맞추려면 재구성
    // dashboard 원문 그대로: 비행 550 / 비자보험 130 / 짐 200 / 비상 300 → 표시는 이렇게
    summaryItems = [
      { label:'12개월 살림',  value:monthlyTotal,     note:'평균 월 ' + avgMonth + '만' },
      { label:'항공권',       value:oneoff.flights,   note:'인천↔리스본·핼리팩스·대륙 간' },
      { label:'보험·비자',    value:oneoff.insurance + oneoff.visa, note:'장기 여행자보험 + 비자' },
      { label:'비상금 (회수)', value:oneoff.misc,      note:'짐·기기·예비 (소비성 X)' },
    ];
    summaryItems.forEach(function(s) {
      html += '<div>' +
        '<p style="font-size:11px;color:var(--nm-text-3);font-weight:600;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.04em">' + s.label + '</p>' +
        '<p style="font-family:Manrope;font-size:22px;font-weight:700;color:var(--nm-deep-indigo)">₩' + s.value.toLocaleString() + '만</p>' +
        '<p style="font-size:10px;color:var(--nm-text-3);margin-top:4px;line-height:1.4">' + s.note + '</p>' +
      '</div>';
    });
    html += '</div>';
    html += '</div>';
    // 하단 separator + Aggregate Total
    html += '<div style="margin-top:32px;padding-top:24px;border-top:1px solid var(--nm-surface-container);display:flex;justify-content:space-between;align-items:flex-end;flex-wrap:wrap;gap:16px">';
    html += '<div>' +
      '<p style="font-size:10px;color:var(--nm-text-3);text-transform:uppercase;letter-spacing:0.12em;font-weight:700;margin-bottom:6px">Aggregate Total Requirement</p>' +
      '<p style="font-family:Manrope;font-size:38px;font-weight:800;color:var(--nm-primary);line-height:1">' + fmtMan(grandTotal) + '</p>' +
    '</div>';
    html += '<div style="text-align:right">' +
      '<p style="font-size:12px;color:var(--nm-text-2);display:flex;align-items:center;justify-content:flex-end;gap:4px;font-weight:600">' +
        '<span class="material-symbols-outlined" style="font-size:14px;color:var(--nm-tertiary)">shield</span>' +
        '소비성 (회수 X)' +
      '</p>' +
      '<p style="font-size:12px;color:var(--nm-text-3);margin-top:4px">' + fmtMan(consumable) + ' = 총 − 비상금</p>' +
    '</div>';
    html += '</div>';
    html += '</div>';

    // ───── RIGHT (4): Revenue Simulation 3 시나리오 ─────
    html += '<div class="nm-card nm-card-lg" style="display:flex;flex-direction:column;gap:14px">';
    html += '<h2 style="font-family:Manrope;font-size:18px;font-weight:700;color:var(--nm-deep-indigo);margin-bottom:4px">Revenue Simulation</h2>';
    html += '<p style="font-size:11px;color:var(--nm-text-3);margin-bottom:6px">월 본업 외 수익 시나리오 → 1년 환산</p>';

    var scenarios = [
      { key:'floor',  label:'Floor · 게이트',  monthly:450, yearly:5400, bg:'var(--nm-surface-container-low)', border:'#7b7487', textColor:'var(--nm-on-surface)', barColor:'#7b7487', barPct:60 },
      { key:'target', label:'Target · 중간',   monthly:600, yearly:7200, bg:'#eaddff',                          border:'var(--nm-primary)', textColor:'var(--nm-primary)', barColor:'var(--nm-primary)', barPct:80 },
      { key:'greed',  label:'Greed · 욕심',    monthly:800, yearly:9600, bg:'#ffdcc6',                          border:'#7d3d00',           textColor:'#7d3d00',           barColor:'#7d3d00',           barPct:100 },
    ];
    scenarios.forEach(function(s) {
      html += '<div style="padding:14px 16px;border-radius:10px;background:' + s.bg + ';border-left:4px solid ' + s.border + ';transition:transform 0.15s" onmouseover="this.style.transform=\'translateY(-2px)\'" onmouseout="this.style.transform=\'translateY(0)\'">';
      html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">' +
        '<span style="font-family:Manrope;font-size:13px;font-weight:700;color:' + s.textColor + '">' + s.label + '</span>' +
        '<span style="font-size:11px;color:var(--nm-text-2);font-weight:600">월 ₩' + s.monthly + '만</span>' +
      '</div>';
      html += '<div style="display:flex;justify-content:space-between;align-items:baseline">' +
        '<span style="font-size:10px;color:var(--nm-text-3);text-transform:uppercase;letter-spacing:0.06em">1년 자산</span>' +
        '<span style="font-family:Manrope;font-size:17px;font-weight:700;color:' + s.textColor + '">₩' + s.yearly.toLocaleString() + '만</span>' +
      '</div>';
      html += '<div style="margin-top:6px;height:3px;background:rgba(255,255,255,0.6);border-radius:99px;overflow:hidden">' +
        '<div style="height:100%;width:' + s.barPct + '%;background:' + s.barColor + '"></div>' +
      '</div>';
      html += '</div>';
    });
    html += '</div>';

    html += '</div>'; // /Summary 8/4

    // ════════ SECTION 2 · 12-City Cost Breakdown 테이블 ════════
    html += '<section class="nm-card" style="padding:0;overflow:hidden;margin-bottom:32px">';
    // 테이블 헤더
    html += '<div style="padding:20px 24px;border-bottom:1px solid var(--nm-surface-container);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">' +
      '<h2 style="font-family:Manrope;font-size:18px;font-weight:700;color:var(--nm-deep-indigo)">12-City Cost Breakdown</h2>' +
      '<div style="display:flex;align-items:center;gap:8px;font-size:11px;color:var(--nm-text-3);font-weight:600">' +
        '<span style="width:10px;height:10px;background:var(--nm-primary);border-radius:50%;display:inline-block"></span>' +
        'High Accuracy · 단위 만 원' +
      '</div>' +
    '</div>';
    // 테이블
    html += '<div style="overflow-x:auto">';
    html += '<table style="width:100%;border-collapse:collapse">';
    html += '<thead>' +
      '<tr style="background:#F5F3FF">' +
        '<th style="padding:14px 20px;text-align:left;font-family:Manrope;font-size:10px;font-weight:700;color:var(--nm-text-3);letter-spacing:0.1em;text-transform:uppercase">Month / City</th>' +
        '<th style="padding:14px 20px;text-align:right;font-family:Manrope;font-size:10px;font-weight:700;color:var(--nm-text-3);letter-spacing:0.1em;text-transform:uppercase">Stay (숙소)</th>' +
        '<th style="padding:14px 20px;text-align:right;font-family:Manrope;font-size:10px;font-weight:700;color:var(--nm-text-3);letter-spacing:0.1em;text-transform:uppercase">Living (생활비)</th>' +
        '<th style="padding:14px 20px;text-align:right;font-family:Manrope;font-size:10px;font-weight:700;color:var(--nm-text-3);letter-spacing:0.1em;text-transform:uppercase">Monthly Subtotal</th>' +
      '</tr>' +
    '</thead>';
    html += '<tbody>';
    budget.forEach(function(b) {
      var meta = budgetCityMeta(b.city);
      html += '<tr style="transition:background 0.15s" onmouseover="this.style.background=\'#fafafa\'" onmouseout="this.style.background=\'#fff\'">' +
        // Month / City
        '<td style="padding:16px 20px;border-bottom:1px solid #f1f5f9">' +
          '<div style="display:flex;align-items:center;gap:14px">' +
            '<div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#F5F3FF,#dee9fc);display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">' + meta.flag + '</div>' +
            '<div>' +
              '<p style="font-family:Manrope;font-size:13px;font-weight:700;color:var(--nm-on-surface);line-height:1.3">' + b.period + ' · ' + b.city + '</p>' +
              (meta.sub ? '<p style="font-size:11px;color:var(--nm-text-3);margin-top:2px">' + meta.sub + '</p>' : '') +
            '</div>' +
          '</div>' +
        '</td>' +
        // Stay
        '<td style="padding:16px 20px;border-bottom:1px solid #f1f5f9;text-align:right;font-family:Manrope;font-size:13px;color:var(--nm-text-2)">₩' + b.stay + '만</td>' +
        // Living
        '<td style="padding:16px 20px;border-bottom:1px solid #f1f5f9;text-align:right;font-family:Manrope;font-size:13px;color:var(--nm-text-2)">₩' + b.life + '만</td>' +
        // Subtotal (primary 색 강조)
        '<td style="padding:16px 20px;border-bottom:1px solid #f1f5f9;text-align:right;font-family:Manrope;font-size:16px;font-weight:700;color:var(--nm-deep-indigo)">₩' + b.total + '만</td>' +
      '</tr>';
    });
    // Summary Projection 행 (평균 + 합계)
    html += '<tr style="background:var(--nm-surface-container-low);border-top:2px solid var(--nm-primary)">' +
      '<td style="padding:18px 20px">' +
        '<p style="font-family:Manrope;font-size:13px;font-weight:700;color:var(--nm-primary)">Summary Projection</p>' +
        '<p style="font-size:11px;color:var(--nm-text-3);margin-top:2px">12개월 평균 / 합계</p>' +
      '</td>' +
      '<td style="padding:18px 20px;text-align:right;font-family:Manrope;font-size:13px;font-weight:700;color:var(--nm-on-surface)">avg ₩' + avgStay + '만 <span style="font-size:11px;color:var(--nm-text-3);font-weight:500">/ 합 ₩' + stayTotal + '만</span></td>' +
      '<td style="padding:18px 20px;text-align:right;font-family:Manrope;font-size:13px;font-weight:700;color:var(--nm-on-surface)">avg ₩' + avgLife + '만 <span style="font-size:11px;color:var(--nm-text-3);font-weight:500">/ 합 ₩' + lifeTotal + '만</span></td>' +
      '<td style="padding:18px 20px;text-align:right;font-family:Manrope;font-size:17px;font-weight:800;color:var(--nm-primary)">avg ₩' + avgMonth + '만 <span style="font-size:11px;color:var(--nm-text-3);font-weight:500">/ 합 ₩' + monthlyTotal + '만</span></td>' +
    '</tr>';
    html += '</tbody></table>';
    html += '</div>';
    html += '</section>';

    // ════════ SECTION 3 · 2-col bottom (Cash Flow + 엄마 합류) ════════
    html += '<div class="nm-grid nm-grid-2" style="gap:24px">';

    // ───── LEFT: Cash Flow Projection ─────
    html += '<div class="nm-card nm-card-lg" style="display:flex;flex-direction:column;justify-content:space-between">';
    html += '<div>' +
      '<h3 style="font-family:Manrope;font-size:18px;font-weight:700;color:var(--nm-deep-indigo);margin-bottom:6px">Cash Flow Projection</h3>' +
      '<p style="font-size:13px;color:var(--nm-text-2);line-height:1.5;margin-bottom:24px">12개월 월별 지출 시각화. 막대 길이 = 해당 월 합계 비율.</p>' +
    '</div>';
    // 12 바 차트
    html += '<div style="height:170px;background:var(--nm-surface-container-low);border-radius:10px;padding:16px 14px;display:flex;align-items:flex-end;gap:8px">';
    budget.forEach(function(b) {
      var hPct = Math.round((b.total / maxTotal) * 100);
      // 색상: 최대 = primary 진하게, 평균 이상 = primary 중간, 평균 이하 = primary 옅게
      var opacity = b.total === maxTotal ? '1' : (b.total > avgMonth ? '0.7' : '0.4');
      html += '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;height:100%">' +
        '<div style="flex:1;width:100%;display:flex;align-items:flex-end">' +
          '<div title="' + b.period + ' ₩' + b.total + '만" style="width:100%;height:' + hPct + '%;background:var(--nm-primary);opacity:' + opacity + ';border-radius:4px 4px 0 0;transition:opacity 0.15s;cursor:pointer" onmouseover="this.style.opacity=\'1\'" onmouseout="this.style.opacity=\'' + opacity + '\'"></div>' +
        '</div>' +
        '<span style="font-size:9px;color:var(--nm-text-3);font-weight:600">' + b.period.split('.')[1] + '월</span>' +
      '</div>';
    });
    html += '</div>';
    // 메모
    html += '<div style="margin-top:16px;display:flex;justify-content:space-between;gap:12px;font-size:11px">' +
      '<div>' +
        '<p style="color:var(--nm-text-3);text-transform:uppercase;letter-spacing:0.06em;font-weight:600">최고 월</p>' +
        '<p style="color:var(--nm-deep-indigo);font-family:Manrope;font-weight:700;margin-top:2px">' + maxMonth.period + ' · ₩' + maxMonth.total + '만</p>' +
        '<p style="color:var(--nm-text-3);font-size:10px">' + maxMonth.city + '</p>' +
      '</div>' +
      '<div style="text-align:right">' +
        '<p style="color:var(--nm-text-3);text-transform:uppercase;letter-spacing:0.06em;font-weight:600">최저 월</p>' +
        '<p style="color:var(--nm-deep-indigo);font-family:Manrope;font-weight:700;margin-top:2px">' + minMonth.period + ' · ₩' + minMonth.total + '만</p>' +
        '<p style="color:var(--nm-text-3);font-size:10px">' + minMonth.city + '</p>' +
      '</div>' +
    '</div>';
    html += '</div>';

    // ───── RIGHT: 엄마 합류 예산 (deep-indigo bg) ─────
    html += '<div class="nm-card nm-card-lg" style="background:var(--nm-deep-indigo);color:#fff;position:relative;overflow:hidden">';
    // deco circle (blur)
    html += '<div style="position:absolute;bottom:-40px;right:-40px;width:160px;height:160px;background:var(--nm-primary);opacity:0.25;border-radius:50%;filter:blur(40px)"></div>';
    html += '<div style="position:relative;z-index:1">';
    html += '<h3 style="font-family:Manrope;font-size:18px;font-weight:700;color:#fff;margin-bottom:6px;display:flex;align-items:center;gap:8px">' +
      '<span class="material-symbols-outlined" style="color:#eaddff">family_restroom</span>' +
      '엄마 합류 예산 (별도)' +
    '</h3>';
    html += '<p style="font-size:13px;color:rgba(255,255,255,0.7);margin-bottom:20px">1년 노마드 중 엄마 합류 시 추가 예산 구조 — 누리 본 예산과 분리.</p>';
    html += '<div style="display:flex;flex-direction:column;gap:14px;margin-bottom:24px">';
    var momItems = [
      { icon:'flight',     title:'왕복 항공권',           note:'₩200-300만 · 엄마 본인 결제' },
      { icon:'bed',        title:'누리 숙소 2인 사용 OK', note:'추가비 X (Flatio·Airbnb 2인 동일가)' },
      { icon:'restaurant', title:'엄마 식비·관광',         note:'별도 정산 (현지 1일 ₩5-10만 예상)' },
    ];
    momItems.forEach(function(m) {
      html += '<div style="display:flex;gap:14px;align-items:flex-start">' +
        '<div style="width:32px;height:32px;border-radius:8px;background:rgba(255,255,255,0.12);display:flex;align-items:center;justify-content:center;flex-shrink:0">' +
          '<span class="material-symbols-outlined" style="font-size:18px;color:#eaddff">' + m.icon + '</span>' +
        '</div>' +
        '<div>' +
          '<p style="font-family:Manrope;font-size:14px;font-weight:600;color:#fff">' + m.title + '</p>' +
          '<p style="font-size:12px;color:rgba(255,255,255,0.65);margin-top:2px;line-height:1.5">' + m.note + '</p>' +
        '</div>' +
      '</div>';
    });
    html += '</div>';
    // 버튼
    html += '<button onclick="NOMAD_PAGES.go(\'nomad-voyage\')" style="width:100%;padding:12px;background:#fff;color:var(--nm-deep-indigo);border:none;border-radius:10px;font-family:Manrope;font-size:13px;font-weight:700;cursor:pointer;transition:background 0.15s" onmouseover="this.style.background=\'#eaddff\'" onmouseout="this.style.background=\'#fff\'">' +
      '엄마 합류 시기 후보 보기 →' +
    '</button>';
    html += '</div>';
    html += '</div>';

    html += '</div>'; // /2-col bottom

    return html;
  }
  registerPage('nomad-budget', renderBudget);

  // ──────── 공통 헬퍼 ────────
  function trackCard(rows, headers) {
    var html = '<table class="nm-table"><thead><tr>';
    headers.forEach(function(h) { html += '<th' + (h.right ? ' class="nm-num"' : '') + '>' + h.label + '</th>'; });
    html += '</tr></thead><tbody>';
    rows.forEach(function(r) {
      html += '<tr>';
      r.forEach(function(cell, i) {
        var isNum = headers[i] && headers[i].right;
        html += '<td' + (isNum ? ' class="nm-num"' : '') + '>' + cell + '</td>';
      });
      html += '</tr>';
    });
    html += '</tbody></table>';
    return html;
  }

  // ──────── IP · Webnovel Track 페이지 ────────
  function renderIPTrack() {
    var html = '';

    // 게이트 진행률 계산 (현재 ₩200-250 중간값 225 / 게이트 ₩450 = 50%)
    var currentRevenue = 225;
    var gateRevenue = 450;
    var greedRevenue = 750; // 700-800 중간
    var gatePct = Math.round((currentRevenue / gateRevenue) * 100);
    var greedPct = Math.round((currentRevenue / greedRevenue) * 100);

    // Phase 데이터
    var phases = [
      { num:1, name:'Foundation', when:'2026.5-6',   goal:'필명·도메인·메일리·사이트 1차' },
      { num:2, name:'Build',      when:'2026.7-8',   goal:'콘텐츠 5편 + 도구 MVP' },
      { num:3, name:'Protect',    when:'2026.9',     goal:'정서 자원 보호' },
      { num:4, name:'Launch',     when:'2026.10',    goal:'뉴스레터 정식 시작' },
      { num:5, name:'Settle',     when:'2026.11-12', goal:'구독자 100-300명' },
      { num:6, name:'Expand',     when:'2027.1-3',   goal:'사연 받기 + 첫 디지털 제품' },
      { num:7, name:'Monetize',   when:'2027.4-6',   goal:'유료 멤버십 + 1:1 분석' },
    ];
    // 현재 위치 (오늘 기준 active phase 번호 — 2026.5 = Phase 1)
    var today = todayYMD();
    var activePhase = 1;
    if (today >= '2026-07-01' && today < '2026-09-01') activePhase = 2;
    else if (today >= '2026-09-01' && today < '2026-10-01') activePhase = 3;
    else if (today >= '2026-10-01' && today < '2026-11-01') activePhase = 4;
    else if (today >= '2026-11-01' && today < '2027-01-01') activePhase = 5;
    else if (today >= '2027-01-01' && today < '2027-04-01') activePhase = 6;
    else if (today >= '2027-04-01') activePhase = 7;

    // Page Header
    html += pageHeader('IP · Webnovel Track', '수익 트랙 · 자산 트랙',
      '메인 게이트 카운트 + 서브 장기 자산');

    // ════════ SECTION 1 · Hero Stats Row (3 카드) ════════
    html += '<div class="nm-grid nm-grid-3" style="gap:20px;margin-bottom:32px">';

    // ① Active Track
    html += '<div class="nm-card" style="padding:28px">' +
      '<p style="font-size:10px;color:var(--nm-text-3);text-transform:uppercase;letter-spacing:0.12em;font-weight:700;margin-bottom:8px">Active Track</p>' +
      '<h3 style="font-family:Manrope;font-size:24px;font-weight:700;color:var(--nm-primary);line-height:1.2;margin-bottom:16px">포스타입 웹소</h3>' +
      '<div style="display:flex;align-items:center;gap:8px">' +
        '<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:#22c55e;box-shadow:0 0 0 4px rgba(34,197,94,0.18);animation:nm-pulse 1.5s infinite"></span>' +
        '<span style="font-family:Manrope;font-size:13px;color:var(--nm-on-surface);font-weight:600">B시리즈 · 현재 ₩200-250만/월</span>' +
      '</div>' +
    '</div>';

    // ② Gate Achievement (primary-container bg)
    html += '<div class="nm-card" style="padding:28px;background:var(--nm-primary);color:#fff;position:relative;overflow:hidden">' +
      '<div style="position:absolute;top:-30px;right:-30px;width:120px;height:120px;background:rgba(255,255,255,0.1);border-radius:50%;filter:blur(20px)"></div>' +
      '<div style="position:relative;z-index:1">' +
        '<p style="font-size:10px;color:rgba(255,255,255,0.85);text-transform:uppercase;letter-spacing:0.12em;font-weight:700;margin-bottom:8px">Gate Achievement</p>' +
        '<h3 style="font-family:Manrope;font-size:18px;font-weight:700;margin-bottom:16px">출국 게이트 ₩450만/월</h3>' +
        '<div style="display:flex;align-items:flex-end;gap:6px">' +
          '<span style="font-family:Manrope;font-size:44px;font-weight:800;line-height:1">' + gatePct + '%</span>' +
          '<span style="font-size:11px;margin-bottom:8px;color:rgba(255,255,255,0.85)">Target<br>Achievement</span>' +
        '</div>' +
      '</div>' +
    '</div>';

    // ③ Core Principle (border-l-4 deep-indigo)
    html += '<div class="nm-card" style="padding:28px;border-left:4px solid var(--nm-deep-indigo)">' +
      '<p style="font-size:10px;color:var(--nm-text-3);text-transform:uppercase;letter-spacing:0.12em;font-weight:700;margin-bottom:8px">Core Principle</p>' +
      '<h3 style="font-family:Manrope;font-size:24px;font-weight:700;color:var(--nm-deep-indigo);line-height:1.2;margin-bottom:12px">70/30 Ratio</h3>' +
      '<p style="font-size:13px;color:var(--nm-text-2);line-height:1.5">Deep Work vs Travel · 글쓰기와 노마드 균형</p>' +
    '</div>';

    html += '</div>';

    // ════════ SECTION 2 · 8/4 split — Revenue Goals + 노마드 동안 운영 ════════
    html += '<div class="nm-grid nm-grid-2-1" style="margin-bottom:32px">';

    // ───── LEFT (8): Postype Webnovel Revenue Goals ─────
    html += '<div class="nm-card nm-card-lg">';
    html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px">' +
      '<div>' +
        '<h4 style="font-family:Manrope;font-size:18px;font-weight:700;color:var(--nm-on-surface);margin-bottom:4px">Postype Webnovel Revenue Goals</h4>' +
        '<p style="font-size:13px;color:var(--nm-text-2)">B시리즈 중심 · 게이트 카운트 핵심 트랙</p>' +
      '</div>' +
      '<span style="background:#F5F3FF;color:var(--nm-primary);padding:6px 14px;border-radius:99px;font-size:11px;font-weight:700">High Priority</span>' +
    '</div>';

    // Tier 1 progress: 게이트 트랙
    html += '<div style="margin-bottom:24px">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">' +
      '<span style="font-family:Manrope;font-size:11px;font-weight:700;color:var(--nm-primary);text-transform:uppercase;letter-spacing:0.1em">Tier 1 · 게이트 트랙 (출국 조건)</span>' +
      '<span style="font-family:Manrope;font-size:13px;font-weight:700;color:var(--nm-on-surface)">₩' + currentRevenue + '만 / ₩' + gateRevenue + '만</span>' +
    '</div>';
    html += '<div style="height:10px;background:var(--nm-surface-container);border-radius:99px;overflow:hidden">' +
      '<div style="height:100%;width:' + gatePct + '%;background:var(--nm-primary);border-radius:99px;transition:width 0.3s"></div>' +
    '</div>';
    html += '<p style="font-size:11px;color:var(--nm-text-3);margin-top:6px">현재 ₩200-250만 → 2027.12 게이트 ₩450만 (출국 조건)</p>';
    html += '</div>';

    // Tier 2 progress: 욕심 트랙
    html += '<div style="margin-bottom:32px">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">' +
      '<span style="font-family:Manrope;font-size:11px;font-weight:700;color:var(--nm-text-3);text-transform:uppercase;letter-spacing:0.1em">Tier 2 · 욕심 트랙 (저축 가능)</span>' +
      '<span style="font-family:Manrope;font-size:13px;font-weight:700;color:var(--nm-on-surface)">₩' + currentRevenue + '만 / ₩700-800만</span>' +
    '</div>';
    html += '<div style="height:10px;background:var(--nm-surface-container);border-radius:99px;overflow:hidden">' +
      '<div style="height:100%;width:' + greedPct + '%;background:var(--nm-secondary);border-radius:99px;transition:width 0.3s"></div>' +
    '</div>';
    html += '<p style="font-size:11px;color:var(--nm-text-3);margin-top:6px">달성 시 노마드 + 저축 동시 가능</p>';
    html += '</div>';

    // 하단 2 metric (확장 전략)
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;padding-top:24px;border-top:1px solid var(--nm-surface-container)">';
    html += '<div style="padding:18px;border-radius:10px;background:var(--nm-surface-container-low)">' +
      '<span class="material-symbols-outlined" style="color:var(--nm-primary);font-size:24px;margin-bottom:8px">trending_up</span>' +
      '<h5 style="font-family:Manrope;font-size:14px;font-weight:700;color:var(--nm-on-surface);margin-bottom:4px">발행 페이스</h5>' +
      '<p style="font-size:12px;color:var(--nm-text-2);line-height:1.5">B시리즈 <strong>월 8편+</strong> 페이스 · 주 2-3편 발행</p>' +
    '</div>';
    html += '<div style="padding:18px;border-radius:10px;background:var(--nm-surface-container-low)">' +
      '<span class="material-symbols-outlined" style="color:#7d3d00;font-size:24px;margin-bottom:8px">rocket_launch</span>' +
      '<h5 style="font-family:Manrope;font-size:14px;font-weight:700;color:var(--nm-on-surface);margin-bottom:4px">확장 전략</h5>' +
      '<p style="font-size:12px;color:var(--nm-text-2);line-height:1.5"><strong>2번째 작품</strong> (2026 후반/2027) · 메이저 웹소 플랫폼 진입 검토</p>' +
    '</div>';
    html += '</div>';

    html += '</div>'; // /Revenue Goals

    // ───── RIGHT (4): 노마드 동안 운영 (3 모드 압축) ─────
    html += '<div class="nm-card nm-card-lg" style="display:flex;flex-direction:column;gap:14px">';
    html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">' +
      '<span class="material-symbols-outlined" style="color:var(--nm-primary)">schedule</span>' +
      '<h4 style="font-family:Manrope;font-size:16px;font-weight:700;color:var(--nm-deep-indigo)">노마드 동안 운영</h4>' +
    '</div>';

    var operationModes = [
      { title:'메인 (웹소)', bg:'#F5F3FF', accent:'var(--nm-primary)', icon:'menu_book',
        items:['평일 오전 4시간 글 (블록 사수)', '주 2-3편 발행 페이스', '출국 전 3개월치 콘텐츠 비축'] },
      { title:'서브 (IP)', bg:'#e6eeff', accent:'var(--nm-secondary)', icon:'analytics',
        items:['평일 1일 = 코딩 (수요일 풀데이)', '메일리 격주 발행', '사연 + 1:1 월 2-4건'] },
      { title:'해외 취업 정찰', bg:'#ffe0cd', accent:'#7d3d00', icon:'travel_explore',
        items:['영문 포트폴리오 + 면접', '패션 (니트) + 1인 IP 양쪽 열어둠'] },
    ];
    operationModes.forEach(function(m) {
      html += '<div style="padding:14px 16px;border-radius:10px;background:' + m.bg + ';border-left:3px solid ' + m.accent + '">';
      html += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">' +
        '<span class="material-symbols-outlined" style="font-size:14px;color:' + m.accent + '">' + m.icon + '</span>' +
        '<h5 style="font-family:Manrope;font-size:12px;font-weight:700;color:' + m.accent + '">' + m.title + '</h5>' +
      '</div>';
      html += '<ul style="list-style:none;padding:0;margin:0">';
      m.items.forEach(function(it) {
        html += '<li style="font-size:11px;color:var(--nm-text-2);line-height:1.5;padding-left:10px;position:relative;margin-bottom:3px">' +
          '<span style="position:absolute;left:0;color:' + m.accent + '">·</span>' + it +
        '</li>';
      });
      html += '</ul>';
      html += '</div>';
    });
    html += '</div>'; // /노마드 운영

    html += '</div>'; // /8-4 split

    // ════════ SECTION 3 · Analyst N IP Phases (full-width 7 카드) ════════
    html += '<section class="nm-card nm-card-lg" style="margin-bottom:32px">';
    html += '<div style="display:flex;align-items:center;gap:14px;margin-bottom:24px">' +
      '<div style="width:44px;height:44px;border-radius:50%;background:rgba(124,58,237,0.12);display:flex;align-items:center;justify-content:center">' +
        '<span class="material-symbols-outlined" style="color:var(--nm-primary)">timeline</span>' +
      '</div>' +
      '<div>' +
        '<h4 style="font-family:Manrope;font-size:18px;font-weight:700;color:var(--nm-on-surface)">분석가 N IP Development Phases</h4>' +
        '<p style="font-size:12px;color:var(--nm-text-3);margin-top:2px">서브 트랙 · 메일리 + 디지털 제품 + 코칭 · 게이트 외 장기 자산</p>' +
      '</div>' +
    '</div>';

    // 7 Phase 카드 grid (responsive)
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px">';
    phases.forEach(function(p) {
      var state = p.num < activePhase ? 'done' : (p.num === activePhase ? 'active' : 'lock');
      var cardStyle, badgeStyle, iconHtml, opacity = '', extraRing = '';

      if (state === 'done') {
        cardStyle = 'background:#F5F3FF;border:1px solid rgba(124,58,237,0.15)';
        badgeStyle = 'background:rgba(124,58,237,0.2);color:var(--nm-primary)';
        iconHtml = '<span class="material-symbols-outlined" style="color:#16a34a;font-variation-settings:\'FILL\' 1">check_circle</span>';
        opacity = 'opacity:0.7';
      } else if (state === 'active') {
        cardStyle = 'background:#fff;border:2px solid var(--nm-primary);box-shadow:0 0 0 4px rgba(124,58,237,0.08), 0 8px 24px rgba(124,58,237,0.15);transform:scale(1.03);position:relative;z-index:1';
        badgeStyle = 'background:var(--nm-primary);color:#fff';
        iconHtml = '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--nm-primary);box-shadow:0 0 0 4px rgba(124,58,237,0.25);animation:nm-pulse 1.5s infinite"></span>';
      } else {
        cardStyle = 'background:var(--nm-surface-container-low);border:1px solid transparent';
        badgeStyle = 'background:rgba(122,116,135,0.15);color:var(--nm-text-3)';
        iconHtml = '<span class="material-symbols-outlined" style="color:var(--nm-text-3);font-size:18px">lock</span>';
        opacity = 'opacity:0.55';
      }

      html += '<div style="padding:18px;border-radius:12px;' + cardStyle + ';' + opacity + ';transition:transform 0.2s">';
      html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px">' +
        '<span style="padding:3px 8px;border-radius:4px;font-size:9px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;font-family:Manrope;' + badgeStyle + '">Phase 0' + p.num + '</span>' +
        iconHtml +
      '</div>';
      html += '<h5 style="font-family:Manrope;font-size:13px;font-weight:700;color:var(--nm-on-surface);margin-bottom:4px">' + p.name + '</h5>';
      html += '<p style="font-size:10px;color:var(--nm-primary);font-weight:600;font-family:Manrope;margin-bottom:8px">' + p.when + '</p>';
      html += '<p style="font-size:11px;color:var(--nm-text-2);line-height:1.5">' + p.goal + '</p>';
      html += '</div>';
    });
    html += '</div>';

    // 하단 footer
    html += '<div style="margin-top:20px;padding:16px 20px;background:linear-gradient(135deg,var(--nm-primary-soft),var(--nm-surface-container-low));border-radius:10px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px">' +
      '<div>' +
        '<p style="font-size:11px;color:var(--nm-text-3);text-transform:uppercase;letter-spacing:0.08em;font-weight:700;margin-bottom:2px">예상 기여 (2027.12 시점)</p>' +
        '<p style="font-family:Manrope;font-size:16px;font-weight:700;color:var(--nm-deep-indigo)">월 ₩100-300만</p>' +
      '</div>' +
      '<span style="font-size:11px;color:var(--nm-text-2);font-style:italic">게이트 외 · 노마드 후에도 장기 운영</span>' +
    '</div>';

    html += '</section>';

    // ════════ SECTION 4 · 6/6 split — Writing Velocity + Current Hub ════════
    html += '<div class="nm-grid nm-grid-2" style="gap:24px">';

    // ───── LEFT: Weekly Writing Velocity ─────
    html += '<div class="nm-card nm-card-lg">';
    html += '<h4 style="font-family:Manrope;font-size:18px;font-weight:700;color:var(--nm-on-surface);margin-bottom:6px">Weekly Writing Velocity</h4>';
    html += '<p style="font-size:12px;color:var(--nm-text-2);margin-bottom:24px">주간 작업 페이스 · 평일 오전 글 블록 + 수요일 코딩 데이</p>';

    // 7-day bar chart
    var weekdays = [
      { day:'Mon', label:'월', height:50, color:'var(--nm-primary)', opacity:0.45, tip:'글 블록 4h' },
      { day:'Tue', label:'화', height:95, color:'var(--nm-primary)', opacity:1,    tip:'글 4h + 발행' },
      { day:'Wed', label:'수', height:100,color:'var(--nm-secondary)', opacity:0.9, tip:'코딩 풀데이' },
      { day:'Thu', label:'목', height:90, color:'var(--nm-primary)', opacity:0.9, tip:'글 4h + 발행' },
      { day:'Fri', label:'금', height:55, color:'var(--nm-primary)', opacity:0.5, tip:'글 블록 4h' },
      { day:'Sat', label:'토', height:35, color:'var(--nm-secondary)', opacity:0.45, tip:'Synthesis · 사연 응답' },
      { day:'Sun', label:'일', height:25, color:'var(--nm-secondary)', opacity:0.3, tip:'휴식' },
    ];
    html += '<div style="height:170px;background:var(--nm-surface-container-low);border-radius:10px;padding:14px 12px;display:flex;align-items:flex-end;gap:10px;position:relative">';
    weekdays.forEach(function(d, i) {
      html += '<div style="flex:1;display:flex;flex-direction:column;align-items:center;height:100%">' +
        '<div style="flex:1;width:100%;display:flex;align-items:flex-end;position:relative">' +
          '<div title="' + d.label + ': ' + d.tip + '" style="width:100%;height:' + d.height + '%;background:' + d.color + ';opacity:' + d.opacity + ';border-radius:6px 6px 0 0;transition:opacity 0.15s;cursor:pointer" onmouseover="this.style.opacity=\'1\'" onmouseout="this.style.opacity=\'' + d.opacity + '\'"></div>' +
        '</div>' +
        '<span style="font-size:10px;color:var(--nm-text-3);font-weight:600;margin-top:5px">' + d.label + '</span>' +
      '</div>';
    });
    html += '</div>';

    // 하단 범례
    html += '<div style="margin-top:16px;display:flex;justify-content:space-between;font-size:11px;color:var(--nm-text-3);font-weight:600">' +
      '<span style="display:flex;align-items:center;gap:4px"><span style="width:10px;height:10px;background:var(--nm-primary);border-radius:2px"></span> Writing Block</span>' +
      '<span style="display:flex;align-items:center;gap:4px"><span style="width:10px;height:10px;background:var(--nm-secondary);border-radius:2px"></span> Coding / Synthesis</span>' +
      '<span style="display:flex;align-items:center;gap:4px"><span style="width:10px;height:10px;background:var(--nm-text-3);opacity:0.3;border-radius:2px"></span> Mobility / Rest</span>' +
    '</div>';
    html += '</div>';

    // ───── RIGHT: Current Hub ─────
    var hubName = '서울 (출국 전)';
    var hubSub = 'Deep Work Station · 노마드 전 거점';
    if (today >= DEPARTURE_DATE) {
      hubName = '포르투 (출국 후 첫 거점)';
      hubSub = 'Workation Hub A · 워홀 베이스';
    }

    html += '<div class="nm-card" style="padding:0;overflow:hidden;display:flex;flex-direction:column">';
    html += '<div style="padding:24px 28px;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid var(--nm-surface-container)">' +
      '<h4 style="font-family:Manrope;font-size:18px;font-weight:700;color:var(--nm-on-surface)">현재 거점: ' + hubName + '</h4>' +
      '<div style="display:flex;align-items:center;gap:6px;color:var(--nm-primary);font-size:11px;font-weight:600">' +
        '<span class="material-symbols-outlined" style="font-size:14px">wifi</span>' +
        '<span>Gigabit Secure</span>' +
      '</div>' +
    '</div>';
    // 그라데이션 hero (이미지 fallback)
    html += '<div style="flex:1;min-height:200px;position:relative;background:linear-gradient(135deg,#312E81 0%,#7C3AED 50%,#a78bfa 100%)">';
    // 점멸 그리드 deco
    html += '<svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" style="position:absolute;inset:0;width:100%;height:100%;opacity:0.3">';
    for (var gx = 0; gx < 9; gx++) {
      for (var gy = 0; gy < 5; gy++) {
        var op = 0.3 + Math.random() * 0.6;
        html += '<rect x="' + (gx * 48 + 10) + '" y="' + (gy * 42 + 10) + '" width="3" height="3" fill="rgba(255,255,255,' + op + ')" rx="1"/>';
      }
    }
    html += '</svg>';
    // 하단 overlay
    html += '<div style="position:absolute;inset:0;background:linear-gradient(to top, rgba(49,46,129,0.95), transparent 60%);display:flex;flex-direction:column;justify-content:flex-end;padding:24px 28px;color:#fff">' +
      '<p style="font-family:Manrope;font-size:14px;font-weight:700;margin-bottom:4px">Deep Work Station 01</p>' +
      '<p style="font-size:12px;color:rgba(255,255,255,0.75)">' + hubSub + '</p>' +
    '</div>';
    html += '</div>';
    html += '</div>'; // /Current Hub

    html += '</div>'; // /6-6 split

    return html;
  }
  registerPage('nomad-ip', renderIPTrack);

  // ──────── Stay Channels 페이지 ────────
  // ════════════════════════════════════════════════════════════════════
  // Nomad Gate — Apple-style Minimal (Stitch v2)
  // ════════════════════════════════════════════════════════════════════
  function renderGate() {
    var html = '';

    // Hero
    html += '<section style="margin-bottom:48px">';
    html += '<p style="font-family:Manrope,sans-serif;color:var(--nm-primary);font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:0.16em;margin:0 0 10px">Nomad Gate</p>';
    html += '<h2 style="font-family:Manrope,sans-serif;font-size:38px;font-weight:800;letter-spacing:-0.015em;color:#0f172a;margin:0 0 12px;line-height:1.15">진입 조건 · 출국 라인</h2>';
    html += '<p style="font-size:18px;color:var(--nm-text-3);font-weight:400;font-style:italic;margin:0">시기는 부차 · 조건이 본질</p>';
    html += '<div style="height:1px;background:#f1f5f9;margin-top:32px"></div>';
    html += '</section>';

    // 3 metric cards
    html += '<section class="nm-grid nm-grid-3" style="margin-bottom:48px;gap:24px">';
    var metrics = [
      { label:'하한선 (출국 확정)', prefix:'월', value:'₩450', sub:'2027.12 평가',         color:'#0f172a' },
      { label:'욕심 라인',         prefix:'월', value:'₩800', sub:'노마드 동안도 저축 가능', color:'var(--nm-primary)' },
      { label:'평가 시점',         prefix:'',   value:'2027.12', sub:'3개월 연속 안정',     color:'#0f172a' },
    ];
    metrics.forEach(function(m) {
      html += '<div style="background:#fff;border:1px solid #e5e7eb;border-radius:24px;padding:32px;transition:box-shadow 0.2s;cursor:default" onmouseover="this.style.boxShadow=\'0 6px 18px rgba(15,23,42,0.08)\'" onmouseout="this.style.boxShadow=\'0 1px 3px rgba(15,23,42,0.04)\'">';
      html += '<p style="font-size:11px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.04em;margin:0 0 16px">' + m.label + '</p>';
      html += '<div style="display:flex;align-items:baseline;gap:6px">' +
        (m.prefix ? '<span style="font-size:18px;font-weight:700;color:var(--nm-primary)">' + m.prefix + '</span>' : '') +
        '<span style="font-family:Manrope,sans-serif;font-size:38px;font-weight:800;letter-spacing:-0.015em;color:' + m.color + '">' + m.value + '</span>' +
      '</div>';
      html += '<p style="font-size:11px;font-weight:600;color:#9ca3af;text-transform:uppercase;letter-spacing:0.04em;margin:18px 0 0">' + m.sub + '</p>';
      html += '</div>';
    });
    html += '</section>';

    // Simulation table
    html += '<section style="background:#fff;border:1px solid #e5e7eb;border-radius:24px;overflow:hidden;margin-bottom:48px;box-shadow:0 1px 3px rgba(15,23,42,0.04)">';
    html += '<div style="padding:18px 28px;background:#fafafa;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:8px">' +
      '<span class="material-symbols-outlined" style="color:var(--nm-primary);font-size:16px">cloud_sync</span>' +
      '<h3 style="font-family:Manrope,sans-serif;font-size:13px;font-weight:700;color:#374151;margin:0">1년 노마드 후 자산 시뮬</h3>' +
    '</div>';
    html += '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;text-align:left">';
    html += '<thead><tr style="background:rgba(248,250,252,0.5)">' +
      ['시나리오','출국 자산','노마드 비용','노마드 수익 (세후)','귀국 자산'].map(function(h){
        return '<th style="padding:14px 28px;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em">' + h + '</th>';
      }).join('') +
    '</tr></thead>';
    html += '<tbody>';
    var sims = [
      { sc:'게이트 450 (하한선)', start:'1.5억', cost:'-6,800만', gain:'+4,500만', end:'약 1.3억', pill:{label:'자산 약간 감소',bg:'#f3f4f6',color:'#6b7280'} },
      { sc:'게이트 600',          start:'1.5억', cost:'-6,800만', gain:'+5,800만', end:'약 1.4억', pill:{label:'거의 그대로',  bg:'#dcfce7',color:'#16a34a'} },
      { sc:'게이트 800 (욕심)',   start:'1.5억', cost:'-6,800만', gain:'+7,700만', end:'약 1.5억', pill:{label:'저축 가능',    bg:'#f5f3ff',color:'var(--nm-primary)'} },
    ];
    sims.forEach(function(s) {
      html += '<tr style="border-top:1px solid #f8fafc;transition:background 0.15s" onmouseover="this.style.background=\'rgba(248,250,252,0.5)\'" onmouseout="this.style.background=\'transparent\'">';
      html += '<td style="padding:22px 28px;font-size:13px;font-weight:500;color:#374151">' + s.sc + '</td>';
      html += '<td style="padding:22px 28px;font-size:13px;color:#374151">' + s.start + '</td>';
      html += '<td style="padding:22px 28px;font-size:13px;color:#ef4444">' + s.cost + '</td>';
      html += '<td style="padding:22px 28px;font-size:13px;color:var(--nm-primary)">' + s.gain + '</td>';
      html += '<td style="padding:22px 28px;font-size:13px;color:#374151"><span style="font-weight:700">' + s.end + '</span> <span style="margin-left:8px;font-size:10px;font-weight:600;padding:3px 9px;border-radius:99px;background:' + s.pill.bg + ';color:' + s.pill.color + '">' + s.pill.label + '</span></td>';
      html += '</tr>';
    });
    html += '</tbody></table></div>';
    html += '</section>';

    // Decision tree
    html += '<section style="background:#fff;border:1px solid #e5e7eb;border-radius:24px;padding:32px;box-shadow:0 1px 3px rgba(15,23,42,0.04)">';
    html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:22px">' +
      '<span class="material-symbols-outlined" style="color:var(--nm-primary);font-size:16px">flag</span>' +
      '<h3 style="font-family:Manrope,sans-serif;font-size:13px;font-weight:700;color:#374151;margin:0">결정 트리</h3>' +
    '</div>';
    html += '<ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:14px">';
    var decisions = [
      { h:'2027.12 게이트 평가 시:', t:'월 ₩450 달성 → 출국 확정' },
      { h:'미달 시:',                 t:'출국 1년 보류 (2029.6 → 2030.6)' },
      { h:'욕심 ₩800 도달 시:',       t:'노마드 동안 자산 유지·증가' },
      { h:'출국 안전망:',             t:'한국 자산 1.5억 + 동생이 집·차 관리 (정리 X)' },
    ];
    decisions.forEach(function(d) {
      html += '<li style="display:flex;align-items:flex-start;gap:14px">' +
        '<span style="color:var(--nm-primary);margin-top:6px;font-size:18px;line-height:1;flex-shrink:0">•</span>' +
        '<p style="font-size:14px;line-height:1.55;font-weight:500;color:#374151;margin:0"><span style="font-weight:700;color:#0f172a">' + d.h + '</span> ' + d.t + '</p>' +
      '</li>';
    });
    html += '</ul>';
    html += '</section>';

    return html;
  }
  registerPage('nomad-gate', renderGate);

  // ════════════════════════════════════════════════════════════════════
  // Backward Plan — Editorial Zigzag Timeline (Stitch v2)
  // ════════════════════════════════════════════════════════════════════
  function renderBackward() {
    var html = '';
    var phases = DATA.PHASES || [];

    // Phase별 hero 그라데이션 (이미지 fallback)
    var phaseGrads = {
      'A': 'linear-gradient(135deg,#fef3c7 0%,#fbbf24 60%,#f59e0b 100%)', // Foundation: warm gold
      'B': 'linear-gradient(135deg,#dbeafe 0%,#818cf8 60%,#6366f1 100%)', // Build: blue indigo
      'C': 'linear-gradient(135deg,#fce7f3 0%,#f472b6 60%,#db2777 100%)', // Exit: rose
      'D': 'linear-gradient(135deg,#a78bfa 0%,#7C3AED 60%,#312E81 100%)', // Departure: violet (active)
    };
    var phaseLabelBig = {
      'A': 'FOUNDATION',
      'B': 'BUILDING',
      'C': 'EXIT STRATEGY',
      'D': 'DEPARTURE',
    };

    // Hero
    html += '<section style="padding:48px 0 64px;position:relative;overflow:hidden">';
    html += '<div style="position:absolute;top:50%;right:-40px;transform:translateY(-50%);width:340px;height:340px;background:rgba(124,58,237,0.06);border-radius:50%;filter:blur(50px);z-index:0"></div>';
    html += '<div style="position:relative;z-index:1;max-width:880px">';
    html += '<span style="font-family:Manrope,sans-serif;font-size:11px;font-weight:700;color:var(--nm-primary);letter-spacing:0.18em;text-transform:uppercase;display:block;margin-bottom:18px">Strategic Roadmap</span>';
    html += '<h1 style="font-family:Manrope,sans-serif;font-size:64px;font-weight:800;letter-spacing:-0.02em;line-height:1.05;color:#0f172a;margin:0 0 24px">The Backward Plan</h1>';
    html += '<p style="font-size:22px;font-weight:400;color:var(--nm-text-2);line-height:1.5;margin:0;max-width:680px">2026.5 → 2028.6 · 25개월 · 출국까지의 큰 그림. 4 Phase로 나눈 정밀 백워드 설계.</p>';
    html += '</div>';
    html += '</section>';

    // Editorial Vertical Timeline (zigzag)
    html += '<section style="position:relative;padding-bottom:64px">';
    html += '<div style="max-width:1100px;margin:0 auto;position:relative">';
    // 중앙 line
    html += '<div class="nm-bp-line" style="position:absolute;left:50%;top:0;bottom:0;width:2px;background:linear-gradient(180deg,transparent 0%,var(--nm-primary) 15%,var(--nm-primary) 85%,transparent 100%);transform:translateX(-50%);opacity:0.3"></div>';

    phases.forEach(function(p, idx) {
      var isLeft = (idx % 2 === 0);
      var isActive = (p.id === 'A'); // 현재 Phase A 진행 중
      var isFinal = (p.id === 'D');
      var grad = phaseGrads[p.id] || phaseGrads['A'];
      var bigLabel = phaseLabelBig[p.id] || p.name;
      var num = String(idx + 1).padStart(2, '0');

      html += '<div class="nm-bp-row" style="position:relative;margin-bottom:64px;display:flex;align-items:center;gap:48px">';

      if (isLeft) {
        // LEFT: glass-card
        html += '<div class="nm-bp-card-wrap" style="flex:0 0 calc(50% - 32px)">';
        html += '<div style="background:rgba(255,255,255,0.85);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(15,23,42,0.05);padding:28px;border-radius:24px;box-shadow:0 10px 30px rgba(15,23,42,0.06);transition:transform 0.5s' + (isFinal ? ';border:2px solid rgba(124,58,237,0.2)' : '') + '" onmouseover="this.style.transform=\'translateY(-6px)\'" onmouseout="this.style.transform=\'none\'">';
        // 그라데이션 hero 영역 (이미지 fallback)
        html += '<div style="aspect-ratio:4/3;border-radius:16px;background:' + grad + ';margin-bottom:22px;position:relative;overflow:hidden">';
        html += '<svg viewBox="0 0 320 240" preserveAspectRatio="xMidYMid slice" style="position:absolute;inset:0;width:100%;height:100%;opacity:0.35">' +
          '<circle cx="80" cy="60" r="2" fill="#fff"/>' +
          '<circle cx="220" cy="80" r="2.5" fill="#fff"/>' +
          '<circle cx="260" cy="160" r="2" fill="#fff"/>' +
          '<circle cx="60" cy="180" r="1.5" fill="#fff"/>' +
          '<circle cx="160" cy="200" r="2" fill="#fff"/>' +
        '</svg>';
        html += '</div>';
        html += '<div style="display:flex;flex-direction:column;gap:14px">';
        html += '<div style="display:flex;align-items:center;justify-content:space-between">' +
          '<span style="background:rgba(124,58,237,0.1);color:var(--nm-primary);padding:6px 14px;border-radius:99px;font-family:Manrope,sans-serif;font-size:11px;font-weight:700">Phase ' + p.id + '</span>' +
          '<span style="font-family:Manrope,sans-serif;font-size:11px;font-weight:600;color:var(--nm-text-3)">' + p.range + '</span>' +
        '</div>';
        html += '<h3 style="font-family:Manrope,sans-serif;font-size:24px;font-weight:800;letter-spacing:-0.01em;color:#0f172a;margin:0">' + p.name + '</h3>';
        html += '<p style="font-family:Manrope,sans-serif;font-size:14px;font-weight:700;color:var(--nm-primary);margin:0;line-height:1.4">' + p.title + '</p>';
        html += '<p style="font-size:13px;color:var(--nm-text-2);line-height:1.6;margin:0">' + p.description + '</p>';
        html += '<ul style="list-style:none;padding:0;margin:14px 0 0;display:flex;flex-direction:column;gap:10px">';
        (p.items || []).forEach(function(it, ii) {
          var icon = (isActive || p.id === 'A') ? 'check_circle' : (isFinal ? (ii === 0 ? 'flight_takeoff' : 'radio_button_unchecked') : 'radio_button_unchecked');
          var color = (isActive || p.id === 'A') ? 'var(--nm-primary)' : (isFinal && ii === 0 ? 'var(--nm-primary)' : 'rgba(122,116,135,0.5)');
          var fill = (isActive || p.id === 'A' || (isFinal && ii === 0)) ? '1' : '0';
          html += '<li style="display:flex;gap:10px;align-items:flex-start">' +
            '<span class="material-symbols-outlined" style="color:' + color + ';font-size:17px;flex-shrink:0;margin-top:1px;font-variation-settings:\'FILL\' ' + fill + '">' + icon + '</span>' +
            '<span style="font-size:13px;color:var(--nm-text-2);line-height:1.5' + (isFinal && ii === 0 ? ';font-weight:700;color:var(--nm-primary)' : '') + '">' + it + '</span>' +
          '</li>';
        });
        html += '</ul>';
        html += '</div>';
        html += '</div>';
        html += '</div>';

        // CENTER marker
        html += '<div class="nm-bp-marker" style="position:absolute;left:50%;transform:translateX(-50%);width:64px;height:64px;border-radius:50%;background:' + (isFinal ? 'var(--nm-primary)' : '#fff') + ';border:4px solid var(--nm-primary);display:flex;align-items:center;justify-content:center;font-family:Manrope,sans-serif;font-size:24px;font-weight:800;color:' + (isFinal ? '#fff' : 'var(--nm-primary)') + ';box-shadow:0 8px 24px rgba(124,58,237,0.18);z-index:2' + (isFinal ? ';transform:translateX(-50%) scale(1.1)' : '') + '">' + num + '</div>';

        // RIGHT: big opacity label
        html += '<div class="nm-bp-label-wrap" style="flex:0 0 calc(50% - 32px);padding-left:48px">';
        html += '<h2 style="font-family:Manrope,sans-serif;font-size:56px;font-weight:800;letter-spacing:-0.02em;color:#0f172a;opacity:0.08;margin:0;text-transform:uppercase;line-height:1">' + bigLabel + '</h2>';
        html += '</div>';
      } else {
        // RIGHT side card (zigzag)
        html += '<div class="nm-bp-label-wrap" style="flex:0 0 calc(50% - 32px);text-align:right;padding-right:48px">';
        html += '<h2 style="font-family:Manrope,sans-serif;font-size:56px;font-weight:800;letter-spacing:-0.02em;color:#0f172a;opacity:0.08;margin:0;text-transform:uppercase;line-height:1">' + bigLabel + '</h2>';
        html += '</div>';

        // CENTER marker
        html += '<div class="nm-bp-marker" style="position:absolute;left:50%;transform:translateX(-50%);width:64px;height:64px;border-radius:50%;background:' + (isFinal ? 'var(--nm-primary)' : '#fff') + ';border:4px solid var(--nm-primary);display:flex;align-items:center;justify-content:center;font-family:Manrope,sans-serif;font-size:24px;font-weight:800;color:' + (isFinal ? '#fff' : 'var(--nm-primary)') + ';box-shadow:0 8px 24px rgba(124,58,237,0.18);z-index:2' + (isFinal ? ';transform:translateX(-50%) scale(1.1)' : '') + '">' + num + '</div>';

        // RIGHT: glass card
        html += '<div class="nm-bp-card-wrap" style="flex:0 0 calc(50% - 32px)">';
        html += '<div style="background:rgba(255,255,255,0.85);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(15,23,42,0.05);padding:28px;border-radius:24px;box-shadow:0 10px 30px rgba(15,23,42,0.06);transition:transform 0.5s' + (isFinal ? ';border:2px solid rgba(124,58,237,0.2)' : '') + '" onmouseover="this.style.transform=\'translateY(-6px)\'" onmouseout="this.style.transform=\'none\'">';
        html += '<div style="aspect-ratio:4/3;border-radius:16px;background:' + grad + ';margin-bottom:22px;position:relative;overflow:hidden">';
        html += '<svg viewBox="0 0 320 240" preserveAspectRatio="xMidYMid slice" style="position:absolute;inset:0;width:100%;height:100%;opacity:0.35">' +
          '<circle cx="80" cy="60" r="2" fill="#fff"/>' +
          '<circle cx="220" cy="80" r="2.5" fill="#fff"/>' +
          '<circle cx="260" cy="160" r="2" fill="#fff"/>' +
          '<circle cx="60" cy="180" r="1.5" fill="#fff"/>' +
          '<circle cx="160" cy="200" r="2" fill="#fff"/>' +
        '</svg>';
        html += '</div>';
        html += '<div style="display:flex;flex-direction:column;gap:14px">';
        html += '<div style="display:flex;align-items:center;justify-content:space-between">' +
          '<span style="background:' + (isFinal ? 'var(--nm-primary)' : 'rgba(124,58,237,0.1)') + ';color:' + (isFinal ? '#fff' : 'var(--nm-primary)') + ';padding:6px 14px;border-radius:99px;font-family:Manrope,sans-serif;font-size:11px;font-weight:700">Phase ' + p.id + '</span>' +
          '<span style="font-family:Manrope,sans-serif;font-size:11px;font-weight:600;color:' + (isFinal ? 'var(--nm-primary)' : 'var(--nm-text-3)') + '">' + p.range + '</span>' +
        '</div>';
        html += '<h3 style="font-family:Manrope,sans-serif;font-size:24px;font-weight:800;letter-spacing:-0.01em;color:#0f172a;margin:0">' + p.name + '</h3>';
        html += '<p style="font-family:Manrope,sans-serif;font-size:14px;font-weight:700;color:var(--nm-primary);margin:0;line-height:1.4">' + p.title + '</p>';
        html += '<p style="font-size:13px;color:var(--nm-text-2);line-height:1.6;margin:0">' + p.description + '</p>';
        html += '<ul style="list-style:none;padding:0;margin:14px 0 0;display:flex;flex-direction:column;gap:10px">';
        (p.items || []).forEach(function(it, ii) {
          var icon = (isFinal && ii === 0) ? 'flight_takeoff' : 'radio_button_unchecked';
          var color = (isFinal && ii === 0) ? 'var(--nm-primary)' : 'rgba(122,116,135,0.5)';
          var fill = (isFinal && ii === 0) ? '1' : '0';
          html += '<li style="display:flex;gap:10px;align-items:flex-start">' +
            '<span class="material-symbols-outlined" style="color:' + color + ';font-size:17px;flex-shrink:0;margin-top:1px;font-variation-settings:\'FILL\' ' + fill + '">' + icon + '</span>' +
            '<span style="font-size:13px;color:var(--nm-text-2);line-height:1.5' + (isFinal && ii === 0 ? ';font-weight:700;color:var(--nm-primary)' : '') + '">' + it + '</span>' +
          '</li>';
        });
        html += '</ul>';
        html += '</div>';
        html += '</div>';
        html += '</div>';
      }

      html += '</div>'; // /nm-bp-row
    });

    html += '</div>'; // /timeline wrapper
    html += '</section>';

    // Bottom CTA
    html += '<section style="padding:64px 0;text-align:center">';
    html += '<div style="max-width:560px;margin:0 auto">';
    html += '<h2 style="font-family:Manrope,sans-serif;font-size:36px;font-weight:800;letter-spacing:-0.02em;color:#0f172a;margin:0 0 18px">Ready to initiate?</h2>';
    html += '<p style="font-size:16px;color:var(--nm-text-2);line-height:1.6;margin:0 0 28px">2027.12 게이트 평가까지 페이스 유지. 각 Phase 항목 체크하며 진행.</p>';
    html += '<div style="display:flex;justify-content:center;gap:14px;flex-wrap:wrap">';
    html += '<button onclick="NOMAD_PAGES.go(\'nomad-actions\')" style="background:var(--nm-primary);color:#fff;padding:16px 32px;border:none;border-radius:99px;font-family:Manrope,sans-serif;font-size:14px;font-weight:700;cursor:pointer;box-shadow:0 8px 24px rgba(124,58,237,0.25);transition:transform 0.15s" onmouseover="this.style.transform=\'translateY(-2px)\'" onmouseout="this.style.transform=\'none\'">Action Items 보기</button>';
    html += '<button onclick="NOMAD_PAGES.go(\'nomad-gate\')" style="background:transparent;color:var(--nm-text-2);padding:16px 32px;border:1px solid var(--nm-outline-variant);border-radius:99px;font-family:Manrope,sans-serif;font-size:14px;font-weight:600;cursor:pointer;transition:background 0.15s" onmouseover="this.style.background=\'#F5F3FF\'" onmouseout="this.style.background=\'transparent\'">Gate 조건 확인</button>';
    html += '</div>';
    html += '</div>';
    html += '</section>';

    return html;
  }
  registerPage('nomad-backward', renderBackward);

  // ════════════════════════════════════════════════════════════════════
  // Stay Channels — Apple Minimal (Stitch v2)
  // ════════════════════════════════════════════════════════════════════
  function renderChannels() {
    var html = '';

    // Hero
    html += '<section style="margin-bottom:40px">';
    html += '<p style="font-family:Manrope,sans-serif;color:var(--nm-primary);font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:0.18em;margin:0 0 6px">Stay Channels</p>';
    html += '<h2 style="font-family:Manrope,sans-serif;font-size:38px;font-weight:800;letter-spacing:-0.015em;color:#0f172a;margin:0 0 10px;line-height:1.15">도시별 숙소 채널</h2>';
    html += '<p style="font-size:15px;color:var(--nm-text-3);font-weight:500;margin:0">Flatio · Stayz · Furnished Finder · 로컬 · 부엌 + Wi-Fi + 안전 동네 필수</p>';
    html += '</section>';

    // 테이블 헬퍼
    function renderChannelTable(icon, title, channels) {
      var h = '<section style="background:#fff;border:1px solid #e5e7eb;border-radius:18px;overflow:hidden;box-shadow:0 1px 3px rgba(15,23,42,0.04);margin-bottom:24px">';
      h += '<div style="padding:18px 26px;background:rgba(248,250,252,0.5);border-bottom:1px solid #e5e7eb;display:flex;align-items:center;gap:10px">' +
        '<span class="material-symbols-outlined" style="color:var(--nm-primary);font-size:18px">' + icon + '</span>' +
        '<h3 style="font-family:Manrope,sans-serif;font-size:14px;font-weight:700;color:#374151;margin:0">' + title + '</h3>' +
        '<span style="margin-left:auto;font-size:11px;color:var(--nm-text-3);font-weight:600">' + channels.length + ' 도시</span>' +
      '</div>';
      h += '<div style="overflow-x:auto"><table style="width:100%;border-collapse:collapse;text-align:left">';
      h += '<thead><tr style="border-bottom:1px solid #f1f5f9">' +
        ['도시','1순위','2순위','비고'].map(function(t){
          return '<th style="padding:14px 24px;font-size:10px;font-weight:700;color:#9ca3af;text-transform:uppercase;letter-spacing:0.08em">' + t + '</th>';
        }).join('') +
      '</tr></thead>';
      h += '<tbody style="font-size:13px;color:#374151">';
      channels.forEach(function(c) {
        h += '<tr style="border-bottom:1px solid #f8fafc;transition:background 0.15s" onmouseover="this.style.background=\'rgba(248,250,252,0.5)\'" onmouseout="this.style.background=\'transparent\'">';
        h += '<td style="padding:16px 24px;font-weight:500">' + c.city + '</td>';
        h += '<td style="padding:16px 24px"><span style="background:#F5F3FF;color:var(--nm-primary);padding:5px 12px;border-radius:6px;font-family:Manrope,sans-serif;font-size:11px;font-weight:700">' + c.first + '</span></td>';
        h += '<td style="padding:16px 24px">' + c.second + '</td>';
        h += '<td style="padding:16px 24px;color:var(--nm-text-3);font-size:12px">' + c.note + '</td>';
        h += '</tr>';
      });
      h += '</tbody></table></div>';
      h += '</section>';
      return h;
    }

    // 유럽 테이블
    html += renderChannelTable('public', '유럽 6개월 · FLATIO 메인', DATA.CHANNELS_EU);
    // 글로벌 테이블
    html += renderChannelTable('language', '호주 · NZ · 미주 6개월 · 로컬 + FURNISHED FINDER', DATA.CHANNELS_GLOBAL);

    // 검색 · 예약 타임라인
    html += '<section style="background:#fff;border:1px solid #e5e7eb;border-radius:18px;padding:32px;box-shadow:0 1px 3px rgba(15,23,42,0.04);margin-bottom:24px">';
    html += '<div style="display:flex;align-items:center;gap:10px;margin-bottom:22px">' +
      '<span class="material-symbols-outlined" style="color:var(--nm-primary);font-size:18px">schedule</span>' +
      '<h3 style="font-family:Manrope,sans-serif;font-size:16px;font-weight:700;color:#374151;margin:0">검색 · 예약 타임라인</h3>' +
    '</div>';
    var tlItems = [
      { h:'2027.12부터 (출국 6개월 전):', t:'Flatio · Stayz · Furnished Finder 가입 + 검색 시작, 가격 추적' },
      { h:'2028.3 (3개월 전):',           t:'6-8월 숙소 확정 예약 (포르투갈·아일랜드·덴마크)' },
      { h:'2028.4 (2개월 전):',           t:'9-11월 숙소 확정 예약 (스칸디나비아·아이슬란드·말타)' },
      { h:'출국 후:',                       t:'12월 이후 = 노마드 중 5-6주 전 예약 (유연하게)' },
    ];
    html += '<ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:14px">';
    tlItems.forEach(function(t) {
      html += '<li style="display:flex;align-items:flex-start;gap:14px">' +
        '<span style="color:var(--nm-primary);margin-top:5px;font-size:14px;line-height:1;flex-shrink:0">•</span>' +
        '<div><span style="font-weight:700;color:#0f172a">' + t.h + '</span>' +
        '<span style="color:var(--nm-text-2);margin-left:8px">' + t.t + '</span></div>' +
      '</li>';
    });
    html += '</ul>';
    html += '</section>';

    // 누리 기준 3-col
    html += '<section style="background:#fff;border:1px solid #e5e7eb;border-radius:18px;padding:32px;box-shadow:0 1px 3px rgba(15,23,42,0.04)">';
    html += '<div style="display:flex;align-items:center;gap:10px;margin-bottom:28px">' +
      '<span class="material-symbols-outlined" style="color:var(--nm-primary);font-size:18px">checklist_rtl</span>' +
      '<h3 style="font-family:Manrope,sans-serif;font-size:16px;font-weight:700;color:#374151;margin:0">숙소 기준 (누리 라인)</h3>' +
    '</div>';
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:40px">';

    var criteria = [
      { title:'필수',     color:'#0f172a',                   borderColor:'#f1f5f9',           dot:'#94a3b8', items:['개인실 (1베드룸 또는 스튜디오)', '부엌 (집밥 위주)', 'Wi-Fi 50Mbps+', '안전 동네', '평점 4.5+'] },
      { title:'양보 가능', color:'#0f172a',                   borderColor:'#f1f5f9',           dot:'#94a3b8', items:['신축 → 적당 노후 (5-15년)', '시내 중심 → 외곽 (대중교통 15분)', '럭셔리 → 깨끗한 기본'] },
      { title:'NO',       color:'#dc2626', titleStyle:'text-transform:uppercase;letter-spacing:0.14em', borderColor:'#fee2e2', dot:'#f87171', itemColor:'rgba(185,28,28,0.85)', items:['호스텔 도미토리', '위험 동네', '부엌 X'] },
    ];
    criteria.forEach(function(c) {
      html += '<div>';
      html += '<h4 style="font-family:Manrope,sans-serif;font-size:14px;font-weight:700;color:' + c.color + ';border-bottom:2px solid ' + c.borderColor + ';padding-bottom:10px;margin:0 0 18px' + (c.titleStyle ? ';' + c.titleStyle : '') + '">' + c.title + '</h4>';
      html += '<ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:11px">';
      c.items.forEach(function(it) {
        html += '<li style="display:flex;align-items:center;gap:12px;font-size:13px;color:' + (c.itemColor || 'var(--nm-text-2)') + '">' +
          '<span style="width:6px;height:6px;border-radius:50%;background:' + c.dot + ';flex-shrink:0"></span>' +
          it +
        '</li>';
      });
      html += '</ul>';
      html += '</div>';
    });
    html += '</div>';
    html += '</section>';

    return html;
  }
  registerPage('nomad-channels', renderChannels);

  // ──────── Operating Principles 페이지 (Stitch Magazine 디자인) ────────
  function renderPrinciples() {
    var html = '';

    // 도시별 일 비중 데이터 (dashboard 원본 유지)
    var workRatio = [
      { period:'6월 포르투',           mode:'적응 + 글 풀가동',  pct:70, flag:'🇵🇹' },
      { period:'7월 아일랜드',         mode:'글 + 위성',         pct:60, flag:'🇮🇪' },
      { period:'8월 덴마크·노르웨이',  mode:'이동 많음',         pct:40, flag:'🇩🇰' },
      { period:'9월 스웨덴',           mode:'글 풀가동',         pct:70, flag:'🇸🇪' },
      { period:'9-10월 핀란드',        mode:'글 + 디자인 영감',  pct:60, flag:'🇫🇮' },
      { period:'10월 아이슬란드',      mode:'거의 휴가',         pct:20, flag:'🇮🇸' },
      { period:'10-11월 포르투갈',     mode:'휴식 + 글 보충',    pct:60, flag:'🇵🇹' },
      { period:'11월 말타',            mode:'글 + 해변',         pct:60, flag:'🇲🇹' },
      { period:'12월 호바트',          mode:'글 + 자연',         pct:70, flag:'🇦🇺' },
      { period:'1월 애들레이드',        mode:'글 + 예술',        pct:70, flag:'🇦🇺' },
      { period:'2월 멜버른',           mode:'글 풀가동',         pct:75, flag:'🇦🇺' },
      { period:'3월 뉴질랜드',         mode:'글 + 자연',         pct:60, flag:'🇳🇿' },
      { period:'4월 샌디에이고',        mode:'글 + 미국 경험',    pct:60, flag:'🇺🇸' },
      { period:'5월 핼리팩스',         mode:'글 + 마무리',       pct:70, flag:'🇨🇦' },
    ];
    var avgRatio = Math.round(workRatio.reduce(function(a,r){return a+r.pct;}, 0) / workRatio.length);

    // Page Header
    html += pageHeader('Operating Principles', '노마드 운영 원칙',
      '거점 + 위성 · 일 70 / 관광 30 · 회복 인정');

    // ════════ SECTION 1 · Manifesto Hero (deep-indigo bg, Stitch 카드 풀 확장) ════════
    html += '<div class="nm-card" style="padding:48px;background:var(--nm-deep-indigo);color:#fff;position:relative;overflow:hidden;margin-bottom:32px">';
    // blur deco circle
    html += '<div style="position:absolute;top:-60px;right:-60px;width:240px;height:240px;background:var(--nm-primary);opacity:0.18;border-radius:50%;filter:blur(60px)"></div>';
    html += '<div style="position:absolute;bottom:-40px;left:-40px;width:180px;height:180px;background:#fbbf24;opacity:0.12;border-radius:50%;filter:blur(50px)"></div>';

    html += '<div style="position:relative;z-index:1">';
    // 헤더
    html += '<div style="display:flex;align-items:flex-start;gap:18px;margin-bottom:36px">' +
      '<div style="width:54px;height:54px;border-radius:14px;background:rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;flex-shrink:0">' +
        '<span class="material-symbols-outlined" style="font-size:30px;color:#eaddff">precision_manufacturing</span>' +
      '</div>' +
      '<div>' +
        '<h2 style="font-family:Manrope;font-size:28px;font-weight:800;color:#fff;line-height:1.15;margin-bottom:6px">Operating Principles</h2>' +
        '<p style="font-size:11px;color:#d2bbff;text-transform:uppercase;letter-spacing:0.18em;font-weight:700">The Efficiency Manifesto</p>' +
      '</div>' +
    '</div>';

    // 70 / 30 split
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-bottom:36px">';

    // 70 · Deep Work
    html += '<div style="display:flex;gap:20px;padding:24px;background:rgba(255,255,255,0.05);border-radius:14px;border-left:3px solid #eaddff">' +
      '<div style="font-family:Manrope;font-size:64px;font-weight:800;color:#eaddff;line-height:1;flex-shrink:0">70</div>' +
      '<div>' +
        '<p style="font-family:Manrope;font-size:15px;font-weight:700;color:#fff;margin-bottom:8px">Deep Work Focus</p>' +
        '<p style="font-size:12px;color:rgba(234,221,255,0.85);line-height:1.6;margin-bottom:10px">평일 오전 4시간 글 블록 + 수요일 코딩 풀데이. 모든 외부 입력 차단.</p>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap">' +
          '<span style="font-size:10px;font-weight:700;background:rgba(234,221,255,0.15);color:#eaddff;padding:3px 9px;border-radius:99px">Writing Block</span>' +
          '<span style="font-size:10px;font-weight:700;background:rgba(234,221,255,0.15);color:#eaddff;padding:3px 9px;border-radius:99px">Coding Day</span>' +
        '</div>' +
      '</div>' +
    '</div>';

    // 30 · Travel & Synthesis
    html += '<div style="display:flex;gap:20px;padding:24px;background:rgba(255,255,255,0.03);border-radius:14px;border-left:3px solid rgba(234,221,255,0.45)">' +
      '<div style="font-family:Manrope;font-size:64px;font-weight:800;color:rgba(234,221,255,0.55);line-height:1;flex-shrink:0">30</div>' +
      '<div>' +
        '<p style="font-family:Manrope;font-size:15px;font-weight:700;color:#fff;margin-bottom:8px">Travel &amp; Synthesis</p>' +
        '<p style="font-size:12px;color:rgba(234,221,255,0.7);line-height:1.6;margin-bottom:10px">오후 현지 체험 + 주말 위성 + 이동일 회복. 외부 입력 → 글감 변환.</p>' +
        '<div style="display:flex;gap:6px;flex-wrap:wrap">' +
          '<span style="font-size:10px;font-weight:700;background:rgba(234,221,255,0.08);color:rgba(234,221,255,0.85);padding:3px 9px;border-radius:99px">Field Research</span>' +
          '<span style="font-size:10px;font-weight:700;background:rgba(234,221,255,0.08);color:rgba(234,221,255,0.85);padding:3px 9px;border-radius:99px">Recovery</span>' +
        '</div>' +
      '</div>' +
    '</div>';

    html += '</div>';

    // 하단 인용구
    html += '<div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:24px;display:flex;align-items:flex-start;gap:12px">' +
      '<span class="material-symbols-outlined" style="color:#d2bbff;font-size:22px;margin-top:-2px">format_quote</span>' +
      '<p style="font-size:14px;font-style:italic;color:rgba(255,255,255,0.85);line-height:1.6;font-family:Inter">거점은 회로의 닻 · 위성은 영감의 산소. 이동은 글감이지, 일과가 아니다.</p>' +
    '</div>';

    html += '</div>';
    html += '</div>';

    // ════════ SECTION 2 · 8/4 split — 도시별 일 비중 + 거점+위성 모델 ════════
    html += '<div class="nm-grid nm-grid-2-1" style="margin-bottom:32px">';

    // ───── LEFT (8): 도시별 작업 비중 시각화 ─────
    html += '<div class="nm-card nm-card-lg">';
    html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px;flex-wrap:wrap;gap:12px">' +
      '<div>' +
        '<h4 style="font-family:Manrope;font-size:18px;font-weight:700;color:var(--nm-on-surface);margin-bottom:4px">도시별 작업 비중</h4>' +
        '<p style="font-size:12px;color:var(--nm-text-2)">14개 도시 · 일 비중 70%+ = Focus / 50-70 = Mixed / 50- = Recovery</p>' +
      '</div>' +
      '<div style="background:#F5F3FF;color:var(--nm-primary);padding:8px 16px;border-radius:99px;font-family:Manrope;font-size:13px;font-weight:700">평균 ≈ ' + avgRatio + '%</div>' +
    '</div>';

    // 14 도시 가로 bar
    html += '<div style="display:flex;flex-direction:column;gap:10px;position:relative">';
    workRatio.forEach(function(r) {
      var color, bgColor;
      if (r.pct >= 70)      { color = 'var(--nm-primary)';   bgColor = '#F5F3FF'; }
      else if (r.pct >= 50) { color = 'var(--nm-secondary)'; bgColor = '#e6eeff'; }
      else                  { color = '#c2410c';             bgColor = '#fff7ed'; }
      html += '<div class="nm-principles-bar-row">';
      // 도시 라벨
      html += '<div style="display:flex;align-items:center;gap:8px">' +
        '<span style="font-size:16px;line-height:1">' + r.flag + '</span>' +
        '<div>' +
          '<p style="font-family:Manrope;font-size:12px;font-weight:700;color:var(--nm-on-surface);line-height:1.3">' + r.period + '</p>' +
          '<p style="font-size:10px;color:var(--nm-text-3);margin-top:1px">' + r.mode + '</p>' +
        '</div>' +
      '</div>';
      // bar
      html += '<div style="height:14px;background:' + bgColor + ';border-radius:99px;overflow:hidden;position:relative">' +
        '<div style="height:100%;width:' + r.pct + '%;background:' + color + ';border-radius:99px;transition:width 0.3s"></div>' +
      '</div>';
      // %
      html += '<div style="font-family:Manrope;font-size:13px;font-weight:700;color:' + color + ';text-align:right">' + r.pct + '%</div>';
      html += '</div>';
    });
    // 평균 라인 (dashed) — 14 bars 가로질러서 표시
    html += '</div>';

    html += '</div>';

    // ───── RIGHT (4): 거점 + 위성 모델 ─────
    html += '<div class="nm-card nm-card-lg" style="display:flex;flex-direction:column">';
    html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">' +
      '<span class="material-symbols-outlined" style="color:var(--nm-primary)">hub</span>' +
      '<h4 style="font-family:Manrope;font-size:16px;font-weight:700;color:var(--nm-deep-indigo)">거점 + 위성 모델</h4>' +
    '</div>';

    // SVG 다이어그램
    html += '<div style="background:linear-gradient(135deg,#F5F3FF,#e6eeff);border-radius:12px;padding:24px;margin-bottom:18px;display:flex;justify-content:center">';
    html += '<svg viewBox="0 0 200 160" style="width:100%;max-width:220px;height:auto">' +
      // 연결선 (dashed)
      '<line x1="100" y1="80" x2="40" y2="30" stroke="var(--nm-primary)" stroke-width="1.2" stroke-dasharray="3,3" opacity="0.5"/>' +
      '<line x1="100" y1="80" x2="170" y2="35" stroke="var(--nm-primary)" stroke-width="1.2" stroke-dasharray="3,3" opacity="0.5"/>' +
      '<line x1="100" y1="80" x2="30" y2="125" stroke="var(--nm-primary)" stroke-width="1.2" stroke-dasharray="3,3" opacity="0.5"/>' +
      '<line x1="100" y1="80" x2="175" y2="130" stroke="var(--nm-primary)" stroke-width="1.2" stroke-dasharray="3,3" opacity="0.5"/>' +
      // 위성 (작은 원)
      '<circle cx="40" cy="30" r="10" fill="#fff" stroke="var(--nm-secondary)" stroke-width="2"/>' +
      '<circle cx="170" cy="35" r="10" fill="#fff" stroke="var(--nm-secondary)" stroke-width="2"/>' +
      '<circle cx="30" cy="125" r="10" fill="#fff" stroke="var(--nm-secondary)" stroke-width="2"/>' +
      '<circle cx="175" cy="130" r="10" fill="#fff" stroke="var(--nm-secondary)" stroke-width="2"/>' +
      // 중앙 거점 (큰 원)
      '<circle cx="100" cy="80" r="28" fill="var(--nm-primary)" opacity="0.15"/>' +
      '<circle cx="100" cy="80" r="22" fill="var(--nm-primary)"/>' +
      '<text x="100" y="85" text-anchor="middle" font-family="Manrope" font-size="12" font-weight="700" fill="#fff">HUB</text>' +
      // 위성 라벨
      '<text x="40" y="15" text-anchor="middle" font-family="Inter" font-size="8" fill="var(--nm-text-3)">satellite</text>' +
      '<text x="170" y="20" text-anchor="middle" font-family="Inter" font-size="8" fill="var(--nm-text-3)">satellite</text>' +
      '<text x="30" y="148" text-anchor="middle" font-family="Inter" font-size="8" fill="var(--nm-text-3)">satellite</text>' +
      '<text x="175" y="153" text-anchor="middle" font-family="Inter" font-size="8" fill="var(--nm-text-3)">satellite</text>' +
    '</svg>';
    html += '</div>';

    // 3 항목
    var hubItems = [
      { icon:'apartment', label:'한 도시 최소', value:'2-4주 거점' },
      { icon:'explore',   label:'거점 안에서', value:'1-3박 위성' },
      { icon:'do_not_disturb_on', label:'이동 = 회복일', value:'매일 옮기지 X' },
    ];
    html += '<div style="display:flex;flex-direction:column;gap:10px">';
    hubItems.forEach(function(h) {
      html += '<div style="display:flex;align-items:center;gap:12px;padding:10px 12px;background:var(--nm-surface-container-low);border-radius:8px">' +
        '<span class="material-symbols-outlined" style="font-size:18px;color:var(--nm-primary)">' + h.icon + '</span>' +
        '<div style="flex:1">' +
          '<p style="font-size:11px;color:var(--nm-text-3)">' + h.label + '</p>' +
          '<p style="font-family:Manrope;font-size:13px;font-weight:700;color:var(--nm-deep-indigo)">' + h.value + '</p>' +
        '</div>' +
      '</div>';
    });
    html += '</div>';

    html += '</div>'; // /거점+위성

    html += '</div>'; // /8-4 split

    // ════════ SECTION 3 · 시간 구조 (full-width 3 카드) ════════
    html += '<section class="nm-card nm-card-lg" style="margin-bottom:32px">';
    html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">' +
      '<span class="material-symbols-outlined" style="color:var(--nm-primary)">schedule</span>' +
      '<h3 style="font-family:Manrope;font-size:18px;font-weight:700;color:var(--nm-on-surface)">시간 구조 · 일 70 / 관광 30</h3>' +
    '</div>';
    html += '<p style="font-size:13px;color:var(--nm-text-2);margin-bottom:24px">한 주 안에서 일·관광·회복 3 모드 분리. 블록 사수가 핵심.</p>';

    html += '<div class="nm-grid nm-grid-3" style="gap:18px">';

    // 평일
    html += '<div style="padding:24px;border-radius:12px;background:#F5F3FF;border-top:3px solid var(--nm-primary)">' +
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">' +
        '<span class="material-symbols-outlined" style="font-size:20px;color:var(--nm-primary)">calendar_today</span>' +
        '<h4 style="font-family:Manrope;font-size:14px;font-weight:700;color:var(--nm-primary)">평일 (월-금)</h4>' +
      '</div>' +
      '<div style="display:flex;flex-direction:column;gap:10px">' +
        '<div><p style="font-size:10px;color:var(--nm-text-3);font-weight:600;text-transform:uppercase;letter-spacing:0.06em">09-13시</p><p style="font-family:Manrope;font-size:13px;font-weight:700;color:var(--nm-deep-indigo);margin-top:2px">글 작업 4시간 (블록 사수)</p></div>' +
        '<div><p style="font-size:10px;color:var(--nm-text-3);font-weight:600;text-transform:uppercase;letter-spacing:0.06em">13-14시</p><p style="font-size:13px;color:var(--nm-text-2);margin-top:2px">점심</p></div>' +
        '<div><p style="font-size:10px;color:var(--nm-text-3);font-weight:600;text-transform:uppercase;letter-spacing:0.06em">14-17시</p><p style="font-size:13px;color:var(--nm-text-2);margin-top:2px">현지 체험 · 카페 · 박물관 · 사람 만남</p></div>' +
        '<div><p style="font-size:10px;color:var(--nm-text-3);font-weight:600;text-transform:uppercase;letter-spacing:0.06em">저녁</p><p style="font-size:13px;color:var(--nm-text-2);margin-top:2px">운동 + 휴식</p></div>' +
      '</div>' +
    '</div>';

    // 수요일 코딩
    html += '<div style="padding:24px;border-radius:12px;background:#e6eeff;border-top:3px solid var(--nm-secondary)">' +
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">' +
        '<span class="material-symbols-outlined" style="font-size:20px;color:var(--nm-secondary)">code</span>' +
        '<h4 style="font-family:Manrope;font-size:14px;font-weight:700;color:var(--nm-secondary)">수요일 = 코딩 풀데이</h4>' +
      '</div>' +
      '<div style="display:flex;flex-direction:column;gap:10px">' +
        '<div><p style="font-size:10px;color:var(--nm-text-3);font-weight:600;text-transform:uppercase;letter-spacing:0.06em">오전·오후</p><p style="font-family:Manrope;font-size:13px;font-weight:700;color:var(--nm-deep-indigo);margin-top:2px">8시간 코딩</p></div>' +
        '<div><p style="font-size:10px;color:var(--nm-text-3);font-weight:600;text-transform:uppercase;letter-spacing:0.06em">목표</p><p style="font-size:13px;color:var(--nm-text-2);margin-top:2px">IP 도구 + 디지털 제품 개발</p></div>' +
        '<div style="margin-top:8px;padding:10px;background:rgba(86,84,168,0.1);border-radius:8px"><p style="font-size:11px;color:var(--nm-secondary);font-weight:600;line-height:1.5">주 1일 · 분석가 N IP 트랙 가속</p></div>' +
      '</div>' +
    '</div>';

    // 주말
    html += '<div style="padding:24px;border-radius:12px;background:#ffe0cd;border-top:3px solid #7d3d00">' +
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">' +
        '<span class="material-symbols-outlined" style="font-size:20px;color:#7d3d00">weekend</span>' +
        '<h4 style="font-family:Manrope;font-size:14px;font-weight:700;color:#7d3d00">주말</h4>' +
      '</div>' +
      '<div style="display:flex;flex-direction:column;gap:10px">' +
        '<div><p style="font-size:10px;color:var(--nm-text-3);font-weight:600;text-transform:uppercase;letter-spacing:0.06em">토요일</p><p style="font-family:Manrope;font-size:13px;font-weight:700;color:#5a2900;margin-top:2px">위성 여행 또는 깊은 휴식</p></div>' +
        '<div><p style="font-size:10px;color:var(--nm-text-3);font-weight:600;text-transform:uppercase;letter-spacing:0.06em">일요일</p><p style="font-family:Manrope;font-size:13px;font-weight:700;color:#5a2900;margin-top:2px">휴식 + 다음 주 계획</p></div>' +
        '<div style="margin-top:8px;padding:10px;background:rgba(125,61,0,0.1);border-radius:8px"><p style="font-size:11px;color:#7d3d00;font-weight:600;line-height:1.5">관광 = 일 X · 충전 우선</p></div>' +
      '</div>' +
    '</div>';

    html += '</div>';
    html += '</section>';

    // ════════ SECTION 4 · 6/6 split — 산출량 + 이동일 ════════
    html += '<div class="nm-grid nm-grid-2" style="gap:24px;margin-bottom:32px">';

    // 산출량
    html += '<div class="nm-card nm-card-lg">';
    html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:18px">' +
      '<span class="material-symbols-outlined" style="color:var(--nm-primary)">edit_note</span>' +
      '<h3 style="font-family:Manrope;font-size:18px;font-weight:700;color:var(--nm-on-surface)">산출량 · 주 단위 관리</h3>' +
    '</div>';
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">';
    var outputItems = [
      { label:'글 초안',      value:'주 2-3편', note:'월 8-12편',   icon:'edit',         color:'var(--nm-primary)' },
      { label:'코딩 풀데이',  value:'주 1회',   note:'월 4-5회',    icon:'code',         color:'var(--nm-secondary)' },
      { label:'메일리 발행',  value:'격주 / 1회', note:'2-4편/월',  icon:'mail',         color:'#7d3d00' },
      { label:'디지털 제품',  value:'분기',    note:'큰 단위 출시', icon:'inventory_2', color:'#15803d' },
    ];
    outputItems.forEach(function(o) {
      html += '<div style="padding:16px;border-radius:10px;background:var(--nm-surface-container-low);border-left:3px solid ' + o.color + '">' +
        '<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">' +
          '<span class="material-symbols-outlined" style="font-size:14px;color:' + o.color + '">' + o.icon + '</span>' +
          '<p style="font-size:11px;color:var(--nm-text-3);font-weight:600">' + o.label + '</p>' +
        '</div>' +
        '<p style="font-family:Manrope;font-size:16px;font-weight:700;color:var(--nm-deep-indigo);line-height:1.2">' + o.value + '</p>' +
        '<p style="font-size:10px;color:var(--nm-text-3);margin-top:4px">' + o.note + '</p>' +
      '</div>';
    });
    html += '</div>';
    html += '</div>';

    // 이동일 = 버리는 날
    html += '<div class="nm-card nm-card-lg" style="background:linear-gradient(135deg,#fff7ed,#ffe0cd);position:relative;overflow:hidden">';
    html += '<div style="position:absolute;bottom:-30px;right:-30px;width:140px;height:140px;background:#7d3d00;opacity:0.08;border-radius:50%;filter:blur(30px)"></div>';
    html += '<div style="position:relative;z-index:1">';
    html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:18px">' +
      '<span class="material-symbols-outlined" style="color:#7d3d00">flight</span>' +
      '<h3 style="font-family:Manrope;font-size:18px;font-weight:700;color:#5a2900">이동일 = 버리는 날</h3>' +
    '</div>';
    html += '<div style="font-family:Manrope;font-size:42px;font-weight:800;color:#7d3d00;line-height:1;margin-bottom:8px">월 1-2일</div>';
    html += '<p style="font-size:12px;color:#5a2900;font-weight:600;margin-bottom:20px">자연스러운 회복일 · 죄책감 없이 인정</p>';
    html += '<div style="display:flex;flex-direction:column;gap:10px">';
    var moveItems = [
      { icon:'flight_takeoff', text:'도시 → 도시 이동일 = 일 X, 관광 X' },
      { icon:'self_improvement', text:'회복일로 인정 (글·코딩 시도 X)' },
      { icon:'event_repeat', text:'한 달 1-2일 발생은 자연스러움' },
    ];
    moveItems.forEach(function(m) {
      html += '<div style="display:flex;gap:10px;align-items:flex-start;padding:10px;background:rgba(255,255,255,0.6);border-radius:8px">' +
        '<span class="material-symbols-outlined" style="font-size:18px;color:#7d3d00;flex-shrink:0">' + m.icon + '</span>' +
        '<p style="font-size:13px;color:#5a2900;line-height:1.5">' + m.text + '</p>' +
      '</div>';
    });
    html += '</div>';
    html += '</div>';
    html += '</div>';

    html += '</div>'; // /6-6 split

    // ════════ SECTION 5 · 가족 연락 (full-width, lavender bg) ════════
    html += '<div class="nm-card nm-card-lg" style="background:linear-gradient(135deg,#F5F3FF,#e2dfff);position:relative;overflow:hidden">';
    html += '<div style="position:absolute;top:-40px;right:-40px;width:180px;height:180px;background:var(--nm-primary);opacity:0.1;border-radius:50%;filter:blur(40px)"></div>';
    html += '<div style="position:relative;z-index:1;display:flex;gap:32px;flex-wrap:wrap;align-items:center;justify-content:space-between">';

    html += '<div style="flex:1;min-width:280px">';
    html += '<div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">' +
      '<span class="material-symbols-outlined" style="color:var(--nm-primary)">family_restroom</span>' +
      '<h3 style="font-family:Manrope;font-size:18px;font-weight:700;color:var(--nm-deep-indigo)">가족 연락 룰</h3>' +
    '</div>';
    html += '<div style="display:flex;flex-direction:column;gap:12px">';
    var familyItems = [
      { icon:'videocam',  title:'매주 화상통화 1회',    note:'엄마·아빠 · 요일 고정' },
      { icon:'chat',      title:'매일 짧은 메신저',     note:'인증샷 위주 · 부담 X' },
      { icon:'event_available', title:'엄마 합류 시기 공유', note:'2028.9 스칸디 / 12 호바트 / 2029.3 NZ' },
    ];
    familyItems.forEach(function(f) {
      html += '<div style="display:flex;gap:12px;align-items:flex-start">' +
        '<div style="width:32px;height:32px;border-radius:8px;background:rgba(124,58,237,0.12);display:flex;align-items:center;justify-content:center;flex-shrink:0">' +
          '<span class="material-symbols-outlined" style="font-size:18px;color:var(--nm-primary)">' + f.icon + '</span>' +
        '</div>' +
        '<div>' +
          '<p style="font-family:Manrope;font-size:14px;font-weight:700;color:var(--nm-on-surface)">' + f.title + '</p>' +
          '<p style="font-size:12px;color:var(--nm-text-2);margin-top:2px">' + f.note + '</p>' +
        '</div>' +
      '</div>';
    });
    html += '</div>';
    html += '</div>';

    // 버튼 → Voyage 이동
    html += '<button onclick="NOMAD_PAGES.go(\'nomad-voyage\')" style="padding:14px 24px;background:var(--nm-deep-indigo);color:#fff;border:none;border-radius:10px;font-family:Manrope;font-size:13px;font-weight:700;cursor:pointer;transition:transform 0.15s;display:flex;align-items:center;gap:8px;flex-shrink:0" onmouseover="this.style.transform=\'translateY(-2px)\'" onmouseout="this.style.transform=\'none\'">' +
      '<span class="material-symbols-outlined" style="font-size:18px">explore</span>' +
      '엄마 합류 시기 후보 보기' +
    '</button>';

    html += '</div>';
    html += '</div>';

    return html;
  }
  registerPage('nomad-principles', renderPrinciples);

  // ════════════════════════════════════════════════════════════════════
  // 체크리스트 시스템 (Firebase + localStorage 양방향 동기화)
  // 컬렉션: appSettings/doc('nomadChecks') → { visa_docs:{}, actions:{}, packing:{} }
  // ════════════════════════════════════════════════════════════════════
  var _nomadChecks = {}; // 메모리 캐시: { 'visa_docs': {'0-0':true, ...}, ... }
  var _nomadChecksLoaded = false;

  function _loadChecksFromCache() {
    try {
      var raw = localStorage.getItem('nomad_checks_cache');
      if (raw) _nomadChecks = JSON.parse(raw) || {};
    } catch(e){ _nomadChecks = {}; }
  }
  function _saveChecksToCache() {
    try { localStorage.setItem('nomad_checks_cache', JSON.stringify(_nomadChecks)); } catch(e){}
  }
  async function _loadChecksFromFirebase() {
    if (typeof db === 'undefined') return;
    try {
      var doc = await db.collection('appSettings').doc('nomadChecks').get();
      if (doc.exists) {
        var data = doc.data() || {};
        // Firebase 값 우선 (다기기 동기화)
        _nomadChecks = data.checks || {};
        _saveChecksToCache();
        // 현재 체크리스트 페이지 보이는 중이면 즉시 재렌더 (다기기 동기화 반영)
        var content = document.getElementById('nomad-content');
        if (content && content.querySelector('.nm-checklist') && currentSubPage) {
          go(currentSubPage);
        }
      }
    } catch(e) { console.warn('[nomad checks] FB load 실패:', e); }
  }
  async function _saveChecksToFirebase() {
    if (typeof db === 'undefined') return;
    try {
      await db.collection('appSettings').doc('nomadChecks').set({
        checks: _nomadChecks,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch(e) { console.warn('[nomad checks] FB save 실패:', e); }
  }

  // 초기 로드 (Phase 5에서 호출)
  function initChecks() {
    if (_nomadChecksLoaded) return;
    _nomadChecksLoaded = true;
    _loadChecksFromCache();
    // 백그라운드 Firebase 동기화
    setTimeout(_loadChecksFromFirebase, 100);
  }

  // 토글 (메모리 + localStorage 즉시 + Firebase 백그라운드)
  function toggleCheck(storageKey, itemKey) {
    if (!_nomadChecks[storageKey]) _nomadChecks[storageKey] = {};
    _nomadChecks[storageKey][itemKey] = !_nomadChecks[storageKey][itemKey];
    _saveChecksToCache();
    // UI 즉시 업데이트
    var li = document.querySelector('.nm-checklist li[data-key="' + storageKey + ':' + itemKey + '"]');
    if (li) li.classList.toggle('is-checked', _nomadChecks[storageKey][itemKey]);
    // 진행률 업데이트
    _updateChecklistProgress(storageKey);
    // Firebase 백그라운드 저장 (debounce 없이 즉시 — 사용자 신뢰성 우선)
    _saveChecksToFirebase();
  }
  window._nomadToggleCheck = toggleCheck;

  function _updateChecklistProgress(storageKey) {
    // 모든 wrap (per-category + 통합) 다 업데이트
    var wraps = document.querySelectorAll('.nm-checklist-wrap[data-key="' + storageKey + '"]');
    wraps.forEach(function(listEl) {
      var items = listEl.querySelectorAll('.nm-checklist li');
      var total = items.length;
      var done = 0;
      items.forEach(function(li) { if (li.classList.contains('is-checked')) done++; });
      var pct = total > 0 ? Math.round((done/total) * 100) : 0;
      var labelEl = listEl.querySelector('.nm-check-progress-label');
      var barEl = listEl.querySelector('.nm-check-progress-bar');
      if (labelEl) labelEl.innerHTML = '<span>' + done + ' / ' + total + ' 완료</span><span>' + pct + '%</span>';
      if (barEl) barEl.style.width = pct + '%';
      var countEl = listEl.querySelector('.nm-check-count-inline');
      if (countEl) countEl.textContent = done + ' / ' + total;
    });
    // 글로벌 readiness 인디케이터 (Bento Header용)
    var globals = document.querySelectorAll('.nm-readiness-global[data-key="' + storageKey + '"]');
    globals.forEach(function(g) {
      var totalAll = parseInt(g.getAttribute('data-total')) || 0;
      var saved = _nomadChecks[storageKey] || {};
      var doneAll = Object.keys(saved).filter(function(k){ return saved[k]; }).length;
      var pctAll = totalAll > 0 ? Math.round((doneAll/totalAll) * 100) : 0;
      var pctEl = g.querySelector('.nm-readiness-pct');
      var doneEl = g.querySelector('.nm-readiness-done');
      var pendingEl = g.querySelector('.nm-readiness-pending');
      var barEl = g.querySelector('.nm-readiness-bar');
      if (pctEl) pctEl.textContent = pctAll + '%';
      if (doneEl) doneEl.textContent = doneAll + ' Completed';
      if (pendingEl) pendingEl.textContent = (totalAll - doneAll) + ' Pending';
      if (barEl) barEl.style.width = pctAll + '%';
    });
  }

  // 체크리스트 빌더
  function buildChecklist(storageKey, title, groups) {
    var saved = _nomadChecks[storageKey] || {};
    var total = groups.reduce(function(a,g){ return a + (g.items||[]).length; }, 0);
    var done = 0;
    var html = '<div class="nm-card nm-checklist-wrap" data-key="' + storageKey + '">';
    html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">' +
      '<span class="material-symbols-outlined" style="color:var(--nm-primary)">fact_check</span>' +
      '<h3 class="nm-headline-md">' + title + '</h3>' +
    '</div>';
    // 진행률
    html += '<div class="nm-check-progress-label" style="display:flex;justify-content:space-between;font-size:12px;color:var(--nm-text-3);margin-bottom:6px"></div>';
    html += '<div style="height:6px;background:var(--nm-surface-container);border-radius:99px;overflow:hidden;margin-bottom:24px">' +
      '<div class="nm-check-progress-bar" style="height:100%;background:var(--nm-primary);width:0%;transition:width 0.2s"></div>' +
    '</div>';
    groups.forEach(function(group, gi) {
      var groupName = group.cat || group.when || ('Group ' + gi);
      html += '<div style="margin-bottom:20px">';
      html += '<div style="font-family:Manrope;font-size:11px;font-weight:700;color:var(--nm-text-3);text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px;padding:6px 0;border-bottom:1px solid #f1f5f9">' + groupName + '</div>';
      html += '<ul class="nm-checklist">';
      (group.items || []).forEach(function(item, ii) {
        var itemKey = gi + '-' + ii;
        var isChecked = !!saved[itemKey];
        if (isChecked) done++;
        html += '<li class="' + (isChecked ? 'is-checked' : '') + '" data-key="' + storageKey + ':' + itemKey + '" onclick="_nomadToggleCheck(\'' + storageKey + '\', \'' + itemKey + '\')">' +
          '<span class="nm-checkbox"></span>' +
          '<span>' + item + '</span>' +
        '</li>';
      });
      html += '</ul>';
      html += '</div>';
    });
    // 초기 진행률 채우기 (script 즉시 실행)
    var pct = total > 0 ? Math.round((done/total) * 100) : 0;
    html = html.replace('class="nm-check-progress-label" style="display:flex;justify-content:space-between;font-size:12px;color:var(--nm-text-3);margin-bottom:6px"></div>',
      'class="nm-check-progress-label" style="display:flex;justify-content:space-between;font-size:12px;color:var(--nm-text-3);margin-bottom:6px"><span>' + done + ' / ' + total + ' 완료</span><span>' + pct + '%</span></div>');
    html = html.replace('class="nm-check-progress-bar" style="height:100%;background:var(--nm-primary);width:0%;transition:width 0.2s"',
      'class="nm-check-progress-bar" style="height:100%;background:var(--nm-primary);width:' + pct + '%;transition:width 0.2s"');
    html += '</div>';
    return html;
  }

  // ──────── Visa & Documents 페이지 ────────
  // 국가별 국기 이모지 매핑
  function visaCountryFlag(country) {
    if (country.indexOf('포르투갈') >= 0) return '🇵🇹';
    if (country.indexOf('아일랜드') >= 0) return '🇮🇪';
    if (country.indexOf('셰겐') >= 0) return '🇪🇺';
    if (country.indexOf('호주') >= 0) return '🇦🇺';
    if (country.indexOf('뉴질랜드') >= 0) return '🇳🇿';
    if (country.indexOf('미국') >= 0) return '🇺🇸';
    if (country.indexOf('캐나다') >= 0) return '🇨🇦';
    return '🌍';
  }

  // VISA_DOCS 카테고리별 아이콘
  function visaDocsCatIcon(cat) {
    if (cat.indexOf('신분') >= 0) return 'badge';
    if (cat.indexOf('공식') >= 0 || cat.indexOf('증명서') >= 0) return 'description';
    if (cat.indexOf('금융') >= 0) return 'payments';
    if (cat.indexOf('의료') >= 0 || cat.indexOf('건강') >= 0) return 'medical_services';
    if (cat.indexOf('백업') >= 0) return 'cloud_upload';
    return 'fact_check';
  }

  // 단일 카테고리 체크박스 카드 (Stitch 디자인)
  function buildVisaCategoryCard(storageKey, group, gi, isFullWidth) {
    var saved = _nomadChecks[storageKey] || {};
    var items = group.items || [];
    var total = items.length;
    var done = 0;
    items.forEach(function(_, ii) { if (saved[gi + '-' + ii]) done++; });
    var pct = total > 0 ? Math.round((done/total) * 100) : 0;
    var icon = visaDocsCatIcon(group.cat);
    var gridSpan = isFullWidth ? 'grid-column:1 / -1;' : '';

    var html = '<section class="nm-card nm-checklist-wrap" data-key="' + storageKey + '" style="padding:28px;' + gridSpan + '">';
    // 헤더: lavender circle 아이콘 + 카테고리 + 진행률
    html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">';
    html += '<div style="display:flex;align-items:center;gap:12px">' +
      '<div style="width:40px;height:40px;border-radius:50%;background:#F5F3FF;display:flex;align-items:center;justify-content:center;color:var(--nm-primary);flex-shrink:0">' +
        '<span class="material-symbols-outlined" style="font-size:22px">' + icon + '</span>' +
      '</div>' +
      '<h3 style="font-family:Manrope;font-size:17px;font-weight:700;color:var(--nm-on-surface)">' + group.cat + '</h3>' +
    '</div>';
    html += '<span class="nm-check-count-inline" style="font-family:Manrope;font-size:12px;font-weight:600;color:var(--nm-text-3);padding:5px 10px;background:var(--nm-surface-container-low);border-radius:99px">' + done + ' / ' + total + '</span>';
    html += '</div>';

    // (per-card 진행률 라벨 + 바 — _updateChecklistProgress가 자동 업데이트)
    html += '<div class="nm-check-progress-label" style="display:none"></div>';
    html += '<div style="height:4px;background:var(--nm-surface-container);border-radius:99px;overflow:hidden;margin-bottom:18px">' +
      '<div class="nm-check-progress-bar" style="height:100%;background:var(--nm-primary);width:' + pct + '%;transition:width 0.2s"></div>' +
    '</div>';

    // 백업 카테고리: 특수 레이아웃 (Cloud Sync Status + 체크박스 2-col)
    if (isFullWidth && group.cat.indexOf('백업') >= 0) {
      html += '<div style="display:grid;grid-template-columns:1fr 2fr;gap:18px">';
      // 왼쪽: Cloud Sync Status 점선 카드
      html += '<div style="padding:24px;background:var(--nm-surface-container-low);border-radius:14px;border:2px dashed var(--nm-on-surface-variant);display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center">' +
        '<span class="material-symbols-outlined" style="font-size:36px;color:var(--nm-primary);margin-bottom:8px">upload_file</span>' +
        '<p style="font-family:Manrope;font-size:13px;font-weight:700;color:var(--nm-deep-indigo);margin-bottom:4px">Cloud Sync Status</p>' +
        '<p style="font-size:11px;color:var(--nm-text-3);line-height:1.5">Google Drive · Naver · USB 다중 백업 권장</p>' +
      '</div>';
      // 오른쪽: 체크박스 리스트
      html += '<ul class="nm-checklist" style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:6px">';
      items.forEach(function(item, ii) {
        var itemKey = gi + '-' + ii;
        var isChecked = !!saved[itemKey];
        html += '<li class="' + (isChecked ? 'is-checked' : '') + '" data-key="' + storageKey + ':' + itemKey + '" onclick="_nomadToggleCheck(\'' + storageKey + '\', \'' + itemKey + '\')" style="cursor:pointer">' +
          '<span class="nm-checkbox"></span>' +
          '<span>' + item + '</span>' +
        '</li>';
      });
      html += '</ul>';
      html += '</div>';
    } else {
      // 일반 카테고리: 단일 컬럼 체크박스 리스트
      html += '<ul class="nm-checklist" style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:6px">';
      items.forEach(function(item, ii) {
        var itemKey = gi + '-' + ii;
        var isChecked = !!saved[itemKey];
        html += '<li class="' + (isChecked ? 'is-checked' : '') + '" data-key="' + storageKey + ':' + itemKey + '" onclick="_nomadToggleCheck(\'' + storageKey + '\', \'' + itemKey + '\')" style="cursor:pointer">' +
          '<span class="nm-checkbox"></span>' +
          '<span>' + item + '</span>' +
        '</li>';
      });
      html += '</ul>';
    }

    html += '</section>';
    return html;
  }

  function renderVisa() {
    initChecks();
    var html = '';

    // 글로벌 readiness 계산
    var visaDocs = DATA.VISA_DOCS || [];
    var totalAll = visaDocs.reduce(function(a,g){ return a + (g.items||[]).length; }, 0);
    var saved = _nomadChecks['visa_docs'] || {};
    var doneAll = 0;
    visaDocs.forEach(function(g, gi) {
      (g.items || []).forEach(function(_, ii) {
        if (saved[gi + '-' + ii]) doneAll++;
      });
    });
    var readinessPct = totalAll > 0 ? Math.round((doneAll/totalAll) * 100) : 0;
    var pending = totalAll - doneAll;

    // 출국까지 D-Day
    var dDay = daysBetween(todayYMD(), DEPARTURE_DATE);
    var dDayDisplay = dDay > 0 ? 'D-' + dDay : '🎉 출국 완료';

    // Page Header
    html += pageHeader('Visa & Documents', '비자 · 서류 체크리스트',
      '셰겐 84/90일 한도 안 · 워홀 베이스캠프 · 25개 서류 체크');

    // ════════ SECTION 1 · Bento Header (8/4 split) ════════
    html += '<div class="nm-grid nm-grid-2-1" style="margin-bottom:32px">';

    // ───── LEFT (8): Current Status · Readiness ─────
    html += '<div class="nm-card nm-readiness-global" data-key="visa_docs" data-total="' + totalAll + '" style="padding:36px;background:linear-gradient(135deg,#F5F3FF,#e2dfff);position:relative;overflow:hidden">';
    // 우상단 거대 article 아이콘 deco
    html += '<div style="position:absolute;right:-30px;bottom:-40px;opacity:0.12;pointer-events:none">' +
      '<span class="material-symbols-outlined" style="font-size:200px;color:var(--nm-primary)">article</span>' +
    '</div>';
    html += '<div style="position:relative;z-index:1">';
    html += '<p style="font-family:Manrope;font-size:11px;font-weight:700;color:var(--nm-primary);text-transform:uppercase;letter-spacing:0.12em;margin-bottom:10px">Current Status</p>';
    // 큰 Readiness %
    html += '<div style="display:flex;align-items:baseline;gap:10px;margin-bottom:18px">' +
      '<h2 class="nm-readiness-pct" style="font-family:Manrope;font-size:52px;font-weight:800;color:var(--nm-deep-indigo);line-height:1">' + readinessPct + '%</h2>' +
      '<span style="font-size:14px;color:var(--nm-text-2);font-weight:600">Readiness</span>' +
    '</div>';
    // progress bar
    html += '<div style="height:6px;background:rgba(255,255,255,0.5);border-radius:99px;overflow:hidden;margin-bottom:20px;max-width:480px">' +
      '<div class="nm-readiness-bar" style="height:100%;width:' + readinessPct + '%;background:var(--nm-primary);border-radius:99px;transition:width 0.3s"></div>' +
    '</div>';
    // pill 2개
    html += '<div style="display:flex;gap:10px;flex-wrap:wrap">';
    html += '<span style="background:#fff;color:var(--nm-deep-indigo);padding:8px 16px;border-radius:99px;font-family:Manrope;font-size:12px;font-weight:700;display:flex;align-items:center;gap:6px;box-shadow:0 1px 3px rgba(0,0,0,0.05)">' +
      '<span class="material-symbols-outlined" style="font-size:14px;color:#15803d">check_circle</span>' +
      '<span class="nm-readiness-done">' + doneAll + ' Completed</span>' +
    '</span>';
    html += '<span style="background:#fff;color:#b91c1c;padding:8px 16px;border-radius:99px;font-family:Manrope;font-size:12px;font-weight:700;display:flex;align-items:center;gap:6px;box-shadow:0 1px 3px rgba(0,0,0,0.05)">' +
      '<span class="material-symbols-outlined" style="font-size:14px">warning</span>' +
      '<span class="nm-readiness-pending">' + pending + ' Pending</span>' +
    '</span>';
    html += '</div>';
    html += '</div>';
    html += '</div>';

    // ───── RIGHT (4): Next Renewal (deep-indigo bg) ─────
    html += '<div class="nm-card" style="padding:36px;background:var(--nm-deep-indigo);color:#fff;position:relative;overflow:hidden;display:flex;flex-direction:column;justify-content:space-between">';
    html += '<div style="position:absolute;bottom:-30px;right:-30px;width:140px;height:140px;background:var(--nm-primary);opacity:0.18;border-radius:50%;filter:blur(30px)"></div>';
    html += '<div style="position:relative;z-index:1">';
    html += '<p style="font-family:Manrope;font-size:11px;font-weight:700;color:#d2bbff;text-transform:uppercase;letter-spacing:0.12em;margin-bottom:10px">Next Critical Step</p>';
    html += '<h3 style="font-family:Manrope;font-size:22px;font-weight:700;color:#fff;margin-bottom:6px">여권 · 6개월 룰</h3>';
    html += '<p style="font-size:12px;color:rgba(234,221,255,0.85);margin-bottom:14px;line-height:1.5">출국 시 만료 6개월 이상 필수 · 2029.12 이후</p>';
    html += '<div style="display:flex;align-items:baseline;gap:6px">' +
      '<span style="font-family:Manrope;font-size:34px;font-weight:800;color:#eaddff;line-height:1">' + dDayDisplay + '</span>' +
      '<span style="font-size:11px;color:rgba(234,221,255,0.7)">until departure</span>' +
    '</div>';
    html += '</div>';
    // 버튼 → Actions
    html += '<button onclick="NOMAD_PAGES.go(\'nomad-actions\')" style="position:relative;z-index:1;margin-top:24px;width:100%;padding:14px;background:var(--nm-soft-accent);color:#fff;border:none;border-radius:10px;font-family:Manrope;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;transition:filter 0.15s" onmouseover="this.style.filter=\'brightness(1.1)\'" onmouseout="this.style.filter=\'none\'">' +
      'Action Items 보기' +
      '<span class="material-symbols-outlined" style="font-size:18px">arrow_forward</span>' +
    '</button>';
    html += '</div>';

    html += '</div>'; // /Bento Header

    // ════════ SECTION 2 · 1년 동선 비자 종합 (Visa Map · 카드 grid) ════════
    html += '<section class="nm-section" style="margin-bottom:32px">';
    html += '<div class="nm-section-head">' +
      '<h3 class="nm-headline-md" style="display:flex;align-items:center;gap:8px">' +
        '<span class="material-symbols-outlined" style="color:var(--nm-primary)">flight_takeoff</span>' +
        'Visa Map · 1년 동선 비자 종합' +
      '</h3>' +
      '<span class="nm-label-sm" style="color:var(--nm-text-3);text-transform:uppercase;letter-spacing:0.1em">7 영역</span>' +
    '</div>';
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px">';
    DATA.VISA_LIST.forEach(function(v) {
      var flag = visaCountryFlag(v.country);
      html += '<div class="nm-card" style="padding:22px;transition:transform 0.15s,box-shadow 0.15s;cursor:default" onmouseover="this.style.transform=\'translateY(-2px)\';this.style.boxShadow=\'0 8px 20px rgba(124,58,237,0.1)\'" onmouseout="this.style.transform=\'none\';this.style.boxShadow=\'none\'">';
      // 상단: 국기 + visa type pill
      html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:14px">' +
        '<span style="font-size:36px;line-height:1">' + flag + '</span>' +
        '<span style="padding:5px 11px;border-radius:99px;font-size:10px;font-weight:700;font-family:Manrope;' + visaPillClass(v.type) + '">' + v.type + '</span>' +
      '</div>';
      // 국가명 + 체류
      html += '<h4 style="font-family:Manrope;font-size:16px;font-weight:700;color:var(--nm-on-surface);margin-bottom:4px;line-height:1.3">' + v.country + '</h4>';
      html += '<p style="font-size:12px;color:var(--nm-primary);font-weight:600;margin-bottom:14px">체류 ' + v.stay + '</p>';
      // 신청 시점
      html += '<div style="display:flex;align-items:center;gap:6px;padding:8px 0;border-top:1px solid #f1f5f9;border-bottom:1px solid #f1f5f9;margin-bottom:10px">' +
        '<span class="material-symbols-outlined" style="font-size:14px;color:var(--nm-text-3)">calendar_today</span>' +
        '<span style="font-size:11px;color:var(--nm-text-2);font-weight:600">' + v.when + '</span>' +
      '</div>';
      // 비고
      html += '<p style="font-size:11px;color:var(--nm-text-3);line-height:1.5">' + v.note + '</p>';
      html += '</div>';
    });
    html += '</div>';
    html += '</section>';

    // ════════ SECTION 3 · 출국 전 서류 체크리스트 (Asymmetric 2-col + 백업 full) ════════
    html += '<section class="nm-section">';
    html += '<div class="nm-section-head">' +
      '<h3 class="nm-headline-md" style="display:flex;align-items:center;gap:8px">' +
        '<span class="material-symbols-outlined" style="color:var(--nm-primary)">fact_check</span>' +
        '출국 전 서류 체크리스트' +
      '</h3>' +
      '<span class="nm-label-sm" style="color:var(--nm-text-3);text-transform:uppercase;letter-spacing:0.1em">' + totalAll + ' 항목 · ' + visaDocs.length + ' 카테고리</span>' +
    '</div>';

    // 2-col grid (백업은 col-span-2)
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(360px,1fr));gap:20px">';
    visaDocs.forEach(function(g, gi) {
      var isFullWidth = (g.cat.indexOf('백업') >= 0);
      html += buildVisaCategoryCard('visa_docs', g, gi, isFullWidth);
    });
    html += '</div>';

    html += '</section>';

    return html;
  }
  registerPage('nomad-visa', renderVisa);

  // ──────── Working Holiday 페이지 (Stitch Magazine 디자인 · 탭 제거) ────────
  function renderWH() {
    var html = '';

    // 데이터
    var basicInfo = [
      { label:'정식 명칭', value:'한·포르투갈 워킹홀리데이 비자', icon:'verified' },
      { label:'유효 기간', value:'1년 (입국일부터)',           icon:'event' },
      { label:'나이 제한', value:'만 18-34세 (한·포르투갈 협정)', icon:'cake' },
      { label:'활동 가능', value:'관광·체류·일·학업 (정규직 X, 시간제 OK)', icon:'work' },
      { label:'연간 쿼터', value:'200명 (한국-포르투갈)',       icon:'groups' },
      { label:'비용',     value:'€90 (환율 변동)',           icon:'payments' },
      { label:'입출국',   value:'1년 안 자유롭게 다회 · 복수사증', icon:'flight' },
    ];

    var requiredDocs = [
      { name:'여권 사본',             from:'본인',           note:'만료 1년+ 여유' },
      { name:'여권 사진 35×45',       from:'사진관',         note:'6개월 이내' },
      { name:'비자신청서',            from:'대사관 양식',     note:'영문 또는 포어' },
      { name:'범죄경력회보서 영문',     from:'경찰서 / 정부24', note:'3개월 이내' },
      { name:'재정증빙 영문',          from:'주거래은행',     note:'€5,000 이상 권장' },
      { name:'항공권 사본',            from:'항공사',         note:'편도 또는 왕복' },
      { name:'여행자보험',            from:'보험사',         note:'€30,000+ 보장' },
      { name:'자기소개서',            from:'본인 작성',       note:'영문 또는 포어' },
      { name:'활동계획서',            from:'본인 작성',       note:'1년 활동 계획' },
    ];

    var processSteps = [
      { num:1, when:'2028.1-2',       stage:'사전 준비',        title:'서류 수집',                 text:'범죄경력회보서, 재정증빙, 보험, 자기소개서·활동계획서 작성' },
      { num:2, when:'2028.3',         stage:'대사관 방문 예약',   title:'이메일 사전 예약',           text:'주한 포르투갈 대사관 (서울 용산구 한남동) · 본인 직접 방문 필수' },
      { num:3, when:'2028.3-4',       stage:'신청 + 면접',      title:'대사관 방문 · 서류 제출',     text:'비자 수수료 €90 납부 · 간단 영어/포어 면접 가능' },
      { num:4, when:'2028.4-5',       stage:'발급 대기',        title:'처리 2-6주',               text:'여권 수령 후 비자 시작일 = 2028.6.9 입국일' },
      { num:5, when:'2028.6.9',       stage:'출국 + 입국',       title:'리스본 도착',              text:'비자 시작일 전 셰겐 입국 X (입국 거부 위험)' },
      { num:6, when:'입국 30일 이내', stage:'AIMA 등록',         title:'통합이주망명청',           text:'aima.gov.pt · (+351) 217-115-000', isFinal:true },
    ];

    // ════════ SECTION 1 · Hero Header ════════
    html += '<div class="nm-page-header" style="padding-bottom:32px;border-bottom:1px solid var(--nm-surface-container);margin-bottom:32px">';
    html += '<div style="display:flex;align-items:center;gap:8px;color:var(--nm-primary);font-family:Manrope;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.14em;margin-bottom:14px">' +
      '<span class="material-symbols-outlined" style="font-size:16px">flight_takeoff</span>' +
      'Immigration & Residency' +
    '</div>';
    html += '<h1 style="font-family:Manrope;font-size:36px;font-weight:800;color:var(--nm-deep-indigo);line-height:1.15;margin-bottom:14px">포르투갈 워킹홀리데이 · Visto de Residência</h1>';
    html += '<p style="font-size:15px;color:var(--nm-text-2);line-height:1.6;max-width:780px;margin-bottom:18px">1년 베이스캠프 비자 — 셰겐 카운트 회피 + 복수 입출국 + 노마드 거점 확보. 200명 연간 쿼터 안에서 누리 1년 동선의 핵심 인프라.</p>';
    // 누리 자격 inline pill
    html += '<div style="display:inline-flex;align-items:center;gap:8px;padding:8px 16px;background:#F5F3FF;color:var(--nm-primary);border-radius:99px;font-family:Manrope;font-size:13px;font-weight:700">' +
      '<span class="material-symbols-outlined" style="font-size:16px;color:#15803d">check_circle</span>' +
      '누리 1995.11.2생 · 2028.6 출국 시 만 32세 · 자격 OK' +
    '</div>';
    html += '</div>';

    // ════════ SECTION 2 · 8/4 split — Visa Overview + Quick Facts ════════
    html += '<div class="nm-grid nm-grid-2-1" style="margin-bottom:32px">';

    // LEFT: Visa Overview
    html += '<div class="nm-card nm-card-lg" style="display:flex;flex-direction:column;justify-content:space-between">';
    html += '<div>';
    html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px">' +
      '<h4 style="font-family:Manrope;font-size:18px;font-weight:700;color:var(--nm-on-surface)">Visa Overview</h4>' +
      '<span style="background:#F5F3FF;color:var(--nm-primary);padding:5px 12px;border-radius:99px;font-family:Manrope;font-size:11px;font-weight:700;letter-spacing:0.06em">ACTIVE TRACK</span>' +
    '</div>';
    // 3 metric inline
    html += '<div class="nm-grid nm-grid-3" style="gap:20px">';
    var overviewMetrics = [
      { label:'Duration',  value:'1년',     sub:'Non-renewable' },
      { label:'Entry',     value:'Multiple', sub:'복수사증 · 셰겐 액세스' },
      { label:'Processing', value:'2-6주',   sub:'대사관 → 발급 대기' },
    ];
    overviewMetrics.forEach(function(m) {
      html += '<div>' +
        '<p style="font-size:11px;color:var(--nm-text-3);font-weight:600;margin-bottom:4px;text-transform:uppercase;letter-spacing:0.06em">' + m.label + '</p>' +
        '<p style="font-family:Manrope;font-size:22px;font-weight:700;color:var(--nm-deep-indigo)">' + m.value + '</p>' +
        '<p style="font-size:11px;color:var(--nm-text-3);margin-top:2px">' + m.sub + '</p>' +
      '</div>';
    });
    html += '</div>';
    html += '</div>';
    // 하단 info card
    html += '<div style="margin-top:32px;padding:18px 20px;background:#F5F3FF;border-radius:12px;display:flex;align-items:flex-start;gap:14px">' +
      '<div style="width:36px;height:36px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 1px 3px rgba(0,0,0,0.05)">' +
        '<span class="material-symbols-outlined" style="font-size:18px;color:var(--nm-primary)">info</span>' +
      '</div>' +
      '<p style="font-size:13px;color:var(--nm-text-2);line-height:1.6;font-style:italic">"워홀 ≠ D7 비자. 월 수입 증명이 필요 없고, <strong style="color:var(--nm-deep-indigo);font-style:normal">일시금 재정증빙 €5,000만</strong> 있으면 됨. 1년 베이스캠프 + 셰겐 회피 + 복수 입출국 = 노마드 핵심 도구."</p>' +
    '</div>';
    html += '</div>';

    // RIGHT: Quick Facts (deep-indigo)
    html += '<div class="nm-card nm-card-lg" style="background:var(--nm-deep-indigo);color:#fff;position:relative;overflow:hidden;display:flex;flex-direction:column">';
    html += '<div style="position:absolute;top:-40px;right:-40px;width:180px;height:180px;background:var(--nm-primary);opacity:0.2;border-radius:50%;filter:blur(40px)"></div>';
    html += '<div style="position:relative;z-index:1;flex:1;display:flex;flex-direction:column;justify-content:space-between">';
    html += '<div>';
    html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:24px">' +
      '<span class="material-symbols-outlined" style="color:#eaddff">flag</span>' +
      '<h4 style="font-family:Manrope;font-size:17px;font-weight:700;color:#fff">Quick Facts</h4>' +
    '</div>';
    // 큰 숫자 200
    html += '<div style="text-align:center;padding:14px 0 20px">' +
      '<p style="font-family:Manrope;font-size:64px;font-weight:800;color:#eaddff;line-height:1">200</p>' +
      '<p style="font-size:10px;color:rgba(234,221,255,0.7);text-transform:uppercase;letter-spacing:0.12em;margin-top:4px;font-weight:700">annual quota · 한·포 협정</p>' +
    '</div>';
    // 추가 stats
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;padding-top:18px;border-top:1px solid rgba(255,255,255,0.1)">';
    html += '<div style="text-align:center"><p style="font-family:Manrope;font-size:20px;font-weight:700;color:#fff">€90</p><p style="font-size:10px;color:rgba(234,221,255,0.7);margin-top:2px">비자 수수료</p></div>';
    html += '<div style="text-align:center"><p style="font-family:Manrope;font-size:20px;font-weight:700;color:#fff">18-34</p><p style="font-size:10px;color:rgba(234,221,255,0.7);margin-top:2px">자격 연령</p></div>';
    html += '</div>';
    html += '</div>';
    // 버튼
    html += '<button onclick="NOMAD_PAGES.go(\'nomad-visa\')" style="margin-top:24px;width:100%;padding:12px;background:#fff;color:var(--nm-deep-indigo);border:none;border-radius:10px;font-family:Manrope;font-size:13px;font-weight:700;cursor:pointer;transition:background 0.15s;display:flex;align-items:center;justify-content:center;gap:8px" onmouseover="this.style.background=\'#eaddff\'" onmouseout="this.style.background=\'#fff\'">' +
      '전체 비자 종합 보기' +
      '<span class="material-symbols-outlined" style="font-size:18px">arrow_forward</span>' +
    '</button>';
    html += '</div>';
    html += '</div>';

    html += '</div>'; // /Visa Overview + Quick Facts

    // ════════ SECTION 3 · Basic Info (7 metric grid full-width) ════════
    html += '<section class="nm-card nm-card-lg" style="margin-bottom:32px">';
    html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:24px">' +
      '<div style="display:flex;align-items:center;gap:10px">' +
        '<span class="material-symbols-outlined" style="color:var(--nm-primary)">info</span>' +
        '<h3 style="font-family:Manrope;font-size:18px;font-weight:700;color:var(--nm-on-surface)">Basic Info</h3>' +
      '</div>' +
      '<span style="font-size:11px;color:var(--nm-text-3);text-transform:uppercase;letter-spacing:0.1em;font-weight:600">한·포르투갈 협정 · 7 항목</span>' +
    '</div>';
    html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:14px">';
    basicInfo.forEach(function(b) {
      html += '<div style="padding:18px;border-radius:10px;background:var(--nm-surface-container-low);border-left:3px solid var(--nm-primary)">';
      html += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">' +
        '<span class="material-symbols-outlined" style="font-size:16px;color:var(--nm-primary)">' + b.icon + '</span>' +
        '<p style="font-size:10px;color:var(--nm-text-3);text-transform:uppercase;letter-spacing:0.08em;font-weight:700">' + b.label + '</p>' +
      '</div>';
      html += '<p style="font-family:Manrope;font-size:13px;font-weight:700;color:var(--nm-deep-indigo);line-height:1.4">' + b.value + '</p>';
      html += '</div>';
    });
    html += '</div>';
    html += '</section>';

    // ════════ SECTION 4 · 6/6 split — Required Documentation + Phased Strategy ════════
    html += '<div class="nm-grid nm-grid-2" style="gap:24px;margin-bottom:32px">';

    // LEFT: Required Documentation
    html += '<div class="nm-card nm-card-lg">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px">' +
      '<div style="display:flex;align-items:center;gap:8px">' +
        '<span class="material-symbols-outlined" style="color:var(--nm-primary)">description</span>' +
        '<h4 style="font-family:Manrope;font-size:18px;font-weight:700;color:var(--nm-on-surface)">Required Documentation</h4>' +
      '</div>' +
      '<span style="background:#F5F3FF;color:var(--nm-primary);padding:5px 11px;border-radius:99px;font-family:Manrope;font-size:11px;font-weight:700">9 docs</span>' +
    '</div>';
    html += '<ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px">';
    requiredDocs.forEach(function(d) {
      html += '<li style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:14px 16px;background:var(--nm-surface-container-low);border-radius:10px;border:1px solid transparent;transition:all 0.15s;cursor:default" onmouseover="this.style.background=\'#F5F3FF\';this.style.borderColor=\'var(--nm-primary-fixed)\';this.style.transform=\'translateX(3px)\'" onmouseout="this.style.background=\'var(--nm-surface-container-low)\';this.style.borderColor=\'transparent\';this.style.transform=\'none\'">';
      html += '<div style="display:flex;gap:12px;flex:1;min-width:0">' +
        '<div style="width:30px;height:30px;border-radius:7px;background:rgba(124,58,237,0.1);display:flex;align-items:center;justify-content:center;flex-shrink:0">' +
          '<span class="material-symbols-outlined" style="font-size:16px;color:var(--nm-primary)">description</span>' +
        '</div>' +
        '<div style="flex:1;min-width:0">' +
          '<p style="font-family:Manrope;font-size:13px;font-weight:700;color:var(--nm-on-surface);line-height:1.3">' + d.name + '</p>' +
          '<p style="font-size:11px;color:var(--nm-text-3);margin-top:2px">' + d.from + ' · ' + d.note + '</p>' +
        '</div>' +
      '</div>';
      html += '</li>';
    });
    html += '</ul>';
    html += '</div>';

    // RIGHT: Phased Strategy
    html += '<div class="nm-card nm-card-lg">';
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:24px">' +
      '<div style="display:flex;align-items:center;gap:8px">' +
        '<span class="material-symbols-outlined" style="color:var(--nm-primary)">timeline</span>' +
        '<h4 style="font-family:Manrope;font-size:18px;font-weight:700;color:var(--nm-on-surface)">Phased Strategy</h4>' +
      '</div>' +
      '<span style="background:#F5F3FF;color:var(--nm-primary);padding:5px 11px;border-radius:99px;font-family:Manrope;font-size:11px;font-weight:700">6 steps</span>' +
    '</div>';
    // 6 단계 timeline
    html += '<div style="position:relative">';
    html += '<div style="position:absolute;left:15px;top:0;bottom:0;width:2px;background:var(--nm-surface-container)"></div>';
    processSteps.forEach(function(s, i) {
      var isLast = (i === processSteps.length - 1);
      var stepBg = s.isFinal ? 'var(--nm-deep-indigo)' : 'var(--nm-primary)';
      var stepIcon = s.isFinal ? 'check_circle' : '';
      html += '<div style="position:relative;padding-left:48px;' + (isLast ? '' : 'padding-bottom:18px') + '">';
      html += '<div style="position:absolute;left:0;top:0;width:32px;height:32px;border-radius:50%;background:' + stepBg + ';color:#fff;display:flex;align-items:center;justify-content:center;font-family:Manrope;font-size:13px;font-weight:700;box-shadow:0 0 0 4px #fff,0 0 0 5px ' + stepBg + '">';
      if (stepIcon) html += '<span class="material-symbols-outlined" style="font-size:18px">' + stepIcon + '</span>';
      else html += s.num;
      html += '</div>';
      html += '<div style="padding-top:4px">';
      html += '<p style="font-family:Manrope;font-size:11px;font-weight:700;color:var(--nm-primary);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:4px">' + s.when + ' · ' + s.stage + '</p>';
      html += '<p style="font-family:Manrope;font-size:14px;font-weight:700;color:var(--nm-deep-indigo);margin-bottom:4px">' + s.title + '</p>';
      html += '<p style="font-size:12px;color:var(--nm-text-2);line-height:1.5">' + s.text + '</p>';
      html += '</div>';
      html += '</div>';
    });
    html += '</div>';
    html += '</div>';

    html += '</div>'; // /6-6 split

    // ════════ SECTION 5 · Strategic Advice (full-width, 1/3 + 2/3) ════════
    html += '<div class="nm-card nm-card-lg" style="background:linear-gradient(135deg,#F5F3FF,#e2dfff);position:relative;overflow:hidden">';
    html += '<div style="position:absolute;top:-50px;right:-50px;width:200px;height:200px;background:var(--nm-primary);opacity:0.1;border-radius:50%;filter:blur(50px)"></div>';
    html += '<div style="position:relative;z-index:1;display:grid;grid-template-columns:minmax(0, 1fr) minmax(0, 2fr);gap:32px;align-items:flex-start">';

    // LEFT (1/3): 그라데이션 hero (포르투 톤)
    html += '<div style="background:linear-gradient(135deg,#7C3AED 0%,#a78bfa 50%,#fbbf24 100%);border-radius:14px;min-height:220px;position:relative;overflow:hidden;display:flex;align-items:flex-end;padding:20px;box-shadow:0 8px 24px rgba(124,58,237,0.2)">';
    // 작은 deco 별
    html += '<svg viewBox="0 0 200 180" preserveAspectRatio="xMidYMid slice" style="position:absolute;inset:0;opacity:0.25">' +
      '<circle cx="40" cy="40" r="2" fill="#fff"/>' +
      '<circle cx="80" cy="60" r="1.5" fill="#fff"/>' +
      '<circle cx="160" cy="30" r="2.5" fill="#fff"/>' +
      '<circle cx="120" cy="100" r="1.5" fill="#fff"/>' +
      '<circle cx="180" cy="90" r="2" fill="#fff"/>' +
      '<circle cx="30" cy="120" r="1.5" fill="#fff"/>' +
      '<circle cx="100" cy="150" r="2" fill="#fff"/>' +
    '</svg>';
    html += '<div style="position:relative;z-index:1">' +
      '<div style="font-size:42px;line-height:1;margin-bottom:12px">🇵🇹</div>' +
      '<span style="background:rgba(255,255,255,0.95);backdrop-filter:blur(8px);color:var(--nm-deep-indigo);padding:6px 14px;border-radius:99px;font-family:Manrope;font-size:11px;font-weight:700;box-shadow:0 1px 3px rgba(0,0,0,0.15)">리스본 워홀 베이스</span>' +
    '</div>';
    html += '</div>';

    // RIGHT (2/3): Nomad Strategy
    html += '<div>';
    html += '<h4 style="font-family:Manrope;font-size:20px;font-weight:700;color:var(--nm-deep-indigo);margin-bottom:18px">Nomad Strategy · Why Working Holiday?</h4>';
    // 2-col 인사이트
    html += '<div class="nm-grid nm-grid-2" style="gap:18px;margin-bottom:18px">';
    html += '<div>' +
      '<h5 style="font-family:Manrope;font-size:13px;font-weight:700;color:var(--nm-primary);margin-bottom:8px;text-transform:uppercase;letter-spacing:0.06em">1년 베이스캠프 활용</h5>' +
      '<ul style="list-style:none;padding:0;margin:0;font-size:12px;color:var(--nm-text-2);line-height:1.7">' +
        '<li>· 포르투갈 체류 = 1년 중 <strong>2-2.5개월</strong> (6월 + 10-11월)</li>' +
        '<li>· 셰겐 카운트 회피용 베이스</li>' +
        '<li>· 복수 입출국 가능</li>' +
      '</ul>' +
    '</div>';
    html += '<div>' +
      '<h5 style="font-family:Manrope;font-size:13px;font-weight:700;color:var(--nm-primary);margin-bottom:8px;text-transform:uppercase;letter-spacing:0.06em">일자리 X · 비자 도구</h5>' +
      '<ul style="list-style:none;padding:0;margin:0;font-size:12px;color:var(--nm-text-2);line-height:1.7">' +
        '<li>· 본업 외 IP·웹소 수익이 메인</li>' +
        '<li>· 포르투갈에서 일자리 X</li>' +
        '<li>· 워홀 = <strong>비자 도구로만 사용</strong></li>' +
      '</ul>' +
    '</div>';
    html += '</div>';
    // 주의 박스
    html += '<div style="padding:16px 18px;background:rgba(186,26,26,0.06);border-left:4px solid #ba1a1a;border-radius:10px;margin-bottom:18px">';
    html += '<div style="display:flex;align-items:center;gap:6px;margin-bottom:8px">' +
      '<span class="material-symbols-outlined" style="font-size:16px;color:#ba1a1a">warning</span>' +
      '<h5 style="font-family:Manrope;font-size:13px;font-weight:700;color:#ba1a1a">주의 · Critical</h5>' +
    '</div>';
    html += '<ul style="list-style:none;padding:0;margin:0;font-size:12px;color:var(--nm-text-2);line-height:1.7">' +
      '<li>· 비자 시작일 전 셰겐 입국 시 입국 거부 가능 → <strong style="color:#ba1a1a">첫 입국 반드시 포르투갈</strong></li>' +
      '<li>· 대사관 방문 = 본인 직접 (대리 X)</li>' +
      '<li>· 연간 200명 쿼터 = 빨리 신청 권장</li>' +
    '</ul>';
    html += '</div>';
    // 버튼
    html += '<button onclick="NOMAD_PAGES.go(\'nomad-voyage\')" style="display:flex;align-items:center;gap:8px;padding:12px 22px;background:var(--nm-deep-indigo);color:#fff;border:none;border-radius:10px;font-family:Manrope;font-size:13px;font-weight:700;cursor:pointer;transition:transform 0.15s" onmouseover="this.style.transform=\'translateY(-2px)\'" onmouseout="this.style.transform=\'none\'">' +
      '12-Month Voyage 동선 보기' +
      '<span class="material-symbols-outlined" style="font-size:18px">arrow_forward</span>' +
    '</button>';
    html += '</div>';

    html += '</div>';
    html += '</div>';

    return html;
  }
  registerPage('nomad-wh', renderWH);

  // ──────── Action Items 페이지 (Stitch Magazine 디자인) ────────
  // 시기별 메타 (아이콘, 색, Phase, 우선순위)
  function actionPeriodMeta(periodIdx, when) {
    var meta = [
      { icon:'schedule',         color:'#7C3AED', phase:'A', priority:'Critical' }, // 이번 주
      { icon:'today',            color:'#7C3AED', phase:'A', priority:'Critical' }, // 이번 달
      { icon:'foundation',       color:'#7C3AED', phase:'A', priority:'High' },     // 2026 후반
      { icon:'sync',             color:'#5654a8', phase:'B', priority:'Mid' },      // 2027 전반
      { icon:'rocket_launch',    color:'#5654a8', phase:'B', priority:'Mid' },      // 2027 후반
      { icon:'logout',           color:'#7d3d00', phase:'C', priority:'High' },     // 2028.1-2
      { icon:'badge',            color:'#7d3d00', phase:'C', priority:'High' },     // 2028.3-4
      { icon:'luggage',          color:'#7d3d00', phase:'C', priority:'Critical' }, // 2028.5
      { icon:'flight_takeoff',   color:'#312E81', phase:'D', priority:'Critical' }, // 2028.6 출국
    ];
    return meta[periodIdx] || { icon:'task_alt', color:'#7C3AED', phase:'?', priority:'Mid' };
  }

  function priorityPillStyle(priority) {
    if (priority === 'Critical') return 'background:rgba(186,26,26,0.1);color:#ba1a1a';
    if (priority === 'High')     return 'background:#F5F3FF;color:#7C3AED';
    return 'background:#e6eeff;color:#5654a8'; // Mid
  }

  function renderActions() {
    initChecks();
    var html = '';

    var periods = DATA.ACTIONS_BY_PERIOD || [];
    var saved = _nomadChecks['actions'] || {};
    var totalAll = periods.reduce(function(a,p){ return a + (p.items||[]).length; }, 0);
    var doneAll = 0;
    periods.forEach(function(p, gi) {
      (p.items || []).forEach(function(_, ii) { if (saved[gi + '-' + ii]) doneAll++; });
    });
    var active = totalAll - doneAll;
    var readinessPct = totalAll > 0 ? Math.round((doneAll/totalAll) * 100) : 0;

    // Critical 카운트 = 이번 주/이번 달 + 2028.5 + 2028.6 출국 (시기 0, 1, 7, 8)
    var critIdx = [0, 1, 7, 8];
    var critTotal = 0, critDone = 0;
    critIdx.forEach(function(gi) {
      var items = periods[gi] && periods[gi].items || [];
      critTotal += items.length;
      items.forEach(function(_, ii) { if (saved[gi + '-' + ii]) critDone++; });
    });
    var critActive = critTotal - critDone;

    // Phase별 진행률 (A: 0-2 / B: 3-4 / C: 5-7 / D: 8)
    var phaseGroups = {
      'A': { idx:[0,1,2], name:'Foundation' },
      'B': { idx:[3,4],   name:'Build & Gate' },
      'C': { idx:[5,6,7], name:'Exit' },
      'D': { idx:[8],     name:'Departure' },
    };
    function phaseProgress(idxArr) {
      var t = 0, d = 0;
      idxArr.forEach(function(gi) {
        var items = periods[gi] && periods[gi].items || [];
        t += items.length;
        items.forEach(function(_, ii) { if (saved[gi + '-' + ii]) d++; });
      });
      return { total:t, done:d, pct:t>0?Math.round((d/t)*100):0 };
    }
    var currentPh = currentPhase();
    var currentPhaseId = currentPh.id;

    // 가장 가까운 미완 액션 찾기
    var nextCriticalPeriod = null;
    var nextCriticalItem = null;
    for (var pi = 0; pi < periods.length; pi++) {
      var pitems = periods[pi].items || [];
      for (var ii = 0; ii < pitems.length; ii++) {
        if (!saved[pi + '-' + ii]) {
          nextCriticalPeriod = periods[pi];
          nextCriticalItem = pitems[ii];
          break;
        }
      }
      if (nextCriticalItem) break;
    }

    // Page Header
    html += pageHeader('Action Items', '즉시 액션 · 시간순',
      '이번 주부터 출국까지 · ' + totalAll + ' 항목 · 체크해가며 진행');

    // ════════ SECTION 1 · Summary Stats (4 metric, border-l-4) ════════
    html += '<div class="nm-grid nm-grid-4" style="margin-bottom:32px">';
    var stats = [
      { label:'Active Tasks',       value:active,    color:'#7C3AED', sub:'진행 중' },
      { label:'Critical Deadlines', value:critActive,color:'#ba1a1a', sub:'이번 주·달 + 2028.5-6' },
      { label:'Completed',          value:doneAll,   color:'#5654a8', sub:'전체 ' + totalAll + ' 중' },
      { label:'Total Forecast',     value:totalAll,  color:'#7b7487', sub:'9 시기 통합' },
    ];
    stats.forEach(function(s) {
      html += '<div class="nm-card nm-readiness-global" data-key="actions" data-total="' + totalAll + '" style="padding:22px;border-left:4px solid ' + s.color + '">' +
        '<p style="font-size:10px;color:var(--nm-text-3);text-transform:uppercase;letter-spacing:0.1em;font-weight:700;margin-bottom:8px">' + s.label + '</p>' +
        '<p style="font-family:Manrope;font-size:32px;font-weight:800;color:' + s.color + ';line-height:1">' + String(s.value).padStart(2, '0') + '</p>' +
        '<p style="font-size:11px;color:var(--nm-text-3);margin-top:6px">' + s.sub + '</p>' +
      '</div>';
    });
    html += '</div>';

    // ════════ SECTION 2 · 8/4 Asymmetric Layout ════════
    html += '<div class="nm-grid nm-grid-2-1" style="gap:24px">';

    // ───── LEFT (8): Period Timeline ─────
    html += '<div style="display:flex;flex-direction:column;gap:36px">';
    periods.forEach(function(period, gi) {
      var meta = actionPeriodMeta(gi, period.when);
      var items = period.items || [];
      var periodDone = 0;
      items.forEach(function(_, ii) { if (saved[gi + '-' + ii]) periodDone++; });
      var periodPct = items.length > 0 ? Math.round((periodDone/items.length) * 100) : 0;

      html += '<section class="nm-checklist-wrap" data-key="actions" style="position:relative">';

      // 헤더: 좌측 큰 원형 아이콘 + period name + 진행률
      html += '<div style="display:flex;align-items:center;gap:16px;margin-bottom:20px">';
      html += '<div style="width:44px;height:44px;border-radius:50%;background:' + meta.color + ';color:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 4px 12px ' + meta.color + '40">' +
        '<span class="material-symbols-outlined" style="font-size:22px">' + meta.icon + '</span>' +
      '</div>';
      html += '<div style="flex:1;min-width:0">';
      html += '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">' +
        '<h3 style="font-family:Manrope;font-size:17px;font-weight:700;color:var(--nm-deep-indigo)">' + period.when + '</h3>' +
        '<span style="background:rgba(124,58,237,0.08);color:var(--nm-text-3);padding:3px 9px;border-radius:99px;font-size:10px;font-weight:700;font-family:Manrope">Phase ' + meta.phase + '</span>' +
      '</div>';
      html += '<p style="font-size:11px;color:var(--nm-text-3);font-weight:600"><span class="nm-check-count-inline">' + periodDone + ' / ' + items.length + '</span> 완료</p>';
      html += '</div>';
      html += '</div>';

      // hidden progress 라벨 (_updateChecklistProgress 호환)
      html += '<div class="nm-check-progress-label" style="display:none"></div>';
      html += '<div style="display:none"><div class="nm-check-progress-bar"></div></div>';

      // task cards
      html += '<ul class="nm-checklist" style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px;margin-left:60px">';
      items.forEach(function(item, ii) {
        var itemKey = gi + '-' + ii;
        var isChecked = !!saved[itemKey];
        html += '<li class="' + (isChecked ? 'is-checked' : '') + '" data-key="actions:' + itemKey + '" onclick="_nomadToggleCheck(\'actions\', \'' + itemKey + '\')" style="cursor:pointer;display:flex;align-items:flex-start;justify-content:space-between;gap:14px;padding:14px 18px;background:#fff;border:1px solid var(--nm-surface-container);border-radius:10px;transition:all 0.15s" onmouseover="this.style.borderColor=\'var(--nm-primary-fixed)\';this.style.boxShadow=\'0 2px 8px rgba(124,58,237,0.08)\'" onmouseout="this.style.borderColor=\'var(--nm-surface-container)\';this.style.boxShadow=\'none\'">';
        html += '<div style="display:flex;align-items:flex-start;gap:12px;flex:1;min-width:0">' +
          '<span class="nm-checkbox" style="flex-shrink:0;margin-top:2px"></span>' +
          '<span style="font-size:13px;color:var(--nm-on-surface);line-height:1.5;font-weight:500">' + item + '</span>' +
        '</div>';
        // 우측 priority pill
        html += '<span style="padding:3px 10px;border-radius:99px;font-family:Manrope;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;flex-shrink:0;' + priorityPillStyle(meta.priority) + '">' + meta.priority + '</span>';
        html += '</li>';
      });
      html += '</ul>';

      html += '</section>';
    });
    html += '</div>'; // /LEFT period timeline

    // ───── RIGHT (4): 사이드바 3 카드 ─────
    html += '<aside style="display:flex;flex-direction:column;gap:20px">';

    // ① Voyage Readiness (deep-indigo)
    html += '<div class="nm-card nm-readiness-global" data-key="actions" data-total="' + totalAll + '" style="padding:28px;background:var(--nm-deep-indigo);color:#fff;position:relative;overflow:hidden">';
    html += '<div style="position:absolute;bottom:-30px;right:-30px;width:140px;height:140px;background:var(--nm-primary);opacity:0.2;border-radius:50%;filter:blur(30px)"></div>';
    html += '<div style="position:relative;z-index:1">';
    html += '<h4 style="font-family:Manrope;font-size:16px;font-weight:700;color:#fff;margin-bottom:18px;display:flex;align-items:center;gap:8px">' +
      '<span class="material-symbols-outlined" style="color:#eaddff">trending_up</span>' +
      'Voyage Readiness' +
    '</div>';
    html += '<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:10px">' +
      '<span style="font-family:Manrope;font-size:11px;font-weight:700;color:#eaddff;text-transform:uppercase;letter-spacing:0.08em">전체 진행률</span>' +
      '<span class="nm-readiness-pct" style="font-family:Manrope;font-size:24px;font-weight:800;color:#fff">' + readinessPct + '%</span>' +
    '</div>';
    html += '<div style="height:8px;background:rgba(255,255,255,0.15);border-radius:99px;overflow:hidden;margin-bottom:6px">' +
      '<div class="nm-readiness-bar" style="height:100%;width:' + readinessPct + '%;background:#fff;border-radius:99px;transition:width 0.3s"></div>' +
    '</div>';
    html += '<p style="font-size:11px;color:rgba(255,255,255,0.7)"><span class="nm-readiness-done">' + doneAll + ' Completed</span> · <span class="nm-readiness-pending">' + active + ' Pending</span></p>';
    // Phase별 sub-track
    html += '<div style="margin-top:24px;padding-top:20px;border-top:1px solid rgba(255,255,255,0.1);display:flex;flex-direction:column;gap:10px">';
    Object.keys(phaseGroups).forEach(function(phId) {
      var phData = phaseGroups[phId];
      var prog = phaseProgress(phData.idx);
      var isCurrent = (phId === currentPhaseId);
      var isDone = prog.pct === 100;
      var icon = isDone ? 'check_circle' : (isCurrent ? 'radio_button_checked' : 'radio_button_unchecked');
      html += '<div style="display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:12px">' +
        '<span style="display:flex;align-items:center;gap:8px;color:' + (isCurrent ? '#fff' : 'rgba(255,255,255,0.65)') + ';font-weight:' + (isCurrent ? '700' : '500') + ';font-family:Manrope">' +
          '<span class="material-symbols-outlined" style="font-size:16px;color:' + (isDone ? '#22c55e' : (isCurrent ? '#eaddff' : 'rgba(255,255,255,0.4)')) + '">' + icon + '</span>' +
          'Phase ' + phId + ' · ' + phData.name +
        '</span>' +
        '<span style="font-family:Manrope;font-size:11px;color:rgba(255,255,255,0.7);font-weight:600">' + prog.done + '/' + prog.total + '</span>' +
      '</div>';
    });
    html += '</div>';
    html += '</div>';
    html += '</div>';

    // ② Upcoming Critical Date (lavender)
    if (nextCriticalItem) {
      html += '<div class="nm-card" style="padding:24px;background:#F5F3FF;border:1px solid var(--nm-primary-fixed)">';
      html += '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">' +
        '<span style="background:#ba1a1a;color:#fff;padding:4px 10px;border-radius:6px;font-family:Manrope;font-size:9px;font-weight:800;letter-spacing:0.1em;text-transform:uppercase">Critical</span>' +
        '<span class="material-symbols-outlined" style="color:var(--nm-text-3);font-size:18px">calendar_today</span>' +
      '</div>';
      html += '<h5 style="font-family:Manrope;font-size:17px;font-weight:700;color:var(--nm-deep-indigo);margin-bottom:8px">' + nextCriticalPeriod.when + '</h5>';
      html += '<p style="font-size:13px;color:var(--nm-text-2);line-height:1.5;margin-bottom:18px">다음 미완 액션: <strong style="color:var(--nm-deep-indigo)">' + nextCriticalItem + '</strong></p>';
      html += '<button onclick="NOMAD_PAGES.go(\'nomad-visa\')" style="width:100%;padding:11px;background:#fff;color:var(--nm-primary);border:1px solid var(--nm-primary);border-radius:10px;font-family:Manrope;font-size:13px;font-weight:700;cursor:pointer;transition:background 0.15s" onmouseover="this.style.background=\'var(--nm-primary)\';this.style.color=\'#fff\'" onmouseout="this.style.background=\'#fff\';this.style.color=\'var(--nm-primary)\'">' +
        'Visa 서류 보기' +
      '</button>';
      html += '</div>';
    }

    // ③ Phase Context Hero (그라데이션)
    var phaseInfo = {
      'A': { name:'Foundation',   sub:'IP 구축 + 재무 시스템 셋업',     grad:'linear-gradient(135deg,#7C3AED 0%,#a78bfa 100%)' },
      'B': { name:'Build & Gate', sub:'본업 자산 안정 + 게이트 평가',   grad:'linear-gradient(135deg,#5654a8 0%,#a7a5ff 100%)' },
      'C': { name:'Exit',         sub:'퇴사 + 짐 정리 + 비자 발급',    grad:'linear-gradient(135deg,#7d3d00 0%,#fbbf24 100%)' },
      'D': { name:'Departure',    sub:'출국 + 첫 거점 적응',           grad:'linear-gradient(135deg,#312E81 0%,#7C3AED 100%)' },
    };
    var ph = phaseInfo[currentPhaseId] || phaseInfo['A'];
    html += '<div class="nm-card" style="padding:0;overflow:hidden">';
    html += '<div style="min-height:170px;background:' + ph.grad + ';position:relative;padding:24px;display:flex;flex-direction:column;justify-content:space-between">';
    // 작은 별 deco
    html += '<svg viewBox="0 0 280 170" preserveAspectRatio="xMidYMid slice" style="position:absolute;inset:0;width:100%;height:100%;opacity:0.25">' +
      '<circle cx="40" cy="40" r="2" fill="#fff"/>' +
      '<circle cx="100" cy="30" r="1.5" fill="#fff"/>' +
      '<circle cx="220" cy="50" r="2" fill="#fff"/>' +
      '<circle cx="150" cy="80" r="1.5" fill="#fff"/>' +
      '<circle cx="240" cy="110" r="2" fill="#fff"/>' +
      '<circle cx="60" cy="130" r="1.5" fill="#fff"/>' +
      '<circle cx="180" cy="140" r="2" fill="#fff"/>' +
    '</svg>';
    html += '<div style="position:relative;z-index:1;color:#fff">' +
      '<p style="font-family:Manrope;font-size:10px;font-weight:700;color:rgba(255,255,255,0.75);text-transform:uppercase;letter-spacing:0.12em;margin-bottom:6px">Current Phase</p>' +
      '<h4 style="font-family:Manrope;font-size:24px;font-weight:800">Phase ' + currentPhaseId + ' · ' + ph.name + '</h4>' +
    '</div>';
    html += '<div style="position:relative;z-index:1">' +
      '<span style="background:rgba(255,255,255,0.95);backdrop-filter:blur(8px);color:var(--nm-deep-indigo);padding:6px 14px;border-radius:99px;font-family:Manrope;font-size:11px;font-weight:700;box-shadow:0 1px 3px rgba(0,0,0,0.15)">' + ph.sub + '</span>' +
    '</div>';
    html += '</div>';
    html += '</div>';

    html += '</aside>';

    html += '</div>'; // /8-4 split

    return html;
  }
  registerPage('nomad-actions', renderActions);

  // ──────── Packing List 페이지 (Stitch Magazine Bento Grid 디자인) ────────
  // 카테고리 메타 (아이콘, 색, bento 위치, 스타일)
  function packingCatMeta(cat) {
    var map = {
      '캐리어 — 옷':           { icon:'checkroom',         bg:'#fff',    accent:'var(--nm-primary)',     style:'normal', span:'col-8' },
      '캐리어 — 신발':         { icon:'hiking',            bg:'#F5F3FF', accent:'var(--nm-primary)',     style:'mini',   span:'col-4' },
      '디자인 · 작업 도구':    { icon:'architecture',      bg:'#fff',    accent:'var(--nm-primary)',     style:'normal', span:'col-6' },
      '백팩 — 기내':           { icon:'backpack',          bg:'var(--nm-deep-indigo)', accent:'#eaddff', style:'dark',   span:'col-6' },
      '작가 도구':             { icon:'history_edu',       bg:'#fff',    accent:'#7d3d00',                style:'normal', span:'col-4' },
      '세면 · 뷰티':           { icon:'soap',              bg:'#fff',    accent:'var(--nm-secondary)',    style:'normal', span:'col-4' },
      '의약 · 건강':           { icon:'medical_services',  bg:'#F5F3FF', accent:'#ba1a1a',                style:'normal', span:'col-4' },
      '작은 가방 — 개인 휴대': { icon:'badge',             bg:'#fff',    accent:'var(--nm-primary)',      style:'banner', span:'col-12' },
    };
    return map[cat] || { icon:'inventory_2', bg:'#fff', accent:'var(--nm-primary)', style:'normal', span:'col-6' };
  }

  // span → CSS grid-column 매핑 (12-col)
  function spanCSS(span) {
    var map = {
      'col-12': 'grid-column:span 12',
      'col-8':  'grid-column:span 8',
      'col-6':  'grid-column:span 6',
      'col-4':  'grid-column:span 4',
      'col-3':  'grid-column:span 3',
    };
    return map[span] || 'grid-column:span 6';
  }

  // 단일 packing 카테고리 카드 (Bento 스타일)
  function buildPackingCategoryCard(storageKey, group, gi) {
    var saved = _nomadChecks[storageKey] || {};
    var items = group.items || [];
    var total = items.length;
    var done = 0;
    items.forEach(function(_, ii) { if (saved[gi + '-' + ii]) done++; });
    var meta = packingCatMeta(group.cat);

    var isDark = (meta.style === 'dark');
    var isBanner = (meta.style === 'banner');
    var isMini = (meta.style === 'mini');

    // 색상 변수
    var titleColor = isDark ? '#fff' : 'var(--nm-deep-indigo)';
    var bodyColor = isDark ? 'rgba(255,255,255,0.85)' : 'var(--nm-text-2)';
    var subColor = isDark ? 'rgba(255,255,255,0.6)' : 'var(--nm-text-3)';
    var hoverBg = isDark ? 'rgba(255,255,255,0.08)' : '#F5F3FF';
    var border = isDark ? 'rgba(255,255,255,0.12)' : 'var(--nm-surface-container)';

    var html = '<div class="nm-card nm-checklist-wrap" data-key="' + storageKey + '" style="' + spanCSS(meta.span) + ';padding:26px;background:' + meta.bg + ';' + (isDark ? 'color:#fff;' : '') + 'position:relative;overflow:hidden">';

    // dark deco circle
    if (isDark) {
      html += '<div style="position:absolute;bottom:-30px;right:-30px;width:140px;height:140px;background:var(--nm-primary);opacity:0.2;border-radius:50%;filter:blur(30px)"></div>';
    }

    html += '<div style="position:relative;z-index:1">';
    // 헤더
    html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px">';
    html += '<div style="display:flex;align-items:center;gap:12px">' +
      '<div style="width:40px;height:40px;border-radius:11px;background:' + (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(124,58,237,0.1)') + ';display:flex;align-items:center;justify-content:center;color:' + meta.accent + ';flex-shrink:0">' +
        '<span class="material-symbols-outlined" style="font-size:22px">' + meta.icon + '</span>' +
      '</div>' +
      '<h4 style="font-family:Manrope;font-size:16px;font-weight:700;color:' + titleColor + '">' + group.cat + '</h4>' +
    '</div>';
    html += '<span class="nm-check-count-inline" style="font-family:Manrope;font-size:11px;font-weight:700;color:' + subColor + ';padding:4px 10px;background:' + (isDark ? 'rgba(255,255,255,0.1)' : 'var(--nm-surface-container-low)') + ';border-radius:99px">' + done + ' / ' + total + '</span>';
    html += '</div>';

    // hidden progress (auto-update 호환)
    html += '<div class="nm-check-progress-label" style="display:none"></div>';
    html += '<div style="display:none"><div class="nm-check-progress-bar"></div></div>';

    // 진행률 미니 bar
    var pct = total > 0 ? Math.round((done/total) * 100) : 0;
    html += '<div style="height:3px;background:' + (isDark ? 'rgba(255,255,255,0.12)' : 'var(--nm-surface-container)') + ';border-radius:99px;overflow:hidden;margin-bottom:18px">' +
      '<div class="nm-check-progress-bar" style="height:100%;background:' + (isDark ? '#fff' : 'var(--nm-primary)') + ';width:' + pct + '%;transition:width 0.2s"></div>' +
    '</div>';

    // 항목 리스트 (스타일에 따라 다름)
    if (isMini) {
      // mini 스타일: 작은 리스트 (check_circle 아이콘 + 짧은 텍스트)
      html += '<ul style="list-style:none;padding:0;margin:0;display:flex;flex-direction:column;gap:8px">';
      items.forEach(function(item, ii) {
        var itemKey = gi + '-' + ii;
        var isChecked = !!saved[itemKey];
        html += '<li class="nm-checklist" data-key="' + storageKey + ':' + itemKey + '" onclick="_nomadToggleCheck(\'' + storageKey + '\', \'' + itemKey + '\')" style="display:flex;align-items:center;gap:10px;cursor:pointer;padding:6px 0">';
        html += '<span class="material-symbols-outlined" style="font-size:18px;color:' + (isChecked ? meta.accent : 'rgba(122,116,135,0.5)') + ';font-variation-settings:\'FILL\' ' + (isChecked ? '1' : '0') + '">' + (isChecked ? 'check_circle' : 'radio_button_unchecked') + '</span>';
        html += '<span style="font-size:13px;color:' + bodyColor + ';' + (isChecked ? 'text-decoration:line-through;opacity:0.6' : '') + '">' + item + '</span>';
        html += '</li>';
      });
      html += '</ul>';
    } else if (isBanner) {
      // banner 스타일: 가로 grid (full-width)
      html += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:10px">';
      items.forEach(function(item, ii) {
        var itemKey = gi + '-' + ii;
        var isChecked = !!saved[itemKey];
        html += '<label class="nm-checklist" data-key="' + storageKey + ':' + itemKey + '" onclick="_nomadToggleCheck(\'' + storageKey + '\', \'' + itemKey + '\')" style="display:flex;align-items:center;gap:10px;cursor:pointer;padding:10px 12px;border-radius:8px;border:1px solid transparent;transition:all 0.15s;background:var(--nm-surface-container-low)" onmouseover="this.style.borderColor=\'var(--nm-primary-fixed)\';this.style.background=\'#F5F3FF\'" onmouseout="this.style.borderColor=\'transparent\';this.style.background=\'var(--nm-surface-container-low)\'">';
        html += '<span class="material-symbols-outlined" style="font-size:18px;color:' + (isChecked ? meta.accent : 'rgba(122,116,135,0.4)') + ';font-variation-settings:\'FILL\' ' + (isChecked ? '1' : '0') + ';flex-shrink:0">' + (isChecked ? 'check_circle' : 'radio_button_unchecked') + '</span>';
        html += '<span style="font-size:12px;color:' + bodyColor + ';line-height:1.4;' + (isChecked ? 'text-decoration:line-through;opacity:0.6' : '') + '">' + item + '</span>';
        html += '</label>';
      });
      html += '</div>';
    } else {
      // normal/dark 스타일: 2-col 체크박스 grid
      var cols = items.length > 8 ? '1fr 1fr' : '1fr';
      html += '<div style="display:grid;grid-template-columns:' + cols + ';gap:6px">';
      items.forEach(function(item, ii) {
        var itemKey = gi + '-' + ii;
        var isChecked = !!saved[itemKey];
        html += '<label class="nm-checklist" data-key="' + storageKey + ':' + itemKey + '" onclick="_nomadToggleCheck(\'' + storageKey + '\', \'' + itemKey + '\')" style="display:flex;align-items:flex-start;gap:10px;cursor:pointer;padding:8px 10px;border-radius:8px;border:1px solid transparent;transition:all 0.15s" onmouseover="this.style.background=\'' + hoverBg + '\'" onmouseout="this.style.background=\'transparent\'">';
        html += '<span class="material-symbols-outlined" style="font-size:17px;color:' + (isChecked ? meta.accent : (isDark ? 'rgba(255,255,255,0.35)' : 'rgba(122,116,135,0.4)')) + ';font-variation-settings:\'FILL\' ' + (isChecked ? '1' : '0') + ';flex-shrink:0;margin-top:1px">' + (isChecked ? 'check_circle' : 'radio_button_unchecked') + '</span>';
        html += '<span style="font-size:12px;color:' + bodyColor + ';line-height:1.45;' + (isChecked ? 'text-decoration:line-through;opacity:0.6' : '') + '">' + item + '</span>';
        html += '</label>';
      });
      html += '</div>';
    }

    html += '</div>';
    html += '</div>';
    return html;
  }

  function renderPacking() {
    initChecks();
    var html = '';

    // 데이터
    var packing = DATA.PACKING || {};
    var categories = Object.keys(packing).map(function(cat, idx) {
      return { cat: cat, items: packing[cat], gi: idx };
    });

    // 글로벌 stat 계산
    var saved = _nomadChecks['packing'] || {};
    var totalAll = categories.reduce(function(a,g){ return a + g.items.length; }, 0);
    var doneAll = 0;
    categories.forEach(function(g) {
      g.items.forEach(function(_, ii) { if (saved[g.gi + '-' + ii]) doneAll++; });
    });
    var completionPct = totalAll > 0 ? Math.round((doneAll/totalAll) * 100) : 0;

    // D-day → status pill
    var dDay = daysBetween(todayYMD(), DEPARTURE_DATE);
    var statusLabel, statusBg, statusColor;
    if (dDay > 100) {
      statusLabel = 'Planning · D-' + dDay;
      statusBg = '#dee9fc'; statusColor = '#5654a8';
    } else if (dDay > 30) {
      statusLabel = 'Packing · D-' + dDay;
      statusBg = '#F5F3FF'; statusColor = 'var(--nm-primary)';
    } else if (dDay > 7) {
      statusLabel = 'Final Check · D-' + dDay;
      statusBg = '#ffe0cd'; statusColor = '#7d3d00';
    } else if (dDay > 0) {
      statusLabel = '⚡ Ready for Departure · D-' + dDay;
      statusBg = '#dcfce7'; statusColor = '#15803d';
    } else {
      statusLabel = '🎉 출국 완료';
      statusBg = '#F5F3FF'; statusColor = 'var(--nm-primary)';
    }

    // ════════ SECTION 1 · Hero Header (좌 타이틀 + 우 status) ════════
    html += '<div class="nm-page-header" style="display:flex;justify-content:space-between;align-items:flex-end;gap:24px;flex-wrap:wrap;padding-bottom:32px;border-bottom:1px solid var(--nm-surface-container);margin-bottom:32px">';
    html += '<div>' +
      '<div style="display:flex;align-items:center;gap:8px;color:var(--nm-primary);font-family:Manrope;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.14em;margin-bottom:12px">' +
        '<span class="material-symbols-outlined" style="font-size:16px">luggage</span>' +
        'Packing List' +
      '</div>' +
      '<h1 style="font-family:Manrope;font-size:36px;font-weight:800;color:var(--nm-deep-indigo);line-height:1.15;margin-bottom:10px">Master Packing List</h1>' +
      '<p style="font-size:14px;color:var(--nm-text-2);line-height:1.5;max-width:680px;margin:0">장기 노마드 정밀 인벤토리 · 1년 모빌리티 + 글쓰기/디자인 양립. 캐리어 28인치 23kg + 백팩 8-10kg + 휴대 5kg.</p>' +
    '</div>';
    html += '<div style="background:#F5F3FF;padding:14px 20px;border-radius:12px;display:flex;align-items:center;gap:12px;flex-shrink:0">' +
      '<span style="font-family:Manrope;font-size:11px;font-weight:700;color:var(--nm-deep-indigo);text-transform:uppercase;letter-spacing:0.08em">Status</span>' +
      '<span style="background:' + statusBg + ';color:' + statusColor + ';padding:6px 14px;border-radius:99px;font-family:Manrope;font-size:11px;font-weight:800;letter-spacing:0.06em;text-transform:uppercase">' + statusLabel + '</span>' +
    '</div>';
    html += '</div>';

    // ════════ SECTION 2 · 짐 철학 3 metric ════════
    html += '<div class="nm-grid nm-grid-3" style="margin-bottom:32px">';

    html += '<div class="nm-card" style="padding:24px;border-left:4px solid var(--nm-primary)">' +
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">' +
        '<span class="material-symbols-outlined" style="font-size:18px;color:var(--nm-primary)">looks_3</span>' +
        '<p style="font-size:10px;color:var(--nm-text-3);text-transform:uppercase;letter-spacing:0.1em;font-weight:700">3-2-1 원칙</p>' +
      '</div>' +
      '<p style="font-family:Manrope;font-size:17px;font-weight:700;color:var(--nm-deep-indigo);line-height:1.3">3계절 옷 · 2개 가방 · 1년치 짐</p>' +
      '<p style="font-size:11px;color:var(--nm-text-3);margin-top:6px;line-height:1.5">미니멀 + 다용도 + 한 시즌 분량 최적화</p>' +
    '</div>';

    html += '<div class="nm-card" style="padding:24px;border-left:4px solid var(--nm-secondary)">' +
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">' +
        '<span class="material-symbols-outlined" style="font-size:18px;color:var(--nm-secondary)">scale</span>' +
        '<p style="font-size:10px;color:var(--nm-text-3);text-transform:uppercase;letter-spacing:0.1em;font-weight:700">무게 한도</p>' +
      '</div>' +
      '<p style="font-family:Manrope;font-size:17px;font-weight:700;color:var(--nm-deep-indigo);line-height:1.3">23kg + 8-10kg + 5kg</p>' +
      '<p style="font-size:11px;color:var(--nm-text-3);margin-top:6px;line-height:1.5">캐리어 · 백팩 · 개인 휴대 — 항공사 룰 준수</p>' +
    '</div>';

    html += '<div class="nm-card" style="padding:24px;border-left:4px solid #7d3d00">' +
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">' +
        '<span class="material-symbols-outlined" style="font-size:18px;color:#7d3d00">design_services</span>' +
        '<p style="font-size:10px;color:var(--nm-text-3);text-transform:uppercase;letter-spacing:0.1em;font-weight:700">누리 라인</p>' +
      '</div>' +
      '<p style="font-family:Manrope;font-size:17px;font-weight:700;color:var(--nm-deep-indigo);line-height:1.3">디자이너 안목 · 현지 보충</p>' +
      '<p style="font-size:11px;color:var(--nm-text-3);margin-top:6px;line-height:1.5">옷·니트 = 본업 자산 / 책·기념품 = 현지 구매</p>' +
    '</div>';

    html += '</div>';

    // ════════ SECTION 3 · Bento Grid Packing Categories (12-col) ════════
    html += '<div class="nm-packing-bento-grid">';
    categories.forEach(function(g) {
      html += buildPackingCategoryCard('packing', g, g.gi);
    });
    html += '</div>';

    // ════════ SECTION 4 · 23kg 초과 + 한국 보관 (6/6 split) ════════
    html += '<div class="nm-grid nm-grid-2" style="gap:24px;margin-bottom:32px">';

    // LEFT: 23kg 초과 시 빼는 순서
    html += '<div class="nm-card nm-card-lg" style="background:linear-gradient(135deg,#fff7ed,#ffe0cd);position:relative;overflow:hidden">';
    html += '<div style="position:absolute;bottom:-30px;right:-30px;width:140px;height:140px;background:#7d3d00;opacity:0.08;border-radius:50%;filter:blur(30px)"></div>';
    html += '<div style="position:relative;z-index:1">';
    html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:18px">' +
      '<span class="material-symbols-outlined" style="color:#c2410c">priority_high</span>' +
      '<h3 style="font-family:Manrope;font-size:18px;font-weight:700;color:#5a2900">23kg 초과 시 빼는 순서</h3>' +
    '</div>';
    var priority = [
      { rank:'1순위 양보', text:'다량의 약·영양제 (현지 구매 가능)', color:'#fbbf24' },
      { rank:'2순위',       text:'헤어 기기 (현지 구매 또는 듀얼볼트)', color:'#f97316' },
      { rank:'3순위',       text:'운동복·수영복 일부',                color:'#c2410c' },
    ];
    html += '<div style="display:flex;flex-direction:column;gap:10px;margin-bottom:18px">';
    priority.forEach(function(p) {
      html += '<div style="display:flex;gap:14px;align-items:flex-start;padding:12px 14px;background:rgba(255,255,255,0.6);border-radius:8px;border-left:3px solid ' + p.color + '">' +
        '<span style="font-family:Manrope;font-size:11px;font-weight:700;color:' + p.color + ';text-transform:uppercase;letter-spacing:0.06em;min-width:80px">' + p.rank + '</span>' +
        '<span style="font-size:13px;color:#5a2900;line-height:1.5;flex:1">' + p.text + '</span>' +
      '</div>';
    });
    html += '</div>';
    // 절대 양보 X
    html += '<div style="padding:16px 18px;background:rgba(186,26,26,0.08);border-left:4px solid #ba1a1a;border-radius:8px">' +
      '<p style="font-family:Manrope;font-size:11px;font-weight:700;color:#ba1a1a;text-transform:uppercase;letter-spacing:0.08em;margin-bottom:6px">⛔ 절대 양보 X</p>' +
      '<p style="font-size:13px;color:#5a2900;line-height:1.6">노트북 · 태블릿 · 외장 SSD · 여권 · 서류 · 1차 옷 · 신발</p>' +
    '</div>';
    html += '</div>';
    html += '</div>';

    // RIGHT: 한국 집 보관 (deep-indigo)
    html += '<div class="nm-card nm-card-lg" style="background:var(--nm-deep-indigo);color:#fff;position:relative;overflow:hidden">';
    html += '<div style="position:absolute;top:-40px;right:-40px;width:160px;height:160px;background:var(--nm-primary);opacity:0.2;border-radius:50%;filter:blur(40px)"></div>';
    html += '<div style="position:relative;z-index:1">';
    html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">' +
      '<span class="material-symbols-outlined" style="color:#eaddff">archive</span>' +
      '<h3 style="font-family:Manrope;font-size:18px;font-weight:700;color:#fff">한국 집 보관</h3>' +
    '</div>';
    html += '<p style="font-size:12px;color:rgba(234,221,255,0.75);margin-bottom:22px">동생한테 맡길 짐 · 1년 안 안 쓰는 것 분류</p>';
    var storageItems = [
      { icon:'checkroom', text:'1년 안 입을 옷·신발' },
      { icon:'menu_book', text:'책·앨범·기념품' },
      { icon:'folder',    text:'본업 자료·디자인 포트폴리오 원본' },
      { icon:'directions_car', text:'차량 (동생 사용 또는 보관)' },
    ];
    html += '<div style="display:flex;flex-direction:column;gap:12px">';
    storageItems.forEach(function(s) {
      html += '<div style="display:flex;gap:14px;align-items:center;padding:12px 14px;background:rgba(255,255,255,0.06);border-radius:8px;border:1px solid rgba(255,255,255,0.1)">' +
        '<div style="width:32px;height:32px;border-radius:8px;background:rgba(255,255,255,0.12);display:flex;align-items:center;justify-content:center;flex-shrink:0">' +
          '<span class="material-symbols-outlined" style="font-size:18px;color:#eaddff">' + s.icon + '</span>' +
        '</div>' +
        '<p style="font-size:13px;color:#fff;line-height:1.5;flex:1">' + s.text + '</p>' +
      '</div>';
    });
    html += '</div>';
    html += '</div>';
    html += '</div>';

    html += '</div>'; // /6-6 split

    // ════════ SECTION 5 · Footer Stats Banner ════════
    html += '<div class="nm-card nm-readiness-global" data-key="packing" data-total="' + totalAll + '" style="padding:24px 32px;background:var(--nm-surface-container-low);border:1px solid var(--nm-surface-container);display:flex;align-items:center;justify-content:space-between;gap:24px;flex-wrap:wrap">';
    html += '<div style="display:flex;align-items:center;gap:32px;flex-wrap:wrap">';
    html += '<div>' +
      '<p style="font-size:10px;color:var(--nm-text-3);text-transform:uppercase;letter-spacing:0.1em;font-weight:700;margin-bottom:4px">Total Items</p>' +
      '<p style="font-family:Manrope;font-size:22px;font-weight:700;color:var(--nm-deep-indigo)">' + totalAll + '</p>' +
    '</div>';
    html += '<div style="height:36px;width:1px;background:var(--nm-outline-variant);opacity:0.3"></div>';
    html += '<div>' +
      '<p style="font-size:10px;color:var(--nm-text-3);text-transform:uppercase;letter-spacing:0.1em;font-weight:700;margin-bottom:4px">Categories</p>' +
      '<p style="font-family:Manrope;font-size:22px;font-weight:700;color:var(--nm-deep-indigo)">' + categories.length + '</p>' +
    '</div>';
    html += '<div style="height:36px;width:1px;background:var(--nm-outline-variant);opacity:0.3"></div>';
    html += '<div>' +
      '<p style="font-size:10px;color:var(--nm-text-3);text-transform:uppercase;letter-spacing:0.1em;font-weight:700;margin-bottom:4px">Completion</p>' +
      '<p style="font-family:Manrope;font-size:22px;font-weight:700;color:var(--nm-primary)"><span class="nm-readiness-pct">' + completionPct + '%</span> <span style="font-size:13px;color:var(--nm-text-3);font-weight:500"><span class="nm-readiness-done">' + doneAll + ' Completed</span></span></p>' +
    '</div>';
    html += '</div>';
    // Print 버튼
    html += '<button onclick="window.print()" style="display:flex;align-items:center;gap:8px;padding:12px 22px;background:#fff;color:var(--nm-deep-indigo);border:1px solid var(--nm-surface-container-high);border-radius:10px;font-family:Manrope;font-size:13px;font-weight:700;cursor:pointer;transition:all 0.15s" onmouseover="this.style.background=\'#F5F3FF\';this.style.borderColor=\'var(--nm-primary-fixed)\'" onmouseout="this.style.background=\'#fff\';this.style.borderColor=\'var(--nm-surface-container-high)\'">' +
      '<span class="material-symbols-outlined" style="font-size:18px">print</span>' +
      'Export PDF Manifest' +
    '</button>';
    html += '</div>';

    return html;
  }
  registerPage('nomad-packing', renderPacking);

  // ════════════════════════════════════════════════════════════════════
  // City Guides — 공통 렌더러 + 섹션 빌더
  // 데이터는 nomad-cities.js의 window.NOMAD_CITIES 에서 옴
  // ════════════════════════════════════════════════════════════════════

  // ──── 매거진 Hero (이미지 또는 그라데이션 배경) ────
  function _renderMagHero(h, monthLabel) {
    var html = '<section class="nm-mag-hero">';
    // 배경
    html += '<div class="nm-mag-hero-bg' + (h.image ? '' : ' no-img') + '">';
    if (h.image) html += '<img src="' + h.image + '" alt="' + (h.imageAlt || h.city) + '"/>';
    html += '</div>';
    // 컨텐츠
    html += '<div class="nm-mag-hero-content">';
    html += '<div class="nm-mag-hero-chips">';
    html += '<span class="nm-mag-chip"><span class="material-symbols-outlined" style="font-size:14px">flag</span>' + h.country + '</span>';
    html += '<span class="nm-mag-chip">' + (monthLabel ? monthLabel + ' · ' : '') + (h.dates || '') + '</span>';
    if (h.mode) html += '<span class="nm-mag-chip"><span class="material-symbols-outlined" style="font-size:14px">edit</span>' + h.mode + '</span>';
    html += '</div>';
    html += '<h1 class="nm-mag-hero-title">' + h.city + (h.tagline ? '<br><span style="opacity:0.85;font-weight:600">' + h.tagline + '</span>' : '') + '</h1>';
    if (h.quote) html += '<p class="nm-mag-hero-quote">"' + h.quote + '"</p>';
    // 메타 (체류기간/기후/비자/톤) - hero 아래쪽
    html += '<div class="nm-mag-hero-meta">';
    var meta = [
      { label:'체류 기간', value:h.dates },
      { label:'기후',     value:h.weather },
      { label:'비자',     value:h.visa },
      { label:'톤',       value:h.vibe },
    ];
    meta.forEach(function(m) {
      if (!m.value) return;
      html += '<div class="nm-mag-hero-meta-item">' +
        '<span class="lbl">' + m.label + '</span>' +
        '<span class="val">' + m.value + '</span>' +
      '</div>';
    });
    html += '</div>';
    html += '</div>'; // /content
    html += '</section>';
    return html;
  }

  // ──── 매거진 섹션 헤더 (번호 + 타이틀 + subtitle) ────
  function _magSectionHead(num, title, subtitle) {
    return '<div class="nm-mag-section-head">' +
      '<h3 class="nm-mag-section-title">' + title + '</h3>' +
      (num || subtitle ? '<span class="nm-mag-section-num">' +
        (num ? '<span class="n">' + num + '</span>' : '') +
        (num && subtitle ? ' / ' : '') +
        (subtitle || '') +
      '</span>' : '') +
    '</div>';
  }

  // ──── Magazine: Places (풀 목록만 — 2 컬럼 그리드) ────
  // 이전: 상단 bento 요약 + 하단 풀 목록 → 중복이라 bento 제거, 풀 목록만 유지
  function _renderPlacesMag(places, hiddenPlaces, num) {
    if (!places || !places.length) return '';
    var html = '<section class="nm-mag-section">';
    html += _magSectionHead(num || '01', 'Places to Visit', 'Curated Landmarks');
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:24px">';
    html += _renderPlaces({ title: '랜드마크', icon: 'landscape', items: places });
    if (hiddenPlaces && hiddenPlaces.length) {
      html += _renderPlaces({ title: '숨은 곳', icon: 'explore', items: hiddenPlaces });
    }
    html += '</div>';
    html += '</section>';
    return html;
  }

  // ──── Magazine: Experiences + Nomad Mode Split ────
  function _renderExperiencesSplit(experiences, nomadMode, num) {
    var html = '<section class="nm-mag-section">';
    html += '<div class="nm-edit-grid">';

    // Experiences (7-col)
    html += '<div>';
    html += _magSectionHead(num || '02', 'Experiences', 'Cultural Immersion');
    (experiences || []).forEach(function(exp) {     // 전체 출력 (slice 제거)
      html += '<div class="nm-exp-card">';
      html += '<div class="nm-exp-thumb">';
      if (exp.image) html += '<img src="' + exp.image + '" alt="' + exp.name + '"/>';
      else html += '<span class="material-symbols-outlined">' + (exp.icon || 'spa') + '</span>';
      html += '</div>';
      html += '<div class="nm-exp-body">';
      html += '<div class="nm-exp-title">' + exp.name + '</div>';
      html += '<div class="nm-exp-desc">' + exp.desc + '</div>';   // 풀 desc (HTML 유지)
      if (exp.price || exp.time) {
        html += '<div class="nm-exp-pills">';
        if (exp.time) html += '<span class="nm-exp-pill time">' + exp.time + '</span>';
        if (exp.price) html += '<span class="nm-exp-pill price">' + exp.price + '</span>';
        html += '</div>';                              // pills close
      }
      html += '</div></div>';                          // body close, card close
    });
    html += '</div>';

    // Nomad Mode (5-col)
    html += '<div class="nm-nm-panel">';
    html += '<div style="margin-bottom:24px">';
    html += '<h3 style="font-family:Manrope;font-size:24px;font-weight:700;color:var(--nm-deep-indigo);margin-bottom:6px">Nomad Mode</h3>';
    html += '<p style="font-size:11px;letter-spacing:0.15em;text-transform:uppercase;color:var(--nm-primary);font-weight:700"><span style="color:var(--nm-primary)">' + (num ? num.replace(/[^0-9]/g, '') || '03' : '03') + '</span> / Strategic Productivity</p>';
    html += '</div>';
    (nomadMode || []).forEach(function(block, i) {
      if (i > 0) html += '<div class="nm-nm-divider"></div>';
      html += '<div class="nm-nm-block">';
      html += '<div class="nm-nm-block-head">';
      html += '<span class="material-symbols-outlined">' + (block.icon || 'corporate_fare') + '</span>';
      html += '<span class="nm-nm-block-title">' + block.title + '</span>';
      html += '</div>';
      if (block.desc) html += '<p class="nm-nm-block-desc">' + block.desc + '</p>';
      if (block.badges && block.badges.length) {
        html += '<div class="nm-nm-badges">';
        block.badges.forEach(function(b) {
          html += '<span class="b"><span class="material-symbols-outlined">' + b.icon + '</span>' + b.text + '</span>';
        });
        html += '</div>';
      }
      if (block.list && block.list.length) {
        html += '<ul class="nm-nm-list">';
        block.list.forEach(function(item) {
          html += '<li><span>' + item.name + '</span>' + (item.score ? '<span class="score">' + item.score + '</span>' : '') + '</li>';
        });
        html += '</ul>';
      }
      // string 배열 items (list 타입에서 변환됨, 예: 작업 페이스 4항목)
      if (block.items && block.items.length) {
        html += '<ul class="nm-nm-list" style="margin-top:4px">';
        block.items.forEach(function(it) {
          html += '<li style="display:block;padding:6px 0;line-height:1.5">• ' + it + '</li>';
        });
        html += '</ul>';
      }
      html += '</div>';
    });
    html += '</div>';

    html += '</div></section>';
    return html;
  }

  // ──── Magazine: Budget Breakdown (intensity 바) ────
  function _renderBudgetMag(budget, num) {
    if (!budget) return '';
    var maxVal = 0;
    (budget.rows || []).forEach(function(r) { if (r.value > maxVal) maxVal = r.value; });
    var html = '<section class="nm-mag-section">';
    html += _magSectionHead(num || '03', 'Budget Breakdown', 'Financial Mastery');
    html += '<div style="background:#fff;border:1px solid #f1f5f9;border-radius:16px;overflow:hidden;box-shadow:var(--nm-shadow-card)">';
    html += '<table class="nm-bg-table">';
    // 헤더는 바디 4개 칼럼에 맞춰 고정 (카테고리·세부 합친 cell / EUR / KRW / intensity)
    html += '<thead><tr>' +
      '<th>카테고리</th>' +
      '<th>월 합계 (€)</th>' +
      '<th>원화 환산</th>' +
      '<th style="text-align:right">강도</th>' +
    '</tr></thead>';
    html += '<tbody>';
    (budget.rows || []).forEach(function(r) {
      var intensity = maxVal > 0 ? (r.value / maxVal) : 0;
      html += '<tr>' +
        '<td class="nm-bg-cat">' + r.name +
          (r.sub ? '<div style="font-weight:400;color:var(--nm-text-3);font-size:11px;margin-top:2px;line-height:1.3">' + r.sub + '</div>' : '') +
        '</td>' +
        '<td>' + r.eur + '</td>' +
        '<td class="nm-bg-num">' + r.krw + '</td>' +
        '<td style="text-align:right"><span class="nm-bg-intensity"><span style="width:' + Math.round(intensity * 100) + '%"></span></span></td>' +
      '</tr>';
    });
    html += '</tbody>';
    if (budget.total) {
      html += '<tfoot><tr>' +
        '<td>' + budget.total.name + '</td>' +
        '<td>' + budget.total.eur + '</td>' +
        '<td>' + budget.total.krw + '</td>' +
        '<td style="text-align:right;color:var(--nm-text-3);font-weight:500">' + (budget.total.note || '') + '</td>' +
      '</tr></tfoot>';
    }
    html += '</table></div>';
    html += '</section>';
    return html;
  }

  // ──── Magazine: Why City (마지막 분석 + quote) ────
  // 이미지 있으면 좌 텍스트 + 우 이미지+quote 박스 (2-col)
  // 이미지 없으면 텍스트 단독 + quote는 텍스트 끝에 인디고 카드로
  function _renderWhyCity(why, num) {
    if (!why) return '';
    var hasImage = !!why.image;

    var html = '<section class="nm-mag-section">';
    if (hasImage) {
      html += '<div class="nm-why-grid">';
    }
    // 왼쪽 (또는 단독): 분석 텍스트
    html += '<div>';
    html += '<span class="nm-mag-section-num" style="display:block;margin-bottom:16px"><span class="n">' + (num || '05') + '</span> / The Rationale</span>';
    html += '<h3 style="font-family:Manrope;font-size:36px;font-weight:700;letter-spacing:-0.02em;color:var(--nm-deep-indigo);margin-bottom:24px;line-height:1.1">Why ' + (why.cityName || '?') + '</h3>';
    html += '<div class="nm-why-body">';
    (why.paragraphs || []).forEach(function(p) { html += '<p>' + p + '</p>'; });
    if (why.takeaway) {
      html += '<div class="nm-why-takeaway">';
      html += '<div class="icon-box"><span class="material-symbols-outlined">' + (why.takeaway.icon || 'architecture') + '</span></div>';
      html += '<div><p class="t">' + why.takeaway.title + '</p><p class="s">' + why.takeaway.text + '</p></div>';
      html += '</div>';
    }
    // 이미지 없으면 quote를 인디고 인라인 카드로
    if (!hasImage && why.quote) {
      html += '<div style="margin-top:32px;background:var(--nm-deep-indigo);color:#fff;padding:24px 28px;border-radius:14px;display:flex;gap:16px;align-items:flex-start;max-width:580px">' +
        '<span style="font-size:32px;line-height:1;opacity:0.85">"</span>' +
        '<p style="font-size:14px;line-height:1.6;font-style:italic;opacity:0.95;margin:0">' + why.quote + '</p>' +
      '</div>';
    }
    html += '</div></div>';

    // 오른쪽: 이미지 + 떠있는 quote (이미지 있을 때만)
    if (hasImage) {
      html += '<div class="nm-why-visual">';
      html += '<div class="main-img">';
      html += '<img src="' + why.image + '" alt="' + (why.imageAlt || '') + '"/>';
      html += '</div>';
      if (why.quote) {
        html += '<div class="nm-why-quote">';
        html += '<div class="qmark">"</div>';
        html += '<p>' + why.quote + '</p>';
        html += '</div>';
      }
      html += '</div>';
      html += '</div>'; // /nm-why-grid
    }
    html += '</section>';
    return html;
  }

  // ──── 섹션 렌더러들 ────
  function _renderDivider(s) {
    return '<div class="nm-divider-label">' + s.label + '</div>';
  }

  function _renderPlaces(s) {
    var html = '<div class="nm-card">';
    html += '<div class="nm-section-head" style="margin-bottom:14px">' +
      '<div style="display:flex;align-items:center;gap:8px">' +
        (s.icon ? '<span class="material-symbols-outlined" style="color:var(--nm-primary)">' + s.icon + '</span>' : '') +
        '<h3 class="nm-headline-md">' + s.title + '</h3>' +
      '</div>' +
    '</div>';
    (s.items || []).forEach(function(p) {
      html += '<div class="nm-place-card">' +
        '<div class="nm-place-name">' + p.name + (p.price ? '<span class="nm-place-price">' + p.price + '</span>' : '') + '</div>' +
        '<div class="nm-place-desc">' + p.desc + '</div>' +
      '</div>';
    });
    html += '</div>';
    return html;
  }

  function _renderNeighborhoods(s) {
    var html = '<div class="nm-card">';
    html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">' +
      (s.icon ? '<span class="material-symbols-outlined" style="color:var(--nm-primary)">' + s.icon + '</span>' : '') +
      '<h3 class="nm-headline-md">' + s.title + '</h3>' +
    '</div>';
    (s.items || []).forEach(function(n) {
      var starsHtml = '<span class="nm-stars">' + '★'.repeat(n.stars) + '<span style="opacity:0.25">' + '★'.repeat(5 - n.stars) + '</span></span>';
      html += '<div class="nm-neighborhood-row">' +
        '<div class="nm-nbh-name"><strong>' + n.name + '</strong></div>' +
        '<div>' + starsHtml + '</div>' +
        '<div class="nm-nbh-desc">' + n.desc + '</div>' +
      '</div>';
    });
    html += '</div>';
    return html;
  }

  function _renderTable(s) {
    var html = '<div class="nm-card" style="padding:0;overflow:hidden">';
    html += '<div style="padding:20px 24px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:8px">' +
      (s.icon ? '<span class="material-symbols-outlined" style="color:var(--nm-primary)">' + s.icon + '</span>' : '') +
      '<h3 class="nm-headline-md">' + s.title + '</h3>' +
    '</div>';
    html += '<table class="nm-table">';
    html += '<thead><tr>';
    (s.headers || []).forEach(function(h, i) {
      var isNum = i >= 2; // 보통 3,4번째부터 숫자
      html += '<th' + (isNum && s.headers.length >= 4 ? ' class="nm-num"' : '') + '>' + h + '</th>';
    });
    html += '</tr></thead><tbody>';
    (s.rows || []).forEach(function(row) {
      html += '<tr>';
      row.forEach(function(cell, i) {
        var isNum = i >= 2 && s.headers.length >= 4;
        html += '<td' + (isNum ? ' class="nm-num"' : '') + '>' + cell + '</td>';
      });
      html += '</tr>';
    });
    if (s.footer) {
      html += '<tr style="background:var(--nm-primary-soft);font-weight:700">';
      s.footer.forEach(function(cell, i) {
        var isNum = i >= 2 && s.headers.length >= 4;
        html += '<td' + (isNum ? ' class="nm-num"' : '') + '>' + cell + '</td>';
      });
      html += '</tr>';
    }
    html += '</tbody></table>';
    if (s.note) html += '<div style="padding:12px 24px;font-size:12px;color:var(--nm-text-3);background:var(--nm-surface-container-low)">' + s.note + '</div>';
    html += '</div>';
    return html;
  }

  function _renderList(s) {
    var html = '<div class="nm-card">';
    html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">' +
      (s.icon ? '<span class="material-symbols-outlined" style="color:var(--nm-primary)">' + s.icon + '</span>' : '') +
      '<h3 class="nm-headline-md">' + s.title + '</h3>' +
    '</div>';
    html += '<ul class="nm-list-bullet">';
    (s.items || []).forEach(function(it) { html += '<li>' + it + '</li>'; });
    html += '</ul>';
    html += '</div>';
    return html;
  }

  function _renderLearn(s) {
    var html = '<div class="nm-card">';
    html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:18px">' +
      (s.icon ? '<span class="material-symbols-outlined" style="color:var(--nm-primary)">' + s.icon + '</span>' : '') +
      '<h3 class="nm-headline-md">' + s.title + '</h3>' +
    '</div>';
    (s.items || []).forEach(function(item) {
      html += '<div class="nm-learn-item">' +
        '<h4 class="nm-learn-h">' + item.h + '</h4>' +
        '<p class="nm-learn-body">' + item.body + '</p>' +
        (item.highlight ? '<p class="nm-learn-highlight"><strong>' + item.highlight + '</strong></p>' : '') +
      '</div>';
    });
    html += '</div>';
    return html;
  }

  function _renderTimeline(s) {
    var html = '<div class="nm-card">';
    html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:18px">' +
      (s.icon ? '<span class="material-symbols-outlined" style="color:var(--nm-primary)">' + s.icon + '</span>' : '') +
      '<h3 class="nm-headline-md">' + s.title + '</h3>' +
    '</div>';
    html += '<div style="position:relative;padding-left:24px;border-left:2px solid var(--nm-primary-soft)">';
    (s.items || []).forEach(function(t) {
      var bodyText = t.text || t.body || '';
      html += '<div style="position:relative;margin-bottom:18px;padding:14px 16px;background:var(--nm-surface-container-low);border-radius:8px">' +
        '<div style="position:absolute;left:-32px;top:18px;width:12px;height:12px;border-radius:50%;background:var(--nm-primary);border:3px solid #fff;box-shadow:0 0 0 1px var(--nm-primary)"></div>' +
        '<div style="font-family:Manrope;font-size:11px;font-weight:700;color:var(--nm-primary);letter-spacing:0.05em;text-transform:uppercase;margin-bottom:2px">' + t.when + '</div>' +
        '<div style="font-family:Manrope;font-size:15px;font-weight:600;color:var(--nm-deep-indigo);margin-bottom:4px">' + t.title + '</div>' +
        '<p style="font-size:13px;color:var(--nm-text-2);line-height:1.5">' + bodyText + '</p>' +
      '</div>';
    });
    html += '</div>';
    html += '</div>';
    return html;
  }

  function _renderSubsections(s) {
    var html = '<div class="nm-card">';
    html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:18px">' +
      (s.icon ? '<span class="material-symbols-outlined" style="color:var(--nm-primary)">' + s.icon + '</span>' : '') +
      '<h3 class="nm-headline-md">' + s.title + '</h3>' +
    '</div>';
    var groups = s.items || s.groups || [];
    groups.forEach(function(sub) {
      html += '<div style="margin-bottom:16px">';
      html += '<h4 style="font-family:Manrope;font-size:14px;font-weight:700;color:var(--nm-deep-indigo);margin-bottom:8px">' + sub.h + '</h4>';
      html += '<ul class="nm-list-bullet">';
      (sub.items || []).forEach(function(it) { html += '<li>' + it + '</li>'; });
      html += '</ul>';
      html += '</div>';
    });
    html += '</div>';
    return html;
  }

  function _renderNote(s) {
    var color = s.color || 'var(--nm-primary)';
    var html = '<div class="nm-card" style="border-left:3px solid ' + color + '">';
    if (s.title) {
      html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">' +
        (s.icon ? '<span class="material-symbols-outlined" style="color:' + color + '">' + s.icon + '</span>' : '') +
        '<h3 class="nm-headline-md" style="color:' + color + '">' + s.title + '</h3>' +
      '</div>';
    }
    if (s.body) {
      html += '<p style="font-size:14px;color:var(--nm-text-2);line-height:1.6;margin-bottom:14px">' + s.body + '</p>';
    }
    var subs = s.subsections || [];
    subs.forEach(function(sub) {
      html += '<div style="margin-top:14px">';
      html += '<h4 style="font-family:Manrope;font-size:13px;font-weight:700;color:var(--nm-deep-indigo);margin-bottom:6px">' + sub.h + '</h4>';
      html += '<ul class="nm-list-bullet">';
      (sub.items || []).forEach(function(it) { html += '<li>' + it + '</li>'; });
      html += '</ul>';
      html += '</div>';
    });
    html += '</div>';
    return html;
  }

  var SECTION_RENDERERS = {
    divider:       _renderDivider,
    places:        _renderPlaces,
    neighborhoods: _renderNeighborhoods,
    table:         _renderTable,
    list:          _renderList,
    learn:         _renderLearn,
    timeline:      _renderTimeline,
    subsections:   _renderSubsections,
    note:          _renderNote,
  };

  // ──── 도시 페이지 렌더 (Stitch 매거진 스타일 v2) ────
  // ════════════════════════════════════════════════════════════════════
  // City Guide v2 — Stitch Editorial 디자인 (Playfair Display serif)
  // 모든 17개 도시에 자동 적용 (renderer 1개 → 도시 데이터 sections 자동 매핑)
  // ════════════════════════════════════════════════════════════════════

  // 국가 코드 추출 (이모지 국기 + 한글 → 코드)
  function _cityCountryCode(hero) {
    var c = hero.country || '';
    if (c.indexOf('포르투갈') >= 0 || c.indexOf('Portugal') >= 0) return 'pt';
    if (c.indexOf('아일랜드') >= 0 || c.indexOf('Ireland') >= 0)  return 'ie';
    if (c.indexOf('덴마크') >= 0 || c.indexOf('Denmark') >= 0)    return 'dk';
    if (c.indexOf('노르웨이') >= 0 || c.indexOf('Norway') >= 0)   return 'no';
    if (c.indexOf('스웨덴') >= 0 || c.indexOf('Sweden') >= 0)     return 'se';
    if (c.indexOf('핀란드') >= 0 || c.indexOf('Finland') >= 0)    return 'fi';
    if (c.indexOf('아이슬란드') >= 0 || c.indexOf('Iceland') >= 0) return 'is';
    if (c.indexOf('말타') >= 0 || c.indexOf('Malta') >= 0)        return 'mt';
    if (c.indexOf('호주') >= 0 || c.indexOf('Australia') >= 0)    return 'au';
    if (c.indexOf('뉴질랜드') >= 0 || c.indexOf('New Zealand') >= 0) return 'nz';
    if (c.indexOf('미국') >= 0 || c.indexOf('USA') >= 0)          return 'us';
    if (c.indexOf('캐나다') >= 0 || c.indexOf('Canada') >= 0)     return 'ca';
    return '';
  }

  // ──── v3 Hero — Full-bleed image/gradient + Glass Stats ────
  function _renderCityHeroV2(h, monthLabel) {
    var code = _cityCountryCode(h);
    var cityKr = (h.city || '').replace(/[\u{1F1E6}-\u{1F1FF}]{2}/gu, '').trim();

    var html = '<section class="nm-city-v2-hero">';
    // 배경: 이미지 있으면 img, 없으면 그라데이션 fallback
    html += '<div class="nm-city-v2-hero-bg">';
    if (h.image) {
      html += '<img src="' + h.image + '" alt="' + (h.imageAlt || cityKr) + '"/>';
    } else {
      html += '<div class="nm-city-v2-hero-bg-fallback"></div>';
    }
    html += '</div>';
    // 컨텐츠 (어두운 오버레이는 ::after 의사 요소가 처리)
    html += '<div class="nm-city-v2-hero-inner">';
    // eyebrow
    html += '<span class="nm-city-v2-eyebrow">City Guide · ' + (monthLabel || '') + (h.country ? ' · ' + h.country : '') + '</span>';
    // headline (sans-serif)
    html += '<h1 class="nm-city-v2-h1">' +
      (code ? '<span class="nm-city-v2-h1-code">' + code + '</span>' : '') +
      cityKr +
    '</h1>';
    // tagline + quote
    if (h.tagline) html += '<p class="nm-city-v2-tagline">' + h.tagline + '</p>';
    if (h.quote) html += '<p class="nm-city-v2-quote">"' + h.quote + '"</p>';
    // Glass Stats 5-card
    html += '<div class="nm-city-v2-stats">';
    var stats = [
      { label:'체류 기간', value:h.dates },
      { label:'날씨',     value:h.weather },
      { label:'비자',     value:h.visa },
      { label:'모드',     value:h.mode },
      { label:'분위기',   value:h.vibe },
    ];
    stats.forEach(function(s) {
      if (!s.value) return;
      html += '<div class="nm-city-v2-stat"><p class="nm-city-v2-stat-label">' + s.label + '</p>' +
        '<p class="nm-city-v2-stat-value">' + s.value + '</p></div>';
    });
    html += '</div>';
    html += '</div>';
    html += '</section>';
    return html;
  }

  // ──── v2 Quick Highlights (deep-indigo) ────
  function _renderCityHighlightsV2(meaning) {
    if (!meaning || !meaning.length) return '';
    var html = '<section class="nm-city-v2-section">';
    html += '<div class="nm-city-v2-highlights">';
    html += '<h3 class="nm-city-v2-highlights-h"><span class="material-symbols-outlined">auto_awesome</span>누리한테 의미하는 것</h3>';
    html += '<ul class="nm-city-v2-highlights-list">';
    meaning.forEach(function(m) {
      html += '<li><span class="material-symbols-outlined">check_circle</span><span>' + m + '</span></li>';
    });
    html += '</ul>';
    html += '</div>';
    html += '</section>';
    return html;
  }

  // ──── v2 Landmarks + Hidden Spots (2-col asymmetric) ────
  function _renderCityPlacesV2(landmarks, hidden) {
    if (!landmarks || !landmarks.length) return '';
    var html = '<section class="nm-city-v2-section nm-city-v2-places">';

    // LEFT: Landmarks (큰 카드 stack)
    html += '<div class="nm-city-v2-places-col">';
    html += '<h2 class="nm-city-v2-h2"><span class="nm-city-v2-num">01</span>랜드마크 · 꼭 가볼 곳</h2>';
    html += '<div class="nm-city-v2-landmark-stack">';
    landmarks.forEach(function(p, i) {
      // 자동 pill: index 0 = Iconic / 1 = Heritage / 2 = View / etc.
      var pills = ['Iconic', 'Heritage', 'View', 'Hidden', 'Local', 'Modern', 'Classic'];
      var pillLabel = p.price || pills[i % pills.length];
      html += '<article class="nm-city-v2-landmark">';
      html += '<div class="nm-city-v2-landmark-head">' +
        '<h4>' + p.name + '</h4>' +
        '<span class="nm-city-v2-landmark-pill">' + pillLabel + '</span>' +
      '</div>';
      if (p.desc) html += '<p>' + p.desc + '</p>';
      html += '</article>';
    });
    html += '</div>';
    html += '</div>';

    // RIGHT: Hidden Spots (작은 row stack)
    if (hidden && hidden.length) {
      html += '<div class="nm-city-v2-places-col">';
      html += '<h2 class="nm-city-v2-h2"><span class="nm-city-v2-num">02</span>슬로우 · 숨겨진 명소</h2>';
      html += '<div class="nm-city-v2-hidden-stack">';
      hidden.forEach(function(p) {
        html += '<div class="nm-city-v2-hidden-row">' +
          '<div><h4>' + p.name + '</h4>' + (p.desc ? '<p>' + p.desc + '</p>' : '') + '</div>' +
          '<span class="material-symbols-outlined">arrow_forward_ios</span>' +
        '</div>';
      });
      html += '</div>';
      html += '</div>';
    }

    html += '</section>';
    return html;
  }

  // ──── v2 Neighborhoods (별점 테이블) ────
  function _renderCityNeighborhoodsV2(neighborhoods) {
    if (!neighborhoods || !neighborhoods.items || !neighborhoods.items.length) return '';
    var html = '<section class="nm-city-v2-section">';
    html += '<div class="nm-city-v2-card-wrap">';
    html += '<h2 class="nm-city-v2-h2"><span class="material-symbols-outlined">location_on</span>Neighborhood Ratings · 거주 적합성</h2>';
    html += '<div class="nm-city-v2-table-wrap">';
    html += '<table class="nm-city-v2-table"><thead><tr>' +
      '<th>Area Name</th><th>Rating</th><th>Summary</th>' +
    '</tr></thead><tbody>';
    neighborhoods.items.forEach(function(n) {
      var stars = (n.stars || '').toString();
      var filled = (stars.match(/★/g) || []).length;
      var empty = 5 - filled;
      var starHtml = '';
      for (var i = 0; i < filled; i++) starHtml += '<span class="material-symbols-outlined nm-city-v2-star">star</span>';
      for (var j = 0; j < empty; j++) starHtml += '<span class="material-symbols-outlined nm-city-v2-star-empty">star</span>';
      html += '<tr><td class="nm-city-v2-area-name">' + n.name + '</td>' +
        '<td><div class="nm-city-v2-stars">' + starHtml + '</div></td>' +
        '<td>' + (n.desc || '') + '</td></tr>';
    });
    html += '</tbody></table>';
    html += '</div>';
    html += '</div>';
    html += '</section>';
    return html;
  }

  // ──── v2 Experiences (3-color cards, auto-rotating) ────
  function _renderCityExperiencesV2(experiencesSections) {
    if (!experiencesSections || !experiencesSections.length) return '';
    var colors = [
      { bg:'#eef2ff', border:'#e0e7ff', iconBg:'#4f46e5', iconShadow:'rgba(79,70,229,0.25)', titleColor:'#1e1b4b', subColor:'#3730a3', noteColor:'#4338ca' },
      { bg:'#fffbeb', border:'#fef3c7', iconBg:'#d97706', iconShadow:'rgba(217,119,6,0.25)',  titleColor:'#451a03', subColor:'#92400e', noteColor:'#b45309' },
      { bg:'#fff1f2', border:'#ffe4e6', iconBg:'#e11d48', iconShadow:'rgba(225,29,72,0.25)',  titleColor:'#4c0519', subColor:'#9f1239', noteColor:'#be123c' },
      { bg:'#ecfdf5', border:'#d1fae5', iconBg:'#059669', iconShadow:'rgba(5,150,105,0.25)',  titleColor:'#022c22', subColor:'#065f46', noteColor:'#047857' },
    ];
    var html = '<section class="nm-city-v2-section">';
    html += '<h2 class="nm-city-v2-h2 nm-city-v2-h2-serif"><span class="material-symbols-outlined">stars</span>Experiences <span class="nm-city-v2-h2-sub">경험</span></h2>';
    html += '<div class="nm-city-v2-exp-grid">';
    experiencesSections.forEach(function(sec, idx) {
      var c = colors[idx % colors.length];
      html += '<div class="nm-city-v2-exp-card" style="background:' + c.bg + ';border-color:' + c.border + '">';
      html += '<div class="nm-city-v2-exp-icon" style="background:' + c.iconBg + ';box-shadow:0 8px 16px ' + c.iconShadow + '">' +
        '<span class="material-symbols-outlined">' + (sec.icon || 'star') + '</span>' +
      '</div>';
      html += '<h3 class="nm-city-v2-exp-h" style="color:' + c.titleColor + '">' + sec.title + '</h3>';
      html += '<div class="nm-city-v2-exp-items">';
      (sec.items || []).forEach(function(item) {
        html += '<div class="nm-city-v2-exp-item">';
        html += '<div class="nm-city-v2-exp-item-head">' +
          '<h4 style="color:' + c.subColor + '">' + item.name + '</h4>' +
          (item.price ? '<span class="nm-city-v2-exp-price" style="color:' + c.noteColor + ';background:rgba(255,255,255,0.6)">' + item.price + '</span>' : '') +
        '</div>';
        if (item.desc) html += '<p>' + item.desc + '</p>';
        html += '</div>';
      });
      html += '</div>';
      html += '</div>';
    });
    html += '</div>';
    html += '</section>';
    return html;
  }

  // ──── v2 Nomad Mode (3-col: Coworking / Cafes / Libraries) ────
  function _renderCityNomadModeV2(nomadSections) {
    if (!nomadSections || !nomadSections.length) return '';

    // 키워드별 분류
    var cowork = [], cafe = [], lib = [], misc = [];
    nomadSections.forEach(function(s) {
      var t = (s.title || '').toLowerCase();
      if (/코워킹|cowork|coworking|work|운영/i.test(t)) cowork.push(s);
      else if (/카페|cafe|coffee|커피|fika|로스터|roaster/i.test(t)) cafe.push(s);
      else if (/도서관|library/i.test(t)) lib.push(s);
      else misc.push(s);
    });

    var columns = [
      { icon:'desktop_mac', label:'Coworking',          sections:cowork },
      { icon:'coffee',      label:'Work-friendly Cafes', sections:cafe },
      { icon:'menu_book',   label:'Libraries',           sections:lib },
    ];
    if (misc.length) columns.push({ icon:'event_note', label:'Other', sections:misc });

    var html = '<section class="nm-city-v2-section">';
    html += '<div class="nm-city-v2-nomad-head">';
    html += '<h2 class="nm-city-v2-h2-serif-large">Nomad Mode <span class="nm-city-v2-h2-sub">노마드 모드</span></h2>';
    html += '<div class="nm-city-v2-nomad-divider"></div>';
    html += '</div>';
    html += '<div class="nm-city-v2-nomad-grid">';
    columns.forEach(function(col) {
      if (!col.sections.length) return;
      html += '<div class="nm-city-v2-nomad-col">';
      html += '<h3 class="nm-city-v2-nomad-col-h"><span class="material-symbols-outlined">' + col.icon + '</span>' + col.label + '</h3>';
      col.sections.forEach(function(sec) {
        (sec.items || []).forEach(function(item) {
          html += '<div class="nm-city-v2-nomad-card">';
          html += '<div class="nm-city-v2-nomad-card-head"><h4>' + item.name + '</h4>' +
            (item.price ? '<span class="nm-city-v2-nomad-card-price">' + item.price + '</span>' : '') +
          '</div>';
          if (item.desc) html += '<p>' + item.desc + '</p>';
          html += '</div>';
        });
      });
      html += '</div>';
    });
    html += '</div>';
    html += '</section>';
    return html;
  }

  // ──── v2 People & Networking (deep-indigo glassmorphic) ────
  function _renderCityPeopleV2(peopleSections, timeline) {
    if (!peopleSections.length && !timeline) return '';
    var html = '<section class="nm-city-v2-section">';
    html += '<div class="nm-city-v2-people">';
    html += '<div class="nm-city-v2-people-deco"><span class="material-symbols-outlined">groups</span></div>';
    html += '<div class="nm-city-v2-people-inner">';

    // LEFT
    html += '<div class="nm-city-v2-people-left">';
    html += '<h2 class="nm-city-v2-people-h">People &amp; Networking</h2>';
    peopleSections.forEach(function(sec) {
      // subsections 타입 처리
      var groups = sec.items || sec.groups || [];
      groups.forEach(function(g) {
        html += '<div class="nm-city-v2-people-group">';
        html += '<h4 class="nm-city-v2-people-group-h">' + (g.h || '') + '</h4>';
        html += '<ul class="nm-city-v2-people-list">';
        (g.items || []).forEach(function(it) {
          html += '<li><span class="material-symbols-outlined">group</span><span>' + it + '</span></li>';
        });
        html += '</ul>';
        html += '</div>';
      });
    });
    html += '</div>';

    // RIGHT (glassmorphic): timeline 또는 부가 정보
    if (timeline && timeline.items && timeline.items.length) {
      html += '<div class="nm-city-v2-people-right">';
      html += '<h3 class="nm-city-v2-people-right-h">' + (timeline.title || '누리한테 자연스러운 사교 루트') + '</h3>';
      timeline.items.forEach(function(t, i) {
        html += '<div class="nm-city-v2-people-step">' +
          '<span class="nm-city-v2-people-step-num">' + (i + 1) + '</span>' +
          '<div>' +
            '<p class="nm-city-v2-people-step-h">' + (t.when || '') + (t.title ? ' · ' + t.title : '') + '</p>' +
            '<p class="nm-city-v2-people-step-text">' + (t.text || t.body || '') + '</p>' +
          '</div>' +
        '</div>';
      });
      html += '</div>';
    }

    html += '</div>';
    html += '</div>';
    html += '</section>';
    return html;
  }

  // ──── v2 Budget (proper table with € + ₩) ────
  function _renderCityBudgetV2(budgetData) {
    if (!budgetData || !budgetData.rows || !budgetData.rows.length) return '';
    var html = '<section class="nm-city-v2-section">';
    html += '<div class="nm-city-v2-card-wrap">';
    html += '<h2 class="nm-city-v2-h2"><span class="material-symbols-outlined">payments</span>1달 생활비 예산 · 최소 가이드</h2>';
    html += '<div class="nm-city-v2-table-wrap">';
    html += '<table class="nm-city-v2-budget-table"><thead><tr>' +
      '<th>카테고리</th><th>세부 내역</th><th>월 합계 (€)</th><th>원화 환산 (₩)</th>' +
    '</tr></thead><tbody>';
    budgetData.rows.forEach(function(r) {
      html += '<tr><td class="nm-city-v2-budget-cat">' + r.name + '</td>' +
        '<td class="nm-city-v2-budget-sub">' + (r.sub || '') + '</td>' +
        '<td class="nm-city-v2-budget-num">' + r.eur + '</td>' +
        '<td class="nm-city-v2-budget-num">' + r.krw + '</td></tr>';
    });
    if (budgetData.total) {
      html += '<tr class="nm-city-v2-budget-total"><td>1달 합계</td>' +
        '<td>' + (budgetData.total.note ? '<span class="nm-city-v2-budget-note">' + budgetData.total.note + '</span>' : '(숙소 제외)') + '</td>' +
        '<td class="nm-city-v2-budget-num">' + budgetData.total.eur + '</td>' +
        '<td class="nm-city-v2-budget-num">' + budgetData.total.krw + '</td></tr>';
    }
    html += '</tbody></table>';
    html += '</div>';
    html += '<p class="nm-city-v2-budget-footnote">※ 위 금액은 숙소비 제외한 순수 생활비. 숙소는 거주 형태에 따라 별도.</p>';
    html += '</div>';
    html += '</section>';
    return html;
  }

  // ──── v2 Closing Focus (2-col numbered) ────
  function _renderCityFocusV2(focusSections) {
    if (!focusSections.length) return '';
    var html = '<section class="nm-city-v2-section nm-city-v2-focus-section">';
    html += '<h3 class="nm-city-v2-focus-eyebrow">Next Step Focus · 핵심</h3>';
    html += '<div class="nm-city-v2-focus-grid">';
    focusSections.forEach(function(sec) {
      (sec.items || []).forEach(function(item, idx) {
        // h에서 번호 추출 (예: "1. ..." 또는 "1)" )
        var match = (item.h || '').match(/^(\d+)/);
        var num = match ? match[1] : (idx + 1);
        var title = (item.h || '').replace(/^\d+[\.\)]\s*/, '');
        html += '<div class="nm-city-v2-focus-item">';
        html += '<div class="nm-city-v2-focus-num">' + num + '</div>';
        html += '<div><h4>' + title + '</h4><p>' + (item.body || '') + '</p></div>';
        html += '</div>';
      });
    });
    html += '</div>';
    html += '</section>';
    return html;
  }

  // ──── v2 Deep Dive (기타 raw 섹션: timeline 제외, learn from LEARN, list, table, note, places 추가 등) ────
  function _renderCityDeepDiveV2(rawSections) {
    if (!rawSections.length) return '';
    var html = '<section class="nm-city-v2-section">';
    html += '<h3 class="nm-city-v2-focus-eyebrow">Deep Dive · Local Intelligence</h3>';
    html += '<div class="nm-city-v2-deep-grid">';
    rawSections.forEach(function(s) {
      var renderer = SECTION_RENDERERS[s.type];
      if (renderer) {
        html += '<div class="nm-city-v2-deep-card">' + renderer(s) + '</div>';
      }
    });
    html += '</div>';
    html += '</section>';
    return html;
  }

  // ════════════════════════════════════════════════════════════════════
  // renderCity v2 — 메인 디스패처
  // ════════════════════════════════════════════════════════════════════
  function renderCity(cityId) {
    var cities = window.NOMAD_CITIES || {};
    var city = cities[cityId];
    if (!city) {
      var label = cityId;
      (DATA.NAV || []).forEach(function(g) {
        (g.items || []).forEach(function(i) { if (i.id === cityId) label = i.label; });
      });
      return placeholderPage(cityId, label);
    }

    var sections = city.sections || [];
    var currentDividerLabel = '';
    var landmarks = null, hiddenSpots = null;
    var neighborhoods = null;
    var experiencesSections = [];
    var nomadSections = [];
    var peopleSections = [];
    var peopleTimeline = null;
    var budgetData = null;
    var focusSections = [];
    var deepSections = [];

    sections.forEach(function(s) {
      if (s.type === 'divider') {
        currentDividerLabel = s.label;
        return;
      }
      var inPlaces = /PLACES/i.test(currentDividerLabel);
      var inExperiences = /EXPERIENCES/i.test(currentDividerLabel);
      var inLearn = /LEARN/i.test(currentDividerLabel);
      var inNomadMode = /NOMAD MODE/i.test(currentDividerLabel);
      var inPeople = /PEOPLE/i.test(currentDividerLabel);
      var inBudget = /BUDGET/i.test(currentDividerLabel);
      var inFocus = /FOCUS/i.test(currentDividerLabel);

      if (s.type === 'places' && inPlaces) {
        if (!landmarks) landmarks = s.items;
        else if (!hiddenSpots) hiddenSpots = s.items;
        else deepSections.push(s);
      } else if (s.type === 'neighborhoods' && inPlaces) {
        neighborhoods = s;
      } else if (s.type === 'neighborhoods') {
        // 다른 divider 안에 있더라도 neighborhoods는 별도 섹션
        neighborhoods = s;
      } else if ((s.type === 'places' || s.type === 'list' || s.type === 'table' || s.type === 'note') && inExperiences) {
        experiencesSections.push(s);
      } else if ((s.type === 'places' || s.type === 'list' || s.type === 'note') && inNomadMode) {
        nomadSections.push(s);
      } else if (s.type === 'subsections' && inPeople) {
        peopleSections.push(s);
      } else if (s.type === 'timeline' && inPeople) {
        peopleTimeline = s;
      } else if (s.type === 'table' && inBudget) {
        budgetData = {
          rows: (s.rows || []).map(function(row) {
            var eurStr = row[2] ? row[2].toString() : '';
            return {
              name: (row[0] || '').replace(/<[^>]+>/g, ''),
              sub: (row[1] || '').replace(/<[^>]+>/g, ''),
              eur: eurStr,
              krw: (row[3] || '').toString().replace(/<[^>]+>/g, ''),
            };
          }),
          total: s.footer ? {
            eur: (s.footer[2] || '').toString().replace(/<[^>]+>/g, ''),
            krw: (s.footer[3] || '').toString().replace(/<[^>]+>/g, ''),
            note: s.note
          } : null
        };
      } else if (s.type === 'budget' && inBudget) {
        budgetData = {
          rows: (s.rows || []).map(function(r) {
            return {
              name: (r.name || '').replace(/<[^>]+>/g, ''),
              sub: (r.sub || '').replace(/<[^>]+>/g, ''),
              eur: (r.eur || ''),
              krw: (r.krw || ''),
            };
          }),
          total: s.total ? {
            eur: (s.total.eur || ''),
            krw: (s.total.krw || ''),
            note: s.note
          } : null
        };
      } else if (s.type === 'learn' && inFocus) {
        focusSections.push(s);
      } else {
        // LEARN의 learn, 다른 timeline, daytrips table, 추가 list 등
        deepSections.push(s);
      }
    });

    var html = '';
    html += '<div class="nm-city-v2-page">';

    // 1. Hero (Playfair serif + Quick Stats)
    html += _renderCityHeroV2(city.hero, city.monthLabel);

    // 2. Quick Highlights (deep-indigo)
    html += _renderCityHighlightsV2(city.meaning);

    // 3. Landmarks + Hidden Spots (2-col asymmetric)
    html += _renderCityPlacesV2(landmarks, hiddenSpots);

    // 4. Neighborhood Ratings (별점 테이블)
    html += _renderCityNeighborhoodsV2(neighborhoods);

    // 5. Experiences (3-color)
    html += _renderCityExperiencesV2(experiencesSections);

    // 6. Nomad Mode (3-col)
    html += _renderCityNomadModeV2(nomadSections);

    // 7. People & Networking (deep-indigo + glassmorphic)
    html += _renderCityPeopleV2(peopleSections, peopleTimeline);

    // 8. Deep Dive (LEARN + 기타)
    html += _renderCityDeepDiveV2(deepSections);

    // 9. Budget (table)
    html += _renderCityBudgetV2(budgetData);

    // 10. Closing Focus (2-col numbered)
    html += _renderCityFocusV2(focusSections);

    // 11. Footer
    html += '<footer class="nm-city-v2-footer">' +
      '<div><h2 class="nm-city-v2-footer-h">Nomad Master Edition</h2>' +
      '<p>1년 노마드 · 17 도시 · 누리 안목 한 권</p></div>' +
      '<div class="nm-city-v2-footer-meta">' + (city.monthLabel || '') + ' · ' + (city.hero && city.hero.country || '') + '</div>' +
    '</footer>';

    html += '</div>'; // /nm-city-v2-page
    return html;
  }

  // 17개 도시 ID에 일괄 등록 (데이터 있으면 renderCity, 없으면 placeholder)
  (DATA.NAV || []).forEach(function(group) {
    if (group.group !== 'City Guides') return;
    (group.items || []).forEach(function(item) {
      registerPage(item.id, function() { return renderCity(item.id); });
    });
  });

  // ──────── Sub-sidebar 빌더 ────────
  // NAV → 페이지 내부 좌측 sub-nav HTML
  function buildSubSidebar() {
    var container = document.getElementById('nomad-subnav-body');
    if (!container) return;
    var openGroups = {};
    try {
      var raw = localStorage.getItem('nomad_subnav_open');
      if (raw) openGroups = JSON.parse(raw);
    } catch(e){}
    // City Guides 기본 접힘, 나머지 기본 펼침
    var html = '';
    (DATA.NAV || []).forEach(function(group, gi) {
      var isOpen = openGroups[group.group] !== undefined
        ? openGroups[group.group]
        : (group.group !== 'City Guides');
      html += '<div class="nm-subnav-group ' + (isOpen ? 'is-open' : '') + '" data-group="' + group.group + '">';
      html += '<div class="nm-subnav-group-head" onclick="NOMAD_PAGES.toggleGroup(\'' + group.group + '\')">';
      html += '<span class="nm-subnav-group-label">' + group.group + '</span>';
      html += '<span class="material-symbols-outlined nm-subnav-chevron">expand_more</span>';
      html += '</div>';
      html += '<div class="nm-subnav-items">';
      (group.items || []).forEach(function(item) {
        html += '<a class="nm-subnav-item" data-page="' + item.id + '" ' +
          'onclick="NOMAD_PAGES.go(\'' + item.id + '\'); return false;" href="#">' +
          '<span class="material-symbols-outlined">' + item.icon + '</span>' +
          '<span>' + item.label + '</span>' +
        '</a>';
      });
      html += '</div>';
      html += '</div>';
    });
    container.innerHTML = html;
    // 현재 활성 페이지 강조
    if (currentSubPage) markActive(currentSubPage);
  }

  function toggleGroup(groupName) {
    var el = document.querySelector('.nm-subnav-group[data-group="' + groupName + '"]');
    if (!el) return;
    el.classList.toggle('is-open');
    // 상태 저장
    var openGroups = {};
    try {
      var raw = localStorage.getItem('nomad_subnav_open');
      if (raw) openGroups = JSON.parse(raw);
    } catch(e){}
    openGroups[groupName] = el.classList.contains('is-open');
    try { localStorage.setItem('nomad_subnav_open', JSON.stringify(openGroups)); } catch(e){}
  }

  function markActive(subPageId) {
    document.querySelectorAll('#nomad-subnav-body .nm-subnav-item').forEach(function(el) {
      el.classList.remove('active');
    });
    var activeEl = document.querySelector('#nomad-subnav-body .nm-subnav-item[data-page="' + subPageId + '"]');
    if (activeEl) {
      activeEl.classList.add('active');
      // 활성 항목이 속한 그룹이 접혀있으면 펼치기
      var groupEl = activeEl.closest('.nm-subnav-group');
      if (groupEl && !groupEl.classList.contains('is-open')) {
        groupEl.classList.add('is-open');
      }
    }
  }

  // ──────── Sub-page 라우팅 ────────
  // 페이지 내부 항목 클릭 시 호출. URL은 안 바뀌고 #nomad-content만 교체.
  function go(subPageId) {
    if (!subPageId) return;
    currentSubPage = subPageId;
    var content = document.getElementById('nomad-content');
    if (content) {
      content.innerHTML = renderPage(subPageId);
      content.scrollTop = 0;
    }
    var mainEl = document.querySelector('.nomad-page .nm-main');
    if (mainEl) mainEl.scrollTop = 0;
    window.scrollTo(0, 0);
    markActive(subPageId);
    // localStorage에 마지막 sub-page 기억
    try { localStorage.setItem('nomad_last_sub_page', subPageId); } catch(e){}
    // 헤더 타이틀 업데이트
    var label = subPageId;
    (DATA.NAV || []).forEach(function(g) {
      (g.items || []).forEach(function(i) { if (i.id === subPageId) label = i.label; });
    });
    var titleEl = document.getElementById('page-title');
    if (titleEl) titleEl.textContent = 'Nomad · ' + label;
  }

  // 페이지 진입 시 호출 (navigate('nomad-master') 안에서)
  function enter() {
    buildSubSidebar();
    var lastPage = null;
    try { lastPage = localStorage.getItem('nomad_last_sub_page'); } catch(e){}
    var startPage = lastPage || 'nomad-overview';
    // 항목이 실제로 존재하는지 확인
    if (!renderers[startPage]) startPage = 'nomad-overview';
    go(startPage);
  }

  return {
    renderPage: renderPage,
    registerPage: registerPage,
    pageHeader: pageHeader,
    buildSubSidebar: buildSubSidebar,
    toggleGroup: toggleGroup,
    go: go,
    enter: enter,
  };
})();
