// ═══ Flight Deals (2026-10-21) — 사이드바 TRAVEL › Flight Deals 페이지 (page-deals) ═══
// 아이맥(launchd com.nuri.flight-deals, 07:30·19:30)이 구글 항공편 노선 페이지를 읽어 data/flight-deals/latest.json 을 올린다.
// 여기선 그걸 그려 주기만 한다: 국산 항공사 최저가를 '보통 가격대'(가장 싼 달) 막대 위 점으로.
(function(){
  var F = null, loading = false, region = 'all', loadedAt = 0;
  var GOOD = '#15803d', BAD = '#b91c1c', ACC = '#1F4BD8', ACC_D = '#1A3FB5', ACC_L = '#EEF2FD', LINE = '#ECECF0', SUB = '#475569', INK = '#18181B';
  var REGIONS = ['유럽', '호주', '뉴질랜드', '캐나다', '미국'];
  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function man(n){ return n==null ? '–' : (Math.round(n/1e3)/10).toLocaleString('ko-KR')+'만'; }
  function kname(s){ return String(s||'').replace('Trinity Airways','트리니티'); }
  function isHot(c){ return c.deal === 'super' || c.deal === 'deal'; }
  function style(){
    if (document.getElementById('fd-style')) return;
    var css = [
      '.fdp{max-width:1180px;margin:0 auto;padding:36px 32px 96px;font-family:Pretendard,-apple-system,sans-serif;color:'+INK+'}',
      '.fdp *{box-sizing:border-box;border-radius:0}',
      '.fdp-hero{display:flex;justify-content:space-between;align-items:flex-end;gap:20px;flex-wrap:wrap;border-bottom:1px solid '+INK+';padding-bottom:18px}',
      '.fdp-eb{font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:'+SUB+';margin:0 0 6px}',
      '.fdp-hero h1{font-size:34px;font-weight:800;letter-spacing:-.02em;margin:0}',
      '.fdp-hero p.sub{font-size:13.5px;color:'+SUB+';margin:6px 0 0}',
      '.fdp-stats{display:flex;gap:28px}',
      '.fdp-stat span{display:block;font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:'+SUB+'}',
      '.fdp-stat b{font-size:24px;font-weight:800;font-variant-numeric:tabular-nums}',
      '.fdp-stat b.acc{color:'+ACC+'}',
      '.fdp-h{display:flex;justify-content:space-between;align-items:baseline;gap:12px;margin:34px 0 12px}',
      '.fdp-h h2{font-size:17px;font-weight:700;margin:0}',
      '.fdp-h small{font-size:12px;color:'+SUB+'}',
      '.fdp-seg{display:flex;gap:6px;flex-wrap:wrap}',
      '.fdp-seg button{font-size:12.5px;padding:6px 12px;border:1px solid '+LINE+';background:#fff;color:'+SUB+';cursor:pointer}',
      '.fdp-seg button.on{background:'+ACC_L+';color:'+ACC_D+';border-color:'+ACC+';font-weight:600}',
      '.fd{border:1px solid '+LINE+';background:#fff}',
      '.fd-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.3fr) minmax(0,1.7fr) 96px auto;gap:16px;align-items:center;padding:13px 16px;border-top:1px solid '+LINE+'}',
      '.fd-row:first-child{border-top:0}',
      '.fd-row.hot{background:'+ACC_L+';box-shadow:inset 3px 0 0 '+ACC+'}',
      '.fd-city b{display:block;font-size:15px;font-weight:700}',
      '.fd-sub{font-size:11.5px;color:'+SUB+';margin-top:2px;line-height:1.45}',
      '.fd-row.hot .fd-why{color:'+ACC_D+';font-weight:600}',
      '.fd-price b{font-size:17px;font-weight:700;font-variant-numeric:tabular-nums}',
      '.fd-band{position:relative;height:30px}',
      '.fd-band .trk{position:absolute;left:0;right:0;top:7px;height:6px;background:#F4F4F6}',
      '.fd-band .rng{position:absolute;top:7px;height:6px;background:#CBD5E1}',
      '.fd-band .dot{position:absolute;top:3px;width:14px;height:14px;margin-left:-7px;border-radius:50%!important;background:'+INK+';border:2px solid #fff}',
      '.fd-band .dot.good{background:'+GOOD+'}',
      '.fd-band small{position:absolute;top:17px;font-size:10.5px;color:'+SUB+';white-space:nowrap;font-variant-numeric:tabular-nums}',
      '.fd-diff{font-size:13px;font-weight:700;font-variant-numeric:tabular-nums;text-align:right}',
      '.fd-diff.good{color:'+GOOD+'} .fd-diff.bad{color:'+BAD+'}',
      '.fd-none{font-size:13.5px;color:'+SUB+';padding:18px 16px}',
      '.fdp-note{font-size:12px;color:'+SUB+';line-height:1.7;margin-top:18px}',
      '@media (max-width:860px){.fdp{padding:22px 16px 80px}.fdp-hero h1{font-size:26px}.fd-row{grid-template-columns:minmax(0,1fr) auto;gap:6px 12px}.fd-band{grid-column:1/-1}.fd-go{display:none}}'
    ].join('\n');
    var st = document.createElement('style'); st.id = 'fd-style'; st.textContent = css; document.head.appendChild(st);
  }
  function row(c){
    var k = c.kr, t = c.typical, hot = isHot(c);
    var price = k ? k.price : (c.rt && c.rt.price), band = '<div class="fd-band"></div>';
    if (t && price){
      var max = Math.max(t.hi * 1.25, price * 1.08), pos = function(v){ return Math.max(0, Math.min(100, v / max * 100)); };
      band = '<div class="fd-band"><div class="trk"></div><div class="rng" style="left:'+pos(t.lo)+'%;width:'+(pos(t.hi)-pos(t.lo))+'%"></div>' +
        '<div class="dot'+(price<=t.lo?' good':'')+'" style="left:'+pos(price)+'%"></div>' +
        '<small style="left:'+Math.min(pos(t.lo),50)+'%">보통 '+man(t.lo)+'~'+man(t.hi)+' · '+t.month+'월이 제일 쌈</small></div>';
    }
    var d = c.vsLow, diff = d==null ? '<div></div>' : '<div class="fd-diff '+(d<=0?'good':d>25?'bad':'')+'">'+(d<=0?'▼ ':'▲ ')+Math.abs(d)+'%<div class="fd-sub" style="font-weight:500">보통 최저보다</div></div>';
    var name = k ? kname(k.name) + (k.direct?' · 직항':'') : '국산 항공사 없음 · 외항사 기준';
    var other = c.rt ? '전체 최저 '+man(c.rt.price)+' · '+esc(kname(c.rt.airline))+' · '+esc(String(c.rt.dates).split('~')[0]) : '';
    return '<div class="fd-row'+(hot?' hot':'')+'"><div class="fd-city"><b>'+esc(c.city)+'</b><div class="fd-sub fd-why">'+esc(c.region)+(c.why?' · '+esc(c.why):'')+'</div></div>' +
      '<div class="fd-price"><b>'+man(price)+'</b><div class="fd-sub">'+esc(name)+'</div><div class="fd-sub">'+other+'</div></div>' +
      band + diff + '<a class="atl-btn atl-btn-secondary fd-go" href="'+esc(c.link)+'" target="_blank" rel="noopener" style="font-size:12px;padding:6px 10px">보기 ↗</a></div>';
  }
  function paint(){
    var el = document.getElementById('deals-root'); if (!el) return;
    style();
    var head = function(nHot, nAll, when){
      return '<header class="fdp-hero"><div><p class="fdp-eb">Travel · Deals</p><h1>Flight Deals</h1>' +
        '<p class="sub">인천 왕복 · 국산 항공사 먼저 · 앞으로 12개월 중 가장 싼 표 · 아이맥이 아침·저녁 7:30에 확인</p></div>' +
        '<div class="fdp-stats"><div class="fdp-stat"><span>특가</span><b class="acc">'+nHot+'</b></div><div class="fdp-stat"><span>도시</span><b>'+nAll+'</b></div><div class="fdp-stat"><span>갱신</span><b style="font-size:15px">'+esc(when)+'</b></div></div></header>';
    };
    if (!F || !F.cities) { el.innerHTML = '<div class="fdp">'+head('–','–','–')+'<div class="fd" style="margin-top:24px"><div class="fd-none">'+(F===false?'불러오지 못했어요 — 잠시 뒤 다시':'불러오는 중…')+'</div></div></div>'; return; }
    var all = F.cities, hot = all.filter(isHot);
    var shown = all.filter(function(c){ return region === 'all' || c.region === region; });
    var when = String(F.generatedAt||'').slice(5,16).replace('T',' ').replace('-','/');
    el.innerHTML = '<div class="fdp">' + head(hot.length, all.length, when) +
      '<div class="fdp-h"><h2>지금 특가</h2><small>보통 가격대 아래쪽이면 여기 — 맨 아래보다 싸면 아이폰으로도 알려요</small></div>' +
      '<div class="fd">' + (hot.length ? hot.map(row).join('') : '<div class="fd-none">지금은 보통보다 싼 국산 항공사 표가 없어요</div>') + '</div>' +
      '<div class="fdp-h"><h2>도시별 지금 가격</h2><div class="fdp-seg">' + ['all'].concat(REGIONS).map(function(r){
          var n = r === 'all' ? all.length : all.filter(function(c){ return c.region === r; }).length;
          return '<button class="'+(region===r?'on':'')+'" onclick="FLIGHT_DEALS.region(\''+r+'\')">'+(r==='all'?'전체':r)+' <span style="opacity:.7">'+n+'</span></button>';
        }).join('') + '</div></div>' +
      '<div class="fd">' + shown.map(row).join('') + '</div>' +
      '<div class="fdp-note">회색 띠 = 구글이 말하는 이 노선의 보통 가격대(가장 싼 달) · 점 = 지금 국산 항공사 최저가 · 날짜는 외항사 포함 전체 최저가 기준이에요. \'보기 ↗\'를 누르면 구글 항공편에서 날짜를 바꿔 볼 수 있어요.</div>' +
      '</div>';
  }
  function load(){
    if (loading) return; loading = true;
    fetch('data/flight-deals/latest.json', { cache:'no-store' }).then(function(r){ return r.ok ? r.json() : null; })
      .then(function(j){ F = j || false; loading = false; loadedAt = Date.now(); paint(); }).catch(function(){ F = F || false; loading = false; paint(); });
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
