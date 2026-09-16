// 돌로미티 리프트·유료도로 3건을 예산에 추가
//   지금까지 finance 카테고리가 숙소·교통·항공·렌트 넷뿐이라 관광 비용이 통째로 빠져 있었다.
//   · 트레치메 유료도로 €40  — 결제 완료 (2026-09-16, iPASS 예약코드 P26237797)
//   · 세체다 케이블카 €70.50 — 결제 예정
//   · 알페 디 시우시 곤돌라 €30 — 결제 예정
//
// ★ 결제 완료 행에는 fx_amount 를 심지 않는다.
//   이미 낸 돈은 그때 낸 원화가 진실이고, 유로를 심어두면 나중에 '미결제'로 토글하는 순간
//   과거 기록이 오늘 환율로 되살아난다. (8/3 기능, 9/8 사고 참조)
//   예정 2건에만 심어서 앱이 오늘 환율로 환산하게 둔다.
//
// 사용: Travel 페이지 "2026 독일&이탈리아" 활성 → F12 → Console → 붙여넣기 → Enter
//       크롬이 막으면 콘솔에 allow pasting 타이핑 + Enter (처음 한 번만)
window.atelierLifts = (function () {
  const TRIPNAME = '2026 독일&이탈리아';
  const db = window.db;
  const BK = 'atelier_lifts_backup';

  const base = { trip: TRIPNAME, currency: 'KRW', krw_amount: '' };

  // eur: 유로 원가 / paid: 결제일 (빈 문자열이면 '결제 예정')
  const ROWS = [
    { category: '티켓', date: '2026-09-30', eur: 40, paid_date: '2026-09-16',
      journey_id: 'FDVbBatkkISYFZf270Gu',
      description: '트레치메 유료도로 €40 · 차 1대 (iPASS P26237797 · 9/30 10:00~21:59)' },
    { category: '티켓', date: '2026-09-28', eur: 70.5, paid_date: '',
      journey_id: 'BXG58jsikQ6IHlTtsmci',
      description: '세체다 케이블카 왕복 €70.50 · 오르티세이-푸르네스-세체다 (미구매 — 날씨 보고)' },
    { category: '티켓', date: '2026-09-29', eur: 30, paid_date: '',
      journey_id: '1vxI5rU9PYBAZ72DzuAb',
      description: '알페 디 시우시 곤돌라 왕복 €30 · 시우시-콤파치 (현장 구매)' }
  ];

  async function rate() {
    for (const u of ['https://api.frankfurter.dev/v1/latest?base=EUR&symbols=KRW',
                     'https://open.er-api.com/v6/latest/EUR']) {
      try {
        const d = await (await fetch(u)).json();
        if (d && d.rates && d.rates.KRW > 0) return d.rates.KRW;
      } catch (e) {}
    }
    return 0;
  }

  // 같은 설명글이 이미 있으면 중복 추가를 막는다
  async function existing() {
    const s = await db.collection('finance').where('trip', '==', TRIPNAME).get();
    const hit = [];
    s.forEach(d => {
      const t = String(d.data().description || '');
      if (t.includes('트레치메') || t.includes('세체다') || t.includes('알페 디 시우시')) hit.push({ id: d.id, t });
    });
    return hit;
  }

  async function preview() {
    console.log('%c[돌로미티 리프트 예산 추가] 미리보기', 'font-weight:bold;font-size:14px');
    const r = await rate();
    if (!r) return console.error('❌ 환율을 못 받아왔어. 잠시 후 다시.');
    console.log('오늘 환율: €1 = ₩' + Math.round(r).toLocaleString('ko-KR'));

    const dup = await existing();
    if (dup.length) {
      console.warn('⚠️ 비슷한 행이 이미 ' + dup.length + '건 있어 — 중복 주의');
      dup.forEach(x => console.warn('   · ' + x.t.slice(0, 60)));
    }

    let sum = 0;
    console.table(ROWS.map(x => {
      const krw = Math.round(x.eur * r); sum += krw;
      return {
        날짜: x.date, 카테고리: x.category,
        항목: x.description.split(' · ')[0],
        '€': x.eur,
        '₩': krw.toLocaleString('ko-KR'),
        상태: x.paid_date ? '결제 완료 ' + x.paid_date : '결제 예정',
        '유로 심기': x.paid_date ? '— (완료 행이라 안 심음)' : 'fx_amount ✅'
      };
    }));
    console.log('합계 €' + ROWS.reduce((a, x) => a + x.eur, 0) + ' = 약 ₩' + sum.toLocaleString('ko-KR'));
    console.log('%c\n진행하려면 → atelierLifts.apply()', 'color:#2563eb;font-weight:bold');
  }

  async function apply() {
    const r = await rate();
    if (!r) return console.error('❌ 환율을 못 받아왔어. 중단.');

    const bk = { added: [] };
    const b = db.batch();
    ROWS.forEach(x => {
      const doc = Object.assign({}, base, {
        category: x.category, date: x.date, paid_date: x.paid_date,
        amount: String(Math.round(x.eur * r)),
        description: x.description, journey_id: x.journey_id
      });
      // 예정 행에만 유로 원가를 심는다 — 완료 행은 그때 낸 원화가 진실
      if (!x.paid_date) { doc.fx_amount = String(x.eur); doc.fx_currency = 'EUR'; }
      const ref = db.collection('finance').doc();
      bk.added.push(ref.id);
      b.set(ref, doc);
    });
    await b.commit();

    try { localStorage.setItem(BK, JSON.stringify(bk)); console.log('백업 저장 완료'); }
    catch (e) { console.warn('백업 저장 실패:', e.message, '— 되돌리기는 못 써'); }

    console.log('%c✅ 완료 — 새로고침해줘', 'color:#16a34a;font-weight:bold;font-size:14px');
    console.log('   트레치메 €40 결제 완료 · 세체다 €70.50 / 알페 €30 결제 예정');
    console.log('%c   ⚠️ 트레치메 원화는 오늘 환율 환산값이야. 카드 명세 나오면 실제 청구액으로 고쳐줘', 'color:#f59e0b;font-weight:bold');
    console.log('   ※ 세체다 날짜는 9/28로 넣어뒀어. 9/29로 가면 예산 행 날짜도 같이 바꿔줘');
    console.log('   ※ 주유(€170~180)·톨(€80~100)은 아직 안 넣었어 — 실제 쓸 때 넣는 게 정확해');
  }

  async function undo() {
    const bk = JSON.parse(localStorage.getItem(BK) || 'null');
    if (!bk || !bk.added || !bk.added.length) return console.error('백업이 없어.');
    const b = db.batch();
    bk.added.forEach(id => b.delete(db.collection('finance').doc(id)));
    await b.commit();
    localStorage.removeItem(BK);
    console.log('%c↩️ 되돌림 완료 (' + bk.added.length + '건 삭제) — 새로고침해줘', 'color:#f59e0b;font-weight:bold');
  }

  console.log('%c준비됨 → atelierLifts.preview()', 'color:#2563eb;font-weight:bold;font-size:14px');
  return { preview, apply, undo };
})();
