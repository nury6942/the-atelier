// ════════════════════════════════════════════════════════════════════
// Journey Hero — trip별 cover image (노마드 phase / atlas trip 이미지 동일 패턴)
// LS: atelier_journey_hero_{tripId}
// Firestore: tripCoverImages/{tripId} = { image, updatedAt }
// 호출: index.html의 #journey-hero-image 영역 + renderTripHeader에서 hydrate
// ════════════════════════════════════════════════════════════════════
(function() {
  'use strict';

  var _cache = {};   // tripId -> dataUrl
  var _pos = {};     // tripId -> { x: 50, y: 50 } (%)
  var _hover = false;

  function _getPosLS(tid) {
    try {
      var raw = localStorage.getItem('atelier_journey_hero_pos_' + tid);
      if (!raw) return null;
      var p = JSON.parse(raw);
      return (p && typeof p.x === 'number' && typeof p.y === 'number') ? p : null;
    } catch(e) { return null; }
  }
  function _setPosLS(tid, pos) {
    try {
      if (pos) localStorage.setItem('atelier_journey_hero_pos_' + tid, JSON.stringify(pos));
      else localStorage.removeItem('atelier_journey_hero_pos_' + tid);
    } catch(e) {}
  }
  function _getPos(tid) {
    if (_pos[tid]) return _pos[tid];
    var ls = _getPosLS(tid);
    if (ls) { _pos[tid] = ls; return ls; }
    return { x: 50, y: 50 };
  }
  function _savePos(tid, pos) {
    _pos[tid] = pos;
    _setPosLS(tid, pos);
    // Firestore에 image와 함께 저장 (덮어쓰기 안 되게 image도 같이)
    if (typeof db !== 'undefined' && db) {
      db.collection('tripCoverImages').doc(tid).set({
        image: _cache[tid] || null,
        posX: pos.x,
        posY: pos.y,
        updatedAt: Date.now()
      }, { merge: true }).catch(function(e){ console.warn('[journey-hero] pos save failed', e); });
    }
  }

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
    if (typeof db === 'undefined' || !db) return Promise.resolve({image:null, pos:null});
    return db.collection('tripCoverImages').doc(tid).get().then(function(doc) {
      if (!doc.exists) return { image: null, pos: null };
      var d = doc.data() || {};
      var pos = (typeof d.posX === 'number' && typeof d.posY === 'number')
        ? { x: d.posX, y: d.posY } : null;
      return { image: d.image || null, pos: pos };
    }).catch(function(e) { console.warn('[journey-hero] FB load failed', e); return {image:null, pos:null}; });
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
    var padEl = document.getElementById('journey-hero-pos-pad');
    if (!imgEl || !ctrlEl) return;
    var url = trip ? _cache[trip._id] : null;
    var pos = trip ? _getPos(trip._id) : { x: 50, y: 50 };
    if (url) {
      imgEl.src = url;
      imgEl.style.display = 'block';
      imgEl.style.objectPosition = pos.x + '% ' + pos.y + '%';
      ctrlEl.classList.remove('is-empty');
      ctrlEl.innerHTML =
        '<button class="j-hero-img-ctrl" onclick="journeyHeroUpload()" title="이미지 변경"><span class="material-symbols-outlined">edit</span>변경</button>' +
        '<button class="j-hero-img-ctrl" onclick="journeyHeroDelete()" title="이미지 삭제"><span class="material-symbols-outlined">delete</span></button>';
      if (padEl) padEl.style.display = 'grid';
    } else {
      imgEl.removeAttribute('src');
      imgEl.style.display = 'none';
      imgEl.style.objectPosition = '';
      ctrlEl.classList.add('is-empty');
      ctrlEl.innerHTML =
        '<button class="j-hero-img-ctrl" onclick="journeyHeroUpload()"><span class="material-symbols-outlined">add_photo_alternate</span>이미지 추가</button>';
      if (padEl) padEl.style.display = 'none';
    }
  }

  // 이미지 위치 조정 (5%씩 이동)
  window.journeyHeroMove = function(dx, dy) {
    var trip = _currentTrip();
    if (!trip || !trip._id) return;
    if (!_cache[trip._id]) return; // 이미지 없으면 무시
    var cur = _getPos(trip._id);
    var step = 5;
    var nx = Math.max(0, Math.min(100, cur.x + dx * step));
    var ny = Math.max(0, Math.min(100, cur.y + dy * step));
    _savePos(trip._id, { x: nx, y: ny });
    _render();
  };
  window.journeyHeroResetPos = function() {
    var trip = _currentTrip();
    if (!trip || !trip._id) return;
    _savePos(trip._id, { x: 50, y: 50 });
    _render();
  };
  function _apply(url) {
    var trip = _currentTrip();
    if (!trip || !trip._id) return;
    _cache[trip._id] = url || null;
    _setLS(trip._id, url);
    if (!url) {
      // 삭제 시 position도 reset
      _pos[trip._id] = { x: 50, y: 50 };
      _setPosLS(trip._id, null);
    }
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
    // LS 즉시 적용 (image + position)
    if (_cache[trip._id] === undefined) {
      var ls = _getLS(trip._id);
      if (ls) _cache[trip._id] = ls;
    }
    if (!_pos[trip._id]) {
      var posLs = _getPosLS(trip._id);
      if (posLs) _pos[trip._id] = posLs;
    }
    _render();
    // Firestore 백그라운드 fetch (변경 시 재렌더)
    _loadFB(trip._id).then(function(data) {
      var changed = false;
      if (data.image && _cache[trip._id] !== data.image) {
        _cache[trip._id] = data.image;
        _setLS(trip._id, data.image);
        changed = true;
      }
      if (data.pos) {
        var cur = _pos[trip._id];
        if (!cur || cur.x !== data.pos.x || cur.y !== data.pos.y) {
          _pos[trip._id] = data.pos;
          _setPosLS(trip._id, data.pos);
          changed = true;
        }
      }
      if (changed) _render();
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
