// ═══ Work English (2026-10-20) — English › Work 탭 ═══
// 누리가 실제로 하는 일(팀즈 대화·가봉 코멘트)에서 뽑은 장면을 영어로 연습하는 곳.
//   · 카드 내용은 공개 저장소에 두지 않는다 → Firestore workEnglish/content (groups·cards·glossary)
//   · 내 기록은 workEnglish/state (done: {카드id: 날짜}, saved: [{en, ko, card}])
//   · AI 피드백은 IELTS 채점기와 같은 길: ieltsGrading 에 kind:'work' 로 pending → 맥북 launchd 가 claude -p(구독)로 처리(0원)
//   · 화면은 A안: 왼쪽 목록 + 오른쪽 카드 (폭 좁으면 목록 → 카드로 넘어감)
(function(){
  var ACC = '#1F4BD8', ACC_D = '#1A3FB5', ACC_L = '#EEF2FD', LINE = '#ECECF0', SUB = '#475569', INK = '#18181B';
  var GROUPS = [
    { id:'roleplay', label:'Role-play' },
    { id:'biz', label:'Business' },
    { id:'fashion', label:'Fashion' },
    { id:'interview', label:'Interview' },
    { id:'glossary', label:'Glossary' }
  ];
  var S = { content:null, state:{ done:{}, saved:[] }, group:'roleplay', card:null, rp:null, mobileCard:false, jobs:{}, unwatch:null, loading:false, rec:null, q:'' };

  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function D(){ return (typeof db !== 'undefined' ? db : window.db); }
  function root(){ return document.getElementById('eng-work-view'); }
  function narrow(){ return window.innerWidth < 820; }
  function toast(m){ if (typeof showSyncToast === 'function') showSyncToast(m); }
  function today(){ var d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }

  function injectStyle(){
    if (document.getElementById('we-style')) return;
    var css = [
      '.we{font-family:Pretendard,-apple-system,sans-serif;color:'+INK+'}',
      '.we *{border-radius:0;box-shadow:none;box-sizing:border-box}',
      '.we-en{font-family:Arial,Helvetica,sans-serif}',
      '.we-top{display:flex;justify-content:space-between;align-items:flex-end;gap:12px;flex-wrap:wrap;margin-bottom:14px}',
      '.we-top h3{font-size:20px;font-weight:700;margin:0}',
      '.we-top p{font-size:13px;color:'+SUB+';margin:4px 0 0}',
      '.we-grp{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:12px}',
      '.we-grp button{font-size:13px;padding:6px 12px;border:1px solid '+LINE+';background:#fff;color:'+SUB+';cursor:pointer}',
      '.we-grp button.on{background:'+ACC_L+';color:'+ACC_D+';border-color:'+ACC+';font-weight:600}',
      '.we-lay{display:grid;grid-template-columns:minmax(0,280px) minmax(0,1fr);gap:14px;align-items:start}',
      '.we-list{border:1px solid '+LINE+';background:#fff;max-height:72vh;overflow:auto}',
      '.we-it{padding:11px 13px;border-bottom:1px solid '+LINE+';cursor:pointer;display:flex;gap:10px;align-items:flex-start}',
      '.we-it:last-child{border-bottom:none}',
      '.we-it:hover{background:#FAFAFB}',
      '.we-it.on{background:'+ACC_L+'}',
      '.we-it b{display:block;font-size:13.5px;font-weight:600;line-height:1.4}',
      '.we-it small{display:block;font-size:11.5px;color:'+SUB+';margin-top:2px}',
      '.we-chk{flex:0 0 16px;height:16px;border:1px solid #CBD5E1;margin-top:2px;font-size:11px;line-height:14px;text-align:center;color:#fff}',
      '.we-chk.on{background:'+ACC+';border-color:'+ACC+'}',
      '.we-card{border:1px solid '+LINE+';background:#fff;padding:20px}',
      '.we-card h4{font-size:18px;font-weight:700;margin:0 0 2px}',
      '.we-card .we-sub{font-size:12.5px;color:'+SUB+'}',
      '.we-lbl{font-size:11.5px;font-weight:700;color:'+ACC+';letter-spacing:.03em;margin:18px 0 6px}',
      '.we-sit{font-size:14px;line-height:1.7}',
      '.we-ph{margin:0;padding:0;list-style:none;border-top:1px solid '+LINE+'}',
      '.we-ph li{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px;padding:9px 0;border-bottom:1px solid '+LINE+';align-items:start}',
      '.we-ph .en{font-family:Arial,Helvetica,sans-serif;font-size:14.5px;line-height:1.5}',
      '.we-ph .ko{font-size:12.5px;color:'+SUB+';margin-top:2px}',
      '.we-mini{font-size:12px;border:1px solid '+LINE+';background:#fff;color:'+SUB+';padding:3px 8px;cursor:pointer;white-space:nowrap}',
      '.we-mini:hover{border-color:'+ACC+';color:'+ACC_D+'}',
      '.we-mini.on{background:'+ACC_L+';color:'+ACC_D+';border-color:'+ACC+'}',
      '.we-task{font-size:13.5px;line-height:1.6;background:#FAFAFB;border:1px solid '+LINE+';padding:10px 12px}',
      '.we-ta{width:100%;min-height:120px;border:1px solid '+LINE+';padding:12px;font-family:Arial,Helvetica,sans-serif;font-size:14.5px;line-height:1.7;resize:vertical;margin-top:8px}',
      '.we-ta:focus{outline:none;border-color:'+ACC+'}',
      '.we-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px;align-items:center}',
      '.we-rec{display:inline-flex;align-items:center;gap:6px}',
      '.we-rec i{width:8px;height:8px;background:#b91c1c;display:inline-block;border-radius:50%!important}',
      '.we-rec.live i{animation:weblink 1s infinite}',
      '@keyframes weblink{50%{opacity:.2}}',
      '.we-fb{border:1px solid '+LINE+';margin-top:12px}',
      '.we-fb-h{display:flex;justify-content:space-between;align-items:center;padding:10px 12px;border-bottom:1px solid '+LINE+';background:#FAFAFB;font-size:12.5px;color:'+SUB+'}',
      '.we-fb-b{padding:12px}',
      '.we-verdict{font-size:14px;font-weight:600;line-height:1.6;color:'+ACC_D+'}',
      '.we-cmp{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px;margin-top:10px}',
      '.we-cmp div{border:1px solid '+LINE+';padding:10px}',
      '.we-cmp small{display:block;font-size:11px;font-weight:700;color:'+SUB+';margin-bottom:4px}',
      '.we-cmp p{margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.65;white-space:pre-wrap}',
      '.we-err{font-size:13px;line-height:1.6;margin:10px 0 0;padding:0;list-style:none}',
      '.we-err li{padding:5px 0;border-bottom:1px dashed '+LINE+'}',
      '.we-err s{color:#b91c1c;font-family:Arial,Helvetica,sans-serif}',
      '.we-err b{color:#15803d;font-family:Arial,Helvetica,sans-serif;font-weight:600}',
      '.we-err span{display:block;color:'+SUB+';font-size:12px}',
      '.we-tone{font-size:12.5px;color:'+SUB+';line-height:1.6;margin-top:10px}',
      '.we-back{font-size:13px;border:none;background:none;color:'+ACC_D+';padding:0 0 10px;cursor:pointer}',
      '.we-empty{border:1px dashed #CBD5E1;padding:28px;text-align:center;font-size:13px;color:'+SUB+';line-height:1.7}',
      '.we-gl{width:100%;border-collapse:collapse;font-size:13.5px}',
      '.we-gl th{text-align:left;font-size:11.5px;color:'+SUB+';font-weight:700;padding:8px;border-bottom:1px solid '+LINE+'}',
      '.we-gl td{padding:8px;border-bottom:1px solid '+LINE+';vertical-align:top}',
      '.we-gl td.en{font-family:Arial,Helvetica,sans-serif;font-weight:600}',
      '.we-gl td.nt{color:'+SUB+';font-size:12.5px}',
      '.we-search{width:100%;max-width:320px;border:1px solid '+LINE+';padding:8px 10px;font-size:13px;margin-bottom:10px}',
      '.we-search:focus{outline:none;border-color:'+ACC+'}',
      '.we-tg{display:flex;gap:6px;flex-wrap:wrap;align-items:center;font-size:12px;color:'+SUB+';margin-top:12px}',
      '.we-chat{display:flex;flex-direction:column;gap:10px;margin-top:16px}',
      '.we-t{border:1px solid '+LINE+';padding:10px 12px;max-width:86%}',
      '.we-t.p{align-self:flex-start;background:#FAFAFB}',
      '.we-t.n{align-self:flex-end;background:#fff;border-left:3px solid '+ACC+'}',
      '.we-t.cur{align-self:stretch;max-width:none;border:1px solid '+ACC+';border-left:3px solid '+ACC+'}',
      '.we-t .who{display:flex;justify-content:space-between;gap:8px;align-items:center;font-size:11px;font-weight:700;color:'+SUB+';margin-bottom:5px}',
      '.we-t .en{font-family:Arial,Helvetica,sans-serif;font-size:14.5px;line-height:1.55}',
      '.we-t .skip{font-size:13px;color:'+SUB+'}',
      '.we-t .model{margin-top:8px;padding-top:8px;border-top:1px dashed '+LINE+'}',
      '.we-t .model small{display:block;font-size:11px;font-weight:700;color:#15803d;margin-bottom:3px}',
      '.we-hint{font-size:13.5px;line-height:1.6;background:'+ACC_L+';color:'+ACC_D+';padding:8px 10px}',
      '.we-t .we-ta{min-height:70px}',
      '.we-goal{font-size:13.5px;line-height:1.6;border-left:3px solid '+ACC+';padding:2px 0 2px 10px}',
      '@media (max-width:819px){.we-t{max-width:100%}.we-lay{grid-template-columns:minmax(0,1fr)}.we-list{max-height:none}.we-cmp{grid-template-columns:minmax(0,1fr)}.we-card{padding:16px}}'
    ].join('\n');
    var st = document.createElement('style'); st.id = 'we-style'; st.textContent = css; document.head.appendChild(st);
  }

  // ───────── 데이터 ─────────
  function load(){
    if (S.loading) return Promise.resolve();
    S.loading = true;
    var d = D();
    if (!d) { S.loading = false; return Promise.resolve(); }
    return Promise.all([
      d.collection('workEnglish').doc('content').get(),
      d.collection('workEnglish').doc('state').get()
    ]).then(function(r){
      S.content = r[0].exists ? r[0].data() : { cards:[], glossary:[] };
      var st = r[1].exists ? r[1].data() : {};
      S.state = { done: st.done || {}, saved: st.saved || [] };
      S.loading = false;
    }).catch(function(e){ console.warn('[work-english] load', e); S.loading = false; S.content = S.content || { cards:[], glossary:[] }; });
  }
  function saveState(){
    var d = D(); if (!d) return;
    d.collection('workEnglish').doc('state').set({ done:S.state.done, saved:S.state.saved, updatedAt:new Date().toISOString() }, { merge:true })
      .catch(function(e){ console.warn('[work-english] save', e); toast('저장 실패 — 네트워크 확인'); });
  }
  function scen(){ return (S.content && S.content.scenarios) || []; }
  function all(){ return ((S.content && S.content.cards) || []).concat(scen()); }
  function cards(){ return S.group === 'roleplay' ? scen() : ((S.content && S.content.cards) || []).filter(function(c){ return c.group === S.group; }); }
  function cardById(id){ return all().filter(function(c){ return c.id === id; })[0] || null; }
  function subOf(c){ return c.turns ? (c.cat + ' · ' + c.partner) : (c.sub || ''); }
  function grpOf(c){ return c.turns ? 'roleplay' : c.group; }
  function pref(k, d){ try { return localStorage.getItem('atelier_we_' + k) || d; } catch(e){ return d; } }
  function setPref(k, v){ try { localStorage.setItem('atelier_we_' + k, v); } catch(e){} }

  function watchJobs(){
    if (S.unwatch) return;
    var d = D(); if (!d) return;
    try {
      S.unwatch = d.collection('ieltsGrading').where('kind','==','work').onSnapshot(function(snap){
        var by = {};
        snap.forEach(function(doc){ var x = doc.data(); x._id = doc.id; var k = x.ref || ''; if (!by[k] || String(x.createdAt) > String(by[k].createdAt)) by[k] = x; });
        S.jobs = by;
        // 피드백이 끝난 카드는 '해봄' 표시
        var changed = false;
        Object.keys(by).forEach(function(k){ if (by[k].status === 'done' && !S.state.done[k]) { S.state.done[k] = (by[k].gradedAt || '').slice(0,10) || today(); changed = true; } });
        if (changed) saveState();
        if (root() && root().style.display !== 'none') { paintList(); paintFeedback(); }
      }, function(e){ console.warn('[work-english] watch', e); });
    } catch (e) { console.warn('[work-english]', e); }
  }

  // ───────── 화면 ─────────
  function render(){
    var el = root(); if (!el) return;
    injectStyle();
    if (!S.content) {
      el.innerHTML = '<div class="we"><div class="we-empty">불러오는 중…</div></div>';
      load().then(function(){ watchJobs(); render(); });
      return;
    }
    watchJobs();
    var total = all().length, done = Object.keys(S.state.done).filter(function(k){ return cardById(k); }).length;
    var head = '<div class="we-top"><div><h3>Work English</h3><p>실제로 하는 일에서 뽑은 장면을 소리 내서. 업체 통화·가봉·품평 전에 그 장면으로 5분.</p></div>' +
      '<div style="font-size:13px;color:'+SUB+'">해본 장면 <b id="we-done" style="color:'+ACC_D+'">'+done+'</b> / '+total+'</div></div>';
    var grp = '<div class="we-grp">' + GROUPS.map(function(g){
      var n = g.id === 'glossary' ? ((S.content.glossary||[]).length + S.state.saved.length) : all().filter(function(c){ return grpOf(c) === g.id; }).length;
      return '<button id="we-grp-'+g.id+'" class="'+(S.group===g.id?'on':'')+'" onclick="WORK_EN.group(\''+g.id+'\')">'+g.label+' <span style="opacity:.7">'+n+'</span></button>';
    }).join('') + '</div>';
    var body;
    if (S.group === 'glossary') body = '<div id="we-gl">'+glossaryHtml()+'</div>';
    else if (!cards().length) body = '<div class="we-empty">이 묶음엔 아직 카드가 없어요.</div>';
    else {
      if (!S.card || !cardById(S.card) || grpOf(cardById(S.card)) !== S.group) S.card = cards()[0].id;
      if (narrow()) body = S.mobileCard ? '<div id="we-card">'+cardHtml(cardById(S.card), true)+'</div>' : '<div class="we-list" id="we-list"></div>';
      else body = '<div class="we-lay"><div class="we-list" id="we-list"></div><div id="we-card">'+cardHtml(cardById(S.card))+'</div></div>';
    }
    el.innerHTML = '<div class="we">' + head + grp + body + '</div>';
    paintList(); paintFeedback(); restoreDraft();
  }

  function paintList(){
    var dn = document.getElementById('we-done'); if (dn) dn.textContent = Object.keys(S.state.done).filter(function(k){ return cardById(k); }).length;
    var l = document.getElementById('we-list'); if (!l) return;
    l.innerHTML = cards().map(function(c){
      var dn = !!S.state.done[c.id];
      var job = S.jobs[c.id], badge = job && (job.status === 'pending' || job.status === 'grading') ? ' · <span style="color:'+ACC+'">피드백 중</span>' : '';
      return '<div class="we-it'+(c.id===S.card && !narrow()?' on':'')+'" onclick="WORK_EN.open(\''+esc(c.id)+'\')"><span class="we-chk'+(dn?' on':'')+'">'+(dn?'✓':'')+'</span>' +
        '<div><b>'+esc(c.title)+'</b><small>'+esc(subOf(c))+badge+'</small></div></div>';
    }).join('');
  }

  function savedHas(en){ return S.state.saved.some(function(s){ return s.en === en; }); }

  function cardHtml(c, withBack){
    if (!c) return '';
    if (c.turns) return rpHtml(c, withBack);
    var ph = (c.phrases||[]).map(function(p, i){
      var on = savedHas(p.en);
      return '<li><div><div class="en">'+esc(p.en)+'</div><div class="ko">'+esc(p.ko||'')+'</div></div>' +
        '<button class="we-mini'+(on?' on':'')+'" onclick="WORK_EN.save(\''+esc(c.id)+'\','+i+',\'p\')">'+(on?'저장됨':'+ 내 표현')+'</button></li>';
    }).join('');
    return (withBack ? '<button class="we-back" onclick="WORK_EN.back()">← 목록</button>' : '') +
      '<div class="we-card"><h4>'+esc(c.title)+'</h4><div class="we-sub">'+esc(c.sub||'')+'</div>' +
      '<div class="we-lbl">상황</div><div class="we-sit">'+esc(c.situation||'')+'</div>' +
      (ph ? '<div class="we-lbl">핵심 표현</div><ul class="we-ph">'+ph+'</ul>' : '') +
      '<div class="we-lbl">소리 내서 말해보기 <span style="color:'+SUB+';font-weight:500">· 글로 써도 돼요</span></div><div class="we-task">'+esc(c.task||'')+'</div>' +
      '<div class="we-row">' +
        '<button class="atl-btn atl-btn-primary we-rec" id="we-rec" onclick="WORK_EN.rec()"><i></i><span>말하기 시작</span></button>' +
        (c.roleplay ? '<button class="atl-btn atl-btn-secondary" onclick="WORK_EN.roleplay()">ChatGPT 음성 롤플레이 ↗</button>' : '') +
      '</div>' +
      '<textarea class="we-ta we-en" id="we-ta" placeholder="말한 게 여기 받아쓰기로 들어가요. 직접 써도 돼요." oninput="WORK_EN.draft()"></textarea>' +
      '<div class="we-row"><button class="atl-btn atl-btn-secondary" onclick="WORK_EN.ask()">AI 피드백 받기</button></div>' +
      '<div id="we-fb"></div></div>';
  }

  // ───────── 롤플레이 ─────────
  // S.rp = { id, i: 지금 내 차례(턴 번호, -1 = 시작 전), said: {턴: 내가 한 말}, shown: {턴: 모범답 펼침}, hint: {턴: 힌트 열림} }
  function rpState(c){ if (!S.rp || S.rp.id !== c.id) S.rp = { id:c.id, i:-1, said:{}, shown:{}, hint:{}, spoke:false }; return S.rp; }
  function rpHtml(c, withBack){
    var R = rpState(c), T = c.turns, mine = T.filter(function(t){ return t.who === 'nuri'; }).length;
    var hintMode = pref('hint', 'always'), voice = pref('voice', 'on');
    var nth = 0, myNo = 0;
    T.forEach(function(t, k){ if (t.who === 'nuri' && k <= R.i) myNo++; });
    var head = (withBack ? '<button class="we-back" onclick="WORK_EN.back()">← 목록</button>' : '') +
      '<div class="we-card"><h4>'+esc(c.title)+'</h4><div class="we-sub">'+esc(c.cat)+' · 상대: '+esc(c.partner)+'</div>' +
      '<div class="we-lbl">상황</div><div class="we-sit">'+esc(c.setting)+'</div>' +
      '<div class="we-lbl">내 목표</div><div class="we-goal">'+esc(c.goal)+'</div>' +
      '<div class="we-tg">힌트 <button class="we-mini'+(hintMode==='always'?' on':'')+'" onclick="WORK_EN.pref(\'hint\',\'always\')">처음부터 보기</button>' +
        '<button class="we-mini'+(hintMode==='stuck'?' on':'')+'" onclick="WORK_EN.pref(\'hint\',\'stuck\')">막힐 때만</button>' +
        '<span style="margin-left:8px">상대 목소리</span> <button class="we-mini'+(voice==='on'?' on':'')+'" onclick="WORK_EN.pref(\'voice\',\''+(voice==='on'?'off':'on')+'\')">'+(voice==='on'?'켜짐':'꺼짐')+'</button></div>';
    if (R.i < 0) return head + '<div class="we-row" style="margin-top:16px"><button class="atl-btn atl-btn-primary" onclick="WORK_EN.step()">시작 ▸</button>' +
      '<span style="font-size:12.5px;color:'+SUB+'">상대가 먼저 말하면 들리고, 내 차례엔 한국어 힌트를 보고 영어로 말해요. 내 차례 '+mine+'번.</span></div><div id="we-fb"></div></div>';
    var chat = '';
    for (var k = 0; k < T.length && k <= R.i; k++) {
      var t = T[k];
      if (t.who === 'partner') {
        chat += '<div class="we-t p"><div class="who"><span>'+esc(c.partner.split(' (')[0])+'</span><button class="we-mini" onclick="WORK_EN.say('+k+')">▶ 듣기</button></div><div class="en">'+esc(t.en)+'</div></div>';
        continue;
      }
      nth++;
      var cur = k === R.i, open = !!R.shown[k];
      var model = '<div class="model"><small>이렇게 말하면 돼요</small><div style="display:flex;gap:8px;justify-content:space-between;align-items:flex-start"><div class="en">'+esc(t.en)+'</div><button class="we-mini" onclick="WORK_EN.say('+k+')">▶ 듣기</button></div></div>';
      if (!cur || open) {
        chat += '<div class="we-t n'+(cur?' cur':'')+'"><div class="who"><span>나 · '+nth+'/'+mine+'</span></div><div class="we-hint" style="padding:5px 8px;font-size:12.5px">'+esc(t.hint)+'</div>' +
          (R.said[k] ? '<div class="en" style="margin-top:8px">'+esc(R.said[k])+'</div>' : '<div class="skip" style="margin-top:8px">건너뜀</div>') + model +
          (cur ? '<div class="we-row"><button class="atl-btn atl-btn-primary" onclick="WORK_EN.step()">'+(R.i >= T.length-1 || !T.slice(k+1).some(function(x){return x.who==='nuri';}) ? '마무리 ▸' : '다음 ▸')+'</button>' +
            '<button class="atl-btn atl-btn-ghost" onclick="WORK_EN.retry()">다시 말하기</button></div>' : '') + '</div>';
      } else {
        var showHint = hintMode === 'always' || R.hint[k];
        chat += '<div class="we-t n cur"><div class="who"><span>내 차례 · '+nth+'/'+mine+'</span>' + (showHint ? '' : '<button class="we-mini" onclick="WORK_EN.hint('+k+')">힌트 보기</button>') + '</div>' +
          (showHint ? '<div class="we-hint">'+esc(t.hint)+'</div>' : '') +
          '<textarea class="we-ta we-en" id="we-ta" placeholder="말하면 여기 받아쓰기로 들어가요. 직접 써도 돼요."></textarea>' +
          '<div class="we-row"><button class="atl-btn atl-btn-primary we-rec" id="we-rec" onclick="WORK_EN.rec()"><i></i><span>말하기 시작</span></button>' +
          '<button class="atl-btn atl-btn-secondary" onclick="WORK_EN.check()">확인</button>' +
          '<button class="atl-btn atl-btn-ghost" onclick="WORK_EN.check(true)">모르겠어요 · 답 보기</button></div></div>';
      }
    }
    var end = '';
    if (R.i >= T.length) {
      var said = Object.keys(R.said).length;
      end = '<div class="we-lbl">대화 끝</div><div class="we-task">내가 말한 '+said+' / '+mine+'턴을 AI가 한꺼번에 봐줘요 — 뜻이 통했는지, 더 짧고 자연스러운 말.</div>' +
        '<div class="we-row"><button class="atl-btn atl-btn-primary" onclick="WORK_EN.askRp()">전체 대화 AI 피드백 받기</button><button class="atl-btn atl-btn-ghost" onclick="WORK_EN.restart()">처음부터 다시</button></div>';
    }
    return head + '<div class="we-chat" id="we-chat">' + chat + '</div>' + end + '<div id="we-fb"></div></div>';
  }
  function voiceFor(){
    var vs = (window.speechSynthesis && speechSynthesis.getVoices()) || [];
    var en = vs.filter(function(v){ return /^en[-_](US|GB)/i.test(v.lang); });
    return en.filter(function(v){ return /Samantha|Google US English|Daniel|Karen|Ava|Allison/i.test(v.name); })[0] || en[0] || null;
  }
  function speak(text, force){
    if (!window.speechSynthesis || (!force && pref('voice','on') !== 'on')) return;
    var u = new SpeechSynthesisUtterance(text); u.lang = 'en-US'; u.rate = 0.96; var v = voiceFor(); if (v) u.voice = v;
    speechSynthesis.speak(u);
  }
  function paintRp(scroll){
    var c = cardById(S.card); var box = document.getElementById('we-card'); if (!c || !box) return;
    box.innerHTML = rpHtml(c, narrow()); paintFeedback();
    var cur = box.querySelector('.we-t.cur') || box.querySelector('.we-row:last-of-type');
    if (scroll && cur) { var r = cur.getBoundingClientRect(); if (r.bottom > window.innerHeight - 20 || r.top < 60) window.scrollBy({ top: r.top - 120, behavior:'smooth' }); }
    var ta = document.getElementById('we-ta'); if (ta && scroll) try { ta.focus({ preventScroll:true }); } catch(e){}
  }

  function paintFeedback(){
    var box = document.getElementById('we-fb'); if (!box || !S.card) return;
    var job = S.jobs[S.card];
    if (!job) { box.innerHTML = ''; return; }
    var when = String(job.createdAt||'').slice(5,16).replace('T',' ');
    if (job.status === 'pending' || job.status === 'grading') {
      box.innerHTML = '<div class="we-fb"><div class="we-fb-h"><span>AI 피드백</span><span>'+when+'</span></div><div class="we-fb-b" style="font-size:13px;color:'+SUB+'">'+
        (job.status === 'grading' ? '고치는 중이에요 (1분쯤)…' : '대기 중이에요. 맥북이 5분 안에 가져가요.') + '</div></div>';
      return;
    }
    if (job.status === 'error') {
      box.innerHTML = '<div class="we-fb"><div class="we-fb-h"><span>AI 피드백</span><span>'+when+'</span></div><div class="we-fb-b" style="font-size:13px;color:#b91c1c">'+esc(job.error||'오류')+'</div></div>';
      return;
    }
    var r = job.result || {};
    var errs = (r.errors||[]).map(function(e){ return '<li><s>'+esc(e.wrong)+'</s> → <b>'+esc(e.right)+'</b>'+(e.ko?'<span>'+esc(e.ko)+'</span>':'')+'</li>'; }).join('');
    var ph = (r.phrases||[]).map(function(p, i){
      var on = savedHas(p.en);
      return '<li><div><div class="en">'+esc(p.en)+'</div><div class="ko">'+esc(p.ko||'')+'</div></div><button class="we-mini'+(on?' on':'')+'" onclick="WORK_EN.save(\''+esc(S.card)+'\','+i+',\'r\')">'+(on?'저장됨':'+ 내 표현')+'</button></li>';
    }).join('');
    box.innerHTML = '<div class="we-fb"><div class="we-fb-h"><span>AI 피드백 · '+(job.mode==='speak'?'말하기':'쓰기')+'</span><span>'+when+'</span></div><div class="we-fb-b">' +
      '<div class="we-verdict">'+esc(r.verdict||'')+'</div>' +
      '<div class="we-cmp"><div><small>'+(job.mode==='speak'?'내가 말한 것 (틀린 데만 고침)':'내가 쓴 것 (틀린 데만 고침)')+'</small><p>'+esc(r.fixed||job.text||'')+'</p></div><div><small>'+(job.mode==='speak'?'현지 동료라면 이렇게 말해요':'현지 동료라면 이렇게')+'</small><p>'+esc(r.natural||'')+'</p></div></div>' +
      (errs ? '<ul class="we-err">'+errs+'</ul>' : '') +
      (r.tone ? '<div class="we-tone">'+esc(r.tone)+'</div>' : '') +
      (ph ? '<div class="we-lbl">'+(job.mode==='speak'?'바로 꺼내 쓸 짧은 말':'가져갈 표현')+'</div><ul class="we-ph">'+ph+'</ul>' : '') +
      '</div></div>';
  }

  function glossaryHtml(){
    var q = S.q.trim().toLowerCase();
    var mine = S.state.saved.filter(function(s){ return !q || (s.en+' '+(s.ko||'')).toLowerCase().indexOf(q) >= 0; });
    var gl = ((S.content && S.content.glossary) || []).filter(function(g){ return !q || (g.ko+' '+g.en+' '+(g.note||'')).toLowerCase().indexOf(q) >= 0; });
    var cats = {}; gl.forEach(function(g){ (cats[g.cat||'기타'] = cats[g.cat||'기타'] || []).push(g); });
    var html = '<input class="we-search" placeholder="찾기 — 밑위, rise, 시보리…" value="'+esc(S.q)+'" oninput="WORK_EN.search(this.value)">';
    html += '<div class="we-lbl" style="margin-top:6px">내 표현 '+mine.length+'</div>' + (mine.length ?
      '<table class="we-gl"><tbody>'+mine.map(function(s, i){ var c = cardById(s.card);
        return '<tr><td class="en">'+esc(s.en)+'</td><td>'+esc(s.ko||'')+'</td><td class="nt">'+esc(c?c.title:'')+'</td><td style="width:1%"><button class="we-mini" onclick="WORK_EN.unsave(\''+esc(s.en).replace(/'/g,'&#39;')+'\')">빼기</button></td></tr>'; }).join('')+'</tbody></table>'
      : '<div style="font-size:13px;color:'+SUB+'">카드의 \'+ 내 표현\'을 누르면 여기 모여요.</div>');
    Object.keys(cats).forEach(function(k){
      html += '<div class="we-lbl">'+esc(k)+'</div><table class="we-gl"><thead><tr><th style="width:24%">한국어 (현장)</th><th style="width:30%">English</th><th>메모</th></tr></thead><tbody>' +
        cats[k].map(function(g){ return '<tr><td>'+esc(g.ko)+'</td><td class="en">'+esc(g.en)+'</td><td class="nt">'+esc(g.note||'')+'</td></tr>'; }).join('') + '</tbody></table>';
    });
    return html;
  }

  // ───────── 동작 ─────────
  function draftKey(){ return 'atelier_we_draft_' + S.card; }
  function restoreDraft(){ if (S.group === 'roleplay') return; var ta = document.getElementById('we-ta'); if (!ta) return; try { ta.value = localStorage.getItem(draftKey()) || ''; } catch(e){} }

  function stopRec(){ if (S.rec) { try { S.rec.r.stop(); } catch(e){} S.rec = null; } var b = document.getElementById('we-rec'); if (b) { b.classList.remove('live'); b.querySelector('span').textContent = '다시 말하기'; } }

  window.WORK_EN = {
    render: render,
    stop: stopRec,
    group: function(g){ stopRec(); if (window.speechSynthesis) speechSynthesis.cancel(); S.group = g; S.mobileCard = false; S.q = ''; render(); },
    open: function(id){ stopRec(); if (window.speechSynthesis) speechSynthesis.cancel(); S.card = id; if (narrow()) { S.mobileCard = true; render(); window.scrollTo(0, (root().getBoundingClientRect().top + window.scrollY) - 80); return; }
      var c = document.getElementById('we-card'); if (c) c.innerHTML = cardHtml(cardById(id)); paintList(); paintFeedback(); restoreDraft(); },
    back: function(){ stopRec(); S.mobileCard = false; render(); },
    search: function(v){ S.q = v; var g = document.getElementById('we-gl'); if (!g) return; var pos = v.length; g.innerHTML = glossaryHtml(); var i = g.querySelector('.we-search'); if (i) { i.focus(); i.setSelectionRange(pos, pos); } },
    draft: function(){ if (S.group === 'roleplay') return; var ta = document.getElementById('we-ta'); if (!ta) return; try { localStorage.setItem(draftKey(), ta.value); } catch(e){} },
    save: function(cid, i, from){
      var c = cardById(cid); var p = null;
      if (from === 'p') p = c && (c.phrases||[])[i];
      else { var j = S.jobs[cid]; p = j && j.result && (j.result.phrases||[])[i]; }
      if (!p) return;
      if (savedHas(p.en)) S.state.saved = S.state.saved.filter(function(s){ return s.en !== p.en; });
      else S.state.saved.unshift({ en:p.en, ko:p.ko||'', card:cid, at:today() });
      saveState();
      if (S.card === cid) { var box = document.getElementById('we-card'); if (box && from === 'p') { box.innerHTML = cardHtml(c, narrow()); restoreDraft(); paintFeedback(); } else paintFeedback(); }
      var gb = document.getElementById('we-grp-glossary'); if (gb) gb.querySelector('span').textContent = (S.content.glossary||[]).length + S.state.saved.length;
    },
    unsave: function(en){ var t = document.createElement('textarea'); t.innerHTML = en; en = t.value; S.state.saved = S.state.saved.filter(function(s){ return s.en !== en; }); saveState(); var g = document.getElementById('we-gl'); if (g) g.innerHTML = glossaryHtml(); },
    rec: function(){
      if (S.rec) { stopRec(); return; }
      var SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SR) { toast('이 브라우저는 받아쓰기를 못 해요 — 크롬이나 사파리에서'); return; }
      var ta = document.getElementById('we-ta'); if (!ta) return;
      var r = new SR(); r.lang = 'en-US'; r.continuous = true; r.interimResults = true;
      var base = ta.value ? ta.value.replace(/\s*$/, ' ') : '';
      S.rec = { r:r, t0:Date.now() };
      r.onresult = function(e){ var fin = '', tmp = ''; for (var i = 0; i < e.results.length; i++) { if (e.results[i].isFinal) fin += e.results[i][0].transcript + ' '; else tmp += e.results[i][0].transcript; } ta.value = base + fin + tmp; WORK_EN.draft(); };
      r.onerror = function(e){ if (e.error !== 'no-speech') toast('받아쓰기 오류: ' + e.error); };
      r.onend = function(){ if (S.rec && S.rec.r === r) { try { r.start(); } catch(e){ stopRec(); } } };
      try { r.start(); } catch(e){ stopRec(); return; }
      ta.setAttribute('data-spoke', '1'); if (S.rp && S.group === 'roleplay') S.rp.spoke = true;
      var b = document.getElementById('we-rec'); if (b) { b.classList.add('live'); b.querySelector('span').textContent = '멈추기'; }
      S.rec.spoke = true;
    },
    ask: function(){
      var c = cardById(S.card); var ta = document.getElementById('we-ta');
      var text = ta ? ta.value.trim() : '';
      if (!c) return;
      if ((text.match(/[A-Za-z]+/g) || []).length < 3) { toast('영어로 한두 문장은 써주세요'); if (ta) ta.focus(); return; }
      var spoke = !!(S.rec && S.rec.spoke) || !!(ta && ta.getAttribute('data-spoke'));
      stopRec();
      var d = D(); if (!d) return;
      d.collection('ieltsGrading').add({
        kind:'work', ref:c.id, mode: spoke ? 'speak' : 'write',
        prompt: 'Scene: ' + (c.title||'') + '\nContext: ' + (c.situation||'') + '\nTask: ' + (c.task||'') + (c.target ? '\nTarget reader/listener: ' + c.target : ''),
        text: text, words: (text.match(/[A-Za-z0-9'’-]+/g)||[]).length, createdAt: new Date().toISOString(), status:'pending'
      }).then(function(){ toast('보냈어요 — 맥북이 5분 안에 고쳐줘요'); try { localStorage.removeItem(draftKey()); } catch(e){} })
        .catch(function(e){ toast('보내기 실패: ' + e.message); });
    },
    pref: function(k, v){ setPref(k, v); if (k === 'voice' && v === 'off' && window.speechSynthesis) speechSynthesis.cancel(); var ta = document.getElementById('we-ta'), keep = ta ? ta.value : ''; stopRec(); paintRp(); var t2 = document.getElementById('we-ta'); if (t2) t2.value = keep; },
    hint: function(k){ if (!S.rp) return; S.rp.hint[k] = true; var ta = document.getElementById('we-ta'), keep = ta ? ta.value : ''; paintRp(); var t2 = document.getElementById('we-ta'); if (t2) t2.value = keep; },
    say: function(k){ var c = cardById(S.card); if (!c || !c.turns[k]) return; if (window.speechSynthesis) speechSynthesis.cancel(); speak(c.turns[k].en, true); },
    // 다음 내 차례까지 넘기면서 그 사이 상대 말을 읽어준다
    step: function(){
      var c = cardById(S.card); if (!c || !c.turns) return; var R = rpState(c);
      stopRec(); if (window.speechSynthesis) speechSynthesis.cancel();
      R.i++;
      while (R.i < c.turns.length && c.turns[R.i].who === 'partner') { speak(c.turns[R.i].en); if (R.i + 1 < c.turns.length && c.turns[R.i+1].who === 'partner') R.i++; else break; }
      if (R.i < c.turns.length && c.turns[R.i].who === 'partner') R.i++;
      if (R.i > c.turns.length) R.i = c.turns.length;
      paintRp(true);
    },
    check: function(giveUp){
      if (!S.rp) return; var ta = document.getElementById('we-ta'); var v = ta ? ta.value.trim() : '';
      if (!giveUp && (v.match(/[A-Za-z]+/g) || []).length < 2) { toast('영어로 한마디는 해보세요 — 막히면 "답 보기"'); if (ta) ta.focus(); return; }
      stopRec();
      if (v && !giveUp) S.rp.said[S.rp.i] = v; else delete S.rp.said[S.rp.i];
      S.rp.shown[S.rp.i] = true; paintRp(true);
    },
    retry: function(){ if (!S.rp) return; delete S.rp.shown[S.rp.i]; delete S.rp.said[S.rp.i]; paintRp(true); var ta = document.getElementById('we-ta'); if (ta) ta.value = ''; },
    restart: function(){ var c = cardById(S.card); if (!c) return; stopRec(); if (window.speechSynthesis) speechSynthesis.cancel(); S.rp = null; rpState(c); paintRp(true); },
    askRp: function(){
      var c = cardById(S.card); var R = S.rp; if (!c || !R) return;
      var lines = [], mineTxt = [], n = 0;
      c.turns.forEach(function(t, k){
        if (t.who === 'partner') lines.push('PARTNER: ' + t.en);
        else { n++; var s = R.said[k]; lines.push('NURI (turn ' + n + ', goal: ' + t.hint + '): ' + (s || '(skipped)')); if (s) mineTxt.push(n + '. ' + s); }
      });
      var text = mineTxt.join('\n');
      if ((text.match(/[A-Za-z]+/g) || []).length < 5) { toast('말한 턴이 너무 적어요 — 두세 턴은 말해보세요'); return; }
      var d = D(); if (!d) return;
      d.collection('ieltsGrading').add({
        kind:'work', ref:c.id, mode: R.spoke ? 'speak' : 'write',
        prompt: 'Role-play: ' + c.title + '\nSetting: ' + c.setting + '\nHer goal: ' + c.goal + '\nPartner: ' + c.partner +
          '\nThe whole conversation (her answer below is only her own numbered turns; judge the turns together — did she reach her goal, was each turn clear and natural for this partner):\n' + lines.join('\n'),
        text: text, words: (text.match(/[A-Za-z0-9\'’-]+/g)||[]).length, createdAt: new Date().toISOString(), status:'pending'
      }).then(function(){ toast('보냈어요 — 맥북이 5분 안에 봐줘요'); }).catch(function(e){ toast('보내기 실패: ' + e.message); });
    },
    roleplay: function(){
      var c = cardById(S.card); if (!c || !c.roleplay) return;
      var txt = c.roleplay + '\n\nSpeak only English. Keep each of your turns short (1–3 sentences) like a real colleague. After about 6 exchanges, stop the role-play and give me, in Korean, the 3 most useful corrections of what I said and 3 natural phrases I should reuse.';
      var done = function(){ toast('지시문을 복사했어요 — ChatGPT에 붙여넣고 음성 모드를 켜세요'); window.open('https://chatgpt.com/', '_blank'); };
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(done, function(){ prompt('복사해서 ChatGPT에 붙여넣으세요', txt); });
      else prompt('복사해서 ChatGPT에 붙여넣으세요', txt);
    }
  };
  window.renderWorkEnglish = render;
  window.addEventListener('resize', function(){ var el = root(); if (el && el.style.display !== 'none' && S.content) { var n = narrow(); if (n !== S._n) { S._n = n; render(); } } });
})();
