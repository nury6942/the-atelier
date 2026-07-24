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
  { secrets: [travelpayoutsToken, atelierAuthToken], cors: true, invoker: "public", memory: "256MiB", timeoutSeconds: 30 },
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
