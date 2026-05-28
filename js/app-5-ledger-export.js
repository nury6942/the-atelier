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

  // ────────────────────────────────────────────────
  // 유틸 helper (4종)
  // ────────────────────────────────────────────────

  // "지출 판별" — _ledgerData.categories의 수입/저축 외 모든 대분류는 지출로 본다
  function _isExpense(t) {
    return t && t['대분류'] !== '수입' && t['대분류'] !== '저축';
  }

  // 최근 N개월 YYYY-MM 키 배열 (오름차순). baseDate 없으면 오늘 기준
  function _recentMonths(n, baseDate) {
    var d = baseDate ? new Date(baseDate) : new Date();
    var arr = [];
    for (var i = n - 1; i >= 0; i--) {
      var t = new Date(d.getFullYear(), d.getMonth() - i, 1);
      var y = t.getFullYear();
      var mm = String(t.getMonth() + 1).padStart(2, '0');
      arr.push(y + '-' + mm);
    }
    return arr;
  }

  // atelier_series_{year} localStorage 안전 파싱 (실패 시 [])
  // syncAllFromCloud()가 로그인 시 자동 hydration → Firebase 폴백 불필요
  function _readSeriesData(year) {
    try {
      var raw = localStorage.getItem('atelier_series_' + year);
      if (!raw) return [];
      var parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  // 시리즈 색상 → 이모지 점 (실제 사용 9색)
  function _seriesColorEmoji(color) {
    switch (color) {
      case 'amber':
      case 'orange':   return '🟠';
      case 'indigo':
      case 'purple':
      case 'fuchsia':  return '🟣';
      case 'teal':
      case 'cyan':     return '🟢';
      case 'rose':     return '🔴';
      case 'blue':     return '🔵';
      default:         return '⚪';
    }
  }

  // 'YYYY-MM-DD HH:MM (KST)' 포맷
  function _fmtDateTime(d) {
    d = d || new Date();
    var y = d.getFullYear();
    var mo = String(d.getMonth() + 1).padStart(2, '0');
    var da = String(d.getDate()).padStart(2, '0');
    var h = String(d.getHours()).padStart(2, '0');
    var mi = String(d.getMinutes()).padStart(2, '0');
    return y + '-' + mo + '-' + da + ' ' + h + ':' + mi + ' (KST)';
  }

  // 마스킹 ON일 때만 maskText 적용
  function _maskIfNeeded(s) {
    return isMaskingOn() ? maskText(s || '') : (s || '');
  }

  // 마크다운 표 셀 안전 처리 (| escape)
  function _esc(s) {
    return String(s == null ? '' : s).replace(/\|/g, '\\|');
  }

  // ────────────────────────────────────────────────
  // 섹션 빌더 9종
  // ────────────────────────────────────────────────

  // [A] 헤더
  function _buildSectionA_Header() {
    var year = window._ldgYear || new Date().getFullYear();
    var month = window._ldgMonth || (new Date().getMonth() + 1);
    var recent12 = _recentMonths(12);
    var first = recent12[0];
    var last = recent12[recent12.length - 1];
    var lines = [];
    lines.push('# 📒 가계부 스냅샷');
    lines.push('');
    lines.push('- 생성일시: ' + _fmtDateTime(new Date()));
    lines.push('- 기준월: ' + year + '년 ' + month + '월');
    lines.push('- 데이터 범위: 최근 12개월 집계 (' + first + ' ~ ' + last + ') + 최근 60일 raw 거래');
    lines.push('- ℹ️ 자산 시트는 이번 버전에서 제외 (데이터 정비 중)');
    if (isMaskingOn()) {
      lines.push('- 🔒 마스킹 적용 (세부사항/비고 한글 일부 가림)');
    }
    return lines.join('\n');
  }

  // [B] 카테고리 트리
  function _buildSectionB_CategoryTree() {
    var data = window._ledgerData || {};
    var cats = data.categories || {};
    var keys = Object.keys(cats);
    var lines = [];
    lines.push('## 🏷️ 카테고리 트리');
    lines.push('');
    if (keys.length === 0) {
      lines.push('⚠️ 카테고리 미입력');
      return lines.join('\n');
    }
    keys.forEach(function (k) {
      lines.push('### ' + k);
      var subs = cats[k];
      if (!Array.isArray(subs) || subs.length === 0) {
        lines.push('_(소분류 미입력)_');
      } else {
        subs.forEach(function (s) { lines.push('- ' + s); });
      }
      lines.push('');
    });
    // 마지막 공백줄 제거
    while (lines.length && lines[lines.length - 1] === '') lines.pop();
    return lines.join('\n');
  }

  // [C] 월별 수입/지출/저축 추이 (12개월)
  function _buildSectionC_MonthlyTrend() {
    var data = window._ledgerData || {};
    var txs = data.transactions || [];
    var months = _recentMonths(12);
    var stats = {};
    months.forEach(function (m) { stats[m] = { inc: 0, exp: 0, sav: 0 }; });
    txs.forEach(function (t) {
      if (!t || !t.date) return;
      var k = t.date.substring(0, 7);
      if (!stats[k]) return;
      var amt = t['금액'] || 0;
      if (t['대분류'] === '수입') stats[k].inc += amt;
      else if (t['대분류'] === '저축') stats[k].sav += amt;
      else stats[k].exp += amt;  // 수입/저축 외 = 지출
    });
    var lines = [];
    lines.push('## 📈 월별 수입/지출/저축 추이 (12개월)');
    lines.push('');
    lines.push('| 월 | 수입 | 지출 | 저축 | 잔여 |');
    lines.push('|---|---:|---:|---:|---:|');
    months.forEach(function (m) {
      var s = stats[m];
      var net = s.inc - s.exp - s.sav;
      lines.push('| ' + m + ' | ' + fmtKRW(s.inc) + ' | ' + fmtKRW(s.exp) +
                 ' | ' + fmtKRW(s.sav) + ' | ' + fmtKRW(net) + ' |');
    });
    lines.push('');
    lines.push('💡 부업 수익이 가계부 수입에 일부 포함됐을 수 있음. 정확한 부업 시계열은 F섹션 참조.');
    return lines.join('\n');
  }

  // [D] 카테고리별 지출 추이 (6개월, 소분류 기준)
  function _buildSectionD_CategoryExpenseTrend() {
    var data = window._ledgerData || {};
    var txs = data.transactions || [];
    var months = _recentMonths(6);
    var bySub = {};
    txs.forEach(function (t) {
      if (!t || !t.date) return;
      if (!_isExpense(t)) return;
      var k = t.date.substring(0, 7);
      if (months.indexOf(k) < 0) return;
      var sub = t['소분류'] || '(미분류)';
      if (!bySub[sub]) bySub[sub] = {};
      bySub[sub][k] = (bySub[sub][k] || 0) + (t['금액'] || 0);
    });
    var rows = [];
    Object.keys(bySub).forEach(function (sub) {
      var total = 0;
      months.forEach(function (m) { total += (bySub[sub][m] || 0); });
      if (total === 0) return;
      rows.push({ sub: sub, monthData: bySub[sub], total: total });
    });
    rows.sort(function (a, b) { return b.total - a.total; });
    // 15개 초과 → 상위 14 + "기타"
    if (rows.length > 15) {
      var top14 = rows.slice(0, 14);
      var rest = rows.slice(14);
      var otherMonthData = {};
      var otherTotal = 0;
      months.forEach(function (m) { otherMonthData[m] = 0; });
      rest.forEach(function (r) {
        months.forEach(function (m) { otherMonthData[m] += (r.monthData[m] || 0); });
        otherTotal += r.total;
      });
      top14.push({ sub: '기타', monthData: otherMonthData, total: otherTotal });
      rows = top14;
    }
    var lines = [];
    lines.push('## 📊 카테고리별 지출 추이 (6개월, 소분류 기준)');
    lines.push('');
    if (rows.length === 0) {
      lines.push('_(최근 6개월 지출 데이터 없음)_');
      return lines.join('\n');
    }
    lines.push('| 소분류 | ' + months.join(' | ') + ' | 6개월 누적 |');
    var sep = '|---' + months.map(function () { return '|---:'; }).join('') + '|---:|';
    lines.push(sep);
    rows.forEach(function (r) {
      var row = '| ' + _esc(r.sub) + ' | ';
      row += months.map(function (m) {
        return r.monthData[m] ? fmtKRW(r.monthData[m]) : '—';
      }).join(' | ');
      row += ' | ' + fmtKRW(r.total) + ' |';
      lines.push(row);
    });
    return lines.join('\n');
  }

  // [E] 고정비 vs 변동비 (12개월, 지출만) + 활성 고정내역 (전체)
  function _buildSectionE_FixedVsVariable() {
    var data = window._ledgerData || {};
    var txs = data.transactions || [];
    var recurring = data.recurring || [];
    var months = _recentMonths(12);
    var stats = {};
    months.forEach(function (m) { stats[m] = { fixed: 0, variable: 0 }; });
    txs.forEach(function (t) {
      if (!t || !t.date) return;
      if (!_isExpense(t)) return;  // 합계는 지출만
      var k = t.date.substring(0, 7);
      if (!stats[k]) return;
      var isFixed = !!t.recurringId || t['비고'] === '자동(고정)';  // OR 안전망
      if (isFixed) stats[k].fixed += (t['금액'] || 0);
      else stats[k].variable += (t['금액'] || 0);
    });
    var lines = [];
    lines.push('## 💰 고정비 vs 변동비 (12개월, 지출만)');
    lines.push('');
    lines.push('| 월 | 고정비 | 변동비 | 합계 |');
    lines.push('|---|---:|---:|---:|');
    var sumF = 0, sumV = 0;
    months.forEach(function (m) {
      var s = stats[m];
      sumF += s.fixed;
      sumV += s.variable;
      lines.push('| ' + m + ' | ' + fmtKRW(s.fixed) + ' | ' + fmtKRW(s.variable) +
                 ' | ' + fmtKRW(s.fixed + s.variable) + ' |');
    });
    var avgF = Math.round(sumF / months.length);
    var avgV = Math.round(sumV / months.length);
    lines.push('| **산술평균** | **' + fmtKRW(avgF) + '** | **' + fmtKRW(avgV) +
               '** | **' + fmtKRW(avgF + avgV) + '** |');
    lines.push('');
    lines.push('### 활성 고정내역 (수입/지출/저축 전체 자동 흐름)');
    lines.push('');
    if (!Array.isArray(recurring) || recurring.length === 0) {
      lines.push('_(등록된 고정내역 없음 — 모든 지출이 변동비로 집계됩니다.)_');
      return lines.join('\n');
    }
    lines.push('| 대분류 | 소분류 | 매월 일자 | 금액 | 결제수단 |');
    lines.push('|---|---|---:|---:|---|');
    recurring.forEach(function (r) {
      var amtVal = Number(r['금액']);
      var amt = (!amtVal || amtVal === 0) ? '_(변동)_' : fmtKRW(amtVal);
      var day = r.dayOfMonth ? r.dayOfMonth + '일' : '—';
      lines.push('| ' + _esc(r['대분류']) + ' | ' + _esc(r['소분류']) +
                 ' | ' + day + ' | ' + amt + ' | ' + _esc(r['결제수단']) + ' |');
    });
    return lines.join('\n');
  }

  // [F] 부업 시리즈 시계열 (12개월, atelier_series_{year} 직접 읽기)
  function _buildSectionF_SideIncome() {
    var months = _recentMonths(12);
    // 연도 추출 (두 연도 걸칠 수 있음)
    var yearSet = {};
    months.forEach(function (m) { yearSet[m.substring(0, 4)] = true; });
    var years = Object.keys(yearSet);
    // 시리즈 병합 (이름 기준)
    var merged = {};  // {name: {color, monthly: {YYYY-MM: {eps, rev, target}}}}
    years.forEach(function (y) {
      var arr = _readSeriesData(parseInt(y, 10));
      arr.forEach(function (s) {
        if (!s || !s.name) return;
        if (!merged[s.name]) {
          merged[s.name] = { name: s.name, color: s.color, monthly: {} };
        }
        var mObj = s.monthly || {};
        Object.keys(mObj).forEach(function (mk) {
          var monthIdx = parseInt(mk, 10);
          if (isNaN(monthIdx) || monthIdx < 0 || monthIdx > 11) return;
          var ymKey = y + '-' + String(monthIdx + 1).padStart(2, '0');
          merged[s.name].monthly[ymKey] = mObj[mk];
        });
      });
    });
    // 12개월 누적 0 제외
    var active = [];
    Object.keys(merged).forEach(function (name) {
      var s = merged[name];
      var sum = 0;
      months.forEach(function (m) {
        var d = s.monthly[m];
        if (d) sum += (d.rev || 0);
      });
      if (sum > 0) active.push(s);
    });
    var lines = [];
    lines.push('## 🎨 부업 시리즈 시계열 (12개월)');
    lines.push('');
    if (active.length === 0) {
      lines.push('_(기록된 부업 시리즈 없음.)_');
      return lines.join('\n');
    }
    // target 데이터 있는지
    var hasTarget = active.some(function (s) {
      return months.some(function (m) {
        var d = s.monthly[m];
        return d && d.target;
      });
    });
    // 헤더
    var header = '| 월 | ' + active.map(function (s) {
      return _seriesColorEmoji(s.color) + ' ' + _esc(s.name);
    }).join(' | ') + ' | 합계';
    if (hasTarget) header += ' | 목표';
    header += ' |';
    lines.push(header);
    var sep = '|---|' + active.map(function () { return '---|'; }).join('') + '---:|';
    if (hasTarget) sep += '---:|';
    lines.push(sep);
    // 데이터 행
    months.forEach(function (m) {
      var monthRevTotal = 0;
      var monthTargetTotal = 0;
      var cells = active.map(function (s) {
        var d = s.monthly[m];
        if (!d || (!d.rev && !d.eps)) return '—';
        monthRevTotal += (d.rev || 0);
        monthTargetTotal += (d.target || 0);
        var eps = d.eps || '';
        var rev = d.rev ? fmtKRW(d.rev) : '—';
        return _esc((eps ? eps + ' / ' : '') + rev);
      });
      var row = '| ' + m + ' | ' + cells.join(' | ') +
                ' | ' + (monthRevTotal ? fmtKRW(monthRevTotal) : '—');
      if (hasTarget) row += ' | ' + (monthTargetTotal ? fmtKRW(monthTargetTotal) : '—');
      row += ' |';
      lines.push(row);
    });
    return lines.join('\n');
  }

  // [G] 최근 60일 raw 거래 (300건 초과 시 30일 fallback)
  function _buildSectionG_RecentRawTx() {
    var data = window._ledgerData || {};
    var txs = data.transactions || [];
    var now = new Date();
    function ymd(d) {
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') +
             '-' + String(d.getDate()).padStart(2, '0');
    }
    var todayStr = ymd(now);
    var cutoff60Str = ymd(new Date(now.getTime() - 60 * 86400000));
    var cutoff30Str = ymd(new Date(now.getTime() - 30 * 86400000));
    // "최근 60일" = 오늘 - 60일 ~ 오늘 (미래 자동거래 제외)
    var range60 = txs.filter(function (t) {
      return t && t.date && t.date >= cutoff60Str && t.date <= todayStr;
    });
    var useRange30 = range60.length > 300;
    var range = useRange30 ? txs.filter(function (t) {
      return t && t.date && t.date >= cutoff30Str && t.date <= todayStr;
    }) : range60;
    range = range.slice().sort(function (a, b) {
      return (b.date || '').localeCompare(a.date || '');
    });
    var lines = [];
    lines.push('## 📋 최근 ' + (useRange30 ? '30' : '60') + '일 raw 거래');
    lines.push('');
    if (useRange30) {
      lines.push('> ⚠️ 거래량이 많아 60일 → 30일로 자동 축소되었습니다 (총 ' + range.length + '건).');
      lines.push('');
    }
    if (range.length === 0) {
      lines.push('_(해당 기간 거래 없음)_');
      return lines.join('\n');
    }
    lines.push('| 날짜 | 대분류 | 소분류 | 금액 | 결제수단 | 세부사항 | 비고 |');
    lines.push('|---|---|---|---:|---|---|---|');
    range.forEach(function (t) {
      var date = t.date || '';
      var cat = t['대분류'] || '';
      var sub = t['소분류'] || '';
      var amt = fmtKRW(t['금액'] || 0);
      var pm = t['결제수단'] || '';
      var detail = _maskIfNeeded(t['세부사항']);
      var note = t['비고'] || '';
      var isAuto = !!t.recurringId || note === '자동(고정)';
      var noteOut = isAuto ? '🔁 자동(고정)' : _maskIfNeeded(note);
      lines.push('| ' + date + ' | ' + _esc(cat) + ' | ' + _esc(sub) + ' | ' + amt +
                 ' | ' + _esc(pm) + ' | ' + _esc(detail) + ' | ' + _esc(noteOut) + ' |');
    });
    return lines.join('\n');
  }

  // [H] 자동 감지 특이사항 (60일)
  function _buildSectionH_Anomalies() {
    var data = window._ledgerData || {};
    var txs = data.transactions || [];
    var now = new Date();
    function ymd(d) {
      return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') +
             '-' + String(d.getDate()).padStart(2, '0');
    }
    var todayStr = ymd(now);
    var cutoff60Str = ymd(new Date(now.getTime() - 60 * 86400000));
    // 60일 지출, 자동(고정) 제외, 미래 거래 제외
    var pool = txs.filter(function (t) {
      if (!t || !t.date) return false;
      if (t.date < cutoff60Str || t.date > todayStr) return false;
      if (!_isExpense(t)) return false;
      if (t.recurringId || t['비고'] === '자동(고정)') return false;
      return true;
    });
    // 소분류별 통계
    var subStats = {};
    pool.forEach(function (t) {
      var sub = t['소분류'] || '(미분류)';
      if (!subStats[sub]) subStats[sub] = { count: 0, total: 0 };
      subStats[sub].count++;
      subStats[sub].total += (t['금액'] || 0);
    });
    // 룰 적용
    var anomalies = [];
    var seen = {};
    pool.forEach(function (t) {
      var amt = t['금액'] || 0;
      var reasons = [];
      if (amt >= 500000) reasons.push('단일 거래 50만원 이상');
      var sub = t['소분류'] || '(미분류)';
      var s = subStats[sub];
      if (s && s.count > 2) {  // 거래 ≤ 2건이면 평균 신뢰도 낮음 → 룰2 제외
        var avg = s.total / s.count;
        if (avg > 0 && amt >= avg * 2) {
          reasons.push('소분류 평균의 ' + (amt / avg).toFixed(1) + '배');
        }
      }
      if (reasons.length === 0) return;
      var key = t.id || (t.date + '|' + amt + '|' + sub);
      if (seen[key]) return;
      seen[key] = true;
      anomalies.push({ tx: t, amt: amt, reasons: reasons });
    });
    // 금액 큰 순, 최대 10
    anomalies.sort(function (a, b) { return b.amt - a.amt; });
    anomalies = anomalies.slice(0, 10);
    var lines = [];
    lines.push('## ⚠️ 자동 감지 특이사항 (60일)');
    lines.push('');
    if (anomalies.length === 0) {
      lines.push('_(최근 60일 특이 거래 없음 — 안정된 패턴.)_');
      return lines.join('\n');
    }
    anomalies.forEach(function (a, idx) {
      var t = a.tx;
      var date = t.date || '';
      var cat = t['대분류'] || '';
      var sub = t['소분류'] || '';
      var amt = fmtKRW(a.amt);
      var pm = t['결제수단'] || '';
      var detail = _maskIfNeeded(t['세부사항']);
      var line = (idx + 1) + '. ' + date + ' | ' + cat + ' | ' + sub +
                 ' | ' + amt + ' | ' + pm;
      if (detail) line += ' — ' + detail;
      line += ' (' + a.reasons.join('; ') + ')';
      lines.push(line);
    });
    return lines.join('\n');
  }

  // 푸터
  function _buildSectionFooter() {
    var lines = [];
    lines.push('---');
    lines.push('_위 데이터는 The Atelier 가계부에서 추출한 분석용 스냅샷입니다.');
    lines.push('자산 분석은 이번 버전에서 제외되어 있고(별도 정비 중), 부업 수익은 가계부 거래가 아닌');
    lines.push('시리즈 매트릭스 원본에서 직접 가져왔습니다. 재무 전략·투자·부업 방향 상담 시 참고해주세요._');
    return lines.join('\n');
  }

  // ────────────────────────────────────────────────
  // 메인 빌더 (9개 섹션 조립)
  // ────────────────────────────────────────────────
  function buildExportText() {
    var sections = [
      _buildSectionA_Header(),
      _buildSectionB_CategoryTree(),
      _buildSectionC_MonthlyTrend(),
      _buildSectionD_CategoryExpenseTrend(),
      _buildSectionE_FixedVsVariable(),
      _buildSectionF_SideIncome(),
      _buildSectionG_RecentRawTx(),
      _buildSectionH_Anomalies(),
      _buildSectionFooter()
    ];
    return sections.filter(Boolean).join('\n\n');
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
        'background:#1e293b;color:#fff;padding: var(--space-3) var(--space-5);border-radius:12px;' +
        'font-size: var(--font-size-body-sm);font-weight:700;z-index:99999;box-shadow:0 8px 24px rgba(0,0,0,0.15);' +
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
