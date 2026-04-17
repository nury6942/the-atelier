# Claude Code 작업 지침 — The Atelier

## 데이터 안전 규칙

### 절대 금지
- Firebase 컬렉션 rename, field rename 작업 시 **반드시 전체 JSON 백업 먼저 다운로드**
- 대량 delete 작업은 **사용자 2회 확인 후에만** 진행
- `fbRead`, `fbAdd`, `fbUpdate`, `fbDelete` 함수 시그니처 변경 금지
- 스키마(SCHEMAS 객체) 변경 시 **기존 데이터 호환성** 반드시 확인

### 스키마 변경 시 체크리스트
1. 기존 Firestore 문서에 새 필드가 없을 수 있으므로 `|| ''` 방어 코드 필수
2. 필드 추가는 OK, 필드 삭제/이름 변경은 마이그레이션 코드 작성 필수
3. row 인덱스(배열 기반 스키마)가 바뀌면 **모든 참조 지점** 동시 업데이트

### localStorage 데이터
- `atelier_series_YYYY`: 시리즈 월간 데이터 (Annual Matrix)
- `atelier_lodging`: 숙소 시드 데이터
- `atelier_souvenir`: 기념품 시드 데이터
- 이 데이터들은 브라우저별/기기별이므로 Firebase 백업 병행 필수

## 백업 시스템
- `fbRead` 호출 시 자동으로 `atelier_snapshot_{collection}`에 스냅샷 저장
- `fbDelete` 호출 시 자동으로 `atelier_trash`에 삭제 전 데이터 보관
- 설정 > 데이터 관리에서 수동 전체 백업/복원 가능

## 데이터 복구 방법
1. 설정 패널 열기 → "전체 백업" 클릭 → JSON 다운로드
2. 문제 발생 시 → "복원" 클릭 → 백업 JSON 업로드
3. localStorage 복구: 브라우저 콘솔에서 `localStorage.getItem('atelier_snapshot_income')` 등으로 확인
