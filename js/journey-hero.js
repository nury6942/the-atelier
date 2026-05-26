// ════════════════════════════════════════════════════════════════════
// Journey Hero — trip별 cover image (노마드 phase / atlas trip 이미지 동일 패턴)
// LS: atelier_journey_hero_{tripId}
// Firestore: tripCoverImages/{tripId} = { image, updatedAt }
// 호출: index.html의 #journey-hero-image 영역 + renderTripHeader에서 hydrate
// ════════════════════════════════════════════════════════════════════
(function() {
  'use strict';

  var _cache = {};   // tripId -> dataUrl
  var _hover = false;

  function _getLS(tid) {
    try { return localStorage.getItem('atelier_journey_hero_' + tid) || null; }
    catch(e) { return null; }
  }
  function _setLS(tid, url) {
    try {
      if (url) localStorage.setItem('atelier_journey_hero_' + tid, url);
      else localStorage.removeItem('atelier_journey_hero_' + tid);
    } catch(e) {}
  }
  function _loadFB(tid) {
    if (typeof db === 'undefined' || !db) return Promise.resolve(null);
    return db.collection('tripCoverImages').doc(tid).get().then(function(doc) {
      if (doc.exists) return doc.data().image || null;
      return null;
    }).catch(function(e) { console.warn('[journey-hero] FB load failed', e); return null; });
  }
  function _saveFB(tid, url) {
    if (typeof db === 'undefined' || !db) return Promise.resolve();
    return db.collection('tripCoverImages').doc(tid).set({
      image: url,
      updatedAt: Date.now()
    }).catch(function(e) { console.warn('[journey-hero] FB save failed', e); });
  }
  function _deleteFB(tid) {
    if (typeof db === 'undefined' || !db) return Promise.resolve();
    return db.collection('tripCoverImages').doc(tid).delete()
      .catch(function(e) { console.warn('[journey-hero] FB delete failed', e); });
  }
  function _processImage(file) {
    return new Promise(function(resolve, reject) {
      var reader = new FileReader();
      reader.onload = function(e) {
        var img = new Image();
        img.onload = function() {
          var maxW = 1800;
          var w = img.width, h = img.height;
          if (w > maxW) { h = Math.round(h * maxW / w); w = maxW; }
          var c = document.createElement('canvas');
          c.width = w; c.height = h;
          c.getContext('2d').drawImage(img, 0, 0, w, h);
          var url = c.toDataURL('image/jpeg', 0.82);
          if (url.length > 900000) url = c.toDataURL('image/jpeg', 0.7);
          resolve(url);
        };
        img.onerror = function() { reject(new Error('이미지 디코딩 실패')); };
        img.src = e.target.result;
      };
      reader.onerror = function() { reject(new Error('파일 읽기 실패')); };
      reader.readAsDataURL(file);
    });
  }
  function _currentTrip() {
    return (typeof getCurrentTrip === 'function') ? getCurrentTrip() : null;
  }
  function _render() {
    var trip = _currentTrip();
    var imgEl = document.getElementById('journey-hero-img-src');
    var ctrlEl = document.getElementById('journey-hero-img-controls');
    if (!imgEl || !ctrlEl) return;
    var url = trip ? _cache[trip._id] : null;
    if (url) {
      imgEl.src = url;
      imgEl.style.display = 'block';
      ctrlEl.classList.remove('is-empty');
      ctrlEl.innerHTML =
        '<button class="j-hero-img-ctrl" onclick="journeyHeroUpload()" title="이미지 변경"><span class="material-symbols-outlined">edit</span>변경</button>' +
        '<button class="j-hero-img-ctrl" onclick="journeyHeroDelete()" title="이미지 삭제"><span class="material-symbols-outlined">delete</span></button>';
    } else {
      imgEl.removeAttribute('src');
      imgEl.style.display = 'none';
      ctrlEl.classList.add('is-empty');
      ctrlEl.innerHTML =
        '<button class="j-hero-img-ctrl" onclick="journeyHeroUpload()"><span class="material-symbols-outlined">add_photo_alternate</span>이미지 추가</button>';
    }
  }
  function _apply(url) {
    var trip = _currentTrip();
    if (!trip || !trip._id) return;
    _cache[trip._id] = url || null;
    _setLS(trip._id, url);
    _render();
    if (typeof showSyncToast === 'function') {
      showSyncToast(url ? '🖼 Trip 이미지 저장됨' : '🗑 Trip 이미지 삭제됨');
    }
    if (url) _saveFB(trip._id, url);
    else _deleteFB(trip._id);
  }

  window.journeyHeroHydrate = function() {
    var trip = _currentTrip();
    if (!trip || !trip._id) return;
    // LS 즉시 적용
    if (_cache[trip._id] === undefined) {
      var ls = _getLS(trip._id);
      if (ls) _cache[trip._id] = ls;
    }
    _render();
    // Firestore 백그라운드 fetch (변경 시 재렌더)
    _loadFB(trip._id).then(function(remote) {
      if (!remote) return;
      if (_cache[trip._id] === remote) return;
      _cache[trip._id] = remote;
      _setLS(trip._id, remote);
      _render();
    });
  };
  window.journeyHeroUpload = function() {
    var input = document.getElementById('journey-hero-file');
    if (input) input.click();
  };
  window.journeyHeroFileSelected = function(e) {
    var f = e.target.files && e.target.files[0];
    if (!f) return;
    if (!f.type || f.type.indexOf('image/') !== 0) {
      if (typeof showSyncToast === 'function') showSyncToast('이미지 파일만 받을 수 있어요');
      return;
    }
    _processImage(f).then(_apply).catch(function(err) {
      console.error('[journey-hero] upload failed', err);
      if (typeof showSyncToast === 'function') showSyncToast('이미지 처리 실패');
    });
    e.target.value = '';
  };
  window.journeyHeroDelete = function() {
    if (!confirm('Trip 커버 이미지를 삭제할까요?')) return;
    _apply(null);
  };
  window.journeyHeroSetActive = function() { _hover = true; };
  window.journeyHeroClearActive = function() { _hover = false; };

  // 글로벌 paste 핸들러 — page-journey 보이는 중 + Hero 호버 시
  document.addEventListener('paste', function(e) {
    if (!_hover) return;
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
        _processImage(blob).then(_apply).catch(function(err) {
          console.error('[journey-hero] paste failed', err);
          if (typeof showSyncToast === 'function') showSyncToast('이미지 처리 실패');
        });
        return;
      }
    }
  });
})();
