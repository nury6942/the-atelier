// ═══════════════════════════════════════════════════════════════
// ATELIER: 2026 독일&이탈리아 일정 일괄 추가 스크립트
// ───────────────────────────────────────────────────────────────
// 사용법:
//   1. Chrome에서 Travel 페이지(https://nury6942.github.io/the-atelier/) 열기
//   2. F12 → Console 탭
//   3. 이 파일 내용 전체 복사 → 콘솔에 붙여넣기 → Enter
//   4. confirm 창에서 "확인" → 잠시 후 알림 뜸
// ═══════════════════════════════════════════════════════════════

(async function bulkAdd2026Journey() {
  // ── 1) 안전 체크 ──────────────────────────────────────────
  if (typeof fbAdd !== 'function' || typeof fbUpdate !== 'function' || typeof fbDelete !== 'function') {
    alert('❌ Travel 페이지에서 실행해주세요 (fbAdd 함수를 찾을 수 없음)');
    return;
  }
  if (typeof citiesData === 'undefined' || typeof journeyData === 'undefined') {
    alert('❌ Travel 페이지에서 실행해주세요 (citiesData/journeyData 없음)');
    return;
  }

  // ── 2) 트립 찾기 ──────────────────────────────────────────
  const trips = (typeof financeTrips !== 'undefined' ? financeTrips : []);
  const trip = trips.find(t => t.name === '2026 독일&이탈리아');
  if (!trip) { alert('❌ "2026 독일&이탈리아" 트립을 찾을 수 없습니다'); return; }
  const tripId = trip._id;
  console.log('🎒 Trip:', trip.name, '|', tripId);

  // ── 3) 확인 ──────────────────────────────────────────────
  const proceed = confirm(
    '2026 독일&이탈리아 트립에:\n\n' +
    '1) 도시 일정 업데이트\n' +
    '   - 드레스덴 삭제\n' +
    '   - 베를린: 9/26 → 9/29\n' +
    '   - 피엔차(토스카나): 9/29 → 10/4\n\n' +
    '2) 일정 약 60개 일괄 추가\n\n' +
    '계속할까요?'
  );
  if (!proceed) { console.log('취소됨'); return; }

  // ── 4) 도시 일정 업데이트 ──────────────────────────────
  console.log('📍 도시 일정 업데이트 중...');
  try {
    const tripCities = await fbRead('trip_cities');
    const mine = tripCities.filter(c => c.trip_id === tripId);

    // 드레스덴 삭제
    const dresden = mine.find(c => (c.name||'').includes('드레스덴'));
    if (dresden) {
      await fbDelete('trip_cities', dresden._id);
      console.log('  🗑 드레스덴 삭제');
    }

    // 베를린 업데이트
    const berlin = mine.find(c => (c.name||'').toLowerCase().includes('berlin'));
    if (berlin) {
      const u = { start_date: '2026-09-26', end_date: '2026-09-29', nights: 3 };
      await fbUpdate('trip_cities', berlin._id, u);
      Object.assign(berlin, u);
      console.log('  ✏️ 베를린: 9/26 → 9/29 (3박)');
    }

    // 피엔차 업데이트
    const pienza = mine.find(c => (c.name||'').toLowerCase().includes('pienza'));
    if (pienza) {
      const u = { start_date: '2026-09-29', end_date: '2026-10-04', nights: 5 };
      await fbUpdate('trip_cities', pienza._id, u);
      Object.assign(pienza, u);
      console.log('  ✏️ 피엔차/Val d\'Orcia: 9/29 → 10/4 (5박)');
    }

    // 전역 citiesData 갱신 (현재 트립이면)
    if (typeof currentTripId !== 'undefined' && currentTripId === tripId) {
      const refreshed = (await fbRead('trip_cities')).filter(c => c.trip_id === tripId);
      citiesData.length = 0;
      refreshed.forEach(c => citiesData.push(c));
    }
  } catch (e) {
    console.error('❌ 도시 업데이트 실패:', e);
    if (!confirm('도시 업데이트 일부 실패. 일정 추가는 계속할까요?')) return;
  }

  // ── 5) 일정 데이터 ────────────────────────────────────
  const FF = 'Frankfurt am Main, 독일';
  const BL = 'Berlin, 독일';
  const PZ = 'Pienza, 시에나 이탈리아';

  const items = [
    // ═══ Day 1: 9/25 (금) Frankfurt 도착 ═══
    { date:'2026-09-25', time:'07:20', city:FF, title:'🚗 인천공항으로 출발',
      description:'리무진/공항철도. 국제선 3시간 전 도착 목표.' },
    { date:'2026-09-25', time:'09:50', city:FF, title:'✈️ 인천 → 프랑크푸르트 (KE/LH 직항)',
      description:'약 12시간 비행. 좌석 미리 체크인. 기내식 후 시차 적응 위해 도착 3-4시간 전 깨어있기.' },
    { date:'2026-09-25', time:'16:50', city:FF, title:'🛬 프랑크푸르트 공항 도착 (FRA)',
      description:'쉥겐 입국심사. 짐 찾는 데 30분~. S-Bahn S8/S9로 시내 (~15분, €5.85).' },
    { date:'2026-09-25', time:'18:30', city:FF, title:'🏨 호텔 체크인 + 짐 풀기',
      description:'세수·옷 갈아입기. 장거리 비행 찝찝함 씻어내기.' },
    { date:'2026-09-25', time:'19:30', city:FF, title:'🏛️ 뢰머광장 (Römerberg) 산책',
      description:'동화 같은 목조 건물(Ostzeile) 감상. 가볍게 걸으며 독일 입국 실감.' },
    { date:'2026-09-25', time:'20:30', city:FF, title:'🍻 저녁: Apfelwein + Frankfurter Würstchen',
      description:'프랑크푸르트 명물 사과주(Ebbelwoi). Sachsenhausen 지구에 정통 술집 많음 (Adolf Wagner 등).' },
    { date:'2026-09-25', time:'21:30', city:FF, title:'🛌 숙소 복귀, 휴식',
      description:'다음 날 ICE 일찍 타니 일찍 자기.' },

    // ═══ Day 2: 9/26 (토) Frankfurt → Berlin ═══
    { date:'2026-09-26', time:'07:00', city:BL, title:'☀️ 기상 + 호텔 조식' },
    { date:'2026-09-26', time:'08:30', city:BL, title:'🚂 ICE 탑승 (Frankfurt Hbf → Berlin Hbf)',
      description:'약 4시간 직행. 1등석이면 DB Lounge 사용 가능. 좌석 예약 권장. 창밖 독일 시골 풍경 + 다운받아둔 플레이리스트.' },
    { date:'2026-09-26', time:'13:00', city:BL, title:'🏨 Berlin 호텔 체크인 + 짐 보관',
      description:'Marta\'s Hotel 또는 미테 지구. 체크인 안 되면 짐만 맡기고 외출.' },
    { date:'2026-09-26', time:'14:00', city:BL, title:'🌭 Curry 36 (커리부어스트 점심)',
      description:'베를린 명물. 짭짤한 소시지 + 감자튀김. 빠르고 가볍게.' },
    { date:'2026-09-26', time:'15:30', city:BL, title:'🚪 브란덴부르크 문 (Brandenburger Tor)',
      description:'베를린 상징. 무료 외관 감상. 인근 홀로코스트 추모비도 5분 거리.' },
    { date:'2026-09-26', time:'16:30', city:BL, title:'🎨 이스트사이드 갤러리 (East Side Gallery)',
      description:'베를린 장벽 1.3km 야외 갤러리. 아티스트 118명. 대표작 "Fraternal Kiss". 꿀팁: Oberbaumbrücke 건너 Kreuzberg 쪽에서 사진 찍으면 관광객 없음.' },
    { date:'2026-09-26', time:'18:45', city:BL, title:'🌅 일몰: Spree 강변 또는 Hackescher Höfe',
      description:'아르누보 안뜰 복합공간. Ampelmann 본점, Das Neue Schwarz 빈티지 샵.' },
    { date:'2026-09-26', time:'20:00', city:BL, title:'🍽️ 저녁: Prenzlauer Berg',
      description:'Lode & Stijn (네덜란드 셰프 시즈널 €65) 또는 Konnopke\'s Imbiß (Currywurst €3.50).' },
    { date:'2026-09-26', time:'21:30', city:BL, title:'🛌 숙소 휴식' },

    // ═══ Day 3: 9/27 (일) Berlin (벼룩시장 데이) ═══
    { date:'2026-09-27', time:'08:30', city:BL, title:'☕ 미테 산책 + The Barn 모닝커피',
      description:'로스터리 카페. 플랫화이트 한 잔. 일요일 아침 베를린 사람들의 여유.' },
    { date:'2026-09-27', time:'10:00', city:BL, title:'🛍️ Mauer Park 벼룩시장 (일요일 ONLY!)',
      description:'⭐ 메인 입구 잡동사니 말고 안쪽 골목 — 동독(DDR) 빈티지 소품, 옛 타이포 포스터, 핀 뱃지. 원형 경기장 버스킹 공연도.' },
    { date:'2026-09-27', time:'13:00', city:BL, title:'🥪 점심: Mogg Deli',
      description:'옛 유대인 여학교 안 델리. 파스트라미 샌드위치 유명.' },
    { date:'2026-09-27', time:'14:00', city:BL, title:'🚦 Ampelmann 본점 + Hackesche Höfe',
      description:'동베를린 신호등 캐릭터 굿즈. 에코백·키링 추천. 아르누보 안뜰 8개.' },
    { date:'2026-09-27', time:'16:00', city:BL, title:'🛒 Voo Store (Kreuzberg 편집숍)',
      description:'Oranienstraße 숨은 안뜰. Acne·Our Legacy. 베를린 현재 트렌드 한눈에.' },
    { date:'2026-09-27', time:'17:00', city:BL, title:'🍔 Burgermeister (옛 공중화장실 햄버거집)',
      description:'Schlesisches Tor 역 옆. 베를린 명물 컬트 햄버거.' },
    { date:'2026-09-27', time:'18:30', city:BL, title:'🌅 빅토리아 공원 일몰 (Viktoriapark)',
      description:'인공 폭포 + 언덕. 베를린 시내 전경 + 일몰. 10월 초 쌀쌀한 저녁 공기.' },
    { date:'2026-09-27', time:'20:00', city:BL, title:'🍜 저녁: 베트남 쌀국수 (미테 지구)',
      description:'베를린은 베트남 음식 유명. Monsieur Vuong 등.' },
    { date:'2026-09-27', time:'21:30', city:BL, title:'🛌 숙소 휴식' },

    // ═══ Day 4: 9/28 (월) Berlin (월요일 휴관 ⚠️) ═══
    { date:'2026-09-28', time:'08:30', city:BL, title:'🥐 브런치: Father Carpenter (Mitte)',
      description:'시그니처 베네딕트 + 커피. 평일 아침 미테 골목 디자인 숍·갤러리 외관 여유롭게 관찰.' },
    { date:'2026-09-28', time:'10:00', city:BL, title:'⚠️ 월요일: 박물관 대부분 휴관 (야외/쇼핑 중심)',
      description:'Boros Collection·Bauhaus·Neue Nationalgalerie 모두 월요일 휴관. 내일(화)로 미루기.' },
    { date:'2026-09-28', time:'10:30', city:BL, title:'🌊 Holzmarkt 25 (슈프레 강변)',
      description:'대안문화 콤플렉스. 컨테이너+목조 보헤미안 공간. Fritz-Limo 추천.' },
    { date:'2026-09-28', time:'12:30', city:BL, title:'✈️ Tempelhofer Feld (옛 공항 활주로 공원)',
      description:'폐쇄된 공항 활주로를 그대로 공원으로. 지평선까지 뻥 뚫린 활주로. 자전거 대여 가능. 베를린 특유 해방감.' },
    { date:'2026-09-28', time:'14:00', city:BL, title:'🛍️ 안드레아스 무르쿠디스 (Andreas Murkudis)',
      description:'Potsdamer Str 옛 신문사 건물. 미니멀 편집숍. 공간 자체가 미술관급. 월요일도 영업.' },
    { date:'2026-09-28', time:'15:30', city:BL, title:'✏️ Modulor 문구점 (Moritzplatz)',
      description:'전 세계 디자이너 모이는 대형 문구/재료점. 종이·아크릴·가공 재료. 작가 도구 욕심·영감 자극.' },
    { date:'2026-09-28', time:'17:00', city:BL, title:'🌳 크로이츠베르크 골목 + Landwehrkanal 운하',
      description:'해 질 녘 다리마다 로컬들 앉아있는 풍경. 베를린 그 자체.' },
    { date:'2026-09-28', time:'18:30', city:BL, title:'🌅 운하 산책 일몰',
      description:'쌀쌀한 저녁 공기 마시며 독일 여정 마무리 분위기.' },
    { date:'2026-09-28', time:'20:00', city:BL, title:'🍽️ 저녁: 미테 또는 베트남 음식',
      description:'가볍게.' },

    // ═══ Day 5: 9/29 (화) Berlin → Tuscany ═══
    { date:'2026-09-29', time:'07:00', city:BL, title:'☀️ 기상, 짐 정리, 체크아웃 준비' },
    { date:'2026-09-29', time:'08:30', city:BL, title:'🏛️ Boros Collection (사전예약 필수!)',
      description:'옛 방공호 벙커 개조 현대미술관. 차가운 콘크리트 + 현대 미술. 화-일 운영. 예약 안 했으면 스킵.' },
    { date:'2026-09-29', time:'10:00', city:BL, title:'🏛️ the temporary bauhaus-archiv',
      description:'Knesebeckstraße 1-2 임시관. Kandinsky·Klee·Moholy-Nagy·Breuer 가구 원본. 뮤지엄샵 자체 보물창고. 화-일 운영.' },
    { date:'2026-09-29', time:'11:30', city:BL, title:'🧳 호텔 체크아웃 + 빠른 점심 (Imbiß)' },
    { date:'2026-09-29', time:'12:30', city:BL, title:'🚆 BER 공항 이동 (S-Bahn ~30-45분)',
      description:'Berlin Hbf → S9 → BER. €4.40. 시간 여유 있게.' },
    { date:'2026-09-29', time:'13:30', city:BL, title:'✈️ BER 공항 체크인',
      description:'⚠️ 베를린→피렌체 직항은 Volotea 주1회만. 화요일 운항 여부 재확인! 안 되면 베를린→피사로 변경.' },
    { date:'2026-09-29', time:'15:00', city:PZ, title:'🛬 피렌체/피사 공항 도착',
      description:'Volotea 시간 확정 후 업데이트. 입국심사 EU 내 이동이라 빠름.' },
    { date:'2026-09-29', time:'15:30', city:PZ, title:'🚗 Europcar 렌터카 픽업 (Opel Corsa Automatic)',
      description:'P5 차량 인도. 360도 영상 + 연료 게이지 사진. Comfort+ 풀커버. "No additional coverage, Full to Full" 한 마디.' },
    { date:'2026-09-29', time:'16:30', city:PZ, title:'🛣️ Val d\'Orcia 드라이브 시작',
      description:'피사→Pienza 약 2시간 30분, 피렌체→Pienza 약 1시간 30분. SP146 사이프러스 길.' },
    { date:'2026-09-29', time:'18:30', city:PZ, title:'🌅 Cypress Road 일몰 드라이브',
      description:'San Quirico 북쪽 SP146. 그 유명한 토스카나 엽서 장면. 황금빛 사이프러스.' },
    { date:'2026-09-29', time:'19:30', city:PZ, title:'🏡 Agriturismo 체크인 (9/29-10/1 별도 숙소!)',
      description:'⚠️ Bagnaia는 10/1부터. 9/29-10/1 2박은 Pienza 근처 다른 아그리투리스모 필요. Podere Spedalone, Cretaiole 등 추천.' },
    { date:'2026-09-29', time:'20:30', city:PZ, title:'🍷 호스트 가정식 저녁 + 와인',
      description:'농장 수제 파스타·올리브오일·치즈 코스. 도착 첫 날이라 가볍게.' },

    // ═══ Day 6: 9/30 (수) Pienza & Montepulciano ═══
    { date:'2026-09-30', time:'08:00', city:PZ, title:'🥐 농가 조식',
      description:'테라스에서 에스프레소 + 크루아상. 아침 안개가 사이프러스 언덕에 깔리는 장면. 농장 계란·리코타·자가제 잼.' },
    { date:'2026-09-30', time:'09:00', city:PZ, title:'⛪ Cappella di Vitaleta (토스카나 엽서 명소)',
      description:'San Quirico d\'Orcia 근처. 비포장길 입구 주차 후 도보 15분. 아침 빛 최고. 사이프러스 둘러싼 예배당.' },
    { date:'2026-09-30', time:'10:30', city:PZ, title:'🏛️ Pienza 골목 탐방',
      description:'교황 Pius II가 1459년 Rossellino 시켜 만든 "완벽한 도시" (유네스코). Piazza Pio II 하나로 르네상스 비례 공부 끝. Via dell\'Amore 걷기.' },
    { date:'2026-09-30', time:'12:00', city:PZ, title:'🧀 Pecorino 치즈 시식 + La Bottega del Naturista 트러플',
      description:'Corso Rossellino에 Pecorino 가게 20곳. 24개월 숙성 시식 필수. 진공포장 사놓기.' },
    { date:'2026-09-30', time:'13:00', city:PZ, title:'🍝 점심: Trattoria Latte di Luna',
      description:'Pienza 현지 맛집. Pici al Ragù (수타면+라구), 양고기 구이. 예약 권장.' },
    { date:'2026-09-30', time:'14:30', city:PZ, title:'😴 시에스타 (숙소 복귀, 짧은 낮잠)' },
    { date:'2026-09-30', time:'16:00', city:PZ, title:'🚗 Montepulciano 드라이브 (약 30분)',
      description:'언덕 꼭대기 중세 마을. Corso 거리가 Piazza Grande까지 오르막. ZTL 외곽 주차.' },
    { date:'2026-09-30', time:'17:00', city:PZ, title:'🍷 Palazzo Contucci 셀러 투어',
      description:'16세기 귀족 저택 지하. 500년 된 오크통 줄지어 있는 공간 자체가 볼거리. 시음 스킵하고 공간·향만.' },
    { date:'2026-09-30', time:'18:30', city:PZ, title:'🌅 Tempio di San Biagio 일몰',
      description:'마을 밖 언덕 홀로 선 르네상스 그리스십자형 교회 (1518, Antonio da Sangallo). 황금빛 사암이 일몰에 진짜 금색.' },
    { date:'2026-09-30', time:'20:30', city:PZ, title:'🍽️ 저녁 + 별 보며 와인' },

    // ═══ Day 7: 10/1 (목) Siena & Bagno Vignoni + Bagnaia 체크인 ═══
    { date:'2026-10-01', time:'07:30', city:PZ, title:'🥐 농가 조식' },
    { date:'2026-10-01', time:'09:00', city:PZ, title:'🏡 Agriturismo Bagnaia 체크인 (10/1-10/4)',
      description:'San Quirico d\'Orcia 외곽. 짐 옮기고 바로 출발. 무료 주차장.' },
    { date:'2026-10-01', time:'10:30', city:PZ, title:'🚗 Siena 드라이브 (약 50분)',
      description:'⚠️ Santa Caterina 주차장에 주차! 시내 ZTL 절대 금지. 에스컬레이터로 구시가 진입.' },
    { date:'2026-10-01', time:'11:30', city:PZ, title:'🟥 Piazza del Campo',
      description:'조개껍데기 모양 붉은 벽돌 광장. 9개 구역 = 시에나 9인 정부 상징. 광장 바닥에 앉아 Torre del Mangia 올려다보기.' },
    { date:'2026-10-01', time:'12:30', city:PZ, title:'⛪ Duomo di Siena ★바닥 모자이크 (10/18까지 공개!)',
      description:'흑백 대리석 줄무늬 고딕 걸작. 56개 대리석 상감 모자이크 바닥 — 매년 8/18~10/18만 전체 공개. 10/1은 OK! Piccolomini 도서관 프레스코 필수. OPA SI Pass €15 통합권. 꿀팁: Porta del Cielo(천국의 문) 추가하면 지붕 위 도시 뷰 — 온라인 예약 필수.' },
    { date:'2026-10-01', time:'14:00', city:PZ, title:'🍝 점심 (시에나 시내)',
      description:'Pici 또는 Ribollita 추천. 광장 근처 트라토리아.' },
    { date:'2026-10-01', time:'15:30', city:PZ, title:'🍦 젤라또 타임',
      description:'광장 근처 Grom 등에서 피스타치오 젤라또로 당 충전.' },
    { date:'2026-10-01', time:'16:30', city:PZ, title:'♨️ Bagno Vignoni 이동 (약 40분)',
      description:'마을 중앙 광장이 거대한 온천수로 채워진 독특한 구조.' },
    { date:'2026-10-01', time:'17:00', city:PZ, title:'🌊 Bagno Vignoni 온천 광장',
      description:'타르코프스키 영화 <노스탤지아> 배경. 광장 한가운데 중세 온천 수조. 아래쪽 Parco dei Mulini에서 무료로 발 담글 수 있는 온천 폭포.' },
    { date:'2026-10-01', time:'18:30', city:PZ, title:'🌅 일몰 + 발 담그기' },
    { date:'2026-10-01', time:'20:00', city:PZ, title:'🍽️ Bagnaia 복귀 + 저녁',
      description:'호스트 가정식 또는 가까운 Trattoria. 와인 곁들이기.' },

    // ═══ Day 8: 10/2 (금) Orvieto & Civita ═══
    { date:'2026-10-02', time:'07:30', city:PZ, title:'🥐 농가 조식' },
    { date:'2026-10-02', time:'09:00', city:PZ, title:'🚗 Orvieto 드라이브 (약 1시간 30분)',
      description:'응회암 절벽에 얹힌 도시. Campo della Fiera 주차장 → 푸니쿨라로 올라감.' },
    { date:'2026-10-02', time:'11:00', city:PZ, title:'⛪ Duomo di Orvieto (금빛 파사드)',
      description:'이탈리아 가장 아름다운 고딕 파사드. 금빛 모자이크 + 대리석 부조. Cappella di San Brizio의 Luca Signorelli "최후의 심판" 프레스코 (미켈란젤로가 연구한 작품).' },
    { date:'2026-10-02', time:'12:30', city:PZ, title:'🕳️ Pozzo di San Patrizio (이중나선 우물)',
      description:'1527년 교황 Clement VII 포위 대비. 이중 나선 계단 248단 — 내려가는 사람과 올라오는 사람이 절대 마주치지 않는 구조. 디자이너 필수.' },
    { date:'2026-10-02', time:'13:30', city:PZ, title:'🍝 점심: Trattoria del Moro Aronne',
      description:'움브리아 가정식. Umbricelli al tartufo (트러플 파스타), 야생 멧돼지 라구.' },
    { date:'2026-10-02', time:'15:00', city:PZ, title:'🚗 Civita di Bagnoregio 이동 (약 30분)',
      description:'"죽어가는 마을". 절벽 위 고립 마을. 다리로만 접근.' },
    { date:'2026-10-02', time:'15:30', city:PZ, title:'🌉 Civita 도보 다리 (입장 €5)',
      description:'인구 10명 남짓. 보행자 다리로만 접근. 마을 끝 테라스에서 끝없는 계곡 뷰.' },
    { date:'2026-10-02', time:'17:30', city:PZ, title:'🌅 일몰: 다리에서 본 마을 실루엣',
      description:'해질녘 다리에서 보는 마을 실루엣이 비현실적. 비주얼 압도.' },
    { date:'2026-10-02', time:'19:00', city:PZ, title:'🚗 Bagnaia 복귀 (약 1시간 30분)' },
    { date:'2026-10-02', time:'20:30', city:PZ, title:'🍽️ 저녁 + 사유의 시간' },

    // ═══ Day 9: 10/3 (토) Tuscany → FCO (San Gimignano + 쇼핑 + 출국) ═══
    { date:'2026-10-03', time:'07:30', city:PZ, title:'🥐 마지막 농가 조식' },
    { date:'2026-10-03', time:'09:00', city:PZ, title:'🧳 짐 정리 + Bagnaia 체크아웃' },
    { date:'2026-10-03', time:'10:00', city:PZ, title:'🚗 San Gimignano 드라이브 (약 1시간 30분)',
      description:'"중세의 맨해튼". 14개 중세 탑이 남은 언덕마을. 성벽 밖 P1~P5 주차장.' },
    { date:'2026-10-03', time:'11:30', city:PZ, title:'🗼 Torre Grossa (가장 높은 탑)',
      description:'일몰 뷰 최고지만 점심 시간대도 OK. Collegiata 성당 프레스코.' },
    { date:'2026-10-03', time:'12:30', city:PZ, title:'🍦 Gelateria Dondoli (젤라또 세계챔피언)',
      description:'Piazza della Cisterna. Crema di Santa Fina가 명물.' },
    { date:'2026-10-03', time:'13:00', city:PZ, title:'🍝 점심 (San Gimignano 광장 근처)' },
    { date:'2026-10-03', time:'14:00', city:PZ, title:'🛒 Conad/Coop 마트 털기 🛍️',
      description:'Marvis 치약(초록·보라), Pocket Coffee(10월부터!), 트러플 오일(Savini/Tartufata), 발사믹, Pecorino 진공포장, Chianti·Brunello 와인 2병+ 뽁뽁이로 싸기.' },
    { date:'2026-10-03', time:'15:30', city:PZ, title:'🚗 FCO(로마 피우미치노) 출발',
      description:'약 2시간 30분. A1 고속도로 직행. ZTL 걱정 제로.' },
    { date:'2026-10-03', time:'17:30', city:PZ, title:'⛽ 공항 근처 주유 (Benzina!)',
      description:'⚠️ Gasolio(디젤) 아님. Benzina(휘발유)! 공항 10-20km 이내. 영수증 챙기기.' },
    { date:'2026-10-03', time:'18:00', city:PZ, title:'🚗 Europcar 차량 반납 (FCO)',
      description:'직원과 함께 인스펙션. "Damage-free receipt" 받기. 360도 영상 + 연료게이지 사진.' },
    { date:'2026-10-03', time:'19:00', city:PZ, title:'✈️ FCO 체크인 + Tax Refund',
      description:'세관 도장 → Tax Free 카운터. 면세점 가볍게 구경. 마지막 에스프레소.' },
    { date:'2026-10-03', time:'21:15', city:PZ, title:'✈️ FCO → ICN 출국 (KE/AZ 직항)',
      description:'약 11-12시간. 기내에서 한국시간 맞춰 자기.' },

    // ═══ Day 10: 10/4 (일) Seoul 도착 ═══
    { date:'2026-10-04', time:'16:10', city:PZ, title:'🛬 인천공항 도착',
      description:'10일간의 독일&이탈리아 여정 끝!' },
    { date:'2026-10-04', time:'17:00', city:PZ, title:'🚗 입국 + 짐 찾기 + 집으로',
      description:'리무진/공항철도. 도착 후 시차로 졸리겠지만 저녁까지 깨어있기.' },
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
  alert(`✅ 일정 ${ok}개 추가 완료!\n실패: ${fail}\n\n페이지 새로고침해서 확인하세요.`);
})();
