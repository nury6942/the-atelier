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

    // Daily upsert (key: channelId + date)
    if (Array.isArray(payload.daily) && payload.daily.length){
      const existing = await fbRead(COLL_DAILY);
      const byDate = {};
      existing.forEach(d => {
        if (d.channelId === CHANNEL_ID && d.date) byDate[d.date] = d._id;
      });
      for (const d of payload.daily){
        const doc = Object.assign({}, d, { channelId: CHANNEL_ID });
        delete doc._id;
        if (byDate[d.date]){
          await fbUpdate(COLL_DAILY, byDate[d.date], doc);
          result.daily.updated++;
        } else {
          await fbAdd(COLL_DAILY, doc);
          result.daily.added++;
        }
      }
    }

    // Posts upsert (key: channelId + postId)
    if (Array.isArray(payload.posts) && payload.posts.length){
      const existing = await fbRead(COLL_POSTS);
      const byId = {};
      existing.forEach(p => {
        if (p.channelId === CHANNEL_ID && p.postId) byId[p.postId] = p._id;
      });
      for (const p of payload.posts){
        const doc = Object.assign({}, p, { channelId: CHANNEL_ID });
        delete doc._id;
        if (byId[p.postId]){
          await fbUpdate(COLL_POSTS, byId[p.postId], doc);
          result.posts.updated++;
        } else {
          await fbAdd(COLL_POSTS, doc);
          result.posts.added++;
        }
      }
    }

    // Series upsert (key: channelId + name)
    if (Array.isArray(payload.series) && payload.series.length){
      const existing = await fbRead(COLL_SERIES);
      const byName = {};
      existing.forEach(s => {
        if (s.channelId === CHANNEL_ID && s.name) byName[s.name] = s._id;
      });
      for (const s of payload.series){
        const doc = Object.assign({}, s, { channelId: CHANNEL_ID });
        delete doc._id;
        if (byName[s.name]){
          await fbUpdate(COLL_SERIES, byName[s.name], doc);
          result.series.updated++;
        } else {
          await fbAdd(COLL_SERIES, doc);
          result.series.added++;
        }
      }
    }

    return { ok: true, result };
  }

  // ─── Bridge 상태 표시 ───────────────────────────────────────────
  function showBridgeStatus(msg, color){
    const el = document.getElementById('postype-last-sync');
    if (!el) return;
    const c = color || '#6366f1';
    el.innerHTML = `<span style="color:${c};font-weight:600">${msg}</span>`;
  }

  // ─── 부업 섹션으로 자동 이동 ────────────────────────────────────
  function ensureSideJobVisible(){
    try {
      if (typeof navigate === 'function') navigate('income');
      else if (typeof window.navigate === 'function') window.navigate('income');
    } catch(e){ console.warn('[postype-bridge] navigate 실패', e); }
    setTimeout(() => {
      try { if (typeof window.switchMoneyTab === 'function') window.switchMoneyTab('sidejobs'); } catch(e){}
    }, 150);
    setTimeout(() => {
      const sec = document.getElementById('postype-analytics-section');
      if (sec) sec.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 500);
  }

  // ─── postMessage 브릿지 셋업 ────────────────────────────────────
  function setupPostypeBridge(){
    const params  = new URLSearchParams(location.search);
    const isBridge = params.get('postype-bridge') === '1';

    if (isBridge){
      // 부업 페이지로 자동 이동 + opener에게 ready 신호
      setTimeout(() => {
        ensureSideJobVisible();
        showBridgeStatus('데이터 수신 대기 중...');
        if (window.opener && !window.opener.closed){
          try {
            window.opener.postMessage({ type: 'postype-bridge-ready' }, '*');
          } catch(e){ console.warn('[postype-bridge] opener 신호 실패', e); }
        }
      }, 600);
    }

    // postype.com 도메인에서 오는 메시지만 수신
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
          loaded = false;  // 다시 로드 트리거
          await loadAndRender();
          if (e.source){
            try { e.source.postMessage({ type: 'postype-import-done', result: r }, e.origin); } catch(_){}
          }
        } else {
          showBridgeStatus(`❌ 저장 실패: ${res.error}`, '#ef4444');
        }
      } catch(err){
        console.error('[postype-bridge] push error', err);
        showBridgeStatus(`❌ 에러: ${err.message}`, '#ef4444');
      }
    });
  }

  // ─── "오늘 데이터 가져오기" 버튼 — 포스타입 수익 페이지 새 탭 ───
  window.syncPostypeAnalytics = function(){
    const url = 'https://www.postype.com/point/earnings/list';
    if (confirm('포스타입 수익 페이지를 새 탭에 열까요?\n로그인된 상태에서 북마크릿을 클릭하면\natelier로 데이터가 자동 전송됩니다.')){
      window.open(url, '_blank');
    }
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
