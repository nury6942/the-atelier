// ═══ ENGLISH › Listen › 직접 해석 (2026-10-28) — input 만 하지 말고 내 머리로 풀고, 입으로 되말하기 ═══
// 집중 구간(10문단)마다 4단계
//   ① 듣기: 그 구간을 영상에서 자막 없이 한 번
//   ② 내가 해석: 문단마다 직접 쓰기 · 모르는 건 영어에서 드래그 → '모름' 칩 + 뜻 추측 (정답은 안 보여줌)
//   ③ 검수: 아이맥(구독)이 맞음/대충/놓침으로 가름 → 그제서야 정답 해석이 열림 · 대충·놓침·틀린 추측은 My Words 로 자동
//   ④ 되말하기: 한국어만 보고 영어로 말하기(마이크 또는 타이핑) → 원문과 비교
// 저장: englishStudy/<id>.practice { zone, paras:{ <pi>:{ mine, unk[{w,guess}], st draft→checking→checked→said, check{}, says[{ko,en,said,score,at}] } } }
// 검수 요청 = aiJobs { kind:'study', mode:'check', docId, pi, transcript:원문, ref:정답 해석, mine, unk } → worker.js
// 전체 해석 보기에선 이 구간 문단의 한국어가 ③ 전까지 잠김 (practiceLocked)
(function(){
  var ACC='#1F4BD8', SUB='#475569', LINE='#ECECF0', ZONE=10;
  var C={ ok:['#EAF3DE','#27500A','맞음'], vague:['#FAEEDA','#633806','대충'], miss:['#FCEBEB','#791F1F','놓침'] };
  var drafts={}, timers={};   // 저장 전 타이핑을 다시 그려도 안 잃게

  function esc(t){ return String(t==null?'':t).replace(/[&<>"']/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function toast(icon,msg){ if (typeof showSyncToast==='function') showSyncToast('<span class="material-symbols-outlined text-sm mr-1">'+icon+'</span> '+msg); }
  function doc(id){ return (typeof engStudyData!=='undefined' ? engStudyData : []).find(function(x){ return x._id===id; }); }
  function cur(){ return doc(typeof _esOpenId!=='undefined' ? _esOpenId : null); }
  function paras(s){ return ((s.translation||{}).paras)||[]; }
  function pr(s){ s.practice=s.practice||{}; s.practice.paras=s.practice.paras||{}; return s.practice; }
  function P(s,pi){ var p=pr(s).paras; p[pi]=p[pi]||{}; return p[pi]; }
  function save(s, obj){ return db.collection('englishStudy').doc(s._id).set({ practice: obj }, { merge:true }).catch(function(e){ toast('error','저장 실패: '+e.message); }); }
  var TS=/Speaker\s*\d+\s*[•·]\s*((?:\d{1,2}:)?\d{1,2}:\d{2})\s*/g;
  function plain(en){ return String(en).replace(TS,'').trim(); }
  function firstTs(en){ TS.lastIndex=0; var m=TS.exec(en); return m?m[1]:''; }
  // 맥위스퍼 시각은 드문드문(10분에 하나쯤) → 단어 수로 사이를 메워 문단 시작 시각을 어림
  function sec(t){ return t.split(':').reduce(function(a,x){ return a*60+(+x); }, 0); }
  function mmss(v){ v=Math.max(0,Math.round(v)); var h=Math.floor(v/3600), m=Math.floor(v%3600/60), x=v%60; return (h?h+':'+String(m).padStart(2,'0'):m)+':'+String(x).padStart(2,'0'); }
  function tsAt(s, pi){
    var ps=paras(s);
    if (!s._tsAt || s._tsAt.n!==ps.length){
      var cum=[], w=0, anc=[];
      ps.forEach(function(p,i){ cum.push(w); var t=firstTs(p.en); if (t) anc.push({ w:w, t:sec(t) }); w+=plain(p.en).split(/\s+/).length; });
      cum.push(w);
      if (!anc.length || anc[0].w>0) anc.unshift({ w:0, t:0 });
      var rate=anc.length>1 ? (anc[anc.length-1].t-anc[0].t)/Math.max(1,anc[anc.length-1].w-anc[0].w) : 0.4;
      s._tsAt={ n:ps.length, f:function(i){ var x=cum[i], a=anc[0], b=null;
        for (var k=0;k<anc.length;k++){ if (anc[k].w<=x) a=anc[k]; else { b=anc[k]; break; } }
        return mmss(b ? a.t+(b.t-a.t)*(x-a.w)/Math.max(1,b.w-a.w) : a.t+(x-a.w)*rate); } };
    }
    return s._tsAt.f(Math.min(pi, ps.length));
  }
  function enHtml(en){ TS.lastIndex=0; return esc(en).replace(/Speaker\s*\d+\s*[•·]\s*((?:\d{1,2}:)?\d{1,2}:\d{2})\s*/g,'<span style="font-size:11px;color:'+SUB+';border:1px solid #E2E8F0;padding:0 5px;margin:0 4px 0 2px;user-select:none">$1</span>'); }
  function zoneOf(s){ var z=pr(s).zone; return typeof z==='number' ? z : 0; }
  function zoneRange(s){ var a=zoneOf(s), n=paras(s).length; return [a, Math.min(a+ZONE, n)]; }
  function done(p){ return p && (p.st==='checked' || p.st==='said'); }

  // 전체 해석 보기의 잠금: 지금 구간인데 아직 검수 전이면 한국어를 가린다
  window.practiceLocked=function(s, pi){
    if (!s.practice) return false;
    var r=zoneRange(s); if (pi<r[0] || pi>=r[1]) return false;
    return !done((s.practice.paras||{})[pi]);
  };

  // 이번 주(월요일부터) 되말하기 문장 수 · 끝낸 구간 수
  function weekStart(){ var d=new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()-((d.getDay()+6)%7)); return d.getTime(); }
  window.practiceWeek=function(){
    var w0=weekStart(), said=0, zones=0;
    (typeof engStudyData!=='undefined'?engStudyData:[]).forEach(function(s){
      var ps=(s.practice||{}).paras||{}, byZone={};
      Object.keys(ps).forEach(function(k){
        (ps[k].says||[]).forEach(function(x){ if (x.at && Date.parse(x.at)>=w0) said++; });
        var z=Math.floor(+k/ZONE); byZone[z]=byZone[z]||{ n:0, last:0 };
        if (ps[k].st==='said'){ byZone[z].n++; byZone[z].last=Math.max(byZone[z].last, Date.parse(ps[k].saidAt||0)||0); }
      });
      var n=paras(s).length;
      Object.keys(byZone).forEach(function(z){ var need=Math.min(ZONE, n-(+z)*ZONE); if (need>0 && byZone[z].n>=need && byZone[z].last>=w0) zones++; });
    });
    return { said:said, zones:zones };
  };
  window.practiceWeekHtml=function(){
    var w=practiceWeek(), goal=2, pct=Math.min(100, Math.round(w.zones/goal*100));
    return '<div style="border:1px solid '+LINE+';padding:14px 16px;margin:0 0 14px;display:flex;gap:18px;align-items:center;flex-wrap:wrap">'+
      '<div style="min-width:150px"><p style="font-size:12px;color:'+SUB+';margin:0">이번 주 직접 해석</p><p style="font-size:22px;font-weight:700;margin:0;color:'+(w.zones>=goal?ACC:'#18181B')+'">'+w.zones+' / '+goal+' 구간</p></div>'+
      '<div style="flex:1;min-width:160px"><div style="height:6px;background:#EEF2FD"><div style="height:6px;width:'+pct+'%;background:'+ACC+'"></div></div>'+
      '<p style="font-size:13px;color:'+SUB+';margin:6px 0 0">되말하기 <b style="color:#18181B">'+w.said+'문장</b> · 구간 = 10문단, 되말하기까지 끝내야 1</p></div></div>';
  };
  window.practiceListChip=function(s){
    var ps=(s.practice||{}).paras||{}, ks=Object.keys(ps); if (!ks.length) return '';
    var said=ks.filter(function(k){ return ps[k].st==='said'; }).length;
    return '<span style="font-size:11px;font-weight:600;padding:2px 8px;background:#1F4BD8;color:#fff">직접 해석 '+said+'문단</span>';
  };

  // ── 화면 ──
  function zoneBar(s){
    var n=paras(s).length, a=zoneOf(s), out=[];
    for (var z=0; z<n; z+=ZONE){
      var e=Math.min(z+ZONE,n), ps=(s.practice||{}).paras||{}, c=0;
      for (var i=z;i<e;i++) if ((ps[i]||{}).st==='said') c++;
      var on=z===a, full=c===e-z, ts=tsAt(s,z);
      out.push('<button onclick="practiceZone('+z+')" style="font-size:13px;padding:6px 11px;cursor:pointer;border:1px solid '+(on?ACC:'#CBD5E1')+';background:'+(on?'#EEF2FD':full?'#F8FAFC':'#fff')+';color:'+(on?'#1A3FB5':SUB)+'">'+(z+1)+'–'+e+(ts?' · '+esc(ts):'')+(full?' ✓':c?' · '+c+'/'+(e-z):'')+'</button>');
    }
    return '<div style="display:flex;gap:6px;flex-wrap:wrap;margin:0 0 14px">'+out.join('')+'</div>';
  }
  function head(s){
    var r=zoneRange(s), ps=pr(s).paras, w=0, ck=0, sd=0;
    for (var i=r[0];i<r[1];i++){ var p=ps[i]||{}; if ((p.mine||'').trim()) w++; if (done(p)) ck++; if (p.st==='said') sd++; }
    var tot=r[1]-r[0], t0=tsAt(s,r[0]), t1=r[1]<paras(s).length?tsAt(s,r[1]):'끝';
    var step=function(no,label,n){ var full=n>=tot; return '<div style="flex:1;min-width:120px;border-top:3px solid '+(full?ACC:n?'#93B4F5':'#E2E8F0')+';padding-top:6px"><p style="font-size:12px;color:'+SUB+';margin:0">'+no+' '+label+'</p><p style="font-size:15px;font-weight:600;margin:0">'+(n==null?(t0?esc(t0)+' ~ '+esc(t1):'자막 없이'):n+' / '+tot)+'</p></div>'; };
    return '<div id="pr-head" style="display:flex;gap:12px;flex-wrap:wrap;margin:0 0 18px">'+step('①','듣기',null)+step('②','내가 해석',w)+step('③','검수',ck)+step('④','되말하기',sd)+'</div>';
  }
  function chip(t){ var c=C[t]||C.vague; return '<span style="display:inline-block;font-size:13px;font-weight:600;padding:2px 10px;background:'+c[0]+';color:'+c[1]+';margin-right:0">'+c[2]+'</span>'; }
  // 실제로 얼마나 자주 쓰나 — 5칸 막대 (옛 검수엔 freq 가 없으니 안 그림)
  var FQ=['','거의 안 씀','글·격식','글·강연','자주','매일'];
  function point(pt){
    return '<div style="margin:14px 0 0;padding:16px 18px;background:#FFFFFF;border:1px solid '+LINE+'">'+
      '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin:0 0 10px">'+chip(pt.type||'vague')+
        (pt.key?'<b style="font-size:17px;color:#1A3FB5">'+esc(pt.key)+'</b>'+(pt.keyKo?'<span style="font-size:16px;color:#18181B">'+esc(pt.keyKo)+'</span>':''):'')+
        '<span style="margin-left:auto;display:flex;gap:8px;align-items:center">'+meter(pt.key?pt.freq:0)+'</span></div>'+
      (pt.note?'<p style="margin:0;font-size:15px;line-height:1.85;color:#18181B">'+esc(pt.note)+'</p>':'')+
      (pt.use?'<div style="padding:12px 14px;background:#EEF2FD;font-size:15px;line-height:1.7;margin-top:12px"><span style="display:block;font-size:13px;font-weight:600;color:#1A3FB5;margin:0 0 4px">실제 쓰임</span><span style="color:#1A3FB5">'+esc(pt.use).replace(/\*\*(.+?)\*\*/g,'<b>$1</b>')+'</span>'+(pt.useKo?'<span style="display:block;color:#475569;margin-top:2px">'+esc(pt.useKo)+'</span>':'')+'</div>':'')+
    '</div>';
  }
  function pair(right, mine, type){
    return '<div style="display:flex;flex-direction:column;gap:8px">'+
      '<div style="padding:12px 16px;border-left:4px solid '+ACC+';background:#F5F8FF"><span style="display:block;font-size:13px;font-weight:600;color:'+ACC+';margin:0 0 4px">정답 해석</span><span style="font-size:16px;line-height:1.75;color:#18181B">'+esc(right)+'</span></div>'+
      '<div style="padding:12px 16px;border-left:4px solid #94A3B8;background:#F8FAFC"><span style="display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;color:#475569;margin:0 0 4px">내 해석'+(type?chip(type):'')+'</span><span style="font-size:16px;line-height:1.75;color:#334155">'+esc(mine||'(빠짐)')+'</span></div></div>';
  }
  function meter(f){ f=Math.round(+f); if (!(f>=1&&f<=5)) return ''; var h=''; for (var i=1;i<=5;i++) h+='<i style="display:block;width:6px;height:14px;background:'+(i<=f?ACC:'#CBD5E1')+'"></i>'; return '<span title="실제 쓰임" style="display:flex;gap:2px;flex:none">'+h+'</span><span style="font-size:13px;color:#475569;flex:none">'+FQ[f]+'</span>'; }
  function lab(t){ return '<p style="font-size:14px;font-weight:700;color:#334155;margin:32px 0 12px;letter-spacing:.02em">'+t+'</p>'; }

  function card(s, pi){
    var en=paras(s)[pi].en, ko=paras(s)[pi].ko, p=(pr(s).paras[pi])||{}, k=s._id+':'+pi;
    var mine=drafts[k]!=null?drafts[k]:(p.mine||''), unk=p.unk||[];
    var h='<div id="pr-'+pi+'" style="border-top:1px solid '+LINE+';padding:18px 0">'+
      '<p style="font-size:12px;color:'+SUB+';margin:0 0 6px">문단 '+(pi+1)+' · 약 '+tsAt(s,pi)+(p.st==='said'?' · <b style="color:'+ACC+'">끝 ✓</b>':'')+'</p>'+
      '<p class="pr-en" data-pi="'+pi+'" style="font-size:16px;line-height:1.75;margin:0 0 10px;color:#18181B">'+enHtml(en)+'</p>';
    if (!done(p) && p.st!=='checking'){
      h+=(unk.length?'<div style="display:flex;flex-direction:column;gap:6px;margin:0 0 10px">'+unk.map(function(u,i){
          return '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span style="font-size:14px;background:#FAEEDA;color:#633806;padding:2px 8px">'+esc(u.w)+'</span><span style="font-size:13px;color:'+SUB+'">뜻 추측</span>'+
            '<input value="'+esc(u.guess||'')+'" oninput="practiceGuess('+pi+','+i+',this.value)" placeholder="대충이라도 적어 보기" style="flex:1;min-width:160px;font-size:14px;padding:5px 8px;border:1px solid #CBD5E1">'+
            '<button onclick="practiceUnkDel('+pi+','+i+')" style="font-size:13px;color:'+SUB+';cursor:pointer">✕</button></div>';
        }).join('')+'</div>':'<p style="font-size:13px;color:'+SUB+';margin:0 0 8px">모르는 단어·표현은 영어에서 드래그 → 뜻을 먼저 추측해 적어요</p>')+
        '<textarea id="pr-ta-'+pi+'" oninput="practiceDraft('+pi+',this.value)" rows="3" placeholder="내 말로 해석해 보기 (정답은 검수 뒤에 열려요)" style="width:100%;font-size:15px;line-height:1.6;padding:10px 12px;border:1px solid #CBD5E1;font-family:inherit">'+esc(mine)+'</textarea>'+
        '<p id="pr-err-'+pi+'" style="font-size:13px;color:#B91C1C;margin:4px 0 0;display:none"></p>'+
        '<div style="display:flex;gap:10px;align-items:center;margin-top:8px;flex-wrap:wrap"><button class="atl-btn atl-btn-primary" onclick="practiceCheck('+pi+')">검수 받기</button>'+
          '<span id="pr-saved-'+pi+'" style="font-size:13px;color:'+SUB+'">'+(p.savedAt?'<span class="material-symbols-outlined" style="font-size:15px;vertical-align:-3px">cloud_done</span> 저장됨 · '+hm(p.savedAt):'')+'</span>'+
        '<span style="font-size:13px;color:'+SUB+';background:#F8FAFC;padding:6px 10px"><span class="material-symbols-outlined" style="font-size:15px;vertical-align:-3px">lock</span> 정답 해석은 검수 뒤에</span></div>';
    } else if (p.st==='checking'){
      h+='<p style="font-size:15px;line-height:1.6;margin:0 0 10px;padding:10px 12px;background:#F8FAFC">'+esc(p.mine)+'</p>'+
        '<p style="font-size:14px;color:#1A3FB5;background:#EEF2FD;padding:10px 12px;margin:0"><span class="material-symbols-outlined animate-spin" style="font-size:16px;vertical-align:-3px">progress_activity</span> 아이맥이 검수하는 중 · 40~60초 · 그동안 다음 문단 쓰기 <a onclick="practiceCheck('+pi+',true)" style="margin-left:8px;color:'+SUB+';cursor:pointer;text-decoration:underline">다시 맡기기</a></p>';
    } else {
      var c=p.check||{};
      h+=lab('내 해석')+'<p style="font-size:15px;line-height:1.6;margin:0;padding:10px 12px;background:#F8FAFC">'+esc(p.mine)+'</p>'+
        (c.summary?'<p style="font-size:17px;line-height:1.7;font-weight:600;margin:20px 0 0;padding:16px 20px;background:#F5F8FF;color:#18181B">'+esc(c.summary)+'</p>':'')+
        ((c.unknown||[]).length?lab('모른다고 한 것 · 내 추측')+c.unknown.map(function(u){
          return '<p style="font-size:16px;line-height:1.7;margin:0 0 10px;display:flex;gap:10px;align-items:center;flex-wrap:wrap">'+chip(u.hit?'ok':'miss')+'<b>'+esc(u.w)+'</b> <span style="color:'+SUB+'">'+esc(u.guess||'추측 없음')+'</span> → '+esc(u.right)+'</p>';
        }).join(''):'')+
        (c.sents&&c.sents.length?lab('문장별 비교 · '+c.sents.length)+'<div style="display:flex;flex-direction:column;gap:20px">'+c.sents.map(function(st,i){
          return '<div style="padding:22px 24px;border:1px solid '+LINE+';background:#FCFCFD">'+
            '<div style="display:flex;gap:12px;margin:0 0 14px"><span style="flex:none;font-size:13px;font-weight:700;color:#475569;padding-top:4px">'+(i+1)+'</span><p style="font-size:18px;line-height:1.6;font-weight:600;color:#18181B;margin:0">'+esc(st.en)+'</p></div>'+
            pair(st.right, st.mine, st.type||'ok')+(st.points||[]).map(point).join('')+'</div>';
        }).join('')+'</div>':'')+
        (!(c.sents&&c.sents.length)&&(c.items||[]).length?lab('검수 · '+c.items.length)+'<div style="display:flex;flex-direction:column;gap:20px">'+c.items.map(function(it){
          return '<div style="padding:22px 24px;border:1px solid '+LINE+';background:#FCFCFD">'+
            '<p style="font-size:18px;line-height:1.6;font-weight:600;color:#18181B;margin:0 0 14px">'+esc(it.en)+'</p>'+
            pair(it.right, it.mine, it.type)+(it.key||it.note?point(it):'')+'</div>';
        }).join('')+'</div>':'')+
        lab('문단 전체 정답 해석')+'<p style="font-size:16px;line-height:1.85;margin:0;color:#18181B;padding:18px 20px;border:1px solid '+LINE+'">'+esc(ko)+'</p>'+
        sayBlock(s, pi, p);
    }
    return h+'</div>';
  }

  // ④ 되말하기 — 한국어만 보고 영어로
  function sayBlock(s, pi, p){
    var says=p.says||((p.check||{}).say)||[];
    if (!says.length) return '';
    return lab('④ 되말하기 · 한국어만 보고 영어로 (원문 다시 보지 말고)')+says.map(function(x,i){
      var said=x.said!=null;
      return '<div style="border:1px solid '+LINE+';padding:12px 14px;margin:0 0 8px">'+
        '<p style="font-size:15px;margin:0 0 8px">'+esc(x.ko)+'</p>'+
        (said?'<p style="font-size:14px;margin:0 0 4px"><span style="color:'+SUB+'">내가 한 말</span> '+esc(x.said)+'</p>'+
          '<p style="font-size:14px;margin:0"><span style="color:'+SUB+'">원문</span> '+diff(x.en, x.said)+' '+(typeof _esSpk==='function'?_esSpk(x.en,'en-US'):'')+'</p>'+
          '<p style="font-size:13px;margin:6px 0 0;color:'+(x.score>=70?'#27500A':'#633806')+'"><b>'+x.score+'%</b> 같게 말함 · '+(x.score>=70?'좋아요':'빨간 밑줄을 넣어서 한 번 더')+' <a onclick="practiceSayReset('+pi+','+i+')" style="margin-left:8px;color:'+SUB+';cursor:pointer;text-decoration:underline">다시 말하기</a></p>'
        :'<div style="display:flex;gap:6px;flex-wrap:wrap"><button class="atl-btn atl-btn-secondary" onclick="practiceMic('+pi+','+i+',this)"><span class="material-symbols-outlined" style="font-size:16px;vertical-align:-3px">mic</span> 말하기</button>'+
          '<input id="pr-say-'+pi+'-'+i+'" placeholder="또는 영어로 타이핑" onkeydown="if(event.key===\'Enter\')practiceSay('+pi+','+i+')" style="flex:1;min-width:180px;font-size:14px;padding:6px 10px;border:1px solid #CBD5E1">'+
          '<button class="atl-btn atl-btn-secondary" onclick="practiceSay('+pi+','+i+')">비교</button></div>')+
      '</div>';
    }).join('');
  }
  function words(t){ return String(t||'').toLowerCase().replace(/[’]/g,"'").replace(/[^a-z0-9' ]+/g,' ').split(/\s+/).filter(Boolean); }
  function score(en, said){ var a=words(en), b=words(said), bag={}; b.forEach(function(w){ bag[w]=(bag[w]||0)+1; }); var hit=0; a.forEach(function(w){ if (bag[w]){ hit++; bag[w]--; } }); return a.length?Math.round(hit/a.length*100):0; }
  function diff(en, said){
    var bag={}; words(said).forEach(function(w){ bag[w]=(bag[w]||0)+1; });
    return String(en).split(/(\s+)/).map(function(tok){
      var w=words(tok)[0]; if (!w) return esc(tok);
      if (bag[w]){ bag[w]--; return esc(tok); }
      return '<span style="border-bottom:2px solid #E24B4A">'+esc(tok)+'</span>';
    }).join('');
  }

  // 실시간 동기화 — 다른 기기에서 쓰는 글·도착한 검수가 이 화면에 바로 (지금 내가 커서 둔 칸은 안 건드림)
  var live={ id:null, unsub:null };
  function watch(s){
    if (live.id===s._id && live.unsub) return;
    if (live.unsub) live.unsub();
    live.id=s._id;
    live.unsub=db.collection('englishStudy').doc(s._id).onSnapshot(function(snap){
      if (snap.metadata.hasPendingWrites) return;
      var x=doc(live.id);
      if (!x || _esOpenId!==live.id || _esView!=='practice'){ live.unsub(); live.unsub=null; live.id=null; return; }
      var rp=(snap.get('practice')||{}).paras||{}, r=zoneRange(x);
      Object.keys(rp).forEach(function(k){
        var pi=+k, a=rp[k], b=P(x,pi), key=x._id+':'+pi;
        var ta=document.getElementById('pr-ta-'+pi), focused=ta && document.activeElement===ta;
        if (timers[key] || focused){ return; }   // 이 기기에서 쓰는 중이면 내 것이 우선
        var stChanged=a.st!==b.st || JSON.stringify(a.says||null)!==JSON.stringify(b.says||null) || JSON.stringify(a.unk||[])!==JSON.stringify(b.unk||[]);
        var mineChanged=(a.mine||'')!==(b.mine||'');
        x.practice.paras[pi]=a; delete drafts[key];
        if (pi<r[0] || pi>=r[1]) return;
        if (stChanged) paint(x,pi);
        else if (mineChanged && ta){ ta.value=a.mine||''; var el=document.getElementById('pr-saved-'+pi); if (el && a.savedAt) el.innerHTML='<span class="material-symbols-outlined" style="font-size:15px;vertical-align:-3px">sync</span> 다른 기기에서 · '+hm(a.savedAt); }
      });
      if (typeof snap.get('practice')==='object' && snap.get('practice').zone!=null && snap.get('practice').zone!==zoneOf(x)){ x.practice.zone=snap.get('practice').zone; }
    }, function(e){ console.warn('[practice live]', e); live.unsub=null; live.id=null; });
  }
  window.renderListenPractice=function(s){
    try { watch(s); } catch(e){}
    // 이 기기에만 남은(저장 못 한) 글이 있으면 되살림
    paras(s).forEach(function(_, pi){ var k=s._id+':'+pi; try { var v=localStorage.getItem('atelier_pr_'+k); if (v!=null && v!==(((s.practice||{}).paras||{})[pi]||{}).mine && drafts[k]==null){ drafts[k]=v; timers[k]=setTimeout(function(){ flush(s, pi); }, 400); } } catch(e){} });
    if (!paras(s).length) return typeof _esWaitOrMake==='function' ? _esWaitOrMake(s,'translate','전체 해석') : '';
    if (zoneOf(s)>=paras(s).length) pr(s).zone=0;
    var r=zoneRange(s), h='<div id="pr-root" style="max-width:860px">'+
      '<p style="font-size:14px;color:'+SUB+';margin:0 0 10px">집중 구간 하나 = 10문단(오디오 6~7분) · 하루 하나면 충분해요</p>'+zoneBar(s)+head(s);
    var resume=-1; for (var j=r[0];j<r[1];j++){ var pj=pr(s).paras[j]; if (pj && pj.st!=='said'){ resume=j; break; } }
    if (resume>r[0]) h+='<button class="atl-btn atl-btn-secondary" style="margin:0 0 14px" onclick="var e=document.getElementById(\'pr-'+resume+'\');if(e)e.scrollIntoView({behavior:\'smooth\',block:\'start\'})">이어서 하기 · 문단 '+(resume+1)+' →</button>';
    for (var i=r[0];i<r[1];i++) h+=card(s,i);
    var next=r[1]<paras(s).length;
    return h+'<div style="border-top:1px solid '+LINE+';padding-top:14px">'+(next?'<button class="atl-btn atl-btn-secondary" onclick="practiceZone('+r[1]+')">다음 구간 '+(r[1]+1)+'–'+Math.min(r[1]+ZONE,paras(s).length)+'</button>':'')+'</div></div>';
  };
  function paint(s, pi){ var el=document.getElementById('pr-'+pi); if (el) el.outerHTML=card(s,pi); var hd=document.getElementById('pr-head'); if (hd) hd.outerHTML=head(s); }

  // ── 동작 ──
  window.practiceZone=function(z){
    var s=cur(); if (!s) return; pr(s).zone=z; save(s,{ zone:z });
    if (typeof openStudyDetail==='function') openStudyDetail(s._id,'practice');
  };
  function hm(t){ var d=new Date(t); return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'); }
  // 쓰는 대로 0.7초 뒤 자동 저장 + '중간 저장' 버튼은 바로 · 창을 닫거나 탭을 옮겨도 남은 건 밀어 넣음
  function flush(s, pi, manual){
    var k=s._id+':'+pi; clearTimeout(timers[k]); delete timers[k];
    var p=P(s,pi), v=drafts[k]!=null?drafts[k]:(p.mine||'');
    p.mine=v; if (!p.st) p.st='draft'; p.savedAt=new Date().toISOString();
    var el=document.getElementById('pr-saved-'+pi);
    return save(s,{ paras:{ [pi]:{ mine:v, unk:p.unk||[], st:p.st, savedAt:p.savedAt } } }).then(function(){
      try { if (drafts[k]==null || drafts[k]===v) localStorage.removeItem('atelier_pr_'+k); } catch(e){}
      if (el) el.innerHTML='<span class="material-symbols-outlined" style="font-size:15px;vertical-align:-3px">cloud_done</span> 저장됨 · '+hm(p.savedAt);
      var hd=document.getElementById('pr-head'); if (hd) hd.outerHTML=head(s);
    });
  }
  window.practiceDraft=function(pi, v){
    var s=cur(); if (!s) return; var k=s._id+':'+pi; drafts[k]=v;
    var e=document.getElementById('pr-err-'+pi); if (e) e.style.display='none';
    var el=document.getElementById('pr-saved-'+pi); if (el) el.textContent='저장 중…';
    try { localStorage.setItem('atelier_pr_'+k, v); } catch(e){}   // 끊겨도 이 기기엔 남게
    clearTimeout(timers[k]); timers[k]=setTimeout(function(){ flush(s, pi); }, 400);
  };
  function flushAll(){ var s=cur(); if (!s) return; Object.keys(timers).forEach(function(k){ var i=k.indexOf(':'); if (i>0 && k.slice(0,i)===s._id) flush(s, +k.slice(i+1)); }); }
  document.addEventListener('visibilitychange', function(){ if (document.visibilityState==='hidden') flushAll(); });
  window.addEventListener('pagehide', flushAll);
  window.practiceGuess=function(pi, i, v){
    var s=cur(); if (!s) return; var p=P(s,pi); if (!p.unk||!p.unk[i]) return; p.unk[i].guess=v;
    var k=s._id+':'+pi; clearTimeout(timers[k]); timers[k]=setTimeout(function(){ flush(s, pi); }, 700);
  };
  window.practiceUnkDel=function(pi, i){
    var s=cur(); if (!s) return; var p=P(s,pi); (p.unk||[]).splice(i,1); save(s,{ paras:{ [pi]:{ unk:p.unk } } }); paint(s,pi);
  };
  window.practiceCheck=async function(pi, again){
    var s=cur(); if (!s) return; var p=P(s,pi), k=s._id+':'+pi;
    var mine=(drafts[k]!=null?drafts[k]:(p.mine||'')).trim();
    if (mine.length<8){ var e=document.getElementById('pr-err-'+pi); if (e){ e.textContent='먼저 내 해석을 써 주세요 (한 줄이라도)'; e.style.display='block'; } return; }
    clearTimeout(timers[k]); p.mine=mine; p.st='checking'; delete drafts[k];
    var para=paras(s)[pi];
    try {
      await save(s,{ paras:{ [pi]:{ mine:mine, unk:p.unk||[], st:'checking' } } });
      await db.collection('aiJobs').add({ kind:'study', mode:'check', status:'queued', docId:s._id, pi:pi, transcript:plain(para.en), refKo:para.ko, mine:mine, unk:(p.unk||[]).map(function(u){ return { w:u.w, guess:u.guess||'' }; }),
        date:s.date||new Date().toISOString().slice(0,10), title:'문단 '+(pi+1)+' · '+(s.title||''), model:'sonnet', createdAt:new Date().toISOString() });
      if (typeof watchAiJobs==='function') watchAiJobs();
      if (again) toast('schedule','다시 맡겼어요');
    } catch(e){ toast('error','맡기기 실패: '+e.message); p.st='draft'; }
    paint(s,pi);
  };
  // 아이맥 검수 도착 → 그 문단만 다시 그림 (다른 문단에 쓰던 글 안 날아가게) + 대충·놓침은 My Words 로
  window.listenPracticeDone=async function(j){
    try {
      var snap=await db.collection('englishStudy').doc(j.docId).get(); if (!snap.exists) return;
      var s=doc(j.docId); if (!s) return;
      s.practice=snap.get('practice')||{};
      var p=(s.practice.paras||{})[j.pi]; if (!p) return;
      await toWords(s, j.pi, p);
      if (_esOpenId===j.docId && _esView==='practice') paint(s, j.pi);
      else toast('check_circle','검수 도착 · 문단 '+(j.pi+1));
    } catch(e){ console.warn('[practice] done', e); }
  };
  async function toWords(s, pi, p){
    var c=p.check||{}; if (p.wordsAdded || !(c.items||c.sents)) return;
    var flat=c.sents?[].concat.apply([],c.sents.map(function(st){ return (st.points||[]).map(function(pt){ return { type:pt.type||st.type, key:pt.key, keyKo:pt.keyKo, en:st.en }; }); })):(c.items||[]);
    var add={}, day=new Date().toISOString().slice(0,10);
    flat.filter(function(it){ return it.type!=='ok' && it.key && it.key.split(/\s+/).length<=5; }).forEach(function(it){ add[String(it.key).toLowerCase().trim()]={ w:it.key, ko:it.keyKo||it.right||'', en:'', ex:'', ctx:it.en, src:'practice:'+s._id, title:s.title||'', added:day, box:0, due:0 }; });
    (c.unknown||[]).filter(function(u){ return !u.hit; }).forEach(function(u){ add[String(u.w).toLowerCase().trim()]={ w:u.w, ko:u.right||'', en:'', ex:'', ctx:'', src:'practice:'+s._id, title:s.title||'', added:day, box:0, due:0 }; });
    p.wordsAdded=true;
    try {
      if (Object.keys(add).length) await db.collection('englishRead').doc('state').set({ words:add }, { merge:true });
      await save(s,{ paras:{ [pi]:{ wordsAdded:true } } });
    } catch(e){ console.warn(e); }
  }
  function sayDone(s, pi, i, said){
    var p=P(s,pi); p.says=(p.says||((p.check||{}).say)||[]).map(function(x){ return Object.assign({}, x); });
    var x=p.says[i]; if (!x) return;
    x.said=said; x.score=score(x.en, said); x.at=new Date().toISOString();
    var all=p.says.every(function(y){ return y.said!=null; });
    var upd={ says:p.says };
    if (all){ p.st='said'; p.saidAt=x.at; upd.st='said'; upd.saidAt=x.at; }
    save(s,{ paras:{ [pi]: upd } });
    paint(s,pi);
    if (all){ var r=zoneRange(s), ps=pr(s).paras, fin=true; for (var k=r[0];k<r[1];k++) if ((ps[k]||{}).st!=='said') fin=false; if (fin) toast('celebration','구간 끝! 이번 주 '+practiceWeek().zones+'구간'); }
  }
  window.practiceSay=function(pi, i){
    var s=cur(); if (!s) return; var el=document.getElementById('pr-say-'+pi+'-'+i); var v=el?el.value.trim():'';
    if (!v){ if (el){ el.style.borderColor='#E24B4A'; el.placeholder='먼저 영어로 말하거나 써 주세요'; } return; }
    sayDone(s, pi, i, v);
  };
  window.practiceSayReset=function(pi, i){
    var s=cur(); if (!s) return; var p=P(s,pi); if (!p.says||!p.says[i]) return;
    p.says[i]=Object.assign({}, p.says[i]); delete p.says[i].said; delete p.says[i].score; delete p.says[i].at;
    if (p.st==='said') p.st='checked';
    save(s,{ paras:{ [pi]:{ says:p.says, st:p.st } } }); paint(s,pi);
  };
  var rec=null;
  window.practiceMic=function(pi, i, btn){
    var R=window.SpeechRecognition||window.webkitSpeechRecognition;
    if (!R){ toast('mic_off','이 브라우저는 음성 인식이 안 돼요 · 타이핑으로'); return; }
    if (rec){ try{ rec.stop(); }catch(e){} rec=null; return; }
    rec=new R(); rec.lang='en-US'; rec.interimResults=true; rec.continuous=true;
    var input=document.getElementById('pr-say-'+pi+'-'+i), finalT='';
    btn.innerHTML='<span class="material-symbols-outlined" style="font-size:16px;vertical-align:-3px;color:#E24B4A">stop_circle</span> 다 말했으면 누르기';
    rec.onresult=function(e){ var t=''; for (var k=e.resultIndex;k<e.results.length;k++){ if (e.results[k].isFinal) finalT+=e.results[k][0].transcript+' '; else t+=e.results[k][0].transcript; } if (input) input.value=(finalT+t).trim(); };
    rec.onerror=function(e){ toast('mic_off','음성 인식 오류: '+e.error); };
    rec.onend=function(){ rec=null; var v=input?input.value.trim():''; if (v) practiceSay(pi,i); else btn.innerHTML='<span class="material-symbols-outlined" style="font-size:16px;vertical-align:-3px">mic</span> 말하기'; };
    rec.start();
  };

  // 드래그 → '모름' 칩 (정답은 안 보여줌)
  function onSelect(){
    var sel=window.getSelection(); if (!sel || sel.isCollapsed) return;
    var raw=sel.toString().replace(/\s+/g,' ').trim().replace(/^[^A-Za-z']+|[^A-Za-z']+$/g,'');
    if (!raw || raw.length>80 || raw.split(' ').length>8) return;
    var n=sel.anchorNode && (sel.anchorNode.nodeType===1?sel.anchorNode:sel.anchorNode.parentElement); n=n&&n.closest('.pr-en'); if (!n) return;
    var s=cur(); if (!s) return; var pi=+n.getAttribute('data-pi'), p=P(s,pi);
    if (done(p) || p.st==='checking') return;
    p.unk=p.unk||[];
    if (!p.unk.some(function(u){ return u.w.toLowerCase()===raw.toLowerCase(); })){ p.unk.push({ w:raw, guess:'' }); save(s,{ paras:{ [pi]:{ unk:p.unk } } }); }
    sel.removeAllRanges(); paint(s,pi);
    var ins=document.querySelectorAll('#pr-'+pi+' input'); if (ins.length) ins[ins.length-1].focus();
  }
  document.addEventListener('mouseup', function(e){ if (e.target.closest && e.target.closest('.pr-en')) setTimeout(onSelect, 10); });
  document.addEventListener('touchend', function(e){ if (e.target.closest && e.target.closest('.pr-en')) setTimeout(onSelect, 300); });
})();
