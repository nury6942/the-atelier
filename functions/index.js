const { setGlobalOptions } = require("firebase-functions");
const { onRequest } = require("firebase-functions/https");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");

setGlobalOptions({ maxInstances: 10, region: "us-central1" });

// Secrets (set via: firebase functions:secrets:set <NAME>)
const anthropicApiKey = defineSecret("ANTHROPIC_API_KEY");
const atelierAuthToken = defineSecret("ATELIER_AUTH_TOKEN");

// CORS helper
function corsHeaders(res) {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.set("Access-Control-Allow-Headers", "Content-Type, X-Atelier-Token");
}

// ── Coach Analyze: Claude API proxy ──
exports.coachAnalyze = onRequest(
  { secrets: [anthropicApiKey, atelierAuthToken], cors: true, invoker: "public", memory: "256MiB", timeoutSeconds: 60 },
  async (req, res) => {
    corsHeaders(res);
    if (req.method === "OPTIONS") return res.status(204).send("");
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    // Token auth
    const token = req.headers["x-atelier-token"];
    if (!token || token !== atelierAuthToken.value()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    try {
      const { prompt, systemPrompt, maxTokens, model } = req.body;
      if (!prompt) return res.status(400).json({ error: "prompt required" });

      const Anthropic = require("@anthropic-ai/sdk");
      const anthropic = new Anthropic({ apiKey: anthropicApiKey.value() });

      const message = await anthropic.messages.create({
        model: model || "claude-haiku-4-5",
        max_tokens: maxTokens || 1500,
        system: systemPrompt || "당신은 차분하고 직설적인 한국어 재무 코치입니다. 줄글이 아닌 구체적인 숫자와 액션 위주로 답변하세요.",
        messages: [{ role: "user", content: prompt }],
      });

      logger.info("Coach analyze success", {
        inputTokens: message.usage.input_tokens,
        outputTokens: message.usage.output_tokens,
      });

      return res.status(200).json({
        success: true,
        content: message.content[0].text,
        usage: {
          input_tokens: message.usage.input_tokens,
          output_tokens: message.usage.output_tokens,
        },
      });
    } catch (error) {
      logger.error("Coach analyze error:", error);
      return res.status(500).json({
        error: "Internal server error",
        message: error.message,
      });
    }
  }
);

// ── Health check / ping ──
exports.coachPing = onRequest(
  { secrets: [anthropicApiKey, atelierAuthToken], cors: true, invoker: "public" },
  (req, res) => {
    corsHeaders(res);
    if (req.method === "OPTIONS") return res.status(204).send("");

    // Optional token check for authenticated ping
    const token = req.headers["x-atelier-token"];
    const authOk = token && token === atelierAuthToken.value();

    res.status(200).json({
      status: "ok",
      timestamp: new Date().toISOString(),
      hasApiKey: !!anthropicApiKey.value(),
      hasAuthToken: !!atelierAuthToken.value(),
      authenticated: authOk,
    });
  }
);

// ══════════════════════════════════════════════════════════════════════
//  ★ (2026-07-24) 항공권 시세 프록시 — Travelpayouts Data API
//    가격을 주는 API 중 CORS를 허용하는 곳이 하나도 없어(실측: Travelpayouts·
//    Kiwi·Duffel 전부 헤더 없음) 정적 사이트에서 직접 호출이 불가능하다.
//    → 이 함수가 중계하고, 토큰은 서버 시크릿으로만 둔다(브라우저에 노출 안 됨).
//
//    mode 3종:
//      cheapest : 특정 구간의 현재 최저가 (prices_for_dates)
//      month    : 월별 날짜별 최저가 그리드 (grouped_prices, group_by=departure_at)
//      anywhere : 출발지 기준 아무 데나 싼 목적지 (v1/prices/cheap)
// ══════════════════════════════════════════════════════════════════════
const travelpayoutsToken = defineSecret("TRAVELPAYOUTS_TOKEN");

const TP_IATA = /^[A-Z]{3}$/;

exports.flightPrices = onRequest(
  { secrets: [travelpayoutsToken, atelierAuthToken], cors: true, invoker: "public", memory: "256MiB", timeoutSeconds: 90 },
  async (req, res) => {
    corsHeaders(res);
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    if (req.method === "OPTIONS") return res.status(204).send("");

    const token = req.headers["x-atelier-token"];
    if (!token || token !== atelierAuthToken.value()) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const q = Object.assign({}, req.query, req.body || {});
    const mode = String(q.mode || "cheapest");
    const origin = String(q.origin || "").toUpperCase().trim();
    const destination = String(q.destination || "").toUpperCase().trim();
    const currency = String(q.currency || "krw").toLowerCase();

    if (!TP_IATA.test(origin)) return res.status(400).json({ error: "origin은 IATA 3글자여야 해 (예: ICN)" });
    if (mode !== "anywhere" && !TP_IATA.test(destination)) {
      return res.status(400).json({ error: "destination은 IATA 3글자여야 해 (예: FRA)" });
    }

    // ── mode=year : 12개월 각각의 최저가를 한 번에 (서버에서 병렬 조회) ──
    if (mode === "year") {
      const startRaw = String(q.start || "");
      const sm = /^(\d{4})-(\d{2})/.exec(startRaw);
      if (!sm) return res.status(400).json({ error: "start는 YYYY-MM 형식이어야 해" });
      const months = [];
      let y = parseInt(sm[1], 10), mo = parseInt(sm[2], 10);
      for (let i = 0; i < 12; i++) {
        months.push(`${y}-${String(mo).padStart(2, "0")}`);
        mo++; if (mo > 12) { mo = 1; y++; }
      }
      try {
        const results = await Promise.all(months.map(async (ym) => {
          const u = "https://api.travelpayouts.com/aviasales/v3/grouped_prices?" + new URLSearchParams({
            origin, destination, departure_at: ym, group_by: "departure_at",
            currency, market: "kr", token: travelpayoutsToken.value(),
          });
          try {
            const r = await fetch(u, { headers: { "Accept-Encoding": "gzip" } });
            if (!r.ok) return { month: ym, price: null, days: 0 };
            const j = await r.json();
            const rows = (j && j.data) || {};
            let best = null, days = 0;
            Object.keys(rows).forEach((k) => {
              const v = rows[k] || {};
              const pr = Number(v.price) || 0;
              if (!pr) return;
              days++;
              if (!best || pr < best.price) best = { price: pr, date: String(v.departure_at || k).slice(0, 10), airline: v.airline || "", transfers: v.transfers };
            });
            return { month: ym, price: best ? best.price : null, date: best ? best.date : "", airline: best ? best.airline : "", transfers: best ? best.transfers : null, days };
          } catch (e) { return { month: ym, price: null, days: 0 }; }
        }));
        return res.status(200).json({ mode, origin, destination, currency, fetched_at: new Date().toISOString(), data: results });
      } catch (error) {
        logger.error("flightPrices year error:", error);
        return res.status(500).json({ error: "Internal server error", message: error.message });
      }
    }

    let url;
    if (mode === "month") {
      // YYYY-MM 또는 YYYY-MM-DD 허용 → API는 YYYY-MM-DD 기대
      const raw = String(q.month || "");
      const m = /^(\d{4})-(\d{2})/.exec(raw);
      if (!m) return res.status(400).json({ error: "month는 YYYY-MM 형식이어야 해 (예: 2027-05)" });
      const depart = `${m[1]}-${m[2]}-01`;
      url = "https://api.travelpayouts.com/aviasales/v3/grouped_prices?" + new URLSearchParams({
        origin, destination, departure_at: `${m[1]}-${m[2]}`, group_by: "departure_at",
        currency, market: "kr", token: travelpayoutsToken.value(),
      });
      logger.info("flightPrices month", { origin, destination, depart });
    } else if (mode === "anywhere") {
      url = "https://api.travelpayouts.com/v1/prices/cheap?" + new URLSearchParams({
        origin, currency, token: travelpayoutsToken.value(),
      });
    } else {
      const params = { origin, destination, currency, market: "kr", sorting: "price", limit: "30",
        one_way: String(q.one_way === "true" || q.one_way === true), token: travelpayoutsToken.value() };
      if (q.depart_date) params.departure_at = String(q.depart_date);
      if (q.return_date) params.return_at = String(q.return_date);
      url = "https://api.travelpayouts.com/aviasales/v3/prices_for_dates?" + new URLSearchParams(params);
    }

    try {
      const r = await fetch(url, { headers: { "Accept-Encoding": "gzip" } });
      const text = await r.text();
      if (!r.ok) {
        logger.warn("Travelpayouts error", { status: r.status, body: text.slice(0, 200) });
        return res.status(502).json({ error: "시세 조회 실패", status: r.status, detail: text.slice(0, 200) });
      }
      let data;
      try { data = JSON.parse(text); }
      catch (e) { return res.status(502).json({ error: "응답 파싱 실패", detail: text.slice(0, 200) }); }
      return res.status(200).json({ mode, origin, destination, currency, fetched_at: new Date().toISOString(), data });
    } catch (error) {
      logger.error("flightPrices error:", error);
      return res.status(500).json({ error: "Internal server error", message: error.message });
    }
  }
);

// ══════════════════════════════════════════════════════════════════════
//  ★ (2026-07-24) 항공권 시세 자동 수집 — 매일 1회
//    버튼을 눌러야 기록이 쌓이니, 안 누르면 데이터가 없고 데이터가 없으면
//    "지금 사/기다려" 판정도 못 하는 닭-달걀 문제가 있었다. 서버가 대신 모은다.
//
//    · 월별 그리드는 날짜별 가격이라 촘촘한 데이터가 필요하지만, 여기선
//      "오늘 기준 이 노선 최저가" 하나만 받는다 → 하루 한 점, 30일이면 추이선 완성.
//      (실측: 월별 0건이던 ICN→AKL도 cheapest로는 6건 조회됨)
//    · 같은 날 이미 수집한 노선은 건너뛴다(중복 방지).
//    · Cloud Scheduler 무료 3잡 범위 — 추가 비용 없음.
// ══════════════════════════════════════════════════════════════════════
const { onSchedule } = require("firebase-functions/scheduler");
const admin = require("firebase-admin");
if (!admin.apps.length) admin.initializeApp();

// 유류할증료 구간 판정용 최소 공항 좌표 (거리만 필요)
const CRON_AIRPORTS = {
  ICN:[37.4602,126.4407], GMP:[37.5583,126.7906], PUS:[35.1795,128.9382],
  NRT:[35.7720,140.3929], HND:[35.5494,139.7798], KIX:[34.4347,135.2440], FUK:[33.5859,130.4510],
  PEK:[40.0799,116.6031], PVG:[31.1443,121.8083], HKG:[22.3080,113.9185], TPE:[25.0777,121.2328],
  BKK:[13.6900,100.7501], SIN:[1.3644,103.9915], SGN:[10.8188,106.6520], DPS:[-8.7482,115.1675],
  FRA:[50.0379,8.5622], MUC:[48.3537,11.7750], BER:[52.3667,13.5033], CDG:[49.0097,2.5479],
  LHR:[51.4700,-0.4543], FCO:[41.8003,12.2389], MXP:[45.6301,8.7255], BCN:[41.2974,2.0833],
  MAD:[40.4719,-3.5626], AMS:[52.3105,4.7683], ZRH:[47.4647,8.5492], VIE:[48.1103,16.5697],
  CPH:[55.6180,12.6560], ARN:[59.6519,17.9186], OSL:[60.1939,11.1004], HEL:[60.3172,24.9633],
  KEF:[63.9850,-22.6056], DUB:[53.4213,-6.2701], LIS:[38.7742,-9.1342], IST:[41.2753,28.7519],
  DXB:[25.2532,55.3657], DOH:[25.2731,51.6081],
  JFK:[40.6413,-73.7781], EWR:[40.6895,-74.1745], LAX:[33.9416,-118.4085], SFO:[37.6213,-122.3790],
  SEA:[47.4502,-122.3088], ORD:[41.9742,-87.9073], YVR:[49.1967,-123.1815], YYZ:[43.6777,-79.6248],
  YUL:[45.4706,-73.7408], SYD:[-33.9399,151.1753], MEL:[-37.6690,144.8410], AKL:[-37.0082,174.7850],
};
function cronKm(a, b) {
  const pa = CRON_AIRPORTS[a], pb = CRON_AIRPORTS[b];
  if (!pa || !pb) return 0;
  const R = 6371, t = (d) => d * Math.PI / 180;
  const dLat = t(pb[0] - pa[0]), dLng = t(pb[1] - pa[1]);
  const h = Math.sin(dLat/2)**2 + Math.cos(t(pa[0])) * Math.cos(t(pb[0])) * Math.sin(dLng/2)**2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

async function collectFlightPrices() {
    const db = admin.firestore();
    const today = new Date().toISOString().slice(0, 10);

    const snap = await db.collection("flight_watch").get();
    const docs = snap.docs.map((d) => ({ _id: d.id, ...d.data() }));
    const watches = docs.filter((d) => d.type === "watch" && d.route_from && d.route_to);
    if (!watches.length) { logger.info("flightPriceCron: 관심 노선 없음"); return { watches: 0, saved: 0, skipped: 0, empty: 0 }; }

    // 유류할증료(최신 1건)
    const fuelDoc = docs.filter((d) => d.type === "fuel" && Array.isArray(d.rows))
      .sort((a, b) => String(b.month || "").localeCompare(String(a.month || "")))[0];
    const fuelFor = (from, to) => {
      if (!fuelDoc) return 0;
      const km = cronKm(String(from).toUpperCase(), String(to).toUpperCase());
      if (!km) return 0;
      const i = km < 1500 ? 0 : km < 2500 ? 1 : km < 5000 ? 2 : km < 9500 ? 3 : 4;
      const r = fuelDoc.rows[Math.min(i, fuelDoc.rows.length - 1)];
      return r ? Number(r.krw) || 0 : 0;
    };

    let saved = 0, skipped = 0, empty = 0;
    for (const w of watches) {
      // 같은 날 이미 수집했으면 건너뛴다
      const dup = docs.some((d) => d.type === "flight_price" && d.watch_id === w._id &&
        String(d.ts || "").slice(0, 10) === today && d.source === "자동 수집");
      if (dup) { skipped++; continue; }

      const params = {
        origin: String(w.route_from).toUpperCase(), destination: String(w.route_to).toUpperCase(),
        currency: "krw", market: "kr", sorting: "price", limit: "30",
        one_way: String(!w.return_date), token: travelpayoutsToken.value(),
      };
      if (w.depart_date) params.departure_at = String(w.depart_date);
      if (w.return_date) params.return_at = String(w.return_date);

      try {
        const r = await fetch("https://api.travelpayouts.com/aviasales/v3/prices_for_dates?" + new URLSearchParams(params));
        if (!r.ok) { logger.warn("cron fetch fail", { w: w._id, status: r.status }); continue; }
        const j = await r.json();
        const arr = (j && j.data) || [];
        if (!arr.length) { empty++; continue; }
        const best = arr.reduce((a, b) => (Number(b.price) < Number(a.price) ? b : a));
        const fare = Math.round(Number(best.price) || 0);
        if (!fare) { empty++; continue; }
        const fuel = fuelFor(w.route_from, w.route_to);

        await db.collection("flight_watch").add({
          type: "flight_price", watch_id: w._id, price_krw: fare,
          fuel_krw: fuel * (w.return_date ? 2 : 1),
          source: "자동 수집",
          airline: best.airline || "", flight_no: best.flight_number || "",
          transfers: (typeof best.transfers === "number") ? best.transfers : null,
          depart_on: best.departure_at ? String(best.departure_at).slice(0, 10) : "",
          return_on: best.return_at ? String(best.return_at).slice(0, 10) : "",
          note: "",
          ts: new Date().toISOString(),
        });
        saved++;
      } catch (e) {
        logger.error("cron error", { w: w._id, msg: e.message });
      }
      await new Promise((res) => setTimeout(res, 400)); // 레이트 리밋 여유
    }
    logger.info("flightPriceCron 완료", { watches: watches.length, saved, skipped, empty });
    return { watches: watches.length, saved, skipped, empty };
}

exports.flightPriceCron = onSchedule(
  { schedule: "0 6 * * *", timeZone: "Asia/Seoul", secrets: [travelpayoutsToken], memory: "256MiB", timeoutSeconds: 300 },
  async () => { await collectFlightPrices(); }
);

// 같은 수집을 버튼으로도 — 크론을 기다리지 않고 지금 채우고 싶을 때
exports.flightPriceCollectNow = onRequest(
  { secrets: [travelpayoutsToken, atelierAuthToken], cors: true, invoker: "public", memory: "256MiB", timeoutSeconds: 300 },
  async (req, res) => {
    corsHeaders(res);
    res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    if (req.method === "OPTIONS") return res.status(204).send("");
    const token = req.headers["x-atelier-token"];
    if (!token || token !== atelierAuthToken.value()) return res.status(401).json({ error: "Unauthorized" });
    try {
      const r = await collectFlightPrices();
      return res.status(200).json({ ok: true, ...r });
    } catch (e) {
      logger.error("collectNow error", e);
      return res.status(500).json({ error: e.message });
    }
  }
);

// ══════════════════════════════════════════════════════════════════════
//  ★ (2026-07-24) 유류할증료 월 1회 자동 감지
//    대한항공 공지는 봇 차단(403)이라 직접 못 읽는다. 공개 기사에서 후보값을 뽑되
//    ★ 자동으로 덮어쓰지 않는다 — 잘못 파싱된 금액이 조용히 들어가면 더 위험하다.
//    'fuel_pending'으로 저장해두고, 앱에서 사용자가 확인 후 [적용]을 눌러야 반영된다.
// ══════════════════════════════════════════════════════════════════════
exports.fuelSurchargeCron = onSchedule(
  { schedule: "0 9 17 * *", timeZone: "Asia/Seoul", memory: "256MiB", timeoutSeconds: 120 },
  async () => {
    const db = admin.firestore();
    const now = new Date();
    // 매월 17일 실행 → 다음 달 발권분이 대상
    const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const targetMonth = next.getFullYear() + "-" + String(next.getMonth() + 1).padStart(2, "0");

    const exist = await db.collection("flight_watch")
      .where("type", "==", "fuel").where("month", "==", targetMonth).limit(1).get();
    if (!exist.empty) { logger.info("fuelSurchargeCron: 이미 적용됨", { targetMonth }); return; }

    let html = "";
    try {
      const r = await fetch("https://airtravelinfo.kr/info_etc/1752705", {
        headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" },
      });
      if (r.ok) html = await r.text();
    } catch (e) { logger.warn("fuel fetch fail", e.message); }

    // 후보 추출: 3만5200원 / 35,200원 형태 모두 허용
    const amounts = [];
    const text = html.replace(/<[^>]+>/g, " ");
    const re = /(\d{1,3}(?:,\d{3})+|\d+만\s?\d{0,4})\s*원/g;
    let m;
    while ((m = re.exec(text))) {
      let raw = m[1];
      let v = raw.includes("만")
        ? (parseInt(raw, 10) * 10000 + (parseInt(raw.split("만")[1] || "0", 10) || 0))
        : parseInt(raw.replace(/,/g, ""), 10);
      if (v >= 20000 && v <= 600000) amounts.push(v);
    }
    const uniq = [...new Set(amounts)].sort((a, b) => a - b);
    const stepM = text.match(/(\d{1,2})\s*단계/);

    const pending = {
      type: "fuel_pending", month: targetMonth,
      step: stepM ? stepM[1] + "단계" : "",
      candidates: uniq.slice(0, 12),
      parsed_ok: uniq.length >= 3,
      source: "https://airtravelinfo.kr/",
      detected_at: new Date().toISOString(),
    };
    const prev = await db.collection("flight_watch")
      .where("type", "==", "fuel_pending").where("month", "==", targetMonth).limit(1).get();
    if (prev.empty) await db.collection("flight_watch").add(pending);
    else await prev.docs[0].ref.update(pending);

    logger.info("fuelSurchargeCron 완료", { targetMonth, found: uniq.length, step: pending.step });
  }
);
