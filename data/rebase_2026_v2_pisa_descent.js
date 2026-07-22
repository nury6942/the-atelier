// ═══════════════════════════════════════════════════════════════
// ATELIER: 2026 독일&이탈리아 — 최종 재구성 (로마 왕복)
// ───────────────────────────────────────────────────────────────
// 로마 IN/OUT 왕복 + 산 퀴리코 4박 거점. 패치가 아니라 통째 재구성.
//
// 확정된 변경 (사용자 결정):
//   1) 이탈리아 입국/출국: ★로마(FCO) 왕복★, 라이언에어 10/8 12:20→14:30
//      · 렌터카 로마 왕복이라 편도료 없음(피사 편도 대비 ~₩37만 절약)
//      · 로마 도착 → 3H 북상 → 산 퀴리코
//   2) ★데사우 바우하우스 당일치기 삭제★ (미술관 순례 < 거리·샵·자연 선호)
//      → 베를린 4박 → 3박 (10/5,6,7 / 10/8 오전 출국)
//   3) 시에나는 ★당일치기★ (10/9) — 숙박 취소, 산 퀴리코서 당일 왕복
//   4) ★크레테 세네시★(10/9 남하 드라이브) + ★몬탈치노★(10/11) 추가
//   5) 토스카나 4박 = 산 퀴리코 La Scala 통짜(시에나 1박 흡수)
//   6) 렌트카: ★Sixt 로마 FCO 왕복★ (Grande Panda, 오토, Smart Protection 면책금0)
//   7) 베를린: 유대인박물관·노이에 나치오날갈레리 둘 다 유지(사용자 요청)
//      + 비키니 베를린·템펠호퍼 등 거리·샵·공원 콘텐츠 보강
//
// 루트 (로마 왕복):
//   베를린 →✈️→ 로마 FCO →(3H)→ 산 퀴리코[4박, 정중앙 거점]
//   →당일치기(시에나·피엔차·몬탈치노·바뇨비뇨니·몬테풀차노)→ 오르비에토 →로마 FCO 출국
//
// 숙소 (전부 재예약 필요, 무료취소/미결제 전제):
//   · 프랑크푸르트  10/4~10/5 (1박)
//   · Casa Camper 베를린  10/5~10/8 (★3박★)
//   · La Scala 1572 산 퀴리코  10/8~10/12 (★4박★) [예약완료, 아파트 통째 82㎡, 시에나 흡수]
//
// 사용: Travel 페이지 "2026 독일&이탈리아" 활성 → F12 → Console →
//       붙여넣기 → Enter → confirm 3번 → 새로고침
// ═══════════════════════════════════════════════════════════════

(async function rebase2026V2PisaDescent() {
  if (typeof fbAdd !== 'function' || typeof fbDelete !== 'function' || typeof fbUpdate !== 'function') {
    alert('❌ Travel 페이지에서 실행해주세요'); return;
  }
  const NEW_START = '2026-10-04', NEW_END = '2026-10-12';

  let tripId = (typeof currentTripId !== 'undefined' && currentTripId) ? currentTripId : null, tripName = '';
  if (!tripId) {
    try { const all = await fbRead('trips');
      const t = all.find(x => (x.name||'').includes('독일') && (x.name||'').includes('이탈리아'));
      if (t) { tripId = t._id; tripName = t.name; } } catch(e) {}
  } else {
    try { const all = await fbRead('trips'); const t = all.find(x => x._id === tripId); if (t) tripName = t.name; } catch(e) {}
  }
  if (!tripId) { alert('❌ 트립을 찾을 수 없습니다'); return; }
  console.log('🎒 Trip:', tripName, '|', tripId);

  // ═══ 1) 트립 날짜 ═══
  try {
    await fbUpdate('trips', tripId, { start_date: NEW_START, end_date: NEW_END });
    if (typeof tripsData !== 'undefined') { const t = tripsData.find(x => x._id === tripId); if (t) { t.start_date = NEW_START; t.end_date = NEW_END; } }
    console.log('✅ 트립 날짜:', NEW_START, '~', NEW_END);
  } catch(e) { console.error('트립 날짜 실패:', e); }

  // ═══ 2) trip_cities 재구성 ═══
  const SI_NAME = 'Siena, 이탈리아';
  const CITY_PLAN = [
    { match:/frankfurt|프랑크푸르트/i, name:'Frankfurt am Main, 독일', start:'2026-10-04', end:'2026-10-05', nights:1, order:1, desc:'입국 도시. 도착 저녁 뢰머광장 + 이튿날 오전 반나절.' },
    { match:/berlin|베를린/i,          name:'Berlin, 독일',            start:'2026-10-05', end:'2026-10-08', nights:3, order:2, desc:'건축·거리·샵·공원. 미테·크로이츠베르크·프렌츨라우어베르크 걷기 중심.' },
    { match:/pienza|피엔차|montepulciano|몬테풀차노|quirico|퀴리코|scala|orcia/i, name:'San Quirico d\'Orcia, 시에나 이탈리아', start:'2026-10-08', end:'2026-10-12', nights:4, order:3, desc:'발도르차 정중앙 거점(La Scala 1572, 4박). 시에나·사이프러스 길·바뇨비뇨니·피엔차·몬탈치노·몬테풀차노 당일치기.' },
  ];
  if (confirm('1단계: 도시(Stops)를 재구성할까요?\n\n프랑크푸르트1박 · 베를린3박 · 산퀴리코4박\n(시에나·드레스덴 삭제됨)')) {
    try {
      const allC = await fbRead('trip_cities'); const mine = allC.filter(c => c.trip_id === tripId);
      for (const c of mine) if (/dresden|드레스덴/i.test(c.name||'') || /^Siena,/i.test(c.name||'')) { try { await fbDelete('trip_cities', c._id); console.log('🗑️ 도시 삭제:', c.name); } catch(e){} }
      for (const p of CITY_PLAN) {
        const hit = mine.find(c => p.match.test(c.name||'') && !/dresden|드레스덴/i.test(c.name||''));
        const payload = { name:p.name, start_date:p.start, end_date:p.end, nights:p.nights, order:p.order, desc:p.desc };
        if (hit) { await fbUpdate('trip_cities', hit._id, payload); console.log('🔄 도시:', p.name, p.start, '~', p.end); }
        else { await fbAdd('trip_cities', Object.assign({ trip_id: tripId }, payload)); console.log('➕ 도시 추가:', p.name); }
      }
      try { localStorage.removeItem('atelier_city_cache_' + tripId); } catch(e){}
      console.log('✅ 도시 재구성 완료');
    } catch(e) { console.error('도시 재구성 실패:', e); }
  }

  // ═══ 3) 기존 '일정' 전체 삭제 ═══
  if (confirm("2단계: 기존 '일정'을 모두 삭제하고 새로 구성할까요?\n\n※ 숙소/렌트카/항공편/이동수단 레코드는 아래 단계에서 갱신됩니다.")) {
    const all = await fbRead('journey'); const items = all.filter(j => j.trip_id === tripId && j.type === '일정');
    console.log('🗑️ 기존 일정', items.length, '개 삭제 중...');
    for (const j of items) { try { await fbDelete('journey', j._id);
      if (typeof journeyData !== 'undefined') { const i = journeyData.findIndex(x => x._id === j._id); if (i>=0) journeyData.splice(i,1); } } catch(e){} }
    console.log('✅ 삭제 완료');
  }

  // ═══ 4) 새 일정 ═══
  const FF='Frankfurt am Main, 독일', BL='Berlin, 독일', SI=SI_NAME, PZ='San Quirico d\'Orcia, 시에나 이탈리아';
  const P=(d,t,e,c,ti,de)=>({date:d,time:t,end_time:e,city:c,title:ti,description:de||'',pinned:true});
  const N=(d,t,e,c,ti,de)=>({date:d,time:t,end_time:e,city:c,title:ti,description:de||''});
  const R=(d,t,e,c,ti,de)=>({date:d,time:t,end_time:e,city:c,title:ti,description:de||'',reservation:true});

  const items = [
    // ═══ Day 1 — 10/4 (일) 인천 → 프랑크푸르트  [일몰 18:57] ═══
    N('2026-10-04','06:00','07:30',FF,'🚗 인천공항 이동','리무진/공항철도. 출국심사 + 면세 1시간.'),
    P('2026-10-04','09:50','16:50',FF,'✈️ TW403 인천 → 프랑크푸르트 (14H)','✅ 예약 확정. T1 → FRA T3. 도착 3시간 전부터 깨어있기(시차).'),
    N('2026-10-04','16:50','17:30',FF,'🛬 짐 찾기 + 쉥겐 입국심사','FRA T3. 20~30분.'),
    N('2026-10-04','17:30','18:30',FF,'🚆 S-Bahn S8/S9 시내','€5.85. Hauptbahnhof 하차 → 호텔 도보 5분.'),
    N('2026-10-04','18:30','19:00',FF,'🏨 프랑크푸르트 호텔 체크인','⚠️ 재예약 필요 (구 9/25).'),
    N('2026-10-04','19:30','21:00',FF,'🏛️ 뢰머광장 산책 + 저녁','⚠️ 일요일 상점 휴무. Sachsenhausen 사과주 선술집(Adolf Wagner)은 영업. Apfelwein.'),
    N('2026-10-04','21:30','22:30',FF,'🛌 숙소 복귀, 휴식','내일 오전 반나절 후 오후 베를린. 일찍 자기.'),

    // ═══ Day 2 — 10/5 (월) 프랑크푸르트 오전 → 베를린  [일몰 18:34] ═══
    N('2026-10-05','07:30','08:30',FF,'☕ 호텔 조식'),
    N('2026-10-05','08:45','09:50',FF,'🚶 구시가 아침 산책','뢰머광장 아침 빛, 대성당 외관, 마인강변. Main Tower 오픈(10:00) 전.'),
    N('2026-10-05','10:00','10:45',FF,'🏙️ Main Tower Skydeck','€9. 200m 전망대. 평일 10:00~21:00. 독일 유일 고층 스카이라인.'),
    P('2026-10-05','11:00','11:30',FF,'🏨 체크아웃 + 짐 보관','deadline 11:00.'),
    N('2026-10-05','11:30','12:45',FF,'🛍️ Kleinmarkthalle 시장 + 점심','월~금 08:00~18:00. 햄·치즈·빵. 2층 바 가볍게.'),
    N('2026-10-05','12:45','13:20',FF,'🧳 짐 픽업 → Frankfurt Hbf','도보 5분.'),
    P('2026-10-05','13:30','17:45',BL,'🚂 ICE: Frankfurt → Berlin (약 4H)','⚠️ 재예약 필요 (구 예약 Frankfurt→Dresden). 좌석 예약 €4.50.\n\n⚠️⚠️ Stadtbahn 폐쇄(6/14~12/12): 도착역이 중앙역 지하(tief)/샤를로텐부르크/게준트브루넨 중 하나로 변동 가능. 예매 시 최종 도착역 확인. Casa Camper는 U8 위라 어느 역이든 커버.'),
    N('2026-10-05','17:45','18:40',BL,'🚆 도착역 → Casa Camper','①게준트브루넨=U8 직통 4정거장(8분) ②중앙역지하=S반+U8(15분) ③샤를로텐부르크=S반+U8(30분).'),
    N('2026-10-05','18:40','19:10',BL,'🏨 Casa Camper 체크인 + 짐 풀기','📍Weinmeisterstraße 1 · ☎️030-20003410. U8 역 바로 위, 하케셔마르크트 도보권.'),
    N('2026-10-05','19:10','19:35',BL,'🌭 초간단 저녁 (걸으며)','커리부어스트(Curry 36) 손에 들고. 앉지 말고 산책하며 때우기.'),
    N('2026-10-05','19:35','21:00',BL,'🌃 첫날 밤 미테 산책','★불 켜진 하케셔 마르크트 + 오라니엔부르거 골목★ 첫날 밤 도시 분위기 느끼기. 무리 말고 가볍게 — 힘들면 아무 카페.'),

    // ═══ Day 3 — 10/6 (화) 베를린 ① 포스터·미스·거리·공원  [일몰 18:32] ═══
    N('2026-10-06','08:00','09:00',BL,'☕ The Barn 모닝커피 (Mitte)','베를린 대표 로스터리. 플랫화이트.'),
    R('2026-10-06','09:30','10:45',BL,'🏛️ 라이히스타크 돔 (포스터) — 사전예약 필수','★무료★ 08:00~24:00. visite.bundestag.de 사전예약(수 주 전). 여권 원본 필수. 유리 돔 걸어 올라가며 도시 360° — 미술관 아니라 뷰+사람구경.\n\n🎯 돔 휴관 9/28~10/2, 10/19~10/30 — 새 날짜는 세이프.'),
    N('2026-10-06','10:45','11:45',BL,'🚪 브란덴부르크문 + 홀로코스트 추모비','추모비=아이젠만 설계. 콘크리트 기둥 2,711개, 바닥이 기울어 방향감각 사라지는 구조. 건축으로 감정 설계.'),
    N('2026-10-06','11:45','12:45',BL,'🌳 티어가르텐 관통 산책 → 승전기념탑','중앙공원. 10월 초 단풍. 걷기+자연.'),
    N('2026-10-06','12:45','13:15',BL,'🥨 점심 대충 (포츠다머 그랩)','임비스/베이커리 빨리. 앉는 시간 아껴 미스 건물에 더.'),
    N('2026-10-06','14:00','15:30',BL,'🏛️ 노이에 나치오날갈레리 (미스 반 데어 로에)','화 10:00~18:00. ★건물 자체가 목적★ — 기둥 8개로 지붕 전체를 띄운 유리 파빌리온. 공간감만으로 값어치. 멋있어서 필수(누리 픽).'),
    N('2026-10-06','15:30','16:15',BL,'🛍️ 안드레아스 무르쿠디스 (Potsdamer Str)','옛 신문사 개조 미니멀 편집숍. 공간 자체가 미술관급. 도보 10분.'),
    N('2026-10-06','16:15','17:15',BL,'🛍️ 비키니 베를린 (컨셉몰 + 옥상)','★1950년대 건물 개조 컨셉몰★ 디자인 편집숍 + 동물원 내려다보는 옥상 테라스. 샵+뷰+사람구경 삼박자. 월~토 10:00~20:00.'),
    N('2026-10-06','17:15','18:32',BL,'🏘️ 한자피어텔 자가 건축 산책 + 일몰','★1957 국제건축전 — 그로피우스·니마이어·알토가 한 동네에 주거동★ (외관만, 거주 중). "기린" 고층동 → 아카데미 데어 퀸스테(뒤트만, 화 15~19시 무료). 일몰 18:32.'),
    N('2026-10-06','19:00','20:15',BL,'🚶 프렌츨라우어베르크 저녁 골목 (먹기<구경)','Konnopke\'s Currywurst 그랩 + 카스타니엔알레 저녁 골목·바·샵 구경. 먹기보다 동네 분위기 산책.'),

    // ═══ Day 4 — 10/7 (수) 베를린 ② 샤로운·리베스킨트·샵·자재박람회  [일몰 18:29] ═══
    N('2026-10-07','08:30','09:30',BL,'🥐 Father Carpenter 브런치 (Mitte)','안뜰 카페. 베네딕트 + 커피.'),
    R('2026-10-07','10:00','12:15',BL,'🏗️ ARCHITECT@WORK Berlin (Station Berlin)','★10/7~10/8 이틀, 체류일에 정확히 겹침★ 건축·인테리어 자재/제품 박람회 ~130개 업체. 걸어다니며 소재·마감재 구경 = 누리 "샵 구경" 모드. 사전등록 시 보통 무료, berlin.architectatwork.de.'),
    N('2026-10-07','12:30','12:55',BL,'🚇 필하모니 이동','도보 15분 / U-Bahn 한 정거장. 서서 보는 구조라 일찍.'),
    N('2026-10-07','13:00','13:50',BL,'🎻 필하모니 수요일 무료 런치콘서트 (샤로운)','★수 13:00, 무료★ 40~50분 실내악. 예약 불가 선착순 입석. 샤로운 "포도밭 배치" 콘서트홀 내부를 무료로 보는 유일한 방법. 이번 여행 "공연" 한 번.'),
    N('2026-10-07','14:00','14:30',BL,'🥪 점심 대충 (크로이츠베르크 그랩)','되너/샌드위치 빨리. 유대인박물관·샵에 시간 더.'),
    N('2026-10-07','15:15','17:00',BL,'🏛️ 유대인박물관 (리베스킨트) — 누리 픽','수 10:00~18:00. 상설 무료. ★해체주의 교과서★ 비스듬한 벽, 좁아지는 복도, 창 없는 Void. 전시보다 건물 체험. 바닥 철제 얼굴 1만개 위 걷기.'),
    N('2026-10-07','17:10','17:45',BL,'🛍️ Voo Store (Oranienstraße 안뜰)','크로이츠베르크 숨은 안뜰 편집숍. Acne·Our Legacy.'),
    N('2026-10-07','17:45','18:29',BL,'✏️ 모듈러 (Moritzplatz) + 일몰','전 세계 디자이너 대형 문구/재료점. 종이·아크릴·가공재료. Voo에서 도보 8분. 일몰 18:29.'),
    N('2026-10-07','18:45','20:30',BL,'🍜 마지막 베를린 저녁(가볍게) + 짐 정리','Monsieur Vuong 쌀국수 or Burgermeister 그랩. ★내일 오전 베를린 조금 더 보고 12:20 비행★ — 오늘 밤 짐 다 싸두기(액체·와인 위탁).'),

    // ═══ Day 5 — 10/8 (목) 베를린 → 로마(FCO) → 산 퀴리코  [산퀴리코 일몰 18:40] ═══
    N('2026-10-08','08:00','08:40',BL,'🥐 조식 + 짐 정리 (여유)','비행 12:20이라 아침 시간 있음. Casa Camper 조식 or Mitte 카페.'),
    P('2026-10-08','08:40','09:00',BL,'🏨 체크아웃 + 짐 프론트 보관','짐 맡기고 가볍게 마지막 산책.'),
    N('2026-10-08','09:00','09:50',BL,'🚶 마지막 베를린 아침 — Hackescher Höfe','★8개 안뜰이 이어지는 하케셔 회페★ 아르누보 타일 파사드. 로젠탈러 슈트라세 스트리트아트 골목(Anne Frank 벽화). 마지막 디자인숍·기념품. 짐 없이 가볍게.'),
    N('2026-10-08','09:50','10:05',BL,'🧳 짐 픽업 → 역'),
    N('2026-10-08','10:05','10:50',BL,'🚆 → BER 공항 (S9/FEX 약 45분)','€4.40.'),
    N('2026-10-08','10:50','12:20',BL,'🛫 BER 도착(비행 1H30M 전) + 체크인·보안·게이트','쉥겐→쉥겐 게이트 직행이라 1.5시간이면 충분(누리 요청). ⚠️ 위탁수하물 부치기.'),
    P('2026-10-08','12:20','14:30',PZ,'✈️ 라이언에어 BER → 로마 FCO (2H 10M)','✅ 예약 확정(₩187,552). 낮 도착이라 오늘 안에 토스카나까지. ⚠️ 위탁수하물 포함 확인.\n※ 로마 왕복(FCO 픽업/반납)이라 렌터카 편도료 없음 — 피사 편도 대비 ~₩37만 절약.'),
    N('2026-10-08','14:30','15:20',PZ,'🛬 FCO 도착 + 짐 찾기','EU 내 이동이라 빠름. Rental Car Center로.'),
    P('2026-10-08','15:20','16:00',PZ,'🚗 렌터카 픽업 (로마 FCO) — Sixt Grande Panda','✅ 예약 완료(Sixt, 오토, Smart Protection 면책금0, 픽업시결제=무료취소). 픽업 시 360도 영상+연료 사진. 국제운전면허증+여권+본인 신용카드. ⚠️ 포장도로만.'),
    P('2026-10-08','16:00','18:30',PZ,'🛣️ 드라이브: FCO → 산 퀴리코 (약 3H / 227km)','A1 Autostrada del Sole 북상 → Chiusi-Chianciano 나들목 → SP146. 중간 Autogrill 휴게소 한 번. 통행료 편도 €15~20. ⚠️ 마을 ZTL 진입 금지.'),
    N('2026-10-08','18:30','19:00',PZ,'🏨 La Scala 1572 체크인 (산 퀴리코, 4박)','✅ 예약 완료(무료취소 10/2까지). ★아파트 통째 82㎡ 2베드룸, 전용주방·욕실2, 구시가 150m★ 9.7점. 뒷문 나가면 2분 무료주차(평지). 긴 이동일이니 짐 풀고 쉬기.'),
    N('2026-10-08','19:30','21:00',PZ,'🍽️ 산 퀴리코 첫 저녁 (도보)','★차 두고 걸어서★ Via Dante Alighieri 메인 골목·트라토리아(Al Vecchio Forno 등). 첫날이라 가볍게. 로컬 분위기, 덜 붐빔.'),

    // ═══ Day 6 — 10/9 (금) 시에나 당일치기 + 사이프러스 일몰  [일몰 18:38] ═══
    N('2026-10-09','08:00','09:00',PZ,'☕ 산 퀴리코 조식','La Scala 전용주방(자가) 또는 메인 골목 카페 콜라치오네.'),
    P('2026-10-09','09:00','10:10',PZ,'🚗 산 퀴리코 → 시에나 (약 1H)','⚠️ Santa Caterina 주차장에 주차! 시내 ZTL 절대 진입 금지(벌금). 에스컬레이터로 구시가 진입.\n💡 여유되면 아시아노 방향 크레테 세네시(회색 점토 황무지) 경치길로 우회 가능.'),
    N('2026-10-09','10:10','11:30',PZ,'🟥 Piazza del Campo + 광장 산책','조개껍데기 모양 붉은 벽돌 광장. 9개 구획 = 시에나 9인 정부 상징. 바닥이 중앙으로 오목. 앉아서 Torre del Mangia 올려다보기.'),
    R('2026-10-09','11:30','13:30',PZ,'🎫 Duomo di Siena ★바닥 모자이크 공개★','금 10:00~19:00. ★scopertura 8/18~11/15 — 56개 대리석 상감 바닥 전면 공개, 평소 덮여있음★. 금요일이라 일요일 미사 제약 없음. Piccolomini 도서관 포함. OPA SI PASS €16. ⚠️ 공개기간 최다 혼잡, 온라인 시간지정 예약 권장.'),
    N('2026-10-09','13:30','14:45',PZ,'🍝 시에나 점심','Pici, Ribollita, Pappa al Pomodoro. 광장 근처 트라토리아.'),
    N('2026-10-09','14:45','16:00',PZ,'🛍️ Via di Città + Via Stalloreggi + 젤라또','부티크·가죽·도자기 + 공방·아틀리에. Grom/Kopa Kabana 젤라또. 누리 골목.'),
    P('2026-10-09','16:00','17:10',PZ,'🚗 산 퀴리코 복귀 (약 1H)'),
    N('2026-10-09','17:20','18:38',PZ,'🌅 사이프러스 길 일몰 (SP146, 숙소 옆) — 일몰 18:38','★토스카나 엽서의 그 사이프러스 길★ 산 퀴리코~피엔차 사이, 숙소서 차 5분. 황금빛 지그재그. 복귀길에 잠깐 나가 사진. ⚠️ 비탈레타 흙길 주의.'),
    N('2026-10-09','19:00','20:30',PZ,'🍽️ 산 퀴리코 저녁 (도보)','메인 골목 트라토리아. 차 두고 걸어서.'),

    // ═══ Day 7 — 10/10 (토) 피엔차 + 몬테풀차노 (동쪽 날)  [일몰 18:38] ═══
    N('2026-10-10','08:00','09:00',PZ,'☕ 산 퀴리코 조식','La Scala 전용주방(자가) 또는 메인 골목 카페 코르네토+에스프레소.'),
    N('2026-10-10','09:00','09:20',PZ,'⛪ Cappella di Vitaleta (숙소서 약 10분)','★토스카나 엽서 명소★ 아침 빛 최고. 입구 주차 후 도보 15분. ⚠️ 흙길 — 비 온 다음날 미끄러움.'),
    N('2026-10-10','09:40','10:00',PZ,'🚗 피엔차 이동 (약 14분)','⚠️ 피엔차 ZTL — 성벽 밖 주차 후 도보.'),
    N('2026-10-10','10:00','12:00',PZ,'🏛️ 피엔차 골목 + Piazza Pio II','교황 비오2세의 "완벽한 도시"(유네스코). 르네상스 이상도시. Via dell\'Amore. 로컬 샵·치즈가게.'),
    N('2026-10-10','12:00','13:00',PZ,'🧀 Pecorino 시식 + 치즈 쇼핑','Corso Rossellino 치즈가게 20곳. 24개월 숙성 시식. 진공포장 구매.'),
    N('2026-10-10','13:00','14:30',PZ,'🍝 점심: Trattoria Latte di Luna (피엔차)','Pici al Ragù, 양고기. 예약 권장.'),
    N('2026-10-10','14:30','15:00',PZ,'🚗 몬테풀차노 이동 (피엔차서 약 19분)','⚠️ ZTL 10월 08:00~20:00. P1 포르타 알 프라토 주차 후 도보.'),
    N('2026-10-10','15:00','17:30',PZ,'🍷 몬테풀차노 Corso + Palazzo Contucci 셀러','Corso 오르막 골목·와인숍·사람구경. Palazzo Contucci 500년 오크통 셀러(⚠️ 10월 수확철, ☎️+39 0578 757006 사전확인). 비노 노빌레.'),
    N('2026-10-10','17:40','18:38',PZ,'🌅 Tempio di San Biagio 일몰 (몬테풀차노 옆)','★마을 밖 르네상스 그리스십자 교회(1518, Sangallo)★ 황금빛 사암이 일몰에 금색. 완벽한 중심대칭 평면.'),
    N('2026-10-10','18:45','19:20',PZ,'🚗 산 퀴리코 복귀 (약 32분)'),
    N('2026-10-10','19:30','21:00',PZ,'🍽️ 산 퀴리코 저녁 (도보)','★집이 산 퀴리코라 걸어서★ 메인 골목 트라토리아.'),

    // ═══ Day 8 — 10/11 (일) 몬탈치노 + 바뇨비뇨니  [일몰 18:37] ═══
    N('2026-10-11','08:00','09:00',PZ,'☕ 산 퀴리코 조식'),
    N('2026-10-11','09:20','09:45',PZ,'🚗 몬탈치노 드라이브 (약 21분)','산 퀴리코서 가까움. ⚠️ 성벽 밖 주차. Piazzale Fortezza 또는 Via Strozzi.'),
    N('2026-10-11','09:45','11:30',PZ,'🏰 몬탈치노 요새(Fortezza) 성벽 + 골목','★성벽 위 걸으면 발도르차가 발밑에 쫙★ 브루넬로 와인의 성지. 언덕 위 성벽 마을. 골목마다 에노테카·수공예·식료품. 누리 스타일 정중앙.'),
    N('2026-10-11','11:30','13:00',PZ,'🍷 에노테카 브루넬로 시음 + 사람구경','Piazza del Popolo. 요새 안 Enoteca La Fortezza 또는 시내 와인숍. 로컬+관광객 사람구경.'),
    N('2026-10-11','13:00','14:30',PZ,'🍝 몬탈치노 점심','Pinci, 브루넬로 곁들인 토스카나 요리.'),
    N('2026-10-11','14:30','15:00',PZ,'🚗 바뇨 비뇨니 이동 (약 25분)'),
    N('2026-10-11','15:00','18:37',PZ,'♨️ 바뇨 비뇨니 온천 광장 — 일몰 18:37','★마을 중앙 광장이 통째로 온천 수조★ 타르코프스키 <노스탤지아> 배경. 아래 Parco dei Mulini에서 무료로 발 담그는 온천 폭포. 산 퀴리코서 11분이라 여유롭게.'),
    N('2026-10-11','18:45','19:00',PZ,'🚗 산 퀴리코 복귀 (약 11분)'),
    N('2026-10-11','19:30','21:00',PZ,'🍷 토스카나 마지막 저녁 (산 퀴리코 도보) + 짐 정리','내일 출국. 페코리노 진공·와인 뽁뽁이 확인. ⚠️ 액체·와인 위탁수하물. 캐리어 미리 싸두기.'),

    // ═══ Day 9 — 10/12 (월) 산 퀴리코 → 오르비에토 → FCO → 귀국 ═══
    N('2026-10-12','08:15','09:15',PZ,'🥐 산 퀴리코 느긋한 마지막 조식','출국일이지만 시간 여유 많음. 서두를 필요 없이.'),
    N('2026-10-12','09:15','09:45',PZ,'🧳 짐 정리 + 체크아웃','온라인 체크인 미리 완료 → 공항에선 짐만 부치면 끝. 뒷문 주차장서 바로 출발.'),
    N('2026-10-12','09:45','11:10',PZ,'🚗 산 퀴리코 → 오르비에토 (약 1H 25M)','응회암 절벽 위 도시. Campo della Fiera 주차 → 푸니쿨라. A1 길목.'),
    N('2026-10-12','11:10','12:20',PZ,'⛪ Duomo di Orvieto (금빛 파사드)','월 09:30~19:00. €8(San Brizio 예배당+지하 포함). 이탈리아 최고 고딕 파사드. Signorelli "최후의 심판" 프레스코(미켈란젤로가 연구).'),
    N('2026-10-12','12:20','13:10',PZ,'🕳️ Pozzo di San Patrizio (이중나선 우물)','10월 09:00~19:00. €6. 248단, 깊이 54m. ★올라가는 사람·내려가는 사람이 안 마주치는 이중나선★ 동선 설계 고전.'),
    N('2026-10-12','13:10','14:30',PZ,'🍝 점심: Trattoria del Moro Aronne','움브리아 가정식. Umbricelli al tartufo. 마지막 이탈리아 점심.'),
    N('2026-10-12','14:30','15:45',PZ,'🚶 오르비에토 골목 + 마트 쇼핑 🛍️','응회암 골목·공방 구경. Conad/Coop에서 Marvis 치약·Pocket Coffee·트러플오일·Pecorino 진공·와인. ⚠️ 액체·와인 위탁.'),
    N('2026-10-12','15:45','16:20',PZ,'☕ 마지막 젤라또/카페 여유','서두르지 않아도 됨. 오르비에토 전망 즐기기.'),
    P('2026-10-12','16:20','18:10',PZ,'🚗 오르비에토 → FCO (약 1H 50M)','A1 남하. ZTL 걱정 없음. 톨 있음. 넉넉히 잡아도 이 정도.'),
    N('2026-10-12','18:10','18:30',PZ,'⛽ 공항 근처 주유 (Benzina!)','⚠️ Benzina(휘발유)만! Gasolio(디젤) 금지. Full to Full 정산용. 영수증 챙기기.'),
    P('2026-10-12','18:30','18:50',PZ,'🚗 렌트카 반납 (FCO, 약 10~20분)','Sixt Rental Car Center. 직원 인스펙션 + "Damage-free receipt". 360도 영상. ※ 로마 FCO 왕복(픽업=반납 동일).'),
    N('2026-10-12','18:50','19:05',PZ,'🚆 셔틀/도보 → T3'),
    R('2026-10-12','19:05','20:00',PZ,'🧾 Tax Refund(세관 도장) + 짐 부치기','⚠️ ★택스리펀 줄이 유일한 변수★ — 도착 즉시 세관 스탬프 → 환급 카운터 → bag drop. 온라인 체크인 완료라 짐만 부치면 됨. 환급품(와인·치즈·Marvis) 개봉 전 + 영수증 원본.'),
    N('2026-10-12','20:00','20:45',PZ,'🛂 보안 + 게이트','EU 출국. 마지막 에스프레소.'),
    P('2026-10-12','21:15','16:10',PZ,'✈️ TW403 로마 FCO → 인천 (11H 55M)','✅ 예약 확정. 도착 10/13(화) 16:10 인천. 기내 한국시간 취침.'),
  ];

  if (!confirm('3단계: 새 일정 ' + items.length + '개를 추가합니다.\n\n계속할까요?')) { console.log('취소'); return; }
  console.log('📅 일정', items.length, '개 추가 중...');
  let ok=0, fail=0;
  for (const it of items) { try { const s = await fbAdd('journey', Object.assign({ trip_id: tripId, type:'일정' }, it)); if (typeof journeyData!=='undefined') journeyData.push(s); ok++; } catch(e){ console.error('실패:', it.date, it.title, e); fail++; } }

  // ═══ 5) 숙소 레코드 갱신 ═══
  const all2 = await fbRead('journey');
  const recs = all2.filter(j => j.trip_id === tripId);
  const hay = r => [r.title, r.city, r.address, r.notes].filter(Boolean).join(' ');
  async function up(rec, obj, label) { if (!rec) { console.warn('⚠️ 대상없음:', label); return; }
    try { await fbUpdate('journey', rec._id, obj); Object.assign(rec, obj);
      if (typeof journeyData!=='undefined'){ const t=journeyData.find(x=>x._id===rec._id); if(t) Object.assign(t,obj);} console.log('✅', label); } catch(e){ console.error('❌', label, e); } }

  const lodgings = recs.filter(r => r.type === '숙소');
  await up(lodgings.find(r=>/프랑크푸르트|frankfurt|시타딘|citadines/i.test(hay(r))),
    { date:'2026-10-04', checkout_date:'2026-10-05', payment_status:'결제 예정', notes:'⚠️ 재예약 필요 (구 9/25). 1박.' }, '숙소·프랑크푸르트 10/4~5');
  await up(lodgings.find(r=>/베를린|berlin|camper|캠퍼/i.test(hay(r)) && !/dresden|드레스덴|moxy/i.test(hay(r))),
    { title:'Casa Camper Berlin', address:'Weinmeisterstraße 1, 10178 Berlin', phone:'030-20003410', city:BL,
      date:'2026-10-05', checkout_date:'2026-10-08', payment_status:'결제 예정',
      notes:'⚠️ 재예약 필요. 구 2박 → ★3박★ (10/5~10/8). U8 Weinmeisterstraße 역 바로 위. 데사우 삭제로 4박→3박.' }, '숙소·Casa Camper 10/5~8 (3박)');
  await up(lodgings.find(r=>/pienza|피엔차|montepulciano|몬테풀차노|garage|바냐이아|바그나이아|아그리투리스모|corso|enrico|pulcinella|scala|quirico|퀴리코/i.test(hay(r))),
    { title:'Apartment La Scala 1572 (산 퀴리코 도르치아)', address:'Via Poliziano 15, 53027 San Quirico d\'Orcia SI', city:PZ,
      date:'2026-10-08', checkout_date:'2026-10-12', payment_status:'결제 예정',
      notes:"✅ 예약 완료(★4박★ 10/8~10/12, 무료취소, 현장결제·카드불요). 로마 왕복으로 바꾸며 시에나 1박 흡수 → 산 퀴리코 4박.\n★아파트 통째 82㎡ 2베드룸, 전용주방·전용욕실 2개, 구시가 150m★ 9.7점. 뒷문 2분 무료주차(평지).\n산 퀴리코 = 발도르차 정중앙 거점 — 시에나·피엔차·몬탈치노·바뇨비뇨니 당일치기." }, '숙소·La Scala 1572 산퀴리코 10/8~12 (4박)');

  // 시에나 숙소 — 취소됨(로마 왕복 전환) → 기존 레코드 있으면 삭제
  const sienaLodge = lodgings.find(r=>/palazzetto|terrazza|athena|ravizza|barriera|시에나.*캄포|캄포.*시에나/i.test(hay(r)));
  if (sienaLodge) { try { await fbDelete('journey', sienaLodge._id);
    if (typeof journeyData!=='undefined'){ const i=journeyData.findIndex(x=>x._id===sienaLodge._id); if(i>=0) journeyData.splice(i,1); }
    console.log('🗑️ 시에나 숙소 삭제(취소됨)'); } catch(e){ console.error('시에나 숙소 삭제 실패', e); } }
  else console.log('ℹ️ 삭제할 시에나 숙소 없음(이미 없음)');

  // ═══ 6) 항공편 ═══
  const flights = recs.filter(r => r.type === '항공편');
  for (const f of flights) { const t = hay(f);
    if (/ICN|인천/.test(t) && /FRA|프랑크푸르트/.test(t)) await up(f, { date:'2026-10-04', time:'09:50' }, '항공·TW403 ICN→FRA 10/4');
    else if (/FCO|로마/.test(t) && /ICN|인천/.test(t) && !/BER/.test(t)) await up(f, { date:'2026-10-12', time:'21:15' }, '항공·TW403 FCO→ICN 10/12');
    else if (/BER|베를린|ezy|easyjet|이지젯|psa|피사|fco|로마|ryanair|라이언/i.test(t)) await up(f,
      { title:'라이언에어 BER → 로마 FCO (2H 10M)', city:PZ, date:'2026-10-08', time:'12:20',
        description:'✅ 예약 확정(₩187,552, 12:20→14:30). ⚠️ 위탁수하물 포함 확인. 로마 왕복이라 렌터카 편도료 없음.' },
      '항공·라이언에어 BER→로마 10/8');
  }

  // ═══ 7) 렌트카 ═══
  const rental = recs.find(r => r.type === '렌트카');
  await up(rental, { date:'2026-10-08', time:'15:20', city:'Roma Fiumicino (FCO)', drop_city:'Roma Fiumicino (FCO)',
    pickup_location:'Roma Fiumicino (FCO) Rental Car Center', drop_location:'Roma Fiumicino (FCO) Rental Car Center',
    checkout_date:'2026-10-12', checkout:'18:30', payment_status:'결제 예정',
    notes:'✅ 예약 완료 — ★Sixt Fiat Grande Panda 오토, 로마 FCO 왕복(10/8 픽업 → 10/12 반납)★.\n· Smart Protection = 면책금(자기부담) €0 + 충돌·도난·유리·타이어. 24/7 기본고장출동 포함.\n· 픽업시결제 = 픽업 전까지 무료취소.\n· 왕복이라 편도료 없음 → 피사 편도 대비 ~₩37만 절약. 총 ~₩79만.\n· 픽업 시 360도 영상+연료 사진. "Full to Full." 국제운전면허증+여권+본인 신용카드.\n· 포장도로만 주행(숙소·명소 전부 포장, 비탈레타는 걸어감).' }, '렌트카·Sixt 로마 FCO 왕복 10/8~12');

  // ═══ 8) UI + 체크리스트 ═══
  if (typeof loadCities==='function'){ try{ await loadCities(tripId);}catch(e){} }
  ['renderDayView','renderWeekView','renderCityCards','renderJourneyLodging','renderJourneyRental','renderJourneyFlights','renderJourneyTransit']
    .forEach(fn=>{ if(typeof window[fn]==='function'){ try{ window[fn](); }catch(e){} } });

  const TODO = [
    '① Casa Camper 베를린 — 10/5~10/8 ★3박★ 재예약 (구 2박)',
    '② Casa Camper 베를린 — 10/5~10/8 3박 ✅유지',
    '③ La Scala 1572 산퀴리코 — 10/8~10/12 ✅예약완료(4박) (호스트 Carola에 실내 계단만 확인)',
    '④ 프랑크푸르트 호텔 — 10/4 1박 재예약',
    '⑤ 라이언에어 BER→로마 10/8 12:20 — ✅예약완료(수하물 포함 확인)',
    '⑥ 렌트카 Sixt Grande Panda — 로마 FCO 왕복 10/8~12 ✅예약완료',
    '⑦ ICE Frankfurt→Berlin 10/5 오후 — 재예약 (도착역 확인)',
    '⑧ 라이히스타크 돔 — visite.bundestag.de 사전예약 (10/6, 무료, 여권)',
    '⑨ 시에나 두오모 — operaduomo.siena.it 시간지정 예약 (10/9 당일치기, 공개기간 혼잡)',
    '⑩ ARCHITECT@WORK — berlin.architectatwork.de 사전등록 (10/7)',
    '⑪ Palazzo Contucci — ☎️+39 0578 757006 사전확인 (10/10, 수확철)',
  ];
  console.log('\n' + '═'.repeat(58) + '\n📋 재예약/사전예약 체크리스트\n' + '═'.repeat(58));
  TODO.forEach(t=>console.log('  '+t));
  console.log('═'.repeat(58));
  console.log('\n✅ v2 재구성 완료 — 일정 ' + ok + '개 (실패 ' + fail + ')');
  alert('✅ 최종 재구성 완료 (로마 왕복)!\n\n· 로마 IN/OUT + 산 퀴리코 4박 거점\n· 시에나는 당일치기(숙박 취소)\n· 데사우 삭제, 베를린 3박(Casa Camper)\n· 일정 ' + ok + '개 (실패 ' + fail + ')\n\n예약 완료: 라이언에어·Sixt·La Scala.\n남은 것: 프랑크푸르트·ICE·사전예약(라이히스타크·시에나두오모·ARCHITECT@WORK).\n\n새로고침하세요.');
})();
