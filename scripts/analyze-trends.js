#!/usr/bin/env node
/**
 * scrape-postype.js의 결과를 Claude로 분석해서 트렌드 리포트 생성
 *
 * 입력: stdin으로 JSON (scraper의 출력)
 * 출력: stdout으로 분석 추가된 JSON (원본 + analysis 필드)
 *
 * 환경 변수:
 *   ANTHROPIC_API_KEY  (필수)
 *   CLAUDE_MODEL       기본 "claude-haiku-4-5"
 */

const Anthropic = require('@anthropic-ai/sdk');

function log(...args) { console.error('[analyze]', ...args); }

async function readStdin() {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => data += chunk);
    process.stdin.on('end', () => resolve(data));
    process.stdin.on('error', reject);
  });
}

function buildPrompt(raw) {
  const { date, query, sidebar, posts, stats } = raw;
  // 분석에 보낼 데이터 (시놉시스 + 본문 일부 포함 — Claude가 패턴 직접 추출)
  const compact = {
    date, query,
    relatedKeywords: sidebar.relatedKeywords,
    recommendedTags: sidebar.recommendedTags,
    stats,
    posts: posts.filter(p => !p.error).map(p => ({
      title: p.title,
      author: p.author,
      tags: p.tags,
      description: (p.description || '').substring(0, 600),
      // 본문 일부도 보냄 — Claude가 조회수/좋아요/회차 등 추출 시도
      bodyTextSample: (p.bodyTextSample || '').substring(0, 800),
      isAdult: p.isAdult,
      isPaid: p.isPaid,
    })),
  };

  return `당신은 한국 웹소설/2차창작 시장 분석 전문가입니다.
포스타입(postype.com)에서 키워드 "${query}"로 ${date} 기준 수집한 ${compact.posts.length}개 작품 데이터를 분석해주세요.

목표: 작가가 글을 쓸 때 참고할 실질적이고 구체적인 인사이트 도출. 일반론·뻔한 말 금지. 데이터에서 직접 관찰되는 패턴만.

각 작품의 bodyTextSample은 페이지 본문의 일부 텍스트로, "조회 N", "좋아요 N" 같은 메타데이터가 섞여있을 수 있음. 신뢰할 수 있는 숫자만 추출.

[수집 데이터]
${JSON.stringify(compact, null, 2)}

[출력 형식 — 반드시 아래 구조의 JSON으로만 응답. 다른 텍스트 0]
{
  "summary": "1~2문장 요약 — 현재 이 시장의 큰 그림",
  "titlePatterns": [
    { "pattern": "패턴 이름", "examples": ["실제 제목1", "실제 제목2"], "count": 숫자 }
  ],
  "synopsisHooks": [
    { "hook": "훅 종류 (예: 신분 차이, 회귀, 권태기, 짝사랑)", "frequency": "X/N개 작품", "note": "구체적 관찰" }
  ],
  "tagDistribution": [
    { "tag": "#태그명", "count": 숫자, "note": "" }
  ],
  "popularPairings": [
    { "pairing": "그룹/멤버 (예: NCT 도영, 엔하이픈 선우)", "evidence": "관련 작품 제목/태그 인용" }
  ],
  "monetization": {
    "paidRatio": "X%",
    "freeRatio": "X%",
    "note": "유료 vs 무료의 패턴 (예: 유료작은 본격 BL, 무료는 짧은 단편 등)"
  },
  "characterArchetypes": [
    { "archetype": "캐릭터 유형 (예: 츤데레 남주, 독립적 여주)", "examples": "데이터에서 본 예시" }
  ],
  "topAuthors": [
    { "author": "작가 ID (URL 기준)", "works": 숫자, "note": "특징" }
  ],
  "actionableInsights": [
    "구체적이고 실행 가능한 글쓰기 조언 1 (시리즈명/제목/예시 인용 필수)",
    "조언 2 — 데이터에서 본 구체적 패턴 기반",
    "조언 3"
  ],
  "warnings": [
    "데이터 한계나 주의사항 (예: 19+ 본문 미접근, 표본 크기, 정렬 한계 등)"
  ]
}`;
}

async function main() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    log('ANTHROPIC_API_KEY not set. Skipping AI analysis.');
    // stdin 그대로 통과
    const raw = await readStdin();
    process.stdout.write(raw);
    return;
  }

  const model = process.env.CLAUDE_MODEL || 'claude-haiku-4-5';
  const raw = await readStdin();
  let data;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    log('failed to parse stdin JSON:', e.message);
    process.exit(1);
  }

  log('analyzing', data.posts.length, 'posts with', model);

  const client = new Anthropic({ apiKey });
  const prompt = buildPrompt(data);

  try {
    const msg = await client.messages.create({
      model,
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = msg.content.find(b => b.type === 'text')?.text || '';
    log('tokens used: in', msg.usage.input_tokens, '/ out', msg.usage.output_tokens);

    // JSON 추출 (Claude가 ```json``` 블록으로 감쌀 수 있음)
    let analysis;
    try {
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}');
      if (jsonStart === -1 || jsonEnd === -1) throw new Error('no JSON found');
      analysis = JSON.parse(text.substring(jsonStart, jsonEnd + 1));
    } catch (e) {
      log('failed to parse Claude response as JSON:', e.message);
      analysis = { error: 'parse_failed', rawText: text };
    }

    data.analysis = analysis;
    data.analysisMeta = {
      model: model,
      generatedAt: new Date().toISOString(),
      tokensIn: msg.usage.input_tokens,
      tokensOut: msg.usage.output_tokens,
    };
  } catch (e) {
    log('Claude API error:', e.message);
    data.analysis = { error: e.message };
  }

  process.stdout.write(JSON.stringify(data, null, 2));
}

main().catch(err => {
  console.error('[analyze] fatal:', err);
  process.exit(1);
});
