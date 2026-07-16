/* ───────────────────────────────────────────────────────────────────
   postype-bookmarklet.js — 포스타입 수익 데이터 수집 → atelier 전송
   - 사용자가 포스타입 수익 페이지에서 북마크릿 클릭하면 실행
   - 데이터 fetch + 일별/포스트/시리즈 집계 후 atelier 새 탭에 postMessage 전송
   - atelier 쪽 핸들러: js/app-6-postype-analytics.js의 setupPostypeBridge()
   ─────────────────────────────────────────────────────────────────── */
(async () => {
  // ─── 설정 ───────────────────────────────────────────────────────
  // CHANNEL_ID는 거래마다 href에서 자동 추출 (멀티채널 지원)
  const ATELIER_URL = 'https://nury6942.github.io/the-atelier/?postype-bridge=1';
  const ATELIER_ORIGIN = 'https://nury6942.github.io';

  // ─── 사전 체크: 포스타입 수익 페이지인지 ────────────────────────
  if (!location.hostname.includes('postype.com')){
    alert('이 북마크릿은 postype.com 수익 페이지에서만 동작합니다.');
    return;
  }
  if (!location.pathname.startsWith('/point/earnings')){
    if (!confirm('수익 페이지가 아닌데 진행할까요?\n( /point/earnings/list 권장 )')) return;
  }

  // ─── 동기화 범위 선택 — 버튼 패널 (2026-07-15: prompt → UI) ─────
  //  · 이번 달 / 지난달 / 특정 월만(월 그리드) / 올해 전체 / 최근 N일
  //  · 특정 월은 [그 달 1일 00:00, 다음 달 1일 00:00) 범위만 수집 —
  //    마감 놓친 지난달만 다시 동기화 가능
  const pad = n => String(n).padStart(2, '0');
  const now = new Date();
  const monthRange = (y, m) => {  // m: 0-base
    const cutoff = `${y}-${pad(m + 1)}-01 00:00:00`;
    const ny = m === 11 ? y + 1 : y, nm = m === 11 ? 0 : m + 1;
    const isCurrent = (y === now.getFullYear() && m === now.getMonth());
    return {
      cutoffStr: cutoff,
      upperStr: isCurrent ? null : `${ny}-${pad(nm + 1)}-01 00:00:00`,
      DAYS: new Date(y, m + 1, 0).getDate(),
      modeLabel: isCurrent ? `이번 달 (${m + 1}월)` : `${y}년 ${m + 1}월만`
    };
  };

  const chooseRange = () => new Promise((resolve) => {
    const Y = now.getFullYear(), M = now.getMonth();
    const BTN  = 'border:1px solid #2e2e38;background:#1a1a21;color:#e8e8ec;border-radius:10px;padding:10px 12px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .15s';
    const PRIM = 'border:1px solid #6366f1;background:linear-gradient(135deg,#6366f1,#8b5cf6);color:#fff;border-radius:10px;padding:12px;font-size:13px;font-weight:700;cursor:pointer;font-family:inherit;width:100%';
    const MBTN = 'border:1px solid #2e2e38;background:#16161c;color:#c7c7d1;border-radius:8px;padding:7px 0;font-size:12px;font-weight:600;cursor:pointer;font-family:inherit;flex:1;min-width:44px';
    const ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:999998;background:rgba(8,8,12,0.6);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;font-family:-apple-system,Pretendard,sans-serif';
    let monthBtns = '';
    for (let m = 0; m <= M; m++) monthBtns += `<button data-m="${m}" style="${MBTN}${m === M ? ';border-color:#6366f1;color:#a5b4fc' : ''}">${m + 1}월</button>`;
    const prevY = M === 0 ? Y - 1 : Y, prevM = M === 0 ? 11 : M - 1;
    ov.innerHTML = `
      <div style="background:#0f0f12;color:#e8e8ec;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,0.5);padding:24px;width:340px;max-width:92vw">
        <div style="font-weight:700;font-size:11px;color:#8b8b98;letter-spacing:0.08em;text-transform:uppercase;margin-bottom:4px">atelier 동기화</div>
        <div style="font-weight:800;font-size:16px;margin-bottom:16px">어느 범위를 가져올까요?</div>
        <button data-act="this" style="${PRIM}">이번 달 (${M + 1}월 1일 ~ 지금)</button>
        <div style="display:flex;gap:8px;margin-top:8px">
          <button data-act="prev" style="${BTN};flex:1">지난달 (${prevM + 1}월)</button>
          <button data-act="ytd" style="${BTN};flex:1">올해 전체</button>
        </div>
        <div style="font-size:11px;color:#8b8b98;margin:16px 0 6px;font-weight:600">특정 월만 다시 동기화 (${Y})</div>
        <div style="display:flex;gap:6px;flex-wrap:wrap">${monthBtns}</div>
        <div style="display:flex;gap:8px;margin-top:16px;align-items:center">
          <span style="font-size:12px;color:#8b8b98;white-space:nowrap">최근</span>
          <input id="ps-days" type="number" min="1" max="400" placeholder="90" style="width:64px;background:#16161c;border:1px solid #2e2e38;border-radius:8px;color:#e8e8ec;padding:8px;font-size:13px;text-align:center;font-family:inherit">
          <span style="font-size:12px;color:#8b8b98">일</span>
          <button data-act="days" style="${BTN};flex:1">가져오기</button>
        </div>
        <button data-act="cancel" style="border:0;background:none;color:#6b6b78;font-size:12px;font-weight:600;cursor:pointer;width:100%;margin-top:14px;padding:6px;font-family:inherit">취소</button>
      </div>`;
    document.body.appendChild(ov);
    const done = v => { ov.remove(); resolve(v); };
    ov.addEventListener('click', e => {
      if (e.target === ov) return done(null);
      const b = e.target.closest('button');
      if (!b) return;
      const act = b.dataset.act, m = b.dataset.m;
      if (act === 'cancel') return done(null);
      if (act === 'this') return done(monthRange(Y, M));
      if (act === 'prev') return done(monthRange(prevY, prevM));
      if (m !== undefined) return done(monthRange(Y, parseInt(m)));
      if (act === 'ytd') return done({
        cutoffStr: `${Y}-01-01 00:00:00`, upperStr: null,
        DAYS: Math.ceil((now.getTime() - new Date(Y, 0, 1).getTime()) / 86400000) + 1,
        modeLabel: `올해 전체 (${Y})`
      });
      if (act === 'days'){
        const n = Math.max(1, Math.min(400, parseInt(document.getElementById('ps-days').value) || 28));
        return done({
          cutoffStr: new Date(now.getTime() - n * 86400000).toISOString().slice(0, 10) + ' 00:00:00',
          upperStr: null, DAYS: n, modeLabel: `최근 ${n}일`
        });
      }
    });
  });

  const range = await chooseRange();
  if (!range) return;  // 취소
  const DAYS = range.DAYS, cutoffStr = range.cutoffStr, upperStr = range.upperStr, modeLabel = range.modeLabel;

  // ─── 진행 상황 표시 패널 ───────────────────────────────────────
  const panel = document.createElement('div');
  panel.style.cssText = 'position:fixed;top:20px;right:20px;z-index:999999;background:#0f0f12;color:#e8e8ec;padding:20px 24px;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.3);font-family:-apple-system,Pretendard,sans-serif;font-size:14px;line-height:1.5;min-width:280px;max-width:380px';
  panel.innerHTML = `
    <div style="font-weight:700;font-size:13px;color:#a5a5b0;letter-spacing:0.05em;text-transform:uppercase;margin-bottom:8px">atelier 동기화</div>
    <div id="ps-msg" style="font-weight:500">초기화…</div>
    <div id="ps-prog" style="font-size:11px;color:#888;margin-top:6px">—</div>
  `;
  document.body.appendChild(panel);
  const setMsg = (m, p) => {
    const el = panel.querySelector('#ps-msg');
    const pl = panel.querySelector('#ps-prog');
    if (el) el.textContent = m;
    if (pl && p !== undefined) pl.textContent = p;
  };

  // ─── 수익 페이지 파서 ──────────────────────────────────────────
  const parsePage = (html) => {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    const cards = new Set();
    doc.querySelectorAll('a[href*="/post/"], a[href*="/membership/"]').forEach(a => a.parentElement && cards.add(a.parentElement));
    return [...cards].map(c => {
      const text = c.textContent || '';
      const link = c.querySelector('a[href*="/post/"], a[href*="/membership/"]');
      const href = link ? link.getAttribute('href') : '';
      const a = text.match(/([\d,]+)\s*(P|원)/);
      const t = text.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{1,2}):(\d{2}):(\d{2})/);
      const ts = t ? `${t[1]}-${t[2].padStart(2,'0')}-${t[3].padStart(2,'0')} ${t[4].padStart(2,'0')}:${t[5]}:${t[6]}` : null;
      const type = text.includes('멤버십을 결제') ? 'membership' : text.includes('판매했어요') ? 'sale' : text.includes('후원') ? 'support' : '?';
      let series = '', title = '';
      if (link){
        const txts = [...new Set([...link.querySelectorAll('*')].map(n => n.childNodes.length === 1 && n.firstChild.nodeType === 3 ? n.textContent.trim() : null).filter(x => x && !x.includes('영구 열람')))];
        if (txts.length >= 2){ series = txts[0]; title = txts[1]; }
        else if (txts.length === 1){ title = txts[0]; }
      }
      const pm = href.match(/\/post\/(\d+)/);
      const mm = href.match(/\/membership\/(\d+)/);
      const postId = pm ? pm[1] : (mm ? 'mem-' + mm[1] : null);
      // channelId 자동 추출 (/@channelId/post/... 또는 /@channelId/membership/...)
      const cm = href.match(/\/@([^\/]+)\//);
      const channelId = cm ? cm[1] : null;
      return { type, amount: a ? parseInt(a[1].replace(/,/g, '')) : 0, ts, postId, series, title, href, channelId };
    });
  };

  // ─── 데이터 수집 (페이지별 retry + 실패 추적) ──────────────────
  const hint = DAYS >= 60 ? `${modeLabel} 백필 · 1~2분 소요` : `${modeLabel} 수집`;
  setMsg(hint, '페이지 0');
  // cutoffStr 은 위 범위 선택 블록에서 이미 계산됨 (이번 달 1일 / 올해 1월 1일 / 최근 N일)
  const tx = [];
  const failedPages = [];

  const fetchPage = async (p, retry = 2) => {
    try {
      const res = await fetch(`/point/earnings/list?page=${p}`, { credentials: 'include' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return parsePage(await res.text());
    } catch (e) {
      if (retry > 0){
        await new Promise(r => setTimeout(r, 600));
        return fetchPage(p, retry - 1);
      }
      console.warn(`[postype-bookmarklet] page ${p} 실패`, e.message);
      failedPages.push(p);
      return [];
    }
  };

  // 특정 월 동기화: 최신→과거로 페이지를 넘기므로 upper(다음 달 1일) 이후 거래는
  // 건너뛰며 계속 진행하고, cutoff(그 달 1일) 이전 거래를 만나면 종료.
  let stop = false;
  for (let s = 1; s <= 1500 && !stop; s += 6){
    const pages = Array.from({ length: 6 }, (_, i) => s + i);
    const results = await Promise.all(pages.map(fetchPage));
    for (const arr of results) for (const r of arr){
      if (r.ts && r.ts < cutoffStr) stop = true;
      else if (r.ts && (!upperStr || r.ts < upperStr)) tx.push(r);
    }
    setMsg('데이터 수집 중…', `~${s + 5}페이지 / ${tx.length}건${failedPages.length ? ` · 실패 ${failedPages.length}p` : ''}`);
  }

  // 실패 페이지 한 번 더 일괄 재시도
  if (failedPages.length){
    setMsg('실패 페이지 재시도 중…', `${failedPages.length}개`);
    const retryList = [...failedPages];
    failedPages.length = 0;
    const retryResults = await Promise.all(retryList.map(p => fetchPage(p, 2)));
    for (const arr of retryResults) for (const r of arr){
      if (r.ts && r.ts >= cutoffStr && (!upperStr || r.ts < upperStr)) tx.push(r);
    }
  }

  setMsg('집계 중…', `총 ${tx.length}건 수집${failedPages.length ? ` · 영구실패 ${failedPages.length}p` : ''}`);

  // ─── 일별 집계 (채널별 분리) ───────────────────────────────────
  const dailyMap = {};  // key: channelId|date
  tx.forEach(t => {
    if (!t.channelId) return;
    const d = t.ts.slice(0, 10);
    const k = `${t.channelId}|${d}`;
    if (!dailyMap[k]){
      dailyMap[k] = {
        channelId: t.channelId,
        date: d,
        rev: 0,
        txCount: 0,
        byType: { sale: 0, membership: 0, support: 0 },
        byHour: Array(24).fill(0),
        bySeries: {},
        byPriceBucket: {},
        newPostIds: []
      };
    }
    const day = dailyMap[k];
    day.rev += t.amount;
    day.txCount++;
    if (day.byType[t.type] !== undefined) day.byType[t.type] += t.amount;
    const h = parseInt(t.ts.slice(11, 13));
    day.byHour[h] += t.amount;
    const sKey = t.type === 'membership' ? '_멤버십_' : (t.series || '_미분류_');
    if (!day.bySeries[sKey]) day.bySeries[sKey] = { rev: 0, cnt: 0 };
    day.bySeries[sKey].rev += t.amount;
    day.bySeries[sKey].cnt++;
    if (t.type === 'sale'){
      const bucket = String(t.amount);
      day.byPriceBucket[bucket] = (day.byPriceBucket[bucket] || 0) + 1;
    }
  });
  const dailyArr = Object.values(dailyMap).map(d => Object.assign(d, { generatedAt: new Date().toISOString() }));

  // ─── 포스트별 집계 + 감쇠 곡선 (revByAge) (채널별 분리) ─────────
  const postMap = {};  // key: channelId|postId
  tx.forEach(t => {
    if (t.type !== 'sale' || !t.postId || !t.channelId) return;
    const k = `${t.channelId}|${t.postId}`;
    if (!postMap[k]){
      postMap[k] = { channelId: t.channelId, postId: t.postId, series: t.series, title: t.title, firstTs: t.ts, items: [] };
    }
    if (t.ts < postMap[k].firstTs) postMap[k].firstTs = t.ts;
    postMap[k].items.push(t);
  });
  const postsArr = Object.values(postMap).map(p => {
    const first = new Date(p.firstTs.replace(' ', 'T') + '+09:00');
    const rev = (d) => p.items.filter(i => (new Date(i.ts.replace(' ', 'T') + '+09:00') - first) / 86400000 <= d).reduce((a, b) => a + b.amount, 0);
    return {
      channelId: p.channelId,
      postId: p.postId,
      series: p.series,
      title: p.title,
      firstTs: p.firstTs,
      totalRev: p.items.reduce((a, b) => a + b.amount, 0),
      txCount: p.items.length,
      revByAge: {
        d1: rev(1),
        d3: rev(3),
        d7: rev(7),
        d14: rev(14),
        d30: rev(30)
      },
      lastUpdated: new Date().toISOString()
    };
  });

  // ─── 시리즈 메타 (채널별 분리) ──────────────────────────────────
  const seriesMap = {};  // key: channelId|name
  tx.forEach(t => {
    if (!t.channelId) return;
    const name = t.type === 'membership' ? '_멤버십_' : (t.series || '_미분류_');
    const k = `${t.channelId}|${name}`;
    if (!seriesMap[k]) seriesMap[k] = { channelId: t.channelId, name, posts: new Set(), totalRev: 0, txCount: 0, firstSeen: t.ts, lastSale: t.ts };
    const s = seriesMap[k];
    s.totalRev += t.amount;
    s.txCount++;
    if (t.postId) s.posts.add(t.postId);
    if (t.ts < s.firstSeen) s.firstSeen = t.ts;
    if (t.ts > s.lastSale) s.lastSale = t.ts;
  });
  const seriesArr = Object.values(seriesMap).map(s => ({
    channelId: s.channelId,
    name: s.name,
    posts: [...s.posts].sort((a, b) => parseInt(a) - parseInt(b)),
    totalRev: s.totalRev,
    txCount: s.txCount,
    firstSeen: s.firstSeen.slice(0, 10),
    lastSale: s.lastSale.slice(0, 10),
    status: 'active'
  }));

  // 채널별 거래 수 카운트 (요약용)
  const channelCounts = {};
  tx.forEach(t => { if (t.channelId) channelCounts[t.channelId] = (channelCounts[t.channelId] || 0) + 1; });
  const channelSummary = Object.entries(channelCounts).map(([id, n]) => `${id} ${n}건`).join(', ');

  // ─── 페이로드 구성 ──────────────────────────────────────────────
  const payload = {
    daily: dailyArr,
    posts: postsArr,
    series: seriesArr,
    meta: {
      rangeDays: DAYS,
      mode: modeLabel,
      fetchedAt: new Date().toISOString(),
      channels: channelCounts
    }
  };

  setMsg('atelier로 전송 준비…', `${channelSummary || '거래 없음'} · 일별 ${dailyArr.length} · 포스트 ${postsArr.length}`);

  // ─── atelier 새 탭 열기 + ready 신호 대기 → postMessage 전송 ────
  const atelierWin = window.open(ATELIER_URL, '_blank');
  if (!atelierWin){
    setMsg('❌ 팝업 차단됨', '브라우저에서 팝업 허용 후 다시 클릭');
    setTimeout(() => panel.remove(), 6000);
    return;
  }

  let done = false;
  const onMsg = (e) => {
    if (!e.origin || !e.origin.includes('nury6942.github.io')) return;
    if (!e.data) return;
    if (e.data.type === 'postype-bridge-ready'){
      atelierWin.postMessage({ type: 'postype-data', payload }, ATELIER_ORIGIN);
      setMsg('데이터 전송 완료', 'atelier 응답 대기 중…');
    }
    if (e.data.type === 'postype-import-done'){
      done = true;
      const r = e.data.result || {};
      const d = r.daily || {};
      const p = r.posts || {};
      const s = r.series || {};
      setMsg('✅ 동기화 완료', `일별 +${d.added||0}/~${d.updated||0} · 포스트 +${p.added||0}/~${p.updated||0} · 시리즈 +${s.added||0}/~${s.updated||0}`);
      setTimeout(() => panel.remove(), 5000);
      window.removeEventListener('message', onMsg);
    }
  };
  window.addEventListener('message', onMsg);

  // 30초 안에 응답 없으면 안내
  setTimeout(() => {
    if (!done){
      setMsg('⏳ atelier 응답 지연', 'atelier 탭이 열렸는지 확인해주세요');
      setTimeout(() => panel.remove(), 8000);
    }
  }, 30000);
})();
