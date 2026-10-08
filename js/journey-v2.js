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
  // ★ (2026-10-08) 도시 → 나라(국기 + 한글 이름). 한 여행에 두 나라를 다녀서 어느 나라 도시인지 늘 보이게.
  //   1) 아는 도시 표  2) 브라우저 캐시  3) Open-Meteo(무료)로 영어 이름 검색 → 캐시 후 다시 그림
  var CITY_CC = { 'frankfurt am main':'DE','frankfurt':'DE','dresden':'DE','berlin':'DE','munich':'DE','hamburg':'DE','dessau':'DE',
    'pienza':'IT','rome':'IT','pisa':'IT','florence':'IT','venice':'IT','milan':'IT','siena':'IT','dolomiti':'IT','bologna':'IT',
    'strasbourg':'FR','colmar':'FR','bruges':'BE','ghent':'BE','brussels':'BE','seville':'ES','ronda':'ES','granada':'ES','malaga':'ES','doolin':'IE','oslo':'NO','bergen':'NO','ulvik':'NO','flam':'NO','voss':'NO','copenhagen':'DK','aarhus':'DK','skagen':'DK','odense':'DK','malmo':'SE','stockholm':'SE','sandhamn':'SE','gothenburg':'SE',
    'montreal':'CA','charlevoix':'CA','quebec city':'CA','quebec':'CA','mont-tremblant':'CA','ottawa':'CA','algonquin':'CA','toronto':'CA',
    'prague':'CZ','cesky krumlov':'CZ','dubrovnik':'HR','zagreb':'HR','plitvice':'HR','split':'HR',
    'dublin':'IE','cork':'IE','kilkenny':'IE','killarney':'IE','galway':'IE','sligo':'IE','belfast':'GB','london':'GB','paris':'FR','vienna':'AT' };
  var CC_KO = { DE:'독일', IT:'이탈리아', DK:'덴마크', SE:'스웨덴', NO:'노르웨이', FI:'핀란드', CA:'캐나다', US:'미국', CZ:'체코', HR:'크로아티아',
    IE:'아일랜드', GB:'영국', FR:'프랑스', ES:'스페인', PT:'포르투갈', AT:'오스트리아', CH:'스위스', NL:'네덜란드', BE:'벨기에', HU:'헝가리',
    PL:'폴란드', GR:'그리스', IS:'아이슬란드', JP:'일본', TW:'대만', TH:'태국', VN:'베트남', KR:'한국', SI:'슬로베니아', SK:'슬로바키아', EE:'에스토니아' };
  var _ccCache = {}; try { _ccCache = JSON.parse(localStorage.getItem('jv_city_cc') || '{}'); } catch(e) {}
  var _ccAsk = {};
  function plain(s) { return String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim(); }
  function flagOf(cc) { return String(cc).toUpperCase().replace(/./g, function(c) { return String.fromCodePoint(127397 + c.charCodeAt(0)); }); }
  function lookupCC(name) {
    if (_ccAsk[name]) return; _ccAsk[name] = true;
    var en = (typeof _cityEn === 'function' && _cityEn(name)) || name;
    if (!/[A-Za-z]/.test(en)) return;
    fetch('https://geocoding-api.open-meteo.com/v1/search?name=' + encodeURIComponent(plain(en).replace(/\s+city$/, '')) + '&count=1&language=en')
      .then(function(r) { return r.json(); }).then(function(j) {
        var cc = j && j.results && j.results[0] && j.results[0].country_code;
        if (!cc) return;
        _ccCache[name] = cc.toUpperCase();
        try { localStorage.setItem('jv_city_cc', JSON.stringify(_ccCache)); } catch(e) {}
        try { renderAll(); } catch(e) {}
        try { if (typeof renderWeekView === 'function') renderWeekView(); } catch(e) {}
        try { if (typeof renderTripLodgingBreakdown === 'function') renderTripLodgingBreakdown(); } catch(e) {}
      }).catch(function() {});
  }
  window.cityCountry = function(name) {
    if (!name) return null;
    var raw = String(name).trim();
    var cc = _ccCache[raw];
    if (!cc) {
      var en = plain((typeof _cityEn === 'function' && _cityEn(raw)) || raw);
      cc = CITY_CC[en] || CITY_CC[en.split(/[\s,]/)[0]] || null;
      if (!cc) { lookupCC(raw); return null; }
    }
    return { cc: cc, ko: CC_KO[cc] || cc, flag: flagOf(cc) };
  };
  window.cityCountryHtml = function(name, cls) {
    var c = window.cityCountry(name);
    return c ? '<span class="jv-cty' + (cls ? ' ' + cls : '') + '"><span class="jv-flag">' + c.flag + '</span>' + c.ko + '</span>' : '';
  };

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
          '<p class="jv-stop-cty">' + (window.cityCountryHtml(c.name) || '&nbsp;') + '</p>' +
          '<p class="jv-stop-en">' + esc(en || kr) + '</p>' +
          '<p class="jv-stop-kr">' + esc(en ? kr : '') + '</p>' +
          '<p class="jv-stop-meta"><span>' + esc(ds) + '</span><b>' + (c.nights ? c.nights + 'N' : 'DAY') + '</b></p>' +
        '</div>';
      if (i < cs.length - 1) {
        h += legHtml(c, cs[i + 1]);
      }
    });
    box.innerHTML = h;
    try { if (typeof _syncStopStrip === 'function') _syncStopStrip(); } catch(e) {}
  }

  // ★ (2026-10-08) 도시 사이 이동 — 일정에 넣은 이동 항목(기차·비행·차)을 먼저 쓰고, 없으면 거리로 추정.
  //   기차·차로 가는 긴 구간은 비행기로 가면 얼마나 걸리는지도 같이 (구글 항공편 검색 링크)
  var LEG_MODE = { train:['🚆','기차'], flight:['✈','비행기'], car:['🚗','차'], bus:['🚌','버스'], boat:['⛴','배'], metro:['🚇','지하철'] };
  function hmTxt(m) { m = Math.round(m / 5) * 5; return (Math.floor(m / 60) ? Math.floor(m / 60) + 'H ' : '') + (m % 60 ? (m % 60) + 'M' : ''); }
  function minsOf(a, b) { if (!a || !b) return 0; var p = a.split(':'), q = b.split(':'); var d = (+q[0] * 60 + +q[1]) - (+p[0] * 60 + +p[1]); return d > 0 ? d : 0; }
  function legHtml(a, b) {
    var jd = (typeof journeyData !== 'undefined' && journeyData) ? journeyData : [];
    var day = b.start_date || '';
    var best = null, sum = {};
    jd.forEach(function(d) {
      var t = d.tag || d.move;
      if (d.type !== '일정' || d.date !== day || !LEG_MODE[t] || t === 'metro' || !/→/.test(d.title || '')) return;
      sum[t] = (sum[t] || 0) + minsOf(d.time, d.end_time); // 같은 날 같은 수단은 합산 (드라이브 날)
    });
    Object.keys(sum).forEach(function(t) { if (!best || sum[t] > best.m) best = { t: t, m: sum[t] }; });
    var straight = (hasXY(a) && hasXY(b)) ? km(a, b) : 0;
    var mode, mins, dist = straight ? Math.round(straight * 1.25) : 0;
    if (best && best.m >= 30) { mode = best.t; mins = best.m; }
    else if (straight) {
      if (straight * 1.25 > 600) { mode = 'flight'; mins = straight / 750 * 60 + 35; dist = Math.round(straight); }
      else { mode = 'car'; mins = straight * 1.25 / 80 * 60; }
    }
    if (!mode) return '<div class="jv-leg" aria-hidden="true"><span>→</span></div>';
    var md = LEG_MODE[mode];
    var alt = '';
    if (mode !== 'flight' && straight > 280 && mins > 240) {
      var fm = straight / 750 * 60 + 35;
      var q = 'Flights from ' + (enOf(a.name) || a.name) + ' to ' + (enOf(b.name) || b.name) + (day ? ' on ' + day : '');
      alt = '<a class="jv-leg-alt" href="https://www.google.com/travel/flights?q=' + encodeURIComponent(q) + '" target="_blank" rel="noopener" onclick="event.stopPropagation()" title="비행기로 가면 · 구글 항공편 검색">✈ 비행 ≈' + hmTxt(fm) + '</a>';
    }
    return '<div class="jv-leg is-' + mode + '"><span>' +
      '<em>' + md[0] + ' ' + md[1] + '</em>' +
      '<b>' + (best ? '' : '≈') + hmTxt(mins) + '</b>' +
      (dist ? '<i>' + dist + ' KM</i>' : '') + alt +
    '</span></div>';
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
      var t = head.querySelector('.wk4-title');
      var city = (dm.filter(function(e){ return e.date === col.getAttribute('data-date'); })[0] || {}).cityName;
      if (t && city && !t.querySelector('.jv-cty')) { var ch = window.cityCountryHtml(city); if (ch) t.insertAdjacentHTML('afterbegin', ch); }
      try { addSun(head, col.getAttribute('data-date'), city); } catch(e) {}
      var s = document.createElement('span');
      s.className = 'jv-dno';
      s.textContent = String(n).padStart(2, '0');
      head.insertBefore(s, head.firstChild);
    });
  }
  // ── 일출·일몰 (위도·경도로 계산, 그 나라 시간으로 표시) ──
  var TZ = { DK:'Europe/Copenhagen', SE:'Europe/Stockholm', NO:'Europe/Oslo', FI:'Europe/Helsinki', FR:'Europe/Paris', BE:'Europe/Brussels', NL:'Europe/Amsterdam', DE:'Europe/Berlin',
    ES:'Europe/Madrid', PT:'Europe/Lisbon', IE:'Europe/Dublin', GB:'Europe/London', IT:'Europe/Rome', CZ:'Europe/Prague', AT:'Europe/Vienna', HR:'Europe/Zagreb', CH:'Europe/Zurich',
    CA:'America/Toronto', US:'America/New_York', JP:'Asia/Tokyo', KR:'Asia/Seoul' };
  function sunTimes(dateStr, lat, lng) {
    var r = Math.PI / 180, J = new Date(dateStr + 'T12:00:00Z') / 864e5 + 2440587.5;
    var n = Math.round(J - 2451545 + 0.0008), Js = n - lng / 360;
    var M = (357.5291 + 0.98560028 * Js) % 360;
    var C = 1.9148 * Math.sin(M * r) + 0.02 * Math.sin(2 * M * r) + 0.0003 * Math.sin(3 * M * r);
    var L = (M + C + 282.9372) % 360;
    var Jt = 2451545 + Js + 0.0053 * Math.sin(M * r) - 0.0069 * Math.sin(2 * L * r);
    var sd = Math.sin(L * r) * Math.sin(23.44 * r), cd = Math.cos(Math.asin(sd));
    var cw = (Math.sin(-0.833 * r) - Math.sin(lat * r) * sd) / (Math.cos(lat * r) * cd);
    if (cw < -1) return { always: true }; if (cw > 1) return { never: true };
    var w = Math.acos(cw) / r / 360, toD = function(j) { return new Date((j - 2440587.5) * 864e5); };
    return { rise: toD(Jt - w), set: toD(Jt + w) };
  }
  function cityLL(city) {
    var c = (typeof citiesData !== 'undefined' ? citiesData : []).filter(function(x) { return x.name === city && typeof x.lat === 'number'; })[0];
    return c ? [c.lat, c.lng] : null;
  }
  function hm(d, tz) { try { return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: tz }); } catch(e) { return d.toTimeString().slice(0, 5); } }
  function addSun(head, date, city) {
    if (!date || !city || head.querySelector('.jv-sun')) return;
    var ll = cityLL(city); if (!ll) return;
    var cc = (window.cityCountry(city) || {}).cc, tz = TZ[cc];
    var s = sunTimes(date, ll[0], ll[1]), txt;
    if (s.always) txt = '<span>백야 · 해가 안 짐</span>';
    else if (s.never) txt = '<span>극야</span>';
    else txt = '<span class="jv-sun-r">일출 <b>' + hm(s.rise, tz) + '</b></span><span class="jv-sun-s">일몰 <b>' + hm(s.set, tz) + '</b></span>';
    var eb = head.querySelector('.wk4-eyebrow');
    if (eb) eb.insertAdjacentHTML('beforeend', '<span class="jv-sun">' + txt + '</span>');
  }
  window.jvSunTimes = sunTimes;

  // ── 일정 줄 꾸미기: 이동·식사·선셋 태그, "한국어 (English)"의 영어는 옅게 ──
  var TAG = {
    train: ['🚆', '기차'], metro: ['🚇', '지하철·트램'], bus: ['🚌', '버스'], car: ['🚗', '드라이브'], walk: ['🚶', '걸어서'], flight: ['✈', '비행'], boat: ['⛴', '배'], cable: ['🚡', '케이블카'],
    breakfast: ['☕', 'BREAKFAST'], lunch: ['🍽', 'LUNCH'], dinner: ['🍷', 'DINNER'], cafe: ['☕', 'CAFÉ'], sunset: ['🌅', 'SUNSET'], sunrise: ['🌄', 'SUNRISE'], night: ['🌙', 'NIGHT']
  };
  var MOVES = { train:1, metro:1, bus:1, car:1, walk:1, flight:1, boat:1, cable:1 };
  function dur(a, b) {
    if (!a || !b) return '';
    var p = a.split(':'), q = b.split(':'), m = (+q[0] * 60 + +q[1]) - (+p[0] * 60 + +p[1]);
    if (!(m > 0)) return '';
    return m >= 60 ? Math.floor(m / 60) + '시간' + (m % 60 ? ' ' + (m % 60) + '분' : '') : m + '분';
  }
  function decorateSlots() {
    var grid = document.getElementById('journey-week-grid');
    if (!grid || typeof journeyData === 'undefined') return;
    var byId = {};
    journeyData.forEach(function(d) { if (d._id) byId[d._id] = d; });
    grid.querySelectorAll('.wk4-slot[data-jid]').forEach(function(el) {
      if (el.__jvd) return; el.__jvd = 1;
      var it = byId[el.getAttribute('data-jid')]; if (!it) return;
      var hl = el.querySelector('.wk4-hl');
      if (hl && !hl.querySelector('.jv-en')) hl.innerHTML = hl.innerHTML.replace(/\s*\(([^()]*[A-Za-zÀ-ÿ][^()]*)\)\s*$/, ' <span class="jv-en">$1</span>');
      var tag = it.tag || it.move; if (!tag || !TAG[tag]) return;
      var t = TAG[tag], isMove = !!MOVES[tag];
      el.classList.add(isMove ? 'jv-mv' : 'jv-tg', 'jv-tg-' + tag);
      var label = isMove ? t[1] + (dur(it.time, it.end_time) ? ' · ' + dur(it.time, it.end_time) : '') : t[1];
      var line = el.querySelector('.wk4-line');
      if (line) line.insertAdjacentHTML('afterbegin', '<span class="jv-pill"><i>' + t[0] + '</i>' + label + '</span>');
    });
  }
  // ★ (2026-10-08) 플랜 일정 좌표 채우기 — plans-v2-coords.js 표(날짜|제목 → 좌표)로 지도 핀이 바로 뜨게.
  //   화면용으로 먼저 채우고, 로그인 상태면 한 번만 Firestore에도 저장(다음부터는 표 없이도 핀).
  var _coordSaved = {};
  function fillPlanCoords() {
    var T = window.ATELIER_PLAN_COORDS; if (!T || typeof journeyData === 'undefined' || !journeyData) return;
    var loggedIn = false;
    try { loggedIn = !!(window.firebase && firebase.auth && firebase.auth().currentUser); } catch(e) {}
    journeyData.forEach(function(d) {
      if (d.type !== '일정' || typeof d.lat === 'number') return;
      var ll = T[d.date + '|' + d.title]; if (!ll) return;
      d.lat = ll[0]; d.lng = ll[1]; window.__jvCoordFilled = true;
      if (loggedIn && d._id && !_coordSaved[d._id] && typeof fbUpdate === 'function') {
        _coordSaved[d._id] = 1;
        fbUpdate('journey', d._id, { lat: ll[0], lng: ll[1] }).catch(function(e) { console.warn('[jv] coord save', e); });
      }
    });
  }
  window.jvFillPlanCoords = fillPlanCoords;
  function wrapBefore(name, before) {
    var orig = window[name];
    if (typeof orig !== 'function' || orig.__jvb) return;
    var w = function() { try { before(); } catch(e) {} return orig.apply(this, arguments); };
    w.__jvb = true; w.__jv = orig.__jv; window[name] = w;
  }
  function boot() {
    wrapBefore('renderWeekView', fillPlanCoords);
    wrapBefore('renderDayPinsMap', fillPlanCoords);
    wrap('renderWeekView', function() {
      decorateLog(); decorateSlots();
      if (window.__jvCoordFilled) { window.__jvCoordFilled = false; try { window.renderDayPinsMap && window.renderDayPinsMap(); } catch(e) {} }
    });
    wrap('renderTripHeader', renderAll);
    wrap('renderCityCards', function() { renderRoute(); renderMast(); });
    wrap('updateTravelMiniSummary', renderMast);
    renderAll();
    setInterval(renderNext, 60000);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
