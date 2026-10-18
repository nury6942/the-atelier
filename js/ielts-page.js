// ═══ ENGLISH › IELTS 탭 (2026-10-18) ═══
// 정보는 전부 아래 IELTS 객체에 쌓는다. 새 내용 = 이 파일만 고치고 배포.
// 모의고사 점수는 mocks[n].score = {L:정답수, R:정답수, W:밴드, S:밴드} 로 채운다.
(function(){
  var IELTS = {
    updated: '2026-10-18',
    exam: { date: '2027-09-11', book: '2027-06-18', type: 'General Training · 컴퓨터 시험', fee: '321,000원 (IDP Korea)' },
    // 지금 = Cambridge C1 Advanced(2023-12) 영역 점수를 IELTS로 근사
    goals: [
      { k:'L', name:'Listening', now:6.5, pass:7.0, stretch:8.0, note:'40문항 중 30개 → 35개 · 차이 제일 큼', tone:'r' },
      { k:'R', name:'Reading (GT)', now:6.75, nowLabel:'6.5–7', pass:7.0, stretch:null, note:'34개 · GT는 지문 쉬운 대신 환산이 짜다', tone:'y' },
      { k:'W', name:'Writing', now:5.75, nowLabel:'5.5–6', pass:7.0, stretch:null, note:'+1.0~1.5 · 약점 1순위', tone:'r' },
      { k:'S', name:'Speaking', now:7.0, pass:7.0, stretch:7.5, note:'유지 (Annie)', tone:'g' }
    ],
    why: '캐나다 PR CLB 9 = L8.0 R7.0 W7.0 S7.0 · 호주 Proficient = 각 7.0 · 독일 adidas는 CV 한 줄. 각 7.0이면 합격, 듣기 8.0은 보너스.',
    stages: [
      { n:0, name:'형식', range:'~ 11-28', goal:'교재 앞 안내만 읽기 · 문제는 안 풂(1회를 깨끗한 진단으로)', check:'—', tone:'g' },
      { n:1, name:'틀', range:'#1–4', goal:'편지 3종 · 에세이 5유형 틀 외우기 · 듣기 함정 목록', check:'#4 듣기 30 · 읽기 31 · 쓰기 6.0', tone:'g' },
      { n:2, name:'약점', range:'#5–8', goal:'약점 상위 2유형만 · 쓰기 타이핑 전환', check:'#8 듣기 32 · 읽기 33 · 쓰기 6.5', tone:'y' },
      { n:3, name:'실력', range:'#9–13', goal:'시간 엄수 · 7점 체크리스트 후 제출 · 6/18 예약', check:'#13 듣기 34 · 읽기 34 · 쓰기 6.5–7.0', tone:'y' },
      { n:4, name:'실전', range:'#14–16', goal:'컴퓨터 화면·오전 시간대 그대로 · 새 공부 X', check:'#16 듣기 35 · 읽기 34+ · 쓰기 7.0', tone:'r' }
    ],
    rule: '#13에 쓰기 6.0이면 → 7월부터 Annie 수업 쓰기 첨삭 100%. 듣기가 32–33에 멈추면 → 8.0 내려놓고 7.5 확보, 남는 시간은 쓰기로.',
    mocks: [
      { n:1,  date:'2026-11-29', src:'GT 21 · Test 1', focus:'진단 — 준비 없이 시간 재고 풀기 → 약점표 첫 판', key:true },
      { n:2,  date:'2026-12-13', src:'GT 21 · Test 2', focus:'듣기 S1 만점(철자·숫자) · 편지 격식/비격식' },
      { n:3,  date:'2026-12-27', src:'GT 21 · Test 3', focus:'읽기 T/F/NG 근거 · 에세이 의견형' },
      { n:4,  date:'2027-01-17', src:'GT 21 · Test 4', focus:'1단계 점검 · 토론형·문제해결형', check:true },
      { n:5,  date:'2027-01-31', src:'GT 20 · Test 1', focus:'쓰기 타이핑 시작 · 듣기 지도/도면' },
      { n:6,  date:'2027-02-21', src:'GT 20 · Test 2', focus:'2월 유지 — 풀기만, 오답은 3월에' },
      { n:7,  date:'2027-03-14', src:'GT 20 · Test 3', focus:'약점 1위 유형 집중' },
      { n:8,  date:'2027-03-28', src:'GT 20 · Test 4', focus:'2단계 점검 · 약점 2위 유형', check:true },
      { n:9,  date:'2027-04-11', src:'BC IELTS Ready #1', focus:'시간 엄수 시작 (읽기 15·20·25분)' },
      { n:10, date:'2027-05-02', src:'IDP 무료 공식 모의', focus:'듣기 S4 강의 흐름' },
      { n:11, date:'2027-05-16', src:'BC IELTS Ready #2', focus:'읽기 S3 긴 지문 · 제목 고르기' },
      { n:12, date:'2027-05-30', src:'BC 컴퓨터 연습시험', focus:'화면 조작 익히기 · 장단점형·질문 2개형' },
      { n:13, date:'2027-06-13', src:'GT 22 · Test 1 (없으면 GT 19)', focus:'3단계 점검 → 판단 규칙 · 6/18 예약', check:true },
      { n:14, date:'2027-07-18', src:'GT 22 · Test 2', focus:'타이핑·화면 조건 그대로' },
      { n:15, date:'2027-08-22', src:'GT 22 · Test 3', focus:'오전 9시 시작, 실전 순서' },
      { n:16, date:'2027-09-05', src:'GT 22 · Test 4', focus:'마지막 리허설 — 끝나면 실수 노트만', check:true }
    ],
    cycle: [
      { when:'모의고사 주말', what:'모의고사 1세트 (2h30)' },
      { when:'수요일', what:'오답 + 편지 20분' },
      { when:'사이 주말', what:'에세이 40분 + 고쳐쓰기 + AI 말하기 20분' },
      { when:'매일', what:'출퇴근 듣기 15분 + Anki 10분' },
      { when:'PLM 야근 주', what:'없음 — 비움' }
    ],
    areas: [
      { k:'L', name:'Listening', star:true, shape:'4섹션 · 각 10문항 · 약 30분 · 한 번만',
        how:['섹션 전 빈 시간에 문제 먼저 · 핵심어 표시','빈칸 품사·단어 수 미리 예상','S1·S2 만점, 점수 차이는 S3·S4'],
        trap:'말 바꾸기 · 정정 함정("Tuesday — sorry, Thursday") · 철자·복수 s · 단어 수 초과' },
      { k:'R', name:'Reading GT', shape:'3섹션 · 40문항 · 60분',
        how:['시간 15 · 20 · 25분','질문 먼저 → 지문에서 찾기','1분 넘기면 표시하고 넘김'],
        trap:'False(반대 내용) ↔ Not Given(아예 없음) 혼동 · 핵심어만 같은 제목 오답' },
      { k:'W', name:'Writing', star:true, shape:'편지 150+ · 에세이 250+ · 60분',
        how:['에세이 먼저 40분 → 편지 20분','편지 160–190 · 에세이 260–300','제출 전 2분 체크리스트'],
        trap:'관사 · 복수 · 주어-동사 일치 · 쉼표로만 잇기 · 의견 흔들림 · 외운 티 나는 서론' },
      { k:'S', name:'Speaking', shape:'11–14분 · Part 1 · 2 큐카드 · 3 토론',
        how:['Part 2 메모 4칸: 언제·어디·무슨 일·왜','Part 3: 이유 + 예시 + 반대 경우','모르면: "That\'s an interesting question — I haven\'t thought about it much, but…"'],
        trap:'Part 1 답 너무 짧음 · Part 2 1분 만에 끝 · 침묵' }
    ],
    writing: {
      tasks: [
        { name:'Task 1 · 편지', meta:'20분 · 150단어+', ex:'노트북 고장 → 매장에 편지: 언제 샀는지 / 무슨 문제 / 원하는 해결',
          types:'격식(회사·기관) · 반격식(집주인·동료) · 비격식(친구) — Dear ~ 와 끝인사가 유형에 맞아야',
          frame:['인사','쓰는 이유 1줄','bullet 3개 = 문단 3개','마무리','끝인사'] },
        { name:'Task 2 · 에세이', meta:'40분 · 250단어+ · 비중 2배', ex:'재택근무가 회사와 직원 모두에게 좋은가?',
          types:'의견형 · 양쪽 토론형 · 문제-해결형 · 장단점형 · 질문 2개형',
          frame:['서론: 질문 바꿔 말하기 + 내 입장','본론 1: 주장 + 예시','본론 2: 주장 + 예시','결론'] }
      ],
      checklist: [
        { c:'과제 수행', seven:'편지 bullet 3개 다 · 에세이 입장 처음부터 끝까지 같음', self:'bullet 3개 체크 / 서론·결론 입장 같나' },
        { c:'글 흐름', seven:'문단마다 핵심 하나 · 연결어 남발 X', self:'문단 첫 문장만 읽어도 흐름이 보이나' },
        { c:'어휘', seven:'덜 흔한 표현을 맞는 짝으로 (pose a risk · a growing number of)', self:'같은 단어 3번 이상 없나' },
        { c:'문법', seven:'복문 자주 · 오류 없는 문장이 대부분', self:'관사 · 복수 s · 시제 — 실수 노트 상위 3개' }
      ],
      rule: 'AI 없이 내 손으로 먼저 다 쓰고, 채점만 AI. #5부터는 전부 타이핑(맥 메모장 + 타이머, 맞춤법 검사 끔).'
    },
    resources: [
      { name:'Cambridge IELTS GT 21', kind:'책', tag:'g', use:'#1–4', url:null },
      { name:'Cambridge IELTS GT 20', kind:'책', tag:'g', use:'#5–8', url:null },
      { name:'Cambridge IELTS GT 22', kind:'책', tag:'y', use:'#13–16 · 2027 여름 출간 예상, 6월까지 없으면 GT 19', url:null },
      { name:'British Council', kind:'공식 · 무료', tag:'g', use:'IELTS Ready 모의 + 진짜 컴퓨터 시험 화면 연습 → #9 · #11 · #12', url:'https://takeielts.britishcouncil.org/take-ielts/prepare' },
      { name:'IDP 무료 공식 모의', kind:'공식 · 무료', tag:'g', use:'#10', url:'https://ielts.idp.com/prepare' },
      { name:'IELTS Liz', kind:'전직 시험관 블로그 · 무료', tag:'g', use:'GT 편지 강의 · 말하기 답 틀 → #1–4 틀 잡기. "General Training" 글만', url:'https://ieltsliz.com' },
      { name:'IELTS Simon', kind:'전직 시험관 블로그 · 무료', tag:'g', use:'에세이 모범답 · 어휘 짝 → 에세이 주말에 1편 베껴 쓰기', url:'https://ielts-simon.info' },
      { name:'ieltsonlinetests.com', kind:'비공식 · 시험 무료', tag:'y', use:'시간 배분 연습만 · 점수 환산은 믿지 말 것', url:'https://ieltsonlinetests.com' },
      { name:'ieltslab.study (prepedu)', kind:'광고 링크 · AI 채점 앱', tag:'r', use:'안 씀 — AI 채점은 아래 프롬프트로 0원', url:null },
      { name:'Anki', kind:'맥 무료', tag:'g', use:'AI 교정·오답에서 나온 표현만 · 하루 10분', url:'https://apps.ankiweb.net' }
    ],
    resourcesNote: 'Academic판 책·글은 보지 말 것 — GT 쓰기 Task 1은 그래프가 아니라 편지. 듣기·말하기는 Academic과 같음.',
    prompt: "You are a certified IELTS General Training examiner. Grade my response strictly with the official public band descriptors.\n\nTask: [Task 1 letter / Task 2 essay] — Question: [paste question]\n\n1. Give a band (0.5 steps) for each criterion: Task Achievement/Response, Coherence & Cohesion, Lexical Resource, Grammatical Range & Accuracy — and the overall band. Quote the exact sentences that cap each score.\n2. List my 3 most important recurring errors, each with one corrected example.\n3. Rewrite my response at Band 7.5, keeping my ideas and structure, and mark every change in **bold**.\n4. Give me 5 phrases from your rewrite worth memorising, with Korean meaning.\nBe strict — do not inflate the score.\n\nMy response:\n[paste]",
    facts: [
      { k:'시험', v:'General Training · 컴퓨터 시험(CD) · 결과 3–5일' },
      { k:'듣기 주의', v:'컴퓨터 시험은 답 옮겨 적는 10분 없음, 마지막 2분 확인뿐 · 철자 그대로 채점' },
      { k:'응시료', v:'321,000원 (IDP Korea)' },
      { k:'예약', v:'2027-06-18 (여행 전)' },
      { k:'유효', v:'캐나다 2년 · 호주 3년 → 2029-01 출국까지 OK' },
      { k:'재응시', v:'한 영역만 모자라면 27-11 ~ 28 초. One Skill Retake 이민 인정 여부는 미확인' },
      { k:'영국', v:'우선순위 낮음 · 오퍼 오면 IELTS for UKVI(영역별 5.5) 따로' },
      { k:'다른 시험', v:'PTE·CELPIP으로 못 퉁침 (나라마다 인정 시험이 다름)' }
    ],
    log: [
      { d:'2026-10-18', t:'IELTS 탭 생성 · 무료 사이트 5곳 검토 (Liz·Simon 추가, ieltslab은 광고라 제외)' },
      { d:'2026-10-12', t:'합격선 각 7.0 · 듣기 8.0 도전 · 컴퓨터 시험 · 책 3권 · 모의고사 16회 확정' }
    ]
  };

  var TONE = { g:'#15803d', y:'#b45309', r:'#b91c1c' };
  var TONE_BG = { g:'#ecfdf3', y:'#fffbeb', r:'#fef2f2' };
  function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
  function today(){ var d=new Date(); d.setHours(0,0,0,0); return d; }
  function parse(s){ var p=s.split('-'); return new Date(+p[0],+p[1]-1,+p[2]); }
  function dday(s){ return Math.round((parse(s)-today())/86400000); }
  function md(s){ var p=s.split('-'); return (+p[1])+'/'+(+p[2]); }
  function band(v){ return v==null?'—':(v%1===0?v.toFixed(1):String(v)); }

  function css(){
    if (document.getElementById('ielts-style')) return;
    var st=document.createElement('style'); st.id='ielts-style';
    st.textContent = [
      '#eng-ielts-view{color:var(--atl-text,#16161A)}',
      '#eng-ielts-view .ie-sec{margin:0 0 40px}',
      '#eng-ielts-view .ie-h{display:flex;align-items:baseline;gap:10px;font-size:13px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;margin:0 0 14px;padding-bottom:8px;border-bottom:1px solid var(--atl-text,#16161A)}',
      '#eng-ielts-view .ie-h small{font-size:12px;font-weight:500;letter-spacing:0;text-transform:none;color:var(--atl-text-2,#5B5B66)}',
      '#eng-ielts-view .ie-sub{color:var(--atl-text-2,#5B5B66);font-size:13px;line-height:1.6}',
      '#eng-ielts-view .ie-hero{display:grid;grid-template-columns:minmax(220px,300px) 1fr;gap:0;border:1px solid var(--atl-line-strong,#DCDCE3);margin-bottom:40px}',
      '#eng-ielts-view .ie-dd{background:var(--atl-accent,#1F4BD8);color:#fff;padding:28px}',
      '#eng-ielts-view .ie-dd .n{font-size:64px;font-weight:800;line-height:1;letter-spacing:-.03em}',
      '#eng-ielts-view .ie-dd .l{font-size:13px;font-weight:600;opacity:.9;margin-top:10px}',
      '#eng-ielts-view .ie-dd .next{margin-top:22px;padding-top:14px;border-top:1px solid rgba(255,255,255,.35);font-size:13px;line-height:1.5}',
      '#eng-ielts-view .ie-goals{padding:22px 28px}',
      '#eng-ielts-view .ie-g{display:grid;grid-template-columns:110px 1fr 88px;gap:14px;align-items:center;padding:9px 0}',
      '#eng-ielts-view .ie-g .nm{font-size:13px;font-weight:700}',
      '#eng-ielts-view .ie-g .nt{font-size:11.5px;color:var(--atl-text-2,#5B5B66);margin-top:2px;font-weight:500}',
      '#eng-ielts-view .ie-bar{position:relative;height:10px;background:var(--atl-surface,#F8F8FA);border:1px solid var(--atl-line,#ECECF0)}',
      '#eng-ielts-view .ie-bar .now{position:absolute;left:0;top:0;bottom:0}',
      '#eng-ielts-view .ie-bar .tick{position:absolute;top:-5px;bottom:-5px;width:2px;background:var(--atl-text,#16161A)}',
      '#eng-ielts-view .ie-bar .tick.s{background:none;border-left:2px dotted var(--atl-text,#16161A)}',
      '#eng-ielts-view .ie-g .sc{font-size:13px;font-weight:700;text-align:right;font-variant-numeric:tabular-nums}',
      '#eng-ielts-view .ie-legend{display:flex;gap:16px;flex-wrap:wrap;font-size:11.5px;color:var(--atl-text-2,#5B5B66);margin-top:10px}',
      '#eng-ielts-view .ie-legend i{display:inline-block;width:12px;height:10px;vertical-align:-1px;margin-right:5px}',
      '#eng-ielts-view .ie-stages{display:grid;grid-template-columns:repeat(5,1fr);border:1px solid var(--atl-line-strong,#DCDCE3)}',
      '#eng-ielts-view .ie-st{padding:14px 16px;border-right:1px solid var(--atl-line,#ECECF0);border-top:4px solid}',
      '#eng-ielts-view .ie-st:last-child{border-right:0}',
      '#eng-ielts-view .ie-st .t{font-size:15px;font-weight:800}',
      '#eng-ielts-view .ie-st .r{font-size:12px;font-weight:600;color:var(--atl-text-2,#5B5B66);margin:2px 0 8px}',
      '#eng-ielts-view .ie-st .gl{font-size:12.5px;line-height:1.5}',
      '#eng-ielts-view .ie-st .ck{font-size:12px;font-weight:700;margin-top:10px;padding-top:8px;border-top:1px dashed var(--atl-line-strong,#DCDCE3)}',
      '#eng-ielts-view .ie-note{margin-top:12px;padding:12px 14px;background:var(--atl-surface,#F8F8FA);border-left:3px solid var(--atl-accent,#1F4BD8);font-size:13px;line-height:1.6}',
      '#eng-ielts-view table.ie-t{width:100%;border-collapse:collapse;font-size:13px}',
      '#eng-ielts-view table.ie-t th{text-align:left;font-size:11.5px;font-weight:700;color:var(--atl-text-2,#5B5B66);padding:8px 10px;border-bottom:1px solid var(--atl-line-strong,#DCDCE3);white-space:nowrap}',
      '#eng-ielts-view table.ie-t td{padding:10px;border-bottom:1px solid var(--atl-line,#ECECF0);vertical-align:top;line-height:1.5}',
      '#eng-ielts-view table.ie-t tr.past td{color:var(--atl-text-2,#5B5B66)}',
      '#eng-ielts-view table.ie-t tr.next td{background:var(--atl-accent-soft,#EEF2FD)}',
      '#eng-ielts-view .ie-num{font-weight:800;font-variant-numeric:tabular-nums}',
      '#eng-ielts-view .ie-chip{display:inline-block;font-size:11px;font-weight:700;padding:2px 6px;margin-left:6px;white-space:nowrap}',
      '#eng-ielts-view .ie-sc{font-variant-numeric:tabular-nums;font-weight:700;white-space:nowrap}',
      '#eng-ielts-view .ie-cycle{display:grid;grid-template-columns:repeat(5,1fr);gap:0;border:1px solid var(--atl-line,#ECECF0);margin-bottom:16px}',
      '#eng-ielts-view .ie-cycle div{padding:12px 14px;border-right:1px solid var(--atl-line,#ECECF0);font-size:12.5px;line-height:1.5}',
      '#eng-ielts-view .ie-cycle div:last-child{border-right:0}',
      '#eng-ielts-view .ie-cycle b{display:block;font-size:11.5px;color:var(--atl-accent,#1F4BD8);margin-bottom:3px}',
      '#eng-ielts-view .ie-areas{display:grid;grid-template-columns:repeat(4,1fr);gap:0;border:1px solid var(--atl-line-strong,#DCDCE3)}',
      '#eng-ielts-view .ie-ar{padding:18px;border-right:1px solid var(--atl-line,#ECECF0)}',
      '#eng-ielts-view .ie-ar:last-child{border-right:0}',
      '#eng-ielts-view .ie-ar .k{font-size:40px;font-weight:800;line-height:1;color:var(--atl-accent,#1F4BD8)}',
      '#eng-ielts-view .ie-ar .nm{font-size:14px;font-weight:800;margin-top:8px}',
      '#eng-ielts-view .ie-ar .sh{font-size:12px;color:var(--atl-text-2,#5B5B66);margin:3px 0 12px;font-weight:500}',
      '#eng-ielts-view .ie-ar ol{margin:0;padding:0;list-style:none;counter-reset:a}',
      '#eng-ielts-view .ie-ar li{counter-increment:a;font-size:12.5px;line-height:1.5;padding:4px 0 4px 20px;position:relative}',
      '#eng-ielts-view .ie-ar li:before{content:counter(a);position:absolute;left:0;top:4px;font-weight:800;font-size:11.5px;color:var(--atl-accent,#1F4BD8)}',
      '#eng-ielts-view .ie-ar .tr{margin-top:12px;padding:10px;background:#fef2f2;font-size:12px;line-height:1.5;color:#7f1d1d}',
      '#eng-ielts-view .ie-ar .tr b{display:block;font-size:11px;color:#b91c1c;margin-bottom:2px}',
      '#eng-ielts-view .ie-tasks{display:grid;grid-template-columns:1fr 1fr;gap:0;border:1px solid var(--atl-line-strong,#DCDCE3);margin-bottom:16px}',
      '#eng-ielts-view .ie-task{padding:18px}',
      '#eng-ielts-view .ie-task+.ie-task{border-left:1px solid var(--atl-line,#ECECF0)}',
      '#eng-ielts-view .ie-task .nm{font-size:15px;font-weight:800}',
      '#eng-ielts-view .ie-task .mt{font-size:12px;font-weight:700;color:var(--atl-accent,#1F4BD8);margin:2px 0 10px}',
      '#eng-ielts-view .ie-task .ex{font-size:12.5px;line-height:1.5;padding:8px 10px;background:var(--atl-surface,#F8F8FA);margin-bottom:10px}',
      '#eng-ielts-view .ie-task .ty{font-size:12.5px;line-height:1.5;margin-bottom:12px}',
      '#eng-ielts-view .ie-frame{display:flex;flex-direction:column;gap:3px}',
      '#eng-ielts-view .ie-frame span{display:block;padding:7px 10px;border:1px solid var(--atl-line-strong,#DCDCE3);font-size:12.5px;font-weight:600}',
      '#eng-ielts-view .ie-res{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:0;border-top:1px solid var(--atl-line,#ECECF0);border-left:1px solid var(--atl-line,#ECECF0)}',
      '#eng-ielts-view .ie-rs{padding:14px 16px;border-right:1px solid var(--atl-line,#ECECF0);border-bottom:1px solid var(--atl-line,#ECECF0);border-top:3px solid}',
      '#eng-ielts-view .ie-rs .nm{font-size:13.5px;font-weight:800}',
      '#eng-ielts-view .ie-rs a.nm{color:var(--atl-text,#16161A);text-decoration:none}',
      '#eng-ielts-view .ie-rs a.nm:hover{color:var(--atl-accent,#1F4BD8);text-decoration:underline}',
      '#eng-ielts-view .ie-rs .kd{font-size:11.5px;font-weight:600;margin:2px 0 6px}',
      '#eng-ielts-view .ie-rs .us{font-size:12.5px;line-height:1.5}',
      '#eng-ielts-view pre.ie-pr{white-space:pre-wrap;font-size:12px;line-height:1.55;margin:0;padding:16px;background:var(--atl-surface,#F8F8FA);border:1px solid var(--atl-line,#ECECF0);font-family:ui-monospace,Menlo,monospace!important}',
      '#eng-ielts-view .ie-facts{display:grid;grid-template-columns:repeat(2,1fr);gap:0 32px}',
      '#eng-ielts-view .ie-f{display:grid;grid-template-columns:84px 1fr;gap:12px;padding:10px 0;border-bottom:1px solid var(--atl-line,#ECECF0);font-size:13px;line-height:1.5}',
      '#eng-ielts-view .ie-f b{font-size:12px;color:var(--atl-text-2,#5B5B66)}',
      '#eng-ielts-view .ie-log{font-size:12.5px;line-height:1.6}',
      '#eng-ielts-view .ie-log div{display:grid;grid-template-columns:96px 1fr;gap:10px;padding:6px 0;border-bottom:1px solid var(--atl-line,#ECECF0)}',
      '#eng-ielts-view .ie-log span{font-weight:700;font-variant-numeric:tabular-nums}',
      '#eng-ielts-view .ie-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}',
      '@media (max-width:1100px){#eng-ielts-view .ie-areas{grid-template-columns:1fr 1fr}#eng-ielts-view .ie-ar:nth-child(2){border-right:0}#eng-ielts-view .ie-ar:nth-child(-n+2){border-bottom:1px solid var(--atl-line,#ECECF0)}}',
      '@media (max-width:760px){#eng-ielts-view .ie-hero{grid-template-columns:1fr}#eng-ielts-view .ie-dd .n{font-size:52px}#eng-ielts-view .ie-goals{padding:16px}#eng-ielts-view .ie-g{grid-template-columns:1fr 92px;gap:6px 12px}#eng-ielts-view .ie-g>div:first-child{grid-column:1/-1}',
      '#eng-ielts-view .ie-areas,#eng-ielts-view .ie-tasks,#eng-ielts-view .ie-facts{grid-template-columns:1fr}#eng-ielts-view .ie-ar{border-right:0;border-bottom:1px solid var(--atl-line,#ECECF0)}#eng-ielts-view .ie-task+.ie-task{border-left:0;border-top:1px solid var(--atl-line,#ECECF0)}',
      '#eng-ielts-view .ie-stages,#eng-ielts-view .ie-cycle{grid-template-columns:1fr}#eng-ielts-view .ie-st,#eng-ielts-view .ie-cycle div{border-right:0;border-bottom:1px solid var(--atl-line,#ECECF0)}#eng-ielts-view .ie-h{flex-wrap:wrap}#eng-ielts-view table.ie-t{min-width:560px}}'
    ].join('\n');
    document.head.appendChild(st);
  }

  function nextMock(){
    for (var i=0;i<IELTS.mocks.length;i++){ if (dday(IELTS.mocks[i].date) >= 0) return IELTS.mocks[i]; }
    return null;
  }

  function hero(){
    var d = dday(IELTS.exam.date), nx = nextMock();
    var MIN=4, MAX=9, pct=function(v){ return ((v-MIN)/(MAX-MIN)*100).toFixed(1)+'%'; };
    var rows = IELTS.goals.map(function(g){
      var col = TONE[g.tone];
      return '<div class="ie-g"><div><div class="nm">'+esc(g.name)+'</div><div class="nt">'+esc(g.note)+'</div></div>'
        + '<div class="ie-bar"><div class="now" style="width:'+pct(g.now)+';background:'+col+'"></div>'
        + '<div class="tick" style="left:'+pct(g.pass)+'" title="합격선 '+band(g.pass)+'"></div>'
        + (g.stretch ? '<div class="tick s" style="left:'+pct(g.stretch)+'" title="도전 '+band(g.stretch)+'"></div>' : '')
        + '</div><div class="sc">'+(g.nowLabel||band(g.now))+' → <span style="color:var(--atl-accent,#1F4BD8)">'+band(g.stretch||g.pass)+'</span></div></div>';
    }).join('');
    return '<div class="ie-hero"><div class="ie-dd"><div class="n">'+(d>0?'D-'+d:(d===0?'D-DAY':'D+'+(-d)))+'</div>'
      + '<div class="l">'+esc(IELTS.exam.date)+' (토) · '+esc(IELTS.exam.type)+'</div>'
      + (nx ? '<div class="next">다음 모의고사 <b>#'+nx.n+' · '+md(nx.date)+'</b> (D-'+dday(nx.date)+')<br>'+esc(nx.src)+'</div>' : '')
      + '</div><div class="ie-goals">'+rows
      + '<div class="ie-legend"><span><i style="background:#b91c1c"></i><i style="background:#b45309;margin-left:-3px"></i><i style="background:#15803d;margin-left:-3px"></i>지금 (Cambridge 2023 근사 · 색 = 남은 거리)</span><span><i style="background:none;border-left:2px solid #16161A;width:2px"></i>합격선 7.0</span><span><i style="background:none;border-left:2px dotted #16161A;width:2px"></i>도전</span></div>'
      + '</div></div>';
  }

  function sec(title, small, body){
    return '<section class="ie-sec"><h3 class="ie-h">'+esc(title)+(small?'<small>'+esc(small)+'</small>':'')+'</h3>'+body+'</section>';
  }

  function stages(){
    var body = '<div class="ie-stages">'+IELTS.stages.map(function(s){
      return '<div class="ie-st" style="border-top-color:'+TONE[s.tone]+'"><div class="t">'+s.n+' · '+esc(s.name)+'</div><div class="r">'+esc(s.range)+'</div><div class="gl">'+esc(s.goal)+'</div><div class="ck">'+esc(s.check)+'</div></div>';
    }).join('')+'</div><div class="ie-note"><b>판단 규칙</b> · '+esc(IELTS.rule)+'</div>';
    return sec('4단계', '단계 끝마다 점검', body);
  }

  function mocks(){
    var nx = nextMock();
    var rows = IELTS.mocks.map(function(m){
      var past = dday(m.date) < 0, sc = m.score;
      var cls = (nx && nx.n===m.n) ? 'next' : (past ? 'past' : '');
      var scoreTxt = sc ? 'L '+(sc.L==null?'—':sc.L)+' · R '+(sc.R==null?'—':sc.R)+' · W '+band(sc.W)+' · S '+band(sc.S) : '—';
      return '<tr class="'+cls+'"><td class="ie-num">'+m.n+'</td><td style="white-space:nowrap">'+m.date.slice(2).replace(/-/g,'.')
        + (m.key ? '<span class="ie-chip" style="background:'+TONE_BG.r+';color:'+TONE.r+'">진단</span>' : '')
        + (m.check ? '<span class="ie-chip" style="background:'+TONE_BG.y+';color:'+TONE.y+'">점검</span>' : '')
        + '</td><td>'+esc(m.src)+'</td><td>'+esc(m.focus)+'</td><td class="ie-sc">'+scoreTxt+'</td></tr>';
    }).join('');
    var cyc = '<div class="ie-cycle">'+IELTS.cycle.map(function(c){ return '<div><b>'+esc(c.when)+'</b>'+esc(c.what)+'</div>'; }).join('')+'</div>';
    var body = cyc + '<div class="ie-scroll"><table class="ie-t"><tr><th>#</th><th>날짜</th><th>교재</th><th>그 회차 집중</th><th>점수 (L·R 정답수 / W·S 밴드)</th></tr>'+rows+'</table></div>';
    return sec('모의고사 16회', '평소 2주 · 바쁠 땐 3주 · 캘린더 보라색과 같은 날짜', body);
  }

  function areas(){
    var body = '<div class="ie-areas">'+IELTS.areas.map(function(a){
      return '<div class="ie-ar"><div class="k">'+a.k+'</div><div class="nm">'+esc(a.name)+(a.star?' <span style="color:#b91c1c">★</span>':'')+'</div><div class="sh">'+esc(a.shape)+'</div>'
        + '<ol>'+a.how.map(function(h){ return '<li>'+esc(h)+'</li>'; }).join('')+'</ol>'
        + '<div class="tr"><b>함정</b>'+esc(a.trap)+'</div></div>';
    }).join('')+'</div>';
    return sec('영역별 공략', '★ = 약점', body);
  }

  function writing(){
    var w = IELTS.writing;
    var tasks = '<div class="ie-tasks">'+w.tasks.map(function(t){
      return '<div class="ie-task"><div class="nm">'+esc(t.name)+'</div><div class="mt">'+esc(t.meta)+'</div>'
        + '<div class="ex">예: '+esc(t.ex)+'</div><div class="ty">'+esc(t.types)+'</div>'
        + '<div class="ie-frame">'+t.frame.map(function(f){ return '<span>'+esc(f)+'</span>'; }).join('')+'</div></div>';
    }).join('')+'</div>';
    var ck = '<div class="ie-scroll"><table class="ie-t"><tr><th>채점 기준 (각 25%)</th><th>7점이 되려면</th><th>제출 전 2분 확인</th></tr>'
      + w.checklist.map(function(c){ return '<tr><td style="font-weight:700;white-space:nowrap">'+esc(c.c)+'</td><td>'+esc(c.seven)+'</td><td>'+esc(c.self)+'</td></tr>'; }).join('')
      + '</table></div><div class="ie-note">'+esc(w.rule)+'</div>';
    return sec('쓰기', '약점 1순위 · General Training', tasks + ck);
  }

  function resources(){
    var body = '<div class="ie-res">'+IELTS.resources.map(function(r){
      var nm = r.url ? '<a class="nm" href="'+esc(r.url)+'" target="_blank" rel="noopener">'+esc(r.name)+' ↗</a>' : '<div class="nm">'+esc(r.name)+'</div>';
      return '<div class="ie-rs" style="border-top-color:'+TONE[r.tag]+'">'+nm+'<div class="kd" style="color:'+TONE[r.tag]+'">'+esc(r.kind)+'</div><div class="us">'+esc(r.use)+'</div></div>';
    }).join('')+'</div><div class="ie-note">'+esc(IELTS.resourcesNote)+'</div>';
    return sec('교재 · 사이트', '초록 씀 · 노랑 제한적 · 빨강 안 씀', body);
  }

  function prompt(){
    var body = '<div style="display:flex;justify-content:flex-end;margin:-6px 0 8px"><button class="atl-btn-secondary" style="height:30px;padding:0 12px;font-size:12.5px;font-weight:600;border:1px solid var(--atl-line-strong,#DCDCE3)" onclick="ieltsCopyPrompt(this)">복사</button></div>'
      + '<pre class="ie-pr">'+esc(IELTS.prompt)+'</pre>';
    return sec('AI 채점관 프롬프트', '내 손으로 다 쓴 뒤 Claude에 붙여넣기', body);
  }

  function facts(){
    var body = '<div class="ie-facts">'+IELTS.facts.map(function(f){ return '<div class="ie-f"><b>'+esc(f.k)+'</b><div>'+esc(f.v)+'</div></div>'; }).join('')+'</div>'
      + '<div class="ie-note">'+esc(IELTS.why)+'</div>';
    return sec('시험 정보', null, body);
  }

  function log(){
    var body = '<div class="ie-log">'+IELTS.log.map(function(l){ return '<div><span>'+esc(l.d)+'</span>'+esc(l.t)+'</div>'; }).join('')+'</div>';
    return sec('업데이트 기록', null, body);
  }

  window.ieltsCopyPrompt = function(btn){
    var done = function(){ var t=btn.textContent; btn.textContent='복사됨'; setTimeout(function(){ btn.textContent=t; },1500); };
    try { navigator.clipboard.writeText(IELTS.prompt).then(done, done); } catch(e){ done(); }
  };

  window.renderIelts = function(){
    var el = document.getElementById('eng-ielts-view');
    if (!el) return;
    css();
    el.innerHTML = hero() + mocks() + stages() + areas() + writing() + resources() + prompt() + facts() + log();
  };
  window.IELTS_DATA = IELTS;
})();
