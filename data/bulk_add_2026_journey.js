// ═══════════════════════════════════════════════════════════════
// ATELIER: 2026 독일&이탈리아 일정 일괄 추가 스크립트 v2
// ───────────────────────────────────────────────────────────────
// 도시 일정은 그대로 유지 (Frankfurt 9/25, Dresden 9/26-9/28,
// Berlin 9/28-10/1, Pienza 10/1-10/4). 일정만 추가.
//
// 비행 정보:
//   10/1 Berlin → Pisa: EasyJet EZY5056, BER 12:05 → PSA 14:00 (1h55m)
//
// 사용법:
//   1. Chrome에서 Travel 페이지 열기 (2026 독일&이탈리아 활성)
//   2. F12 → Console 탭
//   3. 이 파일 내용 전체 복사 → 콘솔 붙여넣기 → Enter
//   4. confirm 창에서 "확인"
// ═══════════════════════════════════════════════════════════════

(async function bulkAdd2026JourneyV2() {
  // ── 1) 안전 체크 ──────────────────────────────────────
  if (typeof fbAdd !== 'function') {
    alert('❌ Travel 페이지에서 실행해주세요'); return;
  }
  if (typeof journeyData === 'undefined') {
    alert('❌ journeyData 없음'); return;
  }

  // ── 2) 트립 찾기 (여러 경로로 fallback) ──────────────
  let trip = null;
  let tripId = null;

  // (a) currentTripId 우선 사용 (Travel 페이지에서 설정됨)
  if (typeof currentTripId !== 'undefined' && currentTripId) {
    try {
      const allTrips = await fbRead('trips');
      trip = allTrips.find(t => t._id === currentTripId);
      if (trip) {
        tripId = trip._id;
        console.log('🎒 currentTripId로 찾음:', trip.name);
      }
    } catch(e) { console.warn('trips fbRead 실패:', e); }
  }

  // (b) financeTrips 시도 (Money 페이지 다녀왔으면 있음)
  if (!trip && typeof financeTrips !== 'undefined' && financeTrips.length) {
    trip = financeTrips.find(t =>
      (t.name||'').includes('독일') && (t.name||'').includes('이탈리아')
    );
    if (trip) { tripId = trip._id; console.log('🎒 financeTrips로 찾음:', trip.name); }
  }

  // (c) Firestore에서 trips 직접 조회 + 느슨한 이름 매치
  if (!trip) {
    try {
      const allTrips = await fbRead('trips');
      console.log('📋 전체 트립 목록:', allTrips.map(t => t.name));
      trip = allTrips.find(t =>
        (t.name||'').includes('독일') && (t.name||'').includes('이탈리아')
      );
      if (trip) { tripId = trip._id; console.log('🎒 fbRead로 찾음:', trip.name); }
    } catch(e) { console.error('trips 조회 실패:', e); }
  }

  if (!trip || !tripId) {
    alert('❌ 트립을 찾을 수 없습니다.\n\n콘솔에서 전체 트립 목록 확인하세요.\n없으면 정확한 트립 이름을 알려주세요.');
    return;
  }
  console.log('✅ 최종 트립:', trip.name, '|', tripId);

  // ── 3) 확인 ──────────────────────────────────────────
  const proceed = confirm(
    '2026 독일&이탈리아 트립에 일정 약 70개 추가합니다.\n\n' +
    '도시 일정은 변경하지 않습니다:\n' +
    '  · Frankfurt 9/25 (1박)\n' +
    '  · Dresden 9/26-9/28 (2박)\n' +
    '  · Berlin 9/28-10/1 (3박)\n' +
    '  · Pienza 10/1-10/4 (3박)\n\n' +
    '비행: 10/1 EZY5056 BER 12:05 → PSA 14:00\n\n' +
    '⚠️ 기존 일정이 있으면 중복으로 쌓입니다.\n' +
    '계속할까요?'
  );
  if (!proceed) { console.log('취소됨'); return; }

  // ── 4) 도시명 (citiesData에서 정확한 이름 가져오기) ──
  const cnFrankfurt = 'Frankfurt am Main, 독일';
  const cnDresden = '독일 드레스덴';
  const cnBerlin = 'Berlin, 독일';
  const cnPienza = 'Pienza, 시에나 이탈리아';

  // ── 5) 일정 데이터 ────────────────────────────────────
  const items = [
    // ═══ Day 1: 9/25 (금) Frankfurt 도착 ═══
    { date:'2026-09-25', time:'07:20', city:cnFrankfurt, title:'🚗 인천공항으로 출발',
      description:'리무진/공항철도. 국제선 3시간 전 도착 목표.' },
    { date:'2026-09-25', time:'09:50', city:cnFrankfurt, title:'✈️ 인천 → 프랑크푸르트 (KE/LH 직항)',
      description:'약 12시간. 좌석 미리 체크인. 도착 3시간 전부터 깨어있기(시차 적응).' },
    { date:'2026-09-25', time:'16:50', city:cnFrankfurt, title:'🛬 프랑크푸르트 공항 도착 (FRA)',
      description:'쉥겐 입국. 짐 찾는 데 30분~. S-Bahn S8/S9로 시내 ~15분, €5.85.' },
    { date:'2026-09-25', time:'18:30', city:cnFrankfurt, title:'🏨 호텔 체크인 + 짐 풀기',
      description:'세수·옷 갈아입기. 장거리 비행 찝찝함 씻어내기.' },
    { date:'2026-09-25', time:'19:30', city:cnFrankfurt, title:'🏛️ 뢰머광장 (Römerberg) 산책',
      description:'동화 같은 목조 건물(Ostzeile) 감상. 가볍게.' },
    { date:'2026-09-25', time:'20:30', city:cnFrankfurt, title:'🍻 저녁: Apfelwein + Würstchen',
      description:'프랑크푸르트 명물 사과주(Ebbelwoi). Sachsenhausen 지구 Adolf Wagner 등.' },
    { date:'2026-09-25', time:'21:30', city:cnFrankfurt, title:'🛌 숙소 휴식',
      description:'내일 ICE 일찍 — 일찍 자기.' },

    // ═══ Day 2: 9/26 (토) Frankfurt → Dresden ═══
    { date:'2026-09-26', time:'07:00', city:cnDresden, title:'☀️ 기상 + 호텔 조식' },
    { date:'2026-09-26', time:'08:30', city:cnFrankfurt, title:'🧳 체크아웃, Frankfurt Hbf 이동' },
    { date:'2026-09-26', time:'09:00', city:cnDresden, title:'🚂 ICE: Frankfurt → Dresden (약 4시간 30분)',
      description:'대부분 노선이 라이프치히(Leipzig) 환승. 좌석 예약 권장. 1등석이면 DB Lounge.' },
    { date:'2026-09-26', time:'13:30', city:cnDresden, title:'🛬 Dresden Hbf 도착',
      description:'중앙역에서 도심까지 트램으로 10분.' },
    { date:'2026-09-26', time:'14:30', city:cnDresden, title:'🏨 Dresden 호텔 체크인 + 짐 풀기' },
    { date:'2026-09-26', time:'15:30', city:cnDresden, title:'🌉 Brühl Terrace ("유럽의 발코니")',
      description:'엘베강 위 산책로. 작센 왕가가 만든 도시 옥상. 도시 전경.' },
    { date:'2026-09-26', time:'16:30', city:cnDresden, title:'⛪ Frauenkirche 외관 + Neumarkt',
      description:'WWII에 파괴되었다 2005년 재건된 바로크 교회. 광장에 앉아 시간 보내기.' },
    { date:'2026-09-26', time:'18:30', city:cnDresden, title:'🌅 Elbe 강변 일몰',
      description:'Brühl Terrace 또는 Augustusbrücke 다리 위. 작센 일몰.' },
    { date:'2026-09-26', time:'20:00', city:cnDresden, title:'🍖 저녁: 작센 전통 음식',
      description:'Sophienkeller (Zwinger 옆 지하 술집) — Sauerbraten, Klöße. 또는 Pulverturm.' },
    { date:'2026-09-26', time:'21:30', city:cnDresden, title:'🛌 숙소' },

    // ═══ Day 3: 9/27 (일) Dresden 풀데이 ═══
    { date:'2026-09-27', time:'08:00', city:cnDresden, title:'☕ 호텔 조식' },
    { date:'2026-09-27', time:'09:30', city:cnDresden, title:'🏛️ Zwinger Palace (바로크 궁전 단지)',
      description:'분수와 정원이 있는 거대한 바로크 궁전. 내부에 박물관 3곳. 외관과 정원만 봐도 1시간.' },
    { date:'2026-09-27', time:'10:30', city:cnDresden, title:'🖼️ Old Masters Picture Gallery (Sistine Madonna)',
      description:'Zwinger 안. Raphael의 ★시스티나 마돈나★ (그 유명한 두 천사 그림 원본!). Vermeer, Rembrandt. €14.' },
    { date:'2026-09-27', time:'13:00', city:cnDresden, title:'🍽️ 점심: Sophienkeller 또는 Augustiner',
      description:'작센 전통 요리. 일요일 점심 늦으면 줄.' },
    { date:'2026-09-27', time:'14:30', city:cnDresden, title:'🏺 Procession of Princes (Fürstenzug)',
      description:'세계 최대 도자기 벽화 (102m). 작센 군주 35명을 마이센 자기 24,000장으로 표현. 무료 외부 관람.' },
    { date:'2026-09-27', time:'15:30', city:cnDresden, title:'🎨 Albertinum (현대미술)',
      description:'19-21세기 작품. 카스파 다비드 프리드리히, 모네, 게르하르트 리히터 (드레스덴 출신!). €12.' },
    { date:'2026-09-27', time:'17:30', city:cnDresden, title:'🌅 Brühl Terrace 일몰 (재방문)',
      description:'어제와 다른 빛. 일몰 시간대 가장 아름다움.' },
    { date:'2026-09-27', time:'19:00', city:cnDresden, title:'🍻 저녁: Augustiner am Goldenen Ring',
      description:'바이에른 비어홀. Schweinshaxe (포크 너클) + 둥근 만두. 활기찬 분위기.' },
    { date:'2026-09-27', time:'21:30', city:cnDresden, title:'🛌 숙소' },

    // ═══ Day 4: 9/28 (월) Dresden → Berlin ═══
    { date:'2026-09-28', time:'08:00', city:cnDresden, title:'☕ 조식 + 체크아웃' },
    { date:'2026-09-28', time:'09:30', city:cnBerlin, title:'🚂 ICE: Dresden → Berlin (약 2시간 직행)',
      description:'직항 ICE 자주 있음. Berlin Hbf 도착.' },
    { date:'2026-09-28', time:'11:30', city:cnBerlin, title:'🛬 Berlin Hbf 도착' },
    { date:'2026-09-28', time:'12:30', city:cnBerlin, title:'🏨 Berlin 호텔 체크인 + 짐 보관',
      description:'Marta\'s Hotel 또는 Mitte 지구. 체크인 안 되면 짐만.' },
    { date:'2026-09-28', time:'13:00', city:cnBerlin, title:'🌭 Curry 36 점심',
      description:'베를린 명물 커리부어스트. 짭짤한 소시지 + 감자튀김. 빠르고 가볍게.' },
    { date:'2026-09-28', time:'14:30', city:cnBerlin, title:'🚪 Brandenburger Tor + 홀로코스트 추모비',
      description:'베를린 상징. 무료 외관. 인근 추모비도 5분 거리.' },
    { date:'2026-09-28', time:'16:00', city:cnBerlin, title:'🎨 East Side Gallery (장벽 1.3km 야외)',
      description:'아티스트 118명 그래피티. ★Fraternal Kiss(브레즈네프-호네커)★. 꿀팁: Oberbaumbrücke 건너 Kreuzberg 쪽에서 사진 찍으면 관광객 없음.' },
    { date:'2026-09-28', time:'18:30', city:cnBerlin, title:'🌅 Spree 강변 일몰 + Hackesche Höfe',
      description:'아르누보 안뜰 8개 복합공간. Ampelmann 본점, Das Neue Schwarz 빈티지.' },
    { date:'2026-09-28', time:'20:00', city:cnBerlin, title:'🍽️ 저녁: Mitte 또는 베트남 쌀국수',
      description:'Monsieur Vuong 추천 (베를린은 베트남 음식 유명).' },
    { date:'2026-09-28', time:'21:30', city:cnBerlin, title:'🛌 숙소' },

    // ═══ Day 5: 9/29 (화) Berlin (박물관 데이) ═══
    { date:'2026-09-29', time:'08:00', city:cnBerlin, title:'☕ The Barn 모닝커피',
      description:'베를린 대표 로스터리. 플랫화이트 한 잔.' },
    { date:'2026-09-29', time:'09:30', city:cnBerlin, title:'🏛️ Boros Collection (사전예약 필수!)',
      description:'옛 방공호 벙커 개조 현대미술관. 차가운 콘크리트 + 현대 미술. 화-일 운영. 예약 없으면 입장 불가.' },
    { date:'2026-09-29', time:'11:30', city:cnBerlin, title:'🏛️ Bauhaus-Archiv (임시관)',
      description:'Knesebeckstraße 1-2. Kandinsky·Klee·Moholy-Nagy·Breuer 가구 원본. 뮤지엄샵 자체가 보물창고.' },
    { date:'2026-09-29', time:'13:00', city:cnBerlin, title:'🥪 점심: Mogg Deli',
      description:'옛 유대인 여학교 안 델리. 파스트라미 샌드위치 유명.' },
    { date:'2026-09-29', time:'14:30', city:cnBerlin, title:'🏛️ Neue Nationalgalerie (미스 반 데어 로에 설계)',
      description:'근대 미술관 — 건물 자체가 완벽한 유리/철제 예술품. 디자이너라면 전시 안 봐도 공간감 자체가 영감.' },
    { date:'2026-09-29', time:'16:00', city:cnBerlin, title:'🛍️ Andreas Murkudis (편집숍)',
      description:'Potsdamer Str 옛 신문사 건물. 미니멀 편집숍. 공간 자체가 미술관급. 도보 10분.' },
    { date:'2026-09-29', time:'17:00', city:cnBerlin, title:'✏️ Modulor 문구점 (Moritzplatz)',
      description:'전 세계 디자이너 모이는 대형 문구/재료점. 종이·아크릴·가공 재료. 작가 도구 욕심+영감 자극.' },
    { date:'2026-09-29', time:'18:30', city:cnBerlin, title:'🛬 Tempelhofer Feld 산책 (옛 공항 활주로)',
      description:'폐쇄 공항을 그대로 공원으로. 지평선까지 뻥 뚫린 활주로. 베를린 특유의 해방감.' },
    { date:'2026-09-29', time:'20:00', city:cnBerlin, title:'🍽️ 저녁: Prenzlauer Berg',
      description:'Lode & Stijn 시즈널 코스 €65 또는 Konnopke\'s Currywurst €3.50.' },
    { date:'2026-09-29', time:'21:30', city:cnBerlin, title:'🛌 숙소' },

    // ═══ Day 6: 9/30 (수) Berlin 자유 ═══
    { date:'2026-09-30', time:'08:30', city:cnBerlin, title:'🥐 Father Carpenter 브런치',
      description:'시그니처 베네딕트 + 커피. 평일 아침 미테 디자인 숍·갤러리 외관 여유롭게 관찰.' },
    { date:'2026-09-30', time:'10:00', city:cnBerlin, title:'🏛️ Reichstag 돔 (무료, 예약 필수)',
      description:'Norman Foster 설계 유리 돔. 무료 오디오가이드 자동 진행. 예약 안 했으면 스킵.' },
    { date:'2026-09-30', time:'11:30', city:cnBerlin, title:'🌳 Tiergarten 가을 산책',
      description:'베를린 중앙공원. 10월 단풍. Siegessäule (전승기념탑)까지.' },
    { date:'2026-09-30', time:'13:00', city:cnBerlin, title:'🍝 점심: Mitte 또는 Tiergarten 근처' },
    { date:'2026-09-30', time:'14:30', city:cnBerlin, title:'🏛️ Jüdisches Museum (Libeskind 건축)',
      description:'해체주의 건축. 비스듬한 벽, 좁아지는 복도, "Void" 공간. 전시보다 건물 자체 체험. Memory Void 바닥 철 얼굴 2천개 위를 걷는 경험.' },
    { date:'2026-09-30', time:'16:30', city:cnBerlin, title:'🛍️ Voo Store + Kreuzberg 편집숍',
      description:'Oranienstraße 숨은 안뜰. Acne·Our Legacy. 베를린 트렌드 한눈에.' },
    { date:'2026-09-30', time:'17:30', city:cnBerlin, title:'🍔 Burgermeister (옛 공중화장실 햄버거집)',
      description:'Schlesisches Tor. 베를린 컬트 햄버거. 줄 길지만 빠름.' },
    { date:'2026-09-30', time:'18:30', city:cnBerlin, title:'🌅 빅토리아 공원 일몰 (Viktoriapark)',
      description:'인공 폭포 + 언덕. 베를린 시내 전경 + 일몰. 10월 초 쌀쌀한 저녁 공기. 독일 여정 마무리.' },
    { date:'2026-09-30', time:'20:00', city:cnBerlin, title:'🍷 마지막 저녁: Katz Orange 또는 좋아하는 곳',
      description:'예쁜 안뜰 파인다이닝. "slow-roasted duck for two" €48. 또는 그냥 베트남.' },
    { date:'2026-09-30', time:'22:00', city:cnBerlin, title:'🧳 짐 정리 (내일 12:05 비행)' },

    // ═══ Day 7: 10/1 (목) Berlin → Pisa → Tuscany ═══
    { date:'2026-10-01', time:'07:00', city:cnBerlin, title:'☀️ 기상, 마지막 짐 정리' },
    { date:'2026-10-01', time:'07:30', city:cnBerlin, title:'🥐 빠른 호텔 조식 (To-go도 OK)' },
    { date:'2026-10-01', time:'08:30', city:cnBerlin, title:'🧳 체크아웃 → BER 공항 이동',
      description:'Berlin Hbf → S9 또는 FEX → BER 공항. 약 35-45분. €4.40. 여유 있게.' },
    { date:'2026-10-01', time:'10:00', city:cnBerlin, title:'🛫 BER 도착 + EasyJet 체크인',
      description:'EZY5056. 수하물 20kg. EasyJet 셀프 체크인 키오스크. 보안 줄 여유 있게.' },
    { date:'2026-10-01', time:'12:05', city:cnBerlin, title:'✈️ EZY5056: BER → PSA (1h 55m)',
      description:'베를린 → 피사. 좌석 미리 체크인. 기내식 별도 구매.' },
    { date:'2026-10-01', time:'14:00', city:cnPienza, title:'🛬 PSA (피사 공항) 도착',
      description:'EU 내 이동 입국심사 빠름. 짐 찾고 P5 (Car Rental Terminal) 도보 5분.' },
    { date:'2026-10-01', time:'14:30', city:cnPienza, title:'🚗 Europcar Opel Corsa 픽업 (P5)',
      description:'⭐ 360도 영상 + 연료 게이지 사진. Comfort+ 풀커버 확인. "I have Comfort+, no additional coverage. Full to Full, please." Privilege 줄로.' },
    { date:'2026-10-01', time:'15:30', city:cnPienza, title:'🛣️ 드라이브 시작: 피사 → Pienza (~2h 30m)',
      description:'첫 로터리에서 파란 표지 "Firenze" 따라 FI-PI-LI 진입. 그 후 A1 → SP146. 휴게소(Autogrill)에서 잠시 쉬기.' },
    { date:'2026-10-01', time:'18:00', city:cnPienza, title:'🌅 Cypress Road 일몰 드라이브 (SP146)',
      description:'San Quirico 북쪽. 그 유명한 토스카나 엽서 장면. 황금빛 사이프러스 지그재그 길. 차 세우고 사진.' },
    { date:'2026-10-01', time:'18:48', city:cnPienza, title:'🌇 SUNSET 18:48',
      description:'10/1 토스카나 일몰 시간.' },
    { date:'2026-10-01', time:'19:30', city:cnPienza, title:'🏡 Agriturismo Bagnaia 체크인 (10/1-10/4)',
      description:'San Quirico d\'Orcia 외곽. 무료 주차. 호스트한테 도착 시간 미리 알리기.' },
    { date:'2026-10-01', time:'20:30', city:cnPienza, title:'🍷 호스트 가정식 저녁 + 와인',
      description:'농장 수제 파스타·올리브오일·치즈. 도착 첫 날 가볍게. 아쿠아 프리잔테(탄산수).' },

    // ═══ Day 8: 10/2 (금) Pienza + Montepulciano ═══
    { date:'2026-10-02', time:'07:21', city:cnPienza, title:'🌅 일출 07:21' },
    { date:'2026-10-02', time:'08:00', city:cnPienza, title:'🥐 농가 조식',
      description:'테라스에서 에스프레소. 아침 안개가 사이프러스 언덕에 깔리는 장면. 농장 계란·리코타·자가제 잼.' },
    { date:'2026-10-02', time:'09:00', city:cnPienza, title:'⛪ Cappella di Vitaleta (엽서 명소!)',
      description:'San Quirico 근처. 비포장길 입구 주차 후 도보 15분. 아침 빛 최고. 사이프러스 둘러싼 예배당.' },
    { date:'2026-10-02', time:'10:30', city:cnPienza, title:'🏛️ Pienza 골목 + Piazza Pio II',
      description:'교황 Pius II가 1459년 Rossellino 시켜 만든 "완벽한 도시" (유네스코). 르네상스 공간 비례 공부. Via dell\'Amore 걷기.' },
    { date:'2026-10-02', time:'12:00', city:cnPienza, title:'🧀 Pecorino 시식 + La Bottega del Naturista 트러플',
      description:'Corso Rossellino에 치즈가게 20곳. 24개월 숙성 시식. 진공포장 사놓기 (귀국용).' },
    { date:'2026-10-02', time:'13:00', city:cnPienza, title:'🍝 점심: Trattoria Latte di Luna',
      description:'Pienza 현지 맛집. Pici al Ragù (수타면+라구), 양고기 구이. 예약 권장.' },
    { date:'2026-10-02', time:'14:30', city:cnPienza, title:'😴 시에스타 (숙소)',
      description:'토스카나 한낮은 더울 수 있음. 짧은 낮잠.' },
    { date:'2026-10-02', time:'16:00', city:cnPienza, title:'🚗 Montepulciano 드라이브 (~30분)',
      description:'언덕 꼭대기 중세 마을. ZTL 외곽 주차 (P5 또는 마을 입구). Corso 거리가 Piazza Grande까지 오르막.' },
    { date:'2026-10-02', time:'17:00', city:cnPienza, title:'🍷 Palazzo Contucci 셀러 투어',
      description:'16세기 귀족 저택 지하. 500년 된 오크통이 줄지어 있는 공간 자체가 볼거리. 시음 스킵해도 됨.' },
    { date:'2026-10-02', time:'18:30', city:cnPienza, title:'🌅 Tempio di San Biagio 일몰',
      description:'마을 밖 언덕에 홀로 선 르네상스 그리스십자형 교회 (1518, Antonio da Sangallo). 황금빛 사암이 일몰에 진짜 금색.' },
    { date:'2026-10-02', time:'20:30', city:cnPienza, title:'🍽️ 저녁 (Pienza 또는 농가)' },

    // ═══ Day 9: 10/3 (토) Siena + Bagno Vignoni ═══
    { date:'2026-10-03', time:'07:30', city:cnPienza, title:'🥐 농가 조식' },
    { date:'2026-10-03', time:'09:00', city:cnPienza, title:'🚗 Siena 드라이브 (약 50분)',
      description:'⚠️ Santa Caterina 주차장에 주차! 시내 ZTL 절대 금지. 에스컬레이터로 구시가 진입.' },
    { date:'2026-10-03', time:'10:30', city:cnPienza, title:'🟥 Piazza del Campo',
      description:'조개껍데기 모양 붉은 벽돌 광장. 9개 구역 = 시에나 9인 정부 상징. 광장 바닥에 앉아 Torre del Mangia 올려다보기.' },
    { date:'2026-10-03', time:'11:30', city:cnPienza, title:'⛪ Duomo di Siena ★바닥 모자이크 (10/18까지!)',
      description:'★흑백 대리석 줄무늬 고딕 걸작. 56개 대리석 상감 모자이크 바닥 — 매년 8/18~10/18만 전체 공개. 10/3은 OK!★ Piccolomini 도서관 프레스코 필수. OPA SI Pass €15 통합권. 꿀팁: Porta del Cielo(천국의 문) 추가하면 지붕 위 도시 뷰 — 온라인 예약 필수.' },
    { date:'2026-10-03', time:'13:30', city:cnPienza, title:'🍝 점심 (시에나 시내)',
      description:'Pici, Ribollita, Pappa al Pomodoro 추천. 광장 근처 트라토리아.' },
    { date:'2026-10-03', time:'15:00', city:cnPienza, title:'🍦 젤라또 + 시에나 산책',
      description:'Grom 또는 Kopa Kabana. 피스타치오 추천. 시에나 골목 골목.' },
    { date:'2026-10-03', time:'16:30', city:cnPienza, title:'♨️ Bagno Vignoni 이동 (약 40분)',
      description:'마을 중앙 광장이 거대한 온천수로 채워진 독특한 구조.' },
    { date:'2026-10-03', time:'17:30', city:cnPienza, title:'🌊 Bagno Vignoni 온천 광장',
      description:'타르코프스키 영화 <노스탤지아> 배경. 광장 한가운데 중세 온천 수조. 아래쪽 Parco dei Mulini에서 무료로 발 담글 수 있는 온천 폭포.' },
    { date:'2026-10-03', time:'18:46', city:cnPienza, title:'🌅 SUNSET 발 담그며',
      description:'10/3 일몰. Parco dei Mulini에서 발 담그며 일몰 감상.' },
    { date:'2026-10-03', time:'20:00', city:cnPienza, title:'🍽️ 저녁: Bagnaia 복귀 + 호스트 가정식',
      description:'마지막 농가 저녁. 와인 곁들이기.' },

    // ═══ Day 10: 10/4 (일) Tuscany → Orvieto → FCO → ICN ═══
    { date:'2026-10-04', time:'07:00', city:cnPienza, title:'☀️ 기상 + 짐 정리' },
    { date:'2026-10-04', time:'08:00', city:cnPienza, title:'🥐 마지막 농가 조식 + Bagnaia 체크아웃' },
    { date:'2026-10-04', time:'09:00', city:cnPienza, title:'🚗 Orvieto 드라이브 (약 1시간, FCO 가는 길)',
      description:'응회암 절벽에 얹힌 도시. Campo della Fiera 주차장 → 푸니쿨라로 올라감.' },
    { date:'2026-10-04', time:'10:00', city:cnPienza, title:'⛪ Duomo di Orvieto (금빛 파사드)',
      description:'이탈리아 가장 아름다운 고딕 파사드. 금빛 모자이크 + 대리석 부조. Cappella di San Brizio의 Luca Signorelli "최후의 심판" 프레스코 (미켈란젤로가 연구).' },
    { date:'2026-10-04', time:'11:30', city:cnPienza, title:'🕳️ Pozzo di San Patrizio (이중나선)',
      description:'1527년 우물. 이중 나선 계단 248단 — 내려가는 사람과 올라오는 사람이 절대 마주치지 않는 구조. 디자이너 필수.' },
    { date:'2026-10-04', time:'12:30', city:cnPienza, title:'🍝 점심: Trattoria del Moro Aronne',
      description:'움브리아 가정식. Umbricelli al tartufo (트러플 파스타), 멧돼지 라구.' },
    { date:'2026-10-04', time:'14:00', city:cnPienza, title:'🛒 마트 마지막 쇼핑 🛍️',
      description:'Marvis 치약(초록·보라), Pocket Coffee, 트러플 오일(Savini/Tartufata), Pecorino 진공포장. Conad 또는 Coop 큰 매장에서.' },
    { date:'2026-10-04', time:'15:00', city:cnPienza, title:'🚗 FCO(로마 피우미치노) 출발 (약 1시간 30분)',
      description:'A1 고속도로. ZTL 걱정 제로.' },
    { date:'2026-10-04', time:'16:30', city:cnPienza, title:'⛽ 공항 근처 주유 (Benzina!)',
      description:'⚠️ Benzina(휘발유) 노즐만. Gasolio(디젤) 절대 X. 공항 10-20km 이내. 영수증 챙기기.' },
    { date:'2026-10-04', time:'17:00', city:cnPienza, title:'🚗 Europcar 차량 반납 (FCO)',
      description:'직원과 함께 인스펙션. "Damage-free receipt" 받기. 360도 영상 + 연료게이지 사진.' },
    { date:'2026-10-04', time:'18:00', city:cnPienza, title:'✈️ FCO 체크인 + Tax Refund',
      description:'세관 도장 → Tax Free 카운터. 면세점 가볍게 구경. 마지막 에스프레소.' },
    { date:'2026-10-04', time:'21:15', city:cnPienza, title:'✈️ FCO → ICN 출국',
      description:'KE/AZ 직항 약 11-12시간. 기내 시간 한국 시간 맞춰 잠.' },
  ];

  // ── 6) 일정 일괄 추가 ──────────────────────────────────
  console.log(`📅 일정 ${items.length}개 추가 중...`);
  let ok = 0, fail = 0;
  for (const it of items) {
    try {
      const obj = {
        trip_id: tripId,
        type: '일정',
        date: it.date,
        time: it.time,
        end_time: '',
        city: it.city,
        title: it.title,
        description: it.description || ''
      };
      const saved = await fbAdd('journey', obj);
      journeyData.push(saved);
      ok++;
    } catch (e) {
      console.error('❌ 실패:', it.date, it.time, it.title, e);
      fail++;
    }
  }

  // ── 7) UI 갱신 ────────────────────────────────────────
  if (typeof renderDayView === 'function') renderDayView();
  if (typeof renderWeekView === 'function') renderWeekView();
  if (typeof renderCityCards === 'function') renderCityCards();

  console.log(`✅ 완료! 추가: ${ok}, 실패: ${fail}`);
  alert(`✅ 일정 ${ok}개 추가 완료!\n실패: ${fail}\n\n페이지 새로고침 후 확인하세요.`);
})();
