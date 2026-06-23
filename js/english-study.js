// ═══════════════════════════════════════════════════════════
//  ENGLISH › STUDY — 유튜브 뉴스/인터뷰 스크립트 → "1타 강사" 정리
//  ANNIE(회화 리뷰)와 분리. 저장: Firestore `englishStudy` 컬렉션.
//  생성: Anthropic(Opus 4.7) — ANNIE 파이프라인과 동일 패턴.
// ═══════════════════════════════════════════════════════════

var STUDY_PROMPT_TEMPLATE = `You are Korea's #1 English instructor ("1타 강사") making a vivid, sticky study sheet for Nuri — a Korean fashion designer aiming for C1 English and preparing to job-hunt abroad (EU / Canada / Australia: interviews, portfolio talk). She studies from YouTube English news / interviews / talks (transcript below).

Your job: mine the transcript for the expressions WORTH STEALING and teach each one like a charismatic top instructor drilling it into her ears and head — NOT a dry dictionary. Output EXACTLY ONE JavaScript object matching the schema. No preamble, just one fenced \`\`\`js code block with the assignment statement.

=== TEACHING STYLE (CRITICAL — THIS IS THE WHOLE POINT) ===
- Group the expressions into 3–6 themed categories YOU choose for THIS content. Good recurring themes (use when they fit, but adapt freely): "한국어 직역으로는 안 나오는 관용구", "한 단어가 한 문장을 이긴다 — 고급 압축 어휘", "비유 한 방으로 머리에 박는 표현", "토론·회의에서 내 의견 꺼낼 때 쓰는 문장 틀". Each group gets a short "왜 중요한지" hook in instructor voice (the "why").
- For EACH expression, in warm Korean instructor voice (NOT just one-line meaning):
  · stars: 빈도 별점 integer 1–5 (5=초고빈도/매일, 4=꽤 흔함, 3=상황별, 2=글·격식, 1=드묾·showy). freqLabel: short note ("꽤 흔함, 직장 영어 단골").
  · literal(직역) → meaning(진짜 뜻). When literal hides the meaning, that contrast IS the lesson.
  · image: 그림·장면으로 외우게 하라. ("누가 너를 수영장 한가운데 풍덩 던졌어 — 튜브도 강습도 없어…")
  · contrast: 한국인이 흔히 하는 밋밋한 표현 vs 원어민의 이 표현. ("한국인은 'I had to figure it out alone' — 원어민은 sink or swim 한 방.") 없으면 "".
  · source: 본문(transcript)에서 이 표현이 나온 부분 인용. 없으면 "".
  · examples: 예문 폭탄 3–4개. 각 {en, kr, tag}. Nuri 삶(패션 디자이너·이직·면접·포트폴리오)에 맞는 예문을 적극적으로 섞어라. tag = 상황("면접","디자인","이직","일상","회의") 또는 "".
  · related: 비슷한 표현·변형·반대말·전치사 따라 뜻 갈리는 것 [{label, note}]. note에 빈도(⭐)나 미국식/영국식 적어주면 좋음. 없으면 [].
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
          image: "그림·장면으로 외우게 하는 설명.",
          contrast: "한국인 밋밋 표현 vs 원어민 표현 대비.",
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
            '<span class="material-symbols-outlined text-violet-500" style="font-size:18px">' + typeIcon + '</span>' +
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
  return '<button class="es-spk align-middle text-violet-400 hover:text-violet-600" data-text="' + _esEscAttr(_esStripHtml(text)) + '" data-lang="' + (lang || 'en-US') + '" onclick="engSpeakBtn(this)" title="듣기"><span class="material-symbols-outlined" style="font-size:16px;vertical-align:middle">volume_up</span></button>';
}

function renderStudyDetail(s){
  var H = '';
  // 헤더 + 전체 듣기
  H += '<div class="flex justify-between items-start gap-4 mb-6 flex-wrap">' +
    '<div>' +
      '<p class="text-xs font-bold text-violet-600 uppercase tracking-wider mb-2">Content Study · ' + (s.date || '') + (s.sourceType ? ' · ' + s.sourceType : '') + '</p>' +
      '<h2 class="text-3xl font-extrabold font-headline text-slate-900 tracking-tight mb-2">' + (s.title || 'Untitled') + '</h2>' +
      (s.subtitle ? '<p class="text-sm text-slate-500">' + s.subtitle + '</p>' : '') +
      (s.source ? '<p class="text-xs text-slate-400 mt-1">' + s.source + '</p>' : '') +
    '</div>' +
    '<div class="flex items-center gap-2 shrink-0">' +
      '<button onclick="engSpeakStudy(\'' + s._id + '\')" class="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-violet-600 text-white text-sm font-bold hover:bg-violet-700 transition-all shadow"><span class="material-symbols-outlined" style="font-size:18px">play_arrow</span>전체 듣기</button>' +
      '<button onclick="engStopSpeak()" class="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 transition-all" title="정지"><span class="material-symbols-outlined" style="font-size:18px">stop</span></button>' +
    '</div>' +
  '</div>';

  if (s.intro) H += '<div class="mb-6 p-4 rounded-xl border-l-4 border-violet-400" style="background:rgba(139,92,246,0.06)"><p class="text-sm text-slate-700 leading-relaxed">' + s.intro + '</p></div>';

  (s.groups || []).forEach(function(g, gi){
    H += '<section class="mb-8">' +
      '<div class="mb-4">' +
        '<h3 class="text-lg font-bold text-slate-900 font-headline flex items-center gap-2"><span class="text-violet-300 font-extrabold">' + String(gi + 1).padStart(2, '0') + '</span>' + (g.title || '') + '</h3>' +
        (g.why ? '<p class="text-xs text-slate-500 mt-1 leading-relaxed">' + g.why + '</p>' : '') +
      '</div>';

    (g.items || []).forEach(function(it){
      H += '<div class="bg-white rounded-2xl border border-slate-100 p-5 mb-4" style="box-shadow:var(--shadow-card-sm)">';
      // 표현 + 별점
      H += '<div class="flex items-center gap-2 flex-wrap mb-2">' +
        '<span class="text-lg font-bold text-slate-900">' + (it.expr || '') + '</span>' +
        _esSpk(it.expr, 'en-US') +
        (it.stars ? '<span class="text-sm" title="' + _esEscAttr(it.freqLabel || '') + '">' + _esStars(it.stars) + '</span>' : '') +
        (it.freqLabel ? '<span class="text-[11px] text-slate-400">' + it.freqLabel + '</span>' : '') +
      '</div>';
      // 직역 → 뜻
      if (it.literal || it.meaning){
        H += '<p class="text-sm text-slate-700 mb-2">' +
          (it.literal ? '<span class="text-slate-400">직역:</span> ' + it.literal + ' <span class="text-slate-300">→</span> ' : '') +
          '<span class="font-bold">' + (it.meaning || '') + '</span></p>';
      }
      if (it.image) H += '<div class="text-sm text-slate-600 leading-relaxed mb-2 p-3 rounded-lg bg-amber-50/60 border border-amber-100">🧠 ' + it.image + '</div>';
      if (it.contrast) H += '<p class="text-sm text-slate-600 leading-relaxed mb-2">🇰🇷↔🇬🇧 ' + it.contrast + '</p>';
      if (it.source) H += '<p class="text-xs text-slate-400 italic mb-2 pl-3 border-l-2 border-slate-200">📍 ' + it.source + '</p>';
      // 예문 폭탄
      if ((it.examples || []).length){
        H += '<div class="space-y-1.5 mb-1 mt-2">';
        it.examples.forEach(function(ex){
          H += '<div class="flex items-start gap-2 text-sm">' +
            '<span class="text-violet-400 mt-0.5">🎯</span>' +
            '<div class="flex-1">' +
              '<span class="text-slate-800">' + (ex.en || '') + '</span> ' + _esSpk(ex.en, 'en-US') +
              (ex.tag ? ' <span class="text-[9px] font-bold bg-indigo-50 text-indigo-500 px-1.5 py-0.5 rounded-full align-middle">' + ex.tag + '</span>' : '') +
              (ex.kr ? '<br><span class="text-xs text-slate-500">' + ex.kr + '</span>' : '') +
            '</div>' +
          '</div>';
        });
        H += '</div>';
      }
      // 관련/변형
      if ((it.related || []).length){
        H += '<div class="mt-2 pt-2 border-t border-slate-100">';
        it.related.forEach(function(r){
          H += '<p class="text-xs text-slate-600 mb-0.5">💡 <b>' + (r.label || '') + '</b>' + (r.note ? ' — ' + r.note : '') + '</p>';
        });
        H += '</div>';
      }
      if (it.warning) H += '<p class="text-xs text-amber-700 mt-2">⚠️ ' + it.warning + '</p>';
      if (it.outro) H += '<p class="text-sm text-violet-700 font-medium mt-3 pt-2 border-t border-violet-50">🔁 ' + it.outro + '</p>';
      H += '</div>';
    });
    H += '</section>';
  });

  // 보너스 꿀단어
  if ((s.bonus || []).length){
    H += '<section class="mb-8">' +
      '<h3 class="text-lg font-bold text-slate-900 font-headline mb-3">🍯 보너스 꿀단어</h3>' +
      '<div class="bg-white rounded-2xl border border-slate-100 p-5" style="box-shadow:var(--shadow-card-sm)">';
    s.bonus.forEach(function(b){
      H += '<div class="flex items-start gap-2 py-2 border-b border-slate-50">' +
        '<span class="font-bold text-slate-800 shrink-0">' + (b.expr || '') + '</span>' + _esSpk(b.expr, 'en-US') +
        (b.stars ? '<span class="text-xs shrink-0">' + _esStars(b.stars) + '</span>' : '') +
        '<div class="text-sm text-slate-600">' + (b.meaning || '') +
          (b.ex ? ' <span class="text-slate-400">· ' + b.ex + '</span> ' + _esSpk(b.ex, 'en-US') + (b.exKr ? ' <span class="text-xs text-slate-400">' + b.exKr + '</span>' : '') : '') +
        '</div>' +
      '</div>';
    });
    H += '</div></section>';
  }
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
  q.forEach(function(pair, i){
    var u = new SpeechSynthesisUtterance(_esStripHtml(pair[0]));
    u.lang = pair[1];
    u.rate = (pair[1] === 'ko-KR') ? 1.0 : 0.95;
    if (i === q.length - 1) u.onend = function(){ _esStopKeepAlive(); };
    window.speechSynthesis.speak(u);
  });
  _esStartKeepAlive();
};
