// ═════════════════════════════════════════════════════════════
// The Atelier — Roadmap 7-Phase 시드 데이터
// 노마드 준비 + 새 수익 파이프라인 (2026.5 ~ 2027.6)
//
// 수정 안내:
// - Phase 추가/삭제/순서 변경 → 아래 RM_PHASES 배열 직접 편집
// - 체크리스트 항목 추가 → 해당 phase.checklist 배열에 { id, text, done } 추가
// - id는 고유해야 함 (LocalStorage 키로 사용됨)
// - done 초기값은 false (사용자 LocalStorage가 우선)
// ═════════════════════════════════════════════════════════════

window.RM_PHASES = [
  {
    id: 'phase-1',
    order: 1,
    name: 'Foundation',
    title: 'Infrastructure Setup',
    start: '2026-05-19',
    end: '2026-06-30',
    goal: '발행 X, 인프라만 깔기.',
    notes: '필명·메일리·도메인·사이트 v1 + 첫 5편 구상까지.',
    checklist: [
      { id: 'p1-1', text: '필명 결정 (한글 후보 3개 + 영문 후보 3개)', done: false },
      { id: 'p1-2', text: '메일리 가입 + 기본 세팅', done: false },
      { id: 'p1-3', text: '도메인 알아보기 (.com 또는 .me)', done: false },
      { id: 'p1-4', text: '사이트 1차 (아뜰리에 안에 분석가 N 섹션)', done: false },
      { id: 'p1-5', text: '첫 5편 구상 메모 (글 X, 핵심 메시지만)', done: false },
      { id: 'p1-6', text: '1편 초안 작성', done: false }
    ]
  },
  {
    id: 'phase-2',
    order: 2,
    name: 'Build',
    title: 'Content & MVP',
    start: '2026-07-01',
    end: '2026-08-31',
    goal: '콘텐츠 5편 완성 + 바이브 코딩 도구 1개 MVP + 웹소 신작 완결.',
    notes: '',
    checklist: [
      { id: 'p2-1', text: '2-5편 초안 작성', done: false },
      { id: 'p2-2', text: '1편 발행 가능한 완성도로 다듬기', done: false },
      { id: 'p2-3', text: '사이트 보강 (아카이브 + 첫 페이지 + About)', done: false },
      { id: 'p2-4', text: '바이브 코딩 도구 MVP (직시 노트 워크북)', done: false },
      { id: 'p2-5', text: '웹소 포스타입 신작 완결', done: false },
      { id: 'p2-6', text: '메이저 웹소 진입 준비 (네이버·카카오 상위권 분석)', done: false }
    ]
  },
  {
    id: 'phase-3',
    order: 3,
    name: 'Protect',
    title: '닫음의 달',
    start: '2026-09-01',
    end: '2026-09-24',
    goal: '새 작업 X. 정서 자원은 닫음 의례로.',
    notes: '추석 전. 새 시작 없이 마무리만.',
    checklist: [
      { id: 'p3-1', text: '8월 결정 사항 확정', done: false },
      { id: 'p3-2', text: '기존 5편 미세 다듬기만', done: false },
      { id: 'p3-3', text: '바이브 코딩 도구 베타 유지보수만', done: false },
      { id: 'p3-4', text: '닫음 의례 준비', done: false },
      { id: 'p3-5', text: '웹소 1차 창작 아이디어 메모만', done: false }
    ]
  },
  {
    id: 'phase-4',
    order: 4,
    name: 'Launch',
    title: '정식 시작',
    start: '2026-10-05',
    end: '2026-10-31',
    goal: '뉴스레터 정식 시작 + 도구 공개.',
    notes: '',
    checklist: [
      { id: 'p4-1', text: '추석 귀국 후 정서 재충전 확인', done: false },
      { id: 'p4-2', text: '1편 발행 (왜 이 노트를 시작하는가)', done: false },
      { id: 'p4-3', text: '2편 발행 (짝사랑이 끝나지 않는 신경학적 이유)', done: false },
      { id: 'p4-4', text: '사이트 공개 + 직시 워크북 베타 공개', done: false },
      { id: 'p4-5', text: '인스타 익명 계정 개설', done: false },
      { id: 'p4-6', text: '웹소 메이저 1차 창작 시작 (단편 1편 분량)', done: false }
    ]
  },
  {
    id: 'phase-5',
    order: 5,
    name: 'Settle',
    title: '페이스 안정',
    start: '2026-11-01',
    end: '2026-12-31',
    goal: '페이스 안정 + 구독자 100-300명.',
    notes: '',
    checklist: [
      { id: 'p5-1', text: '격주 1편 페이스 유지 (3-5편 발행)', done: false },
      { id: 'p5-2', text: '우형 오빠 케이스 → 회복 공식 → 통합형/분리형 시리즈 발행', done: false },
      { id: 'p5-3', text: '구독자 100 → 300명 자연 증가 관찰', done: false },
      { id: 'p5-4', text: '직시 워크북 사용자 피드백 반영', done: false },
      { id: 'p5-5', text: '웹소 1차 창작 단편 마무리 + 메이저 플랫폼 투고', done: false },
      { id: 'p5-6', text: '메일리 통계 분석', done: false }
    ]
  },
  {
    id: 'phase-6',
    order: 6,
    name: 'Expand',
    title: '사연 + 디지털 제품',
    start: '2027-01-01',
    end: '2027-03-31',
    goal: '사연 받기 시작 + 첫 디지털 제품.',
    notes: '',
    checklist: [
      { id: 'p6-1', text: '누리 본인 케이스 → 익명 사연 분석으로 확장', done: false },
      { id: 'p6-2', text: '사연 받기 시스템 구축 (사이트 신청 폼)', done: false },
      { id: 'p6-3', text: '첫 디지털 제품 출시 (직시 사고법 워크북 PDF 또는 노션 템플릿)', done: false },
      { id: 'p6-4', text: '디지털 제품 가격 1-3만 원 설정', done: false },
      { id: 'p6-5', text: '1:1 분석 베타 시작 (월 2-4명 한정, 5-15만 원)', done: false },
      { id: 'p6-6', text: '메이저 웹소 진입 결과 평가 + 다음 작품 시작', done: false }
    ]
  },
  {
    id: 'phase-7',
    order: 7,
    name: 'Monetize',
    title: '수익 구조 안정',
    start: '2027-04-01',
    end: '2027-06-30',
    goal: '수익 구조 안정 + 본업 비중 조정 검토.',
    notes: '',
    checklist: [
      { id: 'p7-1', text: '유료 멤버십 시작 (메일리 또는 Substack 월 5천-1만 원대)', done: false },
      { id: 'p7-2', text: '1:1 분석 정식 운영 (월 4-8회, 10-30만 원)', done: false },
      { id: 'p7-3', text: '디지털 제품 2호 출시 (관계 분석 가이드)', done: false },
      { id: 'p7-4', text: '직시 워크북 도구 정식 유료화 검토', done: false },
      { id: 'p7-5', text: '외부 노출 본격화 (인터뷰·외부 기고)', done: false },
      { id: 'p7-6', text: '본업 시간 vs 콘텐츠 시간 비중 결정', done: false }
    ]
  }
];

// 기본 설정
window.RM_CONFIG_DEFAULT = {
  title: '2026–2027 Roadmap',
  subtitle: '분석가 N · 노마드 준비 + 수익 파이프라인',
  quote: '"천 개의 뉴스레터의 여정은 단 하나의 도메인 검색에서 시작된다."',
  nextDays: 12
};
