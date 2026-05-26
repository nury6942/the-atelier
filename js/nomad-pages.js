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

    var html = '';
    html += pageHeader('Global Expedition Plan', '12-Month Voyage',
      '6개 대륙 · 17개 도시 · 셰겐 84/90일 한도 안');

    // 헤더 통계 카드 2개
    html += '<section class="nm-section">';
    html += '<div class="nm-grid nm-grid-2" style="margin-bottom:32px">';
    html += '<div style="background:var(--nm-primary-soft);padding:24px;border-radius:12px">' +
      '<p class="nm-label-sm" style="margin-bottom:8px">총 예산 (1년)</p>' +
      '<p style="font-family:Manrope;font-size:28px;font-weight:700;color:var(--nm-deep-indigo)">' + fmtMan(grandTotal) + '</p>' +
      '<p style="font-size:11px;color:var(--nm-text-3);margin-top:6px">월별 ' + fmtMan(totalBudget) + ' + 일회성 ' + fmtMan(grandTotal - totalBudget) + '</p>' +
    '</div>';
    html += '<div style="background:var(--nm-surface-container-high);padding:24px;border-radius:12px">' +
      '<p class="nm-label-sm" style="margin-bottom:8px">셰겐 일수 (90일 한도)</p>' +
      '<p style="font-family:Manrope;font-size:28px;font-weight:700;color:' + (schengenDays > 90 ? '#b91c1c' : 'var(--nm-tertiary)') + '">' + schengenDays + ' / 90</p>' +
      '<div style="margin-top:8px;height:4px;background:rgba(255,255,255,0.5);border-radius:99px;overflow:hidden">' +
        '<div style="height:100%;width:' + Math.min(100, (schengenDays/90)*100) + '%;background:' + (schengenDays > 90 ? '#b91c1c' : 'var(--nm-tertiary)') + '"></div>' +
      '</div>' +
    '</div>';
    html += '</div>';

    // Voyage 테이블
    html += '<div class="nm-card" style="padding:0;overflow:hidden">';
    html += '<table class="nm-table">';
    html += '<thead><tr>' +
      '<th style="width:90px">시기</th>' +
      '<th>도시</th>' +
      '<th>상세</th>' +
      '<th>비자 / 셰겐</th>' +
      '<th class="nm-num">예산</th>' +
      '<th>모드</th>' +
    '</tr></thead>';
    html += '<tbody>';
    voyage.forEach(function(v) {
      var schengenPill = (v.schengen !== 'X' && v.schengen !== '외' && v.schengen !== '셰겐 외')
        ? '<span class="nm-pill" style="margin-left:4px;background:#fff7ed;color:#c2410c">' + v.schengen + '</span>'
        : '';
      var yearLabel = v.year === 2028 ? '' : '\'29 ';
      html += '<tr>' +
        '<td><strong style="color:var(--nm-primary);font-size:13px">' + yearLabel + v.month + '</strong></td>' +
        '<td>' +
          '<div style="display:flex;align-items:center;gap:8px">' +
            '<span style="width:6px;height:6px;border-radius:50%;background:var(--nm-soft-accent)"></span>' +
            '<div>' +
              '<div style="font-family:Manrope;font-weight:600;color:var(--nm-on-surface);font-size:14px">' + v.city + '</div>' +
            '</div>' +
          '</div>' +
        '</td>' +
        '<td style="font-size:12px;color:var(--nm-text-2);max-width:280px">' + v.detail + '</td>' +
        '<td>' +
          '<span class="nm-pill" style="' + visaPillClass(v.visa) + '">' + v.visa + '</span>' +
          schengenPill +
        '</td>' +
        '<td class="nm-num"><strong>₩' + v.cost + '만</strong></td>' +
        '<td style="font-size:12px;color:var(--nm-text-3)">' + v.mode + '</td>' +
      '</tr>';
    });
    html += '</tbody></table>';
    html += '</div>';
    html += '</section>';

    // ────── 2-col: 마일리지 활용 + 엄마 합류 후보 ──────
    html += '<div class="nm-grid nm-grid-2">';

    // 마일리지 활용
    html += '<div class="nm-card">' +
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">' +
        '<span class="material-symbols-outlined" style="color:var(--nm-primary)">flight_takeoff</span>' +
        '<h3 class="nm-headline-md">마일리지 활용</h3>' +
      '</div>' +
      '<ul class="nm-list-bullet">' +
        '<li>인천 → 리스본 (출국, 대한항공 마일리지)</li>' +
        '<li>핼리팩스 → 인천 (귀국, 마일리지)</li>' +
        '<li>유럽 안 = 라이언에어 · 이지젯 €30-80</li>' +
        '<li>대륙 간 = 두바이 경유 (말타 → 호바트)</li>' +
      '</ul>' +
    '</div>';

    // 엄마 합류 후보
    html += '<div class="nm-card">' +
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">' +
        '<span class="material-symbols-outlined" style="color:var(--nm-primary)">family_restroom</span>' +
        '<h3 class="nm-headline-md">엄마 합류 후보</h3>' +
      '</div>' +
      '<ul class="nm-list-bullet">' +
        '<li><strong>2028.9</strong> 스칸디나비아 (북유럽 안전·깨끗)</li>' +
        '<li><strong>2028.12</strong> 호바트 (호주 여름)</li>' +
        '<li><strong>2029.3</strong> 뉴질랜드 (자연)</li>' +
      '</ul>' +
      '<div class="nm-quote" style="margin-top:16px;font-size:12px">' +
        '1969년생 · 현행 정년 시 2029 / 65세 법안 통과 시 2033년 퇴직' +
      '</div>' +
    '</div>';

    html += '</div>';

    return html;
  }
  registerPage('nomad-voyage', renderVoyage);

  // ──────── Budget 페이지 ────────
  function renderBudget() {
    var budget = DATA.BUDGET;
    var oneoff = DATA.BUDGET_ONEOFF;
    var stayTotal = budget.reduce(function(a,b){ return a + b.stay; }, 0);
    var lifeTotal = budget.reduce(function(a,b){ return a + b.life; }, 0);
    var monthlyTotal = budget.reduce(function(a,b){ return a + b.total; }, 0);
    var oneoffTotal = oneoff.flights + oneoff.visa + oneoff.insurance + oneoff.misc;
    var grandTotal = monthlyTotal + oneoffTotal;
    var avgMonth = Math.round(monthlyTotal / 12);

    var html = '';
    html += pageHeader('Budget', '1년 예산 · 월별 상세',
      '단위 만 원 · 1만 원 단위 반올림 · 총 ' + fmtMan(grandTotal));

    // 요약 metric cards (4개)
    html += '<div class="nm-grid nm-grid-4" style="margin-bottom:32px">';
    html += '<div class="nm-bento accent-primary">' +
      '<p class="nm-label-sm" style="margin-bottom:8px">월별 합계</p>' +
      '<h4 class="nm-headline-lg">' + fmtMan(monthlyTotal) + '</h4>' +
      '<p style="font-size:11px;color:var(--nm-text-3);margin-top:8px">평균 월 ' + fmtMan(avgMonth) + '</p>' +
    '</div>';
    html += '<div class="nm-bento accent-secondary">' +
      '<p class="nm-label-sm" style="margin-bottom:8px">숙소 비중</p>' +
      '<h4 class="nm-headline-lg">' + fmtMan(stayTotal) + '</h4>' +
      '<p style="font-size:11px;color:var(--nm-text-3);margin-top:8px">' + Math.round((stayTotal/monthlyTotal)*100) + '% of 월별</p>' +
    '</div>';
    html += '<div class="nm-bento accent-tertiary">' +
      '<p class="nm-label-sm" style="margin-bottom:8px">생활비</p>' +
      '<h4 class="nm-headline-lg">' + fmtMan(lifeTotal) + '</h4>' +
      '<p style="font-size:11px;color:var(--nm-text-3);margin-top:8px">' + Math.round((lifeTotal/monthlyTotal)*100) + '% of 월별</p>' +
    '</div>';
    html += '<div class="nm-bento accent-accent">' +
      '<p class="nm-label-sm" style="margin-bottom:8px">일회성 합계</p>' +
      '<h4 class="nm-headline-lg">' + fmtMan(oneoffTotal) + '</h4>' +
      '<p style="font-size:11px;color:var(--nm-text-3);margin-top:8px">항공·비자·보험·예비</p>' +
    '</div>';
    html += '</div>';

    // 월별 예산 테이블
    html += '<section class="nm-section">';
    html += '<div class="nm-section-head">' +
      '<h3 class="nm-headline-md">월별 예산</h3>' +
      '<span class="nm-label-sm" style="color:var(--nm-text-3)">12개월</span>' +
    '</div>';
    html += '<div class="nm-card" style="padding:0;overflow:hidden">';
    html += '<table class="nm-table">';
    html += '<thead><tr>' +
      '<th style="width:100px">시기</th>' +
      '<th>도시</th>' +
      '<th class="nm-num">숙소</th>' +
      '<th class="nm-num">생활비</th>' +
      '<th class="nm-num">합계</th>' +
    '</tr></thead>';
    html += '<tbody>';
    budget.forEach(function(b) {
      var isOverAvg = b.total > avgMonth;
      html += '<tr>' +
        '<td><strong style="color:var(--nm-primary);font-size:13px">' + b.period + '</strong></td>' +
        '<td style="font-family:Manrope;font-weight:600;color:var(--nm-on-surface)">' + b.city + '</td>' +
        '<td class="nm-num" style="color:var(--nm-text-2)">' + b.stay + '</td>' +
        '<td class="nm-num" style="color:var(--nm-text-2)">' + b.life + '</td>' +
        '<td class="nm-num"><strong style="color:' + (isOverAvg ? '#c2410c' : 'var(--nm-on-surface)') + '">' + b.total + '</strong></td>' +
      '</tr>';
    });
    // 합계 행
    html += '<tr style="background:var(--nm-primary-soft);font-weight:700">' +
      '<td colspan="2" style="color:var(--nm-deep-indigo);font-family:Manrope">월별 합계</td>' +
      '<td class="nm-num" style="color:var(--nm-deep-indigo)">' + stayTotal + '</td>' +
      '<td class="nm-num" style="color:var(--nm-deep-indigo)">' + lifeTotal + '</td>' +
      '<td class="nm-num" style="color:var(--nm-primary)"><strong>' + monthlyTotal + '</strong></td>' +
    '</tr>';
    html += '</tbody></table>';
    html += '</div>';
    html += '</section>';

    // 일회성 비용 카드
    html += '<section class="nm-section">';
    html += '<div class="nm-section-head">' +
      '<h3 class="nm-headline-md">일회성 비용</h3>' +
      '<span class="nm-label-sm" style="color:var(--nm-text-3)">출국 전 · 1회 결제</span>' +
    '</div>';
    html += '<div class="nm-grid nm-grid-4">';
    var oneoffItems = [
      { label: '항공권', icon: 'flight', value: oneoff.flights, note: '인천↔리스본·핼리팩스·대륙 간', accent: 'accent' },
      { label: '비자',   icon: 'badge',  value: oneoff.visa,    note: '워홀 + ETA·ESTA·eTA·NZeTA',  accent: 'secondary' },
      { label: '보험',   icon: 'health_and_safety', value: oneoff.insurance, note: '장기 여행자보험 1년', accent: 'tertiary' },
      { label: '예비비', icon: 'savings', value: oneoff.misc,    note: '짐·기기·예비 (소비성 X)',     accent: 'primary' },
    ];
    oneoffItems.forEach(function(o) {
      html += '<div class="nm-bento accent-' + o.accent + '">' +
        '<div style="display:flex;align-items:center;gap:6px;margin-bottom:10px">' +
          '<span class="material-symbols-outlined" style="font-size:18px;color:var(--nm-primary)">' + o.icon + '</span>' +
          '<p class="nm-label-sm" style="margin:0">' + o.label + '</p>' +
        '</div>' +
        '<h4 class="nm-headline-md">' + fmtMan(o.value) + '</h4>' +
        '<p style="font-size:11px;color:var(--nm-text-3);margin-top:8px">' + o.note + '</p>' +
      '</div>';
    });
    html += '</div>';
    html += '</section>';

    // Grand Total
    html += '<div class="nm-card" style="background:linear-gradient(135deg,var(--nm-primary-soft),var(--nm-surface-container-low));text-align:center;padding:40px">';
    html += '<p class="nm-label-sm" style="margin-bottom:12px">1년 노마드 총 예산</p>';
    html += '<h2 class="nm-display-lg" style="margin-bottom:8px">' + fmtMan(grandTotal) + '</h2>';
    html += '<p style="font-size:13px;color:var(--nm-text-2)">월별 ' + fmtMan(monthlyTotal) + ' + 일회성 ' + fmtMan(oneoffTotal) + '</p>';
    html += '<p style="font-size:11px;color:var(--nm-text-3);margin-top:12px">예비비 제외 소비성: ' + fmtMan(grandTotal - oneoff.misc) + '</p>';
    html += '</div>';

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
    html += pageHeader('IP · Webnovel Track', '수익 트랙 · 자산 트랙',
      '메인 게이트 카운트 + 서브 장기 자산');

    // 메인 트랙
    html += '<section class="nm-section">';
    html += '<div class="nm-card">';
    html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">' +
      '<span class="material-symbols-outlined" style="color:var(--nm-primary)">menu_book</span>' +
      '<h3 class="nm-headline-md">메인 트랙 · 포스타입 웹소</h3>' +
      '<span class="nm-pill" style="margin-left:auto">High Priority</span>' +
    '</div>';
    html += '<h4 style="font-family:Manrope;font-size:16px;font-weight:600;color:var(--nm-deep-indigo);margin-bottom:12px">B시리즈 중심 (게이트 카운트)</h4>';
    html += trackCard([
      ['<strong>2026.5</strong> <span style="color:var(--nm-text-3);font-size:11px">(현재)</span>', '₩200-250만', '<span style="color:var(--nm-text-3);font-size:12px">—</span>'],
      ['<strong>2027.12</strong> <span style="color:var(--nm-primary);font-size:11px">(게이트)</span>', '<strong style="color:var(--nm-primary)">₩450만</strong>', '<span class="nm-pill" style="font-size:10px">출국 조건</span>'],
      ['<strong>2027.12</strong> <span style="color:#15803d;font-size:11px">(욕심)</span>', '<strong style="color:#15803d">₩700-800만</strong>', '<span class="nm-pill nm-pill-good" style="font-size:10px">저축 가능</span>'],
    ], [{label:'시점'}, {label:'월 수익', right:true}, {label:'비고'}]);
    html += '<h4 style="font-family:Manrope;font-size:14px;font-weight:600;color:var(--nm-deep-indigo);margin-top:24px;margin-bottom:8px">확장 전략</h4>';
    html += '<ul class="nm-list-bullet">' +
      '<li>B시리즈 월 8편+ 페이스</li>' +
      '<li>2번째 작품 가동 (2026 후반 또는 2027)</li>' +
      '<li>메이저 웹소 플랫폼 진입 검토 (2027)</li>' +
    '</ul>';
    html += '</div>';
    html += '</section>';

    // 서브 트랙
    html += '<section class="nm-section">';
    html += '<div class="nm-card">';
    html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">' +
      '<span class="material-symbols-outlined" style="color:var(--nm-secondary)">analytics</span>' +
      '<h3 class="nm-headline-md">서브 트랙 · 분석가 N IP</h3>' +
      '<span class="nm-pill nm-pill-soft" style="margin-left:auto;background:#a7a5ff;color:#393689">Stable</span>' +
    '</div>';
    html += '<h4 style="font-family:Manrope;font-size:16px;font-weight:600;color:var(--nm-deep-indigo);margin-bottom:12px">메일리 + 디지털 제품 + 코칭 <span style="font-weight:400;color:var(--nm-text-3);font-size:13px">(게이트 외, 장기 자산)</span></h4>';
    html += trackCard([
      ['<strong>1 · Foundation</strong>', '2026.5-6', '필명·도메인·메일리·사이트 1차'],
      ['<strong>2 · Build</strong>',      '2026.7-8', '콘텐츠 5편 + 도구 MVP'],
      ['<strong>3 · Protect</strong>',    '2026.9',   '정서 자원 보호'],
      ['<strong>4 · Launch</strong>',     '2026.10',  '뉴스레터 정식 시작'],
      ['<strong>5 · Settle</strong>',     '2026.11-12','구독자 100-300명'],
      ['<strong>6 · Expand</strong>',     '2027.1-3', '사연 받기 + 첫 디지털 제품'],
      ['<strong>7 · Monetize</strong>',   '2027.4-6', '유료 멤버십 + 1:1 분석'],
    ], [{label:'Phase'}, {label:'시기'}, {label:'목표'}]);
    html += '<div class="nm-quote" style="margin-top:16px">예상 기여 (2027.12 시점): <strong>월 ₩100-300만</strong></div>';
    html += '</div>';
    html += '</section>';

    // 노마드 동안 운영
    html += '<section class="nm-section">';
    html += '<div class="nm-card">';
    html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:20px">' +
      '<span class="material-symbols-outlined" style="color:var(--nm-primary)">schedule</span>' +
      '<h3 class="nm-headline-md">노마드 동안 운영</h3>' +
    '</div>';
    html += '<div class="nm-grid nm-grid-3" style="gap:16px">';

    html += '<div style="background:var(--nm-primary-soft);padding:18px;border-radius:8px">' +
      '<h4 style="font-family:Manrope;font-size:14px;font-weight:700;color:var(--nm-primary);margin-bottom:10px">메인 (웹소)</h4>' +
      '<ul class="nm-list-bullet" style="font-size:13px">' +
        '<li>평일 오전 4시간 = 글 작업 (블록 사수)</li>' +
        '<li>주 2-3편 발행 페이스</li>' +
        '<li>출국 전 3개월치 콘텐츠 비축</li>' +
      '</ul>' +
    '</div>';

    html += '<div style="background:#e6eeff;padding:18px;border-radius:8px">' +
      '<h4 style="font-family:Manrope;font-size:14px;font-weight:700;color:var(--nm-secondary);margin-bottom:10px">서브 (IP)</h4>' +
      '<ul class="nm-list-bullet" style="font-size:13px">' +
        '<li>평일 1일 = 코딩 데이 (수요일 풀데이)</li>' +
        '<li>메일리 격주 발행</li>' +
        '<li>사연 응답 + 1:1 분석 월 2-4건</li>' +
      '</ul>' +
    '</div>';

    html += '<div style="background:#fff7ed;padding:18px;border-radius:8px">' +
      '<h4 style="font-family:Manrope;font-size:14px;font-weight:700;color:#c2410c;margin-bottom:10px">해외 취업 정찰</h4>' +
      '<ul class="nm-list-bullet" style="font-size:13px">' +
        '<li>영문 포트폴리오 + 면접</li>' +
        '<li>패션 (니트) + 1인 IP 운영자 양쪽 열어둠</li>' +
      '</ul>' +
    '</div>';

    html += '</div>';
    html += '</div>';
    html += '</section>';

    return html;
  }
  registerPage('nomad-ip', renderIPTrack);

  // ──────── Stay Channels 페이지 ────────
  function renderChannels() {
    var html = '';
    html += pageHeader('Stay Channels', '도시별 숙소 채널',
      'Flatio · Stayz · Furnished Finder · 로컬 · 부엌 + Wi-Fi + 안전 동네 필수');

    // 유럽 채널
    html += '<section class="nm-section">';
    html += '<div class="nm-card" style="padding:0;overflow:hidden">';
    html += '<div style="padding:20px 24px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:8px">' +
      '<span class="material-symbols-outlined" style="color:var(--nm-primary)">public</span>' +
      '<h3 class="nm-headline-md">유럽 6개월 · Flatio 메인</h3>' +
      '<span class="nm-pill" style="margin-left:auto;background:#eaddff;color:#5a00c6">' + DATA.CHANNELS_EU.length + '개 도시</span>' +
    '</div>';
    html += '<table class="nm-table">';
    html += '<thead><tr><th>도시</th><th>1순위</th><th>2순위</th><th>비고</th></tr></thead><tbody>';
    DATA.CHANNELS_EU.forEach(function(c) {
      html += '<tr>' +
        '<td><strong>' + c.city + '</strong></td>' +
        '<td><span class="nm-pill">' + c.first + '</span></td>' +
        '<td style="font-size:13px;color:var(--nm-text-2)">' + c.second + '</td>' +
        '<td style="font-size:12px;color:var(--nm-text-3)">' + c.note + '</td>' +
      '</tr>';
    });
    html += '</tbody></table>';
    html += '</div>';
    html += '</section>';

    // 글로벌 채널
    html += '<section class="nm-section">';
    html += '<div class="nm-card" style="padding:0;overflow:hidden">';
    html += '<div style="padding:20px 24px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:8px">' +
      '<span class="material-symbols-outlined" style="color:var(--nm-primary)">public</span>' +
      '<h3 class="nm-headline-md">호주 · NZ · 미주 6개월 · 로컬 + Furnished Finder</h3>' +
      '<span class="nm-pill" style="margin-left:auto;background:#eaddff;color:#5a00c6">' + DATA.CHANNELS_GLOBAL.length + '개 도시</span>' +
    '</div>';
    html += '<table class="nm-table">';
    html += '<thead><tr><th>도시</th><th>1순위</th><th>2순위</th><th>비고</th></tr></thead><tbody>';
    DATA.CHANNELS_GLOBAL.forEach(function(c) {
      html += '<tr>' +
        '<td><strong>' + c.city + '</strong></td>' +
        '<td><span class="nm-pill">' + c.first + '</span></td>' +
        '<td style="font-size:13px;color:var(--nm-text-2)">' + c.second + '</td>' +
        '<td style="font-size:12px;color:var(--nm-text-3)">' + c.note + '</td>' +
      '</tr>';
    });
    html += '</tbody></table>';
    html += '</div>';
    html += '</section>';

    // 검색·예약 타임라인
    html += '<section class="nm-section">';
    html += '<div class="nm-card">';
    html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">' +
      '<span class="material-symbols-outlined" style="color:var(--nm-primary)">schedule</span>' +
      '<h3 class="nm-headline-md">검색 · 예약 타임라인</h3>' +
    '</div>';
    var timeline = [
      { when: '2027.12부터', sub: '출국 6개월 전', text: 'Flatio · Stayz · Furnished Finder 가입 + 검색 시작, 가격 추적' },
      { when: '2028.3',      sub: '3개월 전',     text: '6-8월 숙소 확정 예약 (포르투갈·아일랜드·덴마크)' },
      { when: '2028.4',      sub: '2개월 전',     text: '9-11월 숙소 확정 예약 (스칸디나비아·아이슬란드·말타)' },
      { when: '출국 후',     sub: '노마드 중',    text: '12월 이후 = 5-6주 전 예약 (유연하게)' },
    ];
    html += '<div style="display:flex;flex-direction:column;gap:12px">';
    timeline.forEach(function(t) {
      html += '<div style="display:flex;gap:16px;padding:14px;background:var(--nm-surface-container-low);border-radius:8px">' +
        '<div style="min-width:120px">' +
          '<div style="font-family:Manrope;font-weight:700;color:var(--nm-primary)">' + t.when + '</div>' +
          '<div style="font-size:11px;color:var(--nm-text-3)">' + t.sub + '</div>' +
        '</div>' +
        '<div style="font-size:13px;color:var(--nm-text-2);line-height:1.6">' + t.text + '</div>' +
      '</div>';
    });
    html += '</div>';
    html += '</div>';
    html += '</section>';

    // 숙소 기준
    html += '<section class="nm-section">';
    html += '<div class="nm-card">';
    html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:20px">' +
      '<span class="material-symbols-outlined" style="color:var(--nm-primary)">checklist</span>' +
      '<h3 class="nm-headline-md">숙소 기준 (누리 라인)</h3>' +
    '</div>';
    html += '<div class="nm-grid nm-grid-3">';

    html += '<div style="background:#ecfdf5;padding:18px;border-radius:8px;border-left:3px solid #15803d">' +
      '<h4 style="font-family:Manrope;font-size:13px;font-weight:700;color:#15803d;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.05em">필수</h4>' +
      '<ul class="nm-list-bullet" style="font-size:13px">' +
        '<li>개인실 (1베드룸 또는 스튜디오)</li>' +
        '<li>부엌 (집밥 위주)</li>' +
        '<li>Wi-Fi 50Mbps+</li>' +
        '<li>안전 동네</li>' +
        '<li>평점 4.5+</li>' +
      '</ul>' +
    '</div>';

    html += '<div style="background:#fffbeb;padding:18px;border-radius:8px;border-left:3px solid #c2410c">' +
      '<h4 style="font-family:Manrope;font-size:13px;font-weight:700;color:#c2410c;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.05em">양보 가능</h4>' +
      '<ul class="nm-list-bullet" style="font-size:13px">' +
        '<li>신축 → 적당 노후 (5-15년)</li>' +
        '<li>시내 중심 → 외곽 (대중교통 15분)</li>' +
        '<li>럭셔리 → 깨끗한 기본</li>' +
      '</ul>' +
    '</div>';

    html += '<div style="background:#fef2f2;padding:18px;border-radius:8px;border-left:3px solid #b91c1c">' +
      '<h4 style="font-family:Manrope;font-size:13px;font-weight:700;color:#b91c1c;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.05em">NO</h4>' +
      '<ul class="nm-list-bullet" style="font-size:13px">' +
        '<li>호스텔 도미토리</li>' +
        '<li>위험 동네</li>' +
        '<li>부엌 X</li>' +
      '</ul>' +
    '</div>';

    html += '</div>';
    html += '</div>';
    html += '</section>';

    return html;
  }
  registerPage('nomad-channels', renderChannels);

  // ──────── Operating Principles 페이지 ────────
  function renderPrinciples() {
    var html = '';
    html += pageHeader('Operating Principles', '노마드 운영 원칙',
      '거점 + 위성 · 일 70 / 관광 30 · 회복 인정');

    // 거점 + 위성
    html += '<section class="nm-section">';
    html += '<div class="nm-card">';
    html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">' +
      '<span class="material-symbols-outlined" style="color:var(--nm-primary)">hub</span>' +
      '<h3 class="nm-headline-md">거점 + 위성 모델</h3>' +
    '</div>';
    html += '<ul class="nm-list-bullet">' +
      '<li>한 도시 최소 <strong>2-4주 거점</strong></li>' +
      '<li>거점 안에서 <strong>1-3박 위성 여행</strong></li>' +
      '<li>매일 옮겨다니지 않음 — 이동 = 회복일</li>' +
    '</ul>';
    html += '</div>';
    html += '</section>';

    // 시간 구조
    html += '<section class="nm-section">';
    html += '<div class="nm-card">';
    html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:20px">' +
      '<span class="material-symbols-outlined" style="color:var(--nm-primary)">schedule</span>' +
      '<h3 class="nm-headline-md">시간 구조 · 일 70 / 관광 30</h3>' +
    '</div>';
    html += '<div class="nm-grid nm-grid-3">';

    html += '<div style="background:var(--nm-primary-soft);padding:18px;border-radius:8px">' +
      '<h4 style="font-family:Manrope;font-size:14px;font-weight:700;color:var(--nm-primary);margin-bottom:10px">평일 (월-금)</h4>' +
      '<ul class="nm-list-bullet" style="font-size:13px">' +
        '<li>오전 9-13시 · <strong>글 작업</strong> (4시간 블록, 절대 사수)</li>' +
        '<li>점심</li>' +
        '<li>오후 14-17시 · 현지 체험 / 카페 / 박물관 / 사람 만남</li>' +
        '<li>저녁 · 운동 + 휴식</li>' +
      '</ul>' +
    '</div>';

    html += '<div style="background:#e6eeff;padding:18px;border-radius:8px">' +
      '<h4 style="font-family:Manrope;font-size:14px;font-weight:700;color:var(--nm-secondary);margin-bottom:10px">코딩 풀데이 (주 1일, 보통 수요일)</h4>' +
      '<ul class="nm-list-bullet" style="font-size:13px">' +
        '<li>오전·오후 <strong>8시간 코딩</strong></li>' +
        '<li>IP 도구 + 디지털 제품 개발</li>' +
      '</ul>' +
    '</div>';

    html += '<div style="background:#fff7ed;padding:18px;border-radius:8px">' +
      '<h4 style="font-family:Manrope;font-size:14px;font-weight:700;color:#c2410c;margin-bottom:10px">주말</h4>' +
      '<ul class="nm-list-bullet" style="font-size:13px">' +
        '<li>토 · 위성 여행 또는 깊은 휴식</li>' +
        '<li>일 · 휴식 + 다음 주 계획</li>' +
      '</ul>' +
    '</div>';

    html += '</div>';
    html += '</div>';
    html += '</section>';

    // 도시별 일 비중
    var workRatio = [
      ['6월 포르투', '적응 + 글 풀가동', 70],
      ['7월 아일랜드', '글 + 위성', 60],
      ['8월 덴마크·노르웨이', '이동 많음', 40], // 30-50 평균
      ['9월 스웨덴', '글 풀가동', 70],
      ['9-10월 핀란드', '글 + 디자인 영감', 60],
      ['10월 아이슬란드', '거의 휴가', 20],
      ['10-11월 포르투갈', '휴식 + 글 보충', 60],
      ['11월 말타', '글 + 해변', 60],
      ['12월 호바트', '글 + 자연', 70],
      ['1월 애들레이드', '글 + 예술', 70],
      ['2월 멜버른', '글 풀가동', 75],
      ['3월 뉴질랜드', '글 + 자연', 60],
      ['4월 샌디에이고', '글 + 미국 경험', 60],
      ['5월 핼리팩스', '글 + 마무리', 70],
    ];
    var avgRatio = Math.round(workRatio.reduce(function(a,r){return a+r[2];}, 0) / workRatio.length);

    html += '<section class="nm-section">';
    html += '<div class="nm-card" style="padding:0;overflow:hidden">';
    html += '<div style="padding:20px 24px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:8px">' +
      '<span class="material-symbols-outlined" style="color:var(--nm-primary)">trending_up</span>' +
      '<h3 class="nm-headline-md">도시별 일 비중</h3>' +
      '<span class="nm-pill" style="margin-left:auto">평균 ≈ ' + avgRatio + '%</span>' +
    '</div>';
    html += '<table class="nm-table">';
    html += '<thead><tr><th>시기</th><th>모드</th><th class="nm-num">일 비중</th><th>시각화</th></tr></thead><tbody>';
    workRatio.forEach(function(r) {
      var pct = r[2];
      var color = pct >= 70 ? 'var(--nm-primary)' : pct >= 50 ? 'var(--nm-secondary)' : '#c2410c';
      html += '<tr>' +
        '<td><strong>' + r[0] + '</strong></td>' +
        '<td style="font-size:13px;color:var(--nm-text-2)">' + r[1] + '</td>' +
        '<td class="nm-num"><strong style="color:' + color + '">' + pct + '%</strong></td>' +
        '<td style="width:200px"><div style="height:6px;background:var(--nm-surface-container);border-radius:99px;overflow:hidden"><div style="height:100%;width:' + pct + '%;background:' + color + '"></div></div></td>' +
      '</tr>';
    });
    html += '</tbody></table>';
    html += '</div>';
    html += '</section>';

    // 2-col: 산출량 + 이동일
    html += '<div class="nm-grid nm-grid-2">';
    html += '<div class="nm-card">' +
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">' +
        '<span class="material-symbols-outlined" style="color:var(--nm-primary)">edit</span>' +
        '<h3 class="nm-headline-md">산출량 · 주 단위</h3>' +
      '</div>' +
      '<ul class="nm-list-bullet">' +
        '<li>글 초안 · <strong>주 2-3편</strong> (월 8-12편)</li>' +
        '<li>코딩 풀데이 · 주 1회 (월 4-5회)</li>' +
        '<li>메일리 발행 · 격주 또는 주 1회</li>' +
        '<li>디지털 제품 · 분기별 큰 단위</li>' +
      '</ul>' +
    '</div>';

    html += '<div class="nm-card">' +
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">' +
        '<span class="material-symbols-outlined" style="color:var(--nm-primary)">flight</span>' +
        '<h3 class="nm-headline-md">이동일 = 버리는 날</h3>' +
      '</div>' +
      '<ul class="nm-list-bullet">' +
        '<li>도시 → 도시 이동일 · <strong>일 X, 관광 X</strong></li>' +
        '<li>회복일로 인정</li>' +
        '<li>한 달 1-2일 자연스러움</li>' +
      '</ul>' +
    '</div>';
    html += '</div>';

    // 가족 연락
    html += '<section class="nm-section" style="margin-top:32px">';
    html += '<div class="nm-card">';
    html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">' +
      '<span class="material-symbols-outlined" style="color:var(--nm-primary)">family_restroom</span>' +
      '<h3 class="nm-headline-md">가족 연락</h3>' +
    '</div>';
    html += '<ul class="nm-list-bullet">' +
      '<li>엄마·아빠 <strong>매주 화상통화 1회</strong> (요일 고정)</li>' +
      '<li>메신저 매일 짧은 인증샷</li>' +
      '<li>엄마 합류 가능 시기 미리 공유 (9월·12월·3월)</li>' +
    '</ul>';
    html += '</div>';
    html += '</section>';

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
    var listEl = document.querySelector('.nm-checklist-wrap[data-key="' + storageKey + '"]');
    if (!listEl) return;
    var items = listEl.querySelectorAll('.nm-checklist li');
    var total = items.length;
    var done = 0;
    items.forEach(function(li) { if (li.classList.contains('is-checked')) done++; });
    var pct = total > 0 ? Math.round((done/total) * 100) : 0;
    var labelEl = listEl.querySelector('.nm-check-progress-label');
    var barEl = listEl.querySelector('.nm-check-progress-bar');
    if (labelEl) labelEl.innerHTML = '<span>' + done + ' / ' + total + ' 완료</span><span>' + pct + '%</span>';
    if (barEl) barEl.style.width = pct + '%';
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
  function renderVisa() {
    initChecks();
    var html = '';
    html += pageHeader('Visa & Documents', '비자 · 서류 체크리스트',
      '셰겐 84/90일 한도 안 · 워홀 베이스캠프');

    // 비자 종합 테이블
    html += '<section class="nm-section">';
    html += '<div class="nm-card" style="padding:0;overflow:hidden">';
    html += '<div style="padding:20px 24px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:8px">' +
      '<span class="material-symbols-outlined" style="color:var(--nm-primary)">flight_takeoff</span>' +
      '<h3 class="nm-headline-md">1년 동선 비자 종합</h3>' +
    '</div>';
    html += '<table class="nm-table">';
    html += '<thead><tr><th>국가</th><th>비자</th><th>신청 시점</th><th>체류</th><th>비고</th></tr></thead><tbody>';
    DATA.VISA_LIST.forEach(function(v) {
      html += '<tr>' +
        '<td><strong>' + v.country + '</strong></td>' +
        '<td><span class="nm-pill" style="' + visaPillClass(v.type) + '">' + v.type + '</span></td>' +
        '<td style="font-size:13px;color:var(--nm-text-2)">' + v.when + '</td>' +
        '<td style="font-size:13px;color:var(--nm-text-2)">' + v.stay + '</td>' +
        '<td style="font-size:12px;color:var(--nm-text-3)">' + v.note + '</td>' +
      '</tr>';
    });
    html += '</tbody></table>';
    html += '</div>';
    html += '</section>';

    // 서류 체크리스트
    html += buildChecklist('visa_docs', '출국 전 서류 체크', DATA.VISA_DOCS);

    return html;
  }
  registerPage('nomad-visa', renderVisa);

  // ──────── Working Holiday 페이지 (탭 4개) ────────
  function _whTab(activeTab) {
    var tabs = [
      { id: 'overview', label: '개요' },
      { id: 'docs',     label: '서류 준비' },
      { id: 'process',  label: '신청 절차' },
      { id: 'strategy', label: '활용 전략' },
    ];
    var html = '<div style="display:flex;gap:4px;margin-bottom:24px;border-bottom:1px solid #f1f5f9;padding-bottom:0">';
    tabs.forEach(function(t) {
      var isActive = t.id === activeTab;
      html += '<button onclick="NOMAD_PAGES.whSetTab(\'' + t.id + '\')" style="background:none;border:none;padding:10px 16px;font-size:14px;font-weight:' + (isActive ? '700' : '500') + ';color:' + (isActive ? 'var(--nm-primary)' : 'var(--nm-text-2)') + ';cursor:pointer;border-bottom:2px solid ' + (isActive ? 'var(--nm-primary)' : 'transparent') + ';margin-bottom:-1px;font-family:Manrope">' + t.label + '</button>';
    });
    html += '</div>';
    return html;
  }
  var _whActiveTab = 'overview';
  function _whContent(tab) {
    var html = '';
    if (tab === 'overview') {
      html += '<div class="nm-card">';
      html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">' +
        '<span class="material-symbols-outlined" style="color:var(--nm-primary)">info</span>' +
        '<h3 class="nm-headline-md">기본 정보</h3>' +
      '</div>';
      html += '<table class="nm-table">';
      var info = [
        ['정식 명칭', '한·포르투갈 워킹홀리데이 비자'],
        ['유효 기간', '1년 (입국일부터)'],
        ['나이 제한', '만 18-34세 (한·포르투갈 협정 기준)'],
        ['활동 가능', '관광 · 체류 · 일 · 학업 (정규직 X, 시간제 OK)'],
        ['연간 쿼터', '200명 (한국-포르투갈)'],
        ['비용', '€90 (환율 변동)'],
        ['입출국', '1년 안 자유롭게 다회 가능 · 복수사증'],
      ];
      html += '<tbody>';
      info.forEach(function(r) {
        html += '<tr><td style="width:140px;color:var(--nm-text-3);font-size:13px">' + r[0] + '</td><td><strong>' + r[1] + '</strong></td></tr>';
      });
      html += '</tbody></table>';
      html += '</div>';
      html += '<div class="nm-quote" style="margin-top:16px">누리 = 1995.11.2생 · 2028.6 출국 시 만 32세 → <strong style="color:var(--nm-primary)">자격 OK</strong></div>';
    } else if (tab === 'docs') {
      html += '<div class="nm-card" style="padding:0;overflow:hidden">';
      html += '<div style="padding:20px 24px;border-bottom:1px solid #f1f5f9;display:flex;align-items:center;gap:8px">' +
        '<span class="material-symbols-outlined" style="color:var(--nm-primary)">description</span>' +
        '<h3 class="nm-headline-md">준비 서류</h3>' +
      '</div>';
      html += '<table class="nm-table"><thead><tr><th>서류</th><th>발급처</th><th>비고</th></tr></thead><tbody>';
      var docs = [
        ['여권 사본', '본인', '만료 1년+ 여유'],
        ['여권 사진 35×45', '사진관', '6개월 이내'],
        ['비자신청서', '대사관 양식', '영문 또는 포어'],
        ['범죄경력회보서 영문', '경찰서 / 정부24', '3개월 이내'],
        ['재정증빙 영문', '주거래은행', '€5,000 이상 권장'],
        ['항공권 사본', '항공사', '편도 또는 왕복'],
        ['여행자보험', '보험사', '€30,000+ 보장'],
        ['자기소개서', '본인 작성', '영문 또는 포어'],
        ['활동계획서', '본인 작성', '1년 활동 계획'],
      ];
      docs.forEach(function(r) {
        html += '<tr><td><strong>' + r[0] + '</strong></td><td style="font-size:13px;color:var(--nm-text-2)">' + r[1] + '</td><td style="font-size:12px;color:var(--nm-text-3)">' + r[2] + '</td></tr>';
      });
      html += '</tbody></table>';
      html += '</div>';
    } else if (tab === 'process') {
      html += '<div class="nm-card">';
      html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:20px">' +
        '<span class="material-symbols-outlined" style="color:var(--nm-primary)">timeline</span>' +
        '<h3 class="nm-headline-md">신청 절차</h3>' +
      '</div>';
      var steps = [
        { when: '2028.1-2', stage: '사전 준비',      title: '서류 수집',                 text: '범죄경력회보서, 재정증빙, 보험, 자기소개서·활동계획서 작성' },
        { when: '2028.3',   stage: '대사관 방문 예약', title: '이메일 사전 예약',           text: '주한 포르투갈 대사관 (서울 용산구 한남동) · 본인 직접 방문 필수' },
        { when: '2028.3-4', stage: '신청 + 면접',     title: '대사관 방문 · 서류 제출',     text: '비자 수수료 €90 납부 · 간단 영어/포어 면접 가능' },
        { when: '2028.4-5', stage: '발급 대기',       title: '처리 2-6주',               text: '여권 수령 후 비자 시작일 = 2028.6.9 입국일' },
        { when: '2028.6.9', stage: '출국 + 입국',     title: '리스본 도착',              text: '비자 시작일 전 셰겐 입국 X (입국 거부 위험)' },
        { when: '입국 30일 이내', stage: 'AIMA 등록',  title: '통합이주망명청',           text: 'aima.gov.pt · (+351) 217-115-000' },
      ];
      html += '<div style="position:relative;padding-left:24px;border-left:2px solid var(--nm-primary-soft)">';
      steps.forEach(function(s) {
        html += '<div style="position:relative;margin-bottom:20px;padding:14px 16px;background:var(--nm-surface-container-low);border-radius:8px">';
        html += '<div style="position:absolute;left:-32px;top:18px;width:12px;height:12px;border-radius:50%;background:var(--nm-primary);border:3px solid #fff;box-shadow:0 0 0 1px var(--nm-primary)"></div>';
        html += '<div style="font-family:Manrope;font-size:11px;font-weight:700;color:var(--nm-primary);letter-spacing:0.05em;text-transform:uppercase;margin-bottom:2px">' + s.when + ' · ' + s.stage + '</div>';
        html += '<div style="font-family:Manrope;font-size:15px;font-weight:600;color:var(--nm-deep-indigo);margin-bottom:4px">' + s.title + '</div>';
        html += '<p style="font-size:13px;color:var(--nm-text-2);line-height:1.5">' + s.text + '</p>';
        html += '</div>';
      });
      html += '</div>';
      html += '</div>';
    } else if (tab === 'strategy') {
      html += '<div class="nm-card">';
      html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:16px">' +
        '<span class="material-symbols-outlined" style="color:var(--nm-primary)">workspace_premium</span>' +
        '<h3 class="nm-headline-md">누리 시나리오 · 워홀 활용</h3>' +
      '</div>';
      html += '<h4 style="font-family:Manrope;font-size:14px;font-weight:600;color:var(--nm-deep-indigo);margin-bottom:8px">1년 베이스캠프 역할</h4>';
      html += '<ul class="nm-list-bullet" style="margin-bottom:20px"><li>포르투갈 체류 = 1년 중 약 <strong>2-2.5개월</strong> (6월 + 10-11월)</li><li>셰겐 카운트 회피용 베이스</li><li>복수 입출국 가능</li></ul>';
      html += '<h4 style="font-family:Manrope;font-size:14px;font-weight:600;color:var(--nm-deep-indigo);margin-bottom:8px">일자리 X · 노마드 베이스만</h4>';
      html += '<ul class="nm-list-bullet"><li>본업 외 IP·웹소 수익이 메인</li><li>포르투갈에서 일자리 X</li><li>워홀 = <strong>비자 도구로만 사용</strong></li></ul>';
      html += '</div>';
      html += '<div class="nm-card" style="margin-top:16px;border-left:3px solid #b91c1c">';
      html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">' +
        '<span class="material-symbols-outlined" style="color:#b91c1c">warning</span>' +
        '<h3 class="nm-headline-md" style="color:#b91c1c">주의</h3>' +
      '</div>';
      html += '<ul class="nm-list-bullet"><li>비자 시작일 전 셰겐 입국 시 입국 거부 가능 → <strong>첫 입국 = 반드시 포르투갈</strong></li><li>대사관 방문 = 본인 직접 (대리 X)</li><li>연간 200명 쿼터 = 빨리 신청 권장</li></ul>';
      html += '</div>';
    }
    return html;
  }
  function whSetTab(tabId) {
    _whActiveTab = tabId;
    var content = document.getElementById('nomad-content');
    if (content) content.innerHTML = renderWH();
  }
  function renderWH() {
    var html = '';
    html += pageHeader('Working Holiday · Portugal', '포르투갈 워홀 비자 절차',
      '만 18-34세 · 누리 자격 OK · 신청 200명 쿼터');
    html += _whTab(_whActiveTab);
    html += _whContent(_whActiveTab);
    return html;
  }
  registerPage('nomad-wh', renderWH);

  // ──────── Action Items 페이지 ────────
  function renderActions() {
    initChecks();
    var html = '';
    html += pageHeader('Action Items', '즉시 액션 · 시간순',
      '이번 주부터 출국까지 · 체크해가며 진행');
    var groups = DATA.ACTIONS_BY_PERIOD.map(function(p) {
      return { cat: p.when, items: p.items };
    });
    html += buildChecklist('actions', '액션 체크리스트', groups);
    return html;
  }
  registerPage('nomad-actions', renderActions);

  // ──────── Packing List 페이지 ────────
  function renderPacking() {
    initChecks();
    var html = '';
    html += pageHeader('Packing List', '장기 노마드 짐 리스트',
      '캐리어 28인치 23kg + 백팩 8-10kg + 개인 휴대 5kg');

    // 짐 철학
    html += '<div class="nm-card" style="margin-bottom:16px">';
    html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">' +
      '<span class="material-symbols-outlined" style="color:var(--nm-primary)">luggage</span>' +
      '<h3 class="nm-headline-md">짐 철학</h3>' +
    '</div>';
    html += '<ul class="nm-list-bullet">' +
      '<li><strong>3-2-1 원칙:</strong> 3계절 옷 + 2개 가방 + 1년치 짐</li>' +
      '<li><strong>무게:</strong> 캐리어 23kg / 백팩 8-10kg / 개인 휴대 5kg</li>' +
      '<li><strong>누리 라인:</strong> 옷·니트는 디자이너 안목 · 책·기념품은 현지 구매</li>' +
    '</ul>';
    html += '</div>';

    // 짐 체크리스트
    var groups = Object.keys(DATA.PACKING).map(function(cat) {
      return { cat: cat, items: DATA.PACKING[cat] };
    });
    html += buildChecklist('packing', '짐 체크리스트', groups);

    // 23kg 초과 시 빼는 순서
    html += '<div class="nm-card" style="margin-top:16px;border-left:3px solid #c2410c">';
    html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">' +
      '<span class="material-symbols-outlined" style="color:#c2410c">priority_high</span>' +
      '<h3 class="nm-headline-md" style="color:#c2410c">23kg 초과 시 빼는 순서</h3>' +
    '</div>';
    html += '<ul class="nm-list-bullet">' +
      '<li><strong>1순위 양보:</strong> 다량의 약·영양제 (현지 구매)</li>' +
      '<li><strong>2순위:</strong> 헤어 기기 (현지 구매)</li>' +
      '<li><strong>3순위:</strong> 운동복·수영복 일부</li>' +
      '<li style="color:#b91c1c"><strong>절대 양보 X:</strong> 노트북·태블릿·외장 SSD·여권·서류·1차 옷·신발</li>' +
    '</ul>';
    html += '</div>';

    // 한국 보관
    html += '<div class="nm-card" style="margin-top:16px">';
    html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:14px">' +
      '<span class="material-symbols-outlined" style="color:var(--nm-primary)">archive</span>' +
      '<h3 class="nm-headline-md">한국 집 보관 (동생한테)</h3>' +
    '</div>';
    html += '<ul class="nm-list-bullet">' +
      '<li>1년 안 입을 옷·신발</li>' +
      '<li>책·앨범·기념품</li>' +
      '<li>본업 자료·디자인 포트폴리오 원본</li>' +
      '<li>차량 (동생 사용 또는 보관)</li>' +
    '</ul>';
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
  function renderCity(cityId) {
    var cities = window.NOMAD_CITIES || {};
    var city = cities[cityId];
    if (!city) {
      // 데이터 없으면 placeholder
      var label = cityId;
      (DATA.NAV || []).forEach(function(g) {
        (g.items || []).forEach(function(i) { if (i.id === cityId) label = i.label; });
      });
      return placeholderPage(cityId, label);
    }

    var html = '';

    // 1. 매거진 Hero (이미지 또는 그라데이션)
    html += _renderMagHero(city.hero, city.monthLabel);

    // 2. 누리한테 의미하는 것 (있으면)
    if (city.meaning && city.meaning.length) {
      html += '<section class="nm-mag-section">';
      html += _magSectionHead('00', 'Why This City Matters', 'Nuri\'s Lens');
      html += '<div class="nm-card">';
      html += '<ul class="nm-list-bullet">';
      city.meaning.forEach(function(m) { html += '<li>' + m + '</li>'; });
      html += '</ul>';
      html += '</div></section>';
    }

    // 섹션 분류: places 첫 번째(랜드마크) + 두 번째(숨은곳) → bento grid
    // experiences = "EXPERIENCES" divider 이후의 places 타입들
    // nomadMode = "NOMAD MODE" divider 이후의 places + list
    // budget = "BUDGET" divider 이후의 table
    // why = "FOCUS" divider 이후의 learn

    var sections = city.sections || [];
    var sectionNum = 1;
    var currentDividerLabel = '';
    var landmarks = null;
    var hiddenSpots = null;
    var experiences = [];
    var nomadModeBlocks = [];
    var budgetData = null;
    var whyData = null;
    var rawSections = []; // 매거진 패턴에 안 맞는 섹션들 (neighborhoods, learn, timeline, subsections)

    sections.forEach(function(s) {
      if (s.type === 'divider') {
        currentDividerLabel = s.label;
        return;
      }
      var inExperiences = /EXPERIENCES/i.test(currentDividerLabel);
      var inNomadMode = /NOMAD MODE/i.test(currentDividerLabel);
      var inPeople = /PEOPLE/i.test(currentDividerLabel);
      var inBudget = /BUDGET/i.test(currentDividerLabel);
      var inFocus = /FOCUS/i.test(currentDividerLabel);
      var inLearn = /LEARN/i.test(currentDividerLabel);
      var inPlaces = /PLACES/i.test(currentDividerLabel);

      if (s.type === 'places' && inPlaces) {
        if (!landmarks) landmarks = s.items;
        else if (!hiddenSpots) hiddenSpots = s.items;
        else rawSections.push(s); // 추가 places는 일반 렌더
      } else if (s.type === 'places' && inExperiences) {
        // experiences에 합치기 (전체)
        s.items.forEach(function(item) {
          experiences.push(Object.assign({}, item, { icon: s.icon }));
        });
      } else if (s.type === 'places' && inNomadMode) {
        // nomad mode 블록으로 변환 (전체 항목, 이름 자르지 X)
        nomadModeBlocks.push({
          icon: s.icon || 'corporate_fare',
          title: s.title,
          list: s.items.map(function(p) {
            return { name: p.name.replace(/<[^>]+>/g, ''), score: p.price || '' };
          })
        });
      } else if (s.type === 'list' && inNomadMode) {
        // list도 별도 블록 (전체 항목)
        nomadModeBlocks.push({
          icon: s.icon || 'schedule',
          title: s.title,
          items: s.items  // 전체 list 항목 그대로
        });
      } else if (s.type === 'table' && inBudget) {
        // budget을 magazine 형식으로 변환
        budgetData = {
          headers: s.headers,
          rows: (s.rows || []).map(function(row) {
            // row: [category, sub, eur, krw]
            var eurStr = row[2] ? row[2].toString() : '';
            var numMatch = eurStr.match(/(\d+)/);
            var value = numMatch ? parseInt(numMatch[1]) : 0;
            return {
              name: (row[0] || '').replace(/<[^>]+>/g, ''),
              sub: (row[1] || '').replace(/<[^>]+>/g, ''),
              eur: '€' + eurStr,
              krw: '₩' + (row[3] || '').replace(/<[^>]+>/g, ''),
              value: value
            };
          }),
          total: s.footer ? {
            name: (s.footer[0] || '').replace(/<[^>]+>/g, ''),
            eur: '€' + (s.footer[2] || '').replace(/<[^>]+>/g, ''),
            krw: '₩' + (s.footer[3] || '').replace(/<[^>]+>/g, ''),
            note: s.note
          } : null
        };
      } else if (s.type === 'budget' && inBudget) {
        // 새 스키마: rows = [{name, sub, eur, krw}] + total = {eur, krw}
        budgetData = {
          rows: (s.rows || []).map(function(r) {
            var eurStr = (r.eur || '').toString();
            var numMatch = eurStr.match(/(\d+)/);
            var value = numMatch ? parseInt(numMatch[1]) : 0;
            return {
              name: (r.name || '').replace(/<[^>]+>/g, ''),
              sub: (r.sub || '').replace(/<[^>]+>/g, ''),
              eur: eurStr.indexOf('€') === 0 || eurStr.indexOf('AU$') === 0 ? eurStr : '€' + eurStr,
              krw: (r.krw || '').toString().indexOf('₩') === 0 ? r.krw : '₩' + (r.krw || ''),
              value: value
            };
          }),
          total: s.total ? {
            name: '합계',
            eur: (s.total.eur || '').toString(),
            krw: (s.total.krw || '').toString().indexOf('₩') === 0 ? s.total.krw : '₩' + (s.total.krw || ''),
            note: s.note
          } : null
        };
      } else if (s.type === 'learn' && inFocus) {
        // FOCUS의 learn (다른 도시와 다른 것)은 전체를 raw로 — 정보 손실 X
        rawSections.push(s);
      } else if (s.type === 'learn' && inLearn) {
        // Learn 섹션은 그대로 (디자이너·작가 안목)
        rawSections.push(s);
      } else {
        // 나머지는 raw (neighborhoods, timeline, subsections, table from daytrips 등)
        rawSections.push(s);
      }
    });

    // 3. Places to Visit — bento
    if (landmarks && landmarks.length) {
      html += _renderPlacesMag(landmarks, hiddenSpots, '0' + sectionNum++);
    }

    // 4. Experiences + Nomad Mode (Split)
    if (experiences.length || nomadModeBlocks.length) {
      html += _renderExperiencesSplit(experiences, nomadModeBlocks, '0' + sectionNum++);
    }

    // 5. Raw 섹션들 (neighborhoods, learn, timeline, etc.)
    if (rawSections.length) {
      html += '<section class="nm-mag-section">';
      html += _magSectionHead('0' + sectionNum++, 'Deep Dive', 'Local Intelligence');
      html += '<div style="display:grid;grid-template-columns:1fr;gap:24px">';
      rawSections.forEach(function(s) {
        var renderer = SECTION_RENDERERS[s.type];
        if (renderer) html += renderer(s);
      });
      html += '</div></section>';
    }

    // 6. Budget — intensity 바
    if (budgetData) {
      html += _renderBudgetMag(budgetData, '0' + sectionNum++);
    }

    // (Why City 컴포넌트 제거 — FOCUS의 learn 6개를 그대로 raw로 출력하므로 정보 손실 X)

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
