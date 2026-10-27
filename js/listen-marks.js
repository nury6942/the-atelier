// ═══ ENGLISH › Listen › 전체 해석 — 하이라이트로 바로 풀이 (2026-10-27) ═══
// 영어 칸에서 모르는 단어·표현을 드래그하면 → 노랑 하이라이트 + 오른쪽 아래 카드
//   · 영어 사전 뜻은 바로(dictionaryapi.dev, 단어 하나일 때) · 문맥 속 한국어 풀이·예문은 아이맥(구독)이 20~40초
//   · 저장: englishStudy/<id>.marks.<key> { text, ctx, pi, status pending→done, base, ko, nuance, ex[], frame }
//   · 풀이 요청 = aiJobs { kind:'study', mode:'explain', docId, markKey, phrase, transcript:문장 } → worker.js
//   · 카드에서 My Words(Read 복습과 같은 단어장 englishRead/state.words) · + 틀(My Phrases) · 지우기
// 파란 밑줄 = 보기 전 5분(quick)의 표현·단어 — 누르면 그 뜻
(function(){
  var ACC='#1F4BD8', SUB='#475569', YEL='#FEF3C7', BLUE='#93B4F5';
  var LS={ open:null };   // 지금 카드에 띄운 것 { s, key, kind:'mark'|'quick', dict }

  function esc(t){ return String(t==null?'':t).replace(/[&<>"']/g,function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function keyOf(t){ return String(t||'').toLowerCase().replace(/[’]/g,"'").replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'').slice(0,60); }
  function toast(icon,msg){ if (typeof showSyncToast==='function') showSyncToast('<span class="material-symbols-outlined text-sm mr-1">'+icon+'</span> '+msg); }
  function doc(id){ return (typeof engStudyData!=='undefined' ? engStudyData : []).find(function(x){ return x._id===id; }); }
  function reRe(t){ return String(t).replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }
  // 찾을 말 → 정규식 조각 (단어 하나면 -s/-ed/-ing 붙은 꼴도)
  function pat(n){ var p=reRe(n).replace(/\s+/g,'\\s+'); return /\s/.test(n) ? p : p+"(?:s|es|d|ed|ing|'s)?"; }
  var TS=/Speaker\s*\d+\s*[•·]\s*((?:\d{1,2}:)?\d{1,2}:\d{2})\s*/g;   // 맥위스퍼 "Speaker 1 • 00:14"

  // 보기 전 5분 표현 → 본문에서 찾을 말 ([빈칸] 있으면 빈칸 앞뒤 중 긴 쪽, 두 단어 이상일 때만)
  function quickNeedles(s){
    var q=s.quick||{}, out=[];
    (q.items||[]).forEach(function(it,i){
      var e=String(it.expr||'');
      var parts=e.split(/\[[^\]]*\]/).map(function(x){ return x.trim(); }).filter(Boolean).sort(function(a,b){ return b.length-a.length; });
      var n=parts[0]||''; if (!n) return;
      if (/\[/.test(e) && n.split(/\s+/).length<2) return;
      out.push({ needle:n, kind:'quick', ref:'i'+i });
    });
    (q.words||[]).forEach(function(w,i){ if (w.word) out.push({ needle:w.word, kind:'quick', ref:'w'+i }); });
    return out;
  }
  // 글자 범위로 겹치지 않게 감싸기 (긴 것 먼저)
  function wrap(text, needles, used){
    var ranges=[];
    needles.slice().sort(function(a,b){ return b.needle.length-a.needle.length; }).forEach(function(nd){
      if (nd.once && used[nd.ref]) return;
      var re=new RegExp('(^|[^A-Za-z])('+pat(nd.needle)+')(?=[^A-Za-z]|$)','i'), m=re.exec(text);
      if (!m) return;
      var a=m.index+m[1].length, b=a+m[2].length;
      if (ranges.some(function(r){ return a<r.b && b>r.a; })) return;
      ranges.push({a:a,b:b,nd:nd}); if (nd.once) used[nd.ref]=true;
    });
    ranges.sort(function(x,y){ return x.a-y.a; });
    var h='', at=0;
    ranges.forEach(function(r){
      h+=esc(text.slice(at,r.a));
      var st=r.nd.kind==='mark' ? 'background:'+YEL+';cursor:pointer' : 'border-bottom:2px solid '+BLUE+';cursor:pointer';
      h+='<span class="ls-hl" data-kind="'+r.nd.kind+'" data-ref="'+esc(r.nd.ref)+'" style="'+st+'">'+esc(text.slice(r.a,r.b))+'</span>';
      at=r.b;
    });
    return h+esc(text.slice(at));
  }

  // 보기 전 5분 표현은 처음 나오는 문단에만 밑줄 (문서마다 한 번 계산)
  function quickFor(s, pi){
    var paras=((s.translation||{}).paras||[]);
    if (!s._qmap || s._qmapN!==paras.length){
      s._qmap={}; s._qmapN=paras.length;
      quickNeedles(s).forEach(function(nd){
        var re=new RegExp('(^|[^A-Za-z])'+pat(nd.needle)+'(?=[^A-Za-z]|$)','i');
        for (var i=0;i<paras.length;i++){ if (re.test(paras[i].en)){ (s._qmap[i]=s._qmap[i]||[]).push(nd); break; } }
      });
    }
    return s._qmap[pi]||[];
  }
  window.listenMarkPara=function(s, en, pi){
    var marks=s.marks||{}, mine=Object.keys(marks).filter(function(k){ return marks[k].pi===pi; }).map(function(k){ return { needle:marks[k].text, kind:'mark', ref:k }; });
    var qn=quickFor(s, pi), used={};
    // 타임스탬프는 작은 칩으로, 글은 조각마다 하이라이트
    var out='', last=0, m; TS.lastIndex=0;
    var segs=[];
    while ((m=TS.exec(en))){ segs.push({t:en.slice(last,m.index)}); segs.push({ts:m[1]}); last=TS.lastIndex; }
    segs.push({t:en.slice(last)});
    segs.forEach(function(g){
      if (g.ts) out+='<span style="font-size:11px;color:'+SUB+';border:1px solid #E2E8F0;padding:0 5px;margin:0 4px 0 2px;user-select:none">'+esc(g.ts)+'</span>';
      else if (g.t) out+=wrap(g.t, mine.concat(qn), used);
    });
    return out;
  };

  // ── 카드 ──
  function card(){ var c=document.getElementById('ls-card'); if (!c){ c=document.createElement('div'); c.id='ls-card'; document.body.appendChild(c); } return c; }
  function close(){ var c=document.getElementById('ls-card'); if (c) c.style.display='none'; LS.open=null; }
  window.listenCardClose=close;
  function btn(label, on, primary){ return '<button onclick="'+on+'" style="font-size:13px;padding:6px 12px;border:1px solid '+(primary?ACC:'#CBD5E1')+';background:'+(primary?ACC:'#fff')+';color:'+(primary?'#fff':SUB)+';cursor:pointer">'+label+'</button>'; }
  function spk(t){ return (typeof _esSpk==='function') ? _esSpk(t,'en-US') : ''; }
  function render(){
    var o=LS.open; if (!o) return close();
    var c=card(), s=o.s, h='';
    var narrow=window.innerWidth<760;
    c.style.cssText='position:fixed;z-index:70;background:#fff;border:1px solid #E2E8F0;border-top:3px solid '+ACC+';box-shadow:0 8px 28px rgba(0,0,0,.14);padding:16px 18px;font-family:Pretendard,system-ui,sans-serif;color:#18181B;overflow:auto;'+
      (narrow?'left:0;right:0;bottom:0;max-height:55vh':'right:24px;bottom:24px;width:400px;max-height:70vh');
    if (o.kind==='quick'){
      var q=s.quick||{}, it=o.ref[0]==='i' ? (q.items||[])[+o.ref.slice(1)] : null, w=o.ref[0]==='w' ? (q.words||[])[+o.ref.slice(1)] : null, x=it||w||{};
      h+='<p style="font-size:12px;color:'+SUB+';margin:0 0 4px">보기 전 5분</p><p style="font-size:19px;font-weight:700;margin:0 0 4px">'+esc(x.expr||x.word)+' '+spk(String(x.expr||x.word||'').replace(/[\[\]]/g,''))+'</p>'+
        '<p style="font-size:15px;margin:0 0 8px">'+esc(x.kr)+'</p>'+(x.quote?'<p style="font-size:13px;font-style:italic;color:'+SUB+';margin:0 0 12px">"'+esc(x.quote)+'"</p>':'')+
        '<div style="display:flex;gap:6px;flex-wrap:wrap">'+btn('My Words','listenToWords()')+btn('+ 틀','listenToPhrase()')+btn('닫기','listenCardClose()')+'</div>';
    } else {
      var mk=(s.marks||{})[o.key]; if (!mk) return close();
      var d=o.dict;
      h+='<div style="display:flex;justify-content:space-between;gap:8px;align-items:baseline"><p style="font-size:19px;font-weight:700;margin:0">'+esc(mk.base||mk.text)+' '+spk(mk.base||mk.text)+'</p>'+(d&&d.ipa?'<span style="font-size:13px;color:'+SUB+'">'+esc(d.ipa)+'</span>':'')+'</div>';
      if (mk.status==='done'){
        h+='<p style="font-size:16px;font-weight:600;color:'+ACC+';margin:6px 0 4px">'+esc(mk.ko)+'</p>'+
          (mk.nuance?'<p style="font-size:14px;line-height:1.6;margin:0 0 10px">'+esc(mk.nuance)+'</p>':'')+
          (mk.ex||[]).map(function(e){ return '<p style="font-size:14px;margin:0 0 2px">'+esc(e.en)+' '+spk(e.en)+'</p><p style="font-size:13px;color:'+SUB+';margin:0 0 8px">'+esc(e.ko)+'</p>'; }).join('')+
          (mk.frame?'<p style="font-size:12px;color:'+SUB+';margin:6px 0 2px">틀</p><p style="font-size:14px;margin:0 0 8px">'+esc(mk.frame).replace(/\[([^\]]+)\]/g,'<span style="color:'+ACC+';border-bottom:2px solid '+ACC+'">$1</span>')+'</p>':'');
      } else {
        h+='<p style="font-size:14px;color:#1A3FB5;background:#EEF2FD;padding:8px 10px;margin:8px 0 10px"><span class="material-symbols-outlined animate-spin" style="font-size:16px;vertical-align:-3px">progress_activity</span> 문맥 속 뜻·예문을 아이맥이 만드는 중 · 20~40초</p>';
        if (d && d.defs && d.defs.length) h+=d.defs.map(function(x){ return '<p style="font-size:14px;margin:0 0 6px"><i style="color:'+SUB+'">'+esc(x.pos)+'</i> '+esc(x.def)+'</p>'; }).join('');
      }
      h+='<p style="font-size:13px;font-style:italic;color:'+SUB+';margin:8px 0 12px;border-left:2px solid #E2E8F0;padding-left:8px">"'+esc(mk.ctx)+'"</p>'+
        '<div style="display:flex;gap:6px;flex-wrap:wrap">'+btn(mk.saved?'My Words ✓':'My Words','listenToWords()',!mk.saved)+btn('+ 틀','listenToPhrase()')+btn('지우기','listenMarkDelete()')+btn('닫기','listenCardClose()')+'</div>';
    }
    c.innerHTML=h; c.style.display='block';
  }

  async function dict(word){
    if (/\s/.test(word)) return null;
    try { var r=await fetch('https://api.dictionaryapi.dev/api/v2/entries/en/'+encodeURIComponent(word)); if (!r.ok) return null;
      var e=(await r.json())[0]||{};
      return { ipa:e.phonetic||((e.phonetics||[]).find(function(p){ return p.text; })||{}).text||'', defs:(e.meanings||[]).slice(0,2).map(function(m){ return { pos:m.partOfSpeech, def:((m.definitions||[])[0]||{}).definition||'' }; }) };
    } catch(e){ return null; }
  }
  function sentenceOf(para, text){
    var i=para.toLowerCase().indexOf(text.toLowerCase()); if (i<0) return text;
    var a=Math.max(para.lastIndexOf('. ',i), para.lastIndexOf('? ',i), para.lastIndexOf('! ',i)); a=a<0?0:a+2;
    var b=para.slice(i+text.length).search(/[.?!](\s|$)/); b=b<0?para.length:i+text.length+b+1;
    return para.slice(a,b).replace(TS,'').trim();
  }

  // 드래그 → 하이라이트 + 풀이 요청
  async function onSelect(){
    var sel=window.getSelection(); if (!sel || sel.isCollapsed) return;
    var raw=sel.toString().replace(/\s+/g,' ').trim().replace(/^[^A-Za-z']+|[^A-Za-z']+$/g,'');
    if (!raw || raw.length>80 || raw.split(' ').length>8) return;
    var p=sel.anchorNode && (sel.anchorNode.nodeType===1?sel.anchorNode:sel.anchorNode.parentElement); p=p&&p.closest('.ls-en'); if (!p) return;
    var s=doc(_esOpenId); if (!s) return;
    var pi=+p.getAttribute('data-pi'), para=((s.translation||{}).paras||[])[pi]; if (!para) return;
    var key=keyOf(raw); if (!key) return;
    s.marks=s.marks||{};
    if (!s.marks[key]){
      var ctx=sentenceOf(para.en, raw);
      s.marks[key]={ text:raw, ctx:ctx, pi:pi, status:'pending', added:new Date().toISOString() };
      try {
        await db.collection('englishStudy').doc(s._id).set({ marks:{ [key]: s.marks[key] } }, { merge:true });
        await db.collection('aiJobs').add({ kind:'study', mode:'explain', status:'queued', docId:s._id, markKey:key, phrase:raw, transcript:ctx, date:s.date||new Date().toISOString().slice(0,10), title:raw, model:'sonnet', createdAt:new Date().toISOString() });
        if (typeof watchAiJobs==='function') watchAiJobs();
      } catch(e){ toast('error','저장 실패: '+e.message); }
      p.innerHTML=listenMarkPara(s, para.en, pi);
    }
    sel.removeAllRanges();
    LS.open={ s:s, key:key, kind:'mark', dict:null }; render();
    var d=await dict(raw); if (LS.open && LS.open.key===key){ LS.open.dict=d; render(); }
  }
  // 아이맥 풀이 도착 → 그 문서만 다시 읽어서 카드 갱신
  window.listenMarkDone=async function(j){
    try {
      var snap=await db.collection('englishStudy').doc(j.docId).get(); if (!snap.exists) return;
      var s=doc(j.docId); if (s){ s.marks=snap.get('marks')||{}; }
      if (LS.open && LS.open.key===j.markKey && LS.open.s._id===j.docId) render();
      else { var mk=s&&s.marks[j.markKey]; if (mk) toast('check_circle','풀이 도착 · '+(mk.base||mk.text)+' — '+(mk.ko||'')); }
    } catch(e){ console.warn('[listen] mark done', e); }
  };
  window.listenMarkDelete=async function(){
    var o=LS.open; if (!o || o.kind!=='mark') return;
    var s=o.s, mk=(s.marks||{})[o.key]; if (!mk) return close();
    delete s.marks[o.key];
    try { await db.collection('englishStudy').doc(s._id).update({ ['marks.'+o.key]: firebase.firestore.FieldValue.delete() }); } catch(e){ console.warn(e); }
    var p=document.querySelector('.ls-en[data-pi="'+mk.pi+'"]'), para=((s.translation||{}).paras||[])[mk.pi];
    if (p && para) p.innerHTML=listenMarkPara(s, para.en, mk.pi);
    close();
  };
  // Read 탭 복습과 같은 단어장
  window.listenToWords=async function(){
    var o=LS.open; if (!o) return; var s=o.s, w;
    if (o.kind==='mark'){ var mk=s.marks[o.key]; w={ w:mk.base||mk.text, ko:mk.ko||'', en:'', ex:((mk.ex||[])[0]||{}).en||'', ctx:mk.ctx }; }
    else { var q=s.quick||{}, x=o.ref[0]==='i'?(q.items||[])[+o.ref.slice(1)]:(q.words||[])[+o.ref.slice(1)]; w={ w:String(x.expr||x.word).replace(/[\[\]]/g,''), ko:x.kr||'', en:'', ex:'', ctx:x.quote||'' }; }
    var k=String(w.w).toLowerCase().trim();
    Object.assign(w, { src:'listen:'+s._id, title:s.title||'', added:new Date().toISOString().slice(0,10), box:0, due:0 });
    try { await db.collection('englishRead').doc('state').set({ words:{ [k]: w } }, { merge:true }); toast('bookmark_add','My Words에 담았어요 · Read › Review 로 복습'); } catch(e){ toast('error','저장 실패: '+e.message); return; }
    if (o.kind==='mark'){ s.marks[o.key].saved=true; db.collection('englishStudy').doc(s._id).set({ marks:{ [o.key]:{ saved:true } } }, { merge:true }).catch(function(){}); render(); }
  };
  window.listenToPhrase=async function(){
    var o=LS.open; if (!o || typeof phrasesAdd!=='function') return; var s=o.s;
    if (o.kind==='mark'){ var mk=s.marks[o.key]; await phrasesAdd({ text:mk.frame||mk.base||mk.text, kr:mk.ko, cat:'Listen', swap:mk.ctx, source:'Listen · '+(s.title||s.date) }); }
    else { var q=s.quick||{}, x=o.ref[0]==='i'?(q.items||[])[+o.ref.slice(1)]:(q.words||[])[+o.ref.slice(1)]; await phrasesAdd({ text:x.expr||x.word, kr:x.kr, cat:'Listen', swap:x.quote||'', source:'Listen · '+(s.title||s.date) }); }
  };

  document.addEventListener('mouseup', function(e){ if (e.target.closest && e.target.closest('.ls-en')) setTimeout(onSelect, 10); });
  document.addEventListener('touchend', function(e){ if (e.target.closest && e.target.closest('.ls-en')) setTimeout(onSelect, 300); });
  document.addEventListener('click', function(e){
    var h=e.target.closest && e.target.closest('.ls-hl');
    if (h){ var sel=window.getSelection(); if (sel && !sel.isCollapsed) return; var s=doc(_esOpenId); if (!s) return;
      LS.open = h.dataset.kind==='mark' ? { s:s, key:h.dataset.ref, kind:'mark', dict:null } : { s:s, ref:h.dataset.ref, kind:'quick' }; render(); return; }
    var c=document.getElementById('ls-card'); if (c && c.style.display==='block' && !c.contains(e.target) && !(e.target.closest && e.target.closest('.ls-en'))) close();
  });
  document.addEventListener('keydown', function(e){ if (e.key==='Escape') close(); });
})();
