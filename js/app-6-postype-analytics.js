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
  const round100  = n => Math.round((n || 0) / 100) * 100;   // 포인트 단위(100P) 정렬 — 평균값의 1원 단위 노이즈 제거
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

  // ─── 한국 공휴일 (매출이 휴일에 오르는 경향 반영해 차트에 표시) ───
  // 대체공휴일 포함. 음력 기념일은 양력 환산값. 필요 시 연도 추가.
  const KR_HOLIDAY_NAMES = {
    '2025-01-01':'신정','2025-01-28':'설날','2025-01-29':'설날','2025-01-30':'설날',
    '2025-03-01':'삼일절','2025-03-03':'대체공휴일','2025-05-05':'어린이날·부처님오신날','2025-05-06':'대체공휴일',
    '2025-06-06':'현충일','2025-08-15':'광복절','2025-10-03':'개천절','2025-10-06':'추석','2025-10-07':'추석','2025-10-08':'추석',
    '2025-10-09':'한글날','2025-12-25':'성탄절',
    '2026-01-01':'신정','2026-02-16':'설날','2026-02-17':'설날','2026-02-18':'설날',
    '2026-03-01':'삼일절','2026-03-02':'대체공휴일','2026-05-05':'어린이날','2026-05-24':'부처님오신날','2026-05-25':'대체공휴일',
    '2026-06-06':'현충일','2026-08-15':'광복절','2026-08-17':'대체공휴일','2026-09-24':'추석','2026-09-25':'추석','2026-09-26':'추석',
    '2026-10-03':'개천절','2026-10-05':'대체공휴일','2026-10-09':'한글날','2026-12-25':'성탄절',
    '2027-01-01':'신정','2027-02-06':'설날','2027-02-07':'설날','2027-02-08':'설날','2027-02-09':'대체공휴일',
    '2027-03-01':'삼일절','2027-05-05':'어린이날','2027-05-13':'부처님오신날','2027-06-06':'현충일',
    '2027-08-15':'광복절','2027-08-16':'대체공휴일','2027-09-14':'추석','2027-09-15':'추석','2027-09-16':'추석',
    '2027-10-03':'개천절','2027-10-04':'대체공휴일','2027-10-09':'한글날','2027-10-11':'대체공휴일','2027-12-25':'성탄절'
  };
  const holidayName = ds => KR_HOLIDAY_NAMES[ds] || null;
  // 주말(토·일) 또는 공휴일이면 '쉬는 날'
  const isRestDay = (ds, dowIdx) => (dowIdx === 0 || dowIdx === 6 || !!KR_HOLIDAY_NAMES[ds]);

  // ─── 요일 매칭 전월 매출 ───────────────────────────────────────
  // 같은 날짜가 아니라 'N번째 같은 요일'끼리 비교한다.
  // (예: 6/1=6월의 첫째 월요일 → 5월의 첫째 월요일 매출과 비교)
  // 매출은 요일(금~일↑ 평일↓)에 좌우되므로 요일을 맞춰야 추이 비교가 의미 있음.
  // 반환: { [thisDateStr]: {prevRev, prevDate} }
  function buildWeekdayPrevMap(monthDaily, prevMonthDaily, yearMonth){
    const [y, m] = yearMonth.split('-').map(Number);
    const dim = daysInMonth(yearMonth);
    // 전월 매출을 (요일 → [그 요일의 날짜순 매출])로 그룹화
    const prevByDow = [[],[],[],[],[],[],[]]; // 0=일 … 6=토
    const prevRevByDate = Object.fromEntries((prevMonthDaily||[]).map(d => [d.date, d.rev||0]));
    const pYM = prevMonth(yearMonth);
    const [py, pm] = pYM.split('-').map(Number);
    const pdim = daysInMonth(pYM);
    for (let day = 1; day <= pdim; day++){
      const ds = `${py}-${pad(pm)}-${pad(day)}`;
      const wd = new Date(Date.UTC(py, pm-1, day)).getUTCDay();
      prevByDow[wd].push({ date: ds, rev: prevRevByDate[ds] != null ? prevRevByDate[ds] : null });
    }
    // 이번 달 각 날짜에 대해, 같은 요일의 N번째 전월 날짜를 매칭
    const dowCount = [0,0,0,0,0,0,0];
    const out = {};
    for (let day = 1; day <= dim; day++){
      const ds = `${y}-${pad(m)}-${pad(day)}`;
      const wd = new Date(Date.UTC(y, m-1, day)).getUTCDay();
      const nth = dowCount[wd]; dowCount[wd]++;
      const match = prevByDow[wd][nth]; // 전월의 같은 요일 N번째 (없으면 undefined)
      out[ds] = match ? { prevRev: match.rev, prevDate: match.date } : { prevRev: null, prevDate: null };
    }
    return out;
  }

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
  // 예측 모델 튜닝 상수 (조정 가능) ───────────────────────────────
  //  LONGTAIL: 한 회차가 발행 당월(100%) 이후 매달 버는 비율 (사용자 입력: "서서히 감소")
  //  NEW_SERIES_*: 8월 시작하는 R시리즈 등 신작 — 막 키우는 채널이라 보수적으로
  const LONGTAIL      = [1, 0.4, 0.2, 0.1, 0.05];
  const FREE_EPISODES = 3;        // 물고뜯기 1~3화 무료 (매출 없음)
  const NEW_SERIES_E0 = 40000;    // R시리즈 회차당 첫달 매출 (보수)
  const NEW_SERIES_PUB = { '2026-08':4, '2026-09':4, '2026-10':4, '2026-11':4, '2026-12':4 };

  function buildForecastModel(){
    const posts    = allPosts();
    const dailyArr = allDaily();
    const lf = m => m < LONGTAIL.length ? LONGTAIL[m] : 0.03;
    const monthDiff = (a, b) => { const [ay,am]=a.split('-').map(Number), [by,bm]=b.split('-').map(Number); return (by-ay)*12+(bm-am); };

    // ── 연재 중 시리즈 (CHANNELS 메타 + 실측 데이터로 동기화) ──
    // CHANNELS에는 'name'·'totalEpisodes'·'publishWeekday' 같은 정적 메타만 신뢰,
    // currentEpisode·lastPublishDate는 posts에서 자동 추출 (하드코딩 stale 방지)
    let ongoing = null;
    if (currentChannel === '__all__'){
      const activeOngoings = Object.values(CHANNELS).filter(c => c.ongoing).map(c => c.ongoing);
      ongoing = activeOngoings[0] || null;
    } else {
      const channelMeta = CHANNELS[currentChannel];
      ongoing = channelMeta ? channelMeta.ongoing : null;
    }
    if (ongoing){
      const sp0 = posts.filter(p => p.series === ongoing.name && p.firstTs);
      const epNum0 = p => { const mm=(p.title||'').match(/(\d+)\s*화/); return mm?parseInt(mm[1]):0; };
      let maxEp = 0, lastDate = '';
      sp0.forEach(p => { const n=epNum0(p); if(n>maxEp) maxEp=n; const dt=(p.firstTs||'').slice(0,10); if(dt>lastDate) lastDate=dt; });
      if (maxEp > 0) ongoing = Object.assign({}, ongoing, { currentEpisode: maxEp, lastPublishDate: lastDate || ongoing.lastPublishDate });
    }

    // ── 요일별 가중치 (최근 8주 실측) — 토/일 피크, 목 바닥 같은 주간 패턴 ──
    const dowCutoff = new Date(Date.now() - 56*86400000).toISOString().slice(0,10);
    const dowSum = Array(7).fill(0), dowCnt = Array(7).fill(0);
    dailyArr.filter(d => d.date >= dowCutoff && d.date <= todayStr()).forEach(d => {
      const wd = new Date(d.date + 'T00:00:00').getDay();  // 로컬(KST) 요일
      dowSum[wd] += (d.rev || 0); dowCnt[wd]++;
    });
    const dowAvg = dowSum.map((s, i) => dowCnt[i] ? s / dowCnt[i] : 0);
    const observed = dowAvg.filter((_, i) => dowCnt[i]);
    const dowOverall = observed.length ? observed.reduce((a, b) => a + b, 0) / observed.length : 0;
    const dowWeight = dowAvg.map((a, i) => (dowCnt[i] && dowOverall > 0) ? a / dowOverall : 1);

    // ── 최근 30일 실측 일평균 (진행 중 달 예측용 현재 페이스) ──
    const recentCutoff = new Date(Date.now() - 30*86400000).toISOString().slice(0,10);
    const recentDaily = dailyArr.filter(d => d.date >= recentCutoff);
    const recentDailyAvg = recentDaily.reduce((a,d)=>a+(d.rev||0),0) / Math.max(recentDaily.length, 1);

    // ── 시간대 매출 분포 (저녁 피크 반영) — 하루 중 특정 시각까지 누적된 '매출' 비율 ──
    // 진행 중인 오늘의 '남은 시간 예측'을 시계 비율이 아니라 실제 매출 곡선으로 계산하기 위함.
    const hourlyTotal = Array(24).fill(0);
    dailyArr.forEach(d => { if (Array.isArray(d.byHour)) d.byHour.forEach((v,h) => hourlyTotal[h] += v||0); });
    const hourlySum = hourlyTotal.reduce((a,b)=>a+b,0);
    const elapsedRevFraction = (when) => {
      if (hourlySum <= 0) return (when.getHours()*3600 + when.getMinutes()*60) / 86400;  // 폴백: 시계 비율
      let acc = 0; const h = when.getHours();
      for (let i = 0; i < h; i++) acc += hourlyTotal[i];
      acc += (hourlyTotal[h] || 0) * (when.getMinutes() / 60);
      return Math.min(1, acc / hourlySum);
    };

    // ─────────────────────────────────────────────────────────────
    //  누적 회차 모델
    //  월매출 = 연재작 회차 누적 + 멤버십(고정) + 기타 baseline + 신작(R, 8월~)
    //  · 회차당 첫 30일 매출 E0 = 본격 유료회차(첫날 매출 큰 회차) 실측 평균
    //  · 회차가 매주 쌓이고 각 회차는 longtail 만큼 다음 달들에도 매출 → 누적 우상향
    //  · 연재작은 완결화수(totalEpisodes)에서 신작 중단 → 이후 longtail만 남아 감소
    // ─────────────────────────────────────────────────────────────
    let E0 = 90000;
    const ongoingPub = {};   // 'YYYY-MM' → 그 달 발행 회차 수 (과거 실측 + 미래 매주)
    if (ongoing){
      const sp = posts.filter(p => p.series === ongoing.name && p.revByAge && p.firstTs);
      const core = sp.filter(p => (p.revByAge.d1||0) > 20000 && p.revByAge.d30 != null);  // 본격 유료회차
      if (core.length) E0 = Math.round(core.reduce((a,p)=>a+(p.revByAge.d30||0),0)/core.length);
      core.forEach(p => { const m=(p.firstTs||'').slice(0,7); if(m) ongoingPub[m]=(ongoingPub[m]||0)+1; });
      // 최신 회차번호(제목에서) + 최신 발행일 → 미래 회차를 매주 1화씩 완결까지 추가
      const epNum = p => { const mm=(p.title||'').match(/(\d+)\s*화/); return mm?parseInt(mm[1]):0; };
      let maxEp = 0, lastDate = ongoing.lastPublishDate || todayStr();
      sp.forEach(p => { const n=epNum(p); if(n>maxEp) maxEp=n; const dt=(p.firstTs||'').slice(0,10); if(dt>lastDate) lastDate=dt; });
      if (!maxEp) maxEp = core.length + FREE_EPISODES;
      let cur = new Date(lastDate + 'T00:00:00');
      for (let ep = maxEp + 1; ep <= (ongoing.totalEpisodes||0); ep++){
        cur = new Date(cur.getTime() + 7*86400000);
        const m = `${cur.getFullYear()}-${pad(cur.getMonth()+1)}`;
        ongoingPub[m] = (ongoingPub[m]||0) + 1;
      }
    }
    const ongoingRev = ym => { let t=0; for(const pm in ongoingPub){ const md=monthDiff(pm,ym); if(md>=0) t+=ongoingPub[pm]*E0*lf(md); } return t; };

    // 멤버십 (최근 완전월 실측) — 고정 수입
    const memByMonth = {};
    dailyArr.forEach(x => { const m=(x.date||'').slice(0,7); if(m) memByMonth[m]=(memByMonth[m]||0)+((x.byType&&x.byType.membership)||0); });
    const memKeys = Object.keys(memByMonth).sort();
    const membership = memKeys.length ? memByMonth[memKeys[memKeys.length-1]] : 0;

    // 기타 baseline = 이번 달 실측 − 연재작 모델분 − 멤버십 (다른 작품들 + 구작, 현 수준 유지 가정)
    const baseM = thisMonth();
    const baseActual = dailyArr.filter(x=>(x.date||'').startsWith(baseM)).reduce((a,x)=>a+(x.rev||0),0);
    const otherBaseline = Math.max(0, baseActual - ongoingRev(baseM) - membership);

    // 신작 R시리즈 (8월~, 보수): 회차당 매출 작게, 매주. 전체 보기에서만 합산.
    const newSeriesPub = (currentChannel === '__all__') ? NEW_SERIES_PUB : {};
    const newSeriesRev = ym => { let t=0; for(const pm in newSeriesPub){ const md=monthDiff(pm,ym); if(md>=0) t+=newSeriesPub[pm]*NEW_SERIES_E0*lf(md); } return t; };

    function predictMonth(yearMonth){
      return Math.round(ongoingRev(yearMonth) + membership + otherBaseline + newSeriesRev(yearMonth));
    }
    // 월 총액에 그 달 요일 구성(주말 수) 반영 — 균등월 factor≈1, 주말 많은 달만 ±몇 %
    function predictMonthDow(yearMonth){
      const base = predictMonth(yearMonth);
      const [yy, mm] = yearMonth.split('-').map(Number);
      const dimm = daysInMonth(yearMonth);
      let weightSum = 0;
      for (let day = 1; day <= dimm; day++) weightSum += dowWeight[new Date(yy, mm-1, day).getDay()];
      const avgW = dowWeight.reduce((a,b) => a+b, 0) / 7;
      const factor = avgW > 0 ? (weightSum / dimm) / avgW : 1;
      return Math.round(base * factor);
    }

    return { dowWeight, recentDailyAvg, elapsedRevFraction, membership, otherBaseline, E0, ongoingPub, predictMonth, predictMonthDow, ongoing };
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
    // 오늘은 진행 중 — 지난 시간은 이미 actual에, '남은 시간'만 예측에 더함.
    // 시계 비율이 아니라 실제 시간대 매출 분포(저녁 피크)로 '지나간 매출 비율'을 계산.
    const dayElapsed = model.elapsedRevFraction ? model.elapsedRevFraction(now)
      : (now.getHours()*3600 + now.getMinutes()*60 + now.getSeconds()) / 86400;
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
  function renderKPIs(monthDaily, prevMonthDaily, ytdTotal, yearMonth){
    const sum     = monthDaily.reduce((a,d) => a + (d.rev||0), 0);
    const txCount = monthDaily.reduce((a,d) => a + (d.txCount||0), 0);
    const dayCnt  = monthDaily.length;
    const avg     = dayCnt ? Math.round(sum / dayCnt) : 0;
    let peakDay = null, peakRev = 0;
    monthDaily.forEach(d => { if ((d.rev||0) > peakRev){ peakRev = d.rev; peakDay = d.date; } });
    // 전월 대비: '요일 매칭'(N번째 같은 요일)으로 비교 — 매출이 요일에 좌우되므로.
    // 진행 중 달이면 오늘까지의 날짜에 대응하는 전월 같은 요일들만 합산.
    const isCurrentMonth = (yearMonth === thisMonth());
    const cutoffDay = isCurrentMonth ? new Date().getDate() : 99;
    const wdPrevK = buildWeekdayPrevMap(monthDaily, prevMonthDaily, yearMonth);
    let prevSum = 0;
    Object.keys(wdPrevK).forEach(ds => {
      if (parseInt(ds.slice(8,10)) <= cutoffDay && wdPrevK[ds].prevRev != null) prevSum += wdPrevK[ds].prevRev;
    });
    const delta   = sum - prevSum;
    const pct     = prevSum ? ((delta / prevSum) * 100) : null;
    const prevLabel = isCurrentMonth ? `전월 같은요일(1~${cutoffDay}일)` : '전월 같은요일';

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
      dSub.textContent = `${sign}${KRW(delta)} · ${prevLabel} ${KRW(prevSum)}`;
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
  function renderDailyChart(monthDaily, prevMonthDaily, yearMonth){
    const wrap  = document.getElementById('postype-daily-chart');
    const empty = document.getElementById('postype-daily-empty');
    const meta  = document.getElementById('postype-chart-meta');
    const old   = wrap.querySelector('svg');
    if (old) old.remove();

    const dim = daysInMonth(yearMonth);
    const map = Object.fromEntries(monthDaily.map(d => [d.date, d.rev || 0]));
    // 전월 = '요일 매칭'(N번째 같은 요일)으로 비교 — 매출이 요일에 좌우되므로
    const wdPrev = buildWeekdayPrevMap(monthDaily, prevMonthDaily, yearMonth);
    const today = new Date();
    const lastDay = (yearMonth === thisMonth()) ? today.getDate() : dim;
    const full = [];
    const [y, m] = yearMonth.split('-').map(Number);
    for (let day = 1; day <= dim; day++){
      const ds = `${y}-${pad(m)}-${pad(day)}`;
      const dt = new Date(Date.UTC(y, m-1, day));
      const wdIdx = dt.getUTCDay();
      const pm = wdPrev[ds] || {};
      full.push({
        date: ds, day, dow: dow[wdIdx], dowIdx: wdIdx,
        rev: day <= lastDay ? (map[ds] || 0) : null,
        prevRev: pm.prevRev != null ? pm.prevRev : null,
        prevDate: pm.prevDate || null,
        holiday: holidayName(ds),
        rest: isRestDay(ds, wdIdx)
      });
    }
    const hasAny = full.some(d => d.rev !== null && d.rev > 0);
    const hasPrev = full.some(d => d.prevRev !== null && d.prevRev > 0);
    if (!hasAny && !hasPrev){
      empty.style.display = 'flex';
      empty.textContent = isFuture(yearMonth) ? '미래 달 데이터 없음 (예측은 위 차트에서)' : '이 달 데이터 없음 · 북마크릿 ytd로 백필';
      wrap.__days = []; meta.textContent = '—';
      return;
    }
    empty.style.display = 'none';
    // 메타 라벨: 같은 날짜까지 누적 합 비교
    const sumThis = full.filter(d => d.rev !== null).reduce((a,d)=>a+d.rev, 0);
    const sumPrevTillCutoff = full.filter(d => d.day <= lastDay && d.prevRev !== null).reduce((a,d)=>a+d.prevRev, 0);
    const isCurr = (yearMonth === thisMonth());
    const cutoffLbl = isCurr ? `1~${lastDay}일` : '전월 동월';
    meta.textContent = hasPrev
      ? `이번달 ${KRW(sumThis)} · 전월 같은요일 ${KRW(sumPrevTillCutoff)} (${cutoffLbl}, 요일 정렬)`
      : `${dim}일 중 ${full.filter(d => d.rev !== null).length}일 표시`;

    const W = 800, H = 180, PAD = 10;
    const allVals = full.flatMap(d => [d.rev, d.prevRev]).filter(v => v !== null);
    const max = Math.max(...allVals, 1);
    const xs = full.map((d, i) => (i / Math.max(full.length-1, 1)) * W);
    // 이번달 path
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
    // 전월 path (점선, 슬레이트)
    let prevPath = ''; let inPrev = false;
    full.forEach((d, i) => {
      if (d.prevRev === null){ inPrev = false; return; }
      const x = xs[i];
      const yy = H - PAD - (d.prevRev / max) * (H - PAD*2);
      prevPath += (inPrev ? ` L${x},${yy}` : `M${x},${yy}`);
      inPrev = true;
    });
    // 주말 배경 음영 (토·일) — 매출이 오르는 경향이라 시각적 기준선
    const colW = full.length > 1 ? W / (full.length - 1) : W;
    const weekendBands = full.map((d, i) => {
      if (d.dowIdx !== 0 && d.dowIdx !== 6) return '';
      const cx = xs[i];
      return `<rect x="${(cx - colW/2).toFixed(1)}" y="0" width="${colW.toFixed(1)}" height="${H}" fill="#6366f1" opacity="0.04"/>`;
    }).join('');
    // 공휴일 마커 — 세로 점선 + 상단 점
    const holidayMarks = full.map((d, i) => {
      if (!d.holiday) return '';
      const cx = xs[i].toFixed(1);
      return `<line x1="${cx}" y1="0" x2="${cx}" y2="${H}" stroke="#f43f5e" stroke-width="1" stroke-dasharray="2,3" opacity="0.55"/>` +
             `<circle cx="${cx}" cy="6" r="2.5" fill="#f43f5e"/>`;
    }).join('');
    wrap.insertAdjacentHTML('afterbegin', `
      <svg viewBox="0 0 ${W} ${H}" width="100%" height="100%" preserveAspectRatio="none" style="display:block">
        <defs><linearGradient id="postype-area-grad" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#6366f1" stop-opacity="0.25"/><stop offset="1" stop-color="#6366f1" stop-opacity="0"/></linearGradient></defs>
        ${weekendBands}
        ${holidayMarks}
        ${area ? `<path d="${area}" fill="url(#postype-area-grad)"/>` : ''}
        ${prevPath ? `<path d="${prevPath}" fill="none" stroke="#94a3b8" stroke-width="1.5" stroke-dasharray="4,3" stroke-linejoin="round" opacity="0.7"/>` : ''}
        <path d="${path}" fill="none" stroke="#6366f1" stroke-width="2" stroke-linejoin="round"/>
      </svg>`);
    wrap.__days = full;
  }

  // ─── 월별 매출 추이 (전체 기간 월별 총 매출 연속 추이) ───────────
  function renderMonthlyTrend(){
    const wrap  = document.getElementById('postype-monthly-chart');
    const empty = document.getElementById('postype-monthly-empty');
    const meta  = document.getElementById('postype-monthly-meta');
    if (!wrap) return;
    const old = wrap.querySelector('svg');
    if (old) old.remove();

    const nowYM = thisMonth();
    // 월별 총 매출 합계 (전체 기간)
    const sumByYM = {};
    allDaily().forEach(d => { if (d.date){ const k = d.date.slice(0,7); sumByYM[k] = (sumByYM[k] || 0) + (d.rev || 0); } });
    const keys = Object.keys(sumByYM).filter(k => k <= nowYM).sort();   // 미래(오입력) 제외, 오름차순
    if (!keys.length){
      if (empty){ empty.style.display = 'flex'; empty.textContent = '데이터 없음'; }
      if (meta) meta.textContent = '—';
      wrap.__months = [];
      return;
    }
    if (empty) empty.style.display = 'none';

    // 첫 데이터 달 ~ 이번 달까지 모든 달 채우기 (빈 달은 null → 점은 없고 선은 가로로 이어짐)
    const firstYM = keys[0];
    const nextYM = ym => { let [yy, mm] = ym.split('-').map(Number); mm++; if (mm > 12){ mm = 1; yy++; } return `${yy}-${pad(mm)}`; };
    const months = [];
    for (let cur = firstYM; cur <= nowYM; cur = nextYM(cur)){
      months.push({ ym: cur, rev: sumByYM[cur] != null ? sumByYM[cur] : null, partial: cur === nowYM });
    }

    const present = months.filter(d => d.rev !== null);
    const total   = present.reduce((a, d) => a + d.rev, 0);
    const avg     = present.length ? Math.round(total / present.length) : 0;
    const peak    = present.reduce((a, d) => d.rev > a.rev ? d : a, present[0]);
    const ymLbl   = ym => { const [y, m] = ym.split('-'); return `${y.slice(2)}.${m}`; };
    if (meta){
      meta.textContent = `${ymLbl(firstYM)}~${ymLbl(nowYM)} · ${present.length}개월 · 월평균 ${KRW(avg)} · 최고 ${ymLbl(peak.ym)} ${KRW(peak.rev)}`;
    }

    const W = 800, H = 180, PADX = 6, PADY = 16;
    const max = Math.max(...present.map(d => d.rev), 1);
    const xAt = i => PADX + (months.length > 1 ? i / (months.length - 1) : 0.5) * (W - PADX * 2);
    const yAt = v => H - PADY - (v / max) * (H - PADY * 2);

    // 존재하는 달만 한 줄로 (빈 달은 가로 간격으로만 반영)
    const pts = months.map((d, i) => d.rev !== null ? { x: xAt(i), y: yAt(d.rev) } : null).filter(Boolean);

    // 부드러운 곡선 (Catmull-Rom → 3차 베지어)
    const smoothPath = ps => {
      if (!ps.length) return '';
      if (ps.length === 1) return `M${ps[0].x.toFixed(1)},${ps[0].y.toFixed(1)}`;
      let dd = `M${ps[0].x.toFixed(1)},${ps[0].y.toFixed(1)}`;
      for (let i = 0; i < ps.length - 1; i++){
        const p0 = ps[i-1] || ps[i], p1 = ps[i], p2 = ps[i+1], p3 = ps[i+2] || p2;
        const c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
        const c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
        dd += ` C${c1x.toFixed(1)},${c1y.toFixed(1)} ${c2x.toFixed(1)},${c2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
      }
      return dd;
    };
    const linePath = smoothPath(pts);
    const areaPath = pts.length ? `${linePath} L${pts[pts.length-1].x.toFixed(1)},${H} L${pts[0].x.toFixed(1)},${H} Z` : '';

    // 끝점(진행 중인 이번 달) 할로우 마커
    let endDot = '';
    const lastM = months[months.length - 1];
    if (lastM && lastM.rev !== null && pts.length){
      const p = pts[pts.length - 1];
      endDot = `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="3" fill="#fff" stroke="#6366f1" stroke-width="2"/>`;
    }

    wrap.insertAdjacentHTML('afterbegin', `
      <svg viewBox="0 0 ${W} ${H}" width="100%" height="100%" preserveAspectRatio="none" style="display:block">
        <defs><linearGradient id="postype-monthly-grad" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#6366f1" stop-opacity="0.22"/><stop offset="1" stop-color="#6366f1" stop-opacity="0"/></linearGradient></defs>
        ${areaPath ? `<path d="${areaPath}" fill="url(#postype-monthly-grad)"/>` : ''}
        ${linePath ? `<path d="${linePath}" fill="none" stroke="#6366f1" stroke-width="2" stroke-linejoin="round"/>` : ''}
        ${endDot}
      </svg>`);
    wrap.__months = months;
  }

  let _seriesDetailOpen = null;
  window.togglePostypeSeriesDetail = function(name){
    if (_seriesDetailOpen === name) return;
    _seriesDetailOpen = name;
    renderSeriesCurves();
  };

  const _fmtShort = v => v >= 10000 ? ((v/10000) >= 100 ? Math.round(v/10000) : (v/10000).toFixed(1)) + '만' : Math.round(v/1000) + 'k';

  function _seriesEpisodes(s, postById){
    const epNum = p => { const m = (p.title || '').match(/(\d+)\s*화/); return m ? parseInt(m[1]) : null; };
    return (s.posts || []).map(id => postById[id]).filter(Boolean)
      .sort((a, b) => { const na = epNum(a), nb = epNum(b); return (na != null && nb != null) ? na - nb : ((a.firstTs||'').localeCompare(b.firstTs||'')); })
      .map(p => {
        const n = epNum(p);
        return {
          ep: n, label: n != null ? n + '화' : (p.title || '?'),
          date: (p.firstTs || '').slice(0, 10),
          rev: p.totalRev || 0,
          tx: p.txCount || 0,
          unit: p.txCount ? Math.round((p.totalRev || 0) / p.txCount / 100) * 100 : 0,
          d1: p.revByAge ? p.revByAge.d1 : null,
          d7: p.revByAge ? p.revByAge.d7 : null
        };
      });
  }

  // ─── 위젯 1: 시리즈 순위 테이블 + 선택 상세 (2026-07-15 v2 — 카드 그리드의
  //     제목 잘림·그리드 깨짐 문제로 마스터-디테일 구조로 재설계) ───
  function renderSeriesCurves(){
    const wrap = document.getElementById('postype-series-curves');
    if (!wrap) return;
    const series = allSeries();
    const posts = allPosts();
    if (!series.length || !posts.length){
      wrap.innerHTML = '<div class="col-span-full text-center text-slate-400 text-sm py-12">데이터 없음</div>';
      return;
    }
    const postById = Object.fromEntries(posts.map(p => [p.postId, p]));
    const items = [...series]
      .filter(s => s.name !== '_멤버십_' && s.name !== '_미분류_' && (s.posts || []).length >= 2)
      .sort((a, b) => (b.totalRev||0) - (a.totalRev||0))
      .slice(0, 8)
      .map(s => {
        const eps = _seriesEpisodes(s, postById);
        if (eps.length < 2) return null;
        const revs = eps.map(e => e.rev);
        const total = revs.reduce((a, b) => a + b, 0);
        const totalTx = eps.reduce((a, e) => a + e.tx, 0);
        const peakIdx = revs.indexOf(Math.max(...revs));
        let trendPct = null, recAvg = 0, prevAvg = 0;
        if (eps.length >= 5){
          recAvg = revs.slice(-3).reduce((a, b) => a + b, 0) / 3;
          const prevArr = revs.slice(0, -3);
          prevAvg = prevArr.reduce((a, b) => a + b, 0) / prevArr.length;
          if (prevAvg > 0) trendPct = Math.round((recAvg - prevAvg) / prevAvg * 100);
        }
        return { name: s.name, eps, revs, total, totalTx, peakIdx, trendPct, recAvg, prevAvg };
      })
      .filter(Boolean);
    if (!items.length){
      wrap.innerHTML = '<div class="col-span-full text-center text-slate-400 text-sm py-12">회차 2개 이상인 시리즈가 없어요</div>';
      return;
    }
    if (!_seriesDetailOpen || !items.some(x => x.name === _seriesDetailOpen)) _seriesDetailOpen = items[0].name;

    const rows = items.map((it, idx) => {
      const isSel = it.name === _seriesDetailOpen;
      const eps = it.eps, revs = it.revs, n = eps.length;
      const max = Math.max(...revs, 1);
      const peak = eps[it.peakIdx];
      const period = (eps[0].date && eps[n-1].date)
        ? eps[0].date.slice(2).replace(/-/g, '.') + ' ~ ' + eps[n-1].date.slice(2).replace(/-/g, '.') : '';
      const SW = 96, SH = 26;
      const scx = i => 3 + (i / Math.max(n - 1, 1)) * (SW - 6);
      const scy = i => SH - 2 - (revs[i] / max) * (SH - 6);
      const pts = eps.map((e, i) => scx(i) + ',' + scy(i)).join(' ');
      const spark = '<svg viewBox="0 0 ' + SW + ' ' + SH + '" style="width:' + SW + 'px;height:' + SH + 'px;display:block">' +
        '<polyline points="' + pts + '" fill="none" stroke="' + (isSel ? '#6366f1' : '#a5b4fc') + '" stroke-width="1.5"/>' +
        '<circle cx="' + scx(it.peakIdx) + '" cy="' + scy(it.peakIdx) + '" r="2.4" fill="#f59e0b"/></svg>';
      const trendHtml = it.trendPct == null ? '<span class="text-slate-300">—</span>' :
        '<span class="' + (it.trendPct >= 0 ? 'text-emerald-600' : 'text-rose-600') + ' font-bold" title="최근 3화 평균 ' + KRW(Math.round(it.recAvg)) + ' vs 이전 평균 ' + KRW(Math.round(it.prevAvg)) + '">' + (it.trendPct >= 0 ? '▲' : '▼') + Math.abs(it.trendPct) + '%</span>';
      const nameAttr = it.name.replace(/'/g, "\\'").replace(/"/g, '&quot;');
      return '<tr onclick="togglePostypeSeriesDetail(\'' + nameAttr + '\')" class="cursor-pointer border-b border-slate-50 transition-colors ' + (isSel ? 'bg-indigo-50/70' : 'hover:bg-slate-50') + '">' +
        '<td class="px-3 py-2.5 text-slate-300 font-bold tabular-nums">' + (idx + 1) + '</td>' +
        '<td class="px-2 py-2.5" style="min-width:150px">' +
          '<div class="text-xs font-bold ' + (isSel ? 'text-indigo-700' : 'text-slate-800') + '">' + it.name + (isSel ? ' <span class="text-[9px] font-black text-indigo-400 align-middle">▼ 아래 상세</span>' : '') + '</div>' +
          '<div class="text-[10px] text-slate-400 mt-0.5">' + eps[0].label + '~' + eps[n-1].label + ' · ' + n + '편 · ' + period + '</div>' +
        '</td>' +
        '<td class="px-2 py-2.5 text-right font-bold text-slate-800 tabular-nums whitespace-nowrap">' + KRW(it.total) + '</td>' +
        '<td class="px-2 py-2.5 text-right text-slate-500 tabular-nums whitespace-nowrap">' + KRW(Math.round(it.total / n)) + '</td>' +
        '<td class="px-2 py-2.5 text-right text-slate-500 tabular-nums whitespace-nowrap">' + (it.totalTx ? KRW(Math.round(it.total / it.totalTx / 100) * 100) : '—') + '</td>' +
        '<td class="px-2 py-2.5 whitespace-nowrap"><b class="text-amber-600">' + peak.label + '</b> <span class="text-slate-500 text-[10px] tabular-nums">' + KRW(peak.rev) + '</span></td>' +
        '<td class="px-2 py-2.5 text-right whitespace-nowrap">' + trendHtml + '</td>' +
        '<td class="px-3 py-2.5">' + spark + '</td>' +
      '</tr>';
    }).join('');

    const sel = items.find(x => x.name === _seriesDetailOpen);
    wrap.innerHTML = '<div style="grid-column:1/-1">' +
      '<div class="overflow-x-auto rounded-xl border border-slate-100">' +
        '<table class="w-full text-[11px]" style="min-width:680px">' +
          '<thead><tr class="text-left text-slate-400 bg-slate-50/60 border-b border-slate-100">' +
            '<th class="px-3 py-2 font-semibold">#</th><th class="px-2 py-2 font-semibold">시리즈</th>' +
            '<th class="px-2 py-2 font-semibold text-right">총 매출</th><th class="px-2 py-2 font-semibold text-right">회차 평균</th>' +
            '<th class="px-2 py-2 font-semibold text-right">평균 구매액</th><th class="px-2 py-2 font-semibold">피크</th>' +
            '<th class="px-2 py-2 font-semibold text-right">최근 3화</th><th class="px-3 py-2 font-semibold">추이</th>' +
          '</tr></thead><tbody>' + rows + '</tbody>' +
        '</table>' +
      '</div>' +
      (sel ? _seriesDetailHtml(sel.name, sel.eps, sel.peakIdx) : '') +
    '</div>';
  }

  function _seriesDetailHtml(name, eps, peakIdx){
    const revs = eps.map(e => e.rev);
    const max = Math.max(...revs, 1);
    const total = revs.reduce((a, b) => a + b, 0);
    const totalTx = eps.reduce((a, e) => a + e.tx, 0);
    const minIdx = revs.indexOf(Math.min(...revs));
    const avgUnit = totalTx ? Math.round(total / totalTx / 100) * 100 : 0;

    const chips = [
      ['연재 기간', eps[0].date + ' ~ ' + eps[eps.length-1].date],
      ['수집 회차', eps[0].label + '~' + eps[eps.length-1].label + ' (' + eps.length + '편)'],
      ['총 매출', KRW(total)],
      ['총 판매', totalTx.toLocaleString('ko-KR') + '건'],
      ['회차당 평균', KRW(Math.round(total / eps.length))],
      ['평균 구매액', KRW(avgUnit)],
      ['최고', eps[peakIdx].label + ' · ' + KRW(eps[peakIdx].rev)],
      ['최저', eps[minIdx].label + ' · ' + KRW(eps[minIdx].rev)]
    ].map(c => '<div class="bg-white rounded-lg border border-slate-100 px-3 py-2"><div class="text-[9px] uppercase tracking-wider text-slate-400">' + c[0] + '</div><div class="text-xs font-bold text-slate-700 tabular-nums mt-0.5">' + c[1] + '</div></div>').join('');

    const W = 800, H = 240, PL = 46, PR = 8, PT = 14, PB = 26;
    const innerW = W - PL - PR, innerH = H - PT - PB;
    const n = eps.length;
    const bw = Math.min(innerW / n * 0.62, 34);
    const gridLines = [0.25, 0.5, 0.75, 1].map(f => {
      const y = PT + innerH - innerH * f;
      return '<line x1="' + PL + '" y1="' + y + '" x2="' + (W - PR) + '" y2="' + y + '" stroke="#e2e8f0" stroke-width="0.5" stroke-dasharray="2,3"/>' +
        '<text x="' + (PL - 6) + '" y="' + (y + 3) + '" text-anchor="end" fill="#94a3b8" font-size="9">' + _fmtShort(max * f) + '</text>';
    }).join('');
    const showEvery = n > 20 ? 2 : 1;
    const bars = eps.map((e, i) => {
      const x = PL + (i + 0.5) / n * innerW - bw / 2;
      const h = (e.rev / max) * innerH;
      const y = PT + innerH - h;
      const isPeak = i === peakIdx;
      const prev = i > 0 ? eps[i-1].rev : null;
      const pct = (prev && prev > 0) ? Math.round((e.rev - prev) / prev * 100) : null;
      return '<rect x="' + x + '" y="' + y + '" width="' + bw + '" height="' + Math.max(h, 1) + '" rx="2" fill="' + (isPeak ? '#f59e0b' : '#6366f1') + '" opacity="' + (isPeak ? 1 : 0.85) + '">' +
          '<title>' + e.label + ' (' + e.date + ')&#10;매출 ' + KRW(e.rev) + ' · ' + e.tx + '건 · 평균 ' + KRW(e.unit) + (pct != null ? '&#10;전화 대비 ' + (pct >= 0 ? '+' : '') + pct + '%' : '') + '</title>' +
        '</rect>' +
        (n <= 24 ? '<text x="' + (x + bw/2) + '" y="' + (y - 3) + '" text-anchor="middle" fill="#64748b" font-size="8" font-weight="600">' + _fmtShort(e.rev) + '</text>' : '') +
        (i % showEvery === 0 ? '<text x="' + (x + bw/2) + '" y="' + (H - 8) + '" text-anchor="middle" fill="#94a3b8" font-size="9">' + (e.ep != null ? e.ep : '') + '</text>' : '');
    }).join('');

    const fmtN = v => v == null ? '<span class="text-slate-300">—</span>' : Math.round(v).toLocaleString('ko-KR');
    const rows = eps.map((e, i) => {
      const prev = i > 0 ? eps[i-1].rev : null;
      const pct = (prev && prev > 0) ? Math.round((e.rev - prev) / prev * 100) : null;
      const pctHtml = pct == null ? '<span class="text-slate-300">—</span>' :
        '<span class="' + (pct >= 0 ? 'text-emerald-600' : 'text-rose-600') + ' font-bold">' + (pct >= 0 ? '+' : '') + pct + '%</span>';
      return '<tr class="' + (i === peakIdx ? 'bg-amber-50' : '') + ' border-b border-slate-50 hover:bg-slate-50">' +
        '<td class="px-2 py-1.5 font-bold ' + (i === peakIdx ? 'text-amber-600' : 'text-slate-700') + '">' + e.label + (i === peakIdx ? ' 👑' : '') + '</td>' +
        '<td class="px-2 py-1.5 text-slate-500 whitespace-nowrap">' + e.date + '</td>' +
        '<td class="px-2 py-1.5 text-right font-bold text-slate-800 tabular-nums">' + e.rev.toLocaleString('ko-KR') + '</td>' +
        '<td class="px-2 py-1.5 text-right text-slate-500 tabular-nums">' + e.tx + '</td>' +
        '<td class="px-2 py-1.5 text-right text-slate-500 tabular-nums">' + fmtN(e.unit) + '</td>' +
        '<td class="px-2 py-1.5 text-right text-slate-500 tabular-nums">' + fmtN(e.d1) + '</td>' +
        '<td class="px-2 py-1.5 text-right text-slate-500 tabular-nums">' + fmtN(e.d7) + '</td>' +
        '<td class="px-2 py-1.5 text-right tabular-nums">' + pctHtml + '</td>' +
      '</tr>';
    }).join('');

    return '<div id="postype-series-detail" class="rounded-xl border border-indigo-100 bg-white p-4 mt-3">' +
      '<div class="text-sm font-black text-slate-800 mb-3">' + name + ' — 회차별 상세</div>' +
      '<div class="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">' + chips + '</div>' +
      '<svg viewBox="0 0 ' + W + ' ' + H + '" style="width:100%;display:block" class="mb-4">' + gridLines + bars + '</svg>' +
      '<div class="overflow-x-auto"><table class="w-full text-[11px]" style="min-width:560px">' +
        '<thead><tr class="text-left text-slate-400 border-b border-slate-200">' +
          '<th class="px-2 py-1.5 font-semibold">회차</th><th class="px-2 py-1.5 font-semibold">발행일</th>' +
          '<th class="px-2 py-1.5 font-semibold text-right">매출(원)</th><th class="px-2 py-1.5 font-semibold text-right">판매(건)</th>' +
          '<th class="px-2 py-1.5 font-semibold text-right">평균 구매액</th><th class="px-2 py-1.5 font-semibold text-right">첫날</th>' +
          '<th class="px-2 py-1.5 font-semibold text-right">첫 7일</th><th class="px-2 py-1.5 font-semibold text-right">전화 대비</th>' +
        '</tr></thead><tbody>' + rows + '</tbody></table></div>' +
      '<p class="text-[10px] text-slate-400 mt-2">매출 = 전체 기간 누적 · 첫날/첫 7일 = 발행 후 24시간/7일 누적 매출 · 평균 구매액 = 매출 ÷ 판매 건수 (묶음 구매 포함) · 무료 회차는 판매 데이터가 없어 표시되지 않음</p>' +
    '</div>';
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
    // 헤더에서 선택한 달 기준으로 카드 표시 (5월 보면 5월 카드, 6월 보면 6월 카드)
    const selM = currentMonth || thisMonth();
    const nowM = thisMonth();
    let selTotal, selSub;
    if (selM < nowM){
      // 과거 달: 이미 끝난 달 → 실측이 곧 최종
      const selActual = allDaily().filter(d => d.date && d.date.startsWith(selM)).reduce((a,d)=>a+(d.rev||0), 0);
      selTotal = selActual;
      selSub = `${monthLabel(selM)} · 실측 ${KRW(selActual)} · 완료된 달`;
    } else if (selM === nowM){
      // 진행 중 이번 달: 실측 + 남은 시간 예측
      const f = predictThisMonth(model);
      selTotal = f.total;
      selSub = `${monthLabel(selM)} · 실측 ${KRW(f.actual)} + 잔여 ${KRW(f.remainingForecast)}`;
    } else {
      // 미래 달
      selTotal = model.predictMonthDow(selM);
      selSub = `${monthLabel(selM)} 예측`;
    }
    const payT = paymentForMonth(selM);
    document.getElementById('postype-forecast-this-total').textContent = KRW(selTotal);
    document.getElementById('postype-forecast-this-net').textContent = `실수령 ≈ ${KRW(applyFee(selTotal))}`;
    document.getElementById('postype-forecast-this-sub').textContent = `${selSub} · 입금 ${payT.slice(5,7)}/${payT.slice(8,10)}`;
    document.getElementById('postype-payment-amount').textContent = KRW(applyFee(selTotal));

    // "다음 달 예상" = 선택 달의 다음 달
    const nextM = nextMonth(selM);
    let nextTotal;
    if (nextM < nowM){
      nextTotal = allDaily().filter(d => d.date && d.date.startsWith(nextM)).reduce((a,d)=>a+(d.rev||0), 0);
    } else if (nextM === nowM){
      nextTotal = predictThisMonth(model).total;
    } else {
      nextTotal = model.predictMonthDow(nextM);
    }
    document.getElementById('postype-forecast-next-total').textContent = KRW(nextTotal);
    document.getElementById('postype-forecast-next-net').textContent = `실수령 ≈ ${KRW(applyFee(nextTotal))}`;
    const payN = paymentForMonth(nextM);
    const nextLabel = nextM < nowM ? '실측' : (nextM === nowM ? '진행 중' : '예측');
    document.getElementById('postype-forecast-next-sub').textContent = `${monthLabel(nextM)} ${nextLabel} · 입금 ${payN.slice(5,7)}/${payN.slice(8,10)}`;

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
      const curStr = d.rev === null ? '미래' : KRW(d.rev);
      // 전월 같은 요일 매칭 (날짜 다름) — 비교 기준 명시
      const prevDayLbl = d.prevDate ? `${parseInt(d.prevDate.slice(8,10))}일` : '';
      const prevStr = (d.prevRev != null) ? ` · 전월 ${prevDayLbl}(같은요일) ${KRW(d.prevRev)}` : '';
      const holiStr = d.holiday ? ` 🔴${d.holiday}` : '';
      const label = `${d.day}일 (${d.dow})${holiStr} · ${curStr}${prevStr}`;
      tt.textContent = label;
      tt.style.display = 'block';
      tt.style.left = Math.min(Math.max(x + 12, 8), rect.width - 200) + 'px';
      tt.style.top  = '8px';
      vl.style.display = 'block';
      vl.style.left = (idx / Math.max(days.length-1, 1) * rect.width) + 'px';
    });
    wrap.addEventListener('mouseleave', () => { tt.style.display = 'none'; vl.style.display = 'none'; });
  }
  function attachMonthlyHover(){
    const wrap = document.getElementById('postype-monthly-chart');
    const tt   = document.getElementById('postype-monthly-tooltip');
    const vl   = document.getElementById('postype-monthly-vline');
    if (!wrap || wrap.__hoverAttached) return;
    wrap.__hoverAttached = true;
    wrap.addEventListener('mousemove', e => {
      const months = wrap.__months;
      if (!months || !months.length) return;
      const rect = wrap.getBoundingClientRect();
      const x    = e.clientX - rect.left;
      const idx  = Math.max(0, Math.min(months.length-1, Math.round(x / rect.width * (months.length-1))));
      const d    = months[idx];
      const [yy, mm] = d.ym.split('-');
      if (d.rev === null){
        tt.textContent = `${yy}.${mm} · 데이터 없음`;
      } else {
        // 직전(데이터 있는) 달 대비 증감
        let momStr = '';
        for (let j = idx - 1; j >= 0; j--){
          if (months[j].rev !== null && months[j].rev > 0){
            const pct = (d.rev - months[j].rev) / months[j].rev * 100;
            momStr = ` (전월 ${pct >= 0 ? '+' : ''}${pct.toFixed(0)}%)`;
            break;
          }
        }
        const partialStr = d.partial ? ' · 진행 중' : '';
        tt.textContent = `${yy}.${mm} · ${KRW(d.rev)}${momStr}${partialStr}`;
      }
      tt.style.display = 'block';
      tt.style.left = Math.min(Math.max(x + 12, 8), rect.width - 200) + 'px';
      tt.style.top  = '8px';
      vl.style.display = 'block';
      vl.style.left = (idx / Math.max(months.length-1, 1) * rect.width) + 'px';
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
    renderKPIs(monthDaily, prevMd, ytdTotal, yearMonth);
    renderDailyChart(monthDaily, prevMd, yearMonth);
    renderMonthlyTrend();
    renderSeriesCurves();
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
      existing.forEach(p => { if (p.channelId && p.postId) byKey[`${p.channelId}|${p.postId}`] = p; });
      for (const p of payload.posts){
        const doc = Object.assign({}, p); delete doc._id;
        const k = `${doc.channelId}|${doc.postId}`;
        const old = byKey[k];
        if (old){
          // ★ (2026-07-15) 부분 기간 동기화가 통계를 후퇴시키지 않게 병합:
          //   '이번 달만' 동기화 시 그 기간 거래만으로 계산된 부분값이 전체 누적을
          //   덮어써서 회차 통계(누적·발행일·첫날/7일)가 망가지던 버그 수정.
          //   누적(totalRev/txCount)은 max, 발행 정보(firstTs/revByAge)는 더 이른 기록 우선.
          if (old.firstTs && doc.firstTs && old.firstTs < doc.firstTs){
            doc.firstTs = old.firstTs;
            if (old.revByAge) doc.revByAge = old.revByAge;
          }
          doc.totalRev = Math.max(doc.totalRev || 0, old.totalRev || 0);
          doc.txCount  = Math.max(doc.txCount  || 0, old.txCount  || 0);
          if (!doc.series && old.series) doc.series = old.series;
          if (!doc.title && old.title) doc.title = old.title;
          await fbUpdate(COLL_POSTS, old._id, doc); result.posts.updated++;
        }
        else { await fbAdd(COLL_POSTS, doc); result.posts.added++; }
      }
    }
    if (Array.isArray(payload.series) && payload.series.length){
      const existing = await fbRead(COLL_SERIES);
      const byKey = {};
      existing.forEach(s => { if (s.channelId && s.name) byKey[`${s.channelId}|${s.name}`] = s; });
      for (const s of payload.series){
        const doc = Object.assign({}, s); delete doc._id;
        const k = `${doc.channelId}|${doc.name}`;
        const old = byKey[k];
        if (old){
          // ★ 시리즈도 동일 병합: 누적 max · 기간 min/max · 회차 목록 합집합
          doc.totalRev = Math.max(doc.totalRev || 0, old.totalRev || 0);
          doc.txCount  = Math.max(doc.txCount  || 0, old.txCount  || 0);
          if (old.firstSeen && (!doc.firstSeen || old.firstSeen < doc.firstSeen)) doc.firstSeen = old.firstSeen;
          if (old.lastSale  && (!doc.lastSale  || old.lastSale  > doc.lastSale))  doc.lastSale  = old.lastSale;
          doc.posts = [...new Set([...(old.posts || []), ...(doc.posts || [])])];
          await fbUpdate(COLL_SERIES, old._id, doc); result.series.updated++;
        }
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
    attachHover(); attachMonthlyHover(); attachMonthNav(); attachChannelSelector(); setupPostypeBridge();
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
