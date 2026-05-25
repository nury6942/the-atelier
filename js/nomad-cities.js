// ════════════════════════════════════════════════════════════════════
// Nomad Master 도시 가이드 데이터 (17 cities)
// 각 도시는 유연한 sections 배열로 구성
//
// SECTION TYPES:
//   { type:'divider', label:'PLACES · 가볼 곳' }
//   { type:'places', title, icon, items:[{name, price?, desc}] }
//   { type:'neighborhoods', title, icon, items:[{name, stars, desc}] }
//   { type:'table', title, icon, headers:[], rows:[[cell,...]] }
//   { type:'list', title, icon, items:[] }                 // 일반 bullet 리스트
//   { type:'learn', title, icon, items:[{h, body, highlight?}] }
//   { type:'timeline', title, icon, items:[{when, title, text}] }
//   { type:'subsections', title, icon, items:[{h, items:[]}] }  // h4 + ul 그룹
//   { type:'note', icon, color?, title?, body }            // 작은 메모 카드
// ════════════════════════════════════════════════════════════════════

window.NOMAD_CITIES = (function(){

  return {

    // ════════ 6월 · 포르투 ════════
    'nomad-city-porto': {
      monthLabel: '6월',
      hero: {
        city: '🇵🇹 포르투',
        tagline: 'The Soul of the Douro',
        country: '포르투갈 · Portugal',
        dates: '2028.6.9 — 7.9 (1달)',
        weather: '18-25°C · 맑음, 건조',
        visa: '포르투갈 워홀 (1년 다회)',
        vibe: '구도시 · 강 · 아줄레주 · 슬로우 시티',
        mode: '글 풀가동 · 적응 70%',
        quote: 'Saudade — 그리움과 향수와 사랑과 슬픔이 한 단어. 누리 1년 노마드의 첫 단어.',
        image: null,    // 사진 추가하면 hero 배경으로 (지금은 그라데이션 fallback)
        imageAlt: 'Porto Ribeira at sunset',
      },
      meaning: [
        '1년 노마드의 첫 도시 = 적응 + 페이스 잡기',
        '워홀 베이스캠프 = 1년 동안 3번 돌아올 곳 (6월·10월·11월)',
        '디자이너 안목 = 아줄레주·구도시·미니멀 건축 (Álvaro Siza)',
        '작가 안목 = 강·구도심·골목 = 글감 가득',
        '한국 속도 풀어내는 적응기 = 1년 페이스 결정함',
      ],
      sections: [
        { type:'divider', label:'PLACES · 가볼 곳' },
        { type:'places', title:'랜드마크 · 꼭 가는 곳', icon:'landscape', items: [
          { name:'상 벤투 기차역 (São Bento Station)', price:'무료',
            desc:'20,000장 아줄레주가 벽 전체. 디자이너 누리한테 = 한 시간 그냥 멍 때릴 가치. 역사·해전·일상이 타일에 다 박혀있음.' },
          { name:'리브라리아 렐로 (Livraria Lello)', price:'€8',
            desc:'세계에서 가장 아름다운 서점 중 하나. 누리 = 작가니까 무조건. 신고딕 + 빨간 나선 계단. 입장료는 책 구매 시 차감. 오픈 직후 (9:30) 가야 사람 적음.' },
          { name:'클레리구스 탑 (Torre dos Clérigos)', price:'€8',
            desc:'포르투 한복판 종탑. 240계단. 도시 한눈에.' },
          { name:'돔 루이스 1세 다리 (Ponte Dom Luís I)', price:'무료',
            desc:'에펠 제자가 설계. 위층 = 도보·메트로, 아래층 = 차·도보. 일몰 = 위층에서 강 건너 빌라 노바 데 가이아 쪽 보면서.' },
          { name:'포르투 대성당 (Sé do Porto)', price:'€3',
            desc:'12세기. 광장에서 보는 구도심 전경.' },
        ]},
        { type:'places', title:'숨은 곳 · 디자이너·작가 누리한테 진짜 좋을 곳', icon:'explore', items: [
          { name:'Miguel Bombarda 거리 (Cedofeita)',
            desc:'포르투 갤러리 거리. 동시대 미술관·작은 갤러리·디자인 숍 밀집. <strong>매월 셋째 토요일 = 갤러리 동시 오프닝 (Sábado da Arte).</strong>' },
          { name:'Mercado do Bolhão',
            desc:'재단장한 전통 시장. 누리 = 집밥파니까 여기서 야채·과일·생선·치즈 사는 게 노마드 일상.' },
          { name:'Miradouro da Vitória', price:'무료',
            desc:'무료 전망대. 구도심 + 강 + 빨간 지붕. 관광객 덜함.' },
          { name:'Jardins do Palácio de Cristal',
            desc:'공원 + 도서관 (Biblioteca Municipal Almeida Garrett 안). 누리 작업·산책 둘 다.' },
          { name:'Capela das Almas',
            desc:'외벽 전체 파란 아줄레주. 트램 정거장 옆이라 그냥 지나가다 마주침.' },
          { name:'Foz do Douro (도시 서쪽 끝, 강이 바다 만나는 곳)',
            desc:'1번 트램 (1900년대 빈티지) 타고 가는 길 자체가 경험. 펠게이라스 등대 + 해변 + 카페 + 일몰. 시내에서 자전거 6km (Biclas & Triclas 대여).' },
          { name:'Vila Nova de Gaia (강 건너편)',
            desc:'포트와인 셀러 다 여기. 케이블카 + 강변 산책. 미라도루 다 세하 두 필라르 = 다리 + 도시 전경 베스트.' },
        ]},
        { type:'neighborhoods', title:'동네별 추천 (거점 잡기)', icon:'home', items: [
          { name:'Cedofeita', stars:5, desc:'디자인·예술 동네. Vila Coworking · CRU Cowork · 갤러리 · 카페. <strong>누리 메인 추천.</strong>' },
          { name:'Bonfim',     stars:4, desc:'트렌디·창작자 동네. 카페·부티크. Cedofeita보다 조용.' },
          { name:'Baixa',      stars:3, desc:'구도심 중심. 편하지만 관광객 많음.' },
          { name:'Foz do Douro', stars:3, desc:'바닷가 + 조용. 시내 접근 살짝 멀음.' },
          { name:'Boavista',   stars:3, desc:'비즈니스 + 모던. 카자 다 무지카 옆.' },
          { name:'Ribeira',    stars:2, desc:'강변 미관 베스트, 거주 시 시끄럽고 비쌈.' },
        ]},

        { type:'divider', label:'EXPERIENCES · 해볼 것' },
        { type:'places', title:'아줄레주 페인팅 워크숍 · 디자이너 누리 무조건', icon:'brush', items: [
          { name:'Gazete Azulejos (Bonfim)', price:'€40-55 · 2h',
            desc:'<strong>누리 1순위 추천.</strong> 누리 동네 안. 2장 타일 페인팅. 24시간 후 가마 굽고 픽업. 마리사·알바 듀오 운영.' },
          { name:'Frágil Studio', price:'€45 · 2h',
            desc:'프란시스코 페세게이로 (포르투 본토 도예가). "Tiles and Tea" 워크숍.' },
          { name:'MACS Studio (R. da Boavista 84)', price:'€35 · 2h',
            desc:'10가지 전통 패턴 스텐실 또는 자체 디자인.' },
        ]},
        { type:'places', title:'포트와인 셀러 (Vila Nova de Gaia)', icon:'wine_bar', items: [
          { name:"Taylor's", price:'€25-40', desc:'가장 큰 셀러 중 하나. 정원에서 테이스팅. 영문 가이드.' },
          { name:'Cálem',    price:'€20-35', desc:'치즈·초콜릿 페어링 옵션 강추.' },
          { name:"Graham's", price:'€25-50', desc:'강변 위쪽. 일몰 뷰 좋음.' },
        ]},
        { type:'places', title:'그 외 체험', icon:'attractions', items: [
          { name:'Douro Valley 데이트립', price:'€80-150',
            desc:'기차 또는 가이드 투어로 당일 또는 1박. 와이너리 2-3곳 + 점심. 누리 = 와인 잘 안 마셔도 풍경 자체로 가치 있음 (UNESCO).' },
          { name:'6 다리 크루즈 (Six Bridges)', price:'€15-20 · 50분',
            desc:'라벨로 보트 (전통 와인 운반선). 강에서 보는 도시 다른 각도.' },
          { name:'Casa da Mariquinhas (Ribeira 파두)', price:'€30-50',
            desc:'저녁 식사 + 파두 라이브. 누리 = 음악 + 작가 영감 + 분위기.' },
          { name:'Casa da Música 콘서트', price:'€10-50',
            desc:'렘 콜하스 설계 (디자이너 누리 = 건축으로도 가치). 가이드 투어 €10.' },
        ]},
        { type:'table', title:'당일 여행 (포르투 외)', icon:'train',
          headers:['도시','기차','편도','특징'],
          rows: [
            ['<strong>아베이루 (Aveiro)</strong>',  '1시간', '€4-7', '포르투갈의 베니스 · 컬러풀 보트'],
            ['<strong>기마랑이스</strong>',           '1시간', '€8',   '포르투갈의 발상지 · UNESCO 중세 성'],
            ['<strong>브라가 (Braga)</strong>',       '1시간', '€8',   '종교 중심지 · Bom Jesus 계단'],
            ['<strong>마토지뉴스</strong>',           '30분',  '€3',   '해변 + 해산물 식당'],
          ]},

        { type:'divider', label:'LEARN · 배울 것' },
        { type:'learn', title:'누리 디자이너·작가 안목에서 진짜 가져갈 것', icon:'school', items: [
          { h:'1. 아줄레주의 시스템적 사고',
            body:'13세기 무어인 → 16세기 이탈리아 마욜리카 → 17-18세기 포르투갈식 청백 → 20세기 모던 변주. 패턴 모듈화 (단일 타일 → 반복 → 무한 패턴) = 디자이너 누리 본업 (니트 디자인)과 직결.',
            highlight:'포르투갈은 1개 타일을 200년 동안 변주해서 도시 전체 표면을 디자인함. 누리한테 = 모듈 시스템 사고의 진짜 케이스 스터디.' },
          { h:'2. 슬로우 슬로우',
            body:'점심 2시간, 카페 한 잔 1시간, 거리 산책 1시간. 한국 속도 ≠ 포르투갈 속도. 누리 노마드 첫 도시 = 한국 속도 풀어내는 적응기.' },
          { h:'3. 포르투갈 디자인 = 미니멀 + 디테일',
            body:'Álvaro Siza Vieira (프리츠커 수상자, 세할베스 미술관 설계) + Eduardo Souto de Moura (프리츠커 수상자). 두 명 다 포르투 출신. 누리한테 = 포르투갈 모던 건축 = 한국 미니멀 + 라틴 따뜻함.' },
          { h:"4. 작가 자산 = 도시의 '한 단어'",
            body:'포르투 한 단어 = <em>saudade</em> (사우다드). 그리움 + 향수 + 사랑 + 슬픔이 한 단어. 누리 = 분석가 N으로 글 쓸 때 도시 한 단어를 잡는 습관 = 1년 노마드 콘텐츠 자산.' },
        ]},

        { type:'divider', label:'NOMAD MODE · 노마드로서' },
        { type:'places', title:'코워킹 · 한 달 멤버십 잡으면 좋음', icon:'work', items: [
          { name:'Vila Coworking (Cedofeita)', price:'2026 오픈',
            desc:'<strong>누리한테 1순위 추천 후보.</strong> 1,000m² 정원 + 야외 작업 공간. 누리 도착 시 (2028.6) 이미 자리 잡았을 듯.' },
          { name:'CRU Cowork (Cedofeita)', price:'데일리 €15 · 월 €130-180',
            desc:'디자인·예술·기술 프리랜서 중심. 누리 톤 진짜 맞음.' },
          { name:'Porto i/o (3 지점)', price:'데일리 €15-18 · 월 €140-200',
            desc:'Cedofeita / Vila Nova de Gaia / Centro. 가장 큰 노마드 커뮤니티. 정기 이벤트.' },
          { name:'Typographia Cowork', price:'월 €120-170',
            desc:'클레리구스 탑 근처. 커뮤니티 강함.' },
        ]},
        { type:'places', title:'카페 · 작업 가능, Wi-Fi 좋음', icon:'local_cafe', items: [
          { name:'Combi Coffee Roasters (시내)', price:'€3-4', desc:'스페셜티 커피 · 빠른 Wi-Fi · 디자이너·노마드 다수.' },
          { name:'Mesa 325 (Bonfim)',           price:'€2-3', desc:'넓고 조용. 누리 동네 안.' },
          { name:'Café Candelabro',              price:'€2-3', desc:'서점 겸 카페. <strong>작가 누리한테 진짜 좋음.</strong> 오후 작업.' },
          { name:'Rota do Chá',                  price:'차 €4-6', desc:'찻집. 정원 있는 곳도 있음. 깊은 집중용.' },
          { name:'Café Progresso',               price:'€2', desc:'포르투 가장 오래된 카페 (1899). 글쓰는 사람한테 분위기.' },
        ]},
        { type:'places', title:'도서관 · 무료 작업', icon:'menu_book', items: [
          { name:'Biblioteca Municipal Almeida Garrett', price:'무료',
            desc:'Palácio de Cristal 정원 안. 무료 Wi-Fi · 조용 · 정원 산책. <strong>누리 글 작업 최강.</strong>' },
          { name:'Biblioteca Pública Municipal do Porto', price:'무료',
            desc:'역사적 도서관 · 무료 인터넷.' },
        ]},
        { type:'list', title:'작업 페이스 (누리 모드)', icon:'schedule', items: [
          '<strong>평일 9-13시</strong> · 거점 (Cedofeita 거점 + CRU 또는 Vila Coworking)',
          '<strong>오후 14-17시</strong> · 도시 천천히 흡수',
          '월 = 시내 / 화 = Foz / 수 = 코딩 풀데이 / 목 = 갤러리 / 금 = Vila Nova de Gaia',
          '<strong>주말</strong> · 데이트립 (아베이루·기마랑이스·도우로 밸리)',
        ]},

        { type:'divider', label:'PEOPLE · 사람 만나는 루트' },
        { type:'subsections', title:'커뮤니티 · 그룹', icon:'groups', items: [
          { h:'페이스북 그룹', items:[
            '<strong>Expats Porto</strong> · 가장 큰 익스팻 그룹',
            '<strong>Porto Digital Nomads</strong> · 노마드 한정',
            '<strong>Female Digital Nomads Porto</strong> · 여성 한정 (안전 사교 환경)',
          ]},
          { h:'Meetup.com', items:[
            '"Porto Digital Nomads" 정기 모임 (월 1-2회)',
            '언어 교환 (Language Exchange) · 무료',
            '디자인·아트 워크숍 그룹',
          ]},
          { h:'코워킹 이벤트', items:[
            'Porto i/o = 정기 네트워킹·소셜 (주 1-2회)',
            'Selina Navis = 워크숍·이벤트',
            '누리 = 코워킹 멤버십 잡으면 자연스럽게 합류',
          ]},
          { h:'이벤트', items:[
            '<strong>Cedofeita 갤러리 토요일 (Sábado da Arte)</strong> · 매월 셋째 토요일 · 미겔 봄바르다 거리 동시 오픈 · 와인·작품·사람 자연스럽게',
            '워크숍 자체 = 만남 루트 (아줄레주·도예·요리·와인)',
            'Parque da Cidade 토요일 아침 러닝 그룹 · 무료',
          ]},
        ]},
        { type:'timeline', title:'누리한테 자연스러운 사교 루트 (4주 시뮬)', icon:'timeline', items: [
          { when:'1주차', title:'코워킹 한 달 멤버십', text:'Vila Coworking 또는 Porto i/o → 자동 노출 + 자연스러운 인사' },
          { when:'2주차', title:'아줄레주 워크숍 + 갤러리 토요일', text:'Gazete Azulejos 워크숍 1번 + Cedofeita Sábado da Arte 1번' },
          { when:'3주차', title:'Female Digital Nomads Porto 모임', text:'여성 노마드 한정 안전한 사교 환경' },
          { when:'4주차', title:'1-2명과 깊은 만남 유지', text:'커피·산책으로 표면 인사 → 진짜 친구 1-2명' },
        ]},

        { type:'divider', label:'BUDGET · 가격 종합' },
        { type:'table', title:'1달 비용 분해 (숙소 제외)', icon:'payments',
          headers:['카테고리','세부','월 합계 (€)','₩'],
          rows: [
            ['<strong>식비</strong>',    '시장 + 슈퍼 + 가끔 외식',     '250-350',  '37-52만'],
            ['<strong>교통</strong>',    '월 패스 €30 또는 묶음권',     '30-50',    '4-7만'],
            ['<strong>체험</strong>',    '입장료 + 워크숍 + 데이트립',   '200-300',  '30-45만'],
            ['<strong>코워킹</strong>',  '월 멤버십',                   '130-180',  '19-27만'],
          ],
          footer: ['<strong>1달 합계 (숙소 제외)</strong>', '', '<strong>610-880</strong>', '<strong>90-130만</strong>'],
          note: '박힌 생활비 ₩117만 안에 들어옴. OK.' },

        { type:'divider', label:'FOCUS · 핵심 짚을 것' },
        { type:'learn', title:'다른 도시와 다른 것 · 누리 진짜 챙길 거', icon:'priority_high', items: [
          { h:'1. 첫 도시 = 적응이 최우선',
            body:'글 풀가동 + 도시 천천히 흡수. 첫 주는 일·체험 50/50 (적응). 둘째 주부터 일 70 / 체험 30.' },
          { h:'2. 워홀 베이스캠프 = 짐 일부 두기 OK',
            body:'누리 = 포르투갈에 7월·10월·11월 다시 옴. 1달 거점에서 안 쓰는 짐 = 호스트 협의로 보관 가능한지 확인. 또는 신뢰할 만한 저장소 (€5-15/달).' },
          { h:'3. 아줄레주 = 누리 본업 자산',
            body:'워크숍 1번은 무조건 하기. 패턴 사진 모으기 (도시 곳곳). 한국 가서 본업 (니트 디자인) 응용 가능 = <strong>1년 노마드의 진짜 ROI.</strong>' },
          { h:'4. 영어 OK 라인',
            body:'포르투 = 영어 잘 통함 (특히 시내·코워킹·카페). 시장·로컬 가게에선 살짝 제스처 + 포어 단어 (Obrigada · Bom dia · Por favor). 누리 영어 중급 = 충분.' },
          { h:'5. 안전 = 1티어',
            body:'포르투 = 유럽에서 가장 안전한 도시 중 하나. 밤 산책 OK (Cedofeita·Bonfim 동네 안). 단 시내 중심·관광지에선 소매치기 주의.' },
          { h:'6. 슬로우에 적응하는 게 진짜 일',
            body:'누리 한국 속도 → 포르투갈 속도로 바꾸는 게 첫 도시의 가장 큰 과제. "지금은 천천히 가도 됨" 안 받아들이면 다음 도시들 다 무리 옴.',
            highlight:'이게 1년 노마드 전체의 페이스 결정함.' },
        ]},
      ],
    },

  };
})();
