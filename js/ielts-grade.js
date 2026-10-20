// ═══ IELTS 자동 채점 (2026-10-19) ═══
// 요청 = Firestore `ieltsGrading` 에 status 'pending' 문서 하나.
// 맥북 launchd(com.nuri.ielts-grade) 가 5분마다 크롬의 아뜰리에 탭으로 집어 가서 claude -p(구독)로 채점 → result + 'done'.
// 채점기: scripts/ielts-grade/ (README.md 참고)
(function(){
  var COLL = 'ieltsGrading';
  var ACC = '#1F4BD8', OK = '#15803d', MID = '#b45309', BAD = '#b91c1c';

  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function col(){ if (typeof db === 'undefined' && !window.db) throw new Error('db 없음'); return (typeof db !== 'undefined' ? db : window.db).collection(COLL); }
  function bandColor(b){ return b==null ? '#475569' : b>=7 ? OK : b>=6.5 ? MID : BAD; }
  function fmtB(b){ return b==null || isNaN(b) ? '—' : (+b).toFixed(1); }
  function countWords(t){ return (String(t||'').match(/[A-Za-z0-9'’-]+/g) || []).length; }
  function toDocs(snap){ var out=[]; snap.forEach(function(d){ var x=d.data(); if (x.kind === 'work') return; x._id=d.id; out.push(x); }); return out; }  // work = English › Work 탭 첨삭 (같은 채점기 사용)
  function byNewest(a){ return a.sort(function(p,q){ return String(q.createdAt||'').localeCompare(String(p.createdAt||'')); }); }

  function injectStyle(){
    if (document.getElementById('ig-style')) return;
    var css = [
      '.ig-wrap{font-family:Pretendard,-apple-system,sans-serif;color:#18181B;background:#fff;border:1px solid #ECECF0;border-radius:0;padding:20px;box-shadow:none}',
      '.ig-wrap *{border-radius:0;box-shadow:none;box-sizing:border-box}',
      '.ig-en{font-family:Arial,Helvetica,sans-serif}',
      '.ig-head{display:flex;align-items:center;gap:20px;flex-wrap:wrap;margin-bottom:18px}',
      '.ig-big{font-family:Arial,Helvetica,sans-serif;font-size:56px;font-weight:700;line-height:1;letter-spacing:-1px}',
      '.ig-big small{display:block;font-family:Pretendard,sans-serif;font-size:12px;font-weight:600;letter-spacing:0;color:#475569;margin-top:6px}',
      '.ig-meta{font-size:13px;color:#475569;line-height:1.6}',
      '.ig-crit{display:grid;gap:12px;margin-bottom:22px}',
      '.ig-row{display:grid;grid-template-columns:44px 1fr 40px;gap:10px;align-items:center}',
      '.ig-k{font-family:Arial,Helvetica,sans-serif;font-weight:700;font-size:13px}',
      '.ig-bar{height:12px;background:#F1F1F4;position:relative}',
      '.ig-bar i{position:absolute;left:0;top:0;bottom:0}',
      '.ig-bar b{position:absolute;top:-3px;bottom:-3px;width:1px;background:#18181B;opacity:.35}',
      '.ig-bn{font-family:Arial,Helvetica,sans-serif;font-weight:700;font-size:15px;text-align:right}',
      '.ig-why{grid-column:2/4;font-size:12.5px;color:#475569;margin-top:-6px;line-height:1.5;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
      '.ig-h{font-size:12px;font-weight:700;color:#475569;margin:22px 0 8px;text-transform:none}',
      '.ig-text{font-family:Arial,Helvetica,sans-serif;font-size:14.5px;line-height:1.85;white-space:pre-wrap;border:1px solid #ECECF0;padding:14px 16px}',
      '.ig-err{text-decoration:underline wavy #b91c1c;text-decoration-thickness:1.5px;text-underline-offset:3px;cursor:help;position:relative;outline:none}',
      '.ig-err:hover,.ig-err:focus{background:#FDECEC}',
      '.ig-err:hover::after,.ig-err:focus::after{content:attr(data-fix);position:absolute;left:0;top:100%;margin-top:4px;z-index:5;background:#18181B;color:#fff;font-family:Arial,Helvetica,sans-serif;font-size:12.5px;line-height:1.4;padding:5px 8px;white-space:pre;pointer-events:none}',
      '.ig-tbl{width:100%;border-collapse:collapse;font-size:13px}',
      '.ig-tbl td{border-top:1px solid #ECECF0;padding:7px 6px;vertical-align:top}',
      '@media (max-width:560px){.ig-tbl td.ig-ko{display:none}.ig-big{font-size:44px}.ig-wrap{padding:14px}}',
      '.ig-w{font-family:Arial,Helvetica,sans-serif;color:#b91c1c;text-decoration:line-through}',
      '.ig-r{font-family:Arial,Helvetica,sans-serif;color:#15803d;font-weight:700}',
      '.ig-arrow{color:#475569;padding:7px 2px!important}',
      '.ig-tag{display:inline-block;font-size:11px;font-weight:600;padding:1px 6px;background:#EEF2FD;color:'+ACC+';white-space:nowrap}',
      '.ig-ko{color:#475569;font-size:12px}',
      '.ig-box{font-family:Arial,Helvetica,sans-serif;font-size:14.5px;line-height:1.8;white-space:pre-wrap;border-left:3px solid '+ACC+';background:#F8F9FE;padding:14px 16px}',
      '.ig-up{display:flex;flex-wrap:wrap;gap:6px}',
      '.ig-up span{font-family:Arial,Helvetica,sans-serif;font-size:12.5px;border:1px solid #ECECF0;padding:4px 8px}',
      '.ig-up s{color:#b91c1c}.ig-up em{font-style:normal;color:#15803d;font-weight:700}',
      '.ig-next{list-style:none;margin:0;padding:0;display:grid;gap:6px}',
      '.ig-next label{display:flex;gap:8px;align-items:flex-start;font-size:13.5px;line-height:1.5;cursor:pointer}',
      '.ig-next input{accent-color:'+ACC+';margin-top:3px;border-radius:0}',
      '.ig-note{margin-top:16px;font-size:12px;color:#475569;border-top:1px solid #ECECF0;padding-top:10px}',
      '.ig-badge{display:inline-flex;align-items:center;gap:6px;font-family:Pretendard,sans-serif;font-size:12px;font-weight:600;padding:3px 8px;border:1px solid #ECECF0;border-radius:0;background:#fff;color:#475569;white-space:nowrap}',
      '.ig-badge b{font-family:Arial,Helvetica,sans-serif}',
      '.ig-dot{width:7px;height:7px;background:currentColor;display:inline-block}',
      '.ig-badge.ig-run .ig-dot{animation:ig-blink 1s steps(2,start) infinite}',
      '@keyframes ig-blink{to{visibility:hidden}}'
    ].join('\n');
    var s = document.createElement('style'); s.id = 'ig-style'; s.textContent = css;
    (document.head || document.documentElement).appendChild(s);
  }

  // 글 속 틀린 곳에 밑줄 — 각 오류의 첫 등장 위치만, 겹치면 앞의 것 우선
  function highlight(text, errors){
    text = String(text || '');
    var marks = [];
    (errors || []).forEach(function(e){
      if (!e || !e.wrong) return;
      var from = 0, at;
      while ((at = text.indexOf(e.wrong, from)) >= 0) {
        var end = at + e.wrong.length;
        var clash = marks.some(function(m){ return at < m.e && end > m.s; });
        if (!clash) { marks.push({ s:at, e:end, err:e }); break; }
        from = at + 1;
      }
    });
    marks.sort(function(a,b){ return a.s - b.s; });
    var out = '', pos = 0;
    marks.forEach(function(m){
      out += esc(text.slice(pos, m.s));
      var fix = '→ ' + (m.err.right || '') + (m.err.type ? '   [' + m.err.type + ']' : '');
      out += '<span class="ig-err" tabindex="0" data-fix="' + esc(fix) + '" title="' + esc(fix + (m.err.ko ? '\n' + m.err.ko : '')) + '">' + esc(text.slice(m.s, m.e)) + '</span>';
      pos = m.e;
    });
    return out + esc(text.slice(pos));
  }

  function label(doc){
    if (doc.kind === 'speaking') return 'Speaking Part ' + (doc.part || '?');
    return 'Writing Task ' + (doc.task || '?');
  }

  function renderResult(doc){
    injectStyle();
    doc = doc || {};
    var r = doc.result;
    if (!r || doc.status !== 'done') return '<div class="ig-wrap">' + renderStatus(doc) + (doc.error ? '<div class="ig-note">' + esc(doc.error) + '</div>' : '') + '</div>';
    var h = '<div class="ig-wrap">';
    var words = doc.words || countWords(doc.text);
    var minW = doc.kind === 'writing' ? (+doc.task === 1 ? 150 : 250) : 0;
    h += '<div class="ig-head"><div class="ig-big" style="color:' + bandColor(r.band) + '">' + fmtB(r.band) + '<small>Overall</small></div>';
    h += '<div class="ig-meta"><div class="ig-en" style="font-weight:700;color:#18181B;font-size:15px">' + esc(label(doc)) + '</div>';
    h += '<div>' + words + ' words' + (minW && words < minW ? ' <span style="color:' + BAD + ';font-weight:700">· ' + minW + '자 미만</span>' : '')
       + (doc.secs ? ' · ' + Math.floor(doc.secs/60) + ':' + String(Math.round(doc.secs%60)).padStart(2,'0') : '')
       + (doc.gradedAt ? ' · ' + esc(String(doc.gradedAt).slice(0,10)) : '') + '</div></div></div>';

    h += '<div class="ig-crit">';
    (r.criteria || []).forEach(function(c){
      var b = +c.band, c2 = bandColor(b);
      h += '<div class="ig-row"><span class="ig-k" title="' + esc(c.name) + '">' + esc(c.k) + '</span>'
         + '<span class="ig-bar"><i style="width:' + Math.max(0, Math.min(100, b/9*100)) + '%;background:' + c2 + '"></i><b style="left:' + (7/9*100) + '%"></b></span>'
         + '<span class="ig-bn" style="color:' + c2 + '">' + fmtB(b) + '</span>'
         + '<span class="ig-why"' + (c.quotes && c.quotes.length ? ' title="' + esc(c.quotes.join('\n')) + '"' : '') + '>' + esc(c.why) + '</span></div>';
    });
    h += '</div>';

    if (doc.text) h += '<div class="ig-h">내 글 · 밑줄을 누르면 고친 말</div><div class="ig-text">' + highlight(doc.text, r.errors) + '</div>';

    if (r.errors && r.errors.length) {
      h += '<div class="ig-h">틀린 곳 ' + r.errors.length + '</div><table class="ig-tbl">';
      r.errors.forEach(function(e){
        h += '<tr><td class="ig-w">' + esc(e.wrong) + '</td><td class="ig-arrow">→</td><td class="ig-r">' + esc(e.right) + '</td>'
           + '<td><span class="ig-tag">' + esc(e.type) + '</span></td><td class="ig-ko">' + esc(e.ko) + '</td></tr>';
      });
      h += '</table>';
    }
    if (r.upgrades && r.upgrades.length) {
      h += '<div class="ig-h">표현 올리기</div><div class="ig-up">';
      r.upgrades.forEach(function(u){ h += '<span><s>' + esc(u.from) + '</s> → <em>' + esc(u.to) + '</em></span>'; });
      h += '</div>';
    }
    if (r.rewrite) h += '<div class="ig-h">Band 8 다시 쓰기</div><div class="ig-box">' + esc(r.rewrite) + '</div>';
    if (r.next && r.next.length) {
      h += '<div class="ig-h">다음에 고칠 것</div><ul class="ig-next">';
      r.next.forEach(function(n){ h += '<li><label><input type="checkbox"><span>' + esc(n) + '</span></label></li>'; });
      h += '</ul>';
    }
    if (r.note) h += '<div class="ig-note">' + esc(r.note) + '</div>';
    return h + '</div>';
  }

  function renderStatus(doc){
    injectStyle();
    doc = doc || {};
    var s = doc.status;
    if (s === 'done' && doc.result) {
      var c = bandColor(doc.result.band);
      return '<span class="ig-badge" style="color:' + c + ';border-color:' + c + '"><span class="ig-dot"></span>완료 <b>' + fmtB(doc.result.band) + '</b></span>';
    }
    if (s === 'grading') return '<span class="ig-badge ig-run" style="color:' + ACC + ';border-color:' + ACC + '"><span class="ig-dot"></span>채점 중</span>';
    if (s === 'error') return '<span class="ig-badge" style="color:' + BAD + ';border-color:' + BAD + '" title="' + esc(doc.error) + '"><span class="ig-dot"></span>오류</span>';
    return '<span class="ig-badge"><span class="ig-dot"></span>대기 중</span>';
  }

  function request(obj){
    obj = obj || {};
    var text = String(obj.text || '');
    var d = {
      kind: obj.kind === 'speaking' ? 'speaking' : 'writing',
      prompt: String(obj.prompt || ''),
      text: text,
      words: obj.words != null ? +obj.words : countWords(text),
      secs: obj.secs != null ? +obj.secs : 0,
      createdAt: new Date().toISOString(),
      status: 'pending'
    };
    if (d.kind === 'speaking') d.part = +obj.part || 1; else d.task = +obj.task || 2;
    if (obj.ref != null) d.ref = String(obj.ref);
    try { return col().add(d).then(function(r){ return r.id; }); }
    catch (e) { return Promise.reject(e); }
  }

  function list(){
    try { return col().get().then(function(s){ return byNewest(toDocs(s)); }); }
    catch (e) { return Promise.reject(e); }
  }

  function watch(cb){
    try {
      return col().onSnapshot(function(s){ cb(byNewest(toDocs(s))); }, function(e){ console.warn('[ielts-grade] watch', e); });
    } catch (e) { console.warn('[ielts-grade]', e); return function(){}; }
  }

  window.IELTS_GRADE = { request:request, list:list, watch:watch, renderResult:renderResult, renderStatus:renderStatus };
})();
