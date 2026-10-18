/* IELTS 전략 카드 데이터 — General Training · 컴퓨터 시험 · 목표 7.0
   출처 종류: 공식(IDP·British Council 컴퓨터 시험 안내), 강사 사이트(IELTS Liz·Simon·E2·Advantage),
   r/IELTS 고득점 후기, 국내 고득점 블로그. 모두 요약·재작성. */
window.IELTS_TIPS = {
  version: '2026-10-18',

  /* ───────── LISTENING ───────── */
  L: {
    facts: [
      { k: '시간', v: '약 30분 + 확인 2분' },
      { k: '구성', v: '4파트 × 10문항 = 40문항' },
      { k: '재생', v: '단 한 번, 멈춤 없음' },
      { k: '옮겨 적기', v: '없음 — 들으며 바로 입력' },
      { k: '7.0 기준', v: '40문항 중 약 30개' },
      { k: '채점', v: '철자 틀리면 오답, 대소문자는 무관' }
    ],
    flow: [
      { icon: 'tune', title: '음량·글자 설정', body: '시작 전 헤드폰 음량·글자 크기 조절' },
      { icon: 'visibility', title: '미리 읽기', body: '파트 전 시간에 질문 훑고 핵심어 하이라이트' },
      { icon: 'psychology', title: '답 예측', body: '빈칸마다 품사·숫자·이름 예측' },
      { icon: 'keyboard', title: '들으며 입력', body: '커서는 현재 문항에, 들리면 바로 타이핑' },
      { icon: 'skip_next', title: '놓치면 넘김', body: '한 문제 놓쳐도 즉시 다음 문항으로' },
      { icon: 'fact_check', title: '중간 예습', body: '파트 사이 시간엔 다음 파트 미리 읽기' },
      { icon: 'spellcheck', title: '2분 확인', body: '빈칸 없이 채우고 철자·단어 수 점검' }
    ],
    types: [
      {
        id: 'l-form', name: '표·폼 빈칸',
        how: ['단어 수 제한 먼저', '품사·숫자 예측', '들리는 그대로 철자'],
        trap: '정정 함정 — 처음 말한 답을 바꿈',
        ex: { q: 'Date of booking: ______', heard: 'the 13th — sorry, the 30th', a: '30th' }
      },
      {
        id: 'l-sentence', name: '문장·노트 완성',
        how: ['문장 앞뒤 문법 확인', '패러프레이즈 예상', '들린 단어 그대로 씀'],
        trap: '문장에 맞게 단어 형태 바꾸면 오답',
        ex: { q: 'Visitors must wear ______ shoes.', heard: 'you’ll need comfortable footwear — flat shoes', a: 'flat' }
      },
      {
        id: 'l-mcq', name: '객관식',
        how: ['질문 핵심어만 표시', '보기 차이점 파악', '전부 다 들어야 확정'],
        trap: '세 보기가 다 언급됨 — 부정된 것 제외',
        ex: { q: 'Why was the trip cancelled? A weather B cost C staff', heard: 'not the rain, it was the price', a: 'B' }
      },
      {
        id: 'l-map', name: '지도·평면도',
        how: ['시작점·입구 먼저 찾기', '방향어 미리 정리', '손가락처럼 경로 따라가기'],
        trap: 'left/right 시점 헷갈림 — 화자 기준',
        ex: { q: 'Café = ?', heard: 'go past the shop, it’s on your left', a: 'E' }
      },
      {
        id: 'l-match', name: '매칭',
        how: ['보기 목록 먼저 숙지', '문항 순서대로 나옴', '보기는 재사용 가능 여부 확인'],
        trap: '보기 단어가 그대로 안 나옴 — 동의어로',
        ex: { q: 'Library — opinion?', heard: 'it’s far too crowded these days', a: 'too busy' }
      }
    ],
    traps: [
      { name: '정정', en: 'Tuesday — no, actually Thursday', ko: '마지막에 바뀐 말이 답' },
      { name: '오답 유도', en: 'I thought about the bus, but…', ko: '고려했다 버린 것은 답 아님' },
      { name: '패러프레이즈', en: 'cheap → reasonably priced', ko: '질문 단어 그대로 안 나옴' },
      { name: '철자 불러주기', en: 'That’s M-A-C-K-I-E', ko: '알파벳 하나씩 정확히 타이핑' },
      { name: '숫자', en: 'thirteen vs thirty / double 5', ko: '강세 위치로 구분, double=두 번' },
      { name: '복수형', en: 'two tickets → tickets', ko: '-s 빠지면 오답' },
      { name: '단어 수', en: 'NO MORE THAN TWO WORDS', ko: '한 단어 넘쳐도 0점' },
      { name: '시그널', en: 'Now, moving on to…', ko: '다음 문항 시작 신호' }
    ],
    signposts: [
      { en: 'Moving on to…', ko: '다음 문제로 넘어감' },
      { en: 'Firstly / To begin with', ko: '첫 항목 시작' },
      { en: 'Another thing is…', ko: '다음 항목 추가' },
      { en: 'However / But actually', ko: '앞말 뒤집기 — 정답 주의' },
      { en: 'Sorry, I mean…', ko: '정정 — 뒤가 답' },
      { en: 'The main reason is…', ko: '이유 문항의 답' },
      { en: 'What I’d recommend is…', ko: '추천 문항의 답' },
      { en: 'Finally / Lastly', ko: '마지막 항목' },
      { en: 'To sum up…', ko: '요약 — 주제 문항' },
      { en: 'Let’s turn to…', ko: '화제 전환' },
      { en: 'On the other hand', ko: '반대 관점 시작' }
    ],
    practice: [
      { icon: 'headphones', title: '받아쓰기', body: '틀린 구간만 3번 받아쓰기', freq: '매일 15분' },
      { icon: 'description', title: '스크립트 분석', body: '틀린 문항 근거 문장·동의어 표시', freq: '모의고사 후' },
      { icon: 'record_voice_over', title: '쉐도잉', body: '파트 4 강의 따라 말하기', freq: '주 3회' },
      { icon: 'computer', title: 'CD 모의고사', body: '화면으로 풀고 2분 확인까지 연습', freq: '주 1회' },
      { icon: 'public', title: '억양 노출', body: '영국·호주 팟캐스트·라디오 청취', freq: '출퇴근' },
      { icon: 'spellcheck', title: '철자 노트', body: '틀린 단어·요일·월 철자 반복', freq: '매일 5분' }
    ]
  },

  /* ───────── READING (GT) ───────── */
  R: {
    facts: [
      { k: '시간', v: '60분, 옮겨 적기 시간 없음' },
      { k: '구성', v: '3섹션 · 40문항' },
      { k: '지문', v: '광고·안내문 → 업무 → 긴 글' },
      { k: '7.0 기준', v: '40문항 중 약 34개 (GT)' },
      { k: '화면 기능', v: '하이라이트·메모·문항 이동' },
      { k: '빈칸', v: '틀려도 감점 없음 — 다 채우기' }
    ],
    timing: [
      { sec: 'S1', min: 15, q: '~14', note: '짧은 생활 지문' },
      { sec: 'S2', min: 20, q: '~13', note: '업무·직장 안내문' },
      { sec: 'S3', min: 25, q: '~13', note: '긴 일반 주제 글' }
    ],
    flow: [
      { icon: 'quiz', title: '질문 먼저', body: '문항 유형·단어 수 지시 확인' },
      { icon: 'auto_stories', title: '훑어 읽기', body: '제목·첫 문장으로 지문 구조 파악' },
      { icon: 'highlight', title: '핵심어 표시', body: '이름·숫자·고유명사 하이라이트' },
      { icon: 'search', title: '위치 찾기', body: '핵심어·동의어로 해당 문장 찾기' },
      { icon: 'menu_book', title: '정독', body: '그 문장 앞뒤만 꼼꼼히 읽기' },
      { icon: 'verified', title: '검증', body: '지문 근거와 정확히 맞는지 확인' },
      { icon: 'timer', title: '시간 컷', body: '막히면 표시 후 넘김, 끝에 복귀' }
    ],
    skills: [
      { name: 'Skimming', ko: '훑어 읽기', how: '첫·끝 문장만', when: '제목 고르기' },
      { name: 'Scanning', ko: '찾아 읽기', how: '숫자·이름만 눈으로 검색', when: '빈칸·단답' },
      { name: 'Paraphrase 찾기', ko: '동의어 추적', how: '질문 단어의 다른 표현 예상', when: 'T/F/NG·매칭' },
      { name: 'Close reading', ko: '정독', how: '근거 문장 한 줄씩', when: '객관식·T/F/NG' }
    ],
    types: [
      {
        id: 'r-tfng', name: 'T/F/NG',
        how: ['진술 핵심어 표시', '지문 위치 찾기', '같음·반대·언급없음 판정'],
        trap: '상식으로 판단 — 지문에 없으면 NG',
        ex: { q: 'The gym opens at 6 a.m. daily.', text: 'Opening hours: weekdays 6 a.m.', a: 'NOT GIVEN', why: '주말 정보 없음' }
      },
      {
        id: 'r-ynng', name: 'Y/N/NG',
        how: ['글쓴이 의견 찾기', '의견 동사·부사 주목', '의견 없으면 NG'],
        trap: '사실과 의견 혼동',
        ex: { q: 'The author thinks remote work is overrated.', text: 'Remote work has clear benefits.', a: 'NO', why: '저자는 장점 인정' }
      },
      {
        id: 'r-heading', name: '제목 고르기',
        how: ['문단 첫·끝 문장 먼저', '세부 말고 요지', '확실한 것부터 지우기'],
        trap: '단어만 겹치는 제목 — 요지 아님',
        ex: { q: 'Para B heading?', text: 'Staff must log all overtime…', a: 'Recording extra hours', why: '문단 요지' }
      },
      {
        id: 'r-match', name: '정보·특징 매칭',
        how: ['이름·고유명사 먼저 표시', '동의어로 연결', '순서대로 안 나옴'],
        trap: '같은 단어가 여러 문단에 등장',
        ex: { q: 'Which ad offers free delivery?', text: 'C: no charge for shipping', a: 'C', why: 'free = no charge' }
      },
      {
        id: 'r-mcq', name: '객관식',
        how: ['질문 먼저, 보기 나중', '근거 문장 찾기', '오답 보기 이유 확인'],
        trap: '지문 단어 그대로 쓴 보기가 오답',
        ex: { q: 'Main purpose of the notice?', text: 'to remind staff of new rules', a: 'B', why: '목적 = remind' }
      },
      {
        id: 'r-gap', name: '요약·문장 빈칸',
        how: ['단어 수 제한 확인', '품사 예측', '지문 철자 그대로 복사'],
        trap: '단어 형태 바꾸기·초과',
        ex: { q: 'Refunds within ___ days.', text: 'returned within fourteen days', a: '14 / fourteen', why: '숫자 표기 둘 다 허용' }
      },
      {
        id: 'r-short', name: '단답형',
        how: ['의문사 확인', '핵심어 스캔', '최소 단어로 답'],
        trap: '지시 단어 수 초과',
        ex: { q: 'What must guests show?', text: 'please present photo ID', a: 'photo ID', why: '2단어 이내' }
      }
    ],
    traps: [
      { name: '단어 일치 함정', en: 'same word ≠ same meaning', ko: '같은 단어 보기가 오히려 오답' },
      { name: 'F vs NG', en: 'contradicts vs not mentioned', ko: '반대면 F, 없으면 NG' },
      { name: '한정어', en: 'all / some / usually / only', ko: '수량·빈도 단어 하나로 판정 바뀜' },
      { name: '단어 수', en: 'ONE WORD AND/OR A NUMBER', ko: '지시 초과는 무조건 오답' },
      { name: '시간 늪', en: 'stuck on one question', ko: '1문항 2분 넘기면 넘김' },
      { name: '철자 복사', en: 'copy from passage', ko: '지문 철자 그대로, 오타 주의' }
    ],
    practice: [
      { icon: 'timer', title: '타이머 풀이', body: '섹션별 15·20·25분 엄수', freq: '주 2회' },
      { icon: 'swap_horiz', title: '동의어 노트', body: '질문↔지문 패러프레이즈 쌍 기록', freq: '매 풀이 후' },
      { icon: 'rule', title: 'T/F/NG 근거 쓰기', body: '정답마다 근거 문장 밑줄', freq: '주 2회' },
      { icon: 'newspaper', title: '생활 영문 읽기', body: '안내문·광고·사내 공지 읽기', freq: '매일 10분' },
      { icon: 'computer', title: '화면 풀이', body: '종이 말고 화면에서 하이라이트 연습', freq: '모의고사마다' }
    ]
  },

  /* ───────── SPEAKING ───────── */
  S: {
    facts: [
      { k: '시간', v: '11–14분, 감독관과 1:1 대면' },
      { k: '구성', v: 'Part 1 · 2 · 3' },
      { k: '녹음', v: '전 과정 녹음됨' },
      { k: '채점', v: '4개 기준 각 25%' },
      { k: '준비', v: 'Part 2만 1분 메모 시간' }
    ],
    criteria: [
      { k: 'Fluency & Coherence', ko: '유창성·흐름', do: '연결어로 길게 이어 말하기', dont: '긴 침묵·같은 말 반복' },
      { k: 'Lexical Resource', ko: '어휘', do: '주제어·덜 흔한 표현 쓰기', dont: '외운 고급어 억지 삽입' },
      { k: 'Grammatical Range', ko: '문법 범위·정확성', do: '복문·가정·시제 섞기', dont: '단문만 나열' },
      { k: 'Pronunciation', ko: '발음', do: '강세·억양으로 의미 전달', dont: '단조로운 국어식 리듬' }
    ],
    parts: [
      {
        part: 1, time: '4–5분', icon: 'chat', goal: '일상 질문에 2–3문장으로 답',
        frame: [
          { label: '답', en: 'Yes, I do — mostly because…' },
          { label: '이유', en: 'The main reason is that…' },
          { label: '예시', en: 'For example, …' }
        ],
        ex: {
          q: 'Do you like your job?',
          a: 'Yes, I really do. I design sportswear, so I get to see a sketch turn into something people actually wear. Last season one of my track pants sold out, which was a real thrill.'
        }
      },
      {
        part: 2, time: '3–4분', icon: 'record_voice_over', goal: '1분 메모 후 2분 쉬지 않고 말하기',
        frame: [
          { label: '메모', en: '언제 / 어디 / 누구 / 무엇 / 왜' },
          { label: '도입', en: 'I’d like to talk about…' },
          { label: '배경', en: 'This was back in…, when I…' },
          { label: '전개', en: 'What happened was…' },
          { label: '감정', en: 'What made it special was…' },
          { label: '마무리', en: 'Looking back, I…' }
        ],
        ex: {full:[{"label": "메모", "en": "last spring · office + factory · my team · jersey zip-up · first bestseller"}, {"label": "도입", "en": "I'd like to talk about a jersey zip-up jacket that I designed for the brand I work for, which is a sportswear label in Korea."}, {"label": "배경", "en": "This was back in early 2025, when our team was asked to create a training jacket that people could wear both to the gym and on a normal day out. The brief sounded simple, but it was actually quite tricky, because sporty pieces often look too technical for everyday wear."}, {"label": "전개", "en": "What happened was that I spent weeks testing different fabrics and seam lines. In the end, I hid the darts inside panel lines, which made the fit cleaner and gave the jacket a sharper, more athletic shape. I also chose a soft, heavy jersey so it would feel relaxed rather than stiff. There were a few late nights at the factory, and at one point the first samples came back far too tight, so we had to rework the whole pattern."}, {"label": "감정", "en": "What made it special was the moment it launched. It sold out in a couple of weeks, and not long after that I spotted a stranger wearing it on the subway. Honestly, I was so thrilled that I nearly took a photo."}, {"label": "마무리", "en": "Looking back, I think that jacket taught me that good design is often about small, invisible details, and it's still the piece I'm proudest of."}],
          q: 'Describe a piece of clothing you designed.',
          a: 'I’d like to talk about a jersey zip-up I designed last year. The brief was a sporty piece that still felt relaxed. What made it special was seeing strangers wear it on the street.'
        }
      },
      {
        part: 3, time: '4–5분', icon: 'forum', goal: '사회적 주제에 의견·근거 확장',
        frame: [
          { label: '의견', en: 'I’d say that…' },
          { label: '이유', en: 'This is largely because…' },
          { label: '예시', en: 'Take…, for instance.' },
          { label: '반대', en: 'That said, some people argue…' },
          { label: '결론', en: 'So overall, I think…' }
        ],
        ex: {
          q: 'Why do people follow fashion trends?',
          a: 'I’d say it’s mostly about belonging. Wearing what’s current signals you’re part of a group. That said, many young people now prefer a personal style over trends.'
        }
      }
    ],
    fillers: [
      { en: 'That’s an interesting question.', use: '생각할 시간 벌기' },
      { en: 'Let me think about that for a second.', use: '잠깐 정리' },
      { en: 'I’ve never really thought about it, but…', use: '낯선 질문 시작' },
      { en: 'Well, it depends on…', use: '조건부 답 열기' },
      { en: 'What I mean is…', use: '다시 설명' },
      { en: 'To put it another way…', use: '바꿔 말하기' },
      { en: 'On top of that,', use: '내용 추가' },
      { en: 'Having said that,', use: '반대 관점 전환' },
      { en: 'The thing is,', use: '핵심 꺼내기' },
      { en: 'As far as I know,', use: '확신 낮출 때' },
      { en: 'Could you repeat the question?', use: '못 들었을 때 (감점 없음)' },
      { en: 'All in all,', use: '마무리' }
    ],
    upgrades: [
      { basic: 'very good', better: 'remarkably effective', ko: '효과 강조' },
      { basic: 'very bad', better: 'far from ideal', ko: '부드러운 부정' },
      { basic: 'I think', better: 'I’d argue that', ko: '의견 표현' },
      { basic: 'a lot of', better: 'a wide range of', ko: '다양함' },
      { basic: 'important', better: 'crucial / essential', ko: '중요성' },
      { basic: 'big', better: 'significant / substantial', ko: '규모' },
      { basic: 'get', better: 'obtain / gain', ko: '얻다' },
      { basic: 'because', better: 'largely due to', ko: '원인' },
      { basic: 'like', better: 'be keen on / be into', ko: '좋아하다' },
      { basic: 'busy', better: 'snowed under', ko: '바쁨 (관용)' },
      { basic: 'nowadays', better: 'these days / in recent years', ko: '요즘' },
      { basic: 'interesting', better: 'eye-opening', ko: '새로운 깨달음' }
    ],
    pron: [
      { k: '억양', tip: '문장 끝 평평하게 말고 오르내리게' },
      { k: '단어 강세', tip: 'deVELop, PHOtograph — 강세 한 곳' },
      { k: 'f/p · v/b', tip: '윗니로 아랫입술 — coffee, very' },
      { k: 'r/l', tip: 'right·light 구분, 혀 위치 다르게' },
      { k: '모음 추가 금지', tip: 'desk ≠ 데스크 — 끝 자음에 모음 붙이지 않기' }
    ]
  },

  /* ───────── WRITING (GT) ───────── */
  W: {
    facts: [
      { k: '시간', v: '60분 (Task 1 + Task 2)' },
      { k: 'Task 1', v: '편지 150단어+, 약 20분' },
      { k: 'Task 2', v: '에세이 250단어+, 약 40분' },
      { k: '배점', v: 'Task 2가 Task 1의 2배' },
      { k: '화면', v: '단어 수 자동 표시·복사/붙여넣기' },
      { k: '주의', v: '맞춤법 자동수정 없음' }
    ],
    flow: [
      { icon: 'edit_note', title: 'Task 2 먼저', body: '배점 2배 — 40분 확보 후 시작' },
      { icon: 'lightbulb', title: '5분 계획', body: '입장·이유 2개·예시 메모' },
      { icon: 'format_list_numbered', title: '4문단 구조', body: '서론·본론1·본론2·결론' },
      { icon: 'keyboard', title: '30분 작성', body: '문단마다 주제문 + 설명 + 예시' },
      { icon: 'mail', title: 'Task 1 편지', body: '3개 요구 항목 모두 한 문단씩' },
      { icon: 'tag', title: '단어 수 확인', body: '화면 카운터로 하한선 넘겼는지' },
      { icon: 'spellcheck', title: '3분 검토', body: '관사·수일치·시제·철자 점검' }
    ],
    criteria: [
      { k: 'Task Achievement / Response', ko: '과제 수행', do: '모든 요구 항목·입장 명확히', dont: '질문 일부만 답하기' },
      { k: 'Coherence & Cohesion', ko: '구성·연결', do: '문단당 한 요지, 지시어 활용', dont: '연결어 과다·기계적 나열' },
      { k: 'Lexical Resource', ko: '어휘', do: '정확한 콜로케이션·동의어', dont: '질문 문장 그대로 베끼기' },
      { k: 'Grammatical Range & Accuracy', ko: '문법', do: '복문 섞되 오류 없는 문장', dont: '어려운 구문 억지 시도' }
    ],
    letter: [
      { type: '격식', open: 'Dear Sir or Madam,', close: 'Yours faithfully,' },
      { type: '반격식', open: 'Dear Mr Kim,', close: 'Yours sincerely,' },
      { type: '비격식', open: 'Dear Anna,', close: 'Best wishes,' }
    ],
    koreanErrors: [
      { k: '관사', wrong: 'I bought bookshelf.', right: 'I bought a bookshelf.' },
      { k: '수일치', wrong: 'Many people thinks…', right: 'Many people think…' },
      { k: '불가산 명사', wrong: 'some informations', right: 'some information' },
      { k: '시제 혼용', wrong: 'Last year I go there.', right: 'Last year I went there.' },
      { k: '주어 누락', wrong: 'Is important to save.', right: 'It is important to save.' },
      { k: '전치사', wrong: 'discuss about it', right: 'discuss it' },
      { k: '문장 쪼개짐', wrong: 'Because it is cheap.', right: 'I chose it because it is cheap.' },
      { k: '구어체', wrong: 'kids, gonna, a lot', right: 'children, going to, many' }
    ]
  }
};
