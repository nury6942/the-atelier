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

  // (2026-11-06 3차) 메뉴·제목은 Title Case — 대문자+자간 키커를 걷어냄
  var MON_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  var WD_EN = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  var WD_KR = ['일','월','화','수','목','금','토'];
  var KEY_MODE = 'wbc_mode';

  var _mode = 'month';
  try { var _km = localStorage.getItem(KEY_MODE); if (_km === 'week' || _km === 'roadmap') _mode = _km; } catch(e) {}
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
  var _wbAt = null;          // 업무 보드가 마지막으로 갱신된 시각 (ms)
  // 같은 기기에선 마지막 값으로 바로 그림 (본인 기기 브라우저에만 저장)
  try { var _c = localStorage.getItem('wbc_fit_cache'); if (_c) { _wb = JSON.parse(_c); _wbAt = _wb.at || null; } } catch(e) {}

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
        var pa = snap.data().pushedAt;
        _wbAt = pa && pa.toDate ? pa.toDate().getTime() : (Date.parse((_wb.meta && (_wb.meta.lastChecked || _wb.meta.lastUpdated)) || '') || null);
        try { localStorage.setItem('wbc_fit_cache', JSON.stringify({ at: _wbAt, gtm: _wb.gtm || [], mine: _wb.mine || null, leaveTotal: _wb.leaveTotal || null, events: (_wb.events || []).filter(isMyAttEv) })); } catch(e) {}
      } catch(e) { _wbState = 'error'; }
      _mineCache = {};
      rerender();
    }, function(err) { console.warn('[cal-wb] workBoard', err); _wbState = 'error'; renderHeaderStats(); });
  }
  function wbInit() {
    var app = fitApp(); if (!app) return;
    app.auth().onAuthStateChanged(function(u) {
      if (u) wbSubscribe(u.uid);
      else { _wbState = 'signed-out'; renderHeaderStats(); armAutoConnect(); }
    });
  }
  // ★ (2026-10-11) 업무 보드 연결을 손으로 누르지 않게
  //   ① the-atelier 구글 로그인 때 받은 열쇠로 업무 보드도 같이 로그인 (app-2-init.js googleSignIn → wbcLinkCredential)
  //   ② 그래도 풀려 있으면, 화면 아무 데나 처음 누를 때 한 번 자동으로 연결 (브라우저가 '사용자가 누른 순간'에만 로그인 창을 허락함)
  window.wbcLinkCredential = function(cred) {
    var app = fitApp(); if (!app || !cred || app.auth().currentUser) return;
    app.auth().signInWithCredential(cred).catch(function(err) { console.warn('[cal-wb] 업무 보드 같이 로그인 실패 — 첫 클릭 때 자동 연결로', err && err.code); armAutoConnect(); });
  };
  var _armed = false;
  function armAutoConnect() {
    if (_armed) return; _armed = true;
    var fire = function(e) {
      document.removeEventListener('pointerdown', fire, true);
      var app = fitApp();
      if (!app || app.auth().currentUser) return;
      if (e && e.target && e.target.closest && e.target.closest('.wbc-connect')) return; // 버튼은 버튼대로
      window.wbcConnect(true);
    };
    document.addEventListener('pointerdown', fire, true);
  }
  function agoText(ms) {
    var m = Math.round((Date.now() - ms) / 6e4);
    if (m < 1) return '방금';
    if (m < 60) return m + '분 전';
    var h = Math.floor(m / 60);
    return h < 24 ? h + '시간 전' : Math.floor(h / 24) + '일 전';
  }
  // ★ (2026-10-08) 두 번 눌리면 첫 팝업이 취소되며 'cancelled-popup-request' 오류가 뜨던 문제 —
  //   진행 중이면 무시, 사용자가 닫거나 겹친 경우는 조용히 넘어가고, 팝업이 막히면 페이지 이동 방식으로
  var _connecting = false;
  window.wbcConnect = function(auto) {
    var app = fitApp(); if (!app || _connecting) return;
    _connecting = true;
    var p = new firebase.auth.GoogleAuthProvider();
    p.setCustomParameters({ prompt: 'select_account' });
    app.auth().signInWithPopup(p).then(function() {
      _connecting = false;
    }).catch(function(err) {
      _connecting = false;
      var code = err && err.code;
      if (code === 'auth/cancelled-popup-request' || code === 'auth/popup-closed-by-user') return;
      // 자동 연결(첫 클릭)에서는 화면을 구글 로그인으로 넘기지 않는다 — 버튼만 남겨 두고, 버튼을 직접 눌렀을 때만 페이지 이동 로그인
      if (code === 'auth/popup-blocked') { if (auto === true) return; app.auth().signInWithRedirect(p); return; }
      if (auto === true) { console.warn('[cal-wb] 업무 보드 자동 연결 실패', code); return; }
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
      if (/연장근무\s*적립\s*사용/.test(subj)) { kind = 'otUse'; label = /^09:/.test(time[1] || '') ? '지연출근' : (/^18:/.test(time[2] || '') ? '조기퇴근' : '연장 사용'); }
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

  // ★ (2026-10-08) 아웃룩 캘린더에 적어둔 내 근태(연차·지연 출근·조기 퇴근 …) = '계획'.
  //   같은 날 결재(완료)가 있으면 결재만 보여주고, 결재가 없으면 '결재 전'으로 구분해 보여준다.
  var MY_ATT_RE = /^(연차|휴가|반차|오전\s*반차|오후\s*반차|조기\s*퇴근|지연\s*출근|휴무|대체\s*휴가|건강\s*검진|리프레시)/;
  function isMyAttEv(e) { return e && MY_ATT_RE.test(String(e.title || '').trim()); }
  function normLabel(s) { return String(s || '').replace(/\s+/g, ''); }
  function planItems() {
    if (_mineCache.plans) return _mineCache.plans;
    var out = [];
    ((_wb && _wb.events) || []).filter(isMyAttEv).forEach(function(e) {
      var title = String(e.title).trim(), label = normLabel(title.match(MY_ATT_RE)[1]);
      if (e.allDay) {
        var s = String(e.start).slice(0, 10), en = String(e.end || e.start).slice(0, 10);
        out.push({ kind: 'leave', label: label, start: s, end: en < s ? s : en, hours: 8, time: '', full: true, plan: true, subject: '아웃룩 · ' + title + ' (결재 전)' });
      } else {
        var st = String(e.start), et = String(e.end || e.start);
        var d0 = st.slice(0, 10), t = st.slice(11, 16) + '~' + et.slice(11, 16);
        var hrs = Math.max(0, (new Date(et) - new Date(st)) / 36e5);
        out.push({ kind: 'part', label: label, start: d0, end: d0, hours: hrs, time: t, full: false, plan: true, subject: '아웃룩 · ' + title + ' ' + t + ' (결재 전)' });
      }
    });
    _mineCache.plans = out;
    return out;
  }
  // 여러 날에 걸친 손 입력 근태(예: 지연 출근 화살표 19~20일)는 구간 중 하루라도 같은 이름의 실제 근태가 있으면 통째로 숨김
  function rowCoveredByAtt(r, tl) {
    var s = (r[0]||"").toString(), e = (r[5]||"").toString();
    if (!e || e <= s || !/(지연출근|조기퇴근|연차|휴가|반차)/.test(tl)) return false;
    var items = mineItems().concat(planItems());
    return items.some(function(x) { return x.start <= e && x.end >= s && tl.indexOf(normLabel(x.label).replace(/d.*$/, "")) >= 0; });
  }
  function attOn(ds) {
    var done = mineOn(ds);
    var plans = planItems().filter(function(x) {
      if (!(ds >= x.start && ds <= x.end)) return false;
      return !done.some(function(a) {
        if (a.kind === 'otEarn') return false;
        if (x.full) return a.full;
        return !a.full && (normLabel(a.label) === x.label || (a.time && a.time.slice(0, 5) === x.time.slice(0, 5)));
      });
    });
    return done.concat(plans);
  }
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
  // 핵심 일정(★ 빨강): 업무 보드가 붙인 key + 화면에서 한 번 더 — Tradeshow 도 핵심 (2026-10-11)
  var GTM_KEY_RE = /CEO\s*convention|PLM\s*(마감|deadline)|품평|trade\s*show/i;
  // (2026-10-11) 기간이 있는 GTM(엑셀에서 색칠로 여러 날 표시한 것 — g.end)은 칸 칩이 아니라 막대로 따로 그린다
  function gtmIsRange(g) { return g && g.end && g.end > g.date; }
  function gtmIsKey(g) { return !!(g.key || GTM_KEY_RE.test(g.title || '')); }
  function gtmRanges(fromDs, toDs) { return ((_wb && _wb.gtm) || []).filter(function(g) { return gtmIsRange(g) && g.date <= toDs && g.end >= fromDs; }); }
  function gtmAllOn(ds) { return ((_wb && _wb.gtm) || []).filter(function(g) { return ds >= g.date && ds <= (g.end || g.date); }).map(function(g) { return gtmIsKey(g) && !g.key ? Object.assign({}, g, { key: true }) : g; }); }
  function gtmOn(ds) { return ((_wb && _wb.gtm) || []).filter(function(g){ return g.date === ds && !gtmIsRange(g); }).map(function(g) {
    return g.key || !GTM_KEY_RE.test(g.title || '') ? g : Object.assign({}, g, { key: true });
  }); }

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
  // ★ (2026-10-08) 칸 안 일정 색: 불투명 파스텔 배경 + 같은 계열 진한 글씨 (진한 단색은 너무 정신없어서 되돌림)
  //   (2026-10-08 v4 · A안) 여린 바탕 + 왼쪽 3px 색띠 + 검정 글씨 — 개인 일정은 조용히, GTM만 튀게
  //   (2026-10-11 B안) 파스텔이 GTM에 묻혀 안 보인다 → 바탕 한 톤 진하게 + 색띠 4px + 같은 계열 진한 글씨.
  //   글쓰기(초고·퇴고·시놉 — 메모에 phase:/work_id:)는 흰 바탕 + 진한 보라 테두리 + ✎ 로 따로 띄운다.
  var SOLID = { sky:["#CFE2FF","#2F6FD6","#143D80"], blue:["#D0DEFF","#2457C8","#12307A"], indigo:["#DDD2FF","#6A48D8","#3A2491"], violet:["#E3D0FF","#7E3BD6","#46197F"],
    purple:["#E8CCFF","#9133CC","#521A75"], fuchsia:["#F8CCEE","#E52BB8","#6E1449"], pink:["#FFCCE3","#FF2E8C","#7A1745"], rose:["#F8D0D7","#C42747","#701326"],
    cyan:["#C6EBF3","#13849E","#0A4A59"], teal:["#C5EDE2","#0F7F68","#08463A"], lime:["#DCEDB8","#558A12","#2F4D09"], amber:["#F8E2AE","#B07600","#5E3F00"],
    orange:["#FBD8BD","#CF5A10","#722F06"], slate:["#DDE1E8","#56606F","#2A313C"], birthday:["#FFEC99","#C29A00","#5C4800"], deadline:null };
  var PINK_TO_YELLOW = { pink: 1, fuchsia: 1 };
  var WRITE_HEX = { indigo:'#4338CA', amber:['#FF9F1C','#2B1600'] /* 갈색(#B45309)은 못생겼다고 해서 탠저린 */, rose:'#E11D48', teal:'#0F766E', purple:'#7E22CE', blue:'#1D4ED8',
    cyan:'#0E7490', orange:'#EA580C', fuchsia:'#A21CAF', sky:'#0369A1', violet:'#1A3FB5', pink:'#DB2777', lime:'#4D7C0F', slate:'#475569' };
  var BAR_FULL = true;       // 여러 날 막대도 고른 색으로 꽉 채움
  // ★ (2026-10-11) 시리즈 이름으로 색 고정 — 일정마다 만들어질 때 색이 박혀 있어 같은 R 시리즈도 남색·파랑이 섞였고,
  //   남색이 IELTS 보라와 겹쳐 안 보였다. R 시리즈는 전부 청록 (글쓰기 진하게 · 연재 조금 밝게).
  var SERIES_FIXED = [ { re: /^R/i, write: '#0D9488', pub: '#14B8A6' } ];
  var _sidName = null;
  function seriesIdNames() {
    if (_sidName) return _sidName;
    _sidName = {};
    try {
      var y0 = new Date().getFullYear();
      for (var y = y0 - 1; y <= y0 + 3; y++) (getSeriesData(y) || []).forEach(function(x) { if (x && x.id) _sidName[x.id] = x.name || ''; });
    } catch (e) {}
    return _sidName;
  }
  function seriesOverride(ev) {
    var note = (ev[4] || '') + '', name = '';
    var m = note.match(/series_id:([^|]+)/);
    if (m) name = seriesIdNames()[m[1]] || '';
    if (!name) { var t = ((ev[1] || '') + '').match(/\(([^)]+)\)\s*$/); if (t) name = t[1]; }
    if (!name) return null;
    for (var i = 0; i < SERIES_FIXED.length; i++) if (SERIES_FIXED[i].re.test(name.trim())) return SERIES_FIXED[i];
    return null;
  }

  function isTrip(ev) { return ((ev[2] || '') + '').trim() === '연차'; }
  function isWriting(ev) { var n = (ev[4]||'') + ''; return (n.indexOf('phase:') >= 0 || n.indexOf('work_id:') >= 0) && n.indexOf('phase:publishing') < 0; }
  //   (2026-10-11 v2) 그래도 회사 일정만 보인다 → 하루짜리 개인 일정은 진한 색 꽉 채움 + 흰 글씨,
  //   글쓰기는 진한 남보라 꽉 채움 + ✎ + 조금 더 높게. 여러 날 기간 바는 넓어서 지금처럼 옅게 둔다.
  //   대신 GTM 일반 항목은 옅게(index.html .wbc-gtm), ★ 핵심만 빨강 그대로.
  // (2026-11-06 밤) 누리: "카테고리별 색을 다 지우면 어떡해" → 4색 문법 되돌림, 일정마다 고른 색 그대로
  var INK_OUTLINE = "__unused__";
  function solidStyle(ev, noBar, full) {
    var k = (ev[3]||"").trim();
    if (k === "deadline") return "background:#FF3B00;color:#fff;";
    // 글쓰기는 작품(시리즈) 색으로 — B·R 시리즈가 구분되게. 시리즈 색을 흰 글씨가 읽히는 진한 톤으로.
    if (isWriting(ev)) { var so = seriesOverride(ev); if (so) return "background:" + so.write + ";color:#fff;";
      var wh = WRITE_HEX[k] || "#3B23A8"; return "background:" + (Array.isArray(wh) ? wh[0] + ";color:" + wh[1] : wh + ";color:#fff") + ";"; }
    // (2026-10-11 v3) 분홍 계열로 고른 일정만 핫 옐로우로 (누리: "핑크가 안 예뻐") — 나머지는 각자 고른 색 그대로.
    //   하루짜리·여러 날 막대 모두 꽉 채움 (옅은 바탕 + 왼쪽 띠는 약해 보여서 뺌).
    // (2026-10-11) 연차 카테고리(미리 잡은 여행·휴가 — 예전 기본색 청록이 R 시리즈 청록과 겹침)
    //   (v2) 줄무늬는 못생겼다 → 하늘 → 라벤더 → 핑크 노을 그라데이션. 'fixed' 라 여러 칸에 걸친 막대도 한 장처럼 이어진다
    //   (2026-11-01) 여행 = 모래 (홈 그림 색, DESIGN.md) — 모래 위 글자는 진한 잉크
    if (isTrip(ev)) return "background:#F0A647;color:#16161A;";
    if (PINK_TO_YELLOW[k]) return "background:#FFE01A;color:#111;";
    var c = SOLID[k] || SOLID.indigo;
    if (full || BAR_FULL) return "background:" + c[1] + ";color:#fff;";
    return "background:" + c[0] + ";color:" + c[2] + ";" + (noBar ? "" : "box-shadow:inset 4px 0 0 " + c[1] + ";");
  }
  function idxRef(ev) { return ev[7] ? "_pi('" + ev[7] + "')" : String(plannerData.indexOf(ev)); }
  function isPub(ev) { return ((ev[4]||'').indexOf('phase:publishing') >= 0) || /^\d+화\s*\(/.test(ev[1]||''); }


  // ─────────────── Roadmap (2026-11-07) ───────────────
  //   같은 캘린더 데이터(plannerData 의 work_id/phase 표시 + 작품 목록 atelier_works + 연도별 시리즈 표 atelier_series_YYYY)로
  //   작품마다 시놉·초고·퇴고·연재 막대, 연재 회차 눈금, 시리즈별 연재/공백 달, 계획 매출 vs 월 목표를 한 화면에.
  //   ‹ › 는 3달씩. 막대를 누르면 그 단계 시작 달의 Month 보기로.
  var ROAD_MONTHS = 15;
  var ROAD_GOAL = 2500000;   // 아뜰리에 2027 목표 포타 3,000만 → 월 250만 (입금 기준)
  var ROAD_TRACK = { 'R': { name: '리쿠 · WISH 채널', hex: '#0D9488' }, 'B': { name: '백현 · 고요한 다락방', hex: '#1F4BD8' } };
  var PH = [['synopsis', '시놉', '#E3E8FB', '#16161A'], ['draft', '초고', '#9DB0EE', '#16161A'], ['revision', '퇴고', '#4E6FE0', '#fff'], ['rest', '휴식', '#ECECF0', '#16161A'], ['publishing', '연재', '#15803D', '#fff']];
  function roadWorks() {
    var list = []; try { list = JSON.parse(localStorage.getItem('atelier_works') || '[]'); } catch (e) {}
    var by = {};
    list.forEach(function(w) { if (w && w.id) by[w.id] = { id: w.id, title: w.title || '', series: w.series_name || '', sid: w.series_id || '', eps: w.total_episodes || 0, ph: {}, pubs: [] };
      var o = by[w.id], P = w.phases || {};
      ['synopsis', 'draft', 'revision', 'rest'].forEach(function(k) { if (P[k] && P[k].start) o.ph[k] = { s: P[k].start, e: P[k].end || P[k].start }; });
      var ps = w.publish_start || (P._publishing && P._publishing.start), pe = w.publish_end || (P._publishing && P._publishing.end);
      if (ps) o.ph.publishing = { s: ps, e: pe || ps };
    });
    ((typeof plannerData !== 'undefined' && plannerData) || []).forEach(function(r) {
      var m = /work_id:([^|]+)(?:\|series_id:([^|]+))?\|phase:(\w+)/.exec((r[4] || '') + ''); if (!m) return;
      var o = by[m[1]] || (by[m[1]] = { id: m[1], title: '', series: '', sid: m[2] || '', eps: 0, ph: {}, pubs: [] });
      var d = (r[0] || '') + '', e = ((r[5] || '') + '') || d; if (!d) return;
      var k = m[3]; var cur = o.ph[k];
      o.ph[k] = cur ? { s: d < cur.s ? d : cur.s, e: e > cur.e ? e : cur.e } : { s: d, e: e };
      if (k === 'publishing') o.pubs.push(d);
      if (!o.title) { var t = ((r[1] || '') + '').match(/\(([^)]+)\)\s*$/); if (t) o.series = o.series || t[1]; }
    });
    return Object.keys(by).map(function(k) { var o = by[k]; o.pubs.sort(); o.start = Object.keys(o.ph).map(function(x) { return o.ph[x].s; }).sort()[0]; o.end = Object.keys(o.ph).map(function(x) { return o.ph[x].e; }).sort().slice(-1)[0];
      o.key = (o.series || '').charAt(0).toUpperCase(); return o; }).filter(function(o) { return o.start; });
  }
  function roadPlanRev(y, m) {
    var tot = 0, any = false;
    try { (getSeriesData(y) || []).forEach(function(sr) { var c = sr && sr.monthly && sr.monthly[String(m)]; if (c && c.rev) { tot += Number(c.rev) || 0; any = true; } }); } catch (e) {}
    return any ? tot : null;
  }
  function renderRoadmap(grid) {
    var y0 = plannerYear, m0 = plannerMonth - 1;
    var start = new Date(y0, m0, 1), end = new Date(y0, m0 + ROAD_MONTHS, 1);
    var span = end - start, pct = function(ds) { var t = new Date(ds + 'T00:00:00') - start; return Math.max(0, Math.min(100, t / span * 100)); };
    var months = []; for (var i = 0; i < ROAD_MONTHS; i++) months.push(new Date(y0, m0 + i, 1));
    var mKey = function(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'); };
    var sDs = _dFmt(start), eDs = _dFmt(new Date(end - 864e5));
    var works = roadWorks().filter(function(w) { return w.end >= sDs && w.start <= eDs; });
    var tracks = {}; works.forEach(function(w) { (tracks[w.key || '?'] = tracks[w.key || '?'] || []).push(w); });
    var order = ['R', 'B'].concat(Object.keys(tracks).filter(function(k) { return k !== 'R' && k !== 'B'; }));
    // 머리 글자
    var big = document.getElementById('wbc-big'), rng = document.getElementById('wbc-range'), yr = document.getElementById('wbc-year');
    if (big) big.textContent = ''; if (rng) rng.textContent = 'Roadmap';
    if (yr) yr.textContent = months[0].getFullYear() + '.' + (months[0].getMonth() + 1) + ' – ' + months[ROAD_MONTHS - 1].getFullYear() + '.' + (months[ROAD_MONTHS - 1].getMonth() + 1);
    document.querySelectorAll('#wbc .wbc-mode button').forEach(function(b) { b.classList.toggle('on', b.getAttribute('data-mode') === 'roadmap'); });
    var todayP = pct(today()), showToday = today() >= sDs && today() <= eDs;
    var h = '<div class="rm">';
    // 달 머리
    h += '<div class="rm-row rm-head"><div class="rm-lab"></div><div class="rm-lane">' + months.map(function(d, i) {
      return '<span class="rm-m' + (d.getMonth() === 0 ? ' y' : '') + '" style="left:' + (i / ROAD_MONTHS * 100) + '%;width:' + (100 / ROAD_MONTHS) + '%">' + (d.getMonth() === 0 || i === 0 ? '<b>' + d.getFullYear() + '</b>' : '') + (d.getMonth() + 1) + '월</span>'; }).join('') + '</div></div>';
    order.forEach(function(k) {
      var L = tracks[k]; if (!L) return;
      var info = ROAD_TRACK[k] || { name: L[0].series || k, hex: '#16161A' };
      // 겹치면 줄 나눔
      var lanes = []; L.sort(function(a, b) { return a.start < b.start ? -1 : 1; }).forEach(function(w) {
        for (var i = 0; i < lanes.length; i++) if (lanes[i] < w.start) { lanes[i] = w.end; w.lane = i; return; }
        w.lane = lanes.length; lanes.push(w.end); });
      h += '<div class="rm-row rm-track" style="--lanes:' + Math.max(1, lanes.length) + '"><div class="rm-lab"><i style="background:' + info.hex + '"></i><b>' + esc((L[0].series || k)) + '</b><span>' + esc(info.name) + '</span></div><div class="rm-lane">';
      L.forEach(function(w) {
        var left = pct(w.start), right = pct(w.end), top = w.lane * 58;
        h += '<div class="rm-work" style="left:' + left + '%;width:' + Math.max(0.6, right - left) + '%;top:' + top + 'px">';
        h += '<div class="rm-wt" title="' + esc(w.title) + '">' + esc(w.title || w.series) + (w.eps ? ' <em>' + w.eps + '화</em>' : '') + '</div><div class="rm-bar">';
        PH.forEach(function(p) { var r = w.ph[p[0]]; if (!r || r.e < sDs || r.s > eDs) return;
          var a = (pct(r.s) - left) / Math.max(0.001, right - left) * 100, b = (pct(r.e) - left) / Math.max(0.001, right - left) * 100;
          h += '<button type="button" class="rm-seg" style="left:' + a + '%;width:' + Math.max(0.8, b - a) + '%;background:' + p[2] + ';color:' + p[3] + '" title="' + esc(p[1] + ' ' + r.s + ' ~ ' + r.e) + '" onclick="wbcRoadOpen(\'' + r.s + '\')">' + ((b - a) > 7 ? p[1] : '') + '</button>'; });
        if (w.ph.publishing) w.pubs.forEach(function(d) { if (d < sDs || d > eDs) return; var x = (pct(d) - left) / Math.max(0.001, right - left) * 100; h += '<span class="rm-tick" style="left:' + x + '%" title="연재 ' + d + '"></span>'; });
        h += '</div></div>';
      });
      h += '</div></div>';
      // 연재 / 공백 달
      h += '<div class="rm-row rm-gap"><div class="rm-lab"><span>연재 있는 달</span></div><div class="rm-lane">' + months.map(function(d, i) {
        var mk = mKey(d), on = L.some(function(w) { return w.pubs.some(function(x) { return x.slice(0, 7) === mk; }) || (w.ph.publishing && !w.pubs.length && w.ph.publishing.s.slice(0, 7) <= mk && w.ph.publishing.e.slice(0, 7) >= mk); });
        return '<span class="rm-g ' + (on ? 'on' : 'off') + '" style="left:' + (i / ROAD_MONTHS * 100) + '%;width:' + (100 / ROAD_MONTHS) + '%">' + (on ? '연재' : '공백') + '</span>'; }).join('') + '</div></div>';
    });
    // 계획 매출 (Side Jobs 연도 표의 R·B 월 매출 합) vs 월 목표
    var revs = months.map(function(d) { return roadPlanRev(d.getFullYear(), d.getMonth()); });
    var maxR = Math.max(ROAD_GOAL * 1.2, Math.max.apply(null, revs.map(function(v) { return v || 0; })));
    h += '<div class="rm-row rm-money"><div class="rm-lab"><b>계획 매출</b><span>Side Jobs 표 · 목표 월 250만</span></div><div class="rm-lane">';
    h += '<span class="rm-goal" style="bottom:' + (ROAD_GOAL / maxR * 100) + '%"><em>월 250만</em></span>';
    revs.forEach(function(v, i) { var hp = v ? v / maxR * 100 : 0;
      h += '<span class="rm-rv" style="left:' + (i / ROAD_MONTHS * 100) + '%;width:' + (100 / ROAD_MONTHS) + '%"><i class="' + (v == null ? 'na' : v >= ROAD_GOAL ? 'ok' : 'lo') + '" style="height:' + hp + '%"></i><b>' + (v == null ? '—' : Math.round(v / 1e4)) + '</b></span>'; });
    h += '</div></div>';
    if (showToday) h += '<div class="rm-today" style="left:calc(var(--rm-lab) + (100% - var(--rm-lab)) * ' + (todayP / 100) + ')"><em>오늘</em></div>';
    h += '<div class="rm-legend">' + PH.map(function(p) { return '<span><i style="background:' + p[2] + '"></i>' + p[1] + '</span>'; }).join('') + '<span><i class="tk"></i>연재 회차</span><span class="hint">막대를 누르면 그 날짜의 Month 로 · ‹ › 는 3달씩</span></div>';
    h += '</div>';
    grid.className = 'wbc-grid roadmap';
    grid.innerHTML = h;
  }
  window.wbcRoadOpen = function(ds) {
    var d = new Date(ds + 'T00:00:00'); plannerYear = d.getFullYear(); plannerMonth = d.getMonth(); _sel = ds; selectedPlannerDate = ds;
    _mode = 'month'; try { localStorage.setItem(KEY_MODE, 'month'); } catch (e) {}
    renderCalendarWb(); try { updatePlannerTracks(); } catch (e) {}
  };

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
    // ★ (2026-10-08) 업무 보드에 적어둔 포털 기준 연차 총계(leaveTotal)가 있으면 그걸 우선 (사이트 설정값은 예전에 21로 잘못 저장돼 있었음)
    var wbTotal = _wb && _wb.leaveTotal && _wb.leaveTotal[String(year)];
    var total = (wbTotal != null) ? +wbTotal : ((typeof _leaveTotalByYear !== 'undefined' && _leaveTotalByYear[year] !== undefined) ? _leaveTotalByYear[year] : null);
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
          '<span class="l is-leave">연차 잔여</span><b' + (left < 0 ? ' class="neg"' : '') + '>' + fmtDayH(left) + '</b>' +
          '<span class="s">' + fmtDayH(s.leaveH) + ' / ' + total + '일 사용</span></div>' +
        '<div class="wbc-stat" title="' + year + '년 연장근무 적립 ' + fmtH(s.otEarn) + ' − 사용 ' + fmtH(s.otUse) + '">' +
          '<span class="l is-ot">연장근무 사용 가능</span><b>' + fmtH(s.otLeft) + '</b>' +
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
        '</div>';
    }
    if (hasMine && _wbAt) {
      var stale = Date.now() - _wbAt > 3 * 36e5;
      html += '<span class="wbc-fresh' + (stale ? ' is-stale' : '') + '" title="회사 포털·아웃룩 내용을 업무 보드가 마지막으로 가져온 시각: ' + new Date(_wbAt).toLocaleString('ko-KR') + '">업무 보드 · ' + agoText(_wbAt) + ' 갱신</span>';
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
    // ★ (2026-10-08) 내 종일 부재(연차 띠)도 같은 줄 배정에 넣는다 — 안 그러면 연차 있는 날만
    //   다른 기간 바가 한 줄 내려가 같은 바가 날마다 엇갈려 보인다. 연차를 먼저 배정(맨 윗줄 우선).
    var appr = mineItems().filter(function(x){ return x.full; });
    var offsAll = appr.concat(planItems().filter(function(p) {
      return p.full && !appr.some(function(a){ return a.start <= p.end && a.end >= p.start; });
    })).filter(function(x){ return x.start <= toDs && x.end >= fromDs; });
    offsAll.sort(function(a, b){ return a.start.localeCompare(b.start); });
    var rL = [];
    var place = function(key, s, e) {
      var lane = 0;
      while ((rL[lane] || []).some(function(iv){ return s <= iv[1] && e >= iv[0]; })) lane++;
      (rL[lane] = rL[lane] || []).push([s, e]); rangeLanes.set(key, lane);
    };
    offsAll.forEach(function(x) { place(x, x.start, x.end); });
    var gr = gtmRanges(fromDs, toDs);
    gr.sort(function(a, b) { return (gtmIsKey(b) ? 1 : 0) - (gtmIsKey(a) ? 1 : 0) || a.date.localeCompare(b.date); });
    gr.forEach(function(g) { place(g, g.date, g.end); });
    ranges.forEach(function(r) { place(r, (r[0]||'').toString(), (r[5]||'').toString()); });
    return { rangeLanes: rangeLanes, ivLanes: ivLanes, ivMax: ivMax };
  }

  function chipHtml(ev, ds, isOther) {
    var ref = idxRef(ev);
    var drag = 'draggable="true" ondragstart="event.stopPropagation();plannerDragStart(event,' + ref + ')" ondragend="plannerDragEnd(event)" ';
    var click = 'onclick="event.stopPropagation();wbcPickEvent(' + ref + ',this,\'' + ds + '\')" ondblclick="event.stopPropagation();openPlannerModal(' + ref + ')"';
    if (isPub(ev)) {
      var so = seriesOverride(ev);
      var hex = so ? so.pub : (_seriesHexMap[(ev[3]||'').trim()] || '#3563DF');
      return '<span class="wbc-pub" style="background:' + hex + '" ' + drag + click + ' title="' + esc(ev[1]) + '"><em>연재</em>' + esc(ev[1]) + '</span>';
    }
    var sid = _getSeriesIdForDoc(ev[7] || '');
    return '<span class="wbc-ev' + (ev[2] === '데드라인' ? ' is-dl' : '') + (isWriting(ev) ? ' is-write' : '') + '" style="' + solidStyle(ev, false, true) + '" ' + drag +
      'ondragover="event.preventDefault();event.stopPropagation()" ' +
      'ondrop="event.preventDefault();event.stopPropagation();reorderPlannerEvent(event,' + ref + ')" ' + click + ' title="' + esc(ev[1]) + '">' +
      '<span class="t">' + (isWriting(ev) ? '✎ ' : (isTrip(ev) ? '✈ ' : '')) + esc(ev[1]) + '</span>' +
      '<span class="act"><button onclick="event.stopPropagation();openPlannerModal(' + ref + ')" title="수정">✎</button>' +
      '<button onclick="event.stopPropagation();deletePlannerRow(' + ref + ')" title="삭제">×</button>' +
      (sid ? '<button onclick="event.stopPropagation();openSeriesDeleteConfirm(\'' + sid + '\')" title="시리즈 전체 삭제">⊘</button>' : '') +
      '</span></span>';
  }

  function barHtml(ev, ds, dow) {
    var s = (ev[0]||'').toString(), e = (ev[5]||'').toString();
    var head = ds === s || dow === 0, tail = ds === e || dow === 6;
    var ref = idxRef(ev);
    var bst = solidStyle(ev, !head, isWriting(ev));
    if (bst === INK_OUTLINE) bst = 'background:#fff;color:#15171c;' + barOutline('#15171c', head, tail);
    return '<span class="wbc-rb' + (head ? ' head' : '') + (tail ? ' tail' : '') + '" style="' + bst + '" draggable="true" ' +
      'ondragstart="event.stopPropagation();plannerDragStart(event,' + ref + ')" ondragend="plannerDragEnd(event)" ' +
      'onclick="event.stopPropagation();wbcPickEvent(' + ref + ',this,\'' + ds + '\')" ondblclick="event.stopPropagation();openPlannerModal(' + ref + ')" title="' + esc(ev[1]) + ' (' + s.slice(5) + ' ~ ' + e.slice(5) + ')">' +
      (head ? (isWriting(ev) ? '✎ ' : (isTrip(ev) ? '✈ ' : '')) + esc(ev[1]) : '&nbsp;') + '</span>';
  }

  // 기간 GTM 막대 — ★ 핵심은 빨강, 일반은 회색 + 시즌색 띠 (칸 칩과 같은 말투)
  function gtmBarHtml(g, ds, dow) {
    var head = ds === g.date || dow === 0, tail = ds === g.end || dow === 6, key = gtmIsKey(g);
    var stripe = g.series === 'q2' ? '#E0B800' : '#22B07A';
    var st = key ? 'background:#E8283F;color:#fff;' : 'background:#F3F3F1;color:#3a3a3a;' + (head ? 'box-shadow:inset 3px 0 0 ' + stripe + ';' : '');
    var lbl = (key ? '★ ' : '') + (GTM_TAG[g.series] || 'GTM') + '  ' + g.title;
    return '<span class="wbc-rb wbc-gtmb' + (head ? ' head' : '') + (tail ? ' tail' : '') + '" style="' + st + '" title="' + esc((g.team || '') + ' · ' + g.title + ' (' + g.date.slice(5) + ' ~ ' + g.end.slice(5) + ')') + '">' +
      (head ? '<em>' + esc((key ? '★ ' : '') + (GTM_TAG[g.series] || 'GTM')) + '</em>' + esc(g.title) : '&nbsp;') + '</span>';
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
      // 글자는 선 위가 아니라 주(週) 구간 전체 가운데에 따로 얹는다 (ivLabelHtml) — 짝수 일수면 한쪽으로 쏠리던 것

      (ds === e ? '<span class="cal-iv-cap is-r"></span>' : '') + '</div>';
  }

  // 인터벌 이름표 — 이번 주에 걸친 구간의 첫 칸에서, 구간 전체 폭(N칸)의 정가운데에 놓는다
  function ivLabelHtml(ev, ds, dow, lane, ivMax, isOther) {
    var s = (ev[0]||'').toString(), e = (ev[5]||'').toString() || s;
    var segS = _dShift(ds, -dow); if (segS < s) segS = s;
    if (ds !== segS) return '';
    var segE = _dShift(ds, 6 - dow); if (segE > e) segE = e;
    var n = _dDiff(segS, segE) + 1;
    var hex = IV_HEX[(ev[3]||'').trim()] || IV_HEX.rose;
    var bottom = 5 + (ivMax - 1 - lane) * 20;
    // 첫 칸이 지난달이어도 이번 달에 걸쳐 있으면 이름표는 선명하게 (구간 전체가 다른 달일 때만 흐리게)
    var inMonth = function(x) { var d = new Date(x + 'T00:00:00'); return d.getFullYear() === plannerYear && d.getMonth() === plannerMonth; };
    isOther = _mode === 'month' && !inMonth(segS) && !inMonth(segE);
    return '<div class="wbc-ivl' + (isOther ? ' is-out' : '') + '" style="bottom:' + bottom + 'px;width:' + (n * 100) + '%;--iv:' + hex + '"><span>' + esc(ev[1]) + '</span></div>';
  }

  function cellEl(d, lanes) {
    var ds = _dFmt(d), dow = d.getDay(), td = today();
    var hol = getKoreanHolidays(d.getFullYear())[ds] || '';
    var other = _mode === 'month' && d.getMonth() !== plannerMonth;
    var evs = eventsOn(ds);
    var mine = attOn(ds);
    var offs = mine.filter(function(x){ return x.full; });
    var hasPortalLeave = offs.length > 0;
    var partLabels = mine.filter(function(x){ return !x.full; }).map(function(x){ return normLabel(x.label); });
    var ranges = [], singles = [], ivs = [];
    evs.forEach(function(r) {
      // 결재·아웃룩 근태가 있는 날은 손으로 넣은 같은 근태 일정(연차·지연 출근·조기 퇴근)은 숨김 (두 번 안 그리게)
      var tl = normLabel(r[1]);
      if (partLabels.some(function(l){ return tl.indexOf(l) >= 0; })) return;
      if (rowCoveredByAtt(r, tl)) return;
      // 제목이 연차·휴가·반차인 손 입력만 숨김 (카테고리로 거르면 연차 카테고리로 넣은 "여행 - 차단"까지 사라졌음)
      if (hasPortalLeave && /^(연차|휴가|반차)/.test(tl)) return;
      if (_ivIsInterval(r)) { ivs.push(r); return; }
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
    if (lanes.ivMax) cell.style.paddingBottom = (14 + lanes.ivMax * 20) + 'px';   // 인터벌 줄 높이 19px + 간격 1px
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
    // 내 종일 부재(연차 띠) + 기간 바 — 같은 고정 줄 체계
    var offHtml = function(x) {
      var head = ds === x.start || dow === 0, tail = ds === x.end || dow === 6;
      return '<span class="wbc-off' + (head ? ' head' : '') + (tail ? ' tail' : '') + (x.kind === 'sub' ? ' sub' : '') + (x.plan ? ' plan' : '') + '" title="' + esc(x.subject) + '">' + (head ? '<i>누리</i>' + esc(x.label) + (x.plan ? '<s>결재 전</s>' : '') : '&nbsp;') + '</span>';
    };
    var slots = [], extra = [];
    offs.forEach(function(x) { var ln = lanes.rangeLanes.get(x); if (ln == null) extra.push(x); else slots[ln] = x; });
    ranges.forEach(function(r) { var ln = lanes.rangeLanes.get(r); slots[ln == null ? 0 : ln] = r; });
    gtmRanges(ds, ds).forEach(function(g) { var ln = lanes.rangeLanes.get(g); if (ln == null) extra.push(g); else slots[ln] = g; });
    if (slots.length || extra.length) {
      h += '<span class="wbc-bars">';
      var pick = function(x) { return Array.isArray(x) ? barHtml(x, ds, dow) : (x.series ? gtmBarHtml(x, ds, dow) : offHtml(x)); };
      for (var i = 0; i < slots.length; i++) h += !slots[i] ? '<span class="wbc-rb-gap"></span>' : pick(slots[i]);
      extra.forEach(function(x){ h += pick(x); });
      h += '</span>';
    }
    // GTM
    var gs = gtmOn(ds).slice().sort(function(a, b) { return (b.key ? 1 : 0) - (a.key ? 1 : 0); });
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
        return '<span class="wbc-att' + (x.kind === 'otUse' ? ' ot' : '') + (x.plan ? ' plan' : '') + '" title="' + esc(x.subject) + '"><i>' + esc(x.label) + '</i>' + esc(x.time || fmtH(x.hours)) + (x.plan ? '<s>결재 전</s>' : '') + '</span>';
      }).join('') + '</span>';
    }
    // 인터벌 트랙
    if (lanes.ivMax) {
      var ivSlots = [];
      ivs.forEach(function(r) { var ln = lanes.ivLanes.get(r); ivSlots[ln == null ? 0 : ln] = r; });
      var t = '';
      var lbl = '';
      for (var v = 0; v < lanes.ivMax; v++) {
        t += ivSlots[v] ? ivHtml(ivSlots[v], ds, dow, other) : '<div class="cal-iv-gap"></div>';
        if (ivSlots[v]) lbl += ivLabelHtml(ivSlots[v], ds, dow, v, lanes.ivMax, other);
      }
      h += '<div class="cal-iv-track">' + t + '</div>' + lbl;
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
      [(_sel === td ? 'Today' : ''), hol].filter(Boolean).join(' · ') + '</em></span></div>';

    var gs = gtmAllOn(_sel);
    if (gs.length) {
      h += '<div class="wbc-ag-sec"><p class="wbc-ag-t">GTM</p>' + gs.map(function(g) {
        return '<div class="wbc-ag-gtm s-' + (g.series || 'fw') + (g.key ? ' is-key' : '') + '"><em>' + (g.key ? '★ ' : '') + esc(g.team || GTM_TAG[g.series] || '') + '</em>' + esc(g.title) + '</div>';
      }).join('') + '</div>';
    }
    var mine = attOn(_sel);
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

  // ─────────────── 폰 (<768px): 점 달력 + '오늘부터' 일정 목록 (2026-11-06 3차) ───────────────
  //   7칸 달력에 일정 이름을 넣으면 전부 "27FW MD - Shar…" 로 잘린다 → 폰에선 칸엔 점만, 이름은 아래 목록에.
  //   점·칩 색은 데스크탑 일정 색 그대로 (11/06 밤 누리: 카테고리 색 살리기).
  var _mFrom = null;   // 목록 시작일 (지난 날을 누르면 그날부터)
  function isPhone() { return !!(window.matchMedia && window.matchMedia('(max-width:767.98px)').matches); }
  function dayRows(ds) {
    var mine = attOn(ds), offs = mine.filter(function(x){ return x.full; });
    var partLabels = mine.filter(function(x){ return !x.full; }).map(function(x){ return normLabel(x.label); });
    var evs = eventsOn(ds).filter(function(r) {
      var tl = normLabel(r[1]);
      if (partLabels.some(function(l){ return tl.indexOf(l) >= 0; })) return false;
      if (rowCoveredByAtt(r, tl)) return false;
      if (offs.length && /^(연차|휴가|반차)/.test(tl)) return false;
      return true;
    });
    return { gtm: gtmAllOn(ds), evs: evs, att: mine.filter(function(x){ return x.kind !== 'otEarn'; }) };
  }
  // (11/06 밤) 폰 점·목록 칩도 일정 색 그대로 — solidStyle 의 바탕색을 꺼내 쓴다
  function evDot(ev) { var m = /background:([^;]+);/.exec(solidStyle(ev, true, true)); return m ? m[1] : '#5B5B66'; }
  function evKind(ev) { return ((ev[3]||'').trim() === 'deadline' || ev[2] === '데드라인') ? 'key' : (isTrip(ev) ? 'off' : 'me'); }
  function dayKinds(ds) {
    var r = dayRows(ds), k = {};
    r.gtm.forEach(function(g){ k[g.key ? 'key' : 'work'] = 1; });
    r.evs.forEach(function(ev){ k[evKind(ev)] = 1; });
    if (r.att.length) k.off = 1;
    return ['key', 'work', 'me', 'off'].filter(function(x){ return k[x]; });
  }
  function miniCell(d) {
    var ds = _dFmt(d), dow = d.getDay(), td = today();
    var other = d.getMonth() !== plannerMonth;
    var hol = getKoreanHolidays(d.getFullYear())[ds] || '';
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'wbc-mc' + (ds === td ? ' is-today' : '') + (ds === _sel ? ' is-sel' : '') + (hol ? ' is-hol' : '') +
      (dow === 0 || dow === 6 ? ' is-wknd' : '') + (other ? ' is-other' : '') + (ds < td ? ' is-past' : '');
    b.dataset.date = ds;
    b.setAttribute('aria-label', (d.getMonth() + 1) + '월 ' + d.getDate() + '일' + (hol ? ' ' + hol : ''));
    var ks = other ? [] : dayDots(ds);
    b.innerHTML = '<span class="n">' + d.getDate() + '</span><span class="dots">' + ks.map(function(c){ return '<i style="background:' + c + '"></i>'; }).join('') + '</span>';
    b.onclick = function() { wbcPhoneTap(ds); };
    return b;
  }
  function gtmDot(g) { return g.key ? '#E8283F' : (g.series === 'q2' ? '#E0B800' : '#22B07A'); }
  function dayDots(ds) {
    var r = dayRows(ds), out = [];
    r.gtm.forEach(function(g){ out.push(gtmDot(g)); });
    r.evs.forEach(function(ev){ out.push(evDot(ev)); });
    if (r.att.length) out.push('#F0A647');
    return out.filter(function(c, i){ return out.indexOf(c) === i; }).slice(0, 4);
  }
  // kind 자리에 색(#…)을 받는다 — 일정마다 고른 색 그대로 (11/06 밤)
  function mlRow(kind, title, meta, onclick) {
    var dot = /^(#|rgb)/.test(kind) ? ' style="background:' + kind + '"' : '';
    return '<div class="wbc-ml-row"' + (onclick ? ' role="button" tabindex="0" onclick="' + onclick + '"' : '') + '>' +
      '<i class="wbc-ml-k' + (dot ? '' : ' k-' + kind) + '"' + dot + ' aria-hidden="true"></i><span class="t">' + esc(title) + '</span>' +
      (meta ? '<span class="m">' + esc(meta) + '</span>' : '') + '</div>';
  }
  function md(ds) { return (+ds.slice(5, 7)) + '/' + (+ds.slice(8, 10)); }
  function renderPhoneList(days) {
    var host = document.getElementById('wbc-mlist');
    if (!host) {
      var grid = document.getElementById('planner-grid');
      host = document.createElement('div'); host.id = 'wbc-mlist'; host.className = 'wbc-mlist';
      grid.parentNode.insertBefore(host, grid.nextSibling);
    }
    var td = today();
    var mS = _dFmt(new Date(plannerYear, plannerMonth, 1)), mE = _dFmt(new Date(plannerYear, plannerMonth + 1, 0));
    var from = _mFrom || (td > mS && td <= mE ? td : mS);
    var h = '', any = false, kr = ['일','월','화','수','목','금','토'];
    for (var d = new Date(from + 'T00:00:00'); _dFmt(d) <= mE; d = addDays(d, 1)) {
      var ds = _dFmt(d), first = ds === from || ds === td, r = dayRows(ds), rows = '';
      r.gtm.forEach(function(g) {
        var rng = gtmIsRange(g);
        if (rng && ds !== g.date && !first) return;
        rows += mlRow(gtmDot(g), g.title, [(g.key ? '★ ' : '') + (GTM_TAG[g.series] || 'GTM'), rng ? md(g.date) + '~' + md(g.end) : ''].filter(Boolean).join(' · '));
      });
      r.att.forEach(function(x) {
        if (x.full && ds !== x.start && !first) return;
        rows += mlRow('#F0A647', '누리 ' + x.label, [x.full ? (x.start !== x.end ? md(x.start) + '~' + md(x.end) : '종일') : (x.time || fmtH(x.hours)), x.plan ? '결재 전' : ''].filter(Boolean).join(' · '));
      });
      r.evs.forEach(function(ev) {
        var s = (ev[0]||'').toString(), e = (ev[5]||'').toString(), rng = e && e > s;
        if (rng && ds !== s && !first) return;
        rows += mlRow(evDot(ev), (isWriting(ev) ? '✎ ' : (isTrip(ev) ? '✈ ' : '')) + ev[1],
          [ev[2] || '', rng ? md(s) + '~' + md(e) : ''].filter(Boolean).join(' · '), 'openPlannerModal(' + idxRef(ev) + ')');
      });
      var isSel = ds === _sel;
      if (!rows && !isSel) continue;
      any = true;
      var hol = getKoreanHolidays(d.getFullYear())[ds] || '';
      h += '<div class="wbc-ml-day' + (ds === td ? ' is-today' : '') + (isSel && ds !== td ? ' is-sel' : '') + '" data-date="' + ds + '">' +
        '<h3 class="wbc-ml-d"><b>' + (d.getMonth() + 1) + '월 ' + d.getDate() + '일</b><span>' + kr[d.getDay()] + '요일' + (hol ? ' · ' + esc(hol) : '') + '</span>' +
        (ds === td ? '<em>오늘</em>' : '') + '</h3>' +
        (rows || '<p class="wbc-ml-empty">일정 없음 <button type="button" onclick="openPlannerModal(null,\'' + ds + '\')">+ 이 날 일정</button></p>') + '</div>';
    }
    if (!any) h = '<p class="wbc-ml-empty">' + (from === td ? '오늘부터 이달 끝까지 일정 없음' : '이달 일정 없음') + '</p>';
    host.innerHTML = '<p class="wbc-ml-cap">' + (from === td ? '오늘부터' : md(from) + '부터') + ' · ' + (plannerMonth + 1) + '월 말까지</p>' + h;
  }
  window.wbcPhoneTap = function(ds) {
    _sel = ds; selectedPlannerDate = ds;
    var td = today(), mS = _dFmt(new Date(plannerYear, plannerMonth, 1));
    var from = _mFrom || (td > mS ? td : mS);
    if (ds < from) _mFrom = ds;
    document.querySelectorAll('#planner-grid .wbc-mc').forEach(function(c){ c.classList.toggle('is-sel', c.dataset.date === ds); });
    renderPhoneList();
    var sec = document.querySelector('#wbc-mlist .wbc-ml-day[data-date="' + ds + '"]');
    if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };
  // 폰 ↔ 데스크탑: 연차 숫자 줄은 폰에선 목록 아래로, + 일정은 떠 있는 네모 버튼으로
  function placePhoneChrome(ph) {
    var wbc = document.getElementById('wbc'); if (!wbc) return;
    wbc.classList.toggle('is-phone', ph);
    var stats = document.getElementById('wbc-stats'), bar = wbc.querySelector('.wbc-bar'), list = document.getElementById('wbc-mlist');
    if (stats && bar) {
      if (ph && list && stats.parentNode !== list.parentNode) list.parentNode.insertBefore(stats, list.nextSibling);
      if (!ph && stats.parentNode !== bar) bar.insertBefore(stats, bar.querySelector('.wbc-ctrl'));
    }
    if (list) list.hidden = !ph;
    var fab = document.getElementById('wbc-fab');
    if (!fab) {
      fab = document.createElement('button'); fab.type = 'button'; fab.id = 'wbc-fab'; fab.className = 'wbc-fab';
      fab.innerHTML = '<span class="material-symbols-outlined" aria-hidden="true">add</span>일정';
      fab.setAttribute('aria-label', '일정 추가');
      fab.onclick = function() { openPlannerModal(null, _sel); };
      wbc.appendChild(fab);
    }
  }
  var _lastPh = null;
  window.addEventListener('resize', function() { var p = isPhone(); if (p !== _lastPh) rerender(); });

  // ─────────────── 메인 렌더 (기존 renderCalendar 대체) ───────────────
  function renderCalendarWb() {
    _sidName = null;   // 시리즈 이름표는 그릴 때마다 새로
    var grid = document.getElementById('planner-grid');
    if (!grid) return;
    var ph = isPhone();
    _lastPh = ph;
    if (ph) {
      var keep = _mode; _mode = 'month';
      var mdays;
      try { mdays = visibleDays(); renderHeader(mdays); } finally { _mode = keep; }
      grid.className = 'wbc-grid month wbc-mini';
      grid.innerHTML = '';
      var mf = document.createDocumentFragment();
      mdays.forEach(function(d) { mf.appendChild(miniCell(d)); });
      grid.appendChild(mf);
      renderPhoneList(mdays);
      placePhoneChrome(true);
      renderHeaderStats();
      return;
    }
    placePhoneChrome(false);
    var wbcEl = document.getElementById('wbc');
    if (wbcEl) wbcEl.classList.toggle('is-road', _mode === 'roadmap');
    if (_mode === 'roadmap') { renderRoadmap(grid); renderHeaderStats(); return; }
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
    _mFrom = null;
    if (_mode === 'roadmap' && !isPhone()) {
      plannerMonth += dir * 3;
      while (plannerMonth < 0) { plannerMonth += 12; plannerYear--; }
      while (plannerMonth > 11) { plannerMonth -= 12; plannerYear++; }
    } else if (_mode === 'week' && !isPhone()) {
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
    _anchor = n; _sel = _dFmt(n); _mFrom = null;
    renderCalendarWb();
    try { updatePlannerTracks(); } catch(e) {}
  };
  // ─────────────── 연·월 바로 가기 (2026-10-11) ───────────────
  //   제목(큰 월 숫자·영문 월·연도)을 누르면 작은 창: 연도 ‹ › + 12달 + TODAY. 바깥 클릭·Esc 로 닫힘.
  var _pickY = null;
  function pickerEl() { return document.getElementById('wbc-pick'); }
  function renderPicker() {
    var el = pickerEl(); if (!el) return;
    var now = new Date(), h = '<div class="wbc-pick-y"><button type="button" aria-label="이전 해" onclick="wbcPickYear(-1)">‹</button><b>' + _pickY + '</b><button type="button" aria-label="다음 해" onclick="wbcPickYear(1)">›</button></div><div class="wbc-pick-m">';
    for (var m = 0; m < 12; m++) {
      var on = _pickY === plannerYear && m === plannerMonth, nw = _pickY === now.getFullYear() && m === now.getMonth();
      h += '<button type="button" class="' + (on ? 'on' : '') + (nw ? ' now' : '') + '" onclick="wbcJump(' + _pickY + ',' + m + ')">' + MON_EN[m].slice(0, 3) + '</button>';
    }
    h += '</div><div class="wbc-pick-f"><button type="button" onclick="wbcPickerClose();wbcToday()">Today</button></div>';
    el.innerHTML = h;
  }
  window.wbcPickerToggle = function(e) {
    if (e) e.stopPropagation();
    var el = pickerEl(); if (!el) return;
    if (!el.hidden) { wbcPickerClose(); return; }
    _pickY = plannerYear; renderPicker(); el.hidden = false;
    var t = document.getElementById('wbc-title'); if (t) t.classList.add('open');
  };
  window.wbcPickerClose = function() {
    var el = pickerEl(); if (el) el.hidden = true;
    var t = document.getElementById('wbc-title'); if (t) t.classList.remove('open');
  };
  window.wbcPickYear = function(d) { _pickY += d; renderPicker(); };
  window.wbcJump = function(y, m) {
    plannerYear = y; plannerMonth = m; _mFrom = null;
    _anchor = _mode === 'week' ? new Date(y, m, 1) : null;
    wbcPickerClose();
    renderCalendarWb();
    try { updatePlannerTracks(); } catch(e) {}
  };
  document.addEventListener('click', function(e) {
    var el = pickerEl(); if (!el || el.hidden) return;
    if (!e.target.isConnected) return;   // 연도 ‹ › 누르면 창 내용을 다시 그려서 누른 버튼이 사라짐 — 바깥 클릭 아님
    if (!el.contains(e.target)) wbcPickerClose();
  });
  document.addEventListener('keydown', function(e) { if (e.key === 'Escape') { var el = pickerEl(); if (el && !el.hidden) wbcPickerClose(); } });

  window.wbcSetMode = function(m) {
    _mode = m === 'week' ? 'week' : m === 'roadmap' ? 'roadmap' : 'month';
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

  // ─────────────── (2026-11-06 3차) 화면 다듬기 CSS — index.html 대신 여기서 넣는다 ───────────────
  var R3_CSS = [
    /* ── Roadmap ── */
    '.wbc.is-road .wbc-wds, .wbc.is-road .wbc-agenda, .wbc.is-road #wbc-agenda { display:none !important; }',
    '.wbc.is-road .wbc-body { grid-template-columns:1fr !important; }',
    '.wbc-grid.roadmap { display:block !important; border:0 !important; }',
    '.rm { --rm-lab:190px; position:relative; border:1px solid #D4D4D8; background:#fff; max-width:100%; overflow:hidden; }',
    '.wbc.is-road .wbc-body > .min-w-0 { width:100%; min-width:0; }',
    '.wbc.is-road .wbc-title .big { display:none; }',
    '.rm-row { display:grid; grid-template-columns:var(--rm-lab) 1fr; border-bottom:1px solid #E4E4E9; }',
    '.rm-row:last-of-type { border-bottom:0; }',
    '.rm-lab { padding:12px 14px; border-right:1px solid #E4E4E9; display:flex; flex-direction:column; gap:2px; justify-content:center; }',
    '.rm-lab i { width:22px; height:5px; display:block; margin-bottom:4px; }',
    '.rm-lab b { font-size:15px; font-weight:800; color:#16161A; }',
    '.rm-lab span { font-size:12.5px; font-weight:600; color:#1A3FB5; }',
    '.rm-lane { position:relative; }',
    '.rm-head .rm-lane { height:50px; background:#FAFAFC; }',
    '.rm-m { position:absolute; top:0; bottom:0; display:flex; align-items:flex-end; padding:0 0 8px 8px; font-size:13px; font-weight:700; color:#16161A; border-left:1px solid #E4E4E9; gap:4px; }',
    '.rm-m b { font-size:11.5px; font-weight:800; color:#1A3FB5; position:absolute; top:6px; left:8px; line-height:1; }',
    '.rm-m.y { border-left:2px solid #16161A; }',
    '.rm-track .rm-lane { height:calc(var(--lanes) * 58px + 14px); background-image:linear-gradient(to right, #F1F1F4 1px, transparent 1px); background-size:calc(100% / ' + 15 + ') 100%; }',
    '.rm-work { position:absolute; margin-top:8px; }',
    '.rm-wt { font-size:13.5px; font-weight:800; color:#16161A; white-space:nowrap; overflow:visible; margin-bottom:4px; }',
    '.rm-wt em { font-style:normal; font-weight:600; color:#2A2A30; font-size:12.5px; }',
    '.rm-bar { position:relative; height:24px; }',
    '.rm-seg { position:absolute; top:0; bottom:0; border:0; padding:0 6px; font:inherit; font-size:12px; font-weight:800; text-align:left; white-space:nowrap; overflow:hidden; cursor:pointer; }',
    '.rm-seg:hover { filter:brightness(.95); outline:2px solid #16161A; outline-offset:-2px; }',
    '.rm-tick { position:absolute; top:4px; bottom:4px; width:2px; background:rgba(255,255,255,.9); pointer-events:none; }',
    '.rm-gap .rm-lane { height:30px; }',
    '.rm-g { position:absolute; top:5px; bottom:5px; margin:0 2px; display:grid; place-items:center; font-size:12px; font-weight:800; }',
    '.rm-g.on { background:#E8F5EC; color:#166534; }',
    '.rm-g.off { background:#FDECEC; color:#B91C1C; }',
    '.rm-gap .rm-lab span { color:#2A2A30; font-weight:700; }',
    '.rm-money .rm-lane { height:120px; }',
    '.rm-rv { position:absolute; bottom:22px; top:10px; display:flex; flex-direction:column; justify-content:flex-end; align-items:center; }',
    '.rm-rv i { width:46%; display:block; background:#9DB0EE; }',
    '.rm-rv i.ok { background:#15803D; } .rm-rv i.lo { background:#4E6FE0; } .rm-rv i.na { background:transparent; }',
    '.rm-rv b { position:absolute; bottom:-19px; font-size:12.5px; font-weight:800; color:#16161A; }',
    '.rm-goal { position:absolute; left:0; right:0; border-top:2px dashed #DC2626; pointer-events:none; margin-bottom:22px; }',
    '.rm-goal em { position:absolute; right:6px; top:-20px; font-style:normal; font-size:12px; font-weight:800; color:#DC2626; background:#fff; padding:0 4px; }',
    '.rm-today { position:absolute; top:0; bottom:44px; width:0; border-left:2px solid #DC2626; pointer-events:none; }',
    '.rm-today em { position:absolute; top:2px; left:4px; font-style:normal; font-size:11.5px; font-weight:800; color:#fff; background:#DC2626; padding:1px 5px; white-space:nowrap; }',
    '.rm-legend { display:flex; flex-wrap:wrap; gap:8px 16px; padding:12px 14px; border-top:1px solid #E4E4E9; font-size:13px; font-weight:700; color:#16161A; }',
    '.rm-legend i { display:inline-block; width:18px; height:10px; margin-right:6px; vertical-align:-1px; }',
    '.rm-legend i.tk { background:#15803D; box-shadow:inset 8px 0 0 #15803D, inset 9px 0 0 #fff; }',
    '.rm-legend .hint { font-weight:600; color:#2A2A30; margin-left:auto; }',
    /* 제목: NOVEMBER 2026 ▾ → November 2026 + 눌리는 네모 꺾쇠 */
    '.wbc .wbc-title .cap { flex-direction:row; align-items:baseline; gap:8px; padding-bottom:4px; }',
    '.wbc .wbc-title .cap b { font-size:20px; font-weight:600; letter-spacing:0; }',
    '.wbc .wbc-title .cap em { font-size:20px; font-weight:400; letter-spacing:0; color:#5B5B66; }',
    '.wbc .wbc-caret { width:32px; height:32px; display:inline-grid; place-items:center; margin:0 0 0 2px; padding:0; border:1px solid #D5D8DD; color:#15171c; align-self:flex-end; }',
    '.wbc .wbc-caret .material-symbols-outlined { font-size:20px; line-height:1; }',
    '.wbc .wbc-title:hover .wbc-caret { border-color:#15171c; }',
    '.wbc .wbc-wds span { letter-spacing:0; }',
    /* 날짜 숫자: 주말·지난 날·다른 달도 읽히게 (보조 회색은 #5B5B66 / #6E6E7A) */
    '.wbc .wbc-cd.is-past .wbc-cd-num { opacity:1; }',
    '.wbc .wbc-cd.is-past:not(.is-today) .wbc-cd-num, .wbc .wbc-cd.is-sun .wbc-cd-num, .wbc .wbc-cd.is-sat .wbc-cd-num { color:#5B5B66; }',
    '.wbc .wbc-cd.is-other .wbc-cd-num { opacity:1; color:#6E6E7A; }',
    '.wbc .wbc-cd.is-other .wbc-evs, .wbc .wbc-cd.is-other .wbc-gtms { opacity:.6; }',
    /* 주간 GTM 칩: 세로 여백 4px */
    '.wbc .wbc-gtm, .wbc .wbc-gtm.is-key, .wbc .wbc-gtm.s-q2.is-key { padding-top:4px; padding-bottom:4px; line-height:1.4; }',
    /* 시리즈 타임라인: 8~10px 글자 → 11px, 흐린 회색 → #5B5B66 */
    '#cal-work-timeline-section .text-\\[8px\\], #cal-work-timeline-section .text-\\[9px\\], #cal-work-timeline-section .text-\\[10px\\] { font-size:11px !important; }',
    '#cal-work-timeline-section .text-slate-400 { color:#5B5B66 !important; }',
    /* ── 폰: 점 달력 + 목록 ── */
    '#wbc-fab { display:none; }',
    '@media (max-width:767.98px) {',
    '  .wbc.is-phone { padding:12px 0 104px; }',
    '  .wbc.is-phone .wbc-bar { flex-wrap:nowrap; align-items:center; gap:8px; padding-bottom:12px; }',
    '  .wbc.is-phone .wbc-title { align-items:center; gap:6px; min-width:0; }',
    '  .wbc.is-phone .wbc-title .big { display:none; }',
    '  .wbc.is-phone .wbc-title .cap { padding:0; gap:6px; }',
    '  .wbc.is-phone .wbc-title .cap b, .wbc.is-phone .wbc-title .cap em { font-size:18px; }',
    '  .wbc.is-phone .wbc-caret { align-self:center; }',
    '  .wbc.is-phone .wbc-ctrl { flex-wrap:nowrap; gap:4px; margin-left:auto; }',
    '  .wbc.is-phone .wbc-ctrl .wbc-mode, .wbc.is-phone .wbc-ctrl .wbc-sep, .wbc.is-phone .wbc-ctrl > .atl-btn:not([onclick^="wbcToday"]) { display:none !important; }',
    '  .wbc.is-phone .wbc-ctrl > .atl-btn { height:36px; min-height:36px; padding:0 10px; }',
    '  .wbc.is-phone .wbc-legend { justify-content:flex-start; gap:4px 12px; font-size:11px; margin-top:10px; }',
    '  .wbc.is-phone .wbc-legend span::before { width:10px; height:10px; }',
    '  .wbc.is-phone .wbc-wds span { padding:8px 0 6px; text-align:center; font-size:11px; }',
    '  #planner-grid.wbc-mini { border-top:1px solid var(--hair); border-left:0; }',
    '  .wbc-mc { all:unset; box-sizing:border-box; display:flex; flex-direction:column; align-items:center; gap:4px; padding:6px 0 8px; min-height:48px; cursor:pointer; border-bottom:1px solid #ECECF0; }',
    '  .wbc-mc .n { font-family:var(--num); font-size:15px; line-height:24px; min-width:26px; text-align:center; color:var(--ink); font-variant-numeric:tabular-nums; }',
    '  .wbc-mc.is-wknd .n, .wbc-mc.is-hol .n, .wbc-mc.is-past .n { color:#5B5B66; }',
    '  .wbc-mc.is-other .n { color:#6E6E7A; }',
    '  .wbc-mc.is-sel .n { box-shadow:inset 0 0 0 1px var(--ink); }',
    '  .wbc-mc.is-today .n { background:#1F4BD8; color:#fff; box-shadow:none; }',
    '  .wbc-mc:focus-visible { outline:2px solid #1F4BD8; outline-offset:-2px; }',
    '  .wbc-mc .dots { display:flex; gap:3px; height:6px; }',
    '  .wbc-mc .dots i, .wbc-ml-k { display:block; width:6px; height:6px; }',
    '  .wbc-mc .dots i.k-key, .wbc-ml-k.k-key { background:#1F4BD8; }',
    '  .wbc-mc .dots i.k-work, .wbc-ml-k.k-work { background:#fff; box-shadow:inset 0 0 0 1px #8A8A95; }',
    '  .wbc-mc .dots i.k-me, .wbc-ml-k.k-me { background:#fff; box-shadow:inset 0 0 0 1px #15171c; }',
    '  .wbc-mc .dots i.k-off, .wbc-ml-k.k-off { background:#F0A647; }',
    '  .wbc-mlist { margin-top:20px; }',
    '  .wbc-ml-cap { font-size:12px; font-weight:600; color:#5B5B66; margin:0 0 4px; }',
    '  .wbc-ml-day { border-top:1px solid var(--ink); padding:10px 0 6px; scroll-margin-top:72px; }',
    '  .wbc-ml-day.is-sel { background:#EEF2FD; box-shadow:-16px 0 0 #EEF2FD, 16px 0 0 #EEF2FD; }',
    '  .wbc-ml-d { display:flex; align-items:baseline; gap:8px; margin:0 0 6px; font-size:15px; font-weight:700; color:var(--ink); }',
    '  .wbc-ml-d span { font-size:12px; font-weight:500; color:#5B5B66; }',
    '  .wbc-ml-d em { font-style:normal; font-size:11px; font-weight:700; color:#fff; background:#1F4BD8; padding:1px 6px; }',
    '  .wbc-ml-row { display:grid; grid-template-columns:12px minmax(0,1fr); column-gap:10px; align-items:baseline; padding:7px 0; border-top:1px solid #ECECF0; }',
    '  .wbc-ml-d + .wbc-ml-row { border-top:0; }',
    '  .wbc-ml-row[role=button] { cursor:pointer; }',
    '  .wbc-ml-row .wbc-ml-k { width:12px; height:12px; align-self:start; margin-top:3px; grid-row:1 / span 2; }',
    '  .wbc-ml-row .t { font-size:14px; font-weight:600; color:var(--ink); line-height:1.4; overflow-wrap:anywhere; }',
    '  .wbc-ml-row .m { grid-column:2; font-size:12px; color:#5B5B66; margin-top:1px; }',
    '  .wbc-ml-empty { font-size:13px; color:#5B5B66; margin:4px 0; display:flex; align-items:center; gap:10px; }',
    '  .wbc-ml-empty button { border:1px solid #D5D8DD; background:#fff; font-size:12px; font-weight:600; color:var(--ink); padding:4px 8px; cursor:pointer; }',
    '  .wbc.is-phone #wbc-stats { margin:24px 0 0; padding:16px 0 0; border-top:1px solid #ECECF0; flex-wrap:wrap; gap:12px 24px; }',
    '  .wbc.is-phone #wbc-fab { display:inline-flex; position:fixed; right:16px; bottom:calc(16px + env(safe-area-inset-bottom)); z-index:40; height:52px; padding:0 18px 0 14px; align-items:center; gap:4px; border:0; background:#1F4BD8; color:#fff; font-size:15px; font-weight:700; box-shadow:0 4px 14px rgba(21,23,28,.18); cursor:pointer; }',
    '  .wbc.is-phone #wbc-fab:active { background:#1A3FB5; }',
    '  .wbc.is-phone #wbc-fab .material-symbols-outlined { font-size:22px; }',
    '}'
  ].join('\n');
  // ─────────────── (2026-11-06 4차) 다듬기 — 시리즈 타임라인 막대 4색 문법 · 통계 12px · 범례 선 ───────────────
  //   막대 색(앰버·파랑·청록·보라·초록)은 app-1-pages.js 가 인라인으로 칠한다 → 여기서 뜻으로 덮어쓴다 (title 이 「시놉: …」 꼴)
  var TL = ['#cal-work-timeline-section', '#work-timeline-section'];
  function tl(sel) { return TL.map(function(r) { return r + ' div.relative.flex-1 > div.absolute.top-1\\.5' + sel; }).join(', '); }
  var R4_CSS = [
    tl(' > span') + ' { font-size:11px !important; font-weight:600 !important; line-height:20px; }',
    TL.map(function(r) { return r + ' .flex.gap-2\\.5'; }).join(', ') + ' { font-size:12px !important; color:#5B5B66 !important; flex-wrap:wrap; row-gap:4px; }',
    TL.map(function(r) { return r + ' .flex.gap-2\\.5 > span'; }).join(', ') + ' { white-space:nowrap; flex:none; }',
    TL.map(function(r) { return r + ' > div:first-child > div.flex.items-center.gap-2'; }).join(', ') + ' { flex-wrap:wrap; row-gap:6px; }',
    /* 통계 보조 줄 11px → 12px */
    '.wbc .wbc-stat .s, #wbc .wbc-stat .s { font-size:12px; }',
    /* 주간 GTM 칩 여백: 좁은 화면에서 2px 3px 까지 줄던 것 → 4px 6px */
    'html body #wbc .wbc-gtm, html body #wbc .wbc-gtm.s-fw, html body #wbc .wbc-gtm.is-key { padding:4px 6px !important; }',
    /* 범례 「업무 일정」·연장근무 견본: #DCDCE3 선은 흰 바탕에서 안 보임 → #8A8A95 (폰 점과 같은 선) */
    '.wbc-legend .k-work::before, .wbc .wbc-stat .l.is-ot::before { box-shadow:inset 0 0 0 1px #8A8A95; }'
  ].join('\n');
  function injectCss() {
    if (!document.getElementById('atl-r4y-cal')) { var s4 = document.createElement('style'); s4.id = 'atl-r4y-cal'; s4.textContent = R4_CSS; document.head.appendChild(s4); }
    if (document.getElementById('atl-r3y-cal')) return;
    var st = document.createElement('style'); st.id = 'atl-r3y-cal'; st.textContent = R3_CSS;
    document.head.appendChild(st);
    var c = document.querySelector('#wbc .wbc-caret');
    if (c) c.innerHTML = '<span class="material-symbols-outlined">expand_more</span>';
    document.querySelectorAll('#wbc .wbc-wds span').forEach(function(sp, i) { sp.textContent = WD_EN[i]; });
  }

  function boot() {
    injectCss();
    wbInit();
    // 연차 총계 모달을 body로 (매트릭스 페이지 안에 갇혀 있던 문제)
    var m = document.getElementById('leave-edit-modal');
    if (m && m.parentNode !== document.body) document.body.appendChild(m);
    rerender();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
