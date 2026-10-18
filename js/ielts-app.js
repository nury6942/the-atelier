// ═══ ENGLISH › IELTS 앱 (2026-10-18) ═══
// 화면: Home · Listening · Reading · Writing · Speaking · Scores · Weak spots · Cards · Guide
// 문제 = js/ielts-bank.js (window.IELTS_BANK, 오리지널 문제) · 계획·전략 = js/ielts-page.js (window.IELTS_DATA)
// 저장 = Firestore `ieltsRecords`(기록 한 건 = 문서 하나) + `ielts/state`(약점 횟수·카드 상자) · 로그인 안 됐으면 localStorage 만
(function(){
  var LS_KEY = 'atelier_ielts_v1';
  var ST = { view:'home', records:[], weak:{}, cards:{}, myCards:[], loaded:false, timers:{} };
  var ACC = '#1F4BD8', OK = '#15803d', MID = '#b45309', BAD = '#b91c1c';

  // ── GT 공식 환산표 (정답 수 → 밴드) ──
  var BAND_L = [[39,9],[37,8.5],[35,8],[32,7.5],[30,7],[26,6.5],[23,6],[18,5.5],[16,5],[13,4.5],[10,4],[8,3.5],[6,3],[4,2.5],[0,0]];
  var BAND_R = [[40,9],[39,8.5],[38,8],[36,7.5],[34,7],[32,6.5],[30,6],[27,5.5],[23,5],[19,4.5],[15,4],[12,3.5],[9,3],[6,2.5],[0,0]];
  function toBand(t, n){ if (n==null || n==='' || isNaN(n)) return null; n=+n; for (var i=0;i<t.length;i++) if (n>=t[i][0]) return t[i][1]; return 0; }
  function overall(a){ var v=a.filter(function(x){return x!=null && x!=='';}); if (v.length<4) return null; var m=v.reduce(function(s,x){return s+ +x;},0)/4; return Math.floor(m*2+0.5)/2; }
  function bandColor(b){ return b==null ? 'var(--atl-text-3,#8A8A95)' : b>=7 ? OK : b>=6.5 ? MID : BAD; }
  function fmtB(b){ return b==null ? '—' : (+b).toFixed(1); }

  var TYPES = {
    L:[['l-form','표·폼 빈칸'],['l-sentence','문장 완성'],['l-mcq','객관식'],['l-map','지도·도면'],['l-match','연결하기'],['l-spell','철자·복수 s']],
    R:[['r-tfng','T/F/NG'],['r-ynng','Y/N/NG'],['r-heading','제목 고르기'],['r-match','문단 찾기'],['r-mcq','객관식'],['r-gap','요약 빈칸'],['r-short','단답'],['r-time','시간 부족']],
    W:[['w-task','과제 누락'],['w-tone','편지 톤'],['w-cohesion','글 흐름'],['w-article','관사'],['w-plural','복수·일치'],['w-tense','시제'],['w-length','분량 부족'],['w-repeat','단어 반복']],
    S:[['s-short','답 짧음'],['s-pause','멈춤'],['s-p2time','2분 못 채움'],['s-vocab','어휘 반복'],['s-grammar','문법'],['s-pron','발음']]
  };
  var AREA = { L:{name:'Listening', icon:'headphones'}, R:{name:'Reading', icon:'menu_book'}, W:{name:'Writing', icon:'edit_note'}, S:{name:'Speaking', icon:'mic'} };
  function typeName(id){ for (var k in TYPES) for (var i=0;i<TYPES[k].length;i++) if (TYPES[k][i][0]===id) return TYPES[k][i][1]; return id; }

  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function plan(){ return window.IELTS_DATA || { exam:{date:'2027-09-11'}, mocks:[], goals:[] }; }
  function bank(){ return window.IELTS_BANK || { listening:[], reading:[], writing:{task1:[],task2:[]}, speaking:{part1:[],part2:[]}, vocab:[] }; }
  function today(){ var d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
  function days(s){ var a=s.split('-'), t=new Date(); t.setHours(0,0,0,0); return Math.round((new Date(+a[0],+a[1]-1,+a[2])-t)/86400000); }
  function mmss(sec){ sec=Math.max(0,Math.round(sec)); return Math.floor(sec/60)+':'+String(sec%60).padStart(2,'0'); }
  function uid(){ return today()+'-'+Math.random().toString(36).slice(2,7); }
  function norm(s){ return String(s==null?'':s).toLowerCase().replace(/[’']/g,"'").replace(/[.,;:!?"]+$/,'').replace(/\s+/g,' ').trim(); }
  function isRight(given, answer){ var g=norm(given); if (!g) return false; var a=Array.isArray(answer)?answer:[answer]; return a.some(function(x){ return norm(x)===g; }); }
  // 보기의 채점용 기호 — 'B  ...' → B, 'iv  ...' → iv, 'NOT GIVEN' 은 통째로
  function optTok(o){ o=String(o).trim(); var m=o.match(/^([A-Za-z]|[ivxlIVXL]+)[\s.)]+\S/); return m?m[1]:o; }
  function toast(msg){ if (typeof showSyncToast==='function') showSyncToast(msg); }

  // ── 저장 ──
  function fb(){ return (typeof db!=='undefined' && db && typeof firebase!=='undefined' && firebase.auth && firebase.auth().currentUser) ? db : null; }
  function cacheSave(){ try { localStorage.setItem(LS_KEY, JSON.stringify({records:ST.records, weak:ST.weak, cards:ST.cards, myCards:ST.myCards})); } catch(e){} }
  function cacheLoad(){ try { var c=JSON.parse(localStorage.getItem(LS_KEY)||'null'); if (c){ ST.records=c.records||[]; ST.weak=c.weak||{}; ST.cards=c.cards||{}; ST.myCards=c.myCards||[]; } } catch(e){} }
  async function load(){
    cacheLoad();
    var d=fb(); if (!d){ ST.loaded=true; return; }
    try {
      var snap=await d.collection('ieltsRecords').get();
      ST.records=snap.docs.map(function(x){ var o=x.data(); o._id=x.id; return o; });
      var st=await d.collection('ielts').doc('state').get();
      if (st.exists){ var o=st.data(); ST.weak=o.weak||{}; ST.cards=o.cards||{}; ST.myCards=o.myCards||[]; }
      cacheSave();
    } catch(e){ console.warn('[IELTS] load', e); }
    ST.loaded=true;
  }
  async function saveRecord(rec){
    rec._id = rec._id || uid(); rec.updatedAt = new Date().toISOString();
    var i=ST.records.findIndex(function(r){return r._id===rec._id;}); if (i>=0) ST.records[i]=rec; else ST.records.push(rec);
    cacheSave();
    var d=fb(); if (d){ var o=Object.assign({},rec); delete o._id; try { await d.collection('ieltsRecords').doc(rec._id).set(o,{merge:true}); } catch(e){ toast('저장 실패 — 이 기기에만 남았어요'); } }
    return rec;
  }
  async function deleteRecord(id){
    ST.records=ST.records.filter(function(r){return r._id!==id;}); cacheSave();
    var d=fb(); if (d){ try { if (typeof trashBeforeDelete==='function') await trashBeforeDelete('ieltsRecords', id); await d.collection('ieltsRecords').doc(id).delete(); } catch(e){} }
  }
  var _stT; function saveState(){ cacheSave(); clearTimeout(_stT); _stT=setTimeout(async function(){ var d=fb(); if (d){ try { await d.collection('ielts').doc('state').set({weak:ST.weak, cards:ST.cards, myCards:ST.myCards, updatedAt:new Date().toISOString()},{merge:true}); } catch(e){} } },600); }
  function addWeak(type, n){ if (!type) return; ST.weak[type]=(ST.weak[type]||0)+(n||1); if (ST.weak[type]<0) ST.weak[type]=0; saveState(); }

  // ── 기록에서 숫자 뽑기 ──
  function recsOf(kind){ return ST.records.filter(function(r){return r.kind===kind;}).sort(function(a,b){ return (a.date||'').localeCompare(b.date||'') || (a.updatedAt||'').localeCompare(b.updatedAt||''); }); }
  function mockRec(n){ return ST.records.find(function(r){ return r.kind==='mock' && +r.n===+n; }); }
  function latestBands(){
    var g={}; (plan().goals||[]).forEach(function(x){ g[x.k]=x.now; });
    var out={L:null,R:null,W:null,S:null,src:{}};
    ['L','R','W','S'].forEach(function(k){
      var cand=ST.records.filter(function(r){ return r.bands && r.bands[k]!=null; }).sort(function(a,b){return (a.date||'').localeCompare(b.date||'');});
      if (cand.length){ out[k]=cand[cand.length-1].bands[k]; out.src[k]='기록'; } else { out[k]=g[k]!=null?Math.floor(g[k]*2)/2:null; out.src[k]='추정'; } // 추정치는 내림 — 이미 목표 넘은 것처럼 안 보이게
    });
    return out;
  }

  // ── 공통 조각 ──
  function icon(n, sz){ return '<span class="material-symbols-outlined" style="font-size:'+(sz||18)+'px;vertical-align:-3px">'+n+'</span>'; }
  function head(title, sub, right){ return '<div class="ia-head"><div><h3>'+esc(title)+'</h3>'+(sub?'<p>'+esc(sub)+'</p>':'')+'</div>'+(right||'')+'</div>'; }
  function bar(v, max, col, h){ return '<div class="ia-bar" style="height:'+(h||8)+'px"><i style="width:'+Math.max(0,Math.min(100,v/max*100))+'%;background:'+col+'"></i></div>'; }

  var NAV = [['home','Home','space_dashboard'],['listening','Listening','headphones'],['reading','Reading','menu_book'],['writing','Writing','edit_note'],['speaking','Speaking','mic'],['scores','Scores','monitoring'],['weak','Weak Spots','target'],['cards','Cards','style'],['guide','Guide','map']];

  function css(){
    if (document.getElementById('ia-style')) return;
    var st=document.createElement('style'); st.id='ia-style';
    st.textContent=[
      '#eng-ielts-view .ia{color:#16161A;font-size:14px}',
      '#eng-ielts-view .ia *{border-radius:0!important}',
      '#eng-ielts-view .ia-nav{display:flex;gap:0;border:1px solid #DCDCE3;margin-bottom:24px;overflow-x:auto;-webkit-overflow-scrolling:touch;background:#fff}',
      '#eng-ielts-view .ia-nav button{flex:1 0 auto;display:flex;flex-direction:column;align-items:center;gap:3px;padding:10px 14px;font-size:12px;font-weight:600;color:#5B5B66;border-right:1px solid #ECECF0;background:#fff;white-space:nowrap}',
      '#eng-ielts-view .ia-nav button:last-child{border-right:0}',
      '#eng-ielts-view .ia-nav button:hover{background:#F8F8FA;color:#16161A}',
      '#eng-ielts-view .ia-nav button.on{background:'+ACC+';color:#fff}',
      '#eng-ielts-view .ia-nav .material-symbols-outlined{font-size:20px}',
      '#eng-ielts-view .ia-head{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;margin:0 0 14px;padding-bottom:10px;border-bottom:1px solid #16161A;flex-wrap:wrap}',
      '#eng-ielts-view .ia-head h3{font-size:18px;font-weight:800;margin:0}',
      '#eng-ielts-view .ia-head p{font-size:12.5px;color:#5B5B66;margin:3px 0 0}',
      '#eng-ielts-view .ia-box{border:1px solid #DCDCE3;background:#fff;padding:16px}',
      '#eng-ielts-view .ia-grid{display:grid;gap:16px}',
      '#eng-ielts-view .ia-bar{position:relative;background:#F1F1F4;overflow:hidden}',
      '#eng-ielts-view .ia-bar i{position:absolute;left:0;top:0;bottom:0}',
      '#eng-ielts-view .ia-k{font-size:11.5px;font-weight:700;color:#5B5B66;letter-spacing:.02em}',
      '#eng-ielts-view .ia-num{font-variant-numeric:tabular-nums;font-weight:800}',
      '#eng-ielts-view .ia-btn{display:inline-flex;align-items:center;gap:6px;height:34px;padding:0 14px;font-size:13px;font-weight:700;border:1px solid #DCDCE3;background:#fff;color:#16161A;cursor:pointer;white-space:nowrap}',
      '#eng-ielts-view .ia-btn:hover{background:#F8F8FA}',
      '#eng-ielts-view .ia-btn.pri{background:'+ACC+';border-color:'+ACC+';color:#fff}',
      '#eng-ielts-view .ia-btn.pri:hover{background:#1A3FB5}',
      '#eng-ielts-view .ia-btn.sm{height:28px;padding:0 10px;font-size:12px}',
      '#eng-ielts-view .ia-in{height:34px;border:1px solid #DCDCE3;padding:0 10px;font-size:14px;background:#fff;width:100%;font-variant-numeric:tabular-nums}',
      '#eng-ielts-view .ia-in:focus,#eng-ielts-view .ia-ta:focus{outline:2px solid '+ACC+';outline-offset:-1px}',
      '#eng-ielts-view .ia-ta{width:100%;border:1px solid #DCDCE3;padding:14px;font-size:15px;line-height:1.7;font-family:Georgia,"Times New Roman",serif!important;resize:vertical;min-height:320px}',
      '#eng-ielts-view .ia-pick{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}',
      '#eng-ielts-view .ia-tile{border:1px solid #DCDCE3;padding:16px;background:#fff;cursor:pointer;text-align:left;display:flex;flex-direction:column;gap:6px}',
      '#eng-ielts-view .ia-tile:hover{border-color:'+ACC+'}',
      '#eng-ielts-view .ia-tile .t{font-size:15px;font-weight:800}',
      '#eng-ielts-view .ia-tile .s{font-size:12.5px;color:#5B5B66}',
      '#eng-ielts-view .ia-tag{display:inline-block;font-size:11px;font-weight:700;padding:2px 6px;background:#EEF2FD;color:'+ACC+'}',
      '#eng-ielts-view .ia-split{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:0;border:1px solid #DCDCE3;background:#fff}',
      '#eng-ielts-view .ia-split>div{padding:20px;max-height:72vh;overflow:auto}',
      '#eng-ielts-view .ia-split>div+div{border-left:1px solid #DCDCE3;background:#FCFCFD}',
      '#eng-ielts-view .ia-pass p{font-family:Georgia,"Times New Roman",serif!important;font-size:15px;line-height:1.75;margin:0 0 14px}',
      '#eng-ielts-view .ia-pass .lb{font-family:Pretendard,sans-serif!important;font-weight:800;color:'+ACC+';margin-right:8px}',
      '#eng-ielts-view .ia-q{padding:10px 0;border-bottom:1px solid #ECECF0}',
      '#eng-ielts-view .ia-q .qn{display:inline-grid;place-items:center;min-width:26px;height:22px;font-size:12px;font-weight:800;background:#16161A;color:#fff;margin-right:8px}',
      '#eng-ielts-view .ia-q .qt{font-size:14px;line-height:1.55}',
      '#eng-ielts-view .ia-q.ok .qn{background:'+OK+'}',
      '#eng-ielts-view .ia-q.no .qn{background:'+BAD+'}',
      '#eng-ielts-view .ia-q .why{font-size:12.5px;color:#5B5B66;margin-top:6px;padding:6px 8px;background:#F8F8FA}',
      '#eng-ielts-view .ia-opts{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}',
      '#eng-ielts-view .ia-opts button{min-width:40px;height:30px;padding:0 10px;border:1px solid #DCDCE3;background:#fff;font-size:12.5px;font-weight:700}',
      '#eng-ielts-view .ia-opts button.on{background:#16161A;color:#fff;border-color:#16161A}',
      '#eng-ielts-view .ia-opts.long{flex-direction:column}',
      '#eng-ielts-view .ia-opts.long button{text-align:left;height:auto;padding:7px 10px;font-weight:500}',
      '#eng-ielts-view .ia-timer{display:flex;align-items:center;gap:10px;padding:10px 14px;background:#16161A;color:#fff;position:sticky;top:64px;z-index:5;margin-bottom:12px;flex-wrap:wrap}',
      '#eng-ielts-view .ia-timer .clock{font-size:24px;font-weight:800;font-variant-numeric:tabular-nums;min-width:74px}',
      '#eng-ielts-view .ia-timer .ia-btn{height:30px;border-color:#fff;background:transparent;color:#fff}',
      '#eng-ielts-view .ia-timer .ia-btn.pri{background:'+ACC+';border-color:'+ACC+'}',
      '#eng-ielts-view .ia-heat{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:4px}',
      '#eng-ielts-view .ia-heat button{aspect-ratio:1.7;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-size:12px;font-weight:700;border:0;cursor:pointer}',
      '#eng-ielts-view .ia-heat button b{font-size:20px;font-weight:800;font-variant-numeric:tabular-nums}',
      '#eng-ielts-view .ia-omr{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:6px 14px}',
      '#eng-ielts-view .ia-omr label{display:grid;grid-template-columns:30px 1fr;align-items:center;gap:6px;font-size:12px;font-weight:800}',
      '#eng-ielts-view table.ia-t{width:100%;border-collapse:collapse;font-size:13px}',
      '#eng-ielts-view table.ia-t th{text-align:left;font-size:11.5px;color:#5B5B66;padding:8px;border-bottom:1px solid #DCDCE3;white-space:nowrap}',
      '#eng-ielts-view table.ia-t td{padding:8px;border-bottom:1px solid #ECECF0;vertical-align:middle}',
      '#eng-ielts-view table.ia-t td.b{font-weight:800;font-variant-numeric:tabular-nums;text-align:center}',
      '#eng-ielts-view .ia-scroll{overflow-x:auto;-webkit-overflow-scrolling:touch}',
      '#eng-ielts-view .ia-flash{min-height:200px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;border:1px solid #DCDCE3;background:#fff;cursor:pointer;padding:24px;text-align:center}',
      '#eng-ielts-view .ia-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}',
      '#eng-ielts-view .ia-empty{padding:28px;text-align:center;color:#5B5B66;border:1px dashed #DCDCE3;font-size:13px}',
      '@media (max-width:860px){#eng-ielts-view .ia-split{grid-template-columns:1fr}#eng-ielts-view .ia-split>div{max-height:none}#eng-ielts-view .ia-split>div+div{border-left:0;border-top:1px solid #DCDCE3}#eng-ielts-view .ia-timer{top:56px}}',
      '@media (max-width:640px){#eng-ielts-view .ia-nav button{padding:8px 10px;font-size:11px}#eng-ielts-view .ia-home-top{grid-template-columns:1fr!important}#eng-ielts-view .ia-2{grid-template-columns:1fr!important}#eng-ielts-view .ia-heat{grid-template-columns:repeat(3,minmax(0,1fr))}#eng-ielts-view .ia-heat button{font-size:11px}#eng-ielts-view .ia-box{padding:12px}}'
    ].join('\n');
    document.head.appendChild(st);
  }

  // ════════ HOME ════════
  function viewHome(){
    var P=plan(), d=days(P.exam.date), lb=latestBands(), goals={}; (P.goals||[]).forEach(function(g){goals[g.k]=g;});
    var mocks=P.mocks||[], next=mocks.find(function(m){ return !mockRec(m.n) && days(m.date)>=-3; });
    var ov=overall([lb.L,lb.R,lb.W,lb.S]);
    // 영역 4칸
    var tiles=['L','R','W','S'].map(function(k){
      var b=lb[k], g=goals[k]||{pass:7}, tgt=g.stretch||g.pass;
      return '<button class="ia-tile" data-go="'+({L:'listening',R:'reading',W:'writing',S:'speaking'})[k]+'" style="gap:10px">'
        +'<div class="ia-row" style="justify-content:space-between;width:100%"><span class="ia-k">'+icon(AREA[k].icon,16)+' '+AREA[k].name.toUpperCase()+'</span><span class="ia-tag" style="background:#F1F1F4;color:#5B5B66">'+lb.src[k]+'</span></div>'
        +'<div class="ia-row" style="align-items:baseline;gap:6px"><span class="ia-num" style="font-size:34px;color:'+bandColor(b)+'">'+fmtB(b)+'</span><span style="color:#5B5B66;font-size:13px;font-weight:700">→ '+fmtB(tgt)+'</span></div>'
        +'<div style="position:relative;width:100%">'+bar(b||0,9,bandColor(b),8)+'<div style="position:absolute;top:-4px;bottom:-4px;left:'+(7/9*100)+'%;width:2px;background:#16161A"></div></div>'
        +'</button>';
    }).join('');
    // 16칸
    var grid=mocks.map(function(m){
      var r=mockRec(m.n), isNext=next&&next.n===m.n, o=r&&r.bands?overall([r.bands.L,r.bands.R,r.bands.W,r.bands.S]):null;
      var bg=r?(o!=null?bandColor(o):ACC):'#fff', fg=r?'#fff':'#16161A', bd=isNext?'2px solid '+ACC:'1px solid #DCDCE3';
      return '<button data-mock="'+m.n+'" title="#'+m.n+' '+m.date+' · '+esc(m.src)+'" style="border:'+bd+';background:'+bg+';color:'+fg+';padding:6px 4px;display:flex;flex-direction:column;align-items:center;gap:1px;cursor:pointer">'
        +'<span style="font-size:11px;font-weight:800">#'+m.n+'</span><span style="font-size:10.5px;font-weight:600;opacity:.85">'+(r&&o!=null?fmtB(o):m.date.slice(5).replace('-','/'))+'</span></button>';
    }).join('');
    // 오늘 할 일 — 요일 사이클
    var dow=new Date().getDay(), todo=[];
    if (next && days(next.date)===0) todo.push(['quiz','모의고사 #'+next.n,'scores']);
    if (dow===3) todo.push(['mail','편지 20분','writing:1']);
    if (dow===0||dow===6) todo.push(['article','에세이 40분','writing:2'],['mic','Part 2 두 장','speaking']);
    todo.push(['headphones','듣기 한 섹션','listening'],['style','카드 10장','cards']);
    var todoHtml=todo.slice(0,4).map(function(t){ return '<button class="ia-tile" data-go="'+t[2]+'" style="flex-direction:row;align-items:center;gap:10px;padding:12px 14px">'+icon(t[0],22)+'<span class="t" style="font-size:14px">'+t[1]+'</span>'+icon('arrow_forward',16)+'</button>'; }).join('');
    // 약점 top 3
    var wk=Object.keys(ST.weak).filter(function(k){return ST.weak[k]>0;}).sort(function(a,b){return ST.weak[b]-ST.weak[a];}).slice(0,3);
    var wmax=wk.length?ST.weak[wk[0]]:1;
    var weakHtml=wk.length ? wk.map(function(k){ return '<div style="display:grid;grid-template-columns:96px 1fr 28px;gap:10px;align-items:center;padding:5px 0"><span style="font-size:12.5px;font-weight:700">'+esc(typeName(k))+'</span>'+bar(ST.weak[k],wmax,BAD,10)+'<span class="ia-num" style="font-size:13px;text-align:right">'+ST.weak[k]+'</span></div>'; }).join('') : '<div class="ia-empty" style="padding:16px">문제를 풀면 틀린 유형이 여기에 쌓여요</div>';

    return '<div class="ia-grid">'
      +'<div class="ia-home-top" style="display:grid;grid-template-columns:260px minmax(0,1fr);gap:16px">'
        +'<div style="background:'+ACC+';color:#fff;padding:22px;display:flex;flex-direction:column;gap:6px">'
          +'<div class="ia-num" style="font-size:56px;line-height:1">'+(d>0?'D-'+d:d===0?'D-DAY':'D+'+(-d))+'</div>'
          +'<div style="font-size:12.5px;font-weight:600;opacity:.9">'+P.exam.date.replace(/-/g,'.')+' · GT · 컴퓨터</div>'
          +'<div style="margin-top:auto;padding-top:14px;border-top:1px solid rgba(255,255,255,.35);display:flex;justify-content:space-between;align-items:flex-end">'
            +'<div><div style="font-size:11px;font-weight:700;opacity:.8">OVERALL</div><div class="ia-num" style="font-size:30px">'+fmtB(ov)+'</div></div>'
            +(next?'<div style="text-align:right"><div style="font-size:11px;font-weight:700;opacity:.8">NEXT MOCK</div><div style="font-size:15px;font-weight:800">#'+next.n+' · '+next.date.slice(5).replace('-','/')+'</div><div style="font-size:11px;opacity:.85">D-'+days(next.date)+'</div></div>':'')
          +'</div></div>'
        +'<div class="ia-pick" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr))">'+tiles+'</div>'
      +'</div>'
      +'<div class="ia-box">'+head('Band Trend','모의고사 기록이 쌓이면 선이 그려져요', '<div class="ia-row" style="gap:12px;font-size:12px;font-weight:700">'+['L','R','W','S'].map(function(k){return '<span style="color:'+LINE[k]+'">● '+k+'</span>';}).join('')+'</div>')+trendSvg()+'</div>'
      +'<div class="ia-box">'+head('16 Mocks','칸을 누르면 점수 입력 · 숫자 = Overall')+'<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(54px,1fr));gap:4px">'+grid+'</div></div>'
      +'<div class="ia-2" style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:16px">'
        +'<div class="ia-box">'+head('Today','')+'<div class="ia-grid" style="gap:8px">'+todoHtml+'</div></div>'
        +'<div class="ia-box">'+head('Weak Spots','많이 틀린 유형 3개', '<button class="ia-btn sm" data-go="weak">전체</button>')+weakHtml+'</div>'
      +'</div>'
    +'</div>';
  }
  var LINE={L:'#1F4BD8',R:'#0f766e',W:'#b91c1c',S:'#a16207'};
  function trendSvg(){
    var pts={L:[],R:[],W:[],S:[]}, recs=ST.records.filter(function(r){return r.bands;}).sort(function(a,b){return (a.date||'').localeCompare(b.date||'');});
    var W=800,H=recs.length?200:120,px=40,py=16, n=Math.max(recs.length,6);
    function x(i){ return px+(W-px-16)*(n<=1?0:i/(n-1)); } function y(b){ return py+(H-py*2)*(1-(b-4)/5); }
    var g='';
    [5,6,7,8,9].forEach(function(b){ g+='<line x1="'+px+'" x2="'+(W-8)+'" y1="'+y(b)+'" y2="'+y(b)+'" stroke="'+(b===7?'#16161A':'#ECECF0')+'" stroke-width="'+(b===7?1.5:1)+'" '+(b===7?'stroke-dasharray="5 4"':'')+'/><text x="4" y="'+(y(b)+4)+'" font-size="12" font-weight="700" fill="'+(b===7?'#16161A':'#8A8A95')+'">'+b.toFixed(1)+'</text>'; });
    if (!recs.length) return '<svg viewBox="0 0 '+W+' '+H+'" width="100%" style="display:block">'+g+'<text x="'+(W/2)+'" y="'+(H/2)+'" text-anchor="middle" font-size="14" fill="#5B5B66">아직 기록 없음 — 첫 모의고사 뒤에 선이 생겨요</text></svg>';
    recs.forEach(function(r,i){ ['L','R','W','S'].forEach(function(k){ if (r.bands[k]!=null) pts[k].push([x(i),y(Math.max(4,r.bands[k]))]); }); });
    ['L','R','W','S'].forEach(function(k){ if (!pts[k].length) return; g+='<polyline fill="none" stroke="'+LINE[k]+'" stroke-width="2.5" points="'+pts[k].map(function(p){return p.join(',');}).join(' ')+'"/>'; pts[k].forEach(function(p){ g+='<rect x="'+(p[0]-3.5)+'" y="'+(p[1]-3.5)+'" width="7" height="7" fill="'+LINE[k]+'"/>'; }); });
    recs.forEach(function(r,i){ g+='<text x="'+x(i)+'" y="'+(H-1)+'" text-anchor="middle" font-size="11" fill="#5B5B66">'+(r.kind==='mock'?'#'+r.n:(r.date||'').slice(5).replace('-','/'))+'</text>'; });
    return '<svg viewBox="0 0 '+W+' '+(H+6)+'" width="100%" style="display:block">'+g+'</svg>';
  }

  // ════════ 문제 풀기 (Listening · Reading 공용) ════════
  var RUN=null; // {area, sec:[section objs], ans:{n:val}, done:false, t0, limit}
  function viewPractice(area){
    var B=bank(), list=area==='L'?B.listening:B.reading;
    if (RUN && RUN.area===area) return runHtml();
    var tests={}; list.forEach(function(s){ (tests[s.test]=tests[s.test]||[]).push(s); });
    var done=recsOf(area==='L'?'listening':'reading');
    var cards=Object.keys(tests).map(function(t){
      var secs=tests[t].sort(function(a,b){return a.section-b.section;});
      var full='<button class="ia-tile" data-run="'+t+'|all" style="border-color:#16161A"><span class="ia-tag" style="background:#16161A;color:#fff">FULL TEST</span><span class="t">'+t+' · 40문항</span><span class="s">'+(area==='L'?'약 30분 · 한 번만 재생':'60분 · 15·20·25')+'</span></button>';
      return full+secs.map(function(s){
        var prev=done.filter(function(r){return r.ref===s.id;}).pop();
        return '<button class="ia-tile" data-run="'+t+'|'+s.id+'"><span class="ia-tag">SECTION '+s.section+'</span><span class="t">'+esc(s.title)+'</span><span class="s">'+esc(s.context||'')+'</span>'
          +'<span class="s" style="font-weight:700;color:'+(prev?bandColor(prev.score/prev.total>=.85?7:prev.score/prev.total>=.75?6.5:6):'#8A8A95')+'">'+(prev?'지난번 '+prev.score+'/'+prev.total:s.questions.length+'문항')+'</span></button>';
      }).join('');
    }).join('');
    var empty=!list.length?'<div class="ia-empty">문제 은행을 불러오는 중이에요</div>':'';
    return head(area==='L'?'Listening':'Reading', area==='L'?'오리지널 문제 · 브라우저 음성으로 재생 · 실전처럼 한 번만':'오리지널 GT 지문 · 왼쪽 지문, 오른쪽 문제 · 섹션별 시간', '<button class="ia-btn" data-omr="'+area+'">'+icon('fact_check',16)+' 책 답안지</button>')
      +empty+'<div class="ia-pick">'+cards+'</div>'
      +(done.length?'<div class="ia-box" style="margin-top:16px">'+head('History','')+historyTable(done)+'</div>':'');
  }
  function historyTable(rs){
    return '<div class="ia-scroll"><table class="ia-t"><tr><th>날짜</th><th>문제</th><th>점수</th><th></th></tr>'+rs.slice().reverse().slice(0,12).map(function(r){
      return '<tr><td>'+esc(r.date)+'</td><td>'+esc(r.title||r.ref)+'</td><td>'+bar(r.score,r.total,r.score/r.total>=.85?OK:r.score/r.total>=.75?MID:BAD,8)+'<span class="ia-num" style="font-size:12px">'+r.score+'/'+r.total+(r.band!=null?' · '+fmtB(r.band):'')+'</span></td><td style="text-align:right"><button class="ia-btn sm" data-del="'+r._id+'" title="삭제">'+icon('delete',15)+'</button></td></tr>';
    }).join('')+'</table></div>';
  }
  function startRun(area, key){
    var B=bank(), list=area==='L'?B.listening:B.reading, k=key.split('|');
    var secs=list.filter(function(s){ return s.test===k[0] && (k[1]==='all' || s.id===k[1]); }).sort(function(a,b){return a.section-b.section;});
    var limit=area==='R' ? secs.reduce(function(s,x){return s+(x.minutes||20);},0)*60 : 0;
    RUN={area:area, test:k[0], full:k[1]==='all', secs:secs, cur:0, ans:{}, done:false, t0:Date.now(), limit:limit, played:{}};
  }
  function runHtml(){
    var R=RUN, s=R.secs[R.cur], total=R.secs.reduce(function(a,x){return a+x.questions.length;},0);
    var tabs=R.secs.length>1?'<div class="ia-row" style="gap:4px">'+R.secs.map(function(x,i){return '<button class="ia-btn sm" data-sec="'+i+'" style="'+(i===R.cur?'background:#fff;color:#16161A':'')+'">S'+x.section+'</button>';}).join('')+'</div>':'';
    var answered=Object.keys(R.ans).filter(function(n){return R.ans[n]!=='' && R.ans[n]!=null;}).length;
    var timer='<div class="ia-timer"><span class="clock" id="ia-clock">'+(R.limit?mmss(R.limit):'0:00')+'</span>'
      +(R.area==='L'?'<button class="ia-btn" id="ia-play" data-act="play">'+icon(R.done?'replay':'play_arrow',16)+' '+(R.done?'다시 듣기':R.played[R.cur]?'재생 중…':'재생')+'</button>':'')
      +tabs+'<span style="font-size:12px;opacity:.85;margin-left:auto">'+answered+'/'+total+'</span>'
      +(R.done?'<button class="ia-btn" data-act="exit">목록</button>':'<button class="ia-btn" data-act="exit">그만</button><button class="ia-btn pri" data-act="submit">제출</button>')+'</div>';
    var left = R.area==='R'
      ? '<div class="ia-pass"><div class="ia-k" style="margin-bottom:6px">SECTION '+s.section+' · '+(s.minutes||'')+'분</div><h4 style="font-size:17px;font-weight:800;margin:0 0 14px">'+esc(s.title)+'</h4>'+s.passage.map(function(p){return '<p>'+(p.label?'<span class="lb">'+esc(p.label)+'</span>':'')+esc(p.text)+'</p>';}).join('')+'</div>'
      : '<div><div class="ia-k" style="margin-bottom:6px">SECTION '+s.section+'</div><h4 style="font-size:17px;font-weight:800;margin:0 0 8px">'+esc(s.title)+'</h4><p style="font-size:13px;color:#5B5B66;margin:0 0 14px">'+esc(s.context||'')+'</p>'
        +(R.done?'<details open><summary style="cursor:pointer;font-weight:700;font-size:13px">'+icon('description',16)+' 스크립트</summary><div style="margin-top:10px;font-size:14px;line-height:1.7">'+s.script.map(function(l){return '<p style="margin:0 0 8px"><b style="color:'+ACC+'">'+esc(l.who)+'</b> '+esc(l.text)+'</p>';}).join('')+'</div></details>'
          :'<div class="ia-empty">'+icon('headphones',28)+'<br>재생을 누르면 한 번 들려줘요. 들으면서 오른쪽에 답을 적어요.<br><span style="font-size:12px">음성은 맥·폰의 영어 음성을 써요 (설정 › 손쉬운 사용 › 음성 콘텐츠에서 고급 음성을 받으면 더 자연스러워요)</span></div>')+'</div>';
    var shared={};
    var qs=s.questions.map(function(q){
      var qtext=q.q, pre='', mm=String(q.q).match(/^(\[[^\]]+\][\s\S]*?) — ([\s\S]+)$/);
      if (mm){ qtext=mm[2]; if (!shared[mm[1]]){ shared[mm[1]]=1; pre='<div style="padding:10px 12px;background:#F8F8FA;border-left:3px solid '+ACC+';font-size:13px;line-height:1.6;margin:6px 0 4px">'+icon('map',16)+' '+esc(mm[1])+'</div>'; } }
      var v=R.ans[q.n]==null?'':R.ans[q.n], cls='', fb='';
      if (R.done){ var ok=isRight(v,q.answer); cls=ok?'ok':'no'; fb='<div class="why">'+(ok?'':'<b style="color:'+BAD+'">정답 '+esc(Array.isArray(q.answer)?q.answer[0]:q.answer)+'</b> · ')+esc(typeName(q.type))+(q.why?' · '+esc(q.why):'')+'</div>'; }
      var input;
      if (q.options && q.options.length){
        var long=q.options.some(function(o){return String(o).length>6;});
        input='<div class="ia-opts'+(long?' long':'')+'">'+q.options.map(function(o){ var tok=optTok(o); return '<button data-q="'+q.n+'" data-v="'+esc(tok)+'" class="'+(norm(v)===norm(tok)?'on':'')+'" '+(R.done?'disabled':'')+'>'+esc(o)+'</button>'; }).join('')+'</div>';
      } else {
        input='<input class="ia-in" data-qi="'+q.n+'" value="'+esc(v)+'" '+(R.done?'disabled':'')+' autocomplete="off" autocapitalize="off" spellcheck="false" style="margin-top:8px;max-width:280px">'+(q.limit?'<div style="font-size:11px;color:#5B5B66;margin-top:3px;font-weight:700">'+esc(q.limit)+'</div>':'');
      }
      return pre+'<div class="ia-q '+cls+'"><span class="qn">'+q.n+'</span><span class="qt">'+esc(qtext)+'</span>'+input+fb+'</div>';
    }).join('');
    var result='';
    if (R.done){ var sc=R.score, b=R.full&&total===40?toBand(R.area==='L'?BAND_L:BAND_R, sc):null;
      result='<div class="ia-box" style="display:flex;gap:24px;align-items:center;margin-bottom:12px;flex-wrap:wrap"><div><div class="ia-k">SCORE</div><div class="ia-num" style="font-size:36px">'+sc+'<span style="font-size:18px;color:#5B5B66">/'+total+'</span></div></div>'
        +(b!=null?'<div><div class="ia-k">BAND</div><div class="ia-num" style="font-size:36px;color:'+bandColor(b)+'">'+fmtB(b)+'</div></div>':'')
        +'<div style="flex:1;min-width:200px">'+bar(sc,total,b!=null?bandColor(b):sc/total>=.85?OK:sc/total>=.75?MID:BAD,12)+'<div style="font-size:12px;color:#5B5B66;margin-top:6px">틀린 문제 유형은 Weak Spots에 자동으로 +1 됐어요</div></div></div>'; }
    return result+timer+'<div class="ia-split"><div>'+left+'</div><div>'+qs+'</div></div>';
  }
  function tickRun(){
    clearInterval(ST.timers.run);
    if (!RUN || RUN.done) return;
    var el=function(){ return document.getElementById('ia-clock'); };
    ST.timers.run=setInterval(function(){
      if (!RUN || RUN.done || !el()){ clearInterval(ST.timers.run); return; }
      var t=(Date.now()-RUN.t0)/1000;
      if (RUN.limit){ var left=RUN.limit-t; el().textContent=mmss(left); el().style.color=left<300?'#fca5a5':'#fff'; if (left<=0){ submitRun(); } }
      else el().textContent=mmss(t);
    },1000);
  }
  async function submitRun(){
    var R=RUN; if (!R || R.done) return;
    stopSpeech(); R.done=true; var score=0, total=0;
    R.secs.forEach(function(s){ s.questions.forEach(function(q){ total++; if (isRight(R.ans[q.n],q.answer)) score++; else addWeak(q.type,1); }); });
    R.score=score;
    var band=R.full&&total===40?toBand(R.area==='L'?BAND_L:BAND_R,score):null;
    await saveRecord({kind:R.area==='L'?'listening':'reading', date:today(), ref:R.full?R.test:R.secs[0].id, title:R.full?R.test+' 전체':R.secs[0].title, score:score, total:total, band:band, bands:band!=null?(R.area==='L'?{L:band}:{R:band}):null, secs:Math.round((Date.now()-R.t0)/1000)});
    render(); window.scrollTo({top:document.getElementById('eng-ielts-view').offsetTop-80});
  }

  // ── 음성 (Listening) ──
  function stopSpeech(){ try { window.speechSynthesis.cancel(); } catch(e){} }
  function voiceFor(lang){ var vs=window.speechSynthesis.getVoices()||[]; var pref=vs.filter(function(v){return v.lang===lang;}); var good=pref.filter(function(v){return /premium|enhanced|natural|google/i.test(v.name);}); return good[0]||pref[0]||vs.find(function(v){return /^en/.test(v.lang);})||null; }
  function playSection(){
    var R=RUN, s=R.secs[R.cur]; if (!('speechSynthesis' in window)){ toast('이 브라우저는 음성 재생이 안 돼요'); return; }
    if (!R.done && R.played[R.cur]) return;
    stopSpeech(); R.played[R.cur]=true; render();
    var vmap=s.voices||{};
    s.script.forEach(function(line){
      var u=new SpeechSynthesisUtterance(line.text), cfg=vmap[line.who]||{lang:'en-GB'};
      u.lang=cfg.lang||'en-GB'; var v=voiceFor(u.lang); if (v) u.voice=v; u.rate=cfg.rate||0.95; u.pitch=cfg.pitch||1;
      window.speechSynthesis.speak(u);
    });
  }

  // ── 책 답안지 (OMR) ──
  var OMR=null;
  function viewOmr(){
    var O=OMR;
    var cells=''; for (var i=1;i<=40;i++){ var st=O.graded?(isRight(O.mine[i],O.key[i])?OK:BAD):null;
      cells+='<label style="'+(st?'color:'+st:'')+'"><span>'+i+'</span><input class="ia-in" data-omr-i="'+i+'" value="'+esc(O.mine[i]||'')+'" '+(O.graded?'disabled':'')+' autocomplete="off" spellcheck="false" style="height:30px;'+(st?'border-color:'+st:'')+'"></label>'; }
    var wrong=[]; if (O.graded) for (var j=1;j<=40;j++) if (!isRight(O.mine[j],O.key[j])) wrong.push(j);
    var typeSel=O.graded&&wrong.length?'<div class="ia-box" style="margin-top:12px">'+head('틀린 문제 유형 표시','고르면 Weak Spots에 +1')+'<div class="ia-grid" style="grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:8px">'+wrong.map(function(n){
      return '<div class="ia-row" style="gap:6px"><span class="ia-num" style="width:28px;color:'+BAD+'">'+n+'</span><select class="ia-in" data-wt="'+n+'" style="height:30px;flex:1"><option value="">유형 선택</option>'+TYPES[O.area].map(function(t){return '<option value="'+t[0]+'" '+(O.types[n]===t[0]?'selected':'')+'>'+t[1]+'</option>';}).join('')+'</select><span style="font-size:11px;color:#5B5B66;min-width:60px">정답 '+esc(O.key[n]||'')+'</span></div>';
    }).join('')+'</div></div>':'';
    var sc=O.graded?40-wrong.length:null, b=sc!=null?toBand(O.area==='L'?BAND_L:BAND_R,sc):null;
    return head('Answer Sheet · '+(O.area==='L'?'Listening':'Reading'), '책(GT 21·20·22)으로 풀 때 — 답을 적고, 책 뒤 정답을 붙여넣으면 자동 채점')
      +'<div class="ia-timer"><span class="clock" id="ia-omr-clock">'+mmss(O.area==='L'?30*60:60*60)+'</span>'
      +'<select class="ia-in" id="ia-omr-src" style="height:30px;width:auto;background:#fff;color:#16161A">'+['GT 21','GT 20','GT 22','GT 19','기타'].map(function(x){return '<option '+(O.src===x?'selected':'')+'>'+x+'</option>';}).join('')+'</select>'
      +'<select class="ia-in" id="ia-omr-test" style="height:30px;width:auto;background:#fff;color:#16161A">'+[1,2,3,4].map(function(x){return '<option value="'+x+'" '+(+O.test===x?'selected':'')+'>Test '+x+'</option>';}).join('')+'</select>'
      +'<select class="ia-in" id="ia-omr-mock" style="height:30px;width:auto;background:#fff;color:#16161A"><option value="">연습</option>'+(plan().mocks||[]).map(function(m){return '<option value="'+m.n+'" '+(+O.mock===m.n?'selected':'')+'>모의고사 #'+m.n+'</option>';}).join('')+'</select>'
      +'<span style="margin-left:auto"></span><button class="ia-btn" data-act="omr-exit">닫기</button>'+(O.graded?'':'<button class="ia-btn" data-act="omr-start">'+icon(O.running?'pause':'timer',16)+' '+(O.running?'멈춤':'시간 재기')+'</button>')+'</div>'
      +(sc!=null?'<div class="ia-box" style="display:flex;gap:24px;align-items:center;margin-bottom:12px;flex-wrap:wrap"><div><div class="ia-k">SCORE</div><div class="ia-num" style="font-size:36px">'+sc+'<span style="font-size:18px;color:#5B5B66">/40</span></div></div><div><div class="ia-k">BAND</div><div class="ia-num" style="font-size:36px;color:'+bandColor(b)+'">'+fmtB(b)+'</div></div><div style="flex:1;min-width:200px">'+bar(sc,40,bandColor(b),12)+'</div></div>':'')
      +'<div class="ia-box"><div class="ia-k" style="margin-bottom:10px">MY ANSWERS</div><div class="ia-omr">'+cells+'</div></div>'
      +(O.graded?'':'<div class="ia-box" style="margin-top:12px"><div class="ia-k" style="margin-bottom:8px">ANSWER KEY — 책 정답 40개를 한 줄에 하나씩 (또는 "1 seaview" 형식) 붙여넣기 · 정답이 여러 개면 / 로 구분</div><textarea class="ia-in" id="ia-key" style="height:120px;padding:10px;font-size:13px" placeholder="1 Seaview\n2 0412 556 873\n3 Thursday/Thurs">'+esc(O.keyRaw||'')+'</textarea><div class="ia-row" style="margin-top:10px;justify-content:flex-end"><button class="ia-btn pri" data-act="omr-grade">'+icon('done_all',16)+' 채점</button></div></div>')
      +typeSel+(O.graded?'<div class="ia-row" style="margin-top:12px;justify-content:flex-end"><button class="ia-btn pri" data-act="omr-save">'+icon('save',16)+' 기록 저장</button></div>':'');
  }
  function parseKey(raw){
    var key={}, lines=String(raw||'').split(/\n+/).map(function(l){return l.trim();}).filter(Boolean), seq=1;
    lines.forEach(function(l){ var m=l.match(/^(\d{1,2})[\s.):-]+(.+)$/); var n, v; if (m){ n=+m[1]; v=m[2]; } else { n=seq; v=l; } seq=n+1; if (n>=1&&n<=40) key[n]=v.split('/').map(function(x){return x.trim();}).filter(Boolean); });
    return key;
  }

  // ════════ WRITING ════════
  var WR=null;
  function viewWriting(){
    var B=bank().writing||{task1:[],task2:[]};
    if (WR) return writingEditor();
    var past=recsOf('writing');
    var t1=B.task1.map(function(p){ return '<button class="ia-tile" data-wt1="'+p.id+'"><span class="ia-tag">'+({formal:'격식',semi:'반격식',informal:'비격식'})[p.tone]+'</span><span class="s" style="color:#16161A;font-size:13px;line-height:1.5">'+esc(p.situation)+'</span></button>'; }).join('');
    var t2=B.task2.map(function(p){ return '<button class="ia-tile" data-wt2="'+p.id+'"><span class="ia-tag">'+({opinion:'의견형',discuss:'토론형',problem:'문제-해결',advdis:'장단점',twopart:'질문 2개'})[p.kind]+'</span><span class="s" style="color:#16161A;font-size:13px;line-height:1.5">'+esc(p.prompt)+'</span></button>'; }).join('');
    return head('Writing','실전처럼 타이핑 · 시간 · 단어 수 → 채점은 Claude 구독으로 0원', '<div class="ia-row"><button class="ia-btn" data-wrand="1">'+icon('shuffle',16)+' 편지 랜덤</button><button class="ia-btn pri" data-wrand="2">'+icon('shuffle',16)+' 에세이 랜덤</button><button class="ia-btn" data-wfree="1">'+icon('menu_book',16)+' 책 문제로</button></div>')
      +(past.length?'<div class="ia-box" style="margin-bottom:16px">'+head('My Writing','밴드는 채점 받은 뒤 칸에 적기')+writingTable(past)+'</div>':'')
      +'<div class="ia-k" style="margin:4px 0 10px">TASK 1 · 편지 20분 · 150+</div><div class="ia-pick" style="margin-bottom:20px">'+t1+'</div>'
      +'<div class="ia-k" style="margin:4px 0 10px">TASK 2 · 에세이 40분 · 250+</div><div class="ia-pick">'+t2+'</div>';
  }
  function writingTable(rs){
    return '<div class="ia-scroll"><table class="ia-t"><tr><th>날짜</th><th>과제</th><th>단어</th><th>시간</th><th>밴드</th><th></th></tr>'+rs.slice().reverse().map(function(r){
      return '<tr><td>'+esc(r.date)+'</td><td style="max-width:360px">'+(r.task===1?'<span class="ia-tag">편지</span> ':'<span class="ia-tag" style="background:#16161A;color:#fff">에세이</span> ')+esc((r.prompt||'').slice(0,70))+'…</td>'
        +'<td class="b" style="color:'+(r.words>=(r.task===1?150:250)?OK:BAD)+'">'+r.words+'</td><td class="b">'+mmss(r.secs||0)+'</td>'
        +'<td><input class="ia-in" data-wband="'+r._id+'" type="number" step="0.5" min="0" max="9" value="'+(r.band==null?'':r.band)+'" style="width:64px;height:28px;color:'+bandColor(r.band)+';font-weight:800"></td>'
        +'<td style="white-space:nowrap;text-align:right"><button class="ia-btn sm" data-wopen="'+r._id+'">열기</button> <button class="ia-btn sm" data-del="'+r._id+'">'+icon('delete',15)+'</button></td></tr>';
    }).join('')+'</table></div>';
  }
  function startWriting(task, p, free){
    var draftKey='atelier_ielts_draft_'+(p?p.id:'free'+task), draft='';
    try { draft=localStorage.getItem(draftKey)||''; } catch(e){}
    var prompt=p ? (task===1 ? p.situation+'\n\nIn your letter:\n'+p.bullets.map(function(b){return '• '+b;}).join('\n') : p.prompt) : '';
    WR={task:task, id:p?p.id:null, prompt:prompt, opener:p&&p.opener||'', ideas:p&&p.ideas||[], text:draft, limit:task===1?20*60:40*60, t0:null, paused:0, running:false, draftKey:draftKey, free:!!free, checks:{}};
  }
  function wc(t){ return (String(t).match(/[A-Za-z0-9’'-]+/g)||[]).length; }
  function writingEditor(){
    var W=WR, goal=W.task===1?150:250, n=wc(W.text), sweet=W.task===1?[160,190]:[260,300];
    var checks=[['task','과제 다 했나','bullet 3개 · 입장 일관'],['flow','문단 첫 문장만 읽어도 흐름이 보이나',''],['vocab','같은 단어 3번 이상 없나',''],['grammar','관사 · 복수 s · 시제','']];
    return '<div class="ia-timer"><span class="clock" id="ia-wclock">'+mmss(W.limit)+'</span><button class="ia-btn" data-act="wtime">'+icon(W.running?'pause':'play_arrow',16)+' '+(W.running?'멈춤':'시작')+'</button>'
      +'<div style="flex:1;min-width:140px;display:flex;align-items:center;gap:8px"><div class="ia-bar" style="height:8px;flex:1;background:rgba(255,255,255,.2)"><i id="ia-wbar" style="width:'+Math.min(100,n/sweet[1]*100)+'%;background:'+(n>=goal?'#4ade80':'#fca5a5')+'"></i></div><span class="ia-num" id="ia-wc" style="font-size:14px">'+n+' / '+goal+'</span></div>'
      +'<button class="ia-btn" data-act="wexit">닫기</button><button class="ia-btn" data-act="wcopy">'+icon('content_copy',16)+' 채점용 복사</button><button class="ia-btn pri" data-act="wsave">'+icon('save',16)+' 저장</button></div>'
      +'<div class="ia-split"><div>'
        +'<div class="ia-k" style="margin-bottom:8px">TASK '+W.task+' · '+(W.task===1?'20분 · 150+ (목표 '+sweet.join('–')+')':'40분 · 250+ (목표 '+sweet.join('–')+')')+'</div>'
        +(W.free?'<textarea class="ia-in" id="ia-wprompt" style="height:120px;padding:10px;font-size:13px;margin-bottom:12px" placeholder="책 문제를 여기에 붙여넣기">'+esc(W.prompt)+'</textarea>':'<div style="white-space:pre-wrap;font-size:14.5px;line-height:1.65;padding:14px;background:#F8F8FA;border-left:3px solid '+ACC+';margin-bottom:12px">'+esc(W.prompt)+'</div>')
        +'<textarea class="ia-ta" id="ia-wtext" spellcheck="false" autocorrect="off" autocapitalize="off" placeholder="'+esc(W.opener||(W.task===1?'Dear …,':'It is often argued that …'))+'">'+esc(W.text)+'</textarea>'
      +'</div><div>'
        +'<div class="ia-k" style="margin-bottom:8px">FRAME</div>'
        +(W.task===1?['인사 — 유형에 맞게','쓰는 이유 1줄','bullet ① 문단','bullet ② 문단','bullet ③ 문단','마무리 1줄','끝인사 + 이름']:['서론 — 질문 바꿔 말하기 + 내 입장','본론 1 — 주장 + 예시','본론 2 — 주장 + 예시','결론 — 입장 다시']).map(function(f,i){return '<div style="display:flex;gap:8px;align-items:center;padding:7px 0;border-bottom:1px solid #ECECF0;font-size:13px"><span class="ia-num" style="width:18px;color:'+ACC+'">'+(i+1)+'</span>'+esc(f)+'</div>';}).join('')
        +(W.task===1?'<div style="font-size:12px;color:#5B5B66;margin-top:8px;line-height:1.6">격식 Dear Sir or Madam → Yours faithfully · 반격식 Dear Mr Kim → Yours sincerely · 비격식 Dear Jane → Best wishes</div>':'')
        +(W.ideas.length?'<div class="ia-k" style="margin:16px 0 6px">IDEAS</div>'+W.ideas.map(function(x){return '<div style="font-size:13px;padding:4px 0">· '+esc(x)+'</div>';}).join(''):'')
        +'<div class="ia-k" style="margin:16px 0 6px">제출 전 2분</div>'+checks.map(function(c){return '<label style="display:flex;gap:8px;align-items:center;padding:6px 0;font-size:13px;cursor:pointer"><input type="checkbox" data-wck="'+c[0]+'" '+(W.checks[c[0]]?'checked':'')+'> '+esc(c[1])+'</label>';}).join('')
      +'</div></div>';
  }
  function graderPrompt(){
    var base=(plan().prompt)||'Grade my IELTS GT writing strictly.';
    return base.replace('[Task 1 letter / Task 2 essay]', WR.task===1?'Task 1 letter':'Task 2 essay').replace('[paste question]', WR.prompt).replace(/\[paste\]\s*$/, WR.text);
  }
  function tickWriting(){
    clearInterval(ST.timers.w);
    ST.timers.w=setInterval(function(){
      var el=document.getElementById('ia-wclock'); if (!WR || !el){ clearInterval(ST.timers.w); return; }
      var used=WR.paused+(WR.running?(Date.now()-WR.t0)/1000:0), left=WR.limit-used;
      el.textContent=left>=0?mmss(left):'+'+mmss(-left); el.style.color=left<0?'#fca5a5':left<180?'#fde68a':'#fff';
    },500);
  }

  // ════════ SPEAKING ════════
  var SP={part:2, card:null, phase:'idle', t0:0, rec:null, chunks:[], url:null, p1:null};
  function viewSpeaking(){
    var B=bank().speaking||{part1:[],part2:[]};
    if (!SP.card && B.part2.length) SP.card=B.part2[Math.floor(Math.random()*B.part2.length)];
    if (!SP.p1 && B.part1.length) SP.p1=B.part1[Math.floor(Math.random()*B.part1.length)];
    var past=recsOf('speaking'), c=SP.card;
    var total=SP.phase==='prep'?60:120, ring=2*Math.PI*54;
    var p2=c?'<div class="ia-2" style="display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:16px">'
      +'<div class="ia-box" style="border:2px solid #16161A"><div class="ia-k" style="margin-bottom:10px">PART 2 · CUE CARD</div><div style="font-size:20px;font-weight:800;line-height:1.35;margin-bottom:12px">'+esc(c.cue)+'</div>'
        +c.points.map(function(p){return '<div style="font-size:14px;padding:3px 0;color:#16161A">'+esc(p)+'</div>';}).join('')
        +'<div class="ia-k" style="margin:16px 0 6px">1분 메모 4칸</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:4px">'+['언제','어디','무슨 일','왜 기억'].map(function(x,i){return '<textarea class="ia-in" data-memo="'+i+'" style="height:52px;padding:6px;font-size:12px" placeholder="'+x+'"></textarea>';}).join('')+'</div></div>'
      +'<div class="ia-box" style="display:flex;flex-direction:column;align-items:center;gap:14px">'
        +'<svg width="150" height="150" viewBox="0 0 130 130"><circle cx="65" cy="65" r="54" fill="none" stroke="#F1F1F4" stroke-width="12"/><circle id="ia-ring" cx="65" cy="65" r="54" fill="none" stroke="'+(SP.phase==='talk'?BAD:ACC)+'" stroke-width="12" stroke-dasharray="'+ring+'" stroke-dashoffset="0" transform="rotate(-90 65 65)"/><text id="ia-sclock" x="65" y="66" text-anchor="middle" font-size="26" font-weight="800" fill="#16161A">'+(SP.phase==='idle'?'1:00':SP.phase==='done'?'끝':'')+'</text><text id="ia-sphase" x="65" y="88" text-anchor="middle" font-size="12" font-weight="700" fill="#5B5B66">'+({idle:'준비 1분',prep:'준비',talk:'말하기 · 녹음',done:'수고했어요'})[SP.phase]+'</text></svg>'
        +'<div class="ia-row" style="justify-content:center"><button class="ia-btn pri" data-act="sgo">'+icon(SP.phase==='idle'||SP.phase==='done'?'play_arrow':'stop',16)+' '+(SP.phase==='idle'||SP.phase==='done'?'시작':SP.phase==='prep'?'바로 말하기':'끝내기')+'</button><button class="ia-btn" data-act="snew">'+icon('shuffle',16)+' 다른 카드</button></div>'
        +(SP.url?'<audio controls src="'+SP.url+'" style="width:100%"></audio><a class="ia-btn sm" href="'+SP.url+'" download="part2-'+today()+'.webm">'+icon('download',15)+' 녹음 받기</a>':'<div style="font-size:12px;color:#5B5B66;text-align:center">2분 동안 녹음돼요 · 녹음은 이 기기에만</div>')
      +'</div></div>'
      +(SP.phase==='done'&&c.part3?'<div class="ia-box" style="margin-top:16px">'+head('Part 3 · 이어서 토론','이유 + 예시 + 반대 경우로 3문장 이상')+c.part3.map(function(q,i){return '<div style="padding:8px 0;border-bottom:1px solid #ECECF0;font-size:14px"><span class="ia-num" style="color:'+ACC+';margin-right:8px">'+(i+1)+'</span>'+esc(q)+'</div>';}).join('')+'</div>':'')
      :'<div class="ia-empty">카드를 불러오는 중이에요</div>';
    var p1=SP.p1?'<div class="ia-box" style="margin-top:16px">'+head('Part 1 · '+SP.p1.topic,'한 질문에 2–3문장', '<button class="ia-btn sm" data-act="snew1">'+icon('shuffle',15)+'</button>')+SP.p1.qs.map(function(q){return '<div style="padding:7px 0;border-bottom:1px solid #ECECF0;font-size:14px">'+esc(q)+'</div>';}).join('')+'</div>':'';
    var stat=past.length?'<div class="ia-row" style="gap:16px;font-size:12.5px;color:#5B5B66;font-weight:700">'+icon('mic',16)+' 지금까지 Part 2 <span class="ia-num" style="color:#16161A;font-size:16px">'+past.length+'</span>장 · 평균 <span class="ia-num" style="color:#16161A;font-size:16px">'+mmss(past.reduce(function(s,r){return s+(r.secs||0);},0)/past.length)+'</span></div>':'';
    return head('Speaking','1분 준비 → 2분 말하기 · 실전 시간 그대로', stat)+p2+p1;
  }
  async function speakGo(){
    if (SP.phase==='idle'||SP.phase==='done'){ SP.phase='prep'; SP.t0=Date.now(); if (SP.url){ try{URL.revokeObjectURL(SP.url);}catch(e){} SP.url=null; } render(); tickSpeak(); return; }
    if (SP.phase==='prep'){ await startTalk(); return; }
    finishTalk();
  }
  async function startTalk(){
    SP.phase='talk'; SP.t0=Date.now(); SP.chunks=[];
    try { var stream=await navigator.mediaDevices.getUserMedia({audio:true}); SP.rec=new MediaRecorder(stream); SP.rec.ondataavailable=function(e){ if (e.data.size) SP.chunks.push(e.data); }; SP.rec.onstop=function(){ stream.getTracks().forEach(function(t){t.stop();}); SP.url=URL.createObjectURL(new Blob(SP.chunks,{type:SP.rec.mimeType||'audio/webm'})); render(); }; SP.rec.start(); }
    catch(e){ SP.rec=null; toast('마이크 없이 타이머만 돌아요'); }
    render(); tickSpeak();
  }
  async function finishTalk(){
    if (SP.phase!=='talk') return; var secs=Math.round((Date.now()-SP.t0)/1000); SP.phase='done';
    try { if (SP.rec && SP.rec.state!=='inactive') SP.rec.stop(); } catch(e){}
    if (secs<100) addWeak('s-p2time',1);
    await saveRecord({kind:'speaking', date:today(), ref:SP.card&&SP.card.id, title:SP.card&&SP.card.cue, secs:secs});
    render();
  }
  function tickSpeak(){
    clearInterval(ST.timers.s); var ring=2*Math.PI*54;
    ST.timers.s=setInterval(function(){
      var c=document.getElementById('ia-sclock'), r=document.getElementById('ia-ring'); if (!c){ clearInterval(ST.timers.s); return; }
      if (SP.phase!=='prep' && SP.phase!=='talk'){ clearInterval(ST.timers.s); return; }
      var tot=SP.phase==='prep'?60:120, t=(Date.now()-SP.t0)/1000, left=tot-t;
      c.textContent=mmss(left); r.setAttribute('stroke-dashoffset', ring*(1-Math.max(0,left)/tot));
      if (left<=0){ clearInterval(ST.timers.s); if (SP.phase==='prep') startTalk(); else finishTalk(); }
    },250);
  }

  // ════════ SCORES ════════
  var EDIT=null;
  function viewScores(){
    var P=plan(), mocks=P.mocks||[];
    var rows=mocks.map(function(m){
      var r=mockRec(m.n), b=r&&r.bands||{}, o=overall([b.L,b.R,b.W,b.S]), past=days(m.date)<0;
      if (EDIT===m.n) return '<tr style="background:#EEF2FD"><td class="b">'+m.n+'</td><td>'+m.date.slice(2).replace(/-/g,'.')+'</td>'
        +'<td><input class="ia-in" id="ie-L" type="number" min="0" max="40" placeholder="/40" value="'+(r&&r.raw&&r.raw.L!=null?r.raw.L:'')+'" style="width:70px;height:30px"><div class="ia-num" id="ie-Lb" style="font-size:11px"></div></td>'
        +'<td><input class="ia-in" id="ie-R" type="number" min="0" max="40" placeholder="/40" value="'+(r&&r.raw&&r.raw.R!=null?r.raw.R:'')+'" style="width:70px;height:30px"><div class="ia-num" id="ie-Rb" style="font-size:11px"></div></td>'
        +'<td><input class="ia-in" id="ie-W" type="number" step="0.5" min="0" max="9" placeholder="밴드" value="'+(b.W!=null?b.W:'')+'" style="width:70px;height:30px"></td>'
        +'<td><input class="ia-in" id="ie-S" type="number" step="0.5" min="0" max="9" placeholder="밴드" value="'+(b.S!=null?b.S:'')+'" style="width:70px;height:30px"></td>'
        +'<td class="b" id="ie-O">—</td><td style="white-space:nowrap"><button class="ia-btn sm pri" data-act="msave">저장</button> <button class="ia-btn sm" data-act="mcancel">취소</button></td></tr>';
      function c(v){ return '<td class="b" style="color:'+bandColor(v)+'">'+fmtB(v)+'</td>'; }
      return '<tr data-medit="'+m.n+'" style="cursor:pointer'+(r?'':';color:'+(past?'#5B5B66':'#16161A'))+'"><td class="b">'+m.n+'</td><td style="white-space:nowrap">'+m.date.slice(2).replace(/-/g,'.')+(m.check?' <span class="ia-tag" style="background:#FEF3C7;color:#92400E">점검</span>':'')+'</td>'
        +(r?c(b.L)+c(b.R)+c(b.W)+c(b.S)+'<td class="b" style="font-size:16px;color:'+bandColor(o)+'">'+fmtB(o)+'</td>':'<td colspan="5" style="font-size:12px;color:#5B5B66">'+esc(m.src)+' · '+esc(m.focus)+'</td>')
        +'<td style="text-align:right">'+icon('edit',16)+'</td></tr>';
    }).join('');
    // 영역별 평균 막대
    var done=mocks.map(function(m){return mockRec(m.n);}).filter(Boolean);
    return head('Scores','16회 모의고사 · 줄을 누르면 입력 · L·R은 맞힌 개수만 넣으면 밴드 자동', '<div class="ia-row" style="font-size:12px;font-weight:700;gap:12px"><span style="color:'+OK+'">■ 7.0+</span><span style="color:'+MID+'">■ 6.5</span><span style="color:'+BAD+'">■ 6.0 이하</span></div>')
      +'<div class="ia-box"><div class="ia-scroll"><table class="ia-t" style="min-width:640px"><tr><th>#</th><th>날짜</th><th>L</th><th>R</th><th>W</th><th>S</th><th>Overall</th><th></th></tr>'+rows+'</table></div></div>'
      +'<div class="ia-box" style="margin-top:16px">'+head('GT 환산표','맞힌 개수 → 밴드')+bandTableHtml()+'</div>';
  }
  function bandTableHtml(){
    var bs=[9,8.5,8,7.5,7,6.5,6,5.5,5];
    function rng(t,b){ var i=t.findIndex(function(x){return x[1]===b;}); if (i<0) return '—'; var lo=t[i][0], hi=i===0?40:t[i-1][0]-1; return lo===hi?lo:lo+'–'+hi; }
    return '<div class="ia-scroll"><table class="ia-t" style="min-width:560px"><tr><th>밴드</th>'+bs.map(function(b){return '<th style="text-align:center;color:'+bandColor(b)+'">'+b.toFixed(1)+'</th>';}).join('')+'</tr>'
      +'<tr><td style="font-weight:700">Listening</td>'+bs.map(function(b){return '<td class="b">'+rng(BAND_L,b)+'</td>';}).join('')+'</tr>'
      +'<tr><td style="font-weight:700">Reading GT</td>'+bs.map(function(b){return '<td class="b">'+rng(BAND_R,b)+'</td>';}).join('')+'</tr></table></div>';
  }
  function liveMock(){
    var L=document.getElementById('ie-L'); if (!L) return;
    var lb=toBand(BAND_L, L.value===''?null:+L.value), rb=toBand(BAND_R, document.getElementById('ie-R').value===''?null:+document.getElementById('ie-R').value);
    var w=document.getElementById('ie-W').value, s=document.getElementById('ie-S').value;
    document.getElementById('ie-Lb').innerHTML='<span style="color:'+bandColor(lb)+'">'+fmtB(lb)+'</span>';
    document.getElementById('ie-Rb').innerHTML='<span style="color:'+bandColor(rb)+'">'+fmtB(rb)+'</span>';
    var o=overall([lb,rb,w===''?null:+w,s===''?null:+s]); var O=document.getElementById('ie-O'); O.textContent=fmtB(o); O.style.color=bandColor(o);
  }

  // ════════ WEAK SPOTS ════════
  function viewWeak(){
    var max=Math.max(1, Math.max.apply(null, Object.keys(ST.weak).map(function(k){return ST.weak[k];}).concat([1])));
    function shade(n){ if (!n) return ['#F8F8FA','#5B5B66']; var r=n/max; return r>.66?['#991b1b','#fff']:r>.33?['#ef4444','#fff']:['#fecaca','#7f1d1d']; }
    var blocks=['L','R','W','S'].map(function(k){
      return '<div class="ia-box"><div class="ia-k" style="margin-bottom:10px">'+icon(AREA[k].icon,16)+' '+AREA[k].name.toUpperCase()+'</div><div class="ia-heat">'+TYPES[k].map(function(t){ var n=ST.weak[t[0]]||0, s=shade(n);
        return '<button data-weak="'+t[0]+'" style="background:'+s[0]+';color:'+s[1]+'"><b>'+(n||'·')+'</b>'+esc(t[1])+'</button>'; }).join('')+'</div></div>';
    }).join('');
    return head('Weak Spots','문제 풀면 자동 +1 · 칸을 누르면 +1 · 길게 누르면(우클릭) −1', '<button class="ia-btn sm" data-act="weak-reset">'+icon('restart_alt',15)+' 초기화</button>')+'<div class="ia-grid ia-2" style="grid-template-columns:minmax(0,1fr) minmax(0,1fr)">'+blocks+'</div>';
  }

  // ════════ CARDS ════════
  var CD={i:0, flip:false, deck:null};
  function allCards(){ return (bank().vocab||[]).concat(ST.myCards||[]); }
  function cardKey(c){ return c.en.toLowerCase(); }
  function buildDeck(){
    var now=Date.now(), cs=allCards().filter(function(c){ var s=ST.cards[cardKey(c)]; return !s || !s.due || s.due<=now; });
    cs.sort(function(a,b){ return ((ST.cards[cardKey(a)]||{}).box||0)-((ST.cards[cardKey(b)]||{}).box||0); });
    CD.deck=cs.slice(0,20); CD.i=0; CD.flip=false;
  }
  function viewCards(){
    if (!CD.deck) buildDeck();
    var all=allCards(), boxes=[0,0,0,0,0,0]; all.forEach(function(c){ var s=ST.cards[cardKey(c)]; boxes[s?s.box:0]++; });
    var c=CD.deck[CD.i];
    var boxBar='<div style="display:grid;grid-template-columns:repeat(6,1fr);gap:4px;margin-bottom:16px">'+boxes.map(function(n,i){ return '<div style="text-align:center"><div style="height:46px;display:flex;align-items:flex-end;background:#F8F8FA"><div style="width:100%;height:'+(all.length?Math.max(4,n/all.length*100):0)+'%;background:'+(i===0?'#DCDCE3':i>=4?OK:ACC)+'"></div></div><div style="font-size:11px;font-weight:700;margin-top:4px;color:#5B5B66">'+(i===0?'새 카드':'상자 '+i)+' · '+n+'</div></div>'; }).join('')+'</div>';
    var card=c?'<div class="ia-flash" data-act="cflip"><div class="ia-k">'+(CD.i+1)+' / '+CD.deck.length+' · '+({w:'쓰기',s:'말하기',r:'읽기',l:'듣기'})[c.tag||'w']+'</div><div style="font-size:26px;font-weight:800">'+esc(c.en)+'</div>'
      +(CD.flip?'<div style="font-size:16px;font-weight:700;color:'+ACC+'">'+esc(c.ko)+'</div>'+(c.ex?'<div style="font-size:14px;color:#5B5B66;font-family:Georgia,serif!important;max-width:560px">'+esc(c.ex)+'</div>':''):'<div style="font-size:12px;color:#8A8A95">눌러서 뜻 보기</div>')+'</div>'
      +'<div class="ia-row" style="justify-content:center;margin-top:12px"><button class="ia-btn" data-cans="0" style="min-width:120px;border-color:'+BAD+';color:'+BAD+'">'+icon('close',16)+' 몰라</button><button class="ia-btn" data-cans="1" style="min-width:120px;border-color:'+OK+';color:'+OK+'">'+icon('check',16)+' 알아</button></div>'
      :'<div class="ia-empty">'+icon('celebration',28)+'<br>오늘 볼 카드 끝 · 틀린 건 내일, 아는 건 며칠 뒤에 다시 나와요</div>';
    return head('Cards','채점·오답에서 나온 표현만 · 알면 다음 상자(1·2·4·8·16일 뒤)', '<button class="ia-btn sm" data-act="creload">'+icon('refresh',15)+' 다시 섞기</button>')
      +boxBar+card
      +'<div class="ia-box" style="margin-top:16px"><div class="ia-k" style="margin-bottom:8px">내 카드 추가</div><div class="ia-row"><input class="ia-in" id="ic-en" placeholder="pose a risk to" style="flex:2;min-width:160px"><input class="ia-in" id="ic-ko" placeholder="~에 위험이 되다" style="flex:2;min-width:140px"><input class="ia-in" id="ic-ex" placeholder="예문 (선택)" style="flex:3;min-width:160px"><button class="ia-btn pri" data-act="cadd">추가</button></div></div>';
  }
  function answerCard(ok){
    var c=CD.deck[CD.i]; if (!c) return; var k=cardKey(c), s=ST.cards[k]||{box:0};
    s.box=ok?Math.min(5,(s.box||0)+1):1; s.due=Date.now()+[0,1,2,4,8,16][s.box]*86400000*(ok?1:0) + (ok?0:20*3600*1000); ST.cards[k]=s; saveState();
    CD.i++; CD.flip=false; render();
  }

  // ════════ GUIDE ════════
  function viewGuide(){ return head('Guide','전략·자료·채점 프롬프트 — 필요할 때만')+(typeof window.ieltsGuideHtml==='function'?window.ieltsGuideHtml():''); }

  // ════════ 렌더 · 이벤트 ════════
  function render(){
    var el=document.getElementById('eng-ielts-view'); if (!el) return;
    css();
    var v=ST.view, body;
    if (OMR && (v==='listening'||v==='reading')) body=viewOmr();
    else body= v==='listening'?viewPractice('L') : v==='reading'?viewPractice('R') : v==='writing'?viewWriting() : v==='speaking'?viewSpeaking() : v==='scores'?viewScores() : v==='weak'?viewWeak() : v==='cards'?viewCards() : v==='guide'?viewGuide() : viewHome();
    el.innerHTML='<div class="ia"><nav class="ia-nav">'+NAV.map(function(n){return '<button data-nav="'+n[0]+'" class="'+(n[0]===v?'on':'')+'">'+icon(n[2],20)+n[1]+'</button>';}).join('')+'</nav><div id="ia-body">'+body+'</div></div>';
    if (v==='listening'||v==='reading'){ if (RUN && !OMR) tickRun(); }
    if (v==='writing' && WR) tickWriting();
    if (v==='speaking' && (SP.phase==='prep'||SP.phase==='talk')) tickSpeak();
    if (v==='scores') liveMock();
  }
  function go(v){
    stopSpeech();
    if (v.indexOf('writing:')===0){ var t=+v.split(':')[1], B=bank().writing, arr=t===1?B.task1:B.task2; ST.view='writing'; if (arr&&arr.length) startWriting(t, arr[Math.floor(Math.random()*arr.length)]); render(); return; }
    ST.view=v; try { localStorage.setItem('atelier_ielts_view', v); } catch(e){}
    render(); var el=document.getElementById('eng-ielts-view'); if (el && el.getBoundingClientRect().top<0) window.scrollTo({top:el.offsetTop-80});
  }

  function bind(){
    var root=document.getElementById('eng-ielts-view'); if (!root || root._iaBound) return; root._iaBound=true;
    root.addEventListener('click', async function(e){
      var t=e.target.closest('[data-nav],[data-go],[data-run],[data-sec],[data-q],[data-act],[data-omr],[data-del],[data-wt1],[data-wt2],[data-wrand],[data-wfree],[data-wopen],[data-medit],[data-mock],[data-weak],[data-cans]');
      if (!t || !root.contains(t)) return;
      var d=t.dataset;
      if (d.nav){ if (RUN && !RUN.done && d.nav!==ST.view && !confirm('푸는 중인 문제를 그만둘까요?')) return; if (d.nav!==ST.view){ RUN=null; OMR=null; } go(d.nav); return; }
      if (d.go){ go(d.go); return; }
      if (d.mock){ ST.view='scores'; EDIT=+d.mock; render(); return; }
      if (d.run){ startRun(ST.view==='listening'?'L':'R', d.run); render(); return; }
      if (d.sec!=null){ stopSpeech(); RUN.cur=+d.sec; render(); return; }
      if (d.q){ if (RUN.done) return; RUN.ans[d.q]=d.v; t.parentNode.querySelectorAll('button').forEach(function(b){b.classList.toggle('on', b===t);}); return; }
      if (d.omr){ OMR={area:d.omr, mine:{}, key:{}, keyRaw:'', graded:false, types:{}, src:'GT 21', test:1, mock:'', running:false, t0:0, used:0}; render(); return; }
      if (d.del){ if (!confirm('이 기록을 지울까요?')) return; await deleteRecord(d.del); render(); return; }
      if (d.wt1||d.wt2){ var B=bank().writing, p=(d.wt1?B.task1:B.task2).find(function(x){return x.id===(d.wt1||d.wt2);}); startWriting(d.wt1?1:2,p); render(); return; }
      if (d.wrand){ go('writing:'+d.wrand); return; }
      if (d.wfree){ var tk=confirm('에세이(Task 2)면 확인, 편지(Task 1)면 취소')?2:1; startWriting(tk,null,true); render(); return; }
      if (d.wopen){ var r=ST.records.find(function(x){return x._id===d.wopen;}); if (r){ WR={task:r.task, id:r.ref, prompt:r.prompt, opener:'', ideas:[], text:r.text, limit:r.task===1?1200:2400, t0:null, paused:r.secs||0, running:false, draftKey:'atelier_ielts_draft_x', free:false, checks:{}, recId:r._id}; render(); } return; }
      if (d.medit){ EDIT=+d.medit; render(); return; }
      if (d.weak){ addWeak(d.weak,1); render(); return; }
      if (d.cans!=null){ answerCard(d.cans==='1'); return; }
      var a=d.act;
      if (a==='exit'){ stopSpeech(); RUN=null; render(); return; }
      if (a==='submit'){ var tot=RUN.secs.reduce(function(s,x){return s+x.questions.length;},0), an=Object.keys(RUN.ans).filter(function(k){return RUN.ans[k];}).length; if (an<tot && !confirm((tot-an)+'문항이 비어 있어요. 제출할까요?')) return; submitRun(); return; }
      if (a==='omr-exit'){ clearInterval(ST.timers.omr); OMR=null; render(); return; }
      if (a==='omr-start'){ if (OMR.running){ OMR.used+=(Date.now()-OMR.t0)/1000; OMR.running=false; clearInterval(ST.timers.omr); } else { OMR.running=true; OMR.t0=Date.now(); var lim=OMR.area==='L'?1800:3600; ST.timers.omr=setInterval(function(){ var c=document.getElementById('ia-omr-clock'); if (!c||!OMR){clearInterval(ST.timers.omr);return;} var left=lim-OMR.used-(Date.now()-OMR.t0)/1000; c.textContent=left>=0?mmss(left):'+'+mmss(-left); c.style.color=left<300?'#fca5a5':'#fff'; },500); } render(); return; }
      if (a==='omr-grade'){ OMR.keyRaw=document.getElementById('ia-key').value; OMR.key=parseKey(OMR.keyRaw); var nk=Object.keys(OMR.key).length; if (nk<40 && !confirm('정답이 '+nk+'개만 읽혔어요. 그래도 채점할까요?')) return; OMR.graded=true; OMR.running=false; clearInterval(ST.timers.omr); render(); return; }
      if (a==='omr-save'){ var wrongN=0; for (var i=1;i<=40;i++) if (!isRight(OMR.mine[i],OMR.key[i])) wrongN++; var sc=40-wrongN, b=toBand(OMR.area==='L'?BAND_L:BAND_R,sc);
        Object.keys(OMR.types).forEach(function(n){ if (OMR.types[n]) addWeak(OMR.types[n],1); });
        var src=document.getElementById('ia-omr-src').value+' Test '+document.getElementById('ia-omr-test').value, mk=document.getElementById('ia-omr-mock').value;
        await saveRecord({kind:OMR.area==='L'?'listening':'reading', date:today(), ref:src, title:src+' (책)', score:sc, total:40, band:b, bands:OMR.area==='L'?{L:b}:{R:b}});
        if (mk){ var m=(plan().mocks||[]).find(function(x){return x.n===+mk;}), r=mockRec(mk)||{kind:'mock', n:+mk, date:m?m.date:today(), bands:{}, raw:{}}; r.bands=r.bands||{}; r.raw=r.raw||{}; r.bands[OMR.area]=b; r.raw[OMR.area]=sc; r.src=src; await saveRecord(r); }
        toast('저장했어요 · '+sc+'/40 · '+fmtB(b)); OMR=null; render(); return; }
      if (a==='wtime'){ if (WR.running){ WR.paused+=(Date.now()-WR.t0)/1000; WR.running=false; } else { WR.running=true; WR.t0=Date.now(); } render(); var ta=document.getElementById('ia-wtext'); if (ta) ta.focus(); return; }
      if (a==='wexit'){ if (WR.text && !WR.recId && !confirm('저장 안 하고 닫을까요? (임시 저장은 남아요)')) return; WR=null; render(); return; }
      if (a==='wcopy'){ var txt=graderPrompt(); try { await navigator.clipboard.writeText(txt); toast('복사했어요 — Claude에 붙여넣기'); } catch(err){ prompt('복사하기', txt); } return; }
      if (a==='wsave'){ var used=WR.paused+(WR.running?(Date.now()-WR.t0)/1000:0); var pr=document.getElementById('ia-wprompt'); if (pr) WR.prompt=pr.value;
        var words=wc(WR.text), goal=WR.task===1?150:250; if (words<goal) addWeak('w-length',1);
        var rec=await saveRecord({_id:WR.recId, kind:'writing', date:today(), task:WR.task, ref:WR.id, prompt:WR.prompt, text:WR.text, words:words, secs:Math.round(used), band:null});
        WR.recId=rec._id; try { localStorage.removeItem(WR.draftKey); } catch(err){} toast('저장했어요 · '+words+'단어'); return; }
      if (a==='sgo'){ speakGo(); return; }
      if (a==='snew'){ var P2=bank().speaking.part2; SP.card=P2[Math.floor(Math.random()*P2.length)]; SP.phase='idle'; render(); return; }
      if (a==='snew1'){ var P1=bank().speaking.part1; SP.p1=P1[Math.floor(Math.random()*P1.length)]; render(); return; }
      if (a==='msave'){ var Lr=document.getElementById('ie-L').value, Rr=document.getElementById('ie-R').value, Wv=document.getElementById('ie-W').value, Sv=document.getElementById('ie-S').value;
        var mm=(plan().mocks||[]).find(function(x){return x.n===EDIT;}), ex=mockRec(EDIT)||{kind:'mock', n:EDIT, date:mm?mm.date:today()};
        ex.raw={L:Lr===''?null:+Lr, R:Rr===''?null:+Rr}; ex.bands={L:toBand(BAND_L,ex.raw.L), R:toBand(BAND_R,ex.raw.R), W:Wv===''?null:+Wv, S:Sv===''?null:+Sv};
        await saveRecord(ex); EDIT=null; render(); return; }
      if (a==='mcancel'){ EDIT=null; render(); return; }
      if (a==='weak-reset'){ if (!confirm('약점 횟수를 전부 0으로 할까요?')) return; ST.weak={}; saveState(); render(); return; }
      if (a==='cflip'){ CD.flip=!CD.flip; render(); return; }
      if (a==='creload'){ buildDeck(); render(); return; }
      if (a==='cadd'){ var en=document.getElementById('ic-en').value.trim(), ko=document.getElementById('ic-ko').value.trim(); if (!en||!ko){ toast('영어와 뜻을 둘 다 적어요'); return; } ST.myCards.push({en:en, ko:ko, ex:document.getElementById('ic-ex').value.trim(), tag:'w', mine:true}); saveState(); buildDeck(); render(); return; }
      if (a==='play' || t.id==='ia-play'){ playSection(); return; }
    });
    root.addEventListener('contextmenu', function(e){ var t=e.target.closest('[data-weak]'); if (!t) return; e.preventDefault(); addWeak(t.dataset.weak,-1); render(); });
    root.addEventListener('input', function(e){
      var t=e.target;
      if (t.dataset.qi){ RUN.ans[t.dataset.qi]=t.value; return; }
      if (t.dataset.omrI){ OMR.mine[t.dataset.omrI]=t.value; return; }
      if (t.id==='ia-wtext'){ WR.text=t.value; try { localStorage.setItem(WR.draftKey, t.value); } catch(err){}
        if (!WR.running && !WR.t0 && t.value.length>0){ WR.running=true; WR.t0=Date.now(); }
        var n=wc(t.value), goal=WR.task===1?150:250, top=WR.task===1?190:300, c=document.getElementById('ia-wc'), b=document.getElementById('ia-wbar'); if (c) c.textContent=n+' / '+goal; if (b){ b.style.width=Math.min(100,n/top*100)+'%'; b.style.background=n>=goal?'#4ade80':'#fca5a5'; } return; }
      if (t.id && t.id.indexOf('ie-')===0){ liveMock(); return; }
    });
    root.addEventListener('change', async function(e){
      var t=e.target;
      if (t.dataset.wt){ OMR.types[t.dataset.wt]=t.value; return; }
      if (t.dataset.wck){ WR.checks[t.dataset.wck]=t.checked; return; }
      if (t.dataset.wband){ var r=ST.records.find(function(x){return x._id===t.dataset.wband;}); if (r){ r.band=t.value===''?null:+t.value; r.bands=r.band!=null?{W:r.band}:null; await saveRecord(r); t.style.color=bandColor(r.band); } return; }
      if (t.id==='ia-omr-src'){ OMR.src=t.value; } if (t.id==='ia-omr-test'){ OMR.test=t.value; } if (t.id==='ia-omr-mock'){ OMR.mock=t.value; }
    });
  }

  window.renderIelts = async function(){
    var el=document.getElementById('eng-ielts-view'); if (!el) return;
    bind();
    if (!ST.loaded){ try { ST.view=localStorage.getItem('atelier_ielts_view')||'home'; } catch(e){} cacheLoad(); render(); await load(); }
    render();
  };
  window.IELTS_APP = { state:ST, toBand:function(a,n){ return toBand(a==='L'?BAND_L:BAND_R,n); } };
})();
