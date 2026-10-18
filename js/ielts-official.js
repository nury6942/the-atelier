/* IELTS 공식 채점 기준 — 공개 밴드 디스크립터(2023년 5월 개정판)와 공식 시험 안내를 한국어로 요약.
   원문을 옮긴 것이 아니라 뜻을 살려 줄인 것. gap67 = 6에서 7로 가는 차이(공식 문구 비교에서 뽑음). */
window.IELTS_OFFICIAL = {
  checked: '2026-10-19',
  sources: [
    { name: 'IELTS Writing Band Descriptors (2023년 5월 개정)', url: 'https://ielts.org/cdn/Guides/ielts-writing-band-descriptors.pdf' },
    { name: 'IELTS Writing Key Assessment Criteria', url: 'https://ielts.org/cdn/Guides/ielts-writing-key-assessment-criteria.pdf' },
    { name: 'IELTS Speaking Band Descriptors', url: 'https://ielts.org/cdn/ielts-guides/ielts-speaking-band-descriptors.pdf' },
    { name: 'IELTS Speaking Key Assessment Criteria', url: 'https://ielts.org/cdn/ielts-guides/ielts-speaking-key-assessment-criteria.pdf' },
    { name: 'IELTS scoring in detail (ielts.org)', url: 'https://ielts.org/take-a-test/your-results/ielts-scoring-in-detail' },
    { name: 'GT Writing test format (ielts.org)', url: 'https://ielts.org/take-a-test/test-types/ielts-general-training-test/ielts-general-training-format-writing' },
    { name: 'GT Listening test format (ielts.org)', url: 'https://ielts.org/take-a-test/test-types/ielts-general-training-test/ielts-general-training-format-listening' },
    { name: 'GT Speaking test format (ielts.org)', url: 'https://ielts.org/take-a-test/test-types/ielts-general-training-test/ielts-general-training-format-speaking' },
    { name: 'How is IELTS assessed (British Council)', url: 'https://takeielts.britishcouncil.org/results/how-is-ielts-assessed' },
    { name: 'IELTS on computer (British Council)', url: 'https://takeielts.britishcouncil.org/what-is-ielts/how-it-works/test-modes/ielts-on-computer' },
    { name: 'How IELTS on computer works (IDP)', url: 'https://ielts.idp.com/prepare/article-how-computer-delivered-ielts-works' },
    { name: 'IELTS on Computer FAQ (IDP Canada)', url: 'https://ielts.idp.com/canada/news/article-commonly-asked-questions-ielts-on-computer' }
  ],

  /* ───────── Writing Task 1 · GT 편지 ───────── */
  writing1: {
    criteria: [
      {
        k: 'TA', name: 'Task Achievement', ko: '과제 수행',
        bands: {
          9: '모든 요구를 완전·적절히 충족, 내용상 실수는 극히 드묾',
          8: '세 항목 모두 명확히 제시하고 적절히 풀어 씀, 누락은 가끔',
          7: '세 항목 모두 다루고 강조, 목적 분명·어조 일관 — 확장은 더 가능',
          6: '세 항목은 다룸, 목적 대체로 분명, 어조가 조금 흔들림, 세부 부족/과잉',
          5: '세 항목은 있으나 하나 이상 부실, 목적이 때때로 흐림, 어조 들쭉날쭉'
        },
        gap67: '첫 문단에서 편지 목적을 한 문장으로 밝히고, 어조를 끝까지 한 톤으로, 세 항목마다 구체 디테일(이유·날짜·예)을 붙인다.'
      },
      {
        k: 'CC', name: 'Coherence & Cohesion', ko: '구성·연결',
        bands: {
          9: '힘들이지 않고 읽힘, 연결 장치가 눈에 띄지 않음, 문단 운용 능숙',
          8: '쉽게 읽힘, 정보 순서 논리적, 연결 잘 관리, 문단 충분·적절',
          7: '논리적 구성·뚜렷한 전개, 지시어·대체어 포함 연결이 유연(약간 과다/부족)',
          6: '대체로 조리 있음, 연결이 기계적이거나 오용·과다, 지시어가 반복을 낳음',
          5: '구성은 보이나 완전히 논리적이지 않음, 문장끼리 매끄럽게 안 이어짐'
        },
        gap67: 'Firstly·Moreover를 줄이고 this/these/such/it·the former 같은 지시어·대체어로 잇는다 — 6의 표지는 \'기계적 연결\'.'
      },
      {
        k: 'LR', name: 'Lexical Resource', ko: '어휘',
        bands: {
          9: '넓은 어휘를 매우 자연스럽고 정확하게, 철자·어형 실수 극히 드묾',
          8: '넓은 어휘로 정확한 의미, 덜 흔한·관용 표현 능숙, 콜로케이션 실수 가끔',
          7: '어느 정도 유연·정확, 덜 흔한 표현 일부, 문체·콜로케이션 인식(실수 있음)',
          6: '과제에 대체로 적절, 범위 좁거나 부정확해도 뜻은 통함, 철자 실수 약간',
          5: '제한적이나 최소한 적절, 단순화·반복 잦음, 철자 오류가 읽기를 방해'
        },
        gap67: '쉬운 단어 반복 대신 편지 상황에 맞는 콜로케이션(덜 흔한 표현)을 몇 개 \'정확히\' — 고급어 남발이 아니라 맞는 짝.'
      },
      {
        k: 'GRA', name: 'Grammatical Range & Accuracy', ko: '문법',
        bands: {
          9: '넓은 구조를 완전히 유연하게, 문법·구두점 내내 적절',
          8: '넓은 구조를 유연·정확히, 대부분 문장 무오류, 비체계적 실수만 가끔',
          7: '다양한 복문을 어느 정도 유연·정확히, 무오류 문장이 잦음',
          6: '단문·복문을 섞지만 유연성 제한, 복문이 단문보다 덜 정확',
          5: '구조 범위 좁고 반복적, 복문은 대개 틀림, 오류가 잦고 구두점 실수'
        },
        gap67: '무오류 문장이 \'잦아야\' 7 — 관사·수일치·시제 같은 기초 오류를 없애 절반 이상을 완벽하게, 복문은 관계절·조건절이면 충분.'
      }
    ]
  },

  /* ───────── Writing Task 2 · 에세이 ───────── */
  writing2: {
    criteria: [
      {
        k: 'TR', name: 'Task Response', ko: '과제 응답',
        bands: {
          9: '질문에 깊이 답함, 완전히 전개된 명확한 입장, 아이디어 충분히 확장·뒷받침',
          8: '충분히 답함, 잘 전개된 명확한 입장, 아이디어 잘 확장, 누락은 가끔',
          7: '주요 부분 다룸, 명확한 입장 전개 — 과잉일반화·근거 초점 부족 가능',
          6: '주요 부분 다루나 일부만 충분, 결론이 불명확·반복, 일부 아이디어 덜 전개',
          5: '주요 부분 불완전, 입장은 있으나 전개 흐림, 아이디어 제한·반복'
        },
        gap67: '서론~결론까지 같은 입장을 유지하고, 질문의 모든 부분에 답하며, 각 본론 주장을 구체적 결과·예로 한 단계 더 민다.'
      },
      {
        k: 'CC', name: 'Coherence & Cohesion', ko: '구성·연결',
        bands: {
          9: '힘들이지 않고 읽힘, 연결 장치가 눈에 띄지 않음, 문단 운용 능숙',
          8: '쉽게 읽힘, 논리적 순서, 연결 잘 관리, 문단 충분·적절',
          7: '전체 전개 뚜렷, 연결 유연(약간 과다/부족), 문단 안 순서도 대체로 논리적',
          6: '대체로 조리 있음, 연결 기계적·오용, 문단 나눔이나 중심 주제가 흐릴 때 있음',
          5: '구성은 있으나 논리 부족, 연결어 과다/부족, 문단이 부족하거나 없음'
        },
        gap67: '문단마다 중심 주제문 하나, 그 문단 안에서는 그 얘기만 — 연결어 개수가 아니라 생각의 순서로 흐름을 만든다.'
      },
      {
        k: 'LR', name: 'Lexical Resource', ko: '어휘',
        bands: {
          9: '넓은 어휘를 매우 자연스럽고 정확하게, 실수 극히 드묾',
          8: '넓은 어휘로 정확한 의미, 덜 흔한·관용 표현 능숙, 콜로케이션 실수 가끔',
          7: '어느 정도 유연·정확, 덜 흔한 표현 일부, 문체·콜로케이션 인식(실수 있음)',
          6: '대체로 적절, 범위 좁거나 부정확해도 뜻은 통함, 모험하면 오류 늘어남',
          5: '제한적이나 최소한 적절, 단순화·반복 잦음, 철자 오류가 읽기를 방해'
        },
        gap67: '질문 단어를 그대로 베끼지 말고 바꿔 쓰며, 주제어 콜로케이션(e.g. tackle congestion)을 정확히 몇 개 넣는다.'
      },
      {
        k: 'GRA', name: 'Grammatical Range & Accuracy', ko: '문법',
        bands: {
          9: '넓은 구조를 완전히 유연하게, 문법·구두점 내내 적절',
          8: '넓은 구조를 유연·정확히, 대부분 문장 무오류',
          7: '다양한 복문을 어느 정도 유연·정확히, 무오류 문장이 잦음',
          6: '단문·복문 섞지만 유연성 제한, 복문이 단문보다 덜 정확',
          5: '구조 범위 좁고 반복적, 복문은 대개 틀림, 오류가 독자를 방해'
        },
        gap67: '어려운 구문 수보다 \'무오류 문장 비율\' — 쓰고 3분 검토로 관사·수일치·시제를 잡아 오류 없는 문장을 다수로.'
      }
    ]
  },

  /* ───────── Speaking ───────── */
  speaking: {
    criteria: [
      {
        k: 'FC', name: 'Fluency & Coherence', ko: '유창성·흐름',
        bands: {
          9: '반복·자기수정 매우 드묾, 망설임은 내용 고르기용, 전개 완전히 일관',
          8: '유창함, 단어 찾는 망설임은 가끔, 전개가 일관·적절',
          7: '힘들이지 않고 긴 답 가능, 망설임·반복 있어도 흐름 유지, 담화표지 유연',
          6: '길게 말하려 함, 망설임·반복으로 흐름이 끊기기도, 연결어가 늘 적절하진 않음',
          5: '반복·자기수정·느린 속도로 겨우 이어감, 연결어 과다 사용'
        },
        gap67: '문장 중간에 단어를 찾느라 멈춰도 흐름이 안 끊겨야 7 — Part 3에서 긴 답을 노력 없이 이어가고 담화표지를 자연스럽게.'
      },
      {
        k: 'LR', name: 'Lexical Resource', ko: '어휘',
        bands: {
          9: '모든 맥락에서 완전히 유연·정확, 관용 표현을 꾸준히',
          8: '넓은 어휘로 모든 주제를 정확히, 덜 흔한·관용 표현 능숙, 바꿔말하기 효과적',
          7: '여러 주제에 유연, 덜 흔한·관용 표현 일부, 문체·콜로케이션 인식',
          6: '길게 말할 어휘는 충분, 부적절한 단어 있어도 뜻은 분명, 바꿔말하기 대체로 성공',
          5: '익숙·낯선 주제 모두 가능하나 유연성 제한, 바꿔말하기가 자주 실패'
        },
        gap67: '덜 흔한 어휘·관용구를 자연스러운 짝으로 몇 개, 모르는 단어는 멈추지 말고 풀어서 말하기(paraphrase).'
      },
      {
        k: 'GRA', name: 'Grammatical Range & Accuracy', ko: '문법',
        bands: {
          9: '구조가 언제나 정확(원어민도 하는 실수 정도만)',
          8: '넓은 구조를 유연하게, 대부분 문장 무오류, 기초 오류 약간',
          7: '구조 범위를 유연하게, 무오류 문장 잦음, 단문·복문 모두 효과적',
          6: '단문·복문 섞지만 유연성 제한, 복문에 오류 잦으나 소통엔 지장 적음',
          5: '기본 문장은 꽤 정확, 복문은 범위 좁고 거의 늘 틀려 다시 말하게 됨'
        },
        gap67: '복문(관계절·가정·완료형)을 \'틀리지 않고\' 자주 — 시제·3인칭 -s 같은 기초 오류가 6에 묶어두는 주범.'
      },
      {
        k: 'P', name: 'Pronunciation', ko: '발음',
        bands: {
          9: '모든 발음 특징으로 미묘한 의미까지, 연음 내내 유연, 억양이 이해에 무영향',
          8: '넓은 발음 특징, 적절한 리듬 유지, 긴 발화에서도 강세·억양 유연',
          7: '6의 장점은 모두, 8의 장점은 일부 갖춤 (공식 정의)',
          6: '발음 특징은 쓰나 통제가 들쭉날쭉, 리듬이 흔들림, 대체로 쉽게 이해됨',
          5: '4의 장점은 모두, 6의 장점은 일부 갖춤 (공식 정의)'
        },
        gap67: '긴 문장에서도 강세 리듬·억양을 유지하고 의미 단위로 끊어 말하기(chunking) — 한국어식 평평한 리듬이 6의 원인.'
      }
    ]
  },

  /* ───────── 공식 사실 (컴퓨터 시험 기준) ───────── */
  facts: [
    { k: '시험 방식', v: 'L·R·W는 컴퓨터, Speaking은 시험관과 실시간(대면 또는 화상)', src: 'https://takeielts.britishcouncil.org/what-is-ielts/how-it-works/test-modes/ielts-on-computer' },
    { k: '총 시간', v: '약 2시간 45분, Speaking은 같은 날 또는 전후 1주 안', src: 'https://ielts.idp.com/canada/news/article-commonly-asked-questions-ielts-on-computer' },
    { k: 'Listening', v: '약 30분·4파트 40문항·한 번만 재생, 옮겨 적는 시간 없음', src: 'https://ielts.idp.com/prepare/article-how-computer-delivered-ielts-works' },
    { k: 'Listening 확인', v: '끝에 2분 검토 시간만 주어짐', src: 'https://ielts.idp.com/canada/news/article-commonly-asked-questions-ielts-on-computer' },
    { k: 'Listening 순서', v: '문항 순서 = 녹음 순서', src: 'https://ielts.org/take-a-test/test-types/ielts-general-training-test/ielts-general-training-format-listening' },
    { k: '단어 수 제한', v: '초과하면 그 문항 오답, 하이픈 단어(check-in)는 1단어', src: 'https://ielts.org/take-a-test/test-types/ielts-general-training-test/ielts-general-training-format-listening' },
    { k: '철자', v: '영국·미국식 모두 인정, 철자가 틀리면 오답', src: 'https://takeielts.britishcouncil.org/blog/british-or-american-english-ielts' },
    { k: '대소문자', v: 'L·R 답은 대문자·소문자 상관없음', src: 'https://ieltsliz.com/capital-letters-in-ielts-will-it-affect-your-score/' },
    { k: '오답 감점', v: '없음 — L·R 빈칸 없이 다 채우기', src: 'https://takeielts.britishcouncil.org/results/how-is-ielts-assessed' },
    { k: '7.0 환산', v: 'Listening 약 30/40, GT Reading 약 35/40 (평균, 회차마다 조금 다름)', src: 'https://ielts.org/take-a-test/your-results/ielts-scoring-in-detail' },
    { k: 'Reading', v: '60분 3섹션 40문항, 컴퓨터는 별도 옮겨 적기 없음', src: 'https://ielts.idp.com/prepare/article-how-computer-delivered-ielts-works' },
    { k: 'Writing 시간', v: '60분, Task 1 약 20분(150단어+), Task 2 약 40분(250단어+)', src: 'https://ielts.org/take-a-test/test-types/ielts-general-training-test/ielts-general-training-format-writing' },
    { k: 'Task 2 배점', v: 'Task 2가 Task 1의 2배 반영', src: 'https://ielts.org/take-a-test/test-types/ielts-general-training-test/ielts-general-training-format-writing' },
    { k: '4기준 비중', v: 'Writing·Speaking 모두 4기준 동일 비중(각 25%)', src: 'https://ielts.org/take-a-test/your-results/ielts-scoring-in-detail' },
    { k: '화면 기능', v: '단어 수 자동 표시, 잘라내기·복사·붙여넣기, 어느 Task부터든 시작', src: 'https://ielts.idp.com/canada/news/article-get-high-writing-score-ielts-computer-in-canada' },
    { k: '분량 미달', v: '고정 감점표는 공개 안 됨 — 근거 부족으로 높은 밴드를 못 받음', src: 'https://ielts.org/take-a-test/test-types/ielts-general-training-test/ielts-general-training-format-writing' },
    { k: '20단어 이하', v: '해당 답안은 밴드 1, 문제 문장을 베낀 부분은 단어 수에서 제외', src: 'https://ielts.org/cdn/Guides/ielts-writing-band-descriptors.pdf' },
    { k: '형식', v: '글머리표·메모식 금지(감점), 편지에 주소 안 씀', src: 'https://ielts.org/take-a-test/test-types/ielts-general-training-test/ielts-general-training-format-writing' },
    { k: '주제 이탈', v: '주제와 무관하면 감점, 표절은 중대 감점', src: 'https://ielts.org/take-a-test/test-types/ielts-general-training-test/ielts-general-training-format-writing' },
    { k: '외운 답', v: '통째 외운 답은 Writing 밴드 0, 외운 문구는 실력 근거로 안 침', src: 'https://ielts.org/cdn/Guides/ielts-writing-band-descriptors.pdf' },
    { k: 'GT 편지 형식', v: '목적 분명히, 세 항목 모두, 수신자에 맞는 어조 일관', src: 'https://ielts.org/cdn/Guides/ielts-writing-key-assessment-criteria.pdf' },
    { k: 'Speaking 구성', v: 'P1 4–5분 · P2 1분 준비+최대 2분 · P3 4–5분, 전 과정 녹음', src: 'https://ielts.org/take-a-test/test-types/ielts-general-training-test/ielts-general-training-format-speaking' },
    { k: '다시 묻기', v: '어느 파트든 질문 반복 요청 가능, 감점 없음', src: 'https://ielts.idp.com/canada/prepare/article-ielts-faq/ielts-speaking-top-frequently-asked-questions' },
    { k: '억양(accent)', v: '출신 억양 자체는 감점 아님 — 알아듣기 쉬운지만 봄', src: 'https://ielts.org/cdn/ielts-guides/ielts-speaking-key-assessment-criteria.pdf' },
    { k: '전체 점수', v: '4영역 평균을 0.5 단위로 반올림(.25→올림, .75→올림)', src: 'https://ielts.org/take-a-test/your-results/ielts-scoring-in-detail' },
    { k: '결과', v: '컴퓨터 시험은 보통 1–2일 내 발표', src: 'https://takeielts.britishcouncil.org/what-is-ielts/how-it-works/test-modes/ielts-on-computer' }
  ]
};
