// ═══ Flight Deals (2026-10-21) — 사이드바 TRAVEL › Flight Deals 페이지 (page-deals) ═══
// 아이맥(launchd com.nuri.flight-deals, 07:30·19:30)이 구글 항공편 노선 페이지를 읽어 data/flight-deals/latest.json 을 올린다.
// 여기선 그걸 그려 주기만 한다: 국산 항공사 최저가를 '보통 가격대'(가장 싼 달) 막대 위 점으로.
(function(){
  var F = null, P = null, loading = false, region = 'all', loadedAt = 0;
  var RFLAG = { '유럽':'eu', '호주':'au', '뉴질랜드':'nz', '캐나다':'ca', '미국':'us' };
  var GOOD = '#15803d', BAD = '#b91c1c', ACC = '#1F4BD8', ACC_D = '#1A3FB5', ACC_L = '#EEF2FD', LINE = '#ECECF0', SUB = '#475569', INK = '#18181B';
  var REGIONS = ['유럽', '호주', '뉴질랜드', '캐나다', '미국'];
  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function man(n){ return n==null ? '–' : (Math.round(n/1e3)/10).toLocaleString('ko-KR')+'만'; }
  function kname(s){ return String(s||'').replace('Trinity Airways','트리니티'); }
  function isHot(c){ return c.deal === 'super' || c.deal === 'deal'; }
  function flag(cc){ return cc ? '<img class="fdc-flag" src="https://flagcdn.com/w80/'+esc(cc)+'.png" alt="" loading="lazy">' : ''; }
  function logo(code, name){ return code ? '<img class="fdc-logo" src="https://www.gstatic.com/flights/airline_logos/70px/'+esc(code)+'.png" alt="'+esc(name||'')+'" loading="lazy" onerror="this.remove()">' : ''; }
  var DOW = ['일','월','화','수','목','금','토'];
  function pd(iso){ var p = iso.split('-'); return new Date(+p[0], +p[1]-1, +p[2]); }
  function md(d){ return (d.getMonth()+1)+'.'+d.getDate()+' '+DOW[d.getDay()]; }
  function style(){
    if (document.getElementById('fd-style')) return;
    var css = [
      '.fdp{max-width:1180px;margin:0 auto;padding:36px 32px 96px;font-family:Pretendard,-apple-system,sans-serif;color:'+INK+'}',
      '.fdp *{box-sizing:border-box;border-radius:0}',
      '.fdp-hero{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;flex-wrap:wrap;border-bottom:1px solid '+INK+';padding-bottom:16px}',
      '.fdp-eb{font-size:11px;font-weight:700;letter-spacing:.14em;color:'+SUB+';margin:0 0 4px}',
      '.fdp-hero h1{font-size:34px;font-weight:800;letter-spacing:-.02em;margin:0}',
      '.fdp-stats{display:flex;gap:26px;text-align:right}',
      '.fdp-stat span{display:block;font-size:11px;font-weight:600;color:'+SUB+'}',
      '.fdp-stat b{font-size:26px;font-weight:800;font-variant-numeric:tabular-nums}',
      '.fdp-h{display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin:30px 0 12px}',
      '.fdp-h h2{font-size:16px;font-weight:700;margin:0}',
      '.fdp-seg{display:flex;gap:6px;flex-wrap:wrap}',
      '.fdp-seg button{font-size:12.5px;padding:5px 11px;border:1px solid '+LINE+';background:#fff;color:'+SUB+';cursor:pointer}',
      '.fdp-seg button.on{background:'+ACC_L+';color:'+ACC_D+';border-color:'+ACC+';font-weight:600}',
      '.fdc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px}',
      '.fdc{border:1px solid '+LINE+';background:#fff;padding:16px;display:flex;flex-direction:column}',
      '.fdc.super{border-color:'+ACC+';box-shadow:inset 0 3px 0 '+ACC+'}',
      '.fdc-top{display:flex;justify-content:space-between;align-items:center;gap:10px}',
      '.fdc-place{display:flex;gap:10px;align-items:center;min-width:0}',
      '.fdc-flag{width:34px;height:23px;object-fit:cover;border:1px solid '+LINE+';flex:none}',
      '.fdc-city{font-size:17px;font-weight:700;line-height:1.2}',
      '.fdc-code{font-size:11.5px;color:'+SUB+';font-weight:600;letter-spacing:.04em}',
      '.fdc-air{display:flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:'+INK+';white-space:nowrap}',
      '.fdc-logo{width:24px;height:24px;object-fit:contain}',
      '.fdc-tag{font-size:10.5px;font-weight:700;color:'+ACC_D+';background:'+ACC_L+';padding:2px 6px}',
      '.fdc-price{display:flex;align-items:baseline;gap:6px;margin-top:14px}',
      '.fdc-price b{font-size:32px;font-weight:800;letter-spacing:-.02em;font-variant-numeric:tabular-nums}',
      '.fdc-price span{font-size:12.5px;color:'+SUB+'}',
      '.fdc-band{position:relative;height:18px;margin-top:4px}',
      '.fdc-band .trk{position:absolute;left:0;right:0;top:6px;height:6px;background:#F1F2F5}',
      '.fdc-band .rng{position:absolute;top:6px;height:6px;background:#C7D2FE}',
      '.fdc-band .dot{position:absolute;top:2px;width:14px;height:14px;margin-left:-7px;border-radius:50%!important;background:'+GOOD+';border:2px solid #fff}',
      '.fdc-band .dot.mid{background:'+INK+'}',
      '.fdc-bl{display:flex;justify-content:space-between;font-size:11px;color:'+SUB+';font-variant-numeric:tabular-nums}',
      '.fdc-cal{margin-top:14px;border-top:1px solid '+LINE+';padding-top:12px}',
      '.fdc-mon{display:flex;justify-content:space-between;align-items:baseline;margin-bottom:6px}',
      '.fdc-mon b{font-size:14px;font-weight:800}',
      '.fdc-mon span{font-size:11.5px;color:'+SUB+'}',
      '.fdc-wk{display:grid;grid-template-columns:repeat(7,1fr);gap:2px}',
      '.fdc-wk div{height:26px;display:flex;align-items:center;justify-content:center;font-size:12px;color:#94A3B8;font-variant-numeric:tabular-nums}',
      '.fdc-wk .h{height:18px;font-size:10.5px;font-weight:700;color:'+SUB+'}',
      '.fdc-wk .we{color:'+BAD+'}',
      '.fdc-wk .in{background:'+ACC_L+';color:'+ACC_D+'}',
      '.fdc-wk .in.we{color:'+BAD+'}',
      '.fdc-wk .end{background:'+ACC+';color:#fff;font-weight:800}',
      '.fdc-wk .m1{font-weight:800;color:'+INK+'}',
      '.fdc-legs{display:grid;grid-template-columns:1fr auto 1fr;align-items:center;margin-top:10px;font-size:12.5px}',
      '.fdc-legs .r{text-align:right}',
      '.fdc-legs small{display:block;font-size:10.5px;font-weight:700;color:'+ACC+'}',
      '.fdc-legs b{font-size:14px;font-weight:800}',
      '.fdc-nights{font-size:11.5px;color:'+SUB+';padding:2px 8px;border:1px solid '+LINE+'}',
      '.fdc-nodate{margin-top:14px;border:1px dashed #CBD5E1;padding:14px;text-align:center;font-size:12.5px;color:'+SUB+'}',
      '.fdc-go{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:14px}',
      '.fdc-go a{text-align:center;font-size:12.5px;padding:8px}',
      '.fdc-cmp{margin-top:12px;display:grid;gap:5px}',
      '.fdc-cmp a{display:grid;grid-template-columns:74px minmax(0,1fr) 58px;gap:8px;align-items:center;font-size:11.5px;color:'+SUB+';text-decoration:none}',
      '.fdc-cmp a:hover{color:'+ACC_D+'}',
      '.fdc-cmp i{display:block;height:8px;background:#CBD5E1}',
      '.fdc-cmp a.win i{background:'+ACC+'}',
      '.fdc-cmp a.win{color:'+INK+';font-weight:700}',
      '.fdc-cmp b{text-align:right;font-variant-numeric:tabular-nums;font-weight:700;color:'+INK+'}',
      '.fdt-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(168px,1fr));gap:8px}',
      '.fdt{border:1px solid '+LINE+';background:#fff;padding:11px;display:block;color:inherit;text-decoration:none}',
      '.fdt:hover{border-color:'+ACC+'}',
      '.fdt-top{display:flex;align-items:center;gap:7px}',
      '.fdt-top .fdc-flag{width:24px;height:16px}',
      '.fdt-top b{font-size:13.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.fdt-top .fdc-logo{width:20px;height:20px;margin-left:auto}',
      '.fdt-p{font-size:19px;font-weight:800;margin-top:7px;font-variant-numeric:tabular-nums}',
      '.fdt-p span{font-size:11px;font-weight:500;color:'+SUB+'}',
      '.fdt-bar{height:5px;background:#F1F2F5;margin-top:7px}',
      '.fdt-bar i{display:block;height:5px;background:'+ACC+'}',
      '.fdt-gap{font-size:11px;color:'+SUB+';margin-top:4px;font-variant-numeric:tabular-nums}',
      '.fdm-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:12px}',
      '.fdm{border:1px solid '+LINE+';background:#fff;padding:14px;display:flex;flex-direction:column;gap:10px;color:inherit;text-decoration:none;position:relative}',
      '.fdm:hover{border-color:'+ACC+'}',
      '.fdm-top{display:flex;align-items:center;gap:8px}',
      '.fdm-top .fdc-logo{width:26px;height:26px}',
      '.fdm-top span{font-size:12px;font-weight:700}',
      '.fdm-flags{margin-left:auto;display:flex;gap:4px}',
      '.fdm-flags img{width:24px;height:16px;object-fit:cover;border:1px solid '+LINE+'}',
      '.fdm-pct{font-size:30px;font-weight:800;letter-spacing:-.02em;line-height:1;color:'+ACC+'}',
      '.fdm-pct small{font-size:13px;font-weight:700;margin-left:3px}',
      '.fdm-t{font-size:14px;font-weight:700;line-height:1.4}',
      '.fdm-s{font-size:12px;color:'+SUB+';line-height:1.45;margin-top:2px}',
      '.fdm-per{margin-top:auto}',
      '.fdm-bar{height:6px;background:#F1F2F5;position:relative}',
      '.fdm-bar i{position:absolute;left:0;top:0;bottom:0;background:#CBD5E1}',
      '.fdm-bar b{position:absolute;top:-3px;width:2px;height:12px;background:'+INK+'}',
      '.fdm-pl{display:flex;justify-content:space-between;font-size:11px;color:'+SUB+';margin-top:5px;font-variant-numeric:tabular-nums}',
      '.fdm-pl .d{font-weight:800;color:'+INK+'}',
      '.fdm-pl .d.soon{color:'+BAD+'}',
      '.fdm-new{background:'+ACC+';color:#fff!important;font-size:9.5px!important;font-weight:800;letter-spacing:.06em;padding:2px 6px}',
      '.fdm-grid.big{grid-template-columns:repeat(auto-fill,minmax(340px,1fr))}',
      '.fdm-tl{position:relative;margin-top:2px}',
      '.fdm-tl .row{display:grid;grid-template-columns:34px minmax(0,1fr);gap:8px;align-items:center;height:18px}',
      '.fdm-tl .row span{font-size:10.5px;font-weight:700;color:'+SUB+'}',
      '.fdm-tl .trk{position:relative;height:8px;background:#F4F4F6}',
      '.fdm-tl .trk i{position:absolute;top:0;bottom:0;background:#CBD5E1}',
      '.fdm-tl .trk i.go{background:'+ACC+'}',
      '.fdm-tl .trk i.x{background:repeating-linear-gradient(45deg,#fff 0 2px,#FCA5A5 2px 4px)}',
      '.fdm-tl .ax{position:relative;height:14px;margin-left:42px}',
      '.fdm-tl .ax em{position:absolute;font-style:normal;font-size:10px;color:'+SUB+';transform:translateX(-50%);white-space:nowrap}',
      '.fdm-tl .now{position:absolute;top:0;bottom:14px;width:0;border-left:1.5px dashed '+BAD+'}',
      '.fdm-tlx{display:flex;justify-content:space-between;font-size:11px;color:'+SUB+';margin-top:4px;font-variant-numeric:tabular-nums}',
      '.fdm-tlx b{color:'+INK+'}',
      '.fdm-pcts{display:flex;gap:6px;flex-wrap:wrap}',
      '.fdm-pcts span{display:flex;align-items:center;gap:5px;font-size:12px;font-weight:800;border:1px solid '+LINE+';padding:3px 7px}',
      '.fdm-pcts img{width:18px;height:12px;object-fit:cover}',
      '.fdm-est{border-top:1px solid '+LINE+';padding-top:8px;display:grid;gap:7px}',
      '.fdm-est .h{font-size:10.5px;font-weight:700;color:'+SUB+'}',
      '.fdm-er{display:grid;grid-template-columns:22px minmax(0,1fr) auto;gap:8px;align-items:center}',
      '.fdm-er img{width:22px;height:15px;object-fit:cover;border:1px solid '+LINE+'}',
      '.fdm-er .c{font-size:12.5px;font-weight:700}',
      '.fdm-er .c small{display:block;font-size:10.5px;font-weight:500;color:'+SUB+'}',
      '.fdm-er .p{text-align:right;font-variant-numeric:tabular-nums}',
      '.fdm-er .p s{font-size:11px;color:'+SUB+';margin-right:4px}',
      '.fdm-er .p b{font-size:15px;font-weight:800}',
      '.fdm-er .p small{display:block;font-size:10.5px;font-weight:700;color:'+GOOD+'}',
      '.fdm-sbar{grid-column:2/4;height:5px;background:#E2E8F0;position:relative}',
      '.fdm-sbar i{position:absolute;top:0;bottom:0;left:0;background:#94A3B8}',
      '.fdm-sbar u{position:absolute;top:0;bottom:0;background:'+ACC+'}',
      '.fdm-sbar b{position:absolute;top:0;bottom:0;background:'+GOOD+'}',
      '.fdm-leg{display:flex;gap:10px;font-size:10px;color:'+SUB+'}',
      '.fdm-leg i{display:inline-block;width:8px;height:8px;margin-right:3px;vertical-align:-1px}',
      '.fdm-cond{display:flex;gap:5px;flex-wrap:wrap}',
      '.fdm-cond span{font-size:11px;color:'+SUB+';background:#F4F4F6;padding:3px 7px}',
      '.fdm-cond .code{background:'+INK+';color:#fff;font-weight:800;letter-spacing:.05em;cursor:copy}',
      '.fdm-all{display:flex;flex-wrap:wrap;gap:8px;margin-top:10px}',
      '.fdm-chip{display:flex;align-items:center;gap:8px;border:1px solid '+LINE+';background:#fff;padding:7px 10px;font-size:12.5px;color:'+INK+';text-decoration:none;max-width:100%}',
      '.fdm-chip:hover{border-color:'+ACC+'}',
      '.fdm-chip .fdc-logo{width:20px;height:20px}',
      '.fdm-chip span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.fdm-chip em{font-style:normal;font-weight:800;font-size:11.5px;color:'+SUB+';flex:none}',
      '.fd-none{font-size:13.5px;color:'+SUB+';padding:22px;border:1px dashed #CBD5E1;text-align:center}',
      '@media (max-width:860px){.fdp{padding:22px 16px 80px}.fdp-hero h1{font-size:26px}.fdc-grid{grid-template-columns:minmax(0,1fr)}}'
    ].join('\n');
    var st = document.createElement('style'); st.id = 'fd-style'; st.textContent = css; document.head.appendChild(st);
  }
  function calHtml(trip){
    var s = pd(trip.out), e = trip.back ? pd(trip.back) : s;
    var st = new Date(s); st.setDate(st.getDate() - ((st.getDay()+6)%7));
    var en = new Date(e); en.setDate(en.getDate() + (6 - ((en.getDay()+6)%7)));
    var m1 = s.getMonth()+1, m2 = e.getMonth()+1;
    var mon = s.getFullYear()+'년 '+m1+'월' + (m2 !== m1 ? ' – '+m2+'월' : '');
    var nights = Math.round((e - s) / 864e5);
    var h = ['월','화','수','목','금','토','일'].map(function(w, i){ return '<div class="h'+(i>4?' we':'')+'">'+w+'</div>'; }).join('');
    for (var d = new Date(st); d <= en; d.setDate(d.getDate()+1)) {
      var inR = d >= s && d <= e, end = +d === +s || +d === +e, we = d.getDay() === 0 || d.getDay() === 6;
      var label = d.getDate() === 1 ? (d.getMonth()+1)+'/1' : d.getDate();
      h += '<div class="'+(end?'end':inR?'in':'')+(we?' we':'')+(d.getDate()===1&&!end?' m1':'')+'">'+label+'</div>';
    }
    return '<div class="fdc-cal"><div class="fdc-mon"><b>'+mon+'</b><span>주말은 빨간 글씨</span></div><div class="fdc-wk">'+h+'</div>' +
      '<div class="fdc-legs"><div><small>출발</small><b>'+md(s)+'</b></div><span class="fdc-nights">'+(trip.back ? nights+'박' : '편도')+'</span><div class="r"><small>귀국</small><b>'+(trip.back ? md(e) : '–')+'</b></div></div></div>';
  }
  function card(c){
    var sk = c.sky && c.sky.kr, useSky = c.bestSrc === 'sky' && sk;
    var k = useSky ? sk : (c.kr || {}), t = c.typical, price = c.best || (c.kr ? c.kr.price : (c.rt && c.rt.price));
    // 같은 날짜 가격 비교 (구글 = 항공사 운임, 스카이스캐너 = 여행사 포함)
    var cmp = '';
    if (c.sky && c.kr) {
      var rows = [['구글', c.kr.price, c.link], ['스카이스캐너', sk ? sk.price : null, c.sky.url]].filter(function(x){ return x[1]; });
      var mx = Math.max.apply(null, rows.map(function(x){ return x[1]; }));
      var mn = Math.min.apply(null, rows.map(function(x){ return x[1]; }));
      cmp = '<div class="fdc-cmp">' + rows.map(function(x){ return '<a class="'+(x[1]===mn?'win':'')+'" href="'+esc(x[2])+'" target="_blank" rel="noopener"><span>'+x[0]+'</span><i style="width:'+Math.round(x[1]/mx*100)+'%"></i><b>'+man(x[1])+'</b></a>'; }).join('') + '</div>';
    }
    var band = '';
    if (t && price) {
      var max = Math.max(t.hi * 1.2, price * 1.08), pos = function(v){ return Math.max(0, Math.min(100, v / max * 100)); };
      band = '<div class="fdc-band"><div class="trk"></div><div class="rng" style="left:'+pos(t.lo)+'%;width:'+(pos(t.hi)-pos(t.lo))+'%"></div><div class="dot'+(price>t.lo+(t.hi-t.lo)*0.25?' mid':'')+'" style="left:'+pos(price)+'%"></div></div>' +
        '<div class="fdc-bl"><span>보통 '+man(t.lo)+'</span><span>'+man(t.hi)+'</span></div>';
    }
    return '<div class="fdc'+(c.deal==='super'?' super':'')+'"><div class="fdc-top"><div class="fdc-place">'+flag(c.cc)+'<div><div class="fdc-city">'+esc(c.city)+'</div><div class="fdc-code">ICN → '+esc(c.iata||'')+'</div></div></div>' +
      '<div class="fdc-air">'+logo(k.code, k.name)+esc(kname(k.name||''))+(k.direct?'<span class="fdc-tag">직항</span>':'')+'</div></div>' +
      '<div class="fdc-price"><b>'+man(price).replace('만','')+'</b><span>만원 · 왕복</span>'+(c.deal==='super'?'<span class="fdc-tag" style="margin-left:auto">초특가</span>':'')+'</div>' + band +
      (c.trip ? calHtml(c.trip) : '<div class="fdc-nodate">이 표는 날짜가 안 나와요 · 구글에서 날짜 고르기</div>') +
      cmp + '<div class="fdc-go"><a class="atl-btn '+(useSky?'atl-btn-secondary':'atl-btn-primary')+'" href="'+esc(c.link)+'" target="_blank" rel="noopener">구글 ↗</a>' +
      '<a class="atl-btn '+(useSky?'atl-btn-primary':'atl-btn-secondary')+'" href="'+esc(c.sky ? c.sky.url : 'https://www.skyscanner.co.kr/transport/flights/sela/'+String(c.iata||'').toLowerCase()+'/')+'" target="_blank" rel="noopener">스카이스캐너 ↗</a></div></div>';
  }
  function tile(c){
    var k = c.kr, t = c.typical, price = c.best || (k ? k.price : (c.rt && c.rt.price)), code = k ? k.code : (c.rt && c.rt.code);
    var cut = t ? t.lo + (t.hi - t.lo) * 0.25 : null, gap = cut && price ? price - cut : null;
    var w = k && cut && price ? Math.max(6, Math.min(100, cut / price * 100)) : 0;
    return '<a class="fdt" href="'+esc(c.link)+'" target="_blank" rel="noopener"><div class="fdt-top">'+flag(c.cc)+'<b>'+esc(c.city)+'</b>'+logo(code)+'</div>' +
      '<div class="fdt-p">'+man(price).replace('만','')+'<span> 만'+(k?'':' · 외항사')+'</span></div>' +
      '<div class="fdt-bar"><i style="width:'+w+'%"></i></div><div class="fdt-gap">'+(!k ? '국산 항공사 없음' : gap!=null ? (gap<=0?'특가선 안':'특가까지 −'+man(gap)) : '')+'</div></a>';
  }
  function dleft(end){ if (!end) return null; var t = new Date(); t.setHours(0,0,0,0); return Math.round((pd(end) - t) / 864e5); }
  function promoCard(x){
    var dl = dleft(x.end), s0 = pd(x.start), e0 = x.end ? pd(x.end) : null, now = Date.now();
    var prog = e0 ? Math.max(0, Math.min(100, (now - s0) / (e0 - s0) * 100)) : 0;
    var isNew = x.firstSeen && (Date.now() - pd(x.firstSeen)) / 864e5 < 3;
    return '<a class="fdm" href="'+esc(x.link)+'" target="_blank" rel="noopener">' +
      '<div class="fdm-top">'+logo(x.code, x.airline)+'<span>'+esc(x.airline)+'</span>'+(isNew?'<span class="fdm-new">NEW</span>':'')+'<div class="fdm-flags">'+(x.regions||[]).map(function(r){ return RFLAG[r] ? '<img src="https://flagcdn.com/w80/'+RFLAG[r]+'.png" alt="'+esc(r)+'" title="'+esc(r)+'">' : ''; }).join('')+'</div></div>' +
      (x.pct ? '<div class="fdm-pct">'+x.pct+'<small>% 할인</small></div>' : '') +
      '<div><div class="fdm-t">'+esc(x.sub && x.title.length < 8 ? x.sub : x.title)+'</div>'+(x.sub && x.title.length >= 8 ? '<div class="fdm-s">'+esc(x.sub)+'</div>' : '')+'</div>' +
      (e0 ? '<div class="fdm-per"><div class="fdm-bar"><i style="width:'+prog+'%"></i><b style="left:'+prog+'%"></b></div><div class="fdm-pl"><span>'+md(s0)+'</span><span class="d'+(dl<=5?' soon':'')+'">'+(dl<=0?'오늘 끝':'D-'+dl)+'</span><span>'+md(e0)+'</span></div></div>' : '') + '</a>';
  }
  // 구매·탑승 기간을 같은 달력 위 막대로 (오늘은 빨간 점선)
  function timeline(d){
    var rs = []; if (d.buy && d.buy.from) rs.push(d.buy.from, d.buy.to || d.buy.from);
    (d.travel || []).forEach(function(t){ rs.push(t.from, t.to); });
    if (!rs.length) return '';
    var t0 = new Date(); t0.setHours(0,0,0,0);
    var a = Math.min.apply(null, rs.map(function(x){ return +pd(x); }).concat([+t0])), b = Math.max.apply(null, rs.map(function(x){ return +pd(x); }));
    a = new Date(a); a.setDate(1); var bb = new Date(b); bb.setMonth(bb.getMonth()+1, 1);
    var span = bb - a, X = function(iso){ return ((pd(iso) - a) / span * 100).toFixed(2); };
    var bar = function(f, t, cls){ return '<i class="'+cls+'" style="left:'+X(f)+'%;width:'+Math.max(0.8, X(t) - X(f))+'%"></i>'; };
    var ax = '';
    for (var m = new Date(a); m < bb; m.setMonth(m.getMonth()+1)) ax += '<em style="left:'+((m - a) / span * 100 + 100 * 15 * 864e5 / span).toFixed(2)+'%">'+(m.getMonth()+1)+'월</em>';
    var now = ((t0 - a) / span * 100).toFixed(2);
    return '<div class="fdm-tl">' +
      (d.buy && d.buy.from ? '<div class="row"><span>구매</span><div class="trk">'+bar(d.buy.from, d.buy.to || d.buy.from, '')+'</div></div>' : '') +
      ((d.travel || []).length ? '<div class="row"><span>탑승</span><div class="trk">'+d.travel.map(function(t){ return bar(t.from, t.to, 'go'); }).join('') +
        (d.exclude || []).filter(function(e){ return e.from && e.to; }).map(function(e){ return bar(e.from, e.to, 'x'); }).join('')+'</div></div>' : '') +
      '<div class="ax">'+ax+'</div><div class="now" style="left:calc(42px + (100% - 42px) * '+(now/100).toFixed(4)+')"></div></div>' +
      '<div class="fdm-tlx">'+(d.buy && d.buy.to ? '<span>구매 <b>~'+md(pd(d.buy.to))+'</b></span>' : '<span></span>') +
        ((d.travel || []).length ? '<span>탑승 <b>'+md(pd(d.travel[0].from))+' ~ '+md(pd(d.travel[d.travel.length-1].to))+'</b>'+((d.exclude||[]).length?' · 빗금 제외':'')+'</span>' : '')+'</div>';
  }
  function estRow(e){
    var fl = e.cc ? '<img src="https://flagcdn.com/w80/'+esc(e.cc)+'.png" alt="">' : '<span></span>';
    var when = e.out ? md(pd(e.out))+' – '+md(pd(e.back)) : '날짜 미정 · 구글 최저가';
    var tot = e.price, fuel = e.fuel || 0, tax = e.onFare ? e.tax : 0, fare = e.fare;
    var bar = e.onFare && fuel ? '<div class="fdm-sbar"><i style="width:'+((fuel+tax)/tot*100).toFixed(1)+'%"></i><u style="left:'+((fuel+tax)/tot*100).toFixed(1)+'%;width:'+(fare/tot*100).toFixed(1)+'%"></u><b style="left:'+((tot-e.discount)/tot*100).toFixed(1)+'%;width:'+(e.discount/tot*100).toFixed(1)+'%"></b></div>' : '';
    return '<a class="fdm-er" href="'+esc(e.url)+'" target="_blank" rel="noopener" style="color:inherit;text-decoration:none">'+fl+'<div class="c">'+esc(e.city)+'<small>'+when+'</small></div>' +
      '<div class="p"><s>'+man(tot)+'</s><b>'+man(e.final)+'</b><small>−'+man(e.discount)+'</small></div>'+bar+'</a>';
  }
  function promoBig(x){
    var d = x.detail, dl = dleft(d.buy && d.buy.to || x.end);
    var isNew = x.firstSeen && (Date.now() - pd(x.firstSeen)) / 864e5 < 3;
    var pcts = (d.discounts || []).filter(function(v){ return v.pct && !/비즈니스|프레스티지/.test(v.cabin||''); });
    var big = pcts.length === 1 ? '<div class="fdm-pct">'+pcts[0].pct+'<small>% 할인 · '+esc(pcts[0].cabin||'')+'</small></div>'
      : pcts.length ? '<div class="fdm-pcts">'+pcts.map(function(v){ return '<span>'+(RFLAG[v.region]?'<img src="https://flagcdn.com/w80/'+RFLAG[v.region]+'.png" alt="">':'')+esc(v.region)+' '+v.pct+'%</span>'; }).join('')+'</div>' : '';
    var fares = (d.fares || []).slice().sort(function(a,b){ return a.price - b.price; });
    var est = (x.est || []).length ? '<div class="fdm-est"><div class="h">이걸 쓰면 (이코노미 왕복 · 추정)</div>' + x.est.map(estRow).join('') +
        (x.est.some(function(e){ return e.onFare && e.fuel; }) ? '<div class="fdm-leg"><span><i style="background:#94A3B8"></i>유류할증료·세금 (할인 없음)</span><span><i style="background:'+ACC+'"></i>운임</span><span><i style="background:'+GOOD+'"></i>할인</span></div>' : '') + '</div>'
      : fares.length ? '<div class="fdm-est"><div class="h">공홈에 적힌 최저가 (왕복 총액)</div>' + fares.slice(0, 5).map(function(f){
          var c = (F && F.cities || []).find(function(c){ return c.city === f.city || (c.iata && c.iata === f.iata); });
          return '<div class="fdm-er">'+(c&&c.cc?'<img src="https://flagcdn.com/w80/'+c.cc+'.png" alt="">':'<span></span>')+'<div class="c">'+esc(f.city)+'</div><div class="p"><b>'+man(f.price)+'</b></div></div>'; }).join('') + '</div>' : '';
    var cond = (d.conditions || []).slice(0, 4).map(function(c){ return '<span>'+esc(c)+'</span>'; }).join('') + (d.code ? '<span class="code" title="눌러서 복사" onclick="event.preventDefault();navigator.clipboard&&navigator.clipboard.writeText(\''+esc(d.code)+'\')">코드 '+esc(d.code)+'</span>' : '');
    return '<a class="fdm" href="'+esc(x.link)+'" target="_blank" rel="noopener">' +
      '<div class="fdm-top">'+logo(x.code, x.airline)+'<span>'+esc(x.airline)+'</span>'+(isNew?'<span class="fdm-new">NEW</span>':'')+
        '<span style="margin-left:auto;font-size:11px;font-weight:800;'+(dl!=null&&dl<=5?'color:'+BAD:'')+'">'+(dl!=null?'구매 D-'+Math.max(0,dl):'')+'</span><div class="fdm-flags" style="margin-left:6px">'+(x.regions||[]).map(function(r){ return RFLAG[r] ? '<img src="https://flagcdn.com/w80/'+RFLAG[r]+'.png" alt="'+esc(r)+'">' : ''; }).join('')+'</div></div>' +
      big + '<div><div class="fdm-t">'+esc(x.sub && x.title.length < 8 ? x.sub : x.title)+'</div>'+(x.sub && x.title.length >= 8 ? '<div class="fdm-s">'+esc(x.sub)+'</div>' : '')+'</div>' +
      timeline(d) + est + (cond ? '<div class="fdm-cond">'+cond+'</div>' : '') + '</a>';
  }
  function promoChip(x){
    var dl = dleft(x.end);
    return '<a class="fdm-chip" href="'+esc(x.link)+'" target="_blank" rel="noopener">'+logo(x.code, x.airline)+(x.pct?'<em style="color:'+ACC+'">'+x.pct+'%</em>':'')+'<span>'+esc(x.sub && x.title.length < 8 ? x.sub : x.title)+'</span>'+(dl!=null?'<em>D-'+Math.max(0,dl)+'</em>':'')+'</a>';
  }
  function promosHtml(){
    if (!P || !P.items || !P.items.length) return '';
    var rich = P.items.filter(function(x){ return x.detail && ((x.est && x.est.length) || (x.detail.fares && x.detail.fares.length) || (x.detail.travel && x.detail.travel.length)); });
    var reg = P.items.filter(function(x){ return rich.indexOf(x) < 0 && x.regions && x.regions.length; }), all = P.items.filter(function(x){ return rich.indexOf(x) < 0 && (!x.regions || !x.regions.length); });
    return '<div class="fdp-h"><h2>공홈 프로모션</h2><span style="font-size:12px;color:'+SUB+'">대한항공 · 아시아나 · 트리니티 · 에어프레미아 이벤트에서 장거리만</span></div>' +
      (rich.length ? '<div class="fdm-grid big">'+rich.map(promoBig).join('')+'</div>' : '') +
      (reg.length ? '<div class="fdm-grid" style="margin-top:12px">'+reg.map(promoCard).join('')+'</div>' : '') +
      (all.length ? '<div class="fdm-all">'+all.map(promoChip).join('')+'</div>' : '');
  }
  function paint(){
    var el = document.getElementById('deals-root'); if (!el) return;
    style();
    var head = function(nHot, nAll, when){
      return '<header class="fdp-hero"><div><p class="fdp-eb">TRAVEL · DEALS</p><h1>Flight Deals</h1></div>' +
        '<div class="fdp-stats"><div class="fdp-stat"><span>특가</span><b style="color:'+ACC+'">'+nHot+'</b></div><div class="fdp-stat"><span>지켜보는 곳</span><b>'+nAll+'</b></div><div class="fdp-stat"><span>갱신</span><b style="font-size:16px">'+esc(when)+'</b></div></div></header>';
    };
    if (!F || !F.cities) { el.innerHTML = '<div class="fdp">'+head('–','–','–')+'<div class="fd-none" style="margin-top:24px">'+(F===false?'불러오지 못했어요':'불러오는 중…')+'</div></div>'; return; }
    var all = F.cities, hot = all.filter(isHot), rest = all.filter(function(c){ return !isHot(c); });
    var shown = rest.filter(function(c){ return region === 'all' || c.region === region; });
    var when = String(F.generatedAt||'').slice(5,16).replace('T',' ').replace('-','/');
    el.innerHTML = '<div class="fdp">' + head(hot.length, all.length, when) +
      '<div class="fdp-h"><h2>지금 특가</h2></div>' +
      (hot.length ? '<div class="fdc-grid">'+hot.map(card).join('')+'</div>' : '<div class="fd-none">지금은 보통보다 싼 국산 항공사 표가 없어요</div>') +
      promosHtml() +
      '<div class="fdp-h"><h2>지켜보는 도시</h2><div class="fdp-seg">' + ['all'].concat(REGIONS).map(function(r){
          var n = r === 'all' ? rest.length : rest.filter(function(c){ return c.region === r; }).length;
          return '<button class="'+(region===r?'on':'')+'" onclick="FLIGHT_DEALS.region(\''+r+'\')">'+(r==='all'?'전체':r)+' <span style="opacity:.7">'+n+'</span></button>';
        }).join('') + '</div></div>' +
      '<div class="fdt-grid">' + shown.map(tile).join('') + '</div></div>';
  }
  function load(){
    if (loading) return; loading = true;
    fetch('data/flight-deals/latest.json', { cache:'no-store' }).then(function(r){ return r.ok ? r.json() : null; })
      .then(function(j){ F = j || false; loading = false; loadedAt = Date.now(); paint(); })
      .then(function(){ return fetch('data/flight-deals/promos.json', { cache:'no-store' }).then(function(r){ return r.ok ? r.json() : null; }).then(function(j){ P = j; paint(); }).catch(function(){}); }).catch(function(){ F = F || false; loading = false; paint(); });
  }
  function render(){ paint(); if (!F || Date.now() - loadedAt > 10*60e3) load(); }
  window.FLIGHT_DEALS = { render: render, region: function(r){ region = r; paint(); } };
  // 페이지가 보일 때마다 그린다 (navigate 가 display 를 바꾼다)
  function watch(){
    var pg = document.getElementById('page-deals'); if (!pg) return;
    var vis = function(){ return pg.style.display !== 'none' && pg.offsetParent !== null; };
    new MutationObserver(function(){ if (vis()) render(); }).observe(pg, { attributes:true, attributeFilter:['style','class'] });
    if (vis()) render();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', watch); else watch();
})();
