# The Atelier — 작업 일지

> 💡 **사용법**: 새 세션 항목은 **맨 위에** 추가됩니다 (최신이 위).
> Claude Code가 세션 종료 시 자동으로 추가하므로 직접 작성할 일은 거의 없습니다.

---

## 📋 세션 기록 템플릿

새 세션은 아래 형식으로 추가됩니다:

```
## YYYY-MM-DD (기기: 맥북 / 아이맥 / 윈도우)

### ✅ 한 일
- (오늘 완료한 작업들)

### 🎯 다음 할 일
- (다음 세션에서 이어갈 항목)

### 🚧 막힌 점 / 결정 보류
- (해결 못 한 이슈, 나중에 다시 봐야 할 것)

### 💭 메모
- (시행착오, 왜 이 방식을 골랐는지, 다른 방법 고려한 것 등)

---
```

---

## 🗂 세션 기록

<!-- 새 세션은 이 아래에 추가됩니다. 가장 최근이 맨 위. -->

## 2026-05-26 (기기: 윈도우 · 2차)

### ✅ 한 일
- **Backward Plan 체크리스트 인터랙티브화** — 4개 Phase 카드의 5~11개 항목들이 하드코딩 시각 상태(A는 다 체크, 나머지는 다 빈 라디오)였던 걸 **실제 클릭 토글 가능**하게. 기존 `_nomadChecks`/`toggleCheck` 패턴을 그대로 활용 — storageKey=`'backward'`, itemKey=`'A-0'`/`'B-3'` 형식. 신규 `toggleBackwardCheck(phaseId, idx)` 함수 추가(LS 즉시 + 재렌더 + Firestore 백그라운드). `_nmActivateBackward`에 `initChecks()` 호출 추가. 체크 시 취소선 + 60% opacity, 호버 시 라이트 보라 배경
- **D phase 출국 항목 보존** — D-0 첫 항목(`6.1-7 부여 본가 1주일`)의 `flight_takeoff` 아이콘 + 보라 강조 + 굵게는 체크 안 한 상태에서도 유지. 체크하면 `check_circle`로 전환
- **국기 이모지 fallback 통합** (Windows Segoe UI Emoji 국기 미지원 문제 완전 해결)
  - `.nomad-page` 변수 `--nm-font-h: 'Manrope', 'Noto Color Emoji', 'Apple Color Emoji', 'Segoe UI Emoji', sans-serif` 추가
  - `nomad-pages.js`의 **217곳 inline** `font-family:Manrope` / `font-family:Manrope,sans-serif` / `font-family:Manrope"` 모두 → `font-family:var(--nm-font-h)` 일괄 치환
  - `index.html`의 **30+ CSS 클래스** 폰트 정의도 var로 통일 (`.nm-city-v2-h1`, `.nm-city-v2-h1-code`, eyebrow, stats 등)
  - 도시 hero "PT" 박스 안에 국기 이모지 prefix 추가 — `<span class="nm-emoji">🇵🇹</span> PT` 형태
- **파일 변경**: `js/nomad-pages.js`(toggleBackward + isBackwardChecked + initChecks 호출 + LEFT/RIGHT forEach 토글화 + hero 국기 + 폰트 var 치환 217곳), `index.html`(--nm-font-h 변수 정의 + CSS 30+ rule var 통일 + 캐시 v=165→v=166), `service-worker.js`(atelier-v165→v166)

### 🎯 다음 할 일
- **이미지 fit 모드 옵션** — 현재는 `object-fit:cover` 고정. 인물 사진 등 cover로 잘리는 경우 contain 토글 검토
- **paste 힌트 텍스트 톤 통일** — "Ctrl+V로 붙여넣기"(phase) vs "Ctrl+V로 이미지 붙여넣기 가능"(도시 hero) 두 군데 톤 통일
- **체크리스트 진행률 표시** — 각 Phase 카드에 "3/5 완료" 같은 진행률 표시 검토
- 5/24 잔여: 가계부 `📋 Claude 공유` 모바일 export 버튼, 한국 공휴일 2027년치 추가

### 🚧 막힌 점 / 결정 보류
- 폰트 var 치환 217곳은 안전한 변경이지만, **모바일에서 한 번 더 시각 회귀 확인 필요** (`m-ledger.html` 등 다른 페이지엔 영향 없음 — `.nomad-page` scope만 변경)

### 💭 메모
- **CSS variable로 inline style 일괄 통제** 패턴이 깔끔: 217곳 inline `font-family:Manrope`를 `var(--nm-font-h)`로 바꾸니 미래 변경(폰트 추가/순서 조정)도 정의 한 줄만 손보면 됨. 비슷한 패턴으로 색·간격도 var로 옮기면 시즌별 테마 손쉽게 변경 가능
- **체크리스트 패턴 재사용**: `_nomadChecks` 객체에 카테고리 추가만으로 새 체크리스트 슬롯 만들 수 있음. 'visa_docs', 'actions', 'packing'에 이번에 'backward' 추가. 다음에 또 체크 가능 항목 필요하면 같은 패턴

---

## 2026-05-26 (기기: 윈도우 · 1차)

### ✅ 한 일
- **🌴 Backward Plan Phase 이미지 업로드 기능** — 노마드 페이지 → Backward Plan의 4개 Phase 카드(A Foundation / B Building / C Exit / D Departure)에 이미지 박스 추가. 그라데이션 fallback은 유지하면서 우상단 컨트롤로 추가/변경/삭제. **호버 시 컨트롤 노출, 비어있을 땐 "이미지 추가" 버튼 상시 표시**
- **Ctrl+V 페이스트 지원** — `_activePhaseId` 추적해서 마우스가 올라간 phase에 붙여넣기. 호버 시 좌하단에 "Ctrl+V로 붙여넣기" 힌트 노출. 도시 hero 페이지 기존 paste 핸들러를 확장(같은 `_nmPasteHandler` 안에서 mode 분기 — 'phase' | 'city')
- **저장소**: localStorage(`atelier_nomad_phase_<id>`) + Firestore(`nomadPhaseImages/<id>` = `{ image, updatedAt }`). 도시 hero와 동일 패턴 그대로 복제 — `_nmProcessImage`(1600px·JPEG 0.82), `_nmApplyPhaseImage`, `_nmActivateBackward`(페이지 진입 시 LS hydrate + 4개 phase Firestore 백그라운드 fetch + 변경 시 재렌더). 메모리 캐시 `_phaseImages = { A,B,C,D }`
- **국기 이모지 fallback** — Operating Principles 페이지 "도시별 작업 비중" 표(14개 도시)의 국기가 Windows에서 표시 안 되던 문제. `.nm-emoji` 클래스 추가(`font-family: 'Noto Color Emoji', 'Apple Color Emoji', 'Segoe UI Emoji' !important`), `r.flag` span에 클래스 부여. (이후 2차 세션에서 전체 var화로 일관성 확장)
- **파일 변경**: `js/nomad-pages.js`(헬퍼·컨트롤·paste 분기·activeBackward), `index.html`(글래스 컨트롤 + paste-hint + nm-emoji CSS, 캐시 v=163→v=165), `service-worker.js`(atelier-v163→v165)

### 🚧 막힌 점 / 결정 보류
- 사용자가 첫 시도에서 "이미지 안 들어간다"고 했는데, **세션 종료 시점에만 push하는 룰** 때문에 직전 세션의 CSS만 올라간 상태로 라이브에서 동작 안 했음. → 큰 기능 끝낸 직후 push할지 명시적으로 물어보는 패턴으로 옮길 것

### 💭 메모
- 도시 hero와 phase 이미지가 **거의 동일한 패턴**으로 구현됨 — 공통 모듈 추출은 두 군데뿐이라 일단 보류
- **paste 동작 조건**: `currentSubPage === 'nomad-backward' && _activePhaseId`. 호버 안 한 상태에서 Ctrl+V는 의도적으로 무시 (backward는 4 phase가 한 화면에 있어서 호버 추적 필수)

---
## 2026-05-24 (기기: 아이맥 · 오후)

### ✅ 한 일
- **Postype 매출 분석 atelier 통합** — 부업 탭에 신규 섹션. Firebase Firestore 3개 컬렉션 신설(`postypeChannelDaily/Posts/Series`). fbRead/Add/Update/Delete 그대로 사용, SCHEMAS 객체는 안 건드림 (신규 컬렉션은 nested 객체로 그대로 저장 — fbAdd가 받아줌)
- **북마크릿 v3 + 부트스트랩 패턴** — 포스타입은 인증 세션 필요해 GitHub Actions 자동화 불가, 매일 1클릭 흐름. 짧은 부트스트랩 `javascript:fetch(...).then(eval)`이 GitHub Pages에서 매번 최신 코드 fetch → 코드 업데이트 시 자동 반영, 북마크 재등록 불필요. prompt에 `ytd` 입력하면 올해 1월부터 자동 일수 계산
- **postMessage 브릿지** — 북마크릿이 포스타입에서 fetch 후 atelier 새 탭(`?postype-bridge=1`) 열고 데이터 postMessage 전송. atelier가 fbAdd/Update upsert. cross-origin postMessage로 URL 길이 한도 회피, 양방향 ready/done 통신
- **월별 뷰 + 입금일 표시** — 28/90/365일 슬라이딩 X, 달력 월 기준 (입금 주기와 일치). 좌우 화살표 네비. KPI 4종 재구성: 이번 달 매출 / 일평균 / 최고 매출일 / 전월 대비 %. 입금일 = 매월 10일, 토/일/공휴일이면 직전 평일 (2026년 한국 공휴일 하드코딩). 선택 월 매출은 **다음 달** 10일 입금이라 paymentForMonth는 yearMonth+1 기준
- **차별화 위젯 5종**:
  - 시리즈 회차별 매출 곡선 (TOP 4 + 회차 이탈률 %)
  - 발행 후 D1~D30 누적 매출 라인 (감쇠 곡선)
  - 발행 시점 효과 표 (요일·시간대 × 24h 매출 평균, 최고치 인디고 하이라이트)
  - 가격대 분포 (500P~묶음 2500P+, 묶음 비중 별도 표시)
  - 요일×시간 매출 히트맵 (선택 월 기준)
- **파일 변경**: `js/app-6-postype-analytics.js` 신규 560줄, `index.html` 부업 탭 끝에 섹션 삽입 + script 태그 추가, `scripts/postype-bookmarklet.js` 신규

### 🎯 다음 할 일
- **매일 동기화 루틴 정착** — 캘린더에 저녁 11시 알림 추가 권장 (포타 수익 페이지 → 북마크릿 1클릭)
- **멤버십 가입/이탈 데이터 import** — 현재는 일별 매출 + 포스트/시리즈만. 멤버 페이지가 SPA라 별도 북마크릿 또는 페이지네이션 순회 필요
- 1년 누적 후 연도 비교 위젯 검토
- 한국 공휴일 **2027년치 추가** (현재 2026년만)
- 요란한 옥탑방 채널도? `CHANNEL_ID` 상수만 바꾸면 가능 — 채널 선택 UI 추가 검토

### 🚧 막힌 점 / 결정 보류
- **자동화 불가** — 매일 1클릭은 시스템 한계. 포스타입이 로그인 쿠키 인증 필수, 서버 자동화 접근 불가. 받아들이고 루틴화로 해결
- **첫 백필 prompt UX 함정** — default가 '28'이라 그냥 Enter 누르면 28일치만 import. 사용자가 'ytd'를 타이핑해야 함. 추후 confirm 분기로 개선 검토
- **위젯의 월 컨텍스트 결정** — 시리즈 회차/감쇠/발행 시점은 전체 데이터 기준, 가격대/히트맵은 선택 월 기준. 사용해보고 조정 가능

### 💭 메모
- **부트스트랩 북마크릿 패턴**이 깔끔: 짧은 한 줄 + 외부 코드 fetch. 코드 변경 시 atelier 푸시만 하면 사용자 측 자동 반영. 코드 길이 한도 회피
- **postMessage 브릿지 origin 검증** 필수 — 보안상 `postype.com`에서 오는 메시지만 수신, atelier 외부 메시지 거부
- 90일 분석에서 발견한 인사이트들 (금 21시 발행 = 24h 매출 19배 등)이 거의 다 5단계 위젯으로 반영됨 → 매일 atelier에서 같은 분석 자동 갱신
- **검토하고 안 쓴 대안들**:
  - URL hash 전달 → 백필 시 50KB+ hash 보기 안 좋아서 postMessage 채택
  - Firebase REST API 직접 호출 → 보안 규칙·토큰 관리 복잡, atelier 도메인 통한 fbAdd가 안전
  - Chrome 확장 → 백그라운드 가능하지만 큰 작업, 매일 1클릭 받아들임

---

## 2026-05-24 (기기: 아이맥)

### ✅ 한 일
- **🌴 노마드 모드 일정 계산 추가** — 2028년 5월 퇴사 + 6월부터 디지털 노마드 라이프 대비. 새 작품/편집 모달에 "노마드 모드" 체크박스 추가. ON 시:
  - **시놉**: 평일 20일 (회사원 기본 = 빈 날 28일)
  - **초고**: 평일 1편/일, 주말 휴식 (회사원 = 평일 0.5화/주말 1화)
  - **퇴고**: 평일 1편/일, 주말 휴식 (회사원 = 빈 날 매일 1편)
  - 연재는 그대로 (주 1회)
  - `work.nomad` 플래그로 저장, `autoAddScheduleToCalendar`도 노마드 분기 → 캘린더 이벤트도 주말 비어있게 생성
  - **수정 함수**: `calculateWorkSchedule`, `autoAddScheduleToCalendar`, `previewWorkSchedule`, `saveNewWork`, `openEditWorkModal`, `saveEditWork`, `recalcEditWork`, `recalcFromPhase`
  - **신규 헬퍼**: `findNextAvailableWeekdays(fromDate, count)` — 차단일·주말 모두 스킵
  - 캐시 `app-1-pages.js v=115→v=116`, 서비스워커 `atelier-v115→v116`

- **매트릭스 에피소드 race condition 클리어 버그** (커밋 `69af9cf`) — Annual Matrix 페이지에서 새로고침 후 R/B시리즈의 모든 월 에피소드가 "—"로 사라지는 현상:
  - **범인**: `syncCalToMatrix` 마지막 루프(13680+)가 "monthEps에 없는 월의 eps를 전부 클리어". plannerData가 Firestore에서 fetch되기 전에 호출되면 publishing 이벤트 0개로 인식 → 모든 series.monthly[m].eps 클리어 → saveSeriesData가 빈 series를 Firestore에 저장 → 새로고침마다 빈 데이터 반복
  - **수정**: 함수 진입부에 가드 추가. (a) plannerData 비어있거나 (b) publishing 이벤트 0개인데 confirmed 작품 있음 → race condition으로 판정하고 early return. localStorage·Firestore 어떤 것도 안 건드림
  - **즉시 복구**: 콘솔에서 `syncCalToMatrix(2025); syncCalToMatrix(2026); syncCalToMatrix(2027); syncCalToMatrix(2028); renderIncomeMatrix();` 1줄로 plannerData publishing 이벤트(67개 살아있음)에서 eps 즉시 복구됨
  - 캐시 `app-1-pages.js v=114→v=115`, 서비스워커 `atelier-v114→v115`

- **2026-09-28 잘못된 추석 대체공휴일 제거** (커밋 `44990da`) — 한국 공휴일법: 추석/설날은 일요일 겹침만 대체 적용 (토요일은 적용 안 됨). 2026 추석(9/24-9/26)은 토요일과만 겹쳐서 대체 발생 안 함. 다른 공휴일(삼일절·광복절·개천절·한글날·어린이날·부처님오신날·크리스마스)은 토/일 모두 대체 적용되는 점과 구분. 캐시 v=113→v=114

- **캘린더 작품 일정 중복 생성 버그 진단 + 수정** (커밋 `c0ad52d`) — Money 부업 페이지 진입할 때마다 캘린더에 초고/연재 일정이 두 배로 쌓이던 문제. 사용자가 "재동기화" 토스트 자주 본다는 직관에서 출발해서 코드 추적:
  - **범인**: `renderIncomeMatrix` 안의 `_autoMatrixGuard` IIFE (line 13042-13058). "confirmed 작품 있는데 캘린더 publishing 0개면 자동 복구"라는 의도였는데, `plannerData`가 Firestore에서 완전히 로드되기 전에 체크하면 false negative로 `_fullResyncWorks` trigger → Step 1 삭제는 비어있는 로컬에만 적용되고 Step 2 추가는 모두 진행 → 나중에 Firestore fetch가 옛 이벤트 들고 와서 중복
  - 멀티 기기(맥북·아이맥·윈도우)에서 각 기기가 독립적으로 trigger돼서 Firestore에 누적되던 구조
  - **수정**: `_autoMatrixGuard` IIFE 통째로 제거. 캘린더 진짜 비었으면 사용자가 수동 "재동기화" 버튼 클릭 (이미 작품 카드에 있음). 5/17의 `b2effc7`(cache-first race) 픽스와 같은 종류지만 다른 경로
  - **안전망**: `loadIncome` 끝에 `cleanupDuplicateWorkEvents` + `cleanupOrphanWorkEvents` 1.5초 지연 자동 실행 추가 → 이미 쌓인 중복도 페이지 열면 자동 청소됨
  - 캐시 `app-1-pages.js v=105→v=113`, 서비스워커 `atelier-v112→v113`

- **포스타입 트렌드 스크래퍼 정렬 버그 진단 + 수정** — 조회수 1~163짜리 신작이 1·2·3위로 잡히던 문제. Chrome MCP로 직접 검색 페이지 진입해서 두 개 버그 확인:
  1. "인기순" 버튼을 `textContent === '인기순'` 정확 매칭으로 클릭 시도 → SPA에서 셀렉터 불일치로 실패해도 silent fallthrough → 최신순 결과 그대로 수집
  2. 작품 URL 셀렉터 `a[href*="/post/"]`가 검색 페이지 자체 URL(`/search/post`, 80개)까지 잡아서 진짜 작품 URL을 밀어냄
- **scripts/scrape-postype.js 수정 4건**:
  - URL에 `&sort=POPULAR` 파라미터 강제 → 클릭 불필요. 정렬 후 "전체 인기순" 텍스트로 검증 (`sortVerified` stat)
  - 작품 URL 셀렉터를 정규식 `/^\/@[^/]+\/post\/\d+/`로 변경 → search/post URL 완전 배제
  - 검색결과 카드에서 조회수/좋아요/댓글 미리 추출 (`parseKrCount`로 "1.9만" → 19000 변환)
  - Sanity check: 상위 5개 평균 조회수 < 2000이면 `process.exit(2)` (`POSTYPE_FORCE=1`로 오버라이드 가능)
- **테스트 결과**: TOP 5 평균 조회수 **19,600** (1.96만), sortVerified=true, 12/12 성공 — 이전 조회수 1~163과 비교하면 100배 이상 차이
- **data/trends/postype/{latest,2026-05-24,index}.json 갱신** — 진짜 인기 작품 12개 (본디본딩 23k, 멘카라 블루 21k, 다이다이다이 19k, 환승연애 막내작가 19k 등)

### 🎯 다음 할 일
- 다른 기기(맥북·윈도우)에서 작업 시 **하드 새로고침 1회 필수** — 오늘 캐시 v112→v115까지 3번 올라감
- **연차 데이터 사라진 건** — 사용자가 직접 처리 예정 (휴지통 100개에 연차 0개 확인됨, Firestore에서 직접 복구 또는 재입력)
- GitHub Actions cron 스크립트 — sanity check `exit(2)` 시 알림 받는 구조인지 점검
- 분석 스크립트 `scripts/analyze-trends.js`도 신규 필드(`viewCount`, `searchRank`)를 활용하게 업데이트 검토
- 5/20 미완료 항목: 가계부 `📋 Claude 공유` 버튼 실사용 + 모바일 export 버튼 추가 결정
- 한국 공휴일 **2027년 이후 substMap도 추후 사용자 확인** — 일요일 겹침/토요일 겹침 룰 다시 검증 필요

### 🚧 막힌 점 / 결정 보류
- 첫 페이지에서 12개만 잡힘 (`POSTYPE_TOP_N=20` 요청해도). 인기순 정렬이라 상위가 그 정도인 듯 — 추가 페이지 스크래핑 필요한지는 트렌드 분석 품질 보고 판단
- syncCalToMatrix 가드의 부작용: 사용자가 진짜로 모든 publishing 이벤트를 수동 삭제한 경우에도 eps 클리어가 차단됨 (data 보전 우선이라 트레이드오프 받아들임)

### 💭 메모
- 포스타입 검색 URL에 `sort=POPULAR` 파라미터가 통한다는 건 다른 탭(시리즈 검색 `sort=POPULAR`)에서 우연히 발견 — post 검색에도 동일하게 작동
- "1.9만"처럼 한국어 만/천 접미사가 붙은 숫자 파싱을 위해 `parseKrCount(raw)` 헬퍼 추가 — 다른 스크레이퍼에서도 재사용 가능
- Chrome MCP의 `Control_Chrome`은 권한 이슈로 실행 실패 → `Claude_in_Chrome` MCP로 우회 (둘 다 설치돼있었음)
- **세 가지 race condition 다 같은 패턴**: 캐시(혹은 비어있는 로컬) 상태에서 자동 실행 → Firestore에 잘못된 빈/중복 데이터 저장 → 새로고침마다 빈 상태 반복. 해결책 공통: "데이터가 정말 비었나 vs 아직 로드 안 됐나"를 휴리스틱으로 구분, 의심되면 SKIP. 5/17 `b2effc7`(cleanupDuplicateWorkEvents), 5/24 `c0ad52d`(_autoMatrixGuard), 5/24 `69af9cf`(syncCalToMatrix) — 같은 종류의 버그를 세 군데에서 잡아냄

---

## 2026-05-20 (기기: 윈도우 · 오후 작업)

### ✅ 한 일
- **Roadmap 페이지 카드 4종 화이트 베이스로 가독성 개선** — TODAY 카드 / 큰 Active Phase 카드 / 다음 12일 / Status Report. 보라→핑크 그라데이션은 헤딩 텍스트·뱃지·완료 버튼 액센트로만 보존
- **daily-guides.js 신설** + 5/19 "필명 후보 적기" 가이드 입력 (흐름/결정 포인트/참고 예시/주의/리소스/다음 액션 6개 구역)
- **TODAY 카드 클릭 시 인라인 가이드 펼침** + 완료 체크 시 1.4초 미니 토스트 ("✨ 오늘 한 가지 완료")
- **가계부 Claude export 기능 단계별 합의**: Phase 1 진단 보고 → Phase 2 9개 섹션 마크다운 명세 → Phase 3 영향 범위 보고
- **아이맥에서 어제 구현한 export v1 3커밋 pull로 동기화** (`app-5-ledger-export.js` 746줄 + `index.html` 헤더 버튼/토글/fallback 모달 + 캐시 v112)
- **CLAUDE.md / WORKLOG.md / DATA_SAFETY.md 셋업** — 작업 자동화 규칙 + 기존 데이터 안전 규칙은 별도 파일로 분리 보존

### 🎯 다음 할 일
- 가계부 `📋 Claude 공유` 버튼 실제 사용해보기 — 마스킹 ON/OFF로 두 번 복사해서 G섹션 차이 확인, claude.ai 채팅에 붙여서 답변 품질 체크
- 써본 결과 보고 v1.5에서 모바일(`m-ledger.html`)에도 export 버튼 추가할지 결정
- 5/20 (수) Daily Guide 작성: "후보 6개 소리내서 읽기 + 3개로 좁히기"
- 자산 시트 실데이터 정비 → export 명세 v2에서 자산 섹션 추가 (Phase 2에서 v1 제외 결정)

### 🚧 막힌 점 / 결정 보류
- `finance_hub`(옛 데스크탑 Money 시스템)와 `ledgerTransactions`(새 DAILY LEDGER 시스템) 두 컬렉션이 어떻게 연결돼있는지 미검증. Phase 1 진단에서 짚었지만 실데이터로 확인 안 함. 부업 수익이 양쪽에 이중 기록될 가능성 — export F섹션이 시리즈 매트릭스를 직접 읽는 방식이라 우회는 됐지만 본질적 정리는 필요.

### 💭 메모
- 초기엔 Roadmap 카드들에 보라→핑크 그라데이션을 **카드 배경**으로 깔았는데, 흰 글씨가 가독성 떨어진다는 피드백. 화이트 베이스로 뒤집고 그라데이션은 "헤딩·뱃지·버튼" **액센트로만** 보존하니 통일성은 유지되면서 읽힘. "디자인 시스템 통일"은 색 자체보다 **색의 역할(액센트)** 일관성이 답.
- 가계부 export처럼 큰 기능은 **Phase 1 진단 → Phase 2 명세 → Phase 3 영향범위 → 구현** 단계 패턴이 잘 맞는 듯. 각 단계 끝에서 멈추고 승인 받기. 큰 기능 들어갈 때마다 이 패턴 쓰자.
- 어제 아이맥에서 한 export v1 작업이 push 잘 돼있어서 윈도우에서 fast-forward로 깨끗하게 받음. **세션 끝마다 push는 진짜 룰** — 안 그러면 충돌·중복 작업 폭탄.

---

## 2026-05-20 (기기: 초기 셋업)

### ✅ 한 일
- `CLAUDE.md`, `WORKLOG.md` 두 파일 생성
- 3개 기기(맥북/아이맥/윈도우) 간 작업 컨텍스트 공유 구조 설계
- Claude Code 세션 시작/종료 자동화 규칙 정의 (git pull → 작업 → git push)

### 🎯 다음 할 일
- 다른 두 기기에서도 `git pull`로 이 두 파일 받기
- 다음 실제 작업 세션에서 자동화가 잘 도는지 확인
- 잘 안 되는 부분 있으면 `CLAUDE.md` 다듬기

### 🚧 막힌 점 / 결정 보류
- (없음)

### 💭 메모
- 핵심 깨달음: git push로 옮겨가는 건 "결과물"이고,
  WORKLOG.md로 옮겨가는 건 "결과에 도달한 과정"임.
  이 둘이 합쳐져야 다른 기기에서 진짜 이어서 작업 가능.
- WORKLOG는 prepend(맨 위에 추가) 방식 — 길어져도 스크롤 안 해도 됨.

---
