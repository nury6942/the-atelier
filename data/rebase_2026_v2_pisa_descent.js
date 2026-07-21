// ═══════════════════════════════════════════════════════════════
// ATELIER: 2026 독일&이탈리아 — 전체 재구성 v2 (피사 하강 루트)
// ───────────────────────────────────────────────────────────────
// v1(로마 도착) → v2(피사 도착) 대규모 변경. 패치가 아니라 통째 재구성.
//
// 확정된 변경 (사용자 결정):
//   1) 이탈리아 입국: 로마(FCO) → ★피사(PSA)★, EasyJet 10/8 12:05→14:00
//      · 비행기값 절반(수화물 포함 ~15만 vs 로마 ~30만)
//      · 낮 도착이라 "북→남 하강" 실현 가능
//   2) ★데사우 바우하우스 당일치기 삭제★ (미술관 순례 < 거리·샵·자연 선호)
//      → 베를린 4박 → 3박 (10/5,6,7 / 10/8 오전 출국)
//   3) ★시에나 1박 추가★ (10/8) — 거점 아니라 하강 경유 1박.
//      해질녘 당일치기 관광객 빠진 뒤 골목·아페리티보·사람구경
//   4) ★크레테 세네시★(10/9 남하 드라이브) + ★몬탈치노★(10/11) 추가
//   5) 토스카나 3박 → 4박 (시에나 1 + 피엔차 3)
//   6) 렌트카: FCO 왕복 → ★PSA 픽업 → FCO 반납★ (편도)
//   7) 베를린: 유대인박물관·노이에 나치오날갈레리 둘 다 유지(사용자 요청)
//      + 비키니 베를린·템펠호퍼 등 거리·샵·공원 콘텐츠 보강
//
// 하강 루트 (전부 낮 이동):
//   피사공항 →(1.5H)→ 시에나[1박] →크레테세네시→ 피엔차[3박]
//   →오르비에토→ 로마 FCO 출국
//
// 숙소 (전부 재예약 필요, 무료취소/미결제 전제):
//   · 프랑크푸르트  10/4~10/5 (1박)
//   · Casa Camper 베를린  10/5~10/8 (★3박★)
//   · Palazzetto Rosso 시에나  10/8~10/9 (1박) [신규]
//   · GARAGE47 피엔차  10/9~10/12 (3박)
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
    { match:/siena|시에나/i,           name:SI_NAME,                   start:'2026-10-08', end:'2026-10-09', nights:1, order:3, desc:'피사에서 남하 첫 밤. 해질녘 골목·캄포 아페리티보·사람구경.' },
    { match:/pienza|피엔차|orcia/i,    name:'Pienza, 시에나 이탈리아', start:'2026-10-09', end:'2026-10-12', nights:3, order:4, desc:'발도르차 거점. 피엔차·몬테풀차노·몬탈치노·바뇨비뇨니 당일치기.' },
  ];
  if (confirm('1단계: 도시(Stops)를 재구성할까요?\n\n프랑크푸르트1박 · 베를린3박 · 시에나1박(신규) · 피엔차3박\n(드레스덴은 이미 삭제됨)')) {
    try {
      const allC = await fbRead('trip_cities'); const mine = allC.filter(c => c.trip_id === tripId);
      for (const c of mine) if (/dresden|드레스덴/i.test(c.name||'')) { try { await fbDelete('trip_cities', c._id); console.log('🗑️ 도시 삭제:', c.name); } catch(e){} }
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
  const FF='Frankfurt am Main, 독일', BL='Berlin, 독일', SI=SI_NAME, PZ='Pienza, 시에나 이탈리아';
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
    N('2026-10-05','18:40','19:20',BL,'🏨 Casa Camper 베를린 체크인 (★3박★)','⚠️ 재예약 필요. 구 9/28~10/1 2박 → 10/5~10/8 3박. 📍Weinmeisterstraße 1 · ☎️030-20003410. U8 역 바로 위, 하케셔마르크트 도보권.'),
    N('2026-10-05','19:30','21:00',BL,'🌭 첫 저녁: Curry 36 / Mitte','커리부어스트. 이동일이라 가볍게.'),

    // ═══ Day 3 — 10/6 (화) 베를린 ① 포스터·미스·거리·공원  [일몰 18:32] ═══
    N('2026-10-06','08:00','09:00',BL,'☕ The Barn 모닝커피 (Mitte)','베를린 대표 로스터리. 플랫화이트.'),
    R('2026-10-06','09:30','10:45',BL,'🏛️ 라이히스타크 돔 (포스터) — 사전예약 필수','★무료★ 08:00~24:00. visite.bundestag.de 사전예약(수 주 전). 여권 원본 필수. 유리 돔 걸어 올라가며 도시 360° — 미술관 아니라 뷰+사람구경.\n\n🎯 돔 휴관 9/28~10/2, 10/19~10/30 — 새 날짜는 세이프.'),
    N('2026-10-06','10:45','11:45',BL,'🚪 브란덴부르크문 + 홀로코스트 추모비','추모비=아이젠만 설계. 콘크리트 기둥 2,711개, 바닥이 기울어 방향감각 사라지는 구조. 건축으로 감정 설계.'),
    N('2026-10-06','11:45','12:45',BL,'🌳 티어가르텐 관통 산책 → 승전기념탑','중앙공원. 10월 초 단풍. 걷기+자연.'),
    N('2026-10-06','12:45','13:45',BL,'🍽️ 점심 (티어가르텐 남측 / 포츠다머)'),
    N('2026-10-06','14:00','15:30',BL,'🏛️ 노이에 나치오날갈레리 (미스 반 데어 로에)','화 10:00~18:00. ★건물 자체가 목적★ — 기둥 8개로 지붕 전체를 띄운 유리 파빌리온. 공간감만으로 값어치. 멋있어서 필수(누리 픽).'),
    N('2026-10-06','15:30','16:15',BL,'🛍️ 안드레아스 무르쿠디스 (Potsdamer Str)','옛 신문사 개조 미니멀 편집숍. 공간 자체가 미술관급. 도보 10분.'),
    N('2026-10-06','16:15','17:15',BL,'🛍️ 비키니 베를린 (컨셉몰 + 옥상)','★1950년대 건물 개조 컨셉몰★ 디자인 편집숍 + 동물원 내려다보는 옥상 테라스. 샵+뷰+사람구경 삼박자. 월~토 10:00~20:00.'),
    N('2026-10-06','17:15','18:32',BL,'🏘️ 한자피어텔 자가 건축 산책 + 일몰','★1957 국제건축전 — 그로피우스·니마이어·알토가 한 동네에 주거동★ (외관만, 거주 중). "기린" 고층동 → 아카데미 데어 퀸스테(뒤트만, 화 15~19시 무료). 일몰 18:32.'),
    N('2026-10-06','19:00','21:00',BL,'🍽️ 저녁: Prenzlauer Berg','Konnopke\'s Currywurst 또는 동네 트라토리아. 카스타니엔알레 골목.'),

    // ═══ Day 4 — 10/7 (수) 베를린 ② 샤로운·리베스킨트·샵·자재박람회  [일몰 18:29] ═══
    N('2026-10-07','08:30','09:30',BL,'🥐 Father Carpenter 브런치 (Mitte)','안뜰 카페. 베네딕트 + 커피.'),
    R('2026-10-07','10:00','12:15',BL,'🏗️ ARCHITECT@WORK Berlin (Station Berlin)','★10/7~10/8 이틀, 체류일에 정확히 겹침★ 건축·인테리어 자재/제품 박람회 ~130개 업체. 걸어다니며 소재·마감재 구경 = 누리 "샵 구경" 모드. 사전등록 시 보통 무료, berlin.architectatwork.de.'),
    N('2026-10-07','12:30','12:55',BL,'🚇 필하모니 이동','도보 15분 / U-Bahn 한 정거장. 서서 보는 구조라 일찍.'),
    N('2026-10-07','13:00','13:50',BL,'🎻 필하모니 수요일 무료 런치콘서트 (샤로운)','★수 13:00, 무료★ 40~50분 실내악. 예약 불가 선착순 입석. 샤로운 "포도밭 배치" 콘서트홀 내부를 무료로 보는 유일한 방법. 이번 여행 "공연" 한 번.'),
    N('2026-10-07','14:00','15:00',BL,'🥪 점심 (포츠다머 / 크로이츠베르크)'),
    N('2026-10-07','15:15','17:00',BL,'🏛️ 유대인박물관 (리베스킨트) — 누리 픽','수 10:00~18:00. 상설 무료. ★해체주의 교과서★ 비스듬한 벽, 좁아지는 복도, 창 없는 Void. 전시보다 건물 체험. 바닥 철제 얼굴 1만개 위 걷기.'),
    N('2026-10-07','17:10','17:45',BL,'🛍️ Voo Store (Oranienstraße 안뜰)','크로이츠베르크 숨은 안뜰 편집숍. Acne·Our Legacy.'),
    N('2026-10-07','17:45','18:29',BL,'✏️ 모듈러 (Moritzplatz) + 일몰','전 세계 디자이너 대형 문구/재료점. 종이·아크릴·가공재료. Voo에서 도보 8분. 일몰 18:29.'),
    N('2026-10-07','19:00','21:00',BL,'🍜 마지막 베를린 저녁 + 짐 정리','Monsieur Vuong(쌀국수) 또는 Burgermeister. 내일 오전 출국 — 짐 다 싸기. 액체·와인 위탁 원칙.'),

    // ═══ Day 5 — 10/8 (목) 베를린 → 피사 → 시에나  [시에나 일몰 18:43] ═══
    N('2026-10-08','07:00','07:45',BL,'☀️ 기상 + 마지막 짐 점검'),
    N('2026-10-08','07:45','08:15',BL,'🥐 빠른 조식 (To-go OK)'),
    P('2026-10-08','08:15','08:45',BL,'🏨 Casa Camper 체크아웃','비행 위해 일찍.'),
    N('2026-10-08','08:45','09:45',BL,'🚆 → BER 공항 (S9/FEX 약 45분)','€4.40. 캐리어 여유 있게.'),
    N('2026-10-08','09:45','11:45',BL,'🛫 BER 체크인 + 보안 + 게이트','⚠️ 액체 100ml. 쉥겐→쉥겐, 게이트 직행.'),
    R('2026-10-08','12:05','14:00',SI,'✈️ EasyJet BER → 피사 PSA (1H 55M) — ⚠️ 미예약','❗예약 필요. 라이언에어/이지젯 낮편. 수화물 별도 구매 필수(9일 캐리어).\n\n※ 로마 대신 피사: 비행기값 절반 + 낮 도착이라 시에나부터 북→남 하강 가능. 단 렌트카는 피사→로마 편도(수수료 부활, 감수).'),
    N('2026-10-08','14:00','14:45',SI,'🛬 PSA 도착 + 짐 찾기','EU 내 이동이라 빠름. 렌터카 센터로.'),
    R('2026-10-08','14:45','15:30',SI,'🚗 렌트카 픽업 (피사 PSA) — ⚠️ 재예약 필요','❗구 예약은 로마/피사 혼재. ★피사 픽업 → 로마 반납 편도★로 재예약. 오토매틱 반드시 지정.\n픽업 시: 360도 영상 + 연료 사진. "Full to Full." 국제운전면허증+여권+본인 신용카드.'),
    P('2026-10-08','15:30','17:00',SI,'🛣️ 드라이브: 피사 → 시에나 (약 1H 30M / 130km)','수페르스트라다. 시에나 근접 시 ⚠️ ZTL 절대 진입 금지.'),
    N('2026-10-08','17:00','17:30',SI,'🅿️ Santa Caterina 주차 + 구시가 진입','24시간 커버드, 1박 최대 €35. ★에스컬레이터로 구시가 직행★. (Hotel Athena 선택 시 자체 무료차고라 이 단계 스킵)'),
    N('2026-10-08','17:30','18:00',SI,'🏨 Palazzetto Rosso 체크인','⚠️ 신규 예약. 📍캄포 350m, 13세기 붉은벽돌 탑 저택→아트호텔. 9.5점. 발레파킹으로 문앞 짐 내림.\n(주차 스트레스 싫으면 Hotel Athena €251 — ZTL 밖+무료차고로 대체)'),
    N('2026-10-08','18:00','18:43',SI,'🌇 캄포광장 + 골목 해질녘 산책','★당일치기 관광객 빠진 시에나★ Piazza del Campo 조개모양 붉은 광장에 앉기. 일몰 18:43. Via di Città 부티크 구경.'),
    N('2026-10-08','19:00','21:00',SI,'🍷 아페리티보 + 저녁 (사람구경)','Via Banchi di Sopra / Via Pantaneto 바·트라토리아. Pici, 시에나 요리. ★걸어서 숙소 복귀 = 와인 곁들여도 OK★.'),

    // ═══ Day 6 — 10/9 (금) 시에나 → 크레테세네시 → 피엔차  [일몰 18:40] ═══
    N('2026-10-09','07:30','08:30',SI,'🌅 새벽 시에나 골목 + 텅 빈 캄포','★관광객 오기 전, 로컬만 있는 아침★ 골목 사진. 카페 콜라치오네.'),
    N('2026-10-09','08:30','09:00',SI,'☕ 조식 + 체크아웃'),
    R('2026-10-09','10:00','11:30',SI,'🎫 Duomo di Siena ★바닥 모자이크 공개★','금 10:00~19:00(오픈 맞춰 입장). ★scopertura 8/18~11/15 — 56개 대리석 상감 바닥 전면 공개, 평소 덮여있음★. 금요일이라 일요일 미사 제약 없음. Piccolomini 도서관 포함. OPA SI PASS €16. ⚠️ 공개기간 최다 혼잡, 온라인 시간지정 예약 권장.'),
    N('2026-10-09','11:30','12:30',SI,'🛍️ Via di Città + Via Stalloreggi','부티크·가죽·도자기 + 공방·아틀리에. 누리 골목.'),
    N('2026-10-09','12:30','13:30',SI,'🍝 시에나 점심'),
    P('2026-10-09','13:30','15:30',PZ,'🚗 시에나 → 크레테 세네시 → 피엔차 (약 1H 30M, 경치길)','★발도르차 초록과 완전 다른 회색 점토 황무지★ 아시아노 방향 SP438. 차로 달리는 뷰 맛집 — 렌트카 살린 보람. 사진 정차. 남하하며 발도르차로.'),
    N('2026-10-09','15:30','16:00',PZ,'🏛️ GARAGE47 체크인 (피엔차, 3박)','⚠️ 재예약 필요. 📍Via Mario Mencatelli 14. ★옛 자동차 정비공장 개조 로프트★ 9.8점, 위치 9.9, 조식 포함, 무료주차, 1층. 성벽 밖이라 ZTL 무관 + 시내 도보.\n⚠️ 예약 시 10월 난방 가동 여부 확인.'),
    N('2026-10-09','16:30','18:40',PZ,'🌅 사이프러스 길 + 비탈레타 일몰 (SP146)','★토스카나 엽서의 그 사이프러스 길★ 산 퀴리코 북쪽, 피엔차 서쪽 약 10km. 황금빛 지그재그. 일몰 18:40. ⚠️ 비탈레타 진입로 흙길 — 비 온 다음날이면 미끄러움.'),
    N('2026-10-09','19:00','20:30',PZ,'🍽️ 피엔차 시내 첫 저녁 (도보)','Corso Rossellino 트라토리아. ★차 두고 걸어서★.'),

    // ═══ Day 7 — 10/10 (토) 피엔차 + 몬테풀차노  [일몰 18:38] ═══
    N('2026-10-10','07:30','08:30',PZ,'☕ GARAGE47 조식','포함. 피엔차 도보권이라 오전 여유.'),
    N('2026-10-10','09:00','10:00',PZ,'⛪ Cappella di Vitaleta (차량 9.4km)','아침 빛 최고. 입구 주차 후 도보 15분. ⚠️ 흙길.'),
    N('2026-10-10','10:00','12:00',PZ,'🏛️ 피엔차 골목 + Piazza Pio II (★도보★)','교황 비오2세의 "완벽한 도시"(유네스코). 르네상스 이상도시. Via dell\'Amore. 성벽 밖 숙소라 차 없이 걸어서. 로컬 샵·치즈가게.'),
    N('2026-10-10','12:00','13:00',PZ,'🧀 Pecorino 시식 + 치즈 쇼핑','Corso Rossellino 치즈가게 20곳. 24개월 숙성 시식. 진공포장 구매.'),
    N('2026-10-10','13:00','14:30',PZ,'🍝 점심: Trattoria Latte di Luna','Pici al Ragù, 양고기. 예약 권장.'),
    N('2026-10-10','14:30','16:00',PZ,'😴 시에스타 / 피엔차 여유'),
    N('2026-10-10','16:00','16:30',PZ,'🚗 몬테풀차노 드라이브 (14.3km / 19분)','⚠️ ZTL 10월 08:00~20:00 작동. ★P1 포르타 알 프라토★ 주차 후 도보. 벌금 €83~332 + 렌터카사 정보처리비 €30~50 별도.'),
    N('2026-10-10','16:30','18:00',PZ,'🍷 몬테풀차노 골목 + 셀러','Corso 오르막 골목·와인숍·사람구경. Palazzo Contucci 500년 오크통 셀러(⚠️ 10월 수확철, ☎️+39 0578 757006 사전확인).'),
    N('2026-10-10','18:00','18:38',PZ,'🌅 Tempio di San Biagio 일몰','마을 밖 르네상스 그리스십자 교회(1518, Sangallo). 황금빛 사암. 완벽한 중심대칭 평면.'),
    N('2026-10-10','19:00','20:30',PZ,'🍽️ 피엔차 시내 저녁 (도보)','Corso Rossellino. 비노 노빌레 곁들여도 걸어서 복귀.'),

    // ═══ Day 8 — 10/11 (일) 몬탈치노 + 바뇨비뇨니  [일몰 18:37] ═══
    N('2026-10-11','07:30','08:30',PZ,'☕ GARAGE47 조식'),
    N('2026-10-11','09:00','09:40',PZ,'🚗 몬탈치노 드라이브 (약 40분)','⚠️ 성벽 밖 주차. Piazzale Fortezza 또는 Via Strozzi.'),
    N('2026-10-11','09:40','11:30',PZ,'🏰 몬탈치노 요새(Fortezza) 성벽 + 골목','★성벽 위 걸으면 발도르차가 발밑에 쫙★ 브루넬로 와인의 성지. 언덕 위 성벽 마을. 골목마다 에노테카·수공예·식료품. 누리 스타일 정중앙.'),
    N('2026-10-11','11:30','13:00',PZ,'🍷 에노테카 브루넬로 시음 + 사람구경','Piazza del Popolo. 요새 안 Enoteca La Fortezza 또는 시내 와인숍. 로컬+관광객 사람구경.'),
    N('2026-10-11','13:00','14:30',PZ,'🍝 몬탈치노 점심','Pinci, 브루넬로 곁들인 토스카나 요리.'),
    N('2026-10-11','14:30','15:15',PZ,'🚗 바뇨 비뇨니 이동 (약 25분)'),
    N('2026-10-11','15:15','18:37',PZ,'♨️ 바뇨 비뇨니 온천 광장 — 일몰 18:37','★마을 중앙 광장이 통째로 온천 수조★ 타르코프스키 <노스탤지아> 배경. 아래 Parco dei Mulini에서 무료로 발 담그는 온천 폭포. 일몰까지 여유.'),
    N('2026-10-11','18:40','19:10',PZ,'🚗 피엔차 복귀 (15.3km / 20분)'),
    N('2026-10-11','19:30','21:00',PZ,'🍷 토스카나 마지막 저녁 (피엔차 도보) + 짐 정리','내일 출국. 페코리노 진공·와인 뽁뽁이 확인. ⚠️ 액체·와인 위탁수하물.'),

    // ═══ Day 9 — 10/12 (월) 피엔차 → 오르비에토 → FCO → 귀국 ═══
    N('2026-10-12','07:00','08:00',PZ,'☀️ 기상 + 짐 마무리'),
    N('2026-10-12','08:00','08:50',PZ,'🥐 GARAGE47 마지막 조식'),
    P('2026-10-12','08:50','09:20',PZ,'🏛️ GARAGE47 체크아웃 (10:00 deadline)','무료 주차장에서 바로 출발.'),
    N('2026-10-12','09:20','10:20',PZ,'🚗 피엔차 → 오르비에토 (약 1H)','응회암 절벽 위 도시. Campo della Fiera 주차 → 푸니쿨라. A1 길목이라 어차피 지남.'),
    N('2026-10-12','10:30','11:45',PZ,'⛪ Duomo di Orvieto (금빛 파사드)','월 09:30~19:00. €8(San Brizio 예배당 + 지하 포함). 이탈리아 최고 고딕 파사드. Signorelli "최후의 심판" 프레스코(미켈란젤로가 연구).'),
    N('2026-10-12','11:55','12:40',PZ,'🕳️ Pozzo di San Patrizio (이중나선 우물)','10월 09:00~19:00. €6. 248단, 깊이 54m. ★올라가는 사람과 내려가는 사람이 안 마주치는 이중나선★ 동선 설계 고전.'),
    N('2026-10-12','12:45','14:00',PZ,'🍝 점심: Trattoria del Moro Aronne','움브리아 가정식. Umbricelli al tartufo. 마지막 이탈리아 점심.'),
    N('2026-10-12','14:00','14:45',PZ,'🛒 Conad/Coop 마지막 쇼핑 🛍️','Marvis 치약, Pocket Coffee, 트러플오일, Pecorino 진공, 와인. ⚠️ 액체·와인 위탁.'),
    P('2026-10-12','15:00','16:40',PZ,'🚗 오르비에토 → FCO (약 1H 30M + 여유)','A1 남하. ZTL 걱정 없음. 반납 시간 엄수.'),
    N('2026-10-12','16:40','17:10',PZ,'⛽ 공항 근처 주유 (Benzina!)','⚠️ Benzina(휘발유)만! Gasolio(디젤) 금지. 영수증 챙기기.'),
    P('2026-10-12','17:10','18:30',PZ,'🚗 렌트카 반납 (FCO)','⚠️ 재예약. 직원 동행 인스펙션 + "Damage-free receipt". 360도 영상.\n※ 피사 픽업 → 로마 반납 편도라 수수료 있음.'),
    N('2026-10-12','18:30','19:00',PZ,'🚆 셔틀 → T3'),
    N('2026-10-12','19:00','20:00',PZ,'✈️ FCO T3 체크인 + Tax Refund','세관 도장 → Tax Free 카운터. 도착 즉시. 환급품 개봉 전 + 영수증 원본.'),
    N('2026-10-12','20:00','21:00',PZ,'🛂 보안 + 게이트','EU 출국. 마지막 에스프레소.'),
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
  await up(lodgings.find(r=>/pienza|피엔차|garage|바냐이아|바그나이아|아그리투리스모/i.test(hay(r))),
    { title:'GARAGE47 Storica Officina Meccanica LOFT B&B', address:'Via Mario Mencatelli 14, 53026 Pienza SI', city:PZ,
      date:'2026-10-09', checkout_date:'2026-10-12', payment_status:'결제 예정',
      notes:'⚠️ 재예약 필요. 옛 정비공장 개조 로프트, 9.8점, 조식·무료주차, 1층, 성벽밖(ZTL무관). 3박 €440. ⚠️ 10월 난방 확인.' }, '숙소·GARAGE47 10/9~12');

  // 시에나 숙소 — 없으면 신규 생성
  let siena = lodgings.find(r=>/siena|시에나|palazzetto|athena|ravizza/i.test(hay(r)));
  const sienaPayload = { trip_id:tripId, type:'숙소', title:'Palazzetto Rosso – Art Hotel (시에나)',
    address:'Via dei Malcontenti 8, 53100 Siena', city:SI, date:'2026-10-08', checkout_date:'2026-10-09',
    payment_status:'결제 예정',
    notes:'⚠️ 신규 예약 (94% 매진, 방 1개). 캄포 350m, 13세기 탑 저택→아트호텔, 9.5점. 발레파킹.\n대안: Hotel Athena €251 (ZTL 밖 무료차고) / Palazzo Ravizza €224 (무료취소).' };
  if (siena) await up(siena, sienaPayload, '숙소·시에나 갱신');
  else { try { const s = await fbAdd('journey', sienaPayload); if (typeof journeyData!=='undefined') journeyData.push(s); console.log('➕ 숙소·시에나 신규 추가'); } catch(e){ console.error('시에나 숙소 추가 실패', e); } }

  // ═══ 6) 항공편 ═══
  const flights = recs.filter(r => r.type === '항공편');
  for (const f of flights) { const t = hay(f);
    if (/ICN|인천/.test(t) && /FRA|프랑크푸르트/.test(t)) await up(f, { date:'2026-10-04', time:'09:50' }, '항공·TW403 ICN→FRA 10/4');
    else if (/FCO|로마/.test(t) && /ICN|인천/.test(t) && !/BER/.test(t)) await up(f, { date:'2026-10-12', time:'21:15' }, '항공·TW403 FCO→ICN 10/12');
    else if (/BER|베를린|ezy|easyjet|이지젯|psa|피사|fco/i.test(t)) await up(f,
      { title:'EasyJet BER → 피사 PSA (약 2H)', city:SI, date:'2026-10-08', time:'12:05',
        description:'❗미예약 — 낮편 예약 + 위탁수하물 필수. 로마 대신 피사(값 절반+낮 도착 하강루트). 렌트카는 피사→로마 편도.' },
      '항공·EasyJet BER→PSA 10/8');
  }

  // ═══ 7) 렌트카 ═══
  const rental = recs.find(r => r.type === '렌트카');
  await up(rental, { date:'2026-10-08', time:'14:45', city:'Pisa Airport (PSA)', drop_city:'Roma Fiumicino (FCO)',
    pickup_location:'Pisa Airport (PSA) 렌터카 센터', drop_location:'Roma Fiumicino (FCO) 렌터카 센터',
    checkout_date:'2026-10-12', checkout:'18:30', payment_status:'결제 예정',
    notes:'⚠️ 재예약. ★피사 픽업 10/8 → 로마 반납 10/12 (편도)★. 오토매틱 지정. 360도 영상+연료 사진. "Full to Full." 국제운전면허증+여권+본인 신용카드. 비포장 조항 없는 회사(식스트/마조레) 유리.' }, '렌트카·PSA→FCO 편도');

  // ═══ 8) UI + 체크리스트 ═══
  if (typeof loadCities==='function'){ try{ await loadCities(tripId);}catch(e){} }
  ['renderDayView','renderWeekView','renderCityCards','renderJourneyLodging','renderJourneyRental','renderJourneyFlights','renderJourneyTransit']
    .forEach(fn=>{ if(typeof window[fn]==='function'){ try{ window[fn](); }catch(e){} } });

  const TODO = [
    '① Casa Camper 베를린 — 10/5~10/8 ★3박★ 재예약 (구 2박)',
    '② Palazzetto Rosso 시에나 — 10/8 1박 ★신규★ (94% 매진, 방1개! 급함)',
    '③ GARAGE47 피엔차 — 10/9~10/12 재예약 (난방 확인)',
    '④ 프랑크푸르트 호텔 — 10/4 1박 재예약',
    '⑤ 드레스덴 Moxy — 취소 (수수료 확인)',
    '⑥ EasyJet BER→PSA 10/8 12:05 — ★신규 예약★ + 위탁수하물',
    '⑦ 렌트카 — PSA 픽업 10/8 → FCO 반납 10/12, 오토매틱, 비포장조항 없는 회사',
    '⑧ ICE Frankfurt→Berlin 10/5 오후 — 재예약 (도착역 확인)',
    '⑨ 라이히스타크 돔 — visite.bundestag.de 사전예약 (10/6, 무료, 여권)',
    '⑩ 시에나 두오모 — operaduomo.siena.it 시간지정 예약 (10/9, 공개기간 혼잡)',
    '⑪ ARCHITECT@WORK — berlin.architectatwork.de 사전등록 (10/7)',
    '⑫ Palazzo Contucci — ☎️+39 0578 757006 사전확인 (10/10, 수확철)',
  ];
  console.log('\n' + '═'.repeat(58) + '\n📋 재예약/사전예약 체크리스트\n' + '═'.repeat(58));
  TODO.forEach(t=>console.log('  '+t));
  console.log('═'.repeat(58));
  console.log('\n✅ v2 재구성 완료 — 일정 ' + ok + '개 (실패 ' + fail + ')');
  alert('✅ v2 재구성 완료!\n\n· 피사 하강 루트 (시에나1박 → 피엔차3박)\n· 데사우 삭제, 베를린 3박\n· 몬탈치노·크레테세네시 추가\n· 일정 ' + ok + '개 (실패 ' + fail + ')\n\n⚠️ 콘솔 체크리스트 12건 확인.\n특히 ② 시에나는 94% 매진 — 지금 예약!\n\n새로고침하세요.');
})();
