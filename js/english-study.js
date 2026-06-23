// ═══════════════════════════════════════════════════════════
//  ENGLISH › STUDY — 유튜브 뉴스/인터뷰 스크립트 → "1타 강사" 정리
//  ANNIE(회화 리뷰)와 분리. 저장: Firestore `englishStudy` 컬렉션.
//  생성: Anthropic(Opus 4.7) — ANNIE 파이프라인과 동일 패턴.
// ═══════════════════════════════════════════════════════════

var STUDY_PROMPT_TEMPLATE = `You are Korea's #1 English instructor ("1타 강사") making a vivid, sticky study sheet for Nuri — a Korean fashion designer aiming for C1 English and preparing to job-hunt abroad (EU / Canada / Australia: interviews, portfolio talk). She studies from YouTube English news / interviews / talks (transcript below).

Your job: mine the transcript for the expressions WORTH STEALING and teach each one like a charismatic top instructor drilling it into her ears and head — NOT a dry dictionary. Output EXACTLY ONE JavaScript object matching the schema. No preamble, just one fenced \`\`\`js code block with the assignment statement.

=== TEACHING STYLE (CRITICAL — THIS IS THE WHOLE POINT) ===
- Group the expressions into 3–6 themed categories YOU choose for THIS content. Good recurring themes (use when they fit, but adapt freely): "한국어 직역으로는 안 나오는 관용구", "한 단어가 한 문장을 이긴다 — 고급 압축 어휘", "비유 한 방으로 머리에 박는 표현", "토론·회의에서 내 의견 꺼낼 때 쓰는 문장 틀". Each group gets a short "왜 중요한지" hook in instructor voice (the "why").
- For EACH expression, write like a top instructor LECTURING out loud — flowing, warm, full of banter. Do NOT compress each field into one terse line; explain generously and conversationally (이 "풀어쓰는 깊이"가 머리에 박히게 하는 #1 요소다. 짧은 사전 항목이 아니라 1타 강사 강의처럼):
  · stars: 빈도 별점 integer 1–5 (5=초고빈도/매일, 4=꽤 흔함, 3=상황별, 2=글·격식, 1=드묾·showy). freqLabel: short note ("꽤 흔함, 직장 영어 단골").
  · literal(직역) → meaning(진짜 뜻). When literal hides the meaning, that contrast IS the lesson.
  · image: 그림·장면으로 외우게 하라 — **2~4문장**으로 생생하게, 질문도 던지며. ("그림 그려봐. 새 직장 첫날, 어색해서 의자에 엉거주춤 걸터앉아 있어. 근데 몇 주 지나면? 의자 쫙 당겨서 발을 책상 밑에 쭉 뻗고 편하게 앉지. 그게 자리 잡았다는 거야.") 절대 한 줄로 끝내지 마라.
  · contrast: 한국인이 흔히 하는 밋밋한 표현 vs 원어민의 이 표현 + **왜 더 센지·뉘앙스 차이까지 추론**해라 (그냥 "A→B"로 끝내지 말 것). ("한국인은 '교육 시스템이 느리다'를 'the system is slow'라고 정적으로 말해. 원어민은 'the system hasn't caught up' — 못 따라잡았다고 동적으로 표현해. 이 감각 차이가 중요해.") Nuri 상황(이직·디자인·면접)에 닿는 **개인 멘트**도 자연스럽게 끼워라 ("너 이직 준비하잖아, 이거 진짜 쓸 일 많아."). 없으면 "".
  · source: 본문(transcript)에서 이 표현이 나온 부분 인용. 없으면 "".
  · examples: 예문 폭탄 3–4개. 각 {en, kr, tag}. Nuri 삶(패션 디자이너·이직·면접·포트폴리오)에 맞는 예문을 적극적으로 섞어라. tag = 상황("면접","디자인","이직","일상","회의") 또는 "". **kr 끝에 가르칠 포인트가 있으면 짧은 코멘트를 붙여라** ("...했어요. — 이렇게 쓰면 면접관이 '오' 한다", "...야. — 같은 표현인데 전치사 붙으면 뜻이 갈려!").
  · related: 비슷한 표현·변형·반대말 [{label, note}]. **전치사·용법 따라 뜻이 갈리는 건 적극적으로 갈라서 가르쳐라** (예: catch up with=못 따라잡다 / catch up=근황 나누다 / catch up on=밀린 거 보충 — 셋 다 별도 항목으로). note = 한 줄 뜻·뉘앙스 + 빈도(⭐) + 미국식/영국식. 없으면 [].
  · warning: 영국식/미국식, 격식 차이 등 주의 한 줄. 없으면 "".
  · outro: 1타 강사 마무리 한 마디 ("자 다시. sink or swim. 가라앉든 헤엄치든. 입에 붙었지?"). 없으면 "".
- bonus: 본문에서 그냥 지나치기 아까운 꿀단어 3–6개를 간단히.
- REAL-LIFE FREQUENCY가 #1 필터다. 교과서적이고 실제로 잘 안 쓰는 표현은 빼거나 별점 낮게 + freqLabel에 '문어체/드묾' 명시. 진짜 원어민이 캐주얼하게 쓰는 걸 우선해라.
- 모든 한국어는 따뜻하고 입담 있는 강사 톤. <b>볼드</b>로 핵심 강조 가능. 영어 필드엔 inline HTML(<b>,<i>,<s>) 허용.

=== SCHEMA (output exactly this shape) ===

studyData["{{ID}}"] = {
  title: "{{TITLE}} — 비어있으면 콘텐츠 핵심 주제로 짧은 영어 제목",
  source: "{{SOURCE}}",
  sourceType: "news | interview | talk | lecture | podcast 중 하나",
  date: "{{DATE}}",
  subtitle: "이 콘텐츠로 뭘 건지는지 한 줄 한국어 요약",
  intro: "1타 강사 인트로 1–2문장 — 오늘 이 자료에서 뭘 훔칠지.",
  groups: [
    {
      title: "그룹(카테고리) 제목 — 한국어",
      why: "이 그룹이 왜 중요한지 강사 입담 1–2문장.",
      items: [
        {
          expr: "the expression / phrase in English",
          stars: 4,
          freqLabel: "꽤 흔함, 직장 영어 단골",
          literal: "직역",
          meaning: "진짜 뜻",
          image: "그림·장면으로 외우게 하는 2~4문장. 질문도 던지며 생생하게, 절대 한 줄로 끝내지 말 것.",
          contrast: "한국인 밋밋 표현 vs 원어민 표현 + 왜 더 센지 뉘앙스 추론 + Nuri(이직·디자인·면접) 개인 멘트.",
          source: "본문 인용.",
          examples: [
            { en: "Natural example sentence.", kr: "예문 한글 뜻.", tag: "면접" },
            { en: "Another example tied to Nuri's life.", kr: "예문 한글 뜻.", tag: "디자인" }
          ],
          related: [ { label: "find one's footing", note: "미국식, 더 흔함 ⭐⭐⭐⭐" } ],
          warning: "영국식 표현 주의 등.",
          outro: "자 다시. … 입에 붙었지?"
        }
      ]
    }
  ],
  bonus: [
    { expr: "at a premium", stars: 3, meaning: "귀한, 값나가는", ex: "Space is at a premium in Seoul.", exKr: "서울은 공간이 귀해." }
  ]
};

=== STRICT OUTPUT RULES ===

1. Output format: ONE fenced js code block containing ONLY the assignment statement.
2. No text before or after the code block.
3. No comments inside the object (no // anywhere in the output).
4. Use double quotes for all strings. For multi-line content, use \\n escape sequences. Never use backticks or template literals.
5. Preserve inline HTML tags (<b>, <i>, <s>) as literal text inside strings — do not escape them.
6. stars must be an integer 1–5. Empty optional string fields = "". Empty arrays = [].
7. Do not invent expressions not present in the transcript. Extract what is actually used.
8. Replace {{ID}} with the id provided in INPUT.

=== INPUT ===

ID: {{ID}}
TITLE: {{TITLE}}
SOURCE: {{SOURCE}}
DATE: {{DATE}}

TRANSCRIPT:
{{TRANSCRIPT}}`;

var engStudyData = [];

// ── 목록 로드/렌더 ──────────────────────────────────────────
window.loadEnglishStudy = async function(){
  try {
    var docs = (typeof fbRead === 'function') ? await fbRead('englishStudy') : [];
    engStudyData = (docs || []).sort(function(a,b){ return (b.date || b._id || '').localeCompare(a.date || a._id || ''); });
  } catch(e){ engStudyData = []; }
  renderStudyList();
};

function renderStudyList(){
  var listEl = document.getElementById('eng-study-list');
  var emptyEl = document.getElementById('eng-study-empty');
  if (!listEl || !emptyEl) return;
  if (!engStudyData.length){
    listEl.style.display = 'none';
    emptyEl.style.display = 'flex';
    return;
  }
  emptyEl.style.display = 'none';
  listEl.style.display = 'block';
  listEl.innerHTML = engStudyData.map(function(s){
    var groupCount = (s.groups || []).length;
    var exprCount = (s.groups || []).reduce(function(a,g){ return a + ((g.items || []).length); }, 0);
    var bonusCount = (s.bonus || []).length;
    var typeIcon = ({ news:'newspaper', interview:'record_voice_over', talk:'forum', lecture:'school', podcast:'podcasts' })[s.sourceType] || 'smart_display';
    return '<div onclick="openStudyDetail(\'' + s._id + '\')" class="bg-white rounded-xl border border-slate-100 p-5 mb-3 hover:shadow-md transition-all cursor-pointer" style="box-shadow:var(--shadow-card-sm);border-left:3px solid #8b5cf6">' +
      '<div class="flex justify-between items-start gap-3">' +
        '<div class="flex-1 min-w-0">' +
          '<div class="flex items-center gap-2 mb-1">' +
            '<span class="material-symbols-outlined text-violet-500" style="font-size:calc(18px * var(--es-scale, 1))">' + typeIcon + '</span>' +
            '<h4 class="font-bold text-base text-slate-900 font-headline truncate">' + (s.title || 'Untitled') + '</h4>' +
          '</div>' +
          '<p class="text-xs text-slate-400 mb-2 truncate">' + (s.subtitle || '') + (s.source ? ' · ' + s.source : '') + '</p>' +
          '<div class="flex flex-wrap gap-2">' +
            (groupCount ? '<span class="text-[9px] font-bold bg-violet-50 text-violet-600 px-2 py-0.5 rounded-full">' + groupCount + ' 그룹</span>' : '') +
            (exprCount ? '<span class="text-[9px] font-bold bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">표현 ' + exprCount + '</span>' : '') +
            (bonusCount ? '<span class="text-[9px] font-bold bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full">보너스 ' + bonusCount + '</span>' : '') +
            (s.date ? '<span class="text-[9px] font-bold bg-slate-50 text-slate-400 px-2 py-0.5 rounded-full">' + s.date + '</span>' : '') +
          '</div>' +
        '</div>' +
        '<button onclick="event.stopPropagation();deleteStudy(\'' + s._id + '\')" class="p-2 rounded-xl bg-slate-50 hover:bg-rose-100 text-slate-400 hover:text-rose-500 shrink-0"><span class="material-symbols-outlined text-lg">delete</span></button>' +
      '</div>' +
    '</div>';
  }).join('');
}

// ── 추가 모달 ───────────────────────────────────────────────
window.openStudyCreateModal = function(){
  var d = document.getElementById('study-date'); if (d) d.value = new Date().toISOString().split('T')[0];
  ['study-title','study-source','study-transcript'].forEach(function(idn){ var el = document.getElementById(idn); if (el) el.value = ''; });
  var le = document.getElementById('study-loading-overlay'); if (le) le.className = 'hidden p-6 rounded-xl bg-violet-50 border border-violet-100 text-center';
  var er = document.getElementById('study-auto-error'); if (er) er.className = 'hidden p-4 rounded-xl bg-rose-50 border border-rose-100';
  updateStudyApiUI();
  var m = document.getElementById('eng-study-modal'); if (m) m.style.cssText = 'display:flex!important';
};
window.closeStudyCreateModal = function(){
  var m = document.getElementById('eng-study-modal'); if (m) m.style.cssText = 'display:none!important';
};
function updateStudyApiUI(){
  var hint = document.getElementById('study-api-hint');
  if (!hint) return;
  var hasKey = !!localStorage.getItem('atelier_anthropic_api_key');
  var model = localStorage.getItem('atelier_anthropic_model') || 'claude-opus-4-7';
  var info = (typeof _API_MODEL_INFO !== 'undefined' && _API_MODEL_INFO[model]) || { label: model, cost: '' };
  hint.textContent = hasKey
    ? ('현재 모델: ' + info.label + (info.cost ? ' (' + info.cost + ')' : ''))
    : 'API 키 필요 — ANNIE 탭 → "리뷰 추가"에서 한 번만 입력하면 STUDY에도 공유돼요';
}

// ── 자동 생성 (Opus 호출 → 파싱 → 저장) ─────────────────────
window.autoGenerateStudy = async function(){
  var date = document.getElementById('study-date').value || new Date().toISOString().split('T')[0];
  var title = document.getElementById('study-title').value.trim();
  var source = document.getElementById('study-source').value.trim();
  var transcript = document.getElementById('study-transcript').value.trim();
  if (!transcript){ if (typeof showSyncToast === 'function') showSyncToast('<span class="material-symbols-outlined text-sm mr-1">warning</span> 스크립트를 입력하세요'); return; }
  var apiKey = localStorage.getItem('atelier_anthropic_api_key');
  if (!apiKey){ if (typeof showSyncToast === 'function') showSyncToast('<span class="material-symbols-outlined text-sm mr-1">key</span> 먼저 API 키를 설정하세요 (ANNIE 탭 → 리뷰 추가)'); return; }
  var model = localStorage.getItem('atelier_anthropic_model') || 'claude-opus-4-7';

  var id = date + '-' + Date.now().toString(36).slice(-5);
  var loadingEl = document.getElementById('study-loading-overlay');
  var errorEl = document.getElementById('study-auto-error');
  var btn = document.getElementById('study-auto-btn');
  if (loadingEl) loadingEl.className = 'p-6 rounded-xl bg-violet-50 border border-violet-100 text-center';
  if (errorEl) errorEl.className = 'hidden p-4 rounded-xl bg-rose-50 border border-rose-100';
  if (btn){ btn.disabled = true; btn.className = 'w-full py-3 rounded-xl bg-slate-300 text-slate-500 font-bold text-sm flex items-center justify-center gap-2 cursor-not-allowed'; }

  var prompt = STUDY_PROMPT_TEMPLATE
    .replaceAll('{{ID}}', id)
    .replaceAll('{{TITLE}}', title || '(제목 미입력)')
    .replaceAll('{{SOURCE}}', source || '(출처 미입력)')
    .replaceAll('{{DATE}}', date)
    .replaceAll('{{TRANSCRIPT}}', transcript);

  var responseText = '';
  try {
    var res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
        'content-type': 'application/json'
      },
      body: JSON.stringify({ model: model, max_tokens: 32000, messages: [{ role: 'user', content: prompt }] })
    });
    if (!res.ok){
      var eb = {}; try { eb = await res.json(); } catch(e){}
      var msg = (res.status === 401) ? 'API 키가 유효하지 않아요.'
        : (res.status === 429) ? '요청이 너무 많아요. 잠시 후 다시 시도해주세요.'
        : (res.status === 400) ? '스크립트가 너무 길거나 형식 문제예요.'
        : 'Anthropic 오류 (HTTP ' + res.status + '). ' + (eb.error && eb.error.message ? eb.error.message : '');
      studyAutoError(msg);
      return;
    }
    var data = await res.json();
    responseText = (data.content && data.content[0] && data.content[0].text) || '';
    if (data.stop_reason === 'max_tokens'){ studyAutoError('내용이 너무 길어요. 스크립트를 반으로 나눠 다시 시도해주세요.', responseText); return; }
  } catch(e){ studyAutoError('인터넷 연결을 확인해주세요.'); return; }

  // 파싱: studyData["..."] = {...}
  var cleaned = responseText.trim();
  var cb = cleaned.match(/```(?:js|javascript|json)?\s*\n([\s\S]*?)```/);
  if (cb) cleaned = cb[1].trim();
  else cleaned = cleaned.replace(/^```(?:js|json|javascript)?\s*\n?/gm, '').replace(/\n?```\s*$/gm, '').trim();

  var parsed;
  try {
    var script = 'var studyData = {};\n' + cleaned + '\nreturn studyData;';
    var result = new Function(script)();
    var keys = Object.keys(result);
    if (keys.length) parsed = result[keys[0]];
  } catch(e1){ /* fallthrough */ }
  if (!parsed){
    studyAutoError('Claude 응답 형식이 예상과 달라요. 아래 원본을 복사해 수동 처리하거나 다시 시도해주세요.', responseText);
    return;
  }

  if (title && !parsed.title) parsed.title = title;
  if (source && !parsed.source) parsed.source = source;
  if (!parsed.date) parsed.date = date;
  parsed.updatedAt = new Date().toISOString();

  try {
    await db.collection('englishStudy').doc(id).set(parsed, { merge: true });
    if (loadingEl) loadingEl.className = 'hidden p-6 rounded-xl bg-violet-50 border border-violet-100 text-center';
    if (typeof showSyncToast === 'function') showSyncToast('<span class="material-symbols-outlined text-sm mr-1">check_circle</span> 스터디가 추가됐어요!');
    await loadEnglishStudy();
    setTimeout(function(){ closeStudyCreateModal(); openStudyDetail(id); }, 600);
  } catch(err){ studyAutoError('Firestore 저장 실패: ' + err.message); }
};

function studyAutoError(msg, raw){
  var loadingEl = document.getElementById('study-loading-overlay');
  var errorEl = document.getElementById('study-auto-error');
  var btn = document.getElementById('study-auto-btn');
  if (loadingEl) loadingEl.className = 'hidden p-6 rounded-xl bg-violet-50 border border-violet-100 text-center';
  if (errorEl) errorEl.className = 'p-4 rounded-xl bg-rose-50 border border-rose-100';
  var m = document.getElementById('study-auto-error-msg'); if (m) m.textContent = msg;
  var rawEl = document.getElementById('study-auto-error-raw');
  if (rawEl){
    if (raw){ rawEl.className = 'w-full mt-2 px-3 py-2 rounded-lg bg-white border border-rose-200 text-xs font-mono resize-none'; rawEl.value = raw; }
    else { rawEl.className = 'hidden'; }
  }
  if (btn){ btn.disabled = false; btn.className = 'w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-violet-200'; }
}

// ── 상세 열기/닫기/삭제 ─────────────────────────────────────
window.openStudyDetail = function(id){
  var s = engStudyData.find(function(x){ return x._id === id; });
  if (!s) return;
  var content = document.getElementById('eng-study-detail-content');
  if (content) content.innerHTML = renderStudyDetail(s);
  var lc = document.getElementById('eng-study-listcard'); if (lc) lc.style.display = 'none';
  var dv = document.getElementById('eng-study-detail-view'); if (dv) dv.style.display = 'block';
  window.scrollTo({ top: 0, behavior: 'smooth' });
};
window.closeStudyDetail = function(){
  engStopSpeak();
  var dv = document.getElementById('eng-study-detail-view'); if (dv) dv.style.display = 'none';
  var lc = document.getElementById('eng-study-listcard'); if (lc) lc.style.display = '';
  window.scrollTo({ top: 0 });
};
window.deleteStudy = async function(id){
  if (!window.confirm('이 스터디를 삭제할까요?')) return;
  try {
    if (typeof trashBeforeDelete === 'function') trashBeforeDelete('englishStudy', id);
    await db.collection('englishStudy').doc(id).delete();
    engStudyData = engStudyData.filter(function(x){ return x._id !== id; });
    renderStudyList();
    if (typeof showSyncToast === 'function') showSyncToast('<span class="material-symbols-outlined text-sm mr-1">check_circle</span> 삭제됐어요');
  } catch(e){ alert('삭제 실패'); }
};

// ── 1타 강사 상세 렌더러 ────────────────────────────────────
function _esEscAttr(s){ return (s || '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }
function _esStripHtml(s){ var d = document.createElement('div'); d.innerHTML = s || ''; return (d.textContent || d.innerText || '').trim(); }
function _esStars(n){ n = Math.max(0, Math.min(5, parseInt(n) || 0)); return n ? '⭐'.repeat(n) : ''; }
function _esSpk(text, lang){
  if (!text) return '';
  return '<button class="es-spk align-middle text-violet-400 hover:text-violet-600" data-text="' + _esEscAttr(_esStripHtml(text)) + '" data-lang="' + (lang || 'en-US') + '" onclick="engSpeakBtn(this)" title="듣기"><span class="material-symbols-outlined" style="font-size:calc(16px * var(--es-scale, 1));vertical-align:middle">volume_up</span></button>';
}

// ── Stitch "Linguistic Clarity" 팔레트 (가시성 우선) ──────────
var _ESC = {
  text: '#0b1c30', sub: '#454654', outline: '#757686', outlineV: '#c5c5d7',
  primary: '#2036bd', primaryFixed: '#dfe0ff',
  surf: '#f8f9ff', surfLow: '#eff4ff', surfC: '#e5eeff', surfHigh: '#dce9ff',
  amber: '#855300', onAmber: '#684000',
  emerald: '#005438', emeraldContainer: '#006f4b', onEmerald: '#68f5b8',
  error: '#ba1a1a'
};
var _ESFONT = "font-family:'Be Vietnam Pro','Noto Sans KR',system-ui,sans-serif";

function _esStarRow(n, sz){
  n = Math.max(0, Math.min(5, parseInt(n) || 0));
  var o = '';
  for (var i = 0; i < n; i++) o += '<span class="material-symbols-outlined" style="font-size:' + (sz || 18) + 'px;color:' + _ESC.amber + ';font-variation-settings:\'FILL\' 1">star</span>';
  return o ? '<span class="inline-flex items-center" style="flex-shrink:0">' + o + '</span>' : '';
}
function _esSpkBig(text){
  if (!text) return '';
  return '<button onclick="engSpeakBtn(this)" data-text="' + _esEscAttr(_esStripHtml(text)) + '" data-lang="en-US" title="듣기" style="width:38px;height:38px;display:inline-flex;align-items:center;justify-content:center;border-radius:9999px;background:' + _ESC.primaryFixed + ';color:' + _ESC.primary + ';flex-shrink:0;border:none;cursor:pointer"><span class="material-symbols-outlined" style="font-size:calc(20px * var(--es-scale, 1));font-variation-settings:\'FILL\' 1">volume_up</span></button>';
}
function _esSpkSm(text){
  if (!text) return '';
  return '<button onclick="engSpeakBtn(this)" data-text="' + _esEscAttr(_esStripHtml(text)) + '" data-lang="en-US" title="듣기" style="vertical-align:middle;color:' + _ESC.primary + ';opacity:0.55;border:none;background:none;cursor:pointer;padding:0 2px"><span class="material-symbols-outlined" style="font-size:calc(16px * var(--es-scale, 1));vertical-align:middle">volume_up</span></button>';
}
function _esFreqChips(label){
  return String(label || '').split(',').map(function(t){
    t = t.trim(); if (!t) return '';
    return '<span style="padding:4px 12px;background:' + _ESC.surfHigh + ';border-radius:9999px;font-size:calc(12px * var(--es-scale, 1));font-weight:700;letter-spacing:0.03em;color:' + _ESC.sub + '">' + t + '</span>';
  }).join('');
}
function _esLabel(txt){
  return '<div style="font-size:calc(12px * var(--es-scale, 1));font-weight:700;letter-spacing:0.05em;text-transform:uppercase;color:' + _ESC.sub + '">' + txt + '</div>';
}

// 표현 카드 (Stitch study-card)
function _esStudyCard(it){
  var C = _ESC;
  var h = '<article style="background:#fff;border-radius:16px;padding:28px;border:1px solid rgba(197,197,215,0.4);box-shadow:0 4px 20px rgba(0,0,0,0.04);margin-bottom:24px">';
  h += '<div class="flex flex-wrap items-center justify-between gap-3" style="margin-bottom:20px">' +
    '<div class="flex items-center gap-3" style="flex-wrap:wrap">' +
      '<span style="font-size:calc(28px * var(--es-scale, 1));line-height:1.2;font-weight:700;letter-spacing:-0.02em;color:' + C.primary + '">' + (it.expr || '') + '</span>' +
      _esSpkBig(it.expr) +
      (it.stars ? _esStarRow(it.stars, 22) : '') +
    '</div>' +
    (it.freqLabel ? '<div class="flex flex-wrap gap-2">' + _esFreqChips(it.freqLabel) + '</div>' : '') +
  '</div>';
  if (it.literal || it.meaning){
    h += '<div style="margin-bottom:20px;padding:16px 0;border-top:1px solid rgba(197,197,215,0.25);border-bottom:1px solid rgba(197,197,215,0.25)">' +
      _esLabel('Meaning') +
      '<p style="font-size:calc(18px * var(--es-scale, 1));line-height:1.6;margin:8px 0 0">' +
        (it.literal ? '<span style="color:' + C.sub + '">직역: ' + it.literal + '</span> <span style="color:' + C.outline + '">→</span> ' : '') +
        '<span style="font-weight:700;color:' + C.text + '">' + (it.meaning || '') + '</span>' +
      '</p>' +
    '</div>';
  }
  if (it.image){
    h += '<div class="flex gap-4" style="background:rgba(255,221,184,0.35);border-left:4px solid ' + C.amber + ';padding:18px 20px;border-radius:0 12px 12px 0;margin-bottom:20px">' +
      '<span class="material-symbols-outlined" style="color:' + C.amber + ';font-size:calc(28px * var(--es-scale, 1));flex-shrink:0">psychology</span>' +
      '<p style="font-size:calc(16px * var(--es-scale, 1));line-height:1.6;color:' + C.onAmber + ';margin:0">' + it.image + '</p>' +
    '</div>';
  }
  if (it.contrast || it.source){
    h += '<div style="background:' + C.surfLow + ';border-radius:12px;padding:16px;margin-bottom:20px">';
    if (it.contrast) h += '<div class="flex items-start gap-3" style="margin-bottom:' + (it.source ? '10px' : '0') + '"><span style="font-size:calc(20px * var(--es-scale, 1));flex-shrink:0">🇰🇷↔🇺🇸</span><p style="font-size:calc(16px * var(--es-scale, 1));line-height:1.6;color:' + C.text + ';margin:0">' + it.contrast + '</p></div>';
    if (it.source) h += '<div class="flex items-start gap-2" style="color:' + C.sub + ';opacity:0.85"><span class="material-symbols-outlined" style="font-size:calc(16px * var(--es-scale, 1));padding-top:2px;flex-shrink:0">format_quote</span><p style="font-size:calc(14px * var(--es-scale, 1));font-style:italic;line-height:1.5;margin:0">' + it.source + '</p></div>';
    h += '</div>';
  }
  if ((it.examples || []).length){
    h += '<div style="margin-bottom:24px">' + _esLabel('Real-World Examples');
    it.examples.forEach(function(ex){
      h += '<div style="padding-left:16px;border-left:2px solid ' + C.surfHigh + ';margin-top:14px">' +
        '<div class="flex items-start gap-3">' +
          '<span class="material-symbols-outlined" style="color:' + C.error + ';font-size:calc(20px * var(--es-scale, 1));font-variation-settings:\'FILL\' 1;padding-top:2px;flex-shrink:0">adjust</span>' +
          '<p style="font-size:calc(18px * var(--es-scale, 1));line-height:1.5;font-weight:700;color:' + C.text + ';margin:0">' + (ex.en || '') + ' ' + _esSpkSm(ex.en) + (ex.tag ? ' <span style="font-size:calc(10px * var(--es-scale, 1));font-weight:700;background:' + C.surfC + ';color:' + C.sub + ';padding:2px 8px;border-radius:6px;vertical-align:middle">' + ex.tag + '</span>' : '') + '</p>' +
        '</div>' +
        (ex.kr ? '<p style="font-size:calc(16px * var(--es-scale, 1));line-height:1.6;color:' + C.sub + ';margin:4px 0 0 32px">' + ex.kr + '</p>' : '') +
      '</div>';
    });
    h += '</div>';
  }
  if ((it.related || []).length || it.warning){
    h += '<div class="grid md:grid-cols-2 gap-6" style="background:' + C.surf + ';padding:20px;border-radius:12px;border:1px solid rgba(197,197,215,0.4)">';
    h += '<div>';
    if ((it.related || []).length){
      h += '<div class="flex items-center gap-2" style="font-weight:700;color:' + C.text + ';margin-bottom:12px"><span class="material-symbols-outlined" style="color:' + C.amber + '">lightbulb</span>같은 뜻 / 유의어</div><ul style="margin:0;padding:0;list-style:none">';
      it.related.forEach(function(r){
        h += '<li style="font-size:calc(14px * var(--es-scale, 1));line-height:1.6;color:' + C.text + ';margin-bottom:8px"><strong style="color:' + C.primary + '">' + (r.label || '') + '</strong>' + (r.note ? ' <span style="color:' + C.sub + '">— ' + r.note + '</span>' : '') + '</li>';
      });
      h += '</ul>';
    }
    h += '</div><div>';
    if (it.warning){
      h += '<div class="flex items-center gap-2" style="font-weight:700;color:' + C.text + ';margin-bottom:12px"><span class="material-symbols-outlined" style="color:' + C.error + '">warning</span>사용 시 주의사항</div><p style="font-size:calc(14px * var(--es-scale, 1));line-height:1.6;color:' + C.sub + ';margin:0">' + it.warning + '</p>';
    }
    h += '</div></div>';
  }
  if (it.outro){
    h += '<div class="flex items-center justify-center" style="margin-top:24px;padding-top:24px;border-top:1px dashed ' + C.outlineV + '"><div class="inline-flex items-center gap-2" style="background:' + C.primary + ';color:#fff;padding:10px 24px;border-radius:9999px;max-width:100%"><span class="material-symbols-outlined">loop</span><p style="font-size:calc(15px * var(--es-scale, 1));font-weight:700;margin:0">' + it.outro + '</p></div></div>';
  }
  h += '</article>';
  return h;
}

// 학습 스트릭 (localStorage, 실제 연속일)
function _esRecordStudyDay(){
  try {
    var key = 'atelier_eng_study_days';
    var today = new Date().toISOString().slice(0, 10);
    var days = JSON.parse(localStorage.getItem(key) || '[]');
    if (days.indexOf(today) < 0){ days.push(today); days = days.slice(-90); localStorage.setItem(key, JSON.stringify(days)); }
    var set = {}; days.forEach(function(d){ set[d] = 1; });
    var streak = 0, d = new Date(today + 'T00:00:00');
    while (set[d.toISOString().slice(0, 10)]){ streak++; d.setDate(d.getDate() - 1); }
    return streak;
  } catch(e){ return 1; }
}

// Practice Challenge + Streak (벤토)
function _esPracticeStreak(s){
  var C = _ESC, pe = null;
  (s.groups || []).forEach(function(g){
    (g.items || []).forEach(function(it){
      if (pe || !it.expr) return;
      var exs = it.examples || [], match = null;
      for (var i = 0; i < exs.length; i++){
        if (exs[i].en && exs[i].en.toLowerCase().indexOf(String(it.expr).toLowerCase().split(' ')[0]) >= 0){ match = exs[i]; break; }
      }
      if (!match) match = exs[0];
      if (match && match.en) pe = { expr: it.expr, en: match.en, kr: match.kr || '' };
    });
  });
  var H = '<section class="grid grid-cols-1 md:grid-cols-3 gap-6" style="margin-top:48px">';
  if (pe){
    var rx = new RegExp(String(pe.expr).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    var cloze = pe.en.replace(rx, '________');
    var pid = 'es-practice-' + (s._id || 'x');
    H += '<div class="md:col-span-2" style="background:' + C.surfC + ';border-radius:16px;padding:24px;position:relative;overflow:hidden">' +
      '<h4 style="font-size:calc(20px * var(--es-scale, 1));font-weight:600;color:' + C.text + ';margin:0 0 8px">Practice Challenge</h4>' +
      '<p style="font-size:calc(14px * var(--es-scale, 1));color:' + C.sub + ';margin:0 0 16px">빈칸을 <strong style="color:' + C.primary + '">' + pe.expr + '</strong> 로 채워보세요.</p>' +
      '<div style="background:#fff;padding:16px;border-radius:8px;font-family:monospace;font-size:calc(14px * var(--es-scale, 1));line-height:1.6;border:1px solid ' + C.outlineV + ';color:' + C.text + '">"' + cloze + '"</div>' +
      '<div id="' + pid + '-ans" style="display:none;margin-top:12px;font-size:calc(14px * var(--es-scale, 1));line-height:1.6;color:' + C.emerald + '"><strong>정답:</strong> ' + pe.en + ' ' + _esSpkSm(pe.en) + (pe.kr ? '<br><span style="color:' + C.sub + '">' + pe.kr + '</span>' : '') + '</div>' +
      '<div class="flex gap-3" style="margin-top:16px"><button onclick="var a=document.getElementById(\'' + pid + '-ans\');a.style.display=a.style.display===\'none\'?\'block\':\'none\'" style="background:' + C.primary + ';color:#fff;padding:8px 16px;border-radius:8px;font-size:calc(14px * var(--es-scale, 1));font-weight:700;border:none;cursor:pointer">정답 보기</button></div>' +
      '<span class="material-symbols-outlined" style="position:absolute;right:-16px;bottom:-16px;font-size:calc(120px * var(--es-scale, 1));color:' + C.primary + ';opacity:0.08;pointer-events:none">school</span>' +
    '</div>';
  } else {
    H += '<div class="md:col-span-2"></div>';
  }
  var streak = _esRecordStudyDay();
  H += '<div class="flex flex-col justify-center items-center" style="background:' + C.emeraldContainer + ';color:' + C.onEmerald + ';border-radius:16px;padding:24px;text-align:center">' +
    '<span class="material-symbols-outlined" style="font-size:calc(40px * var(--es-scale, 1));margin-bottom:8px;font-variation-settings:\'FILL\' 1">workspace_premium</span>' +
    '<h4 style="font-size:calc(20px * var(--es-scale, 1));font-weight:600;margin:0 0 4px">Study Streak</h4>' +
    '<p style="font-size:calc(30px * var(--es-scale, 1));font-weight:700;margin:0 0 16px">' + streak + ' Day' + (streak === 1 ? '' : 's') + '</p>' +
    '<div style="width:100%;background:rgba(104,245,184,0.25);border-radius:9999px;height:8px"><div style="background:' + C.onEmerald + ';width:' + Math.round(Math.min(streak, 7) / 7 * 100) + '%;height:100%;border-radius:9999px"></div></div>' +
  '</div></section>';
  return H;
}

// 폰트 크기 조절 (ANNIE 리뷰처럼 A-/A/A+) — STUDY 상세 글자만 비율 스케일
function _esFontScale(){
  var sz = localStorage.getItem('atelier_study_font_size') || 'medium';
  return ({ small: 0.68, medium: 0.8, large: 1.0 })[sz] || 0.8;
}
function _esFontBtns(){
  var cur = localStorage.getItem('atelier_study_font_size') || 'medium';
  function b(sz, label, fs){
    var on = sz === cur;
    return '<button id="es-font-' + sz + '" onclick="setStudyFontSize(\'' + sz + '\')" title="글자 크기" style="width:30px;height:30px;border-radius:8px;border:1px solid ' + _ESC.outlineV + ';font-weight:700;font-size:' + fs + 'px;cursor:pointer;background:' + (on ? _ESC.primary : '#fff') + ';color:' + (on ? '#fff' : _ESC.sub) + '">' + label + '</button>';
  }
  return '<div class="inline-flex items-center gap-1">' + b('small', 'A-', 11) + b('medium', 'A', 13) + b('large', 'A+', 15) + '</div>';
}
window.setStudyFontSize = function(sz){
  try { localStorage.setItem('atelier_study_font_size', sz); } catch(e){}
  var root = document.getElementById('es-detail-root');
  if (root) root.style.setProperty('--es-scale', _esFontScale());
  ['small', 'medium', 'large'].forEach(function(s){
    var btn = document.getElementById('es-font-' + s);
    if (btn){ var on = s === sz; btn.style.background = on ? _ESC.primary : '#fff'; btn.style.color = on ? '#fff' : _ESC.sub; }
  });
};

function renderStudyDetail(s){
  var C = _ESC;
  var H = '<div id="es-detail-root" style="' + _ESFONT + ';color:' + C.text + ';--es-scale:' + _esFontScale() + '">';
  // 헤더 + 전체 듣기
  H += '<div class="flex justify-between items-start gap-4 flex-wrap" style="margin-bottom:40px">' +
    '<div>' +
      '<p style="font-size:calc(12px * var(--es-scale, 1));font-weight:700;letter-spacing:0.05em;text-transform:uppercase;color:' + C.primary + ';margin:0 0 8px">Content Study · ' + (s.date || '') + (s.sourceType ? ' · ' + s.sourceType : '') + '</p>' +
      '<h2 style="font-size:calc(32px * var(--es-scale, 1));line-height:1.2;font-weight:700;letter-spacing:-0.02em;color:' + C.text + ';margin:0 0 8px">' + (s.title || 'Untitled') + '</h2>' +
      (s.subtitle ? '<p style="font-size:calc(16px * var(--es-scale, 1));line-height:1.6;color:' + C.sub + ';margin:0;max-width:680px">' + s.subtitle + '</p>' : '') +
      (s.source ? '<p style="font-size:calc(14px * var(--es-scale, 1));color:' + C.outline + ';margin:4px 0 0">' + s.source + '</p>' : '') +
    '</div>' +
    '<div class="flex items-center gap-2 shrink-0" style="flex-wrap:wrap;justify-content:flex-end">' + _esFontBtns() +
      '<button onclick="engSpeakStudy(\'' + s._id + '\')" class="inline-flex items-center gap-1.5" style="padding:8px 16px;border-radius:9999px;background:' + C.primary + ';color:#fff;font-size:calc(14px * var(--es-scale, 1));font-weight:700;border:none;cursor:pointer"><span class="material-symbols-outlined" style="font-size:calc(18px * var(--es-scale, 1))">play_arrow</span>전체 듣기</button>' +
      '<button onclick="engStopSpeak()" class="inline-flex items-center justify-center" style="width:40px;height:40px;border-radius:9999px;background:' + C.surfHigh + ';color:' + C.sub + ';border:none;cursor:pointer" title="정지"><span class="material-symbols-outlined" style="font-size:calc(18px * var(--es-scale, 1))">stop</span></button>' +
    '</div>' +
  '</div>';

  if (s.intro) H += '<div style="margin-bottom:40px;padding:20px;border-radius:12px;border-left:4px solid ' + C.primary + ';background:' + C.surfLow + '"><p style="font-size:calc(16px * var(--es-scale, 1));line-height:1.6;color:' + C.text + ';margin:0">' + s.intro + '</p></div>';

  (s.groups || []).forEach(function(g, gi){
    H += '<header style="margin-bottom:24px;' + (gi ? 'margin-top:48px' : '') + '">' +
      '<div class="flex items-baseline gap-3" style="margin-bottom:6px">' +
        '<span style="font-size:calc(30px * var(--es-scale, 1));font-weight:700;color:' + C.primary + ';opacity:0.4">' + String(gi + 1).padStart(2, '0') + '</span>' +
        '<h3 style="font-size:calc(24px * var(--es-scale, 1));line-height:1.3;font-weight:700;color:' + C.text + ';margin:0">' + (g.title || '') + '</h3>' +
      '</div>' +
      (g.why ? '<p style="font-size:calc(16px * var(--es-scale, 1));line-height:1.6;color:' + C.sub + ';margin:0;max-width:720px">' + g.why + '</p>' : '') +
    '</header>';
    (g.items || []).forEach(function(it){ H += _esStudyCard(it); });
  });

  if ((s.bonus || []).length){
    H += '<section style="margin-top:48px">' +
      '<h3 style="font-size:calc(24px * var(--es-scale, 1));font-weight:700;color:' + C.text + ';margin:0 0 16px">🍯 보너스 꿀단어</h3>' +
      '<div style="background:#fff;border-radius:16px;padding:24px;border:1px solid rgba(197,197,215,0.4);box-shadow:0 4px 20px rgba(0,0,0,0.04)">';
    s.bonus.forEach(function(b, bi){
      H += '<div class="flex items-start gap-2" style="padding:12px 0;' + (bi ? 'border-top:1px solid rgba(197,197,215,0.25)' : '') + '">' +
        '<span style="font-weight:700;color:' + C.primary + ';flex-shrink:0;font-size:calc(16px * var(--es-scale, 1))">' + (b.expr || '') + '</span>' + _esSpkSm(b.expr) +
        (b.stars ? _esStarRow(b.stars, 14) : '') +
        '<div style="font-size:calc(15px * var(--es-scale, 1));line-height:1.6;color:' + C.text + '">' + (b.meaning || '') +
          (b.ex ? ' <span style="color:' + C.sub + '">· ' + b.ex + '</span>' + _esSpkSm(b.ex) + (b.exKr ? ' <span style="font-size:calc(13px * var(--es-scale, 1));color:' + C.sub + '">' + b.exKr + '</span>' : '') : '') +
        '</div>' +
      '</div>';
    });
    H += '</div></section>';
  }

  H += _esPracticeStreak(s);
  H += '</div>';
  return H;
}

// ── 오디오 (브라우저 내장 Web Speech API, 무료) ──────────────
var _esKeepAlive = null;
function _esStartKeepAlive(){
  _esStopKeepAlive();
  _esKeepAlive = setInterval(function(){
    try { if (window.speechSynthesis && window.speechSynthesis.speaking) window.speechSynthesis.resume(); else _esStopKeepAlive(); } catch(e){ _esStopKeepAlive(); }
  }, 9000);
}
function _esStopKeepAlive(){ if (_esKeepAlive){ clearInterval(_esKeepAlive); _esKeepAlive = null; } }

function engSpeak(text, lang){
  try {
    if (!('speechSynthesis' in window)){ if (typeof showSyncToast === 'function') showSyncToast('이 브라우저는 음성 재생을 지원하지 않아요'); return; }
    window.speechSynthesis.cancel();
    var u = new SpeechSynthesisUtterance(_esStripHtml(text));
    u.lang = lang || 'en-US';
    u.rate = (lang === 'ko-KR') ? 1.0 : 0.95;
    u.onend = function(){ _esStopKeepAlive(); };
    window.speechSynthesis.speak(u);
    _esStartKeepAlive();
  } catch(e){}
}
window.engSpeakBtn = function(btn){ if (btn) engSpeak(btn.getAttribute('data-text'), btn.getAttribute('data-lang')); };
function engStopSpeak(){ try { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); } catch(e){} _esStopKeepAlive(); }
window.engStopSpeak = engStopSpeak;

// 전체 듣기 — 표현→뜻→예문(앞 2개)을 영/한 번갈아 큐에 쌓아 강의처럼 재생
window.engSpeakStudy = function(id){
  var s = engStudyData.find(function(x){ return x._id === id; });
  if (!s || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  var q = [];
  if (s.title) q.push([s.title, 'en-US']);
  (s.groups || []).forEach(function(g){
    if (g.title) q.push([g.title, 'ko-KR']);
    (g.items || []).forEach(function(it){
      if (it.expr) q.push([it.expr, 'en-US']);
      if (it.meaning) q.push([it.meaning, 'ko-KR']);
      (it.examples || []).slice(0, 2).forEach(function(ex){
        if (ex.en) q.push([ex.en, 'en-US']);
        if (ex.kr) q.push([ex.kr, 'ko-KR']);
      });
    });
  });
  _esEnqueue(q);
};

// 공통 큐 재생기 (영/한 번갈아 utterance 큐잉)
function _esEnqueue(q){
  if (!('speechSynthesis' in window) || !q.length) return;
  q.forEach(function(pair, i){
    var u = new SpeechSynthesisUtterance(_esStripHtml(pair[0]));
    u.lang = pair[1];
    u.rate = (pair[1] === 'ko-KR') ? 1.0 : 0.95;
    if (i === q.length - 1) u.onend = function(){ _esStopKeepAlive(); };
    window.speechSynthesis.speak(u);
  });
  _esStartKeepAlive();
}

// ANNIE 리뷰 전체 듣기 — Expressions/Upgrades/Convo/Vocab 영어를 영/한 번갈아 강의처럼
window.engSpeakSession = function(id){
  var s = (typeof engSessionsData !== 'undefined' && engSessionsData) ? engSessionsData.find(function(x){ return x._id === id; }) : null;
  if (!s || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  var enOf = function(x){ return (x && typeof x === 'object') ? (x.en || '') : (x || ''); };
  var q = [];
  if (s.title) q.push([s.title, 'en-US']);
  (s.expressions || []).forEach(function(ex){
    if (ex.expr) q.push([ex.expr, 'en-US']);
    if (ex.kr) q.push([ex.kr, 'ko-KR']);
    if (ex.ex) q.push([ex.ex, 'en-US']);
  });
  (s.upgrades || []).forEach(function(u){
    if (u.ok) q.push([u.ok, 'en-US']);
    if (u.gem) q.push([u.gem, 'en-US']);
  });
  var cs = s.convoSkills || {};
  (cs.reactions || []).forEach(function(r){ if (r.say) q.push([r.say, 'en-US']); });
  (cs.starters || []).forEach(function(st){ var e = enOf(st); if (e) q.push([e, 'en-US']); });
  (s.vocabSets || []).forEach(function(vs){
    (vs.words || []).forEach(function(w){
      if (w.word) q.push([w.word, 'en-US']);
      if (w.mean) q.push([w.mean, 'ko-KR']);
    });
  });
  _esEnqueue(q);
};

// ═══════════════════════════════════════════════════════════
//  ANNIE 리뷰 — NotebookLM 오디오 오버뷰
//  업로드 mp3(Firebase Storage) → 인앱 플레이어 / 공유 링크 → 새 탭 버튼
//  세션 doc(englishSessions)에 audioUrl / notebookUrl 필드로 저장.
// ═══════════════════════════════════════════════════════════
function annieAudioHtml(s, dateId){
  var hasAudio = !!(s && s.audioUrl);
  var hasLink = !!(s && s.notebookUrl);
  var setBtns =
    '<button onclick="engCopyNotebookSource(\'' + dateId + '\')" class="text-xs font-bold px-3 py-1.5 rounded-lg bg-violet-600 text-white hover:bg-violet-700 inline-flex items-center gap-1" title="이 리뷰 8개 섹션을 NotebookLM에 붙여넣을 형태로 클립보드에 복사"><span class="material-symbols-outlined" style="font-size:calc(15px * var(--es-scale, 1))">content_copy</span>소스 복사</button>' +
    '<button onclick="engOpenNotebookLM()" class="text-xs font-bold px-3 py-1.5 rounded-lg bg-violet-100 text-violet-700 hover:bg-violet-200 inline-flex items-center gap-1" title="NotebookLM 새 탭으로 열기 → 새 노트북 만들고 붙여넣기(Cmd+V)"><span class="material-symbols-outlined" style="font-size:calc(15px * var(--es-scale, 1))">open_in_new</span>NotebookLM 열기</button>' +
    '<button onclick="annieAudioPick(\'' + dateId + '\')" class="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 inline-flex items-center gap-1"><span class="material-symbols-outlined" style="font-size:calc(15px * var(--es-scale, 1))">upload</span>' + (hasAudio ? '오디오 교체' : '오디오 올리기') + '</button>' +
    '<button onclick="annieSetNotebook(\'' + dateId + '\')" class="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 inline-flex items-center gap-1"><span class="material-symbols-outlined" style="font-size:calc(15px * var(--es-scale, 1))">link</span>' + (hasLink ? '링크 수정' : '노트북 링크') + '</button>';
  var inner =
    '<div class="flex items-center justify-between gap-3 mb-3 flex-wrap">' +
      '<div class="flex items-center gap-2"><span class="material-symbols-outlined text-violet-500">headphones</span><span class="text-sm font-bold text-slate-800">NotebookLM 오디오 오버뷰</span></div>' +
      '<div class="flex items-center gap-2 flex-wrap">' + setBtns + '</div>' +
    '</div>';
  if (hasAudio){
    inner += '<audio controls preload="none" src="' + s.audioUrl + '" style="width:100%;height:42px;border-radius:10px"></audio>' +
      '<div class="text-right mt-1"><button onclick="annieRemoveAudio(\'' + dateId + '\')" class="text-[11px] text-slate-400 hover:text-rose-500 underline">오디오 삭제</button></div>';
  }
  if (hasLink){
    inner += '<a href="' + s.notebookUrl + '" target="_blank" rel="noopener" class="inline-flex items-center gap-1.5 mt-2 px-4 py-2 rounded-full bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 transition-all shadow-sm"><span class="material-symbols-outlined" style="font-size:calc(18px * var(--es-scale, 1))">open_in_new</span>NotebookLM에서 듣기</a>';
  }
  if (!hasAudio && !hasLink){
    inner += '<p class="text-xs text-slate-400 leading-relaxed"><b>자동화 흐름:</b> ① <b>소스 복사</b> → ② <b>NotebookLM 열기</b> → 새 노트북 만들고 붙여넣기(Cmd+V) → 오디오 생성 → ③ 받은 mp3를 <b>올리거나(앱에서 바로 재생)</b> 공유 링크를 <b>붙이기(새 탭)</b>. 파일은 이 박스로 <b>끌어다 놓아도</b> 돼요.</p>';
  }
  // 오디오 오버뷰 프롬프트 (이 세션 자동 생성) — 접기로 숨김
  var nblmPrompt = engBuildNblmPrompt(dateId);
  inner += '<details class="mt-3" style="border:1px solid #ede9fe;border-radius:12px;overflow:hidden">' +
    '<summary style="cursor:pointer;list-style:none;padding:10px 14px;font-size:13px;font-weight:700;color:#6d28d9;background:rgba(139,92,246,0.06);display:flex;align-items:center;gap:6px"><span class="material-symbols-outlined" style="font-size:18px">tune</span>오디오 오버뷰 프롬프트 (이 세션 자동 생성 · 펼쳐서 복사)</summary>' +
    '<div style="padding:12px 14px">' +
      '<div class="flex items-center gap-2 mb-2 flex-wrap">' +
        '<button onclick="engCopyNblmPrompt(\'' + dateId + '\')" class="text-xs font-bold px-3 py-1.5 rounded-lg bg-violet-600 text-white hover:bg-violet-700 inline-flex items-center gap-1"><span class="material-symbols-outlined" style="font-size:calc(15px * var(--es-scale, 1))">content_copy</span>프롬프트 복사</button>' +
        '<span class="text-[11px] text-slate-400">NotebookLM → 오디오 오버뷰 → 맞춤설정에 붙여넣기</span>' +
      '</div>' +
      '<pre style="white-space:pre-wrap;word-break:break-word;font-size:12px;line-height:1.55;color:#475569;background:#f8fafc;border:1px solid #eef2ff;border-radius:8px;padding:12px;max-height:280px;overflow:auto;margin:0;font-family:ui-monospace,SFMono-Regular,Menlo,monospace">' + _esEscHtml(nblmPrompt) + '</pre>' +
    '</div>' +
  '</details>';
  inner += '<input type="file" id="annie-audio-file-' + dateId + '" accept="audio/*" style="display:none" onchange="annieAudioUpload(\'' + dateId + '\', this.files && this.files[0])"/>';
  return '<div id="annie-audio-box-' + dateId + '" class="mb-8 p-5 rounded-2xl border border-violet-100" style="background:linear-gradient(135deg,rgba(139,92,246,0.06),rgba(99,102,241,0.04))" ondragover="annieAudioDragOver(event)" ondragleave="annieAudioDragLeave(event)" ondrop="annieAudioDrop(event,\'' + dateId + '\')">' + inner + '</div>';
}
window.annieAudioHtml = annieAudioHtml;

// ── NotebookLM 소스 자동 생성 ─────────────────────────────
// 세션 리포트 8개 섹션을 NotebookLM에 붙여넣을 플레인 텍스트로 변환.
function _esStripTags(t){
  if (!t) return '';
  return String(t)
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ')
    .trim();
}

function engBuildNotebookSource(dateId){
  var s = (typeof engSessionsData !== 'undefined') ? engSessionsData.find(function(x){ return x._id === dateId; }) : null;
  if (!s) return '';
  var L = [], strip = _esStripTags;
  function enOf(x){ return (x && typeof x === 'object') ? (x.en||'') : (x||''); }
  function krOf(x){ return (x && typeof x === 'object') ? (x.kr||'') : ''; }

  L.push('# ' + (s.title || 'Untitled'));
  if (s.subtitle) L.push(strip(s.subtitle));
  L.push('세션 날짜: ' + dateId);
  var lv = s.level || {};
  L.push('레벨 — Fluency ' + (lv.fluency||'-') + ' / Vocab ' + (lv.vocab||'-') + ' / Grammar ' + (lv.grammar||'-') + ' / Interaction ' + (lv.interaction||'-'));
  L.push('');

  var sum = s.summary || {};
  L.push('## 01. Summary (총평)');
  if (sum.heading) L.push('### ' + strip(sum.heading));
  if (sum.p1) L.push(strip(sum.p1));
  if (sum.p2) L.push(strip(sum.p2));
  if (sum.kr) L.push('[KR] ' + strip(sum.kr));
  L.push('');

  var exprs = s.expressions || [];
  if (exprs.length){
    L.push('## 02. Expressions (유용한 표현)');
    exprs.forEach(function(ex){
      L.push('- [' + strip(ex.cat) + '] ' + strip(ex.expr) + (ex.freq ? ' (' + ex.freq + ')' : '') + ' — ' + strip(ex.kr));
      if (ex.ex) L.push('  예: ' + strip(ex.ex) + (ex.exKr ? ' / ' + strip(ex.exKr) : ''));
    });
    if (s.expressionsKr) L.push('[KR] ' + strip(s.expressionsKr));
    L.push('');
  }

  var upgs = s.upgrades || [];
  if (upgs.length){
    L.push('## 03. Upgrades (문장 업그레이드)');
    upgs.forEach(function(u){
      if (u.bad) L.push('- (X) ' + strip(u.bad));
      if (u.ok)  L.push('  (O) ' + strip(u.ok) + (u.okKr ? ' — ' + strip(u.okKr) : ''));
      if (u.gem) L.push('  (gem) ' + strip(u.gem) + (u.gemKr ? ' — ' + strip(u.gemKr) : ''));
      if (u.note) L.push('  ' + strip(u.note));
      if (u.noteKr) L.push('  ' + strip(u.noteKr));
    });
    if (s.upgradesKr) L.push('[KR] ' + strip(s.upgradesKr));
    L.push('');
  }

  var grams = s.grammar || [];
  if (grams.length){
    L.push('## 04. Grammar (문법)');
    grams.forEach(function(g){
      L.push('### ' + strip(g.title));
      if (g.rule) L.push('Rule: ' + strip(g.rule));
      if (g.ruleKr) L.push(strip(g.ruleKr));
      (g.examples||[]).forEach(function(ex){ L.push('  - ' + strip(ex)); });
    });
    if (s.grammarKr) L.push('[KR] ' + strip(s.grammarKr));
    L.push('');
  }

  var cs = s.convoSkills || {};
  if ((cs.followups&&cs.followups.length) || (cs.reactions&&cs.reactions.length) || (cs.starters&&cs.starters.length)){
    L.push('## 05. Convo Skills (대화 스킬)');
    if (cs.followups && cs.followups.length){
      L.push('### Follow-up Questions');
      cs.followups.forEach(function(f){ L.push('- ' + strip(enOf(f)) + (krOf(f) ? ' (' + strip(krOf(f)) + ')' : '')); });
    }
    if (cs.reactions && cs.reactions.length){
      L.push('### Richer Reactions');
      cs.reactions.forEach(function(r){ L.push('- ' + strip(r.feel) + (r.feelKr ? ' (' + strip(r.feelKr) + ')' : '') + ' -> ' + strip(r.say) + (r.kr ? ' (' + strip(r.kr) + ')' : '')); });
    }
    if (cs.starters && cs.starters.length){
      L.push('### C1 Sentence Starters');
      cs.starters.forEach(function(st){ L.push('- ' + strip(enOf(st)) + (krOf(st) ? ' (' + strip(krOf(st)) + ')' : '')); });
    }
    if (cs.kr) L.push('[KR] ' + strip(cs.kr));
    L.push('');
  }

  var vsets = s.vocabSets || [];
  if (vsets.length){
    L.push('## 06. Vocab (어휘)');
    vsets.forEach(function(vs){
      L.push('### ' + strip(vs.topic) + (vs.topicKr ? ' (' + strip(vs.topicKr) + ')' : ''));
      (vs.words||[]).forEach(function(w){
        var line = '- ' + strip(w.word) + ': ' + strip(w.mean);
        if (w.coll) line += ' | ' + strip(w.coll);
        if (w.syn) line += ' | 유의어: ' + strip(w.syn);
        L.push(line);
        if (w.ex) L.push('  예: ' + strip(w.ex) + (w.exKr ? ' / ' + strip(w.exKr) : ''));
      });
    });
    if (s.vocabKr) L.push('[KR] ' + strip(s.vocabKr));
    L.push('');
  }

  var drills = s.drills || [];
  if (drills.length){
    L.push('## 07. Drills (연습 문제)');
    drills.forEach(function(d){
      L.push('### ' + strip(d.title));
      (d.items||[]).forEach(function(it, i){
        L.push((i+1) + '. ' + strip(it.q));
        if (it.a) L.push('   정답: ' + strip(it.a) + (it.explainKr ? ' — ' + strip(it.explainKr) : ''));
      });
    });
    if (s.drillsKr) L.push('[KR] ' + strip(s.drillsKr));
    L.push('');
  }

  var goals = s.goals || [];
  if (goals.length){
    L.push('## 08. Next Goals (다음 목표)');
    goals.forEach(function(g, i){ L.push((i+1) + '. ' + strip(g.title) + (g.desc ? ' — ' + strip(g.desc) : '')); });
    if (s.goalsKr) L.push('[KR] ' + strip(s.goalsKr));
  }

  return L.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}
window.engBuildNotebookSource = engBuildNotebookSource;

window.engCopyNotebookSource = async function(dateId){
  var text = engBuildNotebookSource(dateId);
  if (!text){ if (typeof showSyncToast === 'function') showSyncToast('<span class="material-symbols-outlined text-sm mr-1">warning</span> 복사할 내용을 못 찾았어요'); return; }
  var ok = function(){ if (typeof showSyncToast === 'function') showSyncToast('<span class="material-symbols-outlined text-sm mr-1">check_circle</span> 소스 복사됨! NotebookLM에 붙여넣으세요 (Cmd+V)'); };
  try {
    await navigator.clipboard.writeText(text);
    ok();
  } catch(e){
    // 클립보드 권한 막혔을 때 폴백
    try {
      var ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.focus(); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta); ok();
    } catch(e2){
      window.prompt('아래 내용을 복사하세요 (Cmd+C → Enter):', text);
    }
  }
};

window.engOpenNotebookLM = function(){
  window.open('https://notebooklm.google.com/', '_blank', 'noopener');
};

// ── NotebookLM 오디오 오버뷰 프롬프트 (세션 자동 채움) ──────────
// 고정 지침(1타 강사 스타일·한국어 40/60·반복·리캡·페이싱)은 그대로,
// 소스 설명 + GROUP 표현 목록은 그 세션 데이터(expressions cat별)로 채운다.
function _esEscHtml(t){
  return String(t == null ? '' : t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function engBuildNblmPrompt(dateId){
  var s = (typeof engSessionsData !== 'undefined') ? engSessionsData.find(function(x){ return x._id === dateId; }) : null;
  if (!s) return '';
  var strip = _esStripTags;
  var title = strip(s.title) || 'this lesson';

  // GROUP 자동 생성 — expressions를 cat(테마)별로 묶어 표현 나열
  var exprs = s.expressions || [];
  var order = [], byCat = {};
  exprs.forEach(function(ex){
    var cat = strip(ex.cat) || '기타';
    if (!byCat[cat]) { byCat[cat] = []; order.push(cat); }
    if (ex.expr) byCat[cat].push('"' + strip(ex.expr) + '"');
  });
  var groupText = order.length
    ? order.map(function(cat, i){ return 'GROUP ' + (i+1) + ' — ' + cat + ':\n' + byCat[cat].join(', '); }).join('\n\n')
    : '(이 세션에 추출된 표현이 없습니다 — 트랜스크립트에서 직접 골라 가르쳐 주세요.)';

  var srcLine = 'This source is an English transcript titled "' + title + '".';
  if (s.subtitle) srcLine += '\n' + strip(s.subtitle);

  return [
    srcLine,
    '',
    'I am a KOREAN learner studying English for overseas job interviews (intermediate-advanced level). I want to learn AS MANY useful expressions as possible from this source — do not trim the list down for me.',
    '',
    'CRITICAL INSTRUCTION ABOUT LANGUAGE:',
    '- The hosts must speak primarily in KOREAN (about 40% Korean / 60% English).',
    '- ALL explanations, nuance, and teaching must be in KOREAN so I understand instantly.',
    '- The English portion should be the target expressions themselves, the exact quotes from the transcript, and the example sentences.',
    '- Pattern for each expression: say the English expression -> explain what it means IN KOREAN -> explain the nuance IN KOREAN -> give an English example sentence -> briefly explain that sentence IN KOREAN.',
    '',
    'DO NOT summarize the discussion. This is an ENGLISH VOCABULARY LESSON.',
    '',
    'TEACHING STYLE — very important:',
    '- Teach like a top Korean "1타 강사" (star instructor): energetic, warm, memorable.',
    '- NEVER mention an expression just once and move on. For EACH expression, repeat the English phrase at least 3 times across the explanation, come back to it, and reinforce it so it actually sticks.',
    '- Explain WHY a Korean learner would NOT naturally produce this phrase, and how it differs from how we would say it in Korean.',
    '- Keep the energy high and conversational, like two Korean teachers getting excited about good expressions.',
    '',
    'CONTENT — teach ALL of the following items (do not cut any), grouped. For each group, introduce IN KOREAN why this group matters:',
    '',
    groupText,
    '',
    'ENDING — full review, NOT a shortlist:',
    '- Do a rapid-fire recap that goes back through EVERY expression taught in this lesson, in order, group by group.',
    '- For each one: say the English phrase, then a 3-5 word Korean reminder of its meaning. Keep it fast and rhythmic so the whole list cycles through my memory one more time.',
    '- Korean intro for this section, e.g. "자, 오늘 배운 거 하나도 빠짐없이 싹 다시 갑니다. 빠르게 갈 테니까 따라오세요."',
    '- Do NOT pick just a few favorites — review the complete list.',
    '',
    'PACING:',
    '- Speak slowly during teaching. Pause between expressions.',
    '- Pronounce every English phrase clearly and slowly enough for me to shadow.'
  ].join('\n');
}
window.engBuildNblmPrompt = engBuildNblmPrompt;

async function _esCopyText(text, okMsg){
  var done = function(){ if (typeof showSyncToast === 'function') showSyncToast('<span class="material-symbols-outlined text-sm mr-1">check_circle</span> ' + okMsg); };
  try { await navigator.clipboard.writeText(text); done(); }
  catch(e){
    try {
      var ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.focus(); ta.select();
      document.execCommand('copy'); document.body.removeChild(ta); done();
    } catch(e2){ window.prompt('아래 내용을 복사하세요 (Cmd+C → Enter):', text); }
  }
}

window.engCopyNblmPrompt = function(dateId){
  var t = engBuildNblmPrompt(dateId);
  if (!t){ if (typeof showSyncToast === 'function') showSyncToast('<span class="material-symbols-outlined text-sm mr-1">warning</span> 프롬프트를 만들 수 없어요'); return; }
  _esCopyText(t, '프롬프트 복사됨! NotebookLM 오디오 오버뷰 맞춤설정에 붙여넣으세요');
};

window.annieAudioPick = function(dateId){ var el = document.getElementById('annie-audio-file-' + dateId); if (el) el.click(); };
window.annieAudioDragOver = function(e){ e.preventDefault(); if (e.currentTarget) e.currentTarget.style.outline = '2px dashed #8b5cf6'; };
window.annieAudioDragLeave = function(e){ if (e.currentTarget) e.currentTarget.style.outline = ''; };
window.annieAudioDrop = function(e, dateId){
  e.preventDefault();
  if (e.currentTarget) e.currentTarget.style.outline = '';
  var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
  if (f) annieAudioUpload(dateId, f);
};

window.annieAudioUpload = async function(dateId, file){
  if (!file) return;
  if (!/audio\//.test(file.type) && !/\.(mp3|m4a|wav|aac|ogg)$/i.test(file.name)){
    if (typeof showSyncToast === 'function') showSyncToast('<span class="material-symbols-outlined text-sm mr-1">warning</span> 오디오 파일만 올릴 수 있어요');
    return;
  }
  if (!window.storage){ alert('Firebase Storage가 초기화되지 않았어요.'); return; }
  if (file.size > 80 * 1024 * 1024){ if (typeof showSyncToast === 'function') showSyncToast('<span class="material-symbols-outlined text-sm mr-1">warning</span> 파일이 너무 커요 (80MB 이하)'); return; }
  if (typeof showSyncToast === 'function') showSyncToast('<span class="material-symbols-outlined text-sm mr-1">upload</span> 오디오 업로드 중...');
  try {
    var ext = (file.name.split('.').pop() || 'mp3').toLowerCase().replace(/[^a-z0-9]/g, '') || 'mp3';
    var ref = window.storage.ref('annie-audio/' + dateId + '.' + ext);
    await ref.put(file);
    var url = await ref.getDownloadURL();
    await db.collection('englishSessions').doc(dateId).set({ audioUrl: url }, { merge: true });
    var s = (typeof engSessionsData !== 'undefined') ? engSessionsData.find(function(x){ return x._id === dateId; }) : null;
    if (s) s.audioUrl = url;
    if (typeof showSyncToast === 'function') showSyncToast('<span class="material-symbols-outlined text-sm mr-1">check_circle</span> 오디오 추가됐어요!');
    if (typeof openSessionDetail === 'function') openSessionDetail(dateId);
  } catch(err){
    console.error('[annieAudio] upload failed', err);
    var denied = err && (err.code === 'storage/unauthorized' || /unauthor|permission|denied/i.test(err.message || ''));
    if (denied){
      alert('Storage 쓰기 권한이 막혀 있어요.\n\nFirebase 콘솔 → Storage → Rules 에 아래를 붙여넣고 게시(Publish):\n\nrules_version = "2";\nservice firebase.storage {\n  match /b/{bucket}/o {\n    match /annie-audio/{f} {\n      allow read, write: if true;\n    }\n  }\n}');
    } else {
      alert('업로드 실패: ' + (err && err.message ? err.message : '알 수 없는 오류'));
    }
  }
};

window.annieSetNotebook = async function(dateId){
  var s = (typeof engSessionsData !== 'undefined') ? engSessionsData.find(function(x){ return x._id === dateId; }) : null;
  var cur = (s && s.notebookUrl) || '';
  var url = window.prompt('NotebookLM 공유 링크를 붙여넣으세요 (비우면 삭제):', cur);
  if (url === null) return;
  url = url.trim();
  try {
    await db.collection('englishSessions').doc(dateId).set({ notebookUrl: url }, { merge: true });
    if (s) s.notebookUrl = url;
    if (typeof showSyncToast === 'function') showSyncToast('<span class="material-symbols-outlined text-sm mr-1">check_circle</span> ' + (url ? '링크 저장됨' : '링크 삭제됨'));
    if (typeof openSessionDetail === 'function') openSessionDetail(dateId);
  } catch(err){ alert('저장 실패: ' + (err && err.message ? err.message : '')); }
};

window.annieRemoveAudio = async function(dateId){
  if (!window.confirm('오디오를 삭제할까요?')) return;
  try {
    await db.collection('englishSessions').doc(dateId).set({ audioUrl: '' }, { merge: true });
    var s = (typeof engSessionsData !== 'undefined') ? engSessionsData.find(function(x){ return x._id === dateId; }) : null;
    if (s) s.audioUrl = '';
    if (typeof showSyncToast === 'function') showSyncToast('<span class="material-symbols-outlined text-sm mr-1">check_circle</span> 오디오 삭제됨');
    if (typeof openSessionDetail === 'function') openSessionDetail(dateId);
  } catch(err){ alert('삭제 실패: ' + (err && err.message ? err.message : '')); }
};
