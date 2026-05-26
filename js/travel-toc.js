// ════════════════════════════════════════════════════════════════════
// Travel Journey ToC — sticky 좌측 sub-nav
// page-journey 활성 시 자동 표시, 다른 페이지 가면 자동 숨김
// 스크롤 시 현재 섹션 active, 클릭 시 smooth scroll
// ════════════════════════════════════════════════════════════════════
(function() {
  'use strict';

  var SECTIONS = [
    { id: 'trv-hero',      label: 'Voyage' },
    { id: 'trv-stops',     label: 'Stops' },
    { id: 'journey-week-view', label: 'Daily Log' },
    { id: 'trv-flights',   label: 'Flights' },
    { id: 'trv-lodging',   label: 'Lodging' },
    { id: 'trv-transport', label: 'Transit' },
    { id: 'trv-rental',    label: 'Rental' },
    { id: 'trv-souvenir',  label: 'Souvenir' },
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

  function activate() {
    if (_tocEl) return;
    _tocEl = _build();
    document.body.appendChild(_tocEl);
    _tocEl.addEventListener('click', _onClick);
    // 페이지 렌더 후 observer 시작 (data 로드 대기)
    setTimeout(_observeSections, 200);
    setTimeout(_observeSections, 1500); // 늦게 그려지는 섹션 (item 렌더 후) 대응
  }
  function deactivate() {
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
    } else {
      if (_tocEl) deactivate();
    }
  }, 500);

  window.journeyTocActivate = activate;
  window.journeyTocDeactivate = deactivate;
})();
