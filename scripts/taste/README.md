# Taste 수집기 (아이맥)

누리 취향에 맞는 공간(카페·복합문화공간·도서관·책방)과 숙소(북스테이·독채)를 SNS에서 찾아 Firestore `tasteItems` 에 카드로 넣는다. 화면은 taste.html 이 읽는다.

## 언제
- 아이맥 launchd `com.nuri.atelier-taste` — **월·목 07:30**
- 한 번에 새 카드 10개쯤, 10~15분

## 무엇을 하나
1. Aside 브라우저(아이맥, 로그인 돼 있음)로 X 검색(최근 7일·인기순) · Threads 검색 · Instagram 키워드 검색 · 스테이폴리오 목록을 읽는다. 읽기만 한다.
2. 좋아요 많은 글은 원문(이어지는 칸·인용·답글)까지 읽어 장소 이름을 찾는다.
3. `claude -p`(개인 구독)가 취향 프로필 + 누리가 저장/별로 한 카드를 보고 골라 준다. 이름이 글이나 사진 글자에 없으면 버린다(추측 금지).
4. 원글 사진 중 진짜 장소 사진 한 장을 480px JPEG(80KB 아래)로 줄여 넣는다. 없으면 사진 없이.
5. 이미 있는 카드(같은 이름·같은 글 주소)는 건너뛴다. 새 문서만 쓰고 `status`·`statusAt` 은 절대 안 건드린다.
6. 실행 기록 한 줄을 `tasteRuns/<날짜>` 에 남긴다(소스별 후보 수·쓴 개수·걸린 분).

## 파일
- `collect.js` — 본체
- `aside-taste.js` — Aside 안에서 도는 읽기 코드 (collect.js 가 불러 씀)
- `com.nuri.atelier-taste.plist` — launchd 설정

## 취향 프로필
`~/.config/atelier-taste/profile.md` (아이맥, chmod 600). **저장소에 올리지 않는다**(공개 저장소). 로그에도 안 찍는다. 고치면 다음 실행부터 바로 반영.

## 손으로 돌리기 (아이맥)
ssh 로는 claude 로그인(키체인)이 안 보여서 launchd 로 돌린다.
```
launchctl kickstart gui/$(id -u)/com.nuri.atelier-taste
tail -f ~/Library/Logs/atelier-taste.log
```
아이맥 화면 앞에서 터미널로는 `node scripts/taste/collect.js --dry --limit 5` (--dry 는 Firestore 에 안 씀).

## 설치 (아이맥, 처음 한 번)
```
cp ~/the-atelier/scripts/taste/com.nuri.atelier-taste.plist ~/Library/LaunchAgents/
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.nuri.atelier-taste.plist
```

## 막힐 때
- 로그: `~/Library/Logs/atelier-taste.log`
- Instagram 후보 0 → 아이맥 Aside 에서 인스타 로그인이 풀렸는지 확인 (`tasteRuns` 에 skipped 로 남음)
- 검색어는 collect.js 맨 위 `X_QUERIES`·`TH_QUERIES`·`IG_QUERIES` — 회차마다 몇 개씩 돌려 쓴다
