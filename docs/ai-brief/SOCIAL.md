# AI Brief — X · Threads 수집기 (맥에서 매일 06:20)

맥의 Claude 앱 예약 작업이 이 파일을 따른다. 누리의 크롬(로그인된 상태)을 Claude in Chrome 으로 써서
Threads·X 에서 AI 실사용·꿀팁 글을 모아 `data/ai-brief/social/YYYY-MM-DD.json` 으로 커밋한다.
화면(`ai-brief.html`)의 "X · Threads" 칸이 이 파일을 그대로 보여주고, 07:00 클라우드 루틴도 이걸 재료로 쓴다.

**왜:** 누리 — "X, Threads 가 진짜 많다. 실사용자·꿀팁이 넘쳐나는데 놓치고 싶지 않다."
웹 검색으로는 X·Threads 개별 글이 거의 안 잡혀서, 로그인된 브라우저로 직접 읽는다.

## 지킬 것

- **읽기만 한다.** 좋아요·팔로우·답글·저장 등 어떤 버튼도 누르지 않는다. 로그인 화면이 뜨면 그 플랫폼은 건너뛰고 JSON 의 `skipped` 에 적는다(로그인 시도 금지).
- 글은 **요약만** 싣는다(한국어 60자 이내). 원문을 길게 옮기지 않는다. 링크로 원문에 보낸다.
- 작업용 탭은 새로 열고 끝나면 닫는다. 누리의 다른 탭은 건드리지 않는다.
- 커밋은 `data/ai-brief/social/` 만.

## 순서

1. `cd ~/the-atelier && git pull --rebase` (여러 기기에서 작업함). `tabs_context_mcp(createIfEmpty)` → 새 탭. 오늘 날짜 = `TZ=Asia/Seoul date +%F`. 이미 오늘 파일이 있으면 끝.
2. 화면별로 게시물을 모은다. `scripts/ai-brief/extract-posts.js` 와 같은 방식(아래 요령)으로 `javascript_tool` 안에서 스크롤하며 쌓는다.
   **Threads 홈(추천) 피드가 제일 좋다** (2026-10-15 실측: 스크롤 20번에 99개 중 AI 글 13개+, 검색보다 훨씬 신선함)
   - `https://www.threads.com/` → 3.5초 대기 → 20번 × (모으기 → 2500px 스크롤 → 1.4초) — 모은 건 페이지 전역 변수(`acc`)에 url 키로 쌓기
   - `https://www.threads.com/following` 같은 방식 10번
   - 검색은 보조: `/search?q=<검색어>&serp_type=default` (인기 — 대부분 1주 넘은 글이라 7일 컷), `&filter=recent` (최근 — 스팸 많음, 키워드 필터 필수)
     검색어 2~3개만 돌아가며: `AI 꿀팁` · `클로드` · `바이브코딩` · `나노바나나` · `제미나이` · `AI 자동화` · 그날 새 모델 이름
   **X** — 로그인돼 있을 때만(로그인 화면으로 튕기면 건너뜀): `https://x.com/home` 팔로잉 탭, `https://x.com/search?q=<검색어> min_faves:200&f=top`
   **X 1순위 — 비공개 리스트 "AI Brief"** `https://x.com/i/lists/2110638450106061286` (누리가 승인한 22계정: 한국 실사용·해외 꿀팁·만드는 사람·무료 UI·공식 발표).
     리스트 화면을 `computer scroll`(10칸) 6~8번 하며 모은다 — 백그라운드 탭은 JS 스크롤로는 새 글이 안 그려진다(실제 입력 이벤트가 필요).
     최근 48시간 + 좋아요 30↑. 계정을 더하고 뺄 땐 누리 승인 후 리스트 편집(공개로 바꾸지 않는다).
   **X 실측(2026-10-15)** — 누리 X 계정의 For you 는 아직 AI 취향이 아니라(인테리어·연예) 홈 피드는 쓸모없다. **검색이 본진**:
     `"Claude Code" min_faves:300 since:<3일 전>` · `"vibe coding" min_faves:300 …` · `"nano banana" min_faves:300 …` ·
     `(바이브코딩 OR 클로드 OR 제미나이 OR 챗GPT) min_faves:50 …` · 그날 새 모델 이름 — 모두 `&f=top`.
     X 는 로딩이 느리다: 이동 → `computer wait 5초` → `window.scrollBy(0,3000)` 한 번 → `wait 2초` → 모으기. 결과는 `sessionStorage.__acc` 에 쌓아 페이지를 옮겨도 유지.
     의견·논쟁 글(“바이브코딩 그만 불러라”, “AI 싫어하는 사람 많다”)은 좋아요가 많아도 뺀다 — 실사용·꿀팁·만든 것 위주.
   **요령**
   - 작업 탭은 백그라운드라 페이지 안 `setTimeout` 이 1분 단위로 늘어진다(숨은 탭 함정) → 스크롤 루프를 JS 안에서 길게 돌리지 말고, 기다림은 `computer wait` 로 밖에서. 한 번의 javascript_tool 은 45초 넘으면 죽는다.
   - AI 글 판별 정규식(영문 `ai` 는 단어 경계 — "daily" 같은 오탐 방지):
     `/((?:^|[^a-z])ai(?:[^a-z]|$)|claude|클로드|gpt|gemini|제미나이|나노바나나|nano ?banana|바이브|vibe ?cod|cursor|커서|코덱스|codex|에이전트|agent|자동화|프롬프트|prompt|미드저니|midjourney|llm|n8n|mcp|오픈ai|openai|앤트로픽|anthropic|sora|veo|kling|runway|힉스필드|higgsfield)/i`
   - 본문 줄에서 `AI 콘텐츠`·`번역하기` 줄은 빼고 판별(이 라벨 때문에 그림 글이 AI 글로 잡힘).
   - 도구 결과는 약 1,500자에서 잘린다 → 결과를 `window.__f` 에 담고 5~6개씩 나눠서 꺼낸다. 본문은 95자까지만.
3. 거르기
   - 홈·팔로잉: 최근 72시간 + 좋아요 15↑. 검색(인기): 7일 + 좋아요 30↑. 검색(최근): 72시간 + 좋아요 5↑.
   - 광고·강의 판매·"댓글 달면 자료 드림" 미끼글·행사 공지는 뺀다. **같은 사람 글은 하루 2개까지**(홈 피드는 팔로우 중인 계정 하나가 도배하기 쉬움).
4. 고르기: 12~16개. 우선순위 ① 써본 후기·실사용 결과("해봤더니") ② 바로 따라 할 꿀팁 ③ 만든 것 자랑 ④ 새 기능 소식.
   Threads 와 X 를 섞되 한쪽이 없으면 있는 쪽만.
5. **고른 글마다 원문을 끝까지 읽는다** (2026-10-15 누리: "헤드라인만 보면 뭔 소린지 모르겠다, 원문을 가져와라").
   - X: `curl -s "https://cdn.syndication.twimg.com/tweet-result?id=<글번호>&token=a"` 로 본문(`text`)·인용글(`quoted_tweet.text`)·링크 카드 제목. 긴 글(`note_tweet`)은 잘리므로 글 페이지를 열어 `[data-testid="tweetText"]` 전체를 읽는다. 같은 작성자의 이어지는 답글(스레드)도 읽는다.
   - Threads: 글 페이지를 열어 `[data-pressable-container]` 첫 번째(본문)와 같은 작성자의 이어지는 칸들(1/11 같은 연재)을 읽는다.
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
8. 탭 닫기.

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
