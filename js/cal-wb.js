// ════════════════════════════════════════════════════════════════════
// Calendar v2 (2026-10-07) — mlb-fitting '업무 보드' 캘린더 디자인 이식
//   · WEEK / MONTH 전환, 큰 월 숫자 헤더, 각진 헤어라인 그리드, 오른쪽 선택일 패널
//   · GTM·내 근태(연차/연장근무)는 mlb-fitting workBoard/{uid}에서 직접 읽음
//     (보조 Firebase 앱 'fitting' + 같은 구글 계정 로그인, 본인만 읽기 가능)
//   · 기존 데이터·기능(planner 일정, 기간 바, 인터벌, 작품 연재, 드래그, 복붙, 모달)은 그대로 재사용
//   app-1-pages.js의 renderCalendar / prevMonth / nextMonth / calNavToday /
//   selectPlannerDate / updateCalLeaveTracker 를 이 파일이 덮어쓴다.
// ════════════════════════════════════════════════════════════════════
(function() {
  'use strict';

  var MON_EN = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE','JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER'];
  var WD_EN = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
  var WD_KR = ['일','월','화','수','목','금','토'];
  var KEY_MODE = 'wbc_mode';

  var _mode = 'month';
  try { if (localStorage.getItem(KEY_MODE) === 'week') _mode = 'week'; } catch(e) {}
  var _anchor = null;   // week 모드 기준일 (Date)
  var _sel = _dFmt(new Date());

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function today() { return _dFmt(new Date()); }
  function startOfWeek(d) { var x = new Date(d.getFullYear(), d.getMonth(), d.getDate()); x.setDate(x.getDate() - x.getDay()); return x; }
  function addDays(d, n) { var x = new Date(d); x.setDate(x.getDate() + n); return x; }

  // ─────────────── mlb-fitting 업무 보드 연결 (GTM · 내 근태) ───────────────
  var FIT_CFG = {
    apiKey: 'AIzaSyDxbuJ4_4ksip-RwEstvgp6-zLif_3muYg',
    authDomain: 'mlb-fitting.firebaseapp.com',
    projectId: 'mlb-fitting',
    storageBucket: 'mlb-fitting.firebasestorage.app',
    messagingSenderId: '470577736009',
    appId: '1:470577736009:web:7ab460b4a180dd46c31298'
  };
  var _wb = null;            // workBoard json (gtm, mine, holidays …)
  var _wbState = 'idle';     // idle | signed-out | loading | ok | error
  var _wbUnsub = null;
  var _fitApp = null;
  // 같은 기기에선 마지막 값으로 바로 그림 (본인 기기 브라우저에만 저장)
  try { var _c = localStorage.getItem('wbc_fit_cache'); if (_c) _wb = JSON.parse(_c); } catch(e) {}

  function fitApp() {
    if (_fitApp) return _fitApp;
    if (typeof firebase === 'undefined' || !firebase.initializeApp) return null;
    try { _fitApp = firebase.app('fitting'); } catch(e) { _fitApp = firebase.initializeApp(FIT_CFG, 'fitting'); }
    return _fitApp;
  }
  function wbSubscribe(uid) {
    var app = fitApp(); if (!app) return;
    if (_wbUnsub) { try { _wbUnsub(); } catch(e) {} }
    _wbState = 'loading';
    _wbUnsub = app.firestore().collection('workBoard').doc(uid).onSnapshot(function(snap) {
      if (!snap.exists || !snap.data().json) { _wbState = 'error'; renderHeaderStats(); return; }
      try {
        _wb = JSON.parse(snap.data().json);
        _wbState = 'ok';
        try { localStorage.setItem('wbc_fit_cache', JSON.stringify({ gtm: _wb.gtm || [], mine: _wb.mine || null })); } catch(e) {}
      } catch(e) { _wbState = 'error'; }
      _mineCache = {};
      rerender();
    }, function(err) { console.warn('[cal-wb] workBoard', err); _wbState = 'error'; renderHeaderStats(); });
  }
  function wbInit() {
    var app = fitApp(); if (!app) return;
    app.auth().onAuthStateChanged(function(u) {
      if (u) wbSubscribe(u.uid);
      else { _wbState = 'signed-out'; renderHeaderStats(); }
    });
  }
  window.wbcConnect = function() {
    var app = fitApp(); if (!app) return;
    var p = new firebase.auth.GoogleAuthProvider();
    p.setCustomParameters({ prompt: 'select_account' });
    app.auth().signInWithPopup(p).catch(function(err) {
      alert('업무 보드 연결 실패: ' + (err && err.message || err));
    });
  };

  // ─────────────── 내 근태 결재 → 날짜별 항목 + 연차/연장 잔여 ───────────────
  //   결재 제목 끝 괄호 "(이름 / 기간 / YYYY-MM-DD[ ~ YYYY-MM-DD] / HH:MM~HH:MM)"에서 날짜·시간·길이를 읽는다
  var _mineCache = {};
  function parseHours(s) {
    var h = 0, m;
    if ((m = s.match(/(\d+(?:\.\d+)?)\s*일/))) h += parseFloat(m[1]) * 8;
    if ((m = s.match(/(\d+)\s*시간/))) h += +m[1];
    if ((m = s.match(/(\d+)\s*분/))) h += +m[1] / 60;
    return h;
  }
  function mineItems() {
    if (_mineCache.items) return _mineCache.items;
    var docs = (_wb && _wb.mine && _wb.mine.docs) || [];
    var out = [];
    docs.forEach(function(d) {
      if (d.status && d.status !== 'C') return;
      var subj = String(d.subject || '');
      var inner = (subj.match(/\(([^)]*)\)\s*$/) || [])[1] || '';
      var dates = inner.match(/\d{4}-\d{2}-\d{2}/g) || [];
      if (!dates.length) return;
      var time = (inner.match(/(\d{2}:\d{2})\s*~\s*(\d{2}:\d{2})/) || []);
      var kind, label, hours = parseHours(inner);
      if (/연장근무\s*적립\s*사용/.test(subj)) { kind = 'otUse'; label = '연장 사용'; }
      else if (/연장근무/.test(subj)) { kind = 'otEarn'; label = '연장근무'; }
      else if (/대체휴가|휴근/.test(subj)) { kind = 'sub'; label = '대체휴가'; if (!hours) hours = 8; }
      else if (/연차|반차|휴가/.test(subj)) {
        kind = 'leave';
        if (!hours) hours = /반반차/.test(inner) ? 2 : (/반차/.test(inner) ? 4 : 8);
        label = hours >= 8 ? '연차' : (hours === 4 ? '반차' : '연차 ' + fmtH(hours));
      } else return;
      // 날짜 범위: "A ~ B"(일 단위)만 범위로, 연장근무의 자정 넘김은 시작일 하루로
      var start = dates[0], end = dates[0];
      if (kind === 'leave' && dates[1] && dates[1] > dates[0]) end = dates[1];
      var full = (kind === 'leave' || kind === 'sub') && hours >= 8;
      var t = time[1] ? time[1] + '~' + time[2] : '';
      if (!t && kind === 'otEarn') { var tt = inner.match(/(\d{2}:\d{2})\s*~\s*\d{4}-\d{2}-\d{2}\s*(\d{2}:\d{2})/); if (tt) t = tt[1] + '~' + tt[2]; }
      if (!t && kind === 'sub') { var ts = inner.match(/(\d{2}:\d{2})\s*~\s*(\d{2}:\d{2})/); if (ts) t = ts[1] + '~' + ts[2]; }
      out.push({ kind: kind, label: label, start: start, end: end, hours: hours, time: t, full: full, docId: d.docId, subject: subj });
    });
    _mineCache.items = out;
    return out;
  }
  function mineOn(ds) { return mineItems().filter(function(x){ return ds >= x.start && ds <= x.end; }); }
  function fmtH(h) {
    var hh = Math.floor(h + 1e-9), mm = Math.round((h - hh) * 60);
    return (hh ? hh + '시간' : '') + (mm ? (hh ? ' ' : '') + mm + '분' : '') || '0시간';
  }
  function fmtDayH(h) {
    var neg = h < 0; h = Math.abs(h);
    var d = Math.floor(h / 8 + 1e-9), r = h - d * 8;
    var s = (d ? d + '일' : '') + (r > 1e-9 ? (d ? ' ' : '') + fmtH(r) : '');
    return (neg ? '-' : '') + (s || '0일');
  }
  function mineSummary(year) {
    var y = String(year), leaveH = 0, otEarn = 0, otUse = 0;
    mineItems().forEach(function(x) {
      if (x.start.slice(0, 4) !== y) return;
      if (x.kind === 'leave') leaveH += x.hours;
      else if (x.kind === 'otEarn') otEarn += x.hours;
      else if (x.kind === 'otUse') otUse += x.hours;
    });
    return { leaveH: leaveH, otEarn: otEarn, otUse: otUse, otLeft: otEarn - otUse };
  }

  // ─────────────── GTM ───────────────
  var GTM_TAG = { fw: '27FW', q2: '27SS Q2' };
  function gtmOn(ds) { return ((_wb && _wb.gtm) || []).filter(function(g){ return g.date === ds; }); }

  // ─────────────── planner 일정 헬퍼 ───────────────
  function eventsOn(ds) {
    var yr = ds.slice(0, 4), md = ds.slice(4);
    return plannerData.filter(function(r) {
      var s = (r[0]||'').toString(), e = (r[5]||'').toString();
      if (e && e > s) return ds >= s && ds <= e;
      if (s.indexOf(ds) === 0) return true;
      if (r[2] === '생일' && s.slice(4) === md && s.slice(0, 4) !== yr && r[7] && _yearlyBirthdayIds[r[7]]) return true;
      return false;
    });
  }
  function colorCls(ev) { return COLOR_MAP[ev[3]] || COLOR_MAP.indigo; }
  function idxRef(ev) { return ev[7] ? "_pi('" + ev[7] + "')" : String(plannerData.indexOf(ev)); }
  function isPub(ev) { return ((ev[4]||'').indexOf('phase:publishing') >= 0) || /^\d+화\s*\(/.test(ev[1]||''); }

  // ─────────────── 화면에 보일 날짜들 ───────────────
  function visibleDays() {
    var days = [];
    if (_mode === 'week') {
      if (!_anchor) _anchor = new Date(plannerYear, plannerMonth, Math.min(new Date().getDate(), 28));
      var s0 = startOfWeek(_anchor);
      for (var i = 0; i < 7; i++) days.push(addDays(s0, i));
    } else {
      var first = new Date(plannerYear, plannerMonth, 1);
      var s1 = startOfWeek(first);
      var last = new Date(plannerYear, plannerMonth + 1, 0);
      var n = Math.ceil((Math.round((last - s1) / 864e5) + 1) / 7) * 7;
      for (var j = 0; j < n; j++) days.push(addDays(s1, j));
    }
    return days;
  }

  // ─────────────── 헤더 ───────────────
  function renderHeader(days) {
    var ref = _mode === 'week' ? days[3] : new Date(plannerYear, plannerMonth, 1);
    var big = document.getElementById('wbc-big');
    var rng = document.getElementById('wbc-range');
    var yr = document.getElementById('wbc-year');
    if (big) big.textContent = String(ref.getMonth() + 1).padStart(2, '0');
    if (rng) {
      if (_mode === 'week') {
        var a = days[0], z = days[6];
        rng.textContent = MON_EN[a.getMonth()].slice(0, 3) + ' ' + a.getDate() + ' — ' + (a.getMonth() !== z.getMonth() ? MON_EN[z.getMonth()].slice(0, 3) + ' ' : '') + z.getDate();
      } else rng.textContent = MON_EN[ref.getMonth()];
    }
    if (yr) yr.textContent = ref.getFullYear();
    document.querySelectorAll('#wbc .wbc-mode button').forEach(function(b) {
      b.classList.toggle('on', b.getAttribute('data-mode') === _mode);
    });
  }

  // 연차 · 연장근무 숫자 (헤더 오른쪽)
  function renderHeaderStats() {
    var el = document.getElementById('wbc-stats');
    if (!el) return;
    var year = plannerYear;
    var total = (typeof _leaveTotalByYear !== 'undefined' && _leaveTotalByYear[year] !== undefined) ? _leaveTotalByYear[year] : null;
    if (total === null && typeof getLeaveTotalForYear === 'function') {
      getLeaveTotalForYear(year).then(function() { renderHeaderStats(); });
      total = 17;
    }
    var hasMine = !!(_wb && _wb.mine && _wb.mine.docs);
    var html = '';
    if (hasMine) {
      var s = mineSummary(year);
      var left = total * 8 - s.leaveH;
      html += '<div class="wbc-stat" title="' + year + '년 연차 ' + total + '일 중 ' + fmtDayH(s.leaveH) + ' 사용 (포털 결재 기준)">' +
          '<span class="l">연차 잔여</span><b' + (left < 0 ? ' class="neg"' : '') + '>' + fmtDayH(left) + '</b>' +
          '<span class="s">' + fmtDayH(s.leaveH) + ' / ' + total + '일 사용</span>' +
          '<button class="wbc-pen" onclick="wbcEditLeaveTotal()" title="' + year + '년 연차 총계 수정">✎</button></div>' +
        '<div class="wbc-stat" title="' + year + '년 연장근무 적립 ' + fmtH(s.otEarn) + ' − 사용 ' + fmtH(s.otUse) + '">' +
          '<span class="l">연장근무 사용 가능</span><b>' + fmtH(s.otLeft) + '</b>' +
          '<span class="s">적립 ' + fmtH(s.otEarn) + ' · 사용 ' + fmtH(s.otUse) + '</span></div>';
    } else {
      // 업무 보드 미연결: 예전 방식(캘린더 '연차' 일정 합계)
      var used = 0;
      plannerData.forEach(function(r) {
        if (r[2] !== '연차' || (r[0]||'').toString().slice(0, 4) !== String(year)) return;
        var m = (r[4]||'').toString().match(/^leave:([\d.]+)/);
        used += m ? parseFloat(m[1]) : 1;
      });
      html += '<div class="wbc-stat" title="캘린더의 연차 일정 합계"><span class="l">연차 잔여</span><b>' + (total - used) + '일</b>' +
        '<span class="s">' + used + ' / ' + total + '일 사용</span>' +
        '<button class="wbc-pen" onclick="wbcEditLeaveTotal()" title="' + year + '년 연차 총계 수정">✎</button></div>';
    }
    if (_wbState === 'signed-out' || (_wbState === 'error' && !hasMine)) {
      html += '<button class="wbc-connect" onclick="wbcConnect()" title="mlb-fitting 업무 보드에서 GTM·내 근태를 가져와요 (같은 구글 계정)">업무 보드 연결</button>';
    }
    el.innerHTML = html;
  }
  window.wbcEditLeaveTotal = function() {
    // 연차 총계 모달은 매트릭스 페이지 안에 있어서 캘린더에선 안 보였음 → body로 옮겨서 연다
    var m = document.getElementById('leave-edit-modal');
    if (m && m.parentNode !== document.body) document.body.appendChild(m);
    if (typeof openLeaveEditModal === 'function') openLeaveEditModal('cal');
  };

  // ─────────────── 그리드 ───────────────
  function computeLanes(fromDs, toDs) {
    var rangeLanes = new Map(), ivLanes = new Map(), ivMax = 0;
    var ivs = plannerData.filter(function(r) {
      if (!_ivIsInterval(r)) return false;
      var s = (r[0]||'').toString(); if (!s) return false;
      var e = (r[5]||'').toString() || s;
      return s <= toDs && e >= fromDs;
    });
    var byStart = function(a, b) { var c = (a[0]||'').toString().localeCompare((b[0]||'').toString()); return c || ((b[5]||'').toString()).localeCompare((a[5]||'').toString()); };
    ivs.sort(byStart);
    var ivL = [];
    ivs.forEach(function(r) {
      var s = (r[0]||'').toString(), e = (r[5]||'').toString() || s, lane = 0;
      while ((ivL[lane] || []).some(function(iv){ return s <= iv[1] && e >= iv[0]; })) lane++;
      (ivL[lane] = ivL[lane] || []).push([s, e]); ivLanes.set(r, lane);
    });
    ivMax = ivL.length;
    var ranges = plannerData.filter(function(r) { var s = (r[0]||'').toString(), e = (r[5]||'').toString(); return e && e > s && !_ivIsInterval(r) && s <= toDs && e >= fromDs; });
    ranges.sort(byStart);
    var rL = [];
    ranges.forEach(function(r) {
      var s = (r[0]||'').toString(), e = (r[5]||'').toString(), lane = 0;
      while ((rL[lane] || []).some(function(iv){ return s <= iv[1] && e >= iv[0]; })) lane++;
      (rL[lane] = rL[lane] || []).push([s, e]); rangeLanes.set(r, lane);
    });
    return { rangeLanes: rangeLanes, ivLanes: ivLanes, ivMax: ivMax };
  }

  function chipHtml(ev, ds, isOther) {
    var ref = idxRef(ev);
    var drag = 'draggable="true" ondragstart="event.stopPropagation();plannerDragStart(event,' + ref + ')" ondragend="plannerDragEnd(event)" ';
    var click = 'onclick="event.stopPropagation();wbcPickEvent(' + ref + ',this,\'' + ds + '\')" ondblclick="event.stopPropagation();openPlannerModal(' + ref + ')"';
    if (isPub(ev)) {
      var hex = _seriesHexMap[(ev[3]||'').trim()] || '#6366f1';
      return '<span class="wbc-pub" style="background:' + hex + '" ' + drag + click + ' title="' + esc(ev[1]) + '"><em>연재</em>' + esc(ev[1]) + '</span>';
    }
    var sid = _getSeriesIdForDoc(ev[7] || '');
    return '<span class="wbc-ev ' + colorCls(ev) + (ev[2] === '데드라인' ? ' is-dl' : '') + '" ' + drag +
      'ondragover="event.preventDefault();event.stopPropagation()" ' +
      'ondrop="event.preventDefault();event.stopPropagation();reorderPlannerEvent(event,' + ref + ')" ' + click + ' title="' + esc(ev[1]) + '">' +
      '<span class="t">' + esc(ev[1]) + '</span>' +
      '<span class="act"><button onclick="event.stopPropagation();openPlannerModal(' + ref + ')" title="수정">✎</button>' +
      '<button onclick="event.stopPropagation();deletePlannerRow(' + ref + ')" title="삭제">×</button>' +
      (sid ? '<button onclick="event.stopPropagation();openSeriesDeleteConfirm(\'' + sid + '\')" title="시리즈 전체 삭제">⊘</button>' : '') +
      '</span></span>';
  }

  function barHtml(ev, ds, dow) {
    var s = (ev[0]||'').toString(), e = (ev[5]||'').toString();
    var head = ds === s || dow === 0, tail = ds === e || dow === 6;
    var ref = idxRef(ev);
    var cls = colorCls(ev).split(' ').filter(function(c){ return c.indexOf('bg-') === 0 || c.indexOf('text-') === 0; }).join(' ');
    return '<span class="wbc-rb ' + cls + (head ? ' head' : '') + (tail ? ' tail' : '') + '" draggable="true" ' +
      'ondragstart="event.stopPropagation();plannerDragStart(event,' + ref + ')" ondragend="plannerDragEnd(event)" ' +
      'onclick="event.stopPropagation();wbcPickEvent(' + ref + ',this,\'' + ds + '\')" ondblclick="event.stopPropagation();openPlannerModal(' + ref + ')" title="' + esc(ev[1]) + ' (' + s.slice(5) + ' ~ ' + e.slice(5) + ')">' +
      (head ? esc(ev[1]) : '&nbsp;') + '</span>';
  }

  function ivHtml(ev, ds, dow, isOther) {
    var s = (ev[0]||'').toString(), e = (ev[5]||'').toString() || s;
    var hex = IV_HEX[(ev[3]||'').trim()] || IV_HEX.rose;
    var segS = _dShift(ds, -dow); if (segS < s) segS = s;
    var segE = _dShift(ds, 6 - dow); if (segE > e) segE = e;
    var mid = _dShift(segS, Math.floor(_dDiff(segS, segE) / 2));
    var ml = ds === segS ? '' : 'margin-left:var(--iv-bleed);';
    var mr = ds === segE ? '' : 'margin-right:var(--iv-bleed);';
    var ref = idxRef(ev), title = esc(ev[1]);
    return '<div class="cal-iv' + (isOther ? ' is-out' : '') + '" style="' + ml + mr + '--iv:' + hex + '" title="' + title + ' (' + s + (e !== s ? ' ~ ' + e : '') + ')" ' +
      'draggable="true" ondragstart="event.stopPropagation();plannerDragStart(event,' + ref + ')" ondragend="plannerDragEnd(event)" ' +
      'onclick="event.stopPropagation();wbcPickEvent(' + ref + ',this,\'' + ds + '\')" ondblclick="event.stopPropagation();openPlannerModal(' + ref + ')">' +
      (ds === s ? '<span class="cal-iv-cap is-l"></span>' : '') + '<span class="cal-iv-line"></span>' +
      (ds === mid ? '<span class="cal-iv-label">' + title + '</span><span class="cal-iv-line"></span>' : '') +
      (ds === e ? '<span class="cal-iv-cap is-r"></span>' : '') + '</div>';
  }

  function cellEl(d, lanes) {
    var ds = _dFmt(d), dow = d.getDay(), td = today();
    var hol = getKoreanHolidays(d.getFullYear())[ds] || '';
    var other = _mode === 'month' && d.getMonth() !== plannerMonth;
    var evs = eventsOn(ds);
    var mine = mineOn(ds);
    var offs = mine.filter(function(x){ return x.full; });
    var hasPortalLeave = offs.some(function(x){ return x.kind === 'leave'; });
    var ranges = [], singles = [], ivs = [];
    evs.forEach(function(r) {
      if (_ivIsInterval(r)) { ivs.push(r); return; }
      // 포털 연차가 있는 날은 손으로 넣은 '연차' 일정은 숨김 (같은 걸 두 번 그리지 않게)
      if (hasPortalLeave && r[2] === '연차') return;
      var s = (r[0]||'').toString(), e = (r[5]||'').toString();
      (e && e > s ? ranges : singles).push(r);
    });
    singles.sort(function(a, b) {
      var ad = a[2] === '데드라인' ? 1 : 0, bd = b[2] === '데드라인' ? 1 : 0;
      if (ad !== bd) return bd - ad;
      if ((a[2] === '업무') !== (b[2] === '업무')) return a[2] === '업무' ? -1 : 1;
      return (parseInt(a[6])||0) - (parseInt(b[6])||0);
    });

    var cell = document.createElement('div');
    cell.className = 'wbc-cd' + (ds === td ? ' is-today' : '') + (ds === _sel ? ' is-sel' : '') + (hol ? ' is-hol' : '') +
      (dow === 0 ? ' is-sun' : dow === 6 ? ' is-sat' : '') + (other ? ' is-other' : '') + (ds < td ? ' is-past' : '');
    cell.dataset.date = ds;
    if (lanes.ivMax) cell.style.paddingBottom = (12 + lanes.ivMax * 15) + 'px';
    cell.onclick = function() { selectPlannerDate(ds, cell); };
    cell.ondblclick = function() { openPlannerModal(null, ds); };
    cell.addEventListener('dragover', function(e) { e.preventDefault(); e.dataTransfer.dropEffect = (e.ctrlKey || e.metaKey) ? 'copy' : 'move'; cell.classList.add('is-drop'); });
    cell.addEventListener('dragleave', function() { cell.classList.remove('is-drop'); });
    cell.addEventListener('drop', function(e) {
      e.preventDefault(); e.stopPropagation(); cell.classList.remove('is-drop');
      var i = _dragIdxFromPayload(e.dataTransfer.getData('text/plain'));
      if (i >= 0 && plannerData[i]) {
        if (plannerCtrlDrag) { copiedPlannerEvent = plannerData[i].slice(0, 7); pastePlannerEvent(ds); }
        else dropPlannerEvent(i, ds);
      }
    });

    var h = '<span class="wbc-cd-head"><span class="wbc-cd-num">' + d.getDate() + '</span>' + (hol ? '<span class="wbc-cd-hol">' + esc(hol) + '</span>' : '') + '</span>';
    // 내 부재 (포털 결재) — 종일은 이어지는 띠
    offs.forEach(function(x) {
      var head = ds === x.start || dow === 0, tail = ds === x.end || dow === 6;
      h += '<span class="wbc-off' + (head ? ' head' : '') + (tail ? ' tail' : '') + (x.kind === 'sub' ? ' sub' : '') + '" title="' + esc(x.subject) + '">' + (head ? '<i>누리</i>' + esc(x.label) : '&nbsp;') + '</span>';
    });
    // 기간 바 (고정 줄)
    var slots = [];
    ranges.forEach(function(r) { var ln = lanes.rangeLanes.get(r); slots[ln == null ? 0 : ln] = r; });
    if (slots.length) {
      h += '<span class="wbc-bars">';
      for (var i = 0; i < slots.length; i++) h += slots[i] ? barHtml(slots[i], ds, dow) : '<span class="wbc-rb-gap"></span>';
      h += '</span>';
    }
    // GTM
    var gs = gtmOn(ds);
    if (gs.length) {
      h += '<span class="wbc-gtms">' + gs.map(function(g) {
        return '<span class="wbc-gtm s-' + (g.series || 'fw') + (g.key ? ' is-key' : '') + '" title="' + esc(g.team + ' · ' + g.title) + '"><em>' + (g.key ? '★ ' : '') + (GTM_TAG[g.series] || 'GTM') + '</em>' + esc(g.title) + '</span>';
      }).join('') + '</span>';
    }
    // 단일 일정
    var max = _mode === 'week' ? 99 : 4;
    if (singles.length) {
      h += '<span class="wbc-evs">' + singles.slice(0, max).map(function(r){ return chipHtml(r, ds, other); }).join('') +
        (singles.length > max ? '<span class="wbc-more">+' + (singles.length - max) + '</span>' : '') + '</span>';
    }
    // 시간 단위 근태 (반차·시간 연차·연장 사용)
    var partial = mine.filter(function(x){ return !x.full && x.kind !== 'otEarn'; });
    if (partial.length) {
      h += '<span class="wbc-atts">' + partial.map(function(x) {
        return '<span class="wbc-att' + (x.kind === 'otUse' ? ' ot' : '') + '" title="' + esc(x.subject) + '"><i>' + esc(x.label) + '</i>' + esc(x.time || fmtH(x.hours)) + '</span>';
      }).join('') + '</span>';
    }
    // 인터벌 트랙
    if (lanes.ivMax) {
      var ivSlots = [];
      ivs.forEach(function(r) { var ln = lanes.ivLanes.get(r); ivSlots[ln == null ? 0 : ln] = r; });
      var t = '';
      for (var v = 0; v < lanes.ivMax; v++) t += ivSlots[v] ? ivHtml(ivSlots[v], ds, dow, other) : '<div class="cal-iv-gap"></div>';
      h += '<div class="cal-iv-track">' + t + '</div>';
    }
    cell.innerHTML = h;
    return cell;
  }

  // ─────────────── 오른쪽 선택일 패널 ───────────────
  function renderAgenda() {
    var el = document.getElementById('wbc-ag');
    if (!el) return;
    var d = new Date(_sel + 'T00:00:00'), td = today();
    var hol = getKoreanHolidays(d.getFullYear())[_sel] || '';
    var h = '<div class="wbc-ag-head"><span class="n' + (_sel === td ? ' is-today' : '') + '">' + d.getDate() + '</span>' +
      '<span class="m"><b>' + WD_EN[d.getDay()] + ' · ' + MON_EN[d.getMonth()] + '</b><em>' +
      [(_sel === td ? 'TODAY' : ''), hol].filter(Boolean).join(' · ') + '</em></span></div>';

    var gs = gtmOn(_sel);
    if (gs.length) {
      h += '<div class="wbc-ag-sec"><p class="wbc-ag-t">GTM</p>' + gs.map(function(g) {
        return '<div class="wbc-ag-gtm s-' + (g.series || 'fw') + (g.key ? ' is-key' : '') + '"><em>' + (g.key ? '★ ' : '') + esc(g.team || GTM_TAG[g.series] || '') + '</em>' + esc(g.title) + '</div>';
      }).join('') + '</div>';
    }
    var mine = mineOn(_sel);
    if (mine.length) {
      h += '<div class="wbc-ag-sec"><p class="wbc-ag-t">내 근태</p>' + mine.map(function(x) {
        return '<div class="wbc-ag-att ' + x.kind + '"><b>' + esc(x.label) + '</b><span>' + esc(x.time || (x.start !== x.end ? x.start.slice(5) + ' ~ ' + x.end.slice(5) : '종일')) + '</span><span class="h">' + fmtH(x.hours) + '</span></div>';
      }).join('') + '</div>';
    }
    var evs = eventsOn(_sel);
    h += '<div class="wbc-ag-sec"><p class="wbc-ag-t">일정 <span>' + evs.length + '</span></p>';
    if (evs.length) {
      h += evs.map(function(ev) {
        var ref = idxRef(ev), s = (ev[0]||'').toString(), e = (ev[5]||'').toString();
        var cls = colorCls(ev).split(' ').filter(function(c){ return c.indexOf('bg-') === 0; }).join(' ');
        return '<div class="wbc-ag-ev" onclick="openPlannerModal(' + ref + ')" title="눌러서 수정">' +
          '<i class="' + cls + '"></i><span class="t">' + esc(ev[1]) + '</span>' +
          '<span class="c">' + esc(ev[2] || '') + (e && e > s ? ' · ' + s.slice(5).replace('-', '/') + '~' + e.slice(5).replace('-', '/') : '') + '</span></div>';
      }).join('');
    } else h += '<p class="wbc-ag-empty">일정 없음</p>';
    h += '<button class="wbc-ag-add" onclick="openPlannerModal(null,\'' + _sel + '\')">+ 이 날 일정 추가</button></div>';
    el.innerHTML = h;
  }

  // ─────────────── 메인 렌더 (기존 renderCalendar 대체) ───────────────
  function renderCalendarWb() {
    var grid = document.getElementById('planner-grid');
    if (!grid) return;
    var days = visibleDays();
    renderHeader(days);
    var lanes = computeLanes(_dFmt(days[0]), _dFmt(days[days.length - 1]));
    grid.className = 'wbc-grid ' + _mode;
    grid.innerHTML = '';
    var frag = document.createDocumentFragment();
    days.forEach(function(d) { frag.appendChild(cellEl(d, lanes)); });
    grid.appendChild(frag);
    renderHeaderStats();
    renderAgenda();
  }
  function rerender() { try { if (document.getElementById('planner-grid')) renderCalendarWb(); } catch(e) { console.warn('[cal-wb]', e); } }

  // 기존 전역 함수 덮어쓰기 (app-1-pages.js 내부 호출도 이걸 쓰게 됨)
  window.renderCalendar = renderCalendarWb;
  window.updateCalLeaveTracker = renderHeaderStats;
  window.prevMonth = function() { wbcGo(-1); };
  window.nextMonth = function() { wbcGo(1); };
  window.calNavToday = function() { wbcToday(); };
  window.wbcGo = function(dir) {
    if (_mode === 'week') {
      var s0 = startOfWeek(_anchor || new Date());
      _anchor = addDays(s0, dir * 7);
      var mid = addDays(_anchor, 3);
      plannerYear = mid.getFullYear(); plannerMonth = mid.getMonth();
    } else {
      plannerMonth += dir;
      if (plannerMonth < 0) { plannerMonth = 11; plannerYear--; }
      if (plannerMonth > 11) { plannerMonth = 0; plannerYear++; }
      _anchor = null;
    }
    renderCalendarWb();
    try { updatePlannerTracks(); } catch(e) {}
  };
  window.wbcToday = function() {
    var n = new Date();
    plannerYear = n.getFullYear(); plannerMonth = n.getMonth();
    _anchor = n; _sel = _dFmt(n);
    renderCalendarWb();
    try { updatePlannerTracks(); } catch(e) {}
  };
  window.wbcSetMode = function(m) {
    _mode = m === 'week' ? 'week' : 'month';
    try { localStorage.setItem(KEY_MODE, _mode); } catch(e) {}
    if (_mode === 'week') {
      var sd = new Date(_sel + 'T00:00:00');
      _anchor = (sd.getFullYear() === plannerYear && sd.getMonth() === plannerMonth) ? sd : new Date(plannerYear, plannerMonth, 1);
    }
    renderCalendarWb();
  };
  window.selectPlannerDate = function(ds, cell) {
    selectedPlannerDate = ds;
    _sel = ds;
    document.querySelectorAll('#planner-grid .wbc-cd.is-sel').forEach(function(c){ c.classList.remove('is-sel'); });
    if (cell) cell.classList.add('is-sel');
    renderAgenda();
    if (window.innerWidth <= 768 && typeof showDayEventsModal === 'function') showDayEventsModal(ds);
  };
  window.wbcPickEvent = function(idx, el, ds) {
    if (typeof selectPlannerEvent === 'function') selectPlannerEvent(idx, el);
    if (ds && ds !== _sel) {
      _sel = ds; selectedPlannerDate = ds;
      document.querySelectorAll('#planner-grid .wbc-cd').forEach(function(c){ c.classList.toggle('is-sel', c.dataset.date === ds); });
      renderAgenda();
    }
  };

  function boot() {
    wbInit();
    // 연차 총계 모달을 body로 (매트릭스 페이지 안에 갇혀 있던 문제)
    var m = document.getElementById('leave-edit-modal');
    if (m && m.parentNode !== document.body) document.body.appendChild(m);
    rerender();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
