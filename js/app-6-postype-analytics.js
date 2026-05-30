/* ───────────────────────────────────────────────────────────────────
   app-6-postype-analytics.js — Postype 매출 분석 (멀티채널 + 예측 + YoY)
   - 채널 선택 (고요한 다락방 / 요란한 옥탑방)
   - 월별 뷰, 입금일 자동(2026·2027 공휴일), 실수령(80%)
   - 12개월 예측 + 연도 비교
   - 차별화 위젯 5종 (감쇠 시리즈 선택 + 성숙도 필터 포함)
   ─────────────────────────────────────────────────────────────────── */
(function(){
  'use strict';

  // ─── 상수 ───────────────────────────────────────────────────────
  const COLL_DAILY  = 'postypeChannelDaily';
  const COLL_POSTS  = 'postypeChannelPosts';
  const COLL_SERIES = 'postypeChannelSeries';
  const FEE_RATE    = 0.20;
  const applyFee    = amount => Math.round(amount * (1 - FEE_RATE));

  // 채널 메타 (진행 시리즈 정보는 채널별)
  const CHANNELS = {
    'bichu-attic': {
      id: 'bichu-attic',
      displayName: '고요한 다락방',
      ongoing: {
        name: '물고 뜯기',
        publishWeekday: 5,     // 금
        publishHour: 21,
        totalEpisodes: 28,
        currentEpisode: 10,
        lastPublishDate: '2026-05-22'
      }
    },
    'hotnncold': {
      id: 'hotnncold',
      displayName: '요란한 옥탑방',
      ongoing: null,
      status: 'idle',
      note: '연재 완결 · 차기작 준비 중 (예정: 2026년 말)'
    }
  };

  // 한국 공휴일 (2026 + 2027)
  const KR_HOLIDAYS = new Set([
    // 2026
    '2026-01-01',
    '2026-02-16','2026-02-17','2026-02-18',
    '2026-03-01','2026-03-02',
    '2026-05-05','2026-05-24','2026-05-25',
    '2026-06-06','2026-08-15',
    '2026-09-24','2026-09-25','2026-09-26',
    '2026-10-03','2026-10-09','2026-12-25',
    // 2027
    '2027-01-01',
    '2027-02-06','2027-02-07','2027-02-08','2027-02-09',
    '2027-03-01',
    '2027-05-05','2027-05-13',
    '2027-06-06','2027-06-07',
    '2027-08-15','2027-08-16',
    '2027-09-14','2027-09-15','2027-09-16',
    '2027-10-03','2027-10-04','2027-10-09','2027-10-11',
    '2027-12-25','2027-12-27'
  ]);

  // ─── 상태 ───────────────────────────────────────────────────────
  let allDailyRaw  = [];  // Firestore 원본 (모든 채널)
  let allPostsRaw  = [];
  let allSeriesRaw = [];
  let currentChannel = localStorage.getItem('postype_currentChannel') || '__all__';
  let currentMonth   = null;
  let decaySeries    = '__all__';
  let isDemoMode     = false;
  let loaded         = false;

  // ─── 같은 날짜 두 채널 docs 합산 ───────────────────────────────
  function aggregateDailyByDate(rows){
    const map = {};
    rows.forEach(d => {
      if (!d.date) return;
      if (!map[d.date]){
        map[d.date] = {
          date: d.date,
          rev: 0, txCount: 0,
          byType: { sale: 0, membership: 0, support: 0 },
          byHour: Array(24).fill(0),
          bySeries: {}, byPriceBucket: {}
        };
      }
      const agg = map[d.date];
      agg.rev += d.rev || 0;
      agg.txCount += d.txCount || 0;
      if (d.byType) Object.entries(d.byType).forEach(([k,v]) => agg.byType[k] = (agg.byType[k]||0) + (v||0));
      if (Array.isArray(d.byHour)) d.byHour.forEach((v,h) => { agg.byHour[h] += v||0; });
      if (d.bySeries) Object.entries(d.bySeries).forEach(([k,v]) => {
        if (!agg.bySeries[k]) agg.bySeries[k] = { rev: 0, cnt: 0 };
        agg.bySeries[k].rev += (v && v.rev) || 0;
        agg.bySeries[k].cnt += (v && v.cnt) || 0;
      });
      if (d.byPriceBucket) Object.entries(d.byPriceBucket).forEach(([k,v]) => agg.byPriceBucket[k] = (agg.byPriceBucket[k]||0) + (v||0));
    });
    return Object.values(map).sort((a,b) => a.date.localeCompare(b.date));
  }

  // 채널 필터 적용 후 뷰 (__all__ 모드일 때 합산)
  const allDaily  = () => currentChannel === '__all__'
    ? aggregateDailyByDate(allDailyRaw)
    : allDailyRaw.filter(d => d.channelId === currentChannel);
  const allPosts  = () => currentChannel === '__all__'
    ? allPostsRaw
    : allPostsRaw.filter(p => p.channelId === currentChannel);
  const allSeries = () => currentChannel === '__all__'
    ? allSeriesRaw
    : allSeriesRaw.filter(s => s.channelId === currentChannel);

  // ─── 헬퍼 ───────────────────────────────────────────────────────
  const KRW       = n => (n || 0).toLocaleString('ko-KR') + '원';
  const dow       = ['일','월','화','수','목','금','토'];
  const pad       = n => String(n).padStart(2, '0');
  const todayStr  = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };  // 로컬(KST) 기준 — UTC 밀림 방지
  const thisMonth = () => todayStr().slice(0, 7);
  const ageDays   = (firstTs) => (Date.now() - new Date(firstTs.replace(' ','T') + '+09:00').getTime()) / 86400000;

  function calcPaymentDay(yearMonth){
    const [y, m] = yearMonth.split('-').map(Number);
    let d = new Date(Date.UTC(y, m-1, 10));
    for (let i = 0; i < 10; i++){
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
  const monthLabel      = ym => { const [y,m] = ym.split('-').map(Number); return `${y}년 ${m}월`; };
  const monthLabelShort = ym => { const [y,m] = ym.split('-').map(Number); return `${m}월`; };
  const prevMonth       = ym => { const [y,m] = ym.split('-').map(Number); return m === 1 ? `${y-1}-12` : `${y}-${pad(m-1)}`; };
  const nextMonth       = ym => { const [y,m] = ym.split('-').map(Number); return m === 12 ? `${y+1}-01` : `${y}-${pad(m+1)}`; };
  const daysInMonth     = ym => { const [y,m] = ym.split('-').map(Number); return new Date(y, m, 0).getDate(); };
  const isFuture        = ym => ym > thisMonth();
  const lastYearMonth   = ym => { const [y,m] = ym.split('-').map(Number); return `${y-1}-${pad(m)}`; };

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
      arr.push({ date: `${y}-${pad(m)}-${pad(day)}`, rev: Math.max(0, Math.round(base + wave + noise)), channelId: currentChannel, _demo: true });
    }
    return arr;
  }

  // ─── Firestore 로딩 (전 채널 한 번에) ──────────────────────────
  async function fetchCollection(name, filter){
    if (typeof fbRead !== 'function') return [];
    try {
      const all = await fbRead(name);
      return all.filter(filter);
    } catch(e){ console.error(`[postype-analytics] fetch ${name} error`, e); return []; }
  }
  const fetchAllDaily  = () => fetchCollection(COLL_DAILY,  d => d.channelId && d.date).then(a => a.sort((x,y) => x.date.localeCompare(y.date)));
  const fetchAllPosts  = () => fetchCollection(COLL_POSTS,  p => p.channelId && p.postId);
  const fetchAllSeries = () => fetchCollection(COLL_SERIES, s => s.channelId && s.name);

  // ─── 예측 모델 ──────────────────────────────────────────────────
  function buildForecastModel(){
    // 합산 모드일 때는 모든 채널의 ongoing 중 첫 번째 (현재는 다락방만 active)
    let ongoing = null;
    if (currentChannel === '__all__'){
      const activeOngoings = Object.values(CHANNELS).filter(c => c.ongoing).map(c => c.ongoing);
      ongoing = activeOngoings[0] || null;
    } else {
      const channelMeta = CHANNELS[currentChannel];
      ongoing = channelMeta ? channelMeta.ongoing : null;
    }

    let decay = { d1: 0, d3: 0, d7: 0, d14: 0, d30: 0 };
    let longtailDailyRate = 0;
    let allEpisodes = [];

    if (ongoing){
      const seriesPosts = allPosts().filter(p => p.series === ongoing.name && p.revByAge && p.firstTs);
      const avgAt = (key, minAge) => {
        const mature = seriesPosts.filter(p => ageDays(p.firstTs) >= minAge && p.revByAge[key] !== undefined);
        if (!mature.length) return null;
        return mature.reduce((a,p) => a + p.revByAge[key], 0) / mature.length;
      };
      decay = {
        d1: avgAt('d1', 1) || 0, d3: avgAt('d3', 3) || 0,
        d7: avgAt('d7', 7) || 0, d14: avgAt('d14', 14) || 0,
        d30: avgAt('d30', 30) || 0
      };
      const matureFor30 = seriesPosts.filter(p => ageDays(p.firstTs) >= 30 && p.revByAge.d30 !== undefined);
      longtailDailyRate = decay.d30 * 0.012;
      if (matureFor30.length){
        const rates = matureFor30.map(p => {
          const age = ageDays(p.firstTs);
          const extra = (p.totalRev || 0) - (p.revByAge.d30 || 0);
          return age > 30 ? extra / (age - 30) : 0;
        }).filter(r => r > 0);
        if (rates.length) longtailDailyRate = rates.reduce((a,b) => a+b, 0) / rates.length;
      }
      const existing = seriesPosts
        .map(p => ({ date: p.firstTs.slice(0,10), type: 'existing' }))
        .sort((a,b) => a.date.localeCompare(b.date));
      const future = [];
      for (let ep = ongoing.currentEpisode + 1; ep <= ongoing.totalEpisodes; ep++){
        const d = new Date(ongoing.lastPublishDate + 'T00:00:00');
        d.setDate(d.getDate() + (ep - ongoing.currentEpisode) * 7);
        future.push({ ep, date: d.toISOString().slice(0,10), type: 'future' });
      }
      allEpisodes = [...existing, ...future];
    }

    function revAtAge(t){
      if (t <= 0) return 0;
      if (t <= 1) return decay.d1 * t;
      if (t <= 3) return decay.d1 + (decay.d3 - decay.d1) * (t-1)/2;
      if (t <= 7) return decay.d3 + (decay.d7 - decay.d3) * (t-3)/4;
      if (t <= 14) return decay.d7 + (decay.d14 - decay.d7) * (t-7)/7;
      if (t <= 30) return decay.d14 + (decay.d30 - decay.d14) * (t-14)/16;
      return decay.d30 + (t-30) * longtailDailyRate;
    }

    // 구작 + 멤버십 longtail (최근 30일)
    const recentCutoff = new Date(Date.now() - 30*86400000).toISOString().slice(0,10);
    const recentDaily = allDaily().filter(d => d.date >= recentCutoff);
    const recentSum = recentDaily.reduce((a,d) => a + (d.rev||0), 0);
    const ongoingRecentSum = ongoing ? recentDaily.reduce((a,d) => {
      if (d.bySeries && d.bySeries[ongoing.name]) return a + d.bySeries[ongoing.name].rev;
      return a;
    }, 0) : 0;
    const oldWorksDailyAvg = Math.max(0, (recentSum - ongoingRecentSum) / Math.max(recentDaily.length, 1));
    // 현재 페이스 = 최근 30일 전체(연재작+구작) 실측 일평균 — 모델 과소평가 대신 실측 추세 앵커
    const recentDailyAvg = recentSum / Math.max(recentDaily.length, 1);

    // ─── 요일별 가중치 (최근 8주 실측) — 금요일 발행 후 토/일 피크, 목 바닥 같은 주간 패턴 캡처 ───
    const dowCutoff = new Date(Date.now() - 56*86400000).toISOString().slice(0,10);
    const dowSum = Array(7).fill(0), dowCnt = Array(7).fill(0);
    allDaily().filter(d => d.date >= dowCutoff && d.date <= todayStr()).forEach(d => {
      const wd = new Date(d.date + 'T00:00:00').getDay();  // 로컬(KST) 요일
      dowSum[wd] += (d.rev || 0); dowCnt[wd]++;
    });
    const dowAvg = dowSum.map((s, i) => dowCnt[i] ? s / dowCnt[i] : 0);
    const observed = dowAvg.filter((_, i) => dowCnt[i]);
    const dowOverall = observed.length ? observed.reduce((a, b) => a + b, 0) / observed.length : 0;
    // 가중치: 그 요일 평균 / 전체 평균 (데이터 없는 요일은 1 = 중립)
    const dowWeight = dowAvg.map((a, i) => (dowCnt[i] && dowOverall > 0) ? a / dowOverall : 1);

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

    // 구조 모델 월 총액(연재 감쇠 + 구작)은 유지하되, 그 달의 요일 구성(주말 수 등)을 반영.
    // 완전한 달은 요일 분포가 거의 균등 → factor ≈ 1, 주말이 많은 달만 살짝 ↑.
    function predictMonthDow(yearMonth){
      const baseTotal = predictMonth(yearMonth);
      const [yy, mm] = yearMonth.split('-').map(Number);
      const dimm = daysInMonth(yearMonth);
      let weightSum = 0;
      for (let day = 1; day <= dimm; day++) weightSum += dowWeight[new Date(yy, mm-1, day).getDay()];
      const avgW = dowWeight.reduce((a,b) => a+b, 0) / 7;          // 7요일 평균 (보통 ≈ 1)
      const factor = avgW > 0 ? (weightSum / dimm) / avgW : 1;     // 균등월 = 1, 주말 많은 달 > 1
      return Math.round(baseTotal * factor);
    }

    return { decay, allEpisodes, oldWorksDailyAvg, recentDailyAvg, dowWeight, longtailDailyRate, predictMonth, predictMonthDow, revAtAge, ongoing };
  }

  function predictThisMonth(model){
    const thisM = thisMonth();
    const now = new Date();
    const todayD = now.getDate();
    const dim = daysInMonth(thisM);
    const [y, mo] = thisM.split('-').map(Number);
    // 이번 달 실측 = 이번 달 모든 거래 합 (KPI 매출 카드와 동일, 지금 시각까지 누적)
    const actual = allDaily()
      .filter(d => d.date.startsWith(thisM))
      .reduce((a,d) => a + (d.rev||0), 0);
    const modelTotal = model.predictMonth(thisM);
    // 남은 기간을 '요일 패턴'으로 예측: 현재 페이스(base) × 그날 요일 가중치.
    // base 가 0이면(데이터 없음) 모델 일평균으로 폴백.
    const base = model.recentDailyAvg > 0 ? model.recentDailyAvg : (modelTotal / dim);
    const w = model.dowWeight || Array(7).fill(1);
    // 오늘은 진행 중 — 지난 시간은 이미 actual에, '남은 시간'만 예측에 더함
    const dayElapsed = (now.getHours()*3600 + now.getMinutes()*60 + now.getSeconds()) / 86400;
    let remainingForecast = 0;
    for (let day = todayD; day <= dim; day++){
      const wd = new Date(y, mo-1, day).getDay();        // 로컬 요일
      const dayPred = base * (w[wd] != null ? w[wd] : 1);
      remainingForecast += (day === todayD) ? dayPred * (1 - dayElapsed) : dayPred;
    }
    // 예상은 이미 확정된 실측보다 작을 수 없음 (남은 시간 예측만 더함)
    const total = Math.max(Math.round(actual + remainingForecast), actual);
    return { total, actual, remainingForecast: Math.round(remainingForecast), modelTotal };
  }

  // ─── KPI ────────────────────────────────────────────────────────
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

  // ─── 연도 비교 (YoY) ───────────────────────────────────────────
  function renderYoYComparison(){
    const wrap = document.getElementById('postype-yoy-comparison');
    const thisM = currentMonth;
    const lastYM = lastYearMonth(thisM);
    const thisYear = thisM.slice(0,4);
    const lastYear = String(parseInt(thisYear) - 1);
    const today = todayStr();
    const lastYearToday = `${lastYear}-${today.slice(5)}`;

    const lastYearMonthData = allDaily().filter(d => d.date && d.date.startsWith(lastYM));
    const lastYearYtdData   = allDaily().filter(d => d.date && d.date.startsWith(lastYear) && d.date <= lastYearToday);

    if (!lastYearMonthData.length && !lastYearYtdData.length){
      wrap.style.display = 'none';
      return;
    }
    wrap.style.display = '';

    // 이번 달 vs 작년 동월
    const thisMonthData = allDaily().filter(d => d.date && d.date.startsWith(thisM));
    const thisMonthSum = thisMonthData.reduce((a,d) => a + (d.rev||0), 0);
    const lastMonthSum = lastYearMonthData.reduce((a,d) => a + (d.rev||0), 0);
    const mEl = document.getElementById('postype-yoy-month-pct');
    const mSub = document.getElementById('postype-yoy-month-sub');
    if (!lastMonthSum){
      mEl.textContent = '—'; mEl.className = 'text-2xl font-extrabold tracking-tight tabular-nums text-slate-400';
      mSub.textContent = '작년 동월 데이터 없음';
    } else {
      const monthPct = ((thisMonthSum - lastMonthSum) / lastMonthSum * 100);
      const sign = monthPct >= 0 ? '+' : '';
      mEl.textContent = `${sign}${monthPct.toFixed(1)}%`;
      mEl.className = 'text-2xl font-extrabold tracking-tight tabular-nums ' + (monthPct >= 0 ? 'text-emerald-600' : 'text-rose-600');
      mSub.textContent = `${lastYM.slice(5,7)}월 ${KRW(lastMonthSum)} → ${thisM.slice(5,7)}월 ${KRW(thisMonthSum)}`;
    }

    // 올해 누적 vs 작년 동기간
    const thisYtdData = allDaily().filter(d => d.date && d.date.startsWith(thisYear) && d.date <= today);
    const thisYtdSum  = thisYtdData.reduce((a,d) => a + (d.rev||0), 0);
    const lastYtdSum  = lastYearYtdData.reduce((a,d) => a + (d.rev||0), 0);
    const yEl = document.getElementById('postype-yoy-ytd-pct');
    const ySub = document.getElementById('postype-yoy-ytd-sub');
    if (!lastYtdSum){
      yEl.textContent = '—'; yEl.className = 'text-2xl font-extrabold tracking-tight tabular-nums text-slate-400';
      ySub.textContent = '작년 동기간 데이터 없음';
    } else {
      const ytdPct = ((thisYtdSum - lastYtdSum) / lastYtdSum * 100);
      const sign = ytdPct >= 0 ? '+' : '';
      yEl.textContent = `${sign}${ytdPct.toFixed(1)}%`;
      yEl.className = 'text-2xl font-extrabold tracking-tight tabular-nums ' + (ytdPct >= 0 ? 'text-emerald-600' : 'text-rose-600');
      ySub.textContent = `${lastYear} 1/1~${lastYearToday.slice(5)} ${KRW(lastYtdSum)} → ${thisYear} ${KRW(thisYtdSum)}`;
    }
  }

  // ─── 일별 차트 ──────────────────────────────────────────────────
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
      empty.textContent = isFuture(yearMonth) ? '미래 달 데이터 없음 (예측은 위 차트에서)' : '이 달 데이터 없음 · 북마크릿 ytd로 백필';
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

  // ─── 위젯 1: 시리즈 회차별 곡선 ─────────────────────────────────
  function renderSeriesCurves(){
    const wrap = document.getElementById('postype-series-curves');
    if (!wrap) return;
    const series = allSeries();
    const posts = allPosts();
    if (!series.length || !posts.length){
      wrap.innerHTML = '<div class="col-span-2 text-center text-slate-400 text-sm py-12">데이터 없음</div>';
      return;
    }
    const top = [...series]
      .filter(s => s.name !== '_멤버십_' && s.name !== '_미분류_' && (s.posts || []).length >= 2)
      .sort((a, b) => (b.totalRev||0) - (a.totalRev||0))
      .slice(0, 4);
    if (!top.length){
      wrap.innerHTML = '<div class="col-span-2 text-center text-slate-400 text-sm py-12">회차 2개 이상인 시리즈가 없어요</div>';
      return;
    }
    const postById = Object.fromEntries(posts.map(p => [p.postId, p]));
    wrap.innerHTML = top.map(s => {
      const ps = (s.posts || []).map(id => postById[id]).filter(Boolean);
      if (ps.length < 2) return '';
      const max = Math.max(...ps.map(p => p.totalRev || 0), 1);
      const W = 100, H = 50;
      const points = ps.map((p, i) => `${(i/Math.max(ps.length-1,1))*W},${H - ((p.totalRev||0)/max)*(H-4) - 2}`).join(' ');
      const first = ps[0].totalRev || 0;
      const last  = ps[ps.length-1].totalRev || 0;
      const trend = first > 0 ? Math.round((last - first) / first * 100) : 0;
      const tc = trend >= 0 ? 'text-emerald-600' : 'text-rose-600';
      const circles = ps.map((p, i) => `<circle cx="${(i/Math.max(ps.length-1,1))*W}" cy="${H - ((p.totalRev||0)/max)*(H-4) - 2}" r="1.5" fill="#6366f1"/>`).join('');
      return `<div class="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
        <div class="flex justify-between items-baseline mb-1.5">
          <span class="text-xs font-bold text-slate-800 truncate" style="max-width:60%">${s.name}</span>
          <span class="text-[10px] ${tc} font-bold whitespace-nowrap">${ps.length}편 · ${trend >= 0 ? '+' : ''}${trend}%</span>
        </div>
        <svg viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" style="width:100%;height:42px;display:block">
          <polyline points="${points}" fill="none" stroke="#6366f1" stroke-width="1.5"/>${circles}
        </svg>
        <div class="flex justify-between text-[10px] text-slate-400 mt-1">
          <span>1화 ${KRW(first)}</span><span>${ps.length}화 ${KRW(last)}</span>
        </div>
      </div>`;
    }).join('');
  }

  // ─── 위젯 2: 감쇠 곡선 ─────────────────────────────────────────
  function populateDecaySeriesSelect(){
    const sel = document.getElementById('postype-decay-series');
    if (!sel) return;
    const currentVal = sel.value || '__all__';
    const candidates = [...allSeries()]
      .filter(s => s.name !== '_멤버십_' && s.name !== '_미분류_' && (s.posts || []).length >= 2)
      .sort((a,b) => (b.totalRev||0) - (a.totalRev||0))
      .slice(0, 5);
    sel.innerHTML = '<option value="__all__">전체 평균</option>' + candidates.map(s => `<option value="${s.name}">${s.name} (${(s.posts||[]).length}편)</option>`).join('');
    sel.value = candidates.find(c => c.name === currentVal) ? currentVal : '__all__';
    if (!sel.__attached){
      sel.__attached = true;
      sel.addEventListener('change', () => { decaySeries = sel.value; renderDecayChart(); });
    }
  }
  function renderDecayChart(){
    const wrap  = document.getElementById('postype-decay-chart');
    const empty = document.getElementById('postype-decay-empty');
    const meta  = document.getElementById('postype-decay-meta');
    wrap.querySelectorAll('svg').forEach(el => el.remove());
    let pool = allPosts().filter(p => p.revByAge && p.firstTs);
    if (decaySeries !== '__all__') pool = pool.filter(p => p.series === decaySeries);
    if (!pool.length){
      if (empty){ empty.style.display = 'flex'; empty.textContent = '데이터 없음'; }
      if (meta) meta.textContent = '—';
      return;
    }
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
      if (empty){ empty.style.display = 'flex'; empty.textContent = '성숙한 회차가 없어요'; }
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
      const sn = decaySeries === '__all__' ? '전체' : decaySeries;
      meta.textContent = `${sn} · ${points.map(p => `${p.label} ${p.n}편`).join(' · ')}`;
    }
  }

  // ─── 위젯 3: 발행 시점 효과 ─────────────────────────────────────
  function renderPubEffect(){
    const wrap = document.getElementById('postype-pub-effect');
    const wf = allPosts().filter(p => p.firstTs && p.revByAge && p.revByAge.d1 !== undefined);
    if (!wf.length){
      wrap.innerHTML = '<div class="text-center text-slate-400 text-sm py-8">데이터 없음</div>';
      return;
    }
    const byDow = Array(7).fill().map(() => ({ posts: 0, total: 0 }));
    const byBk  = { '새벽 0-5': {posts:0,total:0}, '아침 6-11': {posts:0,total:0}, '오후 12-17': {posts:0,total:0}, '저녁 18-23': {posts:0,total:0} };
    wf.forEach(p => {
      const parts = p.firstTs.match(/(\d{4})-(\d{2})-(\d{2}) (\d{2}):/);
      if (!parts) return;
      const dt = new Date(Date.UTC(+parts[1], +parts[2]-1, +parts[3]));
      const dowIdx = dt.getUTCDay();
      byDow[dowIdx].posts++; byDow[dowIdx].total += p.revByAge.d1 || 0;
      const h = +parts[4];
      const bk = h <= 5 ? '새벽 0-5' : h <= 11 ? '아침 6-11' : h <= 17 ? '오후 12-17' : '저녁 18-23';
      byBk[bk].posts++; byBk[bk].total += p.revByAge.d1 || 0;
    });
    const maxDT = Math.max(...byDow.map(x => x.total));
    const maxBT = Math.max(...Object.values(byBk).map(x => x.total));
    const dowRows = dow.map((d, i) => {
      const v = byDow[i];
      const avg = v.posts ? Math.round(v.total / v.posts) : 0;
      const isMax = v.posts > 0 && v.total === maxDT;
      return `<tr ${isMax ? 'class="bg-indigo-50"' : ''}><td class="px-2 py-1.5 ${isMax ? 'text-indigo-700 font-bold' : 'text-slate-700'}">${d}</td><td class="px-2 py-1.5 text-right tabular-nums text-slate-500">${v.posts}편</td><td class="px-2 py-1.5 text-right tabular-nums font-bold ${isMax ? 'text-indigo-600' : 'text-slate-800'}">${KRW(avg)}</td></tr>`;
    }).join('');
    const bkRows = Object.entries(byBk).map(([k, v]) => {
      const avg = v.posts ? Math.round(v.total / v.posts) : 0;
      const isMax = v.posts > 0 && v.total === maxBT;
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

  // ─── 위젯 5: 히트맵 ────────────────────────────────────────────
  function renderHeatmap(monthDaily){
    const wrap = document.getElementById('postype-heatmap');
    const meta = document.getElementById('postype-heatmap-meta');
    const grid = Array(7).fill().map(() => Array(24).fill(0));
    monthDaily.forEach(d => {
      if (!d.byHour || !d.date) return;
      const dt = new Date(d.date + 'T00:00:00Z');
      for (let h = 0; h < 24; h++) grid[dt.getUTCDay()][h] += d.byHour[h] || 0;
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
        <div></div>${headerCells}${dayRows}
      </div>
      <div class="text-[10px] text-slate-400 mt-2">진할수록 매출↑ · 최댓값 ${KRW(max)}</div>`;
    if (meta) meta.textContent = `${monthDaily.length}일 합산`;
  }

  // ─── 예측 위젯 ──────────────────────────────────────────────────
  function renderForecast(){
    if (!allPosts().length || !allDaily().length){
      ['this','next'].forEach(k => {
        document.getElementById(`postype-forecast-${k}-total`).textContent = '—';
        document.getElementById(`postype-forecast-${k}-net`).textContent = '실수령 ≈ —';
        document.getElementById(`postype-forecast-${k}-sub`).textContent = '데이터 import 후 표시';
      });
      document.getElementById('postype-ongoing-name').textContent = '—';
      document.getElementById('postype-ongoing-progress').textContent = '—';
      document.getElementById('postype-ongoing-sub').textContent = '데이터 없음';
      const fc = document.getElementById('postype-forecast-empty');
      if (fc) fc.style.display = 'flex';
      document.getElementById('postype-payment-amount').textContent = '—';
      return;
    }
    const model = buildForecastModel();
    const thisM = thisMonth();
    const thisF = predictThisMonth(model);
    document.getElementById('postype-forecast-this-total').textContent = KRW(thisF.total);
    document.getElementById('postype-forecast-this-net').textContent = `실수령 ≈ ${KRW(applyFee(thisF.total))}`;
    const payT = paymentForMonth(thisM);
    document.getElementById('postype-forecast-this-sub').textContent = `${monthLabel(thisM)} · 실측 ${KRW(thisF.actual)} + 잔여 ${KRW(thisF.remainingForecast)} · 입금 ${payT.slice(5,7)}/${payT.slice(8,10)}`;
    document.getElementById('postype-payment-amount').textContent = KRW(applyFee(thisF.total));

    const nextM = nextMonth(thisM);
    const nextTotal = model.predictMonthDow(nextM);
    document.getElementById('postype-forecast-next-total').textContent = KRW(nextTotal);
    document.getElementById('postype-forecast-next-net').textContent = `실수령 ≈ ${KRW(applyFee(nextTotal))}`;
    const payN = paymentForMonth(nextM);
    document.getElementById('postype-forecast-next-sub').textContent = `${monthLabel(nextM)} 예측 · 입금 ${payN.slice(5,7)}/${payN.slice(8,10)}`;

    const ongoing = model.ongoing;
    if (ongoing){
      const remaining = ongoing.totalEpisodes - ongoing.currentEpisode;
      const finishDate = new Date(ongoing.lastPublishDate + 'T00:00:00');
      finishDate.setDate(finishDate.getDate() + remaining * 7);
      // 합산 모드일 때 어느 채널 시리즈인지 표시
      let channelPrefix = '';
      if (currentChannel === '__all__'){
        const ownerChannel = Object.values(CHANNELS).find(c => c.ongoing && c.ongoing.name === ongoing.name);
        if (ownerChannel) channelPrefix = `${ownerChannel.displayName} · `;
      }
      document.getElementById('postype-ongoing-name').textContent = channelPrefix + ongoing.name;
      document.getElementById('postype-ongoing-progress').textContent = `${ongoing.currentEpisode}화 / ${ongoing.totalEpisodes}화`;
      document.getElementById('postype-ongoing-sub').textContent = `남은 ${remaining}화 · 매주 ${dow[ongoing.publishWeekday]} ${ongoing.publishHour}:00 · 완결 ${finishDate.getMonth()+1}/${finishDate.getDate()}`;
    } else {
      const channelMeta = CHANNELS[currentChannel];
      if (channelMeta && channelMeta.note){
        document.getElementById('postype-ongoing-name').textContent = '연재 중 시리즈 없음';
        document.getElementById('postype-ongoing-progress').textContent = '—';
        document.getElementById('postype-ongoing-sub').textContent = channelMeta.note;
      } else {
        document.getElementById('postype-ongoing-name').textContent = '미설정';
        document.getElementById('postype-ongoing-progress').textContent = '—';
        document.getElementById('postype-ongoing-sub').textContent = currentChannel === '__all__' ? '연재 중 시리즈 없음' : '코드의 CHANNELS[' + currentChannel + '].ongoing 설정 필요';
      }
    }
    render12MonthChart(model);
  }
  function render12MonthChart(model){
    const wrap = document.getElementById('postype-forecast-chart');
    const empty = document.getElementById('postype-forecast-empty');
    wrap.querySelectorAll('svg').forEach(el => el.remove());
    if (empty) empty.style.display = 'none';
    const months = [];
    let cur = thisMonth();
    for (let i = 0; i < 12; i++){
      let actual = null, forecast = null;
      if (cur === thisMonth()){
        const f = predictThisMonth(model);
        actual = f.actual; forecast = f.total;
      } else {
        forecast = model.predictMonthDow(cur);
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
      const fY = H - PADY - forecastH;
      const aY = H - PADY - actualH;
      return `
        <rect x="${x}" y="${fY}" width="${innerBarW}" height="${forecastH}" fill="#a5b4fc" opacity="0.6" rx="2"/>
        ${m.actual !== null ? `<rect x="${x}" y="${aY}" width="${innerBarW}" height="${actualH}" fill="#6366f1" rx="2"/>` : ''}
        ${m.forecast ? `<text x="${x + innerBarW/2}" y="${fY - 6}" text-anchor="middle" fill="#475569" font-size="9" font-weight="600">${(m.forecast/10000).toFixed(0)}만</text>` : ''}
        <text x="${x + innerBarW/2}" y="${H - 10}" text-anchor="middle" fill="#94a3b8" font-size="10">${monthLabelShort(m.ym)}</text>
      `;
    }).join('');
    wrap.insertAdjacentHTML('afterbegin', `<svg viewBox="0 0 ${W} ${H}" width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style="display:block">${bars}</svg>`);
  }

  // ─── hover, 월 네비, 채널 selector ─────────────────────────────
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
      tt.style.left = Math.min(Math.max(x + 12, 8), rect.width - 200) + 'px';
      tt.style.top  = '8px';
      vl.style.display = 'block';
      vl.style.left = (idx / Math.max(days.length-1, 1) * rect.width) + 'px';
    });
    wrap.addEventListener('mouseleave', () => { tt.style.display = 'none'; vl.style.display = 'none'; });
  }
  function attachMonthNav(){
    const prevBtn = document.getElementById('postype-month-prev');
    const nextBtn = document.getElementById('postype-month-next');
    if (!prevBtn || prevBtn.__attached) return;
    prevBtn.__attached = true; nextBtn.__attached = true;
    prevBtn.addEventListener('click', () => { currentMonth = prevMonth(currentMonth); renderForMonth(currentMonth); });
    nextBtn.addEventListener('click', () => {
      const next = nextMonth(currentMonth);
      if (next > nextMonth(thisMonth())) return;
      currentMonth = next; renderForMonth(currentMonth);
    });
  }
  function attachChannelSelector(){
    const sel = document.getElementById('postype-channel-select');
    if (!sel || sel.__attached) return;
    sel.__attached = true;
    sel.value = currentChannel;
    sel.addEventListener('change', () => {
      currentChannel = sel.value;
      localStorage.setItem('postype_currentChannel', currentChannel);
      currentMonth = thisMonth();  // 채널 바뀌면 현재월로 리셋
      decaySeries = '__all__';
      renderForMonth(currentMonth);
    });
  }

  function setSyncLabel(daily, demo){
    const el = document.getElementById('postype-last-sync');
    if (!el) return;
    const channelDaily = currentChannel === '__all__' ? daily : daily.filter(d => d.channelId === currentChannel);
    if (demo){
      el.innerHTML = '<span style="background:#f59e0b;color:white;padding: var(--space-0-5) var(--space-1-5);border-radius: var(--radius-xs);font-size: var(--font-size-tiny);font-weight:bold;letter-spacing:0.05em;margin-right: var(--space-1-5)">DEMO</span>더미 데이터';
    } else if (!channelDaily.length){
      el.textContent = currentChannel === '__all__' ? '데이터 없음' : '이 채널 데이터 없음';
    } else {
      const dates = [...new Set(channelDaily.map(d => d.date))].sort();
      const uniqueDays = dates.length;
      const channelInfo = currentChannel === '__all__' ? ` · 모든 채널 합산` : '';
      el.innerHTML = `데이터: <span class="font-bold text-slate-700">${dates[0]}</span> ~ <span class="font-bold text-slate-700">${dates[dates.length-1]}</span> · ${uniqueDays}일${channelInfo}`;
    }
  }

  function renderForMonth(yearMonth){
    document.getElementById('postype-month-label').textContent = monthLabel(yearMonth);
    document.getElementById('postype-payment-date').textContent = (() => {
      const p = paymentForMonth(yearMonth);
      const d = new Date(p + 'T00:00:00Z');
      return `${p.slice(5,7)}월 ${p.slice(8,10)}일 (${dow[d.getUTCDay()]})`;
    })();
    const source = isDemoMode ? makeDummyForMonth(yearMonth) : allDaily();
    const monthDaily = source.filter(d => d.date && d.date.startsWith(yearMonth));
    const prevMd    = source.filter(d => d.date && d.date.startsWith(prevMonth(yearMonth)));
    const thisYear  = yearMonth.slice(0, 4);
    const ytdTotal  = source.filter(d => d.date && d.date.startsWith(thisYear)).reduce((a,d) => a + (d.rev||0), 0);

    renderYoYComparison();
    renderKPIs(monthDaily, prevMd, ytdTotal);
    renderDailyChart(monthDaily, yearMonth);
    renderSeriesCurves();
    populateDecaySeriesSelect();
    renderDecayChart();
    renderPubEffect();
    renderPriceDist(monthDaily);
    renderHeatmap(monthDaily);
    renderForecast();
    setSyncLabel(allDailyRaw, isDemoMode);
  }

  // ─── Firestore upsert ──────────────────────────────────────────
  async function pushPostypeData(payload){
    if (!payload || typeof fbRead !== 'function' || typeof fbAdd !== 'function'){
      return { ok: false, error: 'Firebase 미준비 또는 빈 페이로드' };
    }
    const result = { daily: {added:0,updated:0}, posts: {added:0,updated:0}, series: {added:0,updated:0} };
    if (Array.isArray(payload.daily) && payload.daily.length){
      const existing = await fbRead(COLL_DAILY);
      // key: channelId + date
      const byKey = {};
      existing.forEach(d => { if (d.channelId && d.date) byKey[`${d.channelId}|${d.date}`] = d._id; });
      for (const d of payload.daily){
        const doc = Object.assign({}, d); delete doc._id;
        const k = `${doc.channelId}|${doc.date}`;
        if (byKey[k]){ await fbUpdate(COLL_DAILY, byKey[k], doc); result.daily.updated++; }
        else { await fbAdd(COLL_DAILY, doc); result.daily.added++; }
      }
    }
    if (Array.isArray(payload.posts) && payload.posts.length){
      const existing = await fbRead(COLL_POSTS);
      const byKey = {};
      existing.forEach(p => { if (p.channelId && p.postId) byKey[`${p.channelId}|${p.postId}`] = p._id; });
      for (const p of payload.posts){
        const doc = Object.assign({}, p); delete doc._id;
        const k = `${doc.channelId}|${doc.postId}`;
        if (byKey[k]){ await fbUpdate(COLL_POSTS, byKey[k], doc); result.posts.updated++; }
        else { await fbAdd(COLL_POSTS, doc); result.posts.added++; }
      }
    }
    if (Array.isArray(payload.series) && payload.series.length){
      const existing = await fbRead(COLL_SERIES);
      const byKey = {};
      existing.forEach(s => { if (s.channelId && s.name) byKey[`${s.channelId}|${s.name}`] = s._id; });
      for (const s of payload.series){
        const doc = Object.assign({}, s); delete doc._id;
        const k = `${doc.channelId}|${doc.name}`;
        if (byKey[k]){ await fbUpdate(COLL_SERIES, byKey[k], doc); result.series.updated++; }
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
      showBridgeStatus(`수신: 일별 ${dN} · 포스트 ${pN} · 시리즈 ${sN} · 저장 중...`);
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
    if (confirm('포스타입 수익 페이지를 새 탭에 열까요?\n로그인 상태에서 북마크릿을 클릭하면\natelier로 데이터가 자동 전송됩니다.\n\n💡 첫 백필이면 prompt에 "ytd" 입력하세요!\n두 채널(다락방/옥탑방) 거래가 자동 분리됩니다.')){
      window.open(url, '_blank');
    }
  };

  async function loadAndRender(){
    const [daily, posts, series] = await Promise.all([
      fetchAllDaily(), fetchAllPosts(), fetchAllSeries()
    ]);
    if (daily.length === 0){
      isDemoMode = true; allDailyRaw = []; allPostsRaw = []; allSeriesRaw = [];
    } else {
      isDemoMode = false; allDailyRaw = daily; allPostsRaw = posts; allSeriesRaw = series;
    }
    if (!currentMonth) currentMonth = thisMonth();
    renderForMonth(currentMonth);
  }

  window.__postypeAnalytics = {
    reload: loadAndRender,
    goMonth: (ym) => { currentMonth = ym; renderForMonth(ym); },
    setChannel: (id) => { if (CHANNELS[id]){ currentChannel = id; localStorage.setItem('postype_currentChannel', id); renderForMonth(currentMonth); } },
    state: () => ({ allDailyRaw, allPostsRaw, allSeriesRaw, currentMonth, currentChannel, isDemoMode }),
    channels: CHANNELS,
    feeRate: FEE_RATE,
    forecastModel: () => buildForecastModel()
  };

  function init(){
    const section = document.getElementById('postype-analytics-section');
    if (!section) return;
    attachHover(); attachMonthNav(); attachChannelSelector(); setupPostypeBridge();
    const observer = new IntersectionObserver((entries) => {
      for (const e of entries){
        if (e.isIntersecting && !loaded){ loaded = true; loadAndRender(); observer.disconnect(); }
      }
    }, { root: null, threshold: 0.05 });
    observer.observe(section);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
