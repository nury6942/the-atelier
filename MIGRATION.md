# Atelier SPA 마이그레이션 로드맵

현재 단일 HTML(1.8MB) → SvelteKit SPA로 마이그레이션 진행 중.
**`main` 브랜치 = 현재 사이트 (라이브)**, **`migration` 브랜치 = 새 작업** — 완전 분리.

## 기술 스택

- **SvelteKit** + TypeScript + Svelte 5 runes
- **Tailwind v4** (Vite 플러그인)
- **Firebase** (auth, firestore, storage) — 백엔드 그대로
- **@sveltejs/adapter-static** (GitHub Pages 정적 빌드)
- **Vite** 자동 코드 분할

## 디렉터리

```
the-atelier/
├── index.html         ← main 브랜치 라이브 사이트
├── js/                ← main 브랜치 라이브 JS
├── service-worker.js  ← main 브랜치
└── app/               ← migration 브랜치 SvelteKit 프로젝트
    ├── src/
    │   ├── routes/    ← 페이지별 (Dashboard, Money, Travel, …)
    │   ├── lib/       ← 공통 (Firebase, 컴포넌트, 유틸)
    │   ├── app.html
    │   └── app.css    ← Tailwind 토큰 + Atelier 디자인
    ├── build/         ← npm run build 결과 (gitignore)
    └── package.json
```

## 마이그레이션 순서 (4~6주)

### Week 1 — 기반
- [x] Node + SvelteKit + Tailwind + Firebase 셋업
- [x] 정적 빌드 확인 (124KB)
- [ ] Firebase 설정 + Auth 연결 (ALLOWED_EMAIL 체크 포함)
- [ ] 사이드바 + 모바일 햄버거 메뉴
- [ ] 라우터 (`/`, `/calendar`, `/money`, `/annie`, `/travel`, `/memo`)
- [ ] 로그인 화면

### Week 2 — Dashboard
- [ ] Dashboard 메인 (Stitch Bento Grid)
- [ ] AI 브리프 + Claude API 연결
- [ ] 뉴스 헤드라인
- [ ] 영어 표현
- [ ] 환율 위젯

### Week 3 — Money (가장 무거움)
- [ ] Money 메인 + 탭 (자산/가계부/부업)
- [ ] Daily Ledger (월별 뷰, 연간 뷰)
- [ ] 차트 (모바일 fallback 텍스트)
- [ ] Side Gig

### Week 4 — Travel + Calendar + Annie
- [ ] Travel (여행 추가/수정, 도시, 예산)
- [ ] Calendar (Voyage Path, 일정)
- [ ] Annie (Annual Matrix)

### Week 5 — Memo + 모달
- [ ] Memo (자동 저장)
- [ ] 모달 시스템 (공통 컴포넌트)
- [ ] 트랜잭션 입력 인라인

### Week 6 — 마무리
- [ ] PWA manifest + Service Worker
- [ ] 핸드폰 테스트 + 최적화
- [ ] `main` 브랜치로 머지 → 라이브

## 명령어 메모

```bash
# 작업 시작
cd app
npm run dev          # 개발 서버 (localhost:5173)

# 빌드 테스트
npm run build        # build/ 폴더 생성
npm run preview      # 빌드 결과 미리보기

# 마이그레이션 브랜치 작업
git checkout migration   # 이 브랜치에서만 작업
git checkout main        # 라이브 사이트로 복귀
```

## 데이터 안전

- Firebase 백엔드 변경 없음 → 기존 데이터 그대로
- 모든 데이터 모델 (SCHEMAS 객체) 그대로 이전
- localStorage 키 호환성 유지 (`atelier_*`)
