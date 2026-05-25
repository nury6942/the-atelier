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
