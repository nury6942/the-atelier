// ════════════════════════════════════════════════════════════════════
// Atlas — 2027~2028 미래 여행 계획 정적 데이터
// 데이터 출처: travel_atlas_2027_2028.html (사용자가 만든 dump)
// stitch 디자인: Travel Atlas Vibrant Color + Master Itinerary Eastern Canada
// ════════════════════════════════════════════════════════════════════
(function() {
  'use strict';

  // ──────── 4 trip 정적 데이터 ────────
  var TRIPS = [
    {
      id: 'scandinavia-2027',
      no: '01',
      year: 2027,
      title: 'The Scandinavian Spring',
      subtitle: 'Direct to Denmark, slow train to Sweden.',
      cities: 'Copenhagen & Stockholm',
      country: 'DENMARK & SWEDEN',
      countryCodes: 'DK / SE',
      flags: '🇩🇰 🇸🇪',
      gradient: 'linear-gradient(135deg,#dbeafe 0%,#818cf8 60%,#4338ca 100%)',
      month: 'May 2027',
      monthShort: "May '27",
      dates: 'May 12 → 23, 2027',
      nights: 9,
      days: 11,
      route: ['Copenhagen','Aarhus','Skagen','Malmö','Stockholm','Archipelago','Stockholm'],
      ptoDays: 6,
      holidayDays: 1,
      ptoNote: "May 13 (Buddha's Birthday) + 6 PTO (May 14, 17–21) + 2 weekends = 11일",
      gross: 539,
      subsidy: 0,
      own: 540,
      isCurrent: true,
      // 디테일 페이지 데이터
      itinerary: [
        { date:'05.12', dow:'수',          activity:'서울 근무, ICN 23:45 → 코펜하겐(CPH) SAS 직항.',                                stay:'기내' },
        { date:'05.13', dow:'목 ✦', hol:true, activity:'코펜하겐 06:05 도착. <i>뉘하운, 티볼리 가든.</i>',                            stay:'코펜하겐 · 1박' },
        { date:'05.14', dow:'금',          activity:'로젠보르 성, 크리스티아니아, 디자인 디스트릭트 산책.',                              stay:'코펜하겐 · 2박' },
        { date:'05.15', dow:'토',          activity:'<i>당일치기:</i> 헬싱외르(크론보르 성) + 루이지애나 미술관.',                       stay:'코펜하겐 · 3박' },
        { date:'05.16', dow:'일',          activity:'오르후스로 기차(3시간). ARoS 미술관, Den Gamle By.',                              stay:'오르후스 · 1박' },
        { date:'05.17', dow:'월',          activity:'렌터카 픽업. 오르후스 → 스카겐 운전(1.5시간). <i>두 바다가 만나는 곳.</i>',          stay:'스카겐 B&B' },
        { date:'05.18', dow:'화',          activity:'오르후스로 복귀해 차 반납, 코펜하겐행 기차 → 다리 건너 말뫼.',                       stay:'말뫼 · 1박' },
        { date:'05.19', dow:'수',          activity:'말뫼 오전(터닝 토르소), 오후 스톡홀름행 기차(4시간).',                              stay:'스톡홀름 · 1박' },
        { date:'05.20', dow:'목',          activity:'감라 스탄, 바사 박물관, 포토그라피스카.',                                            stay:'스톡홀름 · 2박' },
        { date:'05.21', dow:'금',          activity:'오후 <i>박솔름</i>으로 보트 — 군도에서 1박.',                                       stay:'군도 게스트하우스' },
        { date:'05.22', dow:'토',          activity:'보트로 복귀. 시청 + 드로트닝홀름 궁전. 저녁 비행기 출발.',                          stay:'기내' },
        { date:'05.23', dow:'일',          activity:'서울 도착. 월요일 전 휴식.',                                                       stay:'집' },
      ],
      lodging: [
        { nights:3, name:'코펜하겐',     type:'3★ 시티 호텔',            price:'20 만 / 박' },
        { nights:1, name:'오르후스',     type:'호스텔 싱글 / 3★',         price:'13 만' },
        { nights:1, name:'스카겐',       type:'B&B / 게스트하우스',       price:'15 만' },
        { nights:1, name:'말뫼',         type:'3★ 호텔',                  price:'18 만' },
        { nights:2, name:'스톡홀름',     type:'3★ 감라 스탄',             price:'22 만 / 박' },
        { nights:1, name:'박솔름',       type:'군도 B&B',                  price:'20 만' },
      ],
      lodgingTotal: '192 만원',
      budget: [
        { label:'항공권',           note:'SAS 직항 + 경유 복귀',     amount:180 },
        { label:'숙박',             note:'9박, 위 참조',             amount:192 },
        { label:'기차·보트·다리',   note:'',                          amount:30  },
        { label:'렌터카 (덴마크 2일)', note:'',                       amount:18  },
        { label:'연료 + 주차',      note:'',                          amount:8   },
        { label:'식비',             note:'카페 + 마켓',               amount:45  },
        { label:'입장료·액티비티',  note:'',                          amount:20  },
        { label:'대중교통',         note:'',                          amount:8   },
        { label:'보험',             note:'',                          amount:8   },
        { label:'유심·환전·여유',   note:'',                          amount:15  },
        { label:'기념품',           note:'',                          amount:15  },
      ],
      note: null,
    },
    {
      id: 'canada-2027',
      no: '02',
      year: 2027,
      title: 'The Maple Road',
      subtitle: 'Chasing peak foliage from Québec west to Toronto.',
      cities: 'Eastern Canada',
      country: 'CANADA',
      countryCodes: 'CA',
      flags: '🇨🇦',
      gradient: 'linear-gradient(135deg,#fef3c7 0%,#f59e0b 50%,#c2410c 100%)',
      month: 'Sep–Oct 2027',
      monthShort: "Oct '27",
      dates: 'Sep 26 → Oct 6, 2027',
      nights: 9,
      days: 11,
      route: ['Montréal','Charlevoix','Québec City','Mont-Tremblant','Ottawa','Algonquin','Toronto'],
      ptoDays: 1,
      corpLeaveDays: 5,
      holidayDays: 0,
      ptoNote: '5-Yr 회사 perk 5일 + Oct 5 PTO + 2 weekends → 11일',
      gross: 583,
      subsidy: -250,
      own: 333,
      subsidies: [
        { label: '5-Yr corp. air subsidy', value: -190 },
        { label: '5-Yr corp. cash perk',   value: -60  },
      ],
      itinerary: [
        { date:'09.26', dow:'토', activity:'ICN → 몬트리올 직항 (에어캐나다 / 대한항공).',                                       stay:'몬트리올 · 1박' },
        { date:'09.27', dow:'일', activity:'올드 몬트리올, 노트르담 대성당, 마일엔드 카페.',                                       stay:'몬트리올 · 2박' },
        { date:'09.28', dow:'월', activity:'렌터카 픽업. 몬트리올 → 샤를부아 운전(3시간). <i>단풍 드라이브 시작.</i>',              stay:'샤를부아 B&B' },
        { date:'09.29', dow:'화', activity:'샤를부아 → 퀘벡 시티 (1.5시간). 구시가지.',                                            stay:'퀘벡 시티 · 1박' },
        { date:'09.30', dow:'수', activity:'올드 퀘벡 산책, 아브라함 평원, 푸니쿨라, 오를레앙 섬 일주.',                            stay:'퀘벡 시티 · 2박' },
        { date:'10.01', dow:'목', activity:'퀘벡 시티 → 몽트랑블랑 (3시간). <i>빌리지 + 곤돌라.</i>',                               stay:'몽트랑블랑 로지' },
        { date:'10.02', dow:'금', activity:'몽트랑블랑 → 오타와 (2시간). 의회, 바이워드 마켓.',                                     stay:'오타와 · 1박' },
        { date:'10.03', dow:'토', activity:'오타와 → 알곤퀸 주립공원 (3시간). <i>단풍 절정 드라이브.</i>',                          stay:'알곤퀸 캐빈' },
        { date:'10.04', dow:'일', activity:'오전 호수 산책, 토론토로 운전(3시간).',                                                stay:'토론토 · 1박' },
        { date:'10.05', dow:'월', activity:'토론토: CN 타워, 디스틸러리 디스트릭트. 저녁 비행기 출발.',                              stay:'기내' },
        { date:'10.06', dow:'화', activity:'서울 도착. 다음날 출근.',                                                              stay:'집' },
      ],
      lodging: [
        { nights:2, name:'몬트리올',        type:'3–4★ 다운타운',    price:'22 만 / 박' },
        { nights:1, name:'샤를부아',        type:'B&B / 로지',       price:'15 만' },
        { nights:2, name:'퀘벡 시티',       type:'4★ 구시가지',       price:'25 만 / 박' },
        { nights:1, name:'몽트랑블랑',      type:'로지 / 샬레',       price:'18 만' },
        { nights:1, name:'오타와',          type:'3–4★ 다운타운',    price:'18 만' },
        { nights:1, name:'알곤퀸',          type:'캐빈 / 로지',       price:'20 만' },
        { nights:1, name:'토론토',          type:'3–4★ 다운타운',    price:'20 만' },
      ],
      lodgingTotal: '180 만원',
      budget: [
        { label:'항공권',           note:'YUL 입국 / YYZ 출국 (오픈조)', amount:190 },
        { label:'렌터카 · 7일',     note:'중형 SUV, 풀커버',              amount:75  },
        { label:'연료·톨·주차',     note:'약 1,500 km',                   amount:25  },
        { label:'숙박',             note:'9박',                            amount:180 },
        { label:'식비',             note:'',                               amount:40  },
        { label:'입장료·액티비티',  note:'',                               amount:20  },
        { label:'대중교통·우버',    note:'',                               amount:10  },
        { label:'보험',             note:'',                               amount:8   },
        { label:'유심·환전·여유',   note:'',                               amount:15  },
        { label:'기념품',           note:'메이플 시럽 ✦',                  amount:20  },
      ],
      note: '회사 5년차 perk가 항공권 전액 + ₩60만 현금 보너스 커버 — 캐나다는 장부에서 가장 저렴한 trip.',
    },
    {
      id: 'ireland-2028',
      no: '03',
      year: 2028,
      title: 'The Wild Atlantic Way',
      subtitle: 'Anti-clockwise loop, with one detour into the North.',
      cities: 'Ireland, end to end',
      country: 'IRELAND',
      countryCodes: 'IE',
      flags: '🇮🇪',
      gradient: 'linear-gradient(135deg,#d1fae5 0%,#10b981 50%,#065f46 100%)',
      month: 'Apr–May 2028',
      monthShort: "May '28",
      dates: 'Apr 29 → May 8, 2028',
      nights: 9,
      days: 10,
      route: ['Dublin','Kilkenny','Cork','Killarney','Cliffs of Moher','Galway','Sligo',"Giant's Causeway",'Belfast'],
      ptoDays: 4,
      holidayDays: 2,
      ptoNote: "근로자의 날(5/1) + 어린이날(5/5) + 2 weekends + 4 PTO = 10일",
      gross: 564,
      subsidy: 0,
      own: 566,
      itinerary: [
        { date:'04.29', dow:'토',          activity:'ICN → 더블린 (경유 1회). 늦은 오후 도착.',                                    stay:'더블린 · 1박' },
        { date:'04.30', dow:'일',          activity:'트리니티 대학, 켈스의 서, 기네스 스토어하우스, 템플 바.',                       stay:'더블린 · 2박' },
        { date:'05.01', dow:'월 ✦', hol:true, activity:'렌터카(오토) 픽업. 위클로 산맥 당일치기 → 킬케니.',                           stay:'킬케니 B&B' },
        { date:'05.02', dow:'화',          activity:'킬케니 → 코크 → <i>코브 (타이타닉 마지막 기항지)</i>.',                          stay:'코크 · 1박' },
        { date:'05.03', dow:'수',          activity:'코크 → <i>링 오브 케리</i> 드라이브 → 킬라니 국립공원.',                          stay:'킬라니 로지' },
        { date:'05.04', dow:'목',          activity:'킬라니 → <i>모허 절벽</i> → 골웨이.',                                            stay:'골웨이 · 1박' },
        { date:'05.05', dow:'금 ✦', hol:true, activity:'골웨이 → 코네마라 야생 → 슬라이고.',                                          stay:'슬라이고 B&B' },
        { date:'05.06', dow:'토',          activity:'슬라이고 → <i>다크 헤지스 → 자이언츠 코즈웨이</i> → 벨파스트. 국경 통과.',         stay:'벨파스트 · 1박' },
        { date:'05.07', dow:'일',          activity:'타이타닉 벨파스트 박물관, 평화의 벽. 저녁 비행기 출발.',                          stay:'기내' },
        { date:'05.08', dow:'월',          activity:'서울 도착. 회복용 PTO 하루.',                                                   stay:'집' },
      ],
      lodging: [
        { nights:2, name:'더블린',       type:'3★ 도심',                price:'22 만 / 박' },
        { nights:1, name:'킬케니',       type:'B&B / 게스트하우스',     price:'15 만' },
        { nights:1, name:'코크',         type:'3★ 호텔',                price:'18 만' },
        { nights:1, name:'킬라니',       type:'B&B / 국립공원',         price:'20 만' },
        { nights:1, name:'골웨이',       type:'3★ 호텔',                price:'20 만' },
        { nights:1, name:'슬라이고',     type:'B&B',                    price:'15 만' },
        { nights:1, name:'벨파스트',     type:'3★ 도심 (£)',            price:'20 만' },
      ],
      lodgingTotal: '178 만원',
      budget: [
        { label:'항공권',            note:'경유 1회, DUB 입국 / BFS 출국',                       amount:150 },
        { label:'렌터카 · 7일',      note:'오토 (수동의 ×2 가격), 풀커버, 국경 통과료',          amount:110 },
        { label:'연료·톨·주차',      note:'',                                                     amount:20  },
        { label:'숙박',              note:'9박',                                                  amount:178 },
        { label:'식비',              note:'펍 1–2박 + 카페',                                      amount:40  },
        { label:'입장료·액티비티',   note:'모허, 기네스, 타이타닉',                               amount:20  },
        { label:'대중교통',          note:'더블린·벨파스트',                                      amount:8   },
        { label:'보험',              note:'',                                                     amount:8   },
        { label:'유심·환전·여유',    note:'',                                                     amount:15  },
        { label:'기념품',            note:'',                                                     amount:15  },
      ],
      note: '아일랜드 오토 렌터카는 수동의 약 2배 가격. 6개월 전(2027.11) 예약 — 오토 재고가 얇음.',
    },
    {
      id: 'iceland-2028',
      no: '04',
      year: 2028,
      title: 'The Ring Road',
      subtitle: 'A 1,332 km loop — together, or postponed.',
      cities: 'Iceland, together',
      country: 'ICELAND',
      countryCodes: 'IS',
      flags: '🇮🇸',
      gradient: 'linear-gradient(135deg,#e0f2fe 0%,#0891b2 50%,#0c4a6e 100%)',
      month: 'Sep–Oct 2028',
      monthShort: "Oct '28",
      dates: 'Sep 29 → Oct 9, 2028',
      nights: 9,
      days: 11,
      route: ['Reykjavík','Golden Circle','Vík','Jökulsárlón','East Fjords','Mývatn','Akureyri','Snæfellsnes','Reykjavík'],
      ptoDays: 1,
      holidayDays: 3,
      ptoNote: '추석 + 대체공휴일 + 한글날 + 4 weekend days + 1 PTO (9/29) → 11일',
      gross: 717, // solo worst case
      subsidy: -202, // pair share
      own: 515, // paired
      paired: true,
      itinerary: [
        { date:'09.29', dow:'금',          activity:'ICN 23:45 → 코펜하겐 경유 → 케플라비크(KEF). 9.30 아침 도착.',                    stay:'레이캬비크 · 1박' },
        { date:'09.30', dow:'토',          activity:'<i>블루 라군</i> + 레이캬비크 시내 (할그림스키르캬, 하르파).',                        stay:'레이캬비크 · 2박' },
        { date:'10.01', dow:'일',          activity:'4WD 픽업. <i>골든 서클</i>: 싱벨리어, 게이시르, 굴포스.',                              stay:'셀리알란드포스 인근' },
        { date:'10.02', dow:'월',          activity:'남부 폭포: <i>셀리알란드포스, 스코가포스</i>, 비크 검은 모래.',                          stay:'비크' },
        { date:'10.03', dow:'화 ✦', hol:true, activity:'<i>요쿨살론 빙하 호수 + 다이아몬드 비치</i>. 동부 피오르 드라이브.',                stay:'호픈' },
        { date:'10.04', dow:'수',          activity:'동부 피오르 → 미바튼 호수 지역 (북부).',                                              stay:'미바튼 로지' },
        { date:'10.05', dow:'목 ✦', hol:true, activity:'미바튼 지열, 크라플라, <i>데티포스 폭포</i>. 오로라 관측.',                          stay:'미바튼 / 아쿠레이리' },
        { date:'10.06', dow:'금',          activity:'<i>후사비크 고래 관측</i> → 아쿠레이리 (북부 거점).',                                  stay:'아쿠레이리' },
        { date:'10.07', dow:'토',          activity:'아쿠레이리 → <i>스나이펠스네스 반도</i> ("아이슬란드의 미니어처").',                    stay:'스나이펠스네스' },
        { date:'10.08', dow:'일',          activity:'스나이펠스네스 → 레이캬비크 복귀. 저녁 비행기 출발.',                                  stay:'기내' },
        { date:'10.09', dow:'월 ✦', hol:true, activity:'코펜하겐 경유 서울 도착.',                                                          stay:'집' },
      ],
      lodging: [
        { nights:2, name:'레이캬비크',           type:'3★ 시티 호텔',           price:'25 만 / 박' },
        { nights:1, name:'셀리알란드포스 인근',  type:'게스트하우스',           price:'20 만' },
        { nights:1, name:'비크',                 type:'컨트리 호텔',            price:'25 만' },
        { nights:1, name:'호픈',                 type:'게스트하우스',           price:'22 만' },
        { nights:1, name:'미바튼',               type:'네이처 로지 ✦ 오로라',   price:'28 만' },
        { nights:2, name:'아쿠레이리',           type:'3★ 호텔',                price:'22 만 / 박' },
        { nights:1, name:'스나이펠스네스',       type:'게스트하우스',           price:'20 만' },
      ],
      lodgingTotal: '209 만 → 110 만 (페어 ÷2)',
      budget: [
        { label:'항공권',                  note:'SAS 코펜하겐 경유 · 본인 결제',         amount:180  },
        { label:'렌터카 · 9일 ÷2',         note:'4WD SUV, 풀커버',                       amount:70   },
        { label:'연료 ÷2',                 note:'1,332 km, 비싼 기름',                    amount:17.5 },
        { label:'숙박 ÷2',                 note:'9박, 트윈룸',                            amount:110  },
        { label:'식비',                    note:'Bónus + 로지 식사',                      amount:55   },
        { label:'액티비티',                note:'블루 라군, 고래 투어, 빙하',             amount:45   },
        { label:'보험 · 본인',             note:'',                                       amount:12   },
        { label:'유심·톨·여유 ÷2',         note:'',                                       amount:15   },
        { label:'기념품',                  note:'',                                       amount:10   },
      ],
      note: '아이슬란드는 동행인이 있어야 가능 — 솔로면 보류하고 가까운 시점에 다른 곳으로 재선택.',
    },
  ];

  // ──────── Wishlist (2029+ 후보) ────────
  var WISHLIST = [
    { no:'01', name:'Norway',               flag:'🇳🇴',     sub:'Fjords + Aurora',         note:"베르겐, 송네피오르, 게이랑게르, 로포텐 제도, 트롬쇠 오로라. 28년 5월 북유럽 갈 때 빡세서 뺐는데, 피오르 사진 보고 '다음에 꼭' 한 곳." },
    { no:'02', name:'Georgia & Armenia',    flag:'🇬🇪 🇦🇲', sub:'Caucasus · 2029+',         note:'코카서스 산맥, 와인 발상지, 음식 천국. 안전 측면 좀 빡세서 컨디션 맞을 때 (2029+) 가기로 보류한 곳.' },
    { no:'03', name:'Dolomites',            flag:'🇮🇹',     sub:'June–Sept window',         note:'알프스 바위산 + 호수, 6~9월 베스트. 26년 토스카나 일정에서 무리 안 하고 뺐던 곳, 따로 일주일 잡고 가기로.' },
    { no:'04', name:'Normandy & Brittany',  flag:'🇫🇷',     sub:'Coastal drive',            note:'에트르타 코끼리 바위, 몽생미셸, 옹플뢰르. 중세 해안 드라이브.' },
    { no:'05', name:'Highway 1 (PCH)',      flag:'🇺🇸',     sub:'SF → LA',                  note:'샌프란시스코 → LA, 카멜·빅서·산타바바라. 태평양 끼고 달리는 진리의 루트.' },
    { no:'06', name:'Mallorca',             flag:'🇪🇸',     sub:'Mediterranean',            note:'지중해 휴양지, 절벽 해안 드라이브, 소예르 같은 오렌지 마을.' },
    { no:'07', name:'Slovenia',             flag:'🇸🇮',     sub:'Hidden Alpine',            note:'블레드 호수, 트리글라브 국립공원. 유럽 렌터카 여행의 숨은 진주.' },
    { no:'08', name:'Bavaria',              flag:'🇩🇪',     sub:'Romantic Road',            note:'뮌헨, 노이슈반슈타인 성, 중세 소도시들. 독일 남부 바이에른.' },
  ];

  // ──────── 집계 ────────
  function totals() {
    var trips = TRIPS.length;
    var days = 0, pto = 0, gross = 0, own = 0;
    TRIPS.forEach(function(t) {
      days += t.days || 0;
      pto += t.ptoDays || 0;
      gross += t.gross || 0;
      own += t.own || 0;
    });
    return {
      trips: trips,
      days: days,
      pto: pto,
      gross: gross,
      own: own,
      countries: 7,
      subsidy: 452,    // Canada 250 + Iceland pair 202
      leverage: '3.2×',
    };
  }

  // ──────── trip 합 (날짜 한 줄 표시용) ────────
  function tripBudgetSum(trip) {
    var s = 0;
    (trip.budget || []).forEach(function(b) { s += (b.amount || 0); });
    return Math.round(s * 10) / 10;
  }

  // ★ (2026-07-24) 여행 → 항공권 추적 매핑. route 첫 도시=입국, 끝 도시=출국 공항.
  //   months는 dates에서 뽑은 여행 기간에 걸치는 달 전부(그 달들만 시세를 추적).
  var FLIGHT_MAP = {
    'scandinavia-2027': { to: 'CPH', city: '코펜하겐', months: ['2027-05'] },
    'canada-2027':      { to: 'YUL', city: '몬트리올', months: ['2027-09', '2027-10'] },
    'ireland-2028':     { to: 'DUB', city: '더블린',   months: ['2028-04', '2028-05'] },
    'iceland-2028':     { to: 'KEF', city: '레이캬비크', months: ['2028-09', '2028-10'] }
  };

  // 글로벌 export
  window.ATLAS_DATA = {
    TRIPS: TRIPS,
    WISHLIST: WISHLIST,
    FLIGHT_MAP: FLIGHT_MAP,
    totals: totals,
    tripBudgetSum: tripBudgetSum,
    findTrip: function(id) {
      for (var i = 0; i < TRIPS.length; i++) {
        if (TRIPS[i].id === id) return TRIPS[i];
      }
      return null;
    },
  };
})();
