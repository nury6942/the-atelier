// ═══ ENGLISH › My Phrases — 문장 틀 모으기 → 말해 보기 → 내 것 (2026-10-27) ═══
// 단어가 아니라 '문장 틀'을 모은다: "With [경력] behind me, I can [할 수 있는 것]." — [ ] 가 바꿔 끼우는 빈칸
// 상태: new(모음) → tried(말해 봄, 녹음·AI 롤플레이에서 직접 표시) → mine(내 것, Annie 대화에서 실제로 씀)
// 'mine' 판정은 Annie 리뷰가 한다: 맡길 때 스크립트 끝에 틀 목록을 붙이고(phrasesForAnnie),
//   리뷰 결과의 frameCheck 를 읽어 반영(applyAnnieFrameChecks). 프롬프트는 app-1-pages.js REVIEW_PROMPT_TEMPLATE.
// 저장: Firestore englishPhrases/state { frames:{id:{...}}, applied:{세션키:true} } + localStorage 캐시
(function(){
  var LS='atelier_phrases_v1', ACC='#1F4BD8', ACC_D='#1A3FB5', ACC_L='#EEF2FD', LINE='#ECECF0', SUB='#475569', OK='#15803d', OK_L='#ECFDF3';
  var WEEK_MAX=3;
  var PS={ frames:{}, applied:{}, loaded:false, filter:'all', editing:null };
  var STATUS=[ {id:'new', label:'모음'}, {id:'tried', label:'말해 봄'}, {id:'mine', label:'내 것'} ];
  var SEED=[
    { cat:'앞에 붙이는 With', text:'With [ten years of jersey] behind me, I can [hit the ground running] on [your activewear line].', kr:'~의 경력을 바탕으로 ~에 바로 투입될 수 있다',
      mine:'I have ten years of experience in jersey. So I can start quickly.', swap:'With nine seasons at MLB behind me, I can take a range from brief to bulk.' },
    { cat:'work on + 대상', text:"I'd love to work on [your training range].", kr:'~을 맡아서 일하고 싶다', mine:'I want to do your training line.', swap:"I'd love to work on your women's training range." },
    { cat:'What I found was', text:'What I found was that [customers wanted warmth, not logos].', kr:'내가 알게 된 건 ~였다', mine:'I found customers want warm, not logo.', swap:'What I found was that our zip-ups had started to look the same every season.' }
  ];

  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function strip(h){ var d=document.createElement('div'); d.innerHTML=String(h||''); return (d.textContent||'').replace(/\s+/g,' ').trim(); }
  function today(){ var d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
  function newId(){ return 'f'+Date.now().toString(36)+Math.random().toString(36).slice(2,5); }
  function fb(){ return (typeof db!=='undefined' && db) ? db : null; }
  function toast(icon,msg){ if (typeof showSyncToast==='function') showSyncToast('<span class="material-symbols-outlined text-sm mr-1">'+icon+'</span> '+msg); }
  // [빈칸] → 코발트 밑줄
  function slots(t){ return esc(t).replace(/\[([^\]]+)\]/g,'<span style="color:'+ACC+';border-bottom:2px solid '+ACC+';padding:0 3px">$1</span>'); }
  function list(){ return Object.keys(PS.frames).map(function(k){ return PS.frames[k]; }).sort(function(a,b){ return (b.created||'').localeCompare(a.created||''); }); }

  function cacheSave(){ try { localStorage.setItem(LS, JSON.stringify({frames:PS.frames, applied:PS.applied})); } catch(e){} }
  var _t; function save(){ cacheSave(); clearTimeout(_t); _t=setTimeout(async function(){ var d=fb(); if (!d) return; try { await d.collection('englishPhrases').doc('state').set({frames:PS.frames, applied:PS.applied, updatedAt:new Date().toISOString()}); } catch(e){ console.warn('[Phrases] save',e); toast('error','저장 실패: '+e.message); } },600); }
  async function load(){
    if (PS.loaded) return;
    try { var c=JSON.parse(localStorage.getItem(LS)||'null'); if (c){ PS.frames=c.frames||{}; PS.applied=c.applied||{}; } } catch(e){}
    var d=fb(); var got=false;
    if (d){ try { var st=await d.collection('englishPhrases').doc('state').get(); if (st.exists){ var o=st.data(); PS.frames=o.frames||{}; PS.applied=o.applied||{}; got=true; cacheSave(); } } catch(e){ console.warn('[Phrases] load',e); } }
    if (!got && !Object.keys(PS.frames).length){
      SEED.forEach(function(s,i){ var id=newId()+i; PS.frames[id]=Object.assign({ id:id, status:'new', week:true, used:[], source:'시작 예시', created:new Date(Date.now()-i*1000).toISOString() }, s); });
      if (d) save();
    }
    PS.loaded=true;
  }

  // ── 화면 ──
  function chip(f,s){
    var on=f.status===s.id, bg=on?(s.id==='mine'?OK:ACC):'#fff', bd=on?bg:'#CBD5E1', fg=on?'#fff':SUB;
    return '<button onclick="phrasesSetStatus(\''+f.id+'\',\''+s.id+'\')" style="font-size:12px;padding:3px 9px;border:1px solid '+bd+';background:'+bg+';color:'+fg+';cursor:pointer">'+s.label+'</button>';
  }
  function usedHtml(f){
    if (!f.used || !f.used.length) return '';
    return f.used.slice(-3).reverse().map(function(u){ return '<p style="font-size:12px;color:'+OK+';margin:6px 0 0"><span class="material-symbols-outlined" style="font-size:14px;vertical-align:-2px">check</span> '+esc(u.date)+' Annie 대화에서 씀'+(u.quote?' · <i>"'+esc(u.quote)+'"</i>':'')+'</p>'; }).join('');
  }
  function editHtml(f){
    var v=function(k){ return esc(f[k]||''); };
    var inp=function(k,ph,big){ return '<div style="margin-bottom:8px"><p style="font-size:12px;color:'+SUB+';margin:0 0 3px">'+ph+'</p>'+(big?'<textarea id="pe-'+k+'" rows="2" style="width:100%;border:1px solid #CBD5E1;padding:8px;font-size:14px;font-family:inherit">'+v(k)+'</textarea>':'<input id="pe-'+k+'" value="'+v(k)+'" style="width:100%;border:1px solid #CBD5E1;padding:8px;font-size:14px;font-family:inherit">')+'</div>'; };
    return inp('text','문장 틀 — 바꿔 끼울 곳은 [대괄호]',true)+inp('kr','뜻')+inp('cat','이름표 (예: 앞에 붙이는 With)')+inp('mine','내가 하던 말 (같은 뜻, 지금 내 방식)')+inp('swap','바꿔 끼우기 (내 이야기로)',true)+
      '<div style="display:flex;gap:8px"><button class="atl-btn atl-btn-primary" onclick="phrasesSaveEdit(\''+(f.id||'')+'\')">저장</button><button class="atl-btn atl-btn-ghost" onclick="phrasesCancelEdit()">취소</button></div>';
  }
  function card(f, big){
    if (PS.editing===f.id) return '<div style="border:1px solid '+ACC+';padding:16px;margin-bottom:10px;background:#fff">'+editHtml(f)+'</div>';
    var border=big?'2px solid '+ACC:'1px solid '+LINE;
    return '<div style="border:'+border+';padding:'+(big?'16px 18px':'12px 16px')+';margin-bottom:10px;background:#fff">'+
      '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap">'+
        '<span style="font-size:12px;color:'+ACC_D+';font-weight:600">'+esc(f.cat||'')+(f.kr?' <span style="color:'+SUB+';font-weight:400">· '+esc(f.kr)+'</span>':'')+'</span>'+
        '<div style="display:flex;gap:4px;align-items:center">'+STATUS.map(function(s){ return chip(f,s); }).join('')+'</div>'+
      '</div>'+
      '<p style="font-size:'+(big?'18':'16')+'px;line-height:1.6;margin:0 0 '+(big?'12':'4')+'px;color:#18181B">'+slots(f.text)+' '+(typeof _esSpk==='function'?_esSpk(strip(f.text).replace(/[\[\]]/g,''),'en-US'):'')+'</p>'+
      (big && f.mine ? '<p style="font-size:12px;color:'+SUB+';margin:0 0 2px">내가 하던 말</p><p style="font-size:14px;color:'+SUB+';margin:0 0 10px">'+esc(f.mine)+'</p>' : '')+
      (big && f.swap ? '<p style="font-size:12px;color:'+SUB+';margin:0 0 2px">바꿔 끼우기</p><p style="font-size:14px;margin:0">'+esc(f.swap)+'</p>' : '')+
      usedHtml(f)+
      '<div style="display:flex;gap:12px;margin-top:10px;font-size:12px">'+
        '<button onclick="phrasesToggleWeek(\''+f.id+'\')" style="color:'+(f.week?ACC:SUB)+';cursor:pointer">'+(f.week?'이번 주에서 빼기':'이번 주로')+'</button>'+
        '<button onclick="phrasesEdit(\''+f.id+'\')" style="color:'+SUB+';cursor:pointer">고치기</button>'+
        '<button onclick="phrasesDelete(\''+f.id+'\')" style="color:'+SUB+';cursor:pointer">지우기</button>'+
        (f.source?'<span style="color:'+SUB+';margin-left:auto">'+esc(f.source)+'</span>':'')+
      '</div></div>';
  }
  function stat(label,n,hi){ return '<div style="background:'+(hi?ACC_L:'#F8FAFC')+';padding:12px 14px"><p style="font-size:12px;color:'+(hi?ACC_D:SUB)+';margin:0 0 4px">'+label+'</p><p style="font-size:24px;font-weight:600;margin:0;color:'+(hi?ACC_D:'#18181B')+'">'+n+'</p></div>'; }

  function render(){
    var el=document.getElementById('eng-phrases-view'); if (!el) return;
    var all=list(), cnt=function(s){ return all.filter(function(f){ return f.status===s; }).length; };
    var tried=cnt('tried')+cnt('mine');
    var week=all.filter(function(f){ return f.week && f.status!=='mine'; });
    var rest=all.filter(function(f){ return (PS.filter==='all' || f.status===PS.filter) && !(f.week && f.status!=='mine'); });
    var adding=PS.editing==='__new';
    el.innerHTML=
      '<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin-bottom:20px">'+stat('모은 틀',all.length)+stat('말해 봄',tried)+stat('내 것 (Annie 대화에서 씀)',cnt('mine'),true)+'</div>'+
      '<div style="display:flex;justify-content:space-between;align-items:baseline;margin-bottom:8px"><h3 style="font-size:15px;font-weight:600;margin:0">이번 주 '+week.length+'개</h3><span style="font-size:12px;color:'+SUB+'">녹음과 Annie 대화에서 일부러 써 보기 · Annie가 쓴 걸 찾으면 \'내 것\'</span></div>'+
      (week.length?week.map(function(f){ return card(f,true); }).join(''):'<p style="font-size:14px;color:'+SUB+';border:1px dashed #CBD5E1;padding:16px">아래 목록에서 \'이번 주로\'를 눌러 3개를 고르세요.</p>')+
      '<div style="display:flex;justify-content:space-between;align-items:center;margin:28px 0 10px;gap:8px;flex-wrap:wrap">'+
        '<div style="display:flex;gap:6px">'+[{id:'all',label:'전체'}].concat(STATUS).map(function(s){ var on=PS.filter===s.id; return '<button onclick="phrasesFilter(\''+s.id+'\')" style="font-size:13px;padding:5px 12px;border:1px solid '+(on?ACC:'#CBD5E1')+';background:'+(on?ACC:'#fff')+';color:'+(on?'#fff':SUB)+';cursor:pointer">'+s.label+'</button>'; }).join('')+'</div>'+
        '<button class="atl-btn atl-btn-secondary" onclick="phrasesEdit(\'__new\')">틀 추가</button>'+
      '</div>'+
      (adding?'<div style="border:1px solid '+ACC+';padding:16px;margin-bottom:10px;background:#fff">'+editHtml({})+'</div>':'')+
      (rest.length?rest.map(function(f){ return card(f,false); }).join(''):'<p style="font-size:14px;color:'+SUB+'">여기에 해당하는 틀이 없어요. Annie 리뷰의 💎 문장 옆 \'+ My Phrases\'로 모을 수 있어요.</p>');
  }

  // ── 동작 ──
  window.phrasesFilter=function(s){ PS.filter=s; render(); };
  window.phrasesSetStatus=function(id,s){ var f=PS.frames[id]; if (!f) return; f.status=s; if (s==='mine') f.week=false; save(); render(); };
  window.phrasesToggleWeek=function(id){
    var f=PS.frames[id]; if (!f) return;
    if (!f.week && list().filter(function(x){ return x.week && x.status!=='mine'; }).length>=WEEK_MAX){ toast('info','이번 주는 '+WEEK_MAX+'개까지 — 하나를 먼저 빼 주세요'); return; }
    f.week=!f.week; save(); render();
  };
  window.phrasesEdit=function(id){ PS.editing=id; render(); var t=document.getElementById('pe-text'); if (t) t.focus(); };
  window.phrasesCancelEdit=function(){ PS.editing=null; render(); };
  window.phrasesSaveEdit=function(id){
    var g=function(k){ var e=document.getElementById('pe-'+k); return e?e.value.trim():''; };
    if (!g('text')){ toast('warning','문장 틀을 입력하세요'); return; }
    var f=id && PS.frames[id] ? PS.frames[id] : { id:newId(), status:'new', week:false, used:[], source:'직접', created:new Date().toISOString() };
    ['text','kr','cat','mine','swap'].forEach(function(k){ f[k]=g(k); });
    PS.frames[f.id]=f; PS.editing=null; save(); render();
  };
  window.phrasesDelete=function(id){ var f=PS.frames[id]; if (!f) return; if (!confirm('이 틀을 지울까요?\n'+strip(f.text))) return; delete PS.frames[id]; save(); render(); };

  window.renderEnglishPhrases=async function(){
    var el=document.getElementById('eng-phrases-view'); if (el && !PS.loaded) el.innerHTML='<p style="font-size:14px;color:'+SUB+'">불러오는 중…</p>';
    await load(); await window.applyAnnieFrameChecks(); render();
  };

  // ── Annie 연결 ──
  // 맡길 때 스크립트 끝에 붙이는 틀 목록 (아직 '내 것'이 아닌 것, 이번 주 먼저)
  window.phrasesForAnnie=async function(){
    try { await load(); } catch(e){ return ''; }
    var fs=list().filter(function(f){ return f.status!=='mine'; }).sort(function(a,b){ return (b.week?1:0)-(a.week?1:0); }).slice(0,30);
    if (!fs.length) return '';
    return '\n\n=== NURI\'S TARGET FRAMES (for frameCheck only — NOT part of the conversation) ===\n'+fs.map(function(f){ return f.id+' | '+f.text; }).join('\n');
  };
  // 리뷰 결과의 frameCheck → 틀 상태 반영 (세션마다 한 번)
  window.applyAnnieFrameChecks=async function(){
    if (typeof engSessionsData==='undefined' || !engSessionsData || !engSessionsData.length) return 0;
    await load();
    var n=0, changed=false;
    engSessionsData.forEach(function(s){
      if (!Array.isArray(s.frameCheck) || !s.frameCheck.length) return;
      var key=s._id+'@'+(s.updatedAt||'');
      if (PS.applied[key]) return;
      PS.applied[key]=true; changed=true;
      s.frameCheck.forEach(function(c){
        var f=c && c.used && PS.frames[c.id]; if (!f) return;
        f.used=f.used||[];
        if (f.used.some(function(u){ return u.date===(s.date||s._id); })) return;
        f.used.push({ date:s.date||String(s._id).slice(0,10), quote:strip(c.quote||'') });
        if (f.status!=='mine'){ f.status='mine'; f.week=false; n++; }
      });
    });
    if (changed) save();
    if (n) toast('check_circle','Annie 대화에서 틀 '+n+'개를 썼어요 → \'내 것\'');
    return n;
  };
  // 리뷰 화면 맨 위에 붙는 체크 결과
  window.phrasesCheckHtml=function(s){
    var used=(Array.isArray(s.frameCheck)?s.frameCheck:[]).filter(function(c){ return c && c.used; });
    if (!Array.isArray(s.frameCheck) || !s.frameCheck.length) return '';
    var body=used.length ? used.map(function(c){ var f=PS.frames[c.id]; return '<p style="font-size:14px;margin:6px 0 0"><span class="material-symbols-outlined" style="font-size:16px;vertical-align:-3px;color:'+OK+'">check</span> '+(f?slots(f.text):esc(c.id))+(c.quote?'<br><span style="font-size:13px;color:'+SUB+';margin-left:22px">"'+esc(strip(c.quote))+'"</span>':'')+'</p>'; }).join('')
      : '<p style="font-size:14px;color:'+SUB+';margin:6px 0 0">이번 대화에선 아직 안 나왔어요. 다음 수업 때 일부러 하나씩 써 보세요.</p>';
    return '<div style="border:1px solid '+(used.length?OK:LINE)+';background:'+(used.length?OK_L:'#fff')+';padding:14px 16px;margin-bottom:24px">'+
      '<p style="font-size:13px;font-weight:600;margin:0;color:'+(used.length?OK:SUB)+'">My Phrases 체크 · 이번 대화에서 쓴 틀 '+used.length+'개 / '+s.frameCheck.length+'개</p>'+body+'</div>';
  };
  // 리뷰의 💎 문장 → 틀로 저장
  window.addPhraseFromGem=async function(dateId, ui){
    var s=(typeof engSessionsData!=='undefined'?engSessionsData:[]).find(function(x){ return x._id===dateId; });
    var u=s && (s.upgrades||[])[ui]; if (!u) return;
    await load();
    var text=strip(u.gemFrame||u.gem);
    if (list().some(function(f){ return strip(f.text)===text; })){ toast('info','이미 모은 틀이에요'); return; }
    var id=newId();
    PS.frames[id]={ id:id, text:text, kr:strip(u.gemKr), cat:(u.gemBreakdown&&u.gemBreakdown[0]&&u.gemBreakdown[0].chunk!=='문장 구조')?strip(u.gemBreakdown[0].chunk):'Annie 💎', mine:strip(u.bad).replace(/^["“]|["”]$/g,''), swap:'', status:'new', week:false, used:[], source:'Annie '+(s.date||String(dateId).slice(0,10)), created:new Date().toISOString() };
    save(); toast('bookmark_add','My Phrases에 담았어요');
    var b=document.getElementById('gemadd-'+ui); if (b){ b.textContent='담음 ✓'; b.disabled=true; }
  };
})();
