// ════════════════════════════════════════════════════════════════════
// Atlas 페이지 — Travel 안 4번째 탭. stitch Travel Atlas 디자인 적용.
// 메인 dashboard: hero + 타임라인 + trip 카드 4개 + Ledger + PTO + Wishlist
// ════════════════════════════════════════════════════════════════════
(function() {
  'use strict';

  // helper: 날카로운 영어 라벨 + 보라톤 통일
  // stitch 색: primary #630ed4, accent-vivid #7C3AED, accent-deep var(--lavender-deep)

  function _esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function(c) {
      return ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]);
    });
  }

  // ════════════════════════════════════════════════════════════
  // Trip 이미지 (도시 hero / 노마드 phase 동일 패턴)
  // — LS: atelier_atlas_trip_img_{tripId}
  // — Firestore: atlasTripImages/{tripId} = { image, updatedAt }
  // ════════════════════════════════════════════════════════════
  var _tripImages = {};
  var _tripImagesHydrated = false;
  var _activeTripId = null; // 호버 중인 trip (Ctrl+V 대상)

  function _atlasGetImageLS(tripId) {
    try { return localStorage.getItem('atelier_atlas_trip_img_' + tripId) || null; }
    catch(e) { return null; }
  }
  function _atlasSetImageLS(tripId, dataUrl) {
    try {
      if (dataUrl) localStorage.setItem('atelier_atlas_trip_img_' + tripId, dataUrl);
      else localStorage.removeItem('atelier_atlas_trip_img_' + tripId);
    } catch(e) {}
  }
  function _atlasHydrateImagesFromLS() {
    if (_tripImagesHydrated) return;
    var DATA = window.ATLAS_DATA;
    if (!DATA) return;
    (DATA.TRIPS || []).forEach(function(tr) {
      var cached = _atlasGetImageLS(tr.id);
      if (cached) _tripImages[tr.id] = cached;
    });
    _tripImagesHydrated = true;
  }
  function _atlasLoadImageFB(tripId) {
    if (typeof db === 'undefined' || !db) return Promise.resolve(null);
    return db.collection('atlasTripImages').doc(tripId).get().then(function(doc) {
      if (doc.exists) return doc.data().image || null;
      return null;
    }).catch(function(e) { console.warn('[atlas-img] FB load failed', e); return null; });
  }
  function _atlasSaveImageFB(tripId, dataUrl) {
    if (typeof db === 'undefined' || !db) return Promise.resolve();
    return db.collection('atlasTripImages').doc(tripId).set({
      image: dataUrl,
      updatedAt: Date.now()
    }).catch(function(e) { console.warn('[atlas-img] FB save failed', e); });
  }
  function _atlasDeleteImageFB(tripId) {
    if (typeof db === 'undefined' || !db) return Promise.resolve();
    return db.collection('atlasTripImages').doc(tripId).delete()
      .catch(function(e) { console.warn('[atlas-img] FB delete failed', e); });
  }

  // 이미지 리사이즈 (도시 hero 동일)
  function _atlasProcessImage(fileOrBlob) {
    return new Promise(function(resolve, reject) {
      var reader = new FileReader();
      reader.onload = function(e) {
        var img = new Image();
        img.onload = function() {
          var maxW = 1600;
          var w = img.width, h = img.height;
          if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
          var canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          var ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          var dataUrl = canvas.toDataURL('image/jpeg', 0.82);
          if (dataUrl.length > 900000) dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve(dataUrl);
        };
        img.onerror = function() { reject(new Error('이미지 디코딩 실패')); };
        img.src = e.target.result;
      };
      reader.onerror = function() { reject(new Error('파일 읽기 실패')); };
      reader.readAsDataURL(fileOrBlob);
    });
  }

  function _atlasApplyImage(tripId, dataUrl) {
    _tripImages[tripId] = dataUrl || null;
    _atlasSetImageLS(tripId, dataUrl);
    // dashboard에서만 재렌더 (trip 디테일 페이지가 활성이면 안 건드림)
    if (_currentTripView !== tripId) {
      var atlasSection = document.getElementById('travel-atlas-section');
      if (atlasSection && (!_currentTripView || _currentTripView === 'dashboard')) {
        atlasSection.innerHTML = renderAtlas();
        setTimeout(function(){ if(window.atlasMarkTracked) window.atlasMarkTracked(); }, 100);
      }
    } else {
      // 디테일 페이지가 활성이면 그 페이지 재렌더 (hero 이미지)
      var atlasSection2 = document.getElementById('travel-atlas-section');
      if (atlasSection2) atlasSection2.innerHTML = renderTripDetail(tripId);
    }
    if (typeof showSyncToast === 'function') {
      showSyncToast(dataUrl ? '🖼 Trip 이미지 저장됨' : '🗑 Trip 이미지 삭제됨');
    }
    if (dataUrl) _atlasSaveImageFB(tripId, dataUrl);
    else _atlasDeleteImageFB(tripId);
  }

  function tripImageUpload(tripId) {
    var input = document.getElementById('atlas-trip-file-' + tripId);
    if (input) input.click();
  }
  function tripImageFileSelected(e, tripId) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!file.type || file.type.indexOf('image/') !== 0) {
      if (typeof showSyncToast === 'function') showSyncToast('이미지 파일만 받을 수 있어요');
      return;
    }
    _atlasProcessImage(file).then(function(dataUrl) {
      _atlasApplyImage(tripId, dataUrl);
    }).catch(function(err) {
      console.error('[atlas-img] upload failed', err);
      if (typeof showSyncToast === 'function') showSyncToast('이미지 처리 실패');
    });
    e.target.value = '';
  }
  function tripImageDelete(tripId) {
    if (!confirm('Trip 이미지를 삭제할까요?')) return;
    _atlasApplyImage(tripId, null);
  }
  function _setActiveTrip(tripId) { _activeTripId = tripId; }
  function _clearActiveTrip(tripId) {
    if (_activeTripId === tripId) _activeTripId = null;
  }
  window.atlasTripImageUpload = tripImageUpload;
  window.atlasTripImageFileSelected = tripImageFileSelected;
  window.atlasTripImageDelete = tripImageDelete;
  window.atlasSetActiveTrip = _setActiveTrip;
  window.atlasClearActiveTrip = _clearActiveTrip;

  // paste 핸들러 (atlas 활성 시 호버 trip에 적용)
  function _atlasPasteHandler(e) {
    var ae = document.activeElement;
    if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.isContentEditable)) return;
    var atlasSection = document.getElementById('travel-atlas-section');
    if (!atlasSection || atlasSection.style.display === 'none') return;
    if (!_activeTripId) return;
    var items = (e.clipboardData || {}).items || [];
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      if (it.kind === 'file' && it.type && it.type.indexOf('image/') === 0) {
        e.preventDefault();
        var blob = it.getAsFile();
        if (!blob) return;
        var target = _activeTripId;
        _atlasProcessImage(blob).then(function(dataUrl) {
          _atlasApplyImage(target, dataUrl);
        }).catch(function(err) {
          console.error('[atlas-img] paste failed', err);
          if (typeof showSyncToast === 'function') showSyncToast('이미지 처리 실패');
        });
        return;
      }
    }
  }
  var _atlasPasteRegistered = false;
  function _atlasRegisterPaste() {
    if (_atlasPasteRegistered) return;
    document.addEventListener('paste', _atlasPasteHandler);
    _atlasPasteRegistered = true;
  }

  // backward Firestore fetch (백그라운드)
  function _atlasActivateImages() {
    _atlasHydrateImagesFromLS();
    _atlasRegisterPaste();
    var DATA = window.ATLAS_DATA;
    if (!DATA) return;
    (DATA.TRIPS || []).forEach(function(tr) {
      _atlasLoadImageFB(tr.id).then(function(remote) {
        if (!remote) return;
        if (_tripImages[tr.id] === remote) return;
        _tripImages[tr.id] = remote;
        _atlasSetImageLS(tr.id, remote);
        // dashboard 재렌더 (활성 시)
        var atlasSection = document.getElementById('travel-atlas-section');
        if (atlasSection && atlasSection.style.display !== 'none' &&
            (!_currentTripView || _currentTripView === 'dashboard')) {
          atlasSection.innerHTML = renderAtlas();
        setTimeout(function(){ if(window.atlasMarkTracked) window.atlasMarkTracked(); }, 100);
        }
      });
    });
  }

  function renderAtlas() {
    var DATA = window.ATLAS_DATA || { TRIPS: [], WISHLIST: [], totals: function(){ return { trips:0,days:0,pto:0,gross:0,own:0,countries:0 }; } };
    var trips = DATA.TRIPS || [];
    var wish = DATA.WISHLIST || [];
    var t = DATA.totals();

    var html = '';

    // ──────── ATLAS 자체 탭바 (외부 탭바와 동일 디자인, atlas active) ────────
    // ★ (2026-07-22) 공용 탭바 사용 — 4개 탭 디자인/위치 통일
    html += (window._travelTabsHtml ? window._travelTabsHtml('atlas') : '');

    // ──────── HERO ────────
    // ★ (2026-07-24) 일정·스팟·항공·예산·체크리스트와 같은 .trav-hero로 통일.
    //   제목이 <br>로 2줄이라 다른 탭보다 헤더가 유독 높았음 → 한 줄로.
    html += '<header class="trav-hero">';
    html += '<div>';
    html += '<p class="trav-eyebrow">Travel &middot; Almanac</p>';
    html += '<h1 class="trav-title">The Atlas <span class="amp">&amp;</span> Almanac</h1>';
    html += '<p class="trav-sub">먼 미래의 여행을 미리 그려보는 페이지. 일정·예산·PTO는 러프하게, 그래도 다 적혀있게.</p>';
    html += '</div>';
    html += '<div class="trav-hero-right">';
    html += _heroStat('Year Range', '2027—2028');
    html += _heroStat('Total Volume', t.trips + ' Major Trips');
    html += _heroStat('Duration', t.days + ' Global Days');
    html += _heroStat('Countries', String(t.countries));
    html += _heroStat('PTO Days', String(t.pto));
    html += '</div>';
    html += '</header>';

    // ──────── HORIZONTAL TIMELINE (연도별 그룹) ────────
    var byYear = _groupByYear(trips);
    html += '<section class="atlas-section atlas-timeline-section">';
    html += '<div class="atlas-timeline-grid">';
    html += '<div class="atlas-timeline-meta">';
    html += '<h2 class="atlas-h2">The Sequence</h2>';
    html += '<p class="atlas-meta-sub">Chronological progression of expeditions.</p>';
    html += '</div>';
    html += '<div class="atlas-timeline-yearwrap">';
    byYear.forEach(function(group, gi) {
      html += '<div class="atlas-timeline-year">';
      html += '<div class="atlas-tl-year-label">' + group.year + '</div>';
      html += '<div class="atlas-timeline-line">';
      group.trips.forEach(function(tr, i) {
        html += '<div class="atlas-tl-node' + (tr.isCurrent ? ' is-current' : '') + '">';
        html += '<span class="atlas-tl-dot"></span>';
        html += '<div>';
        html += '<p class="atlas-tl-when">' + _esc(tr.monthShort || tr.month) + ' · <span class="nm-emoji">' + tr.flags + '</span> ' + _esc(tr.country) + '</p>';
        html += '<p class="atlas-tl-title">' + _esc(tr.title.replace(/^The\s+/, '')) + '</p>';
        html += '</div>';
        html += '</div>';
        if (i < group.trips.length - 1) html += '<span class="atlas-tl-arrow">→</span>';
      });
      html += '</div>';
      html += '</div>';
      if (gi < byYear.length - 1) html += '<div class="atlas-tl-year-divider"></div>';
    });
    html += '</div>';
    html += '</div>';
    html += '</section>';

    // ──────── TRIP GALLERY (연도별 그룹) ────────
    html += '<section class="atlas-section atlas-gallery-section">';
    byYear.forEach(function(group) {
      html += '<div class="atlas-gallery-year">';
      html += '<div class="atlas-gallery-year-head">';
      html += '<span class="atlas-gallery-year-label">' + group.year + '</span>';
      html += '<span class="atlas-gallery-year-meta">' + group.trips.length + ' Trips · ' + group.days + ' Days · ₩' + group.gross + ' 만 · ' + group.pto + ' PTO</span>';
      html += '</div>';
      html += '<div class="atlas-gallery">';
      group.trips.forEach(function(tr) {
        var img = _tripImages[tr.id] || null;
        html += '<div class="atlas-trip-card" ' +
          'onmouseenter="atlasSetActiveTrip(\'' + tr.id + '\')" ' +
          'onmouseleave="atlasClearActiveTrip(\'' + tr.id + '\')">';
        html += '<div class="atlas-trip-img" style="background:' + tr.gradient + '" onclick="window.atlasOpenTrip && atlasOpenTrip(\'' + tr.id + '\')">';
        if (img) {
          html += '<img class="atlas-trip-img-src" src="' + img + '" alt="">';
        }
        html += '<div class="atlas-trip-code">' + _esc(tr.countryCodes) + '</div>';
        html += '<div class="atlas-trip-flags nm-emoji">' + tr.flags + '</div>';
        // 이미지 컨트롤 (호버 시 표시 + 빈 박스는 항상 표시)
        html += '<input type="file" id="atlas-trip-file-' + tr.id + '" accept="image/*" style="display:none" onchange="atlasTripImageFileSelected(event,\'' + tr.id + '\')">';
        html += '<div class="atlas-trip-img-controls' + (img ? '' : ' is-empty') + '" onclick="event.stopPropagation()">';
        if (img) {
          html += '<button class="atlas-trip-img-ctrl" onclick="atlasTripImageUpload(\'' + tr.id + '\')" title="이미지 변경"><span class="material-symbols-outlined">edit</span>변경</button>';
          html += '<button class="atlas-trip-img-ctrl" onclick="atlasTripImageDelete(\'' + tr.id + '\')" title="이미지 삭제"><span class="material-symbols-outlined">delete</span></button>';
        } else {
          html += '<button class="atlas-trip-img-ctrl" onclick="atlasTripImageUpload(\'' + tr.id + '\')"><span class="material-symbols-outlined">add_photo_alternate</span>이미지 추가</button>';
        }
        html += '</div>';
        html += '<div class="atlas-trip-paste-hint">Ctrl+V로 붙여넣기</div>';
        html += '</div>';
        // 카드 본문
        html += '<div class="atlas-trip-body" onclick="window.atlasOpenTrip && atlasOpenTrip(\'' + tr.id + '\')">';
        html += '<div class="atlas-trip-country"><span class="nm-emoji">' + tr.flags + '</span> ' + _esc(tr.country) + '</div>';
        html += '<h3 class="atlas-trip-title">' + _esc(tr.cities) + '</h3>';
        html += '<div class="atlas-trip-row"><span class="atlas-trip-k">DATES</span><span class="atlas-trip-v">' + _esc(tr.dates) + '</span></div>';
        html += '<div class="atlas-trip-row"><span class="atlas-trip-k">STAY</span><span class="atlas-trip-v">' + tr.days + ' Days · ' + tr.nights + ' Nights</span></div>';
        html += '<p class="atlas-trip-route">' + _esc((tr.route || []).slice(0, 3).join(' → ')) + '</p>';
        html += '</div>';
        // ★ (2026-07-24) 항공권 추적 버튼 — 이 여행을 항공 탭 관심 노선으로 등록
        var fm = (window.ATLAS_DATA && window.ATLAS_DATA.FLIGHT_MAP) ? window.ATLAS_DATA.FLIGHT_MAP[tr.id] : null;
        if (fm) {
          html += '<button class="atlas-track-btn" data-track="' + tr.id + '" ' +
            'onclick="event.stopPropagation();atlasTrackFlight(\'' + tr.id + '\')">' +
            '<span class="material-symbols-outlined">flight_takeoff</span>' +
            '<span class="atlas-track-label">항공권 추적</span></button>';
        }
        html += '</div>';
      });
      html += '</div>';
      html += '</div>';
    });
    html += '</section>';

    // ──────── LEDGER + PTO TRACKER (2-col) ────────
    html += '<section class="atlas-section atlas-ledger-section">';
    html += '<div class="atlas-ledger-grid">';
    // Ledger (연도별 그룹 + subtotal)
    html += '<div class="atlas-ledger">';
    html += '<h4 class="atlas-h4">Travel Investment Ledger</h4>';
    html += '<div class="atlas-ledger-rows">';
    byYear.forEach(function(group, gi) {
      html += '<div class="atlas-ledger-year-label">' + group.year + '</div>';
      group.trips.forEach(function(tr) {
        html += '<div class="atlas-ledger-row">';
        html += '<div class="atlas-ledger-name-wrap">';
        html += '<span class="atlas-ledger-country"><span class="nm-emoji">' + tr.flags + '</span> ' + _esc(tr.country) + '</span>';
        html += '<span class="atlas-ledger-name">' + _esc(tr.title) + '</span>';
        html += '</div>';
        html += '<span class="atlas-ledger-amt">₩' + tr.gross + ' 만</span>';
        html += '</div>';
      });
      html += '<div class="atlas-ledger-subtotal">';
      html += '<span class="atlas-ledger-subtotal-l">' + group.year + ' Subtotal</span>';
      html += '<span class="atlas-ledger-subtotal-v">₩' + group.gross + ' 만</span>';
      html += '</div>';
    });
    html += '<div class="atlas-ledger-total">';
    html += '<span class="atlas-ledger-total-l">Gross Total</span>';
    html += '<span class="atlas-ledger-total-v">₩' + t.gross + ' 만</span>';
    html += '</div>';
    html += '<div class="atlas-ledger-net">';
    html += '<span class="atlas-ledger-net-l">Own Funds</span>';
    html += '<span class="atlas-ledger-net-v">₩' + t.own + ' 만</span>';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    // PTO Tracker
    html += '<div class="atlas-pto">';
    html += '<h4 class="atlas-h4 atlas-h4-light">PTO Efficiency Tracker</h4>';
    html += '<div class="atlas-pto-big">' + t.pto + '<span class="atlas-pto-big-l">Days Total Used</span></div>';
    html += '<p class="atlas-pto-desc">전략적 공휴일 정렬로 ' + t.pto + ' PTO만으로 ' + t.days + '일 여행 확보.</p>';
    html += '<div class="atlas-pto-list">';
    trips.forEach(function(tr) {
      var pct = Math.round((tr.ptoDays / Math.max(t.pto, 1)) * 100);
      html += '<div class="atlas-pto-row">';
      html += '<span class="atlas-pto-row-l">' + _esc(tr.title.replace(/^The\s+/, '')) + ': ' + tr.ptoDays + 'd</span>';
      html += '<span class="atlas-pto-row-bar"><span style="width:' + pct + '%"></span></span>';
      html += '</div>';
    });
    html += '</div>';
    html += '</div>';
    html += '</div>';
    html += '</section>';

    // ──────── WISHLIST ────────
    html += '<section class="atlas-section atlas-wishlist-section">';
    html += '<h2 class="atlas-h2 atlas-h2-border">Future Iterations — The Wishlist</h2>';
    html += '<div class="atlas-wish-grid">';
    wish.forEach(function(w) {
      html += '<div class="atlas-wish-cell">';
      html += '<span class="atlas-wish-no">' + _esc(w.no) + '</span>';
      html += '<div class="atlas-wish-flag">' + w.flag + '</div>';
      html += '<span class="atlas-wish-name">' + _esc(w.name) + '</span>';
      html += '<p class="atlas-wish-note">' + _esc(w.note) + '</p>';
      html += '</div>';
    });
    html += '</div>';
    html += '</section>';

    return html;
  }

  function _heroStat(label, value) {
    return '<div class="trav-stat">' +
      '<span class="trav-stat-l">' + _esc(label) + '</span>' +
      '<span class="trav-stat-v">' + _esc(value) + '</span>' +
    '</div>';
  }

  // trips를 year별로 그룹화 + 연도별 집계
  function _groupByYear(trips) {
    var groups = {};
    var order = [];
    trips.forEach(function(tr) {
      var y = tr.year || 0;
      if (!groups[y]) {
        groups[y] = { year: y, trips: [], days: 0, gross: 0, own: 0, pto: 0 };
        order.push(y);
      }
      groups[y].trips.push(tr);
      groups[y].days += tr.days || 0;
      groups[y].gross += tr.gross || 0;
      groups[y].own += tr.own || 0;
      groups[y].pto += tr.ptoDays || 0;
    });
    order.sort();
    return order.map(function(y) { return groups[y]; });
  }

  // ──────── Trip 디테일 페이지 (stitch Master Itinerary Eastern Canada) ────────
  function renderTripDetail(tripId) {
    var DATA = window.ATLAS_DATA;
    if (!DATA) return '';
    var trip = DATA.findTrip(tripId);
    if (!trip) return '<p style="padding:40px">Trip not found: ' + _esc(tripId) + '</p>';

    var html = '';

    // 자체 탭바 (atlas active)
    // ★ (2026-07-22) 공용 탭바 + 뒤로가기
    html += '<div class="flex items-center justify-between flex-wrap gap-3" style="border-bottom:1px solid #e2e8f0">';
    html += (window._travelTabsHtml ? window._travelTabsHtml('atlas').replace('class="trav-tabs"', 'class="trav-tabs" style="border-bottom:none;flex:1"') : '');
    html += '<button onclick="atlasBackToAtlas()" class="atlas-back-btn"><span class="material-symbols-outlined" style="font-size: var(--font-size-h2)">arrow_back</span>Atlas로 돌아가기</button>';
    html += '</div>';

    // Hero — 잡지 스타일: 풀와이드 이미지(아래로 fade) + 그 아래 텍스트 블록
    var heroImg = _tripImages[trip.id] || null;
    html += '<section class="atlas-trip-hero atlas-trip-hero-bleed" style="background:' + trip.gradient + '"' +
      ' onmouseenter="atlasSetActiveTrip(\'' + trip.id + '\')"' +
      ' onmouseleave="atlasClearActiveTrip(\'' + trip.id + '\')">';
    if (heroImg) {
      html += '<img class="atlas-trip-hero-img" src="' + heroImg + '" alt="">';
    }
    html += '<input type="file" id="atlas-trip-file-' + trip.id + '" accept="image/*" style="display:none" onchange="atlasTripImageFileSelected(event,\'' + trip.id + '\')">';
    html += '<div class="atlas-trip-img-controls' + (heroImg ? '' : ' is-empty') + '">';
    if (heroImg) {
      html += '<button class="atlas-trip-img-ctrl" onclick="atlasTripImageUpload(\'' + trip.id + '\')" title="이미지 변경"><span class="material-symbols-outlined">edit</span>변경</button>';
      html += '<button class="atlas-trip-img-ctrl" onclick="atlasTripImageDelete(\'' + trip.id + '\')" title="이미지 삭제"><span class="material-symbols-outlined">delete</span></button>';
    } else {
      html += '<button class="atlas-trip-img-ctrl" onclick="atlasTripImageUpload(\'' + trip.id + '\')"><span class="material-symbols-outlined">add_photo_alternate</span>이미지 추가</button>';
    }
    html += '</div>';
    html += '<div class="atlas-trip-paste-hint">Ctrl+V로 붙여넣기</div>';
    html += '<div class="atlas-trip-hero-fade"></div>';
    html += '</section>';
    // Hero text block (이미지 밖)
    html += '<div class="atlas-trip-hero-text">';
    html += '<div class="atlas-trip-hero-meta">';
    html += '<span class="atlas-trip-hero-flag">' + trip.flags + '</span>';
    html += '<span class="atlas-trip-hero-pill">№ ' + trip.no + ' — ' + _esc(trip.month) + '</span>';
    html += '</div>';
    html += '<h1 class="atlas-trip-hero-h1">' + _esc(trip.title) + '</h1>';
    html += '<p class="atlas-trip-hero-sub">' + _esc(trip.dates) + ' • ' + trip.nights + '박 · ' + trip.days + '일</p>';
    html += '<div class="atlas-trip-hero-route">';
    html += '<span class="atlas-trip-hero-route-tag">루트:</span> ';
    var routeArr = trip.route || [];
    routeArr.forEach(function(city, i) {
      html += '<span>' + _esc(city) + '</span>';
      if (i < routeArr.length - 1) html += ' <span class="atlas-arrow">→</span> ';
    });
    html += '</div>';
    html += '</div>';

    // Body: 8/4 split (itinerary + sidebar)
    html += '<div class="atlas-trip-body">';

    // ── LEFT (8): Daily Narrative ──
    html += '<div class="atlas-trip-main">';
    html += '<div class="atlas-trip-main-head">';
    html += '<h2 class="atlas-trip-h2">일자별 일정</h2>';
    html += '<span class="atlas-trip-meta-r">' + trip.days + '일 / ' + trip.nights + '박</span>';
    html += '</div>';
    html += '<div class="atlas-day-list">';
    (trip.itinerary || []).forEach(function(d, i) {
      var isFirst = (i === 0);
      var isLast = (i === (trip.itinerary || []).length - 1);
      var dotClass = (isFirst || isLast) ? 'atlas-day-dot atlas-day-dot-solid' : 'atlas-day-dot';
      html += '<div class="atlas-day-node">';
      html += '<div class="atlas-day-line">';
      html += '<span class="' + dotClass + '"></span>';
      html += '</div>';
      html += '<div class="atlas-day-content">';
      html += '<div class="atlas-day-head">';
      html += '<h3 class="atlas-day-h3' + (d.hol ? ' atlas-day-h3-hol' : '') + '">' + _esc(d.date) + ' • ' + _renderActivityTitle(d.activity) + '</h3>';
      html += '<span class="atlas-day-dow">' + _esc(d.dow) + ' • ' + _pad(i + 1) + '일차</span>';
      html += '</div>';
      html += '<p class="atlas-day-act">' + (d.activity || '') + '</p>';
      html += '<div class="atlas-day-stay"><span class="material-symbols-outlined" style="font-size: var(--font-size-body)">' + _stayIcon(d.stay) + '</span>숙박: ' + _esc(d.stay) + '</div>';
      html += '</div>';
      html += '</div>';
    });
    html += '</div>';
    html += '</div>';

    // ── RIGHT (4): Sidebar ──
    html += '<aside class="atlas-trip-aside">';

    // Curated Lodging
    html += '<div class="atlas-side-card">';
    html += '<h4 class="atlas-side-h">숙소 정보</h4>';
    html += '<ul class="atlas-lodge-list">';
    (trip.lodging || []).forEach(function(l) {
      html += '<li class="atlas-lodge-row">';
      html += '<div>';
      html += '<p class="atlas-lodge-name">' + _esc(l.name) + (l.nights > 1 ? ' <span class="atlas-lodge-nights">×' + l.nights + '</span>' : '') + '</p>';
      html += '<p class="atlas-lodge-type">' + _esc(l.type) + '</p>';
      html += '</div>';
      html += '<span class="atlas-lodge-price">' + _esc(l.price) + '</span>';
      html += '</li>';
    });
    html += '</ul>';
    html += '<div class="atlas-lodge-total">';
    html += '<span>합계</span><span class="atlas-lodge-total-v">' + _esc(trip.lodgingTotal || '—') + '</span>';
    html += '</div>';
    html += '</div>';

    // Financial Ledger (연한 보라 카드)
    var dailyBudget = trip.days > 0 ? Math.round((trip.own || 0) / trip.days * 10) / 10 : 0;
    html += '<div class="atlas-ledger-card">';
    html += '<div class="atlas-ledger-card-deco"><span class="material-symbols-outlined">account_balance_wallet</span></div>';
    html += '<h4 class="atlas-ledger-card-h">예산</h4>';
    // 하루 예산 + 총액 상단 강조
    html += '<div class="atlas-ledger-card-daily">';
    html += '<div class="atlas-ledger-card-daily-cell">';
    html += '<p class="atlas-ledger-card-daily-l">하루 예산</p>';
    html += '<p class="atlas-ledger-card-daily-v">₩' + dailyBudget + ' 만</p>';
    html += '<p class="atlas-ledger-card-daily-sub">/ day</p>';
    html += '</div>';
    html += '<div class="atlas-ledger-card-daily-cell">';
    html += '<p class="atlas-ledger-card-daily-l">총액</p>';
    html += '<p class="atlas-ledger-card-daily-v">₩' + trip.own + ' 만</p>';
    html += '<p class="atlas-ledger-card-daily-sub">' + trip.days + ' days</p>';
    html += '</div>';
    html += '</div>';
    html += '<div class="atlas-ledger-card-rows">';
    (trip.budget || []).forEach(function(b) {
      html += '<div class="atlas-ledger-card-row">';
      html += '<span class="atlas-ledger-card-l">' + _esc(b.label) + (b.note ? '<span class="atlas-ledger-card-note">' + _esc(b.note) + '</span>' : '') + '</span>';
      html += '<span class="atlas-ledger-card-v">' + b.amount + ' 만</span>';
      html += '</div>';
    });
    html += '</div>';
    var grossLabel = trip.paired ? '솔로 시 (최악)' : '총 비용';
    html += '<div class="atlas-ledger-card-divider"></div>';
    html += '<div class="atlas-ledger-card-gross">';
    html += '<span>' + grossLabel + '</span>';
    html += '<span class="atlas-ledger-card-gross-v">' + trip.gross + ' 만원</span>';
    html += '</div>';
    if (trip.subsidies && trip.subsidies.length) {
      html += '<div class="atlas-ledger-card-subsidies">';
      trip.subsidies.forEach(function(s) {
        html += '<div class="atlas-ledger-card-subsidy"><span>' + _esc(s.label) + '</span><span>' + (s.value > 0 ? '+' : '−') + Math.abs(s.value) + ' 만</span></div>';
      });
      html += '</div>';
    } else if (trip.subsidy && trip.subsidy !== 0) {
      html += '<div class="atlas-ledger-card-subsidies">';
      var subLabel = trip.paired ? '페어 share (÷2)' : '보조금';
      html += '<div class="atlas-ledger-card-subsidy"><span>' + subLabel + '</span><span>−' + Math.abs(trip.subsidy) + ' 만</span></div>';
      html += '</div>';
    }
    html += '<div class="atlas-ledger-card-divider"></div>';
    var ownLabel = trip.paired ? '실 부담 (페어)' : '실 부담';
    html += '<div class="atlas-ledger-card-net">';
    html += '<span class="atlas-ledger-card-net-l">' + ownLabel + '</span>';
    html += '<span class="atlas-ledger-card-net-v">' + trip.own + ' 만원</span>';
    html += '</div>';
    html += '</div>';

    // Leave Efficiency
    html += '<div class="atlas-pto-card">';
    html += '<div class="atlas-pto-card-head"><span class="material-symbols-outlined">event_available</span><h4>휴가</h4></div>';
    html += '<div class="atlas-pto-card-grid">';
    html += '<div class="atlas-pto-card-cell"><div class="atlas-pto-card-num">' + _pad(trip.ptoDays || 0) + '</div><div class="atlas-pto-card-l">PTO 일수</div></div>';
    if (trip.corpLeaveDays) {
      html += '<div class="atlas-pto-card-cell"><div class="atlas-pto-card-num">' + _pad(trip.corpLeaveDays) + '</div><div class="atlas-pto-card-l">회사 휴가</div></div>';
    } else {
      html += '<div class="atlas-pto-card-cell"><div class="atlas-pto-card-num">' + _pad(trip.holidayDays || 0) + '</div><div class="atlas-pto-card-l">공휴일</div></div>';
    }
    html += '</div>';
    html += '<p class="atlas-pto-card-note">' + _esc(trip.ptoNote || '') + '</p>';
    html += '</div>';

    // Trip Note (optional)
    if (trip.note) {
      html += '<div class="atlas-trip-note">';
      html += '<p><span class="atlas-trip-note-l">메모:</span> ' + _esc(trip.note) + '</p>';
      html += '</div>';
    }

    html += '</aside>'; // /sidebar
    html += '</div>';   // /trip-body

    return html;
  }

  function _renderActivityTitle(act) {
    // 첫 문장에서 핵심 단어 추출 (예: "ICN → Montréal direct on Air Canada/Korean Air." → "ICN → Montréal direct")
    if (!act) return '';
    // 첫 마침표/물음표/느낌표 전까지
    var clean = act.replace(/<[^>]*>/g, '');
    var m = clean.match(/^[^.!?]+/);
    var t = (m ? m[0] : clean).trim();
    if (t.length > 50) t = t.slice(0, 50) + '…';
    return _esc(t);
  }

  function _stayIcon(stay) {
    var s = (stay || '').toLowerCase();
    if (s.indexOf('flight') >= 0) return 'flight_takeoff';
    if (s.indexOf('home') >= 0) return 'home';
    return 'hotel';
  }

  function _pad(n) { return String(n).padStart(2, '0'); }

  // ──────── 라우팅 ────────
  var _currentTripView = null; // null | 'dashboard' | <tripId>

  function atlasOpenTrip(tripId) {
    var atlasSection = document.getElementById('travel-atlas-section');
    if (!atlasSection) return;
    _currentTripView = tripId;
    atlasSection.innerHTML = renderTripDetail(tripId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    var titleEl = document.getElementById('page-title');
    if (titleEl) {
      var trip = window.ATLAS_DATA && window.ATLAS_DATA.findTrip(tripId);
      titleEl.textContent = 'Travel · Atlas · ' + (trip ? trip.title : tripId);
    }
  }
  function atlasBackToAtlas() {
    var atlasSection = document.getElementById('travel-atlas-section');
    if (!atlasSection) return;
    _currentTripView = 'dashboard';
    atlasSection.innerHTML = renderAtlas();
        setTimeout(function(){ if(window.atlasMarkTracked) window.atlasMarkTracked(); }, 100);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    var titleEl = document.getElementById('page-title');
    if (titleEl) titleEl.textContent = 'Travel · Atlas';
  }
  window.atlasOpenTrip = atlasOpenTrip;

  // ★ (2026-07-24) Atlas 여행 → 항공 탭 관심 노선 등록/해제.
  //   이미 있으면 해당 여행의 추적 달을 병합, 없으면 새로 만든다. 토글식(있으면 알림).
  window.atlasTrackFlight = async function(tripId) {
    var trip = window.ATLAS_DATA && window.ATLAS_DATA.findTrip(tripId);
    var fm = window.ATLAS_DATA && window.ATLAS_DATA.FLIGHT_MAP && window.ATLAS_DATA.FLIGHT_MAP[tripId];
    if (!trip || !fm) return;
    var btn = document.querySelector('[data-track="' + tripId + '"]');
    if (btn) { btn.disabled = true; btn.querySelector('.atlas-track-label').textContent = '등록 중…'; }
    try {
      var snap = await db.collection('flight_watch').where('type', '==', 'watch')
        .where('route_to', '==', fm.to).get();
      var existing = null;
      snap.forEach(function(d){ var x = d.data(); if (x.route_from === 'ICN') existing = { id: d.id, tm: x.target_months || [] }; });
      var memo = '✈️ ' + (trip.name || trip.title || '') + ' · ' + fm.city;
      if (existing) {
        var merged = [];
        (existing.tm || []).concat(fm.months).forEach(function(m){ if (merged.indexOf(m) < 0) merged.push(m); });
        merged.sort();
        await db.collection('flight_watch').doc(existing.id).update({ target_months: merged, memo: memo, atlas_trip: trip.name || '' });
      } else {
        await db.collection('flight_watch').add({ type: 'watch', route_from: 'ICN', route_to: fm.to,
          depart_date: '', return_date: '', target_months: fm.months.slice(), memo: memo,
          atlas_trip: trip.name || '', created_at: new Date().toISOString() });
      }
      if (btn) {
        btn.classList.add('is-done');
        btn.querySelector('.atlas-track-label').textContent = '추적 중 ✓';
        var ic = btn.querySelector('.material-symbols-outlined'); if (ic) ic.textContent = 'check_circle';
      }
      if (typeof showSyncToast === 'function') showSyncToast('✈️ ' + fm.city + ' 항공권 추적 시작 (' + fm.months.join(', ') + ')');
    } catch(e) {
      if (btn) { btn.disabled = false; btn.querySelector('.atlas-track-label').textContent = '항공권 추적'; }
      alert('등록 실패: ' + e.message);
    }
  };
  // 렌더 후 이미 추적 중인 여행은 버튼을 '추적 중'으로 표시
  window.atlasMarkTracked = async function() {
    try {
      var snap = await db.collection('flight_watch').where('type', '==', 'watch').get();
      var tracked = {};
      snap.forEach(function(d){ var x = d.data(); if (x.route_to && (x.target_months||[]).length) tracked[x.route_to] = 1; });
      var fmAll = (window.ATLAS_DATA && window.ATLAS_DATA.FLIGHT_MAP) || {};
      Object.keys(fmAll).forEach(function(tid){
        if (tracked[fmAll[tid].to]) {
          var btn = document.querySelector('[data-track="' + tid + '"]');
          if (btn) { btn.classList.add('is-done'); var l = btn.querySelector('.atlas-track-label'); if (l) l.textContent = '추적 중 ✓';
            var ic = btn.querySelector('.material-symbols-outlined'); if (ic) ic.textContent = 'check_circle'; }
        }
      });
    } catch(e) {}
  };
  window.atlasBackToAtlas = atlasBackToAtlas;

  // Atlas 탭 표시 (journey 페이지 안에서 호출)
  function showAtlasView() {
    var atlasSection = document.getElementById('travel-atlas-section');
    if (!atlasSection) return;
    _currentTripView = 'dashboard';
    _atlasHydrateImagesFromLS();
    _atlasRegisterPaste();
    atlasSection.innerHTML = renderAtlas();
        setTimeout(function(){ if(window.atlasMarkTracked) window.atlasMarkTracked(); }, 100);
    atlasSection.style.display = 'block';
    // Firestore 백그라운드 fetch (변경 시 자동 재렌더)
    _atlasActivateImages();
    // 페이지 헤더 타이틀
    var titleEl = document.getElementById('page-title');
    if (titleEl) titleEl.textContent = 'Travel · Atlas';
  }
  function hideAtlasView() {
    var atlasSection = document.getElementById('travel-atlas-section');
    if (atlasSection) atlasSection.style.display = 'none';
    // page-content-wrap 복구 (journey 페이지)
    var page = document.getElementById('page-journey');
    if (page) {
      var contentWrap = page.querySelector('.page-content-wrap');
      if (contentWrap) contentWrap.style.display = '';
    }
  }
  window.showAtlasView = showAtlasView;
  window.hideAtlasView = hideAtlasView;
})();
