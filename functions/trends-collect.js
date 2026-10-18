// ══════════════════════════════════════════════════════════════════════
// 한국 커뮤니티 인기글 — 원본 사이트에서 직접 목록 1페이지만 읽기
//   사이트마다 화면 구조가 달라서 SITES[키].parse 를 하나씩 둠.
//   어느 사이트가 화면을 바꾸면 그 사이트의 parse 만 고치면 됨.
//   본문은 읽지 않음(제목·주소·조회·댓글·추천·시간만).
// ══════════════════════════════════════════════════════════════════════
const cheerio = require("cheerio");

const UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36";

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
  theqoo: {
    name: "더쿠",
    url: "https://theqoo.net/hot",
    parse($) {
      const out = [];
      $("table.theqoo_board_table tbody tr, table tbody tr").each((_, tr) => {
        const $tr = $(tr);
        if ($tr.hasClass("notice") || !$tr.find("td.no").length) return;
        if (!/^\d+$/.test(clean($tr.find("td.no").text()))) return; // 공지는 번호 대신 아이콘
        const a = $tr.find("td.title a").not(".replyNum").first();
        const id = (a.attr("href") || "").match(/\/hot\/(\d+)/);
        if (!id) return;
        out.push({
          id: id[1],
          title: clean(a.text()),
          url: "https://theqoo.net/hot/" + id[1],
          category: clean($tr.find("td.cate").text()) || null,
          comments: toNum($tr.find("a.replyNum").text()),
          views: toNum($tr.find("td.m_no").text()),
          upvotes: null,
          postedAt: kstToIso($tr.find("td.time").text()),
        });
      });
      return out;
    },
  },

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

  "82cook": {
    name: "82쿡",
    url: "https://www.82cook.com/entiz/enti.php?bn=15",
    parse($) {
      const out = [];
      // ① 왼쪽 '최근 많이 읽은 글' — 조회수는 없지만 사이트가 고른 인기글
      const hot = new Map();
      $("h2.mostBtn").parent().find("li a[href*='read.php?num=']").each((i, a) => {
        const id = ($(a).attr("href") || "").match(/num=(\d+)/);
        if (id) hot.set(id[1], { rank: i + 1, title: clean($(a).attr("title") || $(a).text()) });
      });
      // ② 자유게시판 최신 목록 — 조회수·댓글 있음
      $("td.title a[href*='num=']").each((_, a) => {
        const $tr = $(a).closest("tr");
        const id = ($(a).attr("href") || "").match(/num=(\d+)/);
        if (!id) return;
        const nums = $tr.find("td.numbers");
        out.push({
          id: id[1],
          title: clean($(a).text()),
          url: "https://www.82cook.com/entiz/read.php?bn=15&num=" + id[1],
          category: "자유게시판",
          comments: toNum($tr.find("td.title em").text()),
          views: toNum($(nums[nums.length - 1]).text()),
          upvotes: null,
          postedAt: kstToIso($tr.find("td.regdate").attr("title") || $tr.find("td.regdate").text()),
          hotRank: hot.has(id[1]) ? hot.get(id[1]).rank : null,
        });
        hot.delete(id[1]);
      });
      for (const [id, h] of hot) {
        out.push({
          id, title: h.title, url: "https://www.82cook.com/entiz/read.php?bn=15&num=" + id,
          category: "많이 읽은 글", comments: null, views: null, upvotes: null, postedAt: null, hotRank: h.rank,
        });
      }
      return out;
    },
  },

  dcbest: {
    name: "디시",
    url: "https://gall.dcinside.com/board/lists/?id=dcbest",
    parse($) {
      const out = [];
      $("tr.ub-content.us-post").each((_, tr) => {
        const $tr = $(tr);
        const no = $tr.attr("data-no");
        if (!no || !/^\d+$/.test(clean($tr.find("td.gall_num").text()))) return;
        const a = $tr.find("td.gall_tit a").first();
        const gall = clean(a.find("strong").first().text()).replace(/[[\]]/g, "") || null;
        a.find("strong, em, div").remove();
        out.push({
          id: no,
          title: clean(a.text()),
          url: "https://gall.dcinside.com/board/view/?id=dcbest&no=" + no,
          category: gall,
          comments: toNum($tr.find(".reply_num").text()),
          views: toNum($tr.find("td.gall_count").text()),
          upvotes: toNum($tr.find("td.gall_recommend").text()),
          postedAt: kstToIso($tr.find("td.gall_date").attr("title") || $tr.find("td.gall_date").text()),
        });
      });
      return out;
    },
  },

  ruliweb: {
    name: "루리웹",
    url: "https://bbs.ruliweb.com/best/humor_only",
    parse($) {
      const out = [];
      $("tr.table_body").each((_, tr) => {
        const $tr = $(tr);
        if ($tr.hasClass("notice") || $tr.hasClass("best")) return;
        const a = $tr.find("a.subject_link").first();
        const href = a.attr("href") || "";
        const id = href.match(/read\/(\d+)/);
        if (!id) return;
        $tr.find("td.time input").remove();
        out.push({
          id: id[1],
          title: clean(a.find(".text_over").first().text() || a.text()),
          url: href.startsWith("http") ? href.split("?")[0] : "https://bbs.ruliweb.com" + href.split("?")[0],
          category: "유머 베스트",
          comments: toNum(a.find(".num_reply").text()),
          views: toNum($tr.find("td.hit").text()),
          upvotes: toNum($tr.find("td.recomd").text()),
          postedAt: kstToIso($tr.find("td.time").text()),
        });
      });
      return out;
    },
  },

  clien: {
    name: "클량",
    url: "https://www.clien.net/service/board/park",
    parse($) {
      const out = [];
      $("div.list_item.symph_row").each((_, row) => {
        const $r = $(row);
        if ($r.hasClass("notice")) return;
        const sn = $r.attr("data-board-sn");
        if (!sn) return;
        out.push({
          id: sn,
          title: clean($r.find("[data-role=list-title-text]").attr("title") || $r.find(".list_subject").text()),
          url: "https://www.clien.net/service/board/park/" + sn,
          category: "모두의공원",
          comments: toNum($r.attr("data-comment-count")),
          views: toNum($r.find(".list_hit .hit").text()),
          upvotes: toNum($r.find("[data-role=list-like-count]").text()),
          postedAt: kstToIso($r.find(".timestamp").text()),
        });
      });
      return out;
    },
  },
};

async function fetchSite(key) {
  const site = SITES[key];
  const r = await fetch(site.url, {
    headers: { "User-Agent": UA, "Accept-Language": "ko-KR,ko;q=0.9", Accept: "text/html" },
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
