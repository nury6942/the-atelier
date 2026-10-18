# Read 탭 콘텐츠 만들기

매일 긴 글 읽기용 기사 2개(+학습팩)와 읽을거리 링크를 모은다.

## 실행

```bash
cd ~/the-atelier
node scripts/read/fetch.mjs                  # 오늘(한국 날짜) 몫 2개
node scripts/read/fetch.mjs --date 2026-10-18 --count 3
node scripts/read/fetch.mjs --no-pack        # 학습팩 없이 본문만 (빠름)
```

- 한 번 돌리는 데 약 1분 40초. 거의 다 학습팩(claude -p, 글마다 약 95초, 동시에 돌림) 시간이다.
- 여러 번 돌려도 안전하다. 그 날짜 몫이 이미 차 있으면 새 글을 안 고르고, 이미 실린 주소도 다시 안 고른다.
- `--no-pack` 으로 만든 글은 다음에 그냥 돌리면 학습팩이 채워진다.
- 학습팩은 내 구독의 `claude -p` 로 만든다. 실패(exit 1)하면 `CLAUDE_CONFIG_DIR=~/.claude-work` 로 한 번 더 해 본다.
  JSON 이 틀리면 틀린 곳을 알려 주고 한 번 다시 시킨다.
- BoF 는 직접 요청이 막혀서(Cloudflare 403) Aside 브라우저로 첫 화면 제목만 읽는다. Aside 가 없으면 BoF 만 빠진다.

## 파일 위치

- `data/read/index.json`: 목록 (items = 기사, 최신순 전부 보관 / links = 링크, 최신 30개)
- `data/read/<id>.json`: 기사 한 편 (본문 문단 `paras` + 학습팩 `gloss` `vocab` `quiz` `para` `summary` `gist`)

## 저작권 규칙 (꼭 지킬 것)

- **The Conversation 만 본문 전체를 싣는다.** CC BY-ND 4.0 이라 *고치지 않고*, 글쓴이·출처·원문 링크를 붙이는 조건으로 허용된다.
  그래서 문장은 한 글자도 손대지 않는다 (사진·광고·"Read more" 상자·이해관계 고지문만 뺌). 원문에 있는 오타도 그대로 둔다.
- **BBC Future · Guardian Long Read · BoF 는 링크만.** 제목·주소·날짜만 저장하고 본문이나 요약문은 절대 옮기지 않는다.
- 학습팩의 예문(`ex`)과 요약(`summary`)은 기사 문장을 베끼지 않고 새로 쓴 것이다.
