# IELTS 자동 채점 (Writing · Speaking)

무료. 누리 Claude 구독(`claude -p`)으로 채점한다. API 비용 없음.

## 흐름
1. 사이트가 `IELTS_GRADE.request({...})` → Firestore `ieltsGrading` 에 `status:'pending'` 문서
2. 맥북 launchd `com.nuri.ielts-grade` 가 **5분마다** `run.sh` → `grade.py`
3. 크롬에 **이미 열린** 아뜰리에 탭(로그인 상태)으로 pending 을 읽고 → `grading` 표시
4. `claude -p` 로 채점(`prompt.md`), JSON 검사 · 틀리면 한 번 더 · exit 1 이면 `~/.claude-work` 로 재시도
5. `result` + `status:'done'` (실패면 `error`) 저장 → 사이트는 `watch()` 로 바로 갱신

한 건에 약 40초. 20분 넘게 `grading` 에 멈춘 건 다시 채점. 한 번에 최대 4건.

## 지켜야 할 것
- 맥북 크롬에 **아뜰리에 탭 하나는 열어 둘 것** (탭을 새로 열지 않음 — 없으면 조용히 넘어감)
- 크롬 › 보기 › 개발자 › **Apple Events의 JavaScript 허용** 켜 두기 (가계부 자동화와 같음)

## 명령
- 지금 한 번: `launchctl kickstart gui/$(id -u)/com.nuri.ielts-grade`
- 상태: `launchctl print gui/$(id -u)/com.nuri.ielts-grade`
- 끄기: `launchctl bootout gui/$(id -u)/com.nuri.ielts-grade`
- 로그: `~/Library/Logs/ielts-grade.log` (아무 일 없으면 아무것도 안 씀)
- 모델 바꾸기: plist 에 `IG_MODEL` 환경변수 (비우면 구독 기본 모델)

## 파일
- `run.sh` 겹침 방지 잠금 + 실행 · `grade.py` 크롬 연결·채점·검증 · `prompt.md` 채점 지시문
- 화면 모듈: `js/ielts-grade.js` (`window.IELTS_GRADE` — request · list · watch · renderResult · renderStatus)
