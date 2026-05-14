// ═══════════════════════════════════════════════════════════════
// ATELIER: 2026 독일&이탈리아 일정 일괄 추가 스크립트 v3
// ───────────────────────────────────────────────────────────────
// 변경 (v2 → v3):
//   - 시간 범위 표기 (09:00-10:30) — 이동 시간 포함
//   - 비행/기차/렌트/체크인 등 시간 고정 항목에 pinned:true 마크
//     → 민트색 강조로 한눈에 구분
//   - 9/26 Frankfurt 오전 + 14:00 ICE → Dresden 으로 변경
//   - 확정 예약 anchor 반영:
//     · 항공 TW403 ICN→FRA 9/25 09:50-16:50
//     · 항공 EZY5056 BER→PSA 10/1 12:05-14:00
//     · 항공 TW403 FCO→ICN 10/4 21:15-(10/5 16:10)
//     · 호텔 4곳 체크인/체크아웃 시간 정확히
//     · 렌트카 픽업 10/1 14:00 PSA / 반납 10/4 19:15 FCO
//   - 시작 시 옵션: 기존 일정 전부 삭제 후 깨끗하게 추가
//
// 사용:
//   1. Travel 페이지 (2026 독일&이탈리아 활성)
//   2. F12 → Console
//   3. 이 파일 내용 붙여넣기 → Enter
//   4. 첫 confirm: "기존 일정 모두 삭제 후 재구성?" (Yes 권장)
//   5. 두 번째 confirm: "새 일정 ~80개 추가?"
// ═══════════════════════════════════════════════════════════════

(async function bulkAdd2026JourneyV3() {
  if (typeof fbAdd !== 'function' || typeof fbDelete !== 'function') {
    alert('❌ Travel 페이지에서 실행해주세요'); return;
  }

  // ── 트립 찾기 ──
  let tripId = null;
  let tripName = '';
  if (typeof currentTripId !== 'undefined' && currentTripId) {
    tripId = currentTripId;
    try {
      const all = await fbRead('trips');
      const t = all.find(x => x._id === currentTripId);
      if (t) tripName = t.name;
    } catch(e) {}
  }
  if (!tripId) {
    try {
      const all = await fbRead('trips');
      const t = all.find(x => (x.name||'').includes('독일') && (x.name||'').includes('이탈리아'));
      if (t) { tripId = t._id; tripName = t.name; }
    } catch(e) {}
  }
  if (!tripId) { alert('❌ 트립을 찾을 수 없습니다'); return; }
  console.log('🎒 Trip:', tripName, '|', tripId);

  // ── 1) 기존 일정 삭제 (옵션) ──
  const wipe = confirm(
    `1단계: 이 트립의 기존 일정을 모두 삭제할까요?\n\n` +
    `(예 = 깨끗한 상태에서 재구성 - 권장)\n` +
    `(아니오 = 중복 가능성 있음)`
  );
  if (wipe) {
    const all = await fbRead('journey');
    const items = all.filter(j => j.trip_id === tripId && j.type === '일정');
    console.log(`🗑️ 기존 일정 ${items.length}개 삭제 중...`);
    for (const j of items) {
      try {
        await fbDelete('journey', j._id);
        if (typeof journeyData !== 'undefined') {
          const idx = journeyData.findIndex(x => x._id === j._id);
          if (idx >= 0) journeyData.splice(idx, 1);
        }
      } catch(e) { console.error('삭제 실패:', j._id, e); }
    }
    console.log('✅ 기존 일정 삭제 완료');
  }

  // ── 2) 일정 데이터 ──
  const FF = 'Frankfurt am Main, 독일';
  const DD = '독일 드레스덴';
  const BL = 'Berlin, 독일';
  const PZ = 'Pienza, 시에나 이탈리아';

  // P 헬퍼: pinned 항목용
  const P = (date, time, end, city, title, desc) => ({
    date, time, end_time: end, city, title, description: desc || '', pinned: true
  });
  // N 헬퍼: 일반 항목
  const N = (date, time, end, city, title, desc) => ({
    date, time, end_time: end, city, title, description: desc || ''
  });

  const items = [
    // ═══ Day 1: 9/25 (금) 인천 → 프랑크푸르트 ═══
    N('2026-09-25','06:00','07:30',FF,'🚗 인천공항 이동',
      '리무진/공항철도. 출국심사 + 면세 쇼핑 시간 1시간 확보.'),
    P('2026-09-25','09:50','16:50',FF,'✈️ TW403 인천 → 프랑크푸르트 (14H)',
      '터미널 T1 → FRA T3. 좌석 미리 체크인. 도착 3시간 전부터 깨어있기(시차 적응).'),
    N('2026-09-25','16:50','17:30',FF,'🛬 짐 찾기 + 쉥겐 입국심사',
      'FRA T3. EU 첫 입국 도장. 짐 찾는 데 보통 20-30분.'),
    N('2026-09-25','17:30','18:30',FF,'🚆 S-Bahn S8/S9 시내 이동 (~15분 + 환승 포함)',
      'FRA Regionalbahnhof에서 탑승. €5.85. Hauptbahnhof 하차 → 시타딘 호텔 도보 5분.'),
    P('2026-09-25','18:30','19:00',FF,'🏨 시타딘 시티 센터 프랑크푸르트 체크인',
      'Europa-Allee 23. ☎️ 069-9203850. 짐 풀고 옷 갈아입기.'),
    N('2026-09-25','19:30','21:00',FF,'🏛️ 뢰머광장 (Römerberg) 산책 + 저녁',
      '동화 같은 목조 건물(Ostzeile). Sachsenhausen 지구 Adolf Wagner에서 Apfelwein + Frankfurter Würstchen.'),
    N('2026-09-25','21:30','22:30',FF,'🛌 숙소 복귀, 휴식',
      '내일 14:00 ICE — 일찍 자기 (시차 + 다음날 이동).'),

    // ═══ Day 2: 9/26 (토) Frankfurt 오전 → Dresden 오후 ═══
    N('2026-09-26','07:30','08:30',FF,'☕ 호텔 조식',
      '시타딘 조식. 든든하게 (점심 시장에서 가볍게).'),
    N('2026-09-26','09:00','09:45',FF,'🏙️ Main Tower Skydeck (도시 전경)',
      '€9. 200m 옥상 전망대. 토요일 9:30 오픈. 사진 명소.'),
    N('2026-09-26','10:00','11:00',FF,'🛍️ Kleinmarkthalle 재래시장',
      '토요일 9:30-16:00 영업. 현지 햄·치즈·빵·꽃. 2층에서 작은 식사 가능.'),
    P('2026-09-26','11:00','11:30',FF,'🏨 시타딘 체크아웃 + 짐 보관',
      '체크아웃 11:00 deadline. 호텔에 짐 맡기고 자유 시간.'),
    N('2026-09-26','11:30','13:00',FF,'🍽️ 점심: Apfelwein 또는 시장 푸드',
      'Klein Markthalle 2층 바 또는 인근 Sachsenhausen. 가볍게.'),
    N('2026-09-26','13:00','13:45',FF,'🧳 호텔 짐 픽업 → Frankfurt Hbf',
      '시타딘 → Frankfurt Hbf 도보 5분 또는 트램 1정거장. 짐 들고 이동.'),
    P('2026-09-26','14:00','18:30',DD,'🚂 ICE: Frankfurt Hbf → Dresden Hbf (4h30m)',
      '⚠️ 대부분 노선이 Leipzig 환승. DB Navigator로 정확한 열차편 사전 확인. 좌석 예약 강추 (€4.50). 1등석이면 DB Lounge 무료 사용 가능.'),
    N('2026-09-26','18:30','19:00',DD,'🚆 Dresden Hbf → 호텔 이동',
      '트램 6번/11번 또는 도보 ~15분. Moxy는 Neustadt 지구.'),
    P('2026-09-26','19:00','19:30',DD,'🏨 Moxy Dresden Neustadt 체크인',
      'Dr.-Friedrich-Wolf-Straße 8. ☎️ 0351-89881414.'),
    N('2026-09-26','19:30','20:30',DD,'🌉 Brühl Terrace 야경 산책 (도보 15분)',
      '"유럽의 발코니". 엘베강 위 산책로. 야간 조명 받은 도시 전경.'),
    N('2026-09-26','20:30','22:00',DD,'🍖 저녁: Sophienkeller 또는 Pulverturm',
      'Zwinger 옆 지하 술집. Sauerbraten, Klöße. 작센 전통 음식.'),

    // ═══ Day 3: 9/27 (일) Dresden 풀데이 ═══
    N('2026-09-27','08:00','09:00',DD,'☕ Moxy 조식'),
    N('2026-09-27','09:30','11:00',DD,'🏛️ Zwinger Palace 외관 + 정원 (도보 10분)',
      '바로크 궁전 단지. 분수와 정원이 있는 거대한 복합 공간. 내부 박물관 3곳.'),
    N('2026-09-27','11:00','13:00',DD,'🖼️ Old Masters Picture Gallery',
      '★Raphael의 시스티나 마돈나 원본 (그 유명한 두 천사 그림)★. Vermeer, Rembrandt. €14.'),
    N('2026-09-27','13:00','14:30',DD,'🍽️ 점심: Augustiner am Goldenen Ring',
      '바이에른 비어홀. Schweinshaxe (포크 너클) + 둥근 만두.'),
    N('2026-09-27','14:30','15:30',DD,'🏺 Procession of Princes 도자기 벽화',
      '세계 최대 도자기 벽화 (102m). 작센 군주 35명을 마이센 자기 24,000장으로 표현. 무료 외부.'),
    N('2026-09-27','15:30','17:30',DD,'🎨 Albertinum (현대미술)',
      '19-21세기. 카스파 다비드 프리드리히, 모네, 게르하르트 리히터 (드레스덴 출신!). €12.'),
    N('2026-09-27','17:30','18:46',DD,'🌅 Brühl Terrace 일몰 (18:46)',
      '어제와 다른 빛. 일몰 시간대 가장 아름다움.'),
    N('2026-09-27','19:00','21:00',DD,'🍻 저녁: Sophienkeller 또는 Watzke',
      '활기찬 비어홀. 작센 맥주.'),

    // ═══ Day 4: 9/28 (월) Dresden → Berlin ═══
    N('2026-09-28','08:00','09:00',DD,'☕ 조식'),
    P('2026-09-28','09:00','09:30',DD,'🏨 Moxy 체크아웃 + Dresden Hbf 이동',
      '체크아웃 12:00 deadline이지만 일찍. 트램 또는 도보. 짐 들고 역으로.'),
    P('2026-09-28','09:30','11:30',BL,'🚂 ICE: Dresden → Berlin Hbf (~2h 직행)',
      '직항 ICE 자주 있음. 좌석 예약 €4.50.'),
    N('2026-09-28','11:30','12:00',BL,'🚆 Berlin Hbf → 카사 캠퍼 호텔',
      'S-Bahn 또는 U-Bahn. Mitte 지구 Weinmeisterstraße. 약 20분.'),
    N('2026-09-28','12:00','12:30',BL,'🛎️ 호텔 짐 보관 (체크인 15:00)',
      '체크인 시간 전이라 짐만 맡기고 자유.'),
    N('2026-09-28','12:30','13:30',BL,'🌭 점심: Curry 36',
      '베를린 명물 커리부어스트. 짭짤한 소시지 + 감자튀김. 빠르고 가볍게.'),
    N('2026-09-28','13:30','15:00',BL,'🚪 Brandenburger Tor + 홀로코스트 추모비',
      '베를린 상징. 무료 외관. 인근 추모비도 5분 거리. 콘크리트 기둥 2,711개.'),
    P('2026-09-28','15:00','15:30',BL,'🏨 카사 캠퍼 베를린 체크인',
      'Weinmeisterstraße 1, 10178. ☎️ 030-20003410. 짐 풀고 잠시 휴식.'),
    N('2026-09-28','16:00','18:00',BL,'🎨 East Side Gallery (장벽 1.3km 야외)',
      '아티스트 118명 그래피티. ★Fraternal Kiss (브레즈네프-호네커)★. 꿀팁: Oberbaumbrücke 건너 Kreuzberg 쪽에서 사진 찍으면 관광객 없음.'),
    N('2026-09-28','18:00','18:48',BL,'🌅 Spree 강변 일몰 (18:48)',
      'Oberbaumbrücke 또는 Hackesche Höfe 방향.'),
    N('2026-09-28','19:00','21:00',BL,'🍜 저녁: Monsieur Vuong (베트남)',
      'Mitte 지구. 베를린 명물 베트남 쌀국수.'),
    N('2026-09-28','21:00','22:00',BL,'🛌 숙소 복귀'),

    // ═══ Day 5: 9/29 (화) Berlin 박물관 데이 ═══
    N('2026-09-29','08:00','09:00',BL,'☕ The Barn 모닝커피 (Mitte)',
      '베를린 대표 로스터리. 플랫화이트.'),
    N('2026-09-29','09:30','11:30',BL,'🏛️ Boros Collection (사전예약 필수!)',
      '옛 방공호 벙커 개조 현대미술관. 차가운 콘크리트 + 현대 미술. 화-일 운영. 예약 없으면 입장 불가. 가이드 투어 ~90분.'),
    N('2026-09-29','12:00','13:00',BL,'🏛️ Bauhaus-Archiv (임시관)',
      'Knesebeckstraße 1-2. Kandinsky·Klee·Moholy-Nagy·Breuer 가구 원본. 뮤지엄샵 자체가 보물창고.'),
    N('2026-09-29','13:00','14:00',BL,'🥪 점심: Mogg Deli',
      '옛 유대인 여학교 안 델리. 파스트라미 샌드위치.'),
    N('2026-09-29','14:00','15:30',BL,'🏛️ Neue Nationalgalerie (미스 반 데어 로에)',
      '근대 미술관. 건물 자체가 완벽한 유리/철제 예술품. 디자이너라면 전시 안 봐도 공간감 자체가 영감.'),
    N('2026-09-29','15:30','17:00',BL,'🛍️ Andreas Murkudis (Potsdamer Str)',
      '옛 신문사 건물 미니멀 편집숍. 공간 자체가 미술관급. Neue Nationalgalerie에서 도보 10분.'),
    N('2026-09-29','17:00','18:00',BL,'✏️ Modulor 문구점 (Moritzplatz)',
      '전 세계 디자이너 모이는 대형 문구/재료점. 종이·아크릴·가공 재료. 도구 욕심 + 영감 자극.'),
    N('2026-09-29','18:00','18:50',BL,'🛬 Tempelhofer Feld 산책 (일몰)',
      '폐쇄 공항 활주로 그대로 공원. 지평선까지 뻥 뚫린 활주로. 베를린 특유의 해방감. 18:50 일몰.'),
    N('2026-09-29','19:30','21:30',BL,'🍽️ 저녁: Prenzlauer Berg',
      'Lode & Stijn 시즈널 코스 €65 또는 Konnopke\'s Currywurst €3.50.'),

    // ═══ Day 6: 9/30 (수) Berlin 자유 + 마지막 정리 ═══
    N('2026-09-30','08:30','10:00',BL,'🥐 Father Carpenter 브런치 (Mitte)',
      '시그니처 베네딕트 + 커피. 평일 아침 디자인 숍·갤러리 외관 여유롭게.'),
    N('2026-09-30','10:00','11:30',BL,'🏛️ Reichstag 돔 (무료, 예약 필수)',
      'Norman Foster 설계 유리 돔. 무료 오디오가이드 자동 진행. 예약 안 했으면 스킵.'),
    N('2026-09-30','11:30','13:00',BL,'🌳 Tiergarten 가을 산책',
      '베를린 중앙공원. 10월 단풍. Siegessäule(전승기념탑)까지.'),
    N('2026-09-30','13:00','14:30',BL,'🍝 점심 + Tiergarten 카페'),
    N('2026-09-30','14:30','16:30',BL,'🏛️ Jüdisches Museum (Libeskind)',
      '해체주의 건축. 비스듬한 벽, 좁아지는 복도, "Void" 공간. 전시보다 건물 자체 체험. Memory Void 바닥 철 얼굴 2천개 위 걷기.'),
    N('2026-09-30','16:30','17:30',BL,'🛍️ Voo Store (Kreuzberg)',
      'Oranienstraße 숨은 안뜰. Acne·Our Legacy. 베를린 트렌드 한눈에.'),
    N('2026-09-30','17:30','18:30',BL,'🍔 Burgermeister (옛 공중화장실)',
      'Schlesisches Tor. 베를린 컬트 햄버거.'),
    N('2026-09-30','18:30','19:30',BL,'🌅 빅토리아 공원 일몰 (18:50)',
      '인공 폭포 + 언덕. 베를린 시내 전경. 독일 여정 마무리.'),
    N('2026-09-30','20:00','22:00',BL,'🍷 마지막 저녁 + 짐 정리',
      '내일 12:05 비행 — 가볍게 + 일찍 마무리. 짐 다 싸기.'),

    // ═══ Day 7: 10/1 (목) Berlin → Pisa → Tuscany [PIN HEAVY] ═══
    N('2026-10-01','06:30','07:30',BL,'☀️ 기상 + 마지막 짐 점검'),
    N('2026-10-01','07:30','08:00',BL,'🥐 빠른 호텔 조식 (To-go OK)'),
    P('2026-10-01','08:00','08:30',BL,'🏨 카사 캠퍼 체크아웃',
      '체크아웃 12:00 deadline이지만 비행 위해 일찍.'),
    N('2026-10-01','08:30','09:30',BL,'🚆 Berlin Hbf → BER 공항 (S9/FEX ~45분)',
      'BER 공항 직행. €4.40. 캐리어 들고 이동 여유 있게.'),
    N('2026-10-01','09:30','10:30',BL,'🛫 BER 도착 + EasyJet 체크인',
      'EZY 셀프 체크인 키오스크. 20kg 수하물 위탁. ⚠️ 액체 100ml 룰.'),
    N('2026-10-01','10:30','12:00',BL,'🛂 보안 + 출국심사 + 게이트',
      '쉥겐 출국 도장. 한국으로 가는 게 아니라 EU 내 이동이지만 PSA가 솅겐 → 같은 솅겐 → 게이트 직행.'),
    P('2026-10-01','12:05','14:00',PZ,'✈️ EZY5056 BER → PSA (1H 55M)',
      'EasyJet. 좌석 미리 체크인. 기내식 별도 구매.'),
    N('2026-10-01','14:00','14:45',PZ,'🛬 PSA 도착 + 짐 찾기',
      '피사 공항. EU 내 이동이라 입국심사 빠름. 짐 찾고 P5 (Car Rental Terminal) 도보 5분.'),
    P('2026-10-01','14:45','15:30',PZ,'🚗 Eurocar Opel Corsa 픽업 (PSA P5)',
      '⭐ 픽업 예약 시간 14:00이지만 짐 찾고 도착 14:45 정도. 픽업 시 차 360도 영상 + 연료 게이지 사진. "I have full coverage (Comfort+). No additional. Full to Full." Privilege 줄로.'),
    P('2026-10-01','15:30','18:00',PZ,'🛣️ 드라이브: PSA → Pienza (약 2H 30M)',
      '첫 로터리 → "Firenze" 파란 표지 따라 FI-PI-LI. 그 후 A1 → SP146. Autogrill 휴게소 잠깐.'),
    N('2026-10-01','18:00','18:48',PZ,'🌅 Cypress Road 일몰 드라이브 (SP146)',
      '★토스카나 엽서의 그 사이프러스 길★. San Quirico 북쪽. 황금빛 지그재그. 차 세우고 사진. 일몰 18:48.'),
    P('2026-10-01','19:00','19:30',PZ,'🏡 Agriturismo Bagnaia 체크인',
      'Via Podere Bagnaia 47, San Quirico d\'Orcia. ☎️ 0577-898272. 호스트한테 도착 미리 알리기 (이메일/왓츠앱). 무료 주차.'),
    N('2026-10-01','19:30','21:30',PZ,'🍷 호스트 가정식 저녁 + 와인',
      '농장 수제 파스타·올리브오일·치즈. 도착 첫 날 가볍게.'),

    // ═══ Day 8: 10/2 (금) Pienza + Montepulciano ═══
    N('2026-10-02','07:30','08:30',PZ,'🥐 농가 조식',
      '테라스에서 에스프레소. 아침 안개. 농장 계란·리코타·자가제 잼.'),
    N('2026-10-02','09:00','10:00',PZ,'⛪ Cappella di Vitaleta (도보 15분)',
      '★토스카나 엽서 명소★. San Quirico 근처. 비포장길 입구 주차 후 도보. 아침 빛 최고. 사이프러스 둘러싼 예배당.'),
    N('2026-10-02','10:00','12:00',PZ,'🏛️ Pienza 골목 + Piazza Pio II',
      '교황 Pius II가 1459년 Rossellino 시켜 만든 "완벽한 도시" (유네스코). 르네상스 공간 비례. Via dell\'Amore 걷기.'),
    N('2026-10-02','12:00','13:00',PZ,'🧀 Pecorino 시식 + La Bottega del Naturista',
      'Corso Rossellino 치즈가게 20곳. 24개월 숙성 시식. 진공포장 사놓기 (귀국용).'),
    N('2026-10-02','13:00','14:30',PZ,'🍝 점심: Trattoria Latte di Luna',
      'Pienza 현지 맛집. Pici al Ragù (수타면+라구), 양고기. 예약 권장.'),
    N('2026-10-02','14:30','16:00',PZ,'😴 시에스타 (숙소 복귀)',
      '토스카나 한낮 더울 수 있음. 짧은 낮잠.'),
    N('2026-10-02','16:00','16:30',PZ,'🚗 Montepulciano 드라이브 (30분)',
      '⚠️ ZTL 외곽 주차 (P5 또는 마을 입구). Corso 거리 = Piazza Grande까지 오르막.'),
    N('2026-10-02','16:30','18:00',PZ,'🍷 Palazzo Contucci 셀러 투어',
      '16세기 귀족 저택 지하. 500년 된 오크통 줄지어 있는 공간 자체가 볼거리.'),
    N('2026-10-02','18:00','18:30',PZ,'🚗 Tempio di San Biagio 이동'),
    N('2026-10-02','18:30','19:30',PZ,'🌅 Tempio di San Biagio 일몰 (18:46)',
      '마을 밖 언덕에 홀로 선 르네상스 그리스십자형 교회 (1518, Sangallo). 황금빛 사암이 일몰에 진짜 금색.'),
    N('2026-10-02','19:30','20:30',PZ,'🚗 Bagnaia 복귀'),
    N('2026-10-02','20:30','22:00',PZ,'🍽️ 저녁'),

    // ═══ Day 9: 10/3 (토) Siena + Bagno Vignoni ═══
    N('2026-10-03','07:30','08:30',PZ,'🥐 농가 조식'),
    N('2026-10-03','09:00','10:00',PZ,'🚗 Siena 드라이브 (약 50분)',
      '⚠️ Santa Caterina 주차장에 주차! 시내 ZTL 절대 금지. 에스컬레이터로 구시가 진입.'),
    N('2026-10-03','10:00','11:30',PZ,'🟥 Piazza del Campo + 광장 산책',
      '조개껍데기 모양 붉은 벽돌 광장. 9개 구역 = 시에나 9인 정부 상징. 광장 바닥에 앉아 Torre del Mangia 올려다보기.'),
    N('2026-10-03','11:30','13:30',PZ,'⛪ Duomo di Siena ★바닥 모자이크 (10/18까지!)',
      '★흑백 대리석 줄무늬 고딕 걸작. 56개 대리석 상감 모자이크 바닥 — 매년 8/18~10/18만 전체 공개. 10/3은 OK!★ Piccolomini 도서관 프레스코 필수. OPA SI Pass €15 통합권. Porta del Cielo (천국의 문) 지붕 위 도시 뷰 — 온라인 예약.'),
    N('2026-10-03','13:30','15:00',PZ,'🍝 점심 (시에나 시내)',
      'Pici, Ribollita, Pappa al Pomodoro. 광장 근처 트라토리아.'),
    N('2026-10-03','15:00','16:00',PZ,'🍦 젤라또 + 시에나 골목 산책',
      'Grom 또는 Kopa Kabana. 피스타치오 추천.'),
    N('2026-10-03','16:00','16:45',PZ,'🚗 Bagno Vignoni 이동 (약 40분)',
      '마을 중앙 광장이 거대한 온천수로 채워진 독특한 구조.'),
    N('2026-10-03','16:45','18:30',PZ,'♨️ Bagno Vignoni 온천 광장 + 발 담그기',
      '타르코프스키 영화 <노스탤지아> 배경. 광장 한가운데 중세 온천 수조. 아래쪽 Parco dei Mulini에서 무료로 발 담글 수 있는 온천 폭포. 18:44 일몰.'),
    N('2026-10-03','18:30','19:30',PZ,'🚗 Bagnaia 복귀'),
    N('2026-10-03','19:30','21:30',PZ,'🍷 마지막 농가 저녁 + 호스트 작별',
      '내일 출국 — 호스트한테 감사 인사. 짐 정리.'),

    // ═══ Day 10: 10/4 (일) Tuscany → Orvieto → FCO → 출국 ═══
    N('2026-10-04','07:00','08:00',PZ,'☀️ 기상 + 짐 정리 마무리'),
    N('2026-10-04','08:00','09:00',PZ,'🥐 마지막 농가 조식'),
    P('2026-10-04','09:00','09:30',PZ,'🏨 Bagnaia 체크아웃 (10:00 deadline)',
      '체크아웃 + 호스트 작별. 차에 짐 싣기.'),
    N('2026-10-04','09:30','10:30',PZ,'🚗 Bagnaia → Orvieto 드라이브 (약 1H)',
      '응회암 절벽에 얹힌 도시. Campo della Fiera 주차장 → 푸니쿨라로 올라감.'),
    N('2026-10-04','10:30','11:30',PZ,'⛪ Duomo di Orvieto (금빛 파사드)',
      '이탈리아 가장 아름다운 고딕 파사드. 금빛 모자이크 + 대리석 부조. Cappella di San Brizio의 Luca Signorelli "최후의 심판" 프레스코 (미켈란젤로가 연구).'),
    N('2026-10-04','11:30','12:30',PZ,'🕳️ Pozzo di San Patrizio (이중나선)',
      '1527년 우물. 이중 나선 계단 248단 — 내려가는 사람과 올라오는 사람이 절대 마주치지 않는 구조. 디자이너 필수.'),
    N('2026-10-04','12:30','14:00',PZ,'🍝 점심: Trattoria del Moro Aronne',
      '움브리아 가정식. Umbricelli al tartufo (트러플 파스타), 멧돼지 라구. 마지막 이탈리아 점심.'),
    N('2026-10-04','14:00','15:00',PZ,'🛒 Conad/Coop 마트 마지막 쇼핑 🛍️',
      'Marvis 치약(초록·보라), Pocket Coffee (10월부터), 트러플 오일(Savini/Tartufata), Pecorino 진공포장, Chianti 와인 뽁뽁이로 싸기.'),
    P('2026-10-04','15:00','17:00',PZ,'🚗 Orvieto → FCO 드라이브 (약 1H 30M + 여유)',
      'A1 고속도로. ZTL 걱정 제로. 차량 반납 19:15 deadline 절대 늦지 말기.'),
    N('2026-10-04','17:00','17:30',PZ,'⛽ 공항 근처 주유 (Benzina!)',
      '⚠️ Benzina(휘발유) 노즐만! Gasolio(디젤) 절대 X. 공항 10-20km 이내. 영수증 챙기기.'),
    P('2026-10-04','17:30','19:15',PZ,'🚗 Eurocar 차량 반납 (FCO)',
      '반납 deadline 19:15. 직원과 함께 인스펙션. "Damage-free receipt" 받기. 360도 영상 + 연료게이지 사진.'),
    N('2026-10-04','19:15','19:45',PZ,'🚆 셔틀/Leonardo Express → T3',
      '렌트카 반납 후 터미널 이동. 보통 셔틀 5-10분.'),
    N('2026-10-04','19:45','20:30',PZ,'✈️ FCO T3 체크인 + Tax Refund',
      '세관 도장 → Tax Free 카운터. 시간 빠듯 — 도착하자마자 진행.'),
    N('2026-10-04','20:30','21:00',PZ,'🛂 보안 + 게이트',
      'EU 출국 도장. 마지막 에스프레소.'),
    P('2026-10-04','21:15','16:10',PZ,'✈️ TW403 FCO → ICN (11H 55M)',
      '도착: 10/5 (월) 16:10 인천공항. 기내 한국 시간 맞춰 잠.'),
  ];

  // ── 3) 일정 추가 ──
  const ok = confirm(`2단계: 새 일정 ${items.length}개를 추가합니다.\n\n계속할까요?`);
  if (!ok) { console.log('취소됨'); return; }

  console.log(`📅 일정 ${items.length}개 추가 중...`);
  let okCount = 0, failCount = 0;
  for (const it of items) {
    try {
      const obj = { trip_id: tripId, type: '일정', ...it };
      const saved = await fbAdd('journey', obj);
      journeyData.push(saved);
      okCount++;
    } catch (e) {
      console.error('❌ 실패:', it.date, it.time, it.title, e);
      failCount++;
    }
  }

  // ── 4) UI 갱신 ──
  if (typeof renderDayView === 'function') renderDayView();
  if (typeof renderWeekView === 'function') renderWeekView();
  if (typeof renderCityCards === 'function') renderCityCards();

  console.log(`✅ 완료! 추가: ${okCount}, 실패: ${failCount}`);
  alert(`✅ ${okCount}개 일정 추가 완료!\n실패: ${failCount}\n\n새로고침해서 확인하세요.\n📌 표시는 시간 고정 항목 (민트색).`);
})();
