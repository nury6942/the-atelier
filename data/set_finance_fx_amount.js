// ═══════════════════════════════════════════════════════════════
// ATELIER: 여행 예산 — 아직 결제 안 한 항목에 '외화 원가' 심기
// ───────────────────────────────────────────────────────────────
// 배경: 예약은 유로(€)로 잡혀 있는데 장부엔 그때 환율로 계산한 원화가
//       고정돼 있었다. 환율은 매일 바뀌므로, 아직 결제 전인 항목은
//       '오늘 환율'로 다시 계산돼야 실제 나갈 돈에 가깝다.
//
// v2 (2026-08-04): 설명글의 € 기호만 보던 1차 버전이 대부분을 놓쳤다.
//   숙소는 유로 금액이 예약 확인서 필드에 들어있다:
//     · journey.payment_method  예) "EUR 246.40 현지 결제"
//     · journey.onsite_fee      예) "도시세 EUR 21.93"   (도시세 행 전용)
//   → finance 행 ↔ journey 를 journey_id 로 이어서 거기서도 유로를 찾는다.
//
// 심고 나면 앱이 '예정' 상태인 동안 매일 환율로 자동 환산해서
// 금액·잔액·합계를 보여준다. '결제 완료'로 바꾸면 그 시점 금액으로 고정.
//
// 사용: Travel 페이지 → F12 → Console → 붙여넣기 → Enter
// ═══════════════════════════════════════════════════════════════

(async function setFinanceFxAmountV2() {
  const DRY = true;   // ★ 실제 반영하려면 false 로 바꾸고 다시 실행

  if (typeof fbRead !== 'function' || typeof fbUpdate !== 'function') {
    alert('❌ Travel 페이지에서 실행해주세요'); return;
  }

  // 오늘 환율 (앱과 같은 소스)
  let rate = 0;
  for (const u of ['https://api.frankfurter.dev/v1/latest?base=EUR&symbols=KRW',
                   'https://open.er-api.com/v6/latest/EUR']) {
    try {
      const d = await (await fetch(u)).json();
      if (d && d.rates && d.rates.KRW > 0) { rate = d.rates.KRW; break; }
    } catch (e) {}
  }
  if (!rate) { alert('❌ 환율을 못 받아왔어요'); return; }
  console.log('%c오늘 환율: €1 = ₩' + Math.round(rate).toLocaleString('ko-KR'),
    'font-weight:bold;color:#6b38d4');

  const today = new Date().toISOString().split('T')[0];
  const finance = await fbRead('finance');
  const journey = await fbRead('journey');
  const jById = {};
  journey.forEach(j => { jById[j._id] = j; });

  // "EUR 246.40" / "€529.65" / "246,40 EUR" 형태에서 숫자 뽑기
  const grabEur = (s) => {
    const t = String(s || '');
    let m = t.match(/(?:€|EUR)\s*([\d.,]+)/i) || t.match(/([\d.,]+)\s*(?:€|EUR)/i);
    if (!m) return 0;
    const v = parseFloat(m[1].replace(/,/g, ''));
    return v > 0 ? v : 0;
  };

  const targets = [];
  finance.forEach(r => {
    if (r.fx_amount) return;                       // 이미 심어짐
    const j = r.journey_id ? jById[r.journey_id] : null;
    let eur = 0, src = '';

    if (r.kind === 'onsite') {
      // 도시세 행 — 현장 요금 필드에서만 찾는다 (숙소 본체 금액과 섞이면 안 됨)
      eur = grabEur(j && j.onsite_fee);
      if (eur) src = 'onsite_fee';
    } else {
      eur = grabEur(r.description);
      if (eur) src = '설명글';
      if (!eur && j) { eur = grabEur(j.payment_method); if (eur) src = 'payment_method'; }
    }
    if (!eur) return;

    const krwNow = parseFloat(r.amount) || 0;
    const paidKey = r.paid_date || r.date || '';
    const pending = r.unpaid === true || (paidKey && paidKey > today);
    targets.push({ r, eur, src, krwNow, newKrw: Math.round(eur * rate), pending });
  });

  if (!targets.length) {
    console.log('%c유로 금액을 찾은 행이 없어요 (이미 처리됐거나 해당 없음)', 'color:#888');
    return;
  }

  console.log('%c══ 외화 원가 심기 v2 ' + (DRY ? '(DRY RUN — 미반영)' : '(실제 반영)') + ' ══',
    'font-weight:bold;font-size:13px;color:#6b38d4');
  console.table(targets.map(t => ({
    '항목': String(t.r.description || '').slice(0, 42),
    '결제 전?': t.pending ? '예정 ✅' : '결제완료(고정)',
    '출처': t.src,
    '€ 원가': '€' + t.eur.toLocaleString('ko-KR'),
    '지금 원화': '₩' + t.krwNow.toLocaleString('ko-KR'),
    '오늘 환율로': '₩' + t.newKrw.toLocaleString('ko-KR'),
    '차이': (t.newKrw - t.krwNow >= 0 ? '+' : '') + (t.newKrw - t.krwNow).toLocaleString('ko-KR')
  })));
  const pend = targets.filter(t => t.pending);
  const diff = pend.reduce((s, t) => s + (t.newKrw - t.krwNow), 0);
  console.log('%c예정 ' + pend.length + '건 합계 변화: ' + (diff >= 0 ? '+' : '') + '₩' + diff.toLocaleString('ko-KR'),
    'font-weight:bold;color:' + (diff >= 0 ? '#e11d48' : '#0a7'));

  if (DRY) {
    console.log('%c확인됐으면 맨 위 DRY = false 로 바꿔 다시 실행하세요.', 'color:#c60;font-weight:bold');
    return;
  }

  let ok = 0;
  for (const t of targets) {
    try {
      await fbUpdate('finance', t.r._id, { fx_amount: String(t.eur), fx_currency: 'EUR' });
      ok++;
      console.log('✅ ' + String(t.r.description || '').slice(0, 40) + ' → €' + t.eur + ' (' + t.src + ')');
    } catch (e) { console.error('❌ 실패:', t.r.description, e); }
  }
  console.log('%c완료 — ' + ok + '건. 페이지를 새로고침하면 오늘 환율로 계산돼요.',
    'font-weight:bold;color:#6b38d4');
})();
