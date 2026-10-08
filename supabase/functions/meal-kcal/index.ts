// 减脂打卡 App：用 Claude 估算一顿饭的热量
// 部署步骤见 docs/ai-setup.md。在 Supabase 控制台 → Edge Functions → Secrets 里设置：
//   ANTHROPIC_API_KEY     Anthropic 官方 Key（x-api-key 方式）；用中转服务时填中转给的 Key
//   ANTHROPIC_AUTH_TOKEN  （可选）中转服务要求 "Authorization: Bearer" 时用这个代替上一项
//   ANTHROPIC_BASE_URL    （可选）中转或兼容接口地址，需兼容 Anthropic Messages API，例如 https://api.deepseek.com/anthropic
//   AI_MODEL              （可选）模型名，默认 claude-opus-5-5；中转服务的模型名不同时在这里改
//   AI_USER_AGENT         （可选）中转要求特定 User-Agent 时填（例如米醋国产模型分组要求浏览器型 UA）
// SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY 由 Supabase 自动提供。
import Anthropic from "npm:@anthropic-ai/sdk";
import { createClient } from "npm:@supabase/supabase-js@2";

const DAILY_LIMIT = 60; // 每个家庭每天最多调用次数，防止被滥用
const ALLOWED_ORIGINS = ["https://lcy1021.github.io", "http://127.0.0.1:8765", "http://localhost:8765"];

const SYSTEM = `你是营养估算助手。用户会用中文描述一顿饭吃了什么，你要估算每样食物的热量。
规则：
- 数值参考《中国食物成分表》第6版的常见值；外卖和餐馆菜按国内常见一份的分量和做法估算（通常比家常菜油多）。
- 用户没说份量时，按一份/一个/一碗的常见分量估算，并在 amount 里写出你假设的分量。
- 描述里提到的每样食物都要列出，调味和做菜用油算进对应的菜里，不单独列。
- name 用简短中文（10 个字以内），amount 用中文写份量（如"1 碗约 200g""半份"），kcal 取整到 5。
- 描述里没有可以吃的东西时，items 返回空数组，并在 note 里说明。
- note 用一句话提醒最不确定的地方；没有就留空字符串。`;

const SCHEMA = {
  type: "object",
  properties: {
    items: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          amount: { type: "string" },
          kcal: { type: "integer" },
        },
        required: ["name", "amount", "kcal"],
        additionalProperties: false,
      },
    },
    note: { type: "string" },
  },
  required: ["items", "note"],
  additionalProperties: false,
};

const BASE_URL = Deno.env.get("ANTHROPIC_BASE_URL") || undefined;
// 米醋 vip_4 不提供 Claude 通道；未显式设 AI_MODEL 时选该分组可用的国产模型。
const MODEL = Deno.env.get("AI_MODEL") || (BASE_URL?.includes("micuapi.ai") ? "deepseek-v4-pro" : "claude-opus-5-5");
const RELAY = !!BASE_URL; // 走中转时只用最基础的请求参数，兼容性更好
const anthropic = new Anthropic({
  apiKey: Deno.env.get("ANTHROPIC_API_KEY") || null,
  authToken: Deno.env.get("ANTHROPIC_AUTH_TOKEN") || null,
  baseURL: BASE_URL,
  defaultHeaders: Deno.env.get("AI_USER_AGENT") ? { "User-Agent": Deno.env.get("AI_USER_AGENT")! } : undefined,
});

const JSON_ONLY = `\n只输出一个 JSON 对象，不要输出任何其他文字或代码块标记，格式：{"items":[{"name":"米饭","amount":"1 碗约 200g","kcal":230}],"note":""}`;

type Item = { name: unknown; amount: unknown; kcal: unknown };
type Result = { items: Item[]; note?: unknown } | null;
const firstText = (content: Array<{ type: string; text?: string }>) => content.find((b) => b.type === "text")?.text ?? "";
/* 从文字里取出第一个 JSON 对象（中转不支持结构化输出时用） */
function pickJson(text: string): Result {
  const a = text.indexOf("{"), b = text.lastIndexOf("}");
  if (a < 0 || b <= a) return null;
  try { return JSON.parse(text.slice(a, b + 1)); } catch { return null; }
}

async function estimate(text: string): Promise<Result | "refused"> {
  if (!RELAY) {
    // 官方接口：结构化输出 + 被拒时自动换模型
    const r = await anthropic.beta.messages.create({
      model: MODEL,
      max_tokens: 4000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      output_config: { effort: "low", format: { type: "json_schema", schema: SCHEMA } },
      system: SYSTEM,
      messages: [{ role: "user", content: text }],
    });
    if (r.stop_reason === "refusal") return "refused";
    return JSON.parse(firstText(r.content));
  }
  // 中转或其他兼容接口（如 DeepSeek）：大多不支持结构化输出，直接在提示词里要求只输出 JSON，只请求一次（省掉被拒后再请求的时间）
  const r = await anthropic.messages.create({
    model: MODEL,
    max_tokens: 1024,
    system: SYSTEM + JSON_ONLY,
    messages: [{ role: "user", content: text }],
  });
  if (r.stop_reason === "refusal") return "refused";
  return pickJson(firstText(r.content));
}
const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

function cors(origin: string | null) {
  return {
    "Access-Control-Allow-Origin": origin && ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

Deno.serve(async (req) => {
  const headers = { ...cors(req.headers.get("origin")), "Content-Type": "application/json" };
  const reply = (status: number, body: unknown) => new Response(JSON.stringify(body), { status, headers });
  if (req.method === "OPTIONS") return new Response(null, { headers });
  if (req.method !== "POST") return reply(405, { error: "method" });

  let family = "", text = "";
  try {
    const body = await req.json();
    family = String(body.family ?? "");
    text = String(body.text ?? "").trim();
  } catch {
    return reply(400, { error: "bad_json" });
  }
  if (!/^[A-Za-z0-9]{8,40}$/.test(family)) return reply(400, { error: "bad_family" });
  if (!text || text.length > 200) return reply(400, { error: "bad_text" });

  const bearer = (req.headers.get("authorization") || "").replace(/^Bearer /i, "");
  let privateMember = false;
  if (bearer && bearer !== req.headers.get("apikey")) {
    const auth = await db.auth.getUser(bearer);
    if (auth.error || !auth.data.user) return reply(401, { error: "invalid_session" });
    const member = await db.from("fl_members").select("family").eq("user_id", auth.data.user.id).maybeSingle();
    if (member.error || member.data?.family !== family) return reply(403, { error: "wrong_family" });
    privateMember = true;
  }
  if (!privateMember) {
    // Legacy clients require an existing family record.
    const [c, m] = await Promise.all([
      db.from("checkins").select("id").eq("family", family).limit(1),
      db.from("measures").select("id").eq("family", family).limit(1),
    ]);
    if (c.error || m.error) return reply(500, { error: "family_check_failed" });
    if (!(c.data?.length || m.data?.length)) return reply(403, { error: "unknown_family" });
  }

  const quota = await db.rpc("fl_ai_quota", { p_family: family, p_limit: DAILY_LIMIT });
  if (quota.error) return reply(500, { error: "quota_check_failed" });
  if (quota.data !== true) return reply(429, { error: "daily_limit" });

  try {
    const t0 = Date.now();
    const out = await estimate(text);
    console.log("estimate", MODEL, `${Date.now() - t0}ms`, `${text.length} chars`);
    if (out === "refused") return reply(422, { error: "refused" });
    if (!out) return reply(502, { error: "no_output" });
    const items = (Array.isArray(out.items) ? out.items : []).slice(0, 20).map((i: Item) => ({
      name: String(i.name).slice(0, 20),
      amount: String(i.amount).slice(0, 30),
      kcal: Math.max(0, Math.min(3000, Math.round(Number(i.kcal) / 5) * 5 || 0)),
    }));
    return reply(200, { items, note: String(out.note ?? "").slice(0, 100) });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) return reply(429, { error: "busy" });
    if (err instanceof Anthropic.AuthenticationError) return reply(502, { error: "bad_key" });
    if (err instanceof Anthropic.APIConnectionError) return reply(502, { error: "unreachable" });
    if (err instanceof Anthropic.APIError) {
      // 把上游（官方或中转）的报错原因简短带回来，方便排查；不含 Key
      const detail = String(err.message ?? "").replace(/sk-[A-Za-z0-9_-]+/g, "sk-***").slice(0, 300);
      console.error("upstream error", err.status, detail);
      if (/model_not_found|No available channel/i.test(detail)) {
        return reply(502, { error: "model_unavailable", model: MODEL });
      }
      return reply(502, { error: "upstream", status: err.status, detail, model: MODEL });
    }
    console.error("internal error", err);
    return reply(500, { error: "internal", detail: String(err).slice(0, 200) });
  }
});
