(function() {
  // ─── 캘린더 위치 강제 보정 (모달/스크롤 무관) ───
  // viewport 기준 fixed로 배치, 화면 경계 자동 boundary 체크
  // window에 노출 → 다른 스크립트 블록의 initFlatpickr에서도 접근 가능
  window._positionFlatpickrFixed = function(instance) {
    if (!instance || !instance.calendarContainer) return;
    var cal = instance.calendarContainer;
    var input = instance.input;
    if (!input) return;
    cal.style.position = 'fixed';
    cal.style.zIndex = '2147483647';  // 최대값 — 어떤 모달도 못 이김
    cal.style.transform = 'none';
    // input 좌표 (viewport 기준)
    var ir = input.getBoundingClientRect();
    var calH = cal.offsetHeight || 350;
    var calW = cal.offsetWidth || 280;
    var vpH = window.innerHeight;
    var vpW = window.innerWidth;
    var GAP = 6, PAD = 10;
    // 기본: input 바로 아래
    var top = ir.bottom + GAP;
    var left = ir.left;
    // 아래로 안 들어가면 input 위로
    if (top + calH > vpH - PAD) {
      var topAbove = ir.top - calH - GAP;
      if (topAbove >= PAD) {
        top = topAbove;
      } else {
        // 위/아래 둘 다 안 들어가면 화면에 맞춰 위쪽 고정 (최소 PAD)
        top = PAD;
        // 캘린더 높이가 viewport보다 클 가능성도 처리 (스크롤 가능하게)
        cal.style.maxHeight = (vpH - PAD * 2) + 'px';
        cal.style.overflowY = 'auto';
      }
    }
    // 오른쪽 boundary
    if (left + calW > vpW - PAD) left = vpW - calW - PAD;
    if (left < PAD) left = PAD;
    cal.style.top = top + 'px';
    cal.style.left = left + 'px';
    cal.style.right = '';
    cal.style.bottom = '';
  }

  function applyFp(input) {
    if (!input || input._flatpickr) return;
    if (typeof flatpickr !== 'function') return;
    try {
      flatpickr(input, {
        locale: 'ko',
        dateFormat: 'Y-m-d',
        allowInput: true,
        disableMobile: false,
        monthSelectorType: 'static',
        appendTo: document.body,
        onOpen: function(selectedDates, dateStr, instance) {
          // 즉시 + 미세 지연(높이 측정 정확하게) 두 번 위치 보정
          _positionFlatpickrFixed(instance);
          setTimeout(function(){ _positionFlatpickrFixed(instance); }, 10);
        }
      });
    } catch(e) { console.warn('[flatpickr]', input.id || '(no id)', e); }
  }
  // window 리사이즈/스크롤 시 열려있는 캘린더 위치 재보정
  window.addEventListener('resize', function(){
    document.querySelectorAll('.flatpickr-calendar.open').forEach(function(cal){
      if (cal._flatpickr && typeof cal._flatpickr === 'object') return;
      // calendarContainer는 instance가 입력 element에 있음. 모든 input의 instance 순회.
      document.querySelectorAll('input[type="text"]').forEach(function(inp){
        if (inp._flatpickr && inp._flatpickr.isOpen) _positionFlatpickrFixed(inp._flatpickr);
      });
    });
  });
  function applyAll() {
    var inputs = document.querySelectorAll('input[type="date"]');
    inputs.forEach(applyFp);
  }
  // 초기 적용
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyAll);
  } else {
    applyAll();
  }
  // 동적으로 추가되는 input도 자동 감지
  var observer = new MutationObserver(function(mutations) {
    for (var i = 0; i < mutations.length; i++) {
      var nodes = mutations[i].addedNodes;
      for (var j = 0; j < nodes.length; j++) {
        var node = nodes[j];
        if (!node || node.nodeType !== 1) continue;
        if (node.matches && node.matches('input[type="date"]')) {
          applyFp(node);
        } else if (node.querySelectorAll) {
          node.querySelectorAll('input[type="date"]').forEach(applyFp);
        }
      }
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });
  // 외부에서 강제 재적용 필요 시
  window._refreshFlatpickr = applyAll;
})();
