// ICE 카드 — 환승·플랫폼 전 구간 타임라인 데이터
window.atelierICE3 = (function () {
  const db = window.db;
  const BK = 'atelier_ice3_backup';
  const ID = '3UJ9oefcwtAAoFrCFHum';

  const LEGS = [
    { train: 'ICE 599', dur: '2h 55m', seat: '2호차 68번 · 창가 · 조용한 칸',
      from: { t: '12:49', stn: 'Leipzig Hbf', pl: 'Gl. 11' },
      to:   { t: '15:44', stn: 'Frankfurt(Main)Hbf', pl: 'Gl. 7' } },
    { wait: '24분', note: '같은 플랫폼 — 내린 자리에서 그대로 기다리면 돼' },
    { train: 'ICE 626', dur: '11m',
      from: { t: '16:08', stn: 'Frankfurt(Main)Hbf', pl: 'Gl. 7' },
      to:   { t: '16:19', stn: '프랑크푸르트 공항역', pl: 'Fern 7' } }
  ];

  const P = { legs: JSON.stringify(LEGS) };

  async function preview() {
    const d = await db.collection('journey').doc(ID).get();
    if (!d.exists) return console.error('❌ 문서 없음');
    console.log('%c[구간 타임라인] 이렇게 그려져', 'font-weight:bold;font-size:14px');
    LEGS.forEach(L => {
      if (L.wait) return console.log('        ┆ 환승 대기 ' + L.wait + ' · ' + (L.note || ''));
      console.log('  ' + L.from.t + '  ' + L.from.stn.padEnd(24) + (L.from.pl || ''));
      console.log('        │ ' + L.train + ' · ' + L.dur + (L.seat ? ' · 💺 ' + L.seat : ''));
      console.log('  ' + L.to.t + '  ' + L.to.stn.padEnd(24) + (L.to.pl || ''));
    });
    console.log('%c\n진행하려면 → atelierICE3.apply()', 'color:#2563eb;font-weight:bold');
  }

  async function apply() {
    const d = await db.collection('journey').doc(ID).get();
    if (!d.exists) return console.error('❌ 문서 없음');
    const o = d.data();
    try { localStorage.setItem(BK, JSON.stringify({ legs: o.legs === undefined ? null : o.legs })); } catch (e) {}
    await db.collection('journey').doc(ID).update(P);
    console.log('%c✅ 완료 — 강력 새로고침(⌘⇧R). 앱 v336 이상이어야 보여', 'color:#16a34a;font-weight:bold;font-size:14px');
  }

  async function undo() {
    const bk = JSON.parse(localStorage.getItem(BK) || 'null');
    if (!bk) return console.error('백업이 없어.');
    await db.collection('journey').doc(ID).update({ legs: bk.legs === null ? '' : bk.legs });
    console.log('%c↩️ 되돌림 완료', 'color:#f59e0b;font-weight:bold');
  }

  console.log('%c준비됨 → atelierICE3.preview()', 'color:#2563eb;font-weight:bold;font-size:14px');
  return { preview, apply, undo };
})();
