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

## 2026-06-22 (기기: 윈도우 · 회사)

### ✅ 한 일

**사이드잡(포스타입) 분석 — 차별화 위젯 정리 (4개 → 위젯1 집중)**
- 삭제: 위젯2(발행 후 N일 누적 매출/감쇠곡선), 위젯3(발행 시점 효과), 위젯4(가격대 분포)
  - JS 렌더 함수 4개 제거: `populateDecaySeriesSelect`, `renderDecayChart`, `renderPubEffect`, `renderPriceDist` + `renderForMonth` 호출부 + `decaySeries` 상태/리셋 잔재
  - index.html 위젯2~4 마크업 + 2개 grid row 제거 (위젯5 히트맵은 유지)
- 위젯1(시리즈 회차별 매출) 확대·강화:
  - 전체 폭 카드로 전환, 내부는 반응형 1 / 2 / 4열 그리드
  - TOP 4 → **TOP 8**
  - 카드에 통계 블록 추가: **피크 회차·평균·최고·최저** + 스파크라인 피크 지점 앰버 마커
- 검증: `node --check` OK, 삭제 위젯 ID/함수 잔재 grep 0건

**사이드잡(포스타입) 분석 — 월별 매출 추이 차트 신규 추가 (일별 차트와 같은 스타일)**
- 위치: '일별 매출' 차트 바로 아래 새 카드 (`renderMonthlyTrend`)
- ⚠️ 1차로 YoY(올해 1~12월 vs 작년 같은 달, 점선)로 만들었는데, 누리 진짜 의도는 **"전체 기간 월별 총액 한 줄 추이"**(일별은 이미 이번/저번달 커버 → 월 단위 총액 흐름이 필요) → **2차로 재작업**
- 최종: 첫 데이터 달 ~ 이번 달까지 **달마다 총 매출 1점**, 인디고 실선+영역(부드러운 베지어). YoY 점선 제거. 빈 달은 가로 간격만 반영(선은 이어짐)
- 진행 중인 이번 달 = 끝점에 **할로우 마커(◦)** + 호버 '진행 중'. 호버 툴팁: `YY.MM · 총액 · (전월 ±%) · 진행 중` + vline
- 메타: `첫달~이번달 · N개월 · 월평균 · 최고 YY.MM 금액`
- 검증: `node --check` OK, YoY 잔재(prevRev 등) 월별함수에서 grep 0건

**Annie 영어 레슨 리뷰 — 💎 C1 표현 상세 해설(접기/펴기) 추가 (렌더러 + 프롬프트 둘 다)**
- 배경: 누리가 💎 C1 표현이 안 와닿으면 따로 GPT한테 구문 분해를 물어봄 → 리뷰 안에서 끝내고 싶음
- 구조: 리뷰는 **앱 내 자동 생성** — '리뷰 직접 추가' 모달에서 트랜스크립트 붙여넣기 → Claude(Opus 4.7) 호출 → `var sessionsData={…}` 생성 → Firestore `englishSessions` → `app-1-pages.js` 렌더
- **프롬프트 위치 = `app-1-pages.js`의 `REVIEW_PROMPT_TEMPLATE` (≈20649~20800)** ⚠️(처음에 "레포에 없음"이라 잘못 판단했음 — 실제로 코드 안 in-app 생성 플로우에 있었음)
- 렌더러 확장(sec3): 각 upgrade에 **"표현 뜯어보기" 토글** — `gemMeaningKr`(문장 전체 뜻) + `gemBreakdown`([{chunk, meaning}]) 표시, `toggleGemBreakdown()`. 하위호환(필드 없으면 안 뜸)
- 프롬프트 수정: 품질 요구사항에 gem breakdown 지시문 1줄 + 스키마에 `gemMeaningKr`/`gemBreakdown` 필드 추가 (다의어 'A가 아니라 B' 구분, 복잡하면 첫 항목=문장 구조)
- 검증: `node --check` OK (백틱 템플릿 안 깨짐), 필드 grep 일치
- ⏭ 남은 일: 라이브에서 트랜스크립트로 리뷰 1개 자동 생성 → Upgrades에서 "표현 뜯어보기" 펼쳐 확인 (API 호출이라 누리가 직접)

### 🎯 다음 할 일
- 라이브에서 위젯1 4열 레이아웃 + 카드 통계 시인성 눈으로 확인 (KRW 큰 값일 때 통계 셀 줄바꿈 여부)
- 월별 추이: 라이브에서 전체 기간 한 줄 흐름 + 끝점 할로우 마커 확인 (진행 중 이번 달 dip이 거슬리면 끝점 제외 옵션 고려)
- Annie 리뷰: 새 트랜스크립트로 리뷰 1개 생성해서 "표현 뜯어보기" 동작/품질 확인 (기존 리뷰엔 필드 없어서 안 뜸 — 재생성해야 보임)

### 💭 메모
- the-atelier는 공유 Firebase + 무인증 자동 sync라 **로컬 preview 금지** → GitHub Pages에서 직접 확인

---

## 2026-06-17 (기기: 윈도우 · 회사)

### ✅ 한 일

**사이드잡(포스타입) 일별 매출 차트 — 전월 비교를 '요일 매칭'으로 + 휴일 표시 ⭐⭐**
- 누리 지적: 전월 비교가 같은 '날짜'끼리라 틀림. 매출은 요일(금~일↑, 평일↓)에 좌우되므로 같은 '요일'끼리 비교해야 함. 5월 1일=금, 6월 1일=월이라 어긋남
- 방식: N번째 같은 요일 매칭 (6/1=6월 첫째 월요일 → 5월 첫째 월요일 5/4와 비교). `buildWeekdayPrevMap()` 신규
- 휴일: `KR_HOLIDAY_NAMES` 맵(2025~27 공휴일+대체) 추가. 차트에 주말 배경음영 + 공휴일 세로점선/점, 툴팁에 휴일명·전월 매칭 날짜 표시
- 적용처: renderDailyChart(점선=요일매칭 전월), renderKPIs(전월대비%도 요일매칭 누적), 메타라벨 '전월 같은요일'
- 주의: 파일 42줄에 기존 KR_HOLIDAYS(Set, 영업일계산용)가 있어 이름 KR_HOLIDAY_NAMES로 분리(중복선언 에러 회피)
- Node 단위테스트: 6/1(월)→5/4(월), 6/5(금)→5/1(금) 요일 일치 확인

**Annie 영어 리뷰 프롬프트 + 렌더 대폭 개편 ⭐⭐⭐**
- 누리 요청: ①영어만 나오는 항목에 한국어 설명/뜻 항상 병기 ②Vocab에 유의어·반대어·실생활 흔함도 추가(지금 collocation만) ③Drills 답 숨기고 입력칸+채점버튼+정답토글 인터랙티브화 ④전반적으로 C1/IELTS이되 '실생활 빈도' 최우선 포커스
- 프롬프트(`REVIEW_PROMPT_TEMPLATE`): 품질지침에 "BILINGUAL ALWAYS" + "REAL-LIFE FREQUENCY가 #1 필터" 추가. 빈도 5단계 한글 라벨(매우흔함/흔함/상황별/문어체/드묾). 스키마에 필드 추가 — expressions(exKr,freq), upgrades(okKr,gemKr,freq), grammar(ruleKr), convoSkills followups/reactions/starters를 {en,kr} 객체로, vocabSets.words(syn,ant,freq,exKr), drills(type, items.explainKr)
- 렌더(openSessionDetail): freqBadge() 헬퍼(색상별 빈도칩), 02 예문한글+빈도열, 03 자연/C1 한글+빈도, 04 ruleKr, 05 convo 객체호환(enOf/krOf, 옛 문자열 데이터도 안깨짐), 06 유의어(초록)·반대어(빨강)·빈도칩·예문한글
- 07 Drills 인터랙티브 전면 재작성: 문항별 input + 채점/정답보기 버튼 + 결과영역, '전체 채점하기' + 점수 요약. 전역함수 gradeDrillItem/toggleDrillAnswer/gradeAllDrills 신규. 답 비교는 대소문자·문장부호·공백 무시 관대채점
- node --check 통과. ※기존 리뷰는 새 필드 없어 추가정보 미표시(방어코드로 안깨짐), 새 수업 리뷰부터 완전 적용

**Travel — 숙소 큐레이션 11개 도시 전체 재서치/업데이트 ⭐⭐**
- 누리 요청: 여행 일정(2027 5월 덴마크&스웨덴 / 9~10월 캐나다)은 그대로, 오늘 시점 기준 실제 예약 가능·가격 맞는 숙소로 누리 기준(디자인 부띠크·모던 미니멀·중심가·4★·작가 감성 자산) 재큐레이션
- 11개 도시 병렬 리서치 에이전트(general-purpose, 웹서치) 동시 실행 → 각 도시 2~3개 호텔 + 트립닷컴 hotelId 확보
- `_LODGING_RECS` 30개 호텔 전면 교체, `_TRIP_HOTEL` 매핑 전면 갱신. 날짜(checkIn/checkOut)는 기존 일정 유지
- 주요 교체: 코펜(Manon 빠지고 SP34/25hours/citizenM), 오르후스(SOFS구Guldsmeden/Oasia/Villa Provence), 말뫼(Moxy 폐업 확인→MJ's/Mazetti), 샤를부아(La Ferme가 Le Germain으로 리브랜딩 확인), 알곤퀸(Bartlett/Killarney/Arowhon, 1인 올인클루시브 가격 명시), 토론토(Drake/Anndore/Gladstone) 등
- 한계 명시: 호텔 실시간 요금은 변동 커서 가격은 현실적 범위 추정치, 최종은 트립닷컴 버튼으로 확인 (기존 구조 유지). 알곤퀸 로지는 1인 올인클루시브라 가격 높음을 why에 표기
- node --check 통과

**Travel — "도시 간 이동 큐레이션" 블록 위치 이동**
- 문제: 이동 큐레이션 블록(`journey-transit-recs`)이 "숙소 정보" 섹션 안 헤더 바로 아래에 렌더돼 위치 미스
- 수정: index.html에서 그 div를 "숙소 정보"(trv-lodging)에서 빼서 "도시 간 이동 수단"(trv-transport) 섹션 헤더 아래로 이동
- `_renderTransitRecs()`는 getElementById('journey-transit-recs') ID로만 찾으므로 JS 수정 불필요 — div 위치만 옮기면 그대로 작동

---

## 2026-06-17 (기기: 아이맥)

### ✅ 한 일

**Travel — 트립닷컴 "추천 숙소" 버튼이 0개 결과 뜨던 버그 픽스 ⭐**
- 증상: Travel 큐레이션 카드의 "트립닷컴" 버튼 클릭 시 트립닷컴에서 "숙소 검색 결과 0개" (특히 오르후스·스카겐·말뫼 등 유럽 작은 도시)
- 원인 1: URL에 `cityName=Aarhus` 글자만 넘김 → 트립닷컴이 도시를 못 잡음. 도시 고유번호 `city=<id>`가 필수였음
- 원인 2: 날짜 파라미터가 대문자 `checkIn/checkOut` → 트립닷컴은 소문자 `checkin/checkout`만 인식 → 날짜도 무시되던 중
- 수정: `_TRIP_CITY` 맵 신규 추가 (도시 11곳 → 트립닷컴 cityId). `_tripcomSearchUrl()`이 `city=<id>` + 소문자 `checkin/checkout` + `adult=2` 넘기도록 재작성. 어필리에이트 `allianceid` 유지
- cityId (2026-06 실제 트립닷컴에서 검증): 코펜하겐 260 · 오르후스 3324 · 스카겐 38086 · 말뫼 3747 · 스톡홀름 420 · 몬트리올 759 · 샤를부아(Baie-Saint-Paul) 35546 · 퀘벡시티 3441 · 오타와 760 · 알곤퀸 26623 · 토론토 461
- 검증: 0개였던 Aarhus → 66개 결과 정상 (CABINN Aarhus 등 큐레이션 호텔 포함)

**Travel — "트립닷컴" 버튼을 도시 목록 → 추천 호텔 상세 페이지 직행으로 업그레이드 ⭐⭐**
- 누리 요청: 도시 목록 화면 말고 "내가 추천한 그 호텔" 상세 페이지로 바로 가고 싶음
- `_TRIP_HOTEL` 맵 추가 (추천 호텔 → 트립닷컴 hotelId). `_tripcomSearchUrl()` 재작성:
  1순위 호텔번호 있으면 `{도시}-hotel-detail-{hotelId}/?checkin=...` 직행 → 2순위 도시 목록 → 폴백 글자검색
- URL 슬러그는 hotelId가 실제 해석해서 너그러움 (algonquin→Killarney, baie-saint-paul→La Malbaie 3 Canards 검증됨)
- 호텔번호 확보: 덴마크&스웨덴 13/14, 캐나다 15/18 (총 28곳)
- 미등록 3곳(Moxy Malmö · Hôtel La Ferme · Bartlett Lodge)은 도시 목록으로 자동 폴백
- 검증: Manon Les Suites / Brøndums / Miss Clara / Killarney / Auberge des 3 Canards 등 상세 페이지 + 날짜 정상

**Travel — "도시 간 이동 큐레이션" 블록 신설 (Rome2Rio) ⭐⭐**
- 누리 요청: 도시→도시 어떤 기차/버스 타는지 (GPT는 Rome2Rio로 해줌)
- 일정 화면 상단(호텔 큐레이션 위)에 새 블록. `_TRANSIT_RECS` 데이터 + `_renderTransitRecs()` + `_rome2rioUrl()`
- 각 구간 카드: 출발→도착, 추천 수단·소요시간·대략 가격·한줄설명 + "Rome2Rio 실시간 비교" 버튼 (rome2rio.com/s/{from}/{to})
- 9개 구간 조사: 코펜→오르후스(DSB 2:50), 오르후스→스카겐(환승), 스카겐→말뫼(최장 8h), 말뫼→스톡홀름(SJ 4:25) / 몬트리올→샤를부아→퀘벡→오타와→알곤퀸→토론토
- index.html에 `journey-transit-recs` div 추가, renderJourneyLodging()에서 호출

### 🎯 다음 할 일
- (선택) 카드의 고정 가격이 라이브와 차이 큼 (예: Aarhus 카드 ₩14~18만 vs 실제 ₩19~39만). 라이브 가격 끌어오려면 API 작업 필요 — 추후 검토
- (선택) 미등록 3곳(Moxy Malmö·La Ferme·Bartlett Lodge) 트립닷컴 재등록되면 _TRIP_HOTEL에 추가
- (선택) 교통편: 당일치기 구간(코펜↔헬싱외르↔Humlebæk) + 공항→호텔도 _TRANSIT_RECS에 추가 가능
- (검토) GPT처럼 Rome2Rio 카드를 앱에 직접 렌더하려면 Rome2Rio 유료 API 필요 — 현재는 딥링크 버튼 방식

### 🚧 막힌 점 / 결정 보류
- `_TRIP_CITY`/`_TRIP_HOTEL` 맵에 없는 새 도시·호텔 추가 시 각각 cityId/hotelId를 맵에 한 줄 넣어야 함 (없으면 도시 목록/글자검색으로 폴백)
- Rome2Rio는 앱 내 임베드 = 유료 API. 무료로는 딥링크 버튼이 최선 (GPT는 공식 Rome2Rio 커넥터라 챗에 카드 렌더 가능)

### 💭 메모
- "트립닷컴 유지 + 도시번호 추가" 방식 선택 (어필리에이트 살리려고). 구글호텔/부킹닷컴 교체안도 후보였으나 보류
- cityId는 트립닷컴 SEO URL 패턴 `{도시}-hotels-list-{번호}/`의 끝 숫자에서 확보
- 교통편 가격/시각표는 옛날 값 될 수 있어 인라인은 대략치 + Rome2Rio 버튼으로 라이브 확인 구조

---

## 2026-06-01 (기기: 윈도우 · 회사)

### ✅ 한 일

**1. Money 가계부 등록 안 되던 버그 픽스 ⭐ (2단계)**
- 1차 원인: 입력 행 마지막 셀에 X(취소) 버튼만 있고 저장 버튼이 없었음 → 마우스 사용자는 등록 불가. `ldgInputRowHTML()` 마지막 셀에 ✓ 저장 버튼 추가
- 2차 원인 (Enter도 안 먹던 문제): `ldgSaveInput()`이 필수 항목 누락 시 `ldgFocusField()`만 호출하고 silently return → 사용자는 "Enter 눌렀는데 아무 반응 없음"으로 느낌
- 수정 a: missing 필드를 빨간 inset shadow + 살짝 흔들기 애니메이션(`.ldg-miss` 클래스)으로 시각 강조
- 수정 b: 화면 상단에 빨간 토스트 — "필수 항목을 입력해주세요: 대분류, 결제수단" 식으로 어떤 칸이 빠졌는지 명시
- 수정 c: `_ldgEditingId`가 ghost 값일 때 update 매치 실패하면 그냥 끝나던 부분 → 새 거래로 폴백
- 토스트 헬퍼 `ldgFlashToast()` 신규 추가 (인라인, 별도 lib 없이)
- 3차 원인 (필수 다 채웠는데도 안 됐던 진짜 회귀): 드롭다운 옵션 클릭 시 hidden input (`ldg-in-major/minor/payment`) 동기화가 깨져있었음 → `ldgSaveInput`이 hidden만 읽어서 "비어있다" 판단 → silent fail
- 수정 d: `selectOpt()`에 `data-field` 기반 hidden input 직접 동기화 추가 (onChange 콜백 의존 X)
- 수정 e: `ldgSaveInput`에 `_readDD()` 헬퍼 — hidden 비면 드롭다운 `dataset.value`를 fallback. 어느 경로로 망가져도 등록 가능

**2. Money 월 prev/next 버튼이 안 넘어가던 문제 픽스**
- 원인: `ldgRenderMonthly()`에서 `ldgApplyRecurringForMonth(_ldgYear, _ldgMonth)`가 `safe()` wrap 밖에 있어서, 거기서 throw하면 title/버튼 텍스트 업데이트 이전에 함수 중단됨 → 사용자는 "5월 눌렀는데 그대로 6월"로 봄
- 수정 a: title·prev/next 버튼 텍스트 업데이트를 함수 최상단으로 이동 (어느 단계가 깨져도 헤더는 갱신)
- 수정 b: `ldgApplyRecurringForMonth`도 `safe()`로 감싸기 — 종전 render 전체를 멎게 만들던 단일 실패 지점 제거
- 수정 c: `ldgPrevMonth`/`ldgNextMonth`에 try/catch + 실패 시 토스트 — silent fail 방지

**3. 가계부 등록 끝까지 안 되던 문제 — 등록/렌더 분리 + 에러 가시화 ⭐⭐**
- 격리 프리뷰에서 저장 로직·드롭다운 클릭 경로 모두 정상 작동 확인 → 실제 환경에서 **저장 후 무거운 렌더(차트 등)가 throw하면 ldgSaveInput 전체가 중단돼 표가 안 그려짐** = 사용자는 "등록 안 됨"으로 봄 (실제론 LS엔 저장됐을 수 있음)
- 방어 ①: `_ledgerData.transactions`가 배열 아니면 빈 배열로 복구 (아카이브/싱크 타이밍 방어)
- 방어 ②: `ldgSaveTx()`·`ldgRenderMonthly()`를 각각 try/catch. 무거운 렌더 실패해도 `ldgRenderTxTable()` fallback으로 새 줄은 반드시 표시
- 방어 ③: 성공 시 초록 토스트("거래가 등록되었습니다"), 어느 단계든 throw하면 **에러 메시지를 토스트로 노출** → 다음에 또 안 되면 화면에 원인이 바로 뜸
- `ldgFlashToast(msg, type)` — success(초록)/error(빨강) 지원
- 프리뷰 3케이스 검증: 정상 등록 / 필수 누락 / 렌더 강제 throw 모두 의도대로 동작

**2. 거래 내역 테이블 컬럼 너비 재배분**
- 스크린샷에서 날짜 칸이 좁아 "2026-0"으로 잘려보임 + 세부사항이 과도하게 큼
- `index.html` `<th>` 8개 너비 재조정 (합계 910px 유지):
  - 날짜 90→**130**, 대분류 100→110, 소분류 110→125, 금액 130→150, 결제수단 110→125
  - **세부사항 200→100** (요청대로 1/2), 비고 130 유지, action 40→60 (저장+취소 두 버튼 수용)
- `app-2-init.js`의 데이터 행 `<td>` max-width도 200→100으로 동기화

**4. 가계부 카테고리/결제수단 표준 순서 1회 정렬**
- 누리님 외부 마스터 표(구글시트 등) 기준으로 대분류·소분류·결제수단 순서를 코드에 `LDG_CANON_CATEGORIES`/`LDG_CANON_PAYMENTS`로 박음
- `ldgApplyCanonicalOrder()` — `loadLedgerData()` 완료 시 1회 실행 (settings._canonOrderV1 플래그로 가드). 비파괴: 표준 순서로 맞추되 사용자가 추가했던 항목은 삭제 안 하고 뒤에 보존
- 드롭다운·설정표·결제수단 전부 `_ledgerData.categories`/`settings.paymentMethods` 키 순서를 읽으므로 한 번 정렬로 모든 표시 위치 반영
- 프리뷰 검증: 뒤섞인 데이터+사용자추가항목으로 돌려서 표준순서/비파괴/멱등성 확인

**5. 거래 복제 버그 + 삭제 견고화 (서로 연결된 문제) ⭐**
- 복제(`ldgDuplicateTx`) 근본 버그: 복제본 날짜를 `todayStr`(오늘=6월)로 박아서, 5월 보던 중 복제하면 6월로 가 화면에서 사라짐 → 안 보여서 여러 번 복제 → 중복 거래 쌓임 → 하나 지워도 똑같은 게 남아 "삭제 안 됨"처럼 보임 (두 증상이 같은 뿌리)
- 복제 수정: `dup.date = orig.date` (원본과 같은 날짜로 보던 달에 즉시 표시) + 자동(고정) 연결 끊기(`recurringId` 제거, 비고 비움 → dedup이 복제본 안 지움) + 성공 토스트
- 삭제(`ldgConfirmDelete`) 견고화: recurring skip 로직을 try/catch로 격리(throw해도 삭제 진행), 전체 try/catch로 에러 토스트 노출, 렌더 실패 시 `ldgRenderTxTable` fallback
- 프리뷰 검증: 일반복제 같은달 표시 / 자동복제 dedup생존 / 자동삭제 재생성안됨 모두 통과
- 참고: 삭제 코드 자체는 일반·자동 모두 격리 환경에서 정상 작동했음. 사용자 "삭제 안 됨"은 복제버그로 생긴 중복행 때문일 가능성 큼

**6. 🚨 동기화 사고 + 재발방지 안전장치 2종 (중요)**
- 사고: Claude가 the-atelier를 로컬 프리뷰로 띄워 가계부 버그를 재현하며 합성 테스트 데이터로 `ldgSaveTx()` 호출 → 800ms 자동 sync(`saveLedgerToFirebase`)가 **인증 체크 없이** 클라우드 2026 거래문서를 덮어씀. 사용자가 5/17 이후 추가한 ~20건 유실. 복구는 사용자가 포기(재입력 선택).
- 안전장치 1 (`saveLedgerToFirebase`): 로그인된 ALLOWED_EMAIL 계정이 아니면 Firebase 저장 자체를 차단. 프리뷰/미인증/localhost에서 실데이터 못 덮음.
- 안전장치 2 (`_saveTxShardedToFirebase`): 연도별 저장 시 클라우드 기존 count보다 절반 미만+5건 이상 급감하면 덮어쓰기 거부 + 토스트 경고. `_saveTxShardedToFirebase(true)`로 강제 가능(복구/의도적 대량삭제용).
- node --check 문법검증만 하고 push (프리뷰 재현이 사고 원인이므로 프리뷰 검증 금지 — memory feedback_no_preview_shared_firebase 참조)

**7. 가계부 행 복사→붙여넣기(Ctrl+C/V) 새로고침해야 뜨던 문제 — 진짜 수정**
- 재현 확정(사용자): 행 클릭 → Ctrl+C → Ctrl+V, 붙여넣은 행이 안 뜨고 새로고침하면 "같은 날짜 자리(중간)"에 나타남
- 원인: `ldgRowPaste`가 데이터엔 push했지만 화면 갱신을 무거운 `ldgRenderMonthly`(rAF+setTimeout 비동기 단계로 쪼개짐)에 맡기고, 50ms setTimeout 재선택과 레이스 → 표 재정렬/재그리기가 그 순간 안 됨. 새로고침하면 정렬되어 보임
- 수정: 붙여넣기 직후 `ldgRenderTxTable()`을 **즉시 동기 호출**(새 행 바로 표시), 그 뒤 `ldgRenderMonthly`는 보조로. 재선택은 setTimeout→requestAnimationFrame
- 추가: 붙여넣은 행이 현재 보는 달과 다르면 그 달로 자동 이동. paste 핸들러가 내부 클립보드 없을 때 OS 클립보드 탭구분 텍스트도 파싱(외부 복사 붙여넣기 지원)
- node --check 통과, push (프리뷰 검증 안 함 — sync 사고 방지)

**8. 🚨 내가 넣은 안전장치1이 정상 저장까지 막던 회귀 (긴급 수정)**
- 증상: 거래 추가 → 새로고침하면 사라짐 (localStorage엔 저장됐지만 Firebase 미반영 → 새로고침 시 옛 클라우드 데이터로 덮임)
- 원인: 안전장치1(commit 1de5f2d)이 `ALLOWED_EMAIL`을 참조하는데, 이 변수는 index.html의 `<script>`에서 `var`로만 선언 → 외부 js(app-2-init.js)에서 `typeof === 'undefined'`일 수 있어 `_ok=false` → 정상 로그인 상태에서도 Firebase 저장 차단됨
- 수정: ① index.html에서 `window.ALLOWED_EMAIL` 전역 노출 ② 안전장치1을 느슨하게 — `currentUser`가 "아예 없을 때만" 차단(프리뷰/localhost), 로그인 사용자 있으면 통과. 이메일 비교는 ALLOWED_EMAIL을 읽을 수 있을 때만, 불일치 시 차단. 모호하면 통과(정상 저장 우선)
- 교훈: 데이터 저장 경로에 '차단' 가드 넣을 땐 정상 케이스를 막지 않는지 변수 스코프까지 확인할 것

**9. 🎯 "추가하면 새로고침 시 사라짐"의 진짜 근본 원인 — localStorage QuotaExceededError**
- 사용자 콘솔에서 실제 에러 포착: `QuotaExceededError: Setting 'atelier_ledger_transactions' exceeded the quota` (거래 2940건 → localStorage ~5MB 초과)
- 연쇄: `ldgSaveTx`의 `localStorage.setItem`이 throw → 그 다음 줄 `scheduleLedgerSync()`(Firebase 저장) 실행 못 함 → 메모리엔 들어가 화면엔 잠깐 보이지만 클라우드 미반영 → 새로고침 시 옛 데이터 로드 → 추가분 사라짐. **그동안의 등록/복제/붙여넣기 "사라짐" 증상 다수가 이 뿌리**
- 수정: `ldgSaveTx`에서 archived 모드면 거래 localStorage 통짜 저장 안 함(Firebase 연도별 문서가 본체). legacy 모드만 저장하되 try/catch로 감싸 실패해도 throw 안 함. **localStorage 실패와 무관하게 `scheduleLedgerSync()`는 항상 실행**
- 검증: 데스크탑 로드는 Firebase 우선(loadLedgerData 1268), Firebase 받으면 localStorage 스킵 → 거래 로컬 미저장이어도 새로고침 정상. 로드 경로의 localStorage setItem은 이미 try/catch
- 진단 방법: 사용자 콘솔에서 ldgSaveInput 후킹 + saveLedgerToFirebase 직접 호출로 메모리/클라우드 건수 추적 → 저장경로 정상 확인 후 에러로그로 quota 특정 (추측 0, 실측 100%)

**10. 가계부 카테고리 카드 경고박스 제거, 예산 추천 칩만 유지**
- 사용자 요청: 카드 안 빨강/노랑 경고박스("이미 예산 초과 사용", "고정 지출이라 절감 어려움", "예산 N 상향 적용" 버튼)가 가독성 낮고 실데이터 분석 신뢰 안 감 → 삭제
- `ldgRenderCatGrid`의 AI 액션 박스 블록(약 65줄) 통째 제거. "🤖 추천 N로 변경" 보라색 칩(ldgApplyAIRecommendBudget)은 유지
- 상단 인사이트 배너는 이미 죽은코드(insightEl=null), ldgRenderAnnualGoal(목표 진행도 바)은 경고박스 아니라 유지
- 잔존 헬퍼 ldgSetCatBudgetTo는 호출처 없어졌지만 무해, 남겨둠

**11. 예산 추천 로직 모순 수정 — "절약선" 기반으로 재설계 ⭐**
- 사용자 지적: 세금/보험 예산28.9만인데 "추천 55.2만로 변경"(=늘리기). 지출 줄여야 하는데 늘리라니 모순
- 원인: 옛 `ldgAIRecommendBudget`이 "올해 지출목표를 남은 달에 배분"하는 로직 → 목표 대비 여유 있으면 예산을 늘리라고 함(절약과 정반대)
- 재설계(사용자 합의): 추천 = 과거 같은 달 실제 사용액 중 **최저(절약선)**. 절대 현재보다 늘리지 않음
  - 지출: 현재 예산이 절약선보다 높을 때만 "N로 줄이기(과거 최저)" 추천. 이미 절약선 이하면 안 띄움. 데이터 없으면 null(추측 금지)
  - 수입/저축: 더 모으는 게 목표라 과거 평균 페이스 제시(상향 OK, 예외)
- 신규 `ldgAIHistoryForMonth`(동월 과거 실사용 배열), `ldgAIRecommendForDisplay`(현재예산 반영, 줄이기일 때만 값). 칩 라벨 "💡 N로 줄이기 (과거 최저)" / 수입·저축 "🎯 목표 N로"
- 적용 함수도 display 기준으로 통일(칩 값=적용 값). 프리뷰 5케이스 검증(저장함수 미호출, 계산만): 늘리기 모순 케이스 모두 '추천 안뜸' 확인

**12. Nomad Master 12-Month Voyage 레이아웃 — Europe Loop 위로 끌어올림**
- 사용자 요청: Europe Loop 표가 너무 아래에 있음 → 우측 Total Budget 카드와 같은 높이에서 시작하게
- 원인: 본문 상단의 Hero Metrics(`atl-header`, Total Budget+Schengen 카드)가 `justify-content:flex-end`로 본문 오른쪽에 큰 자리를 차지해 Europe Loop를 아래로 밀어냄
- 수정: 본문의 Hero Metrics 블록 제거 → 우측 aside 최상단(Mileage Strategy 앞)으로 이동. atl-metrics는 min-width 280px라 aside 폭에 그대로 맞음. Europe Loop가 제목 바로 아래로 올라옴
- 순수 레이아웃 변경(데이터/저장 무관), node --check 통과

**13. 전월비 '같은 날짜까지(MTD)' 공정 비교 + 총지출 전월비 추가**
- 사용자 요청: ① 카테고리별 말고 총지출(전체) 전월비도 보고싶음 ② 진행 중인 달은 전월도 '같은 날짜까지'만 비교 (오늘 6/11이면 5/1~5/11 누적과 비교, 6/12면 5/12까지 — 자동)
- 문제: 기존 카테고리 전월비가 전월(5월) '전체'와 이번달(6월 11일까지)을 비교 → 모두 큰 폭 감소로 왜곡
- 신규 헬퍼 `ldgPrevCompareCutDay(prevY,prevM)`: 보는 달이 '현재 진행 중인 달'이면 min(오늘일, 전월말일) 반환, 과거 달이면 0(전월 전체). 2월말 보정 포함
- 카테고리 전월비(`ldgRenderCatGrid`): prevCatTotals에 날짜 컷 적용, 라벨 진행중이면 '전월 동일'로 표시 + 툴팁
- KPI 스트립(`ldgRenderKPI`): 총수입/총지출/총저축 카드에 MTD 전월비 한 줄 추가. 색상규칙=수입·저축 증가 초록 / 지출 감소 초록
- Node 단위테스트 5케이스 통과(6/11→11, 6/12→12, 3/31→2월28, 과거달→0, 연초→작년12월)

**14. 자산 자동계산 — 매핑 테이블 의존 제거, 소분류 이름 일치로 자동 연결**
- 사용자 질문/요청: 저축이 자산(현금자산)에 어떤 규칙으로 들어가나? 파킹통장 저축이 자산에 안 쌓임. "소분류가 저축이면 이름 뭐든 자동계산되게"
- 원인: `ldgComputeAutoValues`가 하드코딩 `_ldgAssetAutoMappings`(적금1→저축.적금 등 옛 이름, 파킹1=null)에 의존 → 표준정렬 후 소분류(파킹통장/주택청약 등)와 불일치해 자동 누적 안 됨
- 수정: 매핑 없으면 자동 키 생성 — 현금자산='저축.{항목소분류}', 부채='저축.{소분류} 상환'(없으면 '저축.{소분류}'도 시도). 즉 **자산 항목 이름=저축 소분류 이름이면 매핑 설정 없이 자동 +누적**. 명시 매핑은 하위호환 유지
- 저축 거래는 가계부에선 −(통장서 이체), 자산에선 +(현금자산 누적) = 설계상 정상
- Node 단위테스트 4케이스 통과(파킹통장 누적/적금 초기값+/부채 상환−/명시매핑 호환)
- 참고: 진단 시 콘솔 '로드됨 false'(자산탭 데이터 미로드)였으나 매핑 불일치는 코드로 확정

**15. Money 머니허브 매트릭스 — 저축이 유동자산에 누적되게 수정 (app-1-pages.js)**
- 사용자 지적: 이 페이지(월별 카드 + 유동/비유동/총자산, app-1-pages.js ~17536)에서 하단 유동자산 총액이 저축해도 안 늘어남
- 원인: 기존 `유동자산 = base.cash + (수입 - 지출)`로 저축을 아예 무시(내부이동 취급). 사용자 모델은 '저축=내 유동자산 늘리는 행위'
- 수정: `유동자산 = base.cash + (수입+이자 + 저축 - 지출 - 출금)`. 출금(파킹→체크, 저축의 역)은 빼서 이중계산 방지
- ※14번(app-2-init 자산탭 매핑)과는 다른 페이지였음. 이게 사용자가 물어본 진짜 페이지
- Node 단위테스트: 저축60 추가 시 805→865 누적 확인, 출금 상쇄 확인
- **15-1 정정**: 위 공식도 틀렸음. 사용자 실제 모델 = "매달 (수입-지출) 남은 돈을 저축으로 넣고, 그 저축한 것만 자산". → 유동자산 = base.cash + (저축 - 출금). 수입/지출은 직접 반영 X(이미 저축에 반영=이중계산 방지). Node 재검증: 저축만 누적·수입지출 무관 확인

### 🎯 다음 할 일
- 사용자가 5월 가계부 재입력 — 이제 quota 에러 없이 클라우드 저장됨
- 우측 행 러닝잔액(itemRunning)은 여전히 체크통장 기준(저축 시 -). 하단 유동자산과 의미 다름 — 혼동되면 추후 통일 검토
- (선택) 예산 추천을 소분류 단위까지 세분화, '왜 이 추천인지' 한 줄 근거 표시
- (선택) 설정 패널에 "강제 동기화" 버튼 — 안전장치2가 정상 대량삭제를 막을 때 사용자가 수동 우회할 UI

### 💭 메모
- 누리님 요청: **앞으로 the-atelier 작업은 로컬 preview/mock 검증 단계 생략하고 바로 push** → GitHub Pages에서 직접 확인. 토큰 절약 차원. 메모리에 `feedback_no_local_preview.md`로 저장함
- 윈도우 머신에 `dev-server.js` (포트 8765, node 정적 서버) 만들어둠 — 평소엔 안 띄움

---

## 2026-05-28 (기기: 윈도우 · 회사)

### ✅ 한 일

**1. 아이맥 작업 (2026-05-27) Windows로 sync**
- `git pull` — 어제 아이맥에서 작업한 15개 커밋 받음
- Travel 페이지 큰 작업: 2027 캐나다 8박 10일 재구성, 덴마크&스웨덴 Finnair 매칭, 트립닷컴 호텔 추천 + Google 폴백, 도시 한·영 병기
- Atlas → Travel 트립 마이그레이션 함수
- 모든 장소 자동 구글맵 / 플랫폼 자동 외부링크
- Annie 회차 삭제 기능 (default 회차 포함)
- 7개 nomad 페이지 헤더 `pageHeader()` 헬퍼로 통일

**2. Annie 수업 트래커 크로스-디바이스 sync 버그 픽스 ⭐**
- 문제: 회차 삭제(deletedDefaults)/상태 변경(statusOverrides)이 localStorage에만 저장돼서 다른 기기에서 안 보임
- 해결: Firestore `englishMeta/state` 문서 신설
  ```
  { deletedDefaults: {...}, statusOverrides: {...}, _updatedAt }
  ```
- `loadEnglishMetaFromFirebase()` — page load 시 FB와 LS를 **union 합집합** (deletedDefaults 모든 디바이스 삭제 합치고, status는 FB 우선), merged 결과를 LS·FB 양쪽에 push
- `saveEnglishMetaToFirebase()` — 변경 시 LS 전체 상태를 FB로 set
- `setEnglishDeletedDefault` / `setEnglishStatus` / `_undeleteEnglishDefault` 모두 LS 업데이트 직후 FB sync
- `loadEnglish()` 시작부에 `await loadEnglishMetaFromFirebase()` 추가

### 🎯 다음 할 일

- **집 가서 아이맥 열기** — 어제 아이맥에서 삭제한 회차들이 iMac LS에만 있음. 아이맥에서 Annie 페이지 열면 자동으로 FB에 union 합쳐서 push됨 → 모든 기기 동기화 완성
- 회사 윈도우에서 오늘 삭제한 회차는 이미 FB에 올라가 있음 (아이맥 LS와 union 됨)

### 🚧 막힌 점 / 결정 보류

- (없음)

### 💭 메모

- **Sync 전략 = Union 합집합**: 삭제는 sticky (한 번 삭제하면 어느 기기에서든 안 보임). undelete는 `_undeleteEnglishDefault('YYYY-MM-DD')` 콘솔에서 수동 가능
- 첫 sync 시 시나리오: 어느 기기든 먼저 새 코드 로드하는 쪽이 자기 LS를 FB에 올림 → 다른 기기 로드 시 union → 모든 deletion 보존
- 캐시 v224, app-1-pages v176

---

## 2026-05-27 (기기: 윈도우 + 아이맥 · 마라톤 디자인 + Travel 작업)

### ✅ 한 일

**Stitch Editorial 디자인 적용 (윈도우, 낮)**
- **12-Month Voyage → Travel Atlas 2028-2029 Clean White Editorial**
  - 3 region (Europe Loop / Down Under / Americas & Return) 분할
  - 수직 라벨 "MASTER ITINERARY"
  - Sticky Mileage Strategy / Family Integration / Voyage Trajectory 사이드바
- **Stay Channels → Comprehensive Nomad Housing Guide**
  - 좌측 사이드바 → 본문 안에 2x2 Strategy 그리드 통합
  - Global Nomad Alternatives 5카드 (Housing Anywhere / Coliving / Anyplace / Sabbatical Homes / Outsite) + 국기 + 사이트 링크
  - 22개 플랫폼 외부링크 자동 처리 (STAY_URL 맵)
  - 누리한테 짚을 거 섹션 제거
- **Nomad Essentials 신규 페이지** (Logistics 그룹에 추가)
  - 13 numbered sections (01 Money ~ 13 Packing & Arrival)
  - 38개 플랫폼 NE_URL 맵 + neLink/neTitleLink/neSplitLink 헬퍼
  - 다크 Nuri Priority 5 카드

**Budget 페이지 대수술**
- 12-City Cost Breakdown 표에 도시별 상세 budget 통합 (펼침 sub-row)
- Stay/Living 컬럼 제거 → 메인 행은 City + Monthly Subtotal만
- 펼침 영역: 숙소 행이 분해 테이블 첫 행으로 통합 (별도 카드 X, "숙소 제외" 제거)
- 도시별 stay 분리 — 17개 도시 + period 분리 (헬싱키 9/10월, 포르투갈 복귀 10/11월) → 합계 ₩4,075만 정확히 맞음
- 통화 자동 prefix (€ $ A$ NZ$ C$ DKK NOK SEK ₩) + ≈ 표기로 환산 (₩만 → 현지 통화)

**폴리시 다회**
- 폰트 사이즈 절반 축소 (hero · section 헤더)
- max-width:1280 적용 (오른쪽 빈공간 제거)
- 도시명 옆 국기 추가 (12 행 모두)
- align-items:flex-start로 메트릭 박스 위로 정렬
- Aviation Strategy 패딩 48 → 28
- height:100% 전역 제거 → Section 11 (Body & Mind) 전용 `ne-grid-equal` 클래스로 동일 높이

**Travel 작업 (아이맥, 밤)**
- 2027 덴마크&스웨덴 + 캐나다 항공편/숙소/Daily Log 전체 재구성
- 트립닷컴 검색 + Google 호텔 검색 폴백
- Atlas → Travel 트립 마이그레이션
- 모든 장소 자동 구글맵 링크

### 🎯 다음 할 일 (이어서)

- Annie sync 버그 (다음 세션에서 해결 — 5-28에 완료됨)

### 💭 메모

- Stitch 디자인 3개 모두 처음에 `#nm-page-content` 셀렉터로 스코프해서 0 스타일 적용됨 → 실제 컨테이너 `#nomad-content`로 일괄 치환 (204건)
- height:100% 전역 적용은 sibling-with-subgrid 케이스에서 sub-grid 만큼 카드 부풀림 → opt-in 클래스로 전환
- 캐시 v205 → v223

---

## 2026-05-26 (기기: 윈도우 · 6차 — 마라톤 후반전)

### ✅ 한 일 (5차에서 이어서)

**1. Travel Journey 좌측 sticky ToC (sub-nav)**
- `js/travel-toc.js` 신규 — page-journey 활성 + Atlas 비활성 시 자동 표시. polling으로 토글
- IntersectionObserver로 스크롤 시 현재 섹션 active 하이라이트 (보라 dot + bold + 살짝 translate)
- 클릭 시 smooth scroll (top -80px offset)
- 8개 섹션에 id 추가: trv-hero / trv-stops / journey-week-view / trv-flights / trv-lodging / trv-transport / trv-rental / trv-souvenir
- **1500px+ 화면에서만 fixed 표시** (메인 사이드바 우측). 그 미만은 숨김 (좁은 화면 컨텐츠 방해 X)
- editorial 톤 — Inter SF 미니 텍스트 + 보라 dot

**2. Daily Log 쇼핑 박스 제거 + Souvenir 3단계 구조 + 시각 분리**
- 일차 카드 안 sourceSouvenirs 박스 제거 (Souvenir 섹션에서 도시별로 묶여 보이니 중복)
- Souvenir: 🇩🇪 GERMANY (국가) → STOP 1 · Frankfurt am Main (도시, 가장 큰 그룹) → • 찐친 (카테고리) → 항목들 — 3단계
- `_souvenirCityRank`: citiesData 순서(여행 일정) 기반 도시 우선순위
- `_groupSouvenirsByCity`: 도시별 sub-group (여행 순서 정렬)
- `_groupSouvenirsByCategory` + 시각 분리 (점선 divider + 보라 dot + count)
- 카테고리 정렬: 찐친 → 후배 → 동료 → 직장 → 가족 → 나 → 집 → 소장 → 디자이너 → 편집 → 음료 → 기타

**3. UI 폴리시 (사용자 피드백 반영 다회)**
- Hero 좌우 높이 맞춤 (lg+ align-items:stretch, 이미지 min-height 380→280)
- Hero 이미지 + Voyage Path 카드 둘 다 **네모 아웃라인** (border-radius 0)
- Daily Log 카드 네모 아웃라인 + **5칸 → 4칸** (WEEK_CHUNK_SIZE 5→4, padding 살짝 키움)
- Stops 아래 "Add City" 카드 제거 (섹션 헤더 우상단 버튼이 대신)
- 숙소 이미지 grayscale 효과 제거 — 항상 컬러로 표시
- Voyage Path 지도 min-height 240→180 (세로 축소)

**4. Stops/Atlas 카드 DATES/STAY 두 줄 강조**
- 라벨(작은 보라 uppercase 800) 위, 값(Manrope 14px 700 진한 색) 아래 — 가독성 강조
- Atlas trip card도 동일 구조

**5. Atlas trip 디테일 잡지 스타일 hero**
- 풀와이드 — atlas section padding 무시 (좌우 끝까지, negative margin)
- 아래로 fade — 페이지 흰 배경으로 자연스럽게 녹아듦 (linear-gradient white)
- 텍스트 블록을 hero 이미지 밖으로 분리 (이미지 아래 -80~-110px 살짝 겹쳐 올라옴)
- 제목 word-break:keep-all + overflow-wrap → **두 줄 자동** (짤림 방지)

**6. Atlas trip 디테일 4 trip 한글화**
- itinerary/lodging/budget/note 모두 한글로 번역
- 영어 지명/명소는 유지 (블루 라군, Ring of Kerry, 셀리알란드포스 등)
- 행동/설명만 한국어
- 섹션 라벨도 한글: "일자별 일정" / "숙소 정보" / "예산" / "휴가" / "Atlas로 돌아가기"

**7. Financial Ledger 개선**
- 검은색 → **연한 보라(#f5f3ff)** atelier 톤
- **하루 예산 + 총액 상단 강조 2-cell 카드** (₩XX 만/day + ₩XX 만/N days)
- 모든 텍스트 진한 보라/슬레이트로 대비 강화

**8. 숙소 카드 stitch 좌측 이미지 복원 + Ctrl+V 업로드**
- lg+ 좌측 320px 고정 이미지 + 우측 본문 (stitch 원본 구조)
- 사용자 결정으로 grayscale 효과는 제거 (항상 컬러)
- `js/journey-lodge-images.js` 신규 — 클릭/Ctrl+V paste + LS + Firestore(`journeyLodgeImages`)

### 📦 신규 파일 (이번 세션)
- `js/travel-toc.js` (좌측 sticky ToC)
- `js/journey-lodge-images.js` (숙소 좌측 이미지 업로드)

### 🚧 막힌 점 / 결정 보류
- **GitHub Pages 장애** — 세션 끝나갈 무렵 `Incident with Actions and Pages` (5/26 10:57 UTC)
  - 우리 모든 push (v183→v184→v185) 정상 (main HEAD에 a7ae952까지)
  - GitHub Actions 빌드 success ✅
  - 그러나 GitHub Pages CDN이 옛 v182를 끈질기게 서빙
  - GitHub raw(main): v185 / GitHub Pages deployed: v182 — **GitHub 측 deploy stuck**
  - 빈 commit, 강제 rebuild trick 다 시도해도 안 풀림
  - GitHub Status 페이지에서 인시던트 확인 — 누리님 측 문제 X
  - 복구되면 자동으로 라이브 반영됨 (별도 작업 X)
  - 다음 세션 시작 시 라이브 v185 응답 확인 — 안 풀려있으면 GitHub Status 재확인

### 💭 메모
- **사용자 피드백 즉시 반영 → 시행착오 정상 패턴**: hero 폰트 3번 줄임, Stops 디자인 Atlas 매거진으로 두 번 바꿈, 숙소 이미지 빼버린 거 사용자 지적으로 복원, 사람 손 가야 하는 디테일은 가끔 다시 가야 함
- **이미지 업로드 모듈 5개 양산**: nomad phase / atlas trip / journey hero / journey city / journey lodge. 거의 동일 코드. 다음에 안정화되면 `js/image-uploader.js` 공통 모듈로 추출 검토
- **GitHub Pages 캐시 함정 두 번**: 5차에서도 한 번 (해결: Clear site data), 6차에서는 GitHub 측 deploy 자체가 stuck — 사용자 어떻게 해도 안 풀림. CDN 응답 vs main raw 비교로 진단 가능 (`curl raw URL` vs `curl pages URL`). 다음에 같은 증상 시 빠르게 진단

---

## 2026-05-26 (기기: 윈도우 · 5차 — 풀데이 마라톤)

### ✅ 한 일 (큰 작업 두 개)

**1. 🌴 Atlas Phase 2 — Trip 디테일 페이지 4개 + 후속 정비**
- `atlas-data.js` 전면 재작성 — 4 trip별 `itinerary`(10~11일) + `lodging`(6~7개) + `budget`(9~11항목) + ptoNote + note 모두 정적 데이터로 추가. Wishlist는 사용자 진짜 데이터 8개(Norway/Caucasus/Dolomites/Normandy/Highway 1/Mallorca/Slovenia/Bavaria)로 교체
- `renderTripDetail(tripId)` — stitch `Master Itinerary Eastern Canada` 디자인: 풀스크린 그라데이션 hero + 국기 + dates + route → day-by-day timeline (dot + line + 활동 + stay icon) → Curated Lodging + Financial Ledger (dark card) + Leave Efficiency + Trip Note
- 라우팅: `atlasOpenTrip(tripId)` → 디테일 뷰. `atlasBackToAtlas()`로 dashboard 복귀
- **연도별 그룹화**: Sequence 타임라인 / Gallery / Ledger를 2027 / 2028로 분리. 연도 라벨 + divider + 연도별 subtotal
- Hero 제목 폰트 축소 (clamp 40-96 → 32-56)
- **trip별 국기 + 영어 나라명** 추가 (DENMARK & SWEDEN / CANADA / IRELAND / ICELAND). Sequence/Gallery/Ledger 3곳에 표시. 도시 hero "PT" 박스 안에 국기 prefix
- **Trip 카드 이미지 업로드** (Atlas dashboard + 디테일 hero) — 노마드 phase 패턴 복제. Ctrl+V paste + LS + Firestore `atlasTripImages/{tripId}`

**2. 🗺️ Travel Journey 페이지 stitch 디자인 전체 리디자인 (P1~P5 + 폴리시 + 숙소 이미지)**
- 디자인 출처: `D:\다운뤄드\stitch_travel` (DESIGN.md + code.html). 사용자 결정: 단계별 천천히, 전체 7섹션 stitch로
- **P1 — CSS 토큰 시스템** (`#page-journey` scope, `.j-*` 컴포넌트 prefix): editorial-card / time-row / status-tag / tag-pill / accent-dot + line / day-badge / highlight-box. `--j-font-h`, `--j-primary`(#7c3aed) 등 CSS 변수
- **P2 — Hero + Stops + Voyage Path**: eyebrow CURRENT VOYAGE + 큰 Manrope 제목 + edit/delete j-icon-btn + 우측 큰 보라 dates (Sep 25 — Oct 04 형식) + DAYS j-status-tag. 풀와이드 hero 이미지(그라데이션 fallback) + 업로드 (`journey-hero.js` 신규, `tripCoverImages` Firestore). Stops 그리드(4-col). Voyage Path 카드 (지도 + 보라 pill 배지 항공/버스/기차/렌트카 카운트)
- **P3 — Daily Log**: 5-col chunk 가로 그리드 → 세로 stack (각 일차가 큰 editorial card). 원형 번호 (현재일 보라 / 외 muted) + 도시명 h3 + 날짜·요일 메타 (한글요일+영문요일) + 당일치기 표시 + N일차 j-status-soft. 시간 슬롯 j-slot (timeline rail + accent-dot, 예약/고정/쇼핑 색 분기). 인라인 편집/추가 폼 그대로 보존
- **P4 — 항공편/교통/렌트카/숙소 카드 재디자인**: 공통 j-trip-card editorial. 항공편 j-flight-card (ICN→14H ✈→FRA + PNR/탑승객/좌석 tag-pill). 교통/렌트카 j-inter-card (보라 헤더 + 본문 + Date/Time/픽업/드롭 메타 + 칩). 숙소 j-lodge-card (도시+타입+결제상태 라벨 + h3 + 주소·전화 + 우측 큰 보라 가격 + Check-in/out/Cancellation/Type 4-col 메타 + memo 칩)
- **P5 — Souvenir Checklist**: 도시 → 25+ 국가 자동 추론(`_souvenirCountry`). 그룹 헤더 큰 국기 + 영어 국가명 + 한국어 sub + items count. 2-col @ lg+. 둥근 체크박스 + 카테고리 라벨(보라 italic) + 품목 + 가격(보라 Manrope). 인라인 더블클릭 편집 모두 보존
- **사용자 피드백 폴리시 (1차)**: Hero 제목 추가 축소(clamp 24-40) + Hero 본문 2-col(좌 이미지 4:3 + 우 Voyage Path 지도, 별도 Voyage Path 섹션 삭제). Stops 카드를 Atlas trip card 매거진 스타일로(aspect 3:4 + 보라 코드 박스 1ST STOP + h3 + DATES/STAY + ★ STOP + edit/delete). **무료 이미지 자동연동(loadCityPhotos) 제거** — 사용자 업로드만(`journey-city-images.js` 신규, `journeyCityImages` Firestore, Ctrl+V paste). Daily Log 데스크탑(lg+) 다시 5-col 가로 그리드 복원, 카드/번호/슬롯 모두 컴팩트화. 모바일은 stack 유지
- **사용자 피드백 폴리시 (2차) — 숙소 좌측 이미지 복원**: stitch처럼 lg+ 좌측 320px 그레이스케일 이미지 + 우측 본문. 호버 시 grayscale → 컬러 전환 (filter 0.5s ease). 빈 상태는 그라데이션 + hotel 아이콘. **이미지 업로드** (`journey-lodge-images.js` 신규, `journeyLodgeImages` Firestore, Ctrl+V paste)
- 모든 데이터 ID/바인딩 보존: trip dropdown, 4탭바, AI 추천 / 예약 스캔 / API 키, 미니 요약, 도시 관리 패널, 트립 노트, 인라인 편집/추가 폼, 시드 마이그레이션, 보험·옵션 토글, lodging 취소 토글, 결제상태 분기 모두 그대로

### 📦 신규 파일 (5개)
- `js/atlas-data.js` (Phase 1에서 신규, Phase 2에서 전면 재작성)
- `js/atlas-pages.js` (Phase 1에서 신규, Phase 2 디테일 추가)
- `js/journey-hero.js` (P2)
- `js/journey-city-images.js` (폴리시 1차)
- `js/journey-lodge-images.js` (폴리시 2차)

### 🎯 다음 할 일
- **Travel 예산 / 체크리스트 페이지도 stitch 톤 적용 검토** — 일정 탭만 stitch, 다른 탭들은 기존 디자인이라 톤 충돌
- **인라인 편집 폼을 stitch 톤으로** — 일정 카드 안 인라인 편집/추가 폼이 옛 디자인. P3에서 보존만 하고 디자인 통일은 안 함
- **항공편 추가 모달 등 모든 모달**도 stitch 톤으로 통일 검토
- **Daily Log 5-col에서 일차 카드가 좁아짐** — 긴 도시명/일정 텍스트 줄바꿈 많아질 수 있음. 사용자 사용해보고 chunk size를 4 또는 6으로 조정 검토
- Trip별 데이터 desc 필드 입력 UI — 현재 트립 모달에 desc 필드 없음. Hero summary에 표시되니까 입력 가능하게 추가 검토
- Daily Log 이미지(일차별) 추가 검토 — 일차별로도 사진 한 장씩 가능하면 voyage 기록으로 좋을 듯

### 🚧 막힌 점 / 결정 보류
- **컨텍스트 큰 작업 분할 패턴이 효과적**이었음 — Atlas Phase 1/2, Journey P1~P5 단계로 나눠서 각 세션마다 push. 사용자가 라이브에서 확인하고 다음 단계 결정. "천천히 P1부터" 신호가 정확히 효과적
- **이미지 업로드 패턴 4개 모듈 양산** — 노마드 phase / atlas trip / journey hero / journey city / journey lodge. 거의 동일 코드 (LS + Firestore + Ctrl+V paste + 리사이즈). DRY 관점에선 공통 모듈 추출이 좋지만 컨텍스트/위험 부담으로 복제 선택. 나중에 안정되면 `js/image-uploader.js` 같은 공통 모듈로 추출 검토

### 💭 메모
- **사용자 의도 변경 즉시 반영 패턴 검증**: "다 stitch로" → 적용 → "내용 다 들어가야해" 확인 → "stitch에 이미지 있었는데 왜 뺐어" 피드백 → 즉시 복원. 의도 = stitch 디자인 100% 유지하되 atelier 기존 데이터/기능 100% 보존. 둘 사이 절충 없음
- **Hero 폰트 두 번 줄임**: P2(clamp 40-96 → 32-56) → 폴리시 1차(32-56 → 24-40). 디자이너 시각에서 hero 큰 글자 충분히 작아질 때까지 반복 조정
- **stitch 디자인의 핵심 = editorial(매거진) 톤**. 1px outline + 보라 액센트 + Manrope display + 충분한 여백. atelier의 기존 indigo+rounded-2xl+shadow와는 다른 어조 — Travel만 톤이 다르지만 stitch 명시 선택이라 OK
- **여러 시도 후 안정화**: 폰트 사이즈 / 그리드 col 수 / 카드 패딩 미세조정 3~4번 반복. 사용자 라이브 확인 후 피드백 받아서 즉시 조정하는 사이클이 효과적
- **GitHub Pages 캐시 함정**: v178 → v179 push 했는데 사용자가 "안 뜨는데?" 라이브 확인 결과 정상 배포. 서비스워커가 끈질겨서 Ctrl+Shift+R로도 안 풀림. DevTools "Clear site data"가 정답. 다음에 큰 캐시 변경 후엔 안내 미리 하기

---

## 2026-05-26 (기기: 윈도우 · 4차)

### ✅ 한 일
- **🗺️ Travel · Atlas 탭 Phase 1** — 미래 여행 계획 dashboard. Travel 페이지 안에 4번째 탭 'Atlas' 추가. stitch `Travel Atlas 2027-2028 Vibrant Color` 디자인 그대로
  - **레이아웃**: hero (Atlas & Almanac + 5 stats: Year Range / Total Volume / Duration / Countries / PTO Days) → horizontal timeline (4 trip sequence) → trip gallery 4 cards → Financial Ledger + PTO Efficiency Tracker (offset 카드, 2-col) → Wishlist 6 cells (Patagonia / Kyoto / Alps / Tuscany / Socotra / Lofoten)
  - **데이터**: `travel_atlas_2027_2028.html`에서 추출한 4 trip 정적 데이터 — Scandinavian Spring(5/27, 9N·11D, ₩539만), Maple Road(10/27, 9N·11D, ₩333만 자비), Wild Atlantic Way(5/28, 9N·10D, ₩566만), Ring Road(10/28, 9N·11D, ₩690만). 총 4 trip · 43일 · 12 PTO · ₩2,375만 gross
  - **trip 이미지**: 우선 그라데이션 fallback (각 trip별 색조). Phase 2에서 사용자 업로드 패턴(노마드 phase 이미지처럼) 추가 예정
  - **탭바 통합**: journey/finance/packing 3개 페이지의 탭바 모두에 '🗺️ Atlas' 4번째 버튼 추가. `switchTravelTab('atlas')`에서 `navigate('journey')` + `page-content-wrap` hide + atlas section show
  - **신규 파일**: `js/atlas-data.js` (4 trip + Wishlist + totals 헬퍼), `js/atlas-pages.js` (renderAtlas + showAtlasView/hideAtlasView)
  - **CSS**: `#travel-atlas-section` scoped 437줄 (stitch 컬러 #630ed4 primary / #7C3AED accent, Manrope+Inter 폰트 체계, card-offset PTO 박스, 반응형 4-col gallery)
  - **트립 카드 클릭**: 현재는 toast 안내만, Phase 2에서 trip별 디테일 페이지 (stitch Master Itinerary Eastern Canada 디자인) 연결 예정
  - 캐시 service-worker v=168 → v=169

### 🎯 다음 할 일 — Phase 2
- **Trip 디테일 페이지 4개** — stitch `Master Itinerary Eastern Canada` 디자인을 4 trip 모두에 동일 적용 (대용량 작업)
  - hero (풀스크린 그라데이션 + 국기 + 라벨 + dates)
  - day-by-day itinerary 타임라인 (도트 + 라인 + 날짜 + 활동 + stay)
  - sidebar: Curated Lodging 카드 + Financial Ledger (검은 카드) + PTO Details + Trip Note
  - 데이터 출처: `travel_atlas_2027_2028.html`에 모두 들어있음 (호텔별 가격·박수, 예산 10+ 항목, PTO 상세)
- **라우팅**: `atlasOpenTrip(tripId)` → 디테일 페이지 표시. Back to Dashboard 버튼
- **이미지 업로드**: 노마드 Phase 이미지와 같은 패턴 — Firestore `travelAtlasImages/<tripId>` + LS + paste 핸들러
- **Wishlist 항목 추가/편집** UI 검토

### 🚧 막힌 점 / 결정 보류
- **탭바 3 곳 동기화 부담** — journey/finance/packing 각 페이지에 같은 탭바가 따로 있어서, Atlas 같은 새 탭 추가하려면 3 곳 모두 수정. 추후 탭바를 공통 컴포넌트로 추출하면 좋을 듯
- **`page-content-wrap` 토글 방식**의 부작용 가능성 — atlas 탭에서 다른 탭으로 갈 때 `display: ''`로 복구하는데, journey 페이지 외 finance/packing에선 page-content-wrap이 다른 구조라 OK이지만 미래에 atelier 페이지 변경 시 검증 필요

### 💭 메모
- **stitch Tailwind 디자인을 vanilla CSS로 옮긴 패턴** — Tailwind config 그대로는 못 가져오니까 stitch의 디자인 토큰(색·폰트·간격)을 `#travel-atlas-section` scoped CSS variable로 빼서 적용. nomad의 `--nm-font-h` 패턴과 비슷
- **`atlas-data.js`를 별도 파일로 분리한 이유** — 4 trip 데이터가 정적이지만 양이 많아서 (~140줄). atlas-pages.js와 분리해서 수정 시 데이터/렌더 logic 충돌 없게. 사용자가 trip 데이터만 만지고 싶을 때 명확
- **Phase 1/2 분리한 이유** — Phase 1 dashboard만으로도 ~440줄 CSS + ~150줄 JS + HTML 변경. Phase 2는 4 trip × 디테일 데이터(10일+ 일정 각각) → 한 세션에 다 끝내면 컨텍스트 부족. 분리해서 안전하게

---

## 2026-05-26 (기기: 윈도우 · 3차)

### ✅ 한 일
- **사이드바 City Guides 17개 라벨 통일** — 한글 "6월 · 포르투" 형식을 `🇵🇹 PORTO`처럼 **국기 + 영어 도시명**으로. 다른 사이드바 항목(Overview/Nomad Gate/Backward Plan 등)이 모두 영어인데 City Guides만 한글이라 톤 깨졌던 것
  - 매핑: PORTO·DUBLIN·GALWAY·COPENHAGEN·BERGEN·STOCKHOLM·HELSINKI·REYKJAVIK·PORTO II·VALLETTA·HOBART·ADELAIDE·MELBOURNE·QUEENSTOWN·SAN DIEGO·NEW YORK·HALIFAX
  - "10-11월 · 포르투갈 복귀" → `🇵🇹 PORTO II` (재방문 표시), "3월 · 뉴질랜드" → `🇳🇿 QUEENSTOWN` (도시 단위 통일)
- **IP · Webnovel 사이드바 라벨 원복** — 직전 세션에서 "소설"로 바꿨던 거 다시 `IP · Webnovel`로. 다른 사이드바 항목들이 다 영어라 한 항목만 한글이면 어색. 페이지 본문도 같이 원복 (Postype Webnovel / Main Track · Webnovel / Webnovel Queue / 메인 (웹소) / 메이저 웹소 플랫폼 / IP·웹소 수익)
- **City Guide 본문 한글 섹션 제목 → 영어 통일**
  - hero stats 5개: 체류 기간/날씨/비자/모드/분위기 → **DURATION / WEATHER / VISA / MODE / VIBE**
  - "누리한테 의미하는 것" → **Why This City**
  - "랜드마크 · 꼭 가볼 곳" → **Landmarks · Must See**
  - "슬로우 · 숨겨진 명소" → **Hidden Gems · Slow**
  - "1달 생활비 예산 · 최소 가이드" → **Monthly Budget · Minimal Guide**
- **건드리지 않은 곳** (이미 영어+한글 페어 디자인이라 의도된 듯): "Experiences · 경험" / "Nomad Mode · 노마드 모드" / "Next Step Focus · 핵심" / "Neighborhood Ratings · 거주 적합성"
- **파일 변경**: `js/nomad-data.js` (City Guides 17 라벨), `js/nomad-pages.js` (페이지 본문 + City Guide 섹션 제목), `index.html` (캐시 v=167 → v=168), `service-worker.js` (atelier-v167 → v168)

### 💭 메모
- **3번 왔다갔다한 결과** — 1) "포스타입 웹소" 어색하다 → "소설"로 통일, 2) 사이드바 한 항목만 한글이라 어색 → "IP · Webnovel" 원복, 3) City Guides 사이드바도 한글이라 어색 → 국기+영어. 디자이너 시각에서 **사이드바는 한글/영어 혼용이 가장 어색**한 위치 — 한 번에 통일성 결정해야
- **국기 이모지 fallback**이 var 시스템 덕분에 사이드바에서 정상 작동 — `--nm-font-h: 'Manrope', 'Noto Color Emoji', ...` 폰트 체인이 글로벌하게 깔려있어서 `🇵🇹 PORTO` 같은 텍스트도 자연스럽게 표시

---

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
