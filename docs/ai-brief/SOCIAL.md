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
   **요령**
   - AI 글 판별 정규식(영문 `ai` 는 단어 경계 — "daily" 같은 오탐 방지):
     `/((?:^|[^a-z])ai(?:[^a-z]|$)|claude|클로드|gpt|gemini|제미나이|나노바나나|nano ?banana|바이브|vibe ?cod|cursor|커서|코덱스|codex|에이전트|agent|자동화|프롬프트|prompt|미드저니|midjourney|llm|n8n|mcp|오픈ai|openai|앤트로픽|anthropic|sora|veo|kling|runway|힉스필드|higgsfield)/i`
   - 본문 줄에서 `AI 콘텐츠`·`번역하기` 줄은 빼고 판별(이 라벨 때문에 그림 글이 AI 글로 잡힘).
   - 도구 결과는 약 1,500자에서 잘린다 → 결과를 `window.__f` 에 담고 5~6개씩 나눠서 꺼낸다. 본문은 95자까지만.
3. 거르기
   - 홈·팔로잉: 최근 72시간 + 좋아요 15↑. 검색(인기): 7일 + 좋아요 30↑. 검색(최근): 72시간 + 좋아요 5↑.
   - 광고·강의 판매·"댓글 달면 자료 드림" 미끼글·행사 공지는 뺀다. **같은 사람 글은 하루 2개까지**(홈 피드는 팔로우 중인 계정 하나가 도배하기 쉬움).
4. 고르기: 12~16개. 우선순위 ① 써본 후기·실사용 결과("해봤더니") ② 바로 따라 할 꿀팁 ③ 만든 것 자랑 ④ 새 기능 소식.
   Threads 와 X 를 섞되 한쪽이 없으면 있는 쪽만.
5. 각 글: `summary` 한국어 60자 이내(무엇을 했고 결과가 어땠나), `tag` 하나 — `후기` | `꿀팁` | `만든 것` | `소식`.
6. JSON 을 쓰고 문법 검사(`python3 -c 'import json,sys;json.load(open(sys.argv[1]))' 파일`), `data/ai-brief/social/` 만 add → `social: <오늘> X·Threads` 커밋 → main 푸시(거절되면 `git pull --rebase` 후 재시도).
7. 탭 닫기.

## 스키마 — `data/ai-brief/social/YYYY-MM-DD.json`

```json
{
  "date": "2026-10-15",
  "collectedAt": "2026-10-15T06:31:00+09:00",
  "skipped": ["x: 로그인 안 됨"],
  "posts": [
    {"src": "threads", "author": "@handle", "url": "https://www.threads.com/@handle/post/…",
     "at": "2026-10-15T05:44:51Z", "likes": 204, "replies": 15,
     "image": null, "media": true, "tag": "후기", "summary": "…"}
  ]
}
```

이미지: Threads 는 싣지 않는다(주소에 서명 토큰이 붙고 며칠 뒤 만료, 도구가 그런 주소를 걸러냄) — `image:null`, `media:true` 면 화면이 "사진·영상 있음" 표시. X 는 `pbs.twimg.com` 주소에서 `?` 뒤를 뗀 것만.
