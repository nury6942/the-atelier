/* ───────────────────────────────────────────────────────────────────
   app-6-postype-analytics.js — Postype 채널 매출 분석 + 예측
   - 월별 뷰, 입금일 + 실 입금액(수수료 20%), 12개월 예측
   - 차별화 위젯 5종 + 감쇠 곡선 시리즈 선택 + 성숙도 필터
   ─────────────────────────────────────────────────────────────────── */
(function(){
  'use strict';

  // ─── 상수 ───────────────────────────────────────────────────────
  const CHANNEL_ID  = 'bichu-attic';
  const COLL_DAILY  = 'postypeChannelDaily';
  const COLL_POSTS  = 'postypeChannelPosts';
  const COLL_SERIES = 'postypeChannelSeries';

  // 포스타입 평균 수수료 20% → 실 입금 80%
  const FEE_RATE = 0.20;
  const applyFee = amount => Math.round(amount * (1 - FEE_RATE));

  // 진행 중 시리즈 메타 (수동 설정 — 추후 UI로 변경 가능)
  const ONGOING_SERIES = {
    name: '물고 뜯기',
    publishWeekday: 5,    // 0=일, 5=금
    publishHour: 21,
    totalEpisodes: 28,
    currentEpisode: 10,
    lastPublishDate: '2026-05-22'
  };

  // 2026년 한국 공휴일 (입금일 계산용)
  const KR_HOLIDAYS = new Set([
    '2026-01-01',
    '2026-02-16','2026-02-17','2026-02-18',
    '2026-03-01','2026-03-02',
    '2026-05-05','2026-05-24','2026-05-25',
    '2026-06-06','2026-08-15',
    '2026-09-24','2026-09-25','2026-09-26',
    '2026-10-03','2026-10-09','2026-12-25'
  ]);

  // ─── 상태 ───────────────────────────────────────────────────────
  let allDaily     = [];
  let allPosts     = [];
  let allSeries    = [];
  let currentMonth = null;
  let decaySeries  = '__all__';  // 감쇠 차트에서 선택된 시리즈
  let isDemoMode   = false;
  let loaded       = false;

  // ─── 헬퍼 ───────────────────────────────────────────────────────
  const KRW       = n => (n || 0).toLocaleString('ko-KR') + '원';
  const dow       = ['일','월','화','수','목','금','토'];
  const pad       = n => String(n).padStart(2, '0');
  const todayStr  = () => new Date().toISOString().slice(0,10);
  const thisMonth = () => todayStr().slice(0, 7);
  const ageDays   = (firstTs) => (Date.now() - new Date(firstTs.replace(' ','T') + '+09:00').getTime()) / 86400000;

  function calcPaymentDay(yearMonth){
    const [y, m] = yearMonth.split('-').map(Number);
    let d = new Date(Date.UTC(y, m-1, 10));
    for (let i = 0; i < 7; i++){
      const w   = d.getUTCDay();
      const ymd = d.toISOString().slice(0,10);
      if (w === 0 || w === 6 || KR_HOLIDAYS.has(ymd)) d.setUTCDate(d.getUTCDate() - 1);
      else break;
    }
    return d.toISOString().slice(0,10);
  }
  function paymentForMonth(yearMonth){
    const [y, m] = yearMonth.split('-').map(Number);
    let nY = y, nM = m + 1;
    if (nM > 12){ nY++; nM = 1; }
    return calcPaymentDay(`${nY}-${pad(nM)}`);
  }
  const monthLabel  = ym => { const [y,m] = ym.split('-').map(Number); return `${y}년 ${m}월`; };
  const monthLabelShort = ym => { const [y,m] = ym.split('-').map(Number); return `${m}월`; };
  const prevMonth   = ym => { const [y,m] = ym.split('-').map(Number); return m === 1 ? `${y-1}-12` : `${y}-${pad(m-1)}`; };
  const nextMonth   = ym => { const [y,m] = ym.split('-').map(Number); return m === 12 ? `${y+1}-01` : `${y}-${pad(m+1)}`; };
  const daysInMonth = ym => { const [y,m] = ym.split('-').map(Number); return new Date(y, m, 0).getDate(); };
  const isFuture    = ym => ym > thisMonth();
  const addMonths   = (ym, n) => { let cur = ym; for (let i = 0; i < n; i++) cur = nextMonth(cur); return cur; };

  // ─── 더미 데이터 ───────────────────────────────────────────────
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
      arr.push({ date: `${y}-${pad(m)}-${pad(day)}`, rev: Math.max(0, Math.round(base + wave + noise)), channelId: CHANNEL_ID, _demo: true });
    }
    return arr;
  }

  // ─── Firestore 로딩 ─────────────────────────────────────────────
  async function fetchCollection(name, filter){
    if (typeof fbRead !== 'function') return [];
    try {
      const all = await fbRead(name);
      return all.filter(filter);
    } catch(e){ console.error(`[postype-analytics] fetch ${name} error`, e); return []; }
  }
  const fetchAllDaily  = () => fetchCollection(COLL_DAILY,  d => d.channelId === CHANNEL_ID && d.date).then(a => a.sort((x,y) => x.date.localeCompare(y.date)));
  const fetchAllPosts  = () => fetchCollection(COLL_POSTS,  p => p.channelId === CHANNEL_ID && p.postId);
  const fetchAllSeries = () => fetchCollection(COLL_SERIES, s => s.channelId === CHANNEL_ID && s.name);

  // ─── 예측 모델 ──────────────────────────────────────────────────
  function buildForecastModel(){
    // 진행 시리즈의 평균 D1~D30 (성숙도 필터)
    const ongoing = ONGOING_SERIES;
    const seriesPosts = allPosts.filter(p => p.series === ongoing.name && p.revByAge && p.firstTs);

    const avgAt = (key, minAge) => {
      const mature = seriesPosts.filter(p => ageDays(p.firstTs) >= minAge && p.revByAge[key] !== undefined);
      if (!mature.length) return null;
      return mature.reduce((a,p) => a + p.revByAge[key], 0) / mature.length;
    };

    const decay = {
      d1:  avgAt('d1', 1)  || 0,
      d3:  avgAt('d3', 3)  || 0,
      d7:  avgAt('d7', 7)  || 0,
      d14: avgAt('d14', 14) || 0,
      d30: avgAt('d30', 30) || 0
    };

    // D30 이후 longtail rate (회차당 일별 매출, D30의 약 1.2% 기본 가정)
    // 더 정확히: 가장 오래된 회차의 (total - D30) / (현재나이 - 30) 평균
    const matureFor30 = seriesPosts.filter(p => ageDays(p.firstTs) >= 30 && p.revByAge.d30 !== undefined);
    let longtailDailyRate = decay.d30 * 0.012;  // 기본 가정
    if (matureFor30.length){
      const rates = matureFor30.map(p => {
        const age = ageDays(p.firstTs);
        const extra = (p.totalRev || 0) - (p.revByAge.d30 || 0);
        return age > 30 ? extra / (age - 30) : 0;
      }).filter(r => r > 0);
      if (rates.length) longtailDailyRate = rates.reduce((a,b) => a+b, 0) / rates.length;
    }

    // 회차당 매출 곡선 (발행 후 t일까지 누적)
    function revAtAge(t){
      if (t <= 0) return 0;
      if (t <= 1) return decay.d1 * t;
      if (t <= 3) return decay.d1 + (decay.d3 - decay.d1) * (t-1)/2;
      if (t <= 7) return decay.d3 + (decay.d7 - decay.d3) * (t-3)/4;
      if (t <= 14) return decay.d7 + (decay.d14 - decay.d7) * (t-7)/7;
      if (t <= 30) return decay.d14 + (decay.d30 - decay.d14) * (t-14)/16;
      return decay.d30 + (t-30) * longtailDailyRate;
    }

    // 모든 회차 발행 일정 (기존 + 미래)
    const existing = seriesPosts
      .map(p => ({ date: p.firstTs.slice(0,10), type: 'existing' }))
      .sort((a,b) => a.date.localeCompare(b.date));
    const lastDate = ongoing.lastPublishDate;
    const lastEp = ongoing.currentEpisode;
    const future = [];
    for (let ep = lastEp + 1; ep <= ongoing.totalEpisodes; ep++){
      const d = new Date(lastDate + 'T00:00:00');
      d.setDate(d.getDate() + (ep - lastEp) * 7);
      future.push({ ep, date: d.toISOString().slice(0,10), type: 'future' });
    }
    const allEpisodes = [...existing, ...future];

    // 구작 + 멤버십 longtail (최근 30일 일별 평균)
    const recentCutoff = new Date(Date.now() - 30*86400000).toISOString().slice(0,10);
    const recentDaily = allDaily.filter(d => d.date >= recentCutoff);
    const recentSum = recentDaily.reduce((a,d) => a + (d.rev||0), 0);
    const ongoingRecentSum = recentDaily.reduce((a,d) => {
      if (d.bySeries && d.bySeries[ongoing.name]) return a + d.bySeries[ongoing.name].rev;
      return a;
    }, 0);
    const oldWorksDailyAvg = Math.max(0, (recentSum - ongoingRecentSum) / Math.max(recentDaily.length, 1));

    // 월별 예측 (그 달 전체 매출)
    function predictMonth(yearMonth){
      const [y, m] = yearMonth.split('-').map(Number);
      const monthStart = new Date(Date.UTC(y, m-1, 1));
      const monthEnd   = new Date(Date.UTC(y, m, 0));
      let total = 0;
      allEpisodes.forEach(ep => {
        const pubDate = new Date(ep.date + 'T00:00:00Z');
        const ageEnd  = (monthEnd - pubDate) / 86400000 + 1;
        const ageStart = (monthStart - pubDate) / 86400000;
        if (ageEnd <= 0) return;
        total += revAtAge(ageEnd) - revAtAge(Math.max(0, ageStart));
      });
      total += oldWorksDailyAvg * daysInMonth(yearMonth);
      return Math.round(total);
    }

    return { decay, allEpisodes, oldWorksDailyAvg, longtailDailyRate, predictMonth, revAtAge };
  }

  // ─── 예측: 이번 달 (실측 + 남은 일수 모델) ──────────────────────
  function predictThisMonth(model){
    const thisM = thisMonth();
    const todayD = new Date().getDate();
    const dim = daysInMonth(thisM);
    const actual = allDaily
      .filter(d => d.date.startsWith(thisM) && d.date <= todayStr())
      .reduce((a,d) => a + (d.rev||0), 0);
    const modelTotal = model.predictMonth(thisM);
    const remainingDays = Math.max(0, dim - todayD);
    const modelDailyAvg = modelTotal / dim;
    const remainingForecast = modelDailyAvg * remainingDays;
    return { total: Math.round(actual + remainingForecast), actual, remainingForecast: Math.round(remainingForecast), modelTotal };
  }

  // ─── KPI 4개 렌더 ───────────────────────────────────────────────
  function renderKPIs(monthDaily, prevMonthDaily, ytdTotal){
    const sum     = monthDaily.reduce((a,d) => a + (d.rev||0), 0);
    const txCount = monthDaily.reduce((a,d) => a + (d.txCount||0), 0);
    const dayCnt  = monthDaily.length;
    const avg     = dayCnt ? Math.round(sum / dayCnt) : 0;
    let peakDay = null, peakRev = 0;
    monthDaily.forEach(d => { if ((d.rev||0) > peakRev){ peakRev = d.rev; peakDay = d.date; } });
    const prevSum = prevMonthDaily.reduce((a,d) => a + (d.rev||0), 0);
    const delta   = sum - prevSum;
    const pct     = prevSum ? ((delta / prevSum) * 100) : null;

    document.getElementById('postype-kpi-month-total').textContent = KRW(sum);
    document.getElementById('postype-kpi-month-sub').textContent   = dayCnt ? `${dayCnt}일 / ${txCount.toLocaleString('ko-KR')}건 · 실수령 ${KRW(applyFee(sum))}` : '데이터 없음';
    document.getElementById('postype-kpi-daily-avg').textContent     = KRW(avg);
    document.getElementById('postype-kpi-daily-avg-sub').textContent = dayCnt ? `${dayCnt}일 평균 · 실수령 ${KRW(applyFee(avg))}/일` : '—';
    if (peakDay){
      const d = new Date(peakDay + 'T00:00:00Z');
      document.getElementById('postype-kpi-peak').textContent      = KRW(peakRev);
      document.getElementById('postype-kpi-peak-date').textContent = `${peakDay.slice(8,10)}일 (${dow[d.getUTCDay()]})`;
    } else {
      document.getElementById('postype-kpi-peak').textContent      = '—';
      document.getElementById('postype-kpi-peak-date').textContent = '—';
    }
    const dEl  = document.getElementById('postype-kpi-delta');
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
    document.getElementById('postype-ytd-total').textContent = KRW(ytdTotal);
    document.getElementById('postype-ytd-net').textContent   = KRW(applyFee(ytdTotal));
  }

  // ─── 일별 차트 (선택 월) ────────────────────────────────────────
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

    const full = [];
    const [y, m] = yearMonth.split('-').map(Number);
    for (let day = 1; day <= dim; day++){
      const ds = `${y}-${pad(m)}-${pad(day)}`;
      const dt = new Date(Date.UTC(y, m-1, day));
      full.push({ date: ds, rev: day <= lastDay ? (map[ds] || 0) : null, dow: dow[dt.getUTCDay()], day });
    }

    const hasAny = full.some(d => d.rev !== null && d.rev > 0);
    if (!hasAny){
      empty.style.display = 'flex';
      empty.textContent = isFuture(yearMonth) ? '미래 달은 데이터 없음 (예측은 위 차트에서)' : '이 달은 아직 데이터가 없어요 · 북마크릿으로 ytd 입력해 백필';
      wrap.__days = []; meta.textContent = '—';
      return;
    }
    empty.style.display = 'none';
    meta.textContent = `${dim}일 중 ${full.filter(d => d.rev !== null).length}일 표시`;

    const W = 800, H = 180, PAD = 10;
    const max = Math.max(...full.filter(d => d.rev !== null).map(d => d.rev), 1);
    const xs = full.map((d, i) => (i / Math.max(full.length-1, 1)) * W);
    let path = ''; let inPath = false;
    full.forEach((d, i) => {
      if (d.rev === null){ inPath = false; return; }
      const x = xs[i];
      const yy = H - PAD - (d.rev / max) * (H - PAD*2);
      path += (inPath ? ` L${x},${yy}` : `M${x},${yy}`);
      inPath = true;
    });
    const filled = full.map((d, i) => d.rev !== null ? [xs[i], H - PAD - (d.rev / max) * (H - PAD*2)] : null).filter(Boolean);
    const area = filled.length ? `M${filled[0][0]},${H} L${filled.map(p => p.join(',')).join(' L')} L${filled[filled.length-1][0]},${H} Z` : '';

    wrap.insertAdjacentHTML('afterbegin', `
      <svg viewBox="0 0 ${W} ${H}" width="100%" height="100%" preserveAspectRatio="none" style="display:block">
        <defs><linearGradient id="postype-area-grad" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#6366f1" stop-opacity="0.25"/><stop offset="1" stop-color="#6366f1" stop-opacity="0"/></linearGradient></defs>
        ${area ? `<path d="${area}" fill="url(#postype-area-grad)"/>` : ''}
        <path d="${path}" fill="none" stroke="#6366f1" stroke-width="2" stroke-linejoin="round"/>
      </svg>`);
    wrap.__days = full;
  }

  // ─── 위젯 1: 시리즈 회차별 매출 곡선 ────────────────────────────
  function renderSeriesCurves(){
    const wrap = document.getElementById('postype-series-curves');
    if (!wrap) return;
    if (!allSeries.length || !allPosts.length){
      wrap.innerHTML = '<div class="col-span-2 text-center text-slate-400 text-sm py-12">데이터 없음 · 북마크릿으로 import 필요</div>';
      return;
    }
    const top = [...allSeries]
      .filter(s => s.name !== '_멤버십_' && s.name !== '_미분류_' && (s.posts || []).length >= 2)
      .sort((a, b) => (b.totalRev||0) - (a.totalRev||0))
      .slice(0, 4);
    if (!top.length){
      wrap.innerHTML = '<div class="col-span-2 text-center text-slate-400 text-sm py-12">회차 2개 이상인 시리즈가 없어요</div>';
      return;
    }
    const postById = Object.fromEntries(allPosts.map(p => [p.postId, p]));
    wrap.innerHTML = top.map(s => {
      const posts = (s.posts || []).map(id => postById[id]).filter(Boolean);
      if (posts.length < 2) return '';
      const max = Math.max(...posts.map(p => p.totalRev || 0), 1);
      const W = 100, H = 50;
      const points = posts.map((p, i) => {
        const x = (i / Math.max(posts.length-1, 1)) * W;
        const y = H - ((p.totalRev || 0) / max) * (H - 4) - 2;
        return `${x},${y}`;
      }).join(' ');
      const first = posts[0].totalRev || 0;
      const last  = posts[posts.length-1].totalRev || 0;
      const trend = first > 0 ? Math.round((last - first) / first * 100) : 0;
      const trendColor = trend >= 0 ? 'text-emerald-600' : 'text-rose-600';
      const circles = posts.map((p, i) => {
        const x = (i / Math.max(posts.length-1, 1)) * W;
        const y = H - ((p.totalRev || 0) / max) * (H - 4) - 2;
        return `<circle cx="${x}" cy="${y}" r="1.5" fill="#6366f1"/>`;
      }).join('');
      return `<div class="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
        <div class="flex justify-between items-baseline mb-1.5">
          <span class="text-xs font-bold text-slate-800 truncate" style="max-width:60%">${s.name}</span>
          <span class="text-[10px] ${trendColor} font-bold whitespace-nowrap">${posts.length}편 · ${trend >= 0 ? '+' : ''}${trend}%</span>
        </div>
        <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="width:100%;height:42px;display:block">
          <polyline points="${points}" fill="none" stroke="#6366f1" stroke-width="1.5"/>${circles}
        </svg>
        <div class="flex justify-between text-[10px] text-slate-400 mt-1">
          <span>1화 ${KRW(first)}</span><span>${posts.length}화 ${KRW(last)}</span>
        </div>
      </div>`;
    }).join('');
  }

  // ─── 위젯 2: D1~D30 감쇠 (시리즈 선택 + 성숙도 필터) ────────────
  function populateDecaySeriesSelect(){
    const sel = document.getElementById('postype-decay-series');
    if (!sel) return;
    const currentVal = sel.value || '__all__';
    // TOP 5 (회차 2개 이상)
    const candidates = [...allSeries]
      .filter(s => s.name !== '_멤버십_' && s.name !== '_미분류_' && (s.posts || []).length >= 2)
      .sort((a,b) => (b.totalRev||0) - (a.totalRev||0))
      .slice(0, 5);
    sel.innerHTML = '<option value="__all__">전체 평균</option>' + candidates.map(s => `<option value="${s.name}">${s.name} (${(s.posts||[]).length}편)</option>`).join('');
    sel.value = candidates.find(c => c.name === currentVal) ? currentVal : '__all__';
    if (!sel.__attached){
      sel.__attached = true;
      sel.addEventListener('change', () => {
        decaySeries = sel.value;
        renderDecayChart();
      });
    }
  }
  function renderDecayChart(){
    const wrap  = document.getElementById('postype-decay-chart');
    const empty = document.getElementById('postype-decay-empty');
    const meta  = document.getElementById('postype-decay-meta');
    wrap.querySelectorAll('svg').forEach(el => el.remove());

    // 시리즈 필터
    let pool = allPosts.filter(p => p.revByAge && p.firstTs);
    if (decaySeries !== '__all__') pool = pool.filter(p => p.series === decaySeries);

    if (!pool.length){
      if (empty){ empty.style.display = 'flex'; empty.textContent = '데이터 없음'; }
      if (meta) meta.textContent = '—';
      return;
    }

    // 성숙도 필터 (각 D 지점마다)
    const avgAt = (key, minAge) => {
      const mature = pool.filter(p => ageDays(p.firstTs) >= minAge && p.revByAge[key] !== undefined);
      if (!mature.length) return null;
      return { value: Math.round(mature.reduce((a,p) => a + p.revByAge[key], 0) / mature.length), n: mature.length };
    };
    const points = [
      { label: 'D1',  ...(avgAt('d1', 1)  || {}) },
      { label: 'D3',  ...(avgAt('d3', 3)  || {}) },
      { label: 'D7',  ...(avgAt('d7', 7)  || {}) },
      { label: 'D14', ...(avgAt('d14', 14) || {}) },
      { label: 'D30', ...(avgAt('d30', 30) || {}) }
    ].filter(p => p.value !== undefined);

    if (!points.length){
      if (empty){ empty.style.display = 'flex'; empty.textContent = '성숙한 회차가 없어요 (D1 이상 1편 필요)'; }
      if (meta) meta.textContent = '—';
      return;
    }
    if (empty) empty.style.display = 'none';

    const max = Math.max(...points.map(p => p.value), 1);
    const W = 320, H = 180, PADX = 30, PADY = 25;
    const xs = points.map((p, i) => PADX + (i / Math.max(points.length-1, 1)) * (W - PADX*2));
    const ys = points.map(p => H - PADY - (p.value / max) * (H - PADY*2));
    const path = xs.map((x, i) => `${i ? 'L' : 'M'}${x},${ys[i]}`).join(' ');

    const svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style="display:block">
      <path d="${path}" fill="none" stroke="#10b981" stroke-width="2.5" stroke-linejoin="round"/>
      ${points.map((p, i) => `
        <circle cx="${xs[i]}" cy="${ys[i]}" r="3.5" fill="#10b981"/>
        <text x="${xs[i]}" y="${ys[i] - 8}" text-anchor="middle" fill="#475569" font-size="10" font-weight="600">${KRW(p.value)}</text>
        <text x="${xs[i]}" y="${H - 6}" text-anchor="middle" fill="#94a3b8" font-size="11" font-weight="700">${p.label}</text>
      `).join('')}
    </svg>`;
    wrap.insertAdjacentHTML('afterbegin', svg);
    if (meta){
      const seriesName = decaySeries === '__all__' ? '전체' : decaySeries;
      const cohortInfo = points.map(p => `${p.label} ${p.n}편`).join(' · ');
      meta.textContent = `${seriesName} · 성숙도별 cohort: ${cohortInfo}`;
    }
  }

  // ─── 위젯 3: 발행 시점 효과 ─────────────────────────────────────
  function renderPubEffect(){
    const wrap = document.getElementById('postype-pub-effect');
    const withFirst = allPosts.filter(p => p.firstTs && p.revByAge && p.revByAge.d1 !== undefined);
    if (!withFirst.length){
      wrap.innerHTML = '<div class="text-center text-slate-400 text-sm py-8">데이터 없음</div>';
      return;
    }
    const byDow = Array(7).fill().map(() => ({ posts: 0, total: 0 }));
    const byBucket = { '새벽 0-5': {posts:0,total:0}, '아침 6-11': {posts:0,total:0}, '오후 12-17': {posts:0,total:0}, '저녁 18-23': {posts:0,total:0} };
    withFirst.forEach(p => {
      const parts = p.firstTs.match(/(\d{4})-(\d{2})-(\d{2}) (\d{2}):/);
      if (!parts) return;
      const dt = new Date(Date.UTC(+parts[1], +parts[2]-1, +parts[3]));
      const dowIdx = dt.getUTCDay();
      byDow[dowIdx].posts++; byDow[dowIdx].total += p.revByAge.d1 || 0;
      const h = +parts[4];
      const bk = h <= 5 ? '새벽 0-5' : h <= 11 ? '아침 6-11' : h <= 17 ? '오후 12-17' : '저녁 18-23';
      byBucket[bk].posts++; byBucket[bk].total += p.revByAge.d1 || 0;
    });
    const maxDowTotal = Math.max(...byDow.map(x => x.total));
    const maxBkTotal  = Math.max(...Object.values(byBucket).map(x => x.total));
    const dowRows = dow.map((d, i) => {
      const v = byDow[i];
      const avg = v.posts ? Math.round(v.total / v.posts) : 0;
      const isMax = v.posts > 0 && v.total === maxDowTotal;
      return `<tr ${isMax ? 'class="bg-indigo-50"' : ''}><td class="px-2 py-1.5 ${isMax ? 'text-indigo-700 font-bold' : 'text-slate-700'}">${d}</td><td class="px-2 py-1.5 text-right tabular-nums text-slate-500">${v.posts}편</td><td class="px-2 py-1.5 text-right tabular-nums font-bold ${isMax ? 'text-indigo-600' : 'text-slate-800'}">${KRW(avg)}</td></tr>`;
    }).join('');
    const bkRows = Object.entries(byBucket).map(([k, v]) => {
      const avg = v.posts ? Math.round(v.total / v.posts) : 0;
      const isMax = v.posts > 0 && v.total === maxBkTotal;
      return `<tr ${isMax ? 'class="bg-indigo-50"' : ''}><td class="px-2 py-1.5 ${isMax ? 'text-indigo-700 font-bold' : 'text-slate-700'}">${k}</td><td class="px-2 py-1.5 text-right tabular-nums text-slate-500">${v.posts}편</td><td class="px-2 py-1.5 text-right tabular-nums font-bold ${isMax ? 'text-indigo-600' : 'text-slate-800'}">${KRW(avg)}</td></tr>`;
    }).join('');
    wrap.innerHTML = `
      <div class="text-[10px] uppercase tracking-widest text-slate-400 mb-1 px-2">요일별 24h 평균</div>
      <table class="w-full text-xs mb-3"><tbody>${dowRows}</tbody></table>
      <div class="text-[10px] uppercase tracking-widest text-slate-400 mb-1 px-2">시간대별 24h 평균</div>
      <table class="w-full text-xs"><tbody>${bkRows}</tbody></table>`;
  }

  // ─── 위젯 4: 가격대 분포 ────────────────────────────────────────
  function renderPriceDist(monthDaily){
    const wrap = document.getElementById('postype-price-dist');
    const meta = document.getElementById('postype-price-meta');
    const merged = {};
    monthDaily.forEach(d => {
      if (!d.byPriceBucket) return;
      Object.entries(d.byPriceBucket).forEach(([p, c]) => { merged[p] = (merged[p] || 0) + c; });
    });
    if (!Object.keys(merged).length){
      wrap.innerHTML = '<div class="text-center text-slate-400 text-sm py-8">데이터 없음</div>';
      if (meta) meta.textContent = '—';
      return;
    }
    const buckets = { '500P': 0, '600~700P': 0, '800~1000P': 0, '1500P+': 0, '2500P+ (묶음)': 0 };
    Object.entries(merged).forEach(([p, c]) => {
      const v = parseInt(p);
      if (v === 500) buckets['500P'] += c;
      else if (v <= 700) buckets['600~700P'] += c;
      else if (v <= 1000) buckets['800~1000P'] += c;
      else if (v < 2500) buckets['1500P+'] += c;
      else buckets['2500P+ (묶음)'] += c;
    });
    const total = Object.values(buckets).reduce((a, b) => a + b, 0);
    const bundlePct = total ? (buckets['2500P+ (묶음)'] / total * 100).toFixed(1) : 0;
    if (meta) meta.textContent = `묶음 ${bundlePct}%`;
    const rows = Object.entries(buckets).map(([k, c]) => {
      const pct = total ? (c / total * 100).toFixed(1) : 0;
      const isBundle = k.includes('묶음');
      return `<tr><td class="px-2 py-1.5 ${isBundle ? 'text-amber-700 font-bold' : 'text-slate-700'}">${k}</td><td class="px-2 py-1.5 text-right tabular-nums text-slate-500">${c}건</td><td class="px-2 py-1.5 text-right tabular-nums text-slate-500">${pct}%</td><td class="px-2 py-1.5" style="width:90px"><div class="h-1.5 bg-slate-100 rounded overflow-hidden"><div style="width:${pct}%;height:100%;background:${isBundle ? 'linear-gradient(90deg,#f59e0b,#fbbf24)' : 'linear-gradient(90deg,#6366f1,#a5b4fc)'}"></div></div></td></tr>`;
    }).join('');
    wrap.innerHTML = `<table class="w-full text-xs"><tbody>${rows}</tbody></table>`;
  }

  // ─── 위젯 5: 요일×시간 히트맵 ───────────────────────────────────
  function renderHeatmap(monthDaily){
    const wrap = document.getElementById('postype-heatmap');
    const meta = document.getElementById('postype-heatmap-meta');
    const grid = Array(7).fill().map(() => Array(24).fill(0));
    monthDaily.forEach(d => {
      if (!d.byHour || !d.date) return;
      const dt = new Date(d.date + 'T00:00:00Z');
      const dowIdx = dt.getUTCDay();
      for (let h = 0; h < 24; h++) grid[dowIdx][h] += d.byHour[h] || 0;
    });
    const max = Math.max(...grid.flat());
    if (max === 0){
      wrap.innerHTML = '<div class="text-center text-slate-400 text-sm py-8">데이터 없음</div>';
      if (meta) meta.textContent = '—';
      return;
    }
    const headerCells = Array.from({length: 24}, (_, h) => `<div class="text-[9px] text-slate-400 text-center">${h % 3 === 0 ? h : ''}</div>`).join('');
    const dayRows = [0,1,2,3,4,5,6].map(d => {
      const cells = Array.from({length: 24}, (_, h) => {
        const v = grid[d][h];
        const alpha = Math.min((v / max) * 1.5, 1);
        return `<div style="aspect-ratio:1;border-radius:2px;background:rgba(99,102,241,${alpha})" title="${dow[d]} ${h}시: ${KRW(v)}"></div>`;
      }).join('');
      return `<div class="text-[11px] text-slate-500 text-right pr-2 flex items-center justify-end">${dow[d]}</div>${cells}`;
    }).join('');
    wrap.innerHTML = `
      <div class="grid gap-1" style="grid-template-columns:auto repeat(24, 1fr)">
        <div></div>${headerCells}
        ${dayRows}
      </div>
      <div class="text-[10px] text-slate-400 mt-2">진할수록 매출↑ · 최댓값 ${KRW(max)}</div>`;
    if (meta) meta.textContent = `${monthDaily.length}일 합산`;
  }

  // ─── 예측 카드 3개 + 12개월 차트 렌더 ──────────────────────────
  function renderForecast(){
    if (!allPosts.length || !allDaily.length){
      // 데이터 없으면 placeholder
      ['this','next'].forEach(k => {
        document.getElementById(`postype-forecast-${k}-total`).textContent = '—';
        document.getElementById(`postype-forecast-${k}-net`).textContent = '실수령 ≈ —';
        document.getElementById(`postype-forecast-${k}-sub`).textContent = '데이터 import 후 표시';
      });
      document.getElementById('postype-ongoing-name').textContent = '—';
      document.getElementById('postype-ongoing-progress').textContent = '—';
      document.getElementById('postype-ongoing-sub').textContent = '데이터 없음';
      document.getElementById('postype-forecast-empty').style.display = 'flex';
      return;
    }

    const model = buildForecastModel();

    // 이번 달 카드
    const thisM = thisMonth();
    const thisF = predictThisMonth(model);
    document.getElementById('postype-forecast-this-total').textContent = KRW(thisF.total);
    document.getElementById('postype-forecast-this-net').textContent = `실수령 ≈ ${KRW(applyFee(thisF.total))}`;
    const payDateThis = paymentForMonth(thisM);
    document.getElementById('postype-forecast-this-sub').textContent = `${monthLabel(thisM)} · 실측 ${KRW(thisF.actual)} + 남은 일수 예측 ${KRW(thisF.remainingForecast)} · 입금 ${payDateThis.slice(5,7)}/${payDateThis.slice(8,10)}`;
    document.getElementById('postype-payment-amount').textContent = `${KRW(applyFee(thisF.total))}`;

    // 다음 달 카드
    const nextM = nextMonth(thisM);
    const nextTotal = model.predictMonth(nextM);
    document.getElementById('postype-forecast-next-total').textContent = KRW(nextTotal);
    document.getElementById('postype-forecast-next-net').textContent = `실수령 ≈ ${KRW(applyFee(nextTotal))}`;
    const payDateNext = paymentForMonth(nextM);
    document.getElementById('postype-forecast-next-sub').textContent = `${monthLabel(nextM)} 예측 · 입금 ${payDateNext.slice(5,7)}/${payDateNext.slice(8,10)}`;

    // 연재 진행 카드
    const ongoing = ONGOING_SERIES;
    const remaining = ongoing.totalEpisodes - ongoing.currentEpisode;
    const finishDate = new Date(ongoing.lastPublishDate + 'T00:00:00');
    finishDate.setDate(finishDate.getDate() + remaining * 7);
    document.getElementById('postype-ongoing-name').textContent = ongoing.name;
    document.getElementById('postype-ongoing-progress').textContent = `${ongoing.currentEpisode}화 / ${ongoing.totalEpisodes}화`;
    const finishStr = `${finishDate.getMonth()+1}/${finishDate.getDate()}`;
    document.getElementById('postype-ongoing-sub').textContent = `남은 ${remaining}화 · 매주 ${dow[ongoing.publishWeekday]} ${ongoing.publishHour}:00 · 완결 예정 ${finishStr}`;

    // 12개월 예측 차트
    render12MonthChart(model);
  }

  function render12MonthChart(model){
    const wrap = document.getElementById('postype-forecast-chart');
    const empty = document.getElementById('postype-forecast-empty');
    wrap.querySelectorAll('svg').forEach(el => el.remove());
    if (empty) empty.style.display = 'none';

    // 이번 달부터 12개월
    const months = [];
    let cur = thisMonth();
    for (let i = 0; i < 12; i++){
      const isPast = cur < thisMonth();
      const isCurrent = cur === thisMonth();
      let actual = null, forecast = null;
      if (cur === thisMonth()){
        const thisF = predictThisMonth(model);
        actual = thisF.actual;
        forecast = thisF.total;
      } else if (cur > thisMonth()){
        forecast = model.predictMonth(cur);
      }
      months.push({ ym: cur, actual, forecast });
      cur = nextMonth(cur);
    }

    const W = 800, H = 220, PADX = 30, PADY = 30;
    const max = Math.max(...months.map(m => Math.max(m.actual||0, m.forecast||0)), 1);
    const barW = (W - PADX*2) / months.length;
    const innerBarW = barW * 0.6;
    const barOffset = barW * 0.2;

    const bars = months.map((m, i) => {
      const x = PADX + i * barW + barOffset;
      const forecastH = m.forecast ? (m.forecast / max) * (H - PADY*2) : 0;
      const actualH   = m.actual   ? (m.actual / max) * (H - PADY*2)   : 0;
      const forecastY = H - PADY - forecastH;
      const actualY   = H - PADY - actualH;
      const labelY = H - 10;
      const valueY = forecastY - 6;
      return `
        <rect x="${x}" y="${forecastY}" width="${innerBarW}" height="${forecastH}" fill="#a5b4fc" opacity="0.6" rx="2"/>
        ${m.actual !== null ? `<rect x="${x}" y="${actualY}" width="${innerBarW}" height="${actualH}" fill="#6366f1" rx="2"/>` : ''}
        ${m.forecast ? `<text x="${x + innerBarW/2}" y="${valueY}" text-anchor="middle" fill="#475569" font-size="9" font-weight="600">${(m.forecast/10000).toFixed(0)}만</text>` : ''}
        <text x="${x + innerBarW/2}" y="${labelY}" text-anchor="middle" fill="#94a3b8" font-size="10">${monthLabelShort(m.ym)}</text>
      `;
    }).join('');

    wrap.insertAdjacentHTML('afterbegin', `
      <svg viewBox="0 0 ${W} ${H}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style="display:block">
        ${bars}
      </svg>`);
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
      const label = d.rev === null ? `${d.day}일 (${d.dow}) · 미래` : `${d.day}일 (${d.dow}) · ${KRW(d.rev)}`;
      tt.textContent = label;
      tt.style.display = 'block';
      const ttx = Math.min(Math.max(x + 12, 8), rect.width - 200);
      tt.style.left = ttx + 'px';
      tt.style.top  = '8px';
      vl.style.display = 'block';
      vl.style.left = (idx / Math.max(days.length-1, 1) * rect.width) + 'px';
    });
    wrap.addEventListener('mouseleave', () => { tt.style.display = 'none'; vl.style.display = 'none'; });
  }

  // ─── 월 네비게이션 ─────────────────────────────────────────────
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
      if (next > nextMonth(thisMonth())) return;
      currentMonth = next;
      renderForMonth(currentMonth);
    });
  }

  function setSyncLabel(daily, demo){
    const el = document.getElementById('postype-last-sync');
    if (!el) return;
    if (demo){
      el.innerHTML = '<span style="background:#f59e0b;color:white;padding:2px 6px;border-radius:4px;font-size:10px;font-weight:bold;letter-spacing:0.05em;margin-right:6px">DEMO</span>더미 데이터';
    } else if (!daily.length){
      el.textContent = '마지막 동기화: 없음';
    } else {
      const dates = daily.map(d => d.date).sort();
      el.innerHTML = `데이터: <span class="font-bold text-slate-700">${dates[0]}</span> ~ <span class="font-bold text-slate-700">${dates[dates.length-1]}</span> · 총 ${dates.length}일`;
    }
  }

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
    renderSeriesCurves();
    populateDecaySeriesSelect();
    renderDecayChart();
    renderPubEffect();
    renderPriceDist(monthDaily);
    renderHeatmap(monthDaily);
    renderForecast();
  }

  // ─── Firestore upsert ──────────────────────────────────────────
  async function pushPostypeData(payload){
    if (!payload || typeof fbRead !== 'function' || typeof fbAdd !== 'function'){
      return { ok: false, error: 'Firebase 미준비 또는 빈 페이로드' };
    }
    const result = { daily: {added:0,updated:0}, posts: {added:0,updated:0}, series: {added:0,updated:0} };
    if (Array.isArray(payload.daily) && payload.daily.length){
      const existing = await fbRead(COLL_DAILY);
      const byDate = {};
      existing.forEach(d => { if (d.channelId === CHANNEL_ID && d.date) byDate[d.date] = d._id; });
      for (const d of payload.daily){
        const doc = Object.assign({}, d, { channelId: CHANNEL_ID }); delete doc._id;
        if (byDate[d.date]){ await fbUpdate(COLL_DAILY, byDate[d.date], doc); result.daily.updated++; }
        else { await fbAdd(COLL_DAILY, doc); result.daily.added++; }
      }
    }
    if (Array.isArray(payload.posts) && payload.posts.length){
      const existing = await fbRead(COLL_POSTS);
      const byId = {};
      existing.forEach(p => { if (p.channelId === CHANNEL_ID && p.postId) byId[p.postId] = p._id; });
      for (const p of payload.posts){
        const doc = Object.assign({}, p, { channelId: CHANNEL_ID }); delete doc._id;
        if (byId[p.postId]){ await fbUpdate(COLL_POSTS, byId[p.postId], doc); result.posts.updated++; }
        else { await fbAdd(COLL_POSTS, doc); result.posts.added++; }
      }
    }
    if (Array.isArray(payload.series) && payload.series.length){
      const existing = await fbRead(COLL_SERIES);
      const byName = {};
      existing.forEach(s => { if (s.channelId === CHANNEL_ID && s.name) byName[s.name] = s._id; });
      for (const s of payload.series){
        const doc = Object.assign({}, s, { channelId: CHANNEL_ID }); delete doc._id;
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
        } else { showBridgeStatus(`❌ 저장 실패: ${res.error}`, '#ef4444'); }
      } catch(err){
        console.error('[postype-bridge] push error', err);
        showBridgeStatus(`❌ 에러: ${err.message}`, '#ef4444');
      }
    });
  }

  window.syncPostypeAnalytics = function(){
    const url = 'https://www.postype.com/point/earnings/list';
    if (confirm('포스타입 수익 페이지를 새 탭에 열까요?\n로그인된 상태에서 북마크릿을 클릭하면\natelier로 데이터가 자동 전송됩니다.\n\n💡 첫 백필이면 prompt에 "ytd" 입력하세요!')){
      window.open(url, '_blank');
    }
  };

  async function loadAndRender(){
    const [daily, posts, series] = await Promise.all([
      fetchAllDaily(), fetchAllPosts(), fetchAllSeries()
    ]);
    if (daily.length === 0){
      isDemoMode = true; allDaily = []; allPosts = []; allSeries = [];
    } else {
      isDemoMode = false; allDaily = daily; allPosts = posts; allSeries = series;
    }
    setSyncLabel(daily, isDemoMode);
    if (!currentMonth) currentMonth = thisMonth();
    renderForMonth(currentMonth);
  }

  window.__postypeAnalytics = {
    reload: loadAndRender,
    goMonth: (ym) => { currentMonth = ym; renderForMonth(ym); },
    state: () => ({ allDaily, allPosts, allSeries, currentMonth, isDemoMode }),
    paymentForMonth,
    ongoingSeries: ONGOING_SERIES,
    feeRate: FEE_RATE,
    forecastModel: () => buildForecastModel(),
    channelId: CHANNEL_ID
  };

  function init(){
    const section = document.getElementById('postype-analytics-section');
    if (!section) return;
    attachHover();
    attachMonthNav();
    setupPostypeBridge();
    const observer = new IntersectionObserver((entries) => {
      for (const e of entries){
        if (e.isIntersecting && !loaded){
          loaded = true; loadAndRender(); observer.disconnect();
        }
      }
    }, { root: null, threshold: 0.05 });
    observer.observe(section);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
