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

[출력 규칙]
- 응답은 오직 JSON 객체 하나만. 다른 텍스트 절대 금지.
- 마크다운 코드 블록(\`\`\`json ... \`\`\`)으로 감싸지 마세요. 순수 JSON만.
- 문자열 안의 줄바꿈은 \\n으로 escape. 큰따옴표는 \\"로 escape.
- 모든 키와 값은 큰따옴표 사용.

[출력 형식]
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
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
    });
    const text = msg.content.find(b => b.type === 'text')?.text || '';
    log('tokens used: in', msg.usage.input_tokens, '/ out', msg.usage.output_tokens);

    // JSON 추출 — 여러 전략 시도 + Claude 흔한 실수 sanitization
    let analysis = null;
    let parseErrors = [];

    // Claude의 흔한 JSON 실수 정리
    function sanitizeJson(s) {
      // \'  → '  (Claude가 작은따옴표를 escape하는 실수 — JSON에선 작은따옴표 escape 불필요)
      let out = s.replace(/\\'/g, "'");
      // trailing comma 제거: ,] 또는 ,}
      out = out.replace(/,(\s*[\]}])/g, '$1');
      // 제어 문자 (탭, 백스페이스 등) 문자열 안에서 escape
      // — 일반적이지 않으므로 일단 생략. 필요하면 추가.
      return out;
    }

    // Strategy 1: ```json ... ``` 마크다운 코드 블록 추출
    const fenceMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    const candidates = [];
    if (fenceMatch) candidates.push(fenceMatch[1].trim());
    // Strategy 2: 첫 { ~ 마지막 } 사이 (전체)
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      candidates.push(text.substring(firstBrace, lastBrace + 1));
    }
    // Strategy 3: 마크다운 fence 안의 { ~ } (위 fence가 있을 때만 의미 있음)
    if (fenceMatch) {
      const inner = fenceMatch[1];
      const fb = inner.indexOf('{');
      const lb = inner.lastIndexOf('}');
      if (fb !== -1 && lb !== -1) candidates.push(inner.substring(fb, lb + 1));
    }

    for (const c of candidates) {
      // 원본 먼저 시도
      try { analysis = JSON.parse(c); break; } catch (e) { parseErrors.push('raw: ' + e.message); }
      // sanitize 후 재시도
      try { analysis = JSON.parse(sanitizeJson(c)); break; } catch (e) { parseErrors.push('sanitized: ' + e.message); }
    }

    if (!analysis) {
      log('all JSON parse strategies failed:', parseErrors);
      analysis = { error: 'parse_failed', parseErrors: parseErrors, rawText: text };
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
