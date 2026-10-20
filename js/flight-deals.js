// ═══ Flight Deals (2026-10-21) — Travel › Flight 맨 위 '항공권 특가' ═══
// 아이맥(launchd com.nuri.flight-deals, 07:30·19:30)이 구글 항공편 노선 페이지를 읽어 data/flight-deals/latest.json 을 올린다.
// 여기선 그걸 그려 주기만 한다: 국산 항공사 최저가를 '보통 가격대'(가장 싼 달) 막대 위 점으로.
(function(){
  var F = null, open = false, loading = false;
  var GOOD = '#15803d', BAD = '#b91c1c', ACC = '#1F4BD8', ACC_D = '#1A3FB5', ACC_L = '#EEF2FD', LINE = '#ECECF0', SUB = '#475569';
  function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); }
  function man(n){ return n==null ? '–' : (Math.round(n/1e3)/10).toLocaleString('ko-KR')+'만'; }
  function kname(s){ return String(s||'').replace('Trinity Airways','트리니티'); }
  function style(){
    if (document.getElementById('fd-style')) return;
    var css = [
      '.fd{border:1px solid '+LINE+';background:#fff}',
      '.fd *{box-sizing:border-box;border-radius:0}',
      '.fd-row{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.3fr) minmax(0,1.7fr) 92px auto;gap:16px;align-items:center;padding:13px 16px;border-top:1px solid '+LINE+'}',
      '.fd-row:first-child{border-top:0}',
      '.fd-row.hot{background:'+ACC_L+';box-shadow:inset 3px 0 0 '+ACC+'}',
      '.fd-city b{display:block;font-size:15px;font-weight:700}',
      '.fd-sub{font-size:11.5px;color:'+SUB+';margin-top:2px;line-height:1.45}',
      '.fd-row.hot .fd-why{color:'+ACC_D+';font-weight:600}',
      '.fd-price b{font-size:17px;font-weight:700;font-variant-numeric:tabular-nums}',
      '.fd-band{position:relative;height:30px}',
      '.fd-band .trk{position:absolute;left:0;right:0;top:7px;height:6px;background:#F4F4F6}',
      '.fd-band .rng{position:absolute;top:7px;height:6px;background:#CBD5E1}',
      '.fd-band .dot{position:absolute;top:3px;width:14px;height:14px;margin-left:-7px;border-radius:50%!important;background:#18181B;border:2px solid #fff}',
      '.fd-band .dot.good{background:'+GOOD+'}',
      '.fd-band small{position:absolute;top:17px;font-size:10.5px;color:'+SUB+';white-space:nowrap;font-variant-numeric:tabular-nums}',
      '.fd-diff{font-size:13px;font-weight:700;font-variant-numeric:tabular-nums;text-align:right}',
      '.fd-diff.good{color:'+GOOD+'} .fd-diff.bad{color:'+BAD+'}',
      '.fd-more{display:block;width:100%;border:0;border-top:1px solid '+LINE+';background:#FAFAFB;padding:10px;font-size:12.5px;font-weight:600;color:'+SUB+';cursor:pointer}',
      '.fd-more:hover{color:'+ACC_D+'}',
      '.fd-none{font-size:13px;color:'+SUB+';padding:14px 16px}',
      '@media (max-width:860px){.fd-row{grid-template-columns:minmax(0,1fr) auto;gap:6px 12px}.fd-band{grid-column:1/-1}.fd-go{display:none}}'
    ].join('\n');
    var st = document.createElement('style'); st.id = 'fd-style'; st.textContent = css; document.head.appendChild(st);
  }
  function row(c){
    var k = c.kr, t = c.typical, hot = c.deal === 'super' || c.deal === 'deal';
    var price = k ? k.price : (c.rt && c.rt.price), band = '<div class="fd-band"></div>';
    if (t && price){
      var max = Math.max(t.hi * 1.25, price * 1.08), pos = function(v){ return Math.max(0, Math.min(100, v / max * 100)); };
      band = '<div class="fd-band"><div class="trk"></div><div class="rng" style="left:'+pos(t.lo)+'%;width:'+(pos(t.hi)-pos(t.lo))+'%"></div>' +
        '<div class="dot'+(price<=t.lo?' good':'')+'" style="left:'+pos(price)+'%"></div>' +
        '<small style="left:'+Math.min(pos(t.lo),50)+'%">보통 '+man(t.lo)+'~'+man(t.hi)+' · '+t.month+'월이 제일 쌈</small></div>';
    }
    var d = c.vsLow, diff = d==null ? '<div></div>' : '<div class="fd-diff '+(d<=0?'good':d>25?'bad':'')+'">'+(d<=0?'▼ ':'▲ ')+Math.abs(d)+'%<div class="fd-sub" style="font-weight:500">보통 최저보다</div></div>';
    var name = k ? kname(k.name) + (k.direct?' · 직항':'') : '국산 항공사 없음';
    var other = c.rt ? '전체 최저 '+man(c.rt.price)+' · '+esc(kname(c.rt.airline))+' · '+esc(String(c.rt.dates).split('~')[0]) : '';
    return '<div class="fd-row'+(hot?' hot':'')+'"><div class="fd-city"><b>'+esc(c.city)+'</b><div class="fd-sub fd-why">'+esc(c.region)+(c.why?' · '+esc(c.why):'')+'</div></div>' +
      '<div class="fd-price"><b>'+man(price)+'</b><div class="fd-sub">'+esc(name)+'</div><div class="fd-sub">'+other+'</div></div>' +
      band + diff + '<a class="atl-btn atl-btn-secondary fd-go" href="'+esc(c.link)+'" target="_blank" rel="noopener" style="font-size:12px;padding:6px 10px">보기 ↗</a></div>';
  }
  function paint(){
    var el = document.getElementById('flight-deals-body'); if (!el) return;
    style();
    if (!F || !F.cities || !F.cities.length) { el.innerHTML = '<div class="fd"><div class="fd-none">'+(F===false?'불러오지 못했어요':'불러오는 중…')+'</div></div>'; return; }
    var hot = F.cities.filter(function(c){ return c.deal === 'super' || c.deal === 'deal'; });
    var rest = F.cities.filter(function(c){ return hot.indexOf(c) < 0; });
    var meta = document.getElementById('flight-deals-meta');
    if (meta) meta.textContent = '인천 왕복 · '+F.cities.length+'개 도시 · '+String(F.generatedAt||'').replace('T',' ')+' 갱신';
    el.innerHTML = '<div class="fd">' + (hot.length ? hot.map(row).join('') : '<div class="fd-none">지금은 보통보다 싼 국산 항공사 표가 없어요</div>') +
      (open ? rest.map(row).join('') : '') +
      '<button class="fd-more" onclick="FLIGHT_DEALS.toggle()">'+(open ? '접기 ▴' : '다른 도시 '+rest.length+'곳 지금 가격 ▾')+'</button></div>';
  }
  function load(){
    if (loading) return; loading = true;
    fetch('data/flight-deals/latest.json', { cache:'no-store' }).then(function(r){ return r.ok ? r.json() : null; })
      .then(function(j){ F = j || false; loading = false; paint(); }).catch(function(){ F = false; loading = false; paint(); });
  }
  window.FLIGHT_DEALS = { render: function(){ paint(); load(); }, toggle: function(){ open = !open; paint(); } };
  // 항공 탭이 열릴 때마다 새로 받아 그린다
  var orig = window.showTravelFlight;
  if (typeof orig === 'function') window.showTravelFlight = function(){ var r = orig.apply(this, arguments); try { window.FLIGHT_DEALS.render(); } catch(e){} return r; };
})();
