// ═══════════════════════════════════════════════════════════════
// 2026 독일&이탈리아 — 짐 체크리스트 + 날짜별 외출복 일괄 반영
// ───────────────────────────────────────────────────────────────
// 누리의 구글 스프레드시트를 그대로 옮긴다.
//   · 오른쪽 열(카테고리 12개 + 아이템) → packing
//   · 왼쪽 열(날짜별 외출복 11일)      → outfits
//
// 같이 하는 것: 이름이 같은 카테고리 병합(중복 정리) + 아이템 중복 제거.
// 체크 상태는 보존한다 — 이미 체크한 건 건드리지 않음.
//
// 사용: Travel → 짐싸기 페이지에서 트립 선택 → F12 → Console → 붙여넣기 → Enter
//       크롬이 막으면 콘솔에 allow pasting 타이핑 + Enter (처음 한 번만)
// ═══════════════════════════════════════════════════════════════
window.atelierPack = (function () {
  const BK = 'atelier_pack_backup';

  // ── 오른쪽 열: 카테고리 + 아이템
  //   ※ '스킨/시카이드 크림' 은 시트에서 세면도구 마지막에 있었지만 스킨케어라 화장품으로 옮김
  const CATS = [
    { category:'잠옷/수영복', icon:'beach_access',   items:['자주 잠옷 1','자주 잠옷 2','자주 잠옷 3'] },
    { category:'신발',        icon:'fitness_center', items:['아디다스','살로몬 운동화 (신기)'] },
    { category:'가방',        icon:'shopping_bag',   items:['포테 가방'] },
    { category:'속옷',        icon:'checkroom',      items:['누브라 1개','팬티 12개','양말 12개'] },
    { category:'ACC',         icon:'brush',          items:['어나더 향수','바이위켄드 실버 귀걸이','포들 레드 귀걸이','머리빗','고데기','집게핀'] },
    { category:'세면도구',    icon:'spa',            items:['헤어밴드','치약&칫솔','샤워 글로브','바디워시/샴푸/린스','클렌징폼/아이리무버 + 솜','브러쉬 클렌저'] },
    { category:'화장품',      icon:'star',           items:['스킨/시카이드 크림','헤어 에센스','헤어 브러쉬','머리 약','바디 스크럽','바디 오일'] },
    { category:'일반 준비물', icon:'luggage',        items:['휴대용 물티슈','기본 펜 & 네임펜','우산','손톱깎이','책','상비약'] },
    { category:'전자제품',    icon:'devices',        items:['노트북/에어팟','보조배터리','충전기/돼지코','eSIM','여러 랜선들'] },
    { category:'항공',        icon:'flight',         items:['여권 / 여권 사본 / 여권 사진','국제운전면허증'] },
    { category:'돈',          icon:'local_cafe',     items:['환전 (캐쉬)','비상용 체크 & 신용카드'] },
    { category:'보험',        icon:'book',           items:['마이뱅크'] }
  ];

  // ── 왼쪽 열: 날짜별 외출복
  const OUTFITS = {
    '2026-09-24': ['기내 허벌옷'],
    '2026-09-25': ['스웨이드 자켓','크로쉐 원피스','블랙 브라캡','기준 팬츠'],
    '2026-09-26': ['가죽 자켓','로우 타이드 반팔 티셔츠','108파운드 사틴 스커트','기준 팬츠'],
    '2026-09-27': ['타티아나 화이트 캡','스웨이드 자켓','로우클래식 오프숄더 니트','위드아웃 썸머 아이보리 레이스','르바 화이트 플리츠 스커트','르바 블랙 팬츠','스웨이드 벨트'],
    '2026-09-28': ['타입서비스 닷 다운 재킷','토아베 바람막이','MLB 레이어드 니트','아홉 아홉 탱크탑 그레이','룰루레몬 헤이즈 컬러 팬츠'],
    '2026-09-29': ['타입서비스 닷 다운 재킷','토아베 바람막이','오데스 레이어드 긴팔 티셔츠','무브웜 네이비 컬러 팬츠'],
    '2026-09-30': ['타입서비스 닷 다운 재킷','토아베 바람막이','MLB 브이넥 니트','아홉 아홉 탱크탑 그레이','룰루레몬 헤이즈 컬러 팬츠'],
    '2026-10-01': ['타티아나 화이트 캡','스웨이드 자켓','로우클래식 오프숄더 니트','위드아웃 썸머 아이보리 레이스','르바 화이트 플리츠 스커트','르바 블랙 팬츠','스웨이드 벨트'],
    '2026-10-02': ['가죽 자켓','아홉 레이스 긴팔 티셔츠','아홉 탱크탑 블랙','베르소 벨트','르바 블랙 팬츠'],
    '2026-10-03': ['타티아나 블랙 캡','가죽 자켓','세릭 셔링 긴팔','세릭 슬립 원피스','니트 팬츠 + 랩 스커트'],
    '2026-10-04': ['가죽 자켓','미치코런던 레이스 세트 가디건','미치코런던 코듀로이 팬츠','기내 허벌옷']
  };

  // 모자·벨트만 악세, 나머지는 의류 (브라캡은 속옷이라 의류로 둔다)
  const ACC = ['타티아나 화이트 캡','타티아나 블랙 캡','스웨이드 벨트','베르소 벨트'];
  const catOf = n => ACC.indexOf(n) >= 0 ? '악세' : '의류';

  const norm = s => String(s || '').trim().replace(/\s+/g, ' ');

  function guard() {
    if (typeof pkTripId === 'undefined' || !pkTripId) {
      console.error('❌ 짐싸기 페이지에서 트립을 먼저 고르고 실행해줘'); return false;
    }
    if (typeof fbAdd !== 'function' || typeof fbUpdate !== 'function' || typeof fbDelete !== 'function') {
      console.error('❌ Travel 페이지에서 실행해줘'); return false;
    }
    return true;
  }

  // 같은 이름 카테고리를 묶는다 (첫 문서에 합치고 나머지는 삭제 대상)
  function groupDupes() {
    const by = new Map();
    pkData.forEach(d => {
      const k = norm(d.category);
      if (!by.has(k)) by.set(k, []);
      by.get(k).push(d);
    });
    return by;
  }

  function preview() {
    if (!guard()) return;
    console.log('%c[짐 체크리스트 반영] 미리보기', 'font-weight:bold;font-size:14px');

    const by = groupDupes();
    const dupes = [...by.entries()].filter(([, ds]) => ds.length > 1);
    if (dupes.length) {
      console.log('\n%c■ 중복 카테고리 ' + dupes.length + '건 — 하나로 합침', 'color:#b45309;font-weight:bold');
      console.table(dupes.map(([k, ds]) => ({
        카테고리: k, 문서수: ds.length,
        아이템: ds.reduce((s, d) => s + (d.items || []).length, 0) + '개 → 합친 뒤 중복 제거'
      })));
    } else {
      console.log('\n■ 중복 카테고리 없음');
    }

    console.log('\n%c■ 시트 카테고리 ' + CATS.length + '건', 'font-weight:bold');
    console.table(CATS.map(c => {
      const cur = by.get(norm(c.category));
      const have = cur ? new Set(cur.flatMap(d => (d.items || []).map(i => norm(i.name)))) : new Set();
      const add = c.items.filter(n => !have.has(norm(n)));
      return {
        카테고리: c.category,
        상태: cur ? '기존에 있음' : '새로 만듦',
        기존아이템: have.size,
        추가될것: add.length,
        '추가 목록': add.join(', ').slice(0, 40)
      };
    }));

    const days = Object.keys(OUTFITS).length;
    const total = Object.values(OUTFITS).reduce((s, a) => s + a.length, 0);
    const filled = pkOutfits.filter(o => OUTFITS[o.date] && (o.items || []).length).length;
    console.log('\n■ 외출복 ' + days + '일 · ' + total + '벌  (이미 내용이 있는 날: ' + filled + '일 — 겹치는 이름만 건너뜀)');

    console.log('%c\n카테고리 반영 → atelierPack.applyCats()', 'color:#2563eb;font-weight:bold');
    console.log('%c외출복 반영  → atelierPack.applyOutfits()', 'color:#2563eb;font-weight:bold');
  }

  async function applyCats() {
    if (!guard()) return;
    const bk = JSON.parse(localStorage.getItem(BK) || '{}');
    bk.packing = pkData.map(d => JSON.parse(JSON.stringify(d)));

    const by = groupDupes();
    let merged = 0, removed = 0, added = 0, created = 0;

    // ① 이름이 같은 카테고리 병합
    for (const [, ds] of by) {
      if (ds.length < 2) continue;
      const keep = ds[0];
      const seen = new Set((keep.items || []).map(i => norm(i.name)));
      for (const d of ds.slice(1)) {
        for (const it of (d.items || [])) {
          if (seen.has(norm(it.name))) continue;
          seen.add(norm(it.name));
          keep.items = keep.items || []; keep.items.push(it);
        }
        await fbDelete('packing', d._id);
        pkData.splice(pkData.indexOf(d), 1);
        removed++;
      }
      await fbUpdate('packing', keep._id, { items: keep.items || [] });
      merged++;
    }

    // ② 같은 카테고리 안 아이템 중복 제거
    for (const d of pkData) {
      const seen = new Set(); const out = [];
      for (const it of (d.items || [])) {
        const k = norm(it.name);
        if (!k || seen.has(k)) continue;
        seen.add(k); out.push(it);
      }
      if (out.length !== (d.items || []).length) { d.items = out; await fbUpdate('packing', d._id, { items: out }); }
    }

    // ③ 시트 내용 반영 (체크 상태는 건드리지 않음)
    for (const c of CATS) {
      let doc = pkData.find(d => norm(d.category) === norm(c.category));
      if (!doc) {
        doc = await fbAdd('packing', { trip_id: pkTripId, category: c.category, icon: c.icon, items: [] });
        pkData.push(doc); created++;
      }
      const seen = new Set((doc.items || []).map(i => norm(i.name)));
      const next = (doc.items || []).slice();
      let n = 0;
      for (const name of c.items) {
        if (seen.has(norm(name))) continue;
        seen.add(norm(name)); next.push({ name: name, checked: false }); n++;
      }
      if (n) { doc.items = next; await fbUpdate('packing', doc._id, { items: next }); added += n; }
    }

    try { localStorage.setItem(BK, JSON.stringify(bk)); } catch (e) { console.warn('백업 저장 실패:', e.message); }
    pkRenderCategories(); pkRenderProgress();
    console.log('%c✅ 카테고리 반영 완료', 'color:#16a34a;font-weight:bold;font-size:14px');
    console.log('   중복 병합 ' + merged + '건 (문서 ' + removed + '개 삭제) · 새 카테고리 ' + created + '개 · 아이템 ' + added + '개 추가');
  }

  async function applyOutfits() {
    if (!guard()) return;
    const bk = JSON.parse(localStorage.getItem(BK) || '{}');
    bk.outfits = pkOutfits.map(o => JSON.parse(JSON.stringify(o)));
    bk.outfitsAdded = bk.outfitsAdded || [];

    let added = 0, days = 0;
    for (const date of Object.keys(OUTFITS)) {
      const names = OUTFITS[date];
      let o = pkOutfits.find(x => x.date === date);
      if (!o) {
        o = await fbAdd('outfits', { trip_id: pkTripId, date: date, items: [] });
        pkOutfits.push(o); bk.outfitsAdded.push(o._id);
      }
      const seen = new Set((o.items || []).map(i => norm(i.name)));
      const next = (o.items || []).slice();
      let n = 0;
      for (const name of names) {
        if (seen.has(norm(name))) continue;
        seen.add(norm(name)); next.push({ name: name, checked: false, cat: catOf(name) }); n++;
      }
      if (n) { o.items = next; await fbUpdate('outfits', o._id, { items: next }); added += n; days++; }
    }

    try { localStorage.setItem(BK, JSON.stringify(bk)); } catch (e) { console.warn('백업 저장 실패:', e.message); }
    pkRenderDaily(); pkRenderProgress();
    console.log('%c✅ 외출복 반영 완료 — ' + days + '일 · ' + added + '벌', 'color:#16a34a;font-weight:bold;font-size:14px');
    console.log('   모자·벨트는 ACCESSORIES, 나머지는 CLOTHING 으로 넣었어. 드래그로 옮길 수 있어');
  }

  async function undo() {
    const bk = JSON.parse(localStorage.getItem(BK) || 'null');
    if (!bk) return console.error('백업이 없어.');
    if (bk.packing) {
      for (const d of pkData.slice()) {
        if (!bk.packing.find(b => b._id === d._id)) { await fbDelete('packing', d._id); pkData.splice(pkData.indexOf(d), 1); }
      }
      for (const b of bk.packing) {
        const cur = pkData.find(d => d._id === b._id);
        if (cur) { cur.items = b.items; await fbUpdate('packing', b._id, { items: b.items }); }
        else { const re = await fbAdd('packing', { trip_id: b.trip_id, category: b.category, icon: b.icon, items: b.items }); pkData.push(re); }
      }
    }
    if (bk.toiletry) {
      for (const d of pkData.slice()) {
        if (['세면도구','화장품',MERGED].indexOf(norm(d.category)) >= 0 && !bk.toiletry.find(b => b._id === d._id)) {
          await fbDelete('packing', d._id); pkData.splice(pkData.indexOf(d), 1);
        }
      }
      for (const b of bk.toiletry) {
        const cur = pkData.find(d => d._id === b._id);
        if (cur) { cur.category = b.category; cur.icon = b.icon; cur.items = b.items; await fbUpdate('packing', b._id, { category: b.category, icon: b.icon, items: b.items }); }
        else { const re = await fbAdd('packing', { trip_id: b.trip_id, category: b.category, icon: b.icon, items: b.items }); pkData.push(re); }
      }
    }
    if (bk.outfits) {
      for (const id of (bk.outfitsAdded || [])) {
        await fbDelete('outfits', id);
        const i = pkOutfits.findIndex(o => o._id === id); if (i >= 0) pkOutfits.splice(i, 1);
      }
      for (const b of bk.outfits) {
        const cur = pkOutfits.find(o => o._id === b._id);
        if (cur) { cur.items = b.items; await fbUpdate('outfits', b._id, { items: b.items }); }
      }
    }
    localStorage.removeItem(BK);
    pkRenderCategories(); pkRenderDaily(); pkRenderProgress();
    console.log('%c↩️ 되돌림 완료 — 새로고침해줘', 'color:#f59e0b;font-weight:bold');
  }

  // ── 세면도구 + 화장품을 하나로 합치고 아이템을 목록 그대로 교체
  //   기본 템플릿(PK_TEMPLATE_DEFAULT)의 '치약 & 칫솔' 과 시트의 '치약&칫솔' 처럼
  //   공백만 다른 이름이 각각 들어가 중복이 쌓였다. 이름을 맞춰 한 번에 정리한다.
  const MERGED = '세면도구 / 화장품';   // 합친 뒤 카테고리 이름
  const TOILETRY = ['헤어밴드','치약&칫솔','샤워 글로브','바디워시/샴푸/린스','클렌징폼/아이리무버 + 솜',
                    '브러쉬 클렌저','스킨/시카이드 크림','헤어 에센스','헤어 브러쉬','머리 약','바디 스크럽','바디 오일'];

  function mergeToiletriesPreview() {
    if (!guard()) return;
    const t = pkData.filter(d => ['세면도구', '화장품', MERGED].indexOf(norm(d.category)) >= 0);
    if (!t.length) return console.error('❌ 세면도구/화장품 카테고리를 못 찾았어');
    console.log('현재: ' + t.map(d => d.category + '(' + (d.items || []).length + '개)').join(' · '));
    const all = [...new Set(t.flatMap(d => (d.items || []).map(i => i.name)))];
    const lost = all.filter(n => TOILETRY.indexOf(n) < 0);
    console.log('남길 것 ' + TOILETRY.length + '개 · 빠지는 것 ' + lost.length + '개');
    if (lost.length) console.log('  빠짐: ' + lost.join(', '));
    console.log('%c\n진행 → atelierPack.mergeToiletries()', 'color:#2563eb;font-weight:bold');
  }

  async function mergeToiletries() {
    if (!guard()) return;
    const t = pkData.filter(d => ['세면도구', '화장품', MERGED].indexOf(norm(d.category)) >= 0);
    if (!t.length) return console.error('❌ 세면도구/화장품 카테고리를 못 찾았어');

    const bk = JSON.parse(localStorage.getItem(BK) || '{}');
    bk.toiletry = t.map(d => JSON.parse(JSON.stringify(d)));

    // 체크 상태는 이름이 같은 것만 이어받는다
    const checked = new Set();
    t.forEach(d => (d.items || []).forEach(i => { if (i.checked) checked.add(norm(i.name)); }));

    const keep = t[0];
    for (const d of t.slice(1)) { await fbDelete('packing', d._id); pkData.splice(pkData.indexOf(d), 1); }

    keep.category = MERGED; keep.icon = 'spa';
    keep.items = TOILETRY.map(n => ({ name: n, checked: checked.has(norm(n)) }));
    await fbUpdate('packing', keep._id, { category: MERGED, icon: 'spa', items: keep.items });

    try { localStorage.setItem(BK, JSON.stringify(bk)); } catch (e) { console.warn('백업 저장 실패:', e.message); }
    pkRenderCategories(); pkRenderProgress();
    console.log('%c✅ ' + MERGED + ' 하나로 합침 — ' + TOILETRY.length + '개', 'color:#16a34a;font-weight:bold;font-size:14px');
    console.log('   체크 유지: ' + (keep.items.filter(i => i.checked).map(i => i.name).join(', ') || '없음'));
  }

  console.log('%c준비됨 → atelierPack.preview()', 'color:#2563eb;font-weight:bold;font-size:14px');
  return { preview, applyCats, applyOutfits, mergeToiletriesPreview, mergeToiletries, undo };
})();
