// ═══════════════════════════════════════════════════════════════
// ATELIER: 숙소 장부 — 선결제 / 도시세(현장 결제) 분리
// ───────────────────────────────────────────────────────────────
// 문제:
//   숙소 1건이 장부에 1행으로만 들어가 있고, 설명에만
//   "… — 선결제 ₩496,154 + 도시세 EUR21.93" 처럼 적혀 있었다.
//   앱은 그 합계 전체를 '이미 나간 돈'으로 계산해서,
//   아직 안 낸 도시세까지 '현재 잔액'에서 빠져 있었다.
//
// 이 스크립트가 하는 일:
//   1) 설명에 '선결제 ₩…'가 있는 숙소 행을 찾는다
//   2) 도시세 = (행 금액) − (선결제 금액)  ← 통화(EUR 등) 상관없이 정확
//   3) 원래 행 → 선결제만 남김 (금액 축소, kind='prepaid')
//   4) 도시세 행 신규 생성 → 체크인 날짜 + unpaid:true (kind='onsite')
//      → '현재 잔액'에서 빠지지 않고, 체크인 날 나갈 예정 지출로 잡힘
//
// 안전장치: 기본은 DRY RUN (아무것도 안 바꾸고 표만 보여줌).
//          결과 확인 후 아래 DRY 를 false 로 바꿔서 다시 실행.
//
// 사용: Travel 페이지 → F12 → Console → 붙여넣기 → Enter
// ═══════════════════════════════════════════════════════════════

(async function splitStayCityTax() {
  const DRY = true;   // ★ 실제 반영하려면 false 로 바꾸고 다시 실행

  if (typeof fbRead !== 'function' || typeof fbUpdate !== 'function' || typeof fbAdd !== 'function') {
    alert('❌ Travel 페이지에서 실행해주세요'); return;
  }

  const YEAR_FALLBACK = 2026;   // 설명에서 MM/DD만 뽑을 때 쓸 연도

  const finance = await fbRead('finance');
  const journey = await fbRead('journey');
  const jById = {};
  journey.forEach(j => { jById[j._id] = j; });

  const num = s => parseFloat(String(s || '').replace(/[^0-9.]/g, '')) || 0;

  const targets = [];
  finance.forEach(row => {
    const desc = String(row.description || '');
    if (row.kind === 'onsite' || row.kind === 'prepaid') return;      // 이미 분리됨
    const m = desc.match(/선결제\s*[₩\\]?\s*([\d,]+)/);
    if (!m) return;
    const prepaid = num(m[1]);
    const total = num(row.amount);
    const tax = Math.round((total - prepaid) * 100) / 100;
    if (!(prepaid > 0) || !(tax > 0)) return;                          // 도시세가 없거나 계산 이상

    // 체크인 날짜: journey 연결이 있으면 그걸 신뢰, 없으면 설명의 (MM/DD~ 파싱
    let checkin = '';
    const j = row.journey_id ? jById[row.journey_id] : null;
    if (j && j.date) checkin = j.date;
    if (!checkin) {
      const dm = desc.match(/\((\d{2})\/(\d{2})/);
      if (dm) checkin = YEAR_FALLBACK + '-' + dm[1] + '-' + dm[2];
    }
    if (!checkin) checkin = row.date || '';

    const base = desc.split(/\s*[—–]\s*/)[0].trim();                   // ' — 선결제 …' 앞부분
    targets.push({ row, j, base, prepaid, tax, total, checkin });
  });

  if (!targets.length) {
    console.log('%c분리할 숙소 행이 없어요 (이미 분리됐거나 설명에 "선결제 ₩…"가 없음)', 'color:#888');
    return;
  }

  console.log('%c══ 숙소 선결제 / 도시세 분리 ' + (DRY ? '(DRY RUN — 미반영)' : '(실제 반영)') + ' ══',
    'font-weight:bold;font-size:13px;color:#6b38d4');
  console.table(targets.map(t => ({
    '숙소': t.base,
    '기존 합계': t.total.toLocaleString('ko-KR'),
    '→ 선결제': t.prepaid.toLocaleString('ko-KR'),
    '→ 도시세': t.tax.toLocaleString('ko-KR'),
    '도시세 결제일(체크인)': t.checkin,
    'journey 연결': t.j ? '있음' : '없음'
  })));
  const taxSum = targets.reduce((s, t) => s + t.tax, 0);
  console.log('%c현재 잔액에서 다시 살아나는 금액(아직 안 낸 도시세 합): ₩' + taxSum.toLocaleString('ko-KR'),
    'font-weight:bold;color:#0a7');

  if (DRY) {
    console.log('%c확인됐으면 스크립트 맨 위 DRY = false 로 바꿔서 다시 실행하세요.', 'color:#c60;font-weight:bold');
    return;
  }

  let ok = 0, fail = 0;
  for (const t of targets) {
    try {
      // 1) 원래 행 → 선결제만
      await fbUpdate('finance', t.row._id, {
        description: t.base + ' — 선결제',
        amount: String(t.prepaid),
        kind: 'prepaid'
      });

      // 2) 도시세 행 신규 (체크인 날 · 아직 안 낸 돈)
      const taxObj = {
        date: t.checkin,
        description: t.base + ' — 도시세·현장 결제',
        trip: t.row.trip || '',
        category: t.row.category || '숙소',
        amount: String(t.tax),
        currency: 'KRW',
        paid_date: t.checkin,
        unpaid: true,
        kind: 'onsite'
      };
      if (t.row.journey_id) taxObj.journey_id = t.row.journey_id;
      const saved = await fbAdd('finance', taxObj);

      // 3) journey 에 도시세 정보 역연결 (이후 앱에서 자동 동기화되도록)
      if (t.j) {
        await fbUpdate('journey', t.j._id, {
          onsite_amount: String(t.tax),
          finance_onsite_id: saved._id
        });
      }
      ok++;
      console.log('✅ ' + t.base + ' → 선결제 ₩' + t.prepaid.toLocaleString('ko-KR') +
        ' / 도시세 ₩' + t.tax.toLocaleString('ko-KR') + ' (' + t.checkin + ')');
    } catch (e) {
      fail++;
      console.error('❌ 실패: ' + t.base, e);
    }
  }

  console.log('%c완료 — 성공 ' + ok + '건, 실패 ' + fail + '건. 페이지를 새로고침하세요.',
    'font-weight:bold;color:#6b38d4');
})();
