# Taste 수집기 (아이맥)

누리 취향에 맞는 공간·숙소와 문화생활(전시·공연·영화)을 찾아 Firestore `tasteItems` 에 카드로 넣는다. 화면은 taste.html 이 읽는다.

## 언제
- 아이맥 launchd `com.nuri.atelier-taste` — **월·목 07:30**, `run.sh` 가 차례로 돌린다
  1. `collect.js` 공간 ~10 · 숙소 ~5 (약 14분)
  2. `culture.js` 전시 ~5 · 공연 ~4 · 영화 ~4 (국내 약 15분) + 해외 여행 도시(아직 안 훑은 도시가 있을 때만, 약 13분)
  3. (`library.js` 책·여행 도시 — 코드만 있음, 아직 시험 안 해서 run.sh 에 안 넣음)
- 소스 순서: **유명 인스타 큐레이터 + 티켓 사이트가 먼저**, 키워드 검색은 그다음

## 공간·숙소 (collect.js)
- Aside 로 X 검색(최근 7일·인기순) · Threads 검색 · Instagram 키워드 검색 · **인스타 큐레이터 계정 최신 글**(목록은 collect.js 맨 위, 회차마다 8개씩 돌아가며, 이미 본 글은 `~/.cache/atelier-taste/seen.json` 으로 건너뜀) · 스테이폴리오 목록
- X·Threads 는 **작성자 타래(본인 답글)** 까지 읽는다. 장소 이름은 대개 첫 글이 아니라 바로 아래 답글(📍 이름·주소)에 있다
- `claude -p`(개인 구독)가 프로필 「1. 공간·숙소」 + 누리가 저장/별로 한 카드를 보고 고른다. 이름이 글이나 사진 글자에 없으면 버린다(추측 금지)
- `--url <글 주소>` 로 특정 글을 꼭 넣을 수 있다

## 문화생활 (culture.js)
- 국내: **티켓 사이트 랭킹(NOL 티켓 장르별 · 멜론티켓 · 예스24 티켓)**이 주 소스(포스터·장소·기간, 가격은 상품 페이지에서 확인. 티켓링크는 상품 링크가 스크립트라 못 읽음) · 인스타 전시/내한/영화 큐레이터 · 네이버 검색 목록(서울 전시회·내한공연·김재중/김준수/JX·현재상영·개봉예정) · 미술관 현재 전시 페이지 · X/Threads 영화 추천 · 인스타 전시 큐레이터
  - 고른 뒤 상세 페이지를 다시 읽어 **기간·가격·장소**를 확인, 하나라도 없으면 뺀다. 공연은 **서울만**. JX·김재중·김준수 관련은 날짜가 맞으면 늘 넣는다
  - meta: venue · start · end · price · country · city · region(서울은 종로·서촌·북촌 / 용산·한남·이태원 / 강남·청담·서초 / 성수·성동 / 마포·홍대·연남 / 송파·잠실 / 여의도·영등포 / 서울 그 외) · ticketUrl
- 해외: 아뜰리에 `trips`·`trip_cities` 에서 1년 안 여행 도시와 날짜를 읽고, 도시마다 유명 미술관(그 기간 전시, 발표 전이면 미술관 자체 `meta.permanent`)과 공연장 공연을 공식 페이지에서 확인. `meta.trip` 에 여행 이름·날짜. 카드가 없는 도시가 있거나 매달 첫 월요일에만, 한 번에 5도시씩
- 영화: 네이버 영화 칸에서 감독·국가·러닝타임 확인, 일본 작품 제외

## 책·여행 도시 (library.js)
- 인스타 책 추천 · 여행지 추천 큐레이터 최신 글 → 프로필 「2. 독서」「3. 여행」으로 거름. 책 표지는 예스24·네이버, 도시는 위키백과·원글 사진

## 큐레이터 목록 (2026-11-07 Aside 로 프로필 열어 팔로워 확인, 5만 이상)
- 공간·카페·숙소: collect.js `CURATORS` (20개, 회차마다 8개씩)
- 전시·내한·영화: culture.js `CULTURE_CURATORS`
- 책·여행: library.js `BOOK_CURATORS` · `TRAVEL_CURATORS`

## 사진 (모든 카드 필수)
- 진짜 사진만(글자 캡처 X), 가로 480px JPEG 80KB 아래
- 순서: 원글 사진 → 같은 글의 다른 사진(캐러셀·타래) → 상세 페이지 포스터(og:image) → 이름으로 인스타 검색 첫 게시물 · 네이버 플레이스/포스터 → 위키백과 대표 사진
- 후보는 `claude -p` 가 Read 로 열어 보고 그 항목이 맞는 것만 고른다. **끝내 못 찾으면 그 카드는 쓰지 않는다**
- `backfill.js`: 사진 없는 기존 카드(책 표지는 예스24, 도시는 위키백과·인스타 포함)에 image 칸만 채운다

## 지키는 것
- 새 문서만 쓴다(merge). `status`·`statusAt` 은 절대 안 건드린다(화면이 씀)
- 취향 프로필 `~/.config/atelier-taste/profile.md` (아이맥, chmod 600) — **저장소·로그에 안 남긴다**. 고치면 다음 실행부터 반영
- 실행 기록: `tasteRuns/<날짜>` (places·culture 소스별 후보 수, 쓴 개수, 사진 없어 뺀 수, 걸린 분)

## 손으로 돌리기 (아이맥)
ssh 로는 claude 로그인(키체인)이 안 보여서 launchd 로 돌린다.
```
launchctl kickstart gui/$(id -u)/com.nuri.atelier-taste
tail -f ~/Library/Logs/atelier-taste.log
```
아이맥 화면 앞 터미널에서는: `node scripts/taste/collect.js --dry --limit 5` · `node scripts/taste/culture.js --dry --abroad` · `node scripts/taste/backfill.js`

## 설치 (아이맥, 처음 한 번)
```
cp ~/the-atelier/scripts/taste/com.nuri.atelier-taste.plist ~/Library/LaunchAgents/
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.nuri.atelier-taste.plist
```

## 막힐 때
- 로그: `~/Library/Logs/atelier-taste.log`
- Instagram 후보 0 → 아이맥 Aside 의 인스타 로그인 확인 (`tasteRuns` 에 skipped)
- 검색어·큐레이터·미술관 주소는 collect.js / culture.js 맨 위 목록
