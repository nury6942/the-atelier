// ══════════════════════════════════════════════════════════════════════
// 한국 커뮤니티 인기글 — 원본 사이트에서 직접 목록 1페이지만 읽기
//   사이트마다 화면 구조가 달라서 SITES[키].parse 를 하나씩 둠.
//   어느 사이트가 화면을 바꾸면 그 사이트의 parse 만 고치면 됨.
//   본문은 읽지 않음(제목·주소·조회·댓글·추천·시간만).
//   더쿠(보안 검사 화면)·82쿡(접속 차단)은 클라우드 서버에서 막혀 뺌, 루리웹·클리앙은 누리 요청으로 뺌.
// ══════════════════════════════════════════════════════════════════════
const cheerio = require("cheerio");

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36";
const UA_MOBILE = "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1";

const toNum = (s) => {
  const n = parseInt(String(s || "").replace(/[^0-9]/g, ""), 10);
  return Number.isFinite(n) ? n : null;
};
const clean = (s) => String(s || "").replace(/\s+/g, " ").trim();

// 한국 시간 기준 날짜 문자열 → ISO. "2026-10-18 17:16:55" / "17:16" / "10.17" / "2026.10.17"
function kstToIso(raw, now = new Date()) {
  const s = clean(raw);
  let m = s.match(/^(\d{4})[-.](\d{1,2})[-.](\d{1,2})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/);
  if (m) {
    const [, y, mo, d, h = "0", mi = "0", se = "0"] = m;
    return new Date(Date.UTC(+y, +mo - 1, +d, +h - 9, +mi, +se)).toISOString();
  }
  const kstNow = new Date(now.getTime() + 9 * 3600 * 1000);
  m = s.match(/^(\d{1,2}):(\d{2})$/);
  if (m) {
    let t = Date.UTC(kstNow.getUTCFullYear(), kstNow.getUTCMonth(), kstNow.getUTCDate(), +m[1] - 9, +m[2]);
    if (t > now.getTime() + 5 * 60 * 1000) t -= 24 * 3600 * 1000; // 아직 안 온 시각이면 어제 글
    return new Date(t).toISOString();
  }
  m = s.match(/^(\d{1,2})[.\-/](\d{1,2})\.?$/);
  if (m) {
    let y = kstNow.getUTCFullYear();
    if (+m[1] > kstNow.getUTCMonth() + 1) y -= 1;
    return new Date(Date.UTC(y, +m[1] - 1, +m[2], -9)).toISOString();
  }
  return null;
}

const SITES = {
  instiz: {
    name: "인티",
    url: "https://www.instiz.net/pt",
    parse($) {
      const out = [];
      $("td.listsubject").each((_, td) => {
        const $td = $(td);
        const a = $td.find("a").first();
        const id = (a.attr("href") || "").match(/\/pt\/(\d+)/);
        if (!id) return;
        if (out.some((p) => p.id === id[1])) return; // 인기 칸과 전체 목록에 같은 글이 겹침
        const $tr = $td.closest("tr");
        const cmt = a.find(".cmt2, .cmt3").first();
        const comments = toNum(cmt.text());
        cmt.remove();
        const item = {
          id: id[1],
          url: "https://www.instiz.net/pt/" + id[1],
          category: clean($tr.find(".list_category").text()) || null,
          comments,
        };
        const sub = a.find(".list_subtitle .regdate");
        if (sub.length) {
          // 전체 목록 형식: 제목 아래 "16:33 l 조회 4816 l 추천 2"
          const t = clean(sub.text());
          item.postedAt = kstToIso((t.match(/^[\d:.]+/) || [""])[0]);
          item.views = toNum((t.match(/조회\s*([\d,]+)/) || [])[1]);
          item.upvotes = toNum((t.match(/추천\s*([\d,]+)/) || [])[1]);
          item.title = clean(a.find(".sbj").text());
        } else {
          // 인기 칸 형식: 같은 줄에 시간 · 조회 · 추천 칸
          const cells = $td.nextAll("td.listno");
          item.postedAt = kstToIso($(cells[0]).text());
          item.views = toNum($(cells[1]).text());
          item.upvotes = toNum($(cells[2]).text());
          item.title = clean(a.text());
        }
        out.push(item);
      });
      return out;
    },
  },

  // PC 페이지는 클라우드 서버에서 빈 화면이 와서 모바일 페이지를 읽음
  dcbest: {
    name: "디시",
    url: "https://m.dcinside.com/board/dcbest",
    mobile: true,
    parse($) {
      const out = [];
      $("ul.gall-detail-lst li .gall-detail-lnktb").each((_, box) => {
        const $b = $(box);
        const a = $b.find("a.lt").first();
        const id = (a.attr("href") || "").match(/dcbest\/(\d+)/);
        if (!id) return;
        const subj = a.find(".subjectin").first();
        const gall = clean(subj.find("b").first().text()).replace(/[[\]]/g, "") || null;
        subj.find("b").first().remove();
        const info = a.find("ul.ginfo li").map((__, li) => clean($(li).text())).get();
        const time = info.find((t) => /^\d{1,2}[:.]\d{2}$|^\d{2,4}\.\d{1,2}\.\d{1,2}$/.test(t));
        out.push({
          id: id[1],
          title: clean(subj.text()),
          url: "https://gall.dcinside.com/board/view/?id=dcbest&no=" + id[1],
          category: gall,
          comments: toNum($b.find("a.rt .ct").text()),
          views: toNum((info.find((t) => t.startsWith("조회")) || "")),
          upvotes: toNum((info.find((t) => t.startsWith("추천")) || "")),
          postedAt: kstToIso(time),
        });
      });
      return out;
    },
  },
};

async function fetchSite(key) {
  const site = SITES[key];
  const r = await fetch(site.url, {
    headers: { "User-Agent": site.mobile ? UA_MOBILE : UA, "Accept-Language": "ko-KR,ko;q=0.9", Accept: "text/html" },
    signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) throw new Error(`${site.name} HTTP ${r.status}`);
  const html = await r.text();
  const items = site.parse(cheerio.load(html)).filter((p) => p.title && p.url);
  if (!items.length) throw new Error(`${site.name}: 글을 하나도 못 읽음 (화면 구조가 바뀌었을 수 있음)`);
  return items;
}

// 새로 읽은 목록 + 지난번 저장분 → 조회수 오름 속도(시간당) 계산해서 합치기
const KEEP_HOURS = 48;
const MAX_ITEMS = 300;
function mergeItems(prevItems, fresh, now = Date.now()) {
  const byId = new Map((prevItems || []).map((p) => [p.id, p]));
  fresh.forEach((p, i) => {
    const old = byId.get(p.id);
    const item = { ...(old || {}), ...p, listRank: i + 1, lastSeen: now };
    if (!old) {
      item.firstSeen = now;
      const born = p.postedAt ? Date.parse(p.postedAt) : now;
      const ageH = Math.max((now - born) / 3600000, 0.25);
      item.rate = p.views != null ? Math.round(p.views / ageH) : null;
    } else if (p.views != null && old.views != null && old.lastSeen && now > old.lastSeen) {
      const gainH = Math.max(p.views - old.views, 0) / ((now - old.lastSeen) / 3600000);
      item.rate = Math.round(old.rate != null ? old.rate * 0.4 + gainH * 0.6 : gainH);
    }
    byId.set(p.id, item);
  });
  const cutoff = now - KEEP_HOURS * 3600000;
  return [...byId.values()]
    .filter((p) => (p.postedAt ? Date.parse(p.postedAt) : p.firstSeen) >= cutoff)
    .sort((a, b) => b.lastSeen - a.lastSeen)
    .slice(0, MAX_ITEMS);
}

// Google 트렌드 한국 실시간 검색어 (공식 RSS)
async function fetchKeywords() {
  const r = await fetch("https://trends.google.com/trending/rss?geo=KR", {
    headers: { "User-Agent": UA }, signal: AbortSignal.timeout(15000),
  });
  if (!r.ok) throw new Error(`Google Trends HTTP ${r.status}`);
  const $ = cheerio.load(await r.text(), { xmlMode: true });
  return $("item").slice(0, 10).map((i, it) => {
    const $it = $(it);
    const news = $it.find("ht\\:news_item").first();
    return {
      rank: i + 1,
      keyword: clean($it.children("title").text()),
      traffic: clean($it.find("ht\\:approx_traffic").text()) || null,
      newsTitle: clean(news.find("ht\\:news_item_title").text()) || null,
      newsUrl: clean(news.find("ht\\:news_item_url").text()) || null,
    };
  }).get();
}

module.exports = { SITES, fetchSite, mergeItems, fetchKeywords, kstToIso };
