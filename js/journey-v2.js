// ════════════════════════════════════════════════════════════════════
// 일정 탭 v2 (2026-10-08) — 시안 v1 적용: 각진 에디토리얼 표지 · Route 경로 띠 · NEXT 바
//   · 표지: 여행 이름 크게 + 날짜 + D-day(보라 큰 숫자) + Days/Stops/Drive/Budget 4칸
//   · Route: Stippl식 — 도시 사진·번호·영문/한글 이름·날짜·N박, 도시 사이 직선거리 기준 예상 이동
//   · NEXT: 여행 중일 때만, 오늘 다음 일정과 남은 시간
//   app-1-pages.js의 renderTripHeader / renderCityCards 를 감싸서(원래 동작 + 추가 렌더) 쓴다.
// ════════════════════════════════════════════════════════════════════
(function() {
  'use strict';
  var MON = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  var WD = ['SUN','MON','TUE','WED','THU','FRI','SAT'];
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function d0(s) { return new Date(String(s).slice(0, 10) + 'T00:00:00'); }
  function ymd(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function km(a, b) {
    var R = 6371, r = Math.PI / 180, dLa = (b.lat - a.lat) * r, dLo = (b.lng - a.lng) * r;
    var s = Math.sin(dLa / 2) * Math.sin(dLa / 2) + Math.cos(a.lat * r) * Math.cos(b.lat * r) * Math.sin(dLo / 2) * Math.sin(dLo / 2);
    return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
  }
  function hasXY(c) { return c && typeof c.lat === 'number' && typeof c.lng === 'number'; }
  // 도로는 직선보다 길다 → 1.25배, 평균 80km/h로 대략 계산 (표시는 ≈)
  function legOf(a, b) {
    if (!hasXY(a) || !hasXY(b)) return null;
    var road = km(a, b) * 1.25;
    var mins = Math.round(road / 80 * 60 / 10) * 10;
    return { km: Math.round(road), h: Math.floor(mins / 60), m: mins % 60 };
  }
  function cities() { return (typeof citiesData !== 'undefined' && citiesData) ? citiesData : []; }
  function trip() { try { return getCurrentTrip(); } catch(e) { return null; } }

  // ─────────────── 표지 ───────────────
  function renderMast() {
    var t = trip();
    var mast = document.getElementById('trv-hero');
    if (!t || !mast) return;
    var eb = document.getElementById('jv-eyebrow');
    var datesEl = document.getElementById('journey-trip-dates');
    var dd = document.getElementById('jv-dday'), ddl = document.getElementById('jv-dday-l');
    var facts = document.getElementById('jv-facts');
    var s = t.start_date ? d0(t.start_date) : null, e = t.end_date ? d0(t.end_date) : null;
    if (eb) eb.textContent = 'Itinerary' + (s ? ' · ' + s.getFullYear() : '');
    if (datesEl && s && e) {
      datesEl.textContent = MON[s.getMonth()] + ' ' + String(s.getDate()).padStart(2, '0') + ' ' + WD[s.getDay()] + ' — ' +
        MON[e.getMonth()] + ' ' + String(e.getDate()).padStart(2, '0') + ' ' + WD[e.getDay()] + ' · ' + e.getFullYear();
    }
    var days = (s && e) ? Math.round((e - s) / 864e5) + 1 : 0;
    if (dd && ddl && s && e) {
      var td = d0(ymd(new Date()));
      if (td < s) { ddl.textContent = 'Departure in'; dd.textContent = 'D−' + Math.round((s - td) / 864e5); }
      else if (td <= e) { ddl.textContent = 'On the road'; dd.textContent = 'DAY ' + (Math.round((td - s) / 864e5) + 1) + '/' + days; }
      else { ddl.textContent = 'Back home'; dd.textContent = 'DONE'; }
    }
    if (facts) {
      var cs = cities(), total = 0, known = 0;
      for (var i = 1; i < cs.length; i++) { var lg = legOf(cs[i - 1], cs[i]); if (lg) { total += lg.km; known++; } }
      var remainEl = document.getElementById('travel-mini-remain');
      var remain = remainEl && remainEl.textContent && remainEl.textContent !== '—' ? remainEl.textContent : '—';
      var nights = cs.reduce(function(n, c) { return n + (c.nights || 0); }, 0);
      facts.innerHTML =
        '<div><p class="jv-lbl">Days</p><b>' + (days || '—') + '<small>일</small></b></div>' +
        '<div><p class="jv-lbl">Stops</p><b>' + cs.length + '<small>곳 · ' + nights + '박</small></b></div>' +
        '<div><p class="jv-lbl">Drive</p><b>' + (known ? '≈' + total.toLocaleString('ko-KR') : '—') + '<small>km</small></b></div>' +
        '<div><p class="jv-lbl">Budget left</p><b>' + esc(remain) + '</b></div>';
    }
  }

  // ─────────────── Route 경로 띠 ───────────────
  function enOf(name) { try { return _cityEn(name) || ''; } catch(e) { return ''; } }
  function renderRoute() {
    var box = document.getElementById('journey-city-cards');
    if (!box) return;
    var cs = cities();
    var meta = document.getElementById('jv-route-meta');
    if (meta) meta.textContent = cs.length ? cs.length + ' stops · ' + cs.reduce(function(n, c){ return n + (c.nights || 0); }, 0) + ' nights' : '';
    if (!cs.length) { box.innerHTML = '<p class="jv-empty">도시를 추가하면 여기에 경로가 생겨요</p>'; return; }
    var h = '';
    cs.forEach(function(c, i) {
      var key = String(c._id || ('idx-' + i)).replace(/'/g, "\\'");
      var img = (window.journeyCityImageGet && window.journeyCityImageGet(c._id || ('idx-' + i))) || '';
      var en = enOf(c.name), kr = c.name || '';
      var ds = c.start_date ? c.start_date.slice(5).replace('-', '.') + (c.end_date ? ' – ' + c.end_date.slice(5).replace('-', '.') : '') : 'TBD';
      var safeName = (c.name || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
      h += '<div class="j-stop-card jv-stop" data-city="' + safeName + '" title="클릭하면 이 도시 날짜로 이동" ' +
          'onclick="window.journeyStopJump && journeyStopJump(\'' + safeName + '\')" ' +
          'onmouseenter="window.journeyCityImageSetActive && journeyCityImageSetActive(\'' + key + '\')" ' +
          'onmouseleave="window.journeyCityImageClearActive && journeyCityImageClearActive(\'' + key + '\')">' +
          '<div class="jv-stop-img"' + (img ? ' style="background-image:url(\'' + img.replace(/'/g, '%27') + '\')"' : '') + '>' +
            '<span class="jv-stop-no">' + String(i + 1).padStart(2, '0') + '</span>' +
            (img ? '' : '<span class="jv-stop-ph">사진 없음 · Ctrl+V</span>') +
            '<span class="jv-stop-ctl">' +
              '<button type="button" onclick="event.stopPropagation();journeyCityImageUpload(\'' + key + '\')">' + (img ? '사진 변경' : '사진 추가') + '</button>' +
              '<button type="button" onclick="event.stopPropagation();editCityEntry(' + i + ')">수정</button>' +
              '<button type="button" onclick="event.stopPropagation();deleteCityEntry(' + i + ')">삭제</button>' +
            '</span>' +
            '<input type="file" accept="image/*" style="display:none" data-city-key="' + key + '" onchange="event.stopPropagation();journeyCityImageFileSelected(event,\'' + key + '\')">' +
          '</div>' +
          '<p class="jv-stop-en">' + esc(en || kr) + '</p>' +
          '<p class="jv-stop-kr">' + esc(en ? kr : '') + '</p>' +
          '<p class="jv-stop-meta"><span>' + esc(ds) + '</span><b>' + (c.nights ? c.nights + 'N' : 'DAY') + '</b></p>' +
        '</div>';
      if (i < cs.length - 1) {
        var lg = legOf(c, cs[i + 1]);
        h += '<div class="jv-leg" aria-hidden="true"><span>' + (lg ? '≈ ' + (lg.h ? lg.h + 'H ' : '') + (lg.m ? lg.m + 'M' : '') + '<br>' + lg.km + ' KM' : '→') + '</span></div>';
      }
    });
    box.innerHTML = h;
    try { if (typeof _syncStopStrip === 'function') _syncStopStrip(); } catch(e) {}
  }

  // ─────────────── NEXT 바 (여행 중일 때만) ───────────────
  function renderNext() {
    var el = document.getElementById('trv-next');
    if (!el) return;
    var t = trip(), now = new Date(), td = ymd(now);
    if (!t || !t.start_date || !t.end_date || td < t.start_date.slice(0, 10) || td > t.end_date.slice(0, 10)) { el.style.display = 'none'; return; }
    var jd = (typeof journeyData !== 'undefined' && journeyData) ? journeyData : [];
    var hm = now.getHours() * 60 + now.getMinutes();
    var next = jd.filter(function(d) { return d.type === '일정' && d.date === td && /^\d{1,2}:\d{2}/.test(d.time || ''); })
      .map(function(d) { var p = d.time.split(':'); return { d: d, m: (+p[0]) * 60 + (+p[1].slice(0, 2)) }; })
      .filter(function(x) { return x.m >= hm; })
      .sort(function(a, b) { return a.m - b.m; })[0];
    if (!next) { el.style.display = 'none'; return; }
    var left = next.m - hm, lt = left >= 60 ? Math.floor(left / 60) + '<small>시간 ' + (left % 60) + '분 후</small>' : left + '<small>분 후</small>';
    el.innerHTML = '<span class="jv-lbl">Next</span><div><b>' + esc(next.d.time.slice(0, 5)) + ' ' + esc(next.d.title || '') + '</b>' +
      (next.d.city ? '<div class="jv-lbl jv-next-sub">' + esc(next.d.city) + '</div>' : '') + '</div><span class="jv-next-in">' + lt + '</span>';
    el.style.display = '';
  }

  function renderAll() { try { renderMast(); } catch(e) { console.warn('[jv] mast', e); } try { renderRoute(); } catch(e) { console.warn('[jv] route', e); } try { renderNext(); } catch(e) {} }
  window.journeyV2Render = renderAll;

  // 원래 함수 감싸기 — 여행·도시가 바뀔 때마다 같이 다시 그림
  function wrap(name, after) {
    var orig = window[name];
    if (typeof orig !== 'function' || orig.__jv) return;
    var w = function() {
      var r = orig.apply(this, arguments);
      var run = function() { try { after(); } catch(e) { console.warn('[jv]', name, e); } };
      if (r && typeof r.then === 'function') r.then(run, run); else run();
      return r;
    };
    w.__jv = true;
    window[name] = w;
  }
  // Daily Log 날짜 블록 머리에 큰 날짜 번호(03) — 시안식
  function decorateLog() {
    var grid = document.getElementById('journey-week-grid');
    if (!grid || typeof getDayMap !== 'function') return;
    var dm = getDayMap(), byDate = {};
    dm.forEach(function(e) { byDate[e.date] = e.day; });
    grid.querySelectorAll('.wk4-col[data-date]').forEach(function(col) {
      var head = col.querySelector('.wk4-head');
      if (!head || head.querySelector('.jv-dno')) return;
      var n = byDate[col.getAttribute('data-date')];
      if (n == null) return;
      var s = document.createElement('span');
      s.className = 'jv-dno';
      s.textContent = String(n).padStart(2, '0');
      head.insertBefore(s, head.firstChild);
    });
  }
  function boot() {
    wrap('renderWeekView', decorateLog);
    wrap('renderTripHeader', renderAll);
    wrap('renderCityCards', function() { renderRoute(); renderMast(); });
    wrap('updateTravelMiniSummary', renderMast);
    renderAll();
    setInterval(renderNext, 60000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
