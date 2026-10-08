// ════════════════════════════════════════════════════════════════════
// 예약 탭 v2 (2026-10-08) — 날짜순 타임라인 (TripIt식 장부 + Mr & Mrs Smith식 숙소 카드)
//   · 기존 장부 탭(Flights/Lodging/…) 앞에 'Timeline' 탭을 하나 더 붙임 — 기존 탭·편집 기능은 그대로
//   · 항공편·숙소·렌트카·이동수단을 날짜 한 줄로 모아 보여주고, 숙소가 비는 밤은 경고
//   · 수정/삭제는 기존 editJourneyItem / deleteJourneyRow 그대로 호출
// ════════════════════════════════════════════════════════════════════
(function() {
  'use strict';
  var ID = 'trv-timeline';
  var DOW = ['일', '월', '화', '수', '목', '금', '토'];
  var MON = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function jd() { try { return journeyData || []; } catch(e) { return []; } }
  function trip() { try { return getCurrentTrip(); } catch(e) { return null; } }
  function isDate(s) { return /^\d{4}-\d{2}-\d{2}$/.test(String(s || '')); }
  function addDay(s, n) { var d = new Date(s + 'T00:00:00'); d.setDate(d.getDate() + n); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function nightsBetween(a, b) { return (isDate(a) && isDate(b)) ? Math.round((new Date(b) - new Date(a)) / 864e5) : 0; }
  function money(v) {
    if (v == null || v === '') return '';
    var n = Number(String(v).replace(/[^\d.-]/g, ''));
    if (!isFinite(n) || !n) return esc(v);
    return /[€$£¥]/.test(String(v)) ? esc(v) : n.toLocaleString('ko-KR') + '원';
  }
  function pay(it) {
    var s = (typeof window._trvPayStatus === 'function') ? window._trvPayStatus(it) : (it.payment_status || '');
    if (!s) return '';
    var k = s.indexOf('결제 완료') === 0 ? 'done' : s.indexOf('결제 예정') === 0 ? 'due' : s.indexOf('현장') === 0 ? 'onsite' : '';
    return '<span class="bk-pay is-' + k + '">' + esc(s) + '</span>';
  }
  function btns(idx) {
    return '<span class="bk-act"><button type="button" onclick="event.stopPropagation();editJourneyItem(' + idx + ')">수정</button>' +
      '<button type="button" onclick="event.stopPropagation();deleteJourneyRow(' + idx + ')">삭제</button></span>';
  }
  function cityHtml(c) { return (c && typeof window.cityCountryHtml === 'function') ? (window.cityCountryHtml(c) || '') + ' ' + esc(c) : esc(c || ''); }
  function kv(label, val) { return val ? '<div class="bk-kv"><span>' + label + '</span><b>' + val + '</b></div>' : ''; }

  // "ICN → CPH" / "ICN-CPH" / "인천 → 코펜하겐" 에서 출발·도착 뽑기
  function route(s) {
    var p = String(s || '').split(/\s*(?:→|->|–|—|-|~|>)\s*/).filter(Boolean);
    return p.length >= 2 ? [p[0], p[p.length - 1]] : [s || '', ''];
  }

  function flightCard(it, idx) {
    var r = route(it.description);
    var code = function(x) { var m = /\b([A-Z]{3})\b/.exec(x); return m ? m[1] : x; };
    return '<article class="bk-card bk-flight">' +
      '<header class="bk-fh"><span class="bk-tag">✈ FLIGHT</span><b>' + esc(it.title || '') + '</b><span class="bk-mute">' + esc(it.city || '') + '</span>' + btns(idx) + '</header>' +
      '<div class="bk-route">' +
        '<div><p class="bk-code">' + esc(code(r[0])) + '</p><p class="bk-time">' + esc(it.time || '') + '</p></div>' +
        '<div class="bk-line"><span>' + esc(it.duration || '') + '</span></div>' +
        '<div class="bk-r"><p class="bk-code">' + esc(code(r[1])) + '</p><p class="bk-time">' + esc(it.arrive || '') + '</p></div>' +
      '</div>' +
      '<div class="bk-kvs">' +
        kv('좌석', esc([it.seat_class, it.seat_number].filter(Boolean).join(' · '))) +
        kv('수하물', esc(it.baggage || '')) +
        kv('예약번호', esc(it.pnr || '')) +
        kv('금액', money(it.amount)) +
        (pay(it) ? '<div class="bk-kv"><span>결제</span>' + pay(it) + '</div>' : '') +
      '</div></article>';
  }

  function stayCard(it, idx) {
    var key = String(it._id || ('lodge-fb-' + idx));
    var img = (window.journeyLodgeImageGet && window.journeyLodgeImageGet(key)) || '';
    var n = nightsBetween(it.date, it.checkout_date);
    var cancel = it.cancel === '가능' ? '무료 취소' + (it.cancel_date ? ' ~' + esc(it.cancel_date) : '') :
      it.cancel === '조건부' ? '조건부 취소' + (it.cancel_date ? ' ~' + esc(it.cancel_date) : '') :
      it.cancel === '불가' ? '환불 불가' : esc(it.cancel || '');
    var kind = /airbnb/i.test(it.description || '') ? 'AIRBNB' : 'HOTEL';
    var d = function(s) { if (!isDate(s)) return esc(s || '—'); var x = new Date(s + 'T00:00:00'); return (x.getMonth() + 1) + '/' + x.getDate() + ' (' + DOW[x.getDay()] + ')'; };
    return '<article class="bk-card bk-stay">' +
      '<div class="bk-photo"' + (img ? ' style="background-image:url(&quot;' + String(img).replace(/"/g, '%22') + '&quot;)"' : '') + '>' + (img ? '' : '<span>🛏</span>') + '</div>' +
      '<div class="bk-sbody">' +
        '<header class="bk-fh"><span class="bk-tag">' + kind + '</span><span class="bk-mute">' + cityHtml(it.city) + '</span>' + btns(idx) + '</header>' +
        '<h4 class="bk-name">' + esc(it.title || '(숙소 이름)') + '</h4>' +
        '<div class="bk-io"><div><span>IN</span><b>' + d(it.date) + '</b><i>' + esc(it.checkin || '') + '</i></div>' +
          '<div class="bk-n">' + (n ? n + '박' : '') + '</div>' +
          '<div><span>OUT</span><b>' + d(it.checkout_date) + '</b><i>' + esc(it.checkout || '') + '</i></div></div>' +
        '<div class="bk-kvs">' + kv('취소', cancel) + kv('금액', money(it.amount || it.price)) + (pay(it) ? '<div class="bk-kv"><span>결제</span>' + pay(it) + '</div>' : '') + '</div>' +
      '</div></article>';
  }

  function miniCard(it, idx, icon, label) {
    var right = it.type === '렌트카'
      ? esc([it.city, it.drop_city].filter(Boolean).join(' → ')) + (it.checkout_date ? ' · ~' + esc(it.checkout_date.slice(5).replace('-', '/')) : '')
      : esc(it.description || it.city || '');
    return '<article class="bk-card bk-mini"><span class="bk-tag">' + icon + ' ' + label + '</span>' +
      '<b>' + esc(it.title || '') + '</b><span class="bk-mute">' + right + '</span>' +
      '<span class="bk-mini-r">' + esc(it.time || '') + (money(it.amount) ? ' · ' + money(it.amount) : '') + pay(it) + '</span>' + btns(idx) + '</article>';
  }

  function render() {
    var box = document.getElementById(ID + '-body');
    if (!box) return;
    var all = jd(), t = trip() || {};
    var ev = [];
    all.forEach(function(it, idx) {
      if (it.type === '항공편') ev.push({ d: it.date, t: it.time || '', k: 0, h: flightCard(it, idx), it: it });
      else if (it.type === '숙소') ev.push({ d: it.date, t: it.checkin || '15:00', k: 2, h: stayCard(it, idx), it: it });
      else if (it.type === '렌트카') ev.push({ d: it.date, t: it.time || '', k: 1, h: miniCard(it, idx, '🚗', 'RENTAL'), it: it });
      else if (it.type === '이동수단') ev.push({ d: it.date, t: it.time || '', k: 1, h: miniCard(it, idx, '🚆', 'TRANSIT'), it: it });
    });
    // 숙소 비는 밤 찾기 (여행 시작일 ~ 마지막 날 전날)
    var covered = {};
    all.filter(function(x) { return x.type === '숙소' && isDate(x.date); }).forEach(function(x) {
      var n = Math.max(1, nightsBetween(x.date, x.checkout_date));
      for (var i = 0; i < n; i++) covered[addDay(x.date, i)] = 1;
    });
    var gaps = [];
    if (isDate(t.start_date) && isDate(t.end_date)) {
      for (var d = t.start_date; d < t.end_date; d = addDay(d, 1)) if (!covered[d]) gaps.push(d);
    }
    gaps.forEach(function(g) { ev.push({ d: g, t: '99', k: 3, h: '<div class="bk-gap"><b>빈 밤</b> 이 날 묵을 숙소가 아직 없어요</div>' }); });

    var nFlight = ev.filter(function(e){ return e.k === 0; }).length;
    var nNights = Object.keys(covered).length, nAll = (isDate(t.start_date) && isDate(t.end_date)) ? nightsBetween(t.start_date, t.end_date) : 0;
    var sum = '<div class="bk-sum">' +
      '<div><span>FLIGHTS</span><b>' + nFlight + '</b></div>' +
      '<div><span>NIGHTS BOOKED</span><b>' + nNights + (nAll ? '<small>/' + nAll + '</small>' : '') + '</b></div>' +
      '<div><span>RENTAL · TRANSIT</span><b>' + ev.filter(function(e){ return e.k === 1; }).length + '</b></div>' +
      '<div class="' + (gaps.length ? 'is-warn' : '') + '"><span>EMPTY NIGHTS</span><b>' + gaps.length + '</b></div></div>';

    if (!ev.length) { box.innerHTML = sum + '<p class="bk-empty">아직 예약이 없어요 · 옆 탭에서 항공편·숙소를 추가하면 여기 날짜순으로 모여요</p>'; return; }
    ev.sort(function(a, b) { return (a.d || '').localeCompare(b.d || '') || a.k - b.k || String(a.t).localeCompare(String(b.t)); });
    var groups = [], cur = null;
    ev.forEach(function(e) { if (!cur || cur.d !== e.d) { cur = { d: e.d, list: [] }; groups.push(cur); } cur.list.push(e); });
    var dayNo = function(s) { return (isDate(s) && isDate(t.start_date)) ? nightsBetween(t.start_date, s) + 1 : null; };
    box.innerHTML = sum + groups.map(function(g) {
      var head;
      if (isDate(g.d)) {
        var x = new Date(g.d + 'T00:00:00'), dn = dayNo(g.d), w = x.getDay();
        head = '<div class="bk-date' + (w === 0 || w === 6 ? ' is-wknd' : '') + '"><b>' + String(x.getDate()).padStart(2, '0') + '</b>' +
          '<span>' + MON[x.getMonth()] + ' · ' + DOW[w] + '</span>' + (dn != null && dn >= 1 ? '<i>DAY ' + String(dn).padStart(2, '0') + '</i>' : '') + '</div>';
      } else head = '<div class="bk-date"><b>—</b><span>날짜 미정</span></div>';
      return '<section class="bk-row">' + head + '<div class="bk-items">' + g.list.map(function(e){ return e.h; }).join('') + '</div></section>';
    }).join('');
  }

  function ensureSection() {
    if (document.getElementById(ID)) return true;
    var anchor = document.getElementById('trv-flights');
    if (!anchor) return false;
    var s = document.createElement('section');
    s.id = ID;
    s.innerHTML = '<div class="trv-sec-head"><div><p class="trv-sec-eyebrow">Timeline</p><h3 class="trv-sec-title">날짜순 예약</h3></div></div><div id="' + ID + '-body"></div>';
    anchor.parentNode.insertBefore(s, anchor);
    return true;
  }
  function activeTab() { try { return localStorage.getItem('trv_ledger_tab') || ID; } catch(e) { return ID; } }

  function afterTabs() {
    if (!ensureSection()) return;
    var nav = document.getElementById('trv-ledger-tabs');
    var on = activeTab() === ID;
    if (nav) {
      var b = nav.querySelector('.trv-ltab-tl');
      if (!b) {
        b = document.createElement('button');
        b.className = 'trv-ltab trv-ltab-tl';
        b.onclick = function() { window.trvLedgerShow(ID); };
        nav.insertBefore(b, nav.firstChild);
      }
      var cnt = jd().filter(function(x) { return /^(항공편|숙소|렌트카|이동수단)$/.test(x.type); }).length;
      b.innerHTML = 'Timeline<span class="cnt">' + cnt + '</span>';
      b.classList.toggle('is-active', on);
      if (on) nav.querySelectorAll('.trv-ltab:not(.trv-ltab-tl)').forEach(function(x) { x.classList.remove('is-active'); });
    }
    (window._trvLedgerIds || []).forEach(function(id) { var s = document.getElementById(id); if (s && on) s.style.display = 'none'; });
    document.getElementById(ID).style.display = on ? '' : 'none';
    if (on) { try { render(); } catch(e) { console.warn('[bk] render', e); } }
  }

  function wrap(name, after) {
    var orig = window[name];
    if (typeof orig !== 'function' || orig.__bk) return false;
    var w = function() {
      var r = orig.apply(this, arguments);
      var run = function() { try { after(); } catch(e) { console.warn('[bk]', name, e); } };
      if (r && typeof r.then === 'function') r.then(run, run); else run();
      return r;
    };
    w.__bk = true; window[name] = w;
    return true;
  }
  window.bookingsV2Render = afterTabs;
  function boot() {
    wrap('renderLedgerTabs', afterTabs);
    ['renderJourneyFlights', 'renderJourneyLodging', 'renderJourneyRental', 'renderJourneyTransport'].forEach(function(n) {
      wrap(n, function() { if (activeTab() === ID) { try { render(); } catch(e) {} } });
    });
    afterTabs();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
