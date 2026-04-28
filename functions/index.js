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
      const { prompt, systemPrompt, maxTokens } = req.body;
      if (!prompt) return res.status(400).json({ error: "prompt required" });

      const Anthropic = require("@anthropic-ai/sdk");
      const anthropic = new Anthropic({ apiKey: anthropicApiKey.value() });

      const message = await anthropic.messages.create({
        model: "claude-sonnet-4-20250514",
        max_tokens: maxTokens || 2000,
        system: systemPrompt || "당신은 차분하고 직설적인 재무 코치입니다.",
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
