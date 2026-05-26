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
        { date:'05.12', dow:'WED',         activity:'Work day in Seoul, then ICN 23:45 → CPH on SAS direct.',                    stay:'In flight' },
        { date:'05.13', dow:'THU ✦', hol:true, activity:'Arrive Copenhagen 06:05. <i>Nyhavn, Tivoli Gardens.</i>',                stay:'Copenhagen · night 1' },
        { date:'05.14', dow:'FRI',         activity:'Rosenborg Castle, Christiania, design district walk.',                       stay:'Copenhagen · night 2' },
        { date:'05.15', dow:'SAT',         activity:'<i>Day trip:</i> Helsingør (Kronborg Castle) + Louisiana Museum.',           stay:'Copenhagen · night 3' },
        { date:'05.16', dow:'SUN',         activity:'Train to Aarhus (3h). ARoS museum, Den Gamle By.',                            stay:'Aarhus · 1 night' },
        { date:'05.17', dow:'MON',         activity:'Pick up rental. Drive Aarhus → Skagen (1.5h). <i>Where two seas meet.</i>',   stay:'Skagen B&B' },
        { date:'05.18', dow:'TUE',         activity:'Drive back, drop car in Aarhus, train to Copenhagen → bridge to Malmö.',     stay:'Malmö · 1 night' },
        { date:'05.19', dow:'WED',         activity:'Malmö morning (Turning Torso), afternoon train → Stockholm (4h).',           stay:'Stockholm · night 1' },
        { date:'05.20', dow:'THU',         activity:'Gamla Stan, Vasa Museum, Fotografiska.',                                     stay:'Stockholm · night 2' },
        { date:'05.21', dow:'FRI',         activity:'Afternoon boat to <i>Vaxholm</i> — overnight in the archipelago.',           stay:'Archipelago guesthouse' },
        { date:'05.22', dow:'SAT',         activity:'Boat back. City Hall + Drottningholm Palace. Evening flight out.',           stay:'In flight' },
        { date:'05.23', dow:'SUN',         activity:'Arrive Seoul. Rest before Monday.',                                          stay:'Home' },
      ],
      lodging: [
        { nights:3, name:'Copenhagen',  type:'3★ city hotel',          price:'20 만 / night' },
        { nights:1, name:'Aarhus',      type:'Hostel single / 3★',     price:'13 만' },
        { nights:1, name:'Skagen',      type:'B&B / guesthouse',       price:'15 만' },
        { nights:1, name:'Malmö',       type:'3★ hotel',               price:'18 만' },
        { nights:2, name:'Stockholm',   type:'3★ Gamla Stan area',     price:'22 만 / night' },
        { nights:1, name:'Vaxholm',     type:'Archipelago B&B',        price:'20 만' },
      ],
      lodgingTotal: '192 만원',
      budget: [
        { label:'Flights',                  note:'SAS direct + 1-stop return', amount:180 },
        { label:'Lodging',                  note:'9 nights, see above',        amount:192 },
        { label:'Trains, boats, bridges',   note:'',                            amount:30  },
        { label:'Rental (Denmark, 2 days)', note:'',                            amount:18  },
        { label:'Fuel + parking',           note:'',                            amount:8   },
        { label:'Food',                     note:'Café + market',               amount:45  },
        { label:'Entries & activities',     note:'',                            amount:20  },
        { label:'Local transit',            note:'',                            amount:8   },
        { label:'Insurance',                note:'',                            amount:8   },
        { label:'Sim, FX, buffer',          note:'',                            amount:15  },
        { label:'Souvenirs',                note:'',                            amount:15  },
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
        { date:'09.26', dow:'SAT', activity:'ICN → Montréal direct on Air Canada/Korean Air.',                                stay:'Montréal · night 1' },
        { date:'09.27', dow:'SUN', activity:'Old Montréal, Notre-Dame Basilica, Mile End cafés.',                              stay:'Montréal · night 2' },
        { date:'09.28', dow:'MON', activity:'Pick up rental. Drive Montréal → Charlevoix (3h). <i>Foliage drive begins.</i>',  stay:'Charlevoix B&B' },
        { date:'09.29', dow:'TUE', activity:'Charlevoix → Québec City (1.5h). Old town.',                                       stay:'Québec City · night 1' },
        { date:'09.30', dow:'WED', activity:"Old Québec walk, Plains of Abraham, funicular, Île d'Orléans loop.",              stay:'Québec City · night 2' },
        { date:'10.01', dow:'THU', activity:'Québec City → Mont-Tremblant (3h). <i>Village + gondola.</i>',                    stay:'Mont-Tremblant lodge' },
        { date:'10.02', dow:'FRI', activity:'Mont-Tremblant → Ottawa (2h). Parliament, ByWard Market.',                        stay:'Ottawa · 1 night' },
        { date:'10.03', dow:'SAT', activity:'Ottawa → Algonquin Provincial Park (3h). <i>Peak foliage drive.</i>',             stay:'Algonquin cabin' },
        { date:'10.04', dow:'SUN', activity:'Morning lake walk, then drive to Toronto (3h).',                                  stay:'Toronto · 1 night' },
        { date:'10.05', dow:'MON', activity:'Toronto day: CN Tower, Distillery District. Evening flight out.',                 stay:'In flight' },
        { date:'10.06', dow:'TUE', activity:'Arrive Seoul. Back to work the next day.',                                        stay:'Home' },
      ],
      lodging: [
        { nights:2, name:'Montréal',       type:'3–4★ downtown',   price:'22 만 / nt' },
        { nights:1, name:'Charlevoix',     type:'B&B / lodge',     price:'15 만' },
        { nights:2, name:'Québec City',    type:'4★ Old Town',     price:'25 만 / nt' },
        { nights:1, name:'Mont-Tremblant', type:'Lodge / chalet',  price:'18 만' },
        { nights:1, name:'Ottawa',         type:'3–4★ downtown',   price:'18 만' },
        { nights:1, name:'Algonquin area', type:'Cabin / lodge',   price:'20 만' },
        { nights:1, name:'Toronto',        type:'3–4★ downtown',   price:'20 만' },
      ],
      lodgingTotal: '180 만원',
      budget: [
        { label:'Flights',              note:'YUL in / YYZ out, open-jaw', amount:190 },
        { label:'Rental car · 7 days',  note:'Mid SUV, full cover',         amount:75  },
        { label:'Fuel, tolls, parking', note:'~1,500 km',                   amount:25  },
        { label:'Lodging',              note:'9 nights',                    amount:180 },
        { label:'Food',                 note:'',                            amount:40  },
        { label:'Entries & activities', note:'',                            amount:20  },
        { label:'Local transit · Uber', note:'',                            amount:10  },
        { label:'Insurance',            note:'',                            amount:8   },
        { label:'Sim, FX, buffer',      note:'',                            amount:15  },
        { label:'Souvenirs',            note:'maple syrup ✦',               amount:20  },
      ],
      note: 'The corporate 5-year perk pays for the flight outright and tosses in ₩60 만 cash — Canada is the cheapest trip on the ledger by far.',
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
        { date:'04.29', dow:'SAT',         activity:'ICN → Dublin (1 stop). Arrive late afternoon.',                              stay:'Dublin · night 1' },
        { date:'04.30', dow:'SUN',         activity:'Trinity College, Book of Kells, Guinness Storehouse, Temple Bar.',          stay:'Dublin · night 2' },
        { date:'05.01', dow:'MON ✦', hol:true, activity:'Pick up rental (automatic). Wicklow Mountains day trip → Kilkenny.',    stay:'Kilkenny B&B' },
        { date:'05.02', dow:'TUE',         activity:"Kilkenny → Cork → <i>Cobh (Titanic's last port)</i>.",                       stay:'Cork · 1 night' },
        { date:'05.03', dow:'WED',         activity:'Cork → <i>Ring of Kerry</i> drive → Killarney National Park.',              stay:'Killarney lodge' },
        { date:'05.04', dow:'THU',         activity:'Killarney → <i>Cliffs of Moher</i> → Galway.',                              stay:'Galway · 1 night' },
        { date:'05.05', dow:'FRI ✦', hol:true, activity:'Galway → Connemara wilds → Sligo.',                                     stay:'Sligo B&B' },
        { date:'05.06', dow:'SAT',         activity:"Sligo → <i>Dark Hedges → Giant's Causeway</i> → Belfast. Border crossed.",  stay:'Belfast · 1 night' },
        { date:'05.07', dow:'SUN',         activity:'Titanic Belfast museum, Peace Wall. Evening flight out.',                   stay:'In flight' },
        { date:'05.08', dow:'MON',         activity:'Arrive Seoul. One last PTO day to recover.',                                stay:'Home' },
      ],
      lodging: [
        { nights:2, name:'Dublin',    type:'3★ city centre',         price:'22 만 / nt' },
        { nights:1, name:'Kilkenny',  type:'B&B / guesthouse',       price:'15 만' },
        { nights:1, name:'Cork',      type:'3★ hotel',               price:'18 만' },
        { nights:1, name:'Killarney', type:'B&B / national park',    price:'20 만' },
        { nights:1, name:'Galway',    type:'3★ hotel',               price:'20 만' },
        { nights:1, name:'Sligo',     type:'B&B',                    price:'15 만' },
        { nights:1, name:'Belfast',   type:'3★ city centre (£)',     price:'20 만' },
      ],
      lodgingTotal: '178 만원',
      budget: [
        { label:'Flights',                 note:'1-stop, DUB in / BFS out',                                amount:150 },
        { label:'Rental car · 7 days',     note:'Automatic, ×2 manual price, full cover, cross-border fee', amount:110 },
        { label:'Fuel, tolls, parking',    note:'',                                                         amount:20  },
        { label:'Lodging',                 note:'9 nights',                                                 amount:178 },
        { label:'Food',                    note:'Pub 1–2 nights + café',                                    amount:40  },
        { label:'Entries & activities',    note:'Moher, Guinness, Titanic',                                 amount:20  },
        { label:'Local transit',           note:'Dublin/Belfast',                                           amount:8   },
        { label:'Insurance',               note:'',                                                         amount:8   },
        { label:'Sim, FX, buffer',         note:'',                                                         amount:15  },
        { label:'Souvenirs',               note:'',                                                         amount:15  },
      ],
      note: 'Automatic rental costs roughly double a manual in Ireland. Book 6 months out (Nov 2027) — automatic stock is thin.',
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
        { date:'09.29', dow:'FRI',         activity:'ICN 23:45 → via Copenhagen → KEF. Arrive morning Sep 30.',                  stay:'Reykjavík · night 1' },
        { date:'09.30', dow:'SAT',         activity:'<i>Blue Lagoon</i> + Reykjavík city (Hallgrímskirkja, Harpa).',             stay:'Reykjavík · night 2' },
        { date:'10.01', dow:'SUN',         activity:'Pick up 4WD. <i>Golden Circle</i>: Þingvellir, Geysir, Gullfoss.',          stay:'Near Seljalandsfoss' },
        { date:'10.02', dow:'MON',         activity:'South coast waterfalls: <i>Seljalandsfoss, Skógafoss</i>, Vík black sand.',  stay:'Vík' },
        { date:'10.03', dow:'TUE ✦', hol:true, activity:'<i>Jökulsárlón glacier lagoon + Diamond Beach</i>. Drive East Fjords.', stay:'Höfn' },
        { date:'10.04', dow:'WED',         activity:'East Fjords scenic drive → Mývatn lake region (north).',                    stay:'Mývatn lodge' },
        { date:'10.05', dow:'THU ✦', hol:true, activity:'Mývatn geothermal, Krafla, <i>Dettifoss waterfall</i>. Aurora watch.',  stay:'Mývatn / Akureyri' },
        { date:'10.06', dow:'FRI',         activity:'<i>Húsavík whale watching</i> → Akureyri (north capital).',                  stay:'Akureyri' },
        { date:'10.07', dow:'SAT',         activity:'Akureyri → <i>Snæfellsnes Peninsula</i> ("Iceland in miniature").',          stay:'Snæfellsnes' },
        { date:'10.08', dow:'SUN',         activity:'Snæfellsnes → return to Reykjavík. Evening flight out.',                     stay:'In flight' },
        { date:'10.09', dow:'MON ✦', hol:true, activity:'Arrive Seoul via Copenhagen.',                                          stay:'Home' },
      ],
      lodging: [
        { nights:2, name:'Reykjavík',           type:'3★ city hotel',          price:'25 만 / nt' },
        { nights:1, name:'Seljalandsfoss area', type:'Guesthouse',             price:'20 만' },
        { nights:1, name:'Vík',                 type:'Country hotel',          price:'25 만' },
        { nights:1, name:'Höfn',                type:'Guesthouse',             price:'22 만' },
        { nights:1, name:'Mývatn',              type:'Nature lodge ✦ aurora',  price:'28 만' },
        { nights:2, name:'Akureyri',            type:'3★ hotel',               price:'22 만 / nt' },
        { nights:1, name:'Snæfellsnes',         type:'Guesthouse',             price:'20 만' },
      ],
      lodgingTotal: '209 만 → 110 만 (split ÷2)',
      budget: [
        { label:'Flights',                  note:'SAS via CPH · own ticket',          amount:180  },
        { label:'Rental car · 9 days ÷2',   note:'4WD SUV, full cover',                amount:70   },
        { label:'Fuel ÷2',                  note:'1,332 km, pricey gas',                amount:17.5 },
        { label:'Lodging ÷2',               note:'9 nights, twin room',                 amount:110  },
        { label:'Food',                     note:'Bónus + lodge meals',                 amount:55   },
        { label:'Activities',               note:'Blue Lagoon, whale tour, glacier',    amount:45   },
        { label:'Insurance · own',          note:'',                                    amount:12   },
        { label:'Sim, tolls, buffer ÷2',    note:'',                                    amount:15   },
        { label:'Souvenirs',                note:'',                                    amount:10   },
      ],
      note: "Iceland on this calendar only happens if there's someone to split it with. If 2028 finds me solo, this slot becomes Plan B — re-chosen closer to the date.",
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

  // 글로벌 export
  window.ATLAS_DATA = {
    TRIPS: TRIPS,
    WISHLIST: WISHLIST,
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
