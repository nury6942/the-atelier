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
      '.fdm-new{position:absolute;top:-1px;right:-1px;background:'+ACC+';color:#fff;font-size:10px;font-weight:800;letter-spacing:.06em;padding:3px 7px}',
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
    return '<a class="fdm" href="'+esc(x.link)+'" target="_blank" rel="noopener">'+(isNew?'<span class="fdm-new">NEW</span>':'') +
      '<div class="fdm-top">'+logo(x.code, x.airline)+'<span>'+esc(x.airline)+'</span><div class="fdm-flags">'+(x.regions||[]).map(function(r){ return RFLAG[r] ? '<img src="https://flagcdn.com/w80/'+RFLAG[r]+'.png" alt="'+esc(r)+'" title="'+esc(r)+'">' : ''; }).join('')+'</div></div>' +
      (x.pct ? '<div class="fdm-pct">'+x.pct+'<small>% 할인</small></div>' : '') +
      '<div><div class="fdm-t">'+esc(x.sub && x.title.length < 8 ? x.sub : x.title)+'</div>'+(x.sub && x.title.length >= 8 ? '<div class="fdm-s">'+esc(x.sub)+'</div>' : '')+'</div>' +
      (e0 ? '<div class="fdm-per"><div class="fdm-bar"><i style="width:'+prog+'%"></i><b style="left:'+prog+'%"></b></div><div class="fdm-pl"><span>'+md(s0)+'</span><span class="d'+(dl<=5?' soon':'')+'">'+(dl<=0?'오늘 끝':'D-'+dl)+'</span><span>'+md(e0)+'</span></div></div>' : '') + '</a>';
  }
  function promoChip(x){
    var dl = dleft(x.end);
    return '<a class="fdm-chip" href="'+esc(x.link)+'" target="_blank" rel="noopener">'+logo(x.code, x.airline)+(x.pct?'<em style="color:'+ACC+'">'+x.pct+'%</em>':'')+'<span>'+esc(x.sub && x.title.length < 8 ? x.sub : x.title)+'</span>'+(dl!=null?'<em>D-'+Math.max(0,dl)+'</em>':'')+'</a>';
  }
  function promosHtml(){
    if (!P || !P.items || !P.items.length) return '';
    var reg = P.items.filter(function(x){ return x.regions && x.regions.length; }), all = P.items.filter(function(x){ return !x.regions || !x.regions.length; });
    return '<div class="fdp-h"><h2>공홈 프로모션</h2><span style="font-size:12px;color:'+SUB+'">대한항공 · 아시아나 · 트리니티 · 에어프레미아 이벤트에서 장거리만</span></div>' +
      (reg.length ? '<div class="fdm-grid">'+reg.map(promoCard).join('')+'</div>' : '') +
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
