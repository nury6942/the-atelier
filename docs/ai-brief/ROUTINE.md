# AI Brief — 매일 07:00 루틴 지시서

클라우드 루틴이 매일 아침 이 파일을 읽고 그대로 따른다. 고치고 싶으면 이 파일만 고치면 된다.
화면은 `ai-brief.html`, 데이터는 `data/ai-brief/`.

## 누구를 위한 것

누리 — F&F MLB 디자이너(저지 팬츠·쇼츠·집업), 바이브코딩으로 자기 도구를 만들고(Atelier, VectorCraft, Craft 앱), 모든 걸 자동화하고 싶어 한다. 해외 이직 준비 중.
**원하는 것:** 업계 뉴스가 아니라 "사람들이 AI로 진짜 뭘 하는지". 모델 발표는 출발점이고, 주인공은 그걸로 만든 것.
**싫어하는 것:** 글만 줄줄이, 논문체, 억지로 엮은 적용법.
**제일 보고 싶은 것 (2026-10-15 누리):** 새 업데이트·런치가 나오면 사람들이 엄청 써보고 "해봤더니 이렇더라"를 올린다. **그 실사용**을 보고 싶다. 그리고 그중 **나한테 바로 적용할 수 있는 것**.
  → release 카드마다 ① `new` 뭐가 진짜 새로 됐나(이전 버전 대비) ② `examples` 만든 것 ③ `reviews` 써본 사람들 한 줄평(좋았다/별로였다 둘 다) ④ `forMe` 바로 써보기 — 넷을 채우는 게 목표.
**가산점:** 개인이 바이브코딩으로 만든 창작 도구 — 포토샵·라이트룸·일러 대체 앱(Light Studio, Photon Studio 류), 디자이너용 무료 킷. 누리가 직접 "Photocraft 같은 것"을 콕 집어 원했다. 하루 cards 에 이런 게 하나는 들어가게 찾아본다(없는 날은 억지로 넣지 않는다).

## 하루 구성 (5분)

| 칸 | 개수 | 내용 |
|---|---|---|
| `cards` | 5 | 핵심. 0번이 큰 판(가장 시각적·놀라운 것) |
| `tryToday` | 1~2 | 15~30분 안에 바로 해볼 것, 3단계 |
| `pickup` | 6~10 | 주워 담기: 무료로 풀린 것, 막 나온 발표(지켜보는 중), 가볍게 볼 것 |

카테고리 `cat`: `release`(발표가 만든 것) · `vibe`(바이브코딩 작품) · `money`(수익화) · `hack`(기발한 활용) · `tool`(새 도구) · `free`(무료로 풀린 것, pickup 전용).
cards 5개는 한 카테고리가 3개를 넘지 않게 섞는다.

## 순서

1. `data/ai-brief/index.json` 과 최근 7일 JSON 을 읽는다 → 이미 다룬 url 은 다시 쓰지 않는다. 어제 JSON 의 `watching` 목록을 이어받는다.
2. 지난 24~72시간을 훑는다 (WebSearch 여러 번, 같은 턴에 병렬로):
   - 발표: Anthropic·OpenAI·Google·Meta·xAI·Mistral·DeepSeek·Qwen, Midjourney·Runway·Kling·ElevenLabs·Suno 등 체인지로그/블로그
   - 사람들이 만든 것: X·Threads 화제 글, Reddit(r/ClaudeAI r/ChatGPT r/vibecoding r/SideProject r/LocalLLaMA r/StableDiffusion r/indiehackers), HN Show HN, Product Hunt, Indie Hackers, YouTube
   - 무료: GitHub trending, 디자인 시스템·React/Tailwind 킷·아이콘·폰트·Figma 킷, 무료 크레딧
   - 뉴스레터: Ben's Bites, The Rundown, TLDR AI, Latent Space 등은 화제 확인용
3. **실사용 후기 모으기:** release 카드 후보마다 "써봤다" 글을 찾는다 — X·Threads 반응, Reddit 댓글, HN 댓글, YouTube 리뷰, 블로그 실험. 공식 홍보문·보도자료는 후기가 아니다. 좋았다/별로였다를 섞어 3~4개, 각 글로 바로 가는 링크를 단다. 실망·한계 후기도 꼭 넣는다(과장 걸러내기).
4. **지켜보는 중 처리:** `watching` 의 각 발표에 대해 "사람들이 만든 사례"를 다시 찾는다. 사례가 2개 이상 생기면 `release` 카드로 올리고 watching 에서 뺀다. 발표 후 7일이 지나도 없으면 조용히 뺀다. 오늘 새로 나온 발표는 pickup 에 `"watching":true` 로 올리고 `watching` 에 추가.
5. 이미지: 각 url 에서 `og:image`/`twitter:image` 를 실제로 뽑는다
   `curl -sL --max-time 10 -A "Mozilla/5.0" URL | grep -io '<meta[^>]*\(og\|twitter\):image[^>]*>' | head -1`
   찾은 것만 쓴다. 없으면 `null` (화면이 카테고리 색 블록으로 대신한다). **남의 캡처를 리포에 저장하지 않는다** — 원본 주소만 건다.
6. 모든 url 은 `curl -sI` 로 살아 있는지 확인. 숫자(매출·사용자 수)는 출처에 있는 것만. 지어내지 않는다. 불확실하면 뺀다.
7. JSON 을 쓰고 `index.json` 의 `dates` 에 오늘을 넣고, 커밋·푸시.

## 글 쓰는 법

- `title` 한국어 26자 이내, 결과가 보이게. "○○ 출시" 말고 "영상 모델로 룩북 한 편을 10분 만에".
- `how` 36자 이내: 어떻게 했나 / 무슨 도구로.
- `why`(release 만) 30자 이내: 이 발표 덕에 새로 가능해진 지점.
- `chips` 숫자만 짧게. 달러면 원화 병기: `월 $3k · 약 410만 원` (환율은 그날 대략값).
- `new` 최대 3개, 각 10자 이내 태그: 이전 버전 대비 진짜 새로 된 것만(공식 출처로 확인). 예 `4K 출력`, `영상 2배 길이`.
- `reviews` 각 `say` 34자 이내로 풀어 쓴 요약(긴 인용 금지), `who`(X @handle / r/서브 / HN / 채널명), `url`(그 글 바로가기), `tone`(`good`|`bad`). 사람·글을 지어내지 않는다.
- `forMe` 는 **진짜 걸릴 때만** — 누리의 MLB 캐드·프린트·저지, Atelier, VectorCraft, 자동화, 이직 포트폴리오. 없으면 필드를 빼라.
- 기술 용어는 풀어서. 이모지 쓰지 않는다.

## tryToday

- 비개발 디자이너가 맥에서 15~30분에 끝낼 수 있는 것. **가능하면 그날 가장 새로운 발표·업데이트를 직접 써보는 것**으로(남들 후기만 보지 말고 본인도 바로 해보게). 아니면 그날 카드나 pickup 하나에 기반.
- `steps` 정확히 3개, 각 `text` 18자 이내. 단계에 `url`(열기 버튼) 또는 `copy`(붙여넣을 프롬프트 전문) 하나.
- 결과물이 남는 것(이미지 한 장, 작은 자동화 하나, 저장한 킷)을 고른다.

## 스키마 — `data/ai-brief/YYYY-MM-DD.json`

```json
{
  "date": "2026-10-15",
  "generatedAt": "2026-10-15T07:04:00+09:00",
  "sourcesNote": "X · Reddit · HN · Product Hunt · GitHub 등 41곳 훑음",
  "cards": [
    {
      "cat": "release",
      "title": "…", "url": "…", "image": "… or null", "source": "X @handle",
      "release": {"name": "…", "date": "2026-10-12", "url": "…"},
      "examples": [{"title": "…", "url": "…", "image": "… or null"}],
      "new": ["4K 출력", "4:1 배너"],
      "reviews": [{"say": "옷 디테일이 안 무너짐", "who": "X @handle", "url": "…", "tone": "good"},
                  {"say": "한글 글자는 여전히 깨짐", "who": "r/StableDiffusion", "url": "…", "tone": "bad"}],
      "why": "…", "chips": ["…"], "forMe": "(선택)"
    },
    {"cat": "money", "title": "…", "url": "…", "image": null, "source": "…", "how": "…", "chips": ["월 $3k · 약 410만 원"]}
  ],
  "tryToday": [
    {"title": "…", "minutes": 15, "basedOn": "url", "steps": [
      {"text": "사이트 열기", "url": "…"},
      {"text": "프롬프트 붙여넣기", "copy": "…"},
      {"text": "결과 저장"}
    ]}
  ],
  "pickup": [{"cat": "free", "title": "18자 이내", "url": "…", "image": "…", "source": "…", "watching": false}],
  "watching": [{"name": "…", "url": "…", "date": "2026-10-14"}]
}
```

`data/ai-brief/index.json`: `{"dates": ["2026-10-15", …]}` — 최신이 앞.

## 커밋

- 메시지: `brief: 2026-10-15 AI Brief`
- `main` 에 바로 푸시. 다른 파일은 건드리지 않는다(이 루틴은 `data/ai-brief/` 만 쓴다).
- 푸시가 거절되면 `git pull --rebase` 후 다시.
- 실패하면 커밋하지 않는다. 화면이 알아서 "오늘 갱신이 아직 안 됐어요"를 띄운다.
