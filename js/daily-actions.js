// ═════════════════════════════════════════════════════════════
// The Atelier — Roadmap 일일 액션 데이터
// "오늘 할 한 가지" 매일 1개씩 (작은 액션 단위)
//
// 수정 안내:
// - 새 액션 추가: 아래 배열에 { date, weekday, title, steps, estimatedTime, phase, week } 객체 추가
// - 날짜는 'YYYY-MM-DD' 형식
// - 주말은 의도적으로 비워둠 → "오늘은 쉬는 날" 자동 표시
// - 체크 상태는 localStorage 'atelier_roadmap_daily_checks'에 저장 (히스토리 유지)
// ═════════════════════════════════════════════════════════════

window.RM_DAILY_ACTIONS = [
  // Week 1 (5/19~5/22)
  {
    date: '2026-05-19', weekday: '화', phase: 1, week: 1,
    title: '필명 후보 적기',
    steps: [
      '메모장 또는 종이 펼치기',
      '한글 후보 3개 적기 (5분)',
      '영문 후보 3개 적기 (5분)',
      '소리내서 읽어보기'
    ],
    estimatedTime: '15분'
  },
  {
    date: '2026-05-20', weekday: '수', phase: 1, week: 1,
    title: '필명 후보 소리내서 읽기',
    steps: [
      '어제 적은 6개를 입으로 읽어보기',
      '자기소개할 때 어울리는 것 3개로 좁히기'
    ],
    estimatedTime: '10분'
  },
  {
    date: '2026-05-21', weekday: '목', phase: 1, week: 1,
    title: '필명 1개 결정',
    steps: [
      '한글 1 + 영문 1 (또는 둘 다 같은 결로 1개)',
      '완벽한 거 X, 일단 결정 원칙',
      '결정한 거 메모'
    ],
    estimatedTime: '10분'
  },
  {
    date: '2026-05-22', weekday: '금', phase: 1, week: 1,
    title: '메일리 가입',
    steps: [
      'maily.so 접속',
      '이메일로 가입',
      '필명으로 채널 이름 설정'
    ],
    estimatedTime: '20분'
  },
  // Week 2 (5/26~5/29)
  {
    date: '2026-05-26', weekday: '화', phase: 1, week: 2,
    title: '도메인 후보 적기',
    steps: [
      '필명 기반 도메인 5개 후보 메모',
      '예: nurinotes.com / analystn.me / nuri-archive.com'
    ],
    estimatedTime: '15분'
  },
  {
    date: '2026-05-27', weekday: '수', phase: 1, week: 2,
    title: '도메인 가용성 확인',
    steps: [
      'gabia 또는 GoDaddy에서 5개 검색',
      '사용 가능한 도메인 표시'
    ],
    estimatedTime: '20분'
  },
  {
    date: '2026-05-28', weekday: '목', phase: 1, week: 2,
    title: '도메인 1개 결정',
    steps: [
      '어제 가능 표시한 것 중 1개 선택',
      '구매는 아직 X, 결정만'
    ],
    estimatedTime: '5분'
  },
  {
    date: '2026-05-29', weekday: '금', phase: 1, week: 2,
    title: '분석가 N 섹션 위치 정하기',
    steps: [
      '아뜰리에 사이트 어디에 추가할지 메모',
      '새 페이지? 기존 페이지 안?',
      '결정만 (구현 X)'
    ],
    estimatedTime: '10분'
  },
  // Week 3 (6/2~6/8)
  {
    date: '2026-06-02', weekday: '화', phase: 1, week: 3,
    title: '1편 주제 한 줄로 정리',
    steps: ['주제: 왜 이 노트를 시작하는가', '한 줄 메시지만 적기'],
    estimatedTime: '10분'
  },
  {
    date: '2026-06-03', weekday: '수', phase: 1, week: 3,
    title: '2편 주제 한 줄로 정리',
    steps: ['주제: 짝사랑이 끝나지 않는 신경학적 이유', '한 줄 메시지만 적기'],
    estimatedTime: '10분'
  },
  {
    date: '2026-06-04', weekday: '목', phase: 1, week: 3,
    title: '3편 주제 한 줄로 정리',
    steps: ['주제: 섬광 기억은 사라지지 않는다', '한 줄 메시지만 적기'],
    estimatedTime: '10분'
  },
  {
    date: '2026-06-05', weekday: '금', phase: 1, week: 3,
    title: '4편 주제 한 줄로 정리',
    steps: ['주제: 직시 + 인정 + 수용 회복 공식', '한 줄 메시지만 적기'],
    estimatedTime: '10분'
  },
  {
    date: '2026-06-08', weekday: '월', phase: 1, week: 3,
    title: '5편 주제 한 줄로 정리',
    steps: ['주제: 통합형과 분리형 회로', '한 줄 메시지만 적기'],
    estimatedTime: '10분'
  },
  // Week 4 (6/9~6/12)
  {
    date: '2026-06-09', weekday: '화', phase: 1, week: 4,
    title: '1편 도입 1문단 쓰기',
    steps: ['1편 첫 문장 1개만', '완벽 X, 일단 쓰기'],
    estimatedTime: '20분'
  },
  {
    date: '2026-06-10', weekday: '수', phase: 1, week: 4,
    title: '1편 본론 뼈대 메모',
    steps: ['글 안 쓰고, 흐름 항목만 적기', '3-5개 항목'],
    estimatedTime: '20분'
  },
  {
    date: '2026-06-11', weekday: '목', phase: 1, week: 4,
    title: '1편 본론 1단락 쓰기',
    steps: ['뼈대 첫 항목을 글로', '200-400자 분량'],
    estimatedTime: '30분'
  },
  {
    date: '2026-06-12', weekday: '금', phase: 1, week: 4,
    title: '1편 본론 2단락 쓰기',
    steps: ['뼈대 두 번째 항목 글로', '200-400자'],
    estimatedTime: '30분'
  },
  // Week 5 (6/16~6/19)
  {
    date: '2026-06-16', weekday: '화', phase: 1, week: 5,
    title: '1편 본론 3단락 쓰기',
    steps: ['뼈대 세 번째 항목 글로', '200-400자'],
    estimatedTime: '30분'
  },
  {
    date: '2026-06-17', weekday: '수', phase: 1, week: 5,
    title: '1편 결론 1단락 쓰기',
    steps: ['마무리 단락', '다음 편 예고 1줄'],
    estimatedTime: '30분'
  },
  {
    date: '2026-06-18', weekday: '목', phase: 1, week: 5,
    title: '1편 전체 읽기 + 1차 수정',
    steps: ['처음부터 끝까지 읽기', '어색한 부분만 수정', '70% 완성에서 멈추기'],
    estimatedTime: '30분'
  },
  {
    date: '2026-06-19', weekday: '금', phase: 1, week: 5,
    title: '사이트 분석가 N 페이지 시작',
    steps: ['Claude Code로 빈 페이지만 생성', '디자인은 아직 X'],
    estimatedTime: '1시간'
  },
  // Week 6 (6/23~6/30)
  {
    date: '2026-06-23', weekday: '화', phase: 1, week: 6,
    title: '사이트에 1편 글 박기',
    steps: ['분석가 N 페이지에 1편 텍스트 넣기'],
    estimatedTime: '30분'
  },
  {
    date: '2026-06-24', weekday: '수', phase: 1, week: 6,
    title: '도메인 구매',
    steps: ['5/28에 결정한 도메인 구매', '결제 + 등록'],
    estimatedTime: '20분'
  },
  {
    date: '2026-06-25', weekday: '목', phase: 1, week: 6,
    title: '사이트 디자인 결 잡기',
    steps: ['폰트 1-2개 선택', '색상 1-2개 선택', '아뜰리에 결과 통합 고려'],
    estimatedTime: '30분'
  },
  {
    date: '2026-06-26', weekday: '금', phase: 1, week: 6,
    title: '메일리에 1편 임시 등록',
    steps: ['메일리 에디터에 글 옮기기', '발행 X, 임시저장만'],
    estimatedTime: '30분'
  },
  {
    date: '2026-06-29', weekday: '월', phase: 1, week: 6,
    title: '1편 전체 점검 + 미세 수정',
    steps: ['사이트와 메일리 양쪽 확인', '오타·문맥 마지막 점검'],
    estimatedTime: '30분'
  },
  {
    date: '2026-06-30', weekday: '화', phase: 1, week: 6,
    title: 'Phase 1 완료 표시',
    steps: ['마무리 메모 한 줄', 'Phase 2 시작 준비'],
    estimatedTime: '10분'
  }
];
