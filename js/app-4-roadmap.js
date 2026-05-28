// ═════════════════════════════════════════════════════════════
// The Atelier — Roadmap 페이지 (분석가 N: 노마드 + 수익 파이프라인)
//
// 데이터: window.RM_PHASES (js/roadmap-data.js)
// 체크 상태: localStorage "atelier_roadmap_checks" — { [taskId]: true|false }
// 설정: localStorage "atelier_roadmap_config"
// 펼침 상태: localStorage "atelier_roadmap_expanded" — { [phaseId]: true }
// ═════════════════════════════════════════════════════════════

(function() {
  'use strict';

  var LS_CHECKS = 'atelier_roadmap_checks';
  var LS_CONFIG = 'atelier_roadmap_config';
  var LS_EXPANDED = 'atelier_roadmap_expanded';
  var LS_DAILY_CHECKS = 'atelier_roadmap_daily_checks'; // 일일 액션 체크 (히스토리 유지)
  var LS_DAILY_GUIDE_OPEN = 'atelier_roadmap_daily_guide_open'; // 가이드 펼침 상태 (날짜별)

  // 현재 보고 있는 날짜 (네비게이션용, 기본 = 오늘)
  var rmViewDate = null;

  // ─── 데이터 액세스 ───
  function rmGetPhases() {
    // 시드 데이터 + 체크 상태(localStorage) 머지
    var seed = (window.RM_PHASES || []).map(function(p){
      return JSON.parse(JSON.stringify(p)); // deep clone
    });
    var checks = {};
    try { checks = JSON.parse(localStorage.getItem(LS_CHECKS)) || {}; } catch(e){}
    seed.forEach(function(p){
      (p.checklist||[]).forEach(function(t){
        if (checks.hasOwnProperty(t.id)) t.done = !!checks[t.id];
      });
    });
    return seed;
  }
  function rmGetChecks() {
    try { return JSON.parse(localStorage.getItem(LS_CHECKS)) || {}; }
    catch(e) { return {}; }
  }
  function rmSetCheck(taskId, done) {
    var checks = rmGetChecks();
    checks[taskId] = !!done;
    try { localStorage.setItem(LS_CHECKS, JSON.stringify(checks)); } catch(e){}
  }
  function rmGetConfig() {
    try {
      var c = JSON.parse(localStorage.getItem(LS_CONFIG)) || {};
      return Object.assign({}, window.RM_CONFIG_DEFAULT||{}, c);
    } catch(e) { return Object.assign({}, window.RM_CONFIG_DEFAULT||{}); }
  }
  function rmSaveConfig(c) {
    try { localStorage.setItem(LS_CONFIG, JSON.stringify(c)); } catch(e){}
  }
  function rmGetExpanded() {
    try { return JSON.parse(localStorage.getItem(LS_EXPANDED)) || {}; }
    catch(e) { return {}; }
  }
  function rmSetExpanded(phaseId, isOpen) {
    var e = rmGetExpanded();
    if (isOpen) e[phaseId] = true; else delete e[phaseId];
    try { localStorage.setItem(LS_EXPANDED, JSON.stringify(e)); } catch(err){}
  }

  // ─── 유틸 ───
  function rmPhaseStatus(phase, todayStr) {
    if (phase.end < todayStr) return 'done';
    if (phase.start > todayStr) return 'upcoming';
    return 'now';
  }
  function rmProgress(phase) {
    if (!phase.checklist || !phase.checklist.length) return 0;
    var done = phase.checklist.filter(function(t){ return t.done; }).length;
    return Math.round(done / phase.checklist.length * 100);
  }
  function rmDateRangeShort(start, end) {
    if (!start || !end) return '';
    var s = new Date(start + 'T00:00:00');
    var e = new Date(end + 'T00:00:00');
    var sY = s.getFullYear(), eY = e.getFullYear();
    var sM = s.getMonth()+1, eM = e.getMonth()+1;
    var sD = s.getDate(), eD = e.getDate();
    if (sY === eY && sM === eM) return sY + '.' + sM + '.' + sD + '~' + eD;
    if (sY === eY) return sY + '.' + sM + '.' + sD + ' ~ ' + eM + '.' + eD;
    return sY + '.' + sM + '.' + sD + ' ~ ' + eY + '.' + eM + '.' + eD;
  }
  function rmMonthLabel(start, end) {
    if (!start || !end) return '';
    var s = new Date(start + 'T00:00:00');
    var e = new Date(end + 'T00:00:00');
    var sM = s.getMonth()+1, eM = e.getMonth()+1;
    var sY = s.getFullYear(), eY = e.getFullYear();
    if (sY === eY && sM === eM) return sY + '.' + sM;
    if (sY === eY) return sY + '.' + sM + '–' + eM;
    return sY + '.' + sM + ' – ' + eY + '.' + eM;
  }

  // ═══════════════════════════════════════════════════
  // 메인 렌더링
  // ═══════════════════════════════════════════════════
  function loadRoadmap() {
    var phases = rmGetPhases();
    phases.sort(function(a,b){ return a.order - b.order; });
    var config = rmGetConfig();
    var titleEl = document.getElementById('rm-roadmap-title');
    if (titleEl) titleEl.textContent = config.title;

    // 오늘 — 데이터에 맞춰 2026-05-19 기준으로 동작하게 실제 today 사용
    var todayStr = new Date().toISOString().split('T')[0];

    renderTimeline(phases, todayStr);
    renderTodayAction(todayStr);
    renderActive(phases, todayStr);
    renderOthers(phases, todayStr);
    renderSidebar(phases, todayStr, config);
  }
  window.loadRoadmap = loadRoadmap;

  // ═══════════════════════════════════════════════════
  // 일일 액션 ("오늘 할 한 가지" + 클릭 시 가이드 펼침)
  // ═══════════════════════════════════════════════════
  function rmGetDailyChecks() {
    try { return JSON.parse(localStorage.getItem(LS_DAILY_CHECKS)) || {}; }
    catch(e) { return {}; }
  }
  function rmSetDailyCheck(dateStr, done) {
    var checks = rmGetDailyChecks();
    if (done) checks[dateStr] = true; else delete checks[dateStr];
    try { localStorage.setItem(LS_DAILY_CHECKS, JSON.stringify(checks)); } catch(e){}
  }
  function rmGetDailyGuideOpen() {
    try { return JSON.parse(localStorage.getItem(LS_DAILY_GUIDE_OPEN)) || {}; }
    catch(e) { return {}; }
  }
  function rmSetDailyGuideOpen(dateStr, isOpen) {
    var o = rmGetDailyGuideOpen();
    if (isOpen) o[dateStr] = true; else delete o[dateStr];
    try { localStorage.setItem(LS_DAILY_GUIDE_OPEN, JSON.stringify(o)); } catch(e){}
  }

  function rmFindAction(dateStr) {
    var arr = window.RM_DAILY_ACTIONS || [];
    return arr.find(function(a){ return a.date === dateStr; });
  }
  function rmFindGuide(dateStr) {
    var arr = window.RM_DAILY_GUIDES || [];
    return arr.find(function(g){ return g.date === dateStr; });
  }
  function rmFindNextAction(fromDateStr) {
    var arr = window.RM_DAILY_ACTIONS || [];
    return arr.find(function(a){ return a.date > fromDateStr; });
  }
  function rmFindPrevAction(fromDateStr) {
    var arr = window.RM_DAILY_ACTIONS || [];
    var prev = null;
    for (var i=0; i<arr.length; i++) {
      if (arr[i].date < fromDateStr) prev = arr[i];
      else break;
    }
    return prev;
  }
  function rmFmtDateKR(dateStr) {
    if (!dateStr) return '';
    var d = new Date(dateStr + 'T00:00:00');
    var m = d.getMonth()+1, day = d.getDate();
    var wd = ['일','월','화','수','목','금','토'][d.getDay()];
    return m + '월 ' + day + '일 (' + wd + ')';
  }

  function renderTodayAction(todayStr) {
    var section = document.getElementById('rm-today-section');
    if (!section) return;

    // viewDate가 없으면 오늘로 초기화
    if (!rmViewDate) rmViewDate = todayStr;
    var viewStr = rmViewDate;

    var action = rmFindAction(viewStr);
    var checks = rmGetDailyChecks();
    var isDone = !!checks[viewStr];
    var openMap = rmGetDailyGuideOpen();
    var isOpen = !!openMap[viewStr];

    // 좌우 네비 화살표 (slate → violet hover)
    var prevA = rmFindPrevAction(viewStr);
    var nextA = rmFindNextAction(viewStr);
    var prevBtn = '<button onclick="rmDailyPrev()" class="p-1.5 rounded-full hover:bg-violet-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-slate-400 hover:text-violet-600" ' + (prevA ? '' : 'disabled') + ' title="이전 액션">' +
      '<span class="material-symbols-outlined" style="font-size: var(--font-size-h2-lg)">chevron_left</span></button>';
    var nextBtn = '<button onclick="rmDailyNext()" class="p-1.5 rounded-full hover:bg-violet-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed text-slate-400 hover:text-violet-600" ' + (nextA ? '' : 'disabled') + ' title="다음 액션">' +
      '<span class="material-symbols-outlined" style="font-size: var(--font-size-h2-lg)">chevron_right</span></button>';
    // 날짜 라벨 (그라데이션 텍스트)
    var dateLabel = (viewStr === todayStr ? 'TODAY · ' : '') + rmFmtDateKR(viewStr);
    var dateBadge = '<span class="text-[10px] font-extrabold tracking-[0.25em] uppercase" style="background:linear-gradient(135deg,#7c3aed,#ec4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">' + dateLabel + '</span>';
    var todayJump = (viewStr !== todayStr)
      ? ' <button onclick="rmDailyToday()" class="ml-2 text-[10px] font-bold tracking-wider uppercase text-violet-600 hover:text-violet-800 underline underline-offset-2">오늘로</button>'
      : '';

    // ─── 액션 없음 (주말 등) ───
    if (!action) {
      var nextLabel = nextA ? ('다음 액션: ' + rmFmtDateKR(nextA.date) + ' · ' + nextA.title) : '예정된 액션이 없습니다.';
      section.innerHTML =
        '<div class="rounded-2xl p-6 md:p-7 bg-white border border-slate-100 shadow-sm">' +
          '<div class="flex items-center justify-between mb-4">' +
            '<div class="flex items-center gap-2 min-w-0 flex-wrap">' + prevBtn + dateBadge + todayJump + '</div>' +
            '<div>' + nextBtn + '</div>' +
          '</div>' +
          '<h2 class="text-2xl md:text-3xl font-bold leading-tight text-slate-900 mb-2">오늘은 쉬는 날</h2>' +
          '<p class="text-sm text-slate-500">' + String(nextLabel).replace(/</g,'&lt;') + '</p>' +
        '</div>';
      return;
    }

    // ─── 액션 있음 ───
    var guide = rmFindGuide(viewStr);
    var hasGuide = !!guide;
    var checkLabel = isDone ? '완료됨 ✓' : '완료 체크';
    var checkBtnStyle = isDone
      ? 'background:#f1f5f9;color:#64748b'
      : 'background:linear-gradient(135deg,#7c3aed 0%,#a855f7 50%,#ec4899 100%);color:#fff';
    var titleCls = isDone ? 'line-through text-slate-400' : 'text-slate-900';

    // 헤더 + 액션 카드 (화이트 베이스)
    var headerHtml =
      '<div class="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">' +
        // 상단 네비
        '<div class="px-6 md:px-7 pt-5 flex items-center justify-between">' +
          '<div class="flex items-center gap-2 min-w-0 flex-wrap">' + prevBtn + dateBadge + todayJump + '</div>' +
          '<div>' + nextBtn + '</div>' +
        '</div>' +
        // 본문 (클릭 → 가이드 토글)
        '<div class="px-6 md:px-7 pt-3 pb-5 cursor-pointer hover:bg-slate-50/40 transition-colors" onclick="rmToggleDailyGuide()">' +
          '<div class="flex items-center gap-2 mb-3 flex-wrap">' +
            '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 tracking-wider uppercase">Phase ' + action.phase + ' · Week ' + action.week + '</span>' +
            (action.estimatedTime ? '<span class="text-[11px] font-semibold text-slate-500">⏱ ' + String(action.estimatedTime).replace(/</g,'&lt;') + '</span>' : '') +
          '</div>' +
          '<h2 class="text-2xl md:text-3xl font-bold leading-tight ' + titleCls + '">' + String(action.title||'').replace(/</g,'&lt;') + '</h2>' +
          (hasGuide
            ? '<p class="text-xs text-slate-500 mt-2 flex items-center gap-1">' + (isOpen ? '가이드 접기' : '카드를 클릭하면 실행 가이드가 펼쳐져요') + '<span class="material-symbols-outlined" style="font-size: var(--font-size-body);transform:rotate(' + (isOpen ? '180deg' : '0deg') + ');transition:transform .2s">expand_more</span></p>'
            : '<p class="text-xs text-slate-400 mt-2 italic">가이드 준비 중</p>') +
        '</div>' +
        // 가이드 인라인 펼침
        (isOpen && hasGuide ? renderGuideBody(guide, viewStr, isDone) : '') +
        // 하단 완료 체크 버튼 (가이드 닫혀있을 때만)
        (!isOpen ?
          '<div class="px-6 md:px-7 pb-5">' +
            '<button onclick="event.stopPropagation(); rmToggleDailyAction(\'' + viewStr + '\')" class="w-full py-3 rounded-xl text-sm font-bold tracking-wide transition-opacity hover:opacity-90" style="' + checkBtnStyle + '">' + checkLabel + '</button>' +
          '</div>' : '') +
      '</div>';

    section.innerHTML = headerHtml;
  }

  function renderGuideBody(guide, dateStr, isDone) {
    function sec(label, contentHtml) {
      return '<section class="mb-6 last:mb-0">' +
        '<h4 class="text-[10px] font-extrabold tracking-[0.25em] uppercase mb-2.5" style="background:linear-gradient(135deg,#7c3aed,#ec4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">' + label + '</h4>' +
        contentHtml +
      '</section>';
    }
    function escape(s) { return String(s||'').replace(/</g,'&lt;'); }

    // 흐름 (번호 매김)
    var flowHtml = '';
    if (guide.flow && guide.flow.length) {
      flowHtml = sec('흐름',
        '<ol class="space-y-2.5">' + guide.flow.map(function(step, i){
          return '<li class="flex gap-3 text-[14px] leading-snug">' +
            '<span class="shrink-0 w-5 h-5 rounded-full text-white text-[11px] font-bold flex items-center justify-center mt-0.5" style="background:linear-gradient(135deg,#a855f7,#ec4899)">' + (i+1) + '</span>' +
            '<span class="text-slate-700">' + escape(step) + '</span>' +
          '</li>';
        }).join('') + '</ol>');
    }

    // 결정 포인트
    var decisionHtml = '';
    if (guide.decisionPoints && guide.decisionPoints.length) {
      decisionHtml = sec('결정 포인트',
        '<ul class="space-y-1.5">' + guide.decisionPoints.map(function(p){
          return '<li class="flex gap-2 text-[14px] leading-snug text-slate-700">' +
            '<span class="text-violet-400 shrink-0">•</span><span>' + escape(p) + '</span>' +
          '</li>';
        }).join('') + '</ul>');
    }

    // 참고 예시 (tone별 그룹)
    var examplesHtml = '';
    if (guide.examples && guide.examples.length) {
      examplesHtml = sec('참고 예시',
        '<div class="space-y-2.5">' + guide.examples.map(function(g){
          return '<div class="flex flex-wrap items-baseline gap-x-3 gap-y-1.5">' +
            '<span class="text-[11px] font-bold tracking-wider text-slate-500 shrink-0">' + escape(g.tone) + '</span>' +
            (g.items||[]).map(function(it){
              return '<span class="text-[13px] px-2 py-0.5 rounded-md bg-violet-50 text-violet-700 font-medium">' + escape(it) + '</span>';
            }).join('') +
          '</div>';
        }).join('') + '</div>');
    }

    // 주의
    var cautionHtml = '';
    if (guide.caution && guide.caution.length) {
      cautionHtml = sec('주의',
        '<ul class="space-y-1.5">' + guide.caution.map(function(c){
          return '<li class="flex gap-2 text-[14px] leading-snug text-slate-700">' +
            '<span class="text-amber-500 shrink-0">⚠</span><span>' + escape(c) + '</span>' +
          '</li>';
        }).join('') + '</ul>');
    }

    // 필요 리소스
    var resHtml = '';
    if (guide.resources && guide.resources.length) {
      resHtml = sec('필요 리소스',
        '<ul class="space-y-1.5">' + guide.resources.map(function(r){
          var label = escape(r.label||'');
          if (r.url) {
            return '<li class="text-[14px] leading-snug"><a href="' + escape(r.url) + '" target="_blank" rel="noopener" class="text-violet-600 underline underline-offset-2 hover:text-violet-800 font-medium">' + label + ' ↗</a></li>';
          }
          return '<li class="text-[14px] leading-snug text-slate-700">' + label + '</li>';
        }).join('') + '</ul>');
    }

    // 다음 액션 예고
    var nextHtml = '';
    if (guide.next) {
      nextHtml = sec('다음 액션 예고',
        '<p class="text-[14px] leading-snug text-slate-600 italic">' + escape(guide.next) + '</p>');
    }

    // 완료 체크 버튼 (가이드 내부)
    var checkLabel = isDone ? '완료됨 ✓' : '완료 체크';
    var checkBtnStyle = isDone
      ? 'background:#f1f5f9;color:#64748b'
      : 'background:linear-gradient(135deg,#7c3aed 0%,#a855f7 50%,#ec4899 100%);color:#fff';

    return '<div class="px-6 md:px-7 pb-6 pt-5 border-t border-slate-100 bg-slate-50/30">' +
      flowHtml + decisionHtml + examplesHtml + cautionHtml + resHtml + nextHtml +
      '<button onclick="event.stopPropagation(); rmToggleDailyAction(\'' + dateStr + '\')" class="w-full mt-2 py-3 rounded-xl text-sm font-bold tracking-wide transition-opacity hover:opacity-90" style="' + checkBtnStyle + '">' + checkLabel + '</button>' +
    '</div>';
  }

  // 1. 가로 타임라인
  function renderTimeline(phases, todayStr) {
    var el = document.getElementById('rm-timeline-inner');
    if (!el) return;
    el.innerHTML = phases.map(function(p, i){
      var status = rmPhaseStatus(p, todayStr);
      var isNow = status === 'now';
      var isDone = status === 'done';
      var opacity = isNow ? '' : 'opacity-50 hover:opacity-100 transition-opacity';
      var dotColor = isNow ? 'ring-4 ring-pink-200' :
                     isDone ? 'bg-violet-300' : 'bg-white border border-slate-300';
      var dotStyle = isNow ? 'background:linear-gradient(135deg,#a855f7,#ec4899)' : '';
      var lineColor = (isDone || isNow) ? 'bg-violet-400' : 'bg-slate-200';
      var labelColor = isNow ? 'text-pink-600' : 'text-slate-500';
      var titleColor = isNow ? 'text-violet-900' : (isDone ? 'text-slate-500' : 'text-slate-800');
      var label = isNow ? 'NOW' : 'PHASE ' + p.order;
      var isLast = i === phases.length - 1;
      return '<div class="flex flex-col items-start min-w-[140px] cursor-pointer ' + opacity + '" onclick="rmFocusPhase(\'' + p.id + '\')">' +
        '<div class="flex items-center w-full mb-3">' +
          '<div class="h-3 w-3 rounded-full ' + dotColor + ' shrink-0" style="' + dotStyle + '"></div>' +
          (isLast ? '' : '<div class="h-[1.5px] flex-1 ' + lineColor + ' ml-2"></div>') +
        '</div>' +
        '<span class="text-[10px] font-extrabold uppercase tracking-[0.2em] mb-1 ' + labelColor + '">' + label + '</span>' +
        '<h4 class="text-lg font-bold leading-tight ' + titleColor + '">' + p.name + '</h4>' +
        '<p class="text-xs text-slate-500 mt-0.5">' + rmMonthLabel(p.start, p.end) + '</p>' +
      '</div>';
    }).join('');
  }

  // 2. 활성 Phase (큰 그라데이션 카드)
  function renderActive(phases, todayStr) {
    var section = document.getElementById('rm-active-section');
    if (!section) return;
    var active = phases.find(function(p){ return rmPhaseStatus(p, todayStr) === 'now'; });
    // now가 없으면 다음 upcoming 또는 최근 done
    if (!active) {
      active = phases.find(function(p){ return rmPhaseStatus(p, todayStr) === 'upcoming'; }) ||
               phases.slice().reverse().find(function(p){ return rmPhaseStatus(p, todayStr) === 'done'; });
    }
    if (!active) { section.innerHTML = '<p class="text-sm text-slate-400 italic">Phase가 없습니다.</p>'; return; }
    var progress = rmProgress(active);
    var status = rmPhaseStatus(active, todayStr);
    var statusLabel = status === 'now' ? 'NOW' : (status === 'upcoming' ? 'UPCOMING' : 'DONE');
    var doneCount = (active.checklist||[]).filter(function(t){return t.done;}).length;
    var totalCount = (active.checklist||[]).length;

    var checklistHtml = (active.checklist||[]).map(function(t){
      var checked = t.done ? 'checked' : '';
      var lineCls = t.done ? 'line-through text-slate-400' : 'text-slate-700';
      return '<label class="flex items-start gap-3 group cursor-pointer py-1">' +
        '<input type="checkbox" ' + checked + ' onchange="rmToggleTask(\'' + t.id + '\')" class="mt-0.5 w-5 h-5 rounded border-slate-300 accent-violet-600 shrink-0"/>' +
        '<span class="text-[15px] leading-snug ' + lineCls + '">' + String(t.text||'').replace(/</g,'&lt;') + '</span>' +
      '</label>';
    }).join('');

    section.innerHTML = '<div id="rm-active-card" class="rounded-2xl p-7 md:p-8 relative overflow-hidden bg-white border border-slate-100 shadow-sm">' +
      '<div class="relative z-10">' +
        '<div class="flex justify-between items-start mb-6 flex-wrap gap-4">' +
          '<div class="min-w-0 flex-1">' +
            '<span class="inline-block text-[11px] font-bold px-3 py-1 rounded-full mb-3 text-white tracking-wider" style="background:linear-gradient(135deg,#7c3aed 0%,#a855f7 50%,#ec4899 100%)">' + statusLabel + ' · Phase ' + active.order + ' · ' + active.name + '</span>' +
            '<h2 class="text-3xl md:text-4xl font-bold leading-tight text-slate-900">' + (active.title||active.name).replace(/</g,'&lt;') + '</h2>' +
            '<p class="text-sm md:text-base mt-2 text-slate-500">' + rmDateRangeShort(active.start, active.end) + '</p>' +
          '</div>' +
          (active.goal ? '<div class="text-right max-w-xs">' +
            '<span class="text-[11px] font-bold tracking-wider uppercase text-slate-400">목표</span>' +
            '<p class="text-sm italic mt-1 leading-snug text-slate-600">' + String(active.goal).replace(/</g,'&lt;') + '</p>' +
          '</div>' : '') +
        '</div>' +
        // Progress
        '<div class="mb-7">' +
          '<div class="flex justify-between text-[11px] font-bold mb-2 tracking-wider">' +
            '<span class="text-slate-500">진척 · ' + doneCount + '/' + totalCount + '</span>' +
            '<span style="background:linear-gradient(135deg,#7c3aed,#ec4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;font-weight:800">' + progress + '%</span>' +
          '</div>' +
          '<div class="h-1.5 w-full bg-slate-100 relative rounded-full overflow-hidden">' +
            '<div class="h-full transition-all duration-700 rounded-full" style="width:' + progress + '%;background:linear-gradient(90deg,#7c3aed,#ec4899)"></div>' +
          '</div>' +
        '</div>' +
        // Checklist (2-col on desktop)
        '<div class="grid grid-cols-1 md:grid-cols-2 gap-y-1 gap-x-12">' + checklistHtml + '</div>' +
      '</div>' +
      // 배경 큰 숫자 (옅은 그라데이션)
      '<div class="absolute -right-12 -bottom-16 opacity-[0.06] select-none pointer-events-none">' +
        '<span class="text-[280px] font-extrabold italic leading-none" style="background:linear-gradient(135deg,#7c3aed,#ec4899);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">' + String(active.order).padStart(2,'0') + '</span>' +
      '</div>' +
    '</div>';
  }

  // 3. 나머지 Phase들 (접힘/펼침)
  function renderOthers(phases, todayStr) {
    var el = document.getElementById('rm-upcoming-list');
    if (!el) return;
    var active = phases.find(function(p){ return rmPhaseStatus(p, todayStr) === 'now'; });
    if (!active) active = phases.find(function(p){ return rmPhaseStatus(p, todayStr) === 'upcoming'; });
    var others = phases.filter(function(p){ return !active || p.id !== active.id; });
    if (!others.length) { el.innerHTML = ''; return; }
    var expanded = rmGetExpanded();
    el.innerHTML = others.map(function(p){
      var status = rmPhaseStatus(p, todayStr);
      var isDone = status === 'done';
      var progress = rmProgress(p);
      var doneCount = (p.checklist||[]).filter(function(t){return t.done;}).length;
      var totalCount = (p.checklist||[]).length;
      var isOpen = !!expanded[p.id];
      // 헤더 색상
      var orderColor = isDone ? 'text-slate-300' : 'text-slate-400';
      var nameColor = isDone ? 'text-slate-500' : 'text-slate-800';
      var statusBadge = '';
      if (status === 'done') statusBadge = '<span class="text-[9px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 uppercase tracking-wider">DONE</span>';
      else if (status === 'upcoming') statusBadge = '<span class="text-[9px] font-bold px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 uppercase tracking-wider">UPCOMING</span>';
      // 펼친 콘텐츠
      var bodyHtml = '';
      if (isOpen) {
        var checklistHtml = (p.checklist||[]).map(function(t){
          var checked = t.done ? 'checked' : '';
          var lineCls = t.done ? 'line-through text-slate-400' : 'text-slate-700';
          return '<label class="flex items-start gap-3 group cursor-pointer py-1">' +
            '<input type="checkbox" ' + checked + ' onchange="rmToggleTask(\'' + t.id + '\')" class="mt-0.5 w-4 h-4 rounded border-slate-300 accent-violet-600 shrink-0"/>' +
            '<span class="text-[14px] leading-snug ' + lineCls + '">' + String(t.text||'').replace(/</g,'&lt;') + '</span>' +
          '</label>';
        }).join('');
        bodyHtml = '<div class="px-6 pb-5 pt-2 border-t border-slate-100 bg-slate-50/40">' +
          (p.title ? '<h4 class="text-base font-bold text-slate-800 mb-1">' + String(p.title).replace(/</g,'&lt;') + '</h4>' : '') +
          (p.goal ? '<p class="text-[13px] italic text-slate-500 mb-4 leading-snug">' + String(p.goal).replace(/</g,'&lt;') + '</p>' : '') +
          '<div class="flex justify-between text-[11px] font-bold mb-2 tracking-wider text-slate-500"><span>진척 · ' + doneCount + '/' + totalCount + '</span><span>' + progress + '%</span></div>' +
          '<div class="h-1 w-full bg-slate-200 rounded-full overflow-hidden mb-4"><div class="h-full transition-all duration-500 rounded-full" style="width:' + progress + '%;background:linear-gradient(90deg,#7c3aed,#ec4899)"></div></div>' +
          '<div class="grid grid-cols-1 md:grid-cols-2 gap-y-0.5 gap-x-8">' + checklistHtml + '</div>' +
        '</div>';
      } else {
        // 미니 진척 바 (접힌 상태에서도 노출)
        bodyHtml = '<div class="px-6 pb-3"><div class="flex items-center gap-3">' +
          '<div class="flex-1 h-1 bg-slate-100 rounded-full overflow-hidden"><div class="h-full rounded-full" style="width:' + progress + '%;background:linear-gradient(90deg,#7c3aed,#ec4899)"></div></div>' +
          '<span class="text-[10px] font-bold text-slate-400">' + progress + '% · ' + doneCount + '/' + totalCount + '</span>' +
        '</div></div>';
      }
      return '<div class="bg-white border border-slate-100 rounded-2xl shadow-sm overflow-hidden" id="rm-other-' + p.id + '">' +
        '<div class="group flex items-center justify-between px-6 pt-5 pb-3 hover:bg-slate-50 transition-all cursor-pointer" onclick="rmToggleExpand(\'' + p.id + '\')">' +
          '<div class="flex items-center gap-5 min-w-0">' +
            '<span class="text-xl font-extrabold tracking-tight ' + orderColor + '">' + String(p.order).padStart(2,'0') + '</span>' +
            '<div class="min-w-0">' +
              '<div class="flex items-center gap-2 flex-wrap">' +
                '<h5 class="text-base font-bold ' + nameColor + '">' + String(p.name||'').replace(/</g,'&lt;') + '</h5>' +
                statusBadge +
              '</div>' +
              '<p class="text-xs text-slate-500 mt-0.5">' + rmDateRangeShort(p.start, p.end) + '</p>' +
            '</div>' +
          '</div>' +
          '<span class="material-symbols-outlined text-slate-300 group-hover:text-violet-600 transition-all" style="transform:rotate(' + (isOpen ? '180deg' : '0deg') + ')">expand_more</span>' +
        '</div>' +
        bodyHtml +
      '</div>';
    }).join('');
  }

  // 4. Sidebar (Next N Days + Status Report)
  function renderSidebar(phases, todayStr, config) {
    var nextDays = config.nextDays || 12;
    var today = new Date();
    var endDate = new Date(today); endDate.setDate(endDate.getDate() + nextDays);
    var endStr = endDate.toISOString().split('T')[0];

    var active = phases.find(function(p){ return rmPhaseStatus(p, todayStr) === 'now'; });
    var nextItems = [];
    if (active && active.checklist) {
      nextItems = active.checklist.filter(function(t){ return !t.done; }).slice(0, 5);
    }
    // 곧 시작하는 phase
    var startingSoon = phases.filter(function(p){
      return p.start > todayStr && p.start <= endStr;
    });

    var rangeEl = document.getElementById('rm-next-range');
    if (rangeEl) {
      var t = todayStr;
      var fmt = function(s){ var d=new Date(s+'T00:00:00'); return (d.getMonth()+1)+'.'+d.getDate(); };
      rangeEl.textContent = fmt(t) + ' ~ ' + fmt(endStr);
    }

    var itemsEl = document.getElementById('rm-next-items');
    if (itemsEl) {
      var html = '';
      if (nextItems.length === 0 && !startingSoon.length) {
        html = '<p class="text-sm text-slate-400 italic">예정된 작업이 없습니다 ✓</p>';
      } else {
        html = nextItems.map(function(t){
          return '<label class="flex items-start gap-3 cursor-pointer group">' +
            '<input type="checkbox" onchange="rmToggleTask(\'' + t.id + '\')" class="mt-0.5 w-4 h-4 rounded border-slate-300 accent-violet-600 shrink-0"/>' +
            '<span class="text-[13px] leading-snug text-slate-700">' + String(t.text||'').replace(/</g,'&lt;') + '</span>' +
          '</label>';
        }).join('');
        startingSoon.forEach(function(p){
          html += '<div class="pt-3 mt-3 border-t border-slate-100">' +
            '<p class="text-[10px] uppercase tracking-widest text-slate-400 mb-1">Phase ' + p.order + ' 시작</p>' +
            '<p class="text-sm font-bold text-slate-700">' + String(p.name||'').replace(/</g,'&lt;') + '</p>' +
          '</div>';
        });
      }
      itemsEl.innerHTML = html;
    }

    var quoteEl = document.getElementById('rm-quote');
    if (quoteEl && config.quote) quoteEl.textContent = config.quote;

    // Status Report
    var weeksLeft = '—';
    if (active && active.end) {
      var endD = new Date(active.end + 'T00:00:00');
      var diff = Math.ceil((endD - today) / 86400000);
      weeksLeft = Math.max(0, Math.ceil(diff / 7));
    } else if (phases.length) {
      var lastP = phases[phases.length-1];
      var endL = new Date(lastP.end + 'T00:00:00');
      var diff2 = Math.ceil((endL - today) / 86400000);
      weeksLeft = Math.max(0, Math.ceil(diff2 / 7));
    }
    var weeksEl = document.getElementById('rm-weeks-remain');
    if (weeksEl) weeksEl.textContent = String(weeksLeft).padStart(2,'0');
    var focusEl = document.getElementById('rm-focus');
    if (focusEl) {
      var focusText = '—';
      if (active) {
        if (active.notes) focusText = active.notes;
        else if (active.goal) focusText = active.goal;
        else focusText = active.title || active.name;
      }
      focusEl.textContent = '현재 집중: ' + focusText;
    }
  }

  // ═══════════════════════════════════════════════════
  // 인터랙션
  // ═══════════════════════════════════════════════════
  // ─── 일일 액션 인터랙션 ───
  window.rmDailyPrev = function() {
    var cur = rmViewDate || new Date().toISOString().split('T')[0];
    var p = rmFindPrevAction(cur);
    if (!p) return;
    rmViewDate = p.date;
    var todayStr = new Date().toISOString().split('T')[0];
    renderTodayAction(todayStr);
  };
  window.rmDailyNext = function() {
    var cur = rmViewDate || new Date().toISOString().split('T')[0];
    var n = rmFindNextAction(cur);
    if (!n) return;
    rmViewDate = n.date;
    var todayStr = new Date().toISOString().split('T')[0];
    renderTodayAction(todayStr);
  };
  window.rmDailyToday = function() {
    var todayStr = new Date().toISOString().split('T')[0];
    rmViewDate = todayStr;
    renderTodayAction(todayStr);
  };
  window.rmToggleDailyGuide = function() {
    var date = rmViewDate || new Date().toISOString().split('T')[0];
    var openMap = rmGetDailyGuideOpen();
    var isOpen = !!openMap[date];
    rmSetDailyGuideOpen(date, !isOpen);
    var todayStr = new Date().toISOString().split('T')[0];
    renderTodayAction(todayStr);
  };
  window.rmToggleDailyAction = function(dateStr) {
    var checks = rmGetDailyChecks();
    var wasDone = !!checks[dateStr];
    rmSetDailyCheck(dateStr, !wasDone);
    // 체크되면 가이드 자동 접힘 + 미니 축하 토스트
    if (!wasDone) {
      rmSetDailyGuideOpen(dateStr, false);
      rmShowMiniCelebrate();
    }
    var todayStr = new Date().toISOString().split('T')[0];
    renderTodayAction(todayStr);
  };
  function rmShowMiniCelebrate() {
    var existing = document.getElementById('rm-mini-celebrate');
    if (existing) existing.remove();
    var t = document.createElement('div');
    t.id = 'rm-mini-celebrate';
    t.textContent = '✨ 오늘 한 가지 완료';
    t.style.cssText = 'position:fixed;left:50%;top:84px;transform:translateX(-50%);' +
      'background:linear-gradient(135deg,#7c3aed,#ec4899);color:#fff;' +
      'padding: var(--space-2-5) var(--space-4-5);border-radius:999px;font-size: var(--font-size-body-sm);font-weight:700;' +
      'box-shadow:0 12px 32px rgba(124,58,237,.35);z-index:9999;' +
      'opacity:0;transition:opacity .25s ease, transform .25s ease;pointer-events:none;' +
      'font-family:"Plus Jakarta Sans","Pretendard",sans-serif;letter-spacing:.02em';
    document.body.appendChild(t);
    requestAnimationFrame(function(){
      t.style.opacity = '1';
      t.style.transform = 'translateX(-50%) translateY(4px)';
    });
    setTimeout(function(){
      t.style.opacity = '0';
      t.style.transform = 'translateX(-50%) translateY(-4px)';
      setTimeout(function(){ if (t.parentNode) t.parentNode.removeChild(t); }, 300);
    }, 1400);
  }

  window.rmToggleTask = function(taskId) {
    var checks = rmGetChecks();
    checks[taskId] = !checks[taskId];
    try { localStorage.setItem(LS_CHECKS, JSON.stringify(checks)); } catch(e){}
    loadRoadmap();
  };

  window.rmToggleExpand = function(phaseId) {
    var e = rmGetExpanded();
    if (e[phaseId]) delete e[phaseId];
    else e[phaseId] = true;
    try { localStorage.setItem(LS_EXPANDED, JSON.stringify(e)); } catch(err){}
    loadRoadmap();
    // 펼친 카드로 스크롤
    setTimeout(function(){
      var el = document.getElementById('rm-other-' + phaseId);
      if (el && e[phaseId]) el.scrollIntoView({ behavior:'smooth', block:'nearest' });
    }, 50);
  };

  window.rmFocusPhase = function(phaseId) {
    // 타임라인 점 클릭 → 해당 Phase를 펼침 + 스크롤
    var phases = rmGetPhases();
    var todayStr = new Date().toISOString().split('T')[0];
    var active = phases.find(function(p){ return rmPhaseStatus(p, todayStr) === 'now'; });
    if (active && active.id === phaseId) {
      // 활성 Phase면 그 카드로 스크롤
      var ac = document.getElementById('rm-active-card');
      if (ac) ac.scrollIntoView({ behavior:'smooth', block:'start' });
      return;
    }
    // 다른 Phase면 펼침 + 스크롤
    var e = rmGetExpanded();
    e[phaseId] = true;
    try { localStorage.setItem(LS_EXPANDED, JSON.stringify(e)); } catch(err){}
    loadRoadmap();
    setTimeout(function(){
      var el = document.getElementById('rm-other-' + phaseId);
      if (el) el.scrollIntoView({ behavior:'smooth', block:'start' });
    }, 80);
  };

  // ═══════════════════════════════════════════════════
  // 설정 모달
  // ═══════════════════════════════════════════════════
  window.rmOpenSettings = function() {
    var modal = document.getElementById('rm-settings-modal');
    if (!modal) return;
    var c = rmGetConfig();
    var sT = document.getElementById('rm-s-title');
    var sQ = document.getElementById('rm-s-quote');
    var sN = document.getElementById('rm-s-next-days');
    if (sT) sT.value = c.title||'';
    if (sQ) sQ.value = c.quote||'';
    if (sN) sN.value = c.nextDays||12;
    modal.style.cssText = 'display:flex!important';
  };
  window.rmCloseSettings = function() {
    var modal = document.getElementById('rm-settings-modal');
    if (modal) modal.style.cssText = 'display:none!important';
  };
  window.rmSaveSettings = function() {
    var c = rmGetConfig();
    var sT = document.getElementById('rm-s-title');
    var sQ = document.getElementById('rm-s-quote');
    var sN = document.getElementById('rm-s-next-days');
    if (sT) c.title = (sT.value||'').trim() || c.title;
    if (sQ) c.quote = (sQ.value||'').trim();
    if (sN) c.nextDays = parseInt(sN.value||12, 10);
    rmSaveConfig(c);
    rmCloseSettings();
    loadRoadmap();
    if (typeof showSyncToast === 'function') showSyncToast('🗺 설정 저장됨');
  };
  window.rmSeedDefault = function() {
    if (!confirm('체크 상태와 펼침 상태를 모두 초기화할까요? (시드 데이터는 코드 파일에서 가져옴)')) return;
    try {
      localStorage.removeItem(LS_CHECKS);
      localStorage.removeItem(LS_EXPANDED);
    } catch(e){}
    rmCloseSettings();
    loadRoadmap();
    if (typeof showSyncToast === 'function') showSyncToast('🗺 초기화 완료');
  };
  window.rmExportData = function() {
    var data = {
      phases: window.RM_PHASES || [],
      checks: rmGetChecks(),
      config: rmGetConfig(),
      expanded: rmGetExpanded(),
      exportedAt: new Date().toISOString()
    };
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = 'atelier-roadmap-' + new Date().toISOString().split('T')[0] + '.json';
    a.click();
    URL.revokeObjectURL(url);
  };
  window.rmImportData = function() {
    var input = document.createElement('input');
    input.type = 'file'; input.accept = 'application/json';
    input.onchange = function(e) {
      var file = e.target.files && e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function(ev) {
        try {
          var data = JSON.parse(ev.target.result);
          if (data.checks) localStorage.setItem(LS_CHECKS, JSON.stringify(data.checks));
          if (data.config) rmSaveConfig(data.config);
          if (data.expanded) localStorage.setItem(LS_EXPANDED, JSON.stringify(data.expanded));
          rmCloseSettings();
          loadRoadmap();
          if (typeof showSyncToast === 'function') showSyncToast('🗺 가져오기 완료');
        } catch(err) { alert('파일 형식이 잘못됐어요: ' + err.message); }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  // ─── Phase 직접 편집 모달은 이번 시드 데이터 기반 구조에서 제거 ───
  // (데이터를 코드 파일에 박았으니 코드 직접 수정이 더 안전)
  // 호환성을 위해 빈 함수만 노출
  window.rmOpenPhaseModal = function() {
    alert('Phase 데이터는 js/roadmap-data.js 파일에서 직접 수정해주세요.\n체크리스트 토글은 카드에서 바로 가능합니다.');
  };
  window.rmClosePhaseModal = function(){};
  window.rmSavePhase = function(){};
  window.rmDeletePhase = function(){};

})();
