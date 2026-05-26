// ════════════════════════════════════════════════════════════════════
// Journey Lodge 이미지 — 숙소 카드별 cover (stitch 좌측 이미지)
// LS: atelier_journey_lodge_img_{lodgeKey}
// Firestore: journeyLodgeImages/{lodgeKey} = { image, updatedAt }
// lodgeKey = item._id (Firebase) 또는 'lodge-seed-' + idx
// ════════════════════════════════════════════════════════════════════
(function() {
  'use strict';

  var _cache = {};
  var _hydrated = {};
  var _activeKey = null;

  function _getLS(k) {
    try { return localStorage.getItem('atelier_journey_lodge_img_' + k) || null; }
    catch(e) { return null; }
  }
  function _setLS(k, url) {
    try {
      if (url) localStorage.setItem('atelier_journey_lodge_img_' + k, url);
      else localStorage.removeItem('atelier_journey_lodge_img_' + k);
    } catch(e) {}
  }
  function _loadFB(k) {
    if (typeof db === 'undefined' || !db) return Promise.resolve(null);
    return db.collection('journeyLodgeImages').doc(String(k)).get().then(function(doc) {
      if (doc.exists) return doc.data().image || null;
      return null;
    }).catch(function(e) { console.warn('[lodge-img] FB load failed', e); return null; });
  }
  function _saveFB(k, url) {
    if (typeof db === 'undefined' || !db) return Promise.resolve();
    return db.collection('journeyLodgeImages').doc(String(k)).set({
      image: url,
      updatedAt: Date.now()
    }).catch(function(e) { console.warn('[lodge-img] FB save failed', e); });
  }
  function _deleteFB(k) {
    if (typeof db === 'undefined' || !db) return Promise.resolve();
    return db.collection('journeyLodgeImages').doc(String(k)).delete()
      .catch(function(e) { console.warn('[lodge-img] FB delete failed', e); });
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
    if (typeof renderJourneyLodging === 'function') renderJourneyLodging();
  }
  function _apply(k, url) {
    _cache[k] = url || null;
    _setLS(k, url);
    _rerender();
    if (typeof showSyncToast === 'function') {
      showSyncToast(url ? '🖼 숙소 이미지 저장됨' : '🗑 숙소 이미지 삭제됨');
    }
    if (url) _saveFB(k, url);
    else _deleteFB(k);
  }

  window.journeyLodgeImageGet = function(k) {
    if (!k) return null;
    if (_cache[k] !== undefined) return _cache[k];
    var ls = _getLS(k);
    if (ls) { _cache[k] = ls; return ls; }
    return null;
  };
  window.journeyLodgeImageUpload = function(k) {
    var inputs = document.querySelectorAll('[data-lodge-key]');
    for (var i = 0; i < inputs.length; i++) {
      if (inputs[i].getAttribute('data-lodge-key') === String(k)) {
        inputs[i].click();
        return;
      }
    }
  };
  window.journeyLodgeImageFileSelected = function(e, k) {
    var f = e.target.files && e.target.files[0];
    if (!f) return;
    if (!f.type || f.type.indexOf('image/') !== 0) {
      if (typeof showSyncToast === 'function') showSyncToast('이미지 파일만 받을 수 있어요');
      return;
    }
    _processImage(f).then(function(url) { _apply(k, url); }).catch(function(err) {
      console.error('[lodge-img] upload failed', err);
      if (typeof showSyncToast === 'function') showSyncToast('이미지 처리 실패');
    });
    e.target.value = '';
  };
  window.journeyLodgeImageDelete = function(k) {
    if (!confirm('숙소 이미지를 삭제할까요?')) return;
    _apply(k, null);
  };
  window.journeyLodgeImageSetActive = function(k) { _activeKey = String(k); };
  window.journeyLodgeImageClearActive = function(k) {
    if (_activeKey === String(k)) _activeKey = null;
  };

  // 모든 숙소 이미지 Firestore 백그라운드 hydrate
  window.journeyLodgeImageHydrateAll = function() {
    var keys = [];
    document.querySelectorAll('[data-lodge-key]').forEach(function(el) {
      keys.push(el.getAttribute('data-lodge-key'));
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

  // 글로벌 paste 핸들러
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
          console.error('[lodge-img] paste failed', err);
          if (typeof showSyncToast === 'function') showSyncToast('이미지 처리 실패');
        });
        return;
      }
    }
  });
})();
