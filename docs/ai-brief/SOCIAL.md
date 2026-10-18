# AI Brief — X · Threads 수집기 (맥에서 매일 06:20)

**아이맥** Claude 앱 예약 작업이 이 파일을 따른다. 아이맥의 **Aside 브라우저**(X·Threads 로그인 돼 있음)를 `aside` 명령으로 써서
Threads·X 에서 AI 실사용·꿀팁 글을 모아 `data/ai-brief/social/YYYY-MM-DD.json` 으로 커밋한다.
화면(`ai-brief.html`)의 "X · Threads" 칸이 이 파일을 그대로 보여주고, 07:00 클라우드 루틴도 이걸 재료로 쓴다.

**왜:** 누리 — "X, Threads 가 진짜 많다. 실사용자·꿀팁이 넘쳐나는데 놓치고 싶지 않다."
웹 검색으로는 X·Threads 개별 글이 거의 안 잡혀서, 로그인된 브라우저로 직접 읽는다.

## 지킬 것

- **읽기만 한다.** 좋아요·팔로우·답글·저장 등 어떤 버튼도 누르지 않는다. 로그인 화면이 뜨면 그 플랫폼은 건너뛰고 JSON 의 `skipped` 에 적는다(로그인 시도 금지).
- 글은 **요약만** 싣는다(한국어 60자 이내). 원문을 길게 옮기지 않는다. 링크로 원문에 보낸다.
- Aside 탭은 스크립트가 새로 열고 스스로 닫는다. 누리의 다른 탭은 건드리지 않는다.
- 커밋은 `data/ai-brief/social/` 만.

## 브라우저 = Aside (2026-10-18 전환)

아이맥 크롬은 X·Threads 가 자주 로그아웃돼서(10/17·18 X 0개) **Aside 브라우저**로 바꿨다. Aside 는 둘 다 로그인돼 있고, 명령 한 줄로 화면을 읽는다.
- 명령: `~/.local/bin/aside repl "<자바스크립트>"` — 한 번에 120초까지. 그래서 화면 하나씩 따로 부른다.
- 후보 모으기: `aside repl "const SRC='<소스>'; $(cat scripts/ai-brief/aside-collect.js)"` → 출력 마지막 줄 `AIBRIEF_JSON [...]`
  소스: `x-list`(1순위, 비공개 리스트 22계정) · `threads-home`(추천 피드, 제일 신선) · `threads-following` · `x-search:<검색어>` · `threads-search:<검색어>`
  (10/18 실측: x-list 45개 · threads-home 80개, 대부분 48시간 안)
- 원문 끝까지 읽기: `aside repl "const URL='<글 주소>'; $(cat scripts/ai-brief/aside-read.js)"` → `AIBRIEF_TEXT {author, parts:[…]}` (Threads 연재 1/n·X 긴 글·같은 작성자 스레드까지)
- Aside 가 안 열리거나 로그인 화면이면 그 플랫폼은 `skipped` 에 "로그인" 이라는 말을 넣어 적는다 → 화면 맨 위에 알림이 뜬다.
- 크롬(Claude in Chrome)은 쓰지 않는다.

## 순서

1. `cd ~/the-atelier && git pull --rebase`. 오늘 날짜 = `TZ=Asia/Seoul date +%F`. 이미 오늘 파일이 있으면 끝.
2. 후보 모으기 — 위 명령으로 `x-list` → `threads-home` → `threads-following` → 그날 새 모델·화제 검색어 1~2개(`x-search:`, `threads-search:`). 결과를 모두 합치고 url 로 중복 제거.
   - AI 글 판별 정규식(영문 `ai` 는 단어 경계 — "daily" 오탐 방지):
     `/((?:^|[^a-z])ai(?:[^a-z]|$)|claude|클로드|gpt|gemini|제미나이|나노바나나|nano ?banana|바이브|vibe ?cod|cursor|커서|코덱스|codex|에이전트|agent|자동화|프롬프트|prompt|미드저니|midjourney|llm|n8n|mcp|오픈ai|openai|앤트로픽|anthropic|sora|veo|kling|runway|힉스필드|higgsfield)/i`
   - 의견·논쟁 글(“바이브코딩 그만 불러라” 류)은 좋아요가 많아도 뺀다 — 실사용·꿀팁·만든 것 위주.
3. 거르기
   - 홈·팔로잉: 최근 72시간 + 좋아요 15↑. 검색(인기): 7일 + 좋아요 30↑. 검색(최근): 72시간 + 좋아요 5↑.
   - 광고·강의 판매·"댓글 달면 자료 드림" 미끼글·행사 공지는 뺀다. **같은 사람 글은 하루 2개까지**(홈 피드는 팔로우 중인 계정 하나가 도배하기 쉬움).
4. 고르기: 12~16개. 우선순위 ① 써본 후기·실사용 결과("해봤더니") ② 바로 따라 할 꿀팁 ③ 만든 것 자랑 ④ 새 기능 소식.
   Threads 와 X 를 섞되 한쪽이 없으면 있는 쪽만.
5. **고른 글마다 원문을 끝까지 읽는다** (2026-10-15 누리: "헤드라인만 보면 뭔 소린지 모르겠다, 원문을 가져와라").
   - X: `curl -s "https://cdn.syndication.twimg.com/tweet-result?id=<글번호>&token=a"` 로 본문(`text`)·인용글(`quoted_tweet.text`)·링크 카드 제목·사진(`mediaDetails`). 긴 글(`note_tweet`)이나 스레드면 aside-read.js 로 전체를 읽는다.
   - Threads·X 긴 글: `scripts/ai-brief/aside-read.js` 로 연다(위 '브라우저' 참고).
   - 링크가 핵심이면(튜토리얼·아티클) 그 페이지도 읽는다(t.co 는 `curl -sI` 로 location 확인).
   - 반어·농담 글(예: "PDF 뷰어도 바이브코딩했다" 식 풍자)은 실사용이 아니니 뺀다.
6. 각 글에 쓴다:
   - `summary` 한국어 40자 안팎 — 제목 역할. 결과가 보이게.
   - `points` **3~5줄** — 원문에 실제로 있는 내용을 내 말로: 구체적 방법·순서·명령어·숫자·결과. "~을 공개" 같은 뜬 말 금지. 이미지에만 있는 내용이면 "이미지에 커리큘럼" 처럼 원문에서 보라고 적는다.
   - `try` (선택) 누리가 오늘 바로 해볼 한 줄 — 진짜 걸릴 때만.
   - `tag` 하나 — `후기` | `꿀팁` | `만든 것` | `소식`.
   - X 글은 `media_items` 도 채운다(누리: "글자만 있다, 이미지·GIF 는?"): syndication 결과의 `mediaDetails`(없으면 `quoted_tweet.mediaDetails`)에서 최대 4개 `{type, img: media_url_https, mp4?}` — `animated_gif`·`video` 는 `video_info.variants` 중 mp4 를 비트레이트 낮은 쪽에서 두 번째. 링크 카드뿐이면 `{type:"card", img: 카드 이미지}`. 화면은 `<meta name="referrer" content="no-referrer">` 라서 video.twimg.com 이 막히지 않는다(출처를 보내면 403).
   - Threads 는 사진 주소를 싣지 않는다 — 화면이 카드 위에 원문 미리보기 창(…/embed/)을 띄워 사진·글을 원래 모습으로 보여준다.
   화면이 "원문 보기"로 X·Threads 공식 임베드를 띄우므로 원문 전문을 JSON 에 옮기지 않는다(요약·정리만).
7. `python3 scripts/ai-brief/fill-images.py <오늘>` 로 X 글의 빈 `media_items` 와 브리핑 빈 사진을 채운 뒤, JSON 을 쓰고 문법 검사(`python3 -c 'import json,sys;json.load(open(sys.argv[1]))' 파일`), `data/ai-brief/social/` 만 add → `social: <오늘> X·Threads` 커밋 → main 푸시(거절되면 `git pull --rebase` 후 재시도).
8. (Aside 탭은 스크립트가 스스로 닫는다.)

## 스키마 — `data/ai-brief/social/YYYY-MM-DD.json`

```json
{
  "date": "2026-10-15",
  "collectedAt": "2026-10-15T06:31:00+09:00",
  "skipped": ["x: 로그인 안 됨"],
  "posts": [
    {"src": "threads", "author": "@handle", "url": "https://www.threads.com/@handle/post/…",
     "at": "2026-10-15T05:44:51Z", "likes": 204, "replies": 15,
     "image": null, "media": true, "tag": "후기", "summary": "…",
     "points": ["구체적 방법·숫자", "…", "…"], "try": "(선택)",
     "media_items": [{"type": "video", "img": "https://pbs.twimg.com/…jpg", "mp4": "https://video.twimg.com/…mp4"}]}
  ]
}
```

이미지: Threads 는 싣지 않는다(주소에 서명 토큰이 붙고 며칠 뒤 만료, 도구가 그런 주소를 걸러냄) — `image:null`, `media:true` 면 화면이 "사진·영상 있음" 표시. X 는 `pbs.twimg.com` 주소에서 `?` 뒤를 뗀 것만.
