/* ───────────────────────────────────────────────────────────────────
   postype-bookmarklet.js — 포스타입 수익 데이터 수집 → atelier 전송
   - 사용자가 포스타입 수익 페이지에서 북마크릿 클릭하면 실행
   - 데이터 fetch + 일별/포스트/시리즈 집계 후 atelier 새 탭에 postMessage 전송
   - atelier 쪽 핸들러: js/app-6-postype-analytics.js의 setupPostypeBridge()
   ─────────────────────────────────────────────────────────────────── */
(async () => {
  // ─── 설정 ───────────────────────────────────────────────────────
  const CHANNEL_ID = 'bichu-attic';
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

  // ─── 일수 선택 (Enter = 28일, "ytd" = 올해 전체, 숫자 = 그 일수) ─
  const input = prompt(
    '동기화 모드?\n\n· 일상 동기화: 그냥 Enter (28일)\n· 올해 1월부터 전체 (첫 백필): ytd\n· 특정 일수: 숫자 입력 (예: 90)',
    '28'
  );
  if (input === null) return;  // 사용자가 취소

  let DAYS;
  const trimmed = (input || '').trim().toLowerCase();
  if (trimmed === 'ytd' || trimmed === '올해' || trimmed === 'y'){
    const yearStart = new Date(new Date().getFullYear(), 0, 1);
    DAYS = Math.ceil((Date.now() - yearStart.getTime()) / 86400000) + 1;
  } else {
    DAYS = Math.max(1, Math.min(400, parseInt(trimmed) || 28));
  }

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
      return { type, amount: a ? parseInt(a[1].replace(/,/g, '')) : 0, ts, postId, series, title, href };
    });
  };

  // ─── 데이터 수집 ───────────────────────────────────────────────
  const hint = DAYS >= 60 ? `${DAYS}일 백필 · 1~2분 소요` : `${DAYS}일치 수집`;
  setMsg(hint, '페이지 0');
  const today = new Date();
  const cutoffStr = new Date(today.getTime() - DAYS * 86400000).toISOString().slice(0, 10) + ' 00:00:00';
  const tx = [];
  let stop = false;
  for (let s = 1; s <= 800 && !stop; s += 6){
    const pages = Array.from({ length: 6 }, (_, i) => s + i);
    const out = await Promise.all(pages.map(p => fetch(`/point/earnings/list?page=${p}`, { credentials: 'include' }).then(r => r.text()).then(parsePage)));
    for (const arr of out) for (const r of arr){
      if (r.ts && r.ts < cutoffStr) stop = true;
      else if (r.ts) tx.push(r);
    }
    setMsg('데이터 수집 중…', `~${s + 5}페이지 / ${tx.length}건`);
  }
  setMsg('집계 중…', `총 ${tx.length}건 수집 완료`);

  // ─── 일별 집계 ─────────────────────────────────────────────────
  const dailyMap = {};
  tx.forEach(t => {
    const d = t.ts.slice(0, 10);
    if (!dailyMap[d]){
      dailyMap[d] = {
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
    const day = dailyMap[d];
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

  // ─── 포스트별 집계 + 감쇠 곡선 (revByAge) ───────────────────────
  const postMap = {};
  tx.forEach(t => {
    if (t.type !== 'sale' || !t.postId) return;
    if (!postMap[t.postId]){
      postMap[t.postId] = { postId: t.postId, series: t.series, title: t.title, firstTs: t.ts, items: [] };
    }
    if (t.ts < postMap[t.postId].firstTs) postMap[t.postId].firstTs = t.ts;
    postMap[t.postId].items.push(t);
  });
  const postsArr = Object.values(postMap).map(p => {
    const first = new Date(p.firstTs.replace(' ', 'T') + '+09:00');
    const rev = (d) => p.items.filter(i => (new Date(i.ts.replace(' ', 'T') + '+09:00') - first) / 86400000 <= d).reduce((a, b) => a + b.amount, 0);
    return {
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

  // ─── 시리즈 메타 ────────────────────────────────────────────────
  const seriesMap = {};
  tx.forEach(t => {
    const k = t.type === 'membership' ? '_멤버십_' : (t.series || '_미분류_');
    if (!seriesMap[k]) seriesMap[k] = { name: k, posts: new Set(), totalRev: 0, txCount: 0, firstSeen: t.ts, lastSale: t.ts };
    const s = seriesMap[k];
    s.totalRev += t.amount;
    s.txCount++;
    if (t.postId) s.posts.add(t.postId);
    if (t.ts < s.firstSeen) s.firstSeen = t.ts;
    if (t.ts > s.lastSale) s.lastSale = t.ts;
  });
  const seriesArr = Object.values(seriesMap).map(s => ({
    name: s.name,
    posts: [...s.posts].sort((a, b) => parseInt(a) - parseInt(b)),
    totalRev: s.totalRev,
    txCount: s.txCount,
    firstSeen: s.firstSeen.slice(0, 10),
    lastSale: s.lastSale.slice(0, 10),
    status: 'active'
  }));

  // ─── 페이로드 구성 ──────────────────────────────────────────────
  const payload = {
    daily: dailyArr,
    posts: postsArr,
    series: seriesArr,
    meta: {
      rangeDays: DAYS,
      fetchedAt: new Date().toISOString(),
      channelId: CHANNEL_ID
    }
  };

  setMsg('atelier로 전송 준비…', `일별 ${dailyArr.length} · 포스트 ${postsArr.length} · 시리즈 ${seriesArr.length}`);

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
