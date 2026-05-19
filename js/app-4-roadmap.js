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
    renderActive(phases, todayStr);
    renderOthers(phases, todayStr);
    renderSidebar(phases, todayStr, config);
  }
  window.loadRoadmap = loadRoadmap;

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
      var lineCls = t.done ? 'line-through opacity-60' : '';
      return '<label class="flex items-start gap-3 group cursor-pointer py-1">' +
        '<input type="checkbox" ' + checked + ' onchange="rmToggleTask(\'' + t.id + '\')" class="mt-0.5 w-5 h-5 rounded border-white/40 bg-transparent accent-white shrink-0"/>' +
        '<span class="text-[15px] text-white leading-snug ' + lineCls + '">' + String(t.text||'').replace(/</g,'&lt;') + '</span>' +
      '</label>';
    }).join('');

    section.innerHTML = '<div id="rm-active-card" class="rounded-2xl p-8 relative overflow-hidden text-white shadow-xl" style="background:linear-gradient(135deg,#7c3aed 0%,#a855f7 50%,#ec4899 100%)">' +
      '<div class="relative z-10">' +
        '<div class="flex justify-between items-start mb-6 flex-wrap gap-4">' +
          '<div class="min-w-0 flex-1">' +
            '<span class="inline-block text-[11px] font-bold px-3 py-1 rounded-full mb-3 bg-white/20 backdrop-blur-sm tracking-wider">' + statusLabel + ' · Phase ' + active.order + ' · ' + active.name + '</span>' +
            '<h2 class="text-3xl md:text-4xl font-bold leading-tight">' + (active.title||active.name).replace(/</g,'&lt;') + '</h2>' +
            '<p class="text-sm md:text-base mt-2 text-violet-100">' + rmDateRangeShort(active.start, active.end) + '</p>' +
          '</div>' +
          (active.goal ? '<div class="text-right max-w-xs">' +
            '<span class="text-[11px] font-bold tracking-wider uppercase opacity-70">목표</span>' +
            '<p class="text-sm italic mt-1 leading-snug">' + String(active.goal).replace(/</g,'&lt;') + '</p>' +
          '</div>' : '') +
        '</div>' +
        // Progress
        '<div class="mb-7">' +
          '<div class="flex justify-between text-[11px] font-bold mb-2 tracking-wider">' +
            '<span class="opacity-70">진척 · ' + doneCount + '/' + totalCount + '</span>' +
            '<span>' + progress + '%</span>' +
          '</div>' +
          '<div class="h-1.5 w-full bg-white/20 relative rounded-full overflow-hidden">' +
            '<div class="h-full bg-white transition-all duration-700 rounded-full" style="width:' + progress + '%"></div>' +
          '</div>' +
        '</div>' +
        // Checklist (Phase 1는 큰 카드라 2-col로)
        '<div class="grid grid-cols-1 md:grid-cols-2 gap-y-1 gap-x-12">' + checklistHtml + '</div>' +
      '</div>' +
      '<div class="absolute -right-12 -bottom-16 opacity-[0.04] select-none pointer-events-none">' +
        '<span class="text-[280px] font-extrabold italic leading-none">' + String(active.order).padStart(2,'0') + '</span>' +
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
        html = '<p class="text-sm text-white/60 italic">예정된 작업이 없습니다 ✓</p>';
      } else {
        html = nextItems.map(function(t){
          return '<label class="flex items-start gap-3 cursor-pointer group">' +
            '<input type="checkbox" onchange="rmToggleTask(\'' + t.id + '\')" class="mt-0.5 w-4 h-4 rounded border-white/40 bg-transparent accent-white shrink-0"/>' +
            '<span class="text-[13px] leading-snug">' + String(t.text||'').replace(/</g,'&lt;') + '</span>' +
          '</label>';
        }).join('');
        startingSoon.forEach(function(p){
          html += '<div class="pt-3 mt-3 border-t border-white/20">' +
            '<p class="text-[10px] uppercase tracking-widest text-white/60 mb-1">Phase ' + p.order + ' 시작</p>' +
            '<p class="text-sm font-bold">' + String(p.name||'').replace(/</g,'&lt;') + '</p>' +
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
