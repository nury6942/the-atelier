// ═══ ENGLISH › Read — 매일 긴 글 읽기 (2026-10-19) ═══
// 글: data/read/index.json + data/read/<id>.json (scripts/read/fetch.mjs 가 매일 만듦)
//   The Conversation 은 본문 전체(CC BY-ND, 원문 그대로 + 출처), BBC Future·Guardian Long Read·BoF 는 링크만
// 내 기록: Firestore englishRead/state { words, log, daily } + localStorage 캐시
// 화면: Today · Library · My Words · Review — 리더는 단어를 누르면 뜻·발음·예문·원래 문장, 노랑=내 단어장, 파랑=이 글 핵심 단어
(function(){
  var LS='atelier_read_v1', ACC='#1F4BD8', OK='#15803d', BAD='#b91c1c';
  var RS={ view:'today', index:{items:[],links:[]}, art:null, words:{}, log:{}, daily:{}, loaded:false, sel:null, showMarks:true, font:17, rv:null };
  var BOX_DAYS=[0,1,2,4,8,16];

  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function icon(n,sz){ return '<span class="material-symbols-outlined" style="font-size:'+(sz||18)+'px;vertical-align:-3px">'+n+'</span>'; }
  function today(){ var d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
  function dayStr(off){ var d=new Date(); d.setDate(d.getDate()-off); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
  function mmss(s){ s=Math.max(0,Math.round(s||0)); return Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); }
  function toast(m){ if (typeof showSyncToast==='function') showSyncToast(m); }
  function keyOf(t){ return String(t||'').toLowerCase().replace(/[’]/g,"'").replace(/^[^a-z0-9']+|[^a-z0-9']+$/g,''); }

  // ── 저장 ──
  function fb(){ return (typeof db!=='undefined' && db && typeof firebase!=='undefined' && firebase.auth && firebase.auth().currentUser) ? db : null; }
  function cacheSave(){ try { localStorage.setItem(LS, JSON.stringify({words:RS.words, log:RS.log, daily:RS.daily})); } catch(e){} }
  function cacheLoad(){ try { var c=JSON.parse(localStorage.getItem(LS)||'null'); if (c){ RS.words=c.words||{}; RS.log=c.log||{}; RS.daily=c.daily||{}; } } catch(e){} }
  var _t; function save(){ cacheSave(); clearTimeout(_t); _t=setTimeout(async function(){ var d=fb(); if (!d) return; try { await d.collection('englishRead').doc('state').set({words:RS.words, log:RS.log, daily:RS.daily, updatedAt:new Date().toISOString()},{merge:true}); } catch(e){ console.warn('[Read] save',e); } },800); }
  async function load(){
    cacheLoad();
    try { var r=await fetch('data/read/index.json?t='+today()+'-'+new Date().getHours()); if (r.ok) RS.index=await r.json(); } catch(e){}
    var d=fb(); if (d){ try { var st=await d.collection('englishRead').doc('state').get(); if (st.exists){ var o=st.data(); RS.words=Object.assign({}, RS.words, o.words||{}); RS.log=Object.assign({}, RS.log, o.log||{}); RS.daily=Object.assign({}, RS.daily, o.daily||{}); cacheSave(); } } catch(e){ console.warn('[Read] load',e); } }
    RS.loaded=true;
  }
  async function openArticle(id){
    var it=(RS.index.items||[]).find(function(x){return x.id===id;}); if (!it) return;
    try {
      if (it.private){   // Guardian 처럼 공개 저장소에 못 올리는 글 — 로그인해야 보이는 Firestore readPrivate 에서
        var d=fb(); if (!d){ toast('로그인해야 볼 수 있는 글이에요'); return; }
        var snap=await d.collection('readPrivate').doc(it.id).get(); if (!snap.exists){ toast('아직 올라오는 중이에요 — 잠시 뒤에'); return; }
        RS.art=snap.data(); RS.art.id=it.id;
      } else { var r=await fetch(it.file+'?v=1'); RS.art=await r.json(); }
    } catch(e){ toast('글을 못 불러왔어요'); return; }
    RS.view='reader'; RS.sel=null; RS.quizShown={}; RS.paraShown={}; RS.sumShown=false;
    render(); window.scrollTo({top:(document.getElementById('eng-read-view')||{offsetTop:0}).offsetTop-70});
    startTimer();
  }

  // ── 읽은 시간 (화면에 보일 때만) ──
  var _tick=null, _last=0;
  function startTimer(){ stopTimer(); _last=Date.now(); _tick=setInterval(function(){
    if (RS.view!=='reader' || !RS.art){ stopTimer(); return; }
    var now=Date.now(), dt=(now-_last)/1000; _last=now;
    if (document.visibilityState!=='visible' || dt>5) return;
    var L=RS.log[RS.art.id]=RS.log[RS.art.id]||{secs:0, date:today()}; L.secs+=dt; RS.daily[today()]=(RS.daily[today()]||0)+dt;
    var c=document.getElementById('rd-clock'); if (c) c.textContent=mmss(L.secs);
    if (Math.round(L.secs)%15===0) save();
  },1000); }
  function stopTimer(){ if (_tick){ clearInterval(_tick); _tick=null; save(); } }

  function streak(){ var n=0; for (var i=0;i<400;i++){ var s=RS.daily[dayStr(i)]||0; if (s>=60) n++; else if (i===0) continue; else break; } return n; }
  function dueWords(){ var now=Date.now(); return Object.keys(RS.words).filter(function(k){ var w=RS.words[k]; return !w.due || w.due<=now; }); }

  // ── 스타일 ──
  function css(){
    if (document.getElementById('rd-style')) return;
    var st=document.createElement('style'); st.id='rd-style';
    st.textContent=[
      '#eng-read-view{color:#16161A;font-size:14px}',
      '#eng-read-view *{border-radius:0!important}',
      '#eng-read-view .rd-nav{display:flex;gap:0;border:1px solid #DCDCE3;margin-bottom:22px;background:#fff;width:fit-content;max-width:100%;overflow-x:auto}',
      '#eng-read-view .rd-nav button{display:flex;align-items:center;gap:6px;padding:10px 16px;font-size:13px;font-weight:700;color:#5B5B66;border-right:1px solid #ECECF0;white-space:nowrap}',
      '#eng-read-view .rd-nav button:last-child{border-right:0}',
      '#eng-read-view .rd-nav button.on{background:'+ACC+';color:#fff}',
      '#eng-read-view .rd-box{border:1px solid #DCDCE3;background:#fff;padding:16px}',
      '#eng-read-view .rd-k{font-size:11.5px;font-weight:700;color:#5B5B66;letter-spacing:.03em}',
      '#eng-read-view .rd-num{font-variant-numeric:tabular-nums;font-weight:800}',
      '#eng-read-view .rd-tag{display:inline-block;font-size:11px;font-weight:700;padding:2px 6px;background:#EEF2FD;color:'+ACC+'}',
      '#eng-read-view .rd-btn{display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 12px;font-size:12.5px;font-weight:700;border:1px solid #DCDCE3;background:#fff;color:#16161A;cursor:pointer;white-space:nowrap}',
      '#eng-read-view .rd-btn:hover{background:#F8F8FA}',
      '#eng-read-view .rd-btn.pri{background:'+ACC+';border-color:'+ACC+';color:#fff}',
      '#eng-read-view .rd-card{border:1px solid #DCDCE3;background:#fff;padding:16px;cursor:pointer;display:flex;flex-direction:column;gap:8px;text-align:left}',
      '#eng-read-view .rd-card:hover{border-color:'+ACC+'}',
      '#eng-read-view .rd-split{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:20px;align-items:start}',
      '#eng-read-view .rd-text p{font-family:Arial,Helvetica,sans-serif;line-height:1.85;margin:0 0 18px;color:#16161A}',
      '#eng-read-view .rd-w{cursor:pointer}',
      '#eng-read-view .rd-w:hover{background:#EEF2FD}',
      '#eng-read-view.marks .rd-w.nw{background:#DBEAFE;color:#1E3A8A;box-shadow:0 2px 0 #93C5FD}',
      '#eng-read-view.marks .rd-w.kn{background:#FEF3C7;color:#78350F;box-shadow:0 2px 0 #FCD34D}',
      '#eng-read-view.marks .rd-w.gl{box-shadow:0 1.5px 0 #CBD5E1}',
      '#eng-read-view .rd-w.sel{outline:2px solid '+ACC+';outline-offset:1px}',
      '#eng-read-view .rd-side{position:sticky;top:76px;display:flex;flex-direction:column;gap:12px}',
      '#eng-read-view .rd-bar{position:sticky;top:56px;z-index:6;background:#16161A;color:#fff;display:flex;align-items:center;gap:10px;padding:8px 12px;margin-bottom:16px;flex-wrap:wrap}',
      '#eng-read-view .rd-bar .rd-btn{height:28px;background:transparent;border-color:rgba(255,255,255,.5);color:#fff}',
      '#eng-read-view .rd-in{width:100%;border:1px solid #DCDCE3;padding:8px 10px;font-size:14px;font-family:Arial,Helvetica,sans-serif}',
      '#eng-read-view .rd-in:focus{outline:2px solid '+ACC+';outline-offset:-1px}',
      '@media (max-width:900px){#eng-read-view .rd-split{grid-template-columns:1fr}#eng-read-view .rd-side{position:static}#eng-read-view .rd-pop{position:fixed;left:0;right:0;bottom:0;z-index:60;max-height:55vh;overflow:auto;border-top:3px solid '+ACC+'!important;box-shadow:0 -8px 24px rgba(0,0,0,.12)}}'
    ].join('\n');
    document.head.appendChild(st);
  }

  // ════════ TODAY / LIBRARY ════════
  function streakStrip(){
    var cells=''; for (var i=20;i>=0;i--){ var s=RS.daily[dayStr(i)]||0, m=s/60, bg=m>=10?ACC:m>=5?'#7C9BEA':m>=1?'#C7D5F8':'#F1F1F4';
      cells+='<div title="'+dayStr(i)+' · '+Math.round(m)+'분" style="height:22px;background:'+bg+(i===0?';outline:2px solid #16161A;outline-offset:-2px':'')+'"></div>'; }
    var week=0; for (var j=0;j<7;j++) week+=(RS.daily[dayStr(j)]||0);
    var nW=Object.keys(RS.words).length, due=dueWords().length;
    function stat(k,v,sub){ return '<div><div class="rd-k">'+k+'</div><div class="rd-num" style="font-size:26px">'+v+'<span style="font-size:13px;color:#5B5B66;font-weight:700"> '+sub+'</span></div></div>'; }
    return '<div class="rd-box" style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:20px;align-items:center;margin-bottom:20px">'
      +'<div><div class="rd-k" style="margin-bottom:8px">최근 3주 · 진할수록 오래 읽음 (10분+)</div><div style="display:grid;grid-template-columns:repeat(21,1fr);gap:3px">'+cells+'</div></div>'
      +'<div style="display:flex;gap:24px">'+stat('연속',streak(),'일')+stat('이번 주',Math.round(week/60),'분')+stat('내 단어',nW,'개')+'<button class="rd-btn'+(due?' pri':'')+'" data-rnav="review" style="align-self:center">'+icon('replay',16)+' 복습 '+due+'</button></div></div>';
  }
  function articleCard(it, big){
    var L=RS.log[it.id], done=L&&L.done, newN=0;
    return '<button class="rd-card" data-open="'+esc(it.id)+'" style="'+(big?'border-top:3px solid #16161A':'')+(done?';opacity:.7':'')+'">'
      +'<div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center"><span class="rd-tag" style="background:#16161A;color:#fff">'+esc(it.source)+'</span><span class="rd-tag">'+esc(it.level||'')+'</span><span class="rd-tag" style="background:#F1F1F4;color:#5B5B66">'+esc(it.minutes||'?')+'분 · '+esc(it.topic||'')+'</span>'+(it.private?'<span class="rd-tag" style="background:#F1F1F4;color:#5B5B66">'+icon('lock',12)+' 로그인 전용</span>':'')+(done?'<span class="rd-tag" style="background:#DCFCE7;color:#166534">'+icon('check',13)+' 읽음</span>':L?'<span class="rd-tag" style="background:#FEF3C7;color:#92400E">'+mmss(L.secs)+' 읽는 중</span>':'')+'</div>'
      +'<div style="font-size:'+(big?18:15)+'px;font-weight:800;line-height:1.35">'+esc(it.title)+'</div>'
      +(it.gist?'<div style="font-size:13px;color:#475569;line-height:1.55">'+esc(it.gist)+'</div>':'')
      +'<div style="font-size:11.5px;color:#5B5B66;font-weight:600;margin-top:auto">'+esc(it.date)+(it.author?' · '+esc(it.author):'')+'</div></button>';
  }
  function viewToday(){
    var items=RS.index.items||[], tday=items.filter(function(x){return x.date===today();}), latest=tday.length?tday:items.slice(0,2);
    var links=(RS.index.links||[]).slice(0,9);
    var srcIcon={'BBC Future':'public','Guardian Long Read':'auto_stories','BoF':'checkroom'};
    return streakStrip()
      +'<div class="rd-k" style="margin-bottom:10px">'+(tday.length?'오늘의 글':'최근 글')+' · 단어를 누르면 뜻이 나와요</div>'
      +(latest.length?'<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:12px;margin-bottom:26px">'+latest.map(function(x){return articleCard(x,true);}).join('')+'</div>':'<div class="rd-box" style="text-align:center;color:#5B5B66;margin-bottom:26px">아직 글이 없어요 — 매일 아침 자동으로 채워져요</div>')
      +(links.length?'<div class="rd-k" style="margin-bottom:10px">원문 사이트에서 읽기 (본문은 못 가져와서 링크만)</div><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:8px">'+links.map(function(l){
          return '<a href="'+esc(l.url)+'" target="_blank" rel="noopener" class="rd-card" style="text-decoration:none;color:#16161A;flex-direction:row;align-items:flex-start;gap:10px;padding:12px">'+icon(srcIcon[l.source]||'link',22)+'<div><div class="rd-k">'+esc(l.source)+' · '+esc(l.date||'')+'</div><div style="font-size:13.5px;font-weight:700;line-height:1.4;margin-top:2px">'+esc(l.title)+' ↗</div></div></a>'; }).join('')+'</div>':'');
  }
  function viewLibrary(){
    var items=RS.index.items||[];
    if (!items.length) return '<div class="rd-box" style="text-align:center;color:#5B5B66">아직 글이 없어요</div>';
    return '<div class="rd-k" style="margin-bottom:10px">지난 글 '+items.length+'개</div><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px">'+items.map(function(x){return articleCard(x,false);}).join('')+'</div>';
  }

  // ════════ READER ════════
  var PHRASE_MAX=4;
  function tokenize(text, gloss, vocab){
    // 단어마다 span — 2~4단어 구(gloss 에 있는 것)는 한 덩어리로
    var parts=String(text).split(/(\s+)/), toks=[], i, out='';
    for (i=0;i<parts.length;i++){ if (/^\s+$/.test(parts[i])||parts[i]==='') toks.push({sp:parts[i]}); else toks.push({w:parts[i]}); }
    var words=[]; toks.forEach(function(t,idx){ if (t.w!=null) words.push(idx); });
    var used={};
    for (var a=0;a<words.length;a++){
      if (used[words[a]]) continue;
      for (var n=PHRASE_MAX;n>=2;n--){ if (a+n>words.length) continue;
        var key=words.slice(a,a+n).map(function(ix){return keyOf(toks[ix].w);}).join(' ');
        if (gloss[key]){ toks[words[a]].phrase={n:n, key:key}; for (var b=1;b<n;b++) used[words[a+b]]=words[a]; break; } }
    }
    for (i=0;i<toks.length;i++){
      var t=toks[i];
      if (t.sp!=null){ if (!(toks[i+1] && used[i+1]!=null)) out+=t.sp; continue; }   // 구 안의 띄어쓰기는 구 span 이 이미 넣음
      if (used[i]!=null) continue;
      if (t.phrase){ var seg=''; var cnt=0, j=i; while (cnt<t.phrase.n && j<toks.length){ if (toks[j].w!=null){ seg+=(cnt?' ':'')+toks[j].w; cnt++; } j++; }
        out+=wordSpan(seg, t.phrase.key, gloss, vocab); continue; }
      out+=wordSpan(t.w, keyOf(t.w), gloss, vocab);
    }
    return out;
  }
  function wordSpan(surface, key, gloss, vocab){
    if (!key) return esc(surface);
    var g=gloss[key], cls='rd-w';
    if (RS.words[key] || (g && RS.words[keyOf(g.w)])) cls+=' kn'; else if (vocab.indexOf(key)>=0 || (g && vocab.indexOf(keyOf(g.w))>=0)) cls+=' nw'; else if (g) cls+=' gl';
    var m=surface.match(/^([^A-Za-z0-9’']*)(.*?)([^A-Za-z0-9’']*)$/), pre=m?m[1]:'', core=m?m[2]:surface, post=m?m[3]:'';
    return esc(pre)+'<span class="'+cls+'" data-k="'+esc(key)+'">'+esc(core)+'</span>'+esc(post);
  }
  function sentenceOf(el){
    var p=el.closest('p'); if (!p) return ''; var txt=p.innerText, w=el.innerText, idx=txt.indexOf(w);
    var s=txt.lastIndexOf('. ',idx), e=txt.indexOf('. ',idx+w.length); return txt.slice(s<0?0:s+2, e<0?txt.length:e+1).trim();
  }
  function viewReader(){
    var A=RS.art; if (!A) return '';
    var gloss=A.gloss||{}, vocab=(A.vocab||[]).map(keyOf), L=RS.log[A.id]||{secs:0};
    var bar='<div class="rd-bar"><button class="rd-btn" data-rnav="today">'+icon('arrow_back',16)+' 목록</button><span class="rd-num" id="rd-clock" style="font-size:18px;min-width:56px">'+mmss(L.secs)+'</span>'
      +'<div style="flex:1;min-width:80px;height:4px;background:rgba(255,255,255,.2)"><div id="rd-prog" style="height:4px;width:0;background:#7C9BEA"></div></div>'
      +'<button class="rd-btn" data-act="marks">'+icon(RS.showMarks?'ink_highlighter':'format_color_reset',16)+' 표시 '+(RS.showMarks?'켬':'끔')+'</button><button class="rd-btn" data-act="fminus">A−</button><button class="rd-btn" data-act="fplus">A+</button></div>';
    var text='<article class="rd-text" style="font-size:'+RS.font+'px">'
      +'<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px"><span class="rd-tag" style="background:#16161A;color:#fff">'+esc(A.source)+'</span><span class="rd-tag">'+esc(A.level||'')+'</span><span class="rd-tag" style="background:#F1F1F4;color:#5B5B66">'+(A.minutes||'?')+'분 · '+(A.words||'')+' words</span></div>'
      +'<h2 style="font-family:Arial,Helvetica,sans-serif;font-size:'+(RS.font+9)+'px;font-weight:800;line-height:1.3;margin:0 0 6px">'+esc(A.title)+'</h2>'
      +'<div style="font-size:12.5px;color:#5B5B66;margin-bottom:18px">'+esc(A.author||'')+(A.published?' · '+esc(A.published):'')+'</div>'
      +(A.paras||[]).map(function(p){ var isHead=p.length<90 && !/[.!?"”:]$/.test(p.trim()); /* 원문 중간 제목·KEY TAKEAWAYS 줄 */ return isHead?'<p style="font-weight:800;font-size:1.05em;margin-top:26px;margin-bottom:8px">'+tokenize(p,gloss,vocab)+'</p>':'<p>'+tokenize(p,gloss,vocab)+'</p>'; }).join('')
      +'<div style="font-size:12px;color:#5B5B66;border-top:1px solid #ECECF0;padding-top:10px;margin-top:8px">'+esc(A.attribution||'')+' <a href="'+esc(A.url)+'" target="_blank" rel="noopener" style="color:'+ACC+'">원문 ↗</a> · '+esc(A.license||'')+'</div>'
      +afterHtml(A)+'</article>';
    var side='<aside class="rd-side">'+popHtml()+vocabHtml(A,vocab)+'</aside>';
    return bar+'<div class="rd-split">'+text+side+'</div>';
  }
  function popHtml(){
    var s=RS.sel;
    if (!s) return '<div class="rd-box rd-pop" style="color:#5B5B66;font-size:13px;line-height:1.7">'+icon('touch_app',22)+'<br>모르는 단어를 누르면 여기에 뜻·발음·예문이 떠요.<br><span style="background:#DBEAFE;padding:0 4px">파랑</span> 이 글 핵심 단어 · <span style="background:#FEF3C7;padding:0 4px">노랑</span> 내 단어장</div>';
    var g=s.g||{}, saved=!!RS.words[s.key];
    return '<div class="rd-box rd-pop" style="border-top:3px solid '+ACC+'">'
      +'<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px"><div><div style="font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:800">'+esc(g.w||s.surface)+'</div><div style="font-size:12px;color:#5B5B66;margin-top:2px">'+esc(g.ipa||'')+(g.pos?' · '+esc(g.pos):'')+'</div></div>'
      +'<button class="rd-btn" data-act="say" title="발음">'+icon('volume_up',16)+'</button></div>'
      +(g.ko?'<div style="font-size:16px;font-weight:800;color:'+ACC+';margin-top:10px">'+esc(g.ko)+'</div>':s.loading?'<div style="margin-top:10px;color:#5B5B66">사전 찾는 중…</div>':'<div style="margin-top:10px;font-size:12.5px;color:#5B5B66">한국어 뜻은 없어요 · <a href="https://translate.google.com/?sl=en&tl=ko&text='+encodeURIComponent(s.surface)+'" target="_blank" rel="noopener" style="color:'+ACC+'">번역 ↗</a></div>')
      +(g.en?'<div style="font-size:13px;margin-top:6px;line-height:1.5">'+esc(g.en)+'</div>':'')
      +(g.defs?g.defs.map(function(x){ return '<div style="font-size:13px;margin-top:6px;line-height:1.5"><span class="rd-tag" style="background:#F1F1F4;color:#5B5B66;margin-right:4px">'+esc(x.pos)+'</span>'+esc(x.def)+'</div>'; }).join(''):'')
      +(g.ex?'<div style="font-family:Arial,Helvetica,sans-serif;font-size:13.5px;margin-top:8px;padding:8px 10px;background:#F8F8FA;line-height:1.55">'+esc(g.ex)+'</div>':'')
      +(s.ctx?'<div class="rd-k" style="margin-top:10px">이 글에서</div><div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.55;margin-top:4px;color:#475569">'+esc(s.ctx).replace(new RegExp(esc(s.surface).replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i'),function(m){return '<b style="color:#16161A">'+m+'</b>';})+'</div>':'')
      +'<div style="display:flex;gap:6px;margin-top:12px"><button class="rd-btn'+(saved?'':' pri')+'" data-act="'+(saved?'unsave':'save')+'">'+icon(saved?'bookmark_remove':'bookmark_add',16)+' '+(saved?'단어장에서 빼기':'내 단어장 +')+'</button></div></div>';
  }
  function vocabHtml(A,vocab){
    if (!vocab.length) return '';
    var g=A.gloss||{};
    return '<div class="rd-box"><div class="rd-k" style="margin-bottom:8px">이 글 핵심 단어 '+vocab.length+'</div><div style="display:flex;flex-wrap:wrap;gap:5px">'+vocab.map(function(k){ var x=g[k]||{}, kn=!!RS.words[k];
      return '<button data-vjump="'+esc(k)+'" style="padding:4px 8px;border:1px solid '+(kn?'#FCD34D':'#BFDBFE')+';background:'+(kn?'#FEF3C7':'#EFF6FF')+';font-size:12.5px;text-align:left"><b style="font-family:Arial,Helvetica,sans-serif">'+esc(x.w||k)+'</b> <span style="color:#5B5B66;font-size:11.5px">'+esc(x.ko||'')+'</span></button>'; }).join('')+'</div></div>';
  }
  function afterHtml(A){
    var q=A.quiz||[], pr=A.para||[], L=RS.log[A.id]||{}, ans=L.quiz||{};
    var quiz=q.map(function(x,i){ var my=ans[i], shown=my!=null, ok=shown && my===x.a;
      return '<div style="padding:10px 0;border-bottom:1px solid #ECECF0"><div style="font-family:Arial,Helvetica,sans-serif;font-size:14.5px;line-height:1.5"><b class="rd-num" style="color:'+ACC+'">'+(i+1)+'</b> '+esc(x.q)+'</div><div style="display:flex;gap:4px;margin-top:6px">'+['TRUE','FALSE','NOT GIVEN'].map(function(o){ var on=my===o, col=shown&&o===x.a?OK:on?BAD:null;
        return '<button data-quiz="'+i+'|'+o+'" style="height:28px;padding:0 10px;font-size:12px;font-weight:800;border:1px solid '+(col||'#DCDCE3')+';background:'+(col?col:'#fff')+';color:'+(col?'#fff':'#16161A')+'">'+o+'</button>'; }).join('')+'</div>'
        +(shown?'<div style="font-size:12.5px;margin-top:6px;color:'+(ok?OK:BAD)+';font-weight:700">'+(ok?'맞아요':'정답 '+esc(x.a))+' <span style="color:#5B5B66;font-weight:500">· '+esc(x.why||'')+'</span></div>':'')+'</div>'; }).join('');
    var paras=pr.map(function(x,i){ var sh=(RS.paraShown||{})[i];
      return '<div style="display:grid;grid-template-columns:1fr 20px 1fr;gap:6px;align-items:center;padding:7px 0;border-bottom:1px solid #ECECF0;font-family:Arial,Helvetica,sans-serif;font-size:13.5px"><span style="color:#5B5B66">'+esc(x.simple)+'</span><span style="color:'+ACC+'">'+icon('arrow_forward',15)+'</span>'
        +(sh?'<b style="color:#1A3FB5">'+esc(x.article)+'</b>':'<button data-pshow="'+i+'" style="height:26px;background:#16161A;color:#fff;font-size:11.5px;font-weight:700">글에서 찾아보고 누르기</button>')+'</div>'; }).join('');
    var sum=L.summary||'';
    return '<section style="margin-top:28px;border-top:2px solid #16161A;padding-top:18px;font-family:Pretendard,sans-serif">'
      +'<div style="font-size:18px;font-weight:800;margin-bottom:4px">읽고 나서 3분</div><div style="font-size:12.5px;color:#5B5B66;margin-bottom:14px">IELTS 처럼 — 확인 문제 → 바꿔 말하기 찾기 → 한 줄 요약</div>'
      +(quiz?'<div class="rd-box" style="margin-bottom:12px"><div class="rd-k">① T / F / NG</div>'+quiz+'</div>':'')
      +(paras?'<div class="rd-box" style="margin-bottom:12px"><div class="rd-k">② 쉬운 말 → 글에서는 어떻게 썼나</div>'+paras+'</div>':'')
      +'<div class="rd-box" style="margin-bottom:12px"><div class="rd-k" style="margin-bottom:8px">③ 한 줄 요약 (영어로, 내 말로)</div><textarea class="rd-in" id="rd-sum" rows="2" placeholder="The article argues that…">'+esc(sum)+'</textarea>'
      +'<div style="display:flex;gap:6px;margin-top:8px;align-items:flex-start"><button class="rd-btn" data-act="sumshow">'+icon('visibility',16)+' 모범 요약</button>'+(RS.sumShown&&A.summary?'<div style="font-family:Arial,Helvetica,sans-serif;font-size:13.5px;padding:6px 10px;background:#F0FDF4;border-left:3px solid '+OK+';flex:1">'+esc(A.summary)+'</div>':'')+'</div></div>'
      +'<div style="display:flex;justify-content:flex-end"><button class="rd-btn pri" data-act="done" style="height:38px;padding:0 18px">'+icon(L.done?'task_alt':'check',18)+' '+(L.done?'다 읽음 · '+mmss(L.secs):'다 읽었어요')+'</button></div></section>';
  }

  // ════════ MY WORDS · REVIEW ════════
  function viewWords(){
    var ks=Object.keys(RS.words).sort(function(a,b){ return (RS.words[b].added||'').localeCompare(RS.words[a].added||''); });
    if (!ks.length) return '<div class="rd-box" style="text-align:center;color:#5B5B66;line-height:1.8">'+icon('bookmark_add',28)+'<br>글을 읽다가 모르는 단어를 누르고 <b>내 단어장 +</b> 를 눌러요.<br>단어는 <b>그 단어가 나온 문장</b>과 같이 저장돼서, 복습할 때 문장 속 빈칸으로 나와요.</div>';
    var boxes=[0,0,0,0,0,0]; ks.forEach(function(k){ boxes[RS.words[k].box||0]++; });
    return '<div class="rd-box" style="display:grid;grid-template-columns:repeat(6,1fr);gap:4px;margin-bottom:16px">'+boxes.map(function(n,i){ return '<div style="text-align:center"><div style="height:40px;display:flex;align-items:flex-end;background:#F8F8FA"><div style="width:100%;height:'+Math.max(4,n/ks.length*100)+'%;background:'+(i===0?'#DCDCE3':i>=4?OK:ACC)+'"></div></div><div style="font-size:11px;font-weight:700;color:#5B5B66;margin-top:4px">'+(i===0?'새로':'단계 '+i)+' · '+n+'</div></div>'; }).join('')+'</div>'
      +'<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:8px">'+ks.map(function(k){ var w=RS.words[k];
        return '<div class="rd-box" style="padding:12px"><div style="display:flex;justify-content:space-between;gap:8px"><div><b style="font-family:Arial,Helvetica,sans-serif;font-size:16px">'+esc(w.w||k)+'</b> <span style="color:'+ACC+';font-weight:700;font-size:13px">'+esc(w.ko||'')+'</span></div><button data-wdel="'+esc(k)+'" style="color:#8A8A95">'+icon('close',16)+'</button></div>'
          +(w.ctx?'<div style="font-family:Arial,Helvetica,sans-serif;font-size:12.5px;color:#475569;margin-top:6px;line-height:1.5">'+esc(w.ctx)+'</div>':'')
          +(w.mine?'<div style="font-family:Arial,Helvetica,sans-serif;font-size:12.5px;margin-top:6px;padding:4px 8px;background:#F0FDF4;border-left:3px solid '+OK+'">'+icon('edit',13)+' '+esc(w.mine)+'</div>':'')
          +'<div style="font-size:11px;color:#8A8A95;margin-top:6px">'+esc(w.title||'')+' · '+esc(w.added||'')+' · 단계 '+(w.box||0)+'</div></div>'; }).join('')+'</div>';
  }
  function cloze(ctx, w){
    if (!ctx) return null; var re=new RegExp('\\b'+String(w).replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'\\w*','i'); var m=ctx.match(re); if (!m) return null;
    return {before:ctx.slice(0,m.index), ans:m[0], after:ctx.slice(m.index+m[0].length)};
  }
  function viewReview(){
    if (!RS.rv){ var d=dueWords(); d.sort(function(){return Math.random()-.5;}); RS.rv={list:d.slice(0,15), i:0, ok:0, state:'ask'}; }
    var R=RS.rv, k=R.list[R.i];
    if (!k) return '<div class="rd-box" style="text-align:center;line-height:1.8">'+icon('celebration',30)+'<br><b style="font-size:18px">오늘 복습 끝</b><br><span style="color:#5B5B66">'+R.ok+' / '+R.list.length+' 맞힘 · 맞힌 단어는 다음 단계로(1·2·4·8·16일 뒤)</span><div style="margin-top:12px"><button class="rd-btn" data-act="rvagain">'+icon('refresh',16)+' 다시 섞기</button></div></div>';
    var w=RS.words[k], cz=cloze(w.ctx, w.w||k);
    var q=cz?'<div style="font-family:Arial,Helvetica,sans-serif;font-size:18px;line-height:1.75">'+esc(cz.before)+'<span style="display:inline-block;min-width:90px;border-bottom:3px solid '+ACC+';text-align:center;font-weight:800;color:'+(R.state==='ask'?'transparent':R.last?OK:BAD)+'">'+(R.state==='ask'?'____':esc(cz.ans))+'</span>'+esc(cz.after)+'</div>'
      :'<div style="font-size:16px;color:#5B5B66">뜻을 보고 영어 단어를 써요</div>';
    return '<div class="rd-box" style="max-width:760px">'
      +'<div style="display:flex;justify-content:space-between;margin-bottom:14px"><span class="rd-k">'+(R.i+1)+' / '+R.list.length+' · 문장 속 빈칸 채우기</span><span class="rd-k">'+esc(w.title||'')+'</span></div>'
      +q+'<div style="margin-top:12px;font-size:15px;font-weight:800;color:'+ACC+'">힌트: '+esc(w.ko||'')+' <span style="color:#8A8A95;font-weight:600;font-size:12px">('+String(w.w||k).length+'글자'+(String(w.w||k)[0]?', '+esc(String(w.w||k)[0])+'…':'')+')</span></div>'
      +(R.state==='ask'?'<div style="display:flex;gap:6px;margin-top:14px"><input class="rd-in" id="rd-rv-in" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="단어 입력 후 Enter" style="font-size:16px"><button class="rd-btn pri" data-act="rvcheck">확인</button><button class="rd-btn" data-act="rvskip">몰라요</button></div>'
        :'<div style="margin-top:14px;padding:10px 12px;background:'+(R.last?'#F0FDF4':'#FEF2F2')+'"><b style="color:'+(R.last?OK:BAD)+'">'+(R.last?'맞아요':'정답: '+esc(w.w||k))+'</b>'+(w.ex?'<div style="font-family:Arial,Helvetica,sans-serif;font-size:13.5px;margin-top:6px">'+esc(w.ex)+'</div>':'')+'</div>'
          +'<div class="rd-k" style="margin-top:14px;margin-bottom:6px">내 문장으로 써보기 (선택) — 내 일·생활 얘기로</div><input class="rd-in" id="rd-mine" value="'+esc(w.mine||'')+'" placeholder="I had to '+esc(w.w||k)+' …">'
          +'<div style="display:flex;justify-content:flex-end;margin-top:10px"><button class="rd-btn pri" data-act="rvnext">다음 '+icon('arrow_forward',16)+'</button></div>')+'</div>';
  }

  // ════════ 렌더 · 이벤트 ════════
  function render(){
    var el=document.getElementById('eng-read-view'); if (!el) return;
    css(); el.classList.toggle('marks', RS.showMarks);
    var due=dueWords().length;
    var nav='<nav class="rd-nav">'+[['today','Today','today'],['library','Library','library_books'],['words','My Words','bookmark'],['review','Review','replay']].map(function(n){ var on=RS.view===n[0]||(RS.view==='reader'&&n[0]==='today');
      return '<button data-rnav="'+n[0]+'" class="'+(on?'on':'')+'">'+icon(n[2],17)+n[1]+(n[0]==='review'&&due?' <span style="background:'+(on?'#fff':ACC)+';color:'+(on?ACC:'#fff')+';font-size:11px;padding:0 6px">'+due+'</span>':'')+'</button>'; }).join('')+'</nav>';
    var body= RS.view==='reader'?viewReader() : RS.view==='library'?viewLibrary() : RS.view==='words'?viewWords() : RS.view==='review'?viewReview() : viewToday();
    el.innerHTML=nav+body;
    if (RS.view==='review'){ var i=document.getElementById('rd-rv-in'); if (i) i.focus(); }
  }
  function select(el){
    var key=el.dataset.k, A=RS.art||{}, g=(A.gloss||{})[key]||null;
    document.querySelectorAll('#eng-read-view .rd-w.sel').forEach(function(x){x.classList.remove('sel');}); el.classList.add('sel');
    RS.sel={key:key, surface:el.innerText, g:g, ctx:sentenceOf(el), loading:!g};
    refreshPop();
    if (!g) lookup(key);
  }
  function refreshPop(){ var p=document.querySelector('#eng-read-view .rd-pop'); if (p){ var d=document.createElement('div'); d.innerHTML=popHtml(); p.replaceWith(d.firstChild); } }
  async function lookup(key){
    var sel=RS.sel;
    try {
      var r=await fetch('https://api.dictionaryapi.dev/api/v2/entries/en/'+encodeURIComponent(key)); if (!r.ok) throw 0;
      var j=await r.json(), e=j[0]||{}, m=(e.meanings||[])[0]||{}, d=(m.definitions||[])[0]||{};
      var ex=null; (e.meanings||[]).some(function(mm){ return (mm.definitions||[]).some(function(dd){ if (dd.example){ ex=dd.example; return true; } }); });
      if (RS.sel!==sel) return;
      var defs=(e.meanings||[]).slice(0,3).map(function(mm){ return {pos:mm.partOfSpeech, def:((mm.definitions||[])[0]||{}).definition||''}; });
      sel.g={w:e.word||key, defs:defs, pos:'', en:'', ex:ex||'', ipa:e.phonetic||((e.phonetics||[]).find(function(p){return p.text;})||{}).text||'', audio:((e.phonetics||[]).find(function(p){return p.audio;})||{}).audio||''};
    } catch(err){ if (RS.sel===sel) sel.g={w:key}; }
    sel.loading=false; refreshPop();
  }
  function say(text){
    var g=RS.sel&&RS.sel.g; if (g&&g.audio){ try { new Audio(g.audio).play(); return; } catch(e){} }
    try { window.speechSynthesis.cancel(); var u=new SpeechSynthesisUtterance(text); u.lang='en-GB'; if (window.atlApplyVoice) atlApplyVoice(u,'en-GB'); u.rate=0.9; window.speechSynthesis.speak(u); } catch(e){}
  }
  function bind(){
    var root=document.getElementById('eng-read-view'); if (!root || root._rdBound) return; root._rdBound=true;
    root.addEventListener('click', function(e){
      var w=e.target.closest('.rd-w'); if (w){ select(w); return; }
      var t=e.target.closest('[data-rnav],[data-open],[data-act],[data-quiz],[data-pshow],[data-vjump],[data-wdel]'); if (!t) return; var d=t.dataset;
      if (d.rnav){ if (RS.view==='reader') stopTimer(); RS.view=d.rnav; if (d.rnav==='review') RS.rv=null; render(); return; }
      if (d.open){ openArticle(d.open); return; }
      if (d.quiz){ var q=d.quiz.split('|'), L=RS.log[RS.art.id]=RS.log[RS.art.id]||{secs:0,date:today()}; L.quiz=L.quiz||{}; L.quiz[q[0]]=q[1]; save(); var y=window.scrollY; render(); window.scrollTo(0,y); return; }
      if (d.pshow!=null){ RS.paraShown[d.pshow]=1; var ph=RS.art.para[d.pshow].article; var y2=window.scrollY; render(); window.scrollTo(0,y2);
        var ps=[].slice.call(root.querySelectorAll('.rd-text p')).find(function(p){return p.innerText.indexOf(ph)>=0;}); if (ps){ ps.style.background='#FEF9C3'; setTimeout(function(){ ps.style.background=''; },2500); } return; }
      if (d.vjump){ var el=root.querySelector('.rd-w[data-k="'+CSS.escape(d.vjump)+'"]'); if (el){ el.scrollIntoView({block:'center'}); select(el); } return; }
      if (d.wdel){ delete RS.words[d.wdel]; save(); render(); return; }
      var a=d.act;
      if (a==='marks'){ RS.showMarks=!RS.showMarks; root.classList.toggle('marks',RS.showMarks); t.innerHTML=icon(RS.showMarks?'ink_highlighter':'format_color_reset',16)+' 표시 '+(RS.showMarks?'켬':'끔'); return; }
      if (a==='fplus'||a==='fminus'){ RS.font=Math.max(14,Math.min(24,RS.font+(a==='fplus'?1:-1))); var ar=root.querySelector('.rd-text'); if (ar) ar.style.fontSize=RS.font+'px'; try { localStorage.setItem('atelier_read_font',RS.font); } catch(err){} return; }
      if (a==='say'){ say((RS.sel.g&&RS.sel.g.w)||RS.sel.surface); return; }
      if (a==='save'){ var s=RS.sel, g=s.g||{}, k=keyOf(g.w||s.key);
        RS.words[k]={w:g.w||s.surface, ko:g.ko||'', en:g.en||'', ex:g.ex||'', ctx:s.ctx, src:RS.art.id, title:RS.art.title, added:today(), box:0, due:0};
        save(); root.querySelectorAll('.rd-w').forEach(function(x){ if (x.dataset.k===s.key||x.dataset.k===k){ x.classList.remove('nw','gl'); x.classList.add('kn'); } }); refreshPop(); return; }
      if (a==='unsave'){ var s2=RS.sel, k2=keyOf((s2.g&&s2.g.w)||s2.key); delete RS.words[k2]; delete RS.words[s2.key]; save(); root.querySelectorAll('.rd-w').forEach(function(x){ if (x.dataset.k===s2.key||x.dataset.k===k2) x.classList.remove('kn'); }); refreshPop(); return; }
      if (a==='sumshow'){ RS.sumShown=!RS.sumShown; var y3=window.scrollY; render(); window.scrollTo(0,y3); return; }
      if (a==='done'){ var L2=RS.log[RS.art.id]=RS.log[RS.art.id]||{secs:0,date:today()}; L2.done=true; L2.doneAt=today(); save(); toast('오늘 읽기 완료 — '+mmss(L2.secs)); var y4=window.scrollY; render(); window.scrollTo(0,y4); return; }
      if (a==='rvcheck'||a==='rvskip'){ var R=RS.rv, kk=R.list[R.i], ww=RS.words[kk], v=a==='rvskip'?'':(document.getElementById('rd-rv-in')||{}).value||'';
        var ok=!!v && (keyOf(v)===keyOf(ww.w||kk) || (cloze(ww.ctx,ww.w||kk)||{}).ans && keyOf(v)===keyOf(cloze(ww.ctx,ww.w||kk).ans));
        R.last=ok; R.state='shown'; if (ok){ R.ok++; ww.box=Math.min(5,(ww.box||0)+1); ww.due=Date.now()+BOX_DAYS[ww.box]*86400000; } else { ww.box=1; ww.due=Date.now()+20*3600000; } save(); render(); return; }
      if (a==='rvnext'){ var m=document.getElementById('rd-mine'), R2=RS.rv; if (m && m.value.trim()){ RS.words[R2.list[R2.i]].mine=m.value.trim(); save(); } R2.i++; R2.state='ask'; render(); return; }
      if (a==='rvagain'){ RS.rv=null; render(); return; }
    });
    root.addEventListener('input', function(e){ if (e.target.id==='rd-sum' && RS.art){ var L=RS.log[RS.art.id]=RS.log[RS.art.id]||{secs:0,date:today()}; L.summary=e.target.value; save(); } });
    root.addEventListener('keydown', function(e){ if (e.key==='Enter' && e.target.id==='rd-rv-in'){ e.preventDefault(); var b=root.querySelector('[data-act="rvcheck"]'); if (b) b.click(); } else if (e.key==='Enter' && e.target.id==='rd-mine'){ var n=root.querySelector('[data-act="rvnext"]'); if (n) n.click(); } });
    window.addEventListener('scroll', function(){ if (RS.view!=='reader') return; var ar=root.querySelector('.rd-text'), p=document.getElementById('rd-prog'); if (!ar||!p) return; var r=ar.getBoundingClientRect(); p.style.width=Math.max(0,Math.min(100,(-r.top+innerHeight*0.6)/r.height*100))+'%'; }, {passive:true});
  }

  window.renderEnglishRead = async function(){
    var el=document.getElementById('eng-read-view'); if (!el) return;
    try { RS.font=+localStorage.getItem('atelier_read_font')||17; } catch(e){}
    bind(); css();
    if (!RS.loaded){ el.innerHTML='<div class="rd-box" style="color:#5B5B66">불러오는 중…</div>'; await load(); }
    render(); if (RS.view==='reader') startTimer();
  };
  window.stopEnglishRead = stopTimer;
  window.ENG_READ = RS;
})();
