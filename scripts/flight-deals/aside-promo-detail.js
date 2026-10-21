// 공홈 프로모션 상세 — 이벤트 상세 페이지 글을 통째로 읽는다 (Aside, 읽기만. 대한항공은 목록에서 카드를 눌러 들어감)
// 쓰는 법: aside repl "const TODO=[{key,code,title,link}]; $(cat scripts/flight-deals/aside-promo-detail.js)"
// 결과: "FLIGHT_PROMO_DETAIL " + JSON {key, url, text}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
for (const t of TODO) {
  let res = { key: t.key, ok: false };
  try {
    // 에어프레미아 목록은 상세 주소가 안 보여서 첫 화면 배너에서 상세 주소를 찾는다
    let link = t.link;
    if (t.code === 'YP' && /promotionList/.test(link)) {
      const home = await openTab('https://www.airpremia.com/'); await sleep(7000);
      const href = await home.evaluate((title) => { const a = [...document.querySelectorAll('a')].find((x) => /promotionDetail/.test(x.href) && x.innerText.replace(/\s+/g, ' ').includes(title.slice(0, 10))); return a ? a.href : null; }, t.title);
      await home.close(); if (href) link = href;
    }
    const page = await openTab(link);
    await sleep(8000);
    if (t.code === 'TW') {   // 트리니티: 카드가 showEventContent(this) 로 열린다
      const ok = await page.evaluate((title) => { const a = [...document.querySelectorAll('a[data-eventtitle]')].find((x) => x.dataset.eventtitle === title); if (!a) return false; a.click(); return true; }, t.title);
      if (ok) await sleep(7000);
    }
    if (t.code === 'KE' && /\/promotion\/list\/?$/.test(link)) {   // 목록 주소면 카드를 눌러 상세로
      const clicked = await page.evaluate((title) => {
        const el = [...document.querySelectorAll('*')].find((e) => e.children.length < 6 && (e.innerText || '').includes(title) && e.innerText.length < 220);
        if (!el) return false; (el.closest('a,button,li,[role=link]') || el).click(); return true;
      }, t.title);
      if (clicked) await sleep(7000);
    }
    res = await page.evaluate((a) => {
      const txt = document.body.innerText.replace(/\n+/g, '\n');
      // 머리 메뉴는 건너뛰고 제목부터
      let i = txt.indexOf(a.title.slice(0, 10)); if (i < 0) i = 0;
      return { key: a.key, ok: true, url: location.href, text: txt.slice(i, i + 9000) };
    }, { key: t.key, title: t.title });
    await page.close();
  } catch (e) { res.error = String(e).slice(0, 200); }
  console.log('FLIGHT_PROMO_DETAIL ' + JSON.stringify(res));
}
