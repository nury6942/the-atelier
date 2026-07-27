// ═══════════════════════════════════════════════════════════════
// ATELIER: 스팟 위키 원어명(wiki_title) 지정 — 2026 독일·이탈리아
// ───────────────────────────────────────────────────────────────
// 문제: 스팟 이름이 한글 음차("티어가르텐")라 ko/en 위키에서 안 잡힘.
//       실제 문서는 원어("Großer Tiergarten", de)로 존재.
//
// 이 스크립트: 위키에 문서가 확실히 있는 곳에 wiki_title(원어명)을 달아준다.
//       그 다음 Places 화면의 [📷 사진 채우기]를 누르면 원어명으로 검색해 채워진다.
//
// 개별 식당·카페·상점(오스테리아·젤라테리아·로스터리 등)은 위키에 문서가 없어
// 의도적으로 제외했다. 그건 직접 사진을 넣거나 비워두는 게 맞다.
//
// 사용: Travel 페이지 → F12 → Console → 붙여넣기 → Enter
// ═══════════════════════════════════════════════════════════════

(async function setWikiTitles() {
  const DRY = true;   // ★ 실제 반영하려면 false 로 바꾸고 다시 실행

  if (typeof fbUpdate !== 'function' || typeof journeyData === 'undefined') {
    alert('❌ Travel 페이지에서 실행해주세요'); return;
  }

  // [스팟 이름에 포함된 문자열, 위키 원어명]
  const MAP = [
    // ── 베를린
    ['파노라마풍크트',        'Panoramapunkt'],
    ['알테 나치오날갈레리',   'Alte Nationalgalerie'],
    ['베를린 돔',             'Berliner Dom'],
    ['티어가르텐',            'Großer Tiergarten'],
    ['추어 레츠텐 인스탄츠',  'Zur letzten Instanz'],
    ['젠다르멘마르크트',      'Gendarmenmarkt'],
    ['빅토리아파크',          'Viktoriapark'],
    ['무스타파스 게뮤제',     'Mustafas Gemüse Kebap'],
    ['콘놉케스 임비스',       "Konnopke's Imbiß"],
    ['카페 아인슈타인',       'Café Einstein'],
    ['카스타니엔알레',        'Kastanienallee (Berlin)'],
    ['마우어파크',            'Mauerpark'],
    ['하케셰 회페',           'Hackesche Höfe'],
    ['게멜데갈레리',          'Gemäldegalerie (Berlin)'],
    ['오버바움 다리',         'Oberbaumbrücke'],
    ['보크스하겐 광장',       'Boxhagener Platz'],
    ['라우쉬 쇼콜라덴하우스',  'Fassbender & Rausch'],
    // ── 프랑크푸르트
    ['괴테슈트라세',          'Goethestraße (Frankfurt am Main)'],
    ['마인 타워',             'Main Tower'],
    ['베트만 공원',           'Bethmannpark'],
    ['팔멘가르텐',            'Palmengarten'],
    // ── 베로나
    ['토레 데이 람베르티',    'Torre dei Lamberti'],
    ['시뇨리 광장',           'Piazza dei Signori (Verona)'],
    ['아마로네 델라 발폴리첼라', 'Amarone della Valpolicella'],
    // ── 시에나
    ['시에나 시립미술관',     'Palazzo Pubblico'],
    // ── 오르비에토
    ['성 파트리치오 우물',    'Pozzo di San Patrizio'],
    // ── 발도르차
    ['바뇨 비뇨니',           'Bagno Vignoni'],
    ['파르코 데이 물리니',    'Bagno Vignoni'],
    ['카펠라 디 비탈레타',    'Cappella della Madonna di Vitaleta'],
    ['피엔차 성벽',           'Pienza'],
    ['팔라초 코무날레',       'Palazzo Comunale (Montepulciano)'],
    ['몬탈치노 와이너리',     'Montalcino'],
    // ── 돌로미티
    ['파소 팔자레고',         'Passo Falzarego'],
    ['발 가르데나 목조각',    'Val Gardena']
  ];

  const spots = journeyData.filter(d => d.type === '스팟' && d._id);
  const hits = [];
  const missKeys = [];

  MAP.forEach(([key, wiki]) => {
    const found = spots.filter(s => String(s.title || '').includes(key));
    if (!found.length) { missKeys.push(key); return; }
    found.forEach(s => hits.push({ s, key, wiki }));
  });

  console.log('%c══ 위키 원어명 지정 ' + (DRY ? '(DRY RUN — 미반영)' : '(실제 반영)') + ' ══',
    'font-weight:bold;font-size:13px;color:#6b38d4');
  console.table(hits.map(h => ({
    '스팟': h.s.title,
    '도시': h.s.city || '',
    '→ 위키 원어명': h.wiki,
    '기존 사진': h.s.photo_url ? '있음' : '없음'
  })));
  if (missKeys.length) console.warn('이름이 안 맞아 못 찾은 항목:', missKeys);

  if (DRY) {
    console.log('%c확인됐으면 맨 위 DRY = false 로 바꿔 다시 실행 → 그 다음 [📷 사진 채우기] 클릭',
      'color:#c60;font-weight:bold');
    return;
  }

  let ok = 0;
  for (const h of hits) {
    try {
      await fbUpdate('journey', h.s._id, { wiki_title: h.wiki });
      h.s.wiki_title = h.wiki;
      ok++;
    } catch (e) { console.error('실패:', h.s.title, e); }
  }
  console.log('%c완료 — ' + ok + '곳에 원어명 지정. 이제 [📷 사진 채우기] 버튼을 누르세요.',
    'font-weight:bold;color:#6b38d4');
})();
