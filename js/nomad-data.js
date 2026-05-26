// ════════════════════════════════════════════════════════════════════
// Nomad Master 데이터 모듈
// Source: nomad-master-dashboard.html (Claude 작업본)
// 2028.6.9 출국 → 2029.6 귀국 · 17개 도시 · 1년 노마드 마스터플랜
// ════════════════════════════════════════════════════════════════════

window.NOMAD_DATA = (function(){

  // ──────── NAV 구조 (사이드바) ────────
  var NAV = [
    { group: 'Overview', items: [
      { id: 'nomad-overview',   icon: 'dashboard', label: 'Overview' },
      { id: 'nomad-gate',       icon: 'flag',      label: 'Nomad Gate' },
    ]},
    { group: 'Plan', items: [
      { id: 'nomad-voyage',     icon: 'explore',   label: '12-Month Voyage' },
      { id: 'nomad-backward',   icon: 'route',     label: 'Backward Plan' },
      { id: 'nomad-budget',     icon: 'payments',  label: 'Budget' },
    ]},
    { group: 'Tracks', items: [
      { id: 'nomad-ip',         icon: 'menu_book', label: '소설' },
      { id: 'nomad-channels',   icon: 'home_work', label: 'Stay Channels' },
      { id: 'nomad-principles', icon: 'rule',      label: 'Operating Principles' },
    ]},
    { group: 'Logistics', items: [
      { id: 'nomad-visa',       icon: 'badge',          label: 'Visa & Documents' },
      { id: 'nomad-wh',         icon: 'flight_takeoff', label: 'Working Holiday' },
      { id: 'nomad-actions',    icon: 'fact_check',     label: 'Action Items' },
      { id: 'nomad-packing',    icon: 'luggage',        label: 'Packing List' },
    ]},
    { group: 'City Guides', items: [
      { id: 'nomad-city-porto',      icon: 'location_city', label: '6월 · 포르투' },
      { id: 'nomad-city-dublin',     icon: 'location_city', label: '7월 · 더블린' },
      { id: 'nomad-city-galway',     icon: 'location_city', label: '7월 · 골웨이' },
      { id: 'nomad-city-copenhagen', icon: 'location_city', label: '8월 · 코펜하겐' },
      { id: 'nomad-city-bergen',     icon: 'location_city', label: '8월 · 베르겐' },
      { id: 'nomad-city-stockholm',  icon: 'location_city', label: '9월 · 스톡홀름' },
      { id: 'nomad-city-helsinki',   icon: 'location_city', label: '9월 · 헬싱키' },
      { id: 'nomad-city-reykjavik',  icon: 'location_city', label: '10월 · 레이캬비크' },
      { id: 'nomad-city-portugal2',  icon: 'location_city', label: '10-11월 · 포르투갈 복귀' },
      { id: 'nomad-city-valletta',   icon: 'location_city', label: '11월 · 발레타' },
      { id: 'nomad-city-hobart',     icon: 'location_city', label: '12월 · 호바트' },
      { id: 'nomad-city-adelaide',   icon: 'location_city', label: '1월 · 애들레이드' },
      { id: 'nomad-city-melbourne',  icon: 'location_city', label: '2월 · 멜버른' },
      { id: 'nomad-city-nz',         icon: 'location_city', label: '3월 · 뉴질랜드' },
      { id: 'nomad-city-sandiego',   icon: 'location_city', label: '4월 · 샌디에이고' },
      { id: 'nomad-city-nyc',        icon: 'location_city', label: '4월 · 뉴욕 (위성)' },
      { id: 'nomad-city-halifax',    icon: 'location_city', label: '5월 · 핼리팩스' },
    ]},
  ];

  // ──────── VOYAGE (12개월 동선) ────────
  var VOYAGE = [
    { month: '6월', year: 2028, city: '포르투',                 detail: '워홀 비자 첫 거점 · 1달',                            visa: '워홀',         schengen: 'X',     cost: 282, mode: '글 풀가동' },
    { month: '7월', year: 2028, city: '더블린 + 골웨이',         detail: '아일랜드 · 위성 아란·모헤어 · 14+14일',              visa: '무비자',       schengen: '셰겐 외', cost: 576, mode: '글 + 위성' },
    { month: '8월', year: 2028, city: '코펜하겐 + 베르겐',       detail: '덴마크·노르웨이 · 위성 루이지애나, 송네피요르드',     visa: '셰겐',         schengen: '19일',  cost: 640, mode: '이동 많음' },
    { month: '9월', year: 2028, city: '스톡홀름 + 헬싱키',       detail: '스웨덴·핀란드 · 각 20일 · Flatio 거점',              visa: '셰겐',         schengen: '40일',  cost: 650, mode: '글 풀가동' },
    { month: '10월',year: 2028, city: '레이캬비크 + 포르투갈 복귀', detail: '아이슬란드 7일 (오로라) + 포르투갈 워홀 재진입',  visa: '셰겐 + 워홀',   schengen: '7일',   cost: 638, mode: '휴가 모드' },
    { month: '11월',year: 2028, city: '포르투갈 + 발레타',       detail: '말타 18일',                                          visa: '워홀 + 셰겐',   schengen: '18일',  cost: 400, mode: '글 + 해변' },
    { month: '12월',year: 2028, city: '호바트',                   detail: '태즈매니아 · MONA, 와인글래스',                      visa: 'ETA',          schengen: '외',    cost: 374, mode: '글 + 자연' },
    { month: '1월', year: 2029, city: '애들레이드',               detail: '바로사 와인 · 멜버른 성수기 회피',                    visa: 'ETA',          schengen: '외',    cost: 407, mode: '글 + 예술' },
    { month: '2월', year: 2029, city: '멜버른',                   detail: '살아보기 · 풀가동',                                  visa: 'ETA',          schengen: '외',    cost: 430, mode: '글 풀가동' },
    { month: '3월', year: 2029, city: '뉴질랜드',                 detail: '오클랜드 또는 퀸스타운 · 자연',                       visa: 'NZeTA',        schengen: '외',    cost: 376, mode: '글 + 자연' },
    { month: '4월', year: 2029, city: '샌디에이고 + 뉴욕(3박)',   detail: '미국 서·동부 경험',                                  visa: 'ESTA',         schengen: '외',    cost: 480, mode: '글 + 미국 경험' },
    { month: '5월', year: 2029, city: '핼리팩스',                 detail: '캐나다 동부 · 니트·공예 커뮤니티',                    visa: 'eTA',          schengen: '외',    cost: 410, mode: '마무리' },
  ];

  // ──────── PHASES (백워드 플랜) ────────
  var PHASES = [
    {
      id: 'A', name: 'Foundation',
      range: '2026.5 ~ 2026.12 (7개월)',
      title: 'IP 구축 + 재무 시스템 셋업',
      description: '필명·도메인·메일리·콘텐츠 5편·도구 MVP·뉴스레터 런칭·페이스 안정 (분석가 N Phase 1-5)',
      items: [
        '부업 수익 25% 자동이체 (종합소득세 예비비)',
        '2027.4 신용대출 종결 알림 캘린더 등록',
        '여권 만료일 확인 (2029.6 이후 6개월 이상)',
        '분석가 N Phase 1-5 진행',
        '영문 포트폴리오 정리 시작',
      ],
    },
    {
      id: 'B', name: 'Build & Gate',
      range: '2027.1 ~ 2027.12 (12개월)',
      title: '수익 구조 시작 + 첫 게이트 평가',
      description: '신용대출 종결, 노마드 펀드 셋업, IP Phase 6-7, 2027.12 게이트 평가',
      items: [
        '2027.3 신용대출 완전 종결',
        '2027.4 ₩200만 노마드 펀드 자동이체 시작',
        '2027.5 2026년 부업 종합소득세 신고',
        'IP Phase 6-7 (사연 받기·디지털 제품·멤버십·1:1 분석)',
        '영문 포트폴리오 완성 + 링크드인 영문',
        '2027.12 게이트 평가: 월 ₩450만 달성?',
      ],
    },
    {
      id: 'C', name: 'Exit',
      range: '2028.1 ~ 2028.5 (5개월)',
      title: '본업 출구 + 비자 신청 + 짐 정리',
      description: '인센티브 받고 5월 초 퇴사 통보, 워홀 비자 신청, 동선·숙소 확정',
      items: [
        '2028.1 종합소득세 신고 준비',
        '2028.1-2 워홀 비자 자료 수집 (범죄경력회보서·보험·재정증빙)',
        '2028.3 주한 포르투갈 대사관 방문 예약',
        '2028.3 6-8월 숙소 확정 예약',
        '2028.3-4 워홀 비자 신청',
        '2028.4 9-11월 숙소 확정 예약',
        '2028.4 말 인센티브 수령',
        '2028.5 초 퇴사 통보',
        '2028.5 미국 ESTA · 호주 ETA · 캐나다 eTA · 뉴질랜드 NZeTA 신청',
        '2028.5 국제운전면허증 + 여행자보험',
        '2028.5 말 퇴사 완료',
      ],
    },
    {
      id: 'D', name: 'Departure',
      range: '2028.6.1 ~ 6.9 (1-2주)',
      title: '부여 1주일 + 최종 점검 + 출국',
      description: '부여 본가 가족 시간 → 서울 복귀 → 인천 출국',
      items: [
        '6.1-7 부여 본가 1주일 (엄마·아빠와)',
        '6.8 서울 복귀',
        '동생한테 집·차 인계',
        '모든 서류 클라우드 백업',
        '6.9 인천 → 리스본 출국',
      ],
    },
  ];

  // ──────── BUDGET (월별 예산, 단위: 만 원) ────────
  var BUDGET = [
    { period: '2028.6',  city: '포르투',                              stay: 165, life: 117, total: 282 },
    { period: '2028.7',  city: '더블린 + 골웨이',                      stay: 400, life: 176, total: 576 },
    { period: '2028.8',  city: '코펜하겐 + 베르겐',                    stay: 470, life: 170, total: 640 },
    { period: '2028.9',  city: '스톡홀름 + 헬싱키',                    stay: 470, life: 180, total: 650 },
    { period: '2028.10', city: '헬싱키 + 레이캬비크 + 포르투갈',        stay: 470, life: 168, total: 638 },
    { period: '2028.11', city: '포르투갈 + 발레타',                    stay: 270, life: 130, total: 400 },
    { period: '2028.12', city: '호바트',                              stay: 280, life:  94, total: 374 },
    { period: '2029.1',  city: '애들레이드',                          stay: 300, life: 107, total: 407 },
    { period: '2029.2',  city: '멜버른',                              stay: 320, life: 110, total: 430 },
    { period: '2029.3',  city: '뉴질랜드',                            stay: 250, life: 126, total: 376 },
    { period: '2029.4',  city: '샌디에이고 (+뉴욕 3박)',                stay: 380, life: 100, total: 480 },
    { period: '2029.5',  city: '핼리팩스',                            stay: 300, life: 110, total: 410 },
  ];

  // 일회성 비용 (월별 외)
  var BUDGET_ONEOFF = {
    flights:    550,  // 항공권 (인천→리스본, 핼리팩스→인천, 대륙 간)
    visa:       130,  // 워홀 비자 + ETA/ESTA/eTA/NZeTA
    insurance:  200,  // 장기 여행자보험 1년
    misc:       300,  // 짐·기기·예비
  };

  // ──────── STAY CHANNELS ────────
  var CHANNELS_EU = [
    { city: '포르투 (1달)',          first: 'Flatio',                 second: 'Idealista (로컬)', note: '€40-60/박' },
    { city: '더블린 (13일)',         first: 'Booking 아파트호텔',     second: 'Airbnb 단기',      note: '7월 성수기' },
    { city: '골웨이 (14일)',         first: 'Booking 아파트호텔',     second: 'Airbnb 단기',      note: '시내 외곽 OK' },
    { city: '코펜하겐 (11일)',       first: 'Locke 아파트호텔',       second: 'Booking',          note: '디자인 호텔' },
    { city: '베르겐 (8일)',          first: '게스트하우스',           second: 'Booking',          note: '짧은 체류' },
    { city: '스톡홀름 (20일)',       first: 'Flatio',                 second: 'Spotahome',        note: '20일+ Flatio 효율' },
    { city: '헬싱키 (20일)',         first: 'Flatio',                 second: 'Spotahome',        note: '오디 도서관 근처' },
    { city: '레이캬비크 (7일)',       first: 'Booking 게스트하우스',   second: 'Airbnb',           note: '짧음' },
    { city: '포르투갈 복귀 (1달)',    first: 'Flatio',                 second: 'Idealista',        note: '워홀 베이스캠프' },
    { city: '발레타 (20일)',         first: 'Spotahome',              second: 'Airbnb 주간',      note: '작은 시장' },
  ];

  var CHANNELS_GLOBAL = [
    { city: '호바트 (1달)',     first: 'Stayz (호주 로컬)',       second: 'Airbnb 월할인', note: 'Stayz가 호주 표준' },
    { city: '애들레이드 (1달)', first: 'Stayz',                   second: 'Airbnb 월할인', note: '—' },
    { city: '멜버른 (1달)',     first: 'Stayz',                   second: 'Airbnb 월할인', note: '2월 성수기 끝' },
    { city: '뉴질랜드 (1달)',   first: 'Bookabach (NZ 로컬)',     second: 'Airbnb 월할인', note: '뉴질랜드판 Stayz' },
    { city: '샌디에이고 (1달)', first: 'Furnished Finder',         second: 'Airbnb 월할인', note: '미국 노마드 전용' },
    { city: '핼리팩스 (1달)',   first: 'Furnished Finder',         second: 'Airbnb 월할인', note: '—' },
  ];

  // ──────── VISA LIST ────────
  var VISA_LIST = [
    { country: '포르투갈',                       type: '워홀 비자',                when: '2028.3-4 신청', stay: '1년 (다회)',           note: '셰겐 카운트 회피용 베이스캠프' },
    { country: '아일랜드',                       type: '무비자',                   when: '입국 시',       stay: '90일',               note: '셰겐 외' },
    { country: '셰겐 (덴·노·스·핀·아·말)',         type: '무비자',                   when: '입국 시',       stay: '90/180 룰',          note: '누리 누적 84일 / 한도 안' },
    { country: '호주',                          type: 'ETA (A$20)',              when: '2028.5',        stay: '12개월, 1회 3개월',   note: 'ImmiAccount' },
    { country: '뉴질랜드',                       type: 'NZeTA (NZ$23 + IVL$35)',  when: '2028.5',        stay: '2년, 1회 90일',       note: 'NZeTA 앱' },
    { country: '미국',                           type: 'ESTA ($21)',              when: '2028.5',        stay: '2년, 1회 90일',       note: 'ESTA 공식' },
    { country: '캐나다',                         type: 'eTA (C$7)',               when: '2028.5',        stay: '5년, 1회 180일',      note: '캐나다 정부 사이트' },
  ];

  // ──────── ACTION ITEMS (시기별) ────────
  var ACTIONS_BY_PERIOD = [
    { when: '이번 주 (2026.5 말 ~ 6월 초)', items: [
      '필명 후보 3-5개 작성 (한글 + 영문)',
      '도메인 후보 검색 (Namecheap, 후이즈, GoDaddy)',
      '메일리 vs Substack 검토',
      '디지털 노마드 펀드 계좌 분리',
      '부업 수익 25% 자동이체 룰 설정',
      '여권 만료일 확인',
    ]},
    { when: '이번 달 (2026.6)', items: [
      '메일리 또는 Substack 가입 + 채널 세팅',
      '도메인 1차 후보 확정',
      '분석가 N 콘텐츠 첫 5편 주제 메모',
      '대한항공 마일리지 잔액 확인',
      '신한 SOL Travel / 하나 트래블로그 카드 발급',
    ]},
    { when: '2026 후반 (7-12월)', items: [
      'Phase 1-5 진행 완료 (Foundation → Settle)',
      '영문 포트폴리오 정리 시작',
      '링크드인 영문 프로필',
    ]},
    { when: '2027 전반 (1-6월)', items: [
      '신용대출 종결 (3월)',
      '노마드 펀드 자동이체 시작 (4월)',
      '2026년 종합소득세 신고 (5월)',
      'IP Phase 6 Expand',
    ]},
    { when: '2027 후반 (7-12월)', items: [
      'IP Phase 7 Monetize',
      '영문 포트폴리오 완성',
      '노마드 짐 리스트 작성',
      '2027.12 게이트 평가 (월 ₩450만 달성?)',
    ]},
    { when: '2028.1-2', items: [
      '종합소득세 신고 준비',
      '워홀 비자 자료 수집 시작',
      '범죄경력회보서 영문 발급',
      '여행자보험 견적 비교',
      '노마드 짐 본격 구매',
    ]},
    { when: '2028.3-4', items: [
      '주한 포르투갈 대사관 예약',
      '워홀 비자 신청 + 대사관 방문',
      '6-11월 숙소 확정 예약',
      '4월 말 인센티브 수령',
    ]},
    { when: '2028.5', items: [
      '5월 초 퇴사 통보',
      'ESTA / ETA / NZeTA / eTA 신청',
      '국제운전면허증 발급',
      '여행자보험 가입',
      '트래블월렛 + Wise 카드',
      '5월 말 퇴사 완료',
    ]},
    { when: '2028.6 출국', items: [
      '6.1-7 부여 본가 1주일',
      '6.8 서울 복귀',
      '동생한테 집·차 인계',
      '서류 클라우드 백업 + 가족 공유',
      '6.9 인천 → 리스본 출국',
    ]},
  ];

  // ──────── PACKING LIST ────────
  var PACKING = {
    '캐리어 — 옷': [
      '반팔 티 5-7장 (베이직, 디자이너 안목)',
      '긴팔 티 / 얇은 니트 3-4장',
      '가디건·니트 2-3개 (본업 자산)',
      '셔츠 1-2장 (격식·만남용)',
      '청바지 1-2벌',
      '면바지·치노 1-2벌',
      '반바지 1벌',
      '레깅스 2벌',
      '가벼운 트렌치코트 1개',
      '슬림 패딩 1개 (10월 아이슬란드·8월 노르웨이)',
      '가벼운 윈드브레이커·비옷 1개',
      '속옷 7-10세트',
      '양말 7-10켤레 (일반 + 보온)',
      '잠옷 2벌',
      '수영복 1-2벌 (말타·호주·핀란드 사우나)',
      '운동복 1-2세트',
    ],
    '캐리어 — 신발': [
      '운동화 (편한 걷기용) 1켤레',
      '부츠 (방수, 가을·겨울) 1켤레',
      '샌들 1켤레',
      '슬리퍼 1켤레 (숙소용)',
    ],
    '디자인 · 작업 도구': [
      '노트북 + 충전기 + 파우치',
      '태블릿 (아이패드 + 펜슬)',
      '외장 SSD 1TB (백업)',
      '외장 마우스 + 키보드',
      '노트북 받침대',
      '국가별 어댑터 (C·G·I·A 타입)',
      '한국 멀티탭 1개',
      'USB 케이블 (Lightning, USB-C × 2-3)',
      '보조배터리 10,000mAh+',
    ],
    '작가 도구': [
      '노트 1-2권',
      '펜 3-5개',
      '킨들 또는 e-reader',
    ],
    '세면 · 뷰티': [
      '클렌징·스킨케어 트래블 사이즈',
      '메이크업 베이직 (선크림·립밤·BB·아이라이너)',
      '헤어드라이어 (듀얼볼트)',
      '헤어 기기 (듀얼볼트)',
      '손톱깎이·면도기·면봉',
    ],
    '의약 · 건강': [
      '비상약 키트 (감기약·진통제·소화제·연고·밴드·체온계)',
      '한국 처방약 + 영문 처방전',
      '비타민·영양제',
      '마스크 5-10장',
      '손소독제',
    ],
    '백팩 — 기내': [
      '노트북 (보호 케이스)',
      '태블릿 + 펜슬',
      '카메라 (선택)',
      '여권 + 지갑 + 카드',
      '보조배터리',
      '이어폰 (노이즈캔슬링)',
      '물병 (재사용)',
      '가벼운 가디건',
      '안대·목 베개·슬리퍼',
    ],
    '작은 가방 — 개인 휴대': [
      '여권 + 비자 서류 (원본)',
      '신용카드 2 + 체크카드 2',
      '비상금 현금 (유로·달러)',
      '스마트폰 + 충전기',
      '셀카봉·삼각대 (선택)',
      '미니 파우치 (립밤·휴지·생리대)',
    ],
  };

  // ──────── VISA DOCUMENTS ────────
  var VISA_DOCS = [
    { cat: '신분 서류', items: [
      '여권 (2029.6 이후 6개월 이상)',
      '여권 사본 (스캔 + 클라우드)',
      '여권 사진 디지털 + 인쇄 10장',
      '주민등록증 사본',
      '국제운전면허증 (1년 유효)',
      '운전면허증 영문번역 공증 (호주·NZ 일부 주)',
    ]},
    { cat: '공식 증명서 (워홀 핵심)', items: [
      '범죄경력회보서 영문',
      '건강진단서 영문 (요구 시)',
      '재정증빙 영문 (€5,000 이상 권장)',
      '여행자보험 증명서 영문 (€30,000+ 보장)',
      '항공권 사본 (왕복 또는 출국편)',
      '숙소 예약 증명서 (첫 1-3개월)',
    ]},
    { cat: '금융 · 결제', items: [
      '트래블월렛 카드',
      'Wise 계좌 + 카드',
      '신한 SOL Travel 체크카드',
      '하나 트래블로그 체크카드',
      '국내 신용카드 2개 (Visa, Master)',
      '비상금 현금 (€500, A$300, $500)',
    ]},
    { cat: '의료 · 건강', items: [
      '장기 여행자보험 1년 가입',
      '영문 처방전 (복용약)',
      '예방접종 기록',
      '비상약 키트',
    ]},
    { cat: '백업', items: [
      '모든 서류 클라우드 백업 (Google + Naver + USB)',
      '가족에게 핵심 서류 사본 공유',
      '비상연락처 리스트',
    ]},
  ];

  return {
    NAV: NAV,
    VOYAGE: VOYAGE,
    PHASES: PHASES,
    BUDGET: BUDGET,
    BUDGET_ONEOFF: BUDGET_ONEOFF,
    CHANNELS_EU: CHANNELS_EU,
    CHANNELS_GLOBAL: CHANNELS_GLOBAL,
    VISA_LIST: VISA_LIST,
    ACTIONS_BY_PERIOD: ACTIONS_BY_PERIOD,
    PACKING: PACKING,
    VISA_DOCS: VISA_DOCS,
  };
})();
