// ═══════════════════════════════════════════════════════════════
// ATELIER: 2027 북유럽 — ICN→CPH / ICN→ARN 을 다구간 1개로 통합
// ───────────────────────────────────────────────────────────────
// 지금은 두 개의 별도 관심 노선으로 들어가 있는데, 실제로는 한 여행이다.
//   들어갈 때  ICN → CPH (코펜하겐 인)
//   나올 때    ARN → ICN (스톡홀름 아웃)
// → legs 를 가진 다구간 노선 1개로 합치고, 남은 하나는 지운다.
//   (가격 기록이 붙어 있으면 통합 노선으로 옮긴 뒤 지운다)
//
// 사용: Travel → Flight 페이지 → F12 → Console → 붙여넣기 → Enter
// ═══════════════════════════════════════════════════════════════

(async function mergeScandinaviaMulticity() {
  if (typeof fbRead !== 'function' || typeof fbUpdate !== 'function' || typeof fbDelete !== 'function') {
    alert('❌ Travel 페이지에서 실행해주세요'); return;
  }

  const all = await fbRead('flight_watch');
  const cph = all.find(d => d && d.type === 'watch' && d.route_from === 'ICN' && d.route_to === 'CPH');
  const arn = all.find(d => d && d.type === 'watch' && d.route_from === 'ICN' && d.route_to === 'ARN');

  if (!cph && !arn) { alert('❌ ICN→CPH / ICN→ARN 노선을 찾지 못했어요'); return; }
  if (!cph || !arn) {
    alert('⚠️ 두 노선 중 하나만 있어요.\n' + (cph ? 'ICN→ARN' : 'ICN→CPH') + ' 이(가) 없어 통합을 건너뜁니다.');
    return;
  }

  // 통합 대상: CPH 노선을 살리고 ARN 노선을 흡수한다
  const keep = cph, drop = arn;
  const months = Array.from(new Set([].concat(keep.target_months || [], drop.target_months || []))).sort();

  if (!confirm(
    '다구간으로 통합할까요?\n\n' +
    '  ICN → CPH  …  ARN → ICN\n\n' +
    '· 자동 수집 달: ' + (months.join(', ') || '없음') + '\n' +
    '· ICN→ARN 노선은 삭제되고, 그 가격 기록은 통합 노선으로 옮겨집니다.'
  )) { console.log('취소됨'); return; }

  // 1) 살릴 노선을 다구간으로 변경
  const legs = [
    { from: 'ICN', to: 'CPH', date: keep.depart_date || '' },
    { from: 'ARN', to: 'ICN', date: drop.return_date || drop.depart_date || '' }
  ];
  await fbUpdate('flight_watch', keep._id, {
    legs: legs,
    trip_type: 'multi',
    route_to: 'CPH',                 // 대표 도착지(기존 로직 호환)
    target_months: months,
    memo: (keep.memo || '2027 북유럽') + ' · 다구간 (CPH 인 / ARN 아웃)'
  });
  console.log('✅ 다구간 전환:', keep._id, legs);

  // 2) 삭제될 노선의 가격 기록 이관
  const moved = all.filter(d => d && d.type === 'flight_price' && d.watch_id === drop._id);
  for (const p of moved) {
    try { await fbUpdate('flight_watch', p._id, { watch_id: keep._id }); } catch (e) { console.warn('이관 실패', p._id, e); }
  }
  console.log('↔️ 가격 기록 이관:', moved.length + '건');

  // 3) 노선 삭제
  await fbDelete('flight_watch', drop._id);
  console.log('🗑️ ICN→ARN 노선 삭제:', drop._id);

  // 4) 새로고침
  try {
    if (typeof _fltLoad === 'function') await _fltLoad();
    else if (typeof loadFlightWatch === 'function') await loadFlightWatch();
  } catch (e) {}
  try { if (typeof _fltRenderWatch === 'function') _fltRenderWatch(); } catch (e) {}

  alert('✅ 다구간 통합 완료!\n\nICN → CPH … ARN → ICN\n\n화면이 안 바뀌면 새로고침(Cmd+Shift+R) 해주세요.');
})();
