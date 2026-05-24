/* ───────────────────────────────────────────────────────────────────
   app-6-postype-analytics.js — Postype 채널 매출 분석 (월별 뷰)
   - 사이드잡 부업 탭의 "Postype 매출 분석" 섹션
   - 좌우 화살표로 월 이동, 입금일 자동 계산, 전월 대비 표시
   - 데이터 소스 (Firestore):
       postypeChannelDaily   일별 집계
       postypeChannelPosts   포스트별 metric + revByAge
       postypeChannelSeries  시리즈 메타
   - 데이터 push는 북마크릿이 담당
   ─────────────────────────────────────────────────────────────────── */
(function(){
  'use strict';

  // ─── 상수 ───────────────────────────────────────────────────────
  const CHANNEL_ID  = 'bichu-attic';
  const COLL_DAILY  = 'postypeChannelDaily';
  const COLL_POSTS  = 'postypeChannelPosts';
  const COLL_SERIES = 'postypeChannelSeries';

  // 2026년 한국 공휴일 (입금일 계산용)
  const KR_HOLIDAYS = new Set([
    '2026-01-01', // 신정
    '2026-02-16','2026-02-17','2026-02-18', // 설날 연휴
    '2026-03-01','2026-03-02', // 삼일절 + 대체
    '2026-05-05', // 어린이날
    '2026-05-24','2026-05-25', // 부처님오신날 + 대체
    '2026-06-06', // 현충일 (토)
    '2026-08-15', // 광복절 (토)
    '2026-09-24','2026-09-25','2026-09-26', // 추석 연휴
    '2026-10-03', // 개천절 (토)
    '2026-10-09', // 한글날
    '2026-12-25'  // 크리스마스
  ]);

  // ─── 상태 ───────────────────────────────────────────────────────
  let allDaily     = [];     // Firestore의 전체 일별 데이터 (메모리 캐시)
  let currentMonth = null;   // 'YYYY-MM'
  let isDemoMode   = false;
  let loaded       = false;

  // ─── 헬퍼 ───────────────────────────────────────────────────────
  const KRW       = n => (n || 0).toLocaleString('ko-KR') + '원';
  const dow       = ['일','월','화','수','목','금','토'];
  const pad       = n => String(n).padStart(2, '0');
  const todayStr  = () => new Date().toISOString().slice(0,10);
  const thisMonth = () => todayStr().slice(0, 7);

  // 입금일: 매월 10일, 단 토/일/공휴일이면 직전 평일
  function calcPaymentDay(yearMonth){
    const [y, m] = yearMonth.split('-').map(Number);
    let d = new Date(Date.UTC(y, m-1, 10));
    for (let i = 0; i < 7; i++){
      const w   = d.getUTCDay();
      const ymd = d.toISOString().slice(0,10);
      if (w === 0 || w === 6 || KR_HOLIDAYS.has(ymd)){
        d.setUTCDate(d.getUTCDate() - 1);
      } else {
        break;
      }
    }
    return d.toISOString().slice(0,10);
  }

  // 선택한 달의 매출은 다음 달 입금일에 들어옴
  function paymentForMonth(yearMonth){
    const [y, m] = yearMonth.split('-').map(Number);
    let nY = y, nM = m + 1;
    if (nM > 12){ nY++; nM = 1; }
    return calcPaymentDay(`${nY}-${pad(nM)}`);
  }

  function monthLabel(yearMonth){
    const [y, m] = yearMonth.split('-').map(Number);
    return `${y}년 ${m}월`;
  }
  function prevMonth(yearMonth){
    const [y, m] = yearMonth.split('-').map(Number);
    return m === 1 ? `${y-1}-12` : `${y}-${pad(m-1)}`;
  }
  function nextMonth(yearMonth){
    const [y, m] = yearMonth.split('-').map(Number);
    return m === 12 ? `${y+1}-01` : `${y}-${pad(m+1)}`;
  }
  function daysInMonth(yearMonth){
    const [y, m] = yearMonth.split('-').map(Number);
    return new Date(y, m, 0).getDate();
  }
  function isFuture(yearMonth){
    return yearMonth > thisMonth();
  }

  // ─── 더미 데이터 (Firestore 비었을 때) ──────────────────────────
  function makeDummyForMonth(yearMonth){
    const dim = daysInMonth(yearMonth);
    const [y, m] = yearMonth.split('-').map(Number);
    const today = new Date();
    const arr = [];
    const lastDay = (yearMonth === thisMonth()) ? today.getDate() : dim;
    for (let day = 1; day <= lastDay; day++){
      const d  = new Date(Date.UTC(y, m-1, day));
      const w  = d.getUTCDay();
      const base = (w === 0 || w === 6) ? 70000 : 45000;
      const wave = (Math.sin(day*0.45) + 1.2) * 12000;
      const noise = (Math.random() - 0.5) * 8000;
      arr.push({
        date: `${y}-${pad(m)}-${pad(day)}`,
        rev: Math.max(0, Math.round(base + wave + noise)),
        channelId: CHANNEL_ID,
        _demo: true
      });
    }
    return arr;
  }

  // ─── Firestore 로딩 (전체 한 번) ────────────────────────────────
  async function fetchAllDaily(){
    if (typeof fbRead !== 'function'){
      console.warn('[postype-analytics] fbRead 미정의 — app-1 로딩 전?');
      return [];
    }
    try {
      const all = await fbRead(COLL_DAILY);
      return all
        .filter(d => d.channelId === CHANNEL_ID && d.date)
        .sort((a,b) => a.date.localeCompare(b.date));
    } catch(e){
      console.error('[postype-analytics] fetchAllDaily error', e);
      return [];
    }
  }

  // ─── KPI 4개 렌더 ───────────────────────────────────────────────
  function renderKPIs(monthDaily, prevMonthDaily, ytdTotal){
    const sum     = monthDaily.reduce((a,d) => a + (d.rev||0), 0);
    const txCount = monthDaily.reduce((a,d) => a + (d.txCount||0), 0);
    const dayCnt  = monthDaily.length;
    const avg     = dayCnt ? Math.round(sum / dayCnt) : 0;

    // 최고일
    let peakDay = null, peakRev = 0;
    monthDaily.forEach(d => { if ((d.rev||0) > peakRev){ peakRev = d.rev; peakDay = d.date; } });

    // 전월 대비
    const prevSum = prevMonthDaily.reduce((a,d) => a + (d.rev||0), 0);
    const delta   = sum - prevSum;
    const pct     = prevSum ? ((delta / prevSum) * 100) : null;

    // KPI 1: 이번 달 매출
    document.getElementById('postype-kpi-month-total').textContent = KRW(sum);
    document.getElementById('postype-kpi-month-sub').textContent   = dayCnt
      ? `${dayCnt}일 / ${txCount.toLocaleString('ko-KR')}건`
      : '데이터 없음';

    // KPI 2: 일평균
    document.getElementById('postype-kpi-daily-avg').textContent     = KRW(avg);
    document.getElementById('postype-kpi-daily-avg-sub').textContent = dayCnt ? `${dayCnt}일 평균` : '—';

    // KPI 3: 최고일
    if (peakDay){
      const d = new Date(peakDay + 'T00:00:00Z');
      document.getElementById('postype-kpi-peak').textContent      = KRW(peakRev);
      document.getElementById('postype-kpi-peak-date').textContent = `${peakDay.slice(8,10)}일 (${dow[d.getUTCDay()]})`;
    } else {
      document.getElementById('postype-kpi-peak').textContent      = '—';
      document.getElementById('postype-kpi-peak-date').textContent = '—';
    }

    // KPI 4: 전월 대비
    const dEl = document.getElementById('postype-kpi-delta');
    const dSub = document.getElementById('postype-kpi-delta-sub');
    if (prevSum === 0 && sum === 0){
      dEl.textContent = '—';
      dEl.className = 'text-3xl font-extrabold tracking-tight mt-2 tabular-nums text-slate-400';
      dSub.textContent = '전월 데이터 없음';
    } else if (prevSum === 0){
      dEl.textContent = `+${KRW(sum)}`;
      dEl.className = 'text-3xl font-extrabold tracking-tight mt-2 tabular-nums text-emerald-600';
      dSub.textContent = '전월 데이터 없음';
    } else {
      const sign = delta >= 0 ? '+' : '';
      dEl.textContent = `${sign}${pct.toFixed(1)}%`;
      dEl.className = 'text-3xl font-extrabold tracking-tight mt-2 tabular-nums ' + (delta >= 0 ? 'text-emerald-600' : 'text-rose-600');
      dSub.textContent = `${sign}${KRW(delta)} · 전월 ${KRW(prevSum)}`;
    }

    // YTD 누적
    document.getElementById('postype-ytd-total').textContent = KRW(ytdTotal);
  }

  // ─── 일별 차트 SVG (선택 월) ────────────────────────────────────
  function renderDailyChart(monthDaily, yearMonth){
    const wrap  = document.getElementById('postype-daily-chart');
    const empty = document.getElementById('postype-daily-empty');
    const meta  = document.getElementById('postype-chart-meta');
    const old   = wrap.querySelector('svg');
    if (old) old.remove();

    const dim = daysInMonth(yearMonth);
    const map = Object.fromEntries(monthDaily.map(d => [d.date, d.rev || 0]));
    const today = new Date();
    const lastDay = (yearMonth === thisMonth()) ? today.getDate() : dim;

    // 그 달 1일 ~ lastDay (또는 dim) 까지의 일별 데이터 생성
    const full = [];
    const [y, m] = yearMonth.split('-').map(Number);
    for (let day = 1; day <= dim; day++){
      const ds = `${y}-${pad(m)}-${pad(day)}`;
      const dt = new Date(Date.UTC(y, m-1, day));
      full.push({
        date: ds,
        rev: day <= lastDay ? (map[ds] || 0) : null,  // 미래 일은 null
        dow: dow[dt.getUTCDay()],
        day
      });
    }

    const hasAny = full.some(d => d.rev !== null && d.rev > 0);
    if (!hasAny){
      empty.style.display = 'flex';
      empty.textContent = isFuture(yearMonth)
        ? '미래 달은 데이터 없음'
        : '이 달은 아직 데이터가 없어요 · 북마크릿으로 ytd 입력해 백필하세요';
      wrap.__days = [];
      meta.textContent = '—';
      return;
    }
    empty.style.display = 'none';
    meta.textContent = `${dim}일 중 ${full.filter(d => d.rev !== null).length}일 표시`;

    const W = 800, H = 180, PAD = 10;
    const max = Math.max(...full.filter(d => d.rev !== null).map(d => d.rev), 1);
    const xs = full.map((d, i) => (i / Math.max(full.length-1, 1)) * W);

    // 선만 그리되, null인 곳은 path를 끊음
    let path = '';
    let inPath = false;
    full.forEach((d, i) => {
      if (d.rev === null){ inPath = false; return; }
      const x = xs[i];
      const yy = H - PAD - (d.rev / max) * (H - PAD*2);
      path += (inPath ? ` L${x},${yy}` : `M${x},${yy}`);
      inPath = true;
    });
    // 영역(fill)은 데이터 있는 구간만
    const filled = full.map((d, i) => d.rev !== null ? [xs[i], H - PAD - (d.rev / max) * (H - PAD*2)] : null).filter(Boolean);
    const area = filled.length
      ? `M${filled[0][0]},${H} L${filled.map(p => p.join(',')).join(' L')} L${filled[filled.length-1][0]},${H} Z`
      : '';

    wrap.insertAdjacentHTML('afterbegin', `
      <svg viewBox="0 0 ${W} ${H}" width="100%" height="100%" preserveAspectRatio="none" style="display:block">
        <defs>
          <linearGradient id="postype-area-grad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stop-color="#6366f1" stop-opacity="0.25"/>
            <stop offset="1" stop-color="#6366f1" stop-opacity="0"/>
          </linearGradient>
        </defs>
        ${area ? `<path d="${area}" fill="url(#postype-area-grad)"/>` : ''}
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
      const idx  = Math.max(0, Math.min(days.length-1, Math.round(x / rect.width * (days.length-1))));
      const d    = days[idx];
      const label = d.rev === null
        ? `${d.day}일 (${d.dow}) · 미래`
        : `${d.day}일 (${d.dow}) · ${KRW(d.rev)}`;
      tt.textContent = label;
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

  // ─── 월 네비게이션 (좌/우 화살표) ───────────────────────────────
  function attachMonthNav(){
    const prevBtn = document.getElementById('postype-month-prev');
    const nextBtn = document.getElementById('postype-month-next');
    if (!prevBtn || prevBtn.__attached) return;
    prevBtn.__attached = true;
    nextBtn.__attached = true;

    prevBtn.addEventListener('click', () => {
      currentMonth = prevMonth(currentMonth);
      renderForMonth(currentMonth);
    });
    nextBtn.addEventListener('click', () => {
      const next = nextMonth(currentMonth);
      // 미래 달은 1개월까지만 허용 (입금 보기용)
      if (next > nextMonth(thisMonth())) return;
      currentMonth = next;
      renderForMonth(currentMonth);
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

  // ─── 특정 월 렌더 ───────────────────────────────────────────────
  function renderForMonth(yearMonth){
    document.getElementById('postype-month-label').textContent = monthLabel(yearMonth);
    document.getElementById('postype-payment-date').textContent = (() => {
      const p = paymentForMonth(yearMonth);
      const d = new Date(p + 'T00:00:00Z');
      return `${p.slice(5,7)}월 ${p.slice(8,10)}일 (${dow[d.getUTCDay()]})`;
    })();

    const source = isDemoMode ? makeDummyForMonth(yearMonth) : allDaily;
    const monthDaily = source.filter(d => d.date && d.date.startsWith(yearMonth));
    const prevMd    = source.filter(d => d.date && d.date.startsWith(prevMonth(yearMonth)));
    const thisYear  = yearMonth.slice(0, 4);
    const ytdTotal  = source.filter(d => d.date && d.date.startsWith(thisYear)).reduce((a,d) => a + (d.rev||0), 0);

    renderKPIs(monthDaily, prevMd, ytdTotal);
    renderDailyChart(monthDaily, yearMonth);
  }

  // ─── Firestore upsert (북마크릿이 보낸 데이터 저장) ─────────────
  async function pushPostypeData(payload){
    if (!payload || typeof fbRead !== 'function' || typeof fbAdd !== 'function'){
      return { ok: false, error: 'Firebase 미준비 또는 빈 페이로드' };
    }
    const result = {
      daily:  { added: 0, updated: 0 },
      posts:  { added: 0, updated: 0 },
      series: { added: 0, updated: 0 }
    };

    if (Array.isArray(payload.daily) && payload.daily.length){
      const existing = await fbRead(COLL_DAILY);
      const byDate = {};
      existing.forEach(d => { if (d.channelId === CHANNEL_ID && d.date) byDate[d.date] = d._id; });
      for (const d of payload.daily){
        const doc = Object.assign({}, d, { channelId: CHANNEL_ID });
        delete doc._id;
        if (byDate[d.date]){ await fbUpdate(COLL_DAILY, byDate[d.date], doc); result.daily.updated++; }
        else { await fbAdd(COLL_DAILY, doc); result.daily.added++; }
      }
    }

    if (Array.isArray(payload.posts) && payload.posts.length){
      const existing = await fbRead(COLL_POSTS);
      const byId = {};
      existing.forEach(p => { if (p.channelId === CHANNEL_ID && p.postId) byId[p.postId] = p._id; });
      for (const p of payload.posts){
        const doc = Object.assign({}, p, { channelId: CHANNEL_ID });
        delete doc._id;
        if (byId[p.postId]){ await fbUpdate(COLL_POSTS, byId[p.postId], doc); result.posts.updated++; }
        else { await fbAdd(COLL_POSTS, doc); result.posts.added++; }
      }
    }

    if (Array.isArray(payload.series) && payload.series.length){
      const existing = await fbRead(COLL_SERIES);
      const byName = {};
      existing.forEach(s => { if (s.channelId === CHANNEL_ID && s.name) byName[s.name] = s._id; });
      for (const s of payload.series){
        const doc = Object.assign({}, s, { channelId: CHANNEL_ID });
        delete doc._id;
        if (byName[s.name]){ await fbUpdate(COLL_SERIES, byName[s.name], doc); result.series.updated++; }
        else { await fbAdd(COLL_SERIES, doc); result.series.added++; }
      }
    }

    return { ok: true, result };
  }

  function showBridgeStatus(msg, color){
    const el = document.getElementById('postype-last-sync');
    if (!el) return;
    el.innerHTML = `<span style="color:${color||'#6366f1'};font-weight:600">${msg}</span>`;
  }

  function ensureSideJobVisible(){
    try { if (typeof navigate === 'function') navigate('income'); else if (typeof window.navigate === 'function') window.navigate('income'); } catch(e){}
    setTimeout(() => { try { if (typeof window.switchMoneyTab === 'function') window.switchMoneyTab('sidejobs'); } catch(e){} }, 150);
    setTimeout(() => { const sec = document.getElementById('postype-analytics-section'); if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 500);
  }

  function setupPostypeBridge(){
    const params  = new URLSearchParams(location.search);
    const isBridge = params.get('postype-bridge') === '1';

    if (isBridge){
      setTimeout(() => {
        ensureSideJobVisible();
        showBridgeStatus('데이터 수신 대기 중...');
        if (window.opener && !window.opener.closed){
          try { window.opener.postMessage({ type: 'postype-bridge-ready' }, '*'); } catch(e){}
        }
      }, 600);
    }

    window.addEventListener('message', async (e) => {
      if (!e.origin || !e.origin.includes('postype.com')) return;
      if (!e.data || e.data.type !== 'postype-data') return;

      const payload = e.data.payload || {};
      const dN = (payload.daily || []).length;
      const pN = (payload.posts || []).length;
      const sN = (payload.series || []).length;
      showBridgeStatus(`수신: 일별 ${dN}개 · 포스트 ${pN}개 · 시리즈 ${sN}개 · 저장 중...`);

      try {
        const res = await pushPostypeData(payload);
        if (res.ok){
          const r = res.result;
          showBridgeStatus(`✅ 저장 완료 · 일별 ${r.daily.added}+${r.daily.updated} · 포스트 ${r.posts.added}+${r.posts.updated} · 시리즈 ${r.series.added}+${r.series.updated}`, '#10b981');
          loaded = false;
          await loadAndRender();
          if (e.source){ try { e.source.postMessage({ type: 'postype-import-done', result: r }, e.origin); } catch(_){} }
        } else {
          showBridgeStatus(`❌ 저장 실패: ${res.error}`, '#ef4444');
        }
      } catch(err){
        console.error('[postype-bridge] push error', err);
        showBridgeStatus(`❌ 에러: ${err.message}`, '#ef4444');
      }
    });
  }

  // ─── "오늘 데이터 가져오기" 버튼 ────────────────────────────────
  window.syncPostypeAnalytics = function(){
    const url = 'https://www.postype.com/point/earnings/list';
    if (confirm('포스타입 수익 페이지를 새 탭에 열까요?\n로그인된 상태에서 북마크릿을 클릭하면\natelier로 데이터가 자동 전송됩니다.')){
      window.open(url, '_blank');
    }
  };

  // ─── 메인 로드 + 렌더 ───────────────────────────────────────────
  async function loadAndRender(){
    const real = await fetchAllDaily();
    if (real.length === 0){
      isDemoMode = true;
      allDaily   = [];
    } else {
      isDemoMode = false;
      allDaily   = real;
    }
    setSyncLabel(real, isDemoMode);

    if (!currentMonth){
      currentMonth = thisMonth();
    }
    renderForMonth(currentMonth);
  }

  // ─── 디버그 핸들 ────────────────────────────────────────────────
  window.__postypeAnalytics = {
    reload: loadAndRender,
    goMonth: (ym) => { currentMonth = ym; renderForMonth(ym); },
    state: () => ({ allDaily, currentMonth, isDemoMode }),
    paymentForMonth,
    channelId: CHANNEL_ID,
    collections: { daily: COLL_DAILY, posts: COLL_POSTS, series: COLL_SERIES }
  };

  // ─── 초기화 ─────────────────────────────────────────────────────
  function init(){
    const section = document.getElementById('postype-analytics-section');
    if (!section) return;
    attachHover();
    attachMonthNav();
    setupPostypeBridge();

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
