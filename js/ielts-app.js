// ═══ ENGLISH › IELTS 앱 (2026-10-18) ═══
// 화면: Home · Listening · Reading · Writing · Speaking · Scores · Weak spots · Cards · Guide
// 문제 = js/ielts-bank.js (window.IELTS_BANK, 오리지널 문제) · 계획·전략 = js/ielts-page.js (window.IELTS_DATA)
// 저장 = Firestore `ieltsRecords`(기록 한 건 = 문서 하나) + `ielts/state`(약점 횟수·카드 상자) · 로그인 안 됐으면 localStorage 만
(function(){
  var LS_KEY = 'atelier_ielts_v1';
  var ST = { view:'home', records:[], weak:{}, cards:{}, myCards:[], watched:{}, loaded:false, timers:{}, sub:{} };
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
  function plan(){ return window.IELTS_DATA || { exam:{date:null}, mocks:[], goals:[] }; }
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
  function cacheSave(){ try { localStorage.setItem(LS_KEY, JSON.stringify({records:ST.records, weak:ST.weak, cards:ST.cards, myCards:ST.myCards, watched:ST.watched})); } catch(e){} }
  function cacheLoad(){ try { var c=JSON.parse(localStorage.getItem(LS_KEY)||'null'); if (c){ ST.records=c.records||[]; ST.weak=c.weak||{}; ST.cards=c.cards||{}; ST.myCards=c.myCards||[]; ST.watched=c.watched||{}; } } catch(e){} }
  async function load(){
    cacheLoad();
    var d=fb(); if (!d){ ST.loaded=true; return; }
    try {
      var snap=await d.collection('ieltsRecords').get();
      ST.records=snap.docs.map(function(x){ var o=x.data(); o._id=x.id; return o; });
      var st=await d.collection('ielts').doc('state').get();
      if (st.exists){ var o=st.data(); ST.weak=o.weak||{}; ST.cards=o.cards||{}; ST.myCards=o.myCards||[]; ST.watched=o.watched||{}; }
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
  var _stT; function saveState(){ cacheSave(); clearTimeout(_stT); _stT=setTimeout(async function(){ var d=fb(); if (d){ try { await d.collection('ielts').doc('state').set({weak:ST.weak, cards:ST.cards, myCards:ST.myCards, watched:ST.watched, updatedAt:new Date().toISOString()},{merge:true}); } catch(e){} } },600); }
  function addWeak(type, n){ if (!type) return; ST.weak[type]=(ST.weak[type]||0)+(n||1); if (ST.weak[type]<0) ST.weak[type]=0; saveState(); }

  // ── 기록에서 숫자 뽑기 ──
  function recsOf(kind){ return ST.records.filter(function(r){return r.kind===kind;}).sort(function(a,b){ return (a.date||'').localeCompare(b.date||'') || (a.updatedAt||'').localeCompare(b.updatedAt||''); }); }
  function mockRec(n){ return ST.records.find(function(r){ return r.kind==='mock' && +r.n===+n; }); }
  function latestBands(){
    var g={}; (plan().goals||[]).forEach(function(x){ g[x.k]=x.now; });
    var out={L:null,R:null,W:null,S:null,src:{}};
    ['L','R','W','S'].forEach(function(k){
      var vals=ST.records.filter(function(r){ return r.bands && r.bands[k]!=null; }).sort(function(a,b){return (a.date||'').localeCompare(b.date||'');}).map(function(r){return +r.bands[k];});
      if (k==='W' || k==='S'){ var gk=(ST.grades||[]).filter(function(g){ return g.status==='done' && g.result && g.kind===(k==='W'?'writing':'speaking'); }).sort(function(a,b){return (a.createdAt||'').localeCompare(b.createdAt||'');});
        if (k==='W'){ // 쓰기 = (편지 + 에세이×2)/3, 최근 것끼리
          var t1=gk.filter(function(g){return +g.task===1;}).map(function(g){return +g.result.band;}).slice(-3), t2=gk.filter(function(g){return +g.task===2;}).map(function(g){return +g.result.band;}).slice(-3);
          function av(a){ return a.reduce(function(x,y){return x+y;},0)/a.length; }
          if (t2.length) vals.push(t1.length?(av(t1)+2*av(t2))/3:av(t2)); else if (t1.length) vals.push(av(t1));
        } else gk.slice(-3).forEach(function(g){ vals.push(+g.result.band); }); }
      var last=vals.slice(-3);
      if (last.length){ out[k]=Math.round(last.reduce(function(x,y){return x+y;},0)/last.length*2)/2; out.src[k]=last.length>1?'최근 '+last.length+'회':'기록 1회'; } else { out[k]=g[k]!=null?Math.floor(g[k]*2)/2:null; out.src[k]='추정'; } // 추정치는 내림 — 이미 목표 넘은 것처럼 안 보이게
    });
    return out;
  }

  // ── 공통 조각 ──
  function icon(n, sz){ return '<span class="material-symbols-outlined" style="font-size:'+(sz||18)+'px;vertical-align:-3px">'+n+'</span>'; }
  function head(title, sub, right){ return '<div class="ia-head"><div><h3>'+esc(title)+'</h3>'+(sub?'<p>'+esc(sub)+'</p>':'')+'</div>'+(right||'')+'</div>'; }
  function bar(v, max, col, h){ return '<div class="ia-bar" style="height:'+(h||8)+'px"><i style="width:'+Math.max(0,Math.min(100,v/max*100))+'%;background:'+col+'"></i></div>'; }

  function subTabs(view, items){
    var cur=ST.sub[view]||items[0][0];
    return '<div class="ia-row" style="gap:0;border:1px solid #DCDCE3;width:fit-content;margin-bottom:16px;background:#F8F8FA;padding:3px">'+items.map(function(it){ var on=cur===it[0]; return '<button data-sub="'+view+'|'+it[0]+'" style="height:30px;padding:0 14px;font-size:13px;font-weight:700;display:inline-flex;align-items:center;gap:6px;border:1px solid '+(on?'#16161A':'transparent')+';background:'+(on?'#fff':'transparent')+';color:'+(on?'#16161A':'#5B5B66')+'">'+icon(it[2],16)+it[1]+'</button>'; }).join('')+'</div>';
  }
  function subOf(view, def){ return ST.sub[view]||def; }
  var NAV = [['home','Home','space_dashboard'],['listening','Listening','headphones'],['reading','Reading','menu_book'],['writing','Writing','edit_note'],['speaking','Speaking','mic'],['scores','Scores','monitoring'],['weak','Weak Spots','target'],['tests','Free Tests','quiz'],['videos','Videos','smart_display'],['cards','Cards','style'],['guide','Guide','map']];

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
      '#eng-ielts-view .ia-ta{width:100%;border:1px solid #DCDCE3;padding:14px;font-size:16px;line-height:1.7;font-family:Arial,Helvetica,sans-serif!important;resize:vertical;min-height:320px}',
      '#eng-ielts-view .ia-pick{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px}',
      '#eng-ielts-view .ia-tile{border:1px solid #DCDCE3;padding:16px;background:#fff;cursor:pointer;text-align:left;display:flex;flex-direction:column;gap:6px}',
      '#eng-ielts-view .ia-tile:hover{border-color:'+ACC+'}',
      '#eng-ielts-view .ia-tile .t{font-size:15px;font-weight:800}',
      '#eng-ielts-view .ia-tile .s{font-size:12.5px;color:#5B5B66}',
      '#eng-ielts-view .ia-tag{display:inline-block;font-size:11px;font-weight:700;padding:2px 6px;background:#EEF2FD;color:'+ACC+'}',
      '#eng-ielts-view .ia-split{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:0;border:1px solid #DCDCE3;background:#fff}',
      '#eng-ielts-view .ia-split>div{padding:20px;max-height:72vh;overflow:auto}',
      '#eng-ielts-view .ia-split>div+div{border-left:1px solid #DCDCE3;background:#FCFCFD}',
      '#eng-ielts-view .ia-pass p{font-family:Arial,Helvetica,sans-serif!important;font-size:15px;line-height:1.75;margin:0 0 14px}',
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
      '#eng-ielts-view .ia-pb.hid{background:#16161A;color:#16161A!important;user-select:none}#eng-ielts-view .ia-pb.hid:hover{background:#2a2a30}',
      '#eng-ielts-view .ia-pal{position:sticky;bottom:0;z-index:5;background:#fff;border:1px solid #16161A;padding:8px 10px;margin-top:12px;display:flex;flex-direction:column;gap:4px;overflow-x:auto}',
      '#eng-ielts-view .ia-pass mark.ia-hl{background:#FDE68A;color:inherit;cursor:pointer}',
      '#eng-ielts-view .ia-empty{padding:28px;text-align:center;color:#5B5B66;border:1px dashed #DCDCE3;font-size:13px}',
      '@media (max-width:860px){#eng-ielts-view .ia-split{grid-template-columns:1fr}#eng-ielts-view .ia-split>div{max-height:none}#eng-ielts-view .ia-split>div+div{border-left:0;border-top:1px solid #DCDCE3}#eng-ielts-view .ia-timer{top:56px}}',
      '@media (max-width:640px){#eng-ielts-view .ia-nav button{padding:8px 10px;font-size:11px}#eng-ielts-view .ia-home-top{grid-template-columns:1fr!important}#eng-ielts-view .ia-2{grid-template-columns:1fr!important}#eng-ielts-view .ia-heat{grid-template-columns:repeat(3,minmax(0,1fr))}#eng-ielts-view .ia-heat button{font-size:11px}#eng-ielts-view .ia-box{padding:12px}}'
    ].join('\n');
    document.head.appendChild(st);
  }

  // ════════ HOME ════════
  function viewHome(){
    var P=plan(), d=P.exam.date?days(P.exam.date):null, lb=latestBands(), goals={}; (P.goals||[]).forEach(function(g){goals[g.k]=g;});
    var mocks=P.mocks||[], next=P.exam.date ? mocks.find(function(m){ return !mockRec(m.n) && days(m.date)>=-3; }) : null;
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
          +(P.exam.date ? '<div class="ia-num" style="font-size:56px;line-height:1">'+(d>0?'D-'+d:d===0?'D-DAY':'D+'+(-d))+'</div>'
            +'<div style="font-size:12.5px;font-weight:600;opacity:.9">'+P.exam.date.replace(/-/g,'.')+' · GT · 컴퓨터</div>'
            : '<div class="ia-num" style="font-size:44px;line-height:1">보류</div><div style="font-size:12.5px;font-weight:600;opacity:.9">시험 안 봄 · 캐나다 영주권 때만</div>')
          +'<div style="margin-top:auto;padding-top:14px;border-top:1px solid rgba(255,255,255,.35);display:flex;justify-content:space-between;align-items:flex-end">'
            +'<div><div style="font-size:11px;font-weight:700;opacity:.8">OVERALL</div><div class="ia-num" style="font-size:30px">'+fmtB(ov)+'</div></div>'
            +(next?'<div style="text-align:right"><div style="font-size:11px;font-weight:700;opacity:.8">NEXT MOCK</div><div style="font-size:15px;font-weight:800">#'+next.n+' · '+next.date.slice(5).replace('-','/')+'</div><div style="font-size:11px;opacity:.85">D-'+days(next.date)+'</div></div>':'')
          +'</div></div>'
        +'<div class="ia-pick" style="grid-template-columns:repeat(auto-fit,minmax(150px,1fr))">'+tiles+'</div>'
      +'</div>'
      +'<div class="ia-box" style="display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:16px;align-items:center;border:2px solid #16161A">'+icon('timer',34)+'<div><div style="font-size:16px;font-weight:800">실전 모의고사 · 2시간 40분</div><div style="font-size:12.5px;color:#5B5B66;margin-top:2px">듣기 30분 → 읽기 60분 → 쓰기 60분, 쉬는 시간 없이 실제 시험 순서 그대로 · 쓰기는 끝나면 자동 채점</div></div>'
        +'<div class="ia-row" style="gap:6px">'+[['L1','R1'],['L2','R2']].filter(function(x){ var B=bank(); return B.listening.some(function(s){return s.test===x[0];}) && B.reading.some(function(s){return s.test===x[1];}); }).map(function(x,i){ return '<button class="ia-btn'+(i===0?' pri':'')+'" data-mockstart="'+x[0]+'|'+x[1]+'">'+icon('play_arrow',16)+' 세트 '+(i+1)+'</button>'; }).join('')+'</div></div>'
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
    var B=bank(), list=area==='L'?B.listening:B.reading, vname=area==='L'?'listening':'reading';
    if (RUN && RUN.area===area) return runHtml();
    var tabs=subTabs(vname,area==='L'?[['practice','문제 풀기','edit_square'],['dict','받아쓰기','keyboard'],['tips','공략','tips_and_updates']]:[['practice','문제 풀기','edit_square'],['drill','유형 드릴','fitness_center'],['tips','공략','tips_and_updates']]);
    if (area==='L' && subOf(vname,'practice')==='dict') return head('Listening','한 줄씩 듣고 그대로 받아쓰기 — 듣기 8.0 에 제일 효과 큰 연습')+tabs+dictHtml();
    if (area==='R' && subOf(vname,'practice')==='drill') return head('Reading','약한 유형만 골라서 — 매일 들어오는 Read 글로 만든 문제')+tabs+drillHtml();
    if (subOf(vname,'practice')==='tips') return head(area==='L'?'Listening':'Reading', area==='L'?'한 번만 들려줘요 — 듣기 전에 이미 반은 풀려 있어야 해요':'끝까지 다 읽으면 시간 안에 못 풀어요 — 문제가 먼저', '')+tabs+tipsHtml(area);
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
    return head(area==='L'?'Listening':'Reading', area==='L'?'오리지널 문제 · 사람 목소리 음성 · 실전처럼 한 번만':'오리지널 GT 지문 · 왼쪽 지문, 오른쪽 문제 · 섹션별 시간', '<button class="ia-btn" data-omr="'+area+'">'+icon('fact_check',16)+' 책 답안지</button>')
      +tabs+empty+'<div class="ia-pick">'+cards+'</div>'
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
    RUN={area:area, test:k[0], full:k[1]==='all', secs:secs, cur:0, ans:{}, done:false, t0:Date.now(), limit:limit, played:{}, flags:{}, hl:{}, mock:!!(MOCK&&MOCK.active)};
  }
  // 드릴·오답 다시 풀기처럼 섹션을 직접 넘겨 시작
  function startCustomRun(area, secs, title, limit){ RUN={area:area, test:title, full:false, custom:true, secs:secs, cur:0, ans:{}, done:false, t0:Date.now(), limit:limit||0, played:{}, flags:{}, hl:{}}; }
  // ── 실전 모의고사: 듣기 → 읽기 → 쓰기 (2시간 40분) ──
  var MOCK=null;
  function startMock(l, r){ var B=bank().writing||{task1:[],task2:[]}; MOCK={active:true, step:'L', l:l, r:r, t1:B.task1[Math.floor(Math.random()*B.task1.length)], t2:B.task2[Math.floor(Math.random()*B.task2.length)], res:{}, t0:Date.now()}; startRun('L', l+'|all'); }
  function mockBar(){
    if (!MOCK||!MOCK.active||!((RUN&&RUN.mock)||(WR&&WR.mock))) return '';   // 실전 중일 때만
    var st=[['L','Listening','30분'],['R','Reading','60분'],['W','Writing','60분']];
    return '<div class="ia-row" style="gap:0;margin-bottom:10px;border:1px solid #16161A">'+st.map(function(x){ var on=MOCK.step===x[0], done=MOCK.res[x[0]]!=null;
      return '<div style="flex:1;padding:8px 12px;background:'+(on?'#16161A':done?'#F0FDF4':'#fff')+';color:'+(on?'#fff':'#16161A')+';font-size:12.5px;font-weight:800;display:flex;justify-content:space-between"><span>'+(done?'✓ ':'')+x[1]+'</span><span style="opacity:.7">'+(done&&MOCK.res[x[0]].band!=null?fmtB(MOCK.res[x[0]].band):x[2])+'</span></div>'; }).join('')+'</div>';
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
      ? '<div class="ia-pass" data-sid="'+esc(s.id)+'">'+(R.hl[s.id]||('<div class="ia-k" style="margin-bottom:6px">'+(R.custom?'DRILL':'SECTION '+s.section+' · '+(s.minutes||'')+'분')+' · 끌어서 하이라이트, 누르면 지우기</div><h4 style="font-size:17px;font-weight:800;margin:0 0 14px">'+esc(s.title)+'</h4>'+s.passage.map(function(p){return '<p>'+(p.label?'<span class="lb">'+esc(p.label)+'</span>':'')+esc(p.text)+'</p>';}).join('')))+'</div>'
      : '<div><div class="ia-k" style="margin-bottom:6px">SECTION '+s.section+'</div><h4 style="font-size:17px;font-weight:800;margin:0 0 8px">'+esc(s.title)+'</h4><p style="font-size:13px;color:#5B5B66;margin:0 0 14px">'+esc(s.context||'')+'</p>'
        +(R.done?'<details open><summary style="cursor:pointer;font-weight:700;font-size:13px">'+icon('description',16)+' 스크립트</summary><div style="margin-top:10px;font-size:14px;line-height:1.7">'+s.script.map(function(l,i){ var au=audioOf(s), t=au&&au.lines[i]?au.lines[i].t:null; return '<p class="ia-line" data-seek="'+(t==null?'':t)+'" style="margin:0 0 6px;padding:4px 6px;'+(t!=null?'cursor:pointer':'')+'"><b style="color:'+ACC+'">'+esc(l.who)+'</b> '+esc(l.text)+'</p>';}).join('')+'</div></details>'
          :'<div class="ia-empty">'+icon('headphones',28)+'<br>재생을 누르면 한 번만 들려줘요 · 들으면서 오른쪽에 답'+(audioOf(s)?'<div style="margin-top:14px;text-align:left"><div class="ia-bar" style="height:6px"><i id="ia-aprog" style="width:0%;background:'+ACC+'"></i></div><div class="ia-row" style="justify-content:space-between;font-size:11.5px;margin-top:4px;font-weight:700"><span id="ia-atime">0:00</span><span>'+mmss(audioOf(s).dur)+'</span></div></div>':'')+'</div>')+'</div>';
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
      return pre+'<div class="ia-q '+cls+'" id="ia-q'+q.n+'"><span class="qn">'+q.n+'</span><span class="qt">'+esc(qtext)+'</span>'+(R.done?'':'<button data-flag="'+q.n+'" title="다시 볼 문제" style="float:right;color:'+(R.flags[q.n]?'#EA580C':'#C4C4CC')+'">'+icon(R.flags[q.n]?'flag':'outlined_flag',18)+'</button>')+input+fb+'</div>';
    }).join('');
    var result='';
    if (R.done){ var sc=R.score, b=R.full&&total===40?toBand(R.area==='L'?BAND_L:BAND_R, sc):null;
      result='<div class="ia-box" style="display:flex;gap:24px;align-items:center;margin-bottom:12px;flex-wrap:wrap"><div><div class="ia-k">SCORE</div><div class="ia-num" style="font-size:36px">'+sc+'<span style="font-size:18px;color:#5B5B66">/'+total+'</span></div></div>'
        +(b!=null?'<div><div class="ia-k">BAND</div><div class="ia-num" style="font-size:36px;color:'+bandColor(b)+'">'+fmtB(b)+'</div></div>':'')
        +'<div style="flex:1;min-width:200px">'+bar(sc,total,b!=null?bandColor(b):sc/total>=.85?OK:sc/total>=.75?MID:BAD,12)+'<div style="font-size:12px;color:#5B5B66;margin-top:6px">틀린 문제 유형은 Weak Spots에 자동으로 +1 됐어요</div></div></div>'; }
    // 실제 컴퓨터 시험처럼 아래 문제 번호 바 — 답한 것 채움, 표시한 것 주황, 지금 섹션 굵게
    var pal='<div class="ia-pal">'+R.secs.map(function(x,si){ return '<div class="ia-row" style="gap:2px;flex-wrap:nowrap"><span style="font-size:11px;font-weight:800;color:#5B5B66;margin-right:4px">'+(R.custom?'Q':'S'+x.section)+'</span>'+x.questions.map(function(q){ var a=R.ans[q.n], has=a!=null&&a!=='', ok=R.done?isRight(a,q.answer):null;
      var bg=R.done?(ok?OK:BAD):has?'#16161A':'#fff', fg=(R.done||has)?'#fff':'#16161A';
      return '<button data-jump="'+si+'|'+q.n+'" style="min-width:26px;height:26px;font-size:11px;font-weight:800;border:1px solid '+(si===R.cur?'#16161A':'#DCDCE3')+';background:'+bg+';color:'+fg+';position:relative">'+q.n+(R.flags[q.n]&&!R.done?'<i style="position:absolute;top:-1px;right:-1px;width:7px;height:7px;background:#EA580C"></i>':'')+'</button>'; }).join('')+'</div>'; }).join('')+'</div>';
    var next=R.done&&R.mock&&MOCK&&MOCK.active?'<div class="ia-box" style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;border:2px solid #16161A"><b>'+(R.area==='L'?'Listening 끝 — 다음은 Reading 60분':'Reading 끝 — 다음은 Writing 60분 (편지 + 에세이)')+'</b><button class="ia-btn pri" data-act="mocknext">다음 단계 '+icon('arrow_forward',16)+'</button></div>':'';
    return mockBar()+next+result+timer+'<div class="ia-split"><div>'+left+'</div><div>'+qs+'</div></div>'+pal;
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
    var wrong=[];
    R.secs.forEach(function(s){ s.questions.forEach(function(q){ total++; if (isRight(R.ans[q.n],q.answer)) score++; else { addWeak(q.type,1); wrong.push({sid:s.id, n:q.n, type:q.type, given:R.ans[q.n]||'', src:R.custom?(s.src||null):null}); } }); });
    R.score=score;
    var band=R.full&&total===40?toBand(R.area==='L'?BAND_L:BAND_R,score):null;
    await saveRecord({kind:R.area==='L'?'listening':'reading', date:today(), ref:R.full?R.test:R.secs[0].id, title:R.full?R.test+' 전체':R.secs[0].title, score:score, total:total, band:band, bands:band!=null?(R.area==='L'?{L:band}:{R:band}):null, secs:Math.round((Date.now()-R.t0)/1000), wrong:wrong, custom:!!R.custom, drillType:R.drillType||null});
    if (R.mock && MOCK && MOCK.active) MOCK.res[R.area]={score:score, total:total, band:band};
    render(); window.scrollTo({top:document.getElementById('eng-ielts-view').offsetTop-80});
  }

  // ── 음성 (Listening) ──
  var AUD=null; // 지금 재생 중인 음성 파일
  function audioOf(s){ return (window.IELTS_AUDIO||{})[s.id] || null; }
  function stopSpeechKeepAudio(){ try { window.speechSynthesis.cancel(); } catch(e){} }
  function stopSpeech(){ try { window.speechSynthesis.cancel(); } catch(e){} try { if (AUD){ AUD.pause(); } } catch(e){} }
  function hookAudio(){
    if (!AUD) return;
    AUD.ontimeupdate=function(){
      var p=document.getElementById('ia-aprog'), tt=document.getElementById('ia-atime'); if (p) p.style.width=(AUD.currentTime/(AUD.duration||1)*100)+'%'; if (tt) tt.textContent=mmss(AUD.currentTime);
      var ls=document.querySelectorAll('#eng-ielts-view .ia-line'), cur=-1; ls.forEach(function(l,i){ var t=parseFloat(l.dataset.seek); if (!isNaN(t) && AUD.currentTime>=t) cur=i; });
      ls.forEach(function(l,i){ l.style.background=i===cur?'#EEF2FD':''; });
    };
  }
  // 화자별 음성 — js/tts-voice.js 의 atlVoice (장난·네트워크 음성 제외), 두 화자가 같은 목소리 안 되게
  function castVoices(vmap){ var used=[], out={}; if (window.atlIsSafari) return out; /* 사파리는 기본 음성 그대로 */ Object.keys(vmap).forEach(function(k){ var v=window.atlVoice?window.atlVoice(vmap[k].lang||'en-GB', used):null; if (v){ used.push(v.name); out[k]=v; } }); return out; }
  function playSection(seekTo){
    var R=RUN, s=R.secs[R.cur], au=audioOf(s);
    if (!R.done && R.played[R.cur]) return;
    if (au){   // 자연 음성 파일 (scripts/ielts/make-audio.py)
      stopSpeech(); R.played[R.cur]=true; render();
      if (!AUD || AUD._sid!==s.id){ AUD=new Audio(au.file); AUD._sid=s.id; }
      hookAudio(); var at=seekTo||0; if (AUD.readyState>=1) AUD.currentTime=at; else AUD.addEventListener('loadedmetadata',function(){ AUD.currentTime=at; },{once:true}); AUD.play().catch(function(){ toast('재생이 막혔어요 — 한 번 더 눌러요'); });
      AUD.onended=function(){ var b=document.getElementById('ia-play'); if (b && !RUN.done) b.innerHTML=icon('check',16)+' 끝'; };
      return;
    }
    if (!('speechSynthesis' in window)){ toast('이 브라우저는 음성 재생이 안 돼요'); return; }
    stopSpeech(); R.played[R.cur]=true; render();
    var vmap=s.voices||{}, cast=castVoices(vmap);
    s.script.forEach(function(line){
      var u=new SpeechSynthesisUtterance(line.text), cfg=vmap[line.who]||{lang:'en-GB'}, v=cast[line.who];
      u.lang=cfg.lang||'en-GB'; if (v){ u.voice=v; u.lang=v.lang; } u.rate=cfg.rate||0.95; u.pitch=cfg.pitch||1;
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
      +'<select class="ia-in" id="ia-omr-src" style="height:30px;width:auto;background:#fff;color:#16161A">'+(['GT 21','GT 20','GT 22','GT 19','기타'].indexOf(O.src)<0?[O.src]:[]).concat(['GT 21','GT 20','GT 22','GT 19','기타']).map(function(x){return '<option '+(O.src===x?'selected':'')+'>'+esc(x)+'</option>';}).join('')+'</select>'
      +'<select class="ia-in" id="ia-omr-test" style="height:30px;width:auto;background:#fff;color:#16161A">'+[1,2,3,4].map(function(x){return '<option value="'+x+'" '+(+O.test===x?'selected':'')+'>Test '+x+'</option>';}).join('')+'</select>'
      +'<select class="ia-in" id="ia-omr-mock" style="height:30px;width:auto;background:#fff;color:#16161A"><option value="">연습</option>'+(plan().mocks||[]).map(function(m){return '<option value="'+m.n+'" '+(+O.mock===m.n?'selected':'')+'>모의고사 #'+m.n+'</option>';}).join('')+'</select>'
      +'<span style="margin-left:auto"></span><button class="ia-btn" data-act="omr-exit">닫기</button>'+(O.graded?'':'<button class="ia-btn" data-act="omr-start">'+icon(O.running?'pause':'timer',16)+' '+(O.running?'멈춤':'시간 재기')+'</button>')+'</div>'
      +(sc!=null?'<div class="ia-box" style="display:flex;gap:24px;align-items:center;margin-bottom:12px;flex-wrap:wrap"><div><div class="ia-k">SCORE</div><div class="ia-num" style="font-size:36px">'+sc+'<span style="font-size:18px;color:#5B5B66">/40</span></div></div><div><div class="ia-k">BAND</div><div class="ia-num" style="font-size:36px;color:'+bandColor(b)+'">'+fmtB(b)+'</div></div><div style="flex:1;min-width:200px">'+bar(sc,40,bandColor(b),12)+'</div></div>':'')
      +'<div class="ia-box"><div class="ia-k" style="margin-bottom:10px">MY ANSWERS</div><div class="ia-omr">'+cells+'</div></div>'
      +(O.graded?'':'<div class="ia-box" style="margin-top:12px"><div class="ia-k" style="margin-bottom:8px">ANSWER KEY — 책 정답 40개를 한 줄에 하나씩 (또는 "1 seaview" 형식) 붙여넣기 · 정답이 여러 개면 / 로 구분</div><textarea class="ia-in" id="ia-key" style="height:120px;padding:10px;font-size:13px" placeholder="1 Seaview\n2 0412 556 873\n3 Thursday/Thurs">'+esc(O.keyRaw||'')+'</textarea><div class="ia-row" style="margin-top:10px;justify-content:flex-end"><button class="ia-btn pri" data-act="omr-grade">'+icon('done_all',16)+' 채점</button></div></div>')
      +typeSel+(O.graded?'<div class="ia-row" style="margin-top:12px;justify-content:flex-end"><button class="ia-btn pri" data-act="omr-save">'+icon('save',16)+' 기록 저장</button></div>':'');
  }
  function O0link(srcName){ var tn=document.getElementById('ia-omr-test').value; return /^GT \d+$/.test(srcName)?srcName+' Test '+tn:srcName+(OMR.linkId?'':' · '+tn); }
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
    if (WS) return studyHtml();
    var tabs=subTabs('writing',[['model','모범답안 따라쓰기','content_copy'],['tpl','템플릿·표현','view_agenda'],['gram','문법','spellcheck'],['tips','요령','tips_and_updates'],['exam','시험처럼 쓰기','timer'],['grades','AI 채점'+(pendingN()?' '+pendingN():''),'grading']]);
    var sub=subOf('writing','model');
    if (sub==='model') return head('Writing','밴드 9 모범답안을 보고 → 따라 쓰고 → 기억해서 써보기')+tabs+modelList();
    if (sub==='tpl') return head('Writing','칸만 채우면 되는 틀 · 자주 쓰는 표현')+tabs+templatesHtml();
    if (sub==='gram') return head('Writing','7점 문법 — 틀린 문장 → 고친 문장')+tabs+grammarHtml();
    if (sub==='tips') return head('Writing','채점 기준 · 한국인이 자주 틀리는 것')+tabs+tipsHtml('W');
    if (sub==='grades') return head('Writing · Speaking','AI 채점 — 쓰고 요청하면 맥북이 구독으로 채점해서 몇 분 안에 여기 들어와요')+tabs+gradesHtml();
    var past=recsOf('writing');
    var t1=B.task1.map(function(p){ return '<button class="ia-tile" data-wt1="'+p.id+'"><span class="ia-tag">'+({formal:'격식',semi:'반격식',informal:'비격식'})[p.tone]+'</span><span class="s" style="color:#16161A;font-size:13px;line-height:1.5">'+esc(p.situation)+'</span></button>'; }).join('');
    var t2=B.task2.map(function(p){ return '<button class="ia-tile" data-wt2="'+p.id+'"><span class="ia-tag">'+({opinion:'의견형',discuss:'토론형',problem:'문제-해결',advdis:'장단점',twopart:'질문 2개'})[p.kind]+'</span><span class="s" style="color:#16161A;font-size:13px;line-height:1.5">'+esc(p.prompt)+'</span></button>'; }).join('');
    return head('Writing','실전처럼 타이핑 · 시간 · 단어 수 → 채점은 Claude 구독으로 0원', '<div class="ia-row"><button class="ia-btn" data-wrand="1">'+icon('shuffle',16)+' 편지 랜덤</button><button class="ia-btn pri" data-wrand="2">'+icon('shuffle',16)+' 에세이 랜덤</button><button class="ia-btn" data-wfree="1">'+icon('menu_book',16)+' 책 문제로</button></div>')
      +tabs+(past.length?'<div class="ia-box" style="margin-top:0;margin-bottom:16px">'+head('My Writing','밴드는 채점 받은 뒤 칸에 적기')+writingTable(past)+'</div>':'')
      +(window.IELTS_TOPICS&&window.IELTS_TOPICS.task2?'<div class="ia-k" style="margin:4px 0 10px;color:'+BAD+'">'+icon('local_fire_department',15)+' 최근 기출 · '+esc(window.IELTS_TOPICS.season||'')+'</div><div class="ia-pick" style="margin-bottom:20px">'+window.IELTS_TOPICS.task2.map(function(x,i){ return '<button class="ia-tile" data-wrecent="2|'+i+'" style="border-top:3px solid '+BAD+'"><div class="ia-row" style="justify-content:space-between"><span class="ia-tag">에세이 · '+esc(({opinion:'의견형',discuss:'토론형',problem:'문제-해결',advdis:'장단점',twopart:'질문 2개'})[x.kind]||x.kind)+'</span><span style="font-size:11px;color:#5B5B66">'+esc(x.date||'')+'</span></div><span class="s" style="color:#16161A;font-size:13px;line-height:1.5">'+esc(x.q)+'</span></button>'; }).join('')+(window.IELTS_TOPICS.task1||[]).map(function(x,i){ return '<button class="ia-tile" data-wrecent="1|'+i+'" style="border-top:3px solid '+BAD+'"><div class="ia-row" style="justify-content:space-between"><span class="ia-tag">편지 · '+esc(({formal:'격식',semi:'반격식',informal:'비격식'})[x.tone]||x.tone)+'</span><span style="font-size:11px;color:#5B5B66">'+esc(x.date||'')+'</span></div><span class="s" style="color:#16161A;font-size:13px;line-height:1.5">'+esc(x.situation)+'</span></button>'; }).join('')+'</div>':'')
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
  function mockWritingHtml(){
    var W=WR, M=MOCK, p=W.cur===1?M.t1:M.t2, prompt=W.cur===1?(p.situation+'\n\nIn your letter:\n'+p.bullets.map(function(b){return '• '+b;}).join('\n')):p.prompt, txt=W.mt[W.cur]||'', n=wc(txt), goal=W.cur===1?150:250;
    return mockBar()+'<div class="ia-timer"><span class="clock" id="ia-wclock">60:00</span>'
      +[1,2].map(function(k){ var nn=wc(W.mt[k]||''), g=k===1?150:250; return '<button class="ia-btn" data-act="mockw" data-t="'+k+'" style="'+(W.cur===k?'background:#fff;color:#16161A':'')+'">Task '+k+' · <span style="color:'+(nn>=g?'#4ade80':'#fca5a5')+'">'+nn+'</span>/'+g+'</button>'; }).join('')
      +'<span style="margin-left:auto;font-size:12px;opacity:.85">에세이 40분 → 편지 20분 권장</span><button class="ia-btn pri" data-act="mockfinish">'+icon('done_all',16)+' 시험 끝내기</button></div>'
      +'<div class="ia-split"><div><div class="ia-k" style="margin-bottom:8px">TASK '+W.cur+'</div><div style="white-space:pre-wrap;font-size:14.5px;line-height:1.65;padding:14px;background:#F8F8FA;border-left:3px solid '+ACC+';margin-bottom:12px">'+esc(prompt)+'</div>'
      +'<textarea class="ia-ta" id="ia-wtext" data-mockt="'+W.cur+'" spellcheck="false" autocorrect="off" autocapitalize="off">'+esc(txt)+'</textarea><div class="ia-num" id="ia-wc" style="margin-top:6px;font-size:13px">'+n+' / '+goal+' words</div></div>'
      +'<div><div class="ia-k" style="margin-bottom:8px">실전 규칙</div>'+['맞춤법 자동 고침 없음 — 철자도 채점','단어 수는 화면 아래에 표시','시간 끝나면 자동 제출','Task 2 가 점수 비중 2배'].map(function(x){return '<div style="padding:6px 0;border-bottom:1px solid #ECECF0;font-size:13px">'+esc(x)+'</div>';}).join('')+'</div></div>';
  }
  async function answerWrong(key, val){
    var p=key.split('|'), rec=ST.records.find(function(r){return r._id===p[0];}); if (!rec) return; var w=rec.wrong[+p[1]];
    WRONG.ans[key]=val; var x=wrongList().find(function(z){return z.rec._id===p[0] && z.i===+p[1];});
    if (x && isRight(val,x.q.answer)){ w.fixed=today(); await saveRecord(rec); toast('맞았어요 — 오답노트에서 뺐어요'); }
    var y=window.scrollY; render(); window.scrollTo(0,y);
  }
  async function finishMock(){
    var M=MOCK, W=WR; if (!M) return;
    for (var k=1;k<=2;k++){ var txt=W.mt[k]||'', p=k===1?M.t1:M.t2; if (!txt.trim()) continue;
      var prompt=k===1?(p.situation+'\n\nIn your letter:\n'+p.bullets.map(function(b){return '• '+b;}).join('\n')):p.prompt;
      var rec=await saveRecord({kind:'writing', date:today(), task:k, ref:p.id, prompt:prompt, text:txt, words:wc(txt), secs:Math.round((Date.now()-W.t0)/1000), band:null, mock:true});
      if (window.IELTS_GRADE){ try { await window.IELTS_GRADE.request({kind:'writing', task:k, prompt:prompt, text:txt, words:wc(txt), secs:rec.secs, ref:rec._id}); } catch(e){} } }
    M.res.W={pending:true}; M.step='done';
    await saveRecord({kind:'fullmock', date:today(), l:M.l, r:M.r, bands:{L:(M.res.L||{}).band, R:(M.res.R||{}).band}, secs:Math.round((Date.now()-M.t0)/1000)});
    WR=null; ST.view='home'; render();
    toast('실전 모의고사 끝 — 쓰기는 자동 채점 대기 중');
    MOCK=null;
  }
  function writingEditor(){
    if (WR && WR.mock) return mockWritingHtml();
    var W=WR, goal=W.task===1?150:250, n=wc(W.text), sweet=W.task===1?[160,190]:[260,300];
    var checks=[['task','과제 다 했나','bullet 3개 · 입장 일관'],['flow','문단 첫 문장만 읽어도 흐름이 보이나',''],['vocab','같은 단어 3번 이상 없나',''],['grammar','관사 · 복수 s · 시제','']];
    return '<div class="ia-timer"><span class="clock" id="ia-wclock">'+mmss(W.limit)+'</span><button class="ia-btn" data-act="wtime">'+icon(W.running?'pause':'play_arrow',16)+' '+(W.running?'멈춤':'시작')+'</button>'
      +'<div style="flex:1;min-width:140px;display:flex;align-items:center;gap:8px"><div class="ia-bar" style="height:8px;flex:1;background:rgba(255,255,255,.2)"><i id="ia-wbar" style="width:'+Math.min(100,n/sweet[1]*100)+'%;background:'+(n>=goal?'#4ade80':'#fca5a5')+'"></i></div><span class="ia-num" id="ia-wc" style="font-size:14px">'+n+' / '+goal+'</span></div>'
      +'<button class="ia-btn" data-act="wexit">닫기</button>'+(window.IELTS_GRADE?'<button class="ia-btn" data-act="wgrade">'+icon('grading',16)+' AI 채점 요청</button>':'<button class="ia-btn" data-act="wcopy">'+icon('content_copy',16)+' 채점용 복사</button>')+'<button class="ia-btn pri" data-act="wsave">'+icon('save',16)+' 저장</button></div>'
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
      el.textContent=left>=0?mmss(left):'+'+mmss(-left); el.style.color=left<0?'#fca5a5':left<180?'#fde68a':'#fff'; if (WR.mock && left<=0){ clearInterval(ST.timers.w); finishMock(); }
    },500);
  }

  // ════════ AI 채점 목록 (js/ielts-grade.js — 맥북 launchd 가 구독으로 채점) ════════
  function pendingN(){ return (ST.grades||[]).filter(function(g){return g.status==='pending'||g.status==='grading';}).length; }
  function gradesHtml(){
    if (!window.IELTS_GRADE) return '<div class="ia-empty">채점 모듈을 불러오는 중이에요</div>';
    var G=(ST.grades||[]).slice().sort(function(a,b){return (b.createdAt||'').localeCompare(a.createdAt||'');});
    if (!G.length) return '<div class="ia-empty">'+icon('grading',28)+'<br>아직 채점한 글이 없어요<br><span style="font-size:12px">시험처럼 쓰기에서 쓴 뒤 <b>AI 채점 요청</b> · 말하기는 Part 2 끝나고 <b>채점 요청</b><br>맥북 크롬에 이 사이트가 열려 있으면 5분 안에 채점돼요</span></div>';
    var done=G.filter(function(g){return g.status==='done'&&g.result;}).slice(0,10).reverse();
    var trend=done.length>1?'<div class="ia-box" style="margin-bottom:14px"><div class="ia-k" style="margin-bottom:8px">최근 채점 밴드</div><div style="display:flex;align-items:flex-end;gap:6px;height:90px">'+done.map(function(g){ var b=+g.result.band; return '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px"><span class="ia-num" style="font-size:12px;color:'+bandColor(b)+'">'+fmtB(b)+'</span><div style="width:100%;height:'+Math.max(6,(b-3)/6*70)+'px;background:'+bandColor(b)+'"></div><span style="font-size:10px;color:#5B5B66">'+(g.kind==='speaking'?'S':'T'+g.task)+'</span></div>'; }).join('')+'</div></div>':'';
    return trend+G.map(function(g){ var open=ST.gopen===g._id;
      return '<div class="ia-box" style="margin-bottom:8px;padding:0"><button data-act="gopen" data-id="'+esc(g._id)+'" style="width:100%;display:grid;grid-template-columns:auto 1fr auto;gap:12px;align-items:center;padding:12px 14px;text-align:left">'
        +'<span class="ia-tag" style="'+(g.kind==='speaking'?'background:#FEF3C7;color:#92400E':'')+'">'+(g.kind==='speaking'?'말하기 P'+(g.part||2):+g.task===1?'편지':'에세이')+'</span>'
        +'<span style="font-size:13px;font-family:Arial,Helvetica,sans-serif;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+esc(String(g.prompt||'').slice(0,90))+'</span>'
        +'<span class="ia-row" style="gap:8px">'+window.IELTS_GRADE.renderStatus(g)+icon(open?'expand_less':'expand_more',18)+'</span></button>'
        +(open&&g.status==='done'?'<div style="border-top:1px solid #ECECF0;padding:14px">'+window.IELTS_GRADE.renderResult(g)+'</div>':'')+'</div>'; }).join('');
  }

  // ════════ 받아쓰기 (음성 파일 줄 단위) ════════
  var DICT=null, DAUD=null;
  function dictHtml(){
    var A=window.IELTS_AUDIO||{}, L=bank().listening.filter(function(s){return A[s.id];});
    if (!DICT) return '<div class="ia-pick">'+L.map(function(s){ var done=ST.records.filter(function(r){return r.kind==='dict'&&r.ref===s.id;}), best=done.reduce(function(m,r){return Math.max(m,r.acc||0);},0);
      return '<button class="ia-tile" data-dict="'+s.id+'"><span class="ia-tag">'+s.test+' · S'+s.section+'</span><span class="t">'+esc(s.title)+'</span><span class="s">'+s.script.length+'줄 · '+mmss(A[s.id].dur)+'</span>'+bar(best,100,best>=90?OK:best>=75?MID:'#DCDCE3',5)+'<span class="s" style="font-weight:700">'+(done.length?'최고 '+best+'%':'아직 안 해봄')+'</span></button>'; }).join('')+'</div>';
    var s=bank().listening.find(function(x){return x.id===DICT.sid;}), line=s.script[DICT.i], mine=DICT.inputs[DICT.i]||'', chk=DICT.checked[DICT.i];
    var acc=chk?lineAcc(line.text,mine):null, totalAcc=dictTotal(s);
    return '<div class="ia-timer" style="position:static"><button class="ia-btn" data-act="dictclose">'+icon('arrow_back',16)+' 목록</button><b style="font-size:13px">'+esc(s.title)+'</b><span style="margin-left:auto;font-size:12px">'+(DICT.i+1)+' / '+s.script.length+'줄 · 평균 '+totalAcc+'%</span></div>'
      +'<div class="ia-box" style="max-width:860px">'
        +'<div class="ia-row" style="gap:3px;margin-bottom:14px">'+s.script.map(function(l,i){ var c=DICT.checked[i]?lineAcc(l.text,DICT.inputs[i]||''):null; return '<button data-dline="'+i+'" style="flex:1;min-width:10px;height:10px;background:'+(c==null?(i===DICT.i?'#16161A':'#ECECF0'):c>=90?OK:c>=70?MID:BAD)+'"></button>'; }).join('')+'</div>'
        +'<div class="ia-row" style="gap:8px;margin-bottom:12px"><button class="ia-btn pri" data-act="dplay">'+icon('play_arrow',18)+' 이 줄 듣기</button><button class="ia-btn" data-act="dslow">'+icon('slow_motion_video',16)+' '+(DICT.slow?'0.75배':'보통 속도')+'</button><span style="font-size:12px;color:#5B5B66">화자 '+esc(line.who)+' · 몇 번이든 다시 들어도 돼요 · Enter = 확인</span></div>'
        +'<textarea class="ia-ta" id="ia-dict" spellcheck="false" autocorrect="off" autocapitalize="off" style="min-height:90px;font-size:16px" '+(chk?'disabled':'')+'>'+esc(mine)+'</textarea>'
        +(chk?'<div style="margin-top:12px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.8;padding:10px 12px;background:#F8F8FA">'+diffHtml(line.text,mine)+'</div><div class="ia-row" style="justify-content:space-between;margin-top:10px"><span class="ia-num" style="font-size:22px;color:'+(acc>=90?OK:acc>=70?MID:BAD)+'">'+acc+'%</span><div class="ia-row" style="gap:6px"><button class="ia-btn" data-act="dretry">'+icon('refresh',16)+' 다시</button><button class="ia-btn pri" data-act="dnext">다음 줄 '+icon('arrow_forward',16)+'</button></div></div>'
             :'<div class="ia-row" style="justify-content:flex-end;margin-top:10px"><button class="ia-btn" data-act="dskip">모르겠어요</button><button class="ia-btn pri" data-act="dcheck">확인</button></div>')
      +'</div>';
  }
  function lineAcc(model, mine){ var M=words(model).map(wnorm), U=words(mine).map(wnorm); return M.length?Math.round(lcs(M,U)[0][0]/M.length*100):0; }
  function dictTotal(s){ var ks=Object.keys(DICT.checked); if (!ks.length) return 0; return Math.round(ks.reduce(function(a,i){ return a+lineAcc(s.script[i].text, DICT.inputs[i]||''); },0)/ks.length); }
  function playLine(){
    var s=bank().listening.find(function(x){return x.id===DICT.sid;}), au=(window.IELTS_AUDIO||{})[s.id]; if (!au) return;
    var st=au.lines[DICT.i].t, en=au.lines[DICT.i+1]?au.lines[DICT.i+1].t-0.35:au.dur;
    if (!DAUD || DAUD._sid!==s.id){ DAUD=new Audio(au.file); DAUD._sid=s.id; }
    DAUD.playbackRate=DICT.slow?0.75:1; DAUD.ontimeupdate=function(){ if (DAUD.currentTime>=en) DAUD.pause(); };
    var go=function(){ DAUD.currentTime=st; DAUD.play().catch(function(){}); };
    if (DAUD.readyState>=1) go(); else DAUD.addEventListener('loadedmetadata',go,{once:true});
  }

  // ════════ 유형 드릴 (Read 글로 만든 IELTS 문제) ════════
  var DRILL={arts:null, type:null};
  async function loadDrillArts(){
    if (DRILL.arts) return; DRILL.arts=[];
    try { var idx=await (await fetch('data/read/index.json?t='+today())).json();
      var all=await Promise.all((idx.items||[]).slice(0,30).map(function(it){ return fetch(it.file).then(function(r){return r.json();}).catch(function(){return null;}); }));
      DRILL.arts=all.filter(function(a){ return a && a.ielts && a.ielts.questions && a.ielts.questions.length; });
    } catch(e){}
    if (ST.view==='reading') render();
  }
  function drillHtml(){
    if (!DRILL.arts){ loadDrillArts(); return '<div class="ia-empty">문제를 불러오는 중이에요</div>'; }
    if (!DRILL.arts.length) return '<div class="ia-empty">아직 드릴 문제가 없어요 — 매일 아침 Read 글과 함께 생겨요</div>';
    var cnt={}; DRILL.arts.forEach(function(a){ a.ielts.questions.forEach(function(q){ cnt[q.type]=(cnt[q.type]||0)+1; }); });
    var types=TYPES.R.filter(function(t){return cnt[t[0]];}).sort(function(a,b){ return (ST.weak[b[0]]||0)-(ST.weak[a[0]]||0); });
    var tiles=types.map(function(t,i){ var w=ST.weak[t[0]]||0;
      return '<button class="ia-tile" data-drill="'+t[0]+'" style="'+(i===0&&w?'border:2px solid '+BAD:'')+'"><div class="ia-row" style="justify-content:space-between"><span class="t">'+esc(t[1])+'</span>'+(w?'<span class="ia-tag" style="background:#FEE2E2;color:#991B1B">틀린 '+w+'</span>':'')+'</div><span class="s">'+cnt[t[0]]+'문제 · 글 '+DRILL.arts.filter(function(a){return a.ielts.questions.some(function(q){return q.type===t[0];});}).length+'개</span>'+(i===0&&w?'<span class="s" style="color:'+BAD+';font-weight:800">제일 약한 유형 — 여기부터</span>':'')+'</button>'; }).join('');
    var mix='<button class="ia-tile" data-drill="all" style="border-top:3px solid #16161A"><span class="t">글 한 편 통째로</span><span class="s">S3 처럼 13문제 섞어서 · 20분</span></button>';
    return '<div class="ia-pick">'+mix+tiles+'</div>';
  }
  function startDrill(type){
    var arts=DRILL.arts.filter(function(a){ return type==='all' || a.ielts.questions.some(function(q){return q.type===type;}); });
    var done=ST.records.filter(function(r){return r.custom;}).map(function(r){return r.ref;});
    arts.sort(function(a,b){ return (done.indexOf('drill-'+a.id)>=0?1:0)-(done.indexOf('drill-'+b.id)>=0?1:0); });
    var a=arts[0]; if (!a) return;
    var qs=a.ielts.questions.filter(function(q){ return type==='all' || q.type===type; });
    var sec={id:'drill-'+a.id, section:'D', title:a.title, src:a.id, passage:a.paras.map(function(t,i){ return {label:String(i+1), text:t}; }), questions:qs};
    startCustomRun('R',[sec],a.title, type==='all'?20*60:Math.max(4,Math.round(qs.length*1.5))*60); RUN.drillType=type;
  }

  // ════════ 오답노트 ════════
  function wrongList(){
    var out=[]; ST.records.forEach(function(r){ (r.wrong||[]).forEach(function(w,i){ if (w.fixed) return;
      var area=r.kind==='listening'?'L':'R', sec=(area==='L'?bank().listening:bank().reading).find(function(s){return s.id===w.sid;}), q=sec&&sec.questions.find(function(x){return x.n===w.n;});
      if (q) out.push({rec:r, i:i, w:w, q:q, sec:sec, area:area}); }); });
    return out;
  }
  var WRONG={open:{}, ans:{}};
  function wrongHtml(){
    var L=wrongList();
    if (!L.length) return '<div class="ia-empty">'+icon('task_alt',28)+'<br>남은 오답이 없어요 — 문제를 풀면 틀린 것만 여기 모여요</div>';
    var by={}; L.forEach(function(x){ (by[x.q.type]=by[x.q.type]||[]).push(x); });
    return Object.keys(by).sort(function(a,b){return by[b].length-by[a].length;}).map(function(tp){
      return '<div class="ia-k" style="margin:4px 0 8px">'+esc(typeName(tp))+' · '+by[tp].length+'</div><div class="ia-pick" style="grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:8px;margin-bottom:18px">'+by[tp].map(function(x){ var key=x.rec._id+'|'+x.i, my=WRONG.ans[key], tried=my!=null, ok=tried&&isRight(my,x.q.answer);
        var ctx=x.area==='R'?'':'';
        var inp=x.q.options?'<div class="ia-opts'+(x.q.options.some(function(o){return String(o).length>6;})?' long':'')+'">'+x.q.options.map(function(o){ var tk=optTok(o); return '<button data-wans="'+esc(key)+'|'+esc(tk)+'" class="'+(tried&&norm(my)===norm(tk)?'on':'')+'">'+esc(o)+'</button>'; }).join('')+'</div>'
          :'<div class="ia-row" style="margin-top:6px"><input class="ia-in" data-wtxt="'+esc(key)+'" style="max-width:220px;height:30px"><button class="ia-btn sm" data-wchk="'+esc(key)+'">확인</button></div>';
        return '<div class="ia-box" style="padding:12px;border-left:3px solid '+(ok?OK:BAD)+'"><div class="ia-row" style="justify-content:space-between"><span class="ia-tag">'+x.area+' · '+esc(x.sec.title.slice(0,28))+'</span><span style="font-size:11px;color:#5B5B66">'+esc(x.rec.date)+'</span></div>'
          +'<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;margin:8px 0 2px">'+esc(String(x.q.q).replace(/^\[[^\]]+\][\s\S]*? — /,''))+'</div><div style="font-size:12px;color:'+BAD+'">내 답: '+esc(x.w.given||'(빈칸)')+'</div>'+inp
          +(tried?'<div style="font-size:12.5px;margin-top:6px;font-weight:700;color:'+(ok?OK:BAD)+'">'+(ok?'맞았어요 — 노트에서 빠져요':'정답 '+esc(Array.isArray(x.q.answer)?x.q.answer[0]:x.q.answer))+' <span style="color:#5B5B66;font-weight:500">'+esc(x.q.why||'')+'</span></div>':'')+'</div>'; }).join('')+'</div>'; }).join('');
  }

  // ════════ WRITING STUDY — 모범답안 보기 · 따라 쓰기 · 기억해서 쓰기 ════════
  function model(){ return window.IELTS_MODEL || {answers:{}, templates:[], phrases:[], grammar:[]}; }
  var ROLE={greeting:['인사','#5B5B66'],purpose:['목적','#1F4BD8'],b1:['①','#0f766e'],b2:['②','#0f766e'],b3:['③','#0f766e'],close:['마무리','#a16207'],signoff:['끝인사','#5B5B66'],intro:['서론','#1F4BD8'],body1:['본론 1','#0f766e'],body2:['본론 2','#0f766e'],conclusion:['결론','#a16207']};
  var TAGC={vocab:['#EEF2FD','#1A3FB5','어휘'],grammar:['#DCFCE7','#166534','문법'],linking:['#FEF3C7','#92400E','연결'],tone:['#FCE7F3','#9D174D','톤']};
  var WS=null; // {id, task, mode:'view'|'copy'|'recall', pi, typed:{}, recall:{}, checked:{}, t0}
  function promptOf(id){ var B=bank().writing||{task1:[],task2:[]}; var p=B.task1.find(function(x){return x.id===id;}); if (p) return {task:1,p:p,text:p.situation+'\n\nIn your letter:\n'+p.bullets.map(function(b){return '• '+b;}).join('\n')}; p=B.task2.find(function(x){return x.id===id;}); return p?{task:2,p:p,text:p.prompt}:null; }
  function modelList(){
    var B=bank().writing||{task1:[],task2:[]}, A=model().answers;
    if (!Object.keys(A).length) return '<div class="ia-empty">모범답안을 불러오는 중이에요</div>';
    function tile(p,task){ var a=A[p.id], n=ST.records.filter(function(r){return r.kind==='copy'&&r.ref===p.id;}), best=n.reduce(function(m,r){return Math.max(m,r.acc||0);},0);
      var lab=task===1?({formal:'격식',semi:'반격식',informal:'비격식'})[p.tone]:({opinion:'의견형',discuss:'토론형',problem:'문제-해결',advdis:'장단점',twopart:'질문 2개'})[p.kind];
      return '<button class="ia-tile" data-wstudy="'+p.id+'" '+(a?'':'disabled style="opacity:.5"')+'><div class="ia-row" style="justify-content:space-between"><span class="ia-tag">'+lab+'</span>'+(a?'<span class="ia-tag" style="background:#16161A;color:#fff">BAND '+a.band+' · '+a.words+'w</span>':'')+'</div>'
        +'<span class="s" style="color:#16161A;font-size:13px;line-height:1.5">'+esc(task===1?p.situation:p.prompt)+'</span>'
        +'<div style="margin-top:auto;padding-top:6px">'+bar(best,100,best>=95?OK:best>=80?MID:'#DCDCE3',5)+'<div style="font-size:11.5px;font-weight:700;color:#5B5B66;margin-top:4px">'+(n.length?'연습 '+n.length+'회 · 최고 '+best+'%':'아직 안 써봄')+'</div></div></button>'; }
    return '<div class="ia-k" style="margin:4px 0 10px">TASK 1 · 편지</div><div class="ia-pick" style="margin-bottom:22px">'+B.task1.map(function(p){return tile(p,1);}).join('')+'</div>'
      +'<div class="ia-k" style="margin:4px 0 10px">TASK 2 · 에세이</div><div class="ia-pick">'+B.task2.map(function(p){return tile(p,2);}).join('')+'</div>';
  }
  async function finishCopy(a){ if (WS._saved) return; WS._saved=true; var tot=0, acc=0; a.paras.forEach(function(p,i){ var w=words(p.text).length; tot+=w; acc+=copyAcc(p.text,WS.typed[i]||'')*w; }); await saveRecord({kind:'copy', date:today(), ref:WS.id, mode:'copy', acc:Math.round(acc/Math.max(tot,1)), secs:Math.round((Date.now()-WS.t0)/1000)}); toast('따라 쓰기 끝 — 이제 기억해서 써봐요'); WS.mode='recall'; WS.pi=0; }
  function words(t){ return String(t||'').trim().split(/\s+/).filter(Boolean); }
  function wnorm(w){ return w.toLowerCase().replace(/[^a-z0-9']/g,''); }
  function markKeys(text, keys){
    var h=esc(text);
    (keys||[]).forEach(function(k,i){ var t=esc(k.t), c=TAGC[k.tag]||TAGC.vocab; var idx=h.indexOf(t); if (idx<0) return;
      h=h.slice(0,idx)+'<mark data-key="'+i+'" title="'+esc(k.ko)+'" style="background:'+c[0]+';color:'+c[1]+';padding:0 2px;font-weight:700">'+t+'</mark>'+h.slice(idx+t.length); });
    return h.replace(/\n/g,'<br>');
  }
  function studyHtml(){
    var W=WS, a=model().answers[W.id], pr=promptOf(W.id); if (!a||!pr) { WS=null; return viewWriting(); }
    var modes=[['view','보기','visibility'],['copy','따라 쓰기','keyboard'],['recall','기억해서 쓰기','psychology']];
    var top='<div class="ia-timer" style="position:static"><button class="ia-btn" data-act="wsclose">'+icon('arrow_back',16)+' 목록</button>'
      +modes.map(function(m){ return '<button class="ia-btn" data-wmode="'+m[0]+'" style="'+(W.mode===m[0]?'background:#fff;color:#16161A':'')+'">'+icon(m[2],16)+' '+m[1]+'</button>'; }).join('')
      +'<span style="margin-left:auto;font-size:12px;font-weight:700;opacity:.85">BAND '+a.band+' · '+a.words+' words</span></div>';
    var promptBox='<div style="white-space:pre-wrap;font-size:14px;line-height:1.6;padding:12px 14px;background:#F8F8FA;border-left:3px solid '+ACC+';margin-bottom:14px">'+esc(pr.text)+'</div>';
    var body;
    if (W.mode==='view'){
      body='<div class="ia-split"><div>'+promptBox+a.paras.map(function(p){ var r=ROLE[p.role]||[p.role,'#5B5B66'];
          return '<div style="display:grid;grid-template-columns:64px 1fr;gap:12px;padding:10px 0;border-bottom:1px solid #ECECF0"><span style="font-size:11.5px;font-weight:800;color:'+r[1]+';border-top:3px solid '+r[1]+';padding-top:4px;height:fit-content">'+r[0]+'</span><div style="font-family:Arial,Helvetica,sans-serif;font-size:15.5px;line-height:1.75">'+markKeys(p.text,a.keys)+'</div></div>'; }).join('')+'</div>'
        +'<div><div class="ia-k" style="margin-bottom:10px">KEY PHRASES · 점수 올리는 표현</div>'+(a.keys||[]).map(function(k){ var c=TAGC[k.tag]||TAGC.vocab;
          return '<div style="padding:9px 0;border-bottom:1px solid #ECECF0"><div class="ia-row" style="gap:6px;align-items:baseline"><span class="ia-tag" style="background:'+c[0]+';color:'+c[1]+'">'+c[2]+'</span><b style="font-size:13.5px">'+esc(k.t)+'</b></div><div style="font-size:12.5px;color:#5B5B66;margin-top:3px">'+esc(k.ko)+'</div><button class="ia-btn sm" data-kcard="'+esc(k.t)+'|'+esc(k.ko)+'" style="margin-top:6px">'+icon('add',14)+' 카드</button></div>'; }).join('')+'</div></div>';
    } else if (W.mode==='copy'){
      var p=a.paras[W.pi], r=ROLE[p.role]||[p.role,'#5B5B66'], typed=W.typed[W.pi]||'';
      body='<div class="ia-box">'+progressDots(a)+'<div class="ia-row" style="gap:8px;margin:14px 0 8px"><span style="font-size:12px;font-weight:800;color:'+r[1]+'">'+r[0]+'</span><span style="font-size:12px;color:#5B5B66">회색 글자를 그대로 따라 쳐요 · 맞으면 초록, 틀리면 빨강</span></div>'
        +'<div id="ia-cp-ghost" style="font-family:Arial,Helvetica,sans-serif;font-size:18px;line-height:1.9;padding:14px;background:#F8F8FA;min-height:90px">'+copyGhost(p.text, typed)+'</div>'
        +'<textarea class="ia-ta" id="ia-cp" spellcheck="false" autocorrect="off" autocapitalize="off" style="min-height:120px;margin-top:10px" placeholder="여기에 따라 쓰기">'+esc(typed)+'</textarea>'
        +'<div class="ia-row" style="justify-content:space-between;margin-top:10px"><button class="ia-btn" data-wpara="-1">'+icon('chevron_left',16)+' 이전</button><span class="ia-num" id="ia-cp-acc" style="font-size:14px"></span><button class="ia-btn pri" data-wpara="1">다음 '+icon('chevron_right',16)+'</button></div></div>';
    } else {
      var all=a.paras.map(function(p,i){ var r=ROLE[p.role]||[p.role,'#5B5B66'], mine=W.recall[i]||'', chk=W.checked;
        return '<div style="display:grid;grid-template-columns:64px 1fr;gap:12px;padding:12px 0;border-bottom:1px solid #ECECF0"><span style="font-size:11.5px;font-weight:800;color:'+r[1]+';border-top:3px solid '+r[1]+';padding-top:4px;height:fit-content">'+r[0]+'</span><div>'
          +(chk?'<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.8">'+diffHtml(p.text, mine)+'</div>'
               :'<div style="font-size:12px;color:#8A8A95;margin-bottom:4px">힌트: '+esc(words(p.text).slice(0,3).join(' '))+' …</div><textarea class="ia-ta" data-rc="'+i+'" spellcheck="false" style="min-height:'+(p.text.length>200?110:56)+'px;font-size:15px">'+esc(mine)+'</textarea>')+'</div></div>'; }).join('');
      var sc=W.checked?recallScore(a):null;
      body=promptBox+'<div class="ia-box">'+(sc!=null?'<div class="ia-row" style="gap:20px;margin-bottom:10px"><div><div class="ia-k">기억한 단어</div><div class="ia-num" style="font-size:32px;color:'+(sc>=80?OK:sc>=60?MID:BAD)+'">'+sc+'%</div></div><div style="font-size:12.5px;color:#5B5B66;line-height:1.7"><span style="background:#DCFCE7;color:#166534;padding:0 4px;font-weight:700">맞음</span> <span style="background:#FEE2E2;color:#991B1B;padding:0 4px;font-weight:700;text-decoration:line-through">빠짐</span> <span style="color:#B45309;font-weight:700">+ 내가 바꾼 말</span></div></div>':'')
        +all+'<div class="ia-row" style="justify-content:flex-end;margin-top:12px">'+(W.checked?'<button class="ia-btn" data-act="wsretry">'+icon('refresh',16)+' 다시</button>':'<button class="ia-btn pri" data-act="wscheck">'+icon('compare',16)+' 모범답안과 비교</button>')+'</div></div>';
    }
    return top+body;
  }
  function progressDots(a){ return '<div class="ia-row" style="gap:4px">'+a.paras.map(function(p,i){ var r=ROLE[p.role]||[p.role,'#5B5B66'], done=isCopyDone(p.text, WS.typed[i]); return '<button data-wpi="'+i+'" style="flex:1;min-width:34px;height:26px;font-size:11px;font-weight:800;border:'+(i===WS.pi?'2px solid #16161A':'1px solid #DCDCE3')+';background:'+(done?OK:'#fff')+';color:'+(done?'#fff':r[1])+'">'+r[0]+'</button>'; }).join('')+'</div>'; }
  function isCopyDone(model, typed){ return !!typed && words(typed).join(' ')===words(model).join(' '); }
  function copyGhost(model, typed){
    var m=words(model), t=words(typed), endsSpace=/\s$/.test(typed||'');
    return m.map(function(w,i){ var col='#9CA3AF', bg='';
      if (i<t.length){ var full=(i<t.length-1)||endsSpace; if (t[i]===w) col='#15803d'; else if (!full && w.indexOf(t[i])===0) { col='#16161A'; bg='#EEF2FD'; } else { col='#b91c1c'; bg='#FEE2E2'; } }
      else if (i===t.length) bg='#EEF2FD';
      return '<span style="color:'+col+';'+(bg?'background:'+bg+';':'')+'">'+esc(w)+'</span>'; }).join(' ');
  }
  function copyAcc(model, typed){ var m=words(model), t=words(typed); if (!t.length) return 0; var ok=0; t.forEach(function(w,i){ if (m[i]===w) ok++; }); return Math.round(ok/Math.max(t.length,1)*100); }
  function lcs(a,b){ var n=a.length,m=b.length,dp=[]; for (var i=0;i<=n;i++){ dp.push(new Array(m+1).fill(0)); } for (i=n-1;i>=0;i--) for (var j=m-1;j>=0;j--) dp[i][j]=a[i]===b[j]?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]); return dp; }
  function diffHtml(model, mine){
    var M=words(model), U=words(mine), a=M.map(wnorm), b=U.map(wnorm), dp=lcs(a,b), i=0,j=0, out=[];
    while (i<a.length && j<b.length){ if (a[i]===b[j]){ out.push('<span style="background:#DCFCE7;color:#166534">'+esc(M[i])+'</span>'); i++; j++; } else if (dp[i+1][j]>=dp[i][j+1]){ out.push('<span style="background:#FEE2E2;color:#991B1B;text-decoration:line-through">'+esc(M[i])+'</span>'); i++; } else { out.push('<span style="color:#B45309;font-weight:700">+'+esc(U[j])+'</span>'); j++; } }
    while (i<a.length){ out.push('<span style="background:#FEE2E2;color:#991B1B;text-decoration:line-through">'+esc(M[i])+'</span>'); i++; }
    while (j<b.length){ out.push('<span style="color:#B45309;font-weight:700">+'+esc(U[j])+'</span>'); j++; }
    return out.join(' ');
  }
  function recallScore(a){ var tot=0, hit=0; a.paras.forEach(function(p,i){ var M=words(p.text).map(wnorm), U=words(WS.recall[i]||'').map(wnorm); tot+=M.length; hit+=lcs(M,U)[0][0]; }); return tot?Math.round(hit/tot*100):0; }
  function templatesHtml(){
    var M=model(); if (!M.templates.length) return '<div class="ia-empty">불러오는 중이에요</div>';
    var tpl='<div class="ia-pick" style="grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:14px">'+M.templates.map(function(t){
      return '<div class="ia-box" style="padding:0"><div style="padding:12px 16px;background:#16161A;color:#fff;font-weight:800;font-size:14px" class="ia-row"><span class="ia-tag" style="background:'+(t.kind==='letter'?'#EEF2FD':'#FEF3C7')+';color:'+(t.kind==='letter'?'#1A3FB5':'#92400E')+'">'+(t.kind==='letter'?'편지':'에세이')+'</span>'+esc(t.label)+'</div>'
        +t.slots.map(function(sl){ var r=ROLE[sl.role]||[sl.role,'#5B5B66']; return '<div style="display:grid;grid-template-columns:56px 1fr;gap:10px;padding:9px 16px;border-top:1px solid #ECECF0"><span style="font-size:11px;font-weight:800;color:'+r[1]+'">'+r[0]+'</span><div><div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.55">'+esc(sl.en).replace(/___/g,'<span style="display:inline-block;min-width:44px;border-bottom:2px solid '+ACC+'">&nbsp;</span>')+'</div>'+(sl.ko?'<div style="font-size:11.5px;color:#5B5B66;margin-top:2px">'+esc(sl.ko)+'</div>':'')+'</div></div>'; }).join('')+'</div>'; }).join('')+'</div>';
    var ph='<div class="ia-box" style="margin-top:18px">'+head('Phrases','누르면 카드에 추가')+'<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:18px">'+M.phrases.map(function(g){
      return '<div><div class="ia-k" style="margin-bottom:8px;color:'+ACC+'">'+esc(g.group)+'</div>'+g.items.map(function(it){ return '<button data-kcard="'+esc(it.en)+'|'+esc(it.ko)+'" style="display:flex;justify-content:space-between;gap:10px;width:100%;text-align:left;padding:7px 8px;border:1px solid #ECECF0;margin-bottom:4px;background:#fff"><span style="font-family:Arial,Helvetica,sans-serif;font-size:13.5px">'+esc(it.en)+'</span><span style="font-size:11.5px;color:#5B5B66;white-space:nowrap">'+esc(it.ko)+'</span></button>'; }).join('')+'</div>'; }).join('')+'</div></div>';
    return tpl+ph;
  }
  function grammarHtml(){
    var G=model().grammar; if (!G.length) return '<div class="ia-empty">불러오는 중이에요</div>';
    return '<div class="ia-pick" style="grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:12px">'+G.map(function(g,i){
      return '<div class="ia-box" style="display:flex;flex-direction:column;gap:8px"><div class="ia-row" style="gap:8px"><span class="ia-num" style="font-size:20px;color:'+ACC+'">'+String(i+1).padStart(2,'0')+'</span><b style="font-size:15px">'+esc(g.title)+'</b></div>'
        +'<div style="font-size:12.5px;color:#5B5B66">'+esc(g.why)+'</div>'
        +'<div style="display:grid;grid-template-columns:22px 1fr;gap:6px;align-items:start;padding:8px 10px;background:#FEF2F2"><span style="color:'+BAD+'">'+icon('close',18)+'</span><span style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#7f1d1d;text-decoration:line-through;text-decoration-color:#fca5a5">'+esc(g.wrong)+'</span></div>'
        +'<div style="display:grid;grid-template-columns:22px 1fr;gap:6px;align-items:start;padding:8px 10px;background:#F0FDF4"><span style="color:'+OK+'">'+icon('check',18)+'</span><span style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#14532d;font-weight:600">'+esc(g.right)+'</span></div></div>'; }).join('')+'</div>';
  }

  // ════════ TIPS (공략) — 글 대신 단계 카드·표·예시 ════════
  function tips(){ return window.IELTS_TIPS || {}; }
  function factsRow(f){ return f&&f.length?'<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:0;border:1px solid #DCDCE3;margin-bottom:18px">'+f.map(function(x,i){ return '<div style="padding:14px 16px;'+(i?'border-left:1px solid #ECECF0':'')+'"><div class="ia-k">'+esc(x.k)+'</div><div style="font-size:16px;font-weight:800;margin-top:4px">'+esc(x.v)+'</div></div>'; }).join('')+'</div>':''; }
  function flowRow(f, title){ return f&&f.length?'<div class="ia-k" style="margin:0 0 10px">'+(title||'순서')+'</div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:0;margin-bottom:22px">'+f.map(function(x,i){ return '<div style="position:relative;padding:14px;border:1px solid #DCDCE3;'+(i?'border-left:0':'')+';background:#fff"><div class="ia-row" style="justify-content:space-between"><span class="material-symbols-outlined" style="font-size:26px;color:'+ACC+'">'+esc(x.icon||'arrow_forward')+'</span><span class="ia-num" style="font-size:22px;color:#ECECF0">'+(i+1)+'</span></div><div style="font-size:14px;font-weight:800;margin-top:8px">'+esc(x.title)+'</div><div style="font-size:12.5px;color:#5B5B66;margin-top:4px;line-height:1.5">'+esc(x.body)+'</div></div>'; }).join('')+'</div>':''; }
  function typeCards(ts){ return ts&&ts.length?'<div class="ia-k" style="margin:0 0 10px">문제 유형별</div><div class="ia-pick" style="grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:12px;margin-bottom:22px">'+ts.map(function(t){ var n=ST.weak[t.id]||0;
      return '<div class="ia-box" style="display:flex;flex-direction:column;gap:10px;padding:0"><div class="ia-row" style="justify-content:space-between;padding:12px 14px;border-bottom:1px solid #ECECF0"><b style="font-size:15px">'+esc(t.name)+'</b>'+(n?'<span class="ia-tag" style="background:#FEE2E2;color:#991B1B">내가 틀린 '+n+'</span>':'')+'</div>'
        +'<div style="padding:0 14px">'+(t.how||[]).map(function(h,i){ return '<div style="display:grid;grid-template-columns:22px 1fr;gap:6px;padding:4px 0;font-size:13px"><span class="ia-num" style="color:'+ACC+'">'+(i+1)+'</span><span>'+esc(h)+'</span></div>'; }).join('')+'</div>'
        +(t.trap?'<div style="margin:0 14px;padding:8px 10px;background:#FEF2F2;color:#7f1d1d;font-size:12.5px;display:flex;gap:6px">'+icon('warning',16)+'<span>'+esc(t.trap)+'</span></div>':'')
        +(t.ex?'<div style="margin:0 14px 14px;padding:10px;background:#F8F8FA;font-size:12.5px;line-height:1.6;font-family:Arial,Helvetica,sans-serif">'+(t.ex.text?'<div style="color:#5B5B66">“'+esc(t.ex.text)+'”</div>':'')+(t.ex.q?'<div><b>Q</b> '+esc(t.ex.q)+'</div>':'')+(t.ex.heard?'<div style="color:#5B5B66">'+icon('hearing',14)+' '+esc(t.ex.heard)+'</div>':'')+'<div style="color:'+OK+';font-weight:800">→ '+esc(t.ex.a)+'</div>'+(t.ex.why||t.ex.note?'<div style="color:#5B5B66;font-family:Pretendard,sans-serif">'+esc(t.ex.why||t.ex.note)+'</div>':'')+'</div>':'<div style="height:4px"></div>')
        +'</div>'; }).join('')+'</div>':''; }
  function trapList(tr){ return tr&&tr.length?'<div class="ia-k" style="margin:0 0 10px">함정</div><div class="ia-pick" style="grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:8px;margin-bottom:22px">'+tr.map(function(x){ return '<div style="border-left:3px solid '+BAD+';padding:8px 12px;background:#fff;border-top:1px solid #ECECF0;border-right:1px solid #ECECF0;border-bottom:1px solid #ECECF0"><div style="font-weight:800;font-size:13.5px">'+esc(x.name)+'</div>'+(x.en?'<div style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#7f1d1d;margin-top:3px">'+esc(x.en)+'</div>':'')+'<div style="font-size:12px;color:#5B5B66;margin-top:2px">'+esc(x.ko)+'</div></div>'; }).join('')+'</div>':''; }
  function chipList(items, title, k1, k2){ return items&&items.length?'<div class="ia-k" style="margin:0 0 10px">'+title+'</div><div class="ia-row" style="gap:6px;margin-bottom:22px">'+items.map(function(x){ return '<button data-kcard="'+esc(x[k1])+'|'+esc(x[k2])+'" style="border:1px solid #DCDCE3;background:#fff;padding:6px 10px;text-align:left"><div style="font-family:Arial,Helvetica,sans-serif;font-size:13.5px;font-weight:700">'+esc(x[k1])+'</div><div style="font-size:11.5px;color:#5B5B66">'+esc(x[k2])+'</div></button>'; }).join('')+'</div>':''; }
  function practiceCards(p){ return p&&p.length?'<div class="ia-k" style="margin:0 0 10px">실력 늘리는 연습</div><div class="ia-pick" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:8px;margin-bottom:22px">'+p.map(function(x){ return '<div class="ia-box" style="display:flex;gap:10px;align-items:flex-start;padding:12px"><span class="material-symbols-outlined" style="font-size:24px;color:'+ACC+'">'+esc(x.icon||'bolt')+'</span><div><div style="font-weight:800;font-size:13.5px">'+esc(x.title)+'</div><div style="font-size:12.5px;color:#5B5B66;margin-top:2px">'+esc(x.body)+'</div>'+(x.freq?'<span class="ia-tag" style="margin-top:6px">'+esc(x.freq)+'</span>':'')+'</div></div>'; }).join('')+'</div>':''; }
  function criteriaGrid(c){ return c&&c.length?'<div class="ia-k" style="margin:0 0 10px">채점 기준 4개 · 각 25%</div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px;margin-bottom:22px">'+c.map(function(x){ return '<div class="ia-box" style="padding:12px"><div style="font-weight:800;font-size:13.5px">'+esc(x.ko)+'</div><div style="font-size:11px;color:#8A8A95;margin-bottom:8px">'+esc(x.k)+'</div><div style="display:flex;gap:6px;font-size:12.5px;padding:5px 0;color:#14532d">'+icon('check',15)+'<span>'+esc(x['do'])+'</span></div><div style="display:flex;gap:6px;font-size:12.5px;padding:5px 0;color:#7f1d1d">'+icon('close',15)+'<span>'+esc(x.dont)+'</span></div></div>'; }).join('')+'</div>':''; }
  // 바꿔 말하기 사전 (js/ielts-para.js) — 묶음 카드, 오른쪽 가리기로 스스로 시험, + 누르면 카드
  function paraHtml(area){
    var P=(window.IELTS_PARA||{})[area]; if (!P) return '';
    var hide=!!(ST.paraHide||{})[area], total=P.groups.reduce(function(n,g){return n+g.pairs.length;},0);
    var headRow='<div class="ia-row" style="justify-content:space-between;margin:0 0 10px"><div class="ia-k">바꿔 말하기 · '+total+'쌍 <span style="font-weight:600;color:#5B5B66;letter-spacing:0">— '+esc(P.note)+'</span></div>'
      +'<button class="ia-btn sm" data-parahide="'+area+'" style="'+(hide?'background:#16161A;color:#fff;border-color:#16161A':'')+'">'+icon(hide?'visibility':'visibility_off',15)+' '+(hide?'다 보기':esc(P.b)+' 가리기')+'</button></div>';
    var cards='<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:10px;margin-bottom:24px">'+P.groups.map(function(g){
      return '<div class="ia-box" style="padding:0"><div class="ia-row" style="gap:8px;padding:10px 14px;border-bottom:1px solid #16161A"><span class="material-symbols-outlined" style="font-size:20px;color:'+ACC+'">'+esc(g.icon)+'</span><b style="font-size:14px">'+esc(g.name)+'</b><span style="margin-left:auto;font-size:11.5px;color:#5B5B66;font-weight:700">'+g.pairs.length+'</span></div>'
        +'<div style="display:grid;grid-template-columns:1fr 18px 1fr 22px;padding:6px 14px 4px;font-size:10.5px;font-weight:800;color:#8A8A95;letter-spacing:.04em"><span>'+esc(P.a)+'</span><span></span><span>'+esc(P.b)+'</span><span></span></div>'
        +g.pairs.map(function(pr){ return '<div style="display:grid;grid-template-columns:1fr 18px 1fr 22px;gap:4px;align-items:center;padding:6px 14px;border-top:1px solid #F1F1F4">'
          +'<span style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#5B5B66">'+esc(pr[0])+'</span><span style="color:'+ACC+';display:flex">'+icon('arrow_forward',15)+'</span>'
          +'<span class="ia-pb'+(hide?' hid':'')+'" style="font-family:Arial,Helvetica,sans-serif;font-size:13.5px;font-weight:800;color:#1A3FB5;cursor:'+(hide?'pointer':'default')+'">'+esc(pr[1])+'</span>'
          +'<button data-kcard="'+esc(pr[1])+'|'+esc(pr[0])+'" title="카드에 추가" style="color:#8A8A95;display:flex">'+icon('add_circle',16)+'</button></div>'; }).join('')+'</div>'; }).join('')+'</div>';
    return headRow+cards;
  }
  function officialHtml(area){
    var O=window.IELTS_OFFICIAL; if (!O) return '';
    var sets=area==='W'?[['writing1','Task 1 편지'],['writing2','Task 2 에세이']]:area==='S'?[['speaking','Speaking']]:[];
    if (!sets.length) return '';
    var cur=(ST.offSet||{})[area]||sets[0][0], set=O[cur]; if (!set) return '';
    var tg=sets.length>1?'<div class="ia-row" style="gap:0;border:1px solid #DCDCE3;width:fit-content">'+sets.map(function(x){ var on=cur===x[0]; return '<button data-offset="'+area+'|'+x[0]+'" style="height:28px;padding:0 12px;font-size:12px;font-weight:700;background:'+(on?'#16161A':'#fff')+';color:'+(on?'#fff':'#5B5B66')+'">'+x[1]+'</button>'; }).join('')+'</div>':'';
    var cards=set.criteria.map(function(c){
      var ladder=[9,8,7,6,5].map(function(b){ var hi=b===7||b===6; return '<div style="display:grid;grid-template-columns:30px 1fr;gap:8px;padding:5px 8px;'+(b===7?'background:#F0FDF4;':b===6?'background:#FEF2F2;':'')+'border-top:1px solid #F1F1F4"><span class="ia-num" style="font-size:13px;color:'+bandColor(b)+'">'+b+'</span><span style="font-size:12.5px;line-height:1.5;'+(hi?'font-weight:700':'color:#475569')+'">'+esc((c.bands||{})[b]||'')+'</span></div>'; }).join('');
      return '<div class="ia-box" style="padding:0"><div style="padding:10px 12px;border-bottom:1px solid #16161A"><b style="font-size:14px">'+esc(c.ko)+'</b> <span style="font-size:11px;color:#8A8A95">'+esc(c.name)+'</span></div>'
        +(c.gap67?'<div style="padding:10px 12px;background:#EEF2FD;color:#1A3FB5;font-size:13px;font-weight:700;display:flex;gap:6px">'+icon('trending_up',16)+'<span>6 → 7: '+esc(c.gap67)+'</span></div>':'')+ladder+'</div>'; }).join('');
    return '<div class="ia-row" style="justify-content:space-between;margin:0 0 10px"><div class="ia-k">공식 채점 기준 — 6점과 7점 차이가 핵심 <a href="'+esc(((O.sources||[])[0]||{}).url||'#')+'" target="_blank" rel="noopener" style="color:'+ACC+';font-weight:600">출처 ↗</a></div>'+tg+'</div>'
      +'<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:10px;margin-bottom:24px">'+cards+'</div>';
  }
  function tipsHtml(area){
    var T=tips()[area]; if (!T) return '<div class="ia-empty">공략을 불러오는 중이에요</div>';
    var h=factsRow(T.facts)+officialHtml(area)+paraHtml(area);
    if (area==='R' && T.timing){ var tot=T.timing.reduce(function(s,x){return s+x.min;},0); h+='<div class="ia-k" style="margin:0 0 10px">60분 나누기</div><div style="display:flex;margin-bottom:22px;border:1px solid #16161A">'+T.timing.map(function(x,i){ return '<div style="flex:'+x.min+';padding:12px;background:'+['#EEF2FD','#DBE4FB','#C7D5F8'][i%3]+';'+(i?'border-left:1px solid #16161A':'')+'"><div class="ia-row" style="justify-content:space-between"><b style="font-size:14px">'+esc(x.sec)+'</b><span class="ia-num" style="font-size:20px;color:'+ACC+'">'+x.min+'분</span></div><div style="font-size:12px;color:#5B5B66">'+esc(x.q||'')+' · '+esc(x.note||'')+'</div></div>'; }).join('')+'</div>'; }
    h+=flowRow(T.flow);
    if (T.levelup) h+='<div class="ia-k" style="margin:0 0 10px">S2 · S3 실력 키우기</div><div class="ia-2" style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px;margin-bottom:14px">'+T.levelup.map(function(g){ return '<div class="ia-box" style="padding:0"><div style="padding:10px 14px;background:#16161A;color:#fff;font-weight:800;font-size:14px">'+esc(g.sec)+' · '+esc(g.title)+'</div>'+g.items.map(function(x){ return '<div style="display:grid;grid-template-columns:28px 1fr;gap:8px;padding:9px 14px;border-top:1px solid #ECECF0"><span class="material-symbols-outlined" style="font-size:22px;color:'+ACC+'">'+esc(x.icon)+'</span><div><div style="font-size:13.5px;font-weight:800">'+esc(x.title)+'</div><div style="font-size:12.5px;color:#5B5B66">'+esc(x.body)+'</div></div></div>'; }).join('')+'</div>'; }).join('')+'</div>';
    if (false && T.paraTable) h+='<div class="ia-k" style="margin:0 0 10px">바꿔 말하기 표 — 문제를 풀고 나면 이렇게 적기</div><div class="ia-box" style="padding:0;margin-bottom:22px"><div class="ia-scroll"><table class="ia-t" style="min-width:520px"><tr><th>문제에 나온 말</th><th></th><th>지문에 나온 말</th><th>종류</th></tr>'+T.paraTable.map(function(x){ return '<tr><td style="font-family:Arial,Helvetica,sans-serif">'+esc(x.q)+'</td><td style="color:'+ACC+'">'+icon('sync_alt',16)+'</td><td style="font-family:Arial,Helvetica,sans-serif;font-weight:700">'+esc(x.p)+'</td><td><span class="ia-tag">'+esc(x.k)+'</span></td></tr>'; }).join('')+'</table></div></div>';
    if (T.skills) h+='<div class="ia-k" style="margin:0 0 10px">읽는 기술</div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:8px;margin-bottom:22px">'+T.skills.map(function(x){ return '<div class="ia-box" style="padding:12px;border-top:3px solid '+ACC+'"><div style="font-weight:800">'+esc(x.name)+' <span style="font-size:12px;color:#5B5B66;font-weight:600">'+esc(x.ko)+'</span></div><div style="font-size:13px;margin-top:6px">'+esc(x.how)+'</div><div style="font-size:12px;color:#5B5B66;margin-top:4px">'+icon('target',14)+' '+esc(x.when)+'</div></div>'; }).join('')+'</div>';
    if (area==='S' && T.parts) h+=criteriaGrid(T.criteria)+'<div class="ia-k" style="margin:0 0 10px">파트별 틀</div><div class="ia-grid" style="gap:14px;margin-bottom:22px">'+T.parts.map(function(p){
      return '<div class="ia-box ia-2" style="padding:0;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr)"><div style="padding:16px;border-right:1px solid #ECECF0"><div class="ia-row" style="gap:8px;margin-bottom:10px"><span style="background:#16161A;color:#fff;font-weight:800;font-size:13px;padding:3px 9px">PART '+p.part+'</span><span style="font-size:12.5px;color:#5B5B66;font-weight:700">'+esc(p.time)+'</span></div><div style="font-size:13px;margin-bottom:10px">'+esc(p.goal)+'</div>'
        +(p.frame||[]).map(function(f,i){ return '<div style="display:grid;grid-template-columns:56px 1fr;border:1px solid #DCDCE3;'+(i?'border-top:0':'')+'"><span style="background:#EEF2FD;color:'+ACC+';font-weight:800;font-size:12px;display:flex;align-items:center;justify-content:center;text-align:center;padding:4px">'+esc(f.label)+'</span><span style="padding:8px 10px;font-family:Arial,Helvetica,sans-serif;font-size:13.5px">'+esc(f.en)+'</span></div>'; }).join('')+'</div>'
        +'<div style="padding:16px;background:#FCFCFD">'+(p.ex?'<div style="font-size:12px;font-weight:800;color:#5B5B66;margin-bottom:6px">예시 답변</div><div style="font-family:Arial,Helvetica,sans-serif;font-size:13.5px;font-weight:700;margin-bottom:8px">Q. '+esc(p.ex.q)+'</div>'+(p.ex.full?'<div style="font-size:11.5px;color:#5B5B66;margin-bottom:6px">2분 풀버전 · '+words(p.ex.full.map(function(f){return f.en;}).join(' ')).length+'단어 — 소리 내 읽기 연습</div>'+p.ex.full.map(function(f){ return '<div style="display:grid;grid-template-columns:48px 1fr;gap:8px;padding:6px 0;border-bottom:1px solid #ECECF0"><span style="font-size:11px;font-weight:800;color:'+ACC+'">'+esc(f.label)+'</span><span style="font-family:Arial,Helvetica,sans-serif;font-size:13.5px;line-height:1.65">'+esc(f.en)+'</span></div>'; }).join(''):'<div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.7;padding:10px 12px;background:#fff;border-left:3px solid '+OK+'">'+esc(p.ex.a)+'</div>'):'')+'</div></div>'; }).join('')+'</div>';
    if (area==='W'){ h+=criteriaGrid(T.criteria);
      if (T.letter) h+='<div class="ia-k" style="margin:0 0 10px">편지 첫인사 ↔ 끝인사 짝</div><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:0;border:1px solid #DCDCE3;margin-bottom:22px">'+T.letter.map(function(x,i){ return '<div style="padding:12px 14px;'+(i?'border-left:1px solid #ECECF0':'')+'"><span class="ia-tag">'+esc(x.type)+'</span><div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;margin-top:8px">'+esc(x.open)+'</div><div style="color:'+ACC+';margin:2px 0">'+icon('south',16)+'</div><div style="font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:800">'+esc(x.close)+'</div></div>'; }).join('')+'</div>'; }
    h+=typeCards(T.types)+trapList(T.traps);
    if (T.koreanErrors) h+='<div class="ia-k" style="margin:0 0 10px">한국인이 자주 틀리는 것</div><div class="ia-pick" style="grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:8px;margin-bottom:22px">'+T.koreanErrors.map(function(x){ return '<div class="ia-box" style="padding:10px 12px"><b style="font-size:13px">'+esc(x.k)+'</b><div style="font-family:Arial,Helvetica,sans-serif;font-size:13.5px;color:#991B1B;text-decoration:line-through;margin-top:4px">'+esc(x.wrong)+'</div><div style="font-family:Arial,Helvetica,sans-serif;font-size:13.5px;color:#166534;font-weight:700">'+esc(x.right)+'</div></div>'; }).join('')+'</div>';
    h+=chipList(T.signposts,'다음 답이 나온다는 신호 · 누르면 카드에','en','ko');
    if (T.fillers) h+=chipList(T.fillers,'생각할 시간 버는 말 · 누르면 카드에','en','use');
    if (T.upgrades) h+='<div class="ia-k" style="margin:0 0 10px">한 단계 위 표현</div><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:6px;margin-bottom:22px">'+T.upgrades.map(function(x){ return '<button data-kcard="'+esc(x.better)+'|'+esc(x.ko||x.basic)+'" style="display:grid;grid-template-columns:1fr 20px 1fr;align-items:center;gap:6px;padding:8px 10px;border:1px solid #ECECF0;background:#fff;text-align:left"><span style="font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#8A8A95;text-decoration:line-through">'+esc(x.basic)+'</span><span style="color:'+ACC+'">'+icon('arrow_forward',16)+'</span><span style="font-family:Arial,Helvetica,sans-serif;font-size:13.5px;font-weight:800;color:'+ACC+'">'+esc(x.better)+'</span></button>'; }).join('')+'</div>';
    if (T.pron) h+='<div class="ia-k" style="margin:0 0 10px">발음</div><div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px;margin-bottom:22px">'+T.pron.map(function(x){ return '<div class="ia-box" style="padding:10px 12px"><b style="font-size:13px">'+esc(x.k)+'</b><div style="font-size:12.5px;color:#5B5B66;margin-top:3px">'+esc(x.tip)+'</div></div>'; }).join('')+'</div>';
    h+=practiceCards(T.practice);
    if (T.src&&T.src.length) h+='<div style="font-size:11.5px;color:#5B5B66;margin-top:-8px">출처: '+T.src.map(function(x){ return '<a href="'+esc(x.url)+'" target="_blank" rel="noopener" style="color:'+ACC+'">'+esc(x.name)+'</a>'; }).join(' · ')+'</div>';
    return h;
  }

  // ════════ SPEAKING ════════
  var SP={part:2, card:null, phase:'idle', t0:0, rec:null, chunks:[], url:null, p1:null};
  function viewSpeaking(){
    var B=bank().speaking||{part1:[],part2:[]};
    var TP=window.IELTS_TOPICS; if (SP.src==null) SP.src=TP&&TP.part2&&TP.part2.length?'season':'bank';
    var P2=SP.src==='season'&&TP?TP.part2:B.part2, P1=SP.src==='season'&&TP&&TP.part1?TP.part1:B.part1;
    if (!SP.card && P2.length) SP.card=P2[Math.floor(Math.random()*P2.length)];
    if (!SP.p1 && P1.length) SP.p1=P1[Math.floor(Math.random()*P1.length)];
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
      +(SP.phase==='done'?'<div class="ia-box" style="margin-top:16px">'+head('내가 한 말 (자동 받아쓰기)', SP.transcript?words(SP.transcript).length+'단어 · '+mmss(SP.secs||0)+' — 받아쓰기라 발음은 대략만':'받아쓴 내용이 없어요 — 마이크 권한을 확인해요', (window.IELTS_GRADE&&SP.transcript?'<button class="ia-btn '+(SP.graded?'':'pri')+'" data-act="sgrade" '+(SP.graded?'disabled':'')+'>'+icon('grading',16)+' '+(SP.graded?'요청함':'채점 요청')+'</button>':''))
        +(SP.transcript?'<div style="font-family:Arial,Helvetica,sans-serif;font-size:14.5px;line-height:1.7">'+esc(SP.transcript)+'</div>':'')+'</div>':'')
      +(SP.phase==='done'&&c.part3?'<div class="ia-box" style="margin-top:16px">'+head('Part 3 · 이어서 토론','이유 + 예시 + 반대 경우로 3문장 이상')+c.part3.map(function(q,i){return '<div style="padding:8px 0;border-bottom:1px solid #ECECF0;font-size:14px"><span class="ia-num" style="color:'+ACC+';margin-right:8px">'+(i+1)+'</span>'+esc(q)+'</div>';}).join('')+'</div>':'')
      :'<div class="ia-empty">카드를 불러오는 중이에요</div>';
    var p1=SP.p1?'<div class="ia-box" style="margin-top:16px">'+head('Part 1 · '+SP.p1.topic,'한 질문에 2–3문장', '<button class="ia-btn sm" data-act="snew1">'+icon('shuffle',15)+'</button>')+SP.p1.qs.map(function(q){return '<div style="padding:7px 0;border-bottom:1px solid #ECECF0;font-size:14px">'+esc(q)+'</div>';}).join('')+'</div>':'';
    var stat=past.length?'<div class="ia-row" style="gap:16px;font-size:12.5px;color:#5B5B66;font-weight:700">'+icon('mic',16)+' 지금까지 Part 2 <span class="ia-num" style="color:#16161A;font-size:16px">'+past.length+'</span>장 · 평균 <span class="ia-num" style="color:#16161A;font-size:16px">'+mmss(past.reduce(function(s,r){return s+(r.secs||0);},0)/past.length)+'</span></div>':'';
    var tabs=subTabs('speaking',[['practice','연습','mic'],['tips','템플릿·요령','tips_and_updates']]);
    if (subOf('speaking','practice')==='tips') return head('Speaking','파트마다 정해진 틀이 있어요 — 틀에 내 얘기만 넣기', stat)+tabs+tipsHtml('S');
    var TPs=window.IELTS_TOPICS, srcT=TPs&&TPs.part2?'<div class="ia-row" style="gap:0;border:1px solid #DCDCE3;width:fit-content;margin-bottom:12px">'+[['season','이번 시즌 기출 '+TPs.part2.length,'local_fire_department'],['bank','연습 카드 '+B.part2.length,'style']].map(function(x){ var on=SP.src===x[0]; return '<button data-act="ssrc" data-src="'+x[0]+'" style="height:30px;padding:0 12px;font-size:12.5px;font-weight:700;display:inline-flex;align-items:center;gap:5px;background:'+(on?'#16161A':'#fff')+';color:'+(on?'#fff':'#5B5B66')+'">'+icon(x[2],15)+x[1]+'</button>'; }).join('')+'</div>'+(SP.src==='season'?'<div style="font-size:12px;color:#5B5B66;margin:-6px 0 12px">'+esc(TPs.season||'')+' · '+esc(TPs.note||'')+'</div>':''):'';
    var idea=SP.card&&SP.card.mine?'<div style="margin:-4px 0 12px;padding:8px 12px;background:#EEF2FD;color:#1A3FB5;font-size:13px">'+icon('lightbulb',15)+' 누리라면: '+esc(SP.card.mine)+'</div>':'';
    return head('Speaking','1분 준비 → 2분 말하기 · 실전 시간 그대로', stat)+tabs+srcT+idea+p2+p1;
  }
  async function speakGo(){
    if (SP.phase==='idle'||SP.phase==='done'){ SP.phase='prep'; SP.t0=Date.now(); if (SP.url){ try{URL.revokeObjectURL(SP.url);}catch(e){} SP.url=null; } render(); tickSpeak(); return; }
    if (SP.phase==='prep'){ await startTalk(); return; }
    finishTalk();
  }
  async function startTalk(){
    SP.phase='talk'; SP.t0=Date.now(); SP.chunks=[]; SP.transcript=''; SP.graded=false;
    var SRc=window.SpeechRecognition||window.webkitSpeechRecognition;   // 크롬·사파리 내장 받아쓰기
    if (SRc){ try { var srec=new SRc(); srec.lang='en-GB'; srec.continuous=true; srec.interimResults=false; srec.onresult=function(ev){ for (var i=ev.resultIndex;i<ev.results.length;i++) if (ev.results[i].isFinal) SP.transcript+=(SP.transcript?' ':'')+ev.results[i][0].transcript.trim(); };
      srec.onend=function(){ if (SP.phase==='talk'){ try { srec.start(); } catch(e){} } }; srec.start(); SP.sr=srec; } catch(e){ SP.sr=null; } }
    try { var stream=await navigator.mediaDevices.getUserMedia({audio:true}); SP.rec=new MediaRecorder(stream); SP.rec.ondataavailable=function(e){ if (e.data.size) SP.chunks.push(e.data); }; SP.rec.onstop=function(){ stream.getTracks().forEach(function(t){t.stop();}); SP.url=URL.createObjectURL(new Blob(SP.chunks,{type:SP.rec.mimeType||'audio/webm'})); render(); }; SP.rec.start(); }
    catch(e){ SP.rec=null; toast('마이크 없이 타이머만 돌아요'); }
    render(); tickSpeak();
  }
  async function finishTalk(){
    if (SP.phase!=='talk') return; var secs=Math.round((Date.now()-SP.t0)/1000); SP.phase='done'; SP.secs=secs;
    try { if (SP.sr) SP.sr.stop(); } catch(e){}
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
    var nW=wrongList().length, wtabs=subTabs('weak',[['map','약점 지도','grid_view'],['wrong','오답노트 '+nW,'assignment_late']]);
    if (subOf('weak','map')==='wrong') return head('Weak Spots','틀린 문제만 다시 — 맞히면 노트에서 빠져요')+wtabs+wrongHtml();
    var max=Math.max(1, Math.max.apply(null, Object.keys(ST.weak).map(function(k){return ST.weak[k];}).concat([1])));
    function shade(n){ if (!n) return ['#F8F8FA','#5B5B66']; var r=n/max; return r>.66?['#991b1b','#fff']:r>.33?['#ef4444','#fff']:['#fecaca','#7f1d1d']; }
    var blocks=['L','R','W','S'].map(function(k){
      return '<div class="ia-box"><div class="ia-k" style="margin-bottom:10px">'+icon(AREA[k].icon,16)+' '+AREA[k].name.toUpperCase()+'</div><div class="ia-heat">'+TYPES[k].map(function(t){ var n=ST.weak[t[0]]||0, s=shade(n);
        return '<button data-weak="'+t[0]+'" style="background:'+s[0]+';color:'+s[1]+'"><b>'+(n||'·')+'</b>'+esc(t[1])+'</button>'; }).join('')+'</div></div>';
    }).join('');
    return head('Weak Spots','문제 풀면 자동 +1 · 칸을 누르면 +1 · 길게 누르면(우클릭) −1', '<button class="ia-btn sm" data-act="weak-reset">'+icon('restart_alt',15)+' 초기화</button>')+wtabs+'<div class="ia-grid ia-2" style="grid-template-columns:minmax(0,1fr) minmax(0,1fr)">'+blocks+'</div>';
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

  // ════════ FREE TESTS (공식·무료 모의고사 — 내용은 그 사이트에서, 기록은 여기서) ════════
  function links(){ return window.IELTS_LINKS || {tests:[], videos:[], channels:[]}; }
  var AREA_LABEL={full:'4영역',LR:'듣기+읽기',L:'듣기',R:'읽기',W:'쓰기',S:'말하기'};
  function viewTests(){
    var T=(links().tests||[]).slice();
    if (!T.length) return head('Free Tests','')+'<div class="ia-empty">목록을 불러오는 중이에요</div>';
    // 후기 점수 높은 순 (후기 없는 건 뒤로)
    T.sort(function(a,b){ return ((b.review&&b.review.score)||0)-((a.review&&a.review.score)||0); });
    var REAL={easier:['실제보다 쉬움','#92400E','#FEF3C7'],similar:['실제와 비슷','#166534','#DCFCE7'],harder:['실제보다 어려움','#991B1B','#FEE2E2'],mixed:['평이 갈림','#5B5B66','#F1F1F4']};
    function stars(sc){ var h=''; for (var i=1;i<=5;i++){ h+='<span class="material-symbols-outlined" style="font-size:16px;color:'+(sc>=i?'#F59E0B':sc>=i-0.5?'#F59E0B':'#DCDCE3')+';font-variation-settings:\'FILL\' '+(sc>=i-0.5?1:0)+'">'+(sc>=i||sc<i-0.5?'star':'star_half')+'</span>'; } return h; }
    function revBlock(r){ if (!r) return ''; var re=REAL[r.real]||REAL.mixed;
      return '<div style="padding:8px 10px;background:#F8F8FA;display:flex;flex-direction:column;gap:5px"><div class="ia-row" style="gap:6px"><span style="display:inline-flex">'+stars(r.score||0)+'</span><b class="ia-num" style="font-size:14px">'+(r.score||0).toFixed(1)+'</b><span class="ia-tag" style="background:'+re[2]+';color:'+re[1]+'">'+re[0]+'</span>'+(r.mentions==='few'?'<span style="font-size:11px;color:#5B5B66">후기 적음</span>':'')+'</div>'
        +(r.pros?'<div style="font-size:12px;color:#166534;display:flex;gap:4px">'+icon('add',14)+esc(r.pros)+'</div>':'')+(r.cons?'<div style="font-size:12px;color:#991B1B;display:flex;gap:4px">'+icon('remove',14)+esc(r.cons)+'</div>':'')
        +(r.verdict?'<div style="font-size:12px;font-weight:700">'+icon('arrow_forward',14)+' '+esc(r.verdict)+'</div>':'')+'</div>'; }
    var BK=links().books;
    var tiles=T.map(function(t){
      var done=ST.records.filter(function(r){ return r.ref===t.id; }), last=done[done.length-1];
      var omrArea=t.area==='L'?'L':t.area==='R'?'R':null;
      return '<div class="ia-tile" style="cursor:default;gap:8px'+(t.official?';border-top:3px solid '+ACC:'')+'">'
        +'<div class="ia-row" style="justify-content:space-between"><span class="ia-tag" style="'+(t.official?'':'background:#FEF3C7;color:#92400E')+'">'+(t.official?'공식':'비공식')+' · '+esc(t.provider)+'</span>'+(done.length?'<span class="ia-tag" style="background:#DCFCE7;color:#166534">'+icon('check',13)+' '+done.length+'회</span>':'')+'</div>'
        +'<span class="t">'+esc(t.name)+'</span>'
        +'<div class="ia-row" style="gap:6px">'+[AREA_LABEL[t.area]||t.area, t.module==='GT'?'GT':t.module==='Academic'?'Academic':'GT·AC 공통', t.format==='computer'?'컴퓨터 화면':t.format==='pdf'?'PDF':'웹', t.count?t.count+'세트':null, t.login?'무료 가입':null].filter(Boolean).map(function(x){return '<span style="font-size:11.5px;font-weight:700;color:#5B5B66;border:1px solid #ECECF0;padding:1px 6px">'+esc(x)+'</span>';}).join('')+'</div>'
        +(t.review?revBlock(t.review):'<span class="s">'+esc(t.note||'')+'</span>')
        +(last?'<span class="s" style="font-weight:700;color:'+bandColor(last.band)+'">지난번 '+last.score+'/'+last.total+(last.band!=null?' · '+fmtB(last.band):'')+'</span>':'')
        +'<div class="ia-row" style="margin-top:auto;padding-top:6px"><a class="ia-btn sm pri" href="'+esc(t.url)+'" target="_blank" rel="noopener">'+icon('open_in_new',15)+' 열기</a>'
        +(omrArea?'<button class="ia-btn sm" data-omr="'+omrArea+'" data-omr-src="'+esc(t.name)+'" data-omr-link="'+esc(t.id)+'" data-omr-view="'+(omrArea==='L'?'listening':'reading')+'">'+icon('fact_check',15)+' 답안지·채점</button>':'')
        +(t.area==='full'||t.area==='LR'?'<button class="ia-btn sm" data-omr="L" data-omr-src="'+esc(t.name)+'" data-omr-link="'+esc(t.id)+'" data-omr-view="listening">L 답안지</button><button class="ia-btn sm" data-omr="R" data-omr-src="'+esc(t.name)+'" data-omr-link="'+esc(t.id)+'" data-omr-view="reading">R 답안지</button>':'')
        +'</div></div>';
    }).join('');
    var nOff=T.filter(function(t){return t.official;}).length;
    return head('Free Tests','공식·무료 모의고사 '+T.length+'곳 · 문제는 그 사이트에서 풀고, 점수·약점은 여기 답안지에 남겨요', '<span class="ia-row" style="font-size:12px;font-weight:700;gap:10px"><span style="color:'+ACC+'">■ 공식 '+nOff+'</span><span style="color:#92400E">■ 비공식 '+(T.length-nOff)+'</span></span>')
      +(BK?'<div class="ia-box" style="margin-bottom:14px;display:grid;grid-template-columns:auto 1fr;gap:16px;align-items:center;border-top:3px solid #16161A">'+icon('menu_book',34)+'<div><div class="ia-row" style="gap:8px"><b style="font-size:15px">Cambridge IELTS GT 책 (19·20·21)</b><span style="display:inline-flex">'+stars(BK.score||0)+'</span><b class="ia-num">'+(BK.score||0).toFixed(1)+'</b></div>'+revBlock(BK)+'</div></div>':'')
      +'<div class="ia-pick" style="grid-template-columns:repeat(auto-fill,minmax(280px,1fr))">'+tiles+'</div>';
  }

  // ════════ VIDEOS (유튜브 — 링크와 내 말로 쓴 한 줄 요령만) ════════
  var VF={area:'all', lang:'all'};
  function fmtViews(n){ n=+n||0; return n>=1e8?(n/1e8).toFixed(1)+'억':n>=1e4?Math.round(n/1e4)+'만':n>=1e3?(n/1e3).toFixed(1)+'천':String(n); }
  function viewVideos(){
    var V=(links().videos||[]).slice(), C=links().channels||[];
    if (!V.length) return head('Videos','')+'<div class="ia-empty">목록을 불러오는 중이에요</div>';
    var areas=[['all','전체'],['L','듣기'],['R','읽기'],['W1','편지'],['W2','에세이'],['S','말하기'],['G','시험 안내']];
    var f=V.filter(function(v){ return (VF.area==='all'||v.area===VF.area) && (VF.lang==='all'||v.lang===VF.lang); });
    f.sort(function(a,b){ return (ST.watched[a.yt]?1:0)-(ST.watched[b.yt]?1:0) || (b.views||0)-(a.views||0); });
    var chips='<div class="ia-row" style="gap:4px;margin-bottom:14px">'+areas.map(function(a){ var n=a[0]==='all'?V.length:V.filter(function(v){return v.area===a[0];}).length; return '<button class="ia-btn sm" data-vk="area" data-vf="'+a[0]+'" style="'+(VF.area===a[0]?'background:#16161A;color:#fff;border-color:#16161A':'')+'">'+a[1]+' <span style="opacity:.6">'+n+'</span></button>'; }).join('')
      +'<span style="flex:1"></span>'+[['all','전체'],['en','영어'],['ko','한국어']].map(function(a){ return '<button class="ia-btn sm" data-vk="lang" data-vf="'+a[0]+'" style="'+(VF.lang===a[0]?'background:'+ACC+';color:#fff;border-color:'+ACC:'')+'">'+a[1]+'</button>'; }).join('')+'</div>';
    var cards=f.map(function(v){ var w=ST.watched[v.yt];
      return '<div style="border:1px solid #DCDCE3;background:#fff;display:flex;flex-direction:column;'+(w?'opacity:.55':'')+'">'
        +'<a href="https://www.youtube.com/watch?v='+esc(v.yt)+'" target="_blank" rel="noopener" style="position:relative;display:block;aspect-ratio:16/9;background:#F1F1F4"><img src="https://i.ytimg.com/vi/'+esc(v.yt)+'/mqdefault.jpg" alt="" loading="lazy" style="width:100%;height:100%;object-fit:cover;display:block">'
          +(v.duration?'<span style="position:absolute;right:6px;bottom:6px;background:#16161A;color:#fff;font-size:11px;font-weight:700;padding:1px 5px">'+esc(v.duration)+'</span>':'')
          +'<span style="position:absolute;left:6px;top:6px;background:#fff;color:#16161A;font-size:11px;font-weight:800;padding:1px 6px">'+({L:'듣기',R:'읽기',W1:'편지',W2:'에세이',S:'말하기',G:'안내'})[v.area]+'</span></a>'
        +'<div style="padding:10px 12px;display:flex;flex-direction:column;gap:5px;flex:1">'
          +'<a href="https://www.youtube.com/watch?v='+esc(v.yt)+'" target="_blank" rel="noopener" style="font-size:13.5px;font-weight:800;line-height:1.35;color:#16161A;text-decoration:none">'+esc(v.title)+'</a>'
          +'<div style="font-size:11.5px;color:#5B5B66;font-weight:600">'+esc(v.channel)+' · '+fmtViews(v.views)+'회 · '+esc(v.published||'')+'</div>'
          +(v.tip?'<div style="font-size:12.5px;line-height:1.5;padding:6px 8px;background:#EEF2FD;color:#1A3FB5;margin-top:2px">'+icon('lightbulb',14)+' '+esc(v.tip)+'</div>':'')
          +'<div style="margin-top:auto;padding-top:4px"><button class="ia-btn sm" data-watch="'+esc(v.yt)+'">'+icon(w?'check_box':'check_box_outline_blank',15)+' 봤어요</button></div>'
        +'</div></div>'; }).join('');
    var seen=V.filter(function(v){return ST.watched[v.yt];}).length;
    return head('Videos','조회수 높고 최신인 IELTS 영상 · 썸네일 누르면 유튜브로', '<div style="min-width:160px"><div class="ia-k" style="margin-bottom:4px">'+seen+' / '+V.length+' 봤어요</div>'+bar(seen,V.length,ACC,6)+'</div>')
      +chips+'<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:12px">'+cards+'</div>'
      +(C.length?'<div class="ia-box" style="margin-top:20px">'+head('Channels','구독해 두면 좋은 채널')+'<div class="ia-pick" style="grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:8px">'+C.map(function(c){ return '<a class="ia-tile" href="'+esc(c.url)+'" target="_blank" rel="noopener" style="text-decoration:none;color:#16161A;padding:12px"><span class="ia-row" style="justify-content:space-between"><span class="t" style="font-size:14px">'+esc(c.name)+'</span><span class="ia-tag" style="background:#F1F1F4;color:#5B5B66">'+(c.lang==='ko'?'한국어':'EN')+'</span></span><span class="s">'+esc(c.why||'')+'</span></a>'; }).join('')+'</div></div>':'');
  }

  // ════════ GUIDE ════════
  function viewGuide(){ return head('Guide','전략·자료·채점 프롬프트 — 필요할 때만')+(typeof window.ieltsGuideHtml==='function'?window.ieltsGuideHtml():''); }

  // ════════ 렌더 · 이벤트 ════════
  function render(){
    var el=document.getElementById('eng-ielts-view'); if (!el) return;
    css();
    var v=ST.view, body;
    if (OMR && (v==='listening'||v==='reading')) body=viewOmr();
    else body= v==='listening'?viewPractice('L') : v==='reading'?viewPractice('R') : v==='writing'?viewWriting() : v==='speaking'?viewSpeaking() : v==='scores'?viewScores() : v==='weak'?viewWeak() : v==='cards'?viewCards() : v==='tests'?viewTests() : v==='videos'?viewVideos() : v==='guide'?viewGuide() : viewHome();
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
      var sk=e.target.closest('.ia-line[data-seek]'); if (sk && RUN && RUN.done && sk.dataset.seek!==''){ playSection(parseFloat(sk.dataset.seek)); return; }
      var pb=e.target.closest('.ia-pb.hid'); if (pb){ pb.classList.remove('hid'); return; }
      var hm=e.target.closest('.ia-pass mark.ia-hl'); if (hm && RUN && !RUN.done){ var tn=document.createTextNode(hm.textContent); hm.replaceWith(tn); var pz=root.querySelector('.ia-pass'); if (pz) RUN.hl[pz.dataset.sid]=pz.innerHTML; return; }
      var t=e.target.closest('[data-offset],[data-wrecent],[data-dict],[data-dline],[data-drill],[data-wans],[data-wchk],[data-flag],[data-jump],[data-mockstart],[data-parahide],[data-sub],[data-wstudy],[data-wmode],[data-wpara],[data-wpi],[data-kcard],[data-watch],[data-vf],[data-nav],[data-go],[data-run],[data-sec],[data-q],[data-act],[data-omr],[data-del],[data-wt1],[data-wt2],[data-wrand],[data-wfree],[data-wopen],[data-medit],[data-mock],[data-weak],[data-cans]');
      if (!t || !root.contains(t)) return;
      var d=t.dataset;
      if (d.nav){ if (RUN && !RUN.done && d.nav!==ST.view && !confirm('푸는 중인 문제를 그만둘까요?')) return; if (d.nav!==ST.view){ RUN=null; OMR=null; } go(d.nav); return; }
      if (d.go){ go(d.go); return; }
      if (d.mock){ ST.view='scores'; EDIT=+d.mock; render(); return; }
      if (d.run){ startRun(ST.view==='listening'?'L':'R', d.run); render(); return; }
      if (d.sec!=null){ stopSpeech(); RUN.cur=+d.sec; render(); return; }
      if (d.q){ if (RUN.done) return; RUN.ans[d.q]=d.v; t.parentNode.querySelectorAll('button').forEach(function(b){b.classList.toggle('on', b===t);}); return; }
      if (d.omr){ OMR={area:d.omr, mine:{}, key:{}, keyRaw:'', graded:false, types:{}, src:d.omrSrc||'GT 21', linkId:d.omrLink||null, test:1, mock:'', running:false, t0:0, used:0}; if (d.omrView) ST.view=d.omrView; render(); return; }
      if (d.offset){ var op=d.offset.split('|'); ST.offSet=ST.offSet||{}; ST.offSet[op[0]]=op[1]; var yo=window.scrollY; render(); window.scrollTo(0,yo); return; }
      if (d.wrecent){ var wr=d.wrecent.split('|'), TPw=window.IELTS_TOPICS, x=(+wr[0]===1?TPw.task1:TPw.task2)[+wr[1]];
        startWriting(+wr[0], +wr[0]===1?{id:'recent1-'+wr[1], tone:x.tone, situation:x.situation, bullets:x.bullets, opener:x.tone==='formal'?'Dear Sir or Madam,':''}:{id:'recent2-'+wr[1], kind:x.kind, prompt:x.q, ideas:[]}); render(); return; }
      if (d.dict){ DICT={sid:d.dict, i:0, inputs:{}, checked:{}, slow:false}; render(); playLine(); var di=document.getElementById('ia-dict'); if (di) di.focus(); return; }
      if (d.dline!=null){ DICT.i=+d.dline; render(); playLine(); return; }
      if (d.drill){ startDrill(d.drill); render(); window.scrollTo({top:root.offsetTop-80}); return; }
      if (d.wans){ var wp=d.wans.split('|'); await answerWrong(wp[0]+'|'+wp[1], wp.slice(2).join('|')); return; }
      if (d.wchk){ var inp2=root.querySelector('[data-wtxt="'+d.wchk+'"]'); await answerWrong(d.wchk, inp2?inp2.value:''); return; }
      if (d.flag){ RUN.flags[d.flag]=!RUN.flags[d.flag]; var y=window.scrollY; render(); window.scrollTo(0,y); return; }
      if (d.jump){ var jp=d.jump.split('|'); if (RUN.cur!==+jp[0]){ stopSpeechKeepAudio(); RUN.cur=+jp[0]; render(); } var qe=document.getElementById('ia-q'+jp[1]); if (qe){ qe.scrollIntoView({block:'center'}); qe.style.outline='2px solid '+ACC; setTimeout(function(){ qe.style.outline=''; },1200); } return; }
      if (d.mockstart){ var mp=d.mockstart.split('|'); ST.view='listening'; startMock(mp[0], mp[1]); render(); window.scrollTo({top:root.offsetTop-80}); return; }
      if (d.parahide){ ST.paraHide=ST.paraHide||{}; ST.paraHide[d.parahide]=!ST.paraHide[d.parahide]; render(); return; }
      if (d.sub){ var sp=d.sub.split('|'); ST.sub[sp[0]]=sp[1]; render(); return; }
      if (d.wstudy){ WS={id:d.wstudy, mode:'view', pi:0, typed:{}, recall:{}, checked:false, t0:Date.now()}; render(); window.scrollTo({top:root.offsetTop-80}); return; }
      if (d.wmode){ WS.mode=d.wmode; WS.t0=Date.now(); render(); if (d.wmode==='copy'){ var c=document.getElementById('ia-cp'); if (c) c.focus(); } return; }
      if (d.wpi!=null){ WS.pi=+d.wpi; render(); var c2=document.getElementById('ia-cp'); if (c2) c2.focus(); return; }
      if (d.wpara){ var am=model().answers[WS.id]; WS.pi=Math.max(0,Math.min(am.paras.length-1,WS.pi+ +d.wpara)); if (+d.wpara>0 && am.paras.every(function(p,i){return isCopyDone(p.text,WS.typed[i]);})) await finishCopy(am); render(); var c3=document.getElementById('ia-cp'); if (c3) c3.focus(); return; }
      if (d.kcard){ var kc=d.kcard.split('|'); if (allCards().some(function(c){return cardKey(c)===kc[0].toLowerCase();})){ toast('이미 카드에 있어요'); return; } ST.myCards.push({en:kc[0], ko:kc[1]||'', tag:'w', mine:true}); saveState(); CD.deck=null; toast('카드에 추가했어요'); return; }
      if (d.watch){ ST.watched[d.watch]=ST.watched[d.watch]?0:1; saveState(); render(); return; }
      if (d.vf){ VF[d.vk]=d.vf; render(); return; }
      if (d.del){ if (!confirm('이 기록을 지울까요?')) return; await deleteRecord(d.del); render(); return; }
      if (d.wt1||d.wt2){ var B=bank().writing, p=(d.wt1?B.task1:B.task2).find(function(x){return x.id===(d.wt1||d.wt2);}); startWriting(d.wt1?1:2,p); render(); return; }
      if (d.wrand){ go('writing:'+d.wrand); return; }
      if (d.wfree){ var tk=confirm('에세이(Task 2)면 확인, 편지(Task 1)면 취소')?2:1; startWriting(tk,null,true); render(); return; }
      if (d.wopen){ var r=ST.records.find(function(x){return x._id===d.wopen;}); if (r){ WR={task:r.task, id:r.ref, prompt:r.prompt, opener:'', ideas:[], text:r.text, limit:r.task===1?1200:2400, t0:null, paused:r.secs||0, running:false, draftKey:'atelier_ielts_draft_x', free:false, checks:{}, recId:r._id}; render(); } return; }
      if (d.medit){ EDIT=+d.medit; render(); return; }
      if (d.weak){ addWeak(d.weak,1); render(); return; }
      if (d.cans!=null){ answerCard(d.cans==='1'); return; }
      var a=d.act;
      if (a==='dictclose'){ if (DAUD) DAUD.pause(); var sD=bank().listening.find(function(x){return x.id===DICT.sid;}); if (Object.keys(DICT.checked).length) await saveRecord({kind:'dict', date:today(), ref:DICT.sid, acc:dictTotal(sD), lines:Object.keys(DICT.checked).length}); DICT=null; render(); return; }
      if (a==='dplay'){ playLine(); return; }
      if (a==='dslow'){ DICT.slow=!DICT.slow; render(); playLine(); return; }
      if (a==='dcheck'||a==='dskip'){ var dv=document.getElementById('ia-dict'); DICT.inputs[DICT.i]=a==='dskip'?'':(dv?dv.value:''); DICT.checked[DICT.i]=true; var sl=bank().listening.find(function(x){return x.id===DICT.sid;}); if (lineAcc(sl.script[DICT.i].text, DICT.inputs[DICT.i])<70) addWeak('l-spell',1); render(); return; }
      if (a==='dretry'){ delete DICT.checked[DICT.i]; render(); playLine(); var d2=document.getElementById('ia-dict'); if (d2){ d2.focus(); d2.select(); } return; }
      if (a==='dnext'){ var sn=bank().listening.find(function(x){return x.id===DICT.sid;}); if (DICT.i<sn.script.length-1){ DICT.i++; render(); playLine(); var d3=document.getElementById('ia-dict'); if (d3) d3.focus(); } else { toast('섹션 끝 — 평균 '+dictTotal(sn)+'%'); } return; }
      if (a==='mocknext'){ if (MOCK.step==='L'){ MOCK.step='R'; ST.view='reading'; startRun('R', MOCK.r+'|all'); RUN.mock=true; render(); window.scrollTo({top:root.offsetTop-80}); return; }
        if (MOCK.step==='R'){ MOCK.step='W'; ST.view='writing'; RUN=null; WR={mock:true, task:2, prompt:'', text:'', mt:{1:'',2:''}, cur:2, limit:3600, t0:Date.now(), paused:0, running:true, draftKey:'atelier_ielts_draft_mock', checks:{}}; render(); window.scrollTo({top:root.offsetTop-80}); return; } }
      if (a==='mockw'){ WR.cur=+t.dataset.t; render(); var mt=document.getElementById('ia-wtext'); if (mt) mt.focus(); return; }
      if (a==='mockfinish'){ await finishMock(); return; }
      if (a==='mockclose'){ MOCK=null; WR=null; ST.view='home'; render(); return; }
      if (a==='exit' && RUN && RUN.mock && !RUN.done){ MOCK=null; }   // 실전 도중 그만두면 실전 끝
      if (a==='exit'){ stopSpeech(); RUN=null; render(); return; }
      if (a==='submit'){ var tot=RUN.secs.reduce(function(s,x){return s+x.questions.length;},0), an=Object.keys(RUN.ans).filter(function(k){return RUN.ans[k];}).length; if (an<tot && !confirm((tot-an)+'문항이 비어 있어요. 제출할까요?')) return; submitRun(); return; }
      if (a==='omr-exit'){ clearInterval(ST.timers.omr); OMR=null; render(); return; }
      if (a==='omr-start'){ if (OMR.running){ OMR.used+=(Date.now()-OMR.t0)/1000; OMR.running=false; clearInterval(ST.timers.omr); } else { OMR.running=true; OMR.t0=Date.now(); var lim=OMR.area==='L'?1800:3600; ST.timers.omr=setInterval(function(){ var c=document.getElementById('ia-omr-clock'); if (!c||!OMR){clearInterval(ST.timers.omr);return;} var left=lim-OMR.used-(Date.now()-OMR.t0)/1000; c.textContent=left>=0?mmss(left):'+'+mmss(-left); c.style.color=left<300?'#fca5a5':'#fff'; },500); } render(); return; }
      if (a==='omr-grade'){ OMR.keyRaw=document.getElementById('ia-key').value; OMR.key=parseKey(OMR.keyRaw); var nk=Object.keys(OMR.key).length; if (nk<40 && !confirm('정답이 '+nk+'개만 읽혔어요. 그래도 채점할까요?')) return; OMR.graded=true; OMR.running=false; clearInterval(ST.timers.omr); render(); return; }
      if (a==='omr-save'){ var wrongN=0; for (var i=1;i<=40;i++) if (!isRight(OMR.mine[i],OMR.key[i])) wrongN++; var sc=40-wrongN, b=toBand(OMR.area==='L'?BAND_L:BAND_R,sc);
        Object.keys(OMR.types).forEach(function(n){ if (OMR.types[n]) addWeak(OMR.types[n],1); });
        var srcName=document.getElementById('ia-omr-src').value, src=O0link(srcName), mk=document.getElementById('ia-omr-mock').value;
        await saveRecord({kind:OMR.area==='L'?'listening':'reading', date:today(), ref:OMR.linkId||src, title:src+(OMR.linkId?'':' (책)'), score:sc, total:40, band:b, bands:OMR.area==='L'?{L:b}:{R:b}});
        if (mk){ var m=(plan().mocks||[]).find(function(x){return x.n===+mk;}), r=mockRec(mk)||{kind:'mock', n:+mk, date:m?m.date:today(), bands:{}, raw:{}}; r.bands=r.bands||{}; r.raw=r.raw||{}; r.bands[OMR.area]=b; r.raw[OMR.area]=sc; r.src=src; await saveRecord(r); }
        toast('저장했어요 · '+sc+'/40 · '+fmtB(b)); OMR=null; render(); return; }
      if (a==='wtime'){ if (WR.running){ WR.paused+=(Date.now()-WR.t0)/1000; WR.running=false; } else { WR.running=true; WR.t0=Date.now(); } render(); var ta=document.getElementById('ia-wtext'); if (ta) ta.focus(); return; }
      if (a==='wexit'){ if (WR.text && !WR.recId && !confirm('저장 안 하고 닫을까요? (임시 저장은 남아요)')) return; WR=null; render(); return; }
      if (a==='wgrade'){ var usedG=WR.paused+(WR.running?(Date.now()-WR.t0)/1000:0); var prG=document.getElementById('ia-wprompt'); if (prG) WR.prompt=prG.value;
        if (wc(WR.text)<40){ toast('조금 더 쓰고 요청해요'); return; }
        var recG=await saveRecord({_id:WR.recId, kind:'writing', date:today(), task:WR.task, ref:WR.id, prompt:WR.prompt, text:WR.text, words:wc(WR.text), secs:Math.round(usedG), band:null}); WR.recId=recG._id;
        try { await window.IELTS_GRADE.request({kind:'writing', task:WR.task, prompt:WR.prompt, text:WR.text, words:wc(WR.text), secs:Math.round(usedG), ref:recG._id}); toast('채점 요청했어요 — Writing › AI 채점에서 확인'); } catch(err){ toast('요청 실패 — 로그인 확인'); }
        return; }
      if (a==='gopen'){ ST.gopen=ST.gopen===t.dataset.id?null:t.dataset.id; var yg=window.scrollY; render(); window.scrollTo(0,yg); return; }
      if (a==='sgrade'){ if (!SP.transcript||words(SP.transcript).length<20){ toast('받아쓴 말이 너무 짧아요'); return; }
        try { await window.IELTS_GRADE.request({kind:'speaking', part:2, prompt:SP.card?SP.card.cue+'\n'+SP.card.points.join('\n'):'', text:SP.transcript, words:words(SP.transcript).length, secs:SP.secs||0}); SP.graded=true; toast('채점 요청했어요 — Writing › AI 채점'); render(); } catch(err){ toast('요청 실패'); } return; }
      if (a==='wcopy'){ var txt=graderPrompt(); try { await navigator.clipboard.writeText(txt); toast('복사했어요 — Claude에 붙여넣기'); } catch(err){ prompt('복사하기', txt); } return; }
      if (a==='wsave'){ var used=WR.paused+(WR.running?(Date.now()-WR.t0)/1000:0); var pr=document.getElementById('ia-wprompt'); if (pr) WR.prompt=pr.value;
        var words=wc(WR.text), goal=WR.task===1?150:250; if (words<goal) addWeak('w-length',1);
        var rec=await saveRecord({_id:WR.recId, kind:'writing', date:today(), task:WR.task, ref:WR.id, prompt:WR.prompt, text:WR.text, words:words, secs:Math.round(used), band:null});
        WR.recId=rec._id; try { localStorage.removeItem(WR.draftKey); } catch(err){} toast('저장했어요 · '+words+'단어'); return; }
      if (a==='wsclose'){ WS=null; render(); return; }
      if (a==='wscheck'){ WS.checked=true; var am2=model().answers[WS.id]; await saveRecord({kind:'copy', date:today(), ref:WS.id, mode:'recall', acc:recallScore(am2), secs:Math.round((Date.now()-WS.t0)/1000)}); render(); return; }
      if (a==='wsretry'){ WS.checked=false; WS.recall={}; WS.t0=Date.now(); render(); return; }
      if (a==='sgo'){ speakGo(); return; }
      if (a==='snew'){ var TP2=window.IELTS_TOPICS, P2=SP.src==='season'&&TP2?TP2.part2:bank().speaking.part2; SP.card=P2[Math.floor(Math.random()*P2.length)]; SP.phase='idle'; render(); return; }
      if (a==='snew1'){ var TP1=window.IELTS_TOPICS, P1=SP.src==='season'&&TP1&&TP1.part1?TP1.part1:bank().speaking.part1; SP.p1=P1[Math.floor(Math.random()*P1.length)]; render(); return; }
      if (a==='ssrc'){ SP.src=t.dataset.src; SP.card=null; SP.p1=null; SP.phase='idle'; render(); return; }
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
    root.addEventListener('mouseup', function(){
      if (!RUN || RUN.done) return; var sel=window.getSelection(); if (!sel || sel.isCollapsed) return;
      var pz=root.querySelector('.ia-pass'); if (!pz) return; var rg=sel.getRangeAt(0); if (!pz.contains(rg.commonAncestorContainer)) return;
      if (rg.startContainer!==rg.endContainer || rg.startContainer.nodeType!==3){ sel.removeAllRanges(); return; }   // 한 문단 안에서만
      var mk=document.createElement('mark'); mk.className='ia-hl'; try { rg.surroundContents(mk); } catch(err){ return; } sel.removeAllRanges(); RUN.hl[pz.dataset.sid]=pz.innerHTML;
    });
    root.addEventListener('keydown', function(e){ if (e.key==='Enter' && !e.shiftKey && e.target.id==='ia-dict'){ e.preventDefault(); var b=root.querySelector('[data-act="dcheck"]'); if (b) b.click(); else { var n=root.querySelector('[data-act="dnext"]'); if (n) n.click(); } } });
    root.addEventListener('contextmenu', function(e){ var t=e.target.closest('[data-weak]'); if (!t) return; e.preventDefault(); addWeak(t.dataset.weak,-1); render(); });
    root.addEventListener('input', function(e){
      var t=e.target;
      if (t.dataset.qi){ RUN.ans[t.dataset.qi]=t.value; return; }
      if (t.dataset.omrI){ OMR.mine[t.dataset.omrI]=t.value; return; }
      if (t.id==='ia-cp'){ var am3=model().answers[WS.id], par=am3.paras[WS.pi]; WS.typed[WS.pi]=t.value; var g=document.getElementById('ia-cp-ghost'); if (g) g.innerHTML=copyGhost(par.text,t.value); var ac=document.getElementById('ia-cp-acc'); if (ac){ var v=copyAcc(par.text,t.value); ac.textContent=t.value?'정확도 '+v+'%':''; ac.style.color=v>=95?OK:v>=80?MID:BAD; }
        if (isCopyDone(par.text,t.value)){ if (WS.pi<am3.paras.length-1){ WS.pi++; render(); var nx=document.getElementById('ia-cp'); if (nx) nx.focus(); } else { finishCopy(am3).then(render); } } return; }
      if (t.dataset.rc!=null){ WS.recall[t.dataset.rc]=t.value; return; }
      if (t.id==='ia-wtext' && WR && WR.mock){ WR.mt[t.dataset.mockt]=t.value; var mc=document.getElementById('ia-wc'), g2=WR.cur===1?150:250; if (mc) mc.textContent=wc(t.value)+' / '+g2+' words'; try { localStorage.setItem('atelier_ielts_draft_mock', JSON.stringify(WR.mt)); } catch(err){} return; }
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
    if (window.IELTS_GRADE && fb() && !ST._gw){ try { ST._gw=window.IELTS_GRADE.watch(function(docs){ var before=pendingN(); ST.grades=docs;
      var typing=document.activeElement && /TEXTAREA|INPUT/.test(document.activeElement.tagName);   // 쓰는 중엔 화면을 안 바꿈
      if (!typing && (ST.view==='home' || (ST.view==='writing' && !WR && !WS))) render(); if (before && pendingN()<before) toast('AI 채점이 끝났어요'); }); } catch(e){} }
  };
  window.IELTS_APP = { state:ST, audio:function(){ return AUD; }, toBand:function(a,n){ return toBand(a==='L'?BAND_L:BAND_R,n); } };
})();
