// AI Brief — 고른 글의 원문을 끝까지 읽는다(Aside 브라우저, 아이맥).
// 쓰는 법:  aside repl "const URL='https://www.threads.com/@id/post/…'; $(cat scripts/ai-brief/aside-read.js)"
// Threads: 본문 + 같은 작성자의 이어지는 칸(1/11 같은 연재)까지. X: 긴 글(note)·같은 작성자 스레드까지.
// 결과: 마지막 줄 "AIBRIEF_TEXT " + JSON {url, author, parts:[…]}  (읽기만, 누르기 없음)
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const page = await openTab(URL);
await sleep(6500);
await page.evaluate(() => window.scrollBy(0, 1800));
await sleep(2000);
const res = await page.evaluate(() => {
  if (/threads\./.test(location.hostname)) {
    const author = (location.pathname.split('/')[1] || '').replace('@', '');
    const boxes = [...document.querySelectorAll('[data-pressable-container]')];
    const parts = [];
    for (const b of boxes.slice(0, 14)) {
      const t = b.innerText.trim();
      if (!t.startsWith(author)) { if (parts.length) break; else continue; }   // 다른 사람 댓글이 나오면 끝
      parts.push(t.replace(/\n+/g, ' / ').slice(0, 1200));
    }
    return { url: location.href, author: '@' + author, parts };
  }
  const arts = [...document.querySelectorAll('article[data-testid="tweet"]')];
  const author = (location.pathname.split('/')[1] || '');
  const parts = [];
  for (const a of arts.slice(0, 10)) {
    const name = (a.querySelector('[data-testid="User-Name"]') || {}).innerText || '';
    if (!name.includes('@' + author)) { if (parts.length) break; else continue; }
    const te = a.querySelector('[data-testid="tweetText"]');
    if (te) parts.push(te.innerText.replace(/\s+/g, ' ').slice(0, 2000));
  }
  return { url: location.href, author: '@' + author, parts };
});
await page.close();
console.log('AIBRIEF_TEXT ' + JSON.stringify(res));
