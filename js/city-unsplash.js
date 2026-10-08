// ════════════════════════════════════════════════════════════════════
// Route 도시 사진 자동 채우기 — Unsplash (무료 API)
//
//   사진이 없는 도시만 골라 Unsplash 에서 찾아 넣는다. 직접 올린 사진은 절대 덮지 않는다.
//
//   ★ 키는 이 파일(공개 저장소)에 두지 않는다. 처음 한 번 화면에서 붙여넣으면
//     Firebase(journeyCityImages/_unsplash) 에 저장돼서 맥북·아이맥·윈도우 모두 같이 쓴다.
//
//   Unsplash 이용 조건 (지켜야 무료로 계속 쓸 수 있다)
//     · 사진 주소는 Unsplash 가 준 것을 그대로 쓴다 (다운받아 재업로드 금지 = 핫링크)
//     · 사진마다 "Photo by 작가 on Unsplash" + 링크 표기
//     · 사진을 골라 쓸 때 download_location 을 한 번 호출
//   한도: Demo 시간당 50회 — 도시 하나에 검색 1~2회 + 다운로드 신호 1회
// ════════════════════════════════════════════════════════════════════
(function() {
  'use strict';

  var LS_KEY = 'atelier_unsplash_key';
  var FB_DOC = '_unsplash';            // journeyCityImages/_unsplash = { accessKey }
  var UTM = 'utm_source=the_atelier&utm_medium=referral';

  var _key = null, _keyLoaded = false;
  var _tried = {};                      // 이번 세션에 이미 시도한 도시 (없으면 또 찾지 않는다)
  var _running = false;

  function toast(msg) { if (typeof showSyncToast === 'function') showSyncToast(msg); }

  function _loadKey() {
    if (_key) return Promise.resolve(_key);
    try { _key = localStorage.getItem(LS_KEY) || null; } catch(e) {}
    if (_key || _keyLoaded) return Promise.resolve(_key);
    _keyLoaded = true;
    if (typeof db === 'undefined' || !db) return Promise.resolve(null);
    return db.collection('journeyCityImages').doc(FB_DOC).get().then(function(d) {
      var k = d.exists ? (d.data().accessKey || null) : null;
      if (k) { _key = k; try { localStorage.setItem(LS_KEY, k); } catch(e) {} }
      return _key;
    }).catch(function() { return null; });
  }

  function _saveKey(k) {
    _key = k; _keyLoaded = true;
    try { localStorage.setItem(LS_KEY, k); } catch(e) {}
    if (typeof db !== 'undefined' && db) {
      return db.collection('journeyCityImages').doc(FB_DOC).set({ accessKey: k, updatedAt: Date.now() })
        .catch(function(e) { console.warn('[unsplash] key save failed', e); });
    }
    return Promise.resolve();
  }

  // 'Ulvik, 노르웨이' → 'Ulvik'. 영어 이름이 있으면 그걸로.
  function _query(name) {
    var en = '';
    try { en = (typeof _cityEn === 'function' && _cityEn(name)) || ''; } catch(e) {}
    return String(en || name || '').split(',')[0].split('(')[0].trim();
  }

  function _search(q, key) {
    var url = 'https://api.unsplash.com/search/photos?query=' + encodeURIComponent(q) +
              '&orientation=portrait&per_page=1&content_filter=high';
    return fetch(url, { headers: { 'Authorization': 'Client-ID ' + key, 'Accept-Version': 'v1' } })
      .then(function(r) {
        if (r.status === 401) throw new Error('KEY');
        if (r.status === 403) throw new Error('LIMIT');
        return r.json();
      })
      .then(function(d) { return (d && d.results && d.results[0]) || null; });
  }

  // 사진이 이미 있는지 Firestore 에서 직접 한 번 더 확인 — 아직 안 불러온 직접 올린 사진을 덮지 않게
  function _hasRemote(k) {
    if (typeof db === 'undefined' || !db) return Promise.resolve(false);
    return db.collection('journeyCityImages').doc(String(k)).get()
      .then(function(d) { return !!(d.exists && d.data().image); })
      .catch(function() { return true; });   // 확인이 안 되면 건드리지 않는 쪽으로
  }

  function _fillOne(city, i, key) {
    var k = String(city._id || ('idx-' + i));
    if (_tried[k]) return Promise.resolve(0);
    if (window.journeyCityImageGet && window.journeyCityImageGet(k)) return Promise.resolve(0);
    _tried[k] = true;
    return _hasRemote(k).then(function(has) {
      if (has) return 0;
      var q = _query(city.name);
      if (!q) return 0;
      // 'Copenhagen city' 로 먼저 — 도시 풍경이 잘 나온다.
      // 작은 마을은 'city' 를 붙이면 아무것도 안 나와서 이름만으로 다시 (예: Ulvik)
      return _search(q + ' city', key).then(function(p) { return p || _search(q, key); }).then(function(p) {
        if (!p) return 0;
        var credit = {
          name: (p.user && p.user.name) || 'Unknown',
          link: ((p.user && p.user.links && p.user.links.html) || 'https://unsplash.com') + '?' + UTM,
          photo: ((p.links && p.links.html) || 'https://unsplash.com') + '?' + UTM
        };
        // 이용 조건: 사진을 쓰기로 했으면 다운로드 신호를 한 번 보낸다
        if (p.links && p.links.download_location) {
          fetch(p.links.download_location, { headers: { 'Authorization': 'Client-ID ' + key } }).catch(function() {});
        }
        window.journeyCityImageSetUnsplash(k, p.urls.regular, credit);
        return 1;
      });
    });
  }

  // manual=true 면 결과를 토스트로 알린다 (버튼으로 눌렀을 때)
  window.cityUnsplashFill = function(manual) {
    if (_running) return;
    return _loadKey().then(function(key) {
      if (!key) { if (manual) window.cityUnsplashShowSetup(); return; }
      var cs = (typeof citiesData !== 'undefined' && citiesData) ? citiesData : [];
      if (manual) cs.forEach(function(c, i) { _tried[String(c._id || ('idx-' + i))] = false; });  // 버튼은 다시 시도
      _running = true;
      var n = 0, chain = Promise.resolve();
      cs.forEach(function(c, i) { chain = chain.then(function() { return _fillOne(c, i, key).then(function(x) { n += x; }); }); });
      return chain.then(function() {
        _running = false;
        if (manual) toast(n ? '🖼 도시 사진 ' + n + '곳 채움 (Unsplash)' : '채울 도시가 없어요 — 이미 다 있거나 사진을 못 찾았어요');
      }).catch(function(e) {
        _running = false;
        if (e && e.message === 'KEY') { toast('Unsplash 키가 맞지 않아요 — 다시 넣어주세요'); window.cityUnsplashShowSetup(); }
        else if (e && e.message === 'LIMIT') toast('Unsplash 시간당 한도(50회)를 넘었어요 — 한 시간 뒤 다시');
        else console.warn('[unsplash]', e);
      });
    });
  };

  // Route 를 그릴 때마다 불린다. 키가 있을 때만, 사진 없는 도시만 조용히 채운다.
  window.cityUnsplashAuto = function() {
    if (_running) return;
    _loadKey().then(function(key) { if (key) window.cityUnsplashFill(false); });
  };

  // ── 키 입력 (처음 한 번) — 모달 대신 Route 머리 아래 한 줄
  window.cityUnsplashShowSetup = function() {
    var row = document.getElementById('jv-unsplash-setup');
    if (!row) return;
    row.style.display = 'flex';
    var inp = document.getElementById('jv-unsplash-key');
    if (inp) inp.focus();
  };
  window.cityUnsplashSaveKey = function() {
    var inp = document.getElementById('jv-unsplash-key');
    var k = inp ? String(inp.value || '').trim() : '';
    if (!k) { toast('Access Key 를 붙여넣어 주세요'); return; }
    _saveKey(k).then(function() {
      if (inp) inp.value = '';
      var row = document.getElementById('jv-unsplash-setup');
      if (row) row.style.display = 'none';
      toast('🔑 저장됐어요 — 이제 모든 기기에서 자동으로 채워져요');
      window.cityUnsplashFill(true);
    });
  };
})();
