// ═══════════════════════════════════════════════════════════════
// 일정 항목에 원문(name_en) 일괄 심기 — 구글맵에서 찾을 이름
// ───────────────────────────────────────────────────────────────
// 제목이 전부 한국어라 구글맵 검색이 안 됐다.
//   "오르비에토 — 두오모 · 산 브리치오 Orvieto"  ← 이러면 못 찾는다
//   "Duomo di Orvieto"                          ← 이렇게 심는다
//
// 카드에 회색으로 병기되고, 🌐 버튼이 이 이름으로 구글맵을 연다.
// 이미 name_en 이 있는 항목은 건드리지 않는다.
//
// 사용: Travel 페이지 → F12 → Console → 붙여넣기 → Enter
// ═══════════════════════════════════════════════════════════════
window.atelierNameEn = (function () {
  const BK = 'atelier_nameen_backup';

  // 위에서부터 먼저 맞는 것 하나만 적용한다. 좁은 규칙을 위에 둘 것.
  const MAP = [
    // ── 이탈리아 · 로마
    [/Parco Leonardo/i,                 'Stazione Parco Leonardo'],
    [/B&B Hotel Roma|FCO 공항권 숙소/,    'B&B Hotel Roma Fiumicino Fiera'],
    [/Europcar 반납|렌트카 반납/,         'Venice Marco Polo Airport'],
    [/Europcar 픽업|렌터카 픽업|렌트카 픽업/, 'Europcar Roma Fiumicino Airport'],
    [/FCO|피우미치노/,                    'Aeroporto di Roma Fiumicino'],

    // ── 오르비에토
    [/산 브리치오|오르비에토.*두오모|두오모.*오르비에토/, 'Duomo di Orvieto'],
    [/파트리치오/,                        'Pozzo di San Patrizio'],
    [/토레 델 모로/,                      'Torre del Moro Orvieto'],
    [/오르비에토 지하|지하도시/,           'Orvieto Underground'],
    [/오르비에토/,                        'Orvieto'],

    // ── 발 도르차
    [/바뇨 ?비뇨니|Bagno Vignoni/i,       'Bagno Vignoni'],
    [/비탈레타/,                          'Cappella della Madonna di Vitaleta'],
    [/사이프러스|치프레시니/,              "Cipressi di San Quirico d'Orcia"],
    [/오르티 레오니니|Horti/i,            'Horti Leonini San Quirico'],
    [/콜레지아타/,                        'Collegiata dei Santi Quirico e Giulitta'],
    [/몬티키엘로|Monticchiello/i,          'Monticchiello'],
    [/피엔차|Pienza/i,                     'Pienza'],
    [/텐텐나노/,                          'Rocca di Tentennano'],
    [/Ermione/i,                         "Ermione Castiglione d'Orcia"],
    [/카스틸리오네/,                       "Castiglione d'Orcia"],
    [/산 ?퀴리코/,                        "San Quirico d'Orcia"],

    // ── 베로나
    [/카스텔베키오/,                       'Museo di Castelvecchio'],
    [/아레나|피아차 브라/,                 'Arena di Verona'],
    [/Via Mazzini|마치니/i,               'Via Mazzini Verona'],
    [/에르베/,                            'Piazza delle Erbe Verona'],
    [/줄리에타|Dimora/i,                  'Dimora Giardino di Giulietta Verona'],
    [/치타델라/,                          'Parcheggio Cittadella Verona'],
    [/베로나/,                            'Verona'],

    // ── 돌로미티
    [/트레치메|라바레도/,                  'Rifugio Auronzo Tre Cime di Lavaredo'],
    [/미주리나|Misurina/i,                 'Lago di Misurina'],
    [/로카텔리/,                          'Rifugio Locatelli Dreizinnenhuette'],
    [/란드로/,                            'Lago di Landro'],
    [/코르티나|Cortina/i,                  "Cortina d'Ampezzo"],
    [/브라이에스|Braies|Prags/i,           'Lago di Braies Pragser Wildsee'],
    [/세체다|Seceda/i,                     'Seceda'],
    [/오르티세이|Ortisei|St\\. ?Ulrich/i,   'Ortisei'],
    [/가르데나/,                          'Passo Gardena'],
    [/알페 디 시우시|콤파치/,              'Alpe di Siusi Compatsch'],
    [/시우시|Seis/i,                      'Cabinovia Siusi Alpe di Siusi'],
    [/브루니코/,                          'Brunico Bruneck'],
    [/Lienharterhof/i,                   'Lienharterhof Monguelfo'],
    [/몬구엘포/,                          'Monguelfo Welsberg'],
    [/VCE|베네치아/,                      'Venice Marco Polo Airport'],

    // ── 베를린
    [/Casa Camper/i,                     'Casa Camper Berlin'],
    [/노이에스 박물관/,                    'Neues Museum Berlin'],
    [/유대인 ?박물관/,                     'Juedisches Museum Berlin'],
    [/노이에 나치오날|나치오날갈레리/,      'Neue Nationalgalerie'],
    [/보로스/,                            'Boros Collection Berlin'],
    [/비키니/,                            'Bikini Berlin'],
    [/템펠호퍼|템펠호프/,                  'Tempelhofer Feld'],
    [/베저|잔더/,                         'Weserstrasse Berlin'],
    [/오라니엔/,                          'Oranienstrasse Berlin'],
    [/티어가르텐/,                        'Tiergarten Berlin'],
    [/전승기념탑/,                        'Siegessaeule Berlin'],
    [/노이쾰른/,                          'Neukoelln Berlin'],
    [/미테/,                              'Mitte Berlin'],
    [/BER/,                              'Berlin Brandenburg Airport'],
    [/베를린/,                            'Berlin'],

    // ── 데사우 · 라이프치히 · 프랑크푸르트
    [/바우하우스|Bauhaus/i,                'Bauhaus Dessau'],
    [/마이스터하우스|마이스터/,            'Meisterhaeuser Dessau'],
    [/데사우/,                            'Dessau Hauptbahnhof'],
    [/KooooK/i,                          'Stay KooooK Leipzig City'],
    [/메들러/,                            'Maedlerpassage Leipzig'],
    [/라이프치히/,                        'Leipzig Hauptbahnhof'],
    [/프랑크푸르트 공항|공항역/,           'Frankfurt Airport'],
    [/프랑크푸르트/,                      'Frankfurt am Main']
  ];

  function pick(title) {
    const t = String(title || '');
    for (const [re, en] of MAP) if (re.test(t)) return en;
    return '';
  }

  function targets() {
    return (journeyData || []).filter(j => {
      if (j.name_en) return false;                 // 이미 있으면 건드리지 않음
      if (j.type && j.type !== '일정') return false;
      return !!pick(j.title);
    });
  }

  function preview() {
    if (typeof journeyData === 'undefined') { console.error('❌ Travel 페이지에서 실행해줘'); return; }
    const t = targets();
    console.log('%c[원문(name_en) 심기] 미리보기', 'font-weight:bold;font-size:14px');
    console.log('전체 일정 ' + journeyData.length + '건 · 이미 있음 ' + journeyData.filter(j => j.name_en).length + '건 · 심을 것 ' + t.length + '건');
    console.table(t.map(j => ({ 날짜: j.date, 제목: String(j.title || '').slice(0, 30), '→ 원문': pick(j.title) })));
    const miss = (journeyData || []).filter(j => !j.name_en && !pick(j.title) && (!j.type || j.type === '일정'));
    if (miss.length) {
      console.log('%c\n■ 규칙에 안 걸린 ' + miss.length + '건 (카드에서 더블클릭으로 직접 입력하면 돼)', 'color:#b45309');
      console.log('   ' + miss.slice(0, 25).map(j => String(j.title || '').slice(0, 22)).join(' / '));
    }
    console.log('%c\n진행 → atelierNameEn.apply()', 'color:#2563eb;font-weight:bold');
  }

  async function apply() {
    if (typeof journeyData === 'undefined') { console.error('❌ Travel 페이지에서 실행해줘'); return; }
    const t = targets();
    if (!t.length) { console.log('심을 게 없어 (전부 이미 있음)'); return; }
    try { localStorage.setItem(BK, JSON.stringify(t.map(j => j._id))); } catch (e) { console.warn('백업 저장 실패:', e.message); }
    let n = 0;
    for (const j of t) {
      const en = pick(j.title);
      await fbUpdate('journey', j._id, { name_en: en });
      j.name_en = en; n++;
    }
    if (typeof renderDayView === 'function') renderDayView();
    console.log('%c✅ ' + n + '건 심음 — 새로고침해줘', 'color:#16a34a;font-weight:bold;font-size:14px');
    console.log('   카드에 회색으로 원문이 뜨고, 🌐 버튼이 그 이름으로 구글맵을 열어');
    console.log('   빠진 건 카드에서 "+ 원문 (더블클릭)" 을 눌러 직접 넣으면 돼');
  }

  async function undo() {
    const ids = JSON.parse(localStorage.getItem(BK) || 'null');
    if (!ids) return console.error('백업이 없어.');
    for (const id of ids) {
      await fbUpdate('journey', id, { name_en: '' });
      const j = (journeyData || []).find(x => x._id === id); if (j) j.name_en = '';
    }
    localStorage.removeItem(BK);
    if (typeof renderDayView === 'function') renderDayView();
    console.log('%c↩️ 되돌림 완료 (' + ids.length + '건)', 'color:#f59e0b;font-weight:bold');
  }

  console.log('%c준비됨 → atelierNameEn.preview()', 'color:#2563eb;font-weight:bold;font-size:14px');
  return { preview, apply, undo, _pick: pick };
})();
