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

  // ──────── Overview 페이지 ────────
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

    var html = '';

    // Page Header
    html += pageHeader('Voyage Snapshot', '1년 노마드 한눈에',
      '2028.6.9 인천 출국 · 17개 도시 · 6개 대륙');

    // ────── Voyage Snapshot — 4 bento cards ──────
    html += '<section class="nm-section">';
    html += '<div class="nm-section-head">' +
      '<h3 class="nm-headline-md">Voyage Snapshot</h3>' +
      '<span class="nm-label-sm" style="color:var(--nm-primary)">' + (dDay > 0 ? 'D-' + dDay : '출국 완료') + '</span>' +
    '</div>';
    html += '<div class="nm-grid nm-grid-4">';

    // 출국까지
    html += '<div class="nm-bento accent-accent">' +
      '<p class="nm-label-sm" style="margin-bottom:8px">출국까지</p>' +
      '<h4 class="nm-headline-lg">' + (dDay > 0 ? 'D-' + dDay : '🎉') + '</h4>' +
      '<div style="margin-top:16px;height:4px;background:var(--nm-surface-container);border-radius:99px;overflow:hidden">' +
        '<div style="height:100%;width:' + progressPct + '%;background:var(--nm-soft-accent)"></div>' +
      '</div>' +
      '<p class="nm-label-sm" style="margin-top:8px;text-transform:none;letter-spacing:0;color:var(--nm-text-3)">진행률 ' + progressPct + '% · 2028.6.9 리스본</p>' +
    '</div>';

    // 노마드 게이트
    html += '<div class="nm-bento accent-secondary">' +
      '<p class="nm-label-sm" style="margin-bottom:8px">노마드 게이트</p>' +
      '<h4 class="nm-headline-lg">₩450만</h4>' +
      '<div style="margin-top:16px;display:flex;align-items:center;gap:6px;color:var(--nm-text-2);font-size:12px">' +
        '<span class="material-symbols-outlined" style="font-size:14px;color:#15803d">trending_up</span>' +
        '월 본업 외 수익 · 욕심 ₩800만' +
      '</div>' +
    '</div>';

    // 1년 총 예산
    html += '<div class="nm-bento accent-tertiary">' +
      '<p class="nm-label-sm" style="margin-bottom:8px">1년 총 예산</p>' +
      '<h4 class="nm-headline-lg">' + fmtMan(grandTotal) + '</h4>' +
      '<p class="nm-label-sm" style="margin-top:16px;text-transform:none;letter-spacing:0;color:var(--nm-text-3)">소비성 ' + fmtMan(consumableTotal) + '</p>' +
    '</div>';

    // 총 도시
    html += '<div class="nm-bento accent-primary">' +
      '<p class="nm-label-sm" style="margin-bottom:8px">총 도시</p>' +
      '<h4 class="nm-headline-lg">17 cities</h4>' +
      '<p class="nm-label-sm" style="margin-top:16px;text-transform:none;letter-spacing:0;color:var(--nm-text-3)">유럽 10 · 오세아니아 4 · 미주 3</p>' +
    '</div>';

    html += '</div></section>';

    // ────── Phase Progress ──────
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

    // 4 step indicator
    html += '<div style="position:relative;padding-top:16px">';
    html += '<div style="display:flex;justify-content:space-between;position:relative;z-index:1">';
    PHASE_BOUNDARIES.forEach(function(p, i) {
      var state = i < phase.idx ? 'done' : (i === phase.idx ? 'current' : 'upcoming');
      var iconName = state === 'done' ? 'check' : (state === 'current' ? p.icon : 'lock');
      var bg = state === 'upcoming' ? 'var(--nm-surface-container)' : 'var(--nm-primary)';
      var color = state === 'upcoming' ? 'var(--nm-on-surface-variant)' : '#fff';
      var ring = state === 'current' ? 'box-shadow:0 0 0 6px var(--nm-primary-fixed);' : '';
      var opacity = state === 'upcoming' ? 'opacity:0.5;' : '';
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

    // ────── 2-col: Performance Tracks + Next Destination ──────
    html += '<div class="nm-grid nm-grid-2-1">';

    // 왼쪽: Performance Tracks
    html += '<div class="nm-card nm-card-lg">';
    html += '<h3 class="nm-headline-md" style="margin-bottom:24px">Performance Tracks</h3>';

    // Main Track
    html += '<div style="background:rgba(245,243,255,0.5);border:1px solid rgba(204,195,216,0.2);border-radius:12px;padding:20px;margin-bottom:16px">';
    html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px">';
    html += '<div>' +
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">' +
        '<span style="width:8px;height:8px;border-radius:50%;background:var(--nm-primary)"></span>' +
        '<h4 style="font-family:Manrope;font-size:18px;font-weight:600;color:var(--nm-deep-indigo)">Main Track · 포스타입 웹소</h4>' +
      '</div>' +
      '<p style="font-size:12px;color:var(--nm-text-3)">B시리즈 · 게이트 평가 핵심 트랙</p>' +
    '</div>';
    html += '<span class="nm-pill">High Priority</span>';
    html += '</div>';
    html += '<div class="nm-grid nm-grid-2" style="gap:12px">';
    html += '<div style="background:#fff;border-radius:8px;padding:14px"><p style="font-size:11px;color:var(--nm-text-3);font-weight:600">현재 월 수익</p><p style="font-family:Manrope;font-size:18px;font-weight:600;color:var(--nm-on-surface);margin-top:4px">₩200-250만</p></div>';
    html += '<div style="background:#fff;border-radius:8px;padding:14px"><p style="font-size:11px;color:var(--nm-text-3);font-weight:600">2027.12 목표</p><p style="font-family:Manrope;font-size:18px;font-weight:600;color:var(--nm-on-surface);margin-top:4px">월 ₩450만</p></div>';
    html += '</div>';
    html += '</div>';

    // Sub Track
    html += '<div style="background:rgba(230,238,255,0.3);border:1px solid rgba(204,195,216,0.1);border-radius:12px;padding:20px">';
    html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px">';
    html += '<div>' +
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">' +
        '<span style="width:8px;height:8px;border-radius:50%;background:var(--nm-secondary)"></span>' +
        '<h4 style="font-family:Manrope;font-size:18px;font-weight:600;color:var(--nm-deep-indigo)">Sub Track · 분석가 N IP</h4>' +
      '</div>' +
      '<p style="font-size:12px;color:var(--nm-text-3)">2026.5 Phase 1 진입 → 2027.12 Phase 7 도달</p>' +
    '</div>';
    html += '<span class="nm-pill nm-pill-soft" style="background:#a7a5ff;color:#393689">Stable</span>';
    html += '</div>';
    html += '<div class="nm-grid nm-grid-2" style="gap:12px">';
    html += '<div style="background:#fff;border-radius:8px;padding:14px"><p style="font-size:11px;color:var(--nm-text-3);font-weight:600">예상 월 수익</p><p style="font-family:Manrope;font-size:18px;font-weight:600;color:var(--nm-on-surface);margin-top:4px">₩100-300만</p></div>';
    html += '<div style="background:#fff;border-radius:8px;padding:14px"><p style="font-size:11px;color:var(--nm-text-3);font-weight:600">위치</p><p style="font-family:Manrope;font-size:18px;font-weight:600;color:var(--nm-on-surface);margin-top:4px">장기 자산</p></div>';
    html += '</div>';
    html += '</div>';

    html += '</div>'; // /Performance Tracks card

    // 오른쪽: Next Destination
    html += '<div class="nm-card nm-card-lg" style="display:flex;flex-direction:column">';
    html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:20px">' +
      '<span class="material-symbols-outlined" style="color:var(--nm-primary)">explore</span>' +
      '<h3 class="nm-headline-md">다음 거점</h3>' +
    '</div>';
    html += '<div style="display:flex;gap:10px;margin-bottom:16px">' +
      '<span class="nm-pill" style="background:#fff;color:var(--nm-primary);border:1px solid var(--nm-primary-soft)">Next Stop</span>' +
      '<span class="nm-pill" style="background:var(--nm-deep-indigo);color:#fff">✍️ ' + nextCity.mode + '</span>' +
    '</div>';
    html += '<h4 style="font-family:Manrope;font-size:22px;font-weight:700;color:var(--nm-on-surface);margin-bottom:8px">🇵🇹 ' + nextCity.city + '</h4>';
    html += '<p style="font-size:13px;color:var(--nm-text-2);line-height:1.6;margin-bottom:24px;flex:1">' + nextCity.detail + '</p>';
    html += '<div style="display:flex;flex-direction:column;gap:8px;border-top:1px solid #f1f5f9;padding-top:16px">';
    html += '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f8fafc">' +
      '<span style="font-size:13px;color:var(--nm-text-3)">도착 예정</span>' +
      '<span style="font-size:13px;font-weight:600;color:var(--nm-on-surface)">2028.6.9</span>' +
    '</div>';
    html += '<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f8fafc">' +
      '<span style="font-size:13px;color:var(--nm-text-3)">체류 기간</span>' +
      '<span style="font-size:13px;font-weight:600;color:var(--nm-on-surface)">30일</span>' +
    '</div>';
    html += '<div style="display:flex;justify-content:space-between;padding:8px 0">' +
      '<span style="font-size:13px;color:var(--nm-text-3)">예산</span>' +
      '<span style="font-size:13px;font-weight:600;color:var(--nm-primary)">₩' + nextCity.cost + '만</span>' +
    '</div>';
    html += '<button onclick="NOMAD_PAGES.go(\'nomad-city-porto\')" style="margin-top:12px;padding:10px;border:1px solid var(--nm-primary);color:var(--nm-primary);background:#fff;border-radius:8px;font-size:13px;font-weight:600;cursor:pointer;transition:background 0.15s" onmouseover="this.style.background=\'var(--nm-primary-soft)\'" onmouseout="this.style.background=\'#fff\'">' +
      '도시 가이드 보기' +
    '</button>';
    html += '</div>';
    html += '</div>'; // /Next Destination card

    html += '</div>'; // /2-col grid

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
