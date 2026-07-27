// ════════════════════════════════════════════════════════════════════
// Journey Spot 이미지 — 스팟 카드 사진 직접 넣기 (붙여넣기 / 파일 선택)
// ───────────────────────────────────────────────────────────────────
// 배경(2026-07-27): 위키에 문서가 없는 개별 식당·카페·상점은 자동으로 사진을
//   채울 방법이 없다(구글 Places는 과금, Commons 검색은 엉뚱한 이미지가 나옴).
//   → 사용자가 직접 넣고 영구 보관하는 경로를 만든다.
//
// LS:        atelier_journey_spot_img_{spotId}
// Firestore: journeySpotImages/{spotId} = { image, updatedAt }   ← 기기 간 동기화
// 저장 형식: 최대 1200px JPEG dataURL (숙소 이미지와 동일 규칙)
// ════════════════════════════════════════════════════════════════════
(function() {
  'use strict';

  var _cache = {};
  var _hydrated = {};
  var _activeKey = null;

  function _getLS(k) {
    try { return localStorage.getItem('atelier_journey_spot_img_' + k) || null; }
    catch(e) { return null; }
  }
  function _setLS(k, url) {
    try {
      if (url) localStorage.setItem('atelier_journey_spot_img_' + k, url);
      else localStorage.removeItem('atelier_journey_spot_img_' + k);
    } catch(e) {}
  }
  function _loadFB(k) {
    if (typeof db === 'undefined' || !db) return Promise.resolve(null);
    return db.collection('journeySpotImages').doc(String(k)).get().then(function(doc) {
      if (doc.exists) return doc.data().image || null;
      return null;
    }).catch(function(e) { console.warn('[spot-img] FB load failed', e); return null; });
  }
  function _saveFB(k, url) {
    if (typeof db === 'undefined' || !db) return Promise.resolve();
    return db.collection('journeySpotImages').doc(String(k)).set({
      image: url,
      updatedAt: Date.now()
    }).catch(function(e) { console.warn('[spot-img] FB save failed', e); });
  }
  function _deleteFB(k) {
    if (typeof db === 'undefined' || !db) return Promise.resolve();
    return db.collection('journeySpotImages').doc(String(k)).delete()
      .catch(function(e) { console.warn('[spot-img] FB delete failed', e); });
  }
  function _processImage(file) {
    return new Promise(function(resolve, reject) {
      var reader = new FileReader();
      reader.onload = function(e) {
        var img = new Image();
        img.onload = function() {
          var maxW = 1200;
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
    if (typeof window.renderPlaces === 'function') window.renderPlaces();
  }
  function _apply(k, url) {
    _cache[k] = url || null;
    _setLS(k, url);
    _rerender();
    if (typeof showSyncToast === 'function') {
      showSyncToast(url ? '🖼 스팟 사진 저장됨' : '🗑 스팟 사진 삭제됨');
    }
    if (url) _saveFB(k, url);
    else _deleteFB(k);
  }

  window.journeySpotImageGet = function(k) {
    if (!k) return null;
    if (_cache[k] !== undefined) return _cache[k];
    var ls = _getLS(k);
    if (ls) { _cache[k] = ls; return ls; }
    return null;
  };
  window.journeySpotImageUpload = function(k) {
    var inputs = document.querySelectorAll('[data-spot-key]');
    for (var i = 0; i < inputs.length; i++) {
      if (inputs[i].getAttribute('data-spot-key') === String(k)) { inputs[i].click(); return; }
    }
  };
  window.journeySpotImageFileSelected = function(e, k) {
    var f = e.target.files && e.target.files[0];
    if (!f) return;
    if (!f.type || f.type.indexOf('image/') !== 0) {
      if (typeof showSyncToast === 'function') showSyncToast('이미지 파일만 받을 수 있어요');
      return;
    }
    _processImage(f).then(function(url) { _apply(k, url); }).catch(function(err) {
      console.error('[spot-img] upload failed', err);
      if (typeof showSyncToast === 'function') showSyncToast('이미지 처리 실패');
    });
    e.target.value = '';
  };
  window.journeySpotImageDelete = function(k) {
    if (!confirm('이 스팟 사진을 삭제할까요?')) return;
    _apply(k, null);
  };
  window.journeySpotImageSetActive = function(k) { _activeKey = String(k); };
  window.journeySpotImageClearActive = function(k) {
    if (_activeKey === String(k)) _activeKey = null;
  };

  // 화면에 보이는 스팟들의 사진을 Firestore에서 백그라운드로 당겨옴 (다른 기기에서 넣은 것)
  window.journeySpotImageHydrateAll = function() {
    var keys = [];
    document.querySelectorAll('[data-spot-key]').forEach(function(el) {
      keys.push(el.getAttribute('data-spot-key'));
    });
    keys.forEach(function(k) {
      if (_hydrated[k]) return;
      _hydrated[k] = true;
      if (_cache[k] === undefined) {
        var ls = _getLS(k);
        if (ls) _cache[k] = ls;
      }
      _loadFB(k).then(function(remote) {
        if (!remote) return;
        if (_cache[k] === remote) return;
        _cache[k] = remote;
        _setLS(k, remote);
        _rerender();
      });
    });
  };

  // 글로벌 paste 핸들러 — 스팟 카드에 마우스를 올린 상태에서 Ctrl+V
  document.addEventListener('paste', function(e) {
    if (!_activeKey) return;
    var grid = document.getElementById('place-grid');
    if (!grid || !grid.offsetParent) return;          // Places 화면이 보일 때만
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
          console.error('[spot-img] paste failed', err);
          if (typeof showSyncToast === 'function') showSyncToast('이미지 처리 실패');
        });
        return;
      }
    }
  });
})();
