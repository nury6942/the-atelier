// ═══════════════════════════════════════════════════════════════
// ATELIER: 2026 독일&이탈리아 기존 일정 삭제 스크립트
// ───────────────────────────────────────────────────────────────
// bulk_add_2026_journey.js 로 추가한 신규 일정만 남기고
// 그 이전에 있던 "기존 일정"을 삭제합니다.
//
// 기준: _createdAt 타임스탬프
//   - 최근 1시간 내 추가 = 신규 (유지)
//   - 그 이전 + 타임스탬프 없음 = 기존 (삭제)
//
// 사용법:
//   1. Travel 페이지 활성
//   2. F12 → Console
//   3. 이 파일 내용 붙여넣기 → Enter
//   4. 먼저 미리보기 → 확인 후 삭제
// ═══════════════════════════════════════════════════════════════

(async function cleanupOldJourney() {
  // ── 안전 체크 ──
  if (typeof fbRead !== 'function' || typeof fbDelete !== 'function') {
    alert('❌ Travel 페이지에서 실행해주세요'); return;
  }

  // ── 트립 찾기 (3단계 fallback) ──
  let tripId = null;
  let tripName = '';

  if (typeof currentTripId !== 'undefined' && currentTripId) {
    tripId = currentTripId;
    try {
      const allTrips = await fbRead('trips');
      const t = allTrips.find(x => x._id === currentTripId);
      if (t) tripName = t.name;
    } catch(e) {}
  }

  if (!tripId) {
    try {
      const allTrips = await fbRead('trips');
      const t = allTrips.find(x => (x.name||'').includes('독일') && (x.name||'').includes('이탈리아'));
      if (t) { tripId = t._id; tripName = t.name; }
    } catch(e) {}
  }

  if (!tripId) {
    alert('❌ 트립을 찾을 수 없습니다');
    return;
  }
  console.log('🎒 Trip:', tripName, '|', tripId);

  // ── 일정 가져오기 ──
  const all = await fbRead('journey');
  const items = all.filter(j => j.trip_id === tripId && j.type === '일정');
  console.log(`📅 전체 일정: ${items.length}개`);

  // ── 컷오프 시간: 기본 90분 전 (=새 스크립트는 90분 안에 끝났을 것) ──
  let cutoffMin = 90;
  const userCutoff = prompt(
    '몇 분 전 이후 추가된 일정을 "신규"로 간주할까요?\n' +
    '(이 시간보다 오래된 일정은 모두 삭제됨)\n\n' +
    '기본: 90분 (방금 추가한 70개를 유지)\n' +
    '취소하면 종료',
    '90'
  );
  if (userCutoff === null) { console.log('취소됨'); return; }
  cutoffMin = parseInt(userCutoff, 10) || 90;

  const cutoffMs = Date.now() - (cutoffMin * 60 * 1000);

  // ── 분류 ──
  const newOnes = [];
  const oldOnes = [];
  const noTs = [];

  items.forEach(j => {
    const ts = j._createdAt;
    let timeMs = 0;
    if (ts) {
      if (typeof ts.seconds === 'number') timeMs = ts.seconds * 1000;
      else if (typeof ts._seconds === 'number') timeMs = ts._seconds * 1000;
      else if (ts.toDate) timeMs = ts.toDate().getTime();
      else if (typeof ts === 'string') timeMs = new Date(ts).getTime();
    }
    if (!timeMs) noTs.push(j);
    else if (timeMs >= cutoffMs) newOnes.push(j);
    else oldOnes.push(j);
  });

  console.log(`\n📊 분류 결과:`);
  console.log(`  ✅ 신규 (${cutoffMin}분 내): ${newOnes.length}개 — 유지`);
  console.log(`  🗑️ 기존 (${cutoffMin}분 전): ${oldOnes.length}개 — 삭제 예정`);
  console.log(`  ⚠️ 타임스탬프 없음: ${noTs.length}개 — 삭제 예정`);

  const toDelete = [...oldOnes, ...noTs];

  if (toDelete.length === 0) {
    alert('🎉 삭제할 기존 일정이 없습니다.');
    return;
  }

  // ── 삭제 예정 미리보기 (콘솔) ──
  console.log('\n🗑️ 삭제 예정 일정 (확장하여 확인):');
  console.table(toDelete.map(j => ({
    date: j.date,
    time: j.time || '',
    city: (j.city||'').slice(0, 20),
    title: (j.title||'').slice(0, 40)
  })));

  // ── 확인 ──
  const ok = confirm(
    `기존 일정 ${toDelete.length}개를 삭제합니다.\n\n` +
    `  유지: ${newOnes.length}개 (방금 추가한 신규)\n` +
    `  삭제: ${toDelete.length}개 (기존 + 타임스탬프 없음)\n\n` +
    `⚠️ 되돌릴 수 없습니다 (단, atelier_trash에 백업됨)\n\n` +
    `계속할까요?`
  );
  if (!ok) { console.log('취소됨'); return; }

  // ── 삭제 실행 ──
  let okCount = 0, failCount = 0;
  for (const j of toDelete) {
    try {
      await fbDelete('journey', j._id);
      if (typeof journeyData !== 'undefined') {
        const idx = journeyData.findIndex(x => x._id === j._id);
        if (idx >= 0) journeyData.splice(idx, 1);
      }
      okCount++;
    } catch(e) {
      console.error('❌ 삭제 실패:', j._id, j.title, e);
      failCount++;
    }
  }

  // ── UI 갱신 ──
  if (typeof renderDayView === 'function') renderDayView();
  if (typeof renderWeekView === 'function') renderWeekView();
  if (typeof renderCityCards === 'function') renderCityCards();

  console.log(`\n✅ 완료! 삭제: ${okCount}, 실패: ${failCount}`);
  alert(`✅ ${okCount}개 삭제 완료!\n실패: ${failCount}\n\n새로고침해서 확인하세요.\n(복구 필요 시 atelier_trash 컬렉션에서 가능)`);
})();
