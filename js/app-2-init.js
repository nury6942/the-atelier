// ===== AUTH =====

// 🚨 최상위 디버그 로그 — JS 로드 자체가 되는지 확인
console.log('🔵 [app-2-init.js] 로드 시작', new Date().toISOString());
window.__atelier_app2_loaded = true;

// ═══ 모바일 감지 — 차트 건너뛰기 + Chart.js 최적화 ═══
// iOS Safari 탭 discard (메모리 한계 도달) 방지
// 1) viewport 폭 1024px 이하 OR 2) iOS/Android UA OR 3) 터치 디바이스
window._isMobile = (
  window.matchMedia('(max-width: 1024px)').matches ||
  /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ||
  ('ontouchstart' in window) ||
  (navigator.maxTouchPoints > 0)
);
console.log('🔵 [isMobile detection]', {
  isMobile: window._isMobile,
  width: window.innerWidth,
  ua: navigator.userAgent.substring(0, 80),
  touch: 'ontouchstart' in window,
  maxTouch: navigator.maxTouchPoints
});
(function(){
  if (typeof Chart === 'undefined') return;
  if (window._isMobile) {
    Chart.defaults.animation = false;
    Chart.defaults.animations = { colors: false, x: false, y: false };
    Chart.defaults.transitions = { active: { animation: { duration: 0 } } };
    Chart.defaults.responsive = true;
    Chart.defaults.maintainAspectRatio = true;
    Chart.defaults.plugins.tooltip.animation = false;
    console.log('[Atelier] Mobile detected — Chart.js animations disabled');
  }
})();

// ===== SIDEBAR TOGGLE =====
var _sidebarOpen = true;
function toggleSidebar() {
  _sidebarOpen = !_sidebarOpen;
  var sb = document.getElementById('sidebar');
  var mw = document.getElementById('main-wrapper');
  var mh = document.getElementById('main-header');
  var icon = document.getElementById('sidebar-toggle-icon');
  var overlay = document.getElementById('sidebar-overlay');
  if (_sidebarOpen) {
    sb.classList.remove('sidebar-collapsed');
    document.body.classList.remove('sidebar-off');
    mw.style.marginLeft = ''; mh.style.left = '';
    if (icon) icon.textContent = 'menu_open';
    if (window.innerWidth <= 768 && overlay) overlay.classList.remove('hidden');
  } else {
    sb.classList.add('sidebar-collapsed');
    document.body.classList.add('sidebar-off');
    mw.style.marginLeft = '0'; mh.style.left = '0';
    if (icon) icon.textContent = 'menu';
    if (overlay) overlay.classList.add('hidden');
  }
  localStorage.setItem('atelier_sidebar', _sidebarOpen ? 'open' : 'closed');
}
// Restore state
(function(){
  var saved = localStorage.getItem('atelier_sidebar');
  var isMobile = window.innerWidth <= 768;
  // 모바일에서는 저장된 상태와 무관하게 기본 닫힘
  if (isMobile || saved === 'closed') { _sidebarOpen = true; toggleSidebar(); }
  else {
    var icon = document.getElementById('sidebar-toggle-icon');
    if (icon) icon.textContent = 'menu_open';
  }
})();
// Keyboard shortcut: Cmd/Ctrl + B to toggle sidebar
document.addEventListener('keydown', function(e) {
  if ((e.metaKey || e.ctrlKey) && e.key === 'b') { e.preventDefault(); toggleSidebar(); }
});

// 2-finger swipe → sidebar toggle (no page navigation)
(function() {
  // Trackpad wheel
  var _swAccum = 0, _swTimer = null;
  document.addEventListener('wheel', function(e) {
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) { _swAccum = 0; return; }
    // Skip if inside horizontally scrollable container
    var t = e.target;
    while (t && t !== document.body) {
      var s = window.getComputedStyle(t);
      if ((s.overflowX === 'auto' || s.overflowX === 'scroll') && t.scrollWidth > t.clientWidth) return;
      t = t.parentElement;
    }
    _swAccum += e.deltaX;
    clearTimeout(_swTimer);
    _swTimer = setTimeout(function() {
      if (Math.abs(_swAccum) > 150) {
        var sb = document.getElementById('sidebar');
        var isHidden = sb && sb.classList.contains('sidebar-collapsed');
        if (_swAccum < 0 && isHidden) toggleSidebar();
        else if (_swAccum > 0 && !isHidden) toggleSidebar();
      }
      _swAccum = 0;
    }, 150);
  }, { passive: true });
  // Touch 2-finger
  var _tStartX = 0, _tMulti = false;
  document.addEventListener('touchstart', function(e) {
    if (e.touches.length === 2) { _tStartX = (e.touches[0].clientX + e.touches[1].clientX) / 2; _tMulti = true; }
    else { _tMulti = false; }
  }, { passive: true });
  document.addEventListener('touchend', function(e) {
    if (!_tMulti || e.changedTouches.length < 2) { _tMulti = false; return; }
    var endX = (e.changedTouches[0].clientX + e.changedTouches[1].clientX) / 2;
    var dx = endX - _tStartX;
    if (Math.abs(dx) > 100) {
      var sb = document.getElementById('sidebar');
      var isHidden = sb && sb.classList.contains('sidebar-collapsed');
      if (dx > 0 && isHidden) toggleSidebar();
      else if (dx < 0 && !isHidden) toggleSidebar();
    }
    _tMulti = false;
  }, { passive: true });
})();

var _profileDdOpen = false;
function toggleProfileDropdown() {
  _profileDdOpen = !_profileDdOpen;
  document.getElementById('profile-dd-panel').style.display = _profileDdOpen ? 'block' : 'none';
}
document.addEventListener('click', function(e) {
  if (_profileDdOpen && !e.target.closest('#profile-dd-wrap')) {
    _profileDdOpen = false;
    document.getElementById('profile-dd-panel').style.display = 'none';
  }
});
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape' && _profileDdOpen) {
    _profileDdOpen = false;
    document.getElementById('profile-dd-panel').style.display = 'none';
  }
});

function googleSignIn() {
  var provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider).catch(function(err) {
    var errEl = document.getElementById('login-error');
    if (err.code === 'auth/popup-blocked') {
      errEl.textContent = '팝업이 차단되었어요. 팝업을 허용해주세요.';
    } else if (err.code === 'auth/cancelled-popup-request' || err.code === 'auth/popup-closed-by-user') {
      return;
    } else {
      errEl.textContent = '로그인 실패: ' + err.message;
    }
    errEl.style.display = 'block';
  });
}

function signOutAndRetry() {
  auth.signOut();
}

// ===== WORKSPACE REFERENCE =====
var _refCards = [];
var _refEditId = null;
var _refDeleteId = null;
var _refSearchTimer = null;
var _refEditingId = null;

async function loadReference() {
  try {
    var snap = await db.collection('workspace_references').orderBy('updatedAt', 'desc').get();
    _refCards = [];
    snap.forEach(function(doc) {
      var data = Object.assign({ _id: doc.id }, doc.data());
      if (data.body && !data.isCode) {
        var migrated = migrateMarkdown(data.body);
        if (migrated !== data.body) {
          data.body = migrated;
          db.collection('workspace_references').doc(doc.id).update({ body: migrated });
        }
      }
      _refCards.push(data);
    });
    renderRefList();
    // Reset editor to empty state
    if (!_refEditingId || !_refCards.find(function(c) { return c._id === _refEditingId; })) {
      _refEditingId = null;
      document.getElementById('ref-editor-active').style.display = 'none';
      document.getElementById('ref-editor-empty').style.display = 'flex';
    }
  } catch(e) {
    console.error('[Reference] load error:', e);
  }
}

function _refGetDate(ts) {
  if (!ts) return new Date(0);
  return ts.toDate ? ts.toDate() : new Date(ts);
}

function _refDateLabel(d) {
  var now = new Date();
  var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  var diff = today - new Date(d.getFullYear(), d.getMonth(), d.getDate());
  var dayMs = 86400000;
  if (diff < dayMs) return '오늘';
  if (diff < 2 * dayMs) return '어제';
  if (diff < 7 * dayMs) return '이전 7일';
  if (diff < 30 * dayMs) return '이전 30일';
  return '이전';
}

function _refShortDate(d) {
  var now = new Date();
  var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  var diff = today - new Date(d.getFullYear(), d.getMonth(), d.getDate());
  if (diff < 86400000) {
    return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
  }
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
}

function renderRefList(filter) {
  var list = document.getElementById('ref-list');
  if (!list) return;

  var cards = _refCards.slice();
  if (filter) {
    var q = filter.toLowerCase();
    cards = cards.filter(function(c) {
      var bodyText = stripHtml(c.body || '');
      return (c.title || '').toLowerCase().includes(q) || bodyText.toLowerCase().includes(q);
    });
  }

  // Sort: pinned first, then by updatedAt desc
  cards.sort(function(a, b) {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    var tA = _refGetDate(a.updatedAt);
    var tB = _refGetDate(b.updatedAt);
    return tB - tA;
  });

  if (cards.length === 0) {
    list.innerHTML = '<div class="text-center py-12 text-slate-400"><span class="material-symbols-outlined mb-2 block" style="font-size: var(--font-size-display-2xl)">edit_note</span><p class="text-xs">' + (filter ? '검색 결과 없음' : '메모가 없습니다') + '</p></div>';
    return;
  }

  var html = '';
  var lastGroup = '';
  var pinned = cards.filter(function(c) { return c.isPinned; });
  var unpinned = cards.filter(function(c) { return !c.isPinned; });

  if (pinned.length > 0) {
    html += '<div class="ref-list-group">고정된 메모</div>';
    pinned.forEach(function(c) { html += _refListItemHtml(c); });
  }

  unpinned.forEach(function(c) {
    var d = _refGetDate(c.updatedAt);
    var group = _refDateLabel(d);
    if (group !== lastGroup) {
      html += '<div class="ref-list-group">' + group + '</div>';
      lastGroup = group;
    }
    html += _refListItemHtml(c);
  });

  list.innerHTML = html;
}

function _refListItemHtml(c) {
  var d = _refGetDate(c.updatedAt);
  var dateStr = _refShortDate(d);
  var preview = stripHtml(c.body || '').substring(0, 90);
  var isActive = (_refEditingId === c._id);
  var activeClass = isActive ? ' active' : '';
  var pinHtml = c.isPinned ? '<span class="material-symbols-outlined ref-li-pin" style="font-variation-settings:\'FILL\' 1">push_pin</span>' : '';
  // 상대 시간 ("12시간 전" / "4일 전" / 날짜)
  var relTime = _refRelTime ? _refRelTime(d) : dateStr;
  var activeChip = isActive ? '<span class="ref-li-active-chip">Active</span>' : '';
  return '<div class="ref-list-item' + activeClass + '" onclick="selectMemo(\'' + c._id + '\')">' +
    '<div class="ref-li-title">' + pinHtml + escHtml(c.title || '제목 없음') + '</div>' +
    '<div class="ref-li-preview">' + escHtml(preview || '내용 없음') + '</div>' +
    '<div class="ref-li-meta">' + activeChip + '<span>' + (isActive ? '' : relTime) + '</span></div>' +
  '</div>';
}

// 상대 시간 (12시간 전, 4일 전 형식)
function _refRelTime(d) {
  if (!d) return '';
  var now = new Date();
  var diff = (now - d) / 1000; // seconds
  if (diff < 60) return '방금 전';
  if (diff < 3600) return Math.floor(diff/60) + '분 전';
  if (diff < 86400) return Math.floor(diff/3600) + '시간 전';
  if (diff < 86400*7) return Math.floor(diff/86400) + '일 전';
  return d.getFullYear() === now.getFullYear()
    ? (d.getMonth()+1) + '월 ' + d.getDate() + '일'
    : (d.getFullYear() + '. ' + (d.getMonth()+1) + '. ' + d.getDate());
}

function closeMemoEdit() {
  document.body.classList.remove('memo-edit-open');
}

function selectMemo(id) {
  // 다른 메모로 전환 전 — 현재 메모 pending 자동 저장 강제 실행
  if (_refEditingId && _refEditingId !== id && typeof _refAutoSaveTimer !== 'undefined' && _refAutoSaveTimer) {
    clearTimeout(_refAutoSaveTimer);
    _refAutoSaveTimer = null;
    // synchronous-ish flush (await 없이 fire-and-forget)
    saveRefInline({ silent: true });
  }
  _refEditingId = id;
  var card = _refCards.find(function(c) { return c._id === id; });
  if (!card) return;

  document.getElementById('ref-editor-empty').style.display = 'none';
  document.getElementById('ref-editor-active').style.display = 'flex';
  // 모바일에서 에디터 풀스크린 모드 진입
  if (window.innerWidth <= 768) document.body.classList.add('memo-edit-open');

  document.getElementById('ref-editor-title').value = card.title || '';
  var bodyEl = document.getElementById('ref-editor-body');
  if (card.isCode) {
    bodyEl.innerText = card.body || '';
  } else {
    bodyEl.innerHTML = card.body || '';
  }

  // Update date display
  var d = _refGetDate(card.updatedAt);
  document.getElementById('ref-editor-date').textContent = d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  // Update pin icon
  var pinIcon = document.getElementById('ref-editor-pin-icon');
  pinIcon.style.fontVariationSettings = card.isPinned ? "'FILL' 1" : "'FILL' 0";
  pinIcon.style.color = card.isPinned ? '#7c3aed' : '';

  // Highlight active item in list
  renderRefList(document.getElementById('ref-search').value.trim());
}

async function saveRefInline(opts) {
  opts = opts || {};
  var silent = opts.silent === true;
  var title = document.getElementById('ref-editor-title').value.trim();
  // 제목이 비어있으면 자동으로 '제목 없음'으로 저장
  if (!title) title = '제목 없음';
  var el = document.getElementById('ref-editor-body');
  var body = sanitizeHtml(el.innerHTML).trim();
  // 제목 + 본문 둘 다 비어있으면 저장 스킵 (빈 메모 양산 방지)
  if (title === '제목 없음' && !body) return;
  var now = new Date();
  var statusEl = document.getElementById('ref-save-status');

  if (statusEl && silent) {
    statusEl.textContent = '저장 중...';
    statusEl.style.opacity = '1';
  }

  try {
    if (_refEditingId) {
      await db.collection('workspace_references').doc(_refEditingId).update({ title: title, body: body, updatedAt: now });
      var card = _refCards.find(function(c) { return c._id === _refEditingId; });
      if (card) { card.title = title; card.body = body; card.updatedAt = now; }
    } else {
      var docRef = await db.collection('workspace_references').add({ title: title, body: body, isCode: false, isPinned: false, createdAt: now, updatedAt: now });
      _refCards.unshift({ _id: docRef.id, title: title, body: body, isCode: false, isPinned: false, createdAt: now, updatedAt: now });
      _refEditingId = docRef.id;
    }
    renderRefList(document.getElementById('ref-search').value.trim());
    if (statusEl) {
      statusEl.textContent = '✓ 저장됨';
      statusEl.style.color = '#15803d';
      // 2초 후 페이드아웃
      clearTimeout(window._refStatusTimer);
      window._refStatusTimer = setTimeout(function() {
        if (statusEl) statusEl.style.opacity = '0.5';
      }, 2000);
    }
    if (!silent) showSyncToast('<span class="material-symbols-outlined text-sm mr-1">check_circle</span> 저장됨');
  } catch(e) {
    console.error('[Reference] save error:', e);
    if (statusEl) {
      statusEl.textContent = '⚠️ 저장 실패';
      statusEl.style.color = '#dc2626';
      statusEl.style.opacity = '1';
    }
    if (!silent) showSyncToast('<span class="material-symbols-outlined text-sm mr-1">error</span> 저장 실패');
  }
}

// 자동 저장 — 1.2초 디바운스
var _refAutoSaveTimer = null;
function _refScheduleAutoSave() {
  // ref-editor-active가 보이지 않으면 자동 저장 X
  var activeEl = document.getElementById('ref-editor-active');
  if (!activeEl || activeEl.style.display === 'none') return;
  if (_refAutoSaveTimer) clearTimeout(_refAutoSaveTimer);
  var statusEl = document.getElementById('ref-save-status');
  if (statusEl) {
    statusEl.textContent = '편집 중...';
    statusEl.style.color = '#7b7487';
    statusEl.style.opacity = '1';
  }
  _refAutoSaveTimer = setTimeout(function() {
    saveRefInline({ silent: true });
  }, 1200);
}

// 자동 저장 트리거: 제목/본문 입력 시 + 메모 전환 시 강제 저장
document.addEventListener('DOMContentLoaded', function() {
  var titleEl = document.getElementById('ref-editor-title');
  var bodyEl = document.getElementById('ref-editor-body');
  if (titleEl) titleEl.addEventListener('input', _refScheduleAutoSave);
  if (bodyEl) bodyEl.addEventListener('input', _refScheduleAutoSave);
});

// 페이지 떠나기/메모 전환 시 pending auto-save 강제 실행
window.addEventListener('beforeunload', function() {
  if (_refAutoSaveTimer) {
    clearTimeout(_refAutoSaveTimer);
    saveRefInline({ silent: true });
  }
});

function escHtml(s) {
  var d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

function sanitizeHtml(html) {
  var tmp = document.createElement('div');
  tmp.innerHTML = html;
  var allowedStyles = ['color','background-color','font-size'];
  function cleanStyle(el) {
    var s = el.getAttribute('style');
    if (!s) return '';
    var parts = s.split(';').map(function(p){ return p.trim(); }).filter(function(p){
      var prop = (p.split(':')[0] || '').trim().toLowerCase();
      return allowedStyles.indexOf(prop) >= 0;
    });
    return parts.length ? ' style="' + escHtml(parts.join(';')) + '"' : '';
  }
  function walk(node) {
    var out = '';
    node.childNodes.forEach(function(n) {
      if (n.nodeType === 3) { out += escHtml(n.textContent); return; }
      if (n.nodeType !== 1) return;
      var tag = n.tagName.toLowerCase();
      var allowed = ['strong','b','em','i','u','s','br','div','p','span','code','font','ul','ol','li'];
      if (allowed.indexOf(tag) >= 0) {
        if (tag === 'br') { out += '<br>'; return; }
        // Map deprecated tags
        var mapped = tag === 'b' ? 'strong' : tag === 'i' ? 'em' : tag;
        // Handle <font> from execCommand('fontSize')
        if (tag === 'font') {
          var size = n.getAttribute('size');
          var fontSize = size === '1' ? '12px' : size === '5' ? '18px' : '';
          var color = n.getAttribute('color') || '';
          var st = '';
          if (fontSize) st += 'font-size:' + fontSize + ';';
          if (color && /^#[0-9a-fA-F]{3,8}$/.test(color)) st += 'color:' + color + ';';
          if (st) { out += '<span style="' + st + '">' + walk(n) + '</span>'; }
          else { out += walk(n); }
          return;
        }
        var styleAttr = (tag === 'span' || tag === 'code') ? cleanStyle(n) : '';
        out += '<' + mapped + styleAttr + '>' + walk(n) + '</' + mapped + '>';
      } else {
        out += walk(n);
      }
    });
    return out;
  }
  return walk(tmp);
}

function stripHtml(html) {
  var tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

function migrateMarkdown(text) {
  if (!text || text.indexOf('**') < 0) return text;
  if (text.indexOf('<') >= 0) return text;
  return text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

function refTimeAgo(ts) {
  if (!ts) return '';
  var d = ts.toDate ? ts.toDate() : new Date(ts);
  var diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 60) return '방금 전';
  if (diff < 3600) return Math.floor(diff / 60) + '분 전';
  if (diff < 86400) return Math.floor(diff / 3600) + '시간 전';
  if (diff < 604800) return Math.floor(diff / 86400) + '일 전';
  return d.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });
}

function openRefModal(editId) {
  if (editId) {
    selectMemo(editId);
    return;
  }
  // 새 메모 만들기 전 — 현재 편집 중인 메모 pending 자동 저장 flush
  if (_refEditingId && typeof _refAutoSaveTimer !== 'undefined' && _refAutoSaveTimer) {
    clearTimeout(_refAutoSaveTimer);
    _refAutoSaveTimer = null;
    saveRefInline({ silent: true });
  }
  // New memo — open inline editor with empty state
  _refEditingId = null;
  document.getElementById('ref-editor-empty').style.display = 'none';
  document.getElementById('ref-editor-active').style.display = 'flex';
  document.getElementById('ref-editor-title').value = '';
  document.getElementById('ref-editor-body').innerHTML = '';
  document.getElementById('ref-editor-date').textContent = '새 메모';
  var statusEl = document.getElementById('ref-save-status');
  if (statusEl) { statusEl.textContent = ''; statusEl.style.opacity = '1'; }
  var pinIcon = document.getElementById('ref-editor-pin-icon');
  pinIcon.style.fontVariationSettings = "'FILL' 0";
  pinIcon.style.color = '';
  // Deselect in list
  document.querySelectorAll('.ref-list-item.active').forEach(function(el) { el.classList.remove('active'); });
  // 모바일에서 에디터 풀스크린 모드 진입
  if (window.innerWidth <= 768) document.body.classList.add('memo-edit-open');
  document.getElementById('ref-editor-title').focus();
}

function closeRefModal() {
  document.getElementById('ref-modal').style.cssText = 'display:none!important';
  _refEditId = null;
}

async function saveRefCard() {
  var title = document.getElementById('ref-input-title').value.trim();
  if (!title) { showSyncToast('<span class="material-symbols-outlined text-sm mr-1">warning</span> 제목을 입력하세요'); return; }
  var el = document.getElementById('ref-input-body');
  var isCode = document.getElementById('ref-input-code').checked;
  var body = isCode ? (el.textContent || '').trim() : sanitizeHtml(el.innerHTML).trim();
  var now = new Date();

  try {
    if (_refEditId) {
      await db.collection('workspace_references').doc(_refEditId).update({ title: title, body: body, isCode: isCode, updatedAt: now });
    } else {
      await db.collection('workspace_references').add({ title: title, body: body, isCode: isCode, isPinned: false, createdAt: now, updatedAt: now });
    }
    await loadReference();
    showSyncToast('<span class="material-symbols-outlined text-sm mr-1">check_circle</span> ' + (_refEditId ? '수정됨' : '추가됨'));
  } catch(e) {
    console.error('[Reference] save error:', e);
    showSyncToast('<span class="material-symbols-outlined text-sm mr-1">error</span> 저장 실패');
  }
}

async function toggleRefPin(id) {
  var card = _refCards.find(function(c) { return c._id === id; });
  if (!card) return;
  var newPin = !card.isPinned;
  try {
    await db.collection('workspace_references').doc(id).update({ isPinned: newPin, updatedAt: new Date() });
    card.isPinned = newPin;
    renderRefList(document.getElementById('ref-search').value.trim());
    // Update pin icon in editor if this memo is currently open
    if (_refEditingId === id) {
      var pinIcon = document.getElementById('ref-editor-pin-icon');
      pinIcon.style.fontVariationSettings = newPin ? "'FILL' 1" : "'FILL' 0";
      pinIcon.style.color = newPin ? '#7c3aed' : '';
    }
  } catch(e) {
    console.error('[Reference] pin error:', e);
  }
}

function copyRefCard(id) {
  var card = _refCards.find(function(c) { return c._id === id; });
  if (!card) return;
  var text = card.isCode ? (card.body || card.title || '') : stripHtml(card.body || card.title || '');
  navigator.clipboard.writeText(text).then(function() {
    showSyncToast('<span class="material-symbols-outlined text-sm mr-1">check_circle</span> 복사됨!');
  });
}

function openRefDelModal(id) {
  _refDeleteId = id;
  document.getElementById('ref-del-modal').style.cssText = 'display:flex!important';
}

function closeRefDelModal() {
  document.getElementById('ref-del-modal').style.cssText = 'display:none!important';
  _refDeleteId = null;
}

async function confirmDeleteRefCard() {
  if (!_refDeleteId) return;
  // closeRefDelModal()이 _refDeleteId를 null로 초기화하므로 로컬 변수에 미리 저장
  var idToDelete = _refDeleteId;
  try {
    var wasEditing = (_refEditingId === idToDelete);
    await db.collection('workspace_references').doc(idToDelete).delete();
    closeRefDelModal();
    _refCards = _refCards.filter(function(c) { return c._id !== idToDelete; });
    if (wasEditing) {
      _refEditingId = null;
      document.getElementById('ref-editor-active').style.display = 'none';
      document.getElementById('ref-editor-empty').style.display = 'flex';
    }
    renderRefList(document.getElementById('ref-search').value.trim());
    showSyncToast('<span class="material-symbols-outlined text-sm mr-1">check_circle</span> 삭제됨');
  } catch(e) {
    console.error('[Reference] delete error:', e);
    showSyncToast('<span class="material-symbols-outlined text-sm mr-1">error</span> 삭제 실패');
  }
}

// ===== Toolbar helper functions =====
function refTogglePop(id) {
  var el = document.getElementById(id);
  if (!el) return;
  // Close all other popovers first
  document.querySelectorAll('.ref-popover.open').forEach(function(p) { if (p.id !== id) p.classList.remove('open'); });
  el.classList.toggle('open');
}

function refCloseAllPops() {
  document.querySelectorAll('.ref-popover.open').forEach(function(p) { p.classList.remove('open'); });
}

function refFontSize(size) {
  document.execCommand('fontSize', false, size);
  refCloseAllPops();
}

function refTextColor(color) {
  document.execCommand('foreColor', false, color);
  refCloseAllPops();
}

function refBgColor(color) {
  if (color === 'transparent') {
    document.execCommand('removeFormat', false, 'backColor');
    // hiliteColor fallback
    document.execCommand('backColor', false, 'transparent');
  } else {
    document.execCommand('backColor', false, color);
  }
  refCloseAllPops();
}

function refToggleCode() {
  var sel = window.getSelection();
  if (!sel.rangeCount) return;
  var range = sel.getRangeAt(0);
  // Check if already inside <code>
  var parent = sel.anchorNode;
  while (parent && parent.nodeType !== 1) parent = parent.parentNode;
  if (parent && parent.tagName === 'CODE') {
    // Unwrap
    var text = document.createTextNode(parent.textContent);
    parent.parentNode.replaceChild(text, parent);
    sel.removeAllRanges();
    var r = document.createRange();
    r.selectNodeContents(text);
    sel.addRange(r);
  } else if (!range.collapsed) {
    // Wrap selection in <code>
    var code = document.createElement('code');
    try {
      range.surroundContents(code);
    } catch(e) {
      // If selection spans multiple elements, extract and wrap
      var frag = range.extractContents();
      code.appendChild(frag);
      range.insertNode(code);
    }
    sel.removeAllRanges();
    var r2 = document.createRange();
    r2.selectNodeContents(code);
    sel.addRange(r2);
  }
}

// Full-screen modal functions
var _refFullEditId = null;

function openRefFullModal(editId) {
  _refFullEditId = editId || null;
  var card = _refCards.find(function(c) { return c._id === _refFullEditId; });
  if (!card) return;
  document.getElementById('ref-full-title').value = card.title || '';
  document.getElementById('ref-full-body').innerHTML = card.isCode ? escHtml(card.body || '') : (card.body || '');
  document.getElementById('ref-full-code').checked = !!card.isCode;
  document.getElementById('ref-full-modal').style.cssText = 'display:flex!important';
}

function closeRefFullModal() {
  document.getElementById('ref-full-modal').style.cssText = 'display:none!important';
  _refFullEditId = null;
}

async function saveRefFullCard() {
  var title = document.getElementById('ref-full-title').value.trim();
  if (!title) { showSyncToast('<span class="material-symbols-outlined text-sm mr-1">warning</span> 제목을 입력하세요'); return; }
  var el = document.getElementById('ref-full-body');
  var isCode = document.getElementById('ref-full-code').checked;
  var body = isCode ? (el.textContent || '').trim() : sanitizeHtml(el.innerHTML).trim();
  var now = new Date();
  try {
    await db.collection('workspace_references').doc(_refFullEditId).update({ title: title, body: body, isCode: isCode, updatedAt: now });
    closeRefFullModal();
    await loadReference();
    if (_refEditingId === _refFullEditId) selectMemo(_refFullEditId);
    showSyncToast('<span class="material-symbols-outlined text-sm mr-1">check_circle</span> 수정됨');
  } catch(e) {
    console.error('[Reference] save error:', e);
    showSyncToast('<span class="material-symbols-outlined text-sm mr-1">error</span> 저장 실패');
  }
}

// Search with debounce + ESC to close full modal
document.addEventListener('DOMContentLoaded', function() {
  var searchEl = document.getElementById('ref-search');
  if (searchEl) {
    searchEl.addEventListener('input', function() {
      clearTimeout(_refSearchTimer);
      var val = searchEl.value.trim();
      _refSearchTimer = setTimeout(function() { renderRefList(val); }, 200);
    });
  }

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      refCloseAllPops();
      if (document.getElementById('ref-full-modal').style.cssText.indexOf('flex') >= 0) closeRefFullModal();
    }
  });

  // Close popovers on outside click
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.ref-toolbar')) refCloseAllPops();
  });

  // Backdrop click-to-close with drag protection
  var _refBackdropDown = false;
  var fullModal = document.getElementById('ref-full-modal');
  if (fullModal) {
    fullModal.addEventListener('mousedown', function(e) {
      _refBackdropDown = (e.target === fullModal);
    });
    fullModal.addEventListener('mouseup', function(e) {
      if (_refBackdropDown && e.target === fullModal) closeRefFullModal();
      _refBackdropDown = false;
    });
  }
});

auth.onAuthStateChanged(function(user) {
  var loginScreen = document.getElementById('login-screen');
  var deniedScreen = document.getElementById('access-denied-screen');
  var appContainer = document.getElementById('app-container');

  if (!user) {
    // 로그인 안 됨
    try { localStorage.removeItem('atelier_authed'); } catch(e){}
    loginScreen.style.display = 'flex';
    deniedScreen.style.display = 'none';
    appContainer.style.display = 'none';
  } else if (user.email && user.email.toLowerCase() === ALLOWED_EMAIL) {
    // 허용된 계정
    try { localStorage.setItem('atelier_authed', 'true'); } catch(e){}
    loginScreen.style.display = 'none';
    deniedScreen.style.display = 'none';
    appContainer.style.display = '';
    // 클라우드 동기화
    if (typeof syncAllFromCloud === 'function') syncAllFromCloud();
    // 프로필 정보 업데이트
    var displayName = user.displayName || user.email.split('@')[0];
    var initial = (displayName || 'U').charAt(0).toUpperCase();
    var avatar = document.getElementById('profile-avatar');
    if (avatar) avatar.textContent = initial;
    var nameEl = document.getElementById('profile-dd-name');
    if (nameEl) nameEl.textContent = displayName;
    var emailEl = document.getElementById('profile-dd-email');
    if (emailEl) emailEl.textContent = user.email;
    // ═══ URL 파라미터로 페이지 자동 이동 (m-ledger.html의 자산/부업 탭에서 이동 시) ═══
    try {
      var navParam = new URLSearchParams(window.location.search).get('nav');
      if (navParam && typeof navigate === 'function') {
        // 파라미터 정리 후 navigate
        history.replaceState({}, '', window.location.pathname);
        setTimeout(function(){ navigate(navParam); }, 100);
      }
    } catch(e) {}
  } else {
    // 비허용 계정
    loginScreen.style.display = 'none';
    deniedScreen.style.display = 'flex';
    appContainer.style.display = 'none';
  }
});

// ===== DAILY LEDGER: DATA INFRASTRUCTURE + MONTHLY VIEW =====
var _ledgerData = {};
var _ledgerTabActive = 'monthly';
var _ldgYear = 2026, _ldgMonth = 4;
var _ldgSortField = 'date', _ldgSortAsc = false;
var _ldgDeleteTarget = null;
var _ldgEditingId = null;
var _ldgLastSavedDate = null;
var _ldgBudgetEditingCat = null; // 카테고리 카드에서 예산 인라인 편집 중인 카테고리명
var _ldgChartIncome = null, _ldgChartExpense = null, _ldgChartDaily = null;
var _ldgMonthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
var _ldgMonthKo = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
var _ldgPaymentColors = {'신한카드':'#6366f1','현대카드':'#f59e0b','체크카드':'#10b981','카카오페이':'#3b82f6','현금/이체':'#8b5cf6'};

function switchLedgerTab(tab) {
  _ledgerTabActive = tab;
  document.querySelectorAll('.ledger-panel').forEach(function(p) { p.style.display = 'none'; });
  var panel = document.getElementById('ledger-panel-' + tab);
  if (panel) panel.style.display = 'block';
  document.querySelectorAll('.ledger-tab').forEach(function(btn) {
    if (btn.dataset.tab === tab) {
      btn.style.background = 'linear-gradient(135deg,#6366f1,#a855f7)';
      btn.style.color = '#fff';
      btn.style.boxShadow = '0 2px 8px rgba(99,102,241,0.25)';
    } else {
      btn.style.background = '#f1f5f9';
      btn.style.color = '#64748b';
      btn.style.boxShadow = 'none';
    }
  });
  if (tab === 'monthly' && _ledgerData.transactions) ldgRenderMonthly();
  if (tab === 'annual' && _ledgerData.transactions) ldgRenderAnnual();
  if (tab === 'assets' && _ledgerData.transactions) ldgRenderAssets();
  if (tab === 'settings') ldgRenderSettings();
}

// ── Firebase sync for Daily Ledger (다기기 자동 동기화) ──
var _ledgerSyncTimer = null;
var _ledgerLastFBSync = 0;

// 반환값: { docExists: boolean, loaded: number, txCount: number }
async function loadLedgerFromFirebase() {
  console.log('🔵 [loadLedgerFromFirebase] 시작');
  try {
    if (typeof db === 'undefined' || !db) {
      console.warn('[loadLedgerFromFirebase] db 없음');
      return { docExists: false, loaded: 0, txCount: 0 };
    }
    console.log('🔵 [loadLedgerFromFirebase] Firestore doc 요청 중...');
    var doc = await db.collection('appSettings').doc('ledgerData').get();
    console.log('🔵 [loadLedgerFromFirebase] Firestore doc 받음, exists:', doc.exists);
    if (!doc.exists) return { docExists: false, loaded: 0, txCount: 0 };
    var d = doc.data();
    var keys = ['settings','categories','budgets','recurring','assets','transactions'];
    var lsKeys = {
      settings: 'atelier_ledger_settings',
      categories: 'atelier_ledger_categories',
      budgets: 'atelier_ledger_budgets',
      recurring: 'atelier_ledger_recurring',
      assets: 'atelier_ledger_assets',
      transactions: 'atelier_ledger_transactions'
    };
    var loaded = 0;
    keys.forEach(function(k) {
      if (d[k] !== undefined && d[k] !== null) {
        _ledgerData[k] = d[k];
        try { localStorage.setItem(lsKeys[k], JSON.stringify(d[k])); } catch(e) {}
        loaded++;
      }
    });
    // goals는 별도 키 (localStorage 직접 저장, _ledgerData에 안 들어감)
    if (d.goals !== undefined && d.goals !== null) {
      try { localStorage.setItem('atelier_ledger_goals', JSON.stringify(d.goals)); } catch(e) {}
      loaded++;
    }

    // ═══ archived 모드 감지 — main에 transactions 없으면 sharded에서 받아옴 ═══
    var isArchived = !!d.archived || localStorage.getItem('atelier_ledger_archived') === 'true';
    var txCount = 0;
    if (isArchived) {
      console.log('🟣 [LedgerSync] archived 모드 — 트랜잭션 sharded 로드');
      var allTxs = await _loadTxShardedFromFirebase({});
      _ledgerData.transactions = allTxs;
      try { localStorage.setItem('atelier_ledger_transactions', JSON.stringify(allTxs)); } catch(e) {}
      txCount = allTxs.length;
      localStorage.setItem('atelier_ledger_archived', 'true');
    } else {
      txCount = (d.transactions||[]).length;
    }
    console.log('[LedgerSync] Firebase에서 로드: ' + loaded + ' keys, updatedAt=' + (d.updatedAt||'?') + ', tx=' + txCount + ', archived=' + isArchived);
    return { docExists: true, loaded: loaded, txCount: txCount };
  } catch(e) {
    console.error('[LedgerSync] Firebase 로드 실패:', e);
    return { docExists: false, loaded: 0, txCount: 0 };
  }
}

// 모바일 빠른 로드 — main 메타데이터만 받고 현재 연도 트랜잭션 받기
async function loadLedgerFromFirebaseFast() {
  console.log('🚀 [loadLedgerFromFirebaseFast] 시작');
  try {
    if (typeof db === 'undefined' || !db) return { docExists: false };
    // 1) main 문서 (가벼움 — archived 모드라면 ~50KB)
    var doc = await db.collection('appSettings').doc('ledgerData').get();
    if (!doc.exists) return { docExists: false };
    var d = doc.data();
    var keys = ['settings','categories','budgets','recurring','assets'];
    keys.forEach(function(k) {
      if (d[k] !== undefined && d[k] !== null) {
        _ledgerData[k] = d[k];
        try { localStorage.setItem('atelier_ledger_' + k, JSON.stringify(d[k])); } catch(e) {}
      }
    });
    if (d.goals) {
      try { localStorage.setItem('atelier_ledger_goals', JSON.stringify(d.goals)); } catch(e) {}
    }
    var isArchived = !!d.archived;
    if (!isArchived && d.transactions) {
      // legacy 모드: 트랜잭션 main에 있음
      _ledgerData.transactions = d.transactions;
      try { localStorage.setItem('atelier_ledger_transactions', JSON.stringify(d.transactions)); } catch(e) {}
      console.log('🚀 [Fast] legacy main load, tx=' + d.transactions.length);
      return { docExists: true, archived: false, mainOnly: true };
    }
    // archived: 현재 연도 트랜잭션만 즉시 로드
    var currentYear = String(new Date().getFullYear());
    var yearTxs = await _loadTxShardedFromFirebase({ yearOnly: currentYear });
    _ledgerData.transactions = yearTxs; // 일단 현재 연도만
    console.log('🚀 [Fast] archived load — 메타 + ' + currentYear + ' tx=' + yearTxs.length);
    localStorage.setItem('atelier_ledger_archived', 'true');
    return { docExists: true, archived: true, currentYearTxs: yearTxs.length };
  } catch(e) {
    console.error('🚀 [Fast] 실패:', e);
    return { docExists: false };
  }
}

// 다른 연도 백그라운드 로드 (archived 모드에서만)
async function loadOtherYearsInBackground() {
  if (typeof db === 'undefined' || !db) return;
  if (localStorage.getItem('atelier_ledger_archived') !== 'true') return;
  try {
    console.log('📥 [Background] 다른 연도 트랜잭션 로드 시작');
    var snapshot = await db.collection('ledgerTransactions').get();
    var currentYear = String(new Date().getFullYear());
    var allTxs = [].concat(_ledgerData.transactions || []);
    snapshot.forEach(function(doc) {
      if (doc.id === currentYear) return; // 이미 로드됨
      var items = doc.data().items || [];
      allTxs = allTxs.concat(items);
    });
    _ledgerData.transactions = allTxs;
    try { localStorage.setItem('atelier_ledger_transactions', JSON.stringify(allTxs)); } catch(e) {}
    console.log('📥 [Background] 완료 — 전체 tx=' + allTxs.length);
    // 화면 다시 그리기 (조용히)
    if (typeof ldgRenderMonthly === 'function') ldgRenderMonthly();
  } catch(e) {
    console.warn('📥 [Background] 실패:', e);
  }
}
window.loadOtherYearsInBackground = loadOtherYearsInBackground;

// ═══════════════════════════════════════════════════════
// 📦 LEDGER ARCHIVING SYSTEM
// 트랜잭션을 연도별 별도 Firestore 문서에 저장
// — appSettings/ledgerData: 설정/카테고리/예산/recurring/assets만 (가벼움)
// — ledgerTransactions/{year}: 해당 연도의 트랜잭션 배열
// 모바일에서 첫 로드 시 main doc만 받으면 빠르고, 트랜잭션은 lazy/background
// ═══════════════════════════════════════════════════════

// 트랜잭션을 연도별로 그룹화
function _groupTxByYear(txs) {
  var byYear = {};
  (txs || []).forEach(function(t) {
    var y = (t.date || '').substring(0, 4);
    if (!y || !/^\d{4}$/.test(y)) y = 'unknown';
    if (!byYear[y]) byYear[y] = [];
    byYear[y].push(t);
  });
  return byYear;
}

// 트랜잭션 sharded 저장 (연도별 문서)
async function _saveTxShardedToFirebase() {
  if (typeof db === 'undefined' || !db) return { saved: 0, error: null };
  var byYear = _groupTxByYear(_ledgerData.transactions);
  var ts = new Date().toISOString();
  var saved = 0;
  var errors = [];
  for (var year in byYear) {
    try {
      await db.collection('ledgerTransactions').doc(year).set({
        items: byYear[year],
        count: byYear[year].length,
        updatedAt: ts
      });
      saved++;
    } catch(e) {
      errors.push(year + ': ' + (e.message || e));
    }
  }
  return { saved: saved, error: errors.length ? errors.join('; ') : null };
}

// 트랜잭션 sharded 로드 — 옵션으로 특정 연도만 가능
async function _loadTxShardedFromFirebase(opts) {
  if (typeof db === 'undefined' || !db) return [];
  opts = opts || {};
  var allTxs = [];
  try {
    if (opts.yearOnly) {
      // 특정 연도만 로드 (lazy)
      var doc = await db.collection('ledgerTransactions').doc(String(opts.yearOnly)).get();
      if (doc.exists) {
        var d = doc.data();
        allTxs = d.items || [];
      }
    } else {
      // 모든 연도 로드 (background 또는 desktop)
      var snapshot = await db.collection('ledgerTransactions').get();
      snapshot.forEach(function(doc) {
        var items = doc.data().items || [];
        allTxs = allTxs.concat(items);
      });
    }
  } catch(e) {
    console.error('[Sharded Load] 실패:', e);
  }
  return allTxs;
}

// 메타데이터(트랜잭션 제외) 사이즈만 측정
function _metaSize() {
  return JSON.stringify({
    settings: _ledgerData.settings || {},
    categories: _ledgerData.categories || {},
    budgets: _ledgerData.budgets || {},
    recurring: _ledgerData.recurring || [],
    assets: _ledgerData.assets || {}
  }).length;
}

// 데이터 archiving 마이그레이션 (1회 실행)
// 1) 현재 ledgerData 전체 백업
// 2) 트랜잭션을 연도별 ledgerTransactions/{year} 문서로 저장
// 3) main ledgerData 문서에서 transactions 필드 제거 (가벼워짐)
async function migrateLedgerToArchive() {
  if (typeof db === 'undefined' || !db) { alert('Firebase 연결 안 됨'); return; }
  var txCount = (_ledgerData.transactions || []).length;
  if (!confirm('📦 데이터 아카이브 마이그레이션\n\n' +
    '트랜잭션 ' + txCount + '건을 연도별 별도 문서로 분리합니다.\n' +
    '메인 가계부 로딩이 5~30초 → 1~2초로 빨라져요.\n\n' +
    '✅ 자동 백업 수행 (안전)\n' +
    '✅ 모든 데이터 보존 (삭제 X)\n' +
    '✅ 데스크탑 기능 영향 없음\n\n' +
    '진행할까요?')) return;

  console.log('[Archive Migration] 시작 — tx=' + txCount);
  try {
    // 1) 백업 (단일 문서 통째로)
    var ts = new Date().toISOString();
    var backupKey = 'ledgerData_backup_' + ts.replace(/[:.]/g, '-');
    var goalsStored = {};
    try { goalsStored = JSON.parse(localStorage.getItem('atelier_ledger_goals')) || {}; } catch(e) {}
    await db.collection('appSettings').doc(backupKey).set({
      settings: _ledgerData.settings || {},
      categories: _ledgerData.categories || {},
      budgets: _ledgerData.budgets || {},
      recurring: _ledgerData.recurring || [],
      assets: _ledgerData.assets || {},
      transactions: _ledgerData.transactions || [],
      goals: goalsStored,
      note: 'Pre-archive migration backup',
      createdAt: ts
    });
    console.log('[Archive Migration] ✅ 백업 완료: appSettings/' + backupKey);

    // 2) 트랜잭션 연도별 분리 저장
    var result = await _saveTxShardedToFirebase();
    console.log('[Archive Migration] ✅ 트랜잭션 분리 저장: ' + result.saved + '개 연도', result.error || '');

    // 3) main 문서에서 transactions 필드 제거 (가벼워짐)
    var mainPayload = {
      settings: _ledgerData.settings || {},
      categories: _ledgerData.categories || {},
      budgets: _ledgerData.budgets || {},
      recurring: _ledgerData.recurring || [],
      assets: _ledgerData.assets || {},
      goals: goalsStored,
      archived: true,  // ← 마이그레이션 완료 표시
      archivedAt: ts,
      txYears: Object.keys(_groupTxByYear(_ledgerData.transactions)),
      txTotalCount: txCount,
      updatedAt: ts
    };
    await db.collection('appSettings').doc('ledgerData').set(mainPayload);
    console.log('[Archive Migration] ✅ main 문서 슬림화 완료, size=' + JSON.stringify(mainPayload).length + 'B');

    // 4) localStorage flag
    localStorage.setItem('atelier_ledger_archived', 'true');
    alert('✅ 마이그레이션 완료!\n\n' +
      '트랜잭션 ' + txCount + '건 → ' + result.saved + '개 연도 문서로 분리됨\n' +
      'main 문서 사이즈: ~50KB (이전 ~1MB)\n\n' +
      '백업: appSettings/' + backupKey + '\n\n' +
      '이제 모바일 로딩이 훨씬 빠를 거예요.');
  } catch(e) {
    console.error('[Archive Migration] 실패:', e);
    alert('❌ 마이그레이션 실패: ' + (e.message || e) + '\n\n데이터는 안전합니다.');
  }
}
window.migrateLedgerToArchive = migrateLedgerToArchive;

async function saveLedgerToFirebase() {
  try {
    if (typeof db === 'undefined' || !db) return false;
    var goalsStored = {};
    try { goalsStored = JSON.parse(localStorage.getItem('atelier_ledger_goals')) || {}; } catch(e) {}

    // ── archived 모드 (마이그레이션 후): 트랜잭션은 별도 저장 ──
    var isArchived = localStorage.getItem('atelier_ledger_archived') === 'true';
    if (isArchived) {
      var ts = new Date().toISOString();
      // 1) main 문서 (가벼움)
      var mainPayload = {
        settings: _ledgerData.settings || {},
        categories: _ledgerData.categories || {},
        budgets: _ledgerData.budgets || {},
        recurring: _ledgerData.recurring || [],
        assets: _ledgerData.assets || {},
        goals: goalsStored,
        archived: true,
        txYears: Object.keys(_groupTxByYear(_ledgerData.transactions)),
        txTotalCount: (_ledgerData.transactions || []).length,
        updatedAt: ts
      };
      await db.collection('appSettings').doc('ledgerData').set(mainPayload);
      // 2) 트랜잭션 연도별 저장 (변경된 연도만 저장하면 더 효율적이지만, 안전을 위해 전체 저장)
      await _saveTxShardedToFirebase();
      console.log('[saveLedger] ✅ archived 모드 저장 완료');
      return true;
    }

    // ── legacy 모드 (마이그레이션 전) ──
    var payload = {
      settings: _ledgerData.settings || {},
      categories: _ledgerData.categories || {},
      budgets: _ledgerData.budgets || {},
      recurring: _ledgerData.recurring || [],
      assets: _ledgerData.assets || {},
      transactions: _ledgerData.transactions || [],
      goals: goalsStored,
      updatedAt: new Date().toISOString()
    };
    var size = JSON.stringify(payload).length;
    if (size > 950000) {
      console.warn('[LedgerSync] 문서 크기가 1MB 한계에 근접:', size);
    }
    await db.collection('appSettings').doc('ledgerData').set(payload);
    _ledgerLastFBSync = Date.now();
    console.log('[LedgerSync] Firebase 저장 완료 (' + Math.round(size/1024) + 'KB, tx=' + payload.transactions.length + ')');
    return true;
  } catch(e) {
    console.error('[LedgerSync] Firebase 저장 실패:', e);
    return false;
  }
}

// 디바운싱: 800ms 후 동기화 (연속 편집 시 1번만 푸시)
function scheduleLedgerSync() {
  if (_ledgerSyncTimer) clearTimeout(_ledgerSyncTimer);
  _ledgerSyncTimer = setTimeout(function() {
    saveLedgerToFirebase();
    _ledgerSyncTimer = null;
  }, 800);
}

async function loadLedgerData() {
  console.log('🟢 [loadLedgerData] 시작', { isMobile: window._isMobile });
  var keys = {
    settings: 'atelier_ledger_settings',
    categories: 'atelier_ledger_categories',
    budgets: 'atelier_ledger_budgets',
    recurring: 'atelier_ledger_recurring',
    assets: 'atelier_ledger_assets',
    transactions: 'atelier_ledger_transactions'
  };
  var files = {
    settings: 'data/ledger/settings.json',
    categories: 'data/ledger/categories.json',
    budgets: 'data/ledger/budgets.json',
    recurring: 'data/ledger/recurring.json',
    assets: 'data/ledger/assets-template.json',
    transactions: 'data/ledger/transactions.json'
  };

  // ═══ 모바일 우선순위 역전: localStorage 먼저 → 즉시 렌더 → Firebase 백그라운드 sync ═══
  var isMobile = window._isMobile || window.matchMedia('(max-width: 768px)').matches;
  var fbResult = { docExists: false, loaded: 0, txCount: 0 };

  if (isMobile) {
    console.log('🟢 [loadLedgerData] 모바일 — localStorage 우선');
    // 1순위 (모바일): localStorage 즉시 로드
    for (var name in keys) {
      var stored = localStorage.getItem(keys[name]);
      if (stored) {
        try { _ledgerData[name] = JSON.parse(stored); } catch(e) {}
      }
    }
    console.log('🟢 [loadLedgerData] localStorage 로드 완료, tx=' + ((_ledgerData.transactions || []).length));
    // Firebase는 백그라운드 — archived 모드면 fast (main + 현재 연도만), 아니면 legacy
    setTimeout(function() {
      var isArchived = localStorage.getItem('atelier_ledger_archived') === 'true';
      var loadFn = isArchived ? loadLedgerFromFirebaseFast : loadLedgerFromFirebase;
      loadFn().then(function(r) {
        console.log('🟢 [백그라운드 sync] 완료', r);
        if (r.docExists) {
          // 데이터 갱신됐으면 다시 렌더 (조용히)
          if (typeof ldgRenderMonthly === 'function') ldgRenderMonthly();
          // archived 모드면 5초 후 나머지 연도 트랜잭션 백그라운드 로드
          if (isArchived) {
            setTimeout(function() { loadOtherYearsInBackground(); }, 5000);
          }
        }
      }).catch(function(e) { console.warn('[백그라운드 sync] 실패', e); });
    }, 1500);
  } else {
    // 1순위 (데스크탑): Firebase 우선 (archived 모드 내부 자동 처리)
    fbResult = await loadLedgerFromFirebase();
  }
  for (var name in keys) {
    // Firebase에서 이미 로드된 경우 스킵
    if (_ledgerData[name] !== undefined && _ledgerData[name] !== null) continue;
    // 2순위: localStorage
    var stored = localStorage.getItem(keys[name]);
    if (stored) {
      try { _ledgerData[name] = JSON.parse(stored); continue; } catch(e) {}
    }
    // 3순위: 기본 템플릿 파일
    try {
      var resp = await fetch(files[name]);
      if (resp.ok) {
        _ledgerData[name] = await resp.json();
        localStorage.setItem(keys[name], JSON.stringify(_ledgerData[name]));
      }
    } catch(e) { console.warn('[DailyLedger] Failed to load ' + name, e); }
  }
  // ⚠️ 자동 푸시 제거됨 (옛 localStorage 데이터로 Firebase 덮어쓰는 버그 방지)
  // 첫 동기화는 사용자가 편집을 한 번 하면 자동으로 발생 (ldgSaveTx → scheduleLedgerSync)
  // 명시적으로 Firebase가 비어있는 경우만 안내 로그 출력 (모바일에선 Firebase 체크 안 했으므로 스킵)
  if (!isMobile && !fbResult.docExists && _ledgerData.transactions && _ledgerData.transactions.length > 0) {
    console.log('[LedgerSync] Firebase에 데이터 없음. 편집 시 자동 동기화됩니다. 즉시 동기화하려면 saveLedgerToFirebase() 실행');
  }
  var s = _ledgerData.settings || {}, c = _ledgerData.categories || {};
  var catCount = Object.keys(c).length, subCount = 0;
  for (var k in c) subCount += (c[k] || []).length;
  console.log('[DailyLedger] Loaded:\n  - settings: { year: ' + (s.year||'?') + ', paymentMethods: ' + ((s.paymentMethods||[]).length) + '개 }\n  - categories: ' + catCount + ' 대분류, ' + subCount + ' 소분류\n  - budgets: ' + Object.keys(_ledgerData.budgets||{}).length + ' 카테고리\n  - recurring: ' + (_ledgerData.recurring||[]).length + ' 항목\n  - assets-template: ' + Object.keys(_ledgerData.assets||{}).length + ' 분류\n  - transactions: ' + (_ledgerData.transactions||[]).length.toLocaleString() + ' 건');
  // 월별 뷰는 항상 오늘 날짜 기준 월로 시작 (자동 고정 거래로 미래 월로 점프하는 문제 방지)
  var _today = new Date();
  _ldgYear = _today.getFullYear();
  _ldgMonth = _today.getMonth() + 1;
  _ldgAnnualYear = _ldgYear;
  _ldgAssetYear = _ldgYear;
  ldgCheckDataAnomaly();
  ldgRenderMonthly();
}

var _ledgerLoaded = false;
function loadLedger() {
  switchLedgerTab(_ledgerTabActive);
  if (!_ledgerLoaded) { _ledgerLoaded = true; loadLedgerData(); }
}

// ── Helpers ──
function ldgFmt(n) { return '<span class="num-mono">₩ ' + Math.abs(n).toLocaleString('ko-KR') + '</span>'; }
function ldgFmtShort(n) {
  var abs = Math.abs(n);
  if (abs >= 1000000) return (abs/10000).toFixed(0) + '만';
  if (abs >= 10000) return (abs/10000).toFixed(1).replace(/\.0$/,'') + '만';
  if (abs >= 1000) return (abs/1000).toFixed(0) + 'k';
  return abs.toString();
}
function ldgMonthKey() { return _ldgYear + '-' + String(_ldgMonth).padStart(2,'0'); }
function ldgGetMonthTx() {
  var key = ldgMonthKey();
  return (_ledgerData.transactions || []).filter(function(t) { return t.date && t.date.substring(0,7) === key; });
}
function ldgIsExpense(t) { return t['대분류'] !== '수입' && t['대분류'] !== '저축'; }
function ldgSaveTx() {
  ldgBackupBeforeSave('atelier_ledger_transactions');
  localStorage.setItem('atelier_ledger_transactions', JSON.stringify(_ledgerData.transactions));
  scheduleLedgerSync();
}

// ── Month navigation ──
function ldgPrevMonth() {
  _ldgMonth--; if (_ldgMonth < 1) { _ldgMonth = 12; _ldgYear--; }
  ldgRenderMonthly();
}
function ldgNextMonth() {
  _ldgMonth++; if (_ldgMonth > 12) { _ldgMonth = 1; _ldgYear++; }
  ldgRenderMonthly();
}

// ── Main render ──
function ldgRenderMonthly() {
  // 📊 진단 로그 — 모바일 가계부 멈춤 원인 추적
  console.log('[ldgRenderMonthly] 시작', {
    hasTxs: !!_ledgerData.transactions,
    txCount: (_ledgerData.transactions || []).length,
    year: _ldgYear,
    month: _ldgMonth,
    isMobile: window._isMobile,
    forceFullView: localStorage.getItem('atelier_ldg_force_full'),
    hasKpiStrip: !!document.getElementById('ldg-kpi-strip'),
    hasTxBody: !!document.getElementById('ldg-tx-body')
  });
  if (!_ledgerData.transactions) {
    console.warn('[ldgRenderMonthly] transactions 없음 — 종료');
    return;
  }
  ldgApplyRecurringForMonth(_ldgYear, _ldgMonth);
  var el = document.getElementById('ldg-month-title');
  if (el) el.textContent = _ldgYear + ' ' + _ldgMonthNames[_ldgMonth-1];
  var prevM = _ldgMonth - 1, prevY = _ldgYear;
  if (prevM < 1) { prevM = 12; prevY--; }
  var nextM = _ldgMonth + 1, nextY = _ldgYear;
  if (nextM > 12) { nextM = 1; nextY++; }
  var pb = document.getElementById('ldg-prev-btn');
  if (pb) pb.textContent = '‹ ' + _ldgMonthKo[prevM-1];
  var nb = document.getElementById('ldg-next-btn');
  if (nb) nb.textContent = _ldgMonthKo[nextM-1] + ' ›';

  function safe(fn) { try { fn(); } catch(e) { console.error('[ldgRender]', fn.name || '?', e); } }

  // ═══ 모바일 간소 모드 — DOM 노드 90% 감소로 iOS Safari 탭 죽음 방지 ═══
  // 사용자가 명시적으로 "전체 보기" 토글하지 않은 한 모바일에선 핵심만 표시
  var isMobile = window._isMobile || window.matchMedia('(max-width: 768px)').matches;
  var forceFullView = localStorage.getItem('atelier_ldg_force_full') === 'true';

  if (isMobile && !forceFullView) {
    console.log('[ldgRenderMonthly] 모바일 간소 모드');
    // 모바일 간소 모드: KPI + 트랜잭션 표만
    safe(ldgRenderKPI);
    console.log('[ldgRenderMonthly] KPI 렌더 후', {
      stripHtml: (document.getElementById('ldg-kpi-strip')||{}).innerHTML?.substring(0,80)
    });
    safe(ldgRenderTxTable);
    // 모바일 토글 버튼 추가
    _ldgInjectMobileToggle(false);
    // 무거운 섹션 숨기기 (DOM에서 비우기)
    _ldgHideHeavySections();
    return;
  }

  // ═══ 데스크탑 풀 모드 (또는 모바일에서 토글 ON) ═══
  // 단계별 렌더로 메인 스레드 차단 최소화
  safe(ldgRenderAnnualGoal);
  safe(ldgRenderKPI);
  safe(ldgRenderTxTable);
  _ldgInjectMobileToggle(true);  // "간소 모드로" 토글

  requestAnimationFrame(function(){
    safe(ldgRenderCalendar);
    safe(ldgRenderCatGrid);
    safe(ldgRenderChecklist);
    setTimeout(function(){
      safe(ldgRenderPaymentMethods);
      safe(ldgRenderTopCats);
    }, 50);
    setTimeout(function(){
      safe(ldgRenderDonuts);
      safe(ldgRenderDailyChart);
    }, 120);
  });
}

// 모바일 토글 버튼 주입 — KPI 위쪽에 표시
function _ldgInjectMobileToggle(isFullView) {
  var existing = document.getElementById('ldg-mobile-toggle-wrap');
  if (existing) existing.remove();
  var isMobile = window._isMobile || window.matchMedia('(max-width: 768px)').matches;
  if (!isMobile) return;
  // 정확한 KPI strip ID 사용
  var kpiContainer = document.getElementById('ldg-kpi-strip');
  if (!kpiContainer) {
    console.warn('[mobile toggle] ldg-kpi-strip 못 찾음');
    return;
  }
  var wrap = document.createElement('div');
  wrap.id = 'ldg-mobile-toggle-wrap';
  wrap.style.cssText = 'margin-bottom: var(--space-2-5);text-align:center;';
  var label = isFullView ? '⚡ 간소 모드 (빠르게)' : '📊 전체 보기 (차트·캘린더 등)';
  var nextState = isFullView ? 'false' : 'true';
  wrap.innerHTML = '<button onclick="localStorage.setItem(\'atelier_ldg_force_full\',\'' + nextState + '\');location.reload()" style="font-size: var(--font-size-micro);padding: var(--space-1-5) var(--space-3);border-radius: var(--radius-md);background:#ede9fe;color:#6d28d9;border:none;font-weight:600;cursor:pointer;">' + label + '</button><p style="font-size: var(--font-size-nano);color:#94a3b8;margin-top: var(--space-1);">' + (isFullView ? '전체 보기는 모바일에서 무거울 수 있어' : '차트/캘린더/카테고리 그리드 등 추가') + '</p>';
  kpiContainer.parentNode.insertBefore(wrap, kpiContainer);
}

// 무거운 섹션들 완전 숨기기 + KPI strip 모바일 친화 — 메모리 회수
function _ldgHideHeavySections() {
  // 1) KPI strip을 모바일용 2-컬럼 그리드로 변환
  var kpiStrip = document.getElementById('ldg-kpi-strip');
  if (kpiStrip) {
    kpiStrip.classList.remove('grid-cols-5');
    kpiStrip.style.cssText = 'display:grid;grid-template-columns:repeat(2,1fr);gap:0.5rem;margin-bottom:1rem;';
  }
  // KPI 카드 자체도 모바일 친화 (작은 패딩)
  var styleId = 'ldg-mobile-style';
  if (!document.getElementById(styleId)) {
    var st = document.createElement('style');
    st.id = styleId;
    st.textContent = '#page-ledger #ldg-kpi-strip > div{padding:0.75rem !important;border-radius: var(--radius-lg) !important}' +
      '#page-ledger #ldg-kpi-strip > div p:first-child{font-size: var(--font-size-tiny) !important;margin-bottom:0.25rem !important}' +
      '#page-ledger #ldg-kpi-strip > div p:last-child{font-size: var(--font-size-body) !important;font-weight:700 !important}';
    document.head.appendChild(st);
  }
  // 2) 무거운 섹션 wrapper들 완전 숨기기 (innerHTML 비우기 X, display:none)
  // 2-1: annual goal widget
  var annualGoal = document.getElementById('ldg-annual-goal-wrap');
  if (annualGoal) annualGoal.style.display = 'none';
  // 2-2: 2-column layout (calendar/payment/checklist + 우측 컬럼)
  // KPI strip의 형제 중 .grid.grid-cols-2.gap-6.mb-8 다 숨기기
  var panel = document.getElementById('ledger-panel-monthly');
  if (panel) {
    var children = panel.children;
    for (var i = 0; i < children.length; i++) {
      var c = children[i];
      // 1) 월별 네비, KPI strip, 거래 표(tx-table-wrap), 진단 안내 빼고 다 숨기기
      if (c.id === 'ldg-kpi-strip') continue;
      if (c.contains(document.getElementById('ldg-tx-body'))) continue;
      if (c.querySelector && c.querySelector('#ldg-tx-body')) continue;
      // 월 네비 바: 첫 자식 (.flex.items-center.justify-between.mb-8)
      if (c.classList && c.classList.contains('flex') && c.classList.contains('justify-between')) continue;
      // 모바일 토글 버튼은 유지
      if (c.id === 'ldg-mobile-toggle-wrap') continue;
      c.style.display = 'none';
    }
  }
  // 3) 차트 인스턴스 명시적 destroy (있으면)
  if (typeof _ldgChartIncome !== 'undefined' && _ldgChartIncome) {
    try { _ldgChartIncome.destroy(); } catch(e){} _ldgChartIncome = null;
  }
  if (typeof _ldgChartExpense !== 'undefined' && _ldgChartExpense) {
    try { _ldgChartExpense.destroy(); } catch(e){} _ldgChartExpense = null;
  }
  if (typeof _ldgChartDaily !== 'undefined' && _ldgChartDaily) {
    try { _ldgChartDaily.destroy(); } catch(e){} _ldgChartDaily = null;
  }
}

// ── 연간 목표 진행도 위젯 ──
function ldgRenderAnnualGoal() {
  var wrap = document.getElementById('ldg-annual-goal-wrap');
  if (!wrap) return;
  var year = _ldgYear;
  var goals = ldgLoadGoals();
  var yg = goals[year] || {};
  var incGoal = yg['수입'] || 0, expGoal = yg['지출'] || 0, savGoal = yg['저축'] || 0, subGoal = yg['부업'] || 0;
  if (!incGoal && !expGoal && !savGoal) {
    wrap.innerHTML = '<div class="bg-indigo-50/40 border border-indigo-100 rounded-2xl p-3 flex items-center justify-between"><p class="text-xs text-slate-500"><span class="font-bold">' + year + '년 목표가 아직 설정되지 않았어요.</span> 설정 → 연간 목표에서 수입/지출/저축 목표를 입력하세요.</p><button onclick="switchLedgerTab(\'settings\');setTimeout(function(){ldgSetSubTab(\'goals\');},50)" class="text-[10px] px-3 py-1.5 bg-indigo-600 text-white rounded-lg font-semibold whitespace-nowrap">목표 설정</button></div>';
    return;
  }

  // 연 누적 합계 (원 단위) — excludeFromGoal 거래는 제외 (자산이동)
  var txs = _ledgerData.transactions || [];
  var incTotal = 0, expTotal = 0, savTotal = 0, subTotal = 0;
  var excludedTotal = 0, excludedCount = 0;
  txs.forEach(function(t) {
    if (!t.date || t.date.substring(0,4) !== String(year)) return;
    if (t.excludeFromGoal === true) {
      excludedTotal += (t['금액'] || 0);
      excludedCount++;
      return;
    }
    var amt = t['금액'] || 0;
    var major = t['대분류'];
    if (major === '수입') {
      incTotal += amt;
      if (t['소분류'] === '부업') subTotal += amt;
    }
    else if (major === '저축') savTotal += amt;
    else expTotal += amt;
  });
  // 만원 단위로 환산
  var incA = Math.round(incTotal / 10000);
  var expA = Math.round(expTotal / 10000);
  var savA = Math.round(savTotal / 10000);
  var subA = Math.round(subTotal / 10000);

  // 오늘 기준 연 진행률
  var now = new Date();
  var isCurYear = (year === now.getFullYear());
  var startOfYear = new Date(year, 0, 1);
  var dayOfYear = isCurYear ? (Math.floor((now - startOfYear) / 86400000) + 1) : 365;
  var daysInYr = (year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)) ? 366 : 365;
  var yearProg = Math.min(dayOfYear / daysInYr, 1);

  function bar(label, actual, goal, isGoodHigh, accent) {
    if (!goal) {
      return '<div class="flex-1 px-4 py-3 bg-white rounded-2xl border border-slate-100"><p class="text-xs font-bold text-slate-400 mb-1">' + label + '</p><p class="text-[10px] text-slate-400">목표 미설정</p></div>';
    }
    var pct = Math.min(actual / goal * 100, 100);
    var expected = goal * yearProg;
    var diff = actual - expected;
    var diffPct = goal > 0 ? Math.abs(diff) / goal * 100 : 0;
    var status, color, statusEmoji;
    if (isGoodHigh) {
      if (diff >= 0) { status = '페이스 달성'; statusEmoji = '🟢'; color = '#10b981'; }
      else if (diffPct < 5) { status = '약간 뒤처짐'; statusEmoji = '🟡'; color = '#f59e0b'; }
      else { status = '부족'; statusEmoji = '🔴'; color = '#ef4444'; }
    } else {
      if (diff <= 0) { status = '페이스 안정'; statusEmoji = '🟢'; color = '#10b981'; }
      else if (diffPct < 5) { status = '약간 초과'; statusEmoji = '🟡'; color = '#f59e0b'; }
      else { status = '초과 위험'; statusEmoji = '🔴'; color = '#ef4444'; }
    }
    var diffSign = diff >= 0 ? '+' : '';
    var diffText = diffSign + Math.round(diff).toLocaleString('ko-KR') + '만';
    return '<div class="flex-1 px-4 py-3 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]" style="border-left:3px solid ' + accent + ';">' +
      '<div class="flex justify-between items-start mb-1.5">' +
        '<span class="text-xs font-bold text-slate-700">' + label + '</span>' +
        '<span class="text-[9px] font-bold whitespace-nowrap" style="color:' + color + ';">' + statusEmoji + ' ' + status + '</span>' +
      '</div>' +
      '<div class="flex items-baseline gap-1 mb-1.5">' +
        '<span class="text-lg font-black text-slate-900" style="font-feature-settings:\'tnum\';">' + actual.toLocaleString('ko-KR') + '</span>' +
        '<span class="text-[10px] text-slate-400">/ ' + goal.toLocaleString('ko-KR') + '만</span>' +
        '<span class="text-[10px] font-semibold ml-auto" style="color:' + color + ';">' + Math.round(pct) + '%</span>' +
      '</div>' +
      '<div class="w-full h-2 bg-slate-100 rounded-full overflow-hidden relative">' +
        '<div class="h-full rounded-full" style="width:' + pct + '%;background:' + color + ';"></div>' +
        // 목표 페이스 마커 (회색 세로선)
        '<div style="position:absolute;left:' + Math.round(yearProg * 100) + '%;top:-2px;bottom:-2px;width:1.5px;background:#475569;" title="오늘까지 목표 페이스"></div>' +
      '</div>' +
      '<div class="text-[10px] mt-1.5" style="color:' + color + ';">목표 페이스 대비 ' + diffText + '</div>' +
    '</div>';
  }

  var pctYearDisplay = Math.round(yearProg * 100);
  var html = '<div class="flex items-center justify-between mb-2">' +
    '<h4 class="text-sm font-bold text-slate-800 flex items-center gap-1.5">🎯 ' + year + '년 목표 진행도</h4>' +
    '<span class="text-[10px] text-slate-400">올해 ' + pctYearDisplay + '% 경과 · 검정 마커가 목표 페이스</span>' +
  '</div>';
  html += '<div class="flex gap-3">';
  html += bar('수입', incA, incGoal, true, '#10b981');
  html += bar('지출', expA, expGoal, false, '#ef4444');
  html += bar('저축', savA, savGoal, true, '#6366f1');
  html += '</div>';

  // 부업 sub-progress (수입 하위 목표) — 설정된 경우만 표시
  if (subGoal > 0) {
    var subPct = Math.min(subA / subGoal * 100, 100);
    var subExpected = subGoal * yearProg;
    var subDiff = subA - subExpected;
    var subDiffPct = subGoal > 0 ? Math.abs(subDiff) / subGoal * 100 : 0;
    var subStatus, subColor, subEmoji;
    if (subDiff >= 0) { subStatus = '페이스 달성'; subEmoji = '🟢'; subColor = '#10b981'; }
    else if (subDiffPct < 5) { subStatus = '약간 뒤처짐'; subEmoji = '🟡'; subColor = '#f59e0b'; }
    else { subStatus = '부족'; subEmoji = '🔴'; subColor = '#ef4444'; }
    var subDiffSign = subDiff >= 0 ? '+' : '';
    var subDiffText = subDiffSign + Math.round(subDiff).toLocaleString('ko-KR') + '만';
    html += '<div class="mt-2 px-3 py-2.5 rounded-xl bg-emerald-50/40 border border-emerald-100/70">' +
      '<div class="flex items-center gap-2 mb-1.5">' +
        '<span class="text-sm">💼</span>' +
        '<span class="text-[11px] font-bold text-slate-700">└ 부업 진행도</span>' +
        '<span class="text-[9px] font-bold ml-auto whitespace-nowrap" style="color:' + subColor + ';">' + subEmoji + ' ' + subStatus + '</span>' +
      '</div>' +
      '<div class="flex items-baseline gap-1 mb-1">' +
        '<span class="text-sm font-bold text-slate-900" style="font-feature-settings:\'tnum\';">' + subA.toLocaleString('ko-KR') + '</span>' +
        '<span class="text-[10px] text-slate-400">/ ' + subGoal.toLocaleString('ko-KR') + '만</span>' +
        '<span class="text-[10px] font-semibold ml-auto" style="color:' + subColor + ';">' + Math.round(subPct) + '%</span>' +
      '</div>' +
      '<div class="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden relative">' +
        '<div class="h-full rounded-full" style="width:' + subPct + '%;background:' + subColor + ';"></div>' +
        '<div style="position:absolute;left:' + Math.round(yearProg * 100) + '%;top:-2px;bottom:-2px;width:1.5px;background:#475569;" title="오늘까지 목표 페이스"></div>' +
      '</div>' +
      '<div class="text-[10px] mt-1" style="color:' + subColor + ';">목표 페이스 대비 ' + subDiffText + '</div>' +
    '</div>';
  }

  if (excludedCount > 0) {
    var excludedMan = Math.round(excludedTotal / 10000);
    html += '<div class="mt-2 px-3 py-2 rounded-lg bg-slate-50/80 border border-slate-100 flex items-center gap-2">' +
      '<span class="text-sm">🔁</span>' +
      '<div class="flex-1 text-[10px] text-slate-500"><span class="font-bold text-slate-700">자산 이동: ' + excludedMan.toLocaleString('ko-KR') + '만 (' + excludedCount + '건)</span> · 정기 지출 목표 추적에서 제외</div>' +
    '</div>';
  }
  if (yg['메모']) {
    html += '<p class="text-[10px] text-slate-400 mt-1.5 italic">📝 ' + yg['메모'] + '</p>';
  }
  wrap.innerHTML = html;
}

// ── KPI Strip ──
function ldgRenderKPI() {
  var txs = ldgGetMonthTx();
  var income = 0, expense = 0, saving = 0;
  txs.forEach(function(t) {
    if (t['대분류'] === '수입') income += t['금액'];
    else if (t['대분류'] === '저축') saving += t['금액'];
    else expense += t['금액'];
  });
  var remaining = income - expense - saving;
  var savingRate = income > 0 ? (saving / income * 100) : 0;
  var strip = document.getElementById('ldg-kpi-strip');
  if (!strip) return;
  strip.innerHTML =
    '<div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"><p class="text-xs text-slate-500 mb-1">총수입</p><p class="text-lg font-bold text-slate-900" style="font-feature-settings:\'tnum\'">' + ldgFmt(income) + '</p></div>' +
    '<div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"><p class="text-xs text-slate-500 mb-1">총지출</p><p class="text-lg font-bold text-slate-900" style="font-feature-settings:\'tnum\'">' + ldgFmt(expense) + '</p></div>' +
    '<div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"><p class="text-xs text-slate-500 mb-1">총저축</p><p class="text-lg font-bold text-slate-900" style="font-feature-settings:\'tnum\'">' + ldgFmt(saving) + '</p></div>' +
    '<div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"><p class="text-xs text-slate-500 mb-1">잔여현금</p><p class="text-lg font-bold ' + (remaining >= 0 ? 'text-slate-900' : 'text-red-500') + '" style="font-feature-settings:\'tnum\'">' + (remaining >= 0 ? '' : '-') + ldgFmt(remaining) + '</p></div>' +
    '<div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border-l-4 border-l-indigo-500"><p class="text-xs text-slate-500 mb-1">저축률</p><p class="text-lg font-bold text-indigo-600" style="font-feature-settings:\'tnum\'">' + savingRate.toFixed(1) + '%</p></div>';
}

// ── Calendar ──
function ldgRenderCalendar() {
  var cal = document.getElementById('ldg-calendar');
  if (!cal) return;
  var txs = ldgGetMonthTx();
  // daily expense sums
  var daily = {};
  txs.forEach(function(t) {
    if (!ldgIsExpense(t)) return;
    var d = parseInt(t.date.split('-')[2]);
    daily[d] = (daily[d] || 0) + t['금액'];
  });
  var firstDay = new Date(_ldgYear, _ldgMonth - 1, 1).getDay(); // 0=Sun
  var daysInMonth = new Date(_ldgYear, _ldgMonth, 0).getDate();
  var prevDays = new Date(_ldgYear, _ldgMonth - 1, 0).getDate();
  var today = new Date();
  var isCurrentMonth = today.getFullYear() === _ldgYear && today.getMonth() + 1 === _ldgMonth;
  var todayDate = today.getDate();
  var html = '<div class="text-[10px] text-slate-400 text-center py-1">SUN</div><div class="text-[10px] text-slate-400 text-center py-1">MON</div><div class="text-[10px] text-slate-400 text-center py-1">TUE</div><div class="text-[10px] text-slate-400 text-center py-1">WED</div><div class="text-[10px] text-slate-400 text-center py-1">THU</div><div class="text-[10px] text-slate-400 text-center py-1">FRI</div><div class="text-[10px] text-slate-400 text-center py-1">SAT</div>';
  // Previous month trailing days
  for (var i = firstDay - 1; i >= 0; i--) {
    html += '<div class="h-14 border border-slate-50 rounded p-1"><span class="text-[10px] text-slate-300">' + (prevDays - i) + '</span></div>';
  }
  var noSpendDays = 0;
  for (var d = 1; d <= daysInMonth; d++) {
    var amt = daily[d] || 0;
    var isToday = isCurrentMonth && d === todayDate;
    var bg = amt > 0 ? 'bg-slate-50' : 'bg-white border border-slate-50';
    if (isToday) bg = 'bg-indigo-50 border-2 border-indigo-300';
    if (amt === 0) {
      var dayDate = new Date(_ldgYear, _ldgMonth - 1, d);
      if (dayDate <= today) noSpendDays++;
    }
    html += '<div class="h-14 ' + bg + ' rounded p-1 flex flex-col justify-between">';
    html += '<span class="text-[10px] font-bold' + (isToday ? ' text-indigo-600' : '') + '">' + d + '</span>';
    if (amt > 0) html += '<span class="text-[9px] text-indigo-600 font-bold">₩' + ldgFmtShort(amt) + '</span>';
    html += '</div>';
  }
  // Next month leading days
  var totalCells = firstDay + daysInMonth;
  var remaining = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  for (var i = 1; i <= remaining; i++) {
    html += '<div class="h-14 border border-slate-50 rounded p-1"><span class="text-[10px] text-slate-300">' + i + '</span></div>';
  }
  cal.innerHTML = html;
  var title = document.getElementById('ldg-cal-title');
  if (title) title.textContent = _ldgMonth + '월 지출 캘린더';
  var ns = document.getElementById('ldg-cal-nospend');
  if (ns) ns.textContent = '무지출: ' + noSpendDays + '일';
}

// ── Payment Methods ──
function ldgRenderPaymentMethods() {
  var el = document.getElementById('ldg-payment-methods');
  if (!el) return;
  var txs = ldgGetMonthTx();
  var sums = {};
  txs.forEach(function(t) {
    if (!ldgIsExpense(t)) return;
    var pm = t['결제수단'] || '미분류';
    sums[pm] = (sums[pm] || 0) + t['금액'];
  });
  var sorted = Object.keys(sums).sort(function(a,b) { return sums[b] - sums[a]; });
  if (sorted.length === 0) { el.innerHTML = '<p class="text-xs text-slate-400">지출 내역 없음</p>'; return; }
  el.innerHTML = sorted.map(function(pm) {
    var color = _ldgPaymentColors[pm] || '#94a3b8';
    return '<div class="flex items-center justify-between text-xs"><div class="flex items-center gap-2"><div class="w-2 h-2 rounded-full" style="background:' + color + '"></div><span class="text-slate-600">' + pm + '</span></div><span class="font-bold" style="font-feature-settings:\'tnum\'">' + ldgFmt(sums[pm]) + '</span></div>';
  }).join('');
}

// ── Checklist ──
function ldgGetCheckKey() { return 'atelier_ledger_checklist_' + ldgMonthKey(); }
function ldgLoadChecklist() {
  try { return JSON.parse(localStorage.getItem(ldgGetCheckKey())) || []; } catch(e) { return []; }
}
function ldgSaveChecklist(items) { localStorage.setItem(ldgGetCheckKey(), JSON.stringify(items)); }
function ldgRenderChecklist() {
  var el = document.getElementById('ldg-checklist');
  if (!el) return;
  var items = ldgLoadChecklist();
  if (items.length === 0) { el.innerHTML = '<p class="text-xs text-slate-400">항목 없음</p>'; return; }
  el.innerHTML = items.map(function(item, i) {
    return '<div class="flex items-center gap-2 group"><input type="checkbox" ' + (item.done ? 'checked' : '') + ' onchange="ldgToggleCheck(' + i + ')" class="w-3.5 h-3.5 rounded text-indigo-600 focus:ring-indigo-300 border-slate-200"/><span class="text-xs text-slate-600 flex-1 ' + (item.done ? 'line-through text-slate-400' : '') + '">' + item.text.replace(/</g,'&lt;') + '</span><button onclick="ldgRemoveCheck(' + i + ')" class="text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><span class="material-symbols-outlined text-sm">close</span></button></div>';
  }).join('');
}
function ldgAddCheckItem() {
  var inp = document.getElementById('ldg-checklist-input');
  if (!inp || !inp.value.trim()) return;
  var items = ldgLoadChecklist();
  items.push({ text: inp.value.trim(), done: false });
  ldgSaveChecklist(items);
  inp.value = '';
  ldgRenderChecklist();
}
function ldgToggleCheck(i) {
  var items = ldgLoadChecklist();
  if (items[i]) items[i].done = !items[i].done;
  ldgSaveChecklist(items);
  ldgRenderChecklist();
}
function ldgRemoveCheck(i) {
  var items = ldgLoadChecklist();
  items.splice(i, 1);
  ldgSaveChecklist(items);
  ldgRenderChecklist();
}

// ── Donut Charts ──
function ldgRenderDonuts() {
  var txs = ldgGetMonthTx();
  // Income donut
  var incomeByCategory = {};
  var expenseByCategory = {};
  txs.forEach(function(t) {
    if (t['대분류'] === '수입') {
      var sub = t['소분류'] || '기타';
      incomeByCategory[sub] = (incomeByCategory[sub] || 0) + t['금액'];
    } else if (t['대분류'] !== '저축') {
      var cat = t['대분류'] || '기타';
      expenseByCategory[cat] = (expenseByCategory[cat] || 0) + t['금액'];
    }
  });
  // 모바일에선 캔버스/Chart.js 대신 텍스트 요약 — 메모리 절약
  if (window._isMobile) {
    function renderMobileSummary(canvasId, dataObj, title) {
      var canvas = document.getElementById(canvasId);
      if (!canvas) return;
      var labels = Object.keys(dataObj).sort(function(a,b) { return dataObj[b] - dataObj[a]; });
      var values = labels.map(function(l) { return dataObj[l]; });
      var total = values.reduce(function(a,b){return a+b;}, 0);
      var html = '<div style="padding: var(--space-3);font-size: var(--font-size-micro);line-height:1.6;">';
      if (labels.length === 0) {
        html += '<div style="color:#94a3b8;text-align:center;padding: var(--space-5) 0;">데이터 없음</div>';
      } else {
        labels.slice(0, 6).forEach(function(label, i) {
          var pct = total > 0 ? Math.round(values[i] / total * 100) : 0;
          html += '<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom: 1px solid var(--slate-100);">';
          html += '<span style="color:#475569;">' + label + '</span>';
          html += '<span style="color:#1e293b;font-weight:600;">' + pct + '%</span>';
          html += '</div>';
        });
      }
      html += '</div>';
      // 캔버스 부모를 div로 교체
      var wrapper = canvas.parentElement;
      if (wrapper && !wrapper.querySelector('.mobile-donut-summary')) {
        canvas.style.display = 'none';
        wrapper.insertAdjacentHTML('beforeend', '<div class="mobile-donut-summary">' + html + '</div>');
      } else if (wrapper) {
        wrapper.querySelector('.mobile-donut-summary').innerHTML = html;
      }
    }
    renderMobileSummary('ldg-donut-income', incomeByCategory, '수입');
    renderMobileSummary('ldg-donut-expense', expenseByCategory, '지출');
    return;
  }
  var donutColors = ['#6366f1','#a855f7','#3b82f6','#10b981','#f59e0b','#ef4444','#ec4899','#14b8a6','#f97316','#8b5cf6'];
  function renderDonut(canvasId, dataObj, chartRef) {
    var canvas = document.getElementById(canvasId);
    if (!canvas) return null;
    var labels = Object.keys(dataObj).sort(function(a,b) { return dataObj[b] - dataObj[a]; });
    var values = labels.map(function(l) { return dataObj[l]; });
    if (chartRef) chartRef.destroy();
    if (labels.length === 0) {
      var ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px Inter';
      ctx.textAlign = 'center';
      ctx.fillText('데이터 없음', canvas.width/2, canvas.height/2);
      return null;
    }
    return new Chart(canvas, {
      type: 'doughnut',
      data: { labels: labels, datasets: [{ data: values, backgroundColor: donutColors.slice(0, labels.length), borderWidth: 0 }] },
      options: {
        responsive: true, maintainAspectRatio: true,
        cutout: '65%',
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: function(ctx) { return ctx.label + ': ' + ldgFmt(ctx.raw); } } }
        }
      },
      plugins: [{
        id: 'centerText',
        afterDraw: function(chart) {
          if (!chart.data.datasets[0].data.length) return;
          var total = chart.data.datasets[0].data.reduce(function(a,b){return a+b;},0);
          var max = Math.max.apply(null, chart.data.datasets[0].data);
          var pct = total > 0 ? Math.round(max / total * 100) : 0;
          var maxIdx = chart.data.datasets[0].data.indexOf(max);
          var label = chart.data.labels[maxIdx];
          var ctx = chart.ctx;
          ctx.save();
          ctx.textAlign = 'center';
          ctx.fillStyle = '#1e293b';
          ctx.font = 'bold 18px Inter';
          ctx.fillText(pct + '%', chart.width/2, chart.height/2 - 2);
          ctx.font = '10px Inter';
          ctx.fillStyle = '#94a3b8';
          ctx.fillText(label, chart.width/2, chart.height/2 + 14);
          ctx.restore();
        }
      }]
    });
  }
  _ldgChartIncome = renderDonut('ldg-donut-income', incomeByCategory, _ldgChartIncome);
  _ldgChartExpense = renderDonut('ldg-donut-expense', expenseByCategory, _ldgChartExpense);
}

// ── TOP Categories ──
function ldgRenderTopCats() {
  var el = document.getElementById('ldg-top-cats');
  if (!el) return;
  var txs = ldgGetMonthTx();
  var sums = {};
  txs.forEach(function(t) {
    if (!ldgIsExpense(t)) return;
    sums[t['대분류']] = (sums[t['대분류']] || 0) + t['금액'];
  });
  var sorted = Object.keys(sums).sort(function(a,b) { return sums[b] - sums[a]; }).slice(0, 4);
  if (sorted.length === 0) { el.innerHTML = '<p class="text-xs text-slate-400">지출 내역 없음</p>'; return; }
  var max = sums[sorted[0]];
  var totalExp = 0; for (var k in sums) totalExp += sums[k];
  el.innerHTML = sorted.map(function(cat) {
    var pct = totalExp > 0 ? (sums[cat] / totalExp * 100).toFixed(1) : 0;
    var barW = max > 0 ? (sums[cat] / max * 100) : 0;
    return '<div class="space-y-1"><div class="flex justify-between text-xs mb-1"><span class="text-slate-600">' + cat + ' <span class="text-slate-400">(' + pct + '%)</span></span><span class="font-bold" style="font-feature-settings:\'tnum\'">' + ldgFmt(sums[cat]) + '</span></div><div class="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden"><div class="h-full rounded-full" style="width:' + barW + '%;background:linear-gradient(90deg,#6366f1,#a855f7)"></div></div></div>';
  }).join('');
}

// ── Daily Line Chart ──
function ldgRenderDailyChart() {
  var canvas = document.getElementById('ldg-daily-chart');
  if (!canvas) return;
  var daysInMonth = new Date(_ldgYear, _ldgMonth, 0).getDate();
  var txs = ldgGetMonthTx();
  var daily = new Array(daysInMonth).fill(0);
  txs.forEach(function(t) {
    if (!ldgIsExpense(t)) return;
    var d = parseInt(t.date.split('-')[2]);
    if (d >= 1 && d <= daysInMonth) daily[d-1] += t['금액'];
  });
  // 모바일에선 캔버스 대신 간단 통계 — 메모리 절약
  if (window._isMobile) {
    var total = daily.reduce(function(a,b){return a+b;}, 0);
    var max = Math.max.apply(null, daily);
    var maxDay = daily.indexOf(max) + 1;
    var nonZeroDays = daily.filter(function(v){return v>0;}).length;
    var avg = nonZeroDays > 0 ? total / nonZeroDays : 0;
    var wrapper = canvas.parentElement;
    if (wrapper) {
      canvas.style.display = 'none';
      var existing = wrapper.querySelector('.mobile-daily-summary');
      var html = '<div class="mobile-daily-summary" style="padding: var(--space-3);font-size: var(--font-size-micro);line-height:1.6;">' +
        '<div style="display:flex;justify-content:space-between;padding: var(--space-1) 0;"><span style="color:#475569;">최고 지출일</span><span style="font-weight:700;color:#dc2626;">' + maxDay + '일 · ₩' + ldgFmt(max) + '</span></div>' +
        '<div style="display:flex;justify-content:space-between;padding: var(--space-1) 0;"><span style="color:#475569;">지출 평균</span><span style="font-weight:700;color:#1e293b;">₩' + ldgFmt(Math.round(avg)) + '</span></div>' +
        '<div style="display:flex;justify-content:space-between;padding: var(--space-1) 0;"><span style="color:#475569;">지출 일수</span><span style="font-weight:700;color:#1e293b;">' + nonZeroDays + '/' + daysInMonth + '일</span></div>' +
        '</div>';
      if (existing) existing.outerHTML = html;
      else wrapper.insertAdjacentHTML('beforeend', html);
    }
    return;
  }
  var labels = [];
  for (var i = 1; i <= daysInMonth; i++) labels.push(i + '일');
  if (_ldgChartDaily) _ldgChartDaily.destroy();
  _ldgChartDaily = new Chart(canvas, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        data: daily, fill: true,
        borderColor: '#6366f1', borderWidth: 2,
        backgroundColor: function(ctx) {
          var g = ctx.chart.ctx.createLinearGradient(0, 0, 0, ctx.chart.height);
          g.addColorStop(0, 'rgba(99,102,241,0.15)');
          g.addColorStop(1, 'rgba(99,102,241,0.01)');
          return g;
        },
        tension: 0.3, pointRadius: 0, pointHoverRadius: 4
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: function(ctx) { return ldgFmt(ctx.raw); } } } },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 9 }, maxTicksLimit: 6 } },
        y: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 9 }, callback: function(v) { return ldgFmtShort(v); } } }
      }
    }
  });
}

// ── Category Grid ──
function ldgRenderCatGrid() {
  var el = document.getElementById('ldg-cat-grid');
  if (!el) return;
  // (상단 줄글 인사이트/AI 깊은 분석 박스는 제거됨. 모든 정보는 카드 안에 직접 표시)
  var insightEl = null;
  if (insightEl) {
    var rebalance = ldgAIComputeRebalance(_ldgYear, _ldgMonth);
    var alert_ = ldgAITopAlert(_ldgYear, _ldgMonth);
    var now = new Date();
    var isCurrentMonth = (_ldgYear === now.getFullYear() && _ldgMonth === now.getMonth() + 1);
    var dayInfo = isCurrentMonth ? (now.getMonth()+1) + '월 ' + now.getDate() + '일' : '월말 기준';

    // 우선순위 1: 고정 카테고리 초과 → 크로스 보정 제안 (가장 유용)
    if (rebalance && rebalance.suggestions.length > 0) {
      var fixedNames = rebalance.fixedOver.map(function(f){ return f.cat + ' +' + ldgFmtShort(f.over); }).join(', ');
      var html = '<div class="rounded-2xl p-4" style="background:linear-gradient(135deg,#fef2f2,#fee2e2);border:1px solid #fecaca;">' +
        '<div class="flex items-start gap-3 mb-2">' +
          '<span style="font-size: var(--font-size-h2-lg)">🤖</span>' +
          '<div class="flex-1">' +
            '<p class="text-xs font-bold text-slate-800">' + dayInfo + ' · <span style="color:#dc2626;">고정 지출 초과로 약 ' + ldgFmt(rebalance.totalOver) + ' 부족</span></p>' +
            '<p class="text-[11px] text-slate-600 mt-0.5">' + fixedNames + ' (이미 발생/예정. 추가 절감 어려움)</p>' +
          '</div>' +
        '</div>' +
        '<div class="border-t border-rose-200 pt-2 mt-2">' +
          '<p class="text-[11px] font-bold text-slate-700 mb-1.5">💡 유동 카테고리에서 보정 권장 (작년/재작년 최저 사용량 기준 절감 가능액):</p>' +
          '<div class="space-y-1">';
      rebalance.suggestions.forEach(function(s) {
        var pctOfNeed = Math.min(s.saveable / rebalance.totalOver * 100, 100);
        html += '<div class="flex items-center justify-between text-[11px]">' +
          '<span class="text-slate-700"><b>' + s.cat + '</b>: 약 <b style="color:#059669;">' + ldgFmt(s.saveable) + '</b> 절감 가능 ' +
            '<span class="text-[9px] text-slate-400">(현 페이스 ' + ldgFmt(s.projected) + ' / 과거 최저 ' + ldgFmt(s.minHistorical) + ')</span></span>' +
          '<span class="text-[10px] text-slate-500">초과액의 ' + Math.round(pctOfNeed) + '%</span>' +
        '</div>';
      });
      html += '</div></div></div>';
      insightEl.innerHTML = html;
    } else if (alert_) {
      // 우선순위 2: 유동 카테고리 위험 (보정 가능한 고정 초과는 없음)
      var p = alert_.pace;
      var over2 = p.projected - p.budget;
      var bgStyle = p.status === 'danger'
        ? 'background:linear-gradient(135deg,#fef2f2,#fee2e2);border:1px solid #fecaca'
        : 'background:linear-gradient(135deg,#fffbeb,#fef3c7);border:1px solid #fde68a';
      var iconColor = p.status === 'danger' ? '#dc2626' : '#d97706';
      var overText = over2 > 0 ? ('월말 예상 <b>' + ldgFmt(p.projected) + '</b> (예산 ' + ldgFmt(p.budget) + ' 대비 <b style="color:' + iconColor + ';">+' + ldgFmt(over2) + '</b>)') : '예산 내 진행';
      var sim = ldgAISimulateSavingImpact(alert_.catName, _ldgYear, _ldgMonth);
      var simText = '';
      if (sim && sim.monthlyDelta > 5000 && sim.annualImpact > 50000) {
        simText = ' 💡 <b>AI 추천 ' + ldgFmt(sim.recommended) + '</b>로 맞추면 연 약 <b style="color:#059669;">+' + ldgFmt(sim.annualImpact) + ' 저축</b> 효과';
      }
      insightEl.innerHTML = '<div class="rounded-2xl p-4 flex items-start gap-3" style="' + bgStyle + ';">' +
        '<span style="font-size: var(--font-size-h2-lg)">🤖</span>' +
        '<div class="flex-1">' +
          '<p class="text-xs font-bold text-slate-800 mb-0.5">' + dayInfo + ' · <span style="color:' + iconColor + ';">' + alert_.catName + ' ' + p.label + '</span></p>' +
          '<p class="text-[11px] text-slate-600 leading-relaxed">' + overText + simText + '</p>' +
        '</div>' +
      '</div>';
    } else if (isCurrentMonth) {
      insightEl.innerHTML = '<div class="rounded-2xl p-4 flex items-start gap-3" style="background:linear-gradient(135deg,#f0fdf4,#dcfce7);border:1px solid #bbf7d0;">' +
        '<span style="font-size: var(--font-size-h2-lg)">🤖</span>' +
        '<div class="flex-1">' +
          '<p class="text-xs font-bold text-slate-800 mb-0.5">' + dayInfo + ' · <span style="color:#16a34a;">전 카테고리 안정 페이스</span></p>' +
          '<p class="text-[11px] text-slate-600">이대로만 가면 이번 달 잘 마무리됩니다.</p>' +
        '</div>' +
      '</div>';
    } else {
      insightEl.innerHTML = '';
    }
  }

  var cats = _ledgerData.categories || {};
  var budgets = _ledgerData.budgets || {};
  var txs = ldgGetMonthTx();
  var monthKey = ldgMonthKey();
  // Aggregate by 대분류 → 소분류
  var catSums = {};
  txs.forEach(function(t) {
    var major = t['대분류'], minor = t['소분류'] || '기타';
    if (!catSums[major]) catSums[major] = {};
    catSums[major][minor] = (catSums[major][minor] || 0) + t['금액'];
  });
  // Previous month totals by 대분류
  var prevM = _ldgMonth - 1, prevY = _ldgYear;
  if (prevM < 1) { prevM = 12; prevY--; }
  var prevKey = prevY + '-' + String(prevM).padStart(2,'0');
  var prevCatTotals = {};
  (_ledgerData.transactions || []).forEach(function(t) {
    if (t.date && t.date.substring(0,7) === prevKey) {
      prevCatTotals[t['대분류']] = (prevCatTotals[t['대분류']] || 0) + t['금액'];
    }
  });
  var html = '';
  // 카테고리 표시 순서 (사용자 지정)
  var CATEGORY_ORDER = ['수입','저축','주거비','고정비','교통비','식비','건강/의료비','여행','생필품비','자기계발비','여가비','품위유지비','관계비','경조사비','세금/보험'];
  var catKeys = Object.keys(cats);
  catKeys.sort(function(a, b) {
    var ai = CATEGORY_ORDER.indexOf(a);
    var bi = CATEGORY_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;  // 목록에 없는 카테고리는 뒤로
    if (bi === -1) return -1;
    return ai - bi;
  });
  catKeys.forEach(function(catName) {
    var subs = cats[catName] || [];
    var hasTx = !!catSums[catName];
    var totalAmt = 0;
    var subAmts = [];
    subs.forEach(function(sub) {
      var amt = (catSums[catName] && catSums[catName][sub]) || 0;
      totalAmt += amt;
      subAmts.push({ name: sub, amt: amt });
    });
    // Also add any sub-categories from transactions not in categories.json
    if (catSums[catName]) {
      Object.keys(catSums[catName]).forEach(function(sub) {
        if (subs.indexOf(sub) === -1) {
          totalAmt += catSums[catName][sub];
          subAmts.push({ name: sub, amt: catSums[catName][sub] });
        }
      });
    }
    subAmts.sort(function(a,b) { return b.amt - a.amt; });
    // Budget for this category
    // 1순위: 카테고리 단위 예산 (budgets[catName]) — 인라인 편집으로 설정
    // 2순위: 소분류 단위 예산 합계 (budgets[catName.소분류])
    var budgetTotal = 0, hasBudget = false;
    var catBudget = budgets[catName];
    if (catBudget && (catBudget.default !== undefined || (catBudget.overrides && Object.keys(catBudget.overrides).length))) {
      hasBudget = true;
      budgetTotal = catBudget.default || 0;
      if (catBudget.overrides && catBudget.overrides[monthKey] !== undefined) budgetTotal = catBudget.overrides[monthKey];
    } else {
      subs.forEach(function(sub) {
        var bKey = catName + '.' + sub;
        if (budgets[bKey]) {
          hasBudget = true;
          var bVal = budgets[bKey].default || 0;
          if (budgets[bKey].overrides && budgets[bKey].overrides[monthKey] !== undefined) bVal = budgets[bKey].overrides[monthKey];
          budgetTotal += bVal;
        }
      });
    }
    var opacity = ''; // 사용량 없어도 동일하게 표시
    // AI 페이스 뱃지
    var pace = ldgAIPaceStatus(catName, _ldgYear, _ldgMonth);
    var paceBadge = '';
    if (pace && hasTx) {
      paceBadge = '<span class="text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap" style="background:' + pace.color + '15;color:' + pace.color + ';" title="' + pace.label + ' · 월말 예상 ' + ldgFmt(pace.projected) + '">' + pace.emoji + ' ' + pace.label + '</span>';
    }
    html += '<div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]' + opacity + '">';
    html += '<div class="mb-3"><div class="flex justify-between items-start gap-2"><div class="flex items-center gap-1.5 flex-1 min-w-0"><p class="text-sm font-bold text-slate-900">' + catName + '</p>' + paceBadge + '</div><p class="text-xs text-slate-900 font-bold shrink-0" style="font-feature-settings:\'tnum\'">' + (totalAmt > 0 ? ldgFmt(totalAmt) : '—') + '</p></div>';
    // Previous month comparison
    var prevTotal = prevCatTotals[catName] || 0;
    var diff = totalAmt - prevTotal;
    if (totalAmt === 0 && prevTotal === 0) {
      // Both zero — skip
    } else {
      var isGoodUp = (catName === '수입' || catName === '저축');
      var diffColor;
      if (diff === 0) diffColor = '#94a3b8';
      else if ((diff > 0) === isGoodUp) diffColor = '#10b981';
      else diffColor = '#ef4444';
      var arrow = diff > 0 ? '▲' : (diff < 0 ? '▼' : '');
      var diffText = diff === 0 ? '전월비 ─' : arrow + ' 전월비 ' + (diff > 0 ? '+' : '') + diff.toLocaleString('ko-KR');
      html += '<p class="text-[10px] text-right mt-0.5" style="color:' + diffColor + ';font-feature-settings:\'tnum\'">' + diffText + '</p>';
    }
    html += '</div>';
    html += '<ul class="space-y-1.5 mb-3">';
    subAmts.forEach(function(s) {
      if (s.amt > 0) {
        html += '<li class="text-xs leading-relaxed tracking-wide flex justify-between"><span class="text-slate-700">' + s.name + '</span><span class="text-slate-900" style="font-feature-settings:\'tnum\'">' + ldgFmt(s.amt) + '</span></li>';
      } else {
        html += '<li class="text-xs leading-relaxed tracking-wide flex justify-between"><span class="text-slate-700">' + s.name + '</span><span class="text-slate-300">—</span></li>';
      }
    });
    html += '</ul>';
    var safeCatId = catName.replace(/[^a-zA-Z0-9가-힣]/g, '_');
    var catNameEsc = catName.replace(/'/g, "\\'");

    // ── AI 액션 박스 (페이스 주의/위험일 때만 카드 안에 직접 표시) ──
    // 예산 0 (사용자가 명시적으로 "안 쓰겠다"고 설정) 은 액션 박스 표시 X
    if (pace && hasTx && (pace.status === 'warning' || pace.status === 'danger') && (!hasBudget || budgetTotal > 0)) {
      var nowAct = new Date();
      var isCurMoAct = (_ldgYear === nowAct.getFullYear() && _ldgMonth === nowAct.getMonth() + 1);
      var daysInMAct = new Date(_ldgYear, _ldgMonth, 0).getDate();
      var dayN = isCurMoAct ? nowAct.getDate() : daysInMAct;
      var remainingDays = Math.max(daysInMAct - dayN, 0);
      var isDangerCat = pace.status === 'danger';
      var isIncSavCat = (catName === '수입' || catName === '저축');
      var catTypeBox = ldgGetCatType(catName);
      var bgCls = isDangerCat ? 'background:linear-gradient(135deg,#fef2f2,#fee2e2);border:1px solid #fecaca;'
                              : 'background:linear-gradient(135deg,#fffbeb,#fef3c7);border:1px solid #fde68a;';
      var iconClr = isDangerCat ? '#dc2626' : '#d97706';
      var over = Math.max(pace.projected - pace.budget, 0);

      html += '<div class="rounded-xl p-2.5 mb-3" style="' + bgCls + '">';
      if (isIncSavCat) {
        // 수입/저축: 부족 메시지 (월 단위)
        var shortfall = Math.max(pace.budget - pace.projected, 0);
        html += '<p class="text-[10px] font-bold mb-1" style="color:' + iconClr + ';">📍 이 페이스면 <b>' + ldgFmt(pace.projected) + '</b> 예상 <span class="font-normal">(목표 ' + ldgFmt(pace.budget) + ')</span></p>';
        if (shortfall > 0) {
          html += '<p class="text-[10px] text-slate-600">💡 이번 달 <b>' + ldgFmt(shortfall) + '</b> 부족 — 다음 달부터 보강 필요</p>';
        }
      } else if (catTypeBox === 'fixed') {
        // 고정 지출 카테고리 (주거비/고정비/세금/보험): 이미 발생 또는 자동, 일별 조절 X
        html += '<p class="text-[10px] font-bold mb-1" style="color:' + iconClr + ';">📌 <b>' + ldgFmt(totalAmt) + '</b> 발생' + (over > 0 ? ' <span class="font-normal">(예산 +' + ldgFmt(over) + ' 초과)</span>' : '') + '</p>';
        html += '<p class="text-[10px] text-slate-600">이 카테고리는 고정 지출이라 이번 달 추가 절감이 어려워요.</p>';
        if (over > 0) {
          html += '<p class="text-[10px] text-slate-600 mt-1">💡 <b>유동 카테고리</b>에서 약 <b>' + ldgFmt(over) + '</b> 절감으로 보정 권장 (인사이트 배너 참고)</p>';
          var roundedUpF = Math.ceil(totalAmt / 10000) * 10000;
          var btnBgF = isDangerCat ? 'background:#dc2626;color:white;' : 'background:#d97706;color:white;';
          html += '<button onclick="ldgSetCatBudgetTo(\'' + catNameEsc + '\',' + roundedUpF + ')" class="mt-1.5 text-[10px] font-bold px-2 py-1 rounded-lg hover:opacity-90" style="' + btnBgF + '">예산 ' + ldgFmtShort(roundedUpF) + ' 상향 적용</button>';
        }
      } else {
        // 유동 지출 카테고리: 월 단위로만 조언
        var remainingBudget = Math.max(pace.budget - totalAmt, 0);
        var alreadyOver = totalAmt > pace.budget;
        if (alreadyOver) {
          // 이미 예산 초과 사용
          var overNow = totalAmt - pace.budget;
          html += '<p class="text-[10px] font-bold mb-1" style="color:' + iconClr + ';">⚠️ 이미 예산 <b>+' + ldgFmt(overNow) + '</b> 초과 사용</p>';
          html += '<p class="text-[10px] text-slate-600">💡 다른 카테고리에서 절감하거나 예산을 상향 조정하세요</p>';
        } else if (remainingDays > 0) {
          // 예산 내 사용 중이지만 페이스 빠름
          html += '<p class="text-[10px] font-bold mb-1" style="color:' + iconClr + ';">📍 현재 페이스로는 월말 <b>' + ldgFmt(pace.projected) + '</b> 예상' + (over > 0 ? ' <span class="font-normal">(예산 +' + ldgFmt(over) + ')</span>' : '') + '</p>';
          // 페이스 분해 정보 (어떻게 이 숫자가 나왔는지 표시)
          if (pace.breakdown) {
            var bd = pace.breakdown;
            var parts = [];
            if (bd.autoTotal > 0) parts.push('자동 ' + ldgFmt(bd.autoTotal));
            if (bd.extrapolatedManual > 0) parts.push('변동 외삽 ' + ldgFmt(bd.extrapolatedManual) + ' (현재 ' + ldgFmt(bd.manualTotal) + ')');
            if (bd.futureAuto > 0) parts.push('미래자동 ' + ldgFmt(bd.futureAuto));
            if (parts.length) {
              html += '<p class="text-[9px] text-slate-400 mt-0.5">= ' + parts.join(' + ') + '</p>';
            }
          }
          html += '<p class="text-[10px] text-slate-600 mt-1">💡 남은 ' + remainingDays + '일 동안 총 <b>' + ldgFmt(remainingBudget) + '</b> 이내로 사용하면 예산 OK</p>';
        }
        if (over > 0 && pace.projected > 0) {
          var roundedUp = Math.ceil(Math.max(pace.projected, totalAmt) / 10000) * 10000;
          var btnBg = isDangerCat ? 'background:#dc2626;color:white;' : 'background:#d97706;color:white;';
          html += '<button onclick="ldgSetCatBudgetTo(\'' + catNameEsc + '\',' + roundedUp + ')" class="mt-1.5 text-[10px] font-bold px-2 py-1 rounded-lg hover:opacity-90" style="' + btnBg + '">예산 ' + ldgFmtShort(roundedUp) + ' 상향 적용</button>';
        }
      }
      html += '</div>';
    }
    if (_ldgBudgetEditingCat === catName) {
      // 인라인 편집 모드
      var curVal = hasBudget ? Math.round(budgetTotal / 10000) : ''; // 만원 단위
      html += '<div class="pt-2 border-t border-slate-50">' +
        '<div class="flex items-center gap-1">' +
          '<span class="text-[10px] text-slate-400 shrink-0">예산</span>' +
          '<input type="text" id="ldg-cat-budget-input-' + safeCatId + '" value="' + curVal + '" placeholder="만원" class="flex-1 min-w-0 text-[10px] px-1.5 py-0.5 border border-indigo-200 rounded outline-none focus:ring-1 focus:ring-indigo-300 text-right" onkeydown="if(event.key===\'Enter\'){event.preventDefault();ldgSaveCatBudget(\'' + catNameEsc + '\');}else if(event.key===\'Escape\'){ldgCancelEditCatBudget();}"/>' +
          '<span class="text-[10px] text-slate-400 shrink-0">만</span>' +
          '<button onclick="ldgSaveCatBudget(\'' + catNameEsc + '\')" class="p-0.5 rounded bg-indigo-600 text-white shrink-0" title="저장"><span class="material-symbols-outlined" style="font-size: var(--font-size-meta)">check</span></button>' +
          '<button onclick="ldgCancelEditCatBudget()" class="p-0.5 rounded hover:bg-slate-100 text-slate-400 shrink-0" title="취소"><span class="material-symbols-outlined" style="font-size: var(--font-size-meta)">close</span></button>' +
        '</div>' +
      '</div>';
    } else if (hasBudget && budgetTotal === 0) {
      // 예산 명시적으로 0 — "이번 달 사용 안 함" 의도 (AI 추천 표시 X)
      var zeroUsed = totalAmt > 0;
      var zeroColor = zeroUsed ? '#ef4444' : '#10b981';
      var zeroLabel = zeroUsed ? ldgFmt(totalAmt) + ' 사용됨' : '✓ 0 유지';
      html += '<div class="pt-2 border-t border-slate-50">' +
        '<div class="cursor-pointer hover:bg-indigo-50/20 -mx-5 px-5 py-1.5 transition-colors" onclick="ldgStartEditCatBudget(\'' + catNameEsc + '\')" title="클릭하여 예산 수정">' +
          '<div class="flex justify-between items-center text-[10px] font-medium">' +
            '<span class="text-slate-400">예산 <b>0</b> (사용 안 함) <span class="text-[9px] text-slate-300">✏️</span></span>' +
            '<span style="color:' + zeroColor + ';font-weight:700;">' + zeroLabel + '</span>' +
          '</div>' +
        '</div>' +
      '</div>';
    } else if (hasBudget && budgetTotal > 0) {
      var remaining = budgetTotal - totalAmt;
      var color = remaining >= 0 ? '#10b981' : '#ef4444';
      var pct = Math.min(totalAmt / budgetTotal * 100, 100);
      var remLabel = remaining >= 0 ? '남음' : '초과';
      var remDisplay = ldgFmtShort(Math.abs(remaining));
      var aiRecEdit = ldgAIRecommendBudget(catName, _ldgYear, _ldgMonth);
      html += '<div class="pt-2 border-t border-slate-50">';
      // 예산 바 (클릭하면 편집)
      html += '<div class="cursor-pointer hover:bg-indigo-50/20 -mx-5 px-5 py-1.5 transition-colors" onclick="ldgStartEditCatBudget(\'' + catNameEsc + '\')" title="클릭하여 예산 수정">' +
        '<div class="flex justify-between text-[10px] font-medium mb-1"><span class="text-slate-400">예산 ' + ldgFmtShort(budgetTotal) + ' <span class="text-[9px] text-slate-300">✏️</span></span><span style="color:' + color + ';font-weight:700;font-feature-settings:\'tnum\'">' + remDisplay + ' ' + remLabel + '</span></div>' +
        '<div class="w-full h-1 bg-slate-100 rounded-full"><div class="h-full rounded-full" style="width:' + pct + '%;background:' + color + '"></div></div>' +
      '</div>';
      // AI 추천 (예산 있어도 표시 - 일관성). 추천 = 0이면 표시 X (이미 목표 초과)
      if (aiRecEdit && aiRecEdit > 0 && aiRecEdit !== budgetTotal) {
        html += '<button onclick="ldgApplyAIRecommendBudget(\'' + catNameEsc + '\')" class="mt-2 text-[10px] text-purple-600 hover:text-purple-800 font-semibold flex items-center gap-0.5" title="올해 목표(' + ldgFmtShort((ldgLoadGoals()[_ldgYear]||{})['지출']*10000||0) + ') 달성을 위한 카테고리 분배 추천">' +
          '<span style="font-size: var(--font-size-micro)">🤖</span> 추천 ' + ldgFmtShort(aiRecEdit) + '로 변경' +
        '</button>';
      }
      html += '</div>';
    } else {
      // 예산 미설정 - AI 추천 + 설정 버튼
      var aiRec = ldgAIRecommendBudget(catName, _ldgYear, _ldgMonth);
      html += '<div class="pt-2 border-t border-slate-50 flex items-center justify-between gap-1">';
      html += '<button onclick="ldgStartEditCatBudget(\'' + catNameEsc + '\')" class="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold flex items-center gap-0.5">' +
          '<span class="material-symbols-outlined" style="font-size: var(--font-size-meta)">add</span> 예산 설정' +
        '</button>';
      if (aiRec && aiRec > 0) {
        html += '<button onclick="ldgApplyAIRecommendBudget(\'' + catNameEsc + '\')" class="text-[10px] text-purple-600 hover:text-purple-800 font-semibold flex items-center gap-0.5" title="올해 목표(' + ldgFmtShort((ldgLoadGoals()[_ldgYear]||{})['지출']*10000||0) + ') 달성을 위한 카테고리 분배 추천">' +
          '<span style="font-size: var(--font-size-micro)">🤖</span> 추천 ' + ldgFmtShort(aiRec) + ' 적용' +
        '</button>';
      }
      html += '</div>';
    }
    html += '</div>';
  });
  el.innerHTML = html;
}

// ============================================
// ── AI 인사이트 (카드 내장형 코치) ──
// ============================================
// 카테고리 타입: 'fixed' (이미 정해진 지출, 일별 조절 X) vs 'flex' (월 단위 조절 가능)
var LDG_CATEGORY_TYPE = {
  '수입': 'fixed',        // 월급 등 정해진 수입
  '저축': 'fixed',        // 자동이체
  '주거비': 'fixed',      // 월세/관리비 등 정해진 비용
  '고정비': 'fixed',      // 구독, 통신비 등
  '세금/보험': 'fixed',   // 보험료, 세금 등
  '교통비': 'flex',
  '식비': 'flex',
  '건강/의료비': 'flex',
  '여행': 'flex',
  '생필품비': 'flex',
  '자기계발비': 'flex',
  '여가비': 'flex',
  '품위유지비': 'flex',
  '관계비': 'flex',
  '경조사비': 'flex'
};
function ldgGetCatType(catName) {
  return LDG_CATEGORY_TYPE[catName] || 'flex';
}

// 작년/재작년 동월 합계 배열 (이 카테고리) — excludeFromGoal 거래는 학습에서 제외
function ldgAIHistoricalSameMonth(catName, year, month) {
  var txs = _ledgerData.transactions || [];
  var results = [];
  for (var y = year - 2; y < year; y++) {
    var mk = y + '-' + String(month).padStart(2,'0');
    var total = 0;
    txs.forEach(function(t) {
      if (t.excludeFromGoal === true) return;
      if (t.date && t.date.substring(0,7) === mk && t['대분류'] === catName) {
        total += (t['금액'] || 0);
      }
    });
    if (total > 0) results.push({ year: y, amount: total });
  }
  return results;
}

// 계절 패턴 분석: 카테고리별 월평균 + 월별 가중치 (excludeFromGoal 제외)
function ldgAISeasonalAnalysis(catName) {
  var txs = _ledgerData.transactions || [];
  var thisYear = new Date().getFullYear();
  var yearMonthSums = {};
  for (var y = thisYear - 2; y < thisYear; y++) {
    yearMonthSums[y] = {};
    for (var m = 1; m <= 12; m++) yearMonthSums[y][m] = 0;
  }
  txs.forEach(function(t) {
    if (t.excludeFromGoal === true) return;
    if (!t.date || t['대분류'] !== catName) return;
    var yr = parseInt(t.date.substring(0, 4));
    var mo = parseInt(t.date.substring(5, 7));
    if (yearMonthSums[yr] === undefined) return;
    yearMonthSums[yr][mo] += (t['금액'] || 0);
  });

  // 각 연도의 월평균 (데이터 있는 달만)
  var yearMonthlyAvgs = {};
  Object.keys(yearMonthSums).forEach(function(y) {
    var total = 0, count = 0;
    for (var m = 1; m <= 12; m++) {
      if (yearMonthSums[y][m] > 0) { total += yearMonthSums[y][m]; count++; }
    }
    yearMonthlyAvgs[y] = count > 0 ? total / count : 0;
  });

  // 월별 가중치 (각 달 / 그 해 월평균) 의 평균
  var monthWeights = {};
  for (var m = 1; m <= 12; m++) {
    var sum = 0, cnt = 0;
    Object.keys(yearMonthSums).forEach(function(y) {
      if (yearMonthlyAvgs[y] > 0 && yearMonthSums[y][m] > 0) {
        sum += yearMonthSums[y][m] / yearMonthlyAvgs[y];
        cnt++;
      }
    });
    monthWeights[m] = cnt > 0 ? sum / cnt : 1.0;
  }

  // 종합 월평균 (최근 연도 1.5배 가중)
  var monthlyAvg = 0, wSum = 0;
  var years = Object.keys(yearMonthlyAvgs).sort();
  years.forEach(function(y, i) {
    if (yearMonthlyAvgs[y] > 0) {
      var w = (i === years.length - 1) ? 1.5 : 1;
      monthlyAvg += yearMonthlyAvgs[y] * w;
      wSum += w;
    }
  });
  monthlyAvg = wSum > 0 ? monthlyAvg / wSum : 0;

  return { monthlyAvg: monthlyAvg, monthWeights: monthWeights, dataYears: years };
}

// 추천 예산 (원 단위) - "올해 목표 - 누적 - 사용자 override 커밋 = 가용 풀 → 미커밋 슬롯에 작년 비중으로 분배"
// 사용자 요구: 사용자가 명시적으로 설정한 월별 override는 "커밋"으로 존중하고 남은 풀만 재분배
function ldgAIRecommendBudget(catName, year, month) {
  // 수입/저축은 작년/재작년 같은 달 평균 × 계절 가중치 그대로
  if (catName === '수입' || catName === '저축') {
    var an = ldgAISeasonalAnalysis(catName);
    if (!an.monthlyAvg) return null;
    return Math.round(an.monthlyAvg * (an.monthWeights[month] || 1.0));
  }

  // 지출 카테고리: 목표 기반 분배
  var goals = ldgLoadGoals();
  var yearGoal = goals[year] || {};
  var expenseGoalMan = yearGoal['지출'] || 0;

  // 목표 미설정 → 폴백: 작년 평균
  if (!expenseGoalMan) {
    var anB = ldgAISeasonalAnalysis(catName);
    if (!anB.monthlyAvg) return null;
    return Math.round(anB.monthlyAvg * (anB.monthWeights[month] || 1.0));
  }
  var expenseGoal = expenseGoalMan * 10000;

  // 올해 누적 지출 (자산이동 제외, 수입/저축 제외)
  var txs = _ledgerData.transactions || [];
  var ytdExpense = 0;
  txs.forEach(function(t) {
    if (t.excludeFromGoal === true) return;
    if (!t.date || t.date.substring(0,4) !== String(year)) return;
    var major = t['대분류'];
    if (major === '수입' || major === '저축') return;
    ytdExpense += (t['금액'] || 0);
  });

  // 사용자 명시적 override 합산 (현재월 + 미래월, 추천 슬롯 catName/month 만 제외)
  // major-level override 우선, 없으면 sub-level override 합산. default는 커밋 아님(유동).
  var cats = _ledgerData.categories || {};
  var budgetsObj = _ledgerData.budgets || {};
  function overrideFor(c, m) {
    var mk = String(year) + '-' + (m < 10 ? '0' + m : String(m));
    var cb = budgetsObj[c];
    if (cb && cb.overrides && cb.overrides[mk] !== undefined) {
      return cb.overrides[mk];
    }
    var subs = cats[c] || [];
    var tot = 0, any = false;
    subs.forEach(function(sub) {
      var bk = c + '.' + sub;
      if (budgetsObj[bk] && budgetsObj[bk].overrides && budgetsObj[bk].overrides[mk] !== undefined) {
        any = true;
        tot += budgetsObj[bk].overrides[mk];
      }
    });
    return any ? tot : null;
  }

  var committedOverrides = 0;
  var committedSlots = {};  // "cat|month" -> true
  Object.keys(cats).forEach(function(c) {
    if (c === '수입' || c === '저축') return;
    for (var m = month; m <= 12; m++) {
      if (c === catName && m === month) continue; // 추천 대상 슬롯은 풀에 포함
      var ov = overrideFor(c, m);
      if (ov !== null) {
        committedOverrides += ov;
        committedSlots[c + '|' + m] = true;
      }
    }
  });

  // 가용 풀 = 목표 - 누적 - 커밋된 override (음수 보호)
  var available = Math.max(expenseGoal - ytdExpense - committedOverrides, 0);
  if (available <= 0) return 0;

  // 미커밋 슬롯들 사이에서 작년 패턴 기반 비중 분배
  var thisAn = ldgAISeasonalAnalysis(catName);
  if (!thisAn.monthlyAvg) {
    // 이 카테고리 작년 데이터 없음 → 미커밋 슬롯 수로 균등 분배 (보수적)
    var uncommittedCount = 0;
    Object.keys(cats).forEach(function(c) {
      if (c === '수입' || c === '저축') return;
      for (var m = month; m <= 12; m++) {
        if (!committedSlots[c + '|' + m]) uncommittedCount++;
      }
    });
    return uncommittedCount > 0 ? Math.round(available / uncommittedCount) : 0;
  }
  var thisSlotWeight = thisAn.monthlyAvg * (thisAn.monthWeights[month] || 1.0);

  // 모든 미커밋 슬롯의 가중치 합 (cat × 미래월 전체)
  var totalUncommittedWeight = 0;
  Object.keys(cats).forEach(function(c) {
    if (c === '수입' || c === '저축') return;
    var a = ldgAISeasonalAnalysis(c);
    if (!a.monthlyAvg) return;
    for (var m = month; m <= 12; m++) {
      if (committedSlots[c + '|' + m]) continue;
      totalUncommittedWeight += a.monthlyAvg * (a.monthWeights[m] || 1.0);
    }
  });
  if (totalUncommittedWeight === 0) return Math.round(available * 0.1);

  return Math.max(Math.round(available * thisSlotWeight / totalUncommittedWeight), 0);
}

// 시즌 가중치 텍스트 (e.g., "+50% 평월 대비")
function ldgAISeasonLabel(catName, month) {
  var analysis = ldgAISeasonalAnalysis(catName);
  var w = analysis.monthWeights[month];
  if (!w || Math.abs(w - 1) < 0.1) return ''; // 평월
  var pct = Math.round((w - 1) * 100);
  return pct > 0 ? '+' + pct + '%' : pct + '%';
}

// 카테고리의 이번달 현재 사용 합계 (원) — excludeFromGoal 거래 제외 (페이스 계산용)
function ldgAICurrentMonthTotal(catName, year, month) {
  var txs = _ledgerData.transactions || [];
  var mk = year + '-' + String(month).padStart(2,'0');
  var total = 0;
  txs.forEach(function(t) {
    if (t.excludeFromGoal === true) return;
    if (t.date && t.date.substring(0,7) === mk && t['대분류'] === catName) {
      total += (t['금액'] || 0);
    }
  });
  return total;
}

// 페이스 상태: { status, color, emoji, label, projected }
function ldgAIPaceStatus(catName, year, month) {
  var budgets = _ledgerData.budgets || {};
  var cats = _ledgerData.categories || {};
  var monthKey = year + '-' + String(month).padStart(2,'0');
  // 예산 계산: ldgRenderCatGrid와 동일한 로직 (카테고리 단위 → 소분류 합 → AI 추천 순)
  var budget = 0;
  var catBudget = budgets[catName];
  if (catBudget && (catBudget.default !== undefined || (catBudget.overrides && Object.keys(catBudget.overrides).length))) {
    budget = catBudget.default || 0;
    if (catBudget.overrides && catBudget.overrides[monthKey] !== undefined) budget = catBudget.overrides[monthKey];
  } else {
    var subs = cats[catName] || [];
    subs.forEach(function(sub) {
      var bKey = catName + '.' + sub;
      if (budgets[bKey]) {
        var bVal = budgets[bKey].default || 0;
        if (budgets[bKey].overrides && budgets[bKey].overrides[monthKey] !== undefined) bVal = budgets[bKey].overrides[monthKey];
        budget += bVal;
      }
    });
  }
  if (!budget) budget = ldgAIRecommendBudget(catName, year, month) || 0;
  if (!budget) return null;

  var monthTotal = ldgAICurrentMonthTotal(catName, year, month);
  var now = new Date();
  var isCurrentMonth = (year === now.getFullYear() && month === now.getMonth() + 1);
  var daysInMonth = new Date(year, month, 0).getDate();
  var dayProgress = isCurrentMonth ? Math.max(now.getDate(), 1) / daysInMonth : 1.0;

  var catTypeForPace = ldgGetCatType(catName);
  var projected;
  var autoTotal = 0, manualTotal = 0, futureAuto = 0, extrapolatedManual = 0;
  if (catTypeForPace === 'fixed' || !isCurrentMonth) {
    projected = monthTotal;
  } else {
    // 유동 카테고리: 자동(고정) 거래는 외삽 X, 변동 거래만 외삽
    var txs = _ledgerData.transactions || [];
    var appliedRecIds = {}; // 이번 달에 이미 거래로 적용된 recurringId 수집
    txs.forEach(function(t) {
      if (t.excludeFromGoal === true) return;
      if (!t.date || t.date.substring(0,7) !== monthKey) return;
      if (t.recurringId) appliedRecIds[t.recurringId] = true;
      if (t['대분류'] !== catName) return;
      var isAuto = (t['비고'] === '자동(고정)' || !!t.recurringId);
      if (isAuto) autoTotal += (t['금액'] || 0);
      else manualTotal += (t['금액'] || 0);
    });
    // 미래 예정 자동 거래 (recurring 중 ① 이번 달 거래로 아직 등록 안 됨 ② dayOfMonth > 오늘)
    // 이미 등록된 recurring은 자동거래 합계(autoTotal)에 이미 반영되어 있으므로 중복 카운트 방지
    var recurringItems = _ledgerData.recurring || [];
    var currentDay = now.getDate();
    recurringItems.forEach(function(r) {
      if (r['대분류'] !== catName) return;
      if (r.recId && appliedRecIds[r.recId]) return; // 이미 거래로 등록됨 → autoTotal에 반영
      if (r.dayOfMonth <= currentDay) return; // 이미 지난 날짜인데 등록 안 됨 = 누락 (이번 달 더 안 일어날 듯)
      futureAuto += (r['금액'] || 0);
    });
    extrapolatedManual = manualTotal > 0 ? manualTotal / dayProgress : 0;
    projected = Math.round(autoTotal + extrapolatedManual + futureAuto);
  }
  var spendRatio = budget > 0 ? projected / budget : 0;
  var ratio = spendRatio;
  var breakdown = { autoTotal: autoTotal, manualTotal: manualTotal, extrapolatedManual: Math.round(extrapolatedManual), futureAuto: futureAuto };

  var isIncomeSavings = (catName === '수입' || catName === '저축');
  if (isIncomeSavings) {
    if (ratio >= 0.95) return { status: 'good', color: '#10b981', emoji: '🟢', label: '목표 페이스', projected: projected, budget: budget, breakdown: breakdown };
    if (ratio >= 0.75) return { status: 'warning', color: '#f59e0b', emoji: '🟡', label: '뒤처짐', projected: projected, budget: budget, breakdown: breakdown };
    return { status: 'danger', color: '#ef4444', emoji: '🔴', label: '미달 위험', projected: projected, budget: budget, breakdown: breakdown };
  } else {
    if (ratio <= 0.95) return { status: 'good', color: '#10b981', emoji: '🟢', label: '안정', projected: projected, budget: budget, breakdown: breakdown };
    if (ratio <= 1.1) return { status: 'warning', color: '#f59e0b', emoji: '🟡', label: '주의', projected: projected, budget: budget, breakdown: breakdown };
    return { status: 'danger', color: '#ef4444', emoji: '🔴', label: '초과 위험', projected: projected, budget: budget, breakdown: breakdown };
  }
}

// 시뮬레이션: 이 카테고리를 추천대로 맞추면 연 환산 영향 (원 단위)
// 예: 5월에 식비 추천 45만, 실제 페이스 60만 → 월 15만 절약, 5월~12월 8개월 × 15 = 120만 연간 영향
function ldgAISimulateSavingImpact(catName, year, month) {
  var pace = ldgAIPaceStatus(catName, year, month);
  if (!pace) return null;
  var rec = ldgAIRecommendBudget(catName, year, month);
  if (!rec) return null;
  var monthlyDelta = pace.projected - rec; // + 면 절약 가능, - 면 추가 지출 가능
  var now = new Date();
  var isCurYear = (year === now.getFullYear());
  var remainingMonths = isCurYear ? (12 - now.getMonth()) : 12; // 현재 월 포함
  return {
    monthlyDelta: monthlyDelta,
    remainingMonths: remainingMonths,
    annualImpact: monthlyDelta * remainingMonths, // 절약 가능액 (+) 또는 추가 필요액 (-)
    recommended: rec,
    projected: pace.projected
  };
}

// 크로스-카테고리 보정 제안: 고정 카테고리에서 초과가 발생하면 유동 카테고리에서 절감 가능액 계산
// 사용자가 진짜 원하는 것: "세금이 +137만 늘었으니 품위유지비/관계비/여가비에서 -137만 줄이세요"
function ldgAIComputeRebalance(year, month) {
  var cats = _ledgerData.categories || {};
  var fixedOver = []; // 고정 카테고리 중 초과
  var flexCats = []; // 유동 카테고리 분석

  Object.keys(cats).forEach(function(cat) {
    if (cat === '수입' || cat === '저축') return;
    var pace = ldgAIPaceStatus(cat, year, month);
    if (!pace) return;
    var type = ldgGetCatType(cat);
    var over = pace.projected - pace.budget;

    if (type === 'fixed' && over > 0) {
      fixedOver.push({ cat: cat, over: over, projected: pace.projected, budget: pace.budget, status: pace.status });
    } else if (type === 'flex') {
      // 유동 카테고리에서 절감 가능액 추정
      // = 현재 페이스 - 작년/재작년 같은 달 최저값 (가장 적게 쓴 사례)
      var historical = ldgAIHistoricalSameMonth(cat, year, month);
      var minHistorical = 0;
      if (historical.length > 0) {
        minHistorical = Math.min.apply(null, historical.map(function(h){ return h.amount; }));
      }
      var saveable = Math.max(pace.projected - minHistorical, 0);
      if (saveable >= 50000) { // 5만 이상 절감 가능할 때만 추천
        flexCats.push({
          cat: cat,
          saveable: saveable,
          projected: pace.projected,
          minHistorical: minHistorical,
          paceStatus: pace.status
        });
      }
    }
  });

  if (fixedOver.length === 0) return null;

  // 총 초과액
  var totalOver = fixedOver.reduce(function(s,f){ return s+f.over; }, 0);
  // 절감 가능액이 큰 순서로 정렬
  flexCats.sort(function(a,b){ return b.saveable - a.saveable; });

  return {
    fixedOver: fixedOver,
    totalOver: totalOver,
    suggestions: flexCats.slice(0, 4) // 상위 4개
  };
}

// 가장 주의 필요한 카테고리 찾기 (지출 위주, 위험도 높은 순)
function ldgAITopAlert(year, month) {
  var cats = _ledgerData.categories || {};
  var alerts = [];
  Object.keys(cats).forEach(function(catName) {
    if (catName === '수입' || catName === '저축') return; // 지출 카테고리만
    var pace = ldgAIPaceStatus(catName, year, month);
    if (!pace) return;
    if (pace.status === 'danger') alerts.push({ catName: catName, pace: pace, severity: 2 });
    else if (pace.status === 'warning') alerts.push({ catName: catName, pace: pace, severity: 1 });
  });
  alerts.sort(function(a, b) {
    if (b.severity !== a.severity) return b.severity - a.severity;
    return (b.pace.projected - b.pace.budget) - (a.pace.projected - a.pace.budget);
  });
  return alerts[0] || null;
}

// ── 카테고리 카드에서 예산 인라인 편집 ──
function ldgStartEditCatBudget(catName) {
  _ldgBudgetEditingCat = catName;
  ldgRenderCatGrid();
  setTimeout(function() {
    var safe = catName.replace(/[^a-zA-Z0-9가-힣]/g, '_');
    var input = document.getElementById('ldg-cat-budget-input-' + safe);
    if (input) { input.focus(); input.select(); }
  }, 50);
}

function ldgCancelEditCatBudget() {
  _ldgBudgetEditingCat = null;
  ldgRenderCatGrid();
}

// 특정 금액으로 이번 달 예산 즉시 설정 (액션 박스의 "예산 상향 적용" 버튼용)
function ldgSetCatBudgetTo(catName, amountWon) {
  if (!amountWon || amountWon <= 0) return;
  if (!_ledgerData.budgets) _ledgerData.budgets = {};
  if (!_ledgerData.budgets[catName]) _ledgerData.budgets[catName] = { default: 0, overrides: {} };
  if (!_ledgerData.budgets[catName].overrides) _ledgerData.budgets[catName].overrides = {};
  var monthKey = ldgMonthKey();
  _ledgerData.budgets[catName].overrides[monthKey] = amountWon;
  if (!_ledgerData.budgets[catName].default) _ledgerData.budgets[catName].default = amountWon;
  ldgSaveBudgets();
  ldgRenderCatGrid();
  if (typeof showSyncToast === 'function') {
    showSyncToast('<span class="material-symbols-outlined text-sm mr-1">check_circle</span> ' + catName + ' 예산 ' + ldgFmt(amountWon) + ' 적용됨');
  }
}

// AI 추천 예산을 이번 달에 바로 적용
function ldgApplyAIRecommendBudget(catName) {
  var rec = ldgAIRecommendBudget(catName, _ldgYear, _ldgMonth);
  if (!rec || rec <= 0) { alert('추천할 데이터가 부족해요.'); return; }
  if (!_ledgerData.budgets) _ledgerData.budgets = {};
  if (!_ledgerData.budgets[catName]) _ledgerData.budgets[catName] = { default: 0, overrides: {} };
  if (!_ledgerData.budgets[catName].overrides) _ledgerData.budgets[catName].overrides = {};
  var monthKey = ldgMonthKey();
  _ledgerData.budgets[catName].overrides[monthKey] = rec;
  if (!_ledgerData.budgets[catName].default) _ledgerData.budgets[catName].default = rec;
  ldgSaveBudgets();
  ldgRenderCatGrid();
  if (typeof showSyncToast === 'function') {
    showSyncToast('<span class="material-symbols-outlined text-sm mr-1">auto_awesome</span> AI 추천 적용: ' + catName + ' ' + ldgFmtShort(rec));
  }
}

function ldgSaveCatBudget(catName) {
  var safe = catName.replace(/[^a-zA-Z0-9가-힣]/g, '_');
  var input = document.getElementById('ldg-cat-budget-input-' + safe);
  if (!input) return;
  var raw = (input.value || '').replace(/[^0-9.]/g, '');
  if (!_ledgerData.budgets) _ledgerData.budgets = {};
  var monthKey = ldgMonthKey();
  if (raw === '') {
    // 빈 값 → 이번 달 override 제거 (예산 미설정 = AI 추천 대상으로 복귀)
    if (_ledgerData.budgets[catName] && _ledgerData.budgets[catName].overrides) {
      delete _ledgerData.budgets[catName].overrides[monthKey];
      var b = _ledgerData.budgets[catName];
      var hasDef = b.default && b.default > 0;
      var hasOv = b.overrides && Object.keys(b.overrides).length > 0;
      if (!hasDef && !hasOv) delete _ledgerData.budgets[catName];
    }
  } else {
    // 숫자 입력 (0 포함) → 명시적 설정 (만원 단위)
    var manVal = parseFloat(raw) || 0;
    var amt = Math.round(manVal * 10000);
    if (!_ledgerData.budgets[catName]) _ledgerData.budgets[catName] = { default: 0, overrides: {} };
    if (!_ledgerData.budgets[catName].overrides) _ledgerData.budgets[catName].overrides = {};
    _ledgerData.budgets[catName].overrides[monthKey] = amt; // 0도 명시적 저장
    // 0은 default로 복사 안 함 (이번 달 한정 의도일 수 있음). 양수만 default 채움
    if (!_ledgerData.budgets[catName].default && amt > 0) _ledgerData.budgets[catName].default = amt;
  }
  ldgSaveBudgets();
  _ldgBudgetEditingCat = null;
  ldgRenderCatGrid();
}

// ── Transaction Table ──
function ldgGetFilteredTx() {
  var txs = ldgGetMonthTx();
  var search = (document.getElementById('ldg-tx-search') || {}).value || '';
  if (search) {
    var s = search.toLowerCase();
    txs = txs.filter(function(t) {
      return (t['세부사항'] || '').toLowerCase().indexOf(s) >= 0 || (t['비고'] || '').toLowerCase().indexOf(s) >= 0;
    });
  }
  // Column filters
  var cf = _ldgColFilters;
  if (cf.date.length > 0) txs = txs.filter(function(t) { return cf.date.indexOf(t.date) >= 0; });
  if (cf.major.length > 0) txs = txs.filter(function(t) { return cf.major.indexOf(t['대분류']) >= 0; });
  if (cf.minor.length > 0) txs = txs.filter(function(t) { return cf.minor.indexOf(t['소분류']) >= 0; });
  if (cf.payment.length > 0) txs = txs.filter(function(t) { return cf.payment.indexOf(t['결제수단']) >= 0; });
  if (cf.amount.min !== null) txs = txs.filter(function(t) { return t['금액'] >= cf.amount.min; });
  if (cf.amount.max !== null) txs = txs.filter(function(t) { return t['금액'] <= cf.amount.max; });
  function _ldgIdTs(id) {
    if (!id) return 0;
    var m = String(id).match(/(\d{10,})/);
    return m ? parseInt(m[1], 10) : 0;
  }
  txs.sort(function(a, b) {
    var va, vb;
    if (_ldgSortField === 'date') { va = a.date; vb = b.date; }
    else if (_ldgSortField === 'amount') { va = a['금액']; vb = b['금액']; }
    else { va = a['대분류']; vb = b['대분류']; }
    if (va < vb) return _ldgSortAsc ? -1 : 1;
    if (va > vb) return _ldgSortAsc ? 1 : -1;
    // Tiebreaker: 같은 정렬 키일 때 최근 등록된 항목이 위로
    return _ldgIdTs(b.id) - _ldgIdTs(a.id);
  });
  return txs;
}

function ldgRenderTxTable() {
  var body = document.getElementById('ldg-tx-body');
  if (!body) return;
  var txs = ldgGetFilteredTx();
  var html = '';
  // Always show input row at top
  html += ldgInputRowHTML(_ldgEditingId && _ldgEditingId !== 'new' ? (_ledgerData.transactions||[]).find(function(t){return t.id===_ldgEditingId;}) : null);

  // ═══ 모바일 가상 스크롤 — 최근 30개만 렌더 ═══
  var isMobile = window._isMobile || window.matchMedia('(max-width: 768px)').matches;
  var renderLimit = isMobile ? 30 : Infinity;
  var shown = 0;
  var hidden = 0;
  var visibleTxs = [];
  for (var i = 0; i < txs.length; i++) {
    var t = txs[i];
    if (_ldgEditingId === t.id) continue;
    if (shown >= renderLimit) { hidden++; continue; }
    visibleTxs.push(t);
    shown++;
  }

  visibleTxs.forEach(function(t) {
    var isIncome = t['대분류'] === '수입';
    var tid = t.id.replace(/'/g,"\\'");
    var dbl = function(field) { return ' ondblclick="ldgCellEdit(\'' + tid + '\',\'' + field + '\',this)"'; };
    var clk = ' onclick="ldgRowSelect(\'' + tid + '\',this)"';
    html += '<tr class="hover:bg-indigo-50/30 transition-colors group" data-tx-id="' + tid + '">';
    html += '<td class="px-4 py-1.5 text-xs font-medium text-slate-600 cursor-pointer"' + clk + dbl('date') + '>' + (t.date||'').substring(5).replace('-','/') + '</td>';
    html += '<td class="px-3 py-1.5 text-xs text-slate-900 whitespace-nowrap cursor-pointer"' + clk + dbl('대분류') + '>' + (t['대분류']||'') + '</td>';
    html += '<td class="px-3 py-1.5 whitespace-nowrap cursor-pointer"' + clk + dbl('소분류') + '><span class="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-bold">' + (t['소분류']||'') + '</span></td>';
    html += '<td class="px-3 py-1.5 text-xs font-bold text-right cursor-pointer ' + (isIncome ? 'text-emerald-600' : 'text-slate-900') + '" style="font-feature-settings:\'tnum\'"' + clk + dbl('금액') + '>' + ldgFmt(t['금액']) + '</td>';
    html += '<td class="px-3 py-1.5 text-xs text-slate-500 whitespace-nowrap cursor-pointer"' + clk + dbl('결제수단') + '>' + (t['결제수단']||'') + '</td>';
    html += '<td class="px-3 py-1.5 text-xs text-slate-600 truncate cursor-pointer" style="max-width:200px"' + clk + dbl('세부사항') + '>' + (t['세부사항']||'') + '</td>';
    var assetMarker = t.excludeFromGoal ? '<span class="text-[10px] mr-1" title="자산이동 (목표 추적 제외)">🔁</span>' : '';
    html += '<td class="px-3 py-1.5 text-xs text-slate-400 cursor-pointer"' + clk + dbl('비고') + '>' + assetMarker + (t['비고']||'') + '</td>';
    html += '<td class="px-2 py-1.5 relative"><button onclick="ldgShowTxMenu(event,\'' + tid + '\')" class="text-slate-300 hover:text-slate-500"><span class="material-symbols-outlined text-sm">more_horiz</span></button></td>';
    html += '</tr>';
  });

  if (hidden > 0) {
    html += '<tr><td colspan="8" class="px-4 py-3 text-center bg-slate-50">' +
      '<button onclick="localStorage.setItem(\'atelier_ldg_force_full\',\'true\');location.reload()" class="text-xs text-violet-700 font-bold underline">' +
      '+ ' + hidden + '건 더 보기 (전체 보기로 전환)</button></td></tr>';
  }

  body.innerHTML = html;
  setTimeout(function() { ldgInitCustomDDs(); }, 20);
}

function ldgGetActivePMs() {
  var all = (_ledgerData.settings || {}).paymentMethods || [];
  var dis = (_ledgerData.settings || {}).disabledPayments || [];
  return all.filter(function(p) { return dis.indexOf(p) < 0; });
}
function ldgInputRowHTML(tx) {
  var cats = _ledgerData.categories || {};
  var pms = ldgGetActivePMs();
  var d = tx ? tx.date : '', major = tx ? tx['대분류'] : '', minor = tx ? tx['소분류'] : '';
  var amt = tx ? tx['금액'].toLocaleString('ko-KR') : '', pm = tx ? (tx['결제수단']||'') : '';
  var detail = tx ? (tx['세부사항']||'') : '', note = tx ? (tx['비고']||'') : '';
  if (!d) {
    // Default date: last saved transaction date, then latest in month, then today
    if (_ldgLastSavedDate) { d = _ldgLastSavedDate; }
    else {
      var monthTx = ldgGetMonthTx();
      if (monthTx.length) d = monthTx.sort(function(a,b){ return a.date > b.date ? -1 : 1; })[0].date;
      else { var now = new Date(); d = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0'); }
    }
  }
  // Build subcategory options
  var subOpts = '<option value="">선택</option>';
  if (major && cats[major]) {
    cats[major].forEach(function(s) { subOpts += '<option value="' + s + '"' + (s===minor?' selected':'') + '>' + s + '</option>'; });
  }
  var majorOpts = '<option value="">선택</option>';
  Object.keys(cats).forEach(function(c) { majorOpts += '<option value="' + c + '"' + (c===major?' selected':'') + '>' + c + '</option>'; });
  var pmOpts = '<option value="">선택</option>';
  pms.forEach(function(p) { pmOpts += '<option value="' + p + '"' + (p===pm?' selected':'') + '>' + p + '</option>'; });

  return '<tr class="bg-indigo-50/40 border-l-4 border-l-indigo-500" id="ldg-input-row">' +
    '<td class="px-4 py-1"><input type="date" id="ldg-in-date" value="' + d + '" class="text-xs border border-slate-200 rounded-lg px-2 py-1 w-full focus:ring-2 focus:ring-indigo-300 outline-none" onkeydown="ldgInputKey(event,0)"/></td>' +
    '<td class="px-3 py-1"><div class="ldg-custom-dd" id="ldg-dd-major" data-field="ldg-in-major" data-value="' + major.replace(/"/g,'&quot;') + '"></div><input type="hidden" id="ldg-in-major" value="' + major.replace(/"/g,'&quot;') + '"/></td>' +
    '<td class="px-3 py-1"><div class="ldg-custom-dd" id="ldg-dd-minor" data-field="ldg-in-minor" data-value="' + minor.replace(/"/g,'&quot;') + '"></div><input type="hidden" id="ldg-in-minor" value="' + minor.replace(/"/g,'&quot;') + '"/></td>' +
    '<td class="px-3 py-1"><input type="text" id="ldg-in-amount" value="' + amt + '" placeholder="금액" class="text-xs border border-slate-200 rounded-lg px-2 py-1 w-full text-right focus:ring-2 focus:ring-indigo-300 outline-none" oninput="ldgFormatAmount(this)" onkeydown="ldgInputKey(event,3)"/></td>' +
    '<td class="px-3 py-1"><div class="ldg-custom-dd" id="ldg-dd-payment" data-field="ldg-in-payment" data-value="' + pm.replace(/"/g,'&quot;') + '"></div><input type="hidden" id="ldg-in-payment" value="' + pm.replace(/"/g,'&quot;') + '"/></td>' +
    '<td class="px-3 py-1"><input type="text" id="ldg-in-detail" value="' + detail.replace(/"/g,'&quot;') + '" placeholder="세부사항" class="text-xs border border-slate-200 rounded-lg px-2 py-1 w-full focus:ring-2 focus:ring-indigo-300 outline-none" onkeydown="ldgInputKey(event,5)"/></td>' +
    '<td class="px-3 py-1"><input type="text" id="ldg-in-note" value="' + note.replace(/"/g,'&quot;') + '" placeholder="비고" class="text-xs border border-slate-200 rounded-lg px-2 py-1 w-full focus:ring-2 focus:ring-indigo-300 outline-none" onkeydown="ldgInputKey(event,6)"/></td>' +
    '<td class="px-2 py-1"><button onclick="ldgCancelInput()" class="text-slate-400 hover:text-red-400"><span class="material-symbols-outlined text-sm">close</span></button></td>' +
    '</tr>';
}

function ldgMajorChanged() {
  var major = document.getElementById('ldg-in-major').value;
  // Reset minor value
  document.getElementById('ldg-in-minor').value = '';
  // Rebuild minor custom dropdown
  var minorWrap = document.getElementById('ldg-dd-minor');
  if (minorWrap) {
    minorWrap.dataset.value = '';
    ldgBuildDD('ldg-dd-minor', ldgGetMinorOpts(major), function(val) { document.getElementById('ldg-in-minor').value = val; });
  }
}

function ldgFormatAmount(el) {
  var raw = el.value.replace(/[^0-9]/g, '');
  if (raw) el.value = parseInt(raw).toLocaleString('ko-KR');
  else el.value = '';
}

// ── Custom Dropdown (modern, for tx input only) ──
function ldgInitCustomDDs() {
  ldgBuildDD('ldg-dd-major', ldgGetMajorOpts(), function(val) {
    document.getElementById('ldg-in-major').value = val;
    ldgMajorChanged();
    // Auto-rebuild minor dd
    ldgBuildDD('ldg-dd-minor', ldgGetMinorOpts(val), function(v2) { document.getElementById('ldg-in-minor').value = v2; });
  });
  var curMajor = document.getElementById('ldg-in-major').value;
  ldgBuildDD('ldg-dd-minor', ldgGetMinorOpts(curMajor), function(val) { document.getElementById('ldg-in-minor').value = val; });
  ldgBuildDD('ldg-dd-payment', ldgGetPMOpts(), function(val) { document.getElementById('ldg-in-payment').value = val; });
}
function ldgGetMajorOpts() { return Object.keys(_ledgerData.categories || {}).map(function(c){return {value:c,label:c};}); }
function ldgGetMinorOpts(major) { var cats = _ledgerData.categories || {}; return (cats[major]||[]).map(function(s){return {value:s,label:s};}); }
function ldgGetPMOpts() { return ldgGetActivePMs().map(function(p){return {value:p,label:p};}); }

function ldgBuildDD(wrapperId, options, onChange) {
  var wrap = document.getElementById(wrapperId);
  if (!wrap) return;
  var curVal = wrap.dataset.value || '';
  wrap.style.position = 'relative';
  wrap._ddOpts = options;
  wrap._ddOnChange = onChange;
  wrap._ddHighlight = -1;
  var label = curVal || '';
  wrap.innerHTML = '<div class="ldg-dd-trigger" tabindex="0">' +
    '<span class="dd-label' + (!label ? ' dd-placeholder' : '') + '">' + (label || '선택') + '</span>' +
    '<span class="material-symbols-outlined dd-chevron">expand_more</span></div>';
  var trigger = wrap.querySelector('.ldg-dd-trigger');

  function closeDD() {
    var p = wrap.querySelector('.ldg-dd-panel');
    if (p) p.remove();
    trigger.classList.remove('open');
    wrap._ddHighlight = -1;
  }
  function selectOpt(opt) {
    wrap.dataset.value = opt.value;
    trigger.querySelector('.dd-label').textContent = opt.label;
    trigger.querySelector('.dd-label').classList.remove('dd-placeholder');
    closeDD();
    if (onChange) onChange(opt.value);
  }
  function highlightIdx(panel, idx) {
    var items = panel.querySelectorAll('.ldg-dd-opt');
    items.forEach(function(el,i) { el.classList.remove('highlighted'); });
    if (idx >= 0 && idx < items.length) {
      items[idx].classList.add('highlighted');
      items[idx].scrollIntoView({ block: 'nearest' });
    }
    wrap._ddHighlight = idx;
  }
  function openDD() {
    var existing = wrap.querySelector('.ldg-dd-panel');
    if (existing) { closeDD(); return; }
    document.querySelectorAll('.ldg-dd-panel').forEach(function(p){p.remove();}); document.querySelectorAll('.ldg-dd-trigger').forEach(function(t){t.classList.remove('open');});
    trigger.classList.add('open');
    var panel = document.createElement('div');
    panel.className = 'ldg-dd-panel';
    if (options.length === 0) { panel.innerHTML = '<div class="ldg-dd-opt" style="color:#94a3b8;cursor:default">항목 없음</div>'; }
    else {
      var selIdx = -1;
      options.forEach(function(opt, i) {
        if (opt.value === curVal) selIdx = i;
        var div = document.createElement('div');
        div.className = 'ldg-dd-opt' + (opt.value === curVal ? ' selected' : '');
        div.innerHTML = opt.label + (opt.value === curVal ? ' <span class="material-symbols-outlined" style="font-size: var(--font-size-body)">check</span>' : '');
        div.onclick = function(ev) { ev.stopPropagation(); selectOpt(opt); };
        panel.appendChild(div);
      });
      wrap._ddHighlight = selIdx >= 0 ? selIdx : 0;
    }
    wrap.appendChild(panel);
    if (options.length > 0) highlightIdx(panel, wrap._ddHighlight);
    setTimeout(function() { document.addEventListener('click', function h() { closeDD(); document.removeEventListener('click',h); }); }, 10);
  }
  trigger.onclick = function(e) { e.stopPropagation(); openDD(); };

  // Keyboard on trigger
  trigger.addEventListener('keydown', function(e) {
    var panel = wrap.querySelector('.ldg-dd-panel');
    var isOpen = !!panel;
    if (e.key === 'Escape') { e.preventDefault(); if (isOpen) closeDD(); else ldgCancelInput(); return; } // CancelInput clears fields but keeps row visible
    if (e.key === 'Tab') { closeDD(); return; /* let Tab propagate naturally */ }
    if (!isOpen && (e.key === 'Enter' || e.key === ' ' || e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault(); openDD(); return;
    }
    if (!isOpen) {
      // Forward Enter to save logic when dropdown is closed
      if (e.key === 'Enter') { e.preventDefault(); ldgSaveInput(); return; }
      return;
    }
    var opts = wrap._ddOpts || [];
    var hi = wrap._ddHighlight;
    if (e.key === 'ArrowDown') { e.preventDefault(); hi = Math.min(hi + 1, opts.length - 1); highlightIdx(panel, hi); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); hi = Math.max(hi - 1, 0); highlightIdx(panel, hi); }
    else if (e.key === 'Enter') { e.preventDefault(); if (hi >= 0 && hi < opts.length) selectOpt(opts[hi]); }
    else if (e.key.length === 1) {
      // First-letter jump
      var ch = e.key.toLowerCase();
      for (var j = 0; j < opts.length; j++) {
        if (opts[j].label.toLowerCase().charAt(0) === ch || opts[j].label.charAt(0) === e.key) { highlightIdx(panel, j); break; }
      }
    }
  });
}

// CSS for highlighted item (injected once)
(function(){var s=document.createElement('style');s.textContent='.ldg-dd-opt.highlighted{background:#f7f1ff}';document.head.appendChild(s);})();

// ── Cell-level inline edit (dblclick on existing rows) ──
var _ldgCellFields = ['date','대분류','소분류','금액','결제수단','세부사항','비고'];
var _ldgCellEditingTx = null;

// ── Excel-like row copy/paste ──
var _ldgSelectedRow = null;   // {txId, tr}
var _ldgRowClipboard = null;  // tx snapshot

function ldgRowSelect(txId, tdEl) {
  if (_ldgCellEditingTx) return;
  var tr = tdEl && tdEl.closest ? tdEl.closest('tr') : null;
  if (!tr) return;
  if (_ldgSelectedRow && _ldgSelectedRow.tr) {
    _ldgSelectedRow.tr.classList.remove('ldg-row-selected');
  }
  tr.classList.add('ldg-row-selected');
  _ldgSelectedRow = { txId: txId, tr: tr };
}

function ldgRowClear() {
  if (_ldgSelectedRow && _ldgSelectedRow.tr) {
    _ldgSelectedRow.tr.classList.remove('ldg-row-selected');
  }
  _ldgSelectedRow = null;
}

function ldgCellToast(msg) {
  var t = document.createElement('div');
  t.className = 'fixed top-20 right-8 bg-slate-800 text-white px-4 py-2 rounded-xl shadow-lg z-[9999] text-xs font-semibold';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(function() { if (t.parentElement) t.remove(); }, 1800);
}

function ldgRowCopy() {
  if (!_ldgSelectedRow) return;
  var tx = (_ledgerData.transactions || []).find(function(t) { return t.id === _ldgSelectedRow.txId; });
  if (!tx) return;
  _ldgRowClipboard = JSON.parse(JSON.stringify(tx));
  var fields = ['date','대분류','소분류','금액','결제수단','세부사항','비고'];
  var line = fields.map(function(f) { return String(tx[f] == null ? '' : tx[f]); }).join('\t');
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(line);
    }
  } catch(e) {}
  ldgCellToast('행 복사됨: ' + (tx.date||'') + ' · ' + (tx['대분류']||'') + ' › ' + (tx['소분류']||''));
}

function ldgRowPaste() {
  if (!_ldgRowClipboard) {
    ldgCellToast('복사된 행이 없습니다');
    return;
  }
  var src = _ldgRowClipboard;
  var dup = JSON.parse(JSON.stringify(src));
  dup.id = 'txn_' + Date.now() + '_' + Math.random().toString(36).substr(2,4);
  // Clear recurring linkage so this is a standalone manual entry
  if (dup.recurringId) delete dup.recurringId;
  if (dup['비고'] === '자동(고정)') dup['비고'] = '';
  _ledgerData.transactions = _ledgerData.transactions || [];
  _ledgerData.transactions.push(dup);
  ldgSaveTx();
  ldgCellToast('행 붙여넣음: ' + (dup.date||'') + ' · ' + (dup['대분류']||'') + ' › ' + (dup['소분류']||'') + ' (날짜 변경하려면 더블 클릭)');
  ldgRenderMonthly();
  // Re-select the new row after re-render
  setTimeout(function() {
    var newTr = document.querySelector('tr[data-tx-id="' + dup.id + '"]');
    if (newTr) {
      newTr.classList.add('ldg-row-selected');
      _ldgSelectedRow = { txId: dup.id, tr: newTr };
      newTr.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, 50);
}

(function() {
  document.addEventListener('copy', function(e) {
    if (_ldgCellEditingTx) return;
    if (!_ldgSelectedRow) return;
    var tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    var hasTextSel = false;
    try { hasTextSel = window.getSelection().toString().length > 0; } catch(_) {}
    if (hasTextSel) return;
    e.preventDefault();
    ldgRowCopy();
    var tx = (_ledgerData.transactions || []).find(function(t) { return t.id === _ldgSelectedRow.txId; });
    if (tx && e.clipboardData) {
      var fields = ['date','대분류','소분류','금액','결제수단','세부사항','비고'];
      var line = fields.map(function(f) { return String(tx[f] == null ? '' : tx[f]); }).join('\t');
      e.clipboardData.setData('text/plain', line);
    }
  });
  document.addEventListener('paste', function(e) {
    if (_ldgCellEditingTx) return;
    if (!_ldgRowClipboard) return;
    var tag = (e.target && e.target.tagName) || '';
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
    e.preventDefault();
    ldgRowPaste();
  });
  document.addEventListener('keydown', function(e) {
    if (_ldgCellEditingTx) return;
    if (e.key === 'Escape' && _ldgSelectedRow) {
      ldgRowClear();
    }
  });
})();

function ldgCellEdit(txId, field, tdEl) {
  // Find the transaction
  var tx = (_ledgerData.transactions || []).find(function(t) { return t.id === txId; });
  if (!tx) return;
  // Check if auto-generated (고정내역)
  // Show tooltip for auto-generated rows
  if (tx['비고'] === '자동(고정)' && !_ldgCellEditingTx) {
    var tip = document.createElement('div');
    tip.className = 'fixed z-[9999] bg-slate-800 text-white text-[11px] rounded-lg px-3 py-2 shadow-lg max-w-xs';
    tip.style.top = (tdEl.getBoundingClientRect().top - 40) + 'px';
    tip.style.left = tdEl.getBoundingClientRect().left + 'px';
    tip.textContent = '\uD83D\uDCA1 이번 달만 수정됩니다. 매달 적용하려면 설정 → 고정내역에서 변경하세요.';
    document.body.appendChild(tip);
    setTimeout(function() { if (tip.parentElement) tip.remove(); }, 3000);
  }
  _ldgCellEditingTx = txId;
  var fieldIdx = _ldgCellFields.indexOf(field);

  // Close any open dropdown panels
  document.querySelectorAll('.ldg-dd-panel').forEach(function(p){p.remove();});

  if (field === '대분류' || field === '소분류' || field === '결제수단') {
    ldgCellEditDD(tx, field, tdEl, fieldIdx);
  } else if (field === 'date') {
    ldgCellEditInput(tx, field, tdEl, fieldIdx, 'date', tx.date);
  } else if (field === '금액') {
    ldgCellEditInput(tx, field, tdEl, fieldIdx, 'amount', tx['금액']);
  } else {
    ldgCellEditInput(tx, field, tdEl, fieldIdx, 'text', tx[field] || '');
  }
}

function ldgCellEditInput(tx, field, tdEl, fieldIdx, type, curVal) {
  var input = document.createElement('input');
  if (type === 'date') {
    input.type = 'date'; input.value = curVal || '';
  } else if (type === 'amount') {
    input.type = 'text'; input.value = curVal ? Math.round(curVal).toLocaleString('ko-KR') : '';
    input.style.textAlign = 'right';
    input.oninput = function() { ldgFormatAmount(input); };
  } else {
    input.type = 'text'; input.value = curVal || '';
  }
  input.className = 'text-xs border-2 border-indigo-400 rounded-lg px-2 py-0.5 w-full outline-none focus:ring-2 focus:ring-indigo-300 bg-indigo-50/30';
  if (type === 'amount') input.style.fontFeatureSettings = "'tnum'";
  tdEl.innerHTML = ''; tdEl.appendChild(input); tdEl.ondblclick = null;
  input.focus(); input.select();

  function save() {
    var newVal;
    if (type === 'date') { newVal = input.value; }
    else if (type === 'amount') { newVal = parseInt(input.value.replace(/[^0-9]/g,'')) || 0; }
    else { newVal = input.value; }
    if (field === 'date') tx.date = newVal;
    else tx[field] = newVal;
    ldgSaveTx(); _ldgCellEditingTx = null; ldgRenderMonthly();
  }
  function cancel() { _ldgCellEditingTx = null; ldgRenderTxTable(); }
  function tabTo(dir) {
    // Save current then move to next/prev cell
    var newVal;
    if (type === 'date') newVal = input.value;
    else if (type === 'amount') newVal = parseInt(input.value.replace(/[^0-9]/g,'')) || 0;
    else newVal = input.value;
    if (field === 'date') tx.date = newVal; else tx[field] = newVal;
    ldgSaveTx();
    var nextIdx = fieldIdx + dir;
    if (nextIdx < 0 || nextIdx >= _ldgCellFields.length) { _ldgCellEditingTx = null; ldgRenderMonthly(); return; }
    // Re-render then trigger edit on next cell
    ldgRenderTxTable();
    setTimeout(function() {
      var rows = document.querySelectorAll('#ldg-tx-body tr');
      for (var i = 0; i < rows.length; i++) {
        var btn = rows[i].querySelector('button[onclick*="' + tx.id + '"]');
        if (btn) { var tds = rows[i].querySelectorAll('td'); if (tds[nextIdx]) ldgCellEdit(tx.id, _ldgCellFields[nextIdx], tds[nextIdx]); break; }
      }
    }, 30);
  }
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') { e.preventDefault(); save(); }
    if (e.key === 'Escape') { e.preventDefault(); cancel(); }
    if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); tabTo(1); }
    if (e.key === 'Tab' && e.shiftKey) { e.preventDefault(); tabTo(-1); }
  });
  input.addEventListener('blur', function() {
    // Delay to allow tab/click handlers to fire first
    setTimeout(function() { if (_ldgCellEditingTx === tx.id) save(); }, 150);
  });
}

function ldgCellEditDD(tx, field, tdEl, fieldIdx) {
  var opts;
  if (field === '대분류') opts = ldgGetMajorOpts();
  else if (field === '소분류') opts = ldgGetMinorOpts(tx['대분류']);
  else opts = ldgGetPMOpts();
  var curVal = tx[field] || '';

  tdEl.innerHTML = ''; tdEl.ondblclick = null;
  tdEl.style.position = 'relative';
  var wrapId = 'ldg-cell-dd-' + field.replace(/[^a-zA-Z]/g,'');
  var wrap = document.createElement('div');
  wrap.id = wrapId; wrap.className = 'ldg-custom-dd';
  wrap.dataset.value = curVal; wrap.dataset.field = field;
  tdEl.appendChild(wrap);

  function onSelect(val) {
    tx[field] = val;
    // If major changed, check minor compatibility
    if (field === '대분류') {
      var cats = _ledgerData.categories || {};
      var validSubs = cats[val] || [];
      if (validSubs.indexOf(tx['소분류']) < 0) tx['소분류'] = '';
    }
    ldgSaveTx(); _ldgCellEditingTx = null; ldgRenderMonthly();
  }

  ldgBuildDD(wrapId, opts, onSelect);
  // Auto-open the dropdown
  setTimeout(function() { var trigger = wrap.querySelector('.ldg-dd-trigger'); if (trigger) trigger.click(); }, 20);
}

var _ldgInputFields = ['ldg-in-date','ldg-dd-major','ldg-dd-minor','ldg-in-amount','ldg-dd-payment','ldg-in-detail','ldg-in-note'];
function ldgFocusField(id) {
  var el = document.getElementById(id);
  if (!el) return;
  var trigger = el.querySelector && el.querySelector('.ldg-dd-trigger');
  if (trigger) trigger.focus(); else el.focus();
}
function ldgInputKey(e, idx) {
  if (e.key === 'Escape') { ldgCancelInput(); return; }
  if (e.key === 'Enter') {
    e.preventDefault();
    ldgSaveInput(); // Will focus first empty required field if incomplete
    return;
  }
  if (e.key === 'Tab' && !e.shiftKey) {
    if (idx < _ldgInputFields.length - 1) {
      e.preventDefault();
      ldgFocusField(_ldgInputFields[idx + 1]);
    }
  }
  if (e.key === 'Tab' && e.shiftKey && idx > 0) {
    e.preventDefault();
    ldgFocusField(_ldgInputFields[idx - 1]);
  }
}

function ldgSaveInput() {
  var date = (document.getElementById('ldg-in-date') || {}).value || '';
  var major = (document.getElementById('ldg-in-major') || {}).value || '';
  var minor = (document.getElementById('ldg-in-minor') || {}).value || '';
  var amtStr = (document.getElementById('ldg-in-amount') || {}).value || '';
  var amount = parseInt(amtStr.replace(/[^0-9]/g, '')) || 0;
  var payment = (document.getElementById('ldg-in-payment') || {}).value || '';
  var detail = (document.getElementById('ldg-in-detail') || {}).value || '';
  var note = (document.getElementById('ldg-in-note') || {}).value || '';
  // Check required fields and focus first empty one
  var missing = [];
  if (!date) missing.push('ldg-in-date');
  if (!major) missing.push('ldg-dd-major');
  if (!minor) missing.push('ldg-dd-minor');
  if (!amount) missing.push('ldg-in-amount');
  if (!payment) missing.push('ldg-dd-payment');
  if (missing.length) { ldgFocusField(missing[0]); return; }
  var txs = _ledgerData.transactions;
  if (_ldgEditingId && _ldgEditingId !== 'new') {
    // Update existing
    for (var i = 0; i < txs.length; i++) {
      if (txs[i].id === _ldgEditingId) {
        txs[i].date = date; txs[i]['대분류'] = major; txs[i]['소분류'] = minor;
        txs[i]['금액'] = amount; txs[i]['결제수단'] = payment;
        txs[i]['세부사항'] = detail; txs[i]['비고'] = note;
        break;
      }
    }
  } else {
    // New transaction
    var newId = 'txn_' + Date.now();
    txs.push({ id: newId, date: date, '대분류': major, '소분류': minor, '금액': amount, '결제수단': payment, '세부사항': detail, '비고': note });
  }
  _ldgLastSavedDate = date;
  ldgSaveTx();
  _ldgEditingId = null; // Reset to blank input row
  ldgRenderMonthly();
  setTimeout(function() { ldgInitCustomDDs(); }, 30);
}

function ldgCancelInput() {
  _ldgEditingId = null;
  ldgRenderTxTable();
  setTimeout(function() { ldgInitCustomDDs(); }, 30);
}

// ── TX Menu (edit/duplicate/delete) ──
function ldgShowTxMenu(e, txId) {
  e.stopPropagation();
  // Remove any existing menu
  var old = document.getElementById('ldg-tx-menu');
  if (old) old.remove();
  var btn = e.currentTarget;
  var rect = btn.getBoundingClientRect();
  var menu = document.createElement('div');
  menu.id = 'ldg-tx-menu';
  menu.className = 'fixed bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-[9999]';
  menu.style.top = rect.bottom + 4 + 'px';
  menu.style.left = (rect.left - 100) + 'px';
  var tx = (_ledgerData.transactions || []).find(function(t){ return t.id === txId; });
  var isExcluded = tx && tx.excludeFromGoal === true;
  var toggleLabel = isExcluded ? '목표 추적 포함 ↩︎' : '목표 추적 제외 (자산이동)';
  var toggleStyle = isExcluded ? 'text-emerald-600' : 'text-slate-600';
  menu.innerHTML =
    '<button onclick="ldgEditTx(\'' + txId + '\')" class="w-full text-left px-4 py-2 text-xs text-slate-600 hover:bg-slate-50">수정</button>' +
    '<button onclick="ldgDuplicateTx(\'' + txId + '\')" class="w-full text-left px-4 py-2 text-xs text-slate-600 hover:bg-slate-50">복제</button>' +
    '<div class="border-t border-slate-100 my-1"></div>' +
    '<button onclick="ldgToggleExcludeFromGoal(\'' + txId + '\')" class="w-full text-left px-4 py-2 text-xs ' + toggleStyle + ' hover:bg-slate-50">' + toggleLabel + '</button>' +
    '<div class="border-t border-slate-100 my-1"></div>' +
    '<button onclick="ldgDeleteTx(\'' + txId + '\')" class="w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-red-50">삭제</button>';
  document.body.appendChild(menu);
  setTimeout(function() {
    document.addEventListener('click', function handler() {
      var m = document.getElementById('ldg-tx-menu');
      if (m) m.remove();
      document.removeEventListener('click', handler);
    });
  }, 10);
}

function ldgEditTx(txId) {
  var m = document.getElementById('ldg-tx-menu'); if (m) m.remove();
  _ldgEditingId = txId;
  ldgRenderTxTable();
  setTimeout(function() { ldgInitCustomDDs(); var f = document.getElementById('ldg-in-date'); if (f) f.focus(); }, 50);
}

// 자산 이동(집 대출 상환 등) 토글 - 목표 추적/AI 계산에서 제외
function ldgToggleExcludeFromGoal(txId) {
  var m = document.getElementById('ldg-tx-menu'); if (m) m.remove();
  var tx = (_ledgerData.transactions || []).find(function(t){ return t.id === txId; });
  if (!tx) return;
  tx.excludeFromGoal = !tx.excludeFromGoal;
  ldgSaveTx();
  ldgRenderMonthly();
  if (typeof showSyncToast === 'function') {
    var msg = tx.excludeFromGoal ? '목표 추적에서 제외됨 (자산이동)' : '목표 추적에 다시 포함됨';
    showSyncToast('<span class="material-symbols-outlined text-sm mr-1">swap_horiz</span> ' + msg);
  }
}

function ldgDuplicateTx(txId) {
  var m = document.getElementById('ldg-tx-menu'); if (m) m.remove();
  var txs = _ledgerData.transactions;
  var orig = txs.find(function(t) { return t.id === txId; });
  if (!orig) return;
  var now = new Date();
  var todayStr = now.getFullYear() + '-' + String(now.getMonth()+1).padStart(2,'0') + '-' + String(now.getDate()).padStart(2,'0');
  var dup = JSON.parse(JSON.stringify(orig));
  dup.id = 'txn_' + Date.now();
  dup.date = todayStr;
  txs.push(dup);
  ldgSaveTx();
  ldgRenderMonthly();
}

function ldgDeleteTx(txId) {
  var m = document.getElementById('ldg-tx-menu'); if (m) m.remove();
  _ldgDeleteTarget = txId;
  document.getElementById('ldg-delete-modal').style.display = 'flex';
}
function ldgCancelDelete() {
  _ldgDeleteTarget = null;
  document.getElementById('ldg-delete-modal').style.display = 'none';
}
function ldgConfirmDelete() {
  if (_ldgDeleteTarget) {
    var tx = _ledgerData.transactions.find(function(t) { return t.id === _ldgDeleteTarget; });
    if (tx && tx.date) {
      var recId = tx.recurringId;
      // If no recurringId but is auto-generated, best-effort match to find recurring item
      if (!recId && tx['비고'] === '자동(고정)') {
        ldgEnsureRecurringIds();
        var day = parseInt(tx.date.split('-')[2]) || 0;
        var items = _ledgerData.recurring || [];
        var match = items.find(function(r) {
          return r['대분류'] === tx['대분류'] && r['소분류'] === tx['소분류'] && r.dayOfMonth === day;
        });
        if (match) recId = match.recId;
      }
      if (recId) ldgAddSkipped(recId, tx.date.substring(0,7));
    }
    _ledgerData.transactions = _ledgerData.transactions.filter(function(t) { return t.id !== _ldgDeleteTarget; });
    ldgSaveTx();
  }
  _ldgDeleteTarget = null;
  document.getElementById('ldg-delete-modal').style.display = 'none';
  ldgRenderMonthly();
}

// ── Filter/Sort toggles ──
// ── Column Filters ──
var _ldgColFilters = { date:[], major:[], minor:[], amount:{ min:null, max:null }, payment:[] };

function ldgColFilter(col, btnEl) {
  // Close any existing panel
  var old = document.querySelector('.ldg-cf-panel');
  if (old) { old.remove(); document.querySelectorAll('.ldg-cf-btn').forEach(function(b){b.classList.remove('active');}); if (old._cfCol === col) return; }
  btnEl.classList.add('active');
  var txs = ldgGetMonthTx();
  var panel = document.createElement('div');
  panel.className = 'ldg-cf-panel';
  panel._cfCol = col;

  if (col === 'amount') {
    var cf = _ldgColFilters.amount;
    panel.innerHTML = '<div class="p-3 space-y-2"><p class="text-[10px] font-bold text-slate-500 mb-1">금액 범위</p>' +
      '<input id="ldg-cf-amt-min" type="text" placeholder="최소" value="' + (cf.min ? cf.min.toLocaleString('ko-KR') : '') + '" class="w-full text-xs border border-slate-200 rounded-lg px-2 py-1 text-right" oninput="ldgFormatAmount(this)"/>' +
      '<input id="ldg-cf-amt-max" type="text" placeholder="최대" value="' + (cf.max ? cf.max.toLocaleString('ko-KR') : '') + '" class="w-full text-xs border border-slate-200 rounded-lg px-2 py-1 text-right" oninput="ldgFormatAmount(this)"/>' +
      '<button onclick="ldgApplyAmtFilter()" class="w-full text-xs bg-indigo-600 text-white rounded-lg py-1 font-semibold">적용</button></div>';
  } else {
    // Checkbox multi-select
    var values = {};
    txs.forEach(function(t) {
      var v;
      if (col === 'date') v = t.date || '';
      else if (col === 'major') v = t['대분류'] || '';
      else if (col === 'minor') v = t['소분류'] || '';
      else if (col === 'payment') v = t['결제수단'] || '';
      if (v) values[v] = true;
    });
    var sorted = Object.keys(values).sort();
    var selected = _ldgColFilters[col] || [];
    var html = '<div class="cf-actions"><button onclick="ldgCFSelectAll(\'' + col + '\')" class="text-indigo-600 font-semibold">전체 선택</button><button onclick="ldgCFSelectNone(\'' + col + '\')" class="text-slate-500 font-semibold">전체 해제</button></div>';
    sorted.forEach(function(v) {
      var checked = selected.length === 0 || selected.indexOf(v) >= 0;
      var display = col === 'date' ? v.substring(5).replace('-','/') : v;
      html += '<label><input type="checkbox" value="' + v.replace(/"/g,'&quot;') + '" ' + (checked ? 'checked' : '') + ' onchange="ldgCFChanged(\'' + col + '\')" class="w-3 h-3 rounded text-indigo-600 border-slate-300"/>' + display + '</label>';
    });
    panel.innerHTML = html;
  }
  btnEl.parentElement.appendChild(panel);
  setTimeout(function() { document.addEventListener('click', function h(e) { if (!panel.contains(e.target) && e.target !== btnEl) { panel.remove(); btnEl.classList.remove('active'); document.removeEventListener('click',h); } }); }, 10);
}

function ldgCFChanged(col) {
  var panel = document.querySelector('.ldg-cf-panel');
  if (!panel) return;
  var checks = panel.querySelectorAll('input[type=checkbox]');
  var selected = [];
  checks.forEach(function(cb) { if (cb.checked) selected.push(cb.value); });
  var allChecked = selected.length === checks.length;
  _ldgColFilters[col] = allChecked ? [] : selected;
  ldgUpdateFilterResetBtn();
  ldgRenderTxTable();
}
function ldgCFSelectAll(col) {
  _ldgColFilters[col] = [];
  ldgUpdateFilterResetBtn();
  var panel = document.querySelector('.ldg-cf-panel');
  if (panel) panel.querySelectorAll('input[type=checkbox]').forEach(function(cb){cb.checked=true;});
  ldgRenderTxTable();
}
function ldgCFSelectNone(col) {
  var panel = document.querySelector('.ldg-cf-panel');
  if (!panel) return;
  panel.querySelectorAll('input[type=checkbox]').forEach(function(cb){cb.checked=false;});
  _ldgColFilters[col] = ['__none__'];
  ldgUpdateFilterResetBtn();
  ldgRenderTxTable();
}
function ldgApplyAmtFilter() {
  var minStr = (document.getElementById('ldg-cf-amt-min')||{}).value||'';
  var maxStr = (document.getElementById('ldg-cf-amt-max')||{}).value||'';
  _ldgColFilters.amount.min = minStr ? parseInt(minStr.replace(/[^0-9]/g,'')) : null;
  _ldgColFilters.amount.max = maxStr ? parseInt(maxStr.replace(/[^0-9]/g,'')) : null;
  ldgUpdateFilterResetBtn();
  ldgRenderTxTable();
  var panel = document.querySelector('.ldg-cf-panel');
  if (panel) { panel.remove(); document.querySelectorAll('.ldg-cf-btn').forEach(function(b){b.classList.remove('active');}); }
}
function ldgColFilterReset() {
  _ldgColFilters = { date:[], major:[], minor:[], amount:{ min:null, max:null }, payment:[] };
  ldgUpdateFilterResetBtn();
  ldgRenderTxTable();
}
function ldgUpdateFilterResetBtn() {
  var hasFilter = _ldgColFilters.date.length > 0 || _ldgColFilters.major.length > 0 || _ldgColFilters.minor.length > 0 || _ldgColFilters.payment.length > 0 || _ldgColFilters.amount.min !== null || _ldgColFilters.amount.max !== null;
  var btn = document.getElementById('ldg-col-filter-reset');
  if (btn) btn.style.display = hasFilter ? '' : 'none';
}

function ldgToggleSort() {
  if (_ldgSortField === 'date' && !_ldgSortAsc) { _ldgSortAsc = true; }
  else if (_ldgSortField === 'date' && _ldgSortAsc) { _ldgSortField = 'amount'; _ldgSortAsc = false; }
  else if (_ldgSortField === 'amount' && !_ldgSortAsc) { _ldgSortAsc = true; }
  else { _ldgSortField = 'date'; _ldgSortAsc = false; }
  ldgRenderTxTable();
}

// ===== DAILY LEDGER: ASSET SHEET =====
var _ldgAssetYear = 2026;
var _ldgAssetChart = null;
var _ldgAssetDelTarget = null; // {group, idx}

// Default auto-mappings per PROMPT spec (MVP: one mapping per category to avoid double counting)
var _ldgAssetAutoMappings = {
  '적금1': '저축.적금', '적금2': null, '예금1': '저축.예금',
  '파킹1': null, '파킹2': null,
  '신용대출': '저축.신용대출 상환', '담보대출': '저축.담보대출 상환'
};

function ldgAssetPrev() { _ldgAssetYear--; ldgRenderAssets(); }
function ldgAssetNext() { _ldgAssetYear++; ldgRenderAssets(); }

function ldgInitAssetData() {
  // Convert template to working structure if not done yet
  var ad = _ledgerData.assets;
  if (!ad || !ad['비유동자산'] || (ad['비유동자산'][0] && ad['비유동자산'][0]['월별'] !== undefined)) return;
  var groups = ['비유동자산','투자자산','현금자산','부채'];
  var newData = {};
  groups.forEach(function(g) {
    newData[g] = (ad[g] || []).map(function(item) {
      var isAuto = (g === '현금자산' || g === '부채');
      var mapping = isAuto ? (_ldgAssetAutoMappings[item['소분류']] || null) : null;
      var monthly = [null,null,null,null,null,null,null,null,null,null,null,null];
      if (!isAuto) monthly[0] = item['초기값'] || 0; // 1월 = 초기값 for manual items
      return { '소분류': item['소분류'], '월별': monthly, '자동': isAuto, '매핑': mapping, '초기값': item['초기값'] || 0 };
    });
  });
  _ledgerData.assets = newData;
  ldgSaveAssetData();
}

function ldgSaveAssetData() { ldgBackupBeforeSave('atelier_ledger_assets'); localStorage.setItem('atelier_ledger_assets', JSON.stringify(_ledgerData.assets)); scheduleLedgerSync(); }

function ldgComputeAutoValues(year) {
  // Compute auto cells for 현금자산 and 부채 from transactions
  var ad = _ledgerData.assets;
  var txs = (_ledgerData.transactions || []).filter(function(t) { return t.date && t.date.substring(0,4) === String(year); });
  // Group tx by month and mapping key
  var txByMonthMap = {};
  txs.forEach(function(t) {
    var m = parseInt(t.date.split('-')[1]) - 1; // 0-based index
    var key = t['대분류'] + '.' + (t['소분류']||'');
    if (!txByMonthMap[key]) txByMonthMap[key] = [0,0,0,0,0,0,0,0,0,0,0,0];
    txByMonthMap[key][m] += t['금액'];
  });

  ['현금자산','부채'].forEach(function(group) {
    (ad[group] || []).forEach(function(item) {
      if (!item['자동'] || !item['매핑']) return;
      var mapTx = txByMonthMap[item['매핑']] || [0,0,0,0,0,0,0,0,0,0,0,0];
      var init = item['초기값'] || 0;
      var bal = init;
      for (var m = 0; m < 12; m++) {
        if (group === '부채') {
          bal = bal - mapTx[m]; // Subtract repayments
        } else {
          bal = bal + mapTx[m]; // Accumulate savings
        }
        item['월별'][m] = bal;
      }
    });
  });
}

function ldgGetAssetMonthVal(item, mIdx) {
  if (item['월별'] && item['월별'][mIdx] !== null && item['월별'][mIdx] !== undefined) return item['월별'][mIdx];
  return null;
}

function ldgRenderAssets() {
  if (!_ledgerData.assets) return;
  ldgInitAssetData();
  ldgComputeAutoValues(_ldgAssetYear);

  var y = _ldgAssetYear;
  document.getElementById('ldg-asset-title').textContent = y + ' 자산';
  document.getElementById('ldg-asset-prev').textContent = '‹ ' + (y-1) + '년';
  document.getElementById('ldg-asset-next').textContent = (y+1) + '년 ›';

  ldgRenderAssetKPI();
  ldgRenderAssetChart();
  ldgRenderAssetMatrix();
}

function ldgRenderAssetKPI() {
  var ad = _ledgerData.assets;
  // Find latest month with any data
  var latestM = 0;
  ['비유동자산','투자자산','현금자산','부채'].forEach(function(g) {
    (ad[g]||[]).forEach(function(item) {
      for (var m = 11; m >= 0; m--) {
        if (item['월별'][m] !== null && item['월별'][m] !== undefined) { if (m > latestM) latestM = m; break; }
      }
    });
  });

  function sumGroup(g, m) {
    var s = 0;
    (ad[g]||[]).forEach(function(item) { var v = ldgGetAssetMonthVal(item,m); if (v !== null) s += v; });
    return s;
  }
  var totalAsset = sumGroup('비유동자산',latestM) + sumGroup('투자자산',latestM) + sumGroup('현금자산',latestM);
  var totalDebt = sumGroup('부채',latestM);
  var netWorth = totalAsset - totalDebt;

  var prevM = latestM > 0 ? latestM - 1 : null;
  var prevNet = null;
  if (prevM !== null) {
    var pa = sumGroup('비유동자산',prevM) + sumGroup('투자자산',prevM) + sumGroup('현금자산',prevM);
    var pd = sumGroup('부채',prevM);
    prevNet = pa - pd;
  }
  var diff = prevNet !== null ? netWorth - prevNet : null;
  var diffHtml = '';
  if (diff !== null) {
    var color = diff >= 0 ? 'text-emerald-600' : 'text-red-500';
    var arrow = diff >= 0 ? '▲' : '▼';
    diffHtml = '<p class="text-[10px] ' + color + ' mt-1">' + arrow + ' 전월비 ' + (diff >= 0 ? '+' : '') + Math.abs(diff).toLocaleString('ko-KR') + '</p>';
  }
  var kpi = document.getElementById('ldg-asset-kpi');
  kpi.innerHTML =
    '<div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"><p class="text-xs text-slate-500 mb-1">총자산</p><p class="text-xl font-bold text-slate-900" style="font-feature-settings:\'tnum\'">' + ldgFmt(totalAsset) + '</p></div>' +
    '<div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"><p class="text-xs text-slate-500 mb-1">부채</p><p class="text-xl font-bold text-slate-900" style="font-feature-settings:\'tnum\'">' + ldgFmt(totalDebt) + '</p></div>' +
    '<div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border-l-4 border-l-indigo-500"><p class="text-xs text-slate-500 mb-1">순자산</p><p class="text-xl font-bold text-indigo-600" style="font-feature-settings:\'tnum\'">' + ldgFmt(netWorth) + '</p>' + diffHtml + '</div>';
}

function ldgRenderAssetChart() {
  var canvas = document.getElementById('ldg-asset-chart');
  if (!canvas) return;
  if (_ldgAssetChart) _ldgAssetChart.destroy();
  var ad = _ledgerData.assets;
  var labels = [], data = [], pointBg = [], pointR = [];
  for (var m = 0; m < 12; m++) {
    labels.push((m+1) + '월');
    var ta = 0, td = 0, hasData = false;
    ['비유동자산','투자자산','현금자산'].forEach(function(g) {
      (ad[g]||[]).forEach(function(item) { var v = ldgGetAssetMonthVal(item,m); if (v !== null) { ta += v; hasData = true; } });
    });
    (ad['부채']||[]).forEach(function(item) { var v = ldgGetAssetMonthVal(item,m); if (v !== null) { td += v; hasData = true; } });
    data.push(hasData ? ta - td : null);
    pointBg.push(hasData ? '#5b3cdd' : 'rgba(148,163,184,0.5)');
    pointR.push(hasData ? 4 : 3);
  }
  _ldgAssetChart = new Chart(canvas, {
    type: 'line',
    data: { labels: labels, datasets: [{ data: data, borderColor: '#5b3cdd', borderWidth: 2, fill: true,
      backgroundColor: function(ctx) { var g = ctx.chart.ctx.createLinearGradient(0,0,0,ctx.chart.height); g.addColorStop(0,'rgba(91,60,221,0.15)'); g.addColorStop(1,'rgba(91,60,221,0.01)'); return g; },
      tension: 0.3, pointBackgroundColor: pointBg, pointRadius: pointR, pointHoverRadius: 5, spanGaps: true }] },
    options: { responsive:true, maintainAspectRatio:false,
      plugins: { legend:{display:false}, tooltip:{callbacks:{label:function(ctx){return ctx.raw!==null?ldgFmt(ctx.raw):'데이터 없음';}}} },
      scales: { x:{grid:{display:false},ticks:{font:{size:10}}}, y:{grid:{color:'#f1f5f9'},ticks:{font:{size:10},callback:function(v){return ldgFmtShort(v);}}} }
    }
  });
}

function ldgRenderAssetMatrix() {
  var wrap = document.getElementById('ldg-asset-matrix-wrap');
  if (!wrap) return;
  var ad = _ledgerData.assets;
  var groups = [
    { key:'비유동자산', label:'비유동자산', hint:'직접 입력', auto:false },
    { key:'투자자산', label:'투자자산', hint:'직접 입력 (분기 1회 권장)', auto:false },
    { key:'현금자산', label:'현금자산', hint:'거래에서 자동', auto:true },
    { key:'부채', label:'부채', hint:'상환 거래로 자동 차감', auto:true }
  ];

  var html = '<table class="w-full text-left border-collapse" style="min-width:900px"><thead class="bg-slate-50/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 z-10"><tr>';
  html += '<th class="px-3 py-2 sticky left-0 bg-slate-50/80 z-20 min-w-[70px]">분류</th>';
  html += '<th class="px-3 py-2 sticky left-[70px] bg-slate-50/80 z-20 min-w-[80px]">항목</th>';
  for (var m = 1; m <= 12; m++) html += '<th class="px-2 py-2 text-right min-w-[80px]">' + m + '월</th>';
  html += '</tr></thead><tbody class="text-[11px]">';

  var netRow = new Array(12).fill(0);
  var netHasData = new Array(12).fill(false);

  groups.forEach(function(grp) {
    var items = ad[grp.key] || [];
    var subtotals = new Array(12).fill(0);
    var subHas = new Array(12).fill(false);
    var isDebt = grp.key === '부채';
    // Group header
    html += '<tr class="bg-indigo-50/40"><td class="px-3 py-2 sticky left-0 z-10 bg-indigo-50/40 font-bold text-slate-700" colspan="2">' + grp.label + ' <span class="font-normal text-[10px] text-slate-400">' + (grp.auto ? '🔗 ' : '✏️ ') + grp.hint + '</span></td>';
    for (var m = 0; m < 12; m++) html += '<td class="px-2 py-2"></td>';
    html += '</tr>';

    items.forEach(function(item, idx) {
      html += '<tr class="border-b border-slate-50 group">';
      html += '<td class="px-3 py-1.5 sticky left-0 z-10 bg-white"></td>';
      html += '<td class="px-3 py-1.5 sticky left-[70px] z-10 bg-white text-slate-600 flex items-center gap-1"><span ondblclick="ldgEditAssetName(\'' + grp.key + '\',' + idx + ')" class="cursor-pointer">' + item['소분류'] + '</span>' +
        '<button onclick="ldgDelAssetItem(\'' + grp.key + '\',' + idx + ')" class="text-slate-200 hover:text-red-400 opacity-0 group-hover:opacity-100 ml-auto shrink-0"><span class="material-symbols-outlined" style="font-size: var(--font-size-meta)">close</span></button></td>';
      for (var m = 0; m < 12; m++) {
        var val = ldgGetAssetMonthVal(item, m);
        var cellBg = grp.auto ? 'background:#f7f1ff;' : '';
        var cellColor = grp.auto ? 'color:#5b3cdd;' : '';
        if (val !== null && val !== undefined) {
          subtotals[m] += val;
          subHas[m] = true;
          if (!isDebt) netRow[m] += val; else netRow[m] -= val;
          netHasData[m] = true;
        }
        if (grp.auto) {
          // Auto cell - read only
          html += '<td class="px-2 py-1.5 text-right cursor-help" style="' + cellBg + cellColor + 'font-feature-settings:\'tnum\'" title="거래에서 자동 계산됩니다. 거래 추가는 월별 뷰에서.">';
          html += (val !== null && val !== undefined) ? Math.round(val).toLocaleString('ko-KR') : '<span class="text-slate-300">—</span>';
        } else {
          // Manual cell - editable
          html += '<td class="px-2 py-1.5 text-right cursor-pointer hover:bg-indigo-50/50 rounded" style="font-feature-settings:\'tnum\'" onclick="ldgEditAssetCell(\'' + grp.key + '\',' + idx + ',' + m + ',this)">';
          html += (val !== null && val !== undefined) ? Math.round(val).toLocaleString('ko-KR') : '<span class="text-slate-300">—</span>';
        }
        html += '</td>';
      }
      html += '</tr>';
    });
    // Subtotal row
    html += '<tr class="border-b-2 border-slate-200 font-semibold"><td class="px-3 py-1.5 sticky left-0 z-10 bg-slate-50/60"></td><td class="px-3 py-1.5 sticky left-[70px] z-10 bg-slate-50/60 text-slate-500 text-[10px]">소계</td>';
    for (var m = 0; m < 12; m++) {
      html += '<td class="px-2 py-1.5 text-right bg-slate-50/60" style="font-feature-settings:\'tnum\'">' + (subHas[m] ? Math.round(subtotals[m]).toLocaleString('ko-KR') : '<span class="text-slate-300">—</span>') + '</td>';
    }
    html += '</tr>';
  });

  // Net worth row
  html += '<tr class="border-t-2 border-indigo-300 bg-indigo-50/30"><td class="px-3 py-2 sticky left-0 z-10 bg-indigo-50/30 font-bold text-indigo-700" colspan="2">순자산 (Net Worth)</td>';
  for (var m = 0; m < 12; m++) {
    html += '<td class="px-2 py-2 text-right font-bold text-indigo-700" style="font-feature-settings:\'tnum\'">' + (netHasData[m] ? Math.round(netRow[m]).toLocaleString('ko-KR') : '<span class="text-slate-300">—</span>') + '</td>';
  }
  html += '</tr>';
  html += '</tbody></table>';
  wrap.innerHTML = html;
}

function ldgEditAssetCell(group, idx, mIdx, tdEl) {
  var item = _ledgerData.assets[group][idx];
  if (item['자동']) return; // Never edit auto cells
  var current = ldgGetAssetMonthVal(item, mIdx);
  var input = document.createElement('input');
  input.type = 'text';
  input.value = current !== null ? Math.round(current).toLocaleString('ko-KR') : '';
  input.className = 'w-full text-[11px] text-right border border-indigo-300 rounded px-1 py-0.5 outline-none focus:ring-2 focus:ring-indigo-300';
  input.style.fontFeatureSettings = "'tnum'";
  tdEl.innerHTML = '';
  tdEl.appendChild(input);
  tdEl.onclick = null;
  input.focus(); input.select();
  input.oninput = function() { ldgFormatAmount(input); };
  function save() {
    var raw = input.value.replace(/[^0-9]/g, '');
    var val = raw ? parseInt(raw) : null;
    item['월별'][mIdx] = val;
    ldgSaveAssetData();
    ldgRenderAssets();
  }
  input.addEventListener('keydown', function(e) { if (e.key === 'Enter') save(); if (e.key === 'Escape') ldgRenderAssetMatrix(); });
  input.addEventListener('blur', save);
}

function ldgEditAssetName(group, idx) {
  var item = _ledgerData.assets[group][idx];
  var newName = prompt('항목 이름 변경:', item['소분류']);
  if (!newName || !newName.trim() || newName.trim() === item['소분류']) return;
  item['소분류'] = newName.trim();
  ldgSaveAssetData(); ldgRenderAssetMatrix();
}

function ldgDelAssetItem(group, idx) {
  _ldgAssetDelTarget = { group: group, idx: idx };
  document.getElementById('ldg-asset-del-modal').style.display = 'flex';
}
function ldgConfirmDelAsset() {
  if (_ldgAssetDelTarget) {
    _ledgerData.assets[_ldgAssetDelTarget.group].splice(_ldgAssetDelTarget.idx, 1);
    ldgSaveAssetData();
  }
  _ldgAssetDelTarget = null;
  document.getElementById('ldg-asset-del-modal').style.display = 'none';
  ldgRenderAssets();
}

function ldgAddAssetItem() {
  document.getElementById('ldg-asset-add-modal').style.display = 'flex';
  ldgAssetAddGroupChanged();
}
function ldgAssetAddGroupChanged() {
  var g = document.getElementById('ldg-asset-add-group').value;
  var isAuto = g === '현금자산' || g === '부채';
  document.getElementById('ldg-asset-add-mapping-wrap').style.display = isAuto ? '' : 'none';
}
function ldgSaveNewAsset() {
  var group = document.getElementById('ldg-asset-add-group').value;
  var name = (document.getElementById('ldg-asset-add-name').value || '').trim();
  var mapping = (document.getElementById('ldg-asset-add-mapping').value || '').trim();
  var initStr = document.getElementById('ldg-asset-add-init').value || '0';
  var init = parseInt(initStr.replace(/[^0-9]/g,'')) || 0;
  if (!name) { alert('항목 이름을 입력하세요.'); return; }
  var isAuto = group === '현금자산' || group === '부채';
  var monthly = [null,null,null,null,null,null,null,null,null,null,null,null];
  if (!isAuto) monthly[0] = init;
  var entry = { '소분류': name, '월별': monthly, '자동': isAuto, '매핑': isAuto ? (mapping || null) : null, '초기값': init };
  if (!_ledgerData.assets[group]) _ledgerData.assets[group] = [];
  _ledgerData.assets[group].push(entry);
  ldgSaveAssetData();
  document.getElementById('ldg-asset-add-modal').style.display = 'none';
  document.getElementById('ldg-asset-add-name').value = '';
  document.getElementById('ldg-asset-add-mapping').value = '';
  document.getElementById('ldg-asset-add-init').value = '';
  ldgRenderAssets();
}

// ===== DAILY LEDGER: ANNUAL VIEW =====
var _ldgAnnualYear = 2026;
var _ldgAnnualFlowChart = null;
var _ldgAnnualDonutI = null, _ldgAnnualDonutE = null, _ldgAnnualDonutP = null;

function ldgAnnualPrev() { _ldgAnnualYear--; ldgRenderAnnual(); }
function ldgAnnualNext() { _ldgAnnualYear++; ldgRenderAnnual(); }

function ldgGetYearTx(year) {
  var prefix = String(year);
  return (_ledgerData.transactions || []).filter(function(t) { return t.date && t.date.substring(0,4) === prefix; });
}

function ldgJumpToMonth(year, month) {
  _ldgYear = year; _ldgMonth = month;
  switchLedgerTab('monthly');
}

function ldgRenderAnnual() {
  if (!_ledgerData.transactions) return;
  var y = _ldgAnnualYear;
  document.getElementById('ldg-annual-title').textContent = y + ' 연간 뷰';
  document.getElementById('ldg-annual-prev').textContent = '‹ ' + (y-1) + '년';
  document.getElementById('ldg-annual-next').textContent = (y+1) + '년 ›';

  var txs = ldgGetYearTx(y);
  // Monthly aggregates
  var monthly = {};
  for (var m = 1; m <= 12; m++) monthly[m] = { income:0, saving:0, expense:0, txCount:0 };
  txs.forEach(function(t) {
    var m = parseInt(t.date.split('-')[1]);
    monthly[m].txCount++;
    if (t['대분류'] === '수입') monthly[m].income += t['금액'];
    else if (t['대분류'] === '저축') monthly[m].saving += t['금액'];
    else monthly[m].expense += t['금액'];
  });
  var activeMonths = [];
  for (var m = 1; m <= 12; m++) { if (monthly[m].txCount > 0) activeMonths.push(m); }
  var nMonths = activeMonths.length || 1;

  var totalIncome = 0, totalSaving = 0, totalExpense = 0;
  txs.forEach(function(t) {
    if (t['대분류'] === '수입') totalIncome += t['금액'];
    else if (t['대분류'] === '저축') totalSaving += t['금액'];
    else totalExpense += t['금액'];
  });
  var savingRate = totalIncome > 0 ? (totalSaving / totalIncome * 100) : 0;

  // [1] KPI
  var kpiEl = document.getElementById('ldg-annual-kpi');
  kpiEl.innerHTML =
    '<div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"><p class="text-xs text-slate-500 mb-1">수입</p><p class="text-xl font-bold text-slate-900" style="font-feature-settings:\'tnum\'">' + ldgFmt(totalIncome) + '</p><p class="text-[10px] text-slate-400 mt-1">월평균 ' + ldgFmt(Math.round(totalIncome/nMonths)) + '</p></div>' +
    '<div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"><p class="text-xs text-slate-500 mb-1">저축·현금</p><p class="text-xl font-bold text-slate-900" style="font-feature-settings:\'tnum\'">' + ldgFmt(totalSaving) + '</p><p class="text-[10px] text-slate-400 mt-1">저축률 ' + savingRate.toFixed(1) + '%</p></div>' +
    '<div class="bg-white p-6 rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]"><p class="text-xs text-slate-500 mb-1">지출</p><p class="text-xl font-bold text-slate-900" style="font-feature-settings:\'tnum\'">' + ldgFmt(totalExpense) + '</p><p class="text-[10px] text-slate-400 mt-1">월평균 ' + ldgFmt(Math.round(totalExpense/nMonths)) + '</p></div>';

  // [2] Insights
  ldgRenderAnnualInsights(y, txs, monthly, activeMonths);
  // [3] Flow chart
  ldgRenderAnnualFlow(monthly, activeMonths);
  // [4] Donuts
  ldgRenderAnnualDonuts(txs);
  // [5] Matrix
  ldgRenderAnnualMatrix(y, txs, activeMonths);
}

function ldgRenderAnnualInsights(year, txs, monthly, activeMonths) {
  var el = document.getElementById('ldg-annual-insights');
  // TOP expense category
  var catSums = {};
  txs.forEach(function(t) { if (ldgIsExpense(t)) catSums[t['대분류']] = (catSums[t['대분류']]||0) + t['금액']; });
  var topCat = '', topAmt = 0, totalExp = 0;
  for (var k in catSums) { totalExp += catSums[k]; if (catSums[k] > topAmt) { topAmt = catSums[k]; topCat = k; } }
  var topPct = totalExp > 0 ? (topAmt / totalExp * 100).toFixed(0) : 0;
  var chip1 = '<div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">' +
    '<p class="text-xs text-slate-500 mb-2">TOP 지출 카테고리</p>' +
    (topCat ? '<p class="text-sm font-bold text-slate-900">' + topCat + ' · ' + topPct + '%</p><p class="text-xs text-slate-500" style="font-feature-settings:\'tnum\'">' + ldgFmt(topAmt) + '</p>' : '<p class="text-xs text-slate-400">데이터 없음</p>') +
    '</div>';

  // Monthly max/min expense
  var maxM = null, minM = null, maxV = -1, minV = Infinity;
  activeMonths.forEach(function(m) {
    if (monthly[m].expense > maxV) { maxV = monthly[m].expense; maxM = m; }
    if (monthly[m].expense < minV) { minV = monthly[m].expense; minM = m; }
  });
  var chip2 = '<div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">' +
    '<p class="text-xs text-slate-500 mb-2">월별 지출 최고/최저</p>';
  if (activeMonths.length >= 2) {
    chip2 += '<p class="text-xs text-slate-700"><span class="font-bold text-red-500">최고</span> ' + maxM + '월 · ' + ldgFmt(maxV) + '</p>' +
      '<p class="text-xs text-slate-700"><span class="font-bold text-emerald-500">최저</span> ' + minM + '월 · ' + ldgFmt(minV) + '</p>';
  } else if (activeMonths.length === 1) {
    chip2 += '<p class="text-xs text-slate-700">' + activeMonths[0] + '월 · ' + ldgFmt(monthly[activeMonths[0]].expense) + '</p>';
  } else { chip2 += '<p class="text-xs text-slate-400">데이터 없음</p>'; }
  chip2 += '</div>';

  // Year-over-year comparison
  var prevYear = year - 1;
  var prevTxs = ldgGetYearTx(prevYear);
  var chip3 = '<div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">' +
    '<p class="text-xs text-slate-500 mb-2">작년 대비 (' + prevYear + ')</p>';
  if (prevTxs.length === 0) {
    chip3 += '<p class="text-xs text-slate-400">이전 연도 데이터 없음</p>';
  } else {
    // Fair comparison: same months only
    var prevMonthly = {};
    for (var m = 1; m <= 12; m++) prevMonthly[m] = { income:0, saving:0, expense:0 };
    prevTxs.forEach(function(t) {
      var pm = parseInt(t.date.split('-')[1]);
      if (t['대분류'] === '수입') prevMonthly[pm].income += t['금액'];
      else if (t['대분류'] === '저축') prevMonthly[pm].saving += t['금액'];
      else prevMonthly[pm].expense += t['금액'];
    });
    var curI = 0, curS = 0, curE = 0, prevI = 0, prevS = 0, prevE = 0;
    activeMonths.forEach(function(m) {
      curI += monthly[m].income; curS += monthly[m].saving; curE += monthly[m].expense;
      prevI += prevMonthly[m].income; prevS += prevMonthly[m].saving; prevE += prevMonthly[m].expense;
    });
    function yoyPct(cur, prev) { return prev > 0 ? ((cur - prev) / prev * 100).toFixed(0) : (cur > 0 ? '+∞' : '0'); }
    function yoySpan(val, goodIfUp) {
      var n = parseFloat(val);
      var color = (isNaN(n) || n === 0) ? 'text-slate-500' : ((n > 0) === goodIfUp ? 'text-emerald-600' : 'text-red-500');
      var arrow = isNaN(n) ? '' : (n > 0 ? '▲' : (n < 0 ? '▼' : ''));
      return '<span class="' + color + ' font-semibold">' + arrow + ' ' + (n > 0 ? '+' : '') + val + '%</span>';
    }
    chip3 += '<p class="text-xs text-slate-700">수입 ' + yoySpan(yoyPct(curI,prevI), true) + '  지출 ' + yoySpan(yoyPct(curE,prevE), false) + '</p>' +
      '<p class="text-xs text-slate-700">저축 ' + yoySpan(yoyPct(curS,prevS), true) + '</p>';
  }
  chip3 += '</div>';
  el.innerHTML = chip1 + chip2 + chip3;
}

function ldgRenderAnnualFlow(monthly, activeMonths) {
  var canvas = document.getElementById('ldg-annual-flow-chart');
  if (!canvas) return;
  if (_ldgAnnualFlowChart) _ldgAnnualFlowChart.destroy();

  var labels = [], incomeData = [], savingData = [], expenseData = [], rateData = [];
  for (var m = 1; m <= 12; m++) {
    labels.push(m + '월');
    var d = monthly[m];
    var hasData = d.txCount > 0;
    incomeData.push(hasData ? d.income : 0);
    savingData.push(hasData ? d.saving : 0);
    expenseData.push(hasData ? d.expense : 0);
    rateData.push(hasData && d.income > 0 ? Math.round(d.saving / d.income * 100) : null);
  }
  // Placeholder bars for months without data
  var placeholderData = [];
  var maxVal = Math.max.apply(null, incomeData.concat(expenseData).concat(savingData));
  for (var m = 1; m <= 12; m++) {
    placeholderData.push(monthly[m].txCount === 0 ? maxVal * 0.15 : 0);
  }

  _ldgAnnualFlowChart = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [
        { label: '수입', data: incomeData, backgroundColor: '#6366f1', borderRadius: 4, barPercentage: 0.7, categoryPercentage: 0.7, order: 2 },
        { label: '저축', data: savingData, backgroundColor: '#eae0b5', borderRadius: 4, barPercentage: 0.7, categoryPercentage: 0.7, order: 2 },
        { label: '지출', data: expenseData, backgroundColor: '#f4a6a6', borderRadius: 4, barPercentage: 0.7, categoryPercentage: 0.7, order: 2 },
        { label: '(미입력)', data: placeholderData, backgroundColor: '#e2e8f0', borderRadius: 4, barPercentage: 0.7, categoryPercentage: 0.7, order: 2 },
        { label: '저축률', data: rateData, type: 'line', borderColor: '#4f46e5', borderWidth: 2, pointRadius: 3, pointBackgroundColor: '#4f46e5', tension: 0.3, yAxisID: 'y1', order: 1, spanGaps: false }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false }, tooltip: { callbacks: { label: function(ctx) {
        if (ctx.dataset.label === '저축률') return '저축률: ' + ctx.raw + '%';
        if (ctx.dataset.label === '(미입력)') return '';
        return ctx.dataset.label + ': ' + ldgFmt(ctx.raw);
      }}}},
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 11 } } },
        y: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 10 }, callback: function(v) { return ldgFmtShort(v); } } },
        y1: { position: 'right', min: 0, max: 100, grid: { display: false }, ticks: { font: { size: 10 }, callback: function(v) { return v + '%'; } } }
      },
      onClick: function(e, elements) {
        if (elements.length) { var idx = elements[0].index; ldgJumpToMonth(_ldgAnnualYear, idx + 1); }
      }
    }
  });

  // Month strip
  var stripEl = document.getElementById('ldg-annual-strip');
  var stripHtml = '';
  for (var m = 1; m <= 12; m++) {
    var has = monthly[m].txCount > 0;
    stripHtml += '<div class="flex-1 flex flex-col items-center gap-1 cursor-pointer" onclick="ldgJumpToMonth(' + _ldgAnnualYear + ',' + m + ')">' +
      '<div class="w-full h-2 rounded-full ' + (has ? 'bg-indigo-500' : 'bg-slate-200') + '"></div>' +
      '<span class="text-[10px] ' + (has ? 'text-indigo-600 font-semibold' : 'text-slate-400') + '">' + m + '</span></div>';
  }
  stripEl.innerHTML = stripHtml;
}

function ldgRenderAnnualDonuts(txs) {
  var donutColors = ['#6366f1','#a855f7','#3b82f6','#10b981','#f59e0b','#ef4444','#ec4899','#14b8a6','#f97316','#8b5cf6','#06b6d4','#84cc16','#e11d48','#7c3aed'];

  function renderADonut(canvasId, legendId, dataObj, chartRef) {
    var canvas = document.getElementById(canvasId);
    var legendEl = document.getElementById(legendId);
    if (!canvas) return null;
    if (chartRef) chartRef.destroy();
    var labels = Object.keys(dataObj).sort(function(a,b){return dataObj[b]-dataObj[a];});
    var values = labels.map(function(l){return dataObj[l];});
    var total = values.reduce(function(a,b){return a+b;},0);
    // Legend
    if (legendEl) {
      legendEl.innerHTML = labels.slice(0,6).map(function(l,i) {
        var pct = total > 0 ? (dataObj[l]/total*100).toFixed(0) : 0;
        return '<div class="flex items-center gap-2"><div class="w-2 h-2 rounded-full" style="background:' + donutColors[i%donutColors.length] + '"></div><span class="text-slate-600">' + l + '</span><span class="font-semibold ml-auto" style="font-feature-settings:\'tnum\'">' + pct + '%</span></div>';
      }).join('');
    }
    if (labels.length === 0) {
      var ctx = canvas.getContext('2d'); ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.fillStyle='#94a3b8'; ctx.font='12px Inter'; ctx.textAlign='center'; ctx.fillText('데이터 없음',canvas.width/2,canvas.height/2);
      return null;
    }
    return new Chart(canvas, {
      type: 'doughnut',
      data: { labels: labels, datasets: [{ data: values, backgroundColor: donutColors.slice(0,labels.length), borderWidth: 0 }] },
      options: { responsive:true, maintainAspectRatio:true, cutout:'65%', plugins: { legend:{display:false}, tooltip:{callbacks:{label:function(ctx){return ctx.label+': '+ldgFmt(ctx.raw);}}} } },
      plugins: [{ id:'centerTextAnnual', afterDraw: function(chart) {
        if (!chart.data.datasets[0].data.length) return;
        var t = chart.data.datasets[0].data.reduce(function(a,b){return a+b;},0);
        var mx = Math.max.apply(null,chart.data.datasets[0].data);
        var pct = t>0?Math.round(mx/t*100):0;
        var mi = chart.data.datasets[0].data.indexOf(mx);
        var lb = chart.data.labels[mi];
        var ctx=chart.ctx; ctx.save(); ctx.textAlign='center';
        ctx.fillStyle='#1e293b'; ctx.font='bold 16px Inter'; ctx.fillText(pct+'%',chart.width/2,chart.height/2-2);
        ctx.font='9px Inter'; ctx.fillStyle='#94a3b8'; ctx.fillText(lb,chart.width/2,chart.height/2+12);
        ctx.restore();
      }}]
    });
  }

  // Income by subcategory
  var incBySub = {};
  txs.forEach(function(t) { if (t['대분류']==='수입') incBySub[t['소분류']||'기타'] = (incBySub[t['소분류']||'기타']||0) + t['금액']; });
  _ldgAnnualDonutI = renderADonut('ldg-annual-donut-income','ldg-annual-donut-income-legend', incBySub, _ldgAnnualDonutI);

  // Expense by major category
  var expByCat = {};
  txs.forEach(function(t) { if (ldgIsExpense(t)) expByCat[t['대분류']||'기타'] = (expByCat[t['대분류']||'기타']||0) + t['금액']; });
  _ldgAnnualDonutE = renderADonut('ldg-annual-donut-expense','ldg-annual-donut-expense-legend', expByCat, _ldgAnnualDonutE);

  // Payment method
  var pmSums = {};
  txs.forEach(function(t) { var p = t['결제수단']||'미분류'; pmSums[p] = (pmSums[p]||0) + t['금액']; });
  _ldgAnnualDonutP = renderADonut('ldg-annual-donut-payment','ldg-annual-donut-payment-legend', pmSums, _ldgAnnualDonutP);
}

function ldgRenderAnnualMatrix(year, txs, activeMonths) {
  var wrap = document.getElementById('ldg-annual-matrix-wrap');
  if (!wrap) return;
  var cats = _ledgerData.categories || {};
  var catKeys = Object.keys(cats);
  var nMonths = activeMonths.length || 1;

  // Build aggregation: major.minor.month -> sum
  var agg = {};
  txs.forEach(function(t) {
    var m = parseInt(t.date.split('-')[1]);
    var key = t['대분류'] + '|' + (t['소분류']||'기타');
    if (!agg[key]) agg[key] = {};
    agg[key][m] = (agg[key][m]||0) + t['금액'];
  });

  var html = '<table class="w-full text-left border-collapse" style="min-width:900px"><thead class="bg-slate-50/80 text-[10px] font-bold text-slate-400 uppercase tracking-wider sticky top-0 z-10"><tr>';
  html += '<th class="px-3 py-2 sticky left-0 bg-slate-50/80 z-20 min-w-[70px]">대분류</th>';
  html += '<th class="px-3 py-2 sticky left-[70px] bg-slate-50/80 z-20 min-w-[80px]">소분류</th>';
  for (var m = 1; m <= 12; m++) {
    var hasData = activeMonths.indexOf(m) >= 0;
    html += '<th class="px-2 py-2 text-right min-w-[68px] ' + (hasData ? 'text-indigo-600 cursor-pointer hover:bg-indigo-50' : 'text-slate-300') + '" ' + (hasData ? 'onclick="ldgJumpToMonth(' + year + ',' + m + ')"' : '') + '>' + m + '월' + (hasData ? ' ↗' : '') + '</th>';
  }
  html += '<th class="px-2 py-2 text-right min-w-[72px] bg-slate-100/60">합계</th>';
  html += '<th class="px-2 py-2 text-right min-w-[72px] bg-slate-100/60">평균</th>';
  html += '</tr></thead><tbody class="text-[11px]">';

  catKeys.forEach(function(major) {
    var subs = cats[major] || [];
    subs.forEach(function(minor, si) {
      var key = major + '|' + minor;
      var rowSum = 0;
      var isMajorRow = si === 0;
      var bg = isMajorRow ? ' bg-indigo-50/30' : '';
      html += '<tr class="border-b border-slate-50' + bg + '">';
      html += '<td class="px-3 py-1.5 sticky left-0 z-10 font-semibold text-slate-700' + bg + (isMajorRow ? '' : ' text-transparent') + '">' + (isMajorRow ? major : major) + '</td>';
      html += '<td class="px-3 py-1.5 sticky left-[70px] z-10 text-slate-600' + bg + '">' + minor + '</td>';
      for (var mm = 1; mm <= 12; mm++) {
        var val = (agg[key] && agg[key][mm]) || 0;
        rowSum += val;
        html += '<td class="px-2 py-1.5 text-right" style="font-feature-settings:\'tnum\'">';
        if (val === 0) html += '<span class="text-slate-300">—</span>';
        else html += Math.round(val/1000).toLocaleString('ko-KR') + 'k';
        html += '</td>';
      }
      var avg = nMonths > 0 ? Math.round(rowSum / nMonths) : 0;
      html += '<td class="px-2 py-1.5 text-right font-semibold bg-slate-50/60" style="font-feature-settings:\'tnum\'">' + (rowSum === 0 ? '<span class="text-slate-300">—</span>' : Math.round(rowSum/1000).toLocaleString('ko-KR') + 'k') + '</td>';
      html += '<td class="px-2 py-1.5 text-right text-slate-500 bg-slate-50/60" style="font-feature-settings:\'tnum\'">' + (avg === 0 ? '<span class="text-slate-300">—</span>' : Math.round(avg/1000).toLocaleString('ko-KR') + 'k') + '</td>';
      html += '</tr>';
    });
  });
  html += '</tbody></table>';
  wrap.innerHTML = html;
}

// ===== DAILY LEDGER: SETTINGS TABS =====
var _ldgSubTab = 'categories';
var _ldgSelectedMajor = null;
var _ldgBudgetView = 'default';
var _ldgSafetyCallback = null;
var _ldgRecEditIdx = null;

function ldgRenderSettings() {
  ldgSetSubTab(_ldgSubTab);
  ldgCheckMigrationState();
}

function ldgSetSubTab(tab) {
  _ldgSubTab = tab;
  document.querySelectorAll('.ldg-stab-panel').forEach(function(p) { p.style.display = 'none'; });
  var panel = document.getElementById('ldg-stab-' + tab);
  if (panel) panel.style.display = 'block';
  document.querySelectorAll('.ldg-stab').forEach(function(btn) {
    if (btn.dataset.stab === tab) {
      btn.style.background = 'linear-gradient(135deg,#6366f1,#a855f7)'; btn.style.color = '#fff';
    } else {
      btn.style.background = '#f1f5f9'; btn.style.color = '#64748b';
    }
  });
  if (tab === 'categories') ldgRenderCats();
  if (tab === 'payments') ldgRenderPMs();
  if (tab === 'budgets') { ldgSetBudgetView(_ldgBudgetView); }
  if (tab === 'recurring') ldgRenderRecurring();
  if (tab === 'goals') ldgRenderGoals();
  if (tab === 'aiconfig') ldgRenderAIConfig();
  if (tab === 'data') { ldgRenderBackupUI(); ldgCheckMigrationState(); }
}

function ldgSaveCats() { ldgBackupBeforeSave('atelier_ledger_categories'); localStorage.setItem('atelier_ledger_categories', JSON.stringify(_ledgerData.categories)); scheduleLedgerSync(); }
function ldgSaveSettings() { ldgBackupBeforeSave('atelier_ledger_settings'); localStorage.setItem('atelier_ledger_settings', JSON.stringify(_ledgerData.settings)); scheduleLedgerSync(); }
function ldgSaveBudgets() { ldgBackupBeforeSave('atelier_ledger_budgets'); localStorage.setItem('atelier_ledger_budgets', JSON.stringify(_ledgerData.budgets)); scheduleLedgerSync(); }
function ldgSaveRecurringData() { ldgBackupBeforeSave('atelier_ledger_recurring'); localStorage.setItem('atelier_ledger_recurring', JSON.stringify(_ledgerData.recurring)); scheduleLedgerSync(); }

// ── Safety modal ──
function ldgSafetyShow(msg, cb, btnLabel) {
  document.getElementById('ldg-safety-msg').textContent = msg;
  _ldgSafetyCallback = cb;
  var btn = document.getElementById('ldg-safety-confirm-btn');
  if (btn) { btn.textContent = btnLabel || '삭제'; btn.className = 'px-4 py-2 text-sm rounded-lg ' + (btnLabel ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-red-500 hover:bg-red-600 text-white'); }
  document.getElementById('ldg-safety-modal').style.display = 'flex';
}
function ldgSafetyCancel() { _ldgSafetyCallback = null; document.getElementById('ldg-safety-modal').style.display = 'none'; }
function ldgSafetyConfirm() {
  if (_ldgSafetyCallback) _ldgSafetyCallback();
  _ldgSafetyCallback = null;
  document.getElementById('ldg-safety-modal').style.display = 'none';
}

function ldgCountUsage(field, value) {
  return (_ledgerData.transactions || []).filter(function(t) { return t[field] === value; }).length;
}

// ── Categories Tab ──
function ldgRenderCats() {
  var cats = _ledgerData.categories || {};
  var keys = Object.keys(cats);
  document.getElementById('ldg-cat-major-count').textContent = keys.length + '개';
  if (!_ldgSelectedMajor || !cats[_ldgSelectedMajor]) _ldgSelectedMajor = keys[0] || null;
  var majorList = document.getElementById('ldg-cat-major-list');
  majorList.innerHTML = keys.map(function(k, i) {
    var active = k === _ldgSelectedMajor;
    return '<div class="flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer group transition-all ' +
      (active ? 'bg-indigo-50 border-l-4 border-l-indigo-500' : 'hover:bg-slate-50 border-l-4 border-l-transparent') +
      '" draggable="true" ondragstart="ldgDragMajor(event,' + i + ')" ondragover="event.preventDefault()" ondrop="ldgDropMajor(event,' + i + ')" onclick="ldgSelectMajor(\'' + k.replace(/'/g,"\\'") + '\')">' +
      '<span class="material-symbols-outlined text-slate-300 text-sm cursor-grab">drag_indicator</span>' +
      '<span class="flex-1 text-xs font-semibold text-slate-700" ondblclick="ldgEditMajorName(event,\'' + k.replace(/'/g,"\\'") + '\')">' + k + '</span>' +
      '<button onclick="event.stopPropagation();ldgDeleteMajor(\'' + k.replace(/'/g,"\\'") + '\')" class="text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><span class="material-symbols-outlined text-sm">close</span></button>' +
      '</div>';
  }).join('');
  ldgRenderMinorCats();
}

function ldgSelectMajor(k) { _ldgSelectedMajor = k; ldgRenderCats(); }

function ldgRenderMinorCats() {
  var cats = _ledgerData.categories || {};
  var subs = _ldgSelectedMajor ? (cats[_ldgSelectedMajor] || []) : [];
  document.getElementById('ldg-cat-minor-title').textContent = _ldgSelectedMajor ? '소분류 · ' + _ldgSelectedMajor : '소분류';
  document.getElementById('ldg-add-minor-btn').style.display = _ldgSelectedMajor ? '' : 'none';
  var list = document.getElementById('ldg-cat-minor-list');
  if (!_ldgSelectedMajor) { list.innerHTML = '<p class="text-xs text-slate-400 p-2">대분류를 선택하세요</p>'; return; }
  list.innerHTML = subs.map(function(s, i) {
    return '<div class="flex items-center gap-2 px-3 py-2 rounded-lg group hover:bg-slate-50 transition-all" draggable="true" ondragstart="ldgDragMinor(event,' + i + ')" ondragover="event.preventDefault()" ondrop="ldgDropMinor(event,' + i + ')">' +
      '<span class="material-symbols-outlined text-slate-300 text-sm cursor-grab">drag_indicator</span>' +
      '<span class="flex-1 text-xs text-slate-600" ondblclick="ldgEditMinorName(event,' + i + ')">' + s + '</span>' +
      '<button onclick="ldgDeleteMinor(' + i + ')" class="text-slate-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"><span class="material-symbols-outlined text-sm">close</span></button>' +
      '</div>';
  }).join('');
}

// Drag reorder - major
var _ldgDragMajorIdx = null;
function ldgDragMajor(e, i) { _ldgDragMajorIdx = i; e.dataTransfer.effectAllowed = 'move'; }
function ldgDropMajor(e, i) {
  e.preventDefault();
  if (_ldgDragMajorIdx === null || _ldgDragMajorIdx === i) return;
  var cats = _ledgerData.categories;
  var keys = Object.keys(cats);
  var moved = keys.splice(_ldgDragMajorIdx, 1)[0];
  keys.splice(i, 0, moved);
  var newCats = {};
  keys.forEach(function(k) { newCats[k] = cats[k]; });
  _ledgerData.categories = newCats;
  ldgSaveCats(); ldgRenderCats();
}
// Drag reorder - minor
var _ldgDragMinorIdx = null;
function ldgDragMinor(e, i) { _ldgDragMinorIdx = i; e.dataTransfer.effectAllowed = 'move'; }
function ldgDropMinor(e, i) {
  e.preventDefault();
  if (_ldgDragMinorIdx === null || _ldgDragMinorIdx === i || !_ldgSelectedMajor) return;
  var subs = _ledgerData.categories[_ldgSelectedMajor];
  var moved = subs.splice(_ldgDragMinorIdx, 1)[0];
  subs.splice(i, 0, moved);
  ldgSaveCats(); ldgRenderMinorCats();
}

function ldgAddMajorCat() {
  var name = prompt('새 대분류 이름:');
  if (!name || !name.trim()) return;
  name = name.trim();
  if (_ledgerData.categories[name]) { alert('이미 존재하는 대분류입니다.'); return; }
  _ledgerData.categories[name] = [];
  ldgSaveCats(); _ldgSelectedMajor = name; ldgRenderCats();
}

function ldgEditMajorName(e, oldName) {
  e.stopPropagation();
  var span = e.target;
  var input = document.createElement('input');
  input.type = 'text'; input.value = oldName;
  input.className = 'text-xs border border-indigo-300 rounded px-2 py-1 w-full outline-none focus:ring-2 focus:ring-indigo-300';
  span.replaceWith(input);
  input.focus(); input.select();
  function save() {
    var newName = input.value.trim();
    if (!newName || newName === oldName) { ldgRenderCats(); return; }
    if (_ledgerData.categories[newName]) { alert('이미 존재하는 대분류입니다.'); ldgRenderCats(); return; }
    // Migrate categories
    var cats = _ledgerData.categories;
    var newCats = {};
    Object.keys(cats).forEach(function(k) { newCats[k === oldName ? newName : k] = cats[k]; });
    _ledgerData.categories = newCats;
    // Migrate transactions
    (_ledgerData.transactions || []).forEach(function(t) { if (t['대분류'] === oldName) t['대분류'] = newName; });
    // Migrate budgets
    var budgets = _ledgerData.budgets || {};
    var newBudgets = {};
    Object.keys(budgets).forEach(function(k) {
      var parts = k.split('.');
      newBudgets[(parts[0] === oldName ? newName : parts[0]) + '.' + parts.slice(1).join('.')] = budgets[k];
    });
    _ledgerData.budgets = newBudgets;
    ldgSaveCats(); ldgSaveTx(); ldgSaveBudgets();
    if (_ldgSelectedMajor === oldName) _ldgSelectedMajor = newName;
    ldgRenderCats();
  }
  input.addEventListener('keydown', function(ev) { if (ev.key === 'Enter') save(); if (ev.key === 'Escape') ldgRenderCats(); });
  input.addEventListener('blur', save);
}

function ldgDeleteMajor(name) {
  var count = ldgCountUsage('대분류', name);
  var msg = count > 0
    ? '"' + name + '"는 ' + count + '건의 거래에서 사용 중입니다.\n삭제하면 해당 거래의 카테고리가 "미분류"로 변경됩니다.'
    : '"' + name + '" 대분류를 삭제하시겠습니까?\n포함된 소분류도 함께 삭제됩니다.';
  ldgSafetyShow(msg, function() {
    if (count > 0) {
      (_ledgerData.transactions || []).forEach(function(t) {
        if (t['대분류'] === name) { t['대분류'] = '미분류'; t['소분류'] = '미분류'; }
      });
      ldgSaveTx();
    }
    // Remove budgets for this category
    var budgets = _ledgerData.budgets || {};
    Object.keys(budgets).forEach(function(k) { if (k.split('.')[0] === name) delete budgets[k]; });
    ldgSaveBudgets();
    delete _ledgerData.categories[name];
    ldgSaveCats();
    if (_ldgSelectedMajor === name) _ldgSelectedMajor = Object.keys(_ledgerData.categories)[0] || null;
    ldgRenderCats();
  });
}

function ldgAddMinorCat() {
  if (!_ldgSelectedMajor) return;
  var name = prompt('새 소분류 이름:');
  if (!name || !name.trim()) return;
  name = name.trim();
  var subs = _ledgerData.categories[_ldgSelectedMajor];
  if (subs.indexOf(name) >= 0) { alert('이미 존재하는 소분류입니다.'); return; }
  subs.push(name);
  ldgSaveCats(); ldgRenderMinorCats();
}

function ldgEditMinorName(e, idx) {
  e.stopPropagation();
  if (!_ldgSelectedMajor) return;
  var span = e.target;
  var oldName = _ledgerData.categories[_ldgSelectedMajor][idx];
  var input = document.createElement('input');
  input.type = 'text'; input.value = oldName;
  input.className = 'text-xs border border-indigo-300 rounded px-2 py-1 w-full outline-none focus:ring-2 focus:ring-indigo-300';
  span.replaceWith(input);
  input.focus(); input.select();
  function save() {
    var newName = input.value.trim();
    if (!newName || newName === oldName) { ldgRenderMinorCats(); return; }
    _ledgerData.categories[_ldgSelectedMajor][idx] = newName;
    // Migrate transactions
    (_ledgerData.transactions || []).forEach(function(t) {
      if (t['대분류'] === _ldgSelectedMajor && t['소분류'] === oldName) t['소분류'] = newName;
    });
    // Migrate budgets
    var bKey = _ldgSelectedMajor + '.' + oldName;
    var nKey = _ldgSelectedMajor + '.' + newName;
    if (_ledgerData.budgets[bKey]) { _ledgerData.budgets[nKey] = _ledgerData.budgets[bKey]; delete _ledgerData.budgets[bKey]; }
    ldgSaveCats(); ldgSaveTx(); ldgSaveBudgets(); ldgRenderMinorCats();
  }
  input.addEventListener('keydown', function(ev) { if (ev.key === 'Enter') save(); if (ev.key === 'Escape') ldgRenderMinorCats(); });
  input.addEventListener('blur', save);
}

function ldgDeleteMinor(idx) {
  if (!_ldgSelectedMajor) return;
  var name = _ledgerData.categories[_ldgSelectedMajor][idx];
  var count = (_ledgerData.transactions || []).filter(function(t) { return t['대분류'] === _ldgSelectedMajor && t['소분류'] === name; }).length;
  var msg = count > 0
    ? '"' + _ldgSelectedMajor + ' > ' + name + '"는 ' + count + '건의 거래에서 사용 중입니다.\n삭제하면 해당 거래의 소분류가 "미분류"로 변경됩니다.'
    : '"' + name + '" 소분류를 삭제하시겠습니까?';
  ldgSafetyShow(msg, function() {
    if (count > 0) {
      (_ledgerData.transactions || []).forEach(function(t) {
        if (t['대분류'] === _ldgSelectedMajor && t['소분류'] === name) t['소분류'] = '미분류';
      });
      ldgSaveTx();
    }
    var bKey = _ldgSelectedMajor + '.' + name;
    if (_ledgerData.budgets[bKey]) { delete _ledgerData.budgets[bKey]; ldgSaveBudgets(); }
    _ledgerData.categories[_ldgSelectedMajor].splice(idx, 1);
    ldgSaveCats(); ldgRenderMinorCats();
  });
}

// ── Payment Methods Tab ──
function ldgRenderPMs() {
  var pms = (_ledgerData.settings || {}).paymentMethods || [];
  var disabled = (_ledgerData.settings || {}).disabledPayments || [];
  var list = document.getElementById('ldg-pm-list');
  list.innerHTML = pms.map(function(pm, i) {
    var isActive = disabled.indexOf(pm) < 0;
    return '<div class="flex items-center gap-3 px-4 py-3 bg-white rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] group" draggable="true" ondragstart="ldgDragPM(event,' + i + ')" ondragover="event.preventDefault()" ondrop="ldgDropPM(event,' + i + ')">' +
      '<span class="material-symbols-outlined text-slate-300 text-sm cursor-grab">drag_indicator</span>' +
      '<div class="w-2 h-2 rounded-full" style="background:' + (_ldgPaymentColors[pm] || '#94a3b8') + '"></div>' +
      '<span class="flex-1 text-sm font-medium text-slate-700" ondblclick="ldgEditPMName(event,' + i + ')">' + pm + '</span>' +
      '<span class="text-xs text-slate-400 mr-2">' + (isActive ? '활성' : '비활성') + '</span>' +
      '<label class="relative inline-flex items-center cursor-pointer"><input type="checkbox" ' + (isActive ? 'checked' : '') + ' onchange="ldgTogglePM(' + i + ')" class="sr-only peer"/><div class="w-9 h-5 bg-slate-200 peer-focus:ring-2 peer-focus:ring-indigo-300 rounded-full peer peer-checked:bg-indigo-600 after:content-[\'\'] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-full"></div></label>' +
      '<div class="relative"><button onclick="ldgShowPMMenu(event,' + i + ')" class="text-slate-300 hover:text-slate-500"><span class="material-symbols-outlined text-sm">more_horiz</span></button></div>' +
      '</div>';
  }).join('');
}

var _ldgDragPMIdx = null;
function ldgDragPM(e, i) { _ldgDragPMIdx = i; e.dataTransfer.effectAllowed = 'move'; }
function ldgDropPM(e, i) {
  e.preventDefault();
  if (_ldgDragPMIdx === null || _ldgDragPMIdx === i) return;
  var pms = _ledgerData.settings.paymentMethods;
  var moved = pms.splice(_ldgDragPMIdx, 1)[0];
  pms.splice(i, 0, moved);
  ldgSaveSettings(); ldgRenderPMs();
}

function ldgTogglePM(i) {
  var pm = _ledgerData.settings.paymentMethods[i];
  if (!_ledgerData.settings.disabledPayments) _ledgerData.settings.disabledPayments = [];
  var dis = _ledgerData.settings.disabledPayments;
  var idx = dis.indexOf(pm);
  if (idx >= 0) dis.splice(idx, 1); else dis.push(pm);
  ldgSaveSettings(); ldgRenderPMs();
}

function ldgAddPayment() {
  var name = prompt('새 결제수단 이름:');
  if (!name || !name.trim()) return;
  name = name.trim();
  if (_ledgerData.settings.paymentMethods.indexOf(name) >= 0) { alert('이미 존재합니다.'); return; }
  _ledgerData.settings.paymentMethods.push(name);
  ldgSaveSettings(); ldgRenderPMs();
}

function ldgShowPMMenu(e, i) {
  e.stopPropagation();
  var old = document.getElementById('ldg-pm-menu'); if (old) old.remove();
  var rect = e.currentTarget.getBoundingClientRect();
  var menu = document.createElement('div');
  menu.id = 'ldg-pm-menu';
  menu.className = 'fixed bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-[9999]';
  menu.style.top = rect.bottom + 4 + 'px';
  menu.style.left = (rect.left - 80) + 'px';
  menu.innerHTML =
    '<button onclick="ldgRenamePM(' + i + ')" class="w-full text-left px-4 py-2 text-xs text-slate-600 hover:bg-slate-50">이름 변경</button>' +
    '<button onclick="ldgDeletePM(' + i + ')" class="w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-red-50">삭제</button>';
  document.body.appendChild(menu);
  setTimeout(function() { document.addEventListener('click', function h() { var m = document.getElementById('ldg-pm-menu'); if(m)m.remove(); document.removeEventListener('click',h); }); }, 10);
}

function ldgEditPMName(e, i) {
  e.stopPropagation();
  var span = e.target;
  var oldName = _ledgerData.settings.paymentMethods[i];
  var input = document.createElement('input');
  input.type = 'text'; input.value = oldName;
  input.className = 'text-xs border border-indigo-300 rounded px-2 py-1 w-full outline-none focus:ring-2 focus:ring-indigo-300';
  span.replaceWith(input); input.focus(); input.select();
  function save() {
    var newName = input.value.trim();
    if (!newName || newName === oldName) { ldgRenderPMs(); return; }
    _ledgerData.settings.paymentMethods[i] = newName;
    // Update disabledPayments
    if (_ledgerData.settings.disabledPayments) {
      var dIdx = _ledgerData.settings.disabledPayments.indexOf(oldName);
      if (dIdx >= 0) _ledgerData.settings.disabledPayments[dIdx] = newName;
    }
    // Migrate transactions
    (_ledgerData.transactions || []).forEach(function(t) { if (t['결제수단'] === oldName) t['결제수단'] = newName; });
    // Update color map
    if (_ldgPaymentColors[oldName]) { _ldgPaymentColors[newName] = _ldgPaymentColors[oldName]; delete _ldgPaymentColors[oldName]; }
    ldgSaveSettings(); ldgSaveTx(); ldgRenderPMs();
  }
  input.addEventListener('keydown', function(ev) { if (ev.key === 'Enter') save(); if (ev.key === 'Escape') ldgRenderPMs(); });
  input.addEventListener('blur', save);
}

function ldgRenamePM(i) {
  var m = document.getElementById('ldg-pm-menu'); if (m) m.remove();
  var oldName = _ledgerData.settings.paymentMethods[i];
  var newName = prompt('새 이름:', oldName);
  if (!newName || !newName.trim() || newName.trim() === oldName) return;
  newName = newName.trim();
  _ledgerData.settings.paymentMethods[i] = newName;
  if (_ledgerData.settings.disabledPayments) {
    var dIdx = _ledgerData.settings.disabledPayments.indexOf(oldName);
    if (dIdx >= 0) _ledgerData.settings.disabledPayments[dIdx] = newName;
  }
  (_ledgerData.transactions || []).forEach(function(t) { if (t['결제수단'] === oldName) t['결제수단'] = newName; });
  if (_ldgPaymentColors[oldName]) { _ldgPaymentColors[newName] = _ldgPaymentColors[oldName]; delete _ldgPaymentColors[oldName]; }
  ldgSaveSettings(); ldgSaveTx(); ldgRenderPMs();
}

function ldgDeletePM(i) {
  var m = document.getElementById('ldg-pm-menu'); if (m) m.remove();
  var pm = _ledgerData.settings.paymentMethods[i];
  var count = ldgCountUsage('결제수단', pm);
  var msg = count > 0
    ? '"' + pm + '"는 ' + count + '건의 거래에서 사용 중입니다.\n\n비활성화하면 목록에서 숨겨지지만 데이터는 보존됩니다.\n정말 삭제하시겠습니까?'
    : '"' + pm + '"를 삭제하시겠습니까?\n\n비활성화하면 목록에서 숨겨지지만 데이터는 보존됩니다.\n정말 삭제하시겠습니까?';
  ldgSafetyShow(msg, function() {
    _ledgerData.settings.paymentMethods.splice(i, 1);
    if (_ledgerData.settings.disabledPayments) {
      var dIdx = _ledgerData.settings.disabledPayments.indexOf(pm);
      if (dIdx >= 0) _ledgerData.settings.disabledPayments.splice(dIdx, 1);
    }
    ldgSaveSettings(); ldgRenderPMs();
  });
}

// ── Budget Tab ──
function ldgSetBudgetView(view) {
  _ldgBudgetView = view;
  document.querySelectorAll('.ldg-bview').forEach(function(btn) {
    if (btn.dataset.bview === view) {
      btn.style.background = 'linear-gradient(135deg,#6366f1,#a855f7)'; btn.style.color = '#fff';
    } else {
      btn.style.background = '#f1f5f9'; btn.style.color = '#64748b';
    }
  });
  document.getElementById('ldg-budget-default').style.display = view === 'default' ? '' : 'none';
  document.getElementById('ldg-budget-matrix').style.display = view === 'matrix' ? '' : 'none';
  if (view === 'default') ldgRenderBudgetDefault();
  if (view === 'matrix') ldgRenderBudgetMatrix();
}

function ldgRenderBudgetDefault() {
  var budgets = _ledgerData.budgets || {};
  var keys = Object.keys(budgets);
  var html = '<table class="w-full text-left"><thead class="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider"><tr><th class="px-6 py-3">카테고리.소분류</th><th class="px-4 py-3 text-right w-32">기본 예산</th><th class="px-4 py-3 w-40">월별 변동</th><th class="px-4 py-3 w-10"></th></tr></thead><tbody class="text-sm divide-y divide-slate-50">';
  keys.forEach(function(k) {
    var b = budgets[k];
    var overrides = b.overrides || {};
    var oKeys = Object.keys(overrides);
    var oText = oKeys.length > 0
      ? oKeys.length + '건 (' + oKeys.map(function(m){return parseInt(m.split('-')[1])+'월';}).join(', ') + ')'
      : '0건';
    html += '<tr class="hover:bg-indigo-50/30 transition-colors">';
    html += '<td class="px-6 py-3 text-xs font-medium text-slate-700">' + k + '</td>';
    html += '<td class="px-4 py-3 text-xs text-right font-semibold text-slate-900 cursor-pointer hover:bg-indigo-50 rounded" style="font-feature-settings:\'tnum\'" onclick="ldgEditBudgetDefault(\'' + k.replace(/'/g,"\\'") + '\')" title="클릭하여 편집">' + (b.default||0).toLocaleString('ko-KR') + '</td>';
    html += '<td class="px-4 py-3 text-xs text-slate-500">' + oText + '</td>';
    html += '<td class="px-4 py-3"><button onclick="ldgDeleteBudget(\'' + k.replace(/'/g,"\\'") + '\')" class="text-slate-300 hover:text-red-400"><span class="material-symbols-outlined text-sm">close</span></button></td>';
    html += '</tr>';
  });
  html += '</tbody></table>';
  document.getElementById('ldg-budget-default').innerHTML = html;
}

function ldgEditBudgetDefault(key) {
  var b = _ledgerData.budgets[key];
  if (!b) return;
  var val = prompt('기본 예산 (' + key + '):', b.default || 0);
  if (val === null) return;
  var num = parseInt(String(val).replace(/[^0-9]/g,'')) || 0;
  b.default = num;
  ldgSaveBudgets(); ldgRenderBudgetDefault();
}

function ldgDeleteBudget(key) {
  ldgSafetyShow('"' + key + '" 예산을 삭제하시겠습니까?', function() {
    delete _ledgerData.budgets[key];
    ldgSaveBudgets();
    if (_ldgBudgetView === 'default') ldgRenderBudgetDefault();
    else ldgRenderBudgetMatrix();
  });
}

function ldgAddBudget() {
  var cats = _ledgerData.categories || {};
  var keys = Object.keys(cats);
  var major = prompt('대분류 선택 (입력):\n' + keys.join(', '));
  if (!major || !cats[major]) { if (major) alert('존재하지 않는 대분류입니다.'); return; }
  var subs = cats[major];
  var minor = prompt('소분류 선택 (입력):\n' + subs.join(', '));
  if (!minor || subs.indexOf(minor) < 0) { if (minor) alert('존재하지 않는 소분류입니다.'); return; }
  var bKey = major + '.' + minor;
  if (_ledgerData.budgets[bKey]) { alert('이미 예산이 설정되어 있습니다.'); return; }
  var amt = prompt('기본 예산 금액:');
  if (amt === null) return;
  var num = parseInt(String(amt).replace(/[^0-9]/g,'')) || 0;
  _ledgerData.budgets[bKey] = { default: num, overrides: {} };
  ldgSaveBudgets();
  if (_ldgBudgetView === 'default') ldgRenderBudgetDefault();
  else ldgRenderBudgetMatrix();
}

function ldgRenderBudgetMatrix() {
  var budgets = _ledgerData.budgets || {};
  var keys = Object.keys(budgets);
  var months = [];
  for (var m = 1; m <= 12; m++) months.push(String(_ldgYear) + '-' + String(m).padStart(2,'0'));
  var html = '<table class="w-full text-left"><thead class="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider"><tr><th class="px-4 py-3 sticky left-0 bg-slate-50/50 z-10 min-w-[160px]">카테고리</th>';
  months.forEach(function(mk, i) { html += '<th class="px-3 py-3 text-right min-w-[80px]">' + (i+1) + '월</th>'; });
  html += '</tr></thead><tbody class="text-sm divide-y divide-slate-50">';
  keys.forEach(function(k) {
    var b = budgets[k];
    html += '<tr class="hover:bg-indigo-50/30 transition-colors">';
    html += '<td class="px-4 py-2 text-xs font-medium text-slate-700 sticky left-0 bg-white z-10">' + k + '</td>';
    months.forEach(function(mk, mi) {
      var hasOverride = b.overrides && b.overrides[mk] !== undefined;
      var val = hasOverride ? b.overrides[mk] : (b.default || 0);
      var cls = hasOverride ? 'font-semibold text-slate-900' : 'text-slate-400';
      var display = val === 0 ? '—' : val.toLocaleString('ko-KR');
      html += '<td class="px-3 py-2 text-xs text-right cursor-pointer hover:bg-indigo-50 rounded ' + cls + '" style="font-feature-settings:\'tnum\'" onclick="ldgEditMatrixCell(\'' + k.replace(/'/g,"\\'") + '\',\'' + mk + '\',' + mi + ',this)">' + display + '</td>';
    });
    html += '</tr>';
  });
  html += '</tbody></table>';
  document.getElementById('ldg-budget-matrix').innerHTML = html;
}

function ldgEditMatrixCell(key, monthKey, monthIdx, tdEl) {
  var b = _ledgerData.budgets[key];
  if (!b) return;
  var hasOverride = b.overrides && b.overrides[monthKey] !== undefined;
  var current = hasOverride ? b.overrides[monthKey] : (b.default || 0);
  var input = document.createElement('input');
  input.type = 'text';
  input.value = current ? current.toLocaleString('ko-KR') : '';
  input.className = 'w-full text-xs text-right border-2 border-indigo-400 rounded-lg px-2 py-0.5 outline-none focus:ring-2 focus:ring-indigo-300 bg-indigo-50/30';
  input.style.fontFeatureSettings = "'tnum'";
  input.style.minWidth = '60px';
  tdEl.innerHTML = ''; tdEl.appendChild(input); tdEl.onclick = null;
  input.focus(); input.select();
  input.oninput = function() { ldgFormatAmount(input); };

  function save() {
    var raw = input.value.replace(/[^0-9]/g,'');
    var num = raw ? parseInt(raw) : 0;
    if (!b.overrides) b.overrides = {};
    if (!raw || num === b.default) { delete b.overrides[monthKey]; }
    else { b.overrides[monthKey] = num; }
    ldgSaveBudgets(); ldgRenderBudgetMatrix();
  }
  function tabTo(dir) {
    save();
    var newMi = monthIdx + dir;
    if (newMi < 0 || newMi > 11) return;
    // After re-render, find the same row and click the target cell
    setTimeout(function() {
      var rows = document.querySelectorAll('#ldg-budget-matrix table tbody tr');
      for (var r = 0; r < rows.length; r++) {
        var firstTd = rows[r].querySelector('td');
        if (firstTd && firstTd.textContent.trim() === key) {
          var tds = rows[r].querySelectorAll('td');
          if (tds[newMi + 1]) tds[newMi + 1].click(); // +1 for category column
          break;
        }
      }
    }, 30);
  }
  input.addEventListener('keydown', function(e) {
    if (e.key === 'Enter') { e.preventDefault(); save(); }
    if (e.key === 'Escape') { e.preventDefault(); ldgRenderBudgetMatrix(); }
    if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); tabTo(1); }
    if (e.key === 'Tab' && e.shiftKey) { e.preventDefault(); tabTo(-1); }
  });
  input.addEventListener('blur', function() { setTimeout(function() { save(); }, 100); });
}

// ── Recurring Tab ──
function ldgRenderRecurring() {
  var items = _ledgerData.recurring || [];
  var body = document.getElementById('ldg-rec-body');
  var html = '';
  if (_ldgRecEditIdx === 'new') html += ldgRecInputRow(null);
  items.forEach(function(item, i) {
    if (_ldgRecEditIdx === i) {
      html += ldgRecInputRow(item);
    } else {
      var amtDisplay = item['금액'] === 0
        ? '<span class="px-2 py-0.5 rounded text-[10px] font-bold" style="background:#fef3c7;color:#b45309">변동</span>'
        : '<span style="font-feature-settings:\'tnum\'">' + ldgFmt(item['금액']) + '</span>';
      html += '<tr class="hover:bg-indigo-50/30 transition-colors">';
      html += '<td class="px-6 py-3 text-xs text-slate-700">' + (item['대분류']||'') + '</td>';
      html += '<td class="px-4 py-3 text-xs text-slate-600">' + (item['소분류']||'') + '</td>';
      html += '<td class="px-4 py-3 text-xs text-slate-600">' + (item.dayOfMonth||'') + '일</td>';
      html += '<td class="px-4 py-3 text-xs text-right font-semibold">' + amtDisplay + '</td>';
      html += '<td class="px-4 py-3 text-xs text-slate-500">' + (item['결제수단']||'') + '</td>';
      html += '<td class="px-4 py-3"><button onclick="ldgShowRecMenu(event,' + i + ')" class="text-slate-300 hover:text-slate-500"><span class="material-symbols-outlined text-sm">more_horiz</span></button></td>';
      html += '</tr>';
    }
  });
  body.innerHTML = html;
  // Auto checkbox
  var autoEl = document.getElementById('ldg-rec-auto');
  if (autoEl) autoEl.checked = localStorage.getItem('atelier_ledger_recurring_auto') !== 'false';
}

function ldgRecInputRow(item) {
  var cats = _ledgerData.categories || {};
  var pms = (_ledgerData.settings || {}).paymentMethods || [];
  var major = item ? item['대분류'] : '', minor = item ? item['소분류'] : '';
  var day = item ? item.dayOfMonth : '', amt = item ? (item['금액'] === 0 ? '' : item['금액'].toLocaleString('ko-KR')) : '';
  var pm = item ? (item['결제수단']||'') : '';
  var isVariable = item ? item['금액'] === 0 : false;
  var majorOpts = '<option value="">선택</option>';
  Object.keys(cats).forEach(function(c) { majorOpts += '<option value="' + c + '"' + (c===major?' selected':'') + '>' + c + '</option>'; });
  var minorOpts = '<option value="">선택</option>';
  if (major && cats[major]) cats[major].forEach(function(s) { minorOpts += '<option value="' + s + '"' + (s===minor?' selected':'') + '>' + s + '</option>'; });
  var pmOpts = '<option value="">선택</option>';
  pms.forEach(function(p) { pmOpts += '<option value="' + p + '"' + (p===pm?' selected':'') + '>' + p + '</option>'; });
  return '<tr class="bg-indigo-50/40 border-l-4 border-l-indigo-500">' +
    '<td class="px-6 py-2"><select id="ldg-rec-major" class="text-xs border border-slate-200 rounded px-1 py-1 w-full" onchange="ldgRecMajorChanged()">' + majorOpts + '</select></td>' +
    '<td class="px-4 py-2"><select id="ldg-rec-minor" class="text-xs border border-slate-200 rounded px-1 py-1 w-full">' + minorOpts + '</select></td>' +
    '<td class="px-4 py-2"><input type="number" id="ldg-rec-day" value="' + day + '" min="1" max="31" class="text-xs border border-slate-200 rounded px-2 py-1 w-full" placeholder="일"/></td>' +
    '<td class="px-4 py-2"><div class="flex items-center gap-1"><input type="text" id="ldg-rec-amt" value="' + amt + '" class="text-xs border border-slate-200 rounded px-2 py-1 flex-1 text-right" placeholder="금액" oninput="ldgFormatAmount(this)"/><label class="flex items-center gap-1 text-[10px] text-slate-500 whitespace-nowrap"><input type="checkbox" id="ldg-rec-variable" ' + (isVariable?'checked':'') + ' class="w-3 h-3 rounded"/> 변동</label></div></td>' +
    '<td class="px-4 py-2"><select id="ldg-rec-pm" class="text-xs border border-slate-200 rounded px-1 py-1 w-full">' + pmOpts + '</select></td>' +
    '<td class="px-4 py-2 flex gap-1"><button onclick="ldgSaveRec()" class="text-indigo-600 hover:text-indigo-800"><span class="material-symbols-outlined text-sm">check</span></button><button onclick="ldgCancelRec()" class="text-slate-400 hover:text-red-400"><span class="material-symbols-outlined text-sm">close</span></button></td>' +
    '</tr>';
}

function ldgRecMajorChanged() {
  var major = document.getElementById('ldg-rec-major').value;
  var minorSel = document.getElementById('ldg-rec-minor');
  var cats = _ledgerData.categories || {};
  minorSel.innerHTML = '<option value="">선택</option>';
  (cats[major]||[]).forEach(function(s) { var o = document.createElement('option'); o.value = s; o.textContent = s; minorSel.appendChild(o); });
}

function ldgAddRecurring() { _ldgRecEditIdx = 'new'; ldgRenderRecurring(); }
function ldgCancelRec() { _ldgRecEditIdx = null; ldgRenderRecurring(); }

function ldgSaveRec() {
  var major = (document.getElementById('ldg-rec-major')||{}).value||'';
  var minor = (document.getElementById('ldg-rec-minor')||{}).value||'';
  var day = parseInt((document.getElementById('ldg-rec-day')||{}).value)||0;
  var isVar = (document.getElementById('ldg-rec-variable')||{}).checked;
  var amtStr = (document.getElementById('ldg-rec-amt')||{}).value||'';
  var amt = isVar ? 0 : (parseInt(amtStr.replace(/[^0-9]/g,''))||0);
  var pm = (document.getElementById('ldg-rec-pm')||{}).value||'';
  if (!major || !minor || !day) { alert('대분류, 소분류, 날짜는 필수입니다.'); return; }
  if (!isVar && amt === 0) { alert('금액을 입력하거나 "변동"을 체크하세요.'); return; }
  var entry = {'대분류':major,'소분류':minor,dayOfMonth:day,'금액':amt,'결제수단':pm};
  var futureUpdated = 0;
  if (typeof _ldgRecEditIdx === 'number') {
    // 기존 recId 보존 → 미래 자동 거래와 연결 유지
    var oldItem = _ledgerData.recurring[_ldgRecEditIdx];
    if (oldItem && oldItem.recId) entry.recId = oldItem.recId;
    _ledgerData.recurring[_ldgRecEditIdx] = entry;
    ldgSaveRecurringData();
    // 다음 달 이후 자동 거래 일괄 갱신
    futureUpdated = ldgUpdateFutureRecurringTx(entry.recId, entry);
  } else {
    _ledgerData.recurring.push(entry);
    ldgSaveRecurringData();
  }
  _ldgRecEditIdx = null;
  ldgRenderRecurring();
  if (typeof ldgRenderMonthly === 'function') ldgRenderMonthly();
  if (futureUpdated > 0 && typeof showSyncToast === 'function') {
    showSyncToast('<span class="material-symbols-outlined text-sm mr-1">check_circle</span> 다음 달부터 ' + futureUpdated + '건 자동 갱신');
  }
}

function ldgShowRecMenu(e, i) {
  e.stopPropagation();
  var old = document.getElementById('ldg-rec-menu'); if (old) old.remove();
  var rect = e.currentTarget.getBoundingClientRect();
  var menu = document.createElement('div');
  menu.id = 'ldg-rec-menu';
  menu.className = 'fixed bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-[9999]';
  menu.style.top = rect.bottom + 4 + 'px';
  menu.style.left = (rect.left - 60) + 'px';
  menu.innerHTML =
    '<button onclick="ldgEditRec(' + i + ')" class="w-full text-left px-4 py-2 text-xs text-slate-600 hover:bg-slate-50">수정</button>' +
    '<button onclick="ldgDeleteRec(' + i + ')" class="w-full text-left px-4 py-2 text-xs text-red-500 hover:bg-red-50">삭제</button>';
  document.body.appendChild(menu);
  setTimeout(function() { document.addEventListener('click', function h() { var m = document.getElementById('ldg-rec-menu'); if(m)m.remove(); document.removeEventListener('click',h); }); }, 10);
}

function ldgEditRec(i) {
  var m = document.getElementById('ldg-rec-menu'); if (m) m.remove();
  _ldgRecEditIdx = i; ldgRenderRecurring();
}

function ldgDeleteRec(i) {
  var m = document.getElementById('ldg-rec-menu'); if (m) m.remove();
  var target = _ledgerData.recurring[i];
  if (!target) return;
  var recId = target.recId;
  ldgSafetyShow('이 고정 내역을 삭제하시겠습니까?\n(이번 달은 유지, 다음 달부터 자동 적용 안 됨)', function() {
    _ledgerData.recurring.splice(i, 1);
    ldgSaveRecurringData();
    // 다음 달 이후 자동 거래 일괄 삭제
    var deleted = recId ? ldgDeleteFutureRecurringTx(recId) : 0;
    ldgRenderRecurring();
    if (typeof ldgRenderMonthly === 'function') ldgRenderMonthly();
    if (deleted > 0 && typeof showSyncToast === 'function') {
      showSyncToast('<span class="material-symbols-outlined text-sm mr-1">check_circle</span> 다음 달 이후 ' + deleted + '건 자동 삭제');
    }
  });
}

function ldgSaveRecAuto() {
  var checked = document.getElementById('ldg-rec-auto').checked;
  localStorage.setItem('atelier_ledger_recurring_auto', checked ? 'true' : 'false');
}

// ── Recurring Auto-Apply ──
function ldgEnsureRecurringIds() {
  var items = _ledgerData.recurring || [];
  var changed = false;
  items.forEach(function(item, i) {
    if (!item.recId) {
      item.recId = 'rec_' + i + '_' + Math.random().toString(36).substr(2,6);
      changed = true;
    }
  });
  if (changed) ldgSaveRecurringData();
}

// 다음 달 1일을 YYYY-MM-01 형식으로 반환 (오늘 기준)
function ldgGetNextMonthStart() {
  var now = new Date();
  var y = now.getFullYear(), m = now.getMonth() + 1; // 1-12
  m++; // 다음 달
  if (m > 12) { m = 1; y++; }
  return y + '-' + String(m).padStart(2,'0') + '-01';
}

// 고정내역 수정 시: 다음 달 이후의 자동 거래를 새 값으로 일괄 갱신
function ldgUpdateFutureRecurringTx(recId, newItem) {
  if (!recId) return 0;
  var nextStart = ldgGetNextMonthStart();
  var txs = _ledgerData.transactions || [];
  var updated = 0;
  txs.forEach(function(t) {
    if (t.recurringId === recId && t.date && t.date >= nextStart) {
      t['대분류'] = newItem['대분류'];
      t['소분류'] = newItem['소분류'];
      t['결제수단'] = newItem['결제수단'];
      // 변동(0)이 아니면 금액도 갱신, 변동이면 기존 사용자 입력값 보존
      if (newItem['금액'] && newItem['금액'] !== 0) {
        t['금액'] = newItem['금액'];
      }
      // dayOfMonth 변경 반영
      var mk = t.date.substring(0, 7);
      var parts = mk.split('-');
      var lastDay = new Date(parseInt(parts[0]), parseInt(parts[1]), 0).getDate();
      var day = Math.min(newItem.dayOfMonth, lastDay);
      t.date = mk + '-' + String(day).padStart(2,'0');
      updated++;
    }
  });
  if (updated > 0) ldgSaveTx();
  return updated;
}

// 고정내역 삭제 시: 다음 달 이후의 자동 거래를 일괄 삭제
function ldgDeleteFutureRecurringTx(recId) {
  if (!recId) return 0;
  var nextStart = ldgGetNextMonthStart();
  var txs = _ledgerData.transactions || [];
  var before = txs.length;
  _ledgerData.transactions = txs.filter(function(t) {
    return !(t.recurringId === recId && t.date && t.date >= nextStart);
  });
  var deleted = before - _ledgerData.transactions.length;
  if (deleted > 0) ldgSaveTx();
  return deleted;
}

// ── Recurring skip list (deleted auto transactions) ──
function ldgGetSkipped() {
  try { return JSON.parse(localStorage.getItem('atelier_ledger_recurring_skipped')) || {}; } catch(e) { return {}; }
}
function ldgAddSkipped(recId, monthKey) {
  var s = ldgGetSkipped();
  if (!s[monthKey]) s[monthKey] = [];
  if (s[monthKey].indexOf(recId) < 0) s[monthKey].push(recId);
  localStorage.setItem('atelier_ledger_recurring_skipped', JSON.stringify(s));
}

var _ldgRecurringMigrated = false;
var _ldgDedupRan = false;

// 자동거래 중복 제거 헬퍼: '자동(고정)' 태그 + (recurringId, 월) 또는 (대/소/금액, 월) 매칭으로 중복 판단
// 사용자가 수동 입력한 거래는 건드리지 않음. 가장 먼저 만난 거래만 남김.
function ldgDedupeAutoTx() {
  var txs = _ledgerData.transactions || [];
  var byKey = {};      // recurringId|month
  var byContent = {};  // month|major|minor|amount (recurringId 없는 legacy 자동거래용)
  var keep = [];
  var removed = 0;
  txs.forEach(function(t) {
    if (t['비고'] !== '자동(고정)' || !t.date) { keep.push(t); return; }
    var month = t.date.substring(0, 7);
    if (t.recurringId) {
      var key = t.recurringId + '|' + month;
      if (byKey[key]) { removed++; return; }
      byKey[key] = true;
    } else {
      var ck = month + '|' + (t['대분류'] || '') + '|' + (t['소분류'] || '') + '|' + (t['금액'] || 0);
      if (byContent[ck]) { removed++; return; }
      byContent[ck] = true;
    }
    keep.push(t);
  });
  if (removed > 0) {
    _ledgerData.transactions = keep;
    ldgSaveTx();
    console.log('[DailyLedger] Removed ' + removed + ' duplicate auto transactions');
  }
  return removed;
}

function ldgApplyRecurringForMonth(year, month) {
  if (localStorage.getItem('atelier_ledger_recurring_auto') === 'false') return;
  ldgEnsureRecurringIds();
  var items = _ledgerData.recurring || [];
  var txs = _ledgerData.transactions || [];
  var monthKey = String(year) + '-' + String(month).padStart(2,'0');

  // One-time migration: backfill recurringId on old auto transactions
  if (!_ldgRecurringMigrated) {
    _ldgRecurringMigrated = true;
    var migrated = 0;
    txs.forEach(function(t) {
      if (t['비고'] === '자동(고정)' && !t.recurringId) {
        var day = t.date ? parseInt(t.date.split('-')[2]) : 0;
        var match = items.find(function(r) {
          return r['대분류'] === t['대분류'] && r['소분류'] === t['소분류'] && r.dayOfMonth === day && (r['금액'] === t['금액'] || r['금액'] === 0);
        });
        if (match) { t.recurringId = match.recId; migrated++; }
      }
    });
    if (migrated > 0) { ldgSaveTx(); console.log('[DailyLedger] Migrated recurringId on ' + migrated + ' old auto transactions'); }
  }

  // One-time per session: 기존 중복 자동거래 정리 (migration 후에 실행해야 recurringId 기반 매칭 가능)
  if (!_ldgDedupRan) {
    _ldgDedupRan = true;
    ldgDedupeAutoTx();
  }

  var skipped = ldgGetSkipped();
  var skipList = skipped[monthKey] || [];
  var added = 0, pendingVariable = 0;

  items.forEach(function(item) {
    if (!item.recId) return;
    // Skip if user previously deleted this auto transaction for this month
    if (skipList.indexOf(item.recId) >= 0) return;
    // Skip if already exists for this month (recurringId based)
    var exists = txs.some(function(t) {
      return t.recurringId === item.recId && t.date && t.date.substring(0,7) === monthKey;
    });
    if (exists) return;

    // Legacy fallback: 자동(고정) entry with same category+amount in this month (recurringId may be missing on old data)
    var existsByContent = txs.some(function(t) {
      return t['비고'] === '자동(고정)'
        && t.date && t.date.substring(0,7) === monthKey
        && t['대분류'] === item['대분류']
        && t['소분류'] === item['소분류']
        && (item['금액'] === 0 || t['금액'] === item['금액']);
    });
    if (existsByContent) return;

    var day = Math.min(item.dayOfMonth, new Date(year, month, 0).getDate()); // clamp to month's last day
    var dateStr = monthKey + '-' + String(day).padStart(2,'0');
    // 결정적 ID: 같은 (recurringId, 월) 조합은 어느 기기에서 만들어도 동일 ID → Firebase merge 시 자동 중복 제거
    var newTx = {
      id: 'txn_auto_' + item.recId + '_' + monthKey,
      date: dateStr,
      '대분류': item['대분류'], '소분류': item['소분류'],
      '금액': item['금액'], '결제수단': item['결제수단'],
      '세부사항': '', '비고': '자동(고정)',
      recurringId: item.recId
    };
    txs.push(newTx);
    added++;
    if (item['금액'] === 0) pendingVariable++;
  });

  if (added > 0) {
    ldgSaveTx();
    console.log('[DailyLedger] Auto-applied ' + added + ' recurring transactions for ' + monthKey);
  }
  if (pendingVariable > 0) {
    setTimeout(function() {
      var banner = document.createElement('div');
      banner.className = 'fixed top-20 right-8 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 shadow-lg z-[9999] flex items-center gap-3';
      banner.innerHTML = '<span class="text-amber-600 text-sm">입력 대기 중인 고정 거래(변동 금액)가 ' + pendingVariable + '건 있습니다.</span><button onclick="this.parentElement.remove()" class="text-slate-400 hover:text-slate-600"><span class="material-symbols-outlined text-sm">close</span></button>';
      document.body.appendChild(banner);
      setTimeout(function() { if (banner.parentElement) banner.remove(); }, 5000);
    }, 500);
  }
}

// ===== DAILY LEDGER: DUPLICATE DETECTION =====
function ldgFindDuplicates() {
  var txs = _ledgerData.transactions || [];
  var exactGroups = {};
  var recGroups = {};

  txs.forEach(function(t, idx) {
    if (!t || !t.date) return;
    var month = t.date.substring(0, 7);
    var amt = t['금액'] || 0;
    var major = t['대분류'] || '';
    var minor = t['소분류'] || '';
    var pm = t['결제수단'] || '';
    var exactKey = t.date + '|' + major + '|' + minor + '|' + amt + '|' + pm;
    if (!exactGroups[exactKey]) exactGroups[exactKey] = [];
    exactGroups[exactKey].push(idx);
    if (t['비고'] === '자동(고정)') {
      var recKey = month + '|' + major + '|' + minor + '|' + amt;
      if (!recGroups[recKey]) recGroups[recKey] = [];
      recGroups[recKey].push(idx);
    }
  });

  var exact = [];
  Object.keys(exactGroups).forEach(function(k) {
    if (exactGroups[k].length > 1) exact.push(exactGroups[k]);
  });

  var inExact = {};
  exact.forEach(function(g) { g.forEach(function(i) { inExact[i] = true; }); });

  var recurring = [];
  Object.keys(recGroups).forEach(function(k) {
    var filtered = recGroups[k].filter(function(i) { return !inExact[i]; });
    if (filtered.length > 1) recurring.push(filtered);
  });

  return { exact: exact, recurring: recurring };
}

function ldgRunDedupCheck() {
  var dups = ldgFindDuplicates();
  var el = document.getElementById('ldg-dedup-results');
  if (!el) return;

  var totalDupRows = 0;
  dups.exact.forEach(function(g) { totalDupRows += g.length - 1; });
  dups.recurring.forEach(function(g) { totalDupRows += g.length - 1; });

  if (totalDupRows === 0) {
    el.innerHTML = '<div class="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700 flex items-center gap-2"><span class="material-symbols-outlined">check_circle</span>중복 거래가 없습니다.</div>';
    return;
  }

  var txs = _ledgerData.transactions || [];
  var allGroups = [];
  dups.exact.forEach(function(g) { allGroups.push({ type: 'exact', indices: g }); });
  dups.recurring.forEach(function(g) { allGroups.push({ type: 'recurring', indices: g }); });

  var html = '<div class="mb-3 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800"><b>' + totalDupRows + '건</b>의 중복 후보가 발견되었습니다. 체크된 항목이 삭제됩니다. (수동 입력 항목은 자동으로 보존)</div>';

  allGroups.forEach(function(group, gi) {
    var indices = group.indices;
    var first = txs[indices[0]];
    var dateLabel = group.type === 'exact' ? first.date : first.date.substring(0, 7) + ' (월간)';
    var typeBadge = group.type === 'exact'
      ? '<span class="text-[10px] px-2 py-0.5 bg-red-100 text-red-700 rounded-full font-bold">완전 중복</span>'
      : '<span class="text-[10px] px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full font-bold">자동(고정) 월간 중복</span>';
    var amtStr = '₩' + ((first['금액'] || 0)).toLocaleString();

    html += '<div class="bg-white rounded-xl border border-slate-200 p-3 mb-2">';
    html += '<div class="flex items-center gap-2 mb-2">' + typeBadge;
    html += '<span class="text-xs font-bold text-slate-700">' + dateLabel + ' · ' + (first['대분류']||'-') + ' › ' + (first['소분류']||'-') + ' · ' + amtStr + '</span>';
    html += '<span class="text-[10px] text-slate-400 ml-auto">' + indices.length + '건</span></div>';

    var keepIdx = -1;
    for (var i = 0; i < indices.length; i++) {
      if (txs[indices[i]]['비고'] !== '자동(고정)') { keepIdx = indices[i]; break; }
    }
    if (keepIdx === -1) keepIdx = indices[0];

    indices.forEach(function(idx) {
      var t = txs[idx];
      var isKeep = idx === keepIdx;
      html += '<label class="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-slate-50 cursor-pointer text-xs">';
      html += '<input type="checkbox" data-tx-id="' + (t.id || '') + '" class="ldg-dedup-check w-4 h-4 rounded text-red-600 focus:ring-red-300 border-slate-300" ' + (isKeep ? '' : 'checked') + '/>';
      html += '<span class="text-slate-600 flex-1">';
      html += '<span class="font-mono">' + t.date + '</span> · ' + (t['결제수단']||'-') + ' · ' + (t['비고']||'-');
      if (t['세부사항']) html += ' · ' + t['세부사항'];
      html += '</span>';
      if (isKeep) html += '<span class="text-[10px] font-bold text-emerald-600 px-2 py-0.5 bg-emerald-50 rounded-full">유지</span>';
      html += '</label>';
    });
    html += '</div>';
  });

  html += '<div class="flex gap-2 mt-4">';
  html += '<button onclick="ldgConfirmDedup()" class="px-4 py-2 bg-red-500 text-white rounded-lg text-sm font-semibold hover:bg-red-600">선택한 항목 삭제</button>';
  html += '<button onclick="document.getElementById(\'ldg-dedup-results\').innerHTML=\'\'" class="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-sm hover:bg-slate-300">취소</button>';
  html += '</div>';

  el.innerHTML = html;
}

function ldgConfirmDedup() {
  var checks = document.querySelectorAll('.ldg-dedup-check:checked');
  if (checks.length === 0) {
    alert('삭제할 항목을 선택하세요.');
    return;
  }
  var ids = [];
  checks.forEach(function(c) { if (c.dataset.txId) ids.push(c.dataset.txId); });
  if (ids.length === 0) {
    alert('삭제할 항목의 ID가 없습니다.');
    return;
  }

  ldgSafetyShow(
    ids.length + '건의 중복 거래를 삭제합니다.\n삭제 전 자동으로 백업이 생성됩니다.\n계속하시겠습니까?',
    function() {
      setTimeout(function() {
        ldgSafetyShow(
          '정말 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.\n(데이터 관리 > 백업에서 복원 가능)',
          function() { ldgPerformDedup(ids); }
        );
      }, 150);
    }
  );
}

function ldgPerformDedup(idsToDelete) {
  var txs = _ledgerData.transactions || [];
  var idSet = {};
  idsToDelete.forEach(function(id) { idSet[id] = true; });
  var before = txs.length;
  _ledgerData.transactions = txs.filter(function(t) { return !idSet[t.id]; });
  var deleted = before - _ledgerData.transactions.length;

  ldgSaveTx();

  var toast = document.createElement('div');
  toast.className = 'fixed top-20 right-8 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 shadow-lg z-[9999]';
  toast.innerHTML = '<p class="text-sm font-semibold text-emerald-700">✓ ' + deleted + '건의 중복 거래를 삭제했습니다.</p>';
  document.body.appendChild(toast);
  setTimeout(function() { if (toast.parentElement) toast.remove(); }, 3500);

  ldgRunDedupCheck();
  if (typeof ldgRenderMonthly === 'function') ldgRenderMonthly();
}

// ===== DAILY LEDGER: COACH TRACKER =====
var _ldgCoachYear = 2026;

function ldgRenderCoach() {
  var el = document.getElementById('ldg-coach-content');
  if (!el) return;
  var goals = ldgLoadGoals();
  var g = goals[_ldgCoachYear];
  if (!g || (!g['수입'] && !g['저축'] && !g['지출'])) {
    // Placeholder
    el.innerHTML = '<div class="flex items-center justify-center min-h-[400px]"><div class="text-center max-w-md bg-indigo-50/50 rounded-2xl border border-indigo-100 p-10">' +
      '<p class="text-3xl mb-3">🎯</p><h3 class="text-lg font-bold text-slate-900 mb-2">AI 코치</h3>' +
      '<p class="text-sm text-slate-500 leading-relaxed mb-6">먼저 설정 → 연간 목표에서<br>' + _ldgCoachYear + '년 목표를 설정해주세요.</p>' +
      '<button onclick="ldgGoToGoals()" class="px-5 py-2 bg-indigo-600 text-white rounded-full text-sm font-semibold hover:bg-indigo-700 transition-colors">목표 설정하러 가기</button></div></div>';
    return;
  }
  var txs = (_ledgerData.transactions||[]).filter(function(t){return t.date&&t.date.substring(0,4)===String(_ldgCoachYear);});
  var now = new Date();
  var isCurrentYear = now.getFullYear() === _ldgCoachYear;
  var curMonth = isCurrentYear ? now.getMonth()+1 : 12;
  var curDay = isCurrentYear ? now.getDate() : 31;
  var dataMonths = curMonth - 1 + curDay / 30; // fractional months
  if (dataMonths < 1) dataMonths = 1;
  var dataDays = isCurrentYear ? Math.floor((now - new Date(_ldgCoachYear,0,1))/(864e5)) : 365;
  var remainDays = isCurrentYear ? Math.floor((new Date(_ldgCoachYear,11,31) - now)/(864e5)) : 0;
  var remainMonths = 12 - curMonth;
  if (remainMonths < 0) remainMonths = 0;

  var totInc=0, totSav=0, totExp=0;
  txs.forEach(function(t){
    if(t['대분류']==='수입') totInc+=t['금액'];
    else if(t['대분류']==='저축') totSav+=t['금액'];
    else totExp+=t['금액'];
  });
  var paceInc=Math.round(totInc*(12/dataMonths)), paceSav=Math.round(totSav*(12/dataMonths)), paceExp=Math.round(totExp*(12/dataMonths));
  var avgInc=Math.round(totInc/dataMonths), avgSav=Math.round(totSav/dataMonths), avgExp=Math.round(totExp/dataMonths);

  // Year selector
  var html = '<div class="flex items-center justify-between mb-6"><div><h3 class="text-lg font-bold text-slate-900">🎯 ' + _ldgCoachYear + ' 목표 트래커</h3>' +
    '<p class="text-xs text-slate-400 mt-1">' + curMonth + '월 ' + curDay + '일 현재 · 데이터 ' + dataDays + '일' + (remainDays>0?' · 남은 '+remainDays+'일':'') + '</p></div>' +
    '<div class="flex gap-1">' +
    [2024,2025,2026,2027].map(function(yr){var ac=yr===_ldgCoachYear;return '<button onclick="_ldgCoachYear='+yr+';ldgRenderCoach()" class="px-3 py-1 rounded-full text-xs font-semibold '+(ac?'text-white" style="background:linear-gradient(135deg,#6366f1,#a855f7)':'text-slate-500" style="background:#f1f5f9')+'">' + yr + '</button>';}).join('') +
    '</div></div>';

  // Summary box
  var pctI=g['수입']?Math.round(paceInc/g['수입']*100):0, pctS=g['저축']?Math.round(paceSav/g['저축']*100):0, pctE=g['지출']?Math.round(paceExp/g['지출']*100):0;
  var biggestRisk = '';
  // Find biggest risk category
  var prevYearTxs = (_ledgerData.transactions||[]).filter(function(t){return t.date&&t.date.substring(0,4)===String(_ldgCoachYear-1);});
  var catExp = {}, prevCatExp = {};
  txs.forEach(function(t){if(ldgIsExpense(t)) catExp[t['대분류']]=(catExp[t['대분류']]||0)+t['금액'];});
  prevYearTxs.forEach(function(t){if(ldgIsExpense(t)) prevCatExp[t['대분류']]=(prevCatExp[t['대분류']]||0)+t['금액'];});
  var maxRiskPct = -999, maxRiskCat = '';
  for(var c in catExp){
    var prev = prevCatExp[c]||0;
    if(prev>0){var pace=catExp[c]*(12/dataMonths);var chg=Math.round((pace-prev)/prev*100);if(chg>maxRiskPct){maxRiskPct=chg;maxRiskCat=c;}}
  }

  html += '<div class="bg-white rounded-2xl border-l-4 border-l-indigo-500 border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-5 mb-6">' +
    '<p class="text-xs font-bold text-slate-700 mb-3">💡 ' + curMonth + '월 데이터 분석 결과</p>' +
    '<div class="text-xs text-slate-600 space-y-1">' +
    '<p>현재 페이스 유지 시:</p>' +
    '<p>• 수입: 목표의 <b>' + pctI + '%</b> 달성 예상' + (pctI<80?' <span class="text-red-500 font-bold">(부족)</span>':'') + '</p>' +
    '<p>• 저축: 목표의 <b>' + pctS + '%</b> 달성 예상' + (pctS<50?' <span class="text-red-500 font-bold">(심각)</span>':'') + '</p>' +
    '<p>• 지출: 목표의 <b>' + pctE + '%</b> 사용 예상' + (pctE>100?' <span class="text-red-500 font-bold">(초과)</span>':'') + '</p>' +
    (maxRiskCat ? '<p class="mt-2">가장 큰 위험: <b>' + maxRiskCat + '</b> (작년 대비 +' + maxRiskPct + '% 페이스)</p>' : '') +
    '</div></div>';

  // AI Insight card placeholder
  html += '<div id="ldg-ai-insight" class="mb-6"></div>';

  // KPI cards
  html += '<div class="grid grid-cols-3 gap-6 mb-8">';
  html += ldgCoachKPICard('💰 수입', totInc, g['수입'], paceInc, avgInc, remainMonths, 'income');
  html += ldgCoachKPICard('🏦 저축', totSav, g['저축'], paceSav, avgSav, remainMonths, 'saving');
  html += ldgCoachKPICard('💸 지출 (이하)', totExp, g['지출'], paceExp, avgExp, remainMonths, 'expense');
  html += '</div>';

  // Category pace analysis
  html += ldgCoachCategoryAnalysis(catExp, prevCatExp, dataMonths);
  el.innerHTML = html;

  // Load AI insight (async, after DOM is set)
  ldgLoadAIInsight(false);
}

function ldgCoachKPICard(label, current, goal, pace, avgMonthly, remainMonths, type) {
  if (!goal) return '';
  var pct = Math.round(current / goal * 100);
  var isExpense = type === 'expense';
  // Progress bar color
  var barColor;
  if (isExpense) {
    if (pct < 50) barColor = '#10b981';
    else if (pct < 80) barColor = '#f59e0b';
    else if (pct <= 100) barColor = '#f97316';
    else barColor = '#ef4444';
  } else {
    barColor = pct >= 100 ? '#10b981' : '#6366f1';
  }
  // Status
  var diff = pace - goal;
  var statusIcon, statusMsg;
  if (isExpense) {
    if (pace <= goal) { statusIcon = '✅'; statusMsg = '목표 이내 페이스'; }
    else if (diff / goal < 0.2) { statusIcon = '⚠️'; statusMsg = '목표 대비 ' + ldgFmt(diff) + ' 초과 예상'; }
    else { statusIcon = '🚨'; statusMsg = '목표 대비 ' + ldgFmt(diff) + ' 초과 예상'; }
  } else {
    if (pace >= goal) { statusIcon = '✅'; statusMsg = '목표 달성 페이스'; }
    else if (Math.abs(diff) / goal < 0.2) { statusIcon = '⚠️'; statusMsg = '목표 대비 ' + ldgFmt(Math.abs(diff)) + ' 부족'; }
    else { statusIcon = '🚨'; statusMsg = '목표 대비 ' + ldgFmt(Math.abs(diff)) + ' 부족'; }
  }
  // Needed pace
  var neededHtml = '';
  if (remainMonths > 0) {
    if (isExpense) {
      var remaining = goal - current;
      var neededMonthly = remaining > 0 ? Math.round(remaining / remainMonths) : 0;
      neededHtml = '<p class="text-[10px] text-slate-500 mt-2">남은 ' + remainMonths + '개월간 매월 ' + ldgFmt(neededMonthly) + ' 이하로 써야 함</p>';
      if (avgMonthly > 0 && neededMonthly < avgMonthly) {
        var cutPct = Math.round((1 - neededMonthly / avgMonthly) * 100);
        neededHtml += '<p class="text-[10px] text-slate-400">(현재 월평균 ' + ldgFmt(avgMonthly) + ' → ' + cutPct + '% 감축 필요)</p>';
      }
    } else {
      var needed = goal - current;
      var neededMonthly = needed > 0 ? Math.round(needed / remainMonths) : 0;
      neededHtml = '<p class="text-[10px] text-slate-500 mt-2">남은 ' + remainMonths + '개월간 매월 ' + ldgFmt(neededMonthly) + ' 필요</p>';
      if (avgMonthly > 0 && neededMonthly > avgMonthly) {
        var ratio = (neededMonthly / avgMonthly).toFixed(1);
        neededHtml += '<p class="text-[10px] text-slate-400">(현재 월평균 ' + ldgFmt(avgMonthly) + ' → ' + ratio + '배 증가 필요)</p>';
      }
    }
  }
  return '<div class="bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">' +
    '<p class="text-xs font-semibold text-slate-500 mb-2">' + label + '</p>' +
    '<p class="text-sm font-bold text-slate-900 mb-1" style="font-feature-settings:\'tnum\'">' + ldgFmt(current) + ' / ' + ldgFmt(goal) + '</p>' +
    '<div class="w-full h-2 bg-slate-100 rounded-full mb-3"><div class="h-full rounded-full" style="width:' + Math.min(pct,100) + '%;background:' + barColor + '"></div></div>' +
    '<p class="text-[10px] text-slate-600">📊 페이스 → 연 ' + ldgFmt(pace) + ' 예상</p>' +
    '<p class="text-[10px] font-semibold mt-0.5">' + statusIcon + ' ' + statusMsg + '</p>' +
    neededHtml + '</div>';
}

function ldgCoachCategoryAnalysis(catExp, prevCatExp, dataMonths) {
  var cats = _ledgerData.categories || {};
  var expCats = Object.keys(cats).filter(function(c){return c!=='수입'&&c!=='저축';});
  var items = [];
  expCats.forEach(function(c) {
    var cur = catExp[c] || 0;
    var prev = prevCatExp[c] || 0;
    var pace = cur > 0 ? Math.round(cur * (12 / dataMonths)) : 0;
    var chg = prev > 0 ? Math.round((pace - prev) / prev * 100) : (cur > 0 ? 999 : 0);
    var status;
    if (cur === 0) status = 'none';
    else if (chg >= 30) status = 'danger';
    else if (chg >= 10) status = 'warn';
    else status = 'ok';
    items.push({ cat: c, cur: cur, prev: prev, pace: pace, chg: chg, status: status });
  });
  // Sort: danger > warn > ok > none
  var order = { danger: 0, warn: 1, ok: 2, none: 3 };
  items.sort(function(a, b) { return order[a.status] - order[b.status] || b.chg - a.chg; });

  var html = '<div class="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-6">' +
    '<h4 class="text-sm font-bold text-slate-800 mb-4">📈 카테고리 페이스 분석</h4><div class="space-y-4">';
  var noneList = [];
  items.forEach(function(it) {
    if (it.status === 'none') { noneList.push(it.cat); return; }
    var icon = it.status === 'danger' ? '🚨' : (it.status === 'warn' ? '⚠️' : '✅');
    var chgText = it.prev > 0 ? ((_ldgCoachYear - 1) + ' 연간(' + ldgFmtShort(it.prev) + ') 대비 ' + (it.chg >= 0 ? '+' : '') + it.chg + '% 페이스') : '작년 데이터 없음';
    if (it.status === 'ok') {
      var desc = it.chg <= -10 ? ('작년 대비 ' + it.chg + '%') : (it.prev > 0 ? '일정한 페이스' : '');
      html += '<div class="text-xs text-slate-500">' + icon + ' <b>' + it.cat + '</b> — ' + (desc || '안정적') + '</div>';
    } else {
      html += '<div class="mb-2"><p class="text-xs font-semibold text-slate-700">' + icon + ' ' + it.cat + '</p>' +
        '<p class="text-[10px] text-slate-500 ml-5">현재: ' + ldgFmt(it.cur) + ' · 페이스: 연 ' + ldgFmt(it.pace) + ' 예상</p>' +
        '<p class="text-[10px] text-slate-400 ml-5">' + chgText + '</p></div>';
    }
  });
  if (noneList.length) html += '<p class="text-[10px] text-slate-400 mt-2 border-t border-slate-100 pt-2">거래 없는 카테고리: ' + noneList.join(', ') + '</p>';
  html += '</div></div>';
  return html;
}

// ===== DAILY LEDGER: AI INSIGHT + BUDGET SUGGESTION =====
var _COACH_SYS = '당신은 사용자(Nuri)의 개인 재무 코치입니다.\n\n## 필수 규칙\n- 수입 = 대분류 "수입" (월급, 부업 등)\n- 저축 = 대분류 "저축" (적금, 예금, 대출 상환 — 자산 이동)\n- 지출 = 그 외 모든 대분류 (식비, 교통비 등 — 실제 소비)\n- 저축을 절대 지출에 포함시키지 마세요\n- 연도 비교는 반드시 같은 기간(1~N월)끼리만 하세요\n- 데이터에 이미 집계된 수치를 그대로 사용하세요. 직접 재집계하지 마세요\n\n## 성격\n- 차분하고 직설적인 분석가 톤\n- 위험 시 강한 경고 ("정신 차려야 함")\n- 진짜 잘했을 때만 칭찬\n- 구체적인 숫자와 액션 중심\n\n## 응답 구조\n1. 핵심 진단 (가장 큰 위험/문제)\n2. 패턴 분석 (왜 그런가, 작년 같은 기간 대비)\n3. 미래 예측 (이대로 가면 연말)\n4. 구체적 액션 3~5개 (각 절약 금액 명시)\n5. 칭찬 (있으면 짧게)\n\n응답 길이: 800~1500자. 모든 금액은 원화 천 단위 콤마.';

function ldgBuildAnalysisPrompt() {
  var goals = ldgLoadGoals()[_ldgCoachYear] || {};
  var y = _ldgCoachYear;
  var txs = (_ledgerData.transactions||[]);
  var now = new Date();
  var curMonth = now.getFullYear() === y ? now.getMonth()+1 : 12;
  var dataDays = now.getFullYear() === y ? Math.floor((now - new Date(y,0,1))/(864e5)) : 365;
  var remainDays = now.getFullYear() === y ? Math.floor((new Date(y,11,31) - now)/(864e5)) : 0;

  function aggYearPeriod(year, maxMonth) {
    var ft = txs.filter(function(t){return t.date&&t.date.substring(0,4)===String(year)&&parseInt(t.date.split('-')[1])<=maxMonth;});
    var inc=0,sav=0,exp=0;
    ft.forEach(function(t){if(t['대분류']==='수입')inc+=t['금액'];else if(t['대분류']==='저축')sav+=t['금액'];else exp+=t['금액'];});
    return {inc:inc,sav:sav,exp:exp,txs:ft};
  }

  var cur = aggYearPeriod(y, curMonth);
  var prev = aggYearPeriod(y-1, curMonth);
  var prev24 = aggYearPeriod(2024, curMonth);

  // Category breakdown — EXPENSE only (exclude 수입/저축)
  var expCatData = {};
  cur.txs.forEach(function(t){
    if(t['대분류']==='수입'||t['대분류']==='저축') return;
    var k=t['대분류']+'.'+t['소분류'];expCatData[k]=(expCatData[k]||0)+t['금액'];
  });
  var expCatLines = Object.keys(expCatData).sort(function(a,b){return expCatData[b]-expCatData[a];}).map(function(k){return k+': '+expCatData[k].toLocaleString('ko-KR')+'원';}).join('\n');

  // Income breakdown
  var incCatData = {};
  cur.txs.forEach(function(t){
    if(t['대분류']!=='수입') return;
    incCatData[t['소분류']]=(incCatData[t['소분류']]||0)+t['금액'];
  });
  var incCatLines = Object.keys(incCatData).sort(function(a,b){return incCatData[b]-incCatData[a];}).map(function(k){return k+': '+incCatData[k].toLocaleString('ko-KR')+'원';}).join('\n');

  var p = '';
  p += '## 중요: 데이터 구분 규칙\n';
  p += '- 수입 = 대분류 "수입" (월급, 부업 등)\n';
  p += '- 저축 = 대분류 "저축" (적금, 예금, 대출 상환 — 자산 이동이며 지출 아님)\n';
  p += '- 지출 = 그 외 모든 대분류 (식비, 교통비 등 — 실제 소비)\n';
  p += '- 저축을 절대 지출에 포함시키지 말 것\n';
  p += '- 아래 모든 수치는 이 구분에 따라 이미 집계됨\n\n';
  p += '## ' + y + '년 목표\n';
  p += '- 수입 목표: ' + (goals['수입']||0).toLocaleString('ko-KR') + '원\n';
  p += '- 저축 목표: ' + (goals['저축']||0).toLocaleString('ko-KR') + '원\n';
  p += '- 지출 한도: ' + (goals['지출']||0).toLocaleString('ko-KR') + '원\n\n';
  p += '## ' + y + '년 현재까지 (1~' + curMonth + '월, ' + dataDays + '일, 남은 ' + remainDays + '일)\n';
  p += '- 수입 합계: ' + cur.inc.toLocaleString('ko-KR') + '원 (월평균 ' + Math.round(cur.inc/curMonth).toLocaleString('ko-KR') + '원)\n';
  p += '- 저축 합계: ' + cur.sav.toLocaleString('ko-KR') + '원 (월평균 ' + Math.round(cur.sav/curMonth).toLocaleString('ko-KR') + '원)\n';
  p += '- 지출 합계: ' + cur.exp.toLocaleString('ko-KR') + '원 (월평균 ' + Math.round(cur.exp/curMonth).toLocaleString('ko-KR') + '원)\n';
  p += '- 잔여현금: ' + (cur.inc - cur.sav - cur.exp).toLocaleString('ko-KR') + '원\n\n';
  p += '## 지출 카테고리별 상세 (' + y + '년 1~' + curMonth + '월)\n';
  p += expCatLines + '\n\n';
  p += '## 수입 구성 (' + y + '년 1~' + curMonth + '월)\n';
  p += incCatLines + '\n\n';
  p += '## 작년(' + (y-1) + ') 같은 기간(1~' + curMonth + '월) 비교\n';
  p += '- 수입: ' + prev.inc.toLocaleString('ko-KR') + '원\n';
  p += '- 저축: ' + prev.sav.toLocaleString('ko-KR') + '원\n';
  p += '- 지출: ' + prev.exp.toLocaleString('ko-KR') + '원\n\n';
  p += '## 2024년 같은 기간(1~' + curMonth + '월) 참고\n';
  p += '- 수입: ' + prev24.inc.toLocaleString('ko-KR') + '원\n';
  p += '- 저축: ' + prev24.sav.toLocaleString('ko-KR') + '원\n';
  p += '- 지출: ' + prev24.exp.toLocaleString('ko-KR') + '원\n\n';
  p += '위 데이터를 종합 분석해주세요. 모든 비교는 같은 기간(1~' + curMonth + '월)끼리만 하세요.';

  console.log('[DailyLedger] AI prompt data check:', {
    year: y, months: '1~'+curMonth,
    income: cur.inc, saving: cur.sav, expense: cur.exp,
    prevIncome: prev.inc, prevSaving: prev.sav, prevExpense: prev.exp
  });

  return p;
}

function ldgRenderInsightCard(content, usage, cachedAt) {
  var el = document.getElementById('ldg-ai-insight');
  if (!el) return;
  var ago = cachedAt ? Math.round((Date.now() - new Date(cachedAt).getTime())/3600000) : 0;
  var agoText = ago < 1 ? '방금' : ago + '시간 전 캐시';
  var usageText = usage ? '토큰: 입력 ' + (usage.input||0).toLocaleString() + ' / 출력 ' + (usage.output||0).toLocaleString() : '';
  // Convert markdown-like formatting to HTML
  var htmlContent = (content||'').replace(/\n/g,'<br>').replace(/\*\*(.*?)\*\*/g,'<b>$1</b>');
  el.innerHTML = '<div class="bg-white rounded-2xl border-l-4 border-l-indigo-500 border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-5">' +
    '<div class="flex items-center justify-between mb-3"><p class="text-xs font-bold text-slate-700">🤖 AI 분석</p><div class="flex items-center gap-2"><span class="text-[10px] text-slate-400">' + agoText + '</span><button onclick="ldgLoadAIInsight(true)" class="text-slate-400 hover:text-indigo-600 transition-colors" title="새로고침"><span class="material-symbols-outlined" style="font-size: var(--font-size-h3)">refresh</span></button></div></div>' +
    '<div class="text-xs text-slate-600 leading-relaxed">' + htmlContent + '</div>' +
    (usageText ? '<p class="text-[10px] text-slate-300 mt-3 border-t border-slate-100 pt-2">' + usageText + '</p>' : '') +
    '</div>';
}

async function ldgLoadAIInsight(forceRefresh) {
  var el = document.getElementById('ldg-ai-insight');
  if (!el) return;
  var token = localStorage.getItem('atelier_coach_auth_token');
  if (!token) {
    el.innerHTML = '<div class="bg-slate-50 rounded-2xl border border-slate-200 p-5 mb-2"><p class="text-xs text-slate-500">🔐 AI 분석을 사용하려면 <button onclick="switchLedgerTab(\'settings\');setTimeout(function(){ldgSetSubTab(\'aiconfig\');},50)" class="text-indigo-600 font-semibold underline">설정 → AI 코치 설정</button>에서 토큰을 입력하세요.</p></div>';
    return;
  }
  // Check cache
  var cache = null;
  try { cache = JSON.parse(localStorage.getItem('atelier_coach_ai_cache')); } catch(e){}
  var txCount = (_ledgerData.transactions||[]).length;
  if (!forceRefresh && cache && cache.year === _ldgCoachYear) {
    var age = Date.now() - new Date(cache.lastAnalyzedAt).getTime();
    var txDiff = txCount - (cache.lastTransactionCount||0);
    if (age < 24*3600000 && txDiff < 5) {
      ldgRenderInsightCard(cache.content, cache.usage, cache.lastAnalyzedAt);
      return;
    }
  }
  // Show loading
  el.innerHTML = '<div class="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-5"><p class="text-xs text-slate-500 flex items-center gap-2"><span class="animate-spin inline-block w-4 h-4 border-2 border-indigo-300 border-t-indigo-600 rounded-full"></span> AI 분석 중... (5~15초)</p></div>';
  try {
    var prompt = ldgBuildAnalysisPrompt();
    var result = await callCoachAPI(prompt, _COACH_SYS, 2000);
    var newCache = { lastAnalyzedAt: new Date().toISOString(), lastTransactionCount: txCount, year: _ldgCoachYear, content: result, usage: { input: prompt.length, output: result.length } };
    localStorage.setItem('atelier_coach_ai_cache', JSON.stringify(newCache));
    ldgUpdateUsage(prompt.length, result.length);
    ldgRenderInsightCard(result, newCache.usage, newCache.lastAnalyzedAt);
  } catch(e) {
    el.innerHTML = '<div class="bg-white rounded-2xl border border-red-200 shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-5"><p class="text-xs text-red-500 mb-2">⚠️ 분석 실패: ' + (e.message||'알 수 없는 오류').replace(/</g,'&lt;') + '</p><button onclick="ldgLoadAIInsight(true)" class="text-xs text-indigo-600 font-semibold">다시 시도</button></div>';
  }
}

// ── Usage tracking ──
function ldgUpdateUsage(inTok, outTok) {
  var u = {};
  try { u = JSON.parse(localStorage.getItem('atelier_coach_usage'))||{}; } catch(e){}
  var now = new Date();
  var resetKey = now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0');
  if (u.lastReset !== resetKey) { u = { totalInput:0, totalOutput:0, totalCalls:0, estimatedCost:0, lastReset:resetKey }; }
  u.totalInput = (u.totalInput||0) + inTok;
  u.totalOutput = (u.totalOutput||0) + outTok;
  u.totalCalls = (u.totalCalls||0) + 1;
  u.estimatedCost = Math.round((u.totalInput * 0.003 + u.totalOutput * 0.015) * 1400 / 1000); // rough KRW
  localStorage.setItem('atelier_coach_usage', JSON.stringify(u));
}

// ── AI Budget Suggestion ──
var _BUDGET_SYS = '당신은 재무 코치입니다. 과거 가계부 데이터를 분석해서 카테고리별 월 예산을 제안하세요.\n\n응답: JSON only (마크다운 코드 블록 없이 순수 JSON만)\n구조: {"summary":"요약 2~3문장","budgets":[{"대분류":"식비","소분류":"외식비","monthly":800000,"rationale":"근거"},...]}\n\n원칙: 실제 패턴 존중, 목표 달성 가능한 수준, 0인 카테고리 제외.';

function ldgBuildBudgetPrompt() {
  var goals = ldgLoadGoals()[_ldgCoachYear] || {};
  var txs = _ledgerData.transactions || [];
  function catSum(year) {
    var d = {}; txs.filter(function(t){return t.date&&t.date.substring(0,4)===String(year);}).forEach(function(t){
      if(t['대분류']==='수입'||t['대분류']==='저축') return;
      var k = t['대분류']+'.'+t['소분류']; d[k]=(d[k]||0)+t['금액'];
    });
    return Object.keys(d).sort(function(a,b){return d[b]-d[a];}).map(function(k){return k+': '+d[k].toLocaleString('ko-KR')+'원';}).join('\n');
  }
  return '2024년 카테고리별 지출:\n'+catSum(2024)+'\n\n2025년 카테고리별 지출:\n'+catSum(2025)+'\n\n2026년 목표: 지출 한도 '+(goals['지출']||0).toLocaleString('ko-KR')+'원\n\n2026년 1~4월 실적:\n'+catSum(2026)+'\n\n위 데이터를 분석해서 2026년 카테고리별 월 예산을 JSON으로 제안하세요.';
}

async function ldgAIBudgetSuggest() {
  var btn = document.getElementById('ldg-ai-budget-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'AI 분석 중...'; }
  try {
    var result = await callCoachAPI(ldgBuildBudgetPrompt(), _BUDGET_SYS, 3000);
    ldgUpdateUsage(ldgBuildBudgetPrompt().length, result.length);
    // Parse JSON — handle markdown code blocks
    var json = result.replace(/```json\s*/g,'').replace(/```\s*/g,'').trim();
    var data = JSON.parse(json);
    ldgShowBudgetSuggestionModal(data);
  } catch(e) {
    alert('AI 예산 제안 실패: ' + e.message);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = 'AI 자동 제안 받기'; }
  }
}

function ldgShowBudgetSuggestionModal(data) {
  var old = document.getElementById('ldg-budget-suggest-modal');
  if (old) old.remove();
  var budgets = data.budgets || [];
  var modal = document.createElement('div');
  modal.id = 'ldg-budget-suggest-modal';
  modal.className = 'fixed inset-0 bg-black/30 z-[9999] flex items-center justify-center';
  var rows = budgets.map(function(b, i) {
    return '<tr class="border-b border-slate-50 text-xs"><td class="px-3 py-2"><input type="checkbox" checked data-idx="' + i + '" class="ldg-bs-check w-3 h-3 rounded text-indigo-600 border-slate-300"/></td><td class="px-3 py-2 text-slate-700">' + b['대분류'] + '.' + b['소분류'] + '</td><td class="px-3 py-2 text-right" style="font-feature-settings:\'tnum\'">' + (b.monthly||0).toLocaleString('ko-KR') + '</td><td class="px-3 py-2 text-[10px] text-slate-400">' + (b.rationale||'') + '</td></tr>';
  }).join('');
  var totalMonthly = budgets.reduce(function(s,b){return s+(b.monthly||0);},0);
  modal.innerHTML = '<div class="bg-white rounded-2xl shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col"><div class="p-6 border-b border-slate-100"><h4 class="text-sm font-bold text-slate-900 mb-2">✨ AI 예산 제안 (' + _ldgCoachYear + '년)</h4><p class="text-xs text-slate-500">' + (data.summary||'') + '</p></div>' +
    '<div class="overflow-auto flex-1 p-4"><table class="w-full"><thead class="text-[10px] font-bold text-slate-400 uppercase"><tr><th class="px-3 py-1 w-8"></th><th class="px-3 py-1">카테고리</th><th class="px-3 py-1 text-right">월 예산</th><th class="px-3 py-1">근거</th></tr></thead><tbody>' + rows + '</tbody></table></div>' +
    '<div class="p-4 border-t border-slate-100 flex items-center justify-between"><div class="text-xs text-slate-500">합계: 월 ' + totalMonthly.toLocaleString('ko-KR') + '원</div><div class="flex gap-2"><button onclick="document.getElementById(\'ldg-budget-suggest-modal\').remove()" class="px-4 py-2 text-sm text-slate-500 hover:bg-slate-100 rounded-lg">취소</button><button onclick="ldgApplyBudgetSuggestion()" class="px-4 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">선택 항목 적용</button></div></div></div>';
  document.body.appendChild(modal);
  modal._budgets = budgets;
}

function ldgApplyBudgetSuggestion() {
  var modal = document.getElementById('ldg-budget-suggest-modal');
  if (!modal) return;
  var budgets = modal._budgets || [];
  var checks = modal.querySelectorAll('.ldg-bs-check:checked');
  var applied = 0;
  checks.forEach(function(cb) {
    var b = budgets[parseInt(cb.dataset.idx)];
    if (!b) return;
    var key = b['대분류'] + '.' + b['소분류'];
    if (!_ledgerData.budgets) _ledgerData.budgets = {};
    _ledgerData.budgets[key] = { default: b.monthly, overrides: (_ledgerData.budgets[key]||{}).overrides || {} };
    applied++;
  });
  ldgSaveBudgets();
  modal.remove();
  var toast = document.createElement('div');
  toast.className = 'fixed top-20 right-8 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 shadow-lg z-[9999] flex items-center gap-2';
  toast.innerHTML = '<span class="material-symbols-outlined text-emerald-600 text-sm">check_circle</span><span class="text-emerald-700 text-sm font-semibold">' + applied + '개 카테고리에 예산 적용됨</span>';
  document.body.appendChild(toast);
  setTimeout(function(){if(toast.parentElement)toast.remove();},3000);
}

// ===== DAILY LEDGER: AI COACH API HELPER =====
var ATELIER_FUNCTIONS_URL_ANALYZE = 'https://coachanalyze-zrn5bx33ha-uc.a.run.app';
var ATELIER_FUNCTIONS_URL_PING = 'https://us-central1-the-atelier-99b8c.cloudfunctions.net/coachPing';

async function callCoachAPI(prompt, systemPrompt, maxTokens, model) {
  var token = localStorage.getItem('atelier_coach_auth_token');
  if (!token) throw new Error('인증 토큰이 설정되지 않았습니다. 설정 → AI 코치 설정에서 입력해주세요.');
  var resp = await fetch(ATELIER_FUNCTIONS_URL_ANALYZE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Atelier-Token': token },
    body: JSON.stringify({ prompt: prompt, systemPrompt: systemPrompt || '', maxTokens: maxTokens || 1500, model: model || 'claude-haiku-4-5' })
  });
  if (!resp.ok) {
    var err = await resp.json().catch(function() { return {}; });
    throw new Error(err.message || err.error || 'HTTP ' + resp.status);
  }
  var data = await resp.json();
  // 사용량 트래킹 (Haiku 가격 기준)
  if (data.usage) {
    try {
      var u = JSON.parse(localStorage.getItem('atelier_coach_usage')) || { totalCalls:0, totalInput:0, totalOutput:0, estimatedCost:0 };
      u.totalCalls++;
      u.totalInput += data.usage.input_tokens;
      u.totalOutput += data.usage.output_tokens;
      // Haiku 4.5: $1 / M input, $5 / M output (USD → KRW 약 1,350)
      var costUSD = (data.usage.input_tokens / 1e6) * 1 + (data.usage.output_tokens / 1e6) * 5;
      u.estimatedCost += Math.round(costUSD * 1350);
      localStorage.setItem('atelier_coach_usage', JSON.stringify(u));
    } catch(e) {}
  }
  return { content: data.content, usage: data.usage };
}

// 가계부 데이터 요약 (AI 컨텍스트용)
function ldgPrepareAIContext() {
  var txs = _ledgerData.transactions || [];
  var cats = _ledgerData.categories || {};
  var goals = ldgLoadGoals();
  var thisYearGoal = goals[_ldgYear] || {};
  var now = new Date();
  var curMonth = now.getMonth() + 1;

  // 카테고리별 × 연도별 × 월별 합계 (만원 단위)
  var summary = {};
  txs.forEach(function(t) {
    if (t.excludeFromGoal === true) return;
    if (!t.date) return;
    var y = t.date.substring(0,4);
    var m = parseInt(t.date.substring(5,7));
    var cat = t['대분류'];
    if (!summary[cat]) summary[cat] = {};
    if (!summary[cat][y]) summary[cat][y] = { total: 0, byMonth: {} };
    summary[cat][y].total += (t['금액'] || 0);
    summary[cat][y].byMonth[m] = (summary[cat][y].byMonth[m] || 0) + (t['금액'] || 0);
  });

  // 텍스트로 변환 (만원 단위로 줄여서 토큰 절약)
  var lines = [];
  lines.push('## 사용자 가계부 데이터 (단위: 만원)');
  lines.push('');
  lines.push('### 2026년 연간 목표');
  lines.push('수입 ' + (thisYearGoal['수입']||'?') + '만 / 지출 ' + (thisYearGoal['지출']||'?') + '만 / 저축 ' + (thisYearGoal['저축']||'?') + '만');
  if (thisYearGoal['메모']) lines.push('메모: ' + thisYearGoal['메모']);
  lines.push('');
  lines.push('### 현재 시점: ' + _ldgYear + '년 ' + curMonth + '월 ' + now.getDate() + '일');
  lines.push('');
  lines.push('### 카테고리 분류');
  lines.push('- **고정 지출** (이미 발생/자동이체, 5월 13일 시점 추가 절감 어려움): 주거비, 고정비, 세금/보험');
  lines.push('- **고정 흐름** (월급/자동저축): 수입, 저축');
  lines.push('- **유동 지출** (월 단위 조절 가능): 식비, 교통비, 여행, 생필품비, 자기계발비, 여가비, 품위유지비, 관계비, 경조사비, 건강/의료비');
  lines.push('');
  lines.push('### 카테고리별 연도 × 월별 지출/수입 패턴 (만원, 작년+재작년+올해)');
  var orderedCats = ['수입','저축','주거비','고정비','교통비','식비','건강/의료비','여행','생필품비','자기계발비','여가비','품위유지비','관계비','경조사비','세금/보험'];
  var presentCats = Object.keys(summary);
  var allCats = orderedCats.filter(function(c){ return presentCats.indexOf(c) >= 0; }).concat(presentCats.filter(function(c){ return orderedCats.indexOf(c) < 0; }));
  allCats.forEach(function(cat) {
    var catData = summary[cat];
    var years = Object.keys(catData).sort();
    var parts = [];
    years.forEach(function(y) {
      var totalMan = Math.round(catData[y].total / 10000);
      var monthBreakdown = [];
      for (var m = 1; m <= 12; m++) {
        if (catData[y].byMonth[m]) {
          monthBreakdown.push(m + ':' + Math.round(catData[y].byMonth[m]/10000));
        }
      }
      parts.push(y + ' 연간 ' + totalMan + '만 [' + monthBreakdown.join(', ') + ']');
    });
    lines.push('- ' + cat + ': ' + parts.join(' | '));
  });
  return lines.join('\n');
}

// AI 깊은 분석 실행
async function ldgRunAIDeepAnalysis() {
  var btn = document.getElementById('ldg-ai-deep-btn');
  var resultEl = document.getElementById('ldg-ai-deep-result');
  if (!resultEl) return;
  // 캐시 확인 (같은 달은 1회만)
  var cacheKey = 'atelier_ai_deep_' + _ldgYear + '-' + String(_ldgMonth).padStart(2,'0');
  resultEl.style.display = 'block';
  if (btn) { btn.disabled = true; btn.innerHTML = '<span class="material-symbols-outlined animate-spin" style="font-size: var(--font-size-body)">progress_activity</span> Claude 분석 중...'; }
  try {
    var context = ldgPrepareAIContext();
    var systemPrompt = '당신은 한국어로 답하는 직설적이고 친근한 재무 코치입니다. 2년치 가계부 데이터를 분석해 올해 목표 달성을 도와야 합니다.\n\n[필수 규칙]\n1. **월 단위로만 사고**: 사용자는 "일 단위"로 예산 관리하지 않습니다. "하루 4만으로 줄이세요" 같은 일 단위 조언은 절대 금지. 항상 "이번 달 X만으로", "다음 달부터 Y만으로" 같이 월 단위로.\n2. **카테고리 타입 이해**: 고정 카테고리(주거비/고정비/세금/보험)가 초과되면 → 그 카테고리는 이미 발생하거나 자동이체라 추가 절감이 어려움. 대신 **유동 카테고리에서 보정 제안**. (예: "세금/보험이 +137만 늘었으니 품위유지비/관계비/여가비/식비 같은 유동 카테고리에서 보정")\n3. **구체적 액션**: "줄이세요" X. "품위유지비를 작년 평균 30만 → 이번달 15만으로 줄이면 -15만 보정" 처럼 정확한 카테고리 + 정확한 금액.\n4. 인사말 X, 서론 X, 바로 본론. 짧은 불릿 포인트. 최대 6줄.\n5. 만원 단위 숫자. 이모지(📊🎯💡⚠️✨ 등) 적절히 사용.';
    var prompt = context + '\n\n위 데이터로 다음을 답변하세요 (각 1-2줄, 총 5-6줄):\n1) 🎯 이번 달 핵심 문제 (어느 카테고리가 어떻게 어긋났는지, 만약 고정 카테고리 초과면 이미 발생한 거라 "어쩔 수 없음" 명시)\n2) 💡 보정 액션 (구체적 유동 카테고리 + 정확한 절감 금액. 작년/재작년 패턴 활용)\n3) 📊 작년/재작년 대비 두드러진 변화 1-2개\n4) ✨ 잘하고 있는 부분 1개\n\n절대 "일 X만 사용" 같은 일 단위 조언 X. 월 단위로만.';
    var res = await callCoachAPI(prompt, systemPrompt, 1500, 'claude-haiku-4-5');
    var content = res.content || '응답을 받지 못했습니다.';
    var usage = res.usage || {};
    var costUSD = (usage.input_tokens || 0) / 1e6 * 1 + (usage.output_tokens || 0) / 1e6 * 5;
    var costKrw = Math.round(costUSD * 1350);
    // 저장 (캐시)
    try { localStorage.setItem(cacheKey, JSON.stringify({ content: content, usage: usage, at: new Date().toISOString() })); } catch(e) {}
    ldgRenderAIDeepResult(content, usage, costKrw, false);
  } catch (e) {
    resultEl.innerHTML = '<div class="rounded-2xl p-4 bg-rose-50 border border-rose-200 text-xs text-rose-700">❌ 분석 실패: ' + (e.message || e) + '<br><span class="text-[10px] text-rose-500">설정 → AI 코치 설정에서 토큰을 확인해주세요.</span></div>';
  } finally {
    if (btn) { btn.disabled = false; btn.innerHTML = '<span style="font-size: var(--font-size-body-sm)">🤖</span> AI 깊은 분석 다시 실행'; }
  }
}

// 캐시된 분석 결과 로드
function ldgLoadCachedAIDeepAnalysis() {
  var cacheKey = 'atelier_ai_deep_' + _ldgYear + '-' + String(_ldgMonth).padStart(2,'0');
  try {
    var cached = JSON.parse(localStorage.getItem(cacheKey));
    if (cached && cached.content) {
      var usage = cached.usage || {};
      var costUSD = (usage.input_tokens || 0) / 1e6 * 1 + (usage.output_tokens || 0) / 1e6 * 5;
      var costKrw = Math.round(costUSD * 1350);
      ldgRenderAIDeepResult(cached.content, usage, costKrw, true, cached.at);
      return true;
    }
  } catch(e) {}
  return false;
}

function ldgRenderAIDeepResult(content, usage, costKrw, fromCache, at) {
  var resultEl = document.getElementById('ldg-ai-deep-result');
  if (!resultEl) return;
  resultEl.style.display = 'block';
  // 줄바꿈을 <br>로, 이모지 그대로
  var safe = content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\n/g, '<br>');
  var atDate = at ? new Date(at).toLocaleString('ko-KR') : new Date().toLocaleString('ko-KR');
  resultEl.innerHTML = '<div class="rounded-2xl p-4 mt-2" style="background:linear-gradient(135deg,#f5f3ff,#ede9fe);border:1px solid #ddd6fe;">' +
    '<div class="flex items-start gap-3">' +
      '<span style="font-size: var(--font-size-h1)">🤖</span>' +
      '<div class="flex-1">' +
        '<div class="flex items-center justify-between mb-2">' +
          '<p class="text-xs font-bold text-purple-900">Claude Haiku 깊은 분석' + (fromCache ? ' <span class="text-[9px] text-slate-400 font-normal">(캐시됨)</span>' : '') + '</p>' +
          '<p class="text-[9px] text-slate-400">' + atDate + (usage.input_tokens ? ' · ' + (usage.input_tokens + (usage.output_tokens||0)).toLocaleString() + ' tokens · ₩' + costKrw : '') + '</p>' +
        '</div>' +
        '<div class="text-[12px] text-slate-700 leading-relaxed">' + safe + '</div>' +
      '</div>' +
    '</div>' +
  '</div>';
}

function ldgRenderAIConfig() {
  var tokenEl = document.getElementById('ldg-ai-token');
  var saved = localStorage.getItem('atelier_coach_auth_token') || '';
  if (tokenEl && saved) tokenEl.value = saved;
  // Usage display
  var uEl = document.getElementById('ldg-ai-usage');
  if (uEl) {
    var u = {};
    try { u = JSON.parse(localStorage.getItem('atelier_coach_usage'))||{}; } catch(e){}
    uEl.innerHTML = '<p class="text-xs font-bold text-slate-700 mb-2">이번 달 사용량</p>' +
      '<div class="text-xs text-slate-500 space-y-1">' +
      '<p>AI 호출: ' + (u.totalCalls||0) + '회</p>' +
      '<p>토큰: ' + ((u.totalInput||0)+(u.totalOutput||0)).toLocaleString() + ' (입력 ' + (u.totalInput||0).toLocaleString() + ' + 출력 ' + (u.totalOutput||0).toLocaleString() + ')</p>' +
      '<p>예상 비용: ₩' + (u.estimatedCost||0).toLocaleString() + '</p></div>';
  }
}

function ldgSaveAIToken() {
  var val = (document.getElementById('ldg-ai-token') || {}).value || '';
  if (!val.trim()) { alert('토큰을 입력해주세요.'); return; }
  localStorage.setItem('atelier_coach_auth_token', val.trim());
  var st = document.getElementById('ldg-ai-status');
  if (st) st.innerHTML = '<span class="text-emerald-600 font-semibold">토큰 저장됨</span>';
}

async function ldgTestAIConnection() {
  var st = document.getElementById('ldg-ai-status');
  if (st) st.innerHTML = '<span class="text-slate-400">연결 테스트 중...</span>';
  try {
    var token = localStorage.getItem('atelier_coach_auth_token') || '';
    var resp = await fetch(ATELIER_FUNCTIONS_URL_PING, {
      headers: token ? { 'X-Atelier-Token': token } : {}
    });
    var data = await resp.json();
    if (data.status === 'ok' && data.authenticated) {
      st.innerHTML = '<span class="text-emerald-600 font-semibold">✅ 연결됨 — API 키: ' + (data.hasApiKey ? '설정됨' : '미설정') + ', 인증: 성공</span>';
    } else if (data.status === 'ok') {
      st.innerHTML = '<span class="text-amber-600 font-semibold">⚠️ 서버 응답 OK — 인증 토큰 불일치 (Functions에 설정한 토큰과 다름)</span>';
    } else {
      st.innerHTML = '<span class="text-red-500 font-semibold">❌ 예상치 못한 응답</span>';
    }
  } catch (e) {
    st.innerHTML = '<span class="text-red-500 font-semibold">❌ 연결 실패: ' + e.message + '</span>';
  }
}

// ===== DAILY LEDGER: GOALS =====
var _ldgGoalYear = 2026;

function ldgGoToGoals() { switchLedgerTab('settings'); setTimeout(function(){ ldgSetSubTab('goals'); }, 50); }

function ldgLoadGoals() {
  try { return JSON.parse(localStorage.getItem('atelier_ledger_goals')) || {}; } catch(e) { return {}; }
}

function ldgGoalSetYear(yr) {
  _ldgGoalYear = yr;
  ldgRenderGoals();
}

function ldgRenderGoals() {
  var goals = ldgLoadGoals();
  var g = goals[_ldgGoalYear] || {};
  // Year buttons
  document.querySelectorAll('.ldg-goal-yr').forEach(function(btn) {
    if (parseInt(btn.dataset.yr) === _ldgGoalYear) {
      btn.style.background = 'linear-gradient(135deg,#6366f1,#a855f7)'; btn.style.color = '#fff';
    } else {
      btn.style.background = '#f1f5f9'; btn.style.color = '#64748b';
    }
  });
  document.getElementById('ldg-goal-form-title').textContent = _ldgGoalYear + '년 목표';
  document.getElementById('ldg-goal-income').value = g['수입'] ? g['수입'].toLocaleString('ko-KR') : '';
  document.getElementById('ldg-goal-sidegig').value = g['부업'] ? g['부업'].toLocaleString('ko-KR') : '';
  document.getElementById('ldg-goal-saving').value = g['저축'] ? g['저축'].toLocaleString('ko-KR') : '';
  document.getElementById('ldg-goal-expense').value = g['지출'] ? g['지출'].toLocaleString('ko-KR') : '';
  document.getElementById('ldg-goal-memo').value = g['메모'] || '';
  ldgGoalCalc();
  ldgGoalProgress();
}

function ldgGoalCalc() {
  var inc = parseInt((document.getElementById('ldg-goal-income').value||'').replace(/[^0-9]/g,'')) || 0;
  var sub = parseInt((document.getElementById('ldg-goal-sidegig').value||'').replace(/[^0-9]/g,'')) || 0;
  var sav = parseInt((document.getElementById('ldg-goal-saving').value||'').replace(/[^0-9]/g,'')) || 0;
  var exp = parseInt((document.getElementById('ldg-goal-expense').value||'').replace(/[^0-9]/g,'')) || 0;
  document.getElementById('ldg-goal-income-hint').textContent = inc > 0 ? '매월 평균 ' + Math.round(inc/12).toLocaleString('ko-KR') + '원' : '';
  // 부업 hint: 월평균 + 수입 목표 대비 비중
  var subHint = '';
  if (sub > 0) {
    subHint = '매월 평균 ' + Math.round(sub/12).toLocaleString('ko-KR') + '원';
    if (inc > 0) subHint += ' · 수입의 ' + (sub / inc * 100).toFixed(1) + '%';
  }
  document.getElementById('ldg-goal-sidegig-hint').textContent = subHint;
  var savRate = inc > 0 ? (sav / inc * 100).toFixed(1) : 0;
  document.getElementById('ldg-goal-saving-hint').textContent = sav > 0 && inc > 0 ? '수입의 ' + savRate + '% (저축률)' : '';
  document.getElementById('ldg-goal-expense-hint').textContent = exp > 0 ? '매월 평균 ' + Math.round(exp/12).toLocaleString('ko-KR') + '원' : '';
  var warn = document.getElementById('ldg-goal-warn');
  if (inc > 0 && sav + exp > inc) { warn.textContent = '⚠️ 수입보다 지출+저축이 큼. 적자 예상'; warn.style.display = ''; }
  else if (sub > 0 && inc > 0 && sub > inc) { warn.textContent = '⚠️ 부업 목표가 전체 수입 목표보다 큼'; warn.style.display = ''; }
  else { warn.style.display = 'none'; }
}

function ldgSaveGoal() {
  var inc = parseInt((document.getElementById('ldg-goal-income').value||'').replace(/[^0-9]/g,'')) || 0;
  var sub = parseInt((document.getElementById('ldg-goal-sidegig').value||'').replace(/[^0-9]/g,'')) || 0;
  var sav = parseInt((document.getElementById('ldg-goal-saving').value||'').replace(/[^0-9]/g,'')) || 0;
  var exp = parseInt((document.getElementById('ldg-goal-expense').value||'').replace(/[^0-9]/g,'')) || 0;
  var memo = (document.getElementById('ldg-goal-memo').value || '').trim();
  var goals = ldgLoadGoals();
  goals[_ldgGoalYear] = { '수입': inc, '부업': sub, '저축': sav, '지출': exp, '메모': memo, updatedAt: new Date().toISOString() };
  ldgBackupBeforeSave('atelier_ledger_goals');
  localStorage.setItem('atelier_ledger_goals', JSON.stringify(goals));
  scheduleLedgerSync(); // 다기기 자동 동기화
  // Toast
  var toast = document.createElement('div');
  toast.className = 'fixed top-20 right-8 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 shadow-lg z-[9999] flex items-center gap-2';
  toast.innerHTML = '<span class="material-symbols-outlined text-emerald-600 text-sm">check_circle</span><span class="text-emerald-700 text-sm font-semibold">' + _ldgGoalYear + '년 목표가 저장되���습니다</span>';
  document.body.appendChild(toast);
  setTimeout(function() { if (toast.parentElement) toast.remove(); }, 3000);
  ldgGoalProgress();
}

function ldgGoalProgress() {
  var el = document.getElementById('ldg-goal-progress');
  if (!el) return;
  var goals = ldgLoadGoals();
  var g = goals[_ldgGoalYear];
  if (!g || (!g['수입'] && !g['저축'] && !g['지출'])) { el.innerHTML = '<p class="text-xs text-slate-400">목표를 저장하면 진행 상황이 표시됩니��.</p>'; return; }
  var txs = (_ledgerData.transactions || []).filter(function(t) { return t.date && t.date.substring(0,4) === String(_ldgGoalYear); });
  var curInc = 0, curSav = 0, curExp = 0;
  // Find latest month with data
  var latestMonth = 0;
  txs.forEach(function(t) {
    var m = parseInt(t.date.split('-')[1]);
    if (m > latestMonth) latestMonth = m;
    if (t['대분류'] === '수입') curInc += t['금액'];
    else if (t['대분류'] === '저축') curSav += t['금액'];
    else curExp += t['금액'];
  });
  var monthLabel = latestMonth > 0 ? _ldgGoalYear + '년 ' + latestMonth + '월 현재' : _ldgGoalYear + '년 (데이터 없음)';
  function pctBar(cur, goal) {
    if (!goal) return '';
    var pct = Math.min(Math.round(cur / goal * 100), 100);
    return '<div class="flex items-center gap-2 mt-1"><div class="flex-1 h-1.5 bg-slate-200 rounded-full"><div class="h-full bg-indigo-500 rounded-full" style="width:' + pct + '%"></div></div><span class="text-[10px] font-bold text-indigo-600" style="font-feature-settings:\'tnum\'">' + pct + '%</span></div>';
  }
  el.innerHTML = '<p class="text-xs font-bold text-slate-700 mb-3">📊 ' + monthLabel + '</p>' +
    '<div class="space-y-3">' +
    (g['수���'] ? '<div><p class="text-xs text-slate-600">수입: ' + ldgFmt(curInc) + ' / ' + ldgFmt(g['수입']) + '</p>' + pctBar(curInc, g['수입']) + '</div>' : '') +
    (g['저축'] ? '<div><p class="text-xs text-slate-600">저축: ' + ldgFmt(curSav) + ' / ' + ldgFmt(g['저축']) + '</p>' + pctBar(curSav, g['저축']) + '</div>' : '') +
    (g['지출'] ? '<div><p class="text-xs text-slate-600">지출: ' + ldgFmt(curExp) + ' / ' + ldgFmt(g['지출']) + '</p>' + pctBar(curExp, g['지출']) + '</div>' : '') +
    '</div>' +
    '<p class="text-[10px] text-slate-400 mt-3">* 자세한 분석은 코치 탭에서 (Coming Soon)</p>';
}

// ===== 2024 DATA MIGRATION =====
function ldgCheckMigrationState() {
  var txs = _ledgerData.transactions || [];
  var has2024 = txs.some(function(t) { return t.date && t.date.startsWith('2024'); });
  var wrap = document.getElementById('ldg-migrate-2024-wrap');
  var done = document.getElementById('ldg-migrate-2024-done');
  if (wrap) wrap.style.display = has2024 ? 'none' : '';
  if (done) done.style.display = has2024 ? '' : 'none';
}

function ldgMigrate2024() {
  var txs = _ledgerData.transactions || [];
  if (txs.some(function(t) { return t.date && t.date.startsWith('2024'); })) {
    alert('2024년 데이터가 이미 존재합니다.');
    return;
  }
  ldgSafetyShow('1,107건의 2024년 거래 데이터를 추가합니다.\n기존 데이터(2025~2026년)에는 영향 없습니다.\n\n진행하시겠습니까?', function() {
    // Backup current data
    ldgBackupBeforeSave('atelier_ledger_transactions');
    localStorage.setItem('atelier_ledger_transactions_backup_pre_2024_migration', JSON.stringify(txs));
    // Fetch and merge
    fetch('data/ledger/transactions_2024_only.json').then(function(r) { return r.json(); }).then(function(data2024) {
      var merged = data2024.concat(txs);
      merged.sort(function(a, b) { return (a.date || '').localeCompare(b.date || ''); });
      _ledgerData.transactions = merged;
      ldgSaveTx();
      ldgCheckMigrationState();
      console.log('[DailyLedger] Migration complete: added ' + data2024.length + ' transactions from 2024. Total: ' + merged.length);
      // Show success toast
      var toast = document.createElement('div');
      toast.className = 'fixed top-20 right-8 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 shadow-lg z-[9999] flex items-center gap-2';
      toast.innerHTML = '<span class="material-symbols-outlined text-emerald-600 text-sm">check_circle</span><span class="text-emerald-700 text-sm font-semibold">' + data2024.length + '건의 2024년 거래 추가 완료</span>';
      document.body.appendChild(toast);
      setTimeout(function() { if (toast.parentElement) toast.remove(); }, 5000);
    }).catch(function(err) {
      alert('데이터 로드 실패: ' + err.message);
      console.error('[DailyLedger] Migration error:', err);
    });
  }, '가져오기');
}

// ===== AUTO BACKUP SYSTEM =====
var _ldgBackupKeys = {
  transactions: 'atelier_ledger_transactions',
  categories: 'atelier_ledger_categories',
  budgets: 'atelier_ledger_budgets',
  recurring: 'atelier_ledger_recurring',
  assets: 'atelier_ledger_assets',
  settings: 'atelier_ledger_settings',
  goals: 'atelier_ledger_goals'
};

function ldgRotateBackup(key) {
  try {
    var auto2 = localStorage.getItem(key + '_auto_2');
    var auto1 = localStorage.getItem(key + '_auto_1');
    if (auto2) localStorage.setItem(key + '_auto_3', auto2);
    if (auto1) localStorage.setItem(key + '_auto_2', auto1);
    var current = localStorage.getItem(key);
    if (current) {
      var parsed = JSON.parse(current);
      var count = Array.isArray(parsed) ? parsed.length : (typeof parsed === 'object' ? Object.keys(parsed).length : 0);
      localStorage.setItem(key + '_auto_1', JSON.stringify({
        timestamp: new Date().toISOString(),
        itemCount: count,
        data: parsed
      }));
    }
  } catch(e) { console.warn('[Backup] rotate failed for ' + key, e); }
}

function ldgDailySnapshot(key) {
  try {
    var today = new Date().toISOString().split('T')[0];
    var dailyKey = key + '_daily_' + today;
    if (localStorage.getItem(dailyKey)) return;
    var current = localStorage.getItem(key);
    if (current) {
      var parsed = JSON.parse(current);
      var count = Array.isArray(parsed) ? parsed.length : (typeof parsed === 'object' ? Object.keys(parsed).length : 0);
      localStorage.setItem(dailyKey, JSON.stringify({
        timestamp: new Date().toISOString(),
        itemCount: count,
        data: parsed
      }));
    }
    ldgCleanOldDailyBackups(key);
  } catch(e) { console.warn('[Backup] daily snapshot failed for ' + key, e); }
}

function ldgCleanOldDailyBackups(key) {
  var prefix = key + '_daily_';
  var cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  var cutoffStr = cutoff.toISOString().split('T')[0];
  for (var i = 0; i < localStorage.length; i++) {
    var k = localStorage.key(i);
    if (k && k.startsWith(prefix)) {
      var dateStr = k.substring(prefix.length);
      if (dateStr < cutoffStr) { localStorage.removeItem(k); i--; }
    }
  }
}

function ldgBackupBeforeSave(key) {
  ldgRotateBackup(key);
  ldgDailySnapshot(key);
}

function ldgGetBackupList() {
  var result = { auto: [], daily: [], migration: [] };
  for (var name in _ldgBackupKeys) {
    var base = _ldgBackupKeys[name];
    for (var slot = 1; slot <= 3; slot++) {
      var bk = localStorage.getItem(base + '_auto_' + slot);
      if (bk) {
        try {
          var info = JSON.parse(bk);
          result.auto.push({ key: base + '_auto_' + slot, slot: slot, dataKey: base, name: name, timestamp: info.timestamp, itemCount: info.itemCount || 0 });
        } catch(e) {}
      }
    }
    // daily snapshots
    var prefix = base + '_daily_';
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      if (k && k.startsWith(prefix)) {
        try {
          var info2 = JSON.parse(localStorage.getItem(k));
          var dateStr = k.substring(prefix.length);
          result.daily.push({ key: k, dataKey: base, name: name, date: dateStr, timestamp: info2.timestamp, itemCount: info2.itemCount || 0 });
        } catch(e) {}
      }
    }
  }
  // migration backups
  for (var i2 = 0; i2 < localStorage.length; i2++) {
    var mk = localStorage.key(i2);
    if (mk && mk.indexOf('_backup_pre_') >= 0 && mk.startsWith('atelier_ledger_')) {
      try {
        var raw = localStorage.getItem(mk);
        var parsed2 = JSON.parse(raw);
        var cnt = Array.isArray(parsed2) ? parsed2.length : 0;
        result.migration.push({ key: mk, itemCount: cnt, label: mk.replace('atelier_ledger_transactions_backup_pre_', '').replace(/_/g, ' ') });
      } catch(e) {}
    }
  }
  // pre_restore backups
  for (var i3 = 0; i3 < localStorage.length; i3++) {
    var rk = localStorage.key(i3);
    if (rk && rk.indexOf('_pre_restore_') >= 0 && rk.startsWith('atelier_ledger_')) {
      try {
        var raw2 = localStorage.getItem(rk);
        var parsed3 = JSON.parse(raw2);
        var cnt2 = Array.isArray(parsed3.data) ? parsed3.data.length : (Array.isArray(parsed3) ? parsed3.length : 0);
        result.migration.push({ key: rk, itemCount: cnt2, label: '복원 전 백업 (' + (parsed3.timestamp || '').substring(0,10) + ')' });
      } catch(e) {}
    }
  }
  result.daily.sort(function(a,b) { return b.date.localeCompare(a.date); });
  result.auto.sort(function(a,b) { return a.slot - b.slot; });
  return result;
}

function ldgFormatTimeAgo(isoStr) {
  if (!isoStr) return '알 수 없음';
  var diff = Date.now() - new Date(isoStr).getTime();
  var mins = Math.floor(diff / 60000);
  if (mins < 1) return '방금 전';
  if (mins < 60) return mins + '분 전';
  var hours = Math.floor(mins / 60);
  if (hours < 24) return hours + '시간 전';
  var days = Math.floor(hours / 24);
  return days + '일 전';
}

function ldgRestoreFromBackup(backupKey, dataKey) {
  try {
    var raw = localStorage.getItem(backupKey);
    if (!raw) { alert('백업 데이터를 찾을 수 없습니다.'); return; }
    var parsed = JSON.parse(raw);
    var backupData = parsed.data !== undefined ? parsed.data : parsed;
    // Validate
    if (backupData === null || backupData === undefined) { alert('백업 데이터가 비어있습니다.'); return; }
    // Count
    var backupCount = Array.isArray(backupData) ? backupData.length : (typeof backupData === 'object' ? Object.keys(backupData).length : 0);
    var currentRaw = localStorage.getItem(dataKey);
    var currentData = currentRaw ? JSON.parse(currentRaw) : null;
    var currentCount = currentData ? (Array.isArray(currentData) ? currentData.length : Object.keys(currentData).length) : 0;
    var diff = backupCount - currentCount;
    var diffStr = diff > 0 ? '+' + diff : String(diff);

    var msg = '현재 데이터(' + currentCount.toLocaleString() + '건)를 백업(' + backupCount.toLocaleString() + '건)으로 복원합니다.\n변경: ' + diffStr + '건\n\n복원 전 현재 데이터는 자동으로 별도 백업됩니다.\n진행하시겠습니까?';
    ldgSafetyShow(msg, function() {
      // Save pre-restore backup
      if (currentRaw) {
        localStorage.setItem(dataKey + '_pre_restore_' + Date.now(), JSON.stringify({
          timestamp: new Date().toISOString(),
          itemCount: currentCount,
          data: currentData
        }));
      }
      // Restore
      localStorage.setItem(dataKey, JSON.stringify(backupData));
      // Update in-memory data
      for (var name in _ldgBackupKeys) {
        if (_ldgBackupKeys[name] === dataKey) {
          _ledgerData[name] = backupData;
          break;
        }
      }
      // Toast + refresh
      var toast = document.createElement('div');
      toast.className = 'fixed top-20 right-8 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 shadow-lg z-[9999] flex items-center gap-2';
      toast.innerHTML = '<span class="material-symbols-outlined text-emerald-600 text-sm">check_circle</span><span class="text-emerald-700 text-sm font-semibold">복원 완료. 페이지를 새로고침합니다.</span>';
      document.body.appendChild(toast);
      setTimeout(function() { location.reload(); }, 1500);
    }, '복원');
  } catch(e) { alert('복원 실패: ' + e.message); }
}

function ldgRestoreMigrationBackup(backupKey) {
  ldgRestoreFromBackup(backupKey, 'atelier_ledger_transactions');
}

function ldgDownloadAll() {
  try {
    var exportData = { version: '1.0', exportedAt: new Date().toISOString() };
    for (var name in _ldgBackupKeys) {
      var raw = localStorage.getItem(_ldgBackupKeys[name]);
      exportData[name] = raw ? JSON.parse(raw) : null;
    }
    var blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    var today = new Date().toISOString().split('T')[0];
    a.download = 'atelier-ledger-backup-' + today + '.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    // Toast
    var toast = document.createElement('div');
    toast.className = 'fixed top-20 right-8 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 shadow-lg z-[9999] flex items-center gap-2';
    toast.innerHTML = '<span class="material-symbols-outlined text-emerald-600 text-sm">download</span><span class="text-emerald-700 text-sm font-semibold">백업 파일 다운로드 완료</span>';
    document.body.appendChild(toast);
    setTimeout(function() { if (toast.parentElement) toast.remove(); }, 3000);
  } catch(e) { alert('다운로드 실패: ' + e.message); }
}

function ldgUploadRestore() {
  var input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.onchange = function(e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function(ev) {
      try {
        var data = JSON.parse(ev.target.result);
        if (!data.version || !data.exportedAt) { alert('올바른 백업 파일이 아닙니다.'); return; }
        // Count transactions for display
        var txCount = Array.isArray(data.transactions) ? data.transactions.length : 0;
        var exportDate = data.exportedAt.substring(0, 10);
        var msg = '백업 파일에서 복원합니다.\n\n파일 정보:\n• 내보낸 날짜: ' + exportDate + '\n• 거래: ' + txCount.toLocaleString() + '건\n\n현재 데이터는 자동으로 백업됩니다.\n진행하시겠습니까?';
        ldgSafetyShow(msg, function() {
          // Backup current data first
          for (var name in _ldgBackupKeys) {
            var currentRaw = localStorage.getItem(_ldgBackupKeys[name]);
            if (currentRaw) {
              localStorage.setItem(_ldgBackupKeys[name] + '_pre_restore_' + Date.now(), JSON.stringify({
                timestamp: new Date().toISOString(),
                data: JSON.parse(currentRaw)
              }));
            }
          }
          // Restore each data type
          for (var name2 in _ldgBackupKeys) {
            if (data[name2] !== undefined && data[name2] !== null) {
              localStorage.setItem(_ldgBackupKeys[name2], JSON.stringify(data[name2]));
            }
          }
          var toast = document.createElement('div');
          toast.className = 'fixed top-20 right-8 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 shadow-lg z-[9999] flex items-center gap-2';
          toast.innerHTML = '<span class="material-symbols-outlined text-emerald-600 text-sm">check_circle</span><span class="text-emerald-700 text-sm font-semibold">파일에서 복원 완료. 페이지를 새로고침합니다.</span>';
          document.body.appendChild(toast);
          setTimeout(function() { location.reload(); }, 1500);
        }, '복원');
      } catch(err) { alert('파일 파싱 실패: ' + err.message); }
    };
    reader.readAsText(file);
  };
  input.click();
}

function ldgCheckDataAnomaly() {
  try {
    var txKey = 'atelier_ledger_transactions';
    var current = localStorage.getItem(txKey);
    if (!current) return;
    var txs = JSON.parse(current);
    var currentCount = Array.isArray(txs) ? txs.length : 0;
    if (currentCount === 0) return;
    // Check auto_1 for comparison
    var auto1 = localStorage.getItem(txKey + '_auto_1');
    if (!auto1) return;
    var auto1Data = JSON.parse(auto1);
    var prevCount = auto1Data.itemCount || 0;
    if (prevCount === 0) return;
    var ratio = currentCount / prevCount;
    if (ratio < 0.5) {
      // Show warning banner
      setTimeout(function() {
        if (document.getElementById('ldg-anomaly-banner')) return;
        var banner = document.createElement('div');
        banner.id = 'ldg-anomaly-banner';
        banner.className = 'fixed top-4 left-1/2 -translate-x-1/2 bg-amber-50 border-2 border-amber-400 rounded-2xl px-6 py-4 shadow-2xl z-[99999] max-w-md w-full';
        banner.innerHTML =
          '<div class="flex items-start gap-3">' +
            '<span class="material-symbols-outlined text-amber-600 text-xl mt-0.5">warning</span>' +
            '<div class="flex-1">' +
              '<p class="text-sm font-bold text-amber-800">거래 데이터가 평소보다 적습니다</p>' +
              '<p class="text-xs text-amber-700 mt-1">현재 ' + currentCount.toLocaleString() + '건 / 이전 ' + prevCount.toLocaleString() + '건</p>' +
              '<p class="text-xs text-amber-600 mt-1">복원이 필요한지 확인해주세요.</p>' +
              '<div class="flex gap-2 mt-3">' +
                '<button onclick="switchLedgerTab(\'settings\');ldgSetSubTab(\'data\');this.closest(\'#ldg-anomaly-banner\').remove()" class="text-xs px-3 py-1.5 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700">백업 보기</button>' +
                '<button onclick="this.closest(\'#ldg-anomaly-banner\').remove()" class="text-xs px-3 py-1.5 text-amber-600 hover:bg-amber-100 rounded-lg">무시</button>' +
              '</div>' +
            '</div>' +
          '</div>';
        document.body.appendChild(banner);
      }, 1000);
    }
  } catch(e) { console.warn('[Backup] anomaly check failed', e); }
}

function ldgRenderBackupUI() {
  var el = document.getElementById('ldg-backup-section');
  if (!el) return;
  var list = ldgGetBackupList();
  // Latest backup info
  var latestTs = '', latestCount = 0;
  if (list.auto.length) {
    var first = list.auto.find(function(a) { return a.slot === 1 && a.name === 'transactions'; });
    if (first) { latestTs = first.timestamp; latestCount = first.itemCount; }
  }
  var html = '<div class="flex items-center justify-between mb-4">' +
    '<div>' +
      '<h4 class="text-sm font-bold text-slate-700 flex items-center gap-2"><span class="material-symbols-outlined text-base text-indigo-500">shield</span>데이터 백업 및 복원</h4>' +
      '<p class="text-[10px] text-slate-400 mt-0.5">자동 백업: 활성화됨' + (latestTs ? ' · 최근 백업: ' + ldgFormatTimeAgo(latestTs) + ' (' + latestCount.toLocaleString() + '건)' : '') + '</p>' +
    '</div>' +
  '</div>';

  // Auto backups - grouped by slot
  var autoBySlot = {};
  list.auto.forEach(function(a) { if (!autoBySlot[a.slot]) autoBySlot[a.slot] = []; autoBySlot[a.slot].push(a); });
  if (Object.keys(autoBySlot).length) {
    html += '<div class="mb-4"><p class="text-xs font-semibold text-slate-600 mb-2">자동 백업</p><div class="space-y-1.5">';
    [1,2,3].forEach(function(slot) {
      var items = autoBySlot[slot];
      if (!items) return;
      var txItem = items.find(function(i) { return i.name === 'transactions'; });
      var ts = txItem ? txItem.timestamp : items[0].timestamp;
      var cnt = txItem ? txItem.itemCount : items[0].itemCount;
      var names = items.map(function(i) { return i.name; });
      html += '<div class="flex items-center justify-between bg-white rounded-lg border border-slate-100 px-3 py-2">' +
        '<div><span class="text-xs text-slate-700 font-medium">백업 ' + slot + '</span>' +
        '<span class="text-[10px] text-slate-400 ml-2">' + ldgFormatTimeAgo(ts) + (cnt ? ', 거래 ' + cnt.toLocaleString() + '건' : '') + '</span>' +
        '<span class="text-[10px] text-slate-300 ml-1">(' + names.length + '종)</span></div>' +
        '<button onclick="ldgRestoreAutoSlot(' + slot + ')" class="text-[10px] px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-md font-semibold hover:bg-indigo-100">복원</button>' +
      '</div>';
    });
    html += '</div></div>';
  }

  // Daily snapshots - grouped by date
  var dailyByDate = {};
  list.daily.forEach(function(d) { if (!dailyByDate[d.date]) dailyByDate[d.date] = []; dailyByDate[d.date].push(d); });
  var dailyDates = Object.keys(dailyByDate).sort().reverse();
  if (dailyDates.length) {
    html += '<div class="mb-4"><p class="text-xs font-semibold text-slate-600 mb-2">일일 스냅샷</p><div class="space-y-1.5">';
    dailyDates.forEach(function(date) {
      var items = dailyByDate[date];
      var txItem = items.find(function(i) { return i.name === 'transactions'; });
      var cnt = txItem ? txItem.itemCount : items[0].itemCount;
      var today = new Date().toISOString().split('T')[0];
      var label = date === today ? date + ' (오늘)' : date;
      html += '<div class="flex items-center justify-between bg-white rounded-lg border border-slate-100 px-3 py-2">' +
        '<div><span class="text-xs text-slate-700 font-medium">' + label + '</span>' +
        '<span class="text-[10px] text-slate-400 ml-2">거래 ' + cnt.toLocaleString() + '건</span>' +
        '<span class="text-[10px] text-slate-300 ml-1">(' + items.length + '종)</span></div>' +
        '<button onclick="ldgRestoreDailySlot(\'' + date + '\')" class="text-[10px] px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-md font-semibold hover:bg-indigo-100">복원</button>' +
      '</div>';
    });
    html += '</div></div>';
  }

  // Migration backups
  if (list.migration.length) {
    html += '<div class="mb-4"><p class="text-xs font-semibold text-slate-600 mb-2">마이그레이션 백업</p><div class="space-y-1.5">';
    list.migration.forEach(function(m) {
      html += '<div class="flex items-center justify-between bg-white rounded-lg border border-slate-100 px-3 py-2">' +
        '<div><span class="text-xs text-slate-700 font-medium">' + m.label + '</span>' +
        '<span class="text-[10px] text-slate-400 ml-2">' + m.itemCount.toLocaleString() + '건</span></div>' +
        '<button onclick="ldgRestoreMigrationBackup(\'' + m.key + '\')" class="text-[10px] px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-md font-semibold hover:bg-indigo-100">복원</button>' +
      '</div>';
    });
    html += '</div></div>';
  }

  // Download / Upload buttons
  html += '<div class="flex gap-2 mt-4">' +
    '<button onclick="ldgDownloadAll()" class="flex-1 text-xs px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 flex items-center justify-center gap-1.5"><span class="material-symbols-outlined text-sm">download</span>현재 데이터 다운로드 (JSON)</button>' +
    '<button onclick="ldgUploadRestore()" class="flex-1 text-xs px-4 py-2.5 bg-slate-100 text-slate-700 rounded-lg font-semibold hover:bg-slate-200 flex items-center justify-center gap-1.5"><span class="material-symbols-outlined text-sm">upload</span>백업 파일에서 복원</button>' +
  '</div>';

  // Storage usage estimate
  var totalSize = 0;
  for (var i = 0; i < localStorage.length; i++) {
    var k = localStorage.key(i);
    if (k && k.startsWith('atelier_ledger_')) {
      totalSize += (localStorage.getItem(k) || '').length * 2; // UTF-16
    }
  }
  var sizeMB = (totalSize / 1024 / 1024).toFixed(1);
  html += '<p class="text-[10px] text-slate-400 mt-3 text-center">가계부 localStorage 사용량: 약 ' + sizeMB + 'MB</p>';

  el.innerHTML = html;
}

function ldgRestoreAutoSlot(slot) {
  // Restore all data types from the given auto slot
  var keys = [];
  for (var name in _ldgBackupKeys) {
    var bkKey = _ldgBackupKeys[name] + '_auto_' + slot;
    if (localStorage.getItem(bkKey)) keys.push({ name: name, backupKey: bkKey, dataKey: _ldgBackupKeys[name] });
  }
  if (!keys.length) { alert('해당 백업을 찾을 수 없습니다.'); return; }
  // Show info about tx count
  var txBackup = keys.find(function(k) { return k.name === 'transactions'; });
  var bkCount = 0;
  if (txBackup) { try { bkCount = JSON.parse(localStorage.getItem(txBackup.backupKey)).itemCount || 0; } catch(e) {} }
  var currentCount = (_ledgerData.transactions || []).length;
  var diff = bkCount - currentCount;
  var diffStr = diff > 0 ? '+' + diff : String(diff);
  var msg = '자동 백업 ' + slot + '에서 복원합니다.\n\n복원 대상: ' + keys.map(function(k) { return k.name; }).join(', ') + '\n현재 거래: ' + currentCount.toLocaleString() + '건 → 백업: ' + bkCount.toLocaleString() + '건 (' + diffStr + ')\n\n복원 전 현재 데이터는 자동으로 백업됩니다.\n진행하시겠습니까?';
  ldgSafetyShow(msg, function() {
    var ts = Date.now();
    keys.forEach(function(item) {
      var currentRaw = localStorage.getItem(item.dataKey);
      if (currentRaw) {
        localStorage.setItem(item.dataKey + '_pre_restore_' + ts, JSON.stringify({
          timestamp: new Date().toISOString(),
          data: JSON.parse(currentRaw)
        }));
      }
      var backup = JSON.parse(localStorage.getItem(item.backupKey));
      var bData = backup.data !== undefined ? backup.data : backup;
      localStorage.setItem(item.dataKey, JSON.stringify(bData));
    });
    var toast = document.createElement('div');
    toast.className = 'fixed top-20 right-8 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 shadow-lg z-[9999] flex items-center gap-2';
    toast.innerHTML = '<span class="material-symbols-outlined text-emerald-600 text-sm">check_circle</span><span class="text-emerald-700 text-sm font-semibold">복원 완료. 페이지를 새로고침합니다.</span>';
    document.body.appendChild(toast);
    setTimeout(function() { location.reload(); }, 1500);
  }, '복원');
}

function ldgRestoreDailySlot(date) {
  var keys = [];
  for (var name in _ldgBackupKeys) {
    var bkKey = _ldgBackupKeys[name] + '_daily_' + date;
    if (localStorage.getItem(bkKey)) keys.push({ name: name, backupKey: bkKey, dataKey: _ldgBackupKeys[name] });
  }
  if (!keys.length) { alert('해당 일일 백업을 찾을 수 없습니다.'); return; }
  var txBackup = keys.find(function(k) { return k.name === 'transactions'; });
  var bkCount = 0;
  if (txBackup) { try { bkCount = JSON.parse(localStorage.getItem(txBackup.backupKey)).itemCount || 0; } catch(e) {} }
  var currentCount = (_ledgerData.transactions || []).length;
  var diff = bkCount - currentCount;
  var diffStr = diff > 0 ? '+' + diff : String(diff);
  var msg = date + ' 일일 스냅샷에서 복원합니다.\n\n복원 대상: ' + keys.map(function(k) { return k.name; }).join(', ') + '\n현재 거래: ' + currentCount.toLocaleString() + '건 → 백업: ' + bkCount.toLocaleString() + '건 (' + diffStr + ')\n\n복원 전 현재 데이터는 자동으로 백업됩니다.\n진행하시겠습니까?';
  ldgSafetyShow(msg, function() {
    var ts = Date.now();
    keys.forEach(function(item) {
      var currentRaw = localStorage.getItem(item.dataKey);
      if (currentRaw) {
        localStorage.setItem(item.dataKey + '_pre_restore_' + ts, JSON.stringify({
          timestamp: new Date().toISOString(),
          data: JSON.parse(currentRaw)
        }));
      }
      var backup = JSON.parse(localStorage.getItem(item.backupKey));
      var bData = backup.data !== undefined ? backup.data : backup;
      localStorage.setItem(item.dataKey, JSON.stringify(bData));
    });
    var toast = document.createElement('div');
    toast.className = 'fixed top-20 right-8 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 shadow-lg z-[9999] flex items-center gap-2';
    toast.innerHTML = '<span class="material-symbols-outlined text-emerald-600 text-sm">check_circle</span><span class="text-emerald-700 text-sm font-semibold">복원 완료. 페이지를 새로고침합니다.</span>';
    document.body.appendChild(toast);
    setTimeout(function() { location.reload(); }, 1500);
  }, '복원');
}

// Service Worker 등록 (updateViaCache:'none' → SW 파일 자체는 항상 네트워크에서 가져옴)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/the-atelier/service-worker.js', { updateViaCache: 'none' })
      .then(function(reg) {
        // 활성 SW가 새 SW로 교체되면 자동 리로드 (캐시된 옛 코드 → 최신 코드)
        var refreshing = false;
        navigator.serviceWorker.addEventListener('controllerchange', function() {
          if (refreshing) return;
          refreshing = true;
          console.log('[SW] 새 버전 활성화 → 자동 새로고침');
          window.location.reload();
        });
        // 주기적으로 업데이트 체크 (1시간마다)
        setInterval(function() { reg.update().catch(function(){}); }, 60 * 60 * 1000);
        // 페이지 가시화 시 업데이트 체크 (PWA가 백그라운드에서 복귀)
        document.addEventListener('visibilitychange', function() {
          if (document.visibilityState === 'visible') {
            reg.update().catch(function(){});
          }
        });
      })
      .catch(function(err) { console.error('[SW] 등록 실패:', err); });
  });
}
