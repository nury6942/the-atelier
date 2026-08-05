window.atelierRev = (function () {
  const TRIP = 'I5T6Gu4qU1BtbHg2slYE';
  const db = window.db;
  const BK = 'atelier_reverse_backup';
  const RB = '⚠️ 재예약 필요 — 날짜·방향이 모두 바뀌었어. 아래 예약정보는 옛 일정 기준이야.';

  // ═══ 9/25(금) 인천 → 로마 ═══
  const D25 = {
    OUn1g8Et75TeDDFZtuEp: { date: '2026-09-25', time: '08:30', end_time: '09:40',
      description: 'TW405 12:35 출발. 국제선 3시간 전 도착 기준.' },
    dc0ENJhfEXHHdB0qUck3: { date: '2026-09-25', time: '12:35', title: '티웨이항공', city: 'TW405',
      arrive: '19:15', duration: '13H 40M', description: 'ICN (T1) → FCO (T3)',
      amount: '1600000', payment_status: '결제 예정', pnr: '', seat_number: '',
      payment_method: '', payment_date: '' },
    Da3lttIrUjSDuZFxOGHF: { date: '2026-09-25', time: '12:35', end_time: '19:15',
      title: '✈️ TW405 인천 → 로마 (13H40)', city: 'Roma, 이탈리아',
      description: '티웨이 직항. FCO 제3터미널 도착 19:15.' },
    pzBz9z1aFdFsdl4wZMnn: { date: '2026-09-25', time: '19:15', end_time: '20:15',
      title: '🛬 짐 찾기 + 쉥겐 입국심사', city: 'Roma, 이탈리아',
      description: '이탈리아가 첫 쉥겐 입국지야. 성수기 아니라 30~45분이면 나와.' },
    kViPGJTGtJQhWv6Dh6s1: { date: '2026-09-25', time: '20:15', end_time: '20:45',
      title: '🚌 FCO 공항 셔틀 → 숙소', city: 'Fiumicino, 이탈리아',
      route_note: '공항권 호텔 무료 셔틀 (예약 시 요청)',
      description: '오늘은 렌트 안 해. 밤 운전 피하고 내일 아침에 공항에서 픽업하는 게 안전해.' },
    AcfQluAlmZgIcODmvSEb: { date: '2026-09-25', time: '20:45', end_time: '21:15',
      title: '🏨 FCO 공항권 숙소 체크인', city: 'Fiumicino, 이탈리아',
      description: '13시간 비행 직후라 로마 시내 진입은 비효율. 공항 근처에서 자고 아침 일찍 북상.' },
    '7K34QdrbaLzRiPcKo3qm': { date: '2026-09-25', time: '21:30', title: '🛌 취침 (시차 적응)',
      description: '한국시간 새벽 4시반. 억지로라도 자두면 다음날이 편해.' }
  };

  // ═══ 9/26(토) FCO 렌트 → 오르비에토 → 산 퀴리코 ═══
  const D26 = {
    '5VOawBW5q0mSSOjtY247': { date: '2026-09-26', time: '08:30', end_time: '09:15',
      title: '🚗 Europcar 픽업 (FCO)', city: 'Fiumicino, 이탈리아',
      description: '⚠️ 픽업지가 VCE → FCO로 바뀌었어. 반납은 VCE. 예약 변경 필수.' },
    dU0qdEpLIZbCgbQfVhjR: { date: '2026-09-26', time: '08:30',
      pickup_location: 'FCO 렌터카 센터', drop_location: 'VCE 공항 렌터카 센터',
      status: '재예약 필요', payment_status: '재견적 필요',
      notes: '⚠️ 방향 역전: 로마 픽업 → 베네치아 반납. 9/26 08:30 ~ 10/1 11:45 (5일). 기존 VCE→FCO 예약은 변경 또는 재예약 필요.' },
    zGryCEYNMRutkM8w2WV3: { date: '2026-09-26', time: '11:00', end_time: '13:00',
      route_note: 'FCO → 오르비에토 약 130km · A1 고속도로 1H30',
      description: '두오모 파사드 + 산 브리치오 예배당(시뇨렐리 최후의 심판) + 산 파트리치오 우물. 10월 09:30~18:00 개관. 첫 이탈리아 마을로 딱 좋아.' },
    gl02VMPbxfcYvKMtBWqD: { date: '2026-09-26', time: '13:15', end_time: '14:20',
      title: '🍽️ 오르비에토 점심', city: 'Orvieto, 이탈리아',
      description: '움브리아 요리. 여기서 먹고 산 퀴리코로 넘어가.' },
    Cl846LEzMnXclVriubWy: { date: '2026-09-26', time: '16:00', end_time: '16:30',
      title: '🏨 DIMORA DEL POGGIO 체크인',
      route_note: '오르비에토 → 산 퀴리코 약 110km · 1H30',
      description: 'Via del Poggio 16, 중심부 100m. 무료 주차.' },
    lFzFOEwyffDFXEEtrmpe: { date: '2026-09-26', time: '19:00', end_time: '20:30' }
  };

  // ═══ 9/27(일) 발 도르차 종일 → 볼로냐 ═══
  const D27 = {
    VHM8xSltvpajHU4cLzFT: { date: '2026-09-27', time: '07:30', end_time: '08:00',
      title: '☕ 조식 + 체크아웃' },
    m0txEi5tS4xwix7SvfOx: { date: '2026-09-27', time: '08:00', end_time: '08:40' },
    vjY8ofTd6vYsm3mkofD3: { date: '2026-09-27', time: '08:50', end_time: '09:25' },
    '5NHmspbdo1b0AMnSg2Q9': { date: '2026-09-27', time: '09:40', end_time: '10:50' },
    f8a0Kv1oBPeoqsV4jMFV: { date: '2026-09-27', time: '11:00', end_time: '12:10' },
    pMpMAKzafEQM7ckjHY9P: { date: '2026-09-27', time: '13:45', end_time: '15:00',
      description: '♨️ 마을 한복판이 통째로 르네상스 온천탕이야. 발은 담글 수 있어. 오늘 하루 종일 걸었으니 여기서 쉬고 볼로냐로.' },
    w0qnVyYljPcPVjSXNQB9: { date: '2026-09-27', time: '18:45', end_time: '19:15',
      route_note: '산 퀴리코 → 볼로냐 약 250km · A1 2H40',
      description: '볼로냐 숙소 체크인. ⚠️ 구시가는 ZTL이라 숙소 주차장에 대고 걸어 나가야 해.' },
    eAPZOLEx76HSesVWFRhW: { date: '2026-09-27', time: '19:30', end_time: '21:30' }
  };

  // ═══ 9/28(월) 볼로냐 오전 → 돌로미티 ═══
  const D28 = {
    T74r1RIkvR1hOkWpnRdg: { date: '2026-09-28', time: '09:00', end_time: '10:15' },
    DYg9Wha9HTx5oKK0g5RJ: { date: '2026-09-28', time: '10:30', end_time: '11:30',
      description: '중세 길드 골목. 살루메리아·치즈·파스타 가판. 월요일 오전은 정상 영업이야.' },
    UBeS2A4MfW7tmCJf5eIh: { date: '2026-09-28', time: '11:40', end_time: '12:30' },
    Jl6Jq3Et769uNVniD9aL: { date: '2026-09-28', time: '17:00', end_time: '17:30',
      title: '🏨 Lienharterhof 체크인', city: 'Monguelfo, 이탈리아', lat: 46.7519, lng: 12.1050,
      route_note: '볼로냐 → 몬구엘포 약 330km · A13/A22 브레너 방향 3H30 (13:00 출발)',
      description: 'Mitterberg 38, 몬구엘포. 무료 전용 주차. 발코니·욕조 딸린 20m² 더블룸, 조식 포함.' },
    '1A4I7f9GKGImjfozeyNs': { date: '2026-09-28', time: '19:00', end_time: '20:30',
      title: '🍽️ 몬구엘포 마을 저녁', city: 'Monguelfo, 이탈리아',
      description: '숙소에 부설 레스토랑과 바가 있어. 장거리 운전 직후라 나가기 싫으면 여기서 해결.' },
    '2yc3a7IpsnEUvLzAWNXh': { date: '2026-09-28', time: '21:30', end_time: '21:45',
      description: '⚠️ 내일(9/29) 트레치메 유료도로 €40. 전날 23:59 마감이라 오늘 밤 안에 반드시 예약. 차량번호 필요할 수 있어.' }
  };

  // ═══ 9/29(화) 미주리나 · 트레치메 · 란드로 · 코르티나 ═══
  const D29 = {
    BoqZX4qTshe5zcHgA3KT: { date: '2026-09-29', time: '07:00', end_time: '07:45' },
    GQd2VZc9hOxhhIFDWy2M: { date: '2026-09-29', time: '09:00', end_time: '09:25',
      route_note: '몬구엘포 → 미주리나 약 45km · 55분' },
    FDVbBatkkISYFZf270Gu: { date: '2026-09-29', time: '09:40', end_time: '14:30' },
    BIB1niQgxGVyKmgTNUri: { date: '2026-09-29', time: '15:00', end_time: '15:25' },
    KpY19ECvwvJpeUK2oQn0: { date: '2026-09-29', time: '15:45', end_time: '17:00' },
    QiH6NkGhYexykW5QPDLK: { date: '2026-09-29', time: '19:00', end_time: '20:30',
      title: '🍽️ 몬구엘포 저녁', city: 'Monguelfo, 이탈리아',
      route_note: '코르티나 → 몬구엘포 약 50km · 1H' }
  };

  // ═══ 9/30(수) 알페 디 시우시 · 세체다 ═══
  const D30 = {
    zMfRJO0fag8j1vQkB3Dy: { date: '2026-09-30', time: '06:45', end_time: '07:20' },
    bwid3ky8PJUB4whAOn6R: { date: '2026-09-30', time: '07:30', end_time: '09:00',
      title: '🚗 몬구엘포 → 시우시 (Seis am Schlern)',
      route_note: 'SS49 → Bressanone → SS12 · 약 85km (도비아코보다 15km 가까워)' },
    '1vxI5rU9PYBAZ72DzuAb': { date: '2026-09-30', time: '09:15', end_time: '09:45',
      description: '운행 5/22~11/2, 08:00~18:00. 왕복권 구매. SP24 진입도로는 09:00~17:00 통제라 곤돌라가 유일한 길이야.' },
    '92uWjzqHBuxMeoAK5KUM': { date: '2026-09-30', time: '09:45', end_time: '12:15' },
    mF9b9tJIwzLHED346FGE: { date: '2026-09-30', time: '12:15', end_time: '13:20' },
    t9zXwDC5vh9o3jvGKfRu: { date: '2026-09-30', time: '13:30', end_time: '14:00' },
    BXG58jsikQ6IHlTtsmci: { date: '2026-09-30', time: '14:45', end_time: '16:45',
      route_note: '시우시 → 오르티세이 약 15km · 25분',
      description: '⚠️ 2026년부터 오르티세이-푸르네스-세체다 케이블카는 온라인 시간대 사전예약 필수야. 미리 15:00 전후 슬롯을 잡아둬. 능선이 정면으로 열리는 그 장면이 여기야.' },
    hm0dWWJtuBcAGH9362Yb: { date: '2026-09-30', time: '17:00', end_time: '18:40',
      title: '🚗 몬구엘포 복귀', route_note: '약 85km · 1H40' },
    NJjkMZoUKr1559u30g1K: { date: '2026-09-30', time: '19:00', end_time: '20:30',
      title: '🍽️ 몬구엘포 저녁', city: 'Monguelfo, 이탈리아' }
  };

  // ═══ 10/1(목) 브라이에스 일출 → VCE 반납 → 베를린 ═══
  const D01 = {
    QOCXtqpoUV3eZ7Q6RIkp: { date: '2026-10-01', time: '06:30', end_time: '08:00',
      route_note: '몬구엘포 → 브라이에스 약 15km · 20분 (도비아코보다 가까워)',
      description: '차량통제는 7/1~9/15만이라 10월엔 자유롭게 들어가. 일출이 호수 정면 산벽을 때리는 시간이 딱 이때야.' },
    DUBvxzlPkiaPzQQn7owQ: { date: '2026-10-01', time: '08:30', end_time: '09:15',
      title: '🧳 숙소 복귀 + 체크아웃' },
    OrIe4MzkFy7An72jDEih: { date: '2026-10-01', time: '11:45', end_time: '12:15',
      title: '🚗 Europcar 반납 (VCE)', city: 'Venezia, 이탈리아',
      route_note: '몬구엘포 → VCE 약 170km · 2H (09:20 출발)',
      description: '⚠️ 반납지가 FCO → VCE로 바뀌었어. 주유하고 반납.' },
    W0ttn9Uy7LRWMCNPxqaH: { date: '2026-10-01', time: '14:00', end_time: '15:40',
      title: '✈️ 라이언에어 VCE → 베를린 BER', city: 'Berlin, 독일',
      description: '⚠️ 방향 역전: BER→VCE에서 VCE→BER로. 기존 표는 못 써, 재구매 필요.' },
    dZhJpR9YhFFANEOu70kF: { date: '2026-10-01', time: '14:00', route: 'VCE → BER (T1)',
      arrive: '15:40', payment_status: '재구매 필요', amount: '',
      notes: '⚠️ 방향 역전. 기존 BER→VCE 표(€93.51)는 사용 불가. VCE→BER 편으로 다시 사야 해. 시각은 확정 후 갱신.' },
    rT39YdhmaoXfBR9FrRf0: { date: '2026-10-01', time: '16:00', end_time: '16:45',
      title: '🚆 BER 공항 → 베를린 시내', city: 'Berlin, 독일',
      route_note: 'FEX 공항특급 또는 S9 · 약 30~40분',
      description: '⚠️ 방향 역전. 마라톤(9/27)은 이미 지났으니 교통 통제 걱정 없어.' },
    iNJSyXPGvyaNhjpyINfn: { date: '2026-10-01', time: '17:00', end_time: '17:30',
      title: '🏨 베를린 숙소 체크인' },
    XtYDwnjSfJrEGjUOoh5X: { date: '2026-10-01', time: '17:45', end_time: '19:15' },
    YgbvtWHsVcpePH1LS0fY: { date: '2026-10-01', time: '19:30', end_time: '20:15' },
    '3rwCsxbTohQmnspez83l': { date: '2026-10-01', time: '20:30', end_time: '22:00' }
  };

  // ═══ 10/2(금) 베를린 종일 ═══
  const D02 = {
    dlHpXaXomPfb5TGxaKFr: { date: '2026-10-02' }, '7N3h7SI0vfIjXYbom8mZ': { date: '2026-10-02' },
    ux5JVaxnE4qixK9vqgJg: { date: '2026-10-02' }, UXsLXOOkvYx57nKNqyVo: { date: '2026-10-02' },
    jIEXTjQI9Lo6eIcqctfX: { date: '2026-10-02' }, DvaPb3Jeg4s6B5tR9mZK: { date: '2026-10-02' },
    AfOprHjRXO2BvqIqFtMD: { date: '2026-10-02' }, w6q3HPjzIb5IXmk2SByt: { date: '2026-10-02' },
    FPSkvetrQ0SSU9vl0PwB: { date: '2026-10-02' },
    KDOrvBLuIwc3enAjBvtV: { date: '2026-10-02', title: '🍽️ 미테 저녁' }
  };

  // ═══ 10/3(토) 베를린 → 데사우 → 라이프치히 ═══
  const D03 = {
    J0Unj3luB23aBtdJKGlF: { date: '2026-10-03', time: '08:00', end_time: '08:35' },
    '7iNHTqkVsvGtA5Qkancv': { date: '2026-10-03', time: '08:45', end_time: '10:00',
      title: '🚆 베를린 → 데사우', city: 'Dessau, 독일',
      route_note: 'RE 약 1H15',
      description: '⚠️ 방향 역전: 데사우→베를린에서 베를린→데사우로.' },
    eK4MWNFczlvB9QP59q3F: { date: '2026-10-03', time: '10:15', end_time: '12:30',
      description: '바우하우스 건물은 3~10월 매일 10:00~17:00 개관이라 토요일도 열려. 그로피우스 원설계 그대로야.' },
    hrutQO812leC9QQGYahf: { date: '2026-10-03', time: '12:40', end_time: '13:30' },
    majBnmpENLQtaP5wQ0vJ: { date: '2026-10-03', time: '13:45', end_time: '14:45',
      title: '🚆 데사우 → 라이프치히', city: 'Leipzig, 독일',
      route_note: 'RE 약 1H',
      description: '⚠️ 방향 역전: 라이프치히→데사우에서 데사우→라이프치히로.' },
    eN8kY4LpjcBx4Pvn2VVo: { date: '2026-10-03', time: '15:00', end_time: '15:20',
      title: '🧳 라이프치히 숙소 짐 드롭' },
    Cupt0T0cW5ticSTz0uSJ: { date: '2026-10-03', time: '15:30', end_time: '17:00',
      description: '토요일 10:00~18:00 개관 (월요일만 휴관). 마감 1시간 전 입장이라 아르누보·바우하우스 컬렉션 위주로 빠르게.' },
    Ijrq4mthX6pYsHQCEliz: { date: '2026-10-03', time: '17:10', end_time: '17:45' },
    F3UFwpq3d9YWMD8qSMOF: { date: '2026-10-03', time: '17:50', end_time: '18:30' },
    woRz3dHtTIAKALYXNnXp: { date: '2026-10-03', time: '19:30', end_time: '21:00' }
  };

  // ═══ 10/4(일) 라이프치히 → 프랑크푸르트 → 출국 ═══
  const D04 = {
    SCBhSabQvXIfr7svcDwP: { date: '2026-10-04', time: '07:30', end_time: '08:00',
      title: '🏨 체크아웃 (라이프치히)' },
    '3UJ9oefcwtAAoFrCFHum': { date: '2026-10-04', time: '08:30', end_time: '11:30',
      title: 'ICE: Leipzig Hbf → Frankfurt Hbf (약 3H)',
      status: '재예약 필요', payment_status: '재구매 필요',
      notes: '⚠️ 방향 역전: 프랑크푸르트→라이프치히에서 라이프치히→프랑크푸르트로. 기존 표(₩180,000) 사용 불가.\n· 10/4(일) 08:30 전후 출발편\n· 지금 D-59면 Super Sparpreis €20~40 가능\n· 기존 표 환불 확인: Flexpreis=전액, Sparpreis=€10, Super Sparpreis=불가' },
    '9qw5ffRa5Q5nhFHlgolz': { date: '2026-10-04', time: '08:30', end_time: '11:30',
      title: '🚂 ICE: Leipzig → Frankfurt (약 3H)', city: 'Frankfurt am Main, 독일',
      description: '에어푸르트 → 풀다 경유. 짐 싣고 타는 마지막 이동이야.' },
    RCHy2WOwTJ1PE4daeAsE: { date: '2026-10-04', time: '12:15', end_time: '13:45',
      description: '⚠️ 일요일이라 상점은 다 닫아. 뢰머광장·대성당·구시가는 그대로 볼 수 있고 압펠바인 주점도 열어.' },
    emSoJ8LLwVzqFPWwgjNk: { date: '2026-10-04', time: '14:00', end_time: '15:00',
      title: '🌉 아이저너 슈테크 다리 + 마인 강변',
      description: '야경 대신 낮 산책. 강 건너 작센하우젠 쪽 뮤지엄 강변이 일요일에도 걷기 좋아.' },
    qDjvQR1tcf1sslqbWoxR: { date: '2026-10-04', time: '19:40',
      title: '✈️ TW404 프랑크푸르트 → 인천', city: 'Frankfurt am Main, 독일',
      route_note: '시내 → FRA 공항 S8/S9 약 15분 (16:30 출발)',
      description: '티웨이 직항 12H10 · 10/5(월) 14:50 인천 도착 · 그날은 대체공휴일이라 쉬어. 품평(10/8)까지 3일 여유.' },
    rD7RUnsx2puTttiz04dT: { date: '2026-10-04', time: '19:40', title: '티웨이항공', city: 'TW404',
      arrive: '14:50', duration: '12H 10M', description: 'FRA → ICN (T1)',
      payment_status: '결제 예정', pnr: '', seat_number: '', amount: '',
      payment_method: '', payment_date: '' }
  };

  // 보류함으로 (날짜 제거)
  const SHELVE = {
    Kt7WaIDxIz8Trlr8olNN: '10/4가 일요일 — Kleinmarkthalle 휴무',
    w94k1SkMwmwF50SOGoh8: 'Kleinmarkthalle 보류에 따라 함께',
    LOg45EGOOgmBC9IU1bbK: '10/3 토요일 STIL 영업시간 짧음 · GRASSI 우선',
    xbnslAVr86O5xkytg2Av: 'Lienharterhof 조식 포함 — 3일치 장보기 불필요',
    ZFhtTEYKluuYjoEYT85i: 'Passo Giau — 9/29 코르티나 일정과 시간 충돌',
    '5h7n0sOmS0wLyYOV1080': 'San Candido — 몬구엘포 기준 동선에서 벗어남',
    gUeqAkdwvE6nOpByMeSK: '오르티세이 산책 — 세체다와 같은 마을, 중복',
    mRv98M7ZTehhJF65xchO: 'Passo Gardena — 9/30 알페+세체다로 이미 포화',
    '1YrvCtmz4smX7GpOMARf': '베를린 체크아웃 아침 — 10/3 조식+체크아웃과 중복',
    '3FniKFUKaTTtH9TBJg7l': '라이프치히 구시가 점심 — 데사우에서 12:40 점심 후 15:00 도착이라 불필요'
  };

  // 숙소 카드
  const STAY = {
    qSHNf2ATo9U0er1TRN5v: { date: '2026-09-25', checkout_date: '2026-09-26',
      title: '🏨 로마 FCO 공항권 숙소 (미정)', city: 'Fiumicino, 이탈리아' },
    '2wTJjghF1IZCXt25bzUE': { date: '2026-09-26', checkout_date: '2026-09-27',
      title: 'DIMORA DEL POGGIO', city: "San Quirico d'Orcia, 시에나 이탈리아",
      address: 'Via del Poggio 16, 53027 San Quirico d\'Orcia' },
    adA1z7lSlKF2qFfkreZs: { date: '2026-09-27', checkout_date: '2026-09-28' },
    '0OcjJRe9KcVJQxuatje4': { date: '2026-09-28', checkout_date: '2026-10-01',
      title: 'Lienharterhof', city: 'Monguelfo, 이탈리아',
      address: 'Mitterberg 38, 39035 Monguelfo (BZ)', lat: 46.7519, lng: 12.1050 },
    K77sjwwBaP6YuNCF9DdA: { date: '2026-10-03', checkout_date: '2026-10-04' }
  };

  // 예약 완료 — 재예약 경고 안 붙임
  const BOOKED = {
    '2Ryw28Fa8LvdpnyfopuE': {
      date: '2026-10-01', checkout_date: '2026-10-03',
      title: 'Casa Camper Berlin', city: 'Berlin, 독일',
      address: 'Weinmeisterstraße 1, 10178 베를린, 독일', phone: '+49-30-20003410',
      lat: 52.5265, lng: 13.4033,
      booking_ref: '1400828106697685 (PIN 9540)',
      room_type: '캠퍼 트윈룸 · 싱글침대 2개 · 30m² · 금연 · 시티뷰',
      checkin: '15:00', checkout: '12:00', breakfast: '불포함',
      guests: '성인 1명',
      cancel: '가능', cancel_date: '2026-09-30',
      cancel_policy_detail: '2026-09-30 23:59 (호텔 현지시간) 전 무료취소',
      amount: '420021', onsite_amount: '34452', onsite_fee: '€20.88 · 도시세 현장 결제',
      payment_status: '결제 완료', payment_date: '2026-08-06',
      payment_method: '₩420,021 카드 결제 (신한 4913 일시불) — 정가 489,364 − 트립코인 18,780 − 네이버포인트 50,563',
      notes: '🅿️ 렌트카 없음 (베를린은 대중교통) · U8 Weinmeisterstraße 도보 1분 · 하케셔마르크트 도보 5분\n📍 미테 한복판 — 박물관섬·노이에스 박물관 도보권, 10/2 일정 전부 걸어서 가능\n🛫 10/3 체크아웃 12:00 이전 (베를린→데사우 08:45 기차라 여유 있음)'
    }
  };

  const CITIES = {
    '7kiyoYtNVrQxk7yBcttT': { name: 'Fiumicino, 이탈리아', start_date: '2026-09-25', end_date: '2026-09-26', nights: 1, order: 1 },
    fz2LPA58Kq5n5nFgIrvB:   { start_date: '2026-09-26', end_date: '2026-09-27', nights: 1, order: 2 },
    VbjHRKc6jDkuftV6VAOt:   { start_date: '2026-09-27', end_date: '2026-09-28', nights: 1, order: 3 },
    eCETG42R7d4jtfz4AnDE:   { start_date: '2026-09-28', end_date: '2026-10-01', nights: 3, order: 4 },
    RO0Cnjvn9FTILg1Dsk4I:   { start_date: '2026-10-01', end_date: '2026-10-03', nights: 2, order: 5 },
    zK338Kyy8Xlpq92EQnfg:   { start_date: '2026-10-03', end_date: '2026-10-04', nights: 1, order: 6 }
  };

  const ALL = [D25, D26, D27, D28, D29, D30, D01, D02, D03, D04];

  function merged() {
    const m = {};
    ALL.forEach(d => Object.keys(d).forEach(k => { m[k] = Object.assign(m[k] || {}, d[k]); }));
    Object.keys(STAY).forEach(k => { m[k] = Object.assign(m[k] || {}, STAY[k]); });
    Object.keys(BOOKED).forEach(k => { m[k] = Object.assign(m[k] || {}, BOOKED[k]); });
    return m;
  }

  async function docs() {
    const s = await db.collection('journey').where('trip_id', '==', TRIP).get();
    const a = {}; s.forEach(d => a[d.id] = d.data()); return a;
  }

  async function preview() {
    const cur = await docs(), M = merged();
    const miss = Object.keys(M).concat(Object.keys(SHELVE)).filter(id => !cur[id]);
    if (miss.length) { console.error('❌ 없는 문서:', miss); return; }
    const byDate = {};
    Object.keys(M).forEach(id => {
      const d = M[id].date; if (!d) return;
      (byDate[d] = byDate[d] || []).push({ t: M[id].time || cur[id].time || '', ti: M[id].title || cur[id].title || cur[id].city || '' });
    });
    console.log('%c[역방향 재구성] 9/25 로마 IN → 10/4 프랑크푸르트 OUT · 9박', 'font-weight:bold;font-size:14px');
    Object.keys(byDate).sort().forEach(k => {
      const w = '일월화수목금토'[new Date(k).getDay()];
      console.log(`\n── ${k}(${w})  ${byDate[k].length}건`);
      byDate[k].sort((a, b) => String(a.t).localeCompare(String(b.t)))
        .forEach(x => console.log(`   ${String(x.t).padEnd(6)}${String(x.ti).slice(0, 52)}`));
    });
    console.log('\n── 보류함으로 ' + Object.keys(SHELVE).length + '건');
    Object.keys(SHELVE).forEach(id => console.log(`   ${String(cur[id].title || '').slice(0, 34).padEnd(36)}${SHELVE[id]}`));
    const sun = Object.keys(cur).filter(id => cur[id].auto_sun);
    console.log('\n일출·일몰 ' + sun.length + '건 삭제 → 새 날짜로 재생성');
    console.log('%c\n진행하려면 → atelierRev.apply()', 'color:#2563eb;font-weight:bold');
    window.__revSun = sun;
  }

  async function apply() {
    const cur = await docs(), M = merged();
    const miss = Object.keys(M).concat(Object.keys(SHELVE)).filter(id => !cur[id]);
    if (miss.length) { console.error('❌ 없는 문서, 중단:', miss); return; }

    const bk = { j: {}, c: {}, t: null };
    Object.keys(M).concat(Object.keys(SHELVE)).forEach(id => {
      const o = cur[id], s = {};
      ['date','time','end_time','title','city','description','route_note','notes','lat','lng',
       'checkout_date','address','amount','arrive','duration','route','pnr','seat_number',
       'payment_status','payment_method','payment_date','status','pickup_location','drop_location']
        .forEach(k => { if (o[k] !== undefined) s[k] = o[k]; });
      bk.j[id] = s;
    });
    const cs = await db.collection('trip_cities').where('trip_id', '==', TRIP).get();
    cs.forEach(d => bk.c[d.id] = { name: d.data().name, start_date: d.data().start_date, end_date: d.data().end_date, nights: d.data().nights, order: d.data().order });
    const tr = await db.collection('trips').doc(TRIP).get();
    bk.t = { start_date: tr.data().start_date, end_date: tr.data().end_date };
    try { localStorage.setItem(BK, JSON.stringify(bk)); console.log('백업 저장 → localStorage["' + BK + '"]'); }
    catch (e) { console.warn('백업 저장 실패(용량):', e.message, '— 그래도 진행'); }

    const ops = [];
    Object.keys(M).forEach(id => {
      const p = Object.assign({}, M[id]);
      if (STAY[id]) {
        const n = String(cur[id].notes || '');
        p.notes = n.indexOf('재예약 필요') >= 0 ? n : (RB + (n ? '\n' + n : ''));
      }
      ops.push(['upd', 'journey', id, p]);
    });
    Object.keys(SHELVE).forEach(id => ops.push(['upd', 'journey', id, { date: '' }]));
    (window.__revSun || Object.keys(cur).filter(id => cur[id].auto_sun)).forEach(id => ops.push(['del', 'journey', id]));
    Object.keys(CITIES).forEach(id => ops.push(['upd', 'trip_cities', id, CITIES[id]]));
    ops.push(['upd', 'trips', TRIP, { start_date: '2026-09-25', end_date: '2026-10-04' }]);

    for (let i = 0; i < ops.length; i += 400) {
      const b = db.batch();
      ops.slice(i, i + 400).forEach(o => {
        const r = db.collection(o[1]).doc(o[2]);
        if (o[0] === 'del') b.delete(r); else b.update(r, o[3]);
      });
      await b.commit();
      console.log(`  커밋 ${Math.min(i + 400, ops.length)}/${ops.length}`);
    }
    console.log('%c✅ 완료 — 새로고침해줘 (9/25~10/4 · 9박 · 로마 IN → 프랑크푸르트 OUT)', 'color:#16a34a;font-weight:bold;font-size:14px');
    console.log('%c되돌리려면 → atelierRev.undo()', 'color:#999');
  }

  async function undo() {
    const bk = JSON.parse(localStorage.getItem(BK) || 'null');
    if (!bk) return console.error('백업이 없어.');
    const ops = [];
    Object.keys(bk.j).forEach(id => ops.push(['journey', id, bk.j[id]]));
    Object.keys(bk.c).forEach(id => ops.push(['trip_cities', id, bk.c[id]]));
    ops.push(['trips', TRIP, bk.t]);
    for (let i = 0; i < ops.length; i += 400) {
      const b = db.batch();
      ops.slice(i, i + 400).forEach(o => b.update(db.collection(o[0]).doc(o[1]), o[2]));
      await b.commit();
    }
    console.log('%c↩️ 되돌림 완료 (일출·일몰은 재생성됨)', 'color:#f59e0b;font-weight:bold');
  }

  console.log('%c준비됨 → atelierRev.preview()', 'color:#2563eb;font-weight:bold;font-size:14px');
  return { preview, apply, undo };
})();
