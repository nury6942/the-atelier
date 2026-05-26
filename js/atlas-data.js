// ════════════════════════════════════════════════════════════════════
// Atlas — 2027~2028 미래 여행 계획 정적 데이터
// 데이터 출처: travel_atlas_2027_2028.html (사용자가 만든 dump)
// stitch 디자인 (Travel Atlas Vibrant Color + Master Itinerary Eastern Canada)
// ════════════════════════════════════════════════════════════════════
(function() {
  'use strict';

  // 4개 trip (정적 — 사용자가 별도로 관리)
  var TRIPS = [
    {
      id: 'scandinavia-2027',
      no: '01',
      title: 'The Scandinavian Spring',
      subtitle: 'Direct to Denmark, slow train to Sweden.',
      cities: 'Copenhagen & Stockholm',
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
      ptoNote: 'May 13 (Buddha\'s Birthday) + 6 PTO (May 14, 17–21) + 2 weekends = 11일',
      gross: 539,   // 만원
      own: 540,
      isCurrent: true, // 가장 가까운 trip
    },
    {
      id: 'canada-2027',
      no: '02',
      title: 'The Maple Road',
      subtitle: 'Chasing peak foliage from Québec west to Toronto.',
      cities: 'Eastern Canada',
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
      ptoNote: '5-Yr 회사 perk 5일 + Oct 5 PTO + 2 weekends → 11일',
      gross: 583,
      own: 333,
      perks: [{ label: '5-Yr corp. air subsidy', value: -190 }, { label: '5-Yr corp. cash perk', value: -60 }],
    },
    {
      id: 'ireland-2028',
      no: '03',
      title: 'The Wild Atlantic Way',
      subtitle: 'Anti-clockwise loop, with one detour into the North.',
      cities: 'Ireland, end to end',
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
      ptoNote: '근로자의 날(5/1) + 어린이날(5/5) + 2 weekends + 4 PTO = 10일',
      gross: 564,
      own: 566,
    },
    {
      id: 'iceland-2028',
      no: '04',
      title: 'The Ring Road',
      subtitle: 'A 1,332 km loop — together, or postponed.',
      cities: 'Iceland, together',
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
      ptoNote: '추석 연휴 + 개천절 + 2 weekends + 1 PTO = 11일',
      gross: 690,
      own: 690,
    },
  ];

  // Wishlist (먼 미래 후보)
  var WISHLIST = [
    { no: '01', name: 'Patagonia',  flag: '🇦🇷', note: '안데스 종주, 토레스 델 파이네.' },
    { no: '02', name: 'Kyoto',      flag: '🇯🇵', note: '봄 또는 늦가을, 사찰 + 차.' },
    { no: '03', name: 'Alps',       flag: '🇨🇭', note: '인터라켄 — 마이리지 융프라우 라우터브룬넨.' },
    { no: '04', name: 'Tuscany',    flag: '🇮🇹', note: '시에나·산지미냐노·발도르차 와인 길.' },
    { no: '05', name: 'Socotra',    flag: '🇾🇪', note: '용혈수 섬, 셋업 어려움 시즌 가려가야.' },
    { no: '06', name: 'Lofoten',    flag: '🇳🇴', note: '여름 백야 + 가을 오로라 시즌.' },
  ];

  // 집계
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
      countries: 7, // DK/SE/CA/IE/IS + DK/SE 두 나라
    };
  }

  // 글로벌 export
  window.ATLAS_DATA = {
    TRIPS: TRIPS,
    WISHLIST: WISHLIST,
    totals: totals,
  };
})();
