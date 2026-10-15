// AI Brief 소셜 수집기 — 열린 Threads/X 검색·피드 화면에서 게시물을 뽑는다.
// 쓰는 법: Claude in Chrome 의 javascript_tool 로 이 파일 내용을 그대로 실행. 결과는 JSON 문자열.
// 화면을 몇 번 스크롤한 뒤 실행하면 더 많이 잡힌다. 같은 글은 url 로 한 번만.
(function () {
  function num(t) {
    var m = String(t).trim().match(/^([\d.,]+)\s*(천|만|K|M)?$/i);
    if (!m) return null;
    var n = parseFloat(m[1].replace(/,/g, ''));
    var u = (m[2] || '').toLowerCase();
    return Math.round(n * (u === '천' || u === 'k' ? 1e3 : u === '만' ? 1e4 : u === 'm' ? 1e6 : 1));
  }
  var out = [], seen = {};
  var host = location.hostname;

  if (/threads\./.test(host)) {
    document.querySelectorAll('a[href*="/post/"] time').forEach(function (t) {
      var a = t.closest('a'), href = a.getAttribute('href').split('?')[0];
      if (seen[href]) return; seen[href] = 1;
      var box = a;
      for (var i = 0; i < 14 && box; i++) { if (box.getAttribute && box.getAttribute('data-pressable-container')) break; box = box.parentElement; }
      box = box || a.parentElement;
      var lines = box.innerText.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
      var tail = [];
      for (var j = lines.length - 1; j >= 0 && tail.length < 4; j--) { var v = num(lines[j]); if (v === null) break; tail.unshift(v); }
      // Threads 이미지 주소는 서명 토큰이 붙고 며칠 뒤 만료돼서 싣지 않는다 — 있는지만 기록
      var hasMedia = [].slice.call(box.querySelectorAll('img,video')).some(function (x) { return (x.naturalWidth || x.videoWidth || 0) > 200 && !/rsrc\.php/.test(x.src || ''); });
      out.push({
        src: 'threads', url: 'https://www.threads.com' + href, author: '@' + (href.split('/')[1] || '').replace('@', ''),
        at: t.getAttribute('datetime'), likes: tail[0] || 0, replies: tail[1] || 0,
        image: null, media: hasMedia,
        text: lines.join(' ').slice(0, 600)
      });
    });
  } else if (/(^|\.)x\.com$|twitter\.com/.test(host)) {
    document.querySelectorAll('article[data-testid="tweet"]').forEach(function (art) {
      var t = art.querySelector('time'); if (!t) return;
      var a = t.closest('a'), href = a ? a.getAttribute('href') : null;
      if (!href || seen[href]) return; seen[href] = 1;
      var txtEl = art.querySelector('[data-testid="tweetText"]');
      function metric(id) { var el = art.querySelector('[data-testid="' + id + '"]'); return el ? (num(el.innerText) || 0) : 0; }
      var img = art.querySelector('[data-testid="tweetPhoto"] img, video[poster]');
      out.push({
        src: 'x', url: 'https://x.com' + href, author: '@' + href.split('/')[1],
        at: t.getAttribute('datetime'), likes: metric('like'), replies: metric('reply'),
        // pbs.twimg.com 은 쿼리 없이도 열린다 — 토큰·크기 쿼리는 떼고 싣는다
        image: img ? String(img.src || img.getAttribute('poster')).split('?')[0] : null, media: !!img,
        text: (txtEl ? txtEl.innerText : art.innerText).replace(/\s+/g, ' ').slice(0, 600)
      });
    });
  }
  return JSON.stringify(out);
})();
