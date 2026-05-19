// ════════════════════════════════════════════════════════════
// app-5-ledger-export.js
// 가계부 내보내기 (텍스트 클립보드 복사) — v1: PC #page-ledger 전용
//
// 기능:
//  1. 현재 보고 있는 월의 가계부를 텍스트로 변환 → 클립보드 복사
//  2. 마스킹 토글: ON일 때 세부사항/비고의 한글을 첫 글자만 보존, 나머지 ○
//     (영문/숫자/기호는 그대로 노출)
//  3. Clipboard API 실패 시 → fallback 모달 (readonly textarea + 자동 전체 선택)
//
// 의존: 기존 _ledgerData, _ldgYear, _ldgMonth 전역 변수 (app-2-init.js에서 정의)
// 노출: window.ldgExportToClipboard, window.ldgToggleExportMasking,
//       window.ldgCloseExportFallback, window.ldgRetryClipboard
// ════════════════════════════════════════════════════════════

(function () {
  'use strict';

  // ────────────────────────────────────────────────
  // 상태 (localStorage 영속)
  // ────────────────────────────────────────────────
  var MASK_KEY = 'atelier_ledger_export_masked';

  function isMaskingOn() {
    return localStorage.getItem(MASK_KEY) === 'true';
  }

  function setMasking(on) {
    localStorage.setItem(MASK_KEY, on ? 'true' : 'false');
    updateToggleUI();
  }

  // ────────────────────────────────────────────────
  // 마스킹 토글 UI 동기화
  // ────────────────────────────────────────────────
  function updateToggleUI() {
    var icon = document.getElementById('ldg-export-mask-icon');
    var label = document.getElementById('ldg-export-mask-label');
    var btn = document.getElementById('ldg-export-mask-toggle');
    if (!icon || !label || !btn) return;
    var on = isMaskingOn();
    icon.textContent = on ? 'lock' : 'lock_open';
    label.textContent = on ? '마스킹 ON' : '마스킹 OFF';
    // 활성 상태 시각적 강조 (보라계 채움)
    if (on) {
      btn.classList.add('bg-violet-50');
      btn.style.fontWeight = '700';
    } else {
      btn.classList.remove('bg-violet-50');
      btn.style.fontWeight = '';
    }
  }

  // ────────────────────────────────────────────────
  // 마스킹 로직
  // 규칙 (스펙 그대로):
  //   - 한글 첫 글자 보존 + 이후 한글은 ○
  //   - 영문/숫자/기호는 그대로
  //   - 공백을 만나면 다시 "첫 한글" 상태로 리셋 (단어 단위)
  // ────────────────────────────────────────────────
  function maskText(s) {
    if (!s) return s;
    var out = '';
    var firstKoreanInWord = true;
    for (var i = 0; i < s.length; i++) {
      var ch = s[i];
      if (/\s/.test(ch)) {
        // 공백 — 다음 단어를 위해 리셋
        out += ch;
        firstKoreanInWord = true;
      } else if (/[가-힣]/.test(ch)) {
        // 한글 음절
        if (firstKoreanInWord) {
          out += ch;
          firstKoreanInWord = false;
        } else {
          out += '○';
        }
      } else {
        // 영문/숫자/기호 — 그대로
        out += ch;
        // 한글 외 문자가 나오면 그 단어의 "첫 한글" 권리는 소진된 것으로 본다
        // (즉 "iPhone책" 의 책은 ○가 됨. 단어 단위 일관성)
        firstKoreanInWord = false;
      }
    }
    return out;
  }

  // ────────────────────────────────────────────────
  // 부업(works) 진행 현황 — 현재 연재 중인 작품 카운트
  // ────────────────────────────────────────────────
  function countActiveWorks() {
    try {
      var works = JSON.parse(localStorage.getItem('atelier_works') || '[]');
      var today = new Date().toISOString().split('T')[0];
      return works.filter(function (w) {
        return (
          w &&
          w.status === 'confirmed' &&
          w.publish_start &&
          w.publish_end &&
          w.publish_start <= today &&
          w.publish_end >= today
        );
      }).length;
    } catch (e) {
      return 0;
    }
  }

  // ────────────────────────────────────────────────
  // 텍스트 빌드 (이번 달 기준)
  // ────────────────────────────────────────────────
  function fmtKRW(n) {
    return '₩' + Math.abs(n || 0).toLocaleString('ko-KR');
  }

  function buildExportText() {
    var data = window._ledgerData || {};
    var year = window._ldgYear || new Date().getFullYear();
    var month = window._ldgMonth || new Date().getMonth() + 1;
    var key = year + '-' + String(month).padStart(2, '0');
    var txs = (data.transactions || []).filter(function (t) {
      return t && t.date && t.date.substring(0, 7) === key;
    });

    var masked = isMaskingOn();
    var m = masked ? maskText : function (s) { return s || ''; };

    // 1. KPI
    var income = 0,
      expense = 0,
      saving = 0;
    txs.forEach(function (t) {
      var amt = t['금액'] || 0;
      if (t['대분류'] === '수입') income += amt;
      else if (t['대분류'] === '저축') saving += amt;
      else expense += amt;
    });
    var net = income - expense - saving;

    // 2. 카테고리별 지출
    var catSums = {};
    txs.forEach(function (t) {
      if (t['대분류'] === '수입' || t['대분류'] === '저축') return;
      catSums[t['대분류']] = (catSums[t['대분류']] || 0) + (t['금액'] || 0);
    });
    var sortedCats = Object.keys(catSums)
      .map(function (k) { return [k, catSums[k]]; })
      .sort(function (a, b) { return b[1] - a[1]; });

    // 3. 결제수단별 지출
    var pmSums = {};
    txs.forEach(function (t) {
      if (t['대분류'] === '수입' || t['대분류'] === '저축') return;
      var pm = t['결제수단'] || '미분류';
      pmSums[pm] = (pmSums[pm] || 0) + (t['금액'] || 0);
    });
    var sortedPms = Object.keys(pmSums)
      .map(function (k) { return [k, pmSums[k]]; })
      .sort(function (a, b) { return b[1] - a[1]; });

    // 4. 부업 현황
    var activeWorks = countActiveWorks();

    // ─── 빌드 ───
    var lines = [];
    lines.push('📒 가계부 — ' + year + '년 ' + month + '월');
    lines.push('생성: ' + new Date().toLocaleString('ko-KR'));
    if (masked) lines.push('🔒 마스킹 적용 (세부사항/비고 한글 일부 가림)');
    lines.push('');

    // [A] 요약
    lines.push('═══ 📊 요약 ═══');
    lines.push('💰 수입:  ' + fmtKRW(income));
    lines.push('💸 지출:  ' + fmtKRW(expense));
    lines.push('🏦 저축:  ' + fmtKRW(saving));
    lines.push('🟣 순익:  ' + fmtKRW(net) + (net < 0 ? ' (적자)' : ''));
    lines.push('📋 거래 건수: ' + txs.length + '건');
    lines.push('');

    // [B] 카테고리별 지출
    if (sortedCats.length > 0) {
      lines.push('═══ 🏷 카테고리별 지출 ═══');
      sortedCats.forEach(function (kv) {
        var cat = kv[0],
          amt = kv[1];
        var pct = expense > 0 ? ((amt / expense) * 100).toFixed(1) : '0.0';
        lines.push('  • ' + cat + ': ' + fmtKRW(amt) + ' (' + pct + '%)');
      });
      lines.push('');
    }

    // [C] 결제수단별
    if (sortedPms.length > 0) {
      lines.push('═══ 💳 결제수단별 ═══');
      sortedPms.forEach(function (kv) {
        lines.push('  • ' + kv[0] + ': ' + fmtKRW(kv[1]));
      });
      lines.push('');
    }

    // [D] 거래 내역 (날짜 내림차순)
    if (txs.length > 0) {
      lines.push('═══ 📋 거래 내역 (' + txs.length + '건) ═══');
      var sorted = txs.slice().sort(function (a, b) {
        return (b.date || '').localeCompare(a.date || '');
      });
      sorted.forEach(function (t) {
        var isInc = t['대분류'] === '수입';
        var sign = isInc ? '+' : '';
        var date = (t.date || '').substring(5).replace('-', '/');
        var cat = t['소분류'] || t['대분류'] || '';
        var detail = m(t['세부사항'] || '');
        var note = m(t['비고'] || '');
        var pm = t['결제수단'] || '';
        var line = date + ' [' + cat + '] ' + sign + fmtKRW(t['금액'] || 0);
        if (pm) line += ' · ' + pm;
        if (detail) line += ' — ' + detail;
        if (note) line += ' (' + note + ')';
        lines.push(line);
      });
      lines.push('');
    } else {
      lines.push('═══ 📋 거래 내역 ═══');
      lines.push('_이번 달 거래 내역이 없습니다_');
      lines.push('');
    }

    // [E] 부업 (works) — 0이면 이탤릭 안내문
    lines.push('═══ 💼 부업 ═══');
    if (activeWorks > 0) {
      lines.push('현재 연재 중인 작품: ' + activeWorks + '개');
    } else {
      lines.push('_현재 연재 중인 작품 없음 — Money > 부업 탭에서 작품 등록 시 자동 반영_');
    }
    lines.push('');

    // 푸터
    lines.push('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    lines.push('🎨 The Atelier · Daily Ledger Export');

    return lines.join('\n');
  }

  // ────────────────────────────────────────────────
  // 토스트 (showSyncToast 있으면 그것 사용, 없으면 간단 알림)
  // ────────────────────────────────────────────────
  function toast(msg) {
    if (typeof window.showSyncToast === 'function') {
      window.showSyncToast(msg);
    } else {
      // 간단 inline 토스트
      var t = document.createElement('div');
      t.textContent = msg;
      t.style.cssText =
        'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);' +
        'background:#1e293b;color:#fff;padding:12px 20px;border-radius:12px;' +
        'font-size:13px;font-weight:700;z-index:99999;box-shadow:0 8px 24px rgba(0,0,0,0.15);' +
        'animation:slideUp 0.25s ease-out';
      document.body.appendChild(t);
      setTimeout(function () { t.remove(); }, 2500);
    }
  }

  // ────────────────────────────────────────────────
  // Fallback 모달 제어
  // ────────────────────────────────────────────────
  function showFallback(text) {
    var modal = document.getElementById('ldg-export-fallback-modal');
    var ta = document.getElementById('ldg-export-fallback-textarea');
    if (!modal || !ta) {
      // 모달 자체가 없으면 최후의 fallback: prompt (사용자가 직접 복사)
      alert('자동 복사 실패. 아래 텍스트를 직접 복사하세요:\n\n' + text.substring(0, 200) + '...');
      return;
    }
    ta.value = text;
    modal.style.display = 'flex';
    // 자동 전체 선택
    setTimeout(function () {
      ta.focus();
      ta.select();
      try { ta.setSelectionRange(0, ta.value.length); } catch (e) {}
    }, 80);
  }

  function closeFallback() {
    var modal = document.getElementById('ldg-export-fallback-modal');
    if (modal) modal.style.display = 'none';
  }

  // ────────────────────────────────────────────────
  // 메인 액션
  // ────────────────────────────────────────────────
  async function exportToClipboard() {
    // 가계부 페이지가 활성 상태일 때만 동작
    var page = document.getElementById('page-ledger');
    if (!page || page.style.display === 'none') {
      console.warn('[ledger-export] 가계부 페이지가 활성 상태가 아님');
      return;
    }

    var text;
    try {
      text = buildExportText();
    } catch (e) {
      console.error('[ledger-export] 텍스트 빌드 실패:', e);
      toast('⚠️ 내보내기 실패: ' + (e.message || '알 수 없는 오류'));
      return;
    }

    // 1차: Clipboard API 시도
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        var monthLabel = (window._ldgYear || '') + '.' + (window._ldgMonth || '');
        toast('✅ ' + monthLabel + ' 가계부 복사됨' + (isMaskingOn() ? ' (🔒 마스킹)' : ''));
        return;
      }
    } catch (e) {
      console.warn('[ledger-export] Clipboard API 실패 → fallback:', e);
    }

    // 2차: Fallback 모달
    showFallback(text);
  }

  // 모달의 "다시 자동 복사" 재시도
  async function retryClipboard() {
    var ta = document.getElementById('ldg-export-fallback-textarea');
    if (!ta) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(ta.value);
        toast('✅ 클립보드에 복사됨');
        closeFallback();
        return;
      }
    } catch (e) {}
    // 그래도 안 되면 textarea만 다시 선택
    ta.focus();
    ta.select();
    toast('⚠️ 직접 Cmd/Ctrl+C로 복사하세요');
  }

  function toggleMasking() {
    setMasking(!isMaskingOn());
  }

  // ────────────────────────────────────────────────
  // 초기화 (DOM 준비 후 토글 UI 동기화)
  // ────────────────────────────────────────────────
  function init() {
    updateToggleUI();
  }

  // ────────────────────────────────────────────────
  // 전역 노출
  // ────────────────────────────────────────────────
  window.ldgExportToClipboard = exportToClipboard;
  window.ldgToggleExportMasking = toggleMasking;
  window.ldgCloseExportFallback = closeFallback;
  window.ldgRetryClipboard = retryClipboard;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    setTimeout(init, 200); // 다른 스크립트 init 끝난 후
  }
})();
