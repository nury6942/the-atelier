// ═════════════════════════════════════════════════════════════
// The Atelier — Roadmap 페이지
// 노마드 준비 + 새 수익 파이프라인 단계별 로드맵
// localStorage 기반 (Firebase 미사용 — 단순 개인 계획 데이터)
// ═════════════════════════════════════════════════════════════

(function() {
  'use strict';

  var LS_PHASES = 'atelier_roadmap_phases';
  var LS_CONFIG = 'atelier_roadmap_config';

  // 데이터 로드/저장
  function rmGetPhases() {
    try { return JSON.parse(localStorage.getItem(LS_PHASES)) || []; }
    catch(e) { return []; }
  }
  function rmSavePhases(arr) {
    try { localStorage.setItem(LS_PHASES, JSON.stringify(arr)); } catch(e) { console.warn('[roadmap]', e); }
  }
  function rmGetConfig() {
    try {
      var c = JSON.parse(localStorage.getItem(LS_CONFIG)) || {};
      return Object.assign({
        title: '2026–2027 Roadmap',
        quote: '"천 개의 뉴스레터의 여정은 단 하나의 도메인 검색에서 시작된다."',
        nextDays: 12
      }, c);
    } catch(e) { return { title: '2026–2027 Roadmap', quote: '', nextDays: 12 }; }
  }
  function rmSaveConfig(c) {
    try { localStorage.setItem(LS_CONFIG, JSON.stringify(c)); } catch(e){}
  }

  // 기본 5-Phase 시드 데이터 (사용자가 보여준 디자인 기반)
  function rmDefaultPhases() {
    return [
      {
        id: 'p1', order: 1, name: 'Foundation', title: 'Infrastructure Setup',
        start: '2026-05-19', end: '2026-06-30',
        goal: 'Build infrastructure. No publishing yet.',
        checklist: [
          { id: 't1', text: 'Decide pen names (3 KR, 3 EN)', done: true },
          { id: 't2', text: 'Sign up for Maily', done: true },
          { id: 't3', text: 'Research domain', done: false },
          { id: 't4', text: 'Build site v1 inside existing portfolio', done: false },
          { id: 't5', text: 'Outline first 5 posts', done: false },
          { id: 't6', text: 'Draft post #1', done: false }
        ],
        notes: 'Documentation and environmental setup.'
      },
      {
        id: 'p2', order: 2, name: 'Build', title: 'Content & Audience',
        start: '2026-07-01', end: '2026-08-31',
        goal: 'Build audience trust through consistent publishing.',
        checklist: [
          { id: 't1', text: 'Publish weekly newsletter (8 issues)', done: false },
          { id: 't2', text: 'Set up Substack / Maily monetization', done: false },
          { id: 't3', text: 'Reach 100 subscribers', done: false },
          { id: 't4', text: 'Create lead magnet', done: false }
        ],
        notes: ''
      },
      {
        id: 'p3', order: 3, name: 'Protect', title: 'Legal & Tax Setup',
        start: '2026-09-01', end: '2026-09-30',
        goal: 'Protect income streams. Business registration.',
        checklist: [
          { id: 't1', text: '사업자 등록 검토', done: false },
          { id: 't2', text: '세무사 상담 (부업 → 사업소득 전환)', done: false },
          { id: 't3', text: '계약서 템플릿 준비', done: false },
          { id: 't4', text: '저작권 등록 절차 정리', done: false }
        ],
        notes: ''
      },
      {
        id: 'p4', order: 4, name: 'Launch', title: 'Public Launch',
        start: '2026-10-01', end: '2026-10-31',
        goal: 'Launch publicly. Push for first 500 subscribers.',
        checklist: [
          { id: 't1', text: '공개 런칭 포스트 작성', done: false },
          { id: 't2', text: '런칭 마케팅 (SNS / 커뮤니티)', done: false },
          { id: 't3', text: '500 subscribers 달성', done: false },
          { id: 't4', text: '첫 유료 상품 / 멤버십 출시', done: false }
        ],
        notes: ''
      },
      {
        id: 'p5', order: 5, name: 'Settle', title: 'Sustain & Scale',
        start: '2026-11-01', end: '2026-12-31',
        goal: 'Settle into rhythm. Plan year 2 (노마드 시작).',
        checklist: [
          { id: 't1', text: '월간 수익 안정화 평가', done: false },
          { id: 't2', text: '회사 퇴사 D-day 결정', done: false },
          { id: 't3', text: '노마드 첫 거점 선정', done: false },
          { id: 't4', text: '2027 로드맵 작성', done: false }
        ],
        notes: ''
      }
    ];
  }

  // 상태 분류
  function rmPhaseStatus(phase, todayStr) {
    if (phase.end < todayStr) return 'done';
    if (phase.start > todayStr) return 'upcoming';
    return 'now';
  }

  // 진행률
  function rmProgress(phase) {
    if (!phase.checklist || !phase.checklist.length) return 0;
    var done = phase.checklist.filter(function(t){ return t.done; }).length;
    return Math.round(done / phase.checklist.length * 100);
  }

  // 텍스트 → 체크리스트 파싱
  function rmParseChecklist(text) {
    var lines = (text||'').split('\n').map(function(l){return l.trim();}).filter(function(l){return l;});
    return lines.map(function(line, i){
      var done = /^[✓✔√]|^\[x\]\s*/i.test(line);
      var clean = line.replace(/^[✓✔√]\s*|^\[x\]\s*|^\[\s\]\s*/i, '').trim();
      return { id: 't' + Date.now() + '_' + i, text: clean, done: done };
    });
  }

  // 짧은 날짜 표기
  function rmShortDate(iso) {
    if (!iso || iso.length < 10) return iso || '';
    var d = new Date(iso + 'T00:00:00');
    var mo = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()];
    return mo + ' ' + d.getDate();
  }
  function rmMonthRange(start, end) {
    if (!start || !end) return '';
    var s = new Date(start + 'T00:00:00');
    var e = new Date(end + 'T00:00:00');
    var moS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][s.getMonth()];
    var moE = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][e.getMonth()];
    if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) return moS + ' ' + s.getFullYear();
    if (s.getFullYear() === e.getFullYear()) return moS + '–' + moE + ' ' + s.getFullYear();
    return moS + ' ' + s.getFullYear() + '–' + moE + ' ' + e.getFullYear();
  }

  // ═══════════════════════════════════════════════════
  // 메인 렌더링
  // ═══════════════════════════════════════════════════
  function loadRoadmap() {
    var phases = rmGetPhases();
    // 처음 진입 시 시드 자동 로드
    if (!phases.length) {
      phases = rmDefaultPhases();
      rmSavePhases(phases);
    }
    var config = rmGetConfig();
    var titleEl = document.getElementById('rm-roadmap-title');
    if (titleEl) titleEl.textContent = config.title;

    var todayStr = new Date().toISOString().split('T')[0];
    phases.sort(function(a,b){ return a.order - b.order; });

    renderTimeline(phases, todayStr);
    renderActive(phases, todayStr);
    renderUpcoming(phases, todayStr);
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
      var dotColor = isNow ? 'bg-violet-600 ring-4 ring-violet-200' : (isDone ? 'bg-violet-300' : 'border border-slate-300');
      var lineColor = isDone || isNow ? 'bg-violet-400' : 'bg-slate-200';
      var labelColor = isNow ? 'text-violet-700' : 'text-slate-500';
      var titleColor = isNow ? 'text-violet-900' : (isDone ? 'text-slate-600' : 'text-slate-800');
      var label = isNow ? 'NOW' : 'Phase ' + p.order;
      var isLast = i === phases.length - 1;
      return '<div class="flex flex-col items-start min-w-[140px] cursor-pointer ' + opacity + '" onclick="rmOpenPhaseModal(\'' + p.id + '\')">' +
        '<div class="flex items-center w-full mb-3">' +
          '<div class="h-3 w-3 rounded-full ' + dotColor + ' shrink-0"></div>' +
          (isLast ? '' : '<div class="h-[1.5px] flex-1 ' + lineColor + ' ml-2"></div>') +
        '</div>' +
        '<span class="text-[10px] font-extrabold uppercase tracking-[0.2em] mb-1 ' + labelColor + '">' + label + '</span>' +
        '<h4 class="text-lg font-bold leading-tight ' + titleColor + '">' + p.name + '</h4>' +
        '<p class="text-xs text-slate-500 mt-0.5">' + rmMonthRange(p.start, p.end) + '</p>' +
      '</div>';
    }).join('');
  }

  // 2. 활성 Phase 카드 (큰 그라데이션 카드)
  function renderActive(phases, todayStr) {
    var section = document.getElementById('rm-active-section');
    if (!section) return;
    var active = phases.find(function(p){ return rmPhaseStatus(p, todayStr) === 'now'; });
    if (!active) {
      // now가 없으면 가장 가까운 upcoming 또는 가장 최근 done
      active = phases.find(function(p){ return rmPhaseStatus(p, todayStr) === 'upcoming'; }) ||
               phases.slice().reverse().find(function(p){ return rmPhaseStatus(p, todayStr) === 'done'; });
    }
    if (!active) { section.innerHTML = '<p class="text-sm text-slate-400 italic">Phase가 없습니다. 우측 상단 [Phase 추가] 버튼으로 시작해보세요.</p>'; return; }
    var progress = rmProgress(active);
    var status = rmPhaseStatus(active, todayStr);
    var statusLabel = status === 'now' ? 'NOW' : (status === 'upcoming' ? 'UPCOMING' : 'COMPLETED');
    var checklistHtml = (active.checklist||[]).map(function(t){
      var checked = t.done ? 'checked' : '';
      var lineCls = t.done ? 'line-through opacity-50' : '';
      return '<label class="flex items-center gap-3 group cursor-pointer">' +
        '<input type="checkbox" ' + checked + ' onchange="rmToggleTask(\'' + active.id + '\',\'' + t.id + '\')" class="w-5 h-5 rounded border-white/40 bg-transparent accent-white"/>' +
        '<span class="text-[15px] text-white ' + lineCls + '">' + String(t.text||'').replace(/</g,'&lt;') + '</span>' +
      '</label>';
    }).join('');

    section.innerHTML = '<div class="rounded-2xl p-8 relative overflow-hidden text-white shadow-xl" style="background:linear-gradient(135deg,#630ed4 0%,#7c3aed 50%,#a855f7 100%)">' +
      '<div class="relative z-10">' +
        '<div class="flex justify-between items-start mb-6 flex-wrap gap-4">' +
          '<div>' +
            '<span class="inline-block text-[11px] font-bold px-3 py-1 rounded-full mb-3 bg-white/20 backdrop-blur-sm tracking-wider">' + statusLabel + ' · Phase ' + active.order + ' · ' + active.name + '</span>' +
            '<h2 class="text-4xl font-bold leading-tight">' + (active.title||active.name).replace(/</g,'&lt;') + '</h2>' +
            '<p class="text-base mt-1 text-violet-100">' + rmShortDate(active.start) + ' – ' + rmShortDate(active.end) + ', ' + new Date(active.end+'T00:00:00').getFullYear() + '</p>' +
          '</div>' +
          (active.goal ? '<div class="text-right max-w-xs">' +
            '<span class="text-[11px] font-bold tracking-wider uppercase opacity-70">Phase Goal</span>' +
            '<p class="text-sm italic mt-1">"' + String(active.goal).replace(/</g,'&lt;').replace(/"/g,'') + '"</p>' +
          '</div>' : '') +
        '</div>' +
        // Progress
        '<div class="mb-8">' +
          '<div class="flex justify-between text-[11px] font-bold mb-2 tracking-wider">' +
            '<span class="opacity-70">COMPLETION</span>' +
            '<span>' + progress + '%</span>' +
          '</div>' +
          '<div class="h-[2px] w-full bg-white/20 relative rounded-full overflow-hidden">' +
            '<div class="h-full bg-white transition-all duration-700" style="width:' + progress + '%"></div>' +
          '</div>' +
        '</div>' +
        // Checklist
        '<div class="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-12">' + checklistHtml + '</div>' +
        // Edit button
        '<button onclick="rmOpenPhaseModal(\'' + active.id + '\')" class="absolute top-4 right-4 p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors" title="편집"><span class="material-symbols-outlined" style="font-size:18px">edit</span></button>' +
      '</div>' +
      // Watermark
      '<div class="absolute -right-12 -bottom-16 opacity-[0.04] select-none pointer-events-none">' +
        '<span class="text-[280px] font-extrabold italic leading-none">' + String(active.order).padStart(2,'0') + '</span>' +
      '</div>' +
    '</div>';
  }

  // 3. Upcoming Phases (작은 리스트)
  function renderUpcoming(phases, todayStr) {
    var el = document.getElementById('rm-upcoming-list');
    if (!el) return;
    var upcoming = phases.filter(function(p){ return rmPhaseStatus(p, todayStr) === 'upcoming'; });
    if (upcoming.length === 0) {
      el.innerHTML = '<p class="text-xs text-slate-400 italic py-4">예정된 Phase가 없습니다</p>';
      return;
    }
    el.innerHTML = upcoming.map(function(p){
      return '<div onclick="rmOpenPhaseModal(\'' + p.id + '\')" class="group flex items-center justify-between p-4 bg-white border-b border-slate-100 hover:bg-slate-50 transition-all cursor-pointer">' +
        '<div class="flex items-center gap-6">' +
          '<span class="text-[11px] font-bold tracking-wider text-slate-400">' + String(p.order).padStart(2,'0') + '</span>' +
          '<div>' +
            '<h5 class="text-base font-bold text-slate-800">' + String(p.name||'').replace(/</g,'&lt;') + '</h5>' +
            '<p class="text-xs text-slate-500 mt-0.5">' + rmMonthRange(p.start, p.end) + (p.title ? ' · ' + String(p.title).replace(/</g,'&lt;') : '') + '</p>' +
          '</div>' +
        '</div>' +
        '<span class="material-symbols-outlined text-slate-300 group-hover:text-violet-600 transition-colors">arrow_forward</span>' +
      '</div>';
    }).join('');
  }

  // 4. Sidebar (Next N Days + Status Report)
  function renderSidebar(phases, todayStr, config) {
    var nextDays = config.nextDays || 12;
    var today = new Date();
    var endDate = new Date(today); endDate.setDate(endDate.getDate() + nextDays);
    var endStr = endDate.toISOString().split('T')[0];

    // Next N Days items: 활성 Phase의 미완료 항목 + 곧 시작하는 phase 시작점
    var active = phases.find(function(p){ return rmPhaseStatus(p, todayStr) === 'now'; });
    var nextItems = [];
    if (active && active.checklist) {
      nextItems = active.checklist.filter(function(t){ return !t.done; }).slice(0, 4);
    }
    // Next 시작하는 phase
    var startingSoon = phases.filter(function(p){
      return p.start > todayStr && p.start <= endStr;
    });

    var rangeEl = document.getElementById('rm-next-range');
    if (rangeEl) rangeEl.textContent = rmShortDate(todayStr) + ' – ' + rmShortDate(endStr);

    var itemsEl = document.getElementById('rm-next-items');
    if (itemsEl) {
      var html = nextItems.map(function(t){
        return '<div class="group">' +
          '<div class="flex items-start gap-3">' +
            '<div class="mt-0.5 w-4 h-4 border border-white/60 shrink-0 rounded-sm"></div>' +
            '<span class="text-sm leading-snug">' + String(t.text||'').replace(/</g,'&lt;') + '</span>' +
          '</div>' +
        '</div>';
      }).join('');
      startingSoon.forEach(function(p){
        html += '<div class="pt-3 mt-3 border-t border-white/20">' +
          '<p class="text-[10px] uppercase tracking-widest text-white/60 mb-1">Phase ' + p.order + ' 시작</p>' +
          '<p class="text-sm font-bold">' + String(p.name||'').replace(/</g,'&lt;') + ' · ' + rmShortDate(p.start) + '</p>' +
        '</div>';
      });
      if (!html) html = '<p class="text-sm text-white/60 italic">예정된 작업이 없습니다</p>';
      itemsEl.innerHTML = html;
    }

    var quoteEl = document.getElementById('rm-quote');
    if (quoteEl && config.quote) quoteEl.textContent = config.quote;

    // Status Report
    var lastEnd = phases.length ? phases[phases.length-1].end : null;
    var weeksLeft = '—';
    if (active && active.end) {
      var endD = new Date(active.end + 'T00:00:00');
      var diff = Math.ceil((endD - today) / 86400000);
      weeksLeft = Math.max(0, Math.ceil(diff / 7));
    } else if (lastEnd) {
      var endL = new Date(lastEnd + 'T00:00:00');
      var diff2 = Math.ceil((endL - today) / 86400000);
      weeksLeft = Math.max(0, Math.ceil(diff2 / 7));
    }
    var weeksEl = document.getElementById('rm-weeks-remain');
    if (weeksEl) weeksEl.textContent = String(weeksLeft).padStart(2,'0');
    var focusEl = document.getElementById('rm-focus');
    if (focusEl) focusEl.textContent = '현재 집중: ' + ((active && active.notes) || (active && active.goal) || '—');
  }

  // ═══════════════════════════════════════════════════
  // 인터랙션
  // ═══════════════════════════════════════════════════
  window.rmToggleTask = function(phaseId, taskId) {
    var phases = rmGetPhases();
    var p = phases.find(function(x){ return x.id === phaseId; });
    if (!p) return;
    var t = (p.checklist||[]).find(function(x){ return x.id === taskId; });
    if (!t) return;
    t.done = !t.done;
    rmSavePhases(phases);
    loadRoadmap();
  };

  // Phase 모달 열기/닫기
  var _rmEditingId = null;
  window.rmOpenPhaseModal = function(phaseId) {
    _rmEditingId = phaseId;
    var modal = document.getElementById('rm-phase-modal');
    if (!modal) return;
    var titleEl = document.getElementById('rm-modal-title');
    var delBtn = document.getElementById('rm-delete-btn');
    if (phaseId) {
      var phases = rmGetPhases();
      var p = phases.find(function(x){ return x.id === phaseId; });
      if (!p) return;
      if (titleEl) titleEl.textContent = 'Phase ' + p.order + ' 수정';
      document.getElementById('rm-f-order').value = p.order;
      document.getElementById('rm-f-name').value = p.name||'';
      document.getElementById('rm-f-title').value = p.title||'';
      document.getElementById('rm-f-start').value = p.start||'';
      document.getElementById('rm-f-end').value = p.end||'';
      document.getElementById('rm-f-goal').value = p.goal||'';
      document.getElementById('rm-f-notes').value = p.notes||'';
      var clText = (p.checklist||[]).map(function(t){ return (t.done ? '✓ ' : '') + t.text; }).join('\n');
      document.getElementById('rm-f-checklist').value = clText;
      if (delBtn) delBtn.classList.remove('hidden');
    } else {
      if (titleEl) titleEl.textContent = 'Phase 추가';
      var phases2 = rmGetPhases();
      var nextOrder = phases2.length ? Math.max.apply(null, phases2.map(function(x){return x.order;})) + 1 : 1;
      document.getElementById('rm-f-order').value = nextOrder;
      document.getElementById('rm-f-name').value = '';
      document.getElementById('rm-f-title').value = '';
      document.getElementById('rm-f-start').value = '';
      document.getElementById('rm-f-end').value = '';
      document.getElementById('rm-f-goal').value = '';
      document.getElementById('rm-f-notes').value = '';
      document.getElementById('rm-f-checklist').value = '';
      if (delBtn) delBtn.classList.add('hidden');
    }
    modal.style.cssText = 'display:flex!important';
  };
  window.rmClosePhaseModal = function() {
    var modal = document.getElementById('rm-phase-modal');
    if (modal) modal.style.cssText = 'display:none!important';
    _rmEditingId = null;
  };

  window.rmSavePhase = function() {
    var order = parseInt(document.getElementById('rm-f-order').value, 10);
    var name = (document.getElementById('rm-f-name').value||'').trim();
    var title = (document.getElementById('rm-f-title').value||'').trim();
    var start = document.getElementById('rm-f-start').value;
    var end = document.getElementById('rm-f-end').value;
    var goal = (document.getElementById('rm-f-goal').value||'').trim();
    var notes = (document.getElementById('rm-f-notes').value||'').trim();
    var clText = document.getElementById('rm-f-checklist').value||'';
    if (!name) { alert('Phase 이름이 필요해요'); return; }
    if (!start || !end) { alert('시작일과 종료일이 필요해요'); return; }

    var phases = rmGetPhases();
    if (_rmEditingId) {
      var p = phases.find(function(x){ return x.id === _rmEditingId; });
      if (!p) return;
      // 기존 체크리스트 done 상태 보존을 위해 같은 text는 done 복사
      var oldMap = {};
      (p.checklist||[]).forEach(function(t){ oldMap[t.text] = t.done; });
      var newChecklist = rmParseChecklist(clText);
      newChecklist.forEach(function(t){
        if (oldMap.hasOwnProperty(t.text) && !t.done) t.done = oldMap[t.text];
      });
      p.order = order; p.name = name; p.title = title;
      p.start = start; p.end = end;
      p.goal = goal; p.notes = notes;
      p.checklist = newChecklist;
    } else {
      phases.push({
        id: 'p_' + Date.now(),
        order: order, name: name, title: title,
        start: start, end: end,
        goal: goal, notes: notes,
        checklist: rmParseChecklist(clText)
      });
    }
    rmSavePhases(phases);
    rmClosePhaseModal();
    loadRoadmap();
    if (typeof showSyncToast === 'function') showSyncToast('🗺 Phase 저장됨');
  };

  window.rmDeletePhase = function() {
    if (!_rmEditingId) return;
    if (!confirm('정말 이 Phase를 삭제할까요?')) return;
    var phases = rmGetPhases();
    var idx = phases.findIndex(function(x){ return x.id === _rmEditingId; });
    if (idx >= 0) {
      phases.splice(idx, 1);
      rmSavePhases(phases);
    }
    rmClosePhaseModal();
    loadRoadmap();
    if (typeof showSyncToast === 'function') showSyncToast('🗺 Phase 삭제됨');
  };

  // ═══════════════════════════════════════════════════
  // 설정 모달
  // ═══════════════════════════════════════════════════
  window.rmOpenSettings = function() {
    var modal = document.getElementById('rm-settings-modal');
    if (!modal) return;
    var c = rmGetConfig();
    document.getElementById('rm-s-title').value = c.title||'';
    document.getElementById('rm-s-quote').value = c.quote||'';
    document.getElementById('rm-s-next-days').value = c.nextDays||12;
    modal.style.cssText = 'display:flex!important';
  };
  window.rmCloseSettings = function() {
    var modal = document.getElementById('rm-settings-modal');
    if (modal) modal.style.cssText = 'display:none!important';
  };
  window.rmSaveSettings = function() {
    var c = rmGetConfig();
    c.title = (document.getElementById('rm-s-title').value||'').trim() || c.title;
    c.quote = (document.getElementById('rm-s-quote').value||'').trim();
    c.nextDays = parseInt(document.getElementById('rm-s-next-days').value||12, 10);
    rmSaveConfig(c);
    rmCloseSettings();
    loadRoadmap();
    if (typeof showSyncToast === 'function') showSyncToast('🗺 설정 저장됨');
  };
  window.rmSeedDefault = function() {
    if (!confirm('기존 Phase 데이터를 모두 삭제하고 기본 5-Phase로 시드할까요?')) return;
    rmSavePhases(rmDefaultPhases());
    rmCloseSettings();
    loadRoadmap();
    if (typeof showSyncToast === 'function') showSyncToast('🗺 5-Phase 시드 완료');
  };
  window.rmExportData = function() {
    var data = { phases: rmGetPhases(), config: rmGetConfig(), exportedAt: new Date().toISOString() };
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
          if (data.phases) rmSavePhases(data.phases);
          if (data.config) rmSaveConfig(data.config);
          rmCloseSettings();
          loadRoadmap();
          if (typeof showSyncToast === 'function') showSyncToast('🗺 가져오기 완료');
        } catch(err) { alert('파일 형식이 잘못됐어요: ' + err.message); }
      };
      reader.readAsText(file);
    };
    input.click();
  };

})();
