// ════════════════════════════════════════════════════════════════════
// 여행 플랜 한 번에 적용 (2026-10-08) — Claude와 짠 일정·예산을 사이트 데이터로 넣는 버튼
//   · 로그인한 본인이 버튼을 눌러야만 실행 (확인 창에 바뀌는 내용 먼저 보여줌)
//   · 도시(trip_cities)는 이 여행 것만 지우고 새로 넣음 — 지운 문서는 trashBeforeDelete로 휴지통 보관
//   · 일정(journey type '일정')은 추가만 함 (기존 일정은 그대로)
//   · 예산(trips.budget)과 여행 날짜를 플랜 값으로 바꿈
// ════════════════════════════════════════════════════════════════════
(function() {
  'use strict';
  var PLANS = [{
    id: 'nordic-2027-v1',
    label: '북유럽 2027 플랜 적용',
    match: function(t) { return t && /덴마크|스웨덴|북유럽/.test(t.name || '') && String(t.start_date || '').slice(0, 4) === '2027'; },
    trip: { start_date: '2027-06-25', end_date: '2027-07-04' },
    cities: [
      ['코펜하겐', '2027-06-25', '2027-06-27', 55.6761, 12.5683],
      ['스톡홀름', '2027-06-27', '2027-06-29', 59.3293, 18.0686],
      ['오슬로',   '2027-06-29', '2027-06-30', 59.9139, 10.7522],
      ['베르겐',   '2027-06-30', '2027-07-01', 60.3913, 5.3221],
      ['울빅',     '2027-07-01', '2027-07-02', 60.5676, 6.9137],
      ['플롬',     '2027-07-02', '2027-07-03', 60.8628, 7.1137],
      ['베르겐',   '2027-07-03', '2027-07-04', 60.3913, 5.3221]
    ],
    // [날짜, 시작, 끝, 제목, 도시, 메모]
    items: [
      ['2027-06-25', '15:00', '16:00', '코펜하겐 도착 · 공항→시내 메트로', '코펜하겐', '메트로 15분'],
      ['2027-06-25', '19:00', '21:00', '뉘하운 산책', '코펜하겐', '백야라 밤 10시 넘어도 밝음 · 스웨덴은 오늘 하지 축제'],
      ['2027-06-26', '10:00', '12:00', 'Designmuseum Danmark', '코펜하겐', ''],
      ['2027-06-26', '12:30', '15:00', 'Torvehallerne 점심 → HAY · Normann · Illums Bolighus', '코펜하겐', ''],
      ['2027-06-26', '15:30', '19:00', '루이지애나 현대미술관', '코펜하겐', '기차 35분 · 바다 앞 조각정원'],
      ['2027-06-27', '09:00', '14:00', '기차 코펜하겐 → 스톡홀름 (SJ)', '스톡홀름', '약 5시간'],
      ['2027-06-27', '15:00', '18:00', '감라스탄(구시가)', '스톡홀름', '하지 연휴 끝나고 문 여는 날'],
      ['2027-06-28', '10:00', '12:30', 'Fotografiska', '스톡홀름', ''],
      ['2027-06-28', '13:00', '16:00', '쇠데르말름 빈티지·디자인숍', '스톡홀름', ''],
      ['2027-06-28', '16:00', '18:30', 'Svenskt Tenn · Moderna Museet', '스톡홀름', ''],
      ['2027-06-29', '09:00', '14:30', '기차 스톡홀름 → 오슬로', '오슬로', '직행 약 5시간 30분'],
      ['2027-06-29', '16:00', '20:00', '오페라하우스 지붕 · 아케르 브뤼게 · 뭉크 미술관', '오슬로', ''],
      ['2027-06-30', '08:25', '15:00', '기차 오슬로 → 베르겐 (베르겐선)', '베르겐', '약 6시간 30분 · 미니프리스 일찍 예약'],
      ['2027-06-30', '15:30', '19:00', '브뤼겐 · 어시장', '베르겐', ''],
      ['2027-07-01', '09:00', '10:00', '렌터카 픽업 (렌트 1일차)', '베르겐', ''],
      ['2027-07-01', '11:00', '13:00', '스타인스달 폭포 · 노르헤임순', '울빅', '폭포 뒤로 걷기'],
      ['2027-07-01', '15:00', '18:00', '하르당에르 다리 → 울빅 과수원 마을', '울빅', ''],
      ['2027-07-02', '10:00', '11:00', '스테가스테인 전망대', '플롬', ''],
      ['2027-07-02', '13:00', '16:00', '나에뢰이 피오르 크루즈 (플롬 왕복)', '플롬', '유네스코 · 하이라이트'],
      ['2027-07-03', '10:00', '13:00', '구드방엔 → 스탈하임 굽잇길 → 보스 → 베르겐', '베르겐', '운전 약 3시간'],
      ['2027-07-03', '15:00', '18:00', '플뢰엔산 케이블카 · 마지막 저녁', '베르겐', ''],
      ['2027-07-04', '09:00', '10:00', '공항에서 렌터카 반납 → 출국', '베르겐', '렌트 4일차']
    ],
    budget: { flight: 1300000, transport: 1130000, accomPerDay: 200000, livingPerDay: 166000 }
  }];

  function current() { try { return getCurrentTrip(); } catch(e) { return null; } }
  function planFor(t) { for (var i = 0; i < PLANS.length; i++) if (PLANS[i].match(t) && t.planApplied !== PLANS[i].id) return PLANS[i]; return null; }

  function renderButton() {
    var head = document.querySelector('#trv-stops .jv-sec-h');
    if (!head) return;
    var old = document.getElementById('jv-plan-apply');
    var p = planFor(current());
    if (!p) { if (old) old.remove(); return; }
    if (old) return;
    var b = document.createElement('button');
    b.type = 'button'; b.id = 'jv-plan-apply'; b.className = 'jv-btn jv-btn-accent';
    b.textContent = p.label;
    b.onclick = function() { apply(p); };
    head.appendChild(b);
  }

  async function apply(p) {
    var t = current();
    if (!t) return;
    var mine = (citiesData || []).filter(function(c) { return c.trip_id === t._id || !c.trip_id; });
    var msg = '[' + t.name + '] 에 플랜을 넣을게요.\n\n' +
      '· 여행 날짜: ' + p.trip.start_date + ' ~ ' + p.trip.end_date + '\n' +
      '· 도시(Route): 지금 ' + mine.length + '곳 → 새 ' + p.cities.length + '곳 (' + p.cities.map(function(c){ return c[0]; }).join(' → ') + ')\n' +
      '   지우는 도시는 휴지통에 보관돼요\n' +
      '· 일정: ' + p.items.length + '개 추가 (기존 일정은 그대로)\n' +
      '· 예산: 항공 130만 · 교통·렌트 113만 · 숙소 1박 20만 · 생활 1일 16.6만\n\n진행할까요?';
    if (!confirm(msg)) return;
    var btn = document.getElementById('jv-plan-apply');
    if (btn) { btn.disabled = true; btn.textContent = '넣는 중…'; }
    try {
      await fbUpdate('trips', t._id, { start_date: p.trip.start_date, end_date: p.trip.end_date });
      for (var i = 0; i < mine.length; i++) { if (mine[i]._id) await fbDelete('trip_cities', mine[i]._id); }
      for (var j = 0; j < p.cities.length; j++) {
        var c = p.cities[j];
        var nights = Math.round((new Date(c[2]) - new Date(c[1])) / 864e5);
        await fbAdd('trip_cities', { trip_id: t._id, name: c[0], start_date: c[1], end_date: c[2], nights: nights, desc: '', transit_guide: '', order: c[1], lat: c[3], lng: c[4] });
      }
      for (var k = 0; k < p.items.length; k++) {
        var it = p.items[k];
        await fbAdd('journey', { trip_id: t._id, type: '일정', date: it[0], time: it[1], end_time: it[2], title: it[3], city: it[4], description: it[5] });
      }
      var days = Math.round((new Date(p.trip.end_date) - new Date(p.trip.start_date)) / 864e5) + 1;
      var nightsAll = days - 1;
      await fbUpdate('trips', t._id, {
        budget: { flight: p.budget.flight, transport: p.budget.transport, accom: p.budget.accomPerDay * nightsAll, tour: 0, tourPerDay: 0,
          living: p.budget.livingPerDay * days, accomPerDay: p.budget.accomPerDay, livingPerDay: p.budget.livingPerDay, days: days, nights: nightsAll },
        planApplied: p.id
      });
      try { localStorage.removeItem('atelier_snapshot_trips'); localStorage.removeItem('atelier_snapshot_trip_cities'); localStorage.removeItem('atelier_snapshot_journey'); } catch(e) {}
      alert('넣었어요! 새로고침할게요.');
      location.reload();
    } catch(err) {
      console.error('[plan-apply]', err);
      alert('중간에 실패했어요: ' + (err && err.message || err) + '\n새로고침 후 Route를 확인해 주세요.');
      if (btn) { btn.disabled = false; btn.textContent = p.label; }
    }
  }

  window.planApplyRefresh = renderButton;
  function boot() {
    var orig = window.renderTripHeader;
    if (typeof orig === 'function' && !orig.__plan) {
      var w = function() { var r = orig.apply(this, arguments); try { renderButton(); } catch(e) {} return r; };
      w.__plan = true; window.renderTripHeader = w;
    }
    renderButton();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
