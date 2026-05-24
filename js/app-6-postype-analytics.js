/* ───────────────────────────────────────────────────────────────────
   app-6-postype-analytics.js — Postype 채널 매출 분석
   - 사이드잡 페이지 부업 탭의 "Postype 매출 분석" 섹션을 채움
   - 데이터 소스: Firestore 3개 컬렉션
       postypeChannelDaily   일별 집계
       postypeChannelPosts   포스트별 metric + revByAge
       postypeChannelSeries  시리즈 메타
   - 데이터 push는 북마크릿(3단계)이 담당 — 이 파일은 읽기 + 렌더 전담
   ─────────────────────────────────────────────────────────────────── */
(function(){
  'use strict';

  const CHANNEL_ID  = 'bichu-attic';
  const COLL_DAILY  = 'postypeChannelDaily';
  const COLL_POSTS  = 'postypeChannelPosts';
  const COLL_SERIES = 'postypeChannelSeries';

  let dailyData    = [];   // [{date:'YYYY-MM-DD', rev, txCount, channelId, ...}]
  let currentRange = 28;
  let isDemoMode   = false;
  let loaded       = false;

  const KRW = n => (n || 0).toLocaleString('ko-KR') + '원';
  const dow = ['일','월','화','수','목','금','토'];
  const todayStr = () => new Date().toISOString().slice(0,10);
  const daysAgoStr = n => new Date(Date.now() - n*86400000).toISOString().slice(0,10);

  // ─── 더미 데이터 (Firestore 비었을 때만 사용) ───────────────────
  function makeDummy(days){
    const arr = [];
    for (let i = days-1; i >= 0; i--){
      const d  = new Date(Date.now() - i*86400000);
      const ds = d.toISOString().slice(0,10);
      const w  = d.getDay();
      const base = (w === 0 || w === 6) ? 70000 : 45000;
      const wave = (Math.sin(i*0.45) + 1.2) * 12000;
      const noise = (Math.random() - 0.5) * 8000;
      arr.push({ date: ds, rev: Math.max(0, Math.round(base + wave + noise)), channelId: CHANNEL_ID, _demo: true });
    }
    return arr;
  }

  // ─── Firestore 로딩 ─────────────────────────────────────────────
  async function fetchDaily(rangeDays){
    if (typeof fbRead !== 'function'){
      console.warn('[postype-analytics] fbRead 미정의 — app-1 로딩 전?');
      return [];
    }
    try {
      const all = await fbRead(COLL_DAILY);
      const cutoff = daysAgoStr(rangeDays);
      return all
        .filter(d => d.channelId === CHANNEL_ID && d.date && d.date >= cutoff)
        .sort((a,b) => a.date.localeCompare(b.date));
    } catch(e){
      console.error('[postype-analytics] fetchDaily error', e);
      return [];
    }
  }

  // ─── KPI 4개 렌더 ───────────────────────────────────────────────
  function renderKPIs(daily){
    const today = todayStr();
    const yest  = daysAgoStr(1);
    const row   = (d) => daily.find(x => x.date === d) || { rev: 0 };
    const tR = row(today).rev || 0;
    const yR = row(yest).rev  || 0;
    const sum = (n) => daily.filter(d => d.date >= daysAgoStr(n)).reduce((a,d) => a + (d.rev||0), 0);
    const s7 = sum(7), s30 = sum(30);
    const delta = tR - yR;

    document.getElementById('postype-kpi-today').textContent     = KRW(tR);
    const dEl = document.getElementById('postype-kpi-today-delta');
    dEl.textContent = `어제 대비 ${delta >= 0 ? '+' : ''}${KRW(delta)}`;
    dEl.className   = 'text-xs mt-1 ' + (delta >= 0 ? 'text-emerald-600' : 'text-rose-600');

    document.getElementById('postype-kpi-yesterday').textContent = KRW(yR);
    const ySub = document.getElementById('postype-kpi-yesterday-sub');
    if (ySub) ySub.textContent = yest;

    document.getElementById('postype-kpi-7d').textContent      = KRW(s7);
    document.getElementById('postype-kpi-7d-avg').textContent  = `일평균 ${KRW(Math.round(s7/7))}`;
    document.getElementById('postype-kpi-30d').textContent     = KRW(s30);
    document.getElementById('postype-kpi-30d-avg').textContent = `일평균 ${KRW(Math.round(s30/30))}`;
  }

  // ─── 일별 차트 SVG ──────────────────────────────────────────────
  function renderDailyChart(daily, rangeDays){
    const wrap   = document.getElementById('postype-daily-chart');
    const empty  = document.getElementById('postype-daily-empty');
    const oldSvg = wrap.querySelector('svg');
    if (oldSvg) oldSvg.remove();

    if (!daily || !daily.length){
      empty.style.display = 'flex';
      wrap.__days = [];
      return;
    }
    empty.style.display = 'none';

    // 빈 날짜 0으로 채워 연속 시계열로
    const map = Object.fromEntries(daily.map(d => [d.date, d.rev || 0]));
    const full = [];
    for (let i = rangeDays-1; i >= 0; i--){
      const d  = new Date(Date.now() - i*86400000);
      const ds = d.toISOString().slice(0,10);
      full.push({ date: ds, rev: map[ds] || 0, dow: dow[d.getDay()] });
    }

    const W = 800, H = 180, PAD = 10;
    const max = Math.max(...full.map(d => d.rev), 1);
    const pts = full.map((d, i) => [
      (i / Math.max(full.length-1, 1)) * W,
      H - PAD - (d.rev / max) * (H - PAD*2)
    ]);
    const path = `M${pts[0].join(',')} ${pts.slice(1).map(p => `L${p.join(',')}`).join(' ')}`;
    const area = `${path} L${W},${H} L0,${H} Z`;

    wrap.insertAdjacentHTML('afterbegin', `
      <svg viewBox="0 0 ${W} ${H}" width="100%" height="100%" preserveAspectRatio="none" style="display:block">
        <defs>
          <linearGradient id="postype-area-grad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stop-color="#6366f1" stop-opacity="0.25"/>
            <stop offset="1" stop-color="#6366f1" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <path d="${area}" fill="url(#postype-area-grad)"/>
        <path d="${path}" fill="none" stroke="#6366f1" stroke-width="2" stroke-linejoin="round"/>
      </svg>`);
    wrap.__days = full;
  }

  // ─── 차트 hover 툴팁 ────────────────────────────────────────────
  function attachHover(){
    const wrap = document.getElementById('postype-daily-chart');
    const tt   = document.getElementById('postype-daily-tooltip');
    const vl   = document.getElementById('postype-daily-vline');
    if (!wrap || wrap.__hoverAttached) return;
    wrap.__hoverAttached = true;

    wrap.addEventListener('mousemove', e => {
      const days = wrap.__days;
      if (!days || !days.length) return;
      const rect = wrap.getBoundingClientRect();
      const x    = e.clientX - rect.left;
      const idx  = Math.max(0, Math.min(days.length - 1, Math.round(x / rect.width * (days.length - 1))));
      const d    = days[idx];
      tt.textContent  = `${d.date} (${d.dow}) · ${KRW(d.rev)}`;
      tt.style.display = 'block';
      const ttx = Math.min(Math.max(x + 12, 8), rect.width - 200);
      tt.style.left = ttx + 'px';
      tt.style.top  = '8px';
      vl.style.display = 'block';
      vl.style.left = (idx / Math.max(days.length-1, 1) * rect.width) + 'px';
    });
    wrap.addEventListener('mouseleave', () => {
      tt.style.display = 'none';
      vl.style.display = 'none';
    });
  }

  // ─── 기간 탭 (28/90/365일) ──────────────────────────────────────
  function attachRangeTabs(){
    const tabs = document.querySelectorAll('.postype-range-btn');
    tabs.forEach(btn => {
      btn.addEventListener('click', async () => {
        tabs.forEach(b => {
          b.classList.remove('bg-white','shadow','text-slate-900');
          b.classList.add('text-slate-500');
        });
        btn.classList.remove('text-slate-500');
        btn.classList.add('bg-white','shadow','text-slate-900');
        currentRange = parseInt(btn.dataset.range, 10);
        await loadAndRender();
      });
    });
  }

  // ─── 동기화 상태 표시 ───────────────────────────────────────────
  function setSyncLabel(daily, demo){
    const el = document.getElementById('postype-last-sync');
    if (!el) return;
    if (demo){
      el.innerHTML = '<span style="background:#f59e0b;color:white;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:bold;letter-spacing:0.05em;margin-right:6px">DEMO</span>더미 데이터 표시 중';
    } else if (!daily.length){
      el.textContent = '마지막 동기화: 없음';
    } else {
      const latest = daily.map(d => d.date).sort().slice(-1)[0];
      el.textContent = `마지막 동기화: ${latest}`;
    }
  }

  // ─── 메인 로드 + 렌더 ───────────────────────────────────────────
  async function loadAndRender(){
    const real = await fetchDaily(currentRange);
    if (real.length === 0){
      dailyData  = makeDummy(currentRange);
      isDemoMode = true;
    } else {
      dailyData  = real;
      isDemoMode = false;
    }
    setSyncLabel(dailyData, isDemoMode);
    renderKPIs(dailyData);
    renderDailyChart(dailyData, currentRange);
  }

  // ─── 동기화 버튼 (3단계에서 진짜 핸들러로 교체) ─────────────────
  window.syncPostypeAnalytics = function(){
    alert('아직 동기화 핸들러가 비어있어요. 3단계에서 북마크릿이 채워질 자리입니다.\n현재는 더미 데이터로 차트가 표시됩니다.');
  };

  // ─── 콘솔에서 호출용 (디버그/검증) ──────────────────────────────
  window.__postypeAnalytics = {
    reload: loadAndRender,
    forceDemo: () => {
      dailyData = makeDummy(currentRange);
      isDemoMode = true;
      setSyncLabel(dailyData, true);
      renderKPIs(dailyData);
      renderDailyChart(dailyData, currentRange);
    },
    state: () => ({ dailyData, isDemoMode, currentRange }),
    channelId: CHANNEL_ID,
    collections: { daily: COLL_DAILY, posts: COLL_POSTS, series: COLL_SERIES }
  };

  // ─── 초기화 (사이드잡 페이지 보일 때 한 번만 로드) ──────────────
  function init(){
    const section = document.getElementById('postype-analytics-section');
    if (!section) return;
    attachHover();
    attachRangeTabs();

    const observer = new IntersectionObserver((entries) => {
      for (const e of entries){
        if (e.isIntersecting && !loaded){
          loaded = true;
          loadAndRender();
          observer.disconnect();
        }
      }
    }, { root: null, threshold: 0.05 });
    observer.observe(section);
  }

  if (document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
