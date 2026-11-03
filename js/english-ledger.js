// ═══ ENGLISH › Mistakes — 실수 장부 하나로 (2026-11-03) ═══
// 실수가 다섯 군데서 따로 나오던 걸 한 장부로 모은다. 원본은 그대로 두고 여기서 읽어서 합친다.
//   말하기 : englishSessions[].upgrades (Annie·Oliver 자세한 리뷰의 '고쳐 말하기') + tutorSessions[].mistakes (자세한 리뷰가 없는 Oliver 수업만)
//   해석   : englishStudy[].practice.paras.*.check.sents[].points (Listen 직접 해석 검수의 대충·놓침)
//   발음   : tutorSessions[].pron (Oliver 가 수업 중 조용히 남긴 발음 메모)
// 내 기록: Firestore englishLedger/state { marks:{id:{hit,miss,lastAt,status}}, targets:[{id,fix,ko,said}] }
//   targets = 다음 Oliver 수업에서 쓰게 유도할 3개 — tutorMemory(profile) 가 읽어 Oliver 에게 넘기고, 수업이 끝나면(finish) 썼는지 판정해 hit 를 올린다
// 되말하기: 한국어만 보고 영어로 말하기/쓰기 → 단어 일치 75% 이상이면 맞힘. 맞힘 2번(마지막이 맞힘)이면 '내 것'
(function(){
  var LS='atelier_ledger_v1', ACC='#1F4BD8', ACC_D='#1A3FB5', ACC_L='#EEF2FD', LINE='#E2E8F0', SUB='#475569', INK='#0F172A', BAD='#E24B4A', OK='#15803d', OK_L='#ECFDF3';
  var PASS=75, TARGETS=3, QUIZ_N=5;
  var LS_ST={ items:[], marks:{}, targets:[], loaded:false, loading:null, filter:'all', quiz:null, open:{} };
  var S=LS_ST;
  var KIND={ say:{ label:'말하기', icon:'record_voice_over' }, read:{ label:'해석', icon:'menu_book' }, pron:{ label:'발음', icon:'graphic_eq' } };

  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function strip(h){ var d=document.createElement('div'); d.innerHTML=String(h||''); return (d.textContent||'').replace(/\s+/g,' ').trim(); }
  function unq(s){ return strip(s).replace(/^["“”']+|["“”']+$/g,'').trim(); }
  function fb(){ return (typeof db!=='undefined' && db) ? db : null; }
  function toast(icon,msg){ if (typeof showSyncToast==='function') showSyncToast('<span class="material-symbols-outlined text-sm mr-1">'+icon+'</span> '+msg); }
  function norm(s){ return String(s||'').toLowerCase().replace(/[^a-z0-9' ]+/g,' ').replace(/\s+/g,' ').trim(); }
  function hash(s){ var h=5381; for (var i=0;i<s.length;i++) h=((h<<5)+h+s.charCodeAt(i))|0; return (h>>>0).toString(36); }
  function words(s){ return norm(s).split(' ').filter(Boolean); }
  function score(en, said){ var a=words(en), b=words(said), bag={}; b.forEach(function(w){ bag[w]=(bag[w]||0)+1; }); var hit=0; a.forEach(function(w){ if (bag[w]){ hit++; bag[w]--; } }); return a.length?Math.round(hit/a.length*100):0; }
  function diff(en, said){
    var bag={}; words(said).forEach(function(w){ bag[w]=(bag[w]||0)+1; });
    return String(en).split(/(\s+)/).map(function(tok){
      var w=words(tok)[0]; if (!w) return esc(tok);
      if (bag[w]){ bag[w]--; return esc(tok); }
      return '<span style="border-bottom:3px solid '+BAD+'">'+esc(tok)+'</span>';
    }).join('');
  }

  // ── 원본 읽어서 합치기
  async function gather(){
    var d=fb(); if (!d) return [];
    var got=await Promise.all([
      d.collection('englishSessions').get().catch(function(){ return null; }),
      d.collection('tutorSessions').get().catch(function(){ return null; }),
      d.collection('englishStudy').get().catch(function(){ return null; })
    ]);
    var out={}, reviewed={};
    function add(it){
      if (!it.fix) return;
      it.id=it.kind[0]+hash(it.kind+'|'+norm(it.fix));
      var o=out[it.id];
      if (o){ o.n++; if ((it.date||'')>(o.date||'')){ o.date=it.date; o.said=it.said||o.said; } return; }
      it.n=1; out[it.id]=it;
    }
    if (got[0]) got[0].forEach(function(doc){
      var x=doc.data(), src=x.tutor==='Oliver'?'Oliver':'Annie', date=x.date||doc.id.slice(0,10);
      if (src==='Oliver') reviewed[date]=true;
      (x.upgrades||[]).forEach(function(u){
        add({ kind:'say', src:src, date:date, ref:doc.id, title:x.title||'', said:unq(u.bad), fix:unq(u.ok), ko:strip(u.okKr), gem:unq(u.gem), gemKo:strip(u.gemKr), why:strip(u.noteKr||u.note) });
      });
    });
    if (got[1]) got[1].forEach(function(doc){
      var x=doc.data(), date=x.date||'';
      if (!reviewed[date]) (x.mistakes||[]).forEach(function(m){ add({ kind:'say', src:'Oliver', date:date, ref:'', title:x.topic||'', said:unq(m.said), fix:unq(m.better), ko:strip(m.betterKo), why:strip(m.why) }); });
      (x.pron||[]).forEach(function(p){ add({ kind:'pron', src:'Oliver', date:date, ref:'', title:x.topic||'', said:strip(p.heard), fix:strip(p.word), ko:'', why:strip(p.tip) }); });
    });
    if (got[2]) got[2].forEach(function(doc){
      var x=doc.data(), ps=(x.practice||{}).paras||{};
      Object.keys(ps).forEach(function(pi){
        var c=ps[pi]&&ps[pi].check; if (!c||!c.sents) return;
        var date=String(ps[pi].checkedAt||x.date||x.createdAt||'').slice(0,10);
        c.sents.forEach(function(st){ (st.points||[]).forEach(function(pt){
          if (pt.type==='ok') return;
          add({ kind:'read', src:'Listen', date:date, ref:doc.id, title:x.title||'', said:strip(st.en), fix:strip(pt.key), ko:strip(pt.keyKo), why:strip(pt.note), use:strip(pt.use), useKo:strip(pt.useKo), type:pt.type });
        }); });
      });
    });
    return Object.keys(out).map(function(k){ return out[k]; });
  }

  function cacheSave(){ try { localStorage.setItem(LS, JSON.stringify({ marks:S.marks, targets:S.targets })); } catch(e){} }
  var _t, _dirty={};
  function save(ids){
    (ids||[]).forEach(function(id){ _dirty[id]=1; });
    cacheSave(); clearTimeout(_t);
    _t=setTimeout(async function(){
      var d=fb(); if (!d) return; var m={}; Object.keys(_dirty).forEach(function(id){ if (S.marks[id]) m[id]=S.marks[id]; }); _dirty={};
      try { await d.collection('englishLedger').doc('state').set({ marks:m, targets:S.targets, updatedAt:new Date().toISOString() }, { merge:true }); }
      catch(e){ console.warn('[Ledger] save', e); }
    }, 500);
  }
  async function load(force){
    if (S.loaded && !force) return;
    if (S.loading) return S.loading;
    S.loading=(async function(){
      try { var c=JSON.parse(localStorage.getItem(LS)||'null'); if (c){ S.marks=c.marks||{}; S.targets=c.targets||[]; } } catch(e){}
      var d=fb();
      if (d){ try { var st=await d.collection('englishLedger').doc('state').get(); if (st.exists){ var o=st.data(); S.marks=o.marks||{}; S.targets=o.targets||[]; cacheSave(); } } catch(e){ console.warn('[Ledger] load', e); } }
      S.items=await gather();
      S.loaded=true;
    })();
    try { await S.loading; } finally { S.loading=null; }
  }

  // ── 상태: new(아직 안 해 봄) · practice(연습 중) · mine(내 것) · hide
  function mark(id){ return S.marks[id]||{}; }
  function status(it){
    var m=mark(it.id);
    if (m.status==='hide' || m.status==='mine') return m.status;
    if ((m.hit||0)>=2 && m.last==='hit') return 'mine';
    return (m.hit||m.miss) ? 'practice' : 'new';
  }
  // 자꾸 틀린 것 → 최근 것 순
  function weight(it){ var m=mark(it.id); return (m.miss||0)*3+(it.n-1)*2-(m.hit||0)*2; }
  function sorted(list){ return list.slice().sort(function(a,b){ return weight(b)-weight(a) || (b.date||'').localeCompare(a.date||''); }); }
  function live(){ return S.items.filter(function(it){ var s=status(it); return s!=='hide' && s!=='mine'; }); }
  function byId(id){ for (var i=0;i<S.items.length;i++) if (S.items[i].id===id) return S.items[i]; return null; }

  // Oliver 목표 3개: 고른 것 중 아직 '내 것'이 아닌 것 + 모자라면 자동으로 채움(말하기, 자꾸 틀림 → 최근)
  function fillTargets(){
    var keep=S.targets.filter(function(t){ var it=byId(t.id); return it && status(it)!=='mine' && status(it)!=='hide'; });
    var have={}; keep.forEach(function(t){ have[t.id]=1; });
    sorted(live().filter(function(it){ return it.kind==='say' && it.fix.split(' ').length<=24; })).some(function(it){
      if (keep.length>=TARGETS) return true;
      if (!have[it.id]) keep.push({ id:it.id, fix:it.fix, ko:it.ko, said:it.said, auto:true });
      return false;
    });
    var changed=JSON.stringify(keep.map(function(t){ return t.id; }))!==JSON.stringify(S.targets.map(function(t){ return t.id; }));
    S.targets=keep; if (changed) save([]);
  }

  // ── 화면
  function chip(txt, bg, fg, icon){ return '<span style="display:inline-flex;align-items:center;gap:4px;font-size:13px;font-weight:700;padding:3px 10px;background:'+bg+';color:'+fg+'">'+(icon?'<span class="material-symbols-outlined" style="font-size:15px">'+icon+'</span>':'')+esc(txt)+'</span>'; }
  function stChip(s){ return s==='mine'?chip('내 것',OK_L,OK,'check_circle'):s==='practice'?chip('연습 중','#FFF7E6','#B45309'):chip('새로',ACC_L,ACC_D); }
  function meter(it){
    var m=mark(it.id), h=m.hit||0, x=m.miss||0; if (!h && !x) return '';
    var cells=''; for (var i=0;i<Math.min(h+x,8);i++) cells+='<i style="display:inline-block;width:8px;height:16px;margin-right:2px;background:'+(i<x?BAD:OK)+'"></i>';
    return '<span style="display:inline-flex;align-items:center;gap:8px;font-size:13px;color:'+SUB+'">'+cells+' 틀림 '+x+' · 맞힘 '+h+'</span>';
  }
  function card(it, compact){
    var s=status(it), m=mark(it.id), isT=S.targets.some(function(t){ return t.id===it.id; }), open=S.open[it.id];
    var bar=s==='mine'?OK:(m.miss?BAD:s==='practice'?'#F59E0B':ACC);
    var h='<div style="border:1px solid '+LINE+';border-left:5px solid '+bar+';background:#fff;padding:20px 22px;'+(s==='hide'?'opacity:.5':'')+'">';
    h+='<div style="display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-bottom:14px">'+chip(KIND[it.kind].label, '#F1F5F9', '#334155', KIND[it.kind].icon)+stChip(s)
      +'<span style="font-size:13px;color:'+SUB+'">'+esc(it.src)+' · '+esc(it.date||'')+(it.n>1?' · <b style="color:'+BAD+'">'+it.n+'번 나옴</b>':'')+'</span><span style="flex:1"></span>'+meter(it)+'</div>';
    if (it.kind==='say'){
      if (it.said) h+='<div style="font-size:15px;line-height:1.7;color:'+SUB+';text-decoration:line-through;text-decoration-color:'+BAD+'99;margin-bottom:8px">'+esc(it.said)+'</div>';
      h+='<div style="font-size:19px;font-weight:600;line-height:1.6;color:'+INK+'">'+esc(it.fix)+'</div>';
      if (it.ko) h+='<div style="font-size:16px;line-height:1.7;color:#334155;margin-top:6px">'+esc(it.ko)+'</div>';
    } else if (it.kind==='read'){
      h+='<div style="font-size:19px;font-weight:700;color:'+ACC_D+'">'+esc(it.fix)+(it.ko?' <span style="font-weight:500;color:#334155;font-size:16px">· '+esc(it.ko)+'</span>':'')+'</div>';
      if (it.said) h+='<div style="font-size:15px;line-height:1.75;color:'+SUB+';margin-top:8px">'+esc(it.said)+'</div>';
    } else {
      h+='<div style="font-size:19px;font-weight:700;color:'+INK+'">'+esc(it.fix)+(it.said?' <span style="font-weight:500;color:'+BAD+';font-size:16px">· 이렇게 들렸어요: '+esc(it.said)+'</span>':'')+'</div>';
    }
    if (!compact && (it.why || it.gem || it.use)){
      if (open){
        if (it.why) h+='<div style="font-size:15px;line-height:1.85;color:#334155;margin-top:14px">'+esc(it.why)+'</div>';
        if (it.gem) h+='<div style="margin-top:12px;padding:12px 16px;background:'+ACC_L+';font-size:15px;line-height:1.7"><b style="color:'+ACC_D+'">💎 C1</b> '+esc(it.gem)+(it.gemKo?'<div style="color:'+SUB+';margin-top:4px">'+esc(it.gemKo)+'</div>':'')+'</div>';
        if (it.use) h+='<div style="margin-top:12px;padding:12px 16px;background:'+ACC_L+';font-size:15px;line-height:1.7"><b style="color:'+ACC_D+'">실제 쓰임</b> '+esc(it.use)+(it.useKo?'<div style="color:'+SUB+';margin-top:4px">'+esc(it.useKo)+'</div>':'')+'</div>';
      }
      h+='<button onclick="ledgerToggle(\''+it.id+'\')" style="margin-top:12px;font-size:14px;font-weight:700;color:'+ACC+';background:none;border:0;padding:0;cursor:pointer">'+(open?'접기':'왜 틀렸는지 보기')+'</button>';
    }
    if (!compact){
      h+='<div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:16px">'
        +(it.kind==='say'?btn(isT?'Oliver 목표에서 빼기':'Oliver 목표로', 'ledgerTarget(\''+it.id+'\')', isT?'star':'star_outline', isT):'')
        +(s!=='mine'?btn('이미 내 것','ledgerSet(\''+it.id+'\',\'mine\')','check'):btn('다시 연습','ledgerSet(\''+it.id+'\',\'\')','undo'))
        +(s!=='hide'?btn('숨기기','ledgerSet(\''+it.id+'\',\'hide\')','visibility_off'):btn('다시 보이기','ledgerSet(\''+it.id+'\',\'\')','visibility'))
        +'</div>';
    }
    return h+'</div>';
  }
  function btn(t, on, icon, solid){ return '<button onclick="'+on+'" style="display:inline-flex;align-items:center;gap:6px;font-size:14px;font-weight:600;padding:8px 14px;border:1px solid '+(solid?ACC:'#CBD5E1')+';background:'+(solid?ACC:'#fff')+';color:'+(solid?'#fff':'#334155')+';cursor:pointer"><span class="material-symbols-outlined" style="font-size:17px">'+icon+'</span>'+esc(t)+'</button>'; }

  function stats(){
    var c={ new:0, practice:0, mine:0, hide:0 }; S.items.forEach(function(it){ c[status(it)]++; }); return c;
  }
  function head(){
    var c=stats(), tot=c.new+c.practice+c.mine||1;
    var seg=function(n,col){ return n?'<div style="flex:'+n+';background:'+col+'"></div>':''; };
    var h='<div style="display:flex;flex-wrap:wrap;align-items:flex-end;gap:24px;margin-bottom:14px">'
      +'<div><div style="font-size:14px;font-weight:700;color:'+SUB+';letter-spacing:.04em">MISTAKE LOG</div><div style="font-size:30px;font-weight:800;color:'+INK+';line-height:1.2">실수 장부</div></div>'
      +['practice','new','mine'].map(function(k){ var lab={practice:'연습 중',new:'아직 안 해 봄',mine:'내 것'}[k], col={practice:'#B45309',new:ACC_D,mine:OK}[k];
          return '<div><div style="font-size:28px;font-weight:800;color:'+col+'">'+c[k]+'</div><div style="font-size:13px;color:'+SUB+';font-weight:600">'+lab+'</div></div>'; }).join('')
      +'<span style="flex:1"></span>'
      +'<button onclick="ledgerQuiz()" style="display:inline-flex;align-items:center;gap:8px;font-size:17px;font-weight:700;padding:14px 22px;background:'+ACC+';color:#fff;border:0;cursor:pointer"><span class="material-symbols-outlined">mic</span>되말하기 '+QUIZ_N+'문제</button></div>';
    h+='<div style="display:flex;height:10px;margin-bottom:8px">'+seg(c.mine,OK)+seg(c.practice,'#F59E0B')+seg(c.new,'#C7D2FE')+'</div>';
    h+='<div style="font-size:14px;color:'+SUB+';margin-bottom:28px">Annie·Oliver 리뷰의 고쳐 말하기, Listen 검수의 놓친 표현, Oliver 발음 메모를 한곳에 모았어요. 한국어만 보고 영어로 두 번 맞히면 <b style="color:'+OK+'">내 것</b>이 돼요.</div>';
    return h;
  }
  function targetsBox(){
    var h='<div style="border:2px solid '+ACC+';background:#F5F8FF;padding:22px 24px;margin-bottom:32px">'
      +'<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px"><span class="material-symbols-outlined" style="color:'+ACC+'">target</span><b style="font-size:18px;color:'+INK+'">다음 Oliver 수업 목표 '+S.targets.length+'</b></div>'
      +'<div style="font-size:14px;color:'+SUB+';margin-bottom:16px">Oliver가 대화를 이 표현이 필요한 쪽으로 끌고 가요. 수업에서 제대로 쓰면 맞힘 1번으로 쳐요. ☆로 직접 바꿀 수 있어요.</div>';
    if (!S.targets.length) h+='<div style="font-size:15px;color:'+SUB+'">고를 표현이 아직 없어요.</div>';
    h+=S.targets.map(function(t,i){
      var it=byId(t.id)||t;
      return '<div style="display:flex;gap:14px;align-items:flex-start;padding:14px 0;'+(i?'border-top:1px solid #DCE4F7':'')+'"><b style="font-size:20px;color:'+ACC+';width:22px">'+(i+1)+'</b><div style="flex:1;min-width:0">'
        +'<div style="font-size:17px;font-weight:600;line-height:1.6;color:'+INK+'">'+esc(it.fix)+'</div>'
        +(it.ko?'<div style="font-size:15px;color:#334155;margin-top:2px">'+esc(it.ko)+'</div>':'')+'</div>'
        +'<button title="목표에서 빼기" onclick="ledgerTarget(\''+t.id+'\')" style="border:0;background:none;color:'+ACC+';cursor:pointer"><span class="material-symbols-outlined">star</span></button></div>';
    }).join('');
    return h+'</div>';
  }
  function filters(){
    var c={ all:0, say:0, read:0, pron:0, mine:0, hide:0 };
    S.items.forEach(function(it){ var s=status(it); if (s==='hide') c.hide++; else if (s==='mine') c.mine++; else { c.all++; c[it.kind]++; } });
    var F=[['all','전체'],['say','말하기'],['read','해석'],['pron','발음'],['mine','내 것'],['hide','숨김']];
    return '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px">'+F.filter(function(f){ return f[0]==='all'||c[f[0]]; }).map(function(f){
      var on=S.filter===f[0];
      return '<button onclick="ledgerFilter(\''+f[0]+'\')" style="font-size:15px;font-weight:600;padding:8px 16px;border:1px solid '+(on?INK:'#CBD5E1')+';background:'+(on?INK:'#fff')+';color:'+(on?'#fff':'#334155')+';cursor:pointer">'+f[1]+' '+c[f[0]]+'</button>';
    }).join('')+'</div>';
  }
  var PAGE=30;
  function listHtml(){
    var f=S.filter, list=S.items.filter(function(it){ var s=status(it);
      if (f==='mine') return s==='mine'; if (f==='hide') return s==='hide';
      if (s==='mine'||s==='hide') return false; return f==='all'||it.kind===f; });
    list=f==='mine'||f==='hide' ? list.sort(function(a,b){ return (b.date||'').localeCompare(a.date||''); }) : sorted(list);
    var n=S.shown||PAGE;
    var h='<div style="display:flex;flex-direction:column;gap:16px">'+list.slice(0,n).map(function(it){ return card(it); }).join('')+'</div>';
    if (list.length>n) h+='<button onclick="ledgerMore()" style="margin-top:20px;width:100%;font-size:15px;font-weight:600;padding:14px;border:1px solid #CBD5E1;background:#fff;color:#334155;cursor:pointer">더 보기 · '+(list.length-n)+'개 남음</button>';
    if (!list.length) h='<div style="padding:40px 0;text-align:center;font-size:16px;color:'+SUB+'">여기엔 아직 없어요.</div>';
    return h;
  }
  function paint(){
    var el=document.getElementById('eng-ledger-view'); if (!el) return;
    if (S.quiz){ el.innerHTML=quizHtml(); var q=document.getElementById('lq-in'); if (q && !S.quiz.done && !S.quiz.cur.said) q.focus(); return; }
    el.innerHTML='<div style="max-width:880px;margin:0 auto;padding:8px 4px 60px">'+head()+targetsBox()+filters()+listHtml()+'</div>';
  }

  // ── 되말하기
  // 문제로 낼 말: 한국어 뜻이 있으면 그걸 보고 영어로, 없으면(말하기) 내가 틀린 문장을 보고 고쳐 말하기
  function ask(it){
    if (it.kind==='pron') return null;
    if (it.ko) return { lab:'이 말을 영어로 해 보세요', text:it.ko };
    if (it.kind==='say' && it.said) return { lab:'이 문장을 자연스럽게 고쳐 말해 보세요', text:it.said };
    return null;
  }
  function pickQuiz(ids){
    var pool=[], seen={};
    (ids||[]).forEach(function(id){ var it=byId(id); if (it && ask(it) && !seen[id]){ seen[id]=1; pool.push(it); } });
    var rest=live().filter(function(it){ return ask(it) && !seen[it.id] && it.fix.split(' ').length<=24; });
    // 틀린 적 있는 것 → 목표 → 최근 말하기 → 나머지
    var tg={}; S.targets.forEach(function(t){ tg[t.id]=1; });
    rest.sort(function(a,b){
      var ma=mark(a.id), mb=mark(b.id);
      return ((mb.miss||0)-(mb.hit||0)) - ((ma.miss||0)-(ma.hit||0)) || (tg[b.id]?1:0)-(tg[a.id]?1:0) || (b.kind==='say'?1:0)-(a.kind==='say'?1:0) || (b.date||'').localeCompare(a.date||'');
    });
    return pool.concat(rest).slice(0, QUIZ_N);
  }
  function quizHtml(){
    var q=S.quiz, it=q.cur;
    var top='<div style="max-width:760px;margin:0 auto;padding:8px 4px 60px"><div style="display:flex;align-items:center;gap:12px;margin-bottom:28px">'
      +'<button onclick="ledgerQuizClose()" style="display:inline-flex;align-items:center;gap:4px;font-size:15px;font-weight:600;border:0;background:none;color:'+SUB+';cursor:pointer"><span class="material-symbols-outlined">arrow_back</span>장부로</button><span style="flex:1"></span>'
      +q.list.map(function(x,i){ var r=q.res[i]; return '<i style="display:inline-block;width:34px;height:8px;background:'+(r==null?(i===q.i?ACC:'#E2E8F0'):(r?OK:BAD))+'"></i>'; }).join('')+'</div>';
    if (q.done){
      var ok=q.res.filter(Boolean).length;
      return top+'<div style="text-align:center;padding:30px 0"><div style="font-size:56px;font-weight:800;color:'+(ok>=4?OK:INK)+'">'+ok+' / '+q.list.length+'</div>'
        +'<div style="font-size:17px;color:#334155;margin:10px 0 30px">'+(ok===q.list.length?'전부 맞혔어요. 두 번 맞힌 건 내 것이 됐어요.':'틀린 건 장부 위로 올라가서 다음 되말하기에 먼저 나와요.')+'</div>'
        +q.list.map(function(x,i){ return '<div style="text-align:left;border-left:5px solid '+(q.res[i]?OK:BAD)+';padding:12px 18px;margin-bottom:10px;background:#fff;border-top:1px solid '+LINE+';border-right:1px solid '+LINE+';border-bottom:1px solid '+LINE+'"><div style="font-size:15px;color:'+SUB+'">'+esc(ask(x).text)+'</div><div style="font-size:17px;font-weight:600;color:'+INK+';margin-top:4px">'+esc(x.fix)+'</div></div>'; }).join('')
        +'<div style="display:flex;gap:10px;justify-content:center;margin-top:28px">'+btn('5문제 더','ledgerQuiz()','replay',true)+btn('장부로','ledgerQuizClose()','list')+'</div></div></div>';
    }
    var h=top+'<div style="font-size:14px;font-weight:700;color:'+SUB+'">'+(q.i+1)+' / '+q.list.length+' · '+esc(KIND[it.kind].label)+' · '+esc(it.src)+'</div>'
      +'<div style="font-size:15px;color:'+SUB+';margin:6px 0 10px">'+esc(ask(it).lab)+'</div>'
      +'<div style="font-size:26px;font-weight:700;line-height:1.55;color:'+INK+';margin-bottom:26px">'+esc(ask(it).text)+'</div>';
    if (!q.said){
      h+='<textarea id="lq-in" rows="3" placeholder="마이크로 말하거나 여기에 쓰기" onkeydown="if(event.key===\'Enter\'&&!event.shiftKey){event.preventDefault();ledgerQuizCheck();}" style="width:100%;font-size:18px;line-height:1.6;padding:16px 18px;border:2px solid #CBD5E1;outline:none;resize:vertical"></textarea>'
        +'<div style="display:flex;gap:10px;margin-top:14px"><button id="lq-mic" onclick="ledgerQuizMic(this)" style="display:inline-flex;align-items:center;gap:8px;font-size:16px;font-weight:700;padding:13px 20px;background:'+INK+';color:#fff;border:0;cursor:pointer"><span class="material-symbols-outlined">mic</span>말하기</button>'
        +btn('확인','ledgerQuizCheck()','check',true)+'<span style="flex:1"></span>'+btn('모르겠어요','ledgerQuizCheck(true)','help')+'</div>';
    } else {
      var pass=q.score>=PASS;
      h+='<div style="border-left:5px solid #94A3B8;background:#F8FAFC;padding:14px 18px;font-size:17px;line-height:1.7;color:#334155"><div style="font-size:13px;font-weight:700;color:'+SUB+';margin-bottom:4px">내가 한 말</div>'+esc(q.said||'(모르겠어요)')+'</div>'
        +'<div style="border-left:5px solid '+(pass?OK:BAD)+';background:'+(pass?OK_L:'#FEF2F2')+';padding:14px 18px;margin-top:12px;font-size:19px;font-weight:600;line-height:1.7;color:'+INK+'"><div style="font-size:13px;font-weight:700;color:'+(pass?OK:BAD)+';margin-bottom:4px">'+(pass?'맞힘':'다시')+' · 단어 일치 '+q.score+'%</div>'+diff(it.fix, q.said)+'</div>';
      if (it.why) h+='<div style="font-size:15px;line-height:1.85;color:#334155;margin-top:16px">'+esc(it.why)+'</div>';
      h+='<div style="display:flex;gap:10px;margin-top:22px">'+btn(q.i+1<q.list.length?'다음':'결과 보기','ledgerQuizNext()','arrow_forward',true)
        +(pass?'':btn('맞게 말했어요 (인식 오류)','ledgerQuizNext(true)','thumb_up'))+'</div>';
    }
    return h+'</div>';
  }
  function record(it, ok){
    var m=Object.assign({}, mark(it.id)); m[ok?'hit':'miss']=(m[ok?'hit':'miss']||0)+1; m.last=ok?'hit':'miss'; m.lastAt=new Date().toISOString();
    if (m.status==='mine' && !ok) delete m.status;
    S.marks[it.id]=m; save([it.id]);
  }

  window.ledgerQuiz=async function(ids){
    await load();
    var list=pickQuiz(ids);
    if (!list.length){ toast('info','되말하기할 표현이 아직 없어요'); return; }
    S.quiz={ list:list, i:0, res:[], cur:list[0], said:null, score:0 };
    paint(); window.scrollTo(0,0);
  };
  window.ledgerQuizCheck=function(giveUp){
    var q=S.quiz; if (!q) return; var el=document.getElementById('lq-in'); var v=giveUp?'':(el?el.value.trim():'');
    if (!giveUp && !v){ if (el){ el.style.borderColor=BAD; el.placeholder='먼저 영어로 말하거나 써 주세요'; } return; }
    q.said=v||''; q.score=giveUp?0:score(q.cur.fix, v); paint();
  };
  window.ledgerQuizNext=function(override){
    var q=S.quiz; if (!q || q.said==null) return;
    var ok=override?true:q.score>=PASS; q.res[q.i]=ok; record(q.cur, ok);
    q.i++; if (q.i>=q.list.length){ q.done=true; fillTargets(); } else { q.cur=q.list[q.i]; q.said=null; q.score=0; }
    paint();
  };
  window.ledgerQuizClose=function(){ S.quiz=null; paint(); };
  var rec=null;
  window.ledgerQuizMic=function(b){
    var R=window.SpeechRecognition||window.webkitSpeechRecognition;
    if (!R){ toast('mic_off','이 브라우저는 음성 인식이 안 돼요 · 타이핑으로'); return; }
    if (rec){ try{ rec.stop(); }catch(e){} return; }
    rec=new R(); rec.lang='en-US'; rec.interimResults=true; rec.continuous=true;
    var input=document.getElementById('lq-in'), fin='';
    b.innerHTML='<span class="material-symbols-outlined" style="color:#FCA5A5">stop_circle</span>다 말했으면 누르기';
    rec.onresult=function(e){ var t=''; for (var k=e.resultIndex;k<e.results.length;k++){ if (e.results[k].isFinal) fin+=e.results[k][0].transcript+' '; else t+=e.results[k][0].transcript; } if (input) input.value=(fin+t).trim(); };
    rec.onerror=function(e){ toast('mic_off','음성 인식 오류: '+e.error); };
    rec.onend=function(){ rec=null; if (input && input.value.trim()) ledgerQuizCheck(); else b.innerHTML='<span class="material-symbols-outlined">mic</span>말하기'; };
    rec.start();
  };

  window.ledgerToggle=function(id){ S.open[id]=!S.open[id]; paint(); };
  window.ledgerFilter=function(f){ S.filter=f; S.shown=PAGE; paint(); };
  window.ledgerMore=function(){ S.shown=(S.shown||PAGE)+PAGE; paint(); };
  window.ledgerSet=function(id, st){
    var m=Object.assign({}, mark(id)); if (st) m.status=st; else { delete m.status; if (m.last==='hit' && (m.hit||0)>=2) m.hit=1; }
    S.marks[id]=m; save([id]); fillTargets(); paint();
  };
  window.ledgerTarget=function(id){
    var i=-1; S.targets.forEach(function(t,k){ if (t.id===id) i=k; });
    if (i>=0) S.targets.splice(i,1);
    else { var it=byId(id); if (!it) return; if (S.targets.length>=TARGETS){ var a=-1; S.targets.forEach(function(t,k){ if (t.auto && a<0) a=k; }); S.targets.splice(a>=0?a:S.targets.length-1,1); } S.targets.unshift({ id:id, fix:it.fix, ko:it.ko, said:it.said }); }
    save([]); paint();
  };
  window.renderEnglishLedger=async function(force){
    var el=document.getElementById('eng-ledger-view'); if (!el) return;
    if (!S.loaded) el.innerHTML='<div style="padding:60px 0;text-align:center;font-size:16px;color:'+SUB+'">장부를 모으는 중…</div>';
    await load(force); fillTargets(); paint();
  };
  // Oliver 수업 끝(tutor.html 안)에서 '되말하기' → 그 수업 실수부터
  window.ledgerQuizFromLesson=async function(fixes){
    await load(true);
    var want={}; (fixes||[]).forEach(function(f){ want[norm(f)]=1; });
    var ids=S.items.filter(function(it){ return want[norm(it.fix)]; }).map(function(it){ return it.id; });
    if (typeof navigate==='function') navigate('english');
    if (window.switchEngTab) window.switchEngTab('ledger');
    ledgerQuiz(ids);
  };
})();
