// ════════════════════════════════════════════════════════════════════
// Nomad Master 페이지 렌더링 모듈
// 28개 페이지 (Overview, Voyage, Budget, ... City Guides 17개)
// Phase 2 이후 단계적으로 채워나감
// ════════════════════════════════════════════════════════════════════

window.NOMAD_PAGES = (function(){
  var DATA = window.NOMAD_DATA;
  if (!DATA) {
    console.error('[NOMAD_PAGES] NOMAD_DATA가 로드 안 됨');
    return {};
  }

  // ──────── 공통 헬퍼 ────────
  function pageHeader(eyebrow, title, sub) {
    return '<div class="nm-page-header">' +
      (eyebrow ? '<div class="nm-page-eyebrow">' + eyebrow + '</div>' : '') +
      '<div class="nm-page-title">' + title + '</div>' +
      (sub ? '<div class="nm-page-sub">' + sub + '</div>' : '') +
    '</div>';
  }

  function placeholderPage(id, title) {
    return pageHeader('Nomad Master', title, '곧 구현 예정 · Phase 진행 중') +
      '<div class="nm-card"><p style="color:var(--nm-text-3); text-align:center; padding:60px 0;">' +
        '🚧 <strong>' + title + '</strong> 페이지는 다음 단계에서 구현됩니다.<br>' +
        '<span style="font-size:12px">Page ID: ' + id + '</span>' +
      '</p></div>';
  }

  // ──────── 페이지 렌더 디스패처 ────────
  // 각 페이지 ID → render function 매핑
  // Phase 2부터 실제 구현으로 채워나감
  var renderers = {};

  // 디폴트: placeholder
  (DATA.NAV || []).forEach(function(group) {
    (group.items || []).forEach(function(item) {
      renderers[item.id] = function() {
        return placeholderPage(item.id, item.label);
      };
    });
  });

  function renderPage(pageId) {
    var renderer = renderers[pageId];
    if (!renderer) {
      return pageHeader('Error', 'Page Not Found', 'pageId: ' + pageId) +
        '<div class="nm-card">알 수 없는 페이지입니다.</div>';
    }
    return renderer();
  }

  // 페이지 등록 (Phase 2 이후 외부에서 호출)
  function registerPage(pageId, renderFn) {
    renderers[pageId] = renderFn;
  }

  // ──────── 사이드바 빌더 ────────
  // NAV 데이터로부터 사이드바 그룹/항목 HTML 생성 → #nomad-nav-body에 삽입
  function buildSidebar() {
    var container = document.getElementById('nomad-nav-body');
    if (!container) return;
    var html = '';
    (DATA.NAV || []).forEach(function(group) {
      html += '<div class="nomad-nav-group">';
      html += '<div class="nomad-nav-label">' + group.group + '</div>';
      (group.items || []).forEach(function(item) {
        html += '<a href="#" class="nav-item flex items-center gap-2.5 px-3 py-1.5 mx-1 text-slate-500 hover:bg-slate-50 hover:text-indigo-700 rounded-lg transition-all duration-150" ' +
          'id="nav-' + item.id + '" ' +
          'onclick="navigate(\'' + item.id + '\'); return false;">' +
          '<span class="material-symbols-outlined" style="font-size:16px">' + item.icon + '</span>' +
          '<span class="font-manrope text-[11px] font-semibold tracking-tight">' + item.label + '</span>' +
        '</a>';
      });
      html += '</div>';
    });
    container.innerHTML = html;
  }

  // 토글 (펼치기/접기)
  function toggleNomadNav() {
    var body = document.getElementById('nomad-nav-body');
    var chevron = document.getElementById('nomad-nav-chevron');
    if (!body) return;
    var isOpen = body.style.display !== 'none';
    body.style.display = isOpen ? 'none' : '';
    if (chevron) chevron.style.transform = isOpen ? '' : 'rotate(180deg)';
    // 펼침 상태 기억
    try { localStorage.setItem('nomad_nav_open', isOpen ? '0' : '1'); } catch(e){}
  }

  // 초기 상태 복원 + 사이드바 빌드
  function initSidebar() {
    buildSidebar();
    var wasOpen = false;
    try { wasOpen = localStorage.getItem('nomad_nav_open') === '1'; } catch(e){}
    if (wasOpen) {
      var body = document.getElementById('nomad-nav-body');
      var chevron = document.getElementById('nomad-nav-chevron');
      if (body) body.style.display = '';
      if (chevron) chevron.style.transform = 'rotate(180deg)';
    }
  }

  // 전역 노출 (사이드바 onclick에서 호출)
  window.toggleNomadNav = toggleNomadNav;

  // DOM ready 후 사이드바 자동 빌드
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSidebar);
  } else {
    setTimeout(initSidebar, 0);
  }

  return {
    renderPage: renderPage,
    registerPage: registerPage,
    pageHeader: pageHeader,
    buildSidebar: buildSidebar,
    initSidebar: initSidebar,
  };
})();
