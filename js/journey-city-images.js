// ════════════════════════════════════════════════════════════════════
// Journey City 이미지 — Stops 카드별 cover (Atlas / journey-hero 동일 패턴)
// LS: atelier_journey_city_img_{cityKey}
// Firestore: journeyCityImages/{cityKey} = { image, updatedAt }
// cityKey = city._id || 'idx-' + i (city._id 없으면 인덱스 키)
// ════════════════════════════════════════════════════════════════════
(function() {
  'use strict';

  var _cache = {};       // cityKey -> dataUrl
  var _hydrated = {};    // cityKey -> true (Firestore fetch 완료)
  var _activeKey = null; // 호버 중인 stop card
  var _credit = {};      // cityKey -> { name, link, photo } (Unsplash 자동 사진일 때만)

  function _getCreditLS(k) {
    try { var v = localStorage.getItem('atelier_journey_city_credit_' + k); return v ? JSON.parse(v) : null; }
    catch(e) { return null; }
  }
  function _setCredit(k, c) {
    _credit[k] = c || null;
    try {
      if (c) localStorage.setItem('atelier_journey_city_credit_' + k, JSON.stringify(c));
      else localStorage.removeItem('atelier_journey_city_credit_' + k);
    } catch(e) {}
  }

  function _getLS(k) {
    try { return localStorage.getItem('atelier_journey_city_img_' + k) || null; }
    catch(e) { return null; }
  }
  function _setLS(k, url) {
    try {
      if (url) localStorage.setItem('atelier_journey_city_img_' + k, url);
      else localStorage.removeItem('atelier_journey_city_img_' + k);
    } catch(e) {}
  }
  function _loadFB(k) {
    if (typeof db === 'undefined' || !db) return Promise.resolve(null);
    return db.collection('journeyCityImages').doc(String(k)).get().then(function(doc) {
      if (doc.exists) { var d = doc.data(); _setCredit(k, d.credit || null); return d.image || null; }
      return null;
    }).catch(function(e) { console.warn('[city-img] FB load failed', e); return null; });
  }
  function _saveFB(k, url) {
    if (typeof db === 'undefined' || !db) return Promise.resolve();
    return db.collection('journeyCityImages').doc(String(k)).set({
      image: url,
      updatedAt: Date.now()
    }).catch(function(e) { console.warn('[city-img] FB save failed', e); });
  }
  function _deleteFB(k) {
    if (typeof db === 'undefined' || !db) return Promise.resolve();
    return db.collection('journeyCityImages').doc(String(k)).delete()
      .catch(function(e) { console.warn('[city-img] FB delete failed', e); });
  }
  function _processImage(file) {
    return new Promise(function(resolve, reject) {
      var reader = new FileReader();
      reader.onload = function(e) {
        var img = new Image();
        img.onload = function() {
          var maxW = 1200; // stops 카드는 작아서 1200이면 충분
          var w = img.width, h = img.height;
          if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
          var c = document.createElement('canvas');
          c.width = w; c.height = h;
          c.getContext('2d').drawImage(img, 0, 0, w, h);
          var url = c.toDataURL('image/jpeg', 0.82);
          if (url.length > 700000) url = c.toDataURL('image/jpeg', 0.7);
          resolve(url);
        };
        img.onerror = function() { reject(new Error('이미지 디코딩 실패')); };
        img.src = e.target.result;
      };
      reader.onerror = function() { reject(new Error('파일 읽기 실패')); };
      reader.readAsDataURL(file);
    });
  }
  function _rerender() {
    if (typeof renderCityCards === 'function') renderCityCards();
    if (typeof window.renderPlaces === 'function') window.renderPlaces(); // 스팟 카드도 도시 이미지 재사용
    try { if (typeof renderWeekView === 'function') renderWeekView(); } catch(e) {} // ★ (2026-10-07) Day 칸 제목 배경 사진
  }
  function _apply(k, url) {
    _setCredit(k, null);   // 직접 올리거나 지운 사진 — 작가 표기 대상이 아님
    _cache[k] = url || null;
    _setLS(k, url);
    _rerender();
    if (typeof showSyncToast === 'function') {
      showSyncToast(url ? '🖼 도시 이미지 저장됨' : '🗑 도시 이미지 삭제됨');
    }
    if (url) _saveFB(k, url);
    else _deleteFB(k);
  }

  window.journeyCityImageCredit = function(k) {
    if (!k) return null;
    if (_credit[k] !== undefined) return _credit[k];
    var c = _getCreditLS(k); _credit[k] = c; return c;
  };
  // Unsplash 자동 사진 저장 — 사진 주소(핫링크)와 작가 표기를 함께
  window.journeyCityImageSetUnsplash = function(k, url, credit) {
    k = String(k);
    _cache[k] = url; _setLS(k, url); _setCredit(k, credit);
    if (typeof db !== 'undefined' && db) {
      db.collection('journeyCityImages').doc(k).set({ image: url, credit: credit, source: 'unsplash', updatedAt: Date.now() })
        .catch(function(e) { console.warn('[city-img] unsplash save failed', e); });
    }
    _rerender();
  };

  window.journeyCityImageGet = function(k) {
    if (!k) return null;
    if (_cache[k] !== undefined) return _cache[k];
    var ls = _getLS(k);
    if (ls) { _cache[k] = ls; return ls; }
    return null;
  };
  window.journeyCityImageUpload = function(k) {
    // file input은 동적으로 생성된 stops 카드 안에 있음
    // 가장 가까운 매칭 input 찾기
    var inputs = document.querySelectorAll('[data-city-key]');
    for (var i = 0; i < inputs.length; i++) {
      if (inputs[i].getAttribute('data-city-key') === String(k)) {
        inputs[i].click();
        return;
      }
    }
  };
  window.journeyCityImageFileSelected = function(e, k) {
    var f = e.target.files && e.target.files[0];
    if (!f) return;
    if (!f.type || f.type.indexOf('image/') !== 0) {
      if (typeof showSyncToast === 'function') showSyncToast('이미지 파일만 받을 수 있어요');
      return;
    }
    _processImage(f).then(function(url) { _apply(k, url); }).catch(function(err) {
      console.error('[city-img] upload failed', err);
      if (typeof showSyncToast === 'function') showSyncToast('이미지 처리 실패');
    });
    e.target.value = '';
  };
  window.journeyCityImageDelete = function(k) {
    if (!confirm('도시 이미지를 삭제할까요?')) return;
    _apply(k, null);
  };
  window.journeyCityImageSetActive = function(k) { _activeKey = String(k); };
  window.journeyCityImageClearActive = function(k) {
    if (_activeKey === String(k)) _activeKey = null;
  };

  // 모든 도시 이미지 Firestore 백그라운드 hydrate (renderCityCards에서 호출)
  window.journeyCityImageHydrateAll = function() {
    var cities = (typeof citiesData !== 'undefined') ? citiesData : [];
    cities.forEach(function(city, i) {
      var k = String(city._id || ('idx-' + i));
      if (_hydrated[k]) return;
      _hydrated[k] = true;
      // LS 즉시 적용
      if (_cache[k] === undefined) {
        var ls = _getLS(k);
        if (ls) _cache[k] = ls;
      }
      // Firestore 백그라운드
      _loadFB(k).then(function(remote) {
        if (!remote) { if (!_cache[k]) _restoreFromTrash(city, k); return; }
        if (_cache[k] === remote) return;
        _cache[k] = remote;
        _setLS(k, remote);
        _rerender();
      });
    });
  };

  // ★ (2026-10-08) 플랜 적용으로 도시 문서가 새로 만들어지면서 사진이 끊긴 문제 복구.
  //   사진은 예전 도시 id로 남아 있으니, 휴지통(atelier_trash)에서 같은 여행·같은 이름의
  //   옛 도시 id를 찾아 그 사진을 새 id로 복사한다. (최근 삭제된 것부터)
  function _cityNorm(s) {
    s = String(s || '').split(',')[0].trim().toLowerCase().replace(/\s+/g, '');
    try { s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, ''); } catch(e) {}
    return s;
  }
  function _cityNames(name) {
    var out = [_cityNorm(name)];
    try { if (typeof _cityEn === 'function') { var en = _cityEn(name); if (en) out.push(_cityNorm(en)); } } catch(e) {}
    return out;
  }
  function _restoreFromTrash(city, k) {
    if (!city || !city.name) return;
    var trash = [];
    try { trash = JSON.parse(localStorage.getItem('atelier_trash') || '[]'); } catch(e) {}
    var mine = _cityNames(city.name);
    var olds = trash.filter(function(t) {
      if (t.collection !== 'trip_cities' || !t.data || t.id === k) return false;
      if (city.trip_id && t.data.trip_id && t.data.trip_id !== city.trip_id) return false;
      var theirs = _cityNames(t.data.name);
      return theirs.some(function(n) { return n && mine.indexOf(n) >= 0; });
    }).reverse();
    var i = 0;
    (function next() {
      if (i >= olds.length) return;
      var oid = olds[i++].id;
      var ls = _getLS(oid);
      (ls ? Promise.resolve(ls) : _loadFB(oid)).then(function(url) {
        if (!url) return next();
        if (_cache[k]) return;
        _cache[k] = url; _setLS(k, url); _saveFB(k, url);
        console.log('[city-img] 사진 복구', city.name, oid, '→', k);
        _rerender();
      });
    })();
  }
  window.journeyCityImageRestore = function() {
    var cities = (typeof citiesData !== 'undefined') ? citiesData : [];
    cities.forEach(function(c, i) { var k = String(c._id || ('idx-' + i)); if (!window.journeyCityImageGet(k)) _restoreFromTrash(c, k); });
  };

  // 글로벌 paste 핸들러 — page-journey 활성 + stop 카드 호버 시
  document.addEventListener('paste', function(e) {
    if (!_activeKey) return;
    var pj = document.getElementById('page-journey');
    if (!pj || pj.style.display === 'none') return;
    var ae = document.activeElement;
    if (ae && (ae.tagName === 'INPUT' || ae.tagName === 'TEXTAREA' || ae.isContentEditable)) return;
    var items = (e.clipboardData || {}).items || [];
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      if (it.kind === 'file' && it.type && it.type.indexOf('image/') === 0) {
        e.preventDefault();
        var blob = it.getAsFile();
        if (!blob) return;
        var target = _activeKey;
        _processImage(blob).then(function(url) { _apply(target, url); }).catch(function(err) {
          console.error('[city-img] paste failed', err);
          if (typeof showSyncToast === 'function') showSyncToast('이미지 처리 실패');
        });
        return;
      }
    }
  });
})();
