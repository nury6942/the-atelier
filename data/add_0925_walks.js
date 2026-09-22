// ═══════════════════════════════════════════════════════════════
// 9/25 오르비에토 · 카스틸리오네 도르차 — 마을 구경 항목 추가
// ───────────────────────────────────────────────────────────────
// 이 날은 "두오모 → 점심 → 출발" 뿐이라 동네를 볼 시간이 안 잡혀 있었다.
// 누리는 밥보다 명소·거리·전망을 훨씬 좋아하므로 그쪽으로 채운다.
//
// 시간 근거: Ermione 체크인 마감 19:00, 오르비에토→카스틸리오네 85km·1H20.
//            16:20 출발 → 17:40 도착이면 마감까지 1시간 20분 여유.
//
// 사용: Travel 페이지 → F12 → Console → 붙여넣기 → Enter
// ═══════════════════════════════════════════════════════════════
window.atelierWalks = (function () {
  const BK = 'atelier_walks_backup';
  const D = '2026-09-25';

  // 기존 항목 시각 조정 — 제목 키워드로 찾는다
  const SHIFT = [
    { key: /두오모|브리치오/,     time: '12:15', end_time: '13:30',
      title: '⛪ 오르비에토 두오모 — 산 브리치오 예배당', name_en: 'Duomo di Orvieto' },
    { key: /오르비에토 점심|점심/, time: '15:20', end_time: '16:20' },
    { key: /Ermione|체크인/i,     time: '17:40', end_time: '18:10' },
    { key: /마을 저녁|저녁/,       time: '20:00', end_time: '21:15' }
  ];

  const NEW = [
    { time: '13:30', end_time: '14:00',
      title: '🌀 산 파트리치오 우물',
      name_en: 'Pozzo di San Patrizio',
      city: 'Orvieto', lat: 42.7186, lng: 12.1197,
      description: '62m 깊이 이중 나선 계단. 내려가는 길과 올라오는 길이 안 겹치게 설계돼 있어.\n248계단 내려갔다 248계단 올라오는 거라 다리 좀 쓴다. 창 70개로 빛이 들어와.\n두오모에서 도보 10분 (Piazza Cahen 쪽).' },

    { time: '14:00', end_time: '14:50',
      title: '🛍️ Corso Cavour · 피아차 델라 레푸블리카',
      name_en: 'Corso Cavour Orvieto',
      city: 'Orvieto', lat: 42.7160, lng: 12.1110,
      description: '오르비에토 메인 거리. 상점·카페가 여기 다 모여 있어.\n끝까지 걸으면 피아차 델라 레푸블리카 — 구시가 중심 광장.\n중간에 12각형 종탑이 특이한 산탄드레아 성당이 있어.' },

    { time: '14:50', end_time: '15:20',
      title: '🗼 토레 델 모로 (시계탑 전망)',
      name_en: 'Torre del Moro Orvieto',
      city: 'Orvieto', lat: 42.7166, lng: 12.1113,
      description: '250계단, €3.60. 올라가면 360도로 구시가 지붕과 움브리아 들판이 다 보여.\nCorso Cavour 한복판이라 걷다가 바로 들어가면 돼.' },

    { time: '18:10', end_time: '19:10',
      title: '🏯 로카 디 텐텐나노 (전망탑)',
      name_en: 'Rocca di Tentennano',
      city: "Rocca d'Orcia, 시에나 이탈리아", lat: 43.0125, lng: 11.6086,
      description: '⭐ 숙소에서 차로 5분. 이 일대에서 전망이 제일 좋은 탑이야.\n발 도르차가 통째로 내려다보여. 오늘 일몰이 19:05이라 딱 그 시간에 여기 있게 잡았어.\n탑 아래 로카 도르차 마을도 5분이면 한 바퀴.' },

    { time: '19:20', end_time: '19:50',
      title: '🏰 로카 알도브란데스카 · 피아차 베키에타',
      name_en: "Castiglione d'Orcia Piazza Vecchietta",
      city: "Castiglione d'Orcia, 시에나 이탈리아", lat: 43.0048, lng: 11.6157,
      description: '숙소에서 도보. 성채 폐허(로카 알도브란데스카)와 삼각형 광장(피아차 베키에타 · 17세기 우물).\n어두워진 뒤 마을 골목 걷기. 저녁 먹는 식당들이 이 광장 둘레에 있어.' }
  ];

  function dayItems() {
    return (journeyData || []).filter(j => j.date === D && (!j.type || j.type === '일정'));
  }

  function preview() {
    if (typeof journeyData === 'undefined') { console.error('❌ Travel 페이지에서 실행해줘'); return; }
    const items = dayItems();
    if (!items.length) { console.error('❌ 9/25 일정을 못 찾았어'); return; }

    console.log('%c[9/25 마을 구경 추가] 미리보기', 'font-weight:bold;font-size:14px');
    console.log('\n■ 지금 (' + items.length + '건)');
    console.table(items.slice().sort((a,b)=>(a.time||'').localeCompare(b.time||''))
      .map(j => ({ 시각: (j.time||'—') + '~' + (j.end_time||'—'), 항목: String(j.title||'').slice(0,34) })));

    const hits = SHIFT.map(s => ({ s, j: items.find(x => s.key.test(String(x.title||''))) }));
    console.log('\n■ 시각 조정 ' + hits.filter(h=>h.j).length + '건');
    hits.forEach(h => {
      if (!h.j) { console.warn('   ⚠️ 못 찾음: ' + h.s.key); return; }
      console.log('   ' + String(h.j.title).slice(0,28) + ' : ' +
        (h.j.time||'—') + '~' + (h.j.end_time||'—') + '  →  ' + h.s.time + '~' + h.s.end_time);
    });

    console.log('\n■ 신규 ' + NEW.length + '건');
    console.table(NEW.map(n => ({ 시각: n.time + '~' + n.end_time, 항목: n.title, 원문: n.name_en })));

    console.log('%c\n결과 타임라인', 'font-weight:bold');
    const merged = items.map(j => {
      const h = hits.find(x => x.j === j);
      return { t: h ? h.s.time : (j.time||''), e: h ? h.s.end_time : (j.end_time||''), title: (h && h.s.title) || j.title, tag: h ? '조정' : '' };
    }).concat(NEW.map(n => ({ t: n.time, e: n.end_time, title: n.title, tag: '신규' })));
    merged.sort((a,b) => a.t.localeCompare(b.t));
    merged.forEach(m => console.log('   ' + m.t + '~' + m.e + '  ' + String(m.title).slice(0,36) + (m.tag ? '   [' + m.tag + ']' : '')));
    console.log('\n   16:20 출발 → 17:40 카스틸리오네 도착 (체크인 마감 19:00, 여유 1H20)');
    console.log('%c\n진행 → atelierWalks.apply()', 'color:#2563eb;font-weight:bold');
  }

  async function apply() {
    if (typeof journeyData === 'undefined') { console.error('❌ Travel 페이지에서 실행해줘'); return; }
    const items = dayItems();
    if (!items.length) { console.error('❌ 9/25 일정을 못 찾았어. 중단.'); return; }

    const bk = { shifted: {}, added: [] };

    for (const s of SHIFT) {
      const j = items.find(x => s.key.test(String(x.title||'')));
      if (!j) { console.warn('⚠️ 건너뜀: ' + s.key); continue; }
      bk.shifted[j._id] = { time: j.time ?? null, end_time: j.end_time ?? null, title: j.title ?? null, name_en: j.name_en ?? null };
      const patch = { time: s.time, end_time: s.end_time };
      if (s.title)   patch.title   = s.title;
      if (s.name_en) patch.name_en = s.name_en;
      await fbUpdate('journey', j._id, patch);
      Object.assign(j, patch);
    }

    for (const n of NEW) {
      const doc = await fbAdd('journey', Object.assign({ type: '일정', trip_id: currentTripId, date: D }, n));
      journeyData.push(doc);
      bk.added.push(doc._id);
    }

    try { localStorage.setItem(BK, JSON.stringify(bk)); } catch (e) { console.warn('백업 저장 실패:', e.message); }
    if (typeof renderDayView === 'function') renderDayView();
    console.log('%c✅ 완료 — 새로고침해줘', 'color:#16a34a;font-weight:bold;font-size:14px');
    console.log('   오르비에토: 두오모 → 우물 → Corso Cavour → 토레 델 모로 → 점심 → 16:20 출발');
    console.log('   카스틸리오네: 17:40 체크인 → 18:10 텐텐나노(일몰) → 19:20 마을 → 20:00 저녁');
  }

  async function undo() {
    const bk = JSON.parse(localStorage.getItem(BK) || 'null');
    if (!bk) return console.error('백업이 없어.');
    for (const id of Object.keys(bk.shifted)) {
      const p = {}; Object.keys(bk.shifted[id]).forEach(k => { if (bk.shifted[id][k] !== null) p[k] = bk.shifted[id][k]; });
      await fbUpdate('journey', id, p);
      const j = (journeyData||[]).find(x => x._id === id); if (j) Object.assign(j, p);
    }
    for (const id of (bk.added || [])) {
      await fbDelete('journey', id);
      const i = (journeyData||[]).findIndex(x => x._id === id); if (i >= 0) journeyData.splice(i, 1);
    }
    localStorage.removeItem(BK);
    if (typeof renderDayView === 'function') renderDayView();
    console.log('%c↩️ 되돌림 완료 — 새로고침해줘', 'color:#f59e0b;font-weight:bold');
  }

  console.log('%c준비됨 → atelierWalks.preview()', 'color:#2563eb;font-weight:bold;font-size:14px');
  return { preview, apply, undo };
})();
