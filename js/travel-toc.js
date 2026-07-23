// ════════════════════════════════════════════════════════════════════
// Travel Journey ToC — sticky 좌측 sub-nav
// page-journey 활성 시 자동 표시, 다른 페이지 가면 자동 숨김
// 스크롤 시 현재 섹션 active, 클릭 시 smooth scroll
// ════════════════════════════════════════════════════════════════════
(function() {
  'use strict';

  // ★ (2026-07-22) 장부 5종은 Records 패널 하나로 통합 — TOC도 4개로 압축
  // ★ (2026-07-23) Places는 상단 '스팟' 탭으로 분리 — TOC는 일정 뷰 전용이라 제거
  var SECTIONS = [
    { id: 'trv-hero',      label: 'Voyage' },
    { id: 'trv-stops',     label: 'Stops' },
    { id: 'journey-week-view', label: 'Daily Log' },
    { id: 'trv-ledger',    label: 'Records' },
  ];

  var _tocEl = null;
  var _observer = null;
  var _polling = null;

  function _build() {
    var el = document.createElement('nav');
    el.id = 'journey-toc';
    el.className = 'j-toc';
    el.innerHTML =
      '<p class="j-toc-eyebrow">Sections</p>' +
      '<ul class="j-toc-list">' +
        SECTIONS.map(function(s) {
          return '<li>' +
            '<a class="j-toc-link" data-toc="' + s.id + '" href="#' + s.id + '">' +
              '<span class="j-toc-dot"></span>' +
              '<span class="j-toc-label">' + s.label + '</span>' +
            '</a>' +
          '</li>';
        }).join('') +
      '</ul>';
    return el;
  }

  function _setActive(id) {
    if (!_tocEl) return;
    var links = _tocEl.querySelectorAll('.j-toc-link');
    links.forEach(function(a) {
      if (a.getAttribute('data-toc') === id) a.classList.add('is-active');
      else a.classList.remove('is-active');
    });
  }

  function _onClick(e) {
    var a = e.target.closest && e.target.closest('.j-toc-link');
    if (!a) return;
    e.preventDefault();
    var id = a.getAttribute('data-toc');
    var el = document.getElementById(id);
    if (!el) return;
    // 헤더 높이만큼 offset
    var top = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
    _setActive(id);
  }

  function _observeSections() {
    if (_observer) { _observer.disconnect(); _observer = null; }
    if (!('IntersectionObserver' in window)) return;
    _observer = new IntersectionObserver(function(entries) {
      // 가장 위쪽에서 보이는 섹션을 active로
      var visible = entries.filter(function(e) { return e.isIntersecting; });
      if (visible.length === 0) return;
      visible.sort(function(a, b) {
        return a.boundingClientRect.top - b.boundingClientRect.top;
      });
      _setActive(visible[0].target.id);
    }, { rootMargin: '-20% 0px -65% 0px', threshold: 0 });
    SECTIONS.forEach(function(s) {
      var el = document.getElementById(s.id);
      if (el) _observer.observe(el);
    });
  }

  // ★ (2026-07-22) 고정 좌표(left:240px) → 실측 기반 동적 배치.
  //   사이드바 접힘/펼침·창 너비에 자동 대응, 들어갈 공간 없으면 숨김.
  //   (기존 방식은 사이드바 상태에 따라 겹치거나 잘렸고, 보정용 padding-left가
  //    Atlas까지 밀어 탭마다 너비가 달라 보이던 원인)
  function _position() {
    if (!_tocEl) return;
    var wrap = document.querySelector('#page-journey .page-content-wrap');
    if (!wrap) return;
    var r = wrap.getBoundingClientRect();
    var sbRight = 0;
    var sb = document.getElementById('sidebar');
    if (sb) {
      var sr = sb.getBoundingClientRect();
      if (sr.width > 50 && sr.right > 0) sbRight = sr.right;
    }
    var left = r.left - 148;
    if (left >= sbRight + 12 && window.innerWidth >= 1280) {
      _tocEl.style.display = 'block';
      _tocEl.style.left = left + 'px';
    } else {
      _tocEl.style.display = 'none';
    }
  }

  function activate() {
    if (_tocEl) return;
    _tocEl = _build();
    document.body.appendChild(_tocEl);
    _tocEl.addEventListener('click', _onClick);
    _position();
    window.addEventListener('resize', _position);
    // 페이지 렌더 후 observer 시작 (data 로드 대기)
    setTimeout(_observeSections, 200);
    setTimeout(_observeSections, 1500); // 늦게 그려지는 섹션 (item 렌더 후) 대응
  }
  function deactivate() {
    window.removeEventListener('resize', _position);
    if (_tocEl) { _tocEl.remove(); _tocEl = null; }
    if (_observer) { _observer.disconnect(); _observer = null; }
  }

  // page-journey 가시성 polling (500ms — 가볍게)
  _polling = setInterval(function() {
    var pj = document.getElementById('page-journey');
    if (!pj) return;
    // page는 inline style display로 토글됨
    var isVisible = (pj.style.display !== 'none' && pj.style.display !== '');
    // Atlas 탭 활성 시에는 ToC 숨김 (page-content-wrap이 hide)
    var atlasOn = false;
    var atlasSection = document.getElementById('travel-atlas-section');
    if (atlasSection && atlasSection.style.display === 'block') atlasOn = true;
    // 또는 page-content-wrap이 hide 상태
    var contentWrap = pj.querySelector('.page-content-wrap');
    if (contentWrap && contentWrap.style.display === 'none') atlasOn = true;

    if (isVisible && !atlasOn) {
      if (!_tocEl) activate();
      else _position();
    } else {
      if (_tocEl) deactivate();
    }
  }, 500);

  window.journeyTocActivate = activate;
  window.journeyTocDeactivate = deactivate;
})();
